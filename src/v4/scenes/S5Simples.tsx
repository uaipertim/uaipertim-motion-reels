import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { TEXTS4 } from "../config/texts";
import { BEATS4 } from "../config/timeline";
import { bouncy, clamp, pop, prog } from "../../lib/anim";
import { ConfettiBurst, StarPops } from "../../components/Particles";
import { Seal, TrailSign } from "../../components/Invite";
import { ChatIcon, NoteIcon, RocketIcon, WinkFace } from "../../components/AppIcons";
import { ROAD_POINTS, SIGNS } from "./layout";

// CENA 5 · É simples entrar — (a estradinha e a Lojinha pulando estão no Stage4)
// selo "Não precisa entender de tecnologia 😉" + 3 placas que acendem quando a Lojinha chega + foguetinho.
const B = BEATS4.s5;
const SIGN_W = 600;

const ICONS: Record<string, React.ReactNode> = {
  direct: <ChatIcon size={78} />,
  cadastro: <NoteIcon size={80} />,
  foguete: <RocketIcon size={80} />,
};

export const S5Simples: React.FC = () => {
  const f = useCurrentFrame();
  const sealS = bouncy(f, B.selo);
  const end = ROAD_POINTS[ROAD_POINTS.length - 1];
  const rp = interpolate(f, [B.rocket, B.rocket + 18], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  return (
    <AbsoluteFill>
      {/* placas da trilha */}
      {TEXTS4.s5.steps.map((st, i) => {
        if (f < B.signs[i]) return null;
        const s = pop(f, B.signs[i], { damping: 9, stiffness: 200 });
        const lit = prog(f, B.steps[i], 6, (x) => x);
        const { x, y } = SIGNS[i];
        return (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", left: x - SIGN_W / 2, top: y - 62, transform: `scale(${s}) rotate(${i % 2 ? 2 : -2}deg)`, transformOrigin: "50% 100%" }}>
              <TrailSign n={i + 1} icon={ICONS[st.icon]} text={st.text} width={SIGN_W} lit={lit} fontSize={42} />
            </div>
            <StarPops frame={f} start={B.steps[i]} cx={x} cy={y} radius={250} count={7} seed={`v4sign${i}`} size={46} />
          </React.Fragment>
        );
      })}

      {/* foguetinho no fim da trilha */}
      {f >= B.signs[2] && (
        <div
          style={{
            position: "absolute", left: end[0] - 75 + rp * 320, top: end[1] - 120 - rp * 700,
            transform: `scale(${pop(f, B.signs[2] + 4)}) rotate(${Math.sin(f * 0.6) * (f >= B.rocket ? 4 : 1)}deg)`,
          }}
        >
          <RocketIcon size={150} flame={f >= B.rocket ? 1 + 0.4 * Math.sin(f * 1.3) : 0} />
        </div>
      )}
      {[0, 4, 8].map((d) => {
        const t = f - B.rocket - d;
        if (t < 0 || t > 20 || rp >= 1) return null;
        const p0 = Math.min(1, (d + Math.max(0, t)) / 18);
        return (
          <div
            key={d}
            style={{
              position: "absolute", left: end[0] - 30 + p0 * 300 - 20, top: end[1] - 20 - p0 * 650 + 60, width: 50 + t * 2, height: 50 + t * 2,
              borderRadius: "50%", background: "#fff", opacity: 0.8 * (1 - t / 20),
            }}
          />
        );
      })}
      <ConfettiBurst frame={f} start={B.rocket + 8} x={end[0] - 60} y={end[1]} angle={-110} spread={80} power={52} count={46} seed="v4rocket" />

      {/* selo */}
      <div style={{ position: "absolute", top: 236, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `scale(${sealS}) rotate(-2deg)` }}>
        <Seal lines={TEXTS4.s5.seal} fontSize={52} icon={<WinkFace size={96} style={{ transform: `rotate(${Math.sin(f * 0.2) * 8}deg)` }} />} />
      </div>
    </AbsoluteFill>
  );
};
