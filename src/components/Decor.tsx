import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { C } from "../config/theme";
import { clamp } from "../lib/anim";

// Grade de bolinhas (assinatura visual das artes de referência).
export const DotGrid: React.FC<{ cols: number; rows: number; gap?: number; r?: number; color?: string; style?: React.CSSProperties; frame?: number }> = ({
  cols, rows, gap = 34, r = 7, color = C.coral, style, frame = 0,
}) => (
  <svg width={cols * gap} height={rows * gap} style={{ position: "absolute", overflow: "visible", ...style }}>
    {Array.from({ length: cols * rows }).map((_, i) => {
      const x = (i % cols) * gap + gap / 2;
      const y = Math.floor(i / cols) * gap + gap / 2;
      const s = 0.8 + 0.2 * Math.sin(frame * 0.12 - (x + y) * 0.02);
      return <circle key={i} cx={x} cy={y} r={r * s} fill={color} />;
    })}
  </svg>
);

// Raios de sol girando devagar.
export const Sunburst: React.FC<{ frame: number; cx: number; cy: number; color?: string; opacity?: number; rays?: number; speed?: number; size?: number }> = ({
  frame, cx, cy, color = C.amarelo, opacity = 0.18, rays = 18, speed = 0.25, size = 2600,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="-100 -100 200 200"
    style={{ position: "absolute", left: cx - size / 2, top: cy - size / 2, opacity, transform: `rotate(${frame * speed}deg)` }}
  >
    {Array.from({ length: rays }).map((_, i) => {
      const a0 = (i / rays) * Math.PI * 2;
      const a1 = a0 + Math.PI / rays;
      return <path key={i} d={`M0 0 L${Math.cos(a0) * 100} ${Math.sin(a0) * 100} L${Math.cos(a1) * 100} ${Math.sin(a1) * 100} Z`} fill={color} />;
    })}
  </svg>
);

// Fundo creme padrão com bolinhas e anel decorativo (como nas referências).
export const CremeBackground: React.FC<{
  frame: number; children?: React.ReactNode; rays?: boolean; raysColor?: string; raysCenter?: [number, number]; raysOpacity?: number;
}> = ({ frame, children, rays = false, raysColor = C.amarelo, raysCenter = [540, 700], raysOpacity = 0.14 }) => (
  <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 38%, #FFF8EE 0%, ${C.creme} 55%, #F1E3D0 100%)`, overflow: "hidden" }}>
    {rays && <Sunburst frame={frame} cx={raysCenter[0]} cy={raysCenter[1]} color={raysColor} opacity={raysOpacity} />}
    <DotGrid cols={5} rows={3} style={{ left: 60, top: 70 }} frame={frame} />
    <div
      style={{
        position: "absolute", right: -170, top: -150, width: 420, height: 420, borderRadius: "50%",
        border: `5px solid ${C.coral}`, opacity: 0.85,
      }}
    />
    {children}
  </AbsoluteFill>
);

// Fundo coral (cena 4) com bolinhas brancas.
export const CoralBackground: React.FC<{ frame: number; children?: React.ReactNode }> = ({ frame, children }) => (
  <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 30%, #F96A43 0%, ${C.coral} 50%, ${C.coralBg} 100%)`, overflow: "hidden" }}>
    <Sunburst frame={frame} cx={540} cy={560} color="#fff" opacity={0.07} />
    <DotGrid cols={6} rows={4} color="#fff" r={6} style={{ left: 40, top: 60, opacity: 0.55 }} frame={frame} />
    <DotGrid cols={6} rows={4} color="#fff" r={6} style={{ right: 40, bottom: 120, opacity: 0.55 }} frame={frame + 20} />
    {children}
  </AbsoluteFill>
);

// Transição: faixa coral (com bordas amarelas) cruzando a tela na diagonal.
// Cobre 100% da tela exatamente no meio da duração (= corte de cena).
export const ColorSwipe: React.FC<{ frame: number; duration: number; main?: string; edge?: string; reverse?: boolean }> = ({
  frame, duration, main = C.coral, edge = C.amarelo, reverse = false,
}) => {
  const p = interpolate(frame, [0, duration], [0, 1], clamp);
  // posição do centro da faixa: entra pela esquerda e sai pela direita
  const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const bandW = 2600;
  const travel = 1080 + bandW + 800;
  const x = -bandW / 2 - 400 + ease(p) * travel;
  const dir = reverse ? -1 : 1;
  if (p <= 0 || p >= 1) return null;
  return (
    <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute", top: -600, height: 3120, width: bandW, left: reverse ? 1080 - x - bandW / 2 : x - bandW / 2,
          transform: `rotate(${dir * 14}deg)`, display: "flex", flexDirection: reverse ? "row-reverse" : "row",
        }}
      >
        <div style={{ width: 120, background: edge }} />
        <div style={{ flex: 1, background: main }} />
        <div style={{ width: 70, background: C.creme }} />
        <div style={{ width: 120, background: edge }} />
      </div>
    </AbsoluteFill>
  );
};
