// Quadros soltos do Reel "Prazer, Pertim" (para conferir antes do render inteiro).
//   node reels/prazer-pertim/scripts/quadros.mjs <saida_dir> <id> <seg> [seg …]
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";

const HEADLESS = process.env.REMOTION_BROWSER ?? "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const browserExecutable = fs.existsSync(HEADLESS) ? HEADLESS : null;
const [dir, id, ...segs] = process.argv.slice(2);
fs.mkdirSync(dir, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browser = await openBrowser("chrome", { browserExecutable });
const composition = await selectComposition({ serveUrl, id, puppeteerInstance: browser, browserExecutable });
for (const s of segs) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(Number(s) * composition.fps));
  const output = path.join(dir, `${id}-${String(frame).padStart(5, "0")}.png`);
  await renderStill({ composition, serveUrl, frame, output, puppeteerInstance: browser, browserExecutable });
  console.log("ok", output);
}
await browser.close({ silent: true });
