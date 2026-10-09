import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C, FONT, W } from "../config/theme";
import { clamp, pop } from "../lib/anim";

// Legenda animada (estilo karaokê) para vídeos sem locução.
// Cada bloco entra com pulinho; as palavras pipocam uma a uma; a palavra "da vez" ganha
// um marcador coral; *palavras* entre asteriscos ficam em amarelo. A pílula pulsa de leve na batida.

export type CaptionItem = { from: number; to: number; text: string };

type Word = { t: string; em: boolean };
const parse = (text: string): Word[] =>
  text.split(/\s+/).filter(Boolean).map((raw) => {
    const em = /\*/.test(raw);
    return { t: raw.replace(/\*/g, ""), em };
  });

export const Captions: React.FC<{
  items: CaptionItem[];
  y: number;
  maxWidth?: number;
  beatFrames?: number; // duração de 1 tempo em frames (pulsar na batida)
  beatOffset?: number;
}> = ({ items, y, maxWidth = 960, beatFrames, beatOffset = 0 }) => {
  const frame = useCurrentFrame();
  const item = items.find((i) => frame >= i.from && frame < i.to);
  if (!item) return null;
  const t = frame - item.from;
  const dur = item.to - item.from;
  const words = parse(item.text);
  const chars = words.reduce((n, w) => n + w.t.length + 1, 0);
  const fontSize = Math.min(60, Math.floor((maxWidth - 80) / (chars * 0.6)));
  const stagger = Math.max(2, Math.min(5, Math.floor((dur * 0.45) / words.length)));

  const inS = pop(t, 0, { damping: 11, stiffness: 240 });
  const outP = interpolate(t, [dur - 5, dur], [1, 0], clamp);
  const beat = beatFrames ? 1 + 0.03 * Math.exp(-(((frame - beatOffset) % beatFrames + beatFrames) % beatFrames) * 0.45) : 1;
  const tilt = (1 - Math.min(1, inS)) * -4;

  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y - fontSize, display: "flex", justifyContent: "center", pointerEvents: "none", zIndex: 60 }}>
      <div
        style={{
          display: "flex", alignItems: "center", gap: fontSize * 0.22, padding: `${fontSize * 0.26}px ${fontSize * 0.5}px`,
          borderRadius: fontSize * 0.55, background: "rgba(34,28,25,0.9)", boxShadow: `0 ${fontSize * 0.14}px 0 ${C.coralDark}, 0 18px 40px rgba(34,28,25,0.28)`,
          transform: `scale(${(0.7 + 0.3 * inS) * (0.85 + 0.15 * outP) * beat}) rotate(${tilt}deg)`, opacity: Math.min(1, inS * 1.4) * outP,
          maxWidth,
        }}
      >
        {words.map((w, i) => {
          const at = i * stagger;
          const s = pop(t, at, { damping: 15, stiffness: 300 }); // pulinho curto: não invade a palavra vizinha
          const since = t - at;
          const active = since >= 0 && since < Math.max(stagger * 2, 7);
          const hl = active ? interpolate(since, [0, 2, Math.max(stagger * 2, 7) - 2, Math.max(stagger * 2, 7)], [0, 1, 1, 0], clamp) : 0;
          return (
            <span key={i} style={{ position: "relative", display: "inline-block", transform: `translateY(${(1 - s) * 26}px) scale(${0.6 + 0.4 * Math.min(1.04, s)})`, transformOrigin: "50% 80%", opacity: Math.min(1, s * 2) }}>
              <span
                style={{
                  position: "absolute", left: -fontSize * 0.08, right: -fontSize * 0.08, top: fontSize * 0.1, bottom: fontSize * 0.04,
                  borderRadius: fontSize * 0.2, background: C.coral, opacity: hl, transform: `scaleX(${0.85 + 0.15 * hl})`,
                }}
              />
              <span
                style={{
                  position: "relative", fontFamily: FONT, fontWeight: W.black, fontSize, lineHeight: 1.15, letterSpacing: -0.5,
                  color: w.em ? C.amarelo : "#fff", whiteSpace: "nowrap",
                }}
              >
                {w.t}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
};
