import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C } from "../config/theme";
import { TEXTS } from "../config/texts";
import { BEATS } from "../config/timeline";
import { CremeBackground } from "../components/Decor";
import { TiredFace } from "../components/Icons";
import { PopWords } from "../components/Text";
import { DorStage } from "./DorStage";

// CENA 1 · A dor — celular-personagem tremendo, apps transbordando, armazenamento 99%.
const B = BEATS.s1;

export const TitleDor: React.FC<{ t: number; out?: number }> = ({ t, out = 1 }) => {
  const shake = t > B.text ? Math.sin(t * 2.7) * 3 + Math.sin(t * 6.3) * 1.5 : 0;
  return (
    <div style={{ position: "absolute", top: 236, left: 0, right: 0, transform: `translate(${shake}px, 0) rotate(${shake * 0.15}deg)` }}>
      <PopWords parts={TEXTS.s1.title[0]} frame={t} start={B.text} size={104} out={out} />
      <PopWords
        parts={[{ t: TEXTS.s1.title[1], color: C.coral }]}
        frame={t}
        start={B.text + 6}
        size={104}
        out={out}
        after={<TiredFace size={108} style={{ transform: `rotate(${Math.sin(t * 0.9) * 8}deg)` }} />}
      />
    </div>
  );
};

export const Scene1Dor: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <CremeBackground frame={frame} />
      <DorStage t={frame} />
      <TitleDor t={frame} />
    </AbsoluteFill>
  );
};
