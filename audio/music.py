"""Trilha pop/folk saltitante 124 bpm (ukulele + claps + marimba + sininhos).

Compõe em MIDI (mido) seguindo music.chords/sections da timeline, renderiza cada
instrumento com FluidSynth + soundfont GM (FluidR3) e soma os stems.
Estrutura: intro que sobe (cenas 1–2) → respiro de ~1s no swipe da cena 3 →
groove A → groove B → pico no CTA → acorde final/sting no end card.
"""
import shutil
import subprocess

import mido
import numpy as np

from common import BUILD, SR, db, fade, load_timeline, read, to_sr, write

SOUNDFONT = "/usr/share/sounds/sf2/FluidR3_GM.sf2"
TPB = 480  # ticks por semínima
E8 = TPB // 2  # colcheia
SWING = 0.07  # leve swing nas colcheias de contratempo ("pulinho")

# Ukulele (afinação GCEA reentrante) — voicings de cima pra baixo (corda G primeiro)
UKE = {"C": [67, 60, 64, 72], "G": [67, 62, 67, 71], "Am": [69, 60, 64, 69], "F": [69, 60, 65, 69]}
ROOT = {"C": 36, "G": 43, "Am": 45, "F": 41}
FIFTH = {"C": 43, "G": 50, "Am": 52, "F": 48}
CHORD_TONES = {"C": [72, 76, 79], "G": [71, 74, 79], "Am": [72, 76, 81], "F": [72, 77, 81]}
# Melodia (marimba) em colcheias; None = pausa
HOOK = {
    "C": [76, None, 79, 76, None, 81, 79, None],
    "G": [74, None, 71, 74, None, 79, None, None],
    "Am": [72, None, 76, 72, None, 81, 79, 76],
    "F": [77, None, 81, None, 79, 77, 76, 74],
}
HOOK_FINAL_G = [74, None, 79, None, 83, None, None, None]  # compasso 12, abre espaço pro sting

GM = {"uke": 24, "marimba": 12, "glock": 9, "celesta": 8, "musicbox": 10, "bass": 32, "pad": 49}
KICK, CLAP, HAT, TAMB, SHAKER, CRASH, TRI, SPLASH = 36, 39, 42, 54, 70, 49, 81, 55


class Track:
    def __init__(self, program=None, drums=False):
        self.events = []  # (tick, on/off, note, vel)
        self.program = program
        self.ch = 9 if drums else 0

    def note(self, tick, note, vel, dur):
        vel = int(np.clip(vel, 1, 127))
        self.events.append((int(tick), 1, note, vel))
        self.events.append((int(tick + max(10, dur)), 0, note, 0))

    def save(self, path, bpm):
        mid = mido.MidiFile(ticks_per_beat=TPB)
        tr = mido.MidiTrack(); mid.tracks.append(tr)
        tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(bpm), time=0))
        if self.program is not None:
            tr.append(mido.Message("program_change", program=self.program, channel=self.ch, time=0))
        tr.append(mido.Message("control_change", control=91, value=38, channel=self.ch, time=0))  # reverb
        last = 0
        for tick, on, note, vel in sorted(self.events, key=lambda e: (e[0], e[1])):
            msg = "note_on" if on else "note_off"
            tr.append(mido.Message(msg, note=note, velocity=vel, channel=self.ch, time=tick - last))
            last = tick
        tr.append(mido.MetaMessage("end_of_track", time=TPB * 8))
        mid.save(path)


def slot_tick(bar, slot):
    """Tick da colcheia `slot` (0..7) no compasso `bar`, com swing nos contratempos."""
    t = bar * 4 * TPB + slot * E8
    if slot % 2 == 1:
        t += int(SWING * TPB)
    return t


def compose(tl):
    m = tl["music"]
    chords = m["chords"]
    sec = m["sections"]
    breaks = set(m.get("breakBars", []))  # compassos com "breque" no fim (tempo 3.5)
    double_claps = set(m.get("doubleClapBars", []))  # palmas em todas as colcheias ("acelera")
    rng = np.random.default_rng(3)

    def in_sec(bar, name):
        if name not in sec:
            return False
        a, b = sec[name]
        return a <= bar <= b

    uke, bass, mar, glock = Track(GM["uke"]), Track(GM["bass"]), Track(GM["marimba"]), Track(GM["glock"])
    pad, cel, drums = Track(GM["pad"]), Track(GM["celesta"]), Track(drums=True)
    hum = lambda: rng.integers(-6, 7)

    def strum(tick, ch, vel, down=True, dur=E8, strings=4):
        notes = UKE[ch] if down else list(reversed(UKE[ch]))[:strings]
        gap = 14 if down else 10
        for i, n in enumerate(notes[:strings] if down else notes):
            uke.note(tick + i * gap, n, vel - i * 3, dur)

    n_bars = len(chords)
    for bar, ch in enumerate(chords):
        final = in_sec(bar, "final")
        respiro = in_sec(bar, "respiro")
        intro = in_sec(bar, "intro")
        peak = in_sec(bar, "peak")
        grooveB = in_sec(bar, "grooveB")
        energy = 0.62 + 0.08 * bar if intro else 0.8 if in_sec(bar, "grooveA") else 0.9 if grooveB else 1.0
        bar0 = bar * 4 * TPB

        if final:  # sting: "Uai-Per-TIM!" resolve no acorde final
            strum(bar0, "C", 112, True, TPB * 6)
            for n in (60, 64, 67, 72):
                mar.note(bar0, n + 12, 100, TPB * 4)
            for n in (96, 100):
                glock.note(bar0, n, 110, TPB * 4)
            cel.note(bar0, 84, 90, TPB * 4); cel.note(bar0 + 40, 91, 80, TPB * 4)
            bass.note(bar0, ROOT["C"], 112, TPB * 4)
            pad.note(bar0, 60, 70, TPB * 4); pad.note(bar0, 64, 66, TPB * 4); pad.note(bar0, 67, 66, TPB * 4)
            drums.note(bar0, KICK, 118, 120); drums.note(bar0, CRASH, 96, 400)
            drums.note(bar0, TRI, 80, 400); drums.note(bar0, CLAP, 100, 100)
            continue

        if in_sec(bar, "suspense"):
            # suspense: só ukulele, baixinho e espaçado (o tic-tac vem dos efeitos)
            for slot, down, v in ((0, True, 64), (4, True, 52), (6, False, 40)):
                strum(slot_tick(bar, slot), ch, v + hum(), down, E8 * (3 if down else 1), 4 if down else 2)
            continue

        if respiro:
            # tempos 1–2: só um colchão suave (respiro do "Calma!")
            for n in (53, 57, 60, 65):
                pad.note(bar0, n, 58, TPB * 3)
            for i, n in enumerate((77, 81, 84)):
                cel.note(bar0 + i * E8 * 2 + 60, n, 52, TPB * 2)
            # tempos 3–4: volta com palmas em colcheia e glock subindo
            for s in range(4, 8):
                drums.note(slot_tick(bar, s), CLAP, 70 + (s - 4) * 12, 60)
            for i, n in enumerate((84, 88, 91, 96, 100)):
                glock.note(bar0 + 2 * TPB + i * (TPB // 2.5), n, 70 + i * 8, TPB)
            bass.note(slot_tick(bar, 6), FIFTH["F"], 80, E8); bass.note(slot_tick(bar, 7), 40, 90, E8)
            drums.note(slot_tick(bar, 7), KICK, 70, 60)
            continue

        # ---- ukulele (island strum: D . D U . U D U) ----
        pattern = [(0, True, 1.0), (2, True, 0.85), (3, False, 0.7), (5, False, 0.75), (6, True, 0.85), (7, False, 0.7)]
        for slot, down, acc in pattern:
            if bar in breaks and slot >= 6:  # "breque" antes do swipe
                continue
            v = (76 + 30 * energy) * acc + hum()
            strum(slot_tick(bar, slot), ch, v, down, E8 + 30, 4 if down else 3)
        if peak:  # pico: chuck extra em semicolcheias no fim do compasso
            for k in range(2):
                strum(slot_tick(bar, 7) + 60 + k * 60, ch, 70, False, 50, 2)

        # ---- baixo ----
        if bar >= 1:
            for slot, note, v in [(0, ROOT[ch], 100), (3, ROOT[ch], 72), (4, FIFTH[ch], 92), (7, ROOT[ch] + 12, 66)]:
                if bar in breaks and slot == 7:
                    continue
                bass.note(slot_tick(bar, slot), note, v * (0.8 + 0.25 * energy) + hum(), E8 * (2 if slot in (0, 4) else 1))

        # ---- marimba (melodia) ----
        if bar >= 1:
            hook = HOOK_FINAL_G if bar == n_bars - 2 else HOOK[ch]
            for slot, n in enumerate(hook):
                if n is None or (bar in breaks and slot >= 6):
                    continue
                v = 78 + 30 * energy + hum()
                mar.note(slot_tick(bar, slot), n, v, E8 + 40)
                if peak:
                    mar.note(slot_tick(bar, slot), n - 12, v - 20, E8 + 40)

        # ---- sininhos (glock): contracanto a partir do groove B; melodia dobrada no pico ----
        if grooveB or peak:
            tones = CHORD_TONES[ch]
            for k, slot in enumerate((1, 3, 5, 7)):
                glock.note(slot_tick(bar, slot), tones[k % 3] + 12, 62 + 10 * energy + hum(), E8)
        if peak and bar != n_bars - 2:
            for slot, n in enumerate(HOOK[ch]):
                if n is not None:
                    glock.note(slot_tick(bar, slot) + 4, n + 12, 70, E8)
        if bar == n_bars - 2:  # pickup do sting nos tempos 3–4: "Uai-Per-"
            glock.note(slot_tick(bar, 5), 88, 104, E8)
            glock.note(slot_tick(bar, 6), 91, 110, E8)
            cel.note(slot_tick(bar, 6), 91, 80, E8)

        # ---- percussão ----
        for beat in range(4):
            t = bar0 + beat * TPB
            if beat in (1, 3):
                drums.note(t, CLAP, 82 + 30 * energy + hum(), 80)
            if bar >= 2 and beat in (0, 2):
                drums.note(t, KICK, 70 + 40 * energy + hum(), 80)
            if peak and bar == n_bars - 2 and beat == 3:
                drums.note(t + E8, CLAP, 100, 60)
        if bar in double_claps:
            for slot in range(8):
                drums.note(slot_tick(bar, slot), CLAP, 70 + 10 * (slot % 2 == 0) + 12 * (slot / 8) + hum(), 50)
        for slot in range(8):
            if bar in breaks and slot >= 6:
                continue
            drums.note(slot_tick(bar, slot), SHAKER, (44 if slot % 2 == 0 else 62) + 20 * energy + hum(), 40)
            if (grooveB or peak) and slot % 2 == 1:
                drums.note(slot_tick(bar, slot), TAMB, 52 + 22 * energy + hum(), 50)
        if peak:
            for s16 in range(16):
                drums.note(bar0 + s16 * TPB // 4, HAT, 40 + (12 if s16 % 4 == 2 else 0) + hum(), 30)
        if bar in (sec.get("grooveA", [-1])[0], sec.get("peak", [-1])[0]):
            drums.note(bar0, CRASH if bar == sec.get("peak", [-1])[0] else SPLASH, 84, 300)
        if bar in breaks:  # breque: "ta-dã" seco no tempo 3.5
            drums.note(slot_tick(bar, 5), KICK, 104, 80); drums.note(slot_tick(bar, 5), CLAP, 104, 80)

    # acentos ("degraus") em frames absolutos — ex.: badges 1-2-3 do Vídeo 2.
    # Stab de marimba no acorde da hora + sininho que sobe um degrau a cada acento.
    beat_s = 60.0 / m["bpm"]
    q = TPB // 4  # quantiza em semicolcheia
    for i, fr in enumerate(m.get("accents", [])):
        tick = int(round((fr / tl["fps"] - m["offsetSeconds"]) / beat_s * TPB / q)) * q
        ch = chords[min(n_bars - 1, max(0, tick // (4 * TPB)))]
        for n in CHORD_TONES[ch]:
            mar.note(tick, n + 12, 120, TPB)
            mar.note(tick, n, 106, TPB)
        top = (84, 88, 91, 96)[i % 4] + 12
        glock.note(tick, top, 120, TPB * 2)
        cel.note(tick, top - 12, 100, TPB * 2)
        drums.note(tick, KICK, 120, 80)
        drums.note(tick, CLAP, 110, 80)
        drums.note(tick, SPLASH, 96, 300)

    return {"uke": uke, "bass": bass, "marimba": mar, "glock": glock, "pad": pad, "celesta": cel, "drums": drums}


STEM_GAIN_DB = {"uke": -1.0, "bass": -3.0, "marimba": -2.0, "glock": -9.0, "pad": -8.0, "celesta": -6.0, "drums": -3.5}


def main():
    tl = load_timeline()
    if not shutil.which("fluidsynth"):
        raise SystemExit("fluidsynth não encontrado: apt-get install fluidsynth fluid-soundfont-gm")
    out = BUILD / "music"
    out.mkdir(parents=True, exist_ok=True)
    total = int(SR * tl["durationInFrames"] / tl["fps"])
    offset = int(SR * tl["music"]["offsetSeconds"])
    skip = max(0, -offset)  # offset negativo: a música começa no meio do compasso 0
    offset = max(0, offset)
    mix = np.zeros((total, 2), np.float32)
    for name, track in compose(tl).items():
        mid, wav = out / f"{name}.mid", out / f"{name}.wav"
        track.save(str(mid), tl["music"]["bpm"])
        subprocess.run(["fluidsynth", "-ni", "-q", "-g", "0.45", "-r", str(SR), "-F", str(wav), SOUNDFONT, str(mid)],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        x, sr = read(wav)
        if x.ndim == 1:
            x = np.stack([x, x], 1)
        x = np.stack([to_sr(x[:, 0], sr), to_sr(x[:, 1], sr)], 1)
        x = x[skip:]
        n = min(len(x), total - offset)
        mix[offset:offset + n] += x[:n] * db(STEM_GAIN_DB[name])
    # cauda: fade suave nos últimos 0.35s
    nf = int(0.35 * SR)
    mix[-nf:] *= np.linspace(1, 0, nf)[:, None] ** 1.5
    mix /= np.abs(mix).max() + 1e-9
    mix *= 0.9
    write(BUILD / "music.wav", mix)
    print(f"trilha: {total / SR:.2f}s → {BUILD / 'music.wav'}")


if __name__ == "__main__":
    main()
