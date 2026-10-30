#!/usr/bin/env python3
"""
Revisão técnica do Reel "Pedir no UaiPertim é assim".

    python3 reels/pedir-no-uaipertim/scripts/qa.py

Confere o MP4 final (output/uaipertim-pedir-no-uaipertim.mp4) contra os mesmos dados que a composição usa (layout.json,
dados/{cena,visemas,legenda}.json, fonte/pontos.json) e escreve output/revisao/relatorio-tecnico.txt:
  • formato: h264 yuv420p 1080×1920 a 60 fps, 35–40 s, AAC 48 kHz estéreo, vídeo e áudio com a mesma duração;
  • som: −14 LUFS integrados (±0,5), pico real ≤ −1 dBTP, a voz na frente da trilha animada;
  • voz: o roteiro exato, perfil "narracao" (eleven_v4), "UaiPertim" enviado como "UaiPértim" (a grafia aprovada no teste
    A/B), cada cena UMA geração inteira colocada sem cortes, "no Glória"; a fala 1 e a fala 7 são EXATAMENTE os takes
    aprovados de ouvido (hash do MP3, o WAV igual ao MP3 decodificado e o envelope no MP4 final);
  • pagamento híbrido: as três opções (Pix, cartão, na entrega) saltam do Checkout-pix cada uma na sua palavra, e nunca há
    duas opções marcadas ao mesmo tempo (pelos pixels do vídeo: o rádio de cada recorte, a cada amostra);
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
    'Paga pelo app, no Pix ou no cartão, ou na entrega, do jeito que preferir.',
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
# os takes APROVADOS de ouvido (teste A/B): a fala 1 e a fala 7 do vídeo são exatamente esses arquivos
TESTE = os.path.join(REEL, 'teste-pronuncia')
AMOS = {a_['arquivo']: a_ for a_ in json.load(open(os.path.join(TESTE, 'amostras.json')))['amostras']}
mix = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', VIDEO, '-f', 's16le', '-ac', '1', '-ar', '44100', '-'], capture_output=True).stdout,
                    np.int16).astype(np.float64) / 32768


def envelope(x, sr=44100):
    from scipy.signal import butter, sosfilt
    x = sosfilt(butter(4, [300, 3400], 'band', fs=sr, output='sos'), x)
    h = int(0.02 * sr)
    return np.array([np.sqrt(np.mean(x[i:i + h] ** 2)) for i in range(0, len(x) - h, h)])


for key, arq in (('00', 'f1-E-uaipertim-acento-no-e-junto.mp3'), ('06', 'f7-E-uaipertim-acento-no-e-junto.mp3')):
    F = FALAS['capitulos'][key]
    mp3 = open(os.path.join(TESTE, arq), 'rb').read()
    hash_ok = hashlib.sha1(mp3).hexdigest() == AMOS[arq]['sha1_mp3'] == F.get('origem', {}).get('sha1_mp3')
    dec = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(TESTE, arq), '-f', 's16le', '-ac', '1', '-ar', '44100', '-'], capture_output=True).stdout, np.int16)
    _, cap = wavfile.read(os.path.join(AUD, 'voz', f'cap-{key}.wav'))
    igual = len(dec) == len(cap) and int(np.abs(dec.astype(int) - cap.astype(int)).max()) == 0
    c = next(x for x in LN['colocacao'] if x['cap'] == int(key))
    i0 = int(round(c['no_video_s'] * 44100))
    take = dec[int(round(c['de_s'] * 44100)):int(round(c['ate_s'] * 44100))].astype(np.float64) / 32768
    no_video = mix[i0:i0 + len(take)]
    ea, eb = envelope(take), envelope(no_video)
    n_ = min(len(ea), len(eb))
    r_ap = float(np.corrcoef(ea[:n_], eb[:n_])[0, 1])
    _, ref = wavfile.read(os.path.join(AUD, 'voz', f'ref-alinhamento-cap-{key}.wav'))
    er = envelope(ref.astype(np.float64)[int(round(c['de_s'] * 44100)):int(round(c['ate_s'] * 44100))] / 32768)
    n2 = min(len(er), len(eb))
    r_ref = float(np.corrcoef(er[:n2], eb[:n2])[0, 1])
    ok(F.get('aprovado') and hash_ok and igual and r_ap >= 0.85 and r_ap > r_ref + 0.1,
       f'fala {int(key) + 1}: é o take aprovado {arq} (hash do MP3 {"confere" if hash_ok else "NÃO confere"}; cap-{key}.wav igual ao MP3 decodificado: '
       f'{"sim" if igual else "NÃO"}; envelope no MP4 final: {r_ap * 100:.0f}% com o take aprovado × {r_ref * 100:.0f}% com a geração anterior)')
todos = ' '.join(ROTEIRO)
api = ' '.join(FALAS['capitulos'][f'{n:02d}']['texto_api'] for n in range(len(ROTEIRO)))
ok(api.count('UaiPértim') == 2 and 'UaiPertim' not in api and all('UaiPertim' in ROTEIRO[n] for n in (0, 6)),
   '"UaiPertim" (na tela e na legenda) enviado à voz como "UaiPértim" nas falas 1 e 7 (a grafia E, aprovada no teste A/B)')
ok(not re.search(r'\bde\s+Glória\b', todos, re.I) and re.search(r'\b(no|do)\s+Glória\b', todos), '"no Glória" (nunca "de Glória")')

# ---------------------------------------------------------------- pagamento híbrido (pelo app ou na entrega)
report += ['', 'PAGAMENTO HÍBRIDO (Pix, cartão, na entrega)']
CK = EV['checkout']
PALAVRA = {p_['n']: p_['t0'] for p_ in LN['capitulos'][3]['palavras']}
for chave, palavra, rec in (('pix', 'pix', 'opcao-pix'), ('cartao', 'cartao', 'opcao-cartao'), ('entrega', 'entrega', 'opcao-pagar-na-entrega')):
    ok(abs(CK[chave] - PALAVRA[palavra]) < 0.02 and f'nome: "{rec}"' in TSX,
       f'"{rec}" salta do Checkout-pix em {CK[chave]:.2f} s, na palavra "{palavra}" ({PALAVRA[palavra]:.2f} s)')
ok(CK['pix'] < CK['cartao'] < CK['entrega'] < CK['marca_pix'] < CK['toque_pedido'], 'a ordem: Pix → cartão → na entrega → o Pix marcado → "Fazer pedido"')
ok(CK['entrega'] < CK['dinheiro'] < CK['maquininha'] < CK['entrega'] + 1.0, f'a nota e a maquininha entram em "na entrega" ({CK["dinheiro"]:.2f} e {CK["maquininha"]:.2f} s)')
PASSOS = CENA['celular']
ck = [p_ for p_ in PASSOS if p_['tela'] == 'Checkout-pix']
CEL = LAY['celular']
BZ = CEL['w'] * 0.042
K = (CEL['w'] - 2 * BZ) / CEL['telaCss']
VIEW = (CEL['h'] - 2 * BZ) / K
ok(len(ck) == 1 and ck[0]['rola'][0][1] <= 366 and ck[0]['rola'][0][1] + VIEW >= 678, f'o celular mostra o Checkout-pix com as três opções na tela (rolagem {ck[0]["rola"][0][1]} px de CSS: y 366–678 visível)')
# nunca duas marcadas: o rádio de cada recorte (marcado = o miolo coral), quadro a quadro nas amostras em que eles estão fora
PG = LAY['pagamento']
ROT = {'pix': -2, 'cartao': 1.5, 'entrega': -1}
RADIO = {'pix': (968, 114, 426), 'cartao': (971.5, 113.5, 225), 'entrega': (971, 114, 228)}


def radio_marcado(img, k):
    b = PG[k]; rx, ry, hh = RADIO[k]
    w_, h_ = b['w'], b['w'] * hh / 1050
    cx, cy = b['x'] + w_ / 2, b['y'] + h_ / 2
    dx, dy = (rx - 525) * w_ / 1050, (ry - hh / 2) * w_ / 1050
    a_ = np.radians(ROT[k])
    x_, y_ = cx + dx * np.cos(a_) - dy * np.sin(a_), cy + dx * np.sin(a_) + dy * np.cos(a_)
    jan = img[int(y_) - 5:int(y_) + 6, int(x_) - 5:int(x_) + 6]
    return float((np.abs(jan - np.array([196, 69, 44])).sum(axis=2) < 90).mean()) > 0.5


amostras = [(CK['cartao'] + 0.5, ('pix', 'cartao')), (CK['entrega'] + 0.5, ('pix', 'cartao', 'entrega')), (CK['maquininha'] + 0.5, ('pix', 'cartao', 'entrega')),
            (CK['marca_pix'] - 0.05, ('pix', 'cartao', 'entrega')), (CK['marca_pix'] + 0.5, ('pix',)), (CK['toque_pedido'] + 0.2, ('pix',))]
duas, fim_pix = [], []
for t_, quais in amostras:
    img = quadro(t_)
    marc = [k for k in quais if radio_marcado(img, k)]
    info(f'{t_:5.2f} s: na tela {", ".join(quais)} · marcada(s): {", ".join(marc) or "nenhuma"}')
    if len(marc) > 1 or any(k != 'pix' for k in marc):
        duas.append(t_)
    if t_ > CK['marca_pix']:
        fim_pix.append('pix' in marc)
ok(not duas, f'nunca duas opções marcadas: nas {len(amostras)} amostras, só o Pix aparece marcado (o "Pagar na entrega" do pacote anterior vem marcado e aparece desmarcado, como no Checkout-pix; em {CK["marca_pix"] - 0.05:.2f} s a luva do toque cobre o rádio do Pix)' + (f': falha em {duas}' if duas else ''))
ok(fim_pix and all(fim_pix), 'o Pix termina marcado (depois do toque em "preferir", até o "Fazer pedido")')
ok('opcao-pagar-na-entrega" && (' in TSX and 'stroke="#7B7B7B"' in TSX, 'a camada que desmarca o "Pagar na entrega" está na composição')

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
# M/B/P só nos quadros de m/b/p (os caracteres que a voz recebeu) e no fim de cada "UaiPertim"
mbp = np.zeros(len(bocas), bool)
for c in LN['capitulos']:
    F = FALAS['capitulos'][f'{c["n"]:02d}']
    al = F['alinhamento']
    desl = c['voz_t0'] - F['inicio_da_fala']
    for ch_, a0, a1 in zip(al['characters'], al['character_start_times_seconds'], al['character_end_times_seconds']):
        if ch_.lower() in 'mbp':
            mbp[max(0, int(round((a0 + desl) * FPS)) - 2):int(round((a1 + desl) * FPS)) + 2] = True
pertins = [w for c in LN['capitulos'] for w in c['palavras'] if fala.norm(w['w']).endswith('pertim')]
for w in pertins:
    mbp[max(0, int(round((w['t1'] - fala.FINAL_M) * FPS)) - 2):int(round(w['t1'] * FPS)) + 2] = True
# os lábios ficam fechados numa pausa curta (< 0,12 s) entre dois m/b/p seguidos ("Com bacon": do m ao b)
q = 0
while q < len(mbp):
    if not mbp[q] and q > 0 and mbp[q - 1]:
        j = q
        while j < len(mbp) and not mbp[j]:
            j += 1
        if j < len(mbp) and (j - q) / FPS < 0.12:
            mbp[q:j] = True
        q = j
    else:
        q += 1
m_fora = [i for i, x in enumerate(bocas) if x == 'M' and not mbp[i]]
ok(not m_fora, f'a boca M/B/P só nos quadros de m/b/p ({bocas.count("M")} quadros; entre dois m/b/p seguidos, numa pausa curta, os lábios seguem fechados)' + (f': {len(m_fora)} quadros fora' if m_fora else ''))
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
# a logo do fecho sem fundo: no anel logo em volta do círculo (de +4 a +24 px do raio), nenhum pixel branco/claro que não
# seja o fundo creme com raios (o quadrado branco da logo antiga apareceria aqui como pixels quase brancos)
LG_ = LAY['fecho']['logo']
fr = quadro(DUR - 1.0)
yy, xx = np.mgrid[0:1920, 0:1080]
rr = np.hypot(xx - LG_['cx'], yy - LG_['cy'])
R_ = LG_['d'] / 2 * 235.25 / 237.0
anel = (rr > R_ + 4) & (rr < R_ + 24)
px = fr[anel]
brancos = int(((px.min(axis=1) > 240)).sum())
cantos = fr[int(LG_['cy'] - LG_['d'] / 2) + 2:int(LG_['cy'] - LG_['d'] / 2) + 14, int(LG_['cx'] - LG_['d'] / 2) + 2:int(LG_['cx'] - LG_['d'] / 2) + 14]
ok(brancos == 0 and cantos.min(axis=2).max() <= 240, f'a logo do fecho sem fundo branco: 0 pixels brancos (> 240) no anel em volta do círculo ({brancos} de {len(px)}); o canto da caixa da logo mostra o fundo creme (máx. {cantos.min(axis=2).max():.0f})')
ok('logo-selo-transparente.png' in TSX and 'logo-selo.png"' not in TSX, 'a composição usa só a logo transparente (logo-selo-transparente.png)')
mp = LN.get('mapa', {})
ok(mp.get('ok', False), 'mapa de tempos de linha.py (35–40 s, fecho 4–6 s, logo nos 3 últimos s)')

report += ['', f'RESULTADO: {"aprovado" if not fails else "ajustar"}']
txt = '\n'.join(['REVISÃO TÉCNICA — Reel "Pedir no UaiPertim é assim" (uaipertim-pedir-no-uaipertim.mp4)', ''] + report) + '\n'
open(os.path.join(REV, 'relatorio-tecnico.txt'), 'w').write(txt)
print(txt)
