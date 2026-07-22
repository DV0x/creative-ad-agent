# The Pick Line — one JSON file per picked creative (lite read schema)

You are reading a BUDGET-ENDORSED ad — real money kept this creative alive. Your read is what the
creative seat adapts FROM, mostly without re-opening the image. A lazy read loses the construction;
a guessed measurement re-guesses the winner's proportions into slop. Read text and visuals together
as ONE construction — the words and the layout are a single argument, never two inventories.

## The pick file — field/picks/p<N>.json, ONE JSON object, exactly this shape

```json
{ "pick": 1,
  "id": "<the manifest candidate id>",
  "lane": "COPIED VERBATIM from the manifest — an evidence class, never edited (harness-enforced)",
  "fillsQuota": "OPTIONAL: the quota slot this pick fills when it differs from lane",
  "promotionReason": "REQUIRED with fillsQuota: why your eye overrides the code's lane",
  "endorsement": { "daysRunning": 0, "variants": 0, "clusterSize": 0, "active": true, "job": "conversion" },
  "fourQuestions": {
    "construction": "CONSTRUCTION stated ABSTRACTLY — the transferable structure, no brand nouns ('objection-wall of sticky notes above a question hook', never 'Snitch's notes ad')",
    "drCheck": "DR-CHECK by EYE — does this ad actually sell (offer/proof/CTA visible in the pixels)? Your eye OVERRULES the manifest's anatomy regex; say when it does and why",
    "lesson": "THE LESSON — one sentence: what this ad teaches about what this market rewards. NO LESSON = NO SLOT; pick something else",
    "cloneRisk": "who else in the manifest runs this construction; 'high — mark doNotClone' when adapting it would read as a copy of a specific live ad"
  },
  "doNotClone": false,
  "formatFamily": "one of the CLOSED TABLE below — recognized, never invented",
  "claimType": "offer | social-proof | mechanism | callout | curiosity | comparison | objection-wall | letter",
  "persona": "one line: who this ad speaks to + awareness stage ('gym regular who already buys whey — product-aware')",
  "hook": { "text": "verbatim, typos included", "zone": "", "sizeRank": 1, "scale": "cap-height as % of frame height — MEASURED against the image, never guessed" },
  "textBlocks": [ { "text": "verbatim", "zone": "", "sizeRank": 2, "scale": "", "role": "WHY the argument needs it — roles transfer, surfaces get swapped" } ],
  "layout": { "grid": "", "eyePath": "", "imageTextRatio": "", "focal": "" },
  "device": "the named mechanism that makes this ad ITS ad — if you cannot name it you have not found the construction",
  "craft": { "finish": "photographed-real | designed-flat | mixed", "light": "", "material": "" },
  "palette": ["…"],
  "offer": { "visible": true, "framing": "" },
  "move": "one line: the stealable structural idea — structural, never surface",
  "keepSwapDerive": { "keep": "", "swap": "", "derive": "" },
  "variantAxis": "workhorse DCO picks: what changes across the siblings you VIEWED (product? colorway? scene?) — you picked THIS card by eye. Other-lane DCO picks: the axis as read from the manifest's dcoSiblings/copy fields, stated as such (their siblings are not downloaded)",
  "graduatedWinner": false,
  "validity": "none | event-bound | celebrity-required | status-required | seasonal | retargeting-context — one-line reason when not none",
  "renderability": "HIGH | MEDIUM | LOW — can a one-shot image model hold this construction (text amount, object count, layout complexity)?" }
```

Trimmed vs the heavy schema — deliberately: textBlocks cover the MAJOR blocks only (hook + every
sizeRank ≤ 2 block + the CTA), and `keepSwapDerive` is filled on WORKHORSE picks only (one honest
line each; other lanes leave it empty — the creative derives their own). Everything else keeps full
heavy depth: we don't compromise on anatomy.

## The formatFamily table — CLOSED. You recognize; you never invent.

This label aggregates across readers, runs, and clients — free labeling breaks the bank. Pick the one
row that fits; only when NONE fits, write `other:<describe precisely>` (it gets triaged into the
table deliberately, later, by a human). Each row: what it is / how you recognize it / what proof the
family demands of any spec built on it / compliance notes.

- **product-hero** — the product IS the composition (pack shot, macro, styled scene). Cues: product
  >50% of frame, brand-forward lighting. Proof: the real SKU (bound reference or model-known).
- **lifestyle-in-use** — a person mid-use in a real moment; the environment carries the story. Cues:
  scene first, product secondary. Proof: humans fill ROLES — no invented person presented as real.
- **ugc-style** — deliberately amateur: selfie framing, phone-flash finish, no design system. Cues:
  casual composition, native feel. Proof: a real photo or clearly anonymous framing — never a
  fabricated "customer photo" passed off as real.
- **testimonial-card** — a quote is the hero. Cues: quotation marks, attribution, stars dominate.
  Proof: REAL verbatim quote with a source; a DESIGNED quote card, never fake platform chrome
  (fabricated review-UI/WhatsApp = FABRICATION kill).
- **us-vs-them** — explicit comparison layout. Cues: two columns/sides, ticks vs crosses,
  "unlike/vs" language. Proof: an anchored fact in EVERY cell. Compliance: named competitors carry
  legal weight; no unsubstantiated disparagement.
- **problem-solution** — the pain visualized, then the fix. Cues: before/after or problem-callout →
  product-answer structure. Compliance: before/after imagery RESTRICTED in health; describe the
  problem's box, never the buyer's condition (personal-attributes law).
- **text-billboard** — type IS the ad: one claim, huge. Cues: minimal/no imagery, a single standalone
  statement. Proof: the one fact must carry standalone strength AND substantiation.
- **offer-card** — the deal is the hero. Cues: price slash, bundle math, deadline chip. Proof: a REAL
  offer within OFFERS ALLOWED; real deadlines only.
- **editorial-advertorial** — styled like an article or press mention. Cues: serif headline register,
  column body, "as seen in". Proof: never impersonate a real publication (fabricated masthead =
  FABRICATION).
- **meme-native** — internet-native joke grammar. Cues: meme template structure, screenshot
  aesthetics, deliberately lo-fi. Proof: no fake platform UI (a designed meme ≠ a fabricated tweet).
- **infographic-mechanism** — the HOW visualized. Cues: diagram arrows, numbered steps, ingredient
  callouts. Proof: mechanism claims substantiated. Compliance: health mechanism claims need the
  disclaimer in ad copy.
- **other:<describe>** — the escape hatch. Describe precisely; never silently stretch a row to fit.

## The disciplines (kept at full heavy depth)

**Verbatim text, typos included.** Copy every string exactly as rendered — a typo that ran 101 days
is EVIDENCE (endorsement ≠ polish), not noise to clean up.

**Scale is MEASURED, never guessed.** Hook and every sizeRank ≤ 2 block: cap-height as a fraction of
frame height, estimated against the image's actual proportions ("~7% per line, 3 stacked lines").
Winning proportions transfer only if measured. Feed reference points: endorsed feed headlines run
~6–8% per line; nothing functional sits below ~2%.

**Every element carries a ROLE.** Not what it is — why the argument needs it. A human in the frame:
name the role they fill (seller-presenter, testimonial-giver, aspirational-self) — the ROLE
transfers, the person never does.

**validity names what the construction NEEDS to stay true.** Event-bound (a real sale date),
celebrity-required (rented fame), status-required (owned prestige), seasonal, retargeting-context
(assumes the viewer knows the brand). `none` when it transfers freely. This is what stops a borrowed
construction from running on fuel the next brand doesn't hold.

**DCO picks: view EVERY sibling image, pick ONE by eye, record the VARIANT AXIS.** A sibling you saw
running standalone as its own IMAGE ad elsewhere in the manifest = mark `graduatedWinner: true` —
the brand promoted that design out of the test pool; that is the strongest single endorsement signal
the Ad Library gives.
