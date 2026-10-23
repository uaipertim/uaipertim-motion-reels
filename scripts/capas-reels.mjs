// Capas novas dos Reels já publicados (só PNG, para "Editar capa → Adicionar da galeria"; os vídeos não mudam).
//   npm run capas:reels                  (todas)   ·   npm run capas:reels -- explica-so-01   (só essa)
// Saída: out/capas/reels/capa-<id>.png (1080×1920) + previa-3x4.png (as capas no recorte da grade). A do Explica, Sô! 01
// também é copiada para reels/explica-so/output/explica-so-01/capa-grade.png.
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition, getCompositions } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const HEADLESS = process.env.REMOTION_BROWSER ?? "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const browserExecutable = fs.existsSync(HEADLESS) ? HEADLESS : null;
const out = path.resolve("out/capas/reels");
fs.mkdirSync(out, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browser = await openBrowser("chrome", { browserExecutable });
const pedidos = process.argv.slice(2);
const ids = (await getCompositions(serveUrl, { puppeteerInstance: browser, browserExecutable })).map((c) => c.id)
  .filter((id) => id.startsWith("CapaReel-")).map((id) => id.slice("CapaReel-".length))
  .filter((id) => !pedidos.length || pedidos.includes(id));
for (const id of ids) {
  const composition = await selectComposition({ serveUrl, id: `CapaReel-${id}`, puppeteerInstance: browser, browserExecutable });
  const output = path.join(out, `capa-${id}.png`);
  await renderStill({ composition, serveUrl, frame: 0, output, puppeteerInstance: browser, browserExecutable });
  console.log("ok", path.relative(process.cwd(), output));
  if (id === "explica-so-01") {
    const grade = path.resolve("reels/explica-so/output/explica-so-01/capa-grade.png");
    fs.copyFileSync(output, grade);
    console.log("ok", path.relative(process.cwd(), grade));
  }
}
await browser.close({ silent: true });
execFileSync("python3", ["-c", `
import glob, os
from PIL import Image, ImageDraw
fs = sorted(glob.glob('out/capas/reels/capa-*.png'))
TW, TH, G = 360, 480, 12
sh = Image.new('RGB', (len(fs) * (TW + G) + G, TH + 2 * G), (40, 40, 40))
for i, f in enumerate(fs):
    t = Image.open(f).convert('RGB').crop((0, 240, 1080, 1680)).resize((TW, TH), Image.LANCZOS)
    d = ImageDraw.Draw(t); sx, sy = TW / 1080, TH / 1440
    d.rectangle((110 * sx, 60 * sy, 970 * sx, 1380 * sy), outline=(62, 158, 78))   # a zona segura (x 110–970, y 300–1620)
    d.polygon([(TW - 34, 12), (TW - 34, 34), (TW - 16, 23)], fill=(255, 255, 255))
    sh.paste(t, (G + i * (TW + G), G))
sh.save('out/capas/reels/previa-3x4.png')
print('ok out/capas/reels/previa-3x4.png')
`], { stdio: "inherit" });
