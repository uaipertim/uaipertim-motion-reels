import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { C, FONT, W } from "../../config/theme";
import { TEXTS4 } from "../config/texts";
import { BEATS4, SCENES4 } from "../config/timeline";
import { bouncy, clamp } from "../../lib/anim";
import { Marker } from "../../components/Ui";
import { PopWords } from "../../components/Text";
import { Magnifier, NotFoundStamp } from "../../components/Search";
import { LUPA2, lojTownCenter, lupaSweep } from "./layout";

// CENA 2 · A loja invisível — (a cidade cinza e a Lojinha apagada estão no Stage4)
// a lupa varre a cidade e não para na Lojinha; carimbo "NÃO ENCONTRADO"; "Ele te acha?".
const B = BEATS4.s2;
const STAMP_Y = 905; // por cima do toldo/placa da Lojinha (o rosto triste continua à mostra)

export const S2Invisivel: React.FC = () => {
  const f = useCurrentFrame();
  const abs = f + SCENES4.s2.from;
  const lupa = lupaSweep(abs);
  const acha = bouncy(f, B.headline + 6);
  const marker = interpolate(f, [B.markerStart, B.markerStart + B.markerDur], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const ts = f - B.stamp;
  const stampS = ts < 0 ? 0 : ts < 5 ? 1.9 - 0.9 * Math.pow(ts / 5, 2) : 1 + 0.07 * Math.sin((ts - 5) * 1.2) * Math.exp(-(ts - 5) * 0.3);

  return (
    <AbsoluteFill>
      {/* lupa varrendo (coral discreto) */}
      {lupa.t > -0.2 && lupa.t < 1.2 && (
        <div
          style={{
            position: "absolute", left: lupa.x - 0.4 * LUPA2.size, top: lupa.y - 0.4 * LUPA2.size, filter: "saturate(0.55)",
            transform: `rotate(${Math.sin(abs * 0.17) * 6}deg)`, transformOrigin: "40% 40%",
          }}
        >
          <Magnifier size={LUPA2.size} glass="rgba(255,249,241,0.28)" />
        </div>
      )}

      {/* carimbo NÃO ENCONTRADO sobre a Lojinha */}
      {ts >= 0 && (
        <div style={{ position: "absolute", left: lojTownCenter.x - 360, top: STAMP_Y - 100, transform: `rotate(-8deg) scale(${stampS})`, filter: "saturate(0.75)" }}>
          <NotFoundStamp text={TEXTS4.s2.stamp} width={720} seed="v4nf" />
        </div>
      )}

      {/* "Ele te acha?" com marcador amarelo em "acha?" */}
      <div style={{ position: "absolute", top: 236, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <PopWords parts={TEXTS4.s2.headline[0]} frame={f} start={B.headline} stagger={3} size={126} />
        {f >= B.headline + 6 && (
          <div style={{ position: "relative", transform: `scale(${acha}) rotate(-3deg)` }}>
            <Marker width={400} progress={marker} thickness={52} style={{ position: "absolute", left: -14, top: 70 }} />
            <span style={{ position: "relative", fontFamily: FONT, fontWeight: W.black, fontSize: 126, lineHeight: 1.08, color: C.tinta, letterSpacing: -1 }}>
              {TEXTS4.s2.headline[1]}
            </span>
          </div>
        )}
      </div>
      <div style={{ position: "absolute", top: 420, left: 0, right: 0 }}>
        <PopWords parts={TEXTS4.s2.subline1} frame={f} start={B.subline1} stagger={2} size={62} weight={W.extraBold} />
      </div>
      <div style={{ position: "absolute", top: 494, left: 0, right: 0 }}>
        <PopWords
          parts={[{ t: TEXTS4.s2.subline2[0] }, { t: TEXTS4.s2.subline2[1], color: "#B9654F" }, { t: TEXTS4.s2.subline2[2] }]} frame={f} start={B.subline2} stagger={2} size={62} weight={W.extraBold}
        />
      </div>
    </AbsoluteFill>
  );
};
