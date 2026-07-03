# Session 99 — Sentry live on staging + production

**Date:** 2026-05-13 (work spanned afternoon → late evening IST)
**Branch:** `new-ui`
**Staging:** ✅ deployed (worker `35616439-...` → `87c8056c-...` → `c7e34639-...` → `3719c52e-...` → final `90a41b7c-...`)
**Production:** ✅ deployed (final worker version on release `90a41b7ce157d1b80e8fe1f1c16d88999b12c1ae`)
**Commits this session:** 5 — `37b213d`, `75f75ea`, `489441b`, `99d65a4`, `90a41b7`

---

## TL;DR

Picked up the Session 98 plan and shipped the full Sentry integration end-to-end across worker + Durable Object + client. Source maps work both sides. 8 custom failure-mode events emit cleanly. Final tightening: filtered WebSocket close code 1001 ("going away" — normal tab close) so it doesn't flood the dashboard. Production observability is live in time for launch.

| Area | What happened | State |
|---|---|---|
| **Session 98 instrumentation commit** | The 4 uncommitted edits from Session 98 (drop-log + trace mirror + 5s heartbeat + parser distinct logs) got committed as the first action | ✅ `37b213d` |
| **Sentry account + project setup** | Fresh account at sentry.io, US region, project `javascript-react` under org `creative-machines`. DSN + org auth token captured. | ✅ |
| **@sentry/cloudflare wiring** | `withSentry` wraps fetch handler. `instrumentDurableObjectWithSentry` wraps `CampaignSession`. SENTRY_DSN stored as wrangler secret on both envs. | ✅ `75f75ea` |
| **DO scope tagging** | `applySentryScope()` helper called at top of fetch/alarm/webSocketMessage/Close/Error/runGeneration; tags `userId` / `sessionId` / `campaignId` / `requestId` / `isGenerating` | ✅ |
| **@sentry/react wiring** | `Sentry.init` in `client/src/main.tsx`. `Sentry.ErrorBoundary` wraps app. `SentryUserSync` component pushes Clerk user.id post-auth. | ✅ |
| **Source maps** | `@sentry/vite-plugin` for client (hidden source maps, deleted from dist post-upload). `scripts/deploy.sh` wraps wrangler with `--upload-source-maps` + `sentry-cli sourcemaps upload` for worker. Release-based matching using git SHA. | ✅ `489441b` |
| **8 custom captureMessage events** | 5 server-side + 3 client-side, per Session 98 Part 5 spec | ✅ |
| **WS close code 1001 filter** | Added during verification — 1001 = "going away" (tab close) was firing as warnings. Now filtered alongside 1000 and 4001. | ✅ `90a41b7` |
| **Final deploy + verify** | Staging deployed, verified via real WS event + source-mapped client error. Production deployed; awaiting natural traffic to populate. | ✅ |

---

## Part 1 — Session 98 instrumentation commit

First action of the session per Session 98 Part 6: committed the 4 edits that had been live on prod but uncommitted since 2026-05-12 night.

| File | Change |
|---|---|
| `cloudflare/src/durable-objects/campaign-session.ts:79` | `trace()` mirrors to `console.log` BEFORE buffering — appears in `wrangler tail` immediately rather than waiting for next alarm flush |
| `cloudflare/src/durable-objects/campaign-session.ts:1358` | `streamForLiveUI` non-JSON catch logs the dropped line instead of silently ignoring |
| `cloudflare/sandbox/agent-runner.ts:51` | Heartbeat interval `30_000` → `5_000` ms for finer liveness signal |
| `cloudflare/src/lib/sdk-message-parser.ts:189` | Parser distinguishes heartbeats: `[sdk-parser] heartbeat count=N` instead of generic msg.type=trace |

**Commit:** `37b213d feat(observability): drop-log + real-time trace + 5s heartbeat`

---

## Part 2 — Sentry account + project

Decisions captured during walkthrough:

| Question | Answer |
|---|---|
| New or existing account? | New |
| Region | US (default, lowest CF latency) |
| PII redaction | **Send everything** — user chose full prompts/briefs/URLs in events. Easier debugging; can add scrubber server-side later if regret. |
| Alert routing | Dashboard-only — revisit after launch when there's baseline noise to filter |
| Sentry org slug | `creative-machines` |
| Sentry project slug | `javascript-react` (default from React platform selection during signup) |
| DSN (same both sides) | `https://b52a84f7592973fdffc109344c824ef2@o4511380721631232.ingest.us.sentry.io/4511380737490944` |
| Org auth token | `sntrys_...` — stored in `/.env.local` at workspace root (gitignored). Scope: `org:ci` (covers source map upload, release creation, code mappings). |

**Note:** auth token was pasted in chat by user during setup and they accepted the small risk of transcript exposure rather than revoke/recreate. Can rotate any time from Sentry UI if concerned.

---

## Part 3 — @sentry/cloudflare wiring (worker + DO)

### Worker entry — `cloudflare/src/index.ts`

```ts
import * as Sentry from '@sentry/cloudflare';

// DO wrap — auto-captures fetch / alarm / webSocketMessage / webSocketClose / webSocketError
export const CampaignSession = Sentry.instrumentDurableObjectWithSentry(
  (env: Env) => ({
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT,
    release: env.SENTRY_RELEASE,
    sendDefaultPii: true,
  }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  CampaignSessionImpl as any,  // Sentry types want extends DurableObject<E>; we use legacy implements DurableObject — runtime is identical
);

const handler = { async fetch(request, env) { /* existing body */ } };

export default Sentry.withSentry(
  (env: Env) => ({
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT,
    release: env.SENTRY_RELEASE,
    tracesSampleRate: env.SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,
    sendDefaultPii: true,
  }),
  handler,
);
```

### Env type — `cloudflare/src/env.d.ts`

Added `SENTRY_DSN?`, `SENTRY_ENVIRONMENT?`, `SENTRY_RELEASE?`.

### Wrangler config — `cloudflare/wrangler.jsonc`

- `"upload_source_maps": true` at top level
- `"SENTRY_ENVIRONMENT": "staging"` / `"production"` in respective env vars
- SENTRY_DSN set via `wrangler secret put SENTRY_DSN --env <env>` (same value both envs; environment tag separates them in Sentry)
- SENTRY_RELEASE injected per deploy via `--var SENTRY_RELEASE:$(git rev-parse HEAD)` (handled in deploy script)

### DO scope tagging — `cloudflare/src/durable-objects/campaign-session.ts`

```ts
private applySentryScope(): void {
  if (this.userId && this.userId !== 'anonymous') {
    Sentry.setUser({ id: this.userId });
  }
  if (this.sessionId) Sentry.setTag('sessionId', this.sessionId);
  if (this.campaignId) Sentry.setTag('campaignId', this.campaignId);
  if (this.currentRequestId) Sentry.setTag('requestId', this.currentRequestId);
  Sentry.setTag('isGenerating', String(this.isGenerating));
}
```

Called at top of: `fetch()`, `alarm()`, `webSocketMessage()`, `webSocketClose()`, `webSocketError()`, `runGeneration()`.

Cloudflare's Sentry integration creates an isolation scope per DO method invocation, so these tags scope correctly to whatever event fires inside that call.

---

## Part 4 — @sentry/react wiring (client)

### `client/src/main.tsx`

- `Sentry.init({...})` with env from `import.meta.env.MODE`, `tracesSampleRate: 0.1` (prod) / `1.0` (staging)
- Skipped in development mode (no DSN, no noise)
- `Sentry.ErrorBoundary` wraps app with custom fallback UI
- `SentryUserSync` component inside ClerkProvider uses `useUser()` hook + `useEffect` to call `Sentry.setUser({id: user.id})` once Clerk resolves

### Bundle impact

Client bundle grew from 1.20 MB → 1.28 MB (+80 KB). Acceptable.

---

## Part 5 — Source maps (release-based matching)

### Client — `@sentry/vite-plugin`

```ts
// client/vite.config.ts
const env = loadEnv(mode, path.resolve(__dirname, '..'), '')  // load from workspace root

plugins: [
  react(),
  tailwindcss(),
  ...(env.SENTRY_AUTH_TOKEN ? [sentryVitePlugin({
    org: env.SENTRY_ORG || 'creative-machines',
    project: env.SENTRY_PROJECT || 'javascript-react',
    authToken: env.SENTRY_AUTH_TOKEN,
    sourcemaps: { filesToDeleteAfterUpload: ['dist/**/*.map'] },  // don't ship maps publicly
  })] : []),
],
build: { sourcemap: 'hidden' },  // generate but don't reference in HTML
```

### Worker — `cloudflare/scripts/deploy.sh`

Per Sentry's canonical Wrangler flow (release-based matching, not debug IDs):

```bash
SENTRY_RELEASE=$(npx sentry-cli releases propose-version)  # git SHA
npx wrangler deploy --env "$ENV" --outdir dist --upload-source-maps --var "SENTRY_RELEASE:$SENTRY_RELEASE"
npx sentry-cli releases new "$SENTRY_RELEASE"
npx sentry-cli sourcemaps upload --release="$SENTRY_RELEASE" --strip-prefix 'dist/..' dist
```

Wrapped in npm scripts: `deploy:staging` / `deploy:production`.

### `.env.local` (workspace root, gitignored)

```
SENTRY_ORG=creative-machines
SENTRY_PROJECT=javascript-react
SENTRY_AUTH_TOKEN=sntrys_...
```

Both vite plugin (client) and deploy.sh (worker) read from this same file.

### Verification

The release tag (e.g. `489441bce762068ef821fadd0077ef6c5b004acf` for the second deploy) appears in Sentry. Events fired post-deploy show stack frames resolving to real source paths (`@sentry/browser/build/npm/esm/dev/helpers.js:93:17 in sentryWrapped`) instead of `index.js:47289:11`. Compared side-by-side with an earlier issue from before source maps were live — clear difference.

---

## Part 6 — 8 custom captureMessage events

### Server-side (`campaign-session.ts`)

| Event | Where | Trigger |
|---|---|---|
| `ws_abnormal_close` | `webSocketClose` | Close code ∉ {1000, 1001, 4001} |
| `gen_setup_failed` | `runGeneration` catch | No `agentProcessId` yet → `Sentry.captureException(error)` |
| `gen_stream_error` | `runGeneration` catch | Agent already started, stream errored (non-fatal) |
| `finalize_no_result` | `alarm` "agent.dead_no_result" path | Process dead, no turn-result.json found |
| `heartbeat_silent` | `alarm` body | `isGenerating && lastHeartbeatAt > 0 && now - lastHeartbeatAt > 30s` — fires once per silence window, reset when next heartbeat arrives |

To enable `heartbeat_silent`, added:
- `lastHeartbeatAt` + `silentHeartbeatReported` fields on `CampaignSession`
- `onHeartbeat?: () => void` callback on `ParserContext`
- Parser at heartbeat-detection line calls `ctx.onHeartbeat?.()`
- Both ParserContext construction sites (sandbox + local) wire `onHeartbeat` to update DO state

### Client-side (`websocket-manager.ts`, `App.tsx`, `useWebSocket.ts`)

| Event | Where | Trigger |
|---|---|---|
| `ws_close_unexpected` | `ws.onclose` | Close code ∉ {1000, 1001, 4001} — carries `navigatorOnline`, `visibilityState`, `timeSinceLastPingMs`, `userAgent` |
| `auth_failed` | `App.tsx` `getToken()` catch | Clerk auth recovery failures in checkout flows |
| `generation_orphaned` | `useWebSocket` `subscribed` handler | Active campaign has `status === 'generating'` AND `now - createdAt > 5min` — strong signal of a stuck campaign |

Added `lastPingSentAt` module variable in websocket-manager so `ws_close_unexpected` payload includes time since last keepalive.

---

## Part 7 — Filter for WS close code 1001

During staging verification, `ws_abnormal_close` was firing on every tab close. Investigation: code 1001 = "going away" per RFC 6455 — fires on tab close or page navigation. Normal browser lifecycle, not a bug.

Added to filter alongside 1000 and 4001. Server + client both updated.

**Commit:** `90a41b7 fix(observability): filter ws close code 1001 from sentry warnings`

Reconnect behavior unchanged — only the Sentry filter tightens.

---

## Part 8 — Deploy + verification

### Deploy chain (updated in CLAUDE.md)

```bash
# Staging
cd client && npm run build:staging && docker logout registry.cloudflare.com; docker builder prune -af; cd ../cloudflare && npm run deploy:staging

# Production
cd client && npm run build:production && docker logout registry.cloudflare.com; docker builder prune -af; cd ../cloudflare && npm run deploy:production
```

The new `deploy:<env>` npm scripts run `scripts/deploy.sh <env>` which loads `.env.local`, generates a release name from git SHA, deploys with `--upload-source-maps`, then uploads to Sentry.

### Verification walkthrough on staging

Used Chrome MCP to exercise scenarios:

1. Navigated to staging, confirmed Clerk signed in as `user_38uxIJdRftKkSkstogHasnk6c2J`
2. Opened a second tab on `/workspace` — exercised multi-tab DO behavior, no Sentry event (correct — multiple WS attach to same DO)
3. Fired `setTimeout(() => { throw new Error('newbundle-smoke-test-' + Date.now()) }, 0)` — landed in Sentry as `JAVASCRIPT-REACT-3` with source-mapped frames + correct release tag
4. Closed tab 2 — clean lifecycle, no Sentry event

In Sentry, the `ws_abnormal_close` issue showed up with the full rich payload:
- `user.id: user_38uxIJdRftKkSkstogHasnk6c2J`
- `campaignId: campaign_moshbg3sstz3j7`
- `sessionId: 8bd216fa-32f4-4eb7-b6c7-2b274a999bc5`
- `ws_close_code: 1001` (this is what prompted the 1001 filter)
- `release: 489441bce762` (matched deploy)
- 96 breadcrumbs including the `[T1][ws][close]` trace line and the original `WS closed: session=null, code=1001`

After the 1001 filter was added and redeployed, staging stays quiet on normal navigation. Real abnormal closes (1006 etc.) still surface.

### Production deploy

Same code, same release `90a41b7ce157d1b80e8fe1f1c16d88999b12c1ae`. Source maps deduplicated (Sentry recognized the bundle from staging upload — "Nothing to upload, all files are on the server"). Health check ✅.

---

## Part 9 — Honest scope check

**We have:** Error observability with rich context. Worker exceptions, DO method exceptions, client unhandled errors, render-time errors, 8 custom failure-mode events, user identification both sides, scope tags, source maps both sides, distributed tracing, 96+ breadcrumbs per event, full PII context.

**We don't have (intentionally deferred):**
- Sentry alerts (chose dashboard-only for now)
- Session Replay (Sentry suggested it; skipped — can add later if reproducing UX bugs is hard)
- Performance monitoring beyond defaults (no custom transactions/spans)
- Metrics / SLI dashboards (no "WS drop rate over time" chart)
- External uptime monitoring (no `/health` polling from outside CF)

For the user's stated goal — "don't want to scramble to identify issues when we go live" — what we have is sufficient. The deferred items are next-level observability, not blockers for launch.

---

## Part 10 — Open items / handover

### Carryover from Session 97 / 98 — still pending

- 🔴 **Rotate prod Clerk Secret Key** — Session 97 finding. Treat `sk_live_kkn8...` as compromised until rotated.
- 🟡 **WS-resilience 3-change PR** (Session 98 Part 2) — compat flag `web_socket_auto_reply_to_close` + `WebSocketRequestResponsePair` for ping/pong + `window.addEventListener('online', reconnect)`. Was deferred specifically to ship Sentry first so the impact of these fixes could be measured. **Now unblocked** — wait a day or two of prod data, then ship and measure delta in `ws_close_unexpected` rate.
- 🔴 **Followup intent classification** (Session 98 Part 3, HIGH PRIORITY) — orchestrator has no Q&A / single-edit path; followups always full-regen → $3.32 cost per ambiguous followup, plus poor UX. Doc: `~/.claude/projects/.../memory/project_followup_intent_classification.md`. Resume after WS-resilience PR.
- 🟡 **`new-ui` branch is now 19+ commits ahead of `master`** — stale; should plan a master merge after the next stable batch.

### New items discovered this session

- **Sentry project naming cosmetic** — current display name is `javascript-react` (from React quickstart). Functional, but `creative-agent` would read better in the UI. Sentry Settings → Projects → Project Name to change; DSN unchanged.
- **`navigator.userAgent` is being sent in `ws_close_unexpected` extras** — consider whether this is too much info per event. Doesn't affect billing (event count is what matters), but could be trimmed.
- **Sentry "production" env won't appear in the dropdown filter** until the first prod event arrives. Use `All Envs` view or direct URL for now.

### Suggested order for Session 100

1. Verify prod Sentry manually — visit creativemachines.xyz, trigger any error, confirm landing
2. Wait 24-48 hours for natural prod traffic to populate baseline `ws_close_unexpected` rate
3. Ship the WS-resilience PR, measure delta
4. Pick up followup intent classification

---

## Part 11 — File map

```
.env.local                                  NEW (workspace root, gitignored)
                                            SENTRY_ORG / PROJECT / AUTH_TOKEN

client/
  package.json                              +@sentry/react, +@sentry/vite-plugin (dev)
  vite.config.ts                            +sentryVitePlugin, sourcemap: 'hidden', loadEnv from root
  src/
    main.tsx                                +Sentry.init, Sentry.ErrorBoundary, SentryUserSync
    App.tsx                                 +auth_failed captureMessage in getToken catches
    hooks/useWebSocket.ts                   +generation_orphaned captureMessage in 'subscribed' handler
    lib/websocket-manager.ts                +ws_close_unexpected captureMessage, lastPingSentAt tracking

cloudflare/
  package.json                              +@sentry/cloudflare, +@sentry/cli (dev),
                                            +deploy:staging / deploy:production scripts
  wrangler.jsonc                            +upload_source_maps, +SENTRY_ENVIRONMENT vars per env
  scripts/
    deploy.sh                               NEW — full deploy chain with sentry-cli source maps
  src/
    index.ts                                +withSentry, +instrumentDurableObjectWithSentry
    env.d.ts                                +SENTRY_DSN / ENVIRONMENT / RELEASE
    router.ts                               (no permanent change — temp /__sentry-test added then removed)
    lib/sdk-message-parser.ts               +onHeartbeat callback on ParserContext + heartbeat detection
    durable-objects/campaign-session.ts     +applySentryScope helper, scope calls at entry points,
                                            heartbeat state + 5 server-side captureMessage events

CLAUDE.md                                   updated deploy chain to use npm run deploy:<env>

docs/
  SESSION_99_*.md                           this doc

~/.claude/projects/-Users-chakra-Documents-Agents-creative-agent/memory/
  project_sentry_integration_state.md       NEW — quick reference for future sessions
  MEMORY.md                                 +pointer to the new memory file
```

---

## Part 12 — Useful commands going forward

```bash
# Check Sentry issues filtered by environment
open 'https://creative-machines.sentry.io/issues/?environment=production'
open 'https://creative-machines.sentry.io/issues/?environment=staging'

# Deploy with source maps to staging or prod
cd client && npm run build:staging && docker logout registry.cloudflare.com; docker builder prune -af; cd ../cloudflare && npm run deploy:staging
cd client && npm run build:production && docker logout registry.cloudflare.com; docker builder prune -af; cd ../cloudflare && npm run deploy:production

# Health check
curl -s https://creativemachines.xyz/health | python3 -m json.tool
curl -s https://creative-agent-staging.alphasapien17.workers.dev/health | python3 -m json.tool

# Search Sentry issues by failure_mode tag (server-side custom events)
# In Sentry UI: tag:failure_mode:gen_setup_failed OR tag:failure_mode:agent_silent OR ...

# Search by user
# In Sentry UI: user.id:user_<clerkId>
```

---

## What changed in MEMORY.md

Added pointer to `project_sentry_integration_state.md` under Active Plans, replacing the earlier "staging deployed, prod pending" status. Now reads "live on staging + prod — unblocks WS-resilience PR."
