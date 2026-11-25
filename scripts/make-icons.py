#!/usr/bin/env python3
"""Copy the approved photographic flower exports. Standard library only (Pillow, if installed, for site/icon80.webp).

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
# The site header shows the icon at 30 to 40 CSS px: a small WebP (2x of 40) instead of the 128px PNG.
try:
    from PIL import Image
    Image.open(PACK / "imgkeep-website-icon-128.png").convert("RGBA").resize((80, 80), Image.LANCZOS).save(ROOT / "site/icon80.webp", "WEBP", lossless=True, method=6)
except ImportError:
    print("Pillow is not installed: site/icon80.webp was not updated.")
print("Updated extension, website and Edge flower icons.")
