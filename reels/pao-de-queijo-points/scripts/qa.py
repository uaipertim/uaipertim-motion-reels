#!/usr/bin/env python3
"""
Revisão técnica do Reel "Pão de Queijo Points" (sem API).

    node reels/pao-de-queijo-points/scripts/render.mjs mascara      (antes: as máscaras da legenda e do conteúdo)
    python3 reels/pao-de-queijo-points/scripts/qa.py

Confere e grava reels/pao-de-queijo-points/output/revisao/relatorio-tecnico.txt (+ f0-cena-6.png):
  • formato: H.264 yuv420p 1080×1920, 30 fps, 25–30 s, AAC 48 kHz estéreo; −14 LUFS e pico real ≤ −1 dBTP;
  • ritmo: todo corte numa batida (120 BPM) e a fala dentro da cena;
  • voz: o texto falado é o do roteiro, Victor Pinho, eleven_v4 (perfil "narracao"); "UaiPertim" foi para a voz como
    "Uai pertím" e "Pertim" nunca foi sem acento; "o Glória" nunca "a Glória"/"de Glória";
  • pitch: a fala marcada com "pergunta": true (a 6) segue a regra das wh-questions: no trecho da pergunta (até o "?"), o
    pico de F0 está na palavra interrogativa ("Qual"); o fim cai, como é natural. Nenhuma outra fala é medida como pergunta;
  • legenda (a nova, da Coisa de mineiro #03): o texto é o da fala, cena a cena; na máscara, fica em x 110–906 e y 1372–1565;
    e o espaço entre as palavras nunca some (em cada quadro, cada linha tem tantos pedaços separados quantas palavras já
    entraram);
  • bordas: na máscara do conteúdo (sem o fundo), nada parado fica cortado nem a menos de 30 px das bordas laterais/de baixo
    (entrando ou saindo, em movimento, pode); nada na coluna de botões do Instagram (x ≥ 940, y 1060–1560);
  • capa: capa-3x4.png 1080×1440, o conteúdo (render sem fundo) em x 135–945.
Termina em "RESULTADO: aprovado" ou "RESULTADO: ajustar".
"""
import json
import os
import re
import subprocess
import sys
import unicodedata
import numpy as np
from PIL import Image
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

AQUI = os.path.dirname(os.path.abspath(__file__))
REEL = os.path.dirname(AQUI)
REPO = os.path.dirname(os.path.dirname(REEL))
EP = 'pao-de-queijo-points'
AUD = os.path.join(REPO, 'reels', 'explica-so', 'audio', EP)
ROT = json.load(open(os.path.join(REEL, 'roteiro.json')))
LAY = json.load(open(os.path.join(REEL, 'layout.json')))
CENA = json.load(open(os.path.join(REEL, 'dados', 'cena.json')))
LEG = json.load(open(os.path.join(REEL, 'dados', 'legenda.json')))
FALAS = json.load(open(os.path.join(AUD, 'voz', 'falas.json')))
OUT = os.path.join(REEL, 'output')
REV = os.path.join(OUT, 'revisao')
os.makedirs(REV, exist_ok=True)
VIDEO = os.path.join(OUT, 'uaipertim-pao-de-queijo-points.mp4')
DUR, FPS, BT = CENA['duracao'], CENA['fps'], CENA['batida']
ROTEIRO = [' '.join(f['texto'] for f in c['fala']) for c in ROT['capitulos']]
ESC = 0.5
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


def faixas(ts):
    out, ini, ant = [], None, None
    for x in ts:
        if ini is None or x - ant > 0.11:
            if ini is not None:
                out.append(f'{ini:.1f}–{ant:.1f} s')
            ini = x
        ant = x
    if ini is not None:
        out.append(f'{ini:.1f}–{ant:.1f} s')
    return ', '.join(out)


na_batida = lambda x: abs(x / BT - round(x / BT)) < 1e-6
st = lambda a_, b_: 12 * np.log2(b_ / a_)

# ---------------------------------------------------------------- formato e som
sec('FORMATO E SOM')
pr = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-of', 'json', VIDEO], capture_output=True, text=True).stdout)
v = next(s for s in pr['streams'] if s['codec_type'] == 'video')
a = next(s for s in pr['streams'] if s['codec_type'] == 'audio')
dv, da = float(v['duration']), float(a['duration'])
ok(v['codec_name'] == 'h264' and v['pix_fmt'] == 'yuv420p' and (v['width'], v['height']) == (1080, 1920), f'vídeo {v["codec_name"]} {v["pix_fmt"]} {v["width"]}×{v["height"]}')
ok(abs(eval(v['r_frame_rate']) - 30) < 1e-6, f'{eval(v["r_frame_rate"]):g} fps')
lim = ROT.get('limites', [25, 30])
ok(lim[0] <= dv <= lim[1] + 1e-3, f'duração {dv:.2f} s ({lim[0]:g}–{lim[1]:g} s)')
ok(a['codec_name'] == 'aac' and int(a['sample_rate']) == 48000 and a['channels'] == 2 and abs(dv - da) < 0.05, f'áudio {a["codec_name"]} {a["sample_rate"]} Hz, {a["channels"]} canais')
e = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', VIDEO, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
sm = e[e.rindex('Summary:'):]
I = float(re.search(r'I:\s+(-?[\d.]+) LUFS', sm).group(1))
TP = float(re.search(r'Peak:\s+(-?[\d.]+) dBFS', sm[sm.index('True peak'):]).group(1))
ok(abs(I + 14) <= 0.5, f'{I:.1f} LUFS integrados (alvo −14)')
ok(TP <= -1.0, f'pico real {TP:.1f} dBTP (≤ −1)')
info(f'trilha animada {ROT.get("trilha_db", -10)} dB abaixo da voz (baixinha; o padrão da animada é −10)')

sec('RITMO (trilha animada, 120 BPM: uma batida a cada 0,5 s)')
for c in CENA['cenas']:
    ok(na_batida(c['t0']) and na_batida(c['t1']) and c['t0'] <= c['voz_t0'] and c['voz_t1'] <= c['t1'] + 1e-6,
       f'cena {c["n"] + 1} {c["tipo"]}: {c["t0"]:.2f}–{c["t1"]:.2f} s = batidas {c["t0"] / BT:.0f}–{c["t1"] / BT:.0f}; fala {c["voz_t0"]:.2f}–{c["voz_t1"]:.2f} s dentro dela')
ok(DUR - CENA['eventos']['fecho']['logo']['parada'] >= 3.0 - 1e-6, f'a logo do fecho fica parada nos últimos {DUR - CENA["eventos"]["fecho"]["logo"]["parada"]:.2f} s (mínimo 3 s)')

# ---------------------------------------------------------------- voz
sec('VOZ')
caps = FALAS['capitulos']
ok([caps[f'{i:02d}']['texto'] for i in range(len(ROTEIRO))] == ROTEIRO, 'o texto falado é o roteiro, cena a cena')
ok(all(caps[k]['perfil'] == 'narracao' and caps[k]['modelo'] == 'eleven_v4' for k in caps) and FALAS['voz'] == 'Victor Pinho'
   and all(caps[k]['voice_id'] == 'LuQ9eaWO9yCQrR73VQFa' for k in caps), 'Victor Pinho (LuQ9eaWO9yCQrR73VQFa), eleven_v4, perfil "narracao"')
api = ' '.join(caps[k]['texto_api'] for k in sorted(caps))
ok('Uai pertím' in api and not re.search(r'UaiPertim|\bPertim\b|\bpertim\b', api), '"UaiPertim" vai para a voz como "Uai pertím" (e "Pertim" nunca sem acento); na tela, "UaiPertim"')
tudo = json.dumps(ROT, ensure_ascii=False) + json.dumps(LEG, ensure_ascii=False)
ok(not re.search(r'\b(a|de|na|da)\s+Glória', tudo), '"o Glória" no masculino (nunca "a/da/na/de Glória")')
ok(not re.search(r'aguarde|não é app|nao e app', tudo, re.I), 'sem "aguarde" e sem "não é app"')
for k in sorted(caps):
    f = caps[k]
    origem = f.get('tomada', {}).get('arquivo', f'voz.py, seed {f["seed"]}')
    info(f'cena {int(k) + 1}: seed {f["seed"]} · {f["fim_da_fala"] - f["inicio_da_fala"]:.2f} s · enviado "{f["texto_api"]}" · {origem}')

# ---------------------------------------------------------------- pitch (a pergunta: regra das wh-questions)
INTERROGATIVAS = {'quanto', 'quanta', 'quantos', 'quantas', 'qual', 'quais', 'onde', 'aonde', 'quem', 'como', 'quando', 'porque'}
PERG = [n for n, c in enumerate(ROT['capitulos']) if c.get('pergunta')]
ok(PERG == [len(ROTEIRO) - 1], f'só a fala {len(ROTEIRO)} é marcada como pergunta ("pergunta": true)')
nrm = lambda w: re.sub(r'[^a-z]', '', unicodedata.normalize('NFD', w.lower()).encode('ascii', 'ignore').decode())


def trilha(y, sr, t0, t1, fmin=70, fmax=400):
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


for n in PERG:
    sec(f'PITCH · A PERGUNTA DA CENA {n + 1} ("{ROTEIRO[n]}")')
    f0c = caps[f'{n:02d}']
    sr, y = wavfile.read(os.path.join(AUD, 'voz', f'cap-{n:02d}.wav'))
    y = y.astype(np.float64) / 32768
    al = f0c['alinhamento']
    txt = ''.join(al['characters'])
    ts, te = al['character_start_times_seconds'], al['character_end_times_seconds']
    fim_q = txt.index('?')
    pal = [m for m in re.finditer(r'[\wÀ-ÿ]+', txt) if m.end() <= fim_q]
    q = next(m for m in pal if nrm(m.group()) in INTERROGATIVAS)
    tr = trilha(y, sr, max(0, ts[0] - 0.05), te[fim_q] + 0.08)
    vz = [(t, f) for t, f in tr if f]
    topo = max(vz, key=lambda p_: p_[1])
    dentro = ts[q.start()] - 0.02 <= topo[0] <= te[q.end() - 1] + 0.06
    resto = [f for t, f in vz if not (ts[q.start()] - 0.02 <= t <= te[q.end() - 1] + 0.06)]
    info(f'tomada usada: {f0c.get("tomada", {}).get("arquivo", "voz.py")} (seed {f0c["seed"]})')
    info(f'"{q.group()}" vai de {ts[q.start()]:.2f} a {te[q.end() - 1]:.2f} s; o pico da pergunta é {topo[1]:.0f} Hz em {topo[0]:.2f} s '
         f'({st(np.median(resto), topo[1]):+.1f} st sobre a mediana do resto da pergunta)')
    ok(dentro, f'a pergunta sobe na palavra interrogativa: o pico de F0 do trecho da pergunta está em "{q.group()}" (regra das wh-questions; o fim cai)')
    try:
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
        trt = trilha(y, sr, max(0, ts[0] - 0.05), len(y) / sr)
        fig, ax = plt.subplots(figsize=(10, 4.2), dpi=120)
        ax.plot([t for t, f in trt], [f if f else np.nan for t, f in trt], color='#F2502B', lw=3)
        for ch, a_, b_ in zip(al['characters'], ts, te):
            if ch.isalpha():
                ax.text((a_ + b_) / 2, 75, ch, ha='center', fontsize=9, color='#221C19')
        ax.axvspan(ts[q.start()], te[q.end() - 1], color='#F9B233', alpha=0.25)
        ax.axvline(topo[0], color='#F9B233', ls='--'); ax.axvline(te[fim_q], color='#888', ls=':')
        ax.set_ylim(60, 360); ax.set_xlabel('s'); ax.set_ylabel('Hz'); ax.grid(alpha=0.25)
        ax.set_title(f'"{ROTEIRO[n]}" — pico da pergunta em "{q.group()}" ({topo[1]:.0f} Hz)')
        fig.tight_layout(); fig.savefig(os.path.join(REV, f'f0-cena-{n + 1}.png')); plt.close(fig)
        info(f'gráfico: output/revisao/f0-cena-{n + 1}.png')
    except ImportError:
        pass

# ---------------------------------------------------------------- legenda
sec('LEGENDA (a nova, da Coisa de mineiro #03)')
LP = LEG['estilo']
por_cena = {}
for b in LEG['blocos']:
    por_cena.setdefault(b['cena'], []).extend(p['w'] for l in b['linhas'] for p in l)
ok(all(' '.join(por_cena.get(n, [])) == ROTEIRO[n] for n in range(len(ROTEIRO))), 'a legenda bate com a fala, cena a cena (o texto da tela, na ordem, com a grafia oficial)')
ok(all(c['t0'] - 1e-6 <= b['t0'] and b['t1'] <= c['t1'] + 1e-6 for b in LEG['blocos'] for c in [CENA['cenas'][b['cena']]]), 'nenhum bloco atravessa a troca de cena')
unid = lambda b: sum(len(l) for l in b['linhas']) - 2 * ' '.join(p['w'] for l in b['linhas'] for p in l).lower().count('pão de queijo')
ok(all(len(b['linhas']) <= 2 and 1 <= unid(b) <= 4 for b in LEG['blocos']), 'blocos curtos (até 2 linhas, até 4 palavras; "pão de queijo" conta como uma)')
MDIR = os.path.join(REV, 'mascara-legenda')
mq = sorted(f for f in os.listdir(MDIR) if f.endswith('.png')) if os.path.isdir(MDIR) else []
if not mq:
    ok(False, 'máscara da legenda não encontrada (render.mjs mascara)')
else:
    tq = lambda i: i * 3 / FPS
    caixas, grudadas, menor = [], [], 1e9
    for k, nome in enumerate(mq):
        al = np.asarray(Image.open(os.path.join(MDIR, nome)).convert('RGBA'))[..., 3] > 128
        ys, xs = np.nonzero(al)
        if len(xs) < 30:
            continue
        caixas.append((tq(k), xs.min() / ESC, ys.min() / ESC, xs.max() / ESC, ys.max() / ESC))
        t_ = tq(k)
        b_ = next((b for b in LEG['blocos'] if b['t0'] <= t_ < b['t1']), None)
        if not b_:
            continue
        lh = LP['linha'] if b_['size'] == LP['size'] else LP['linha2']
        for li, l in enumerate(b_['linhas']):
            dentro_ = [w for w in l if t_ - w['t0'] >= 0.08]
            if len(dentro_) < 2 or any(0 <= t_ - w['t0'] < 0.08 for w in l):
                continue
            y0_, y1_ = int((LP['top'] + li * lh + 0.15 * lh) * ESC), int((LP['top'] + (li + 1) * lh - 0.1 * lh) * ESC)
            col = al[y0_:y1_].any(0)
            seg, ant_, vaos, ini = 0, False, [], None
            for x_, v_ in enumerate(col):
                if v_ and not ant_:
                    seg += 1
                    if ini is not None:
                        vaos.append(x_ - ini)
                if not v_ and ant_:
                    ini = x_
                ant_ = v_
            if seg < len(dentro_):
                grudadas.append(t_)
            if vaos:
                menor = min(menor, min(vaos) / ESC)
    X0, Y0 = min(c[1] for c in caixas), min(c[2] for c in caixas)
    X1, Y1 = max(c[3] for c in caixas), max(c[4] for c in caixas)
    fora = [c[0] for c in caixas if c[1] < LP['x0'] - 1 or c[3] > LP['x1'] + 1 or c[2] < 1372 or c[4] > 1565]
    ok(not fora, f'legenda na faixa segura: x {X0:.0f}–{X1:.0f}, y {Y0:.0f}–{Y1:.0f} (x {LP["x0"]}–{LP["x1"]}, y 1372–1565: abaixo dos pés, fora da coluna de botões e acima da descrição)'
       + (f' (fora em {faixas(fora)})' if fora else ''))
    ok(not grudadas, 'legenda sem palavras grudadas: o espaço entre as palavras nunca some (nenhum par encostado em nenhum quadro)'
       + (f' (encostadas em {faixas(grudadas)})' if grudadas else f'; menor vão entre duas palavras: {menor:.0f} px'))

# ---------------------------------------------------------------- bordas
sec('BORDAS (máscara do conteúdo, sem o fundo; 10 quadros/s)')
MDIR = os.path.join(REV, 'mascara-conteudo')
mq = sorted(f for f in os.listdir(MDIR) if f.endswith('.png')) if os.path.isdir(MDIR) else []
if not mq:
    ok(False, 'máscara do conteúdo não encontrada (render.mjs mascara)')
else:
    tq = lambda i: i * 3 / FPS
    cx = []
    for nome in mq:
        # alfa > 120: as sombras suaves (o celular, os cartões) não contam como conteúdo
        al = np.asarray(Image.open(os.path.join(MDIR, nome)).convert('RGBA'))[..., 3] > 120
        ys, xs = np.nonzero(al)
        cx.append((xs.min() / ESC, ys.min() / ESC, (xs.max() + 1) / ESC, (ys.max() + 1) / ESC, al) if len(xs) > 30 else None)
    cortado, apertado, botoes = [], [], []
    for i, c in enumerate(cx):
        if not c:
            continue
        viz = [cx[j] for j in (i - 1, i + 1) if 0 <= j < len(cx)]
        movendo = any(vv is None or max(abs(a_ - b_) for a_, b_ in zip(c[:4], vv[:4])) > 8 for vv in viz)
        x0, y0, x1, y1, al = c
        if not movendo:
            borda = min(x0, 1080 - x1, 1920 - y1)
            if borda <= 2:
                cortado.append(tq(i))
            elif borda < 30:
                apertado.append(tq(i))
        zona = al[int(1060 * ESC):int(1560 * ESC), int(940 * ESC):]
        if zona.sum() > 20 and not movendo:
            botoes.append(tq(i))
    X0 = min(c[0] for c in cx if c); X1 = max(c[2] for c in cx if c); Y1 = max(c[3] for c in cx if c)
    info(f'o conteúdo ocupa no máximo x {X0:.0f}–{X1:.0f}, até y {Y1:.0f} (entrando e saindo incluídos)')
    ok(not cortado, 'nada parado cortado pela borda' + (f' (cortado em {faixas(cortado)})' if cortado else ''))
    ok(not apertado, 'parado, tudo a ≥ 30 px das bordas laterais e de baixo' + (f' (mais perto em {faixas(apertado)})' if apertado else ''))
    ok(not botoes, 'nada parado na coluna de botões do Instagram (x ≥ 940, y 1060–1560)' + (f' (em {faixas(botoes)})' if botoes else ''))

# ---------------------------------------------------------------- capa
sec('CAPA (3:4, padrão da grade)')
c34 = os.path.join(OUT, 'capa-3x4.png')
cs = os.path.join(REV, 'capa-sem-fundo.png')
if os.path.exists(c34):
    im = Image.open(c34)
    ok(im.size == (1080, 1440), f'capa-3x4.png {im.size[0]}×{im.size[1]} (o recorte da grade, y 240–1680 da capa 9:16)')
    if os.path.exists(cs):
        al = np.asarray(Image.open(cs).convert('RGBA'))[240:1680, :, 3] > 40
        ys, xs = np.nonzero(al)
        ok(xs.min() >= 135 and xs.max() <= 945 and ys.min() >= 10 and ys.max() <= 1430,
           f'todo o conteúdo da capa em x {xs.min()}–{xs.max()} (regra x 135–945: vale na grade e na aba Reels), y {ys.min()}–{ys.max()} do 3:4')
    else:
        ok(False, 'capa sem fundo não encontrada (para medir o conteúdo)')
else:
    ok(False, 'capa-3x4.png não encontrada')

sec(f'RESULTADO: {"aprovado" if not fails else "ajustar"}')
if fails:
    report.append('  ' + '\n  '.join(fails))
cab = [f'REVISÃO TÉCNICA · Reel "Pão de Queijo Points" · {os.path.relpath(VIDEO, REPO)}', f'{DUR:.2f} s · {int(round(DUR * FPS))} quadros a {FPS} fps']
open(os.path.join(REV, 'relatorio-tecnico.txt'), 'w').write('\n'.join(cab + report) + '\n')
print('\n'.join(cab + report))
