import React from "react";
import { random } from "remotion";
import { C } from "../config/theme";
import { pop } from "../lib/anim";

export const StarShape: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: "visible" }}>
    <path d="M50 4 C54 34 66 46 96 50 C66 54 54 66 50 96 C46 66 34 54 4 50 C34 46 46 34 50 4 Z" fill={color} />
  </svg>
);

export const FivePointStar: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: "visible" }}>
    <path d="M50 6 L62 36 L94 38 L69 58 L78 90 L50 72 L22 90 L31 58 L6 38 L38 36 Z" fill={color} stroke={color} strokeWidth="8" strokeLinejoin="round" />
  </svg>
);

export const HeartShape: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: "visible" }}>
    <path d="M50 88 C18 66 8 48 14 32 C20 16 42 14 50 32 C58 14 80 16 86 32 C92 48 82 66 50 88 Z" fill={color} />
    <ellipse cx="32" cy="34" rx="8" ry="5" fill="#fff" opacity="0.35" transform="rotate(-30 32 34)" />
  </svg>
);

const CONFETTI_COLORS = [C.coral, C.amarelo, C.verde, C.coralLight, C.amareloLight, "#fff"];

// Explosão de confete com gravidade (canhões) — determinístico.
export const ConfettiBurst: React.FC<{
  frame: number; start: number; x: number; y: number; count?: number; angle?: number; spread?: number;
  power?: number; seed: string; freezeAt?: number;
}> = ({ frame, start, x, y, count = 40, angle = -90, spread = 70, power = 46, seed, freezeAt }) => {
  const f = freezeAt !== undefined ? Math.min(frame, freezeAt) : frame;
  const t = f - start;
  if (t < 0) return null;
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const r = (k: string) => random(`${seed}-${i}-${k}`);
        const a = ((angle + (r("a") - 0.5) * spread) * Math.PI) / 180;
        const v = power * (0.55 + r("v") * 0.6);
        const drag = 0.9;
        // posição com arrasto: soma geométrica
        const k = (1 - Math.pow(drag, t)) / (1 - drag);
        const px = x + Math.cos(a) * v * k + Math.sin(t * 0.15 + i) * 8;
        const py = y + Math.sin(a) * v * k + 0.23 * t * t;
        const life = 1 - Math.max(0, (t - 55) / 25);
        if (life <= 0) return null;
        const w = 14 + r("w") * 14;
        const h = r("shape") > 0.6 ? w : w * 0.45;
        const rot = r("rot") * 360 + t * (6 + r("rs") * 10);
        const flip = Math.cos(t * (0.25 + r("f") * 0.25) + i);
        return (
          <div
            key={i}
            style={{
              position: "absolute", left: px, top: py, width: w, height: h,
              background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              borderRadius: r("shape") > 0.85 ? "50%" : 3,
              transform: `translate(-50%,-50%) rotate(${rot}deg) scaleY(${flip})`,
              opacity: life,
            }}
          />
        );
      })}
    </>
  );
};

// Chuva de confete contínua caindo do topo.
export const ConfettiRain: React.FC<{ frame: number; start: number; count?: number; seed: string; width?: number; freezeAt?: number; opacity?: number }> = ({
  frame, start, count = 34, seed, width = 1080, freezeAt, opacity = 1,
}) => {
  const f = freezeAt !== undefined ? Math.min(frame, freezeAt) : frame;
  const t = f - start;
  if (t < 0) return null;
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const r = (k: string) => random(`${seed}-${i}-${k}`);
        const speed = 5 + r("s") * 6;
        const delay = r("d") * 60;
        const tt = t - delay;
        if (tt < 0) return null;
        const y = -60 + ((tt * speed) % 2100);
        const x = r("x") * width + Math.sin(tt * 0.06 + i) * 40;
        const w = 12 + r("w") * 12;
        const rot = tt * (4 + r("r") * 8);
        const flip = Math.cos(tt * 0.2 + i);
        return (
          <div
            key={i}
            style={{
              position: "absolute", left: x, top: y, width: w, height: w * 0.5,
              background: CONFETTI_COLORS[i % CONFETTI_COLORS.length], borderRadius: 3,
              transform: `rotate(${rot}deg) scaleY(${flip})`, opacity,
            }}
          />
        );
      })}
    </>
  );
};

// Estrelinhas que "pipocam" ao redor de um ponto.
export const StarPops: React.FC<{
  frame: number; start: number; cx: number; cy: number; radius: number; count?: number; seed: string;
  colors?: string[]; size?: number; loop?: number;
}> = ({ frame, start, cx, cy, radius, count = 7, seed, colors = [C.amarelo, C.coral, "#fff"], size = 56, loop }) => (
  <>
    {Array.from({ length: count }).map((_, i) => {
      const r = (k: string) => random(`${seed}-${i}-${k}`);
      const delay = start + i * 2.2 + r("d") * 3;
      let t = frame - delay;
      if (loop && t > 0) t = t % loop;
      if (t < 0) return null;
      const s = pop(t, 0, { damping: 8, stiffness: 200 });
      const fadeOut = Math.max(0, Math.min(1, 1 - (t - 18) / 10));
      const a = (i / count) * Math.PI * 2 + r("a") * 0.6;
      const dist = radius * (0.85 + r("r") * 0.4) + t * 1.2;
      const sz = size * (0.6 + r("sz") * 0.7);
      return (
        <div
          key={i}
          style={{
            position: "absolute", left: cx + Math.cos(a) * dist, top: cy + Math.sin(a) * dist,
            transform: `translate(-50%,-50%) scale(${s * fadeOut}) rotate(${t * 6}deg)`,
          }}
        >
          <StarShape size={sz} color={colors[i % colors.length]} />
        </div>
      );
    })}
  </>
);

// Brilhos idle que piscam em posições fixas (vida constante no fundo).
export const Twinkles: React.FC<{ frame: number; points: Array<[number, number]>; color?: string; size?: number; seed: string }> = ({
  frame, points, color = C.amarelo, size = 34, seed,
}) => (
  <>
    {points.map(([x, y], i) => {
      const ph = random(`${seed}-${i}`) * Math.PI * 2;
      const s = 0.4 + 0.6 * Math.max(0, Math.sin(frame * 0.12 + ph));
      return (
        <div key={i} style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) scale(${s}) rotate(${frame * 2}deg)` }}>
          <StarShape size={size} color={color} />
        </div>
      );
    })}
  </>
);

// Coraçõezinhos subindo e sumindo em loop.
export const FloatingHearts: React.FC<{
  frame: number; start: number; sources: Array<[number, number]>; period?: number; rise?: number; seed: string; size?: number;
}> = ({ frame, start, sources, period = 46, rise = 260, seed, size = 54 }) => {
  const t0 = frame - start;
  if (t0 < 0) return null;
  return (
    <>
      {sources.map(([x, y], i) => {
        const off = random(`${seed}-${i}`) * period;
        const t = (t0 + off) % period;
        const cycle = Math.floor((t0 + off) / period);
        if (t0 + off < period * 0.2 && t0 < 6) return null;
        const p = t / period;
        const s = pop(t, 0, { damping: 9, stiffness: 220 }) * (1 - Math.max(0, (p - 0.75) / 0.25));
        const wob = Math.sin(t * 0.25 + i) * 16;
        const colors = [C.coral, C.coralLight, C.amarelo];
        return (
          <div
            key={`${i}-${cycle}`}
            style={{ position: "absolute", left: x + wob, top: y - p * rise, transform: `translate(-50%,-50%) scale(${s}) rotate(${wob * 0.6}deg)` }}
          >
            <HeartShape size={size} color={colors[(i + cycle) % colors.length]} />
          </div>
        );
      })}
    </>
  );
};

// Gotinhas de suor (cena 1–2).
export const SweatDrops: React.FC<{ frame: number; start: number; points: Array<[number, number, number]>; every?: number; seed: string }> = ({
  frame, start, points, every = 22, seed,
}) => {
  const t0 = frame - start;
  if (t0 < 0) return null;
  return (
    <>
      {points.map(([x, y, dir], i) => {
        const off = random(`${seed}-${i}`) * every;
        const t = (t0 + off) % every;
        const p = t / every;
        const s = pop(t, 0, { damping: 10, stiffness: 260 }) * (1 - p * 0.5);
        return (
          <svg
            key={i}
            width={44}
            height={60}
            viewBox="0 0 40 56"
            style={{
              position: "absolute", left: x + dir * p * 60, top: y + p * p * 120,
              transform: `translate(-50%,-50%) scale(${s}) rotate(${dir * 18}deg)`, opacity: 1 - p * 0.6, overflow: "visible",
            }}
          >
            <path d="M20 2 C26 18 36 28 36 38 A16 16 0 0 1 4 38 C4 28 14 18 20 2 Z" fill="#7CC8F2" />
            <path d="M12 36 Q12 30 16 26" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" />
          </svg>
        );
      })}
    </>
  );
};
