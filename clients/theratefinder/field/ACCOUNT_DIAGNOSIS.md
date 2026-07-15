# TheRateFinder — the real diagnosis (from their Meta ad account)

_2026-07-14. Pulled read-only from `act_744787094857765` via the official Meta CLI. Apr 1 → Jul 14 2026.
Raw: `../meta/*.json` (gitignored — real spend). **This supersedes the inferences in `client-ad-audit.md`,
which was built from the public Ad Library.**_

## Corrections I owe, up front
| I claimed (from the Ad Library) | The account says |
|---|---|
| "Two-thirds of the account can't convert" | **Overstated.** 42% of *spend* is on engagement; 58% is on conversion objectives. (At the *ad-set* level the two-thirds holds: 22 of 34 ad sets optimise for something that isn't a lead.) |
| "Is the pixel even firing?" | **It is.** `offsite_conversion.fb_pixel_lead` = 15, `complete_registration` = 8. |
| "Cold pixel / no ad history" | **Wrong.** ~3.5 months of history, $1,876 spent, 136 ads. |

**The account is not broken. It is half-working — and the working half is very good.**

## Account totals (Apr 1 → Jul 14)
| | |
|---|---:|
| Spend | **$1,876 CAD** |
| Impressions / Reach | 113,290 / 62,883 (freq 1.80) |
| CTR | **1.93%** — healthy |
| Link clicks | 1,649 @ $0.86 |
| Landing-page views | 920 *(only 56% of clicks — a 44% drop worth investigating)* |
| **Leads** | **106 @ $17.70 blended** |
| — of which Meta instant-form | 91 @ $20.62 |
| — of which website leads | 15 @ $125.07 |
| **Completed registrations (the real application)** | **8 @ $234.50** |

## The finding: the split is perfectly clean
Every **"Leads"** ad converts. Every **"Engagement"** ad produces **zero**.

| Ad | Spend | Leads | CPL | CTR |
|---|---:|---:|---:|---:|
| Leads · Bridge Term Loan | $122 | **16** | **$8** | 3.7% |
| Leads · Term Loan | $82 | **13** | **$6** | **4.1%** |
| Leads · Construction Financing | $44 | **12** | **$4** | 3.4% |
| Leads · Business Loan 75% | $135 | **12** | $11 | 2.5% |
| Leads · Construction Financing 85 | $109 | **12** | $9 | 2.7% |
| Leads · Private 5.99% | $63 | 7 | $9 | 2.5% |
| Engagement · Receivership | $70 | 0 | — | 1.1% |
| Engagement · **Business Loan 2.2M** | $40 | 0 | — | 0.9% |
| Engagement · Dog Construction | $50 | 0 | — | **0.0%** |
| Engagement · Toronto Land / KitKat / passport / "Ultimate Loser" | ~$180 | 0 | — | <1% |

> **34 zero-lead ads are burning $948 — 52% of all spend.**
> The engagement campaigns bought **14,053 post reactions at 13¢ each.** Cheap likes. Zero business.

## ⚠️ The trap: the $2.2M story ad did NOT fail
`TRF_Post Engagement Business Loan 2.2M` — the *"$2.2M to buy a 50-year-old trucking company"* creative,
the strongest thing in the account — shows **0 leads.** It is tempting to conclude the story angle doesn't work.

**That conclusion would be wrong.** It ran in a **Post Engagement** campaign. Meta was never asked to find
people who would convert — it was asked to find people who would tap "like," and it did. Comparing it to
lead-optimised ads is apples-to-oranges. **The story creative has never been given a fair test.**

That makes it the single highest-value experiment on the board: **run it on a LEAD objective.**

## What their own money proves about strategy
**Every winning ad is a commercial / investor product** — bridge, construction, term loan, business
acquisition, private. That is precisely the lane the competitor scan found **empty (0 of 137 competitor ads)**.
The field analysis and the P&L agree: **the commercial lane is uncontested and it converts.** Their instinct
was right; nobody is fighting them there.

## 🔴 The one number we still don't have — and it decides everything
The cheap leads ($4–$11) are **Meta instant-form** leads. In mortgages these are notoriously low quality —
a form fill is not an application. The **real** applications are the **8 completed registrations at $234.50**.

**Ask the client:** of the **106 leads**, how many became real conversations? How many became applications?
How many **funded**? And what is a funded deal worth in commission?

Without that denominator, "$8 CPL" may be a mirage — and we could scale the wrong thing. With it, we can
compute the true CPA ceiling and know whether $234/application is a bargain or a disaster. *(On a typical
residential deal at ~1% of loan value, one funded $500k mortgage ≈ $5,000 — which would make $234
extraordinarily cheap. On commercial, more. But this must be confirmed, not assumed.)*

## What to do (in order)
1. **Stop the engagement bleed.** $948 / 52% of spend is producing zero leads. Move it into the Lead Gen
   campaigns. At the observed $8–$11 CPL that alone is worth roughly **+90–120 leads for the same money.**
2. **Give the story creative a fair test.** Put the $2.2M trucking ad — and the funded-deal "receipt"
   construction generally — on a **LEAD objective**, head-to-head against the current offer ads.
3. **Scale the proven winners:** Bridge Term Loan ($8, 3.7% CTR), Term Loan ($6, 4.1%), Construction
   Financing ($4). These are already working and are under-funded.
4. **Fix the click→landing leak** — only 920 of 1,649 clicks became landing-page views. 44% vanish. Walk the
   funnel on a phone, in the Instagram in-app browser. *(On Verbis a broken checkout cost us days of spend
   before anyone noticed.)*
5. **Get the lead-quality denominator** (above) before we scale anything.
