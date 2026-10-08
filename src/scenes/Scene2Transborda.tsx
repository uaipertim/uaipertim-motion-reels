import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, FONT, W } from "../config/theme";
import { TEXTS } from "../config/texts";
import { BEATS, SCENES } from "../config/timeline";
import { clamp, jitter, pop, popOut, squash } from "../lib/anim";
import { CremeBackground } from "../components/Decor";
import { Stamp } from "../components/Ui";
import { PopWords } from "../components/Text";
import { Mood } from "../components/Phone";
import { DorStage, PHONE } from "./DorStage";
import { TitleDor } from "./Scene1Dor";

// CENA 2 · Transborda — app novo tenta entrar, quica e é cuspido; carimbo "ARMAZENAMENTO CHEIO!".
const B = BEATS.s2;
const OFF = SCENES.s2.from - SCENES.s1.from;

const NewAppIcon: React.FC<{ size: number }> = ({ size }) => (
  <div style={{ position: "relative", width: size, height: size }}>
    <div
      style={{
        position: "absolute", inset: 0, borderRadius: size * 0.26, background: `linear-gradient(160deg, ${C.verdeLight}, ${C.verde})`,
        boxShadow: `inset 0 ${-size * 0.08}px 0 rgba(0,0,0,0.18), 0 ${size * 0.08}px ${size * 0.16}px rgba(34,28,25,0.25)`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 100 100">
        <path d="M50 12 V60 M28 40 L50 62 L72 40" stroke="#fff" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M16 66 V80 Q16 86 22 86 H78 Q84 86 84 80 V66" stroke="#fff" strokeWidth="11" strokeLinecap="round" fill="none" />
      </svg>
    </div>
    <div
      style={{
        position: "absolute", right: -size * 0.28, top: -size * 0.2, padding: `${size * 0.04}px ${size * 0.12}px`, borderRadius: 999,
        background: C.coral, color: "#fff", fontFamily: FONT, fontWeight: W.black, fontSize: size * 0.2, transform: "rotate(12deg)",
        boxShadow: `0 4px 0 ${C.coralDark}`,
      }}
    >
      {TEXTS.s2.newAppBadge}
    </div>
  </div>
);

export const Scene2Transborda: React.FC = () => {
  const f = useCurrentFrame();
  const t = f + OFF;

  // trajetória do app novo
  const size = 150;
  const hitY = PHONE.top - 130;
  let ax = 540;
  let ay = -300;
  let rot = 0;
  let isx = 1;
  let isy = 1;
  if (f >= B.newAppIn && f < B.hit) {
    const p = (f - B.newAppIn) / (B.hit - B.newAppIn);
    ay = -300 + (hitY + 300) * p * p;
    rot = Math.sin(f * 0.8) * 8;
  } else if (f >= B.hit && f < B.spit) {
    const p = (f - B.hit) / (B.spit - B.hit);
    ay = hitY - 50 * Math.sin(p * Math.PI);
    [isx, isy] = squash(f, B.hit, 0.35);
  } else if (f >= B.spit) {
    const tt = f - B.spit;
    ax = 540 + 48 * tt;
    ay = hitY - 36 * tt + 2.1 * tt * tt;
    rot = tt * 34;
  }
  const appVisible = f >= B.newAppIn && ax < 1400;

  const mood: Mood = f < B.hit - 3 ? "worried" : f < B.spit ? "strained" : f < B.spit + 10 ? "spit" : "strained";
  const look: [number, number] = f < B.hit ? [0, -1] : f < B.spit + 14 ? [1, -0.7] : [0.3, 0.4];

  // impacto do carimbo: shake de câmera (4 frames) + flash
  const ts = f - B.stamp;
  const camAmp = ts >= 0 && ts < 5 ? 26 * (1 - ts / 5) : 0;
  const camX = jitter(f, "camx", camAmp);
  const camY = jitter(f, "camy", camAmp);
  const flash = ts >= 0 ? interpolate(ts, [0, 1, 5], [0, 0.8, 0], clamp) : 0;
  // carimbo desce acelerando (4 frames) e bate em B.stamp, com quique curto
  const tSlam = f - (B.stamp - 4);
  const stampS = tSlam < 0 ? 0 : tSlam < 4 ? 2.8 - 1.8 * Math.pow(tSlam / 4, 2) : 1 + 0.1 * Math.sin((tSlam - 4) * 1.1) * Math.exp(-(tSlam - 4) * 0.35);

  // "puff" do cuspe
  const tp = f - B.spit;

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `translate(${camX}px, ${camY}px)` }}>
        <CremeBackground frame={t} />
        <DorStage t={t} mood={mood} hitAt={B.hit + OFF} look={look} shakeBoost={ts >= 0 ? 1.5 : 0} />
        {tp >= 0 && tp < 14 &&
          [0, 1, 2, 3].map((i) => {
            const p = tp / 14;
            return (
              <div
                key={i}
                style={{
                  position: "absolute", left: 560 + i * 40 + p * 90, top: PHONE.top - 40 - i * 26 - p * 60, width: 50 - i * 6, height: 50 - i * 6,
                  borderRadius: "50%", background: "#fff", border: `5px solid ${C.cremeDeep}`, transform: `scale(${pop(tp, i)} )`, opacity: 1 - p,
                }}
              />
            );
          })}
        {appVisible && (
          <div style={{ position: "absolute", left: ax - size / 2, top: ay - size / 2, transform: `rotate(${rot}deg) scale(${isx}, ${isy})` }}>
            <NewAppIcon size={size} />
          </div>
        )}
        {/* título antigo sai, entra "Não cabe mais nada!" */}
        <TitleDor t={t} out={popOut(f, B.text - 10, 8)} />
        <div style={{ position: "absolute", top: 236, left: 0, right: 0, transform: `translate(${Math.sin(f * 2.5) * 2.5}px, 0)` }}>
          <PopWords parts={TEXTS.s2.title[0]} frame={f} start={B.text} size={112} />
          <PopWords parts={[{ t: TEXTS.s2.title[1], color: C.coral }]} frame={f} start={B.text + 5} size={112} />
        </div>
        {tSlam >= 0 && (
          <div
            style={{
              position: "absolute", left: 0, right: 0, top: 820, display: "flex", justifyContent: "center",
              transform: `rotate(-11deg) scale(${stampS})`, opacity: Math.min(1, tSlam / 2 + 0.25),
            }}
          >
            <Stamp lines={TEXTS.s2.stamp} fontSize={70} />
          </div>
        )}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#fff", opacity: flash }} />
    </AbsoluteFill>
  );
};
