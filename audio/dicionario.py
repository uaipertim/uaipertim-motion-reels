"""Dicionário Mineiro: gera o áudio e os tempos de um episódio a partir do JSON dele.

    python3 audio/dicionario.py episodios/dicionario/01-uai.json

1. Narração com a voz oficial (audio/voz_oficial.json) numa chamada só, com o tempo de cada palavra:
   "[palavra]." → "[significado] Tipo: [exemplo]" → "[ponte]" → "[cta sem emoji]".
   O mp3 só é gerado de novo se o texto mudar (economiza créditos).
2. Tempos das cenas calculados pela voz (12 a 14 s no total) → public/audio/dicionario/NN/timing.json,
   lido pela composição DicionarioMineiro.
3. Trilha + efeitos curtos + ducking de 11 dB sob a voz, com o mesmo pipeline dos vídeos
   (tts.py/sfx.py/music.py/mix.py) → public/audio/dicionario/NN/mix.wav.
A chave da ElevenLabs nunca é impressa nem salva (vem do ambiente; ver elevenlabs.py).
"""
import json
import math
import os
import re
import subprocess
import sys
from pathlib import Path

from common import ROOT

FPS = 30
BPM = 124
BAR = 4 * 60 / BPM
GAP = '<break time="0.4s" />'
WORD = re.compile(r"[\wÀ-ÿ]+")
# tempos do modelo (segundos)
SIG_GAP = 0.45  # o significado começa ~0,4–0,5 s depois do fim da palavra falada (a capa fica só esse tempo depois da fala)
LEAD = 0.12  # a fala de cada cena começa logo depois do corte (o card entra junto)
TAIL = 0.3  # respiro depois da fala antes do próximo corte (aperta até 0.22 se precisar)
CTA_MIN = 2.5  # CTA na tela por pelo menos 2 s (com folga)
CTA_HOLD = 0.6  # o CTA fica parado ao menos isto depois da fala
TOTAL_MIN, TOTAL_MAX = 12.0, 14.0


def clean_cta(cta):
    """CTA para a voz: sem emoji e sem aspas."""
    t = "".join(ch for ch in cta if ch.isalnum() or ch.isspace() or ch in ",.!?-")
    return re.sub(r"\s+", " ", t).strip()


def parts_of(ep):
    return {
        "palavra": f"{ep['palavra']}.",
        "significado": f"{ep['significado']} Tipo: {ep['exemplo']}",
        "ponte": ep["ponte"],
        "cta": clean_cta(ep["cta"]),
    }


def narrate(ep, dst):
    import elevenlabs

    parts = parts_of(ep)
    script = f" {GAP} ".join(parts.values())
    meta_path = dst.with_suffix(".alignment.json")
    if dst.exists() and meta_path.exists():
        meta = json.load(open(meta_path, encoding="utf-8"))
        # o cache vale só se o texto ENVIADO à API (já com a regra de pronúncia) for o mesmo
        if meta.get("text") == elevenlabs.pronounce(script) and meta.get("voice") == voice_id():
            print(f"narração já gerada para este texto: {dst.relative_to(ROOT)}")
            return parts, meta
    text, audio, al = elevenlabs.speak(script)
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_bytes(audio)
    ws = elevenlabs.words(text, al)
    meta = {"script": script, "voice": voice_id(), "text": text,
            "words": [{**w, "start": round(w["start"], 3), "end": round(w["end"], 3)} for w in ws]}
    json.dump(meta, open(meta_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"narração: {dst.relative_to(ROOT)} ({ws[-1]['end']:.2f}s)")
    return parts, meta


def voice_id():
    return json.load(open(ROOT / "audio" / "voz_oficial.json", encoding="utf-8"))["voiceId"]


def segments(parts, words):
    """Trecho de cada parte no mp3 (s) + início da palavra "Tipo" (balão do exemplo)."""
    import elevenlabs

    segs, i = {}, 0
    for key, txt in parts.items():
        txt = elevenlabs.pronounce(txt)  # conta as palavras como a voz recebeu ("Uai Pértim" = 2)
        n = len(WORD.findall(txt))
        ws = words[i:i + n]
        assert len(ws) == n, f"alinhamento não bate com o texto em '{key}'"
        segs[key] = {"start": ws[0]["start"], "end": ws[-1]["end"]}
        if key == "significado":
            k = next(j for j, w in enumerate(ws) if w["w"].lower() == "tipo")
            segs[key]["tipo"] = ws[k]["start"]
        i += n
    keys = list(segs)
    # pontos de corte no meio das pausas
    for a, b in zip(keys, keys[1:]):
        mid = (segs[a]["end"] + segs[b]["start"]) / 2
        segs[a]["cutEnd"], segs[b]["cutStart"] = mid, mid
    segs[keys[0]]["cutStart"] = 0.0
    segs[keys[-1]]["cutEnd"] = segs[keys[-1]]["end"] + 0.4
    return segs


def layout(segs):
    """Frames de cada cena e de cada fala no vídeo."""
    dur = {k: v["end"] - v["start"] for k, v in segs.items()}
    lead = LEAD
    for tail in (TAIL, 0.22):  # aperta o respiro se passar de 14 s
        sig = lead + dur["significado"] + tail
        ponte = lead + dur["ponte"] + tail
        cta = max(CTA_MIN, lead + dur["cta"] + CTA_HOLD)
        # capa: a palavra é lida no frame 0 (o trecho cortado tem ~0,02 s de respiro antes da voz); o corte para o
        # significado vem a tempo de a fala dele começar SIG_GAP depois do fim da palavra
        capa = dur["palavra"] + 0.02 + SIG_GAP - lead
        total = capa + sig + ponte + cta
        if total <= TOTAL_MAX + 1e-6:
            break
    if total < TOTAL_MIN:  # curto demais: o CTA fica mais tempo na tela
        cta += TOTAL_MIN - total
        total = TOTAL_MIN
    f = lambda s: int(round(s * FPS))
    starts = {"capa": 0, "significado": f(capa), "ponte": f(capa + sig), "cta": f(capa + sig + ponte)}
    total_f = f(total)
    scenes = {}
    keys = list(starts)
    for a, b in zip(keys, keys[1:] + [None]):
        scenes[a] = {"from": starts[a], "duration": (starts[b] if b else total_f) - starts[a]}
    voice_at = {"palavra": 0, "significado": starts["significado"] + f(lead), "ponte": starts["ponte"] + f(lead), "cta": starts["cta"] + f(lead)}
    scene_of = {"palavra": "capa", "significado": "significado", "ponte": "ponte", "cta": "cta"}
    # tts.py recorta cada trecho e tira o silêncio da ponta: a fala começa ~no frame em que o trecho é colocado
    speech = [{"id": k, "scene": scene_of[k], "from": voice_at[k], "to": voice_at[k] + f(s["end"] - s["start"])} for k, s in segs.items()]
    sig = segs["significado"]
    balloon = voice_at["significado"] + f(sig["tipo"] - sig["start"]) - 3  # balão entra junto do "Tipo:"
    return {"fps": FPS, "durationInFrames": total_f, "scenes": scenes, "beats": {"balloon": balloon}, "speech": speech}, voice_at


def audio_timeline(ep, segs, timing, voice_at, mp3):
    """Timeline no formato do pipeline de áudio (tts/sfx/music/mix)."""
    sc = timing["scenes"]
    total_s = timing["durationInFrames"] / FPS
    cta_s = sc["cta"]["from"] / FPS
    k = math.floor(cta_s / BAR)  # o acorde final (sting) cai exatamente na entrada do CTA
    off = cta_s - (k + 1) * BAR  # offset negativo: a trilha começa no meio do compasso 0
    k += 1  # compasso do CTA = último compasso (acorde final); o anterior faz o "pickup" em G
    prog = ["C", "G", "Am", "F"]
    chords = [prog[i % 4] for i in range(k - 1)] + ["G", "C"]
    items = [{"id": k_, "from": voice_at[k_], "src": [round(s["cutStart"], 3), round(s["cutEnd"], 3)], "text": k_} for k_, s in segs.items()]
    S = lambda name: {"capa": "s1", "significado": "s2", "ponte": "s3", "cta": "s4"}[name]
    beats = {S(n): {} for n in sc}
    sfx = [
        {"sound": "boing_small", "scene": "s1", "at": 0, "gain": -12, "pan": 0},  # quique da palavra
        {"sound": "brilho", "scene": "s1", "at": 4, "gain": -16},
        {"sound": "whoosh", "scene": "s2", "at": 0, "gain": -13},
        {"sound": "pop", "scene": "s2", "at": timing["beats"]["balloon"] - sc["significado"]["from"], "gain": -8},  # pop do balão
        {"sound": "whoosh_up", "scene": "s3", "at": 0, "gain": -14},
        {"sound": "pop_magic", "scene": "s4", "at": 0, "gain": -11},
        {"sound": "ding", "scene": "s4", "at": 10, "gain": -14},  # logo pequeno
    ]
    return {
        "_doc": f"GERADO por audio/dicionario.py para o episódio {ep['numero']:02d} — não edite à mão.",
        "fps": FPS, "width": 1080, "height": 1920, "durationInFrames": timing["durationInFrames"],
        "scenes": {S(n): v for n, v in sc.items()},
        "beats": beats,
        "narration": {"enabled": True, "engine": "file", "src": str(mp3.relative_to(ROOT)), "items": items},
        "music": {
            "bpm": BPM, "offsetSeconds": round(off, 4), "chords": chords,
            "sections": {"intro": [0, 0], "grooveA": [1, 2], "grooveB": [3, k - 1], "final": [k, k]},
            "levels": {"final": 3.0}, "introHoldSeconds": 0,
            "duckDb": -11, "duckAttack": 0.08, "duckRelease": 0.35,
        },
        "master": {"ceilingDb": -1.5, "truePeak": True},
        "sfx": sfx,
        "_total_s": round(total_s, 2),
    }


def main(path):
    ep = json.load(open(path, encoding="utf-8"))
    nn = f"{ep['numero']:02d}"
    pub = ROOT / "public" / "audio" / "dicionario" / nn
    build = ROOT / "audio" / "build" / "dicionario" / nn
    build.mkdir(parents=True, exist_ok=True)
    mp3 = pub / "narracao.mp3"
    parts, meta = narrate(ep, mp3)
    segs = segments(parts, meta["words"])
    timing, voice_at = layout(segs)
    timing["episodio"] = Path(path).name
    json.dump(timing, open(pub / "timing.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    tl = audio_timeline(ep, segs, timing, voice_at, mp3)
    json.dump(tl, open(build / "timeline.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    env = {**os.environ, "UAI_TIMELINE": str(build / "timeline.json"), "UAI_BUILD": str(build), "UAI_MIX": str(pub / "mix.wav")}
    subprocess.run([sys.executable, "-c", "import tts, sfx, music, mix; tts.main(); sfx.build(); music.main(); mix.main()"],
                   cwd=ROOT / "audio", env=env, check=True)
    print(f"\nepisódio {nn} · {timing['durationInFrames'] / FPS:.2f}s ({timing['durationInFrames']} frames)")
    for name, s in timing["scenes"].items():
        print(f"  cena {name:12s} f{s['from']:4d}–{s['from'] + s['duration']:4d}")
    for s in timing["speech"]:
        print(f"  fala {s['id']:12s} f{s['from']:4d}–{s['to']:4d}  ({s['from'] / FPS:5.2f}s–{s['to'] / FPS:5.2f}s)")


if __name__ == "__main__":
    main(sys.argv[1])
