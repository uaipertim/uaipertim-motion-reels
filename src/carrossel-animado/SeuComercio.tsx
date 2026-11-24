import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { C, FONT, W } from "../config/theme";
import { StarShape } from "../components/Particles";
import { ShopChar, SHOP_RATIO } from "../components/Town";
import { BellGlyph } from "../components/Icons";
import { PaperPlaneIcon, ScooterIcon } from "../components/AppIcons";
import { fitWrap, Wrapped } from "../dicionario/fit";
import { Text, glue } from "../carrossel/CarrosselFacim";
import { piscadaEm } from "../personagem/rig";
import { Brilhos, FONTE, Fundo, PertimFixo, TAU, clamp01, ease, onda, outBack } from "../quiz/QuizMineiro";
import {
  Anel, Cabecalho, Escudo, IconeBalcao, IconeCheck, Ilustrativo, LARG, SAFE, Selo, TIT, Texto, Titulo, Toque, altTitulo, juntaChave, liga, mix, plain,
} from "./ComoChega";

// CARROSSEL ANIMADO #03 "SEU COMÉRCIO NO UAIPERTIM" (carrosseis/animados/03-seu-comercio-no-uaipertim.json), para o LOJISTA do
// Glória, no motor do #02 (scripts/quiz.mjs + scripts/quiz_qa.py com o caminho do JSON; scripts/carrossel_textos_qa.py confere
// os textos por OCR). Cada lâmina é um vídeo 1080 × 1350 (4:5), 30 fps, sem áudio, em LOOP: toda animação é periódica na duração
// da lâmina (D), então o quadro D é igual ao quadro 0. Lâmina 1 = capa da grade: o quadro 0 já é a capa completa.
//   1 capa         a lojinha com toldo (olhinhos) e o Pertim apontando pra ela, olhando pra câmera; "Seu *comércio* no UaiPertim"
//   2 vitrine      LojistaCardapio.png num notebook; os anéis passam pelo cardápio, pelas fotos e pelos preços (e os chips acendem)
//   3 pedido       os balões de pergunta somem; um pedido novo chega no painel (Lojista.png), com o aviso e o toque em "Aceitar"
//   4 entrega      equipe da loja · entregador parceiro · retirada no balcão: os três cartões acendem um a um
//   5 pagamento    pelo app (Pix, cartão) ou na entrega (dinheiro, Pix, cartão); a comissão de 5% e a nota das taxas
//   6 mensalidade  o contador 0 → 3 meses; "Depois, R$ 49,90/mês"; o Pão de Queijo Points sem custo pra loja
//   7 fecho        o CTA do Direct, o e-mail, a logo redonda sem fundo, "Tudo pertim de você" e o Pertim acenando
// Todo o conteúdo fica em x 135–945 e y 60–1290. `semFundo` tira o fundo para o QA medir o conteúdo.

type Opcao = { titulo: string; texto: string };
type Grupo = { titulo: string; formas: string[] };
type Lamina = {
  tipo: "capa" | "vitrine" | "pedido" | "entrega" | "pagamento" | "mensalidade" | "fecho"; rotulo: string; segundos: number; estatico?: number;
  titulo: string | string[]; quebra?: string[]; rodape?: string; texto?: string; itens?: string[]; baloes?: string[]; aviso?: string; opcoes?: Opcao[];
  grupos?: Grupo[]; selo?: string; nota?: string; depois?: string; destaque?: string; cta?: string; email?: string; assinatura?: string;
};
export type SeuComercioDados = { numero: number; formato: [number, number]; selo: string; ilustrativo: string; valores: { meses_gratis: number; mensalidade: string; comissao: string }; laminas: Lamina[] };
export type SeuComercioProps = SeuComercioDados & { lamina: number; layout?: { titulo: Wrapped }; semFundo?: boolean };

export const SEU_COMERCIO = { width: 1080, height: 1350, fps: 30 };
export const duracaoSeuComercio = (d: SeuComercioDados, i: number) => Math.round(d.laminas[i].segundos * SEU_COMERCIO.fps);
const CAPA_T = { cy: 890, maxH: 330, sizes: [150, 140, 130, 120, 110, 100, 92, 84] };

// medido em calculateMetadata (fontes carregadas)
export const medeSeuComercio = (d: SeuComercioDados, i: number): { titulo: Wrapped } => {
  const L = d.laminas[i];
  if (L.tipo === "capa") {
    const lines = (L.titulo as string[]).map((l) => glue(plain(l)));
    const size = CAPA_T.sizes.find((z) => lines.length * z * 1.12 <= CAPA_T.maxH && lines.every((l) => fitWrap(l, W.black, LARG, [z], 1).ok)) ?? 84;
    return { titulo: { size, lines, ok: true } };
  }
  if (L.quebra?.length) {
    const lines = L.quebra.map((l) => glue(plain(juntaChave(l))));
    if (lines.join(" ") !== glue(plain(juntaChave(L.titulo as string)))) throw new Error(`lâmina ${i + 1}: a quebra não bate com o título`);
    const size = [76, 70, 64, 60, 56].find((z) => lines.every((l) => fitWrap(l, W.black, TIT.w, [z], 1).ok)) ?? 56;
    return { titulo: { size, lines, ok: true } };
  }
  return { titulo: fitWrap(glue(plain(juntaChave(L.titulo as string))), W.black, TIT.w, [76, 70, 64, 60, 56], 3) };
};

type P = SeuComercioProps & { L: Lamina; f: number; D: number };
type Cx = [number, number, number, number];
const t_ = (f: number) => f / 30;
const ent = (t: number, a: number, r = 0.35) => ease(clamp01((t - a) / r));
const IconeLoja: React.FC<{ s: number; cor?: string }> = ({ s, cor = "#fff" }) => (
  <svg width={s} height={s} viewBox="0 0 100 100">
    <rect x="18" y="44" width="64" height="44" rx="4" fill={cor} />
    {Array.from({ length: 5 }).map((_, i) => <path key={i} d={`M${14 + i * 14.4} 30 H${28.4 + i * 14.4} V44 A7.2 7.2 0 0 1 ${14 + i * 14.4} 44 Z`} fill={i % 2 ? cor : C.amarelo} />)}
    <rect x="12" y="24" width="76" height="8" rx="4" fill={cor} />
    <rect x="40" y="58" width="20" height="30" rx="3" fill={C.coral} />
  </svg>
);

// ---------------------------------------------------------------- o notebook com uma tela do painel (recorte em px de 1x; o PNG é 2x)
const Notebook: React.FC<{ x: number; y: number; w: number; tela: string; recorte: Cx; children?: React.ReactNode }> = ({ x, y, w, tela, recorte, children }) => {
  const bz = 16, tw = w - 2 * bz, K = tw / (recorte[2] - recorte[0]), th = (recorte[3] - recorte[1]) * K;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: th + 2 * bz + 34 }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: w, height: th + 2 * bz, borderRadius: 26, background: C.tinta, boxShadow: "inset 0 0 0 4px #4A3E38, 0 24px 44px rgba(34,28,25,0.26)" }} />
      <div style={{ position: "absolute", left: bz, top: bz, width: tw, height: th, borderRadius: 10, overflow: "hidden", background: "#F8F6F3" }}>
        <div style={{ position: "absolute", left: -recorte[0] * K, top: -recorte[1] * K, width: 1280, height: 880, transform: `scale(${K})`, transformOrigin: "0 0" }}>
          <Img src={staticFile(`telas-app/painel/${tela}.png`)} style={{ position: "absolute", left: 0, top: 0, width: 1280, height: 880, maxWidth: "none" }} />
          {children}
        </div>
      </div>
      <div style={{ position: "absolute", left: w / 2 - 6, top: 5, width: 12, height: 6, borderRadius: 3, background: "#0D0B0A" }} />
      {/* a base com o teclado */}
      <div style={{ position: "absolute", left: -34, top: th + 2 * bz, width: w + 68, height: 30, borderRadius: "4px 4px 22px 22px", background: "linear-gradient(180deg, #CFC3B5 0%, #B5A898 100%)",
        boxShadow: "0 12px 22px rgba(34,28,25,0.22)" }} />
      <div style={{ position: "absolute", left: w / 2 - 70, top: th + 2 * bz, width: 140, height: 9, borderRadius: "0 0 9px 9px", background: "#9C8E7E" }} />
    </div>
  );
};

// ================================================================ 1 · capa (quadro 0 = a capa da grade)
const Capa: React.FC<P> = ({ selo, L, layout, f, D }) => {
  const t = layout!.titulo, th = t.lines.length * t.size * 1.12;
  const base = 700, lw = 330, pa = 380;
  return (
    <>
      <div style={{ position: "absolute", top: 120 - 60, left: 0, right: 0, height: 120, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Selo texto={selo} s={40} icone={<IconeLoja s={54} cor={C.amarelo} />} />
      </div>
      <div style={{ position: "absolute", left: 540 - 380, top: 470 - 380, width: 760, height: 760, borderRadius: "50%", background: `radial-gradient(circle, ${C.amareloLight}66 0%, ${C.amareloLight}00 68%)` }} />
      <div style={{ position: "absolute", left: 170, width: 740, top: base - 9, height: 18, borderRadius: 9, background: C.cremeDeep }} />
      <div style={{ position: "absolute", left: 905 - lw, top: base - lw * SHOP_RATIO }}>
        <ShopChar kind="loja" width={lw} mood="happy" lit={0.8 + 0.2 * onda(f, D, 2)} awning={0.35 + 0.15 * onda(f, D, 3)} look={[-0.6, 0.1]} sparkle={0.4 + 0.3 * onda(f, D, 2)}
          blink={piscadaEm([1.3, 4.1], t_(f))} signSwing={3 * onda(f, D, 2)} />
      </div>
      <PertimFixo altura={pa} pose="apontando" expr="sorrindo" style={{ left: 300 - 140 * (pa / 284), top: base + 4 - 270 * (pa / 284) }}
        rig={{ respira: onda(f, D, 3), capacete: 0.8 * onda(f, D, 3, -0.7), aceno: -10 + 5 * onda(f, D, 4), piscada: piscadaEm([2.2, 4.9], t_(f)) }} />
      <div style={{ position: "absolute", top: CAPA_T.cy - th / 2, left: SAFE.x0, width: LARG }}>
        <Text source={glue((L.titulo as string[]).join(" "))} wrapped={t} weight={W.black} />
      </div>
      <div style={{ position: "absolute", top: CAPA_T.cy + th / 2 + 46, left: SAFE.x0, width: LARG, textAlign: "center", fontFamily: FONTE, fontWeight: W.medium, fontSize: 44, color: C.tinta, letterSpacing: -0.3, whiteSpace: "nowrap" }}>
        {L.rodape!.replace(/\s*→$/, "")} <span style={{ display: "inline-block", transform: `translateX(${10 * (1 - Math.cos((TAU * 4 * f) / D)) / 2}px)` }}>→</span>
      </div>
    </>
  );
};

// ================================================================ 2 · vitrine (LojistaCardapio: cardápio, fotos e preços)
const REC_CARD: Cx = [240, 20, 1260, 560];
const ANEIS_VITRINE: Cx[][] = [
  [[250, 153, 741, 462]],                                  // o cardápio (a lista de produtos)
  [[262, 160, 322, 454], [775, 205, 963, 285]],            // as fotos (miniaturas e "Trocar foto")
  [[598, 168, 680, 446], [776, 488, 1002, 538]],           // os preços (a coluna e o campo Preço)
];
const Chip: React.FC<{ e: number; txt: string }> = ({ e, txt }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 26px 12px 14px", borderRadius: 999, background: mix("#FFFFFF", "#EAF6EA", e),
    border: `5px solid ${mix("#EADBC6", C.verde, e)}`, boxShadow: `0 7px 0 ${mix("#E2CDB2", C.verdeDark, e)}`, transform: `scale(${1 + 0.06 * e})`,
    fontFamily: FONT, fontWeight: W.black, fontSize: 36, color: C.tinta, whiteSpace: "nowrap" }}>
    <div style={{ width: 46, height: 46, borderRadius: "50%", background: mix("#E9DED0", C.verde, e), display: "flex", alignItems: "center", justifyContent: "center" }}><IconeCheck s={34} cor="#fff" /></div>
    {txt}
  </div>
);
const Vitrine: React.FC<P> = ({ L, layout, f, D, ilustrativo }) => {
  const t = t_(f), dur = D / 30;
  const T0 = 0.7, PASSO = 1.3;
  const e = (k: number) => liga(t, T0 + PASSO * k, k < 2 ? T0 + PASSO * (k + 1) + 0.15 : dur - 1.0, 0.3);
  const chip = (k: number) => liga(t, T0 + PASSO * k + 0.15, dur - 0.7, 0.3);
  const yt = 168 + altTitulo(layout!.titulo) + 18;
  return (
    <>
      <Titulo L={L} wt={layout!.titulo} topo />
      <Texto y={yt} size={34}>{glue(L.texto!)}</Texto>
      <Notebook x={170} y={548} w={740} tela="LojistaCardapio" recorte={REC_CARD}>
        {ANEIS_VITRINE.map((cxs, k) => cxs.map((cx, j) => <Anel key={`${k}-${j}`} cx={cx} e={e(k)} raio={18} esp={7} />))}
      </Notebook>
      <div style={{ position: "absolute", left: SAFE.x0, width: LARG, top: 1060, display: "flex", justifyContent: "center", gap: 14 }}>
        {L.itens!.map((x, k) => <Chip key={k} e={chip(k)} txt={x} />)}
      </div>
      <Ilustrativo texto={ilustrativo} y={1196} />
    </>
  );
};

// ================================================================ 3 · pedido no painel (Lojista.png: o pedido novo chega)
const REC_PED: Cx = [236, 190, 924, 612];
const CARD_NOVO: Cx = [248, 226, 574, 410];
const Balao: React.FC<{ txt: string; lado: "e" | "d" }> = ({ txt, lado }) => (
  <div style={{ position: "relative", padding: "16px 26px", borderRadius: 30, background: "#fff", border: "4px solid #EADBC6", boxShadow: "0 8px 18px rgba(34,28,25,0.14)",
    fontFamily: FONTE, fontWeight: W.extraBold, fontSize: 32, color: "#6E625A", whiteSpace: "nowrap" }}>
    {txt}
    <svg width={34} height={24} viewBox="0 0 34 24" style={{ position: "absolute", top: "100%", marginTop: -4, [lado === "e" ? "left" : "right"]: 30 } as React.CSSProperties}>
      <path d={lado === "e" ? "M2 0 H32 L6 22 Z" : "M2 0 H32 L28 22 Z"} fill="#fff" stroke="#EADBC6" strokeWidth="4" />
      <rect x="0" y="0" width="34" height="5" fill="#fff" />
    </svg>
  </div>
);
const Pedido: React.FC<P> = ({ L, layout, f, D, ilustrativo }) => {
  const t = t_(f), dur = D / 30;
  const T_CHEGA = 2.0, T_TOQUE = 4.3, FIM = dur - 0.8;
  // os balões ficam no começo e somem (pop) antes do pedido chegar; voltam suaves no fim (loop)
  const bal = (k: number) => {
    const sai = clamp01((t - (1.0 + 0.18 * k)) / 0.25), volta = ease(clamp01((t - (FIM + 0.1 * k)) / 0.45));
    return Math.max(volta, (1 - sai) * (sai > 0 ? 1 + 0.25 * Math.sin(Math.PI * sai) : 1));
  };
  const chega = ease(clamp01((t - T_CHEGA) / 0.45)) * (1 - ease(clamp01((t - FIM) / 0.45)));
  const anel = liga(t, T_CHEGA + 0.3, FIM, 0.3);
  const aviso = outBack(clamp01((t - (T_CHEGA + 0.1)) / 0.35), 2) * (1 - ease(clamp01((t - (T_TOQUE - 0.2)) / 0.3)));
  const yt = 168 + altTitulo(layout!.titulo) + 18;
  const BAL: Array<{ x: number; y: number; lado: "e" | "d" }> = [{ x: 150, y: 470, lado: "e" }, { x: 555, y: 470, lado: "d" }, { x: 330, y: 560, lado: "e" }];
  return (
    <>
      <Titulo L={L} wt={layout!.titulo} topo />
      <Texto y={yt} size={34}>{glue(L.texto!)}</Texto>
      <Notebook x={180} y={676} w={720} tela="Lojista" recorte={REC_PED}>
        {/* o lugar do pedido novo, vazio até ele chegar (o fundo do painel) */}
        <div style={{ position: "absolute", left: CARD_NOVO[0], top: CARD_NOVO[1], width: CARD_NOVO[2] - CARD_NOVO[0], height: CARD_NOVO[3] - CARD_NOVO[1], background: "#F8F6F3" }} />
        {chega > 0.001 && (
          <div style={{ position: "absolute", left: CARD_NOVO[0], top: CARD_NOVO[1] - 90 * (1 - chega), width: CARD_NOVO[2] - CARD_NOVO[0], height: CARD_NOVO[3] - CARD_NOVO[1], overflow: "hidden", opacity: chega }}>
            <Img src={staticFile("telas-app/painel/Lojista.png")} style={{ position: "absolute", left: -CARD_NOVO[0], top: -CARD_NOVO[1], width: 1280, height: 880, maxWidth: "none" }} />
          </div>
        )}
        <Anel cx={CARD_NOVO} e={anel} raio={22} esp={7} />
        <Toque u={(t - T_TOQUE) / 0.6} x={485} y={372} r={44} />
      </Notebook>
      {L.baloes!.map((b, k) => {
        const s = bal(k);
        return s > 0.01 ? <div key={k} style={{ position: "absolute", left: BAL[k].x, top: BAL[k].y, transform: `scale(${s})`, transformOrigin: "50% 100%", opacity: Math.min(1, s * 1.5) }}><Balao txt={b} lado={BAL[k].lado} /></div> : null;
      })}
      {aviso > 0.01 && (
        <div style={{ position: "absolute", left: SAFE.x0, width: LARG, top: 560, display: "flex", justifyContent: "center", transform: `scale(${aviso})`, opacity: Math.min(1, aviso * 2) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 34px 16px 20px", borderRadius: 999, background: C.coral, boxShadow: `0 8px 0 ${C.coralDark}`,
            fontFamily: FONT, fontWeight: W.black, fontSize: 40, color: "#fff", whiteSpace: "nowrap" }}>
            <div style={{ width: 62, height: 62, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BellGlyph size={44} swing={12 * Math.sin(t * 18)} />
            </div>
            {L.aviso}
          </div>
        </div>
      )}
      <Ilustrativo texto={ilustrativo} y={1196} />
    </>
  );
};

// ================================================================ 4 · entrega do seu jeito (três cartões acendem um a um)
const IconeParceiro: React.FC<{ s: number }> = ({ s }) => (
  <div style={{ position: "relative", width: s, height: s }}>
    <div style={{ position: "absolute", left: 0, top: s * 0.08 }}><ScooterIcon size={s * 0.88} /></div>
    <div style={{ position: "absolute", right: -s * 0.06, top: -s * 0.04 }}><Escudo s={s * 0.46} /></div>
  </div>
);
const IconeEquipe: React.FC<{ s: number }> = ({ s }) => (
  <div style={{ position: "relative", width: s, height: s }}>
    <div style={{ position: "absolute", left: 0, top: s * 0.1 }}><ScooterIcon size={s * 0.88} /></div>
    <div style={{ position: "absolute", right: -s * 0.08, top: -s * 0.06, width: s * 0.5, height: s * 0.5, borderRadius: "50%", background: C.amarelo, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <IconeLoja s={s * 0.4} />
    </div>
  </div>
);
const ICONES_ENTREGA = [(s: number) => <IconeEquipe s={s} />, (s: number) => <IconeParceiro s={s} />, (s: number) => <IconeBalcao s={s} />];
const Entrega: React.FC<P> = ({ L, layout, f, D }) => {
  const t = t_(f), dur = D / 30;
  const yt = 168 + altTitulo(layout!.titulo) + 14;
  const top = yt + 84, h = 258, gap = 34;
  return (
    <>
      <Titulo L={L} wt={layout!.titulo} topo />
      <Texto y={yt} size={38}>{L.texto}</Texto>
      {L.opcoes!.map((o, k) => {
        const e = liga(t, 0.6 + 1.1 * k, dur - 0.9, 0.3);
        const pulo = Math.sin(Math.PI * clamp01((t - (0.6 + 1.1 * k)) / 0.35));
        return (
          <div key={k} style={{ position: "absolute", left: SAFE.x0, width: LARG, top: top + k * (h + gap) - 10 * pulo, height: h, boxSizing: "border-box", borderRadius: 38,
            background: mix("#FFFFFF", "#FFF1E8", e), border: `5px solid ${mix("#EADBC6", C.coral, e)}`, boxShadow: `0 ${9 + 3 * e}px 0 ${mix("#E2CDB2", C.coralDark, e)}`,
            display: "flex", alignItems: "center", gap: 28, padding: "0 30px 0 26px" }}>
            <div style={{ flex: "none", width: 180, height: 180, borderRadius: "50%", background: mix("#F3EADF", "#FFE2D4", e), display: "flex", alignItems: "center", justifyContent: "center",
              transform: `scale(${1 + 0.06 * e})` }}>
              <div style={{ opacity: 0.5 + 0.5 * e, filter: e < 0.5 ? "grayscale(0.7)" : undefined }}>{ICONES_ENTREGA[k](132)}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: FONT, fontWeight: W.black, fontSize: 44, lineHeight: 1.08, color: mix("#8C7F75", C.tinta, e), letterSpacing: -0.8, textWrap: "balance" } as React.CSSProperties}>{o.titulo}</div>
              <div style={{ fontFamily: FONTE, fontWeight: W.medium, fontSize: 34, lineHeight: 1.2, color: C.tinta, opacity: 0.55 + 0.35 * e, marginTop: 8 }}>{glue(o.texto)}</div>
            </div>
            <div style={{ flex: "none", width: 60, height: 60, borderRadius: "50%", background: mix("#E9DED0", C.verde, e), display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${0.8 + 0.25 * e})` }}>
              <IconeCheck s={42} cor="#fff" />
            </div>
          </div>
        );
      })}
    </>
  );
};

// ================================================================ 5 · pagamento (pelo app ou na entrega; a comissão e as taxas)
const IconePix: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="14" rx="3.5" transform="rotate(45 12 12)" fill="#32BCAD" /><rect x="9" y="9" width="6" height="6" rx="1.4" transform="rotate(45 12 12)" fill="#fff" /></svg>
);
const IconeCartao: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="3" fill="#3E7FB8" /><rect x="2" y="8.5" width="20" height="2.8" fill="#24547F" /><rect x="5" y="14" width="6" height="2" rx="1" fill="#fff" /></svg>
);
const IconeDinheiro: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2.5" fill={C.verde} /><circle cx="12" cy="12" r="3.1" fill="none" stroke="#fff" strokeWidth="1.8" /><circle cx="6" cy="12" r="1" fill="#fff" /><circle cx="18" cy="12" r="1" fill="#fff" /></svg>
);
const IconeForma = (n: string, s: number) => (n === "Pix" ? <IconePix s={s} /> : n === "Cartão" ? <IconeCartao s={s} /> : <IconeDinheiro s={s} />);
const IconeCelular: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="0 0 24 24"><rect x="6" y="2" width="12" height="20" rx="3" fill={C.tinta} /><rect x="7.5" y="4.5" width="9" height="14" rx="1.2" fill={C.coral} />
    <path d="M12 15.5 C12 15.5 9.6 13 9.6 11.4 A2.4 2.4 0 0 1 14.4 11.4 C14.4 13 12 15.5 12 15.5 Z" fill="#fff" /></svg>
);
const Pagamento: React.FC<P> = ({ L, layout, f, D }) => {
  const t = t_(f), dur = D / 30;
  const gs = L.grupos!, cw = (LARG - 30) / 2;
  const top = 168 + altTitulo(layout!.titulo) + 36;
  const selo = liga(t, 3.2, dur - 0.7, 0.35), pulso = 1 + 0.03 * Math.max(0, onda(f, D, 3));
  let k0 = 0;
  return (
    <>
      <Titulo L={L} wt={layout!.titulo} topo />
      {gs.map((g, gi) => {
        const eg = liga(t, 0.5 + 1.3 * gi, dur - 0.9, 0.3);
        const ks = k0;
        k0 += g.formas.length;
        return (
          <div key={gi} style={{ position: "absolute", left: SAFE.x0 + gi * (cw + 30), top, width: cw, height: 560, boxSizing: "border-box", borderRadius: 38, background: "#fff",
            border: `5px solid ${mix("#EADBC6", C.coral, eg)}`, boxShadow: `0 9px 0 ${mix("#E2CDB2", C.coralDark, eg)}`, padding: "30px 24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", gap: 18 }}>
            <div style={{ flex: "none", width: 116, height: 116, borderRadius: "50%", background: mix("#F3EADF", "#FFE2D4", eg), display: "flex", alignItems: "center", justifyContent: "center" }}>
              {gi === 0 ? <IconeCelular s={78} /> : <ScooterIcon size={84} />}
            </div>
            <div style={{ fontFamily: FONT, fontWeight: W.black, fontSize: 46, lineHeight: 1.1, color: C.tinta, letterSpacing: -0.8, whiteSpace: "nowrap" }}>{g.titulo}</div>
            {g.formas.map((x, j) => {
              const e = liga(t, 0.8 + 1.3 * gi + 0.3 * j, dur - 0.9, 0.25);
              return (
                <div key={j} style={{ width: "100%", boxSizing: "border-box", display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderRadius: 24, background: mix("#F7F1E9", "#EAF6EA", e),
                  border: `4px solid ${mix("#EFE5D8", C.verde, e)}`, fontFamily: FONT, fontWeight: W.black, fontSize: 38, color: C.tinta, transform: `scale(${1 + 0.03 * e})` }} data-k={ks + j}>
                  {IconeForma(x, 48)}{x}
                </div>
              );
            })}
          </div>
        );
      })}
      <div style={{ position: "absolute", left: SAFE.x0, width: LARG, top: top + 610, display: "flex", justifyContent: "center", transform: `scale(${(0.92 + 0.08 * selo) * pulso})`, opacity: 0.35 + 0.65 * selo }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "16px 30px 16px 18px", borderRadius: 30, background: C.amarelo, boxShadow: `0 8px 0 ${C.amareloDark}`, maxWidth: LARG - 70, boxSizing: "border-box" }}>
          <div style={{ flex: "none", width: 72, height: 72, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: FONT, fontWeight: W.black, fontSize: 32, color: C.coral, letterSpacing: -1 }}>%</div>
          <div style={{ fontFamily: FONTE, fontWeight: W.black, fontSize: 34, lineHeight: 1.15, color: C.tinta, letterSpacing: -0.4, textWrap: "balance" } as React.CSSProperties}>{glue(L.selo!)}</div>
        </div>
      </div>
      <Texto y={top + 760} size={34} x={SAFE.x0} w={LARG}><div style={{ textAlign: "center", opacity: 0.8 }}>{glue(L.nota!)}</div></Texto>
    </>
  );
};

// ================================================================ 6 · mensalidade (o contador 0 → 3 meses; o Pão de Queijo Points sem custo)
const Calendario: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="0 0 100 100">
    <rect x="10" y="18" width="80" height="72" rx="12" fill="#fff" stroke={C.coral} strokeWidth="6" />
    <rect x="10" y="18" width="80" height="22" rx="10" fill={C.coral} />
    <rect x="28" y="8" width="8" height="20" rx="4" fill={C.coralDark} /><rect x="64" y="8" width="8" height="20" rx="4" fill={C.coralDark} />
    {[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => <rect key={`${r}${c}`} x={20 + c * 17} y={48 + r * 13} width="10" height="8" rx="2" fill={C.cremeDeep} />))}
  </svg>
);
const MoedaPdq: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="-50 -50 100 100">
    <circle r="48" fill={C.amareloDark} /><circle r="44" cy="-3" fill={C.amarelo} /><circle r="32" cy="-3" fill="none" stroke="#FFE08A" strokeWidth="5" />
    <path d="M-17 4 C-19 -11 -9 -18 0 -18 C9 -18 19 -11 17 4 C16 12 9 15 0 15 C-9 15 -16 12 -17 4 Z" fill={C.amareloDark} transform="translate(0 -3)" />
    <path d="M-17 1 C-19 -14 -9 -21 0 -21 C9 -21 19 -14 17 1 C16 9 9 12 0 12 C-9 12 -16 9 -17 1 Z" fill="#FFE08A" transform="translate(0 -3)" />
  </svg>
);
const Mensalidade: React.FC<P> = ({ L, layout, f, D, valores }) => {
  const t = t_(f), dur = D / 30;
  const top = 168 + altTitulo(layout!.titulo) + 30;
  // o contador: 0 → 3 entre 0,5 e 1,7 s; o número some suave no fim e o quadro 0 começa no 0 (loop)
  const cont = clamp01((t - 0.5) / 1.2);
  const n = Math.min(valores.meses_gratis, Math.floor(cont * (valores.meses_gratis + 0.999)));
  const pulo = n > 0 ? Math.sin(Math.PI * clamp01(((cont * (valores.meses_gratis + 0.999)) % 1) / 0.6)) * (cont < 1 ? 1 : 0) : 0;
  const some = 1 - ease(clamp01((t - (dur - 0.6)) / 0.45));
  const vis = some * ease(clamp01(t / 0.45));
  const dep = liga(t, 2.0, dur - 0.7, 0.35), dest = liga(t, 3.0, dur - 0.7, 0.35);
  const brilho = clamp01((t - 5.5) / 0.9);
  return (
    <>
      <Titulo L={L} wt={layout!.titulo} topo />
      <div style={{ position: "absolute", left: SAFE.x0, width: LARG, top, height: 400, boxSizing: "border-box", borderRadius: 40, background: "#fff", border: "5px solid #EADBC6", boxShadow: "0 9px 0 #E2CDB2",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 34 }}>
        <div style={{ transform: `rotate(${-6 + 3 * onda(f, D, 2)}deg)` }}><Calendario s={170} /></div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
          <span style={{ opacity: vis, fontFamily: FONT, fontWeight: W.black, fontSize: 260, lineHeight: 1, color: C.coral, letterSpacing: -8, display: "inline-block", transform: `scale(${1 + 0.12 * pulo})`, textShadow: `0 10px 0 ${C.amarelo}` }}>{n}</span>
          <span style={{ fontFamily: FONT, fontWeight: W.black, fontSize: 84, lineHeight: 1, color: C.tinta, letterSpacing: -2 }}>meses</span>
        </div>
      </div>
      <Texto y={top + 432} size={38} x={SAFE.x0} w={LARG}><div style={{ textAlign: "center" }}>{glue(L.texto!)}</div></Texto>
      <div style={{ position: "absolute", left: SAFE.x0, width: LARG, top: top + 520, display: "flex", justifyContent: "center", opacity: 0.35 + 0.65 * dep, transform: `scale(${0.94 + 0.06 * dep})` }}>
        <div style={{ padding: "14px 34px", borderRadius: 999, background: C.tinta, fontFamily: FONT, fontWeight: W.black, fontSize: 46, color: "#fff", whiteSpace: "nowrap", letterSpacing: -0.5, wordSpacing: 4 }}>{L.depois}</div>
      </div>
      <div style={{ position: "absolute", left: SAFE.x0, width: LARG, top: top + 670, boxSizing: "border-box", borderRadius: 34, background: "#EAF6EA", border: `5px solid ${C.verde}`,
        boxShadow: `0 8px 0 ${C.verdeDark}`, display: "flex", alignItems: "center", gap: 22, padding: "22px 30px 22px 22px", overflow: "hidden", opacity: 0.35 + 0.65 * dest, transform: `scale(${0.96 + 0.04 * dest})` }}>
        <div style={{ flex: "none", transform: `rotate(${10 * onda(f, D, 2)}deg)` }}><MoedaPdq s={120} /></div>
        <div style={{ fontFamily: FONTE, fontWeight: W.extraBold, fontSize: 38, lineHeight: 1.2, color: "#1F5A2B", textWrap: "balance" } as React.CSSProperties}>{glue(L.destaque!)}</div>
        {brilho > 0 && brilho < 1 && <div style={{ position: "absolute", top: -20, bottom: -20, left: -120 + 1060 * brilho, width: 70, background: "rgba(255,255,255,0.55)", transform: "rotate(18deg)" }} />}
      </div>
    </>
  );
};

// ================================================================ 7 · fecho (CTA do Direct, e-mail, logo, Pertim acenando)
const Fecho: React.FC<P> = ({ L, layout, f, D }) => {
  const top = 168 + altTitulo(layout!.titulo);
  const base = top + 500, lw = 340, pa = 450;
  const [antes] = L.cta!.split(/ *📩/);
  const voa = 6 * (1 - Math.cos((TAU * 3 * f) / D)) / 2;
  return (
    <>
      <Titulo L={L} wt={layout!.titulo} topo />
      <div style={{ position: "absolute", left: 540 - 380, top: base - 260 - 380, width: 760, height: 760, borderRadius: "50%", background: `radial-gradient(circle, ${C.amareloLight}55 0%, ${C.amareloLight}00 68%)` }} />
      <div style={{ position: "absolute", left: 170, width: 740, top: base - 9, height: 18, borderRadius: 9, background: C.cremeDeep }} />
      <div style={{ position: "absolute", left: 905 - lw, top: base - lw * SHOP_RATIO }}>
        <ShopChar kind="loja" width={lw} mood="happy" lit={0.8 + 0.2 * onda(f, D, 2)} awning={0.4 + 0.15 * onda(f, D, 3)} look={[-0.6, 0.1]} sparkle={0.5} bulbs={1} bulbPhase={(TAU * 2 * f) / D * 6}
          blink={piscadaEm([1.8, 5.0], t_(f))} />
      </div>
      <PertimFixo altura={pa} pose="acenando" expr="sorrindo" style={{ left: 330 - 140 * (pa / 284), top: base + 4 - 270 * (pa / 284) }}
        rig={{ respira: onda(f, D, 3), capacete: 0.8 * onda(f, D, 3, -0.7), aceno: 14 * onda(f, D, 7), piscada: piscadaEm([2.5, 5.6], t_(f)) }} />
      <div style={{ position: "absolute", left: SAFE.x0, width: LARG, top: base + 50, display: "flex", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 32px 18px 20px", borderRadius: 999, background: C.coral, boxShadow: `0 9px 0 ${C.coralDark}`,
          fontFamily: FONTE, fontWeight: W.black, fontSize: 44, color: "#fff", whiteSpace: "nowrap", letterSpacing: -0.6, wordSpacing: 4 }}>
          <div style={{ width: 70, height: 70, borderRadius: "50%", background: "rgba(255,255,255,0.22)", border: "4px solid rgba(255,255,255,0.75)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <PaperPlaneIcon size={42} style={{ transform: `translate(${voa}px, ${-voa}px)` }} />
          </div>
          {antes} <span style={{ display: "inline-block", transform: `translateY(${-voa * 0.6}px)` }}>📩</span>
        </div>
      </div>
      <div style={{ position: "absolute", left: SAFE.x0, width: LARG, top: base + 190, textAlign: "center", fontFamily: FONTE, fontWeight: W.extraBold, fontSize: 40, color: C.tinta, letterSpacing: -0.3, whiteSpace: "nowrap" }}>
        {L.email}
      </div>
      <div style={{ position: "absolute", left: SAFE.x0, width: LARG, top: base + 272, height: 90, display: "flex", alignItems: "center", justifyContent: "center", gap: 18 }}>
        <Img src={staticFile("pedir-no-uaipertim/logo/logo-selo-transparente.png")} style={{ width: 86, height: 86, objectFit: "contain", filter: "drop-shadow(0 4px 8px rgba(198,58,23,0.22))" }} />
        <span style={{ fontFamily: FONT, fontWeight: W.extraBold, fontSize: 38, color: C.tinta, letterSpacing: -0.4, whiteSpace: "nowrap" }}>
          {L.assinatura!.split(/(pertim)/).map((s, i) => (s === "pertim" ? <span key={i} style={{ color: C.coral }}>{s}</span> : <React.Fragment key={i}>{s}</React.Fragment>))}
        </span>
      </div>
      {[0, 1, 2].map((i) => {
        const u = ((f / D) * 2 + i / 3) % 1;
        return <div key={i} style={{ position: "absolute", left: 700 + 70 * i, top: base - 420 - 60 * u, opacity: Math.sin(Math.PI * u) * 0.9 }}><StarShape size={30} color={i === 1 ? C.coral : C.amarelo} /></div>;
      })}
    </>
  );
};

// ================================================================ a composição: uma lâmina por render (prop `lamina`, 0..6)
const BRILHOS: Record<Lamina["tipo"], Array<[number, number]>> = {
  capa: [[170, 300], [915, 300], [180, 1170], [900, 1180]], vitrine: [[915, 470], [170, 1150]], pedido: [[915, 640], [165, 1150]], entrega: [[920, 380], [170, 1220]],
  pagamento: [[915, 380], [170, 1230]], mensalidade: [[920, 380], [165, 1230]], fecho: [[925, 420], [160, 640]],
};
export const SeuComercio: React.FC<SeuComercioProps> = (props) => {
  const frame = useCurrentFrame();
  const D = duracaoSeuComercio(props, props.lamina);
  const f = ((frame % D) + D) % D;
  const L = props.laminas[props.lamina];
  const n = props.laminas.length;
  const Pp = { ...props, L, f, D };
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {!props.semFundo && <Fundo f={f} D={D} cy={L.tipo === "capa" ? 470 : 760} cor={C.amarelo} seed={`seu-comercio-${props.lamina}`} pts={[]} />}
      <Brilhos f={f} D={D} pts={BRILHOS[L.tipo]} seed={`sc-b-${props.lamina}`} />
      {L.tipo !== "capa" && <Cabecalho selo={props.selo} n={props.lamina + 1} total={n} icone={<IconeLoja s={38} cor={C.amarelo} />} />}
      {L.tipo === "capa" && <Capa {...Pp} />}
      {L.tipo === "vitrine" && <Vitrine {...Pp} />}
      {L.tipo === "pedido" && <Pedido {...Pp} />}
      {L.tipo === "entrega" && <Entrega {...Pp} />}
      {L.tipo === "pagamento" && <Pagamento {...Pp} />}
      {L.tipo === "mensalidade" && <Mensalidade {...Pp} />}
      {L.tipo === "fecho" && <Fecho {...Pp} />}
    </AbsoluteFill>
  );
};
