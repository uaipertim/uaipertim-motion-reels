import React from "react";
import { Composition } from "remotion";
import "./components/Fonts";
import { TL } from "./config/timeline";
import { TL2 } from "./v2/config/timeline";
import { TL3 } from "./v3/config/timeline";
import { TL4 } from "./v4/config/timeline";
import { CARDS, TLS } from "./story/config/timeline";
import { Video } from "./Video";
import { Video2 } from "./v2/Video2";
import { Video3 } from "./v3/Video3";
import { Video4 } from "./v4/Video4";
import { StoryCard, StoryPreview } from "./story/StoryConheca";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Video1-NaoPrecisaBaixar"
      component={Video}
      durationInFrames={TL.durationInFrames}
      fps={TL.fps}
      width={TL.width}
      height={TL.height}
      defaultProps={{ withAudio: true }}
    />
    <Composition
      id="Video2-VaiFuncionarAssim"
      component={Video2}
      durationInFrames={TL2.durationInFrames}
      fps={TL2.fps}
      width={TL2.width}
      height={TL2.height}
      defaultProps={{ withAudio: true }}
    />
    <Composition
      id="Video3-QualComercioPrecisa"
      component={Video3}
      durationInFrames={TL3.durationInFrames}
      fps={TL3.fps}
      width={TL3.width}
      height={TL3.height}
      defaultProps={{ withAudio: true }}
    />
    <Composition
      id="Video4-EleTeAcha"
      component={Video4}
      durationInFrames={TL4.durationInFrames}
      fps={TL4.fps}
      width={TL4.width}
      height={TL4.height}
      defaultProps={{ withAudio: true }}
    />
    {/* Story "Conheça": 4 cards (1 MP4 cada) + prévia com os 4 em sequência */}
    {(["card1", "card2", "card3", "card4"] as const).map((card, i) => (
      <Composition
        key={card}
        id={`Story-Conheca-Card${i + 1}`}
        component={StoryCard}
        durationInFrames={CARDS[card].duration}
        fps={TLS.fps}
        width={TLS.width}
        height={TLS.height}
        defaultProps={{ card, withAudio: true }}
      />
    ))}
    <Composition
      id="Story-Conheca-Previa"
      component={StoryPreview}
      durationInFrames={TLS.durationInFrames}
      fps={TLS.fps}
      width={TLS.width}
      height={TLS.height}
      defaultProps={{ withAudio: true }}
    />
  </>
);
