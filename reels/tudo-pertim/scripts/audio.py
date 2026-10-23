#!/usr/bin/env python3
"""
Áudio de um episódio da série TUDO PERTIM (UaiPertim · TikTok) — trilha e efeitos 100% sintetizados (numpy/scipy) +
a narração da voz oficial (ElevenLabs).

    python3 scripts/audio.py tudo-pertim-01            -> audio/tudo-pertim-01/mix.wav (48 kHz, estéreo, −14 LUFS integrados, pico real ≤ −1,5 dBTP)
                                                          + musica.wav, sfx.wav, voz-tratada.wav (as pistas, para a revisão)
    python3 scripts/audio.py tudo-pertim-01 --previa   -> audio/tudo-pertim-01/previa/mix.wav: trilha + efeitos SEM voz, nos tempos estimados
                                                          (só para a prévia visual; nunca vai para o vídeo final)

  • VOZ (audio/<id>/voz.wav, montada por scripts/linha.py, um bloco inteiro por capítulo): cada capítulo nivelado por
    inteiro (até ±3 dB, o mesmo ganho no capítulo todo), passa-alta em 80 Hz e um compressor leve;
  • TRILHA contínua, animada, no BPM do episódio (linha.json → bpm, 118–124; padrão 120): bumbo em todos os tempos,
    palma no 2 e no 4, chimbal nos contratempos, baixo em colcheias, acordes "pluck" no contratempo e um sininho
    nos tempos fortes (Dó → Sol → Lá menor → Fá, um acorde por compasso); ~11 dB abaixo da voz, com ducking de
    até 6 dB enquanto a voz fala; no fecho o último acorde sustenta e some. A batida começa no t = 0, então os
    títulos (que entram no tempo da batida, src/anim.js) caem junto do bumbo;
  • EFEITOS tirados da animação (audio/<id>/cues.json): o "soco" do título, a derrapagem e a buzina da motinha,
    a motinha na troca, o nó que acende, o "boing", as lojinhas brotando e acendendo, a piscadinha, o confete,
    os itens caindo na sacola, o check, a porta, o carimbo, o coração, os riscos;
  • uma sala curtinha (reverb) nos efeitos e na trilha.
"""
import json
import os
import re
import subprocess
import sys
import numpy as np
from scipy.ndimage import minimum_filter1d, uniform_filter1d
from scipy.signal import butter, sosfilt, fftconvolve, resample_poly
from scipy.io import wavfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EP = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else 'tudo-pertim-01'
PREVIA = '--previa' in sys.argv
AUD = os.path.join(ROOT, 'audio', EP)
DEST = os.path.join(AUD, 'previa') if PREVIA else AUD
CUES = json.load(open(os.path.join(DEST, 'cues.json')))
LN = json.load(open(os.path.join(DEST, 'linha.json')))
DUR = float(LN['duracao'])
SR = 48000
N = int(round(SR * DUR))
TARGET_LUFS = -14.0
rng = np.random.default_rng(2024)


# ------------------------------------------------------------------ básicos
def tt(d):
    return np.arange(int(max(0.0, d) * SR)) / SR


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def filt(x, f, kind='low', order=2):
    if kind == 'band':
        f = [max(20, f[0]), min(SR / 2 * 0.95, f[1])]
    else:
        f = min(f, SR / 2 * 0.95)
    return sosfilt(butter(order, f, kind, fs=SR, output='sos'), x)


def noise(d):
    return rng.standard_normal(int(d * SR))


def add(*xs):
    """Soma sinais de comprimentos diferentes (completa com silêncio)."""
    out = np.zeros(max(len(x) for x in xs))
    for x in xs:
        out[: len(x)] += x
    return out


def stereo():
    return np.zeros((2, N))


def place(buf, sig, t, g=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= N or i + len(sig) <= 0:
        return
    if i < 0:
        sig, i = sig[-i:], 0
    j = min(N, i + len(sig))
    pan = float(np.clip(pan, -1, 1))
    buf[0, i:j] += sig[: j - i] * g * np.cos((pan + 1) * np.pi / 4) * 1.414
    buf[1, i:j] += sig[: j - i] * g * np.sin((pan + 1) * np.pi / 4) * 1.414


def place_pan(buf, sig, t, g, p0, p1):
    i = int(round(t * SR))
    if i >= N:
        return
    j = min(N, i + len(sig))
    s = sig[: j - i] * g
    pc = np.clip(np.linspace(p0, p1, len(sig))[: j - i], -1, 1)
    buf[0, i:j] += s * np.cos((pc + 1) * np.pi / 4) * 1.414
    buf[1, i:j] += s * np.sin((pc + 1) * np.pi / 4) * 1.414


def sweep(x, f0, f1, q=1.4):
    out = np.zeros_like(x)
    n, B, zi = len(x), 256, None
    for i in range(0, n, B):
        fc = f0 * (f1 / f0) ** (i / max(1, n - 1))
        sos = butter(2, [fc / (1 + 1 / q), min(fc * (1 + 1 / q), SR / 2 * 0.95)], 'band', fs=SR, output='sos')
        if zi is None:
            zi = np.zeros((sos.shape[0], 2))
        out[i:i + B], zi = sosfilt(sos, x[i:i + B], zi=zi)
    return out


def ir_room(d=0.7, seed=0, damp=0.16, lp=5200):
    """Sala pequena (recepção): reflexões curtas e abafadas."""
    r = np.random.default_rng(seed)
    t = tt(d)
    x = filt(r.standard_normal(len(t)) * np.exp(-t / damp), lp, 'low')
    x[: int(0.004 * SR)] = 0                           # pré-atraso
    return x / np.sqrt((x ** 2).sum())


# ------------------------------------------------------------------ timbres
def click(d=0.025, f=3000, dec=0.003):
    t = tt(d)
    return filt(noise(d), [f * 0.6, f * 1.6], 'band') * np.exp(-t / dec)


def wood(f=1900, d=0.06, dec=0.012):
    t = tt(d)
    return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.63 * t)) * np.exp(-t / dec) * np.minimum(1, t / 0.0005)


def thump(d=0.5, tone=46, dec=0.18, punch=1.0):
    t = tt(d)
    f = tone + 120 * np.exp(-t / 0.025)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / dec)
    return np.tanh(2.0 * punch * body) * np.clip((d - t) / 0.02, 0, 1)


def whoosh(d=0.4, f0=300, f1=3000, peak=0.6, q=1.2):
    t = tt(d)
    u = t / d
    return sweep(noise(d), f0, f1, q) * np.where(u < peak, (u / peak) ** 2, ((1 - u) / (1 - peak)) ** 1.5)


def desk_bell(f, d=3.0):
    """A sineta de recepção da série (parciais inarmônicos com batimento)."""
    t = tt(d)
    s = np.zeros_like(t)
    for m, a, dec in [(1.0, 1.0, 1.5), (1.0026, 0.55, 1.3), (2.0, 0.08, 0.6), (2.76, 0.42, 0.42), (2.766, 0.25, 0.38),
                      (4.1, 0.1, 0.2), (5.40, 0.2, 0.16), (0.5, 0.5, 2.2), (0.5013, 0.3, 2.0)]:
        s += a * np.sin(2 * np.pi * f * m * t + rng.uniform(0, 6)) * np.exp(-t / dec)
    s += filt(noise(d), [2500, 12000], 'band') * np.exp(-t / 0.0025) * 0.9
    return s * np.minimum(1, t / 0.0006) / 2.3




def ping(f, d=0.6):
    """Ping suave e genérico: seno com um leve brilho (2º e 3º parciais) e decaimento curto."""
    t = tt(d)
    s = np.sin(2 * np.pi * f * t) + 0.22 * np.sin(2 * np.pi * 2 * f * t + 0.4) * np.exp(-t / 0.09) + 0.06 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t / 0.05)
    s += 0.12 * np.sin(2 * np.pi * f * 1.003 * t)                # leve batimento, mais redondo
    return s * np.minimum(1, t / 0.003) * np.exp(-t / 0.2) / 1.3


def stamp_hit():
    """O carimbo: corpo grave, o tapa da borracha no papel, o balcão vibrando."""
    d = 0.9
    t = tt(d)
    body = np.sin(2 * np.pi * np.cumsum(52 + 95 * np.exp(-t / 0.02)) / SR) * np.exp(-t / 0.13)
    thwack = filt(noise(d), [260, 2600], 'band') * np.exp(-t / 0.02)
    slap = filt(noise(d), [3000, 9000], 'band') * np.exp(-t / 0.005) * 0.6
    desk = wood(205, d, 0.09) * 0.55 + wood(318, d, 0.06) * 0.3
    return np.tanh(1.7 * (body * 1.05 + thwack * 0.95 + slap + desk))


def rattle():
    """O tranco: a impressora e o papel chacoalham."""
    d = 0.45
    out = np.zeros(int(d * SR))
    for k, t0 in enumerate([0.012, 0.045, 0.078, 0.118, 0.165, 0.226, 0.3]):
        g = 0.9 * np.exp(-t0 / 0.12)
        s = add(click(0.03, 1700 + 900 * rng.random(), 0.003) * g, wood(1150 + 300 * rng.random(), 0.04, 0.006) * g * 0.4)
        i = int(t0 * SR)
        out[i:i + len(s)] += s
    out += filt(noise(d), [1200, 6000], 'band') * np.exp(-tt(d) / 0.05) * 0.25
    return out


def room_tone():
    """Ambiente de recepção quase inaudível."""
    x = filt(rng.standard_normal(N), [70, 1300], 'band', 2)
    x += filt(rng.standard_normal(N), [2000, 6000], 'band', 2) * 0.15
    return x / np.sqrt(np.mean(x ** 2)) * 10 ** (-56 / 20)


def true_peak_limit(x, ceiling_db=-2.5, os_=4):
    """Limitador de pico real: o ganho é calculado no sinal sobreamostrado (os_ x) com
    antecipação de 2 ms e suavização de 1 ms, e aplicado ao sinal original."""
    c = 10 ** (ceiling_db / 20)
    up = resample_poly(x, os_, 1, axis=0)
    need = np.minimum(1.0, c / np.maximum(np.abs(up).max(axis=1), 1e-9))
    w = int(0.002 * SR * os_)
    g = uniform_filter1d(minimum_filter1d(need, w), w // 2)
    g = g[: len(g) // os_ * os_].reshape(-1, os_).min(axis=1)
    y = x[: len(g)] * g[:, None]
    return np.concatenate([y, np.zeros((len(x) - len(y), 2))]) if len(y) < len(x) else y




# ------------------------------------------------------------------ timbres novos
def printer(d=0.4, big=False):
    """a impressora térmica: um zumbido de motor de passo (modulado a 38 Hz) com cliques de cabeça"""
    t = tt(d)
    am = 0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 38 * t))
    body = filt(noise(d), [900, 3800], 'band') * am * np.minimum(1, t / 0.01) * np.minimum(1, (d - t) / 0.03)
    body += np.sin(2 * np.pi * 190 * t) * 0.12 * am * np.minimum(1, (d - t) / 0.03)
    cl = np.zeros_like(t)
    for k in range(int(d * 38)):
        i = int(k / 38 * SR)
        c = click(0.012, 2600, 0.002)
        cl[i:i + len(c)] += c[: max(0, len(cl) - i)] * 0.5
    out = body + cl
    if big:                                           # o corte do papel ao fim do total
        out = add(out, wood(1500, 0.08, 0.012) * 0.6)
    return out


def pen(d=0.9):
    """caneta riscando: ruído filtrado que vai subindo e descendo, com arranhões"""
    t = tt(d)
    f = 2200 + 900 * np.sin(2 * np.pi * 7 * t)
    x = np.zeros_like(t)
    for k, fc in enumerate(np.linspace(1800, 3600, 8)):
        seg = filt(noise(d), [fc * 0.7, fc * 1.4], 'band')
        x += seg * (0.5 + 0.5 * np.sin(2 * np.pi * (5 + k) * t + k))
    return x * 0.25 * np.minimum(1, t / 0.05) * np.minimum(1, (d - t) / 0.12)


def tick(f=1500):
    return add(wood(f, 0.05, 0.007) * 0.8, click(0.01, 4200, 0.0015) * 0.4)


def riser(d=0.5, f0=250, f1=2600):
    return whoosh(d, f0, f1, 0.9, 1.0)


def slam():
    """o impacto do valor: baque grave com cauda e um brilho de agudo"""
    d = 1.0
    t = tt(d)
    body = np.sin(2 * np.pi * np.cumsum(60 + 140 * np.exp(-t / 0.025)) / SR) * np.exp(-t / 0.2)
    shine = filt(noise(d), [3500, 9000], 'band') * np.exp(-t / 0.05) * 0.3
    return np.tanh(1.8 * body) + shine


def fall(d=0.7):
    """queda: sopro descendente e um baque ao chegar embaixo"""
    w = sweep(noise(d), 2800, 220, 1.0) * np.minimum(1, np.arange(int(d * SR)) / SR / 0.05) * np.minimum(1, (d - tt(d)) / 0.1)
    return w * 0.9


def pop(f=700):
    t = tt(0.12)
    return np.sin(2 * np.pi * f * t * (1 + 0.5 * np.exp(-t / 0.02))) * np.exp(-t / 0.03)



def glass(f, d=1.6):
    """o nó do trilho: sino de vidro curto (parciais quase harmônicos)"""
    t = tt(d)
    s = np.zeros_like(t)
    for m, a, dec in [(1.0, 1.0, 0.9), (2.01, 0.35, 0.5), (3.02, 0.18, 0.25), (4.1, 0.08, 0.12), (1.003, 0.4, 0.8)]:
        s += a * np.sin(2 * np.pi * f * m * t + rng.uniform(0, 6)) * np.exp(-t / dec)
    return s * np.minimum(1, t / 0.002) / 2.0


def coin_clink(f=3200):
    t = tt(0.35)
    s = sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t / dec) for m, a, dec in [(1, 1, 0.08), (1.47, 0.6, 0.06), (2.31, 0.4, 0.04), (3.1, 0.2, 0.03)])
    return add(s, click(0.02, 6000, 0.002) * 0.5) * 0.6


def lock_clunk():
    return add(thump(0.35, 70, 0.06, 1.0) * 0.7, wood(900, 0.12, 0.02) * 0.6, click(0.03, 3500, 0.004) * 0.7, wood(2400, 0.06, 0.008) * 0.35)


def check_ding():
    a, b = ping(midi(84), 0.4), ping(midi(91), 0.5)
    out = np.zeros(int(0.6 * SR)); out[:len(a)] += a * 0.7; i = int(0.07 * SR); out[i:i + len(b)] += b[: len(out) - i]
    return out


def buzz(d=0.28):
    t = tt(d)
    x = np.sign(np.sin(2 * np.pi * 110 * t)) * 0.4 + np.sin(2 * np.pi * 220 * t) * 0.3
    x = filt(x, 1800, 'low') * np.minimum(1, t / 0.01) * np.minimum(1, (d - t) / 0.04)
    return x * (0.6 + 0.4 * (np.sin(2 * np.pi * 14 * t) > 0))


def typing(d):
    out = np.zeros(int((d + 0.1) * SR))
    k, tcur = 0, 0.0
    while tcur < d:
        s = add(click(0.02, 2400 + 1600 * rng.random(), 0.002) * 0.8, wood(1200 + 500 * rng.random(), 0.03, 0.005) * 0.3)
        i = int(tcur * SR); out[i:i + len(s)] += s[: max(0, len(out) - i)]
        tcur += 1 / 22 * (0.7 + 0.6 * rng.random()); k += 1
    return out


def sparkle():
    out = np.zeros(int(0.6 * SR))
    for k, n in enumerate([88, 91, 95, 100]):
        s = ping(midi(n), 0.4) * 0.5; i = int(k * 0.05 * SR); out[i:i + len(s)] += s[: len(out) - i]
    return out


# ------------------------------------------------------------------ timbres da UaiPertim
def moto_engine(d=0.9):
    """a motinha passando: motor de 2 tempos (dente de serra que sobe de giro), com o "vrrum" do escapamento"""
    t = tt(d)
    f = 70 + 70 * np.clip(t / (d * 0.6), 0, 1) ** 0.7 + 8 * np.sin(2 * np.pi * 9 * t)
    ph = np.cumsum(f) / SR
    saw = 2 * (ph % 1) - 1
    am = 0.75 + 0.25 * np.sign(np.sin(2 * np.pi * ph * 0.5))
    x = filt(saw * am, 1400, 'low') + 0.25 * filt(noise(d), [300, 2200], 'band') * am
    return np.tanh(1.6 * x) * np.minimum(1, t / 0.08) * np.minimum(1, (d - t) / 0.25) * 0.6


def horn():
    """bi-bi da motinha"""
    out = np.zeros(int(0.42 * SR))
    for t0 in (0.0, 0.2):
        t = tt(0.15)
        x = np.sign(np.sin(2 * np.pi * 440 * t)) * 0.5 + np.sign(np.sin(2 * np.pi * 554 * t)) * 0.5
        x = filt(x, 2600, 'low') * np.minimum(1, t / 0.008) * np.minimum(1, (0.15 - t) / 0.02)
        i = int(t0 * SR); out[i:i + len(x)] += x
    return out * 0.6


def boing(f0=330, d=0.45):
    """o "?" que pula: mola"""
    t = tt(d)
    f = f0 * (1 + 0.9 * np.sin(np.pi * np.clip(t / d, 0, 1))) * (1 + 0.04 * np.sin(2 * np.pi * 18 * t))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.22) * np.minimum(1, t / 0.004)


def plop():
    """o item caindo dentro da sacola de papel"""
    d = 0.3
    t = tt(d)
    paper = filt(noise(d), [600, 4200], 'band') * np.exp(-t / 0.045)
    return add(paper * 0.8, thump(0.25, 90, 0.05, 0.6) * 0.5)


def door():
    """a porta abrindo: rangido curto + o trinco"""
    d = 0.6
    t = tt(d)
    f = 520 + 260 * np.sin(np.pi * t / d)
    creak = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * (0.5 + 0.5 * (np.sin(2 * np.pi * 31 * t) > 0))
    creak = filt(creak, [400, 2600], 'band') * np.minimum(1, t / 0.05) * np.minimum(1, (d - t) / 0.15) * 0.35
    return add(click(0.03, 2800, 0.004), creak)


def clink():
    """o prato e o talher na mesa"""
    return add(coin_clink(2400) * 0.8, wood(1300, 0.08, 0.012) * 0.3)


def skid(d=0.75):
    """a motinha freando e derrapando: o chiado do pneu (ruído estreito que desce) + o motor caindo de giro"""
    t = tt(d)
    sq = sweep(noise(d), 2400, 1100, 6.0) * 2.2
    whine = np.sin(2 * np.pi * np.cumsum(1500 - 500 * t / d + 40 * np.sin(2 * np.pi * 23 * t)) / SR) * 0.25
    env = np.minimum(1, t / 0.02) * np.clip((d - t) / (d * 0.55), 0, 1)
    return (sq + whine) * env * 0.7 + moto_engine(d)[: len(t)] * 0.5


def clap():
    """palma: três estalos de ruído bem juntos e uma cauda curta"""
    d = 0.18
    out = np.zeros(int(d * SR))
    for k, t0 in enumerate((0.0, 0.009, 0.019)):
        s = filt(noise(0.05), [900, 5200], 'band') * np.exp(-tt(0.05) / 0.006)
        i = int(t0 * SR); out[i:i + len(s)] += s[: len(out) - i] * (0.7 if k < 2 else 1.0)
    out += filt(noise(d), [1000, 4500], 'band') * np.exp(-tt(d) / 0.05) * 0.5
    return out


def popper():
    """o estouro do confete: um tapa de ar + o papelzinho chiando"""
    d = 0.9
    t = tt(d)
    a = filt(noise(d), [400, 3800], 'band') * np.exp(-t / 0.012) * 1.4
    b = np.concatenate([thump(0.25, 80, 0.04, 0.8), np.zeros(len(t))])[: len(t)] * 0.5
    paper = filt(noise(d), [3000, 10000], 'band') * np.exp(-t / 0.35) * 0.18 * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 31 * t)))
    return a + b + paper


def sprout(i=0):
    """a lojinha brotando do chão: sopro que sobe + um pop de mola"""
    return add(riser(0.3, 300, 1800) * 0.6, np.concatenate([np.zeros(int(0.22 * SR)), pop(520 + 90 * i) * 1.0]))


# ------------------------------------------------------------------ as pistas
LN_C = LN['capitulos']
# --- a voz: cada capítulo nivelado por inteiro, passa-alta e compressor leve
voz = np.zeros(N) if PREVIA else wavfile.read(os.path.join(AUD, 'voz.wav'))[1].astype(np.float64) / 32768
voz = np.concatenate([voz, np.zeros(max(0, N - len(voz)))])[:N]
for c in LN['colocacao']:
    a = int(c['no_video_s'] * SR); b = a + c['amostras']
    seg = voz[a:b]
    rms = np.sqrt(np.mean(seg[np.abs(seg) > 0.01] ** 2)) + 1e-9
    voz[a:b] = seg * np.clip(0.11 / rms, 10 ** (-3 / 20), 10 ** (3 / 20))
voz = filt(voz, 80, 'high')
env_c = np.sqrt(uniform_filter1d(voz ** 2, int(0.03 * SR)) + 1e-12)
gain = np.minimum(1.0, (10 ** (-18 / 20) / np.maximum(env_c, 1e-9)) ** 0.5)
voz = voz * uniform_filter1d(gain, int(0.01 * SR))

# --- os efeitos
sfx, send = stereo(), stereo()
SFX_G = 10 ** (-13 / 20)
PENTA = [76, 79, 81, 84, 86, 88, 91, 93, 96, 98]
for c in CUES['cues']:
    t, ty, d = c['t'], c['type'], c.get('d', 0.3)
    if ty == 'trans':
        sd = c.get('dir', 1)                                  # o som anda com a motinha, de um lado ao outro
        place_pan(sfx, moto_engine(d + 0.25), t - 0.05, 0.46, -0.8 * sd, 0.8 * sd); place_pan(sfx, whoosh(d, 260, 2600, 0.55, 1.1), t, 0.22, -0.8 * sd, 0.8 * sd)
        place(sfx, sparkle(), t + d * 0.4, 0.12)
    elif ty == 'moto':
        place_pan(sfx, moto_engine(d + 0.15), t - 0.05, 0.5, -0.7, 0.3)
    elif ty == 'horn':
        place(sfx, horn(), t, 0.3, 0.2)
    elif ty == 'door':
        place(sfx, door(), t, 0.45, 0.3)
    elif ty == 'jump':
        place(sfx, boing(), t, 0.4); place(send, boing(), t, 0.08)
    elif ty == 'clink':
        place(sfx, clink(), t, 0.45)
    elif ty == 'flop':
        place(sfx, thump(0.5, 48, 0.14, 0.8), t, 0.45); place(sfx, filt(noise(0.35), [200, 1500], 'band') * np.exp(-tt(0.35) / 0.08), t, 0.25)
    elif ty == 'sprout':
        place(sfx, sprout(c.get('i', 0)), t, 0.45, [-0.5, 0.5, -0.3][c.get('i', 0) % 3])
    elif ty == 'dots':
        k = 0
        while k * 0.06 < d:
            place(sfx, tick(1800 + 90 * k), t + k * 0.06, 0.12); k += 1
    elif ty == 'stamp':
        place(sfx, stamp_hit(), t + 0.12, 0.42); place(send, stamp_hit(), t + 0.12, 0.1)
    elif ty == 'plop':
        place(sfx, plop(), t, 0.5)
    elif ty == 'logo':
        place(sfx, sparkle(), t, 0.3); place(sfx, thump(0.4, 60, 0.1, 0.7), t + 0.05, 0.3); place(send, sparkle(), t, 0.15)
    elif ty == 'node':
        g = glass(midi(PENTA[c['k'] % len(PENTA)])); place(sfx, g, t, 0.42, -0.5); place(send, g, t, 0.3); place(sfx, thump(0.3, 58, 0.08, 0.7), t, 0.25)
    elif ty == 'title':
        place(sfx, whoosh(0.3, 1500, 500, 0.3, 1.2), t, 0.12)
    elif ty == 'apoio':
        place(sfx, tick(2600), t + 0.12, 0.08)
    elif ty == 'strike':
        place(sfx, pen(0.35), t, 0.6, 0.2)
    elif ty == 'lockon':
        place(sfx, lock_clunk(), t, 0.4); place(sfx, ping(midi(86), 0.5), t + 0.03, 0.18); place(send, ping(midi(86), 0.5), t, 0.1)
    elif ty == 'railstart':
        place(sfx, riser(0.8, 200, 1600), t, 0.12)
    elif ty == 'pop':
        place(sfx, pop(c.get('f', 640)), t, 0.45); place(send, pop(c.get('f', 640)), t, 0.1)
    elif ty == 'slide':
        place(sfx, whoosh(0.25, 800, 3000, 0.5, 1.3), t - 0.03, 0.22); place(sfx, pop(560), t + 0.12, 0.25)
    elif ty == 'chip':
        place(sfx, tick(2200), t, 0.3)
    elif ty == 'tick':
        place(sfx, tick(1800), t, 0.22)
    elif ty == 'slot':
        place(sfx, wood(700 + 180 * c.get('i', 0), 0.12, 0.03), t, 0.45); place(sfx, click(0.02, 3000, 0.003), t, 0.3)
    elif ty == 'snap':
        place(sfx, wood(420, 0.15, 0.03), t, 0.5); place(sfx, thump(0.4, 50, 0.1, 0.8), t + 0.05, 0.35); place(sfx, whoosh(0.3, 2400, 400, 0.4, 1.2), t, 0.2)
    elif ty == 'alert':
        place(sfx, buzz(), t, 0.22); place(sfx, buzz(0.2), t + 0.3, 0.16)
    elif ty == 'check':
        place(sfx, check_ding(), t, 0.3); place(send, check_ding(), t, 0.08)
    elif ty == 'drop':
        place(sfx, whoosh(0.35, 2600, 500, 0.8, 1.2), t, 0.18)
    elif ty == 'lock':
        place(sfx, lock_clunk(), t, 0.55); place(send, lock_clunk(), t, 0.12)
    elif ty == 'flicker':
        for k in range(3):
            place(sfx, click(0.03, 1800, 0.006), t + k * 0.13, 0.2)
    elif ty == 'grow':
        place(sfx, riser(d, 300, 2200), t, 0.18)
    elif ty == 'fill':
        place(sfx, riser(0.45, 500, 2800), t, 0.16); place(sfx, pop(720), t + 0.4, 0.3)
    elif ty == 'cut':
        place(sfx, wood(330, 0.1, 0.02), t, 0.45)
    elif ty == 'count':
        k = 0
        while k * 0.05 < d:
            place(sfx, tick(2000 + 60 * k), t + k * 0.05, 0.08); k += 1
    elif ty == 'big':
        s = slam(); place(sfx, s, t, 0.34); place(send, s, t, 0.12); place(sfx, sparkle(), t, 0.18)
    elif ty == 'coin':
        place(sfx, coin_clink(), t, 0.4); place(send, coin_clink(), t, 0.1)
    elif ty == 'coinsfall':
        for k in range(6):
            place(sfx, coin_clink(2600 + 500 * rng.random()), t + 0.05 * k + 0.25 + 0.04 * rng.random(), 0.32, rng.uniform(-0.5, 0.5))
    elif ty == 'question':
        place(sfx, ping(midi(79), 0.5), t, 0.28); place(sfx, ping(midi(84), 0.5), t + 0.1, 0.22)
    elif ty == 'rise':
        place(sfx, riser(0.4, 400, 2600), t, 0.18)
    elif ty == 'deny':
        place(sfx, buzz(0.18), t + 0.25, 0.18)
    elif ty == 'whoosh':
        place_pan(sfx, whoosh(0.45, 400, 3200, 0.5, 1.2), t, 0.3, -0.4, 0.4)
    elif ty == 'neq':
        place(sfx, thump(0.4, 60, 0.08, 0.9), t, 0.4); place(sfx, wood(1600, 0.06, 0.01), t, 0.3)
    elif ty == 'shine':
        place(sfx, sparkle(), t, 0.25); place(send, sparkle(), t, 0.15)
    elif ty == 'light':
        place(sfx, pop(700 + 120 * c.get('i', 0)), t, 0.35); place(sfx, ping(midi(88 + 2 * c.get('i', 0)), 0.4), t + 0.02, 0.14)
    elif ty == 'type':
        place(sfx, typing(d), t, 0.35)
    elif ty == 'punch':
        g = 1.0 if c.get('i', 0) == 0 else 0.7
        place(sfx, thump(0.3, 56, 0.07, 1.1), t, 0.42 * g); place(sfx, clap(), t, 0.22 * g)
        place(sfx, whoosh(0.18, 3200, 700, 0.2, 1.2), t - 0.06, 0.16 * g)
    elif ty == 'skid':
        place_pan(sfx, skid(), t, 0.42, 0.6, -0.1); place(send, skid(), t, 0.06)
    elif ty == 'blink':
        place(sfx, wood(2900, 0.04, 0.006), t, 0.12); place(sfx, wood(2900, 0.04, 0.006), t + 0.12, 0.1)
    elif ty == 'confete':
        place(sfx, popper(), t, 0.42); place(sfx, sparkle(), t + 0.04, 0.28); place(send, sparkle(), t, 0.16)
        for k in range(5):
            place(sfx, pop(900 + 260 * k), t + 0.08 + 0.05 * k, 0.12, rng.uniform(-0.6, 0.6))
    elif ty == 'ronc':
        # a barriga roncando: um grave que treme e desce, com um "glub" no fim
        dd = 0.8
        tq = tt(dd)
        f = 95 - 35 * tq / dd + 12 * np.sin(2 * np.pi * 9 * tq)
        rr_ = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 23 * tq)))
        rr_ = filt(rr_, 900, 'low') * np.minimum(1, tq / 0.04) * np.clip((dd - tq) / 0.25, 0, 1)
        place(sfx, np.tanh(2.2 * rr_) * 0.9, t, 0.5); place(sfx, boing(180, 0.3), t + 0.7, 0.25)
    elif ty == 'alarme':
        # o despertador: o martelinho batendo rápido nos dois sininhos
        for k in range(10):
            place(sfx, ping(midi(96 + (k % 2) * 3), 0.18), t + k * 0.035, 0.07, -0.3 + 0.6 * (k % 2))
    elif ty == 'galinha':
        # a galinha em disparada: "có-có-có-CÓÓ" (pulsos com o tom subindo e descendo) + o bater de asas, andando de um lado ao outro
        sd = c.get('dir', 1)
        for j, (t0, f0, dd, g) in enumerate([(0.0, 520, 0.07, 0.8), (0.11, 560, 0.07, 0.8), (0.22, 600, 0.08, 0.9), (0.36, 700, 0.22, 1.0)]):
            tq = tt(dd)
            f = f0 * (1 + 0.35 * np.sin(np.pi * tq / dd)) * (1 + 0.03 * np.sin(2 * np.pi * 30 * tq))
            ph = np.cumsum(f) / SR
            v = (2 * (ph % 1) - 1) * 0.6 + np.sin(2 * np.pi * ph * 2) * 0.4
            v = filt(v, [450, 3200], 'band') * np.minimum(1, tq / 0.006) * np.clip((dd - tq) / 0.03, 0, 1)
            place(sfx, np.tanh(2.0 * v) * g, t + t0, 0.34, sd * (-0.6 + 0.4 * j))
        for j in range(int(max(0.3, d) / 0.075)):
            asa = filt(noise(0.05), [600, 3000], 'band') * np.exp(-tt(0.05) / 0.012)
            place(sfx, asa, t + j * 0.075, 0.2, sd * (-0.8 + 1.6 * j * 0.075 / max(0.3, d)))
    elif ty == 'toc':
        # a batida na porta: madeira oca e grave
        place(sfx, add(wood(320, 0.18, 0.04) * 0.9, thump(0.25, 90, 0.05, 0.7) * 0.6, click(0.02, 2200, 0.003) * 0.4), t, 0.55, -0.3)
    elif ty == 'mosca':
        # a mosquinha zumbindo baixinho (some e volta)
        dd = c.get('d', 3.0)
        tq = tt(dd)
        f = 220 + 25 * np.sin(2 * np.pi * 3.1 * tq)
        z = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.5
        z = filt(z, [180, 2500], 'band') * (0.55 + 0.45 * np.sin(2 * np.pi * 0.7 * tq) ** 2) * np.minimum(1, tq / 0.3) * np.clip((dd - tq) / 0.4, 0, 1)
        place_pan(sfx, z, t, 0.05, -0.4, 0.4)
    elif ty == 'heart':
        place(sfx, pop(900), t, 0.4); place(sfx, sparkle(), t + 0.05, 0.22); place(send, sparkle(), t, 0.12)
    else:
        raise ValueError('cue desconhecido: ' + ty)
sfx *= SFX_G

# --- a trilha contínua (animada, no BPM do episódio)
BPM = float(LN.get('bpm', 120))
BT = 60.0 / BPM
BAR = 4 * BT
CHORDS = [[60, 64, 67, 72], [55, 59, 62, 67], [57, 60, 64, 69], [53, 57, 60, 65]]      # Dó, Sol, Lá m, Fá
music = np.zeros(N)
t = np.arange(N) / SR
FIM = LN_C[-1]['voz_t1'] + 0.6                                                    # o último acorde começa aqui e sustenta


def at_(sig, t0, g=1.0):
    i = int(round(t0 * SR))
    if i >= N or i < 0:
        return
    j = min(N, i + len(sig))
    music[i:j] += sig[: j - i] * g


def pluck(notes, d=0.32):
    tt_ = tt(d)
    x = np.zeros_like(tt_)
    for n in notes:
        f = midi(n)
        x += (np.sin(2 * np.pi * f * tt_) + 0.5 * np.sin(2 * np.pi * 2 * f * tt_) * np.exp(-tt_ / 0.05) + 0.25 * np.sin(2 * np.pi * 3 * f * tt_) * np.exp(-tt_ / 0.03))
    return x * np.exp(-tt_ / 0.11) * np.minimum(1, tt_ / 0.003) / len(notes)


def bassnote(n, d):
    tt_ = tt(d)
    ph = (midi(n) * tt_) % 1
    x = filt(2 * ph - 1, 900, 'low') + 0.6 * np.sin(2 * np.pi * midi(n) * tt_)
    return x * np.exp(-tt_ / 0.16) * np.minimum(1, tt_ / 0.004) * np.minimum(1, (d - tt_) / 0.01)


def hat(open_=False):
    d = 0.12 if open_ else 0.045
    return filt(noise(d), [7000, 14000], 'band') * np.exp(-tt(d) / (0.04 if open_ else 0.012))


def bell(n):
    tt_ = tt(0.8)
    return (np.sin(2 * np.pi * midi(n) * tt_) + 0.3 * np.sin(2 * np.pi * 2.76 * midi(n) * tt_) * np.exp(-tt_ / 0.08)) * np.exp(-tt_ / 0.3) * np.minimum(1, tt_ / 0.002)


nb = int(np.ceil(FIM / BAR))
for k in range(nb):
    t0 = k * BAR
    ch = CHORDS[k % 4]
    for q in range(4):                                                            # os 4 tempos do compasso
        tb = t0 + q * BT
        if tb >= FIM:
            break
        at_(thump(0.3, 50, 0.085, 1.0), tb, 0.55)                                 # o bumbo em todos os tempos
        if q % 2 == 1:
            at_(clap(), tb, 0.32)                                                 # a palma no 2 e no 4
        at_(hat(), tb + BT / 2, 0.16)                                            # o chimbal no contratempo
        at_(hat(), tb, 0.06)
        for e_ in range(2):                                                       # o baixo em colcheias (fundamental e oitava)
            at_(bassnote(ch[0] - 24 + (12 if e_ else 0), BT / 2), tb + e_ * BT / 2, 0.32)
        at_(pluck([n + 12 for n in ch[1:]]), tb + BT / 2, 0.26)                  # o acorde no contratempo
        if q in (0, 2):
            at_(bell(ch[(q // 2 + k) % len(ch)] + 24), tb, 0.08)                  # o sininho nos tempos fortes
# o último acorde, sustentado até o fim
d = DUR - FIM + 1.0
tt_ = tt(d)
pad = np.zeros_like(tt_)
for n in CHORDS[0]:
    f = midi(n)
    for det in (-0.004, 0.0, 0.004):
        pad += np.sin(2 * np.pi * f * (1 + det) * tt_ + rng.uniform(0, 6)) * 0.5 + 0.2 * np.sin(2 * np.pi * 2 * f * (1 + det) * tt_)
pad = filt(pad, 1800, 'low') * np.minimum(1, tt_ / 0.05) * np.exp(-tt_ / 2.2) / (len(CHORDS[0]) * 3)
at_(pad + np.sin(2 * np.pi * midi(36) * tt_) * np.exp(-tt_ / 1.2) * 0.4, FIM, 1.0)
at_(thump(0.5, 48, 0.2, 1.0), FIM, 0.6); at_(clap(), FIM, 0.3); at_(pluck([n + 12 for n in CHORDS[0]], 1.2), FIM, 0.4)
music = filt(music, 50, 'high')
music *= np.clip(t / 0.6, 0, 1) * np.clip((DUR - t) / 1.2, 0, 1)
# ducking suave
venv = np.sqrt(uniform_filter1d(voz ** 2, int(0.02 * SR)) + 1e-12)
act = np.clip((venv - 10 ** (-42 / 20)) / (10 ** (-30 / 20) - 10 ** (-42 / 20)), 0, 1)
sm = np.copy(act)
a_att, a_rel = np.exp(-1 / (0.06 * SR)), np.exp(-1 / (0.45 * SR))
for i in range(1, N):
    c = a_att if act[i] > sm[i - 1] else a_rel
    sm[i] = c * sm[i - 1] + (1 - c) * act[i]
music *= 1 - (1 - 10 ** (-6 / 20)) * sm
ref = np.sqrt(np.mean(voz[np.abs(voz) > 0.005] ** 2)) if np.any(np.abs(voz) > 0.005) else 0.11   # (prévia sem voz: a voz de referência)
music *= 10 ** (-10 / 20) / max(1e-9, np.sqrt(np.mean(music ** 2))) * ref * 0.8
msc = np.stack([music, np.roll(music, int(0.011 * SR)) * 0.97])

# ------------------------------------------------------------------ a sala + a mixagem + o master
send += sfx * 0.1 + msc * 0.08
wet = np.stack([fftconvolve(send[0], ir_room(0.8, 7))[:N], fftconvolve(send[1], ir_room(0.8, 8))[:N]])
mix = np.stack([voz, voz]) + sfx + msc + wet * 0.5
mix *= np.clip(t / 0.005, 0, 1) * np.clip((DUR - t) / 0.05, 0, 1)
mix = filt(mix, 15500, 'low', 4)


def lufs(x):
    raw = os.path.join(AUD, '.medida.wav')
    wavfile.write(raw, SR, np.clip(x, -1, 1).astype(np.float32))
    e = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', raw, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    os.remove(raw)
    s = e[e.rindex('Summary:'):]
    return float(re.search(r'I:\s+(-?[\d.]+) LUFS', s).group(1))


x = mix.T / max(1e-9, np.abs(mix).max()) * 0.5
for _ in range(5):
    x = true_peak_limit(x * 10 ** ((TARGET_LUFS - lufs(x)) / 20), -1.8)
I = lufs(x)
wavfile.write(os.path.join(DEST, 'mix.wav'), SR, np.round(np.clip(x, -1, 1) * 32767).astype(np.int16))
for nome, sig in (('voz-tratada', np.stack([voz, voz])), ('musica', msc), ('sfx', sfx)):
    wavfile.write(os.path.join(DEST, nome + '.wav'), SR, np.round(np.clip(sig.T * (x.std() / max(1e-9, mix.T.std())), -1, 1) * 32767).astype(np.int16))
print(f'ok -> {os.path.relpath(os.path.join(DEST, "mix.wav"), ROOT)} | {I:.1f} LUFS | {len(CUES["cues"])} cues | voz sozinha {lufs(np.stack([voz, voz]).T * (x.std() / max(1e-9, mix.T.std()))):.1f} LUFS')
