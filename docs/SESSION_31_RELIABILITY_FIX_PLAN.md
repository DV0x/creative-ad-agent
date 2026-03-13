# Session 31: Reliability Fix Plan — Stream Polling + Cold Resume Context

**Date:** 2026-03-09
**Branch:** `new-ui`
**Prior version:** `38693f93` (Session 30 debug logging)

## Problems (Confirmed via log-2.md + log-3-do-reset.md)

### Bug 1: `streamProcessLogs()` stalls after idle → follow-up hangs forever

**Evidence:**
- log-2.md: 7 follow-ups worked back-to-back, follow-up 8 started but DO reset killed it
- log-3-do-reset.md: After DO reset, follow-up 2 worked (immediate), follow-up 3 (7 min gap) → stream yielded **zero events**, hung forever
- Client showed: `Error: ReadableStream received over RPC disconnected prematurely.`

**Root cause:** The SSE stream from `streamProcessLogs()` dies silently after the DO→container RPC connection goes idle for several minutes. No keepalive mechanism exists in the SDK. The `for await` loop blocks forever because neither the timeout (inside the loop body) nor the stream itself ever yields or closes.

**Where it happens:** `runFollowUpFast()` at line 697 — `for await (const event of parseSSEStream(logStream))`

### Bug 2: DO resets after ~20 min of continuous operation

**Evidence:**
- log-2.md: WS closed code 1006 at exactly 20 min mark, `[subscribe] DO was reset while campaign was generating`
- No deployment was done during the test

**Root cause:** Cloudflare platform eviction ("runtime decision"). DOs can be shut down at any time. No documented 20-minute limit, but the research confirmed: *"If you consume more than 30 seconds of compute between incoming network requests, there is a heightened chance the DO is evicted."* The fire-and-forget background promise running `streamProcessLogs()` accumulates CPU outside the alarm handler context.

### Bug 3: Agent asks for URL on cold resume (context loss after DO reset)

**Evidence:**
- log-3-do-reset.md: After DO reset → cold start → agent said "Do you have a URL for Plum Goodness?" despite research files being hydrated on disk and SDK session resumed
- The orchestrator system prompt says: `"Always need a URL - ask if not provided"` and `"Parse request → Extract URL (required)"`

**Root cause:** The system prompt's workflow rules override conversational context. Even with SDK resume, the agent follows `ORCHESTRATOR_SYSTEM_PROMPT` step 1 ("Extract URL, required") and asks for one. Files are on disk but the agent doesn't check before asking.

---

## Fix 1: Alarm-based polling for completion (Bugs 1 + 2)

### Design

Stop depending on `streamProcessLogs()` for **completion detection**. Keep the stream as **best-effort real-time UI**. Add polling in the alarm handler that reads `turn-result.json` every 30s.

This follows the existing principle: *"SSE is best-effort for real-time progress. The filesystem is the source of truth."*

### How `turn-result.json` already works

Agent-runner already writes `/app/turn-result.json` after each turn completion (line 163 of `agent-runner.ts`):
```js
fs.writeFileSync('/app/turn-result.json', JSON.stringify({ images, files }));
```

And `reconcileImages()` / `reconcileFiles()` already read it (lines 561, 614 of `campaign-session.ts`). We just need to poll it from the alarm instead of only reading it after stream completion.

### Implementation

**File: `cloudflare/src/durable-objects/campaign-session.ts`**

#### A. Add `turnResultVersion` tracking

```ts
// Instance vars
private turnResultVersion: string | null = null;  // hash/length of last seen turn-result.json
```

#### B. Modify `alarm()` to self-heal after DO reset + poll

After a DO reset (deploy, platform eviction), the alarm fires on a fresh instance with all
instance vars at defaults (`isGenerating=false`, `sandbox=null`). The alarm must:
1. Restore session from storage (get `isGenerating`, `campaignId`, `userId`)
2. Reconnect to the sandbox (deterministic ID `user-{userId}-v2`)
3. Poll `turn-result.json` for completion

```ts
async alarm(): Promise<void> {
  try {
    this.flushTailLogs();

    // Self-heal after DO reset: restore state if we have nothing in memory
    if (!this.campaignId) {
      await this.restoreSession();
    }

    if (this.isGenerating && this.campaignId) {
      // Reconnect to sandbox if reference was lost (DO reset)
      if (!this.sandbox && this.userId && this.userId !== 'anonymous') {
        const sandboxId = `user-${this.userId.toLowerCase()}-v2`;
        this.sandbox = getSandbox(this.env.SANDBOX, sandboxId, {
          sleepAfter: '2h',
          normalizeId: true,
        });
        this.log('[alarm] Reconnected to sandbox after DO reset');
      }

      console.log(`[alarm] Generation active: campaign=${this.campaignId}, session=${this.sessionId}`);

      // Poll turn-result.json for completion
      if (this.sandbox) {
        await this.pollTurnResult();
      }

      // Reschedule if still generating (pollTurnResult may have completed it)
      if (this.isGenerating) {
        await this.state.storage.setAlarm(Date.now() + 30_000);
      }
    }
  } catch (err: any) {
    console.warn('[alarm] alarm handler error:', err?.message || err);
    if (this.isGenerating) {
      try { await this.state.storage.setAlarm(Date.now() + 30_000); } catch (_) {}
    }
  }
}
```

**Key insight:** The sandbox container survives DO resets (it's a separate entity with `sleepAfter: '2h'`).
The agent-runner keeps running inside it. We just need to reconnect the DO's handle to poll it.
The sandbox ID is deterministic (`user-{userId}-v2`), so `getSandbox()` reconnects to the same container.

#### C. Add `pollTurnResult()` method

```ts
private async pollTurnResult(): Promise<void> {
  if (!this.sandbox || !this.campaignId) return;

  try {
    const raw = await this.sandbox.readFile('/app/turn-result.json');
    const content = typeof raw === 'string' ? raw : raw?.contents || '';
    if (!content || content.length < 10) return;  // empty or stub

    // Check if this is a NEW result (different from last seen)
    const version = `${content.length}`;  // simple: use content length as version
    if (version === this.turnResultVersion) return;  // already processed
    this.turnResultVersion = version;

    // Also check agent-status.json to confirm agent is idle (turn complete)
    try {
      const statusRaw = await this.sandbox.readFile('/app/agent-status.json');
      const statusContent = typeof statusRaw === 'string' ? statusRaw : statusRaw?.contents || '';
      const status = JSON.parse(statusContent);
      if (status.status !== 'idle') return;  // agent still processing
    } catch {
      return;  // can't confirm idle — don't act
    }

    this.log(`[alarm-poll] Detected turn completion via turn-result.json (${content.length} chars)`);

    // If the stream-based handler already completed this, isGenerating will be false
    // This only fires when the stream missed it
    if (!this.isGenerating) return;

    // Parse and reconcile
    const turnResult = JSON.parse(content);

    // Reconcile images
    const existingImageCount = await db.getImageCount(this.env.DB, this.campaignId) || 0;
    const imageCounter = { next: existingImageCount + 1 };
    await this.reconcileImages(this.sandbox, this.campaignId, imageCounter, (event) => this.emitEvent(event));
    await this.reconcileFiles(this.sandbox, this.campaignId);

    // Mark complete
    const summary = `Follow-up complete.`;
    this.emitEvent({
      type: 'complete',
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      campaignId: this.campaignId,
      duration: 0,
      imageCount: imageCounter.next - 1,
      summary,
    });

    await db.updateCampaignStatus(this.env.DB, this.campaignId, 'complete');
    await db.addMessage(this.env.DB, {
      campaignId: this.campaignId,
      role: 'assistant',
      content: summary,
      blocks: [],
    });

    this.isGenerating = false;
    await this.persistSession();
    this.log(`[alarm-poll] Campaign ${this.campaignId} marked complete via polling`);
  } catch (err: any) {
    // Non-fatal — will retry on next alarm
    this.log(`[alarm-poll] Error: ${err?.message || err}`);

    // Track consecutive failures — if sandbox is truly gone, stop retrying
    this.pollFailCount = (this.pollFailCount || 0) + 1;
    if (this.pollFailCount >= 5) {
      this.log(`[alarm-poll] ${this.pollFailCount} consecutive failures — marking incomplete`);
      await db.updateCampaignStatus(this.env.DB, this.campaignId!, 'incomplete');
      this.isGenerating = false;
      await this.persistSession();
    }
  }
}
```

Also add to instance vars:
```ts
private pollFailCount = 0;
```

#### D. Reset `turnResultVersion` when starting a new generation

In `handleFollowUp()` and `handleGenerate()`, before starting:
```ts
this.turnResultVersion = null;
this.pollFailCount = 0;
```

#### E. Keep the stream as best-effort (no changes to `runFollowUpFast`)

The stream still runs for real-time UI (thinking blocks, text, tool calls). If it completes normally, great — it sets `isGenerating = false` and the alarm poll sees that. If it stalls, the alarm poll catches completion within 30s.

### Edge cases

1. **Stream completes first** → `isGenerating` already false when alarm fires → poll is a no-op
2. **Stream stalls (RPC disconnect)** → alarm poll detects idle agent + new turn-result.json → marks complete within 30s
3. **DO resets (platform eviction)** → alarm fires on fresh instance → `restoreSession()` recovers state → `getSandbox()` reconnects to running container → poll reads turn-result.json → marks complete
4. **Deploy during generation** → same as #3. DO resets, but sandbox container survives. Agent-runner finishes work, writes turn-result.json. Alarm self-heals, reconnects, polls, completes.
5. **Agent still processing** → `agent-status.json` says `processing` → poll skips, alarm reschedules
6. **turn-result.json not updated yet** → same version as last seen → poll skips
7. **Container destroyed (2h idle)** → `sandbox.readFile()` fails → poll catches error, logs it. Next alarm: if agent-status unreadable AND isGenerating stale, fall back to marking incomplete after N failed attempts
8. **DO resets + client disconnected** → alarm still fires (scheduled before reset), self-heals, polls, completes. Client reconnects later and sees completed campaign via D1.

### Self-heal flow after DO reset / deploy

```
Alarm fires (scheduled by previous DO instance)
  ↓
this.campaignId is null (fresh instance)
  ↓
restoreSession() → reads from this.state.storage
  → isGenerating=true, campaignId, userId restored
  ↓
this.sandbox is null (lost reference)
  ↓
getSandbox('user-{userId}-v2') → reconnects to existing container
  ↓
pollTurnResult() → reads /app/turn-result.json + /app/agent-status.json
  ↓
If agent idle + new result → reconcileImages + reconcileFiles → mark complete → emit 'complete' event
  ↓
Client receives 'complete' via WS (if connected) or sees it in D1 on next load
```

---

## Fix 2: Follow-up prompt context on cold resume (Bug 3)

### Design

When falling back to full generation for a follow-up (`sdkSessionId` is set), append context about existing files to the prompt. This tells the agent to skip research.

### Implementation

**File: `cloudflare/src/durable-objects/campaign-session.ts`**

In `handleFollowUp()`, after file hydration succeeds, modify the prompt:

```ts
// After hydration succeeds in the slow path (line ~1006):
if (sdkSessionId && hydratedFiles.length > 0) {
  aiPrompt += `\n\n[SYSTEM NOTE: This is a follow-up to an existing campaign. Research, hooks, and prompt files have already been generated and restored to disk. Do NOT restart the research workflow or ask for a URL. Use the existing files:\n`;
  for (const file of hydratedFiles) {
    aiPrompt += `- ${file.file_type}: ${FILE_PATHS[file.file_type]}\n`;
  }
  aiPrompt += `Read these files with Glob/Read tools if needed. Continue from where the conversation left off.]`;
}
```

### Where exactly

The prompt modification should happen in `handleFollowUp()` between the file hydration (line ~983-1010) and the branch that calls `runGeneration()` (line ~430). We need to track which files were hydrated.

Current flow (lines 983-1010 in `runGeneration`):
```
if (sdkSessionId && this.campaignId) {
  // ... hydrate files from D1
}
```

Change: capture hydrated file types, then in `handleFollowUp` slow path, append note to `aiPrompt`.

**BUT NOTE**: The hydration happens inside `runGeneration()`, not `handleFollowUp()`. So we either:
- (a) Move hydration to `handleFollowUp()` before calling `runGeneration()` — cleaner
- (b) Pass a flag/context to `runGeneration()` — more invasive

**Option (a) is cleaner.** `handleFollowUp()` already has the `sdkSessionId`. Query D1 for files, append the note, then pass modified prompt to `runGeneration()`.

---

## Fix 3: Orchestrator prompt — make URL optional for follow-ups (Bug 3, complementary)

### Design

The orchestrator prompt hardcodes `"Always need a URL - ask if not provided"`. For follow-ups, this is wrong — the URL was provided in the initial generation. The agent should check for existing research files before asking.

### Implementation

**File: `cloudflare/sandbox/orchestrator-prompt.ts`**

Change rule 1 from:
```
1. Always need a URL - ask if not provided
```

To:
```
1. For new campaigns: need a URL - ask if not provided
2. For follow-ups: check if research/hooks/prompts files already exist on disk (use Glob to search agent/files/). If they exist, use them — do NOT ask for a URL again.
```

This is a complementary fix. Fix 2 (prompt context) handles the cold resume case explicitly. Fix 3 makes the agent generally smarter about checking for existing work.

---

## Implementation Order

1. **Fix 1 (alarm polling)** — highest impact, fixes both stream stall + DO reset bugs
2. **Fix 2 (prompt context)** — small, fixes cold resume context loss
3. **Fix 3 (orchestrator prompt)** — small, makes agent smarter about follow-ups

## Files Changed

| File | Change |
|------|--------|
| `cloudflare/src/durable-objects/campaign-session.ts` | `pollTurnResult()` in alarm, `turnResultVersion` tracking, reset on new gen, prompt context for cold resume |
| `cloudflare/sandbox/orchestrator-prompt.ts` | Make URL optional for follow-ups |
| `cloudflare/sandbox/agent-runner.ts` | No changes needed — already writes `turn-result.json` and `agent-status.json` |

## Testing

After deploy:
1. Generate a campaign → wait for completion
2. Send follow-up immediately → should work (fast path + stream)
3. Wait 7+ minutes → send follow-up → stream may stall, but alarm poll should catch completion within 30s
4. Refresh page (forces DO reset) → send follow-up → cold resume should NOT ask for URL

## Risk Assessment

- **Fix 1**: Low risk. Alarm poll is additive — doesn't change existing stream logic. Worst case: poll is a no-op (stream already handled it).
- **Fix 2**: Low risk. Only appends text to prompt. No code path changes.
- **Fix 3**: Low risk. Prompt text change only. Agent may still occasionally ask for URL if it can't find files.
