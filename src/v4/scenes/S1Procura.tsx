import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FONT, W } from "../../config/theme";
import { TEXTS4 } from "../config/texts";
import { BEATS4 } from "../config/timeline";
import { float, pop } from "../../lib/anim";
import { CoralBackground } from "../../components/Decor";
import { Phone, PhoneFace } from "../../components/Phone";
import { PopWords } from "../../components/Text";
import { Magnifier, SearchPill } from "../../components/Search";
import { WaveHandIcon } from "../../components/AppIcons";
import { PILL, PILL_LUPA, lensPose } from "./layout";

// CENA 1 · O cliente procura — fundo coral (dessaturado: o mundo ainda "apagado"), o celular-personagem
// digita "onde comprar aqui…", a lupa gira procurando e "?" pipocam. No fim a lupa cresce e vira a lente
// por onde a cena 2 aparece (LensZoom).
const B = BEATS4.s1;
const MUTED = "saturate(0.55) brightness(0.96)";

const QUESTIONS: Array<[number, number, number]> = [[190, 700, -12], [900, 660, 10], [150, 940, 8], [940, 910, -8], [215, 1430, 12], [870, 1440, -10]];

export const S1Procura: React.FC = () => {
  const f = useCurrentFrame();
  const phoneS = pop(f, B.phoneIn, { damping: 10, stiffness: 150 });
  const chipS = pop(f, B.chip);
  const barS = pop(f, B.barIn);
  const n = f < B.typeStart ? 0 : Math.min(TEXTS4.s1.search.length, Math.floor((f - B.typeStart) / B.typeEvery) + 1);
  const spin = f >= B.lupaSpin ? (f - B.lupaSpin) * 0.32 : 0;
  const orbit = f >= B.lupaSpin ? 14 : 0;
  const lookX = f < B.typeStart ? 0 : 0.5 + 0.4 * Math.sin(f * 0.3);
  const blink = (f + 20) % 70 < 4 ? 1 - Math.abs((f + 20) % 70 - 2) / 2 : 0;

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", inset: 0, filter: MUTED }}>
        <CoralBackground frame={f} />
      </div>

      {/* chip "Pra você, comerciante 👋" */}
      <div style={{ position: "absolute", top: 232, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `scale(${chipS})` }}>
        <div
          style={{
            display: "flex", alignItems: "center", gap: 14, padding: "14px 34px 14px 38px", borderRadius: 999, background: "#fff",
            boxShadow: "0 8px 0 rgba(120,60,40,0.35), 0 16px 30px rgba(34,28,25,0.2)",
          }}
        >
          <span style={{ fontFamily: FONT, fontWeight: W.extraBold, fontSize: 50, color: C.tinta, whiteSpace: "nowrap" }}>{TEXTS4.s1.chip}</span>
          <WaveHandIcon size={70} style={{ transform: `rotate(${Math.sin(f * 0.35) * 16}deg)`, transformOrigin: "70% 90%" }} />
        </div>
      </div>
      <div style={{ position: "absolute", top: 360, left: 0, right: 0 }}>
        <PopWords parts={TEXTS4.s1.line1} frame={f} start={B.text1} stagger={3} size={78} color="#fff" shadow="0 6px 0 rgba(120,50,30,0.55)" />
      </div>
      <div style={{ position: "absolute", top: 452, left: 0, right: 0 }}>
        <PopWords parts={TEXTS4.s1.line2} frame={f} start={B.text2} stagger={3} size={78} color="#fff" shadow="0 6px 0 rgba(120,50,30,0.55)" />
      </div>

      {/* celular-personagem */}
      <div
        style={{
          position: "absolute", left: 540 - 215, top: 580, width: 430, height: 780, filter: MUTED,
          transform: `translateY(${(1 - phoneS) * 500 + float(f, 60, 6)}px) rotate(${Math.sin(f * 0.08) * 2}deg)`,
        }}
      >
        <Phone width={430} height={780}>
          <PhoneFace width={300} mood="worried" look={[lookX, 0.7]} blink={blink} style={{ position: "absolute", left: (430 - 36 - 300) / 2, top: 120 }} />
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ position: "absolute", left: 40, right: 40, top: 330 + i * 72, height: 46, borderRadius: 14, background: C.cremeDark, opacity: 0.8 }} />
          ))}
        </Phone>
      </div>

      {/* "?" pipocando */}
      {QUESTIONS.map(([x, y, rot], i) => {
        const at = B.questions[i];
        if (f < at) return null;
        const s = pop(f, at, { damping: 7, stiffness: 220 });
        return (
          <div
            key={i}
            style={{
              position: "absolute", left: x - 40, top: y - 60 + float(f, 30, 8, i), transform: `scale(${s}) rotate(${rot + Math.sin(f * 0.2 + i) * 8}deg)`,
              fontFamily: FONT, fontWeight: W.black, fontSize: 110, color: "#fff", textShadow: "0 6px 0 rgba(120,50,30,0.5)", lineHeight: 1,
            }}
          >
            ?
          </div>
        );
      })}

      {/* barra de busca */}
      <div style={{ position: "absolute", left: PILL.left, top: PILL.top, transform: `scale(${barS})`, transformOrigin: "50% 50%" }}>
        <SearchPill width={PILL.w} height={PILL.h} frame={f} typed={TEXTS4.s1.search.slice(0, n)} caret={f >= B.typeStart - 6} />
      </div>
      {f < B.lupaZoom && (
        <div
          style={{
            position: "absolute", left: PILL_LUPA.x + Math.cos(spin) * orbit - orbit, top: PILL_LUPA.y + Math.sin(spin) * orbit,
            transform: `scale(${barS}) rotate(${Math.sin(spin) * 14}deg)`,
          }}
        >
          <Magnifier size={PILL_LUPA.size} color="#fff" glass="rgba(255,255,255,0.25)" />
        </div>
      )}
    </AbsoluteFill>
  );
};

// A lupa sai da barra e cresce até a lente cobrir a tela (a cidade da cena 2 aparece dentro dela).
export const LensZoom: React.FC<{ from: number }> = ({ from }) => {
  const f = useCurrentFrame() + from;
  const { cx, cy, size } = lensPose(f);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: cx - 0.4 * size, top: cy - 0.4 * size, width: size, height: size }}>
        <Magnifier size={size} color="#fff" glass="rgba(255,255,255,0.08)" />
      </div>
    </AbsoluteFill>
  );
};
