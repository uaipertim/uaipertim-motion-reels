import React from "react";
import { C } from "../config/theme";

// Elementos de cenário da cidadezinha (flat 2D).

export const Tree: React.FC<{ size: number; sway?: number; style?: React.CSSProperties }> = ({ size, sway = 0, style }) => (
  <svg width={size} height={size * 1.3} viewBox="0 0 100 130" style={{ overflow: "visible", ...style }}>
    <ellipse cx="50" cy="126" rx="30" ry="5" fill="#000" opacity="0.1" />
    <rect x="44" y="78" width="12" height="48" rx="5" fill="#9A5B2E" />
    <g transform={`rotate(${sway} 50 120)`}>
      <circle cx="50" cy="48" r="34" fill={C.verde} />
      <circle cx="28" cy="66" r="22" fill={C.verde} />
      <circle cx="72" cy="66" r="22" fill={C.verde} />
      <circle cx="40" cy="38" r="14" fill={C.verdeLight} opacity="0.8" />
      <circle cx="64" cy="74" r="12" fill={C.verdeDark} opacity="0.35" />
    </g>
  </svg>
);

export const Cloud: React.FC<{ width: number; style?: React.CSSProperties; color?: string }> = ({ width, style, color = "#fff" }) => (
  <svg width={width} height={width * 0.45} viewBox="0 0 200 90" style={style}>
    <path d="M30 80 C8 80 6 54 28 52 C28 30 58 22 72 40 C82 14 128 14 134 44 C152 34 180 44 176 64 C196 66 194 80 176 80 Z" fill={color} />
  </svg>
);

// Silhueta de prédios ao fundo (como nas referências).
export const CitySilhouette: React.FC<{ width: number; height: number; color?: string; style?: React.CSSProperties }> = ({
  width, height, color = "#F1D9C2", style,
}) => (
  <svg width={width} height={height} viewBox="0 0 1080 400" preserveAspectRatio="none" style={style}>
    <path
      d="M0 400 V250 H60 V180 H120 V230 H170 V120 H250 V210 H300 V160 H360 V240 H420 V90 H500 V200 H560 V150 H640 V230 H700 V110 H780 V190 H840 V140 H900 V220 H960 V170 H1020 V240 H1080 V400 Z"
      fill={color}
    />
    {[190, 440, 720, 860].map((x) => (
      <g key={x} fill="#fff" opacity="0.35">
        <rect x={x} y={150} width="14" height="18" /><rect x={x + 26} y={150} width="14" height="18" />
        <rect x={x} y={185} width="14" height="18" /><rect x={x + 26} y={185} width="14" height="18" />
      </g>
    ))}
  </svg>
);

// Lojinha cartoon: toldo listrado + placa + porta + vitrine.
export type ShopKind = "mercado" | "padaria" | "restaurante" | "farmacia" | "pet" | "loja";
const SHOP_STYLE: Record<ShopKind, { wall: string; wallDark: string; awningA: string; awningB: string; sign: string; signText: string; door: string }> = {
  mercado: { wall: "#E9944A", wallDark: "#C9752E", awningA: C.verde, awningB: "#fff", sign: C.verde, signText: "#fff", door: C.verdeDark },
  padaria: { wall: "#F2B35B", wallDark: "#D8923A", awningA: C.amarelo, awningB: "#fff", sign: "#FFF2DC", signText: "#8A4A1C", door: "#8A4A1C" },
  restaurante: { wall: "#E07B3C", wallDark: "#BF5F26", awningA: C.coral, awningB: "#fff", sign: "#FFF2DC", signText: C.coralDark, door: "#7A3A18" },
  farmacia: { wall: "#F7F1E6", wallDark: "#E2D6C2", awningA: C.verde, awningB: "#fff", sign: "#fff", signText: C.verdeDark, door: C.verdeDark },
  pet: { wall: "#F5C27A", wallDark: "#DDA052", awningA: C.coralLight, awningB: "#fff", sign: C.coral, signText: "#fff", door: "#8A4A1C" },
  loja: { wall: "#F09A6E", wallDark: "#D27A4E", awningA: C.amarelo, awningB: C.coral, sign: "#fff", signText: C.coral, door: "#7A3A18" },
};

export const Shop: React.FC<{ kind: ShopKind; label: string; width: number; style?: React.CSSProperties }> = ({ kind, label, width, style }) => {
  const s = SHOP_STYLE[kind];
  const stripes = 6;
  const fontSize = label.length > 9 ? 17 : label.length > 7 ? 20 : 23;
  return (
    <svg width={width} height={width * 1.05} viewBox="0 0 200 210" style={{ overflow: "visible", ...style }}>
      <ellipse cx="100" cy="206" rx="96" ry="7" fill="#000" opacity="0.1" />
      <rect x="14" y="58" width="172" height="148" rx="6" fill={s.wall} />
      <rect x="14" y="190" width="172" height="16" fill={s.wallDark} />
      {/* placa */}
      <rect x="22" y="10" width="156" height="44" rx="10" fill={s.sign} stroke={s.wallDark} strokeWidth="4" />
      <text x="100" y={39 + (23 - fontSize) * 0.3} textAnchor="middle" fontFamily="Poppins" fontWeight={900} fontSize={fontSize} fill={s.signText}>
        {label}
      </text>
      {kind === "farmacia" && <path d="M92 64 h16 v12 h12 v16 h-12 v12 h-16 v-12 h-12 v-16 h12 z" fill={C.verde} transform="translate(64 -4) scale(0.8)" />}
      {/* toldo */}
      {Array.from({ length: stripes }).map((_, i) => {
        const w = 184 / stripes;
        const x = 8 + i * w;
        return (
          <g key={i}>
            <path d={`M${x} 60 H${x + w} V86 A${w / 2} ${w / 2.4} 0 0 1 ${x} 86 Z`} fill={i % 2 === 0 ? s.awningA : s.awningB} />
          </g>
        );
      })}
      <rect x="6" y="54" width="188" height="10" rx="5" fill={s.wallDark} />
      {/* vitrine + porta */}
      <rect x="28" y="112" width="74" height="62" rx="8" fill="#5A3A2A" />
      <rect x="32" y="116" width="66" height="54" rx="6" fill="#FFE8C2" />
      <path d="M36 166 Q50 150 64 166 Z" fill={kind === "mercado" ? C.coral : C.amarelo} />
      <circle cx="78" cy="160" r="9" fill={kind === "mercado" ? C.verde : C.coral} />
      <rect x="118" y="108" width="54" height="98" rx="8" fill={s.door} />
      <rect x="126" y="118" width="38" height="36" rx="5" fill="#FFE8C2" opacity="0.8" />
      <circle cx="160" cy="166" r="4" fill={C.amarelo} />
    </svg>
  );
};

// Marcador de mapa (pin coral).
export const MapPin: React.FC<{ size: number; color?: string; style?: React.CSSProperties }> = ({ size, color = C.coral, style }) => (
  <svg width={size} height={size * 1.3} viewBox="0 0 100 130" style={{ overflow: "visible", ...style }}>
    <path d="M50 126 C50 126 8 78 8 48 A42 42 0 0 1 92 48 C92 78 50 126 50 126 Z" fill={color} />
    <path d="M50 126 C50 126 8 78 8 48 A42 42 0 0 1 50 6 C30 20 26 60 50 126 Z" fill="#fff" opacity="0.14" />
    <path d="M50 126 C62 104 92 76 92 48 A42 42 0 0 0 76 15 C82 48 66 90 50 126 Z" fill={C.coralDark} opacity="0.35" />
    <circle cx="50" cy="46" r="18" fill="#fff" />
  </svg>
);
