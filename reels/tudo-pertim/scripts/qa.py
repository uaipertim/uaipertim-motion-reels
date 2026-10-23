#!/usr/bin/env python3
"""
Revisão técnica de um episódio da série TUDO PERTIM (roda depois do render e de `render.cjs info`).

    python3 scripts/qa.py tudo-pertim-01  ->  output/tudo-pertim-01/revisao/relatorio-tecnico.txt
                                             output/tudo-pertim-01/revisao/zonas-seguras.jpg

Confere:
  • formato: 1080x1920, 60 fps, H.264 yuv420p, AAC 48 kHz estéreo; duração de 45–60 s (vídeo e áudio iguais); capítulos do meio de 5–7 s;
  • som: −14 LUFS integrados (±0,5), pico real ≤ −1 dBTP, a voz sozinha na escala da mixagem;
  • a voz: cada capítulo é UMA geração inteira, colocada sem cortes — o trecho do vídeo é idêntico ao arquivo da
    geração (fora os fades de 8 ms / 60 ms nas pontas), e o arquivo é o mesmo registrado na geração (sha1);
  • o mapa de tempos de linha.py (total, apoios, fecho, logo) e as palavras da fala que não dispararam peça;
  • leitura: cada linha de apoio fica ao menos 1,5 s inteira na tela; nunca duas ao mesmo tempo; nunca por cima de
    uma peça de cena; a quebra de linha nunca separa as duas últimas palavras de uma frase, "pertim de você",
    "do/no Glória" nem um emoji da palavra anterior;
  • áreas seguras: (caixas do motor, a cada 0,25 s, fora das trocas) todo conteúdo entre x 80–940 e y 265–1456 e
    nada na coluna de botões (x ≥ 940, y 1060–1560); (pixels, 4 por segundo) nada além do fundo creme nessa coluna;
  • sem quadro vazio: em toda troca de capítulo há conteúdo na tela; sem trechos pretos nem imagem congelada ≥ 1,5 s;
  • a capa é o quadro 0 (o quadro 0 do vídeo bate com capa.png) e passa na regra das capas (revisao/capa.txt);
  • o fecho: de 6 a 8 s; a LOGO OFICIAL presente e parada nos 3 últimos segundos; todo texto do fecho parado ≥ 3 s.
"""
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
import unicodedata
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.io import wavfile
from scipy.signal import resample_poly

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = os.path.dirname(os.path.dirname(ROOT))
EP = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else 'tudo-pertim-01'
PREVIA = '--previa' in sys.argv           # prévia sem voz: confere só o visual; o relatório NUNCA sai "aprovado"
OUTD = os.path.join(ROOT, 'output', EP, 'previa') if PREVIA else os.path.join(ROOT, 'output', EP)
VIDEO = os.path.join(OUTD, f'uaipertim-{EP}.mp4')
AUD = os.path.join(ROOT, 'audio', EP)
AUDL = os.path.join(AUD, 'previa') if PREVIA else AUD
OUT = os.path.join(OUTD, 'revisao')
LN = json.load(open(os.path.join(AUDL, 'linha.json')))
assert PREVIA or not LN.get('previa'), 'linha.json é de prévia: gere a voz e rode scripts/linha.py de novo'
MOT = json.load(open(os.path.join(OUT, 'motor.json')))
CX = json.load(open(os.path.join(OUT, 'caixas.json')))
FALAS = {} if PREVIA else json.load(open(os.path.join(AUD, 'voz', 'falas.json')))['capitulos']
FONT = os.path.join(REPO, 'public', 'fonts', 'poppins-latin-800-normal.woff2')
DUR = LN['duracao']
SAFE = {'x0': 80, 'x1': 940, 'y0': 265, 'y1': 1456}
TIKTOK = {'topo': 130, 'base': 380, 'direita': 140}   # a interface do TikTok (em 1080x1920): só para a folha de revisão
BTN = {'x': 940, 'y0': 1060, 'y1': 1560}
report, fails = [], []


def ok(cond, msg):
    report.append(('OK   ' if cond else 'FALHA') + '  ' + msg)
    if not cond:
        fails.append(msg)


def info(msg):
    report.append('       ' + msg)


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)


def norm(s):
    s = unicodedata.normalize('NFD', s.lower())
    return re.sub(r'[^a-z0-9]', '', ''.join(c for c in s if unicodedata.category(c) != 'Mn'))


# ---------------------------------------------------------------- formato
report.append('FORMATO')
inf = json.loads(run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', VIDEO]).stdout)
v = next(s for s in inf['streams'] if s['codec_type'] == 'video')
a = next(s for s in inf['streams'] if s['codec_type'] == 'audio')
fps = eval(v['r_frame_rate'])
vd, ad = float(v['duration']), float(a['duration'])
ok(v['codec_name'] == 'h264' and v['pix_fmt'] == 'yuv420p', f"vídeo {v['codec_name']} {v.get('profile', '')} {v['pix_fmt']}")
ok((int(v['width']), int(v['height'])) == (1080, 1920), f"resolução {v['width']}x{v['height']} (9:16)")
ok(abs(fps - 60) < 0.01, f'{fps:.0f} fps, {v.get("nb_frames", "?")} quadros')
ok(45 <= vd <= 60, f'duração {vd:.2f} s (alvo 45–60 s)')
if PREVIA:
    ok(False, 'PRÉVIA: sem a voz oficial (tempos estimados) — não vale como vídeo final')
ok(a['codec_name'] == 'aac' and int(a['sample_rate']) == 48000 and int(a['channels']) == 2, f"áudio {a['codec_name']} {a['sample_rate']} Hz, {a['channels']} canais, {int(a.get('bit_rate', 0)) // 1000} kb/s")
ok(abs(vd - ad) < 0.05, f'vídeo e áudio com a mesma duração (Δ {abs(vd - ad) * 1000:.0f} ms)')
info(f'arquivo {int(inf["format"]["size"]) / 1e6:.1f} MB, {int(inf["format"]["bit_rate"]) / 1e6:.1f} Mb/s')
info('capítulos: ' + ' · '.join(f'{c["n"]:02d} {c["t1"] - c["t0"]:.2f} s' for c in LN['capitulos']) + f' · trocas de {LN["tr"]:.1f} s')

# ---------------------------------------------------------------- som
report += ['', 'SOM']
e = run(['ffmpeg', '-hide_banner', '-nostats', '-i', VIDEO, '-map', '0:a', '-af', 'ebur128=peak=true', '-f', 'null', '-']).stderr
summ = e[e.rindex('Summary:'):]
I = float(re.search(r'I:\s+(-?[\d.]+) LUFS', summ).group(1))
TP = float(re.search(r'Peak:\s+(-?[\d.]+) dBFS', summ).group(1))
ok(-14.5 <= I <= -13.5, f'loudness integrado {I:.1f} LUFS (alvo −14)')
ok(TP <= -1.0, f'pico real {TP:.1f} dBTP (limite −1)')
for nome, rot in (('voz-tratada', 'a voz sozinha'), ('musica', 'a trilha sozinha'), ('sfx', 'os efeitos sozinhos')):
    f = os.path.join(AUDL, nome + '.wav')
    if os.path.exists(f):
        ev = run(['ffmpeg', '-hide_banner', '-nostats', '-i', f, '-af', 'ebur128', '-f', 'null', '-']).stderr
        info(f'{rot}, na escala da mixagem: {float(re.search(r"I:\s+(-?[\d.]+) LUFS", ev[ev.rindex("Summary:"):]).group(1)):.1f} LUFS')

# ---------------------------------------------------------------- a voz: uma geração inteira por capítulo, sem emendas
report += ['', 'VOZ (voz oficial, uma geração inteira por capítulo, nada emendado)']
if not PREVIA:
    D = json.load(open(os.path.join(AUD, 'voz', 'falas.json')))
    info(f'{D["voz"]} ({D["voice_id"]}) · {D["modelo"]} · ajustes {json.dumps(D["ajustes"])}')
    sr, voz = wavfile.read(os.path.join(AUD, 'voz.wav'))
    voz = voz.astype(np.float64) / 32768
for c in LN['colocacao']:
    key = f'{c["cap"]:02d}'
    srx, y = wavfile.read(os.path.join(AUD, c['arquivo']))
    sha_ok = hashlib.sha1(y.tobytes()).hexdigest() == FALAS[key]['sha1_audio']
    y = y.astype(np.float64) / 32768
    seg = resample_poly(y[int(round(c['de_s'] * srx)):int(round(c['ate_s'] * srx))], sr, srx)
    i = int(round(c['no_video_s'] * sr))
    k0, k1 = int(0.008 * sr), int(0.06 * sr)
    got = voz[i + k0:i + len(seg) - k1]
    ref = seg[k0:len(seg) - k1]
    dif = float(np.abs(got - ref).max()) if len(got) == len(ref) else 9.0
    ok(sha_ok and dif < 2e-4, f'capítulo {key}: {c["ate_s"] - c["de_s"]:.2f} s contínuos da geração com seed {FALAS[key]["seed"]} '
       f'(arquivo íntegro: {"sim" if sha_ok else "NÃO"}; diferença máxima vídeo × geração {dif:.6f}; {FALAS[key]["geracoes"]} geração(ões) inteiras feitas)')
    ok(not re.search(r'\bde\s+Glória\b', FALAS[key]['texto'], re.I), f'capítulo {key}: "do/no Glória" (nunca "de Glória"); enviado à API: "{FALAS[key].get("texto_api", "")}"')

# ---------------------------------------------------------------- mapa de tempos e gatilhos
report += ['', 'MAPA DE TEMPOS E GATILHOS']
mp = LN.get('mapa', {})
ok(mp.get('ok', False), 'mapa de tempos de linha.py (total 45–60 s, capítulos 5–7 s, apoios ≥ 1,5 s, fecho 6–8 s, logo nos 3 últimos s)' + ('' if mp.get('ok') else ': ' + '; '.join(mp.get('falhas', []))))
sem = MOT.get('palavras_sem_peca', [])
ok(not sem, 'toda palavra "em" da cena está na fala' + ('' if not sem else ': ' + ', '.join(f'cap {x["cap"]:02d} "{x["palavra"]}"' for x in sem)))

# ---------------------------------------------------------------- leitura das linhas de apoio
report += ['', 'LEITURA (linhas de apoio)']
curtas = []
for ap in MOT['apoios']:
    tempo = ap['ate'] - ap['inteira_de']
    if tempo < 1.5 - 1e-3:
        curtas.append(ap)
    info(f'cap {ap["cap"]:02d} · apoio {ap["i"]}: {tempo:4.2f} s inteira · {" / ".join(ap["linhas"])}')
if MOT['apoios']:
    ok(not curtas, f'{len(MOT["apoios"])} linhas de apoio, a mais curta fica {min(ap["ate"] - ap["inteira_de"] for ap in MOT["apoios"]):.2f} s inteira na tela (mínimo 1,5 s)')
# nunca duas ao mesmo tempo; a anterior sai antes da próxima entrar
sobre = [(a1, a2) for a1, a2 in zip(MOT['apoios'], MOT['apoios'][1:]) if a1['cap'] == a2['cap'] and a1['ate'] > a2['entra'] + 1e-3]
ok(not sobre, 'a linha de apoio anterior sai antes de a próxima entrar (nunca duas ao mesmo tempo)')
# quebra de linha
JUNTOS = [['pertim', 'de', 'voce'], ['do', 'gloria'], ['no', 'gloria']]
CURTAS = {'o', 'a', 'os', 'as', 'um', 'uma', 'e', 'de', 'da', 'do', 'das', 'dos', 'no', 'na', 'nos', 'nas', 'em', 'ao', 'pra', 'pro', 'que', 'se'}
emoji = re.compile(r'[\U0001F300-\U0001FAFF\u2600-\u27BF]')
ruins = []
for ap in MOT['apoios']:
    rows = [r.split() for r in ap['linhas']]
    for r1, r2 in zip(rows, rows[1:]):
        a_, b_ = r1[-1], r2[0]
        allw = [w for r in rows for w in r]
        idx = sum(len(r) for r in rows[:rows.index(r2)])
        frase_fim = bool(re.search(r'[.?!…]["”’)]*$', allw[idx])) or idx == len(allw) - 1
        par = any(norm(a_) == j[k] and norm(b_) == j[k + 1] for j in JUNTOS for k in range(len(j) - 1))
        curta = norm(a_) in CURTAS and not re.search(r'[.?!…,;:]["”’)]*$', a_)   # artigo/palavra curta sozinha no fim da linha
        if frase_fim or par or curta or (emoji.search(b_) and not re.search(r'\w', b_)):
            ruins.append(f'"{a_} / {b_}" em "{ap["texto"]}"')
ok(not ruins, 'quebras de linha: nunca separam as duas últimas palavras, "pertim de você", "do/no Glória" nem o emoji, e nunca deixam artigo/palavra curta no fim da linha' + ('' if not ruins else ': ' + '; '.join(ruins)))

# ---------------------------------------------------------------- caixas: áreas seguras, apoio sobre peça, quadro vazio
report += ['', 'ÁREAS SEGURAS E COMPOSIÇÃO']
trocas = [(x['t0'], x['t1']) for x in MOT['trocas']]
em_troca = lambda t: any(a - 0.6 <= t <= b + 0.65 for a, b in trocas)             # troca + o título que entra antes e depois
fora, botao, sobre_peca, n_cx, n_t = [], [], [], 0, 0
for s in CX:
    if em_troca(s['t']):
        continue
    n_t += 1
    for b in s['caixas']:
        n_cx += 1
        x0_ok = b['nome'] == 'marca' or (b['x0'] >= SAFE['x0'] - 0.5 and b['x1'] <= SAFE['x1'] + 0.5)
        if b['y0'] < SAFE['y0'] - 0.5 or b['y1'] > SAFE['y1'] + 0.5 or not x0_ok:
            fora.append((s['t'], b))
        if b['x1'] > BTN['x'] and b['y1'] > BTN['y0'] and b['y0'] < BTN['y1']:
            botao.append((s['t'], b))
    aps = [b for b in s['caixas'] if b['nome'].startswith('apoio')]
    for ap in aps:
        for b in s['caixas']:
            if b['nome'].startswith(('apoio', 'marca', 'rótulo', 'título')):
                continue
            if min(ap['x1'], b['x1']) > max(ap['x0'], b['x0']) and min(ap['y1'], b['y1']) > max(ap['y0'], b['y0']):
                sobre_peca.append((s['t'], ap['nome'], b['nome']))
ok(not fora, f'conteúdo entre x {SAFE["x0"]}–{SAFE["x1"]} e y {SAFE["y0"]}–{SAFE["y1"]}: {n_cx} caixas em {n_t} quadros fora das trocas' + ('' if not fora else ' · fora: ' + '; '.join(f'{t:.2f}s {b["nome"]} x {b["x0"]:.0f}–{b["x1"]:.0f} y {b["y0"]:.0f}–{b["y1"]:.0f}' for t, b in fora[:6])))
ok(not botao, f'nenhuma caixa na coluna de botões (x ≥ {BTN["x"]}, y {BTN["y0"]}–{BTN["y1"]})' + ('' if not botao else ': ' + '; '.join(f'{t:.2f}s {b["nome"]}' for t, b in botao[:6])))
ok(not sobre_peca, 'a linha de apoio nunca fica por cima de card, balão ou peça de cena' + ('' if not sobre_peca else ': ' + '; '.join(f'{t:.2f}s {a_} × {b_}' for t, a_, b_ in sobre_peca[:6])))
ys = [b['y0'] for s in CX if not em_troca(s['t']) for b in s['caixas']] + [b['y1'] for s in CX if not em_troca(s['t']) for b in s['caixas']]
info(f'faixa usada pelo conteúdo: y {min(ys):.0f}–{max(ys):.0f}')
vazios = []
for a_, b_ in trocas:
    for s in CX:
        if a_ - 0.01 <= s['t'] <= b_ + 0.01:
            vis = [b for b in s['caixas'] if b['nome'] != 'marca' and b['y1'] > SAFE['y0'] and b['y0'] < SAFE['y1']]
            if not vis:
                vazios.append(s['t'])
ok(not vazios, f'sem quadro vazio nas {len(trocas)} trocas de capítulo (sempre há conteúdo na tela)' + ('' if not vazios else ': ' + ', '.join(f'{t:.2f}s' for t in vazios[:8])))

# pixels: a coluna de botões só com o fundo creme (4 quadros por segundo)
proc = subprocess.Popen(['ffmpeg', '-loglevel', 'error', '-i', VIDEO, '-vf', 'fps=4', '-pix_fmt', 'rgb24', '-f', 'rawvideo', '-'], stdout=subprocess.PIPE)
n_fr, n_but, f0 = 0, 0, None
while True:
    buf = proc.stdout.read(1920 * 1080 * 3)
    if len(buf) < 1920 * 1080 * 3:
        break
    f = np.frombuffer(buf, np.uint8).reshape(1920, 1080, 3)
    if f0 is None:
        f0 = f.astype(float) @ np.array([0.299, 0.587, 0.114])   # o mesmo cinza do PIL (convert('L'))
    col = f[BTN['y0']:BTN['y1'], BTN['x']:1080].astype(np.int16)
    med = np.median(col.reshape(-1, 3), axis=0)
    n_but += int((np.abs(col - med).max(axis=2) > 48).sum()); n_fr += 1
proc.wait()
ok(n_but == 0, f'coluna de botões: {n_but} pixel de conteúdo em {n_fr} quadros amostrados (só o fundo creme passa por ali)')
bd = run(['ffmpeg', '-hide_banner', '-nostats', '-i', VIDEO, '-vf', 'blackdetect=d=0.1:pix_th=0.06', '-an', '-f', 'null', '-']).stderr
ok(not re.findall(r'black_start', bd), 'sem trechos pretos')
fz = run(['ffmpeg', '-hide_banner', '-nostats', '-i', VIDEO, '-vf', 'freezedetect=n=-60dB:d=1.5', '-an', '-f', 'null', '-']).stderr
fr_ = re.findall(r'freeze_start: ([\d.]+)', fz)
ok(not fr_, 'sem imagem congelada por 1,5 s ou mais' + ('' if not fr_ else ': ' + ', '.join(fr_)))

# ---------------------------------------------------------------- capa = quadro 0
report += ['', 'CAPA E FECHO']
capa = np.asarray(Image.open(os.path.join(OUTD, 'capa.png')).convert('L')).astype(float)
# o quadro 0 de verdade (a amostragem de 4 por segundo acima começa num quadro vizinho, e a capa da série já se mexe)
with tempfile.TemporaryDirectory() as tmp:
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', VIDEO, '-frames:v', '1', os.path.join(tmp, 'q0.png')], check=True)
    f0 = np.asarray(Image.open(os.path.join(tmp, 'q0.png')).convert('L')).astype(float)
mse = float(np.mean((capa - f0) ** 2))
psnr = 99.0 if mse == 0 else 10 * np.log10(255 ** 2 / mse)
ok(psnr > 34, f'a capa é o quadro 0 do vídeo (PSNR {psnr:.1f} dB entre capa.png e o 1º quadro)')
ct = os.path.join(OUT, 'capa.txt')
if os.path.exists(ct):
    res = open(ct).read().strip().splitlines()[-1]
    ok('dentro da regra' in res, f'regra das capas (revisao/capa.txt): {res.replace("RESULTADO: ", "")}')

# ---------------------------------------------------------------- fecho
fe = MOT['fecho']
fd = fe['t1'] - fe['t0']
ok(6.0 <= fd <= 8.0, f'fecho com {fd:.2f} s (alvo 6–8 s)')
ult = fe['ultima_mudanca_de_texto']
ok(DUR - ult >= 3.0, f'fecho: a última mudança de texto é em {ult:.2f} s; o texto fica parado {DUR - ult:.2f} s até o fim (mínimo 3 s)')
ultimos = [s for s in CX if s['t'] >= DUR - 3.0 - 1e-6]
com_logo = [s for s in ultimos if any(b['nome'] == 'logo oficial' for b in s['caixas'])]
ok(ultimos and len(com_logo) == len(ultimos), f'a logo oficial está na tela em todos os {len(ultimos)} quadros amostrados dos 3 últimos segundos (parada desde {fe["logo"]["parada"]:.2f} s)')


def frame_at(t):
    with tempfile.TemporaryDirectory() as tmp:
        pth = os.path.join(tmp, 'f.png')
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', f'{t:.3f}', '-i', VIDEO, '-frames:v', '1', pth], check=True)
        return np.asarray(Image.open(pth).convert('L')).astype(float)


fa, fb = frame_at(DUR - 3.0), frame_at(min(DUR, vd) - 0.15)
fim = ultimos[-1]['caixas'] if ultimos else []
difs = []
for b in [b for b in fim if b['cap'] == len(LN['capitulos']) - 1 or b['nome'] == 'marca']:
    x0, x1, y0, y1 = int(max(0, b['x0'])), int(min(1080, b['x1'])), int(max(0, b['y0'])), int(min(1920, b['y1']))
    if b['nome'] == 'logo oficial':                    # o miolo da logo (os cantos da caixa mostram o fundo, que gira devagar)
        mx, my = (x1 - x0) // 5, (y1 - y0) // 5
        x0, x1, y0, y1 = x0 + mx, x1 - mx, y0 + my, y1 - my
    A, B = fa[y0:y1, x0:x1], fb[y0:y1, x0:x1]
    tinta = (A < 190) | (B < 190)                       # só os pixels do desenho/texto (o fundo creme gira devagar por trás)
    difs.append((b['nome'], float(np.abs(A - B)[tinta].mean()) if tinta.any() else 0.0))
mx = max(d for _, d in difs) if difs else 9
ok(difs and mx < 3.0, f'fecho: {len(difs)} elementos (logo oficial, título, chip, seta, marca) iguais entre {DUR - 3:.2f} s e o fim (maior diferença média {mx:.2f} de 255)')
info('elementos: ' + ', '.join(f'{n} {d:.2f}' for n, d in difs))

# ---------------------------------------------------------------- folha das zonas seguras
font = ImageFont.truetype(FONT, 26)
CHECK_T = [0.0] + [round(c['t1'] - 0.2, 2) for c in LN['capitulos']] + [round((x['t0'] + x['t1']) / 2, 2) for x in MOT['trocas']]
CHECK_T = sorted(set(CHECK_T))
with tempfile.TemporaryDirectory() as tmp:
    TW, TH, COLS = 300, 533, 6
    rows = (len(CHECK_T) + COLS - 1) // COLS
    sheet = Image.new('RGB', (COLS * (TW + 10) + 10, rows * (TH + 44) + 10), (40, 40, 40))
    dr = ImageDraw.Draw(sheet)
    for i, t in enumerate(CHECK_T):
        pth = os.path.join(tmp, f'{i}.png')
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', str(t), '-i', VIDEO, '-frames:v', '1', pth], check=True)
        im = Image.open(pth).convert('RGBA'); ov = Image.new('RGBA', im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
        d.rectangle((BTN['x'], BTN['y0'], 1079, BTN['y1'] - 1), fill=(255, 40, 80, 70), outline=(255, 40, 80, 255), width=4)
        d.rectangle((0, 0, 1079, SAFE['y0'] - 1), fill=(255, 40, 80, 50)); d.rectangle((0, SAFE['y1'] + 1, 1079, 1919), fill=(255, 40, 80, 30))
        d.rectangle((0, SAFE['y0'], SAFE['x0'] - 1, SAFE['y1']), fill=(255, 40, 80, 30))
        # o contorno da área livre da interface do TikTok (topo 130, base 380, direita 140)
        d.rectangle((0, TIKTOK['topo'], 1079 - TIKTOK['direita'], 1919 - TIKTOK['base']), outline=(40, 200, 255, 255), width=5)
        im = Image.alpha_composite(im, ov).convert('RGB').resize((TW, TH), Image.LANCZOS)
        x0, y0 = 10 + (i % COLS) * (TW + 10), 10 + (i // COLS) * (TH + 44)
        sheet.paste(im, (x0, y0)); dr.text((x0, y0 + TH + 8), f'{t:05.2f}s', font=font, fill=(249, 178, 51))
    sheet.save(os.path.join(OUT, 'zonas-seguras.jpg'), quality=88)

res = 'RESULTADO: ' + ('aprovado' if not fails else f'{len(fails)} falha(s)')
if PREVIA:
    res = 'RESULTADO: PRÉVIA sem voz — não aprovado (' + (f'{len(fails) - 1} falha(s) além da falta da voz' if len(fails) > 1 else 'visual sem outras falhas') + ')'
txt = [f'TUDO PERTIM · {EP} — revisão técnica' + (' (PRÉVIA, tempos estimados, sem voz)' if PREVIA else ''), os.path.relpath(VIDEO, ROOT), ''] + report + ['', res]
open(os.path.join(OUT, 'relatorio-tecnico.txt'), 'w').write('\n'.join(txt) + '\n')
print('\n'.join(txt))
sys.exit(0 if not fails else 1)
