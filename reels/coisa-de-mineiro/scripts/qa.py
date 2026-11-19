#!/usr/bin/env python3
"""
Série "Coisa de mineiro": a revisão técnica de UM episódio.

    python3 reels/coisa-de-mineiro/scripts/qa.py 01-e-logo-ali

Confere o MP4 (reels/coisa-de-mineiro/<ep>/output/uaipertim-coisa-de-mineiro-NN.mp4) contra os dados que a composição usa
(public/coisa-de-mineiro/<ep>/dados.json, o roteiro e a voz) e grava <ep>/output/revisao/relatorio-tecnico.txt e
<ep>/output/revisao/f0-gancho.png:
  • formato: h264 yuv420p 1080×1920 a 30 fps, 20–30 s, AAC 48 kHz estéreo; −14 LUFS (±0,5), pico real ≤ −1 dBTP;
  • ritmo: todo corte de cena numa batida (120 BPM); a fala de cada cena dentro dela;
  • voz: o roteiro exato, perfil "narracao" (eleven_v4), cada fala com a voz de quem fala (o Pertim com a voz oficial,
    a visita com a de "vozes" no roteiro), "Pertim/pertim" enviado como "pertím" (grafia c) e a tela sem
    troca; cada cena UMA geração inteira; nunca "de Glória";
  • a pergunta do gancho (se a 1ª fala termina em "?"): o F0 sobe ≥ +8 st da palavra anterior até o pico na última;
  • a série: sem app, celular, "em breve" ou "tá chegando" no roteiro; placas só com km; o selo "COISA DE MINEIRO #NN"
    no começo, no meio e no fim (pixels); a marca (logo + "Tudo pertim de você.") só nos segundos finais (pixels);
  • legenda: só o texto da tela, até 2 linhas, cada bloco ≥ 0,8 s, na faixa, cobre a fala e sai antes da marca;
  • boca: nenhuma boca menos de 2 quadros; gancho: o quadro muda a cada 0,1 s nos primeiros 0,5 s;
  • personagens na tela (render.mjs mascara: só os personagens e o carro, cada um numa cor, 10 quadros/s): parado, ninguém
    fica cortado pela borda nem a menos de 60 px dela (entrando ou saindo de cena, em movimento, pode); o rosto do Pertim
    nunca na coluna de botões do Instagram (x ≥ 940 entre y 1060 e 1560).
Termina em "RESULTADO: aprovado" ou "RESULTADO: ajustar".
"""
import json
import os
import re
import subprocess
import sys
import tempfile
import numpy as np
from PIL import Image, ImageFont
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

AQUI = os.path.dirname(os.path.abspath(__file__))
SERIE = os.path.dirname(AQUI)
REPO = os.path.dirname(os.path.dirname(SERIE))
EP = sys.argv[1] if len(sys.argv) > 1 else '01-e-logo-ali'
AUD = os.path.join(REPO, 'reels', 'explica-so', 'audio', 'coisa-de-mineiro', EP)
ROT = json.load(open(os.path.join(SERIE, EP, 'roteiro.json')))
LAY = json.load(open(os.path.join(SERIE, 'layout.json')))
D = json.load(open(os.path.join(REPO, 'public', 'coisa-de-mineiro', EP, 'dados.json')))
LN = json.load(open(os.path.join(AUD, 'linha.json')))
FALAS = json.load(open(os.path.join(AUD, 'voz', 'falas.json')))
NN = f'{ROT["numero"]:02d}'
OUT = os.path.join(SERIE, EP, 'output')
REV = os.path.join(OUT, 'revisao')
os.makedirs(REV, exist_ok=True)
VIDEO = os.path.join(OUT, f'uaipertim-coisa-de-mineiro-{NN}.mp4')
DUR, FPS, BT = D['duracao'], D['fps'], D['batida']
ROTEIRO = [' '.join(f['texto'] for f in c['fala']) for c in ROT['capitulos']]
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
pr = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-of', 'json', VIDEO], capture_output=True, text=True).stdout)
v = next(s for s in pr['streams'] if s['codec_type'] == 'video')
a = next(s for s in pr['streams'] if s['codec_type'] == 'audio')
dv, da = float(v['duration']), float(a['duration'])
ok(v['codec_name'] == 'h264' and v['pix_fmt'] == 'yuv420p' and (v['width'], v['height']) == (1080, 1920), f'vídeo {v["codec_name"]} {v["pix_fmt"]} {v["width"]}×{v["height"]}')
ok(abs(eval(v['r_frame_rate']) - 30) < 1e-6, f'{eval(v["r_frame_rate"]):g} fps')
lim = ROT.get('limites', [20, 30])
ok(lim[0] <= dv <= lim[1] + 1e-3, f'duração {dv:.2f} s ({lim[0]}–{lim[1]} s)')
ok(a['codec_name'] == 'aac' and int(a['sample_rate']) == 48000 and a['channels'] == 2 and abs(dv - da) < 0.05, f'áudio {a["codec_name"]} {a["sample_rate"]} Hz, {a["channels"]} canais')
e = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', VIDEO, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
sm = e[e.rindex('Summary:'):]
I = float(re.search(r'I:\s+(-?[\d.]+) LUFS', sm).group(1))
TP = float(re.search(r'Peak:\s+(-?[\d.]+) dBFS', sm[sm.index('True peak'):]).group(1))
ok(abs(I + 14) <= 0.5, f'{I:.1f} LUFS integrados (alvo −14)')
ok(TP <= -1.0, f'pico real {TP:.1f} dBTP (≤ −1)')

# ---------------------------------------------------------------- ritmo
sec('RITMO (trilha animada, 120 BPM: uma batida a cada 0,5 s)')
for c in D['cenas']:
    ok(na_batida(c['t0']) and na_batida(c['t1']) and c['t0'] <= c['voz_t0'] and c['voz_t1'] <= c['t1'] + 1e-6,
       f'cena {c["n"] + 1} {c["tipo"]}: {c["t0"]:.2f}–{c["t1"]:.2f} s = batidas {c["t0"] / BT:.0f}–{c["t1"] / BT:.0f}; fala {c["voz_t0"]:.2f}–{c["voz_t1"]:.2f} s dentro dela')

# ---------------------------------------------------------------- voz
sec('VOZ')
caps = FALAS['capitulos']
ok([caps[f'{i:02d}']['texto'] for i in range(len(ROTEIRO))] == ROTEIRO, 'o texto falado é o roteiro, cena a cena')
ok(all(caps[k]['perfil'] == 'narracao' and caps[k]['modelo'] == 'eleven_v4' for k in caps) and FALAS['voz'] == 'Victor Pinho', 'perfil "narracao" (eleven_v4); a voz oficial (Victor Pinho) é a do Pertim')
# cada fala com a voz de quem fala: o Pertim com a voz oficial; a visita (e outro falante com "vozes" no roteiro) com a dela
VOZES = ROT.get('vozes', {})
for n, c in enumerate(ROT['capitulos']):
    fal = c.get('falante', 'pertim')
    quer = VOZES[fal]['voiceId'] if fal in VOZES else FALAS['voice_id']
    tem = caps[f'{n:02d}'].get('voice_id', FALAS['voice_id'])
    nome = VOZES[fal]['name'] if fal in VOZES else FALAS['voz']
    ok(tem == quer, f'cena {n + 1} ({fal}): voz {nome} ({quer})')
api = ' '.join(caps[k]['texto_api'] for k in sorted(caps))
tela = ' '.join(ROTEIRO)
if re.search(r'pertim', tela, re.I):
    ok('pertím' in api and not re.search(r'\bpertim\b', api, re.I), '"Pertim/pertim" vai para a voz como "pertím" (grafia c); na tela, "pertim"')
for k in sorted(caps):
    f = caps[k]
    origem = f.get('tomada', {}).get('arquivo', f'voz.py, seed {f["seed"]}')
    conf = f['historico'][-1]['resultado'] if f.get('historico') else ''
    info(f'cena {int(k) + 1}: seed {f["seed"]} · {f["fim_da_fala"] - f["inicio_da_fala"]:.2f} s · enviado "{f["texto_api"]}" · {origem} · conferência: {conf}')
ok(len(LN['colocacao']) == len(ROTEIRO), 'cada cena é UMA geração inteira, colocada sem cortes')
ok(not re.search(r'\bde\s+Glória', json.dumps(ROT, ensure_ascii=False)), 'nunca "de Glória"')

# ---------------------------------------------------------------- as perguntas (a subida até a tônica)
# as falas marcadas no roteiro com "pergunta": true; sem marca nenhuma, a 1ª fala, se terminar em "?"
import unicodedata  # noqa: E402
INTERROGATIVAS = {'quanto', 'quanta', 'quantos', 'quantas', 'qual', 'quais', 'onde', 'aonde', 'quem', 'como', 'quando', 'porque'}   # + "quê", "o que", "por que"
PERGUNTAS = [n for n, c in enumerate(ROT['capitulos']) if c.get('pergunta')] or ([0] if ROTEIRO[0].rstrip().endswith('?') else [])


def mede_pergunta(n):
    sec(f'A PERGUNTA {"DO GANCHO" if n == 0 else f"DA CENA {n + 1}"} ("{ROTEIRO[n]}")')
    f0c = caps[f'{n:02d}']
    sr, y = wavfile.read(os.path.join(AUD, 'voz', f'cap-{n:02d}.wav'))
    y = y.astype(np.float64) / 32768
    al = f0c['alinhamento']
    txt = ''.join(al['characters'])
    ts, te = al['character_start_times_seconds'], al['character_end_times_seconds']
    pal = [m for m in re.finditer(r'[\wÀ-ÿ]+', txt)]
    ult, ant = pal[-1], pal[-2]

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

    tr = trilha(max(0, ts[0] - 0.05), len(y) / sr)
    vz = [(t, f) for t, f in tr if f]
    pico = max([(t, f) for t, f in vz if t >= ts[ult.start()]], key=lambda q: q[1])
    antes = [f for t, f in vz if ts[ant.start()] <= t <= te[ant.end() - 1] + 0.04]
    base = float(np.median(antes))
    info(f'tomada usada: {f0c.get("tomada", {}).get("arquivo", "voz.py")} (seed {f0c["seed"]})')
    info(f'o F0 vai de {base:.0f} Hz ("{ant.group()}") para {pico[1]:.0f} Hz no pico de "{ult.group()}" (em {pico[0]:.2f} s)')
    # pergunta com palavra interrogativa (quantas, qual, onde, quem, como, quando, por que…): o natural é subir NA palavra
    # interrogativa e cair no fim; passa se o pico de F0 da fala estiver nela. Pergunta de sim/não: sobe ≥ +8 st até a tônica.
    nrm = lambda w: re.sub(r'[^a-z]', '', unicodedata.normalize('NFD', w.lower()).encode('ascii', 'ignore').decode())
    qs = [m for m in pal if nrm(m.group()) in INTERROGATIVAS]
    qs += [m for m in pal if m.group().lower() == 'quê']
    qs += [b_ for a_, b_ in zip(pal, pal[1:]) if nrm(a_.group()) in ('por', 'o') and nrm(b_.group()) == 'que']
    qs.sort(key=lambda m: m.start())
    if qs:
        q = qs[0]
        topo = max(vz, key=lambda p_: p_[1])
        dentro = ts[q.start()] - 0.02 <= topo[0] <= te[q.end() - 1] + 0.06
        info(f'pergunta com palavra interrogativa ("{q.group()}"): o pico da fala é {topo[1]:.0f} Hz em {topo[0]:.2f} s; "{q.group()}" vai de {ts[q.start()]:.2f} a {te[q.end() - 1]:.2f} s')
        ok(dentro, f'a pergunta sobe na palavra interrogativa: o pico de F0 está em "{q.group()}" (regra das perguntas com palavra interrogativa; o fim cai, como é natural)')
    else:
        ok(st(base, pico[1]) >= 8, f'a pergunta (de sim/não) sobe até a tônica: {st(base, pico[1]):+.1f} st (mínimo +8 st)' + ('' if st(base, pico[1]) > 0 else f' — o F0 CAI de "{ant.group()}" para "{ult.group()}"'))
    try:
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
        fig, ax = plt.subplots(figsize=(10, 4.2), dpi=120)
        ax.plot([t for t, f in tr], [f if f else np.nan for t, f in tr], color='#3E9E4E', lw=3)
        for ch, a_, b_ in zip(al['characters'], ts, te):
            if ch.isalpha():
                ax.text((a_ + b_) / 2, 75, ch, ha='center', fontsize=9, color='#221C19')
        ax.axvline(pico[0], color='#F9B233', ls='--'); ax.set_ylim(60, 320); ax.set_xlabel('s'); ax.set_ylabel('Hz')
        ax.set_title(f'"{ROTEIRO[n]}" — sobe {st(base, pico[1]):+.1f} st até "{ult.group()}"')
        ax.grid(alpha=0.25); fig.tight_layout(); fig.savefig(os.path.join(REV, 'f0-gancho.png' if n == 0 else f'f0-cena-{n + 1}.png')); plt.close(fig)
        info('gráfico: output/revisao/' + ('f0-gancho.png' if n == 0 else f'f0-cena-{n + 1}.png'))
    except ImportError:
        pass


for n in PERGUNTAS:
    mede_pergunta(n)

# ---------------------------------------------------------------- a série
sec('A SÉRIE (identidade e regras)')
falado = ' '.join(ROTEIRO).lower()
ok(not re.search(r'\bapp\b|aplicativo|celular|em breve|tá chegando|ta chegando', falado), 'a fala não fala do app (sem app, celular, "em breve", "tá chegando")')
placas = [p['texto'] if isinstance(p, dict) else p for c in D['cenas'] for p in c['diagrama'].get('placas', [])]
ok(all(re.fullmatch(r'\d+ km', p) for p in placas), f'placas só com km: {", ".join(placas) or "(nenhuma)"}')
info(f'a marca entra em {D["marca_t"]:.2f} s ({DUR - D["marca_t"]:.2f} s finais)')
if ROT['numero'] >= 3:
    # os aprendizados do Reel de teste do #01 (padrão da série do #03 em diante)
    c0 = D['cenas'][0]
    ok(c0['voz_t0'] <= 0.3, f'abre já na situação: a primeira fala começa em {c0["voz_t0"]:.2f} s (≤ 0,3 s; sem introdução)')
    fe = D['cenas'][-1]
    ok(fe['texto'].rstrip().endswith('?'), f'o fecho é uma pergunta (gera comentário): "{fe["texto"]}"')
    ok(not re.search(r'\bmarca (aquele|o|a) ', falado), 'sem "marca o amigo" na fala')
    md = fe['diagrama'].get('manda')
    ok(isinstance(md, dict) and md['texto'].lower().startswith('manda pro amigo') and md['t'] < D['marca_t'] - 1.0,
       f'o texto de compartilhar na tela: "{md["texto"] if md else "—"}" (entra em {md["t"] if md else 0:.2f} s)')

# ---------------------------------------------------------------- legenda
LG = D['legenda']
if LG.get('pop'):
    sec('LEGENDA NOVA (palavra a palavra; o resto da conferência, com a máscara, em PERSONAGENS NA TELA)')
    bl = LG['blocos']
    LP = LG['estilo']
    fts = {}
    def larg(ws, sz):
        f_ = fts.setdefault(sz, ImageFont.truetype(os.path.join(REPO, 'public', 'fonts', 'poppins-latin-800-normal.woff2'), sz))
        return sum(f_.getlength(w['w']) * 1.12 + sz * 0.48 for w in ws)
    nfal = lambda b: [w for l in b['linhas'] for w in l]
    COMP = ['pão de queijo']
    def n_pal(b):
        txt = ' '.join(w['w'] for w in nfal(b)).lower()
        return len(nfal(b)) - sum(txt.count(c) * (len(c.split()) - 1) for c in COMP)
    por_cena = {}
    for b in bl:
        por_cena.setdefault(b['cena'], []).extend(w['w'] for w in nfal(b))
    ok(all(' '.join(por_cena.get(n, [])) == ROTEIRO[n] for n in range(len(ROTEIRO))), 'a legenda bate com a fala, cena a cena (o texto da tela, na ordem)')
    ok(not any('pertím' in w['w'] for b in bl for w in nfal(b)), 'só o texto da tela ("pertim", nunca a grafia enviada à voz)')
    ok(all(b['falante'] == ROT['capitulos'][b['cena']].get('falante', 'pertim') for b in bl), 'cada bloco com o falante da cena (a cor do destaque: amarelo/laranja = Pertim, azul = visita)')
    ok(all(2 <= n_pal(b) <= 4 for b in bl if len(ROTEIRO[b['cena']].split()) >= 2), 'blocos de 2 a 4 palavras ("pão de queijo" conta como uma)')
    ok(all(len(b['linhas']) <= 2 and all(larg(l, b.get('size', LP['size'])) <= LP['maxW'] for l in b['linhas']) for b in bl), f'até 2 linhas, cada uma cabendo em {LP["maxW"]} px')
    cen = {c['n']: c for c in D['cenas']}
    ok(all(cen[b['cena']]['t0'] - 1e-6 <= b['t0'] and b['t1'] <= cen[b['cena']]['t1'] - 0.05 + 1e-6 for b in bl), 'some nas trocas de cena (nenhum bloco atravessa o corte)')
    ok(max(b['t1'] for b in bl) <= D['marca_t'] - 0.05 + 1e-6, f'sai em {max(b["t1"] for b in bl):.2f} s, antes da marca ({D["marca_t"]:.2f} s)')
    falados = {(c['n'], round(q['t0'], 3)) for c in LN['capitulos'] for q in c['palavras']}
    ok(all((b['cena'], round(w['t0'], 3)) in falados for b in bl for w in nfal(b)), 'cada palavra entra no tempo em que é falada (o alinhamento da voz)')
    chaves = {b['cena']: w['w'] for b in bl for w in nfal(b) if w.get('chave')}
    info('palavras-chave (verde, com marcador): ' + ', '.join(f'cena {k + 1} "{v}"' for k, v in sorted(chaves.items())))
else:
    sec('LEGENDA GRAVADA')
    st_ = LG['estilo']
    fonte = ImageFont.truetype(os.path.join(REPO, 'public', 'fonts', 'poppins-latin-800-normal.woff2'), st_['size'])
    x0, y0, x1, y1 = st_['faixa']
    bl = LG['blocos']
    ok(all(len(b['linhas']) <= 2 for b in bl) and all(b['t1'] - b['t0'] >= st_['minDur'] - 1e-3 for b in bl), f'{len(bl)} blocos, até 2 linhas, cada um ≥ {st_["minDur"]} s')
    larg = max(fonte.getlength(' '.join(w['w'] for w in l)) for b in bl for l in b['linhas'])
    ok(larg + 2 * st_['padX'] <= x1 - x0 + 1, f'a linha mais larga ({larg + 2 * st_["padX"]:.0f} px) cabe na faixa (x {x0}–{x1})')
    pals = [w['w'] for b in bl for l in b['linhas'] for w in l]
    ok(not any('pertím' in p for p in pals), 'só o texto da tela ("pertim", nunca a grafia enviada à voz)')
    ok(' '.join(pals) == ' '.join(ROTEIRO), 'cobre a fala inteira, na ordem')
    ok(max(b['t1'] for b in bl) <= D['marca_t'] + 1e-3, f'sai em {max(b["t1"] for b in bl):.2f} s, antes da marca')

# ---------------------------------------------------------------- boca e pixels
sec('BOCA E PIXELS')
bocas = D['visemas']
runs, q = [], 0
while q < len(bocas):
    j = q
    while j < len(bocas) and bocas[j] == bocas[q]:
        j += 1
    runs.append(j - q); q = j
ok(min(runs[1:-1] or [2]) >= 2 and set('AEOM') <= set(bocas), f'nenhuma boca com menos de 2 quadros; A, E, O e M/B/P na fala ({len(runs)} trechos)')
with tempfile.TemporaryDirectory() as tmp:
    def quadro(t):
        p = os.path.join(tmp, f'{t:.3f}.png')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t:.3f}', '-i', VIDEO, '-frames:v', '1', p], check=True)
        return np.asarray(Image.open(p).convert('RGB')).astype(np.int16)
    qs = [quadro(t) for t in (0.0, 0.1, 0.2, 0.3, 0.4, 0.5)]
    dif = [np.mean(np.abs(a_ - b_)) for a_, b_ in zip(qs, qs[1:])]
    ok(min(dif) > 0.3, 'o quadro muda a cada 0,1 s nos primeiros 0,5 s (diferença média ' + ', '.join(f'{d:.1f}' for d in dif) + ')')
    # o selo da série: verde (#3E9E4E) na caixa dele, no começo, no meio e no fim
    sx, sy = LAY['selo']['x'], LAY['selo']['y']
    verde = lambda q_: int(np.sum((np.abs(q_[sy:sy + 90, sx:sx + 560] - np.array([62, 158, 78])).sum(2) < 40)))
    vs = [verde(quadro(t)) for t in (0.6, DUR * 0.5, DUR - 0.2)]
    ok(min(vs) > 3000, f'o selo "COISA DE MINEIRO #{NN}" aparece no começo, no meio e no fim ({", ".join(map(str, vs))} px verdes)')
    # a marca: a logo (coral) na caixa dela só depois de marca_t
    M = LAY['marca']
    caixa = lambda q_: q_[M['cy'] - M['d'] // 2 + 10:M['cy'] + M['d'] // 2 - 10, M['cx'] - M['d'] // 2 + 10:M['cx'] + M['d'] // 2 - 10]
    coral = lambda q_: int(np.sum((np.abs(caixa(q_) - np.array([242, 80, 43])).sum(2) < 70)))
    antes = [coral(quadro(t)) for t in (1.0, DUR * 0.5, D['marca_t'] - 0.3)]
    depois = coral(quadro(DUR - 0.3))
    ok(max(antes) < 300 < depois, f'a marca só aparece no fim: logo na caixa dela antes = {max(antes)} px coral, no fim = {depois} px')

# ---------------------------------------------------------------- personagens na tela
sec('PERSONAGENS NA TELA (máscara: render.mjs mascara)')
subprocess.run(['node', os.path.join(AQUI, 'render.mjs'), 'mascara', EP], check=True, capture_output=True, cwd=REPO)
MDIR = os.path.join(REV, 'mascara')
mq = sorted(os.listdir(MDIR))
ESC, FOLGA = 0.5, 60                                   # a máscara sai em meia resolução, 1 quadro a cada 3 (10 por segundo)
COR = {'pertim': lambda r, g, b: (r > 128) & (g < 100), 'visita': lambda r, g, b: (g > 128) & (r < 100) & (b < 100),
       'carro': lambda r, g, b: (b > 128) & (r < 100) & (g < 100), 'cachorro': lambda r, g, b: (r > 128) & (g > 128) & (b < 100),
       'vaca': lambda r, g, b: (g > 128) & (b > 128) & (r < 100)}
rosto = lambda r, g, b: (r > 128) & (b > 128) & (g < 100)
caixas, rostos, leg = {k: [] for k in COR}, [], []
for nome in mq:
    q = np.asarray(Image.open(os.path.join(MDIR, nome)).convert('RGB')).astype(np.int16)
    r, g, b = q[..., 0], q[..., 1], q[..., 2]
    H_, W_ = r.shape
    for k, fn in COR.items():
        ys, xs = np.nonzero(fn(r, g, b))
        caixas[k].append((xs.min(), ys.min(), xs.max(), ys.max()) if len(xs) > 30 else None)
    ys, xs = np.nonzero((r > 200) & (g > 200) & (b > 200))            # a legenda nova (branca na máscara)
    leg.append((xs.min(), ys.min(), xs.max(), ys.max()) if len(xs) > 30 else None)
    m = rosto(r, g, b)
    zona = m[int(1060 * ESC):int(1560 * ESC), int(940 * ESC):]
    rostos.append(int(zona.sum()))
tq = lambda i: i * 3 / FPS
def faixas(ts):
    """os instantes (s) em trechos: "14.0–14.5 s" """
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
for k, cx in caixas.items():
    vistos = [i for i, c in enumerate(cx) if c]
    if not vistos:
        continue
    cortado, apertado = [], []
    for i in vistos:
        c = cx[i]
        viz = [cx[j] for j in (i - 1, i + 1) if 0 <= j < len(cx)]
        movendo = any(v is None or max(abs(a_ - b_) for a_, b_ in zip(c, v)) > 4 for v in viz)   # > 8 px por 0,1 s
        if movendo:
            continue
        x0, y0, x1, y1 = c
        borda = min(x0, y0, W_ - 1 - x1, H_ - 1 - y1)
        if borda <= 1:
            cortado.append(tq(i))
        elif borda < FOLGA * ESC:
            apertado.append(tq(i))
    ok(not cortado, f'{k}: nunca cortado pela borda' + (f' (cortado em {faixas(cortado)})' if cortado else ''))
    ok(not apertado, f'{k}: parado, sempre a ≥ {FOLGA} px das bordas' + (f' (mais perto em {faixas(apertado)})' if apertado else ''))
if LG.get('pop'):
    # a legenda nova: na faixa segura (abaixo dos pés, acima da descrição do Instagram, fora da coluna de botões) e com
    # a cor do destaque de quem fala (conferida nos pixels do vídeo, só dentro das letras da legenda)
    vistas = [(i, c) for i, c in enumerate(leg) if c]
    fora = [tq(i) for i, (x0_, y0_, x1_, y1_) in vistas if x0_ / ESC < 60 or x1_ / ESC >= 940 or y0_ / ESC < 1372 or y1_ / ESC > 1565]
    if vistas:
        X0, Y0 = min(c[0] for _, c in vistas) / ESC, min(c[1] for _, c in vistas) / ESC
        X1, Y1 = max(c[2] for _, c in vistas) / ESC, max(c[3] for _, c in vistas) / ESC
        ok(not fora, f'legenda na faixa segura: x {X0:.0f}–{X1:.0f}, y {Y0:.0f}–{Y1:.0f} (x < 940, y 1372–1565: abaixo dos pés, fora da coluna de botões e acima da descrição)' + (f' (fora em {faixas(fora)})' if fora else ''))
    CORPX = {'pertim': lambda q_: (q_[..., 0] > 215) & (q_[..., 1] > 110) & (q_[..., 1] < 205) & (q_[..., 2] < 90),
             'visita': lambda q_: (q_[..., 2] > 200) & (q_[..., 0] < 170) & (q_[..., 1] > 115) & (q_[..., 1] < 215)}
    erradas = []
    with tempfile.TemporaryDirectory() as tmp:
        for c in D['cenas']:
            bs = [b for b in LG['blocos'] if b['cena'] == c['n']]
            ws = [w for b in bs for l in b['linhas'] for w in l if not w.get('chave') and w['ate'] - w['t0'] > 0.32]
            if not ws:
                continue
            w = ws[len(ws) // 2]
            k = int(np.ceil((w['t0'] + 0.21) * 10))                   # o quadro da máscara (10/s) depois do pop
            if k / 10 >= w['ate'] or k >= len(mq):
                continue
            mk = np.asarray(Image.open(os.path.join(MDIR, mq[k])).convert('RGB')).min(2) > 200
            mk = np.repeat(np.repeat(mk, 2, 0), 2, 1)
            p = os.path.join(tmp, 'q.png')
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{k / 10:.3f}', '-i', VIDEO, '-frames:v', '1', p], check=True)
            q_ = np.asarray(Image.open(p).convert('RGB')).astype(np.int16)[:mk.shape[0], :mk.shape[1]]
            fal = ROT['capitulos'][c['n']].get('falante', 'pertim')
            n_cert = int((CORPX[fal](q_) & mk).sum()); n_out = int((CORPX['visita' if fal == 'pertim' else 'pertim'](q_) & mk).sum())
            info(f'cena {c["n"] + 1} ({fal}), "{w["w"]}" em {k / 10:.1f} s: {n_cert} px na cor de quem fala, {n_out} px na cor do outro')
            if n_cert < 400 or (fal == 'pertim' and n_out > 100):
                erradas.append(c['n'] + 1)
    # o espaço entre as palavras: em cada quadro da máscara, cada linha do bloco tem tantos pedaços separados quantas
    # palavras já entraram (duas palavras encostadas viram um pedaço só)
    LPs = LG['estilo']
    grudadas, menor = [], 1e9
    for k, nome in enumerate(mq):
        t_ = k / 10
        b_ = next((b for b in LG['blocos'] if b['t0'] <= t_ < b['t1']), None)
        if not b_:
            continue
        mk = np.asarray(Image.open(os.path.join(MDIR, nome)).convert('RGB')).min(2) > 200
        sz = b_.get('size', LPs['size']); lh = LPs['linha'] if sz == LPs['size'] else LPs['linha2']
        for li, l in enumerate(b_['linhas']):
            dentro_ = [w for w in l if t_ - w['t0'] >= 0.08]
            if len(dentro_) < 2 or any(0 <= t_ - w['t0'] < 0.08 for w in l):
                continue
            y0_, y1_ = int((LPs['top'] + li * lh + 0.15 * lh) * ESC), int((LPs['top'] + (li + 1) * lh - 0.1 * lh) * ESC)
            col = mk[y0_:y1_].any(0)
            seg, ant_, vaos = 0, False, []
            ini = None
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
    ok(not grudadas, 'o espaço entre as palavras da legenda nunca some (nenhum par encostado em nenhum quadro)'
       + (f' (encostadas em {faixas(grudadas)})' if grudadas else f'; menor vão entre duas palavras: {menor:.0f} px'))
    ok(not erradas, 'a palavra dita na cor de quem fala (amarelo/laranja = Pertim, azul = visita)' + (f' (errada nas cenas {erradas})' if erradas else ''))
col = [tq(i) for i, n in enumerate(rostos) if n > 0]
ok(not col, 'o rosto do Pertim nunca na coluna de botões do Instagram (x ≥ 940, y 1060–1560)' + (f' (está em {faixas(col)})' if col else ''))

sec(f'RESULTADO: {"aprovado" if not fails else "ajustar"}')
if fails:
    report.append('  ' + '\n  '.join(fails))
cab = [f'REVISÃO TÉCNICA · Coisa de mineiro #{NN} "{ROT["titulo"]}" · {os.path.relpath(VIDEO, REPO)}', f'{DUR:.2f} s · {int(round(DUR * FPS))} quadros a {FPS} fps']
open(os.path.join(REV, 'relatorio-tecnico.txt'), 'w').write('\n'.join(cab + report) + '\n')
print('\n'.join(cab + report))
