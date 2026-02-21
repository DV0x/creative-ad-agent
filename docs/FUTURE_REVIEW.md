# Future Review

Issues to fix in a future pass.

---

## R1: Campaign ID Window

Between `startGeneration` (local ID) and `replaceCampaignId` (server ID via `ack`), any API call using the local ID will 404. FileEditor auto-save can trigger during this ~1-2s window.

**Fix options:**
- Defer file saves until `ack` arrives
- Retry failed saves after campaign ID replacement
- Disable editor until campaign ID is confirmed

---

## R2: Dual Image Event Path

Images arrive via two paths: EventEmitter (real-time from MCP) and SDK `tool_result`. The `processedFilenames` Set deduplicates broadcasts, but if both paths call `addCampaignImage()` simultaneously they can create duplicate DB rows. Hidden from UI by `MAX(version)` filter but pollutes the database.

**Fix options:**
- Add `UNIQUE(campaign_id, image_index, filename)` DB constraint
- Consolidate to a single image arrival path
- Add a DB-level upsert instead of blind insert

---

## Image Regeneration Doesn't Scale (Phase 2)

Current image regeneration works via session resume — the agent "remembers" images through full conversation replay. This means regenerating 1 image replays all previous tool calls/results. Cost compounds with each follow-up.

**Solution:** Stateless image operations. See §10.4 in ARCHITECTURE.md for full plan.

- Enrich `campaign_images` with full context at generation time (prompt, style params, aspect ratio, etc.)
- Add `POST /api/campaigns/:id/images/:index/regenerate` endpoint that pulls metadata from DB instead of session history
- Add `parent_image_id` to `campaign_images` for version lineage
- Route structured operations (regenerate, vary, style swap) to stateless endpoint; keep `followUp()` for creative conversation only

---

## Batch Download

`ImageCard` and `ImageLightbox` single-image download works (same-origin `<a download>`). Batch download toolbar button has no `onClick` handler.

---

## Batch Operations

Image selection UI works and toolbar shows count, but no bulk download/delete/export API exists behind it.
