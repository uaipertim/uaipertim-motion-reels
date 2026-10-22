import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { C, FONT, W } from "../../config/theme";
import { clamp, pop, squash } from "../../lib/anim";
import { StarPops } from "../../components/Particles";
import { ScooterIcon } from "../../components/AppIcons";
import { Apoio, Fundo, Loja, Rodape, Titulo, Toldo } from "./kit";
import { EXPLICA_SO as T } from "./texts";
import tl from "./config/explica-so.json";

// DESTAQUE "EXPLICA, SÔ!" — 1 cena: a rua tracejada coral da série com a motinha percorrendo e lojinhas ao longo
// dela; o chip "SÉRIE NOVA" carimba, o título pula e um botão de play pulsa.
const B = tl.beats.card1;
const RUA = (x: number) => 1290 + 40 * Math.sin((x / 1080) * Math.PI * 2); // a rua faz uma curva suave
const SHOPS = [
  { kind: "padaria", x: 200 }, { kind: "mercado", x: 540 }, { kind: "lanchonete", x: 880 },
] as const;

export const ExplicaSo1: React.FC = () => {
  const f = useCurrentFrame();
  const roadP = interpolate(f, [B.road, B.road + 16], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const chipY = interpolate(f, [B.chip - 6, B.chip], [-260, 0], { ...clamp, easing: Easing.in(Easing.quad) });
  const [csx, csy] = squash(f, B.chip, 0.2);
  const playIn = pop(f, B.play, { damping: 8, stiffness: 170 });
  const pulse = 1 + 0.07 * Math.sin((f - B.play) * 0.2);
  // a motinha percorre a rua em loop (entra pela esquerda, sai pela direita)
  const loop = 72;
  const mt = f >= B.moto ? ((f - B.moto) % loop) / loop : -1;
  const mx = -160 + mt * 1400;
  const pts = Array.from({ length: 55 }, (_, k) => k * 20);
  return (
    <>
      <Fundo f={f} raios={[540, 880]} seed="es1" />
      {/* as lojinhas ao longo da rua */}
      {SHOPS.map((s, i) => (
        <Loja key={s.kind} f={f} kind={s.kind} x={s.x} ground={RUA(s.x) - 40} w={170} at={B.shops[i]} seed={`es1${i}`} look={[mt >= 0 ? Math.max(-1, Math.min(1, (mx - s.x) / 300)) : 0, 0.3]} lit={0.8} />
      ))}
      {/* a rua da série: faixa clara com o tracejado coral */}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, clipPath: `inset(0 ${(1 - roadP) * 100}% 0 0)` }}>
        <path d={pts.map((x, k) => `${k ? "L" : "M"}${x - 20} ${RUA(x - 20)}`).join(" ")} stroke={C.cremeDeep} strokeWidth="84" fill="none" strokeLinecap="round" />
        <path d={pts.map((x, k) => `${k ? "L" : "M"}${x - 20} ${RUA(x - 20)}`).join(" ")} stroke={C.coral} strokeWidth="9" strokeDasharray="34 26" strokeDashoffset={-f * 3} fill="none" />
      </svg>
      {mt >= 0 && (
        <div style={{ position: "absolute", left: mx - 90, top: RUA(mx) - 150 + Math.abs(Math.sin(f * 0.9)) * -5, width: 180 }}>
          <ScooterIcon size={180} wheelSpin={f * 24} />
        </div>
      )}
      {/* o botão de play pulsando */}
      {f >= B.play && (
        <div style={{ position: "absolute", left: 540 - 95, top: 900 - 95, width: 190, height: 190, transform: `scale(${playIn * pulse})` }}>
          {[0, 18].map((d) => {
            const t = (f - B.play + d) % 36;
            const r = 95 + t * 3.5;
            return <div key={d} style={{ position: "absolute", left: 95 - r, top: 95 - r, width: r * 2, height: r * 2, borderRadius: "50%", border: `6px solid rgba(242,80,43,${0.35 * (1 - t / 36)})` }} />;
          })}
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: C.coral, boxShadow: `0 10px 0 ${C.coralDark}, 0 20px 34px rgba(198,58,23,0.3)` }} />
          <svg width={190} height={190} viewBox="0 0 100 100" style={{ position: "absolute", inset: 0 }}><path d="M40 30 L72 50 L40 70 Z" fill="#fff" strokeLinejoin="round" stroke="#fff" strokeWidth="6" /></svg>
        </div>
      )}
      <StarPops frame={f} start={B.sting} cx={540} cy={900} radius={180} count={9} seed="es1st" size={46} />
      <StarPops frame={f} start={B.title} cx={540} cy={460} radius={260} count={7} seed="es1t" size={44} />
      {/* o chip SÉRIE NOVA carimbando */}
      {f >= B.chip - 6 && (
        <div style={{ position: "absolute", top: 300 + chipY, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `scale(${csx}, ${csy}) rotate(-3deg)` }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 14, background: C.coral, borderRadius: 999, padding: "12px 34px", boxShadow: `0 8px 0 ${C.coralDark}` }}>
            <svg width={40} height={40} viewBox="0 0 24 24"><path d="M13 2 L4 14 H11 L10 22 L20 9 H13 Z" fill={C.amarelo} /></svg>
            <span style={{ fontFamily: FONT, fontWeight: W.black, fontSize: 44, color: "#fff", letterSpacing: 2 }}>{T.card1.chip}</span>
          </div>
        </div>
      )}
      <Titulo f={f} linhas={T.card1.titulo} at={B.title} top={400} size={124} />
      <Apoio f={f} linhas={T.card1.apoio} at={B.support} top={565} size={52} gap={64} />
      <Rodape f={f} at={B.foot} />
      <Toldo f={f} cortina={{ drop: B.curtainDrop, open: B.curtainOpen, dur: B.curtainDur }} />
    </>
  );
};

export const EXPLICA_SO_CARDS = [ExplicaSo1];
