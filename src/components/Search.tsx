import React from "react";
import { random } from "remotion";
import { C, FONT, W } from "../config/theme";

// Busca do Vídeo 4: lupa cartoon, barra de busca com lupa e carimbo "NÃO ENCONTRADO".

// Lupa cartoon (aro coral, vidro com reflexo, cabo). O centro da lente fica em (40%, 40%).
export const Magnifier: React.FC<{ size: number; color?: string; glass?: string; style?: React.CSSProperties }> = ({
  size, color = C.coral, glass = "rgba(255,249,241,0.35)", style,
}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: "visible", ...style }}>
    <path d="M60 60 L88 88" stroke={C.tinta} strokeWidth="15" strokeLinecap="round" />
    <path d="M62 62 L70 70" stroke={color} strokeWidth="15" strokeLinecap="round" />
    <circle cx="40" cy="40" r="28" fill={glass} stroke={color} strokeWidth="10" />
    <path d="M24 34 Q28 22 40 20" stroke="#fff" strokeOpacity="0.85" strokeWidth="6" strokeLinecap="round" fill="none" />
  </svg>
);

// Barra de busca (pílula branca) com texto digitado, cursor de texto e lupa à direita.
export const SearchPill: React.FC<{
  width: number;
  height?: number;
  frame: number;
  typed: string;
  placeholder?: string;
  caret?: boolean;
  lupa?: React.ReactNode; // lupa animada (gira "procurando")
}> = ({ width, height = 128, frame, typed, placeholder = "", caret = true, lupa }) => {
  const fs = height * 0.36;
  const showCaret = caret && Math.floor(frame / 8) % 2 === 0;
  return (
    <div
      style={{
        position: "relative", width, height, borderRadius: height / 2, background: "#fff", display: "flex", alignItems: "center",
        padding: `0 ${height * 1.05}px 0 ${height * 0.4}px`, boxSizing: "border-box",
        boxShadow: `0 0 0 6px ${C.cremeDeep}, 0 ${height * 0.12}px 0 rgba(34,28,25,0.18), 0 22px 40px rgba(34,28,25,0.22)`,
      }}
    >
      <span style={{ fontFamily: FONT, fontWeight: typed ? W.extraBold : W.medium, fontSize: fs, color: typed ? C.tinta : "#A8968A", whiteSpace: "nowrap" }}>
        {typed || placeholder}
      </span>
      {showCaret && <span style={{ display: "inline-block", width: 5, height: fs * 1.2, background: C.coral, borderRadius: 3, marginLeft: 6 }} />}
      <div
        style={{
          position: "absolute", right: height * 0.12, top: height * 0.12, width: height * 0.76, height: height * 0.76, borderRadius: "50%",
          background: C.coral, display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {lupa}
      </div>
    </div>
  );
};

// Carimbo de borracha "NÃO ENCONTRADO" (borda dupla, tinta falhada).
export const NotFoundStamp: React.FC<{ text: string; width: number; color?: string; seed?: string }> = ({ text, width, color = C.coralBg, seed = "nf" }) => {
  const h = width * 0.28;
  return (
    <div style={{ position: "relative", width, height: h }}>
      <div
        style={{
          position: "absolute", inset: 0, borderRadius: h * 0.22, border: `${h * 0.08}px solid ${color}`,
          boxShadow: `inset 0 0 0 ${h * 0.05}px rgba(255,249,241,0.9), inset 0 0 0 ${h * 0.085}px ${color}`, background: "rgba(255,249,241,0.82)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: h * 0.12,
        }}
      >
        <span style={{ fontFamily: FONT, fontWeight: W.black, fontSize: h * 0.3, color, letterSpacing: h * 0.02, whiteSpace: "nowrap", lineHeight: 1 }}>{text}</span>
      </div>
      {/* falhas da tinta */}
      <svg width={width} height={h} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 34 }).map((_, i) => (
          <circle
            key={i} cx={random(`${seed}x${i}`) * width} cy={random(`${seed}y${i}`) * h} r={1.5 + random(`${seed}r${i}`) * 4.5}
            fill="rgba(255,249,241,0.85)"
          />
        ))}
      </svg>
    </div>
  );
};
