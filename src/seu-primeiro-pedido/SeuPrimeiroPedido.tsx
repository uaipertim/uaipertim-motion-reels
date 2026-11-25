import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, FONT, W } from "../config/theme";
import { CremeBackground } from "../components/Decor";
import { StarShape, Twinkles } from "../components/Particles";
import { PaperPlaneIcon } from "../components/AppIcons";
import { Pertim, PertimRig } from "../personagem/Pertim";
import type { Expressao, Pose } from "../personagem/logica";
import { bocaNoQuadro, piscadaEm, respiracao, Visemas } from "../personagem/rig";
import { clamp01, inCubic, inOut, outBack, outCubic } from "../pedir-no-uaipertim/efeitos";
import { FONTE } from "../quiz/QuizMineiro";
import LAYOUT from "../../reels/seu-primeiro-pedido/layout.json";
import CENA from "../../reels/seu-primeiro-pedido/dados/cena.json";
import VISEMAS from "../../reels/seu-primeiro-pedido/dados/visemas.json";
import LEGENDA from "../../reels/seu-primeiro-pedido/dados/legenda.json";

// REEL "SEU PRIMEIRO PEDIDO" (1080×1920, 30 fps): do começo ao fim, como fazer o primeiro pedido no UaiPertim, com as telas do
// app, narrado pelo Pertim. Não repete o "Cadê meu pedido?": o foco é COMO PEDIR, até a confirmação; o acompanhamento aparece
// só num relance ("Pedido recebido"). A voz, a linha do tempo (todo corte numa batida da trilha animada, 120 BPM) e a mixagem
// vêm do pipeline do Explica, Sô! (reels/seu-primeiro-pedido/roteiro.json); os tempos, de reels/seu-primeiro-pedido/dados/
// (scripts/preparar.py, amarrados às palavras da voz); as posições, de reels/seu-primeiro-pedido/layout.json.
// A ordem das telas é a do app (uaipertim/uaipertim): Início → Loja → Produto (opções, "Adicionar") → "Ver sacola" → Sacola
// ("Continuar") → Finalizar pedido (Entrega / Retirar na loja, endereço, forma de pagamento, "Fazer pedido e pagar") → o
// primeiro status ("Pagamento confirmado!" / "Pedido recebido", os textos do trackingView.ts do app).
//   1 gancho:    o Pertim segurando o celular, já no quadro 0, com "Seu primeiro pedido?" no alto; em "facim", o selo "É facim!";
//   2 loja:      o celular sobe com o Início; o toque na loja → Loja;
//   3 sacola:    o toque no lanche → Produto; "Ao ponto" e "Bacon crocante" acendem; o toque em "Adicionar" → a Loja, com o
//                contador da sacola pulando;
//   4 entrega:   "Ver sacola" → Sacola → "Continuar" → Finalizar pedido; "Entrega" e "Retirar na loja" acendem; o endereço;
//   5 pagamento: Pix, "Cartão de crédito" e "Pagar na entrega" acendem; o toque em "Fazer pedido e pagar"; o "Pedido recebido";
//   6 bônus:     o pão de queijo e as moedinhas; "+20 pontos a cada pedido concluído" (o padrão do app);
//   7 fecho:     a logo redonda, @uaipertim, "Tudo pertim de você." e "Segue a gente pra saber do lançamento"; o Pertim acena.
// O Pertim sempre olha para a câmera e nunca aparece bravo. Nota fixa "Lojas e valores ilustrativos" enquanto as telas
// aparecem. A legenda é a nova (LegendaPop), em x 110–906.
// `mascara` (só para o QA): "legenda" = só a legenda, branca; "conteudo" = tudo menos o fundo e a legenda.

export type SeuPrimeiroPedidoProps = { mascara?: "legenda" | "conteudo" };
const L = LAYOUT as typeof LAYOUT;
const EV = CENA.eventos;
const FPS = CENA.fps;
const S = CENA.cenas;
const T = [...S.map((c) => c.t0), CENA.duracao];
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const entre = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const mola = (t: number, t0: number, dur = 0.35, s = 1.9) => (t < t0 ? 0 : outBack(Math.min(1, (t - t0) / dur), s));
const noar = (t: number, n: number) => t >= T[n] && t < T[n + 1];
const abs = (x: number, y: number, extra: React.CSSProperties = {}): React.CSSProperties => ({ position: "absolute", left: x, top: y, ...extra });
const tela = (n: string) => staticFile(`telas-app/celular/${n}.png`);
type Nome = keyof typeof L.telas;
type Cx = [number, number, number, number];

// ---------------------------------------------------------------- o celular genérico e as telas (o mesmo do "Cadê meu pedido?")
const CL = L.celular;
const BZ = CL.w * CL.bezel;
const TEL = { x: CL.x + BZ, y: CL.y + BZ, w: CL.w - 2 * BZ, h: CL.h - 2 * BZ };
const K = TEL.w / 1170;
const VP = TEL.h / K;
const RAIO_TELA = CL.w * 0.11;
const PT = L.telas;

const Toque: React.FC<{ t: number; t0: number; x: number; y: number; r?: number }> = ({ t, t0, x, y, r = 70 }) => {
  const u = t - t0;
  if (u < -0.12 || u > 0.7) return null;
  const aperta = u < 0 ? (u + 0.12) / 0.12 : Math.max(0, 1 - u / 0.25);
  return (
    <>
      {[0, 0.12].map((d, i) => {
        const k = clamp01((u - d) / 0.5);
        return u >= d && k < 1 ? (
          <div key={i} style={abs(x - r * (0.6 + 1.6 * k), y - r * (0.6 + 1.6 * k), { width: r * 2 * (0.6 + 1.6 * k), height: r * 2 * (0.6 + 1.6 * k), borderRadius: "50%",
            border: `${r * 0.16 * (1 - k) + 4}px solid ${i ? C.amarelo : C.coral}`, opacity: 1 - k })} />
        ) : null;
      })}
      {aperta > 0 && <div style={abs(x - r * 0.62, y - r * 0.62, { width: r * 1.24, height: r * 1.24, borderRadius: "50%", background: C.coral, opacity: 0.32 * aperta })} />}
    </>
  );
};
const Anel: React.FC<{ cx: Cx; e: number; raio?: number; esp?: number }> = ({ cx, e, raio = 40, esp = 12 }) =>
  e <= 0.001 ? null : (
    <div style={abs(cx[0] - 10, cx[1] - 10, { width: cx[2] - cx[0] + 20, height: cx[3] - cx[1] + 20, borderRadius: raio, border: `${esp}px solid ${C.coral}`,
      boxShadow: `0 0 0 ${10 * Math.min(1, e)}px rgba(249,178,51,0.35)`, transform: `scale(${0.85 + 0.15 * Math.min(1.15, e)})`, opacity: Math.min(1, e * 2) })} />
  );
// destaque que acende em t0 e fica até `fim` (com pop)
const aceso = (t: number, t0: number, fim: number) => (t < t0 || t > fim ? 0 : mola(t, t0, 0.3, 2.4));


// o que acontece em cada tela (em px do PNG)
const Conteudo: React.FC<{ nome: Nome; t: number }> = ({ nome, t }) => {
  const Lj = EV.loja, Sc = EV.sacola, En = EV.entrega, Pg = EV.pagamento;
  const extra: React.ReactNode[] = [];
  const centro = (c: number[]): [number, number] => [(c[0] + c[2]) / 2, (c[1] + c[3]) / 2];
  if (nome === "Main") {
    const c = PT.Main.pontos.loja;
    extra.push(<Anel key="lj" cx={c as Cx} e={aceso(t, Lj.toque - 0.25, Lj.abre + 0.1)} raio={40} />);
    extra.push(<Toque key="tl" t={t} t0={Lj.toque} x={centro(c)[0]} y={centro(c)[1]} r={80} />);
  }
  if (nome === "Loja") {
    const c = PT.Loja.pontos.lanche;
    extra.push(<Anel key="ln" cx={c as Cx} e={aceso(t, Sc.toque_lanche - 0.2, Sc.produto + 0.1)} raio={40} />);
    extra.push(<Toque key="tn" t={t} t0={Sc.toque_lanche} x={centro(c)[0]} y={centro(c)[1]} r={80} />);
  }
  if (nome === "Produto") {
    const pp = PT.Produto.pontos;
    extra.push(<Anel key="po" cx={pp.ponto as Cx} e={aceso(t, Sc.ponto, Sc.volta + 0.2)} raio={30} esp={10} />);
    extra.push(<Anel key="ba" cx={pp.bacon as Cx} e={aceso(t, Sc.bacon, Sc.volta + 0.2)} raio={30} esp={10} />);
  }
  if (nome === "Checkout") {
    const ck = PT.Checkout.pontos;
    extra.push(<Anel key="ce" cx={ck.entrega as Cx} e={aceso(t, En.entrega, En.retirada)} raio={44} />);
    extra.push(<Anel key="cr" cx={ck.retirada as Cx} e={aceso(t, En.retirada, En.endereco)} raio={44} />);
    extra.push(<Anel key="cd" cx={ck.endereco as Cx} e={aceso(t, En.endereco, T[4] + 0.15)} raio={40} />);
    extra.push(<Anel key="cp" cx={ck.pix as Cx} e={aceso(t, Pg.pix, Pg.cartao)} raio={44} />);
    extra.push(<Anel key="cc" cx={ck.cartao as Cx} e={aceso(t, Pg.cartao, Pg.na_entrega)} raio={44} />);
    extra.push(<Anel key="cn" cx={ck.naEntrega as Cx} e={aceso(t, Pg.na_entrega, Pg.toque_fazer)} raio={44} />);
  }
  return (
    <div style={{ position: "relative", width: 1170, height: PT[nome].h }}>
      <Img src={tela(nome)} style={{ position: "absolute", left: 0, top: 0, width: 1170, height: PT[nome].h, maxWidth: "none" }} />
      {extra}
    </div>
  );
};
const TelaRolando: React.FC<{ nome: Nome; rola: number; t: number }> = ({ nome, rola, t }) => {
  const info = PT[nome] as { h: number; fixo: { faixa?: number[] } };
  const H = info.h;
  const r = Math.max(0, Math.min(H - VP, rola));
  const fx = info.fixo;
  const corte = fx.faixa ? (H - fx.faixa[0]) * K : 0;
  return (
    <AbsoluteFill style={{ background: "#FAF8F5", overflow: "hidden" }}>
      <div style={abs(0, 0, { width: TEL.w, height: TEL.h - corte, overflow: "hidden" })}>
        <div style={abs(0, -r * K, { width: 1170, transform: `scale(${K})`, transformOrigin: "0 0" })}><Conteudo nome={nome} t={t} /></div>
      </div>
      {fx.faixa && (
        <div style={abs(0, TEL.h - corte, { width: TEL.w, height: corte, overflow: "hidden" })}>
          <div style={abs(0, -fx.faixa[0] * K, { width: 1170, transform: `scale(${K})`, transformOrigin: "0 0" })}>
            <Img src={tela(nome)} style={{ width: 1170, height: H, maxWidth: "none" }} />
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
// o ponto (px do PNG) de um botão da faixa fixa de baixo, na tela do celular
const naFaixa = (nome: Nome, x: number, y: number): [number, number] => [x * K, TEL.h - (PT[nome].h - y) * K];


// a sequência das telas: [desde, tela, rola, "volta" (entra pela esquerda)]. O Finalizar pedido rola até o pagamento.
type Passo = [number, Nome, number, boolean];
const PASSOS: Passo[] = [
  [-1, "Main", 0, false], [EV.loja.abre, "Loja", 1300, false], [EV.sacola.produto, "Produto", 760, false], [EV.sacola.volta, "Loja", 1300, true],
  [EV.entrega.sacola, "Sacola", 0, false], [EV.entrega.checkout, "Checkout", 0, false],
];
const TRANS = 0.3;
// o Produto abre na foto e rola até as opções ("Ponto da carne", "Turbine seu lanche")
const rolaProduto = (t: number) => interpolate(t, [EV.sacola.produto + 0.25, EV.sacola.ponto - 0.05], [0, 760], { ...clamp, easing: inOut });
const TelaDoCelular: React.FC<{ t: number }> = ({ t }) => {
  let k = 0;
  PASSOS.forEach(([d], i) => { if (t >= d) k = i; });
  const [d, nome, rola0, volta] = PASSOS[k];
  const rola = nome === "Produto" && !volta ? rolaProduto(t) : rola0;
  const u = inOut(entre(t, d, d + TRANS));
  if (k === 0 || u >= 1) return <TelaRolando nome={nome} rola={rola} t={t} />;
  const [, nomeAnt, rolaAnt] = PASSOS[k - 1];
  const s = volta ? -1 : 1;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `translateX(${-s * u * TEL.w * 0.3}px)`, filter: `brightness(${1 - 0.25 * u})` }}><TelaRolando nome={nomeAnt} rola={rolaAnt} t={t} /></AbsoluteFill>
      <AbsoluteFill style={{ transform: `translateX(${s * (1 - u) * TEL.w}px)`, boxShadow: "-16px 0 30px rgba(34,28,25,0.25)" }}><TelaRolando nome={nome} rola={rola} t={t} /></AbsoluteFill>
    </AbsoluteFill>
  );
};
// os toques nos botões das faixas fixas (Adicionar, Ver sacola, Continuar, Fazer pedido e pagar) e o contador da sacola
const PorCimaDaTela: React.FC<{ t: number }> = ({ t }) => {
  const Sc = EV.sacola, En = EV.entrega, Pg = EV.pagamento;
  const [xa, ya] = naFaixa("Produto", PT.Produto.pontos.adicionar[0], PT.Produto.pontos.adicionar[1]);
  const [xv, yv] = naFaixa("Loja", PT.Loja.pontos.verSacola[0], PT.Loja.pontos.verSacola[1]);
  const [xc, yc] = naFaixa("Sacola", PT.Sacola.pontos.continuar[0], PT.Sacola.pontos.continuar[1]);
  const [xf, yf] = naFaixa("Checkout", PT.Checkout.pontos.fazer[0], PT.Checkout.pontos.fazer[1]);
  const ct = PT.Loja.pontos.contador;
  const [xn, yn] = naFaixa("Loja", (ct[0] + ct[2]) / 2, (ct[1] + ct[3]) / 2);
  const pulo = mola(t, Sc.contador, 0.4, 2.6) * (1 - entre(t, En.sacola, En.sacola + 0.1));
  return (
    <>
      <Toque t={t} t0={Sc.toque_adicionar} x={xa} y={ya} r={44} />
      {pulo > 0.01 && t < En.sacola && (
        <>
          <div style={abs(xn - 30, yn - 30, { width: 60, height: 60, borderRadius: "50%", border: `5px solid ${C.amarelo}`, transform: `scale(${0.8 + 0.8 * pulo})`, opacity: Math.max(0, 1.4 - pulo) })} />
          <div style={abs(xn - 10, yn - 70 - 60 * clamp01((t - Sc.contador) / 0.8), { fontFamily: FONT, fontWeight: W.black, fontSize: 34, color: C.amarelo, opacity: 1 - clamp01((t - Sc.contador - 0.3) / 0.5), textShadow: `0 3px 0 ${C.coralDark}` })}>+1</div>
        </>
      )}
      <Toque t={t} t0={En.toque_ver} x={xv} y={yv} r={44} />
      <Toque t={t} t0={En.toque_continuar} x={xc} y={yc} r={44} />
      <Toque t={t} t0={Pg.toque_fazer} x={xf} y={yf} r={44} />
    </>
  );
};
const Celular: React.FC<{ t: number }> = ({ t }) => {
  const Lj = EV.loja, B = EV.bonus;
  if (t < Lj.celular[0] || t > B.sai[1]) return null;
  const ty = (1 - outBack(entre(t, Lj.celular[0], Lj.celular[1]), 1.3)) * 1500;
  const us = inCubic(entre(t, B.sai[0], B.sai[1]));
  return (
    <div style={abs(0, 0, { width: 1080, height: 1920, opacity: 1 - us })}>
      <div style={abs(CL.x, CL.y, { width: CL.w, height: CL.h, transform: `translate(${200 * us}px, ${ty - 300 * us}px) scale(${1 - 0.6 * us})`, transformOrigin: "50% 40%" })}>
        <div style={{ position: "absolute", inset: 0, borderRadius: CL.w * 0.15, background: C.tinta, boxShadow: `inset 0 0 0 ${CL.w * 0.012}px #4A3E38, 0 40px 80px rgba(34,28,25,0.32)` }} />
        <div style={abs(CL.w - 3, CL.h * 0.2, { width: 12, height: CL.h * 0.09, borderRadius: 6, background: "#3B312C" })} />
        <div style={abs(-9, CL.h * 0.17, { width: 12, height: CL.h * 0.06, borderRadius: 6, background: "#3B312C" })} />
        <div style={abs(BZ, BZ, { width: TEL.w, height: TEL.h, borderRadius: RAIO_TELA, overflow: "hidden", background: "#141110" })}>
          <TelaDoCelular t={t} />
          <PorCimaDaTela t={t} />
        </div>
        <div style={abs(CL.w / 2 - 9, BZ + 14, { width: 18, height: 18, borderRadius: "50%", background: "#0D0B0A", boxShadow: "inset 0 0 0 3px #2A2421" })} />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- o "Pedido recebido" (o primeiro status, num relance)
// recriado no estilo do app com os textos do trackingView.ts (pago pelo app: "Pagamento confirmado!"; o 1º status, "Pedido recebido")
const STATUS = ["Pedido recebido", "Pedido aceito", "Em preparação", "Saiu para entrega"];
const Recebido: React.FC<{ t: number }> = ({ t }) => {
  const Pg = EV.pagamento, B = EV.bonus;
  const e = mola(t, Pg.recebido, 0.4, 1.7) * (1 - entre(t, B.sai[0] - 0.1, B.sai[0] + 0.15));
  if (e <= 0.01) return null;
  const x0 = 150, w = 780;
  return (
    <div style={abs(x0, 470, { width: w, transform: `scale(${e})`, transformOrigin: "50% 30%", opacity: Math.min(1, e * 2) })}>
      <div style={{ boxSizing: "border-box", padding: "30px 34px 34px", borderRadius: 40, background: "#fff", border: `6px solid ${C.verde}`, boxShadow: "0 24px 48px rgba(34,28,25,0.28)" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "8px 20px", borderRadius: 999, background: "#E4F3E6", fontFamily: FONT, fontWeight: W.extraBold, fontSize: 28, color: C.verdeDark, wordSpacing: 3 }}>
          <svg width={30} height={30} viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill={C.verde} /><path d="M7 12.5 L10.5 16 L17 9" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Pago pelo app
        </div>
        <div style={{ fontFamily: FONT, fontWeight: W.black, fontSize: 56, color: C.tinta, letterSpacing: -1, marginTop: 14, wordSpacing: 4 }}>Pagamento confirmado!</div>
        <div style={{ fontFamily: FONTE, fontWeight: W.medium, fontSize: 32, lineHeight: 1.2, color: C.tinta, opacity: 0.8, marginTop: 6, wordSpacing: 3 }}>Burger do Glória já recebeu seu pedido e vai confirmar em instantes.</div>
        <div style={{ position: "relative", height: 150, marginTop: 24 }}>
          <div style={abs(55, 34, { width: w - 68 - 110, height: 10, borderRadius: 5, background: "#EFE5D8" })} />
          {STATUS.map((s, k) => {
            const nx = 55 + (k * (w - 68 - 110)) / 3;
            const lit = k === 0 ? mola(t, Pg.recebido + 0.3, 0.3, 2.4) : 0;
            return (
              <React.Fragment key={k}>
                <div style={abs(nx - 28, 12, { width: 56, height: 56, borderRadius: "50%", background: lit > 0 ? C.verde : "#E3D8CA", display: "flex", alignItems: "center", justifyContent: "center",
                  transform: `scale(${1 + 0.2 * Math.max(0, lit - 0.6)})`, boxShadow: lit > 0 ? `0 0 0 ${8 + 3 * Math.sin(t * 8)}px rgba(62,158,78,0.2)` : undefined })}>
                  {lit > 0 ? <svg width={32} height={32} viewBox="0 0 24 24"><path d="M5 12.5 L10 17.5 L19 7" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
                    : <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff" }} />}
                </div>
                <div style={abs(nx - 90, 80, { width: 180, textAlign: "center", fontFamily: FONT, fontWeight: W.black, fontSize: 26, lineHeight: 1.08, letterSpacing: -0.3, color: lit > 0 ? C.verdeDark : "#A99C90" })}>{s}</div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- o Pertim (com o celular no gancho, no canto, no fecho)
const VB: Record<string, [number, number]> = { moto: [300, 254], parado: [240, 270] };
const larguraDe = (pose: string, altura: number) => { const [w, h] = VB[pose] ?? [280, 284]; return (altura * w) / h; };
const falandoEm = (t: number) => S.some((c) => t >= c.voz_t0 - 0.02 && t <= c.voz_t1 + 0.04);
const PertimEm: React.FC<{ t: number; quadro: number; pose: Pose; expr?: Expressao; cx: number; base: number; altura: number; desde?: number; aceno?: number }> = ({
  t, quadro, pose, expr = "sorrindo", cx, base, altura, desde = -9, aceno,
}) => {
  const pop = 1 + 0.07 * Math.sin(Math.PI * entre(t, desde, desde + 0.25));
  const h = altura * pop, w = larguraDe(pose, h);
  const boca = bocaNoQuadro(VISEMAS as Visemas, quadro, falandoEm(t));
  const rig: PertimRig = { ...respiracao(t), piscada: piscadaEm(CENA.piscadas, t, CENA.piscada_dur), olhar: [0, 0], centro: true,
    aceno: aceno ?? (pose === "acenando" ? 12 * Math.sin(t * 9) : pose === "apontando" ? -18 + 4 * Math.sin(t * 3) : 0) };
  return (
    <div style={abs(cx - w / 2, base - h, { width: w, height: h })}>
      <Pertim v={1} pose={pose} expr={expr} mouth={boca ?? "auto"} altura={h} rig={rig} />
    </div>
  );
};

const CelularNaMao: React.FC<{ s: number; brilho: number }> = ({ s, brilho }) => (
  <svg width={s} height={s * 1.8} viewBox="0 0 100 180" style={{ overflow: "visible" }}>
    <rect x="0" y="0" width="100" height="180" rx="18" fill={C.tinta} />
    <rect x="7" y="9" width="86" height="162" rx="12" fill="#FAF8F5" />
    <rect x="7" y="9" width="86" height="40" rx="12" fill={C.coral} />
    <circle cx="26" cy="29" r="9" fill="#fff" /><rect x="40" y="24" width="40" height="10" rx="5" fill="#fff" opacity="0.8" />
    {[60, 96, 132].map((y, i) => <g key={y}><rect x="15" y={y} width="28" height="26" rx="6" fill={["#F2B35B", "#FBE3CC", "#BFE3A8"][i]} /><rect x="49" y={y + 4} width="38" height="7" rx="3.5" fill="#D9CBBB" /><rect x="49" y={y + 15} width="24" height="7" rx="3.5" fill={C.coral} opacity="0.7" /></g>)}
    <rect x="0" y="0" width="100" height="180" rx="18" fill="#FFE48A" opacity={0.25 * brilho} />
  </svg>
);
const Gancho: React.FC<{ t: number; quadro: number }> = ({ t, quadro }) => {
  if (!noar(t, 0)) return null;
  const G = EV.gancho, PG = L.pertim.gancho;
  const sai = entre(t, G.sai, T[1]);
  const h = PG.altura, w = (h * 240) / 270, s_ = h / 270;
  const bob = 6 * Math.sin(t * 2.4);
  // a luva esquerda da pose "parado" fica em (39, 207) do viewBox (0 18 240 270): o celular vai nela
  const gx = PG.cx - w / 2 + 39 * s_, gy = PG.base - h + (207 - 18) * s_ + bob;
  const tit = mola(t, 0, 0.35, 2);
  const fac = mola(t, G.facim, 0.35, 2.4);
  return (
    <div style={abs(0, 0, { width: 1080, height: 1920, opacity: 1 - sai })}>
      <div style={abs(0, 300, { width: 1080, textAlign: "center", transform: `scale(${0.9 + 0.1 * tit})`, fontFamily: FONT, fontWeight: W.black, fontSize: 92, lineHeight: 1.08, letterSpacing: -2, color: C.tinta, wordSpacing: 6 })}>
        <div>Seu <span style={{ position: "relative", color: C.coral }}><span style={{ position: "absolute", left: "-3%", right: "-3%", bottom: "8%", height: "34%", background: C.amarelo, borderRadius: 12, zIndex: 0 }} /><span style={{ position: "relative" }}>primeiro</span></span></div>
        <div>pedido?</div>
      </div>
      <PertimEm t={t} quadro={quadro} pose="parado" expr="sorrindo" cx={PG.cx} base={PG.base + bob} altura={h} />
      <div style={abs(gx - 62, gy - 160, { transform: `rotate(${-14 + 3 * Math.sin(t * 3)}deg)`, transformOrigin: "50% 90%" })}><CelularNaMao s={124} brilho={0.5 + 0.5 * Math.sin(t * 5)} /></div>
      {/* a luva por cima do celular (segurando) */}
      <svg width={60} height={60} viewBox="-15 -15 30 30" style={abs(gx - 30 * (s_ / 1.4), gy - 30 * (s_ / 1.4), { width: 60 * (s_ / 1.4), height: 60 * (s_ / 1.4) })}>
        <circle r="10.5" fill={C.coral} /><circle cx="-8.5" cy="-1" r="4.6" fill={C.coral} /><rect x="-8" y="-15.5" width="16" height="7" rx="3.5" fill={C.creme} />
      </svg>
      {fac > 0.01 && (
        <div style={abs(620, 820, { transform: `scale(${fac}) rotate(${-6 + 3 * Math.sin(t * 4)}deg)`, transformOrigin: "20% 80%" })}>
          <div style={{ padding: "20px 34px", borderRadius: 36, background: C.coral, boxShadow: `0 9px 0 ${C.coralDark}`, fontFamily: FONT, fontWeight: W.black, fontSize: 60, color: "#fff", whiteSpace: "nowrap", letterSpacing: -1, wordSpacing: 4 }}>
            É facim!
          </div>
        </div>
      )}
      {[0, 1, 2, 3].map((i) => {
        const u = entre(t, G.facim + 0.05 * i, G.facim + 0.6 + 0.05 * i);
        if (u <= 0 || u >= 1) return null;
        const a = -0.9 + i * 0.6, d = 80 + 120 * outCubic(u);
        return <div key={i} style={abs(780 + Math.cos(a) * d - 20, 860 + Math.sin(a) * d - 20, { opacity: 1 - u })}><StarShape size={40} color={i % 2 ? C.amarelo : C.coral} /></div>;
      })}
      <Twinkles frame={quadro} seed="spp-gancho" points={[[150, 300], [930, 320], [150, 900], [940, 1180]]} size={30} />
    </div>
  );
};
type Estado = { pose: Pose; expr: Expressao };
const CANTO: Array<[number, Estado]> = [
  [T[1], { pose: "apontando", expr: "sorrindo" }],
  [T[3], { pose: "parado", expr: "sorrindo" }],
  [EV.entrega.endereco, { pose: "apontando", expr: "sorrindo" }],
  [T[4], { pose: "apontando", expr: "sorrindo" }],
  [EV.pagamento.recebido, { pose: "comemorando", expr: "alegre" }],
  [T[5], { pose: "comemorando", expr: "piscadinha" }],
];
const PertimCanto: React.FC<{ t: number; quadro: number }> = ({ t, quadro }) => {
  if (t < T[1] || t >= T[6]) return null;
  let k = 0;
  CANTO.forEach(([ts], i) => { if (t >= ts) k = i; });
  const [desde, e] = CANTO[k];
  const P = L.pertim.canto;
  const dy = t < T[1] + 0.4 ? 360 * (1 - outBack(entre(t, T[1], T[1] + 0.35), 1.4)) : 0;
  return <PertimEm t={t} quadro={quadro} pose={e.pose} expr={e.expr} cx={P.cx} base={P.base + dy} altura={P.altura} desde={desde} />;
};

// ---------------------------------------------------------------- 6 · o bônus: Pão de Queijo Points
const Moeda: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="-50 -50 100 100">
    <circle r="48" fill={C.amareloDark} /><circle r="44" cy="-3" fill={C.amarelo} /><circle r="32" cy="-3" fill="none" stroke="#FFE08A" strokeWidth="5" />
    <path d="M-17 1 C-19 -14 -9 -21 0 -21 C9 -21 19 -14 17 1 C16 9 9 12 0 12 C-9 12 -16 9 -17 1 Z" fill="#FFE08A" transform="translate(0 -3)" />
  </svg>
);
const Bonus: React.FC<{ t: number }> = ({ t }) => {
  if (!noar(t, 5)) return null;
  const B = EV.bonus;
  const ep = mola(t, B.pao, 0.4, 2), er = entre(t, B.rende, B.rende + 1.2), ec = mola(t, B.pontos, 0.35, 2.2);
  const out: React.ReactNode[] = [];
  out.push(
    <div key="pao" style={abs(590 - 170, 560 - 150, { width: 340, height: 300, transform: `scale(${ep})` })}>
      <svg width={340} height={300} viewBox="0 0 340 300" style={{ overflow: "visible" }}>
        {[0, 1, 2].map((i) => { const u = (t * 0.9 + i / 3) % 1; return <path key={i} d={`M${130 + i * 40} ${70 - u * 50} c-12 -14 12 -24 0 -38`} stroke="#fff" strokeWidth="9" strokeLinecap="round" fill="none" opacity={Math.sin(Math.PI * u)} />; })}
        <ellipse cx="170" cy="280" rx="130" ry="14" fill="#000" opacity="0.1" />
        <ellipse cx="170" cy="188" rx="130" ry="100" fill="#D7962F" /><ellipse cx="170" cy="176" rx="130" ry="100" fill="#F2C063" />
        <ellipse cx="128" cy="134" rx="46" ry="22" fill="#FFE6A6" transform="rotate(-18 128 134)" />
        {[[200, 150], [110, 190], [170, 214], [232, 200]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={6} fill="#C47E1E" opacity={0.5} />)}
      </svg>
    </div>,
  );
  // as moedinhas saltam do pão e ficam girando em volta
  for (let i = 0; i < 8; i++) {
    if (er <= 0) break;
    const a = (i / 8) * Math.PI * 2 + t * 1.6, rr = 260 * outCubic(Math.min(1, er * 1.6));
    out.push(<div key={`m${i}`} style={abs(590 + Math.cos(a) * rr - 40, 560 + Math.sin(a) * rr * 0.55 - 40, { transform: `scale(${Math.min(1, er * 3)})`, zIndex: Math.sin(a) > 0 ? 2 : 0 })}><Moeda s={80} /></div>);
  }
  if (ec > 0.01) out.push(
    <div key="card" style={abs(0, 860, { width: 1080, display: "flex", justifyContent: "center", transform: `scale(${ec})` })}>
      <div style={{ boxSizing: "border-box", padding: "26px 40px", borderRadius: 40, background: "#fff", border: `6px solid ${C.amarelo}`, boxShadow: `0 10px 0 ${C.amareloDark}, 0 24px 40px rgba(34,28,25,0.18)`, textAlign: "center" }}>
        <div style={{ fontFamily: FONT, fontWeight: W.black, fontSize: 54, color: C.tinta, letterSpacing: -1, wordSpacing: 4 }}>Pão de Queijo <span style={{ color: C.coral }}>Points</span></div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 10 }}>
          <span style={{ fontFamily: FONT, fontWeight: W.black, fontSize: 64, color: C.coral, letterSpacing: -2, textShadow: `0 5px 0 ${C.amarelo}` }}>+20</span>
          <span style={{ fontFamily: FONTE, fontWeight: W.extraBold, fontSize: 32, lineHeight: 1.15, color: C.tinta, textAlign: "left", wordSpacing: 3 }}>pontos a cada<br />pedido concluído</span>
        </div>
      </div>
    </div>,
  );
  return <>{out}</>;
};

// ---------------------------------------------------------------- 7 · o fecho
const Fecho: React.FC<{ t: number; quadro: number }> = ({ t, quadro }) => {
  if (!noar(t, 6)) return null;
  const E = EV.fecho, F = L.fecho, P = L.pertim.fecho;
  const out: React.ReactNode[] = [];
  const eLogo = interpolate(t, [E.logo.entra, E.logo.parada], [0, 1], clamp);
  const kLogo = eLogo >= 1 ? 1 : outBack(eLogo / 0.85, 1.9);
  if (eLogo > 0) {
    out.push(<Twinkles key="tw" frame={quadro} seed="spp-fecho" points={[[320, 400], [900, 390], [300, 620], [910, 600]]} size={30} />);
    out.push(<div key="logo" style={abs(F.logo.cx - F.logo.d / 2, F.logo.cy - F.logo.d / 2, { width: F.logo.d, height: F.logo.d, transform: `scale(${kLogo})`, opacity: Math.min(1, eLogo * 4),
      filter: "drop-shadow(0 16px 26px rgba(198,58,23,0.32))" })}><Img src={staticFile("img/uaipertim_logo.png")} style={{ width: "100%", height: "100%" }} /></div>);
    out.push(<div key="h" style={abs(0, F.logo.cy + F.logo.d / 2 + 18, { width: 1220, textAlign: "center", fontFamily: FONT, fontWeight: W.black, fontSize: 52, color: C.coral, letterSpacing: -1, opacity: Math.min(1, eLogo * 3) })}>@uaipertim</div>);
  }
  const fr = mola(t, E.frase, 0.32, 2);
  if (fr > 0) out.push(<div key="fr" style={abs(0, F.frase.cy + 8, { width: 1220, textAlign: "center", fontFamily: FONT, fontWeight: W.black, fontSize: F.frase.size, lineHeight: 1.2,
    letterSpacing: -1.5, wordSpacing: 4, color: C.tinta, transform: `scale(${fr})`, opacity: Math.min(1, fr * 3), whiteSpace: "nowrap" })}>Tudo <span style={{ color: C.coral }}>pertim de você.</span></div>);
  const ct = mola(t, E.cta, 0.35, 2.2);
  const voa = 6 * Math.sin(t * 4);
  if (ct > 0) out.push(
    <div key="cta" style={abs(F.cta.cx - 400, F.cta.cy, { width: 800, display: "flex", justifyContent: "center", transform: `scale(${ct})` })}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 30px 16px 18px", borderRadius: 999, background: C.coral, boxShadow: `0 8px 0 ${C.coralDark}`,
        fontFamily: FONTE, fontWeight: W.black, fontSize: 34, color: "#fff", whiteSpace: "nowrap", letterSpacing: -0.4, wordSpacing: 3 }}>
        <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,0.22)", border: "4px solid rgba(255,255,255,0.75)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <PaperPlaneIcon size={36} style={{ transform: `translate(${voa}px, ${-voa}px)` }} />
        </div>
        Segue a gente pra saber do lançamento
      </div>
    </div>,
  );
  const dy = 420 * (1 - outBack(entre(t, T[6], T[6] + 0.4), 1.4));
  out.push(<PertimEm key="pt" t={t} quadro={quadro} pose="acenando" expr={t >= E.pisca ? "piscadinha" : "sorrindo"} cx={P.cx} base={P.base + dy} altura={P.altura} desde={T[6]} />);
  if (t > E.pisca + 0.15 && t < E.pisca + 0.9) out.push(<div key="st" style={abs(400, 950, { opacity: interpolate(t, [E.pisca + 0.15, E.pisca + 0.35, E.pisca + 0.9], [0, 1, 0], clamp) })}><StarShape size={50} color={C.amarelo} /></div>);
  return <>{out}</>;
};

// ---------------------------------------------------------------- o fundo, a nota e a legenda
const Toldo: React.FC = () => {
  const n = 12, sw = 1080 / n, h = 92;
  return (
    <svg width={1080} height={h + 40} style={abs(0, 0)}>
      {Array.from({ length: n }).map((_, i) => <path key={i} d={`M${i * sw} 0 H${(i + 1) * sw} V${h} A${sw / 2} ${sw / 2.6} 0 0 1 ${i * sw} ${h} Z`} fill={i % 2 ? C.creme : C.coral} />)}
      <rect x={0} y={0} width={1080} height={14} fill={C.coralDark} />
    </svg>
  );
};
const Nota: React.FC<{ t: number }> = ({ t }) => {
  const a = entre(t, EV.loja.celular[1] - 0.2, EV.loja.celular[1] + 0.1) * (1 - entre(t, EV.bonus.sai[0], EV.bonus.sai[0] + 0.25));
  if (a <= 0) return null;
  const N = L.nota;
  return (
    <div style={abs(N.cx - 300, N.y - N.size, { width: 600, display: "flex", justifyContent: "center", opacity: a })}>
      <div style={{ fontFamily: FONT, fontWeight: W.extraBold, fontSize: N.size, lineHeight: `${N.size + 10}px`, color: C.tinta, background: "rgba(255,249,241,0.92)", borderRadius: 999,
        padding: "3px 18px", letterSpacing: 0.4, wordSpacing: 3, whiteSpace: "nowrap", boxShadow: "0 3px 8px rgba(34,28,25,0.12)" }}><span style={{ opacity: 0.7 }}>{N.texto}</span></div>
    </div>
  );
};
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
    <div style={abs(LG.cx - LG.maxW / 2, LG.top, { width: LG.maxW, textAlign: "center", fontFamily: FONT, fontWeight: W.extraBold, fontSize: b.size, lineHeight: `${lh}px` })}>
      {b.linhas.map((l, i) => <div key={i} style={{ whiteSpace: "nowrap" }}>{l.map((p, j) => <PalavraPopV key={j} p={p} t={t} size={b.size} branca={branca} />)}</div>)}
    </div>
  );
};


// ================================================================ a montagem
export const SeuPrimeiroPedido: React.FC<SeuPrimeiroPedidoProps> = ({ mascara }) => {
  const quadro = useCurrentFrame();
  const t = quadro / FPS;
  if (mascara === "legenda") return <AbsoluteFill><LegendaPop t={t} branca /></AbsoluteFill>;
  const conteudo = (
    <>
      <Gancho t={t} quadro={quadro} />
      <Celular t={t} />
      <Recebido t={t} />
      <Bonus t={t} />
      <Fecho t={t} quadro={quadro} />
      <PertimCanto t={t} quadro={quadro} />
      <Nota t={t} />
    </>
  );
  if (mascara === "conteudo") return <AbsoluteFill>{conteudo}</AbsoluteFill>;
  return (
    <AbsoluteFill style={{ background: C.creme }}>
      <CremeBackground frame={quadro} rays raysCenter={[590, 900]} raysOpacity={0.16} enfeites={false} />
      <div style={abs(590 - 560, 1000 - 560, { width: 1120, height: 1120, borderRadius: "50%", background: "radial-gradient(circle, rgba(242,80,43,0.14) 0%, rgba(242,80,43,0) 65%)" })} />
      <Toldo />
      {conteudo}
      <LegendaPop t={t} />
    </AbsoluteFill>
  );
};

export const SPP = { duracao: CENA.quadros, fps: FPS };
