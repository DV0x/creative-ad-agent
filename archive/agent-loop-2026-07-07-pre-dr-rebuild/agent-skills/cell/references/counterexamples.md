# The counterexample bank — the category modes to forbid

> Canonical copy for the cell skill (moved from `docs/anthropic-learnings/cell-counterexamples.md`, 2026-06-11). Grows per category as brands onboard.

**Purpose:** the "forbid the obvious" list (the frontend-design pattern: name the category mode explicitly so the generator treats it as the *floor to clear*, not the target). It feeds the generator's floor-clearing move and the critic's **category-look test** and **obvious-first-idea test**.

**How to use:** the cell names the relevant mode(s) for the brand's category and treats them as the safe center — *do not generate them.* The critic fails any take that lands on one.

---

## The principle that makes this list useful

Every item below **passes a quality checklist** — clear, legible, on-brand, communicates the benefit — and **fails the swap test** — a competitor could run it with a logo swap. That gap is the whole reason the swap-test rubric exists.

They are **not bad in craft terms.** They're well-executed, which is exactly why the model reaches for them and why a quality rubric waves them through. **They are the safe mode wearing nice clothes.** The cell must clear them, not hit them.

---

## The look-level modes — universal (the defaults that survive cliché-clearing)

Forbidding the items below the floor doesn't make work distinct — the mode relocates one level up, to the default "good ad." These are the named looks the relocation lands on. They bite at the *treatment* layer even when the concept is sharp:

- **The tasteful center** — muted still life · soft window light · clean witty sans · cream/neutral surface · nothing marked up, nothing worn. The all-defaults stack: each layer's safest answer, taken five times. It is every "premium minimal" brand's house style and every AI tool's resting state. Legal only as an *earned* default (the argument is "look at the product") with the reason written in the take.
- **AI-gloss** — the photoreal center: glossy perfect studio sheen, flawless light, zero grain, zero wear. The emerging signature of AI-made ads. "Photorealistic" as a bare instruction produces this; a *named photographer* (strobe + true shadows + imperfection) is the antidote.
- **AI-soft-3D** — the soft Pixar-adjacent 3D render with rounded everything and butter lighting. AI slop's other house style.

---

## Visual clichés — universal (show up in every category)

- Product floating on a smooth **gradient background**
- Product on a **pedestal / podium** with a soft drop shadow
- **Flat-lay** with scattered props (coffee cup, plant leaf, sunglasses, marble slab)
- **Hand** emerging from the edge holding the product
- Attractive person **smiling while using the product** in soft natural light
- Product centered on a **pastel / beige "minimal"** backdrop
- Slow-mo **splash / pour / ingredient explosion**
- **"As seen in"** press-logo bar
- **Before / after** split
- Ingredients **orbiting** the product (fruit around a juice, etc.)
- **3-up grid** of colorways on white
- Extreme **macro texture** shot
- Giant product with a **tiny person** for scale (or vice versa)
- Product **exploded into parts** floating in a row

---

## Visual clichés — by category

### Whey / supplements / nutrition
- Gym bro **mid-flex** holding the tub
- Dark **moody gym** background
- Metallic tub on **concrete / industrial** surface
- **Powder scoop frozen mid-air**, particles flying
- Veiny forearm scooping
- "Clinically tested" / lab badge slapped in a corner
- Six-pack torso, no head

### Apparel / accessories (DailyObjects, bags, EDC)
- Flat-lay of the bag with **coffee + notebook + AirPods**
- Bag **hanging on a hook** against a white wall
- Model shot **from behind walking away**, bag on shoulder
- Overhead **"everyday carry"** arrangement (keys, wallet, phone, bag)
- Bag on a **stool** in an empty studio

### Hotels / hospitality (beta client vertical)
- **Drone shot of the pool at sunset**
- **Rose petals** on a made bed
- **Champagne flutes** on a balcony railing
- Gold-and-marble **"luxury" lobby**
- Smiling **couple in robes**
- Aerial of the breakfast spread

### SaaS / lead-gen / services
- **Laptop showing a dashboard** on a clean desk
- **Floating UI screenshots** with gradient blobs behind
- **Diverse team smiling** at a screen
- **"Trusted by 10,000+"** + logo wall
- Abstract **3D shapes / blobs**
- Person in headset (support cliché)

---

## Copy clichés — universal

- "**Meet** [Product]." / "**Introducing** [Product]."
- "The **cleanest / purest / smartest / last** [category] you'll ever need."
- "**Not just** a [X]. **A** [Y]." ← the antithesis cadence
- "**Say goodbye to** [problem]."
- "**Elevate / Upgrade** your everyday."
- "[Category], **reimagined / redefined / done right**."
- "The **future of** [thing]."
- "Because you **deserve** better."
- "**Finally**, a [product] that gets it."
- **Unbacked superlatives:** revolutionary, game-changing, premium, clean, seamless
- **Fake urgency:** "Selling fast," "Don't miss out," manufactured scarcity
- **Spec-dump with no buyer in sight:** "24g protein. 6.8g BCAA. Zero junk."
- **Rhetorical-question opener:** "Tired of [problem]?"
- **Empty imperative:** "Experience the difference."

---

## Spent famous furniture — borrowed objects the world has already used up

Welding a claim to something the buyer already knows is a legitimate move (`references/layer-stack.md`) — but these specific pieces of furniture are *spent*: famous ads already own them, so reaching for one reads as borrowed twice. Banned as executions; listed so the lesson rides along:

- **The chicken-or-egg riddle answered by the product** — FedEx owns it (the answer *was* the speed claim; that weld is the bar, and it is taken).
- **"Lemon" / calling your own product the insult** — VW owns it.
- **"Tested on animals" flipped to praise** — Wilson's dog food owns it.
- **The Creation-of-Adam reach toward the product** — the most borrowed image in advertising.
- **The Chrome offline dino as "offline vs online"** — already the stock gag of every digital agency; welded to the category, never to a brand.

The pattern these teach: the weld must be to *your* claim, with furniture nobody has spent yet — the buyer's shelves are full of fresher objects than advertising's greatest hits.

---

## How this plugs into the cell

1. **Generation:** the cell names the relevant category mode(s) and treats them as the floor, not the target ("forbid the obvious"). The winning take's nearest floor items go into the shot spec's **Forbid** field, where the compile converts them into positive decisions.
2. **Critic:** the **category-look test** (does the picture resemble any item here?) and the **obvious-first-idea test** are scored against this bank by the independent critic.
3. **Swap test** is the umbrella: if a competitor could run it with a logo swap, it has landed on one of these modes.

**Caveat (the two-track conclusion):** clearing this list is *necessary but not sufficient.* Avoiding the cliché doesn't create specificity — that comes from the way-in and the room. A non-cliché picture built on a vague insight is *weird-empty* slop (novel form, no brand substance), which also fails the swap test. Forbid the mode AND stand on a sharp truth.
