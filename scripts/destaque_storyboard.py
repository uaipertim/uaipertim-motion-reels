"""Storyboard de um story de destaque: 3 quadros por card (0,5 s, 2 s e 5,5 s), tirados dos MP4.
    python3 scripts/destaque_storyboard.py duvidas   -> out/destaques/duvidas/storyboard.jpg
"""
import glob
import os
import subprocess
import sys
import tempfile
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
nome = sys.argv[1]
D = os.path.join(ROOT, "out", "destaques", nome)
cards = sorted(glob.glob(os.path.join(D, "card-*.mp4")), key=lambda p: int(p.rsplit("-", 1)[1].split(".")[0]))
TEMPOS = (0.5, 2.0, 5.5)
TW, TH, PAD, LAB = 300, 533, 12, 44
font = ImageFont.truetype(os.path.join(ROOT, "public", "fonts", "poppins-latin-800-normal.woff2"), 22)
sheet = Image.new("RGB", (len(TEMPOS) * (TW + PAD) + PAD, len(cards) * (TH + LAB + PAD) + PAD), (246, 238, 226))
dr = ImageDraw.Draw(sheet)
with tempfile.TemporaryDirectory() as tmp:
    for r, mp4 in enumerate(cards):
        for c, t in enumerate(TEMPOS):
            png = os.path.join(tmp, f"{r}-{c}.png")
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{t:.3f}", "-i", mp4, "-frames:v", "1", png], check=True)
            x, y = PAD + c * (TW + PAD), PAD + r * (TH + LAB + PAD)
            sheet.paste(Image.open(png).convert("RGB").resize((TW, TH), Image.LANCZOS), (x, y))
            dr.text((x, y + TH + 8), f"card {r + 1} · {t:.1f} s", font=font, fill=(242, 80, 43))
sheet.save(os.path.join(D, "storyboard.jpg"), quality=88)
print(f"ok -> out/destaques/{nome}/storyboard.jpg")
