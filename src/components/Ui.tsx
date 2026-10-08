import React from "react";
import { interpolate } from "remotion";
import { C, FONT, W } from "../config/theme";
import { clamp, easeOutBack } from "../lib/anim";
import { BellGlyph, Lock } from "./Icons";

// Marcador amarelo riscando por baixo (traço animado da esquerda p/ direita).
export const Marker: React.FC<{ width: number; progress: number; color?: string; thickness?: number; style?: React.CSSProperties }> = ({
  width, progress, color = C.amarelo, thickness = 46, style,
}) => {
  const h = thickness * 2.2;
  const d = `M ${thickness * 0.6} ${h * 0.62} C ${width * 0.3} ${h * 0.42}, ${width * 0.62} ${h * 0.7}, ${width - thickness * 0.6} ${h * 0.38}`;
  const len = width * 1.1;
  return (
    <svg width={width} height={h} style={{ overflow: "visible", ...style }}>
      <path d={d} stroke={color} strokeWidth={thickness} strokeLinecap="round" fill="none" strokeDasharray={len} strokeDashoffset={len * (1 - progress)} />
      <path
        d={d}
        stroke="#fff"
        strokeOpacity={0.35}
        strokeWidth={thickness * 0.18}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={len}
        strokeDashoffset={len * (1 - progress)}
        transform={`translate(0 ${-thickness * 0.22})`}
      />
    </svg>
  );
};

// Faixa (banner) que desenrola da esquerda.
export const Ribbon: React.FC<{ text: string; width: number; height: number; progress: number; fontSize?: number }> = ({
  text, width, height, progress, fontSize = 56,
}) => {
  const p = Math.max(0, Math.min(1.08, progress));
  const reveal = Math.min(1, p);
  const tail = height * 0.55;
  return (
    <div style={{ position: "relative", width, height: height * 1.25 }}>
      {/* pontas dobradas */}
      <svg width={width + tail * 2} height={height * 1.25} style={{ position: "absolute", left: -tail, top: 0, overflow: "visible" }}>
        <path d={`M0 ${height * 0.25} H${tail * 1.4} V${height * 1.25} H0 L${tail * 0.55} ${height * 0.75} Z`} fill={C.coralDark} />
        {reveal > 0.97 && (
          <path
            d={`M${width + tail * 2} ${height * 0.25} H${width + tail * 0.6} V${height * 1.25} H${width + tail * 2} L${width + tail * 1.45} ${height * 0.75} Z`}
            fill={C.coralDark}
          />
        )}
      </svg>
      <div
        style={{
          position: "absolute", left: 0, top: 0, width, height, background: C.coral, borderRadius: 14,
          clipPath: `inset(0 ${(1 - reveal) * 100}% 0 0 round 14px)`,
          boxShadow: "0 10px 0 rgba(198,58,23,0.9)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <span style={{ fontFamily: FONT, fontWeight: W.black, fontSize, color: "#fff", letterSpacing: 2, whiteSpace: "nowrap" }}>{text}</span>
      </div>
      {/* rolo que desenrola */}
      {reveal < 0.995 && (
        <div
          style={{
            position: "absolute", top: -8, left: reveal * width - 22, width: 44, height: height + 16, borderRadius: 22,
            background: `linear-gradient(90deg, ${C.coralDark}, ${C.coralLight}, ${C.coralDark})`,
          }}
        />
      )}
    </div>
  );
};

// Barra de navegador cartoon com URL digitando + botão "ir" com ripple.
export const BrowserBar: React.FC<{
  width: number; url: string; typed: number; frame: number; tapFrame: number; scale?: number;
}> = ({ width, url, typed, frame, tapFrame, scale = 1 }) => {
  const text = url.slice(0, Math.floor(typed));
  const cursorOn = Math.floor(frame / 8) % 2 === 0 || typed < url.length;
  const tapT = frame - tapFrame;
  const press = tapT >= 0 && tapT < 10 ? 1 - 0.18 * Math.sin((tapT / 10) * Math.PI) : 1;
  const h = 210;
  return (
    <div style={{ position: "relative", width, height: h, transform: `scale(${scale})` }}>
      <div style={{ position: "absolute", inset: 0, background: "#fff", borderRadius: 40, boxShadow: "0 18px 0 rgba(198,58,23,0.55), 0 30px 60px rgba(34,28,25,0.25)" }} />
      {/* bolinhas da janela */}
      <div style={{ position: "absolute", left: 36, top: 26, display: "flex", gap: 14 }}>
        {[C.coral, C.amarelo, C.verde].map((c) => (
          <div key={c} style={{ width: 22, height: 22, borderRadius: 11, background: c }} />
        ))}
      </div>
      <div style={{ position: "absolute", left: 140, top: 22, width: 220, height: 30, borderRadius: 10, background: C.creme }} />
      {/* campo de endereço */}
      <div
        style={{
          position: "absolute", left: 28, right: 28, top: 76, height: 108, borderRadius: 54, background: C.creme,
          border: `5px solid ${C.cremeDeep}`, display: "flex", alignItems: "center", paddingLeft: 30,
        }}
      >
        <Lock size={46} />
        <span style={{ fontFamily: FONT, fontWeight: W.extraBold, fontSize: 56, color: C.tinta, marginLeft: 18, letterSpacing: -0.5, whiteSpace: "nowrap" }}>
          {text}
        </span>
        <span style={{ width: 6, height: 62, background: C.coral, marginLeft: 4, borderRadius: 3, opacity: cursorOn ? 1 : 0 }} />
      </div>
      {/* botão ir */}
      <div
        style={{
          position: "absolute", right: 42, top: 88, width: 84, height: 84, borderRadius: 42, background: C.coral,
          display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${press})`,
          boxShadow: `0 6px 0 ${C.coralDark}`,
        }}
      >
        <svg width={44} height={44} viewBox="0 0 100 100">
          <path d="M20 50 H76 M52 24 L78 50 L52 76" stroke="#fff" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </div>
      <Ripple frame={tapT} x={width - 84} y={130} />
    </div>
  );
};

export const Ripple: React.FC<{ frame: number; x: number; y: number; color?: string; maxR?: number }> = ({ frame, x, y, color = C.amarelo, maxR = 150 }) => {
  if (frame < 0 || frame > 24) return null;
  return (
    <>
      {[0, 6].map((d) => {
        const t = frame - d;
        if (t < 0) return null;
        const p = interpolate(t, [0, 16], [0, 1], { ...clamp, easing: easeOutBack });
        const r = maxR * p;
        return (
          <div
            key={d}
            style={{
              position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: "50%",
              border: `${10 * (1 - t / 18)}px solid ${color}`, opacity: Math.max(0, 1 - t / 18),
            }}
          />
        );
      })}
    </>
  );
};

// Ondinhas saindo do sininho (arcos curtos nos "ombros" do sino, expandindo).
export const BellWaves: React.FC<{ frame: number; size: number; color?: string; every?: number }> = ({ frame, size, color = C.coral, every = 20 }) => (
  <svg width={size * 2} height={size * 2} viewBox="-100 -100 200 200" style={{ position: "absolute", left: -size / 2, top: -size / 2, overflow: "visible" }}>
    {[0, 1].map((k) => {
      const t = (frame + k * (every / 2)) % every;
      const p = t / every;
      const r = 52 + p * 30;
      return [-1, 1].map((side) => {
        const a0 = (-150 + 0) * (Math.PI / 180);
        const a1 = (-115 + 0) * (Math.PI / 180);
        const x0 = side * Math.abs(Math.cos(a0)) * r;
        const x1 = side * Math.abs(Math.cos(a1)) * r;
        return (
          <path
            key={`${k}${side}`}
            d={`M ${x0} ${Math.sin(a0) * r - 6} A ${r} ${r} 0 0 ${side > 0 ? 0 : 1} ${x1} ${Math.sin(a1) * r - 6}`}
            stroke={color}
            strokeWidth={8 * (1 - p * 0.5)}
            strokeLinecap="round"
            fill="none"
            opacity={1 - p}
          />
        );
      });
    })}
  </svg>
);

// Sininho grande balançando (rotação ±15°) com ondinhas.
export const SwingBell: React.FC<{ size: number; frame: number; rings: number[]; idle?: boolean }> = ({ size, frame, rings, idle = true }) => {
  let swing = idle ? Math.sin(frame * 0.22) * 6 : 0;
  for (const r of rings) {
    const t = frame - r;
    if (t >= 0) swing += 15 * Math.sin(t * 0.55) * Math.exp(-t * 0.06);
  }
  swing = Math.max(-16, Math.min(16, swing));
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <BellWaves frame={frame} size={size} />
      <BellGlyph size={size} swing={swing} />
    </div>
  );
};

// Bloco de categoria (card branco + ícone + rótulo).
export const CategoryTile: React.FC<{ size: number; icon: React.ReactNode; label?: string; style?: React.CSSProperties }> = ({ size, icon, label, style }) => (
  <div
    style={{
      width: size, height: size, borderRadius: size * 0.22, background: "#fff",
      boxShadow: `0 ${size * 0.06}px 0 ${C.cremeDeep}, 0 ${size * 0.12}px ${size * 0.2}px rgba(34,28,25,0.18)`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: size * 0.02, ...style,
    }}
  >
    {icon}
    {label && <span style={{ fontFamily: FONT, fontWeight: W.extraBold, fontSize: size * 0.13, color: C.tinta, whiteSpace: "nowrap" }}>{label}</span>}
  </div>
);

// Carimbo "ARMAZENAMENTO CHEIO!".
export const Stamp: React.FC<{ lines: readonly string[]; fontSize?: number }> = ({ lines, fontSize = 74 }) => (
  <div
    style={{
      padding: "22px 40px", border: `10px solid ${C.coralBg}`, borderRadius: 26, background: "rgba(255,249,241,0.95)",
      boxShadow: `inset 0 0 0 6px rgba(255,249,241,1), inset 0 0 0 10px ${C.coralBg}, 0 20px 40px rgba(34,28,25,0.25)`,
      display: "flex", flexDirection: "column", alignItems: "center",
    }}
  >
    {lines.map((l, i) => (
      <span
        key={l}
        style={{
          fontFamily: FONT, fontWeight: W.black, fontSize: i === 0 ? fontSize : fontSize * 1.45, lineHeight: 1.02,
          color: C.coralBg, letterSpacing: i === 0 ? 1 : 3,
        }}
      >
        {l}
      </span>
    ))}
  </div>
);

// Card "Armazenamento" com barra que sobe até 99%.
export const StorageCard: React.FC<{ width: number; label: string; percent: number; alarm: boolean; frame: number }> = ({ width, label, percent, alarm, frame }) => {
  const color = percent < 60 ? C.verde : percent < 85 ? C.amarelo : "#E5322D";
  const blink = alarm ? 0.55 + 0.45 * Math.abs(Math.sin(frame * 0.35)) : 1;
  return (
    <div
      style={{
        width, padding: "26px 34px 30px", borderRadius: 36, background: "#fff",
        boxShadow: `0 12px 0 ${C.cremeDeep}, 0 26px 50px rgba(34,28,25,0.2)`,
        border: alarm ? `5px solid rgba(229,50,45,${blink})` : `5px solid transparent`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
        <span style={{ fontFamily: FONT, fontWeight: W.extraBold, fontSize: 44, color: C.tinta }}>{label}</span>
        <span style={{ fontFamily: FONT, fontWeight: W.black, fontSize: 60, color, opacity: blink }}>{Math.round(percent)}%</span>
      </div>
      <div style={{ height: 40, borderRadius: 20, background: C.creme, overflow: "hidden", boxShadow: `inset 0 4px 0 ${C.cremeDark}` }}>
        <div
          style={{
            width: `${percent}%`, height: "100%", borderRadius: 20, background: color,
            boxShadow: "inset 0 -8px 0 rgba(0,0,0,0.15), inset 0 8px 0 rgba(255,255,255,0.3)",
          }}
        />
      </div>
    </div>
  );
};
