#!/usr/bin/env python3
"""
Revisão técnica do Reel "Olha ele por dentro!".

    python3 reels/olha-ele-por-dentro/scripts/qa.py

Confere o MP4 final (output/uaipertim-olha-ele-por-dentro.mp4) contra os dados que a composição usa (roteiro.json,
layout.json, dados/{cena,visemas,legenda}.json e a voz) e escreve output/revisao/relatorio-tecnico.txt e
output/revisao/f0-gancho.png:
  • formato: h264 yuv420p 1080×1920 a 30 fps, 24–28 s, AAC 48 kHz estéreo; som: −14 LUFS (±0,5), pico real ≤ −1 dBTP;
  • ritmo: todo corte de cena numa batida (120 BPM = 0,5 s); a fala de cada cena dentro da cena;
  • voz: o roteiro exato, perfil "narracao" (eleven_v4), "UaiPertim"/"Pertim" enviados como "Uai pertím"/"pertím" (grafia
    c) e a tela/legenda sem troca; cada cena UMA geração inteira; "do/no Glória";
  • a pergunta do gancho: o F0 sobe ≥ +8 st da palavra anterior ("por") até o pico na tônica de "dentro";
  • telas: só Main, Loja, Produto, Sacola e Checkout (nunca Cartao.png); o selo "Lojas e valores ilustrativos" fixo
    (pelos pixels, no começo, no meio e no fim); o celular com ~75% da altura;
  • lupas: dentro da zona segura e fora da coluna dos botões; o Pertim no canto, sem cobrir a tela do app (cenas 2–6);
  • legenda: só o texto da tela, até 2 linhas, cada bloco ≥ 0,8 s, dentro da faixa, cobre a fala inteira;
  • boca: nenhuma boca menos de 2 quadros; olhar na câmera;
  • gancho: o quadro muda a cada 0,1 s nos primeiros 0,5 s; a logo do fecho PARADA nos 3 últimos segundos (pixels).
Termina em "RESULTADO: aprovado" ou "RESULTADO: ajustar".
"""
import json
import os
import re
import subprocess
import tempfile
import numpy as np
from PIL import Image, ImageFont
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

AQUI = os.path.dirname(os.path.abspath(__file__))
REEL = os.path.dirname(AQUI)
REPO = os.path.dirname(os.path.dirname(REEL))
EP = 'olha-ele-por-dentro'
AUD = os.path.join(REPO, 'reels', 'explica-so', 'audio', EP)
OUT = os.path.join(REEL, 'output')
REV = os.path.join(OUT, 'revisao')
os.makedirs(REV, exist_ok=True)
VIDEO = os.path.join(OUT, 'uaipertim-olha-ele-por-dentro.mp4')
SRC = os.path.join(REPO, 'src', 'olha-ele-por-dentro', 'OlhaElePorDentro.tsx')
ROT = json.load(open(os.path.join(REEL, 'roteiro.json')))
LAY = json.load(open(os.path.join(REEL, 'layout.json')))
CENA = json.load(open(os.path.join(REEL, 'dados', 'cena.json')))
VIS = json.load(open(os.path.join(REEL, 'dados', 'visemas.json')))
LEG = json.load(open(os.path.join(REEL, 'dados', 'legenda.json')))
LN = json.load(open(os.path.join(AUD, 'linha.json')))
FALAS = json.load(open(os.path.join(AUD, 'voz', 'falas.json')))
EV = CENA['eventos']
DUR, FPS, BT = CENA['duracao'], CENA['fps'], CENA['batida']
ROTEIRO = ['Psiu! Quer ver o UaiPertim por dentro?', 'Logo de cara, as lojas do Glória: lanche, pizza, açaí, padaria, mercado…',
           'Escolheu a loja? O cardápio tá todo aqui, com foto e preço.', 'Quer caprichar? É só marcar.', 'Joga na sacola…',
           '…e paga do jeito que quiser: Pix, cartão ou na entrega.', 'Facim, né? Tá chegando no Glória!']
TELAS_OK = {'Main', 'Loja', 'Produto', 'Sacola', 'Checkout'}
report, fails = [], []


def ok(cond, msg):
    report.append(('OK   ' if cond else 'FALHA') + '  ' + msg)
    if not cond:
        fails.append(msg)


def info(msg):
    report.append('     ' + msg)


def sec(t):
    report.append('')
    report.append(t)


na_batida = lambda x: abs(x / BT - round(x / BT)) < 1e-6
st = lambda a_, b_: 12 * np.log2(b_ / a_)

# ---------------------------------------------------------------- formato e som
sec('FORMATO E SOM')
pr = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', VIDEO], capture_output=True, text=True).stdout)
v = next(s for s in pr['streams'] if s['codec_type'] == 'video')
a = next(s for s in pr['streams'] if s['codec_type'] == 'audio')
fr = eval(v['r_frame_rate'])
dv, da = float(v['duration']), float(a['duration'])
ok(v['codec_name'] == 'h264' and v['pix_fmt'] == 'yuv420p' and (v['width'], v['height']) == (1080, 1920), f'vídeo {v["codec_name"]} {v["pix_fmt"]} {v["width"]}×{v["height"]}')
ok(abs(fr - 30) < 1e-6, f'{fr:g} fps')
ok(24.0 <= dv <= 28.0 + 1e-3, f'duração {dv:.2f} s (24–28 s)')
ok(a['codec_name'] == 'aac' and int(a['sample_rate']) == 48000 and a['channels'] == 2 and abs(dv - da) < 0.05, f'áudio {a["codec_name"]} {a["sample_rate"]} Hz, {a["channels"]} canais, {da:.2f} s')
e = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', VIDEO, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
sm = e[e.rindex('Summary:'):]
I = float(re.search(r'I:\s+(-?[\d.]+) LUFS', sm).group(1))
TP = float(re.search(r'Peak:\s+(-?[\d.]+) dBFS', sm[sm.index('True peak'):]).group(1))
ok(abs(I + 14) <= 0.5, f'{I:.1f} LUFS integrados (alvo −14)')
ok(TP <= -1.0, f'pico real {TP:.1f} dBTP (≤ −1)')

# ---------------------------------------------------------------- ritmo
sec(f'RITMO (trilha animada, {CENA["bpm"]:.0f} BPM: uma batida a cada {BT} s)')
for c in CENA['cenas']:
    ok(na_batida(c['t0']) and na_batida(c['t1']) and c['t0'] <= c['voz_t0'] and c['voz_t1'] <= c['t1'] + 1e-6,
       f'cena {c["n"] + 1} {c["tipo"]}: {c["t0"]:.2f}–{c["t1"]:.2f} s = batidas {c["t0"] / BT:.0f}–{c["t1"] / BT:.0f}; fala {c["voz_t0"]:.2f}–{c["voz_t1"]:.2f} s dentro dela')
info('transições (todas diferentes): a logo da abertura vira a do app · a Loja entra empurrando · o Produto abre a partir do card · '
     'a Sacola sobe como folha · o celular gira (3D) · o celular se afasta')

# ---------------------------------------------------------------- voz
sec('VOZ')
caps = FALAS['capitulos']
ok([caps[f'{i:02d}']['texto'] for i in range(len(ROTEIRO))] == ROTEIRO, 'o texto falado é o roteiro, cena a cena')
ok(all(caps[k]['perfil'] == 'narracao' and caps[k]['modelo'] == 'eleven_v4' for k in caps), 'perfil "narracao" (eleven_v4) em todas as falas')
ok(FALAS['voz'] == 'Victor Pinho' and FALAS['voice_id'] == 'LuQ9eaWO9yCQrR73VQFa', f'voz oficial: {FALAS["voz"]}')
api = ' '.join(caps[k]['texto_api'] for k in sorted(caps))
ok('Uai pertím' in api and not re.search(r'UaiPertim|\bPertim\b|\bpertim\b', api), '"UaiPertim"/"Pertim" vão para a voz como "Uai pertím"/"pertím" (grafia c)')
for k in sorted(caps):
    f = caps[k]
    origem = f.get('tomada', {}).get('arquivo', f'voz.py, seed {f["seed"]}')
    info(f'cena {int(k) + 1}: seed {f["seed"]} · {f["fim_da_fala"] - f["inicio_da_fala"]:.2f} s · enviado "{f["texto_api"]}" · {origem}')
ok(len(LN['colocacao']) == len(ROTEIRO), 'cada cena é UMA geração inteira, colocada sem cortes (linha.json → colocacao)')
todo = json.dumps(ROT, ensure_ascii=False) + open(SRC, encoding='utf-8').read()
ok(not re.search(r'\bde\s+Glória', todo), 'nunca "de Glória" (só "do/no Glória")')

# ---------------------------------------------------------------- a pergunta do gancho
sec('A PERGUNTA DO GANCHO ("Psiu! Quer ver o UaiPertim por dentro?")')
f0c = caps['00']
sr, y = wavfile.read(os.path.join(AUD, 'voz', 'cap-00.wav'))
y = y.astype(np.float64) / 32768
al = f0c['alinhamento']
txt = ''.join(al['characters'])
ts, te = al['character_start_times_seconds'], al['character_end_times_seconds']


def trilha(t0, t1, fmin=70, fmax=400):
    lo = sosfilt(butter(4, 900, 'low', fs=sr, output='sos'), y)
    n = int(0.04 * sr); W_ = n // 2; ks = np.arange(int(sr / fmax), int(sr / fmin)); out = []; t = t0
    while t + 0.04 <= t1:
        fr_ = lo[int(t * sr):int(t * sr) + n]; f = None
        if len(fr_) == n:
            fr_ = fr_ - fr_.mean()
            if np.sqrt(np.mean(fr_ ** 2)) > 0.006:
                d = np.array([np.sum((fr_[:W_] - fr_[k:k + W_]) ** 2) for k in ks]); cm = d / (np.cumsum(d) / np.arange(1, len(d) + 1) + 1e-12)
                idx = np.where(cm < 0.15)[0]
                if len(idx):
                    j = idx[0]
                    while j + 1 < len(cm) and cm[j + 1] < cm[j]:
                        j += 1
                    f = sr / ks[j]
        out.append((t + 0.02, f)); t += 0.01
    return out


i_d, i_p = txt.rindex('dentro'), txt.rindex('por ')
tr = trilha(max(0, ts[0] - 0.05), len(y) / sr)
vz = [(t, f) for t, f in tr if f]
pico = max([(t, f) for t, f in vz if t >= ts[i_d]], key=lambda q: q[1])
antes = [f for t, f in vz if ts[i_p] <= t <= te[i_p + 2] + 0.04]
base = float(np.median(antes))
info(f'tomada usada: {f0c.get("tomada", {}).get("arquivo", "voz.py")} (seed {f0c["seed"]})')
info(f'o F0 sobe de {base:.0f} Hz (mediana de "por") para {pico[1]:.0f} Hz na tônica de "dentro" (em {pico[0]:.2f} s; "den" começa em {ts[i_d]:.2f} s, "tro" em {ts[i_d + 3]:.2f} s)')
ok(st(base, pico[1]) >= 8, f'a pergunta sobe até a tônica: +{st(base, pico[1]):.1f} st (mínimo +8 st)')
try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    fig, ax = plt.subplots(figsize=(10, 4.2), dpi=120)
    ax.plot([t for t, f in tr], [f if f else np.nan for t, f in tr], color='#F2502B', lw=3)
    for c, a_, b_ in zip(al['characters'], ts, te):
        if c.isalpha():
            ax.text((a_ + b_) / 2, 75, c, ha='center', fontsize=10, color='#221C19')
    ax.axvline(pico[0], color='#F9B233', ls='--'); ax.set_ylim(60, 320); ax.set_xlabel('s'); ax.set_ylabel('Hz')
    ax.set_title(f'"Quer ver o UaiPertim por dentro?" — sobe {st(base, pico[1]):+.1f} st até a tônica de "dentro"')
    ax.grid(alpha=0.25); fig.tight_layout(); fig.savefig(os.path.join(REV, 'f0-gancho.png')); plt.close(fig)
    info('gráfico: output/revisao/f0-gancho.png')
except ImportError:
    info('(sem matplotlib: o gráfico do F0 não foi gerado)')

# ---------------------------------------------------------------- telas, celular, lupas e Pertim
sec('TELAS, CELULAR, LUPAS E PERTIM')
src = open(SRC, encoding='utf-8').read()
usadas = set(re.findall(r'nome="(\w+)"', src)) | set(re.findall(r'tela\("(\w+)"\)', src))
ok(usadas <= TELAS_OK and 'Cartao' not in src, f'telas usadas: {", ".join(sorted(usadas))} (só as do roteiro; nunca Cartao.png)')
for n in usadas:
    ok(os.path.exists(os.path.join(REPO, 'public', 'telas-app', 'celular', f'{n}.png')), f'    public/telas-app/celular/{n}.png existe')
CL = LAY['celular']
ok(0.72 <= CL['h'] / 1920 <= 0.78 and CL['x'] + CL['w'] <= LAY['seguro'][2], f'celular com {CL["h"]} px = {CL["h"] / 1920:.0%} da altura, x {CL["x"]}–{CL["x"] + CL["w"]} (fora da coluna dos botões)')
LP = LAY['lupa']
ok(LP['y0'] >= LAY['seguro'][1] and LP['y1'] < LAY['botoes'][1] and LP['x1'] + 16 <= LAY['botoes'][0] + 10, f'as lupas ficam em x {LP["x0"]}–{LP["x1"]}, y {LP["y0"]}–{LP["y1"]} (zona segura, fora da coluna dos botões)')
bz = CL['w'] * CL['bezel']
tela_x0 = CL['x'] + bz
pc = LAY['pertim']['canto']
# a pose mais larga do canto ("apontando"): o desenho vai até 0,449 da largura à direita do centro (medido no SVG)
dir_ = pc['cx'] + 0.449 * pc['altura'] * 280 / 284
ok(dir_ <= tela_x0, f'o Pertim do canto (até x {dir_:.0f}) não cobre a tela do app (que começa em x {tela_x0:.0f})')
ok(pc['base'] <= LAY['legenda']['faixa'][1], f'o Pertim pisa em y {pc["base"]}, acima da faixa da legenda (y {LAY["legenda"]["faixa"][1]})')
ok('olhar: [0, 0], centro: true' in src and src.count('olhar:') == 1, 'olhar sempre na câmera (pupilas centradas)')

# ---------------------------------------------------------------- legenda
sec('LEGENDA GRAVADA')
st_ = LEG['estilo']
fonte = ImageFont.truetype(os.path.join(REPO, 'public', 'fonts', 'poppins-latin-800-normal.woff2'), st_['size'])
x0, y0, x1, y1 = st_['faixa']
bl = LEG['blocos']
ok(all(len(b['linhas']) <= 2 for b in bl), f'{len(bl)} blocos, todos com até 2 linhas')
ok(all(b['t1'] - b['t0'] >= st_['minDur'] - 1e-3 for b in bl), f'cada bloco ≥ {st_["minDur"]} s (menor: {min(b["t1"] - b["t0"] for b in bl):.2f} s)')
larg = max(fonte.getlength(' '.join(w['w'] for w in l)) for b in bl for l in b['linhas'])
ok(larg + 2 * st_['padX'] <= x1 - x0 + 1, f'a linha mais larga ({larg + 2 * st_["padX"]:.0f} px) cabe na faixa (x {x0}–{x1})')
pals = [w['w'] for b in bl for l in b['linhas'] for w in l]
ok(not any(re.search(r'pertím|Uai$', p) for p in pals) and 'UaiPertim' in pals, 'só o texto da tela ("UaiPertim", nunca a grafia enviada à voz)')
ok(' '.join(pals) == ' '.join(ROTEIRO), 'cobre a fala inteira, na ordem (no fecho também: "Tá chegando no Glória!" não está escrito na tela)')
info(f'a legenda sai em {max(b["t1"] for b in bl):.2f} s; os {DUR - max(b["t1"] for b in bl):.2f} s finais ficam só com a logo, a frase e o selo')

# ---------------------------------------------------------------- boca
sec('BOCA')
bocas = VIS['bocas']
runs, q = [], 0
while q < len(bocas):
    j = q
    while j < len(bocas) and bocas[j] == bocas[q]:
        j += 1
    runs.append(j - q); q = j
ok(min(runs[1:-1] or [2]) >= 2, f'nenhuma boca com menos de 2 quadros ({len(bocas)} quadros, {len(runs)} trechos)')
ok(set('AEOM') <= set(bocas), 'as bocas A, E, O e M/B/P aparecem na fala')

# ---------------------------------------------------------------- pixels
sec('PELOS PIXELS DO VÍDEO')
with tempfile.TemporaryDirectory() as tmp:
    def quadro(t):
        p = os.path.join(tmp, f'{t:.3f}.png')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t:.3f}', '-i', VIDEO, '-frames:v', '1', p], check=True)
        return np.asarray(Image.open(p).convert('RGB')).astype(np.int16)
    qs = [quadro(t) for t in (0.0, 0.1, 0.2, 0.3, 0.4, 0.5)]
    dif = [np.mean(np.abs(a_ - b_)) for a_, b_ in zip(qs, qs[1:])]
    ok(min(dif) > 0.3, 'o quadro muda a cada 0,1 s nos primeiros 0,5 s (diferença média ' + ', '.join(f'{d:.1f}' for d in dif) + ')')
    # o selo: a faixa dele igual no começo, no meio e no fim (está sempre lá, parado)
    sy = LAY['selo']['y']
    caixa = lambda q_: q_[sy + 4:sy + 26, 400:680]
    sel = [caixa(quadro(t)) for t in (0.2, DUR * 0.5, DUR - 0.2)]
    escuro = [int(np.sum(np.mean(s, axis=2) < 120)) for s in sel]
    ok(min(escuro) > 150, f'o selo "{LAY["selo"]["texto"]}" aparece no começo, no meio e no fim ({", ".join(map(str, escuro))} px de texto)')
    lg = LAY['fecho']['logo']
    cx, cy, r = lg['cx'], lg['cy'], lg['d'] // 2 - 10
    yy, xx = np.mgrid[-r:r, -r:r]
    dentro = (xx ** 2 + yy ** 2) <= r ** 2                         # só o disco da logo (os raios do fundo giram nos cantos)
    recs = [quadro(t)[cy - r:cy + r, cx - r:cx + r][dentro] for t in (DUR - 3.0, DUR - 2.0, DUR - 1.0, DUR - 1 / FPS - 0.01)]
    mx = max(np.mean(np.abs(recs[0] - x)) for x in recs[1:])
    ok(mx < 2.0, f'a logo fica PARADA nos 3 últimos segundos (diferença máxima {mx:.2f} na caixa da logo)')
    ok(EV['fecho']['logo']['parada'] <= DUR - 3.0, f'a logo para em {EV["fecho"]["logo"]["parada"]:.2f} s ({DUR - EV["fecho"]["logo"]["parada"]:.2f} s antes do fim)')

sec(f'RESULTADO: {"aprovado" if not fails else "ajustar"}')
if fails:
    report.append('  ' + '\n  '.join(fails))
cab = [f'REVISÃO TÉCNICA · Reel "Olha ele por dentro!" (@uaipertim) · {os.path.relpath(VIDEO, REPO)}', f'{DUR:.2f} s · {int(round(DUR * FPS))} quadros a {FPS} fps']
open(os.path.join(REV, 'relatorio-tecnico.txt'), 'w').write('\n'.join(cab + report) + '\n')
print('\n'.join(cab + report))
