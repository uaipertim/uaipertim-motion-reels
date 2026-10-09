"""Efeitos sonoros cartoon sintetizados (numpy) — sem samples externos.

Cada função devolve um array mono float32 em 48 kHz. `build()` grava todos em
audio/build/sfx/<nome>.wav para o mix.
"""
import numpy as np
from scipy.signal import butter, istft, sosfilt, stft

from common import BUILD, SR, load_timeline, write

rng = np.random.default_rng(7)


def t_(dur):
    return np.arange(int(SR * dur)) / SR


def env_exp(dur, decay, attack=0.002):
    t = t_(dur)
    e = np.exp(-t / decay)
    a = int(attack * SR)
    if a:
        e[:a] *= np.linspace(0, 1, a)
    return e


def sweep_sine(f0, f1, dur, curve="exp", phase_noise=0.0):
    t = t_(dur)
    if curve == "exp":
        f = f0 * (f1 / f0) ** (t / dur)
    else:
        f = f0 + (f1 - f0) * (t / dur)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph)


def bp(x, lo, hi, order=2):
    sos = butter(order, [lo, hi], btype="band", fs=SR, output="sos")
    return sosfilt(sos, x)


def lp(x, fc, order=2):
    return sosfilt(butter(order, fc, btype="low", fs=SR, output="sos"), x)


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc, btype="high", fs=SR, output="sos"), x)


def norm(x, peak=0.9):
    return (x / (np.abs(x).max() + 1e-9) * peak).astype(np.float32)


def place(dst, src, at):
    i = int(at * SR)
    n = min(len(src), len(dst) - i)
    if n > 0:
        dst[i:i + n] += src[:n]
    return dst


def noise_sweep(dur, f_start, f_end, bw=0.5, shape=None):
    """Ruído com banda passante que varre de f_start a f_end (whoosh)."""
    x = rng.standard_normal(int(SR * dur))
    f, tt, Z = stft(x, SR, nperseg=1024, noverlap=768)
    prog = np.clip(tt / dur, 0, 1)
    fc = f_start * (f_end / f_start) ** prog
    logf = np.log2(np.maximum(f, 20))[:, None]
    mask = np.exp(-0.5 * ((logf - np.log2(fc)[None, :]) / bw) ** 2)
    _, y = istft(Z * mask, SR, nperseg=1024, noverlap=768)
    y = y[: len(x)]
    t = t_(len(y) / SR)
    e = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.5 if shape is None else shape(t / dur)
    return y * e


def fm_bell(f0, dur=1.4, ratio=1.4, index=3.0, decay=0.45):
    t = t_(dur)
    idx = index * np.exp(-t / (decay * 0.6))
    mod = np.sin(2 * np.pi * f0 * ratio * t)
    car = np.sin(2 * np.pi * f0 * t + idx * mod)
    partial = 0.25 * np.sin(2 * np.pi * f0 * 2.76 * t) * np.exp(-t / (decay * 0.4))
    return (car + partial) * env_exp(dur, decay, 0.001)


# ---------------------------------------------------------------- sons ----

def thump():
    body = sweep_sine(95, 42, 0.32) * env_exp(0.32, 0.09)
    rubber = sweep_sine(180, 120, 0.2) * env_exp(0.2, 0.05) * 0.35
    click = lp(rng.standard_normal(int(0.012 * SR)), 1800) * np.linspace(1, 0, int(0.012 * SR))
    y = np.zeros(int(0.35 * SR))
    place(y, body, 0); place(y, rubber, 0); place(y, click * 0.6, 0)
    return norm(y)


def glup(semi=0.0):
    k = 2 ** (semi / 12)
    a = sweep_sine(260 * k, 620 * k, 0.045)
    b = sweep_sine(620 * k, 210 * k, 0.085)
    s = np.concatenate([a * np.linspace(0.3, 1, len(a)), b * np.exp(-np.arange(len(b)) / (0.035 * SR))])
    s = s + 0.25 * np.sign(s) * np.abs(s) ** 3  # leve "gordura"
    return norm(lp(s, 3000))


def boing(f0=150, dur=0.6, wob=13):
    t = t_(dur)
    f = f0 * 2 ** (t * 1.3) * (1 + 0.28 * np.sin(2 * np.pi * wob * t) * np.exp(-t * 3.5))
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = (np.sin(ph) + 0.3 * np.sin(2 * ph) + 0.12 * np.sin(3 * ph)) * env_exp(dur, dur * 0.45, 0.003)
    return norm(y)


def boing_small(semi=0.0):
    return boing(260 * 2 ** (semi / 12), 0.32, 18)


def alarm():
    y = np.zeros(int(0.62 * SR))
    for i, f in enumerate([1046, 784, 1046, 784]):
        t = t_(0.12)
        sq = np.tanh(4 * np.sin(2 * np.pi * f * t))
        place(y, lp(sq, 4000) * np.minimum(1, np.minimum(t / 0.005, (0.12 - t) / 0.01)), i * 0.145)
    return norm(y)


def whoosh(dur=0.45, f0=350, f1=3200, bw=0.55):
    return norm(noise_sweep(dur, f0, f1, bw))


def stamp():
    y = np.zeros(int(0.45 * SR))
    place(y, sweep_sine(110, 48, 0.3) * env_exp(0.3, 0.07), 0)
    burst = lp(rng.standard_normal(int(0.05 * SR)), 2500) * env_exp(0.05, 0.012)
    place(y, burst * 1.2, 0)
    slap = bp(rng.standard_normal(int(0.03 * SR)), 900, 4000) * env_exp(0.03, 0.006)
    place(y, slap * 0.9, 0.002)
    # pequena "batida dupla" de carimbo pesado
    place(y, sweep_sine(80, 45, 0.15) * env_exp(0.15, 0.04) * 0.35, 0.07)
    return norm(np.tanh(1.6 * y))


def pop(semi=0.0):
    k = 2 ** (semi / 12)
    s = sweep_sine(950 * k, 320 * k, 0.06) * env_exp(0.06, 0.018, 0.001)
    click = hp(rng.standard_normal(int(0.004 * SR)), 2000) * 0.35
    y = np.zeros(int(0.08 * SR)); place(y, s, 0); place(y, click, 0)
    return norm(y)


def sparkle(dur=0.7, n=9, lo=1800, hi=5200, spread=0.45):
    y = np.zeros(int(SR * dur))
    for i in range(n):
        f = lo * (hi / lo) ** (i / max(1, n - 1)) * (1 + rng.uniform(-0.03, 0.03))
        tone = np.sin(2 * np.pi * f * t_(0.3)) * env_exp(0.3, 0.07, 0.001)
        place(y, tone * rng.uniform(0.5, 1), spread * i / n)
    return y


def pop_magic():
    y = np.zeros(int(0.9 * SR))
    place(y, pop(-3) * 0.9, 0)
    place(y, sparkle(0.9, 10) * 0.45, 0.04)
    shimmer = noise_sweep(0.6, 3000, 9000, 0.35) * 0.12
    place(y, shimmer, 0.03)
    return norm(y)


def sininho():
    y = np.zeros(int(1.6 * SR))
    place(y, fm_bell(1568, 1.5, 3.5, 2.2, 0.5), 0)
    place(y, fm_bell(2093, 1.3, 3.5, 2.0, 0.45) * 0.7, 0.11)
    return norm(y)


def marker():
    dur = 0.36
    t = t_(dur)
    n = bp(rng.standard_normal(len(t)), 1800, 6500)
    am = 0.55 + 0.45 * np.sin(2 * np.pi * 22 * t + 2 * np.sin(2 * np.pi * 3 * t))
    squeak = np.sin(2 * np.pi * np.cumsum(2400 + 500 * t / dur) / SR) * 0.15
    e = np.minimum(1, t / 0.02) * np.minimum(1, (dur - t) / 0.06)
    return norm((n * am + squeak) * e)


def typing(count, every_frames, fps):
    step = every_frames / fps
    y = np.zeros(int(SR * (count * step + 0.2)))
    for i in range(count):
        c = hp(rng.standard_normal(int(0.006 * SR)), 2500) * np.linspace(1, 0, int(0.006 * SR))
        tok = np.sin(2 * np.pi * rng.uniform(1700, 2300) * t_(0.018)) * env_exp(0.018, 0.004) * 0.5
        k = np.zeros(int(0.03 * SR)); place(k, c, 0); place(k, tok, 0.001)
        place(y, k * rng.uniform(0.6, 1.0), i * step + rng.uniform(-0.006, 0.006))
    return norm(y, 0.8)


def tap():
    y = np.zeros(int(0.14 * SR))
    place(y, sweep_sine(520, 240, 0.07) * env_exp(0.07, 0.02), 0)
    place(y, hp(rng.standard_normal(int(0.005 * SR)), 3000) * 0.5, 0)
    return norm(y)


def plop(semi=0.0):
    k = 2 ** (semi / 12)
    s = sweep_sine(380 * k, 1350 * k, 0.05) * env_exp(0.05, 0.02, 0.001)
    tail = np.sin(2 * np.pi * 1350 * k * t_(0.06)) * env_exp(0.06, 0.012) * 0.4
    return norm(np.concatenate([s, tail]))


def pin_drop():
    y = np.zeros(int(0.7 * SR))
    whistle = sweep_sine(1500, 520, 0.3, "lin") * np.linspace(0.15, 0.6, int(0.3 * SR))
    place(y, whistle, 0)
    place(y, thump() * 0.9, 0.31)
    return norm(y)


def chime():
    y = np.zeros(int(1.8 * SR))
    for i, f in enumerate([1046.5, 1318.5, 1568.0, 2093.0]):
        place(y, fm_bell(f, 1.3, 3.5, 1.6, 0.42) * (0.8 + 0.1 * i), i * 0.075)
    return norm(y)


def confete():
    y = np.zeros(int(1.0 * SR))
    burst = hp(rng.standard_normal(int(0.03 * SR)), 900) * env_exp(0.03, 0.006)
    place(y, burst * 1.3, 0)
    for _ in range(46):
        c = hp(rng.standard_normal(int(0.003 * SR)), 3500) * rng.uniform(0.1, 0.5)
        place(y, c, 0.02 + rng.exponential(0.22))
    place(y, sparkle(0.9, 7, 2600, 6200, 0.6) * 0.25, 0.05)
    return norm(y)


def fwip():
    dur = 0.32
    w = noise_sweep(dur, 500, 4200, 0.6)
    t = t_(len(w) / SR)
    flutter = 0.6 + 0.4 * np.sin(2 * np.pi * 34 * t)
    return norm(w * flutter)


def bell():
    """Sininho de lembrete: 'tlin-tlin'."""
    y = np.zeros(int(1.4 * SR))
    for i in range(2):
        b = fm_bell(1760, 1.2, 2.0, 2.4, 0.38)
        t = t_(len(b) / SR)
        b *= 1 + 0.08 * np.sin(2 * np.pi * 6 * t)
        place(y, b * (1.0 if i == 0 else 0.8), i * 0.14)
    return norm(y)


def sting():
    """Brilho final do end card (o acorde do sting está na trilha)."""
    y = np.zeros(int(1.4 * SR))
    place(y, sparkle(1.2, 12, 1500, 6800, 0.35) * 0.6, 0)
    place(y, noise_sweep(0.9, 2500, 10000, 0.3) * 0.15, 0)
    return norm(y)


# ------------------------------------------------------- sons do Vídeo 2 ----

def stamp_light():
    """Estalo de carimbo leve (chip PRÉVIA)."""
    y = np.zeros(int(0.3 * SR))
    place(y, sweep_sine(170, 70, 0.12) * env_exp(0.12, 0.03), 0)
    place(y, bp(rng.standard_normal(int(0.025 * SR)), 1200, 6000) * env_exp(0.025, 0.005) * 1.1, 0)
    return norm(np.tanh(1.4 * y))


def whistle_drop(dur=0.5):
    """Assobio de queda (cartoon)."""
    t = t_(dur)
    f = 1900 * (420 / 1900) ** (t / dur) * (1 + 0.012 * np.sin(2 * np.pi * 7 * t))
    e = np.minimum(1, t / 0.04) * np.minimum(1, (dur - t) / 0.05)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * e * (0.6 + 0.4 * t / dur))


def plim():
    y = np.zeros(int(1.0 * SR))
    place(y, fm_bell(2349.3, 0.9, 2.0, 1.6, 0.35), 0)
    return norm(y)


def ding():
    y = np.zeros(int(1.2 * SR))
    place(y, fm_bell(1760, 1.1, 3.5, 2.0, 0.45), 0)
    place(y, fm_bell(2637, 0.9, 3.5, 1.4, 0.3) * 0.4, 0.004)
    return norm(y)


def shuffle(n=5, gap=0.07):
    """Cartas descendo/embaralhando: 'frrt' de papel em sequência."""
    y = np.zeros(int((n * gap + 0.2) * SR))
    for i in range(n):
        flick = bp(rng.standard_normal(int(0.05 * SR)), 1500, 7000) * env_exp(0.05, 0.012)
        thwp = sweep_sine(300, 140, 0.04) * env_exp(0.04, 0.01) * 0.4
        k = np.zeros(int(0.06 * SR)); place(k, flick, 0); place(k, thwp, 0.005)
        place(y, k * rng.uniform(0.7, 1.0), i * gap + rng.uniform(0, 0.008))
    return norm(y)


def _brass(freqs, dur):
    t = t_(dur)
    out = np.zeros(len(t))
    for f in freqs:
        for det in (-0.004, 0.004):
            out += 2 * ((f * (1 + det) * t) % 1) - 1
    env = np.minimum(1, t / 0.02) * np.minimum(1, (dur - t) / 0.08) * np.exp(-t * 1.2)
    return lp(out, 2600) * env


def tada():
    """'Tchanan!' — dois acordes de metal sintético + brilho."""
    y = np.zeros(int(1.4 * SR))
    place(y, _brass([523.25, 659.25, 783.99], 0.16) * 0.8, 0)
    place(y, _brass([523.25, 659.25, 783.99, 1046.5], 0.9), 0.19)
    place(y, sparkle(0.9, 8, 2000, 6000, 0.4) * 0.25, 0.2)
    return norm(y)


def tick():
    y = np.zeros(int(0.12 * SR))
    place(y, np.sin(2 * np.pi * 2600 * t_(0.03)) * env_exp(0.03, 0.006), 0)
    place(y, hp(rng.standard_normal(int(0.004 * SR)), 3000) * 0.4, 0)
    return norm(y)


def motor(dur=1.8):
    """Motorzinho cartoon (putt-putt) acelerando de leve."""
    t = t_(dur)
    puff = 0.5 + 0.5 * np.sign(np.sin(2 * np.pi * np.cumsum(18 + 10 * t / dur) / SR))
    f = 85 + 25 * t / dur
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.5 * np.sign(np.sin(2 * np.pi * np.cumsum(2 * f) / SR))
    y = lp(body * (0.4 + 0.6 * puff), 900) + bp(rng.standard_normal(len(t)), 300, 1500) * puff * 0.15
    e = np.minimum(1, t / 0.1) * np.minimum(1, (dur - t) / 0.25)
    return norm(y * e)


def doorbell():
    """Campainha 'plim-plom'."""
    y = np.zeros(int(1.6 * SR))
    place(y, fm_bell(1318.5, 1.0, 2.0, 1.2, 0.45), 0)
    place(y, fm_bell(1046.5, 1.2, 2.0, 1.2, 0.5), 0.32)
    return norm(y)


# ------------------------------------------------------- sons do Vídeo 3 ----

def inflate(dur=1.3):
    """'Fuuu' de balão enchendo: sopro filtrado subindo + tom de borracha."""
    w = noise_sweep(dur, 300, 2600, 0.45, shape=lambda p: np.clip(p, 0, 1) ** 0.8 * np.minimum(1, (1 - p) * 12))
    t = t_(len(w) / SR)
    squeak = np.sin(2 * np.pi * np.cumsum(220 + 500 * (t / dur) ** 1.5) / SR) * 0.12 * np.minimum(1, t / 0.3)
    return norm(w + squeak * np.minimum(1, (dur - t) / 0.1))


def balloon_pop():
    y = np.zeros(int(0.5 * SR))
    place(y, hp(rng.standard_normal(int(0.04 * SR)), 600) * env_exp(0.04, 0.008) * 1.4, 0)
    place(y, sweep_sine(700, 120, 0.12) * env_exp(0.12, 0.03), 0)
    place(y, lp(rng.standard_normal(int(0.25 * SR)), 1800) * env_exp(0.25, 0.06) * 0.4, 0.004)
    return norm(np.tanh(1.5 * y))


def clock_tick(dur=2.6, rate=4.0):
    """Tic-tac de relógio cartoon (alterna tom agudo/grave)."""
    y = np.zeros(int(dur * SR))
    for i in range(int(dur * rate)):
        f = 2400 if i % 2 == 0 else 1700
        k = np.sin(2 * np.pi * f * t_(0.025)) * env_exp(0.025, 0.005)
        k += hp(rng.standard_normal(len(k)), 3000) * env_exp(0.025, 0.002) * 0.4
        place(y, k * (0.9 if i % 2 == 0 else 0.75), i / rate)
    return norm(y)


def hmm(up=True):
    """'Hmm?' cartoon sem voz humana: zumbido de kazoo com a altura subindo no fim."""
    dur = 0.55
    t = t_(dur)
    f = 260 * (1 + (0.45 if up else -0.2) * np.clip((t - 0.25) / 0.3, 0, 1) ** 2) * (1 + 0.02 * np.sin(2 * np.pi * 6 * t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    buzz = np.tanh(3 * np.sin(ph)) + 0.4 * np.sin(2 * ph)
    y = bp(buzz, 300, 2600) * np.minimum(1, t / 0.04) * np.minimum(1, (dur - t) / 0.08)
    return norm(y)


def cheer():
    """Mini-comemoração: 'tirilim' de sininhos subindo."""
    y = np.zeros(int(0.9 * SR))
    for i, f in enumerate([1318.5, 1568.0, 2093.0]):
        place(y, fm_bell(f, 0.6, 3.5, 1.3, 0.25) * (0.7 + 0.15 * i), i * 0.06)
    return norm(y)


def slide_whistle(dur=0.6):
    """'Fiuuu': apito de êmbolo subindo e descendo (etiqueta voando em arco)."""
    t = t_(dur)
    f = 700 + 900 * np.sin(np.pi * t / dur) ** 0.8
    y = np.sin(2 * np.pi * np.cumsum(f * (1 + 0.01 * np.sin(2 * np.pi * 9 * t))) / SR)
    y += bp(rng.standard_normal(len(t)), 1500, 5000) * 0.05
    return norm(y * np.minimum(1, t / 0.03) * np.minimum(1, (dur - t) / 0.08))


def notif():
    """Notificação: 'dlin-dlin' brilhante."""
    y = np.zeros(int(1.0 * SR))
    place(y, fm_bell(1760, 0.7, 2.0, 1.6, 0.3), 0)
    place(y, fm_bell(2637, 0.8, 2.0, 1.4, 0.32), 0.09)
    return norm(y)


# ------------------------------------------------------- sons do Vídeo 4 ----

def lupa_spin(dur=1.6):
    """'Fuuun' da lupa girando: sopro que ondula (giro) e sobe de leve."""
    t = t_(dur)
    w = noise_sweep(dur, 500, 1500, 0.4, shape=lambda p: np.clip(p * 4, 0, 1) * np.clip((1 - p) * 5, 0, 1))
    w = w[: len(t)] * (0.55 + 0.45 * np.sin(2 * np.pi * 3.2 * t[: len(w)]))
    hum = np.sin(2 * np.pi * np.cumsum(330 + 60 * np.sin(2 * np.pi * 3.2 * t) + 80 * t / dur) / SR) * 0.08
    y = np.zeros(len(t)); y[: len(w)] += w; y += hum * np.minimum(1, t / 0.15) * np.minimum(1, (dur - t) / 0.2)
    return norm(y)


def sad_plim():
    """'Plim' triste e desafinado: duas notas que batem entre si e caem, abafadas."""
    dur = 1.1
    t = t_(dur)
    bend = 1 - 0.07 * np.clip(t / 0.6, 0, 1)
    y = sum(np.sin(2 * np.pi * np.cumsum(f * bend) / SR) for f in (880.0, 905.0, 587.3))
    return norm(lp(y * env_exp(dur, 0.32, 0.002), 2200))


def droop(dur=0.7):
    """Toldo murchando: assobio descendo com vibrato ('fiuuuu…')."""
    t = t_(dur)
    f = 760 * (260 / 760) ** (t / dur) * (1 + 0.03 * np.sin(2 * np.pi * 6 * t))
    e = np.minimum(1, t / 0.03) * np.minimum(1, (dur - t) / 0.12)
    return norm(lp(np.sin(2 * np.pi * np.cumsum(f) / SR), 2500) * e)


def check():
    """Check se desenhando: 'tic-tic' subindo."""
    y = np.zeros(int(0.25 * SR))
    place(y, sweep_sine(1100, 1500, 0.04) * env_exp(0.04, 0.012), 0)
    place(y, sweep_sine(1500, 2300, 0.06) * env_exp(0.06, 0.02), 0.06)
    return norm(y)


def step():
    """Passinho 'tuc' (bloco de madeira)."""
    y = np.zeros(int(0.12 * SR))
    place(y, np.sin(2 * np.pi * 820 * t_(0.05)) * env_exp(0.05, 0.012, 0.0005), 0)
    place(y, bp(rng.standard_normal(int(0.01 * SR)), 1500, 5000) * 0.3, 0)
    return norm(y)


def rocket(dur=0.9):
    """'Fiuuu' do foguetinho subindo + chiado."""
    t = t_(dur)
    f = 420 * (2600 / 420) ** (t / dur)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.6
    fizz = bp(rng.standard_normal(len(t)), 2500, 9000) * 0.35
    e = np.minimum(1, t / 0.05) * np.minimum(1, (dur - t) / 0.15)
    return norm((tone + fizz) * e)


def switch_on():
    """Holofote ligando: clack + zumbido curto."""
    y = np.zeros(int(0.6 * SR))
    place(y, hp(rng.standard_normal(int(0.008 * SR)), 1800) * env_exp(0.008, 0.002), 0)
    place(y, sweep_sine(220, 160, 0.06) * env_exp(0.06, 0.015) * 0.6, 0)
    place(y, np.sin(2 * np.pi * 120 * t_(0.45)) * env_exp(0.45, 0.2) * 0.2, 0.03)
    return norm(y)


def build():
    tl = load_timeline()
    out = BUILD / "sfx"
    type_every = tl["beats"].get("s4", {}).get("typeEvery", 2)
    url = "uaipertim.com.br"
    bank = {
        "thump": thump(), "glup": glup(), "boing": boing(), "boing_small": boing_small(),
        "alarm": alarm(), "whoosh": whoosh(), "whoosh_down": whoosh(0.4, 3000, 500, 0.5),
        "whoosh_up": whoosh(0.42, 300, 3800), "whoosh_out": whoosh(0.6, 1800, 300, 0.7),
        "whoosh_zoom": whoosh(0.55, 250, 5000, 0.5), "stamp": stamp(), "pop": pop(),
        "pop_magic": pop_magic(), "sininho": sininho(), "marker": marker(),
        "typing": typing(tl.get("typingSfx", {}).get("count", len(url)), tl.get("typingSfx", {}).get("every", type_every), tl["fps"]), "tap": tap(), "plop": plop(),
        "pin_drop": pin_drop(), "chime": chime(), "confete": confete(), "fwip": fwip(),
        "bell": bell(), "sting": sting(),
    }
    # variações de altura para sons repetidos (marcados com "vary" na timeline)
    for semi in (-3, -1, 2, 4, 5, 7):
        bank[f"glup@{semi}"] = glup(semi)
        bank[f"pop@{semi}"] = pop(semi)
        bank[f"plop@{semi}"] = plop(semi)
        bank[f"boing_small@{semi}"] = boing_small(semi)
    # sons do Vídeo 2 (gerados por último para não mudar o sorteio dos sons do Vídeo 1)
    bank.update({
        "stamp_light": stamp_light(), "whistle_drop": whistle_drop(), "plim": plim(), "ding": ding(),
        "shuffle": shuffle(), "tada": tada(), "tick": tick(), "motor": motor(), "doorbell": doorbell(),
    })
    # sons do Vídeo 3 (gerados por último para não mudar o sorteio dos sons anteriores)
    bank.update({
        "inflate": inflate(), "balloon_pop": balloon_pop(), "hmm": hmm(),
        # tic-tac em colcheias da trilha, durando os 2 compassos de suspense
        "clock_tick": clock_tick(8 * 60 / tl.get("music", {}).get("bpm", 124), tl.get("music", {}).get("bpm", 124) / 30),
        "hmm_down": hmm(False), "cheer": cheer(), "slide_whistle": slide_whistle(), "notif": notif(),
    })
    # sons do Vídeo 4 (idem: por último)
    bank.update({
        "lupa_spin": lupa_spin(), "sad_plim": sad_plim(), "droop": droop(), "check": check(), "step": step(),
        "rocket": rocket(), "switch_on": switch_on(), "brilho": norm(sparkle(1.3, 14, 2400, 7200, 0.6)),
    })
    for semi in (2, 4, 5, 7, 9, 12):  # plim subindo de tom a cada balão
        p = bank["plim"]
        bank[f"plim@{semi}"] = np.interp(np.arange(0, len(p), 2 ** (semi / 12)), np.arange(len(p)), p).astype(np.float32)
    base = bank["tick"]
    for semi in (2, 4, 7):  # tics subindo a cada etapa da linha do tempo
        bank[f"tick@{semi}"] = np.interp(np.arange(0, len(base), 2 ** (semi / 12)), np.arange(len(base)), base).astype(np.float32)
    for name, x in bank.items():
        write(out / f"{name}.wav", x)
    print(f"sfx: {len(bank)} arquivos em {out}")


if __name__ == "__main__":
    build()
