# Usage Tracking & Credit System — Implementation Plan

> Created: 2026-04-03 | Updated: 2026-04-03 | Status: Approved, not yet implemented

## Context

Users currently generate campaigns with no cost tracking or limits. We need to:
1. Track actual cost per generation (Claude API + fal.ai images)
2. Maintain a credit balance per user
3. Pre-flight check `balance > 0` before every generation/follow-up
4. Deduct actual cost after successful completion
5. Block next generation if balance goes negative

**Billing model:** Deduct actual cost after completion. Only charge on success — cancelled/failed generations are free (user gets no output). Max possible overdraft ~$1.50.

**Cost per generation:** ~$0.48 Claude API + ~$0.90 fal.ai (6 images) = ~$1.39 total. Follow-ups: ~$0.15-0.50.

---

## Phase 1: Cost Instrumentation (agent-runner → turn-result.json)

### File: `cloudflare/sandbox/agent-runner.ts`

**What:** Capture `total_cost_usd`, token counts, and duration from the SDK `result` message and include them in `turn-result.json`.

**Where:** Inside `if (message.type === 'result')` block (around line 350).

**Change:** Extract cost fields from the result message and pass to `writeCompletionMarker()`:

```typescript
if (message.type === 'result') {
  const costData = {
    totalCostUsd: (message as any).total_cost_usd ?? 0,
    inputTokens: (message as any).usage?.input_tokens ?? 0,
    outputTokens: (message as any).usage?.output_tokens ?? 0,
    numTurns: (message as any).num_turns ?? 0,
    durationMs: (message as any).duration_ms ?? 0,
  };
  // ... existing block handling ...
  writeCompletionMarker(blocks, text, costData);
}
```

**Update `writeCompletionMarker()`** (around line 207) to accept and write cost data:

```typescript
function writeCompletionMarker(blocks, text, costData?) {
  // ... existing logic ...
  fs.writeFileSync('/app/turn-result.json', JSON.stringify({
    images, files, text, blocks, requestId, campaignId,
    cost: costData ?? null,   // ← NEW
  }));
}
```

**Also add `maxBudgetUsd: 3.0`** to `baseOptions` (around line 96) as a safety cap.

### SDK `result` message fields available:
- `total_cost_usd` — cumulative cost for entire query()
- `usage.input_tokens`, `usage.output_tokens` — token counts
- `usage.cache_read_input_tokens`, `usage.cache_creation_input_tokens` — cache stats
- `num_turns` — total turns used
- `duration_ms` — wall clock time
- `duration_api_ms` — time in API calls only
- `modelUsage` — per-model breakdown with `costUSD`

---

## Phase 2: D1 Schema — Two New Tables

### File: `cloudflare/schema.sql`

```sql
CREATE TABLE IF NOT EXISTS user_credits (
  user_id TEXT PRIMARY KEY,
  balance_usd REAL NOT NULL DEFAULT 0,
  total_spent_usd REAL NOT NULL DEFAULT 0,
  total_generations INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS usage_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  request_id TEXT NOT NULL DEFAULT 'initial',
  event_type TEXT NOT NULL,
  claude_cost_usd REAL NOT NULL DEFAULT 0,
  image_count INTEGER NOT NULL DEFAULT 0,
  image_cost_usd REAL NOT NULL DEFAULT 0,
  total_cost_usd REAL NOT NULL DEFAULT 0,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  num_turns INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(campaign_id, request_id)
);

CREATE INDEX IF NOT EXISTS idx_usage_log_user_id ON usage_log(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_log_campaign_id ON usage_log(campaign_id);
```

**`UNIQUE(campaign_id, request_id)`** prevents double-charge if `finalizeGeneration` runs twice for the same turn (e.g., DO crash recovery reads the same `turn-result.json`).

**Run migration on deployed D1:**
```bash
npx wrangler d1 execute creative-agent-db --remote --command="CREATE TABLE IF NOT EXISTS user_credits (...)"
npx wrangler d1 execute creative-agent-db --remote --command="CREATE TABLE IF NOT EXISTS usage_log (...)"
```

Same for production DB.

---

## Phase 3: DB Access Layer

### New file: `cloudflare/src/db/credits.ts`

Functions needed:

- **`getOrCreateCredits(db, userId)`** — Get user's credit record. If doesn't exist, INSERT with $5.00 default balance (free tier). Returns `{ balance_usd, total_spent_usd, total_generations }`.

- **`getBalance(db, userId)`** — Lightweight balance check. Calls `getOrCreateCredits` internally so new users are auto-provisioned. Returns `number`.

- **`recordUsage(db, userId, campaignId, usage)`** — Atomic deduction + logging via `db.batch()` (D1's batch API). INSERTs into `usage_log` and UPDATEs `user_credits` (balance, total_spent, total_generations) in a single batch. Uses `INSERT OR IGNORE` keyed on `UNIQUE(campaign_id, request_id)` to prevent double-charge — if the row already exists, the batch still succeeds but no duplicate is inserted and no extra deduction happens. Returns `{ newBalance, alreadyRecorded }`.

- **`addCredits(db, userId, amount)`** — Add credits (for future Stripe top-ups). Returns `{ newBalance }`.

### Update: `cloudflare/src/db/index.ts`
Export new functions from credits.ts.

### Mirror for local dev: `server/lib/db/credits.ts`
Same functions, synchronous (better-sqlite3). Also add the two new tables to `server/lib/database.ts` schema.

---

## Phase 4: Pre-Flight Check in DO

### File: `cloudflare/src/durable-objects/campaign-session.ts`

**In `handleGenerate()`** — at the TOP, right after `this.isGenerating = true` (around line 585), BEFORE campaign creation or any D1 writes:

```typescript
this.isGenerating = true;
this.generationStartedAt = Date.now();

// Pre-flight credit check — before any D1 writes to avoid orphan campaigns
const balance = await credits.getBalance(this.env.DB, this.userId);
if (balance <= 0) {
  this.isGenerating = false;
  this.emitEvent({
    type: 'error',
    timestamp: new Date().toISOString(),
    error: 'Insufficient credits. Please top up to continue.',
    code: 'INSUFFICIENT_CREDITS',
  });
  return;
}
```

**In `handleFollowUp()`** — after campaign lookup (to verify it exists) but BEFORE saving user message or updating status:

```typescript
// Look up campaign (existing code)
const campaign = await db.getCampaignById(this.env.DB, campaignId, this.userId);
if (!campaign) { ... }

// Pre-flight credit check — before saving message or updating status
const balance = await credits.getBalance(this.env.DB, this.userId);
if (balance <= 0) {
  this.isGenerating = false;
  this.emitEvent({
    type: 'error',
    timestamp: new Date().toISOString(),
    error: 'Insufficient credits. Please top up to continue.',
    code: 'INSUFFICIENT_CREDITS',
  });
  return;
}
```

**Why at the top:** No orphan campaigns, no orphan messages. User sees an error immediately and nothing is written to D1.

**Note:** First-time users auto-get $5.00 via `getOrCreateCredits()`. The pre-flight uses `getBalance()` which calls `getOrCreateCredits()` internally, so new users are auto-provisioned.

### Update `ServerMessage` type in `cloudflare/src/lib/types.ts`
Add `code?: string` to the `ServerMessage` interface and `'credits_update'` to the type union.

---

## Phase 5: Post-Generation Cost Deduction

### File: `cloudflare/src/durable-objects/campaign-session.ts`

**Update `turnResult` type** in `finalizeGeneration()` signature to include cost:

```typescript
private async finalizeGeneration(
  campaignId: string,
  sessionId: string,
  turnResult: {
    images?: any[];
    files?: Record<string, string>;
    text?: string;
    blocks?: any[];
    requestId?: string;
    cost?: {
      totalCostUsd: number;
      inputTokens: number;
      outputTokens: number;
      numTurns: number;
      durationMs: number;
    };
  },
): Promise<void> {
```

**After status update to 'complete'** — add deduction:

```typescript
// Log cost and deduct credits
if (turnResult?.cost) {
  const imageCost = (turnResult.images?.length ?? 0) * 0.15;
  const totalCost = (turnResult.cost.totalCostUsd ?? 0) + imageCost;
  const isFollowUp = turnResult.requestId !== 'initial' && turnResult.requestId != null;

  try {
    const result = await credits.recordUsage(this.env.DB, this.userId, campaignId, {
      requestId: turnResult.requestId || 'initial',
      eventType: isFollowUp ? 'follow_up' : 'generation',
      claudeCostUsd: turnResult.cost.totalCostUsd ?? 0,
      imageCount: turnResult.images?.length ?? 0,
      imageCostUsd: imageCost,
      totalCostUsd: totalCost,
      inputTokens: turnResult.cost.inputTokens ?? 0,
      outputTokens: turnResult.cost.outputTokens ?? 0,
      numTurns: turnResult.cost.numTurns ?? 0,
      durationMs: turnResult.cost.durationMs ?? 0,
    });

    if (!result.alreadyRecorded) {
      // Send updated balance to client
      this.emitEvent({
        type: 'credits_update' as any,
        timestamp: new Date().toISOString(),
        balance: result.newBalance,
        cost: totalCost,
      });
    }
  } catch (err) {
    this.log(`[credits] Failed to record usage: ${err}`);
    // Don't block completion — cost logging is best-effort
  }
}

// Delete turn-result.json to prevent double-charge on crash recovery
try {
  await this.timedRPC('deleteTurnResult', () =>
    this.sandbox.exec('rm -f /app/turn-result.json')
  );
} catch { /* ignore — sandbox may be gone */ }
```

**Key decisions:**
- Cost logging failure does NOT block generation completion
- `recordUsage` uses `INSERT OR IGNORE` on `UNIQUE(campaign_id, request_id)` — idempotent
- `turn-result.json` is deleted after finalization to prevent re-reads on crash recovery
- `isFollowUp` detected via `requestId`: agent-runner writes `'initial'` for first turn, a UUID for follow-ups

---

## Phase 6: REST API Endpoints

### New file: `cloudflare/src/routes/credits.ts`

```
GET /api/credits
  → { balance_usd, total_spent_usd, total_generations }

GET /api/credits/usage?limit=20&offset=0
  → { usage: UsageLogEntry[] }
```

### Update: `cloudflare/src/router.ts`
Add route dispatch for `/api/credits` → `handleCreditsRequest()`, placed before the 404 fallback.

### Update: `client/src/lib/api.ts`
```typescript
creditsApi = {
  get(): Promise<{ balance_usd, total_spent_usd, total_generations }>
  getUsage(limit?, offset?): Promise<{ usage: UsageLogEntry[] }>
}
```

---

## Phase 7: Client Types

### File: `client/src/types/websocket.ts`

Add new event interface:
```typescript
export interface WSCreditsUpdateEvent extends WSBaseMessage {
  type: 'credits_update';
  balance: number;
  cost: number;
}
```

Add `code` field to error event:
```typescript
export interface WSErrorEvent extends WSBaseMessage {
  type: 'error';
  error: string;
  code?: string;  // ← NEW (e.g., 'INSUFFICIENT_CREDITS')
}
```

Add to `WSServerMessage` union and create type guard:
```typescript
export type WSServerMessage = ... | WSCreditsUpdateEvent;

export function isCreditsUpdateEvent(msg: WSServerMessage): msg is WSCreditsUpdateEvent {
  return msg.type === 'credits_update';
}
```

---

## Phase 8: Client Store & WS Hook

### File: `client/src/store/index.ts`
Add `creditBalance: number | null` and `setCreditBalance(balance: number)`.

### File: `client/src/hooks/useWebSocket.ts`
Handle `credits_update` event → update store balance.
Handle `INSUFFICIENT_CREDITS` error → show distinct UI (e.g., different error message, link to top-up).

---

## Phase 9: Client UI — Balance Display & Initial Fetch

### File: `client/src/components/layout/AppLayout.tsx`
Fetch credits on mount via `creditsApi.get()` → set store `creditBalance`. Skip in dev mode (no auth). This ensures the user sees their balance even if they haven't generated anything this session.

### File: `client/src/components/auth/UserMenu.tsx`
Show credit balance next to the user avatar (e.g., `$3.61` badge or inline text). Read from store `creditBalance`.

### File: `client/src/lib/api.ts`
Add `creditsApi.get()` and `creditsApi.getUsage()`.

---

## Phase 10: Local Dev Server Mirror

### File: `server/lib/database.ts`
Add `user_credits` and `usage_log` tables to the schema string (same SQL as Phase 2).

### New file: `server/lib/db/credits.ts`
Same four functions as cloudflare version, but synchronous using better-sqlite3. Export from `server/lib/db/index.ts`.

### File: `server/lib/websocket-handler.ts`
- **Pre-flight check:** Add `getBalance()` call at the top of `handleGenerate()` (around line 518) and `handleFollowUp()` (around line 983), before any D1 writes. Return error with `code: 'INSUFFICIENT_CREDITS'` if balance <= 0.
- **Post-generation deduction:** After the SDK `result` message is processed (instrumentor already captures `total_cost_usd`, `usage`, `num_turns`, `duration_ms`), call `recordUsage()` with the cost data. Send `credits_update` WS event.

---

## Files to Modify (Summary)

| File | Change |
|---|---|
| `cloudflare/schema.sql` | Add `user_credits` + `usage_log` tables + indexes |
| `cloudflare/src/db/credits.ts` | **NEW** — credit DB functions (D1) |
| `cloudflare/src/db/index.ts` | Export new credits module |
| `cloudflare/sandbox/agent-runner.ts` | Capture cost from `result` msg, pass to `writeCompletionMarker`, add `maxBudgetUsd` |
| `cloudflare/src/durable-objects/campaign-session.ts` | Pre-flight check (top of handlers) + post-gen deduction + delete turn-result.json |
| `cloudflare/src/routes/credits.ts` | **NEW** — REST endpoints |
| `cloudflare/src/router.ts` | Register credit routes |
| `cloudflare/src/lib/types.ts` | Add `code` to ServerMessage, `credits_update` to type union |
| `client/src/types/websocket.ts` | Add `WSCreditsUpdateEvent`, `code` on error, type guard |
| `client/src/lib/api.ts` | Add credits API client |
| `client/src/store/index.ts` | Add `creditBalance` state |
| `client/src/hooks/useWebSocket.ts` | Handle `credits_update` + `INSUFFICIENT_CREDITS` |
| `client/src/components/auth/UserMenu.tsx` | Display balance |
| `client/src/components/layout/AppLayout.tsx` | Fetch balance on mount |
| `server/lib/database.ts` | Add tables to local schema |
| `server/lib/db/credits.ts` | **NEW** — local dev credit functions (better-sqlite3) |
| `server/lib/db/index.ts` | Export new credits module |
| `server/lib/websocket-handler.ts` | Pre-flight check + post-gen deduction + WS event |

---

## Edge Cases

| Case | Behavior |
|---|---|
| New user, no credits row | Auto-created with $5.00 free balance |
| Balance > 0 but generation costs more | Allowed. Balance goes negative. Next gen blocked |
| Generation fails/crashes | No charge (turn-result.json not written or no cost data) |
| User cancels | No charge (agent killed before result message) |
| DO resets mid-generation | Alarm picks up, `tryFinalize()` reads turn-result.json, deducts if complete |
| Double deduction | Prevented by `UNIQUE(campaign_id, request_id)` + `INSERT OR IGNORE` + turn-result.json deletion |
| Cost logging fails | Swallowed — user gets output, we eat the cost |
| `total_cost_usd` missing from SDK | Fallback: calculate from `(input_tokens × 1.0 + output_tokens × 5.0) / 1_000_000` |
| Runaway agent | `maxBudgetUsd: 3.0` hard cap in SDK options |
| WS drops between complete and credits_update | Client fetches balance on mount as baseline — stale for current session only |
| Dev mode (no auth) | Skip credit fetch, no balance shown, no pre-flight check |
| Orphan campaigns | Prevented — credit check runs before any D1 writes |

---

## Verification Steps

1. Run a local generation, check `turn-result.json` contains `cost` field with real values
2. Run CREATE TABLE on deployed D1, verify tables exist
3. Set a test user's balance to 0, attempt generation → should get `INSUFFICIENT_CREDITS` error and NO campaign created in D1
4. Run a full generation, check `usage_log` has a row, `user_credits.balance_usd` decreased
5. Verify balance shows in client UI and updates after generation completes
6. Set balance to $0.10, run full generation → balance goes negative, next generation blocked
7. Kill DO mid-generation, let alarm recover → verify only ONE usage_log row (no double-charge)
8. Verify `turn-result.json` is deleted after successful finalization
9. Local dev: same checks (steps 3-6) against SQLite
