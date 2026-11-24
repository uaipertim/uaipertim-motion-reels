import React from "react";
import { AbsoluteFill, Easing, Img, staticFile, useCurrentFrame } from "remotion";
import { C, FONT, W } from "../config/theme";
import { StarShape } from "../components/Particles";
import { ShopChar, SHOP_RATIO } from "../components/Town";
import { BoxIcon, ScooterIcon } from "../components/AppIcons";
import { BellGlyph, Lock } from "../components/Icons";
import { fitWrap, Wrapped } from "../dicionario/fit";
import { Text, glue } from "../carrossel/CarrosselFacim";
import { Pertim } from "../personagem/Pertim";
import { piscadaEm } from "../personagem/rig";
import { Brilhos, FONTE, Fundo, PertimFixo, TAU, clamp01, ease, hop, onda, outBack } from "../quiz/QuizMineiro";

// CARROSSEL ANIMADO #02 "COMO CHEGA O SEU PEDIDO?" (carrosseis/animados/02-como-chega-o-seu-pedido.json), no motor do Quiz #01
// (scripts/quiz.mjs + scripts/quiz_qa.py com o caminho do JSON). Cada lâmina é um vídeo 1080 × 1350 (4:5: o agendador do
// Instagram não aceita vídeo 3:4), 30 fps, sem áudio, em LOOP: toda animação é periódica na duração da lâmina (D), então o
// quadro D é igual ao quadro 0. Lâmina 1 = capa da grade: o quadro 0 já é a capa completa.
//   1 capa       o Pertim na motinha (com a mochila de entrega) entre a lojinha e a casa; "Como *chega* o seu pedido?"
//   2 escolha    a tela Checkout.png num celular; o destaque passa por "Entrega" e "Retirar na loja" (e os chips acendem)
//   3 loja       "Escolheu entrega? Quem leva é a loja que decide": a motinha sai da lojinha e chega na porta da casa
//   4 parceiro   "…ou um entregador parceiro do UaiPertim": Chama → Aceita → Coleta → Leva; o selo de confiança e o telefone
//   5 balcão     "Prefere buscar? Retirada no balcão": o Pertim acenando na porta da lojinha
//   (o cliente escolhe só entre entrega e retirada; na entrega, quem leva é a loja que decide)
//   6 acompanha  a tela Acompanhar.png (a partir da linha do tempo) e o cartão com os 5 status acendendo; a notificação
//   7 fecho      os cartões Entrega e Retirada no balcão acendem um a um; "Comenta: entrega ou retirada? 👇"; a logo redonda
// Todo o conteúdo fica em x 135–945 e y 60–1290. `semFundo` tira o fundo para o QA medir o conteúdo.

type Lamina = {
  tipo: "capa" | "escolha" | "loja" | "parceiro" | "balcao" | "acompanha" | "fecho"; rotulo: string; segundos: number; estatico?: number;
  titulo: string | string[]; quebra?: string[]; rodape?: string; texto?: string; numero?: number; opcoes?: string[]; nota?: string; passos?: string[]; selo?: string;
  detalhe?: string; status?: string[]; notificacao?: string; cartoes?: string[]; cta?: string; assinatura?: string;
};
export type ComoChegaDados = { numero: number; formato: [number, number]; selo: string; ilustrativo: string; laminas: Lamina[] };
export type ComoChegaProps = ComoChegaDados & { lamina: number; layout?: { titulo: Wrapped }; semFundo?: boolean };

export const COMO_CHEGA = { width: 1080, height: 1350, fps: 30 };
export const SAFE = { x0: 135, x1: 945 };
export const LARG = SAFE.x1 - SAFE.x0;
export const TIT = { x: SAFE.x0 + 8, w: LARG - 16 };                 // +8: o marcador passa um pouco da 1ª letra
export const plain = (t: string) => t.replace(/\*/g, "");
export const juntaChave = (t: string) => t.replace(/\*([^*]+)\*/g, (_, k: string) => `*${k.replace(/ +/g, " ")}*`);
export const duracaoComoChega = (d: ComoChegaDados, i: number) => Math.round(d.laminas[i].segundos * COMO_CHEGA.fps);
const CAPA_T = { cy: 860, maxH: 330, sizes: [150, 140, 130, 120, 110, 100, 92, 84] };
const NUM_W = 112;                                            // a bolinha do número (lâminas 3–5) + o respiro até o título

// medido em calculateMetadata (fontes carregadas)
export const medeComoChega = (d: ComoChegaDados, i: number): { titulo: Wrapped } => {
  const L = d.laminas[i];
  if (L.tipo === "capa") {
    const lines = (L.titulo as string[]).map((l) => glue(plain(l)));
    const size = CAPA_T.sizes.find((z) => lines.length * z * 1.12 <= CAPA_T.maxH && lines.every((l) => fitWrap(l, W.black, LARG, [z], 1).ok)) ?? 84;
    return { titulo: { size, lines, ok: true } };
  }
  const larg = L.numero ? TIT.w - NUM_W : TIT.w;
  // "quebra" (opcional): as linhas do título definidas, no maior tamanho em que todas cabem
  if (L.quebra?.length) {
    const lines = L.quebra.map((l) => glue(plain(juntaChave(l))));
    if (lines.join(" ") !== glue(plain(juntaChave(L.titulo as string)))) throw new Error(`lâmina ${i + 1}: a quebra não bate com o título`);
    const size = [76, 70, 64, 60, 56].find((z) => lines.every((l) => fitWrap(l, W.black, larg, [z], 1).ok)) ?? 56;
    return { titulo: { size, lines, ok: true } };
  }
  return { titulo: fitWrap(glue(plain(juntaChave(L.titulo as string))), W.black, larg, [76, 70, 64, 60, 56], 3) };
};

// ---------------------------------------------------------------- tempo
export const liga = (t: number, a: number, b: number, r = 0.3) => ease(clamp01((t - a) / r)) * (1 - ease(clamp01((t - (b - r)) / r)));
export const mix = (c0: string, c1: string, u: number) => {
  const h = (c: string, i: number) => parseInt(c.slice(1 + 2 * i, 3 + 2 * i), 16);
  return `rgb(${[0, 1, 2].map((i) => Math.round(h(c0, i) + (h(c1, i) - h(c0, i)) * u)).join(",")})`;
};

// ---------------------------------------------------------------- selo, cabeçalho, título, texto
const IconeRota: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="0 0 24 24">
    <path d="M12 22 C12 22 5 14.5 5 9.5 A7 7 0 0 1 19 9.5 C19 14.5 12 22 12 22 Z" fill={C.amarelo} />
    <circle cx="12" cy="9.5" r="2.8" fill={C.coral} />
  </svg>
);
export const Selo: React.FC<{ texto: string; s: number; icone?: React.ReactNode }> = ({ texto, s, icone }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: s * 0.4, background: C.coral, borderRadius: 999, padding: `${s * 0.36}px ${s * 0.9}px ${s * 0.36}px ${s * 0.66}px`, boxShadow: `0 ${s * 0.19}px 0 ${C.coralDark}` }}>
    {icone ?? <IconeRota s={s * 1.35} />}
    <span style={{ fontFamily: FONT, fontWeight: W.black, fontSize: s, lineHeight: 1, color: "#fff", letterSpacing: s * 0.05, whiteSpace: "nowrap" }}>{texto}</span>
  </div>
);
export const Cabecalho: React.FC<{ selo: string; n: number; total: number; icone?: React.ReactNode }> = ({ selo, n, total, icone }) => (
  <>
    <div style={{ position: "absolute", left: SAFE.x0, top: 112 - 38, height: 76, display: "flex", alignItems: "center" }}><Selo texto={selo} s={28} icone={icone} /></div>
    <div style={{ position: "absolute", right: 1080 - SAFE.x1, top: 112 - 38, height: 76, display: "flex", alignItems: "center", fontFamily: FONT, fontWeight: W.black, fontSize: 52, letterSpacing: -1, lineHeight: 1 }}>
      <span style={{ color: C.coral }}>{n}</span><span style={{ color: C.tinta, opacity: 0.4 }}>/{total}</span>
    </div>
  </>
);
const NumeroBola: React.FC<{ n: number; s?: number }> = ({ n, s = 92 }) => (
  <div style={{ width: s, height: s, borderRadius: "50%", background: C.coral, boxShadow: `0 7px 0 ${C.coralDark}`, display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: FONT, fontWeight: W.black, fontSize: s * 0.6, color: "#fff", lineHeight: 1 }}><span style={{ marginTop: s * 0.06 }}>{n}</span></div>
);
// o título no alto (centrado na faixa y 165–335), à esquerda; com número, a bolinha antes
export const altTitulo = (wt: Wrapped) => wt.lines.length * wt.size * 1.12;
export const Titulo: React.FC<{ L: Pick<Lamina, "titulo" | "numero">; wt: Wrapped; y0?: number; y1?: number; topo?: boolean }> = ({ L, wt, y0 = 168, y1 = 332, topo }) => {
  const th = altTitulo(wt);
  const top = topo ? y0 : (y0 + y1) / 2 - th / 2;
  return (
    <>
      {L.numero ? <div style={{ position: "absolute", left: SAFE.x0, top: (y0 + y1) / 2 - 46 }}><NumeroBola n={L.numero} /></div> : null}
      <div style={{ position: "absolute", left: TIT.x + (L.numero ? NUM_W : 0), width: TIT.w - (L.numero ? NUM_W : 0), top }}>
        <Text source={glue(juntaChave(L.titulo as string))} wrapped={wt} weight={W.black} align="left" />
      </div>
    </>
  );
};
export const Texto: React.FC<{ y: number; size?: number; children: React.ReactNode; w?: number; x?: number }> = ({ y, size = 40, children, w = TIT.w, x = TIT.x }) => (
  <div style={{ position: "absolute", left: x, width: w, top: y, fontFamily: FONTE, fontWeight: W.medium, fontSize: size, lineHeight: 1.22, color: C.tinta, letterSpacing: -0.3, textWrap: "balance" } as React.CSSProperties}>{children}</div>
);
export const Ilustrativo: React.FC<{ texto: string; y: number }> = ({ texto, y }) => (
  <div style={{ position: "absolute", left: SAFE.x0, width: LARG, top: y, display: "flex", justifyContent: "center" }}>
    <div style={{ fontFamily: FONT, fontWeight: W.extraBold, fontSize: 24, lineHeight: "32px", color: C.tinta, background: "rgba(255,249,241,0.92)", borderRadius: 999, padding: "2px 18px",
      whiteSpace: "nowrap", boxShadow: "0 3px 8px rgba(34,28,25,0.10)" }}><span style={{ opacity: 0.68 }}>{texto}</span></div>
  </div>
);

// ---------------------------------------------------------------- o celular com uma tela do app (recorte que começa em `rola`, px do PNG)
const ALTURA_TELA: Record<string, number> = { Checkout: 4740, Acompanhar: 3540 };
const Celular: React.FC<{ x: number; y: number; w: number; h: number; tela: string; rola: number; children?: React.ReactNode }> = ({ x, y, w, h, tela, rola, children }) => {
  const bz = w * 0.04, tw = w - 2 * bz, th = h - 2 * bz, K = tw / 1170;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: w * 0.14, background: C.tinta, boxShadow: `inset 0 0 0 ${w * 0.012}px #4A3E38, 0 26px 50px rgba(34,28,25,0.28)` }} />
      <div style={{ position: "absolute", left: bz, top: bz, width: tw, height: th, borderRadius: w * 0.105, overflow: "hidden", background: "#FAF8F5" }}>
        <div style={{ position: "absolute", left: 0, top: -rola * K, width: 1170, height: ALTURA_TELA[tela], transform: `scale(${K})`, transformOrigin: "0 0" }}>
          <Img src={staticFile(`telas-app/celular/${tela}.png`)} style={{ position: "absolute", left: 0, top: 0, width: 1170, height: ALTURA_TELA[tela], maxWidth: "none" }} />
          {children}
        </div>
      </div>
      <div style={{ position: "absolute", left: w / 2 - 8, top: bz + 10, width: 16, height: 16, borderRadius: "50%", background: "#0D0B0A" }} />
    </div>
  );
};
// o anel de destaque, em px do PNG (dentro da tela)
export const Anel: React.FC<{ cx: [number, number, number, number]; e: number; raio?: number; esp?: number }> = ({ cx, e, raio = 44, esp = 12 }) =>
  e <= 0.001 ? null : (
    <div style={{ position: "absolute", left: cx[0] - 12, top: cx[1] - 12, width: cx[2] - cx[0] + 24, height: cx[3] - cx[1] + 24, borderRadius: raio, border: `${esp}px solid ${C.coral}`,
      boxShadow: `0 0 0 ${14 * e}px rgba(249,178,51,0.35)`, opacity: Math.min(1, e * 1.5), transform: `scale(${0.9 + 0.1 * e})` }} />
  );
// o toque: o círculo que aperta e a onda (em px do PNG)
export const Toque: React.FC<{ u: number; x: number; y: number; r?: number }> = ({ u, x, y, r = 80 }) =>
  u <= 0 || u >= 1 ? null : (
    <>
      <div style={{ position: "absolute", left: x - r * (0.5 + 1.4 * u), top: y - r * (0.5 + 1.4 * u), width: 2 * r * (0.5 + 1.4 * u), height: 2 * r * (0.5 + 1.4 * u), borderRadius: "50%",
        border: `${14 * (1 - u) + 4}px solid ${C.amarelo}`, opacity: 1 - u }} />
      <div style={{ position: "absolute", left: x - r * 0.6, top: y - r * 0.6, width: r * 1.2, height: r * 1.2, borderRadius: "50%", background: C.coral, opacity: 0.35 * (1 - u) }} />
    </>
  );

// ---------------------------------------------------------------- peças desenhadas
const Casa: React.FC<{ x: number; y: number; w: number; luz?: number }> = ({ x, y, w, luz = 0 }) => (
  // (x, y) = o canto de baixo à esquerda
  <svg width={w} height={w * 1.02} viewBox="0 0 200 204" style={{ position: "absolute", left: x, top: y - w * 1.02, overflow: "visible" }}>
    <ellipse cx="100" cy="202" rx="96" ry="7" fill="#000" opacity="0.08" />
    <rect x="22" y="86" width="156" height="116" rx="10" fill="#FFF3DF" />
    <path d="M2 96 L100 10 L198 96 Z" fill={C.verde} />
    <rect x="2" y="88" width="196" height="16" rx="8" fill={C.verdeDark} />
    <rect x="80" y="128" width="42" height="74" rx="8" fill={C.coralDark} />
    <circle cx="113" cy="168" r="4" fill={C.amarelo} />
    <rect x="36" y="122" width="34" height="34" rx="5" fill={mix("#FFE48A", "#FFD24A", luz)} stroke="#8A4A1C" strokeWidth="4" />
    <rect x="132" y="122" width="34" height="34" rx="5" fill={mix("#FFE48A", "#FFD24A", luz)} stroke="#8A4A1C" strokeWidth="4" />
    <rect x="138" y="30" width="20" height="40" rx="3" fill="#B65A3A" />
  </svg>
);
const Estrada: React.FC<{ x0: number; x1: number; y: number; desloca: number }> = ({ x0, x1, y, desloca }) => (
  <svg width={x1 - x0} height={44} style={{ position: "absolute", left: x0, top: y - 22, overflow: "hidden", borderRadius: 22 }}>
    <rect x="0" y="0" width={x1 - x0} height="44" rx="22" fill={C.cremeDeep} />
    <line x1={-60 + (desloca % 60)} y1="22" x2={x1 - x0 + 60} y2="22" stroke="#fff" strokeWidth="6" strokeDasharray="30 30" strokeLinecap="round" opacity="0.9" />
  </svg>
);
const LinhasVelocidade: React.FC<{ x: number; y: number; f: number; D: number }> = ({ x, y, f, D }) => (
  <>
    {[0, 1, 2].map((i) => {
      const u = ((f / D) * 6 + i / 3) % 1;
      return <div key={i} style={{ position: "absolute", left: x - 30 - 60 * u, top: y + i * 28, width: 70 - 20 * i, height: 9, borderRadius: 5, background: C.tinta, opacity: 0.22 * Math.sin(Math.PI * u) }} />;
    })}
  </>
);
export const Escudo: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="0 0 100 100">
    <path d="M50 6 L86 20 V48 C86 72 70 88 50 96 C30 88 14 72 14 48 V20 Z" fill={C.verde} />
    <path d="M50 6 L86 20 V48 C86 72 70 88 50 96 Z" fill={C.verdeDark} opacity="0.35" />
    <path d="M32 52 L45 65 L70 38" stroke="#fff" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);
export const IconeCheck: React.FC<{ s: number; cor: string }> = ({ s, cor }) => (
  <svg width={s} height={s} viewBox="0 0 100 100"><path d="M26 52 L43 69 L76 34" stroke={cor} strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
);

// ================================================================ 1 · capa (quadro 0 = a capa da grade)
const Capa: React.FC<ComoChegaProps & { L: Lamina; f: number; D: number }> = ({ selo, L, layout, f, D }) => {
  const t = layout!.titulo, th = t.lines.length * t.size * 1.12;
  const alt = 400, mw = (alt * 300) / 254;
  const bob = 5 * onda(f, D, 6);                          // a motinha trepida na estrada
  return (
    <>
      <div style={{ position: "absolute", top: 120 - 60, left: 0, right: 0, height: 120, display: "flex", justifyContent: "center", alignItems: "center" }}><Selo texto={selo} s={40} /></div>
      <div style={{ position: "absolute", left: 540 - 380, top: 470 - 380, width: 760, height: 760, borderRadius: "50%", background: `radial-gradient(circle, ${C.amareloLight}66 0%, ${C.amareloLight}00 68%)` }} />
      <Estrada x0={150} x1={930} y={666} desloca={(-f / D) * 60 * 8} />
      <div style={{ position: "absolute", left: 150, top: 640 - 150 * SHOP_RATIO }}><ShopChar kind="padaria" width={150} mood="happy" lit={0.9} awning={0.3} look={[0.6, 0]} /></div>
      <Casa x={790} y={644} w={150} luz={0.5 + 0.5 * onda(f, D, 2)} />
      <LinhasVelocidade x={345} y={470} f={f} D={D} />
      <div style={{ position: "absolute", left: 540 - mw / 2, top: 668 - alt + bob }}>
        <Pertim v={1} pose="moto" expr="sorrindo" altura={alt} rig={{ olhar: [0, 0], centro: true, respira: onda(f, D, 2), piscada: piscadaEm([2.1, 4.6], f / 30) }} />
      </div>
      <div style={{ position: "absolute", top: CAPA_T.cy - th / 2, left: SAFE.x0, width: LARG }}>
        <Text source={glue((L.titulo as string[]).join(" "))} wrapped={t} weight={W.black} />
      </div>
      <div style={{ position: "absolute", top: CAPA_T.cy + th / 2 + 46, left: SAFE.x0, width: LARG, textAlign: "center", fontFamily: FONTE, fontWeight: W.medium, fontSize: 44, color: C.tinta, letterSpacing: -0.3, whiteSpace: "nowrap" }}>
        {L.rodape!.replace(/\s*→$/, "")} <span style={{ display: "inline-block", transform: `translateX(${10 * (1 - Math.cos((TAU * 4 * f) / D)) / 2}px)` }}>→</span>
      </div>
    </>
  );
};

// ================================================================ 2 · escolha (Checkout: Entrega / Retirar na loja)
const ABA = { entrega: [72, 240, 579, 366] as [number, number, number, number], retirada: [591, 240, 1104, 366] as [number, number, number, number] };
const Escolha: React.FC<ComoChegaProps & { L: Lamina; f: number; D: number }> = ({ L, layout, f, ilustrativo }) => {
  const t = f / 30;
  const eE = liga(t, 0.6, 3.0), eR = liga(t, 3.3, 5.9);
  const op = L.opcoes!;
  const Chip: React.FC<{ e: number; icone: React.ReactNode; txt: string }> = ({ e, icone, txt }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 30px 14px 22px", borderRadius: 999, background: mix("#FFFFFF", "#FFE9DF", e),
      border: `5px solid ${mix("#EADBC6", C.coral, e)}`, boxShadow: `0 7px 0 ${mix("#E2CDB2", C.coralDark, e)}`, transform: `scale(${1 + 0.06 * e})`,
      fontFamily: FONT, fontWeight: W.black, fontSize: 40, color: C.tinta, whiteSpace: "nowrap" }}>{icone}{txt}</div>
  );
  return (
    <>
      <Titulo L={L} wt={layout!.titulo} />
      <Celular x={250} y={372} w={580} h={600} tela="Checkout" rola={0}>
        <Anel cx={ABA.entrega} e={eE} />
        <Anel cx={ABA.retirada} e={eR} />
        <Toque u={(t - 0.6) / 0.6} x={325} y={303} />
        <Toque u={(t - 3.3) / 0.6} x={847} y={303} />
      </Celular>
      <div style={{ position: "absolute", left: SAFE.x0, width: LARG, top: 1004, display: "flex", justifyContent: "center", gap: 30 }}>
        <Chip e={eE} txt={op[0]} icone={<ScooterIcon size={50} />} />
        <Chip e={eR} txt={op[1]} icone={<svg width={46} height={46} viewBox="0 0 100 100"><rect x="18" y="44" width="64" height="44" rx="4" fill={C.coral} />
          {Array.from({ length: 5 }).map((_, i) => <path key={i} d={`M${14 + i * 14.4} 30 H${28.4 + i * 14.4} V44 A7.2 7.2 0 0 1 ${14 + i * 14.4} 44 Z`} fill={i % 2 ? "#fff" : C.coralDark} />)}
          <rect x="12" y="24" width="76" height="8" rx="4" fill={C.coral} /><rect x="40" y="58" width="20" height="30" rx="3" fill="#fff" /></svg>} />
      </div>
      <Texto y={1136} size={32} x={SAFE.x0} w={LARG}><div style={{ textAlign: "center", opacity: 0.8 }}>{L.nota}</div></Texto>
      <Ilustrativo texto={ilustrativo} y={1200} />
    </>
  );
};

// ================================================================ 3 · entregador da própria loja (a motinha sai da loja e chega na casa)
const Loja: React.FC<ComoChegaProps & { L: Lamina; f: number; D: number }> = ({ L, layout, f, D }) => {
  const t = f / 30, dur = D / 30;
  const ida = ease(clamp01((t - 0.5) / (dur - 1.6)));
  const alfa = clamp01((t - 0.3) / 0.35) * (1 - clamp01((t - (dur - 0.75)) / 0.35));
  const chegou = clamp01((t - (dur - 1.1)) / 0.4);
  const x = 380 + (680 - 380) * ida;
  const base = 1050;
  return (
    <>
      <Titulo L={L} wt={layout!.titulo} topo />
      <Texto y={168 + altTitulo(layout!.titulo) + 20}>{L.texto}</Texto>
      <div style={{ position: "absolute", left: 540 - 400, top: 760 - 400, width: 800, height: 800, borderRadius: "50%", background: `radial-gradient(circle, ${C.amareloLight}55 0%, ${C.amareloLight}00 68%)` }} />
      <Estrada x0={150} x1={930} y={base + 10} desloca={0} />
      <div style={{ position: "absolute", left: 150, top: base - 350 * SHOP_RATIO }}>
        <ShopChar kind="lanchonete" width={350} mood="happy" lit={0.9} awning={0.4 + 0.2 * onda(f, D, 2)} look={[0.7, 0.1]} sparkle={0.5} />
      </div>
      <Casa x={695} y={base} w={240} luz={chegou} />
      {alfa > 0 && (
        <div style={{ position: "absolute", left: x - 100, top: base - 176 + 4 * Math.abs(onda(f, D, 14)), opacity: alfa }}>
          <LinhasVelocidade x={20} y={40} f={f} D={D} />
          <ScooterIcon size={200} wheelSpin={720 * (f / D) * 7} />
        </div>
      )}
      {/* o corações na porta quando a entrega chega */}
      {chegou > 0 && chegou < 1 && [0, 1, 2].map((i) => (
        <div key={i} style={{ position: "absolute", left: 760 + i * 44, top: base - 300 - 120 * chegou - i * 18, opacity: 1 - chegou, transform: `scale(${0.6 + 0.6 * chegou})` }}>
          <StarShape size={40} color={i === 1 ? C.coral : C.amarelo} />
        </div>
      ))}
    </>
  );
};

// ================================================================ 4 · entregador parceiro (passos, selo de confiança, telefone)
const Parceiro: React.FC<ComoChegaProps & { L: Lamina; f: number; D: number }> = ({ L, layout, f, D }) => {
  const t = f / 30, dur = D / 30;
  const passos = L.passos!;
  const ICONES = [
    <BellGlyph key="b" size={74} swing={0} />,
    <IconeCheck key="c" s={74} cor="#fff" />,
    <BoxIcon key="x" size={78} />,
    <ScooterIcon key="s" size={84} color="#fff" />,
  ];
  const brilho = clamp01((t - (dur - 2.4)) / 0.8);
  return (
    <>
      <Titulo L={L} wt={layout!.titulo} topo />
      <Texto y={Math.max(330, 168 + altTitulo(layout!.titulo) + 20)} size={38}>{L.texto}</Texto>
      {/* os passos: acendem em sequência e apagam juntos, suaves, antes do fim */}
      {passos.map((p, k) => {
        const cx = SAFE.x0 + (LARG / 8) * (2 * k + 1);
        const e = liga(t, 0.5 + 0.8 * k, dur - 0.9, 0.3);
        const pulo = hop(f, (0.5 + 0.8 * k) * 30, 10);
        return (
          <React.Fragment key={k}>
            {k > 0 && (
              <svg width={60} height={30} viewBox="0 0 60 30" style={{ position: "absolute", left: cx - LARG / 8 - 30, top: 560 - 15 }}>
                <path d="M4 15 H48 M38 5 L50 15 L38 25" stroke={mix("#D9CBBB", C.coral, e)} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            )}
            <div style={{ position: "absolute", left: cx - 66, top: 494 - 20 * pulo, width: 132, height: 132, borderRadius: "50%", background: mix("#E9DED0", k === 1 ? C.verde : C.coral, e),
              boxShadow: `0 8px 0 ${mix("#D9CBBB", k === 1 ? C.verdeDark : C.coralDark, e)}`, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${1 + 0.06 * e})` }}>
              <div style={{ opacity: 0.45 + 0.55 * e, filter: e < 0.5 ? "grayscale(0.6)" : undefined }}>{ICONES[k]}</div>
            </div>
            <div style={{ position: "absolute", left: cx - 100, width: 200, top: 650, textAlign: "center", fontFamily: FONT, fontWeight: W.black, fontSize: 34, color: mix("#8C7F75", C.tinta, e) }}>{p}</div>
          </React.Fragment>
        );
      })}
      {/* o selo de confiança (com um brilho que passa) */}
      <div style={{ position: "absolute", left: SAFE.x0, width: LARG, top: 752, height: 150, boxSizing: "border-box", borderRadius: 34, background: "#EAF6EA", border: `5px solid ${C.verde}`,
        boxShadow: `0 8px 0 ${C.verdeDark}`, display: "flex", alignItems: "center", gap: 22, padding: "0 30px 0 22px", overflow: "hidden" }}>
        <Escudo s={96} />
        <div style={{ fontFamily: FONTE, fontWeight: W.extraBold, fontSize: 36, lineHeight: 1.18, color: "#1F5A2B", textWrap: "balance" } as React.CSSProperties}>{L.selo}</div>
        {brilho > 0 && brilho < 1 && <div style={{ position: "absolute", top: -20, bottom: -20, left: -120 + 1060 * brilho, width: 70, background: "rgba(255,255,255,0.55)", transform: "rotate(18deg)" }} />}
      </div>
      {/* o detalhe do telefone */}
      <div style={{ position: "absolute", left: SAFE.x0, width: LARG, top: 940, display: "flex", alignItems: "flex-start", gap: 18 }}>
        <div style={{ flex: "none", marginTop: 4 }}><Lock size={58} color={C.coral} /></div>
        <div style={{ fontFamily: FONTE, fontWeight: W.medium, fontSize: 34, lineHeight: 1.25, color: C.tinta, textWrap: "balance" } as React.CSSProperties}>{L.detalhe}</div>
      </div>
    </>
  );
};

// ================================================================ 5 · retirada no balcão (o Pertim acenando na porta da lojinha)
const Balcao: React.FC<ComoChegaProps & { L: Lamina; f: number; D: number }> = ({ L, layout, f, D }) => {
  const base = 1120, lw = 400;
  return (
    <>
      <Titulo L={L} wt={layout!.titulo} topo />
      <Texto y={168 + altTitulo(layout!.titulo) + 20}>{L.texto}</Texto>
      <div style={{ position: "absolute", left: 600 - 400, top: 820 - 400, width: 800, height: 800, borderRadius: "50%", background: `radial-gradient(circle, ${C.amareloLight}66 0%, ${C.amareloLight}00 68%)` }} />
      <div style={{ position: "absolute", left: SAFE.x0 + 20, width: LARG - 40, top: base - 8, height: 18, borderRadius: 9, background: C.cremeDeep }} />
      <div style={{ position: "absolute", left: 930 - lw, top: base - lw * SHOP_RATIO }}>
        <ShopChar kind="padaria" width={lw} mood="happy" lit={0.75 + 0.25 * onda(f, D, 2)} awning={0.5} look={[-0.7, 0.1]} sparkle={0.6} />
      </div>
      <PertimFixo altura={460} pose="acenando" expr="sorrindo" style={{ left: 340 - 140 * (460 / 284), top: base - 270 * (460 / 284) }}
        rig={{ respira: onda(f, D, 3), capacete: 0.8 * onda(f, D, 3, -0.7), aceno: 14 * onda(f, D, 7), piscada: piscadaEm([1.6, 4.9], f / 30) }} />
    </>
  );
};

// ================================================================ 6 · acompanha (Acompanhar.png + os 5 status + a notificação)
// a tela começa na linha do tempo (rola 1000 px do PNG); as linhas da tela acendem junto com o status que corresponde
const LINHA_TELA: Array<[number, number, number, number]> = [[60, 1262, 1110, 1378], [60, 1424, 1110, 1566], [60, 1590, 1110, 1700]];
const Acompanha: React.FC<ComoChegaProps & { L: Lamina; f: number; D: number }> = ({ L, layout, f, D, ilustrativo }) => {
  const t = f / 30, dur = D / 30;
  const st = L.status!;
  const T0 = 0.6, PASSO = 0.95, APAGA = dur - 0.8;
  const e = (k: number) => liga(t, T0 + PASSO * k, APAGA, 0.25);
  const atual = (k: number) => liga(t, T0 + PASSO * k, k + 1 < st.length ? T0 + PASSO * (k + 1) + 0.1 : APAGA, 0.2);
  const linha = [Math.max(atual(0), atual(1), atual(2)), atual(3), atual(4)];
  const tn = T0 + PASSO * 3;
  const notif = ease(clamp01((t - tn) / 0.35)) * (1 - ease(clamp01((t - (APAGA - 0.4)) / 0.35)));
  return (
    <>
      <Titulo L={L} wt={layout!.titulo} y0={168} y1={322} />
      <Celular x={SAFE.x0 + 14} y={352} w={396} h={790} tela="Acompanhar" rola={1000}>
        {linha.map((x, k) => <Anel key={k} cx={LINHA_TELA[k]} e={x} raio={40} esp={14} />)}
      </Celular>
      <div style={{ position: "absolute", left: 565, width: SAFE.x1 - 565, top: 500, boxSizing: "border-box", padding: "26px 22px", borderRadius: 34, background: "#fff", border: "5px solid #EADBC6",
        boxShadow: "0 9px 0 #E2CDB2", display: "flex", flexDirection: "column", gap: 0 }}>
        {st.map((s, k) => {
          const ek = e(k), ak = atual(k);
          const cor = mix("#E9DED0", ak > 0.5 ? C.coral : C.verde, ek);
          return (
            <div key={k} style={{ position: "relative", display: "flex", alignItems: "center", gap: 16, minHeight: 112 }}>
              {k + 1 < st.length && <div style={{ position: "absolute", left: 27, top: 84, width: 6, height: 56, background: mix("#E9DED0", C.verde, e(k + 1)) }} />}
              <div style={{ flex: "none", width: 60, height: 60, borderRadius: "50%", background: cor, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${1 + 0.12 * ak})`,
                boxShadow: ak > 0.05 ? `0 0 0 ${10 * ak}px rgba(242,80,43,0.18)` : undefined }}>
                {ek > 0.5 ? <IconeCheck s={44} cor="#fff" /> : <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff" }} />}
              </div>
              <div style={{ fontFamily: FONT, fontWeight: W.black, fontSize: 31, lineHeight: 1.1, color: mix("#9C8F86", ak > 0.5 ? C.coral : C.tinta, ek), letterSpacing: -0.4 }}>{s}</div>
            </div>
          );
        })}
      </div>
      {notif > 0.001 && (
        <div style={{ position: "absolute", left: SAFE.x0 + 10, width: LARG - 20, top: 372 - 140 * (1 - notif), opacity: Math.min(1, notif * 1.6), boxSizing: "border-box", padding: "18px 26px",
          borderRadius: 30, background: "rgba(255,255,255,0.97)", boxShadow: "0 16px 34px rgba(34,28,25,0.25)", display: "flex", alignItems: "center", gap: 20 }}>
          <Img src={staticFile("img/uaipertim_logo.png")} style={{ width: 64, height: 64, borderRadius: 16 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontFamily: FONT, fontWeight: W.extraBold, fontSize: 24, color: "#9C8F86", letterSpacing: 0.4 }}>UaiPertim · agora</span>
            <span style={{ fontFamily: FONTE, fontWeight: W.black, fontSize: 36, color: C.tinta, letterSpacing: -0.4, whiteSpace: "nowrap" }}>{L.notificacao}</span>
          </div>
        </div>
      )}
      <Ilustrativo texto={ilustrativo} y={1172} />
    </>
  );
};

// ================================================================ 7 · fecho (os cartões 1 · 2 · 3 acendem um a um)
export const IconeBalcao: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="0 0 100 100"><rect x="10" y="58" width="80" height="12" rx="4" fill="#C98A4B" /><rect x="16" y="70" width="68" height="22" rx="4" fill="#E0A863" />
    <path d="M30 58 C30 40 70 40 70 58 Z" fill={C.coral} /><rect x="46" y="32" width="8" height="10" rx="3" fill={C.coralDark} /><circle cx="78" cy="36" r="10" fill={C.amarelo} />
    <path d="M73 36 L77 40 L84 32" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" /></svg>
);
// a enquete do fecho: só as opções que o cliente escolhe (entrega ou retirada no balcão)
const IconesCartao = [<ScooterIcon key="s" size={170} />, <IconeBalcao key="b" s={170} />];
const Fecho: React.FC<ComoChegaProps & { L: Lamina; f: number; D: number }> = ({ L, layout, f, D }) => {
  const cs = L.cartoes!, per = D / cs.length;
  const env = (k: number) => Math.pow(Math.sin(Math.PI * clamp01((f - k * per) / per)), 2);
  const dedo = 7 * (1 - Math.cos((TAU * 4 * f) / D)) / 2;
  const [antes, depois = ""] = L.cta!.split(/ *👇/);
  const topo = 168 + altTitulo(layout!.titulo) + 36, cw = (LARG - 50) / 2;
  return (
    <>
      <Titulo L={L} wt={layout!.titulo} topo />
      {cs.map((c, k) => {
        const e = env(k);
        return (
          <div key={k} style={{ position: "absolute", left: SAFE.x0 + k * (cw + 50), top: topo, width: cw, height: 380, boxSizing: "border-box", borderRadius: 38, background: mix("#FFFFFF", "#FFF1E8", e),
            border: `5px solid ${mix("#EADBC6", C.coral, e)}`, boxShadow: `0 ${9 + 4 * e}px 0 ${mix("#E2CDB2", C.coralDark, e)}`, transform: `translateY(${-14 * e}px)`,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, padding: "10px 20px" }}>
            <div style={{ height: 190, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${1 + 0.08 * e})` }}>{IconesCartao[k]}</div>
            <div style={{ fontFamily: FONTE, fontWeight: W.black, fontSize: 42, lineHeight: 1.1, color: C.tinta, textAlign: "center", letterSpacing: -0.5, textWrap: "balance" } as React.CSSProperties}>{glue(c)}</div>
          </div>
        );
      })}
      <div style={{ position: "absolute", left: SAFE.x0, width: LARG, top: topo + 430, display: "flex", justifyContent: "center" }}>
        <div style={{ padding: "22px 30px", borderRadius: 999, background: C.coral, boxShadow: `0 9px 0 ${C.coralDark}`, fontFamily: FONTE, fontWeight: W.black, fontSize: 40, color: "#fff", whiteSpace: "nowrap", letterSpacing: -0.6 }}>
          {antes} <span style={{ display: "inline-block", transform: `translateY(${dedo}px)` }}>👇</span>{depois}
        </div>
      </div>
      <PertimFixo altura={230} pose="apontando" expr="sorrindo" style={{ left: 232 - 140 * (230 / 284), top: 1222 - 270 * (230 / 284) }}
        rig={{ respira: onda(f, D, 3), capacete: 0.8 * onda(f, D, 3, -0.7), aceno: -14 + 4 * onda(f, D, 4), piscada: piscadaEm([2.2, 5.4], f / 30) }} />
      <div style={{ position: "absolute", left: 360, width: SAFE.x1 - 360, top: 1130, height: 84, display: "flex", alignItems: "center", justifyContent: "center", gap: 18 }}>
        <Img src={staticFile("pedir-no-uaipertim/logo/logo-selo-transparente.png")} style={{ width: 80, height: 80, objectFit: "contain", filter: "drop-shadow(0 4px 8px rgba(198,58,23,0.22))" }} />
        <span style={{ fontFamily: FONT, fontWeight: W.extraBold, fontSize: 36, color: C.tinta, letterSpacing: -0.4, whiteSpace: "nowrap" }}>
          {L.assinatura!.split(/(pertim)/).map((s, i) => (s === "pertim" ? <span key={i} style={{ color: C.coral }}>{s}</span> : <React.Fragment key={i}>{s}</React.Fragment>))}
        </span>
      </div>
    </>
  );
};

// ================================================================ a composição: uma lâmina por render (prop `lamina`, 0..6)
const BRILHOS: Record<Lamina["tipo"], Array<[number, number]>> = {
  capa: [[170, 300], [915, 300], [180, 1170], [900, 1180]], escolha: [[180, 470], [900, 520]], loja: [[910, 480], [170, 1150]], parceiro: [[915, 470], [170, 1160]],
  balcao: [[915, 470], [170, 560]], acompanha: [[930, 1150], [170, 1180]], fecho: [[920, 1000], [160, 760]],
};
export const ComoChega: React.FC<ComoChegaProps> = (props) => {
  const frame = useCurrentFrame();
  const D = duracaoComoChega(props, props.lamina);
  const f = ((frame % D) + D) % D;
  const L = props.laminas[props.lamina];
  const n = props.laminas.length;
  const P = { ...props, L, f, D };
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {!props.semFundo && <Fundo f={f} D={D} cy={L.tipo === "capa" ? 470 : 760} cor={C.amarelo} seed={`como-chega-${props.lamina}`} pts={[]} />}
      <Brilhos f={f} D={D} pts={BRILHOS[L.tipo]} seed={`cc-b-${props.lamina}`} />
      {L.tipo !== "capa" && <Cabecalho selo={props.selo} n={props.lamina + 1} total={n} />}
      {L.tipo === "capa" && <Capa {...P} />}
      {L.tipo === "escolha" && <Escolha {...P} />}
      {L.tipo === "loja" && <Loja {...P} />}
      {L.tipo === "parceiro" && <Parceiro {...P} />}
      {L.tipo === "balcao" && <Balcao {...P} />}
      {L.tipo === "acompanha" && <Acompanha {...P} />}
      {L.tipo === "fecho" && <Fecho {...P} />}
    </AbsoluteFill>
  );
};
