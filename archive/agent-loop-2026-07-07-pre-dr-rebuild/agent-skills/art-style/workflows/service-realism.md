# Service Realism

Full photorealistic lifestyle scene with people in real-world environments, plus graphic overlay elements (floating objects, brand shapes, gradient washes, badges). The "aspirational life, fully realized." A service-brand workflow where the visual hero is people in cinematic real-world scenes, not physical products. Perfect for real estate, travel, lifestyle services, automotive, healthcare, coaching.

**Family:** Service Brand
**Prerequisites:** Hook-bank file must exist. Main Agent triggers hook-methodology skill first.

---

## Style Overview

**What it is:** A fully photorealistic lifestyle scene featuring people (matching the brand's target market demographics) in real-world environments — offices, homes, outdoors, aspirational destinations. The scene is cinematic and atmospheric, shot with intentional camera work (focal length, DOF, lighting mood). Layered on top: graphic overlay elements — floating relevant objects, geometric brand shapes, gradient color washes, or badge/stamp elements — that add branding and visual interest without breaking the photorealistic base. The result is an ad that looks like a professional lifestyle photoshoot with strategic graphic design layered in.

**Why it works:**
- Full photorealism creates maximum believability — viewers see a real person in a real place
- Cinematic camera work (DOF, focal length, lighting) elevates the scene above typical stock photography
- Graphic overlays add brand identity and design polish without sacrificing the realistic base
- People in environments tell complete stories — the viewer instantly understands the service context
- Audience-adaptive casting ensures the subject matches the brand's target market
- 5 scene categories × 4 camera approaches × 3 lighting moods × 4 overlay styles = 240 unique combinations

**Visual Characteristics:**

| Element | Specification |
|---------|---------------|
| Scene | Full photorealistic environment — office, home, outdoor, aspirational, service-in-action |
| Subject | Photorealistic person(s) matching ICP demographics, naturally placed in the environment |
| Camera | Intentional focal length (24-85mm), DOF, and angle for cinematic quality |
| Lighting | Mood-specific — warm golden hour, cool professional, or dramatic rim-lit |
| Graphic overlays | Floating objects, geometric shapes, gradient washes, or badge elements layered on the scene |
| Typography | Clean, modern, integrated with the graphic overlay layer |

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

4. **Scenario Context** — Map service category to person-in-environment:
   - Real Estate → couple touring home, agent showing property, keys handover
   - Travel → person at destination, couple exploring, relaxed vacation scene
   - Healthcare → patient in consultation, family in healthy activity
   - Automotive → person with vehicle, test drive moment, lifestyle with car
   - Financial Services → advisor meeting, couple planning, confident individual
   - Coaching → workshop moment, one-on-one session, achievement celebration
   - Home Services → completed renovation reveal, homeowner satisfaction

**Output:** An audience profile block used in every prompt:
```
Subject: [ethnicity descriptor from market] [age from ICP] [gender],
         [clothing from brand voice], [action from category scenario],
         [expression from hook psychology]
```

---

## Step 2: Brand Anchor Derivation

Follow the **Brand Anchor Derivation** framework in SKILL.md with this style-specific guidance:

**Principle:** In Service Realism, brand specificity comes through the environment choice (where the scene takes place), the graphic overlay content (what objects/shapes are layered), and the person's specific scenario (what they're doing). The scene should be unmistakably connected to THIS brand's service category and target market.

**Style-specific translation (step 2):**
- The environment must reflect the brand's actual service context — not a generic "happy person" scene but a specific moment in the service journey
- Graphic overlays use the brand's color palette — shapes, gradients, and floating objects carry the brand identity
- The person's activity should relate to the service outcome — the viewer should immediately understand what service category this represents
- Lighting mood should match the brand's emotional positioning: warm for approachable brands, cool for professional brands, dramatic for premium brands

---

## Step 3: Category Adaptation

Service Realism adjusts its scene environment and overlay treatment based on the detected service category:

| Category | Primary Scene | Environment Details | Overlay Style Bias | Lighting Bias | Mood |
|----------|--------------|--------------------|--------------------|---------------|------|
| **Financial Services** | Professional consultation, planning moment | Modern office, advisor desk, clean meeting room | Floating financial objects (calculator, documents, charts) + geometric shapes | Cool Professional | Confident authority, trustworthy |
| **Education** | Learning environment, achievement moment | Campus, library, modern classroom, graduation venue | Floating academic objects (books, diploma, cap) + badge elements | Warm Golden Hour | Growth, achievement, possibility |
| **Healthcare** | Care moment, wellness scene | Clinic, bright waiting room, outdoor healthy activity | Geometric brand shapes + trust badges (ratings, certifications) | Cool Professional or Warm | Trust, care, wellness |
| **Legal** | Consultation, resolution moment | Office meeting, professional setting, courthouse exterior | Geometric shapes + badge/stamp elements (scales, gavels) | Cool Professional | Authority, resolution, protection |
| **Home Services** | Completed work, satisfaction reveal | Renovated room, maintained yard, improved space | Floating tools/objects + badge elements (guarantee, ratings) | Warm Golden Hour | Satisfaction, improvement, pride |
| **Real Estate** | Property viewing, keys moment, new home | House exterior, interior tour, neighborhood | Floating keys/documents + geometric shapes | Warm Golden Hour | Excitement, new beginning, warmth |
| **Coaching** | Session moment, breakthrough, achievement | Studio, outdoor setting, workshop, stage | Gradient wash + geometric shapes | Dramatic Rim-Lit or Warm | Empowerment, transformation, energy |
| **Travel** | Destination experience, exploration | Destination landmark, resort, scenic location | Gradient wash + floating travel objects (luggage, passport, map) | Warm Golden Hour | Freedom, discovery, luxury |
| **Automotive** | Vehicle interaction, lifestyle with car | Road, driveway, scenic route, showroom | Geometric shapes + floating specs/features | Dramatic Rim-Lit | Aspiration, power, freedom |

---

## Step 4: Visual Concept Creation + Diversity Assignment

For each hook, build the Service Realism scene by translating the hook psychology into a visual treatment, then assign a unique combination from the diversity axes.

### Hook Psychology to Service Realism Treatment

| Hook Psychology | Scene Treatment | Person Treatment | Overlay Treatment | Emotional Direction |
|----------------|----------------|-----------------|-------------------|---------------------|
| **Pain/Problem** | Environment shows the PROBLEM context — cluttered desk, stressful waiting room, messy space, difficult situation. Lighting is slightly cooler or harder. | Person shows frustration, stress, or overwhelm. Posture is closed, tense, or leaning away. This is the "before" moment. | Minimal overlays — maybe a single geometric shape framing the problem. The scene speaks for itself. | The realism makes the pain visceral. The viewer recognizes this moment from their own life. |
| **Aspiration/Identity** | Environment is the DREAM setting — beautiful home, perfect office, ideal location. Lighting is warm and inviting. Everything is aspirational. | Person is relaxed, confident, belonging. They inhabit the space naturally. This is "the life you want." | Gradient wash in brand colors + geometric shapes framing the subject — adding polish to the aspiration. | Full lifestyle realism. The viewer wants to step into this scene. |
| **Social Proof** | Environment suggests community or shared experience — cafe, community space, consultation room with visible credentials. Warm, trustworthy setting. | Person is satisfied, reassured, sharing their experience. Natural, candid feel — not posed. | Badge/stamp elements prominent — star ratings, review counts, certification badges floating in frame. | Testimonial energy. The real person in a real place with visible proof of quality. |
| **Education/Value** | Environment is informative — workshop setting, consultation desk, demonstration space. Well-lit, clear. | Person is engaged, learning, taking in information. Focused expression, forward lean. | Floating relevant objects highlighting features/benefits — labeled items, infographic-style callouts. | Educational clarity. The viewer learns something from looking at this scene. |
| **Urgency/Scarcity** | Environment suggests time-sensitivity — golden hour lighting (time passing), seasonal setting, high-demand context. | Person is active, decisive, moving forward. Sense of purpose and momentum. | Geometric shapes with brand colors creating visual urgency — angular, dynamic elements. Minimal badges. | The scene feels like NOW. Golden hour literally shows time passing. |
| **Transformation** | Environment transitions or shows the "after" — before elements visible but secondary, the new/improved state dominates. | Person is mid-journey or post-transformation. Expression is hopeful to confident. Body language shifts from closed to open. | Split gradient wash (muted to vivid) or geometric shapes that transition from gray to brand color. | The scene captures the moment of change. Reality shifting before the viewer's eyes. |
| **Curiosity/Question** | Environment contains an intriguing element — something unexpected in the scene, a door half-open, a path leading somewhere unseen. | Person is intrigued, looking toward the mystery element. Slight smile, head tilt, engaged curiosity. | Minimal overlays — perhaps a single geometric shape or gradient that draws the eye to the intriguing element. | The realistic scene with one mysterious element. The viewer wants to know what happens next. |

### Diversity Assignment Matrix

Each of the 6 hooks gets a UNIQUE combination from these four axes:

**5 Scene Categories** (assign per hook, no repeats until all 5 used):
1. **Professional Environment** — office, clinic, studio, classroom, consultation room
2. **Home/Domestic** — living room, kitchen, front yard, new home
3. **Outdoor/Lifestyle** — park, campus, cafe, nature, street
4. **Aspirational/Destination** — dream home, graduation venue, vacation spot, corner office
5. **Service-in-Action** — technician at work, advisor in meeting, teacher with students

**4 Camera Approaches** (cycle through):
1. **Wide Establishing** — full scene, environmental storytelling, 24-35mm
2. **Medium Portrait** — waist-up, person + context, 50mm, shallow DOF
3. **Close-Up Detail** — hands doing work, face expression, meaningful object, 85mm
4. **Low Angle Empowering** — slightly below eye level, subject feels powerful, 35mm

**3 Lighting Moods** (distribute across hooks):
1. **Warm Golden Hour** — late afternoon, warm tones, long shadows, inviting
2. **Cool Professional** — even, clean, slightly blue-toned, clinical/corporate
3. **Dramatic Rim-Lit** — strong backlight, rim light on subject, moody depth

**4 Graphic Overlay Styles** (cycle through):
1. **Floating Relevant Objects** — currency, documents, keys, diplomas floating in frame with subtle motion blur
2. **Geometric Brand Shapes** — color blocks, circles, lines framing the scene in brand palette
3. **Gradient Wash** — brand-color gradient overlay on part of the image (top, side, or corner)
4. **Badge/Stamp Elements** — trust badges, rating stars, guarantee stamps, certification marks

**Assignment Process:**
1. List 6 hooks by number (1-6)
2. Assign scene categories: Hook 1→Scene 1, Hook 2→Scene 2, Hook 3→Scene 3, Hook 4→Scene 4, Hook 5→Scene 5, Hook 6→Scene that best matches the hook psychology
3. Assign camera approaches: Hook 1→Camera 1, Hook 2→Camera 2, Hook 3→Camera 3, Hook 4→Camera 4, Hook 5→Camera 1, Hook 6→Camera 2
4. Assign lighting: Hooks 1-2→Warm, Hooks 3-4→Cool, Hooks 5-6→Dramatic
5. Assign overlays: Hook 1→Overlay 1, Hook 2→Overlay 2, Hook 3→Overlay 3, Hook 4→Overlay 4, Hook 5→Overlay 1, Hook 6→Overlay 2
6. Vary person demographics within ICP range: mix gender, vary age within the ICP band

**Diversity Matrix Check — verify before proceeding:**
- [ ] No two hooks share the SAME scene category + camera approach combination
- [ ] At least 3 different scene categories used across the 6 hooks
- [ ] At least 2 different lighting moods used
- [ ] At least 2 different graphic overlay styles used
- [ ] At least 2 different aspect ratios in the set (per SKILL.md: 2× 4:5, 2× 1:1, 2× 9:16)
- [ ] Person demographics vary where ICP allows (mix of gender, age within range)

---

## Step 5: Design Principles

### 1. Cinematic Photorealism
- Every element in the scene (person, environment, objects, surfaces) is fully photorealistic — no illustration, no clay, no stylized rendering
- Camera work is intentional: specific focal length creates the right amount of context vs. intimacy
- Depth of field separates subject from environment — shallow DOF for portrait shots, deeper for establishing shots
- Surfaces, materials, and textures are detailed and realistic — wood grain, fabric weave, skin pores, metal reflections
- The scene should look like it was photographed by a professional lifestyle photographer with intentional art direction

### 2. Lighting as Emotional Driver
- Lighting mood is selected to match the hook psychology and assigned from the diversity axis
- Warm Golden Hour: window light or late-afternoon sun, warm color temperature (3000-4000K), long soft shadows
- Cool Professional: even, diffused, slightly blue-toned (5500-6500K), minimal shadows, clinical clarity
- Dramatic Rim-Lit: strong backlight creating edge definition on the subject, deep shadows, mood and depth
- Lighting must feel natural to the environment — not obviously "studio lit" in an outdoor scene
- The lighting mood contributes to the emotional tone before the viewer reads a single word

### 3. Person as Story Protagonist
- The person is the story protagonist, not a prop or model — they are DOING something, not posing
- Action, expression, and body language all relate to the hook's psychology and the service context
- Person matches ICP demographics: age, ethnicity from market, clothing from brand voice
- Eye contact or gaze direction guides the viewer — looking at camera = direct connection, looking at object = directing attention
- Person occupies 25-40% of the frame depending on camera approach (more in medium/close, less in wide)

### 4. Graphic Overlays as Design Layer
- Overlays exist on a separate visual plane — they are clearly "designed" elements on top of the photographic base
- Floating objects have subtle motion blur and transparency (80-90% opacity) to feel integrated but clearly layered
- Geometric shapes use brand colors at 20-40% opacity, framing or highlighting parts of the scene
- Gradient washes are subtle (15-30% opacity) and applied to non-critical areas (corners, edges, top/bottom)
- Badge elements are crisp and clean — designed graphics, not photographic
- Overlays should enhance, not obscure — the photorealistic scene is always clearly visible through/around them
- Maximum 2-3 overlay elements per composition to avoid clutter

### 5. Environment as Context
- The environment tells the viewer what category of service this is before they read the headline
- Environment details should be specific and real — a particular type of office, a recognizable style of home, a believable outdoor scene
- Cultural context matters — environments should match the brand's geography (Canadian homes look different from Indian homes)
- The environment should suggest the service outcome, not the service process (show the dream home, not the mortgage office)
- Background environment details at 60-70% in the scene — enough for context, not so much it overwhelms the subject

### 6. Integrated Typography
- Text works with the graphic overlay layer — same visual plane as the designed elements
- Headlines can sit on gradient washes or inside geometric shapes for integration
- Clean, modern sans-serif typography that feels like professional ad design
- Text color should contrast with both the photographic scene and the overlay elements behind it
- CTA can be styled as a designed button/pill element, connecting to the graphic overlay aesthetic

---

## Prompt Template

```
Create a [4:5/1:1/9:16] social media ad image.

SCENE: A [scene category] setting — [detailed environment description matching the
brand's geography and cultural context]. [Specific architectural details, furniture,
surfaces, plants, objects that make the environment believable and specific].
[Time of day from lighting mood assignment]. The environment suggests [service
outcome] — the viewer immediately understands the context.

SUBJECT: A [age from ICP] [ethnicity from market] [gender], [doing specific action
relevant to the hook concept and service category]. Wearing [clothing appropriate to
category, market, and brand voice]. [Facial expression from hook psychology — specific
and emotionally readable]. [Pose details — body language that matches the hook's
emotional direction]. [Eye contact or gaze direction and its purpose].
The person is the story protagonist — they are actively engaged in a moment, not posing.

CAMERA: [Camera approach — focal length, angle, framing]. [DOF specification —
shallow for portraits, deeper for establishing]. [Framing details — what's included
in the edges, what's cropped]. The camera work feels intentional and professional,
like a lifestyle photoshoot with art direction.

LIGHTING: [Lighting mood — direction, color temperature, shadow quality, source].
[How the lighting interacts with the subject — where highlights fall, where shadows
form]. [How the lighting creates the emotional atmosphere].
The lighting feels natural to the environment — not studio-lit.

GRAPHIC OVERLAYS: [Overlay style — floating objects / geometric shapes / gradient
wash / badge elements] integrated into the composition at [opacity level].
[Specific overlay elements described — what objects, what shapes, what colors].
[Position and size of each overlay element].
Brand colors: [#HEX values] applied to overlay elements.
Overlays exist on a designed layer above the photographic base — clearly graphic
elements, not photographic objects.

BRAND ANCHOR:
Owned positioning: [What ONLY this brand can claim — from hook-bank]
Visual translation: [How the scene + person + overlays showcase the differentiator]
Logo swap check: [Could a competitor use this exact scene? What makes it specific?]

TYPOGRAPHY:
HEADLINE: "[Exact hook text]"
- Position: [Integrated with graphic overlay layer — on gradient wash, inside
  geometric shape, or floating on the design layer]
- Font: Clean modern sans-serif (Montserrat, Inter, or similar)
- Color: [brand primary or white for contrast]
- Weight: SemiBold to Bold
- Treatment: [Sentence case or ALL CAPS depending on hook energy]

CTA: "[Exact CTA text]"
- Position: [Below headline or as a designed button/pill element]
- Font: Sans-serif matching headline
- Color: [brand accent]
- Treatment: [Optional button/pill background in brand color]

MOBILE CONSTRAINTS:
[Apply all safe zone rules from SKILL.md § Mobile Safe Zone Rules]
- Hero element: Person + environment must occupy at least 60% of frame

MOOD:
[One line — the emotional atmosphere created by scene + lighting + person + overlays]

DO NOT:
- Illustrated, clay, or stylized rendering of any scene element (fully photorealistic only)
- Graphic overlays that obscure the person's face or primary action
- Stock-photo generic poses (person must be doing something specific and contextual)
- Product-centric compositions (person and scene are the heroes)
- Overlays at more than 90% opacity (they must feel layered, not opaque)
- More than 3 overlay elements (clean design, not clutter)
- Studio backdrop or solid color background (real environment required)
- Person smaller than 25% of frame in any camera approach
- Lighting that contradicts the environment (warm sunset in a fluorescent office)
- Environments that don't match the brand's geography or cultural context
```

---

## Example Prompts

### Example 1: Real Estate Agency (4:5)

**Brand:** Haven Property Group
**Colors:** Primary #2C5F4E (forest green), Secondary #F5F0E8 (warm cream), Accent #C8956C (warm bronze)
**Hook Type:** Aspiration/Identity
**Hook:** "You deserve a home that feels like you."
**Psychology:** Identity aspiration — reframes home buying from transaction to self-expression. Targets buyers who want a home that reflects their personality, not just a roof.
**Category:** Real Estate
**Audience Profile:** Australian market, 30-38 age range, female professional, smart casual

```
Create a 4:5 social media ad image.

SCENE: A home/domestic setting — a sun-filled open-plan living room in a modern
Australian home with light timber floors, a large window wall looking out to a
green garden, a comfortable linen sofa in natural tones, a curated bookshelf with
plants and ceramics, and a textured rug anchoring the seating area. The room has
warm natural materials — wood, linen, stone — and feels lived-in but beautifully
curated. Late afternoon light streams through the window wall, casting long warm
shadows across the timber floor. The environment suggests settled, personalized
home ownership — the viewer sees a home that reflects someone's taste, not a
display home.

SUBJECT: A 33-year-old Australian woman with light brown wavy hair, wearing a
relaxed cream linen shirt and dark olive trousers, sitting comfortably on the
linen sofa with one leg tucked beneath her. She holds a mug of coffee in one
hand and a book (spine out, not reading — just paused) in the other. Her
expression is content and at-home — a soft smile, relaxed shoulders, eyes looking
toward the garden through the window. Her body language says "I belong here."
She is the story protagonist — inhabiting the space naturally, not posing for
a catalog.

CAMERA: Medium Portrait — 50mm, eye level, waist-up framing that includes the
woman, the sofa, the bookshelf behind her, and the window light. Shallow depth
of field — the woman and sofa are in sharp focus, the bookshelf and garden beyond
are softly blurred, creating a sense of depth and intimacy. The framing includes
enough of the room to establish context but centers on the woman's comfortable
presence.

LIGHTING: Warm Golden Hour — late afternoon sunlight entering through the window
wall from the right side of frame, color temperature approximately 3500K. The
warm light illuminates the woman's face and the sofa fabric, creating a gentle
glow on the timber floor. Soft shadows fall to the left, adding dimension without
drama. The overall atmosphere is warm, inviting, and golden — the room feels
like it's bathed in contentment.

GRAPHIC OVERLAYS: Geometric Brand Shapes — two overlapping rounded rectangles
in forest green #2C5F4E at 25% opacity, positioned in the upper-left corner of
the frame, partially framing the bookshelf area. A single warm bronze #C8956C
circle at 20% opacity in the lower-right, partially overlapping the edge of the
frame. The geometric shapes add a professional, designed quality to the
photographic scene without obscuring any elements. Brand colors connect the
overlays to Haven's identity.

BRAND ANCHOR:
Owned positioning: Haven Property Group's curated matching service — they don't
  just find houses, they match lifestyle preferences to properties using a
  detailed buyer-personality profile that goes beyond bedrooms-and-bathrooms.
Visual translation: The curated, personalized living room (specific ceramics,
  chosen books, textured rug) visualizes the "feels like you" promise — this isn't
  a display home, it's someone's curated space. The relaxed woman with coffee and
  book embodies the outcome: someone who found a home that matches her lifestyle.
  The forest green geometric overlays echo Haven's brand identity.
Logo swap check: The specifically Australian home style (timber floors, linen
  materials, garden view), the curated-not-decorated interior, and the woman's
  content "I belong" body language are specific to Haven's lifestyle-matching
  positioning. A generic real estate agent would show a front-door-with-keys shot.

TYPOGRAPHY:
HEADLINE: "You deserve a home that feels like you."
- Position: Upper portion of the frame, sitting on the subtle forest green
  geometric shape in the upper-left, two lines with break after "home"
- Font: Clean modern sans-serif (Montserrat style)
- Color: #2C5F4E (forest green — brand primary) against the lighter background
- Weight: SemiBold
- Treatment: Sentence case, warm and personal

CTA: "Find your match"
- Position: Below headline, still in the upper-left zone, at approximately 30%
  down the frame
- Font: Sans-serif matching headline
- Color: #C8956C (warm bronze accent)
- Treatment: Sentence case, designed pill button with #2C5F4E at 10% opacity background

MOBILE CONSTRAINTS:
- Safe zone: No text or critical elements in bottom 35%
- Safe zone: No text in top 14%
- Thumb zone: CTA not in bottom corners
- Thumbnail test: Woman on sofa and warm room visible at 300px width
- Text minimum: All text 12pt+ equivalent at display size
- Single-column: Text upper-left, woman center, room fills frame
- Hero element: Person + environment occupy 72% of frame

MOOD:
Settled warmth — a woman at home in every sense. The golden light, natural
materials, and relaxed posture create a scene the viewer wants to inhabit.
This is what "finding your place" looks and feels like.

DO NOT:
- Illustrated or stylized rendering (fully photorealistic scene only)
- Overlays obscuring the woman's face or the room's key details
- Generic "standing in front of house" pose (she inhabits the space)
- Product-centric composition (person and home are the heroes)
- Overlays above 30% opacity (subtle design layer only)
- More than 3 overlay elements
- Studio or solid background (real home interior required)
- Person smaller than 25% of frame
- Cool or clinical lighting (warm golden hour only)
- Generic display-home interior (curated, personal details required)
```

### Example 2: Life Coaching Service (9:16)

**Brand:** Elevate Coaching Co.
**Colors:** Primary #1A1A2E (deep navy), Secondary #F7F5F0 (warm white), Accent #E8B44C (bold gold)
**Hook Type:** Transformation
**Hook:** "You're one decision away from a completely different life."
**Psychology:** Transformation through decisive action — reframes life change from gradual process to single pivot point. Targets professionals feeling stuck who need permission to take the leap.
**Category:** Coaching
**Audience Profile:** American market, 32-42 age range, male professional, business casual

```
Create a 9:16 social media ad image.

SCENE: An outdoor/lifestyle setting — a modern rooftop terrace in an urban
American city at the golden hour moment just before sunset. The terrace has
clean concrete surfaces, minimalist outdoor furniture (a bench, a low table),
potted olive trees in large ceramic planters, and a cityscape visible beyond
the glass railing. The skyline shows a mid-sized city (not necessarily
recognizable — generic modern American skyline with mixed-height buildings).
The golden hour light turns the concrete warm and the glass railing catches
amber reflections. The environment suggests elevation — literally and
metaphorically — above the daily grind, at a vantage point of perspective.

SUBJECT: A 36-year-old American man with short dark brown hair and a
well-trimmed beard, wearing a navy blazer over a white crew-neck t-shirt and
dark jeans — business casual that signals ambition without rigidity. He stands
at the glass railing of the rooftop, facing slightly away from camera (3/4
back view) with his hands resting on the railing, looking out at the cityscape
below. His posture is upright, shoulders back, head slightly raised — the body
language of someone who has just made a decision. He is not looking at camera —
his gaze is forward, toward the future/city/possibility. The pose is
contemplative but resolved — not pensive, but decided.

CAMERA: Low Angle Empowering — 35mm, slightly below eye level (camera at his
chest height), shooting slightly upward so the subject feels tall and powerful
against the sky. The low angle includes the terrace floor in the lower frame
and the golden sky in the upper frame, with the man at the intersection. DOF
is moderate — the man and railing are sharp, the cityscape beyond is softly
rendered, the sky is smooth. The framing uses the vertical 9:16 format to
emphasize the height and elevation.

LIGHTING: Dramatic Rim-Lit — the golden hour sun is behind and to the right of
the subject, creating a strong warm rim light along his right shoulder, arm, and
the edge of his face. The front of his body is in softer shadow, lit by ambient
golden bounce from the concrete terrace. The rim light defines his silhouette
powerfully against the softly glowing sky. Long shadows stretch toward the camera
from the planters and furniture. The lighting feels cinematic — a hero moment
captured at the perfect time of day.

GRAPHIC OVERLAYS: Gradient Wash — a bold gold #E8B44C gradient at 20% opacity
applied to the upper portion of the frame (sky area), intensifying from
transparent at the midpoint to 20% gold at the top edge. This warms the sky
and creates a branded atmosphere. Additionally, a single geometric circle
outline in deep navy #1A1A2E at 30% opacity, positioned behind the subject's
upper body like a subtle halo or target — suggesting focus, center, and the
"one decision" of the headline. The overlays are minimal — the dramatic
lighting and scene do the heavy lifting.

BRAND ANCHOR:
Owned positioning: Elevate Coaching's "Decision Architecture" framework — their
  proprietary coaching methodology that helps clients identify and execute the
  single highest-leverage decision in their life or career, rather than
  overwhelming them with incremental self-improvement tasks.
Visual translation: The rooftop elevation literally visualizes "Elevate." The man
  looking out at the city visualizes the "one decision" moment — he's at the
  vantage point, surveying possibility, ready to act. The low angle and rim
  lighting make him feel powerful and decisive. The gold gradient connects to
  Elevate's premium gold branding. The circle behind him frames the decision moment.
Logo swap check: The rooftop-vantage-point composition, the decisive-not-pensive
  body language, and the "one decision" framing are specific to Elevate's Decision
  Architecture methodology. A generic life coach would show a "smiling person with
  arms spread" stock photo.

TYPOGRAPHY:
HEADLINE: "You're one decision away from a completely different life."
- Position: Upper portion of the frame, at 18-28% from top, sitting on the gold
  gradient wash area against the sky. Three lines: "You're one decision away" /
  "from a completely" / "different life." Centered horizontally.
- Font: Clean modern sans-serif (Inter style)
- Color: #FFFFFF (white against the warm sky and gold gradient)
- Weight: Bold
- Treatment: Sentence case, confident and direct

CTA: "Book your decision session"
- Position: Below the man, at approximately 58% down the frame, sitting on the
  terrace area, above the safe zone
- Font: Sans-serif matching headline
- Color: #E8B44C (bold gold accent)
- Treatment: Sentence case, with a subtle pill background in #1A1A2E at 15% opacity

MOBILE CONSTRAINTS:
- Safe zone: No text or critical elements in bottom 35%
- Safe zone: No text in top 14% (headline starts at 18%)
- Thumb zone: CTA centered, not in corners
- Thumbnail test: Man's silhouette against golden sky visible at 300px width
- Text minimum: All text 12pt+ equivalent at display size
- Single-column: Headline top on sky, man center, CTA below — strict vertical stack for 9:16
- Hero element: Person + rooftop environment occupy 68% of frame

MOOD:
Decisive elevation — a man at the top, having arrived at clarity. The golden
rim light and rooftop setting create a cinematic "hero moment" that makes
transformation feel like a single, powerful choice. Aspirational but grounded
in a real, achievable scene.

DO NOT:
- Illustrated or stylized rendering (fully photorealistic scene only)
- Overlays obscuring the man's silhouette or the rim-lit edge
- Generic "arms spread on mountaintop" inspirational pose
- Product-centric composition (person and scene are the heroes)
- Overlays above 30% opacity (subtle design layer)
- More than 3 overlay elements (gradient wash + circle only)
- Studio or solid background (real rooftop environment required)
- Person smaller than 25% of frame
- Cool or flat lighting (dramatic rim-lit golden hour required)
- Frontal face shot — the 3/4 back view is intentional (looking forward, not at viewer)
```

---

## Mobile Constraint Integration

Service Realism layouts use cinematic framing and environmental storytelling at every screen size. Key rules per aspect ratio:

### 4:5 (1080x1350) — Feed Optimized
- Medium portrait or wide establishing shots work best in this format
- Person at center or rule-of-thirds, environment providing context around them
- Headline in the upper 20-30% zone, integrated with graphic overlay elements
- CTA at approximately 65-70% down (above bottom-35% safe zone)
- Graphic overlays in corners or edges, framing the scene without obscuring it
- The 4:5 crop should feel like a still from a lifestyle photoshoot

### 1:1 (1080x1080) — Feed Standard / Carousel
- Medium portrait or close-up detail shots excel in square format
- Person can be centered with environment on all sides, or offset with text in the opposing space
- Headline can sit on a geometric overlay shape in one corner
- CTA at approximately 75-80% down
- Square format works for side-by-side arrangements: person on one side, text + overlay on the other
- The square format feels like an editorial lifestyle photo with graphic treatment

### 9:16 (1080x1920) — Reels / Stories
- Wide establishing shots with vertical environments (buildings, trees, doorways) work best
- Low angle empowering shots maximize the vertical format
- Person in the middle third, environment filling above and below
- Headline at 16-28% from top (below status bar safe zone)
- CTA at approximately 55-60% down (above 65% safe zone)
- Graphic overlays can stretch vertically — gradient washes work especially well in tall format
- Strict single-column stacking — headline, person, CTA vertically aligned

---

## Anti-Patterns

| Never | Instead |
|-------|---------|
| Illustrated, clay, or stylized scene elements | Fully photorealistic environment, person, and objects |
| Graphic overlays obscuring the person's face | Overlays in non-critical areas (corners, edges, sky, floor) |
| Generic stock-photo poses (arms crossed, thumbs up) | Contextual action specific to the service and hook psychology |
| Product as the visual hero | Person + environment as the heroes — service brands sell outcomes |
| Overlays above 90% opacity | Subtle overlay layer (20-40% opacity for shapes, 80-90% for floating objects) |
| More than 3 overlay elements | 2-3 well-placed overlays for clean, professional design |
| Studio backdrop or solid background | Real, detailed, believable environment matching the service context |
| Person smaller than 25% of frame | Person is the protagonist — large enough for emotional connection |
| Lighting contradicting the environment | Natural lighting appropriate to the scene (sunset outdoors, even light in offices) |
| Generic environments with no cultural specificity | Environments matching the brand's geography and target market |
| Overlays that feel random or decorative | Overlays that serve a purpose: branding, framing, trust, or emphasis |
| Multiple conflicting lighting sources | One consistent lighting mood per composition |

---

## Quality Checklist

### Scene/Environment
- [ ] Environment is fully photorealistic with detailed surfaces and materials
- [ ] Environment matches the assigned scene category
- [ ] Cultural context matches the brand's geography
- [ ] Environment suggests the service outcome (not the service process)
- [ ] Time of day and season consistent with lighting mood

### Person
- [ ] Person is photorealistic and naturally placed in the environment
- [ ] Demographics match ICP (age, ethnicity, clothing)
- [ ] Expression and body language match hook psychology
- [ ] Person occupies 25-40% of frame (varies by camera approach)
- [ ] Person is DOING something, not posing — active protagonist

### Camera & Lighting
- [ ] Camera approach matches the assigned type (wide/medium/close/low angle)
- [ ] Focal length and DOF are intentional and appropriate
- [ ] Lighting mood matches the assigned type (warm/cool/dramatic)
- [ ] Lighting feels natural to the environment
- [ ] Cinematic quality — looks like professional lifestyle photography

### Graphic Overlays
- [ ] Overlay style matches the assigned type (floating objects/shapes/gradient/badges)
- [ ] Overlays use brand colors
- [ ] Opacity is appropriate (20-40% for shapes, 80-90% for floating objects)
- [ ] No overlay obscures the person's face or primary action
- [ ] Maximum 2-3 overlay elements

### Diversity
- [ ] Scene category is unique (or near-unique) among the 6 hooks
- [ ] Camera approach differs from adjacent hooks
- [ ] Lighting mood varies across the set
- [ ] Overlay style varies across the set
- [ ] Person demographics vary within ICP range

### Typography
- [ ] Clean modern sans-serif font
- [ ] Text integrated with the graphic overlay layer
- [ ] Brand colors used in text and CTA
- [ ] CTA clearly visible and separated from scene content

### Mobile
Follow shared mobile checklist in SKILL.md § Mobile Safe Zone Rules.
- [ ] Person + environment occupy at least 60% of frame

---

## Output Format

Write to: `agent/files/creatives/{brand}_prompts.json`

Follow the shared JSON structure in SKILL.md § Output Format. Style-specific `stage` fields for this workflow:

```json
"stage": {
  "sceneCategory": "professional|home-domestic|outdoor-lifestyle|aspirational-destination|service-in-action",
  "cameraApproach": "wide-establishing|medium-portrait|close-up-detail|low-angle-empowering",
  "lightingMood": "warm-golden-hour|cool-professional|dramatic-rim-lit",
  "graphicOverlayStyle": "floating-objects|geometric-shapes|gradient-wash|badge-stamps",
  "audienceProfile": {
    "age": "age descriptor",
    "ethnicity": "market-derived descriptor",
    "gender": "male|female|non-binary",
    "clothing": "style descriptor"
  },
  "environmentDescription": "brief scene description"
}
```