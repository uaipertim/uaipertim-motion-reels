#!/usr/bin/env python3
"""
Storyboard do Reel "Pedir no UaiPertim é assim": um quadro por cena (o momento-chave de cada uma), com o tempo, a fala
e o que acontece.

    python3 reels/pedir-no-uaipertim/scripts/storyboard.py            (do MP4 final)
    python3 reels/pedir-no-uaipertim/scripts/storyboard.py --previa   (antes do vídeo: renderiza só esses quadros)
-> reels/pedir-no-uaipertim/output/storyboard.png
"""
import json
import os
import subprocess
import sys
import tempfile
from PIL import Image, ImageDraw, ImageFont

AQUI = os.path.dirname(os.path.abspath(__file__))
REEL = os.path.dirname(AQUI)
REPO = os.path.dirname(os.path.dirname(REEL))
VIDEO = os.path.join(REEL, 'output', 'uaipertim-pedir-no-uaipertim.mp4')
CENA = json.load(open(os.path.join(REEL, 'dados', 'cena.json')))
LN = json.load(open(os.path.join(REPO, 'reels', 'explica-so', 'audio', 'pedir-no-uaipertim', 'linha.json')))
EV, DUR, FPS = CENA['eventos'], CENA['duracao'], CENA['fps']
TR = {k['para']: k['tipo'] for k in CENA['trocas']}
MOMENTOS = [
    (EV['gancho']['fome'] + 0.55, 'gancho: freia de lado e "BATEU A FOME?" estoura'),
    (EV['inicio']['toque'] + 0.25, 'as categorias viram adesivos; toque em Lanches'),
    (EV['produto']['bacon'] + 0.3, 'Smash Duplo salta; bacon marca com pop; sacola'),
    (EV['checkout']['maquininha'] + 0.45, 'total R$ 70,80; Pix, cartão e na entrega saltam'),
    (EV['acompanhar']['balao'] + 0.35, 'pagamento confirmado e etapas com "plim"; carimbo 20h35'),
    (EV['pontos']['cupom'] + 0.55, 'chuva de pão de queijo, de 130 para 150 (+20), cupom'),
    (DUR - 1.2, 'logo + "Tá chegando no Glória" + chip; acena'),
]
# --cenas 4,5: um storyboard detalhado só dessas cenas (várias batidas de cada uma), para aprovar uma correção
DETALHE = {
    4: [(EV['checkout']['contador'][1] + 0.1, 'itens na sacola; total R$ 70,80', 3), (EV['checkout']['pix'] + 0.45, '"Pix" salta do Checkout', 3),
        (EV['checkout']['cartao'] + 0.45, '"cartão" salta', 3), (EV['checkout']['maquininha'] + 0.45, '"na entrega": nota e maquininha', 3),
        (EV['checkout']['marca_pix'] + 0.3, '"preferir": o Pix fica marcado', 3), (EV['checkout']['toque_pedido'] + 0.2, '"Fazer pedido" com confete', 3)],
    5: [(EV['acompanhar']['marcas'][0] + 0.35, '"Pagamento confirmado" (plim)', 4), (EV['acompanhar']['marcas'][1] + 0.35, '"Loja aceitou e preparou"', 4),
        (EV['acompanhar']['moto'][0] + 0.55, '"Saiu para entrega"; o Pertim cruza de moto', 4), (EV['acompanhar']['balao'] + 0.35, 'carimbo "CHEGA ATÉ 20h35"', 4)],
}
SAIDA = 'storyboard.png'
if '--cenas' in sys.argv:
    quais = [int(x) for x in sys.argv[sys.argv.index('--cenas') + 1].split(',')]
    MOMENTOS = [(t, f'CENA {n} · {o}', cap) for n in quais for t, o, cap in DETALHE[n]]
    SAIDA = 'storyboard-cenas-' + '-'.join(map(str, quais)) + '.png'
else:
    MOMENTOS = [(t, f'CENA {i + 1}', i, o) for i, (t, o) in enumerate(MOMENTOS)]
    MOMENTOS = [(t, f'{rot} · {o}', cap) for t, rot, cap, o in MOMENTOS]
F = os.path.join(REPO, 'public', 'fonts', 'poppins-latin-800-normal.woff2')
f1, f2, f3 = ImageFont.truetype(F, 26), ImageFont.truetype(F, 18), ImageFont.truetype(F, 17)
TW, TH, G, TXT = 360, 640, 18, 150
sh = Image.new('RGB', (len(MOMENTOS) * (TW + G) + G, 96 + TH + TXT + G), (34, 28, 25))
d = ImageDraw.Draw(sh)
d.text((G, 26), f'"PEDIR NO UAIPERTIM É ASSIM" · {DUR:.2f} s · 1080×1920 · 60 fps · trocas: ' + ' > '.join(TR[k] for k in sorted(TR)),
       font=ImageFont.truetype(F, 30), fill=(249, 178, 51))


def quebra(txt, fonte, larg):
    linhas, cur = [], ''
    for w in txt.split():
        if fonte.getlength((cur + ' ' + w).strip()) > larg:
            linhas.append(cur); cur = w
        else:
            cur = (cur + ' ' + w).strip()
    return linhas + [cur]


with tempfile.TemporaryDirectory() as tmp:
    if '--previa' in sys.argv:
        subprocess.run(['node', os.path.join(REPO, 'reels', 'prazer-pertim', 'scripts', 'quadros.mjs'), tmp, 'PedirNoUaiPertim'] + [f'{t:.3f}' for t, _, _ in MOMENTOS],
                       cwd=REPO, check=True, capture_output=True)
    for i, (t, o_que, cap) in enumerate(MOMENTOS):
        if '--previa' in sys.argv:
            p = os.path.join(tmp, f'PedirNoUaiPertim-{int(round(t * FPS)):05d}.png')
        else:
            p = os.path.join(tmp, f'{i}.png')
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', f'{t:.3f}', '-i', VIDEO, '-frames:v', '1', p], check=True)
        x, y = G + i * (TW + G), 96
        sh.paste(Image.open(p).convert('RGB').resize((TW, TH), Image.LANCZOS), (x, y))
        c = LN['capitulos'][cap]
        rot, o_que = o_que.split(' · ', 1)
        d.text((x, y + TH + 8), f'{rot} · {t:.2f} s', font=f1, fill=(242, 80, 43))
        yy = y + TH + 42
        for l in quebra(o_que, f2, TW):
            d.text((x, yy), l, font=f2, fill=(246, 238, 226)); yy += 22
        for l in quebra('“' + ' '.join(f['texto'] for f in c['frases']) + '”', f3, TW)[:3]:
            d.text((x, yy), l, font=f3, fill=(190, 180, 170)); yy += 21
out = os.path.join(REEL, 'output', SAIDA)
os.makedirs(os.path.dirname(out), exist_ok=True)
sh.save(out)
print('ok', os.path.relpath(out, REPO))
