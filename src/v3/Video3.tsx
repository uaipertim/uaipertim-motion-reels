import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { C } from "../config/theme";
import { SCENES3, TRANSITIONS3 } from "./config/timeline";
import { ColorSwipe } from "../components/Decor";
import { S1Pergunta } from "./scenes/S1Pergunta";
import { TownStage } from "./scenes/Town";
import { S2Esperam } from "./scenes/S2Esperam";
import { S3Responde } from "./scenes/S3Responde";
import { S4MarcaDono } from "./scenes/S4MarcaDono";
import { S5Fecho } from "./scenes/S5Fecho";

// Vídeo 3 — "Qual comércio PRECISA estar aqui?" (Reels 1080×1920, 30fps, 25s).
// Ordem/tempos das cenas vêm de v3/config/timeline.json. As cenas 2–5 acontecem na mesma
// cidadezinha (TownStage, sem corte); cada cena desenha por cima os seus textos e interações.

const Swipe: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  return <ColorSwipe frame={frame} duration={duration} main={C.creme} edge={C.amarelo} />;
};

const OVERLAYS: Record<Exclude<keyof typeof SCENES3, "s1">, React.FC> = {
  s2: S2Esperam,
  s3: S3Responde,
  s4: S4MarcaDono,
  s5: S5Fecho,
};

const townFrom = SCENES3.s2.from;
const townTo = SCENES3.s5.from + SCENES3.s5.duration;

export const Video3: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => (
  <AbsoluteFill style={{ background: C.creme }}>
    <Sequence from={SCENES3.s1.from} durationInFrames={SCENES3.s1.duration} name={`Cena 1 · ${SCENES3.s1.name}`}>
      <S1Pergunta />
    </Sequence>
    <Sequence from={townFrom} durationInFrames={townTo - townFrom} name="Cidadezinha (cenas 2–5)">
      <TownStage />
    </Sequence>
    {(Object.keys(OVERLAYS) as Array<keyof typeof OVERLAYS>).map((k) => {
      const Comp = OVERLAYS[k];
      return (
        <Sequence key={k} from={SCENES3[k].from} durationInFrames={SCENES3[k].duration} name={`Cena ${k.slice(1)} · ${SCENES3[k].name}`}>
          <Comp />
        </Sequence>
      );
    })}
    <Sequence from={TRANSITIONS3.swipe12.from} durationInFrames={TRANSITIONS3.swipe12.duration} name="Swipe creme 1→2">
      <Swipe duration={TRANSITIONS3.swipe12.duration} />
    </Sequence>
    {withAudio && <Audio src={staticFile("audio/v3/mix.wav")} />}
  </AbsoluteFill>
);
