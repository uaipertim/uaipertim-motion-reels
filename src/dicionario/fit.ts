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

export type Wrapped = { size: number; lines: string[]; ok?: boolean }; // ok = toda linha cabe na largura

// Quebra de linha: o MENOR número de linhas possível e, entre as opções com esse número, a mais equilibrada
// (linhas de largura parecida). Regra fixa: as duas últimas palavras de uma frase (até . ! ? …) nunca ficam
// em linhas diferentes (ex.: "Pertinho. / Bem perto.", nunca "Pertinho. Bem / perto.").
// Emoji não conta como palavra: ele vai sempre grudado na última palavra (NBSP) e, com relaxEmoji, a
// penúltima pode subir para a linha de cima (fitWrap só usa isso quando permite um tamanho maior).
const EMOJI = /\p{Extended_Pictographic}/u;
const CLOSES = /[.!?…]["”’)]*$/;
const widthCache = new Map<string, number>();
export const wrap = (text: string, size: number, weight: number, maxWidth: number, relaxEmoji = false): string[] => {
  const words = text.split(/ +/).filter(Boolean); // só espaço comum: o NBSP (ex.: antes do emoji) não quebra
  const n = words.length;
  if (n === 0) return [];
  const w = (i: number, j: number) => {
    const t = words.slice(i, j).join(" ");
    const key = `${weight}|${size}|${t}`;
    if (!widthCache.has(key)) widthCache.set(key, measure(t, size, weight));
    return widthCache.get(key)!;
  };
  const closes = (i: number) => i === n - 1 || CLOSES.test(words[i]);
  // não pode quebrar antes da palavra i se ela fecha a frase e a anterior não (separaria as duas últimas)
  const canBreakBefore = (i: number) => i === 0 || !(closes(i) && !closes(i - 1)) || (relaxEmoji && EMOJI.test(words[i]));
  // best[j] = [linhas, custo, início da última linha] para as j primeiras palavras
  const best: Array<[number, number, number] | null> = Array(n + 1).fill(null);
  best[0] = [0, 0, 0];
  for (let j = 1; j <= n; j++) {
    for (let i = j - 1; i >= 0; i--) {
      if (!best[i] || !canBreakBefore(i)) continue;
      const lw = w(i, j);
      if (lw > maxWidth && j - i > 1) break; // linhas maiores que isso também não cabem
      const slack = Math.max(0, maxWidth - lw) / maxWidth;
      const cand: [number, number, number] = [best[i]![0] + 1, best[i]![1] + slack * slack + (lw > maxWidth ? 100 : 0), i];
      if (!best[j] || cand[0] < best[j]![0] || (cand[0] === best[j]![0] && cand[1] < best[j]![1])) best[j] = cand;
    }
  }
  if (!best[n]) return [words.join(" ")];
  const lines: string[] = [];
  for (let j = n; j > 0; j = best[j]![2]) lines.unshift(words.slice(best[j]![2], j).join(" "));
  return lines;
};

// Maior tamanho da lista em que o texto cabe em até maxLines linhas de largura maxWidth.
// "ok" diz se coube de verdade (com uma lista de um tamanho só, quem chama decide o que fazer).
export const fitWrap = (text: string, weight: number, maxWidth: number, sizes: number[], maxLines: number): Wrapped => {
  let last: Wrapped = { size: sizes[sizes.length - 1], lines: [text], ok: false };
  const fitsAll = (lines: string[], size: number) => lines.length <= maxLines && lines.every((l) => measure(l, size, weight) <= maxWidth);
  for (const size of sizes) {
    let lines = wrap(text, size, weight, maxWidth);
    let ok = fitsAll(lines, size);
    if (!ok && EMOJI.test(text)) {
      // a regra estrita não cabe neste tamanho: a penúltima palavra pode subir (o emoji fica com a última)
      lines = wrap(text, size, weight, maxWidth, true);
      ok = fitsAll(lines, size);
    }
    if (ok) return { size, lines, ok };
    last = { size, lines, ok };
  }
  return last;
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
  const words = word.split(/ +/); // só espaço comum: o NBSP (antes de emoji) não quebra
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
