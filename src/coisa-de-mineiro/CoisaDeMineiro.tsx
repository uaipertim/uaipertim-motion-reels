import React from "react";
import { AbsoluteFill, Img, interpolate, interpolateColors, random, staticFile, useCurrentFrame } from "remotion";
import { C, FONT, W } from "../config/theme";
import { Pertim, PertimRig } from "../personagem/Pertim";
import { COR as PC } from "../personagem/logica";
import type { Expressao, Pose } from "../personagem/logica";
import { Legenda, LegendaDados } from "../personagem/Legenda";
import { bocaNoQuadro, piscadaEm, respiracao, Visemas } from "../personagem/rig";
import { clamp01, inCubic, inOut, outBack, outCubic } from "../pedir-no-uaipertim/efeitos";
import LAYOUT from "../../reels/coisa-de-mineiro/layout.json";

// SÉRIE "COISA DE MINEIRO" (1080×1920, 30 fps): humor de situação que todo mineiro reconhece. UMA composição para todos
// os episódios: os dados de cada um (cenas, diagramas com os tempos das palavras, boca, legenda) vêm de
// public/coisa-de-mineiro/<ep>/dados.json (reels/coisa-de-mineiro/scripts/preparar.py), lido no calculateMetadata.
// Identidade: selo-adesivo "COISA DE MINEIRO #NN" (verde e amarelo), cenário de interior no estilo flat das lojinhas
// (estrada de terra, cerca, porteira, mata-burro, vaca, pé de manga, morro, céu aberto), o Pertim no papel do mineiro.
// Nada de celular, telas do app, "em breve" ou "tá chegando"; a marca só nos últimos segundos (logo pequena +
// "Tudo pertim de você.").
// Cenas (o "tipo" de cada capítulo no roteiro):
//   pergunta — o visitante (um pin genérico azul, com o mapa na mão) chega e fica perdido; o Pertim fala com o público;
//   resposta — o Pertim aponta a estrada, tranquilo (olhando para o visitante; em "camera", para a câmera);
//   caminho  — a câmera segue o visitante pela estrada que não acaba: cada objeto (porteira, mangueira, mata-burro, vaca)
//              passa na palavra dele, as placas de km pulam, e no "segue" o passo acelera e o dia vira tarde;
//   chegada  — de noite, o visitante chega exausto; o Pertim já está lá, de chinelo, tomando café;
//   fecho    — o Pertim mais perto, piscando para a câmera; nos "marca_s" segundos finais, a logo e "Tudo pertim de você.".
// Cena nova (para outros episódios) = um bloco novo aqui + o tipo no roteiro; o resto (selo, legenda, boca, marca) vem sozinho.

const L = LAYOUT as typeof LAYOUT;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const entre = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const mola = (t: number, t0: number, dur = 0.35, s = 1.9) => (t < t0 ? 0 : outBack((t - t0) / dur, s));
const CHAO = L.chao, HOR = L.horizonte;
const VERDE = "#3E9E4E", AMARELO = "#F9B233";

type Em = { em: string; t: number };
type Cena = { n: number; tipo: string; t0: number; t1: number; voz_t0: number; voz_t1: number; texto: string; diagrama: Record<string, any> };
export type DadosEpisodio = {
  ep: string; numero: number; titulo: string; capa?: { titulo: string[] }; duracao: number; fps: number; quadros: number; batida: number;
  cenas: Cena[]; marca_t: number; piscadas: number[]; piscada_dur: number; visemas: string; legenda: LegendaDados;
};
export type CoisaDeMineiroProps = { ep: string; dados?: DadosEpisodio };

// ================================================================ o selo da série (adesivo verde e amarelo)
export const SeloSerie: React.FC<{ numero: number; size?: number; e?: number; style?: React.CSSProperties }> = ({ numero, size = 40, e = 1, style }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: size * 0.35, padding: `${size * 0.3}px ${size * 0.6}px ${size * 0.34}px ${size * 0.45}px`, background: VERDE, borderRadius: size * 0.5,
    border: `${size * 0.16}px solid #fff`, boxShadow: `0 ${size * 0.18}px 0 rgba(34,28,25,0.22), 0 ${size * 0.3}px ${size * 0.6}px rgba(34,28,25,0.18)`,
    transform: `scale(${e}) rotate(${L.selo.rot}deg)`, transformOrigin: "20% 50%", ...style }}>
    {/* o montinho com o sol: o "interior" */}
    <svg width={size * 1.15} height={size * 1.15} viewBox="0 0 24 24">
      <circle cx={15.5} cy={8} r={4.2} fill={AMARELO} />
      <path d="M1 20 Q7 10 13 16 Q17 12 23 20 Z" fill="#fff" opacity={0.95} />
    </svg>
    <span style={{ fontFamily: FONT, fontWeight: W.black, fontSize: size, lineHeight: 1, color: "#fff", letterSpacing: size * 0.04, whiteSpace: "nowrap" }}>COISA DE MINEIRO</span>
    <span style={{ fontFamily: FONT, fontWeight: W.black, fontSize: size * 1.25, lineHeight: 1, color: AMARELO, letterSpacing: -1, whiteSpace: "nowrap", textShadow: `0 ${size * 0.08}px 0 #2D7A3A` }}>
      #{String(numero).padStart(2, "0")}
    </span>
  </div>
);

// ================================================================ o cenário
// hora: 0 = dia, 1 = fim de tarde, 2 = noite
const corCeu = (hora: number): [string, string] => [
  interpolateColors(hora, [0, 0.5, 1, 2], ["#7FCBEF", "#F6C98A", "#F28C5B", "#16213E"]),
  interpolateColors(hora, [0, 0.5, 1, 2], ["#FFF3D6", "#FFE9B8", "#FFD89A", "#3A4F82"]),
];
const Ceu: React.FC<{ hora: number; t: number }> = ({ hora, t }) => {
  const [a, b] = corCeu(hora);
  const sol = Math.max(0, 1 - hora);
  const lua = clamp01(hora - 1.2);
  return (
    <>
      <AbsoluteFill style={{ background: `linear-gradient(to bottom, ${a} 0%, ${b} ${(HOR / 1920) * 100 + 4}%)` }} />
      {sol > 0 && <div style={{ position: "absolute", left: 790, top: 560 + hora * 380, width: 150, height: 150, borderRadius: "50%", background: interpolateColors(hora, [0, 1], ["#FFE27A", "#FFB15C"]),
        boxShadow: `0 0 80px 30px rgba(255,214,120,${0.5 * sol})` }} />}
      {lua > 0 && (
        <>
          {Array.from({ length: 28 }).map((_, i) => {
            const x = random(`est-x-${i}`) * 1080, y = 240 + random(`est-y-${i}`) * 700, s = 3 + random(`est-s-${i}`) * 5;
            const br = 0.5 + 0.5 * Math.sin(t * 3 + i);
            return <div key={i} style={{ position: "absolute", left: x, top: y, width: s, height: s, borderRadius: "50%", background: "#FFF6D8", opacity: lua * (0.4 + 0.6 * br) }} />;
          })}
          <div style={{ position: "absolute", left: 770, top: 400, width: 150, height: 150, borderRadius: "50%", background: "#FFF3C4", opacity: lua, boxShadow: `0 0 70px 20px rgba(255,243,196,${0.35 * lua})` }}>
            <div style={{ position: "absolute", left: 30, top: 40, width: 26, height: 26, borderRadius: "50%", background: "#EADFB0" }} />
            <div style={{ position: "absolute", left: 82, top: 82, width: 18, height: 18, borderRadius: "50%", background: "#EADFB0" }} />
          </div>
        </>
      )}
    </>
  );
};
const Nuvens: React.FC<{ off: number; hora: number }> = ({ off, hora }) => (
  <>
    {[[160, 560, 1.0], [640, 470, 0.8], [1180, 600, 1.1], [1700, 520, 0.9]].map(([x, y, s], i) => {
      const xx = ((((x - off * 0.12) % 2200) + 2200) % 2200) - 400;
      return (
        <svg key={i} width={260 * s} height={110 * s} viewBox="0 0 260 110" style={{ position: "absolute", left: xx, top: y, opacity: 0.9 - 0.45 * Math.min(1, hora) }}>
          <path d="M30 95 Q0 95 6 70 Q12 48 40 52 Q48 18 90 22 Q118 0 150 22 Q190 14 200 48 Q240 44 250 72 Q256 95 226 95 Z" fill={hora > 1.5 ? "#4A5A86" : "#fff"} />
        </svg>
      );
    })}
  </>
);
// os morros, em 3 camadas com parallax
const Morros: React.FC<{ off: number; hora: number }> = ({ off, hora }) => {
  const esc = (c: string) => interpolateColors(hora, [0, 1, 2], [c, c, "#22304F"]);
  const camada = (k: number, cor: string, y: number, amp: number, per: number, par: number) => {
    const x0 = -((off * par) % per) - per;
    const pts: string[] = [];
    for (let x = x0; x <= 1080 + per; x += 20) pts.push(`${x},${y - amp * (0.5 + 0.5 * Math.sin((x + off * par) / per * Math.PI * 2 + k))}`);
    return <path key={k} d={`M${x0},1920 L${pts.join(" L")} L${1080 + per},1920 Z`} fill={esc(cor)} />;
  };
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
      {camada(1, interpolateColors(hora, [0, 1], ["#A9D68A", "#C9A26E"]), HOR - 60, 120, 900, 0.15)}
      {camada(2, interpolateColors(hora, [0, 1], ["#8CC56A", "#A88E58"]), HOR + 10, 90, 640, 0.3)}
      {camada(3, interpolateColors(hora, [0, 1], ["#6FAF55", "#8A7A48"]), HOR + 90, 50, 480, 0.55)}
    </svg>
  );
};
// a estrada de terra, o capim e a cerca de madeira (rolam com a câmera)
const Estrada: React.FC<{ off: number; hora: number }> = ({ off, hora }) => {
  const noite = clamp01(hora - 1);
  const capim = interpolateColors(hora, [0, 1, 2], ["#7DBB57", "#8F9A4E", "#2C3F3A"]);
  const terra = interpolateColors(hora, [0, 1, 2], ["#E2B27A", "#D49866", "#5B4A52"]);
  const terra2 = interpolateColors(hora, [0, 1, 2], ["#C98B52", "#B97A48", "#463A44"]);
  const madeira = interpolateColors(hora, [0, 1, 2], ["#9A6A3A", "#8A5C34", "#3E3238"]);
  const passo = 170, x0 = -(off % passo);
  return (
    <>
      <div style={{ position: "absolute", left: 0, top: HOR + 120, width: 1080, height: 1920 - HOR - 120, background: capim }} />
      {/* a cerca do outro lado da estrada */}
      <svg width={1080} height={200} style={{ position: "absolute", left: 0, top: CHAO - 330 }}>
        {Array.from({ length: 9 }).map((_, i) => <rect key={i} x={x0 + i * passo} y={20} width={16} height={130} rx={4} fill={madeira} />)}
        <rect x={0} y={50} width={1080} height={12} rx={6} fill={madeira} />
        <rect x={0} y={95} width={1080} height={12} rx={6} fill={madeira} />
      </svg>
      <div style={{ position: "absolute", left: 0, top: CHAO - 150, width: 1080, height: 190, background: terra, borderTop: `8px solid ${terra2}`, borderBottom: `10px solid ${terra2}` }} />
      {/* os sulcos dos pneus e as pedrinhas */}
      <svg width={1080} height={190} style={{ position: "absolute", left: 0, top: CHAO - 150 }}>
        {[60, 130].map((y) => <line key={y} x1={0} y1={y} x2={1080} y2={y} stroke={terra2} strokeWidth={6} strokeDasharray="90 60" strokeDashoffset={off} opacity={0.6} />)}
        {Array.from({ length: 14 }).map((_, i) => {
          const x = ((((random(`ped-${i}`) * 2000 - off) % 1100) + 1100) % 1100) - 10;
          return <ellipse key={i} cx={x} cy={20 + random(`pedy-${i}`) * 150} rx={7} ry={4} fill={terra2} opacity={0.7} />;
        })}
      </svg>
      {noite > 0 && <AbsoluteFill style={{ background: `rgba(22,33,62,${0.15 * noite})` }} />}
    </>
  );
};

// ---- os objetos do caminho (desenhados com a base no chão, em x)
const Porteira: React.FC<{ x: number; abre: number }> = ({ x, abre }) => (
  <svg width={360} height={300} viewBox="0 0 360 300" style={{ position: "absolute", left: x - 180, top: CHAO - 270, overflow: "visible" }}>
    <rect x={14} y={30} width={26} height={250} rx={6} fill="#7A5233" />
    <rect x={320} y={30} width={26} height={250} rx={6} fill="#7A5233" />
    <g transform={`translate(40 0) scale(${1 - 0.82 * abre} 1)`}>
      {[60, 120, 180, 230].map((y) => <rect key={y} x={0} y={y} width={280} height={22} rx={6} fill="#B07A44" stroke="#7A5233" strokeWidth={4} />)}
      <path d="M8 240 L272 70" stroke="#B07A44" strokeWidth={22} strokeLinecap="round" />
      <path d="M8 240 L272 70" stroke="#7A5233" strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.5} />
      <rect x={0} y={50} width={22} height={210} rx={6} fill="#9A6A3A" />
      <rect x={258} y={50} width={22} height={210} rx={6} fill="#9A6A3A" />
    </g>
  </svg>
);
const Mangueira: React.FC<{ x: number; t: number; tc: number }> = ({ x, t, tc }) => {
  const u = t - tc;
  const cai = u > 0 ? Math.min(1, u / 0.45) : 0;
  return (
    <svg width={520} height={620} viewBox="0 0 520 620" style={{ position: "absolute", left: x - 260, top: CHAO - 760, overflow: "visible" }}>
      <path d="M240 600 Q250 470 230 380 L290 380 Q272 470 285 600 Z" fill="#7A5233" />
      <path d="M255 430 Q200 400 170 360 M268 420 Q320 390 350 350" stroke="#7A5233" strokeWidth={16} strokeLinecap="round" fill="none" />
      {[[260, 250, 210], [130, 300, 140], [390, 300, 140], [200, 170, 130], [330, 170, 130]].map(([cx, cy, r], i) => <circle key={i} cx={cx} cy={cy} r={r} fill={i % 2 ? "#3F8F45" : "#2F7A3A"} />)}
      {[[150, 330], [240, 360], [360, 320], [300, 230], [180, 240], [410, 380]].map(([mx, my], i) => (
        <g key={i} transform={`translate(${mx} ${my}) rotate(-20)`}>
          <ellipse rx={20} ry={14} fill="#F6A12E" /><ellipse rx={10} ry={7} cx={-6} cy={-3} fill="#F7C64D" /><path d="M14 -10 l8 -8" stroke="#2F7A3A" strokeWidth={4} />
        </g>
      ))}
      {/* a manga que cai na palavra */}
      {u > 0 && u < 1.2 && <g transform={`translate(${410 + 40 * cai} ${380 + 215 * (cai * cai)}) rotate(${-20 + 200 * cai})`}><ellipse rx={20} ry={14} fill="#F6A12E" /><ellipse rx={10} ry={7} cx={-6} cy={-3} fill="#F7C64D" /></g>}
    </svg>
  );
};
const MataBurro: React.FC<{ x: number }> = ({ x }) => (
  <svg width={320} height={120} viewBox="0 0 320 120" style={{ position: "absolute", left: x - 160, top: CHAO - 70, overflow: "visible" }}>
    <rect x={10} y={40} width={300} height={60} rx={10} fill="#3D2B22" />
    {Array.from({ length: 8 }).map((_, i) => <g key={i}><rect x={24 + i * 37} y={22} width={18} height={70} rx={9} fill="#8F8A84" /><rect x={28 + i * 37} y={26} width={6} height={60} rx={3} fill="#C9C3BC" /></g>)}
    <rect x={0} y={10} width={18} height={70} rx={5} fill="#7A5233" /><rect x={302} y={10} width={18} height={70} rx={5} fill="#7A5233" />
  </svg>
);
const Vaca: React.FC<{ x: number; t: number; tc: number }> = ({ x, t, tc }) => {
  const olha = interpolate(t, [tc - 0.3, tc], [0, 1], clamp);
  const muu = t > tc + 0.05 && t < tc + 1.2 ? mola(t, tc + 0.05, 0.3, 2.4) * (1 - entre(t, tc + 1.0, tc + 1.2)) : 0;
  return (
    <div style={{ position: "absolute", left: x - 230, top: CHAO - 330, width: 460, height: 340 }}>
      <svg width={460} height={340} viewBox="0 0 460 340" style={{ overflow: "visible" }}>
        <ellipse cx={230} cy={326} rx={170} ry={12} fill="#000" opacity={0.12} />
        {[110, 160, 300, 350].map((lx, i) => <g key={i}><rect x={lx} y={220} width={30} height={100} rx={12} fill="#F4EFE8" /><rect x={lx} y={300} width={30} height={22} rx={8} fill="#3A2C26" /></g>)}
        <path d="M70 140 Q80 90 150 92 H330 Q390 92 396 150 V220 Q396 250 360 250 H110 Q70 250 70 210 Z" fill="#FBF8F3" stroke="#3A2C26" strokeWidth={5} />
        <path d="M150 100 Q190 110 180 160 Q160 190 130 170 Q110 130 150 100 Z" fill="#2E2421" />
        <path d="M280 150 Q320 130 340 170 Q330 220 290 210 Q260 190 280 150 Z" fill="#2E2421" />
        <ellipse cx={230} cy={244} rx={28} ry={14} fill="#F2A7B5" />
        <path d="M70 140 Q40 150 46 190" stroke="#3A2C26" strokeWidth={6} fill="none" strokeLinecap="round" />
        {/* a cabeça, que vira para a câmera */}
        <g transform={`translate(${400 - 30 * olha} 130)`}>
          <path d="M-30 -60 Q-44 -78 -40 -92 M30 -60 Q44 -78 40 -92" stroke="#E9DCC0" strokeWidth={10} strokeLinecap="round" fill="none" />
          <ellipse cx={-46} cy={-40} rx={20} ry={10} fill="#FBF8F3" stroke="#3A2C26" strokeWidth={4} transform="rotate(-20 -46 -40)" />
          <ellipse cx={46} cy={-40} rx={20} ry={10} fill="#FBF8F3" stroke="#3A2C26" strokeWidth={4} transform="rotate(20 46 -40)" />
          <rect x={-40} y={-66} width={80} height={110} rx={36} fill="#FBF8F3" stroke="#3A2C26" strokeWidth={5} />
          <rect x={-42} y={8} width={84} height={50} rx={24} fill="#F2A7B5" stroke="#3A2C26" strokeWidth={5} />
          <circle cx={-14} cy={30} r={5} fill="#7A4552" /><circle cx={14} cy={30} r={5} fill="#7A4552" />
          <circle cx={-18 + 4 * olha} cy={-22} r={9} fill="#2E2421" /><circle cx={18 + 4 * olha} cy={-22} r={9} fill="#2E2421" />
          <circle cx={-15 + 4 * olha} cy={-25} r={3} fill="#fff" /><circle cx={21 + 4 * olha} cy={-25} r={3} fill="#fff" />
        </g>
      </svg>
      {muu > 0 && (
        <div style={{ position: "absolute", left: 300, top: -110, transform: `scale(${muu})`, transformOrigin: "20% 100%", background: "#fff", border: `5px solid ${C.tinta}`, borderRadius: 30, padding: "8px 26px",
          fontFamily: FONT, fontWeight: W.black, fontSize: 52, color: C.tinta, whiteSpace: "nowrap" }}>Muuu!</div>
      )}
    </div>
  );
};
const Placa: React.FC<{ x: number; texto: string; e: number; pendurada?: string; ep?: number; t?: number }> = ({ x, texto, e, pendurada, ep = 0, t = 0 }) =>
  e <= 0 ? null : (
    <div style={{ position: "absolute", left: x - 130, top: CHAO - 520, width: 260, height: 380, transform: `scaleY(${Math.min(1.15, e)})`, transformOrigin: "50% 100%" }}>
      <div style={{ position: "absolute", left: 117, top: 120, width: 26, height: 260, borderRadius: 6, background: "#7A5233" }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 260, height: 140, borderRadius: 22, background: VERDE, border: "8px solid #fff", boxShadow: "0 8px 0 rgba(34,28,25,0.25)",
        display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontWeight: W.black, fontSize: 70, color: "#fff", letterSpacing: -1, boxSizing: "border-box" }}>{texto}</div>
      {/* a tabuinha pendurada embaixo da placa (a piada): cai e balança */}
      {pendurada && ep > 0 && (
        <div style={{ position: "absolute", left: 130 - 170, top: 140, width: 340, transform: `translateY(${(1 - Math.min(1, ep)) * -60}px) rotate(${Math.sin(t * 7) * 9 * Math.exp(-Math.max(0, ep - 1) * 1.2)}deg)`, transformOrigin: "50% 0%", opacity: Math.min(1, ep * 2) }}>
          <svg width={340} height={40} style={{ position: "absolute", left: 0, top: 0 }}><line x1={95} y1={0} x2={80} y2={40} stroke="#6B5A4A" strokeWidth={4} /><line x1={245} y1={0} x2={260} y2={40} stroke="#6B5A4A" strokeWidth={4} /></svg>
          <div style={{ position: "absolute", left: 20, top: 38, width: 300, padding: "10px 0 12px", borderRadius: 12, background: "#C9955E", border: "5px solid #7A5233", textAlign: "center",
            fontFamily: FONT, fontWeight: W.black, fontSize: 34, lineHeight: 1.1, color: "#3A2C26", whiteSpace: "nowrap", boxShadow: "0 6px 0 rgba(34,28,25,0.2)" }}>{pendurada}</div>
        </div>
      )}
    </div>
  );
const Casinha: React.FC<{ x: number; luz: number }> = ({ x, luz }) => (
  <svg width={520} height={520} viewBox="0 0 520 520" style={{ position: "absolute", left: x - 260, top: CHAO - 500, overflow: "visible" }}>
    <defs><radialGradient id="cm-halo"><stop offset="0%" stopColor="#FFD66B" stopOpacity={0.35 * luz} /><stop offset="100%" stopColor="#FFD66B" stopOpacity={0} /></radialGradient></defs>
    {luz > 0 && <circle cx={260} cy={330} r={300} fill="url(#cm-halo)" />}
    <rect x={60} y={200} width={400} height={290} rx={8} fill="#F4E3C8" stroke="#3A2C26" strokeWidth={6} />
    <path d="M20 220 L260 70 L500 220 Z" fill="#C9542F" stroke="#3A2C26" strokeWidth={6} strokeLinejoin="round" />
    <rect x={100} y={260} width={100} height={90} rx={8} fill={luz > 0 ? "#FFE48A" : "#8FB6CC"} stroke="#3A2C26" strokeWidth={6} />
    <path d="M150 260 V350 M100 305 H200" stroke="#3A2C26" strokeWidth={5} />
    <rect x={300} y={300} width={90} height={190} rx={8} fill={luz > 0 ? "#F9B233" : "#8A5A35"} stroke="#3A2C26" strokeWidth={6} />
    <circle cx={375} cy={400} r={6} fill="#3A2C26" />
    <rect x={40} y={480} width={440} height={20} rx={8} fill="#9A6A3A" />
    <circle cx={430} cy={250} r={14} fill="#FFE48A" opacity={luz} />
  </svg>
);

// ---- a câmera: o mundo (cenário + personagens, com o chão em y CHAO) ampliado e descido (layout.json → mundo)
const MUNDO = (L as unknown as { mundo: { escala: number; desce: number } }).mundo;
const Mundo: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ position: "absolute", inset: 0, transform: `translateY(${MUNDO.desce}px) scale(${MUNDO.escala})`, transformOrigin: `540px ${CHAO}px` }}>{children}</div>
);
// o primeiro plano: tufos de capim, florzinhas e pedrinhas abaixo da estrada (rolam com a câmera); de noite, vaga-lumes
const PrimeiroPlano: React.FC<{ off: number; hora: number; t: number }> = ({ off, hora, t }) => {
  const noite = clamp01(hora - 1);
  const tufo = interpolateColors(hora, [0, 1, 2], ["#5E9E42", "#7A8642", "#22332F"]);
  const per = 1400;
  return (
    <svg width={1080} height={700} viewBox="0 0 1080 700" style={{ position: "absolute", left: 0, top: CHAO + 45, overflow: "visible" }}>
      {Array.from({ length: 26 }).map((_, i) => {
        const x = ((((random(`tufo-${i}`) * per - off * 1.15) % per) + per) % per) - 160;
        const y = 30 + random(`tufoy-${i}`) * 440, s = 0.7 + random(`tufos-${i}`) * 0.8;
        const flor = random(`flor-${i}`) > 0.6;
        return (
          <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
            <path d="M0 0 Q-8 -30 -16 -42 M0 0 Q2 -36 4 -50 M0 0 Q10 -28 20 -38" stroke={tufo} strokeWidth={7} strokeLinecap="round" fill="none" />
            {flor && noite < 0.5 && <><circle cx={4} cy={-52} r={7} fill={i % 3 ? AMARELO : "#fff"} /><circle cx={4} cy={-52} r={3} fill={C.coral} /></>}
          </g>
        );
      })}
      {Array.from({ length: 10 }).map((_, i) => {
        const x = ((((random(`pd-${i}`) * per - off * 1.15) % per) + per) % per) - 100;
        return <ellipse key={`p${i}`} cx={x} cy={60 + random(`pdy-${i}`) * 420} rx={14} ry={8} fill={interpolateColors(hora, [0, 2], ["#B7A58C", "#3C3A44"])} />;
      })}
      {noite > 0 && Array.from({ length: 14 }).map((_, i) => {
        const x = 60 + random(`vg-${i}`) * 960 + 30 * Math.sin(t * 1.3 + i), y = 40 + random(`vgy-${i}`) * 420 + 20 * Math.cos(t * 1.1 + i * 2);
        const br = 0.5 + 0.5 * Math.sin(t * 4 + i * 1.7);
        return <circle key={`v${i}`} cx={x} cy={y} r={6} fill="#FFF3A0" opacity={noite * br} style={{ filter: "drop-shadow(0 0 8px #FFE97A)" }} />;
      })}
    </svg>
  );
};

// ================================================================ o visitante: um pin genérico (azul), com o mapa na mão
const Visitante: React.FC<{ cx: number; base: number; altura: number; t: number; anda?: number; estado?: "normal" | "perdido" | "cansado" | "dormindo"; olha?: number; pulo?: number; mapa?: boolean }> = ({
  cx, base, altura, t, anda = 0, estado = "normal", olha = 0, pulo = 0, mapa = true,
}) => {
  const k = altura / 260;
  const passo = Math.sin(t * 11) * anda;
  const bob = Math.abs(Math.sin(t * 11)) * 6 * anda;
  const cansado = estado === "cansado", dormindo = estado === "dormindo";
  const azul = "#5A8FD8", azul2 = "#3F6DB3";
  const sentado = dormindo;
  return (
    <div style={{ position: "absolute", left: cx - 100 * k, top: base - 260 * k - pulo + bob, width: 200 * k, height: 260 * k }}>
      <svg width={200 * k} height={260 * k} viewBox="0 0 200 260" style={{ overflow: "visible" }}>
        <ellipse cx={100} cy={256 + pulo / k} rx={60} ry={7} fill="#000" opacity={0.12} />
        {!sentado && (
          <>
            <path d={`M85 200 L${82 - 10 * passo} 245`} stroke={azul2} strokeWidth={14} strokeLinecap="round" />
            <path d={`M115 200 L${118 + 10 * passo} 245`} stroke={azul2} strokeWidth={14} strokeLinecap="round" />
            <ellipse cx={80 - 10 * passo} cy={250} rx={16} ry={8} fill="#5B3A29" /><ellipse cx={120 + 10 * passo} cy={250} rx={16} ry={8} fill="#5B3A29" />
          </>
        )}
        <g transform={sentado ? "translate(0 40) rotate(-12 100 230)" : cansado ? "rotate(6 100 230)" : ""}>
          {/* o corpo em forma de pin */}
          <path d="M100 222 C100 222 30 150 30 100 A70 70 0 0 1 170 100 C170 150 100 222 100 222 Z" fill={azul} />
          <path d="M100 222 C120 190 170 150 170 100 A70 70 0 0 0 150 50 C160 100 130 170 100 222 Z" fill={azul2} opacity={0.5} />
          {/* o rosto */}
          <circle cx={100} cy={98} r={46} fill="#FFFFFF" />
          {dormindo ? (
            <><path d="M74 96 q10 8 20 0" stroke={C.tinta} strokeWidth={5} fill="none" strokeLinecap="round" /><path d="M106 96 q10 8 20 0" stroke={C.tinta} strokeWidth={5} fill="none" strokeLinecap="round" /></>
          ) : (
            <>
              <circle cx={84} cy={94} r={11} fill={C.tinta} /><circle cx={116} cy={94} r={11} fill={C.tinta} />
              <circle cx={84 + 4 * olha} cy={92} r={4} fill="#fff" /><circle cx={116 + 4 * olha} cy={92} r={4} fill="#fff" />
              {cansado && <><path d="M70 84 H98" stroke={azul} strokeWidth={12} /><path d="M102 84 H130" stroke={azul} strokeWidth={12} /></>}
              {estado === "perdido" && <path d="M106 74 Q118 66 130 74" stroke={C.tinta} strokeWidth={4} fill="none" strokeLinecap="round" />}
            </>
          )}
          {cansado ? <ellipse cx={100} cy={122} rx={10} ry={12} fill={C.tinta} /> : dormindo ? <path d="M92 120 Q100 124 108 120" stroke={C.tinta} strokeWidth={4} fill="none" /> : <path d="M88 118 Q100 126 112 118" stroke={C.tinta} strokeWidth={4} fill="none" strokeLinecap="round" />}
          {/* os braços e o mapa aberto na frente */}
          <path d="M40 140 Q30 160 48 172" stroke={azul2} strokeWidth={12} strokeLinecap="round" fill="none" />
          <path d="M160 140 Q170 160 152 172" stroke={azul2} strokeWidth={12} strokeLinecap="round" fill="none" />
          {mapa && (
            <g transform={`translate(100 172) rotate(${cansado ? 18 : -4})`}>
              <path d="M-62 -26 L-20 -34 L20 -26 L62 -34 V26 L20 34 L-20 26 L-62 34 Z" fill="#F7EBD0" stroke="#B89A6A" strokeWidth={3} />
              <path d="M-20 -34 V26 M20 -26 V34" stroke="#D9C49C" strokeWidth={3} />
              <path d="M-50 18 Q-30 -10 -5 6 T48 -20" stroke={C.coral} strokeWidth={4} strokeDasharray="6 6" fill="none" />
              <circle cx={48} cy={-20} r={6} fill={C.coral} />
            </g>
          )}
          <circle cx={46} cy={172} r={11} fill="#fff" /><circle cx={154} cy={172} r={11} fill="#fff" />
        </g>
        {cansado && [0, 1].map((i) => {
          const u = ((t * 1.4 + i * 0.5) % 1);
          return <path key={i} d={`M${150 + 14 * i} ${60 + 60 * u} q-6 10 0 14 q6 -4 0 -14 Z`} fill="#7FB8E6" opacity={1 - u} />;
        })}
      </svg>
      {dormindo && [0, 1, 2].map((i) => {
        const u = ((t * 0.6 + i / 3) % 1);
        return <div key={i} style={{ position: "absolute", left: 150 * k + 40 * u, top: 20 * k - 90 * u, fontFamily: FONT, fontWeight: W.black, fontSize: 34 + 14 * u, color: "#FFF3C4", opacity: 1 - u }}>z</div>;
      })}
    </div>
  );
};

// ================================================================ o Pertim (o mineiro) + os acessórios (chinelo e xícara)
const VB: Record<string, number[]> = { parado: [0, 18, 240, 270], moto: [-24, 40, 300, 254] };
const vbDe = (pose: string) => VB[pose] ?? [-20, 6, 280, 284];
// chinelo e café: desenhados POR CIMA do Pertim oficial, no mesmo viewBox (o desenho dele não muda): o pé descalço com
// o chinelo cobre o tênis; a xícara fica na luva de baixo (pose "parado")
const Acessorios: React.FC<{ altura: number; pose: Pose; quique?: number; respira?: number; t: number; chinelo?: boolean; cafe?: boolean }> = ({ altura, pose, quique = 0, respira = 0, t, chinelo, cafe }) => {
  const [vx, vy, vw, vh] = vbDe(pose);
  const corpoT = `translate(120 252) scale(${1 - respira * 0.006} ${1 + respira * 0.014}) translate(-120 -252)`;
  const Pe: React.FC<{ x: number; flip?: boolean }> = ({ x, flip }) => (
    <g transform={`translate(${x} 266) ${flip ? "scale(-1 1)" : ""}`}>
      <rect x={-16} y={4} width={36} height={8} rx={4} fill="#2F7A3A" />
      <rect x={-15} y={3} width={34} height={4} rx={2} fill={VERDE} />
      <path d="M-12,5 Q-13,-9 0,-9 Q13,-9 16,4 Z" fill={PC.laranja} />
      <path d="M2 -2 L-9 5 M2 -2 L14 5" stroke={AMARELO} strokeWidth={3.4} strokeLinecap="round" />
    </g>
  );
  const fumaca = (i: number) => {
    const u = ((t * 0.7 + i * 0.5) % 1);
    return <path key={i} d={`M${214 + 6 * i} ${178 - 30 * u} q-6 -8 0 -16 q6 -8 0 -16`} stroke="#fff" strokeOpacity={0.7 * (1 - u)} strokeWidth={4} fill="none" strokeLinecap="round" />;
  };
  return (
    <svg viewBox={`${vx} ${vy} ${vw} ${vh}`} width={(altura * vw) / vh} height={altura} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <g transform={quique ? `translate(0 ${quique})` : ""}>
        {chinelo && <><Pe x={100} flip /><Pe x={140} /></>}
        {cafe && pose === "parado" && (
          <g transform={corpoT}>
            {[0, 1].map(fumaca)}
            <path d="M228 194 a9 9 0 0 1 0 16" stroke="#F4EFE8" strokeWidth={5} fill="none" />
            <path d="M203 186 H229 L226 214 Q225 219 220 219 H212 Q207 219 206 214 Z" fill="#F4EFE8" stroke="#3A2C26" strokeWidth={2.4} />
            <rect x={204} y={196} width={24} height={6} fill={C.coral} />
            <ellipse cx={216} cy={187} rx={13} ry={3} fill="#6B3A1E" />
          </g>
        )}
      </g>
    </svg>
  );
};
const PertimEm: React.FC<{
  t: number; quadro: number; d: DadosEpisodio; pose: Pose; expr: Expressao; cx: number; base: number; altura: number; olhar?: [number, number];
  chinelo?: boolean; cafe?: boolean; rot?: number; aceno?: number;
}> = ({ t, quadro, d, pose, expr, cx, base, altura, olhar = [0, 0], chinelo, cafe, rot = 0, aceno }) => {
  const falando = d.cenas.some((c) => t >= c.voz_t0 - 0.02 && t <= c.voz_t1 + 0.04);
  const boca = bocaNoQuadro({ fps: d.fps, bocas: d.visemas, codigos: {} } as Visemas, quadro, falando);
  const [, , vw, vh] = vbDe(pose);
  const w = (altura * vw) / vh;
  const resp = respiracao(t);
  const rig: PertimRig = { ...resp, piscada: piscadaEm(d.piscadas, t, d.piscada_dur), olhar, centro: true,
    aceno: aceno ?? (pose === "acenando" ? 12 * Math.sin(t * 9) : pose === "apontando" ? -14 + 3 * Math.sin(t * 2.5) : 0) };
  return (
    <div style={{ position: "absolute", left: cx - w / 2, top: base - altura, width: w, height: altura, transform: `rotate(${rot}deg)`, transformOrigin: "50% 95%" }}>
      <Pertim v={1} pose={pose} expr={expr} mouth={boca ?? "auto"} altura={altura} rig={rig} />
      {(chinelo || cafe) && <Acessorios altura={altura} pose={pose} respira={resp.respira} t={t} chinelo={chinelo} cafe={cafe} />}
    </div>
  );
};

// ================================================================ a câmera do caminho
// o deslocamento da câmera (px do mundo): parada nas cenas da conversa; no caminho, anda no passo do visitante e acelera no "segue"
const CHICOTE = 1500;
const camEm = (t: number, cam: { t0: number; t1: number; segue: number; para: number }) => {
  const pulo = CHICOTE * inOut(entre(t, cam.t0 - 0.12, cam.t0 + 0.18));    // o chicote na batida do corte
  return pulo + anda(t, cam);
};
const anda = (t: number, cam: { t0: number; t1: number; segue: number; para: number }) => {
  if (t <= cam.t0) return 0;
  const v1 = 560, v2 = 1500;
  const dt = 1 / 120;
  let x = 0;
  for (let s = cam.t0; s < Math.min(t, cam.t1); s += dt) {
    let v = s < cam.t0 + 0.5 ? v1 * outCubic((s - cam.t0) / 0.5) : s < cam.segue ? v1 : v1 + (v2 - v1) * inOut(Math.min(1, (s - cam.segue) / 1.2));
    // a câmera freia e PARA na última placa (a piada da placa precisa ficar na tela)
    if (s > cam.para - 0.55) v *= Math.max(0, 1 - inOut((s - (cam.para - 0.55)) / 0.55));
    x += v * dt;
  }
  return x;
};

// ================================================================ a montagem
export const CoisaDeMineiro: React.FC<CoisaDeMineiroProps> = ({ dados }) => {
  const quadro = useCurrentFrame();
  if (!dados) throw new Error("CoisaDeMineiro: os dados do episódio são lidos no calculateMetadata");
  const d = dados;
  const t = quadro / d.fps;
  const cena = (tipo: string) => d.cenas.find((c) => c.tipo === tipo);
  const P = cena("pergunta"), R = cena("resposta"), CM = cena("caminho"), CH = cena("chegada"), F = cena("fecho");
  const PL = L.pertim, VS = L.visitante;
  const noiteDesde = CH ? CH.t0 : d.duracao + 1;
  // "para": a câmera para na última placa quando ela tem a tabuinha pendurada (a piada); senão, anda até o fim da cena
  const ultPlaca = CM?.diagrama.placas?.[CM.diagrama.placas.length - 1];
  const paraEm = CM && ultPlaca && typeof ultPlaca === "object" && ultPlaca.pendurada ? (CM.diagrama.placas_t as number[])[CM.diagrama.placas.length - 1] : 1e9;
  const camCfg = CM ? { t0: CM.t0, t1: CM.t1, segue: CM.diagrama.segue?.t ?? CM.t1, para: paraEm } : { t0: 1e9, t1: 1e9, segue: 1e9, para: 1e9 };
  const camX = t < noiteDesde ? camEm(t, camCfg) : 0;
  // a hora do dia: dia até o "segue"; vira fim de tarde até o fim do caminho; noite na chegada e no fecho
  const hora = t >= noiteDesde ? 2 : CM ? 1.0 * entre(t, camCfg.segue, CM.t1) : 0;
  const camada: React.ReactNode[] = [];

  // ---- dia: a conversa e o caminho (um mundo só; a câmera anda para a direita)
  if (t < noiteDesde) {
    const objetos = (CM?.diagrama.objetos ?? []) as Array<{ tipo: string; t: number }>;
    const placas = ((CM?.diagrama.placas ?? []) as Array<string | { texto: string; pendurada?: string }>).map((p) => (typeof p === "string" ? { texto: p } : p)) as Array<{ texto: string; pendurada?: string }>;
    const placasT = (CM?.diagrama.placas_t ?? []) as number[];
    const CENTRO = 560;
    const wObj = (tw: number) => camEm(tw, camCfg) + CENTRO;
    const chicote = CM ? Math.sin(Math.PI * entre(t, CM.t0 - 0.12, CM.t0 + 0.18)) : 0;           // o objeto passa no centro da tela na palavra dele
    const sx = (wx: number) => wx - camX;
    const visX = VS.caminho.cx, visCx = t < (CM?.t0 ?? 1e9) ? VS.conversa.cx : interpolate(t, [CM!.t0, CM!.t0 + 0.6], [VS.conversa.cx, visX], clamp);
    // o visitante: no mata-burro pula com cuidado; na vaca, dá a volta (sobe e desce)
    let pulo = 0, desvio = 0;
    objetos.forEach((o) => {
      const tp = o.t + (CENTRO - visX) / 560;                            // quando ele passa pelo objeto
      if (o.tipo === "mata-burro") pulo += 70 * Math.max(0, Math.sin(Math.PI * entre(t, tp - 0.25, tp + 0.25)));
      if (o.tipo === "vaca") desvio += 110 * Math.max(0, Math.sin(Math.PI * entre(t, tp - 0.6, tp + 0.6)));
    });
    camada.push(
      <AbsoluteFill key="dia">
        <Ceu hora={hora} t={t} />
        <Nuvens off={camX + t * 20} hora={hora} />
        <Mundo>
        <Morros off={camX} hora={hora} />
        <Estrada off={camX} hora={hora} />
        <PrimeiroPlano off={camX} hora={hora} t={t} />
        {/* as placas do outro lado da estrada (atrás) e os objetos */}
        {placas.map((p, k) => <Placa key={`p${k}`} x={sx(wObj(placasT[k]) + (p.pendurada ? 120 : 200))} texto={p.texto} e={mola(t, placasT[k] - 0.35, 0.35, 2.6)} pendurada={p.pendurada} ep={mola(t, placasT[k] + 0.55, 0.45, 1.6)} t={t} />)}
        {objetos.filter((o) => o.tipo === "mangueira").map((o, k) => <Mangueira key={`m${k}`} x={sx(wObj(o.t) + 80)} t={t} tc={o.t} />)}
        {objetos.filter((o) => o.tipo === "mata-burro").map((o, k) => <MataBurro key={`b${k}`} x={sx(wObj(o.t))} />)}
        {objetos.filter((o) => o.tipo === "porteira").map((o, k) => <Porteira key={`g${k}`} x={sx(wObj(o.t))} abre={inOut(entre(t, o.t + (CENTRO - visX) / 560 - 0.55, o.t + (CENTRO - visX) / 560 - 0.15))} />)}
        {objetos.filter((o) => o.tipo === "vaca").map((o, k) => <div key={`v${k}`} style={{ position: "absolute", inset: 0, transform: "translateY(-40px) scale(0.9)", transformOrigin: `${sx(wObj(o.t))}px ${CHAO}px` }}><Vaca x={sx(wObj(o.t))} t={t} tc={o.t} /></div>)}
        {/* o Pertim na conversa (fica para trás quando a câmera anda) */}
        {(() => {
          const x = PL.conversa.cx - camX;
          if (x < -400) return null;
          const resp = R && t >= R.t0;
          const pose: Pose = CM && t >= CM.t0 ? "acenando" : resp ? "apontando" : "parado";
          const olhaVis = resp && R!.diagrama.camera && t < R!.diagrama.camera.t && t < (CM?.t0 ?? 1e9);
          return <PertimEm t={t} quadro={quadro} d={d} pose={pose} expr="sorrindo" cx={x} base={PL.conversa.base} altura={PL.conversa.altura}
            olhar={olhaVis ? [-1, 0.1] : [0, 0]} />;
        })()}
        {/* o visitante: entra pela esquerda no gancho, fica perdido, depois segue a estrada */}
        {(() => {
          const ent = P ? interpolate(t, [P.t0, P.t0 + 1.0], [-260, VS.conversa.cx], { ...clamp, easing: (x) => outCubic(x) }) : VS.conversa.cx;
          const cx = t < (CM?.t0 ?? 1e9) ? ent : visCx;
          const andando = t < (P?.t0 ?? 0) + 1.0 || (CM && t >= CM.t0 && t < camCfg.para) ? 1 : 0;
          const est = CM && t > camCfg.segue + 1.5 ? "cansado" : P && t > P.t0 + 1.0 && t < (CM?.t0 ?? 1e9) ? "perdido" : "normal";
          const olha = (R && t >= R.t0 && t < (CM?.t0 ?? 1e9)) || t >= camCfg.para ? 1 : 0;
          return <Visitante cx={cx} base={VS.conversa.base + desvio} altura={(t < (CM?.t0 ?? 1e9) ? VS.conversa.altura : VS.caminho.altura) * (1 + desvio / 900)} t={t} anda={andando} estado={est} olha={olha} pulo={pulo} />;
        })()}
        {chicote > 0.02 && (
          <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: chicote }}>
            {Array.from({ length: 16 }).map((_, i) => { const y = 300 + random(`chi-${i}`) * 1100, x = random(`chx-${i}`) * 1080; return <line key={i} x1={x} y1={y} x2={x + 260} y2={y} stroke="#fff" strokeWidth={8} strokeLinecap="round" strokeOpacity={0.7} />; })}
          </svg>
        )}
        {/* o "?" do visitante perdido */}
        {P && t > P.t0 + 1.1 && t < (R?.t0 ?? P.t1) + 0.4 && (
          <div style={{ position: "absolute", left: VS.conversa.cx + 40, top: VS.conversa.base - VS.conversa.altura - 150, transform: `scale(${mola(t, P.t0 + 1.1, 0.35, 2.6) * (1 - entre(t, (R?.t0 ?? P.t1) + 0.2, (R?.t0 ?? P.t1) + 0.4))})`,
            width: 110, height: 110, borderRadius: "50%", background: "#fff", border: `6px solid ${C.tinta}`, display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: FONT, fontWeight: W.black, fontSize: 76, color: C.coral }}>?</div>
        )}
        {/* o brilho no "pertim" (a piscada para o público) */}
        {R?.diagrama.camera && t > R.diagrama.camera.t && t < R.diagrama.camera.t + 0.7 && (
          <svg width={70} height={70} viewBox="0 0 100 100" style={{ position: "absolute", left: PL.conversa.cx + 150 - camX, top: PL.conversa.base - PL.conversa.altura + 40, opacity: 1 - entre(t, R.diagrama.camera.t + 0.4, R.diagrama.camera.t + 0.7) }}>
            <path d="M50 4 C54 34 66 46 96 50 C66 54 54 66 50 96 C46 66 34 54 4 50 C34 46 46 34 50 4 Z" fill={AMARELO} />
          </svg>
        )}
        </Mundo>
      </AbsoluteFill>,
    );
  }

  // ---- noite: a chegada e o fecho (a casinha com a luz acesa; o Pertim de chinelo, com o café)
  if (CH && t >= CH.t0 - 0.2) {
    const u = F ? inOut(entre(t, F.t0 - 0.15, F.t0 + 0.35)) : 0;               // a câmera chega mais perto no fecho
    const pc = { cx: interpolate(u, [0, 1], [PL.chegada.cx, PL.fecho.cx]), base: interpolate(u, [0, 1], [PL.chegada.base, PL.fecho.base]), altura: interpolate(u, [0, 1], [PL.chegada.altura, PL.fecho.altura]) };
    const visEnt = interpolate(t, [CH.t0, CH.t0 + 1.2], [-240, 300], { ...clamp, easing: (x) => outCubic(x) });
    const caiu = t > CH.t0 + 1.2;
    const piscando = F && ((t > F.t0 + 0.05 && t < F.t0 + 0.6) || t > F.voz_t1 + 0.15);
    camada.push(
      <AbsoluteFill key="noite" style={{ opacity: t < CH.t0 ? 0 : 1 }}>
        <Ceu hora={2} t={t} />
        <Nuvens off={t * 20} hora={2} />
        <Mundo>
        <div style={{ position: "absolute", inset: 0, transform: `scale(${1 + 0.18 * u})`, transformOrigin: `${PL.chegada.cx}px ${CHAO}px` }}>
          <Morros off={300} hora={2} />
          <Estrada off={0} hora={2} />
          <PrimeiroPlano off={0} hora={2} t={t} />
          <Casinha x={900} luz={1} />
        </div>
        <Visitante cx={caiu ? 300 - 60 * u : visEnt} base={CHAO + 10 * u} altura={VS.conversa.altura * (1 - 0.25 * u)} t={t} anda={caiu ? 0 : 1} estado={caiu ? (F && t >= F.t0 ? "dormindo" : "cansado") : "cansado"} mapa={!caiu || u < 0.5} />
        <PertimEm t={t} quadro={quadro} d={d} pose="parado" expr={piscando ? "piscadinha" : "sorrindo"} cx={pc.cx} base={pc.base} altura={pc.altura} chinelo cafe />
        </Mundo>
      </AbsoluteFill>,
    );
  }
  // a noite caindo (o corte do caminho para a chegada, na batida): o azul da noite desce do alto
  const cai = CH ? entre(t, CH.t0 - 0.25, CH.t0 + 0.1) : 0;
  const sai = CH ? entre(t, CH.t0 + 0.05, CH.t0 + 0.3) : 0;

  return (
    <AbsoluteFill style={{ background: "#7FCBEF" }}>
      {camada}
      {cai > 0 && sai < 1 && <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920 * inCubic(cai), background: "linear-gradient(to bottom, #16213E, #2B3C68)", opacity: 1 - sai }} />}
      {/* a marca, só nos segundos finais: logo pequena + "Tudo pertim de você." */}
      {t >= d.marca_t && (() => {
        const e = mola(t, d.marca_t, 0.4, 1.9), e2 = mola(t, d.marca_t + 0.15, 0.35, 2);
        const M = L.marca;
        return (
          <>
            <div style={{ position: "absolute", left: M.cx - M.d / 2, top: M.cy - M.d / 2, width: M.d, height: M.d, transform: `scale(${e})`, filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.35))" }}>
              <Img src={staticFile("img/uaipertim_logo.png")} style={{ width: "100%", height: "100%" }} />
            </div>
            <div style={{ position: "absolute", left: 0, right: 0, top: M.frase.cy - M.frase.size * 0.6, textAlign: "center", fontFamily: FONT, fontWeight: W.black, fontSize: M.frase.size,
              letterSpacing: -1.5, color: "#fff", transform: `scale(${e2})`, textShadow: "0 4px 14px rgba(0,0,0,0.45)", whiteSpace: "nowrap" }}>
              Tudo <span style={{ color: AMARELO }}>pertim de você.</span>
            </div>
          </>
        );
      })()}
      <div style={{ position: "absolute", left: L.selo.x, top: L.selo.y }}>
        <SeloSerie numero={d.numero} size={L.selo.size} e={outBack(Math.min(1, 0.35 + t / 0.45), 2.2)} />
      </div>
      <Legenda t={t} dados={d.legenda} />
    </AbsoluteFill>
  );
};

// ================================================================ a capa (PNG para o "Editar capa"; tudo no recorte 3:4)
export const CapaCoisaDeMineiro: React.FC<CoisaDeMineiroProps> = ({ dados }) => {
  if (!dados) throw new Error("CapaCoisaDeMineiro: os dados do episódio são lidos no calculateMetadata");
  const titulo = dados.capa?.titulo ?? [dados.titulo];
  // o recorte 3:4 da grade vai de y 240 a 1680: o selo e o título no céu (alto), a cena descida e maior (embaixo)
  return (
    <AbsoluteFill style={{ background: "#7FCBEF", overflow: "hidden" }}>
      <Ceu hora={0} t={0} />
      <div style={{ position: "absolute", inset: 0, transform: "translateY(250px)" }}>
        <Morros off={120} hora={0} />
        <Estrada off={60} hora={0} />
        <Placa x={250} texto="27 km" e={1} />
        <div style={{ position: "absolute", inset: 0, transform: "translateY(-30px) scale(0.85)", transformOrigin: `0px ${CHAO}px` }}><Vaca x={0} t={0} tc={-5} /></div>
        <PertimEm t={0.3} quadro={0} d={dados} pose="apontando" expr="piscadinha" cx={680} base={CHAO + 10} altura={700} />
      </div>
      <div style={{ position: "absolute", top: 330, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <SeloSerie numero={dados.numero} size={46} />
      </div>
      <div style={{ position: "absolute", top: 480, left: 110, right: 110, textAlign: "center", fontFamily: FONT, fontWeight: W.black, fontSize: 124, lineHeight: 1.08, letterSpacing: -3, color: C.tinta,
        textShadow: "0 0 30px rgba(255,255,255,0.65)" }}>
        {titulo.map((l, i) => {
          const partes = l.split("*");
          return (
            <div key={i}>
              {partes.map((p, j) => j % 2 ? (
                <span key={j} style={{ position: "relative", display: "inline-block", color: VERDE }}>
                  <svg viewBox="0 0 100 20" preserveAspectRatio="none" style={{ position: "absolute", left: -12, width: "calc(100% + 24px)", bottom: 4, height: 52, overflow: "visible" }}>
                    <path d="M4 13 C30 9, 62 16, 96 7" stroke={AMARELO} strokeWidth={40} strokeLinecap="round" fill="none" vectorEffect="non-scaling-stroke" />
                  </svg>
                  <span style={{ position: "relative" }}>{p}</span>
                </span>
              ) : <React.Fragment key={j}>{p}</React.Fragment>)}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// o calculateMetadata: lê os dados do episódio em public/coisa-de-mineiro/<ep>/dados.json
export const carregaEpisodio = async ({ props }: { props: CoisaDeMineiroProps }) => {
  const r = await fetch(staticFile(`coisa-de-mineiro/${props.ep}/dados.json`));
  const dados = (await r.json()) as DadosEpisodio;
  return { durationInFrames: dados.quadros, fps: dados.fps, props: { ...props, dados } };
};
