import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, FONT, W } from "../../config/theme";
import { TEXTS4 } from "../config/texts";
import { BEATS4 } from "../config/timeline";
import { bouncy, breathe, clamp, pop, popOut, wiggle } from "../../lib/anim";
import { CremeBackground } from "../../components/Decor";
import { ConfettiBurst, StarPops, Twinkles } from "../../components/Particles";
import { Ribbon } from "../../components/Ui";
import { PopWords } from "../../components/Text";
import { MapPin } from "../../components/Scenery";
import { ChatIcon } from "../../components/AppIcons";
import { DirectBalloon } from "../../components/Invite";
import { SHOP_RATIO, ShopChar } from "../../components/Town";

// CENA 6 · Fecho + CTA — logo, balão do direct com @uaipertim, CTA "Chama a gente no direct"
// (parado na tela até o fim, > 2s), faixa CHEGANDO EM BREVE, a Lojinha acenando com o toldo no canto.
// END CARD (816–840): quadro final parado com logo + @uaipertim + "Tudo pertim de você." (+ o CTA).
const B = BEATS4.s6;
const LOJ = { x: 152, base: 1548, w: 230 };

const Slogan: React.FC<{ frame: number; start: number; size: number }> = ({ frame, start, size }) => (
  <PopWords
    parts={[{ t: TEXTS4.s6.slogan[0] }, { t: TEXTS4.s6.slogan[1], color: C.coral }, { t: TEXTS4.s6.slogan[2] }]}
    frame={frame} start={start} stagger={3} size={size} weight={W.extraBold}
  />
);

export const S6Fecho: React.FC = () => {
  const f = Math.min(useCurrentFrame(), B.endCard); // end card congela
  const logoIn = bouncy(f, B.logo);
  const glow = 0.7 + 0.3 * Math.sin(f * 0.18);
  const dm = pop(f, B.dm, { damping: 8, stiffness: 180 });
  // dois pulinhos e para: o @uaipertim fica parado (legível) até o fim
  const dmJump = f >= B.dm && f < B.dm + 24 ? -Math.abs(Math.sin((f - B.dm) * 0.26)) * 16 * (1 - (f - B.dm) / 24) : 0;
  const heart = f >= B.heart ? pop(f, B.heart, { damping: 7, stiffness: 260 }) : 0;
  const pill = pop(f, B.pill);
  const ribbonP = interpolate(f, [B.ribbon, B.ribbon + B.ribbonDur], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
  const lojIn = pop(f, B.lojinha, { damping: 9, stiffness: 160 });
  const wave = f >= B.lojinha ? Math.sin((f - B.lojinha) * 0.4) : 0;

  return (
    <AbsoluteFill>
      <CremeBackground frame={f} rays raysCenter={[540, 560]} raysOpacity={0.16} />
      <Twinkles frame={f} seed="v4s6" points={[[110, 560], [975, 520], [960, 1300], [100, 1120]]} />
      <ConfettiBurst frame={f} start={B.confetti[0]} x={-20} y={1300} angle={-62} spread={40} power={60} count={36} seed="v4c6L" />
      <ConfettiBurst frame={f} start={B.confetti[0]} x={1100} y={1300} angle={-118} spread={40} power={60} count={36} seed="v4c6R" />
      <ConfettiBurst frame={f} start={B.confetti[1]} x={540} y={1250} angle={-90} spread={110} power={56} count={40} seed="v4c6C" />

      {/* textos: "Seja um dos primeiros da cidade." → "Tudo pertim de você." */}
      <div style={{ position: "absolute", top: 236, left: 0, right: 0 }}>
        <PopWords parts={TEXTS4.s6.headline[0]} frame={f} start={B.headline} stagger={3} size={76} out={popOut(f, B.headlineOut, 6)} />
      </div>
      <div style={{ position: "absolute", top: 322, left: 0, right: 0 }}>
        <PopWords parts={TEXTS4.s6.headline[1]} frame={f} start={B.headline + 6} stagger={3} size={76} out={popOut(f, B.headlineOut, 6)} />
      </div>
      {f >= B.slogan - 1 && (
        <div style={{ position: "absolute", top: 270, left: 0, right: 0 }}>
          <Slogan frame={f} start={B.slogan} size={84} />
        </div>
      )}

      {/* logo com brilho */}
      <div
        style={{
          position: "absolute", left: 540 - 220, top: 572 - 220, width: 440, height: 440, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 66%)", transform: `scale(${logoIn * glow})`,
        }}
      />
      <StarPops frame={f} start={B.logo + 3} cx={540} cy={572} radius={190} count={8} seed="v4s6-logo" size={46} />
      <div
        style={{
          position: "absolute", left: 540 - 125, top: 572 - 125, width: 250, height: 250,
          transform: `scale(${logoIn * breathe(f, 44, 0.04)}) rotate(${wiggle(f, B.logo + 3, 9, 0.35, 0.09)}deg)`,
          filter: "drop-shadow(0 16px 22px rgba(198,58,23,0.35))",
        }}
      >
        <Img src={staticFile("img/uaipertim_logo.png")} style={{ width: "100%", height: "100%" }} />
      </div>

      {/* balão do direct com @uaipertim */}
      <div style={{ position: "absolute", top: 760, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `translateY(${dmJump}px) scale(${dm})` }}>
        <DirectBalloon handle={TEXTS4.s6.handle} fontSize={86} heartIn={heart} frame={f} />
      </div>

      {/* CTA: "Chama a gente no direct 💬" (pílula branca) */}
      <div style={{ position: "absolute", top: 968, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `scale(${pill})` }}>
        <div
          style={{
            display: "flex", alignItems: "center", gap: 16, padding: "16px 40px 16px 26px", borderRadius: 999, background: "#fff",
            border: `6px solid ${C.cremeDeep}`, boxShadow: `0 9px 0 ${C.cremeDeep}, 0 18px 30px rgba(34,28,25,0.14)`,
          }}
        >
          <ChatIcon size={72} color={C.coral} />
          <span style={{ fontFamily: FONT, fontWeight: W.black, fontSize: 54, color: C.tinta, whiteSpace: "nowrap" }}>{TEXTS4.s6.cta}</span>
        </div>
      </div>

      {/* faixa CHEGANDO EM BREVE */}
      {f >= B.ribbon && (
        <div style={{ position: "absolute", top: 1112, left: 540 - 380 }}>
          <Ribbon text={TEXTS4.s6.ribbon} width={760} height={92} progress={ribbonP} fontSize={50} />
        </div>
      )}

      {/* a Lojinha acenando com o toldo, no canto */}
      {f >= B.lojinha && (
        <>
          <div
            style={{
              position: "absolute", left: LOJ.x - LOJ.w * 0.18, top: LOJ.base - LOJ.w * SHOP_RATIO - LOJ.w * 0.36 * 1.3 - 4 + (1 - lojIn) * 300 - Math.abs(wave) * 8,
              width: LOJ.w * 0.36, height: LOJ.w * 0.36 * 1.3,
            }}
          >
            <MapPin size={LOJ.w * 0.36} />
          </div>
          <div
            style={{
              position: "absolute", left: LOJ.x - LOJ.w / 2, top: LOJ.base - LOJ.w * SHOP_RATIO, width: LOJ.w, height: LOJ.w * SHOP_RATIO,
              transform: `translateY(${(1 - lojIn) * 300 - Math.abs(wave) * 8}px) rotate(${wave * 4}deg)`, transformOrigin: "50% 100%",
            }}
          >
            <ShopChar
              kind="loja" width={LOJ.w} mood="happy" look={[0.5, -0.1]} lit={1} glow={0.35} awning={0.5 + 0.5 * wave} sparkle={0.8} bulbs={1} bulbPhase={f}
              signSwing={wave * 12}
            />
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};
