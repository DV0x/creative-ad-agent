# Verbis — Meta ads dashboard

_`act_997193333127180` · PTE ₹589 · runs to 10 Jul (workshop 11) · target **40–50 sales**. Numbers pixel-reported, shift as attribution fills in._
**Org:** this = live dashboard; `SESSION_LOG.md` = dated frozen archive. Each pull → append 1 Evolution row here + 1 dated log entry. Never overwrite.

## 1. Evolution (append per pull)
| as of | days | spend | sales | CPA | ROAS | begCO | close% | note |
|---|---|---:|---:|---:|---:|---:|---:|---|
| Jul 3 | 1.4 | ₹2,629 | 4 | ₹657 | 1.34× | 11 | 36% | launch; a1 busy/discount = 0 |
| Jul 4 | 2.4 | ₹2,901 | 6 | ₹483 | 1.62× | 15 | 40% | proofwall 2 sales (5.7× ROAS, starved); a1 still 0% close |
| Jul 5* | 3.4 | ₹7,420 | 10 | ₹742 | 1.03× | 27 | 37% | scaled ~2.5×/day → Meta funneled it into b2 (0.95× ROAS, break-even); a1 PAUSED ✓ (intent trap confirmed 38% CO-start / 11% close); proofwall still best (2.77×, 75% close) yet still starved ₹852 vs b2 ₹4,969; retarget campaign live but traffic/LPV goal, freq 6.7 on 98 ppl, 0 sales. *partial day, sales lag attribution |
| Jul 6 | 4.4 | ₹11,284 | 18 | ₹627 | 1.10× | 37 | 49% | **CHECKOUT BUG (in-app-browser payment timeouts) found + FIXED Jul 5** → Jul 6 = best day (6 sales, 75% day-close); the Jul 5 "crash" was mostly attribution lag (settled 1→3 sales overnight); retargeting converting now checkout works; **REEL launched** (own Advantage+ Sales campaign, ₹1,500/day, purchase-opt) — retention weak (3s avg watch, 1% finish; 42s too long), 0 sales on ₹760 so far |

## 1b. Daily trend (the pattern — per-day, NOT cumulative snapshots)
| day | spend | reach | cpm | ctr | begCO | sales | close | ROAS | what happened |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Jul 2 | ₹828 | 2,811 | ₹220 | 2.39% | 2 | 1 | 50% | 0.71× | launch (½ day) |
| Jul 3 | ₹2,081 | 4,878 | ₹266 | 2.07% | 12 | 4 | 33% | **1.70×** | peak — best early efficiency |
| Jul 4 | ₹2,458 | 8,461 | ₹212 | 1.42% | 9 | 4 | 44% | 1.20× | widened audience → reach 2×'d but CTR crashed (diluted) |
| Jul 5 | ₹2,625 | 4,583 | ₹346 | 1.77% | 6 | 3 | 50% | 0.67× | **checkout bug** (in-app-browser payment timeouts) suppressing conversions |
| Jul 6 | ₹3,290 | 5,800 | ₹360 | 1.60% | 8 | **6** | **75%** | 1.07× | **checkout FIXED → best day**; day-close jumped to 75%; reel launched (dilutes blended — core ex-reel ~1.4×) |

**Pattern:** launch → Jul 3 peak → Jul 4 audience-dilution dip → **Jul 5 checkout-bug crash** → **Jul 6 fix + recovery to best day.** ⚠️ **Attribution-lag lesson:** Jul 5 read like 1 sale / 0.24× in real-time (looked catastrophic) → settled to 3 sales / 0.67× overnight. Never judge same-day — attribution fills over 12–24h, and every real-time "crash" this week walked back by morning.

## 1c. Channels for leads (cumulative Jul 2–6)
| campaign | spend | **leads** | CPA | ROAS | note |
|---|---:|---:|---:|---:|---|
| **Prospecting** (Advantage+ Sales) | ₹9,661 | **17** | ₹568 | 1.22× | the workhorse — 94% of all leads. b2/proofwall/b3 active; a1 + 3 others paused |
| **Retargeting** (Traffic→LPV) | ₹874 | 1 | ₹874 | 0.67× | mis-set (LPV goal not purchase; freq **9.6** on ~140 ppl) — but converting *now* checkout works (1.6–2.2× last 2 days) |
| **Reel – Clay** (Advantage+ Sales) | ₹760 | 0 | — | — | launched Jul 6 mid-day — see below |

**Reel – Clay Algorithm** (video 42.5s · Advantage+ Sales ₹1,500/day · purchase-opt · CTA Book now · AI-label off): retention **weak + settled** across ₹109→₹400→₹760 → **3s avg watch, 6% reach 25%, 1% finish.** Drives *cheap clicks* (CPM ₹323, 27 clicks, 25 LPV, 1 begCO) but **0 sales on ₹760.** Read-point ₹1,000–1,500: if still 0 sales, the 42s length is the bottleneck → cut a **10–15s** version with the offer front-loaded (NOT more budget). The watchers aren't the value — the clickers are.

## 1d. Per-creative CVR + funnel (cumulative Jul 2–6 · **append per pull** · ranked by ROAS)
_CVR = sale ÷ click · L→CO = LPV→begin-checkout · close = begin-checkout→purchase. **ROAS lever = fund the cheapest-CLOSING creative, not the highest-CVR** — CVRs are similar; the ROAS gap is CPA-driven._
| creative | spend | clk | LPV | begCO | sales | CVR | L→CO | close | CPA | ROAS |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **proofwall** ✅ | ₹1,237 | 83 | 63 | 5 | 4 | 4.8% | 8% | **80%** | **₹309** | **2.38×** |
| **b2-callout** | ₹7,281 | 281 | 220 | 20 | 12 | 4.3% | 9% | 60% | ₹607 | 1.13× |
| RT-traffic *(retarget)* | ₹592 | 18 | 12 | 2 | 1 | 5.6% | 17% | 50% | ₹592 | 1.00× |
| a1-reframe ⏸ | ₹1,014 | 29 | 24 | 9 | 1 | 3.4% | **38%** | **11%** | ₹1,014 | 0.58× |
| Reel-Clay | ₹792 | 27 | 25 | 1 | 0 | 0% | **4%** | 0% | — | 0× |
| b3 / a2 / c4 / b4 / RT-proof90 | ₹24–289 | ≤6 | ≤5 | 0 | 0 | — | — | — | — | — *(starved/untested)* |

**Read:** proofwall = ROAS king (**2.38×, 80% close, ₹309 CPA**) on **1/6th** of b2's budget → **shift weight here.** b2 = volume at half the ROAS (Meta over-funds it). Reel's clicks are **low-intent** (4% L→CO vs 8–9% for winners). a1 = intent trap (paused). Same CVR across winners → efficiency comes from *close rate*, not click-rate.

**Daily close% / ROAS (funded creatives — watch the trend):**
| | Jul 2 | Jul 3 | Jul 4 | Jul 5 | Jul 6 |
|---|---|---|---|---|---|
| **b2** close / ROAS | 100% / 1.68 | 40% / 1.40 | 60% / 1.08 | 50% / 0.75 | **80% / 1.23** |
| **proofwall** close / ROAS | 0% / – | 100% / 8.1 | 0% / – | 100% / 1.09 | 100% / 1.97 |
_Checkout fix visible Jul 6: b2 close jumped 50%→80% (its best CVR day). proofwall closes ~100% whenever it sells._

## 2. Funnel now (Jul 6)
~40,000 impr → ~360 LPV → **37 begin-checkout → 18 sales** (49% close · 19 abandoners). Post-fix **Jul 6 day-close jumped to 75%** — the in-app-browser checkout leak (the true cause of the Jul 5 dip, not the ads) is largely resolved. _(begin-checkout includes buyers.)_

## 3. By creative (3 funded; other 4 starved ₹17–84, no read)
| | b2-callout | proofwall | a1-reframe |
|---|---:|---:|---:|
| spend | ₹1,608 | ₹309 | ₹841 |
| CPM | ₹256 | ₹169 | ₹315 |
| link CTR | 1.29% | 1.74% | 0.97% |
| cost/click | ₹20 | ₹10 | ₹32 |
| LPV | 64 | 22 | 22 |
| begin checkout | 7 | 3 | 5 |
| LPV→checkout | 11% | 14% | **23%** |
| sales | 4 | 2 | 0 |
| close | 57% | 67% | **0%** |
| CPA | ₹402 | ₹155 | — |
| ROAS | 1.83× | **5.71×** | 0× |

- **proofwall** = efficiency king, starved → **scale**. **a1** = intent trap (highest checkout-start 23%, 0% close — discount pulls deal-seekers who flinch at pay). **b2** = balanced volume winner.
- Rule: winners = intent that *closes*, not most intent.

## 4. Dimension scorecard (✅ working · ❌ losing · ⚪ untested — 4/7 starved = untested ≠ beaten)
| creative | Hook | Format | Style | Copy | sales |
|---|---|---|---|---|---:|
| b2-callout | call-out reframe | talking-head poster | lean · proof-badge | call-out Q + benefit CTA | 4 |
| proofwall | proof/results | doc flat-lay | native · no-face | concrete results claim | 2 |
| a1-reframe | reframe (generic) | talking-head poster | busy · discount-led | generic + ₹2,999→₹589 anchor | 0 |
| b3-scorecard | proof (single) | annotated doc | designed | story "65→83" | 0 |
| a2-deadline | deadline/stakes | native desk-scene | native · no-face | stakes "offer letter hostage" | 0 |
| c4-valuestack | value-stack | checklist sheet | native-designed | offer math "₹589→₹3,000" | 0 |
| b4-social-proof | social proof | testimonial card | designed | testimonial | 0 |

- **Hook** ✅call-out ✅proof · ❌generic-reframe · ⚪deadline/valuestack/socialproof/scorecard
- **Format** ⚠️talking-head poster = **mixed** (b2 won, a1 lost → format is **not** the driver) · ✅doc-flatlay/no-face (proofwall, efficient) · ⚪testimonial/desk-scene/checklist/annotated-doc
- **Style** ✅lean ✅native/proof-led · ❌busy/discount-led
- **Copy** ✅call-out-Q ✅results-claim · ❌generic+discount-anchor · ⚪story/stakes/offer-math/testimonial
- **⚠️ Confound:** b2 vs a1 differ on hook + style + copy *at once* (same format + face) → the win is a **construction-level** result; can't isolate which single dimension yet. Vary one at a time to pin it.

## 5. Strategy (→ 40–50 by 10 Jul · at 18 in 4.4 days ≈ 4/day; need ~5–6/day — a stretch, but the checkout fix improves the odds)
- ✅ **DONE:** checkout bug fixed (the big unlock — Jul 6 day-close 75%) · a1 paused · retarget campaign live · reel launched.
- **Keep the fixed funnel running** — prospecting is the workhorse (₹568 CPA, 1.22×); let clean-signal delivery ride, don't over-tinker.
- **Reel:** give to the ₹1,000–1,500 read-point; if still 0 sales + 3s retention holds → cut a **10–15s** version with the offer up front. Do NOT scale the 42s cut.
- **Fix retargeting:** switch objective **LPV→purchase**, cap frequency (9.6 is way too high), widen the pool (only ~140 ppl). Those abandoners convert now that pay works.
- **Scale plan (reel):** ₹1,500/day → ₹3,000/day only if CPA holds ≤₹800.
- Still open: fair-test the starved creatives (deadline / value-stack / social-proof) in own ad sets if chasing volume.

## 6. Re-pull
`~/.venvs/meta-ads/bin/meta` · token `~/.meta-ads-verbis/.env` (`ads_read`, never commit) · `AD_ACCOUNT_ID=act_997193333127180`. Creative ad IDs in `SESSION_LOG.md` Session 1.
```bash
# Account topline (bump --until to today):
cd ~/.meta-ads-verbis && ~/.venvs/meta-ads/bin/meta -o json ads insights get \
  --since 2026-07-02 --until 2026-07-06 \
  --fields spend,impressions,reach,frequency,ctr,cpm,inline_link_clicks,actions,action_values
# Daily PATTERN (§1b): add --time-increment daily
# Per channel (§1c): add --campaign-id <id>   Per ad: add --ad-id <id>
# Per-creative CVR (§1d): loop each creative --ad-id (+ --time-increment daily for the trend); then
#   CVR = purchase / inline_link_clicks · L→CO = initiate_checkout / landing_page_view · close = purchase / initiate_checkout
# Reel video retention: add fields video_play_actions,video_p25/p50/p75/p100_watched_actions,video_avg_time_watched_actions,video_thruplay_watched_actions
```
**Campaign IDs:** prospecting (Sales) `120245916271280476` · retargeting (Traffic) `120246099582570476` · **reel (Sales) `120246144891970476`**.
**Reel ad:** `Reel - Clay Algorithm` = `120246144891990476` (ad set `120246144891980476`).
