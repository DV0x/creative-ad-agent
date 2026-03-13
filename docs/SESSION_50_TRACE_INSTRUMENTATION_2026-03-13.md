# Session 50: End-to-End Trace Instrumentation

**Date**: 2026-03-13
**Branch**: `new-ui`
**Previous session**: Session 49 (Stuck Generation Investigation)
**Status**: Deployed (`185e4c1a`) — pending test with `wrangler tail`

---

## Goal

Session 49 revealed a 28-minute blind spot where the alarm stopped firing and we had zero visibility into what happened. Rather than guessing the root cause and applying fixes, this session adds **pure observability** — structured trace logging across every layer of the pipeline so `wrangler tail` becomes a single pane of glass.

**No behavior changes. No fixes. Just logging.**

---

## What Was Deployed

Container image: `185e4c1a`
Deploy time: ~2026-03-13 05:23 UTC

### Files Changed

| File | Changes |
|------|---------|
| `cloudflare/src/durable-objects/campaign-session.ts` | 78 trace points, `trace()` helper, `timedRPC()` helper, `getProcessLogs()` relay in alarm |
| `cloudflare/sandbox/agent-runner.ts` | 13 trace points, `trace()` function, 30s heartbeat interval |
| `cloudflare/src/index.ts` | 6 trace points for request routing |

---

## Instrumentation Architecture

### Trace Format

**DO-side** (appears in `wrangler tail` via `this.log()` + alarm flush):
```
[T{seq}][{component}][{action}] cid={campaignId} key=value key=value ...
```

**Container-side** (written to stdout, relayed by alarm via `getProcessLogs()`):
```json
{"type":"trace","component":"agent","action":"phase","phase":"research","ts":1710300000000,"cid":"campaign_xxx"}
```

**Worker-side** (appears directly in `wrangler tail`):
```
[trace][worker][ws_upgrade] method=GET
[trace][worker][api] method=GET path=/api/campaigns
```

### Two-Layer Relay

```
Container stdout  ──→  streamForLiveUI() (while alive)  ──→  wrangler tail
                  ──→  getProcessLogs() (alarm, every 10s) ──→  this.log() ──→  wrangler tail
```

When the live stream dies (the Session 49 failure), the alarm's `getProcessLogs()` call picks up where the stream left off. It reads the full stdout, compares against `lastContainerLogLen`, and relays the last 3 new lines through `this.log()`. This closes the blind spot.

---

## Trace Coverage Map

### Layer 1: Worker Entry (`index.ts`)

| Trace Point | What It Shows |
|-------------|---------------|
| `[trace][worker][ws_upgrade]` | WS upgrade request received |
| `[trace][worker][ws_auth]` | Auth result (userId or null) |
| `[trace][worker][ws_rejected]` | Auth failure |
| `[trace][worker][ws_forward]` | DO forwarding with userId |
| `[trace][worker][api]` | REST API request (method + path) |
| `[trace][worker][api_done]` | REST API response (status code) |

### Layer 2: Durable Object (`campaign-session.ts`)

#### DO Lifecycle
| Trace Point | What It Shows |
|-------------|---------------|
| `[do][fetch]` | Request received — userId, path, upgrade header |
| `[do][ws.accepted]` | WebSocket accepted — total WS count |
| `[ws][message]` | Client message — type, isGenerating, sessionId |
| `[ws][close]` | WS closed — code, reason, remaining WS count |
| `[ws][error]` | WS error — error message |

#### Alarm Handler (THE blind spot fix)
| Trace Point | What It Shows |
|-------------|---------------|
| `[alarm][enter]` | State dump: iter, gen, cid, sandbox, agent, ageSec, userId, wsCount |
| `[alarm][restoreSession.needed]` | DO was reset, restoring from storage |
| `[alarm][exit.noop]` | Not generating, alarm self-terminates |
| `[alarm][safetyNet.triggered]` | 2h max age exceeded |
| `[alarm][sandbox.reconnect]` | Reconnecting to sandbox after DO reset |
| `[alarm][sandbox.reconnected]` | Sandbox handle obtained |
| `[alarm][agentCheck]` | Process alive/dead, status, process count |
| `[alarm][exit.finalized_after_crash]` | Agent died but turn-result.json found |
| `[alarm][agent.dead_no_result]` | Agent died, no completion — marking incomplete |
| `[alarm][exit.incomplete]` | Campaign marked incomplete |
| `[alarm][listProcesses.catch]` | listProcesses() RPC failed |
| `[alarm][containerLogs]` | New container stdout relayed (newBytes, totalLines) |
| `[alarm][containerLogs.noNew]` | No new stdout since last check |
| `[alarm][getProcessLogs.catch]` | getProcessLogs() RPC failed |
| `[alarm][exit.finalized]` | turn-result.json found, finalized |
| `[alarm][no_sandbox]` | No sandbox available |
| `[alarm][reschedule]` | Next alarm set (10s) |
| `[alarm][exit.ok]` | Normal exit with duration |
| `[alarm][exit.error]` | Error exit with error message |
| `[alarm][reschedule.afterError]` | Rescheduled after error |
| `[alarm][reschedule.failed]` | setAlarm() itself failed |

#### Container Log Relay (in alarm)
| Trace Point | What It Shows |
|-------------|---------------|
| `[container][log]` | Parsed JSON from agent stdout — type + subtype |
| `[container][log.raw]` | Non-JSON line from agent stdout (truncated) |

#### RPC Timing (all sandbox calls)
| Trace Point | What It Shows |
|-------------|---------------|
| `[rpc][{label}.start]` | RPC call initiated |
| `[rpc][{label}.done]` | RPC completed — duration in ms |
| `[rpc][{label}.error]` | RPC failed — duration + error |

Labels: `listProcesses`, `getProcessLogs`, `readTurnResult`, `cleanupProcesses`, `killAgent`, `unmountBucket`, `cleanFuse`, `mountBucket`, `cleanAuthCache`, `preflight`, `cleanWorkspace`, `startProcess`, `streamProcessLogs`, `writePromptFile`

#### Message Handlers
| Trace Point | What It Shows |
|-------------|---------------|
| `[handler][generate.enter]` | Prompt length, sessionId, asset count |
| `[handler][generate.blocked]` | Already generating |
| `[handler][generate.fireAndForget]` | Generation started (sessionId, campaignId) |
| `[handler][generate.unhandledError]` | Uncaught error from runGeneration |
| `[handler][followUp.enter]` | Prompt length, campaignId, asset count |
| `[handler][followUp.blocked]` | Already generating |
| `[handler][followUp.pathCheck]` | Agent alive? Fast vs slow path decision |
| `[handler][followUp.fastPath]` | Taking fast path |
| `[handler][followUp.fastPath.error]` | Fast path error |
| `[handler][followUp.slowPath]` | Falling back to slow path |
| `[handler][cancel.enter]` | Has abort controller, sessionId |
| `[handler][subscribe.enter]` | SessionId, lastEventId, hasEvents, isGenerating |
| `[handler][subscribe.doReset]` | DO was reset (empty event buffer) |
| `[handler][subscribe.notFound]` | Session not found after restore attempt |
| `[handler][subscribe.d1Check]` | D1 campaign status after restore |
| `[handler][subscribe.stale]` | Stale session cleared |
| `[handler][subscribe.restartAlarm]` | Alarm restarted after DO reset |
| `[handler][subscribe.d1Error]` | D1 check failed |
| `[handler][subscribe.restoredFromStorage]` | Session restored from DO storage |
| `[handler][subscribe.replay]` | Events replayed to client (count) |

#### Setup Pipeline
| Trace Point | What It Shows |
|-------------|---------------|
| `[setup][enter]` | SessionId, hasSdkSession, userId |
| `[setup][killAgent]` | Killing previous agent (attempt #) |
| `[setup][cleanMount]` | Cleaning stale R2 mount (attempt #) |
| `[setup][mountR2]` | Mounting R2 bucket (attempt #) |
| `[setup][preflight]` | Testing Anthropic API from sandbox |
| `[setup][preflight.result]` | API test output (first 200 chars) |
| `[setup][preflight.ok]` | API test passed |
| `[setup][preflight.blocked]` | IP blocked, retrying |
| `[setup][preflight.allBlocked]` | All retries IP blocked |
| `[setup][cleanWorkspace]` | Cleaning workspace files |
| `[setup][startProcess]` | Starting agent-runner |
| `[setup][agentStarted]` | Agent running — processId, pid, total setup ms |

#### Stream Lifecycle
| Trace Point | What It Shows |
|-------------|---------------|
| `[stream][enter]` | Label, skipRequestId |
| `[stream][exit]` | Lines processed, duration, cancelled |

#### Generation Flow
| Trace Point | What It Shows |
|-------------|---------------|
| `[gen][enter]` | SessionId, hasSdkSession, promptLen |
| `[gen][streamProcessLogs.start]` | Starting log stream |
| `[gen][cancelled]` | Generation cancelled |
| `[gen][streamError.nonFatal]` | Stream died but agent alive (alarm takes over) |
| `[gen][setupError.fatal]` | Setup failed, no agent started |
| `[gen][finally.cancelled]` | Cleanup after cancel |
| `[gen][exit]` | Duration, wasCancelled |
| `[gen-fast][enter]` | Fast follow-up started |
| `[gen-fast][requestId]` | Unique turn ID |
| `[gen-fast][promptWritten]` | Prompt file written to sandbox |
| `[gen-fast][cancelled]` | Follow-up cancelled |
| `[gen-fast][streamError.nonFatal]` | Stream died, alarm takes over |
| `[gen-fast][error.fatal]` | Fatal error, no agent |
| `[gen-fast][finally.cancelled]` | Cleanup |
| `[gen-fast][exit]` | Duration, wasCancelled |

#### Session Persistence
| Trace Point | What It Shows |
|-------------|---------------|
| `[session][persist]` | isGenerating, currentRequestId |
| `[session][restore.userId]` | userId restored from storage |
| `[session][restore.agentProcessId]` | agentProcessId restored |
| `[session][restore.found]` | Full session restored — session, campaign, gen, userId |

#### Finalization
| Trace Point | What It Shows |
|-------------|---------------|
| `[finalize][staleResult]` | turn-result.json has wrong requestId |
| `[finalize][found]` | turn-result.json parsed — image count, file count |
| `[finalize][complete]` | Campaign finalized — images added, files reconciled |

#### Event Emission
| Trace Point | What It Shows |
|-------------|---------------|
| `[emit][{eventType}]` | Event emitted — eventId, WS count |

### Layer 3: Container (`agent-runner.ts`)

| Trace Point | What It Shows |
|-------------|---------------|
| `startup` | sessionId, campaignId, resumeSdkSessionId, promptLen |
| `sdk_init` | SDK session ID captured |
| `phase` | Phase detected — research, hooks, art_direction, images (with tool name) |
| `file_write` | Research/hooks/prompts file written (type + path) |
| `heartbeat` | Every 30s — count, sdkSessionId, currentRequestId |
| `turn_end` | Turn completed — requestId, textLen, block count |
| `waiting_for_prompt` | Agent idle, polling for next prompt file |
| `prompt_received` | Follow-up prompt received — requestId, campaignId, promptLen |
| `shutdown` | Generator ended (null data or shutdown signal) |
| `fatal_error` | Uncaught error — message + stack trace |
| `exit` | Clean exit — sdkSessionId |

---

## Expected Trace Timeline (Normal Generation)

```
[trace][worker][ws_upgrade]               ← Browser connects
[trace][worker][ws_auth] userId=user_xxx
[trace][worker][ws_forward] userId=user_xxx
[T1][do][fetch] userId=user_xxx
[T2][do][ws.accepted] wsCount=1
[T3][ws][message] type=subscribe
[T4][handler][subscribe.enter]
[T5][handler][subscribe.replay] eventCount=0
[T6][ws][message] type=generate
[T7][handler][generate.enter] promptLen=45
[T8][session][persist] gen=true
[T9][emit][ack] eventId=1 wsCount=1
[T10][emit][phase] eventId=2 wsCount=1
[T11][handler][generate.fireAndForget]
                                          ← handler returns, DO free for pings
[T12][alarm][enter] iter=1 gen=true sandbox=false agent=null
[T13][alarm][exit.noop]                   ← too early, setup not done yet
[T14][gen][enter] sessionId=ws-xxx
[T15][setup][enter]
[T16][rpc][cleanupProcesses.start]
[T17][rpc][cleanupProcesses.done] ms=150
[T18][setup][killAgent] attempt=1
[T19][rpc][killAgent.start]
[T20][rpc][killAgent.done] ms=200
[T21][setup][cleanMount] attempt=1
[T22][rpc][unmountBucket.start]
[T23][rpc][unmountBucket.done] ms=300
[T24][setup][mountR2] attempt=1
[T25][rpc][mountBucket.start]
[T26][rpc][mountBucket.done] ms=1200
[T27][setup][preflight] attempt=1
[T28][rpc][preflight.start]
[T29][rpc][preflight.done] ms=8000
[T30][setup][preflight.ok] attempt=1
[T31][setup][cleanWorkspace]
[T32][setup][startProcess]
[T33][rpc][startProcess.start]
[T34][rpc][startProcess.done] ms=500
[T35][setup][agentStarted] processId=proc_xxx pid=1234 ms=12000
                                          ← setup done, streaming starts
[T36][gen][streamProcessLogs.start]
[T37][rpc][streamProcessLogs.start]
[T38][rpc][streamProcessLogs.done] ms=100
[T39][stream][enter] label=gen

                                          ← alarm fires every 10s during generation
[T40][alarm][enter] iter=2 gen=true sandbox=true agent=proc_xxx ageSec=20
[T41][rpc][listProcesses.start]
[T42][rpc][listProcesses.done] ms=89
[T43][alarm][agentCheck] alive=true status=running
[T44][rpc][getProcessLogs.start]
[T45][rpc][getProcessLogs.done] ms=120
[T46][container][log] type=trace action=startup
[T47][container][log] type=trace action=sdk_init
[T48][alarm][containerLogs] newBytes=4200 totalLines=15
[T49][alarm][reschedule] nextIn=10000
[T50][alarm][exit.ok] iter=2 ms=312

... (alarm repeats every 10s, relaying container logs)

[T80][container][log] type=trace action=phase phase=research
[T90][container][log] type=trace action=heartbeat count=4
[T100][container][log] type=trace action=phase phase=hooks
[T110][container][log] type=trace action=phase phase=images
[T120][container][log] type=trace action=turn_end

                                          ← stream may die here (Session 49 pattern)
[T121][stream][exit] label=gen lines=500 ms=180000
[T122][gen][streamError.nonFatal]         ← or gen.exit if clean
[T123][emit][status] "Live updates paused"

                                          ← alarm takes over completion detection
[T130][alarm][enter] iter=20 gen=true sandbox=true agent=proc_xxx ageSec=200
[T131][rpc][listProcesses.done] ms=80
[T132][alarm][agentCheck] alive=true
[T133][rpc][getProcessLogs.done] ms=100
[T134][container][log] type=trace action=turn_end  ← see completion even without stream!
[T135][rpc][readTurnResult.start]
[T136][rpc][readTurnResult.done] ms=150
[T137][finalize][found] images=6 files=3
[T138][finalize][complete] imagesAdded=6
[T139][emit][complete] wsCount=1
[T140][alarm][exit.finalized] ms=800
```

---

## What to Look For in Test

### 1. Does the alarm keep firing?
Look for consecutive `[alarm][enter]` with incrementing `iter`. If the sequence stops, that's the bug.

### 2. Do RPC calls hang?
Check `[rpc][*.start]` → `[rpc][*.done]` pairs. If a `.start` has no matching `.done`, the RPC hung.

### 3. Does the container stay alive?
Look for `[container][log] type=trace action=heartbeat`. These fire every 30s from the agent. If they stop, the agent died.

### 4. Does the WS die?
Look for `[ws][close]` with `code=1006`. Check what happened immediately before it.

### 5. Does setAlarm fail?
Look for `[alarm][reschedule.failed]`. This would explain why the alarm chain broke.

### 6. Does the DO reset?
Look for `[alarm][restoreSession.needed]` or `[handler][subscribe.doReset]`. These indicate a DO code update reset.

---

## Investigation Plan for Next Session

1. **Run `wrangler tail` in a terminal**:
   ```bash
   cd cloudflare && npx wrangler tail creative-agent --format pretty
   ```

2. **Trigger a generation** in the browser (https://creative-agent.alphasapien17.workers.dev)

3. **Keep tail open for the ENTIRE generation** (5-15 min) — do NOT close it

4. **After completion (or failure), save the full tail output** and analyze:
   - Every alarm iteration and its duration
   - Every RPC call and its duration
   - Container log relay — what phases the agent went through
   - WS lifecycle — when it opened, when it closed, why
   - Stream lifecycle — when it started, when it ended, why

5. **If generation succeeds**: We have a baseline trace. Compare future failures against it.

6. **If generation fails/stucks**: The traces will show exactly where the chain broke — which RPC hung, which alarm didn't reschedule, which branch was taken.

---

## New Instance Variables Added

| Variable | Type | Purpose |
|----------|------|---------|
| `traceSeq` | `number` | Monotonic counter for trace ordering |
| `alarmIteration` | `number` | How many times alarm has fired this generation |
| `lastContainerLogLen` | `number` | Tracks how much container stdout has been relayed |

## New Helper Methods Added

| Method | Purpose |
|--------|---------|
| `trace(component, action, data?)` | Structured trace logging via `this.log()` |
| `timedRPC(label, fn)` | Wraps sandbox RPC with start/done/error traces + ms timing |

## New Container Features

| Feature | Purpose |
|---------|---------|
| `trace()` function | Structured JSON trace lines to stdout |
| 30s heartbeat interval | Proves agent is alive even during long API calls |
| Phase detection traces | Shows which generation phase the agent is in |

---

## Key Design Decisions

1. **`getProcessLogs()` in alarm instead of a log file**: The SDK provides `getProcessLogs()` which returns the full stdout as a string. We track `lastContainerLogLen` and only relay new content. This avoids creating a separate log file on disk and uses the SDK's native observability mechanism.

2. **Trace via `this.log()` not `console.log()`**: Background promises (fire-and-forget generation) can't use `console.log()` directly — it won't appear in `wrangler tail`. The existing `tailLogs[]` buffer + alarm `flushTailLogs()` pattern makes traces visible.

3. **No behavior changes**: Deliberately avoided adding timeouts, alarm-first rescheduling, or any fixes. The goal is evidence first, fixes second. The only new SDK call is `getProcessLogs()` which is read-only.

4. **30s heartbeat in agent-runner**: Even during a 3-minute API call where no SDK messages flow, the heartbeat writes to stdout every 30s. The alarm's `getProcessLogs()` relay picks this up, proving the agent is alive.
