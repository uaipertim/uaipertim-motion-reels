// Renderiza quadros-chave para revisão: node scripts/stills.mjs 12 45 120 ...
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition, openBrowser } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";

const frames = process.argv.slice(2).map(Number);
const out = path.resolve("out/stills");
fs.mkdirSync(out, { recursive: true });
const HEADLESS = process.env.REMOTION_BROWSER ?? "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const browserExecutable = fs.existsSync(HEADLESS) ? HEADLESS : null;
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browser = await openBrowser("chrome", { browserExecutable });
const composition = await selectComposition({ serveUrl, id: process.env.COMP ?? "Video1-NaoPrecisaBaixar", puppeteerInstance: browser, browserExecutable });
for (const frame of frames) {
  const output = path.join(out, `f${String(frame).padStart(3, "0")}.png`);
  await renderStill({ composition, serveUrl, frame, output, puppeteerInstance: browser, browserExecutable, scale: 0.5 });
  console.log("ok", output);
}
await browser.close({ silent: true });
