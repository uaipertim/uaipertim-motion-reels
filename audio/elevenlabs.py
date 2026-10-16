"""Gera a narração de um vídeo com a voz oficial da UaiPertim (audio/voz_oficial.json) na ElevenLabs.

    python3 audio/elevenlabs.py --video v3

Lê o roteiro em narration.script da timeline do vídeo, aplica as grafias de pronúncia e salva:
  - narration.src (ex.: public/audio/narracao_video3.mp3)
  - o mesmo caminho com .alignment.json: tempo (s) de cada palavra, para cortar e sincronizar as falas.
A chave nunca é impressa nem salva: vem do ambiente (Segredos de rede injetam o xi-api-key) ou de XI_API_KEY.
"""
import base64
import json
import os
import re
import sys
import urllib.request

if "--video" in sys.argv:
    os.environ["UAI_VIDEO"] = sys.argv[sys.argv.index("--video") + 1]

from common import ROOT, load_timeline  # noqa: E402

API = "https://api.elevenlabs.io/v1/text-to-speech/{voice}/with-timestamps?output_format={fmt}"


def pronounce(text):
    """Regra fixa de pronúncia (audio/voz_oficial.json → pronuncia): troca palavras inteiras, sem diferenciar
    maiúsculas, mantendo a inicial maiúscula/minúscula e aplicando as chaves mais longas primeiro."""
    voz = json.load(open(ROOT / "audio" / "voz_oficial.json", encoding="utf-8"))
    for word, spelled in sorted(voz.get("pronuncia", {}).items(), key=lambda kv: -len(kv[0])):
        def rep(m, spelled=spelled):
            return spelled if m.group(0)[0].isupper() else spelled[0].lower() + spelled[1:]
        text = re.sub(rf"(?<![\wÀ-ÿ]){re.escape(word)}(?![\wÀ-ÿ])", rep, text, flags=re.IGNORECASE)
    return text


def speak(text):
    voz = json.load(open(ROOT / "audio" / "voz_oficial.json", encoding="utf-8"))
    text = pronounce(text)
    body = json.dumps({"text": text, "model_id": voz["model"], "voice_settings": voz["voiceSettings"], "seed": voz["seed"]}).encode()
    headers = {"Content-Type": "application/json"}
    if os.environ.get("XI_API_KEY"):
        headers["xi-api-key"] = os.environ["XI_API_KEY"]
    req = urllib.request.Request(API.format(voice=voz["voiceId"], fmt=voz["outputFormat"]), data=body, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=120) as r:
        d = json.load(r)
    return text, base64.b64decode(d["audio_base64"]), d["alignment"]


def words(text, al):
    """Palavras com início/fim (s), a partir do alinhamento por caractere."""
    out, cur, tag = [], None, False
    for ch, a, b in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
        if ch in "<>":  # <break time="…" /> não é fala
            tag = ch == "<"
            continue
        if not tag and re.match(r"[\wÀ-ÿ]", ch):
            if cur is None:
                cur = {"w": "", "start": a}
            cur["w"] += ch
            cur["end"] = b
        elif cur is not None:
            out.append(cur)
            cur = None
    if cur:
        out.append(cur)
    return out


def main():
    tl = load_timeline()
    nar = tl["narration"]
    text, audio, al = speak(nar["script"])
    dst = ROOT / nar["src"]
    dst.write_bytes(audio)
    ws = words(text, al)
    with open(dst.with_suffix(".alignment.json"), "w", encoding="utf-8") as f:
        json.dump({"text": text, "words": [{**w, "start": round(w["start"], 3), "end": round(w["end"], 3)} for w in ws]}, f, ensure_ascii=False, indent=1)
    print(f"{nar['src']}: {ws[-1]['end']:.2f}s, {len(ws)} palavras")
    for w in ws:
        print(f"  {w['start']:6.2f}–{w['end']:6.2f}  {w['w']}")


if __name__ == "__main__":
    main()
