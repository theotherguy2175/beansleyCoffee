#!/usr/bin/env bash
# Prunes dated `vYYYY-MM-DD-HH-MM` tags of ccasteel/beansleycoffee on
# git.casteel.pw, keeping:
#   - every dated tag from the last 7 days (rolling window),
#   - the single newest tag that's already >=7 days old ("weekly" snapshot),
#   - the single newest tag that's already >=30 days old ("monthly" snapshot).
# The `latest` tag (what argocd-image-updater tracks) is never touched here —
# this script only ever looks at tags matching the dated version format.
set -euo pipefail

: "${GITEA_REGISTRY_TOKEN:?GITEA_REGISTRY_TOKEN must be set}"

OWNER="ccasteel"
PACKAGE="beansleycoffee"
BASE_URL="https://git.casteel.pw"
SEVEN_DAYS=$((7 * 86400))
THIRTY_DAYS=$((30 * 86400))
NOW_EPOCH=$(date -u +%s)

auth=(-H "Authorization: token ${GITEA_REGISTRY_TOKEN}")

pages_file=$(mktemp)
echo "[]" >"$pages_file"
page=1
while true; do
  chunk=$(curl -sf "${auth[@]}" "${BASE_URL}/api/v1/packages/${OWNER}?type=container&q=${PACKAGE}&page=${page}&limit=50")
  count=$(jq 'length' <<<"$chunk")
  jq -s '.[0] + .[1]' "$pages_file" <(echo "$chunk") >"${pages_file}.tmp" && mv "${pages_file}.tmp" "$pages_file"
  [ "$count" -lt 50 ] && break
  page=$((page + 1))
done

dated=$(jq --arg name "$PACKAGE" '
  [.[] | select(.name == $name) | select(.version | test("^v[0-9]{4}-[0-9]{2}-[0-9]{2}-[0-9]{2}-[0-9]{2}$"))]
' "$pages_file")
rm -f "$pages_file"

echo "Found $(jq length <<<"$dated") dated tag(s) for ${PACKAGE}."

# Ascending by age, so index [0] of any age-filtered subset is the newest
# member of that subset (closest to the threshold from above).
sorted=$(jq --argjson now "$NOW_EPOCH" '
  map(. + {age: ($now - (.created_at | fromdateiso8601))}) | sort_by(.age)
' <<<"$dated")

rolling=$(jq -c --argjson seven "$SEVEN_DAYS" '[.[] | select(.age < $seven) | .version]' <<<"$sorted")
weekly=$(jq -r --argjson seven "$SEVEN_DAYS" '[.[] | select(.age >= $seven)] | .[0].version // empty' <<<"$sorted")
monthly=$(jq -r --argjson thirty "$THIRTY_DAYS" '[.[] | select(.age >= $thirty)] | .[0].version // empty' <<<"$sorted")

keep=$(jq -c -n --argjson rolling "$rolling" --arg weekly "$weekly" --arg monthly "$monthly" '
  ($rolling + [$weekly, $monthly] | map(select(. != "")) | unique)
')

echo "Keeping: $keep"

jq -r '.[].version' <<<"$sorted" | while read -r v; do
  if jq -e --arg v "$v" 'index($v) != null' <<<"$keep" >/dev/null; then
    echo "keep   $v"
  else
    echo "delete $v"
    if curl -sf -X DELETE "${auth[@]}" "${BASE_URL}/api/v1/packages/${OWNER}/container/${PACKAGE}/${v}"; then
      echo "  deleted $v"
    else
      echo "  WARNING: failed to delete $v (continuing)"
    fi
  fi
done
