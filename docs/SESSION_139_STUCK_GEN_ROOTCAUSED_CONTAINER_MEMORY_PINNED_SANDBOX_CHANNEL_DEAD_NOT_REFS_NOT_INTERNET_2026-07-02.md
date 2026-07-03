# Session 139 — The "stuck generation" bug ROOT-CAUSED: the per-user container's memory pins at the 6 GiB ceiling (idle leak after a normal gen), the sandbox control channel dies ("Network connection lost"), and the DO has no recovery for RPC timeouts → 2-hour user-facing lock. **NOT references. NOT the user's internet.**

**Date:** 2026-07-02 · **Branch:** `new-ui` (no code changes this session — investigation only) · **Status:** Root cause pinned to the failure *chain* with direct evidence at every link except one (WHICH process leaks while idle — needs the instrumented retest). Supersedes S133's "FUSE-read vs fal-edit" narrowing for THIS bug (both remain real hygiene gaps at a different layer).

> **Read first:**
> - Part 2 — the definitive timeline (every claim cross-verified across ≥2 independent sources).
> - Part 4 — the root-cause chain and what killed each earlier theory.
> - Part 6 — fix plan. Part 7 — the retest protocol (planned with the user; container must idle-sleep first).

---

## Part 0 — One paragraph

The user reproduced the "loading forever → a generation is already in progress" bug twice on prod (main account, `campaign_mr29v8wbr3944u`). Live `wrangler tail` showed a **new failure signature**: EVERY sandbox RPC (`listProcesses`, `getProcessLogs`, `readTurnResult`) timing out at exactly 60 s (our `timedRPC` cap), every 10 s alarm cycle, for 19+ minutes — even after the alarm built a **fresh `getSandbox()` stub**. Three clean controlled runs on a second account (refs=0, refs=1 on a warm campaign, refs=1 on a brand-new campaign) **all succeeded** → references are NOT the trigger, and the user's mid-run internet drop **cannot** reach the DO↔container path (fully inside Cloudflare) → not the internet either. The container dashboard settled it: the main account's container **hit its 6 GiB memory ceiling yesterday evening (~1–1.5 h after a normal generation, while idle) and stayed pinned ~15 hours**; the platform's own logs show the sandbox channel erroring **"Network connection lost" at 12:54 IST — six minutes BEFORE the user's follow-up**; the container logged **nothing** from 21:57 IST (last turn of yesterday's gen) until it was recycled. A memory-suffocated container stops answering its control connection; the platform still reports the VM "healthy" (0 failed/0 stopped); our DO only treats two error *strings* as fatal, so 60 s timeouts loop uselessly until the 2-hour net — with the per-user `isGenerating` lock held the whole time.

---

## Part 1 — How we got here (chronology of the session)

1. **Re-verified S133 state:** the `agent_silent_stdout` diagnostic (version `a4aa20a9`, deployed 2026-06-19 07:45 UTC) is STILL the active prod deployment; the code is still uncommitted in `campaign-session.ts:342`.
2. **Live repro #1 (main account, ~07:30 UTC / 13:00 IST):** reference follow-up hung. Tail showed `readTurnResult` 60 s timeout + alarm `exit.ok iter=1 ms=180000` (= 3 × 60 s RPC timeouts back-to-back). The S133 stdout-dump **can never fire in this mode** — it reads via `getProcessLogs`, which is itself one of the dead RPCs.
3. **User's internet dropped mid-run** → confound noted; user (correctly) doubted the internet theory.
4. **Unlock recipe verified:** the lock is DO-state (`isGenerating`), not D1. D1 `status='incomplete'` + client reconnect → `subscribe.stale` clears it (`campaign-session.ts:1386–1407`). Cancel is a no-op after DO churn (`abortController` null).
5. **Re-test on main account (07:53 UTC):** reused the SAME container/agent (`proc_1782922236047_ser5gx`, started Jul 1 16:10 UTC) → identical all-RPC-timeout wedge, `ageSec` → 1156+. Note `[T10][alarm][sandbox.reconnect]` → `reconnected` → RPCs STILL timed out ⇒ **not a stale stub on our side; the wedge is server-side and pinned to the fixed sandbox ID** (`user-{userId}-v2`, `campaign-session.ts:1599`).
6. **Controlled runs on a second account** (`user_3Dcijxj…`, healthy container at ~0.9 GiB):
   - warm campaign, refs=0 → ✅ 32 s (`gen.exit ms=32016`)
   - same campaign, refs=1 → ✅ finalize `images=1` (`req_1782980015768`)
   - brand-new campaign (full gen) then refs=1 follow-up → ✅ finalize `images=1` (`req_1782981186566`)
7. **`wrangler containers list/info`:** prod container app `a03e2e7d-9701-45d0-b86c-590323c255e5`, image `…:a4aa20a9`, **1 vCPU / 6144 MiB / 12 GB disk**, health `active 2 / healthy 5 / failed 0 / stopped 0`, `errors: []` → **no crash/OOM-kill/restart ever registered by the platform.**
8. **Upstream (@cloudflare/sandbox):** we run **0.7.19**; latest **0.12.3**. Directly relevant fixes we do NOT have: **v0.12.1** "Recover automatically from transient infrastructure failures when the SDK opens its **WebSocket control connection** to a sandbox"; **v0.12.0** "Fix phantom running processes after a failed startProcess"; **#602 (closed)** "session.exec hangs … can **poison the reused session**"; **#794 (OPEN)** concurrent sandbox creation → "disposing the main stub" + orphaned containers; **v0.9.4** RPC-transport/WS-503 reliability.
9. **Container dashboard (Metrics + Logs)** — the decisive evidence, Part 2/3.
10. **D1 census:** 30 days of `status='incomplete'` → only 2 rows, **both this account** (Jun 19 + Jul 2). Rare, concentrated on the heaviest-usage account.

---

## Part 2 — The definitive timeline (IST; UTC = −5:30)

| Time (IST) | Source | Event |
|---|---|---|
| **Jul 1 21:26** | D1 messages | Chat turns on `campaign_…y2btb16p` (container active) |
| **Jul 1 21:40** | D1 + proc id | `"genrate ads for verbisedu.com"` starts `campaign_mr29v8wbr3944u`; agent `proc_1782922236047` starts (epoch = 16:10:36 UTC) |
| **Jul 1 21:57** | D1 + container logs | Follow-up "what other hooks are there?" answered. **Last container log line of the night: 21:57:28.555 "Request completed"** |
| **Jul 1 ~22:00 → ~23:15** | Metrics chart | Container memory **ramps ~1 GiB → ~5.9 GiB while IDLE** (no turns, no container logs) and **pins at the 6 GiB ceiling** |
| **overnight (15 h)** | Metrics + logs | Memory stays pinned; container logs **zero** lines; container never idle-sleeps (`sleepAfter: '2h'` never fires — instance stays up, billing GiB-seconds all night) |
| **Jul 2 12:54:48** | Container-app error logs | **First error — BEFORE any user action** |
| **Jul 2 12:57:22** | error logs | `"Sandbox error"` = `{"message":"Network connection lost."}` `component: "sandbox-do"` + `"Durable Object reset because its code was updated."` (no deploy since Jun 19 — this is the platform resetting the wedged Sandbox DO) |
| **Jul 2 13:00** | tail + D1 | User's reference follow-up lands → `gen=true` → **all RPCs 60 s-timeout loop** (wedge as observed) |
| **Jul 2 13:19–13:23** | error logs + tail | More `sandbox-do` errors/resets; user's D1-reset + re-sent follow-up (07:53 UTC) reuses same dead instance → same wedge |
| **Jul 2 13:35–13:38** | error logs + tail | `listProcesses` timeout errors (origin `alarm`, our DO), more "Network connection lost" + Sandbox-DO resets |
| **Jul 2 13:15–14:04** | container logs + tail | **Second instance** (other account) runs 3 clean gens incl. refs — its memory ~0.9 GiB |
| **Jul 2 ~14:45+** | Metrics chart | Aggregate P50 memory drops to ~0.9 GiB (healthy instance dominating; wedged instance recycled around/after the 2 h nets) |

**Key cross-checks:** the memory ramp happened with NO user activity and NO container logging (leak, not workload); the channel died BEFORE the follow-up (12:54 < 13:00); the wedge survived a fresh `getSandbox()` stub (fixed ID → same wedged instance); the platform never marked the instance unhealthy.

---

## Part 3 — Evidence artifacts

- **Tail captures** (session scratchpad, ephemeral): `prod-tail.jsonl`, `prod-tail-2.jsonl`, `prod-tail-3.jsonl`. Signature lines:
  - `[rpc][readTurnResult.error] ms=60000 err=RPC readTurnResult timed out after 60000ms`
  - `[alarm][exit.ok] iter=N ms=180000` (3×60 s per alarm cycle, iters 1→7+)
  - `[alarm][sandbox.reconnect]` → `[alarm][sandbox.reconnected]` → timeouts continue (fresh stub, same wedge)
  - healthy-instance control runs: `cleanupProcesses.done ms=13 · killAgent.done ms=56 · mountBucket.done ms=312 · readTurnResult.done ms=30`
- **Dashboard, container app `creative-agent-production-sandbox-production`:**
  - Metrics (24 h): Memory P50 4.85 / P90 5.17 / P99 5.19 GiB with the ramp+plateau exactly as in Part 2; CPU P99 spiking >300 % in the wedge window (1 vCPU).
  - Logs → filter `exists($metadata.error)`, window Jul 2 12:50–13:50 IST: **19 errors** = the "Sandbox error / Network connection lost / DO reset" set above (fields: `component: sandbox-do`, `sandboxId: 7ce8296220ee…`, `origin: alarm` on the listProcesses one).
  - Logs → dataset Containers only, Jul 1 21:00–24:00 IST: 437 events, 0 errors, last line 21:57:28.555; Last-24h view: 868 events, all in the Jul 1 21:20–22:00 cluster + today's healthy instance.
- **`wrangler containers info a03e2e7d…`:** 1 vCPU / 6144 MiB / firecracker / `observability.logs.enabled: true` / health all-green, `errors: []`.
- **D1:** messages for `user_3BNXbr…` Jul 1 15:30–19:00 UTC (the four rows in Part 2); `incomplete` census = Jun 19 + Jul 2, this account only.

---

## Part 4 — Root cause chain, and the graveyard of theories

**The chain (each link evidenced):**
1. **An idle memory leak** in the warm container's long-lived processes (agent-runner + SDK CLI child (`@anthropic-ai/claude-agent-sdk` **0.2.69**) + sandbox control server (**0.7.19**) + s3fs): after a *normal, completed* generation, memory ramps 1→5.9 GiB in ~60–75 min **with zero activity** and never releases.
2. **Memory pins at the 6 GiB ceiling** → the container's control server (the thing that answers `exec/readFile/listProcesses/getProcessLogs` over the SDK's **WebSocket control connection**) becomes unresponsive → `sandbox-do` logs **"Network connection lost"** and gets platform-reset repeatedly. The **VM stays "healthy"** (0 failed) — software suffocation, not a crash.
3. **The per-user fixed sandbox ID** (`user-{userId}-v2`) pins every retry — new stubs, new campaigns, D1 resets — to the SAME wedged instance. Only instance recycle/sleep frees it.
4. **Our DO has no recovery for this class:** `alarm` treats only `'object to be reset'` / `'Network connection lost'` *strings on our side* as fatal (`campaign-session.ts:311`); a `timedRPC` **timeout** is not fatal → loop to the **2-hour** net with `isGenerating` held. The 5-min zombie net needs `!agentProcessId`; the dead-process net needs the process *gone*. An alive-but-unreachable container defeats every net.
5. UX result: "loading forever", then "a generation is already in progress" for up to 2 h.

**Killed theories (with the killing fact):**
- ❌ *Reference follow-ups wedge the agent (S133 C-vs-D)* — 3/3 reference runs succeed on a healthy container. (The un-timeboxed `fal.subscribe` edit call `nano-banana-mcp.ts:242` and unbounded FUSE `Read()` remain REAL hygiene gaps — they were just not THIS bug. S133's Jun-19 capture — RPCs fine, agent silent — may still have been that layer; signatures differ.)
- ❌ *User's internet drop caused it* — first sandbox error at 12:54, before the user acted; DO↔container is intra-Cloudflare.
- ❌ *Two-getSandbox connection poisoning as the wedge* — the alarm's fresh stub timed out identically; wedge is instance-side. (Upstream #794 keeps this real as a *separate* hazard.)
- ❌ *Container crashed / OOM-killed / evicted* — platform health all-green the whole time; it never died, which is exactly why nothing recovered it.
- ❌ *`heartbeat_silent`/stdout-dump would tell us the wedge line* — the dump reads through the dead channel; unfireable in this mode.

**The one open link:** WHICH process eats the ~5 GiB while idle. Not directly observable from any current telemetry (container logs don't carry per-process RSS; agent stdout lives only in the control server's memory). → Part 7.

---

## Part 5 — Also learned / confirmed on the way

- **CLAUDE.md correction:** the sandbox container is **1 vCPU** (dashboard + `containers info`), not the 2 implied by `standard-2` notes.
- The wedged, never-sleeping container **bills all night** (≈5.9 GiB × 15 h of GiB-seconds — visible in the Usage panel). The leak costs real money even when no one is stuck.
- The dashboard SPA can boot-hang on this profile (bundles 200, zero API calls, no console errors); a manual refresh fixes it. `wrangler tail` sessions drop after ~15–30 min and are lossy under burst (trace-seq gaps) — treat tail as sampling, the observability Logs UI as ground truth.
- Sentry token in `/.env.local` is upload-only (403 on read APIs); wrangler's OAuth token lacks observability scopes. Log forensics = dashboard (or a purpose-made API token).
- `wrangler d1 execute` UPDATE reporting `changes: 2` on a 1-row update = the `campaigns_updated_at` trigger (verified via `sqlite_master`), not a double-write.
- Unlock recipe (works when the DO has been reset): set D1 `status='incomplete'` → reload app → `subscribe.stale` clears `isGenerating`. While the DO is alive-and-looping, D1 edits do nothing (`restoreSession` early-returns at `campaign-session.ts:733`; `handleGenerate` checks only memory).

---

## Part 6 — Fix plan (defense in depth; order = impact)

1. **DO dead-man's switch (the fix that ends the user pain):** track consecutive `timedRPC` timeouts against the current sandbox; at N (2–3) → declare instance dead → stop the loop, `isGenerating=false`, D1 `incomplete`, tell the user to retry, drop `this.sandbox`. On next gen, **fall back to a fresh sandbox ID** — the timestamped-ID pattern ALREADY EXISTS for IP-blocked preflights (`campaign-session.ts:1604-1606`); extend its trigger. Recovery: ~2 min instead of 2 h, regardless of what killed the instance. (Persist the active suffix in DO storage so follow-ups route to the new container; R2 remount makes files portable; warm SDK context is lost — acceptable, cold-start hydration already handles it.)
2. **Upgrade `@cloudflare/sandbox` 0.7.19 → 0.12.3** (staging first; breaking: default-session semantics changed in 0.12.2). Buys: control-connection auto-recovery (0.12.1), exec-hang/session-poison fix (#602), phantom-process fix (0.12.0), WS-503 transport fixes (0.9.4).
3. **Contain the leak until found:** restart the agent between campaigns (already `killAgent` on cold setup — consider a max-lifetime for warm agents, e.g. kill+cold-start if `proc` age > 2–4 h or after K turns), and/or an in-container watchdog that exits the agent process when RSS crosses a threshold (container recycles clean).
4. **See it coming:** dashboard alert on container memory > ~80 % (the Logs UI query builder supports alerting on these datasets), plus a cheap DO-side `sandbox.exec('ps …')` RSS probe relayed into `trace` during generations (also the retest instrument, Part 7).
5. **Layer-1 hygiene (from S133, still worth doing):** timeout/AbortSignal on `fal.subscribe` (both endpoints), bounded reference `Read()`s, and reset `lastHeartbeatAt` at turn start so `heartbeat_silent` is trustworthy.
6. (After 1–2 land) Re-evaluate the S133 stdout-dump — with a live channel it becomes useful again for the *agent-silent* signature.

---

## Part 7 — Retest protocol (agreed with user; run AFTER the wedged container has slept)

**Goal:** (a) confirm a fresh instance on the MAIN account behaves (kills any account-data theory), (b) reproduce the idle memory ramp under observation and **name the leaking process**.

0. **Precondition:** container asleep. The wedged instance frees only after the 2 h max-age net stops the alarm loop (~09:53 UTC) + 2 h idle (`sleepAfter: '2h'`) — verify via dashboard Instances/Metrics (main-account instance gone / memory series ends) before testing. Do NOT probe with RPCs (a probe wakes it).
1. **Instrument (small, discussed-before-built):** add to the alarm's container-log relay a periodic `sandbox.exec("ps aux --sort=-rss | head -8")` (every ~60 s while `isGenerating`, plus opportunistically post-gen) traced as `[diag][rss]` — visible in `wrangler tail`. ~10 lines in `campaign-session.ts`. (Alternative if no-deploy preferred: watch only the dashboard memory chart; loses process attribution.)
2. **Run:** stable connection, main account. Full campaign gen (same shape as verbisedu) → let it complete → one light follow-up → **then leave it idle 90 min** with tail + memory chart watched. Expect (if leak reproduces): RSS climb in one process while idle → that's the leaker.
3. **Branches:** leak reproduces → fix the named process (and still ship Part 6 #1–2). No leak → yesterday's ramp was condition-dependent (e.g. specific tool path/image count); diff the run shapes, iterate. Either way Part 6 #1 ships — recovery must not depend on the leak being solved.
4. Optionally re-run the reference follow-up on the fresh main-account container for the final "account is not cursed" datapoint.

---

## Part 8 — Corrections to earlier docs/memory

- **S133 doc** (`SESSION_133_FOLLOWUP_HANG_…2026-06-19.md`): its DO-side plumbing map and safety-net analysis remain accurate and load-bearing; its *narrowing to (C) FUSE-read vs (D) fal-edit* does NOT explain the Jul-2 wedge (different failure signature: there RPCs worked; here the channel is dead). Its Jun-13/Jun-19 incidents are plausibly the memory-pin wedge too (same account, warm long-lived container, `getProcessLogs keeps succeeding` early in the window is consistent with a channel that died *later*), but that's retrodiction, not proof.
- **Memory file `project_followup_hang_reference_images.md`** updated to point here; the "reference follow-ups wedge the agent" framing is retired.
- **CLAUDE.md gotcha to add when we next touch it:** sandbox = 1 vCPU/6 GiB; container memory-pin wedge presents as all-RPC 60 s timeouts with a "healthy" instance; recovery = fresh sandbox ID, not retries.
