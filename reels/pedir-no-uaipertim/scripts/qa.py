#!/usr/bin/env python3
"""
Revisão técnica do Reel "Pedir no UaiPertim é assim".

    python3 reels/pedir-no-uaipertim/scripts/qa.py

Confere o MP4 final (output/uaipertim-pedir-no-uaipertim.mp4) contra os mesmos dados que a composição usa (layout.json,
dados/{cena,visemas,legenda}.json, fonte/pontos.json) e escreve output/revisao/relatorio-tecnico.txt:
  • formato: h264 yuv420p 1080×1920 a 60 fps, 35–40 s, AAC 48 kHz estéreo, vídeo e áudio com a mesma duração;
  • som: −14 LUFS integrados (±0,5), pico real ≤ −1 dBTP, a voz na frente da trilha animada;
  • voz: o roteiro exato, perfil "narracao" (eleven_v4), "UaiPertim"/"Pertim" sem troca de grafia, cada cena UMA geração
    inteira colocada sem cortes, "no Glória", nada de Pix nem cartão on-line no texto;
  • Pix e cartão on-line: a faixa do Checkout com Pix e Cartão (y 1090–1580 da imagem) nunca entra na tela do celular,
    quadro a quadro (a rolagem da composição), e nenhum recorte usado vem dela;
  • o Pertim fala sempre olhando para a câmera (pupilas centradas em todos os quadros de fala); boca pelos visemas
    (≥ 2 quadros, M no fim de cada "Pertim"), piscadas nunca com a boca aberta;
  • legenda: só o texto da tela, até 2 linhas, ≥ 1,5 s, cobre a fala, dentro da área segura, sem cobrir o Pertim, e
    nunca sobreposta ao chip "Segue @uaipertim"; o selo "Imagens ilustrativas" dentro da área segura, fora da coluna dos
    botões do Instagram, no vídeo inteiro (pelos pixels);
  • trocas de cena todas diferentes; gancho com movimento desde o quadro 0; a logo parada nos 3 últimos segundos.
Termina em "RESULTADO: aprovado" ou "RESULTADO: ajustar".
"""
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
import numpy as np
from PIL import Image, ImageFont
from scipy.io import wavfile
from scipy.signal import resample_poly

AQUI = os.path.dirname(os.path.abspath(__file__))
REEL = os.path.dirname(AQUI)
REPO = os.path.dirname(os.path.dirname(REEL))
sys.path.insert(0, os.path.join(REPO, 'scripts', 'personagem'))
import fala  # noqa: E402

AUD = os.path.join(REPO, 'reels', 'explica-so', 'audio', 'pedir-no-uaipertim')
OUT = os.path.join(REEL, 'output')
REV = os.path.join(OUT, 'revisao')
os.makedirs(REV, exist_ok=True)
VIDEO = os.path.join(OUT, 'uaipertim-pedir-no-uaipertim.mp4')
LAY = json.load(open(os.path.join(REEL, 'layout.json')))
CENA = json.load(open(os.path.join(REEL, 'dados', 'cena.json')))
VIS = json.load(open(os.path.join(REEL, 'dados', 'visemas.json')))
LEG = json.load(open(os.path.join(REEL, 'dados', 'legenda.json')))
PONTOS = json.load(open(os.path.join(REEL, 'fonte', 'pontos.json')))
LN = json.load(open(os.path.join(AUD, 'linha.json')))
FALAS = json.load(open(os.path.join(AUD, 'voz', 'falas.json')))
TSX = open(os.path.join(REPO, 'src', 'pedir-no-uaipertim', 'PedirNoUaiPertim.tsx')).read()
EV = CENA['eventos']
DUR, FPS = CENA['duracao'], CENA['fps']
ROTEIRO = [
    'Bateu aquela fome? Ó, pedir no UaiPertim é assim:',
    'Abre, escolhe o que quer...',
    '...monta o lanche do seu jeito. Com bacon, claro.',
    'Paga na entrega, no dinheiro ou na maquininha.',
    'Aí é só acompanhar: a loja aceita, prepara e sai pra entrega. Sem ficar esperando resposta no WhatsApp.',
    'E cada pedido ainda rende pão de queijo... em pontos!',
    'UaiPertim. Tá chegando no Glória!',
]
FONTE = lambda s: ImageFont.truetype(os.path.join(REPO, 'public', 'fonts', 'poppins-latin-800-normal.woff2'), s)
SEG = LAY['seguro']
report, fails = [], []


def ok(cond, msg):
    report.append(('OK   ' if cond else 'FALHA') + '  ' + msg)
    if not cond:
        fails.append(msg)


def info(msg):
    report.append('       ' + msg)


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)


def dentro(cx, caixa):
    return caixa[0] >= cx[0] and caixa[1] >= cx[1] and caixa[2] <= cx[2] and caixa[3] <= cx[3]


def cruza(a, b):
    return a[0] < b[2] and b[0] < a[2] and a[1] < b[3] and b[1] < a[3]


def quadro(t):
    with tempfile.TemporaryDirectory() as tmp:
        pth = os.path.join(tmp, 'f.png')
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', f'{t:.3f}', '-i', VIDEO, '-frames:v', '1', pth], check=True)
        return np.asarray(Image.open(pth).convert('RGB')).astype(float)


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
ok(35.0 <= vd <= 40.0, f'duração {vd:.2f} s (pedido: 35–40 s)')
ok(a['codec_name'] == 'aac' and int(a['sample_rate']) == 48000 and int(a['channels']) == 2, f"áudio {a['codec_name']} {a['sample_rate']} Hz, {a['channels']} canais, {int(a.get('bit_rate', 0)) // 1000} kb/s")
ok(abs(vd - ad) < 0.05, f'vídeo e áudio com a mesma duração (Δ {abs(vd - ad) * 1000:.0f} ms)')
info(f'arquivo {int(inf["format"]["size"]) / 1e6:.1f} MB, {int(inf["format"]["bit_rate"]) / 1e6:.1f} Mb/s')
info('cenas: ' + ' · '.join(f'{c["n"] + 1} {c["tipo"]} {c["t0"]:.2f}–{c["t1"]:.2f}' for c in CENA['cenas']))

# ---------------------------------------------------------------- som
report += ['', 'SOM']
e = run(['ffmpeg', '-hide_banner', '-nostats', '-i', VIDEO, '-map', '0:a', '-af', 'ebur128=peak=true', '-f', 'null', '-']).stderr
summ = e[e.rindex('Summary:'):]
I = float(re.search(r'I:\s+(-?[\d.]+) LUFS', summ).group(1))
TP = float(re.search(r'Peak:\s+(-?[\d.]+) dBFS', summ).group(1))
ok(-14.5 <= I <= -13.5, f'loudness integrado {I:.1f} LUFS (alvo −14)')
ok(TP <= -1.0, f'pico real {TP:.1f} dBTP no MP4 (limite −1)')
PISTAS = {}
for nome in ('voz-tratada', 'musica', 'sfx'):
    ev = run(['ffmpeg', '-hide_banner', '-nostats', '-i', os.path.join(AUD, nome + '.wav'), '-af', 'ebur128', '-f', 'null', '-']).stderr
    PISTAS[nome] = float(re.search(r"I:\s+(-?[\d.]+) LUFS", ev[ev.rindex("Summary:"):]).group(1))
info(f'na escala da mixagem: a voz {PISTAS["voz-tratada"]:.1f} · a trilha (animada, a do Tudo Pertim) {PISTAS["musica"]:.1f} · os efeitos {PISTAS["sfx"]:.1f} LUFS')
dv = PISTAS['voz-tratada'] - PISTAS['musica']
ok(9.0 <= dv <= 16.0, f'a trilha {dv:.1f} dB abaixo da voz (a voz na frente: 9–16 dB)')

# ---------------------------------------------------------------- voz
report += ['', 'VOZ (Victor Pinho, perfil "narracao", uma geração inteira por cena, nada emendado)']
info(f'{FALAS["voz"]} ({FALAS["voice_id"]}) · {FALAS["modelo"]} · ajustes {json.dumps(FALAS["ajustes"])}')
sr, voz = wavfile.read(os.path.join(AUD, 'voz.wav'))
voz = voz.astype(np.float64) / 32768
for c in LN['colocacao']:
    key = f'{c["cap"]:02d}'
    F = FALAS['capitulos'][key]
    srx, y = wavfile.read(os.path.join(AUD, c['arquivo']))
    sha_ok = hashlib.sha1(y.tobytes()).hexdigest() == F['sha1_audio']
    y = y.astype(np.float64) / 32768
    seg = resample_poly(y[int(round(c['de_s'] * srx)):int(round(c['ate_s'] * srx))], sr, srx)
    i = int(round(c['no_video_s'] * sr))
    k0, k1 = int(0.008 * sr), int(0.06 * sr)
    got, ref = voz[i + k0:i + len(seg) - k1], seg[k0:len(seg) - k1]
    dif = float(np.abs(got - ref).max()) if len(got) == len(ref) else 9.0
    ok(sha_ok and dif < 2e-4 and F['texto'] == ROTEIRO[c['cap']] and F.get('perfil') == 'narracao' and F.get('modelo') == 'eleven_v4',
       f'cena {c["cap"] + 1}: "{F["texto"]}" · {c["ate_s"] - c["de_s"]:.2f} s contínuos da geração com seed {F["seed"]} '
       f'(íntegra: {"sim" if sha_ok else "NÃO"}; dif. {dif:.6f}) · {F.get("perfil")} {F.get("modelo")}')
todos = ' '.join(ROTEIRO)
api = ' '.join(FALAS['capitulos'][f'{n:02d}']['texto_api'] for n in range(len(ROTEIRO)))
ok('UaiPertim' in api and 'Pértim' not in api and 'Uai Pértim' not in api, '"UaiPertim" enviado à voz sem troca de grafia')
ok(not re.search(r'\bde\s+Glória\b', todos, re.I) and re.search(r'\b(no|do)\s+Glória\b', todos), '"no Glória" (nunca "de Glória")')
ok(not re.search(r'\bpix\b|cart[aã]o de cr[eé]dito|cart[aã]o on-?line|pagamento on-?line', todos, re.I), 'nenhuma menção a Pix nem a cartão on-line na fala (só "Pagar na entrega": dinheiro ou maquininha)')

# ---------------------------------------------------------------- Pix e cartão on-line nunca na tela
report += ['', 'PIX E CARTÃO ON-LINE (NUNCA EM QUADRO)']
CEL = LAY['celular']
BZ = CEL['w'] * 0.042
K = (CEL['w'] - 2 * BZ) / CEL['telaCss']
VIEW = (CEL['h'] - 2 * BZ) / K                      # a altura da tela do celular, em px de CSS
PROIB = {nome: [(a_ * 3, b_ * 3) for a_, b_ in faixas] for nome, faixas in LAY['proibido'].items()}
PROIB_IMG = (1090, 1580)                             # a faixa medida na PNG do Checkout (Pix e Cartão de crédito)
ok(all(a_ <= PROIB_IMG[0] and b_ >= PROIB_IMG[1] for a_, b_ in PROIB['Checkout']), f'a faixa proibida do layout cobre y {PROIB_IMG[0]}–{PROIB_IMG[1]} da imagem do Checkout ({PROIB["Checkout"]})')
PASSOS = CENA['celular']


def inout(x):
    u = min(1.0, max(0.0, x))
    return 4 * u ** 3 if u < 0.5 else 1 - (-2 * u + 2) ** 3 / 2


def rola_em(p, t):
    r = p['rola']
    if t <= r[0][0]:
        return r[0][1]
    for i in range(1, len(r)):
        if t <= r[i][0]:
            return r[i - 1][1] + (r[i][1] - r[i - 1][1]) * inout((t - r[i - 1][0]) / max(1e-6, r[i][0] - r[i - 1][0]))
    return r[-1][1]


vistos, menor, ruins = 0, 1e9, []
for q in range(CENA['quadros']):
    t = q / FPS
    k = max([i for i, p in enumerate(PASSOS) if t >= p['t']], default=0)
    telas = [(PASSOS[k], rola_em(PASSOS[k], t))]
    if k > 0 and t < PASSOS[k]['t'] + 0.32:            # na troca de tela, a anterior ainda aparece
        telas.append((PASSOS[k - 1], rola_em(PASSOS[k - 1], t)))
    for p, r in telas:
        if p['tela'] not in PROIB:
            continue
        vistos += 1
        y0, y1 = r * 3, (r + VIEW) * 3                 # o que a tela mostra, em px da imagem
        menor = min(menor, y0)
        if any(y0 < b_ and a_ < y1 for a_, b_ in PROIB[p['tela']]):
            ruins.append(round(t, 2))
info(f'o Checkout aparece em {vistos} quadros; o topo da tela nunca sobe acima de y {menor:.0f} da imagem (a faixa de Pix e Cartão termina em {PROIB_IMG[1]})')
ok(vistos > 0 and not ruins, 'a faixa de Pix e Cartão do Checkout nunca entra na tela, quadro a quadro' + (f': aparece em {ruins[:5]}' if ruins else ''))
REC_USADOS = sorted(set(re.findall(r'src="([a-z0-9-]+)"', TSX)) | set(re.findall(r'recortes/([a-z0-9-]+)\.png', TSX)))
chk = [r for r in REC_USADOS if r in PONTOS and PONTOS[r]['tela'] == 'Checkout']
ok(all(PONTOS[r]['y'] * 3 >= PROIB_IMG[1] for r in chk), f'os recortes do Checkout usados ({", ".join(chk)}) ficam abaixo da faixa (Pagar na entrega em y {PONTOS["opcao-pagar-na-entrega"]["y"] * 3})')

# ---------------------------------------------------------------- o Pertim: olhar, boca e piscadas
report += ['', 'O PERTIM (olhar na câmera, boca e piscadas)']
bocas = VIS['bocas']
falando = np.zeros(len(bocas), bool)
for c in CENA['cenas']:
    falando[int(round((c['voz_t0'] - 0.02) * FPS)):int(round((c['voz_t1'] + 0.04) * FPS)) + 1] = True
desvio = np.zeros(len(bocas), bool)
for o in CENA['olhares']:
    desvio[int(round(o['t0'] * FPS)):int(round(o['t1'] * FPS)) + 1] = True
rig_centro = re.search(r'const rigEm[\s\S]*?olhar: \[0, 0\], centro: true', TSX) is not None
pct = 100 * float((falando & ~desvio).sum()) / float(falando.sum()) if rig_centro else 0.0
ok(rig_centro and not CENA['olhares'] and pct == 100.0, f'olhar na câmera (pupilas centradas) em {pct:.0f}% dos {int(falando.sum())} quadros de fala, sem nenhum desvio (o rig de todos os Pertins da composição usa olhar [0, 0] com "centro")')
corridas, q = [], 0
while q < len(bocas):
    j = q
    while j < len(bocas) and bocas[j] == bocas[q]:
        j += 1
    corridas.append((bocas[q], q, j - q)); q = j
ok(len(bocas) == CENA['quadros'] and min(c[2] for c in corridas) >= 2, f'boca pelos visemas: {len(bocas)} quadros, {len(corridas) - 1} trocas, a mais curta com {min(c[2] for c in corridas)} quadros (mínimo 2)')
ok(not [i for i, x in enumerate(bocas) if x != 'R' and not falando[i]], 'fora da fala, a boca é a da expressão')
pertins = [w for c in LN['capitulos'] for w in c['palavras'] if fala.norm(w['w']).endswith('pertim')]
fecha = [w['w'] for w in pertins if 'M' in bocas[max(0, int(round(w['t1'] * FPS)) - 5):int(round(w['t1'] * FPS)) + 1]]
ok(len(fecha) == len(pertins), f'a boca fecha em M no fim de cada "UaiPertim" ({len(fecha)} de {len(pertins)})')
P = CENA['piscadas']
abertas = [p for p in P if any(bocas[q] in 'AO' for q in range(int(p * FPS), min(len(bocas), int((p + CENA['piscada_dur']) * FPS) + 1)))]
ok(not abertas, f'{len(P)} piscadas, nenhuma com a boca aberta (A/O)')

# ---------------------------------------------------------------- legenda, chip e selo
report += ['', 'LEGENDA, CHIP E SELO']
EST = LEG['estilo']
B = LEG['blocos']
fl = FONTE(EST['size'])
ok(all(b['t1'] - b['t0'] >= 1.5 - 1e-6 for b in B), f'{len(B)} blocos, o mais curto fica {min(b["t1"] - b["t0"] for b in B):.2f} s (mínimo 1,5 s)')
ok(all(len(b['linhas']) <= 2 for b in B), 'no máximo 2 linhas por bloco')
ok(fala.norm(' '.join(w['w'] for b in B for l in b['linhas'] for w in l)) == fala.norm(' '.join(ROTEIRO)), 'o texto da legenda é o texto da tela, palavra por palavra (nunca a grafia de pronúncia)')
sem = [p['w'] for c in LN['capitulos'] for p in c['palavras']
       if not any(b['t0'] <= p['t0'] + 0.01 and p['t0'] < b['t1'] and any(w['t0'] == p['t0'] for l in b['linhas'] for w in l) for b in B)]
ok(not sem, 'cada palavra falada está na tela enquanto é dita' + (f': faltam {sem}' if sem else ''))
ok(all(b2['t0'] >= b1['t1'] - 1e-6 for b1, b2 in zip(B, B[1:])), 'nunca dois blocos ao mesmo tempo')
pilulas = []
for b in B:
    larg = max(fl.getlength(' '.join(w['w'] for w in l)) for l in b['linhas'])
    wp, hp = larg + 2 * EST['padX'], len(b['linhas']) * EST['lh'] + 2 * EST['padY']
    pilulas.append((b, [EST['cx'] - wp / 2, EST['base'] - hp, EST['cx'] + wp / 2, EST['base']]))
ok(all(dentro(SEG, p) for _, p in pilulas), f'as pílulas da legenda dentro da área segura (x {min(p[0] for _, p in pilulas):.0f}–{max(p[2] for _, p in pilulas):.0f}, y {min(p[1] for _, p in pilulas):.0f}–{EST["base"]})')
# o Pertim narrador (o desenho visível) fica acima da faixa da legenda
NAR = LAY['pertim']['narrador']
pes = max(NAR['base'] - NAR['altura'] + LAY['visivel'][p]['y'][1] * NAR['altura'] for p in ('apontando', 'comemorando'))
FC = LAY['pertim']['fecho']
pes_f = FC['base'] - FC['altura'] + LAY['visivel']['acenando']['y'][1] * FC['altura']
ok(max(pes, pes_f) <= min(p[1] for _, p in pilulas), f'a legenda não cobre o Pertim (os pés em y {max(pes, pes_f):.0f}; a pílula começa em y {min(p[1] for _, p in pilulas):.0f})')
CH = LAY['fecho']['chip']
chw = FONTE(CH['size']).getlength('Segue @uaipertim') + 14 + 34 + 72
CHIP = [CH['cx'] - chw / 2, CH['cy'] - CH['h'] / 2, CH['cx'] + chw / 2, CH['cy'] + CH['h'] / 2 + 7]
sobre = [round(b['t0'], 2) for b, p in pilulas if b['t1'] > EV['fecho']['chip'] and cruza(p, CHIP)]
ok(not sobre, f'o chip "Segue @uaipertim" (x {CHIP[0]:.0f}–{CHIP[2]:.0f}, y {CHIP[1]:.0f}–{CHIP[3]:.0f}) nunca sobreposto à legenda (y ≥ {min(p[1] for _, p in pilulas):.0f})')
ok(dentro(SEG, CHIP) and DUR - EV['fecho']['chip'] >= 1.5, f'o chip dentro da área segura, {DUR - EV["fecho"]["chip"]:.2f} s na tela (≥ 1,5 s)')
SL = LAY['selo']
slw = FONTE(SL['size']).getlength('Imagens ilustrativas') + 0.5 * 20 + 28
SELO = [SL['x'], SL['y'], SL['x'] + slw, SL['y'] + SL['size'] + 8 + 8]
COLUNA_IG = 860                                       # à direita disto ficam os botões do Instagram
ok(dentro(SEG, SELO) and SELO[2] <= COLUNA_IG, f'o selo "Imagens ilustrativas" em x {SELO[0]:.0f}–{SELO[2]:.0f}, y {SELO[1]:.0f}–{SELO[3]:.0f}: dentro da área segura e fora da coluna dos botões (x > {COLUNA_IG})')
ok('<Selo x={L.selo.x}' in TSX and TSX.rindex('<Selo') > TSX.rindex('<Legenda'), 'o selo é a última camada da composição (nada o cobre)')
# pelos pixels: a pílula do selo (creme translúcido com texto escuro) está no mesmo lugar do começo ao fim
amostras = [quadro(t)[int(SELO[1]):int(SELO[3]), int(SELO[0]):int(SELO[2])] for t in np.linspace(0.05, DUR - 0.05, 9)]
escuros = [float((x.mean(axis=2) < 150).mean()) for x in amostras]
ok(min(escuros) > 0.04, f'o selo aparece em todos os {len(amostras)} quadros amostrados do vídeo (texto escuro: {min(escuros) * 100:.0f}–{max(escuros) * 100:.0f}% da caixa)')
TEXTOS = [('"BATEU A FOME?"', EV['gancho']['fome'], CENA['trocas'][0]['t0'] + 0.3), ('"CHEGA ATÉ 20h35"', EV['acompanhar']['carimbo'], CENA['trocas'][4]['t0']),
          ('"TOTAL R$ 70,80"', EV['checkout']['contador'][1], CENA['trocas'][3]['t0'] + 0.4), ('"+20"', EV['pontos']['contador'][0], CENA['trocas'][5]['t0']),
          ('"Tá chegando no Glória"', EV['fecho']['texto'], DUR)]
for nome, a_, b_ in TEXTOS:
    ok(b_ - a_ >= 1.5, f'{nome} fica {b_ - a_:.2f} s na tela (≥ 1,5 s)')

# ---------------------------------------------------------------- trocas, gancho e fecho
report += ['', 'TROCAS, GANCHO E FECHO']
tipos = [k['tipo'] for k in CENA['trocas']]
ok(len(set(tipos)) == len(tipos) == len(CENA['cenas']) - 1, 'trocas de cena todas diferentes: ' + ' > '.join(tipos))
qs = [quadro(x) for x in (0.0, 0.1, 0.2, 0.3, 0.4, 0.5)]
mud = [float(np.abs(a_ - b_).mean()) for a_, b_ in zip(qs, qs[1:])]
ok(min(mud) > 0.3, f'gancho: a motinha já entra desde o quadro 0 (mudança média a cada 0,1 s: {min(mud):.2f}–{max(mud):.2f})')
lg = LAY['fecho']['logo']
# parada = a logo no mesmo lugar e do mesmo tamanho: o centro e as bordas da área coral dela (o fundo de raios gira atrás,
# e a compressão varia o quadro inteiro, então a diferença de pixel bruta não serve)
r = int(lg['d'] * 0.55)
geo = []
for t in np.linspace(DUR - 3.0, DUR - 0.05, 8):
    x = quadro(t)[lg['cy'] - r:lg['cy'] + r, lg['cx'] - r:lg['cx'] + r]
    m = (np.abs(x - np.array([247, 78, 42])).sum(axis=2) < 70)
    ys, xs = np.where(m)
    geo.append((xs.mean(), ys.mean(), xs.min(), xs.max(), ys.min(), ys.max(), m.sum()))
geo = np.array(geo)
desvio = float(np.abs(geo[:, :6] - geo[0, :6]).max())
area = float(np.abs(geo[:, 6] / geo[0, 6] - 1).max())
ok(EV['fecho']['logo']['parada'] <= DUR - 3.0 and desvio <= 1.0 and area <= 0.01,
   f'a logo (selo) parada desde {EV["fecho"]["logo"]["parada"]:.2f} s, nos 3 últimos segundos ({len(geo)} amostras: centro e bordas da área coral variam no máximo {desvio:.2f} px, a área {area * 100:.2f}%)')
mp = LN.get('mapa', {})
ok(mp.get('ok', False), 'mapa de tempos de linha.py (35–40 s, fecho 4–6 s, logo nos 3 últimos s)')

report += ['', f'RESULTADO: {"aprovado" if not fails else "ajustar"}']
txt = '\n'.join(['REVISÃO TÉCNICA — Reel "Pedir no UaiPertim é assim" (uaipertim-pedir-no-uaipertim.mp4)', ''] + report) + '\n'
open(os.path.join(REV, 'relatorio-tecnico.txt'), 'w').write(txt)
print(txt)
