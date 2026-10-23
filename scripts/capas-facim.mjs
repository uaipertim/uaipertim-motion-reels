// Capas novas dos carrosséis "Facim Facim" (só o slide-1; os slides 2–6 não mudam), no modelo das capas do Dicionário.
//   npm run capas:facim            (todos os carrosséis com "capaNova" no JSON)
//   npm run capas:facim -- 07 09   (só esses)
// Saída: out/carrosseis/facim/NN-tema/slide-1.png (1080×1350) + capa_3x4.png (o recorte da grade) e, no fim,
// out/carrosseis/facim/capas-novas-previa.png (as capas novas no recorte 3:4) e out/capas/grade-previa-final.png.
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const dir = path.resolve("carrosseis/facim");
const pedidos = process.argv.slice(2).map((n) => String(n).padStart(2, "0"));
const jsons = fs.readdirSync(dir).filter((f) => /^\d\d-.*\.json$/.test(f)).sort()
  .filter((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8")).capaNova)
  .filter((f) => !pedidos.length || pedidos.includes(f.slice(0, 2)));
const HEADLESS = process.env.REMOTION_BROWSER ?? "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const browserExecutable = fs.existsSync(HEADLESS) ? HEADLESS : null;
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browser = await openBrowser("chrome", { browserExecutable });
for (const f of jsons) {
  const out = path.resolve("out/carrosseis/facim", path.basename(f, ".json"));
  fs.mkdirSync(out, { recursive: true });
  const composition = await selectComposition({ serveUrl, id: `CapaFacim-${f.slice(0, 2)}`, puppeteerInstance: browser, browserExecutable });
  const output = path.join(out, "slide-1.png");
  await renderStill({ composition, serveUrl, frame: 0, output, puppeteerInstance: browser, browserExecutable });
  // o recorte 3:4 da grade (1013×1350, centrado), como no npm run carrossel
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", output, "-vf", "crop=1013:1350:34:0", path.join(out, "capa_3x4.png")]);
  console.log("ok", path.relative(process.cwd(), output));
}
await browser.close({ silent: true });
execFileSync("python3", ["scripts/capas_facim_previas.py"], { stdio: "inherit" });
