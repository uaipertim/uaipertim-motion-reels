import React from "react";
import { interpolateColors } from "remotion";
import { C, FONT, W } from "../config/theme";
import { BreadIcon, BurgerIcon, CartIcon, CrossIcon, PawIcon, BellGlyph } from "./Icons";
import { BottleIcon, DishIcon, LeafIcon, StoreIcon } from "./AppIcons";
import { Mood, PhoneFace } from "./Phone";
import { BellWaves } from "./Ui";

// Lojinhas-personagem do Vídeo 3: fachada flat 2D com olhinhos (os mesmos do celular-personagem),
// placa com ícone da categoria, toldo listrado, vitrines que acendem.

export type ShopCharKind = "padaria" | "mercado" | "farmacia" | "pet" | "restaurante" | "bebidas" | "hortifruti" | "lanchonete" | "loja";

type ShopLook = { wall: string; wallDark: string; awningA: string; awningB: string; door: string; icon: (size: number) => React.ReactNode };

const SHOP_LOOK: Record<ShopCharKind, ShopLook> = {
  padaria: { wall: "#F2B35B", wallDark: "#D8923A", awningA: C.amarelo, awningB: "#fff", door: "#8A4A1C", icon: (s) => <BreadIcon size={s} /> },
  mercado: { wall: "#E9944A", wallDark: "#C9752E", awningA: C.verde, awningB: "#fff", door: C.verdeDark, icon: (s) => <CartIcon size={s} /> },
  farmacia: { wall: "#FBF6EE", wallDark: "#E2D6C2", awningA: C.verde, awningB: "#fff", door: C.verdeDark, icon: (s) => <CrossIcon size={s} /> },
  pet: { wall: "#F5C27A", wallDark: "#DDA052", awningA: C.coralLight, awningB: "#fff", door: "#8A4A1C", icon: (s) => <PawIcon size={s} /> },
  restaurante: { wall: "#E07B3C", wallDark: "#BF5F26", awningA: C.coral, awningB: "#fff", door: "#7A3A18", icon: (s) => <DishIcon size={s} /> },
  bebidas: { wall: "#9CCB7A", wallDark: "#74A957", awningA: C.amarelo, awningB: "#fff", door: C.verdeDark, icon: (s) => <BottleIcon size={s} /> },
  hortifruti: { wall: "#F09A6E", wallDark: "#D27A4E", awningA: C.verde, awningB: C.amareloLight, door: "#7A3A18", icon: (s) => <LeafIcon size={s} /> },
  lanchonete: { wall: "#F7D08A", wallDark: "#E0AE5A", awningA: C.coral, awningB: C.amareloLight, door: "#8A4A1C", icon: (s) => <BurgerIcon size={s} /> },
  loja: { wall: "#F4A98A", wallDark: "#D9876A", awningA: C.amarelo, awningB: C.coral, door: "#7A3A18", icon: (s) => <StoreIcon size={s} color={C.coral} /> },
};

// Proporção altura/largura da lojinha (viewBox 0 0 200 256).
export const SHOP_RATIO = 1.28;

const WINDOW_OFF = "#6E5B52";
const WINDOW_ON = "#FFE48A";

export const ShopChar: React.FC<{
  kind: ShopCharKind;
  width: number;
  mood?: Mood;
  look?: [number, number];
  blink?: number;
  eyeScale?: number;
  lit?: number; // 0..1 vitrines e porta acesas
  glow?: number; // 0..1 "acende inteira" (halo amarelo)
  signSwing?: number; // graus (placa balançando)
  signLift?: number; // unidades do svg (placa sobe quando a lojinha "estica o pescoço")
  awning?: number; // 0..1 toldo esticando pra frente
  style?: React.CSSProperties;
}> = ({ kind, width, mood = "worried", look = [0, 0], blink = 0, eyeScale = 1, lit = 0, glow = 0, signSwing = 0, signLift = 0, awning = 0, style }) => {
  const s = SHOP_LOOK[kind];
  const win = interpolateColors(Math.max(0, Math.min(1, lit)), [0, 1], [WINDOW_OFF, WINDOW_ON]);
  const stripes = 6;
  const awnH = 24 + 16 * awning;
  return (
    <div style={{ position: "relative", width, height: width * SHOP_RATIO, ...style }}>
      {glow > 0 && (
        <div
          style={{
            position: "absolute", left: -width * 0.45, top: -width * 0.35, width: width * 1.9, height: width * SHOP_RATIO + width * 0.6,
            borderRadius: "50%", opacity: Math.min(1, glow),
            background: "radial-gradient(closest-side, rgba(255,222,120,0.95), rgba(249,178,51,0.45) 55%, rgba(249,178,51,0) 100%)",
            transform: `scale(${0.6 + 0.4 * Math.min(1, glow)})`,
          }}
        />
      )}
      <svg
        width={width}
        height={width * SHOP_RATIO}
        viewBox="0 0 200 256"
        style={{
          position: "absolute", left: 0, top: 0, overflow: "visible",
          filter: glow > 0 ? `drop-shadow(0 0 ${10 * glow}px rgba(249,178,51,${0.9 * Math.min(1, glow)})) brightness(${1 + 0.08 * glow})` : undefined,
        }}
      >
        <ellipse cx="100" cy="250" rx="98" ry="7" fill="#000" opacity="0.1" />
        {/* parede */}
        <rect x="16" y="76" width="168" height="170" rx="10" fill={s.wall} />
        <rect x="16" y="232" width="168" height="14" rx="4" fill={s.wallDark} />
        {/* vitrines + porta (acendem) */}
        {[26, 132].map((x) => (
          <g key={x}>
            <rect x={x} y="194" width="42" height="38" rx="7" fill={s.wallDark} />
            <rect x={x + 4} y="198" width="34" height="30" rx="5" fill={win} />
            {lit > 0.2 && <rect x={x + 8} y="202" width="8" height="18" rx="3" fill="#fff" opacity={0.6 * lit} />}
          </g>
        ))}
        <rect x="80" y="188" width="40" height="58" rx="7" fill={s.door} />
        <rect x="86" y="195" width="28" height="18" rx="4" fill={win} />
        <circle cx="113" cy="226" r="3.5" fill={C.amarelo} />
        {/* rosto: os olhinhos do celular-personagem */}
        <g transform="translate(25 106)">
          <PhoneFace width={150} mood={mood} blink={blink} look={look} eyeScale={eyeScale} />
        </g>
        {/* toldo listrado */}
        <g>
          {Array.from({ length: stripes }).map((_, i) => {
            const w = 184 / stripes;
            const x = 8 + i * w;
            return (
              <path key={i} d={`M${x} 76 H${x + w} V${76 + awnH} A${w / 2} ${w / 2.4} 0 0 1 ${x} ${76 + awnH} Z`} fill={i % 2 === 0 ? s.awningA : s.awningB} />
            );
          })}
        </g>
        <rect x="4" y="66" width="192" height="14" rx="7" fill={s.wallDark} />
        {/* placa com ícone */}
        <g transform={`translate(0 ${-signLift}) rotate(${signSwing} 100 66)`}>
          <rect x="66" y="44" width="8" height="24" rx="3" fill={s.wallDark} />
          <rect x="126" y="44" width="8" height="24" rx="3" fill={s.wallDark} />
          <rect x="40" y="-4" width="120" height="54" rx="16" fill={lit > 0.5 ? "#FFFDF6" : "#FFF6E8"} stroke={s.wallDark} strokeWidth="5" />
          <g transform="translate(74 -1)">{s.icon(52)}</g>
        </g>
      </svg>
    </div>
  );
};

// Notificação no telhado: sininho balançando + bolinha vermelha "1".
export const RoofNotification: React.FC<{ size: number; frame: number; ringAt: number; badgeIn: number; count?: string }> = ({ size, frame, ringAt, badgeIn, count = "1" }) => {
  const t = frame - ringAt;
  const swing = t >= 0 ? 22 * Math.sin(t * 0.6) * Math.exp(-t * 0.05) + 5 * Math.sin(frame * 0.2) : 0;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      {t >= 0 && <BellWaves frame={frame} size={size} color={C.amarelo} every={18} />}
      <BellGlyph size={size} swing={swing} />
      {badgeIn > 0.01 && (
        <div
          style={{
            position: "absolute", right: -size * 0.16, top: -size * 0.1, width: size * 0.5, height: size * 0.5, borderRadius: "50%",
            background: "#E8262B", border: `${size * 0.06}px solid #fff`, boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${badgeIn})`,
            fontFamily: FONT, fontWeight: W.black, fontSize: size * 0.3, color: "#fff", lineHeight: 1,
          }}
        >
          {count}
        </div>
      )}
    </div>
  );
};
