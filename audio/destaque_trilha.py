"""Trilha leve dos stories de destaque (6 s, sintetizada pelo projeto, sem samples): um acorde macio de Dó 7M(9),
um arpejo de pentatônica que sobe na entrada (o texto entra até 1,2 s) e um "plim" de vidro no começo.
Fecha com fade curto para emendar bem quando o destaque passa de um card para o outro.

    python3 audio/destaque_trilha.py   -> public/audio/destaques/trilha.wav (48 kHz, estéreo, -14 LUFS, pico real <= -1,5 dBTP)
"""
import os
import re
import subprocess
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt, resample_poly

SR, D = 48000, 6.0
N = int(SR * D)
t = np.arange(N) / SR
rng = np.random.default_rng(7)
midi = lambda n: 440 * 2 ** ((n - 69) / 12)
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "audio", "destaques", "trilha.wav")

x = np.zeros(N)
# a cama: Dó 7M(9) com leve desafinação (chorus), entrando em 0,4 s e sumindo no fim
env = np.clip(t / 0.4, 0, 1) * np.clip((D - t) / 0.6, 0, 1)
for n in (48, 55, 60, 64, 67, 71, 74):
    for det in (-0.003, 0.0, 0.003):
        x += np.sin(2 * np.pi * midi(n) * (1 + det) * t + rng.uniform(0, 6)) * (0.55 if n > 48 else 0.9)
x = sosfilt(butter(2, 1400, "low", fs=SR, output="sos"), x) * env / 18
# o arpejo na entrada (0,05 a 1,2 s) e duas notas soltas depois
for k, (tn, n) in enumerate([(0.05, 72), (0.2, 76), (0.35, 79), (0.5, 84), (0.7, 88), (1.0, 91), (2.6, 84), (4.1, 88)]):
    nt = np.arange(int(1.4 * SR)) / SR
    note = (np.sin(2 * np.pi * midi(n) * nt) + 0.3 * np.sin(2 * np.pi * 2 * midi(n) * nt) * np.exp(-nt / 0.08)) * np.exp(-nt / 0.35) * np.minimum(1, nt / 0.004)
    i = int(tn * SR); j = min(N, i + len(note)); x[i:j] += note[: j - i] * (0.22 if k < 6 else 0.14)
# o "plim" de vidro
nt = np.arange(int(1.5 * SR)) / SR
plim = sum(a * np.sin(2 * np.pi * midi(96) * m * nt) * np.exp(-nt / dk) for m, a, dk in [(1, 1, 0.5), (2.01, 0.35, 0.25), (3.02, 0.15, 0.12)])
x[: len(plim)] += plim * 0.12
x *= np.clip((D - t) / 0.15, 0, 1)
st = np.stack([x, np.roll(x, int(0.012 * SR)) * 0.96], axis=1)


def lufs(y):
    tmp = OUT + ".medida.wav"
    wavfile.write(tmp, SR, y.astype(np.float32))
    e = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", tmp, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    os.remove(tmp)
    s = e[e.rindex("Summary:"):]
    return float(re.search(r"I:\s+(-?[\d.]+) LUFS", s).group(1)), float(re.search(r"Peak:\s+(-?[\d.]+) dBFS", s).group(1))


os.makedirs(os.path.dirname(OUT), exist_ok=True)
st = st / np.abs(st).max() * 0.3
for _ in range(4):
    I, tp = lufs(st)
    st *= 10 ** ((-14 - I) / 20)
    up = np.abs(resample_poly(st, 4, 1, axis=0)).max()
    if up > 10 ** (-1.5 / 20):                    # limita o pico real com uma saturação suave
        st = np.tanh(st / up * 10 ** (-1.5 / 20) * 1.2) / np.tanh(1.2) * 10 ** (-1.5 / 20) * 0.98
I, tp = lufs(st)
wavfile.write(OUT, SR, np.round(np.clip(st, -1, 1) * 32767).astype(np.int16))
print(f"ok -> public/audio/destaques/trilha.wav | {I:.1f} LUFS | pico real {tp:.1f} dBTP")
