import React from "react";
import { AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { C, FONT, W } from "../config/theme";
import { CremeBackground } from "../components/Decor";
import { StarShape, Twinkles } from "../components/Particles";
import { Pertim, PertimRig } from "../personagem/Pertim";
import type { Expressao, Pose } from "../personagem/logica";
import { bocaNoQuadro, piscadaEm, respiracao, Visemas } from "../personagem/rig";
import { clamp01, inCubic, inOut, outBack, outCubic } from "../pedir-no-uaipertim/efeitos";
import LAYOUT from "../../reels/pao-de-queijo-points/layout.json";
import CENA from "../../reels/pao-de-queijo-points/dados/cena.json";
import VISEMAS from "../../reels/pao-de-queijo-points/dados/visemas.json";
import LEGENDA from "../../reels/pao-de-queijo-points/dados/legenda.json";

// REEL "PÃO DE QUEIJO POINTS" (1080×1920, 30 fps): o programa de fidelidade do UaiPertim, apresentado pelo Pertim com a
// tela real do app (public/telas-app/celular/Fidelidade.png; o Início, Main.png, na abertura). A voz, a linha do tempo
// (todo corte numa batida da trilha animada, 120 BPM) e a mixagem vêm do pipeline do Explica, Sô!
// (reels/pao-de-queijo-points/roteiro.json); os tempos, de reels/pao-de-queijo-points/dados/ (scripts/preparar.py, amarrados
// às palavras da voz); as posições, de reels/pao-de-queijo-points/layout.json.
//   1 gancho:      um pão de queijo quentinho estoura em moedinhas que caem num contador (0 → 150 pontos); o celular sobe
//                  com o Início e o contador voa para o banner "Pão de Queijo Points", que acende em "pontos";
//   2 boas-vindas: toque em "Ver prêmios"; a tela do Pão de Queijo Points entra empurrando; o saldo acende; a lupa dos
//                  cartões abre e o "+30" acende em "trinta";
//   3 pedido:      o "+20" acende e pula, com um "+20" subindo, em "vinte";
//   4 troca:       a lupa da lista "Troque seus pontos": os descontos acendem em "desconto" (toque em "Resgatar"); a lupa
//                  desce e o "Benefício na entrega" acende em "entrega";
//   5 níveis:      a tela rola até "Níveis"; cada nível acende na sua palavra; brilho e confete no "Diamante";
//   6 fecho:       o celular se afasta e os 4 prêmios da lista ficam em leque, com o "?"; em "Conta", a logo, "Tudo pertim
//                  de você." e o balão de comentário; o Pertim acena e pisca.
// O Pertim fica no canto de baixo à esquerda, sempre olhando para a câmera. Nota fixa "Prêmios e valores ilustrativos" no
// rodapé enquanto a tela aparece. A legenda é a nova (a da Coisa de mineiro #03), em x 110–906.
// `mascara` (só para o QA): "legenda" = só a legenda, branca, sobre o transparente; "conteudo" = tudo menos o fundo e a legenda.

export type PaoDeQueijoPointsProps = { mascara?: "legenda" | "conteudo" };
const L = LAYOUT as typeof LAYOUT;
const EV = CENA.eventos;
const FPS = CENA.fps;
const S = CENA.cenas;
const T = S.map((c) => c.t0);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const entre = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const mola = (t: number, t0: number, dur = 0.35, s = 1.9) => (t < t0 ? 0 : outBack((t - t0) / dur, s));
const tela = (n: string) => staticFile(`telas-app/celular/${n}.png`);
type Nome = keyof typeof L.telas;
type Cx = [number, number, number, number];
const OURO = "#F9B233", OURO_ESC = "#E3951A";

// ---------------------------------------------------------------- o celular genérico e a tela (o mesmo do "Olha ele por dentro!")
const CL = L.celular;
const BZ = CL.w * CL.bezel;
const TEL = { x: CL.x + BZ, y: CL.y + BZ, w: CL.w - 2 * BZ, h: CL.h - 2 * BZ };
const K = TEL.w / 1170;
const VP = TEL.h / K;
const RAIO_TELA = CL.w * 0.11;
const PF = L.telas.Fidelidade.pontos, PM = L.telas.Main.pontos;

const Pedaco: React.FC<{ nome: Nome; cx: Cx; style?: React.CSSProperties; escala?: number }> = ({ nome, cx, style, escala = 1 }) => (
  <div style={{ position: "absolute", left: cx[0] * escala, top: cx[1] * escala, width: (cx[2] - cx[0]) * escala, height: (cx[3] - cx[1]) * escala, overflow: "hidden", ...style }}>
    <Img src={tela(nome)} style={{ position: "absolute", left: -cx[0] * escala, top: -cx[1] * escala, width: 1170 * escala, height: L.telas[nome].h * escala, maxWidth: "none" }} />
  </div>
);
const Toque: React.FC<{ t: number; t0: number; x: number; y: number; r?: number }> = ({ t, t0, x, y, r = 70 }) => {
  const u = t - t0;
  if (u < -0.12 || u > 0.7) return null;
  const aperta = u < 0 ? (u + 0.12) / 0.12 : Math.max(0, 1 - u / 0.25);
  return (
    <>
      {[0, 0.12].map((d, i) => {
        const k = clamp01((u - d) / 0.5);
        return u >= d && k < 1 ? (
          <div key={i} style={{ position: "absolute", left: x - r * (0.6 + 1.6 * k), top: y - r * (0.6 + 1.6 * k), width: r * 2 * (0.6 + 1.6 * k), height: r * 2 * (0.6 + 1.6 * k),
            borderRadius: "50%", border: `${r * 0.16 * (1 - k) + 4}px solid ${i ? C.amarelo : C.coral}`, opacity: 1 - k }} />
        ) : null;
      })}
      {aperta > 0 && <div style={{ position: "absolute", left: x - r * 0.62, top: y - r * 0.62, width: r * 1.24, height: r * 1.24, borderRadius: "50%", background: C.coral, opacity: 0.32 * aperta }} />}
    </>
  );
};
const Anel: React.FC<{ cx: Cx; e: number; raio?: number; esp?: number; cor?: string; brilho?: boolean }> = ({ cx, e, raio = 40, esp = 12, cor = C.coral, brilho = true }) =>
  e <= 0 ? null : (
    <div style={{ position: "absolute", left: cx[0] - 10, top: cx[1] - 10, width: cx[2] - cx[0] + 20, height: cx[3] - cx[1] + 20, borderRadius: raio, border: `${esp}px solid ${cor}`,
      boxShadow: brilho ? `0 0 0 ${10 * Math.min(1, e)}px rgba(249,178,51,0.35)` : undefined, transform: `scale(${0.85 + 0.15 * Math.min(1.15, e)})`, opacity: Math.min(1, e * 2) }} />
  );
// destaque que fica: entra com pop em t0, enfraquece (0,45) depois de `fraco` e some em `fim`
const marca = (t: number, t0: number, fraco: number, fim: number) => (t < t0 || t > fim ? 0 : t < fraco ? mola(t, t0, 0.3, 2.4) : 0.45);
const sobe = (t: number, t0: number, dur = 0.9) => (t < t0 || t > t0 + dur ? null : (t - t0) / dur);

// o conteúdo da tela (o PNG inteiro, em px do PNG) com o que acontece nela
const Conteudo: React.FC<{ nome: Nome; t: number }> = ({ nome, t }) => {
  const extra: React.ReactNode[] = [];
  if (nome === "Main") {
    const g = EV.gancho;
    extra.push(<Anel key="bn" cx={PM.banner as Cx} e={marca(t, g.banner, 1e9, EV.boasvindas.toque + 0.2)} raio={50} />);
    extra.push(<Toque key="tp" t={t} t0={EV.boasvindas.toque} x={PM.premios[0]} y={PM.premios[1]} r={80} />);
  }
  if (nome === "Fidelidade") {
    const B = EV.boasvindas, P = EV.pedido, Tr = EV.troca, N = EV.niveis;
    extra.push(<Anel key="sd" cx={PF.saldo as Cx} e={t >= B.saldo[0] && t < B.saldo[1] + 0.25 ? mola(t, B.saldo[0], 0.3, 2.4) * (1 - entre(t, B.saldo[1], B.saldo[1] + 0.25)) : 0} raio={60} />);
    extra.push(<Anel key="m30" cx={PF.mais30 as Cx} e={marca(t, B.mais30, P.mais20, B.lupa[1] + 0.2)} raio={48} esp={t < P.mais20 ? 12 : 6} brilho={t < P.mais20} />);
    // o "+20": acende em "pedido" e pula em "vinte", com um "+20" subindo
    const pulo = t >= P.vinte ? 1 + 0.12 * Math.sin(Math.min(1, (t - P.vinte) / 0.35) * Math.PI) : 1;
    if (t >= P.vinte - 0.02 && t < B.lupa[1] + 0.2) extra.push(<Pedaco key="c20" nome="Fidelidade" cx={PF.mais20 as Cx} style={{ transform: `scale(${pulo})`, borderRadius: 48 }} />);
    extra.push(<Anel key="m20" cx={PF.mais20 as Cx} e={marca(t, P.mais20, 1e9, B.lupa[1] + 0.2)} raio={48} />);
    const u20 = sobe(t, P.vinte + 0.05);
    if (u20 !== null) extra.push(<div key="f20" style={{ position: "absolute", left: (PF.mais20[0] + PF.mais20[2]) / 2 - 90, top: PF.mais20[1] - 40 - 220 * outCubic(u20), opacity: 1 - inCubic(u20),
      fontFamily: FONT, fontWeight: W.black, fontSize: 110, color: C.coral, textShadow: `0 6px 0 ${C.amarelo}` }}>+20</div>);
    // a lista: os descontos (as 2 primeiras linhas) em "desconto", o toque em "Resgatar"; a entrega (3ª) em "entrega"
    const ln = PF.linhas as Cx[];
    [0, 1].forEach((k) => extra.push(<Anel key={`d${k}`} cx={ln[k]} e={marca(t, Tr.desconto + 0.1 * k, Tr.desce, Tr.lupa[1] + 0.2)} raio={50} esp={t < Tr.desce ? 12 : 6} brilho={t < Tr.desce} />));
    extra.push(<Toque key="tr" t={t} t0={Tr.toque} x={936} y={(ln[0][1] + ln[0][3]) / 2} r={80} />);
    extra.push(<Anel key="en" cx={ln[2]} e={marca(t, Tr.entrega, 1e9, Tr.lupa[1] + 0.2)} raio={50} />);
    // os níveis, cada um na sua palavra (o último fica aceso)
    const nv = PF.niveis as Cx[];
    N.niveis.forEach((x, k) => {
      const prox = k + 1 < N.niveis.length ? N.niveis[k + 1].t : 1e9;
      extra.push(<Anel key={`n${k}`} cx={nv[x.i]} e={marca(t, x.t, prox, N.lupa[1] + 0.25)} raio={44} esp={t < prox ? 12 : 6} brilho={t < prox} cor={k === 3 ? "#4BA3D6" : C.coral} />);
    });
  }
  return (
    <div style={{ position: "relative", width: 1170, height: L.telas[nome].h }}>
      <Img src={tela(nome)} style={{ position: "absolute", left: 0, top: 0, width: 1170, height: L.telas[nome].h, maxWidth: "none" }} />
      {extra}
    </div>
  );
};

const TelaRolando: React.FC<{ nome: Nome; rola: number; t: number }> = ({ nome, rola, t }) => {
  const info = L.telas[nome] as { h: number; fixo: { faixa?: number[] } };
  const H = info.h;
  const r = Math.max(0, Math.min(H - VP, rola));
  const fx = info.fixo;
  const corte = fx.faixa ? (H - fx.faixa[0]) * K : 0;
  return (
    <AbsoluteFill style={{ background: "#FAF8F5", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: TEL.w, height: TEL.h - corte, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: -r * K, width: 1170, transform: `scale(${K})`, transformOrigin: "0 0" }}>
          <Conteudo nome={nome} t={t} />
        </div>
      </div>
      {fx.faixa && (
        <div style={{ position: "absolute", left: 0, top: TEL.h - corte, width: TEL.w, height: corte, overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, top: -fx.faixa[0] * K, width: 1170, transform: `scale(${K})`, transformOrigin: "0 0" }}>
            <Img src={tela(nome)} style={{ width: 1170, height: H, maxWidth: "none" }} />
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
const naTela = (x: number, y: number, rola: number): [number, number] => [TEL.x + x * K, TEL.y + (y - rola) * K];
const rolaEm = (t: number, r: number[]) => interpolate(t, [r[0], r[1]], [r[2], r[3]], { ...clamp, easing: (x) => inOut(x) });
const rolaFid = (t: number) => rolaEm(t, EV.niveis.rola);

// ---------------------------------------------------------------- a lupa (punch-in), no alto
const LP = L.lupa;
const Lupa: React.FC<{ t: number; nome: Nome; aberta: number[]; regiao: (t: number) => Cx; fonte?: (t: number) => Cx }> = ({ t, nome, aberta, regiao, fonte }) => {
  const [a, b] = aberta;
  if (t < a || t > b + 0.2) return null;
  const e = t <= b ? outBack((t - a) / 0.32, 1.9) : 1 - inCubic((t - b) / 0.2);
  const R = regiao(t);
  const pad = 18, maxW = LP.x1 - LP.x0 - 2 * pad, mH = LP.y1 - LP.y0 - 2 * pad;
  const s = Math.min(maxW / (R[2] - R[0]), mH / (R[3] - R[1]));
  const w = (R[2] - R[0]) * s + 2 * pad, h = (R[3] - R[1]) * s + 2 * pad;
  const cx = (LP.x0 + LP.x1) / 2, cy = (LP.y0 + LP.y1) / 2;
  const F = fonte ? fonte(t) : null;
  return (
    <>
      {F && (
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: Math.min(1, e) }}>
          <rect x={F[0]} y={F[1]} width={F[2] - F[0]} height={F[3] - F[1]} rx={18} fill="rgba(249,178,51,0.12)" stroke={C.coral} strokeWidth={5} strokeDasharray="14 10" />
          {F[1] > cy + h / 2 && <line x1={(F[0] + F[2]) / 2} y1={F[1]} x2={cx} y2={cy + h / 2} stroke={C.coral} strokeWidth={5} strokeDasharray="4 12" strokeLinecap="round" />}
        </svg>
      )}
      <div style={{ position: "absolute", left: cx - w / 2, top: cy - h / 2, width: w, height: h, transform: `scale(${e})`, transformOrigin: "50% 100%",
        borderRadius: 34, background: "#FAF8F5", border: `8px solid ${C.coral}`, boxShadow: "0 22px 44px rgba(34,28,25,0.3)", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: pad - R[0] * s, top: pad - R[1] * s, width: 1170, transform: `scale(${s})`, transformOrigin: "0 0" }}>
          <Conteudo nome={nome} t={t} />
        </div>
      </div>
      <div style={{ position: "absolute", left: cx - w / 2 - 30, top: cy - h / 2 - 30, width: 84, height: 84, borderRadius: "50%", background: C.coral, border: `6px solid ${C.creme}`,
        transform: `scale(${Math.min(1, e)}) rotate(${(1 - Math.min(1, e)) * -40}deg)`, boxShadow: "0 6px 12px rgba(34,28,25,0.25)" }}>
        <svg width={72} height={72} viewBox="0 0 24 24" style={{ position: "absolute", left: 0, top: 0 }}>
          <circle cx={10.5} cy={10.5} r={5.2} fill="none" stroke="#fff" strokeWidth={2.6} /><path d="M14.5 14.5 L19 19" stroke="#fff" strokeWidth={3} strokeLinecap="round" />
        </svg>
      </div>
    </>
  );
};
const Lupas: React.FC<{ t: number }> = ({ t }) => {
  const emTela = (cx: Cx, rola: number): Cx => { const [a, b] = naTela(cx[0], cx[1], rola); const [c, d] = naTela(cx[2], cx[3], rola); return [a, b, c, d]; };
  const Tr = EV.troca;
  // na troca, a lupa mostra as 2 primeiras linhas (os descontos) e desce até a da entrega
  const lista = (tt: number): Cx => {
    const y = interpolate(tt, [Tr.desce, Tr.desce + 0.4], [1195, 1590], { ...clamp, easing: (x) => inOut(x) });
    return [40, y, 1130, y + 650];
  };
  return (
    <>
      <Lupa t={t} nome="Fidelidade" aberta={EV.boasvindas.lupa} regiao={() => PF.cartoes as Cx} fonte={() => emTela(PF.cartoes as Cx, rolaFid(t))} />
      <Lupa t={t} nome="Fidelidade" aberta={Tr.lupa} regiao={lista} fonte={(tt) => emTela(lista(tt), rolaFid(tt))} />
      <Lupa t={t} nome="Fidelidade" aberta={EV.niveis.lupa} regiao={() => PF.niveisRegiao as Cx} fonte={() => emTela(PF.niveisRegiao as Cx, rolaFid(t))} />
    </>
  );
};

// ---------------------------------------------------------------- o que está na tela do celular
const TelaDoCelular: React.FC<{ t: number }> = ({ t }) => {
  const B = EV.boasvindas;
  if (t < B.entra[0]) return <TelaRolando nome="Main" rola={0} t={t} />;
  if (t < B.entra[1]) {
    const u = inOut(entre(t, B.entra[0], B.entra[1]));
    return (
      <AbsoluteFill>
        <AbsoluteFill style={{ transform: `translateX(${-u * TEL.w * 0.3}px)`, filter: `brightness(${1 - 0.25 * u})` }}><TelaRolando nome="Main" rola={0} t={t} /></AbsoluteFill>
        <AbsoluteFill style={{ transform: `translateX(${(1 - u) * TEL.w}px)`, boxShadow: "-16px 0 30px rgba(34,28,25,0.25)" }}><TelaRolando nome="Fidelidade" rola={0} t={t} /></AbsoluteFill>
      </AbsoluteFill>
    );
  }
  return <TelaRolando nome="Fidelidade" rola={rolaFid(t)} t={t} />;
};
const Celular: React.FC<{ t: number }> = ({ t }) => {
  const G = EV.gancho;
  if (t < G.celular[0]) return null;
  let ty = (1 - outBack(entre(t, G.celular[0], G.celular[1]), 1.3)) * 1500, esc = 1, alfa = 1, tx = 0;
  const af = EV.fecho.afasta;
  if (t >= af[0]) {
    const u = inOut(entre(t, af[0], af[1]));
    esc = 1 - 0.75 * u; ty = 120 * u; tx = 60 * u; alfa = 1 - entre(t, af[1] - 0.2, af[1]);
  }
  if (alfa <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, opacity: alfa }}>
      <div style={{ position: "absolute", left: CL.x, top: CL.y, width: CL.w, height: CL.h, transform: `translate(${tx}px, ${ty}px) scale(${esc})`, transformOrigin: "50% 40%" }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: CL.w * 0.15, background: C.tinta, boxShadow: `inset 0 0 0 ${CL.w * 0.012}px #4A3E38, 0 40px 80px rgba(34,28,25,0.32)` }} />
        <div style={{ position: "absolute", right: -9, top: CL.h * 0.2, width: 12, height: CL.h * 0.09, borderRadius: 6, background: "#3B312C" }} />
        <div style={{ position: "absolute", left: -9, top: CL.h * 0.17, width: 12, height: CL.h * 0.06, borderRadius: 6, background: "#3B312C" }} />
        <div style={{ position: "absolute", left: BZ, top: BZ, width: TEL.w, height: TEL.h, borderRadius: RAIO_TELA, overflow: "hidden", background: "#141110" }}>
          <TelaDoCelular t={t} />
        </div>
        <div style={{ position: "absolute", left: CL.w / 2 - 9, top: BZ + 14, width: 18, height: 18, borderRadius: "50%", background: "#0D0B0A", boxShadow: "inset 0 0 0 3px #2A2421" }} />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- o gancho: o pão de queijo vira moedinhas que caem no contador
const PaoDeQueijo: React.FC<{ r: number; t: number }> = ({ r, t }) => (
  <svg width={r * 2.6} height={r * 3} viewBox="-130 -190 260 300" style={{ position: "absolute", left: -r * 1.3, top: -r * 1.9, overflow: "visible" }}>
    {/* a fumacinha (sobe em loop) */}
    {[0, 1, 2].map((i) => {
      const u = (t * 0.9 + i / 3) % 1;
      return <path key={i} d={`M${-40 + i * 40} ${-110 - u * 60} c-14 -16 14 -26 0 -44`} stroke="#fff" strokeWidth="9" strokeLinecap="round" fill="none" opacity={Math.sin(Math.PI * u) * 0.95} />;
    })}
    <ellipse cx="0" cy="96" rx="96" ry="12" fill="#000" opacity="0.12" />
    <path d="M-100 20 C-104 -60 -50 -96 0 -96 C52 -96 104 -60 100 20 C98 72 54 96 0 96 C-54 96 -98 72 -100 20 Z" fill="#D7962F" />
    <path d="M-96 12 C-100 -62 -48 -90 0 -90 C50 -90 98 -62 94 12 C92 62 52 84 0 84 C-52 84 -94 62 -96 12 Z" fill="#F2C063" />
    <ellipse cx="-34" cy="-46" rx="30" ry="16" fill="#FFE6A6" transform="rotate(-20 -34 -46)" />
    {[[30, -30], [-48, 10], [10, 30], [52, 26], [-12, -10], [64, -12], [-62, 44], [24, 62]].map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r={i % 2 ? 4 : 5.5} fill="#C47E1E" opacity="0.55" />
    ))}
    <path d="M-70 40 Q-40 70 4 72" stroke="#E7A84A" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.7" />
  </svg>
);
const Moeda: React.FC<{ s: number; rot?: number }> = ({ s, rot = 0 }) => (
  <svg width={s} height={s} viewBox="-50 -50 100 100" style={{ position: "absolute", left: -s / 2, top: -s / 2, transform: `rotate(${rot}deg)`, overflow: "visible" }}>
    <circle r="48" fill={OURO_ESC} />
    <circle r="44" cy="-3" fill={OURO} />
    <circle r="32" cy="-3" fill="none" stroke="#FFE08A" strokeWidth="5" />
    {/* um pãozinho de queijo no meio */}
    <path d="M-17 4 C-19 -11 -9 -18 0 -18 C9 -18 19 -11 17 4 C16 12 9 15 0 15 C-9 15 -16 12 -17 4 Z" fill={OURO_ESC} transform="translate(0 -3)" />
    <path d="M-17 1 C-19 -14 -9 -21 0 -21 C9 -21 19 -14 17 1 C16 9 9 12 0 12 C-9 12 -16 9 -17 1 Z" fill="#FFE08A" transform="translate(0 -3)" />
    <path d="M-30 -30 Q-18 -42 0 -44" stroke="#fff" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.55" />
  </svg>
);
const IconePao: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="-50 -50 100 100">
    {[[-18, 8, 22], [18, 8, 22], [0, -12, 24]].map(([x, y, r], i) => (
      <g key={i}><ellipse cx={x} cy={y + 3} rx={r} ry={r * 0.82} fill="#D7962F" /><ellipse cx={x} cy={y} rx={r} ry={r * 0.82} fill="#F2C063" />
        <ellipse cx={x - r * 0.3} cy={y - r * 0.3} rx={r * 0.35} ry={r * 0.18} fill="#FFE6A6" /></g>
    ))}
  </svg>
);
const Gancho: React.FC<{ t: number }> = ({ t }) => {
  const G = EV.gancho, P = L.gancho.pao, CT = L.gancho.contador;
  if (t > G.voa[1] + 0.05) return null;
  const elems: React.ReactNode[] = [];
  // o pão: já na tela no quadro 0 (cresce um tiquinho com quique), respira; antes de estourar, se espreme
  if (t < G.estoura + 0.05) {
    const k = 0.9 + 0.1 * outBack(entre(t, 0, 0.35), 2.2);
    const aperta = entre(t, G.estoura - 0.18, G.estoura);
    const sx = k * (1 + 0.12 * aperta) * (1 + 0.02 * Math.sin(t * 9)), sy = k * (1 - 0.14 * aperta) * (1 - 0.02 * Math.sin(t * 9));
    elems.push(
      <div key="pao" style={{ position: "absolute", left: P.cx, top: P.cy, transform: `scale(${sx}, ${sy})`, transformOrigin: `0px ${P.r * 0.96}px` }}>
        <PaoDeQueijo r={P.r} t={t} />
      </div>,
    );
  }
  // o estouro: anel e brilhos
  const ue = entre(t, G.estoura, G.estoura + 0.4);
  if (ue > 0 && ue < 1) {
    elems.push(<div key="anel" style={{ position: "absolute", left: P.cx - 200 * ue - 60, top: P.cy - 200 * ue - 60, width: 2 * (200 * ue + 60), height: 2 * (200 * ue + 60), borderRadius: "50%",
      border: `${18 * (1 - ue)}px solid ${OURO}`, opacity: 1 - ue }} />);
    [0, 1, 2, 3, 4, 5].forEach((i) => {
      const a = (i / 6) * Math.PI * 2 + 0.4, d = 90 + 170 * outCubic(ue);
      elems.push(<div key={`b${i}`} style={{ position: "absolute", left: P.cx + Math.cos(a) * d - 20, top: P.cy + Math.sin(a) * d - 20, opacity: 1 - ue, transform: `rotate(${ue * 180}deg)` }}><StarShape size={40} color={i % 2 ? C.coral : OURO} /></div>);
    });
  }
  // as moedinhas: saem do pão pra cima/os lados e caem no contador (cada uma na sua hora)
  const topoCt = CT.cy - CT.h / 2 + 30;
  G.moedas.forEach((tc, k) => {
    if (t < G.estoura || t > tc + 0.12) return;
    const r = (n: string) => random(`pdq-moeda-${k}-${n}`);
    const t0 = G.estoura, u = clamp01((t - t0) / (tc - t0));
    const x0 = P.cx + (r("x") - 0.5) * 80, y0 = P.cy;
    const xa = P.cx + (r("a") - 0.5) * 620, ya = P.cy - 180 - r("h") * 200;          // o alto do arco
    const x1 = CT.cx - 160 + (k % 7) * 53, y1 = topoCt;
    // Bézier quadrática: sai do pão, passa pelo alto e cai no contador
    const x = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * xa + u * u * x1;
    const y = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * ya + u * u * y1;
    const some = t > tc ? 1 - (t - tc) / 0.12 : 1;
    elems.push(<div key={`m${k}`} style={{ position: "absolute", left: x, top: y, transform: `scale(${(0.6 + 0.4 * Math.min(1, u * 4)) * some})` }}><Moeda s={112} rot={360 * u * (r("r") > 0.5 ? 1 : -1)} /></div>);
  });
  // o contador: 0 → 150, um pulo a cada moeda que cai; no fim, voa para o banner do Início, no celular
  const caiu = G.moedas.filter((tc) => t >= tc).length;
  const valor = Math.round((150 * caiu) / G.moedas.length);
  const ultima = [...G.moedas].reverse().find((tc) => t >= tc);
  const pulo = ultima !== undefined ? 1 + 0.12 * Math.sin(Math.PI * clamp01((t - ultima) / 0.16)) : 1;
  const uv = inOut(entre(t, G.voa[0], G.voa[1]));
  const [bx, by] = naTela(PM.saldoTexto[0] + 180, PM.saldoTexto[1], 0);
  const cx = CT.cx + (bx - CT.cx) * uv, cy = CT.cy + (by - CT.cy) * uv, esc = (1 - 0.72 * uv) * pulo * (0.94 + 0.06 * outBack(entre(t, 0, 0.3), 2));
  elems.push(
    <div key="ct" style={{ position: "absolute", left: cx - CT.w / 2, top: cy - CT.h / 2, width: CT.w, height: CT.h, transform: `scale(${esc})`, opacity: 1 - entre(uv, 0.8, 1),
      borderRadius: 44, background: "#fff", border: `8px solid ${C.coral}`, boxShadow: `0 12px 0 ${C.coralDark}, 0 24px 40px rgba(34,28,25,0.22)`, display: "flex", alignItems: "center", justifyContent: "center", gap: 18 }}>
      <IconePao s={96} />
      <span style={{ fontFamily: FONT, fontWeight: W.black, fontSize: 104, lineHeight: 1, color: C.coral, letterSpacing: -3, minWidth: 190, textAlign: "right" }}>{valor}</span>
      <span style={{ fontFamily: FONT, fontWeight: W.extraBold, fontSize: 44, lineHeight: 1, color: C.tinta, marginTop: 30 }}>pontos</span>
    </div>,
  );
  if (caiu === G.moedas.length && t < G.voa[0] + 0.1) {
    const ub = entre(t, G.conta_fim, G.conta_fim + 0.5);
    elems.push(<div key="ok" style={{ position: "absolute", left: CT.cx + CT.w / 2 - 40, top: CT.cy - CT.h / 2 - 50, transform: `scale(${outBack(ub, 2.4)})` }}>
      <StarShape size={70} color={OURO} /></div>);
  }
  return <>{elems}</>;
};

// ---------------------------------------------------------------- o Pertim (no canto, olhando para a câmera)
const VB: Record<string, [number, number]> = { moto: [300, 254], parado: [240, 270] };
const larguraDe = (pose: string, altura: number) => { const [w, h] = VB[pose] ?? [280, 284]; return (altura * w) / h; };
const falandoEm = (t: number) => S.some((c) => t >= c.voz_t0 - 0.02 && t <= c.voz_t1 + 0.04);
type Estado = { pose: Pose; expr: Expressao; cx: number; base: number; altura: number };
const PC = L.pertim;
const lista: Array<[number, Estado]> = (() => {
  const canto = (pose: Pose, expr: Expressao = "sorrindo"): Estado => ({ pose, expr, ...PC.canto });
  const fecho = (pose: Pose, expr: Expressao = "sorrindo"): Estado => ({ pose, expr, ...PC.fecho });
  const nv = EV.niveis.niveis;
  return [
    [0, { pose: "apontando", expr: "sorrindo", ...PC.gancho }],
    [EV.gancho.celular[0], canto("apontando")],
    [T[1], canto("parado")],
    [EV.boasvindas.mais30, canto("apontando")],
    [T[2], canto("parado")],
    [EV.pedido.vinte, canto("comemorando")],
    [T[3], canto("apontando")],
    [T[4], canto("parado")],
    [nv[nv.length - 1].t, canto("comemorando", "piscadinha")],
    [T[5], fecho("apontando")],
    [EV.fecho.acena, fecho("acenando")],
    [EV.fecho.pisca, fecho("acenando", "piscadinha")],
  ];
})();
const PertimCanto: React.FC<{ t: number; quadro: number }> = ({ t, quadro }) => {
  let k = 0;
  lista.forEach(([ts], i) => { if (t >= ts) k = i; });
  const [desde, e] = lista[k];
  // na troca de lugar/tamanho (gancho → canto → fecho), desliza em 0,4 s
  const ant = k > 0 ? lista[k - 1][1] : e;
  const u = inOut(entre(t, desde, desde + 0.4));
  const cx = ant.cx + (e.cx - ant.cx) * u, base = ant.base + (e.base - ant.base) * u, alt = ant.altura + (e.altura - ant.altura) * u;
  const boca = bocaNoQuadro(VISEMAS as Visemas, quadro, falandoEm(t));
  const pop = 1 + 0.08 * Math.sin(Math.PI * entre(t, desde, desde + 0.25));
  const dx = t < 0.5 ? -240 * (1 - outBack(t / 0.45, 1.6)) : 0;          // entra deslizando desde o quadro 0
  const h = alt * pop, w = larguraDe(e.pose, h);
  const rig: PertimRig = { ...respiracao(t), piscada: piscadaEm(CENA.piscadas, t, CENA.piscada_dur), olhar: [0, 0], centro: true,
    aceno: e.pose === "acenando" ? 12 * Math.sin(t * 9) : e.pose === "apontando" ? (k === 0 ? -34 : -18) + 4 * Math.sin(t * 3) : 0 };
  return (
    <div style={{ position: "absolute", left: cx - w / 2 + dx, top: base - h, width: w, height: h }}>
      <Pertim v={1} pose={e.pose} expr={e.expr} mouth={boca ?? "auto"} altura={h} rig={rig} />
    </div>
  );
};

// ---------------------------------------------------------------- o fundo
const Toldo: React.FC = () => {
  const n = 12, sw = 1080 / n, h = 92;
  return (
    <svg width={1080} height={h + 40} style={{ position: "absolute", left: 0, top: 0 }}>
      {Array.from({ length: n }).map((_, i) => (
        <path key={i} d={`M${i * sw} 0 H${(i + 1) * sw} V${h} A${sw / 2} ${sw / 2.6} 0 0 1 ${i * sw} ${h} Z`} fill={i % 2 ? C.creme : C.coral} />
      ))}
      <rect x={0} y={0} width={1080} height={14} fill={C.coralDark} />
    </svg>
  );
};
const Nota: React.FC<{ t: number }> = ({ t }) => {
  const a = entre(t, EV.gancho.celular[1] - 0.2, EV.gancho.celular[1] + 0.1) * (1 - entre(t, EV.fecho.somem, EV.fecho.somem + 0.25));
  if (a <= 0) return null;
  const N = L.nota;
  return (
    <div style={{ position: "absolute", left: N.cx - 300, width: 600, top: N.y - N.size, display: "flex", justifyContent: "center", opacity: a }}>
      <div style={{ fontFamily: FONT, fontWeight: W.extraBold, fontSize: N.size, lineHeight: `${N.size + 10}px`, color: C.tinta, background: "rgba(255,249,241,0.92)", borderRadius: 999,
        padding: "3px 18px", letterSpacing: 0.4, whiteSpace: "nowrap", boxShadow: "0 3px 8px rgba(34,28,25,0.12)" }}><span style={{ opacity: 0.7 }}>{N.texto}</span></div>
    </div>
  );
};

// ---------------------------------------------------------------- o fecho
const Fecho: React.FC<{ t: number; quadro: number }> = ({ t, quadro }) => {
  const E = EV.fecho, F = L.fecho;
  if (t < E.afasta[0]) return null;
  const out: React.ReactNode[] = [];
  // os 4 prêmios da lista saem do celular e ficam em leque; em "Conta", saem para cima
  const CA = F.cartoes, ln = PF.linhas as Cx[], sai = entre(t, E.somem, E.somem + 0.35);
  ln.forEach((cx, k) => {
    const e = mola(t, E.cartoes[k], 0.42, 1.7);
    if (e <= 0 || sai >= 1) return;
    const w = (cx[2] - cx[0]) * CA.escala, h = (cx[3] - cx[1]) * CA.escala;
    const x1 = CA.cx - w / 2, y1 = CA.y0 + k * CA.passo;
    const x0 = 590 - w / 2, y0 = 1000;
    const x = x0 + (x1 - x0) * Math.min(1, e), y = y0 + (y1 - y0) * Math.min(1, e) - 300 * inCubic(sai);
    const bob = 5 * Math.sin(t * 3 + k);
    out.push(
      <div key={`c${k}`} style={{ position: "absolute", left: x, top: y + bob, width: w, height: h, transform: `rotate(${(k % 2 ? 2.5 : -2.5) * Math.min(1, e)}deg) scale(${0.3 + 0.7 * Math.min(1.1, e)})`,
        opacity: 1 - sai, borderRadius: 50 * CA.escala, boxShadow: "0 14px 28px rgba(34,28,25,0.22)", overflow: "hidden" }}>
        <Pedaco nome="Fidelidade" cx={cx} escala={CA.escala} style={{ left: 0, top: 0 }} />
      </div>,
    );
  });
  // o "?" perto do Pertim
  const q = mola(t, E.pergunta + 0.15, 0.4, 2.4) * (1 - sai);
  if (q > 0) {
    out.push(
      <div key="q" style={{ position: "absolute", left: 120, top: 720, width: 150, height: 150, transform: `scale(${q}) rotate(${-8 + 6 * Math.sin(t * 4)}deg)` }}>
        <svg width={150} height={150} viewBox="-60 -60 120 120" style={{ overflow: "visible" }}>
          <path d="M-52 -30 Q-52 -50 -32 -50 H32 Q52 -50 52 -30 V18 Q52 38 32 38 H-4 L-26 58 L-20 38 H-32 Q-52 38 -52 18 Z" fill={C.coralDark} transform="translate(0 6)" />
          <path d="M-52 -30 Q-52 -50 -32 -50 H32 Q52 -50 52 -30 V18 Q52 38 32 38 H-4 L-26 58 L-20 38 H-32 Q-52 38 -52 18 Z" fill={C.coral} />
          <text x="0" y="22" textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize="76" fill="#fff">?</text>
        </svg>
      </div>,
    );
  }
  // a logo (para e fica até o fim), "Tudo pertim de você." e o balão de comentário
  const eLogo = interpolate(t, [E.logo.entra, E.logo.parada], [0, 1], clamp);
  const kLogo = eLogo >= 1 ? 1 : outBack(eLogo / 0.85, 1.9);
  if (eLogo > 0) {
    out.push(<Twinkles key="tw" frame={quadro} seed="pdq-fecho" points={[[300, 420], [900, 400], [290, 760], [910, 720]]} size={30} />);
    out.push(
      <div key="logo" style={{ position: "absolute", left: F.logo.cx - F.logo.d / 2, top: F.logo.cy - F.logo.d / 2, width: F.logo.d, height: F.logo.d, transform: `scale(${kLogo})`,
        opacity: Math.min(1, eLogo * 4), filter: "drop-shadow(0 16px 26px rgba(198,58,23,0.32))" }}>
        <Img src={staticFile("img/uaipertim_logo.png")} style={{ width: "100%", height: "100%" }} />
      </div>,
    );
  }
  const fr = mola(t, E.frase, 0.32, 2);
  if (fr > 0) out.push(
    <div key="fr" style={{ position: "absolute", left: 300, width: 600, top: F.frase.cy - F.frase.size * 0.6, textAlign: "center", fontFamily: FONT, fontWeight: W.black, fontSize: F.frase.size,
      lineHeight: 1.2, letterSpacing: -1.5, color: C.tinta, transform: `scale(${fr})`, opacity: Math.min(1, fr * 3), whiteSpace: "nowrap" }}>
      Tudo <span style={{ color: C.coral }}>pertim de você.</span>
    </div>,
  );
  const cm = mola(t, E.comenta, 0.35, 2.2);
  if (cm > 0) out.push(
    <div key="cm" style={{ position: "absolute", left: F.comenta.cx - 260, width: 520, top: F.comenta.cy - 50, display: "flex", justifyContent: "center", transform: `scale(${cm})` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 30px", borderRadius: 999, background: C.coral, boxShadow: `0 8px 0 ${C.coralDark}`, fontFamily: FONT, fontWeight: W.extraBold,
        fontSize: 38, color: "#fff", whiteSpace: "nowrap" }}>
        <svg width={44} height={44} viewBox="0 0 24 24"><path d="M4 4 H20 Q22 4 22 6 V15 Q22 17 20 17 H11 L6 21 L7 17 H4 Q2 17 2 15 V6 Q2 4 4 4 Z" fill="#fff" />
          {[7.5, 12, 16.5].map((x) => <circle key={x} cx={x} cy={10.5} r={1.5} fill={C.coral} />)}</svg>
        Conta nos comentários
      </div>
    </div>,
  );
  if (t > E.pisca + 0.15 && t < E.pisca + 0.9) out.push(
    <div key="st" style={{ position: "absolute", left: 300, top: 930, opacity: interpolate(t, [E.pisca + 0.15, E.pisca + 0.35, E.pisca + 0.9], [0, 1, 0], clamp) }}><StarShape size={50} color={C.amarelo} /></div>,
  );
  return <>{out}</>;
};

// ---------------------------------------------------------------- o confete do "Diamante"
const Confete: React.FC<{ t: number }> = ({ t }) => {
  const t0 = EV.niveis.niveis[EV.niveis.niveis.length - 1].t + 0.05;
  const u = entre(t, t0, t0 + 1.4);
  if (u <= 0 || u >= 1) return null;
  return (
    <>
      {Array.from({ length: 34 }).map((_, i) => {
        const r = (n: string) => random(`pdq-cf-${i}-${n}`);
        const a = r("a") * Math.PI * 2, v = 160 + 220 * r("v");
        const x = 510 + Math.cos(a) * v * outCubic(u), y = 560 + Math.sin(a) * v * outCubic(u) * 0.7 + 520 * u * u;
        const cor = [OURO, C.coral, "#4BA3D6", "#fff", C.verde][i % 5];
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: 16, height: 10, background: cor, borderRadius: 2, opacity: 1 - u * u, transform: `rotate(${720 * u * (r("r") - 0.5)}deg)` }} />;
      })}
    </>
  );
};

// ---------------------------------------------------------------- a legenda nova (a da Coisa de mineiro #03)
// Solta sobre a cena, palavra a palavra: cada palavra entra com um pop na hora em que é falada; a que está sendo dita
// fica maior e em amarelo/laranja; as palavras-chave ficam em amarelo/laranja depois de ditas; as outras voltam ao branco.
// O espaço entre as palavras nunca some: cada palavra ocupa no layout a largura que tem destacada (12% maior) + 0,24 em
// de cada lado; a palavra visível é desenhada por cima, centrada nessa caixa.
type PalavraPop = { w: string; t0: number; ate: number; chave?: boolean };
type BlocoPop = { cena: number; t0: number; t1: number; size: number; linhas: PalavraPop[][] };
const ESCALA_ATIVA = 1.12, MARGEM = 0.24;
const PalavraPopV: React.FC<{ p: PalavraPop; t: number; size: number; branca?: boolean }> = ({ p, t, size, branca }) => {
  const entrou = t >= p.t0, ativa = entrou && t < p.ate;
  const s = !entrou ? 0.001 : outBack(entre(t, p.t0, p.t0 + 0.2), 1.2) * (ativa ? ESCALA_ATIVA : 1);
  const ouro = ativa || p.chave;
  const fill: React.CSSProperties = branca ? { color: "#fff" } : ouro ? { backgroundImage: `linear-gradient(180deg, ${C.amarelo} 25%, #F08A00 100%)`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" } : { color: "#fff" };
  return (
    <span style={{ position: "relative", display: "inline-block", margin: `0 ${size * MARGEM}px`, fontSize: size * ESCALA_ATIVA }}>
      <span style={{ visibility: "hidden" }}>{p.w}</span>
      <span style={{ position: "absolute", inset: 0, display: "flex", justifyContent: "center", alignItems: "center", fontSize: size }}>
        <span style={{ position: "relative", display: "inline-block", transform: `scale(${s})`, transformOrigin: "50% 75%", opacity: entrou ? 1 : 0 }}>
          <span style={{ position: "relative", WebkitTextStroke: `${size * 0.24}px ${branca ? "#fff" : C.tinta}`, color: branca ? "#fff" : C.tinta, filter: branca ? undefined : "drop-shadow(0 6px 0 rgba(34,28,25,0.4))" }}>{p.w}</span>
          <span style={{ position: "absolute", left: 0, top: 0, ...fill }}>{p.w}</span>
        </span>
      </span>
    </span>
  );
};
const LegendaPop: React.FC<{ t: number; branca?: boolean }> = ({ t, branca }) => {
  const LG = L.legenda_pop;
  const b = (LEGENDA.blocos as BlocoPop[]).find((x) => t >= x.t0 && t < x.t1);
  if (!b) return null;
  const lh = b.size === LG.size ? LG.linha : LG.linha2;
  return (
    <div style={{ position: "absolute", left: LG.cx - LG.maxW / 2, top: LG.top, width: LG.maxW, textAlign: "center", fontFamily: FONT, fontWeight: W.extraBold, fontSize: b.size, lineHeight: `${lh}px` }}>
      {b.linhas.map((l, i) => <div key={i} style={{ whiteSpace: "nowrap" }}>{l.map((p, j) => <PalavraPopV key={j} p={p} t={t} size={b.size} branca={branca} />)}</div>)}
    </div>
  );
};

// ================================================================ a montagem
export const PaoDeQueijoPoints: React.FC<PaoDeQueijoPointsProps> = ({ mascara }) => {
  const quadro = useCurrentFrame();
  const t = quadro / FPS;
  if (mascara === "legenda") return <AbsoluteFill><LegendaPop t={t} branca /></AbsoluteFill>;
  const conteudo = (
    <>
      <Celular t={t} />
      <Gancho t={t} />
      <Lupas t={t} />
      <Confete t={t} />
      <Fecho t={t} quadro={quadro} />
      <PertimCanto t={t} quadro={quadro} />
      <Nota t={t} />
    </>
  );
  if (mascara === "conteudo") return <AbsoluteFill>{conteudo}</AbsoluteFill>;
  return (
    <AbsoluteFill style={{ background: C.creme }}>
      <CremeBackground frame={quadro} rays raysCenter={[590, 980]} raysOpacity={0.16} enfeites={false} />
      <div style={{ position: "absolute", left: 590 - 560, top: 1030 - 560, width: 1120, height: 1120, borderRadius: "50%", background: "radial-gradient(circle, rgba(242,80,43,0.16) 0%, rgba(242,80,43,0) 65%)" }} />
      <Toldo />
      {conteudo}
      <LegendaPop t={t} />
    </AbsoluteFill>
  );
};

export const PDQ = { duracao: CENA.quadros, fps: FPS };
