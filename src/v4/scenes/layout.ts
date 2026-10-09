import { Easing, interpolate } from "remotion";
import { BEATS4, TRANSITIONS4, abs4 } from "../config/timeline";
import { clamp, lerp, squash } from "../../lib/anim";
import { SHOP_RATIO } from "../../components/Town";

// Geometria compartilhada do Vídeo 4 (frames ABSOLUTOS): a lente que vira transição 1→2,
// a onda de cor, o caminho da Lojinha pelas cenas 2–5 e a estradinha da cena 5.

const B1 = BEATS4.s1;
const B3 = BEATS4.s3;
const B4 = BEATS4.s4;
const B5 = BEATS4.s5;

// ---------------------------------------------------------------- lente ----
// Lupa da barra de busca (cena 1) → cresce até a lente cobrir a tela; dentro dela aparece a cidade.
// Magnifier: centro da lente em (0.4·size, 0.4·size); vidro com raio 0.23·size.
export const PILL = { left: 100, top: 1180, w: 880, h: 128 }; // barra de busca da cena 1
export const PILL_LUPA = { x: 876, y: 1204, size: 80 }; // lupa em repouso dentro da barra (canto sup. esq.)
const IRIS = TRANSITIONS4.iris12;
export const lensPose = (f: number) => {
  const z0 = abs4("s1", B1.lupaZoom);
  const z1 = IRIS.from + IRIS.duration;
  const p = interpolate(f, [z0, z1], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const size = lerp(PILL_LUPA.size, 6200, p);
  const cx = lerp(PILL_LUPA.x + 0.4 * PILL_LUPA.size, 540, Easing.out(Easing.quad)(Math.min(1, p * 1.6)));
  const cy = lerp(PILL_LUPA.y + 0.4 * PILL_LUPA.size, 1000, Easing.out(Easing.quad)(Math.min(1, p * 1.6)));
  return { cx, cy, size, glassR: 0.23 * size, p };
};

// ---------------------------------------------------------------- cidade ----
export const ROWS4 = { back: { base: 1050, w: 250 }, front: { base: 1300, w: 230 } } as const;
export const LOJ_TOWN = { x: 540, base: 1300, w: 300 }; // a Lojinha (protagonista), na frente e no centro
export const lojTownCenter = { x: LOJ_TOWN.x, y: LOJ_TOWN.base - (LOJ_TOWN.w * SHOP_RATIO) / 2 };

// logo da cena 3 (de onde o pin cai)
export const LOGO3 = { cx: 540, cy: 612, size: 230 };

// onda de cor: nasce na Lojinha no impacto do pin
export const IMPACT = abs4("s3", B3.impact);
export const WAVE_R = 2300;
export const waveR = (f: number) =>
  f < IMPACT ? 0 : WAVE_R * Easing.out(Easing.cubic)(Math.min(1, (f - IMPACT) / B3.waveDur));
// frame em que a onda alcança um ponto (para a cidade reagir em sequência)
export const waveReach = (x: number, y: number) => {
  const d = Math.hypot(x - lojTownCenter.x, y - lojTownCenter.y);
  return IMPACT + B3.waveDur * (1 - Math.cbrt(Math.max(0, 1 - Math.min(1, d / WAVE_R))));
};

// zoom da cena 3 → 4: a cidade vai embora e a Lojinha fica sozinha, grande, no centro
export const ZOOM = { from: abs4("s3", B3.zoomIn), dur: B3.zoomDur };
export const LOJ_S4 = { x: 540, base: 1490, w: 480 };
export const zoomP = (f: number) => interpolate(f, [ZOOM.from, ZOOM.from + ZOOM.dur], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });

// ---------------------------------------------------------------- trilha ----
// paradas da Lojinha (base, centro x) e placas (centro da placa)
export const STOPS = [
  { x: 870, base: 1560 }, // largada
  { x: 790, base: 1350 },
  { x: 300, base: 1075 },
  { x: 790, base: 800 },
];
export const SIGNS = [
  { x: 330, y: 1395 },
  { x: 770, y: 1065 },
  { x: 330, y: 700 },
];
export const ROAD_POINTS: Array<[number, number]> = [[930, 1720], [790, 1330], [300, 1060], [790, 780], [1010, 560]];
const LOJ_TRAIL_W = 200;

type Pose = { x: number; base: number; w: number; dy: number; sx: number; sy: number };

export const lojPose = (f: number): Pose => {
  const z = zoomP(f);
  let x = lerp(LOJ_TOWN.x, LOJ_S4.x, z);
  let base = lerp(LOJ_TOWN.base, LOJ_S4.base, z);
  let w = lerp(LOJ_TOWN.w, LOJ_S4.w, z);
  let dy = 0;
  let sx = 1;
  let sy = 1;
  // cena 4 → 5: encolhe e vai pra largada da trilha
  const m0 = abs4("s4", B4.cardsOut);
  const mv = interpolate(f, [m0, m0 + 12], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  if (mv > 0) {
    x = lerp(x, STOPS[0].x, mv);
    base = lerp(base, STOPS[0].base, mv);
    w = lerp(w, LOJ_TRAIL_W, mv);
  }
  // cena 5: pulinhos de placa em placa
  const legs = [[0, 1], [1, 1 / 3], [1, 2 / 3], [1, 1], [2, 1 / 3], [2, 2 / 3], [2, 1]] as const; // [de qual parada, fração até a próxima]
  B5.hops.forEach((h, i) => {
    const t0 = abs4("s5", h);
    if (f < t0) return;
    const [from, frac] = legs[i];
    const prevFrac = i > 0 && legs[i - 1][0] === from ? legs[i - 1][1] : 0;
    const a = STOPS[from];
    const b = STOPS[from + 1];
    const p = Math.min(1, (f - t0) / B5.hopDur);
    const q = lerp(prevFrac, frac, p);
    x = lerp(a.x, b.x, q);
    base = lerp(a.base, b.base, q);
    if (p < 1) {
      dy = -4 * (i === 0 ? 90 : 55) * p * (1 - p);
      sx = 0.94;
      sy = 1.08;
    } else {
      const s = squash(f, t0 + B5.hopDur, 0.2);
      sx = s[0];
      sy = s[1];
    }
  });
  return { x, base, w, dy, sx, sy };
};

// estradinha: Catmull-Rom → Bézier
export const roadPath = (pts: Array<[number, number]>) => {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${p2[0]} ${p2[1]}`;
  }
  return d;
};

// ------------------------------------------------------------ lupa (cena 2) ----
// a lupa varre a cidade da esquerda pra direita, sem parar na Lojinha (centro da lente)
export const LUPA2 = { size: 300 };
export const lupaSweep = (f: number) => {
  const t0 = abs4("s2", BEATS4.s2.lupaIn);
  const t1 = abs4("s2", BEATS4.s2.sweepEnd);
  const t = (f - t0) / (t1 - t0);
  return { x: lerp(-260, 1360, t), y: 1070 + 34 * Math.sin((f - t0) * 0.17), t };
};
