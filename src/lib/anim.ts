import { Easing, interpolate, random, spring } from "remotion";
import { FPS } from "../config/timeline";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Spring padrão com overshoot ("pulinho") para TODA entrada.
export const pop = (frame: number, delay = 0, opts: { damping?: number; stiffness?: number; mass?: number } = {}) =>
  spring({
    frame: frame - delay,
    fps: FPS,
    config: { damping: opts.damping ?? 9, stiffness: opts.stiffness ?? 170, mass: opts.mass ?? 0.7 },
  });

// Spring mais elástico (logo, carimbo).
export const bouncy = (frame: number, delay = 0) => pop(frame, delay, { damping: 7, stiffness: 140, mass: 0.8 });

// Saída rápida com antecipação (encolhe com um leve "respiro" antes).
export const popOut = (frame: number, start: number, dur = 8) =>
  interpolate(frame, [start, start + dur], [1, 0], { ...clamp, easing: Easing.in(Easing.back(2.2)) });

export const easeOutBack = Easing.out(Easing.back(1.8));

export const prog = (frame: number, start: number, dur: number, easing: (t: number) => number = easeOutBack) =>
  interpolate(frame, [start, start + dur], [0, 1], { ...clamp, easing });

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Vida constante: respiração 1.00 ↔ 1.02.
export const breathe = (frame: number, period = 54, amp = 0.02, phase = 0) =>
  1 + amp * (0.5 + 0.5 * Math.sin((frame / period) * Math.PI * 2 + phase));

// Flutuação idle (px).
export const float = (frame: number, period = 70, amp = 8, phase = 0) =>
  Math.sin((frame / period) * Math.PI * 2 + phase) * amp;

// Balanço amortecido (wiggle) após um evento.
export const wiggle = (frame: number, start: number, amp = 10, freq = 0.45, decay = 0.09) => {
  const t = frame - start;
  if (t < 0) return 0;
  return amp * Math.sin(t * freq * Math.PI) * Math.exp(-t * decay);
};

// Tremida pseudo-aleatória determinística (mesmo frame = mesmo valor).
export const jitter = (frame: number, seed: string, amp: number) =>
  (random(`${seed}-${Math.floor(frame)}`) - 0.5) * 2 * amp;

// Squash & stretch ao tocar o chão: devolve [scaleX, scaleY].
export const squash = (frame: number, impact: number, amount = 0.22): [number, number] => {
  const t = frame - impact;
  if (t < 0) return [1, 1];
  const s = amount * Math.exp(-t * 0.28) * Math.cos(t * 0.9);
  return [1 + s, 1 - s];
};

// Queda com quiques (0 = no chão). Retorna deslocamento Y negativo (pra cima).
export const dropBounce = (frame: number, start: number, height: number, fallFrames = 10, bounces = 2) => {
  const t = frame - start;
  if (t < 0) return -height;
  if (t < fallFrames) {
    const p = t / fallFrames;
    return -height * (1 - p * p);
  }
  let tt = t - fallFrames;
  let h = height * 0.28;
  let d = fallFrames * 0.9;
  for (let i = 0; i < bounces; i++) {
    if (tt < d) {
      const p = tt / d;
      return -4 * h * p * (1 - p);
    }
    tt -= d;
    h *= 0.35;
    d *= 0.7;
  }
  return 0;
};

export { clamp };
