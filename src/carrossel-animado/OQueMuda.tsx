import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { C, FONT, W } from "../config/theme";
import { StarShape } from "../components/Particles";
import { Tree } from "../components/Scenery";
import { PaperPlaneIcon, ScooterIcon } from "../components/AppIcons";
import { fitWrap, Wrapped } from "../dicionario/fit";
import { Text, glue } from "../carrossel/CarrosselFacim";
import { piscadaEm } from "../personagem/rig";
import { Brilhos, FONTE, Fundo, PertimFixo, TAU, clamp01, ease, onda } from "../quiz/QuizMineiro";
import { Bike, Carro, Igrejinha, IconeLoja, IconeNota, IconeOlho, IconePin } from "../seja-entregador/Ilustracoes";
import { Anel, Cabecalho, IconeBalcao, IconeCheck, Ilustrativo, LARG, SAFE, Selo, TIT, Texto, Titulo, altTitulo, juntaChave, liga, mix, plain } from "./ComoChega";

// CARROSSEL ANIMADO #04 "O QUE MUDA NO GLÓRIA" (carrosseis/animados/04-o-que-muda-no-gloria.json), no motor do #02/#03
// (scripts/quiz.mjs + scripts/quiz_qa.py + scripts/carrossel_textos_qa.py com o caminho do JSON). Cada lâmina é um vídeo
// 1080 × 1350 (4:5), 30 fps, sem áudio, em LOOP: toda animação é periódica na duração da lâmina (D), então o quadro D é igual
// ao quadro 0. Lâmina 1 = capa da grade: o quadro 0 já é a capa completa.
//   1 capa       o Pertim acenando na pracinha (igrejinha, árvores, banco, poste); "O que muda no *Glória* com o UaiPertim?"
//   2 pede       antes (o telefone chamando e os balões sem resposta) × agora (Loja.png: cardápio e preço na tela)
//   3 acompanha  os 4 status acendem e a motinha anda; Pix · Cartão · Na entrega; Entrega ou Retirada (o cliente escolhe)
//   4 points     o pão de queijo e as moedinhas; pontos por pedido concluído, trocados por cupom; Bronze → Diamante
//   5 vende      vitrine no app · pedido organizado no painel · a loja decide como entrega (equipe própria ou rede)
//   6 entrega    moto, bike, carro ou a pé; o aviso "Nova entrega disponível" com Loja · Bairro · Valor antes do aceite
//   7 fecho      a pracinha, a logo redonda, @uaipertim, "Em breve no Glória" e "Segue a gente pra saber do lançamento"
// Todo o conteúdo fica em x 135–945 e y 60–1290. `semFundo` tira o fundo para o QA medir o conteúdo.

type Opcao = { titulo: string; texto: string };
type Lado = { rotulo: string; texto: string; baloes?: string[] };
type Lamina = {
  tipo: "capa" | "pede" | "acompanha" | "points" | "vende" | "entrega" | "fecho"; rotulo: string; segundos: number; estatico?: number;
  titulo: string | string[]; quebra?: string[]; rodape?: string; texto?: string; antes?: Lado; agora?: Lado; ilustrativo?: boolean;
  passos?: string[]; formas?: string[]; formas_titulo?: string; modos?: string[]; modos_titulo?: string; linhas?: string[]; niveis?: string[]; niveis_titulo?: string;
  opcoes?: Opcao[]; veiculos?: string[]; aviso?: string; campos?: string[]; handle?: string; embreve?: string; cta?: string;
};
export type OQueMudaDados = { numero: number; formato: [number, number]; selo: string; ilustrativo: string; laminas: Lamina[] };
export type OQueMudaProps = OQueMudaDados & { lamina: number; layout?: { titulo: Wrapped }; semFundo?: boolean };

export const O_QUE_MUDA = { width: 1080, height: 1350, fps: 30 };
export const duracaoOQueMuda = (d: OQueMudaDados, i: number) => Math.round(d.laminas[i].segundos * O_QUE_MUDA.fps);
const CAPA_T = { cy: 905, maxH: 345, sizes: [130, 120, 110, 104, 98, 92, 86, 80] };

export const medeOQueMuda = (d: OQueMudaDados, i: number): { titulo: Wrapped } => {
  const L = d.laminas[i];
  if (L.tipo === "capa") {
    const lines = (L.titulo as string[]).map((l) => glue(plain(l)));
    const size = CAPA_T.sizes.find((z) => lines.length * z * 1.12 <= CAPA_T.maxH && lines.every((l) => fitWrap(l, W.black, LARG, [z], 1).ok)) ?? 80;
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

type P = OQueMudaProps & { L: Lamina; f: number; D: number };
const t_ = (f: number) => f / 30;
const Cartao: React.FC<{ e?: number; children: React.ReactNode; style?: React.CSSProperties; cor?: string }> = ({ e = 0, children, style, cor = C.coral }) => (
  <div style={{ boxSizing: "border-box", borderRadius: 38, background: mix("#FFFFFF", "#FFF4EC", e), border: `5px solid ${mix("#EADBC6", cor, e)}`,
    boxShadow: `0 ${9 + 3 * e}px 0 ${mix("#E2CDB2", cor === C.verde ? C.verdeDark : C.coralDark, e)}`, ...style }}>{children}</div>
);
const Chip: React.FC<{ e: number; txt: string; icone?: React.ReactNode; size?: number; cor?: string }> = ({ e, txt, icone, size = 36, cor = C.verde }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: `12px ${size * 0.7}px 12px ${icone ? 16 : size * 0.7}px`, borderRadius: 999, background: mix("#FFFFFF", cor === C.verde ? "#EAF6EA" : "#FFF1E8", e),
    border: `5px solid ${mix("#EADBC6", cor, e)}`, boxShadow: `0 7px 0 ${mix("#E2CDB2", cor === C.verde ? C.verdeDark : C.coralDark, e)}`, transform: `scale(${1 + 0.05 * e})`,
    fontFamily: FONT, fontWeight: W.black, fontSize: size, color: C.tinta, whiteSpace: "nowrap" }}>{icone}{txt}</div>
);

// ---------------------------------------------------------------- a pracinha do Glória (capa e fecho)
const Banco: React.FC<{ x: number; y: number; w: number }> = ({ x, y, w }) => (
  <svg width={w} height={w * 0.45} viewBox="0 0 200 90" style={{ position: "absolute", left: x, top: y - w * 0.45 }}>
    <rect x="10" y="18" width="180" height="14" rx="6" fill="#B87B44" /><rect x="10" y="40" width="180" height="14" rx="6" fill="#B87B44" />
    <rect x="4" y="56" width="192" height="14" rx="6" fill="#D59A5E" />
    {[24, 176].map((x) => <rect key={x} x={x - 6} y="60" width="12" height="30" rx="4" fill="#6E4A2A" />)}
  </svg>
);
const Poste: React.FC<{ x: number; y: number; h: number; luz: number }> = ({ x, y, h, luz }) => (
  <svg width={60} height={h} viewBox={`0 0 60 ${h}`} style={{ position: "absolute", left: x - 30, top: y - h, overflow: "visible" }}>
    <circle cx="30" cy="24" r={30} fill={C.amarelo} opacity={0.18 + 0.15 * luz} />
    <rect x="26" y="34" width="8" height={h - 34} rx="4" fill="#4A3E38" />
    <path d="M14 30 H46 L40 12 H20 Z" fill="#4A3E38" /><circle cx="30" cy="28" r="9" fill="#FFE48A" />
  </svg>
);
const Pracinha: React.FC<{ f: number; D: number; base: number; escala?: number }> = ({ f, D, base, escala = 1 }) => {
  const sw = 3 * onda(f, D, 2);
  return (
    <>
      <div style={{ position: "absolute", left: 540 - 400, top: base - 230 - 400, width: 800, height: 800, borderRadius: "50%", background: `radial-gradient(circle, ${C.amareloLight}66 0%, ${C.amareloLight}00 68%)` }} />
      <svg width={1080} height={1350} style={{ position: "absolute", left: 0, top: 0 }}>
        <Igrejinha x={540 - 110 * escala} base={base - 6} w={220 * escala} />
      </svg>
      <div style={{ position: "absolute", left: 170, width: 740, top: base - 18, height: 34, borderRadius: 17, background: "#BFE3A8" }} />
      <div style={{ position: "absolute", left: 200, width: 680, top: base - 10, height: 18, borderRadius: 9, background: C.cremeDeep }} />
      <Tree size={150 * escala} sway={sw} style={{ position: "absolute", left: 170, top: base - 195 * escala }} />
      <Tree size={130 * escala} sway={-sw} style={{ position: "absolute", left: 910 - 130 * escala, top: base - 169 * escala }} />
      <Poste x={720} y={base - 4} h={230 * escala} luz={0.5 + 0.5 * onda(f, D, 2)} />
      <Banco x={690} y={base - 2} w={170 * escala} />
    </>
  );
};

// ================================================================ 1 · capa (quadro 0 = a capa da grade)
const Capa: React.FC<P> = ({ selo, L, layout, f, D }) => {
  const t = layout!.titulo, th = t.lines.length * t.size * 1.12;
  const base = 700, pa = 370;
  return (
    <>
      <div style={{ position: "absolute", top: 120 - 60, left: 0, right: 0, height: 120, display: "flex", justifyContent: "center", alignItems: "center" }}><Selo texto={selo} s={40} /></div>
      <Pracinha f={f} D={D} base={base} />
      <PertimFixo altura={pa} pose="acenando" expr="sorrindo" style={{ left: 420 - 140 * (pa / 284), top: base + 2 - 270 * (pa / 284) }}
        rig={{ respira: onda(f, D, 3), capacete: 0.8 * onda(f, D, 3, -0.7), aceno: 14 * onda(f, D, 6), piscada: piscadaEm([2.1, 4.7], t_(f)) }} />
      <div style={{ position: "absolute", top: CAPA_T.cy - th / 2, left: SAFE.x0, width: LARG }}>
        <Text source={glue((L.titulo as string[]).join(" "))} wrapped={t} weight={W.black} />
      </div>
      <div style={{ position: "absolute", top: CAPA_T.cy + th / 2 + 34, left: SAFE.x0, width: LARG, textAlign: "center", fontFamily: FONTE, fontWeight: W.medium, fontSize: 44, color: C.tinta, letterSpacing: -0.3, whiteSpace: "nowrap" }}>
        {L.rodape!.replace(/\s*→$/, "")} <span style={{ display: "inline-block", transform: `translateX(${10 * (1 - Math.cos((TAU * 4 * f) / D)) / 2}px)` }}>→</span>
      </div>
    </>
  );
};

// ================================================================ 2 · pra quem pede: antes × agora
const Telefone: React.FC<{ w: number; children: React.ReactNode; tom?: string }> = ({ w, children, tom = C.tinta }) => {
  const h = w * 1.7, bz = w * 0.05;
  return (
    <div style={{ position: "relative", width: w, height: h }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: w * 0.16, background: tom, boxShadow: "0 16px 30px rgba(34,28,25,0.22)" }} />
      <div style={{ position: "absolute", left: bz, top: bz, width: w - 2 * bz, height: h - 2 * bz, borderRadius: w * 0.12, overflow: "hidden", background: "#FAF8F5" }}>{children}</div>
    </div>
  );
};
const Pede: React.FC<P> = ({ L, layout, f, D, ilustrativo }) => {
  const t = t_(f), dur = D / 30;
  const A = L.antes!, G = L.agora!;
  const top = 168 + altTitulo(layout!.titulo) + 82, cw = (LARG - 30) / 2, ch = 800;
  const eAg = liga(t, 2.0, dur - 0.7, 0.4);
  const anel = liga(t, 2.7, dur - 0.9, 0.3);
  const toca = Math.sin(t * 22) * (Math.sin((TAU * 3 * f) / D) > 0 ? 1 : 0);
  const pw = 252, sw = pw * 0.9, K = sw / 1170, rola = 1480;
  return (
    <>
      <Titulo L={L} wt={layout!.titulo} topo />
      <Texto y={168 + altTitulo(layout!.titulo) + 14} size={38}>{L.texto}</Texto>
      {/* antes: cinza, o telefone chamando e os balões sem resposta */}
      <div style={{ position: "absolute", left: SAFE.x0, top, width: cw, height: ch }}>
        <Cartao style={{ width: cw, height: ch, background: "#F4EEE7", padding: "26px 22px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{ padding: "8px 26px", borderRadius: 999, background: "#9C8F86", fontFamily: FONT, fontWeight: W.black, fontSize: 34, color: "#fff" }}>{A.rotulo}</div>
          <div style={{ position: "relative", transform: `rotate(${3 * toca}deg)`, filter: "grayscale(0.5)" }}>
            <Telefone w={pw} tom="#6E625A">
              <div style={{ padding: "30px 10px", display: "flex", flexDirection: "column", gap: 14 }}>
                {A.baloes!.map((b, k) => {
                  const e = liga(t, 0.4 + 0.5 * k, dur - 0.5, 0.3);
                  return <div key={k} style={{ alignSelf: k % 2 ? "flex-end" : "flex-start", padding: "10px 14px", borderRadius: 18, background: k % 2 ? "#DCF3D2" : "#fff", boxShadow: "0 3px 8px rgba(0,0,0,0.1)",
                    fontFamily: FONTE, fontWeight: W.extraBold, fontSize: 20, color: "#5E534C", opacity: e, transform: `scale(${0.8 + 0.2 * e})`, whiteSpace: "nowrap", wordSpacing: 1 }}>{b}</div>;
                })}
                <div style={{ alignSelf: "flex-start", display: "flex", gap: 6, padding: "12px 16px", borderRadius: 18, background: "#fff" }}>
                  {[0, 1, 2].map((i) => <div key={i} style={{ width: 10, height: 10, borderRadius: 5, background: "#B5A897", opacity: 0.4 + 0.6 * Math.max(0, Math.sin((TAU * 7 * f) / D - i)) }} />)}
                </div>
              </div>
            </Telefone>
            {/* o relógio da espera */}
            <svg width={86} height={86} viewBox="-50 -50 100 100" style={{ position: "absolute", left: -46, top: -30 }}>
              <circle r="44" fill="#fff" stroke="#9C8F86" strokeWidth="8" />
              <path d="M0 0 V-24" stroke="#6E625A" strokeWidth="7" strokeLinecap="round" transform={`rotate(${(360 * f) / D})`} />
              <path d="M0 0 V-32" stroke={C.coral} strokeWidth="5" strokeLinecap="round" transform={`rotate(${(360 * 6 * f) / D})`} />
            </svg>
          </div>
          <div style={{ fontFamily: FONTE, fontWeight: W.extraBold, fontSize: 32, lineHeight: 1.18, color: "#6E625A", textAlign: "center", textWrap: "balance" } as React.CSSProperties}>{glue(A.texto)}</div>
        </Cartao>
      </div>
      {/* agora: o cardápio e o preço na tela (Loja.png) */}
      <div style={{ position: "absolute", left: SAFE.x0 + cw + 30, top: top - 12 * eAg, width: cw, height: ch, transform: `scale(${1 + 0.02 * eAg})` }}>
        <Cartao e={0.35 + 0.65 * eAg} style={{ width: cw, height: ch, padding: "26px 22px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{ padding: "8px 26px", borderRadius: 999, background: C.coral, boxShadow: `0 5px 0 ${C.coralDark}`, fontFamily: FONT, fontWeight: W.black, fontSize: 34, color: "#fff" }}>{G.rotulo}</div>
          <Telefone w={pw}>
            <div style={{ position: "absolute", left: 0, top: -rola * K, width: 1170, height: 4920, transform: `scale(${K})`, transformOrigin: "0 0" }}>
              <Img src={staticFile("telas-app/celular/Loja.png")} style={{ position: "absolute", left: 0, top: 0, width: 1170, height: 4920, maxWidth: "none" }} />
              {/* o preço dos dois destaques */}
              <Anel cx={[60, 2210, 520, 2290]} e={anel} raio={30} esp={14} />
              <Anel cx={[600, 2210, 1110, 2290]} e={anel} raio={30} esp={14} />
            </div>
          </Telefone>
          <div style={{ fontFamily: FONTE, fontWeight: W.black, fontSize: 34, lineHeight: 1.16, color: C.tinta, textAlign: "center", textWrap: "balance" } as React.CSSProperties}>{glue(G.texto)}</div>
        </Cartao>
      </div>
      <div style={{ position: "absolute", left: SAFE.x0 + cw - 8, top: top + ch / 2 - 30, width: 46, height: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width={46} height={46} viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill={C.coral} /><path d="M8 12 H16 M12.5 8 L16 12 L12.5 16" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
      {L.ilustrativo && <Ilustrativo texto={ilustrativo} y={top + ch + 34} />}
    </>
  );
};

// ================================================================ 3 · acompanha e paga do seu jeito
const IconePix: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="14" rx="3.5" transform="rotate(45 12 12)" fill="#32BCAD" /><rect x="9" y="9" width="6" height="6" rx="1.4" transform="rotate(45 12 12)" fill="#fff" /></svg>
);
const IconeCartao: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="3" fill="#3E7FB8" /><rect x="2" y="8.5" width="20" height="2.8" fill="#24547F" /><rect x="5" y="14" width="6" height="2" rx="1" fill="#fff" /></svg>
);
const Acompanha: React.FC<P> = ({ L, layout, f, D }) => {
  const t = t_(f), dur = D / 30;
  const top = 168 + altTitulo(layout!.titulo) + 34;
  const ps = L.passos!, T0 = 0.4, PASSO = 0.6, APAGA = dur - 0.8;
  const W_ = LARG, nx = (k: number) => 100 + (k * (W_ - 200)) / 3;
  let pos = -0.3;
  ps.forEach((_, k) => { pos = Math.max(pos, k - 1 + ease(clamp01((t - (T0 + PASSO * k)) / 0.35))); });
  const X0 = 100, WB = W_ - 200;
  const volta = ease(clamp01((t - (APAGA - 0.1)) / 0.6));
  const mx = X0 + ((pos * (1 - volta) - 0.3 * volta) * WB) / 3;
  return (
    <>
      <Titulo L={L} wt={layout!.titulo} topo />
      {/* os status acendem um a um e a motinha anda */}
      <Cartao style={{ position: "absolute", left: SAFE.x0, top, width: W_, height: 270 }}>
        <div style={{ position: "absolute", left: X0, top: 128, width: WB, height: 16, borderRadius: 8, background: "#EFE5D8" }} />
        <div style={{ position: "absolute", left: X0, top: 128, width: Math.max(0, mx - X0), height: 16, borderRadius: 8, background: C.verde }} />
        {ps.map((s, k) => {
          const e = liga(t, T0 + PASSO * k, APAGA, 0.25);
          const atual = e > 0.5 && (k === ps.length - 1 || t < T0 + PASSO * (k + 1));
          return (
            <React.Fragment key={k}>
              <div style={{ position: "absolute", left: nx(k) - 32, top: 104, width: 64, height: 64, borderRadius: "50%", background: mix("#E3D8CA", atual ? C.coral : C.verde, e), display: "flex", alignItems: "center", justifyContent: "center",
                transform: `scale(${1 + 0.12 * e})` }}>{e > 0.5 ? <IconeCheck s={40} cor="#fff" /> : <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff" }} />}</div>
              <div style={{ position: "absolute", left: nx(k) - 100, top: 182, width: 190, textAlign: "center", fontFamily: FONT, fontWeight: W.black, fontSize: 28, lineHeight: 1.06, letterSpacing: -0.4,
                color: mix("#A99C90", atual ? C.coral : C.tinta, e) }}>{s}</div>
            </React.Fragment>
          );
        })}
        <div style={{ position: "absolute", left: mx - 44, top: 22 - 4 * Math.abs(onda(f, D, 14)), width: 88, height: 88 }}><ScooterIcon size={88} wheelSpin={(720 * 7 * f) / D} /></div>
      </Cartao>
      {/* como paga */}
      <Texto y={top + 312} size={36} x={SAFE.x0} w={LARG}><div style={{ textAlign: "center", fontWeight: W.extraBold }}>{glue(L.formas_titulo!)}</div></Texto>
      <div style={{ position: "absolute", left: SAFE.x0, width: LARG, top: top + 420, display: "flex", justifyContent: "center", gap: 18 }}>
        {L.formas!.map((x, k) => (
          <Chip key={k} e={liga(t, 2.2 + 0.35 * k, APAGA, 0.25)} txt={x} icone={x === "Pix" ? <IconePix s={44} /> : x === "Cartão" ? <IconeCartao s={44} /> : <ScooterIcon size={48} />} />
        ))}
      </div>
      {/* entrega ou retirada: o cliente escolhe */}
      <Texto y={top + 560} size={36} x={SAFE.x0} w={LARG}><div style={{ textAlign: "center", fontWeight: W.extraBold }}>{glue(L.modos_titulo!)}</div></Texto>
      <div style={{ position: "absolute", left: SAFE.x0, width: LARG, top: top + 630, display: "flex", justifyContent: "center", gap: 30 }}>
        {L.modos!.map((x, k) => {
          const e = Math.pow(Math.sin(Math.PI * clamp01((t - (3.4 + 1.2 * k)) / 1.6)), 2);
          return (
            <Cartao key={k} e={e} style={{ width: 340, height: 220, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, transform: `translateY(${-10 * e}px)` }}>
              <div style={{ transform: `scale(${1 + 0.08 * e})` }}>{k === 0 ? <ScooterIcon size={120} /> : <IconeBalcao s={120} />}</div>
              <div style={{ fontFamily: FONT, fontWeight: W.black, fontSize: 40, color: C.tinta }}>{x}</div>
            </Cartao>
          );
        })}
      </div>
    </>
  );
};

// ================================================================ 4 · Pão de Queijo Points
const PaoBola: React.FC<{ x: number; y: number; r: number }> = ({ x, y, r }) => (
  <g>
    <ellipse cx={x} cy={y + r * 0.12} rx={r} ry={r * 0.84} fill="#D7962F" /><ellipse cx={x} cy={y} rx={r} ry={r * 0.84} fill="#F2C063" />
    <ellipse cx={x - r * 0.32} cy={y - r * 0.34} rx={r * 0.36} ry={r * 0.18} fill="#FFE6A6" transform={`rotate(-18 ${x - r * 0.32} ${y - r * 0.34})`} />
  </g>
);
const Moeda: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="-50 -50 100 100">
    <circle r="48" fill={C.amareloDark} /><circle r="44" cy="-3" fill={C.amarelo} /><circle r="32" cy="-3" fill="none" stroke="#FFE08A" strokeWidth="5" />
    <path d="M-17 1 C-19 -14 -9 -21 0 -21 C9 -21 19 -14 17 1 C16 9 9 12 0 12 C-9 12 -16 9 -17 1 Z" fill="#FFE08A" transform="translate(0 -3)" />
  </svg>
);
const COR_NIVEL = ["#C8834A", "#A9B4BE", C.amarelo, "#4BA3D6"];
const Points: React.FC<P> = ({ L, layout, f, D }) => {
  const t = t_(f), dur = D / 30;
  const top = 168 + altTitulo(layout!.titulo) + 20;
  const vapor = (i: number) => ((f / D) * 3 + i / 3) % 1;
  return (
    <>
      <Titulo L={L} wt={layout!.titulo} topo />
      {/* o pão de queijo quentinho e as moedinhas girando em volta */}
      <div style={{ position: "absolute", left: 540 - 300, top, width: 600, height: 290 }}>
        <svg width={600} height={290} viewBox="0 0 600 290" style={{ overflow: "visible" }}>
          {[0, 1, 2].map((i) => <path key={i} d={`M${270 + i * 30} ${80 - vapor(i) * 50} c-10 -12 10 -20 0 -32`} stroke="#fff" strokeWidth="8" strokeLinecap="round" fill="none" opacity={Math.sin(Math.PI * vapor(i))} />)}
          <ellipse cx="300" cy="262" rx="150" ry="14" fill="#000" opacity="0.08" />
          <PaoBola x={300} y={180} r={92} />
        </svg>
        {[0, 1, 2, 3].map((i) => {
          const a = (TAU * f) / D + (i * TAU) / 4;
          return <div key={i} style={{ position: "absolute", left: 300 + 240 * Math.cos(a) - 34, top: 160 + 70 * Math.sin(a) - 34, transform: `scale(${0.85 + 0.15 * Math.sin(a)})`, zIndex: Math.sin(a) > 0 ? 2 : 0 }}><Moeda s={68} /></div>;
        })}
      </div>
      {L.linhas!.map((x, k) => {
        const e = liga(t, 0.6 + 0.8 * k, dur - 0.7, 0.3);
        return (
          <div key={k} style={{ position: "absolute", left: SAFE.x0, width: LARG, top: top + 314 + k * 118, display: "flex", alignItems: "center", gap: 18, opacity: 0.35 + 0.65 * e }}>
            <div style={{ flex: "none", width: 60, height: 60, borderRadius: "50%", background: mix("#E9DED0", C.verde, e), display: "flex", alignItems: "center", justifyContent: "center" }}><IconeCheck s={42} cor="#fff" /></div>
            <div style={{ fontFamily: FONTE, fontWeight: W.black, fontSize: 38, lineHeight: 1.14, color: C.tinta, letterSpacing: -0.5, textWrap: "balance" } as React.CSSProperties}>{glue(x)}</div>
          </div>
        );
      })}
      <Texto y={top + 568} size={36} x={SAFE.x0} w={LARG}><div style={{ textAlign: "center", fontWeight: W.extraBold }}>{glue(L.niveis_titulo!)}</div></Texto>
      <div style={{ position: "absolute", left: SAFE.x0, width: LARG, top: top + 636, display: "flex", justifyContent: "space-between" }}>
        {L.niveis!.map((n, k) => {
          const e = liga(t, 2.2 + 0.4 * k, dur - 0.7, 0.25);
          return (
            <div key={k} style={{ width: 186, height: 196, boxSizing: "border-box", borderRadius: 32, background: "#fff", border: `5px solid ${mix("#EADBC6", COR_NIVEL[k], e)}`, boxShadow: `0 8px 0 ${mix("#E2CDB2", COR_NIVEL[k], e)}`,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, transform: `translateY(${-10 * e}px)` }}>
              <svg width={78} height={78} viewBox="0 0 24 24" style={{ transform: `scale(${0.9 + 0.15 * e})` }}>
                <path d="M7 2 H17 L14 9 H10 Z" fill={mix("#D9CBBB", C.coral, e)} />
                <circle cx="12" cy="15" r="7" fill={mix("#E3D8CA", COR_NIVEL[k], e)} /><circle cx="12" cy="15" r="4.2" fill="#fff" opacity="0.45" />
              </svg>
              <div style={{ fontFamily: FONT, fontWeight: W.black, fontSize: 32, color: mix("#A99C90", C.tinta, e) }}>{n}</div>
            </div>
          );
        })}
      </div>
    </>
  );
};

// ================================================================ 5 · pra quem vende
const IconePainel: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="0 0 100 100">
    <rect x="10" y="18" width="80" height="54" rx="8" fill={C.tinta} /><rect x="16" y="24" width="68" height="42" rx="4" fill="#FAF8F5" />
    <rect x="22" y="30" width="26" height="14" rx="3" fill={C.coral} opacity="0.85" /><rect x="52" y="30" width="26" height="14" rx="3" fill={C.verde} opacity="0.85" />
    <rect x="22" y="48" width="56" height="5" rx="2.5" fill={C.cremeDeep} /><rect x="22" y="57" width="40" height="5" rx="2.5" fill={C.cremeDeep} />
    <path d="M2 78 H98 L92 86 H8 Z" fill="#B5A898" />
  </svg>
);
const IconeDecide: React.FC<{ s: number }> = ({ s }) => (
  <div style={{ position: "relative", width: s, height: s }}>
    <div style={{ position: "absolute", left: 0, top: s * 0.1 }}><ScooterIcon size={s * 0.88} /></div>
    <div style={{ position: "absolute", right: -s * 0.08, top: -s * 0.06, width: s * 0.5, height: s * 0.5, borderRadius: "50%", background: C.amarelo, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <IconeLoja s={s * 0.42} />
    </div>
  </div>
);
const ICONES_VENDE = [(s: number) => <IconeLoja s={s} />, (s: number) => <IconePainel s={s} />, (s: number) => <IconeDecide s={s} />];
const Vende: React.FC<P> = ({ L, layout, f, D }) => {
  const t = t_(f), dur = D / 30;
  const yt = 168 + altTitulo(layout!.titulo) + 14, top = yt + 80, h = 258, gap = 28;
  return (
    <>
      <Titulo L={L} wt={layout!.titulo} topo />
      <Texto y={yt} size={38}>{L.texto}</Texto>
      {L.opcoes!.map((o, k) => {
        const e = liga(t, 0.6 + 1.1 * k, dur - 0.9, 0.3);
        const pulo = Math.sin(Math.PI * clamp01((t - (0.6 + 1.1 * k)) / 0.35));
        return (
          <Cartao key={k} e={e} style={{ position: "absolute", left: SAFE.x0, width: LARG, top: top + k * (h + gap) - 10 * pulo, height: h, display: "flex", alignItems: "center", gap: 26, padding: "0 30px 0 24px" }}>
            <div style={{ flex: "none", width: 170, height: 170, borderRadius: "50%", background: mix("#F3EADF", "#FFE2D4", e), display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${1 + 0.06 * e})` }}>
              <div style={{ opacity: 0.5 + 0.5 * e, filter: e < 0.5 ? "grayscale(0.7)" : undefined }}>{ICONES_VENDE[k](124)}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: FONT, fontWeight: W.black, fontSize: 44, lineHeight: 1.08, color: mix("#8C7F75", C.tinta, e), letterSpacing: -0.8, textWrap: "balance" } as React.CSSProperties}>{o.titulo}</div>
              <div style={{ fontFamily: FONTE, fontWeight: W.medium, fontSize: o.texto.length > 40 ? 29 : 32, lineHeight: 1.16, color: C.tinta, opacity: 0.55 + 0.35 * e, marginTop: 8, wordSpacing: o.texto.length > 40 ? 0 : 2 }}>{glue(o.texto)}</div>
            </div>
            <div style={{ flex: "none", width: 60, height: 60, borderRadius: "50%", background: mix("#E9DED0", C.verde, e), display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${0.8 + 0.25 * e})` }}>
              <IconeCheck s={42} cor="#fff" />
            </div>
          </Cartao>
        );
      })}
    </>
  );
};

// ================================================================ 6 · pra quem entrega
const IconeAPe: React.FC<{ s: number; passo: number }> = ({ s, passo }) => (
  <svg width={s} height={s} viewBox="0 0 100 100">
    <circle cx="54" cy="18" r="11" fill="#C98A5B" />
    <path d="M52 32 L46 60" stroke="#3A9AD9" strokeWidth="16" strokeLinecap="round" />
    <path d={`M48 38 L${34 + 8 * passo} 52 M50 38 L${66 - 8 * passo} 50`} stroke="#3A9AD9" strokeWidth="8" strokeLinecap="round" />
    <path d={`M46 60 L${36 + 10 * passo} 88 M46 60 L${58 - 10 * passo} 88`} stroke="#2F5E8A" strokeWidth="10" strokeLinecap="round" />
    <rect x="62" y="44" width="22" height="18" rx="4" fill={C.amarelo} /><circle cx="73" cy="53" r="3.5" fill={C.coral} />
  </svg>
);
const Entrega: React.FC<P> = ({ L, layout, f, D }) => {
  const t = t_(f), dur = D / 30;
  const yt = 168 + altTitulo(layout!.titulo) + 14;
  const top = yt + 120;
  const giro = (720 * 6 * f) / D, passo = Math.sin((TAU * 6 * f) / D);
  const ic = [<ScooterIcon key="m" size={104} wheelSpin={giro} />, <Bike key="b" w={116} giro={giro} pedal={(TAU * 6 * f) / D} />, <Carro key="c" w={124} giro={giro} />, <IconeAPe key="p" s={110} passo={passo} />];
  const eN = ease(clamp01((t - 1.6) / 0.4)) * (1 - ease(clamp01((t - (dur - 0.6)) / 0.4)));
  const CAMPOS = [<IconeLoja key="l" s={52} />, <IconePin key="p" s={52} />, <IconeNota key="n" s={52} />];
  return (
    <>
      <Titulo L={L} wt={layout!.titulo} topo />
      <Texto y={yt} size={36}>{glue(L.texto!)}</Texto>
      <div style={{ position: "absolute", left: SAFE.x0, width: LARG, top, display: "flex", justifyContent: "space-between" }}>
        {L.veiculos!.map((v, k) => {
          const e = liga(t, 0.3 + 0.25 * k, dur - 0.5, 0.25);
          return (
            <div key={k} style={{ width: 186, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, transform: `translateY(${-8 * Math.sin(Math.PI * clamp01((t - (0.3 + 0.25 * k)) / 0.35))}px)` }}>
              <div style={{ width: 160, height: 160, borderRadius: "50%", background: "#fff", border: `5px solid ${mix("#EADBC6", C.coral, e)}`, boxShadow: `0 8px 0 ${mix("#E2CDB2", C.coralDark, e)}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>{ic[k]}</div>
              <div style={{ fontFamily: FONT, fontWeight: W.black, fontSize: 32, color: C.tinta }}>{v}</div>
            </div>
          );
        })}
      </div>
      {/* o aviso no celular, com o que o entregador vê antes de aceitar */}
      <div style={{ position: "absolute", left: SAFE.x0, width: LARG, top: top + 270 - 40 * (1 - eN), opacity: 0.25 + 0.75 * eN, boxSizing: "border-box", padding: "24px 28px", borderRadius: 36, background: "#fff",
        border: `5px solid ${mix("#EADBC6", C.coral, eN)}`, boxShadow: "0 16px 34px rgba(34,28,25,0.18)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Img src={staticFile("img/uaipertim_logo.png")} style={{ width: 60, height: 60 }} />
          <div style={{ fontFamily: FONT, fontWeight: W.extraBold, fontSize: 26, color: "#9C8F86" }}>UaiPertim · agora</div>
        </div>
        <div style={{ fontFamily: FONT, fontWeight: W.black, fontSize: 46, color: C.tinta, letterSpacing: -0.8, marginTop: 10 }}>{L.aviso}</div>
        <div style={{ display: "flex", gap: 16, marginTop: 18 }}>
          {L.campos!.map((c, k) => {
            const e = liga(t, 2.3 + 0.45 * k, dur - 0.6, 0.25);
            return (
              <div key={k} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "16px 10px", borderRadius: 24, background: mix("#F7F1E9", "#FFF1E8", e),
                border: `4px solid ${mix("#EFE5D8", C.coral, e)}`, transform: `scale(${1 + 0.04 * e})`, fontFamily: FONT, fontWeight: W.black, fontSize: 34, color: C.tinta }}>{CAMPOS[k]}{c}</div>
            );
          })}
        </div>
      </div>
      <div style={{ position: "absolute", left: SAFE.x0, width: LARG, top: top + 650, display: "flex", alignItems: "center", justifyContent: "center", gap: 16, opacity: 0.35 + 0.65 * liga(t, 3.8, dur - 0.6, 0.3) }}>
        <IconeOlho s={60} />
        <div style={{ fontFamily: FONTE, fontWeight: W.black, fontSize: 38, color: C.tinta, letterSpacing: -0.5 }}>{glue(L.rodape!)}</div>
      </div>
    </>
  );
};

// ================================================================ 7 · fecho
const Fecho: React.FC<P> = ({ L, layout, f, D }) => {
  const top = 168 + altTitulo(layout!.titulo);
  const base = top + 400, pa = 300;
  const voa = 6 * (1 - Math.cos((TAU * 3 * f) / D)) / 2;
  return (
    <>
      <Titulo L={L} wt={layout!.titulo} topo />
      <Pracinha f={f} D={D} base={base} escala={0.82} />
      <PertimFixo altura={pa} pose="acenando" expr="sorrindo" style={{ left: 430 - 140 * (pa / 284), top: base + 2 - 270 * (pa / 284) }}
        rig={{ respira: onda(f, D, 3), capacete: 0.8 * onda(f, D, 3, -0.7), aceno: 14 * onda(f, D, 6), piscada: piscadaEm([2.4, 4.9], t_(f)) }} />
      <div style={{ position: "absolute", left: SAFE.x0, width: LARG, top: base + 50, height: 100, display: "flex", alignItems: "center", justifyContent: "center", gap: 20 }}>
        <Img src={staticFile("pedir-no-uaipertim/logo/logo-selo-transparente.png")} style={{ width: 100, height: 100, objectFit: "contain", filter: "drop-shadow(0 4px 8px rgba(198,58,23,0.22))" }} />
        <span style={{ fontFamily: FONT, fontWeight: W.black, fontSize: 56, color: C.coral, letterSpacing: -1 }}>{L.handle}</span>
      </div>
      <div style={{ position: "absolute", left: SAFE.x0, width: LARG, top: base + 190, display: "flex", justifyContent: "center" }}>
        <div style={{ padding: "14px 36px", borderRadius: 999, background: C.tinta, fontFamily: FONT, fontWeight: W.black, fontSize: 44, color: "#fff", whiteSpace: "nowrap", letterSpacing: -0.5 }}>{L.embreve}</div>
      </div>
      <div style={{ position: "absolute", left: SAFE.x0, width: LARG, top: base + 300, display: "flex", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 30px 16px 18px", borderRadius: 999, background: C.coral, boxShadow: `0 8px 0 ${C.coralDark}`,
          fontFamily: FONTE, fontWeight: W.black, fontSize: 31, color: "#fff", whiteSpace: "nowrap", letterSpacing: -0.4, wordSpacing: 2 }}>
          <div style={{ width: 54, height: 54, borderRadius: "50%", background: "rgba(255,255,255,0.22)", border: "4px solid rgba(255,255,255,0.75)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <PaperPlaneIcon size={36} style={{ transform: `translate(${voa}px, ${-voa}px)` }} />
          </div>
          {glue(L.cta!)}
        </div>
      </div>
      {[0, 1, 2].map((i) => {
        const u = ((f / D) * 2 + i / 3) % 1;
        return <div key={i} style={{ position: "absolute", left: 720 + 60 * i, top: base - 330 - 60 * u, opacity: Math.sin(Math.PI * u) * 0.9 }}><StarShape size={28} color={i === 1 ? C.coral : C.amarelo} /></div>;
      })}
    </>
  );
};

// ================================================================ a composição: uma lâmina por render (prop `lamina`, 0..6)
const BRILHOS: Record<Lamina["tipo"], Array<[number, number]>> = {
  capa: [[170, 300], [915, 300], [180, 1190], [900, 1200]], pede: [[925, 360], [160, 1250]], acompanha: [[925, 360], [160, 1250]], points: [[930, 380], [160, 470]],
  vende: [[925, 360], [160, 1250]], entrega: [[925, 360], [160, 1250]], fecho: [[925, 420], [160, 620]],
};
export const OQueMuda: React.FC<OQueMudaProps> = (props) => {
  const frame = useCurrentFrame();
  const D = duracaoOQueMuda(props, props.lamina);
  const f = ((frame % D) + D) % D;
  const L = props.laminas[props.lamina];
  const n = props.laminas.length;
  const Pp = { ...props, L, f, D };
  return (
    <AbsoluteFill style={{ overflow: "hidden", wordSpacing: 6 }}>
      {!props.semFundo && <Fundo f={f} D={D} cy={L.tipo === "capa" ? 470 : 760} cor={C.amarelo} seed={`o-que-muda-${props.lamina}`} pts={[]} />}
      <Brilhos f={f} D={D} pts={BRILHOS[L.tipo]} seed={`oqm-b-${props.lamina}`} />
      {L.tipo !== "capa" && <Cabecalho selo={props.selo} n={props.lamina + 1} total={n} />}
      {L.tipo === "capa" && <Capa {...Pp} />}
      {L.tipo === "pede" && <Pede {...Pp} />}
      {L.tipo === "acompanha" && <Acompanha {...Pp} />}
      {L.tipo === "points" && <Points {...Pp} />}
      {L.tipo === "vende" && <Vende {...Pp} />}
      {L.tipo === "entrega" && <Entrega {...Pp} />}
      {L.tipo === "fecho" && <Fecho {...Pp} />}
    </AbsoluteFill>
  );
};
