// Reel "Bateu a fome?": o vídeo (composição BateuAFome, src/bateu-a-fome/BateuAFome.tsx) com a mixagem do pipeline do
// Explica, Sô! (reels/explica-so/audio/bateu-a-fome/mix.wav).
//   node reels/bateu-a-fome/scripts/render.mjs          -> reels/bateu-a-fome/output/uaipertim-bateu-a-fome.mp4 (1080×1920, 30 fps, H.264 + AAC 48 kHz)
//   node reels/bateu-a-fome/scripts/render.mjs previa   -> reels/bateu-a-fome/output/previa/uaipertim-bateu-a-fome-previa.mp4 (para revisar; fora do git)
import { bundle } from "@remotion/bundler";
import { openBrowser, renderMedia, selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const CANDIDATOS = [process.env.REMOTION_BROWSER, "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell",
  "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell"].filter(Boolean);
const browserExecutable = CANDIDATOS.find((p) => fs.existsSync(p)) ?? null;
const OUT = path.resolve("reels/bateu-a-fome/output");
const AUD = path.resolve("reels/explica-so/audio/bateu-a-fome");
fs.mkdirSync(path.join(OUT, "revisao"), { recursive: true });

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browser = await openBrowser("chrome", { browserExecutable });
const composition = await selectComposition({ serveUrl, id: "BateuAFome", puppeteerInstance: browser, browserExecutable });
const mudo = path.join(OUT, "revisao", "video-mudo.mp4");
let ultimo = -1;
await renderMedia({
  composition, serveUrl, codec: "h264", crf: 16, pixelFormat: "yuv420p", imageFormat: "png", muted: true, outputLocation: mudo,
  puppeteerInstance: browser, browserExecutable, concurrency: 4,
  onProgress: ({ progress }) => { const p = Math.floor(progress * 10); if (p !== ultimo) { ultimo = p; process.stdout.write(`BateuAFome ${p * 10}%\n`); } },
});
const PREVIA = process.argv.includes("previa");
if (PREVIA) fs.mkdirSync(path.join(OUT, "previa"), { recursive: true });
const mp4 = PREVIA ? path.join(OUT, "previa", "uaipertim-bateu-a-fome-previa.mp4") : path.join(OUT, "uaipertim-bateu-a-fome.mp4");
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", mudo, "-i", path.join(AUD, "mix.wav"), "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k",
  "-ar", "48000", "-t", (composition.durationInFrames / composition.fps).toFixed(4), "-movflags", "+faststart", mp4], { stdio: "inherit" });
fs.rmSync(mudo);
console.log("ok", path.relative(process.cwd(), mp4));
await browser.close({ silent: true });
