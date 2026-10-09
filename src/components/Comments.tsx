import React from "react";
import { C, FONT, W } from "../config/theme";
import { HeartShape } from "./Particles";
import { ChatIcon } from "./AppIcons";

// Peças de "comentário" do Vídeo 3: balão com avatar (bolinha colorida, sem rosto),
// campo "Adicione um comentário…", etiqueta de marcação "@" e contador 💬.

// Avatar = bolinha colorida com brilho (nunca rosto).
export const AvatarDot: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <div
    style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0, position: "relative",
      background: `radial-gradient(circle at 34% 30%, rgba(255,255,255,0.55), rgba(255,255,255,0) 42%), ${color}`,
      boxShadow: `0 0 0 ${size * 0.08}px #fff, 0 0 0 ${size * 0.14}px ${color}33`,
    }}
  />
);

const heartPulse = (frame: number, phase = 0) => 1 + 0.2 * Math.max(0, Math.sin(frame * 0.26 + phase)) ** 3;

export const CommentBalloon: React.FC<{
  text: string;
  avatar: string;
  icon?: React.ReactNode; // "emoji" desenhado no fim do texto
  frame: number;
  maxTextWidth?: number;
  fontSize?: number;
  tail?: "left" | "right";
  highlight?: number; // 0..1 borda coral de destaque
  heartPhase?: number;
  style?: React.CSSProperties;
}> = ({ text, avatar, icon, frame, maxTextWidth = 470, fontSize = 36, tail = "left", highlight = 0, heartPhase = 0, style }) => (
  <div style={{ position: "relative", display: "inline-block", ...style }}>
    <div
      style={{
        display: "flex", alignItems: "center", gap: fontSize * 0.5, padding: `${fontSize * 0.4}px ${fontSize * 0.62}px ${fontSize * 0.4}px ${fontSize * 0.45}px`,
        borderRadius: fontSize * 1.05, background: "#fff",
        boxShadow: `0 0 0 ${7 * highlight}px ${C.coral}, 0 9px 0 ${C.cremeDeep}, 0 18px 34px rgba(34,28,25,${0.16 + 0.1 * highlight})`,
      }}
    >
      <AvatarDot size={fontSize * 1.35} color={avatar} />
      <div
        style={{
          maxWidth: maxTextWidth, fontFamily: FONT, fontWeight: W.extraBold, fontSize, lineHeight: 1.18, color: C.tinta,
          letterSpacing: -0.5,
        }}
      >
        {text}
        {icon && (
          <span style={{ display: "inline-block", width: fontSize * 1.25, height: fontSize * 1.1, marginLeft: fontSize * 0.25, verticalAlign: "-0.22em" }}>
            {icon}
          </span>
        )}
      </div>
      <div style={{ transform: `scale(${heartPulse(frame, heartPhase)})`, flexShrink: 0, marginLeft: 4 }}>
        <HeartShape size={fontSize * 1.1} color={C.coral} />
      </div>
    </div>
    {/* rabinho do balão */}
    <svg
      width={44} height={30} viewBox="0 0 44 30"
      style={{ position: "absolute", bottom: -24, [tail === "left" ? "left" : "right"]: 44, transform: tail === "right" ? "scaleX(-1)" : undefined, overflow: "visible" }}
    >
      <path d="M0 0 H40 L6 28 Q2 30 4 24 Z" fill="#fff" />
    </svg>
  </div>
);

// Balãozinho rápido (reação): avatar + coraçõezinhos.
export const MiniBalloon: React.FC<{ avatar: string; hearts?: number; frame: number; size?: number; phase?: number }> = ({ avatar, hearts = 3, frame, size = 46, phase = 0 }) => (
  <div
    style={{
      display: "inline-flex", alignItems: "center", gap: size * 0.2, padding: `${size * 0.26}px ${size * 0.42}px ${size * 0.26}px ${size * 0.26}px`, borderRadius: size,
      background: "#fff", boxShadow: `0 ${size * 0.14}px 0 ${C.cremeDeep}, 0 10px 20px rgba(34,28,25,0.14)`,
    }}
  >
    <AvatarDot size={size} color={avatar} />
    {Array.from({ length: hearts }).map((_, i) => (
      <div key={i} style={{ transform: `scale(${heartPulse(frame, phase + i * 0.9)})` }}>
        <HeartShape size={size * 0.8} color={i % 2 ? C.coralLight : C.coral} />
      </div>
    ))}
  </div>
);

// Campo "Adicione um comentário…" (com cursor de texto piscando e "@" que vira etiqueta).
export const CommentField: React.FC<{
  width: number;
  frame: number;
  placeholder: string;
  publish: string;
  avatar?: string;
  typed?: string; // texto digitado (ex.: "@padaria"); "@..." aparece em coral
  caret?: boolean;
  publishOn?: number; // 0..1 botão "Publicar" ativo
  height?: number;
}> = ({ width, frame, placeholder, publish, avatar = C.verde, typed = "", caret = true, publishOn = 0, height = 104 }) => {
  const showCaret = caret && Math.floor(frame / 8) % 2 === 0;
  const fs = height * 0.34;
  return (
    <div
      style={{
        width, height, borderRadius: height / 2, background: "#fff", display: "flex", alignItems: "center", gap: 20,
        padding: `0 ${height * 0.34}px 0 ${height * 0.2}px`, boxSizing: "border-box",
        boxShadow: `0 0 0 5px ${C.cremeDeep}, 0 12px 28px rgba(34,28,25,0.16)`,
      }}
    >
      <AvatarDot size={height * 0.6} color={avatar} />
      <div style={{ flex: 1, display: "flex", alignItems: "center", fontFamily: FONT, fontSize: fs, whiteSpace: "nowrap", overflow: "hidden" }}>
        {typed ? (
          <span style={{ fontWeight: W.black, color: typed.startsWith("@") ? C.coral : C.tinta }}>{typed}</span>
        ) : (
          <>
            {showCaret && <span style={{ display: "inline-block", width: 4, height: fs * 1.25, background: C.coral, borderRadius: 2, marginRight: 4 }} />}
            <span style={{ fontWeight: W.medium, color: "#A8968A" }}>{placeholder}</span>
          </>
        )}
        {typed && showCaret && <span style={{ display: "inline-block", width: 4, height: fs * 1.25, background: C.coral, borderRadius: 2, marginLeft: 4 }} />}
      </div>
      <span style={{ fontFamily: FONT, fontWeight: W.extraBold, fontSize: fs * 0.95, color: C.coral, opacity: 0.4 + 0.6 * publishOn }}>{publish}</span>
    </div>
  );
};

// Etiqueta de marcação "@" (estilo tag de foto: pílula com setinha em cima).
export const TagChip: React.FC<{ text: string; size?: number; icon?: React.ReactNode }> = ({ text, size = 46, icon }) => (
  <div style={{ position: "relative", display: "inline-block" }}>
    <svg width={size * 0.8} height={size * 0.45} viewBox="0 0 40 22" style={{ position: "absolute", left: "50%", top: -size * 0.4, transform: "translateX(-50%)" }}>
      <path d="M20 0 L40 22 H0 Z" fill={C.coral} />
    </svg>
    <div
      style={{
        display: "flex", alignItems: "center", gap: size * 0.2, padding: `${size * 0.22}px ${size * 0.5}px`, borderRadius: size,
        background: C.coral, boxShadow: `0 ${size * 0.12}px 0 ${C.coralDark}, 0 10px 24px rgba(34,28,25,0.25)`,
        fontFamily: FONT, fontWeight: W.black, fontSize: size, color: "#fff", whiteSpace: "nowrap", lineHeight: 1.1,
      }}
    >
      {icon}
      {text}
    </div>
  </div>
);

// Contador de comentários estilo rede social (só ilustrativo).
export const CommentCounter: React.FC<{ value: string; bump?: number; size?: number }> = ({ value, bump = 0, size = 62 }) => (
  <div
    style={{
      display: "inline-flex", alignItems: "center", gap: size * 0.2, padding: `${size * 0.16}px ${size * 0.4}px ${size * 0.16}px ${size * 0.22}px`,
      borderRadius: size, background: "#fff", boxShadow: `0 ${size * 0.1}px 0 ${C.cremeDeep}, 0 10px 22px rgba(34,28,25,0.16)`,
    }}
  >
    <div style={{ transform: `scale(${1 + 0.25 * bump}) rotate(${-10 * bump}deg)` }}>
      <ChatIcon size={size} color={C.coral} />
    </div>
    <span
      style={{
        fontFamily: FONT, fontWeight: W.black, fontSize: size * 0.72, color: C.tinta, minWidth: size * 1.6, display: "inline-block",
        transform: `translateY(${-6 * bump}px)`, fontVariantNumeric: "tabular-nums",
      }}
    >
      {value}
    </span>
  </div>
);
