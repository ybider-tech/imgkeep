#!/usr/bin/env python3
"""Draws the Imgkeep icon (white download arrow into a tray on a rounded #0f6b5c square)
at 16/32/48/128 px. Standard library only: shapes are signed-distance functions,
anti-aliased with 5x5 supersampling, written as RGBA PNGs."""

import math
import os
import struct
import zlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BG = (0x0F, 0x6B, 0x5C)
FG = (0xFF, 0xFF, 0xFF)


def sd_round_rect(x, y, x0, y0, x1, y1, r):
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    hx, hy = (x1 - x0) / 2 - r, (y1 - y0) / 2 - r
    dx, dy = abs(x - cx) - hx, abs(y - cy) - hy
    outside = math.hypot(max(dx, 0), max(dy, 0))
    return outside + min(max(dx, dy), 0) - r


def sd_segment(x, y, ax, ay, bx, by):
    px, py, vx, vy = x - ax, y - ay, bx - ax, by - ay
    t = max(0.0, min(1.0, (px * vx + py * vy) / (vx * vx + vy * vy)))
    return math.hypot(px - vx * t, py - vy * t)


def glyph_segments():
    """Arrow and tray as line segments in unit coordinates."""
    return [
        (0.50, 0.20, 0.50, 0.56),  # stem
        (0.50, 0.58, 0.33, 0.41),  # head, left
        (0.50, 0.58, 0.67, 0.41),  # head, right
        (0.24, 0.60, 0.24, 0.77),  # tray, left
        (0.24, 0.77, 0.76, 0.77),  # tray, bottom
        (0.76, 0.77, 0.76, 0.60),  # tray, right
    ]


def render(size):
    # Small sizes get thicker strokes and less padding so they stay legible.
    margin = {16: 0.0, 32: 0.03, 48: 0.05, 128: 0.0625, 300: 0.0625}[size]
    radius = 0.22
    half = {16: 0.085, 32: 0.07, 48: 0.065, 128: 0.058, 300: 0.058}[size]
    segs = glyph_segments()
    ss = 5
    rows = []
    for py in range(size):
        row = bytearray([0])  # PNG filter: none
        for px in range(size):
            bg_cov = fg_cov = 0
            for sy in range(ss):
                for sx in range(ss):
                    x = (px + (sx + 0.5) / ss) / size
                    y = (py + (sy + 0.5) / ss) / size
                    if sd_round_rect(x, y, margin, margin, 1 - margin, 1 - margin, radius * (1 - 2 * margin)) <= 0:
                        bg_cov += 1
                        # Glyph is scaled into the square's inner area.
                        gx = (x - margin) / (1 - 2 * margin)
                        gy = (y - margin) / (1 - 2 * margin)
                        if min(sd_segment(gx, gy, *s) for s in segs) <= half:
                            fg_cov += 1
            n = ss * ss
            a = bg_cov / n
            if bg_cov:
                t = fg_cov / bg_cov
                rgb = [round(BG[i] * (1 - t) + FG[i] * t) for i in range(3)]
            else:
                rgb = list(BG)
            row += bytes(rgb + [round(a * 255)])
        rows.append(bytes(row))
    return png(size, size, b"".join(rows))


def png(w, h, raw):
    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )


if __name__ == "__main__":
    out_dir = os.path.join(ROOT, "extension", "icons")
    os.makedirs(out_dir, exist_ok=True)
    for size in (16, 32, 48, 128):
        data = render(size)
        with open(os.path.join(out_dir, f"icon{size}.png"), "wb") as f:
            f.write(data)
        if size == 128:
            with open(os.path.join(ROOT, "site", "icon128.png"), "wb") as f:
                f.write(data)
        if size == 32:
            with open(os.path.join(ROOT, "site", "favicon.png"), "wb") as f:
                f.write(data)
    # Microsoft Edge Add-ons store logo (300x300).
    with open(os.path.join(ROOT, "store", "edge-logo-300.png"), "wb") as f:
        f.write(render(300))
    print("icons written")
