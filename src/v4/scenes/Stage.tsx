import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { C } from "../../config/theme";
import { BEATS4, TRANSITIONS4, abs4 } from "../config/timeline";
import { clamp, dropBounce, jitter, lerp, pop, prog, squash, wiggle } from "../../lib/anim";
import { CremeBackground } from "../../components/Decor";
import { CitySilhouette, Cloud, MapPin, Tree } from "../../components/Scenery";
import { StarPops } from "../../components/Particles";
import { SHOP_RATIO, ShopChar, ShopCharKind } from "../../components/Town";
import { ColorWave } from "../../components/ColorWave";
import type { Mood } from "../../components/Phone";
import {
  IMPACT, LOGO3, LOJ_S4, LOJ_TOWN, ROAD_POINTS, ROWS4, ZOOM, lensPose, lojPose, lojTownCenter, lupaSweep, roadPath, waveR, waveReach, zoomP,
} from "./layout";

// Palco das cenas 2–5 (frames ABSOLUTOS): a cidadezinha cinza → onda de cor → a Lojinha sozinha
// (benefícios) → a estradinha dos 3 passos. Textos, cards e placas ficam nas cenas, por cima.

const B2 = BEATS4.s2;
const B3 = BEATS4.s3;
const B4 = BEATS4.s4;
const B5 = BEATS4.s5;
const IRIS = TRANSITIONS4.iris12;

type ShopDef = { id: string; kind: ShopCharKind; row: "back" | "front"; x: number; phase: number };
const SHOPS4: ShopDef[] = [
  { id: "mercado", kind: "mercado", row: "back", x: 200, phase: 3 },
  { id: "restaurante", kind: "restaurante", row: "back", x: 540, phase: 9 },
  { id: "farmacia", kind: "farmacia", row: "back", x: 880, phase: 5 },
  { id: "padaria", kind: "padaria", row: "front", x: 150, phase: 1 },
  { id: "pet", kind: "pet", row: "front", x: 930, phase: 7 },
];
const shopTop = (d: ShopDef) => ROWS4[d.row].base - ROWS4[d.row].w * SHOP_RATIO;

const blinkAt = (f: number, phase: number) => {
  const t = (f + phase * 5) % 74;
  return t < 3 ? t / 3 : t < 6 ? (6 - t) / 3 : 0;
};
const hopY = (f: number, t0: number, dur: number, h: number) => {
  const t = f - t0;
  return t >= 0 && t < dur ? -4 * h * (t / dur) * (1 - t / dur) : 0;
};

// ------------------------------------------------------------ cidade (fundo) ----
const TownShop: React.FC<{ d: ShopDef; f: number }> = ({ d, f }) => {
  const w = ROWS4[d.row].w;
  const reach = waveReach(d.x, shopTop(d) + w * 0.6);
  const lit = f >= reach;
  const lupa = lupaSweep(f);
  const scanning = lupa.t > -0.1 && lupa.t < 1.1;
  const look: [number, number] = lit ? [0, 0.15] : scanning ? [Math.max(-1, Math.min(1, (lupa.x - d.x) / 260)), -0.2] : [Math.tanh(2 * Math.sin(f * 0.07 + d.phase)) * 0.6, 0.1];
  const dy = lit ? hopY(f, reach, 13, 40) - Math.abs(Math.sin((f + d.phase) * 0.2)) * 5 : Math.sin((f + d.phase * 4) * 0.12) * 2;
  const [sx, sy] = lit ? squash(f, reach + 13, 0.16) : [1, 1];
  return (
    <div
      style={{
        position: "absolute", left: d.x - w / 2, top: shopTop(d), width: w, height: w * SHOP_RATIO,
        transform: `translateY(${dy}px) scale(${sx}, ${sy})`, transformOrigin: "50% 100%",
      }}
    >
      <ShopChar
        kind={d.kind} width={w} mood={lit ? "happy" : "worried"} look={look} blink={blinkAt(f, d.phase)} lit={prog(f, reach, 6, (x) => x)}
        glow={lit ? 0.3 * prog(f, reach, 10) : 0} signSwing={lit ? wiggle(f, reach, 14, 0.4, 0.08) : 2 * Math.sin(f * 0.1 + d.phase)}
        bulbs={lit ? prog(f, reach + 4, 8) : 0} bulbPhase={f + d.phase * 3}
      />
    </div>
  );
};

const Town: React.FC<{ f: number }> = ({ f }) => {
  const z = zoomP(f);
  if (z >= 1) return null;
  // zoom: a cidade cresce em volta da Lojinha e some
  const s = lerp(1, LOJ_S4.w / LOJ_TOWN.w, z);
  const tx = LOJ_S4.x * z + LOJ_TOWN.x * (1 - z) - LOJ_TOWN.x * s;
  const ty = LOJ_S4.base * z + LOJ_TOWN.base * (1 - z) - LOJ_TOWN.base * s;
  const back = SHOPS4.filter((d) => d.row === "back");
  const front = SHOPS4.filter((d) => d.row === "front");
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transform: `translate(${tx}px, ${ty}px) scale(${s})`, transformOrigin: "0 0", opacity: 1 - z }}>
      {[[-120, 590, 210], [640, 540, 190], [960, 610, 170]].map(([x, y, w], i) => (
        <Cloud key={i} width={w} style={{ position: "absolute", left: x + Math.sin(f * 0.012 + i) * 24 + (f - 120) * 0.12, top: y }} />
      ))}
      <CitySilhouette width={1600} height={380} style={{ position: "absolute", left: -260, top: 676 }} />
      <div style={{ position: "absolute", left: -300, width: 1680, top: ROWS4.back.base - 12, height: ROWS4.front.base - ROWS4.back.base + 12, background: "#F3E5D1" }} />
      <div style={{ position: "absolute", left: -300, width: 1680, top: ROWS4.back.base - 12, height: 16, background: C.cremeDeep }} />
      <div style={{ position: "absolute", left: -300, width: 1680, top: ROWS4.front.base - 6, height: 34, background: C.cremeDeep }} />
      <div style={{ position: "absolute", left: -300, width: 1680, top: ROWS4.front.base + 28, height: 108, background: "#DCC4A6" }} />
      <div style={{ position: "absolute", left: -300, width: 1680, top: ROWS4.front.base + 136, height: 12, background: C.cremeDeep }} />
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} style={{ position: "absolute", left: -250 + i * 150, top: ROWS4.front.base + 78, width: 80, height: 10, borderRadius: 5, background: "#fff", opacity: 0.65 }} />
      ))}
      {[370, 710].map((x, i) => (
        <Tree key={x} size={120} sway={Math.sin(f * 0.07 + i) * 3} style={{ position: "absolute", left: x - 60, top: ROWS4.back.base - 152 }} />
      ))}
      {back.map((d) => <TownShop key={d.id} d={d} f={f} />)}
      {front.map((d) => <TownShop key={d.id} d={d} f={f} />)}
      {SHOPS4.map((d) => (
        <StarPops key={`s${d.id}`} frame={f} start={waveReach(d.x, shopTop(d) + 140)} cx={d.x} cy={shopTop(d) + 80} radius={130} count={5} seed={`v4w-${d.id}`} size={44} />
      ))}
    </div>
  );
};

// ------------------------------------------------------------ estradinha (cena 5) ----
const Road: React.FC<{ f: number }> = ({ f }) => {
  const t0 = abs4("s5", B5.trail);
  if (f < t0 - 1) return null;
  const p = interpolate(f, [t0, t0 + B5.trailDur], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const d = roadPath(ROAD_POINTS);
  const len = 2600;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <path d={d} stroke="rgba(34,28,25,0.08)" strokeWidth={128} strokeLinecap="round" fill="none" strokeDasharray={len} strokeDashoffset={len * (1 - p)} transform="translate(0 14)" />
      <path d={d} stroke={C.amareloDark} strokeWidth={122} strokeLinecap="round" fill="none" strokeDasharray={len} strokeDashoffset={len * (1 - p)} />
      <path d={d} stroke={C.amarelo} strokeWidth={102} strokeLinecap="round" fill="none" strokeDasharray={len} strokeDashoffset={len * (1 - p)} />
      <path d={d} stroke="#fff" strokeOpacity={0.75 * prog(f, t0 + B5.trailDur - 2, 6)} strokeWidth={9} strokeLinecap="round" fill="none" strokeDasharray="34 30" />
    </svg>
  );
};

// ------------------------------------------------------------ a Lojinha ----
const Lojinha: React.FC<{ f: number; shake: number }> = ({ f, shake }) => {
  const pose = lojPose(f);
  const w = pose.w;
  const lupa = lupaSweep(f);
  const passAt = abs4("s2", B2.passLoja);
  const stamp = abs4("s2", B2.stamp);
  const droopAt = abs4("s2", B2.droop);
  const on = f >= IMPACT;
  const hoping = !on && f >= passAt - 14 && f < passAt + 6;

  let mood: Mood = on ? "happy" : hoping ? "worried" : "sad";
  let look: [number, number] = on ? [0.05 * Math.sin(f * 0.05), 0.12] : hoping ? [Math.max(-1, Math.min(1, (lupa.x - LOJ_TOWN.x) / 220)), -0.8] : [0.15 * Math.sin(f * 0.04), 0.65];
  if (f >= stamp && f < stamp + 10 && !on) {
    mood = "surprised";
    look = [0, 0];
  }
  const droop = on ? 1 - prog(f, IMPACT, 8) : f < droopAt ? 0.35 : lerp(0.35, 1, prog(f, droopAt, 12, Easing.out(Easing.cubic)));
  const opacity = on ? lerp(0.55, 1, prog(f, IMPACT, 6, (x) => x)) : 0.54 + 0.06 * Math.sin(f * 0.33);
  const tremor = on ? 0 : jitter(f, "v4loj", 1.6);

  // reações (pulos de alegria)
  let dy = pose.dy;
  let sx = pose.sx;
  let sy = pose.sy;
  const jumps: Array<[number, number, number]> = [
    [IMPACT + 3, 15, 90],
    [abs4("s4", B4.cards[0]) + 4, 12, 40],
    [abs4("s4", B4.hearts) + 22, 12, 46],
    [abs4("s5", B5.rocket), 14, 70],
  ];
  for (const [t0, dur, h] of jumps) {
    dy += hopY(f, t0, dur, h);
    if (f >= t0 + dur) {
      const s = squash(f, t0 + dur, 0.18);
      sx *= s[0];
      sy *= s[1];
    }
  }
  // caixinhas pousando na vitrine (cena 4)
  for (const b of B4.boxes) {
    const t = abs4("s4", b) + B4.boxFall;
    if (f >= t) {
      const s = squash(f, t, 0.08);
      sx *= s[0];
      sy *= s[1];
    }
  }
  if (!on && f >= droopAt) sy *= 1 - 0.05 * prog(f, droopAt, 12);
  const idle = on ? -Math.abs(Math.sin(f * 0.2)) * 5 : 0;
  const glow = on ? (f < ZOOM.from ? 0.9 - 0.4 * prog(f, IMPACT + 8, 20) : 0.5) : 0;

  // pin coral: cai do logo (cena 3) e fica em cima da Lojinha ("entrou no mapa")
  const release = abs4("s3", B3.pinRelease);
  const pinW = w * 0.36;
  const pinTop = pose.base - w * SHOP_RATIO * sy - pinW * 1.3 - 4 + dy + idle;
  const restTop = LOJ_TOWN.base - LOJ_TOWN.w * SHOP_RATIO - LOJ_TOWN.w * 0.36 * 1.3 - 4;
  const fall = dropBounce(f, release, restTop - (LOGO3.cy - LOJ_TOWN.w * 0.36 * 0.65), IMPACT - release, 2);
  const [psx, psy] = squash(f, IMPACT, 0.3);

  return (
    <>
    {f >= release && (
      <div
        style={{
          position: "absolute", left: pose.x - pinW / 2 + shake, top: pinTop + fall, width: pinW, height: pinW * 1.3,
          transform: `scale(${psx}, ${psy}) rotate(${wiggle(f, IMPACT, 8, 0.5, 0.12)}deg)`, transformOrigin: "50% 100%",
        }}
      >
        <MapPin size={pinW} />
      </div>
    )}
    <div
      style={{
        position: "absolute", left: pose.x - w / 2 + shake + tremor, top: pose.base - w * SHOP_RATIO, width: w, height: w * SHOP_RATIO,
        transform: `translateY(${dy + idle}px) scale(${sx}, ${sy})`, transformOrigin: "50% 100%", opacity,
      }}
    >
      <ShopChar
        kind="loja" width={w} mood={mood} look={look} blink={on ? blinkAt(f, 2) : Math.max(0.3, blinkAt(f, 2))} lit={on ? prog(f, IMPACT, 6, (x) => x) : 0}
        glow={glow} droop={droop} awning={on ? -0.3 * prog(f, IMPACT, 8) : 0} sparkle={on ? pop(f, IMPACT + 4) * (0.75 + 0.25 * Math.sin(f * 0.3)) : 0}
        bulbs={on ? prog(f, IMPACT + 2, 10) : 0} bulbPhase={f}
        signSwing={on ? wiggle(f, IMPACT, 18, 0.4, 0.07) + 2 * Math.sin(f * 0.15) : 9 * Math.max(droop, 0.4)}
      />
    </div>
    </>
  );
};

export const Stage4: React.FC = () => {
  const f = useCurrentFrame() + IRIS.from; // frame absoluto (o palco começa na lente da cena 1)
  const lens = lensPose(f);
  const clip = f < IRIS.from + IRIS.duration ? `circle(${lens.glassR}px at ${lens.cx}px ${lens.cy}px)` : undefined;
  const shake = wiggle(f, abs4("s2", B2.stamp), 14, 1.3, 0.25);
  const waveEnd = IMPACT + B3.waveDur;
  const r = waveR(f);
  const z = zoomP(f);
  return (
    <AbsoluteFill style={{ clipPath: clip }}>
      <ColorWave gray={f < waveEnd ? 0.86 : 0} r={f >= IMPACT && f < waveEnd ? r : undefined} cx={lojTownCenter.x} cy={lojTownCenter.y} fade={prog(f, waveEnd - 10, 10, (x) => x)}>
        <CremeBackground frame={f} rays={z > 0} raysCenter={[LOJ_S4.x, 1180]} raysOpacity={0.16 * z * (1 - prog(f, abs4("s5", 0), 12))} />
        <div style={{ position: "absolute", inset: 0, transform: `translateX(${shake}px)` }}>
          <Town f={f} />
        </div>
        <Road f={f} />
        <Lojinha f={f} shake={z > 0 ? 0 : shake} />
        <StarPops frame={f} start={IMPACT + 3} cx={LOJ_TOWN.x} cy={lojTownCenter.y - 40} radius={230} count={10} seed="v4imp" size={66} />
      </ColorWave>
    </AbsoluteFill>
  );
};
