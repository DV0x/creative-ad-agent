# Plan — Multi-Reference Selective Replace

**Date:** 2026-05-05
**Status:** ⏸️ Planned, not started. Pick up next session at "Phase 1".
**Branch (current):** `new-ui` — create work branch off it (suggested: `feat/multi-ref-selective-replace`)
**Total estimated effort:** ~1.5 days (~395 LOC across ~17 files)

> Read top-to-bottom on first pickup. **Decisions Locked** is settled — do not relitigate. **Open Decisions** has 3 small items to confirm with the user before Phase 2 starts. Pickup instructions at the bottom.

---

## TL;DR

Make the agent reliably consume user-uploaded reference images, including:
- **Selective replace** (beta-client signal): user can add/remove individual references mid-campaign.
- **Multi-product**: one creative can feature multiple distinct uploads (whey tub + protein bar).
- **Cross-turn persistence**: references survive between turns until the user changes them.
- **Reliability**: stop relying on the agent's working memory to carry URLs from prompt to tool call.

Today's flow injects URLs into the agent's first user message and trusts the agent to remember them across many turns. This breaks via attention dilution (most common) and microcompact (when many tool results pile up). Both manifest as "user uploaded their tub but the ads contain a generic tub."

The fix is **two structural changes**:
1. Move the reference set from per-message argument → campaign-level D1 state (`active_reference_file_ids`).
2. Replace prompt-text injection with a structured MCP tool (`mcp__refs__get_reference_images`) that the art-style skill calls during a new **Step 2.5** (visual analysis + per-concept reference assignment).

| Phase | Goal | Effort | Ship target |
|---|---|---|---|
| 1 | D1 schema + DB layer + DO handler | 2 hrs | Day 1 AM |
| 2 | Refs MCP + agent runner wiring + skill Step 2.5 | 3 hrs | Day 1 PM |
| 3 | Frontend: store + chip strip + ChatInput | 4 hrs | Day 2 AM |
| 4 | Local server symmetry | 1 hr | Day 2 PM |
| 5 | Staging verification + prod migration + deploy | 1 hr | Day 2 PM |

---

## Why we're doing this

- Beta clients (Hyderabad hotel, abroad ed consultancy, multi-product D2C) want selective control over reference images. Cold-launch signal: **selective replace is a v1 requirement, not YAGNI.**
- Today's prompt-text URL transport is a "trust the agent's working memory" seam. It fails silently — the agent calls `generate_ad_images` without `referenceImageUrls`, falls through to text-to-image, returns ads that don't contain the user's actual product.
- Multi-product brands (e.g. whey + bar) need to attach 2+ images per campaign and have those persist across iteration turns. Current per-message `assetFileIds` pattern requires re-attaching every turn.

---

## Findings from this session (2026-05-05)

### 🚨 Confirmed: agent loses reference URLs via attention dilution

Per claude-sdk-guide subagent verification (against `claude_sdk/Agent_skills.md` + official subagents docs):

- Skills do NOT fork context — they share the agent's conversation. The art-style skill "sees" reference URLs only because they live in the original first user message.
- Subagents (Task tool) DO fork context. URLs in the parent's message are NOT visible to subagents.
- More common than auto-compact (which triggers ~170K for Haiku 4.5) is **attention dilution**: by the time the skill runs, URLs are 30+ tool-results back in history; the model stops attending to them.
- Microcompact (per CLAUDE.md "Keeps last 3 tool results per tool type") prunes URL-containing tool results aggressively.

### Code seams identified

| File | What we need to change |
|---|---|
| `cloudflare/schema.sql` + `server/lib/database.ts` | Add `active_reference_file_ids TEXT` column on `campaigns` |
| `cloudflare/src/db/campaigns.ts` | Add `getActiveReferences` / `setActiveReferences` |
| `cloudflare/src/durable-objects/campaign-session.ts:676-686` | New `set_active_references` WS message handler |
| `cloudflare/src/durable-objects/campaign-session.ts:719,873` | Drop `assetFileIds` arg from `handleGenerate` / `handleFollowUp`; read from D1 |
| `cloudflare/src/durable-objects/campaign-session.ts:843,972` | Replace URL-text injection with one-line pointer to MCP tool |
| `cloudflare/sandbox/refs-mcp.ts` | NEW — disk-backed MCP server (reads `/app/refs.json` per call) |
| `cloudflare/sandbox/agent-runner.ts:108-111` | Register `refs` MCP, add tool to `allowedTools` |
| `cloudflare/sandbox/nano-banana-mcp.ts:133` | Raise `referenceImageUrls` cap from `max(10)` → `max(14)` |
| `agent/.claude/skills/art-style/SKILL.md` | Insert Step 2.5 between Step 2 and Step 3 |
| `client/src/store/index.ts` | Add `activeReferencesByCampaign` slice + actions |
| `client/src/types/websocket.ts` | Add `set_active_references` / `active_references_updated` types |
| `client/src/hooks/useWebSocket.ts:454,557,498,584` | Drop `assetFileIds` from `generate` / `followUp` |
| `client/src/components/chat/ChatInput.tsx:64-69` | Lift `mentionedAssetFiles` to campaign-level via store |
| `client/src/components/chat/ReferenceChipStrip.tsx` | NEW — display + remove only (no "+ Add" — `@mention` stays the selection mechanism) |
| `client/src/components/chat/ChatSidebar.tsx:93,95` + `MobileChatDrawer.tsx:49,50` | Drop the `assetRefs.filter(id => id.startsWith('file_'))` extraction — assets no longer flow through messages |
| `server/lib/db/campaigns.ts` + `server/lib/websocket-handler.ts` | Mirror Cloudflare changes |

---

## Decisions Locked (do not relitigate)

| # | Decision | Why |
|---|---|---|
| D1 | Selective replace is v1 (not YAGNI) | Beta client explicitly asked for it; signal is real |
| D2 | No "role" enum on references — flat `string[]` array | Roles throw away information vs free-form descriptions; agent's Step 2.5 visual analysis writes richer language than any enum could carry. Roles only earn keep when there's per-role behavior outside the prompt; we have none. |
| D3 | Disk-backed MCP (reads `/app/refs.json` per call), NOT closure-based | Closure breaks on warm-path follow-up after `set_active_references` updates the D1 set. Disk read is one `fs.readFileSync` per call — negligible. |
| D4 | Active references live on `campaigns` row in D1 | Survives DO restart, sandbox recreation, page refresh, browser crash. Single source of truth. |
| D5 | "Sticky-until-replaced" semantics | Empty turn preserves previous refs. Any new attach via chip strip overwrites. Predictable. |
| D6 | Two-layer selection: campaign pool (Layer 1, user-controlled) + per-concept subset (Layer 2, agent-controlled in Step 2.5) | Layer 1 = "what's available." Layer 2 = "what each ad uses." Some concepts use all, some use none, some use a subset. Agent decides per-concept. |
| D7 | Hard cutover on `assetFileIds` payload — no backwards-compat fallback | Atomic `wrangler deploy`, no third-party clients, beta not load-bearing. Two code paths = two foot-guns. |
| D8 | Chip strip is **display + remove only**. `@mention` stays the selection mechanism. | Avoids redundant UI. `@mention` already works for assets. Chip strip just makes the persistent set visible. |
| D9 | Skill emits a warning trace but continues if `Read()` fails on a reference path | Don't fail the whole campaign for one bad ref. Graceful degradation. |
| D10 | Concept can have zero `referenceImageUrls` even when refs exist on the campaign | Some hooks (pure typography) work better text-to-image. Agent's Step 2.5 picks per concept. |
| D11 | Reference visual analysis baked into prompt text, not just URLs attached | "A whey protein tub" + URL → drift. "Feature the user's exact matte black tub with gold M emblem and red CHOCOLATE band — preserve label, colors, proportions exactly" + URL → fidelity. The MCP routes correctly already; the prompt is the lever. |
| D12 | MCP cap raised 10 → 14 | Match fal.ai's actual limit; one-character change |
| D13 | **Lifecycle: refs.json write happens INSIDE `runGeneration` after setup, NOT in `handleGenerate`** | `this.sandbox` is null in `handleGenerate` until `runGeneration`'s `setup()` acquires it. Match the existing prompt-file IPC pattern: resolve URLs in handler, pass as param into `runGeneration`, write file after `mountBucket`, before `/app/next-prompt.json`. |
| D14 | **Cascade-on-delete for asset references** | When `deleteFile` removes an asset from the library, sweep all `campaigns.active_reference_file_ids` arrays and remove that fileId. Keeps data integrity strict; no dangling pointers. Apply same logic to `deleteFolder`. |
| D15 | **Reference changes apply to the NEXT generation, not in-flight one** | If user clicks ✕ on a chip during a running generation: chip disappears from UI immediately, D1 row updated, but the running agent continues with the snapshot of refs.json taken at generation start. The MCP reads the file fresh on each call but the file isn't rewritten mid-generation. Predictable + simple. |
| D16 | **Skip the pre-rewrite instrumentation step** | User confirmed (2026-05-05) the URL-loss / hallucination behaviour is real from observed usage — no need to measure first. Selective replace forces the data-model change regardless, so the MCP rewrite is justified independent of measured failure rate. Ship the rewrite directly. |
| D17 | **Defer the `PostToolUse` durability-enforcement hook** | The MCP + per-concept `referenceImageUrls` in `prompts.json` already converts the failure mode from "trust the agent's working memory across a long conversation" to "trust the agent for one specific copy step inside Step 2.5." Massive narrowing of the trust window. If hallucination still slips through after the rewrite, add the hook as a follow-up — but don't preemptively belt-and-suspenders. |

---

## Open Decisions — RESOLVED (2026-05-05)

| # | Question | Resolution |
|---|---|---|
| O1 | Migration semantics for existing campaign rows | ✅ **No backfill.** Existing campaigns get `active_reference_file_ids = NULL`. Feature applies to new campaigns going forward. |
| O2 | How should `@mention` interact with the campaign-level active reference set? | ✅ **`@mention` is the add action.** Drop `mentionedAssetFiles` local state in `ChatInput.tsx` entirely. When user picks a file via `@mention`, dispatch `addReference(campaignId, file.id)` — file becomes a sticky chip in the strip, persists across turns until user clicks ✕. One mental model: what's in the chip strip is what's active. No per-message-only mode for assets. |
| O3 | Empty active set behavior | ✅ **Auto-fall to text-to-image.** Empty `active_reference_file_ids` (or NULL) means no refs → no `/app/refs.json` (or empty `references: []`) → MCP returns empty → agent proceeds in text-to-image mode. No explicit toggle. |

---

## Phase 1 — D1 schema + DB layer + DO handler (2 hrs)

### 1.1 Schema migration

**`cloudflare/schema.sql`** — append column declaration to existing `campaigns` table block:

```sql
-- Reference images currently active for the campaign (persists across turns).
-- JSON array of asset_files.id values. NULL = no refs.
-- Updated via 'set_active_references' WS message; consumed by DO at every generation
-- to write /app/refs.json into the sandbox before the agent runs.
ALTER TABLE campaigns ADD COLUMN active_reference_file_ids TEXT;
```

**Staging migration command:**
```bash
npx wrangler d1 execute creative-agent-db --remote --command="
  ALTER TABLE campaigns ADD COLUMN active_reference_file_ids TEXT;
"
```

**Production migration command:**
```bash
npx wrangler d1 execute creative-agent-db-prod --remote --command="
  ALTER TABLE campaigns ADD COLUMN active_reference_file_ids TEXT;
"
```

**Local SQLite** — same `ALTER TABLE` statement, run during dev start.

### 1.2 DB layer — `cloudflare/src/db/campaigns.ts`

Add to the `Campaign` interface:
```ts
export interface Campaign {
  // ... existing fields ...
  active_reference_file_ids: string | null;  // JSON-serialized string[]
}
```

Append two functions at the end of the file:
```ts
/** Returns the array of asset file IDs currently active for this campaign. */
export async function getActiveReferences(db: D1Database, campaignId: string): Promise<string[]> {
  const row = await db.prepare(`
    SELECT active_reference_file_ids FROM campaigns WHERE id = ?
  `).bind(campaignId).first<{ active_reference_file_ids: string | null }>();
  if (!row?.active_reference_file_ids) return [];
  try {
    const parsed = JSON.parse(row.active_reference_file_ids);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Replaces the active reference set for this campaign. Pass [] to clear. */
export async function setActiveReferences(db: D1Database, campaignId: string, fileIds: string[]): Promise<void> {
  await db.prepare(`
    UPDATE campaigns SET active_reference_file_ids = ?, updated_at = datetime('now')
    WHERE id = ?
  `).bind(JSON.stringify(fileIds), campaignId).run();
}

/** Removes a fileId from every campaign's active_reference_file_ids array.
 *  Called by deleteFile/deleteFolder to keep referential integrity (D14). */
export async function removeFileFromAllCampaigns(db: D1Database, userId: string, fileId: string): Promise<void> {
  // Fetch only campaigns where the column contains this fileId (cheap LIKE filter)
  const rows = await db.prepare(`
    SELECT id, active_reference_file_ids FROM campaigns
    WHERE user_id = ? AND active_reference_file_ids LIKE ?
  `).bind(userId, `%"${fileId}"%`).all<{ id: string; active_reference_file_ids: string }>();

  for (const row of rows.results) {
    try {
      const arr = JSON.parse(row.active_reference_file_ids) as string[];
      const filtered = arr.filter(id => id !== fileId);
      if (filtered.length !== arr.length) {
        await db.prepare(`
          UPDATE campaigns SET active_reference_file_ids = ?, updated_at = datetime('now')
          WHERE id = ?
        `).bind(JSON.stringify(filtered), row.id).run();
      }
    } catch { /* malformed JSON — skip */ }
  }
}
```

### 1.3 Cascade on file/folder delete — `cloudflare/src/routes/assets.ts`

**`deleteFile`** (around line 272) — after the existing R2 + D1 deletes succeed, sweep campaigns:
```diff
  await env.R2_BUCKET.delete(r2Key);
  await db.deleteAssetFile(env.DB, fileId);
+ // Cascade: remove this fileId from every campaign's active reference set (D14)
+ await db.removeFileFromAllCampaigns(env.DB, userId, fileId);
  return Response.json({ success: true, message: 'File deleted' });
```

**`deleteFolder`** (around line 105) — already deletes files via CASCADE on D1; we need to sweep campaigns BEFORE the folder delete fires (because once asset_files rows are gone, we can't re-derive the fileIds):
```diff
  const files = await db.getFilesByFolder(env.DB, folderId);
  if (files.length > 0) {
    const keys = files.map((f) => `users/${userId}/uploads/${f.file_path}`);
    await env.R2_BUCKET.delete(keys);
+   // Cascade: remove all these fileIds from every campaign's active reference set (D14)
+   for (const file of files) {
+     await db.removeFileFromAllCampaigns(env.DB, userId, file.id);
+   }
  }
  await db.deleteFolder(env.DB, folderId);
```

Mirror both changes in `server/routes/assets.ts` for local-dev parity.

**Sync the client after cascade — DEFERRED (2026-05-05).** Per user decision during Phase 1.3, we skip the live WS push from REST asset routes → DO. The chip strip self-heals at render time (file lookup fails → chip doesn't draw), so the only stale state is the in-memory `activeReferencesByCampaign` array, which corrects on next page refresh. Building the worker→DO push pattern (~40 LOC of new RPC surface) wasn't worth the cosmetic gain. `removeFileFromAllCampaigns` still returns the affected campaign list — wire up the broadcast later if user feedback flags the staleness.

### 1.4 DO handler — `cloudflare/src/durable-objects/campaign-session.ts`

**At line 675 (the WS message switch):** add a new case after `'follow_up'`:
```ts
case 'set_active_references':
  if (message.campaignId && Array.isArray(message.fileIds)) {
    await this.handleSetActiveReferences(message.campaignId, message.fileIds);
  }
  break;
```

**Add the handler method (paste below `handleFollowUp` at line ~1090):**
```ts
private async handleSetActiveReferences(campaignId: string, fileIds: string[]): Promise<void> {
  this.trace('handler', 'setActiveRefs.enter', { campaignId, count: fileIds.length });

  // Auth: verify the campaign belongs to this user
  const campaign = await db.getCampaignById(this.env.DB, campaignId, this.userId);
  if (!campaign) {
    this.sendWS({ type: 'error', timestamp: new Date().toISOString(), error: 'Campaign not found' });
    return;
  }

  // Auth: verify each fileId belongs to a folder owned by this user
  // (defense-in-depth: don't let a user attach another user's asset)
  const userFolders = await db.getFoldersByUser(this.env.DB, this.userId);
  const userFolderIds = new Set(userFolders.map(f => f.id));
  for (const fileId of fileIds) {
    const file = await db.getFile(this.env.DB, fileId);
    if (!file || !userFolderIds.has(file.folder_id)) {
      this.sendWS({ type: 'error', timestamp: new Date().toISOString(), error: `Invalid asset reference: ${fileId}` });
      return;
    }
  }

  await db.setActiveReferences(this.env.DB, campaignId, fileIds);
  this.sendWS({
    type: 'active_references_updated',
    timestamp: new Date().toISOString(),
    campaignId,
    fileIds,
  });
  this.trace('handler', 'setActiveRefs.done', { campaignId, count: fileIds.length });
}
```

**Refactor `handleGenerate` and `handleFollowUp` — drop `assetFileIds` arg, read from D1:**

`handleGenerate` signature change at line 719:
```diff
- private async handleGenerate(prompt: string, requestedSessionId?: string, assetFileIds?: string[], sourceCampaignId?: string, aspectRatio?: string, brand?: string): Promise<void>
+ private async handleGenerate(prompt: string, requestedSessionId?: string, sourceCampaignId?: string, aspectRatio?: string, brand?: string): Promise<void>
```

`handleFollowUp` signature change at line 873:
```diff
- private async handleFollowUp(prompt: string, campaignId: string, assetFileIds?: string[], aspectRatio?: string): Promise<void>
+ private async handleFollowUp(prompt: string, campaignId: string, aspectRatio?: string): Promise<void>
```

Update the call sites at line 678 and 684:
```diff
- await this.handleGenerate(message.prompt, message.sessionId, message.assetFileIds, message.sourceCampaignId, message.aspectRatio, message.brand);
+ await this.handleGenerate(message.prompt, message.sessionId, message.sourceCampaignId, message.aspectRatio, message.brand);

- await this.handleFollowUp(message.prompt, message.campaignId, message.assetFileIds, message.aspectRatio);
+ await this.handleFollowUp(message.prompt, message.campaignId, message.aspectRatio);
```

**Replace URL-text injection at line 836-848 (handleGenerate) with:**

```ts
// Resolve campaign-level active references (replaces per-message assetFileIds).
// NOTE: We resolve URLs here (D1 read + fal.ai upload — no sandbox needed) but
// the actual /app/refs.json write happens INSIDE runGeneration after setup
// acquires the sandbox. See D13 in Decisions Locked.
const activeFileIds = this.campaignId
  ? await db.getActiveReferences(this.env.DB, this.campaignId)
  : [];

let aiPrompt = prompt;
let resolvedRefs: { falUrls: string[]; sandboxPaths: string[]; fileIds: string[] } | null = null;

if (activeFileIds.length > 0) {
  this.log(`[ASSET] Resolving ${activeFileIds.length} active reference(s) for campaign ${this.campaignId}`);
  const { falUrls, sandboxPaths } = await this.resolveAssetUrls(activeFileIds);
  this.log(`[ASSET] Resolved ${falUrls.length} reference(s)`);
  if (falUrls.length > 0) {
    resolvedRefs = { falUrls, sandboxPaths, fileIds: activeFileIds };
    // Lightweight prompt hint — actual URLs delivered via MCP, not text
    aiPrompt = `${prompt}\n\n## Reference Images\nThis campaign has ${falUrls.length} active reference image(s). Call \`mcp__refs__get_reference_images\` from within the art-style skill (Step 2.5) to retrieve them. Do not look for URLs in this prompt — use the MCP tool.`;
  }
} else {
  this.log(`[ASSET] No active references for campaign ${this.campaignId}`);
}

// Pass resolvedRefs through to runGeneration; it writes refs.json after sandbox setup.
this.runGeneration(aiPrompt, sessionId, undefined, resolvedRefs).catch((err) => { ... });
```

**Update `runGeneration` signature** (around line 1643) to accept `resolvedRefs`. Inside `setup()` (around line 1330), after `mountBucket` succeeds and BEFORE the prompt-file write at line 1568, add:

```ts
// Write refs.json into sandbox — sandbox guaranteed up at this point
if (resolvedRefs && resolvedRefs.falUrls.length > 0) {
  const payload = JSON.stringify({
    references: resolvedRefs.falUrls.map((falUrl, i) => ({
      falUrl,
      sandboxPath: resolvedRefs.sandboxPaths[i],
      fileId: resolvedRefs.fileIds[i],
    })),
  }, null, 2);
  await this.timedRPC('writeRefsFile', () => sandbox.writeFile('/app/refs.json', payload));
} else {
  // Clear any stale refs.json from a previous campaign on this sandbox
  await this.timedRPC('clearRefsFile', () => sandbox.exec('rm -f /app/refs.json 2>/dev/null || true'));
}
```

**Mirror the same change at line 967-977 (handleFollowUp).** Pass `resolvedRefs` through to `runFollowUpFast` (line 1023). Inside `runFollowUpFast`, write refs.json before `/app/next-prompt.json` — sandbox is already up in the warm-path.

**Add two helper methods near `resolveAssetUrls` at line 1849:**
```ts
/** Write resolved reference metadata to sandbox at /app/refs.json */
private async writeRefsToSandbox(
  falUrls: string[],
  sandboxPaths: string[],
  fileIds: string[],
): Promise<void> {
  if (!this.sandbox) return;
  const references = falUrls.map((falUrl, i) => ({
    falUrl,
    sandboxPath: sandboxPaths[i],
    fileId: fileIds[i],
  }));
  const payload = JSON.stringify({ references }, null, 2);
  try {
    await this.timedRPC('writeRefsFile', () => this.sandbox!.writeFile('/app/refs.json', payload));
  } catch (err: any) {
    this.log(`[ASSET] Failed to write /app/refs.json: ${err?.message}`);
  }
}

/** Remove stale /app/refs.json so a campaign with no refs doesn't inherit a prior set */
private async clearRefsFile(): Promise<void> {
  if (!this.sandbox) return;
  try {
    await this.timedRPC('clearRefsFile', () => this.sandbox!.exec('rm -f /app/refs.json 2>/dev/null || true'));
  } catch { /* non-critical */ }
}
```

---

## Phase 2 — Refs MCP + agent runner + skill (3 hrs)

### 2.1 NEW: `cloudflare/sandbox/refs-mcp.ts`

```ts
import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';
import * as fs from 'fs';

/**
 * refs MCP server — exposes campaign-level reference images to the agent.
 *
 * Reads /app/refs.json on every call (not closure-bound), so mid-session updates
 * to the campaign's active reference set are picked up automatically.
 *
 * /app/refs.json shape: { references: [{ falUrl, sandboxPath, fileId }, ...] }
 * Written by the DO before each generation in writeRefsToSandbox().
 */

const REFS_FILE = '/app/refs.json';

export const refsMcpServer = createSdkMcpServer({
  name: 'refs',
  version: '1.0.0',
  tools: [
    tool(
      'get_reference_images',
      'Returns the user-uploaded reference images currently active for this campaign. ' +
      'Each reference includes a falUrl (pass to generate_ad_images as referenceImageUrls), ' +
      'a sandboxPath (use Read() to analyze the image visually), and a fileId. ' +
      'If no references are active, returns { references: [] } and the agent should proceed in text-to-image mode.',
      {},
      async () => {
        let payload: string;
        try {
          if (fs.existsSync(REFS_FILE)) {
            payload = fs.readFileSync(REFS_FILE, 'utf-8');
          } else {
            payload = JSON.stringify({ references: [] });
          }
        } catch (err: any) {
          payload = JSON.stringify({ references: [], error: err?.message });
        }
        return { content: [{ type: 'text', text: payload }] };
      }
    ),
  ],
});

console.log('refs MCP server created (v1.0.0 — disk-backed, reads /app/refs.json per call)');
```

### 2.2 Wire into agent runner — `cloudflare/sandbox/agent-runner.ts`

Line 3 — add import:
```diff
+ import { refsMcpServer } from './refs-mcp.js';
```

Lines 108-111 — extend `allowedTools` and `mcpServers`:
```diff
  allowedTools: [
    'Task', 'Skill', 'TodoWrite',
    'WebFetch', 'WebSearch', 'Read', 'Write',
    'Bash', 'Edit', 'Glob', 'Grep',
    'mcp__nano-banana__generate_ad_images',
+   'mcp__refs__get_reference_images',
  ],
  systemPrompt: ORCHESTRATOR_SYSTEM_PROMPT,
- mcpServers: { 'nano-banana': nanoBananaMcpServer },
+ mcpServers: {
+   'nano-banana': nanoBananaMcpServer,
+   'refs': refsMcpServer,
+ },
```

Add display name for the tool (search for `TOOL_DISPLAY_NAMES`):
```diff
  'mcp__nano-banana__generate_ad_images': 'Generating images',
+ 'mcp__refs__get_reference_images': 'Loading reference images',
```

### 2.3 Bump nano-banana cap — `cloudflare/sandbox/nano-banana-mcp.ts:133`

```diff
- referenceImageUrls: z.array(z.string().url()).max(10).optional()...
+ referenceImageUrls: z.array(z.string().url()).max(14).optional()...
```

### 2.4 Skill update — `agent/.claude/skills/art-style/SKILL.md`

Insert the following section between **Step 2: Select Styles** and **Step 3: Assign Hooks to Styles** (around line 152):

```markdown
### Step 2.5: Build Reference Image Roster (only if references exist)

The user may have uploaded reference images for this campaign (e.g. their actual product photos). When references exist, the prompts you generate must explicitly preserve product identity — generic descriptions ("a whey protein tub") cause the image generator to redesign the packaging.

**Process:**

1. **Retrieve refs:** Call `mcp__refs__get_reference_images`. The result is `{ references: [{ falUrl, sandboxPath, fileId }, ...] }`.
2. **If `references` is empty:** skip this step. Proceed to Step 3 with text-to-image semantics.
3. **For each reference, load the image:** Call `Read(sandboxPath)`. The image enters your vision context. If `Read()` fails on any path (FUSE flake, missing file), emit a brief warning and skip that reference — do not fail the whole campaign.
4. **Describe each image:** For every reference you loaded, write a structured description noting:
   - Form factor (cylindrical tub, rectangular bar, bottle, sachet, etc.)
   - Material/finish (matte, glossy, foil, glass, plastic)
   - Wordmark / logo (text, position, font feel)
   - Distinctive label features (color bands, callouts, badges, ingredient text)
   - Inferred role (primary product, companion product, brand mark, alt angle)
5. **Build the IMAGE ROSTER block:** Combine descriptions into one block per the template below. This block must be included in EVERY concept's `prompt` field that uses references.

**Image Roster template (literal text to include in prompts):**
```
IMAGE ROSTER:
- Image 1: <visual description, role inference>
- Image 2: <visual description, role inference>
...

PRODUCT FIDELITY: Preserve product identity exactly as shown in the references.
Do NOT redesign packaging, alter labels, change colors, or modify proportions.
Use the role inferences above to place each element in the scene appropriately.
When multiple products appear in one creative, name each one's placement explicitly.
```

6. **Per-concept reference assignment:** When emitting `prompts.json`, populate each concept's `referenceImageUrls` field:
   - Some concepts may use ALL refs (e.g. lifestyle scene featuring both products).
   - Some may use a SUBSET (e.g. infographic showing just the bar).
   - Some may use NONE (e.g. pure typography hooks where the product doesn't visually appear).
   - The agent decides per concept based on hook + style + composition logic.
   - Use the `falUrl` values from step 1 — copy them verbatim into the array.

**Output schema gain (per concept):**
```json
{
  "concept": 1,
  ...,
  "prompt": "IMAGE ROSTER:\n- Image 1: matte black whey tub...\nPRODUCT FIDELITY: ...\n\nFeature the user's exact tub...",
  "referenceImageUrls": ["https://fal.media/.../tub.jpg"],
  ...
}
```

When references exist, the orchestrator's call to `generate_ad_images` reads `referenceImageUrls` from `prompts.json` per concept — not from your conversation memory. This is the durability boundary.
```

Also update the **Output Format** section (around line 234) to document the new optional field:
```diff
  "prompt": "Full prompt text...",
+ "referenceImageUrls": ["https://fal.media/..."],   // optional — populated by Step 2.5 when refs exist
  "aspectRatio": "user-specified ratio (4:5, 1:1, or 9:16)",
```

---

## Phase 3 — Frontend (4 hrs)

### 3.1 Types — `client/src/types/websocket.ts`

```diff
  export type ClientMessage =
    | ...
+   | { type: 'set_active_references'; campaignId: string; fileIds: string[] };

  export type ServerMessage =
    | ...
+   | { type: 'active_references_updated'; campaignId: string; fileIds: string[]; timestamp: string };
```

Drop `assetFileIds` from `generate` and `follow_up` types.

### 3.2 Store — `client/src/store/index.ts`

Add to state interface:
```ts
activeReferencesByCampaign: Record<string, string[]>  // campaignId → asset_file IDs
```

Add to actions interface:
```ts
addReference: (campaignId: string, fileId: string) => void
removeReference: (campaignId: string, fileId: string) => void
setActiveReferences: (campaignId: string, fileIds: string[]) => void
```

Implementation:
```ts
addReference: (campaignId, fileId) => {
  const current = get().activeReferencesByCampaign[campaignId] || [];
  if (current.includes(fileId)) return;  // dedupe
  const next = [...current, fileId];
  set(state => ({
    activeReferencesByCampaign: { ...state.activeReferencesByCampaign, [campaignId]: next }
  }));
  websocketManager.send({ type: 'set_active_references', campaignId, fileIds: next });
},

removeReference: (campaignId, fileId) => {
  const current = get().activeReferencesByCampaign[campaignId] || [];
  const next = current.filter(id => id !== fileId);
  set(state => ({
    activeReferencesByCampaign: { ...state.activeReferencesByCampaign, [campaignId]: next }
  }));
  websocketManager.send({ type: 'set_active_references', campaignId, fileIds: next });
},

setActiveReferences: (campaignId, fileIds) => {
  set(state => ({
    activeReferencesByCampaign: { ...state.activeReferencesByCampaign, [campaignId]: fileIds }
  }));
  websocketManager.send({ type: 'set_active_references', campaignId, fileIds });
},
```

**Hydration:** in the existing campaigns fetch, parse `active_reference_file_ids` JSON for each campaign and seed `activeReferencesByCampaign`.

**Persist allowlist:** Do NOT add `activeReferencesByCampaign` — it's derived from server state.

**Server message handler** (in `useWebSocket.ts`): on `active_references_updated`, update store to confirm the optimistic write landed (or correct if it didn't).

### 3.3 NEW: `client/src/components/chat/ReferenceChipStrip.tsx` (~50 LOC)

```tsx
import { X } from 'lucide-react'
import { useStore } from '@/store'
import { cn } from '@/lib/utils'

interface ReferenceChipStripProps {
  campaignId: string
  className?: string
}

/**
 * Displays the campaign's currently active reference images as removable chips.
 * Selection happens via @mention — this component is display + remove only.
 *
 * Empty state: renders nothing (no chrome when no refs).
 */
export function ReferenceChipStrip({ campaignId, className }: ReferenceChipStripProps) {
  const activeIds = useStore(s => s.activeReferencesByCampaign[campaignId] || [])
  const assetFolders = useStore(s => s.assetFolders)
  const removeReference = useStore(s => s.removeReference)

  if (activeIds.length === 0) return null

  // Look up file metadata across all folders
  const lookup = new Map<string, { name: string; thumbnailUrl?: string }>()
  for (const folder of assetFolders) {
    for (const file of folder.files) {
      lookup.set(file.id, { name: file.name, thumbnailUrl: undefined /* TODO: thumb URL */ })
    }
  }

  return (
    <div className={cn('flex flex-wrap gap-1.5 mb-2', className)}>
      {activeIds.map(fileId => {
        const meta = lookup.get(fileId)
        if (!meta) return null  // file deleted from library — skip silently
        return (
          <span
            key={fileId}
            className="inline-flex items-center gap-1.5 pl-2 pr-1 py-0.5 rounded-full text-[11px] font-mono tracking-tight border bg-background"
          >
            <span className="truncate max-w-[12rem]">{meta.name}</span>
            <button
              type="button"
              onClick={() => removeReference(campaignId, fileId)}
              className="rounded-full p-0.5 hover:bg-foreground/10"
              aria-label={`Remove ${meta.name}`}
            >
              <X size={11} />
            </button>
          </span>
        )
      })}
    </div>
  )
}
```

### 3.4 ChatInput integration — `client/src/components/chat/ChatInput.tsx`

Mount `<ReferenceChipStrip campaignId={...} />` above the textarea. The current `selectedImages` chip block stays for image-result references (different concept).

**Lift `mentionedAssetFiles` to campaign state:** when user picks an asset via `@mention`, dispatch `addReference(campaignId, file.id)` instead of pushing into local `mentionedAssetFiles` state.

Diff hunk (line 38, 67):
```diff
- const [mentionedAssetFiles, setMentionedAssetFiles] = useState<AssetFile[]>([])
+ // Asset references now live in campaign state (active_reference_file_ids).
+ // Selection via @mention dispatches addReference; chip strip displays the active set.
```

```diff
  onSubmit({
    content: fullMessage,
    fileRefs: mentionedFiles.map(f => ({ fileType: f })),
-   assetRefs: [...mentionedFolders.map(f => f.id), ...mentionedAssetFiles.map(f => f.id)],
+   // assetRefs deprecated — references flow through campaign-level active_reference_file_ids
    imageRefs: selectedImageIds.map(id => ({ imageId: id })),
  })
```

ChatInput needs a `campaignId` prop now (it doesn't currently receive one). Pull from existing campaign context (`useStore(s => s.activeCampaignId)` or similar).

### 3.5 Drop assetRefs handling in ChatSidebar / MobileChatDrawer

`client/src/components/chat/ChatSidebar.tsx:93,95` and `MobileChatDrawer.tsx:49,50` extract `assetFileIds` from message refs. Drop these — references no longer flow through messages.

### 3.6 useWebSocket hook — `client/src/hooks/useWebSocket.ts`

Lines 94, 97, 454, 498, 557, 584 — drop `assetFileIds` from `generate` / `followUp` signatures and the WS payload spread.

---

## Phase 4 — Local server symmetry (1 hr)

Mirror Cloudflare changes:

- `server/lib/database.ts`: add `active_reference_file_ids TEXT` to campaigns CREATE TABLE.
- `server/lib/db/campaigns.ts`: mirror `getActiveReferences` / `setActiveReferences`.
- `server/lib/websocket-handler.ts`: new `set_active_references` case; refactor generate / follow-up handlers to read from D1 and write `/app/refs.json` (or local `/tmp/refs-<campaignId>.json` since there's no sandbox container locally — adjust path so the local nano-banana / refs MCP read the same place).
- For local dev, the refs MCP needs to know its environment. Either share `cloudflare/sandbox/refs-mcp.ts` via TS path mapping, or duplicate. Simpler: import directly via relative path since the SDK and `@anthropic-ai/claude-agent-sdk` are already shared.

---

## Phase 5 — Verification + deploy (1 hr)

### Staging verification checklist

Single-ref baseline:
- [ ] User uploads 1 image to library.
- [ ] User starts new campaign, `@mention`s the image — chip appears.
- [ ] Generation runs. Logs show `[ASSET] Resolved 1 reference(s)`. Sandbox `/app/refs.json` exists.
- [ ] Agent calls `mcp__refs__get_reference_images` (visible in tool-display name "Loading reference images"). 
- [ ] `prompts.json` has `referenceImageUrls` populated per concept where appropriate.
- [ ] `generate_ad_images` log shows `Mode: edit (with references)`.
- [ ] Generated ads contain user's actual product (visual fidelity check).

Multi-ref + cross-turn:
- [ ] User attaches 2 images on initial generation.
- [ ] After completion, user types follow-up "make the lifestyle one warmer" without re-attaching.
- [ ] Follow-up logs show `[ASSET] Resolved 2 reference(s)` — sticky behavior confirmed.
- [ ] User clicks ✕ on one chip → second-turn generation uses only the remaining ref.

Edge cases:
- [ ] Empty active set → `Mode: text-to-image`. No `/app/refs.json` (or empty references array).
- [ ] User uploads, attaches, deletes file from asset library mid-campaign → chip disappears (file no longer in lookup); generation proceeds without it.
- [ ] Cross-user attempt: user A `@mention`s their file, then manipulates DOM/WS to send `set_active_references` with user B's fileId → DO rejects with "Invalid asset reference."

### Deploy order

1. Run staging D1 migration.
2. Deploy to staging: `cd client && npm run build:staging && docker logout registry.cloudflare.com; docker builder prune -af; cd ../cloudflare && npx wrangler deploy --env staging` (verify dist contains `setActiveReferences` with `grep -c "setActiveReferences" client/dist/assets/index-*.js` — per S92 silent-stale-bundle gotcha).
3. Verify on staging end-to-end (above checklist).
4. Run production D1 migration.
5. Deploy to production.
6. Smoke-test on prod with one beta-shape campaign.

---

## Risk register

| Risk | Likelihood | Mitigation |
|---|---|---|
| Cross-user asset access via crafted WS payload | Low | DO handler verifies fileId belongs to a folder owned by `this.userId` before accepting (Phase 1.3) |
| FUSE silent write failure on `/app/refs.json` | Low | Same pattern as nano-banana's write verification — could add `statSync` check after `writeFile`, but campaign won't break (MCP returns empty references, agent falls to text-to-image gracefully) |
| Auto-compact happens MID-skill execution and the agent loses Step 2.5's product description | Very low | Step 2.5 runs early in the skill (steps 2.5 → 6); compaction at 170K is unlikely within one skill invocation. If it happens, `prompts.json` already has URLs persisted. |
| `mcp__refs__get_reference_images` returns stale `/app/refs.json` because DO writes after agent has already started | Low | DO writes refs.json BEFORE writing `/app/next-prompt.json` (which triggers agent processing). Order matters — verify in Phase 1.3. |
| Existing campaigns' migration: NULL column on row created before column existed | Zero | `getActiveReferences` returns `[]` when column is NULL. Backwards-safe. |
| User has 14+ active references | Tiny | Cap on chip strip at 14, plus user-visible toast. fal.ai's actual limit. Beta users won't hit this. |

---

## Test plan

| Layer | Test |
|---|---|
| DB | `getActiveReferences` returns `[]` for NULL column, `[]` for `'[]'`, parses `'["a","b"]'` → `['a','b']`. `setActiveReferences` round-trips. |
| DO handler | `set_active_references` rejects unknown campaignId, rejects fileId outside user's folders, succeeds and emits `active_references_updated` for valid input. |
| Skill | Manual: trigger campaign with 1 ref, observe Step 2.5 trace logs, verify `prompts.json` has `referenceImageUrls`. |
| MCP | Manual: call `get_reference_images` with `/app/refs.json` present and absent — both return valid responses. |
| Frontend | Manual: chip add/remove via `@mention` and ✕ button. Persistence across navigation (close campaign, reopen, chips still there). |

---

## Pickup instructions (for next session)

1. **Read this doc top-to-bottom.** Don't relitigate Decisions Locked.
2. **Confirm Open Decisions O1-O3** with the user — should take 5 minutes.
3. **Create branch:** `git checkout -b feat/multi-ref-selective-replace` off `new-ui`.
4. **Start Phase 1.1** — schema migration on staging only (do NOT touch prod yet).
5. **Mark phases completed in this doc** as you go. Don't skip the verification checklist.
6. **Save a session doc** at `docs/SESSION_93_MULTI_REFERENCE_SELECTIVE_REPLACE_2026-MM-DD.md` after Phase 5 ships, following the S92 template.

End of plan.
