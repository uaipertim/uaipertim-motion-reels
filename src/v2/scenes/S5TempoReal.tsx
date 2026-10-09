import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, FONT, W } from "../../config/theme";
import { TEXTS2 } from "../config/texts";
import { BEATS2, SCENES2 } from "../config/timeline";
import { clamp, pop } from "../../lib/anim";
import { CremeBackground } from "../../components/Decor";
import { DeliveryRoad, OrderTimeline } from "../../components/AppUi";
import { ScooterIcon } from "../../components/AppIcons";
import { RevealFade } from "../../components/Guide";
import { StarPops, Twinkles } from "../../components/Particles";
import { PopWords } from "../../components/Text";
import { SCREEN, StagePhone, toVideo } from "./Stage";

// CENA 5 · Acompanha em tempo real — linha do tempo do pedido acendendo; motinho leva a sacolinha
// pela estradinha até a casinha, que pula e solta corações.
const B = BEATS2.s5;

export const S5TempoReal: React.FC = () => {
  const f = useCurrentFrame();
  const lit = B.steps.map((s) => (f >= s ? pop(f, s, { damping: 8, stiffness: 220 }) : 0));
  const ride = interpolate(f, [B.rideStart, B.rideEnd], [0, 1], { ...clamp, easing: Easing.inOut(Easing.sin) });
  const arrive = B.steps[3];

  return (
    <AbsoluteFill>
      <CremeBackground frame={f + SCENES2.s5.from} />
      <Twinkles frame={f} seed="v2s5" points={[[110, 600], [970, 640]]} />
      <StagePhone>
        <div style={{ position: "absolute", left: 36, right: 36, top: 104, display: "flex", alignItems: "center", gap: 16 }}>
          <Img src={staticFile("img/uaipertim_mark.png")} style={{ width: 64, height: 64 }} />
          <span style={{ fontFamily: FONT, fontWeight: W.black, fontSize: 44, color: C.tinta }}>{TEXTS2.s5.header}</span>
          <span style={{ marginLeft: "auto", padding: "6px 20px", borderRadius: 999, background: "#E4F4E6", color: C.verde, fontFamily: FONT, fontWeight: W.extraBold, fontSize: 24 }}>
            ● ao vivo
          </span>
        </div>
        <div style={{ position: "absolute", left: 40, top: 205 }}>
          <OrderTimeline labels={TEXTS2.s5.steps} lit={lit} frame={f} width={SCREEN.w - 80} />
        </div>
        <div style={{ position: "absolute", left: 0, top: 690, width: SCREEN.w, height: 260, background: "#EFE3CC", borderRadius: 30 }} />
        <div style={{ position: "absolute", left: 0, top: 680 }}>
          <DeliveryRoad width={SCREEN.w} height={260} t={ride} frame={f} arriveFrame={arrive} />
        </div>
        <RevealFade frame={f} dur={B.reveal} />
      </StagePhone>
      <StarPops frame={f} start={arrive} cx={toVideo(SCREEN.w - 95, 0)[0]} cy={toVideo(0, 760)[1]} radius={150} count={8} seed="v2s5-arrive" size={46} />
      <div style={{ position: "absolute", top: 268, left: 0, right: 0 }}>
        <PopWords parts={TEXTS2.s5.title[0]} frame={f} start={B.title} size={92} />
        <PopWords
          parts={[{ t: TEXTS2.s5.title[1], color: C.coral }]}
          frame={f}
          start={B.title + 6}
          size={92}
          after={<ScooterIcon size={104} wheelSpin={f * 20} style={{ transform: `translateY(${Math.sin(f * 0.6) * 3}px)` }} />}
        />
      </div>
    </AbsoluteFill>
  );
};
