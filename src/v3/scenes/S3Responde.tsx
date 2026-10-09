import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C } from "../../config/theme";
import { TEXTS3 } from "../config/texts";
import { BEATS3, SCENES3 } from "../config/timeline";
import { popOut } from "../../lib/anim";
import { PopWords } from "../../components/Text";
import { ChatIcon } from "../../components/AppIcons";
import { Balloons, BottomField, Counter, Minis } from "./CommentLayer";

// CENA 3 · A cidade responde — balões de comentário pipocam de várias direções (ritmo acelerando),
// cada um acende a lojinha certa (TownStage), o contador 💬 sobe rápido.
const B = BEATS3.s3;

export const S3Responde: React.FC = () => {
  const f = useCurrentFrame();
  const abs = f + SCENES3.s3.from;
  const out = popOut(f, B.textOut, 8);
  return (
    <AbsoluteFill>
      <BottomField f={abs} />
      <Minis f={abs} />
      <Balloons f={abs} />
      <div style={{ position: "absolute", top: 300, left: 0, right: 0 }}>
        <PopWords parts={TEXTS3.s3.line1} frame={f} start={B.text1} stagger={3} size={80} out={out} />
      </div>
      <div style={{ position: "absolute", top: 392, left: 0, right: 0 }}>
        <PopWords
          parts={[{ t: TEXTS3.s3.line2, color: C.coral }]} frame={f} start={B.text2} stagger={3} size={80} out={out}
          after={<ChatIcon size={90} style={{ transform: `translateY(4px) rotate(${Math.sin(f * 0.2) * 8}deg)` }} />}
        />
      </div>
      <Counter f={abs} />
    </AbsoluteFill>
  );
};
