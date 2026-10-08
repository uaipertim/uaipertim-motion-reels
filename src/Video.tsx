import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { C } from "./config/theme";
import { SCENES, TRANSITIONS } from "./config/timeline";
import { ColorSwipe } from "./components/Decor";
import { Scene1Dor } from "./scenes/Scene1Dor";
import { Scene2Transborda } from "./scenes/Scene2Transborda";
import { Scene3Virada } from "./scenes/Scene3Virada";
import { Scene4Link } from "./scenes/Scene4Link";
import { Scene5Cidade } from "./scenes/Scene5Cidade";
import { Scene6Fecho } from "./scenes/Scene6Fecho";

// Vídeo 1 — "Não precisa baixar nada" (Reels 1080×1920, 30fps, 26s).
// Ordem/tempos das cenas vêm de config/timeline.json.

const Swipe: React.FC<{ duration: number; main?: string; edge?: string; reverse?: boolean }> = (p) => {
  const frame = useCurrentFrame();
  return <ColorSwipe frame={frame} {...p} />;
};

const SCENE_COMPONENTS: Record<keyof typeof SCENES, React.FC> = {
  s1: Scene1Dor,
  s2: Scene2Transborda,
  s3: Scene3Virada,
  s4: Scene4Link,
  s5: Scene5Cidade,
  s6: Scene6Fecho,
};

export const Video: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => (
  <AbsoluteFill style={{ background: C.creme }}>
    {(Object.keys(SCENES) as Array<keyof typeof SCENES>).map((k) => {
      const Comp = SCENE_COMPONENTS[k];
      return (
        <Sequence key={k} from={SCENES[k].from} durationInFrames={SCENES[k].duration} name={`Cena ${k.slice(1)} · ${SCENES[k].name}`}>
          <Comp />
        </Sequence>
      );
    })}
    <Sequence from={TRANSITIONS.swipe23.from} durationInFrames={TRANSITIONS.swipe23.duration} name="Swipe coral 2→3">
      <Swipe duration={TRANSITIONS.swipe23.duration} />
    </Sequence>
    <Sequence from={TRANSITIONS.swipe56.from} durationInFrames={TRANSITIONS.swipe56.duration} name="Swipe amarelo 5→6">
      <Swipe duration={TRANSITIONS.swipe56.duration} main={C.amarelo} edge={C.coral} reverse />
    </Sequence>
    {withAudio && <Audio src={staticFile("audio/mix.wav")} />}
  </AbsoluteFill>
);
