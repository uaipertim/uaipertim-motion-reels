"""Seleção automática de takes da locução (opcional).

O modelo de voz sorteia ruído a cada geração, então cada `seed` é um "take"
diferente. Este script gera N takes por fala, transcreve cada um com Whisper
(sherpa-onnx) e grava em timeline.json a seed do take que soa mais fiel ao texto.

    python3 audio/pick_takes.py            # 8 takes por fala
    python3 audio/pick_takes.py --takes 12 --only n1,n3
    python3 audio/pick_takes.py --video v2

Requer: pip install sherpa-onnx  e o modelo Whisper small em
audio/models/sherpa-onnx-whisper-small (ou UAI_ASR_DIR), baixado de
https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-whisper-small.tar.bz2
"""
import argparse
import os
import re
import sys
import unicodedata
from difflib import SequenceMatcher

import numpy as np

if "--video" in sys.argv:  # antes de importar common (que lê UAI_VIDEO)
    os.environ["UAI_VIDEO"] = sys.argv[sys.argv.index("--video") + 1]

from common import MODELS, SR, TIMELINE_PATH, load_timeline  # noqa: E402
from tts import fit_item, make_engine  # noqa: E402


def norm(t):
    t = t.lower().replace("uaipertim", "uai pertim")
    t = "".join(c for c in unicodedata.normalize("NFD", t) if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z ]+", " ", t).split()


def score(heard, target):
    return SequenceMatcher(None, " ".join(norm(heard)), " ".join(norm(target))).ratio()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--takes", type=int, default=8)
    ap.add_argument("--only", default="")
    ap.add_argument("--video", default="v1")
    args = ap.parse_args()

    import sherpa_onnx

    asr_dir = os.environ.get("UAI_ASR_DIR", str(MODELS / "sherpa-onnx-whisper-small")) + "/"
    rec = sherpa_onnx.OfflineRecognizer.from_whisper(
        encoder=asr_dir + "small-encoder.int8.onnx", decoder=asr_dir + "small-decoder.int8.onnx",
        tokens=asr_dir + "small-tokens.txt", language="pt", task="transcribe", num_threads=4)

    def transcribe(x):
        st = rec.create_stream()
        st.accept_waveform(SR, x.astype(np.float32))
        rec.decode_stream(st)
        return st.result.text.strip()

    tl = load_timeline()
    nar = tl["narration"]
    _, engine, fixes = make_engine(nar)
    only = set(filter(None, args.only.split(",")))
    chosen = {}
    for item in nar["items"]:
        if only and item["id"] not in only:
            continue
        results = []
        for seed in range(args.takes):
            x, speed = fit_item(engine, fixes, item, seed)
            heard = transcribe(x)
            results.append((score(heard, item["text"]), -speed, seed, heard))
        results.sort(reverse=True)
        best = results[0]
        chosen[item["id"]] = best[2]
        print(f"{item['id']}: seed {best[2]} (score {best[0]:.2f}) → {best[3]}")
        for r in results[1:3]:
            print(f"      alt seed {r[2]} ({r[0]:.2f}) → {r[3]}")

    # grava as seeds escolhidas na timeline (edição textual, preserva a formatação)
    src = TIMELINE_PATH.read_text(encoding="utf-8")
    for nid, seed in chosen.items():
        pat = re.compile(r'(\{ "id": "%s", )(?:"seed": \d+, )?' % nid)
        src = pat.sub(lambda m: f'{m.group(1)}"seed": {seed}, ', src, count=1)
    TIMELINE_PATH.write_text(src, encoding="utf-8")
    print("seeds gravadas em", TIMELINE_PATH)


if __name__ == "__main__":
    main()
