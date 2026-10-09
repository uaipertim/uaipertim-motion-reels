import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C } from "../../config/theme";
import { STORY_TEXTS } from "../config/texts";
import { BEATS_S } from "../config/timeline";
import { bouncy, breathe, clamp, pop, wiggle } from "../../lib/anim";
import { CremeBackground } from "../../components/Decor";
import { CitySilhouette } from "../../components/Scenery";
import { StarPops } from "../../components/Particles";
import { PopWords } from "../../components/Text";
import { WaveHandIcon } from "../../components/AppIcons";
import { SHOP_RATIO, ShopChar, ShopCharKind } from "../../components/Town";

// CARD 1 · "Prazer, UaiPertim" — toldo listrado desce do topo como cortina e se abre; o logo entra com
// pulo + brilho; lojinhas da cidadezinha brotam na base acenando com o toldo.
const B = BEATS_S.card1;
const T = STORY_TEXTS.card1;
const STRIPES = [C.coral, "#fff", C.amarelo, "#fff"];
const SW = 90; // largura da listra

// cortina/toldo listrado (listras verticais); `start` = índice da 1ª listra (continuidade entre as metades),
// `scallop` = bainha recortada embaixo
const Stripes: React.FC<{ width: number; height: number; start?: number; scallop?: boolean }> = ({ width, height, start = 0, scallop = false }) => {
  const n = Math.ceil(width / SW) + 1;
  return (
    <svg width={width} height={height + (scallop ? SW / 2 : 0)} style={{ display: "block", overflow: "visible" }}>
      {Array.from({ length: n }).map((_, i) => {
        const x = i * SW;
        const col = STRIPES[(i + start) % STRIPES.length];
        return (
          <g key={i}>
            <rect x={x} y={0} width={SW + 0.5} height={height} fill={col} />
            {scallop && <path d={`M${x} ${height} A${SW / 2} ${SW / 2} 0 0 0 ${x + SW} ${height} Z`} fill={col} />}
          </g>
        );
      })}
      {/* dobras do pano */}
      {Array.from({ length: n }).map((_, i) => (
        <rect key={`d${i}`} x={i * SW + SW * 0.62} y={0} width={SW * 0.38} height={height} fill="#000" opacity={0.05} />
      ))}
    </svg>
  );
};

const SHOPS: Array<{ kind: ShopCharKind; x: number }> = [
  { kind: "padaria", x: 150 },
  { kind: "mercado", x: 410 },
  { kind: "farmacia", x: 670 },
  { kind: "pet", x: 930 },
];
const SHOP_W = 186;
const GROUND = 1592;
const VALANCE_H = 200;

export const Card1Prazer: React.FC = () => {
  const f = useCurrentFrame();
  const drop = interpolate(f, [B.curtainDrop, B.curtainDrop + 12], [-1, 0], { ...clamp, easing: Easing.out(Easing.back(1.3)) });
  const open = interpolate(f, [B.curtainOpen, B.curtainOpen + B.curtainDur], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const logoIn = bouncy(f, B.logo);
  const glow = 0.75 + 0.25 * Math.sin(f * 0.16);
  const sway = Math.sin(f * 0.12) * 1.2 + wiggle(f, B.curtainOpen + B.curtainDur, 3, 0.5, 0.1);

  return (
    <AbsoluteFill>
      <CremeBackground frame={f} rays raysCenter={[540, 600]} raysOpacity={0.13 * logoIn} />

      {/* cidadezinha na base */}
      <CitySilhouette width={1080} height={300} style={{ position: "absolute", left: 0, top: GROUND - 290, opacity: 0.9 * pop(f, B.shops[0]) }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: GROUND - 8, height: 60, background: C.cremeDeep }} />
      {SHOPS.map((s, i) => {
        const at = B.shops[i];
        if (f < at) return null;
        const g = pop(f, at, { damping: 9, stiffness: 170 });
        const wave = Math.sin((f - at) * 0.33 + i * 1.3);
        return (
          <div
            key={s.kind}
            style={{
              position: "absolute", left: s.x - SHOP_W / 2, top: GROUND - SHOP_W * SHOP_RATIO, width: SHOP_W, height: SHOP_W * SHOP_RATIO,
              transform: `translateY(${-Math.abs(wave) * 6}px) scale(${0.6 + 0.4 * g}, ${g})`, transformOrigin: "50% 100%",
            }}
          >
            <ShopChar kind={s.kind} width={SHOP_W} mood="happy" look={[0, -0.2]} lit={0.7} awning={0.45 + 0.55 * wave} signSwing={wave * 9} bulbs={0.8} bulbPhase={f + i * 7} />
          </div>
        );
      })}

      {/* logo com pulo + brilho */}
      <div
        style={{
          position: "absolute", left: 540 - 330, top: 600 - 330, width: 660, height: 660, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 66%)", transform: `scale(${logoIn * glow})`,
        }}
      />
      <StarPops frame={f} start={B.sparkle} cx={540} cy={600} radius={250} count={9} seed="st1logo" size={56} />
      {f >= B.logo && (
        <div
          style={{
            position: "absolute", left: 540 - 210, top: 600 - 210, width: 420, height: 420,
            transform: `translateY(${(1 - Math.min(1, logoIn)) * 120}px) scale(${logoIn * breathe(f, 46, 0.03)}) rotate(${wiggle(f, B.logo + 4, 8, 0.35, 0.09)}deg)`,
            filter: "drop-shadow(0 20px 26px rgba(198,58,23,0.35))",
          }}
        >
          <Img src={staticFile("img/uaipertim_logo.png")} style={{ width: "100%", height: "100%" }} />
        </div>
      )}

      {/* "Uai, prazer! 👋" → "Eu sou o UaiPertim." + apoio */}
      <div style={{ position: "absolute", top: 870, left: 0, right: 0 }}>
        <PopWords
          parts={T.hello} frame={f} start={B.hello} stagger={3} size={108}
          after={<WaveHandIcon size={112} style={{ transform: `rotate(${f >= B.hello ? Math.sin((f - B.hello) * 0.4) * 16 : 0}deg)`, transformOrigin: "70% 90%" }} />}
        />
      </div>
      <div style={{ position: "absolute", top: 1000, left: 0, right: 0 }}>
        <PopWords parts={[{ t: T.intro[0] }, { t: T.intro[1], color: C.coral }, { t: T.intro[2] }]} frame={f} start={B.intro} stagger={3} size={84} />
      </div>
      <div style={{ position: "absolute", top: 1124, left: 0, right: 0 }}>
        <PopWords parts={T.support[0]} frame={f} start={B.support} stagger={2} size={54} weight={800} color="#5A4A42" />
      </div>
      <div style={{ position: "absolute", top: 1190, left: 0, right: 0 }}>
        <PopWords parts={T.support[1]} frame={f} start={B.support + 6} stagger={2} size={54} weight={800} color="#5A4A42" />
      </div>

      {/* toldo: cortina listrada desce e se abre; fica a bainha no topo */}
      {open < 1 && (
        <>
          <div style={{ position: "absolute", left: -540 * open * 1.05, top: drop * 1920, width: 540, height: 1920, overflow: "hidden" }}>
            <Stripes width={540} height={1920} />
          </div>
          <div style={{ position: "absolute", left: 540 + 540 * open * 1.05, top: drop * 1920, width: 540, height: 1920, overflow: "hidden" }}>
            <Stripes width={540} height={1920} start={540 / SW} />
          </div>
        </>
      )}
      <div style={{ position: "absolute", left: 0, top: drop * 1920 - 6, width: 1080, transform: `skewX(${sway}deg)`, transformOrigin: "50% 0%" }}>
        <Stripes width={1080} height={VALANCE_H} scallop />
        <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 26, background: "#fff", boxShadow: "0 6px 0 rgba(34,28,25,0.08)" }} />
      </div>
    </AbsoluteFill>
  );
};
