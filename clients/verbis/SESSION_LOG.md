# Verbis — Experiment Log

**What:** live Meta-ads experiment (real spend) → learn what converts + build the reporting pipe → port to the Creative Machines agent later.
**Isolation:** stays in `clients/verbis/` only. Not in CM product docs/memory.
**Files:** `RESULTS.md` = live dashboard + Evolution trend. This = dated frozen archive. Dates join them; each pull appends to both, never overwrite.

## STATUS / NEXT
- Campaign to **10 Jul** (workshop 11). Target **40–50 sales**.
- Latest (Jul 6): **18 sales · ₹11,284 · ₹627/sale · 1.10× · 19 abandoners · 49% close.** Jul 6 = best day (6 sales, 75% day-close). Checkout bug **fixed**. Detail + daily pattern: `RESULTS.md`.
- Pipe built (read-only Meta CLI). Re-pull cmd + campaign/ad IDs in `RESULTS.md` §6.
- **▶ NEXT:** (1) **watch the reel to the ₹1,000–1,500 read-point** — retention weak (3s avg, 42s too long), 0 sales on ₹760; if still 0 → cut a 10–15s version, offer up front. (2) **Fix retargeting** objective LPV→purchase + cap freq (9.6) + widen pool. (3) Keep the fixed prospecting funnel running. Ad changes user-side (token read-only); Claude built the reel via Chrome + tracks.

## Session entry template (newest at bottom)
Keep the **snapshot + dimension lines tight** — fixed and comparable across sessions (the anti-drift part). **Observations can be as detailed as the session warrants** — that's the actual learning, and each session's will differ. Go deep there.
```
### YYYY-MM-DD — Session N · <focus>
**Snapshot:** spend · sales · CPA · ROAS · begCO/abandoners · close%      ← keep to 1 line
**Δ + dimension moves:** <what shifted; any ⚪→✅/❌>                        ← tight
**Did / decided:** <bullets>
**Observations:** <free-form, go deep — what you saw, hypotheses, surprises, what you tried, qualitative reads, creative/copy notes>
**▶ Port to CM agent:** <if any>
```

---

## 2026-07-04 — Session 1 · setup + first read + built the tracking system

**Snapshot:** 6 sales · ₹2,901 · ₹483 CPA · 1.62× ROAS · 15 begCO (9 abandoners) · 40% close. _(baseline pull; attribution rose 4→5→6 within the session.)_

**Did / decided:**
- Built the read-only Meta reporting pipe (CLI), pulled account + per-ad funnel, mapped all 7 renders, stood up the RESULTS dashboard + this log.
- Decided (all user-side — token is read-only): cut a1 (cold) · scale proofwall · one ad set · step-scale budget · widen audience · +b2 variants · deadline creative 8–10 Jul · retarget the 9 abandoners (separate budget) · fair-test the starved four.

**Observations (the learning):**
- **a1-reframe is an "intent trap," not a dead ad — the sharpest finding.** On sales alone it reads "0, kill it." The full funnel says the opposite: it's the *worst* at cheap attention (lowest CTR 0.97%, priciest clicks ₹32, priciest CPM ₹315) yet drives the *highest* checkout-start rate of any creative (**23%** LPV→checkout, ~2× b2's 11%) — then closes **0%**. Hypothesis: the ₹2,999→₹589 "80% off" framing pulls deal-motivated clickers who eagerly hit "buy" and then flinch at the real ₹589. If so the fix isn't the image — it's dropping the discount-anchor framing, or nudging those 5 at the pay step (retarget / WhatsApp). Testable next round.
- **proofwall is a hidden efficiency winner Meta starved.** 5.71× ROAS, ₹155 CPA, best close (67%), cheapest CPM + clicks — on only ₹309, while Meta poured ₹1,608 into b2 and ₹841 into a1 (0 sales). Read: Meta's optimizer funds what it can *spend into* (volume/reach), not necessarily what converts best per rupee. "Which creative Meta funds" ≠ "which is most efficient." Manually scaling proofwall is the clearest edge on the table.
- **The bottleneck is the page, not the creative.** ~2% CTR + cheap clicks = the ads do their job; the drop is LPV→checkout (~13%) and **9 of 15 abandon at pay**. The whole experiment's ceiling is capped by the landing page/checkout — real creative wins can be masked by a leaky page. Worth a parallel page/checkout test.
- **We've tested *execution*, not the full matrix.** Meta starved 4 of 7 (₹17–84 each) — deadline, single-scorecard, value-stack, testimonial never got a fair shot. So the proven learning is narrow (lean call-out + native proof win; busy discount loses); the other hooks/formats/copy are **untested, not beaten**. At low volume Meta's auto-optimization blocks a fair test — forcing delivery (separate ad sets) is required to actually learn dimension winners.
- **Method: identify creatives by image, never by name.** I first mis-mapped the winner (assumed b2-callout wasn't running / the winner "wasn't in the folder") by reasoning from concept names — wrong; it was b2-callout, all 7 live 1:1. Only viewing each image fixed it.
- **Attribution is fluid** — purchases rose 4→5→6 against the same spend within the session. Any single snapshot understates; the dated Evolution rows are the honest read.

**Dimension scorecard (frozen Jul 4):**
- Hook ✅call-out ✅proof · ❌generic-reframe · ⚪deadline/valuestack/socialproof/scorecard
- Format ⚠️poster = mixed (b2 won / a1 lost → **not** the driver) · ✅doc-flatlay/no-face (proofwall) · ⚪testimonial/desk-scene/checklist
- Style ✅lean ✅native/proof-led · ❌busy/discount-led
- Copy ✅call-out-Q ✅results-claim · ❌generic+discount-anchor · ⚪story/stakes/offer-math/testimonial
- (4/7 starved → untested ≠ beaten. **Confound:** b2 vs a1 differ on hook + style + copy at once → win is construction-level, not yet isolated to one dimension.)

**▶ Port to CM agent:** conversion-spine validated on real money (call-out+lean+proof > designed-poster+value-stack) · tag performance by MOVE (hook×format×style×copy), not per-creative · "intent that closes" > "most intent" (close-rate is the signal; checkout-starts can be vanity) · starved = untested, not bad · read-only Meta CLI = the loop-closing pipe.

**Setup reference (one-time):**
- CLI = **`meta-ads`** (PyPI, `facebook` acct — NOT third-party `meta-ads-cli`). Installed `~/.venvs/meta-ads` (Py 3.13).
- Read-only token: sys-user **`verbisdata`** (Creative Machines BM) · app **"Verbis Reporting"** (`1053397467077531`) · scope **`ads_read`** · View-perf on `act_997193333127180`. Token `~/.meta-ads-verbis/.env` (600, never commit).
- Gotchas: sys-user name lowercase/no-spaces · portfolio needs a dev app first · sys-user needs an **app role** before token scopes show · app-create triggers **password re-auth** (user does) · token shown once.
- Ad IDs (`--ad-id`): b2-callout `120245918635130476` · proofwall `120245918635110476` · a1-reframe `120245916271300476` · b3-scorecard `120245918635140476` · a2-deadline `120245918635120476` · c4-valuestack `120245918635100476` · b4-social-proof `120245918635150476`.

---
_New dated entries append below, newest at bottom, using the template above._

---

## 2026-07-05 — Session 2 · first re-pull · the scale-up read

**Snapshot:** 10 sales · ₹7,420 · ₹742 CPA · 1.03× ROAS · 27 begCO (17 abandoners) · 37% close. _(Jul 5 is a partial day — spend nearly full but sales lag attribution; today's 1 sale will rise. Cumulative Jul 2–5.)_

**Δ + dimension moves:** Spend ~2.5×'d (₹2,901→₹7,420) but **efficiency broke**: CPA ₹483→₹742, ROAS 1.62×→1.03× (break-even). **No new dimension verdict** — the planned "fair-test the starved four" did NOT happen; client instead **paused** a1/a2/c4/b4 and kept b2+proofwall+b3 active. a1's ❌ **hardened** (38% CO-start, 11% close). Matrix otherwise unchanged (deadline/valuestack/social/scorecard still ⚪ untested — b3 nominally active but Meta starves it ₹24).

**Did / decided (all user-side):**
- Client **paused a1-reframe** (✓ Session-1 rec) + a2-deadline + c4-valuestack + b4-social. Active prospecting = **b2, proofwall, b3-scorecard**.
- Client **scaled budget ~2.5×/day** and **widened audience** (Jul 4 reach 2×'d to 8,455).
- Client **launched the retargeting campaign** ("PTE Retargeting – Warm", ₹300/day, custom-audience) — the Session-1 NEXT step. **But objective = OUTCOME_TRAFFIC / LANDING_PAGE_VIEWS, not conversions.**

**Observations (the learning):**
- **The scale-up broke efficiency — this is the whole story.** Daily ROAS: Jul 2 → 0.71× · **Jul 3 → 1.70× (peak)** · Jul 4 → 1.20× · Jul 5 → 0.29× (partial). As daily spend climbed, ROAS fell monotonically. Jul 4's audience-widening doubled reach (4,878→8,455) but **crashed CTR 2.07%→1.42%** — the extra reach was lower-quality. Jul 5 CPM spiked to **₹351 (highest of the run)** on collapsed reach (3,718) — rising cost per impression, fewer conversions. The account outran its converting audience.
- **Meta funneled the new budget into b2-callout, which does NOT hold at scale.** b2 spend tripled ₹1,608→₹4,969 for only +2 sales → **each marginal sale cost ~₹1,680**; b2 cumulative ROAS fell to **0.95× (below break-even)**, close 57%→46%. This is the mechanism of the topline decline. The "balanced volume winner" is a **volume winner Meta can spend into, not an efficient one at scale.**
- **proofwall is STILL the best ad and STILL starved — the sharpest standing edge.** ₹284 CPA, **2.77× ROAS**, **75% close** (best), yet Meta gave it only ₹852 vs b2's ₹4,969. Session-1's "Meta funds what it can spend into (volume), not what converts per rupee" is **reconfirmed and sharper.** Honest correction: the "5.71×" was a 2-sale small-sample spike; at ₹852/3 sales it's 2.77× — still excellent, not magic. The clearest lever on the table: **force proofwall into its own ad set with real budget; cap/pause b2.**
- **a1 "intent trap" fully confirmed → pause was correct.** Before pausing it hit **38% LPV→checkout (highest by ~4×)** but **11% close** — 9 checkout-starts, 8 abandoners, 1 sale. It manufactures the most checkout-starts and the most abandoners per rupee. Dropping the ₹2,999→₹589 discount-anchor framing remains the untested fix.
- **Retargeting launched but mis-configured + too new to read.** Only ₹432 spent, **0 sales**, but **frequency 6.70 on a 98-person pool** (CPM ₹600–730) — it's hammering the warm audience ~7× in 3 days = fast fatigue. And it optimizes for **LANDING_PAGE_VIEWS, not purchase** — so Meta drives cheap clicks back to the page but doesn't push the abandoners over the pay line, which was the entire point (17 people stall at pay). Not the cause of the topline drop (it's tiny), but set up to underperform. Fix: conversion objective (or value-based), cap frequency, or widen the retarget window so the pool isn't 98 people.
- **The checkout page is still the ceiling — and the abandoner pool doubled.** 27 begin-checkout → 10 sales = **17 abandoners** (was 9). Close 37% cumulative. proofwall closes 75% and b2 46% on the same page → the leak is **traffic-quality-dependent** (discount-seekers from a1/b2-at-scale flinch at pay), but 17 stalled buyers is real lost revenue a good retarget could recover.
- **Pacing: target at serious risk.** 10 sales in 3.4 days ≈ **2.9/day and slowing**. 5 days left (Jul 6–10). At rate → **~24–25 total vs the 40–50 goal.** Hitting 40 needs **6/day**, 50 needs **8/day** — 2–3× the current pace while efficiency is *falling*. Step-change levers, not more of the same: (1) reallocate to proofwall, (2) fix/relieve the checkout leak (highest leverage — lifting close 37%→60% adds ~60% sales at zero extra spend), (3) fix the retarget to actually reconvert the 17.
- **Method note:** the mid-day-snapshot cadence of the Evolution table (pulls at ~1.4/2.4/3.4 days) means cumulative rows aren't clean day-boundaries; the **`--time-increment daily` view is the honest trend** and reconciles exactly to cumulative (spend/sales/begCO/value all tie out). Use daily for trend, cumulative for topline.

**▶ Port to CM agent:** "which creative Meta funds ≠ which converts" is now a **two-pull, hardening** signal — the optimizer chronically over-funds the spend-into-able volume ad and starves the per-rupee winner → any port must **force-test the efficient creative in its own budgeted cell, not trust auto-delivery.** · winners **decay with scale** (proofwall 5.7×→2.8×, b2 1.8×→0.95×) → judge creatives at their *funded* volume, not their starved small-sample spike. · retargeting needs a **conversion objective + frequency cap + a big-enough pool** or it just fatigues warm users. · the conversion ceiling is the **page**, not the creative — a creative eval that ignores post-click leak over-credits/blames the wrong layer.

---

## 2026-07-06 — Session 3 · the checkout bug, the recovery, + the reel launch

**Snapshot:** 18 sales · ₹11,284 · ₹627 CPA · 1.10× ROAS · 37 begCO (19 abandoners) · 49% close. **Jul 6 = best day (6 sales, 75% day-close).** _(Cumulative Jul 2–6.)_

**Δ + dimension moves:** The Session-2 "scale-up broke efficiency / page is the ceiling" read was **partly wrong** — the real culprit surfaced: a **checkout bug (in-app-browser payment timeouts)**, found + fixed Jul 5. Jul 6 (first clean day) recovered to the **best day of the run**. New surface tested: **first video / Reels ad** (claymation, 42.5s). No creative-dimension verdicts changed; the new axis is **format = video/Reels ⚪** (retention weak so far).

**Did / decided (all user-side; Claude tracked + built the reel via browser):**
- **Checkout bug found + fixed.** In-app-browser (FB/IG) payment step was timing out. Diagnostic: **100% of traffic is mobile-app** (desktop ₹34 total) → the bug hit ~every checkout; **63% begin-checkout→purchase drop-off** was the fingerprint. Client fixed it Jul 5.
- **Reel launched.** Token is read-only (all ad changes user-side), so Claude **built the campaign in Chrome via computer-use**: new **Advantage+ Sales** campaign "PTE Reel - Clay - 11 July", **₹1,500/day**, Website → **Purchase** (Verbis Edu web pixel), broad **India**, Advantage+ placements, **v2-final** video, **Book now** CTA, workshop URL, primary text + headline (Claude-written). Kept **Text improvements** on (user call); **Video touch-ups** intended off but toggle wouldn't persist; **AI-label** user turned off. Published → Active.

**Observations (the learning):**
- **The "is the algo spoiled?" scare was ATTRIBUTION LAG, not a spoiled algo — the week's biggest lesson, reinforced 3×.** Jul 5 read like **1 sale / 0.24× at 11pm** (looked catastrophic; user feared the payment timeouts had poisoned Advantage+'s purchase-optimization) → settled to **3 sales / 0.67× by morning**. Every real-time "crash" walked back overnight. **Never judge same-day; attribution fills 12–24h.** The honest nuance on "did timeouts spoil the algo": directionally the failed purchases *did* feed Advantage+ bad signal, BUT the algo was never well-fed anyway (~20 sales/wk << the ~50 Meta needs) — timeouts kicked an already-wobbly, under-fed optimizer, they didn't ruin a healthy one.
- **The checkout fix = the big unlock, and it re-frames Session 2.** Jul 6 first clean day → **best day (6 sales), day-close 75%** (vs ~40–50% before). So the "checkout page is the ceiling" conclusion was **a technical BUG, not a creative/traffic-quality ceiling** — now removed. The Jul 5 dip was the bug, not the ads.
- **Retargeting is waking up.** Now that pay works, warm abandoners convert (**1.6–2.2× the last 2 days**). Still mis-set (LPV goal not purchase, freq **9.6** on ~140 ppl) — fixing the objective + widening the pool would compound the wins.
- **Reel: retention is weak and settled — but that may not be the whole story.** **3s avg watch on a 42.5s video, 6% reach 25%, 1% finish**, rock-steady across ₹109→₹400→₹760. The length loses people before the offer. BUT it drives **cheap clicks** (CPM ₹323 < prospecting's ₹367; 27 clicks, 25 LPV, 1 begCO) — **the clickers are the value, not the watchers.** 0 sales on ₹760; verdict deferred to the ₹1,000–1,500 read-point. If still 0 → cut a **10–15s** version, offer front-loaded (NOT more budget). Flagged the 42s length as a risk *before* launch; the data is confirming it.
- **Method notes (browser automation to place a live ad):** hit real walls — 24MB video **> the 10MB upload-tool cap** (user did the file-pick; native picker can't be driven); the **duplicate-upload confusion** (both copies were the same v2-final; resolved by reading filenames via hover-tooltip); enhancement toggles are **finicky** (each needs an in-panel *Save* + confirm dialog; "Video touch-ups" never stuck). **AI-disclosure (2026):** research says AI-*video* should be disclosed + Meta auto-detects/can retro-flag → recommended checking it; **user chose to turn it off** (defensible for obvious claymation, low but non-zero risk).

**▶ Port to CM agent:** **A technical checkout/tracking bug can masquerade as an "algo" or "creative" failure** — before blaming the model, verify the funnel *mechanics* (pixel firing, checkout completing across devices). The in-app-browser payment failure + 100%-mobile blast radius is a classic. · **Attribution lag is a first-class eval hazard** — build any auto-eval on **settled (next-day) data**, never same-day; real-time reads systematically understate. · **Video/Reels retention (avg-watch, %-completion) is a fast, cheap leading indicator** — readable at ~₹400 before conversions accrue; if avg-watch << video length, the hook/length is the bottleneck. · low absolute conversion volume (< ~50/wk) means Advantage+ **never exits learning** — at that scale the optimizer is semi-guessing regardless; a higher-funnel optimization event may stabilize delivery.
