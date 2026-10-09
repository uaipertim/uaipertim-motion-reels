import React from "react";
import { Composition } from "remotion";
import "./components/Fonts";
import { TL } from "./config/timeline";
import { TL2 } from "./v2/config/timeline";
import { TL3 } from "./v3/config/timeline";
import { Video } from "./Video";
import { Video2 } from "./v2/Video2";
import { Video3 } from "./v3/Video3";

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
  </>
);
