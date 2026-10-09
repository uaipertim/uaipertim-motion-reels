import React from "react";
import { Easing, interpolate } from "remotion";
import { C, FONT, W } from "../config/theme";
import { breathe, clamp, dropBounce, float, pop, popOut, squash } from "../lib/anim";
import { Ripple } from "./Ui";

// Elementos-guia da série "tutorial": cursor/dedinho cartoon, badge de passo e zoom-through.

export type CursorKey = { f: number; x: number; y: number };

const easeMove = Easing.bezier(0.34, 1.35, 0.5, 1); // chega com leve overshoot

// Posição do cursor entre keyframes (spring-ish).
export const cursorPos = (frame: number, keys: CursorKey[]): [number, number] => {
  if (frame <= keys[0].f) return [keys[0].x, keys[0].y];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    if (frame <= b.f) {
      const t = easeMove((frame - a.f) / Math.max(1, b.f - a.f));
      return [a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t];
    }
  }
  const last = keys[keys.length - 1];
  return [last.x, last.y];
};

// Cursor/dedinho cartoon: círculo coral com brilho (sem mão humana) + ripple a cada toque.
export const TapCursor: React.FC<{
  frame: number;
  keys: CursorKey[];
  taps: number[];
  appear: number;
  hide?: number;
  size?: number;
}> = ({ frame, keys, taps, appear, hide, size = 86 }) => {
  if (frame < appear) return null;
  const inS = pop(frame, appear, { damping: 9, stiffness: 220 });
  const outS = hide !== undefined ? popOut(frame, hide, 7) : 1;
  const s = inS * outS;
  if (s <= 0.001) return null;
  const [x, y] = cursorPos(frame, keys);
  let press = 1;
  for (const t of taps) {
    const d = frame - t;
    if (d >= -3 && d < 9) press *= d < 0 ? 1 - 0.07 * (d + 3) : 1 - 0.22 * Math.max(0, 1 - d / 9) * Math.cos(d * 0.5);
  }
  const bob = float(frame, 26, 4);
  return (
    <>
      {taps.map((t) => (
        <Ripple key={t} frame={frame - t} x={x} y={y} color={C.coral} maxR={size * 1.7} />
      ))}
      <div
        style={{
          position: "absolute", left: x - size / 2, top: y - size / 2 + bob, width: size, height: size,
          transform: `scale(${s * press})`, zIndex: 50,
        }}
      >
        <div
          style={{
            position: "absolute", left: 6, top: 14, width: size, height: size, borderRadius: "50%", background: "rgba(34,28,25,0.22)",
            filter: "blur(4px)",
          }}
        />
        <div
          style={{
            position: "absolute", inset: 0, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, ${C.coralLight}, ${C.coral} 55%, ${C.coralBg})`,
            border: `${size * 0.09}px solid #fff`, boxShadow: `0 0 0 ${size * 0.04}px rgba(242,80,43,0.35)`,
          }}
        />
        <div style={{ position: "absolute", left: size * 0.26, top: size * 0.2, width: size * 0.26, height: size * 0.17, borderRadius: "50%", background: "rgba(255,255,255,0.75)", transform: "rotate(-30deg)" }} />
      </div>
    </>
  );
};

// Badge de passo: círculo coral com número branco que entra quicando.
export const StepBadge: React.FC<{ n: number; frame: number; start: number; size?: number; out?: number }> = ({ n, frame, start, size = 136, out = 1 }) => {
  if (frame < start) return null;
  const y = dropBounce(frame, start, 360, 8, 2);
  const [sx, sy] = squash(frame, start + 8, 0.25);
  const life = breathe(frame, 36, 0.035);
  return (
    <div
      style={{
        width: size, height: size, transform: `translateY(${y}px) scale(${sx * life * out}, ${sy * life * out})`, transformOrigin: "50% 100%",
        borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, ${C.coralLight}, ${C.coral} 60%)`,
        border: `${size * 0.06}px solid #fff`, boxShadow: `0 ${size * 0.07}px 0 ${C.coralDark}, 0 ${size * 0.14}px ${size * 0.2}px rgba(34,28,25,0.22)`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <span style={{ fontFamily: FONT, fontWeight: W.black, fontSize: size * 0.62, color: "#fff", lineHeight: 1, marginTop: size * 0.04 }}>{n}</span>
    </div>
  );
};

// Zoom-through: o elemento tocado "abre" a próxima tela (disco de cor crescendo a partir dele).
export const ZoomThrough: React.FC<{ frame: number; start: number; dur?: number; cx: number; cy: number; color?: string; maxR?: number }> = ({
  frame, start, dur = 10, cx, cy, color = C.coral, maxR = 1900,
}) => {
  if (frame < start) return null;
  const p = interpolate(frame, [start, start + dur], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const r = 30 + p * maxR;
  return <div style={{ position: "absolute", left: cx - r, top: cy - r, width: r * 2, height: r * 2, borderRadius: "50%", background: color, zIndex: 40 }} />;
};

// Começo da tela seguinte: a cor do zoom-through se desfaz revelando o conteúdo.
export const RevealFade: React.FC<{ frame: number; dur: number; color?: string }> = ({ frame, dur, color = C.coral }) => {
  const o = interpolate(frame, [0, dur], [1, 0], { ...clamp, easing: Easing.out(Easing.quad) });
  if (o <= 0) return null;
  return <div style={{ position: "absolute", inset: 0, background: color, opacity: o, zIndex: 40 }} />;
};
