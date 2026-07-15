# TheRateFinder — Client Brief (Meta ad creatives)

_Created 2026-07-14. Everything below marked **[site]** was read off theratefinder.ca. Everything marked
**[OPEN]** needs the client — do not invent it, do not render against it._

## The business
**TheRateFinder** — mortgage brokerage / "lending hub". HQ **Woodbridge, Ontario**. **[site]**
Positioning line on the site: _"Canada's First Lending Hub — Not Just Rates. Real Loans for Every Property Type."_

**Product lines [site]:**
| Line | Terms quoted on site |
|---|---|
| Residential | from **4.19%**, up to 95% LTV; 30+ A-lenders |
| Commercial | from **4.45%** institutional (0.25% lender fee), up to 100% LTV, **$200k–$150M**; 50+ commercial lenders |
| Private | from **5.99%** residential / **8.00%** commercial (1.1% lender fee); 150+ private lenders |
| Construction | Prime + 2 |
| Special situations | fix & flip · **bridge** · BRRR · **rush closings (24–48 hrs)** · power-of-sale financing · **rescue financing** · non-resident mortgages |

**Scale claims [site]:** 350+ lenders total · "hundreds of successful borrowers across Ontario" · six recently-funded
deals shown with amounts + locations.
**Coverage [site]:** all Canada claimed; rate pages for Vancouver, Calgary, Ottawa, Winnipeg, Manitoba; **deal flow
is visibly Ontario-weighted.**
**Tools on site [site]:** 9 calculators (mortgage, max mortgage, closing costs, land transfer, debt service,
renewal…), Zoning Finder, Property Value Estimator.

## The conversion event — THE THING TO GET RIGHT
Client's stated goal: **conversions, not traffic.** The site exposes **two** conversion paths **[site]**:
1. **"🏠 Apply for Mortgage" → `/onboarding/email`** — a multi-step application. High friction, high intent.
2. **"Ring Me Up!" callback form** — name + phone + optional note. Low friction, lower intent.

**[OPEN] — blocking, ask the client:**
- Which event is the pixel optimising on today? Is it even firing? (No pixel = no conversion campaign, full stop.)
- What is a funded deal worth to them (avg commission), and what % of applications → funded? That gives us the
  real CPA ceiling. Without it we're guessing at "good".
- Target CPA per application/callback, and the budget + flight for this sprint.

> Verbis lesson worth repeating here: we lost days of spend to a **broken checkout** before anyone noticed. Before
> a dollar runs, walk the whole funnel ourselves — click the ad → land → complete `/onboarding/email` end-to-end on
> a phone, in the in-app browser. **Instagram's in-app browser is where payment/form flows go to die.**

## Audience — segments, in the order they're worth testing (hypothesis)
The product lines imply distinct buyers. These are **not equally winnable**:
1. **The "I don't fit the box" borrower** — self-employed, new-to-Canada, bruised credit, non-resident, declined by
   their bank. Desperate, not shopping. This is what 150 private + 50 commercial lenders is FOR.
2. **The deadline borrower** — needs to close in days: bridge, rush close (24–48 hrs is on the site), power of sale,
   rescue financing. Maximum urgency, minimal price-sensitivity.
3. **The investor** — fix & flip, BRRR, construction. Repeat buyer, high LTV.
4. **The rate shopper** — renewal / purchase, wants the lowest number. **Biggest volume, worst economics** (see wedge).

## HARD CONSTRAINTS — regulated category ⚠️
**These need confirming with the client before launch, but assume they're true when writing copy:**
- **Meta "Special Ad Category: Credit."** Mortgage/loan ads are almost certainly restricted in Canada, same as the US.
  If so: **no targeting by age, gender, or postal code**, minimum geo radius, **no lookalike audiences**. → **The
  creative has to do the targeting.** The ad must name its buyer in the first three words ("Self-employed?",
  "Bank said no?", "Renewal in 2026?") because the ad platform will not aim it for us. This reshapes the whole plan
  — **verify in Ads Manager before we design around it.**
- **Ontario FSRA / MBLAA licensing.** Brokerage name + licence number generally must appear on public advertising.
  **[OPEN] Get the exact brokerage legal name + licence #** — it may need to sit in-image or in the ad copy.
- **Rate claims go stale and are policed.** "From 4.19%" needs its conditions (OAC, terms, subject to change). A rate
  baked into a rendered PNG is a compliance liability the moment rates move. **Default: no hard rate number in the
  image** unless the client explicitly signs off.
- **Never fabricate.** No invented funded deals, testimonials, dollar amounts, or approval times. Real product = ground truth.

## Assets — the trust gap 🔴
The site has **no testimonials, no star rating, no review count, no named broker, no face.** **[site]**
Verbis's single best performer was the **proof** creative (2.36× ROAS, the campaign's best, and we starved it).
Here we have **no proof asset yet.** That's the #1 thing to solve — see `assets/ASSETS.md` for the ask list.
The nearest thing that exists: **the six funded-deal cards on the site** (amounts + locations). Those are the
score-card analogue — real, specific, ownable. Get the originals.

## The strategic wedge — HYPOTHESIS, not a conclusion
> To be **validated or killed** by the field pass (Meta Ad Library read of real Canadian mortgage ads), not assumed.

**Hypothesis:** every mortgage broker in Canada advertises the same thing — **the lowest rate number.** The rate lane
is fully commoditised (Ratehub, ratesdotca, every bank, every broker) and it attracts the worst buyer: a shopper who
will leave for 5 basis points and may not even qualify.

TheRateFinder's *real* differentiator, per its own site, is **not the rate** — it's **"real loans for every property
type"**: 350+ lenders, 150 of them private, plus rush closings and rescue financing. That serves the borrower who
**already got declined** or who **has to close Friday**. That buyer converts on *certainty and speed*, not price —
and nobody is advertising to them.

**So the wedge to test: sell the APPROVAL, not the RATE.** Ironic for a brand called TheRateFinder, and that tension
is exactly what to put in front of the client.

**How we validate before committing:** the field pass pulls real active Canadian mortgage ads from the Meta Ad
Library. If the lane really is 95% rate-led, the white space is real. If brokers are already running "bank said no"
angles, we adapt. Evidence first.

## Open questions for the client (blocking)
1. Pixel: installed, firing, on which event? Which conversion do we optimise — application or callback?
2. Economics: avg commission per funded deal · application→funded rate · target CPA · budget + flight.
3. Compliance: brokerage legal name + **FSRA licence #** · what rate/approval claims are we cleared to make?
4. Geography: is this an **Ontario** campaign (where the deals are) or all-Canada?
5. Assets: funded-deal originals · broker face + name · any reviews anywhere (Google?) · logo + brand colours.
6. Which product line does the client actually want more of? (What we push in the ad is what we get more of.)
