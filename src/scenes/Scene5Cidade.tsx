import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C } from "../config/theme";
import { TEXTS } from "../config/texts";
import { BEATS } from "../config/timeline";
import { breathe, clamp, dropBounce, lerp, pop, squash } from "../lib/anim";
import { CremeBackground } from "../components/Decor";
import { CATEGORY_ICONS } from "../components/Icons";
import { CitySilhouette, Cloud, MapPin, Shop, ShopKind, Tree } from "../components/Scenery";
import { FloatingHearts, StarPops, Twinkles } from "../components/Particles";
import { CategoryTile } from "../components/Ui";
import { PopWords } from "../components/Text";
import { HOME_PHONE, HomePhone } from "./HomePhone";
import { PHONE4 } from "./Scene4Link";

// CENA 5 · A cidade ganha vida — zoom-out, lojinhas brotam, pin quica, categorias orbitam.
const B = BEATS.s5;
const END = { cx: 540, cy: 880, scale: 0.64 };
const GROUND = 1470;

const SHOPS: Array<{ kind: ShopKind; x: number; base: number; scale: number }> = [
  { kind: "mercado", x: 118, base: GROUND + 20, scale: 1.14 },
  { kind: "padaria", x: 230, base: GROUND - 150, scale: 0.8 },
  { kind: "restaurante", x: 335, base: GROUND + 34, scale: 1.0 },
  { kind: "farmacia", x: 745, base: GROUND + 34, scale: 1.0 },
  { kind: "pet", x: 850, base: GROUND - 150, scale: 0.8 },
  { kind: "loja", x: 962, base: GROUND + 20, scale: 1.14 },
];
const SHOP_W = 200;

export const Scene5Cidade: React.FC = () => {
  const f = useCurrentFrame();
  // zoom-out: celular sai do enquadramento da cena 4 e vira o centro da cidade
  const z = pop(f, 0, { damping: 14, stiffness: 90 });
  const zc = interpolate(f, [0, B.zoomOutDur], [0, 1], clamp);
  const cx = lerp(PHONE4.cx, END.cx, z);
  const cy = lerp(PHONE4.cy, END.cy, z);
  const scale = lerp(1, END.scale, z) * breathe(f, 50, 0.015);
  // halo coral que encolhe revelando a cidade
  const haloR = lerp(2300, 380, Math.min(1, zc * zc * (3 - 2 * zc))) * breathe(f, 60, 0.03);
  const parallax = (1 - z) * 120;

  const pinY = dropBounce(f, B.pinDrop, 1000, 10, 2);
  const [pinSX, pinSY] = squash(f, B.pinDrop + 10, 0.25);
  const pinVisible = f >= B.pinDrop;

  const orbitAngle = (i: number) => (i / 5) * Math.PI * 2 + (f - B.orbitStart) * 0.03 - Math.PI / 2;
  const tiles = TEXTS.categories.map((label, i) => {
    const a = orbitAngle(i);
    const depth = Math.sin(a); // >0 = na frente
    const p = pop(f, B.orbitStart + i * 3, { damping: 9, stiffness: 180 });
    return { i, label, a, depth, p };
  });
  const renderTile = (t: (typeof tiles)[number]) => {
    const Icon = CATEGORY_ICONS[t.i];
    const x = END.cx + Math.cos(t.a) * 372;
    const y = END.cy + 40 + Math.sin(t.a) * 150;
    const s = t.p * (0.82 + 0.18 * (t.depth + 1) / 2);
    return (
      <div
        key={t.i}
        style={{
          position: "absolute", left: x - 65, top: y - 65, transform: `scale(${s}) rotate(${Math.sin(f * 0.1 + t.i) * 6}deg)`,
          opacity: 0.75 + 0.25 * (t.depth + 1) / 2,
        }}
      >
        <CategoryTile size={130} icon={<Icon size={84} />} />
      </div>
    );
  };

  return (
    <AbsoluteFill>
      <CremeBackground frame={f}>
        {/* nuvens e cidade ao fundo (parallax) */}
        <Cloud width={260} style={{ position: "absolute", left: 40 + (f * 0.4) % 1200 - 100, top: 560 - parallax * 0.3, opacity: 0.95 }} />
        <Cloud width={200} style={{ position: "absolute", left: 1080 - ((f * 0.3 + 300) % 1300), top: 700 - parallax * 0.3, opacity: 0.9 }} />
        <CitySilhouette width={1080} height={420} style={{ position: "absolute", left: 0, top: GROUND - 520 + parallax * 0.5 }} />
        {/* chão */}
        <div style={{ position: "absolute", left: -40, right: -40, top: GROUND - 60, bottom: -40, background: "#F3DEC3", borderRadius: "50% 50% 0 0 / 60px 60px 0 0" }} />
        <svg width={1080} height={460} style={{ position: "absolute", left: 0, top: GROUND - 40 }}>
          <path d="M540 60 C 500 140, 640 200, 560 280 S 420 400, 520 470" stroke={C.amarelo} strokeWidth="92" fill="none" strokeLinecap="round" opacity={0.9} />
          <path d="M540 60 C 500 140, 640 200, 560 280 S 420 400, 520 470" stroke="#fff" strokeWidth="8" strokeDasharray="26 30" fill="none" opacity={0.7} />
        </svg>
      </CremeBackground>

      {/* halo coral (o fundo da cena 4 encolhendo) */}
      <div
        style={{
          position: "absolute", left: cx - haloR, top: cy - haloR, width: haloR * 2, height: haloR * 2, borderRadius: "50%",
          background: `radial-gradient(circle, #F96A43 0%, ${C.coral} 60%, ${C.coralBg} 100%)`,
        }}
      />
      <Twinkles frame={f} seed="tw5" points={[[120, 560], [960, 600], [80, 900], [1000, 860]]} />

      {/* lojinhas brotando do chão (squash & stretch) */}
      {SHOPS.map((s, i) => {
        const at = B.houses[i];
        const p = pop(f, at, { damping: 7, stiffness: 200 });
        const sy = p;
        const sx = 1 + (1 - p) * 0.45;
        const w = SHOP_W * s.scale;
        return (
          <div
            key={s.kind}
            style={{
              position: "absolute", left: s.x - w / 2, top: s.base - w * 1.05, width: w,
              transform: `scale(${sx}, ${sy})`, transformOrigin: "50% 100%", zIndex: s.scale < 1 ? 1 : 3,
            }}
          >
            <Shop kind={s.kind} label={TEXTS.s5.shops[i]} width={w} />
          </div>
        );
      })}
      {[[40, GROUND - 120, 110], [440, GROUND - 60, 90], [655, GROUND - 60, 90], [1040, GROUND - 120, 110]].map(([x, y, sz], i) => {
        const p = pop(f, B.houses[0] + 6 + i * 5, { damping: 8, stiffness: 200 });
        return (
          <div key={i} style={{ position: "absolute", left: x - sz / 2, top: y - sz * 1.3, transform: `scale(${p})`, transformOrigin: "50% 100%", zIndex: 2 }}>
            <Tree size={sz} sway={Math.sin(f * 0.08 + i) * 3} />
          </div>
        );
      })}

      {/* categorias atrás do celular */}
      {tiles.filter((t) => t.depth < 0).map(renderTile)}

      {/* celular */}
      <div
        style={{
          position: "absolute", left: cx - HOME_PHONE.w / 2, top: cy - HOME_PHONE.h / 2, transform: `scale(${scale})`, zIndex: 4,
        }}
      >
        <HomePhone typed={99} homeIn={1} frame={f} scroll={interpolate(f, [30, 150], [0, 150], clamp)} />
      </div>

      {/* categorias na frente */}
      <div style={{ position: "absolute", inset: 0, zIndex: 5 }}>{tiles.filter((t) => t.depth >= 0).map(renderTile)}</div>

      {/* pin coral descendo com quiques */}
      {pinVisible && (
        <>
          <div
            style={{
              position: "absolute", left: 540 - 80, top: GROUND + 62, width: 160, height: 30, borderRadius: "50%", background: "rgba(34,28,25,0.18)",
              transform: `scale(${interpolate(pinY, [-1000, 0], [0.2, 1], clamp)})`, zIndex: 5,
            }}
          />
          <div
            style={{
              position: "absolute", left: 540 - 85, top: GROUND + 76 - 221, transform: `translateY(${pinY}px) scale(${pinSX}, ${pinSY})`,
              transformOrigin: "50% 100%", zIndex: 6,
            }}
          >
            <MapPin size={170} />
          </div>
        </>
      )}

      {/* coraçõezinhos subindo */}
      <div style={{ position: "absolute", inset: 0, zIndex: 7 }}>
        <FloatingHearts frame={f} start={B.houses[2] + 8} seed="hearts5" size={64} sources={[[118, GROUND - 260], [335, GROUND - 230], [745, GROUND - 230], [962, GROUND - 260], [230, GROUND - 330], [850, GROUND - 330]]} />
        <StarPops frame={f} start={B.chime} cx={END.cx} cy={END.cy} radius={330} count={10} seed="chime5" size={60} />
      </div>

      {/* título */}
      <div style={{ position: "absolute", top: 232, left: 0, right: 0, zIndex: 8 }}>
        <PopWords parts={TEXTS.s5.title[0]} frame={f} start={B.text} size={80} stagger={3} />
        <PopWords parts={[{ t: TEXTS.s5.title[1], color: C.coral }]} frame={f} start={B.text + 10} size={104} stagger={3} />
      </div>
    </AbsoluteFill>
  );
};
