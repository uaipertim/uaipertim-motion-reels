import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, FONT, W } from "../config/theme";
import { TEXTS } from "../config/texts";
import { BEATS } from "../config/timeline";
import { bouncy, breathe, clamp, pop, popOut, wiggle } from "../lib/anim";
import { CremeBackground } from "../components/Decor";
import { ConfettiBurst, ConfettiRain, FloatingHearts, StarPops, Twinkles } from "../components/Particles";
import { Ribbon, SwingBell } from "../components/Ui";
import { PopWords } from "../components/Text";

// CENA 6 · Fecho + CTA — logo pulsando, faixa "ESTREIA · EM BREVE", sininho + "ative o lembrete",
// slogan por último. END CARD estático no final.
const B = BEATS.s6;

const Slogan: React.FC<{ frame: number; start: number; size: number; out?: number }> = ({ frame, start, size, out = 1 }) => (
  <PopWords
    parts={[{ t: TEXTS.s6.slogan[0] }, { t: TEXTS.s6.slogan[1], color: C.coral }, { t: TEXTS.s6.slogan[2] }]}
    frame={frame}
    start={start}
    stagger={3}
    size={size}
    weight={W.extraBold}
    out={out}
  />
);

export const Scene6Fecho: React.FC = () => {
  const raw = useCurrentFrame();
  // END CARD: a partir de endCardStatic tudo congela (segura estático pra fechar)
  const f = Math.min(raw, B.endCardStatic);
  const endP = interpolate(f, [B.endCardStart, B.endCardStatic], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const ctaOut = popOut(f, B.endCardStart, 8);
  const confettiFade = 1 - endP;

  // logo: entra com pulo, pulsa devagar; no end card sobe pro centro do card
  const logoIn = bouncy(f, B.logo);
  const pulse = breathe(f, 44, 0.045) * (1 - endP) + endP * 1;
  const logoSize = 470 + endP * 50;
  const logoCy = 630 + endP * 80;
  const logoRot = wiggle(f, B.logo + 3, 9, 0.35, 0.09);

  const ribbonP = interpolate(f, [B.ribbon, B.ribbon + B.ribbonDur], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
  const pillIn = pop(f, B.bellPill);
  const pillPulse = breathe(f, 22, 0.05);

  // posições do end card
  const handleIn = pop(f, B.endCardStart + 3, { damping: 14, stiffness: 300 });
  const sloganEndIn = pop(f, B.endCardStart + 5, { damping: 14, stiffness: 300 });

  return (
    <AbsoluteFill>
      <CremeBackground frame={f} rays raysColor={C.amarelo} raysCenter={[540, logoCy]} raysOpacity={0.16} />
      <Twinkles frame={f} seed="tw6" points={[[110, 520], [970, 470], [90, 1000], [990, 1040], [160, 1350], [930, 1380]]} color={C.amarelo} />

      {/* confete */}
      <div style={{ position: "absolute", inset: 0, opacity: confettiFade }}>
        <ConfettiBurst frame={f} start={B.confetti1} x={-20} y={1450} angle={-62} spread={40} power={64} count={46} seed="c1L" />
        <ConfettiBurst frame={f} start={B.confetti1} x={1100} y={1450} angle={-118} spread={40} power={64} count={46} seed="c1R" />
        <ConfettiRain frame={f} start={B.confetti1 + 14} seed="rain6" count={30} />
        <ConfettiBurst frame={f} start={B.confetti2} x={540} y={1400} angle={-90} spread={110} power={58} count={50} seed="c2" />
        <FloatingHearts frame={f} start={B.bellPill} seed="hearts6" size={58} sources={[[110, 1300], [970, 1250], [80, 860], [1000, 900]]} />
      </div>

      {/* logo central */}
      <StarPops frame={f} start={B.logo + 4} cx={540} cy={630} radius={290} count={8} seed="logo6" size={60} />
      <div
        style={{
          position: "absolute", left: 540 - logoSize / 2, top: logoCy - logoSize / 2, width: logoSize, height: logoSize,
          transform: `scale(${logoIn * pulse}) rotate(${logoRot * (1 - endP)}deg)`, filter: "drop-shadow(0 22px 28px rgba(198,58,23,0.35))",
        }}
      >
        <Img src={staticFile("img/uaipertim_logo.png")} style={{ width: "100%", height: "100%" }} />
      </div>

      {/* CTA */}
      <div style={{ position: "absolute", top: 240, left: 0, right: 0 }}>
        <PopWords
          parts={TEXTS.s6.headline}
          frame={f}
          start={B.headline}
          size={88}
          out={ctaOut}
          after={
            <div style={{ transform: "translateY(-6px)" }}>
              <SwingBell size={104} frame={f} rings={[B.headline + 8, ...B.bellRings]} />
            </div>
          }
        />
      </div>
      <div style={{ position: "absolute", top: 930, left: 540 - 410, transform: `scale(${ctaOut})` }}>
        <Ribbon text={TEXTS.s6.ribbon} width={820} height={120} progress={ribbonP} fontSize={58} />
      </div>
      <div
        style={{
          position: "absolute", top: 1100, left: 0, right: 0, display: "flex", justifyContent: "center",
          transform: `scale(${pillIn * pillPulse * ctaOut})`,
        }}
      >
        <div
          style={{
            display: "flex", alignItems: "center", gap: 22, padding: "16px 46px 16px 28px", borderRadius: 999, background: "#fff",
            border: `7px solid ${C.coral}`, boxShadow: `0 10px 0 ${C.coralDark}, 0 24px 40px rgba(34,28,25,0.2)`,
          }}
        >
          <SwingBell size={92} frame={f} rings={B.bellRings} />
          <span style={{ fontFamily: FONT, fontWeight: W.extraBold, fontSize: 56, color: C.tinta, whiteSpace: "nowrap" }}>{TEXTS.s6.reminder}</span>
        </div>
      </div>
      <div style={{ position: "absolute", top: 1250, left: 0, right: 0 }}>
        <Slogan frame={f} start={B.slogan} size={78} out={ctaOut} />
      </div>

      {/* END CARD: logo + @uaipertim + slogan */}
      {f >= B.endCardStart && (
        <>
          <div
            style={{
              position: "absolute", top: 1016, left: 0, right: 0, textAlign: "center", fontFamily: FONT, fontWeight: W.black, fontSize: 92,
              color: C.coral, transform: `scale(${handleIn})`, letterSpacing: -1, textShadow: `0 6px 0 ${C.cremeDeep}`,
            }}
          >
            {TEXTS.s6.handle}
          </div>
          <div style={{ position: "absolute", top: 1150, left: 0, right: 0, transform: `scale(${sloganEndIn})` }}>
            <Slogan frame={B.endCardStatic + 100} start={0} size={80} />
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};
