import React from "react";
import { Easing, interpolate, random } from "remotion";
import { C } from "../config/theme";
import { TEXTS } from "../config/texts";
import { BEATS } from "../config/timeline";
import { clamp, float, pop, squash } from "../lib/anim";
import { AppIcon } from "../components/Icons";
import { Phone, PhoneFace, Mood } from "../components/Phone";
import { StorageCard } from "../components/Ui";
import { SweatDrops } from "../components/Particles";

// Palco compartilhado das cenas 1 e 2: celular-personagem abarrotado de apps.
// `t` = frames desde o início da cena 1 (a cena 2 passa t = 90 + frame local).

const B = BEATS.s1;
export const PHONE = { w: 420, h: 840, x: 540, top: 540 };
const ICON = 76;
const GAP = 18;
const COLS = 4;
const ROWS = 6;
const APP_COLORS = [C.coral, C.amarelo, C.verde, C.tinta, C.coralBg, C.amareloDark, C.verdeDark, C.coralLight, "#8C5A3C", C.verdeLight];

// ordem embaralhada (determinística) para os ícones "pipocarem"
const ORDER = Array.from({ length: COLS * ROWS }, (_, i) => i).sort((a, b) => random(`ord-${a}`) - random(`ord-${b}`));

// ícones que transbordam: empilhados no topo + pulando pra fora
const STACK = [
  { at: 30, dx: -110, rot: -14 },
  { at: 35, dx: 100, rot: 12 },
  { at: 39, dx: -5, rot: -4 },
];
const JUMPERS = B.overflow.map((at, i) => ({ at, side: i % 2 === 0 ? -1 : 1, dist: 420, glyph: 3 + i * 2, pile: Math.floor(i / 2) }));

export const DorStage: React.FC<{
  t: number;
  mood?: Mood;
  hitAt?: number; // impacto extra (cena 2) em frames de t
  look?: [number, number];
  shakeBoost?: number;
}> = ({ t, mood = "worried", hitAt, look, shakeBoost = 0 }) => {
  // queda + squash no chão
  const fallP = Math.min(1, Math.max(0, t / B.land));
  // começa já visível no frame 0 (capa do Reels não fica vazia)
  const dropY = -820 * (1 - fallP * fallP);
  let [sx, sy] = squash(t, B.land, 0.26);
  if (hitAt !== undefined) {
    const [hx, hy] = squash(t, hitAt, 0.18);
    sx *= hx;
    sy *= hy;
  }
  // barra de armazenamento
  const percent = interpolate(t, [B.storageStart + 4, B.storageFull], [6, TEXTS.s1.storagePercent], {
    ...clamp, easing: Easing.out(Easing.cubic),
  });
  const stress = Math.min(1, Math.max(0, (t - B.land) / (B.storageFull - B.land)));
  const alarm = t >= B.alarm;
  const amp = t < B.land ? 0 : 1.2 + 2.6 * stress + (alarm ? 1 : 0) + shakeBoost;
  const shakeX = Math.sin(t * 2.3) * amp * 2.2 + Math.sin(t * 5.1) * amp;
  const shakeR = Math.sin(t * 1.9 + 1) * amp * 0.45;

  // piscadas
  const blinkAt = [34, 74, 118, 160];
  const blink = blinkAt.reduce((b, f) => (t >= f && t < f + 5 ? Math.sin(((t - f) / 5) * Math.PI) : b), 0);
  const eyes: [number, number] = look ?? (t < 40 ? [0, 0.7] : alarm ? [0.6, 0.9] : [-0.4, 0.2]);

  const screenW = PHONE.w - PHONE.w * 0.042 * 2;
  const gridX = (screenW - (COLS * ICON + (COLS - 1) * GAP)) / 2;
  const left = PHONE.x - PHONE.w / 2;

  const cardIn = pop(t, B.storageStart);
  const cardShake = alarm ? Math.sin(t * 3.1) * 6 * Math.exp(-(t - B.alarm) * 0.04) + Math.sin(t * 2) * 2 : 0;

  return (
    <>
      {/* sombra no chão */}
      <div
        style={{
          position: "absolute", left: PHONE.x - 260 * sx, top: PHONE.top + PHONE.h - 10, width: 520 * sx, height: 56,
          borderRadius: "50%", background: "rgba(34,28,25,0.16)", transform: `scale(${0.4 + 0.6 * fallP})`,
        }}
      />
      {/* ícones que pularam pra fora e caíram no chão */}
      {JUMPERS.map((j, i) => {
        const tt = t - j.at;
        if (tt < 0) return null;
        const dur = 16;
        const p = Math.min(1, tt / dur);
        const x = PHONE.x + j.side * j.dist * p;
        const startY = PHONE.top + 90;
        const groundY = PHONE.top + PHONE.h - 70 - j.pile * 100;
        const y = startY + (groundY - startY) * p - 420 * 4 * p * (1 - p);
        const [ix, iy] = squash(tt, dur, 0.3);
        const rot = j.side * (p < 1 ? p * 300 : 300 + Math.sin(tt * 0.3) * 4);
        return (
          <div key={i} style={{ position: "absolute", left: x - 56, top: y - 56, transform: `rotate(${rot}deg) scale(${ix}, ${iy})`, transformOrigin: "50% 100%" }}>
            <AppIcon size={112} bg={APP_COLORS[(i * 3 + 2) % APP_COLORS.length]} glyph={j.glyph} />
          </div>
        );
      })}
      {/* celular-personagem */}
      <div
        style={{
          position: "absolute", left, top: PHONE.top, width: PHONE.w, height: PHONE.h,
          transform: `translate(${shakeX}px, ${dropY}px) rotate(${shakeR}deg) scale(${sx}, ${sy})`, transformOrigin: "50% 100%",
        }}
      >
        {/* pilha transbordando por cima */}
        {STACK.map((s, i) => {
          const p = pop(t, s.at, { damping: 8, stiffness: 220 });
          const wob = Math.sin(t * 0.5 + i * 2) * (4 + amp);
          return (
            <div
              key={i}
              style={{
                position: "absolute", left: PHONE.w / 2 - 50 + s.dx, top: -70,
                transform: `translateY(${(1 - p) * 120}px) scale(${p}) rotate(${s.rot + wob}deg)`, transformOrigin: "50% 100%",
                zIndex: 0,
              }}
            >
              <AppIcon size={100} bg={APP_COLORS[(i * 4 + 1) % APP_COLORS.length]} glyph={i * 3 + 1} />
            </div>
          );
        })}
        <Phone width={PHONE.w} height={PHONE.h} style={{ position: "absolute", left: 0, top: 0 }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", background: alarm ? "#FFF1EA" : C.papel }} />
          <PhoneFace width={300} mood={mood} blink={blink} look={eyes} style={{ position: "absolute", left: (screenW - 300) / 2, top: 74 }} />
          {ORDER.map((idx, k) => {
            const col = idx % COLS;
            const row = Math.floor(idx / COLS);
            const at = B.iconsStart + k * B.iconEvery;
            const p = pop(t, at, { damping: 8, stiffness: 240 });
            const wob = t > at + 8 ? Math.sin(t * 0.7 + idx) * (2 + amp * 0.8) : 0;
            return (
              <div
                key={idx}
                style={{
                  position: "absolute", left: gridX + col * (ICON + GAP), top: 236 + row * (ICON + GAP),
                  transform: `scale(${p}) rotate(${wob}deg)`,
                }}
              >
                <AppIcon size={ICON} bg={APP_COLORS[idx % APP_COLORS.length]} glyph={idx} />
              </div>
            );
          })}
          {/* badge de alerta */}
          {alarm && (
            <div
              style={{
                position: "absolute", right: 22, top: 26, width: 64, height: 64, borderRadius: 32, background: "#E5322D",
                color: "#fff", fontFamily: "Poppins", fontWeight: 900, fontSize: 46, display: "flex", alignItems: "center", justifyContent: "center",
                transform: `scale(${pop(t, B.alarm) * (1 + 0.12 * Math.sin(t * 0.8))})`,
              }}
            >
              !
            </div>
          )}
        </Phone>
      </div>
      <SweatDrops
        frame={t}
        start={B.land + 14}
        seed="sweat"
        points={[[left - 6, PHONE.top + 120, -1], [left + PHONE.w + 6, PHONE.top + 90, 1], [left + PHONE.w + 10, PHONE.top + 260, 1]]}
      />
      {/* card de armazenamento */}
      <div
        style={{
          position: "absolute", left: 540 - 310, top: 1150, transform: `translate(${cardShake}px, ${(1 - cardIn) * 260}px) scale(${0.6 + 0.4 * cardIn}) rotate(${cardShake * 0.2}deg)`,
          opacity: Math.min(1, cardIn * 2), transformOrigin: "50% 100%",
        }}
      >
        <StorageCard width={620} label={TEXTS.s1.storageLabel} percent={percent} alarm={alarm} frame={t} />
      </div>
      {/* sinais de alerta "!" */}
      {alarm &&
        [[-1, 640], [1, 610]].map(([side, y], i) => {
          const p = pop(t, B.alarm + 2 + i * 3, { damping: 7, stiffness: 220 });
          return (
            <div
              key={i}
              style={{
                position: "absolute", left: PHONE.x + side * 300 - 30, top: y - 60 + float(t, 20, 6, i),
                transform: `scale(${p}) rotate(${side * 14}deg)`, fontFamily: "Poppins", fontWeight: 900, fontSize: 110, color: C.coral,
              }}
            >
              !
            </div>
          );
        })}
    </>
  );
};
