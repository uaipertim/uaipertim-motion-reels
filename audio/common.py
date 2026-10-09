"""Utilidades compartilhadas do pipeline de áudio (lê a timeline única do projeto)."""
import json
import os
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

ROOT = Path(__file__).resolve().parent.parent
# Qual vídeo processar: UAI_VIDEO=v1 (padrão) | v2 | v3 | v4 | story. Os scripts aceitam --video vX.
VIDEOS = {
    "v1": {"timeline": ROOT / "src" / "config" / "timeline.json", "build": ROOT / "audio" / "build",
           "mix": ROOT / "public" / "audio" / "mix.wav"},
    "v2": {"timeline": ROOT / "src" / "v2" / "config" / "timeline.json", "build": ROOT / "audio" / "build" / "v2",
           "mix": ROOT / "public" / "audio" / "v2" / "mix.wav"},
    "v3": {"timeline": ROOT / "src" / "v3" / "config" / "timeline.json", "build": ROOT / "audio" / "build" / "v3",
           "mix": ROOT / "public" / "audio" / "v3" / "mix.wav"},
    "v4": {"timeline": ROOT / "src" / "v4" / "config" / "timeline.json", "build": ROOT / "audio" / "build" / "v4",
           "mix": ROOT / "public" / "audio" / "v4" / "mix.wav"},
    "story": {"timeline": ROOT / "src" / "story" / "config" / "timeline.json", "build": ROOT / "audio" / "build" / "story",
              "mix": ROOT / "public" / "audio" / "story" / "mix.wav"},
}
VIDEO = os.environ.get("UAI_VIDEO", "v1")
TIMELINE_PATH = VIDEOS[VIDEO]["timeline"]
BUILD = VIDEOS[VIDEO]["build"]
MIX_OUT = VIDEOS[VIDEO]["mix"]
MODELS = Path(os.environ.get("UAI_MODELS_DIR", ROOT / "audio" / "models"))
SR = 48000



def load_timeline():
    with open(TIMELINE_PATH, encoding="utf-8") as f:
        return json.load(f)


def db(x):
    return 10 ** (x / 20.0)


def to_sr(x, sr_in, sr_out=SR):
    if sr_in == sr_out:
        return x.astype(np.float32)
    g = np.gcd(sr_in, sr_out)
    return resample_poly(x, sr_out // g, sr_in // g).astype(np.float32)


def read(path):
    x, sr = sf.read(str(path), dtype="float32", always_2d=False)
    return x, sr


def write(path, x, sr=SR):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    sf.write(str(path), x, sr, subtype="PCM_16")


def trim_silence(x, sr, thresh_db=-45.0, pad=0.02):
    """Remove silêncio do começo/fim mantendo um respiro curto."""
    if x.size == 0:
        return x
    win = max(1, int(sr * 0.01))
    env = np.sqrt(np.convolve(x ** 2, np.ones(win) / win, mode="same"))
    idx = np.where(env > db(thresh_db) * max(1e-9, np.abs(x).max()))[0]
    if idx.size == 0:
        return x
    a = max(0, idx[0] - int(pad * sr))
    b = min(len(x), idx[-1] + int(pad * sr))
    return x[a:b]


def fade(x, sr, fin=0.005, fout=0.02):
    x = x.copy()
    n_in, n_out = int(fin * sr), int(fout * sr)
    if n_in:
        x[:n_in] *= np.linspace(0, 1, n_in)
    if n_out:
        x[-n_out:] *= np.linspace(1, 0, n_out)
    return x


def beat_frames(tl, scene, at):
    """Resolve uma referência de beat ('nome' | 'nome[i]' | número | lista) em frames ABSOLUTOS."""
    base = tl["scenes"][scene]["from"]
    if isinstance(at, (int, float)):
        return [base + at]
    if at.endswith("]"):  # um item de uma lista de beats, ex.: "balloons[2]"
        name, idx = at[:-1].split("[")
        return [base + tl["beats"][scene][name][int(idx)]]
    v = tl["beats"][scene][at]
    if isinstance(v, list):
        return [base + f for f in v]
    return [base + v]


def segment_bar_seconds(m, i):
    """Início (s) do compasso i quando a trilha é montada em frases de duração fixa (story: 1 frase por card).

    Cada frase começa num tempo forte exatamente em k·segmentSeconds; dentro dela os compassos seguem o bpm.
    """
    beat = 60.0 / m["bpm"]
    seg = round(m["segmentSeconds"] / beat * 480) / 480 * beat
    k, j = divmod(i, m["barsPerSegment"])
    return m["offsetSeconds"] + k * seg + j * 4 * beat
