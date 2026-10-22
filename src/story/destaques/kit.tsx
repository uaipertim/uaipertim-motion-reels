import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, random, staticFile } from "remotion";
import { C, FONT, W } from "../../config/theme";
import { clamp, pop, wiggle } from "../../lib/anim";
import { CremeBackground } from "../../components/Decor";
import { Twinkles } from "../../components/Particles";
import { PopWords } from "../../components/Text";
import { SHOP_RATIO, ShopChar, ShopCharKind } from "../../components/Town";
import type { Mood } from "../../components/Phone";

// KIT DOS STORIES DE DESTAQUE — as peças do Story "Conheça" usadas em todas as cenas dos destaques
// (Dúvidas, Lojista, Explica, Sô!): toldo listrado no topo (cortina que cai e abre no 1º card), fundo creme com
// raios de sol, lojinhas-personagem com olhos que piscam/olham, textos que pipocam palavra por palavra
// (destaque em coral) e o rodapé com a logo oficial. Zona segura: conteúdo entre y 250–1600 e x 80–1000.

export const CARD = { frames: 180, fps: 30 };
// layout vertical (como o Card1 do "Conheça", que apoia as lojinhas no chão perto do pé da tela):
// título e apoio em cima (y 290+), cena no meio, chão com as lojinhas em CHAO, rodapé logo abaixo (até ~y 1734).
export const CHAO = 1600;
export const FILA4 = [185, 412, 668, 895]; // 4 lojinhas de LOJA_W lado a lado, dentro de x 80–1000
export const LOJA_W = 196;

// a cena central ampliada/deslocada sem mexer nas animações: escala k em torno de (px, py) + desce dy
export const Cena: React.FC<{ k: number; px?: number; py: number; dy?: number; children: React.ReactNode }> = ({ k, px = 540, py, dy = 0, children }) => (
  <AbsoluteFill style={{ transform: `translateY(${dy}px) scale(${k})`, transformOrigin: `${px}px ${py}px` }}>{children}</AbsoluteFill>
);

// ---------------------------------------------------------------- toldo
const STRIPES = [C.coral, "#fff", C.amarelo, "#fff"];
const SW = 90;
const Stripes: React.FC<{ width: number; height: number; start?: number; scallop?: boolean }> = ({ width, height, start = 0, scallop = false }) => {
  const n = Math.ceil(width / SW) + 1;
  return (
    <svg width={width} height={height + (scallop ? SW / 2 : 0)} style={{ display: "block", overflow: "visible" }}>
      {Array.from({ length: n }).map((_, i) => {
        const x = i * SW;
        const col = STRIPES[(i + start) % STRIPES.length];
        return (
          <g key={i}>
            <rect x={x} y={0} width={SW + 0.5} height={height} fill={col} />
            {scallop && <path d={`M${x} ${height} A${SW / 2} ${SW / 2} 0 0 0 ${x + SW} ${height} Z`} fill={col} />}
          </g>
        );
      })}
      {Array.from({ length: n }).map((_, i) => (
        <rect key={`d${i}`} x={i * SW + SW * 0.62} y={0} width={SW * 0.38} height={height} fill="#000" opacity={0.05} />
      ))}
    </svg>
  );
};

// O toldo do topo: no 1º card do destaque a cortina listrada cai e abre (como no "Conheça"); nos outros, só a
// bainha, que balança de leve o tempo todo. A bainha ocupa y 0–~200 (fora da zona segura de conteúdo).
const VALANCE_H = 150;
export const Toldo: React.FC<{ f: number; cortina?: { drop: number; open: number; dur: number } }> = ({ f, cortina }) => {
  const drop = cortina ? interpolate(f, [cortina.drop, cortina.drop + 12], [-1, 0], { ...clamp, easing: Easing.out(Easing.back(1.3)) }) : 0;
  const open = cortina ? interpolate(f, [cortina.open, cortina.open + cortina.dur], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) }) : 1;
  const sway = Math.sin(f * 0.12) * 1.2 + (cortina ? wiggle(f, cortina.open + cortina.dur, 3, 0.5, 0.1) : 0);
  return (
    <>
      {open < 1 && (
        <>
          <div style={{ position: "absolute", left: -540 * open * 1.05, top: drop * 1920, width: 540, height: 1920, overflow: "hidden" }}>
            <Stripes width={540} height={1920} />
          </div>
          <div style={{ position: "absolute", left: 540 + 540 * open * 1.05, top: drop * 1920, width: 540, height: 1920, overflow: "hidden" }}>
            <Stripes width={540} height={1920} start={540 / SW} />
          </div>
        </>
      )}
      <div style={{ position: "absolute", left: 0, top: drop * 1920 - 6, width: 1080, transform: `skewX(${sway}deg)`, transformOrigin: "50% 0%" }}>
        <Stripes width={1080} height={VALANCE_H} scallop />
        <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 22, background: "#fff", boxShadow: "0 6px 0 rgba(34,28,25,0.08)" }} />
      </div>
    </>
  );
};

// ---------------------------------------------------------------- fundo
const TWINK: Array<[number, number]> = [[110, 330], [970, 300], [70, 1010], [1010, 900], [140, 1380], [950, 1340]];
export const Fundo: React.FC<{ f: number; raios?: [number, number]; seed: string }> = ({ f, raios = [540, 900], seed }) => (
  <>
    <CremeBackground frame={f} rays raysCenter={raios} raysOpacity={0.14} />
    <Twinkles frame={f} seed={seed} points={TWINK} size={30} />
  </>
);

// ---------------------------------------------------------------- lojinha viva
// pisca a cada ~2,5 s (fase própria), olha para `look` e dá pulinhos de leve; `at` = quando brota do chão.
export const blink = (f: number, seed: string, period = 74) => {
  const ph = Math.floor(random(seed) * period);
  const t = (f + ph) % period;
  return t < 3 ? [0.5, 1, 0.5][t] : 0;
};
export const Loja: React.FC<{
  f: number; kind: ShopCharKind; x: number; ground: number; w: number; at: number; seed: string;
  mood?: Mood; look?: [number, number]; lit?: number; glow?: number; sparkle?: number; bulbs?: number; hop?: number; rot?: number; z?: number;
}> = ({ f, kind, x, ground, w, at, seed, mood = "happy", look = [0, 0], lit = 0.6, glow = 0, sparkle = 0, bulbs = 0, hop = 6, rot = 0, z }) => {
  if (f < at) return null;
  const g = pop(f, at, { damping: 9, stiffness: 170 });
  const ph = random(`${seed}-ph`) * 6;
  const wave = Math.sin((f - at) * 0.2 + ph);
  return (
    <div
      style={{
        position: "absolute", left: x - w / 2, top: ground - w * SHOP_RATIO, width: w, height: w * SHOP_RATIO, zIndex: z,
        transform: `translateY(${-Math.abs(wave) * hop}px) rotate(${rot}deg) scale(${0.6 + 0.4 * g}, ${g})`, transformOrigin: "50% 100%",
      }}
    >
      <ShopChar
        kind={kind} width={w} mood={mood} look={look} blink={blink(f, seed)} lit={lit} glow={glow} sparkle={sparkle}
        awning={0.35 + 0.35 * wave} signSwing={wave * 6} bulbs={bulbs} bulbPhase={f}
      />
    </div>
  );
};

// ---------------------------------------------------------------- textos
// Uma linha = lista de trechos; trecho com `c: true` vai em coral (a palavra de destaque).
export type Trecho = { t: string; c?: boolean };
export type Linha = Trecho[];
export const L = (...p: Array<string | [string]>): Linha => p.map((x) => (typeof x === "string" ? { t: x } : { t: x[0], c: true }));

export const Titulo: React.FC<{ f: number; linhas: Linha[]; at: number; top: number; size?: number; gap?: number; after?: React.ReactNode }> = ({
  f, linhas, at, top, size = 108, gap, after,
}) => (
  <>
    {linhas.map((ln, i) => (
      <div key={i} style={{ position: "absolute", top: top + i * (gap ?? size * 1.08), left: 0, right: 0 }}>
        <PopWords
          parts={ln.map((p) => ({ t: p.t, color: p.c ? C.coral : undefined }))} frame={f} start={at + i * 6} stagger={3} size={size}
          after={i === linhas.length - 1 ? after : undefined}
        />
      </div>
    ))}
  </>
);
export const Apoio: React.FC<{ f: number; linhas: Linha[]; at: number; top: number; size?: number; gap?: number }> = ({ f, linhas, at, top, size = 58, gap = 70 }) => (
  <>
    {linhas.map((ln, i) => (
      <div key={i} style={{ position: "absolute", top: top + i * gap, left: 0, right: 0 }}>
        <PopWords
          parts={ln.map((p) => ({ t: p.t, color: p.c ? C.coral : undefined }))} frame={f} start={at + i * 5} stagger={2} size={size}
          weight={W.extraBold} color="#5A4A42"
        />
      </div>
    ))}
  </>
);
// emoji grande ao fim da linha (como o 👋 do "Conheça"), balançando
export const Emoji: React.FC<{ f: number; e: string; size: number }> = ({ f, e, size }) => (
  <span style={{ display: "inline-block", fontSize: size * 0.9, lineHeight: 1, transform: `rotate(${Math.sin(f * 0.18) * 10}deg)`, fontFamily: "'Noto Color Emoji'" }}>{e}</span>
);

// ---------------------------------------------------------------- rodapé: a logo oficial (o arquivo) + a frase, sem @
export const Rodape: React.FC<{ f: number; at: number }> = ({ f, at }) => {
  const e = pop(f, at, { damping: 12, stiffness: 160 });
  return (
    <div style={{ position: "absolute", top: CHAO + 50, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 18, opacity: Math.min(1, e * 1.4), transform: `translateY(${(1 - e) * 30}px)` }}>
      <Img src={staticFile("img/uaipertim_logo.png")} style={{ width: 84, height: 84, filter: "drop-shadow(0 6px 10px rgba(198,58,23,0.25))", transform: `rotate(${Math.sin(f * 0.08) * 3}deg)` }} />
      <span style={{ fontFamily: FONT, fontWeight: W.extraBold, fontSize: 40, color: C.tinta, letterSpacing: -0.5 }}>
        Tudo <span style={{ color: C.coral }}>pertim de você.</span>
      </span>
    </div>
  );
};

// chão das lojinhas (faixa creme escura, como no "Conheça")
export const Chao: React.FC<{ y: number; at: number; f: number }> = ({ y, at, f }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: y - 6, height: 40, background: C.cremeDeep, opacity: Math.min(1, pop(f, at)) }} />
);

export const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => <AbsoluteFill style={{ background: C.creme }}>{children}</AbsoluteFill>;
