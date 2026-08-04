# -*- coding: utf-8 -*-
"""Generate 1200x630 OG PNGs for thema hubs from Backround.jpg + title overlay."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFont

ROOT = Path(__file__).resolve().parents[1]
BG = ROOT / "Images" / "Backround.jpg"
OUT = ROOT / "Images" / "og"

HUBS = [
    ("og-lightning.jpg", "Lightning Network", "Themen-Hub"),
    ("og-bitcoin-kaufen-schweiz.jpg", "Bitcoin kaufen", "Schweiz"),
    ("og-bitcoin-steuern-schweiz.jpg", "Bitcoin & Steuern", "Schweiz"),
    ("og-hardware-wallet.jpg", "Hardware Wallet", "Self-Custody"),
    ("og-bitcoin-kmu.jpg", "Bitcoin für KMU", "Händler & Lightning"),
    ("og-default.jpg", "Bitcoin Akzeptieren", "Wissen · Mentoring · KMU"),
]


def fit_cover(img: Image.Image, size: tuple[int, int]) -> Image.Image:
    tw, th = size
    iw, ih = img.size
    scale = max(tw / iw, th / ih)
    nw, nh = int(iw * scale), int(ih * scale)
    img = img.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - tw) // 2
    top = (nh - th) // 2
    return img.crop((left, top, left + tw, top + th))


def load_font(size: int) -> ImageFont.ImageFont:
    candidates = [
        ROOT / "fonts" / "dm-sans-700-normal.woff2",  # Pillow may not load woff2
        Path(r"C:\Windows\Fonts\segoeuib.ttf"),
        Path(r"C:\Windows\Fonts\arialbd.ttf"),
        Path(r"C:\Windows\Fonts\arial.ttf"),
    ]
    for path in candidates:
        if path.suffix.lower() == ".woff2":
            continue
        if path.exists():
            try:
                return ImageFont.truetype(str(path), size=size)
            except OSError:
                continue
    return ImageFont.load_default()


def make_og(title: str, subtitle: str) -> Image.Image:
    base = Image.open(BG).convert("RGB")
    canvas = fit_cover(base, (1200, 630))
    canvas = ImageEnhance.Brightness(canvas).enhance(0.45)
    draw = ImageDraw.Draw(canvas)
    # brand bar
    draw.rectangle((0, 0, 1200, 8), fill=(247, 147, 26))
    font_brand = load_font(36)
    font_title = load_font(72)
    font_sub = load_font(36)
    draw.text((64, 72), "Bitcoin Akzeptieren", font=font_brand, fill=(247, 147, 26))
    draw.text((64, 260), title, font=font_title, fill=(244, 244, 245))
    draw.text((64, 360), subtitle, font=font_sub, fill=(161, 161, 170))
    draw.text((64, 560), "bitcoin-akzeptieren.ch", font=load_font(28), fill=(113, 113, 122))
    return canvas


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    if not BG.exists():
        raise SystemExit(f"Missing background: {BG}")
    for filename, title, subtitle in HUBS:
        img = make_og(title, subtitle)
        dest = OUT / filename
        img.save(dest, format="JPEG", quality=82, optimize=True, progressive=True)
        print(f"OK {dest.name} ({dest.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
