"""Mix final: locução + SFX nos beats da timeline + trilha com ducking e automação.

Saída: public/audio/mix.wav (48 kHz estéreo, -14 LUFS, pico ≤ -1 dBFS), usado pelo
Remotion e embutido no MP4.
"""
import json

import numpy as np
import pyloudnorm as pyln

from common import BUILD, PUBLIC_AUDIO, SR, beat_frames, db, load_timeline, read, to_sr, write

TARGET_LUFS = -14.0
VO_GAIN_DB = 0.0
MUSIC_GAIN_DB = -9.0
SFX_GAIN_DB = -4.0
VARIANTS = [0, 4, -1, 7, 2, 5, -3]


def one_pole(x, attack, release, rate=SR):
    a_up = np.exp(-1.0 / (attack * rate))
    a_dn = np.exp(-1.0 / (release * rate))
    y = np.zeros_like(x)
    s = 0.0
    for i, v in enumerate(x):
        a = a_up if v > s else a_dn
        s = a * s + (1 - a) * v
        y[i] = s
    return y


def section_curve(tl, n):
    """Automação da trilha por seção (sobe nas cenas 1–2, respiro, pico no CTA)."""
    m = tl["music"]
    bar = 4 * 60.0 / m["bpm"]
    off = m["offsetSeconds"]
    level = {"intro": -2.5, "respiro": 0.0, "grooveA": -1.0, "grooveB": 0.0, "peak": 2.5, "final": 3.0}
    pts_t, pts_v = [], []
    for name, (a, b) in sorted(m["sections"].items(), key=lambda kv: kv[1][0]):
        pts_t += [off + a * bar, off + (b + 1) * bar - 0.05]
        pts_v += [level[name], level[name]]
    t = np.arange(n) / SR
    curve = np.interp(t, pts_t, pts_v)
    # intro cresce do começo ao fim das cenas 1–2
    a, b = m["sections"]["intro"]
    t0, t1 = off + a * bar, off + (b + 1) * bar
    ramp = (t >= t0) & (t < t1)
    curve[ramp] += np.interp(t[ramp], [t0, t1], [-2.5, 2.0])
    # "Uai…" quase solo: a trilha entra logo depois da primeira palavra
    hold = m.get("introHoldSeconds", 0)
    if hold:
        curve += np.interp(t, [0, hold, hold + 0.25], [-18, -18, 0])
    return db(curve)


def main():
    tl = load_timeline()
    fps = tl["fps"]
    n = int(SR * tl["durationInFrames"] / fps)
    vo = np.zeros(n, np.float32)
    sfx = np.zeros((n, 2), np.float32)
    rng = np.random.default_rng(11)

    # --- locução ---
    for item in tl["narration"]["items"]:
        x, sr = read(BUILD / "vo" / f"{item['id']}.wav")
        x = to_sr(x, sr)
        i = int(item["from"] / fps * SR)
        k = min(len(x), n - i)
        vo[i:i + k] += x[:k] * db(VO_GAIN_DB)

    # --- efeitos ---
    for cue in tl["sfx"]:
        frames = beat_frames(tl, cue["scene"], cue["at"])
        for j, f in enumerate(frames):
            name = cue["sound"]
            if cue.get("vary") and VARIANTS[j % len(VARIANTS)] != 0:
                name = f"{name}@{VARIANTS[j % len(VARIANTS)]}"
            x, sr = read(BUILD / "sfx" / f"{name}.wav")
            x = to_sr(x, sr) * db(cue.get("gain", 0) + SFX_GAIN_DB)
            pan = cue.get("pan", rng.uniform(-0.35, 0.35))
            l, r = np.sqrt(0.5 * (1 - pan)), np.sqrt(0.5 * (1 + pan))
            i = int(max(0, f) / fps * SR)
            k = min(len(x), n - i)
            if k > 0:
                sfx[i:i + k, 0] += x[:k] * l * 1.414
                sfx[i:i + k, 1] += x[:k] * r * 1.414

    # --- trilha com ducking guiado pela voz ---
    music, sr = read(BUILD / "music.wav")
    music = np.stack([to_sr(music[:, 0], sr), to_sr(music[:, 1], sr)], 1)[:n]
    if len(music) < n:
        music = np.pad(music, ((0, n - len(music)), (0, 0)))
    win = int(0.02 * SR)
    env = np.sqrt(np.convolve(vo ** 2, np.ones(win) / win, mode="same"))
    active = (env > db(-38) * np.abs(vo).max()).astype(np.float32)
    # segura o ducking entre palavras de uma mesma frase
    hold = int(0.18 * SR)
    active = np.convolve(active, np.ones(hold), mode="same") > 0
    m = tl["music"]
    D = 48  # envelope calculado a 1 kHz
    duck_env = one_pole(active[::D].astype(np.float32), m["duckAttack"], m["duckRelease"], SR / D)
    duck_env = np.interp(np.arange(n), np.arange(0, n, D)[:len(duck_env)], duck_env)
    duck_gain = 1 - (1 - db(m["duckDb"])) * duck_env
    music *= (duck_gain * section_curve(tl, n) * db(MUSIC_GAIN_DB))[:, None]

    mix = music + sfx + vo[:, None]

    # --- master: normaliza loudness e limita picos ---
    meter = pyln.Meter(SR)
    lufs = meter.integrated_loudness(mix)
    mix *= db(TARGET_LUFS - lufs)
    ceiling = db(-1.5)
    D = 16
    pk = np.abs(mix).max(1)
    pk = np.pad(pk, (0, (-len(pk)) % D)).reshape(-1, D).max(1)
    pk = np.maximum(pk, np.roll(pk, -1))  # pequeno lookahead
    peak_env = one_pole(pk, 0.0005, 0.08, SR / D)
    peak_env = np.interp(np.arange(n), np.arange(0, n, D)[:len(peak_env)] + D // 2, peak_env)
    gain = np.minimum(1.0, ceiling / np.maximum(peak_env, 1e-9))
    mix *= gain[:, None]
    mix = np.clip(mix, -ceiling, ceiling)
    final_lufs = meter.integrated_loudness(mix)

    write(PUBLIC_AUDIO / "mix.wav", mix.astype(np.float32))
    report = {"lufs": round(float(final_lufs), 2), "peak_dbfs": round(float(20 * np.log10(np.abs(mix).max())), 2),
              "seconds": n / SR}
    with open(BUILD / "mix_report.json", "w") as f:
        json.dump(report, f, indent=2)
    print(f"mix: {report}")


if __name__ == "__main__":
    main()
