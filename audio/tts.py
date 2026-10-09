"""Locução pt-BR offline a partir da tabela de narração em timeline.json.

Motores:
  - "piper"  (padrão): vozes Piper treinadas com falantes brasileiros nativos
              (pt_BR-cadu-medium / pt_BR-faber-medium, datasets CC0) — sotaque natural.
  - "kokoro" (alternativa): Kokoro v1.0, voz pf_dora — mais expressiva, mas com
              sotaque de estrangeiro em pt-BR.

Cada fala é gerada por segmentos (com pausa controlada entre eles), passa pelos
ajustes de pronúncia (phonemeFixes do motor) e é acelerada automaticamente se
passar de `maxSeconds`, para caber na janela da cena.
"""
import json
import re

import espeakng_loader
import numpy as np
import phonemizer
from phonemizer.backend.espeak.wrapper import EspeakWrapper

from common import BUILD, MODELS, SR, fade, load_timeline, to_sr, trim_silence, write

EspeakWrapper.set_library(espeakng_loader.get_library_path())
EspeakWrapper.set_data_path(espeakng_loader.get_data_path())


def espeak_phonemes(text):
    return phonemizer.phonemize(text, "pt-br", preserve_punctuation=True, with_stress=True).strip()


class PiperEngine:
    def __init__(self, voice, noise_scale=0.7, noise_w=0.85):
        import onnxruntime as ort

        base = MODELS / "piper" / voice
        self.ort = ort
        with open(str(base) + ".onnx", "rb") as f:
            self.model_bytes = f.read()
        with open(str(base) + ".onnx.json", encoding="utf-8") as f:
            cfg = json.load(f)
        self.id_map = cfg["phoneme_id_map"]
        self.sr = cfg["audio"]["sample_rate"]
        self.noise_scale, self.noise_w = noise_scale, noise_w

    def phonemize(self, text):
        return espeak_phonemes(text)

    def synth(self, phonemes, speed, seed=0):
        # sessão nova com seed fixa → mesmo "take" sempre (o VITS sorteia ruído a cada geração)
        self.ort.set_seed(int(seed))
        sess = self.ort.InferenceSession(self.model_bytes, providers=["CPUExecutionProvider"])
        # formato Piper: BOS, PAD, (fonema, PAD)*, EOS
        pad, bos, eos = self.id_map["_"][0], self.id_map["^"][0], self.id_map["$"][0]
        ids = [bos, pad]
        for ch in phonemes:
            if ch in self.id_map:
                ids += [self.id_map[ch][0], pad]
        ids.append(eos)
        audio = sess.run(None, {
            "input": np.array([ids], np.int64),
            "input_lengths": np.array([len(ids)], np.int64),
            "scales": np.array([self.noise_scale, 1.0 / speed, self.noise_w], np.float32),
        })[0].squeeze()
        return audio.astype(np.float32), self.sr


class KokoroEngine:
    def __init__(self, voice):
        from kokoro_onnx import Kokoro

        self.k = Kokoro(str(MODELS / "kokoro-v1.0.onnx"), str(MODELS / "voices-v1.0.bin"))
        self.voice = voice

    def phonemize(self, text):
        return self.k.tokenizer.phonemize(text, lang="pt-br")

    def synth(self, phonemes, speed, seed=0):
        return self.k.create(phonemes, voice=self.voice, speed=speed, lang="pt-br", is_phonemes=True)


def make_engine(nar):
    name = nar.get("engine", "piper")
    if name == "piper":
        engine = PiperEngine(nar["voice"], nar.get("noiseScale", 0.7), nar.get("noiseW", 0.85))
    else:
        engine = KokoroEngine(nar["voice"])
    fixes = nar.get("phonemeFixes", {})
    fixes = fixes.get(name, []) if isinstance(fixes, dict) else fixes
    return name, engine, [(re.compile(a), b) for a, b in fixes]


def render_item(engine, fixes, item, speed, seed):
    """Gera uma fala (todos os segmentos + pausas) em 48 kHz.

    Por segmento: "say" (texto) ou "ph" (fonemas), "speedMul" (ex.: marca um pouco mais
    devagar), "seed" (trava o take daquele trecho) e "pauseAfter" (s).
    """
    parts = []
    for i, seg in enumerate(item["segments"]):
        if "ph" in seg:
            p = seg["ph"]
        else:
            p = engine.phonemize(seg["say"])
            for rx, rep in fixes:
                p = rx.sub(rep, p)
        audio, sr = engine.synth(p, speed * seg.get("speedMul", 1.0), seg.get("seed", seed * 10 + i))
        parts.append(to_sr(trim_silence(audio, sr), sr))
        if i < len(item["segments"]) - 1:
            parts.append(np.zeros(int(SR * seg.get("pauseAfter", item.get("pause", 0.15))), np.float32))
    return np.concatenate(parts)


def fit_item(engine, fixes, item, seed):
    """Gera a fala e acelera se passar de maxSeconds. Retorna (áudio 48 kHz, velocidade)."""
    speed = item.get("speed", 1.0)
    x = render_item(engine, fixes, item, speed, seed)
    limit = item.get("maxSeconds")
    tries = 0
    while limit and len(x) / SR > limit and tries < 4:
        speed *= len(x) / SR / limit * 1.01
        x = render_item(engine, fixes, item, speed, seed)
        tries += 1
    return x, speed


def main():
    tl = load_timeline()
    nar = tl["narration"]
    if not nar.get("enabled", True):
        print("locução desligada (narration.enabled = false) — nada a gerar")
        return
    engine_name, engine, fixes = make_engine(nar)

    def phonemes(seg):
        if "ph" in seg:
            return seg["ph"]
        p = engine.phonemize(seg["say"])
        for rx, rep in fixes:
            p = rx.sub(rep, p)
        return p

    meta = {"engine": engine_name, "voice": nar["voice"]}
    for item in nar["items"]:
        x, speed = fit_item(engine, fixes, item, item.get("seed", 0))
        dur = len(x) / SR
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
