import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, FONT, W } from "../config/theme";
import { TEXTS } from "../config/texts";
import { BEATS, SCENES, TRANSITIONS } from "../config/timeline";
import { bouncy, breathe, clamp, pop, popOut, prog, wiggle } from "../lib/anim";
import { CremeBackground } from "../components/Decor";
import { StarPops, Twinkles } from "../components/Particles";
import { Marker } from "../components/Ui";
import { PopWords } from "../components/Text";

// CENA 3 · A virada — logo entra com pulo + brilho; "NÃO" gigante com marcador amarelo.
const B = BEATS.s3;
const LOGO = { cx: 540, cy: 560, size: 420 };

export const Scene3Virada: React.FC = () => {
  const f = useCurrentFrame();
  const engulfStart = TRANSITIONS.engulf34.from - SCENES.s3.from;
  const engulf = interpolate(f, [engulfStart, engulfStart + TRANSITIONS.engulf34.duration - 2], [0, 1], {
    ...clamp, easing: Easing.in(Easing.cubic),
  });
  const textOut = popOut(f, engulfStart - 4, 8);

  const logoS = bouncy(f, B.logo) * breathe(f, 40, 0.025);
  const logoRot = wiggle(f, B.logo + 3, 12, 0.32, 0.08);
  const glow = 0.6 + 0.4 * Math.sin(f * 0.2);
  // o logo "engole" a cena: o disco coral cresce até cobrir tudo
  const discR = (LOGO.size / 2) * (1 + engulf * 11);
  const contentOut = 1 - Math.min(1, engulf * 2.2);

  const naoS = bouncy(f, B.nao);
  const naoRot = wiggle(f, B.nao + 2, 6, 0.5, 0.12);
  const marker = prog(f, B.markerStart, B.markerDur, Easing.out(Easing.quad));

  return (
    <AbsoluteFill>
      <CremeBackground frame={f} rays raysCenter={[LOGO.cx, LOGO.cy]} raysOpacity={0.12} />
      <Twinkles frame={f} seed="tw3" points={[[130, 420], [960, 520], [180, 760], [900, 300], [110, 1180], [985, 1110]]} />
      {/* brilho atrás do logo */}
      <div
        style={{
          position: "absolute", left: LOGO.cx - 330, top: LOGO.cy - 330, width: 660, height: 660, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 68%)",
          transform: `scale(${pop(f, B.logo + 2) * (0.9 + 0.1 * glow)})`,
        }}
      />
      <StarPops frame={f} start={B.sparkle} cx={LOGO.cx} cy={LOGO.cy} radius={270} count={9} seed="logo-stars" size={64} />
      <StarPops frame={f} start={B.sparkle + 26} cx={LOGO.cx} cy={LOGO.cy} radius={300} count={6} seed="logo-stars-2" size={44} loop={34} />

      {/* textos */}
      <div style={{ position: "absolute", top: 774, left: 0, right: 0 }}>
        <PopWords
          parts={[
            { t: `${TEXTS.s3.lead} ` },
            { t: TEXTS.s3.brandA, color: C.coral },
            { t: TEXTS.s3.brandB, color: C.amarelo, shadow: `0 5px 0 ${C.amareloDark}, 0 0 18px rgba(255,255,255,0.9)` },
          ]}
          frame={f}
          start={B.line1}
          stagger={4}
          size={108}
          out={textOut}
        />
      </div>
      <div style={{ position: "absolute", top: 930, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <div style={{ position: "relative", transform: `scale(${naoS * textOut}) rotate(${naoRot}deg)` }}>
          <Marker width={660} progress={marker} thickness={64} style={{ position: "absolute", left: -20, top: 236 }} />
          <span
            style={{
              position: "relative", fontFamily: FONT, fontWeight: W.black, fontSize: 300, lineHeight: 1.05, color: C.coral,
              textShadow: `0 12px 0 ${C.coralDark}`, letterSpacing: -6,
            }}
          >
            {TEXTS.s3.nao}
          </span>
        </div>
      </div>
      <div style={{ position: "absolute", top: 1290, left: 0, right: 0 }}>
        <PopWords parts={TEXTS.s3.tail} frame={f} start={B.line3} stagger={4} size={128} out={textOut} />
      </div>

      {/* logo + disco coral que cresce no "engolir" */}
      <div
        style={{
          position: "absolute", left: LOGO.cx - discR, top: LOGO.cy - discR, width: discR * 2, height: discR * 2, borderRadius: "50%",
          background: C.logoCoral, transform: `scale(${engulf > 0 ? 1 : logoS})`, opacity: engulf > 0 ? 1 : 0,
        }}
      />
      <div
        style={{
          position: "absolute", left: LOGO.cx - LOGO.size / 2, top: LOGO.cy - LOGO.size / 2, width: LOGO.size, height: LOGO.size,
          transform: `scale(${logoS * (1 + engulf * 1.6)}) rotate(${logoRot}deg)`, opacity: contentOut,
          filter: "drop-shadow(0 18px 24px rgba(198,58,23,0.35))",
        }}
      >
        <Img src={staticFile("img/uaipertim_logo.png")} style={{ width: "100%", height: "100%" }} />
      </div>
    </AbsoluteFill>
  );
};
