# Local AI Runner — `wrangler dev` In-Process SDK

> Part of [Architecture Documentation](../INDEX.md) | **File:** `cloudflare/src/lib/local-ai-runner.ts` (287 lines) · **Integration:** `cloudflare/src/durable-objects/campaign-session.ts:1642` and `:1724-1814`

---

## What this covers

The third AI-execution path in this codebase.

| Path | File | Who runs it | Transport |
|---|---|---|---|
| **Production** | `cloudflare/sandbox/agent-runner.ts` | Node process inside a sandbox container | SDK → stdout JSONL → sandbox RPC → DO |
| **Local AI Runner** | `cloudflare/src/lib/local-ai-runner.ts` | In-process, inside the DO itself (wrangler dev) | SDK → async generator yielded straight to the DO |
| **Local Dev Server** | `server/lib/ai-client.ts` | Node process inside Express | SDK → direct call from websocket-handler |

This doc covers the middle row. The file is **dev-only** — `@ts-nocheck`'d because it uses Node.js APIs (`fs`, `path`, `Buffer`, `process`) that clash with `@cloudflare/workers-types`. Works at runtime because `wrangler.jsonc` sets `compatibility_flags: ["nodejs_compat"]`.

---

## When it runs

Only when `env.AI_BACKEND === 'local'`. That branch is set in one place in `wrangler.jsonc`:

```jsonc
"env": {
  "dev": { "vars": { "AI_BACKEND": "local" } }
}
```

So this path fires only for `wrangler dev --env dev`. Staging and production never set `AI_BACKEND`, so they never enter this branch.

The DO routes into it at `campaign-session.ts:1642`:

```typescript
if (this.env.AI_BACKEND === 'local') {
  return this.runGenerationLocal(prompt, sessionId, sdkSessionId);
}
```

Every follow-up and new-generation call checks this gate first. Production never pays the cost — the dynamic `import()` of `local-ai-runner.js` inside `runGenerationLocal` means the module is tree-shaken out of deployed bundles.

---

## How it differs from the sandbox path

| Capability | Sandbox (`agent-runner.ts`) | Local AI Runner |
|---|---|---|
| Container | Docker image, `standard-2` instance | **None** — runs inside the DO's V8 isolate (wrangler dev's local runtime) |
| R2 FUSE mount | `/mnt/r2` via s3fs, per-user prefix | **None** — images written to `./generated-images/{sessionId}/...` on the dev machine's disk |
| Stdout transport | JSONL → `sandbox.startProcess` → `streamProcessLogs` → parseSSEStream | **None** — the SDK's async generator is awaited directly; messages flow via `for await`|
| Streaming (`includePartialMessages`) | ✅ enabled — produces `stream_event` → text_delta / tool_use_event events | ❌ disabled — SDK yields only fully-assembled assistant/user/result messages |
| Long-lived process | Yes — `next-prompt.json` IPC keeps the Node process alive across follow-ups | No — each turn starts a fresh `runLocalGeneration` call |
| Turn sentinels | `turn_start` / `turn_complete` printed to stdout | None — completion detected by `msg.type === 'result'` inside the generator loop |
| Completion marker | `/app/turn-result.json` on container disk | None — DO finalizes inline as the generator ends |
| Pre-flight IP check | ✅ POSTs to `api.anthropic.com` before spawning | ❌ skipped (dev machine presumed reachable) |
| `tryFinalize` + alarm | 4-layer completion detection | None — single path, single loop |
| Credit deduction | `credits.recordUsage` + `credits_update` broadcast | **Skipped** — local dev is free |
| Session resume | `RESUME_SDK_SESSION_ID: ''` always (s3fs corruption) | Passes `resume: sdkSessionId` when available, with a silent retry-without-resume on failure |

The upshot: local runner is a single in-process `for await` over SDK messages. No containers, no FUSE, no IPC files, no stream-event pipeline, no credits.

---

## How it differs from `server/lib/ai-client.ts`

`server/` is the full local dev stack — Express + SQLite + WebSocket server. Its `ai-client.ts` also drives the SDK in-process, but it runs inside the Express process, not inside a DO. That means:

- `server/` uses `better-sqlite3` directly; local-ai-runner uses the DO's D1 binding through `wrangler dev`'s local simulator
- `server/` has its own `websocket-handler.ts` (1672 lines); local-ai-runner reuses production's DO + `processSDKMessage`
- `server/` writes images to `generated-images/` on the project root; local-ai-runner does the same path by default (`imageOutputDir: './generated-images'`)

See [LOCAL_AI_CLIENT.md](./LOCAL_AI_CLIENT.md) for the `server/` path.

---

## Why this file exists

It lets you iterate on the DO itself — routing, state machine, reconciliation logic, WS protocol, D1 writes — without rebuilding the Docker image or waiting on a container cold start. A `wrangler dev --env dev` cycle is ~5 seconds; a sandbox rebuild + push is several minutes.

The trade-off is that the local path doesn't exercise everything. Anything sandbox-specific or FUSE-specific won't show up here.

---

## What it cannot test

If you're touching any of these, `wrangler dev --env dev` is not enough — you need a staging deploy:

- Pre-flight IP blocking / retry loop
- Container cold-start + FUSE mount lifecycle
- `s3fs` write semantics (including the null-byte SDK JSONL corruption)
- `sandbox.startProcess` / `streamProcessLogs` / `readFile` RPC errors
- The 4-layer completion detection (Layer 1 inline, Layer 2 tryFinalize, Layer 3 alarm, Layer 4 /recover)
- `turn_complete` / `result` sentinel handling
- Text-delta streaming (production-only — relies on `includePartialMessages: true`)
- Credit deduction + `credits_update` WS broadcast
- Zombie detection and sandbox-ref recovery after DO reset

For this list of scenarios, ship to staging and reproduce there.

---

## SDK options

`local-ai-runner.ts:230-244`:

```typescript
const baseOptions: Partial<Options> = {
  cwd,
  model: 'claude-haiku-4-5-20251001',     // SAME as production
  maxTurns: 30,                            // SAME
  settingSources: ['user', 'project'],     // SAME
  allowedTools: [                          // SAME 12 tools
    'Task', 'Skill', 'TodoWrite',
    'WebFetch', 'WebSearch', 'Read', 'Write',
    'Bash', 'Edit', 'Glob', 'Grep',
    'mcp__nano-banana__generate_ad_images',
  ],
  systemPrompt: ORCHESTRATOR_SYSTEM_PROMPT,  // Inline copy — NOT loaded from sandbox/orchestrator-prompt.ts
  mcpServers: { 'nano-banana': mcpServer },   // Inline MCP — NOT the sandbox/nano-banana-mcp.ts module
  ...(sdkSessionId ? { resume: sdkSessionId } : {}),
};
```

Notably **absent** compared to production:

- `includePartialMessages: true` — local runner doesn't emit stream events, so the DO's `processSDKMessage` `hasStreamedDeltas` is always `false` on this path
- `maxBudgetUsd: 3.0` — no cost cap because local dev is free

---

## Integration point in the DO

`runGenerationLocal` at `campaign-session.ts:1724-1814`. The relevant skeleton:

```typescript
private async runGenerationLocal(prompt, sessionId, sdkSessionId?) {
  // 1. Open a BlockBuilder, textAccumulator, processedFilenames Set
  // 2. imageCounter.next = existingImageCount + 1  (D1 query)
  // 3. Build ParserContext with hasStreamedDeltas: false
  // 4. Dynamic import (tree-shaken in prod builds):
  const { runLocalGeneration } = await import('../lib/local-ai-runner.js');

  // 5. Start the generator
  const generator = runLocalGeneration(prompt, sessionId, sdkSessionId, {
    apiKey: this.env.ANTHROPIC_API_KEY,
    falKey:  this.env.FAL_KEY,
    imageOutputDir: './generated-images',
  });

  // 6. Consume SDK messages into processSDKMessage
  for await (const msg of generator) {
    if (this.abortController?.signal.aborted) { wasCancelled = true; break; }
    await processSDKMessage(msg, ctx);
    if (msg.type === 'result' && !wasCancelled) generationCompleted = true;
  }

  // 7. Finalize inline — no alarm, no tryFinalize
  if (generationCompleted) {
    emit complete event, write assistant message, updateCampaignStatus('complete')
  } else if (!wasCancelled) {
    emit incomplete event, updateCampaignStatus('incomplete')
  } else {
    updateCampaignStatus('cancelled'), write "scrapped that one" message
  }
}
```

Compare to `runGeneration` (`campaign-session.ts:1641-1720`) which runs all four completion layers + credits + container lifecycle. See [DURABLE_OBJECT.md § Completion detection](../cloudflare/DURABLE_OBJECT.md#completion-detection--the-real-four-layers) for the production path.

---

## Divergence risk

Local-ai-runner duplicates two things that also live in the sandbox bundle:

1. **`ORCHESTRATOR_SYSTEM_PROMPT`** (lines 16-87) — hand-copied from `cloudflare/sandbox/orchestrator-prompt.ts`. If someone updates the orchestrator prompt in the sandbox copy, local dev will silently drift and start producing different agent behavior.
2. **MCP `generate_ad_images` tool** (lines 102-208) — a compact re-implementation of `cloudflare/sandbox/nano-banana-mcp.ts`. Same filename format (`{timestamp}_{i+1}_{sanitized}.{ext}`) and same `'1K'` default resolution, but the local version skips write-verification (`fs.statSync` byte-length check) that the sandbox version does to catch silent FUSE failures — safe here because there's no FUSE. If the sandbox tool's schema gains new fields (e.g., a new aspect ratio, a new resolution tier), this file needs a matching update.

When updating either file, search the other for the same change. A pre-deploy grep would be cheap insurance (noted in [KNOWN_ISSUES.md](../cloudflare/KNOWN_ISSUES.md)).

---

## See Also

- [DURABLE_OBJECT.md](../cloudflare/DURABLE_OBJECT.md) — Production path with all four completion layers
- [SANDBOX_CONTAINER.md](../cloudflare/SANDBOX_CONTAINER.md) — Docker image + agent-runner.ts internals
- [LOCAL_ARCHITECTURE.md](./LOCAL_ARCHITECTURE.md) — The `server/` local dev stack (separate from this runner)
- [LOCAL_AI_CLIENT.md](./LOCAL_AI_CLIENT.md) — `server/lib/ai-client.ts` SDK wrapper (also different from this file)
- [STREAMING_PIPELINE.md](../cloudflare/STREAMING_PIPELINE.md) — Why this path can't emit `text_delta`
- [AI_AGENT_PIPELINE.md](../shared/AI_AGENT_PIPELINE.md) — Orchestrator workflow + skills + tools
