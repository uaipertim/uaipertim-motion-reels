import React from "react";
import { C } from "../config/theme";

// Celular cartoon (corpo + tela). `children` vai DENTRO da tela (recortado).
export const Phone: React.FC<{
  width: number;
  height: number;
  screenBg?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  notch?: boolean;
}> = ({ width, height, screenBg = C.papel, children, style, notch = true }) => {
  const bezel = width * 0.042;
  return (
    <div style={{ position: "relative", width, height, ...style }}>
      {/* botões laterais */}
      <div style={{ position: "absolute", left: -width * 0.018, top: height * 0.2, width: width * 0.03, height: height * 0.08, background: "#3B312C", borderRadius: 6 }} />
      <div style={{ position: "absolute", right: -width * 0.018, top: height * 0.24, width: width * 0.03, height: height * 0.12, background: "#3B312C", borderRadius: 6 }} />
      <div
        style={{
          position: "absolute", inset: 0, background: C.tinta, borderRadius: width * 0.17,
          boxShadow: `inset 0 0 0 ${width * 0.012}px #4A3E38, 0 ${width * 0.05}px ${width * 0.1}px rgba(34,28,25,0.28)`,
        }}
      />
      <div
        style={{
          position: "absolute", left: bezel, top: bezel, right: bezel, bottom: bezel,
          borderRadius: width * 0.13, background: screenBg, overflow: "hidden",
        }}
      >
        {children}
      </div>
      {notch && (
        <div
          style={{
            position: "absolute", top: bezel + width * 0.03, left: "50%", width: width * 0.26, height: width * 0.065,
            marginLeft: -width * 0.13, background: C.tinta, borderRadius: 999,
          }}
        />
      )}
      {/* reflexo */}
      <div
        style={{
          position: "absolute", left: bezel, top: bezel, right: bezel, bottom: bezel, borderRadius: width * 0.13,
          background: "linear-gradient(125deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 32%)", pointerEvents: "none",
        }}
      />
    </div>
  );
};

export type Mood = "worried" | "strained" | "spit" | "happy";

// Rostinho do celular-personagem (olhinhos + sobrancelhas + boca).
export const PhoneFace: React.FC<{
  width: number;
  mood: Mood;
  blink?: number; // 0 aberto → 1 fechado
  look?: [number, number];
  style?: React.CSSProperties;
}> = ({ width, mood, blink = 0, look = [0, 0], style }) => {
  const eyeRy = 40 * (1 - 0.92 * blink);
  const [lx, ly] = look;
  const browL = mood === "happy" ? "M44 30 Q70 14 96 26" : mood === "strained" ? "M42 18 L98 34" : "M42 34 Q70 26 98 14";
  const browR = mood === "happy" ? "M204 26 Q230 14 256 30" : mood === "strained" ? "M202 34 L258 18" : "M202 14 Q230 26 258 34";
  return (
    <svg width={width} height={width * 0.5} viewBox="0 0 300 150" style={{ overflow: "visible", ...style }}>
      {/* bochechas */}
      <ellipse cx="40" cy="112" rx="22" ry="12" fill={C.coral} opacity="0.28" />
      <ellipse cx="260" cy="112" rx="22" ry="12" fill={C.coral} opacity="0.28" />
      {[70, 230].map((cx, i) => (
        <g key={cx}>
          <ellipse cx={cx} cy="74" rx="34" ry={Math.max(3, eyeRy)} fill="#fff" stroke={C.tinta} strokeWidth="6" />
          {blink < 0.7 && (
            <g transform={`translate(${lx * 12} ${ly * 10})`}>
              <circle cx={cx + (i === 0 ? 4 : -4)} cy="78" r={17 * (1 - blink)} fill={C.tinta} />
              <circle cx={cx + (i === 0 ? -2 : -10)} cy="70" r={6 * (1 - blink)} fill="#fff" />
            </g>
          )}
        </g>
      ))}
      <path d={browL} stroke={C.tinta} strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d={browR} stroke={C.tinta} strokeWidth="9" strokeLinecap="round" fill="none" />
      {mood === "worried" && (
        <path d="M118 132 Q130 120 142 130 Q154 140 166 128 Q176 120 184 130" stroke={C.tinta} strokeWidth="8" strokeLinecap="round" fill="none" />
      )}
      {mood === "strained" && (
        <g>
          <rect x="112" y="116" width="76" height="30" rx="12" fill="#fff" stroke={C.tinta} strokeWidth="6" />
          <line x1="137" y1="118" x2="137" y2="144" stroke={C.tinta} strokeWidth="4" />
          <line x1="162" y1="118" x2="162" y2="144" stroke={C.tinta} strokeWidth="4" />
          <line x1="114" y1="131" x2="186" y2="131" stroke={C.tinta} strokeWidth="4" />
        </g>
      )}
      {mood === "spit" && <ellipse cx="150" cy="130" rx="22" ry="20" fill={C.tinta} />}
      {mood === "happy" && <path d="M112 116 Q150 156 188 116 Z" fill={C.tinta} />}
    </svg>
  );
};
