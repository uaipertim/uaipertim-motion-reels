"""Prévias das capas novas do Dicionário Mineiro.
    python3 scripts/capas_dicionario_previas.py
  -> out/capas/dicionario/recorte-3x4.png   as 7 capas no recorte 3:4 da grade (y 240–1680), lado a lado
  -> out/capas/dicionario/grade-previa.png  a grade do perfil em 3 colunas, na ordem atual
"""
import glob
import os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = os.path.join(ROOT, "out", "capas", "dicionario")
FACIM = os.path.join(ROOT, "out", "carrosseis", "facim")


def crop34(path):
    im = Image.open(path).convert("RGB")
    w, h = im.size
    if (w, h) == (1080, 1920):
        return im.crop((0, 240, 1080, 1680))          # Reel: a faixa central 1080×1440
    cw = round(h * 3 / 4)                             # post 4:5: o centro 3:4
    return im.crop(((w - cw) // 2, 0, (w - cw) // 2 + cw, h))


capas = sorted(glob.glob(os.path.join(D, "capa-dicionario-0*.png")))
TW, TH, G = 300, 400, 10
sheet = Image.new("RGB", (len(capas) * (TW + G) + G, TH + 2 * G), (40, 40, 40))
for i, p in enumerate(capas):
    t = crop34(p).resize((TW, TH), Image.LANCZOS)
    d = ImageDraw.Draw(t)
    # a zona do recorte com a folga (x 110–970, y 300–1620 da capa) em tracejado
    sx, sy = TW / 1080, TH / 1440
    for x0, y0, x1, y1 in [(110, 60, 970, 60), (110, 1380, 970, 1380), (110, 60, 110, 1380), (970, 60, 970, 1380)]:
        d.line((x0 * sx, y0 * sy, x1 * sx, y1 * sy), fill=(62, 158, 78), width=1)
    sheet.paste(t, (G + i * (TW + G), G))
sheet.save(os.path.join(D, "recorte-3x4.png"))

cap = lambda nome: next(p for p in capas if nome in os.path.basename(p))
slide1 = lambda n: os.path.join(glob.glob(os.path.join(FACIM, f"{n:02d}-*"))[0], "slide-1.png")
GRADE = [
    [os.path.join(ROOT, "out", "capas", "capa_video1.png"), slide1(1), os.path.join(ROOT, "out", "capas", "capa_video2.png")],
    [slide1(6), cap("quitanda"), slide1(5)],
    [cap("nossinhora"), slide1(4), cap("-so.png")],
    [slide1(3), cap("facim"), cap("uai")],
]
TW, TH, G = 360, 480, 4
grid = Image.new("RGB", (3 * TW + 2 * G, len(GRADE) * TH + (len(GRADE) - 1) * G), (255, 255, 255))
for r, row in enumerate(GRADE):
    for c, p in enumerate(row):
        t = crop34(p).resize((TW, TH), Image.LANCZOS)
        ImageDraw.Draw(t).polygon([(TW - 34, 12), (TW - 34, 34), (TW - 16, 23)], fill=(255, 255, 255))   # o ícone de Reel
        grid.paste(t, (c * (TW + G), r * (TH + G)))
grid.save(os.path.join(D, "grade-previa.png"))
print("ok -> out/capas/dicionario/recorte-3x4.png + grade-previa.png")
