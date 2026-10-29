#!/usr/bin/env python3
"""
Storyboard do Reel "Prazer, Pertim": os momentos-chave tirados do MP4 final, com o tempo e o que acontece.

    python3 reels/prazer-pertim/scripts/storyboard.py      -> reels/prazer-pertim/output/storyboard.png
"""
import json
import os
import subprocess
import tempfile
from PIL import Image, ImageDraw, ImageFont

AQUI = os.path.dirname(os.path.abspath(__file__))
REEL = os.path.dirname(AQUI)
REPO = os.path.dirname(os.path.dirname(REEL))
VIDEO = os.path.join(REEL, 'output', 'uaipertim-prazer-pertim.mp4')
CENA = json.load(open(os.path.join(REEL, 'dados', 'cena.json')))
EV, DUR = CENA['eventos'], CENA['duracao']
C = CENA['cenas']
MOMENTOS = [
    (0.0, 'CENA 1 · gancho', 'a motinha já entrando'),
    (EV['chegada']['para'] + 0.4, 'CENA 1', 'freia, para e olha: "Opa!"'),
    (C[0]['voz_t1'] - 0.6, 'CENA 1', '"…me chamar de Pertim"'),
    (EV['aponta'] + 0.6, 'CENA 2', 'desce da moto e aponta'),
    (EV['lojas'][0]['t'] + 0.5, 'CENA 2', '"a padaria" brota e pisca'),
    (EV['lojas'][2]['t'] + 0.8, 'CENA 2', 'mercadim e lanchonete'),
    (EV['sacola'] + 0.8, 'CENA 3', 'pega a sacola, sorrindo'),
    (EV['pertim'] + 0.5, 'CENA 3', '"pertim": chega perto'),
    (EV['aceno'] + 0.6, 'FECHO', 'acena com a piscadinha'),
    (EV['chip'] + 0.6, 'FECHO', 'chip "Segue" + logo'),
    (DUR - 2.0, 'FECHO', 'logo parada, sem legenda'),
    (DUR - 0.05, 'FIM', 'último quadro'),
]
F = os.path.join(REPO, 'public', 'fonts', 'poppins-latin-800-normal.woff2')
f1, f2 = ImageFont.truetype(F, 26), ImageFont.truetype(F, 19)
TW, TH, G, TXT, COLS = 324, 576, 18, 92, 6
linhas = (len(MOMENTOS) + COLS - 1) // COLS
sh = Image.new('RGB', (COLS * (TW + G) + G, 90 + linhas * (TH + TXT + G) + G), (34, 28, 25))
d = ImageDraw.Draw(sh)
d.text((G, 24), f'"PRAZER, PERTIM" · Reel de teste · {DUR:.2f} s · 1080×1920 · 60 fps', font=ImageFont.truetype(F, 34), fill=(249, 178, 51))
with tempfile.TemporaryDirectory() as tmp:
    for i, (t, cena, o_que) in enumerate(MOMENTOS):
        p = os.path.join(tmp, f'{i}.png')
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', f'{t:.3f}', '-i', VIDEO, '-frames:v', '1', p], check=True)
        x, y = G + (i % COLS) * (TW + G), 90 + (i // COLS) * (TH + TXT + G)
        sh.paste(Image.open(p).convert('RGB').resize((TW, TH), Image.LANCZOS), (x, y))
        d.text((x, y + TH + 8), f'{t:5.2f} s · {cena}', font=f1, fill=(242, 80, 43))
        d.text((x, y + TH + 44), o_que, font=f2, fill=(246, 238, 226))
out = os.path.join(REEL, 'output', 'storyboard.png')
sh.save(out)
print('ok', os.path.relpath(out, REPO))
