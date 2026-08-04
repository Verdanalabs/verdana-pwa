#!/usr/bin/env python3
"""
Build every app icon from the real Verdana logo.

Source of truth: public/logo.png, the V lockup shared with the landing site and
the admin app, so the tab bar and launcher match across every surface. Note this
is NOT assets/images/logo.png, which is the leaf mark the in-app login screens
render; pointing this script back at that file desynchronises the icons again.

Do NOT hand-draw a replacement mark here. Earlier icons were a flat traced "V"
that read as a plain square at launcher size.

Requires Pillow:  pip install pillow

    python scripts/build-icons.py

Outputs are committed, so this only needs re-running when the logo changes.
"""

import os
import sys

try:
    from PIL import Image, ImageDraw
except ImportError:
    sys.exit("Pillow is required: pip install pillow")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "public", "logo.png")

DARK_GREEN = (21, 45, 7, 255)      # #152D07
LUSH_WHITE = (253, 255, 253, 255)  # #FDFFFD

# The logo's own gradient runs dark green -> bright green, so it is drawn for a
# LIGHT ground (that is how the login screen uses it). On a Dark Green tile the
# dark half of the leaf disappears, which is what made the first pass look like
# a plain square. Tile in Lush White instead.
TILE = LUSH_WHITE


def load_mark():
    """Load the logo and crop to its visible content so padding is predictable."""
    img = Image.open(SRC).convert("RGBA")
    bbox = img.getbbox()
    return img.crop(bbox) if bbox else img


MARK = load_mark()


def fit(mark, box):
    """Scale the mark to fit a square box, preserving aspect."""
    w, h = mark.size
    scale = min(box / w, box / h)
    return mark.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)


def rounded_tile(size, radius_ratio, fill):
    tile = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(tile)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=int(size * radius_ratio), fill=fill)
    return tile


def compose(size, *, tile=None, pad=0.20, radius=0.22, mono=False):
    """Mark centred on an optional rounded tile, with `pad` margin each side."""
    canvas = rounded_tile(size, radius, tile) if tile else Image.new("RGBA", (size, size), (0, 0, 0, 0))
    inner = int(size * (1 - 2 * pad))
    mark = fit(MARK, inner)

    if mono:
        # Silhouette from the alpha channel, for Android's monochrome layer.
        solid = Image.new("RGBA", mark.size, (255, 255, 255, 255))
        solid.putalpha(mark.getchannel("A"))
        mark = solid

    x = (size - mark.width) // 2
    y = (size - mark.height) // 2
    canvas.alpha_composite(mark, (x, y))
    return canvas


def save(img, rel):
    path = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path)
    print(f"  {rel}  {img.width}x{img.height}")


def main():
    print(f"Building icons from {os.path.relpath(SRC, ROOT)} (mark {MARK.width}x{MARK.height}):")

    # App + PWA icons: mark on the brand tile.
    save(compose(1024, tile=TILE), "assets/images/icon.png")
    save(compose(512, tile=TILE), "public/icon-512.png")
    save(compose(192, tile=TILE), "public/icon-192.png")

    # Favicon: tile keeps it recognisable at 48px.
    save(compose(48, tile=TILE, radius=0.20, pad=0.14), "assets/images/favicon.png")

    # Splash: bare mark. app.json sets the background per theme.
    save(compose(512, pad=0.12), "assets/images/splash-icon.png")

    # Android adaptive: the launcher crops to roughly the middle 66%, so the
    # foreground needs a generous safe zone.
    save(compose(432, pad=0.28), "assets/images/android-icon-foreground.png")
    save(compose(432, pad=0.28, mono=True), "assets/images/android-icon-monochrome.png")

    plate = Image.new("RGBA", (432, 432), TILE)
    save(plate, "assets/images/android-icon-background.png")

    print("done")


if __name__ == "__main__":
    main()
