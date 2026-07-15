# TheRateFinder — what Canadian mortgage brands actually run on Meta

_Field pass, 2026-07-14. **137 live ads** pulled from the Meta Ad Library (country=CA, status=ACTIVE)
across 21 pages. Raw records: `../raw/ads/*.jsonl` · creatives: `../raw/images/<brand>/` ·
contact sheets: `../field/contact/<brand>.jpg`. Method: Perplexity discovery → resolve to Meta
page IDs → fetch active ads → read the pixels._

## Who is actually paying to advertise

| Lane | Brand | Active ads | Read |
|---|---|---:|---|
| **Rate** | nesto | 30 | Giant rate numeral, flat yellow, "1% Cashback" |
| **Rate** | True North Mortgage | 30 | **Best in field.** Humor + comparison + real proof |
| **Rate** | Ratehub.ca | 18 | Giant rate numeral, "Don't overpay" |
| **Rate** | Mortgage Alliance | 8 | "One Application. All the Options." |
| **Local** | Northwood Mortgage | 25 | Stock families, "SWITCH & SAVE!" — weakest |
| **Local** | Miracle Financial | 16 | **Most instructive.** Equity/debt-consolidation, fake-interactive |
| **Local** | 360Lending (Vaughan) | 6 | **Closest competitor.** "YOUR BANK vs 50+ LENDERS" + Trustpilot |
| **Local** | Pekoe Mortgages | 2 | "Freedom Formula" free-training hook — **178 days running** |
| **Approval** | Swivel Mortgage | 1 | Reverse/55+ · "All income and credit types considered" |
| **Approval** | CMI · Sunlite · GreenHouse · Zuzart · ApprovedByDustin · LendSimpl · Mortgage Squad | **0 each** | **Talk the "bank said no" game on their websites — buy zero Meta ads for it** |

> ✅ **CORRECTION (see `../field/client-ad-audit.md`).** An earlier draft of this file said TheRateFinder
> had no Meta page and no ad history. **That was wrong** — I searched the brand name, not the domain.
> Searching `theratefinder.ca` finds page **`419772311214719`** with **30 active ads running since April 2026.**
> They are *already advertising*, already in the commercial/investor lane, and the pixel is **not** cold.

## What the ads actually say (137 ads, counted)

| Angle | Ads | |
|---|---:|---|
| Rate / lowest / save | **109** | 80% of the entire field |
| Refi / switch / renewal | 30 | |
| Multi-lender vs. your bank | 27 | **occupied** |
| HELOC / debt consolidation | 25 | **occupied** |
| Speed / days-to-close | 10 | thin, mostly incidental |
| First-time buyer | 7 | |
| Bad credit / declined | 4 | near-zero — see the policy wall |
| Reverse / 55+ | 3 | |
| **Commercial / investor** | **1** | and that one is a consumer building a house |

## The three constructions worth stealing

**1. True North Mortgage — the only brand doing real creative.**
Not "here is our rate" but *constructions*: a physical **"Rate Relief" medicine box** (mortgage-as-product);
a **dachshund** for "Wow, that's LOW" (visual pun, scroll-stopping); a **comparison table** stacking big-bank
rates (5.49 / 5.49 / 6.09 / 5.49 / 7.55%) against their 2.49%; and a **Trustpilot 5/5 from 4,695 reviews**
placed beside the banks' 1-star rows. Real staff, real branch. Line of the field: *"It may be your first
home, but it's not ours."*

**2. Miracle Financial — the policy-safe way to sell a hard-money product.**
*"Five payments? Five due dates? One mortgage can replace them."* Then the careful part:
*"**If you own a home in Ontario with built-up equity**, debt consolidation may free up real breathing room."*
It conditions on an **asset**, never on hardship — that's what keeps it legal (see below). Plus a
**fake-interactive slider** ($175,000 with a drag handle), an amount grid ($50k→$700k+), and a comparison
visual (credit card **19.9% ↑** vs mortgage **4.99% ↓**). Best line: *"Your home equity is already yours.
**Is it working?**"* — the subject is the equity, not the person's failure.

**3. 360Lending — the closest thing to a direct competitor, and it's in Vaughan.**
- *"**YOUR BANK** vs **50+ LENDERS**"* — head-to-head, explicit.
- **Trustpilot Excellent, 1,299 reviews.**
- Testimonials carrying **real numbers**: *"provided stellar service in getting my HELOC approved. Was
  approved for **$160,000 in less than 2 weeks**." — Arian*
- *"If you are having trouble with typical mortgage brokers and lenders, give these guys a call." — Jon*

## ⚠️ The policy wall — why nobody says "bank said no"

Meta's **Personal Attributes** policy bans ad copy that asserts or implies knowledge of someone's financial
situation. Meta's own prohibited example is *"Are you struggling with debt?"*; *"For people dealing with
financial challenges"* is banned as an indirect implication.

**So "Bank said no?", "Bad credit?", "Declined?" are not clever — they're rejected.** That is why 8 brokers
who build their whole *website* around "approved when banks say no" buy **zero** Meta ads for it. It also
explains the borrower sentiment we found on Reddit:

> *"Every ad on Facebook is 'we got your bank decline approved!' It **screams predatory**."*
> *"The broker keeps saying 'trust me, I do this all the time.' Honestly that makes me **more nervous**."*

The ads that do sneak through break the norm, and borrowers read them as predatory.

**The workaround the good advertisers use — the SUBJECT SWAP.**
Describe **the lender's criteria or our capability**, never **the viewer's condition**:
- ❌ "Bad credit? Declined? We can help." → personal attribute → rejected *and* predatory
- ✅ "**All income and credit types considered**" (Swivel) → describes the lender's box
- ✅ "**If you own a home in Ontario with equity**…" (Miracle) → conditions on an asset
- ✅ "**Banks show you one option. We show you the market.**" (Mortgage Alliance) → describes the bank, not you

This is a hard creative law for this client, not a style note.

## Compliance, observed in the wild
**Northwood** stamps *"Licence #10349"* under its logo on **every** creative. **Swivel** runs a footer bar with
agent name, brokerage licence #, address, phone. This confirms the FSRA licence requirement in `../brief.md`
is real and visible in-creative. **Get TheRateFinder's licence # before rendering.**

## The one that should scare us
**Ratehub shows 3.45–3.94%. nesto shows 4.09%. True North shows 2.49%.**
**TheRateFinder's own site says "from 4.19%."**
If TheRateFinder enters the rate lane, it enters with **the worst number on the field** — against opponents
running 30 ads apiece. Do not fight there. (Verify the 4.19% with the client — it may be stale.)
