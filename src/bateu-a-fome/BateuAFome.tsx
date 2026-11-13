import React, { useMemo } from "react";
import { loadFont } from "@remotion/fonts";
import { AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { C, FONT, W } from "../config/theme";
import { CoralBackground, CremeBackground, Sunburst } from "../components/Decor";
import { ConfettiBurst, FivePointStar, StarShape, Twinkles } from "../components/Particles";
import { ShopChar, ShopCharKind, SHOP_RATIO } from "../components/Town";
import { MapPin } from "../components/Scenery";
import { BreadIcon, BurgerIcon, CartIcon } from "../components/Icons";
import { Phone } from "../components/Phone";
import { Pertim, PertimRig } from "../personagem/Pertim";
import type { Expressao, Pose } from "../personagem/logica";
import { Legenda, LegendaDados } from "../personagem/Legenda";
import { bocaNoQuadro, piscadaEm, respiracao, Visemas } from "../personagem/rig";
import { Adesivo, clamp01, inCubic, inOut, LinhasVelocidade, outBack, outCubic, Puf, Selo } from "../pedir-no-uaipertim/efeitos";
import LAYOUT from "../../reels/bateu-a-fome/layout.json";
import CENA from "../../reels/bateu-a-fome/dados/cena.json";
import VISEMAS from "../../reels/bateu-a-fome/dados/visemas.json";
import LEGENDA from "../../reels/bateu-a-fome/dados/legenda.json";

// REEL "BATEU A FOME?" (1080×1920, 30 fps): comercial rápido no ritmo de anúncio de delivery, narrado pelo Pertim.
// A voz, a linha do tempo (todo corte numa batida da trilha animada, 120 BPM) e a mixagem vêm do pipeline do Explica, Sô!
// (reels/bateu-a-fome/roteiro.json); os tempos de cada peça, de reels/bateu-a-fome/dados/ (scripts/preparar.py, amarrados às
// palavras da voz); as posições, de reels/bateu-a-fome/layout.json.
//   1 gancho:    "Bateu a fome?" escrito à mão (traço animado) + o Pertim falando, olhando para a câmera;
//   2 logo:      o pin cai, quica, o toldo abre e a logo explode em fundo coral (íris coral a partir do impacto);
//   3 lojas:     fileiras de lojinhas com olhinhos descendo rápido; param e a moldura fecha "num lugar só" (empurra para baixo);
//   4 na mão:    zoom-out: as lojinhas viram a tela de um celular genérico numa mão; "Na palma da sua mão!";
//   5 desfile:   zoom pela tela; palavras GIGANTES em sílabas (cada sílaba na voz), foto em adesivo e o botão "+";
//                cada palavra entra numa batida, com a cor varrendo da direita;
//   6 pagamento: as três faixas da tela caem e revelam os selos Pix, Cartão e Na entrega, carimbados na palavra;
//   7 rapidim:   chicote horizontal; "RAPIDIM" passa ao fundo e o Pertim atravessa de motinha; o mapa entra e a rota
//                pontilhada vai do pin até a casinha;
//   8 chegou:    íris verde saindo da porta da casinha; check verde, "Seu pedido chegou!" e 5 estrelas acendendo;
//   9 fecho:     faixa amarela; "Foi facim!" escrito à mão, a logo (para e fica até o fim), "Tudo pertim de você." e o
//                selo "Em breve no Glória"; o Pertim acena.
// Sem preços, sem nomes de lojas, sem telas do app. A legenda gravada fica na faixa de baixo (abaixo de tudo).

const caveat = loadFont({ family: "Caveat", url: staticFile("fonts/caveat-latin-700-normal.woff2"), weight: "700", format: "woff2" });
export const caveatReady = caveat;
const HAND = "Caveat";

const L = LAYOUT as typeof LAYOUT;
const EV = CENA.eventos;
const FPS = CENA.fps;
const S = CENA.cenas;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const entre = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const mola = (t: number, t0: number, dur = 0.35, s = 1.9) => outBack((t - t0) / dur, s);
const PESSEGO = "#FBE3CC";

// ---------------------------------------------------------------- o Pertim (boca pela voz, olhando para a câmera)
const VB: Record<string, [number, number]> = { moto: [300, 254], parado: [240, 270] };
const larguraDe = (pose: string, altura: number) => { const [w, h] = VB[pose] ?? [280, 284]; return (altura * w) / h; };
const falandoEm = (t: number) => S.some((c) => t >= c.voz_t0 - 0.02 && t <= c.voz_t1 + 0.04);

const PertimEm: React.FC<{
  t: number; quadro: number; pose: Pose; expr: Expressao; cx: number; base: number; altura: number;
  rot?: number; extra?: Partial<PertimRig>; alpha?: number; escala?: [number, number];
}> = ({ t, quadro, pose, expr, cx, base, altura, rot = 0, extra, alpha = 1, escala = [1, 1] }) => {
  const boca = bocaNoQuadro(VISEMAS as Visemas, quadro, falandoEm(t));
  const w = larguraDe(pose, altura);
  const rig: PertimRig = { ...respiracao(t), piscada: piscadaEm(CENA.piscadas, t, CENA.piscada_dur), olhar: [0, 0], centro: true, ...extra };
  return (
    <div style={{ position: "absolute", left: cx - w / 2, top: base - altura, width: w, height: altura, opacity: alpha,
      transform: `rotate(${rot}deg) scale(${escala[0]}, ${escala[1]})`, transformOrigin: "50% 95%" }}>
      <Pertim v={1} pose={pose} expr={expr} mouth={boca ?? "auto"} altura={altura} rig={rig} />
    </div>
  );
};

// ---------------------------------------------------------------- escrita à mão: cada letra se desenha da esquerda para a
// direita (a "ponta da caneta" passa por ela), no tempo de cada parte
type Parte = { s: string; t0: number; t1: number; cor: string; pula?: boolean };
const Manuscrito: React.FC<{ t: number; partes: Parte[]; cx: number; cy: number; size: number; rot?: number; sombra?: string }> = ({
  t, partes, cx, cy, size, rot = -3, sombra = "rgba(34,28,25,0.16)",
}) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: cy - size * 0.62, height: size * 1.24, display: "flex", justifyContent: "center", alignItems: "center",
    transform: `rotate(${rot}deg)`, transformOrigin: `${cx}px ${size * 0.62}px` }}>
    {partes.map((p, pi) => {
      const letras = [...p.s];
      const n = letras.filter((c) => c !== " ").length || 1;
      let k = -1;
      return (
        <span key={pi} style={{ display: "inline-flex", marginLeft: pi && !p.pula ? size * 0.2 : p.pula ? size * 0.03 : 0 }}>
          {letras.map((ch, i) => {
            if (ch === " ") return <span key={i} style={{ width: size * 0.2 }} />;
            k++;
            const a = p.t0 + ((p.t1 - p.t0) * k) / n, d = Math.max(0.06, ((p.t1 - p.t0) / n) * 1.7);
            const u = clamp01((t - a) / d);
            if (u <= 0) return <span key={i} style={{ fontFamily: HAND, fontWeight: 700, fontSize: size, lineHeight: 1, color: "transparent" }}>{ch}</span>;
            const pulo = p.pula ? outBack((t - a) / 0.32, 3.2) : 1;
            const balanco = p.pula ? Math.sin((t - a) * 14) * 10 * Math.exp(-(t - a) * 4) : 0;
            return (
              // a caixa da letra ganha folga (padding) para a haste do "f" e o pingo do "i", que passam da altura da linha:
              // o recorte (inset, sempre ≥ 0) corta só da direita, e some quando a letra termina
              <span key={i} style={{ fontFamily: HAND, fontWeight: 700, fontSize: size, lineHeight: 1, color: p.cor, display: "inline-block",
                padding: `${size * 0.45}px ${size * 0.08}px ${size * 0.3}px`, margin: `${-size * 0.45}px ${-size * 0.08}px ${-size * 0.3}px`,
                clipPath: p.pula || u >= 1 ? undefined : `inset(0 ${(1 - u) * 100}% 0 0)`, textShadow: `0 ${size * 0.03}px 0 ${sombra}`,
                transform: `translateY(${(1 - outCubic(u)) * size * 0.04}px) scale(${pulo}) rotate(${balanco}deg)`, transformOrigin: "50% 80%" }}>
                {ch}
              </span>
            );
          })}
        </span>
      );
    })}
  </div>
);

// o rabisco amarelo de marcador, que se desenha (u 0..1)
const Rabisco: React.FC<{ x: number; y: number; w: number; u: number; cor?: string; esp?: number }> = ({ x, y, w, u, cor = C.amarelo, esp = 22 }) =>
  u <= 0 ? null : (
    <svg width={w + 40} height={60} viewBox={`-20 -30 ${w + 40} 60`} style={{ position: "absolute", left: x - 20, top: y - 30, overflow: "visible" }}>
      <path d={`M0 6 C${w * 0.3} -6, ${w * 0.6} 12, ${w} -2`} stroke={cor} strokeWidth={esp} strokeLinecap="round" fill="none" pathLength={1}
        strokeDasharray="1 1" strokeDashoffset={1 - u} />
    </svg>
  );

// medir texto em Poppins (as fontes já estão carregadas no calculateMetadata)
const useMedir = (peso: number) => useMemo(() => {
  const c = document.createElement("canvas").getContext("2d")!;
  return (s: string, size: number) => { c.font = `${peso} ${size}px ${FONT}`; return c.measureText(s).width; };
}, [peso]);

// ================================================================ 1 · GANCHO
const Gancho: React.FC<{ t: number; quadro: number }> = ({ t, quadro }) => {
  const G = EV.gancho, g = L.gancho, P = L.pertim.gancho;
  const [eb, ea, ef] = G.escrita;
  const sobe = 0.5 + 0.5 * outBack(t / 0.38, 1.6);
  const sub = entre(t, G.interrogacao - 0.12, G.interrogacao + 0.18);
  return (
    <AbsoluteFill>
      <CremeBackground frame={quadro} rays raysCenter={[540, 760]} raysOpacity={0.16} />
      <Twinkles frame={quadro} seed="bf-gancho" points={[[140, 380], [950, 330], [120, 900], [960, 880]]} size={30} />
      <Manuscrito t={t} cx={540} cy={g.cy[0]} size={g.size} partes={[{ s: "Bateu", t0: eb[0], t1: eb[1], cor: C.tinta }, { s: "a", t0: ea[0], t1: ea[1], cor: C.tinta }]} />
      <Rabisco x={300} y={g.cy[1] + 86} w={400} u={sub} />
      <Manuscrito t={t} cx={540} cy={g.cy[1]} size={g.size * 1.12} rot={-2}
        partes={[{ s: "fome", t0: ef[0], t1: ef[1], cor: C.coral }, { s: "?", t0: G.interrogacao, t1: G.interrogacao + 0.01, cor: C.coral, pula: true }]} />
      {/* os traços de "ronco" da fome, tremendo ao lado do Pertim */}
      {[-1, 1].map((lado) => (
        <svg key={lado} width={120} height={160} viewBox="0 0 60 80" style={{ position: "absolute", left: 540 + lado * 250 - 60, top: 1010 + Math.sin(t * 30 + lado) * 4, opacity: entre(t, 0.35, 0.5), transform: `scaleX(${lado})` }}>
          {[0, 1, 2].map((i) => <path key={i} d={`M${10 + i * 16} ${18 + i * 6} q8 -8 0 -16`} stroke={C.coral} strokeWidth={5} strokeLinecap="round" fill="none" transform={`rotate(${-20 + i * 20} 30 40)`} />)}
        </svg>
      ))}
      <PertimEm t={t} quadro={quadro} pose="parado" expr="alegre" cx={P.cx} base={P.base + (1 - sobe) * 520} altura={P.altura} />
    </AbsoluteFill>
  );
};

// ================================================================ 2 · LOGO (pin cai, quica, toldo abre, a logo explode)
const Toldo: React.FC<{ w: number; abre: number }> = ({ w, abre }) => {
  const n = 7, h = 150, sw = w / n;
  return (
    <svg width={w} height={h + 60} viewBox={`0 0 ${w} ${h + 60}`} style={{ overflow: "visible" }}>
      <rect x={-14} y={-26} width={w + 28} height={30} rx={12} fill={C.coralDark} />
      <g transform={`scale(1 ${Math.max(0.02, abre)})`}>
        {Array.from({ length: n }).map((_, i) => (
          <path key={i} d={`M${i * sw} 0 H${(i + 1) * sw} V${h} A${sw / 2} ${sw / 2.4} 0 0 1 ${i * sw} ${h} Z`} fill={i % 2 ? C.creme : C.amarelo} />
        ))}
        <path d={`M0 ${h * 0.55} H${w}`} stroke="rgba(34,28,25,0.08)" strokeWidth={10} />
      </g>
    </svg>
  );
};

const Logo: React.FC<{ t: number; quadro: number }> = ({ t, quadro }) => {
  const E = EV.logo, lg = L.logo;
  const iris = interpolate(t, [E.bate, E.bate + 0.28], [0, 2300], { ...clamp, easing: (x) => outCubic(x) });
  // o pin: cai da batida do corte até o impacto, amassa e quica uma vez
  let py: number, sx = 1, sy = 1;
  if (t < E.bate) py = interpolate(t, [E.cai, E.bate], [-260, lg.cy + 40], { ...clamp, easing: (x) => x * x });
  else {
    const u = t - E.bate;
    const q = u < 0.5 ? Math.sin((u / 0.5) * Math.PI) * 170 * (1 - u) : 0;
    py = lg.cy + 40 - q;
    const am = Math.exp(-u * 14) * Math.cos(u * 30);
    sx = 1 + 0.25 * am; sy = 1 - 0.25 * am;
  }
  const exp = t - E.explode;
  const ePin = exp < 0 ? 1 : 1 - entre(t, E.explode, E.explode + 0.12);
  const eLogo = exp < 0 ? 0 : outBack(exp / 0.45, 2.2);
  const abre = outBack(entre(t, E.toldo, E.toldo + 0.3), 2.6);
  const flash = exp >= 0 && exp < 0.3 ? 1 - exp / 0.3 : 0;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `circle(${iris}px at 540px ${lg.cy + 140}px)` }}>
        <CoralBackground frame={quadro} />
        {exp >= 0 && <Sunburst frame={quadro * 2} cx={lg.cx} cy={lg.cy} color={C.amarelo} opacity={0.22 * Math.min(1, exp / 0.2)} rays={16} />}
      </AbsoluteFill>
      {/* o toldo listrado abre sobre o pin (como a loja abrindo) */}
      {ePin > 0 && abre > 0 && (
        <div style={{ position: "absolute", left: lg.cx - 230, top: py - 300, width: 460, opacity: ePin, transform: `scale(${0.6 + 0.4 * ePin})`, transformOrigin: "50% 200%" }}>
          <Toldo w={460} abre={abre} />
        </div>
      )}
      {ePin > 0 && (
        <div style={{ position: "absolute", left: lg.cx - 120, top: py - 312, width: 240, height: 312, transform: `scale(${sx * (0.5 + 0.5 * ePin)}, ${sy * (0.5 + 0.5 * ePin)})`, transformOrigin: "50% 100%", opacity: ePin,
          filter: "drop-shadow(0 18px 18px rgba(120,30,10,0.35))" }}>
          <MapPin size={240} color={C.amarelo} />
        </div>
      )}
      {exp >= 0 && (
        <>
          {/* as linhas da explosão e o confete */}
          <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: 1 - entre(t, E.explode + 0.25, E.explode + 0.6) }}>
            {Array.from({ length: 18 }).map((_, i) => {
              const a = (i / 18) * Math.PI * 2, d0 = 300 + exp * 900, d1 = d0 + 140;
              return <line key={i} x1={lg.cx + Math.cos(a) * d0} y1={lg.cy + Math.sin(a) * d0} x2={lg.cx + Math.cos(a) * d1} y2={lg.cy + Math.sin(a) * d1}
                stroke={i % 2 ? C.amarelo : C.creme} strokeWidth={16} strokeLinecap="round" />;
            })}
          </svg>
          <ConfettiBurst frame={quadro} start={Math.round(E.explode * FPS)} x={lg.cx} y={lg.cy} count={46} spread={360} power={40} seed="bf-logo" />
          <div style={{ position: "absolute", left: lg.cx - lg.d / 2, top: lg.cy - lg.d / 2, width: lg.d, height: lg.d, transform: `scale(${eLogo}) rotate(${(1 - Math.min(1, eLogo)) * -25}deg)`,
            filter: "drop-shadow(0 26px 34px rgba(110,25,5,0.45))" }}>
            {/* o anel creme separa a logo (coral) do fundo coral; a logo é o arquivo, redonda, sem fundo */}
            <div style={{ position: "absolute", inset: -16, borderRadius: "50%", background: C.creme }} />
            <Img src={staticFile("img/uaipertim_logo.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
          </div>
          {flash > 0 && <AbsoluteFill style={{ background: "#FFF6E8", opacity: flash * 0.55 }} />}
        </>
      )}
    </AbsoluteFill>
  );
};

// ================================================================ 3 · LOJAS (fileiras descendo rápido → a grade 3×3 num "modal")
// A grade (posições e tamanho) sai de scripts/preparar.py (cena.json → eventos.lojas.grade): 3×3 lojinhas dentro da
// moldura com a MESMA margem interna nos 4 lados. A descida rápida continua igual; entre "freia" e "lugar" o recorte das
// fileiras encolhe da tela inteira até o interior da moldura, e a partir de "lugar" nada aparece fora dela.
const TIPOS: ShopCharKind[] = ["padaria", "mercado", "lanchonete", "farmacia", "restaurante", "hortifruti", "pet", "bebidas", "loja"];
const GR = EV.lojas.grade;
const LW = GR.w, LH = LW * SHOP_RATIO;
// a descida: a velocidade cai até parar em "lugar"; o deslocamento é a integral (as fileiras param no lugar certo)
const descida = (t: number) => {
  const E = EV.lojas, t0 = S[2].t0 - 0.12;
  const T = E.para - t0;                     // dura até parar
  const u = clamp01((t - t0) / T);
  const D = 2600;                            // px percorridos no total (desce)
  return D * (1 - Math.pow(1 - u, 2.6)) - D;  // termina em 0 (as bases paradas)
};
const Lojas: React.FC<{ t: number; quadro: number; congelado?: number }> = ({ t, quadro, congelado }) => {
  const E = EV.lojas;
  const tt = congelado ?? t;
  const off = descida(tt);
  const vel = Math.abs(descida(tt + 0.02) - off) / 0.02;
  const mold = entre(tt, E.moldura, E.moldura + 0.35);           // o pin e o brilho nos olhinhos, em "só"
  const traco = outCubic(entre(tt, E.para, E.moldura + 0.2));     // a moldura se desenha de "lugar" até "só"
  const rec = inOut(entre(tt, E.freia, E.para));                  // o recorte encolhe até o interior da moldura
  const [ix0, iy0, ix1, iy1] = GR.interno;
  const [mx0, my0, mx1, my1] = GR.moldura;
  const [cx0, , cx1] = GR.conteudo;
  const raioIn = GR.raio - GR.esp / 2;
  const clip = `inset(${rec * iy0}px ${rec * (1080 - ix1)}px ${rec * (1920 - iy1)}px ${rec * ix0}px round ${rec * raioIn}px)`;
  const fil: React.ReactNode[] = [];
  const ruas: React.ReactNode[] = [];
  for (let r = -12; r < 4; r++) {
    const base = GR.base[0] + r * GR.passo + off;
    if (base < 150 || base - LH > 1500) continue;
    // as fileiras de fora da grade 3×3 somem enquanto o recorte fecha: a partir de "lugar", só as 9 da grade
    const fora = r < 0 || r > 2;
    if (fora && rec >= 1) continue;
    const alfa = fora ? 1 - rec : 1;
    ruas.push(<div key={r} style={{ position: "absolute", opacity: alfa, left: cx0, width: cx1 - cx0, top: base + GR.calcada[0], height: GR.calcada[1] - GR.calcada[0], borderRadius: 10, background: C.cremeDeep }} />);
    GR.cx.forEach((cx, c) => {
      const k = (((r % 3) + 3) % 3) * 3 + c;
      const kind = TIPOS[(k + (r < 0 ? 4 : 0)) % TIPOS.length];
      const pisca = random(`bf-pisca-${r}-${c}`) * 3;
      const blink = tt > 3.6 + pisca && tt < 3.72 + pisca ? 1 : 0;
      fil.push(
        <div key={`${r}-${c}`} style={{ position: "absolute", opacity: alfa, left: cx - LW / 2, top: base - LH, width: LW, height: LH }}>
          <ShopChar kind={kind} width={LW} mood="happy" look={[0, 0]} blink={blink} lit={0.9} awning={0.3 + 0.3 * Math.min(1, vel / 3000)} sparkle={mold} />
        </div>,
      );
    });
  }
  return (
    <AbsoluteFill>
      <CremeBackground frame={quadro} rays raysCenter={[540, 800]} raysColor={C.coral} raysOpacity={0.08} enfeites={false} />
      <AbsoluteFill style={{ background: PESSEGO, opacity: 0.45 }} />
      {/* o fundo do "modal" (papel), que aparece enquanto o recorte fecha */}
      {rec > 0 && (
        <div style={{ position: "absolute", left: ix0, top: iy0, width: ix1 - ix0, height: iy1 - iy0, borderRadius: raioIn, background: C.papel, opacity: 0.92 * rec,
          boxShadow: `0 ${24 * rec}px ${48 * rec}px rgba(34,28,25,${0.16 * rec})` }} />
      )}
      {/* as fileiras: antes de parar, na tela inteira (com o esfumado no alto e embaixo); a partir de "lugar", só dentro da moldura */}
      <AbsoluteFill style={{ clipPath: rec > 0 ? clip : undefined, WebkitMaskImage: rec < 1 ? "linear-gradient(to bottom, transparent 200px, black 300px, black 1250px, transparent 1316px)" : undefined }}>
        {ruas}
        {fil}
      </AbsoluteFill>
      <LinhasVelocidade t={tt} forca={Math.min(1, vel / 2500) * 0.9 * (1 - rec)} ang={90} n={22} seed="bf-lojas" cor={C.coral} />
      {/* a moldura "num lugar só" (o modal) e o pin no topo */}
      {traco > 0 && (
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <rect x={mx0} y={my0} width={mx1 - mx0} height={my1 - my0} rx={GR.raio} fill="none" stroke={C.coral} strokeWidth={GR.esp} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - traco} />
        </svg>
      )}
      {mold > 0 && (
        <div style={{ position: "absolute", left: (mx0 + mx1) / 2 - 50, top: my0 - 126 + GR.esp / 2, transform: `scale(${outBack(mold, 2.4)})`, transformOrigin: "50% 100%" }}>
          <MapPin size={100} color={C.coral} />
        </div>
      )}
    </AbsoluteFill>
  );
};

// ================================================================ 4 · NA MÃO (celular genérico numa mão)
const CEL = { x: 400, y: 600, w: 330, h: 680 };
const BZ = CEL.w * 0.042;
const TEL = { w: CEL.w - 2 * BZ, h: CEL.h - 2 * BZ };
const TelaGenerica: React.FC<{ t: number }> = ({ t }) => {
  const E = EV.mao;
  const cores = [C.coral, C.amarelo, C.verde, "#F4A98A"];
  const icones = [<BreadIcon size={56} key="b" />, <BurgerIcon size={56} key="h" />, <CartIcon size={56} color="#fff" key="c" />, <BreadIcon size={56} key="p" />];
  return (
    <AbsoluteFill style={{ background: C.papel }}>
      <div style={{ height: 92, background: C.coral, display: "flex", alignItems: "flex-end", padding: "0 18px 14px" }}>
        <div style={{ flex: 1, height: 34, borderRadius: 17, background: "rgba(255,255,255,0.9)" }} />
      </div>
      <div style={{ display: "flex", gap: 10, padding: "16px 16px 6px" }}>
        {[0, 1, 2, 3].map((i) => <div key={i} style={{ width: 54, height: 54, borderRadius: 16, background: cores[i], opacity: 0.85, transform: `scale(${mola(t, E.sobe + 0.25 + 0.06 * i, 0.3)})` }} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: 16 }}>
        {[0, 1, 2, 3].map((i) => {
          const e = mola(t, E.sobe + 0.35 + 0.1 * i, 0.35);
          return (
            <div key={i} style={{ height: 196, borderRadius: 18, background: "#fff", boxShadow: "0 4px 10px rgba(34,28,25,0.1)", overflow: "hidden", transform: `translateY(${(1 - e) * 60}px) scale(${0.85 + 0.15 * e})`, opacity: Math.min(1, e * 2) }}>
              <div style={{ height: 112, background: cores[i], display: "flex", alignItems: "center", justifyContent: "center" }}>{icones[i]}</div>
              <div style={{ margin: "14px 12px 0", height: 12, borderRadius: 6, background: "#E8DCCB", width: "78%" }} />
              <div style={{ margin: "10px 12px 0", height: 12, borderRadius: 6, background: "#F0E6D8", width: "52%" }} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
const PELE = "#E7A57B", PELE2 = "#CF8A5F";
const Mao: React.FC<{ frente?: boolean }> = ({ frente }) => (
  // a mão (desenho genérico) segurando o celular por baixo: palma e dedos atrás, o polegar na frente
  <svg width={CEL.w + 260} height={760} viewBox={`-130 -140 ${CEL.w + 260} 760`} style={{ position: "absolute", left: CEL.x - 130, top: CEL.y + CEL.h - 360 - 140 + 140, overflow: "visible" }}>
    {!frente ? (
      <>
        <path d={`M${CEL.w * 0.15} 520 L${CEL.w * 0.3} 300 L${CEL.w + 40} 320 L${CEL.w + 140} 560 Z`} fill={C.coral} />
        <path d={`M${CEL.w * 0.18} 520 L${CEL.w * 0.32} 330 L${CEL.w + 50} 345 L${CEL.w + 120} 520 Z`} fill={C.coralDark} opacity={0.35} />
        <path d={`M${-20} 120 Q${-40} 330 ${CEL.w * 0.32} 360 L${CEL.w + 30} 360 Q${CEL.w + 70} 240 ${CEL.w + 20} 60 Z`} fill={PELE} />
        {[40, 120, 200].map((y, i) => <rect key={i} x={CEL.w - 30} y={y - 30} width={92} height={62} rx={31} fill={i % 2 ? PELE2 : PELE} />)}
      </>
    ) : (
      <>
        <path d={`M-40 300 Q-70 180 -10 120 Q30 80 70 120 L90 160 Q60 200 40 260 Z`} fill={PELE} stroke={PELE2} strokeWidth={4} />
        <ellipse cx={46} cy={132} rx={22} ry={16} fill="#F6C7A6" transform="rotate(-35 46 132)" />
      </>
    )}
  </svg>
);
const NaMao: React.FC<{ t: number; quadro: number; zoom?: number }> = ({ t, quadro }) => {
  const E = EV.mao;
  const pal = E.palavras;
  const flut = Math.sin(t * 3) * 6;
  const linhas: Array<Array<[string, number, boolean]>> = [[["Na", pal[0], false], ["palma", pal[1], false]], [["da", pal[2], false], ["sua", pal[3], false], ["mão!", pal[4], true]]];
  return (
    <AbsoluteFill>
      <CremeBackground frame={quadro} rays raysCenter={[560, 900]} raysColor={C.amarelo} raysOpacity={0.24} enfeites={false} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center", fontFamily: FONT, fontWeight: W.black, fontSize: 124, lineHeight: "130px", letterSpacing: -3, color: C.tinta }}>
        {linhas.map((ln, li) => (
          <div key={li}>
            {ln.map(([w, t0, dest], wi) => {
              const e = mola(t, t0, 0.3, 2.4);
              return (
                <span key={wi} style={{ display: "inline-block", marginLeft: wi ? 26 : 0, transform: `scale(${e})`, opacity: Math.min(1, e * 3), color: dest ? C.coral : C.tinta, position: "relative" }}>
                  {dest && <Rabisco x={-6} y={102} w={250} u={entre(t, t0 + 0.12, t0 + 0.4)} esp={26} />}
                  <span style={{ position: "relative" }}>{w}</span>
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 0, top: flut, width: 1080, height: 1920, transform: "rotate(-6deg)", transformOrigin: `${CEL.x + CEL.w / 2}px ${CEL.y + CEL.h}px` }}>
        <Mao />
        <Phone width={CEL.w} height={CEL.h} style={{ position: "absolute", left: CEL.x, top: CEL.y }}>
          <TelaGenerica t={t} />
          {/* no começo, a tela ainda mostra as lojinhas paradas (a cena 3 encolhida), que dão lugar aos cards */}
          {t < E.sobe + 0.3 && (
            <div style={{ position: "absolute", left: 0, top: (TEL.h - (TEL.w * 1920) / 1080) / 2, width: 1080, height: 1920, transform: `scale(${TEL.w / 1080})`, transformOrigin: "0 0",
              opacity: 1 - entre(t, E.sobe + 0.05, E.sobe + 0.3) }}>
              <Lojas t={t} quadro={quadro} congelado={EV.lojas.moldura + 0.5} />
            </div>
          )}
        </Phone>
        <Mao frente />
      </div>
    </AbsoluteFill>
  );
};

// ================================================================ 5 · DESFILE (palavras gigantes em sílabas)
type Item = (typeof EV.desfile.itens)[number];
const FOTO: Record<string, string> = { paodequeijo: "cat-padaria", hamburguer: "cat-lanches", pizza: "cat-pizzas", acai: "cat-acai", mercado: "cat-mercado" };
const FUNDO = [
  { bg: C.amarelo, a: C.tinta, b: C.coral, hif: "rgba(34,28,25,0.35)" },
  { bg: C.coral, a: C.creme, b: C.amarelo, hif: "rgba(255,255,255,0.45)" },
  { bg: C.verde, a: C.creme, b: C.amarelo, hif: "rgba(255,255,255,0.45)" },
  { bg: PESSEGO, a: C.coral, b: C.tinta, hif: "rgba(34,28,25,0.3)" },
  { bg: C.coralBg, a: C.amarelo, b: C.creme, hif: "rgba(255,255,255,0.45)" },
];
// o desfile: as palavras GIGANTES no alto (y 290–640, até 800 px de largura, centradas), quebradas nas sílabas da forma que
// deixa a letra MAIOR; a foto (adesivo de 620 px, ~57% da largura) centrada na metade de baixo, entrando com pop NA
// batida; o "+" proporcional na borda dela. Tudo acima da faixa da legenda (a foto termina em y ≈ 1285).
const DESFILE = L.desfile;
const CartaoItem: React.FC<{ t: number; quadro: number; it: Item; k: number }> = ({ t, quadro, it, k }) => {
  const f = FUNDO[k];
  const medir = useMedir(W.black);
  const sil = it.silabas;
  const hifen = it.ilustracao !== "paodequeijo";
  const pedaco = (i: number) => sil[i].t + (hifen && i < sil.length - 1 ? "-" : "");
  const DT = DESFILE.texto, FT = DESFILE.foto, MA = DESFILE.mais;
  // as quebras possíveis (sílabas em sequência, 1 a 3 linhas): fica a que dá a maior letra
  const arranjo = useMemo(() => {
    const n = sil.length;
    let melhor: { linhas: number[][]; size: number } | null = null;
    for (let m = 0; m < 1 << (n - 1); m++) {
      const linhas: number[][] = [[0]];
      for (let i = 1; i < n; i++) (m & (1 << (i - 1)) ? linhas.push([i]) : linhas[linhas.length - 1].push(i));
      const larg = Math.max(...linhas.map((l) => medir(l.map(pedaco).join(hifen ? "" : " "), 100)));
      const size = Math.min(DT.max, (DT.w / larg) * 100, (DT.y1 - DT.y0) / (linhas.length * 0.98));
      if (!melhor || size > melhor.size + 0.5) melhor = { linhas, size };
    }
    return melhor!;
  }, [it.ilustracao]);
  const size = arranjo.size, lh = size * 0.98;
  const top = DT.y0 + ((DT.y1 - DT.y0) - lh * arranjo.linhas.length) / 2;
  // a foto entra com pop exatamente na batida da palavra
  const pop = t < it.entra ? 0 : outBack((t - it.entra) / 0.3, 2.4);
  const mais = it.mais;
  const aperta = t >= mais && t < mais + 0.14 ? 0.82 : 1;
  const ripple = entre(t, mais, mais + 0.45);
  const fotoPulo = t >= mais ? 1 + 0.05 * Math.sin(entre(t, mais, mais + 0.3) * Math.PI) : 1;
  const ang = Math.PI / 4, mx = FT.cx + Math.cos(ang) * FT.d * 0.5 * 0.86, my = FT.cy + Math.sin(ang) * FT.d * 0.5 * 0.86, md = MA.d;
  const corMais = k === 1 || k === 4 ? C.amarelo : C.coral;
  return (
    <AbsoluteFill style={{ background: f.bg, overflow: "hidden" }}>
      <Sunburst frame={quadro} cx={FT.cx} cy={FT.cy} color="#fff" opacity={0.12} rays={14} />
      {arranjo.linhas.map((l, li) => (
        <div key={li} style={{ position: "absolute", left: 540 - DT.w / 2 - 40, width: DT.w + 80, top: top + li * lh, height: lh, display: "flex", justifyContent: "center",
          fontFamily: FONT, fontWeight: W.black, fontSize: size, lineHeight: `${lh}px`, letterSpacing: -size * 0.03, whiteSpace: "nowrap" }}>
          {l.map((i, j) => {
            const s0 = sil[i];
            const e = t < s0.t0 - 0.02 ? 0 : mola(t, s0.t0 - 0.02, 0.24, 2.6);
            return (
              <span key={i} style={{ display: "inline-block", marginLeft: !hifen && j ? size * 0.22 : 0, color: i % 2 ? f.b : f.a, opacity: e > 0 ? 1 : 0,
                transform: `scale(${e}) rotate(${(1 - Math.min(1, e)) * -8}deg)`, transformOrigin: "50% 80%", textShadow: `0 ${size * 0.05}px 0 rgba(34,28,25,0.18)` }}>
                {s0.t}{hifen && i < sil.length - 1 && <span style={{ color: f.hif }}>-</span>}
              </span>
            );
          })}
        </div>
      ))}
      <div style={{ position: "absolute", left: FT.cx - FT.d / 2, top: FT.cy - FT.d / 2, width: FT.d, height: FT.d, transform: `scale(${pop * fotoPulo}) rotate(${-5 + 3 * Math.sin(t * 2 + k)}deg)` }}>
        <Adesivo src={staticFile(`pedir-no-uaipertim/fotos/${FOTO[it.ilustracao]}.jpg`)} d={FT.d} borda={FT.borda} />
      </div>
      {/* o botão "+" (sem preço), proporcional à foto: entra logo depois dela e aperta quando a palavra termina */}
      <div style={{ position: "absolute", left: mx - md / 2, top: my - md / 2, width: md, height: md, transform: `scale(${(t < it.entra + 0.12 ? 0 : mola(t, it.entra + 0.12, 0.3, 2.4)) * aperta})` }}>
        {ripple > 0 && ripple < 1 && <div style={{ position: "absolute", left: -100 * ripple, top: -100 * ripple, width: md + 200 * ripple, height: md + 200 * ripple, borderRadius: "50%", border: `${14 * (1 - ripple) + 3}px solid #fff`, opacity: 1 - ripple }} />}
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: corMais, boxShadow: `0 10px 0 ${C.tinta}`, border: `8px solid ${C.tinta}` }} />
        <svg width={md} height={md} viewBox="0 0 124 124" style={{ position: "absolute", left: 0, top: 0 }}>
          <path d="M62 34 V90 M34 62 H90" stroke={k === 1 || k === 4 ? C.tinta : "#fff"} strokeWidth={14} strokeLinecap="round" />
        </svg>
      </div>
    </AbsoluteFill>
  );
};
const Desfile: React.FC<{ t: number; quadro: number }> = ({ t, quadro }) => {
  const itens = EV.desfile.itens;
  let k = 0;
  itens.forEach((it, i) => { if (t >= it.entra - 0.09) k = i; });
  const cur = itens[k];
  const u = k > 0 ? entre(t, cur.entra - 0.09, cur.entra + 0.13) : 1;
  const e = inOut(u);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {k > 0 && u < 1 && <AbsoluteFill style={{ transform: `translateX(${-e * 1080 * 0.45}px)` }}><CartaoItem t={t} quadro={quadro} it={itens[k - 1]} k={k - 1} /></AbsoluteFill>}
      <AbsoluteFill style={{ transform: `translateX(${(1 - e) * 1080}px)`, boxShadow: u < 1 ? "-30px 0 40px rgba(34,28,25,0.25)" : undefined }}>
        <CartaoItem t={t} quadro={quadro} it={cur} k={k} />
      </AbsoluteFill>
      <Selo x={96} y={1288} size={22} />
    </AbsoluteFill>
  );
};

// ================================================================ 6 · PAGAMENTO (três selos carimbados)
const SELOS = [
  { cx: 330, cy: 520, cor: C.verde, txt: "#fff", rot: -8 },
  { cx: 720, cy: 790, cor: C.amarelo, txt: C.tinta, rot: 7 },
  { cx: 360, cy: 1080, cor: C.coral, txt: "#fff", rot: -5 },
];
const IconePag: React.FC<{ i: number; cor: string }> = ({ i, cor }) => (
  <svg width={110} height={90} viewBox="0 0 110 90">
    {i === 0 && (<g transform="translate(55 45)"><rect x={-26} y={-26} width={52} height={52} rx={12} transform="rotate(45)" fill="none" stroke={cor} strokeWidth={9} /><rect x={-9} y={-9} width={18} height={18} rx={4} transform="rotate(45)" fill={cor} /></g>)}
    {i === 1 && (<g><rect x={10} y={14} width={90} height={62} rx={10} fill="none" stroke={cor} strokeWidth={8} /><rect x={10} y={28} width={90} height={12} fill={cor} /><rect x={22} y={52} width={22} height={14} rx={3} fill={cor} /></g>)}
    {i === 2 && (<g><rect x={30} y={6} width={50} height={78} rx={10} fill="none" stroke={cor} strokeWidth={8} /><rect x={40} y={16} width={30} height={18} rx={3} fill={cor} />
      {[0, 1, 2].map((r) => [0, 1, 2].map((c) => <circle key={`${r}${c}`} cx={44 + c * 11} cy={48 + r * 10} r={3.4} fill={cor} />))}</g>)}
  </svg>
);
const SeloPag: React.FC<{ t: number; t0: number; i: number; texto: string }> = ({ t, t0, i, texto }) => {
  const s = SELOS[i], u = t - t0;
  if (u < 0) return null;
  const k = u < 0.12 ? 2.4 - 1.5 * (u / 0.12) : 0.9 + 0.1 * outBack((u - 0.12) / 0.25, 3);
  const tremor = u > 0.12 && u < 0.4 ? Math.sin(u * 120) * 6 * (1 - (u - 0.12) / 0.28) : 0;
  const n = 26, R = 170;
  const pts = Array.from({ length: n * 2 }).map((_, j) => { const a = (j / (n * 2)) * Math.PI * 2, r = j % 2 ? R : R - 14; return `${Math.cos(a) * r},${Math.sin(a) * r}`; }).join(" ");
  return (
    <div style={{ position: "absolute", left: s.cx, top: s.cy, transform: `translate(-50%,-50%) translate(${tremor}px,0) rotate(${s.rot + (1 - Math.min(1, u / 0.12)) * 18}deg) scale(${k})`, opacity: Math.min(1, u / 0.05) }}>
      <svg width={360} height={360} viewBox="-180 -180 360 360" style={{ display: "block", filter: "drop-shadow(0 12px 0 rgba(34,28,25,0.22))" }}>
        <polygon points={pts} fill={s.cor} stroke={C.tinta} strokeWidth={7} strokeLinejoin="round" />
        <circle r={128} fill="none" stroke={s.txt} strokeOpacity={0.55} strokeWidth={5} strokeDasharray="10 10" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
        <IconePag i={i} cor={s.txt} />
        <div style={{ fontFamily: FONT, fontWeight: W.black, fontSize: texto.length > 6 ? 44 : 58, lineHeight: 1, color: s.txt, whiteSpace: "nowrap", letterSpacing: -1 }}>{texto}</div>
      </div>
    </div>
  );
};
const Pagamento: React.FC<{ t: number; quadro: number }> = ({ t, quadro }) => (
  <AbsoluteFill>
    <CremeBackground frame={quadro} rays raysCenter={[540, 800]} raysColor={C.verde} raysOpacity={0.12} enfeites={false} />
    {/* o caminho pontilhado ligando os três selos */}
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
      <path d="M330 520 C 560 520, 720 600, 720 790 S 420 900, 360 1080" stroke={C.coral} strokeWidth={10} strokeDasharray="4 26" strokeLinecap="round" fill="none" opacity={0.5} />
    </svg>
    {EV.pagamento.selos.map((s, i) => <SeloPag key={i} t={t} t0={s.em} i={i} texto={s.t} />)}
    {EV.pagamento.selos.map((s, i) => <Puf key={`p${i}`} t={t} t0={s.em + 0.12} x={SELOS[i].cx} y={SELOS[i].cy + 120} raio={190} seed={`bf-pag-${i}`} />)}
  </AbsoluteFill>
);

// ================================================================ 7 · RAPIDIM (o Pertim na motinha + o mapa)
const Marquee: React.FC<{ t: number; y: number; dir: number; cor: string; contorno?: boolean; fase: number }> = ({ t, y, dir, cor, contorno, fase }) => {
  const x = dir > 0 ? -2400 + ((t * 1700 + fase) % 1300) : -((t * 1700 + fase) % 1300);
  return (
    <div style={{ position: "absolute", left: x, top: y - 160, whiteSpace: "nowrap", fontFamily: FONT, fontWeight: W.black, fontSize: 300, lineHeight: "320px", letterSpacing: -8,
      color: contorno ? "transparent" : cor, WebkitTextStroke: contorno ? `8px ${cor}` : undefined, transform: "skewX(-12deg)" }}>
      {"RAPIDIM · RAPIDIM · RAPIDIM · RAPIDIM · RAPIDIM"}
    </div>
  );
};
// a rota do mapa: do pin até a casinha (bezier cúbica), com o ponto ao longo dela (comprimento aproximado)
const ROTA: Array<[number, number]> = [[260, 560], [300, 860], [760, 700], [770, 1040]];
const bez = (u: number): [number, number] => {
  const [a, b, c, d] = ROTA, m = 1 - u;
  return [m * m * m * a[0] + 3 * m * m * u * b[0] + 3 * m * u * u * c[0] + u * u * u * d[0], m * m * m * a[1] + 3 * m * m * u * b[1] + 3 * m * u * u * c[1] + u * u * u * d[1]];
};
const CASA = { cx: 770, base: 1150, porta: [770, 1112] as [number, number] };
const Casinha: React.FC<{ luz: number }> = ({ luz }) => (
  <svg width={260} height={240} viewBox="-130 -220 260 240" style={{ position: "absolute", left: CASA.cx - 130, top: CASA.base - 220, overflow: "visible" }}>
    <ellipse cx={0} cy={14} rx={120} ry={12} fill="#000" opacity={0.1} />
    <rect x={-95} y={-130} width={190} height={142} rx={10} fill={C.creme} stroke={C.tinta} strokeWidth={6} />
    <path d="M-120 -120 L0 -210 L120 -120 Z" fill={C.coral} stroke={C.tinta} strokeWidth={6} strokeLinejoin="round" />
    <rect x={-70} y={-100} width={46} height={40} rx={6} fill={luz > 0 ? "#FFE48A" : "#BFD3E0"} stroke={C.tinta} strokeWidth={5} />
    <rect x={-22} y={-76} width={44} height={88} rx={6} fill={luz > 0 ? C.amarelo : "#9A5A2C"} stroke={C.tinta} strokeWidth={5} />
    {luz > 0 && <circle cx={0} cy={-30} r={70 * luz} fill={C.amarelo} opacity={0.25 * (1 - luz)} />}
  </svg>
);
const Mapa: React.FC<{ t: number }> = ({ t }) => {
  const E = EV.rapidim;
  const u = outCubic(entre(t, E.rota[0], E.rota[1]));
  const N = 40;
  const pts = Array.from({ length: N + 1 }).map((_, i) => bez(i / N));
  const d = "M" + pts.map((p) => p.join(" ")).join(" L");
  const [mx, my] = bez(u);
  const [nx, ny] = bez(Math.min(1, u + 0.02));
  const ang = (Math.atan2(ny - my, nx - mx) * 180) / Math.PI;
  return (
    <AbsoluteFill style={{ background: "#F8E4CB" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        {/* quarteirões e ruas genéricas */}
        {[[90, 300, 330, 220], [470, 300, 420, 260], [90, 600, 260, 300], [400, 620, 230, 230], [700, 600, 230, 300], [90, 960, 520, 300], [660, 960, 300, 330]].map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} rx={26} fill={i % 3 ? "#FBEEDD" : "#E9F1DD"} />
        ))}
        {[[[0, 560], [1080, 560]], [[0, 920], [1080, 920]], [[380, 250], [380, 1310]], [[660, 250], [660, 1310]]].map(([a, b], i) => (
          <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#fff" strokeWidth={34} strokeLinecap="round" />
        ))}
        {[[180, 470], [560, 450], [860, 470], [520, 780], [200, 1180], [480, 1150]].map(([x, y], i) => (
          <g key={i}><circle cx={x} cy={y} r={30} fill={C.verde} /><circle cx={x - 9} cy={y - 9} r={10} fill={C.verdeLight} /></g>
        ))}
        <mask id="bf-rota"><path d={d} stroke="#fff" strokeWidth={30} fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - u} /></mask>
        <path d={d} stroke={C.coral} strokeWidth={16} strokeLinecap="round" strokeDasharray="2 30" fill="none" mask="url(#bf-rota)" />
      </svg>
      <div style={{ position: "absolute", left: ROTA[0][0] - 60, top: ROTA[0][1] - 156 }}><MapPin size={120} color={C.coral} /></div>
      <Casinha luz={entre(t, E.rota[1] - 0.05, E.rota[1] + 0.25)} />
      {u > 0 && u < 1 && (
        <div style={{ position: "absolute", left: mx - 50, top: my - 70, width: 100, height: 100, transform: `rotate(${Math.max(-40, Math.min(40, ang - 0))}deg) scaleX(${nx >= mx ? 1 : -1})` }}>
          <svg width={100} height={100} viewBox="0 0 100 100" style={{ overflow: "visible" }}>
            <rect x={6} y={18} width={34} height={30} rx={6} fill={C.amarelo} stroke={C.tinta} strokeWidth={4} />
            <path d="M12 54 H58 L70 38 H82 L76 46 L68 62 Q60 72 46 72 H22 Q10 72 12 54 Z" fill={C.coral} stroke={C.tinta} strokeWidth={4} />
            <circle cx={24} cy={76} r={12} fill={C.tinta} /><circle cx={70} cy={76} r={12} fill={C.tinta} />
          </svg>
        </div>
      )}
    </AbsoluteFill>
  );
};
const Rapidim: React.FC<{ t: number; quadro: number }> = ({ t, quadro }) => {
  const E = EV.rapidim, P = L.pertim.rapidim;
  const [c0, c1] = E.cruza;
  // a travessia: entra rápido, passa devagar no meio (falando), sai disparado
  const ta = c0 + 0.32, tb = c1 - 0.32;
  let cx: number;
  if (t < ta) cx = interpolate(t, [c0 - 0.1, ta], [-420, 400], { ...clamp, easing: (x) => outCubic(x) });
  else if (t < tb) cx = interpolate(t, [ta, tb], [400, 660], clamp);
  else cx = interpolate(t, [tb, c1], [660, 1560], { ...clamp, easing: (x) => x * x });
  const rot = t < ta ? -6 : t < tb ? -2 + Math.sin(t * 20) * 1 : -8;
  const vel = t < ta ? 1 : t < tb ? 0.35 : 1;
  const mapa = entre(t, E.mapa, E.mapa + 0.25);
  const em = inOut(mapa);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translateX(${-em * 1080}px)` }}>
        <AbsoluteFill style={{ background: C.amarelo }} />
        <Sunburst frame={quadro} cx={540} cy={900} color="#fff" opacity={0.14} />
        <Marquee t={t} y={470} dir={-1} cor={C.coral} fase={200} />
        <Marquee t={t} y={800} dir={1} cor={C.tinta} contorno fase={600} />
        <Marquee t={t} y={1130} dir={-1} cor="#fff" fase={0} />
        {/* a rua */}
        <div style={{ position: "absolute", left: 0, top: P.base - 16, width: 1080, height: 60, background: C.cremeDeep }}>
          <svg width={1080} height={60} style={{ position: "absolute", left: 0, top: 0 }}>
            <line x1={0} y1={30} x2={1080} y2={30} stroke={C.coral} strokeWidth={8} strokeDasharray="40 30" strokeDashoffset={t * 1400} />
          </svg>
        </div>
        <LinhasVelocidade t={t} forca={vel} ang={0} caixa={[0, P.base - 520, 1080, P.base]} n={16} seed="bf-moto" />
        <Puf t={t} t0={ta - 0.05} x={cx - 230} y={P.base - 20} raio={110} seed="bf-moto-puf" />
        <PertimEm t={t} quadro={quadro} pose="moto" expr="sorrindo" cx={cx} base={P.base} altura={P.altura} rot={rot}
          extra={{ quique: Math.sin(t * 26) * 2 }} />
      </AbsoluteFill>
      {mapa > 0 && <AbsoluteFill style={{ transform: `translateX(${(1 - em) * 1080}px)`, boxShadow: "-30px 0 40px rgba(34,28,25,0.25)" }}><Mapa t={t} /></AbsoluteFill>}
    </AbsoluteFill>
  );
};

// ================================================================ 8 · CHEGOU
const Chegou: React.FC<{ t: number; quadro: number }> = ({ t, quadro }) => {
  const E = EV.chegou;
  const ck = entre(t, E.check + 0.05, E.check + 0.35);
  const anel = mola(t, E.check, 0.35, 2.2);
  const tx = mola(t, E.texto, 0.32, 2.2);
  return (
    <AbsoluteFill>
      <CremeBackground frame={quadro} rays raysCenter={[540, 600]} raysColor={C.verde} raysOpacity={0.16} enfeites={false} />
      <div style={{ position: "absolute", left: 540 - 190, top: 560 - 190, width: 380, height: 380, transform: `scale(${anel})` }}>
        <svg width={380} height={380} viewBox="-190 -190 380 380">
          <circle r={180} fill={C.verde} opacity={0.18} />
          <circle r={150} fill={C.verde} stroke={C.verdeDark} strokeWidth={10} />
          <path d="M-70 4 L-20 54 L78 -52" stroke="#fff" strokeWidth={34} strokeLinecap="round" strokeLinejoin="round" fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ck} />
        </svg>
      </div>
      <ConfettiBurst frame={quadro} start={Math.round((E.check + 0.2) * FPS)} x={540} y={560} count={30} spread={360} power={30} seed="bf-check" />
      <div style={{ position: "absolute", left: 0, right: 0, top: 820, textAlign: "center", fontFamily: FONT, fontWeight: W.black, fontSize: 104, lineHeight: "112px", letterSpacing: -3,
        transform: `scale(${tx})`, opacity: Math.min(1, tx * 3) }}>
        <div style={{ color: C.tinta }}>Seu pedido</div>
        <div style={{ color: C.coral, position: "relative", display: "inline-block" }}>
          <Rabisco x={-10} y={96} w={380} u={entre(t, E.texto + 0.15, E.texto + 0.4)} esp={28} />
          <span style={{ position: "relative" }}>chegou!</span>
        </div>
      </div>
      {E.estrelas.map((te, i) => {
        const on = t >= te, e = on ? outBack((t - te) / 0.25, 3) : 1;
        return (
          <div key={i} style={{ position: "absolute", left: 540 + (i - 2) * 122 - 50, top: 1150 - 50, width: 100, height: 100, transform: `scale(${e})` }}>
            <FivePointStar size={100} color={on ? C.amarelo : "#E3D5C3"} />
            {on && t < te + 0.35 && <div style={{ position: "absolute", left: 20, top: -30, opacity: 1 - (t - te) / 0.35 }}><StarShape size={40} color={C.amarelo} /></div>}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ================================================================ 9 · FECHO
const Fecho: React.FC<{ t: number; quadro: number }> = ({ t, quadro }) => {
  const E = EV.fecho, F = L.fecho, P = L.pertim.fecho;
  const [w0, w1] = E.escrita;
  const eLogo = interpolate(t, [E.logo.entra, E.logo.parada], [0, 1], clamp);
  const kLogo = eLogo >= 1 ? 1 : outBack(eLogo / 0.85, 1.9);
  const fr = mola(t, E.frase, 0.32, 2);
  const selo = t - E.selo;
  const kSelo = selo < 0 ? 0 : selo < 0.12 ? 2.2 - 1.3 * (selo / 0.12) : 0.9 + 0.1 * outBack((selo - 0.12) / 0.25, 3);
  const dep = S[8].voz_t1;
  return (
    <AbsoluteFill>
      <CremeBackground frame={quadro} rays raysCenter={[540, 700]} raysOpacity={0.16} enfeites={false} />
      <Twinkles frame={quadro} seed="bf-fecho" points={[[150, 560], [930, 520], [140, 860], [940, 840]]} size={30} />
      <Manuscrito t={t} cx={540} cy={F.facim.cy} size={F.facim.size} rot={-4}
        partes={[{ s: "Foi", t0: w0, t1: w0 + (w1 - w0) * 0.35, cor: C.tinta }, { s: "facim!", t0: w0 + (w1 - w0) * 0.38, t1: w1, cor: C.coral }]} />
      <Rabisco x={470} y={F.facim.cy + 78} w={330} u={entre(t, w1 - 0.05, w1 + 0.25)} />
      {eLogo > 0 && (
        <div style={{ position: "absolute", left: F.logo.cx - F.logo.d / 2, top: F.logo.cy - F.logo.d / 2, width: F.logo.d, height: F.logo.d, transform: `scale(${kLogo})`,
          opacity: Math.min(1, eLogo * 4), filter: "drop-shadow(0 16px 26px rgba(198,58,23,0.32))" }}>
          <Img src={staticFile("img/uaipertim_logo.png")} style={{ width: "100%", height: "100%" }} />
        </div>
      )}
      {fr > 0 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: F.frase.cy - F.frase.size * 0.6, textAlign: "center", fontFamily: FONT, fontWeight: W.black, fontSize: F.frase.size,
          lineHeight: 1.2, letterSpacing: -1.5, color: C.tinta, transform: `scale(${fr})`, opacity: Math.min(1, fr * 3), whiteSpace: "nowrap" }}>
          Tudo <span style={{ color: C.coral }}>pertim de você.</span>
        </div>
      )}
      {kSelo > 0 && (
        <div style={{ position: "absolute", left: F.selo.cx, top: F.selo.cy, transform: `translate(-50%,-50%) rotate(-7deg) scale(${kSelo})`, opacity: Math.min(1, selo / 0.06) }}>
          <div style={{ border: `8px solid ${C.coral}`, borderRadius: 24, padding: "10px 30px 14px", background: "rgba(255,249,241,0.95)", boxShadow: `inset 0 0 0 5px ${C.papel}, inset 0 0 0 8px ${C.coral}, 0 8px 0 rgba(34,28,25,0.12)`,
            fontFamily: FONT, fontWeight: W.black, color: C.coral, textAlign: "center", whiteSpace: "nowrap" }}>
            <div style={{ fontSize: 42, letterSpacing: 7, lineHeight: "50px" }}>EM BREVE</div>
            <div style={{ fontSize: 80, letterSpacing: -2, lineHeight: "84px" }}>no Glória</div>
          </div>
        </div>
      )}
      <PertimEm t={t} quadro={quadro} pose="acenando" expr={t > dep + 0.2 ? "piscadinha" : "sorrindo"} cx={P.cx} base={P.base + (1 - outBack(entre(t, S[8].t0 - 0.05, S[8].t0 + 0.35), 1.6)) * 500}
        altura={P.altura} extra={{ aceno: 12 * Math.sin(t * 9) }} />
    </AbsoluteFill>
  );
};

// ================================================================ a montagem (as transições, todas diferentes)
export const BateuAFome: React.FC = () => {
  const quadro = useCurrentFrame();
  const t = quadro / FPS;
  const T = S.map((c) => c.t0);
  const camadas: React.ReactNode[] = [];
  // 1 → 2: o pin cai sobre o gancho e a íris coral abre a partir do impacto
  if (t < EV.logo.bate + 0.3) camadas.push(<Gancho key="g" t={t} quadro={quadro} />);
  // 2 → 3: empurra para baixo (a logo desce e as fileiras vêm de cima, no sentido da descida)
  const w23 = inOut(entre(t, T[2] - 0.12, T[2] + 0.12));
  if (t >= T[1] - 0.02 && w23 < 1) camadas.push(<AbsoluteFill key="l" style={{ transform: `translateY(${w23 * 1920}px)` }}><Logo t={t} quadro={quadro} /></AbsoluteFill>);
  // 3 → 4: zoom-out — as lojinhas encolhem até virar a tela do celular na mão
  const z34 = entre(t, T[3] - 0.2, T[3] + 0.18);
  if (w23 > 0 && t < T[3] - 0.08) camadas.push(<AbsoluteFill key="j" style={{ transform: `translateY(${(w23 - 1) * 1920}px)` }}><Lojas t={t} quadro={quadro} /></AbsoluteFill>);
  // 4 → 5: zoom para dentro da tela; o desfile chega com um respiro de escala
  const z45 = entre(t, T[4] - 0.22, T[4]);
  if (t >= T[3] - 0.2 && t < T[4]) {
    // a tela do celular (centro ox, oy) começa ocupando o quadro inteiro e volta ao tamanho normal; depois o zoom entra nela
    const ox = CEL.x + CEL.w / 2, oy = CEL.y + CEL.h / 2;
    const zIn = 1080 / TEL.w;
    const z = t < T[3] + 0.18 ? interpolate(outCubic(z34), [0, 1], [zIn, 1]) : interpolate(inCubic(z45), [0, 1], [1, zIn * 1.6]);
    const k = Math.min(1, (z - 1) / (zIn - 1));
    camadas.push(
      <AbsoluteFill key="m" style={{ transform: `translate(${(540 - ox) * k}px, ${(960 - oy) * k}px) scale(${z})`, transformOrigin: `${ox}px ${oy}px`, opacity: t > T[4] - 0.04 ? 0 : 1 }}>
        <NaMao t={t} quadro={quadro} />
      </AbsoluteFill>,
    );
  }
  // 5 → 6: a tela se parte em três faixas que caem e revelam os selos
  if (t >= T[5] - 0.2 && t < T[6] - 0.12) camadas.push(<Pagamento key="p" t={t} quadro={quadro} />);
  if (t >= T[4] - 0.05 && t < T[5] + 0.3) {
    const zin = 1.25 - 0.25 * outCubic(entre(t, T[4] - 0.05, T[4] + 0.25));
    [0, 1, 2].map((b) => {
      const u = entre(t, T[5] - 0.14 + b * 0.06, T[5] + 0.14 + b * 0.06);
      if (u >= 1) return;
      camadas.push(
        <AbsoluteFill key={`d${b}`} style={{ clipPath: `inset(0 ${1080 - (b + 1) * 360}px 0 ${b * 360}px)`, transform: `translateY(${inCubic(u) * 1920}px) rotate(${u * (b - 1) * 4}deg)` }}>
          <AbsoluteFill style={{ transform: `scale(${zin})` }}><Desfile t={t} quadro={quadro} /></AbsoluteFill>
        </AbsoluteFill>,
      );
    });
  }
  // 6 → 7: chicote horizontal (o pagamento sai pela esquerda, a rua do Pertim entra pela direita)
  const w67 = inOut(entre(t, T[6] - 0.12, T[6] + 0.12));
  if (t >= T[6] - 0.12 && t < T[7] + 0.35) {
    camadas.push(<AbsoluteFill key="pb" style={{ transform: `translateX(${-w67 * 1080}px)` }}>{w67 < 1 ? <Pagamento t={t} quadro={quadro} /> : null}</AbsoluteFill>);
    camadas.push(<AbsoluteFill key="r" style={{ transform: `translateX(${(1 - w67) * 1080}px)` }}><Rapidim t={t} quadro={quadro} /></AbsoluteFill>);
    if (w67 > 0 && w67 < 1) camadas.push(<LinhasVelocidade key="rl" t={t} forca={Math.sin(w67 * Math.PI)} ang={0} n={26} seed="bf-chicote" />);
  }
  // 7 → 8: íris verde saindo da porta da casinha
  if (t >= T[7] - 0.08 && t < T[8] + 0.35) {
    const r = interpolate(t, [T[7] - 0.08, T[7] + 0.2], [0, 2300], { ...clamp, easing: (x) => inCubic(x) });
    camadas.push(
      <AbsoluteFill key="c" style={{ clipPath: `circle(${r}px at ${CASA.porta[0]}px ${CASA.porta[1]}px)` }}>
        <Chegou t={t} quadro={quadro} />
      </AbsoluteFill>,
    );
    if (r > 0 && r < 2300) camadas.push(
      <svg key="cr" width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}><circle cx={CASA.porta[0]} cy={CASA.porta[1]} r={r} fill="none" stroke={C.verde} strokeWidth={40} /></svg>,
    );
  }
  // 8 → 9: a faixa amarela (com borda coral) cruza na diagonal e cobre tudo exatamente na batida
  if (t >= T[8]) camadas.push(<Fecho key="f" t={t} quadro={quadro} />);
  const fs = Math.round(T[8] * FPS) - 9;
  return (
    <AbsoluteFill style={{ background: C.creme }}>
      {camadas}
      {quadro >= fs && quadro < fs + 18 && <FaixaDiagonal frame={quadro - fs} duracao={18} />}
      <Legenda t={t} dados={LEGENDA as LegendaDados} />
    </AbsoluteFill>
  );
};

// a faixa diagonal amarela com borda coral (como o ColorSwipe da marca, nas cores invertidas)
const FaixaDiagonal: React.FC<{ frame: number; duracao: number }> = ({ frame, duracao }) => {
  const p = frame / duracao;
  const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
  const bandW = 2600, x = -bandW / 2 - 400 + e * (1080 + bandW + 800);
  return (
    <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: -600, height: 3120, width: bandW, left: x - bandW / 2, transform: "rotate(-14deg)", display: "flex" }}>
        <div style={{ width: 120, background: C.coral }} />
        <div style={{ flex: 1, background: C.amarelo }} />
        <div style={{ width: 120, background: C.coral }} />
      </div>
    </AbsoluteFill>
  );
};

export const BATEU = { duracao: CENA.quadros, fps: FPS };
