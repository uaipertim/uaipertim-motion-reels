import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { C, FONT, W } from "../config/theme";
import { Sunburst } from "../components/Decor";
import { StarShape } from "../components/Particles";
import { fitWrap, Wrapped } from "../dicionario/fit";
import { Text, glue } from "../carrossel/CarrosselFacim";
import { Pertim, PertimRig } from "../personagem/Pertim";
import { Expressao, Pose, pertimVals } from "../personagem/logica";
import { piscadaEm } from "../personagem/rig";

// CARROSSEL ANIMADO "QUIZ" (carrosseis/quiz/NN-tema.json): cada lâmina é um vídeo 1080 × 1440 (3:4), 30 fps, que roda
// em LOOP no Instagram. Por isso toda animação aqui é periódica na duração da lâmina (D): o quadro D é igual ao quadro 0
// e o fim volta suave ao estado inicial. Lâmina 1 = capa da grade: o quadro 0 já é a capa completa (sem entrada).
//   1      capa: selo "QUIZ · MINEIRO RAIZ", o Pertim com prancheta e lupa, título com a palavra-chave no marcador
//   2..7   uma pergunta por lâmina: cartões A e B; em REV (2,5 s) a resposta raiz acende (check verde, pulinho, o cartão
//          errado esmaece) e o Pertim reage; em VOLTA tudo volta, suave, ao estado do quadro 0
//   8      resultado: as faixas de acertos, o Pertim comemorando, o CTA e a assinatura com a logo redonda
// Todo o conteúdo fica em x 135–945 (a margem das capas da grade). `semFundo` tira o fundo para o QA medir o conteúdo.

type Resposta = { texto: string; nota?: string };
export type Pergunta = { titulo: string; quebra?: string[]; certa?: "a" | "b"; a: Resposta; b: Resposta; reacao: "comemora" | "aponta"; fala: string };
export type Quiz = {
  numero: number; pasta: string; selo: [string, string];
  capa: { titulo: string[]; rodape: string; segundos: number };
  perguntas: Pergunta[];
  resultado: { titulo: string; faixas: Array<{ nota: string; texto: string }>; cta: string; assinatura: string; segundos: number };
  segundosPergunta: number;
};
export type QuizProps = Quiz & { lamina: number; layout?: { titulo: Wrapped }; semFundo?: boolean; estatico?: boolean };

export const QUIZ = { width: 1080, height: 1440, fps: 30 };
const SAFE = { x0: 135, x1: 945 };
const LARG = SAFE.x1 - SAFE.x0;
export const nLaminas = (q: Quiz) => q.perguntas.length + 2;
export const tipoLamina = (q: Quiz, i: number) => (i === 0 ? "capa" : i === nLaminas(q) - 1 ? "resultado" : "pergunta");
export const duracaoLamina = (q: Quiz, i: number) =>
  QUIZ.fps * (i === 0 ? q.capa.segundos : i === nLaminas(q) - 1 ? q.resultado.segundos : q.segundosPergunta);
// o quadro da versão estática (PNG, plano B): a capa no quadro 0; a pergunta com a resposta acesa; o resultado inteiro
export const quadroEstatico = (q: Quiz, i: number) => (tipoLamina(q, i) === "pergunta" ? Math.round(4.6 * QUIZ.fps) : 0);

const plain = (t: string) => t.replace(/\*/g, "");
// a palavra-chave com mais de uma palavra fica numa linha só, com um marcador só ("*ir embora*" → "ir\u00A0embora")
const juntaChave = (t: string) => t.replace(/\*([^*]+)\*/g, (_, k: string) => `*${k.replace(/ +/g, "\u00A0")}*`);
const CAPA_T = { cy: 1012, maxH: 380, sizes: [170, 156, 144, 132, 120, 110, 100, 92, 84] };
const PERG_T = { y0: 204, y1: 500, sizes: [84, 78, 72, 66, 60] };
const RES_T = { cy: 262, sizes: [104, 96, 88, 80, 72] };

// medido em calculateMetadata (fontes carregadas)
export const medeQuiz = (q: Quiz, i: number): { titulo: Wrapped } => {
  const tipo = tipoLamina(q, i);
  if (tipo === "capa") {
    const lines = q.capa.titulo.map((l) => glue(plain(l)));
    const size = CAPA_T.sizes.find((z) => lines.length * z * 1.12 <= CAPA_T.maxH && lines.every((l) => fitWrap(l, W.black, LARG, [z], 1).ok)) ?? 84;
    return { titulo: { size, lines, ok: true } };
  }
  if (tipo === "resultado") return { titulo: fitWrap(glue(plain(q.resultado.titulo)), W.black, LARG, RES_T.sizes, 1) };
  const p = q.perguntas[i - 1];
  // "quebra" (opcional): as linhas definidas, no maior tamanho em que todas cabem
  if (p.quebra?.length) {
    const lines = p.quebra.map((l) => glue(plain(juntaChave(l))));
    if (lines.join(" ") !== glue(plain(juntaChave(p.titulo)))) throw new Error(`pergunta ${i}: a quebra não bate com o título`);
    const size = PERG_T.sizes.find((z) => lines.every((l) => fitWrap(l, W.black, LARG - 16, [z], 1).ok)) ?? 60;
    return { titulo: { size, lines, ok: true } };
  }
  return { titulo: fitWrap(glue(plain(juntaChave(p.titulo))), W.black, LARG - 16, PERG_T.sizes, 3) };
};

// ---------------------------------------------------------------- tempo
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const TAU = Math.PI * 2;
export const ease = Easing.inOut(Easing.cubic);
export const outBack = (u: number, k = 1.8) => { const c = k + 1; return 1 + c * Math.pow(u - 1, 3) + k * Math.pow(u - 1, 2); };
export const hop = (f: number, f0: number, dur: number) => (f < f0 || f > f0 + dur ? 0 : Math.sin((Math.PI * (f - f0)) / dur));
// periódica em D: começa (f = 0) em 0 e volta a 0 em D
export const onda = (f: number, D: number, ciclos: number, fase = 0) => Math.sin((TAU * ciclos * f) / D + fase);
export const FONTE = `${FONT}, "Noto Color Emoji"`;

// ---------------------------------------------------------------- fundo (raios girando 20° por lâmina = 1 raio: loop exato)
export const Fundo: React.FC<{ f: number; D: number; cy: number; cor: string; pts: Array<[number, number]>; seed: string }> = ({ f, D, cy, cor, pts, seed }) => (
  <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 38%, #FFF8EE 0%, ${C.creme} 55%, #F1E3D0 100%)`, overflow: "hidden" }}>
    <Sunburst frame={f} speed={20 / D} cx={540} cy={cy} color={cor} opacity={0.13} />
    <Brilhos f={f} D={D} pts={pts} seed={seed} />
  </AbsoluteFill>
);
export const Brilhos: React.FC<{ f: number; D: number; pts: Array<[number, number]>; seed: string; size?: number }> = ({ f, D, pts, seed, size = 32 }) => (
  <>
    {pts.map(([x, y], i) => {
      const ph = random(`${seed}-${i}`) * TAU;
      const ciclos = 1 + Math.floor(random(`${seed}-c-${i}`) * 3);
      const s = 0.45 + 0.55 * Math.max(0, onda(f, D, ciclos, ph));
      return (
        <div key={i} style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) scale(${s}) rotate(${(90 * f) / D}deg)` }}>
          <StarShape size={size} color={i % 3 === 1 ? C.coral : C.amarelo} />
        </div>
      );
    })}
  </>
);

// ---------------------------------------------------------------- selo em pílula: "QUIZ ·" + "MINEIRO RAIZ" em amarelo
export const IconeQuiz: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="0 0 24 24">
    <path d="M4 4 H20 Q22 4 22 6 V15 Q22 17 20 17 H11 L6 21 L7 17 H4 Q2 17 2 15 V6 Q2 4 4 4 Z" fill={C.amarelo} />
    <path d="M10 8.5 Q10 6.6 12 6.6 Q14 6.6 14 8.4 Q14 9.8 12.2 10.4 V11.6" stroke={C.coral} strokeWidth="1.8" strokeLinecap="round" fill="none" />
    <circle cx="12.2" cy="14" r="1.1" fill={C.coral} />
  </svg>
);
const Selo: React.FC<{ partes: [string, string]; s: number }> = ({ partes, s }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: s * 0.42, background: C.coral, borderRadius: 999, padding: `${s * 0.36}px ${s * 0.9}px ${s * 0.36}px ${s * 0.66}px`, boxShadow: `0 ${s * 0.19}px 0 ${C.coralDark}` }}>
    <IconeQuiz s={s * 1.35} />
    <span style={{ fontFamily: FONT, fontWeight: W.black, fontSize: s, lineHeight: 1, color: "#fff", letterSpacing: s * 0.05, whiteSpace: "nowrap" }}>{partes[0]} ·</span>
    <span style={{ fontFamily: FONT, fontWeight: W.black, fontSize: s, lineHeight: 1, color: C.amarelo, letterSpacing: s * 0.05, whiteSpace: "nowrap", textShadow: `0 ${s * 0.08}px 0 ${C.coralDark}` }}>{partes[1]}</span>
  </div>
);

// ---------------------------------------------------------------- o Pertim num sistema de coordenadas fixo
// O viewBox do componente muda com a pose ("parado" [0 18 240 270]; as outras [-20 6 280 284]). Para trocar de pose sem
// pulo, tudo aqui fica no sistema das outras poses (escala s = altura / 284): a pose "parado" é posicionada nele. Os
// acessórios (prancheta, lupa) são desenhados no mesmo sistema, ATRÁS do personagem (a luva fica por cima), com as
// mesmas transformações do corpo (inclinação da expressão, respiração e quique), para acompanhar a mão.
type Estado = { pose: Pose; expr: Expressao; rig: PertimRig };
const transfCorpo = (e: Estado) => {
  const x = pertimVals({ v: 1, pose: e.pose, expr: e.expr });
  const r = e.rig.respira ?? 0;
  const corpoT = r ? `translate(120 252) scale(${1 - r * 0.006} ${1 + r * 0.014}) translate(-120 -252)` : "";
  return `${x.charT} ${e.rig.quique ? `translate(0 ${e.rig.quique})` : ""} ${x.pinT} ${corpoT}`.trim();
};
export const PertimFixo: React.FC<Estado & { altura: number; tras?: React.ReactNode; style?: React.CSSProperties }> = ({ altura, tras, style, ...e }) => {
  const s = altura / 284, parado = e.pose === "parado";
  return (
    <div style={{ position: "absolute", width: 280 * s, height: altura, ...style }}>
      {tras && (
        <svg viewBox="-20 6 280 284" width={280 * s} height={altura} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <g transform={transfCorpo(e)}>{tras}</g>
        </svg>
      )}
      <div style={{ position: "absolute", left: parado ? 20 * s : 0, top: parado ? 12 * s : 0 }}>
        <Pertim v={1} pose={e.pose} expr={e.expr} altura={parado ? 270 * s : altura} rig={{ olhar: [0, 0], centro: true, ...e.rig }} />
      </div>
    </div>
  );
};

// a prancheta (mão esquerda, em 39 207) e a lupa (mão direita, em 201 207), no sistema do personagem
const Prancheta: React.FC = () => (
  <g transform="rotate(-10 30 206)">
    <rect x="-6" y="160" width="62" height="86" rx="8" fill="#B9773A" />
    <rect x="0" y="170" width="50" height="70" rx="4" fill="#FFFDF8" />
    <rect x="13" y="154" width="24" height="13" rx="4" fill="#8E949C" />
    <rect x="17" y="151" width="16" height="6" rx="3" fill="#B7BDC4" />
    {[184, 202, 220].map((y, i) => (
      <g key={y}>
        <path d={`M6 ${y} l4 4 l7 -8`} stroke={i === 2 ? C.coral : C.verde} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <rect x="22" y={y - 3} width="22" height="5" rx="2.5" fill="#D9CBBB" />
      </g>
    ))}
  </g>
);
const Lupa: React.FC<{ brilho: number }> = ({ brilho }) => (
  <g>
    <path d="M203 204 L219 178" stroke="#7A4A26" strokeWidth="9" strokeLinecap="round" />
    <path d="M203 204 L219 178" stroke="#A5683A" strokeWidth="4" strokeLinecap="round" />
    <circle cx="228" cy="160" r="21" fill="#CFE9F5" fillOpacity="0.55" />
    <clipPath id="lente"><circle cx="228" cy="160" r="19" /></clipPath>
    {/* o brilho que passa pela lente (0..1) */}
    {brilho > 0 && brilho < 1 && (
      <g clipPath="url(#lente)"><rect x={196 + brilho * 64} y="130" width="9" height="60" fill="#fff" opacity="0.85" transform={`rotate(25 ${200 + brilho * 64} 160)`} /></g>
    )}
    <path d="M214 150 Q218 142 227 140" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.9" />
    <circle cx="228" cy="160" r="21" fill="none" stroke={C.tinta} strokeWidth="6" />
    <circle cx="228" cy="160" r="24" fill="none" stroke={C.amarelo} strokeWidth="2" opacity="0.9" />
  </g>
);

// ---------------------------------------------------------------- peças da capa
const BalaoQ: React.FC<{ x: number; y: number; r: number; bg: string; fg: string; rot?: number; ch?: string }> = ({ x, y, r, bg, fg, rot = 0, ch = "?" }) => (
  <svg style={{ position: "absolute", left: x - r * 1.2, top: y - r * 1.3, overflow: "visible" }} width={r * 2.4} height={r * 2.6} viewBox={`${-r * 1.2} ${-r * 1.3} ${r * 2.4} ${r * 2.6}`}>
    <g transform={`rotate(${rot})`}>
      <path transform={`translate(0 ${r * 0.1})`} d={`M${-r} ${-r * 0.55} Q${-r} ${-r * 0.85} ${-r * 0.7} ${-r * 0.85} H${r * 0.7} Q${r} ${-r * 0.85} ${r} ${-r * 0.55} V${r * 0.45} Q${r} ${r * 0.75} ${r * 0.7} ${r * 0.75} H${-r * 0.1} L${-r * 0.5} ${r * 1.15} L${-r * 0.42} ${r * 0.75} H${-r * 0.7} Q${-r} ${r * 0.75} ${-r} ${r * 0.45} Z`} fill="#000" opacity="0.10" />
      <path d={`M${-r} ${-r * 0.55} Q${-r} ${-r * 0.85} ${-r * 0.7} ${-r * 0.85} H${r * 0.7} Q${r} ${-r * 0.85} ${r} ${-r * 0.55} V${r * 0.45} Q${r} ${r * 0.75} ${r * 0.7} ${r * 0.75} H${-r * 0.1} L${-r * 0.5} ${r * 1.15} L${-r * 0.42} ${r * 0.75} H${-r * 0.7} Q${-r} ${r * 0.75} ${-r} ${r * 0.45} Z`} fill={bg} />
      <text x="0" y={r * 0.4} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={r * 1.2} fill={fg}>{ch}</text>
    </g>
  </svg>
);
// a xícara de café (fumaça em loop) e o prato de pão de queijo; (x, y) = o centro da base
const Xicara: React.FC<{ x: number; y: number; s: number; f: number; D: number }> = ({ x, y, s, f, D }) => (
  <svg style={{ position: "absolute", left: x - 90 * s, top: y - 170 * s, overflow: "visible" }} width={180 * s} height={180 * s} viewBox="-90 -170 180 180">
    {[0, 1, 2].map((i) => {
      const u = ((f / D) * 3 + i / 3) % 1;   // a fumaça sobe em loop (3 voltas por lâmina)
      return <path key={i} d={`M${-18 + i * 18} ${-74 - u * 40} c-10 -12 10 -20 0 -34`} stroke="#B7A79A" strokeWidth="6" strokeLinecap="round" fill="none" opacity={Math.sin(Math.PI * u) * 0.9} />;
    })}
    <ellipse cx="0" cy="-4" rx="70" ry="13" fill={C.cremeDeep} />
    <ellipse cx="0" cy="-8" rx="64" ry="11" fill="#fff" />
    <path d="M42 -58 a17 17 0 0 1 0 32" stroke="#fff" strokeWidth="10" fill="none" />
    <path d="M42 -58 a17 17 0 0 1 0 32" stroke={C.cremeDeep} strokeWidth="3" fill="none" />
    <path d="M-44 -72 H44 Q42 -14 0 -14 Q-42 -14 -44 -72 Z" fill="#fff" stroke={C.cremeDeep} strokeWidth="3" />
    <path d="M-42.6 -56 H42.6 L41 -45 H-41 Z" fill={C.coral} />
    <ellipse cx="0" cy="-72" rx="44" ry="8" fill="#6B3A1E" />
  </svg>
);
const PaoDeQueijo: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <svg style={{ position: "absolute", left: x - 100 * s, top: y - 120 * s, overflow: "visible" }} width={200 * s} height={130 * s} viewBox="-100 -120 200 130">
    <ellipse cx="0" cy="-4" rx="96" ry="18" fill={C.cremeDeep} />
    <ellipse cx="0" cy="-9" rx="92" ry="16" fill="#fff" />
    {[[-40, -30, 30], [36, -30, 30], [-2, -46, 32], [-20, -66, 26], [22, -64, 26]].map(([px, py, r], i) => (
      <g key={i}>
        <ellipse cx={px} cy={py + 4} rx={r} ry={r * 0.82} fill="#D7962F" />
        <ellipse cx={px} cy={py} rx={r} ry={r * 0.82} fill="#F2C063" />
        <ellipse cx={px - r * 0.3} cy={py - r * 0.3} rx={r * 0.35} ry={r * 0.18} fill="#FFE6A6" />
        <circle cx={px + r * 0.3} cy={py + r * 0.1} r="2.4" fill="#C47E1E" opacity="0.6" />
      </g>
    ))}
  </svg>
);

// ================================================================ LÂMINA 1: a capa (quadro 0 = capa da grade)
const Capa: React.FC<QuizProps & { f: number; D: number }> = ({ selo, capa, layout, f, D, semFundo }) => {
  const t = layout!.titulo, th = t.lines.length * t.size * 1.12;
  const altura = 500, s = altura / 284;
  const px = 540 - 140 * s, py = 792 - 270 * s;               // o Pertim centrado, com o pé (y 276 do desenho) em y 792
  const balanco = 1.4 * onda(f, D, 1);                        // balanço leve a partir do pé
  const brilho = clamp01((f - 0.55 * D) / (0.16 * D));
  const flecha = 10 * (1 - Math.cos((TAU * 4 * f) / D)) / 2;
  const bob = (c: number, fase: number, a = 9) => a * (onda(f, D, c, fase) - Math.sin(fase));   // quadro 0 = posição da capa
  return (
    <AbsoluteFill>
      {!semFundo && <Fundo f={f} D={D} cy={560} cor={C.amarelo} seed="quiz-capa" pts={[[170, 300], [915, 330], [160, 760], [925, 720], [190, 1250], [890, 1260]]} />}
      {/* halo atrás do Pertim */}
      <div style={{ position: "absolute", left: 540 - 380, top: 560 - 380, width: 760, height: 760, borderRadius: "50%", background: `radial-gradient(circle, ${C.amareloLight}77 0%, ${C.amareloLight}00 68%)` }} />
      <div style={{ position: "absolute", top: 132 - 60, left: 0, right: 0, height: 120, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Selo partes={selo} s={40} />
      </div>
      <div style={{ position: "absolute", left: 0, top: bob(2, 0.6) }}><BalaoQ x={262} y={372} r={62} bg={C.coral} fg="#fff" rot={-10} /></div>
      <div style={{ position: "absolute", left: 0, top: bob(2, 2.4) }}><BalaoQ x={818} y={350} r={54} bg={C.verde} fg="#fff" rot={9} /></div>
      <div style={{ position: "absolute", left: 0, top: bob(3, 4.1, 7) }}><BalaoQ x={872} y={560} r={36} bg={C.amarelo} fg={C.tinta} rot={-6} ch="!" /></div>
      <Xicara x={258} y={790} s={0.95} f={f} D={D} />
      <PaoDeQueijo x={806} y={792} s={0.95} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1440, transform: `rotate(${balanco}deg)`, transformOrigin: `540px 792px` }}>
        <PertimFixo
          altura={altura} pose="parado" expr="curioso" style={{ left: px, top: py }}
          rig={{ respira: onda(f, D, 2), capacete: 0.8 * onda(f, D, 2, -0.7), piscada: piscadaEm([(0.36 * D) / 30, (0.8 * D) / 30], f / 30) }}
          tras={<><Prancheta /><Lupa brilho={brilho} /></>}
        />
      </div>
      <div style={{ position: "absolute", top: CAPA_T.cy - th / 2, left: SAFE.x0, width: LARG }}>
        <Text source={glue(capa.titulo.join(" "))} wrapped={t} weight={W.black} />
      </div>
      <div style={{ position: "absolute", top: CAPA_T.cy + th / 2 + 52, left: SAFE.x0, width: LARG, textAlign: "center", fontFamily: FONTE, fontWeight: W.medium, fontSize: 40, color: C.tinta, letterSpacing: -0.3, whiteSpace: "nowrap" }}>
        {capa.rodape.replace(/\s*→$/, "")} <span style={{ display: "inline-block", transform: `translateX(${flecha}px)` }}>→</span>
      </div>
    </AbsoluteFill>
  );
};

// ================================================================ LÂMINAS 2..7: as perguntas
const REV = 2.5;     // s: a resposta raiz acende
const VOLTA = 6.2;   // s: começa a volta ao estado inicial (termina 0,7 s depois, antes do fim da lâmina)

const Cabecalho: React.FC<{ selo: [string, string]; n?: number; total?: number }> = ({ selo, n, total }) => (
  <>
    <div style={{ position: "absolute", left: SAFE.x0, top: 130 - 40, height: 80, display: "flex", alignItems: "center" }}>
      <Selo partes={selo} s={30} />
    </div>
    {n ? (
      <div style={{ position: "absolute", right: 1080 - SAFE.x1, top: 130 - 40, height: 80, display: "flex", alignItems: "center", fontFamily: FONT, fontWeight: W.black, fontSize: 60, letterSpacing: -1, lineHeight: 1 }}>
        <span style={{ color: C.coral }}>{n}</span><span style={{ color: C.tinta, opacity: 0.4 }}>/{total}</span>
      </div>
    ) : null}
  </>
);

const Check: React.FC<{ size: number; k: number; desenho: number }> = ({ size, k, desenho }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" style={{ transform: `scale(${k})`, overflow: "visible" }}>
    <circle cx="40" cy="44" r="38" fill={C.verdeDark} />
    <circle cx="40" cy="40" r="38" fill={C.verde} />
    <path d="M22 41 L35 54 L59 28" stroke="#fff" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - desenho} />
  </svg>
);

const Cartao: React.FC<{ letra: string; r: Resposta; certo: boolean; acende: number; pulo: number; check: number; desenho: number }> = ({ letra, r, certo, acende, pulo, check, desenho }) => {
  const a = certo ? acende : 0, e = certo ? 0 : acende;
  const mix = (c0: string, c1: string, u: number) => {
    const h = (c: string, i: number) => parseInt(c.slice(1 + 2 * i, 3 + 2 * i), 16);
    return `rgb(${[0, 1, 2].map((i) => Math.round(h(c0, i) + (h(c1, i) - h(c0, i)) * u)).join(",")})`;
  };
  return (
    <div style={{
      position: "relative", width: LARG, minHeight: 168, boxSizing: "border-box", display: "flex", alignItems: "center", gap: 26,
      padding: "28px 112px 28px 26px", borderRadius: 34, background: mix("#FFFFFF", "#EAF6EA", a),
      border: `6px solid ${mix("#EADBC6", C.verde, a)}`, boxShadow: `0 9px 0 ${mix("#E2CDB2", C.verdeDark, a)}`,
      opacity: 1 - 0.55 * e, filter: e > 0 ? `grayscale(${0.7 * e})` : undefined,
      transform: `translateY(${-30 * pulo}px) scale(${1 - 0.03 * e})`,
    }}>
      <div style={{ flex: "none", width: 88, height: 88, borderRadius: "50%", background: mix(C.tinta, C.verde, a), display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontWeight: W.black, fontSize: 50, color: "#fff", lineHeight: 1 }}>
        <span style={{ marginTop: 4 }}>{letra}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: FONTE, fontWeight: W.extraBold, fontSize: 48, lineHeight: 1.16, color: C.tinta, letterSpacing: -0.6, textWrap: "balance" } as React.CSSProperties}>{glue(r.texto)}</div>
        {r.nota && <div style={{ marginTop: 6, fontFamily: FONTE, fontWeight: W.medium, fontSize: 34, lineHeight: 1.2, color: "#7A6B60" }}>{r.nota}</div>}
      </div>
      {certo && check > 0 && (
        <div style={{ position: "absolute", right: 22, top: "50%", marginTop: -40 }}>
          <Check size={80} k={check} desenho={desenho} />
        </div>
      )}
    </div>
  );
};

// as estrelinhas que saem do check na hora que acende (dur ≈ 0,6 s)
const Estouro: React.FC<{ u: number; cx: number; cy: number }> = ({ u, cx, cy }) =>
  u <= 0 || u >= 1 ? null : (
    <>
      {Array.from({ length: 8 }).map((_, i) => {
        const ang = Math.PI / 2 + (i / 7) * Math.PI, d = 44 + 100 * Easing.out(Easing.cubic)(u);   // só para a esquerda, cima e baixo: nada passa de x 945
        const sz = (i % 2 ? 26 : 34) * (1 - u * 0.6);
        return (
          <div key={i} style={{ position: "absolute", left: cx + Math.cos(ang) * d, top: cy + Math.sin(ang) * d, transform: `translate(-50%,-50%) rotate(${u * 160}deg)`, opacity: 1 - u }}>
            <StarShape size={sz} color={i % 3 === 0 ? C.coral : i % 3 === 1 ? C.amarelo : C.verde} />
          </div>
        );
      })}
    </>
  );

const LaminaPergunta: React.FC<QuizProps & { f: number; D: number }> = ({ selo, perguntas, lamina, layout, f, D, semFundo }) => {
  const p = perguntas[lamina - 1];
  const fps = QUIZ.fps, t = f / fps, R = REV * fps, V = VOLTA * fps, VD = 0.7 * fps;
  // o envelope da resposta: 0 até REV, sobe em 0,3 s, fica, e volta a 0 entre VOLTA e VOLTA + 0,7 s
  const acende = f < R ? 0 : f < V ? Easing.out(Easing.cubic)(clamp01((f - R) / 9)) : 1 - ease(clamp01((f - V) / VD));
  const pulo = hop(f, R, 12) * (f < R + 12 ? 1 : 0);
  const check = f < R ? 0 : f < V ? outBack(clamp01((f - R) / 10), 2.2) : 1 - ease(clamp01((f - V) / (VD * 0.7)));
  const desenho = clamp01((f - R - 3) / 8);
  const espera = f < R ? clamp01((f - 6) / (R - 6)) : 0;            // a barrinha "Qual é a raiz?" enche até REV
  const wt = layout!.titulo, th = wt.lines.length * wt.size * 1.12;
  // o Pertim: sorrindo e parado; na resposta, piscadinha + a reação; volta (com uma piscada escondendo a troca)
  const reagindo = f >= R && f < V + 2;
  const reacao: Pose = p.reacao === "comemora" ? "comemorando" : "apontando";
  const pose: Pose = reagindo ? reacao : "parado";
  const tVolta = (V + 6) / fps;
  const expr: Expressao = f >= R && f / fps < tVolta ? "piscadinha" : "sorrindo";
  const braco = f >= R && f < R + 6 ? { de: "parado" as Pose, u: (f - R) / 6 } : f >= V + 2 && f < V + 8 ? { de: reacao, u: (f - V - 2) / 6 } : undefined;
  const quique = -24 * hop(f, R, 11) - (p.reacao === "comemora" ? 12 * hop(f, R + 13, 9) : 0) + (pose === "comemorando" ? 14 : 0);
  const aceno = p.reacao === "aponta" && reagindo ? ((p.certa ?? "b") === "a" ? -63 : -50) + 6 * Math.sin((f - R) * 0.35) * Math.exp(-(f - R) * 0.06) : 0;
  const rig: PertimRig = {
    respira: onda(f, D, 3), capacete: 0.8 * onda(f, D, 3, -0.7) + 3 * hop(f, R, 14),
    piscada: piscadaEm([1.3, tVolta - 0.08], t), quique, aceno, braco,
  };
  // a fala do Pertim (balão) entra com a resposta; a barrinha sai
  const balao = f < R + 3 ? 0 : f < V ? outBack(clamp01((f - R - 3) / 9), 1.6) : 1 - ease(clamp01((f - V) / (VD * 0.6)));
  return (
    <AbsoluteFill>
      {!semFundo && <Fundo f={f} D={D} cy={760} cor={C.amarelo} seed={`quiz-p${lamina}`} pts={[[905, 250], [160, 520], [930, 1040], [500, 1380]]} />}
      <Cabecalho selo={selo} n={lamina} total={perguntas.length} />
      <div style={{ position: "absolute", left: SAFE.x0 + 8, width: LARG - 16, top: (PERG_T.y0 + PERG_T.y1) / 2 - th / 2 }}>   {/* +8: o marcador passa um pouco da 1ª letra */}
        <Text source={glue(juntaChave(p.titulo))} wrapped={wt} weight={W.black} align="left" />
      </div>
      <div style={{ position: "absolute", left: SAFE.x0, top: 540, width: LARG, display: "flex", flexDirection: "column", gap: 30 }}>
        {(["a", "b"] as const).map((k) => {
          const certo = (p.certa ?? "b") === k;
          return (
            <div key={k} style={{ position: "relative" }}>
              <Cartao letra={k.toUpperCase()} r={p[k]} certo={certo} acende={acende} pulo={certo ? pulo : 0} check={certo ? check : 0} desenho={certo ? desenho : 0} />
              {certo && (
                <div style={{ position: "absolute", left: 0, top: "50%", width: LARG, height: 0, transform: `translateY(${-30 * pulo}px)` }}>
                  <Estouro u={(f - R - 2) / 18} cx={LARG - 62} cy={0} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* embaixo: o Pertim à esquerda; à direita, a barrinha de espera e, depois, o balão com a fala dele */}
      <PertimFixo altura={370} pose={pose} expr={expr} rig={rig} style={{ left: 116, top: 1376 - 270 * (370 / 284) }} />
      <div style={{ position: "absolute", left: 470, width: SAFE.x1 - 470, top: 1150, opacity: 1 - acende }}>
        <div style={{ fontFamily: FONT, fontWeight: W.extraBold, fontSize: 40, color: C.tinta, letterSpacing: -0.4 }}>Qual é a raiz?</div>
        <div style={{ marginTop: 16, height: 18, borderRadius: 9, background: C.cremeDeep, overflow: "hidden" }}>
          <div style={{ width: `${espera * 100}%`, height: "100%", borderRadius: 9, background: C.coral }} />
        </div>
      </div>
      {balao > 0 && (
        <div style={{ position: "absolute", left: 470, width: SAFE.x1 - 470, top: 1112, height: 170, display: "flex", alignItems: "center", transform: `translateY(${-14 * Math.max(0, balao - 1) * 6}px) scale(${Math.min(1, balao)})`, transformOrigin: "0% 70%", opacity: Math.min(1, balao * 2) }}>
          <svg width={40} height={44} viewBox="0 0 40 44" style={{ position: "absolute", left: -30, top: 96 }}><path d="M40 0 L0 30 L40 40 Z" fill="#fff" /></svg>
          <div style={{ width: "100%", boxSizing: "border-box", padding: "26px 30px", borderRadius: 36, background: "#fff", boxShadow: `0 9px 0 ${C.cremeDeep}`, fontFamily: FONTE, fontWeight: W.black, fontSize: 44, lineHeight: 1.12, letterSpacing: -0.6, color: C.tinta, textAlign: "center", textWrap: "balance" } as React.CSSProperties}>
            {p.fala}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ================================================================ LÂMINA 8: o resultado
const COR_FAIXA = [
  { bg: C.verde, sombra: C.verdeDark, fg: "#fff" },
  { bg: C.amarelo, sombra: C.amareloDark, fg: C.tinta },
  { bg: C.coral, sombra: C.coralDark, fg: "#fff" },
];
const Confete: React.FC<{ f: number; D: number }> = ({ f, D }) => (
  <>
    {Array.from({ length: 22 }).map((_, i) => {
      const r = (k: string) => random(`quiz-conf-${i}-${k}`);
      const voltas = 1 + Math.floor(r("v") * 2), u = ((f / D) * voltas + r("f")) % 1;
      const x = 160 + r("x") * 760 + 18 * Math.sin(TAU * (u * 2 + r("o")));
      const y = -60 + u * 1560;
      const cor = [C.coral, C.amarelo, C.verde, C.coralLight][i % 4];
      return <div key={i} style={{ position: "absolute", left: x, top: y, width: 14, height: 24, borderRadius: 4, background: cor, opacity: 0.7, transform: `rotate(${r("r") * 360 + 360 * voltas * (f / D)}deg)` }} />;
    })}
  </>
);
const LaminaResultado: React.FC<QuizProps & { f: number; D: number }> = ({ selo, resultado, layout, f, D, semFundo }) => {
  const wt = layout!.titulo, th = wt.size * 1.12;
  const n = resultado.faixas.length, per = D / n;
  const destaque = (i: number) => Math.pow(Math.sin(Math.PI * clamp01((f - i * per) / per)), 2);
  const hops = -26 * hop(f, 0.12 * D, 11) - 12 * hop(f, 0.12 * D + 12, 8) - 26 * hop(f, 0.62 * D, 11) - 12 * hop(f, 0.62 * D + 12, 8);
  const dedo = 7 * (1 - Math.cos((TAU * 4 * f) / D)) / 2;
  return (
    <AbsoluteFill>
      {!semFundo && <Fundo f={f} D={D} cy={1060} cor={C.amarelo} seed="quiz-res" pts={[[170, 860], [930, 840]]} />}
      {!semFundo && <Confete f={f} D={D} />}
      <div style={{ position: "absolute", top: 130 - 40, left: 0, right: 0, height: 80, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Selo partes={selo} s={30} />
      </div>
      <div style={{ position: "absolute", left: SAFE.x0, width: LARG, top: RES_T.cy - th / 2 }}>
        <Text source={glue(resultado.titulo)} wrapped={wt} weight={W.black} />
      </div>
      <div style={{ position: "absolute", left: SAFE.x0, top: 352, width: LARG, display: "flex", flexDirection: "column", gap: 22 }}>
        {resultado.faixas.map((fx, i) => {
          const d = destaque(i), c = COR_FAIXA[i % 3];
          const grande = fx.nota.replace(/^até /, "");
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 28, height: 136, boxSizing: "border-box", padding: "0 30px 0 14px", borderRadius: 32, background: "#fff", border: "5px solid #EADBC6", boxShadow: `0 ${8 + 4 * d}px 0 #E2CDB2`, transform: `translateY(${-8 * d}px)` }}>
              <div style={{ flex: "none", width: 190, height: 104, borderRadius: 24, background: c.bg, boxShadow: `0 6px 0 ${c.sombra}`, color: c.fg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transform: `rotate(${-3 * d}deg)` }}>
                <div style={{ fontFamily: FONT, fontWeight: W.black, lineHeight: 1, letterSpacing: -1, display: "flex", alignItems: "baseline", gap: 8 }}>
                  {fx.nota.startsWith("até ") && <span style={{ fontSize: 30 }}>até</span>}
                  <span style={{ fontSize: 56 }}>{fx.nota.startsWith("até ") ? grande : fx.nota}</span>
                </div>
                <div style={{ fontFamily: FONT, fontWeight: W.extraBold, fontSize: 26, lineHeight: 1, marginTop: 4, letterSpacing: 0.5 }}>ACERTOS</div>
              </div>
              <div style={{ flex: 1, fontFamily: FONTE, fontWeight: W.extraBold, fontSize: 40, lineHeight: 1.15, color: C.tinta, letterSpacing: -0.4, textWrap: "balance" } as React.CSSProperties}>{glue(fx.texto)}</div>
            </div>
          );
        })}
      </div>
      {/* o Pertim comemorando e o balão do CTA */}
      <PertimFixo altura={392} pose="comemorando" expr="sorrindo" style={{ left: 118, top: 1262 - 270 * (392 / 284) }}
        rig={{ respira: onda(f, D, 4), capacete: 0.8 * onda(f, D, 4, -0.7) + 3 * hop(f, 0.12 * D, 14) + 3 * hop(f, 0.62 * D, 14), piscada: piscadaEm([(0.4 * D) / 30, (0.88 * D) / 30], f / 30), quique: 14 + hops }} />
      <div style={{ position: "absolute", left: 478, width: SAFE.x1 - 478, top: 880, height: 330, display: "flex", alignItems: "center" }}>
        <svg width={44} height={50} viewBox="0 0 44 50" style={{ position: "absolute", left: -32, top: 190 }}><path d="M44 0 L0 34 L44 46 Z" fill={C.coral} /></svg>
        <div style={{ width: "100%", boxSizing: "border-box", padding: "30px 32px", borderRadius: 38, background: C.coral, boxShadow: `0 9px 0 ${C.coralDark}`, fontFamily: FONTE, fontWeight: W.extraBold, fontSize: 42, lineHeight: 1.18, letterSpacing: -0.4, color: "#fff", textWrap: "balance" } as React.CSSProperties}>
          {(() => {
            const [antes, depois = ""] = resultado.cta.split(/ *👇/);
            const k = antes.lastIndexOf(" ");
            return (<>
              {antes.slice(0, k + 1)}
              <span style={{ whiteSpace: "nowrap" }}>{antes.slice(k + 1)}{" "}<span style={{ display: "inline-block", transform: `translateY(${dedo}px)` }}>👇</span></span>
              <br />{depois.trim()}
            </>);
          })()}
        </div>
      </div>
      {/* a assinatura: a logo redonda (PNG sem fundo) e "Tudo pertim de você" */}
      <div style={{ position: "absolute", left: SAFE.x0, width: LARG, top: 1296, height: 84, display: "flex", alignItems: "center", justifyContent: "center", gap: 18 }}>
        <Img src={staticFile("pedir-no-uaipertim/logo/logo-selo-transparente.png")} style={{ width: 80, height: 80, objectFit: "contain", filter: "drop-shadow(0 4px 8px rgba(198,58,23,0.22))" }} />
        <span style={{ fontFamily: FONT, fontWeight: W.extraBold, fontSize: 36, color: C.tinta, letterSpacing: -0.4, whiteSpace: "nowrap" }}>
          {resultado.assinatura.split(/(pertim)/).map((s, i) => (s === "pertim" ? <span key={i} style={{ color: C.coral }}>{s}</span> : <React.Fragment key={i}>{s}</React.Fragment>))}
        </span>
      </div>
    </AbsoluteFill>
  );
};

// ================================================================ a composição: uma lâmina por render (prop `lamina`, 0..7)
export const QuizMineiro: React.FC<QuizProps> = (props) => {
  const frame = useCurrentFrame();
  const D = duracaoLamina(props, props.lamina);
  const f = ((frame % D) + D) % D;
  const tipo = tipoLamina(props, props.lamina);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {tipo === "capa" && <Capa {...props} f={f} D={D} />}
      {tipo === "pergunta" && <LaminaPergunta {...props} f={f} D={D} />}
      {tipo === "resultado" && <LaminaResultado {...props} f={f} D={D} />}
    </AbsoluteFill>
  );
};
