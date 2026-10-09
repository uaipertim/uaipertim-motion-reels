import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { C } from "../../config/theme";
import { BEATS3, SCENES3, abs3 } from "../config/timeline";
import { TEXTS3 } from "../config/texts";
import { clamp, dropBounce, pop, popOut, prog, squash, wiggle } from "../../lib/anim";
import { CremeBackground } from "../../components/Decor";
import { CitySilhouette, Cloud, MapPin, Tree } from "../../components/Scenery";
import { FloatingHearts, StarPops } from "../../components/Particles";
import { RoofNotification, SHOP_RATIO, ShopChar, ShopCharKind } from "../../components/Town";
import type { Mood } from "../../components/Phone";

// Palco das cenas 2–5: a cidadezinha com as lojinhas-personagem.
// Tudo aqui é função do frame ABSOLUTO (o palco atravessa as cenas sem corte).
// Coordenadas "da cidade" = coordenadas do vídeo com a câmera em repouso (cena 2).

const B2 = BEATS3.s2;
const B3 = BEATS3.s3;
const B4 = BEATS3.s4;
const B5 = BEATS3.s5;

export type ShopId = "farmacia" | "mercado" | "padaria" | "restaurante" | "pet" | "hortifruti" | "bebidas" | "lanchonete" | "loja";
type ShopDef = { id: ShopId; kind: ShopCharKind; row: "back" | "front"; x: number; phase: number; extra?: boolean };

export const ROWS = { back: { base: 1050, w: 250 }, front: { base: 1300, w: 230 } } as const;

// ordem = ordem em que brotam do chão (beats.s2.shops)
export const TOWN_SHOPS: ShopDef[] = [
  { id: "farmacia", kind: "farmacia", row: "front", x: 135, phase: 0 },
  { id: "mercado", kind: "mercado", row: "back", x: 230, phase: 9 },
  { id: "padaria", kind: "padaria", row: "front", x: 405, phase: 4 },
  { id: "restaurante", kind: "restaurante", row: "back", x: 540, phase: 14 },
  { id: "pet", kind: "pet", row: "front", x: 675, phase: 7 },
  { id: "hortifruti", kind: "hortifruti", row: "back", x: 850, phase: 2 },
  { id: "bebidas", kind: "bebidas", row: "front", x: 945, phase: 11 },
  // fora do quadro até o zoom out da cena 5
  { id: "lanchonete", kind: "lanchonete", row: "back", x: -150, phase: 5, extra: true },
  { id: "loja", kind: "loja", row: "back", x: 1230, phase: 12, extra: true },
];

const shopW = (d: ShopDef) => ROWS[d.row].w;
const shopTop = (d: ShopDef) => ROWS[d.row].base - shopW(d) * SHOP_RATIO;
const unit = (d: ShopDef) => shopW(d) / 200; // px da cidade por unidade do svg da lojinha

// ---------------------------------------------------------------- tempos ----
const SPROUT_AT: Record<ShopId, number> = Object.fromEntries(
  TOWN_SHOPS.map((d, i) => [d.id, abs3("s2", B2.shops[Math.min(i, B2.shops.length - 1)])]),
) as Record<ShopId, number>;

export const LIT_AT: Record<ShopId, number> = {
  ...(Object.fromEntries(TEXTS3.s3.balloons.map((b, i) => [b.shop, abs3("s3", B3.balloons[i])])) as Record<string, number>),
  hortifruti: abs3("s3", B3.litHortifruti),
  bebidas: abs3("s3", B3.litBebidas),
  lanchonete: abs3("s5", B5.extrasLit[0]),
  loja: abs3("s5", B5.extrasLit[1]),
} as Record<ShopId, number>;

const PIN_ORDER: ShopId[] = ["mercado", "farmacia", "pet", "restaurante", "bebidas", "hortifruti"];
const PIN_AT: Partial<Record<ShopId, number>> = {
  padaria: abs3("s4", B4.pinDrop),
  ...Object.fromEntries(PIN_ORDER.map((id, i) => [id, abs3("s5", B5.pins[i])])),
};

const T = {
  stretch: abs3("s2", B2.stretch),
  swing: abs3("s2", B2.signSwing),
  hmm: B2.hmm.map((h) => abs3("s2", h)),
  tagFly: abs3("s4", B4.tagFly),
  tagLand: abs3("s4", B4.tagLand),
  bell: abs3("s4", B4.bell),
  badge: abs3("s4", B4.badge),
  surprise: abs3("s4", B4.surprise),
  glow: abs3("s4", B4.glow),
  celebrate: B4.celebrate.map((c) => abs3("s4", c)),
  zoomOut: abs3("s5", B5.zoomOut),
  hearts: abs3("s5", B5.hearts),
  endStart: abs3("s5", B5.endCardStart),
  endStatic: abs3("s5", B5.endCardStatic),
};

// ---------------------------------------------------------------- câmera ----
type Cam = { s: number; ox: number; oy: number };
const CAM_HOME: Cam = { s: 1, ox: 0, oy: 0 };
// cena 3: a cidade desce e encolhe (abre espaço pros balões); a calçada da frente fica em y=1480
const CAM_S3: Cam = { s: 0.66, ox: 540 * (1 - 0.66), oy: 1480 - 1300 * 0.66 };
// cena 4: aproxima na padaria (a base dela fica parada na tela)
const PAD = TOWN_SHOPS.find((d) => d.id === "padaria")!;
const padScreen = [PAD.x * CAM_S3.s + CAM_S3.ox, ROWS.front.base * CAM_S3.s + CAM_S3.oy];
const CAM_S4: Cam = { s: 1.15, ox: padScreen[0] - PAD.x * 1.15, oy: padScreen[1] - ROWS.front.base * 1.15 };
// cena 5: zoom out — a cidadezinha inteira
const CAM_S5: Cam = { s: 0.6, ox: 540 * (1 - 0.6), oy: 300 };

const mixCam = (a: Cam, b: Cam, t: number): Cam => ({ s: a.s + (b.s - a.s) * t, ox: a.ox + (b.ox - a.ox) * t, oy: a.oy + (b.oy - a.oy) * t });
const camEase = Easing.inOut(Easing.cubic);

export const townCam = (f: number): Cam => {
  const k1 = abs3("s3", B3.camera);
  const k2 = abs3("s4", B4.camera);
  const k3 = T.zoomOut;
  if (f < k1) return CAM_HOME;
  if (f < k1 + B3.cameraDur) return mixCam(CAM_HOME, CAM_S3, camEase((f - k1) / B3.cameraDur));
  if (f < k2) return CAM_S3;
  if (f < k2 + B4.cameraDur) return mixCam(CAM_S3, CAM_S4, camEase((f - k2) / B4.cameraDur));
  if (f < k3) return CAM_S4;
  if (f < k3 + B5.zoomDur) return mixCam(CAM_S4, CAM_S5, camEase((f - k3) / B5.zoomDur));
  return CAM_S5;
};

// ponto da cidade → ponto da tela
export const toScreen = (f: number, x: number, y: number): [number, number] => {
  const c = townCam(f);
  return [x * c.s + c.ox, y * c.s + c.oy];
};

// onde a etiqueta "@" pousa: o sininho no telhado da padaria
const u = unit(PAD);
export const BELL = { x: PAD.x + 84 * u, y: shopTop(PAD) + 66 * u - 46, size: 112 };

// ---------------------------------------------------------- estado/lojinha ----
const blinkAt = (f: number, phase: number) => {
  const t = (f + phase * 5) % 74;
  return t < 3 ? t / 3 : t < 6 ? (6 - t) / 3 : 0;
};
// pulinho com squash no pouso
const hop = (t: number, dur: number, h: number): { dy: number; sq: [number, number] } => {
  if (t < 0) return { dy: 0, sq: [1, 1] };
  if (t < dur) {
    const p = t / dur;
    return { dy: -4 * h * p * (1 - p), sq: [0.94, 1.08] };
  }
  return { dy: 0, sq: squash(t, dur, 0.18 * Math.min(1, h / 40)) };
};

type State = {
  show: boolean; sx: number; sy: number; dy: number; rot: number; mood: Mood; look: [number, number]; blink: number;
  eyeScale: number; lit: number; glow: number; signSwing: number; signLift: number; awning: number;
};

const shopState = (d: ShopDef, f: number): State => {
  const sprout = SPROUT_AT[d.id];
  const litAt = LIT_AT[d.id];
  const grow = f < sprout ? 0 : pop(f, sprout, { damping: 9, stiffness: 160 });
  const lit = prog(f, litAt, 6, (x) => x);
  const isLit = f >= litAt;
  let sx = 0.55 + 0.45 * grow;
  let sy = grow;
  let dy = 0;
  let rot = 0;
  let mood: Mood = isLit ? "happy" : "worried";
  let look: [number, number] = [0, 0];
  let eyeScale = 1;
  let signSwing = 0;
  let signLift = 0;
  let awning = 0;
  let glow = 0;

  if (!isLit) {
    // ansiedade: pulinhos pequenos + olhos indo de um lado pro outro
    const period = 24 + (d.phase % 4) * 3;
    const h = hop(((f - sprout - 12 + d.phase * 3) % period + period) % period, 9, 9);
    if (f > sprout + 12) {
      dy += h.dy;
      sx *= h.sq[0];
      sy *= h.sq[1];
    }
    look = [Math.tanh(3 * Math.sin(f * 0.12 + d.phase)) * 0.85, 0.15];
    signSwing = 3 * Math.sin(f * 0.2 + d.phase);
  } else {
    // acendeu: pula de alegria (squash & stretch) e segue comemorando
    const j = hop(f - litAt, 13, 46);
    const fade = Math.max(0, 1 - (f - litAt - 13) / 50);
    dy += j.dy - Math.abs(Math.sin((f + d.phase) * 0.22)) * (4 + 8 * fade);
    sx *= j.sq[0];
    sy *= j.sq[1];
    look = [0.1 * Math.sin(f * 0.05 + d.phase), 0.2];
    signSwing = wiggle(f, litAt, 16, 0.4, 0.07) + 2 * Math.sin(f * 0.15 + d.phase);
  }

  // cena 2: o restaurante estica o pescoço/toldo; o pet shop balança a placa
  if (d.id === "restaurante" && !isLit) {
    const st = prog(f, T.stretch, 8) * (1 - prog(f, T.stretch + 34, 8, Easing.in(Easing.cubic)));
    sy *= 1 + 0.15 * st;
    sx *= 1 - 0.06 * st;
    signLift = 26 * st;
    awning = st;
    if (st > 0.05) look = [Math.sin(f * 0.18) * 0.9, -0.7];
  }
  if (d.id === "pet" && !isLit && f >= T.swing) {
    signSwing = 16 * Math.sin((f - T.swing) * 0.24) * Math.min(1, (f - T.swing) / 8);
  }
  // "hmm?" — inclina a cabeça
  T.hmm.forEach((h, i) => {
    const who: ShopId = i === 0 ? "mercado" : "farmacia";
    if (d.id === who && !isLit) rot += (i === 0 ? -1 : 1) * 9 * prog(f, h, 6) * (1 - prog(f, h + 22, 8));
  });

  // cena 4: a padaria acompanha a etiqueta, se assusta com a notificação, acende inteira e comemora
  if (d.id === "padaria") {
    if (f >= T.tagFly - 6 && f < T.surprise) look = [0.4, -0.9];
    if (f >= T.tagLand) {
      const fl = squash(f, T.tagLand, 0.12);
      sx *= fl[0];
      sy *= fl[1];
    }
    if (f >= T.surprise && f < T.celebrate[0]) {
      mood = "surprised";
      eyeScale = 1 + 0.42 * pop(f, T.surprise, { damping: 7, stiffness: 240 });
      look = [0, 0];
      const j = hop(f - T.surprise, 8, 16);
      dy += j.dy;
    }
    glow = f >= T.glow ? pop(f, T.glow, { damping: 8, stiffness: 120 }) : 0;
    T.celebrate.forEach((c) => {
      const j = hop(f - c, 14, 58);
      if (f >= c) {
        dy += j.dy;
        sx *= j.sq[0];
        sy *= j.sq[1];
      }
    });
  }

  // cena 5: a cidade inteira iluminada
  if (f >= T.zoomOut && d.id !== "padaria") glow = Math.max(glow, 0.55 * prog(f, T.zoomOut + 4 + d.phase, 10, (x) => x));

  return {
    show: f >= sprout, sx, sy, dy, rot, mood, look, blink: blinkAt(f, d.phase), eyeScale, lit,
    glow, signSwing, signLift, awning,
  };
};

// ---------------------------------------------------------------- palco ----
const Ground: React.FC<{ f: number }> = ({ f }) => (
  <>
    {/* chão atrás (pracinha) */}
    <div style={{ position: "absolute", left: -480, width: 2040, top: ROWS.back.base - 12, height: ROWS.front.base - ROWS.back.base + 12, background: "#F3E5D1" }} />
    <div style={{ position: "absolute", left: -480, width: 2040, top: ROWS.back.base - 12, height: 16, background: C.cremeDeep }} />
    {/* calçada + rua */}
    <div style={{ position: "absolute", left: -480, width: 2040, top: ROWS.front.base - 6, height: 34, background: C.cremeDeep }} />
    <div style={{ position: "absolute", left: -480, width: 2040, top: ROWS.front.base + 28, height: 108, background: "#DCC4A6" }} />
    <div style={{ position: "absolute", left: -480, width: 2040, top: ROWS.front.base + 136, height: 12, background: C.cremeDeep }} />
    {Array.from({ length: 16 }).map((_, i) => (
      <div
        key={i}
        style={{ position: "absolute", left: -470 + i * 130, top: ROWS.front.base + 78, width: 70, height: 10, borderRadius: 5, background: "#fff", opacity: 0.65 }}
      />
    ))}
  </>
);

const TownShop: React.FC<{ d: ShopDef; f: number }> = ({ d, f }) => {
  const st = shopState(d, f);
  if (!st.show) return null;
  const w = shopW(d);
  return (
    <div
      style={{
        position: "absolute", left: d.x - w / 2, top: shopTop(d), width: w, height: w * SHOP_RATIO,
        transform: `translateY(${st.dy}px) rotate(${st.rot}deg) scale(${st.sx}, ${st.sy})`, transformOrigin: "50% 100%",
      }}
    >
      <ShopChar
        kind={d.kind} width={w} mood={st.mood} look={st.look} blink={st.mood === "surprised" ? 0 : st.blink} eyeScale={st.eyeScale}
        lit={st.lit} glow={st.glow} signSwing={st.signSwing} signLift={st.signLift} awning={st.awning}
      />
    </div>
  );
};

const Pin: React.FC<{ d: ShopDef; f: number; at: number }> = ({ d, f, at }) => {
  if (f < at) return null;
  const st = shopState(d, f);
  const size = d.row === "back" ? 96 : 92;
  const fall = d.id === "padaria" ? B4.pinLand - B4.pinDrop : 8;
  const y = dropBounce(f, at, 520, fall, 2);
  const land = at + fall;
  const [sx, sy] = squash(f, land, 0.25);
  return (
    <div
      style={{
        position: "absolute", left: d.x - size / 2, top: shopTop(d) - size * 1.3 - 4 + st.dy, width: size, height: size * 1.3,
        transform: `translateY(${y}px) scale(${sx}, ${sy})`, transformOrigin: "50% 100%", opacity: interpolate(f - at, [0, 3], [0, 1], clamp),
      }}
    >
      <MapPin size={size} />
    </div>
  );
};

export const TownStage: React.FC = () => {
  const f = useCurrentFrame() + SCENES3.s2.from; // frame absoluto
  const cam = townCam(f);
  const reveal = pop(f, SCENES3.s2.from, { damping: 12, stiffness: 120 });
  const endP = interpolate(f, [T.endStart, T.endStatic], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const back = TOWN_SHOPS.filter((d) => d.row === "back");
  const front = TOWN_SHOPS.filter((d) => d.row === "front");
  const bellIn = f >= T.bell ? pop(f, T.bell, { damping: 8, stiffness: 220 }) : 0;
  const bellOut = popOut(f, T.endStart, 8);
  return (
    <AbsoluteFill>
      <CremeBackground frame={f} rays={f >= T.zoomOut} raysCenter={[540, 420]} raysOpacity={0.12 * prog(f, T.zoomOut, 20)} />
      <AbsoluteFill style={{ opacity: 1 - endP, transform: `translateY(${endP * 260}px)` }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transform: `translate(${cam.ox}px, ${cam.oy}px) scale(${cam.s})`, transformOrigin: "0 0" }}>
          {/* fundo da cidadezinha */}
          <div style={{ position: "absolute", left: 0, top: 0, transform: `translateY(${(1 - reveal) * 160}px)`, opacity: Math.min(1, reveal * 1.4) }}>
            {[[-380, 610, 200], [40, 560, 230], [700, 515, 190], [1250, 575, 210]].map(([x, y, w], i) => (
              <Cloud key={i} width={w} style={{ position: "absolute", left: x + Math.sin(f * 0.012 + i) * 30 + (f - 120) * 0.15, top: y, opacity: 0.95 }} />
            ))}
            <CitySilhouette width={2040} height={390} style={{ position: "absolute", left: -480, top: 668 }} />
          </div>
          <div style={{ position: "absolute", left: 0, top: 0, transform: `translateY(${(1 - reveal) * 260}px)` }}>
            <Ground f={f} />
            {[70, 385, 695, 1010].map((x, i) => (
              <Tree key={x} size={118} sway={Math.sin(f * 0.07 + i) * 3} style={{ position: "absolute", left: x - 59, top: ROWS.back.base - 150 }} />
            ))}
            {[-170, 1250].map((x, i) => (
              <Tree key={x} size={150} sway={Math.sin(f * 0.07 + i * 2) * 3} style={{ position: "absolute", left: x - 75, top: ROWS.front.base - 192 }} />
            ))}
          </div>

          {back.map((d) => <TownShop key={d.id} d={d} f={f} />)}
          {back.map((d) => <StarPops key={`s${d.id}`} frame={f} start={LIT_AT[d.id]} cx={d.x} cy={shopTop(d) + 70} radius={150} count={7} seed={`v3lit-${d.id}`} size={52} />)}
          {front.map((d) => <TownShop key={d.id} d={d} f={f} />)}
          {front.map((d) => <StarPops key={`s${d.id}`} frame={f} start={LIT_AT[d.id]} cx={d.x} cy={shopTop(d) + 70} radius={140} count={7} seed={`v3lit-${d.id}`} size={50} />)}

          {/* cena 4: notificação no telhado + a padaria acende inteira */}
          <StarPops frame={f} start={T.glow} cx={PAD.x} cy={shopTop(PAD) + 120} radius={200} count={10} seed="v3glow" size={64} />
          {bellIn > 0.01 && (
            <div style={{ position: "absolute", left: BELL.x - BELL.size / 2, top: BELL.y - BELL.size / 2 + shopState(PAD, f).dy, transform: `scale(${bellIn * bellOut})` }}>
              <RoofNotification size={BELL.size} frame={f} ringAt={T.badge} badgeIn={f >= T.badge ? pop(f, T.badge, { damping: 7, stiffness: 260 }) : 0} />
            </div>
          )}
          {TOWN_SHOPS.map((d) => (PIN_AT[d.id] !== undefined ? <Pin key={`p${d.id}`} d={d} f={f} at={PIN_AT[d.id]!} /> : null))}

          {/* coraçõezinhos subindo */}
          <FloatingHearts frame={f} start={T.celebrate[1]} seed="v3h4" size={70} sources={[[PAD.x - 90, shopTop(PAD) + 40], [PAD.x + 100, shopTop(PAD) + 60]]} rise={300} />
          <FloatingHearts
            frame={f} start={T.hearts} seed="v3h5" size={88} rise={420} period={50}
            sources={TOWN_SHOPS.filter((d) => d.id !== "padaria").map((d) => [d.x + 60, shopTop(d) + 30] as [number, number])}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
