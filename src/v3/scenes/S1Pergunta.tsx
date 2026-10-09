import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { C, FONT, W } from "../../config/theme";
import { TEXTS3 } from "../config/texts";
import { BEATS3 } from "../config/timeline";
import { bouncy, clamp, jitter, prog, squash } from "../../lib/anim";
import { CoralBackground } from "../../components/Decor";
import { ConfettiBurst, StarPops, Twinkles } from "../../components/Particles";
import { Marker } from "../../components/Ui";
import { PopWords } from "../../components/Text";

// CENA 1 · A pergunta — balão de pergunta gigante infla com "?" quicando, estoura em confete
// e revela o título; "PRECISA" ganha marcador amarelo e treme de ênfase.
const B = BEATS3.s1;
const CX = 540;
const CY = 880;

const QuestionBalloon: React.FC<{ width: number }> = ({ width }) => (
  <svg width={width} height={width * 0.86} viewBox="0 0 600 516" style={{ overflow: "visible" }}>
    {/* sombra */}
    <g transform="translate(0 16)" fill={C.coralDark}>
      <ellipse cx="300" cy="236" rx="282" ry="214" />
      <path d="M150 390 L84 500 Q80 510 92 504 L270 420 Z" />
    </g>
    <ellipse cx="300" cy="236" rx="282" ry="214" fill="#fff" />
    <path d="M150 390 L84 500 Q80 510 92 504 L270 420 Z" fill="#fff" />
    <ellipse cx="300" cy="262" rx="250" ry="172" fill={C.cremeDark} opacity="0.35" />
    <ellipse cx="300" cy="226" rx="262" ry="192" fill="#fff" />
    <path d="M86 170 Q120 74 240 48" stroke={C.creme} strokeWidth="22" strokeLinecap="round" fill="none" />
  </svg>
);

export const S1Pergunta: React.FC = () => {
  const f = useCurrentFrame();

  // balão infla (0 → 1.1 → 1), incha antes de estourar e some no pop
  const inflate = f < B.inflateEnd
    ? 1.1 * Easing.out(Easing.cubic)(f / B.inflateEnd)
    : 1 + 0.1 * Math.exp(-(f - B.inflateEnd) * 0.22) * Math.cos((f - B.inflateEnd) * 0.55);
  const fuuu = f < B.inflateEnd ? Math.sin(f * 1.4) * 0.05 * (1 - f / B.inflateEnd) : 0;
  const tension = prog(f, B.pop - 7, 7, Easing.in(Easing.quad));
  const balloonS = inflate + 0.1 * tension;
  const shake = tension > 0 ? jitter(f, "v3bal", 7 * tension) : 0;
  const popped = f >= B.pop;

  // "?" quica 3 vezes dentro do balão
  let qDy = 0;
  let qSq: [number, number] = [1, 1];
  B.qBounces.forEach((b) => {
    const t = f - b;
    if (t >= 0 && t < 8) qDy -= 56 * 4 * (t / 8) * (1 - t / 8);
    if (t >= 8) {
      const s = squash(f, b + 8, 0.2);
      qSq = [qSq[0] * s[0], qSq[1] * s[1]];
    }
  });

  // título
  const precisaIn = bouncy(f, B.title2);
  const marker = interpolate(f, [B.markerStart, B.markerStart + B.markerDur], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const tr = f >= B.tremble ? (f < B.tremble + 16 ? 1 : 0.35) : 0;
  const trRot = jitter(f, "v3tr", 3.2 * tr);
  const trX = jitter(f + 7, "v3trx", 5 * tr);
  const flash = interpolate(f, [B.pop, B.pop + 10], [0, 1], clamp);

  return (
    <AbsoluteFill>
      <CoralBackground frame={f} />
      <Twinkles frame={f} seed="v3s1" color="#fff" points={[[130, 420], [950, 380], [110, 1380], [980, 1330]]} />

      {!popped && (
        <div
          style={{
            position: "absolute", left: CX - 330, top: CY - 300, width: 660, height: 568,
            transform: `translate(${shake}px, 0) scale(${balloonS * (1 + fuuu)}, ${balloonS * (1 - fuuu)}) rotate(${shake * 0.3}deg)`,
            transformOrigin: "50% 60%",
          }}
        >
          <QuestionBalloon width={660} />
          <div
            style={{
              position: "absolute", left: 0, right: 0, top: 70, textAlign: "center", fontFamily: FONT, fontWeight: W.black, fontSize: 300,
              lineHeight: 1.1, color: C.coral, textShadow: `0 12px 0 ${C.coralDark}`,
              transform: `translateY(${qDy}px) scale(${qSq[0]}, ${qSq[1]})`, transformOrigin: "50% 90%",
            }}
          >
            {TEXTS3.s1.question}
          </div>
        </div>
      )}

      {/* estouro: anel + confete */}
      {popped && flash < 1 && (
        <div
          style={{
            position: "absolute", left: CX - 420 * flash, top: CY - 40 - 420 * flash, width: 840 * flash, height: 840 * flash, borderRadius: "50%",
            border: `${26 * (1 - flash)}px solid #fff`, opacity: 1 - flash,
          }}
        />
      )}
      <ConfettiBurst frame={f} start={B.pop} x={CX} y={CY - 40} angle={-90} spread={360} power={62} count={64} seed="v3pop" />
      <StarPops frame={f} start={B.pop} cx={CX} cy={CY - 40} radius={300} count={9} seed="v3pop-stars" colors={[C.amarelo, "#fff", C.amareloLight]} size={70} />

      {/* "Qual comércio da cidade / PRECISA estar aqui?" */}
      <div style={{ position: "absolute", top: 640, left: 0, right: 0 }}>
        <PopWords parts={TEXTS3.s1.line1} frame={f} start={B.title1} stagger={3} size={78} color="#fff" shadow={`0 6px 0 ${C.coralDark}`} />
      </div>
      {f >= B.title2 && (
        <div style={{ position: "absolute", top: 738, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <div style={{ position: "relative", transform: `translateX(${trX}px) scale(${precisaIn}) rotate(${-3 + trRot}deg)` }}>
            <Marker width={720} progress={marker} thickness={62} style={{ position: "absolute", left: -12, top: 96 }} />
            <span
              style={{
                position: "relative", fontFamily: FONT, fontWeight: W.black, fontSize: 176, lineHeight: 1.05, color: C.tinta,
                letterSpacing: -4, textShadow: "0 8px 0 rgba(34,28,25,0.18)",
              }}
            >
              {TEXTS3.s1.emphasis}
            </span>
          </div>
        </div>
      )}
      <div style={{ position: "absolute", top: 946, left: 0, right: 0 }}>
        <PopWords parts={TEXTS3.s1.line3} frame={f} start={B.title3} stagger={4} size={112} color="#fff" shadow={`0 8px 0 ${C.coralDark}`} />
      </div>
    </AbsoluteFill>
  );
};
