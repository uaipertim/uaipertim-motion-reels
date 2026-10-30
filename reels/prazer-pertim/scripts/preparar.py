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
import re
import sys
import unicodedata

AQUI = os.path.dirname(os.path.abspath(__file__))
REEL = os.path.dirname(AQUI)
REPO = os.path.dirname(os.path.dirname(REEL))
sys.path.insert(0, os.path.join(REPO, 'scripts', 'personagem'))
import fala  # noqa: E402  (visemas, piscadas e legenda, comuns aos Reels do Pertim)
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
bocas = fala.visemas(CAPS, FALAS, FPS, NQ)
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
piscadas = fala.piscadas(bocas, FPS, DUR)
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
blocos_out = fala.legenda(CAPS, DUR, LG)
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
