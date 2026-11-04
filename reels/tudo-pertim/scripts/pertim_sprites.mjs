// Gera os quadros do Pertim (src/personagem, V1) para o motor do Tudo Pertim: reels/tudo-pertim/src/pertim/<nome>.svg +
// manifest.json (viewBox e o ponto do chão de cada quadro, para o motor posicionar pelo pé).
//   node scripts/pertim_sprites.mjs
import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";

const AQUI = path.dirname(new URL(import.meta.url).pathname), RAIZ = path.resolve(AQUI, "..");
const out = await build({ entryPoints: [path.join(AQUI, "pertim_sprites.tsx")], bundle: true, write: false, platform: "node", format: "cjs", jsx: "automatic", logLevel: "error" });
const ctx = { module: { exports: {} }, require: createRequire(import.meta.url), console, process };
ctx.globalThis = ctx;
vm.runInNewContext(out.outputFiles[0].text, ctx);
const { QUADROS, ALTURA } = ctx.PERTIM_Q;
const dir = path.join(RAIZ, "src", "pertim");
fs.mkdirSync(dir, { recursive: true });
const manifest = { origem: "src/personagem (Pertim V1, componente oficial; nada redesenhado)", altura: ALTURA, quadros: {} };
for (const q of QUADROS) {
  fs.writeFileSync(path.join(dir, `${q.nome}.svg`), q.svg);
  manifest.quadros[q.nome] = { vb: q.vb, chao: q.chao };
}
fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 1));
console.log(`${QUADROS.length} quadros -> ${path.relative(RAIZ, dir)}`);
