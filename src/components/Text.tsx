import React from "react";
import { C, FONT, W } from "../config/theme";
import { pop } from "../lib/anim";

export type Part = { t: string; color?: string; weight?: number; size?: number; shadow?: string };

// Linha de texto em que cada palavra entra com bounce (stagger).
export const PopWords: React.FC<{
  parts: Part[] | string;
  frame: number;
  start: number;
  stagger?: number;
  size: number;
  color?: string;
  weight?: number;
  shadow?: string;
  out?: number; // fator 0..1 de saída (1 = visível)
  style?: React.CSSProperties;
  after?: React.ReactNode; // ícone ao final da linha
}> = ({ parts, frame, start, stagger = 3, size, color = C.tinta, weight = W.black, shadow, out = 1, style, after }) => {
  const list: Part[] = typeof parts === "string" ? [{ t: parts }] : parts;
  // quebra em palavras preservando estilos
  const words: Part[] = [];
  list.forEach((p) => {
    p.t.split(/(\s+)/).forEach((w) => {
      if (w.trim().length) words.push({ ...p, t: w });
      else if (w.length && words.length) words[words.length - 1] = { ...words[words.length - 1], t: words[words.length - 1].t + " " };
    });
  });
  return (
    <div
      style={{
        display: "flex", justifyContent: "center", alignItems: "center", flexWrap: "nowrap",
        transform: out < 1 ? `scale(${Math.max(0, out)})` : undefined, opacity: out < 1 ? Math.min(1, Math.max(0, out) * 1.5) : 1, ...style,
      }}
    >
      {words.map((w, i) => {
        const s = pop(frame, start + i * stagger);
        const fs = w.size ?? size;
        return (
          <span
            key={i}
            style={{
              display: "inline-block", fontFamily: FONT, fontWeight: w.weight ?? weight, fontSize: fs, lineHeight: 1.08,
              color: w.color ?? color, transform: `translateY(${(1 - s) * 40}px) scale(${s})`, transformOrigin: "50% 80%",
              textShadow: w.shadow ?? shadow, whiteSpace: "pre", letterSpacing: -1,
              marginRight: w.t.endsWith(" ") ? fs * 0.12 : 0,
            }}
          >
            {w.t}
          </span>
        );
      })}
      {after && (
        <span style={{ display: "inline-block", transform: `scale(${pop(frame, start + words.length * stagger)})`, marginLeft: size * 0.18 }}>
          {after}
        </span>
      )}
    </div>
  );
};
