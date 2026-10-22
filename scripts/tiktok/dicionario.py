# Dicionário Mineiro → TikTok, por episódio (o mesmo processo usado no ep01):
#   1. diagnostico.png: início, meio e fim do render atual com a área insegura do TikTok em vermelho
#      (~140 px à direita, ~380 px embaixo, ~130 px no topo, em 1080x1920);
#   2. faixa só voz: recorta o narracao.mp3 (bruto, sem cortes) com os tempos de cada palavra
#      (narracao.alignment.json) e põe cada fala no frame do timing.json, como o mix.wav (sem chamar a API);
#   3. epNN-trilha.mp4 (áudio = mix.wav, render do Remotion), epNN-voz.mp4 (mesmo vídeo, áudio = só voz)
#      e epNN-capa.png (quadro 0: palavra centralizada, legível no recorte 3:4 da grade).
# Não altera o modelo do Instagram: renderiza a composição DicionarioMineiro como está.
#
# Uso: python3 scripts/tiktok/dicionario.py episodios/dicionario/01-uai.json [--out DIR] [--so-diagnostico]
import argparse
import json
import re
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
FPS, W, H = 30, 1080, 1920
UNSAFE = {"top": 130, "bottom": 380, "right": 140}
WORD = re.compile(r"[\wÀ-ÿ]+")  # igual a audio/dicionario.py
PRE = 0.02  # respiro antes da 1ª palavra de cada fala
PEAK_DB = -1.5  # mesmo teto do mix.wav


def run(*cmd):
    subprocess.run(cmd, cwd=ROOT, check=True)


def pronounce(text):
    """Mesma regra de audio/elevenlabs.py → pronounce() (só para contar as palavras como a voz recebeu)."""
    voz = json.load(open(ROOT / "audio" / "voz_oficial.json", encoding="utf-8"))
    for word, spelled in sorted(voz.get("pronuncia", {}).items(), key=lambda kv: -len(kv[0])):
        text = re.sub(rf"(?<![\wÀ-ÿ]){re.escape(word)}(?![\wÀ-ÿ])", spelled, text, flags=re.IGNORECASE)
    return text


def parts_of(ep):
    """Mesmas partes de audio/dicionario.py → parts_of()."""
    cta = re.sub(r"\s+", " ", "".join(ch for ch in ep["cta"] if ch.isalnum() or ch.isspace() or ch in ",.!?-")).strip()
    return {"palavra": f"{ep['palavra']}.", "significado": f"{ep['significado']} Tipo: {ep['exemplo']}", "ponte": ep["ponte"], "cta": cta}


def still(props, frame, out):
    run("npx", "remotion", "still", "DicionarioMineiro", str(out), f"--frame={frame}", f"--props={props}", "--log=error")


def diagnostico(props, total, tmp, out):
    frames = [("início", 0), ("meio", total // 2), ("fim", total - 16)]
    gap, head = 40, 90
    sheet = Image.new("RGB", (3 * W + 4 * gap, H + 2 * gap + head), "#222")
    d0 = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 56)
    except OSError:
        font = None
    for i, (label, f) in enumerate(frames):
        png = tmp / f"q{f}.png"
        still(props, f, png)
        im = Image.open(png).convert("RGBA")
        ov = Image.new("RGBA", im.size, (0, 0, 0, 0))
        d = ImageDraw.Draw(ov)
        red = (230, 30, 30, 110)
        d.rectangle([0, 0, W, UNSAFE["top"]], fill=red)
        d.rectangle([0, H - UNSAFE["bottom"], W, H], fill=red)
        d.rectangle([W - UNSAFE["right"], UNSAFE["top"], W, H - UNSAFE["bottom"]], fill=red)
        x = gap + i * (W + gap)
        sheet.paste(Image.alpha_composite(im, ov).convert("RGB"), (x, gap + head))
        d0.text((x, gap), f"{label} · q{f}", fill="white", font=font)
    sheet.save(out)


def faixa_voz(ep, aud, timing, out):
    words = json.load(open(aud / "narracao.alignment.json", encoding="utf-8"))["words"]
    segs, i = [], 0
    for key, txt in parts_of(ep).items():
        n = len(WORD.findall(pronounce(txt)))
        ws = words[i:i + n]
        assert len(ws) == n, f"alinhamento não bate com o texto em '{key}'"
        segs.append({"id": key, "start": ws[0]["start"], "end": ws[-1]["end"]})
        i += n
    # cortes no meio das pausas (como audio/dicionario.py → segments())
    for a, b in zip(segs, segs[1:]):
        a["cutEnd"] = (a["end"] + b["start"]) / 2
    segs[-1]["cutEnd"] = segs[-1]["end"] + 0.4
    at = {s["id"]: s["from"] for s in timing["speech"]}
    total = timing["durationInFrames"] / FPS
    chains, labels = [], []
    for k, s in enumerate(segs):
        a = max(0.0, s["start"] - PRE)
        dur = s["cutEnd"] - a
        delay = max(0, round((at[s["id"]] / FPS - (s["start"] - a)) * 1000))
        chains.append(f"[0:a]atrim={a:.3f}:{s['cutEnd']:.3f},asetpts=PTS-STARTPTS,"
                      f"afade=t=out:st={dur - 0.03:.3f}:d=0.03,adelay={delay}|{delay}[s{k}]")
        labels.append(f"[s{k}]")
    graph = ";".join(chains) + f";{''.join(labels)}amix=inputs={len(labels)}:normalize=0," \
        f"apad=whole_dur={total},atrim=0:{total},aresample=48000,aformat=channel_layouts=stereo[o]"
    raw = out.with_name("voz_raw.wav")
    run("ffmpeg", "-v", "error", "-y", "-i", str(aud / "narracao.mp3"), "-filter_complex", graph, "-map", "[o]", str(raw))
    det = subprocess.run(["ffmpeg", "-i", str(raw), "-af", "volumedetect", "-f", "null", "-"], capture_output=True, text=True).stderr
    peak = float(re.search(r"max_volume: (-?[\d.]+) dB", det).group(1))
    run("ffmpeg", "-v", "error", "-y", "-i", str(raw), "-af", f"volume={PEAK_DB - peak:.2f}dB", str(out))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("episodio", help="JSON do episódio (episodios/dicionario/NN-palavra.json)")
    ap.add_argument("--out", help="pasta de saída (padrão: exports/tiktok/dicionario-mineiro/epNN)")
    ap.add_argument("--so-diagnostico", action="store_true", help="gera só o diagnostico.png")
    a = ap.parse_args()
    props = a.episodio
    ep = json.load(open(ROOT / props, encoding="utf-8"))
    nn = f"{ep['numero']:02d}"
    aud = ROOT / "public" / "audio" / "dicionario" / nn
    timing = json.load(open(aud / "timing.json", encoding="utf-8"))
    total = timing["durationInFrames"]
    out = Path(a.out) if a.out else ROOT / "exports" / "tiktok" / "dicionario-mineiro" / f"ep{nn}"
    out.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as t:
        tmp = Path(t)
        diagnostico(props, total, tmp, out / "diagnostico.png")
        if a.so_diagnostico:
            return
        faixa_voz(ep, aud, timing, tmp / "voz.wav")
        trilha = out / f"ep{nn}-trilha.mp4"
        run("npx", "remotion", "render", "DicionarioMineiro", str(trilha), f"--props={props}", "--codec=h264", "--crf=16",
            "--audio-codec=aac", "--audio-bitrate=192k", "--log=error")
        run("ffmpeg", "-v", "error", "-y", "-i", str(trilha), "-i", str(tmp / "voz.wav"), "-map", "0:v", "-map", "1:a",
            "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", str(out / f"ep{nn}-voz.mp4"))
        still(props, 0, out / f"ep{nn}-capa.png")
    print(f"ep{nn}: {total / FPS:.2f}s ({total} quadros) → {out.relative_to(ROOT) if out.is_relative_to(ROOT) else out}")


if __name__ == "__main__":
    main()
