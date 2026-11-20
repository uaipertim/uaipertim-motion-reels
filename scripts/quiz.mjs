// Carrossel animado "Quiz" (composição QuizMineiro, src/quiz/QuizMineiro.tsx; dados em carrosseis/quiz/NN-tema.json).
//   node scripts/quiz.mjs 01                    -> out/carrosseis/quiz/<pasta>/lamina-1..N.mp4 + lamina-1..N.png + capa-3x4.png
//   node scripts/quiz.mjs 01 quadros <lamina> <quadro> [quadro …]   -> out/…/revisao/quadros/ (conferir antes do render)
//   SO=3,5,6 node scripts/quiz.mjs 01 …     -> só as lâminas 3, 5 e 6
//   node scripts/quiz.mjs 01 loop               -> out/…/revisao/loop/ (quadros D-1, 0 e 1 em PNG, para o qa)
//   node scripts/quiz.mjs 01 mascara            -> out/…/revisao/mascara/ (sem fundo, para o qa: o conteúdo em x 135–945)
// Depois: python3 scripts/quiz_qa.py 01 (a revisão técnica + a prévia).
// O mesmo motor serve os outros carrosséis animados: passe o caminho do JSON (ex.: carrosseis/animados/02-como-chega-o-seu-pedido.json).
// Um JSON com "composicao" diz a composição, a pasta de saída ("saida"), as lâminas ("laminas", cada uma com "estatico" em s)
// e o nome da capa ("capa_arquivo", ex.: capa-4x5.png); sem ele, vale o Quiz (QuizMineiro, out/carrosseis/quiz/, capa-3x4.png).
import { bundle } from "@remotion/bundler";
import { openBrowser, renderFrames, renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const CANDIDATOS = [process.env.REMOTION_BROWSER, "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell",
  "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell"].filter(Boolean);
const browserExecutable = CANDIDATOS.find((p) => fs.existsSync(p)) ?? null;
const [arg, modo = "tudo", ...resto] = process.argv.slice(2);
if (!arg) throw new Error("uso: quiz.mjs <NN> [tudo|quadros|mascara] [...]");
const dir = path.resolve("carrosseis/quiz");
const json = fs.existsSync(arg) ? path.resolve(arg) : path.join(dir, fs.readdirSync(dir).find((f) => f.startsWith(String(arg).padStart(2, "0") + "-")) ?? "");
const data = JSON.parse(fs.readFileSync(json, "utf-8"));
const GEN = Boolean(data.composicao);
const ID = GEN ? data.composicao : "QuizMineiro";
const CAPA = GEN ? data.capa_arquivo : "capa-3x4.png";
const OUT = GEN ? path.resolve(data.saida) : path.resolve("out/carrosseis/quiz", data.pasta);
const REV = path.join(OUT, "revisao");
fs.mkdirSync(REV, { recursive: true });
const N = GEN ? data.laminas.length : data.perguntas.length + 2;
// SO=3,5,6 (opcional): só essas lâminas (numeradas de 1), em qualquer modo
const SO = process.env.SO ? process.env.SO.split(",").map((x) => Number(x) - 1) : null;
const vale = (i) => !SO || SO.includes(i);
const estatico = (i) => (GEN ? Math.round((data.laminas[i].estatico ?? 0) * 30) : i === 0 || i === N - 1 ? 0 : Math.round(4.6 * 30));   // = quadroEstatico() da composição

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browser = await openBrowser("chrome", { browserExecutable });
const comp = (inputProps) => selectComposition({ serveUrl, id: ID, inputProps, puppeteerInstance: browser, browserExecutable });
const ff = (...a) => execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...a], { stdio: "inherit" });

if (modo === "quadros") {
  const [lam, ...quadros] = resto.map(Number);
  const inputProps = { ...data, lamina: lam - 1 };
  const composition = await comp(inputProps);
  fs.mkdirSync(path.join(REV, "quadros"), { recursive: true });
  for (const q of quadros) {
    const output = path.join(REV, "quadros", `l${lam}-q${String(q).padStart(3, "0")}.png`);
    await renderStill({ composition, serveUrl, frame: q, output, inputProps, puppeteerInstance: browser, browserExecutable, scale: 0.5 });
    console.log("ok", path.relative(process.cwd(), output));
  }
} else if (modo === "loop") {
  // a emenda do loop sem compressão: os quadros D-1, 0 e 1 de cada lâmina (o qa compara D-1→0 com 0→1)
  fs.mkdirSync(path.join(REV, "loop"), { recursive: true });
  for (let i = 0; i < N; i++) {
    if (!vale(i)) continue;
    const inputProps = { ...data, lamina: i };
    const composition = await comp(inputProps);
    const D = composition.durationInFrames;
    for (const [nome, q] of [["fim", D - 1], ["q0", 0], ["q1", 1]]) {
      await renderStill({ composition, serveUrl, frame: q, output: path.join(REV, "loop", `lamina-${i + 1}-${nome}.png`), inputProps, puppeteerInstance: browser, browserExecutable });
    }
    console.log("ok loop", i + 1);
  }
} else if (modo === "mascara") {
  // sem o fundo (PNG com transparência), 1 quadro a cada 5, em meia resolução: o qa mede onde há conteúdo
  for (let i = 0; i < N; i++) {
    if (!vale(i)) continue;
    const inputProps = { ...data, lamina: i, semFundo: true };
    const composition = await comp(inputProps);
    const outputDir = path.join(REV, "mascara", `lamina-${i + 1}`);
    fs.rmSync(outputDir, { recursive: true, force: true });
    fs.mkdirSync(outputDir, { recursive: true });
    await renderFrames({ composition, serveUrl, inputProps, outputDir, imageFormat: "png", everyNthFrame: 5, scale: 0.5, concurrency: 4,
      puppeteerInstance: browser, browserExecutable, onStart: () => {}, onFrameUpdate: () => {} });
    console.log("ok mascara", i + 1);
  }
} else {
  for (let i = 0; i < N; i++) {
    if (!vale(i)) continue;
    const inputProps = { ...data, lamina: i };
    const composition = await comp(inputProps);
    const bruto = path.join(REV, `lamina-${i + 1}-bruto.mp4`);
    await renderMedia({
      composition, serveUrl, inputProps, codec: "h264", crf: (GEN && data.laminas[i].crf) || 17, pixelFormat: "yuv420p", imageFormat: "png", muted: true, outputLocation: bruto,
      puppeteerInstance: browser, browserExecutable, concurrency: 4, x264Preset: "slow",
      // nos carrosséis com "composicao": o último quadro também é quadro-chave (I), como o primeiro, para a emenda do loop
      // não ganhar a diferença de compressão de um quadro P longe do I
      ffmpegOverride: GEN ? ({ type, args }) => (type === "pre-stitcher" ? [...args.slice(0, -1), "-force_key_frames", `expr:eq(n,0)+eq(n,${composition.durationInFrames - 1})`, args[args.length - 1]] : args) : undefined,
    });
    // sem trilha de áudio nenhuma, faststart para o upload
    const mp4 = path.join(OUT, `lamina-${i + 1}.mp4`);
    ff("-i", bruto, "-map", "0:v:0", "-c:v", "copy", "-an", "-movflags", "+faststart", mp4);
    fs.rmSync(bruto);
    const png = path.join(OUT, `lamina-${i + 1}.png`);
    await renderStill({ composition, serveUrl, frame: estatico(i), output: png, inputProps, puppeteerInstance: browser, browserExecutable });
    if (i === 0) fs.copyFileSync(png, path.join(OUT, CAPA));   // a capa da grade = o quadro 0 da lâmina 1
    console.log("ok", `lamina-${i + 1}.mp4 (${composition.durationInFrames} quadros) + lamina-${i + 1}.png`);
  }
}
await browser.close({ silent: true });
