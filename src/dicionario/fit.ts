import { FONT } from "../config/theme";

// Medição de texto no navegador (canvas) para o modelo do Dicionário Mineiro: cada episódio tem textos de
// tamanhos diferentes, então o tamanho da fonte e as quebras de linha saem daqui (calculateMetadata),
// sempre dentro das zonas seguras. Precisa das fontes carregadas (fontsReady) antes.

let ctx: CanvasRenderingContext2D | null = null;
const measure = (text: string, size: number, weight: number) => {
  if (!ctx) ctx = document.createElement("canvas").getContext("2d");
  ctx!.font = `${weight} ${size}px ${FONT}, "Noto Color Emoji"`;
  return ctx!.measureText(text).width;
};

export type Wrapped = { size: number; lines: string[] };

// Quebra gulosa por palavra.
export const wrap = (text: string, size: number, weight: number, maxWidth: number): string[] => {
  const lines: string[] = [];
  let cur = "";
  for (const w of text.split(/ +/).filter(Boolean)) {  // só espaço comum: o NBSP (ex.: antes do emoji) não quebra
    const next = cur ? `${cur} ${w}` : w;
    if (cur && measure(next, size, weight) > maxWidth) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
};

// Maior tamanho da lista em que o texto cabe em até maxLines linhas de largura maxWidth.
export const fitWrap = (text: string, weight: number, maxWidth: number, sizes: number[], maxLines: number): Wrapped => {
  for (const size of sizes) {
    const lines = wrap(text, size, weight, maxWidth);
    if (lines.length <= maxLines && lines.every((l) => measure(l, size, weight) <= maxWidth)) return { size, lines };
  }
  const size = sizes[sizes.length - 1];
  return { size, lines: wrap(text, size, weight, maxWidth) };
};

// Palavra da capa: maior tamanho (até maxSize) em que cada linha ocupa no máximo maxWidth.
// Palavras compostas ("Num dou conta") podem ir em 2 linhas se isso deixar a palavra bem maior.
// letterSpacing da capa = -0.02 em (o mesmo das capas da série).
export const fitCover = (word: string, maxWidth: number, maxSize: number): Wrapped & { widths: number[] } => {
  const W = 900;
  const at100 = (t: string) => measure(t, 100, W) / 100 - 0.02 * (t.length - 1) / 1;
  const sizeFor = (lines: string[]) => Math.min(maxSize, Math.floor(maxWidth / Math.max(...lines.map(at100))));
  let best: string[] = [word];
  let bestSize = sizeFor(best);
  const words = word.split(/\s+/);
  for (let i = 1; i < words.length; i++) {
    const cand = [words.slice(0, i).join(" "), words.slice(i).join(" ")];
    const s = sizeFor(cand);
    if (s > bestSize * 1.25) {
      best = cand;
      bestSize = s;
    }
  }
  return { size: bestSize, lines: best, widths: best.map((l) => at100(l) * bestSize) };
};
