// Série "Coisa de mineiro": o vídeo, a capa e quadros soltos de UM episódio (composições CoisaDeMineiro e
// CoisaDeMineiro-Capa, src/coisa-de-mineiro/CoisaDeMineiro.tsx; os dados em public/coisa-de-mineiro/<ep>/dados.json).
//   node reels/coisa-de-mineiro/scripts/render.mjs video 01-e-logo-ali     -> reels/coisa-de-mineiro/01-e-logo-ali/output/uaipertim-coisa-de-mineiro-01.mp4
//   node reels/coisa-de-mineiro/scripts/render.mjs capa 01-e-logo-ali      -> output/capa.png + output/capa-3x4.png (o recorte da grade)
//   node reels/coisa-de-mineiro/scripts/render.mjs quadros 01-e-logo-ali <dir> <seg> [seg …]   (para conferir antes do render inteiro)
//   node reels/coisa-de-mineiro/scripts/render.mjs mascara 01-e-logo-ali   -> output/revisao/mascara/ (para o qa.py: só os
//        personagens e o carro, cada um numa cor chapada, 10 quadros por segundo, em meia resolução)
// O áudio é a mixagem do pipeline do Explica, Sô! (reels/explica-so/audio/coisa-de-mineiro/<ep>/mix.wav).
import { bundle } from "@remotion/bundler";
import { openBrowser, renderFrames, renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const CANDIDATOS = [process.env.REMOTION_BROWSER, "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell",
  "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell"].filter(Boolean);
const browserExecutable = CANDIDATOS.find((p) => fs.existsSync(p)) ?? null;
const [modo, ep, ...resto] = process.argv.slice(2);
if (!modo || !ep) throw new Error("uso: render.mjs video|capa|quadros <ep> [...]");
const inputProps = modo === "mascara" ? { ep, mascara: true } : { ep };
const OUT = path.resolve("reels/coisa-de-mineiro", ep, "output");
const AUD = path.resolve("reels/explica-so/audio/coisa-de-mineiro", ep);
const numero = JSON.parse(fs.readFileSync(path.resolve("reels/coisa-de-mineiro", ep, "roteiro.json"), "utf-8")).numero;
fs.mkdirSync(path.join(OUT, "revisao"), { recursive: true });

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browser = await openBrowser("chrome", { browserExecutable });
const comp = (id) => selectComposition({ serveUrl, id, inputProps, puppeteerInstance: browser, browserExecutable });
const ff = (...a) => execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...a], { stdio: "inherit" });

if (modo === "video") {
  const composition = await comp("CoisaDeMineiro");
  const mudo = path.join(OUT, "revisao", "video-mudo.mp4");
  let ultimo = -1;
  await renderMedia({
    composition, serveUrl, inputProps, codec: "h264", crf: 16, pixelFormat: "yuv420p", imageFormat: "png", muted: true, outputLocation: mudo,
    puppeteerInstance: browser, browserExecutable, concurrency: 4,
    onProgress: ({ progress }) => { const p = Math.floor(progress * 10); if (p !== ultimo) { ultimo = p; process.stdout.write(`CoisaDeMineiro ${ep} ${p * 10}%\n`); } },
  });
  const mp4 = path.join(OUT, `uaipertim-coisa-de-mineiro-${String(numero).padStart(2, "0")}.mp4`);
  ff("-i", mudo, "-i", path.join(AUD, "mix.wav"), "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-ar", "48000",
    "-t", (composition.durationInFrames / composition.fps).toFixed(4), "-movflags", "+faststart", mp4);
  fs.rmSync(mudo);
  console.log("ok", path.relative(process.cwd(), mp4));
} else if (modo === "capa") {
  const composition = await comp("CoisaDeMineiro-Capa");
  const png = path.join(OUT, "capa.png");
  await renderStill({ composition, serveUrl, inputProps, frame: 0, output: png, puppeteerInstance: browser, browserExecutable });
  ff("-i", png, "-vf", "crop=1080:1440:0:240", path.join(OUT, "capa-3x4.png"));
  console.log("ok", path.relative(process.cwd(), png), "+ capa-3x4.png");
} else if (modo === "mascara") {
  const composition = await comp("CoisaDeMineiro");
  const outputDir = path.join(OUT, "revisao", "mascara");
  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.mkdirSync(outputDir, { recursive: true });
  await renderFrames({ composition, serveUrl, inputProps, outputDir, imageFormat: "png", everyNthFrame: 3, scale: 0.5, concurrency: 4,
    puppeteerInstance: browser, browserExecutable, onStart: () => {}, onFrameUpdate: () => {} });
  console.log("ok", path.relative(process.cwd(), outputDir), fs.readdirSync(outputDir).length, "quadros");
} else if (modo === "quadros") {
  const [dir, ...segs] = resto;
  fs.mkdirSync(dir, { recursive: true });
  const composition = await comp("CoisaDeMineiro");
  for (const s of segs) {
    const frame = Math.min(composition.durationInFrames - 1, Math.round(Number(s) * composition.fps));
    const output = path.join(dir, `q-${String(frame).padStart(5, "0")}.png`);
    await renderStill({ composition, serveUrl, inputProps, frame, output, puppeteerInstance: browser, browserExecutable });
    console.log("ok", output);
  }
}
await browser.close({ silent: true });
