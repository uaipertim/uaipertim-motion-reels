"""Comparação de preenchimento: o card 1 do Story "Conheça" ao lado de Dúvidas 1, Lojista 2 e Explica, Sô! 1
(quadro final de cada um, com as linhas y 280, 1700 e 1780 marcadas).
    python3 scripts/destaque_comparacao.py   -> out/destaques/comparacao.jpg
"""
import os
import subprocess
import tempfile
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CARDS = [("Conheça · card 1", "out/story-conheca/card1.mp4"), ("Dúvidas · card 1", "out/destaques/duvidas/card-1.mp4"),
         ("Lojista · card 2", "out/destaques/lojista/card-2.mp4"), ("Explica, Sô! · card 1", "out/destaques/explica-so/card-1.mp4")]
TW, TH, PAD, LAB = 360, 640, 16, 52
font = ImageFont.truetype(os.path.join(ROOT, "public", "fonts", "poppins-latin-800-normal.woff2"), 24)
small = ImageFont.truetype(os.path.join(ROOT, "public", "fonts", "poppins-latin-500-normal.woff2"), 16)
sheet = Image.new("RGB", (len(CARDS) * (TW + PAD) + PAD, TH + LAB + PAD * 2 + 30), (246, 238, 226))
dr = ImageDraw.Draw(sheet)
with tempfile.TemporaryDirectory() as tmp:
    for i, (nome, mp4) in enumerate(CARDS):
        png = os.path.join(tmp, f"{i}.png")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-sseof", "-0.2", "-i", os.path.join(ROOT, mp4), "-frames:v", "1", png], check=True)
        im = Image.open(png).convert("RGB")
        d = ImageDraw.Draw(im)
        for y, cor in ((280, (62, 158, 78)), (1700, (62, 158, 78)), (1780, (231, 67, 28))):
            for x in range(0, 1080, 40):
                d.line((x, y, x + 22, y), fill=cor, width=5)
        x = PAD + i * (TW + PAD)
        sheet.paste(im.resize((TW, TH), Image.LANCZOS), (x, PAD + LAB))
        dr.text((x, PAD), nome, font=font, fill=(242, 80, 43))
    dr.text((PAD, TH + LAB + PAD + 10), "verde: y 280 e y 1700 · coral: y 1780 (barra de resposta do story)", font=small, fill=(110, 98, 90))
sheet.save(os.path.join(ROOT, "out", "destaques", "comparacao.jpg"), quality=90)
print("ok -> out/destaques/comparacao.jpg")
