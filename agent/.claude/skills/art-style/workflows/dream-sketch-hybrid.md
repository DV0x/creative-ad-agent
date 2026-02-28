# Dream Sketch Hybrid

Photorealistic person composited into a hand-drawn sketch/illustration environment. The person is REAL, the aspiration is ILLUSTRATED. A service-brand workflow where the visual hero is people and scenes, not physical products. The contrast between photorealistic subject and illustrated world creates a "dreaming of their future" visual metaphor. Perfect for loans, insurance, education, home services, coaching.

**Family:** Service Brand
**Prerequisites:** Hook-bank file must exist. Main Agent triggers hook-methodology skill first.

---

## Style Overview

**What it is:** A mixed-media composition where a photorealistic person (matching the brand's target market demographics) is composited into a hand-drawn sketch or illustration environment. The person is rendered with hyper-realistic skin, clothing, and lighting. The surrounding world — buildings, vehicles, furniture, landscapes, objects — is drawn in one of 5 sketch sub-styles (pencil line-art, ink & pen, marker wash, blueprint, charcoal). The contrast between real person and illustrated aspiration creates a powerful "dreaming of their future" metaphor that works across every service category.

**Why it works:**
- The real-person-in-sketch-world metaphor is instantly readable: "this is what you could have"
- Photorealistic people create emotional connection — viewers see themselves in the subject
- Sketch environments are aspirational without the uncanny valley risk of fully rendered scenes
- The mixed-media contrast is visually distinctive in feeds dominated by either pure photo or pure illustration
- Audience-adaptive people generation ensures the subject matches the brand's target market
- 5 sketch sub-styles × 4 composition types × 3 backgrounds = 60 unique combinations across a campaign

**Visual Characteristics:**

| Element | Specification |
|---------|---------------|
| Subject | Photorealistic person(s) matching ICP demographics — age, ethnicity, clothing, expression |
| Environment | Hand-drawn sketch elements in one of 5 sub-styles surrounding the person |
| Mixed-media contrast | Sharp boundary between photorealistic person and illustrated world |
| Background | Clean white, brand-color gradient, or textured paper (kraft/cream) |
| Composition | Person + sketch arranged in one of 4 composition types |
| Lighting | Natural, even lighting on person; sketch elements have no independent lighting |

---

## Step 1: Load Hook Bank + Audience Profile Extraction

Follow the **Hook-Bank Loading** process in SKILL.md. Extract brand colors, ICP, category, owned positioning, and 6 hook concepts with psychology, funnel stage, format intention, and visual direction fields.

### Audience Profile Extraction (Service Brand Extension)

After loading the hook-bank, extract demographic data to generate audience-appropriate people in prompts:

1. **Age & Life Situation** — Read `ICP → WHO` field. Map age range and life situation to person age and context:
   - "young professionals" → 25-32, business casual, confident posture
   - "new homeowners" → 28-38, casual-smart, couple or individual
   - "parents" → 30-45, relaxed but put-together, warm expression
   - "retirees / seniors" → 55-70, comfortable clothing, relaxed posture
   - "students" → 18-25, casual, energetic expression

2. **Geography & Ethnicity** — Read brand URL, language, and currency signals from research brief:
   - `.ca` / CAD / Canadian references → diverse Canadian demographics
   - `.com.au` / AUD → Australian demographics
   - `.co.uk` / GBP → British demographics
   - `.com` + USD + US city references → American demographics
   - `.in` / INR → Indian demographics
   - No clear signal → use diverse, mixed representation

3. **Clothing & Style** — Read `ICP → LANGUAGE` sophistication level and brand voice:
   - Formal/corporate brand voice → business attire, structured clothing
   - Casual/friendly brand voice → smart casual, relaxed clothing
   - Traditional/cultural brand voice → culturally appropriate attire
   - Youth/energetic brand voice → trendy casual, contemporary style

4. **Scenario Context** — Map service category to person-in-situation:
   - Mortgage/Home Loans → couple reviewing blueprints, person in front of house sketch
   - Education → student with books, learner at desk, graduate
   - Insurance → family together, person in protective context
   - Legal → professional consultation scene, person reviewing documents
   - Home Services → homeowner gesturing at home improvement sketch
   - Real Estate → person/couple viewing property sketch
   - Coaching → person in growth/achievement pose

**Output:** An audience profile block used in every prompt:
```
Subject: [ethnicity descriptor from market] [age from ICP] [gender],
         [clothing from brand voice], [pose from composition type],
         [expression from hook psychology]
```

---

## Step 2: Brand Anchor Derivation

Follow the **Brand Anchor Derivation** framework in SKILL.md with this style-specific guidance:

**Principle:** In Dream Sketch Hybrid, brand specificity comes through the sketch content (what aspirational objects/environments are drawn), the person's context (what they're doing/wearing/holding), and the sketch sub-style choice (which should echo the brand's visual personality).

**Style-specific translation (step 2):**
- The sketch elements must depict THIS brand's specific service outcome — not generic aspiration but the exact promise (e.g., a mortgage broker shows a sketched dream home with the person holding blueprints, not just "a happy person")
- The person's clothing, age, and setting should match the brand's actual target market — the viewer should think "that's someone like me"
- The sketch sub-style choice should align with the brand's personality: blueprint for precise/technical brands, marker wash for casual/friendly brands, pencil line-art for clean/professional brands
- Brand colors appear in the background treatment or as accent tones in the sketch elements (colored sketch lines, gradient background)

---

## Step 3: Category Adaptation

Dream Sketch Hybrid adjusts its sketch content and person context based on the detected service category:

| Category | Person Context | Sketch World | Sketch Sub-Style Bias | Emotional Tone |
|----------|---------------|-------------|----------------------|----------------|
| **Financial Services** | Person reviewing documents, couple planning together, individual with confident posture | Sketched dream home, rising graph lines, financial documents, keys | Pencil Line-Art or Blueprint | Confident security, planning |
| **Education** | Student with books/laptop, learner in study pose, graduate celebrating | Sketched campus buildings, graduation cap, bookshelves, classroom | Ink & Pen or Marker Wash | Aspiration, growth, achievement |
| **Healthcare** | Person in good health, family together, patient smiling | Sketched clinic, healthy lifestyle elements, medical symbols | Pencil Line-Art or Charcoal | Trust, wellness, care |
| **Legal** | Professional in consultation, person with relieved expression | Sketched courtroom, scales of justice, legal documents, gavel | Ink & Pen or Blueprint | Authority, resolution, protection |
| **Home Services** | Homeowner gesturing proudly, person relaxing in improved space | Sketched renovated room, tools, house exterior, garden | Marker Wash or Charcoal | Comfort, improvement, pride |
| **Real Estate** | Couple or individual in "viewing" pose, person holding keys | Sketched property exterior, floor plan, neighborhood, sold sign | Pencil Line-Art or Blueprint | Excitement, new beginning |
| **Coaching** | Person in powerful stance, individual mid-growth-moment | Sketched path/mountain, achievement symbols, growth chart | Charcoal or Ink & Pen | Empowerment, transformation |

---

## Step 4: Visual Concept Creation + Diversity Assignment

For each hook, build the Dream Sketch Hybrid composition by translating the hook psychology into a visual treatment, then assign a unique combination from the diversity axes.

### Hook Psychology to Dream Sketch Treatment

| Hook Psychology | Person Treatment | Sketch World Treatment | Emotional Direction |
|----------------|-----------------|----------------------|---------------------|
| **Pain/Problem** | Person with a frustrated, stuck, or worried expression. Posture slightly closed or tense. Looking at or surrounded by the sketch problem. | Sketch elements depict the PROBLEM state — messy, incomplete, broken, or overwhelming sketched objects. Sketch lines may be heavier, more chaotic. | The person is REAL and stuck; the illustrated world shows WHY. Tension between real frustration and sketched obstacles. |
| **Aspiration/Identity** | Person with a warm, confident, forward-looking expression. Open posture, relaxed shoulders. Looking toward or reaching into the sketch aspiration. | Sketch elements depict the DREAM state — beautiful, complete, aspirational objects. Sketch lines are clean, detailed, inviting. The illustrated world is the "someday." | The person dreams it; the sketch shows it. Warmth between real hope and illustrated possibility. |
| **Social Proof** | Person with a satisfied, reassured expression. Posture grounded, stable. May be gesturing toward the sketch elements as if showing results. | Sketch elements depict achieved outcomes — completed home, successful graduation, resolved situation. May include sketched statistics or review elements. | The person has arrived; the sketch shows what they achieved through this service. Confidence and proof. |
| **Education/Value** | Person in a learning or discovery pose — leaning in, examining, taking notes. Engaged, curious expression. | Sketch elements are detailed and informative — labeled diagrams, step-by-step illustrations, process flows. The sketch teaches. | The person learns; the sketch explains. Clarity between real engagement and illustrated information. |
| **Urgency/Scarcity** | Person in an active, forward-leaning pose. Determined expression. Moving toward or reaching for the sketch opportunity. | Sketch elements suggest time-sensitivity — clock elements, diminishing objects, "now or never" visual cues in the illustration. Sketch lines may be bolder, more immediate. | The person acts NOW; the sketch shows what's slipping away. Energy and momentum. |
| **Transformation** | Person mid-transition — one foot in reality, one foot in the sketch world. Expression is hopeful, changing. | Sketch elements transition from rough/incomplete on one side to refined/complete on the other — the illustrated world itself transforms. | The person is becoming; the sketch shows the journey. Movement from current to aspirational. |
| **Curiosity/Question** | Person with an intrigued, questioning expression. Head slightly tilted, looking at the sketch world with wonder. | Sketch elements are partially revealed — some complete, some fading, some hidden behind other sketch objects. The illustration teases rather than shows. | The person wonders; the sketch hints. Intrigue between real curiosity and illustrated mystery. |

### Diversity Assignment Matrix

Each of the 6 hooks gets a UNIQUE combination from these three axes:

**5 Sketch Sub-Styles** (assign round-robin, no repeats until all 5 used):
1. **Pencil Line-Art** — thin gray outlines, architectural, clean, no fill. Precise, technical, aspirational.
2. **Ink & Pen** — confident black ink lines, slightly thicker, illustrative. Bold, editorial, authoritative.
3. **Marker Wash** — soft lines with light color washes in sketch elements, casual. Warm, approachable, friendly.
4. **Blueprint/Technical** — precise geometric lines, blue-white palette, engineering feel. Precise, methodical, trustworthy.
5. **Charcoal/Conte** — soft, sketchy, fine-art quality, expressive strokes. Emotional, artistic, intimate.

**4 Composition Types** (cycle through):
1. **Person Centered, Sketch Surrounds** — person sits/stands center, sketch environment frames them in all directions
2. **Person Inside Sketch Object** — person composited into a sketched vehicle, building, workspace, or furniture
3. **Person + Large Sketch Side-by-Side** — person on one side (40%), large sketch element on the other (60%)
4. **Person Below, Sketch Above** — person at bottom third, aspirational sketch rising above them like a thought bubble

**3 Background Treatments** (distribute across hooks):
1. **Clean white** — pure white background, sketch elements float on white, maximum contrast
2. **Brand-color gradient** — subtle gradient using brand primary at 10-20% opacity, adds warmth
3. **Textured paper** — kraft, cream, or aged paper texture, gives the sketch elements a physical, tactile quality

**Assignment Process:**
1. List 6 hooks by number (1-6)
2. Assign sketch sub-styles: Hook 1→Style 1, Hook 2→Style 2, Hook 3→Style 3, Hook 4→Style 4, Hook 5→Style 5, Hook 6→Style 1 (or best match for the hook's category)
3. Assign compositions: Hook 1→Comp 1, Hook 2→Comp 2, Hook 3→Comp 3, Hook 4→Comp 4, Hook 5→Comp 1, Hook 6→Comp 2
4. Assign backgrounds: Hooks 1-2→White, Hooks 3-4→Brand gradient, Hooks 5-6→Textured paper
5. Vary person demographics within ICP range: mix gender, vary age within the ICP band, vary pose

**Diversity Matrix Check — verify before proceeding:**
- [ ] No two hooks share the SAME sketch sub-style + composition combination
- [ ] At least 3 different sketch sub-styles used across the 6 hooks
- [ ] At least 2 different background treatments used
- [ ] At least 2 different aspect ratios in the set (per SKILL.md: 2× 4:5, 2× 1:1, 2× 9:16)
- [ ] Person demographics vary where ICP allows (mix of gender, age within range)

---

## Step 5: Design Principles

### 1. Photorealistic Person as Emotional Anchor
- The person must be rendered with hyper-realistic quality — natural skin texture, real hair, visible pores, authentic clothing wrinkles
- Lighting on the person is natural and even — soft key light from above-left, gentle fill, no dramatic shadows
- The person is the emotional anchor — their expression, pose, and gaze guide the viewer's emotional response
- Person should occupy 30-45% of the frame depending on composition type
- The person's edge where they meet the sketch world should be clean — no blend, no fade, a crisp boundary between real and illustrated

### 2. Sketch Elements as Aspirational World
- All non-person elements are rendered in the assigned sketch sub-style — consistent throughout the composition
- Sketch elements depict the service outcome, not the service itself (show the dream home, not the mortgage application)
- Sketch line weight and density should be uniform within a composition — no mixing of sketch styles
- Sketch elements can be partially behind the person (creating depth) or fully in front/beside (creating framing)
- The sketch world should feel hand-drawn and human — imperfect, organic, with visible construction lines in appropriate sub-styles

### 3. Mixed-Media Boundary
- The boundary between photorealistic person and sketch environment is the key visual feature — it must be clear and intentional
- No gradual blending or feathering between photo and sketch zones
- The person casts no shadow on the sketch elements (they exist in different visual realities)
- Small interaction points are allowed: person's hand resting on a sketched table, person sitting in a sketched chair (the contact point is where the magic happens)
- The mixed-media contrast should be visible and readable at thumbnail scale (300px width)

### 4. Background as Canvas
- Background treatment (white/gradient/textured) is the canvas on which both person and sketch exist
- Clean white backgrounds maximize the contrast between photo person and sketch elements
- Brand-color gradients should be subtle (10-20% opacity) — the gradient supports, it doesn't compete
- Textured paper backgrounds give the sketch elements a physical, tactile quality — as if drawn on real paper with the person "placed" on top
- Background should be 40-55% of the visible composition — the person and sketch fill the rest

### 5. Typography Integration
- Headline text should complement, not compete with, the sketch elements
- Use clean sans-serif typography (not decorative, not serif) — let the sketch style provide the creative texture
- Text can sit on the background canvas, overlapping sketch elements slightly but never obscuring the person
- Brand colors in the text connect the typography to the overall brand identity
- CTA should be clear and separate from the sketch world — grounded in the "real" layer

### 6. Person-Sketch Interaction Points
- At least one interaction point between the person and sketch world — where reality touches aspiration
- Examples: hand on a sketched doorknob, sitting in a sketched chair, holding a sketched document, feet on sketched ground
- These interaction points are the visual metaphor's power — "this real person is reaching into their illustrated future"
- Keep interactions natural and physically plausible — no floating hands or impossible poses

---

## Prompt Template

```
Create a [4:5/1:1/9:16] social media ad image.

SUBJECT: A [age descriptor from ICP] [ethnicity/appearance from market] [gender],
[clothing style from brand voice and category], [specific pose from composition type],
[facial expression from hook psychology]. Photorealistic rendering with hyper-realistic
skin details, natural hair texture, authentic clothing fabric. Natural even lighting —
soft key light from above-left, gentle fill light, no dramatic shadows. The person is
sharp, detailed, and emotionally present.

MIXED-MEDIA ENVIRONMENT: Surrounding the person, [sketch sub-style name] hand-drawn
illustrations of [aspiration objects from hook visual direction and category adaptation].
[Composition type specific layout instructions — where person sits relative to sketch
elements]. The sketched elements are [line weight, stroke characteristics, fill treatment
specific to the assigned sub-style]. [Specific sketch objects described in detail —
what is drawn, how it relates to the service outcome].
The contrast between photorealistic person and illustrated environment creates a
"dreaming of their future" visual metaphor. The boundary between photo and sketch
is clean and intentional — no gradual blending.

INTERACTION POINT: [Describe where the person physically touches or interacts with the
sketch world — hand on sketched object, sitting in sketched furniture, feet on sketched
ground. This is the magic moment where reality meets aspiration.]

BACKGROUND: [Background treatment — clean white / brand-color gradient at 10-20% opacity /
textured paper (kraft/cream)]. The background is the canvas on which both person and
sketch exist, occupying [40-55]% of the visible composition.

CAMERA: [Focal length — 35-85mm depending on composition type], [angle — eye level for
centered, slightly low for empowering, straight-on for side-by-side], [DOF — person in
sharp focus, sketch elements slightly softer but still fully legible].

BRAND ANCHOR:
Owned positioning: [What ONLY this brand can claim — from hook-bank]
Visual translation: [How the sketch content + person context + sub-style showcase the differentiator]
Logo swap check: [Could a competitor use this exact visual? What makes the sketch content and person scenario specific to this brand?]

TYPOGRAPHY:
HEADLINE: "[Exact hook text]"
- Position: [On background canvas, above or below person, or beside sketch elements]
- Font: Clean sans-serif (Montserrat, Inter, or similar)
- Color: [brand primary or dark neutral for legibility]
- Weight: SemiBold to Bold
- Treatment: [Sentence case or ALL CAPS depending on hook energy]

CTA: "[Exact CTA text]"
- Position: [Below headline or bottom-center above safe zone]
- Font: Sans-serif matching headline
- Color: [brand accent or primary]

MOBILE CONSTRAINTS:
[Apply all safe zone rules from SKILL.md § Mobile Safe Zone Rules]
- Hero element: Person must occupy at least 30% of frame

MOOD:
[One line — the emotional tone derived from hook psychology and the aspiration/reality contrast]

DO NOT:
- Fully photorealistic environments (sketch elements only — the world is illustrated)
- Fully illustrated people (person must be photorealistic)
- Gradual blending between photo and sketch zones (clean boundary required)
- Multiple sketch sub-styles in one composition (one consistent style throughout)
- Shadows cast by the person onto sketch elements (different visual realities)
- Product-centric compositions (person is the hero, not a product)
- Generic stock-photo poses (pose must relate to the hook and service context)
- Clip-art or vector-style illustrations (hand-drawn sketch quality required)
- Overly busy sketch environments that compete with the person
- Person smaller than 30% of frame
```

---

## Example Prompts

### Example 1: Mortgage Broker (4:5)

**Brand:** The Rate Finder
**Colors:** Primary #1B4D6E (deep teal), Secondary #F5F0E8 (warm cream), Accent #D4883A (warm copper)
**Hook Type:** Aspiration/Identity
**Hook:** "Your dream home is closer than you think."
**Psychology:** Aspiration — reframes home ownership from distant goal to achievable reality. Targets first-time buyers who feel priced out.
**Category:** Financial Services
**Audience Profile:** Canadian market, 28-35 age range, young professional couple, smart casual clothing

```
Create a 4:5 social media ad image.

SUBJECT: A 30-year-old South Asian Canadian woman, wearing a soft cream knit
sweater and dark jeans, standing with relaxed confidence — one hand resting on
a sketched doorframe, the other holding a set of sketched keys. Her expression
is warm and forward-looking, a gentle smile with eyes gazing slightly upward
toward the sketched house above her. Photorealistic rendering with hyper-realistic
skin details, natural black hair with soft highlights, authentic fabric texture
on the sweater. Natural even lighting — soft key light from above-left creating
gentle warmth on her face, gentle fill light, no dramatic shadows.

MIXED-MEDIA ENVIRONMENT: Surrounding the person, pencil line-art hand-drawn
illustrations of a charming two-story home with a pitched roof, front porch with
steps, a small garden with a sketched tree, and a mailbox at the curb. The front
door of the sketched house is directly behind and above the person, creating a
natural frame. The sketched elements are thin gray pencil outlines — architectural,
clean, precise, with no fill or shading. Construction lines are subtly visible
where walls meet roof, giving the sketch an intentional "just drafted" quality.
A sketched path leads from the bottom of the frame up to the front porch, with
the person standing on the path.
The contrast between the photorealistic woman and the pencil-drawn dream home
creates a "this could be yours" metaphor. The boundary between photo and sketch
is clean — her sweater edges meet the pencil lines without blending.

INTERACTION POINT: Her right hand rests on the sketched doorframe of the front
door — her real fingers wrap around the illustrated wood frame. Her left hand
holds sketched keys on a keyring, the keys dangling from her real fingertips
into the sketch world. These two contact points bridge reality and aspiration.

BACKGROUND: Clean white background. The sketched house and garden elements float
on the white canvas with the photorealistic woman grounded at center. White space
occupies approximately 45% of the visible composition, framing the mixed-media
scene cleanly.

CAMERA: 50mm, eye level, medium shot (waist up plus sketched house above).
Person in sharp focus, pencil sketch elements slightly softer but fully legible.
Shallow depth of field — person crisp, background sketch elements have a subtle
softness that reinforces the "dream" quality.

BRAND ANCHOR:
Owned positioning: The Rate Finder's rate comparison technology finds the lowest
  mortgage rate across 30+ lenders in minutes — no other broker offers this breadth
  of comparison with this speed.
Visual translation: The pencil-drawn dream home represents the aspiration, and the
  real woman holding sketched keys represents the achievability. The architectural
  precision of the pencil line-art echoes The Rate Finder's systematic, data-driven
  approach to rate comparison. The warm, accessible scene (casual clothing, gentle
  smile) matches the brand's approachable positioning.
Logo swap check: The specific sketch of a Canadian-style two-story home with front
  porch targets The Rate Finder's Canadian market. The "keys in hand" moment is
  specific to mortgage completion. A generic financial brand would not pair this
  demographic with this exact aspiration scenario.

TYPOGRAPHY:
HEADLINE: "Your dream home is closer than you think."
- Position: Bottom 25% of the composition, centered horizontally, sitting on the
  white background canvas below the person and above the safe zone
- Font: Clean sans-serif (Montserrat style)
- Color: #1B4D6E (deep teal — brand primary)
- Weight: SemiBold
- Treatment: Sentence case, two lines with break after "closer"

CTA: "Compare rates in minutes"
- Position: Below headline, centered, at approximately 70% down the frame
- Font: Sans-serif matching headline
- Color: #D4883A (warm copper accent)

MOBILE CONSTRAINTS:
- Safe zone: No text or critical elements in bottom 35%
- Safe zone: No text in top 14%
- Thumb zone: CTA centered, not in bottom corners
- Thumbnail test: Woman's face and sketched house silhouette visible at 300px width
- Text minimum: All text 12pt+ equivalent at display size
- Single-column: Sketch house above, person center, text below — vertical stack
- Hero element: Person occupies 35% of frame

MOOD:
Warm possibility — a real woman on the doorstep of her illustrated future.
Hopeful without being naive, aspirational without being out of reach.

DO NOT:
- Fully photorealistic house or environment (pencil sketch only)
- Fully illustrated person (she must be photorealistic)
- Gradual blending between photo and sketch (clean boundary)
- Multiple sketch styles (pencil line-art only — no ink, no marker)
- Person casting shadows onto sketch elements
- Product shots or physical products (person is the hero)
- Generic stock-photo pose (she interacts with the sketch world)
- Clip-art or vector illustrations (hand-drawn pencil quality)
- Busy sketch environment competing with the person
- Person smaller than 30% of frame
```

### Example 2: Education Consultancy (9:16)

**Brand:** EduPath Global
**Colors:** Primary #2D5F8A (academic blue), Secondary #FFFFFF (white), Accent #E8A832 (gold)
**Hook Type:** Transformation
**Hook:** "From confused applications to confirmed acceptances."
**Psychology:** Transformation — the before/after journey from application overwhelm to acceptance clarity. Targets students and parents navigating university admissions.
**Category:** Education
**Audience Profile:** Indian market, 18-22 age range, male student, smart casual

```
Create a 9:16 social media ad image.

SUBJECT: A 20-year-old Indian male university student, wearing a light blue
button-down shirt (sleeves rolled to forearms) and dark chinos, positioned in
the lower-left of the frame with his body angled toward the upper-right. His
expression is hopeful and determined — a slight forward lean, eyes looking
upward toward the sketched graduation scene above him. One hand holds a real
laptop (closed, tucked under arm), the other hand reaches upward toward the
sketched diploma. Photorealistic rendering with natural brown skin, short black
hair, authentic fabric texture. Natural even lighting — soft key light creating
gentle dimension on his face.

MIXED-MEDIA ENVIRONMENT: Above and to the right of the person, ink & pen
hand-drawn illustrations of a graduation scene — a sketched graduation cap
with tassel, a rolled diploma with ribbon, a university building facade with
columns and arched windows, and scattered sketched book spines forming a loose
ascending path from the person toward the graduation cap. The ink lines are
confident black strokes, slightly thicker than pencil, with an illustrative
editorial quality. Cross-hatching provides depth on the university building
facade. The graduation cap floats at the top of the composition as the
aspirational peak.
The composition follows Person Below, Sketch Above — the student occupies the
bottom third while the entire illustrated academic aspiration rises above him
like a vision of his future. The contrast between photorealistic student and
ink-drawn academic world shows the transformation in progress.

INTERACTION POINT: His reaching right hand extends upward, fingers just touching
the bottom edge of the sketched diploma scroll — reality reaching into the
illustrated achievement. The scattered sketched books form a loose visual path
from his real laptop (current state) up to the diploma (future state).

BACKGROUND: Brand-color gradient — subtle academic blue #2D5F8A at 12% opacity
fading from the top of the frame (behind the graduation scene) to white at the
bottom (behind the student). The gradient adds academic warmth without competing
with the ink illustrations.

CAMERA: 35mm, slightly low angle (empowering — looking slightly up at the
student, making him feel capable of reaching the graduation scene above).
Person in sharp focus, ink sketch elements fully legible but with a subtle
difference in rendering crispness that reinforces the two-world metaphor.

BRAND ANCHOR:
Owned positioning: EduPath Global's end-to-end admissions consulting — from
  university shortlisting to visa processing — with a 94% acceptance rate
  across top-50 global universities.
Visual translation: The ascending composition (student below, graduation above)
  mirrors EduPath's promise of guided upward movement. The ink & pen editorial
  style suggests authority and published credibility. The scattered books forming
  a path from laptop to diploma visualize the structured guidance process. The
  94% acceptance rate is the invisible bridge between reality and sketch.
Logo swap check: The specific Indian male student targeting the Indian education
  consulting market, the global university facade (not a specific local college),
  and the laptop-to-diploma journey are specific to EduPath's positioning as a
  global admissions consultancy for Indian students.

TYPOGRAPHY:
HEADLINE: "From confused applications to confirmed acceptances."
- Position: Middle band of the frame, between the person and the graduation
  scene, sitting on the gradient background. Centered horizontally, two lines
  with break after "applications"
- Font: Clean sans-serif (Inter style)
- Color: #2D5F8A (academic blue — brand primary)
- Weight: Bold
- Treatment: Sentence case, clean

CTA: "Start your journey today"
- Position: Below headline, at approximately 55% down the frame, above safe zone
- Font: Sans-serif matching headline
- Color: #E8A832 (gold accent — achievement color)

MOBILE CONSTRAINTS:
- Safe zone: No text or critical elements in bottom 35%
- Safe zone: No text in top 14% (graduation cap can appear at 15%+)
- Thumb zone: CTA centered, not in corners
- Thumbnail test: Student face and graduation cap silhouette visible at 300px width
- Text minimum: All text 12pt+ equivalent at display size
- Single-column: Sketch above, text middle, person below — strict vertical stack for 9:16
- Hero element: Person occupies 32% of frame

MOOD:
Ascending transformation — a real student reaching toward his illustrated future.
The composition breathes upward momentum and earned achievement. Determined, not
desperate. Hopeful, not uncertain.

DO NOT:
- Fully photorealistic campus or environment (ink sketch only)
- Fully illustrated person (student must be photorealistic)
- Gradual blending between photo and sketch (clean boundary)
- Multiple sketch styles (ink & pen only — no pencil, no marker)
- Person casting shadows onto sketch elements
- Product shots or physical products
- Generic stock-photo "pointing up" pose (specific reaching interaction)
- Clip-art or vector illustrations (hand-drawn ink quality)
- Overly detailed sketch competing with the person
- Person smaller than 30% of frame
```

---

## Mobile Constraint Integration

Dream Sketch Hybrid layouts use the mixed-media contrast to create visual interest at every screen size. Key rules per aspect ratio:

### 4:5 (1080x1350) — Feed Optimized
- Person centered or offset to rule-of-thirds, sketch elements framing from above and sides
- Headline in the lower 25-35% zone, sitting on background canvas
- Sketch elements can fill the upper 50-60% of the frame with the person anchoring the lower-center
- Interaction points should be visible at thumbnail — the "touch" between real and sketch is the hook
- Background treatment clearly visible at thumbnail scale

### 1:1 (1080x1080) — Feed Standard / Carousel
- Person + Large Sketch Side-by-Side works especially well in square format
- Person on left (40%), large sketch element on right (60%) — or vice versa
- Headline can sit above or below the split, connecting both halves
- The square format allows for generous sketch detail beside the person
- Alternatively, Person Centered with sketch framing works for symmetrical compositions

### 9:16 (1080x1920) — Reels / Stories
- Person Below, Sketch Above is the natural choice for vertical format
- Person occupies bottom third (below 65% mark, above safe zone)
- Sketch aspiration rises above the person into the upper portion
- Headline in the middle band between person and sketch peak
- CTA above 65% safe zone boundary
- Strict single-column stacking — no side-by-side elements
- The vertical format amplifies the "reaching upward toward aspiration" metaphor

---

## Anti-Patterns

| Never | Instead |
|-------|---------|
| Fully photorealistic environments (houses, offices, scenes) | Sketch/illustration environments only — the world is hand-drawn |
| Fully illustrated people (cartoon, anime, stylized) | Photorealistic person with real skin, hair, clothing |
| Gradual blending or feathering between photo and sketch | Clean, intentional boundary between real person and illustrated world |
| Multiple sketch sub-styles in one composition | One consistent sketch style throughout (pencil OR ink OR marker, etc.) |
| Person casting realistic shadows onto sketch elements | No shadow interaction — they exist in different visual realities |
| Product as the hero (physical package, device, etc.) | Person as the hero — service brands sell outcomes, not objects |
| Generic stock-photo pose unrelated to the service | Person pose interacts with sketch world and relates to service context |
| Clip-art, vector, or digital illustration style | Hand-drawn sketch quality with visible construction lines and organic strokes |
| Overly busy sketch that competes with the person | Sketch environment supports but doesn't overwhelm — person is always the focal point |
| Person smaller than 30% of frame | Person must be large enough for emotional connection and demographic visibility |
| Sketch elements with independent light sources or shadows | Sketch elements are flat/drawn — they don't have their own lighting |
| Brand product placed in the person's hands | Service-relevant objects (keys, books, documents) — not branded products |

---

## Quality Checklist

### Person
- [ ] Person is photorealistic with natural skin, hair, and clothing texture
- [ ] Person matches ICP demographics (age, ethnicity, clothing style)
- [ ] Expression matches hook psychology (pain=frustrated, aspiration=hopeful, etc.)
- [ ] Person occupies 30-45% of frame
- [ ] Pose interacts with the sketch world (at least one interaction point)

### Sketch Environment
- [ ] All non-person elements are in the assigned sketch sub-style
- [ ] Sketch content relates to the service outcome (not the service process)
- [ ] Sketch line weight and style are consistent throughout
- [ ] Sketch elements create the "aspirational world" metaphor
- [ ] Hand-drawn quality is visible (not clip-art, not vector)

### Mixed-Media Boundary
- [ ] Clean boundary between photorealistic person and sketch elements
- [ ] No gradual blending or feathering at the boundary
- [ ] Person casts no shadow onto sketch elements
- [ ] At least one interaction point where person touches sketch world
- [ ] Mixed-media contrast is visible at 300px thumbnail width

### Diversity
- [ ] Assigned sketch sub-style is unique (or near-unique) among the 6 hooks
- [ ] Composition type differs from adjacent hooks
- [ ] Background treatment varies across the set
- [ ] Person demographics vary within ICP range

### Typography
- [ ] Clean sans-serif font (not decorative, not serif)
- [ ] Text sits on background canvas, not obscuring person
- [ ] Brand colors used in text
- [ ] Headline and CTA clearly separated from sketch elements

### Mobile
Follow shared mobile checklist in SKILL.md § Mobile Safe Zone Rules.
- [ ] Person occupies at least 30% of frame

---

## Output Format

Write to: `agent/files/creatives/{brand}_prompts.json`

Follow the shared JSON structure in SKILL.md § Output Format. Style-specific `stage` fields for this workflow:

```json
"stage": {
  "sketchSubStyle": "pencil-line-art|ink-pen|marker-wash|blueprint|charcoal",
  "compositionType": "person-centered|person-inside-sketch|side-by-side|person-below-sketch-above",
  "backgroundTreatment": "clean-white|brand-gradient|textured-paper",
  "audienceProfile": {
    "age": "age descriptor",
    "ethnicity": "market-derived descriptor",
    "gender": "male|female|non-binary",
    "clothing": "style descriptor"
  },
  "interactionPoint": "description of where person touches sketch world"
}
```