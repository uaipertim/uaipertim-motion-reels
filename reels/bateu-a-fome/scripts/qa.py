#!/usr/bin/env python3
"""
Revisão técnica do Reel "Bateu a fome?".

    python3 reels/bateu-a-fome/scripts/qa.py            (o vídeo final)
    python3 reels/bateu-a-fome/scripts/qa.py --previa   (a prévia de output/previa/ → revisao/relatorio-previa.txt)

Confere o MP4 final (output/uaipertim-bateu-a-fome.mp4) contra os mesmos dados que a composição usa (roteiro.json,
layout.json, dados/{cena,visemas,legenda}.json e a voz) e escreve output/revisao/relatorio-tecnico.txt e
output/revisao/f0-gancho.png (o F0 da pergunta do gancho):
  • formato: h264 yuv420p 1080×1920 a 30 fps, 22–26 s, AAC 48 kHz estéreo;
  • som: −14 LUFS integrados (±0,5), pico real ≤ −1 dBTP;
  • ritmo: todo corte de cena numa batida da trilha (120 BPM = 0,5 s); a fala de cada cena dentro da cena; o desfile com
    uma palavra por batida e cada sílaba depois da sua palavra entrar;
  • voz: o roteiro exato, perfil "narracao" (eleven_v4), "UaiPertim"/"Pertim" enviados sem troca, cada cena UMA
    geração inteira; "do/no Glória"; sem preço (R$) nem nome de loja no roteiro e na composição;
  • legenda: só o texto da tela, até 2 linhas, cada bloco ≥ 0,8 s, dentro da faixa e da zona segura, cobre a fala até
    "UaiPertim." e sai antes dos 3 últimos segundos;
  • boca: nenhuma boca menos de 2 quadros; olhar na câmera (o rig usa olhar [0, 0] com a pupila centrada);
  • gancho: o quadro muda a cada 0,1 s nos primeiros 0,5 s; logo oficial PARADA nos 3 últimos segundos (pelos pixels);
  • a pergunta do gancho: o F0 sobe ≥ +8 st de "aquela" até a tônica "FO" (o contorno natural da pergunta em português:
    sobe na tônica e cai na postônica), medido na voz usada no vídeo;
  • cena 3: a grade 3×3 inteira dentro da moldura (modal), com a mesma margem interna nos 4 lados, e nada escuro fora
    dela a partir de "lugar" (pelos pixels); a legenda abaixo da moldura, sem encostar;
  • cena 5: a foto com 55–60% da largura, na metade de baixo, e a legenda abaixo dela.
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
EP = 'bateu-a-fome'
AUD = os.path.join(REPO, 'reels', 'explica-so', 'audio', EP)
OUT = os.path.join(REEL, 'output')
REV = os.path.join(OUT, 'revisao')
os.makedirs(REV, exist_ok=True)
import sys
PREVIA = '--previa' in sys.argv            # confere a prévia (output/previa/) e grava revisao/relatorio-previa.txt
VIDEO = os.path.join(OUT, 'previa', 'uaipertim-bateu-a-fome-previa.mp4') if PREVIA else os.path.join(OUT, 'uaipertim-bateu-a-fome.mp4')
ROT = json.load(open(os.path.join(REEL, 'roteiro.json')))
LAY = json.load(open(os.path.join(REEL, 'layout.json')))
CENA = json.load(open(os.path.join(REEL, 'dados', 'cena.json')))
VIS = json.load(open(os.path.join(REEL, 'dados', 'visemas.json')))
LEG = json.load(open(os.path.join(REEL, 'dados', 'legenda.json')))
LN = json.load(open(os.path.join(AUD, 'linha.json')))
FALAS = json.load(open(os.path.join(AUD, 'voz', 'falas.json')))
EV = CENA['eventos']
DUR, FPS, BT = CENA['duracao'], CENA['fps'], CENA['batida']
ROTEIRO = [
    'Bateu aquela fome?', 'Uai... tem UaiPertim!', 'As lojas do Glória, tudo num lugar só.', 'Na palma da sua mão.',
    'Pão de queijo, hambúrguer, pizza, açaí... e até o mercado!', 'Paga no Pix, no cartão ou na entrega.', 'E o Pertim leva rapidim!',
    'Chegou!', 'Foi facim! UaiPertim. Tudo pertim de você.',
]
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

# ---------------------------------------------------------------- formato
sec('FORMATO')
pr = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', VIDEO], capture_output=True, text=True).stdout)
v = next(s for s in pr['streams'] if s['codec_type'] == 'video')
a = next(s for s in pr['streams'] if s['codec_type'] == 'audio')
fr = eval(v['r_frame_rate'])
dv, da = float(v['duration']), float(a['duration'])
ok(v['codec_name'] == 'h264' and v['pix_fmt'] == 'yuv420p', f'vídeo {v["codec_name"]} {v["pix_fmt"]}')
ok((v['width'], v['height']) == (1080, 1920), f'{v["width"]}×{v["height"]}')
ok(abs(fr - 30) < 1e-6, f'{fr:g} fps')
ok(22.0 <= dv <= 26.0 + 1e-3, f'duração {dv:.2f} s (22–26 s)')
ok(a['codec_name'] == 'aac' and int(a['sample_rate']) == 48000 and a['channels'] == 2, f'áudio {a["codec_name"]} {a["sample_rate"]} Hz, {a["channels"]} canais')
ok(abs(dv - da) < 0.05, f'vídeo {dv:.3f} s × áudio {da:.3f} s')

# ---------------------------------------------------------------- som
sec('SOM')
e = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', VIDEO, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
sm = e[e.rindex('Summary:'):]
I = float(re.search(r'I:\s+(-?[\d.]+) LUFS', sm).group(1))
TP = float(re.search(r'Peak:\s+(-?[\d.]+) dBFS', sm[sm.index('True peak'):]).group(1))
ok(abs(I + 14) <= 0.5, f'{I:.1f} LUFS integrados (alvo −14)')
ok(TP <= -1.0, f'pico real {TP:.1f} dBTP (≤ −1)')

# ---------------------------------------------------------------- ritmo: os cortes nas batidas
sec(f'RITMO (trilha animada, {CENA["bpm"]:.0f} BPM: uma batida a cada {BT} s)')
for c in CENA['cenas']:
    ok(na_batida(c['t0']) and na_batida(c['t1']), f'cena {c["n"] + 1} {c["tipo"]}: {c["t0"]:.2f}–{c["t1"]:.2f} s = batidas {c["t0"] / BT:.0f}–{c["t1"] / BT:.0f}')
    ok(c['t0'] <= c['voz_t0'] and c['voz_t1'] <= c['t1'], f'    a fala ({c["voz_t0"]:.2f}–{c["voz_t1"]:.2f} s) fica dentro da cena')
it = EV['desfile']['itens']
for k, x in enumerate(it):
    ok(na_batida(x['entra']), f'desfile: "{"-".join(s["t"] for s in x["silabas"])}" entra na batida {x["entra"] / BT:.0f} ({x["entra"]:.2f} s)')
    ok(all(s['t0'] >= x['entra'] - 1e-6 for s in x['silabas']) and (k + 1 == len(it) or x['fim_fala'] <= it[k + 1]['entra'] + 0.05),
       '    as sílabas entram depois da palavra e a palavra termina antes da seguinte')
info('as transições (todas diferentes): íris coral do impacto do pin · empurra para baixo · zoom-out para o celular · zoom para '
     'dentro da tela · varrida lateral entre as palavras · três faixas caindo · chicote horizontal · mapa empurrado · íris verde '
     'da porta · faixa diagonal amarela')

# ---------------------------------------------------------------- voz
sec('VOZ')
caps = FALAS['capitulos']
ok([caps[f'{i:02d}']['texto'] for i in range(len(ROTEIRO))] == ROTEIRO, 'o texto falado é o roteiro, cena a cena')
ok(all(caps[k]['perfil'] == 'narracao' and caps[k]['modelo'] == 'eleven_v4' for k in caps), 'perfil "narracao" (eleven_v4) em todas as falas')
ok(FALAS['voz'] == 'Victor Pinho' and FALAS['voice_id'] == 'LuQ9eaWO9yCQrR73VQFa', f'voz oficial: {FALAS["voz"]}')
api = ' '.join(caps[k]['texto_api'] for k in sorted(caps))
# a grafia do "Pertim" enviada à voz é a do roteiro (campo "pronuncia" de cada fala; sem o campo, sem troca) e a tela não muda
gr = {k: re.findall(r'(?:Uai ?)?[Pp][ée]rr?-?t[ií]m?[ĩ]?|(?:Uai ?)?[Pp]érti\b', caps[k]['texto_api']) for k in caps}
ok(all((ROT['capitulos'][int(k)].get('pronuncia') or {}) or not re.search(r'P[ée]rr|Pért|pertí', caps[k]['texto_api']) for k in caps),
   'o "Pertim" vai para a voz com a grafia do roteiro (tela e legenda sem troca)')
for k in ('01', '06', '08'):
    info(f'cena {int(k) + 1}: o "Pertim" enviado como {", ".join(gr[k]) or "(sem troca)"} · pronuncia no roteiro: {ROT["capitulos"][int(k)].get("pronuncia") or "nenhuma (sem troca)"}')
for k in sorted(caps):
    f = caps[k]
    origem = f.get('tomada', {}).get('arquivo', f'voz.py, seed {f["seed"]}')
    info(f'cena {int(k) + 1}: seed {f["seed"]} · {f["fim_da_fala"] - f["inicio_da_fala"]:.2f} s · enviado "{f["texto_api"]}" · {origem}')
ok(all(c['de_s'] >= 0 for c in LN['colocacao']) and len(LN['colocacao']) == len(ROTEIRO), 'cada cena é UMA geração inteira, colocada sem cortes (linha.json → colocacao)')
todo = json.dumps(ROT, ensure_ascii=False) + open(os.path.join(REPO, 'src', 'bateu-a-fome', 'BateuAFome.tsx'), encoding='utf-8').read()
ok(not re.search(r'\bde\s+Glória', todo), 'nunca "de Glória" (só "do/no Glória")')
ok('R$' not in todo and not re.search(r'\d+,\d\d', ' '.join(ROTEIRO)), 'sem preço')
ok(not re.search(r'Burger do Glória|Varanda|Smash', todo), 'sem nome de loja real')

# ---------------------------------------------------------------- a pergunta do gancho (F0)
sec('A PERGUNTA DO GANCHO ("Bateu aquela fome?")')
f0c = caps['00']
sr, y = wavfile.read(os.path.join(AUD, 'voz', 'cap-00.wav'))
y = y.astype(np.float64) / 32768
al = f0c['alinhamento']
txt = ''.join(al['characters'])
i0 = txt.lower().rindex('fome')
ts, te = al['character_start_times_seconds'], al['character_end_times_seconds']


def trilha(t0, t1, fmin=70, fmax=400):
    lo = sosfilt(butter(4, 900, 'low', fs=sr, output='sos'), y)
    n = int(0.04 * sr); W = n // 2; ks = np.arange(int(sr / fmax), int(sr / fmin)); out = []; t = t0
    while t + 0.04 <= t1:
        fr_ = lo[int(t * sr):int(t * sr) + n]; f = None
        if len(fr_) == n:
            fr_ = fr_ - fr_.mean()
            if np.sqrt(np.mean(fr_ ** 2)) > 0.006:
                d = np.array([np.sum((fr_[:W] - fr_[k:k + W]) ** 2) for k in ks]); cm = d / (np.cumsum(d) / np.arange(1, len(d) + 1) + 1e-12)
                idx = np.where(cm < 0.15)[0]
                if len(idx):
                    j = idx[0]
                    while j + 1 < len(cm) and cm[j + 1] < cm[j]:
                        j += 1
                    f = sr / ks[j]
        out.append((t + 0.02, f)); t += 0.01
    return out


tr = trilha(max(0, ts[0] - 0.05), len(y) / sr)
vz = [(t, f) for t, f in tr if f]
fo = [(t, f) for t, f in vz if t >= ts[i0]]
pico = max(fo, key=lambda q: q[1])
ia = txt.index('aquela')                                     # o F0 de partida: a mediana de "aquela"
antes = [f for t, f in vz if ts[ia] <= t <= te[ia + 5] + 0.04]
base = float(np.median(antes)) if antes else pico[1]
fim = float(np.median([f for t, f in fo[-3:]]))
st = lambda a_, b_: 12 * np.log2(b_ / a_)
info(f'tomada usada: {f0c.get("tomada", {}).get("arquivo", "voz.py")} (seed {f0c["seed"]}, enviado "{f0c["texto_api"]}")')
info(f'o F0 sobe de {base:.0f} Hz (mediana de "aquela") para {pico[1]:.0f} Hz na tônica "FO" ({st(base, pico[1]):+.1f} st, em {pico[0]:.2f} s)')
info(f'fim do trecho com voz (o "-me" sai grave e quase sem voz): {fim:.0f} Hz = {st(pico[1], fim):+.1f} st em relação ao pico (o contorno é sobe-na-tônica-e-cai)')
ok(st(base, pico[1]) >= 8, f'a pergunta sobe até a tônica "FO": +{st(base, pico[1]):.1f} st (mínimo +8 st)')
try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    fig, ax = plt.subplots(figsize=(10, 4.2), dpi=120)
    xs = [t for t, f in tr]; ys = [f if f else np.nan for t, f in tr]
    ax.plot(xs, ys, color='#F2502B', lw=3, label='F0 (tomada usada)')
    for c, a_, b_ in zip(al['characters'], ts, te):
        if c.isalpha():
            ax.text((a_ + b_) / 2, 75, c, ha='center', fontsize=11, color='#221C19')
    ax.axvline(pico[0], color='#F9B233', ls='--'); ax.set_ylim(60, 300); ax.set_xlabel('s'); ax.set_ylabel('Hz')
    ax.set_title(f'"Bateu aquela fome?" — sobe {st(base, pico[1]):+.1f} st até o FO, termina {st(pico[1], fim):+.1f} st do pico')
    ax.grid(alpha=0.25); fig.tight_layout(); fig.savefig(os.path.join(REV, 'f0-gancho.png')); plt.close(fig)
    info('gráfico: output/revisao/f0-gancho.png')
except ImportError:
    info('(sem matplotlib: o gráfico do F0 não foi gerado)')

# ---------------------------------------------------------------- cena 3: a grade dentro da moldura
sec('CENA 3 · AS LOJAS DENTRO DA MOLDURA')
G = EV['lojas']['grade']
k_ = G['k']
ix0, iy0, ix1, iy1 = G['interno']
vis = [G['cx'][0] - 98 * k_, G['base'][0] - 263 * k_, G['cx'][2] + 98 * k_, G['base'][2] + G['calcada'][1]]   # a caixa visível das 9 lojinhas
mg = [vis[0] - ix0, vis[1] - iy0, ix1 - vis[2], iy1 - vis[3]]
ok(min(mg) > 0 and max(mg) - min(mg) < 1.0, f'as 9 lojinhas (largura {G["w"]:.0f} px) ficam dentro da moldura, margem interna esquerda/cima/direita/baixo = ' + ' / '.join(f'{m:.1f}' for m in mg) + ' px')
ok(all(G['cx'][c + 1] - G['cx'][c] >= 196 * k_ for c in range(2)) and G['passo'] >= 263 * k_ + G['calcada'][1], 'nenhuma lojinha encosta na outra (vão horizontal ' + f'{G["gx"]:.0f} px, vertical {G["passo"] - 263 * k_ - G["calcada"][1]:.0f} px)')
mx0, my0, mx1, my1 = G['moldura']
tops = [LEG['estilo']['base'] - (len(b['linhas']) * LEG['estilo']['lh'] + 2 * LEG['estilo']['padY']) for b in LEG['blocos'] if b['cena'] == 2]
ok(min(tops) - (my1 + G['esp'] / 2) >= 20, f'a legenda da cena (topo em y {min(tops)}) fica {min(tops) - (my1 + G["esp"] / 2):.0f} px abaixo da moldura (y {my1 + G["esp"] / 2:.0f})')
ok(mx1 + G['esp'] / 2 <= LAY['seguro'][2], f'a moldura (x {mx0 - G["esp"] / 2:.0f}–{mx1 + G["esp"] / 2:.0f}) fica fora da coluna dos botões (x ≥ {LAY["seguro"][2]})')

# ---------------------------------------------------------------- cena 5: a foto do desfile
sec('CENA 5 · O DESFILE')
DF = LAY['desfile']
fd = DF['foto']
ok(0.55 <= fd['d'] / 1080 <= 0.60, f'a foto tem {fd["d"]} px = {fd["d"] / 1080:.0%} da largura (55–60%)')
tops5 = [LEG['estilo']['base'] - (len(b['linhas']) * LEG['estilo']['lh'] + 2 * LEG['estilo']['padY']) for b in LEG['blocos'] if b['cena'] == 4]
pe = fd['cy'] + fd['d'] / 2
ok(min(tops5) - pe >= 20, f'a foto termina em y {pe:.0f}; a legenda começa em y {min(tops5)} (nunca por cima da foto)')
ok(fd['cy'] - fd['d'] / 2 >= DF['texto']['y1'], f'as palavras (y {DF["texto"]["y0"]}–{DF["texto"]["y1"]}) ficam acima da foto (y {fd["cy"] - fd["d"] / 2:.0f}–{pe:.0f})')

# ---------------------------------------------------------------- legenda
sec('LEGENDA GRAVADA')
st_ = LEG['estilo']
fonte = ImageFont.truetype(os.path.join(REPO, 'public', 'fonts', 'poppins-latin-800-normal.woff2'), st_['size'])
x0, y0, x1, y1 = st_['faixa']
bl = LEG['blocos']
ok(all(len(b['linhas']) <= 2 for b in bl), f'{len(bl)} blocos, todos com até 2 linhas')
ok(all(b['t1'] - b['t0'] >= st_['minDur'] - 1e-3 for b in bl), f'cada bloco ≥ {st_["minDur"]} s (menor: {min(b["t1"] - b["t0"] for b in bl):.2f} s)')
larg = max(fonte.getlength(' '.join(w['w'] for w in l)) for b in bl for l in b['linhas'])
ok(larg + 2 * st_['padX'] <= x1 - x0 + 1, f'a linha mais larga ({larg + 2 * st_["padX"]:.0f} px) cabe na faixa ({x1 - x0} px), entre x {x0} e {x1}')
ok(y1 <= LAY['seguro'][3] and y0 >= LAY['cena_max_y'], f'a faixa (y {y0}–{y1}) fica abaixo das cenas (y ≤ {LAY["cena_max_y"]}) e dentro da zona segura')
pals = [w['w'] for b in bl for l in b['linhas'] for w in l]
ok(not any(re.search(r'Pért|Pérr|fome\?\?', p) for p in pals), 'só o texto da tela (nunca a grafia enviada à voz)')
fala_leg = ' '.join(ROTEIRO[:-1]) + ' Foi facim! UaiPertim.'
ok(' '.join(pals) == fala_leg, 'cobre a fala inteira, na ordem (no fecho, até "UaiPertim."; "Tudo pertim de você." é o texto grande da tela)')
ok(max(b['t1'] for b in bl) <= DUR - 3.0 + 1e-3, f'sai em {max(b["t1"] for b in bl):.2f} s: os 3 últimos segundos ficam sem legenda')

# ---------------------------------------------------------------- personagem
sec('PERTIM')
bocas = VIS['bocas']
runs, q = [], 0
while q < len(bocas):
    j = q
    while j < len(bocas) and bocas[j] == bocas[q]:
        j += 1
    runs.append(j - q); q = j
ok(min(runs[1:-1] or [2]) >= 2, f'nenhuma boca com menos de 2 quadros ({len(bocas)} quadros, {len(runs)} trechos)')
ok(set('AEOM') <= set(bocas), 'as bocas A, E, O e M/B/P aparecem na fala')
src = open(os.path.join(REPO, 'src', 'bateu-a-fome', 'BateuAFome.tsx'), encoding='utf-8').read()
ok('olhar: [0, 0], centro: true' in src and 'olhar:' not in src.replace('olhar: [0, 0], centro: true', ''), 'olhar sempre na câmera (pupilas centradas) quando ele aparece')
info('o Pertim aparece de frente em: ' + ', '.join(f'{a_:.2f}–{b_:.2f} s' for a_, b_ in CENA['aparece']) + ' (gancho, motinha, fecho), sempre falando com a boca da voz')

# ---------------------------------------------------------------- gancho e fecho, pelos pixels do vídeo
sec('GANCHO E FECHO (pelos pixels)')
with tempfile.TemporaryDirectory() as tmp:
    def quadro(t):
        p = os.path.join(tmp, f'{t:.3f}.png')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t:.3f}', '-i', VIDEO, '-frames:v', '1', p], check=True)
        return np.asarray(Image.open(p).convert('RGB')).astype(np.int16)
    E3 = EV['lojas']
    G = E3['grade']
    mx0, my0, mx1, my1 = G['moldura']
    for tq in (E3['para'] + 0.05, (E3['para'] + E3['moldura']) / 2, E3['moldura'] + 0.4, CENA['cenas'][2]['t1'] - 0.25):
        q = quadro(tq)
        luma = 0.299 * q[..., 0] + 0.587 * q[..., 1] + 0.114 * q[..., 2]
        fora = np.ones(luma.shape, bool)
        fora[:265] = False; fora[1320:] = False                                   # fora da zona da cena (o topo e a faixa da legenda)
        fora[int(my0 - G['esp']):int(my1 + G['esp']) + 1, int(mx0 - G['esp']):int(mx1 + G['esp']) + 1] = False
        n = int(np.sum((luma < 60) & fora))
        ok(n < 40, f'cena 3 em {tq:.2f} s: nada das lojinhas fora da moldura ({n} pixels escuros fora dela)')
    qs = [quadro(t) for t in (0.0, 0.1, 0.2, 0.3, 0.4, 0.5)]
    dif = [np.mean(np.abs(a_ - b_)) for a_, b_ in zip(qs, qs[1:])]
    ok(min(dif) > 0.3, 'o quadro muda a cada 0,1 s nos primeiros 0,5 s (diferença média ' + ', '.join(f'{d:.1f}' for d in dif) + ')')
    lg = LAY['fecho']['logo']
    cx, cy, r = lg['cx'], lg['cy'], lg['d'] // 2 - 10
    ts_ = [DUR - 3.0, DUR - 2.0, DUR - 1.0, DUR - 1 / FPS - 0.01]
    recs = [quadro(t)[cy - r:cy + r, cx - r:cx + r] for t in ts_]
    mx = max(np.mean(np.abs(recs[0] - x)) for x in recs[1:])
    ok(mx < 2.0, f'a logo oficial fica PARADA nos 3 últimos segundos (diferença máxima {mx:.2f} na caixa da logo)')
    ok(EV['fecho']['logo']['parada'] <= DUR - 3.0, f'a logo para em {EV["fecho"]["logo"]["parada"]:.2f} s ({DUR - EV["fecho"]["logo"]["parada"]:.2f} s antes do fim)')

sec(f'RESULTADO: {"aprovado" if not fails else "ajustar"}')
if fails:
    report.append('  ' + '\n  '.join(fails))
cab = [f'REVISÃO TÉCNICA · Reel "Bateu a fome?" (@uaipertim) · {os.path.relpath(VIDEO, REPO)}', f'{DUR:.2f} s · {int(round(DUR * FPS))} quadros a {FPS} fps']
open(os.path.join(REV, 'relatorio-previa.txt' if PREVIA else 'relatorio-tecnico.txt'), 'w').write('\n'.join(cab + report) + '\n')
print('\n'.join(cab + report))
