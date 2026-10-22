import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { C, FONT, W } from "../../config/theme";
import { clamp, float, lerp, pop, squash, wiggle } from "../../lib/anim";
import { ConfettiBurst, FloatingHearts, StarPops } from "../../components/Particles";
import { ChatIcon, MegaphoneIcon, PaperPlaneIcon, ScooterIcon, WaveHandIcon } from "../../components/AppIcons";
import { Apoio, Chao, Emoji, Fundo, Loja, Rodape, Titulo, Toldo } from "./kit";
import { LOJISTA as T } from "./texts";
import tl from "./config/lojista.json";

// DESTAQUE "LOJISTA" — 4 cenas animadas na linguagem do Story "Conheça". Nunca celular nem tela: o "celular da
// cidade" vira ondas e linhas pontilhadas da lojinha até as casinhas da cidade.
const B = tl.beats;
const GROUND = 1462;

// ---------------------------------------------------------------- CARD 1 · "Tem comércio no Glória? 👀"
// toldo cai e abre; uma lojinha grande no centro, olhos olhando pros lados e piscando; as outras espiando pelas bordas.
export const Lojista1: React.FC = () => {
  const f = useCurrentFrame();
  const b = B.card1;
  const lookX = Math.sin(f * 0.06) * 0.95;
  // as que espiam: entram de lado, inclinadas, e balançam "escondidas"
  const peek = (at: number, side: -1 | 1) => {
    const p = pop(f, at, { damping: 10, stiffness: 150 });
    return { x: side < 0 ? lerp(-60, 170, p) : lerp(1140, 910, p), rot: side * -(10 + Math.sin(f * 0.1) * 4) };
  };
  const pl = peek(b.peek[0], -1), pr = peek(b.peek[1], 1);
  return (
    <>
      <Fundo f={f} raios={[540, 1050]} seed="lj1" />
      <Chao y={GROUND} at={b.shop} f={f} />
      {f >= b.peek[0] && <Loja f={f} kind="mercado" x={pl.x} ground={GROUND} w={170} at={b.peek[0]} seed="lj1a" rot={pl.rot} look={[0.9, -0.2]} mood="surprised" />}
      {f >= b.peek[1] && <Loja f={f} kind="farmacia" x={pr.x} ground={GROUND} w={170} at={b.peek[1]} seed="lj1b" rot={pr.rot} look={[-0.9, -0.2]} mood="surprised" />}
      <div style={{ position: "absolute", left: 540 - 260, top: 1000, width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,222,120,0.55), rgba(249,178,51,0) 66%)", transform: `scale(${pop(f, b.shop) * (0.9 + 0.1 * Math.sin(f * 0.15))})` }} />
      <Loja f={f} kind="padaria" x={540} ground={GROUND} w={380} at={b.shop} seed="lj1c" look={[lookX, 0]} lit={1} bulbs={1} hop={5} sparkle={f > b.sparkle ? 0.6 + 0.4 * Math.sin(f * 0.2) : 0} />
      <StarPops frame={f} start={b.sparkle} cx={540} cy={1180} radius={250} count={9} seed="lj1st" size={52} />
      <Titulo f={f} linhas={T.card1.titulo} at={b.title} top={300} size={100} after={<Emoji f={f} e={T.card1.emoji!} size={100} />} />
      <Apoio f={f} linhas={T.card1.apoio} at={b.support} top={530} size={56} />
      <Rodape f={f} at={b.foot} />
      <Toldo f={f} cortina={{ drop: b.curtainDrop, open: b.curtainOpen, dur: b.curtainDur }} />
    </>
  );
};

// ---------------------------------------------------------------- CARD 2 · "Seu comércio no celular da cidade"
// SEM celular: a lojinha no centro emite ondas e linhas pontilhadas até casinhas em volta, que acendem as janelas
// uma a uma; a motinha sai da loja levando uma sacola.
const SHOP2 = { x: 540, ground: 1110, w: 250 };
const CASAS: Array<[number, number]> = [[190, 860], [890, 860], [200, 1330], [880, 1330]];
const Casinha: React.FC<{ w: number; lit: number; roof: string }> = ({ w, lit, roof }) => {
  const win = lit > 0.5 ? "#FFE48A" : "#8A7A6E";
  return (
    <svg width={w} height={w} viewBox="0 0 100 100" style={{ overflow: "visible", filter: lit > 0.5 ? `drop-shadow(0 0 ${14 * lit}px rgba(255,210,122,0.9))` : undefined }}>
      <rect x="18" y="44" width="64" height="50" rx="5" fill="#FFF3DF" />
      <path d="M8 48 L50 12 L92 48 Z" fill={roof} strokeLinejoin="round" />
      <rect x="28" y="56" width="18" height="16" rx="3" fill={win} />
      <rect x="56" y="56" width="18" height="16" rx="3" fill={win} />
      <rect x="44" y="74" width="14" height="20" rx="3" fill={C.coralDark} />
    </svg>
  );
};
export const Lojista2: React.FC = () => {
  const f = useCurrentFrame();
  const b = B.card2;
  const cy = SHOP2.ground - 150;
  const mp = interpolate(f, [b.moto, b.moto + b.motoDur], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const dest = CASAS[3];
  const mx = lerp(SHOP2.x + 60, dest[0] - 70, mp), my = lerp(SHOP2.ground + 30, dest[1] + 20, mp);
  return (
    <>
      <Fundo f={f} raios={[SHOP2.x, cy]} seed="lj2" />
      {/* ondas saindo da lojinha */}
      {f >= b.waves &&
        [0, 15, 30].map((d) => {
          const t = (f - b.waves + d) % 45;
          const r = 120 + t * 9;
          return <div key={d} style={{ position: "absolute", left: SHOP2.x - r, top: cy - r, width: r * 2, height: r * 2, borderRadius: "50%", border: `7px solid rgba(242,80,43,${0.32 * (1 - t / 45)})` }} />;
        })}
      {/* linhas pontilhadas até as casinhas */}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {CASAS.map(([x, y], i) => {
          const p = interpolate(f, [b.lines[i], b.lines[i] + 10], [0, 1], clamp);
          if (p <= 0) return null;
          const x0 = SHOP2.x, y0 = cy, x1 = lerp(x0, x, p), y1 = lerp(y0, y, p);
          return <path key={i} d={`M${x0} ${y0} L${x1} ${y1}`} stroke={C.coral} strokeWidth="9" strokeDasharray="2 20" strokeLinecap="round" strokeDashoffset={-f * 1.5} />;
        })}
      </svg>
      {CASAS.map(([x, y], i) => {
        const at = b.lines[i] + b.lightDelay;
        const inn = pop(f, b.lines[i] - 8, { damping: 10, stiffness: 170 });
        const lit = f >= at ? 1 : 0;
        return (
          <div key={i} style={{ position: "absolute", left: x - 80, top: y - 90 + float(f, 64, 3, i), width: 160, transform: `scale(${inn * (lit ? 1 + 0.06 * Math.max(0, 1 - (f - at) / 8) : 1)})` }}>
            <Casinha w={160} lit={lit} roof={[C.coral, C.verde, C.amareloDark, C.coralLight][i]} />
          </div>
        );
      })}
      {b.lines.map((l, i) => <StarPops key={i} frame={f} start={l + b.lightDelay} cx={CASAS[i][0]} cy={CASAS[i][1] - 10} radius={80} count={4} seed={`lj2s${i}`} size={34} />)}
      <Loja f={f} kind="mercado" x={SHOP2.x} ground={SHOP2.ground} w={SHOP2.w} at={b.shop} seed="lj2c" lit={1} bulbs={1} look={[Math.sin(f * 0.07) * 0.8, 0.2]} />
      {/* a motinha sai da loja levando a sacola */}
      {mp > 0 && mp < 1 && (
        <div style={{ position: "absolute", left: mx - 90, top: my - 150, width: 180, transform: `rotate(${Math.sin(f * 0.8) * 2}deg)` }}>
          <ScooterIcon size={180} wheelSpin={f * 24} />
          <div style={{ position: "absolute", left: 18, top: 2, width: 52, height: 56, borderRadius: 8, background: C.papel, border: `4px solid ${C.coral}` }}>
            <div style={{ position: "absolute", left: 10, top: -20, width: 24, height: 22, borderRadius: "12px 12px 0 0", border: `4px solid ${C.coral}`, borderBottom: "none" }} />
          </div>
        </div>
      )}
      <Titulo f={f} linhas={T.card2.titulo} at={b.title} top={290} size={90} gap={100} />
      <Apoio f={f} linhas={T.card2.apoio} at={b.support} top={510} size={52} gap={62} />
      <Rodape f={f} at={b.foot} />
      <Toldo f={f} />
    </>
  );
};

// ---------------------------------------------------------------- CARD 3 · "Parceiro desde o começo"
// selo "PARCEIRO" carimbado na lojinha; um megafone e um holofote apontando pra ela; estrelinhas e confete.
export const Lojista3: React.FC = () => {
  const f = useCurrentFrame();
  const b = B.card3;
  const spot = interpolate(f, [b.spot, b.spot + 6], [0, 1], clamp) * (0.85 + 0.15 * Math.sin(f * 0.2));
  const megaIn = pop(f, b.mega, { damping: 9, stiffness: 170 });
  const sealY = interpolate(f, [b.seal - 8, b.seal], [-600, 0], { ...clamp, easing: Easing.in(Easing.quad) });
  const [ssx, ssy] = squash(f, b.seal, 0.2);
  const on = f >= b.seal;
  return (
    <>
      <Fundo f={f} raios={[540, 1150]} seed="lj3" />
      {/* o holofote: um cone de luz do canto direito até a lojinha */}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: spot }}>
        <defs>
          <linearGradient id="lj3luz" x1="1" y1="0" x2="0.3" y2="1">
            <stop offset="0" stopColor="#FFE9A8" stopOpacity="0.95" />
            <stop offset="1" stopColor="#FFE9A8" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        <path d="M930 720 L330 1400 L760 1430 Z" fill="url(#lj3luz)" />
        <rect x="880" y="660" width="110" height="80" rx="18" fill={C.tinta} transform="rotate(32 935 700)" />
        <circle cx="905" cy="740" r="30" fill="#FFE9A8" />
      </svg>
      <Chao y={GROUND} at={b.shop} f={f} />
      <Loja f={f} kind="lanchonete" x={560} ground={GROUND} w={320} at={b.shop} seed="lj3c" lit={1} glow={on ? 0.5 + 0.2 * Math.sin(f * 0.15) : spot * 0.3} sparkle={on ? 1 : 0} bulbs={1} hop={on ? 10 : 4} />
      {/* o megafone */}
      {f >= b.mega && (
        <div style={{ position: "absolute", left: 110, top: 1010, width: 200, transform: `scale(${megaIn}) rotate(${-8 + Math.sin(f * 0.3) * 4}deg)`, transformOrigin: "20% 60%" }}>
          <MegaphoneIcon size={200} />
          {[0, 12].map((d) => {
            const t = (f - b.mega + d) % 24;
            return <div key={d} style={{ position: "absolute", left: 190 + t * 3, top: 60 - t * 1.4, width: 18 + t * 2, height: 80 + t * 4, borderRadius: "50%", borderRight: `6px solid rgba(249,178,51,${1 - t / 24})` }} />;
          })}
        </div>
      )}
      {/* o selo PARCEIRO carimbado na fachada */}
      {f >= b.seal - 8 && (
        <div style={{ position: "absolute", left: 560, top: 1392 + sealY, transform: `translate(-50%, -50%) rotate(-8deg) scale(${ssx}, ${ssy})` }}>
          <div
            style={{
              padding: "12px 30px", borderRadius: 999, background: C.verde, color: "#fff", fontFamily: FONT, fontWeight: W.black, fontSize: 64, letterSpacing: 3, lineHeight: 1,
              boxShadow: `inset 0 0 0 5px ${C.verdeDark}, inset 0 0 0 9px rgba(255,255,255,0.6), 0 9px 0 ${C.verdeDark}, 0 18px 30px rgba(34,28,25,0.2)`,
            }}
          >
            PARCEIRO
          </div>
        </div>
      )}
      <ConfettiBurst frame={f} start={b.confetti} x={-20} y={1000} angle={-52} spread={36} power={46} count={24} seed="lj3cL" />
      <ConfettiBurst frame={f} start={b.confetti} x={1100} y={1000} angle={-128} spread={36} power={46} count={24} seed="lj3cR" />
      <StarPops frame={f} start={b.seal} cx={560} cy={1180} radius={240} count={10} seed="lj3st" size={52} />
      <Titulo f={f} linhas={T.card3.titulo} at={b.title} top={290} size={96} />
      <Apoio f={f} linhas={T.card3.apoio} at={b.support} top={512} size={52} gap={62} />
      <Rodape f={f} at={b.foot} />
      <Toldo f={f} />
    </>
  );
};

// ---------------------------------------------------------------- CARD 4 · "Quer saber mais?"
// um aviãozinho de papel sai da lojinha fazendo uma curva e voa até um balão de mensagem que pulsa; a lojinha acena.
const SHOP4 = { x: 280, ground: 1450, w: 280 };
const BAL = { x: 760, y: 860 };
export const Lojista4: React.FC = () => {
  const f = useCurrentFrame();
  const b = B.card4;
  const u = interpolate(f, [b.plane, b.plane + b.planeDur], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  // curva de Bézier da porta da lojinha até o balão (com uma volta pra cima)
  const P0 = [SHOP4.x + 60, SHOP4.ground - 140], P1 = [180, 640], P2 = [620, 1260], P3 = [BAL.x - 40, BAL.y + 10];
  const bz = (t: number, i: number) => (1 - t) ** 3 * P0[i] + 3 * (1 - t) ** 2 * t * P1[i] + 3 * (1 - t) * t * t * P2[i] + t ** 3 * P3[i];
  const px = bz(u, 0), py = bz(u, 1);
  const ang = (Math.atan2(bz(Math.min(1, u + 0.02), 1) - py, bz(Math.min(1, u + 0.02), 0) - px) * 180) / Math.PI;
  const balIn = pop(f, b.balloon, { damping: 8, stiffness: 170 });
  const pulse = f >= b.balloon ? 1 + 0.05 * Math.sin((f - b.balloon) * 0.25) : 1;
  const waveAng = f >= b.wave ? Math.sin((f - b.wave) * 0.45) * 22 : 0;
  return (
    <>
      <Fundo f={f} raios={[BAL.x, BAL.y]} seed="lj4" />
      {/* rastro pontilhado do aviãozinho */}
      {u > 0 && (
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <path
            d={Array.from({ length: 40 }, (_, k) => k / 39 * u).map((t, k) => `${k ? "L" : "M"}${bz(t, 0)} ${bz(t, 1)}`).join(" ")}
            stroke={C.coral} strokeWidth="7" strokeDasharray="2 18" strokeLinecap="round" fill="none" opacity="0.7"
          />
        </svg>
      )}
      {/* o balão de mensagem que pulsa */}
      {f >= b.balloon && (
        <>
          {[0, 20].map((d) => {
            const t = (f - b.balloon + d) % 40;
            const r = 150 + t * 5;
            return <div key={d} style={{ position: "absolute", left: BAL.x - r, top: BAL.y - r, width: r * 2, height: r * 2, borderRadius: "50%", border: `7px solid rgba(242,80,43,${0.3 * (1 - t / 40)})` }} />;
          })}
          <div style={{ position: "absolute", left: BAL.x - 150, top: BAL.y - 150, width: 300, transform: `scale(${balIn * pulse})` }}>
            <ChatIcon size={300} />
          </div>
          <FloatingHearts frame={f} start={b.balloon + 6} sources={[[BAL.x + 90, BAL.y - 110]]} seed="lj4h" size={50} rise={180} />
        </>
      )}
      {u > 0 && u < 1 && (
        <div style={{ position: "absolute", left: px - 60, top: py - 60, width: 120, transform: `rotate(${ang + 20}deg)` }}>
          <PaperPlaneIcon size={120} color={C.coral} />
        </div>
      )}
      <StarPops frame={f} start={b.sting} cx={BAL.x} cy={BAL.y} radius={200} count={9} seed="lj4st" size={50} />
      <Chao y={SHOP4.ground} at={b.shop} f={f} />
      <Loja f={f} kind="restaurante" x={SHOP4.x} ground={SHOP4.ground} w={SHOP4.w} at={b.shop} seed="lj4c" lit={1} look={[0.8, -0.5]} hop={8} />
      {f >= b.wave && (
        <div style={{ position: "absolute", left: SHOP4.x + 120, top: SHOP4.ground - 330, transform: `rotate(${waveAng}deg) scale(${pop(f, b.wave)})`, transformOrigin: "40% 90%" }}>
          <WaveHandIcon size={130} />
        </div>
      )}
      <Titulo f={f} linhas={T.card4.titulo} at={b.title} top={300} size={100} />
      <Apoio f={f} linhas={T.card4.apoio} at={b.support} top={430} size={58} />
      <Rodape f={f} at={b.foot} />
      <Toldo f={f} />
    </>
  );
};

export const LOJISTA_CARDS = [Lojista1, Lojista2, Lojista3, Lojista4];
void wiggle;
