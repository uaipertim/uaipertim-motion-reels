// Carrossel "Facim, facim": renderiza todos os slides de um carrossel a partir do JSON dele.
//   npm run carrossel -- 01        (ou o caminho: carrosseis/facim/01-antes-que-voce-pergunte.json)
// Saída: out/carrosseis/facim/NN-tema/slide-1.png … slide-N.png (1080×1350) + capa_3x4.png (recorte da grade).
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const arg = process.argv[2];
if (!arg) throw new Error("informe o número do carrossel (ex.: 01) ou o caminho do JSON");
const dir = path.resolve("carrosseis/facim");
const json = fs.existsSync(arg) ? path.resolve(arg) : path.join(dir, fs.readdirSync(dir).find((f) => f.startsWith(String(arg).padStart(2, "0") + "-")) ?? "");
if (!fs.existsSync(json)) throw new Error(`carrossel não encontrado: ${arg}`);
const data = JSON.parse(fs.readFileSync(json, "utf-8"));
const out = path.resolve("out/carrosseis/facim", path.basename(json, ".json"));
fs.mkdirSync(out, { recursive: true });

for (const [i, s] of data.slides.entries()) {
  const words = (s.texto ?? "").split(/\s+/).filter(Boolean).length;
  if (s.tipo === "conteudo" && words > 25) console.warn(`aviso: slide ${i + 1} tem ${words} palavras (o modelo pede até ~25)`);
}

const HEADLESS = process.env.REMOTION_BROWSER ?? "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const browserExecutable = fs.existsSync(HEADLESS) ? HEADLESS : null;
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browser = await openBrowser("chrome", { browserExecutable });
for (let i = 0; i < data.slides.length; i++) {
  const inputProps = { ...data, slide: i };
  const composition = await selectComposition({ serveUrl, id: "CarrosselFacim", inputProps, puppeteerInstance: browser, browserExecutable });
  const output = path.join(out, `slide-${i + 1}.png`);
  await renderStill({ composition, serveUrl, frame: 0, output, inputProps, puppeteerInstance: browser, browserExecutable });
  console.log("ok", path.relative(process.cwd(), output));
}
await browser.close({ silent: true });
// prévia da capa no recorte 3:4 da grade (1013×1350, centrado: ~34 px a menos de cada lado)
execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", path.join(out, "slide-1.png"), "-vf", "crop=1013:1350:34:0", path.join(out, "capa_3x4.png")]);
console.log("ok", path.relative(process.cwd(), path.join(out, "capa_3x4.png")));
