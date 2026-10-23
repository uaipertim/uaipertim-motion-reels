// Capas novas dos Reels do Dicionário Mineiro (só PNG, para trocar a capa no app; os vídeos não mudam).
//   npm run capas:dicionario
// Saída em out/capas/dicionario/: capa-dicionario-0N-<palavra>.png (1080×1920), recorte-3x4.png (as 7 no recorte
// da grade) e grade-previa.png (a grade do perfil em 3 colunas, na ordem atual).
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const HEADLESS = process.env.REMOTION_BROWSER ?? "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const browserExecutable = fs.existsSync(HEADLESS) ? HEADLESS : null;
const out = path.resolve("out/capas/dicionario");
fs.mkdirSync(out, { recursive: true });
const eps = fs.readdirSync("episodios/dicionario").filter((f) => /^0[1-7]-.*\.json$/.test(f)).sort();
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browser = await openBrowser("chrome", { browserExecutable });
for (const f of eps) {
  const nn = f.slice(0, 2);
  const composition = await selectComposition({ serveUrl, id: `CapaDicionario-${nn}`, puppeteerInstance: browser, browserExecutable });
  const output = path.join(out, `capa-dicionario-${f.replace(".json", ".png")}`);
  await renderStill({ composition, serveUrl, frame: 0, output, puppeteerInstance: browser, browserExecutable });
  console.log("ok", path.relative(process.cwd(), output));
}
await browser.close({ silent: true });
execFileSync("python3", ["scripts/capas_dicionario_previas.py"], { stdio: "inherit" });
