import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { C } from "../../config/theme";
import { TEXTS4 } from "../config/texts";
import { BEATS4 } from "../config/timeline";
import { clamp, float, lerp, pop, popOut, prog } from "../../lib/anim";
import { HeartShape, StarPops } from "../../components/Particles";
import { MapPin } from "../../components/Scenery";
import { BenefitCard } from "../../components/Invite";
import { BoxIcon, EyesIcon, PhoneArrowIcon } from "../../components/AppIcons";
import { SHOP_RATIO } from "../../components/Town";
import { LOJ_S4 } from "./layout";

// CENA 4 · Os benefícios — a Lojinha (Stage4) no centro, feliz; 3 cards entram um de cada vez com
// check que se desenha, e a Lojinha reage a cada um: holofote → corações vindos dos pins → caixinhas na vitrine.
const B = BEATS4.s4;
const LOJ_TOP = LOJ_S4.base - LOJ_S4.w * SHOP_RATIO;
const U = LOJ_S4.w / 200; // px por unidade do desenho da lojinha
const LOJ_CENTER = { x: LOJ_S4.x, y: LOJ_TOP + 150 * U };
// vitrines e porta da Lojinha (onde as caixinhas pousam)
const SLOTS: Array<[number, number]> = [
  [LOJ_S4.x - LOJ_S4.w / 2 + 47 * U, LOJ_TOP + 213 * U],
  [LOJ_S4.x - LOJ_S4.w / 2 + 153 * U, LOJ_TOP + 213 * U],
  [LOJ_S4.x, LOJ_TOP + 204 * U],
];
const BOX_FROM: Array<[number, number]> = [[-140, 860], [1220, 900], [540, 700]];
const CLIENT_PINS: Array<[number, number]> = [[120, 1010], [960, 960], [150, 1330], [935, 1300]];

const ICONS: Record<string, React.ReactNode> = {
  olhos: <EyesIcon size={80} look={0.3} />,
  celular: <PhoneArrowIcon size={78} />,
  caixa: <BoxIcon size={74} />,
};
const CARD_Y = [236, 402, 572];

export const S4Beneficios: React.FC = () => {
  const f = useCurrentFrame();
  const outAll = popOut(f, B.cardsOut, 8);

  // holofote (liga com uma piscadinha)
  const spot = f < B.spotlight ? 0 : f < B.spotlight + 6 ? (Math.floor(f / 2) % 2 ? 0.4 : 1) : 1;
  const spotA = spot * outAll;

  return (
    <AbsoluteFill>
      {spotA > 0 && (
        <>
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
            <defs>
              <linearGradient id="v4spot" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#FFE9A8" stopOpacity={0.85 * spotA} />
                <stop offset="1" stopColor="#FFE9A8" stopOpacity={0.12 * spotA} />
              </linearGradient>
            </defs>
            <path d={`M70 780 L130 760 L${LOJ_S4.x + 330} ${LOJ_S4.base} L${LOJ_S4.x - 300} ${LOJ_S4.base} Z`} fill="url(#v4spot)" />
            <ellipse cx={LOJ_S4.x + 15} cy={LOJ_S4.base - 6} rx={320} ry={34} fill="#FFE9A8" opacity={0.6 * spotA} />
          </svg>
          {/* refletor */}
          <div style={{ position: "absolute", left: 30, top: 720, width: 130, height: 90, transform: `rotate(28deg) scale(${pop(f, B.spotlight) * outAll})` }}>
            <div style={{ position: "absolute", left: 0, top: 10, width: 100, height: 70, borderRadius: "18px 40px 40px 18px", background: C.tinta }} />
            <div style={{ position: "absolute", left: 84, top: 4, width: 34, height: 82, borderRadius: 17, background: "#FFE9A8", boxShadow: "0 0 30px 10px rgba(255,233,168,0.8)" }} />
          </div>
        </>
      )}

      {/* pins de clientes mandando corações */}
      {f >= B.clientPins &&
        CLIENT_PINS.map(([x, y], i) => {
          const s = pop(f, B.clientPins + i * 2, { damping: 8, stiffness: 220 }) * outAll;
          return (
            <div key={i} style={{ position: "absolute", left: x - 38, top: y - 99 + float(f, 40, 6, i), transform: `scale(${s})`, transformOrigin: "50% 100%" }}>
              <MapPin size={76} />
            </div>
          );
        })}
      {CLIENT_PINS.map(([x, y], i) =>
        [0, 9].map((d) => {
          const t0 = B.hearts + i * 3 + d;
          const p = interpolate(f, [t0, t0 + 20], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
          if (p <= 0 || p >= 1) return null;
          const hx = lerp(x, LOJ_CENTER.x, p);
          const hy = lerp(y - 70, LOJ_CENTER.y, p) - 140 * Math.sin(Math.PI * p);
          return (
            <div key={`${i}-${d}`} style={{ position: "absolute", left: hx - 30, top: hy - 30, transform: `scale(${0.6 + 0.6 * Math.sin(Math.PI * p)})` }}>
              <HeartShape size={60} color={i % 2 ? C.coralLight : C.coral} />
            </div>
          );
        }),
      )}
      <StarPops frame={f} start={B.hearts + 22} cx={LOJ_CENTER.x} cy={LOJ_CENTER.y - 120} radius={260} count={9} seed="v4hearts" colors={[C.coral, C.coralLight, C.amarelo]} size={50} />

      {/* caixinhas voando pra vitrine ("tum tum") */}
      {B.boxes.map((b, i) => {
        if (f < b) return null;
        const p = interpolate(f, [b, b + B.boxFall], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
        const [fx, fy] = BOX_FROM[i];
        const [tx, ty] = SLOTS[i];
        const x = lerp(fx, tx, p);
        const y = lerp(fy, ty, p) - 220 * Math.sin(Math.PI * Math.min(1, p * 0.9));
        const landed = f >= b + B.boxFall;
        const s = landed ? 0.62 * (1 + 0.25 * Math.exp(-(f - b - B.boxFall) * 0.35)) : 1 - 0.3 * p;
        return (
          <div key={i} style={{ position: "absolute", left: x - 45, top: y - 45, transform: `scale(${s * outAll}) rotate(${landed ? 0 : (1 - p) * (i % 2 ? 160 : -160)}deg)` }}>
            <BoxIcon size={90} />
          </div>
        );
      })}

      {/* cards de benefício */}
      {TEXTS4.s4.cards.map((c, i) => {
        const at = B.cards[i];
        if (f < at) return null;
        const p = pop(f, at, { damping: 10, stiffness: 160 });
        const side = i % 2 ? 1 : -1;
        const check = prog(f, at + B.checkDelay, B.checkDur, (x) => x);
        const out = popOut(f, B.cardsOut + i * 2, 8);
        return (
          <div
            key={i}
            style={{
              position: "absolute", left: 70 + side * 14, top: CARD_Y[i],
              transform: `translateX(${side * (1 - p) * 900}px) rotate(${side * (1.2 + (1 - p) * 8)}deg) scale(${out})`,
            }}
          >
            <BenefitCard icon={ICONS[c.icon]} text={c.text} width={940} check={check} fontSize={46} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
