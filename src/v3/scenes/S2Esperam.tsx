import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { TEXTS3 } from "../config/texts";
import { BEATS3, SCENES3 } from "../config/timeline";
import { popOut } from "../../lib/anim";
import { PopWords } from "../../components/Text";
import { EyesIcon } from "../../components/AppIcons";
import { BottomField } from "./CommentLayer";

// CENA 2 · As lojinhas esperam — (a cidadezinha e as lojinhas ansiosas estão no TownStage)
// texto "Elas tão esperando você… 👀" + campo "Adicione um comentário…" com cursor piscando.
const B = BEATS3.s2;

export const S2Esperam: React.FC = () => {
  const f = useCurrentFrame();
  const abs = f + SCENES3.s2.from;
  const out = popOut(f, B.textOut, 8);
  const look = Math.tanh(3 * Math.sin(f * 0.14));
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 262, left: 0, right: 0 }}>
        <PopWords parts={TEXTS3.s2.line1} frame={f} start={B.text1} stagger={3} size={86} out={out} />
      </div>
      <div style={{ position: "absolute", top: 362, left: 0, right: 0 }}>
        <PopWords
          parts={TEXTS3.s2.line2} frame={f} start={B.text2} stagger={3} size={86} out={out}
          after={<EyesIcon size={104} look={look} style={{ transform: `translateY(4px) rotate(${look * 4}deg)` }} />}
        />
      </div>
      <BottomField f={abs} />
    </AbsoluteFill>
  );
};
