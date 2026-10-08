import React from "react";
import { Composition } from "remotion";
import "./components/Fonts";
import { TL } from "./config/timeline";
import { Video } from "./Video";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Video1-NaoPrecisaBaixar"
    component={Video}
    durationInFrames={TL.durationInFrames}
    fps={TL.fps}
    width={TL.width}
    height={TL.height}
    defaultProps={{ withAudio: true }}
  />
);
