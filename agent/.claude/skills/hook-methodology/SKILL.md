---
name: hook-methodology
description: Generates conversion-focused ad copy using hook-first methodology. Creates 6 diverse hook concepts from brand research. Use when creating Meta ads, conversion campaigns, ad copy, or when user mentions hooks, headlines, or scroll-stopping copy.
---

# Hook Methodology

Generates conversion ad copy using hook-first principles. The hook stops the scroll—everything else supports it.

## Core Principle

```
Hook = 80% of ad performance
Body + CTA = 20%

If the hook doesn't stop the scroll, nothing else matters.
```

---

## Workflow

### Step 1: Read Research

Read `agent/files/research/{brand}_research.md`

Extract:
- Specific numbers (prices, timeframes, stats)
- Pain points and frustrations
- Testimonial patterns
- ICP details
- **Brand colors** (primary, secondary, accent hex codes)

### Step 2: Build Hook Bank

Generate 10 potential hooks before selecting final 6.

For each research data point:
1. Identify the specific fact/number
2. Match to a hook formula (see [formulas.md](formulas.md))
3. Write 2-3 variants

### Step 3: Select 6 Diverse Hooks

**Diversity Matrix (must cover all 6):**

| Concept | Hook Type | Emotional Trigger |
|---------|-----------|-------------------|
| 1 | Stat/Data | Social Proof |
| 2 | Story/Result | Empathy + Relief |
| 3 | FOMO/Urgency | Loss Aversion |
| 4 | Curiosity | Intrigue |
| 5 | Call-out/Identity | Recognition |
| 6 | Contrast/Enemy | Differentiation |

### Step 4: Quality Check

Each hook must pass:

- [ ] **Specific?** — Has numbers/names/timeframes from research
- [ ] **Emotional?** — Triggers a feeling, not just informs
- [ ] **3-Second?** — Message is instantly clear
- [ ] **Competitor-proof?** — Can't be easily copied

### Step 5: Write Supporting Copy

For each hook add:
- **Body:** 1-2 sentences (expand, add proof)
- **CTA:** Action verb + outcome

### Step 6: Write to Hook Bank

Write output to file:

**Path:** `agent/.claude/skills/hook-methodology/hook-bank/{brand}-{YYYY-MM-DD}.md`

Example: `hook-bank/theratefinder-2025-12-06.md`

This file becomes the complete handoff document for the Art Style Skill.

---

## Output Format

```markdown
# [Brand Name] - Hook Bank
**Date:** [YYYY-MM-DD]
**Brand:** [brand-name]

## Brand Colors
- Primary: [#hex]
- Secondary: [#hex]
- Accent: [#hex]

## ICP Summary
[1-2 sentence target audience description from research]

---

## Concept 1
**Hook:** [Scroll-stopping headline]
**Body:** [1-2 supporting sentences]
**CTA:** [Action text]

## Concept 2
**Hook:** [Scroll-stopping headline]
**Body:** [1-2 supporting sentences]
**CTA:** [Action text]

## Concept 3
**Hook:** [Scroll-stopping headline]
**Body:** [1-2 supporting sentences]
**CTA:** [Action text]

## Concept 4
**Hook:** [Scroll-stopping headline]
**Body:** [1-2 supporting sentences]
**CTA:** [Action text]

## Concept 5
**Hook:** [Scroll-stopping headline]
**Body:** [1-2 supporting sentences]
**CTA:** [Action text]

## Concept 6
**Hook:** [Scroll-stopping headline]
**Body:** [1-2 supporting sentences]
**CTA:** [Action text]
```

---

## Quick Reference

For detailed hook formulas and examples, see [formulas.md](formulas.md).

**Hook Types:**
1. **Stat** — Specific number + surprising implication
2. **Story** — Person + problem → result
3. **FOMO** — Others acting + "what about you?"
4. **Curiosity** — Unexpected reveal + open loop
5. **Call-out** — "Hey [audience]" + direct challenge
6. **Contrast** — Old way vs new way
7. **Question** — Provocative question + implied answer
8. **Identity** — "If you're [identity]" + relevance
9. **Enemy** — Villain + what they hide
10. **Result** — Specific outcome + timeframe

---

## Anti-Patterns

Never use:
- "Your trusted partner" (generic)
- "Quality you can count on" (meaningless)
- "Solutions for your needs" (corporate)
- Round numbers like "save thousands" (use exact: "$347/mo")
- "Learn more" as CTA (weak)
- "Best rates guaranteed" (compliance risk)

---

## Remember

- 15-20 hooks in bank → select 6
- Every hook must be SPECIFIC (from research)
- 6 concepts = 6 DIFFERENT emotional triggers
- Output is copy only — Art Skill handles visuals
- Dont use or copy examples, create concepts on your own