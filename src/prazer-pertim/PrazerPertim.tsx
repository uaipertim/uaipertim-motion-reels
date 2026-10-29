import React, { useMemo } from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, FONT, W } from "../config/theme";
import { CremeBackground } from "../components/Decor";
import { StarShape, Twinkles } from "../components/Particles";
import { ShopChar, ShopCharKind } from "../components/Town";
import { Pertim, PertimRig } from "../personagem/Pertim";
import type { Expressao, Pose } from "../personagem/logica";
import { bocaNoQuadro, Olhar, olharEm, piscadaEm, respiracao, trocaDePose, Visemas } from "../personagem/rig";
import LAYOUT from "../../reels/prazer-pertim/layout.json";
import CENA from "../../reels/prazer-pertim/dados/cena.json";
import VISEMAS from "../../reels/prazer-pertim/dados/visemas.json";
import LEGENDA from "../../reels/prazer-pertim/dados/legenda.json";

// REEL DE TESTE "PRAZER, PERTIM" (1080×1920, 60 fps). A voz, as cenas e a mixagem vêm do pipeline do Explica, Sô!
// (episodios/prazer-pertim.json); os tempos, a boca, as piscadas e a legenda, de reels/prazer-pertim/dados/
// (scripts/preparar.py); as posições, de reels/prazer-pertim/layout.json (as mesmas que a revisão confere).
//   cena 1 (gancho): o Pertim chega na motinha desde o quadro 0, freia e para no meio, olhando para a câmera;
//   cena 2: ele aponta e as lojinhas (padaria, mercadim, lanchonete) brotam do chão, uma por palavra, e piscam para ele;
//   cena 3: ele pega a sacola, sorrindo; em "pertim" chega mais perto, com coraçõezinhos;
//   fecho: ele acena com a piscadinha, a logo oficial entra e fica parada até o fim; o chip "Segue @uaipertim" entra
//   na faixa da legenda quando ela sai.
// O olhar fica na câmera (pupilas centradas) o tempo todo; só desvia ~0,55 s para cada lojinha que brota (cena.json).
// Na fala, as pausas entre palavras usam o sorriso da expressão "sorrindo". A legenda (texto da tela, a palavra falada
// em amarelo) fica abaixo do chão, sem cobrir o personagem.

const L = LAYOUT as typeof LAYOUT;
const EV = CENA.eventos;
const FPS = CENA.fps;
const VB: Record<string, [number, number]> = { moto: [300, 254], parado: [240, 270] };
const larguraDe = (pose: string, altura: number) => { const [w, h] = VB[pose] ?? [280, 284]; return (altura * w) / h; };
type Estado = { cx: number; base: number; altura: number; pose: Pose; expr: Expressao; bracoAng?: number };
const ESTADOS: Record<string, Estado> = {
  chegada: { ...(L.pertim.chegada as Omit<Estado, "expr">), expr: "sorrindo" },
  lojinhas: { ...(L.pertim.lojinhas as Omit<Estado, "expr">), expr: "sorrindo" },
  sacola: { ...(L.pertim.sacola as Omit<Estado, "expr">), expr: "sorrindo" },
  fecho: { ...(L.pertim.fecho as Omit<Estado, "expr">), expr: "piscadinha" },
};
// as trocas: [quando, de, para]
const TROCAS: Array<[number, string, string]> = [[EV.aponta, "chegada", "lojinhas"], [EV.sacola, "lojinhas", "sacola"], [EV.aceno, "sacola", "fecho"]];
const TROCA_DUR = 0.45;
const ease = Easing.inOut(Easing.cubic);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const outBack = (x: number, s = 1.9) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2));

const cenaAtual = (t: number) => CENA.cenas.find((c) => t >= c.t0 - 0.9 && t < c.t1 + 0.01) ?? CENA.cenas[CENA.cenas.length - 1];

const PertimNaCena: React.FC<{ t: number; quadro: number }> = ({ t, quadro }) => {
  // o estado atual e, durante uma troca, o anterior (os dois se cruzam com um pop)
  let k = "chegada", de: string | null = null, u = 1, tt = -1;
  for (const [ts, a, b] of TROCAS) if (t >= ts) { k = b; de = a; tt = ts; }
  if (de && t < tt + TROCA_DUR) u = (t - tt) / TROCA_DUR; else de = null;
  const A = ESTADOS[k], P = de ? ESTADOS[de] : null;
  const e = P ? ease(u) : 1;
  const cx = P ? interpolate(e, [0, 1], [P.cx, A.cx]) : A.cx;
  const base = P ? interpolate(e, [0, 1], [P.base, A.base]) : A.base;
  let altura = P ? interpolate(e, [0, 1], [P.altura, A.altura]) : A.altura;
  // a chegada: a motinha entra pela esquerda desde o quadro 0, freia e para (com um tranco)
  let dx = 0, rot = 0, quique = 0;
  if (k === "chegada") {
    const c = EV.chegada;
    dx = -400 * (1 - Easing.out(Easing.cubic)(Math.min(1, t / c.para)));
    rot = t < c.freia ? -2 : interpolate(t, [c.freia, c.para, c.para + 0.35], [-2, 5, 0], clamp);
    quique = t > c.para ? -8 * Math.sin((t - c.para) * 14) * Math.exp(-(t - c.para) * 5) : 0;
  }
  // em "pertim": chega mais perto da câmera
  if (k === "sacola") altura *= 1 + 0.07 * Easing.out(Easing.cubic)(interpolate(t, [EV.pertim, EV.pertim + 0.5], [0, 1], clamp));
  // a fala: a boca dos visemas enquanto a voz da cena fala; fora dela, a boca da expressão
  const c = cenaAtual(t);
  const falando = t >= c.voz_t0 - 0.02 && t <= c.voz_t1 + 0.04;
  const boca = bocaNoQuadro(VISEMAS as Visemas, quadro, falando);
  const resp = respiracao(t);
  const rig = (est: Estado, poseDe?: Pose): PertimRig => ({
    ...resp,
    quique,
    piscada: piscadaEm(CENA.piscadas, t, CENA.piscada_dur),
    olhar: olharEm(CENA.olhares as unknown as Olhar[], t),
    centro: true,
    aceno: est.pose === "acenando" ? 12 * Math.sin(t * 9) : est.bracoAng ?? 0,
    braco: poseDe ? trocaDePose(poseDe, t, tt, 0.18) : undefined,
  });
  // durante a troca: o estado anterior sai (encolhe e some) e o novo entra com pop
  const desenha = (est: Estado, alpha: number, escala: number, poseDe?: Pose) => {
    const h = altura * escala, w = larguraDe(est.pose, h);
    return (
      <div style={{ position: "absolute", left: cx + dx - w / 2, top: base - h, width: w, height: h, opacity: alpha, transform: `rotate(${rot}deg)`, transformOrigin: "50% 100%" }}>
        <Pertim v={1} pose={est.pose} expr={est.expr} mouth={boca ?? "auto"} altura={h} rig={rig(est, poseDe)} />
      </div>
    );
  };
  if (P && P.pose === "moto") {
    // descer da motinha: troca o desenho inteiro no meio, com um pop
    return u < 0.5 ? desenha(P, 1 - Math.max(0, (u - 0.3) / 0.2), 1 - 0.1 * (u / 0.5)) : desenha(A, Math.min(1, (u - 0.5) / 0.15), 0.85 + 0.15 * outBack((u - 0.5) / 0.5));
  }
  return desenha(A, 1, P ? 0.94 + 0.06 * outBack(u) : 1, P ? P.pose : undefined);
};

// as lojinhas da cena 2: brotam na palavra e piscam para o Pertim; saem quando ele pega a sacola
const Lojinhas: React.FC<{ t: number }> = ({ t }) => {
  const sai = interpolate(t, [EV.sacola, EV.sacola + 0.35], [1, 0], clamp);
  if (sai <= 0) return null;
  const Lj = L.lojinhas;
  // as mais longe (base mais alta) primeiro; todas atrás do Pertim, brotando do chão delas
  const ordem = EV.lojas.map((l, i) => ({ l, i })).sort((a, b) => Lj.base[a.i] - Lj.base[b.i]);
  return (
    <>
      {ordem.map(({ l, i }) => {
        if (t < l.t) return null;
        const e = outBack(Math.min(1, (t - l.t) / 0.4), 2.2) * sai;
        const w = Lj.largura[i], h = w * 1.28, x = Lj.cx[i];
        const pisca = interpolate(t, [l.t + 0.45, l.t + 0.53, l.t + 0.61], [0, 1, 0], clamp);
        return (
          <div key={l.tipo} style={{ position: "absolute", left: x - w / 2, top: Lj.base[i] - h, width: w, height: h, transform: `scale(${0.6 + 0.4 * e}, ${e})`, transformOrigin: "50% 100%" }}>
            <ShopChar kind={l.tipo as ShopCharKind} width={w} mood="happy" look={[(ESTADOS.lojinhas.cx - x) / 500, -0.2]} blink={pisca} lit={0.9} awning={0.4} />
          </div>
        );
      })}
    </>
  );
};

// a legenda gravada: pílula tinta 85% com o texto creme; a palavra falada em amarelo
const Legenda: React.FC<{ t: number }> = ({ t }) => {
  const b = LEGENDA.blocos.find((x) => t >= x.t0 && t < x.t1);
  const st = LEGENDA.estilo;
  const medir = useMemo(() => {
    const c = document.createElement("canvas").getContext("2d")!;
    c.font = `800 ${st.size}px ${FONT}`;
    return (s: string) => c.measureText(s).width;
  }, [st.size]);
  if (!b) return null;
  const todas = b.linhas.flat();
  let atual = -1;
  todas.forEach((w, i) => { if (t >= w.t0 - 0.02) atual = i; });
  const larg = Math.max(...b.linhas.map((l) => medir(l.map((w) => w.w).join(" "))));
  const wPill = larg + 2 * st.padX, hPill = b.linhas.length * st.lh + 2 * st.padY;
  let k = -1;
  return (
    <div style={{ position: "absolute", left: st.cx - wPill / 2, top: st.base - hPill, width: wPill, height: hPill, borderRadius: Math.min(22, hPill / 2), background: "rgba(34,28,25,0.85)", opacity: Math.min(1, (t - b.t0) / 0.08), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      {b.linhas.map((l, li) => (
        <div key={li} style={{ fontFamily: FONT, fontWeight: W.extraBold, fontSize: st.size, lineHeight: `${st.lh}px`, whiteSpace: "nowrap" }}>
          {l.map((w, wi) => { k++; return <span key={wi} style={{ color: k === atual ? C.amarelo : C.papel }}>{wi ? " " : ""}{w.w}</span>; })}
        </div>
      ))}
    </div>
  );
};

const Chao: React.FC<{ t: number }> = ({ t }) => (
  <div style={{ position: "absolute", left: 0, top: L.chao - 4, width: 1080, height: 46, background: C.cremeDeep }}>
    <svg width={1080} height={46} style={{ position: "absolute", left: 0, top: 0 }}>
      <line x1={0} y1={23} x2={1080} y2={23} stroke={C.coral} strokeWidth={7} strokeDasharray="34 26" strokeDashoffset={t < EV.chegada.para ? -t * 900 : -EV.chegada.para * 900} />
    </svg>
  </div>
);

export const PrazerPertim: React.FC = () => {
  const quadro = useCurrentFrame();
  const t = quadro / FPS;
  const lg = L.logo, ch = L.chip;
  const eLogo = interpolate(t, [EV.logo.entra, EV.logo.parada], [0, 1], clamp);
  const kLogo = eLogo >= 1 ? 1 : outBack(eLogo / 0.8, 1.8);
  const eChip = interpolate(t, [EV.chip, EV.chip + 0.4], [0, 1], clamp);
  const coracao = interpolate(t, [EV.pertim, EV.pertim + 1.2], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: C.creme }}>
      <CremeBackground frame={quadro} rays raysCenter={[540, 900]} raysOpacity={0.12} />
      <Twinkles frame={quadro} seed="prazer-pertim" points={[[150, 420], [930, 400], [120, 1060], [960, 1000], [200, 1180], [880, 1170]]} size={30} />
      <Chao t={t} />
      <Lojinhas t={t} />
      {/* os coraçõezinhos de "pertim de você" */}
      {coracao > 0 && coracao < 1 && [[-210, 0], [230, -60], [-120, -120]].map(([dx, dy], i) => (
        <div key={i} style={{ position: "absolute", left: 540 + dx * 1.35 - 22, top: 600 + dy - 220 * coracao, opacity: 1 - coracao, transform: `scale(${0.6 + 0.6 * coracao})` }}>
          <svg width={44} height={40} viewBox="-50 -50 100 90"><path d="M0 34 C-60 -6 -44 -52 -2 -30 L0 -28 L2 -30 C44 -52 60 -6 0 34 Z" fill={C.coral} /></svg>
        </div>
      ))}
      <PertimNaCena t={t} quadro={quadro} />
      {/* o brilho da piscadinha no aceno */}
      {t > EV.aceno + 0.3 && t < EV.aceno + 1.1 && (
        <div style={{ position: "absolute", left: 830, top: 700, opacity: interpolate(t, [EV.aceno + 0.3, EV.aceno + 0.5, EV.aceno + 1.1], [0, 1, 0], clamp) }}><StarShape size={54} color={C.amarelo} /></div>
      )}
      {/* a logo oficial (o arquivo): entra com mola e PARA */}
      {eLogo > 0 && (
        <div style={{ position: "absolute", left: lg.cx - lg.d / 2, top: lg.cy - lg.d / 2, width: lg.d, height: lg.d, transform: `scale(${kLogo})`, opacity: Math.min(1, eLogo * 4), filter: "drop-shadow(0 14px 24px rgba(198,58,23,0.3))" }}>
          <Img src={staticFile("img/uaipertim_logo.png")} style={{ width: "100%", height: "100%" }} />
        </div>
      )}
      {/* o chip "Segue @uaipertim" */}
      {eChip > 0 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: ch.cy - ch.h / 2, height: ch.h, display: "flex", justifyContent: "center", transform: `scale(${outBack(eChip, 2)})`, transformOrigin: `540px ${ch.h / 2}px` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, height: ch.h, padding: "0 36px", borderRadius: ch.h / 2, background: C.coral, boxShadow: `0 7px 0 ${C.coralDark}`, fontFamily: FONT, fontWeight: W.extraBold, fontSize: ch.size, color: "#fff", whiteSpace: "nowrap" }}>
            <svg width={34} height={34} viewBox="0 0 24 24"><path d="M5 12 H18 M13 6 L19 12 L13 18" stroke="#fff" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
            Segue @uaipertim
          </div>
        </div>
      )}
      <Legenda t={t} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- a capa (PNG para o "Editar capa"): o Pertim acenando
export const PrazerPertimCapa: React.FC = () => (
  <AbsoluteFill style={{ background: C.creme }}>
    <CremeBackground frame={0} rays raysCenter={[540, 860]} raysOpacity={0.12} enfeites={false} />
    <div style={{ position: "absolute", top: 352, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <div style={{ background: C.coral, borderRadius: 999, padding: "16px 40px", boxShadow: `0 7px 0 ${C.coralDark}`, fontFamily: FONT, fontWeight: W.black, fontSize: 38, letterSpacing: 2, color: "#fff" }}>PERSONAGEM OFICIAL</div>
    </div>
    <div style={{ position: "absolute", left: 540 - larguraDe("acenando", 660) / 2, top: 470 }}>
      <Pertim v={1} pose="acenando" expr="piscadinha" altura={660} />
    </div>
    <div style={{ position: "absolute", top: 1150, left: 0, right: 0, textAlign: "center", fontFamily: FONT, fontWeight: W.black, fontSize: 168, lineHeight: 1.0, letterSpacing: -4, color: C.tinta }}>
      Prazer,
      <div style={{ color: C.coral, position: "relative", display: "inline-block" }}>
        <svg viewBox="0 0 100 20" preserveAspectRatio="none" style={{ position: "absolute", left: -14, width: "calc(100% + 28px)", bottom: 4, height: 70, overflow: "visible" }}>
          <path d="M4 13 C30 9, 62 16, 96 7" stroke={C.amarelo} strokeWidth={46} strokeLinecap="round" fill="none" vectorEffect="non-scaling-stroke" />
        </svg>
        <span style={{ position: "relative" }}>Pertim!</span>
      </div>
    </div>
  </AbsoluteFill>
);

// ---------------------------------------------------------------- o teste da boca: só o rosto, falando a cena 1
export const PertimBocaTeste: React.FC = () => {
  const quadro = useCurrentFrame();
  const t = quadro / FPS;
  const c = CENA.cenas[0];
  const falando = t >= c.voz_t0 - 0.02 && t <= c.voz_t1 + 0.04;
  const boca = bocaNoQuadro(VISEMAS as Visemas, quadro, falando);
  return (
    <AbsoluteFill style={{ background: C.creme, alignItems: "center", justifyContent: "center" }}>
      <Pertim v={1} crop="rosto" expr="sorrindo" mouth={boca ?? "auto"} altura={900} rig={{ ...respiracao(t), piscada: piscadaEm(CENA.piscadas, t, CENA.piscada_dur), centro: true }} />
      <div style={{ position: "absolute", top: 28, left: 28, padding: "10px 26px", borderRadius: 999, background: "rgba(34,28,25,0.85)", fontFamily: FONT, fontWeight: W.extraBold, fontSize: 38, color: C.papel }}>
        boca: <span style={{ color: C.amarelo }}>{boca ?? "expressão"}</span>
      </div>
    </AbsoluteFill>
  );
};
export const PRAZER = { duracao: CENA.quadros, fps: FPS, bocaTeste: Math.round(CENA.cenas[0].t1 * FPS) };
