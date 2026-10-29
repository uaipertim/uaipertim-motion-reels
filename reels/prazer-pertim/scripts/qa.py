#!/usr/bin/env python3
"""
Revisão técnica do Reel de teste "Prazer, Pertim".

    python3 reels/prazer-pertim/scripts/qa.py

Confere o MP4 final (output/uaipertim-prazer-pertim.mp4) contra os mesmos dados que a composição usa
(layout.json e dados/{cena,visemas,legenda}.json) e escreve output/revisao/relatorio-tecnico.txt:
  • formato: h264 yuv420p 1080×1920 a 60 fps, AAC 48 kHz estéreo, vídeo e áudio com a mesma duração;
  • som: −14 LUFS integrados (±0,5), pico real ≤ −1 dBTP, a voz na frente da trilha;
  • voz: o roteiro exato, perfil "narracao" (eleven_v4), cada cena UMA geração inteira colocada sem cortes, "do/no Glória";
  • legenda: só o texto da tela, até 2 linhas, cada bloco ≥ 1,5 s, cobre toda a fala, dentro da zona segura e sem
    cobrir o personagem, o chip ou as lojinhas; sai antes dos 3 últimos segundos;
  • boca: nenhuma boca menos de 2 quadros, repouso fora da fala, as 5 bocas usadas; piscadas a cada 2–4 s e nunca
    com a boca aberta;
  • gancho (movimento desde o quadro 0), fecho de 6–8 s, chip "Segue @uaipertim" ≥ 1,5 s, logo oficial PARADA nos
    3 últimos segundos (pelos pixels do vídeo) e a capa (scripts/revisao_capa.py do Explica, Sô!).
Termina em "RESULTADO: aprovado" ou "RESULTADO: ajustar".
"""
import hashlib
import json
import os
import re
import subprocess
import tempfile
import unicodedata
import numpy as np
from PIL import Image, ImageFont
from scipy.io import wavfile
from scipy.signal import resample_poly

AQUI = os.path.dirname(os.path.abspath(__file__))
REEL = os.path.dirname(AQUI)
REPO = os.path.dirname(os.path.dirname(REEL))
AUD = os.path.join(REPO, 'reels', 'explica-so', 'audio', 'prazer-pertim')
OUT = os.path.join(REEL, 'output')
REV = os.path.join(OUT, 'revisao')
VIDEO = os.path.join(OUT, 'uaipertim-prazer-pertim.mp4')
LAY = json.load(open(os.path.join(REEL, 'layout.json')))
CENA = json.load(open(os.path.join(REEL, 'dados', 'cena.json')))
VIS = json.load(open(os.path.join(REEL, 'dados', 'visemas.json')))
LEG = json.load(open(os.path.join(REEL, 'dados', 'legenda.json')))
LN = json.load(open(os.path.join(AUD, 'linha.json')))
FALAS = json.load(open(os.path.join(AUD, 'voz', 'falas.json')))
EV = CENA['eventos']
DUR, FPS = CENA['duracao'], CENA['fps']
ROTEIRO = [
    'Opa! Prazer, eu sou o UaiPertim… mas pode me chamar de Pertim.',
    'Eu sei onde fica tudo no Glória: a padaria, o mercadim, a lanchonete…',
    'E logo, logo, vou levar tudo isso pertim de você.',
    'Segue a gente pra não perder a estreia!',
]
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


def dentro(cx, caixa):
    return caixa[0] >= cx[0] and caixa[1] >= cx[1] and caixa[2] <= cx[2] and caixa[3] <= cx[3]


def cruza(a, b):
    return a[0] < b[2] and b[0] < a[2] and a[1] < b[3] and b[1] < a[3]


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
ok(15.0 <= vd <= 30.0, f'duração {vd:.2f} s (pedido: ~20 s; limite do teste 15–30 s)')
ok(a['codec_name'] == 'aac' and int(a['sample_rate']) == 48000 and int(a['channels']) == 2, f"áudio {a['codec_name']} {a['sample_rate']} Hz, {a['channels']} canais, {int(a.get('bit_rate', 0)) // 1000} kb/s")
ok(abs(vd - ad) < 0.05, f'vídeo e áudio com a mesma duração (Δ {abs(vd - ad) * 1000:.0f} ms)')
info(f'arquivo {int(inf["format"]["size"]) / 1e6:.1f} MB, {int(inf["format"]["bit_rate"]) / 1e6:.1f} Mb/s')
info('cenas: ' + ' · '.join(f'{c["n"] + 1} {c["tipo"]} {c["t0"]:.2f}–{c["t1"]:.2f} s' for c in CENA['cenas']))

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

# ---------------------------------------------------------------- a voz
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
    ok(sha_ok and dif < 2e-4, f'cena {c["cap"] + 1}: {c["ate_s"] - c["de_s"]:.2f} s contínuos da geração com seed {F["seed"]} '
       f'(arquivo íntegro: {"sim" if sha_ok else "NÃO"}; diferença máxima vídeo × geração {dif:.6f}; {F["geracoes"]} geração(ões) inteiras feitas)')
    ok(F['texto'] == ROTEIRO[c['cap']], f'cena {c["cap"] + 1}: o texto do roteiro, exato: "{F["texto"]}"')
    ok(F.get('perfil') == 'narracao' and F.get('modelo') == 'eleven_v4', f'cena {c["cap"] + 1}: perfil {F.get("perfil")} · {F.get("modelo")} · enviado à API: "{F.get("texto_api", "")}"')
todos = ' '.join(ROTEIRO)
ok(not re.search(r'\bde\s+Glória\b', todos, re.I) and re.search(r'\b(no|do)\s+Glória\b', todos), '"no Glória" (nunca "de Glória")')
ok(not re.search(r'\bapp\b|aplicativo', todos, re.I), 'nenhuma menção a app (nem "não é app"); nenhuma tela de app no vídeo')

# ---------------------------------------------------------------- mapa
report += ['', 'MAPA DE TEMPOS']
mp = LN.get('mapa', {})
ok(mp.get('ok', False), 'mapa de tempos de linha.py (total, fecho 6–8 s, logo nos 3 últimos s)' + ('' if mp.get('ok') else ': ' + '; '.join(mp.get('falhas', []))))
fecho = CENA['cenas'][-1]
ok(6.0 <= fecho['t1'] - fecho['t0'] <= 8.0, f'fecho de {fecho["t1"] - fecho["t0"]:.2f} s (6–8 s)')
ok(DUR - EV['logo']['parada'] >= 3.0, f'a logo oficial entra em {EV["logo"]["entra"]:.2f} s e fica parada desde {EV["logo"]["parada"]:.2f} s ({DUR - EV["logo"]["parada"]:.2f} s parada)')
ok(DUR - EV['chip'] >= 1.5, f'o chip "Segue @uaipertim" fica {DUR - EV["chip"]:.2f} s na tela (≥ 1,5 s)')
c1 = next(c for c in LN['capitulos'] if c['n'] == 1)
for l in EV['lojas']:
    w = next(p for p in c1['palavras'] if abs(p['t0'] - l['t']) < 1e-6)
    info(f'a lojinha {l["tipo"]} brota em {l["t"]:.2f} s, na palavra "{w["w"]}"')
lojas_ok = [norm(next(p['w'] for p in c1['palavras'] if abs(p['t0'] - l['t']) < 1e-6)) for l in EV['lojas']] == ['padaria', 'mercadim', 'lanchonete']
ok(lojas_ok, 'as lojinhas brotam uma por palavra: padaria, mercadim, lanchonete')

# ---------------------------------------------------------------- legenda
report += ['', 'LEGENDA GRAVADA']
EST = LEG['estilo']
FONTE = ImageFont.truetype(os.path.join(REPO, 'public', 'fonts', 'poppins-latin-800-normal.woff2'), EST['size'])
B = LEG['blocos']
curtos = [b for b in B if b['t1'] - b['t0'] < 1.5 - 1e-6]
ok(not curtos, f'{len(B)} blocos, o mais curto fica {min(b["t1"] - b["t0"] for b in B):.2f} s (mínimo 1,5 s)')
ok(all(len(b['linhas']) <= 2 for b in B), 'no máximo 2 linhas por bloco')
leg_txt = norm(' '.join(w['w'] for b in B for l in b['linhas'] for w in l))
ok(leg_txt == norm(' '.join(ROTEIRO)), 'o texto da legenda é o texto da tela, palavra por palavra (nunca a grafia de pronúncia)')
sem = [p['w'] for c in LN['capitulos'] for p in c['palavras']
       if not any(b['t0'] <= p['t0'] + 0.01 and p['t0'] < b['t1'] and any(w['t0'] == p['t0'] for l in b['linhas'] for w in l) for b in B)]
ok(not sem, 'cada palavra falada está na tela enquanto é dita' + (f': faltam {sem}' if sem else ''))
ok(all(b2['t0'] >= b1['t1'] - 1e-6 for b1, b2 in zip(B, B[1:])), 'nunca dois blocos ao mesmo tempo')
ok(B[-1]['t1'] <= DUR - 3.0, f'a legenda sai em {B[-1]["t1"]:.2f} s, antes dos 3 últimos segundos (a logo sozinha com o chip)')
SEG = LAY['seguro']
# a pílula de cada bloco, medida com a mesma fonte (Poppins 800) e o mesmo estilo da composição
pilulas = []
for b in B:
    larg = max(FONTE.getlength(' '.join(w['w'] for w in l)) for l in b['linhas'])
    wp, hp = larg + 2 * EST['padX'], len(b['linhas']) * EST['lh'] + 2 * EST['padY']
    pilulas.append((b, [EST['cx'] - wp / 2, EST['base'] - hp, EST['cx'] + wp / 2, EST['base']]))
fora = [p for b, p in pilulas if not dentro(SEG, p)]
ok(not fora, f'todas as pílulas dentro da zona segura x {SEG[0]}–{SEG[2]}, y {SEG[1]}–{SEG[3]} '
   f'(a maior: x {min(p[0] for _, p in pilulas):.0f}–{max(p[2] for _, p in pilulas):.0f}, y {min(p[1] for _, p in pilulas):.0f}–{EST["base"]})')


# as caixas dos elementos em repouso (as mesmas contas da composição)
def caixa_pertim(k, escala=1.0):
    """o desenho VISÍVEL do Pertim (do capacete à sola / às rodas), pelas frações medidas no SVG (layout.json → visivel)"""
    p = LAY['pertim'][k]
    v = LAY['visivel'][p['pose']]
    h = p['altura'] * escala
    top = p['base'] - h
    return [p['cx'] + v['x'][0] * h, top + v['y'][0] * h, p['cx'] + v['x'][1] * h, top + v['y'][1] * h]


ELEM = {f'Pertim ({k})': caixa_pertim(k, 1.07 if k == 'sacola' else 1.0) for k in LAY['pertim']}
for k in LAY['pertim']:
    cx = caixa_pertim(k)
    info(f'Pertim ({k}): {cx[2] - cx[0]:.0f} px de largura ({(cx[2] - cx[0]) / 1080 * 100:.0f}% da tela) e {cx[3] - cx[1]:.0f} px do capacete à sola')
ok(all(abs(caixa_pertim(k)[3] - LAY['chao']) <= 6 for k in LAY['pertim']), f'o Pertim pisa no chão (y {LAY["chao"]}) em todas as cenas')
Lj = LAY['lojinhas']
alt_loja = caixa_pertim('lojinhas')[3] - caixa_pertim('lojinhas')[1]
for i, l in enumerate(EV['lojas']):
    w = Lj['largura'][i]
    ELEM[f'lojinha {l["tipo"]}'] = [Lj['cx'][i] - w / 2, Lj['base'][i] - w * 1.28, Lj['cx'][i] + w / 2, Lj['base'][i]]
    info(f'lojinha {l["tipo"]}: {w * 1.28:.0f} px de altura ({w * 1.28 / alt_loja * 100:.0f}% da altura do Pertim na cena), no chão em y {Lj["base"][i]}')
ok(all(LAY['chao'] - 60 <= b <= LAY['chao'] for b in Lj['base']), 'as lojinhas brotam no chão (no máximo 60 px atrás da linha do Pertim, em leve profundidade)')
lg = LAY['logo']
ELEM['logo oficial'] = [lg['cx'] - lg['d'] / 2, lg['cy'] - lg['d'] / 2, lg['cx'] + lg['d'] / 2, lg['cy'] + lg['d'] / 2]
chw = FONTE.font_variant(size=LAY['chip']['size']).getlength('Segue @uaipertim') + 14 + 34 + 72
ch = LAY['chip']
CHIP = [ch['cx'] - chw / 2, ch['cy'] - ch['h'] / 2, ch['cx'] + chw / 2, ch['cy'] + ch['h'] / 2 + 7]
for nome, cx in list(ELEM.items()) + [('chip "Segue @uaipertim"', CHIP)]:
    ok(dentro(SEG, cx), f'{nome}: x {cx[0]:.0f}–{cx[2]:.0f}, y {cx[1]:.0f}–{cx[3]:.0f}, dentro da zona segura')
cob = [(n, round(b['t0'], 2)) for b, p in pilulas for n, cx in ELEM.items() if cruza(p, cx)]
ok(not cob, 'a legenda (abaixo do chão) não cobre o personagem, as lojinhas nem a logo' + (f': {cob}' if cob else ''))
ok(EV['chip'] >= B[-1]['t1'] and not cruza(CHIP, ELEM['Pertim (fecho)']), f'o chip entra na faixa da legenda em {EV["chip"]:.2f} s, depois que a legenda sai (nunca os dois juntos), sem cobrir o Pertim')

# ---------------------------------------------------------------- boca e piscadas
report += ['', 'BOCA (sincronia pela voz) E PISCADAS']
bocas = VIS['bocas']
corridas, q = [], 0
while q < len(bocas):
    j = q
    while j < len(bocas) and bocas[j] == bocas[q]:
        j += 1
    corridas.append((bocas[q], q, j - q)); q = j
curta = [c for c in corridas if c[2] < 2]
ok(len(bocas) == CENA['quadros'] and not curta, f'{len(bocas)} quadros, {len(corridas) - 1} trocas de boca; a mais curta fica {min(c[2] for c in corridas)} quadros (mínimo 2)')
falando = np.zeros(len(bocas), bool)
for c in CENA['cenas']:
    falando[int(round((c['voz_t0'] - 0.02) * FPS)):int(round((c['voz_t1'] + 0.04) * FPS)) + 1] = True
fora_fala = [i for i, x in enumerate(bocas) if x != 'R' and not falando[i]]
ok(not fora_fala, 'fora da fala, a boca é repouso / a da expressão da cena')
usadas = {x: bocas.count(x) for x in 'RAEOM'}
ok(all(usadas.values()), 'as 5 bocas usadas: ' + ' · '.join(f'{VIS["codigos"][k]} {v} q' for k, v in usadas.items()))
info('na fala, as pausas entre palavras (R) usam o sorriso da expressão "sorrindo", não a linha reta')
# M/B/P só nos quadros de m/b/p (os caracteres que a voz recebeu) e fechando cada "Pertim"
mbp = np.zeros(len(bocas), bool)
for c in LN['capitulos']:
    F = FALAS['capitulos'][f'{c["n"]:02d}']
    al = F['alinhamento']
    desl = c['voz_t0'] - F['inicio_da_fala']
    for ch_, a0, a1 in zip(al['characters'], al['character_start_times_seconds'], al['character_end_times_seconds']):
        if ch_.lower() in 'mbp':
            mbp[max(0, int(round((a0 + desl) * FPS)) - 2):int(round((a1 + desl) * FPS)) + 2] = True
pertins = [w for c in LN['capitulos'] for w in c['palavras'] if norm(w['w']).endswith('pertim')]
for w in pertins:
    mbp[max(0, int(round((w['t1'] - 0.07) * FPS)) - 2):int(round(w['t1'] * FPS)) + 2] = True
m_fora = [i for i, x in enumerate(bocas) if x == 'M' and not mbp[i]]
ok(not m_fora, f'a boca M/B/P só nos quadros de m/b/p ({bocas.count("M")} quadros)' + (f': {len(m_fora)} quadros fora' if m_fora else ''))
fecha = [w['w'] for w in pertins if 'M' in bocas[max(0, int(round(w['t1'] * FPS)) - 5):int(round(w['t1'] * FPS)) + 1]]
ok(len(fecha) == len(pertins), f'a boca fecha em M no fim de cada "Pertim" ({len(fecha)} de {len(pertins)}: {", ".join(w["w"] for w in pertins)})')
P = CENA['piscadas']
gaps = [b - a for a, b in zip([0.0] + P, P)]
info('piscadas em ' + ', '.join(f'{p:.2f}' for p in P) + ' s')
ok(all(1.9 <= g <= 4.6 for g in gaps[1:]), f'intervalos entre piscadas de {min(gaps[1:]):.2f} a {max(gaps[1:]):.2f} s (2–4 s, aleatório; empurrado quando a boca está aberta)')
abertas = [p for p in P if any(bocas[q] in 'AO' for q in range(int(p * FPS), min(len(bocas), int((p + CENA['piscada_dur']) * FPS) + 1)))]
ok(not abertas, 'nenhuma piscada com a boca aberta (A/O)')

# o olhar: na câmera (pupilas centradas) durante a fala, menos nos olhares curtos para as lojinhas
report += ['', 'OLHAR NA CÂMERA']
OL = CENA['olhares']
desvio = np.zeros(len(bocas), bool)
for o in OL:
    desvio[int(round(o['t0'] * FPS)):int(round(o['t1'] * FPS)) + 1] = True
pct = 100 * float((falando & ~desvio).sum()) / float(falando.sum())
info('desvios: ' + ', '.join(f'{o["tipo"]} {o["t0"]:.2f}–{o["t1"]:.2f} s' for o in OL))
ok(all(o['t1'] - o['t0'] <= 0.6 + 1e-6 for o in OL), f'cada desvio dura no máximo 0,6 s (o mais longo: {max(o["t1"] - o["t0"] for o in OL):.2f} s) e volta para a câmera')
ok(pct >= 85.0, f'olhar na câmera em {pct:.1f}% do tempo de fala (meta ≥ 85%)')


# ---------------------------------------------------------------- pixels do vídeo: gancho e logo parada
def quadro(t):
    with tempfile.TemporaryDirectory() as tmp:
        pth = os.path.join(tmp, 'f.png')
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', f'{t:.3f}', '-i', VIDEO, '-frames:v', '1', pth], check=True)
        return np.asarray(Image.open(pth).convert('RGB')).astype(float)


report += ['', 'GANCHO E FECHO (pelos pixels do vídeo)']
qs = [quadro(x) for x in (0.0, 0.1, 0.2, 0.3, 0.4, 0.5)]
mud = [float(np.abs(a_ - b_).mean()) for a_, b_ in zip(qs, qs[1:])]
ok(min(mud) > 0.3, f'gancho: o Pertim já chega de motinha desde o quadro 0 (mudança média entre quadros a cada 0,1 s: {min(mud):.2f}–{max(mud):.2f})')
r = int(lg['d'] * 0.36)
logo = [quadro(t)[lg['cy'] - r:lg['cy'] + r, lg['cx'] - r:lg['cx'] + r] for t in np.linspace(DUR - 3.0, DUR - 0.05, 6)]
# parada = o miolo igual de quadro a quadro (média e percentil 99,9; o máximo isolado é só o ruído do codec)
dm = max(float(np.abs(x - logo[0]).mean()) for x in logo[1:])
dp = max(float(np.percentile(np.abs(x - logo[0]), 99.9)) for x in logo[1:])
ok(dm < 0.5 and dp < 8, f'a logo oficial PARADA nos 3 últimos segundos (miolo da logo entre 6 quadros: diferença média {dm:.2f}/255, p99,9 {dp:.0f}/255)')
fim = quadro(DUR - 0.05)
chip_px = fim[ch['cy'] - 20:ch['cy'] + 20, ch['cx'] - 200:ch['cx'] + 200]
coral = float(((np.abs(chip_px - np.array([242, 80, 43])).sum(axis=2)) < 60).mean())
ok(coral > 0.4, f'o chip coral "Segue @uaipertim" na tela no último quadro ({coral * 100:.0f}% do miolo coral)')

# ---------------------------------------------------------------- capa
report += ['', 'CAPA (Pertim acenando; recorte 3:4)']
subprocess.run(['python3', os.path.join(REPO, 'reels', 'explica-so', 'scripts', 'revisao_capa.py'), REEL], capture_output=True)
capa = open(os.path.join(REV, 'capa.txt')).read().strip().splitlines()
for l in capa:
    if l.startswith(('OK', 'FALHA')):
        report.append(l)
ok(capa[-1].strip() == 'RESULTADO: dentro da regra das capas', 'capa aprovada na revisão do recorte 3:4 (output/revisao/capa-no-feed.jpg)')

report += ['', f'RESULTADO: {"aprovado" if not fails else "ajustar"}']
txt = '\n'.join(['REVISÃO TÉCNICA — Reel de teste "Prazer, Pertim" (uaipertim-prazer-pertim.mp4)', ''] + report) + '\n'
open(os.path.join(REV, 'relatorio-tecnico.txt'), 'w').write(txt)
print(txt)
