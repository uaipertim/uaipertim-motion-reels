import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { C, FONT, W } from "../../config/theme";
import { TEXTS2 } from "../config/texts";
import { BEATS2 } from "../config/timeline";
import { float, pop, squash, wiggle } from "../../lib/anim";
import { CremeBackground } from "../../components/Decor";
import { PhoneFace } from "../../components/Phone";
import { DownArrow, PointerArrow } from "../../components/AppIcons";
import { TapCursor } from "../../components/Guide";
import { StarPops, Twinkles } from "../../components/Particles";
import { PopWords } from "../../components/Text";
import { SCREEN, SMALL, STAGE_CY, StagePhone } from "./Stage";

// CENA 1 · Abertura — celular-personagem leve e feliz, piscadinha, setinha pra tela, chip "PRÉVIA".
const B = BEATS2.s1;

// Conteúdo da tela no modo personagem (reaproveitado no início da cena 2).
export const HappyScreen: React.FC<{ frame: number; blink?: number; wink?: number }> = ({ frame, blink = 0, wink = 0 }) => (
  <>
    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, #FFF8EE, ${C.creme})` }} />
    <PhoneFace width={640} mood="happy" blink={blink} blinkRight={wink} look={[0.2, 0.3]} style={{ position: "absolute", left: (SCREEN.w - 640) / 2, top: 300 }} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 820, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
      <Img src={staticFile("img/uaipertim_mark.png")} style={{ width: 260, height: 260, transform: `rotate(${Math.sin(frame * 0.12) * 4}deg)` }} />
      <span style={{ fontFamily: FONT, fontWeight: W.black, fontSize: 64, color: C.coral }}>
        Uai<span style={{ color: C.amarelo }}>Pertim</span>
      </span>
    </div>
  </>
);

export const S1Abertura: React.FC = () => {
  const f = useCurrentFrame();
  // queda + squash no chão
  const fall = Math.min(1, f / B.land);
  const dropY = -900 * (1 - fall * fall);
  const [sx, sy] = squash(f, B.land, 0.24);
  const hop = f > B.land + 20 ? -Math.abs(Math.sin((f - B.land - 20) * 0.16)) * 14 : 0; // pulinhos de felicidade
  const blinkAt = (at: number) => (f >= at && f < at + 6 ? Math.sin(((f - at) / 6) * Math.PI) : 0);
  const blink = blinkAt(B.blink);
  const wink = f >= B.wink && f < B.wink + 14 ? Math.sin(Math.min(1, (f - B.wink) / 14) * Math.PI) : 0;

  // chip PRÉVIA carimbando
  const tc = f - B.chip;
  const chipS = tc < 0 ? 0 : tc < 4 ? 2.6 - 1.6 * Math.pow(tc / 4, 2) : 1 + 0.08 * Math.sin((tc - 4) * 1.1) * Math.exp(-(tc - 4) * 0.3);

  // setinha apontando pra própria tela
  const arrowS = pop(f, B.arrow, { damping: 8, stiffness: 200 });
  const arrowNudge = Math.sin(f * 0.35) * 10;

  const phoneCy = SMALL.cy + dropY + hop;
  const tapX = 540;
  const tapY = SMALL.cy - 30;

  return (
    <AbsoluteFill>
      <CremeBackground frame={f} rays raysCenter={[540, SMALL.cy]} raysOpacity={0.1} />
      <Twinkles frame={f} seed="v2s1" points={[[120, 700], [960, 760], [150, 1420], [940, 1500]]} />
      {/* sombra */}
      <div
        style={{
          position: "absolute", left: 540 - 230 * sx, top: SMALL.cy + 430, width: 460 * sx, height: 50, borderRadius: "50%",
          background: "rgba(34,28,25,0.15)", transform: `scale(${0.4 + 0.6 * fall})`,
        }}
      />
      <StagePhone scale={SMALL.scale} dy={phoneCy - STAGE_CY} sx={sx} sy={sy} rot={wiggle(f, B.land, 4, 0.4, 0.1)}>
        <HappyScreen frame={f} blink={blink} wink={wink} />
      </StagePhone>
      <StarPops frame={f} start={B.land + 2} cx={540} cy={SMALL.cy - 60} radius={300} count={7} seed="v2s1-pop" size={52} />

      {/* setinha "olha aqui" */}
      <div style={{ position: "absolute", left: 790 + arrowNudge, top: SMALL.cy - 300 - arrowNudge * 0.5, transform: `scale(${arrowS}) rotate(-10deg)` }}>
        <PointerArrow size={170} />
      </div>

      {/* chip PRÉVIA */}
      {tc >= 0 && (
        <div
          style={{
            position: "absolute", right: 70, top: 250, transform: `rotate(-9deg) scale(${chipS})`, padding: "12px 34px", borderRadius: 999,
            background: C.amarelo, border: `5px solid ${C.tinta}`, boxShadow: `0 8px 0 ${C.tinta}`,
            fontFamily: FONT, fontWeight: W.black, fontSize: 46, color: C.tinta, letterSpacing: 3,
          }}
        >
          {TEXTS2.s1.chip}
        </div>
      )}

      {/* "Vai funcionar assim, ó 👇" */}
      <div style={{ position: "absolute", top: 380, left: 0, right: 0 }}>
        <PopWords parts={TEXTS2.s1.title[0]} frame={f} start={B.title1} size={104} />
        <PopWords
          parts={[{ t: TEXTS2.s1.title[1], color: C.coral }]}
          frame={f}
          start={B.title2}
          size={118}
          after={<DownArrow size={96} style={{ transform: `translateY(${float(f, 14, 10)}px)` }} />}
        />
      </div>

      <TapCursor
        frame={f}
        appear={B.cursorIn}
        keys={[{ f: B.cursorIn, x: 900, y: 1500 }, { f: B.tap - 4, x: tapX, y: tapY }]}
        taps={[B.tap]}
      />
    </AbsoluteFill>
  );
};
