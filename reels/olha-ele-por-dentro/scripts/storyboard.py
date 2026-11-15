#!/usr/bin/env python3
"""
Reel "Olha ele por dentro!": os quadros de revisão (1 por cena) e o storyboard, tirados do MP4 final.

    python3 reels/olha-ele-por-dentro/scripts/storyboard.py
        -> reels/olha-ele-por-dentro/output/quadros/cena-N-<tipo>.png (1080×1920) + output/storyboard.png

O quadro de cada cena é o momento em que ela está montada (todas as peças na tela), antes do corte seguinte.
"""
import json
import os
import subprocess
from PIL import Image, ImageDraw, ImageFont

AQUI = os.path.dirname(os.path.abspath(__file__))
REEL = os.path.dirname(AQUI)
REPO = os.path.dirname(os.path.dirname(REEL))
CENA = json.load(open(os.path.join(REEL, 'dados', 'cena.json')))
MP4 = os.path.join(REEL, 'output', 'uaipertim-olha-ele-por-dentro.mp4')
QD = os.path.join(REEL, 'output', 'quadros')
os.makedirs(QD, exist_ok=True)
E = CENA['eventos']
S = CENA['cenas']
# o instante "montado" de cada cena
MOM = {
    'gancho': S[0]['t1'] - 0.6,
    'inicio': E['inicio']['cats'][2]['t'] + 0.3,
    'loja': E['loja']['lupa'][0] + 0.7,
    'produto': E['produto']['marca'] + 0.45,
    'sacola': E['sacola']['pula'] + 0.35,
    'pagamento': E['pagamento']['formas'][2] + 0.3,
    'fecho': S[6]['t1'] - 0.3,
}
DESC = {
    'gancho': 'celular acende com a logo; Pertim', 'inicio': 'lupa nas categorias; Mercado Central',
    'loja': 'cardápio; lupa no Smash (foto, preço, +)', 'produto': 'Turbine seu lanche; bacon marcado',
    'sacola': 'Sacola; o contador pula (+1)', 'pagamento': 'Pix, Cartão, Pagar na entrega',
    'fecho': 'logo, frase, "Em breve no Glória"',
}
fonte = os.path.join(REPO, 'public', 'fonts', 'poppins-latin-800-normal.woff2')
F1, F2 = ImageFont.truetype(fonte, 30), ImageFont.truetype(fonte, 22)
TW, TH = 360, 640
sb = Image.new('RGB', (len(S) * (TW + 16) + 16, TH + 150), (34, 28, 25))
d = ImageDraw.Draw(sb)
for i, c in enumerate(S):
    t = MOM[c['tipo']]
    png = os.path.join(QD, f'cena-{i + 1}-{c["tipo"]}.png')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t:.3f}', '-i', MP4, '-frames:v', '1', png], check=True)
    im = Image.open(png).convert('RGB').resize((TW, TH), Image.LANCZOS)
    x = 16 + i * (TW + 16)
    sb.paste(im, (x, 16))
    d.text((x, TH + 26), f'CENA {i + 1} · {t:.2f} s', font=F1, fill=(249, 178, 51))
    d.text((x, TH + 66), f'{c["t0"]:.1f}–{c["t1"]:.1f} s', font=F2, fill=(255, 249, 241))
    d.text((x, TH + 96), DESC[c['tipo']][:34], font=F2, fill=(255, 249, 241))
    print(f'ok {os.path.relpath(png, REPO)} ({t:.2f} s)')
sb.save(os.path.join(REEL, 'output', 'storyboard.png'))
print('ok reels/olha-ele-por-dentro/output/storyboard.png')
