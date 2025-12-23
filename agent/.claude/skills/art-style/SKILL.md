---
name: art-style
description: Creates visual prompts from hooks. Expects hook-bank to exist. Outputs prompts.json for MCP image generation.
---

# Art Style Skill

Routes to the appropriate art style workflow based on user keywords.

## Prerequisites

**Hook-bank must exist before triggering this skill.**
Main Agent triggers `hook-methodology` skill first, which creates:
`/storage/hooks/{brand}-{date}.md`

## Input/Output

- **Input:** Reads hook-bank file for brand colors, ICP, and 6 hook concepts
- **Output:** Writes `/storage/creatives/{brand}_prompts.json`

Main Agent handles image generation via MCP after this skill completes.

---

## Style Routing

| User Keywords | Workflow |
|---------------|----------|
| "clay", "diorama", "anderson", "theatrical", "miniature", "handcrafted" | `workflows/anderson-clay-diorama.md` |
| "surreal", "dreamlike", "scale", "giant" | `workflows/surrealist-scale.md` (future) |
| "minimal", "clean", "photography", "simple" | `workflows/minimal-photography.md` (future) |
| (none specified) | `workflows/anderson-clay-diorama.md` **(default)** |

> **Note:** `soft-brutalism-clay.md` is deprecated. Use `anderson-clay-diorama.md` which includes theatrical lighting, camera grammar, composition systems, and texture hierarchy.

---

## Adding New Styles

1. Create `workflows/new-style-name.md`
2. Include: hook-bank loading, creative process, prompt construction
3. Add detection keywords to routing table above
4. Output prompts to `/storage/creatives/{brand}_prompts.json`

Each workflow file must be **100% self-contained** for the creative process.
