import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { C } from "../../config/theme";
import { STORY_TEXTS } from "../config/texts";
import { BEATS_S } from "../config/timeline";
import { clamp, float, lerp, pop, wiggle } from "../../lib/anim";
import { CoralBackground } from "../../components/Decor";
import { Phone, PhoneFace } from "../../components/Phone";
import type { Mood } from "../../components/Phone";
import { StarPops } from "../../components/Particles";
import { BrowserBar } from "../../components/Ui";
import { PopWords } from "../../components/Text";
import { LinkIcon } from "../../components/Icons";
import { DownloadIcon } from "../../components/AppIcons";

// CARD 2 · "Não é app" — o celular-personagem aparece; um ícone de "download" tenta entrar, quica e é
// riscado com um X amarelo; a barra do navegador digita uaipertim.com.br e a tela acende.
const B = BEATS_S.card2;
const T = STORY_TEXTS.card2;
const PHONE = { x: 540, top: 690, w: 400, h: 720 };
const DL_FROM: [number, number] = [1180, 260];
const DL_HIT: [number, number] = [PHONE.x + 40, 900];
const DL_REST: [number, number] = [868, 800];

export const Card2NaoEApp: React.FC = () => {
  const f = useCurrentFrame();
  const phoneIn = pop(f, B.phone, { damping: 10, stiffness: 150 });
  const lit = interpolate(f, [B.light, B.light + 6], [0, 1], clamp);

  // ícone de download: voa até o celular, quica pra fora e é riscado
  let dx = DL_FROM[0];
  let dy = DL_FROM[1];
  let drot = 0;
  if (f >= B.download) {
    if (f < B.bounce) {
      const p = Easing.in(Easing.quad)((f - B.download) / (B.bounce - B.download));
      dx = lerp(DL_FROM[0], DL_HIT[0], p);
      dy = lerp(DL_FROM[1], DL_HIT[1], p);
      drot = -20 * p;
    } else {
      const p = Easing.out(Easing.back(1.6))(Math.min(1, (f - B.bounce) / 10));
      dx = lerp(DL_HIT[0], DL_REST[0], p);
      dy = lerp(DL_HIT[1], DL_REST[1], p) - 120 * Math.sin(Math.PI * Math.min(1, (f - B.bounce) / 10));
      drot = lerp(-20, 14, p) + wiggle(f, B.bounce + 10, 6, 0.5, 0.12);
    }
  }
  const dlScale = f < B.download ? 0 : pop(f, B.download, { damping: 10, stiffness: 200 });
  const crossP = (k: number) => interpolate(f, [B.cross + k * (B.crossDur / 2), B.cross + (k + 1) * (B.crossDur / 2)], [0, 1], clamp);
  const dlDim = f >= B.cross + B.crossDur ? 0.55 : 1;

  // carinha do celular
  let mood: Mood = "worried";
  let look: [number, number] = f < B.bounce ? [0.8, -0.8] : [0.7, -0.3];
  if (f >= B.bounce && f < B.bounce + 10) mood = "spit";
  if (f >= B.bar) look = [0, 0.8];
  if (f >= B.light) {
    mood = "happy";
    look = [0, 0];
  }
  const squashY = f >= B.bounce && f < B.bounce + 12 ? 1 - 0.06 * Math.sin(((f - B.bounce) / 12) * Math.PI) : 1;

  const typed = f < B.typeStart ? 0 : Math.min(T.url.length, Math.floor((f - B.typeStart) / B.typeEvery) + 1);
  const barIn = pop(f, B.bar);

  return (
    <AbsoluteFill>
      <CoralBackground frame={f} />

      {/* textos */}
      <div style={{ position: "absolute", top: 270, left: 0, right: 0 }}>
        <PopWords parts={T.text1[0]} frame={f} start={B.text1} stagger={3} size={96} color="#fff" shadow={`0 7px 0 ${C.coralDark}`} />
      </div>
      <div style={{ position: "absolute", top: 374, left: 0, right: 0 }}>
        <PopWords parts={T.text1[1]} frame={f} start={B.text1 + 6} stagger={3} size={96} color="#fff" shadow={`0 7px 0 ${C.coralDark}`} />
      </div>
      <div style={{ position: "absolute", top: 500, left: 0, right: 0 }}>
        <PopWords parts={T.text2[0]} frame={f} start={B.text2} stagger={2} size={60} weight={800} color={C.amareloLight} />
      </div>
      <div style={{ position: "absolute", top: 572, left: 0, right: 0 }}>
        <PopWords
          parts={T.text2[1]} frame={f} start={B.text2 + 6} stagger={2} size={60} weight={800} color={C.amareloLight}
          after={<LinkIcon size={66} color={C.amarelo} style={{ transform: `rotate(${Math.sin(f * 0.15) * 8}deg)` }} />}
        />
      </div>

      {/* celular-personagem */}
      <div
        style={{
          position: "absolute", left: PHONE.x - PHONE.w / 2, top: PHONE.top, width: PHONE.w, height: PHONE.h,
          transform: `translateY(${(1 - phoneIn) * 700 + float(f, 60, 5)}px) scale(1, ${squashY})`, transformOrigin: "50% 100%",
          filter: lit > 0 ? `drop-shadow(0 0 ${40 * lit}px rgba(255,210,122,${0.9 * lit}))` : undefined,
        }}
      >
        <Phone width={PHONE.w} height={PHONE.h} screenBg={lit > 0.5 ? C.papel : "#E6D8CA"}>
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 40%, rgba(255,233,168,${0.6 * lit}), rgba(255,233,168,0) 70%)` }} />
          <PhoneFace width={290} mood={mood} look={look} blink={(f + 10) % 66 < 4 ? 0.9 : 0} style={{ position: "absolute", left: (PHONE.w - 34 - 290) / 2, top: 110 }} />
        </Phone>
      </div>
      <StarPops frame={f} start={B.light} cx={PHONE.x} cy={PHONE.top + 300} radius={300} count={10} seed="st2light" size={58} />

      {/* download que tenta entrar → X amarelo */}
      {f >= B.download && (
        <div style={{ position: "absolute", left: dx - 85, top: dy - 85, width: 170, height: 170, transform: `rotate(${drot}deg) scale(${dlScale})`, opacity: dlDim }}>
          <DownloadIcon size={170} />
        </div>
      )}
      {f >= B.cross && (
        <svg width={260} height={260} viewBox="0 0 100 100" style={{ position: "absolute", left: DL_REST[0] - 130, top: DL_REST[1] - 130, overflow: "visible" }}>
          {[["M14 14 L86 86", crossP(0)], ["M86 14 L14 86", crossP(1)]].map(([d, p], i) => (
            <g key={i}>
              <path d={d as string} stroke={C.coralDark} strokeWidth="20" strokeLinecap="round" strokeDasharray={102} strokeDashoffset={102 * (1 - (p as number))} transform="translate(0 4)" />
              <path d={d as string} stroke={C.amarelo} strokeWidth="18" strokeLinecap="round" strokeDasharray={102} strokeDashoffset={102 * (1 - (p as number))} />
            </g>
          ))}
        </svg>
      )}

      {/* barra do navegador digitando uaipertim.com.br */}
      {f >= B.bar && (
        <div style={{ position: "absolute", left: 540 - 430, top: 1250, transform: `scale(${barIn})`, transformOrigin: "50% 50%" }}>
          <BrowserBar width={860} url={T.url} typed={typed} frame={f} tapFrame={B.tap} />
        </div>
      )}
    </AbsoluteFill>
  );
};
