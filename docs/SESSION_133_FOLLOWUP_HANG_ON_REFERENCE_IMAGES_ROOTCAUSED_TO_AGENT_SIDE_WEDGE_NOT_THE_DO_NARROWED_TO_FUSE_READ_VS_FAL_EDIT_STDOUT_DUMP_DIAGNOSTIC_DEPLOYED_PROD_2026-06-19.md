# Session 133 — The **follow-up "stuck generation" bug**, root-caused: **reference-image follow-ups wedge the agent inside the container** (NOT the DO), narrowed to **two exact un-timeboxed lines** (FUSE read vs fal edit), and a **stdout-dump diagnostic shipped to prod** to settle which

**Date:** 2026-06-19 · **Branch:** `new-ui` (diagnostic edits UNCOMMITTED, but LIVE on prod) · **Status:** Infra/debug session — a departure from the creative-cell track (S125–S132). Bug reproduced and root-caused from live production traces. A read-only diagnostic is deployed to production; **we are waiting for the user to reproduce once so we can read its output and pin the exact wedge point**, then implement the real fix. Nothing committed.

> **Read first:**
> - This doc — the forward plan is **Part 7**.
> - The diagnostic that's live on prod: **Part 4** (3 edits in `cloudflare/src/durable-objects/campaign-session.ts`).
> - Architecture grounding (how the plumbing actually works): **Part 1**.
> - **Code is the source of truth; the 28 arch docs in `docs/architecture/` can be stale** (confirmed this session). Verify against the real files.

---

## Part 0 — The arc in one paragraph

The user reported follow-ups **getting stuck / "loading forever"** and then, after cancel, **"a generation is already in progress"** — a stuck per-user lock. I chased two **wrong** theories first (heartbeat-silent is a cosmetic false alarm; the DO's event loop is blocked by the fast-follow-up stdout replay → WebSocket drops) and even looked at the **wrong campaign**. The user corrected me, and a **live `wrangler tail` capture of production** broke it open: on a warm follow-up, the **DO stays perfectly healthy** (answers pings, runs its 10s alarm on schedule) — it's the **agent inside the container that wedges**, producing **zero output** for the turn. The trigger is unambiguous: a follow-up with **`refs=0` completed in 17 s**; the very next follow-up **with a reference image hung for 4.5+ min** and would have spun to the **2-hour** safety net. The reference path is the only thing that differs, and it adds **two un-timeboxed steps**, either of which can block forever: **(C)** the agent `Read()`s the reference image off the **s3fs/R2 FUSE mount**, and **(D)** image gen routes to fal's **edit** endpoint (`fal.subscribe("…/edit")`) which has **no timeout**. I couldn't see *which* from the DO traces (the agent's own stdout isn't in `wrangler tail` or the dashboard — it lives only in `getProcessLogs`, which only the DO can call), so I **shipped a tiny diagnostic to prod**: when the agent goes silent, the DO dumps the **tail of its stdout** to Sentry as a new `agent_silent_stdout` event. Reproduce once → the agent's **last printed line** tells us **C vs D** with zero guessing → then fix.

---

## Part 1 — Architecture grounding (verified against code this session)

One **Durable Object per USER** (`CAMPAIGN_SESSION.idFromName(userId)`), and one **container/sandbox per user** (`user-{userId}-v2`). `isGenerating` is a **per-user lock** (CLAUDE.md gotcha — and the heart of this bug).

- **Worker** (`src/index.ts`): WS `/ws` → verify Clerk JWT → forward to the user's DO with `X-User-Id`. Images: `/images/...` is **authenticated** (`router.ts:34` runs `authenticateRequest` *before* the image route → `userId` comes from the verified token, never the URL; that's why `<img>` needs the `AuthImage` Bearer fetch and the WS uses `?token=`).
- **DO** `CampaignSession` (`src/durable-objects/campaign-session.ts`, ~2287 lines): accepts WS via Hibernation API; `handleGenerate`/`handleFollowUp` fire `runGeneration`/`runFollowUpFast` **fire-and-forget**; persists session to DO storage so it survives resets/hibernation.
- **Container** (`sandbox/Dockerfile`, `instance_type: standard-2`): the **`agent-runner.js`** is a **long-lived child process** (`sandbox.startProcess('node /app/dist/agent-runner.js')`). It runs ONE `query()` whose prompt is an async generator that yields turn 1 then loops `waitForPromptFile()` — so the SDK keeps conversation context **in memory** across warm follow-ups. **Model: Haiku 4.5**, `maxTurns: 30`, `maxBudgetUsd: 3.0`.
- **File-mailbox IPC** between DO and agent: `next-prompt.json` (DO→agent), `turn-result.json` (agent→DO, **container-local disk, not R2** — the only completion marker), `agent-status.json` (idle/processing), `generated-images.jsonl` (image tally), `refs.json` (active reference set).
- **TWO heartbeats** (this is the part to keep straight):
  1. **DO alarm keep-alive** — `startKeepAlive()` sets a **10 s** repeating alarm; prevents hibernation during a gen; each tick checks agent liveness (`listProcesses`), relays container logs (`getProcessLogs`), and polls `turn-result.json` for completion.
  2. **Agent liveness ping** — `agent-runner.ts` writes a `heartbeat` trace to stdout **every 5 s** (continuous, even when idle between turns). When the DO's live stream processes one, `onHeartbeat()` sets `lastHeartbeatAt`. If the alarm sees `isGenerating && now - lastHeartbeatAt > 30 s`, it fires the Sentry `heartbeat_silent` event.
- **Completion = 4 layers**: (1) live stream sees `turn_complete`/`result`; (2) inline `tryFinalize` right after the stream; (3) the 10 s **alarm** polls `turn-result.json`; (4) client `POST /api/campaigns/:id/recover` (D1-first, no R2). Safety nets: **5-min zombie** (needs `!agentProcessId`), **2-hour** max age.
- **No SDK session resume on Cloudflare** (`RESUME_SDK_SESSION_ID` always empty) — s3fs null-byte corruption. Cold follow-ups re-hydrate research/hooks/prompts from D1 + paste prior messages into the prompt.

---

## Part 2 — The bug, and the two wrong turns before the right answer

### Symptoms (user)
Follow-up "kept loading and loading," errored with a friendly "your work's safe, try again," and after cancel + re-prompt showed **"A generation is already in progress."** Later clarified: on the real stuck campaign the **follow-up never completed and reset after ~2 hours**. And the sharp clue: **"it happens only if I follow up with a reference image."**

### ❌ Wrong theory 1 — "heartbeat_silent is a cosmetic false alarm"
The original `heartbeat_silent` event (issue **7548403606**, campaign `campaign_mqc2ykv14oegzy`) had `silenceSec: 145` but `ageSec: 13` — the silence (145 s) predated the turn (13 s old). I concluded the timer was just **stale from the prior turn** and proposed resetting `lastHeartbeatAt` at turn start to suppress the noise. **Walked back** (Part 7): on that campaign the follow-up *genuinely hung* — heartbeat_silent was a **true** signal. Suppressing it would have masked a real hang. (Reset is still useful — to make the signal *trustworthy* — but it must be paired with *acting* on it, not silencing it.)

### ❌ Wrong theory 2 — "the DO's event loop is blocked by the stdout replay → WS drops"
Today's repro (`campaign_mqki95xlkaozzs`) fired client-side **`ping_pong_timeout`** + **`ws_close_unexpected`** (code **1006**, `wasClean:false`, `timeSinceLastPingMs: 20711`, `navigatorOnline:true`, `visibilityState:visible`, Hyderabad). I theorized the fast-follow-up replays the *entire* agent stdout (grows every turn) in a tight no-yield loop, starving the WS keepalive. **Disproved by the live tail (Part 3):** the DO answered pings and ran its alarm on schedule the whole time. **This was a real but *separate* incident** — that campaign actually *completed* (D1 `status: complete`). The WS-drop is its own connection-layer issue; it is **not** the hang.

### The correction (user) — I had the wrong campaign
I'd pivoted to `campaign_mqki95xlkaozzs` (today, completed). The user pointed out the *real* stuck one is **`campaign_mqc2ykv14oegzy`** ("The Whole Truth Foods", uses reference image `@twt-1.jpg`). D1 timeline:
| Time (Jun 13 UTC) | who | what | result |
|---|---|---|---|
| 08:15 | user | "create two ads … using @twt-1.jpg" | ✅ 08:19 |
| 08:20 | user | "create hook 3 … using the reference image" | ❌ **no response 51 min** |
| 09:11 | user | *same msg re-sent* | ✅ 09:12 |
| 09:14 | user | "ok what is hook 4?" | ❌ **never answered** |
| 09:37 | — | marked `incomplete` | stuck |
`heartbeat_silent` fired at 09:15:04 — **13 s into** the stuck "what is hook 4?" follow-up. Final state: `incomplete`, 3 images. **Two** follow-ups hung on this one campaign.

### Sentry forensics worth remembering
- Server-side `ws_abnormal_close` (issue **7477747371**) **does** fire and carries the DO trace breadcrumbs — but the only one in 24 h was a **different** user (US), code **1005**, `gen=false` (a benign idle close). For our in-gen **1006** drop the **server captured nothing** → the DO didn't cleanly observe its own close.
- **Sentry only uploads DO `trace()` breadcrumbs bundled with a fired event** — there is **no continuous server tail in Sentry**. The DO going dark is exactly the window where it can't self-report. → that's why we needed `wrangler tail` / `getProcessLogs`.

---

## Part 3 — The breakthrough: live `wrangler tail` of production (the headline finding)

Ran `npx wrangler tail creative-agent-production --format json` (note: `--env production` fails from repo root — wrangler can't find `cloudflare/wrangler.jsonc`; **address the worker by name**). User reproduced. Parsed the (pretty-printed, multi-object) JSON into a time-ordered timeline. On the **one** DO for `user_3Dext…`:

- **06:39:13 — follow-up on `campaign_mp40awylzb2gch` (Whole Truth Foods), `refs=0`** → slow/cold path (`agentAlive=false, campaignMatch=false`) → **completed in 17 s** (`[gen][exit] ms=17122`, 0 images / 3 files). ✅
- **06:40:40 — `set_active_references count=1`** on `campaign_mqki95xlkaozzs` (Optimum Nutrition whey) — the user attaches a reference image.
- **06:41:19 — follow-up WITH the reference** → `refs.json` + `next-prompt.json` written → **then nothing.** From 06:41:19 to the end of capture (06:45:52+, **4.5+ min**), the alarm polled `getProcessLogs` + `readTurnResult` every 10 s and **never found a result.** The turn never completes. ❌

**The decisive observations:**
1. **The DO is healthy** the whole time — pings logged on schedule, alarm every 10 s. NOT blocked. (Kills wrong theory 2.)
2. **The agent process is alive** (`getProcessLogs` keeps succeeding) but emits **zero output** for the turn → no `turn_start`, no result. The agent *wedged*.
3. Because the process is **alive but silent**, every fast safety net is bypassed: dead-process check (process is alive), 5-min zombie (`agentProcessId` is set). Only the **2-hour** net frees it. **Worst case for completion detection.**
4. **The agent's own stdout is NOT in `wrangler tail`** (confirmed: 0 hits for `turn_start` / `Starting fal.ai` / nano-banana lines — tail only carries the `sandbox-do` orchestrator logs, not the `startProcess` child's stdout).

### Narrowed to two exact, reference-only, un-timeboxed lines
A normal follow-up does neither of these; a reference follow-up does both (per `sandbox/orchestrator-prompt.ts` "Reference Images" section):
- **(C) FUSE read.** Step 2: *"For every entry … call `Read(sandboxPath)` to load the image."* `sandboxPath` = `/mnt/r2/uploads/…` on the **s3fs FUSE mount** (reused, un-remounted, on warm follow-ups). A **sync FUSE read can't be interrupted**; the prompt handles a Read *failure* ("skip that reference") but **not a Read that hangs**.
- **(D) fal edit call.** Step 5 → `generate_ad_images` with `referenceImageUrls` → `fal.subscribe("fal-ai/nano-banana-pro/edit", …)` at **`nano-banana-mcp.ts:242`**. **No timeout / AbortSignal / Promise.race** (confirmed; text-to-image at `:263` also has none, but it's only used when refs=0).
- **Ruled out:** `fal.storage.upload` on the DO side (it completed — `refs.json` was written) and the image download/write (the `refs=0` follow-up does it too and finished in 17 s).
- **Diagnostic tell baked into the physics:** a **sync FUSE block freezes Node's event loop → heartbeats STOP**; an **async fal hang leaves the loop free → heartbeats keep ticking** (no `API response received`). The stdout dump shows both the last line *and* whether heartbeats are still flowing → distinguishes C from D.

---

## Part 4 — The diagnostic shipped to prod (`agent_silent_stdout`)

The agent's stdout is reachable **only** via the DO's `getProcessLogs`. So: 3 read-only edits to `cloudflare/src/durable-objects/campaign-session.ts` (typecheck clean):

1. **New field** (after `silentHeartbeatReported`): `private pendingStdoutDump = false;`
2. **In the `heartbeat_silent` alarm branch** (after it sets `silentHeartbeatReported = true`): `this.pendingStdoutDump = true;`
3. **In the alarm's existing `getProcessLogs` relay** (right after `const stdout = …`): if `pendingStdoutDump`, take the **last 8000 chars / last 30 non-empty lines**, and `Sentry.captureMessage('agent_silent_stdout', { tags: { failure_mode: 'agent_silent_dump' }, extra: { agentProcessId, sessionId, campaignId, stdoutLen, lastLine, lastLines } })`. Reuses the `getProcessLogs` call already in that step.

The flag is set in the silence branch (early in the alarm) and **consumed same-tick** in the `getProcessLogs` step (later in the same alarm). It fires once per silence window (gated by `silentHeartbeatReported`). Robust to a sandbox-null tick (flag persists to the next tick when the sandbox reconnects).

**Deployed to PRODUCTION:** version `a4aa20a9-a44b-4544-a5af-3c0c88fcbdf7`, Sentry release `9fc72da46a42d22ca5e54022a6a77ee7cd5a81da`. Health check green (D1 connected, R2 bound, Clerk OK, 13 prod campaigns). **These 3 edits are UNCOMMITTED on `new-ui` but live on prod** — a `wrangler deploy` ships the working tree.

**How to read it:** reproduce a reference-image follow-up, let it hang ~1 min (the dump fires ~30 s into the silence, via the alarm). Then read the new Sentry issue `agent_silent_stdout`:
- last line is a **`Read` of `/mnt/r2/uploads/…`** and heartbeats have **stopped** → **C (FUSE read)**
- last lines show **`Starting fal.ai… Mode: edit… Generating image 1/N`** with heartbeats **still ticking** but no `API response received` → **D (fal edit)**
- **no `turn_start` at all** → the warm agent's loop never picked up the prompt (a third possibility — loop already dead)

---

## Part 5 — Deploy gotcha that cost ~15 min (now in memory)

The first prod deploy **hung forever** in the client build: `vite` sat at **0 % CPU, state S, `transforming…`** for 14 min. Cause: **Claude Code's default Bash sandbox silently DROPS the `sentry-vite-plugin`'s network call to Sentry** (Cloudflare hosts allowed, Sentry hosts not), and the plugin has no timeout → infinite wait. **Fix: run deploys/builds with `dangerouslyDisableSandbox: true`.** Same command, sandbox off → built in ~5 min, `Successfully uploaded source maps to Sentry`, full deploy completed. (Debug tell: sample the real `node …/vite` PID, **not** the `sh -c "tsc -b && vite build"` wrapper — the wrapper is always 0 % CPU and will fool you.) Also: gate the deploy on a **successful client build with `&&`**, not the documented `;`-chain (which would ship a stale bundle on build failure). Saved as memory `reference_deploy_needs_sandbox_off.md`.

Correct prod deploy used:
```
cd client && npm run build:production && { docker logout registry.cloudflare.com || true; docker builder prune -af || true; } && cd ../cloudflare && npm run deploy:production
```
(run with the Bash sandbox disabled). `deploy.sh` itself only does `wrangler deploy --env production` + Sentry source maps — it does **not** build the client, hence the explicit `build:production` first.

---

## Part 6 — Ops: design-partner credit grant

Granted **100 credits ($10)** to **drkbabu1965@gmail.com** = `user_3Dext3JrWtBN6RB3rdVF6YghwmZ` (Hyderabad; the design partner reproducing this bug) on **production** `creative-agent-db-prod`: `balance_usd_topup += 10.0` (the permanent top-up pool). Was `−0.014` → now **`9.986` (≈99.86 credits)**. The slight under-100 is a pre-existing tiny overage, functionally a full ~2-campaign balance.

---

## Part 7 — NEXT STEPS (the forward plan)

### Immediate (waiting on the user)
1. **User reproduces** the reference-image follow-up hang (prod, with the diagnostic live). Let it hang ~1 min.
2. **Read the `agent_silent_stdout` Sentry event** → `lastLine` / `lastLines` → **pin C (FUSE read) vs D (fal edit)** vs "loop already dead."

### The fix (two layers — both needed regardless of C/D)
1. **Root-cause timeout** — wrap the un-timeboxed reference step(s):
   - **D:** wrap `fal.subscribe(...)` in `nano-banana-mcp.ts` (lines 242 & 263) in a `Promise.race` timeout (~90–120 s) → on timeout return a **failed-image result** so the turn *completes* (with a failure) instead of hanging.
   - **C:** a sync FUSE `Read` hang is harder to time-box from inside the agent — the robust catch is the DO-side net below (which doesn't care *where* the agent is stuck).
2. **DO-side safety net (the robust catch-all)** — *act* on the silence the DO already detects. Today `heartbeat_silent` only logs. Make it: when the agent is silent past a threshold (~60 s) on an active turn, **kill the agent + release the lock + mark `incomplete`** → a 2-hour lockup becomes a 1-minute "try again." (And reset `lastHeartbeatAt` at turn start so the detector is *trustworthy* — fires only on genuine in-turn silence, not on stale prior-turn values.)
3. **Self-healing lock / authoritative cancel** — `handleCancel` should force-reset `isGenerating` + kill the agent even when `abortController` is null; and the "already in progress" guard should verify the agent is *actually* processing before blocking (it already has a `!sandbox` zombie path — extend it). So a wedged turn never locks the user out.

### Separate, lower-priority follow-ups surfaced this session
- **WS 1006 drop on follow-ups** (the *other* incident) — connection-layer; the fast-follow-up replays the whole stdout each turn and the client's pong timeout is 8 s. Worth a look but distinct from the hang.
- **Fast-follow-up replay cost** — `streamForLiveUI` with `skipUntilRequestId` re-reads the entire agent stdout every follow-up (grows per turn). Not the hang's cause, but wasteful.

---

## Part 8 — Key references

**Code (all verified this session):**
- DO: `cloudflare/src/durable-objects/campaign-session.ts` — alarm + `heartbeat_silent` (~lines 190–205), `getProcessLogs` relay + the new dump (~lines 326–353), `handleFollowUp` fast/slow path, `runFollowUpFast`, `setupSandbox`, `tryFinalize`.
- Agent: `cloudflare/sandbox/agent-runner.ts` (heartbeat every 5 s, `promptStream`/`waitForPromptFile`, completion marker), `cloudflare/sandbox/nano-banana-mcp.ts` (fal calls, no timeout — **:242 edit**, **:263 t2i**), `cloudflare/sandbox/orchestrator-prompt.ts` (Reference Images: Step 2 FUSE `Read`, Step 5 fal edit), `cloudflare/sandbox/refs-mcp.ts`.
- Worker: `cloudflare/src/index.ts`, `router.ts` (image auth), `auth.ts`, `routes/recovery.ts`, `lib/event-buffer.ts`, `lib/sdk-message-parser.ts`.

**Identifiers:**
- User (design partner, Hyderabad): `user_3Dext3JrWtBN6RB3rdVF6YghwmZ` (drkbabu1965@gmail.com)
- Stuck-2h campaign (real bug): `campaign_mqc2ykv14oegzy` (TWT, ref `@twt-1.jpg`), status `incomplete`
- Repro pair: `campaign_mp40awylzb2gch` (refs=0, completed 17 s) vs `campaign_mqki95xlkaozzs` (refs=1, hung 4.5+ min)
- Sentry issues: `heartbeat_silent` 7548403606 · `ws_abnormal_close` 7477747371 · `ws_close_unexpected` + `ping_pong_timeout` (today's repro trace). New issue to watch: **`agent_silent_stdout`**.
- Prod deploy: version `a4aa20a9-a44b-4544-a5af-3c0c88fcbdf7` · Sentry release `9fc72da46a42d22ca5e54022a6a77ee7cd5a81da`.

**Memory written this session:** `reference_deploy_needs_sandbox_off.md` (deploy needs Bash sandbox off) · `feedback_code_over_stale_docs.md` (verify arch claims against code, not the drifting `docs/architecture/`).
