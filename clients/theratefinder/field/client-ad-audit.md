# TheRateFinder — audit of their OWN 30 live ads

_2026-07-14. **This corrects an earlier error in this workspace.** My first pass searched the Meta Ad
Library for "TheRateFinder", got only junk pages, and I wrote down "no Meta page, no ads, cold pixel."
**Wrong.** Searching the *domain* (`theratefinder.ca`) finds them immediately:_

> **Page `419772311214719` — "TheRatefinder" · Mortgage Brokers · ig=theratefinder.ca**
> **30 active ads, running since at least 24 April 2026.** Not a cold pixel — ~3 months of history.

Raw: `../raw/ads/CLIENT-theratefinder.jsonl` · creatives: `../raw/images/CLIENT-theratefinder/` ·
contact sheet: `contact/CLIENT-theratefinder.jpg`

---

## The headline: they are in the RIGHT lane, running the WRONG form

The competitor field pass found **0 of 137** competitor ads targeting a commercial or investor borrower.
TheRateFinder is **already there** — multiplexes, bridge, construction, business acquisition, private.
**Their strategic instinct is right and the lane is genuinely uncontested.** That is real and valuable.

The problem is not *what lane*. It's that most of the ads **cannot convert by construction.**

## What the 30 ads actually are

| Type | Ads | |
|---|---:|---|
| **Brand / engagement** | **18** | incl. *"9 'totally accidental' ragebait ideas you can use on your mortgage broker"* |
| **News / market commentary** | **7** | GDP, Mark Carney "technical recession", U.S. tariffs / Ssense, an Edmonton receivership |
| **Direct-response (carries an offer)** | **4** | ← the only ads that can produce an application |
| Mixed (offer buried in a news wrapper) | 1 | |

## The conversion plumbing is broken

| | |
|---|---:|
| Ads with **no call-to-action button** | **7 / 30** |
| Ads with **no destination link at all** | **7 / 30** |
| Ads pointing at **`fb.me`** (a Facebook shortlink — these are **boosted posts**, not conversion ads) | **12 / 30** |
| Ads pointing at **theratefinder.ca** | **11 / 30** |
| Video-only ads | 14 / 30 |

> **Only 11 of 30 ads can even theoretically produce an application.** The client's stated goal is
> conversions. Roughly two-thirds of the account is buying reach, engagement, and thought-leadership.
> A post explaining Q1 GDP revisions does not generate a mortgage application, no matter how good it is.

**This is the single biggest conversion lever, and it costs nothing to pull.** Before we make one new
creative: stop boosting posts, put a real CTA and a real destination on every ad, and point them at the
conversion flow.

## The good news: their best ad already exists

**"$2.2M TO BUY A 50-YEAR-OLD TRUCKING COMPANY. New dad. Small-time operator. Recent immigrant."**
*"Betting on the Canadian dream. Inside a turbulent industry. Here's how it actually went."*

That is **exactly the "show the receipt" construction** — a real deal, a real number, a real person, a
story with a result. It is the strongest thing in the account and it is the template for everything else.
They have already proved they can make it. It just needs to be **the rule, not the exception** — and it
needs a CTA and a link.

Their other genuine DR ads already carry the goods:
- *"**ONTARIO MULTIPLEX OWNERS.** Stop overpaying private lenders for bridge loans."* — terms to 18 months,
  prime + 1, CMHC exit. **Names its buyer in the first three words** — exactly right for a Special Ad
  Category where Meta won't let us target.
- *"**BUYING A BUSINESS?** Still paying cash? **Fund up to 75%** of purchase price."* — prime + 2, OAC.
- *"Private residential from **5.99%** · **fees under 2%** · **24–48h closings** · **350+ lenders** · stated income."*

**Note: the "24–48h closing" claim is already live in their own ads.** So it's not a claim we'd be
inventing — but we still need the client to confirm it's operationally true before we build a campaign on it.

## What's actively hurting

1. **Half the budget buys engagement, not applications** — GDP charts, Carney, tariffs, receiverships.
   Good content marketing. Not conversion advertising. If the goal is conversions, this is the leak.
2. **The "ragebait" ads** (*"9 ragebait ideas you can use on your mortgage broker"*) are engagement farming.
   They attract people who want to argue, not borrow.
3. **No visual system.** A bull standing in snow. A golden retriever in an armchair. An AI-fantasy figure
   holding up a bridge. Stock news photos of Mark Carney. Nothing looks like it came from the same company —
   so nothing compounds into brand memory.
4. **No licence # on any creative.** Northwood and Swivel both stamp theirs in-image. We should too
   (`../brief.md` — likely an FSRA requirement).

## The revised job
They don't need a new strategy. They need their **existing, correct strategy executed as direct response**:
1. **Fix the plumbing** (CTA + real link on every ad; stop boosting posts). Free, immediate.
2. **Make the funded-deal receipt the workhorse** — the trucking-company ad is the proof it works.
3. **Kill or de-fund the news/ragebait content** while the goal is conversions.
4. **Give it one visual system** so the ads compound instead of looking like 30 different companies.
