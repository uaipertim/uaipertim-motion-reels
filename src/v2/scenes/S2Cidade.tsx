import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { C, FONT, W } from "../../config/theme";
import { TEXTS2 } from "../config/texts";
import { BEATS2, SCENES2 } from "../config/timeline";
import { clamp, dropBounce, lerp, pop, popOut, squash } from "../../lib/anim";
import { CremeBackground } from "../../components/Decor";
import { AppHeader, CityMap } from "../../components/AppUi";
import { PinIcon } from "../../components/AppIcons";
import { TapCursor, ZoomThrough } from "../../components/Guide";
import { MapPin } from "../../components/Scenery";
import { StarPops } from "../../components/Particles";
import { SCREEN, SMALL, STAGE_CY, StagePhone, StepTitle, toVideo } from "./Stage";
import { HappyScreen } from "./S1Abertura";

// CENA 2 · Passo 1: a cidade — zoom pra dentro do celular, mapa cartoon, pin gigante quicando, card da cidade.
const B = BEATS2.s2;
const DUR = SCENES2.s2.duration;
const MAP = { top: 200, h: 700 };
const PIN = { x: SCREEN.w / 2, y: MAP.top + 400 }; // ponta do pin (coords da tela)
const CARD = { top: 735, h: 180, w: 760 };

export const S2Cidade: React.FC = () => {
  const f = useCurrentFrame();
  // zoom-through: o celular-personagem cresce e vira o palco
  const z = interpolate(f, [0, B.zoomDur], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const scale = lerp(SMALL.scale, 1, z);
  const dy = lerp(SMALL.cy - STAGE_CY, 0, z);
  const faceO = interpolate(f, [0, 8], [1, 0], clamp);
  const appO = interpolate(f, [4, 14], [0, 1], clamp);

  // pin cai do céu com 2 quiques + ondinha no chão
  const pinY = dropBounce(f, B.pinDrop, 900, B.pinLand - B.pinDrop, 2);
  const [psx, psy] = squash(f, B.pinLand, 0.28);
  const waveT = f - B.pinLand;

  const cardIn = pop(f, B.card, { damping: 11, stiffness: 140 });
  const tapT = f - B.tap;
  const cardPress = tapT >= 0 && tapT < 10 ? 1 - 0.05 * Math.sin((tapT / 10) * Math.PI) : 1;
  const [tapX, tapY] = toVideo(SCREEN.w / 2, CARD.top + CARD.h / 2);
  const out = popOut(f, DUR - 8, 7);

  return (
    <AbsoluteFill>
      <CremeBackground frame={f + SCENES2.s2.from} />
      <StagePhone scale={scale} dy={dy}>
        {faceO > 0 && (
          <div style={{ position: "absolute", inset: 0, opacity: faceO }}>
            <HappyScreen frame={f + SCENES2.s2.from} />
          </div>
        )}
        <div style={{ position: "absolute", inset: 0, opacity: appO }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 200, background: "#fff" }} />
          <div style={{ position: "absolute", left: 0, top: 104 }}>
            <AppHeader width={SCREEN.w} />
          </div>
          <div style={{ position: "absolute", left: 0, top: MAP.top }}>
            <CityMap width={SCREEN.w} height={MAP.h + 500} frame={f} />
          </div>
          {/* ondinha no chão quando o pin pousa */}
          {waveT >= 0 && waveT < 30 && [0, 8].map((d) => {
            const t = waveT - d;
            if (t < 0) return null;
            const p = Math.min(1, t / 20);
            return (
              <div
                key={d}
                style={{
                  position: "absolute", left: PIN.x - 40 - 160 * p, top: PIN.y - 14 - 40 * p, width: 80 + 320 * p, height: 28 + 80 * p,
                  borderRadius: "50%", border: `${8 * (1 - p)}px solid ${C.coral}`, opacity: 1 - p,
                }}
              />
            );
          })}
          {f >= B.pinDrop && (
            <>
              <div style={{ position: "absolute", left: PIN.x - 70, top: PIN.y - 16, width: 140, height: 32, borderRadius: "50%", background: "rgba(34,28,25,0.2)", transform: `scale(${interpolate(pinY, [-900, 0], [0.2, 1], clamp)})` }} />
              <div style={{ position: "absolute", left: PIN.x - 110, top: PIN.y - 286, transform: `translateY(${pinY}px) scale(${psx}, ${psy})`, transformOrigin: "50% 100%" }}>
                <MapPin size={220} />
              </div>
            </>
          )}
          {/* card da cidade */}
          <div
            style={{
              position: "absolute", left: (SCREEN.w - CARD.w) / 2, top: CARD.top, width: CARD.w, height: CARD.h,
              transform: `translateY(${(1 - cardIn) * 700}px) scale(${cardPress})`, borderRadius: 34, background: "#fff",
              boxShadow: "0 -6px 30px rgba(34,28,25,0.18)", padding: "26px 30px", display: "flex", flexDirection: "column", gap: 12,
              border: tapT >= 0 ? `5px solid ${C.coral}` : "5px solid transparent",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <PinIcon size={50} />
              <span style={{ fontFamily: FONT, fontWeight: W.extraBold, fontSize: 38, color: C.tinta, whiteSpace: "nowrap" }}>{TEXTS2.s2.city}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 64 }}>
              <span style={{ fontFamily: FONT, fontWeight: W.medium, fontSize: 30, color: "#8A7F78" }}>{TEXTS2.s2.uf}</span>
              <span style={{ padding: "10px 28px", borderRadius: 999, background: C.coral, color: "#fff", fontFamily: FONT, fontWeight: W.black, fontSize: 28, boxShadow: `0 6px 0 ${C.coralDark}` }}>
                {TEXTS2.s2.action}
              </span>
            </div>
          </div>
          <ZoomThrough frame={f} start={B.zoomOut} dur={DUR - B.zoomOut} cx={SCREEN.w / 2} cy={CARD.top + CARD.h / 2} color={C.coral} />
        </div>
      </StagePhone>
      <StarPops frame={f} start={B.pinLand} cx={toVideo(PIN.x, PIN.y)[0]} cy={toVideo(PIN.x, PIN.y)[1] - 120} radius={170} count={7} seed="v2s2" size={46} />
      <StepTitle n={1} text={TEXTS2.s2.step} frame={f} badgeAt={B.badge} textAt={B.text} out={out} />
      <TapCursor
        frame={f}
        appear={B.cursorIn}
        hide={B.zoomOut + 2}
        keys={[{ f: B.cursorIn, x: 960, y: 1700 }, { f: B.tap - 5, x: tapX, y: tapY }]}
        taps={[B.tap]}
      />
    </AbsoluteFill>
  );
};
