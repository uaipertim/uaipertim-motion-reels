import React from "react";
import { Easing, interpolate } from "remotion";
import { C } from "../../config/theme";
import { BEATS3, abs3 } from "../config/timeline";
import { TEXTS3 } from "../config/texts";
import { clamp, float, lerp, pop, popOut, prog } from "../../lib/anim";
import { CommentBalloon, CommentCounter, CommentField, MiniBalloon } from "../../components/Comments";
import { BreadIcon, CartIcon, PawIcon } from "../../components/Icons";
import { PillIcon, YumFace } from "../../components/AppIcons";

// Camada de comentários das cenas 3–4 (balões, contador 💬 e campo de comentário).
// Função do frame ABSOLUTO: as cenas 3 e 4 desenham a mesma camada sem emenda.

const B2 = BEATS3.s2;
const B3 = BEATS3.s3;
const B4 = BEATS3.s4;

const ICONS: Record<string, React.ReactNode> = {
  pao: <BreadIcon size={42} />,
  carrinho: <CartIcon size={42} />,
  delicia: <YumFace size={42} />,
  patinha: <PawIcon size={42} />,
  remedio: <PillIcon size={42} />,
};

// posição (centro) de cada balão na cena 3, direção de onde ele vem, inclinação, rabinho, largura do texto
const LAYOUT = [
  { x: 420, y: 541, from: [-1, 0.2], rot: -2, tail: "left", tw: 560 },
  { x: 660, y: 649, from: [1, -0.15], rot: 2, tail: "right", tw: 600 },
  { x: 400, y: 777, from: [-0.7, 0.9], rot: -1.5, tail: "left", tw: 440 },
  { x: 680, y: 925, from: [1, 0.5], rot: 2.2, tail: "right", tw: 470 },
  { x: 420, y: 1053, from: [-1, -0.3], rot: -2, tail: "left", tw: 560 },
] as const;
// cena 4: os balões se organizam numa lista; o da padaria ganha destaque
const LIST_Y = [537, 625, 731, 853, 959];
const HIGHLIGHT = { x: 540, y: 566, s: 1.1 };
export const FIELD4 = { x: 540, y: 722, w: 900 };
export const COUNTER_POS = { right: 34, top: 212 };

const counterValue = (f: number): string => {
  const keys = B3.counter.map(([fr, v]) => [abs3("s3", fr), v] as [number, number]);
  if (f < keys[0][0]) return "0";
  for (let i = keys.length - 1; i >= 0; i--) {
    if (f >= keys[i][0]) {
      if (i === keys.length - 1) return TEXTS3.s3.counterCap;
      // sobe rápido até o próximo valor (números "girando")
      const [f0, v0] = keys[i];
      const [f1, v1] = keys[i + 1];
      const t = Math.min(1, (f - f0) / Math.max(1, f1 - f0));
      return String(Math.round(v0 + (v1 - v0) * Easing.out(Easing.quad)(t)));
    }
  }
  return "0";
};

const counterBump = (f: number) => {
  let b = 0;
  const events = [...B3.counter.map(([fr]) => abs3("s3", fr)), ...B4.othersOut.map((o) => abs3("s4", o) + 8)];
  for (const e of events) {
    const t = f - e;
    if (t >= 0 && t < 12) b = Math.max(b, Math.exp(-t * 0.3) * Math.cos(t * 0.6));
  }
  return b;
};

export const Counter: React.FC<{ f: number }> = ({ f }) => {
  const inAt = abs3("s3", B3.counterIn);
  if (f < inAt) return null;
  const s = pop(f, inAt) * popOut(f, abs3("s4", B4.textOut), 8);
  if (s <= 0.001) return null;
  return (
    <div style={{ position: "absolute", right: COUNTER_POS.right, top: COUNTER_POS.top, transform: `scale(${s})`, transformOrigin: "100% 0%" }}>
      <CommentCounter value={counterValue(f)} bump={counterBump(f)} size={54} />
    </div>
  );
};

// Balões de comentário (cena 3 → cena 4).
export const Balloons: React.FC<{ f: number }> = ({ f }) => {
  const org = prog(f, abs3("s4", B4.organize), B4.organizeDur, Easing.inOut(Easing.cubic));
  const hi = f >= abs3("s4", B4.highlight) ? pop(f, abs3("s4", B4.highlight), { damping: 10, stiffness: 160 }) : 0;
  const goneAt = abs3("s4", B4.fieldOut);
  return (
    <>
      {TEXTS3.s3.balloons.map((b, i) => {
        const at = abs3("s3", B3.balloons[i]);
        if (f < at) return null;
        const L = LAYOUT[i];
        const p = pop(f, at, { damping: 9, stiffness: 170 });
        // entrada: voa de fora da tela, gira e assenta com overshoot
        let x = L.x + L.from[0] * (1 - p) * 760;
        let y = L.y + L.from[1] * (1 - p) * 520 + float(f, 64, 5, i * 1.7);
        let s = 0.3 + 0.7 * p;
        let rot = L.rot + (1 - p) * L.from[0] * 22;
        let opacity = 1;
        let highlight = 0;
        // cena 4: organiza em lista
        if (org > 0) {
          x = lerp(x, 540, org);
          y = lerp(y, LIST_Y[i], org);
          s = lerp(s, 0.86, org);
          rot = lerp(rot, 0, org);
        }
        if (i === 0 && hi > 0) {
          x = lerp(x, HIGHLIGHT.x, hi);
          y = lerp(y, HIGHLIGHT.y, hi);
          s = lerp(0.86, HIGHLIGHT.s, hi);
          highlight = Math.min(1, hi);
          s *= popOut(f, goneAt, 8);
        }
        if (i > 0) {
          // os outros voam pro contador 💬 (viram mais comentários contados)
          const outAt = abs3("s4", B4.othersOut[i - 1]);
          const q = interpolate(f, [outAt, outAt + 9], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
          if (q >= 1) return null;
          x = lerp(x, 1080 - COUNTER_POS.right - 70, q);
          y = lerp(y, COUNTER_POS.top + 40, q);
          s *= 1 - 0.85 * q;
          opacity = 1 - q * q;
        }
        if (s <= 0.001) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute", left: x, top: y, width: "max-content", transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${s})`, opacity,
              zIndex: i === 0 ? 5 : 1,
            }}
          >
            <CommentBalloon
              text={b.text} avatar={b.avatar} icon={ICONS[b.icon]} frame={f} maxTextWidth={L.tw} fontSize={40}
              tail={L.tail} highlight={highlight} heartPhase={i * 1.3}
            />
          </div>
        );
      })}
    </>
  );
};

// Reações rápidas (a cidade toda respondendo): balõezinhos que pipocam, sobem e somem.
const MINI_POS: Array<[number, number]> = [[930, 545], [140, 655], [900, 780], [160, 930], [920, 1060], [250, 1190], [820, 1200], [540, 1165], [120, 1080]];
const MINI_COLORS = [C.coral, C.verde, C.amarelo, C.coralLight, C.verdeLight, C.amareloDark, C.verde, C.coral, C.amarelo];

export const Minis: React.FC<{ f: number }> = ({ f }) => (
  <>
    {B3.minis.map((m, i) => {
      const at = abs3("s3", m);
      const t = f - at;
      if (t < 0 || t > 34) return null;
      const s = pop(t, 0, { damping: 8, stiffness: 240 }) * (1 - Math.max(0, (t - 24) / 10));
      const [x, y] = MINI_POS[i % MINI_POS.length];
      return (
        <div key={i} style={{ position: "absolute", left: x, top: y - t * 2.4, width: "max-content", transform: `translate(-50%, -50%) scale(${s * 0.92}) rotate(${(i % 2 ? 1 : -1) * 5}deg)` }}>
          <MiniBalloon avatar={MINI_COLORS[i]} hearts={1 + (i % 3)} frame={f} size={44} phase={i} />
        </div>
      );
    })}
  </>
);

// Campo "Adicione um comentário…" no rodapé (cena 2 → sai no começo da cena 3).
export const BottomField: React.FC<{ f: number }> = ({ f }) => {
  const inAt = abs3("s2", B2.field);
  if (f < inAt) return null;
  const s = pop(f, inAt);
  const out = interpolate(f, [abs3("s3", B3.fieldOut), abs3("s3", B3.fieldOut) + 12], [0, 1], { ...clamp, easing: Easing.in(Easing.back(1.6)) });
  if (out >= 1) return null;
  return (
    <div style={{ position: "absolute", left: 540 - 460, top: 1388 + out * 360, transform: `scale(${s})`, transformOrigin: "50% 50%" }}>
      <CommentField width={920} frame={f} placeholder={TEXTS3.s2.field} publish={TEXTS3.s2.publish} avatar={C.coral} />
    </div>
  );
};

// Campo de resposta da cena 4: "@" digitado → etiqueta.
export const ReplyField: React.FC<{ f: number; typed: string; publishOn: number }> = ({ f, typed, publishOn }) => {
  const inAt = abs3("s4", B4.fieldIn);
  if (f < inAt) return null;
  const s = pop(f, inAt) * popOut(f, abs3("s4", B4.fieldOut), 8);
  if (s <= 0.001) return null;
  return (
    <div style={{ position: "absolute", left: FIELD4.x - FIELD4.w / 2, top: FIELD4.y - 52, transform: `scale(${s})`, zIndex: 10 }}>
      <CommentField
        width={FIELD4.w} frame={f} placeholder={TEXTS3.s4.field} publish={TEXTS3.s4.publish} avatar={C.verde}
        typed={typed} caret={f >= abs3("s4", B4.tapField)} publishOn={publishOn}
      />
    </div>
  );
};
