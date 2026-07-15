# TheRateFinder — Meta ad account access

Same pipe we built for Verbis: Meta's **official CLI** (`meta-ads` 1.1.0, on the `facebook_business` SDK,
Graph API v25). Already installed at `~/.venvs/meta-ads/bin/meta`. **Read-only** — we never write to the account.

## Setup (once) — I can't do this part, the token is yours

The token must never be pasted into chat or committed. Put it straight into a file only you and the CLI read:

```bash
mkdir -p ~/.meta-ads-theratefinder && chmod 700 ~/.meta-ads-theratefinder
cat > ~/.meta-ads-theratefinder/.env <<'EOF'
ACCESS_TOKEN=<token with ads_read scope>
AD_ACCOUNT_ID=act_XXXXXXXXXXXX
EOF
chmod 600 ~/.meta-ads-theratefinder/.env
```

**Where the two values come from:**
- **`AD_ACCOUNT_ID`** — open their Ads Manager; it's in the URL (`act_` + digits).
- **`ACCESS_TOKEN`** — [Graph API Explorer](https://developers.facebook.com/tools/explorer/): pick an app,
  add the **`ads_read`** permission, Generate Access Token, and make sure **TheRateFinder's ad account** is
  selected. That token is short-lived (~1–2 h) — fine for a one-off pull. For a standing dashboard, extend it
  to 60 days in the [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/)
  ("Extend Access Token").
- Scope is **`ads_read` only**. We do not need write access and should not have it.

**Verify:**
```bash
cd ~/.meta-ads-theratefinder && ~/.venvs/meta-ads/bin/meta auth status
```

## Pull everything
```bash
bash clients/theratefinder/scripts/meta-pull.sh          # → clients/theratefinder/meta/*.json
```
`meta/` is **gitignored** — it holds real spend data.

## What this answers that the Ad Library cannot

The public Ad Library showed us *what they run*. The ad account shows us **what it costs and whether it works.**
Straight at the open questions in `field/client-ad-audit.md`:

| Question | What proves it |
|---|---|
| **Is my "two-thirds can't convert" audit actually true?** | `campaigns.json` → **`objective`**, and `adsets.json` → **`optimization_goal`**. If they're `OUTCOME_ENGAGEMENT` / `POST_ENGAGEMENT` / `LINK_CLICKS`, the account is *literally optimising for the wrong thing*. If they're `OUTCOME_LEADS` / `OFFSITE_CONVERSIONS`, my audit is wrong and I'll say so. |
| **Is the pixel installed and firing? On what event?** | `datasets.json` |
| **What does an application actually cost today?** | `insights_account.json` → `actions` + `cost_per_action_type` |
| **Which of the 30 ads actually convert?** | `insights_by_ad.jsonl` — per-ad spend vs actions. **Does the $2.2M trucking ad convert?** If proof is already winning on their own money, that settles the creative direction with their data, not my opinion. |
| **How much money is the news/ragebait content burning?** | per-ad spend, cross-referenced against the audit's classification |
| **Where does the funnel break?** | impressions → `inline_link_clicks` → `landing_page_view` → lead/application |
| **Where is spend going?** | `bd_platform` / `bd_position` / `bd_device` |

> The Verbis lesson that applies hardest here: **never judge same-day — attribution lags.** On Verbis, one day
> read as 1 sale / 0.24× ROAS and settled overnight to 3 sales / 0.67×. Pull, then re-pull.

## Once we have it
Mirror the Verbis reporting pipe: `RESULTS.md` = live dashboard (append one Evolution row per pull) and
`SESSION_LOG.md` = dated frozen archive. Never overwrite; each pull appends to both.
