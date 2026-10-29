#!/usr/bin/env python3
"""
Reel "Prazer, Pertim": os dados da composição a partir da voz (sem API).

    python3 reels/prazer-pertim/scripts/preparar.py

Lê reels/explica-so/audio/prazer-pertim/linha.json (as cenas, as palavras da TELA no tempo do vídeo) e voz/falas.json
(o alinhamento por caractere de cada geração inteira) e escreve em reels/prazer-pertim/dados/:
  • cena.json     — a duração, as cenas e os eventos (a chegada da moto, as lojinhas na palavra, a sacola, o aceno,
                    o chip em "Segue", a logo) e as piscadas;
  • visemas.json  — a boca quadro a quadro (60 fps), tirada dos caracteres que a voz recebeu: vogal aberta → A,
                    "e/i" → E, "o/u" → O, "m/b/p" → M/B/P, pausa → repouso; as outras consoantes pegam a forma da vogal
                    seguinte (coarticulação). Nenhuma boca fica menos de 2 quadros (as trocas mais curtas são absorvidas);
  • legenda.json  — os blocos da legenda (texto da tela, nunca a grafia de pronúncia): até ~8 palavras e 2 linhas,
                    quebrando nas pausas; cada bloco fica ≥ 1,5 s; no fecho, saem antes dos 3 últimos segundos;
e reels/explica-so/audio/prazer-pertim/cues.json (os efeitos sonoros para scripts/audio.py).
"""
import json
import os
import random
import re
import unicodedata
from PIL import ImageFont

AQUI = os.path.dirname(os.path.abspath(__file__))
REEL = os.path.dirname(AQUI)
REPO = os.path.dirname(os.path.dirname(REEL))
AUD = os.path.join(REPO, 'reels', 'explica-so', 'audio', 'prazer-pertim')
LN = json.load(open(os.path.join(AUD, 'linha.json')))
FALAS = json.load(open(os.path.join(AUD, 'voz', 'falas.json')))['capitulos']
LAY = json.load(open(os.path.join(REEL, 'layout.json')))
FPS = LAY['fps']
DUR = LN['duracao']
NQ = int(round(DUR * FPS))
CAPS = LN['capitulos']
SAIDA = os.path.join(REEL, 'dados')
os.makedirs(SAIDA, exist_ok=True)


def norm(s):
    s = unicodedata.normalize('NFD', s.lower())
    return re.sub(r'[^a-z0-9]', '', ''.join(c for c in s if unicodedata.category(c) != 'Mn'))


def palavra(cap, alvo, k=1):
    n = 0
    for w in cap['palavras']:
        if norm(w['w']) == norm(alvo):
            n += 1
            if n == k:
                return w
    raise SystemExit(f'cena {cap["n"]}: a palavra "{alvo}" não está na fala')


# ---------------------------------------------------------------- visemas (a boca quadro a quadro)
VOG = {**{c: 'A' for c in 'aáàâã'}, **{c: 'E' for c in 'eéêiíy'}, **{c: 'O' for c in 'oóôõuú'}}
LAB = set('mbp')
COD = {'repouso': 'R', 'A': 'A', 'E': 'E', 'O': 'O', 'MBP': 'M'}
bocas = ['R'] * NQ
for c in CAPS:
    F = FALAS[f'{c["n"]:02d}']
    al = F['alinhamento']
    desl = c['voz_t0'] - F['inicio_da_fala']
    ch = al['characters']; st = al['character_start_times_seconds']; en = al['character_end_times_seconds']
    # a classe de cada letra (consoantes sem forma própria: a vogal seguinte da mesma palavra, senão a anterior)
    cls = []
    for i, x in enumerate(ch):
        xl = x.lower()
        cls.append(VOG.get(xl) or ('MBP' if xl in LAB else ('?' if xl.isalpha() else None)))
    for i, k in enumerate(cls):
        if k == '?':
            j = i + 1
            while j < len(cls) and cls[j] == '?':
                j += 1
            nxt = cls[j] if j < len(cls) and cls[j] not in (None, 'MBP') else None
            prv = next((cls[q] for q in range(i - 1, -1, -1) if cls[q] not in ('?', None, 'MBP')), None)
            cls[i] = nxt or prv or 'E'
    for i, k in enumerate(cls):
        if not k:
            continue
        a, b = st[i] + desl, en[i] + desl
        for q in range(max(0, int(round(a * FPS))), min(NQ, int(round(b * FPS)))):
            bocas[q] = COD[k]
# pausas curtas entre letras (< 0,12 s) não abrem o sorriso: a forma anterior continua (menos o M/B/P, que fica só
# nos quadros de m/b/p: depois dele, a pausa curta já pega a forma seguinte)
q = 0
while q < NQ:
    if bocas[q] == 'R':
        j = q
        while j < NQ and bocas[j] == 'R':
            j += 1
        if 0 < q and j < NQ and (j - q) / FPS < 0.12:
            for k in range(q, j):
                bocas[k] = bocas[q - 1] if bocas[q - 1] != 'M' else bocas[j]
        q = j
    else:
        q += 1
# a boca fecha em M no fim de cada "Pertim" (o "m" final, que a voz às vezes deixa em "n")
FINAL_M = 0.07
for c in CAPS:
    for w in c['palavras']:
        if norm(w['w']).endswith('pertim'):
            for k in range(max(0, int(round((w['t1'] - FINAL_M) * FPS))), min(NQ, int(round(w['t1'] * FPS)))):
                bocas[k] = 'M'
# nenhuma boca com menos de 2 quadros: um M curto ganha o quadro seguinte; outra troca curta é absorvida pela boca de
# antes (ou pela de depois, se a de antes for M)
for _ in range(6):
    q, mudou = 0, False
    while q < NQ:
        j = q
        while j < NQ and bocas[j] == bocas[q]:
            j += 1
        if j - q < 2:
            if bocas[q] == 'M' and j < NQ:
                bocas[j] = 'M'
            elif q > 0 and bocas[q - 1] != 'M':
                for k in range(q, j):
                    bocas[k] = bocas[q - 1]
            elif j < NQ:
                for k in range(q, j):
                    bocas[k] = bocas[j]
            mudou = True
        q = j
    if not mudou:
        break
json.dump({'fps': FPS, 'codigos': {'R': 'repouso', 'A': 'A', 'E': 'E', 'O': 'O', 'M': 'MBP'}, 'bocas': ''.join(bocas)},
          open(os.path.join(SAIDA, 'visemas.json'), 'w'))

# ---------------------------------------------------------------- cena: os eventos
c0, c1, c2, c3 = CAPS
ev = {
    'chegada': {'t0': 0.0, 'freia': 0.85, 'para': 1.15},
    'lojas': [{'tipo': l['tipo'], 't': palavra(c1, l['em'])['t0']} for l in c1['diagrama']['lojas']],
    'aponta': c1['t0'] - 0.45,
    'sacola': c2['t0'] - 0.45,
    'pertim': palavra(c2, 'pertim')['t0'],
    'aceno': c3['t0'] - 0.45,
    'chip': None,   # o chip entra no lugar da legenda, quando ela sai (abaixo)
    'logo': {'entra': c3['t0'] + 0.4, 'parada': c3['t0'] + 0.4 + 0.9},
}
# as piscadas: a cada 2–4 s (aleatório, fixo pela semente), nunca com a boca aberta (A ou O) nem colada nela
rnd = random.Random(42)
piscadas, t = [], 1.6
aberta = lambda a, b: any(bocas[q] in 'AO' for q in range(max(0, int(a * FPS)), min(NQ, int(b * FPS) + 1)))
while t < DUR - 0.5:
    tt = t
    while tt < DUR - 0.5 and aberta(tt - 0.08, tt + 0.24):
        tt += 1 / FPS
    if tt < DUR - 0.5:
        piscadas.append(round(tt, 3))
    t = tt + rnd.uniform(2.0, 4.0)
# o olhar: sempre na câmera; só desvia para cada lojinha quando ela brota (no máximo ~0,6 s, ida e volta)
OLHAR_DUR = 0.55
PJ = LAY['pertim']['lojinhas']
olhares = [{'t0': round(l['t'], 3), 't1': round(l['t'] + OLHAR_DUR, 3), 'tipo': l['tipo'],
            'alvo': [round(max(-1.5, min(1.5, (LAY['lojinhas']['cx'][i] - PJ['cx']) / 200)), 2), 0.6]}
           for i, l in enumerate(ev['lojas'])]
cena = {'duracao': DUR, 'fps': FPS, 'quadros': NQ,
        'cenas': [{'n': c['n'], 'tipo': c['diagrama']['tipo'], 't0': c['t0'], 't1': c['t1'], 'voz_t0': c['voz_t0'], 'voz_t1': c['voz_t1']} for c in CAPS],
        'eventos': ev, 'piscadas': piscadas, 'piscada_dur': 0.16, 'olhares': olhares}

# ---------------------------------------------------------------- legenda
LG = LAY['legenda']
FONTE = ImageFont.truetype(os.path.join(REPO, 'public', 'fonts', 'poppins-latin-800-normal.woff2'), LG['size'])
larg = lambda ws: FONTE.getlength(' '.join(w['w'] for w in ws))
LIGA = {'o', 'a', 'os', 'as', 'do', 'da', 'no', 'na', 'de', 'em', 'e', 'que', 'pra', 'um', 'uma', 'por', 'com', 'mais', 'eu', 'me', 'vou', 'isso'}
blocos_out = []
for ci, c in enumerate(CAPS):
    ws = c['palavras']
    blocos, cur = [], []
    for i, w in enumerate(ws):
        cur.append(w)
        nx = ws[i + 1] if i + 1 < len(ws) else None
        pausa = bool(re.search(r'[.?!…:;,]["”’)]*$', w['w'])) or (nx and nx['t0'] - w['t1'] > 0.3)
        if not nx or (pausa and len(cur) >= 2) or (len(cur) >= LG['maxPal'] and norm(w['w']) not in LIGA):
            blocos.append(cur); cur = []
    if cur:
        blocos.append(cur)
    fim = DUR - 3.05 if ci == len(CAPS) - 1 else c['t1'] - 0.05
    B = [{'palavras': p, 't0': max(c['t0'], p[0]['t0'] - 0.05)} for p in blocos]
    for i, b in enumerate(B):
        b['t1'] = min(fim, B[i + 1]['t0'] if i + 1 < len(B) else b['palavras'][-1]['t1'] + 0.9)
    # todo bloco ≥ 1,5 s: junta com o vizinho (desde que caiba em 2 linhas)
    for _ in range(40):
        i = next((k for k, b in enumerate(B) if b['t1'] - b['t0'] < LG['minDur']), None)
        if i is None or len(B) < 2:
            break
        j = i if i + 1 < len(B) else i - 1
        B[j:j + 2] = [{'palavras': B[j]['palavras'] + B[j + 1]['palavras'], 't0': B[j]['t0'], 't1': B[j + 1]['t1']}]
    for b in B:
        p = b['palavras']
        if larg(p) <= LG['maxW']:
            linhas = [p]
        else:
            best = min(((max(larg(p[:k]), larg(p[k:])) - (60 if re.search(r'[,;:]$', p[k - 1]['w']) else 0), k) for k in range(1, len(p))))
            linhas = [p[:best[1]], p[best[1]:]]
        blocos_out.append({'cena': ci, 't0': round(b['t0'], 4), 't1': round(b['t1'], 4),
                           'linhas': [[{'w': w['w'], 't0': w['t0'], 't1': w['t1']} for w in l] for l in linhas]})
json.dump({'estilo': LG, 'blocos': blocos_out}, open(os.path.join(SAIDA, 'legenda.json'), 'w'), ensure_ascii=False, indent=1)
# o chip "Segue @uaipertim" entra na faixa da legenda quando a última legenda sai (e fica até o fim, com a logo)
ev['chip'] = round(blocos_out[-1]['t1'] + 0.05, 3)
json.dump(cena, open(os.path.join(SAIDA, 'cena.json'), 'w'), ensure_ascii=False, indent=1)

# ---------------------------------------------------------------- os efeitos sonoros (scripts/audio.py do Explica, Sô!)
cues = [{'t': 0.0, 'type': 'moto', 'd': 1.0}, {'t': ev['chegada']['freia'], 'type': 'skid'}, {'t': ev['chegada']['para'] + 0.05, 'type': 'horn'},
        {'t': 0.0, 'type': 'pop', 'f': 520}]
cues += [{'t': ev['aponta'], 'type': 'whoosh'}, {'t': ev['aponta'] + 0.3, 'type': 'pop', 'f': 640}]
cues += [{'t': l['t'], 'type': 'sprout', 'i': i} for i, l in enumerate(ev['lojas'])]
cues += [{'t': l['t'] + 0.45, 'type': 'light', 'i': i} for i, l in enumerate(ev['lojas'])]
cues += [{'t': ev['sacola'], 'type': 'whoosh'}, {'t': ev['sacola'] + 0.3, 'type': 'plop'}, {'t': ev['pertim'], 'type': 'heart'}]
cues += [{'t': ev['aceno'], 'type': 'whoosh'}, {'t': ev['aceno'] + 0.35, 'type': 'shine'},
         {'t': ev['logo']['entra'], 'type': 'logo'}, {'t': ev['chip'], 'type': 'pop', 'f': 700}]
cues.sort(key=lambda x: x['t'])
json.dump({'duration': DUR, 'cues': cues}, open(os.path.join(AUD, 'cues.json'), 'w'), ensure_ascii=False, indent=1)

aberturas = sum(1 for a, b in zip(bocas, bocas[1:]) if a != b)
print(f'ok -> reels/prazer-pertim/dados/ (cena, visemas: {NQ} quadros e {aberturas} trocas de boca, legenda: {len(blocos_out)} blocos, '
      f'{len(piscadas)} piscadas) + cues.json ({len(cues)} efeitos)')
