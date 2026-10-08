import React from "react";
import { C } from "../config/theme";

// Ícones flat 2D desenhados em SVG (viewBox 0 0 100 100), no estilo das referências.

type P = { size?: number; style?: React.CSSProperties };

const Svg: React.FC<P & { children: React.ReactNode; vb?: string }> = ({ size = 100, style, children, vb = "0 0 100 100" }) => (
  <svg width={size} height={size} viewBox={vb} style={{ overflow: "visible", ...style }}>
    {children}
  </svg>
);

export const BurgerIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <ellipse cx="50" cy="88" rx="34" ry="5" fill="#000" opacity="0.12" />
    <rect x="14" y="66" width="72" height="16" rx="8" fill="#E8932E" />
    <rect x="18" y="56" width="64" height="13" rx="6.5" fill="#6B3518" />
    <path d="M14 56 L86 56 L80 64 L68 58 L56 66 L46 58 L34 65 L24 58 Z" fill={C.amarelo} />
    <path d="M12 51 Q20 45 28 51 Q36 57 44 51 Q52 45 60 51 Q68 57 76 51 Q84 45 90 51 L88 56 L12 56 Z" fill={C.verde} />
    <path d="M14 50 C14 26 30 16 50 16 C70 16 86 26 86 50 Z" fill="#F0A43A" />
    <path d="M24 38 C26 28 36 22 48 21" stroke="#FFD27A" strokeWidth="5" strokeLinecap="round" fill="none" />
    {[[36, 30], [50, 26], [62, 32], [44, 38], [70, 40], [30, 42]].map(([x, y], i) => (
      <ellipse key={i} cx={x} cy={y} rx="2.6" ry="1.6" fill="#FFF4DE" transform={`rotate(${i * 25} ${x} ${y})`} />
    ))}
  </Svg>
);

export const CartIcon: React.FC<P & { color?: string }> = ({ color = C.verde, ...p }) => (
  <Svg {...p}>
    <ellipse cx="54" cy="91" rx="32" ry="4.5" fill="#000" opacity="0.12" />
    <path d="M8 18 L22 18 L32 66 L80 66" stroke={C.verdeDark} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M24 28 L90 28 L82 58 L30 58 Z" fill={color} />
    <path d="M24 28 L90 28 L82 58 L30 58 Z" fill="none" stroke={C.verdeDark} strokeWidth="4" strokeLinejoin="round" />
    {[42, 56, 70].map((x) => (
      <line key={x} x1={x} y1="30" x2={x - 2} y2="56" stroke={C.verdeDark} strokeWidth="3.4" />
    ))}
    <line x1="27" y1="43" x2="86" y2="43" stroke={C.verdeDark} strokeWidth="3.4" />
    <path d="M30 32 L52 32" stroke={C.verdeLight} strokeWidth="4" strokeLinecap="round" />
    <circle cx="38" cy="80" r="7" fill={C.tinta} />
    <circle cx="74" cy="80" r="7" fill={C.tinta} />
    <circle cx="38" cy="80" r="2.6" fill={C.cremeDark} />
    <circle cx="74" cy="80" r="2.6" fill={C.cremeDark} />
  </Svg>
);

export const CrossIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <ellipse cx="50" cy="92" rx="26" ry="4" fill="#000" opacity="0.12" />
    <path d="M38 10 H62 Q66 10 66 14 V34 H86 Q90 34 90 38 V62 Q90 66 86 66 H66 V86 Q66 90 62 90 H38 Q34 90 34 86 V66 H14 Q10 66 10 62 V38 Q10 34 14 34 H34 V14 Q34 10 38 10 Z" fill={C.verde} />
    <path d="M40 16 H58 V38 H82 V44 H58 V20 H40 Z" fill={C.verdeLight} opacity="0.9" />
    <path d="M66 66 H86 Q90 66 90 62 V58 H66 Z M34 86 Q34 90 38 90 H62 Q66 90 66 86 V82 H34 Z" fill={C.verdeDark} opacity="0.55" />
  </Svg>
);

export const BreadIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <ellipse cx="50" cy="86" rx="38" ry="5" fill="#000" opacity="0.12" />
    <path d="M10 62 C8 38 28 22 50 22 C72 22 92 38 90 62 C89 74 78 80 50 80 C22 80 11 74 10 62 Z" fill="#E8932E" />
    <path d="M14 58 C14 40 30 28 50 28 C70 28 86 40 86 58 C86 66 76 70 50 70 C24 70 14 66 14 58 Z" fill="#F2AE4A" />
    {[28, 42, 56, 70].map((x) => (
      <path key={x} d={`M${x} 36 Q${x + 6} 46 ${x + 2} 58`} stroke="#C46F1C" strokeWidth="4.5" strokeLinecap="round" fill="none" />
    ))}
    <path d="M22 44 C26 36 34 32 40 31" stroke="#FFD891" strokeWidth="4.5" strokeLinecap="round" fill="none" />
  </Svg>
);

export const PawIcon: React.FC<P & { color?: string }> = ({ color = C.coral, ...p }) => (
  <Svg {...p}>
    <ellipse cx="50" cy="92" rx="28" ry="4" fill="#000" opacity="0.12" />
    <path d="M50 46 C64 46 78 60 76 72 C74 84 62 80 50 80 C38 80 26 84 24 72 C22 60 36 46 50 46 Z" fill={color} />
    <ellipse cx="22" cy="44" rx="9" ry="12" fill={color} transform="rotate(-20 22 44)" />
    <ellipse cx="39" cy="26" rx="9.5" ry="13" fill={color} transform="rotate(-6 39 26)" />
    <ellipse cx="61" cy="26" rx="9.5" ry="13" fill={color} transform="rotate(6 61 26)" />
    <ellipse cx="78" cy="44" rx="9" ry="12" fill={color} transform="rotate(20 78 44)" />
    <ellipse cx="42" cy="56" rx="6" ry="3" fill="#fff" opacity="0.35" />
  </Svg>
);

export const CATEGORY_ICONS = [BurgerIcon, CartIcon, CrossIcon, BreadIcon, PawIcon];

// --- glifos de apps genéricos (cena 1) ---
export const APP_GLYPHS: Array<(c: string) => React.ReactNode> = [
  (c) => <path d="M22 30 H78 Q84 30 84 36 V62 Q84 68 78 68 H44 L30 80 V68 H22 Q16 68 16 62 V36 Q16 30 22 30 Z" fill={c} />,
  (c) => (
    <g>
      <rect x="16" y="32" width="68" height="46" rx="10" fill={c} />
      <rect x="36" y="24" width="28" height="12" rx="4" fill={c} />
      <circle cx="50" cy="55" r="13" fill="rgba(0,0,0,0.25)" />
    </g>
  ),
  (c) => <path d="M40 22 L76 16 V62 A10 10 0 1 1 68 52 V30 L46 34 V70 A10 10 0 1 1 38 60 Z" fill={c} />,
  (c) => <path d="M34 22 L78 50 L34 78 Z" fill={c} />,
  (c) => <path d="M50 14 L60 38 L86 40 L66 57 L72 83 L50 69 L28 83 L34 57 L14 40 L40 38 Z" fill={c} />,
  (c) => <path d="M50 82 C20 62 12 46 18 34 C24 22 42 22 50 36 C58 22 76 22 82 34 C88 46 80 62 50 82 Z" fill={c} />,
  (c) => <path d="M28 70 C14 70 12 52 26 50 C26 34 46 28 54 42 C62 32 80 38 76 52 C90 54 88 70 74 70 Z" fill={c} />,
  (c) => (
    <g>
      <rect x="16" y="28" width="68" height="46" rx="8" fill={c} />
      <path d="M18 32 L50 56 L82 32" stroke="rgba(0,0,0,0.25)" strokeWidth="6" fill="none" strokeLinejoin="round" />
    </g>
  ),
  (c) => <path d="M56 12 L24 56 H46 L40 88 L76 40 H54 Z" fill={c} />,
  (c) => (
    <g>
      <path d="M50 88 C50 88 22 58 22 40 A28 28 0 0 1 78 40 C78 58 50 88 50 88 Z" fill={c} />
      <circle cx="50" cy="40" r="10" fill="rgba(0,0,0,0.25)" />
    </g>
  ),
  (c) => (
    <g>
      <rect x="18" y="38" width="64" height="34" rx="17" fill={c} />
      <rect x="28" y="50" width="16" height="6" rx="3" fill="rgba(0,0,0,0.25)" />
      <rect x="33" y="45" width="6" height="16" rx="3" fill="rgba(0,0,0,0.25)" />
      <circle cx="64" cy="50" r="4" fill="rgba(0,0,0,0.25)" />
      <circle cx="71" cy="58" r="4" fill="rgba(0,0,0,0.25)" />
    </g>
  ),
  (c) => (
    <g>
      <circle cx="50" cy="52" r="32" fill={c} />
      <path d="M50 32 V52 L64 60" stroke="rgba(0,0,0,0.28)" strokeWidth="7" strokeLinecap="round" fill="none" />
    </g>
  ),
];

export const AppIcon: React.FC<{ size: number; bg: string; glyph: number; glyphColor?: string; style?: React.CSSProperties }> = ({
  size, bg, glyph, glyphColor = "#fff", style,
}) => (
  <div
    style={{
      width: size, height: size, borderRadius: size * 0.26, background: bg,
      boxShadow: `inset 0 ${-size * 0.08}px 0 rgba(0,0,0,0.16), 0 ${size * 0.06}px ${size * 0.12}px rgba(34,28,25,0.18)`,
      display: "flex", alignItems: "center", justifyContent: "center", ...style,
    }}
  >
    <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 100 100">{APP_GLYPHS[glyph % APP_GLYPHS.length](glyphColor)}</svg>
  </div>
);

// --- "emojis" desenhados (consistentes com o estilo flat) ---
export const TiredFace: React.FC<P> = (p) => (
  <Svg {...p}>
    <circle cx="50" cy="52" r="44" fill={C.amarelo} />
    <circle cx="50" cy="52" r="44" fill="none" stroke={C.amareloDark} strokeWidth="4" />
    <path d="M22 30 Q30 24 40 30" stroke={C.tinta} strokeWidth="5.5" strokeLinecap="round" fill="none" />
    <path d="M60 30 Q70 24 78 30" stroke={C.tinta} strokeWidth="5.5" strokeLinecap="round" fill="none" />
    <path d="M26 44 L38 40 L26 36" stroke={C.tinta} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M74 44 L62 40 L74 36" stroke={C.tinta} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M30 76 Q30 56 50 56 Q70 56 70 76 Q60 70 50 70 Q40 70 30 76 Z" fill={C.tinta} />
    <path d="M38 72 Q50 64 62 72" stroke={C.coral} strokeWidth="5" strokeLinecap="round" fill="none" />
    <ellipse cx="22" cy="58" rx="7" ry="4" fill={C.coral} opacity="0.35" />
    <ellipse cx="78" cy="58" rx="7" ry="4" fill={C.coral} opacity="0.35" />
  </Svg>
);

export const LinkIcon: React.FC<P & { color?: string }> = ({ color = C.amarelo, ...p }) => (
  <Svg {...p}>
    <g transform="rotate(-45 50 50)">
      <rect x="6" y="34" width="50" height="32" rx="16" fill="none" stroke={color} strokeWidth="11" />
      <rect x="44" y="34" width="50" height="32" rx="16" fill="none" stroke={color} strokeWidth="11" />
      <rect x="6" y="34" width="50" height="32" rx="16" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="3" />
    </g>
  </Svg>
);

export const BellGlyph: React.FC<P & { swing?: number }> = ({ swing = 0, ...p }) => (
  <Svg {...p}>
    <g transform={`rotate(${swing} 50 12)`}>
      <circle cx={50 + swing * 0.25} cy="84" r="9" fill={C.coral} />
      <path d="M50 10 C30 10 22 28 22 46 C22 60 16 66 10 72 H90 C84 66 78 60 78 46 C78 28 70 10 50 10 Z" fill={C.amarelo} />
      <path d="M10 72 H90 Q92 80 84 80 H16 Q8 80 10 72 Z" fill={C.amareloDark} />
      <path d="M34 26 C30 32 29 40 29 48" stroke={C.amareloLight} strokeWidth="6" strokeLinecap="round" fill="none" />
      <circle cx="50" cy="9" r="6" fill={C.amareloDark} />
    </g>
  </Svg>
);

export const Lock: React.FC<P & { color?: string }> = ({ color = C.verde, ...p }) => (
  <Svg {...p}>
    <rect x="20" y="44" width="60" height="46" rx="10" fill={color} />
    <path d="M32 46 V32 A18 18 0 0 1 68 32 V46" stroke={color} strokeWidth="10" fill="none" />
    <circle cx="50" cy="64" r="6" fill="#fff" />
  </Svg>
);
