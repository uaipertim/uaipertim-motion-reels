import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { C } from "../../config/theme";
import { TEXTS4 } from "../config/texts";
import { BEATS4 } from "../config/timeline";
import { bouncy, breathe, pop, popOut } from "../../lib/anim";
import { StarPops } from "../../components/Particles";
import { PopWords } from "../../components/Text";
import { PinIcon } from "../../components/AppIcons";
import { LOGO3 } from "./layout";

// CENA 3 · Acende no mapa — (o pin, a Lojinha acendendo e a onda de cor estão no Stage4)
// o logo entra girando e solta o pin; "O UaiPertim coloca você no mapa da cidade. 📍".
const B = BEATS4.s3;

export const S3Acende: React.FC = () => {
  const f = useCurrentFrame();
  const inS = bouncy(f, B.logoIn);
  const spin = f < B.logoIn ? -540 : -540 * Math.max(0, 1 - pop(f, B.logoIn, { damping: 14, stiffness: 90 }));
  const toss = f >= B.pinRelease ? 1 + 0.14 * Math.exp(-(f - B.pinRelease) * 0.25) * Math.sin((f - B.pinRelease) * 0.6) : 1;
  const out = popOut(f, B.zoomIn, 8);
  const textOut = popOut(f, B.textOut, 8);
  const glow = 0.75 + 0.25 * Math.sin(f * 0.18);
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute", left: LOGO3.cx - LOGO3.size * 0.8, top: LOGO3.cy - LOGO3.size * 0.8, width: LOGO3.size * 1.6, height: LOGO3.size * 1.6,
          borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 66%)", transform: `scale(${inS * glow * out})`,
        }}
      />
      <StarPops frame={f} start={B.logoIn + 6} cx={LOGO3.cx} cy={LOGO3.cy} radius={170} count={8} seed="v4logo" size={46} />
      <div
        style={{
          position: "absolute", left: LOGO3.cx - LOGO3.size / 2, top: LOGO3.cy - LOGO3.size / 2, width: LOGO3.size, height: LOGO3.size,
          transform: `scale(${inS * toss * breathe(f, 44, 0.03) * out}) rotate(${spin}deg)`, filter: "drop-shadow(0 16px 22px rgba(198,58,23,0.35))",
        }}
      >
        <Img src={staticFile("img/uaipertim_logo.png")} style={{ width: "100%", height: "100%" }} />
      </div>

      <div style={{ position: "absolute", top: 248, left: 0, right: 0 }}>
        <PopWords
          parts={[{ t: TEXTS4.s3.line1[0] }, { t: TEXTS4.s3.line1[1], color: C.coral }, { t: TEXTS4.s3.line1[2] }]}
          frame={f} start={B.text1} stagger={3} size={70} out={textOut}
        />
      </div>
      <div style={{ position: "absolute", top: 330, left: 0, right: 0 }}>
        <PopWords
          parts={TEXTS4.s3.line2} frame={f} start={B.text2} stagger={3} size={70} out={textOut}
          after={<PinIcon size={78} style={{ transform: `translateY(${-Math.abs(Math.sin(f * 0.2)) * 8}px)` }} />}
        />
      </div>
    </AbsoluteFill>
  );
};
