# Session Summary: Creative Ad Agent Workflow Redesign
**Date:** December 5, 2025
**Focus:** Mortgage/Financial Services Ad Generation with Nano Banana

---

## 1. Current Architecture (Explored)

```
┌─────────────┐     ┌─────────────┐
│ STRATEGIST  │────>│   CREATOR   │
│ (extract    │     │ (hooks +    │
│  data)      │     │  images)    │
└─────────────┘     └─────────────┘
                          │
                          v
                   ┌─────────────┐
                   │ conversion- │
                   │ craft skill │
                   │ (hook       │
                   │ methodology)│
                   └─────────────┘
```

**Key Files:**
- `server/sdk-server.ts` - Express server, endpoints
- `server/lib/ai-client.ts` - Claude SDK wrapper
- `server/lib/nano-banana-mcp.ts` - Gemini image generation
- `agent/.claude/agents/strategist.md` - Data extraction agent
- `agent/.claude/agents/creator.md` - Ad creation agent
- `agent/.claude/skills/conversion-craft/SKILL.md` - Hook methodology

---

## 2. Proposed Two-Skill Architecture

```
┌─────────────┐     ┌─────────────────────────────┐
│ STRATEGIST  │────>│          CREATOR            │
│             │     │                             │
│ Extracts:   │     │  1. Load hook-craft skill   │
│ - Data      │     │  2. Load visual skill       │
│ - BRAND     │     │  3. Build hooks from data   │
│   COLORS    │     │  4. Compose creative prompts│
│             │     │  5. Generate via MCP        │
└─────────────┘     └─────────────────────────────┘
```

**Two Skills:**
1. **hook-craft** - Hook formulas, diversity matrix, emotional triggers (methodology)
2. **mortgage-visual** - Style principles, compliance rules, prompt guidance (visual)

---

## 3. Key Decision: Templates vs Creative Composition

### Template Approach (Rejected)
```
Template + Variables → Predictable but generic output
```
- Fill-in-the-blank prompts
- Consistent but lacks creative punch
- Output example: Generic "Your Path to Homeownership" ad

### Creative Composition Approach (Preferred)
```
Principles + Guidelines + Brand Data → Creator COMPOSES unique prompts
```
- Skill provides principles, not rigid templates
- Creator agent thinks about hook's emotional intent
- Composes unique prompt per concept
- More creative freedom, better variety

---

## 4. Prompt Testing Results

### Test 1: Simple Template Prompt
**Prompt:**
```
Create a mortgage advertisement... 3D clay-style house with a golden key...
headline 'YOUR PATH TO HOMEOWNERSHIP'... coral call-to-action button...
```

**Result:** Clean but generic. Brutalist borders, 3D clay house, correct text.
**Assessment:** Professional but forgettable.

---

### Test 2: Creative Composition Prompt
**Prompt:**
```
Scroll-stopping mortgage ad... house surrounded by 5 glossy emerald-green
stars orbiting it like satellites... 'WHY DIDN'T I FIND THIS SOONER?'...
```

**Result:** Typo in headline ("THID THIS"), scattered stars, muddy house.
**Assessment:** Creative concept but worse execution. More complex = more failure points.

---

### Test 3: Simplified Creative Prompt
**Prompt:**
```
Modern fintech brand - warm, approachable, trustworthy. Charming 3D clay-style
house with golden key floating beside it, glossy plastic material with soft
shadows. Headline in thick-bordered box. Coral CTA button.
```

**Result:** Beautiful 3D house and key, soft illustrated style with blue sky
background, trees, clouds. High production value.
**Assessment:** Good quality but WRONG STYLE - became "cute/Headspace" instead
of "bold/fintech".

---

## 5. Style Direction Analysis

### Original Brief Style: "Soft Brutalism + 3D Clay"
- Thick black borders
- Cream backgrounds
- Bold typography
- 3D clay illustrations
- Modern fintech feel

### Problem with 3D Clay for Mortgage
- "Cute" doesn't convert for serious financial decisions
- Looks like children's app, not trusted advisor
- Lacks gravitas and authority

---

## 6. Reference Images Analysis

**Location:** `/Ad_styles/`

### Pattern 1: Real + Illustrated Hybrid
- concept-1.jpg: Sketch on notepad → real house emerging
- concept-2.jpg: Real sofa + line-drawn lamp/plant
- Dream Home: Real person + sketched furniture background
- mortgage-2.jpeg: House outline frame + real interior

### Pattern 2: Emotional/Relatable People
- imp.jpeg: Man with regret "I should have invested"
- lack.jpg: Empty wallet, despair expression
- diy.jpeg: Happy family, strong headline

### Pattern 3: Conceptual/Surreal
- concept.jpg: Man sitting on giant alarm clock
- Mortgage.jpeg: Hand holding illustrated house

### Pattern 4: Bold Color + Typography
- Teal/green backgrounds
- Mixed weight headlines
- Professional but distinctive

---

## 7. Gemini/Nano Banana Capabilities Assessment

| Element | Can Gemini Do It? | Confidence |
|---------|-------------------|------------|
| Sketch-to-real transition | Maybe | Medium |
| Real person + illustrated | Harder | Low-Medium |
| Specific human emotions | Unreliable | Low |
| Bold typography on color | Yes | High |
| Conceptual compositions | Sometimes | Medium |
| 3D clay illustrations | Yes | High |
| Complex multi-layer composites | No | Very Low |
| Accurate text rendering | Mostly | Medium-High |

---

## 8. Paths Forward

### Path A: Work WITH Gemini's Strengths
- Illustrated/stylized (not photorealistic)
- Conceptual but simpler compositions
- Typography-forward designs
- Avoid complex human poses

### Path B: Hybrid Workflow
- Gemini generates illustrated elements
- Stock photos sourced separately
- Composite in post-production
- More control, more work

### Path C: Push Gemini (Experimental)
- Try to achieve reference-level concepts
- Many iterations, accept failures
- May need significant prompt engineering

---

## 9. Open Questions for Next Session

1. **Style direction:** Stick with 3D clay (make it more "mature") or pivot to different style?

2. **Human elements:** Include people in ads or avoid (Gemini limitation)?

3. **Production workflow:** Fully automated or hybrid with manual work?

4. **Skill structure:** How detailed should mortgage-visual skill be?

5. **Prompt composition:** Who writes prompts - detailed guidance in skill or let Creator be fully creative?

6. **Quality control:** How to handle Gemini failures (typos, wrong style)?

---

## 10. Files to Create/Update

### If Proceeding with Two-Skill Architecture:

1. **Rename/Refactor:**
   - `conversion-craft` → `hook-craft` (pure methodology)

2. **Create New:**
   - `mortgage-visual` skill (style principles, compliance, guidance)

3. **Update:**
   - `strategist.md` - Add BRAND COLORS section to output format
   - `creator.md` - Load both skills, compose prompts creatively

4. **Consider:**
   - Style library approach (multiple visual skills for different industries)
   - Reference image usage for brand consistency

---

## 11. Key Learnings

1. **More creative prompt ≠ better output** - Gemini has limitations
2. **Simple + clear often beats complex + creative** for AI generation
3. **Style consistency is hard** - Same prompt can produce different styles
4. **3D clay "cute" doesn't fit mortgage** - Wrong energy for financial decisions
5. **Reference images show higher bar** - Real + illustrated hybrids are sophisticated
6. **Text rendering is unreliable** - Typos happen, need to account for this
7. **The "idea" matters more than execution details** - Conceptual creativity is key

---

## 12. Reference Documents

- `/Ad_styles/CREATIVE_BRIEF_Mortgage_Ads.md` - Original style brief
- `/Ad_styles/NANO_BANANA_AD_CREATION_GUIDE.md` - Prompt engineering guide
- `/ARCHITECTURE.md` - System architecture (updated this session)
- `/Ad_styles/*.jpeg` - Reference images for style direction

---

**Next Steps:** Decide on style direction before building skills.
