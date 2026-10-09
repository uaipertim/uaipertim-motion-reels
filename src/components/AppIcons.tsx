import React from "react";
import { C } from "../config/theme";

// Ícones da interface do app (Vídeo 2) — flat 2D, viewBox 0 0 100 100.

type P = { size?: number; style?: React.CSSProperties; color?: string };

const Svg: React.FC<{ size?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({ size = 100, style, children }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: "visible", ...style }}>
    {children}
  </svg>
);

export const SearchIcon: React.FC<P> = ({ color = C.coral, ...p }) => (
  <Svg {...p}>
    <circle cx="42" cy="42" r="26" fill="none" stroke={color} strokeWidth="11" />
    <path d="M62 62 L84 84" stroke={color} strokeWidth="13" strokeLinecap="round" />
    <path d="M30 32 Q34 24 42 22" stroke="#fff" strokeOpacity="0.5" strokeWidth="5" strokeLinecap="round" fill="none" />
  </Svg>
);

export const PinIcon: React.FC<P> = ({ color = C.coral, ...p }) => (
  <Svg {...p}>
    <path d="M50 94 C50 94 16 58 16 38 A34 34 0 0 1 84 38 C84 58 50 94 50 94 Z" fill={color} />
    <circle cx="50" cy="37" r="13" fill="#fff" />
  </Svg>
);

export const StarIcon: React.FC<P> = ({ color = C.amarelo, ...p }) => (
  <Svg {...p}>
    <path d="M50 6 L62 36 L94 38 L69 58 L78 90 L50 72 L22 90 L31 58 L6 38 L38 36 Z" fill={color} stroke={color} strokeWidth="6" strokeLinejoin="round" />
  </Svg>
);

export const ClockIcon: React.FC<P> = ({ color = C.tinta, ...p }) => (
  <Svg {...p}>
    <circle cx="50" cy="50" r="38" fill="none" stroke={color} strokeWidth="9" />
    <path d="M50 28 V52 L66 62" stroke={color} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </Svg>
);

export const CheckIcon: React.FC<P & { progress?: number }> = ({ color = "#fff", progress = 1, ...p }) => (
  <Svg {...p}>
    <path d="M22 52 L42 72 L80 30" stroke={color} strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" fill="none"
      strokeDasharray={100} strokeDashoffset={100 * (1 - progress)} />
  </Svg>
);

export const PanIcon: React.FC<P> = ({ color = "#fff", ...p }) => (
  <Svg {...p}>
    <ellipse cx="44" cy="58" rx="32" ry="20" fill={color} />
    <rect x="70" y="52" width="26" height="10" rx="5" fill={color} transform="rotate(-12 70 52)" />
    <ellipse cx="44" cy="54" rx="13" ry="9" fill={C.amarelo} />
    <path d="M30 26 Q36 18 30 10 M44 26 Q50 18 44 10 M58 26 Q64 18 58 10" stroke={color} strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.8" />
  </Svg>
);

export const HouseIcon: React.FC<P & { door?: string }> = ({ color = "#fff", door = C.coral, ...p }) => (
  <Svg {...p}>
    <path d="M12 48 L50 14 L88 48" stroke={color} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M22 44 L50 20 L78 44 V86 H22 Z" fill={color} />
    <rect x="42" y="58" width="16" height="28" rx="3" fill={door} />
  </Svg>
);

// Motinho de entrega com baú (sem pessoa).
export const ScooterIcon: React.FC<P & { wheelSpin?: number }> = ({ color = C.coral, wheelSpin = 0, ...p }) => (
  <Svg {...p}>
    {/* baú */}
    <rect x="8" y="22" width="34" height="30" rx="6" fill={C.amarelo} />
    <path d="M8 30 H42" stroke={C.amareloDark} strokeWidth="4" />
    <rect x="18" y="34" width="14" height="6" rx="3" fill="#fff" opacity="0.8" />
    {/* corpo */}
    <path d="M14 56 H58 L70 40 H80 L76 46 L68 62 Q60 72 46 72 H22 Q12 72 14 56 Z" fill={color} />
    <path d="M70 40 L64 20" stroke={C.tinta} strokeWidth="6" strokeLinecap="round" />
    <path d="M58 20 H72" stroke={C.tinta} strokeWidth="6" strokeLinecap="round" />
    <circle cx="80" cy="44" r="4" fill={C.amareloLight} />
    {/* rodas */}
    {[22, 74].map((cx) => (
      <g key={cx} transform={`rotate(${wheelSpin} ${cx} 76)`}>
        <circle cx={cx} cy="76" r="13" fill={C.tinta} />
        <circle cx={cx} cy="76" r="5" fill={C.cremeDark} />
        <path d={`M${cx} 66 V86`} stroke={C.cremeDark} strokeWidth="2.5" />
      </g>
    ))}
  </Svg>
);

// Lojinha (miniatura do card de estabelecimento).
export const StoreIcon: React.FC<P> = ({ color = "#fff", ...p }) => (
  <Svg {...p}>
    <rect x="18" y="44" width="64" height="44" rx="4" fill={color} />
    {Array.from({ length: 5 }).map((_, i) => (
      <path key={i} d={`M${14 + i * 14.4} 30 H${28.4 + i * 14.4} V44 A7.2 7.2 0 0 1 ${14 + i * 14.4} 44 Z`} fill={i % 2 === 0 ? C.coralDark : "#fff"} />
    ))}
    <rect x="12" y="24" width="76" height="8" rx="4" fill={color} />
    <rect x="28" y="56" width="18" height="32" rx="3" fill={C.coral} />
    <rect x="54" y="56" width="20" height="16" rx="3" fill={C.amareloLight} />
  </Svg>
);

// Grade "Todos" (categoria).
export const GridIcon: React.FC<P> = ({ color = C.coral, ...p }) => (
  <Svg {...p}>
    {[[14, 14], [54, 14], [14, 54], [54, 54]].map(([x, y]) => (
      <rect key={`${x}-${y}`} x={x} y={y} width="32" height="32" rx="9" fill="none" stroke={color} strokeWidth="9" />
    ))}
  </Svg>
);

// Setinha cartoon curva apontando (sem mão humana).
export const PointerArrow: React.FC<P & { flip?: boolean }> = ({ color = C.coral, flip = false, ...p }) => (
  <Svg {...p}>
    <g transform={flip ? "translate(100 0) scale(-1 1)" : undefined}>
      <path d="M86 14 C 60 10, 30 24, 26 66" stroke={color} strokeWidth="12" strokeLinecap="round" fill="none" />
      <path d="M10 56 L26 84 L44 58 Z" fill={color} stroke={color} strokeWidth="6" strokeLinejoin="round" />
    </g>
  </Svg>
);

export const DownArrow: React.FC<P> = ({ color = C.coral, ...p }) => (
  <Svg {...p}>
    <path d="M50 10 V70" stroke={color} strokeWidth="16" strokeLinecap="round" />
    <path d="M22 52 L50 86 L78 52" stroke={color} strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </Svg>
);

export const WinkFace: React.FC<P> = (p) => (
  <Svg {...p}>
    <circle cx="50" cy="52" r="44" fill={C.amarelo} />
    <circle cx="50" cy="52" r="44" fill="none" stroke={C.amareloDark} strokeWidth="4" />
    <ellipse cx="34" cy="42" rx="6" ry="9" fill={C.tinta} />
    <path d="M58 44 Q67 36 76 44" stroke={C.tinta} strokeWidth="6" strokeLinecap="round" fill="none" />
    <path d="M28 64 Q50 86 74 62" stroke={C.tinta} strokeWidth="7" strokeLinecap="round" fill="none" />
    <ellipse cx="22" cy="60" rx="7" ry="4" fill={C.coral} opacity="0.35" />
    <ellipse cx="80" cy="58" rx="7" ry="4" fill={C.coral} opacity="0.35" />
  </Svg>
);
