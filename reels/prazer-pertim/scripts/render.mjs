// Reel de teste "Prazer, Pertim": o vídeo, a capa e o teste da boca, a partir das composições do Remotion
// (src/prazer-pertim/PrazerPertim.tsx) e da mixagem do pipeline do Explica, Sô! (audio/prazer-pertim/mix.wav).
//   node reels/prazer-pertim/scripts/render.mjs [video] [capa] [boca]      (sem argumentos: os três)
// Saída em reels/prazer-pertim/output/: uaipertim-prazer-pertim.mp4, capa.png, revisao/boca-teste.mp4.
import { bundle } from "@remotion/bundler";
import { openBrowser, renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const HEADLESS = process.env.REMOTION_BROWSER ?? "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const browserExecutable = fs.existsSync(HEADLESS) ? HEADLESS : null;
const OUT = path.resolve("reels/prazer-pertim/output");
const AUD = path.resolve("reels/explica-so/audio/prazer-pertim");
fs.mkdirSync(path.join(OUT, "revisao"), { recursive: true });
const pedidos = process.argv.slice(2);
const quer = (x) => !pedidos.length || pedidos.includes(x);

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browser = await openBrowser("chrome", { browserExecutable });
const comp = (id) => selectComposition({ serveUrl, id, puppeteerInstance: browser, browserExecutable });
const ff = (...a) => execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...a], { stdio: "inherit" });
const video = async (id, mudo) => {
  const composition = await comp(id);
  let ultimo = -1;
  await renderMedia({
    composition, serveUrl, codec: "h264", crf: 16, pixelFormat: "yuv420p", imageFormat: "png", muted: true, outputLocation: mudo,
    puppeteerInstance: browser, browserExecutable, concurrency: 4,
    onProgress: ({ progress }) => { const p = Math.floor(progress * 10); if (p !== ultimo) { ultimo = p; process.stdout.write(`${id} ${p * 10}%\n`); } },
  });
  return composition;
};

if (quer("video")) {
  const mudo = path.join(OUT, "revisao", "video-mudo.mp4");
  const c = await video("PrazerPertim", mudo);
  const mp4 = path.join(OUT, "uaipertim-prazer-pertim.mp4");
  ff("-i", mudo, "-i", path.join(AUD, "mix.wav"), "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-ar", "48000",
    "-t", (c.durationInFrames / c.fps).toFixed(4), "-movflags", "+faststart", mp4);
  fs.rmSync(mudo);
  console.log("ok", path.relative(process.cwd(), mp4));
}
if (quer("capa")) {
  const composition = await comp("PrazerPertim-Capa");
  const png = path.join(OUT, "capa.png");
  await renderStill({ composition, serveUrl, frame: 0, output: png, puppeteerInstance: browser, browserExecutable });
  console.log("ok", path.relative(process.cwd(), png));
}
if (quer("boca")) {
  // só o rosto, falando a cena 1, com a voz sozinha (sem trilha nem efeitos) para conferir a sincronia
  const mudo = path.join(OUT, "revisao", "boca-mudo.mp4");
  const c = await video("PertimBocaTeste", mudo);
  const mp4 = path.join(OUT, "revisao", "boca-teste.mp4");
  ff("-i", mudo, "-i", path.join(AUD, "voz.wav"), "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
    "-t", (c.durationInFrames / c.fps).toFixed(4), "-movflags", "+faststart", mp4);
  fs.rmSync(mudo);
  console.log("ok", path.relative(process.cwd(), mp4));
}
await browser.close({ silent: true });
