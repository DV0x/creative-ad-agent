# Session 56: New Campaign from Existing + D2C Product Direction

**Date:** 2026-03-21
**Branch:** `new-ui`
**Status:** Feature deployed and verified

---

## Context

D2C brands (not agencies) are the primary users. A D2C brand using the tool creates multiple campaigns for the same brand, but every campaign re-runs brand research from scratch (~2-3 min wasted). The session started with exploring Supermemory as an evolving memory layer, pivoted to understanding D2C user needs, and landed on a minimal "New Campaign from Existing" feature that reuses research across campaigns.

## Key Product Decisions

1. **D2C > Agencies** — Agencies aren't interested but D2C brands are. Product direction shifted accordingly.
2. **Supermemory explored, deferred** — Full research done (`docs/research/supermemory-research.md`). Capabilities understood but not needed for the core value of research reuse. Can revisit for cross-campaign learning later.
3. **No brand entity** — Instead of building a brand table/hierarchy, we added a simple "copy research from existing campaign" action. Zero schema changes, minimal risk.
4. **Product images deferred** — The MCP tool already supports `referenceImageUrls` for image-to-image generation. The missing piece is agent behavior (using product photos in ad designs), not infrastructure. Separate stream.

## What Was Built

### "New Campaign from Existing" Feature

**User flow:**
1. Hover over any campaign in sidebar → see copy-plus icon (new), pencil (rename), trash (delete)
2. Click copy-plus → "New Campaign" appears, chat shows "New campaign for {name}. Brand research loaded."
3. Type a brief (e.g., "Summer sale, 30% off, target Gen Z") — no URL needed
4. Agent skips research, goes straight to hooks → art → images. ~2-3 min saved.

**Implementation (7 files, +127 lines):**

| File | Change |
|------|--------|
| `cloudflare/src/lib/types.ts` | Added `sourceCampaignId?: string` to ClientMessage |
| `cloudflare/src/durable-objects/campaign-session.ts` | Core: ownership check, research copy, file event, system note, flag-based hydration, smart follow-up note |
| `client/src/store/index.ts` | Added `sourceCampaignId`, `sourceCampaignName`, `setSourceCampaign()` |
| `client/src/hooks/useWebSocket.ts` | `generate()` passes sourceCampaignId, prefixes campaign name |
| `client/src/components/assets/AssetDrawer.tsx` | CopyPlusIcon button on campaign hover actions |
| `client/src/components/chat/ChatSidebar.tsx` | Source-aware prompt text |
| `server/lib/websocket-handler.ts` | Mirrored: ownership check, research copy, hasSourceResearch |

**Design decisions:**
- Research is COPIED, not referenced — new campaign is independent after creation
- Only research copied; hooks/prompts/images generated fresh per brief
- `sourceCampaignId` used once at creation, then forgotten — no DB link
- No new tables, no schema migration, no new API endpoints

## Bugs Found & Fixed During Testing

### Bug 1: Follow-up path missing system note
- **Symptom:** Agent asked for URL even though research was on disk
- **Cause:** `handleFollowUp` cold resume only appended "skip research" note when `sdkSessionId` was set. For source-based campaigns (cancelled before SDK session created), `sdkSessionId` was null.
- **Fix:** Widened condition to `if (sdkSessionId || this.hasSourceResearch)`

### Bug 2: Research not visible in client
- **Symptom:** Research file panel showed empty even though D1 had content
- **Cause:** Research was copied server-side but no `file` WebSocket event was emitted to notify the client.
- **Fix:** Emit `file` event immediately after copying research in `handleGenerate`

### Bug 3: Agent not following pipeline after skipping research
- **Symptom:** Agent read research but didn't proceed to hooks/art/images
- **Cause:** System note only said "don't research" but didn't explicitly instruct next steps
- **Fix:** Changed system note to explicit step-by-step: "1. Read research 2. Run hook-methodology skill 3. Run art-style skill 4. Generate images"

### Bug 4 (smart follow-up): Research-only cold resume
- **Symptom:** Follow-up on source-based campaign didn't tell agent to generate hooks
- **Cause:** Cold resume note listed available files but didn't say what to DO when only research exists
- **Fix:** Added conditional: when `hasResearch && !hasHooks`, note says "generate hooks and prompts from research"

## Pre-Existing Issues Discovered

### Cross-Campaign Data Contamination (March 16)
- Snitch campaign's research was overwritten with Heritage Foods content on March 16
- Both campaigns had identical 9125-char research files
- **Root cause:** DO is per-user, `this.campaignId` is mutable shared state. A file save event went to the wrong campaign.
- **Already fixed:** Session 55's `agentCampaignId` mismatch check prevents new occurrences. Only 1 of 27 campaigns was affected, and no contamination after March 16.

### S3FS Mount Race Condition
- `mountBucket` fails with "directory not empty" when previous campaign's FUSE cleanup overlaps with new campaign's setup
- **Workaround:** Retry works (second attempt mounts successfully)
- **Not fixed in this session** — pre-existing, not caused by new feature

## Documentation Updated

8 architecture docs updated:
- `CLAUDE.md` — Project overview
- `docs/architecture/INDEX.md` — Key numbers table
- `docs/architecture/shared/AI_AGENT_PIPELINE.md` — Skip research path
- `docs/architecture/cloudflare/DURABLE_OBJECT.md` — handleGenerate flow, hydration condition, hasSourceResearch
- `docs/architecture/client/STATE_MANAGEMENT.md` — New store fields
- `docs/architecture/client/WEBSOCKET_CLIENT.md` — generate() changes
- `docs/architecture/shared/WEBSOCKET_PROTOCOL.md` — sourceCampaignId field
- `docs/architecture/client/CLIENT_ARCHITECTURE.md` — Component annotations

## Research Artifacts

- `docs/research/supermemory-research.md` — Comprehensive Supermemory analysis (API surface, pricing, integration patterns, competitive analysis)

## Deferred TODOs

1. **Refresh Research action** — Button to re-run research for existing campaign. Workaround: create new campaign with URL.
2. **Auto-detect same brand by domain** — When user enters same URL, auto-copy research. Builds on copy-research pattern.
3. **Supermemory integration** — Cross-campaign learning, user preferences, evolving brand memory.
4. **Product image compositing** — Agent prompt changes to use uploaded product photos as reference images in ad generation.

## Deploys

| Time | Commit | What |
|------|--------|------|
| ~11:15 | Initial deploy | Feature code (7 files) |
| ~11:50 | Fix deploy | Follow-up path system note (`sdkSessionId \|\| hasSourceResearch`) |
| ~12:30 | Fix deploy | File event emission + explicit agent instructions |
