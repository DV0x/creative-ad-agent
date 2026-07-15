#!/usr/bin/env bash
# TheRateFinder — full read-only pull from their Meta ad account.
#
# SETUP (once) — the token NEVER goes in the repo:
#   mkdir -p ~/.meta-ads-theratefinder && chmod 700 ~/.meta-ads-theratefinder
#   cat > ~/.meta-ads-theratefinder/.env <<'EOF'
#   ACCESS_TOKEN=<token with ads_read scope>
#   AD_ACCOUNT_ID=act_XXXXXXXXXXXX
#   EOF
#   chmod 600 ~/.meta-ads-theratefinder/.env
#
# RUN:  bash clients/theratefinder/scripts/meta-pull.sh
# OUT:  clients/theratefinder/meta/*.json   (gitignored — real spend data)
set -uo pipefail

META="$HOME/.venvs/meta-ads/bin/meta"
ENVDIR="$HOME/.meta-ads-theratefinder"
OUT="$(cd "$(dirname "$0")/.." && pwd)/meta"
SINCE="${SINCE:-2026-04-01}"          # they've been live since ~24 Apr 2026
UNTIL="${UNTIL:-$(date +%F)}"

[ -f "$ENVDIR/.env" ] || { echo "✗ missing $ENVDIR/.env — see SETUP at the top of this file"; exit 1; }
mkdir -p "$OUT"
cd "$ENVDIR" || exit 1                 # the CLI reads ACCESS_TOKEN/AD_ACCOUNT_ID from ./.env

j() { "$META" -o json ads "$@" 2>/dev/null; }
save() { local f="$1"; shift; echo "  → $f"; j "$@" > "$OUT/$f"; }

echo "▸ auth"; "$META" auth status 2>/dev/null | grep -vi token

echo "▸ STRUCTURE — what are they actually optimising for?"
save account.json          adaccount get
# objective is the smoking gun: OUTCOME_ENGAGEMENT/TRAFFIC = can't convert. OUTCOME_LEADS/SALES = can.
save campaigns.json        campaign list --limit 200 \
  --fields name,objective,status,effective_status,daily_budget,lifetime_budget,buying_type,created_time,start_time,stop_time
# optimization_goal is the REAL tell at the ad-set level:
#   POST_ENGAGEMENT / LINK_CLICKS / REACH  → optimising for the wrong thing
#   OFFSITE_CONVERSIONS / LEAD_GENERATION  → actually chasing applications
save adsets.json           adset list --limit 200 \
  --fields name,optimization_goal,billing_event,bid_strategy,daily_budget,promoted_object,destination_type,status,effective_status,campaign_id
save ads.json              ad list --limit 300 \
  --fields name,effective_status,status,creative,tracking_specs,adset_id,campaign_id,created_time

echo "▸ THE PIXEL — is it firing, and on what event?"
save datasets.json         dataset list

echo "▸ PERFORMANCE ($SINCE → $UNTIL)"
# NOTE: this CLI has no --level flag — per-campaign / per-ad means looping the IDs (same as Verbis).
F=spend,impressions,reach,frequency,ctr,cpm,cpc,inline_link_clicks,actions,action_values,cost_per_action_type
save insights_account.json    insights get --since "$SINCE" --until "$UNTIL" --fields "$F"
save insights_daily.json      insights get --since "$SINCE" --until "$UNTIL" --fields "$F" --time-increment daily

echo "▸ per-CAMPAIGN (loop)"
python3 -c "
import json,sys
d=json.load(open('$OUT/campaigns.json'))
rows=d.get('data',d) if isinstance(d,dict) else d
print('\n'.join(f\"{r['id']}\t{r.get('name','')}\" for r in rows if r.get('id')))
" 2>/dev/null | while IFS=$'\t' read -r cid cname; do
  [ -z "$cid" ] && continue
  echo "    · $cname"
  j insights get --since "$SINCE" --until "$UNTIL" --fields "$F" --campaign-id "$cid" \
    | python3 -c "import json,sys;d=json.load(sys.stdin);print(json.dumps({'campaign_id':'$cid','name':'''$cname''','insights':d}))" \
    >> "$OUT/insights_by_campaign.jsonl" 2>/dev/null
done

echo "▸ per-AD (loop — this is what tells us which of the 30 ads actually convert)"
: > "$OUT/insights_by_ad.jsonl"
python3 -c "
import json
d=json.load(open('$OUT/ads.json'))
rows=d.get('data',d) if isinstance(d,dict) else d
print('\n'.join(f\"{r['id']}\t{r.get('name','')}\" for r in rows if r.get('id')))
" 2>/dev/null | while IFS=$'\t' read -r aid aname; do
  [ -z "$aid" ] && continue
  j insights get --since "$SINCE" --until "$UNTIL" --fields "$F" --ad-id "$aid" \
    | python3 -c "import json,sys;d=json.load(sys.stdin);print(json.dumps({'ad_id':'$aid','name':'''$aname''','insights':d}))" \
    >> "$OUT/insights_by_ad.jsonl" 2>/dev/null
done
echo "    → $(wc -l < "$OUT/insights_by_ad.jsonl" | tr -d ' ') ads"

echo "▸ BREAKDOWNS — where is the money going?"
save bd_platform.json      insights get --since "$SINCE" --until "$UNTIL" --fields "$F" --breakdown publisher_platform
save bd_position.json      insights get --since "$SINCE" --until "$UNTIL" --fields "$F" --breakdown platform_position
save bd_device.json        insights get --since "$SINCE" --until "$UNTIL" --fields "$F" --breakdown device_platform

echo "▸ Meta's own recommendations"
save guidance.json         guidance list

echo
echo "✓ done → clients/theratefinder/meta/"
echo "  Next: python3 clients/theratefinder/scripts/meta-report.py"
