#!/bin/sh
# Uploads dist/imgkeep-<version>.zip to the Edge Add-ons listing and submits it for review.
# Credentials live outside the repo in ~/.config/imgkeep/edge.env (EDGE_CLIENT_ID, EDGE_API_KEY, EDGE_PRODUCT_ID).
# Usage: sh scripts/edge-publish.sh --submit ["notes for certification"] | --upload-only
#   --submit       upload and submit for certification. Notes default to the "Notes for certification"
#                  block in store/edge-listing.md, so reviewers always get them.
#   --upload-only  replace the draft package but don't submit it (finish in Partner Center)
# With no option it only explains itself: nothing is uploaded or submitted unless you ask for it.
# Only the package is uploaded: descriptions and images are edited in Partner Center.
set -eu
cd "$(dirname "$0")/.."

ENV_FILE="$HOME/.config/imgkeep/edge.env"
API="https://api.addons.microsoftedge.microsoft.com/v1"

UPLOAD_ONLY=0
case "${1:-}" in
  --upload-only) UPLOAD_ONLY=1; shift ;;
  --submit) shift ;;
  *) sed -n '2,9p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
esac
NOTES="${1:-}"
if [ "$UPLOAD_ONLY" = 0 ] && [ -z "$NOTES" ]; then
  # The first text block after "## Notes for certification" in store/edge-listing.md.
  NOTES=$(awk '/^## Notes for certification/{f=1;next} f&&/^```text/{c=1;next} c&&/^```/{exit} c{print}' store/edge-listing.md)
  [ -n "$NOTES" ] || { echo "No notes found in store/edge-listing.md; pass them as an argument" >&2; exit 1; }
fi

[ -r "$ENV_FILE" ] || { echo "Missing $ENV_FILE" >&2; exit 1; }
# Read values literally (no sourcing): API keys can contain shell characters like & or #.
env_value() { grep -E "^$1=" "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '\r'; }
EDGE_CLIENT_ID=$(env_value EDGE_CLIENT_ID)
EDGE_API_KEY=$(env_value EDGE_API_KEY)
EDGE_PRODUCT_ID=$(env_value EDGE_PRODUCT_ID)
for k in EDGE_CLIENT_ID EDGE_API_KEY EDGE_PRODUCT_ID; do
  eval "v=\$$k"
  [ -n "$v" ] || { echo "$k is empty in $ENV_FILE" >&2; exit 1; }
done

VERSION=$(node -p "require('./extension/manifest.json').version")
ZIP="dist/imgkeep-$VERSION.zip"
[ -f "$ZIP" ] || { echo "No $ZIP. Run: sh scripts/package.sh" >&2; exit 1; }
ZIP_VERSION=$(unzip -p "$ZIP" manifest.json | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).version))')
[ "$ZIP_VERSION" = "$VERSION" ] || { echo "$ZIP contains $ZIP_VERSION, manifest says $VERSION" >&2; exit 1; }

# Prints the operation id from the Location header of a 202 response, or fails with the body.
start_operation() { # url, then curl args
  url=$1; shift
  hdr=$(mktemp); body=$(mktemp)
  code=$(curl -sS -o "$body" -D "$hdr" -w '%{http_code}' -X POST "$url" \
    -H "Authorization: ApiKey $EDGE_API_KEY" -H "X-ClientID: $EDGE_CLIENT_ID" "$@")
  op=$(grep -i '^location:' "$hdr" | tail -1 | sed 's/^[^:]*: *//; s/\r$//; s#.*/##')
  if [ "$code" != "202" ] || [ -z "$op" ]; then
    echo "Request failed (HTTP $code):" >&2; cat "$body" >&2; echo >&2
    rm -f "$hdr" "$body"; exit 1
  fi
  rm -f "$hdr" "$body"
  echo "$op"
}

# Polls an operation until it leaves InProgress; prints the final JSON and fails unless Succeeded.
wait_operation() { # url
  for _ in $(seq 1 60); do
    res=$(curl -sS "$1" -H "Authorization: ApiKey $EDGE_API_KEY" -H "X-ClientID: $EDGE_CLIENT_ID")
    status=$(printf '%s' "$res" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(JSON.parse(s).status||"")}catch{console.log("")}})')
    case "$status" in
      InProgress|"") sleep 5 ;;
      Succeeded) echo "$res"; return 0 ;;
      *) echo "$res" >&2; return 1 ;;
    esac
  done
  echo "Timed out waiting for $1" >&2; return 1
}

BASE="$API/products/$EDGE_PRODUCT_ID/submissions"

echo "Uploading $ZIP to Edge Add-ons draft…"
op=$(start_operation "$BASE/draft/package" -H "Content-Type: application/zip" --data-binary "@$ZIP")
wait_operation "$BASE/draft/package/operations/$op" >/dev/null
echo "Upload succeeded."

if [ "$UPLOAD_ONLY" = 1 ]; then
  echo "Draft updated, not submitted. Finish in Partner Center."
  exit 0
fi

echo "Submitting $VERSION for certification…"
payload=$(NOTES="$NOTES" node -e 'console.log(JSON.stringify({notes: process.env.NOTES}))')
op=$(start_operation "$BASE" -H "Content-Type: application/json" --data "$payload")
wait_operation "$BASE/operations/$op" >/dev/null
echo "Submitted $VERSION to Edge Add-ons. Microsoft review can take up to 7 business days."
