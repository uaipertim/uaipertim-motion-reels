"""Áudio dos cortes curtos: trilha + efeitos do Reel original, no mesmo trecho do vídeo, seguidos do final
do original (acorde final/sting) embaixo do fecho "Manda pra quem…". Normalizado em -14 LUFS (pico ≤ -1,5 dBTP).

    python3 audio/cortes.py cortes/corte-A.json      → public/audio/cortes/corte-A.wav
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
FPS = 30
# mix do vídeo de origem: os Vídeos 1 e 2 não têm locução; no 3, "narrado" escolhe a versão com a voz
SOURCES = {"v1": "public/audio/mix.wav", "v2": "public/audio/v2/mix.wav", "v3": "public/audio/v3/mix_semvoz.wav"}
NARRADO = {"v3": "public/audio/v3/mix.wav"}
XFADE = 0.18  # s: emenda do trecho com o final do original


def main(path):
    c = json.load(open(path, encoding="utf-8"))
    src = (NARRADO if c.get("narrado") else SOURCES)[c["fonte"]]
    x, sr = sf.read(ROOT / src, dtype="float32", always_2d=True)
    s = lambda f: int(round(f / FPS * sr))
    trecho = x[s(c["inicio"]):s(c["fim"])].copy()
    fecho = x[len(x) - s(c["fechoDur"]) - int(XFADE * sr):].copy()  # final do original (sting + cauda)
    n = int(XFADE * sr)
    ramp = np.linspace(0, 1, n, dtype=np.float32)[:, None]
    trecho[-n:] = trecho[-n:] * (1 - ramp) + fecho[:n] * ramp
    out = np.concatenate([trecho, fecho[n:]])
    out[: int(0.01 * sr)] *= np.linspace(0, 1, int(0.01 * sr), dtype=np.float32)[:, None]
    total = s(c["fim"] - c["inicio"] + c["fechoDur"])
    out = out[:total] if len(out) >= total else np.pad(out, ((0, total - len(out)), (0, 0)))
    dst = ROOT / "public" / "audio" / "cortes" / f"corte-{c['id']}.wav"
    dst.parent.mkdir(parents=True, exist_ok=True)
    tmp = dst.with_suffix(".raw.wav")
    sf.write(tmp, out, sr, subtype="PCM_16")
    # loudnorm em 2 passadas (linear): -14 LUFS, true peak -1.5 dBTP
    first = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(tmp), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
                           capture_output=True, text=True).stderr
    m = json.loads(first[first.rindex("{"):first.rindex("}") + 1])
    af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
          f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(tmp), "-af", af, "-ar", str(sr), str(dst)], check=True)
    tmp.unlink()
    print(f"áudio: {dst.relative_to(ROOT)} ({total / sr:.2f}s, origem {src})")


if __name__ == "__main__":
    main(sys.argv[1])
