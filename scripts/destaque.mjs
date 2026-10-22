// Stories de destaque: renderiza todos os cards de um destaque a partir do JSON dele, e as capas dos destaques.
//   npm run destaque -- duvidas      (ou o caminho: stories/destaques/duvidas.json)
//   npm run destaque -- capas        (as 4 capas + a prévia de como ficam no perfil)
// Saída: out/destaques/<nome>/card-N.mp4 (6 s, 1080×1920, 30 fps, AAC 48 kHz, -14 LUFS) + card-N.png (o quadro final)
//        out/destaques/capas/<capa>.png + previa.png
import { bundle } from "@remotion/bundler";
import { openBrowser, renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const arg = process.argv[2];
if (!arg) throw new Error("informe o destaque (ex.: duvidas) ou 'capas'");
const HEADLESS = process.env.REMOTION_BROWSER ?? "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const browserExecutable = fs.existsSync(HEADLESS) ? HEADLESS : null;

// a trilha leve (gerada uma vez, sintetizada pelo projeto)
if (!fs.existsSync("public/audio/destaques/trilha.wav")) execFileSync("python3", ["audio/destaque_trilha.py"], { stdio: "inherit" });

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browser = await openBrowser("chrome", { browserExecutable });

if (arg === "capas") {
  const out = path.resolve("out/destaques/capas");
  fs.mkdirSync(out, { recursive: true });
  for (const icone of ["conheca", "duvidas", "lojista", "explica-so"]) {
    const inputProps = { icone };
    const composition = await selectComposition({ serveUrl, id: "Destaque-Capa", inputProps, puppeteerInstance: browser, browserExecutable });
    const output = path.join(out, `${icone}.png`);
    await renderStill({ composition, serveUrl, frame: 0, output, inputProps, puppeteerInstance: browser, browserExecutable });
    console.log("ok", path.relative(process.cwd(), output));
  }
  await browser.close({ silent: true });
  execFileSync("python3", ["scripts/destaque_previa.py"], { stdio: "inherit" });
} else {
  const dir = path.resolve("stories/destaques");
  const json = fs.existsSync(arg) ? path.resolve(arg) : path.join(dir, `${arg}.json`);
  if (!fs.existsSync(json)) throw new Error(`destaque não encontrado: ${arg}`);
  const data = JSON.parse(fs.readFileSync(json, "utf-8"));
  const out = path.resolve("out/destaques", path.basename(json, ".json"));
  fs.mkdirSync(out, { recursive: true });
  for (let i = 0; i < data.cards.length; i++) {
    const inputProps = { ...data, card: i };
    const composition = await selectComposition({ serveUrl, id: "Story-Destaque", inputProps, puppeteerInstance: browser, browserExecutable });
    const mp4 = path.join(out, `card-${i + 1}.mp4`);
    await renderMedia({ composition, serveUrl, codec: "h264", outputLocation: mp4, inputProps, puppeteerInstance: browser, browserExecutable, audioCodec: "aac", audioBitrate: "256k", pixelFormat: "yuv420p", crf: 16 });
    const png = path.join(out, `card-${i + 1}.png`);
    await renderStill({ composition, serveUrl, frame: composition.durationInFrames - 1, output: png, inputProps, puppeteerInstance: browser, browserExecutable });
    console.log("ok", path.relative(process.cwd(), mp4), "+", path.basename(png));
  }
  await browser.close({ silent: true });
}
