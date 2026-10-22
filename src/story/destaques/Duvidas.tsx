import React from "react";
import { Easing, interpolate, random, useCurrentFrame } from "remotion";
import { C, FONT, W } from "../../config/theme";
import { clamp, dropBounce, float, lerp, pop, squash, wiggle } from "../../lib/anim";
import { ConfettiBurst, StarPops } from "../../components/Particles";
import { Ribbon, SwingBell } from "../../components/Ui";
import { MapPin, Tree } from "../../components/Scenery";
import { ScooterIcon } from "../../components/AppIcons";
import { Apoio, Chao, Emoji, Fundo, Loja, Rodape, Titulo, Toldo } from "./kit";
import { DUVIDAS as T } from "./texts";
import tl from "./config/duvidas.json";

// DESTAQUE "DÚVIDAS" — 4 cenas animadas na linguagem do Story "Conheça" (toldo, raios, lojinhas com olhos, brilhos).
const B = tl.beats;
const GROUND = 1462;

// ---------------------------------------------------------------- balão "?"
const Balao: React.FC<{ size: number; color?: string; q?: string }> = ({ size, color = C.coral, q = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: "visible" }}>
    <path d="M50 8 C25 8 8 23 8 44 C8 57 15 67 26 73 L21 92 L43 79 C45.5 79.6 47.8 80 50 80 C75 80 92 65 92 44 C92 23 75 8 50 8 Z" fill={color} />
    <path d="M50 8 C25 8 8 23 8 44 C8 50 9.5 55 12 60 C14 36 30 20 56 18 C70 17 82 22 90 32 C84 17 69 8 50 8 Z" fill="#fff" opacity="0.16" />
    <path d="M37 34 C37 21 63 21 63 35 C63 46 50 46 50 56" stroke={q} strokeWidth="10" strokeLinecap="round" fill="none" />
    <circle cx="50" cy="68" r="6.5" fill={q} />
  </svg>
);

// ---------------------------------------------------------------- CARD 1 · "Dúvidas? 🤔"
// toldo cai e abre; um balão "?" gigante pula no centro ("boing"); as lojinhas olham pra cima, pensativas
// (olhos indo de um lado pro outro); "?" pequenos flutuando.
const SHOPS1 = [
  { kind: "padaria", x: 160 }, { kind: "mercado", x: 400 }, { kind: "farmacia", x: 680 }, { kind: "pet", x: 920 },
] as const;
export const Duvidas1: React.FC = () => {
  const f = useCurrentFrame();
  const b = B.card1;
  const bIn = f < b.balloon ? 0 : 1;
  const by = dropBounce(f, b.balloon, 900, 12, 2);
  const [sx, sy] = squash(f, b.balloon + 12, 0.24);
  const look: [number, number] = [Math.sin(f * 0.07) * 0.9, -0.75];
  return (
    <>
      <Fundo f={f} raios={[540, 900]} seed="dv1" />
      {/* "?" pequenos subindo e sumindo */}
      {b.qs.map((q, i) => {
        const t = (f - q) % 80;
        if (f < q) return null;
        const x = [210, 860, 300, 790][i];
        const p = t / 80;
        const s = pop(t, 0, { damping: 9, stiffness: 200 }) * (1 - Math.max(0, (p - 0.7) / 0.3));
        return (
          <div key={i} style={{ position: "absolute", left: x + Math.sin(t * 0.12 + i) * 18, top: 1120 - p * 380, transform: `translate(-50%,-50%) scale(${s}) rotate(${Math.sin(t * 0.1) * 14}deg)` }}>
            <Balao size={90} color={[C.amarelo, C.coralLight, C.verde, C.amarelo][i]} />
          </div>
        );
      })}
      {/* o balão "?" gigante */}
      {bIn > 0 && (
        <div style={{ position: "absolute", left: 540 - 230, top: 640 + by, width: 460, height: 460, transform: `scale(${sx}, ${sy}) rotate(${wiggle(f, b.balloon + 12, 8, 0.3, 0.06) + Math.sin(f * 0.09) * 3}deg)`, transformOrigin: "50% 100%" }}>
          <div style={{ transform: `translateY(${f > b.balloon + 30 ? float(f, 60, 10) : 0}px)` }}>
            <Balao size={460} />
          </div>
        </div>
      )}
      <StarPops frame={f} start={b.balloon + 12} cx={540} cy={870} radius={270} count={8} seed="dv1st" size={50} />
      <Chao y={GROUND} at={b.shops[0]} f={f} />
      {SHOPS1.map((s, i) => (
        <Loja key={s.kind} f={f} kind={s.kind} x={s.x} ground={GROUND} w={170} at={b.shops[i]} seed={`dv1${i}`} mood="worried" look={look} />
      ))}
      <Titulo f={f} linhas={T.card1.titulo} at={b.title} top={300} size={110} after={<Emoji f={f} e={T.card1.emoji!} size={110} />} />
      <Apoio f={f} linhas={T.card1.apoio} at={b.support} top={440} />
      <Rodape f={f} at={b.foot} />
      <Toldo f={f} cortina={{ drop: b.curtainDrop, open: b.curtainOpen, dur: b.curtainDur }} />
    </>
  );
};

// ---------------------------------------------------------------- CARD 2 · "É pago pra quem compra?"
// etiqueta de preço balançando com "R$ ?"; o carimbo verde "GRÁTIS" desce e carimba; as lojinhas sorriem; confete.
const SHOPS2 = [
  { kind: "restaurante", x: 150 }, { kind: "hortifruti", x: 390 }, { kind: "lanchonete", x: 690 }, { kind: "bebidas", x: 930 },
] as const;
// a etiqueta de preço, em pé (o furo do barbante em cima)
const Etiqueta: React.FC<{ w: number; texto: string; stamped: number }> = ({ w, texto, stamped }) => (
  <svg width={w} height={w * 1.6} viewBox="0 0 100 160" style={{ overflow: "visible" }}>
    <path d="M50 4 L92 32 V148 Q92 156 84 156 H16 Q8 156 8 148 V32 Z" fill={C.amarelo} stroke={C.amareloDark} strokeWidth="4" strokeLinejoin="round" />
    <path d="M50 4 L92 32 V60 C70 40 30 40 8 60 V32 Z" fill="#fff" opacity="0.18" />
    <circle cx="50" cy="30" r="8" fill={C.creme} stroke={C.amareloDark} strokeWidth="4" />
    <text x="50" y="108" textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize="34" fill={C.tinta} opacity={1 - 0.5 * stamped}>{texto}</text>
  </svg>
);
export const Duvidas2: React.FC = () => {
  const f = useCurrentFrame();
  const b = B.card2;
  const tagIn = pop(f, b.tag, { damping: 8, stiffness: 150 });
  const swing = Math.sin(f * 0.11) * 9 + wiggle(f, b.stamp, 10, 0.4, 0.08);
  const stampY = interpolate(f, [b.stamp - 9, b.stamp], [-700, 0], { ...clamp, easing: Easing.in(Easing.quad) });
  const stamped = f >= b.stamp ? 1 : 0;
  const [ssx, ssy] = squash(f, b.stamp, 0.18);
  const happy = f >= b.stamp;
  return (
    <>
      <Fundo f={f} raios={[540, 1000]} seed="dv2" />
      {/* a etiqueta pendurada num barbante, balançando */}
      <div style={{ position: "absolute", left: 540, top: 690, transform: `rotate(${swing}deg) scale(${tagIn})`, transformOrigin: "0 0" }}>
        <svg width={6} height={70} style={{ position: "absolute", left: -3, top: 0 }}><path d="M3 0 V70" stroke={C.tinta} strokeWidth="5" strokeLinecap="round" /></svg>
        <div style={{ position: "absolute", left: -125, top: 70 - 250 * 0.19 }}>
          <Etiqueta w={250} texto="R$ ?" stamped={stamped} />
        </div>
      </div>
      {/* o carimbo "GRÁTIS" cai e carimba por cima da etiqueta */}
      {f >= b.stamp - 9 && (
        <div style={{ position: "absolute", left: 540, top: 1000 + stampY, transform: `translate(-50%, -50%) rotate(-12deg) scale(${ssx}, ${ssy})` }}>
          <div
            style={{
              padding: "14px 34px", borderRadius: 22, border: `9px solid ${C.verde}`, background: "rgba(255,249,241,0.94)", boxShadow: `inset 0 0 0 5px #fff, inset 0 0 0 9px ${C.verde}, 0 14px 26px rgba(34,28,25,0.18)`,
              fontFamily: FONT, fontWeight: W.black, fontSize: 92, color: C.verde, letterSpacing: 4, lineHeight: 1,
            }}
          >
            GRÁTIS
          </div>
        </div>
      )}
      <ConfettiBurst frame={f} start={b.confetti} x={-20} y={900} angle={-50} spread={36} power={44} count={24} seed="dv2cL" />
      <ConfettiBurst frame={f} start={b.confetti} x={1100} y={900} angle={-130} spread={36} power={44} count={24} seed="dv2cR" />
      <StarPops frame={f} start={b.stamp} cx={540} cy={1040} radius={240} count={8} seed="dv2st" size={50} />
      <Chao y={GROUND} at={b.shops[0]} f={f} />
      {SHOPS2.map((s, i) => (
        <Loja
          key={s.kind} f={f} kind={s.kind} x={s.x} ground={GROUND} w={170} at={b.shops[i]} seed={`dv2${i}`}
          mood={happy ? "happy" : "surprised"} look={happy ? [0, 0] : [(540 - s.x) / 500, -0.8]} sparkle={happy ? Math.min(1, (f - b.stamp) / 8) : 0} hop={happy ? 12 : 4}
        />
      ))}
      <Titulo f={f} linhas={T.card2.titulo} at={b.title} top={290} size={96} />
      <Apoio f={f} linhas={T.card2.apoio} at={b.support} top={520} />
      <Rodape f={f} at={b.foot} />
      <Toldo f={f} />
    </>
  );
};

// ---------------------------------------------------------------- CARD 3 · "Onde vai funcionar?"
// mapinha estilizado de Minas (forma simples); o pin coral cai no Glória com bounce e ondas; depois pins menores
// pipocam em volta ("mais cidades").
const MAP = { x: 150, y: 760, w: 780, h: 560 };
const GLORIA: [number, number] = [MAP.x + 300, MAP.y + 360]; // sudoeste de Minas, perto da Canastra
const OUTRAS: Array<[number, number]> = [[MAP.x + 180, MAP.y + 250], [MAP.x + 460, MAP.y + 250], [MAP.x + 560, MAP.y + 410], [MAP.x + 400, MAP.y + 470], [MAP.x + 620, MAP.y + 150]];
export const Duvidas3: React.FC = () => {
  const f = useCurrentFrame();
  const b = B.card3;
  const mapIn = pop(f, b.map, { damping: 11, stiffness: 140 });
  const pinY = dropBounce(f, b.pin, 600, b.pinLand - b.pin, 2);
  const [psx, psy] = squash(f, b.pinLand, 0.25);
  return (
    <>
      <Fundo f={f} raios={GLORIA} seed="dv3" />
      {/* o mapinha: uma forma simples de Minas, com rio e estradinhas */}
      <div style={{ position: "absolute", left: MAP.x, top: MAP.y, width: MAP.w, height: MAP.h, transform: `scale(${mapIn}) rotate(${Math.sin(f * 0.04) * 0.6}deg)`, transformOrigin: "50% 60%" }}>
        <svg width={MAP.w} height={MAP.h} viewBox="0 0 780 560" style={{ overflow: "visible" }}>
          <path
            d="M40 262 L120 196 L206 212 L262 150 L360 120 L420 60 L520 84 L604 58 L676 118 L742 214 L722 312 L652 394 L566 462 L478 500 L402 458 L330 482 L262 424 L196 388 L130 334 Z"
            fill="#D9EBC4" stroke={C.verde} strokeWidth="9" strokeLinejoin="round"
          />
          <path d="M170 330 C240 300 280 360 360 330 S520 300 640 330" stroke="#9FD0E8" strokeWidth="10" fill="none" strokeLinecap="round" />
          <path d="M260 220 C320 280 380 300 470 280 S600 230 650 260 M300 470 C320 400 360 360 430 340" stroke="#fff" strokeWidth="9" strokeDasharray="16 14" fill="none" strokeLinecap="round" />
        </svg>
        {[[220, 230], [560, 420], [640, 200]].map(([x, y], i) => (
          <div key={i} style={{ position: "absolute", left: x - 30, top: y - 70 }}><Tree size={60} sway={Math.sin(f * 0.1 + i) * 4} /></div>
        ))}
      </div>
      {/* ondas do pin do Glória */}
      {f >= b.pinLand &&
        [0, 18].map((d) => {
          const t = (f - b.pinLand + d) % 36;
          const r = 40 + t * 5;
          return <div key={d} style={{ position: "absolute", left: GLORIA[0] - r, top: GLORIA[1] - r * 0.45, width: r * 2, height: r * 0.9, borderRadius: "50%", border: `6px solid rgba(242,80,43,${0.4 * (1 - t / 36)})` }} />;
        })}
      {/* pins menores: mais cidades */}
      {OUTRAS.map(([x, y], i) => {
        const at = b.pins[i];
        if (f < at) return null;
        const p = pop(f, at, { damping: 8, stiffness: 200 });
        return (
          <div key={i} style={{ position: "absolute", left: x - 32, top: y - 80 + float(f, 50, 4, i), width: 64, transform: `scale(${p})`, transformOrigin: "50% 100%" }}>
            <MapPin size={64} color={i % 2 ? C.amarelo : C.coralLight} />
          </div>
        );
      })}
      {/* o pin coral do Glória */}
      {f >= b.pin && (
        <div style={{ position: "absolute", left: GLORIA[0] - 70, top: GLORIA[1] - 180 + pinY, width: 140, transform: `scale(${psx}, ${psy}) translateY(${f > b.pinLand + 20 ? float(f, 50, 6) : 0}px)`, transformOrigin: "50% 100%" }}>
          <MapPin size={140} />
        </div>
      )}
      <StarPops frame={f} start={b.pinLand} cx={GLORIA[0]} cy={GLORIA[1] - 100} radius={150} count={7} seed="dv3st" size={44} />
      {/* lojinhas nos cantos, de olho no mapa */}
      <Loja f={f} kind="padaria" x={150} ground={GROUND} w={150} at={b.shops[0]} seed="dv3a" look={[0.8, -0.6]} />
      <Loja f={f} kind="mercado" x={930} ground={GROUND} w={150} at={b.shops[1]} seed="dv3b" look={[-0.8, -0.6]} />
      <Titulo f={f} linhas={T.card3.titulo} at={b.title} top={290} size={96} />
      <Apoio f={f} linhas={T.card3.apoio} at={b.support} top={520} size={50} gap={60} />
      <Rodape f={f} at={b.foot} />
      <Toldo f={f} />
    </>
  );
};

// ---------------------------------------------------------------- CARD 4 · "Quando começa?"
// sininho grande balançando e tocando (ondas + sino); a faixa "EM BREVE" entra como no card 4 do "Conheça";
// a motinha passa ao fundo.
export const Duvidas4: React.FC = () => {
  const f = useCurrentFrame();
  const b = B.card4;
  const ribbonP = interpolate(f, [b.ribbon, b.ribbon + b.ribbonDur], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
  const bellIn = pop(f, b.bell, { damping: 8, stiffness: 180 });
  const glow = 0.75 + 0.25 * Math.sin(f * 0.18);
  const mp = (f - b.moto) / b.motoDur;
  const mx = lerp(-260, 1340, Math.max(0, Math.min(1, mp)));
  return (
    <>
      <Fundo f={f} raios={[540, 860]} seed="dv4" />
      {/* a rua ao fundo e a motinha passando */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 1380, height: 70, background: C.cremeDeep, opacity: 0.8 }} />
      <svg width={1080} height={10} style={{ position: "absolute", left: 0, top: 1410 }}><path d="M0 5 H1080" stroke={C.coral} strokeWidth="6" strokeDasharray="34 26" /></svg>
      {mp > 0 && mp < 1 && (
        <div style={{ position: "absolute", left: mx - 110, top: 1250 + Math.abs(Math.sin(f * 0.9)) * -6, width: 220 }}>
          <ScooterIcon size={220} wheelSpin={f * 24} />
        </div>
      )}
      <Loja f={f} kind="lanchonete" x={150} ground={1384} w={140} at={b.shops[0]} seed="dv4a" look={[Math.sin(f * 0.06), -0.5]} />
      <Loja f={f} kind="pet" x={930} ground={1384} w={140} at={b.shops[1]} seed="dv4b" look={[Math.sin(f * 0.06 + 2), -0.5]} />
      {/* a faixa EM BREVE */}
      {f >= b.ribbon && (
        <div style={{ position: "absolute", top: 410, left: 540 - 330 }}>
          <Ribbon text="EM BREVE" width={660} height={100} progress={ribbonP} fontSize={58} color={C.amarelo} foldColor={C.amareloDark} rollColor={C.amareloLight} textColor={C.tinta} />
        </div>
      )}
      {/* o sininho grande */}
      <div style={{ position: "absolute", left: 540 - 220, top: 830 - 220, width: 440, height: 440, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 66%)", transform: `scale(${bellIn * glow})` }} />
      <div style={{ position: "absolute", left: 540 - 150, top: 830 - 150, transform: `scale(${bellIn})` }}>
        <SwingBell size={300} frame={f} rings={b.bellRings} waveColor={C.coral} />
      </div>
      <StarPops frame={f} start={b.sting} cx={540} cy={830} radius={220} count={9} seed="dv4st" size={50} />
      {b.bellRings.map((r) => <StarPops key={r} frame={f} start={r} cx={540} cy={800} radius={190} count={5} seed={`dv4r${r}`} size={36} />)}
      <Titulo f={f} linhas={T.card4.titulo} at={b.title} top={290} size={100} />
      <Apoio f={f} linhas={T.card4.apoio} at={b.support} top={1030} size={52} gap={64} />
      <Rodape f={f} at={b.foot} />
      <Toldo f={f} />
    </>
  );
};

export const DUVIDAS_CARDS = [Duvidas1, Duvidas2, Duvidas3, Duvidas4];
void random;
