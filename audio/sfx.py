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


def build():
    tl = load_timeline()
    out = BUILD / "sfx"
    s4 = tl["beats"]["s4"]
    url = "uaipertim.com.br"
    bank = {
        "thump": thump(), "glup": glup(), "boing": boing(), "boing_small": boing_small(),
        "alarm": alarm(), "whoosh": whoosh(), "whoosh_down": whoosh(0.4, 3000, 500, 0.5),
        "whoosh_up": whoosh(0.42, 300, 3800), "whoosh_out": whoosh(0.6, 1800, 300, 0.7),
        "whoosh_zoom": whoosh(0.55, 250, 5000, 0.5), "stamp": stamp(), "pop": pop(),
        "pop_magic": pop_magic(), "sininho": sininho(), "marker": marker(),
        "typing": typing(len(url), s4["typeEvery"], tl["fps"]), "tap": tap(), "plop": plop(),
        "pin_drop": pin_drop(), "chime": chime(), "confete": confete(), "fwip": fwip(),
        "bell": bell(), "sting": sting(),
    }
    # variações de altura para sons repetidos (marcados com "vary" na timeline)
    for semi in (-3, -1, 2, 4, 5, 7):
        bank[f"glup@{semi}"] = glup(semi)
        bank[f"pop@{semi}"] = pop(semi)
        bank[f"plop@{semi}"] = plop(semi)
        bank[f"boing_small@{semi}"] = boing_small(semi)
    for name, x in bank.items():
        write(out / f"{name}.wav", x)
    print(f"sfx: {len(bank)} arquivos em {out}")


if __name__ == "__main__":
    build()
