# Future features — where queues fit

**Status:** Reference doc. Not planned for any specific session yet.
**Captured:** 2026-05-05

> Today's architecture uses **file IPC** for DO ↔ agent communication (`/app/next-prompt.json`, `/app/refs.json`). This works because we have exactly one writer and one reader per user — see `cloudflare/sandbox/agent-runner.ts` + `cloudflare/src/durable-objects/campaign-session.ts` for the current pattern.
>
> File IPC breaks down for: parallel work, scheduled work, retry-required delivery, and N-producer/N-consumer patterns. This doc captures the future product features that would force the jump to a real queue (likely **Cloudflare Queues**, since it lives next door to our existing Workers + DOs infra).

---

## Triggering rule of thumb

| Pattern | Right tool |
|---|---|
| 1 producer, 1 consumer, simple message | File IPC (today's pattern) |
| N producers, 1 consumer, ordered, retries | **Queue** (Cloudflare Queues, SQS) |
| N producers, N consumers, low-latency | Pub/Sub (Cloudflare Pub/Sub, NATS) |
| Real-time bidirectional, persistent connection | WebSockets (already used client↔DO) |
| Async fan-out + aggregation | Queue + workflow orchestrator (Temporal, Inngest) |

If a feature requires concurrency, scheduling, or fault-tolerant async delivery, files won't cut it — reach for a queue.

---

## The three highest-value queue features

Ordered by user-visible impact ÷ implementation cost.

### 1. Parallel image generation (most likely first build)

**User-facing problem:**
Today: click generate → wait ~3 minutes for 6 ads. The agent calls `generate_ad_images` once with all 6 prompts; fal.ai processes them roughly in series (~25-40s each).

**User-facing target:**
~40 seconds for all 6 ads — same as one image — because fal.ai can run them in parallel if you fire 6 separate calls.

**Why file IPC won't work:**
- Need 6 worker processes, each generating one image
- Coordination: which worker picks which prompt? Without locking, two workers might grab prompt 3 and skip prompt 5
- Failure: worker 4 crashes mid-job. Who notices? Who retries?

**Queue shape:**
```
Orchestrator agent enqueues 6 jobs:
  Queue: [job_1, job_2, job_3, job_4, job_5, job_6]

Worker pool of 6 processes pulls in parallel:
  worker_a → job_1 → fal.ai → done → publishes "image_1 ready"
  worker_b → job_2 → fal.ai → done → publishes "image_2 ready"
  ...

Aggregator listens for all 6 "ready" events, then signals completion.
```

**Key primitives:**
- Atomic claim-and-process (worker checks out a job, locks it, processes, marks done)
- Visibility timeout (if worker dies, job returns to pool after N seconds)
- Dead-letter queue (after N retries, park failures for inspection)

**Rough scope estimate:** 1 week of focused work, mostly extracting image generation from `mcp__nano-banana__generate_ad_images` into a worker tier and adding a fan-in aggregator.

---

### 2. Concurrent campaigns per user (the "power user" feature)

**User-facing problem:**
User has campaigns A, B, C. Wants to iterate on all three simultaneously (testing different brand voices, parallel product launches). Today: must finish A's generation before starting B (`isGenerating` lock per user).

**User-facing target:**
Plan-tier-gated concurrency: Free = 1, Starter = 2, Pro = 5 simultaneous generations.

**Why file IPC won't work:**
- One DO per user → one sandbox → one `/app/refs.json` and `/app/next-prompt.json`
- Spawning two agent processes contends on the same files
- Even if you namespaced to `next-prompt-{cid}.json`, the single agent process processes serially

**Queue shape:**
```
User starts campaign A → enqueue { campaignId: A, prompt: "..." }
User starts campaign B → enqueue { campaignId: B, prompt: "..." }  ← no wait
User starts campaign C → enqueue { campaignId: C, prompt: "..." }  ← no wait

Worker pool (per-user, scaled by tier):
  Free tier: 1 concurrent generation
  Starter:   2 concurrent generations
  Pro:       5 concurrent generations

Each worker spins up its own sandbox, runs the agent, completes, releases.
```

**Architectural shift required:**
- DO becomes a thin queue producer (no longer hosts the sandbox)
- Worker tier (Cloudflare Containers or Workers-for-Platforms) consumes from queue
- Each worker provisions its own sandbox lifecycle
- `isGenerating` becomes per-job, not per-user

**Rough scope estimate:** 2-3 weeks. This is a non-trivial re-architecture. Likely punted until plan-tier upgrades make it a paid differentiator.

---

### 3. Scheduled regeneration ("Monday brief")

**User-facing problem:**
Beta client signs up for monthly subscription, wants 6 fresh ads delivered to their inbox every Monday morning, based on this week's research refresh.

**Why file IPC won't work:**
- File IPC requires DO awake + sandbox alive
- Monday 6am, no user is logged in. DO hibernated. Sandbox destroyed.
- Cron-fired `sandbox.writeFile()` against a stopped sandbox just fails

**Queue shape:**
```
Cron at Sunday 11pm:
  for each subscriber with "weekly_brief" enabled:
    enqueue { type: 'scheduled_gen', userId, brand, deliverAt: 'Monday 6am' }

Worker pool drains the queue overnight:
  - Spins up sandbox per user
  - Runs the agent
  - Writes to D1
  - Sends email when complete

User wakes up Monday → notification → opens the app → ads are ready.
```

**Decouples scheduling from user presence.** Cron pushes, workers pull, results land in D1 + email regardless of whether the user is logged in.

**Rough scope estimate:** 1 week if Feature 2 (concurrent campaigns) is already built (workers exist). 2-3 weeks standalone.

---

## Other queue use cases (lower priority)

| Feature | What it is | Why queue |
|---|---|---|
| **Dodo / Clerk webhook delivery** | Payment confirmations, user events | Need retry-on-failure with backoff, idempotency keys, dead-letter queue for poison messages |
| **Async critique loop** | Reviewer agent grades main agent's output, posts feedback | Reviewer is a separate process, doesn't share working memory; communicates via job/event |
| **Bulk operations** | "Regenerate all my campaigns with my new brand colors" | Enqueue N jobs, run in batches over hours |
| **Cross-campaign analytics** | "Show me which hook types performed best this quarter" | Background workers aggregate from completed campaigns into a dashboard async |
| **Webhook deliveries from us** | Notify external integrations when a campaign completes | Same retry/backoff/dead-letter shape as inbound webhooks |

---

## When to pull the trigger

Don't pre-build queues. The current file-IPC pattern is correct for today's "one user, one campaign in flight, agent runs in turns" shape. Add queues when:

1. **Image generation latency becomes a top-3 user complaint.** Fan-out to parallel workers (Feature 1) is the obvious response — clear payoff, contained blast radius.
2. **Plan-tier upgrades need a concurrency differentiator.** Feature 2 unlocks "Pro = 5 simultaneous campaigns."
3. **A subscription tier promises proactive deliverables (weekly briefs, scheduled refreshes).** Feature 3 needs cron + workers + queue.
4. **Webhook reliability becomes a problem.** Today's inbound Dodo webhook handling probably doesn't have proper retry — first time it bites, queue is the answer.

For each, consider whether a simpler primitive works first (synchronous fan-out via `Promise.all`, a Cloudflare Cron Trigger directly invoking a worker, in-DO retry logic). Queue is right when you need durability + decoupling between producer and consumer.

---

## Implementation note

When the time comes, **Cloudflare Queues** is the natural choice — it's already in our infra, supports retries with backoff, dead-letter queues, and per-message visibility timeouts. Workers can produce and consume directly. No new infra to provision.

Alternative if Queues don't fit (e.g. need higher throughput, pub-sub semantics): **Cloudflare Pub/Sub** (different model) or roll a Redis instance via an external provider. Likely overkill until proven.

End of doc.
