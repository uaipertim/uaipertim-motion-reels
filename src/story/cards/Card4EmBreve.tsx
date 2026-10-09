import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { C } from "../../config/theme";
import { STORY_TEXTS } from "../config/texts";
import { BEATS_S } from "../config/timeline";
import { clamp, pop } from "../../lib/anim";
import { CoralBackground } from "../../components/Decor";
import { ConfettiBurst, StarPops } from "../../components/Particles";
import { Ribbon, SwingBell } from "../../components/Ui";
import { PopWords } from "../../components/Text";
import { BellGlyph } from "../../components/Icons";

// CARD 4 · "Em breve" + CTA — faixa CHEGANDO EM BREVE (LAUNCH_TEXT, editável em config/texts.ts),
// sininho balançando com ondinhas, confete leve, "Segue o @uaipertim e ativa o 🔔" → "Tudo pertim de você.".
// STICKER_AREA fica vazia de propósito: espaço para a figurinha de link/menção do Instagram.
const B = BEATS_S.card4;
const T = STORY_TEXTS.card4;
export const STICKER_AREA = { left: 240, top: 1350, width: 600, height: 180 }; // terço inferior, acima da safe area (1580)

export const Card4EmBreve: React.FC = () => {
  const f = useCurrentFrame();
  const ribbonP = interpolate(f, [B.ribbon, B.ribbon + B.ribbonDur], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
  const bellIn = pop(f, B.bell, { damping: 8, stiffness: 180 });
  const glow = 0.75 + 0.25 * Math.sin(f * 0.18);
  return (
    <AbsoluteFill>
      <CoralBackground frame={f} />
      {B.confetti.map((c, i) => (
        <React.Fragment key={c}>
          <ConfettiBurst frame={f} start={c} x={-20} y={420 + i * 40} angle={-48} spread={36} power={46} count={26} seed={`st4cL${i}`} />
          <ConfettiBurst frame={f} start={c} x={1100} y={420 + i * 40} angle={-132} spread={36} power={46} count={26} seed={`st4cR${i}`} />
        </React.Fragment>
      ))}

      {/* faixa (texto temporário: LAUNCH_TEXT) */}
      {f >= B.ribbon && (
        <div style={{ position: "absolute", top: 296, left: 540 - 410 }}>
          <Ribbon
            text={T.ribbon} width={820} height={112} progress={ribbonP} fontSize={60}
            color={C.amarelo} foldColor={C.amareloDark} rollColor={C.amareloLight} textColor={C.tinta}
          />
        </div>
      )}

      {/* sininho com ondinhas */}
      <div
        style={{
          position: "absolute", left: 540 - 200, top: 705 - 200, width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 66%)", transform: `scale(${bellIn * glow})`,
        }}
      />
      <div style={{ position: "absolute", left: 540 - 125, top: 705 - 125, transform: `scale(${bellIn})` }}>
        <SwingBell size={250} frame={f} rings={B.bellRings} waveColor="#fff" />
      </div>
      <StarPops frame={f} start={B.sting} cx={540} cy={705} radius={210} count={9} seed="st4sting" colors={["#fff", C.amarelo, C.amareloLight]} size={50} />

      {/* "Segue o @uaipertim e ativa o 🔔" → "Tudo pertim de você." */}
      <div style={{ position: "absolute", top: 880, left: 0, right: 0 }}>
        <PopWords
          parts={[{ t: T.cta[0] }, { t: T.cta[1], color: C.amarelo }]} frame={f} start={B.cta1} stagger={3} size={84} color="#fff"
          shadow={`0 6px 0 ${C.coralDark}`}
        />
      </div>
      <div style={{ position: "absolute", top: 982, left: 0, right: 0 }}>
        <PopWords
          parts={T.cta[2]} frame={f} start={B.cta2} stagger={3} size={84} color="#fff" shadow={`0 6px 0 ${C.coralDark}`}
          after={<BellGlyph size={92} swing={Math.sin(f * 0.3) * 12} />}
        />
      </div>
      <div style={{ position: "absolute", top: 1128, left: 0, right: 0 }}>
        <PopWords
          parts={[{ t: T.slogan[0] }, { t: T.slogan[1], color: C.amarelo }, { t: T.slogan[2] }]} frame={f} start={B.slogan} stagger={3} size={70}
          weight={800} color="#fff" shadow={`0 5px 0 ${C.coralDark}`}
        />
      </div>
    </AbsoluteFill>
  );
};
