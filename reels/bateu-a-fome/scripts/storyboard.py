#!/usr/bin/env python3
"""
Reel "Bateu a fome?": os quadros de revisão (1 por cena) e o storyboard, tirados do MP4 final.

    python3 reels/bateu-a-fome/scripts/storyboard.py
        -> reels/bateu-a-fome/output/quadros/cena-N-<tipo>.png (1080×1920) + output/storyboard.png

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
MP4 = os.path.join(REEL, 'output', 'uaipertim-bateu-a-fome.mp4')
QD = os.path.join(REEL, 'output', 'quadros')
os.makedirs(QD, exist_ok=True)
E = CENA['eventos']
S = CENA['cenas']
# o instante "montado" de cada cena
MOM = {
    'gancho': S[0]['t1'] - 0.12,
    'logo': S[1]['t1'] - 0.2,
    'lojas': S[2]['t1'] - 0.3,
    'mao': S[3]['t1'] - 0.3,
    'desfile': E['desfile']['itens'][2]['entra'] - 0.15,
    'pagamento': S[5]['t1'] - 0.25,
    'rapidim': (E['rapidim']['cruza'][0] + E['rapidim']['cruza'][1]) / 2,
    'chegou': S[7]['t1'] - 0.4,
    'fecho': S[8]['t1'] - 0.3,
}
DESC = {
    'gancho': '"Bateu a fome?" à mão; Pertim falando', 'logo': 'pin cai, toldo abre, logo explode (coral)',
    'lojas': 'fileiras de lojinhas param; moldura', 'mao': 'celular genérico na mão; "Na palma da sua mão!"',
    'desfile': 'sílabas gigantes + foto + "+"', 'pagamento': 'selos Pix, Cartão, Na entrega',
    'rapidim': 'RAPIDIM ao fundo; Pertim de motinha', 'chegou': 'check, "Seu pedido chegou!", 5 estrelas',
    'fecho': 'Foi facim! + logo + frase + selo',
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
print('ok reels/bateu-a-fome/output/storyboard.png')
