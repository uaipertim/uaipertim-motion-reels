import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, FONT, W } from "../../config/theme";
import { TEXTS3 } from "../config/texts";
import { BEATS3 } from "../config/timeline";
import { bouncy, breathe, clamp, pop, popOut, wiggle } from "../../lib/anim";
import { ConfettiBurst, StarPops, Twinkles } from "../../components/Particles";
import { Ribbon, SwingBell } from "../../components/Ui";
import { PopWords } from "../../components/Text";
import { ChatIcon } from "../../components/AppIcons";

// CENA 5 · Fecho + CTA — (zoom out da cidade toda iluminada com pins no TownStage)
// logo com brilho, "Bora montar o UaiPertim com a cara da nossa cidade." → "Tudo pertim de você.",
// pílulas "💬 Comenta e marca o dono" (coral) e "🔔 Segue o @uaipertim" (branca), faixa CHEGANDO EM BREVE.
// END CARD (726–750): logo + @uaipertim + slogan.
const B = BEATS3.s5;

const Slogan: React.FC<{ frame: number; start: number; size: number; out?: number }> = ({ frame, start, size, out = 1 }) => (
  <PopWords
    parts={[{ t: TEXTS3.s5.slogan[0] }, { t: TEXTS3.s5.slogan[1], color: C.coral }, { t: TEXTS3.s5.slogan[2] }]}
    frame={frame} start={start} stagger={3} size={size} weight={W.extraBold} out={out}
  />
);

const Pill: React.FC<{ bg: string; children: React.ReactNode; s: number; border?: string }> = ({ bg, children, s, border }) => (
  <div style={{ display: "flex", justifyContent: "center", transform: `scale(${s})` }}>
    <div
      style={{
        display: "flex", alignItems: "center", gap: 18, padding: "14px 40px 14px 24px", borderRadius: 999, background: bg,
        border: border ? `6px solid ${border}` : undefined,
        boxShadow: bg === C.coral ? `0 9px 0 ${C.coralDark}, 0 18px 30px rgba(198,58,23,0.3)` : `0 9px 0 ${C.cremeDeep}, 0 18px 30px rgba(34,28,25,0.14)`,
      }}
    >
      {children}
    </div>
  </div>
);

export const S5Fecho: React.FC = () => {
  const raw = useCurrentFrame();
  const f = Math.min(raw, B.endCardStatic); // end card congela
  const endP = interpolate(f, [B.endCardStart, B.endCardStatic], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const ctaOut = popOut(f, B.endCardStart, 8);

  const logoIn = bouncy(f, B.logo);
  const logoSize = 236 + endP * 214;
  const logoCy = 338 + endP * 380;
  const glow = 0.7 + 0.3 * Math.sin(f * 0.18);
  const headOut = popOut(f, B.slogan - 6, 6);
  const ribbonP = interpolate(f, [B.ribbon, B.ribbon + B.ribbonDur], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
  const pill1 = pop(f, B.pill1) * ctaOut;
  const pill2 = pop(f, B.pill2) * ctaOut;
  const handleIn = pop(f, B.endCardStart + 3, { damping: 14, stiffness: 300 });
  const sloganEnd = pop(f, B.endCardStart + 5, { damping: 14, stiffness: 300 });
  const fs = 50;

  return (
    <AbsoluteFill>
      <Twinkles frame={f} seed="v3s5" points={[[90, 520], [990, 470], [80, 1180], [1000, 1220]]} />
      <div style={{ position: "absolute", inset: 0, opacity: 1 - endP }}>
        <ConfettiBurst frame={f} start={B.confetti} x={-20} y={1300} angle={-60} spread={40} power={62} count={40} seed="v3c5L" />
        <ConfettiBurst frame={f} start={B.confetti} x={1100} y={1300} angle={-120} spread={40} power={62} count={40} seed="v3c5R" />
      </div>

      {/* logo com brilho */}
      <div
        style={{
          position: "absolute", left: 540 - logoSize * 0.85, top: logoCy - logoSize * 0.85, width: logoSize * 1.7, height: logoSize * 1.7, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 66%)", transform: `scale(${logoIn * glow})`,
        }}
      />
      <StarPops frame={f} start={B.logo + 3} cx={540} cy={338} radius={170} count={8} seed="v3s5-logo" size={48} />
      <div
        style={{
          position: "absolute", left: 540 - logoSize / 2, top: logoCy - logoSize / 2, width: logoSize, height: logoSize,
          transform: `scale(${logoIn * (breathe(f, 44, 0.04) * (1 - endP) + endP)}) rotate(${wiggle(f, B.logo + 3, 9, 0.35, 0.09) * (1 - endP)}deg)`,
          filter: "drop-shadow(0 18px 24px rgba(198,58,23,0.35))",
        }}
      >
        <Img src={staticFile("img/uaipertim_logo.png")} style={{ width: "100%", height: "100%" }} />
      </div>

      {/* "Bora montar o UaiPertim com a cara da nossa cidade." → "Tudo pertim de você." */}
      <div style={{ position: "absolute", top: 478, left: 0, right: 0 }}>
        <PopWords
          parts={[{ t: TEXTS3.s5.headline[0] }, { t: TEXTS3.s5.headline[1], color: C.coral }]}
          frame={f} start={B.headline1} stagger={3} size={64} out={headOut}
        />
      </div>
      <div style={{ position: "absolute", top: 550, left: 0, right: 0 }}>
        <PopWords parts={TEXTS3.s5.headline2} frame={f} start={B.headline2} stagger={3} size={64} out={headOut} />
      </div>
      {f >= B.slogan - 1 && (
        <div style={{ position: "absolute", top: 500, left: 0, right: 0 }}>
          <Slogan frame={f} start={B.slogan} size={92} out={ctaOut} />
        </div>
      )}

      {/* pílulas de CTA */}
      <div style={{ position: "absolute", top: 1146, left: 0, right: 0 }}>
        <Pill bg={C.coral} s={pill1}>
          <ChatIcon size={70} color={C.amarelo} style={{ transform: `rotate(${Math.sin(f * 0.2) * 8}deg)` }} />
          <span style={{ fontFamily: FONT, fontWeight: W.black, fontSize: fs, color: "#fff", whiteSpace: "nowrap" }}>{TEXTS3.s5.pill1}</span>
        </Pill>
      </div>
      <div style={{ position: "absolute", top: 1262, left: 0, right: 0 }}>
        <Pill bg="#fff" s={pill2} border={C.cremeDeep}>
          <div style={{ transform: "translateY(-2px)" }}>
            <SwingBell size={66} frame={f} rings={B.bellRings} />
          </div>
          <span style={{ fontFamily: FONT, fontWeight: W.black, fontSize: fs, color: C.tinta, whiteSpace: "nowrap" }}>
            {TEXTS3.s5.pill2.replace(TEXTS3.s5.handle, "")}
            <span style={{ color: C.coral }}>{TEXTS3.s5.handle}</span>
          </span>
        </Pill>
      </div>

      {/* faixa CHEGANDO EM BREVE */}
      {f >= B.ribbon && (
        <div style={{ position: "absolute", top: 1384, left: 540 - 380, transform: `scale(${ctaOut})` }}>
          <Ribbon text={TEXTS3.s5.ribbon} width={760} height={92} progress={ribbonP} fontSize={50} />
        </div>
      )}

      {/* END CARD: logo + @uaipertim + slogan */}
      {f >= B.endCardStart && (
        <>
          <div
            style={{
              position: "absolute", top: 1004, left: 0, right: 0, textAlign: "center", fontFamily: FONT, fontWeight: W.black, fontSize: 96,
              color: C.coral, transform: `scale(${handleIn})`, letterSpacing: -1, textShadow: `0 6px 0 ${C.cremeDeep}`,
            }}
          >
            {TEXTS3.s5.handle}
          </div>
          <div style={{ position: "absolute", top: 1140, left: 0, right: 0, transform: `scale(${sloganEnd})` }}>
            <Slogan frame={B.endCardStatic + 100} start={0} size={82} />
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};
