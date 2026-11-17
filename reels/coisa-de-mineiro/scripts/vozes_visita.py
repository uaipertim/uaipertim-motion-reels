#!/usr/bin/env python3
"""
Série "Coisa de mineiro": as vozes candidatas da VISITA (o personagem fixo que fala com o Pertim) e o comparativo.

    python3 reels/coisa-de-mineiro/scripts/vozes_visita.py gerar <ep> <voice_id>[:Nome] ...   (usa a API)
    python3 reels/coisa-de-mineiro/scripts/vozes_visita.py medir <ep>                          (sem API)
    python3 reels/coisa-de-mineiro/scripts/vozes_visita.py comparativo <ep> <voice_id> ...      (sem API; na ordem dada)

Gera, com cada voz, as falas da visita do episódio (os capítulos com "falante": "visita"), cada uma UMA geração inteira
(eleven_v4, os mesmos ajustes do perfil "narracao" da voz oficial, seed 42, o texto vizinho como contexto, como no
voz.py). Grava em <ep>/vozes-visita/<voice_id>/cap-NN.wav + cap-NN.json (o alinhamento) e mede a altura média da voz
(F0 mediano) contra a do Pertim (Victor Pinho, nas falas dele do mesmo episódio).

O comparativo (<ep>/vozes-visita/comparativo-voz-visita.mp3): as vozes em sequência, cada uma com as falas da visita
(0,7 s entre elas); entre uma voz e a outra, 1 s de silêncio e um bip. A lista (número, nome e ID) vai em
<ep>/vozes-visita/comparativo-voz-visita.txt.

A chave da API NÃO fica no repositório nem é impressa: nesta nuvem a rede a põe no cabeçalho xi-api-key; fora dela,
defina ELEVENLABS_API_KEY (ou XI_API_KEY) no ambiente.
"""
import base64
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request

import numpy as np
from scipy.io import wavfile

AQUI = os.path.dirname(os.path.abspath(__file__))
SERIE = os.path.dirname(AQUI)
REPO = os.path.dirname(os.path.dirname(SERIE))
sys.path.insert(0, os.path.join(REPO, 'audio'))
from elevenlabs import perfil  # noqa: E402

SR = 44100
API = 'https://api.elevenlabs.io/v1/text-to-speech/{voice}/with-timestamps?output_format={fmt}'
modo, EP, *ARGS = sys.argv[1:]
ROT = json.load(open(os.path.join(SERIE, EP, 'roteiro.json')))
CAPS = ROT['capitulos']
OUT = os.path.join(SERIE, EP, 'vozes-visita')
VOZ_PERTIM = os.path.join(REPO, 'reels', 'explica-so', 'audio', 'coisa-de-mineiro', EP, 'voz')
PV = perfil('narracao')
VISITA = [n for n, c in enumerate(CAPS) if c.get('falante') == 'visita']
os.makedirs(OUT, exist_ok=True)


def texto(c):
    return ' '.join(f['texto'] for f in c['fala'])


def tts(voice, text, prev, nxt, seed=42):
    body = {'text': text, 'model_id': PV['model'], 'voice_settings': PV['voiceSettings'], 'seed': seed, 'previous_text': prev, 'next_text': nxt}
    headers = {'Content-Type': 'application/json', 'Accept': 'application/json'}
    key = os.environ.get('ELEVENLABS_API_KEY') or os.environ.get('XI_API_KEY')
    if key:
        headers['xi-api-key'] = key                    # nunca impresso nem gravado
    for fmt in ('pcm_44100', 'mp3_44100_192', 'mp3_44100_128'):
        req = urllib.request.Request(API.format(voice=voice, fmt=fmt), data=json.dumps(body).encode(), headers=headers, method='POST')
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                d = json.load(r)
        except urllib.error.HTTPError as e:
            if e.code in (400, 403, 422) and fmt != 'mp3_44100_128':
                continue
            raise SystemExit(f'PARADO: a API recusou {voice}: HTTP {e.code}')
        raw = base64.b64decode(d['audio_base64'])
        if fmt.startswith('pcm'):
            x = np.frombuffer(raw, '<i2').astype(np.float32) / 32768
        else:
            x = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', '-', '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'],
                                             input=raw, capture_output=True, check=True).stdout, '<i2').astype(np.float32) / 32768
        return x, d['alignment'], fmt
    raise SystemExit('nenhum formato aceito')


def f0_mediano(path):
    """a altura média da voz (Hz): F0 mediano dos trechos vozeados (autocorrelação simples, 70–400 Hz)"""
    sr, x = wavfile.read(path)
    x = x.astype(np.float32) / 32768
    if x.ndim > 1:
        x = x.mean(axis=1)
    w, h = int(0.04 * sr), int(0.01 * sr)
    lo, hi = int(sr / 400), int(sr / 70)
    fs = []
    for i in range(0, len(x) - w, h):
        s = x[i:i + w] - x[i:i + w].mean()
        if np.sqrt(np.mean(s ** 2)) < 0.02:
            continue
        ac = np.correlate(s, s, 'full')[w - 1:]
        k = lo + int(np.argmax(ac[lo:hi]))
        if ac[k] > 0.45 * ac[0]:
            fs.append(sr / k)
    return float(np.median(fs)) if fs else 0.0


def nome_de(voice):
    p = os.path.join(OUT, voice, 'voz.json')
    return json.load(open(p))['nome'] if os.path.exists(p) else voice


if modo == 'gerar':
    for arg in ARGS:
        voice, _, nome = arg.partition(':')
        pasta = os.path.join(OUT, voice)
        os.makedirs(pasta, exist_ok=True)
        json.dump({'voice_id': voice, 'nome': nome or voice, 'modelo': PV['model'], 'ajustes': PV['voiceSettings'], 'seed': 42},
                  open(os.path.join(pasta, 'voz.json'), 'w'), ensure_ascii=False, indent=1)
        for n in VISITA:
            prev = texto(CAPS[n - 1]) if n else None
            nxt = texto(CAPS[n + 1]) if n + 1 < len(CAPS) else None
            x, al, fmt = tts(voice, texto(CAPS[n]), prev, nxt)
            wavfile.write(os.path.join(pasta, f'cap-{n:02d}.wav'), SR, np.round(np.clip(x, -1, 1) * 32767).astype(np.int16))
            json.dump({'cap': n, 'texto': texto(CAPS[n]), 'voice_id': voice, 'seed': 42, 'formato': fmt, 'alinhamento': al},
                      open(os.path.join(pasta, f'cap-{n:02d}.json'), 'w'), ensure_ascii=False)
            print(f'  {nome or voice}: cap {n:02d} · {len(x) / SR:.2f} s ({fmt})')
    modo = 'medir'

if modo == 'medir':
    ref = [f0_mediano(os.path.join(VOZ_PERTIM, f'cap-{n:02d}.wav')) for n, c in enumerate(CAPS) if c.get('falante', 'pertim') == 'pertim']
    r = float(np.median(ref))
    print(f'Pertim (Victor Pinho): F0 mediano {r:.0f} Hz')
    for voice in sorted(os.listdir(OUT)):
        pasta = os.path.join(OUT, voice)
        if not os.path.isdir(pasta):
            continue
        fs = [f0_mediano(os.path.join(pasta, f'cap-{n:02d}.wav')) for n in VISITA if os.path.exists(os.path.join(pasta, f'cap-{n:02d}.wav'))]
        f = float(np.median(fs)) if fs else 0
        st = 12 * np.log2(f / r) if f else 0
        print(f'  {nome_de(voice):40s} {voice}: F0 {f:.0f} Hz ({st:+.1f} st do Pertim)')

if modo == 'comparativo':
    def tom(f, d):
        t = np.arange(int(d * SR)) / SR
        return (0.35 * np.sin(2 * np.pi * f * t) * np.minimum(1, np.minimum(t, d - t) / 0.01)).astype(np.float32)
    sil = lambda d: np.zeros(int(d * SR), np.float32)
    partes, linhas = [], []
    for i, voice in enumerate(ARGS):
        if i:
            partes += [sil(1.0), tom(880, 0.25), sil(0.35)]
        for j, n in enumerate(VISITA):
            sr, x = wavfile.read(os.path.join(OUT, voice, f'cap-{n:02d}.wav'))
            x = x.astype(np.float32) / 32768
            x = x / max(1e-6, np.abs(x).max()) * 0.8          # o mesmo pico para todas (comparar a voz, não o volume)
            partes += ([sil(0.7)] if j else []) + [x]
        linhas.append(f'{i + 1}. {nome_de(voice)} — ID {voice}')
    y = np.concatenate([sil(0.3)] + partes + [sil(0.5)])
    wav = os.path.join(OUT, 'comparativo-voz-visita.wav')
    wavfile.write(wav, SR, np.round(y * 32767).astype(np.int16))
    mp3 = os.path.join(OUT, 'comparativo-voz-visita.mp3')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-c:a', 'libmp3lame', '-b:a', '192k', mp3], check=True)
    os.remove(wav)
    falas = ' / '.join(f'"{texto(CAPS[n])}"' for n in VISITA)
    open(os.path.join(OUT, 'comparativo-voz-visita.txt'), 'w').write(
        f'Comparativo da voz da visita ({EP}): {falas}\nentre as vozes: 1 s de silêncio e um bip\n\n' + '\n'.join(linhas) + '\n')
    print('\n'.join(linhas))
    print(f'ok {os.path.relpath(mp3, REPO)} ({len(y) / SR:.1f} s)')
