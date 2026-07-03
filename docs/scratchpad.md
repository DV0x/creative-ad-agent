# Scratchpad

## 2026-04-07 — Architecture Review + Download Tracking

### Context
Full end-to-end architecture review of the project. Discussed:
- React Router not needed (only 2 states: landing vs workspace)
- No URL-based deep linking to campaigns (selection is Zustand state)
- Images are auth-gated, no shareable links — users download and use elsewhere
- Shareable links deferred — want to observe user behavior first before building collaboration features

### Decision: Track User Behavior Before Building Features
- Observe how people use the platform before adding features
- Existing data: usage_log (costs, tokens), campaigns (status), messages (conversation history)
- Missing data: **downloads** (strongest signal of output value)

### Building: Download Event Tracking
**Approach:**
- New `user_events` table in D1 (generic, extensible for future event types)
- New `POST /api/events` endpoint (thin, fire-and-forget from client)
- Client fires event on image download (ImageCard) and download-all (ResultsView)
- No new libraries, no analytics SDK — just a table and a fetch call

**Schema:**
```sql
CREATE TABLE user_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  campaign_id TEXT,
  metadata TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
```

**Future event types to consider:**
- image_download, download_all
- campaign_view, follow_up_sent, cancel_clicked
- session_start, session_end

### Status: DONE
- **Commit:** `f2e5c46` on `new-ui`
- **Staging:** deployed + verified (2 downloads tracked)
- **Production:** deployed to `app.creativemachines.xyz`
- **D1 table created** on both staging (`creative-agent-db`) and production (`creative-agent-db-prod`)
- **Local server** also has the table + route for dev mode

**Files changed (14):**
- `cloudflare/src/db/events.ts` — new DB module
- `cloudflare/src/routes/events.ts` — new route
- `cloudflare/src/router.ts` — registered route
- `cloudflare/src/db/index.ts` — exported module
- `cloudflare/schema.sql` — added table
- `server/lib/db/events.ts` — local DB module
- `server/routes/events.ts` — local route
- `server/sdk-server.ts` — registered route
- `server/lib/database.ts` — added table to schema
- `server/lib/db/index.ts` — exported module
- `client/src/lib/api.ts` — `eventsApi.track()` (fire-and-forget)
- `client/src/components/ImageCard.tsx` — tracks `image_download` with hookType + imageIndex
- `client/src/components/ResultsView.tsx` — tracks `download_all` with imageCount
- `docs/scratchpad.md` — this file

**How to query downloads:**
```bash
# Staging
npx wrangler d1 execute creative-agent-db --remote --command="SELECT * FROM user_events ORDER BY created_at DESC LIMIT 10"

# Production
npx wrangler d1 execute creative-agent-db-prod --remote --command="SELECT * FROM user_events ORDER BY created_at DESC LIMIT 10"
```

---

## 2026-04-07 — Langfuse Observability + Agent Evals

### Context
Want to observe how the AI agent performs in production — not just user behavior (downloads), but agent behavior (quality of research, hooks, images, costs, latency per step).

### Decision: Langfuse for AI Observability
- **What:** Open-source LLM engineering platform — tracing, evals, cost tracking, prompt management
- **Why:** We're blind to agent quality. Can't tell if bad output is from shallow research, generic hooks, or bad image prompts. Langfuse instruments every step.
- **Repo cloned:** `/Users/chakra/Documents/Agents/langfuse/`

### Hosting Decision: Self-hosted on Hetzner VPS
- Cloudflare can't host it (needs Postgres, ClickHouse, Redis — persistent DBs)
- Local Mac won't work (must be always-on for production traces)
- Langfuse Cloud rejected (want data local)
- **Hetzner CX22**: 2 vCPU, 4GB RAM, 40GB disk, ~$7/month
- Setup: `docker compose up -d` — 15 min from zero to running

### Integration Point
- `cloudflare/sandbox/agent-runner.ts` — the long-lived process inside the container
- Langfuse JS SDK wraps Claude SDK calls, sends traces to Hetzner instance
- Each `query()` call = 1 trace, each tool use = nested observation

### Eval Plan (from Eval Masterclass + Langfuse capabilities)
Using ACCT framework (Accuracy, Completeness, Calibration, Taste):

| Eval | What it catches | Type | Target |
|------|----------------|------|--------|
| **Research Accuracy** | Fabricated claims, wrong industry | LLM-as-judge (1-5) | ≥4.0, zero 1s |
| **Research Completeness** | Only visited homepage, missed key pages | LLM-as-judge (1-5) | ≥4.0 |
| **Hook Specificity** | Generic copy that works for any competitor | LLM-as-judge (1-5) | ≥3.5 |
| **Hook Variety** | All 6 hooks sound the same | LLM-as-judge (1-5) | ≥3.5 |
| **Ghost Actions** | Agent claims actions it didn't take | Boolean | 95%+ pass |
| **Image-Prompt Alignment** | Images don't match art direction | Human annotation | TBD |

### Top Failure Modes (from masterclass)
1. Brand disconnection (26%) — hooks don't reflect actual brand
2. Shallow research (18%) — missed key pages/competitors
3. Hook homogeneity (15%) — all 6 hooks sound the same
4. Image-prompt mismatch (13%) — images don't match described style
5. Fabricated claims (13%) — stats not in research

### Feedback Loop
Trace ingested → evals auto-run → scores on dashboard → filter low scores → diagnose root cause → fix prompt → run regression suite → ship if all evals pass

### Status: PLANNING
- [ ] Set up Hetzner VPS
- [ ] Deploy Langfuse via docker compose
- [ ] Integrate Langfuse SDK into agent-runner.ts
- [ ] Define eval templates in Langfuse UI
- [ ] Run first batch of evals on production traces

---

## 2026-06-08 — Strategy re-cut: RESEARCH-side follow-ups (deferred)

Surfaced while validating the strategy binder re-cut (Buyer·Promise·Proof·Mandatories + `<thinking>` scaffold + synced rubric). Two research-binder improvements to weigh AFTER confirming the strategy re-cut generalizes (arjun-infra + dailyobjects):

1. **Surface distinct buyer TYPES explicitly.** For national/single-line brands, research gives buyer *voice* + *want* but does NOT pre-sort the audience into distinct candidate types (sub-segments only fire for hyperlocal briefs). Strategy must segment the voice into "who" bets fresh each run → part of the audience-discovery test-shape variance we saw (run1 collapsed to messages; run2/prior cut distinct whos). Fix: research clusters the voice into the buyer types it sees, each weighted + sourced — firmer base for strategy.

2. **Demographics (incl. age) are unsourced.** Neither binder sources or requires demographics. In the TWT run, "aged 25–40" appears in research ONLY as an EXAMPLE inside an explicit GAP ("strategist needs founder to identify the sub-segment, e.g. 25–40 professionals vs beginners vs gym-goers", research.md:324) — and strategy HARDENED it into a stated buyer demographic, un-flagged. The cell needs age for execution (visual person, copy register, concept), so an unsourced age = category-average filler (genericness + honesty leak). Judge's no-fabrication PASSED because "25–40" literally appears in research.md — the gap-context was lost. Fix: research surfaces demographics WHEN sourced (review skews, category reports), hedged; when unsourced, buyer stays psychographic and the cell infers visual age honestly — never assert a guess. Strategy-side: extend assumption-flagging to a promoted unknown like this.
