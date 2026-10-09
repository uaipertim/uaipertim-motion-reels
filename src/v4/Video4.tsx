import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { C } from "../config/theme";
import { SCENES4, TRANSITIONS4 } from "./config/timeline";
import { ColorSwipe } from "../components/Decor";
import { LensZoom, S1Procura } from "./scenes/S1Procura";
import { Stage4 } from "./scenes/Stage";
import { S2Invisivel } from "./scenes/S2Invisivel";
import { S3Acende } from "./scenes/S3Acende";
import { S4Beneficios } from "./scenes/S4Beneficios";
import { S5Simples } from "./scenes/S5Simples";
import { S6Fecho } from "./scenes/S6Fecho";

// Vídeo 4 — "Ele te acha?" · convite ao comerciante (Reels 1080×1920, 30fps, 28s).
// Ordem/tempos das cenas vêm de v4/config/timeline.json. As cenas 2–5 acontecem no mesmo palco
// (Stage4: cidade cinza → onda de cor → Lojinha → estradinha); cada cena desenha por cima os seus textos.

const Swipe: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  return <ColorSwipe frame={frame} duration={duration} />;
};

const OVERLAYS: Array<[keyof typeof SCENES4, React.FC]> = [
  ["s2", S2Invisivel],
  ["s3", S3Acende],
  ["s4", S4Beneficios],
  ["s5", S5Simples],
];

const IRIS = TRANSITIONS4.iris12;
const irisEnd = IRIS.from + IRIS.duration;
const stageTo = SCENES4.s6.from;

export const Video4: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => (
  <AbsoluteFill style={{ background: C.creme }}>
    <Sequence from={0} durationInFrames={irisEnd} name={`Cena 1 · ${SCENES4.s1.name}`}>
      <S1Procura />
    </Sequence>
    <Sequence from={IRIS.from} durationInFrames={stageTo - IRIS.from} name="Palco (cenas 2–5)">
      <Stage4 />
    </Sequence>
    <Sequence from={IRIS.from - 8} durationInFrames={IRIS.duration + 8} name="Lupa → lente (1→2)">
      <LensZoom from={IRIS.from - 8} />
    </Sequence>
    {OVERLAYS.map(([k, Comp]) => (
      <Sequence key={k} from={SCENES4[k].from} durationInFrames={SCENES4[k].duration} name={`Cena ${k.slice(1)} · ${SCENES4[k].name}`}>
        <Comp />
      </Sequence>
    ))}
    <Sequence from={SCENES4.s6.from} durationInFrames={SCENES4.s6.duration} name={`Cena 6 · ${SCENES4.s6.name}`}>
      <S6Fecho />
    </Sequence>
    <Sequence from={TRANSITIONS4.swipe23.from} durationInFrames={TRANSITIONS4.swipe23.duration} name="Swipe coral 2→3">
      <Swipe duration={TRANSITIONS4.swipe23.duration} />
    </Sequence>
    <Sequence from={TRANSITIONS4.swipe56.from} durationInFrames={TRANSITIONS4.swipe56.duration} name="Swipe coral 5→6">
      <Swipe duration={TRANSITIONS4.swipe56.duration} />
    </Sequence>
    {withAudio && <Audio src={staticFile("audio/v4/mix.wav")} />}
  </AbsoluteFill>
);
