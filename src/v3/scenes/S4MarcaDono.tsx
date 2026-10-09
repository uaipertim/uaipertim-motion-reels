import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { C } from "../../config/theme";
import { TEXTS3 } from "../config/texts";
import { BEATS3, SCENES3, abs3 } from "../config/timeline";
import { clamp, lerp, pop, popOut, prog } from "../../lib/anim";
import { PopWords } from "../../components/Text";
import { MegaphoneIcon } from "../../components/AppIcons";
import { BreadIcon } from "../../components/Icons";
import { TagChip } from "../../components/Comments";
import { TapCursor } from "../../components/Guide";
import { Balloons, Counter, FIELD4, ReplyField } from "./CommentLayer";
import { BELL, toScreen } from "./Town";

// CENA 4 · Marca o dono — os balões se organizam, o da padaria ganha destaque; "@" é digitado,
// a etiqueta voa em arco até a lojinha, que recebe a notificação no telhado (TownStage),
// arregala os olhos, acende inteira e ganha o pin coral.
const B = BEATS3.s4;
const A = (local: number) => abs3("s4", local);

// texto digitado no campo: "@" (pausa da trilha) → "@padaria"
const typedAt = (f: number) => {
  if (f < A(B.at) || f >= A(B.tagFly)) return "";
  if (f < A(B.typeStart)) return TEXTS3.s4.at;
  const n = Math.min(TEXTS3.s4.tag.length, Math.floor((f - A(B.typeStart)) / B.typeEvery) + 1);
  return TEXTS3.s4.at + TEXTS3.s4.tag.slice(0, n);
};

const TAG_FROM: [number, number] = [FIELD4.x - FIELD4.w / 2 + 200, FIELD4.y];

const FlyingTag: React.FC<{ f: number }> = ({ f }) => {
  const start = A(B.tagFly);
  const land = A(B.tagLand);
  if (f < start) return null;
  const gone = popOut(f, land, 5);
  if (gone <= 0.001) return null;
  const t = Easing.inOut(Easing.quad)(interpolate(f, [start, land], [0, 1], clamp));
  const [bx, by] = toScreen(land, BELL.x, BELL.y);
  const x = lerp(TAG_FROM[0], bx, t);
  const y = lerp(TAG_FROM[1], by, t) - 140 * Math.sin(Math.PI * t);
  const lift = pop(f, start, { damping: 9, stiffness: 260 });
  const s = (0.8 + 0.2 * lift) * (1 + 0.18 * Math.sin(Math.PI * t) - 0.35 * t) * gone;
  const rot = -8 + 26 * t;
  return (
    <>
      {/* rastro */}
      {[0.08, 0.16, 0.24].map((d, i) => {
        const tt = Math.max(0, t - d);
        if (tt <= 0 || t >= 1) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute", left: lerp(TAG_FROM[0], bx, tt) - 10, top: lerp(TAG_FROM[1], by, tt) - 140 * Math.sin(Math.PI * tt) - 10,
              width: 20 - i * 4, height: 20 - i * 4, borderRadius: "50%", background: C.amarelo, opacity: 0.8 - i * 0.22,
            }}
          />
        );
      })}
      <div style={{ position: "absolute", left: x, top: y, width: "max-content", transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${s})`, zIndex: 20 }}>
        <TagChip text={TEXTS3.s4.at + TEXTS3.s4.tag} size={44} icon={<BreadIcon size={46} />} />
      </div>
    </>
  );
};

export const S4MarcaDono: React.FC = () => {
  const f = useCurrentFrame();
  const abs = f + SCENES3.s4.from;
  const out = popOut(f, B.textOut, 8);
  const publishX = FIELD4.x + FIELD4.w / 2 - 100;
  return (
    <AbsoluteFill>
      <Balloons f={abs} />
      <ReplyField f={abs} typed={typedAt(abs)} publishOn={prog(abs, A(B.at), 6) * (abs < A(B.tagFly) ? 1 : 0)} />
      <TapCursor
        frame={abs}
        appear={A(B.cursorIn)}
        hide={A(B.tagFly) + 5}
        keys={[
          { f: A(B.cursorIn), x: 820, y: 1000 },
          { f: A(B.tapField) - 2, x: 640, y: FIELD4.y + 14 },
          { f: A(B.typeStart) + 4, x: 660, y: FIELD4.y + 40 },
          { f: A(B.tapPublish) - 3, x: publishX, y: FIELD4.y + 14 },
        ]}
        taps={[A(B.tapField), A(B.tapPublish)]}
        size={78}
      />
      <FlyingTag f={abs} />
      <div style={{ position: "absolute", top: 300, left: 0, right: 0 }}>
        <PopWords parts={TEXTS3.s4.line1} frame={f} start={B.text1} stagger={3} size={84} out={out} />
      </div>
      <div style={{ position: "absolute", top: 392, left: 0, right: 0 }}>
        <PopWords
          parts={[{ t: TEXTS3.s4.line2, color: C.coral }]} frame={f} start={B.text2} stagger={3} size={84} out={out}
          after={<MegaphoneIcon size={100} style={{ transform: `translateY(2px) rotate(${-8 + Math.sin(f * 0.3) * 6}deg)` }} />}
        />
      </div>
      <Counter f={abs} />
    </AbsoluteFill>
  );
};
