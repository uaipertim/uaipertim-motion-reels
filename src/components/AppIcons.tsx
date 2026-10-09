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

// ---- Vídeo 3 ----

// 👀 olhinhos
export const EyesIcon: React.FC<P & { look?: number }> = ({ look = 0, ...p }) => (
  <Svg {...p}>
    {[30, 70].map((cx) => (
      <g key={cx}>
        <ellipse cx={cx} cy="50" rx="18" ry="24" fill="#fff" stroke={C.tinta} strokeWidth="5" />
        <circle cx={cx + 6 * look} cy="54" r="9" fill={C.tinta} />
        <circle cx={cx + 6 * look - 3} cy="50" r="3" fill="#fff" />
      </g>
    ))}
  </Svg>
);

// 💬 balão de chat
export const ChatIcon: React.FC<P & { dots?: boolean }> = ({ color = C.coral, dots = true, ...p }) => (
  <Svg {...p}>
    <path d="M18 18 H82 Q92 18 92 28 V62 Q92 72 82 72 H44 L24 88 V72 H18 Q8 72 8 62 V28 Q8 18 18 18 Z" fill={color} />
    {dots && [32, 50, 68].map((x) => <circle key={x} cx={x} cy="45" r="6" fill="#fff" />)}
  </Svg>
);

// 📣 megafone
export const MegaphoneIcon: React.FC<P> = ({ color = C.coral, ...p }) => (
  <Svg {...p}>
    <path d="M14 40 H30 L74 16 V84 L30 60 H14 Z" fill={color} strokeLinejoin="round" />
    <rect x="22" y="58" width="12" height="24" rx="5" fill={C.coralDark} />
    <rect x="74" y="16" width="10" height="68" rx="5" fill={C.amarelo} />
    <path d="M90 34 Q98 50 90 66" stroke={C.amarelo} strokeWidth="6" strokeLinecap="round" fill="none" />
  </Svg>
);

// 😋 carinha de "hmm, que delícia"
export const YumFace: React.FC<P> = (p) => (
  <Svg {...p}>
    <circle cx="50" cy="52" r="44" fill={C.amarelo} />
    <path d="M24 44 Q34 34 44 44 M56 44 Q66 34 76 44" stroke={C.tinta} strokeWidth="6" strokeLinecap="round" fill="none" />
    <path d="M28 62 Q50 84 72 62" stroke={C.tinta} strokeWidth="6" strokeLinecap="round" fill="none" />
    <path d="M58 70 Q66 86 74 72 Z" fill={C.coral} />
    <ellipse cx="22" cy="60" rx="7" ry="4" fill={C.coral} opacity="0.35" />
    <ellipse cx="80" cy="58" rx="7" ry="4" fill={C.coral} opacity="0.35" />
  </Svg>
);

// 💊 cápsula
export const PillIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <g transform="rotate(-40 50 50)">
      <rect x="14" y="34" width="72" height="32" rx="16" fill="#fff" stroke={C.tinta} strokeWidth="4" />
      <path d="M50 34 H70 A16 16 0 0 1 70 66 H50 Z" fill={C.coral} />
      <rect x="22" y="40" width="20" height="6" rx="3" fill="#fff" opacity="0.8" />
    </g>
  </Svg>
);

// garrafa (bebidas)
export const BottleIcon: React.FC<P> = ({ color = C.verde, ...p }) => (
  <Svg {...p}>
    <rect x="40" y="6" width="20" height="10" rx="3" fill={C.coral} />
    <path d="M42 16 H58 V30 Q72 38 72 54 V86 Q72 94 64 94 H36 Q28 94 28 86 V54 Q28 38 42 30 Z" fill={color} />
    <rect x="30" y="54" width="40" height="22" rx="4" fill={C.amarelo} />
    <path d="M36 42 Q40 36 44 34" stroke="#fff" strokeOpacity="0.6" strokeWidth="5" strokeLinecap="round" fill="none" />
  </Svg>
);

// folha (hortifrúti)
export const LeafIcon: React.FC<P> = ({ color = C.verde, ...p }) => (
  <Svg {...p}>
    <path d="M18 84 C 14 40, 50 12, 88 12 C 88 54, 62 88, 18 84 Z" fill={color} />
    <path d="M22 80 C 40 62, 56 44, 78 22" stroke={C.verdeDark} strokeWidth="5" strokeLinecap="round" fill="none" />
    <path d="M34 50 Q30 40 40 34" stroke="#fff" strokeOpacity="0.5" strokeWidth="5" strokeLinecap="round" fill="none" />
  </Svg>
);

// prato com tampa (restaurante)
export const DishIcon: React.FC<P> = ({ color = C.coral, ...p }) => (
  <Svg {...p}>
    <path d="M38 22 Q42 14 38 8 M54 20 Q58 12 54 6" stroke={C.cremeDeep} strokeWidth="5" strokeLinecap="round" fill="none" />
    <circle cx="50" cy="34" r="6" fill={C.coralDark} />
    <path d="M14 72 C14 48 30 36 50 36 C70 36 86 48 86 72 Z" fill={color} />
    <path d="M26 62 C28 52 36 46 46 44" stroke="#fff" strokeOpacity="0.55" strokeWidth="6" strokeLinecap="round" fill="none" />
    <rect x="6" y="72" width="88" height="10" rx="5" fill={C.amarelo} />
    <rect x="18" y="82" width="64" height="7" rx="3.5" fill={C.amareloDark} />
  </Svg>
);

// ---- Vídeo 4 ----

// 👋 mãozinha de emoji acenando (desenho de emoji, não figura humana)
export const WaveHandIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M16 30 Q12 22 20 20" stroke={C.amareloDark} strokeWidth="5" strokeLinecap="round" fill="none" />
    <path d="M10 44 Q4 34 10 26" stroke={C.amareloDark} strokeWidth="5" strokeLinecap="round" fill="none" />
    <g transform="rotate(-14 56 60)">
      <rect x="34" y="20" width="13" height="40" rx="6.5" fill={C.amarelo} />
      <rect x="48" y="12" width="13" height="46" rx="6.5" fill={C.amarelo} />
      <rect x="62" y="16" width="13" height="44" rx="6.5" fill={C.amarelo} />
      <rect x="76" y="26" width="12" height="36" rx="6" fill={C.amarelo} />
      <path d="M32 50 H88 V66 Q88 92 62 92 Q40 92 34 74 L22 54 Q18 46 26 44 Q30 43 34 50 Z" fill={C.amarelo} />
      <path d="M44 70 Q50 80 60 80" stroke={C.amareloDark} strokeWidth="4" strokeLinecap="round" fill="none" />
    </g>
  </Svg>
);

// 📲 celular com setinha entrando
export const PhoneArrowIcon: React.FC<P> = ({ color = C.coral, ...p }) => (
  <Svg {...p}>
    <rect x="38" y="8" width="44" height="84" rx="10" fill={C.tinta} />
    <rect x="43" y="16" width="34" height="62" rx="5" fill={C.creme} />
    <circle cx="60" cy="85" r="3" fill="#6E5B52" />
    <path d="M6 48 H34" stroke={color} strokeWidth="9" strokeLinecap="round" />
    <path d="M24 36 L38 48 L24 60" stroke={color} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <circle cx="60" cy="40" r="9" fill={color} />
    <circle cx="60" cy="40" r="3.5" fill="#fff" />
  </Svg>
);

// 📦 caixinha de produto
export const BoxIcon: React.FC<P> = ({ color = "#E2A15C", ...p }) => (
  <Svg {...p}>
    <path d="M50 10 L90 28 L50 46 L10 28 Z" fill="#F0BE80" />
    <path d="M10 28 L50 46 V92 L10 74 Z" fill={color} />
    <path d="M90 28 L50 46 V92 L90 74 Z" fill="#C9833F" />
    <path d="M30 19 L70 37 V52 L62 48 V40 L22 22 Z" fill={C.amareloLight} />
    <path d="M24 66 L36 71" stroke="#fff" strokeOpacity="0.7" strokeWidth="4" strokeLinecap="round" />
  </Svg>
);

// 📝 folha com lápis
export const NoteIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <rect x="14" y="10" width="56" height="78" rx="8" fill="#fff" stroke={C.cremeDeep} strokeWidth="4" />
    {[28, 40, 52, 64].map((y, i) => (
      <rect key={y} x="24" y={y} width={i === 3 ? 22 : 36} height="5" rx="2.5" fill={i === 0 ? C.coral : C.cremeDeep} />
    ))}
    <g transform="rotate(40 70 60)">
      <rect x="62" y="20" width="16" height="56" rx="3" fill={C.amarelo} />
      <rect x="62" y="20" width="16" height="10" rx="3" fill={C.coral} />
      <path d="M62 76 L70 92 L78 76 Z" fill="#F3D9B5" />
      <path d="M67 86 L70 92 L73 86 Z" fill={C.tinta} />
    </g>
  </Svg>
);

// 🚀 foguetinho
export const RocketIcon: React.FC<P & { flame?: number }> = ({ flame = 1, ...p }) => (
  <Svg {...p}>
    <g transform="rotate(35 50 50)">
      <path d={`M42 78 Q50 ${92 + 8 * flame} 58 78 Z`} fill={C.amarelo} />
      <path d={`M45 78 Q50 ${86 + 5 * flame} 55 78 Z`} fill={C.coral} />
      <path d="M50 6 C66 18 68 46 62 76 H38 C32 46 34 18 50 6 Z" fill="#fff" stroke={C.cremeDeep} strokeWidth="3" />
      <path d="M50 6 C58 12 62 20 64 28 H36 C38 20 42 12 50 6 Z" fill={C.coral} />
      <circle cx="50" cy="44" r="9" fill={C.amareloLight} stroke={C.tinta} strokeWidth="4" />
      <path d="M38 56 L24 74 L38 72 Z" fill={C.coral} />
      <path d="M62 56 L76 74 L62 72 Z" fill={C.coral} />
    </g>
  </Svg>
);

// aviãozinho de papel (mensagem do direct)
export const PaperPlaneIcon: React.FC<P> = ({ color = "#fff", ...p }) => (
  <Svg {...p}>
    <path d="M8 46 L92 10 L66 90 L48 60 Z" fill={color} />
    <path d="M48 60 L92 10 L40 52 Z" fill={color} opacity="0.75" />
    <path d="M48 60 L44 84 L56 70 Z" fill={color} opacity="0.85" />
  </Svg>
);
