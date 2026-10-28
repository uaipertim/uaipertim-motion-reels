#!/usr/bin/env python3
"""
Storyboard de um episódio da série EXPLICA, SÔ!: para cada capítulo, um quadro do meio da montagem da cena
(entre a primeira e a última peça) e o quadro do capítulo pronto (logo antes da troca).

    python3 scripts/storyboard.py explica-so-01            ->  output/explica-so-01/storyboard.jpg
    python3 scripts/storyboard.py explica-so-01 --previa   ->  output/explica-so-01/previa/storyboard.jpg (tempos estimados, sem voz)
"""
import json
import os
import subprocess
import sys
import tempfile
import textwrap
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EP = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else 'explica-so-01'
PREVIA = '--previa' in sys.argv
OUTD = os.path.join(ROOT, 'output', EP, 'previa') if PREVIA else os.path.join(ROOT, 'output', EP)
VIDEO = os.path.join(OUTD, f'uaipertim-{EP}.mp4')
LN = json.load(open(os.path.join(ROOT, 'audio', EP, 'previa' if PREVIA else '', 'linha.json')))
MOT = json.load(open(os.path.join(OUTD, 'revisao', 'motor.json')))
EPJ = json.load(open(os.path.join(ROOT, 'episodios', EP + '.json'), encoding='utf-8'))
FONT = os.path.join(ROOT, '..', '..', 'public', 'fonts', 'poppins-latin-800-normal.woff2')
FONT_M = os.path.join(ROOT, '..', '..', 'public', 'fonts', 'poppins-latin-500-normal.woff2')
TW, TH, PAD, LAB = 270, 480, 10, 112
COLS = 4                                                  # dois capítulos por linha (montagem + pronto)
caps = LN['capitulos']
quadros = []
for c, m in zip(caps, MOT['montagens']):
    meio = (m['primeira'] + m['ultima']) / 2 if m['ultima'] > m['primeira'] else (c['t0'] + c['t1']) / 2
    meio = min(max(meio, c['t0'] + 0.6), c['t1'] - 0.6)
    if c['n'] == 0:
        meio = 0.0 if not EPJ.get('capa_separada') else 0.6   # o capítulo 00: o quadro 0 (a capa) ou, com a capa separada, o gancho já montado
    fala = ' '.join(f['texto'] for f in c['fala']) if 'fala' in c else ' '.join(f['texto'] for f in c['frases'])
    quadros.append((c, meio, 'montagem' if c['n'] else ('gancho' if EPJ.get('capa_separada') else 'quadro 0 = capa'), fala))
    quadros.append((c, c['t1'] - 0.2, 'pronto', fala))
rows = (len(quadros) + COLS - 1) // COLS
font = ImageFont.truetype(FONT, 17)
small = ImageFont.truetype(FONT_M, 14)
with tempfile.TemporaryDirectory() as tmp:
    sheet = Image.new('RGB', (COLS * (TW + PAD) + PAD + PAD, rows * (TH + LAB + PAD) + PAD), (246, 238, 226))
    dr = ImageDraw.Draw(sheet)
    for i, (c, t, tipo, fala) in enumerate(quadros):
        pth = os.path.join(tmp, f'{i}.png')
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', f'{t:.3f}', '-i', VIDEO, '-frames:v', '1', pth], check=True)
        im = Image.open(pth).convert('RGB').resize((TW, TH), Image.LANCZOS)
        col = i % COLS
        x = PAD + col * (TW + PAD) + (PAD if col >= 2 else 0)
        y = PAD + (i // COLS) * (TH + LAB + PAD)
        sheet.paste(im, (x, y))
        rot = c['rotulo'] if c['n'] else 'CAPA'
        dr.text((x, y + TH + 6), f'{c["n"]:02d} · {rot}', font=font, fill=(242, 80, 43))
        dr.text((x, y + TH + 28), f'{tipo} · {t:.1f} s', font=small, fill=(34, 28, 25))
        if i % 2 == 0:
            for k, ln in enumerate(textwrap.wrap(fala, 64)[:3]):
                dr.text((x, y + TH + 50 + 18 * k), ln, font=small, fill=(110, 98, 90))
    sheet.save(os.path.join(OUTD, 'storyboard.jpg'), quality=88)
print(f'ok -> {os.path.relpath(os.path.join(OUTD, "storyboard.jpg"), ROOT)}')
