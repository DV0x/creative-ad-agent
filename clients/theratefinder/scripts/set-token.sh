#!/usr/bin/env bash
# Update TheRateFinder's Meta token from the CLIPBOARD, without it ever hitting the terminal.
#
# WHY: extending a token to 60 days needs a Facebook password re-auth, which is a "sensitive
# action" and gets spam-throttled. Generating a FRESH short-lived token in the Graph API
# Explorer needs NO password and is NOT throttled — so that's the reliable path.
#
# HOW (~30 seconds):
#   1. https://developers.facebook.com/tools/explorer/
#      App = "Ads" · User Token · permission = ads_read
#   2. Click "Generate Access Token", then the copy icon next to the token.
#   3. bash clients/theratefinder/scripts/set-token.sh
#   4. bash clients/theratefinder/scripts/meta-pull.sh
#
# The token is read straight from the clipboard into the env file — never printed, never logged.
set -uo pipefail

ENVDIR="$HOME/.meta-ads-theratefinder"
AD_ACCOUNT="act_744787094857765"

TOK="$(pbpaste)"
case "$TOK" in
  EA*) ;;
  *) echo "✗ The clipboard doesn't contain a Meta token (should start 'EA')."
     echo "  Copy it from the Graph API Explorer first, then re-run."; exit 1;;
esac

mkdir -p "$ENVDIR"; chmod 700 "$ENVDIR"
umask 077
printf 'ACCESS_TOKEN=%s\nAD_ACCOUNT_ID=%s\n' "$TOK" "$AD_ACCOUNT" > "$ENVDIR/.env"
chmod 600 "$ENVDIR/.env"
echo "✓ token written to $ENVDIR/.env (${#TOK} chars, not printed)"

# verify: is it valid, when does it die, and can it see the account?
curl -s "https://graph.facebook.com/v23.0/debug_token?input_token=$TOK&access_token=$TOK" \
  | python3 -c "
import json,sys,datetime
d=json.load(sys.stdin).get('data',{})
if not d.get('is_valid'): print('  ✗ token is NOT valid'); raise SystemExit(1)
e=d.get('expires_at')
when='never' if e in (0,None) else datetime.datetime.fromtimestamp(e).strftime('%a %d %b, %H:%M')
print(f\"  valid ✓  type={d.get('type')}  expires: {when}\")
print(f\"  scopes: {', '.join(d.get('scopes') or [])}\")
"
curl -s "https://graph.facebook.com/v23.0/me/adaccounts?fields=id,name&access_token=$TOK" \
  | python3 -c "
import json,sys
rows=json.load(sys.stdin).get('data',[])
hit=[r for r in rows if r.get('id')=='$AD_ACCOUNT']
print('  sees theratefinder ✓' if hit else '  ✗ CANNOT see act_744787094857765 — wrong account or missing access')
"
echo
echo "Now run:  bash clients/theratefinder/scripts/meta-pull.sh"
