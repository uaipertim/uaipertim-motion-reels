// Exporta o Pertim em SVG estático, uma variação por arquivo (src/personagem/svg/<nome>.svg), a partir do componente
// React (src/personagem/Pertim.tsx). E, com --conferir, compara cada uma com o arquivo original do Claude Design
// (src/personagem/fonte/pertim-personagem.dc.html, renderizado com o próprio script dele): rasteriza as duas no Chromium e
// mede a diferença de pixels.
//   node scripts/personagem/exportar.mjs [--conferir]
import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const out = await build({ entryPoints: [path.join(RAIZ, "scripts/personagem/variacoes.tsx")], bundle: true, write: false, platform: "node", format: "cjs", jsx: "automatic", logLevel: "error" });
const ctx = { module: { exports: {} }, require: (await import("node:module")).createRequire(import.meta.url), console, process };
ctx.globalThis = ctx;
vm.runInNewContext(out.outputFiles[0].text, ctx);
const { VARIACOES, svgDe } = ctx.PERTIM;
const dir = path.join(RAIZ, "src/personagem/svg");
fs.mkdirSync(dir, { recursive: true });
for (const [nome, p] of VARIACOES) fs.writeFileSync(path.join(dir, `${nome}.svg`), svgDe(p));
console.log(`${VARIACOES.length} SVGs -> ${path.relative(RAIZ, dir)}`);

if (process.argv.includes("--conferir")) {
  // o original: o template do .dc.html com os valores do próprio script (renderVals)
  const html = fs.readFileSync(path.join(RAIZ, "src/personagem/fonte/pertim-personagem.dc.html"), "utf8");
  const tpl = html.slice(html.indexOf("<svg"), html.indexOf("</svg>") + 6);
  const code = html.slice(html.indexOf("class Component"), html.lastIndexOf("</script>"));
  const Component = vm.runInNewContext(`class DCLogic { constructor(p){ this.props = p; } } ${code}; Component`, {});
  const original = (p) => {
    const vals = new Component({ v: String(p.v ?? 1), view: p.view, expr: p.expr, mouth: p.mouth, pose: p.pose, crop: p.crop, layer: p.layer, h: 300 }).renderVals();
    return tpl.replace(/\{\{([\w.]+)\}\}/g, (_, k) => String(k.split(".").reduce((o, kk) => (o == null ? o : o[kk]), vals)));
  };
  // o Playwright do ambiente (como em reels/explica-so/scripts/render.cjs): local ou global
  const req = (await import("node:module")).createRequire(import.meta.url);
  let pw; try { pw = req("playwright"); } catch { pw = req(path.join((await import("node:child_process")).execSync("npm root -g").toString().trim(), "playwright")); }
  const { chromium } = pw;
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  const px = async (svg) => {
    await page.setContent(`<html><body style="margin:0;background:#fff">${svg}</body></html>`);
    return page.evaluate(async () => {
      const s = document.querySelector("svg"); const w = s.width.baseVal.value, h = s.height.baseVal.value;
      const img = new Image(); img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(new XMLSerializer().serializeToString(s))));
      await img.decode(); const c = document.createElement("canvas"); c.width = Math.round(w); c.height = Math.round(h);
      const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0);
      return { w: c.width, h: c.height, d: Array.from(g.getImageData(0, 0, c.width, c.height).data) };
    });
  };
  const linhas = []; let pior = 0;
  for (const [nome, p] of VARIACOES) {
    const a = await px(svgDe(p)), b = await px(original(p));
    if (a.w !== b.w || a.h !== b.h) { linhas.push(`${nome}: tamanho diferente ${a.w}x${a.h} × ${b.w}x${b.h}`); pior = 999; continue; }
    let soma = 0, dif = 0;
    for (let i = 0; i < a.d.length; i += 4) { const e = Math.abs(a.d[i] - b.d[i]) + Math.abs(a.d[i + 1] - b.d[i + 1]) + Math.abs(a.d[i + 2] - b.d[i + 2]); soma += e; if (e > 30) dif++; }
    const pct = (100 * dif) / (a.w * a.h); pior = Math.max(pior, pct);
    linhas.push(`${nome}: ${pct.toFixed(3)}% dos pixels diferentes (diferença média ${(soma / (a.w * a.h * 3)).toFixed(3)})`);
  }
  await browser.close();
  fs.writeFileSync(path.join(dir, "conferencia.txt"), `Conferência: componente React × original do Claude Design (${VARIACOES.length} variações, 300 px de altura)\n\n${linhas.join("\n")}\n\nRESULTADO: ${pior < 0.05 ? "idêntico (≤ 0,05% de pixels diferentes em todas)" : "DIFERENTE"}\n`);
  console.log(linhas.join("\n")); console.log("pior:", pior.toFixed(3) + "%");
}
