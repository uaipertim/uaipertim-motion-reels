import React from "react";
import { Img, random, staticFile } from "remotion";
import { C, FONT, W } from "../config/theme";
import { breathe, pop } from "../lib/anim";
import { CheckIcon, ClockIcon, GridIcon, HouseIcon, PanIcon, PinIcon, ScooterIcon, SearchIcon, StarIcon, StoreIcon } from "./AppIcons";
import { BurgerIcon, CartIcon, CrossIcon, PawIcon } from "./Icons";
import { HeartShape } from "./Particles";
import { Tree } from "./Scenery";

// Peças da interface do UaiPertim desenhadas em vetor (Vídeo 2), inspiradas na home real.
const GRAY = "#8A7F78";

export const AppHeader: React.FC<{ width: number }> = ({ width }) => (
  <div style={{ width, display: "flex", alignItems: "center", gap: 14, padding: "0 34px" }}>
    <Img src={staticFile("img/uaipertim_mark.png")} style={{ width: 70, height: 70 }} />
    <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.05 }}>
      <span style={{ fontFamily: FONT, fontWeight: W.black, fontSize: 36, color: C.coral }}>
        Uai<span style={{ color: C.tinta }}>Pertim</span>
      </span>
      <span style={{ fontFamily: FONT, fontWeight: W.medium, fontSize: 20, color: GRAY }}>Feito em Minas</span>
    </div>
  </div>
);

export const LocationRow: React.FC<{ city: string; action: string; highlight?: number }> = ({ city, action, highlight = 0 }) => (
  <div
    style={{
      display: "flex", alignItems: "center", gap: 12, padding: "14px 22px", borderRadius: 22,
      background: `rgba(242,80,43,${0.08 * highlight})`,
    }}
  >
    <PinIcon size={34} />
    <span style={{ fontFamily: FONT, fontWeight: W.extraBold, fontSize: 30, color: C.tinta, whiteSpace: "nowrap" }}>{city}</span>
    <span style={{ fontFamily: FONT, fontWeight: W.black, fontSize: 24, color: C.coral, marginLeft: 6 }}>{action}</span>
  </div>
);

export const SearchBar: React.FC<{ width: number; placeholder: string; typed?: string; glow?: number; caret?: boolean }> = ({
  width, placeholder, typed = "", glow = 0, caret = false,
}) => (
  <div
    style={{
      width, height: 92, borderRadius: 46, background: "#fff", display: "flex", alignItems: "center", gap: 18, padding: "0 30px",
      border: `4px solid ${glow > 0 ? C.coral : "#EFE3D6"}`,
      boxShadow: `0 10px 24px rgba(34,28,25,0.10), 0 0 0 ${10 * glow}px rgba(242,80,43,${0.22 * glow})`,
    }}
  >
    <SearchIcon size={42} color={glow > 0 ? C.coral : GRAY} />
    <span style={{ fontFamily: FONT, fontWeight: typed ? W.extraBold : W.medium, fontSize: typed ? 34 : 28, color: typed ? C.tinta : GRAY, whiteSpace: "nowrap" }}>
      {typed || placeholder}
    </span>
    {caret && <span style={{ width: 4, height: 40, background: C.coral, borderRadius: 2 }} />}
  </div>
);

// Tile de categoria no estilo do app (quadrado + rótulo). selected = aceso em coral.
export type CategoryKind = "todos" | "mercados" | "farmacias" | "restaurantes" | "pets";
export const CATEGORY_DEFS: Array<{ kind: CategoryKind; label: string }> = [
  { kind: "todos", label: "Todos" },
  { kind: "mercados", label: "Mercados" },
  { kind: "farmacias", label: "Farmácias" },
  { kind: "restaurantes", label: "Restaurantes" },
  { kind: "pets", label: "Pet Shops" },
];
const catIcon = (k: CategoryKind, size: number, selected: boolean) => {
  switch (k) {
    case "todos": return <GridIcon size={size * 0.8} color={selected ? "#fff" : C.coral} />;
    case "mercados": return <CartIcon size={size} />;
    case "farmacias": return <CrossIcon size={size * 0.9} />;
    case "restaurantes": return <BurgerIcon size={size} />;
    case "pets": return <PawIcon size={size * 0.9} />;
  }
};
export const AppCategoryTile: React.FC<{ kind: CategoryKind; label: string; size: number; selected?: number }> = ({ kind, label, size, selected = 0 }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, width: size + 10 }}>
    <div
      style={{
        width: size, height: size, borderRadius: size * 0.26, display: "flex", alignItems: "center", justifyContent: "center",
        background: selected > 0.5 ? C.coral : "#fff", border: `4px solid ${selected > 0.5 ? C.coralDark : "#EFE3D6"}`,
        boxShadow: selected > 0.5 ? `0 10px 0 ${C.coralDark}, 0 0 0 ${12 * selected}px rgba(242,80,43,0.22)` : "0 8px 18px rgba(34,28,25,0.10)",
      }}
    >
      {catIcon(kind, size * 0.62, selected > 0.5)}
    </div>
    <span style={{ fontFamily: FONT, fontWeight: W.extraBold, fontSize: 21, color: selected > 0.5 ? C.coral : C.tinta, whiteSpace: "nowrap", letterSpacing: -0.3 }}>{label}</span>
  </div>
);

// Mapa cartoon (quadras suaves, arvorezinhas, estradinha amarela).
export const CityMap: React.FC<{ width: number; height: number; frame: number }> = ({ width, height, frame }) => {
  const blocks: Array<[number, number, number, number]> = [];
  const cols = 4;
  const rows = 4;
  const bw = width / cols;
  const bh = height / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (random(`blk-${r}-${c}`) < 0.18) continue;
      blocks.push([c * bw + 16, r * bh + 16, bw - 32, bh - 32]);
    }
  }
  const road = `M -20 ${height * 0.78} C ${width * 0.25} ${height * 0.62}, ${width * 0.3} ${height * 0.3}, ${width * 0.55} ${height * 0.42} S ${width * 0.85} ${height * 0.2}, ${width + 20} ${height * 0.12}`;
  return (
    <div style={{ position: "relative", width, height, overflow: "hidden", background: "#EFE3CC" }}>
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        {blocks.map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} rx={22} fill={random(`park-${i}`) < 0.22 ? "#D5E8BE" : "#F8F0E1"} stroke="#E6D5BA" strokeWidth={3} />
        ))}
        <path d={road} stroke="#fff" strokeWidth={70} fill="none" strokeLinecap="round" />
        <path d={road} stroke={C.amarelo} strokeWidth={54} fill="none" strokeLinecap="round" />
        <path d={road} stroke="#fff" strokeWidth={5} strokeDasharray="22 26" fill="none" opacity={0.8} />
        {blocks.slice(0, 7).map(([x, y, w, h], i) => (
          <g key={`h${i}`} transform={`translate(${x + w * 0.2} ${y + h * 0.3})`}>
            <rect x={0} y={22} width={44} height={34} rx={4} fill={[C.coralLight, C.amareloLight, "#F5C9A6"][i % 3]} />
            <path d="M-4 24 L22 2 L48 24 Z" fill={[C.coral, C.amareloDark, C.verde][i % 3]} />
          </g>
        ))}
      </svg>
      {[[0.12, 0.2], [0.82, 0.6], [0.4, 0.85], [0.66, 0.08], [0.9, 0.9]].map(([fx, fy], i) => (
        <div key={i} style={{ position: "absolute", left: fx * width - 30, top: fy * height - 60 }}>
          <Tree size={60} sway={Math.sin(frame * 0.1 + i) * 4} />
        </div>
      ))}
    </div>
  );
};

// Card de estabelecimento (exemplo genérico).
export const EstablishmentCard: React.FC<{
  width: number; name: string; subtitle: string; rating: string; time: string; openLabel: string; button: string;
  frame: number; seloStart: number; buttonPulse?: boolean; press?: number;
}> = ({ width, name, subtitle, rating, time, openLabel, button, frame, seloStart, buttonPulse = true, press = 1 }) => {
  const blink = frame >= seloStart ? 0.55 + 0.45 * Math.abs(Math.cos((frame - seloStart) * 0.18)) : 0;
  const seloS = pop(frame, seloStart, { damping: 8, stiffness: 220 }) * (frame >= seloStart ? 1 + 0.06 * Math.sin((frame - seloStart) * 0.36) : 0);
  const btnS = (buttonPulse ? breathe(frame, 22, 0.05) : 1) * press;
  return (
    <div
      style={{
        width, height: 330, borderRadius: 36, background: "#fff", border: "4px solid #F6D9CC", position: "relative",
        boxShadow: "0 18px 40px rgba(34,28,25,0.16)", padding: 26, display: "flex", gap: 24,
      }}
    >
      <div
        style={{
          width: 176, height: 176, borderRadius: 30, background: `linear-gradient(145deg, ${C.amarelo}, ${C.coral})`, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "inset 0 -10px 0 rgba(0,0,0,0.1)",
        }}
      >
        <StoreIcon size={124} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 6 }}>
        <span style={{ fontFamily: FONT, fontWeight: W.extraBold, fontSize: 42, color: C.tinta, lineHeight: 1.05, whiteSpace: "nowrap" }}>{name}</span>
        <span style={{ fontFamily: FONT, fontWeight: W.medium, fontSize: 28, color: GRAY }}>{subtitle}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
          <StarIcon size={34} />
          <span style={{ fontFamily: FONT, fontWeight: W.extraBold, fontSize: 32, color: C.tinta }}>{rating}</span>
          <span style={{ fontFamily: FONT, fontWeight: W.black, fontSize: 32, color: GRAY, margin: "0 6px" }}>·</span>
          <ClockIcon size={30} color={GRAY} />
          <span style={{ fontFamily: FONT, fontWeight: W.medium, fontSize: 30, color: C.tinta }}>{time}</span>
        </div>
      </div>
      {/* selo Aberto */}
      <div
        style={{
          position: "absolute", left: 226, bottom: 34, display: "flex", alignItems: "center", gap: 8, padding: "8px 20px", borderRadius: 999,
          background: "#E4F4E6", border: `3px solid ${C.verde}`, transform: `scale(${seloS})`,
          boxShadow: `0 0 0 ${8 * blink}px rgba(62,158,78,${0.25 * blink})`,
        }}
      >
        <div style={{ width: 14, height: 14, borderRadius: 7, background: C.verde, opacity: blink }} />
        <span style={{ fontFamily: FONT, fontWeight: W.extraBold, fontSize: 26, color: C.verde }}>{openLabel}</span>
      </div>
      {/* botão Pedir agora */}
      <div
        style={{
          position: "absolute", right: 26, bottom: 26, padding: "14px 34px", borderRadius: 999, background: C.coral,
          boxShadow: `0 8px 0 ${C.coralDark}`, transform: `scale(${btnS})`, transformOrigin: "50% 50%",
        }}
      >
        <span style={{ fontFamily: FONT, fontWeight: W.extraBold, fontSize: 34, color: "#fff", whiteSpace: "nowrap" }}>{button}</span>
      </div>
    </div>
  );
};

// Card "fantasma" (atrás da pilha) — sem nomes.
export const PlaceholderCard: React.FC<{ width: number; tint?: string }> = ({ width, tint = C.amareloLight }) => (
  <div style={{ width, height: 330, borderRadius: 36, background: "#fff", border: "4px solid #F1E4D8", boxShadow: "0 14px 30px rgba(34,28,25,0.12)", padding: 26, display: "flex", gap: 24 }}>
    <div style={{ width: 176, height: 176, borderRadius: 30, background: tint, opacity: 0.7 }} />
    <div style={{ display: "flex", flexDirection: "column", gap: 18, paddingTop: 14 }}>
      <div style={{ width: 300, height: 34, borderRadius: 17, background: "#EFE6DB" }} />
      <div style={{ width: 220, height: 26, borderRadius: 13, background: "#F4EDE4" }} />
      <div style={{ width: 260, height: 26, borderRadius: 13, background: "#F4EDE4" }} />
    </div>
  </div>
);

// Linha do tempo do pedido. lit[i] ∈ [0,1] = etapa i acesa.
const STEP_ICONS = [
  (s: number) => <CheckIcon size={s} progress={1} />,
  (s: number) => <PanIcon size={s} />,
  (s: number) => <ScooterIcon size={s} color="#fff" />,
  (s: number) => <HouseIcon size={s} door={C.verde} />,
];
export const OrderTimeline: React.FC<{ labels: readonly string[]; lit: number[]; frame: number; width: number }> = ({ labels, lit, frame, width }) => {
  const rowH = 128;
  return (
    <div style={{ position: "relative", width, height: rowH * labels.length }}>
      {labels.slice(0, -1).map((_, i) => (
        <div key={`l${i}`} style={{ position: "absolute", left: 62, top: i * rowH + 100, width: 12, height: rowH - 72, borderRadius: 6, background: "#EADFD3", overflow: "hidden" }}>
          <div style={{ width: "100%", height: `${Math.min(1, lit[i + 1] * 1.4) * 100}%`, background: C.verde, borderRadius: 6 }} />
        </div>
      ))}
      {labels.map((label, i) => {
        const p = lit[i];
        const on = p > 0.02;
        const s = on ? 0.85 + 0.15 * Math.min(1.25, p) : 0.85;
        const current = on && (i === labels.length - 1 || lit[i + 1] < 0.02);
        const pulse = current ? 1 + 0.06 * Math.sin(frame * 0.3) : 1;
        return (
          <div key={label} style={{ position: "absolute", left: 0, top: i * rowH, display: "flex", alignItems: "center", gap: 30 }}>
            <div
              style={{
                width: 136, height: 100, display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 100, height: 100, borderRadius: 50, display: "flex", alignItems: "center", justifyContent: "center",
                  background: on ? (i === labels.length - 1 ? C.coral : C.verde) : "#EADFD3", transform: `scale(${s * pulse})`,
                  boxShadow: on ? `0 8px 0 ${i === labels.length - 1 ? C.coralDark : C.verdeDark}` : "none",
                }}
              >
                <div style={{ opacity: on ? 1 : 0.55 }}>{STEP_ICONS[i](58)}</div>
              </div>
            </div>
            <span style={{ fontFamily: FONT, fontWeight: W.extraBold, fontSize: 44, color: on ? C.tinta : "#B8ADA4", whiteSpace: "nowrap", transform: `translateX(${on ? 0 : 0}px)` }}>
              {label}
            </span>
            {current && <div style={{ width: 16, height: 16, borderRadius: 8, background: i === labels.length - 1 ? C.coral : C.verde, opacity: 0.5 + 0.5 * Math.sin(frame * 0.4) }} />}
          </div>
        );
      })}
    </div>
  );
};

// Estradinha com o motinho levando a sacola da loja até a casinha.
export const DeliveryRoad: React.FC<{ width: number; height: number; t: number; frame: number; arriveFrame: number }> = ({ width, height, t, frame, arriveFrame }) => {
  const x0 = 120;
  const x1 = width - 130;
  const yAt = (u: number) => height * 0.58 + Math.sin(u * Math.PI * 2) * height * 0.16;
  const pts = Array.from({ length: 41 }, (_, i) => i / 40).map((u) => `${x0 + (x1 - x0) * u},${yAt(u)}`).join(" ");
  const sx = x0 + (x1 - x0) * t;
  const sy = yAt(t);
  const slope = (yAt(Math.min(1, t + 0.01)) - yAt(Math.max(0, t - 0.01))) / ((x1 - x0) * 0.02);
  const moving = t > 0.001 && t < 0.999;
  const bounce = moving ? Math.abs(Math.sin(frame * 0.9)) * 7 : 0;
  const ta = frame - arriveFrame;
  const houseJump = ta >= 0 ? -Math.max(0, Math.sin(Math.min(ta, 12) / 12 * Math.PI)) * 40 : 0;
  const houseSquash = ta >= 12 ? 1 + 0.12 * Math.exp(-(ta - 12) * 0.25) * Math.cos((ta - 12) * 0.9) : 1;
  return (
    <div style={{ position: "relative", width, height }}>
      <svg width={width} height={height} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <polyline points={pts} stroke="#fff" strokeWidth={66} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={pts} stroke={C.amarelo} strokeWidth={52} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={pts} stroke="#fff" strokeWidth={5} strokeDasharray="18 22" fill="none" opacity={0.85} />
      </svg>
      {/* loja de origem */}
      <div style={{ position: "absolute", left: 6, top: yAt(0) - 150, width: 150, height: 150, borderRadius: 30, background: `linear-gradient(145deg, ${C.amarelo}, ${C.coral})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 20px rgba(34,28,25,0.15)" }}>
        <StoreIcon size={104} />
      </div>
      {/* casinha de destino */}
      <div style={{ position: "absolute", left: width - 170, top: yAt(1) - 168, transform: `translateY(${houseJump}px) scale(${1 / houseSquash}, ${houseSquash})`, transformOrigin: "50% 100%" }}>
        <svg width={160} height={168} viewBox="0 0 100 105">
          <ellipse cx="50" cy="102" rx="40" ry="4" fill="#000" opacity="0.1" />
          <rect x="16" y="44" width="68" height="56" rx="6" fill="#FFF3E2" stroke="#E9D3B7" strokeWidth="3" />
          <path d="M6 48 L50 10 L94 48 Z" fill={C.coral} />
          <rect x="42" y="66" width="18" height="34" rx="4" fill={C.verde} />
          <rect x="22" y="58" width="14" height="14" rx="3" fill={C.amareloLight} />
          <rect x="66" y="58" width="14" height="14" rx="3" fill={C.amareloLight} />
        </svg>
      </div>
      {/* corações saindo da casinha */}
      {ta >= 2 && [0, 1, 2, 3, 4].map((i) => {
        const tt = ta - 2 - i * 3;
        if (tt < 0 || tt > 40) return null;
        const s = pop(tt, 0, { damping: 8, stiffness: 220 }) * (1 - Math.max(0, (tt - 26) / 14));
        return (
          <div key={i} style={{ position: "absolute", left: width - 95 + (i - 2) * 34 + Math.sin(tt * 0.3 + i) * 12, top: yAt(1) - 190 - tt * 4.5, transform: `translate(-50%,-50%) scale(${s})` }}>
            <HeartShape size={52} color={[C.coral, C.coralLight, C.amarelo][i % 3]} />
          </div>
        );
      })}
      {/* motinho */}
      <div
        style={{
          position: "absolute", left: sx - 70, top: sy - 118 - bounce, width: 140, height: 140,
          transform: `rotate(${Math.atan(slope) * 57.3 * 0.6}deg)`, transformOrigin: "50% 90%",
        }}
      >
        {moving && [0, 1, 2].map((i) => (
          <div key={i} style={{ position: "absolute", left: -18 - i * 22, top: 92 - ((frame + i * 4) % 12) * 1.5, width: 18 - i * 4, height: 18 - i * 4, borderRadius: "50%", background: "#fff", opacity: 0.85 - i * 0.25, border: `2px solid ${C.cremeDeep}` }} />
        ))}
        <ScooterIcon size={140} wheelSpin={frame * 30} />
      </div>
    </div>
  );
};
