# Creative Agent — Product Strategy

**Last updated:** 2026-05-03
**Status:** Living document. Append, edit, and revise as decisions evolve. Add a changelog entry when you make material changes.
**Source conversations:** initial draft from 2026-05-03 strategy session (feedback loop architecture + GTM design + beta client planning).

---

## TL;DR

We're building an AI creative agent that generates Meta ad creatives (hooks + images) tuned to each user's audience over time via a feedback loop. The product gets stronger the more a user runs campaigns through it — discovering taste axes the user couldn't have named themselves. ICP is *any business with a trackable digital conversion event* (D2C, hospitality, lead-gen services, online education, B2B SaaS) — broader than D2C-only. GTM wedge is a free creative audit that diagnoses whether creative is the bottleneck, then converts to paid pilots and subscriptions. Two beta clients in play: a Hyderabad hotel (Razorpay-integrated) and an abroad education consultancy (lead-gen).

---

## 1. Product Vision

**North star:** A creative agent that produces ads which *actually drive performance for your audience*, not just ads that look good. The promise compounds over time — the more campaigns you run, the more it knows your buyers, and the better your ROAS gets.

**Differentiation from generic AI ad tools:**
- **Research-first generation** — every hook traceable to brand research, not invented (already shipped)
- **Per-user discovered preferences** — the system learns what specifically works for your audience (designed, not built)
- **Reach-signal-driven** — what gets clicked + converts wins, not what looks pretty (designed, not built)

The honest framing: we lift the **creative-driven CTR/CPL** lever. We don't drive ROAS end-to-end — landing page, offer, targeting, and bid strategy aren't ours to fix. We move the input that everything else multiplies through.

---

## 2. ICP & TAM

### The gate

The right ICP question is **"can this business tie a click to a recorded conversion event?"** — not "are they D2C?"

### Three tiers, descending signal quality

| Tier | Examples | Conversion event | Attribution path |
|---|---|---|---|
| **D2C e-commerce** | Skincare, apparel, supplements on Shopify | Stripe charge | Pixel + Stripe webhook → automated ROAS |
| **Online booking / payment** | Hotels with Razorpay, online courses, B2B SaaS paid signup, marketplaces | Razorpay/Stripe payment captured | Webhook → Meta CAPI → automated ROAS |
| **Lead-gen with online form** | Mortgage, dental, legal, financial advisors, education consultancy, agencies | Lead form fill | CPL automated; close-rate via CRM or self-report |

### Out of scope (don't serve)

- Brick-and-mortar foot-traffic with no online conversion
- Pure brand-awareness with no measurable conversion
- Aggregator-only businesses (all bookings on Booking.com / MakeMyTrip / etc — nothing to attribute)

### TAM implication

~5–10× larger than the original D2C-only framing. Same agent architecture serves all three tiers identically — only the integration plumbing differs.

---

## 3. Agent Capabilities Today (Cold-Start Product)

What the agent already does, before any feedback loop:

### Research extraction
Scrapes brand URL → 14-section structured research doc:
- The Offer, Key Value Props, Proof Points, Products/Services, Pain Points Addressed, Testimonials, Brand Voice, Their Messaging, ICP Segments, Owned Positioning, Competitive Context, Buying Objections, Customer Language & VoC Signals, Category Intelligence

### Hook generation (10 types, 6 per campaign)
Attention hooks: Question, Surprising Stat, Pattern Interrupt, Controversial, Direct Address.
Desire hooks: Social Proof, Problem-Solution, Contrast, FOMO/Urgency, Curiosity.
Each hook tagged with type, target ICP, psychological driver, format intention (static / video / carousel / UGC), traceable source. Logo-swap test for defensibility.

### Image generation (14 art styles via fal.ai)
analog-craft, anderson-clay-diorama, bold-energy, clean-premium, dream-sketch-hybrid, editorial-cutout, infographic-data-visual, lifestyle-render-hybrid, product-on-gradient, service-realism, soft-brutalism-clay, split-comparison, typography-dominant, ugc-aesthetic-static.

### Workflow shipped
- "New Campaign from Existing" — research reused, fresh hooks/images for new brief
- Persistent campaign state (session 91 refactor)
- Workspace UI with editorial chrome, dynamic Sage agent identity
- Production: Cloudflare Workers + Durable Objects + D1 + R2 + Sandbox Containers

---

## 4. The Feedback Loop (Designed, Not Built)

### Why this matters

Cold-start campaigns are good but generic. Customer retention requires the agent learns each customer's audience over time. The user explicitly wants the system to **discover preference axes the user couldn't have named** ("you hate busy backgrounds") — that requires embeddings, not just structured rollups.

### Architecture

```
[Image generated]
  → R2 (already)
  → Workers AI: CLIP image embedding (@cf/openai/clip-vit-base-patch32)
  → Text embedding of hook + brief + auto-generated caption
  → Cloudflare Vectorize upsert with metadata sidecar
     (user_id, campaign_id, image_id, hook_type, art_style, brand_vertical, rating, reach_signal)

[User likes/dislikes / reach data arrives]
  → D1 user_feedback row
  → Vectorize metadata patch

[New generation request]
  → Embed the new brief
  → Vectorize query: top-K liked exemplars (for this user, this brand)
  → Vectorize query: top-K disliked / low-reach exemplars
  → Pull cached "discovered preferences" summary from D1
  → Inject all three into agent system prompt as "emulate / avoid"

[Async, every N ratings or nightly]
  → Pull last 30-50 rated images (vectors + captions + ratings + reach data)
  → Haiku call: "What patterns separate liked from disliked? Output 3-5 short rules."
  → Cache as text summary on D1 user_preferences.discovered_summary
```

### Schema (proposed)

```sql
CREATE TABLE user_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  image_id TEXT NOT NULL,
  rating INTEGER,                  -- thumbs (proxy)
  reach_signal REAL,               -- CTR/CPL/ROAS when known (gold)
  reach_source TEXT,               -- 'self_report' | 'meta_ads_api' | 'google_ads_api'
  rated_at INTEGER NOT NULL,
  UNIQUE(user_id, image_id)
);

CREATE TABLE user_preferences (
  user_id TEXT PRIMARY KEY,
  brand_id TEXT,                   -- per-(user, brand) scoping
  discovered_summary TEXT,
  summary_updated_at INTEGER,
  rating_count INTEGER,
  predictive_accuracy REAL         -- doubles as the confidence gate
);
```

### Locked design decisions

- **Reach signal dominates over thumbs** in scoring. Schema must include `reach_signal` + `reach_source` from day one.
- **CPL is the primary signal for lead-gen verticals**, not CTR. CTR rewards clickbait; CPL rewards qualified intent. Reaches statistical significance much faster than ROAS-via-bookings.
- **Per-(user, brand) scoping** — same user's swimwear brand and B2B SaaS brand have nothing in common.
- **Three-tier confidence model**: <60% predictive accuracy → ignore preferences (use defaults). 60–80% → soft bias. >80% → strong bias.
- **Diversity floor**: always ≥3 hook types per campaign regardless of preference signal — prevents reward hacking and ad fatigue.
- **Recency decay**: 30-day weight > 6-month weight. User taste drifts.

### Build order

1. Cold-start product validates with 1–2 beta clients (in progress)
2. Manual feedback injection in v0 — hand-write what worked into prompt for next campaign. Validates the *design*.
3. Build embedding + Vectorize infra only after manual injection demonstrably lifts performance.
4. Build automated discovered-preferences summarizer.
5. Build self-reported reach UI; later, ad-platform OAuth integrations.

### Cost sanity

- CLIP embedding: ~$0.0001/image (Workers AI)
- Vectorize: free at sub-1M scale
- Haiku summary: ~$0.001/update
- Negligible vs fal.ai image gen costs.

---

## 5. Measurement Framework

### Signal hierarchy

| Signal | What it measures | Cycle | Use for |
|---|---|---|---|
| **CTR** | Click-stopping power | Days | Initial creative ranking only |
| **CPL** | Qualified intent (lead-gen) or product fit (D2C) | 1–2 weeks | **Primary learning signal for lead-gen** |
| **CPQL** | True intent quality | Weeks | Secondary, where consultancy screens leads |
| **Cost per paid customer / ROAS** | Bottom line | Weeks–months | Gold signal, often delayed |

### What our agent moves vs. doesn't

```
ROAS = CTR × Conversion Rate × AOV ÷ CPC
       └────┘   └─────────┘    └─┘   └─┘
       OURS    not ours       not   not
                              ours  ours
                              (LP)  (target)
```

**Honest claim:** "We lift the creative-driven CTR (and CPL) — the most expensive lever in your funnel to move." Not "we boost ROAS."

### Eval thresholds

Three "meaningful data" levels, in increasing rigor:

| Threshold | Clicks per creative | What you can say |
|---|---|---|
| **Direction-of-arrow** | 500–1,000 | "This is clearly better/worse" — informal ranking |
| **Statistical CTR significance** | 5,000–7,000 | 95% confidence on 30%+ relative lift |
| **Booking/CPL confidence** | 1,500–2,500 | Confident comparison if conversion rate ≥ 2% |

### Industry CPL benchmarks (India, where applicable)

**Abroad education consultancy:**
- Excellent: ₹150–300 / Good: ₹300–600 / Average: ₹600–1200 / Bad: ₹1200+

(Hospitality, B2B SaaS, mortgage, etc — to be filled as we gather client data.)

### Honest caveats

- **Single-client data won't statistically prove agent lift.** Need 5–10 clients × 3+ campaigns each (~150–200 creatives) for product-level claims.
- **Industry benchmarks are weak predictors of headroom.** Real lift potential depends on creative refresh cadence, frequency, audience saturation, LP quality, offer competitiveness, brand strength. The pilot itself is the cheapest, most accurate prediction.
- **Self-reported reach is biased.** Users report wins, omit losses. Schema design accommodates upgrading to API-pulled signal (Meta Ads, Google Ads) when ready.

---

## 6. GTM: Audit-Led Wedge

### Why this works

Three reasons:
1. **Free thing with real value** — prospect's data, prospect's problem, prospect's number. Converts way harder than generic lead magnets.
2. **Pre-qualifies for us** — if creative isn't the bottleneck (broken LP, weak offer, sloppy targeting), we don't take the client. Protects case-study credibility.
3. **Conversation opener that leads with their problem**, not our product. "I ran an audit on your Meta ads — your top performer hit frequency 7.2 last week" >> "Want to try our AI ad tool?"

### Funnel

```
Cold prospect or inbound
  → Free audit (60s automated, eventually; manual today)
  → Diagnostic: "Creative is your bottleneck. Estimated CTR lift: 25-45%"
  → Soft CTA: "Run a 5-day pilot for ₹15k — keep the creative regardless"
  → Pilot ships 3-6 generated ads → live on their account
  → Real CTR / CPL data lands
  → Pilot wins → conversion to subscription
  → Pilot loses → we learn; they paid; no relationship damage
```

**Pilot is paid (₹15k), not free trial.** Removes tire-kickers, aligns incentive, redirects existing spend.

### Audit components

- Scrape Meta Ads Library: creative count, frequency, last refresh date, creative variety
- Click through funnel: assess landing page quality
- Eyeball offer vs. 3 visible competitors
- Vision model over creative: production-quality assessment
- Output: "Estimated CTR lift potential: X%. Bottleneck: [specific]."

### Build order

| Stage | What | When |
|---|---|---|
| **v0 — Manual** | 20 audits, 20–30 min each, Loom + PDF, cold DM with audit attached | This week. Validates wedge converts before software. |
| **v1 — Semi-automated** | Form on landing page, agent does most of the work, you hand-finish | After ~30 manual audits delivered, you know what makes them good |
| **v2 — Fully automated** | 60-second self-serve audit, integrated with cold-start product as first onboarding step | After v1 validates and inbound demand justifies engineering |

### Conversion targets to validate the wedge

- 20 cold DMs → 4–6 replies (20–30%)
- 4–6 replies → 2–3 pilots booked at ₹15k each
- 2–3 pilots → 1–2 subscriptions

If 0 of 20 reply, the wedge needs sharpening. If 3+ convert to subscription, scale the motion.

### Constraints

- **Audit quality bar is high.** Bad audit torches trust faster than no audit.
- **Need 60%+ pilot win rate** for funnel not to invert. Pre-qualifying via audit ensures we only take clients we can lift.
- **Need 3–5 named case studies before scaling.** First wins build the GTM engine.

### Positioning shift

From "AI ad generator" (commodity, lots of competitors) to **"AI growth diagnostic with creative as the cure"** (premium, defensible). Diagnostics command premium pricing in every market because they reduce buyer risk.

---

## 7. Beta Clients

### Client 1 — Hyderabad hotel (D2C-tier)

| Field | Value |
|---|---|
| Vertical | Hospitality |
| Conversion event | Direct booking (Razorpay-integrated website built by us) |
| Monthly ad spend | ₹10–15k |
| Estimated clicks/month | ~830 (₹18/click avg) |
| Direction-of-arrow timeline | 6–8 weeks at current spend; 2–3 weeks at 3× |
| Architecture fit | Same tier as D2C — booking value attributable via Razorpay → Meta CAPI |

**Experiment plan:**
- Sequential test (their creative week 1, ours week 2) — too low spend for clean simultaneous A/B
- Optionally negotiate 2–3× budget bump for experiment month
- Optimize for direct-booking attribution; even 5 bookings on our creative vs 1 on theirs is qualitative gold

**Vertical-specific creative considerations:**
- **Seasonality dominates** — monsoon vs winter creative are different products. Recency decay needs to be tighter; embedding metadata should include `season`.
- **Long booking lead time** — reach signal lags weeks; eval needs to handle delayed conversions.
- **Reviews are decisive** — 4.8 stars / 2,300 reviews often beats clever copy. Visual styles should accommodate review badges.
- **Direct-booking vs OTA gap** — direct is 15–25% more profitable than Booking.com / MakeMyTrip. Creative's job is to convince guests to book direct.

### Client 2 — Abroad education consultancy (lead-gen tier)

| Field | Value |
|---|---|
| Vertical | Education / lead-gen services |
| Conversion event | Lead form fill (qualified intent), close cycle 30–90 days |
| Monthly ad spend | ₹30–50k |
| Estimated clicks/month | ~1,800–2,500 (₹15–25/click) |
| Direction-of-arrow timeline | 2–3 weeks (much better signal-to-noise than hotel) |
| Primary metric | **CPL, not CTR** — form fills happen at 5–10% rate, accumulate fast |

**Experiment plan:**
- 3 creatives per campaign, 14-day campaigns, ~₹450/day per creative
- Per campaign: ~500–700 clicks per creative, ~25–50 form fills, ~3–5 qualified leads
- 4–5 campaigns over 3 months → ~12–15 creatives with CPL data, 4–5 with CPQL data

**Vertical-specific creative considerations:**
- **Outcomes over offerings** — "₹2 Cr scholarships secured" >> "expert consultancy services"
- **Specificity in stats** — "47 students placed in US Top-50 in 2025" >> "many successful placements"
- **University logo proof** — visual styles must accommodate showing admit university crests
- **Time-anchored urgency** — "Aug 2026 intake closing in 60 days" >> evergreen
- **Sharply different ICP segments** — undergrad / grad / PhD × US / UK / Canada × scholarship-seeking / self-pay
- **Trust > flash** — service-realism and infographic styles bias higher in cold-start than bold-energy

**Why this is the cleaner experiment of the two:**
- CPL signal much faster than booking signal
- Statistical confidence on CPL achievable in 2–3 campaigns (impossible at hotel's spend)
- Vertical has clear category priors agent can exploit immediately

### Cross-client principles

- **Run cold-start product first.** No embedding infra yet.
- **Manually inject feedback into prompts** for v2 campaigns to validate the *design* of the loop before building automated version.
- **Track everything qualitatively** — what client thumbs up/down, what Meta rejects, what they say out loud — for case studies and to inform rating-UI design.
- **Both clients are design partners, not paying customers** for v1 — manual D1 credit grants per the design partner playbook.

---

## 8. Open Questions / Pending Decisions

### Architectural
- **Capture surface for ratings**: thumbs on every image? On hooks too? Star rating? More granular = more signal but more friction. Decision pending.
- **Caption generation**: auto-caption every image with vision LLM at generation time, or only when needed for embeddings? Captions help text-side discovery a lot.
- **Reach signal source for v1**: self-report in chat (cheapest), paste-in CSV (medium), or Meta/Google Ads OAuth (highest signal, highest friction)? Likely launch with self-report, build OAuth as premium tier.

### Product
- **Is the audit a separate product or onboarding step?** Could be both — same engine, different framing per surface.
- **Pricing for the pilot.** ₹15k assumed but not validated — could be free for design partners, paid for cold prospects.
- **Mobile parity carry-overs** from session 88–91 still pending (Sage badge in MobileChatDrawer, etc).
- **URL routing refactor** (`/workspace/c/:id`, `/workspace/new`) is the proper architectural fix the localStorage scaffolding is a band-aid for. Pending.

### GTM
- **Cohort bootstrapping for cold-start preference data** — could pool ratings across users in same vertical to seed new accounts. Privacy implications. Probably v3.
- **Where to source the first 20 audit prospects?** D2C founders on Twitter? Education consultancies on LinkedIn? Hospitality via existing client network?
- **Self-serve vs sales-assist** — at what point does the audit funnel switch from us doing it to fully automated?

### Operational
- **Production deploy** — first prod cut since session 85. Sessions 86–91 still need to ride together to prod.
- **APFS disk corruption risk** — recurring issue. Need ≥30GB free before next dev run.

---

## 9. Changelog

- **2026-05-03** — Initial draft. Captured: ICP refinement (broader than D2C), feedback loop architecture (multimodal embeddings + Vectorize + reach-as-gold), measurement framework (CTR/CPL/ROAS hierarchy), audit-led GTM, two beta client plans (hotel + education consultancy), open questions list.
