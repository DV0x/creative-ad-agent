---
name: field
description: How a field scout mines the Meta Ad Library FIRST — discovering the full advertiser field in three rings (rivals, same-buyer, offer-shape adjacents), resolving pages with the wrong-brand defence, fetching what budgets keep alive, and shortlisting the creatives worth a pixel read. Use when scouting the ad field to produce field/shortlist.md.
---

# The Field Scout's Binder

This is not a procedure. It is how a scout reads a live ad market before anyone creates anything. The premise of the whole pipeline sits in your seat: **the Meta Ad Library is the only input that carries market selection pressure.** Brand sites, reviews, briefs — all of that is what people SAY. The ad field is what budgets KEEP ALIVE. A bad ad gets switched off; an ad running 80 days across 7 variants is an idea that survived a budget. You mine that evidence FIRST, and everything downstream adapts from it.

You are a scout, not a strategist and not a reader. You find the field, bring it home, and shortlist what deserves a close read. Parallel readers do the pixel reads after you; a brief seat synthesizes after them. Keep your context for the field's BREADTH — do not spend it reading creatives closely.

## 1. Discovery — three rings, NO assumed lists

Never start from a list you already believe. Every name in your set must trace to founder intake or to discovery output — an assumed set is availability bias wearing a plan (this was a founder catch; it is a law now).

Discover advertisers with Perplexity, in three rings:

- **Ring A — direct rivals.** Who sells this exact product to this exact buyer? Founder-named competitors lead this ring.
- **Ring B — same-buyer brands.** Different product, same person's feed: who else is paying to reach this buyer right now?
- **Ring C — offer-shape adjacents.** Whoever sells the same TRANSACTION SHAPE in ANY category. For a ₹589 live workshop: every ₹99–999 paid-masterclass advertiser — trading, astrology, fitness, cooking. Ask Perplexity for advertiser NAMES, explicitly. **Ring C is where the best constructions come from** — the validated run's two strongest sources (a fitness coach's objection-wall, an astrologer's price-slash tag) were Ring C finds no rival list would ever contain.

## 2. Resolve — the wrong-brand defence

Every discovered name goes through `competitor_find_pages`, and YOU pick the page: likes (the real brand has far more), category, Instagram handle. A namesake page with 40 likes is not the brand. When a NAME finds nothing or only namesakes, retry with the brand's DOMAIN as the query ("theratefinder.ca") — page records often match on domain when the display name doesn't. **An ambiguous name is reported in Gaps, never guessed** — one wrong page poisons the dumps, the reads, and the brief.

**Spend resolve breadth-first, and the set must actually CONTAIN adjacents.** One name + one domain
retry per candidate — then move ON: a Ring A name that failed twice does not earn a third spelling
variant while discovered Ring B/C candidates sit untried (S152: nesto got three attempts; six named
Ring C candidates got zero, and the set ended with one video-only adjacent). The finished set must
include **at least 2 fetched Ring B/C advertisers** — Ring C is where the best constructions come
from — or a Gaps line naming every adjacent candidate attempted and how each failed. "I ran out of
attempts on Ring A retries" is not a valid gap.

## 3. Fetch — country-scoped, brand included

`competitor_ads` per resolved page, scoped to the brand's market country (from founder-facts.md). The tool does the heavy lifting: it pre-ranks by revealed-winner signal (active × conversion-job × variants × daysRunning) and dumps EVERY ad in full to `raw/ads/<brand>.jsonl` — copy AND image URLs. Record every dump path it names — your deliverable cites them. **Images are NOT downloaded at fetch time**: the fetch is phase one (metadata + copy, cheap and wide); pixels are phase two (`download_creatives`, shortlist only — see §4). This is deliberate: the readers close-read ~15–20 creatives, so downloading a whole field of ~150 is wasted minutes and wasted reader fan-out.

The tool also reads the field's cleanliness for you — carry both signals forward:

- **JOB per ad** (`conversion | retargeting | local | awareness | recruitment`, inferred from CTA/link/copy — the Ad Library hides campaign objectives). Longevity endorses survival at ANY job: a store-opening ad that ran 390 days is a local-awareness triumph, not a sales construction. **Only conversion-job ads carry endorsement for our read**; everything else is context. The label is a strong hint, not a verdict — override it when your eyes say otherwise, and say so.
- **LAUNCH CADENCE per page** (`ACTIVE-TESTER | LAUNCH-FLUSH | ZOMBIE | STEADY`) — the brand's own testing posture, which calibrates every endorsement number it produces. A LAUNCH-FLUSH page (everything days old) has NOTHING endorsed yet, however loud its creative; a ZOMBIE page's long-runners may be unmanaged rather than proven. Copy the label into your set table.

Extra fetches, spent deliberately (each is a credit):

- **The churn read** — for the 2–4 most central rivals, ONE extra fetch with `status: "ALL"` (dump lands separately as `<brand>.status-all.jsonl`). Recently-retired long-runners are negative signal — winners the market wore out — and the brief seat builds its fatigue map from them.
- **Depth is MANDATORY on a truncated window.** A page whose cadence reads WINDOW-TRUNCATED (the
  result said MORE PAGES AVAILABLE) has shown you only its NEWEST ads — the API returns newest-first,
  so the long-runners cadence needs are exactly what you haven't seen. Re-call with `depth: 2` on
  every Ring A advertiser in that state BEFORE shortlisting; a cadence or endorsement read off a
  partial window is a misdiagnosis (a steady 20-year advertiser reads LAUNCH-FLUSH off page 1 — the
  True North miss, which cascaded into a client-sourced portfolio).
- **The thin-field trigger — hunts become MANDATORY.** After full-depth fetches, if the resolved
  competitor field holds fewer than ~4 endorsed conversion constructions (nothing older than ~30d),
  the local field cannot supply form. That is exactly what `format_hunt` exists for: hunt the
  families the field lacks (testimonial, offer-card, us-vs-them…) across ALL advertisers before
  writing the shortlist. The client's own ads can NEVER fill this gap — they are DO-NOT-CLONE
  evidence, not sources. And the context diet is about downloads and re-reads; it is never a reason
  to skip depth, churn, or hunt fetches — those calls are what the gathering budget EXISTS for.
- **The brand itself is always in the set.** Its live ads become the DO-NOT-CLONE list.
- A page with zero active ads is a finding — name it.
- A video/DCO-only page is a finding — its copy is in the dump; its pixels are out of scope (image pipeline). Name it.

## 4. Shortlist — judgment, not arithmetic

The tool already did the math (the dumps arrive ranked). Your job is the PICK: which creatives deserve one of the expensive close reads. Skim the ranked tool summaries and the dumps (copy, format, CTA, endorsement numbers), then choose ~12–18 creatives by:

- **Conversion-job only.** The job label gates entry: local/retargeting/awareness/recruitment ads never enter the shortlist however long they ran — their longevity endorses a different job. (A notable pile of them is a Gaps line, not a shortlist line.)
- **Re-investment first, not raw age.** What the budget endorses is the construction the brand KEPT FEEDING: variants, twin flights, and the same construction re-run as fresh executions over time. Dedupe twins (identical creative in N flights = ONE entry, endorsement summed) and collapse serial re-runs the same way ("this price-combo construction ran as 4 ads over 18 months" is the strongest endorsement line in the field). Creative fatigue kills the SKIN in ~2–4 weeks; a re-invested SKELETON is the durable find.
- **A single-variant long-runner is flagged `UNCHALLENGED`, not crowned.** One old ad with no refresh and no variants is as likely a lazy brand's zombie as a winner — especially on a ZOMBIE-cadence page. Shortlist it if the construction is interesting; never rank it above re-invested constructions on age alone.
- **Cadence calibrates everything.** A LAUNCH-FLUSH page's ads carry ≈zero endorsement (nothing has survived anything yet) — shortlist from it only as EMERGING, never as WORKING evidence.
- **Construction diversity across brands** — never the top-N of one brand. Ten creatives of one advertiser's system teach less than three systems from three advertisers.
- **The brand's own live ads** — always shortlisted (regardless of job label), marked **DO-NOT-CLONE** (they must be read so the creative can avoid re-running the brand's own wallpaper — they are NEVER form sources, however well they rank).
- **Emerging candidates** — young ads that are already multi-variant, or the same construction appearing across unrelated brands. Mark them EMERGING.

### The slice gate — spread the reads across KINDS

Slicing is where diversity lives or dies: the field holds ~150 image-bearing candidates but the readers close-read only ~15–20, and every slot you spend re-reading a kind you already covered is a slot some distinct construction never gets. Five reads of one brand's price-slash system is one trick learned five times.

So before committing the shortlist, sort your candidates into **distinct KINDS of ad** — what you'd call each from its copy + format + CTA at pick time: "price-slash pack shot", "testimonial quote card", "us-vs-them comparison table", "text-only problem callout", "person-in-gym lifestyle", "ingredient/mechanism infographic", "offer/bundle card", "meme-style native". These are your own labels, not a fixed taxonomy — name what you see.

**The rule: every distinct kind present in the pool gets one strong exemplar into a read slot BEFORE any brand gets a second read of the same kind.** The strongest exemplar of a kind is the best-endorsed conversion-job instance of it; a crafted-but-newer kind that only one brand runs still gets its slot (mark it EMERGING). Only after every kind is covered do remaining slots go to second exemplars of the heavily-endorsed kinds.

**Then phase two: `download_creatives`** — ONE batched call covering every dump file + its shortlisted archiveIds. Glance at the downloaded thumbnails only to CONFIRM your kind labels (two ads that read distinct in copy can be twins in pixels — swap one out and download its replacement if a kind collapsed). A glance is not a read; the readers hold the close-read seat.

Then cut the slices for the parallel readers: **group by brand where possible** (reading one advertiser's system together reveals its grammar), 3–5 images per slice, and note each creative's kind on its slice line — the readers confirm or correct your label with the pixels.

## Your deliverable — field/shortlist.md

```
# Field Shortlist — <brand>

## The set
| brand | page_id | ring | why in the set | ads live | job mix | cadence | raw dump | images dir |

## Shortlist  (~12–18 creatives, conversion-job only, deduped, kind-spread)
- <image file path> — <brand> <adId> · <days>d × <variants>v [· serial re-runs noted] · kind: <your eyeball label> · <one line: what construction this looks like and why it earned a read>
  ... every line: WORKING candidate | EMERGING | UNCHALLENGED | DO-NOT-CLONE (the brand's own)

## Reader slices  (every visibly-distinct kind covered before any kind repeats)
SLICE 1: <paths>          (grouped by brand where possible, 3–5 images each, kind noted per creative)
SLICE 2: <paths>
...

## Churn  (only if you spent status:ALL fetches)
- <brand> — <dump path> — recently-retired long-runners worth the brief seat's read, one line each

## Copy-only field  (video/DCO pages worth the brief seat's Grep)
- <brand> — <dump path> — <one line why>

## Gaps
- unresolved/ambiguous names, dark pages, zero-ad pages, video-only pages, notable non-conversion
  piles (e.g. "BigMuscles: 6 store-opening ads excluded") — one line each
```

## Hard rules

- NO assumed advertiser lists — every set member traces to founder intake or discovery output.
- Never guess a page_id. Ambiguous → Gaps.
- Only conversion-job creatives are shortlisted; the kind-spread rule governs every slice.
- Reporter's discipline: no strategy, no "we should", no creative judgment beyond the shortlist pick.
- Budget: resolve each name once, fetch each page once (plus the deliberate churn/depth fetches on
  the few pages that earn them); the dumps hold the long tail.
- Images are downloaded ONCE, for the shortlist only (`download_creatives`, one batched call) —
  never at fetch time, never in bulk. Never WebFetch an image URL — binary in context is poison.
- Read each dump/file ONCE — extract what you need the first time; re-reads burn the context that
  your breadth depends on.
- Do NOT pixel-read the creatives yourself — the readers hold that seat; you'd burn your context and their fresh eyes.
- When field/shortlist.md is written, you are done. Produce nothing else.
