#!/usr/bin/env python3
"""
Reel "Bateu a fome?": os comparativos de pronúncia do "Pertim" (para ouvir no celular), sem API.

    python3 reels/bateu-a-fome/scripts/comparativo.py
        -> reels/bateu-a-fome/tomadas/comparativos/comparativo-fala2.mp3, -fala7.mp3, -fala9.mp3
           reels/bateu-a-fome/tomadas/comparativos/LISTA.md (a ordem de cada arquivo: nº, início, letra, grafia, seed, tomada)

Cada comparativo traz as tomadas de UMA fala (gerações inteiras, de reels/bateu-a-fome/tomadas/cap-NN/, feitas com
scripts/tomadas.py) na ordem das grafias a, b, c, d, e; em cada grafia, primeiro a seed da tomada atual da fala e
depois a seed 42. Entre uma tomada e outra: 1 s de silêncio e um bip curto (e 0,35 s até a próxima). Cada tomada é
nivelada pelo RMS da fala (o mesmo volume para todas); nada é cortado dentro dela.
Grafias (só no texto enviado à voz; tela e legenda continuam "UaiPertim"/"Pertim"):
  a) sem troca (referência) · b) "UaiPértim"/"Pértim" · c) "Uai pertím"/"pertím" · d) "UaiPértĩ"/"Pértĩ" · e) "Uai Pérti"/"Pérti"
"""
import json
import os
import re
import subprocess
import numpy as np
from scipy.io import wavfile

AQUI = os.path.dirname(os.path.abspath(__file__))
REEL = os.path.dirname(AQUI)
REPO = os.path.dirname(os.path.dirname(REEL))
TOM = os.path.join(REEL, 'tomadas')
SAI = os.path.join(TOM, 'comparativos')
os.makedirs(SAI, exist_ok=True)
SR = 44100
FALAS = {2: ('01', 2042), 7: ('06', 3042), 9: ('08', 4042)}       # fala do roteiro → (capítulo, seed da tomada atual)
GRAFIAS = [
    ('a', 'sem troca (referência)', lambda s: not re.search(r'Pért|pért|pertí', s)),
    ('b', '"UaiPértim" / "Pértim"', lambda s: re.search(r'[Pp]értim', s)),
    ('c', '"Uai pertím" / "pertím"', lambda s: 'pertím' in s),
    ('d', '"UaiPértĩ" / "Pértĩ"', lambda s: 'értĩ' in s),
    ('e', '"Uai Pérti" / "Pérti"', lambda s: re.search(r'[Pp]érti(?![mĩ])', s)),
]


def tomadas(cap):
    d = os.path.join(TOM, f'cap-{cap}')
    out = []
    for f in sorted(os.listdir(d)):
        if f.endswith('.json') and f != 'medidas.json':
            J = json.load(open(os.path.join(d, f)))
            out.append((J, os.path.join(d, f[:-5])))
    return out


def bip(d=0.15, f=1000):
    t = np.arange(int(d * SR)) / SR
    env = np.minimum(1, np.minimum(t / 0.01, (d - t) / 0.03))
    return 0.25 * np.sin(2 * np.pi * f * t) * env


def nivela(y):
    v = y[np.abs(y) > 0.02]
    rms = np.sqrt(np.mean(v ** 2)) if len(v) else 0.1
    return y * (0.12 / rms)


lista = ['# Comparativos de pronúncia do "Pertim" (Reel "Bateu a fome?")', '',
         'Cada arquivo traz as tomadas de uma fala na ordem **a, b, c, d, e**. Em cada grafia, primeiro vem a **seed da tomada '
         'atual** da fala e depois a **seed 42**. Entre as tomadas há 1 s de silêncio e um bip curto.',
         'A grafia muda só no texto enviado à voz; na tela e na legenda continua "UaiPertim"/"Pertim".',
         'Cada tomada é uma geração inteira, sem corte, nivelada no mesmo volume.', '',
         'Grafias: a) sem troca (referência) · b) "UaiPértim"/"Pértim" (a do Reel "Pedir no UaiPertim é assim") · '
         'c) "Uai pertím"/"pertím" (a do TikTok) · d) "UaiPértĩ"/"Pértĩ" (til, final só nasal) · e) "Uai Pérti"/"Pérti" (sem o m).', '']
problemas = []
for fala, (cap, seed_atual) in FALAS.items():
    T = tomadas(cap)
    partes, linhas, t = [np.zeros(int(0.3 * SR))], [], 0.3
    n = 0
    for letra, nome, ok in GRAFIAS:
        for seed in (seed_atual, 42):
            cand = [(J, b) for J, b in T if J['seed'] == seed and ok(J['texto_api'])]
            if not cand:
                raise SystemExit(f'fala {fala}: falta a tomada da grafia {letra} com a seed {seed}')
            J, b = cand[0]
            sr, y = wavfile.read(b + '.wav')
            y = y.astype(np.float64) / 32768
            assert sr == SR
            # a tomada saiu inteira? (de 120 a 40 ms antes do fim já em silêncio; algumas gerações trazem um clique nos últimos
            # 40 ms, depois da fala: ele some com um fade de 30 ms no fim, que não toca na fala)
            cauda = 20 * np.log10(np.sqrt(np.mean(y[-int(0.12 * SR):-int(0.04 * SR)] ** 2)) + 1e-9)
            if cauda > -45:
                problemas.append(f'fala {fala}, {letra} seed {seed}: ainda há fala no fim do áudio ({cauda:.0f} dB): pode ter saído cortada')
            k = int(0.03 * SR)
            y = y.copy(); y[-k:] *= np.linspace(1, 0, k)
            if n:
                partes += [np.zeros(int(1.0 * SR)), bip(), np.zeros(int(0.35 * SR))]
                t += 1.0 + 0.15 + 0.35
            n += 1
            atual = ' **(a do vídeo hoje)**' if letra == 'a' and seed == seed_atual else ''
            linhas.append(f'| {n} | {int(t // 60)}:{t % 60:05.2f} | **{letra}** | {nome} | {seed}{atual} | `{J["texto_api"]}` | `{os.path.relpath(b, REEL)}.mp3` |')
            yy = nivela(y)
            partes.append(yy)
            t += len(yy) / SR
    x = np.concatenate(partes + [np.zeros(int(0.5 * SR))])
    x = x / max(1.0, np.abs(x).max() / 0.95)
    wav = os.path.join(SAI, f'.comparativo-fala{fala}.wav')
    wavfile.write(wav, SR, np.round(x * 32767).astype(np.int16))
    mp3 = os.path.join(SAI, f'comparativo-fala{fala}.mp3')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-c:a', 'libmp3lame', '-b:a', '192k', mp3], check=True)
    os.remove(wav)
    texto = T[0][0]['texto']
    lista += [f'## comparativo-fala{fala}.mp3 · fala {fala}: "{texto}" ({len(x) / SR:.1f} s)', '',
              '| nº | início | letra | grafia | seed | texto enviado à voz | tomada |', '|---|---|---|---|---|---|---|'] + linhas + ['']
    print(f'ok {os.path.relpath(mp3, REPO)} · {n} tomadas · {len(x) / SR:.1f} s')
if problemas:
    lista += ['## Atenção', ''] + [f'- {p}' for p in problemas] + ['']
open(os.path.join(SAI, 'LISTA.md'), 'w').write('\n'.join(lista))
print('ok reels/bateu-a-fome/tomadas/comparativos/LISTA.md')
for p in problemas:
    print('ATENÇÃO:', p)
