import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FONT, W } from "../../config/theme";
import { STORY_TEXTS } from "../config/texts";
import { BEATS_S } from "../config/timeline";
import { dropBounce, float, lerp, pop, squash } from "../../lib/anim";
import { CremeBackground } from "../../components/Decor";
import { MapPin } from "../../components/Scenery";
import { StarPops } from "../../components/Particles";
import { PopWords } from "../../components/Text";
import { BreadIcon, BurgerIcon, CartIcon, CrossIcon, PawIcon } from "../../components/Icons";
import { CupIcon, PinIcon, SproutIcon } from "../../components/AppIcons";

// CARD 3 · "Tem de tudo, pertim" — os ícones de categoria pipocam em grade em volta de um pin coral.
const B = BEATS_S.card3;
const T = STORY_TEXTS.card3;
const COLS = [230, 540, 850];
const ROWS = [650, 940, 1230];
const PIN = { x: COLS[1], y: ROWS[1] };
// posições em volta do pin (sentido horário a partir do canto sup. esq.)
const SLOTS: Array<[number, number]> = [
  [COLS[0], ROWS[0]], [COLS[1], ROWS[0]], [COLS[2], ROWS[0]], [COLS[2], ROWS[1]],
  [COLS[2], ROWS[2]], [COLS[1], ROWS[2]], [COLS[0], ROWS[2]], [COLS[0], ROWS[1]],
];
const TILE = 200;

const icon = (k: string): React.ReactNode => {
  const s = TILE * 0.62;
  switch (k) {
    case "restaurantes": return <BurgerIcon size={s} />;
    case "mercados": return <CartIcon size={s} />;
    case "farmacias": return <CrossIcon size={s * 0.9} />;
    case "padarias": return <BreadIcon size={s} />;
    case "pets": return <PawIcon size={s * 0.9} />;
    case "agro": return <SproutIcon size={s} />;
    case "bebidas": return <CupIcon size={s} />;
    default:
      return (
        <div style={{ display: "flex", gap: 12 }}>
          {[0, 1, 2].map((i) => <div key={i} style={{ width: 24, height: 24, borderRadius: 12, background: C.coral }} />)}
        </div>
      );
  }
};

export const Card3TemDeTudo: React.FC = () => {
  const f = useCurrentFrame();
  const pinY = dropBounce(f, B.pin, 700, B.pinLand - B.pin, 2);
  const [psx, psy] = squash(f, B.pinLand, 0.25);
  const ring = (f - B.pinLand) % 36;
  const chimeRing = f - B.chime;

  return (
    <AbsoluteFill>
      <CremeBackground frame={f} rays raysCenter={[PIN.x, PIN.y]} raysOpacity={0.14} />

      {/* "radar" saindo do pin */}
      {f >= B.pinLand &&
        [0, 18].map((d) => {
          const t = (ring + d) % 36;
          const r = 60 + t * 6;
          return (
            <div
              key={d}
              style={{
                position: "absolute", left: PIN.x - r, top: PIN.y + 40 - r * 0.45, width: r * 2, height: r * 0.9, borderRadius: "50%",
                border: `6px solid rgba(242,80,43,${0.35 * (1 - t / 36)})`,
              }}
            />
          );
        })}
      {chimeRing >= 0 && chimeRing < 24 && (
        <div
          style={{
            position: "absolute", left: PIN.x - (80 + chimeRing * 22), top: PIN.y - (80 + chimeRing * 22), width: (80 + chimeRing * 22) * 2,
            height: (80 + chimeRing * 22) * 2, borderRadius: "50%", border: `${14 * (1 - chimeRing / 24)}px solid rgba(249,178,51,${1 - chimeRing / 24})`,
          }}
        />
      )}

      {/* pin coral no centro */}
      <div
        style={{
          position: "absolute", left: PIN.x - 90, top: PIN.y - 150 + pinY, width: 180, height: 234,
          transform: `scale(${psx}, ${psy}) translateY(${f > B.pinLand + 20 ? float(f, 50, 6) : 0}px)`, transformOrigin: "50% 100%",
        }}
      >
        <MapPin size={180} />
      </div>

      {/* ícones de categoria pipocando em volta */}
      {T.categories.map((c, i) => {
        const at = B.tiles[i];
        if (f < at) return null;
        const p = pop(f, at, { damping: 9, stiffness: 190 });
        const [x, y] = SLOTS[i];
        const cx = lerp(PIN.x, x, Math.min(1.08, p));
        const cy = lerp(PIN.y, y, Math.min(1.08, p)) + (p > 0.9 ? float(f, 54, 4, i) : 0);
        return (
          <div
            key={c.icon}
            style={{
              position: "absolute", left: cx - 150, top: cy - TILE / 2, width: 300, display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
              transform: `scale(${0.3 + 0.7 * p})`,
            }}
          >
            <div
              style={{
                width: TILE, height: TILE, borderRadius: TILE * 0.26, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 10px 0 ${C.cremeDeep}, 0 18px 30px rgba(34,28,25,0.14)`,
              }}
            >
              {icon(c.icon)}
            </div>
            <span style={{ fontFamily: FONT, fontWeight: W.extraBold, fontSize: 34, color: C.tinta, whiteSpace: "nowrap", letterSpacing: -0.5 }}>{c.label}</span>
          </div>
        );
      })}
      <StarPops frame={f} start={B.chime} cx={PIN.x} cy={PIN.y} radius={200} count={8} seed="st3chime" size={50} />

      {/* textos */}
      <div style={{ position: "absolute", top: 268, left: 0, right: 0 }}>
        <PopWords parts={T.title[0]} frame={f} start={B.title1} stagger={3} size={96} />
      </div>
      <div style={{ position: "absolute", top: 372, left: 0, right: 0 }}>
        <PopWords parts={[{ t: T.title[1][0], color: C.coral }, { t: T.title[1][1] }]} frame={f} start={B.title2} stagger={3} size={96} />
      </div>
      <div style={{ position: "absolute", top: 1420, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 10 }}>
        <PinIcon size={60} style={{ transform: `scale(${pop(f, B.city)})` }} />
        <PopWords parts={T.city[0]} frame={f} start={B.city + 2} stagger={2} size={50} weight={W.extraBold} color="#5A4A42" />
      </div>
      <div style={{ position: "absolute", top: 1484, left: 0, right: 0 }}>
        <PopWords parts={T.city[1]} frame={f} start={B.city + 5} stagger={2} size={54} weight={W.black} color={C.coral} />
      </div>
    </AbsoluteFill>
  );
};
