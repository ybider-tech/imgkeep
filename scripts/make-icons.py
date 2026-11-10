#!/usr/bin/env python3
"""Copy the approved photographic flower exports. Standard library only.

Canonical exports live in store/icon-pack/. Keep the flower at every size;
never regenerate the previous illustrated mountain icon. The Chrome 128px
package icon has a 96px artwork box. Website assets use the fuller artwork.
"""
from pathlib import Path
import shutil
ROOT = Path(__file__).resolve().parents[1]
PACK = ROOT / "store/icon-pack"
for size in (16, 32, 48, 64, 128):
    shutil.copyfile(PACK / f"imgkeep-icon-variation-{size}.png", ROOT / f"extension/icons/icon{size}.png")
for source, target in (
    ("imgkeep-website-icon-128.png", "site/icon128.png"),
    ("imgkeep-icon-variation-32.png", "site/favicon.png"),
    ("imgkeep-apple-touch-icon-180.png", "site/apple-touch-icon.png"),
    ("imgkeep-edge-logo-300.png", "store/edge-logo-300.png"),
):
    shutil.copyfile(PACK / source, ROOT / target)
print("Updated extension, website and Edge flower icons.")
