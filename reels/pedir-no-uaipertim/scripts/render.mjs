// Reel "Pedir no UaiPertim é assim": o vídeo, a partir da composição Remotion (src/pedir-no-uaipertim/) e da mixagem do
// pipeline do Explica, Sô! (reels/explica-so/audio/pedir-no-uaipertim/mix.wav).
//   node reels/pedir-no-uaipertim/scripts/render.mjs   -> reels/pedir-no-uaipertim/output/uaipertim-pedir-no-uaipertim.mp4
import { bundle } from "@remotion/bundler";
import { openBrowser, renderMedia, selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const HEADLESS = process.env.REMOTION_BROWSER ?? "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const browserExecutable = fs.existsSync(HEADLESS) ? HEADLESS : null;
const OUT = path.resolve("reels/pedir-no-uaipertim/output");
const MIX = path.resolve("reels/explica-so/audio/pedir-no-uaipertim/mix.wav");
fs.mkdirSync(path.join(OUT, "revisao"), { recursive: true });

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browser = await openBrowser("chrome", { browserExecutable });
const composition = await selectComposition({ serveUrl, id: "PedirNoUaiPertim", puppeteerInstance: browser, browserExecutable });
const mudo = path.join(OUT, "revisao", "video-mudo.mp4");
let ultimo = -1;
await renderMedia({
  composition, serveUrl, codec: "h264", crf: 16, pixelFormat: "yuv420p", imageFormat: "png", muted: true, outputLocation: mudo,
  puppeteerInstance: browser, browserExecutable, concurrency: 4,
  onProgress: ({ progress }) => { const p = Math.floor(progress * 10); if (p !== ultimo) { ultimo = p; process.stdout.write(`${p * 10}%\n`); } },
});
await browser.close({ silent: true });
const mp4 = path.join(OUT, "uaipertim-pedir-no-uaipertim.mp4");
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", mudo, "-i", MIX, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-ar", "48000",
  "-t", (composition.durationInFrames / composition.fps).toFixed(4), "-movflags", "+faststart", mp4], { stdio: "inherit" });
fs.rmSync(mudo);
console.log("ok", path.relative(process.cwd(), mp4));
