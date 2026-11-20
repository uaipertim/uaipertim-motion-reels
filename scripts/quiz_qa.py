#!/usr/bin/env python3
"""Revisão técnica do carrossel animado "Quiz" + a prévia (contato com as lâminas).

    python3 scripts/quiz_qa.py 01

Confere, para cada lâmina (out/carrosseis/quiz/<pasta>/):
  - formato: H.264, yuv420p, 1080 × 1440, 30 fps, 6–8 s, sem trilha de áudio;
  - loop: a diferença entre o último quadro e o primeiro (a volta do Instagram) não pode ser maior que a maior
    diferença entre dois quadros seguidos do próprio vídeo (sem salto visível);
  - capa: o quadro 0 da lâmina 1 = capa-3x4.png (PSNR ≥ 35 dB: a diferença é só a compressão do H.264) e o PNG estático de cada lâmina = o quadro dele no vídeo;
  - bordas: na máscara (render sem fundo, revisao/mascara/), todo o conteúdo fica em x 135–945 e longe do alto e do pé.
Grava revisao/relatorio-tecnico.txt e previa.png.
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

RAIZ = Path(__file__).resolve().parent.parent
W, H, FPS = 1080, 1440, 30
X0, X1, Y0, Y1 = 135, 945, 30, 1410


def dados(arg):
    d = RAIZ / "carrosseis/quiz"
    j = next(p for p in d.glob(f"{int(arg):02d}-*.json"))
    return json.loads(j.read_text())


def probe(mp4):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(mp4)], capture_output=True, text=True, check=True)
    return json.loads(out.stdout)


def quadros(mp4, w=270, h=360):
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(mp4), "-vf", f"scale={w}:{h}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3).astype(np.float32)


def quadro_cheio(mp4, n):
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(mp4), "-vf", f"select=eq(n\\,{n})", "-vframes", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(H, W, 3).astype(np.float32)


def psnr(a, b):
    mse = np.mean((a - b) ** 2)
    return 99.0 if mse == 0 else 10 * np.log10(255 ** 2 / mse)


def main():
    q = dados(sys.argv[1] if len(sys.argv) > 1 else "01")
    out = RAIZ / "out/carrosseis/quiz" / q["pasta"]
    n = len(q["perguntas"]) + 2
    linhas, falhas, duracoes = [], [], []

    def ok(cond, msg):
        linhas.append(("ok    " if cond else "FALHA ") + msg)
        if not cond:
            falhas.append(msg)

    for i in range(n):
        mp4 = out / f"lamina-{i + 1}.mp4"
        info = probe(mp4)
        v = [s for s in info["streams"] if s["codec_type"] == "video"][0]
        a = [s for s in info["streams"] if s["codec_type"] == "audio"]
        nq = int(v["nb_frames"])
        dur = nq / FPS
        duracoes.append(dur)
        linhas.append(f"--- lâmina {i + 1}: {dur:.2f} s ({nq} quadros)")
        ok(v["codec_name"] == "h264" and v["pix_fmt"] == "yuv420p", f"H.264 yuv420p ({v['codec_name']}, {v['pix_fmt']}, perfil {v.get('profile')})")
        ok((v["width"], v["height"]) == (W, H), f"1080 × 1440 ({v['width']} × {v['height']})")
        ok(v["r_frame_rate"] == "30/1", f"30 fps ({v['r_frame_rate']})")
        ok(6.0 <= dur <= 8.0, f"duração entre 6 e 8 s ({dur:.2f} s)")
        ok(not a, "sem trilha de áudio")
        # loop
        fr = quadros(mp4)
        dif = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2, 3))
        volta = np.abs(fr[-1] - fr[0]).mean()
        ok(volta <= dif.max() + 1e-6, f"loop sem salto: último→primeiro {volta:.2f} (quadros seguidos: mediana {np.median(dif):.2f}, máx {dif.max():.2f})")
        # a emenda sem compressão (PNG): D-1 → 0 tem de ser um passo como 0 → 1
        lp = out / "revisao/loop"
        if (lp / f"lamina-{i + 1}-fim.png").exists():
            P = lambda k: np.asarray(Image.open(lp / f"lamina-{i + 1}-{k}.png").convert("RGB")).astype(np.float32)
            fim, q0, q1 = P("fim"), P("q0"), P("q1")
            dl, dn = np.abs(fim - q0).mean(), np.abs(q1 - q0).mean()
            ok(dl <= 2 * dn + 0.05, f"emenda sem compressão: quadro {nq - 1}→0 {dl:.3f} vs 0→1 {dn:.3f}")
        else:
            ok(False, "quadros da emenda não encontrados (node scripts/quiz.mjs NN loop)")
        # PNG estático = o quadro dele no vídeo
        est = 0 if i in (0, n - 1) else round(4.6 * FPS)
        png = np.asarray(Image.open(out / f"lamina-{i + 1}.png").convert("RGB")).astype(np.float32)
        ok(psnr(png, quadro_cheio(mp4, est)) >= 35, f"lamina-{i + 1}.png = quadro {est} do vídeo (PSNR {psnr(png, quadro_cheio(mp4, est)):.1f} dB)")
        if i == 0:
            capa = np.asarray(Image.open(out / "capa-3x4.png").convert("RGB")).astype(np.float32)
            p0 = psnr(capa, quadro_cheio(mp4, 0))
            ok(capa.shape == (H, W, 3) and p0 >= 35, f"quadro 0 da lâmina 1 = capa-3x4.png (PSNR {p0:.1f} dB, {capa.shape[1]} × {capa.shape[0]})")
        # bordas (máscara sem fundo, meia resolução)
        masc = sorted((out / "revisao/mascara" / f"lamina-{i + 1}").glob("*.png"))
        if masc:
            x0, y0, x1, y1 = W, H, 0, 0
            for m in masc:
                al = np.asarray(Image.open(m).convert("RGBA"))[:, :, 3]
                ys, xs = np.nonzero(al > 32)
                if len(xs):
                    x0, x1, y0, y1 = min(x0, xs.min() * 2), max(x1, xs.max() * 2 + 1), min(y0, ys.min() * 2), max(y1, ys.max() * 2 + 1)
            ok(x0 >= X0 - 2 and x1 <= X1 + 2 and y0 >= Y0 and y1 <= Y1, f"conteúdo em x {x0}–{x1}, y {y0}–{y1} ({len(masc)} quadros; limite x 135–945, y 30–1410)")
        else:
            ok(False, "máscara não encontrada (node scripts/quiz.mjs NN mascara)")

    # a prévia: as lâminas (PNG estático) num contato 4 × 2, com o número e a duração
    th_w, th_h, gap, rot = 360, 480, 28, 54
    cols = 4
    rows = (n + cols - 1) // cols
    folha = Image.new("RGB", (cols * th_w + (cols + 1) * gap, rows * (th_h + rot) + (rows + 1) * gap), "#EFE4D4")
    try:
        f = ImageFont.truetype(str(next(RAIZ.glob("node_modules/@fontsource/poppins/files/poppins-latin-800-normal.woff"))), 26)
    except Exception:
        f = ImageFont.load_default()
    d = ImageDraw.Draw(folha)
    for i in range(n):
        im = Image.open(out / f"lamina-{i + 1}.png").convert("RGB").resize((th_w, th_h), Image.LANCZOS)
        x = gap + (i % cols) * (th_w + gap)
        y = gap + (i // cols) * (th_h + rot + gap)
        folha.paste(im, (x, y))
        tipo = "capa" if i == 0 else "resultado" if i == n - 1 else f"pergunta {i}/{n - 2}"
        d.text((x + 4, y + th_h + 12), f"{i + 1} · {tipo} · {duracoes[i]:.0f} s", fill="#221C19", font=f)
    folha.save(out / "previa.png")

    rel = out / "revisao/relatorio-tecnico.txt"
    rel.write_text("\n".join(linhas + ["", f"RESULTADO: {'aprovado' if not falhas else 'REPROVADO (' + str(len(falhas)) + ' falhas)'}"]) + "\n")
    print(rel.read_text())
    sys.exit(1 if falhas else 0)


if __name__ == "__main__":
    main()
