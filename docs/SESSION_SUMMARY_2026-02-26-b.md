# Session Summary — 2026-02-26-b

## What We Fixed

### 1. Prompt Quality: Missing HEADLINE, CTA, BRAND ANCHOR, DO NOT (Art-Style Skill Fix)

**Problem:** The art-style skill generated vague single-paragraph prompts that missed critical sections from the workflow templates. Images came back with no hook text overlay, no brand anchor specificity, and no negative constraints.

**Root Cause:** The agent read the detailed workflow templates (dream-sketch-hybrid.md, service-realism.md) but compressed when generating the `prompt` field — dropping TYPOGRAPHY, BRAND ANCHOR, DO NOT, and diversity assignments. No validation step existed to catch this before writing prompts.json.

**Comparison (before → after):**

| Section | Before (broken) | After (fixed) |
|---------|-----------------|---------------|
| HEADLINE | Missing entirely — hook text only in JSON metadata | `HEADLINE: "No one in your family studied abroad..."` with position, font, color |
| CTA | Missing entirely | `CTA: "Meet your counselor"` with position, color, pill background |
| BRAND ANCHOR | Missing | Full block: owned positioning + visual translation + logo swap check |
| DO NOT | Missing | 10 style-specific negative constraints |
| Diversity | Generic descriptions | Specific assignments: `marker-wash`, `person-centered`, `clean-white` |
| Prompt structure | ~200 word loose paragraph | ~800 word structured template (SUBJECT, ENVIRONMENT, CAMERA, etc.) |

**Fix (1 file changed):**

`agent/.claude/skills/art-style/SKILL.md`:
- Added **Step 4b: Prompt Validation (MANDATORY)** between Step 4 (Generate Prompts) and Step 5 (Validate Entity ID)
- 5-item checklist the agent must verify before writing each `prompt` string:
  1. HEADLINE text with exact `story.hook` + position, font, color, weight
  2. CTA text with exact `story.cta` + position, color
  3. Diversity assignment from the workflow's diversity matrix (exact assigned values)
  4. DO NOT list (at least 5 items from the workflow's template)
  5. BRAND ANCHOR (owned positioning + visual translation + logo swap check)
- Added `VALIDATE: Check prompt against Step 4b before writing` to Step 4's code block

**Verified:** Fresh session with Verbisedu campaign — prompts now include all 5 mandatory sections. Both Dream Sketch Hybrid and Service Realism prompts follow the structured template format.

---

### 2. Cancel → Follow-Up Starts Fresh Session Instead of Resuming (WebSocket Handler Fix)

**Problem:** When a user cancelled a generation mid-stream and then typed a follow-up, the agent started a fresh SDK session with no campaign context. The agent would respond "I need context" or error out because it had no knowledge of the research, hooks, or prior work.

**Root Cause:** In `handleFollowUp`, cancelled campaigns were excluded from resume:

```typescript
// OLD (broken):
if (campaign.status !== 'error' && campaign.status !== 'cancelled') {
  sdkSessionId = db.getSdkSessionId(campaignId);
}
```

This treated `cancelled` the same as `error` — skipping the SDK session ID lookup. But cancelled sessions have valid JSONL files (the SDK writes complete lines; cancel just stops iteration, it doesn't corrupt the file).

**Fix (1 file changed):**

`server/lib/websocket-handler.ts:1074-1079`:
- Removed `cancelled` from the skip condition — only `error` campaigns skip resume now
- Comment updated to explain: cancelled campaigns have valid JSONL context

```typescript
// NEW (fixed):
if (campaign.status !== 'error') {
  sdkSessionId = db.getSdkSessionId(campaignId);
}
```

**Result:** Cancel → follow-up → SDK resumes with `--resume` → full conversation context (research, hooks, prompts, everything) preserved.

---

## Investigation Findings

### Why Resumed Sessions Didn't Pick Up SKILL.md Changes

When testing the Step 4b fix via a resumed session (SDK session `02c1dc6d-...`), the prompts were still vague. This is because **resume replays the old JSONL** — the agent's context contains the OLD SKILL.md from the previous read. The updated SKILL.md was on disk but never re-read.

**Implication:** Skill file changes only take effect on **fresh sessions** that read the files from disk. Resumed sessions carry their original context. This is expected behavior — not a bug.

### Context Pressure on Prompt Generation

The service-brand workflow files are ~1,200 lines total (dream-sketch-hybrid: 586, service-realism: 655). By the time the agent reads both workflows + SKILL.md + hook bank + research, the context has ~200-500K tokens of cache reads across turns. The agent generates output under significant context pressure.

The Step 4b checklist works because it's a concise, explicit validation step — the agent checks 5 items rather than trying to reproduce the entire template from memory. The checklist is positioned right before the write step, so it's the last thing the agent sees before generating output.

### Follow-Up After Resume: 0 Output Tokens Pattern

Observed a pattern where follow-up resumes produce `output_tokens: 0` with minimal cost ($0.006). The SDK loads context but the model doesn't generate a response. This happened once during testing but succeeded on retry. Root cause unclear — possibly a transient API issue or the model treating the conversation as "done" after a clean completion. Not consistently reproducible.

---

## Files Changed

| File | Change |
|------|--------|
| `agent/.claude/skills/art-style/SKILL.md` | Added Step 4b: Prompt Validation checklist (HEADLINE, CTA, diversity, DO NOT, BRAND ANCHOR) |
| `server/lib/websocket-handler.ts` | Removed `cancelled` from resume skip condition — cancelled campaigns now resume |

---

## What's Next

### Remaining Improvements to Investigate

1. **Image text rendering quality** — The prompts now include HEADLINE/CTA instructions, but diffusion models (Flux/Nano Banana Pro) are unreliable at rendering clean text. Need to verify whether the generated images actually show readable hook text, or if a post-processing text overlay step is needed.

2. **Follow-up 0-token pattern** — Monitor whether the "resume produces 0 output tokens" pattern recurs. If it does, investigate whether it's rate-limiting, context size, or the model treating completed conversations as done.

3. **SDK session ID overwrite on fresh fallback** — When resume fails and falls back to a fresh session, the new SDK session ID overwrites the original in the DB (`ai-client.ts` line 371). This means the good session ID (with full context) is lost. Consider: only overwrite the SDK session ID if the new session actually produces output.
