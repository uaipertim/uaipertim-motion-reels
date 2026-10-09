import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, FONT, W } from "../../config/theme";
import { TEXTS2 } from "../config/texts";
import { BEATS2 } from "../config/timeline";
import { bouncy, breathe, clamp, pop, popOut, wiggle } from "../../lib/anim";
import { CremeBackground } from "../../components/Decor";
import { LinkIcon } from "../../components/Icons";
import { WinkFace } from "../../components/AppIcons";
import { ConfettiBurst, ConfettiRain, FloatingHearts, StarPops, Twinkles } from "../../components/Particles";
import { Ribbon, SwingBell } from "../../components/Ui";
import { PopWords } from "../../components/Text";

// CENA 6 · Fecho + CTA — logo com brilho, link uaipertim.com.br + selo "SEM BAIXAR NADA",
// faixa "CHEGANDO EM BREVE", sininho, confete. END CARD estático no final.
const B = BEATS2.s6;

const Slogan: React.FC<{ frame: number; start: number; size: number; out?: number }> = ({ frame, start, size, out = 1 }) => (
  <PopWords
    parts={[{ t: TEXTS2.s6.slogan[0] }, { t: TEXTS2.s6.slogan[1], color: C.coral }, { t: TEXTS2.s6.slogan[2] }]}
    frame={frame} start={start} stagger={3} size={size} weight={W.extraBold} out={out}
  />
);

export const S6Fecho: React.FC = () => {
  const raw = useCurrentFrame();
  const f = Math.min(raw, B.endCardStatic); // end card congela
  const endP = interpolate(f, [B.endCardStart, B.endCardStatic], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const ctaOut = popOut(f, B.endCardStart, 8);

  const logoIn = bouncy(f, B.logo);
  const logoSize = 400 + endP * 120;
  const logoCy = 650 + endP * 80;
  const glow = 0.7 + 0.3 * Math.sin(f * 0.18);
  const head1Out = popOut(f, B.head2 - 6, 6);
  const ribbonP = interpolate(f, [B.ribbon, B.ribbon + B.ribbonDur], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
  const linkIn = pop(f, B.link);
  const ts = f - B.selo;
  const seloS = ts < 0 ? 0 : ts < 4 ? 2.4 - 1.4 * Math.pow(ts / 4, 2) : 1 + 0.08 * Math.sin((ts - 4) * 1.1) * Math.exp(-(ts - 4) * 0.3);
  const handleIn = pop(f, B.endCardStart + 3, { damping: 14, stiffness: 300 });
  const sloganEnd = pop(f, B.endCardStart + 5, { damping: 14, stiffness: 300 });

  return (
    <AbsoluteFill>
      <CremeBackground frame={f} rays raysCenter={[540, logoCy]} raysOpacity={0.16} />
      <Twinkles frame={f} seed="v2s6" points={[[110, 540], [970, 500], [90, 1040], [990, 1080]]} />
      <div style={{ position: "absolute", inset: 0, opacity: 1 - endP }}>
        <ConfettiBurst frame={f} start={B.confetti1} x={-20} y={1450} angle={-62} spread={40} power={64} count={44} seed="v2c1L" />
        <ConfettiBurst frame={f} start={B.confetti1} x={1100} y={1450} angle={-118} spread={40} power={64} count={44} seed="v2c1R" />
        <ConfettiRain frame={f} start={B.confetti1 + 14} seed="v2rain" count={26} />
        <ConfettiBurst frame={f} start={B.confetti2} x={540} y={1420} angle={-90} spread={110} power={58} count={46} seed="v2c2" />
        <FloatingHearts frame={f} start={B.link} seed="v2h6" size={56} sources={[[110, 1320], [970, 1280]]} />
      </div>

      {/* logo central com brilho */}
      <div
        style={{
          position: "absolute", left: 540 - 340, top: logoCy - 340, width: 680, height: 680, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 66%)", transform: `scale(${logoIn * glow})`,
        }}
      />
      <StarPops frame={f} start={B.logo + 3} cx={540} cy={650} radius={260} count={8} seed="v2s6-logo" size={56} />
      <div
        style={{
          position: "absolute", left: 540 - logoSize / 2, top: logoCy - logoSize / 2, width: logoSize, height: logoSize,
          transform: `scale(${logoIn * (breathe(f, 44, 0.04) * (1 - endP) + endP)}) rotate(${wiggle(f, B.logo + 3, 9, 0.35, 0.09) * (1 - endP)}deg)`,
          filter: "drop-shadow(0 22px 28px rgba(198,58,23,0.35))",
        }}
      >
        <Img src={staticFile("img/uaipertim_logo.png")} style={{ width: "100%", height: "100%" }} />
      </div>

      {/* "Facim, facim. 😉" → "Segue e ativa o 🔔" */}
      <div style={{ position: "absolute", top: 250, left: 0, right: 0 }}>
        <PopWords parts={[{ t: TEXTS2.s6.head1 }]} frame={f} start={B.head1} size={100} out={head1Out} after={<WinkFace size={104} style={{ transform: `rotate(${Math.sin(f * 0.2) * 8}deg)` }} />} />
      </div>
      {f >= B.head2 - 1 && (
        <div style={{ position: "absolute", top: 254, left: 0, right: 0 }}>
          <PopWords
            parts={TEXTS2.s6.head2} frame={f} start={B.head2} size={88}
            after={<div style={{ transform: "translateY(-6px)" }}><SwingBell size={106} frame={f} rings={B.bellRings} /></div>}
          />
        </div>
      )}

      {/* link + selo */}
      <div style={{ position: "absolute", top: 900, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `scale(${linkIn * ctaOut})` }}>
        <div
          style={{
            position: "relative", display: "flex", alignItems: "center", gap: 18, padding: "18px 44px 18px 30px", borderRadius: 999, background: "#fff",
            border: `6px solid ${C.cremeDeep}`, boxShadow: "0 16px 36px rgba(34,28,25,0.16)",
          }}
        >
          <LinkIcon size={78} color={C.coral} style={{ transform: `rotate(${Math.sin(f * 0.15) * 8}deg)` }} />
          <span style={{ fontFamily: FONT, fontWeight: W.extraBold, fontSize: 56, color: C.tinta, whiteSpace: "nowrap" }}>{TEXTS2.s6.url}</span>
          {ts >= 0 && (
            <div
              style={{
                position: "absolute", right: -30, top: -58, transform: `rotate(8deg) scale(${seloS})`, padding: "8px 22px", borderRadius: 16,
                background: C.verde, border: "5px solid #fff", boxShadow: `0 6px 0 ${C.verdeDark}`,
                fontFamily: FONT, fontWeight: W.black, fontSize: 30, color: "#fff", whiteSpace: "nowrap", letterSpacing: 1,
              }}
            >
              {TEXTS2.s6.selo}
            </div>
          )}
        </div>
      </div>

      {/* faixa CHEGANDO EM BREVE */}
      {f >= B.ribbon && (
        <div style={{ position: "absolute", top: 1080, left: 540 - 410, transform: `scale(${ctaOut})` }}>
          <Ribbon text={TEXTS2.s6.ribbon} width={820} height={118} progress={ribbonP} fontSize={54} />
        </div>
      )}

      {/* END CARD: logo + @uaipertim + slogan */}
      {f >= B.endCardStart && (
        <>
          <div
            style={{
              position: "absolute", top: 1066, left: 0, right: 0, textAlign: "center", fontFamily: FONT, fontWeight: W.black, fontSize: 92,
              color: C.coral, transform: `scale(${handleIn})`, letterSpacing: -1, textShadow: `0 6px 0 ${C.cremeDeep}`,
            }}
          >
            {TEXTS2.s6.handle}
          </div>
          <div style={{ position: "absolute", top: 1200, left: 0, right: 0, transform: `scale(${sloganEnd})` }}>
            <Slogan frame={B.endCardStatic + 100} start={0} size={80} />
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};
