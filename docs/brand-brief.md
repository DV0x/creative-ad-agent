# Creative Machines — Brand & Design Brief

Paste the **BRIEF** block below into Claude Design's "Any other notes?" field. Everything above and below the block is context for you/the team, not for Claude Design.

Reference assets to upload alongside this brief live in `uploads/claude-design-refs/`.

---

## BRIEF (paste this into Claude Design)

```
PRODUCT
Creative Machines is a SaaS tool for Direct-to-Consumer (D2C) brand
marketers. They paste a brand URL; we research the brand, generate 6
ad hook concepts across proven copywriting frameworks (stat, story,
FOMO, curiosity, callout, contrast), produce art direction for each,
and deliver 6 on-brand ad images. Pricing: monthly/yearly subscriptions
plus one-time credit top-ups.

WHO USES IT
D2C founders, growth marketers, solo brand builders. They're creative
people running fast. They want tools that feel like creative partners,
not spreadsheets.

BRAND PERSONALITY
Editorial + playful hybrid. 80% editorial (bold, confident,
disciplined), 20% playful (human, warm, a little cheeky).
Think: The Whole Truth Foods meets Raycast. Confident without being
cold. Warm without being cute.

WHAT WE NEED
- A wordmark logo for "Creative Machines" (no icon, text-only).
  The mark should encode the product's promise — ideally speed or
  the transformation from creative input → machine output. Two
  colors max. Feel free to explore multiple directions.
- A full marketing landing page (hero, how-it-works, features,
  pricing, footer). Bold editorial type. Section-sized headlines
  with personality. Product screenshots integrated well.
- Core product UI patterns: sidebar nav, campaign workspace,
  asset browser, pricing/upgrade modal.

REFERENCES (attached as screenshots, prefixed "ref-")
- The Whole Truth Foods: for attitude, editorial discipline,
  logo logic (2-color wordmark that encodes brand promise), confident
  short copy
- Raycast: for proving editorial + playful can coexist inside a
  SaaS product
- Linear: for product-surface discipline — how to stay calm and
  legible inside the tool itself
- Oatly: for CPG-editorial cousin reference

ATTACHED PRODUCT OUTPUTS (files prefixed "product-ad-")
The 6 images prefixed "product-ad-" are REAL ad creatives our product
has generated for real D2C brands (real estate, menswear, food, home
goods, etc.). These are product artifacts, NOT design references.

How to use them:
- Treat them as the hero visual content on the landing page
- The landing page should showcase this output prominently — show
  variety, quality, on-brand feel across multiple categories
- A grid/gallery of these ads is probably the most persuasive proof
  we can show a marketer: "this is what the product makes"
- Do NOT copy the aesthetic of these ads into the page chrome itself.
  Each ad has its own brand styling (that's the point — we match the
  brand). The landing page around them is Creative Machines' own
  identity, which is what we're designing here.

PALETTE
Open to recommendation. Current direction: warm near-black (#231F20)
as foreground, cream or off-white background, one bold accent color.
Avoid pure black (#000) — too cold. Propose the accent based on the
brand feeling. One accent only, not three.

TYPOGRAPHY
Open to recommendation. Looking for a bold editorial display sans for
headlines (think Obviously Narrow, Druk, Archivo Black, or similar
heavy condensed grotesque) paired with a clean readable sans for body
and UI (Inter, Geist, General Sans, or similar). Strong hierarchy
between them.

VOICE IN COPY
Short sentences. Confident. No filler. "Real food is flawed." energy.
Directly address the marketer's frustration — slow campaigns, generic
AI output, endless iteration. Name the problem and flip it.

ANTI-PATTERNS — AVOID
- Gradients, glassmorphism, blurred backgrounds
- Generic AI purple/blue color schemes
- Dark mode (for now — light theme only)
- Cute illustrations, mascots, emoji-heavy UI
- Heavy shadows, rounded-everything (prefer crisp edges, small radii)
- Vercel-flat minimalism (too safe for a creative tool)
- Anything that looks like a ChatGPT clone

SURFACES NEEDED
- Marketing: landing page, pricing, about, logged-out state
- Product: campaign workspace (main editor), asset browser, settings,
  onboarding flow
- Transactional: empty states, error states, upgrade prompts

Give us multiple directions before we narrow down. We want to see
range.
```

---

## How to fill the Claude Design form

| Field | What to do |
|---|---|
| **Company name and blurb** | Already written. Keep as-is. |
| **Link code on GitHub** | Skip — current repo anchors to the design system we're replacing. |
| **Link code from your computer** | Skip — would bias Claude toward shadcn/Vercel aesthetic instead of editorial. |
| **Upload a .fig file** | Skip — none exists yet. |
| **Add fonts, logos and assets** | Upload everything from `uploads/claude-design-refs/`. |
| **Any other notes?** | Paste the BRIEF block above. |

## Iteration plan

1. **Generate logo first.** Lock in the wordmark before moving on.
2. **Then landing page.** Apply the wordmark and palette.
3. **Then product UI.** Dial down the editorial intensity for in-app surfaces.

Don't ask Claude to do all three at once — each piece gets weaker when batched.

## Honest caveats

- Expect 3–5 iterations. First pass will miss.
- Wordmark will be the weakest output — AI logo generation is the hardest case. Plan to hand-refine the best direction in Figma.
- In follow-up prompts, course-correct by reference: "more Raycast, less Oatly" / "palette is too sweet, cooler accent."
