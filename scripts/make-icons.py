#!/usr/bin/env python3
"""Builds Imgkeep's icons from the designer's pack in store/icon-pack/.

- 48 and 128 px: copied from the pack as designed.
- 16 and 32 px: drawn here as simplified versions of the same design (frame, mountains and sun at 32,
  a bold download arrow), because the pack's detail blurs at those sizes. Standard library only:
  shapes are signed-distance functions, anti-aliased with 6x6 supersampling, written as RGBA PNGs.
- 300 px Edge Add-ons logo: the pack's master scaled down with macOS `sips` (skipped elsewhere).

Writes extension/icons/icon{16,32,48,128}.png, site/icon128.png, site/favicon.png (32 px)
and store/edge-logo-300.png."""

import math
import os
import shutil
import struct
import subprocess
import zlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PACK = os.path.join(ROOT, "store", "icon-pack")
GREEN = (18, 113, 102)  # the pack's green
WHITE = (255, 255, 255)


def png(w, h, rows):
    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    raw = b"".join(b"\x00" + bytes(r) for r in rows)
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )


def sd_round_rect(x, y, x0, y0, x1, y1, r):
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    hx, hy = (x1 - x0) / 2 - r, (y1 - y0) / 2 - r
    dx, dy = abs(x - cx) - hx, abs(y - cy) - hy
    return math.hypot(max(dx, 0), max(dy, 0)) + min(max(dx, dy), 0) - r


def sd_segment(x, y, ax, ay, bx, by):
    px, py, vx, vy = x - ax, y - ay, bx - ax, by - ay
    t = max(0.0, min(1.0, (px * vx + py * vy) / (vx * vx + vy * vy)))
    return math.hypot(px - vx * t, py - vy * t)


def in_triangle(x, y, a, b, c):
    def side(p, q, r):
        return (p[0] - r[0]) * (q[1] - r[1]) - (q[0] - r[0]) * (p[1] - r[1])

    d1, d2, d3 = side((x, y), a, b), side((x, y), b, c), side((x, y), c, a)
    return not ((d1 < 0 or d2 < 0 or d3 < 0) and (d1 > 0 or d2 > 0 or d3 > 0))


# Shapes in unit coordinates. "halo" is a green gap around the arrow, as in the pack's design.
SMALL = {
    16: dict(margin=0.0, radius=0.2, frame=(0.14, 0.2, 0.74, 0.7), frame_radius=0.07, frame_width=0.12,
             mountains=[], sun=None, arrow=(0.72, 0.44, 0.86, 0.2), arrow_width=0.17, halo=0.07),
    32: dict(margin=0.04, radius=0.2, frame=(0.18, 0.22, 0.76, 0.72), frame_radius=0.06, frame_width=0.08,
             mountains=[((0.25, 0.67), (0.39, 0.45), (0.53, 0.67)), ((0.43, 0.67), (0.53, 0.53), (0.63, 0.67))],
             sun=(0.6, 0.36, 0.055), arrow=(0.73, 0.5, 0.85, 0.15), arrow_width=0.11, halo=0.05),
}


def colour_at(x, y, p):
    m = p["margin"]
    if sd_round_rect(x, y, m, m, 1 - m, 1 - m, p["radius"]) > 0:
        return None  # outside the rounded square: transparent
    colour = GREEN
    d = sd_round_rect(x, y, *p["frame"], p["frame_radius"])
    if abs(d) <= p["frame_width"] / 2:
        colour = WHITE
    if d < 0:
        if any(in_triangle(x, y, *t) for t in p["mountains"]):
            colour = WHITE
        if p["sun"] and math.hypot(x - p["sun"][0], y - p["sun"][1]) <= p["sun"][2]:
            colour = WHITE
    ax, y0, y1, head = p["arrow"]
    dist = min(sd_segment(x, y, ax, y0, ax, y1), sd_segment(x, y, ax, y1, ax - head, y1 - head),
               sd_segment(x, y, ax, y1, ax + head, y1 - head))
    if dist <= p["arrow_width"] / 2 + p["halo"]:
        colour = GREEN
    if dist <= p["arrow_width"] / 2:
        colour = WHITE
    return colour


def render_small(size):
    p, ss, rows = SMALL[size], 6, []
    for py in range(size):
        row = []
        for px in range(size):
            r = g = b = hits = 0
            for sy in range(ss):
                for sx in range(ss):
                    c = colour_at((px + (sx + 0.5) / ss) / size, (py + (sy + 0.5) / ss) / size, p)
                    if c:
                        r, g, b, hits = r + c[0], g + c[1], b + c[2], hits + 1
            row += [round(r / hits), round(g / hits), round(b / hits), round(255 * hits / ss / ss)] if hits else [0, 0, 0, 0]
        rows.append(row)
    return png(size, size, rows)


def write(path, data):
    with open(path, "wb") as f:
        f.write(data)


if __name__ == "__main__":
    icons = os.path.join(ROOT, "extension", "icons")
    site = os.path.join(ROOT, "site")
    for size in (16, 32):
        write(os.path.join(icons, f"icon{size}.png"), render_small(size))
    for size in (48, 128):
        shutil.copyfile(os.path.join(PACK, f"imgkeep-icon-variation-{size}.png"), os.path.join(icons, f"icon{size}.png"))
    shutil.copyfile(os.path.join(icons, "icon128.png"), os.path.join(site, "icon128.png"))
    shutil.copyfile(os.path.join(icons, "icon32.png"), os.path.join(site, "favicon.png"))
    edge = os.path.join(ROOT, "store", "edge-logo-300.png")
    if shutil.which("sips"):
        subprocess.run(["sips", "-z", "300", "300", os.path.join(PACK, "imgkeep-icon-variation-master.png"), "--out", edge],
                       check=True, stdout=subprocess.DEVNULL)
    else:
        print("sips not found (macOS only): store/edge-logo-300.png not updated")
    print("icons written")
