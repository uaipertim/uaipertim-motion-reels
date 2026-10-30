import React from "react";
import { AbsoluteFill, Img, interpolate, random, useCurrentFrame } from "remotion";
import { C, FONT, W } from "../config/theme";
import { CremeBackground, ColorSwipe } from "../components/Decor";
import { ConfettiBurst } from "../components/Particles";
import { Phone } from "../components/Phone";
import { Pertim, PertimRig } from "../personagem/Pertim";
import type { Expressao, Pose } from "../personagem/logica";
import { Legenda, LegendaDados } from "../personagem/Legenda";
import { bocaNoQuadro, piscadaEm, respiracao, trocaDePose, Visemas } from "../personagem/rig";
import {
  Adesivo, asset, Caixa, Carimbo, clamp01, Estouro, Etiqueta, inCubic, inOut, LinhasRadiais, LinhasVelocidade, mola, outBack, outCubic,
  Puf, Recorte, Sacola, Selo, Toque,
} from "./efeitos";
import LAYOUT from "../../reels/pedir-no-uaipertim/layout.json";
import CENA from "../../reels/pedir-no-uaipertim/dados/cena.json";
import VISEMAS from "../../reels/pedir-no-uaipertim/dados/visemas.json";
import LEGENDA from "../../reels/pedir-no-uaipertim/dados/legenda.json";
import PONTOS from "../../reels/pedir-no-uaipertim/fonte/pontos.json";
import PONTOS_PAG from "../../reels/pedir-no-uaipertim/fonte/pontos-pagamento.json";

// REEL "PEDIR NO UAIPERTIM É ASSIM" (1080×1920, 60 fps): o app por dentro, narrado pelo Pertim (que fala sempre olhando
// para a câmera, com a boca pelos visemas da voz). A voz e a mixagem vêm do pipeline do Explica, Sô!
// (episodios/pedir-no-uaipertim.json); os tempos, de reels/pedir-no-uaipertim/dados/ (scripts/preparar.py, amarrados às
// palavras); as posições, de reels/pedir-no-uaipertim/layout.json; os recortes saem do lugar certo da tela pelo
// fonte/pontos.json (px de CSS; as PNGs são 3×).
//   1 gancho: a motinha entra freando de lado e para olhando para a câmera; "BATEU A FOME?" estoura;
//   2 início: o celular entra girando (Main); as fotos das categorias saem voando como adesivos; toque em Lanches;
//   3 loja e produto: a capa do Burger do Glória dá zoom; a foto do Smash Duplo salta; o bacon marca com um pop;
//     o "Adicionar" voa para dentro da sacola;
//   4 sacola e checkout (pagamento híbrido): os 3 itens caem na sacola quicando, o total sobe até R$ 70,80; as três
//     opções saltam do Checkout-pix uma por vez (Pix → cartão → na entrega, com a nota e a maquininha); o Pix termina
//     marcado (toque com ripple) e vem o toque em "Fazer pedido" (confete);
//   5 acompanhar (Acompanhar-pix): as etapas marcam uma por vez ("plim": pagamento confirmado → loja aceitou e
//     preparou → saiu para entrega); o Pertim cruza a tela de moto; carimbo "CHEGA ATÉ 20h35";
//   6 Pão de Queijo Points: chuva de pão de queijo; o saldo sobe de 130 para 150 com o "+20"; o cupom desliza;
//   7 fecho: a logo (selo) + "Tá chegando no Glória" + chip "Segue @uaipertim"; o Pertim acena.
// As trocas de cena são todas diferentes: giro, zoom, chicote, faixa, empurra e íris (cena.json → trocas).

const L = LAYOUT as typeof LAYOUT;
const EV = CENA.eventos;
const FPS = CENA.fps;
const T = CENA.cenas.map((c) => c.t0);
const TR = CENA.tr;
// os pontos do pacote de telas + os do complemento de pagamento (Checkout-pix, Acompanhar-pix), que valem por cima
const PT = { ...PONTOS, ...PONTOS_PAG } as Record<string, { tela: string; x: number; y: number; w: number; h: number }>;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const tri = (t: number, a: number, b: number, c: number) => interpolate(t, [a, b, c], [0, 1, 0], clamp);
const entre = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

// ---------------------------------------------------------------- o celular e as telas
const CEL = L.celular;
const BEZEL = CEL.w * 0.042;
const TELA = { x: CEL.x + BEZEL, y: CEL.y + BEZEL, w: CEL.w - 2 * BEZEL, h: CEL.h - 2 * BEZEL };
const K = TELA.w / CEL.telaCss;                              // px da tela por px de CSS
type Passo = { t: number; tela: string; rola: number[][] };
const PASSOS = CENA.celular as Passo[];
const rolaEm = (p: Passo, t: number) => {
  const r = p.rola;
  if (t <= r[0][0]) return r[0][1];
  for (let i = 1; i < r.length; i++) if (t <= r[i][0]) return r[i - 1][1] + (r[i][1] - r[i - 1][1]) * inOut((t - r[i - 1][0]) / Math.max(1e-6, r[i][0] - r[i - 1][0]));
  return r[r.length - 1][1];
};
const passoEm = (t: number) => { let k = 0; PASSOS.forEach((p, i) => { if (t >= p.t) k = i; }); return k; };
// a caixa (no quadro) de um ponto de pontos.json, com a tela rolada em `rola`
const caixaDe = (nome: string, rola: number): Caixa => {
  const p = PT[nome];
  return { x: TELA.x + p.x * K, y: TELA.y + (p.y - rola) * K, w: p.w * K, h: p.h * K };
};
const centro = (c: Caixa): [number, number] => [c.x + c.w / 2, c.y + c.h / 2];

const TelaApp: React.FC<{ nome: string; rola: number; dx?: number }> = ({ nome, rola, dx = 0 }) => (
  <Img src={asset(`telas/${nome}.png`)} style={{ position: "absolute", left: dx, top: -rola * K, width: TELA.w, display: "block" }} />
);

const Celular: React.FC<{ t: number }> = ({ t }) => {
  const k = passoEm(t), p = PASSOS[k], ant = k > 0 ? PASSOS[k - 1] : null;
  const u = ant ? entre(t, p.t, p.t + 0.32) : 1;
  const e = inOut(u);
  return (
    <Phone width={CEL.w} height={CEL.h} style={{ position: "absolute", left: CEL.x, top: CEL.y }}>
      {ant && u < 1 && <TelaApp nome={ant.tela} rola={rolaEm(ant, t)} dx={-e * TELA.w * 0.35} />}
      <div style={{ position: "absolute", inset: 0, transform: `translateX(${(1 - e) * TELA.w}px)`, boxShadow: u < 1 ? "-12px 0 24px rgba(34,28,25,0.18)" : undefined }}>
        <TelaApp nome={p.tela} rola={rolaEm(p, t)} />
      </div>
    </Phone>
  );
};

// ---------------------------------------------------------------- o Pertim (narrador)
type Estado = { cx: number; base: number; altura: number };
const NAR = L.pertim.narrador as Estado;
const GAN = L.pertim.gancho as Estado;
const G = EV.gancho, INI = EV.inicio, PR = EV.produto, CK = EV.checkout, AC = EV.acompanhar, PO = EV.pontos, FE = EV.fecho;
const TRK = CENA.trocas;
// as poses do narrador (a troca de braços é curta; a expressão acompanha)
const POSES: Array<[number, Pose, Expressao]> = [
  [0, "moto", "sorrindo"], [G.fome, "moto", "surpreso"], [G.fome + 0.9, "moto", "sorrindo"],
  [TRK[0].t0 + TR * 0.5, "apontando", "sorrindo"], [CK.toque_pedido, "comemorando", "sorrindo"], [TRK[3].t1, "apontando", "sorrindo"],
  [T[5], "comemorando", "sorrindo"],
];
const poseEm = (t: number) => { let k = 0; POSES.forEach((p, i) => { if (t >= p[0]) k = i; }); return k; };
const cenaAtual = (t: number) => CENA.cenas.find((c) => t >= c.t0 - TR && t < c.t1 + 0.01) ?? CENA.cenas[CENA.cenas.length - 1];

const rigEm = (t: number, quadro: number, extra: Partial<PertimRig> = {}): { rig: PertimRig; boca: ReturnType<typeof bocaNoQuadro> } => {
  const c = cenaAtual(t);
  const falando = t >= c.voz_t0 - 0.02 && t <= c.voz_t1 + 0.04;
  return {
    boca: bocaNoQuadro(VISEMAS as Visemas, quadro, falando),
    rig: { ...respiracao(t), piscada: piscadaEm(CENA.piscadas, t, CENA.piscada_dur), olhar: [0, 0], centro: true, ...extra },
  };
};
const larguraDe = (pose: Pose, altura: number) => (pose === "moto" ? (altura * 300) / 254 : (altura * 280) / 284);

const PertimEm: React.FC<{ t: number; quadro: number; pose: Pose; expr: Expressao; e: Estado; extra?: Partial<PertimRig>; dx?: number; rot?: number; escala?: number; alpha?: number }> = ({
  t, quadro, pose, expr, e, extra, dx = 0, rot = 0, escala = 1, alpha = 1,
}) => {
  const { rig, boca } = rigEm(t, quadro, extra);
  const h = e.altura * escala, w = larguraDe(pose, h);
  return (
    <div style={{ position: "absolute", left: e.cx + dx - w / 2, top: e.base - h, width: w, height: h, opacity: alpha, transform: `rotate(${rot}deg)`, transformOrigin: "50% 92%" }}>
      <Pertim v={1} pose={pose} expr={expr} mouth={boca ?? "auto"} altura={h} rig={rig} />
    </div>
  );
};

const Narrador: React.FC<{ t: number; quadro: number }> = ({ t, quadro }) => {
  const k = poseEm(t);
  const [tp, pose, expr] = POSES[k];
  const poseAnt = k > 0 ? POSES[k - 1][1] : pose;
  const braco = poseAnt !== pose && poseAnt !== "moto" ? trocaDePose(poseAnt, t, tp, 0.18) : undefined;
  const pulo = poseAnt !== pose ? 1 + 0.06 * Math.sin(Math.PI * entre(t, tp, tp + 0.25)) : 1;
  const aceno = pose === "apontando" ? -18 + 4 * Math.sin(t * 3) : 0;
  // 1) o gancho: a motinha entra pela esquerda freando de lado e para no meio
  if (t < TRK[0].t0) {
    const dx = -700 * (1 - outCubic(t / G.para));
    let rot = -3 + Math.sin(t * 22) * 0.8;
    if (t >= G.freia) rot = interpolate(t, [G.freia, G.para, G.para + 0.25, G.para + 0.5], [-3, 11, -3, 0], clamp);
    const quique = t > G.para ? -10 * Math.sin((t - G.para) * 14) * Math.exp(-(t - G.para) * 5) : 0;
    return <PertimEm t={t} quadro={quadro} pose="moto" expr={expr} e={GAN} dx={dx} rot={rot} extra={{ quique }} />;
  }
  // 2) a troca "giro": desce da moto encolhendo para o canto (o desenho troca no meio, com um pop)
  if (t < TRK[0].t1) {
    const u = entre(t, TRK[0].t0, TRK[0].t1), e = inOut(u);
    const est: Estado = { cx: GAN.cx + (NAR.cx - GAN.cx) * e, base: GAN.base + (NAR.base - GAN.base) * e, altura: GAN.altura + (NAR.altura - GAN.altura) * e };
    return u < 0.5
      ? <PertimEm t={t} quadro={quadro} pose="moto" expr="sorrindo" e={est} escala={1 - 0.2 * (u / 0.5)} alpha={1 - clamp01((u - 0.35) / 0.15)} />
      : <PertimEm t={t} quadro={quadro} pose="apontando" expr="sorrindo" e={est} escala={0.8 + 0.2 * outBack((u - 0.5) / 0.5)} extra={{ aceno }} />;
  }
  // 5) cruza a tela de moto: o narrador some do canto e passa voando (falando, olhando para a câmera)
  const [m0, m1] = AC.moto;
  if (t >= m0 - 0.12 && t < m1 + 0.18) {
    if (t < m0) return <PertimEm t={t} quadro={quadro} pose={pose} expr={expr} e={NAR} escala={1 - (t - (m0 - 0.12)) / 0.12} extra={{ aceno }} />;
    if (t >= m1) return <PertimEm t={t} quadro={quadro} pose={pose} expr={expr} e={NAR} escala={outBack((t - m1) / 0.18)} extra={{ aceno }} />;
    const cr = L.pertim.cruza;
    const x = -520 + (1080 + 1040) * inOut(entre(t, m0, m1));
    return <PertimEm t={t} quadro={quadro} pose="moto" expr="sorrindo" e={{ cx: x, base: cr.base, altura: cr.altura }} rot={-4} extra={{ quique: Math.sin(t * 40) * 1.5 }} />;
  }
  // 7) sai de cena na íris (o do fecho é outro, dentro dela)
  if (t >= TRK[5].t0) {
    const u = entre(t, TRK[5].t0, TRK[5].t0 + 0.22);
    return u >= 1 ? null : <PertimEm t={t} quadro={quadro} pose={pose} expr={expr} e={NAR} escala={1 - u} alpha={1 - u} />;
  }
  return <PertimEm t={t} quadro={quadro} pose={pose} expr={expr} e={NAR} escala={pulo} extra={{ aceno, braco }} />;
};

// ---------------------------------------------------------------- as cenas (o que sai do celular)
const CATS = ["lanches", "pizzas", "acai", "padaria", "mercado", "farmacia"];
const ADESIVOS: Array<[number, number, number, number]> = [[215, 430, 210, -8], [400, 330, 170, 7], [175, 690, 165, -12], [640, 360, 150, 9], [860, 470, 140, -6], [345, 560, 130, 12]];

const CenaInicio: React.FC<{ t: number }> = ({ t }) => {
  if (t < TRK[0].t0 + 0.4 || t > TRK[1].t1 - 0.4) return null;
  const toque = centro(caixaDe("categoria-lanches", 0));
  return (
    <>
      {CATS.map((c, i) => {
        const t0 = INI.adesivos + 0.07 * i;
        const u = (t - t0) / 0.5;
        if (u < 0) return null;
        const p = PT["categoria-lanches"];
        const ox = TELA.x + Math.min(390, p.x + (i - 0) * 76 + p.w / 2) * K, oy = TELA.y + (p.y + 30) * K;
        const [x, y, d, r] = ADESIVOS[i];
        const e = outBack(u, 1.4);
        const px = ox + (x - ox) * e, py = oy + (y - oy) * e - Math.sin(Math.PI * clamp01(u)) * 120;
        const dd = 60 + (d - 60) * e;
        const bob = Math.sin(t * 2.2 + i) * 6;
        const brilho = c === "lanches" ? tri(t, INI.toque, INI.toque + 0.15, INI.toque + 0.6) : 0;
        return <Adesivo key={c} src={asset(`fotos/cat-${c}.jpg`)} d={dd * (1 + 0.15 * brilho)} rot={r * clamp01(u) + Math.sin(t * 1.7 + i) * 3}
          style={{ left: px - dd / 2, top: py - dd / 2 + bob, boxShadow: brilho ? `0 0 0 ${10 * brilho}px ${C.amarelo}, 0 14px 26px rgba(34,28,25,0.28)` : undefined }} />;
      })}
      <Recorte src="categoria-lanches" de={caixaDe("categoria-lanches", 0)} para={{ ...caixaDe("categoria-lanches", 0), x: toque[0] - 64 * K * 0.8, y: toque[1] - 77 * K * 0.8, w: 64 * K * 1.6, h: 77 * K * 1.6 }}
        p={entre(t, INI.toque + 0.08, INI.toque + 0.4) * (1 - entre(t, INI.quer + 0.3, INI.quer + 0.6))} />
      <Toque t={t} t0={INI.toque} x={toque[0]} y={toque[1]} />
    </>
  );
};

const CenaProduto: React.FC<{ t: number }> = ({ t }) => {
  if (t < TRK[1].t0 + TR * 0.5 || t > TRK[2].t0 + TR * 0.5) return null;
  // a capa do Burger do Glória sai do topo da Loja e dá zoom
  const capaP = entre(t, PR.loja, PR.loja + 0.45) * (1 - entre(t, PR.produto - 0.25, PR.produto));
  const capaDe: Caixa = { x: TELA.x, y: TELA.y, w: TELA.w, h: 115 * K };
  const capaPara: Caixa = { x: 120, y: 330, w: 760, h: 420 };
  const ec = outBack(capaP, 1.5);
  const capa = { x: capaDe.x + (capaPara.x - capaDe.x) * ec, y: capaDe.y + (capaPara.y - capaDe.y) * ec, w: capaDe.w + (capaPara.w - capaDe.w) * ec, h: capaDe.h + (capaPara.h - capaDe.h) * ec };
  // a foto do Smash Duplo salta grande; no "claro" entra na sacola junto com o botão
  const fotoU = entre(t, PR.foto, PR.foto + 0.45), fotoSai = entre(t, PR.adicionar + 0.1, PR.adicionar + 0.6);
  const fo: [number, number] = [TELA.x + 195 * K, TELA.y + 120 * K];
  const fd: [number, number] = [650, 520];
  const sac: [number, number] = [L.sacola.cx, L.sacola.cy - 60];
  const fe = outBack(fotoU, 1.5), fs = inCubic(fotoSai);
  const fx = fo[0] + (fd[0] - fo[0]) * fe + (sac[0] - fd[0]) * fs, fy = fo[1] + (fd[1] - fo[1]) * fe + (sac[1] - fd[1]) * fs - Math.sin(Math.PI * fotoSai) * 200;
  const fdiam = (120 + 260 * fe) * (1 - 0.75 * fs);
  // o bacon marca com um pop
  const bacon = caixaDe("opcao-bacon", 0);
  const bp = entre(t, PR.bacon - 0.05, PR.bacon + 0.35) * (1 - entre(t, PR.adicionar + 0.3, PR.adicionar + 0.6));
  const check = mola(t, PR.bacon + 0.12, 0.3, 3);
  // o "Adicionar" voa para dentro da sacola
  const ad = caixaDe("botao-adicionar", 278);
  const au = entre(t, PR.adicionar, PR.adicionar + 0.55);
  const ae = inOut(au);
  const ax = ad.x + ad.w / 2 + (sac[0] - ad.x - ad.w / 2) * ae, ay = ad.y + ad.h / 2 + (sac[1] - ad.y - ad.h / 2) * ae - Math.sin(Math.PI * au) * 380;
  const aw = ad.w * (1 + 0.3 * Math.sin(Math.PI * au)) * (1 - 0.8 * ae);
  return (
    <>
      {capaP > 0 && (
        <div style={{ position: "absolute", left: capa.x, top: capa.y, width: capa.w, height: capa.h, borderRadius: 34 * ec, overflow: "hidden", border: `${10 * ec}px solid ${C.branco}`,
          boxShadow: `0 20px 40px rgba(34,28,25,${0.3 * ec})`, transform: `rotate(${-3 * ec}deg)` }}>
          <Img src={asset("fotos/loja-burger-do-gloria.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1 + 0.25 * entre(t, PR.loja, PR.produto)})` }} />
        </div>
      )}
      {fotoU > 0 && fs < 1 && (
        <>
          <LinhasVelocidade t={t} forca={tri(t, PR.foto, PR.foto + 0.12, PR.foto + 0.6)} ang={-35} caixa={[fx - 300, fy - 300, fx + 300, fy + 300]} n={10} seed="foto" />
          <Adesivo src={asset("fotos/produto-smash-duplo.jpg")} d={fdiam} rot={-8 * fe + 30 * fs} style={{ left: fx - fdiam / 2, top: fy - fdiam / 2 }} />
        </>
      )}
      <Recorte src="opcao-bacon" de={bacon} para={{ x: 385, y: 690, w: 555, h: (555 * 174) / 1050 }} p={bp} rot={-3}>
        {check > 0 && (
          <svg viewBox="0 0 1050 174" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
            <circle cx={975} cy={88} r={70 * check} fill="none" stroke={C.amarelo} strokeWidth={10 * (1 - entre(t, PR.bacon + 0.15, PR.bacon + 0.6))} opacity={1 - entre(t, PR.bacon + 0.3, PR.bacon + 0.7)} />
            <g transform={`translate(975 88) scale(${0.6 + 0.6 * check}) translate(-975 -88)`}>
              <rect x={942} y={55} width={66} height={66} rx={8} fill={C.coral} />
              <path d="M955 88 L970 103 L996 72" stroke={C.branco} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </g>
          </svg>
        )}
      </Recorte>
      {au > 0 && au < 1 && (
        <div style={{ position: "absolute", left: ax - aw / 2, top: ay - (aw * 156) / 666 / 2, width: aw, transform: `rotate(${-200 * ae}deg)`, filter: "drop-shadow(0 12px 14px rgba(34,28,25,0.3))" }}>
          <Img src={asset("recortes/botao-adicionar.png")} style={{ width: "100%", display: "block" }} />
        </div>
      )}
      {au > 0 && au < 1 && <LinhasVelocidade t={t} forca={0.8} ang={-70} caixa={[ax - 200, ay - 200, ax + 200, ay + 200]} n={8} seed="ad" />}
    </>
  );
};

const ITENS = ["produto-smash-duplo", "produto-classico-gloria", "produto-refrigerante-lata"];
const brl = (v: number) => "R$ " + v.toFixed(2).replace(".", ",");

// a sacola e o que cai nela (fora do celular: fica parada no chicote)
const SacolaCena: React.FC<{ t: number; quadro: number }> = ({ t, quadro }) => {
  const t0 = PR.sacola, t1 = TRK[3].t0 + TR * 0.45;
  if (t < t0 || t > t1) return null;
  const S = L.sacola;
  const quedas = [PR.adicionar + 0.55, ...CK.itens.map((x) => x + 0.32)];
  const q = Math.max(0, ...quedas.map((x) => (t >= x ? Math.exp(-(t - x) * 9) * Math.sin((t - x) * 30 + 1.5) : 0)));
  const ent = mola(t, t0, 0.35, 2.2);
  const [c0, c1] = CK.contador;
  const total = 70.8 * outCubic(entre(t, c0, c1));
  const pulso = tri(t, c1, c1 + 0.12, c1 + 0.35);
  return (
    <>
      {ITENS.map((it, i) => {
        const tq = CK.itens[i], u = entre(t, tq, tq + 0.32);
        if (t < tq || t > tq + 0.55) return null;
        const y = -150 + (S.cy - 70 + 150) * (u * u);
        const some = entre(t, tq + 0.32, tq + 0.5);
        return <Adesivo key={it} src={asset(`fotos/${it}.jpg`)} d={150 * (1 - 0.6 * some)} rot={(i - 1) * 25 + u * 40} style={{ left: S.cx - 75 + (i - 1) * 30, top: y - 75, opacity: 1 - some }} />;
      })}
      <Sacola cx={S.cx} cy={S.cy} w={S.w * ent} quique={q} />
      <Etiqueta cx={S.cx} cy={S.cy - S.w * 0.85} titulo="TOTAL" valor={brl(total)} e={mola(t, c0 - 0.15, 0.3) * (1 - entre(t, t1 - 0.3, t1))} pulso={pulso} />
      {t > c1 && t < c1 + 1.0 && <ConfettiBurst frame={quadro / 2} start={(c1 * FPS) / 2} x={S.cx} y={S.cy - S.w * 0.85} count={18} power={22} seed="total" />}
    </>
  );
};

const Nota: React.FC<{ e: number; cx: number; cy: number; tipo: "dinheiro" | "maquininha" }> = ({ e, cx, cy, tipo }) =>
  e <= 0 ? null : (
    <div style={{ position: "absolute", left: cx - 90, top: cy - 70, transform: `scale(${e}) rotate(${tipo === "dinheiro" ? -10 : 8}deg)` }}>
      <svg width={180} height={140} viewBox="0 0 90 70" style={{ overflow: "visible", filter: "drop-shadow(0 8px 10px rgba(34,28,25,0.25))" }}>
        {tipo === "dinheiro" ? (
          <g>
            <rect x={4} y={14} width={82} height={44} rx={6} fill="#7FC66E" stroke={C.tinta} strokeWidth={3} />
            <rect x={10} y={20} width={70} height={32} rx={4} fill="none" stroke={C.verdeDark} strokeWidth={2} />
            <circle cx={45} cy={36} r={11} fill={C.verdeLight} stroke={C.verdeDark} strokeWidth={2} />
            <text x={45} y={41} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={13} fill={C.verdeDark}>R$</text>
          </g>
        ) : (
          <g>
            <rect x={22} y={4} width={46} height={64} rx={8} fill="#5A4E48" stroke={C.tinta} strokeWidth={3} />
            <rect x={28} y={10} width={34} height={18} rx={3} fill="#BFE3C6" />
            {[0, 1, 2].map((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={29 + c * 11} y={33 + r * 10} width={8} height={7} rx={2} fill={C.papel} />))}
            <rect x={30} y={0} width={30} height={7} rx={2} fill={C.coral} stroke={C.tinta} strokeWidth={2} />
          </g>
        )}
      </svg>
    </div>
  );

// o pagamento híbrido: as três opções saltam do Checkout-pix uma por vez, na palavra de cada uma (Pix → cartão → na
// entrega, com a nota e a maquininha); em "preferir" o toque marca o Pix, as outras duas voltam para o celular e vem o
// "Fazer pedido" com confete. O recorte "Pagar na entrega" (do pacote anterior) vem marcado: aqui ele aparece como está
// no Checkout-pix, desmarcado (contorno claro e rádio vazio por cima)
const PG = L.pagamento;
const OPCOES: Array<{ nome: string; t: number; para: { x: number; y: number; w: number }; altura: number; rot: number }> = [
  { nome: "opcao-pix", t: CK.pix, para: PG.pix, altura: 426, rot: -2 },
  { nome: "opcao-cartao", t: CK.cartao, para: PG.cartao, altura: 225, rot: 1.5 },
  { nome: "opcao-pagar-na-entrega", t: CK.entrega, para: PG.entrega, altura: 228, rot: -1 },
];
const CenaCheckout: React.FC<{ t: number; quadro: number }> = ({ t, quadro }) => {
  if (t < TRK[2].t0 + TR * 0.5 || t > TRK[3].t0 + TR * 0.5) return null;
  const volta = entre(t, CK.marca_pix + 0.1, CK.marca_pix + 0.45);
  const marca = mola(t, CK.marca_pix + 0.05, 0.3, 3);
  const anel = entre(t, CK.marca_pix, CK.marca_pix + 0.6);
  const pix = OPCOES[0];
  const pixRadio: [number, number] = [pix.para.x + (968 * pix.para.w) / 1050, pix.para.y + (114 * pix.para.w) / 1050];
  const fp = centro(caixaDe("botao-fazer-pedido", 578));
  const pulsoBotao = tri(t, CK.toque_pedido, CK.toque_pedido + 0.08, CK.toque_pedido + 0.3);
  return (
    <>
      {OPCOES.map((o, i) => {
        const p = entre(t, o.t - 0.05, o.t + 0.4);
        const sai = i === 0 ? 0 : volta;
        return (
          <Recorte key={o.nome} src={o.nome} de={caixaDe(o.nome, 300)} para={{ ...o.para, h: (o.para.w * o.altura) / 1050 }} p={p * (1 - 0.7 * sai)} rot={o.rot} opacidade={1 - sai}>
            {o.nome === "opcao-pagar-na-entrega" && (
              <svg viewBox="0 0 1050 228" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
                <rect x={3} y={3} width={1044} height={222} rx={42} fill="none" stroke="#ECE7E1" strokeWidth={7} />
                <circle cx={971} cy={114} r={40} fill={C.branco} />
                <circle cx={971} cy={114} r={30} fill="none" stroke="#7B7B7B" strokeWidth={5} />
              </svg>
            )}
            {i === 0 && marca > 0 && (
              <svg viewBox="0 0 1050 426" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
                <circle cx={968} cy={114} r={44 + 90 * anel} fill="none" stroke={C.amarelo} strokeWidth={12 * (1 - anel)} opacity={1 - anel} />
                <g transform={`translate(890 40) scale(${0.5 + 0.5 * marca})`}>
                  <circle r={34} fill={C.verde} stroke={C.branco} strokeWidth={6} />
                  <path d="M-14 1 L-4 11 L15 -10" stroke={C.branco} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </g>
              </svg>
            )}
          </Recorte>
        );
      })}
      <Nota e={mola(t, CK.dinheiro, 0.35, 2.2) * (1 - volta)} cx={PG.notas[0][0]} cy={PG.notas[0][1]} tipo="dinheiro" />
      <Nota e={mola(t, CK.maquininha, 0.35, 2.2) * (1 - volta)} cx={PG.notas[1][0]} cy={PG.notas[1][1]} tipo="maquininha" />
      <Toque t={t} t0={CK.marca_pix} x={pixRadio[0]} y={pixRadio[1]} />
      <Toque t={t} t0={CK.toque_pedido} x={fp[0]} y={fp[1]} />
      {pulsoBotao > 0 && (
        <div style={{ position: "absolute", left: fp[0] - 179 * K * (1 + 0.1 * pulsoBotao), top: fp[1] - 28 * K * (1 + 0.1 * pulsoBotao), width: 358 * K * (1 + 0.1 * pulsoBotao) }}>
          <Img src={asset("recortes/botao-fazer-pedido.png")} style={{ width: "100%", display: "block" }} />
        </div>
      )}
      {t > CK.toque_pedido && <ConfettiBurst frame={quadro / 2} start={(CK.toque_pedido * FPS) / 2} x={fp[0]} y={fp[1]} count={60} power={60} spread={110} seed="pedido" />}
    </>
  );
};

const ETAPAS_Y = [96, 258, 421];
const CenaAcompanhar: React.FC<{ t: number }> = ({ t }) => {
  if (t < TRK[3].t0 + TR * 0.5 || t > TRK[4].t0 + TR * 0.5) return null;
  const de = caixaDe("acompanhar-etapas-pix", 0);
  const para: Caixa = { x: 140, y: 330, w: 680, h: (680 * 687) / 1050 };
  const p = entre(t, AC.etapas, AC.etapas + 0.45);
  const balao = mola(t, AC.balao, 0.35, 2.4) * (1 - entre(t, AC.puf - 0.05, AC.puf));
  return (
    <>
      <Recorte src="acompanhar-etapas-pix" de={de} para={para} p={p} rot={-2}>
        <svg viewBox="0 0 1050 687" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
          {AC.marcas.map((tm, i) => {
            const m = mola(t, tm, 0.35, 3);
            if (m <= 0) return null;
            const anel = entre(t, tm, tm + 0.6);
            const pulsa = i === 1 ? tri(t, AC.prepara, AC.prepara + 0.12, AC.prepara + 0.4) : 0;
            return (
              <g key={i}>
                <rect x={20} y={ETAPAS_Y[i] - 62} width={1010} height={124} rx={30} fill={C.amarelo} opacity={0.28 * Math.min(1, m)} />
                <circle cx={93} cy={ETAPAS_Y[i]} r={44 + 80 * anel} fill="none" stroke={C.amarelo} strokeWidth={12 * (1 - anel)} opacity={1 - anel} />
                <g transform={`translate(93 ${ETAPAS_Y[i]}) scale(${0.4 + 0.75 * m + 0.2 * pulsa})`}>
                  <circle r={44} fill={i === 2 ? C.coral : C.verde} stroke={C.branco} strokeWidth={6} />
                  <path d="M-18 1 L-5 14 L19 -12" stroke={C.branco} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </g>
              </g>
            );
          })}
        </svg>
      </Recorte>
      <Carimbo t={t} t0={AC.carimbo} cx={590} cy={900} texto={["CHEGA ATÉ", "20h35"]} />
      {balao > 0 && (
        <div style={{ position: "absolute", left: 690, top: 1050, transform: `scale(${balao}) rotate(4deg)`, transformOrigin: "0% 100%" }}>
          <div style={{ background: C.branco, border: `5px solid ${C.tinta}`, borderRadius: 40, padding: "22px 34px", display: "flex", gap: 14, alignItems: "center", boxShadow: "0 10px 18px rgba(34,28,25,0.2)" }}>
            {[0, 1, 2].map((i) => <div key={i} style={{ width: 24, height: 24, borderRadius: "50%", background: "#9C8F86", transform: `translateY(${-8 * Math.max(0, Math.sin(t * 9 - i * 0.9))}px)` }} />)}
            <svg width={44} height={44} viewBox="0 0 24 24"><circle cx={12} cy={12} r={10} fill="none" stroke="#9C8F86" strokeWidth={2.5} /><path d={`M12 12 L12 ${12 - 6} M12 12 L${12 + 5 * Math.cos(t * 4)} ${12 + 5 * Math.sin(t * 4)}`} stroke="#9C8F86" strokeWidth={2.5} strokeLinecap="round" /></svg>
          </div>
          <div style={{ position: "absolute", left: 18, bottom: -22, width: 0, height: 0, borderLeft: "16px solid transparent", borderRight: "16px solid transparent", borderTop: `26px solid ${C.tinta}` }} />
        </div>
      )}
      <Puf t={t} t0={AC.puf} x={830} y={1100} seed="puf" cor="#D9CDBF" />
    </>
  );
};

// a chuva de pão de queijo (fora do celular)
const Chuva: React.FC<{ t: number }> = ({ t }) => {
  const t0 = PO.chuva;
  if (t < t0 || t > t0 + 3.2) return null;
  return (
    <>
      {Array.from({ length: 26 }).map((_, i) => {
        const r = (k: string) => random(`pdq-${i}-${k}`);
        const ti = t0 + r("t") * 1.2, u = t - ti;
        if (u < 0) return null;
        const d = 80 + r("d") * 90, x = 60 + r("x") * 960, y = -180 + 1300 * u * u * 0.75 + 380 * u;
        if (y > 1500) return null;
        return <Adesivo key={i} src={asset("fotos/cat-padaria.jpg")} d={d} borda={0} rot={r("r") * 360 + u * (r("s") - 0.5) * 400} style={{ left: x - d / 2, top: y - d / 2, boxShadow: "0 8px 14px rgba(34,28,25,0.2)" }} />;
      })}
    </>
  );
};

const CenaPontos: React.FC<{ t: number }> = ({ t }) => {
  if (t < TRK[4].t0 + TR * 0.5 || t > TRK[5].t1) return null;
  const de = caixaDe("pdq-saldo", 0);
  const para: Caixa = { x: 150, y: 330, w: 680, h: (680 * 585) / 1050 };
  const p = entre(t, PO.saldo, PO.saldo + 0.45);
  const [c0, c1] = PO.contador;
  const n = Math.round(130 + 20 * outCubic(entre(t, c0, c1)));
  const mais = mola(t, c0, 0.35, 2.6);
  const cu = entre(t, PO.cupom, PO.cupom + 0.45);
  const cx = -800 + (150 + 800) * outBack(cu, 1.2);
  return (
    <>
      <Recorte src="pdq-saldo" de={de} para={para} p={p} rot={-2}>
        <svg viewBox="0 0 1050 585" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <rect x={52} y={118} width={232} height={140} fill="#F5E3BE" />
          <text x={58} y={245} fontFamily={FONT} fontWeight={800} fontSize={150} letterSpacing={-6} fill={C.tinta} style={{ fontVariantNumeric: "tabular-nums" }}>{n}</text>
        </svg>
      </Recorte>
      {mais > 0 && (
        <div style={{ position: "absolute", left: 470, top: 300 - 40 * clamp01((t - c0) / 0.4), transform: `scale(${mais}) rotate(-8deg)`, background: C.verde, color: C.branco,
          border: `5px solid ${C.tinta}`, borderRadius: 24, padding: "4px 26px", fontFamily: FONT, fontWeight: W.black, fontSize: 78, boxShadow: `0 7px 0 ${C.tinta}` }}>+20</div>
      )}
      {cu > 0 && (
        <>
          <LinhasVelocidade t={t} forca={1 - cu} ang={0} caixa={[0, 720, 1080, 860]} n={10} seed="cupom" />
          <div style={{ position: "absolute", left: cx, top: 730, width: 680, transform: `rotate(${3 * (1 - cu)}deg)`, filter: "drop-shadow(0 14px 18px rgba(34,28,25,0.28))" }}>
            <Img src={asset("recortes/pdq-cupom.png")} style={{ width: "100%", display: "block" }} />
          </div>
        </>
      )}
    </>
  );
};

// ---------------------------------------------------------------- as trocas de cena
// o palco (celular + recortes) se mexe nas trocas: zoom para dentro do toque, chicote para o lado, empurra para cima
const palcoEm = (t: number): { s: number; ox: number; oy: number; tx: number; ty: number; blur: number } => {
  const base = { s: 1, ox: 540, oy: 960, tx: 0, ty: 0, blur: 0 };
  const z = TRK[1], ch = TRK[2], em = TRK[4];
  const meio = (k: typeof z) => (k.t0 + k.t1) / 2;
  if (t >= z.t0 && t < z.t1) {
    const [x, y] = centro(caixaDe("categoria-lanches", 0));
    return t < meio(z) ? { ...base, s: 1 + 5 * inCubic(entre(t, z.t0, meio(z))), ox: x, oy: y } : { ...base, s: 1.35 - 0.35 * outCubic(entre(t, meio(z), z.t1)), ox: CEL.x + CEL.w / 2, oy: CEL.y + CEL.h / 2 };
  }
  if (t >= ch.t0 && t < ch.t1) {
    const u1 = entre(t, ch.t0, meio(ch)), u2 = entre(t, meio(ch), ch.t1);
    return t < meio(ch) ? { ...base, tx: -1500 * inCubic(u1), blur: 16 * u1 } : { ...base, tx: 1500 * (1 - outCubic(u2)), blur: 16 * (1 - u2) };
  }
  if (t >= em.t0 && t < em.t1) {
    const u1 = entre(t, em.t0, meio(em)), u2 = entre(t, meio(em), em.t1);
    return t < meio(em) ? { ...base, ty: -2000 * inCubic(u1) } : { ...base, ty: 2000 * (1 - outCubic(u2)) };
  }
  return base;
};

// ---------------------------------------------------------------- o gancho e o fecho
const Chao: React.FC<{ t: number }> = ({ t }) => {
  const a = 1 - entre(t, TRK[0].t0, TRK[0].t0 + 0.4);
  if (a <= 0) return null;
  const para = G.para;
  return (
    <div style={{ position: "absolute", left: 0, top: L.chao - 4, width: 1080, height: 46, background: C.cremeDeep, opacity: a }}>
      <svg width={1080} height={46} style={{ position: "absolute", left: 0, top: 0 }}>
        <line x1={0} y1={23} x2={1080} y2={23} stroke={C.coral} strokeWidth={7} strokeDasharray="34 26" strokeDashoffset={-Math.min(t, para) * 900} />
      </svg>
    </div>
  );
};

// as marcas de pneu da freada de lado
const Derrapagem: React.FC<{ t: number }> = ({ t }) => {
  const a = clamp01((t - G.freia) / 0.1) * (1 - entre(t, 2.6, 3.4));
  if (a <= 0) return null;
  const x1 = GAN.cx - 700 * (1 - outCubic(Math.min(t, G.para) / G.para)) - 240;
  const x0 = GAN.cx - 700 * (1 - outCubic(G.freia / G.para)) - 240;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: a }}>
      {[0, 22].map((o) => <path key={o} d={`M${x0 - 60} ${L.chao - 6 + o * 0.3} Q${(x0 + x1) / 2} ${L.chao - 22 + o * 0.3} ${x1} ${L.chao - 10 + o * 0.3}`} stroke={C.tinta} strokeOpacity={0.35} strokeWidth={10} fill="none" strokeLinecap="round" />)}
    </svg>
  );
};

const Fecho: React.FC<{ t: number; quadro: number }> = ({ t, quadro }) => {
  const ir = TRK[5];
  if (t < ir.t0) return null;
  const F = L.fecho;
  const raio = 1500 * inOut(entre(t, ir.t0, ir.t1));
  const lg = FE.logo;
  const eLogo = entre(t, lg.entra, lg.parada);
  const kLogo = eLogo >= 1 ? 1 : outBack(eLogo / 0.8, 1.8);
  const eTxt = mola(t, FE.texto, 0.4, 2);
  const eChip = mola(t, FE.chip, 0.4, 2.2);
  const P = L.pertim.fecho as Estado;
  const expr: Expressao = t >= FE.piscadinha ? "piscadinha" : "sorrindo";
  return (
    <AbsoluteFill style={{ clipPath: raio < 1500 ? `circle(${raio}px at ${F.logo.cx}px ${F.logo.cy}px)` : undefined }}>
      <CremeBackground frame={quadro / 2} rays raysCenter={[540, 560]} raysOpacity={0.16} enfeites={false} />
      {eLogo > 0 && (
        // a logo redonda com fundo transparente: sem cartão nem moldura; a sombra (drop-shadow) segue o alfa, então é redonda
        <div style={{ position: "absolute", left: F.logo.cx - F.logo.d / 2, top: F.logo.cy - F.logo.d / 2, width: F.logo.d, height: F.logo.d, transform: `scale(${kLogo})`, opacity: Math.min(1, eLogo * 4), filter: "drop-shadow(0 10px 18px rgba(198,58,23,0.28))" }}>
          <Img src={asset("logo/logo-selo-transparente.png")} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
        </div>
      )}
      {eTxt > 0 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: F.texto.cy - F.texto.size * 0.6, textAlign: "center", fontFamily: FONT, fontWeight: W.black, fontSize: F.texto.size, letterSpacing: -1.5,
          color: C.tinta, transform: `scale(${eTxt})`, whiteSpace: "nowrap" }}>
          Tá chegando <span style={{ color: C.coral }}>no Glória</span>
        </div>
      )}
      {eChip > 0 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: F.chip.cy - F.chip.h / 2, height: F.chip.h, display: "flex", justifyContent: "center", transform: `scale(${eChip})`, transformOrigin: `540px ${F.chip.h / 2}px` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, height: F.chip.h, padding: "0 36px", borderRadius: F.chip.h / 2, background: C.coral, boxShadow: `0 7px 0 ${C.coralDark}`, fontFamily: FONT, fontWeight: W.extraBold, fontSize: F.chip.size, color: "#fff", whiteSpace: "nowrap" }}>
            <svg width={34} height={34} viewBox="0 0 24 24"><path d="M5 12 H18 M13 6 L19 12 L13 18" stroke="#fff" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
            Segue @uaipertim
          </div>
        </div>
      )}
      <PertimEm t={t} quadro={quadro} pose="acenando" expr={expr} e={P} escala={outBack(entre(t, ir.t0 + 0.2, ir.t1 + 0.1), 1.6)} extra={{ aceno: 12 * Math.sin(t * 9) }} />
      {raio < 1500 && raio > 0 && (
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <circle cx={F.logo.cx} cy={F.logo.cy} r={raio - 9} fill="none" stroke={C.coral} strokeWidth={18} />
          <circle cx={F.logo.cx} cy={F.logo.cy} r={raio - 24} fill="none" stroke={C.amarelo} strokeWidth={10} />
        </svg>
      )}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- o vídeo
export const PedirNoUaiPertim: React.FC = () => {
  const quadro = useCurrentFrame();
  const t = quadro / FPS;
  const pal = palcoEm(t);
  const fx = TRK[3];                                       // a troca "faixa": a faixa coral cobre a tela no meio
  const flashZoom = tri(t, TRK[1].t0 + 0.3, (TRK[1].t0 + TRK[1].t1) / 2, TRK[1].t1 - 0.25);
  const giro = entre(t, TRK[0].t0, TRK[0].t1);
  return (
    <AbsoluteFill style={{ background: C.creme }}>
      <CremeBackground frame={quadro / 2} rays raysCenter={[540, 820]} raysOpacity={0.13} enfeites={false} />
      {/* 1 gancho */}
      <Chao t={t} />
      <Derrapagem t={t} />
      <LinhasVelocidade t={t} forca={1 - entre(t, G.freia, G.para + 0.1)} ang={0} caixa={[0, 700, 1080, 1300]} n={16} seed="gancho" />
      <Puf t={t} t0={G.freia + 0.1} x={GAN.cx - 300} y={L.chao - 40} seed="freia" />
      <Puf t={t} t0={G.para} x={GAN.cx - 250} y={L.chao - 30} n={9} raio={170} seed="para" />
      <Estouro t={t} t0={G.fome} cx={L.fome.cx} cy={L.fome.cy} linhas={["BATEU A", "FOME?"]} sai={TRK[0].t0} />
      {/* o palco: o celular e o que salta dele */}
      {t >= TRK[0].t0 && t < TRK[5].t1 && (
        <AbsoluteFill style={{ transform: `translate(${pal.tx}px, ${pal.ty}px) scale(${pal.s})`, transformOrigin: `${pal.ox}px ${pal.oy}px`, filter: pal.blur > 0.5 ? `blur(${pal.blur}px)` : undefined }}>
          <AbsoluteFill style={{ transform: giro < 1 ? `translate(${(1 - outCubic(giro)) * -260}px, ${(1 - outCubic(giro)) * 300}px) rotate(${-540 * (1 - outCubic(giro))}deg) scale(${outBack(giro, 1.5)})` : undefined,
            transformOrigin: `${CEL.x + CEL.w / 2}px ${CEL.y + CEL.h / 2}px` }}>
            <Celular t={t} />
          </AbsoluteFill>
          <CenaInicio t={t} />
          <CenaProduto t={t} />
          <CenaCheckout t={t} quadro={quadro} />
          <CenaAcompanhar t={t} />
          <CenaPontos t={t} />
        </AbsoluteFill>
      )}
      <LinhasRadiais t={t} forca={tri(t, TRK[1].t0, (TRK[1].t0 + TRK[1].t1) / 2, TRK[1].t1)} cx={540} cy={900} seed="zoom" />
      <LinhasVelocidade t={t} forca={tri(t, TRK[2].t0, (TRK[2].t0 + TRK[2].t1) / 2, TRK[2].t1) * 1.4} ang={0} n={26} seed="chicote" />
      <LinhasVelocidade t={t} forca={tri(t, TRK[4].t0, (TRK[4].t0 + TRK[4].t1) / 2, TRK[4].t1) * 1.4} ang={90} n={26} seed="empurra" />
      {flashZoom > 0 && <AbsoluteFill style={{ background: C.papel, opacity: flashZoom }} />}
      <SacolaCena t={t} quadro={quadro} />
      <Chuva t={t} />
      <Narrador t={t} quadro={quadro} />
      {t >= fx.t0 && t < fx.t1 && <ColorSwipe frame={(t - fx.t0) * FPS} duration={(fx.t1 - fx.t0) * FPS} />}
      <Fecho t={t} quadro={quadro} />
      <Legenda t={t} dados={LEGENDA as LegendaDados} />
      <Selo x={L.selo.x} y={L.selo.y} size={L.selo.size} />
    </AbsoluteFill>
  );
};

export const PEDIR = { duracao: CENA.quadros, fps: FPS };
