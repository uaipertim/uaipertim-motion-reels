"""Prévia das capas dos destaques como aparecem no perfil: o Instagram mostra o centro da capa num círculo.
Linha de cima: o círculo do quadrado central (1080 px); linha de baixo: o círculo de 600 px (o recorte mais justo).
    python3 scripts/destaque_previa.py   -> out/destaques/capas/previa.png
"""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = os.path.join(ROOT, "out", "destaques", "capas")
CAPAS = [("conheca", "Conheça"), ("duvidas", "Dúvidas"), ("lojista", "Lojista"), ("explica-so", "Explica, Sô!")]
font = ImageFont.truetype(os.path.join(ROOT, "public", "fonts", "poppins-latin-500-normal.woff2"), 26)
small = ImageFont.truetype(os.path.join(ROOT, "public", "fonts", "poppins-latin-500-normal.woff2"), 20)
R, GAP, X0 = 200, 70, 60
W = X0 * 2 + len(CAPAS) * R + (len(CAPAS) - 1) * GAP
sheet = Image.new("RGB", (W, 2 * (R + 120) + 40), (255, 255, 255))
dr = ImageDraw.Draw(sheet)
for row, (lado, nota) in enumerate([(1080, "círculo do quadrado central (1080 px)"), (600, "círculo de 600 px")]):
    y0 = 30 + row * (R + 140)
    dr.text((X0, y0 - 22), nota, font=small, fill=(140, 140, 140))
    for i, (nome, rot) in enumerate(CAPAS):
        im = Image.open(os.path.join(D, nome + ".png")).convert("RGB")
        c = im.crop(((1080 - lado) // 2, (1920 - lado) // 2, (1080 + lado) // 2, (1920 + lado) // 2)).resize((R - 12, R - 12), Image.LANCZOS)
        m = Image.new("L", c.size, 0); ImageDraw.Draw(m).ellipse((0, 0, c.size[0] - 1, c.size[1] - 1), fill=255)
        x = X0 + i * (R + GAP)
        dr.ellipse((x, y0 + 8, x + R, y0 + 8 + R), outline=(219, 219, 219), width=3)   # o anel cinza do perfil
        sheet.paste(c, (x + 6, y0 + 14), m)
        tw = dr.textlength(rot, font=font)
        dr.text((x + R / 2 - tw / 2, y0 + R + 22), rot, font=font, fill=(38, 38, 38))
sheet.save(os.path.join(D, "previa.png"))
print("ok -> out/destaques/capas/previa.png")
