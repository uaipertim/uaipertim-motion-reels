import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { C } from "../config/theme";
import { SCENES2, TRANSITIONS2 } from "./config/timeline";
import { ColorSwipe } from "../components/Decor";
import { S1Abertura } from "./scenes/S1Abertura";
import { S2Cidade } from "./scenes/S2Cidade";
import { S3Categoria } from "./scenes/S3Categoria";
import { S4Aberto } from "./scenes/S4Aberto";
import { S5TempoReal } from "./scenes/S5TempoReal";
import { S6Fecho } from "./scenes/S6Fecho";

// Vídeo 2 — "Vai funcionar assim, ó" (Reels 1080×1920, 30fps, 28s).
// Ordem/tempos das cenas vêm de v2/config/timeline.json.

const Swipe: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  return <ColorSwipe frame={frame} duration={duration} />;
};

const SCENE_COMPONENTS: Record<keyof typeof SCENES2, React.FC> = {
  s1: S1Abertura,
  s2: S2Cidade,
  s3: S3Categoria,
  s4: S4Aberto,
  s5: S5TempoReal,
  s6: S6Fecho,
};

export const Video2: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => (
  <AbsoluteFill style={{ background: C.creme }}>
    {(Object.keys(SCENES2) as Array<keyof typeof SCENES2>).map((k) => {
      const Comp = SCENE_COMPONENTS[k];
      return (
        <Sequence key={k} from={SCENES2[k].from} durationInFrames={SCENES2[k].duration} name={`Cena ${k.slice(1)} · ${SCENES2[k].name}`}>
          <Comp />
        </Sequence>
      );
    })}
    <Sequence from={TRANSITIONS2.swipe56.from} durationInFrames={TRANSITIONS2.swipe56.duration} name="Swipe coral 5→6">
      <Swipe duration={TRANSITIONS2.swipe56.duration} />
    </Sequence>
    {withAudio && <Audio src={staticFile("audio/v2/mix.wav")} />}
  </AbsoluteFill>
);
