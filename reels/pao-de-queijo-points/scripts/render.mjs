// Reel "Pão de Queijo Points": o vídeo (composição PaoDeQueijoPoints, src/pao-de-queijo-points/PaoDeQueijoPoints.tsx) com a mixagem
// do pipeline do Explica, Sô! (reels/explica-so/audio/pao-de-queijo-points/mix.wav).
//   node reels/pao-de-queijo-points/scripts/render.mjs            -> output/uaipertim-pao-de-queijo-points.mp4 (1080×1920, 30 fps, H.264 + AAC 48 kHz)
//   node reels/pao-de-queijo-points/scripts/render.mjs mascara    -> output/revisao/mascara-{legenda,conteudo}/ (para o qa.py: só a legenda,
//        branca, e todo o conteúdo sem o fundo; 10 quadros por segundo, em meia resolução; fora do git)
//   node reels/pao-de-queijo-points/scripts/render.mjs capa       -> output/capa.png + capa-3x4.png (+ revisao/capa-sem-fundo.png)
//   node reels/pao-de-queijo-points/scripts/render.mjs quadros <dir> <seg> [seg …]   (quadros soltos para conferir)
import { bundle } from "@remotion/bundler";
import { openBrowser, renderFrames, renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const CANDIDATOS = [process.env.REMOTION_BROWSER, "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell",
  "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell"].filter(Boolean);
const browserExecutable = CANDIDATOS.find((p) => fs.existsSync(p)) ?? null;
const OUT = path.resolve("reels/pao-de-queijo-points/output");
const AUD = path.resolve("reels/explica-so/audio/pao-de-queijo-points");
const [modo = "video", ...resto] = process.argv.slice(2);
fs.mkdirSync(path.join(OUT, "revisao"), { recursive: true });

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browser = await openBrowser("chrome", { browserExecutable });
const comp = (inputProps) => selectComposition({ serveUrl, id: "PaoDeQueijoPoints", inputProps, puppeteerInstance: browser, browserExecutable });

if (modo === "video") {
  const composition = await comp({});
  const mudo = path.join(OUT, "revisao", "video-mudo.mp4");
  let ultimo = -1;
  await renderMedia({
    composition, serveUrl, codec: "h264", crf: 16, pixelFormat: "yuv420p", imageFormat: "png", muted: true, outputLocation: mudo,
    puppeteerInstance: browser, browserExecutable, concurrency: 4,
    onProgress: ({ progress }) => { const p = Math.floor(progress * 10); if (p !== ultimo) { ultimo = p; process.stdout.write(`PaoDeQueijoPoints ${p * 10}%\n`); } },
  });
  const mp4 = path.join(OUT, "uaipertim-pao-de-queijo-points.mp4");
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", mudo, "-i", path.join(AUD, "mix.wav"), "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k",
    "-ar", "48000", "-t", (composition.durationInFrames / composition.fps).toFixed(4), "-movflags", "+faststart", mp4], { stdio: "inherit" });
  fs.rmSync(mudo);
  console.log("ok", path.relative(process.cwd(), mp4));
} else if (modo === "mascara") {
  for (const m of ["legenda", "conteudo"]) {
    const inputProps = { mascara: m };
    const composition = await comp(inputProps);
    const outputDir = path.join(OUT, "revisao", `mascara-${m}`);
    fs.rmSync(outputDir, { recursive: true, force: true });
    fs.mkdirSync(outputDir, { recursive: true });
    await renderFrames({ composition, serveUrl, inputProps, outputDir, imageFormat: "png", everyNthFrame: 3, scale: 0.5, concurrency: 4,
      puppeteerInstance: browser, browserExecutable, onStart: () => {}, onFrameUpdate: () => {} });
    console.log("ok mascara", m);
  }
} else if (modo === "capa") {
  // a capa (CapaReel-pao-de-queijo-points, src/covers/capasReels.ts): capa.png (9:16), capa-3x4.png (o recorte da grade,
  // y 240–1680) e, para o qa.py, a capa sem o fundo (revisao/capa-sem-fundo.png)
  const id = "CapaReel-pao-de-queijo-points";
  const c = await selectComposition({ serveUrl, id, puppeteerInstance: browser, browserExecutable });
  const png = path.join(OUT, "capa.png");
  await renderStill({ composition: c, serveUrl, frame: 0, output: png, puppeteerInstance: browser, browserExecutable });
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", png, "-vf", "crop=1080:1440:0:240", path.join(OUT, "capa-3x4.png")]);
  const inputProps = { ...c.props, semFundo: true };
  const c2 = await selectComposition({ serveUrl, id, inputProps, puppeteerInstance: browser, browserExecutable });
  await renderStill({ composition: c2, serveUrl, frame: 0, output: path.join(OUT, "revisao", "capa-sem-fundo.png"), inputProps, imageFormat: "png", puppeteerInstance: browser, browserExecutable });
  console.log("ok", path.relative(process.cwd(), png), "+ capa-3x4.png + revisao/capa-sem-fundo.png");
} else if (modo === "quadros") {
  const [dir, ...segs] = resto;
  const composition = await comp({});
  fs.mkdirSync(dir, { recursive: true });
  for (const s of segs) {
    const frame = Math.min(composition.durationInFrames - 1, Math.round(Number(s) * composition.fps));
    const output = path.join(dir, `q-${String(frame).padStart(5, "0")}.png`);
    await renderStill({ composition, serveUrl, frame, output, puppeteerInstance: browser, browserExecutable });
    console.log("ok", output);
  }
}
await browser.close({ silent: true });
