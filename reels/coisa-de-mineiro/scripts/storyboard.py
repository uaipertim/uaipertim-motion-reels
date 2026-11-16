#!/usr/bin/env python3
"""
Série "Coisa de mineiro": os quadros de revisão (1 por cena) e o storyboard de UM episódio, tirados do MP4.

    python3 reels/coisa-de-mineiro/scripts/storyboard.py 01-e-logo-ali
        -> reels/coisa-de-mineiro/<ep>/output/quadros/cena-N-<tipo>.png + output/storyboard.png
"""
import json
import os
import subprocess
import sys
from PIL import Image, ImageDraw, ImageFont

AQUI = os.path.dirname(os.path.abspath(__file__))
SERIE = os.path.dirname(AQUI)
REPO = os.path.dirname(os.path.dirname(SERIE))
EP = sys.argv[1] if len(sys.argv) > 1 else '01-e-logo-ali'
ROT = json.load(open(os.path.join(SERIE, EP, 'roteiro.json')))
D = json.load(open(os.path.join(REPO, 'public', 'coisa-de-mineiro', EP, 'dados.json')))
NN = f'{ROT["numero"]:02d}'
OUT = os.path.join(SERIE, EP, 'output')
MP4 = os.path.join(OUT, f'uaipertim-coisa-de-mineiro-{NN}.mp4')
QD = os.path.join(OUT, 'quadros')
os.makedirs(QD, exist_ok=True)


def momento(c):
    """o instante em que a cena está montada"""
    d = c['diagrama']
    if c['tipo'] == 'resposta' and d.get('camera'):
        return d['camera']['t'] + 0.35
    if c['tipo'] == 'caminho' and d.get('objetos'):
        return d['objetos'][-1]['t'] + 0.1
    if c['tipo'] == 'fecho':
        return D['duracao'] - 0.3
    return c['voz_t1'] - 0.3


fonte = os.path.join(REPO, 'public', 'fonts', 'poppins-latin-800-normal.woff2')
F1, F2 = ImageFont.truetype(fonte, 30), ImageFont.truetype(fonte, 22)
TW, TH = 360, 640
cenas = D['cenas']
sb = Image.new('RGB', (len(cenas) * (TW + 16) + 16, TH + 150), (34, 28, 25))
d = ImageDraw.Draw(sb)
for i, c in enumerate(cenas):
    t = momento(c)
    png = os.path.join(QD, f'cena-{i + 1}-{c["tipo"]}.png')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t:.3f}', '-i', MP4, '-frames:v', '1', png], check=True)
    im = Image.open(png).convert('RGB').resize((TW, TH), Image.LANCZOS)
    x = 16 + i * (TW + 16)
    sb.paste(im, (x, 16))
    d.text((x, TH + 26), f'CENA {i + 1} · {t:.2f} s', font=F1, fill=(249, 178, 51))
    d.text((x, TH + 66), f'{c["tipo"]} · {c["t0"]:.1f}–{c["t1"]:.1f} s', font=F2, fill=(255, 249, 241))
    d.text((x, TH + 96), c['texto'][:30] + ('…' if len(c['texto']) > 30 else ''), font=F2, fill=(255, 249, 241))
    print(f'ok {os.path.relpath(png, REPO)} ({t:.2f} s)')
sb.save(os.path.join(OUT, 'storyboard.png'))
print(f'ok {os.path.relpath(os.path.join(OUT, "storyboard.png"), REPO)}')
