import React from "react";
import { C, FONT, W } from "../config/theme";
import { HeartShape } from "./Particles";
import { PaperPlaneIcon } from "./AppIcons";

// Peças do Vídeo 4 (convite ao comerciante): card de benefício com check que se desenha,
// placa da trilha de 3 passos, selo e balão de mensagem do direct.

// Check coral que se desenha (progress 0..1).
export const DrawCheck: React.FC<{ size: number; progress: number; color?: string }> = ({ size, progress, color = C.coral }) => {
  const len = 70;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: "visible" }}>
      <circle cx="50" cy="50" r="46" fill={color} transform={`translate(50 50) scale(${Math.min(1, progress * 2.5)}) translate(-50 -50)`} />
      <path
        d="M28 52 L44 67 L73 36" stroke="#fff" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" fill="none"
        strokeDasharray={len} strokeDashoffset={len * (1 - Math.max(0, Math.min(1, (progress - 0.3) / 0.7)))}
      />
    </svg>
  );
};

export const BenefitCard: React.FC<{ icon: React.ReactNode; text: string; width: number; check: number; fontSize?: number }> = ({
  icon, text, width, check, fontSize = 44,
}) => (
  <div
    style={{
      width, boxSizing: "border-box", display: "flex", alignItems: "center", gap: fontSize * 0.5, padding: `${fontSize * 0.42}px ${fontSize * 0.5}px`,
      borderRadius: fontSize * 0.8, background: "#fff", boxShadow: `0 10px 0 ${C.cremeDeep}, 0 20px 36px rgba(34,28,25,0.16)`,
    }}
  >
    <div
      style={{
        width: fontSize * 2.1, height: fontSize * 2.1, borderRadius: "50%", background: C.creme, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      {icon}
    </div>
    <div style={{ flex: 1, fontFamily: FONT, fontWeight: W.extraBold, fontSize, lineHeight: 1.12, color: C.tinta, letterSpacing: -0.5 }}>{text}</div>
    <div style={{ flexShrink: 0 }}>
      <DrawCheck size={fontSize * 1.7} progress={check} />
    </div>
  </div>
);

// Placa da trilha: número do passo, ícone e texto; acende (borda coral + brilho) quando a Lojinha chega.
export const TrailSign: React.FC<{ n: number; icon: React.ReactNode; text: string; width: number; lit: number; fontSize?: number }> = ({
  n, icon, text, width, lit, fontSize = 40,
}) => (
  <div style={{ position: "relative", width }}>
    {/* postes */}
    {[0.22, 0.78].map((x) => (
      <div key={x} style={{ position: "absolute", left: width * x - 9, top: "60%", width: 18, height: fontSize * 2.6, borderRadius: 6, background: "#9A5B2E" }} />
    ))}
    <div
      style={{
        position: "relative", display: "flex", alignItems: "center", gap: fontSize * 0.4, padding: `${fontSize * 0.45}px ${fontSize * 0.55}px`,
        borderRadius: fontSize * 0.6, background: lit > 0.5 ? C.papel : "#F7EFE4",
        border: `${fontSize * 0.14}px solid ${lit > 0.5 ? C.coral : C.cremeDeep}`,
        boxShadow: `0 8px 0 ${lit > 0.5 ? C.coralDark : "#D9C2A5"}, 0 0 ${50 * lit}px ${18 * lit}px rgba(249,178,51,${0.55 * lit})`,
      }}
    >
      <div style={{ flexShrink: 0, opacity: 0.55 + 0.45 * lit }}>{icon}</div>
      <div style={{ fontFamily: FONT, fontWeight: W.extraBold, fontSize, lineHeight: 1.12, color: C.tinta, letterSpacing: -0.5, whiteSpace: "pre-line" }}>{text}</div>
      <div
        style={{
          position: "absolute", left: -fontSize * 0.55, top: -fontSize * 0.6, width: fontSize * 1.3, height: fontSize * 1.3, borderRadius: "50%",
          background: lit > 0.5 ? C.coral : "#BFAE9C", border: "5px solid #fff", display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: FONT, fontWeight: W.black, fontSize: fontSize * 0.75, color: "#fff", transform: `scale(${1 + 0.25 * Math.sin(Math.PI * Math.min(1, lit))})`,
        }}
      >
        {n}
      </div>
    </div>
  </div>
);

// Selo verde (ex.: "Não precisa entender de tecnologia 😉").
export const Seal: React.FC<{ lines: readonly string[]; icon?: React.ReactNode; fontSize?: number }> = ({ lines, icon, fontSize = 52 }) => (
  <div
    style={{
      display: "inline-flex", alignItems: "center", gap: fontSize * 0.35, padding: `${fontSize * 0.36}px ${fontSize * 0.6}px`, borderRadius: fontSize * 0.7,
      background: C.verde, boxShadow: `inset 0 0 0 6px ${C.verdeDark}, inset 0 0 0 10px rgba(255,255,255,0.55), 0 10px 0 ${C.verdeDark}, 0 20px 34px rgba(34,28,25,0.2)`,
    }}
  >
    <div style={{ fontFamily: FONT, fontWeight: W.black, fontSize, lineHeight: 1.08, color: "#fff", textAlign: "center", letterSpacing: -0.5 }}>
      {lines.map((l) => (
        <div key={l}>{l}</div>
      ))}
    </div>
    {icon}
  </div>
);

// Balão de mensagem do direct (cartoon): aviãozinho + @ da marca + coraçãozinho de reação.
export const DirectBalloon: React.FC<{ handle: string; fontSize?: number; heartIn?: number; frame: number }> = ({ handle, fontSize = 88, heartIn = 0, frame }) => (
  <div style={{ position: "relative", display: "inline-block" }}>
    <div
      style={{
        display: "flex", alignItems: "center", gap: fontSize * 0.28, padding: `${fontSize * 0.3}px ${fontSize * 0.55}px ${fontSize * 0.3}px ${fontSize * 0.3}px`,
        borderRadius: fontSize * 0.75, background: `linear-gradient(135deg, ${C.coralLight}, ${C.coral} 55%, ${C.coralBg})`,
        boxShadow: `0 ${fontSize * 0.12}px 0 ${C.coralDark}, 0 24px 44px rgba(198,58,23,0.35)`,
      }}
    >
      <div
        style={{
          width: fontSize * 1.15, height: fontSize * 1.15, borderRadius: "50%", background: "rgba(255,255,255,0.22)", border: "5px solid rgba(255,255,255,0.7)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}
      >
        <PaperPlaneIcon size={fontSize * 0.68} style={{ transform: `translate(-3px, 3px) rotate(${Math.sin(frame * 0.15) * 6}deg)` }} />
      </div>
      <span style={{ fontFamily: FONT, fontWeight: W.black, fontSize, color: "#fff", whiteSpace: "nowrap", letterSpacing: -1, lineHeight: 1.1 }}>{handle}</span>
    </div>
    <svg width={56} height={40} viewBox="0 0 56 40" style={{ position: "absolute", left: fontSize * 0.5, bottom: -30, overflow: "visible" }}>
      <path d="M0 0 H52 L8 36 Q2 40 4 32 Z" fill={C.coral} />
    </svg>
    {heartIn > 0.01 && (
      <div
        style={{
          position: "absolute", right: -fontSize * 0.25, bottom: -fontSize * 0.42, width: fontSize * 0.86, height: fontSize * 0.86, borderRadius: "50%",
          background: "#fff", boxShadow: "0 6px 16px rgba(34,28,25,0.22)", display: "flex", alignItems: "center", justifyContent: "center",
          transform: `scale(${heartIn})`,
        }}
      >
        <HeartShape size={fontSize * 0.6} color="#E8262B" />
      </div>
    )}
  </div>
);
