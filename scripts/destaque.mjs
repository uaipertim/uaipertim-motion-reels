// Stories de destaque, no padrão do Story "Conheça": cada card é uma cena animada própria (src/story/destaques/).
//   npm run destaque -- duvidas      (ou lojista, explica-so)
//   npm run destaque -- capas        (as 4 capas dos destaques + a prévia de como ficam no perfil)
// Para um destaque: 1) áudio (python3 audio/destaque.py <nome>: a trilha do "Conheça" + efeitos nos beats da
// timeline, -14 LUFS, cortada em card1..cardN.wav); 2) cada card -> out/destaques/<nome>/card-N.mp4 (6 s, 1080×1920,
// 30 fps, AAC 48 kHz) + card-N.png (o quadro final); 3) out/destaques/<nome>/storyboard.jpg (0,5 s, 2 s e 5,5 s de cada card).
import { bundle } from "@remotion/bundler";
import { openBrowser, renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const arg = process.argv[2];
if (!arg) throw new Error("informe o destaque (duvidas, lojista, explica-so) ou 'capas'");
const IDS = { duvidas: "Duvidas", lojista: "Lojista", "explica-so": "ExplicaSo" };
const HEADLESS = process.env.REMOTION_BROWSER ?? "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const browserExecutable = fs.existsSync(HEADLESS) ? HEADLESS : null;

if (arg !== "capas") {
  if (!IDS[arg]) throw new Error(`destaque desconhecido: ${arg}`);
  execFileSync("python3", ["audio/destaque.py", arg], { stdio: "inherit" });
}
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
  const tl = JSON.parse(fs.readFileSync(`src/story/destaques/config/${arg}.json`, "utf-8"));
  const n = Object.keys(tl.scenes).length;
  const out = path.resolve("out/destaques", arg);
  fs.mkdirSync(out, { recursive: true });
  for (const f of fs.readdirSync(out)) if (/^card-\d+\.(mp4|png)$/.test(f)) fs.unlinkSync(path.join(out, f));
  for (let i = 0; i < n; i++) {
    const id = `Destaque-${IDS[arg]}-Card${i + 1}`;
    const composition = await selectComposition({ serveUrl, id, puppeteerInstance: browser, browserExecutable });
    const mp4 = path.join(out, `card-${i + 1}.mp4`);
    await renderMedia({ composition, serveUrl, codec: "h264", outputLocation: mp4, puppeteerInstance: browser, browserExecutable, audioCodec: "aac", audioBitrate: "256k", pixelFormat: "yuv420p", crf: 16 });
    const png = path.join(out, `card-${i + 1}.png`);
    await renderStill({ composition, serveUrl, frame: composition.durationInFrames - 1, output: png, puppeteerInstance: browser, browserExecutable });
    console.log("ok", path.relative(process.cwd(), mp4), "+", path.basename(png));
  }
  await browser.close({ silent: true });
  execFileSync("python3", ["scripts/destaque_storyboard.py", arg], { stdio: "inherit" });
}
