"""Locução pt-BR (Kokoro TTS, offline) a partir da tabela de narração em timeline.json.

Cada fala é gerada por segmentos (com pausa controlada entre eles), passa pelos
ajustes de pronúncia (phonemeFixes) e é acelerada automaticamente se passar de
`maxSeconds`, para caber na janela da cena.
"""
import json
import re

import numpy as np
from kokoro_onnx import Kokoro

from common import BUILD, MODELS, SR, fade, load_timeline, to_sr, trim_silence, write


def main():
    tl = load_timeline()
    nar = tl["narration"]
    kokoro = Kokoro(str(MODELS / "kokoro-v1.0.onnx"), str(MODELS / "voices-v1.0.bin"))
    fixes = [(re.compile(a), b) for a, b in nar.get("phonemeFixes", [])]

    def phonemes(seg):
        if "ph" in seg:
            return seg["ph"]
        p = kokoro.tokenizer.phonemize(seg["say"], lang="pt-br")
        for rx, rep in fixes:
            p = rx.sub(rep, p)
        return p

    def render(item, speed):
        parts = []
        for i, seg in enumerate(item["segments"]):
            audio, sr = kokoro.create(phonemes(seg), voice=nar["voice"], speed=speed,
                                      lang="pt-br", is_phonemes=True)
            audio = trim_silence(audio, sr)
            parts.append(to_sr(audio, sr))
            if i < len(item["segments"]) - 1:
                parts.append(np.zeros(int(SR * item.get("pause", 0.15)), np.float32))
        return np.concatenate(parts)

    meta = {}
    for item in nar["items"]:
        speed = item.get("speed", 1.0)
        x = render(item, speed)
        dur = len(x) / SR
        limit = item.get("maxSeconds")
        tries = 0
        while limit and dur > limit and tries < 4:
            speed *= dur / limit * 1.01
            x = render(item, speed)
            dur = len(x) / SR
            tries += 1
        x = fade(x, SR, 0.004, 0.03)
        x = x / (np.abs(x).max() + 1e-9) * 0.89
        write(BUILD / "vo" / f"{item['id']}.wav", x)
        meta[item["id"]] = {"from": item["from"], "seconds": round(dur, 3), "speed": round(speed, 3),
                            "phonemes": [phonemes(s) for s in item["segments"]]}
        end_frame = item["from"] + dur * tl["fps"]
        print(f"{item['id']}: {dur:.2f}s  speed={speed:.2f}  frames {item['from']}–{end_frame:.0f}  | {item['text']}")

    with open(BUILD / "vo" / "narration.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
