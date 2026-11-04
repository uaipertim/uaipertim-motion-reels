import type { Boca, PertimRig } from "./Pertim";
import type { Pose } from "./logica";

// O RIG do Pertim: funções puras do tempo, para qualquer composição.
//   bocaNoQuadro  — a boca da fala no quadro (visemas.json: uma letra por quadro, R/A/E/O/M; R = pausa entre palavras,
//                   com o sorriso da expressão "sorrindo"), ou null fora da fala (aí vale a boca da expressão)
//   piscadaEm     — a pálpebra (0..1) nas piscadas marcadas (2–4 s, nunca com a boca aberta: preparar.py)
//   respiracao    — o quique leve e contínuo do corpo, com o capacete acompanhando um tiquinho atrasado
//   trocaDePose   — a transição curta dos braços entre duas poses

export type Visemas = { fps: number; bocas: string; codigos: Record<string, string> };
const COD: Record<string, Boca | "sorriso"> = { R: "sorriso", A: "A", E: "E", O: "O", M: "MBP" };

export const bocaNoQuadro = (v: Visemas, quadro: number, falando: boolean): Boca | "sorriso" | null =>
  falando ? COD[v.bocas[Math.max(0, Math.min(v.bocas.length - 1, quadro))]] ?? "sorriso" : null;

// o olhar: na câmera (pupilas centradas, com `centro`), desviando só nos olhares curtos marcados (ida e volta suaves)
export type Olhar = { t0: number; t1: number; alvo: [number, number] };
export const olharEm = (olhares: Olhar[], t: number, rampa = 0.1): [number, number] => {
  for (const o of olhares) {
    if (t < o.t0 || t > o.t1) continue;
    const k = Math.min(1, (t - o.t0) / rampa, (o.t1 - t) / rampa);
    return [o.alvo[0] * k, o.alvo[1] * k];
  }
  return [0, 0];
};

export const piscadaEm = (piscadas: number[], t: number, dur = 0.16) => {
  for (const p of piscadas) {
    const u = (t - p) / dur;
    if (u >= 0 && u <= 1) return u < 0.5 ? u * 2 : (1 - u) * 2;   // desce e sobe
  }
  return 0;
};

export const respiracao = (t: number, periodo = 2.4): Pick<PertimRig, "respira" | "capacete"> => {
  const f = (2 * Math.PI * t) / periodo;
  return { respira: Math.sin(f), capacete: 0.8 * Math.sin(f - 0.7) };
};

export const trocaDePose = (de: Pose, t: number, t0: number, dur = 0.18): PertimRig["braco"] =>
  t < t0 ? { de, u: 0 } : { de, u: Math.min(1, (t - t0) / dur) };
