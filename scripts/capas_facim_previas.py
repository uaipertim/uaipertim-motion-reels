"""Prévias das capas novas dos carrosséis Facim Facim.
    python3 scripts/capas_facim_previas.py
  -> out/carrosseis/facim/capas-novas-previa.png  as capas novas (slide-1) no recorte 3:4 da grade, lado a lado, com a
                                                  zona segura (x 130–950, y 90–1260 do slide) em tracejado verde
  -> out/capas/grade-previa-final.png             a grade do perfil em 3 colunas no padrão novo (a 1ª linha é a dos fixados)
    python3 scripts/capas_facim_previas.py 6 4
  -> out/carrosseis/facim/previa-novos-na-grade.png  a mesma grade com os carrosséis novos postados (o primeiro número é o
                                                  mais recente): eles entram no topo, depois dos fixados, e o resto desce
"""
import sys
import glob
import json
import os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FACIM = os.path.join(ROOT, "out", "carrosseis", "facim")
DIC = os.path.join(ROOT, "out", "capas", "dicionario")


def crop34(path):
    im = Image.open(path).convert("RGB")
    w, h = im.size
    if (w, h) == (1080, 1920):
        return im.crop((0, 240, 1080, 1680))          # Reel: a faixa central 1080×1440
    cw = round(h * 3 / 4)                             # post 4:5: o centro 3:4 (1013 px)
    return im.crop(((w - cw) // 2, 0, (w - cw) // 2 + cw, h))


def slide1(n):
    return os.path.join(glob.glob(os.path.join(FACIM, f"{n:02d}-*"))[0], "slide-1.png")


novas = sorted(int(os.path.basename(f)[:2]) for f in glob.glob(os.path.join(ROOT, "carrosseis", "facim", "*.json"))
               if json.load(open(f)).get("capaNova"))
TW, TH, G = 300, 400, 10
sheet = Image.new("RGB", (len(novas) * (TW + G) + G, TH + 2 * G), (40, 40, 40))
for i, n in enumerate(novas):
    t = crop34(slide1(n)).resize((TW, TH), Image.LANCZOS)
    d = ImageDraw.Draw(t)
    sx, sy, off = TW / 1013, TH / 1350, 34            # a zona segura do slide (x 130–950, y 90–1260) dentro do recorte
    x0, x1, y0, y1 = (130 - off) * sx, (950 - off) * sx, 90 * sy, 1260 * sy
    for k in range(0, 400, 8):                        # tracejado
        if y0 + k < y1: d.line((x0, y0 + k, x0, min(y1, y0 + k + 4)), fill=(62, 158, 78)); d.line((x1, y0 + k, x1, min(y1, y0 + k + 4)), fill=(62, 158, 78))
        if x0 + k < x1: d.line((x0 + k, y0, min(x1, x0 + k + 4), y0), fill=(62, 158, 78)); d.line((x0 + k, y1, min(x1, x0 + k + 4), y1), fill=(62, 158, 78))
    sheet.paste(t, (G + i * (TW + G), G))
sheet.save(os.path.join(FACIM, "capas-novas-previa.png"))

dic = lambda nome: next(p for p in sorted(glob.glob(os.path.join(DIC, "capa-dicionario-0*.png"))) if nome in os.path.basename(p))
REEL, POST = "reel", "post"
GRADE = [  # (arquivo, tipo); a 1ª linha é a dos fixados
    [(os.path.join(ROOT, "out", "capas", "capa_video1.png"), REEL), (slide1(1), POST), (os.path.join(ROOT, "out", "capas", "capa_video2.png"), REEL)],
    [(slide1(9), POST), (os.path.join(ROOT, "reels", "explica-so", "output", "explica-so-01", "capa.png"), REEL), (slide1(8), POST)],
    [(slide1(7), POST), (dic("quitanda"), REEL), (slide1(5), POST)],
    [(dic("nossinhora"), REEL), (dic("-so.png"), REEL), (slide1(3), POST)],
    [(dic("facim"), REEL), (dic("uai"), REEL), (dic("pertim"), REEL)],
    [(dic("trem"), REEL), (slide1(2), POST)],
]
TW, TH, G = 360, 480, 4


def grade(linhas, destino, destaque=()):
    grid = Image.new("RGB", (3 * TW + 2 * G, len(linhas) * TH + (len(linhas) - 1) * G), (255, 255, 255))
    for r, row in enumerate(linhas):
        for c, (p, tipo) in enumerate(row):
            t = crop34(p).resize((TW, TH), Image.LANCZOS)
            d = ImageDraw.Draw(t)
            if r == 0:                                    # fixado: o alfinete no canto
                d.ellipse((TW - 40, 10, TW - 14, 36), fill=(255, 255, 255)); d.line((TW - 27, 34, TW - 27, 46), fill=(255, 255, 255), width=4)
            elif tipo == REEL:                            # o ícone de Reel
                d.polygon([(TW - 34, 12), (TW - 34, 34), (TW - 16, 23)], fill=(255, 255, 255))
            else:                                         # o ícone de carrossel (dois quadradinhos)
                d.rectangle((TW - 36, 16, TW - 20, 32), outline=(255, 255, 255), width=3); d.rectangle((TW - 30, 10, TW - 14, 26), outline=(255, 255, 255), width=3)
            if p in destaque:                             # os novos, marcados com um contorno verde
                d.rectangle((1, 1, TW - 2, TH - 2), outline=(62, 158, 78), width=6)
            grid.paste(t, (c * (TW + G), r * (TH + G)))
    grid.save(destino)


grade(GRADE, os.path.join(ROOT, "out", "capas", "grade-previa-final.png"))
novos = [int(a_) for a_ in sys.argv[1:]]
if novos:
    posts = [slide1(n) for n in novos]
    seq = [(p, POST) for p in posts] + [x for row in GRADE[1:] for x in row]
    linhas = [GRADE[0]] + [seq[i:i + 3] for i in range(0, len(seq), 3)]
    grade(linhas, os.path.join(FACIM, "previa-novos-na-grade.png"), destaque=set(posts))
    print("ok -> out/carrosseis/facim/previa-novos-na-grade.png")
print("ok -> out/carrosseis/facim/capas-novas-previa.png + out/capas/grade-previa-final.png")
