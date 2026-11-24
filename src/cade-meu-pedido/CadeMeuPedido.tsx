import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, FONT, W } from "../config/theme";
import { CremeBackground } from "../components/Decor";
import { StarShape, Twinkles } from "../components/Particles";
import { ScooterIcon } from "../components/AppIcons";
import { BellGlyph } from "../components/Icons";
import { Pertim, PertimRig } from "../personagem/Pertim";
import type { Expressao, Pose } from "../personagem/logica";
import { bocaNoQuadro, piscadaEm, respiracao, Visemas } from "../personagem/rig";
import { clamp01, inCubic, inOut, outBack, outCubic } from "../pedir-no-uaipertim/efeitos";
import { FONTE } from "../quiz/QuizMineiro";
import LAYOUT from "../../reels/cade-meu-pedido/layout.json";
import CENA from "../../reels/cade-meu-pedido/dados/cena.json";
import VISEMAS from "../../reels/cade-meu-pedido/dados/visemas.json";
import LEGENDA from "../../reels/cade-meu-pedido/dados/legenda.json";

// REEL "CADÊ MEU PEDIDO?" (1080×1920, 30 fps): uma demonstração rápida do app com as telas reais, com o destaque no
// acompanhamento do pedido, narrada pelo Pertim. A voz, a linha do tempo (todo corte numa batida da trilha animada, 120 BPM)
// e a mixagem vêm do pipeline do Explica, Sô! (reels/cade-meu-pedido/roteiro.json); os tempos, de reels/cade-meu-pedido/dados/
// (scripts/preparar.py, amarrados às palavras da voz); as posições, de reels/cade-meu-pedido/layout.json.
//   1 gancho:     o Pertim espiando por cima do portão, o relógio girando no muro e o balão "cadê meu pedido?" (quadro 0 montado);
//   2 whatsapp:   os balões "e aí, já saiu?" se empilham e somem com um "puf";
//   3 pedido:     Main → Loja → Sacola → Checkout, com os toques (na loja, no "+", em "Ver sacola", "Continuar", "Fazer pedido");
//   4 pagamento:  Pix.png com a lupa no QR; o Checkout com "Cartão de crédito" e "Pagar na entrega" acesos; o selo "ou na entrega";
//   5 acompanha:  Acompanhar.png (já na linha do tempo) e o painel com a barrinha: Aceito → Em preparo → Pronto → Saiu para
//                 entrega acendem na sua palavra e a motinha anda até cada um;
//   6 aviso:      a notificação "Seu pedido saiu para entrega 🛵" cai no topo do celular;
//   7 fecho:      o Pertim chega no portão com a sacola; a logo redonda, "Tudo pertim de você." e o balão "Conta aqui 👇".
// O Pertim sempre olha para a câmera e nunca aparece bravo. Nota fixa "Lojas e valores ilustrativos" enquanto as telas
// aparecem. A legenda é a nova (LegendaPop), em x 110–906.
// `mascara` (só para o QA): "legenda" = só a legenda, branca; "conteudo" = tudo menos o fundo e a legenda.

export type CadeMeuPedidoProps = { mascara?: "legenda" | "conteudo" };
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

// ---------------------------------------------------------------- o celular genérico e as telas (o mesmo do "Pão de Queijo Points")
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
  const P = EV.pedido, Pg = EV.pagamento, A = EV.acompanha;
  const extra: React.ReactNode[] = [];
  if (nome === "Main") {
    extra.push(<Anel key="lj" cx={PT.Main.pontos.loja as Cx} e={aceso(t, P.toque_loja - 0.25, P.loja + 0.1)} raio={40} />);
    const c = PT.Main.pontos.loja;
    extra.push(<Toque key="tl" t={t} t0={P.toque_loja} x={(c[0] + c[2]) / 2} y={(c[1] + c[3]) / 2} r={80} />);
  }
  if (nome === "Loja") {
    const m = PT.Loja.pontos.mais;
    extra.push(<Toque key="tm" t={t} t0={P.toque_mais} x={(m[0] + m[2]) / 2} y={(m[1] + m[3]) / 2} r={70} />);
    const u = clamp01((t - P.toque_mais - 0.05) / 0.7);
    if (u > 0 && u < 1) extra.push(<div key="m1" style={abs((m[0] + m[2]) / 2 - 60, m[1] - 70 - 160 * outCubic(u), { opacity: 1 - inCubic(u), fontFamily: FONT, fontWeight: W.black, fontSize: 100, color: C.coral, textShadow: `0 6px 0 ${C.amarelo}` })}>+1</div>);
  }
  if (nome === "Checkout") {
    const ck = PT.Checkout.pontos;
    extra.push(<Anel key="cc" cx={ck.cartao as Cx} e={aceso(t, Pg.cartao + 0.1, Pg.entrega)} raio={44} />);
    extra.push(<Anel key="ce" cx={ck.entrega as Cx} e={aceso(t, Pg.entrega, T[4] + 0.2)} raio={44} />);
  }
  if (nome === "Pix") extra.push(<Anel key="qr" cx={PT.Pix.pontos.qr as Cx} e={aceso(t, Pg.qr, Pg.cartao + 0.1)} raio={30} />);
  if (nome === "Acompanhar") {
    const ln = PT.Acompanhar.pontos.linhas as Cx[];
    const st = A.status;
    // Aceito, Em preparo e Pronto acendem a linha "Loja aceitou e preparou"; "Saiu para entrega", a dela
    extra.push(<Anel key="a1" cx={ln[1]} e={aceso(t, st[0], st[3])} raio={36} esp={10} />);
    extra.push(<Anel key="a2" cx={ln[2]} e={aceso(t, st[3], EV.fecho.sai[0] + 0.2)} raio={36} esp={10} />);
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

// a sequência das telas: [desde, tela, rola, "volta" (entra pela esquerda)]
type Passo = [number, Nome, number, boolean];
const P_ = EV.pedido, PG = EV.pagamento, AC = EV.acompanha;
const PASSOS: Passo[] = [
  [-1, "Main", 0, false], [P_.loja, "Loja", 0, false], [P_.sacola, "Sacola", 0, false], [P_.checkout, "Checkout", 0, false],
  [PG.pix[0], "Pix", 0, false], [PG.cartao, "Checkout", 0, true], [AC.tela[0], "Acompanhar", PT.Acompanhar.rola, false],
];
const TRANS = 0.3;
const TelaDoCelular: React.FC<{ t: number }> = ({ t }) => {
  let k = 0;
  PASSOS.forEach(([d], i) => { if (t >= d) k = i; });
  const [d, nome, rola, volta] = PASSOS[k];
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
// os toques nos botões das faixas fixas (Ver sacola, Continuar, Fazer pedido e pagar) e a notificação: por cima da tela
const PorCimaDaTela: React.FC<{ t: number }> = ({ t }) => {
  const P = EV.pedido;
  const [x1, y1] = naFaixa("Loja", PT.Loja.pontos.verSacola[0], PT.Loja.pontos.verSacola[1]);
  const [x2, y2] = naFaixa("Sacola", PT.Sacola.pontos.continuar[0], PT.Sacola.pontos.continuar[1]);
  const [x3, y3] = naFaixa("Checkout", PT.Checkout.pontos.fazer[0], PT.Checkout.pontos.fazer[1]);
  return (
    <>
      <Toque t={t} t0={P.toque_sacola} x={x1} y={y1} r={44} />
      <Toque t={t} t0={P.toque_continuar} x={x2} y={y2} r={44} />
      <Toque t={t} t0={P.toque_fazer} x={x3} y={y3} r={44} />
    </>
  );
};
const Celular: React.FC<{ t: number }> = ({ t }) => {
  const P = EV.pedido, F = EV.fecho;
  if (t < P.celular[0] || t > F.sai[1]) return null;
  const ty = (1 - outBack(entre(t, P.celular[0], P.celular[1]), 1.3)) * 1500;
  const us = inCubic(entre(t, F.sai[0], F.sai[1]));
  const esc = 1 - 0.6 * us, alfa = 1 - us;
  return (
    <div style={abs(0, 0, { width: 1080, height: 1920, opacity: alfa })}>
      <div style={abs(CL.x, CL.y, { width: CL.w, height: CL.h, transform: `translate(${200 * us}px, ${ty - 300 * us}px) scale(${esc})`, transformOrigin: "50% 40%" })}>
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

// ---------------------------------------------------------------- a lupa do QR (no alto) e o painel do acompanhamento
const LP = L.lupa;
const LupaQR: React.FC<{ t: number }> = ({ t }) => {
  const Pg = EV.pagamento;
  const a = Pg.qr, b = Pg.cartao - 0.1;
  if (t < a || t > b + 0.2) return null;
  const e = t <= b ? outBack(clamp01((t - a) / 0.32), 1.9) : 1 - inCubic((t - b) / 0.2);
  const R = PT.Pix.pontos.qr as Cx;
  const s = (LP.y1 - LP.y0 - 60) / (R[3] - R[1]);
  const w = (R[2] - R[0]) * s + 36, h = (R[3] - R[1]) * s + 36, cx = 590, cy = (LP.y0 + LP.y1) / 2;
  return (
    <div style={abs(cx - w / 2, cy - h / 2, { width: w, height: h, transform: `scale(${e})`, transformOrigin: "50% 100%", borderRadius: 34, background: "#fff", border: `8px solid ${C.coral}`,
      boxShadow: "0 22px 44px rgba(34,28,25,0.3)", overflow: "hidden" })}>
      <div style={abs(18 - R[0] * s, 18 - R[1] * s, { width: 1170, transform: `scale(${s})`, transformOrigin: "0 0" })}>
        <Img src={tela("Pix")} style={{ width: 1170, height: PT.Pix.h, maxWidth: "none" }} />
      </div>
    </div>
  );
};
const SeloEntrega: React.FC<{ t: number }> = ({ t }) => {
  const Pg = EV.pagamento;
  const e = mola(t, Pg.selo, 0.35, 2.4) * (1 - entre(t, T[4] - 0.15, T[4]));
  if (e <= 0.01) return null;
  return (
    <div style={abs(0, 520, { width: 1080, display: "flex", justifyContent: "center", transform: `scale(${e}) rotate(${-4 + 1.5 * Math.sin(t * 3)}deg)` })}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "18px 40px 18px 22px", borderRadius: 999, background: C.verde, boxShadow: `0 10px 0 ${C.verdeDark}, 0 20px 36px rgba(34,28,25,0.22)` }}>
        <div style={{ width: 76, height: 76, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><ScooterIcon size={62} /></div>
        <span style={{ fontFamily: FONT, fontWeight: W.black, fontSize: 58, color: "#fff", whiteSpace: "nowrap", letterSpacing: -1, wordSpacing: 4 }}>ou na entrega</span>
      </div>
    </div>
  );
};
const STATUS = ["Aceito", "Em preparo", "Pronto", "Saiu para entrega"];
const PainelStatus: React.FC<{ t: number }> = ({ t }) => {
  const A = EV.acompanha, F = EV.fecho;
  const a = A.painel, b = F.sai[0];
  if (t < a || t > b + 0.2) return null;
  const e = t <= b ? outBack(clamp01((t - a) / 0.22), 1.6) : 1 - inCubic((t - b) / 0.2);
  const x0 = 110, x1 = 930, W_ = x1 - x0, nx = (k: number) => x0 + 80 + (k * (W_ - 160)) / 3;
  const st = A.status;
  // a motinha: anda até o status da vez (0,35 s depois da palavra), parte de antes do 1º
  let pos = -0.35;
  st.forEach((ts, k) => { pos = Math.max(pos, k - 1 + inOut(clamp01((t - ts) / 0.35))); });
  const mx = x0 + 80 + ((Math.max(-0.35, pos)) * (W_ - 160)) / 3;
  const quique = 4 * Math.abs(Math.sin(t * 14));
  return (
    <div style={abs(x0, 322, { width: W_, height: 300, transform: `scale(${e})`, transformOrigin: "50% 0%", opacity: Math.min(1, e * 3) })}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 40, background: "#fff", border: `6px solid ${C.cremeDeep}`, boxShadow: "0 22px 44px rgba(34,28,25,0.22)" }} />
      <div style={abs(0, 20, { width: W_, textAlign: "center", fontFamily: FONT, fontWeight: W.black, fontSize: 36, color: C.tinta, letterSpacing: -0.5, wordSpacing: 4 })}>
        Pedido <span style={{ color: C.coral }}>#UP-1024</span>
      </div>
      {/* a barrinha (o trilho e o trecho já andado) */}
      <div style={abs(80, 146, { width: W_ - 160, height: 16, borderRadius: 8, background: "#EFE5D8" })} />
      <div style={abs(80, 146, { width: Math.max(0, mx - x0 - 80), height: 16, borderRadius: 8, background: C.verde })} />
      {STATUS.map((s, k) => {
        const ek = t >= st[k] ? mola(t, st[k], 0.3, 2.4) : 0;
        const atual = t >= st[k] && (k === 3 || t < st[k + 1]);
        const cor = ek > 0 ? (atual ? C.coral : C.verde) : "#E3D8CA";
        return (
          <React.Fragment key={k}>
            <div style={abs(nx(k) - x0 - 34, 120, { width: 68, height: 68, borderRadius: "50%", background: cor, display: "flex", alignItems: "center", justifyContent: "center",
              transform: `scale(${1 + 0.18 * Math.max(0, ek - 0.6) + (atual ? 0.06 * Math.sin(t * 8) : 0)})`, boxShadow: atual ? "0 0 0 10px rgba(242,80,43,0.18)" : undefined })}>
              {ek > 0 ? <svg width={40} height={40} viewBox="0 0 24 24"><path d="M5 12.5 L10 17.5 L19 7" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
                : <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff" }} />}
            </div>
            <div style={abs(nx(k) - x0 - 100, 200, { width: 200, textAlign: "center", fontFamily: FONT, fontWeight: W.black, fontSize: 30, lineHeight: 1.08, letterSpacing: -0.4,
              color: ek > 0 ? (atual ? C.coral : C.tinta) : "#A99C90" })}>{s}</div>
          </React.Fragment>
        );
      })}
      {/* a motinha andando na barrinha */}
      <div style={abs(mx - x0 - 46, 50 - quique, { width: 92, height: 92 })}><ScooterIcon size={92} wheelSpin={t * 720} /></div>
    </div>
  );
};
const Notificacao: React.FC<{ t: number }> = ({ t }) => {
  const V = EV.aviso, F = EV.fecho;
  const e = entre(t, V.notif, V.notif + 0.4), sai = entre(t, F.sai[0] - 0.1, F.sai[0] + 0.15);
  if (e <= 0 || sai >= 1) return null;
  const y = 340 - 230 * (1 - outBack(e, 1.6)) - 200 * inCubic(sai);
  const toca = t >= V.sino ? 16 * Math.sin((t - V.sino) * 30) * Math.max(0, 1 - (t - V.sino) / 0.8) : 0;
  return (
    <div style={abs(140, y, { width: 790, boxSizing: "border-box", padding: "22px 26px", borderRadius: 36, background: "rgba(255,255,255,0.98)", boxShadow: "0 22px 44px rgba(34,28,25,0.3)",
      display: "flex", alignItems: "center", gap: 22, opacity: Math.min(1, e * 3) * (1 - sai) })}>
      <div style={{ position: "relative", flex: "none" }}>
        <Img src={staticFile("img/uaipertim_logo.png")} style={{ width: 92, height: 92 }} />
        <div style={abs(58, -16, { width: 54, height: 54, borderRadius: "50%", background: C.amarelo, border: "4px solid #fff", display: "flex", alignItems: "center", justifyContent: "center" })}>
          <BellGlyph size={34} swing={toca} />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontFamily: FONT, fontWeight: W.extraBold, fontSize: 28, color: "#9C8F86", letterSpacing: 0.3, wordSpacing: 3 }}>UaiPertim · agora</span>
        <span style={{ fontFamily: FONTE, fontWeight: W.black, fontSize: 36, color: C.tinta, letterSpacing: -0.6, wordSpacing: 3, whiteSpace: "nowrap" }}>Seu pedido saiu para entrega 🛵</span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- o portão (gancho e fecho), o relógio e os balões
const PO = L.portao;
const SemCenario = React.createContext(false);
const Muro: React.FC<{ t: number }> = ({ t }) => React.useContext(SemCenario) ? null : (
  <svg width={1080} height={1920} style={abs(0, 0)}>
    {/* o muro da casa, a calçada e as plantinhas */}
    <rect x={60} y={PO.muro} width={960} height={PO.base - PO.muro} rx={24} fill="#FBE3CC" />
    <rect x={60} y={PO.muro} width={960} height={36} rx={18} fill="#F2C9A4" />
    {Array.from({ length: 6 }).map((_, i) => <path key={i} d={`M60 ${PO.muro + 100 + i * 110} H1020`} stroke="#F2D2B4" strokeWidth={4} />)}
    <rect x={30} y={PO.base - 6} width={1020} height={26} rx={10} fill="#E2CDB2" />
    {[[120, PO.base], [985, PO.base]].map(([x, y], i) => (
      <g key={i} transform={`translate(${x} ${y}) rotate(${3 * Math.sin(t * 2 + i)})`}>
        <path d="M-34 -64 L34 -64 L26 0 L-26 0 Z" fill="#C9673A" />
        <path d="M0 -64 C-40 -120 -70 -110 -60 -150 C-20 -140 -6 -110 0 -64 Z M0 -64 C30 -130 64 -130 62 -170 C24 -160 6 -120 0 -64 Z M0 -64 C-6 -140 10 -170 0 -200 C-14 -170 -10 -120 0 -64 Z" fill={C.verde} />
      </g>
    ))}
  </svg>
);
// a grade do portão (vai por cima do Pertim no gancho: ele espia por cima)
const Grade: React.FC = () => {
  const n = 9, w = PO.x1 - PO.x0;
  if (React.useContext(SemCenario)) return null;
  return (
    <svg width={1080} height={1920} style={abs(0, 0)}>
      <rect x={PO.x0 - 26} y={PO.topo - 70} width={30} height={PO.base - PO.topo + 70} rx={8} fill="#C9673A" />
      <rect x={PO.x1 - 4} y={PO.topo - 70} width={30} height={PO.base - PO.topo + 70} rx={8} fill="#C9673A" />
      <rect x={PO.x0 - 34} y={PO.topo - 86} width={46} height={22} rx={6} fill="#A9512B" />
      <rect x={PO.x1 - 12} y={PO.topo - 86} width={46} height={22} rx={6} fill="#A9512B" />
      {[PO.topo, PO.topo + 150, PO.base - 30].map((y, i) => <rect key={i} x={PO.x0} y={y} width={w} height={14} rx={7} fill={C.coralDark} />)}
      {Array.from({ length: n }).map((_, i) => {
        const x = PO.x0 + 30 + (i * (w - 60)) / (n - 1);
        return <g key={i}><rect x={x - 6} y={PO.topo - 24} width={12} height={PO.base - PO.topo + 10} rx={6} fill={C.coral} /><circle cx={x} cy={PO.topo - 28} r={10} fill={C.coral} /></g>;
      })}
    </svg>
  );
};
const Relogio: React.FC<{ s: number; giro: number }> = ({ s, giro }) => (
  <svg width={s} height={s} viewBox="-60 -60 120 120" style={{ overflow: "visible" }}>
    <circle r="56" fill={C.coralDark} /><circle r="52" fill={C.coral} /><circle r="44" fill="#fff" />
    {Array.from({ length: 12 }).map((_, i) => <path key={i} d="M0 -38 V-32" stroke={C.tinta} strokeWidth={i % 3 ? 2.5 : 4.5} strokeLinecap="round" transform={`rotate(${i * 30})`} />)}
    <path d="M0 0 V-22" stroke={C.tinta} strokeWidth="6" strokeLinecap="round" transform={`rotate(${giro / 12})`} />
    <path d="M0 0 V-33" stroke={C.coral} strokeWidth="4" strokeLinecap="round" transform={`rotate(${giro})`} />
    <circle r="5" fill={C.tinta} />
  </svg>
);
const Balao: React.FC<{ texto: string; cauda?: "e" | "d"; size?: number; fundo?: string; cor?: string; checks?: boolean }> = ({ texto, cauda = "e", size = 44, fundo = "#fff", cor = C.tinta, checks }) => (
  <div style={{ position: "relative", display: "inline-flex", alignItems: "flex-end", gap: 12, padding: `${size * 0.4}px ${size * 0.6}px`, borderRadius: size * 0.7, background: fundo,
    boxShadow: "0 10px 24px rgba(34,28,25,0.18)", fontFamily: FONTE, fontWeight: W.black, fontSize: size, lineHeight: 1.1, color: cor, whiteSpace: "nowrap", letterSpacing: -0.5, wordSpacing: 4 }}>
    {texto}
    {checks && <svg width={size * 0.8} height={size * 0.5} viewBox="0 0 32 20" style={{ marginBottom: 4 }}><path d="M2 11 L7 16 L16 5 M12 14 L14 16 L23 5" stroke="#9AB4C4" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}
    <svg width={size * 0.8} height={size * 0.6} viewBox="0 0 40 30" style={abs(0, 0, { top: "100%", marginTop: -6, [cauda === "e" ? "left" : "right"]: size * 0.5 } as React.CSSProperties)}>
      <path d={cauda === "e" ? "M0 0 H34 L4 28 Z" : "M6 0 H40 L36 28 Z"} fill={fundo} />
    </svg>
  </div>
);

// ---------------------------------------------------------------- 1 · o gancho: o Pertim espiando por cima do portão
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
const Gancho: React.FC<{ t: number; quadro: number }> = ({ t, quadro }) => {
  if (!noar(t, 0)) return null;
  const G = EV.gancho, PG_ = L.pertim.gancho;
  const sai = entre(t, G.sai, T[1]);
  const espia = 18 * Math.sin(t * 2.2);                    // o Pertim sobe e desce um tiquinho, espiando
  const b = mola(t, G.balao, 0.4, 2.2), pulo = Math.sin(Math.PI * entre(t, G.cade, G.cade + 0.35));
  return (
    <div style={abs(0, 0, { width: 1080, height: 1920, opacity: 1 - sai })}>
      <Muro t={t} />
      <div style={abs(210 - 100, 760 - 100, { width: 200, height: 200, transform: `rotate(${-4 + 2 * Math.sin(t * 3)}deg)` })}><Relogio s={200} giro={t * 900} /></div>
      <PertimEm t={t} quadro={quadro} pose="parado" expr="surpreso" cx={PG_.cx} base={PG_.base + espia} altura={PG_.altura} />
      <Grade />
      {b > 0.01 && (
        <div style={abs(560, 600, { transform: `scale(${b * (1 + 0.12 * pulo)})`, transformOrigin: "10% 100%" })}><Balao texto="cadê meu pedido?" size={46} /></div>
      )}
      <Twinkles frame={quadro} seed="cmp-gancho" points={[[140, 480], [940, 470]]} size={30} />
    </div>
  );
};

// ---------------------------------------------------------------- 2 · os balões "e aí, já saiu?" e o puf
const BALOES = ["e aí, já saiu?", "e aí??", "já saiu?", "cadê meu pedido?"];
const Whatsapp: React.FC<{ t: number }> = ({ t }) => {
  if (!noar(t, 1)) return null;
  const Wp = EV.whatsapp;
  const puf = entre(t, Wp.puf, Wp.puf + 0.45);
  const out: React.ReactNode[] = [];
  if (puf < 0.35) {
    BALOES.forEach((txt, k) => {
      const e = mola(t, Wp.baloes[k], 0.35, 2.2);
      if (e <= 0.01) return;
      const shrink = 1 - clamp01(puf / 0.35);
      const y = 480 + k * 150 + 8 * Math.sin(t * 3 + k);
      out.push(<div key={k} style={abs(k % 2 ? 380 : 330, y, { transform: `scale(${e * shrink}) rotate(${(k % 2 ? 2 : -2)}deg)`, transformOrigin: k % 2 ? "90% 100%" : "10% 100%" })}>
        <Balao texto={txt} size={46} cauda={k % 2 ? "d" : "e"} fundo={k % 2 ? "#DCF3D2" : "#fff"} checks /></div>);
    });
  }
  if (puf > 0 && puf < 1) {
    // a nuvem do puf
    [0, 1, 2, 3, 4, 5, 6].forEach((i) => {
      const a = (i / 7) * Math.PI * 2, d = 60 + 220 * outCubic(puf);
      out.push(<div key={`n${i}`} style={abs(600 + Math.cos(a) * d - 70, 760 + Math.sin(a) * d * 0.8 - 70, { width: 140, height: 140, borderRadius: "50%", background: "#fff", opacity: 0.9 * (1 - puf), transform: `scale(${0.6 + 0.8 * puf})` })} />);
    });
    out.push(<div key="puf" style={abs(0, 690, { width: 1180, textAlign: "center", fontFamily: FONT, fontWeight: W.black, fontSize: 130, color: C.coral, letterSpacing: -3, opacity: Math.sin(Math.PI * puf), transform: `scale(${0.7 + 0.5 * outBack(puf, 2)})`, textShadow: `0 8px 0 ${C.amarelo}` })}>puf!</div>);
  }
  return <>{out}</>;
};

// ---------------------------------------------------------------- o Pertim no canto (cenas 2–6) e no fecho
type Estado = { pose: Pose; expr: Expressao };
const CANTO: Array<[number, Estado]> = [
  [T[1], { pose: "parado", expr: "sorrindo" }],
  [EV.whatsapp.puf, { pose: "parado", expr: "piscadinha" }],
  [T[2], { pose: "apontando", expr: "sorrindo" }],
  [T[3], { pose: "parado", expr: "sorrindo" }],
  [EV.pagamento.selo, { pose: "apontando", expr: "sorrindo" }],
  [T[4], { pose: "apontando", expr: "sorrindo" }],
  [EV.acompanha.status[3], { pose: "comemorando", expr: "alegre" }],
  [T[5], { pose: "parado", expr: "sorrindo" }],
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
const Fecho: React.FC<{ t: number; quadro: number }> = ({ t, quadro }) => {
  if (!noar(t, 6)) return null;
  const E = EV.fecho, F = L.fecho, P = L.pertim.fecho;
  const out: React.ReactNode[] = [];
  out.push(<div key="muro" style={abs(0, 0, { width: 1080, height: 1920, opacity: entre(t, T[6], T[6] + 0.25) })}><Muro t={t} /><Grade /></div>);
  // o Pertim chega pela direita com a sacola; em "Conta" põe a sacola no chão e acena
  const uc = inOut(entre(t, E.chega[0], E.chega[1]));
  const cx = P.cx + 700 * (1 - uc);
  const acena = t >= E.acena;
  if (acena) out.push(<div key="sac" style={abs(P.cx + 120, P.base - 120, { transform: `scale(${mola(t, E.acena, 0.3, 2)})`, transformOrigin: "50% 100%" })}><SacolaChao /></div>);
  out.push(<PertimEm key="pt" t={t} quadro={quadro} pose={acena ? "acenando" : "sacola"} expr={t >= E.pisca ? "piscadinha" : "sorrindo"} cx={cx} base={P.base - 10 * Math.abs(Math.sin(uc * Math.PI * 3)) * (uc < 1 ? 1 : 0)} altura={P.altura} desde={acena ? E.acena : E.chega[1]} />);
  // a logo (para e fica até o fim) e "Tudo pertim de você."
  const eLogo = interpolate(t, [E.logo.entra, E.logo.parada], [0, 1], clamp);
  const kLogo = eLogo >= 1 ? 1 : outBack(eLogo / 0.85, 1.9);
  if (eLogo > 0) {
    out.push(<Twinkles key="tw" frame={quadro} seed="cmp-fecho" points={[[310, 400], [890, 390], [300, 600], [900, 580]]} size={30} />);
    out.push(<div key="logo" style={abs(F.logo.cx - F.logo.d / 2, F.logo.cy - F.logo.d / 2, { width: F.logo.d, height: F.logo.d, transform: `scale(${kLogo})`, opacity: Math.min(1, eLogo * 4),
      filter: "drop-shadow(0 16px 26px rgba(198,58,23,0.32))" })}><Img src={staticFile("img/uaipertim_logo.png")} style={{ width: "100%", height: "100%" }} /></div>);
  }
  const fr = mola(t, E.frase, 0.32, 2);
  if (fr > 0) out.push(<div key="fr" style={abs(0, F.frase.cy - F.frase.size * 0.6, { width: 1200, textAlign: "center", fontFamily: FONT, fontWeight: W.black, fontSize: F.frase.size, lineHeight: 1.2,
    letterSpacing: -1.5, wordSpacing: 4, color: C.tinta, transform: `scale(${fr})`, opacity: Math.min(1, fr * 3), whiteSpace: "nowrap" })}>Tudo <span style={{ color: C.coral }}>pertim de você.</span></div>);
  const cm = mola(t, E.conta, 0.35, 2.2);
  const dedo = 8 * Math.abs(Math.sin(t * 6));
  if (cm > 0) out.push(
    <div key="cm" style={abs(F.conta.cx - 240, F.conta.cy - 60, { width: 480, display: "flex", justifyContent: "center", transform: `scale(${cm})` })}>
      <div style={abs(0, 0, { width: 480, display: "flex", justifyContent: "center" })}>
        <div style={{ position: "relative", padding: "20px 34px", borderRadius: 36, background: C.coral, boxShadow: `0 8px 0 ${C.coralDark}`, fontFamily: FONTE, fontWeight: W.black, fontSize: 50, color: "#fff",
          whiteSpace: "nowrap", letterSpacing: -0.5, wordSpacing: 4 }}>
          Conta aqui <span style={{ display: "inline-block", transform: `translateY(${dedo}px)` }}>👇</span>
          <svg width={40} height={30} viewBox="0 0 40 30" style={abs(30, 0, { top: "100%", marginTop: -4 })}><path d="M0 0 H34 L4 28 Z" fill={C.coral} /></svg>
        </div>
      </div>
    </div>,
  );
  if (t > E.pisca + 0.15 && t < E.pisca + 0.9) out.push(<div key="st" style={abs(430, 900, { opacity: interpolate(t, [E.pisca + 0.15, E.pisca + 0.35, E.pisca + 0.9], [0, 1, 0], clamp) })}><StarShape size={50} color={C.amarelo} /></div>);
  return <>{out}</>;
};
const SacolaChao: React.FC = () => (
  <svg width={110} height={130} viewBox="0 0 100 120" style={{ overflow: "visible" }}>
    <ellipse cx="50" cy="118" rx="44" ry="6" fill="#000" opacity="0.12" />
    <path d="M34 30 Q34 8 50 8 Q66 8 66 30" stroke={C.coralDark} strokeWidth="6" fill="none" />
    <path d="M14 30 H86 L80 112 Q79 118 72 118 H28 Q21 118 20 112 Z" fill={C.coral} />
    <circle cx="50" cy="76" r="17" fill="#fff" />
    <path d="M50 90 C50 90 40 79 40 73 A10 10 0 0 1 60 73 C60 79 50 90 50 90 Z" fill={C.coral} />
    <circle cx="50" cy="73" r="3.6" fill="#fff" />
  </svg>
);

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
  const a = entre(t, EV.pedido.celular[1] - 0.2, EV.pedido.celular[1] + 0.1) * (1 - entre(t, EV.fecho.sai[0], EV.fecho.sai[0] + 0.25));
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
export const CadeMeuPedido: React.FC<CadeMeuPedidoProps> = ({ mascara }) => {
  const quadro = useCurrentFrame();
  const t = quadro / FPS;
  if (mascara === "legenda") return <AbsoluteFill><LegendaPop t={t} branca /></AbsoluteFill>;
  const conteudo = (
    <>
      <Gancho t={t} quadro={quadro} />
      <Whatsapp t={t} />
      <Celular t={t} />
      <LupaQR t={t} />
      <SeloEntrega t={t} />
      <PainelStatus t={t} />
      <Notificacao t={t} />
      <Fecho t={t} quadro={quadro} />
      <PertimCanto t={t} quadro={quadro} />
      <Nota t={t} />
    </>
  );
  // na máscara do conteúdo, o cenário (o muro e o portão, de borda a borda) não entra: só os personagens e os elementos
  if (mascara === "conteudo") return <AbsoluteFill><SemCenario.Provider value>{conteudo}</SemCenario.Provider></AbsoluteFill>;
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

export const CMP = { duracao: CENA.quadros, fps: FPS };
