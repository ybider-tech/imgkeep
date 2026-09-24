#!/bin/sh
# Runs the tests, then zips extension/ into dist/imgkeep-<version>.zip for the Chrome Web Store.
set -eu
cd "$(dirname "$0")/.."

npm test

VERSION=$(node -p "require('./extension/manifest.json').version")
OUT="dist/imgkeep-$VERSION.zip"
mkdir -p dist
rm -f "$OUT"
(cd extension && zip -r -X -q "../$OUT" . -x '.*' -x '*/.*' -x '*.test.*' -x 'tests/*')
echo "Built $OUT"
unzip -l "$OUT"
