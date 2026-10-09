import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, FONT, W } from "../../config/theme";
import { TEXTS2 } from "../config/texts";
import { BEATS2, SCENES2 } from "../config/timeline";
import { clamp, pop, popOut, squash } from "../../lib/anim";
import { CremeBackground } from "../../components/Decor";
import { AppHeader, EstablishmentCard, PlaceholderCard } from "../../components/AppUi";
import { RevealFade, TapCursor, ZoomThrough } from "../../components/Guide";
import { ConfettiBurst, StarPops } from "../../components/Particles";
import { SCREEN, StagePhone, StepTitle, toVideo } from "./Stage";

// CENA 4 · Passo 3: quem tá aberto — cards descem empilhando como cartas; o da frente em destaque;
// cursor toca em "Pedir agora" → confete.
const B = BEATS2.s4;
const DUR = SCENES2.s4.duration;
const CARD_W = 764;
const CARD_TOP = 330;
const BTN: [number, number] = [CARD_W - 26 - 128, CARD_TOP + 330 - 26 - 38]; // centro do botão (coords da tela, relativo ao card + topo)
const STACK = [
  { rot: -5, dx: -14, dy: -40, tint: "#FFE0B8" },
  { rot: 4, dx: 12, dy: -20, tint: "#FFD3C4" },
  { rot: 0, dx: 0, dy: 0, tint: "" }, // card da frente
];

export const S4Aberto: React.FC = () => {
  const f = useCurrentFrame();
  const out = popOut(f, DUR - 8, 7);
  const btnScreen: [number, number] = [(SCREEN.w - CARD_W) / 2 + BTN[0], BTN[1]];
  const [bx, by] = toVideo(...btnScreen);
  const tapT = f - B.tap;
  const press = tapT >= -2 && tapT < 10 ? 1 - 0.12 * Math.sin(Math.max(0, tapT + 2) / 12 * Math.PI) : 1;
  const keys = [
    { f: B.inspect[0] - 12, x: 1000, y: 1520 },
    { f: B.inspect[0], ...pt(560, CARD_TOP + 175) }, // nota/tempo
    { f: B.inspect[1], ...pt(330, CARD_TOP + 270) }, // selo Aberto
    { f: B.tap - 4, x: bx, y: by },
  ];

  return (
    <AbsoluteFill>
      <CremeBackground frame={f + SCENES2.s4.from} />
      <StagePhone>
        <div style={{ position: "absolute", left: 0, top: 104 }}>
          <AppHeader width={SCREEN.w} />
        </div>
        <div style={{ position: "absolute", left: 36, right: 36, top: 222, display: "flex", alignItems: "center", gap: 18 }}>
          <span style={{ fontFamily: FONT, fontWeight: W.extraBold, fontSize: 40, color: C.tinta }}>{TEXTS2.s4.list}</span>
          <span style={{ padding: "6px 22px", borderRadius: 999, background: C.coral, color: "#fff", fontFamily: FONT, fontWeight: W.extraBold, fontSize: 26 }}>
            Restaurantes
          </span>
        </div>
        {/* esqueleto "carregando" enquanto os cards não caem */}
        {[0, 1].map((k) => {
          const o = interpolate(f, [8, 14, B.cards[0] + 4, B.cards[2] + 6], [0, 1, 1, 0], clamp);
          const sweep = ((f * 26) % 1400) - 300;
          return (
            <div key={k} style={{ position: "absolute", left: (SCREEN.w - CARD_W) / 2, top: CARD_TOP + k * 380, opacity: o, overflow: "hidden", borderRadius: 36 }}>
              <PlaceholderCard width={CARD_W} tint="#F4EDE4" />
              <div style={{ position: "absolute", top: 0, bottom: 0, left: sweep, width: 220, background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.85), rgba(255,255,255,0))", transform: "skewX(-15deg)" }} />
            </div>
          );
        })}
        {STACK.map((s, i) => {
          const at = B.cards[i];
          const p = pop(f, at, { damping: 10, stiffness: 150 });
          const [sx, sy] = squash(f, at + 8, 0.06);
          const front = i === STACK.length - 1;
          return (
            <div
              key={i}
              style={{
                position: "absolute", left: (SCREEN.w - CARD_W) / 2 + s.dx, top: CARD_TOP + s.dy,
                transform: `translateY(${(1 - p) * -1100}px) rotate(${s.rot + (1 - p) * (i % 2 ? 18 : -18)}deg) scale(${sx}, ${sy})`,
                transformOrigin: "50% 100%", opacity: f >= at ? 1 : 0,
              }}
            >
              {front ? (
                <EstablishmentCard
                  width={CARD_W} name={TEXTS2.s4.card.name} subtitle={TEXTS2.s4.card.subtitle} rating={TEXTS2.s4.card.rating}
                  time={TEXTS2.s4.card.time} openLabel={TEXTS2.s4.card.open} button={TEXTS2.s4.card.button}
                  frame={f} seloStart={B.selo} press={press}
                />
              ) : (
                <PlaceholderCard width={CARD_W} tint={s.tint} />
              )}
            </div>
          );
        })}
        <div style={{ position: "absolute", left: 32, top: CARD_TOP + 380, opacity: f >= B.cards[2] + 8 ? 1 : 0 }}>
          <PlaceholderCard width={CARD_W} />
        </div>
        <ZoomThrough frame={f} start={B.zoomOut} dur={DUR - B.zoomOut} cx={btnScreen[0]} cy={btnScreen[1]} color={C.coral} />
        <RevealFade frame={f} dur={B.reveal} />
      </StagePhone>
      {/* confete coral/amarelo no toque */}
      <ConfettiBurst frame={f} start={B.tap} x={bx} y={by} angle={-100} spread={120} power={52} count={44} seed="v2s4a" />
      <ConfettiBurst frame={f} start={B.tap + 2} x={bx - 200} y={by} angle={-70} spread={70} power={44} count={24} seed="v2s4b" />
      <StarPops frame={f} start={B.tap} cx={bx} cy={by} radius={150} count={8} seed="v2s4" size={48} />
      <StepTitle n={3} text={TEXTS2.s4.step} frame={f} badgeAt={B.badge} textAt={B.text} out={out} size={68} />
      <TapCursor frame={f} appear={B.inspect[0] - 12} hide={B.zoomOut} keys={keys} taps={[B.tap]} />
    </AbsoluteFill>
  );
};

function pt(x: number, y: number) {
  const [vx, vy] = toVideo(x, y);
  return { x: vx, y: vy };
}
