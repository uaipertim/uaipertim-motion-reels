import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, FONT, W } from "../config/theme";
import { CremeBackground } from "../components/Decor";
import { StarShape, Twinkles } from "../components/Particles";
import { Pertim, PertimRig } from "../personagem/Pertim";
import type { Expressao, Pose } from "../personagem/logica";
import { Legenda, LegendaDados } from "../personagem/Legenda";
import { bocaNoQuadro, piscadaEm, respiracao, Visemas } from "../personagem/rig";
import { clamp01, inCubic, inOut, outBack, outCubic } from "../pedir-no-uaipertim/efeitos";
import LAYOUT from "../../reels/olha-ele-por-dentro/layout.json";
import CENA from "../../reels/olha-ele-por-dentro/dados/cena.json";
import VISEMAS from "../../reels/olha-ele-por-dentro/dados/visemas.json";
import LEGENDA from "../../reels/olha-ele-por-dentro/dados/legenda.json";

// REEL "OLHA ELE POR DENTRO!" (1080×1920, 30 fps): a primeira vez que o app aparece, narrado pelo Pertim.
// A voz, a linha do tempo (todo corte numa batida da trilha animada, 120 BPM) e a mixagem vêm do pipeline do Explica, Sô!
// (reels/olha-ele-por-dentro/roteiro.json); os tempos, de reels/olha-ele-por-dentro/dados/ (scripts/preparar.py, amarrados às
// palavras da voz); as posições, de reels/olha-ele-por-dentro/layout.json. As telas são os PNGs de public/telas-app/celular/
// (Main, Loja, Produto, Sacola, Checkout), em px do PNG (1170 de largura): a tela ROLA dentro de um celular genérico de
// 1440 px de altura (75% do quadro), com a barra de baixo de cada tela presa no pé do celular.
//   1 gancho:    o celular apagado acende com a logo; o Pertim surge ao lado;
//   2 início:    a logo vira a do cabeçalho do app (transição "logo"); a lupa das categorias acende uma a uma; a tela rola
//                até "Perto de você" e a lupa mostra o Mercado Central; toque no Burger do Glória;
//   3 loja:      a Loja entra empurrando (navegação do app); rola pelo cardápio; a lupa mostra o Smash Duplo (foto, preço e "+");
//   4 produto:   abre a partir do card tocado; rola até o "Turbine seu lanche"; a lupa e o bacon marcado em "marcar";
//   5 sacola:    sobe como uma folha de baixo; o Smash Duplo acende e o contador de itens pula;
//   6 pagamento: o celular gira (3D) e mostra o Finalizar pedido; rola até "Como você quer pagar?"; a lupa passa por Pix,
//                Cartão de crédito e Pagar na entrega, cada um na sua palavra;
//   7 fecho:     o celular se afasta; a logo, "Tudo pertim de você." e o selo "Em breve no Glória"; o Pertim acena e pisca.
// O Pertim fica no canto de baixo à esquerda, fora do celular, sempre olhando para a câmera. Selo fixo "Lojas e valores
// ilustrativos". A legenda gravada fica na faixa de baixo.

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

// ---------------------------------------------------------------- o celular genérico e a tela
const CL = L.celular;
const BZ = CL.w * CL.bezel;
const TEL = { x: CL.x + BZ, y: CL.y + BZ, w: CL.w - 2 * BZ, h: CL.h - 2 * BZ };
const K = TEL.w / 1170;                    // px do quadro por px do PNG
const VP = TEL.h / K;                      // a altura da tela, em px do PNG
const RAIO_TELA = CL.w * 0.11;

// um pedaço do PNG (sem CSS background: <Img> espera a imagem carregar no render)
const Pedaco: React.FC<{ nome: Nome; cx: Cx; style?: React.CSSProperties; escala?: number }> = ({ nome, cx, style, escala = 1 }) => (
  <div style={{ position: "absolute", left: cx[0] * escala, top: cx[1] * escala, width: (cx[2] - cx[0]) * escala, height: (cx[3] - cx[1]) * escala, overflow: "hidden", ...style }}>
    <Img src={tela(nome)} style={{ position: "absolute", left: -cx[0] * escala, top: -cx[1] * escala, width: 1170 * escala, height: L.telas[nome].h * escala, maxWidth: "none" }} />
  </div>
);

// o toque: um círculo que aperta e uma onda que abre (em px do PNG; r = raio)
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

// o anel de destaque (em px do PNG): um retângulo arredondado coral que entra com pop
const Anel: React.FC<{ cx: Cx; e: number; raio?: number; esp?: number; cor?: string; brilho?: boolean }> = ({ cx, e, raio = 36, esp = 12, cor = C.coral, brilho = true }) =>
  e <= 0 ? null : (
    <div style={{ position: "absolute", left: cx[0], top: cx[1], width: cx[2] - cx[0], height: cx[3] - cx[1], borderRadius: raio, border: `${esp}px solid ${cor}`,
      boxShadow: brilho ? `0 0 0 ${10 * Math.min(1, e)}px rgba(249,178,51,0.35)` : undefined, transform: `scale(${0.85 + 0.15 * Math.min(1.15, e)})`, opacity: Math.min(1, e * 2) }} />
  );

// o conteúdo da tela (o PNG inteiro, em px do PNG) com o que acontece nela: destaques, toques, o bacon marcado, o contador
const Conteudo: React.FC<{ nome: Nome; t: number }> = ({ nome, t }) => {
  const P = L.telas[nome].pontos as Record<string, unknown>;
  const extra: React.ReactNode[] = [];
  if (nome === "Main") {
    const E = EV.inicio, cats = P.cat as number[][], ca = P.catCaixa as number;
    E.cats.forEach((c, k) => {
      const prox = k + 1 < E.cats.length ? E.cats[k + 1].t : E.lupa[1];
      const atual = t >= c.t && t < prox;
      const e = t < c.t || t > E.lupa[1] + 0.2 ? 0 : atual ? mola(t, c.t, 0.3, 2.4) : 0.55;
      const [x, y] = cats[c.i];
      extra.push(<Anel key={`c${k}`} cx={[x - ca / 2 + 4, y - ca / 2 + 6, x + ca / 2 - 4, y + ca / 2 - 6 + 64]} e={e} raio={44} esp={atual ? 11 : 7} brilho={atual} />);
    });
    extra.push(<Anel key="m" cx={P.mercado as Cx} e={mola(t, E.mercado[0], 0.3, 2.4) * (t > E.mercado[1] + 0.25 ? 0 : 1)} raio={34} />);
    const b = P.burger as Cx;
    extra.push(<Toque key="tb" t={t} t0={E.toque} x={(b[0] + b[2]) / 2} y={(b[1] + b[3]) / 2} r={90} />);
  }
  if (nome === "Loja") {
    const E = EV.loja, m = P.mais as number[];
    extra.push(<Anel key="sm" cx={[m[0] - 66, m[1] - 66, m[0] + 66, m[1] + 66]} e={t > E.lupa[0] + 0.3 ? mola(t, E.lupa[0] + 0.3, 0.3, 2.4) : 0} raio={40} esp={10} />);
    extra.push(<Toque key="tm" t={t} t0={E.toque} x={m[0]} y={m[1]} r={80} />);
  }
  if (nome === "Produto") {
    const E = EV.produto, bc = P.bacon as Cx, ch = P.cheddar as Cx, ct = P.contador as Cx;
    const marcado = t >= E.marca;
    if (!marcado) {
      // antes do toque, a caixa do bacon é a caixa vazia do "Cheddar extra" (a mesma tela) e o contador "1 de 3" some
      extra.push(<div key="bv" style={{ position: "absolute", left: bc[0], top: bc[1], width: bc[2] - bc[0], height: bc[3] - bc[1], overflow: "hidden" }}>
        <Img src={tela("Produto")} style={{ position: "absolute", left: -ch[0], top: -ch[1], width: 1170, height: L.telas.Produto.h, maxWidth: "none" }} /></div>);
      extra.push(<div key="cv" style={{ position: "absolute", left: ct[0], top: ct[1], width: ct[2] - ct[0], height: ct[3] - ct[1], background: P.contadorCor as string }} />);
    } else {
      const k = outBack((t - E.marca) / 0.28, 3);
      extra.push(<Pedaco key="bm" nome="Produto" cx={bc} style={{ transform: `scale(${k})`, borderRadius: 10 }} />);
      extra.push(<Pedaco key="cm" nome="Produto" cx={ct} style={{ transform: `scale(${outBack((t - E.marca - 0.1) / 0.3, 2.6)})` }} />);
    }
    extra.push(<Toque key="tbc" t={t} t0={E.marca} x={(bc[0] + bc[2]) / 2} y={(bc[1] + bc[3]) / 2} r={70} />);
  }
  if (nome === "Sacola") {
    const E = EV.sacola, q = P.qtdCaixa as Cx, sm = P.smash as Cx;
    const flash = clamp01(1 - Math.abs(t - E.pula - 0.15) / 0.45);
    if (flash > 0) extra.push(<div key="fl" style={{ position: "absolute", left: sm[0], top: sm[1], width: sm[2] - sm[0], height: sm[3] - sm[1], borderRadius: 30, background: C.amarelo, opacity: 0.22 * flash }} />);
    const pulo = t >= E.pula ? 1 + 0.35 * Math.sin(Math.min(1, (t - E.pula) / 0.35) * Math.PI) * Math.exp(-(t - E.pula) * 2) : 1;
    if (t >= E.pula - 0.05) extra.push(<Pedaco key="q" nome="Sacola" cx={q} style={{ transform: `scale(${pulo})`, borderRadius: 30, boxShadow: pulo > 1.01 ? "0 10px 24px rgba(196,69,44,0.3)" : undefined }} />);
    const u = (t - E.pula - 0.1) / 0.8;
    if (u > 0 && u < 1) extra.push(<div key="m1" style={{ position: "absolute", left: (q[0] + q[2]) / 2 - 10, top: q[1] - 30 - 160 * outCubic(u), opacity: 1 - inCubic(u), fontFamily: FONT, fontWeight: W.black, fontSize: 70, color: C.coral }}>+1</div>);
  }
  if (nome === "Checkout") {
    const E = EV.pagamento, fs = P.formas as Cx[];
    E.formas.forEach((tf, k) => {
      const prox = k + 1 < E.formas.length ? E.formas[k + 1] : E.lupa[1] + 0.3;
      const e = t >= tf && t < prox ? mola(t, tf, 0.3, 2.4) : t >= prox && t < E.lupa[1] + 0.3 ? 0.4 : 0;
      extra.push(<Anel key={`f${k}`} cx={[fs[k][0] - 8, fs[k][1] - 8, fs[k][2] + 8, fs[k][3] + 8]} e={e} raio={44} esp={t >= tf && t < prox ? 12 : 6} brilho={t >= tf && t < prox} />);
    });
  }
  return (
    <div style={{ position: "relative", width: 1170, height: L.telas[nome].h }}>
      <Img src={tela(nome)} style={{ position: "absolute", left: 0, top: 0, width: 1170, height: L.telas[nome].h, maxWidth: "none" }} />
      {extra}
    </div>
  );
};

// a tela dentro do celular: o conteúdo rola (rola = px do PNG no topo) e a barra de baixo fica presa no pé
const TelaRolando: React.FC<{ nome: Nome; rola: number; t: number }> = ({ nome, rola, t }) => {
  const info = L.telas[nome] as { h: number; fixo: { faixa?: number[]; flutua?: number[]; raio?: number } };
  const H = info.h;
  const r = Math.max(0, Math.min(H - VP, rola));
  const fx = info.fixo;
  const corte = fx.faixa ? (H - fx.faixa[0]) * K : 0;              // a faixa de baixo ocupa o pé da tela
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
      {fx.flutua && (() => {
        const [x0, y0, x1, y1] = fx.flutua!;
        return (
          <div style={{ position: "absolute", left: x0 * K, top: TEL.h - (H - y0) * K, width: (x1 - x0) * K, height: (y1 - y0) * K, borderRadius: (fx.raio ?? 40) * K, overflow: "hidden",
            boxShadow: "0 8px 22px rgba(34,28,25,0.22)" }}>
            <Img src={tela(nome)} style={{ position: "absolute", left: -x0 * K, top: -y0 * K, width: 1170 * K, height: H * K, maxWidth: "none" }} />
          </div>
        );
      })()}
    </AbsoluteFill>
  );
};
// px do PNG (na parte que rola) → px do quadro, com o celular parado
const naTela = (x: number, y: number, rola: number): [number, number] => [TEL.x + x * K, TEL.y + (y - rola) * K];
const rolaEm = (t: number, r: number[]) => interpolate(t, [r[0], r[1]], [r[2], r[3]], { ...clamp, easing: (x) => inOut(x) });

// ---------------------------------------------------------------- a lupa (punch-in)
const LP = L.lupa;
const Lupa: React.FC<{ t: number; nome: Nome; aberta: number[]; regiao: (t: number) => Cx; fonte?: (t: number) => Cx; maxH?: number }> = ({ t, nome, aberta, regiao, fonte, maxH }) => {
  const [a, b] = aberta;
  if (t < a || t > b + 0.2) return null;
  const e = t <= b ? outBack((t - a) / 0.32, 1.9) : 1 - inCubic((t - b) / 0.2);
  const R = regiao(t);
  const pad = 18, maxW = LP.x1 - LP.x0 - 2 * pad, mH = (maxH ?? LP.y1 - LP.y0) - 2 * pad;
  const s = Math.min(maxW / (R[2] - R[0]), mH / (R[3] - R[1]));
  const w = (R[2] - R[0]) * s + 2 * pad, h = (R[3] - R[1]) * s + 2 * pad;
  const cx = (LP.x0 + LP.x1) / 2, cy = (LP.y0 + LP.y1) / 2;
  const F = fonte ? fonte(t) : null;
  return (
    <>
      {/* a moldura tracejada no lugar da tela que a lupa aumenta, e o fio até a lupa */}
      {F && (
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: Math.min(1, e) }}>
          <rect x={F[0]} y={F[1]} width={F[2] - F[0]} height={F[3] - F[1]} rx={18} fill="rgba(249,178,51,0.12)" stroke={C.coral} strokeWidth={5} strokeDasharray="14 10" />
          <line x1={(F[0] + F[2]) / 2} y1={F[1]} x2={cx} y2={cy + h / 2} stroke={C.coral} strokeWidth={5} strokeDasharray="4 12" strokeLinecap="round" />
        </svg>
      )}
      <div style={{ position: "absolute", left: cx - w / 2, top: cy - h / 2, width: w, height: h, transform: `scale(${e})`, transformOrigin: "50% 100%",
        borderRadius: 34, background: "#FAF8F5", border: `8px solid ${C.coral}`, boxShadow: "0 22px 44px rgba(34,28,25,0.3)", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: pad - R[0] * s, top: pad - R[1] * s, width: 1170, transform: `scale(${s})`, transformOrigin: "0 0" }}>
          <Conteudo nome={nome} t={t} />
        </div>
      </div>
      {/* a lupinha no canto */}
      <div style={{ position: "absolute", left: cx - w / 2 - 30, top: cy - h / 2 - 30, width: 84, height: 84, borderRadius: "50%", background: C.coral, border: `6px solid ${C.creme}`,
        transform: `scale(${Math.min(1, e)}) rotate(${(1 - Math.min(1, e)) * -40}deg)`, boxShadow: "0 6px 12px rgba(34,28,25,0.25)" }}>
        <svg width={72} height={72} viewBox="0 0 24 24" style={{ position: "absolute", left: 0, top: 0 }}>
          <circle cx={10.5} cy={10.5} r={5.2} fill="none" stroke="#fff" strokeWidth={2.6} /><path d="M14.5 14.5 L19 19" stroke="#fff" strokeWidth={3} strokeLinecap="round" />
        </svg>
      </div>
    </>
  );
};

// ---------------------------------------------------------------- o Pertim (no canto, olhando para a câmera)
const VB: Record<string, [number, number]> = { moto: [300, 254], parado: [240, 270] };
const larguraDe = (pose: string, altura: number) => { const [w, h] = VB[pose] ?? [280, 284]; return (altura * w) / h; };
const falandoEm = (t: number) => S.some((c) => t >= c.voz_t0 - 0.02 && t <= c.voz_t1 + 0.04);
type Estado = { pose: Pose; expr: Expressao; cx: number; base: number; altura: number };
const PC = L.pertim;
const estadoEm = (t: number): [Estado, number] => {
  const canto = (pose: Pose, expr: Expressao = "sorrindo"): Estado => ({ pose, expr, ...PC.canto });
  const lista: Array<[number, Estado]> = [
    [0, { pose: "apontando", expr: "alegre", ...PC.gancho }],
    [T[1], canto("apontando")],
    [T[2], canto("parado")],
    [T[3], canto("apontando", "curioso")],
    [EV.produto.marca, canto("comemorando", "alegre")],
    [T[4], canto("sacola")],
    [T[5], canto("apontando")],
    [T[6], { pose: "acenando", expr: "sorrindo", ...PC.fecho }],
    [EV.fecho.pisca, { pose: "acenando", expr: "piscadinha", ...PC.fecho }],
  ];
  let k = 0;
  lista.forEach(([ts], i) => { if (t >= ts) k = i; });
  return [lista[k][1], lista[k][0]];
};
const PertimCanto: React.FC<{ t: number; quadro: number }> = ({ t, quadro }) => {
  const [e, desde] = estadoEm(t);
  const boca = bocaNoQuadro(VISEMAS as Visemas, quadro, falandoEm(t));
  // no gancho ele entra deslizando pela esquerda desde o quadro 0; em cada troca de pose, um pulinho
  const pop = t < 0.6 ? 1 : 1 + 0.08 * Math.sin(Math.PI * entre(t, desde, desde + 0.25));
  const dx = t < 0.6 ? -260 * (1 - outBack(t / 0.5, 1.6)) : 0;
  const h = e.altura * pop, w = larguraDe(e.pose, h);
  const rig: PertimRig = { ...respiracao(t), piscada: piscadaEm(CENA.piscadas, t, CENA.piscada_dur), olhar: [0, 0], centro: true,
    aceno: e.pose === "acenando" ? 12 * Math.sin(t * 9) : e.pose === "apontando" ? -20 + 4 * Math.sin(t * 3) : 0 };
  return (
    <div style={{ position: "absolute", left: e.cx - w / 2 + dx, top: e.base - h, width: w, height: h }}>
      <Pertim v={1} pose={e.pose} expr={e.expr} mouth={boca ?? "auto"} altura={h} rig={rig} />
    </div>
  );
};

// ---------------------------------------------------------------- o fundo: creme com raios, o toldo no alto, o halo coral
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
const SeloIlustrativo: React.FC = () => (
  <div style={{ position: "absolute", left: 0, right: 0, top: L.selo.y, display: "flex", justifyContent: "center" }}>
    <div style={{ fontFamily: FONT, fontWeight: W.extraBold, fontSize: L.selo.size, lineHeight: `${L.selo.size + 8}px`, color: C.tinta, opacity: 0.6,
      background: "rgba(255,249,241,0.85)", borderRadius: 999, padding: "3px 16px", letterSpacing: 0.5, whiteSpace: "nowrap" }}>{L.selo.texto}</div>
  </div>
);

// ---------------------------------------------------------------- o que está na tela do celular em cada instante
const TelaDoCelular: React.FC<{ t: number; quadro: number }> = ({ t }) => {
  const G = EV.gancho;
  // 1 · gancho: apagada → acende com a logo (splash)
  if (t < T[1] - 0.18) {
    const luz = entre(t, G.acende, G.acende + 0.25);
    const eLogo = mola(t, G.logo, 0.45, 2.0);
    return (
      <AbsoluteFill style={{ background: "#141110" }}>
        <AbsoluteFill style={{ background: "#FAF8F5", opacity: luz }} />
        <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, rgba(249,178,51,${0.35 * luz}) 0%, rgba(249,178,51,0) 60%)` }} />
        {eLogo > 0 && (
          <div style={{ position: "absolute", left: TEL.w / 2 - 150, top: TEL.h * 0.42 - 150, width: 300, height: 300, transform: `scale(${eLogo})`, filter: "drop-shadow(0 14px 22px rgba(196,69,44,0.3))" }}>
            <Img src={staticFile("img/uaipertim_logo.png")} style={{ width: "100%", height: "100%" }} />
          </div>
        )}
      </AbsoluteFill>
    );
  }
  // 1 → 2: a logo da abertura encolhe e vira a logo do cabeçalho do app (o Início aparece por baixo)
  if (t < T[1] + 0.25) {
    const u = inOut(entre(t, T[1] - 0.18, T[1] + 0.25));
    const lg = L.telas.Main.pontos.logo;
    const x0 = TEL.w / 2 - 150, y0 = TEL.h * 0.42 - 150, d0 = 300;
    const x1 = lg[0] * K, y1 = lg[1] * K, d1 = (lg[2] - lg[0]) * K;
    return (
      <AbsoluteFill>
        <TelaRolando nome="Main" rola={0} t={t} />
        <AbsoluteFill style={{ background: "#FAF8F5", opacity: 1 - u }} />
        <div style={{ position: "absolute", left: x0 + (x1 - x0) * u, top: y0 + (y1 - y0) * u, width: d0 + (d1 - d0) * u, height: d0 + (d1 - d0) * u, opacity: 1 - entre(u, 0.85, 1) }}>
          <Img src={staticFile("img/uaipertim_logo.png")} style={{ width: "100%", height: "100%" }} />
        </div>
      </AbsoluteFill>
    );
  }
  // 2 · início (e 2 → 3: a Loja entra empurrando)
  const rMain = rolaEm(t, EV.inicio.rola);
  if (t < T[2] - 0.08) return <TelaRolando nome="Main" rola={rMain} t={t} />;
  if (t < T[2] + 0.22) {
    const u = inOut(entre(t, T[2] - 0.08, T[2] + 0.22));
    return (
      <AbsoluteFill>
        <AbsoluteFill style={{ transform: `translateX(${-u * TEL.w * 0.3}px)`, filter: `brightness(${1 - 0.25 * u})` }}><TelaRolando nome="Main" rola={rMain} t={t} /></AbsoluteFill>
        <AbsoluteFill style={{ transform: `translateX(${(1 - u) * TEL.w}px)`, boxShadow: "-16px 0 30px rgba(34,28,25,0.25)" }}><TelaRolando nome="Loja" rola={0} t={t} /></AbsoluteFill>
      </AbsoluteFill>
    );
  }
  // 3 · loja (e 3 → 4: o Produto abre a partir do card tocado)
  const rLoja = rolaEm(t, EV.loja.rola);
  if (t < T[3] - 0.1) return <TelaRolando nome="Loja" rola={rLoja} t={t} />;
  const rProd = rolaEm(t, EV.produto.rola);
  if (t < T[3] + 0.28) {
    const u = inOut(entre(t, T[3] - 0.1, T[3] + 0.28));
    const sm = L.telas.Loja.pontos.smash;
    const c0 = [sm[0] * K, (sm[1] - 200 - rLoja) * K, sm[2] * K, (sm[3] - rLoja) * K];
    const ins = [c0[1] * (1 - u), (TEL.w - c0[2]) * (1 - u), (TEL.h - c0[3]) * (1 - u), c0[0] * (1 - u)];
    return (
      <AbsoluteFill>
        <TelaRolando nome="Loja" rola={rLoja} t={t} />
        <AbsoluteFill style={{ background: `rgba(34,28,25,${0.35 * u})` }} />
        <AbsoluteFill style={{ clipPath: `inset(${ins[0]}px ${ins[1]}px ${ins[2]}px ${ins[3]}px round ${40 * (1 - u) + 6}px)` }}><TelaRolando nome="Produto" rola={rProd} t={t} /></AbsoluteFill>
      </AbsoluteFill>
    );
  }
  // 4 · produto (e 4 → 5: a Sacola sobe como uma folha)
  if (t < T[4] - 0.12) return <TelaRolando nome="Produto" rola={rProd} t={t} />;
  if (t < T[4] + 0.2) {
    const u = outCubic(entre(t, T[4] - 0.12, T[4] + 0.2));
    return (
      <AbsoluteFill>
        <TelaRolando nome="Produto" rola={rProd} t={t} />
        <AbsoluteFill style={{ background: `rgba(34,28,25,${0.4 * u})` }} />
        <AbsoluteFill style={{ transform: `translateY(${(1 - u) * TEL.h}px)`, borderRadius: 44, overflow: "hidden", boxShadow: "0 -16px 30px rgba(34,28,25,0.25)" }}><TelaRolando nome="Sacola" rola={0} t={t} /></AbsoluteFill>
      </AbsoluteFill>
    );
  }
  // 5 · sacola (o giro 5 → 6 é do celular inteiro); 6 · pagamento
  if (t < T[5]) return <TelaRolando nome="Sacola" rola={0} t={t} />;
  return <TelaRolando nome="Checkout" rola={rolaEm(t, EV.pagamento.rola)} t={t} />;
};

// ---------------------------------------------------------------- o celular (com os movimentos de cada cena)
const Celular: React.FC<{ t: number; quadro: number }> = ({ t, quadro }) => {
  // gancho: sobe um tiquinho desde o quadro 0; 5 → 6: gira em Y; fecho: se afasta
  let ty = (1 - outCubic(entre(t, 0, 0.5))) * 90, esc = 0.96 + 0.04 * outCubic(entre(t, 0, 0.5)), rotY = 0, alfa = 1, tx = 0;
  if (t >= T[5] - 0.15 && t < T[5] + 0.18) rotY = t < T[5] ? 90 * inCubic(entre(t, T[5] - 0.15, T[5])) : -90 * (1 - outCubic(entre(t, T[5], T[5] + 0.18)));
  const af = EV.fecho.afasta;
  if (t >= af[0]) {
    const u = inOut(entre(t, af[0], af[1]));
    esc = 1 - 0.72 * u; ty = -260 * u; tx = 40 * u; alfa = 1 - entre(t, af[1] - 0.2, af[1]);
  }
  if (alfa <= 0) return null;
  // o brilho da tela acendendo (gancho)
  const brilho = t < T[1] ? entre(t, EV.gancho.acende, EV.gancho.acende + 0.25) * (1 - entre(t, 1.2, T[1])) : 0;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, perspective: 2400, opacity: alfa }}>
      <div style={{ position: "absolute", left: CL.x, top: CL.y, width: CL.w, height: CL.h, transform: `translate(${tx}px, ${ty}px) scale(${esc}) rotateY(${rotY}deg)`, transformOrigin: "50% 40%" }}>
        {brilho > 0 && <div style={{ position: "absolute", left: -120, top: -120, right: -120, bottom: -120, borderRadius: 200, background: `radial-gradient(closest-side, rgba(249,178,51,${0.45 * brilho}), rgba(249,178,51,0))` }} />}
        <div style={{ position: "absolute", inset: 0, borderRadius: CL.w * 0.15, background: C.tinta, boxShadow: `inset 0 0 0 ${CL.w * 0.012}px #4A3E38, 0 40px 80px rgba(34,28,25,0.32)` }} />
        <div style={{ position: "absolute", right: -9, top: CL.h * 0.2, width: 12, height: CL.h * 0.09, borderRadius: 6, background: "#3B312C" }} />
        <div style={{ position: "absolute", left: -9, top: CL.h * 0.17, width: 12, height: CL.h * 0.06, borderRadius: 6, background: "#3B312C" }} />
        <div style={{ position: "absolute", left: BZ, top: BZ, width: TEL.w, height: TEL.h, borderRadius: RAIO_TELA, overflow: "hidden", background: "#141110" }}>
          <TelaDoCelular t={t} quadro={quadro} />
        </div>
        {/* a câmera (genérica, sem marca) */}
        <div style={{ position: "absolute", left: CL.w / 2 - 9, top: BZ + 14, width: 18, height: 18, borderRadius: "50%", background: "#0D0B0A", boxShadow: "inset 0 0 0 3px #2A2421" }} />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- as lupas e os toques nas barras presas
const Lupas: React.FC<{ t: number }> = ({ t }) => {
  const E = EV, P = L.telas;
  const cats = P.Main.pontos.categorias as Cx;
  const r2 = rolaEm(t, E.inicio.rola), rL = rolaEm(t, E.loja.rola), rP = rolaEm(t, E.produto.rola), rC = rolaEm(t, E.pagamento.rola);
  const emTela = (cx: Cx, rola: number): Cx => { const [a, b] = naTela(cx[0], cx[1], rola); const [c, d] = naTela(cx[2], cx[3], rola); return [a, b, c, d]; };
  const fs = P.Checkout.pontos.formas as Cx[];
  // na pagamento, a lupa passeia pelas formas: o centro vai de uma para a outra, cada uma na sua palavra
  const formaEm = (tt: number): Cx => {
    const c = (k: number) => [(fs[k][1] + fs[k][3]) / 2];
    let y = c(0)[0];
    E.pagamento.formas.forEach((tf, k) => { if (k) y = interpolate(tt, [tf - 0.12, tf + 0.18], [y, c(k)[0]], { ...clamp, easing: (x) => inOut(x) }); });
    return [fs[0][0] - 20, y - 225, fs[0][2] + 20, y + 225];
  };
  const formaFonte = (tt: number): Cx => {
    let k = 0; E.pagamento.formas.forEach((tf, i) => { if (tt >= tf - 0.12) k = i; });
    return emTela([fs[k][0] - 8, fs[k][1] - 8, fs[k][2] + 8, fs[k][3] + 8], rC);
  };
  return (
    <>
      <Lupa t={t} nome="Main" aberta={E.inicio.lupa} regiao={() => cats} fonte={() => emTela(cats, r2)} maxH={300} />
      <Lupa t={t} nome="Main" aberta={E.inicio.mercado} regiao={() => P.Main.pontos.mercado as Cx} fonte={() => emTela(P.Main.pontos.mercado as Cx, r2)} maxH={300} />
      <Lupa t={t} nome="Loja" aberta={E.loja.lupa} regiao={() => P.Loja.pontos.smash as Cx} fonte={() => emTela(P.Loja.pontos.smash as Cx, rL)} />
      <Lupa t={t} nome="Produto" aberta={E.produto.lupa} regiao={() => P.Produto.pontos.turbine as Cx} fonte={() => emTela(P.Produto.pontos.turbine as Cx, rP)} />
      <Lupa t={t} nome="Checkout" aberta={E.pagamento.lupa} regiao={formaEm} fonte={formaFonte} />
    </>
  );
};
// os toques nas barras presas no pé do celular ("Adicionar", "Continuar"), em px do quadro
const ToquesNasBarras: React.FC<{ t: number }> = ({ t }) => {
  const pAd = L.telas.Produto.pontos.adicionar, pCo = L.telas.Sacola.pontos.continuar;
  const pe = (nome: Nome, x: number, y: number): [number, number] => [TEL.x + x * K, TEL.y + TEL.h - (L.telas[nome].h - y) * K];
  const [ax, ay] = pe("Produto", pAd[0], pAd[1]), [cx, cy] = pe("Sacola", pCo[0], pCo[1]);
  return (
    <>
      <Toque t={t} t0={EV.produto.toque} x={ax} y={ay} r={44} />
      <Toque t={t} t0={EV.sacola.toque} x={cx} y={cy} r={44} />
    </>
  );
};

// ---------------------------------------------------------------- o fecho
const Fecho: React.FC<{ t: number; quadro: number }> = ({ t, quadro }) => {
  const E = EV.fecho, F = L.fecho;
  if (t < E.afasta[0]) return null;
  const eLogo = interpolate(t, [E.logo.entra, E.logo.parada], [0, 1], clamp);
  const kLogo = eLogo >= 1 ? 1 : outBack(eLogo / 0.85, 1.9);
  const fr = mola(t, E.frase, 0.32, 2);
  const selo = t - E.selo;
  const kSelo = selo < 0 ? 0 : selo < 0.12 ? 2.2 - 1.3 * (selo / 0.12) : 0.9 + 0.1 * outBack((selo - 0.12) / 0.25, 3);
  return (
    <>
      <Twinkles frame={quadro} seed="oepd-fecho" points={[[150, 520], [930, 480], [140, 800], [940, 780]]} size={30} />
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
      {t > E.pisca + 0.15 && t < E.pisca + 0.9 && (
        <div style={{ position: "absolute", left: 330, top: 930, opacity: interpolate(t, [E.pisca + 0.15, E.pisca + 0.35, E.pisca + 0.9], [0, 1, 0], clamp) }}><StarShape size={50} color={C.amarelo} /></div>
      )}
    </>
  );
};

// ================================================================ a montagem
export const OlhaElePorDentro: React.FC = () => {
  const quadro = useCurrentFrame();
  const t = quadro / FPS;
  return (
    <AbsoluteFill style={{ background: C.creme }}>
      <CremeBackground frame={quadro} rays raysCenter={[590, 980]} raysOpacity={0.16} enfeites={false} />
      {/* o halo coral atrás do celular */}
      <div style={{ position: "absolute", left: 590 - 560, top: 1030 - 560, width: 1120, height: 1120, borderRadius: "50%", background: "radial-gradient(circle, rgba(242,80,43,0.16) 0%, rgba(242,80,43,0) 65%)" }} />
      <Toldo />
      <Celular t={t} quadro={quadro} />
      {t < EV.fecho.afasta[0] && <ToquesNasBarras t={t} />}
      <Lupas t={t} />
      <Fecho t={t} quadro={quadro} />
      <PertimCanto t={t} quadro={quadro} />
      <SeloIlustrativo />
      <Legenda t={t} dados={LEGENDA as LegendaDados} />
    </AbsoluteFill>
  );
};

export const OLHA = { duracao: CENA.quadros, fps: FPS };
