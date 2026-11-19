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
type Cena = { n: number; tipo: string; falante?: string; t0: number; t1: number; voz_t0: number; voz_t1: number; texto: string; diagrama: Record<string, any> };
export type DadosEpisodio = {
  ep: string; numero: number; titulo: string; capa?: { titulo: string[]; cena?: string; relogio?: string }; duracao: number; fps: number; quadros: number; batida: number;
  cenas: Cena[]; marca_t: number; piscadas: number[]; piscada_dur: number; visemas: string; legenda: LegendaDados;
};
export type CoisaDeMineiroProps = { ep: string; dados?: DadosEpisodio; mascara?: boolean };
// a máscara do QA (render.mjs mascara): só os personagens e o carro, cada um numa cor chapada, sobre o preto; o resto
// fica invisível. O qa.py lê as cores para ver se alguém fica cortado pela borda (e onde está o rosto do Pertim).
const MascaraCtx = React.createContext(false);
export const CORES_MASCARA: Record<string, string> = { pertim: "#FF0000", rosto: "#FF00FF", visita: "#00FF00", carro: "#0000FF", cachorro: "#FFFF00", vaca: "#00FFFF", legenda: "#FFFFFF" };
const Ator: React.FC<{ nome: string; children: React.ReactNode }> = ({ nome, children }) => {
  const m = React.useContext(MascaraCtx);
  if (!m) return <>{children}</>;
  return <div style={{ position: "absolute", inset: 0, visibility: "visible", filter: `url(#cm-mascara-${nome})` }}>{children}</div>;
};
const FiltrosMascara: React.FC = () => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <defs>
      {Object.entries(CORES_MASCARA).map(([n, cor]) => (
        <filter key={n} id={`cm-mascara-${n}`} x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
          <feFlood floodColor={cor} result="c" /><feComponentTransfer in="SourceAlpha" result="a"><feFuncA type="linear" slope={4} /></feComponentTransfer>
          <feComposite in="c" in2="a" operator="in" />
        </filter>
      ))}
    </defs>
  </svg>
);

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
    <Ator nome="vaca"><div style={{ position: "absolute", left: x - 230, top: CHAO - 330, width: 460, height: 340 }}>
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
    </div></Ator>
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

// (#02) a boca da visita pelos visemas da voz, e o pote de bolo (em coordenadas do desenho de quem segura)
const BocaVisita: React.FC<{ v: string }> = ({ v }) =>
  v === "A" ? <ellipse cx={100} cy={120} rx={11} ry={13} fill={C.tinta} />
    : v === "E" ? <ellipse cx={100} cy={119} rx={14} ry={7} fill={C.tinta} />
    : v === "O" ? <ellipse cx={100} cy={120} rx={8} ry={10} fill={C.tinta} />
    : v === "M" ? <path d="M90 119 H110" stroke={C.tinta} strokeWidth={4} strokeLinecap="round" />
    : <path d="M88 118 Q100 126 112 118" stroke={C.tinta} strokeWidth={4} fill="none" strokeLinecap="round" />;
const PoteDeBolo: React.FC<{ x: number; y: number; w: number }> = ({ x, y, w }) => {
  const k = w / 60;
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <rect x={-30} y={-18} width={60} height={36} rx={8} fill="#FFFFFF" fillOpacity={0.85} stroke="#9FB4C8" strokeWidth={2.5} />
      <path d="M-22 10 V-4 L18 -12 V10 Z" fill="#F7C64D" /><path d="M-22 -4 L18 -12 L22 -10 L-18 -2 Z" fill="#8A4A1C" />
      <rect x={-33} y={-26} width={66} height={11} rx={5} fill="#4F86C6" />
    </g>
  );
};

// ================================================================ o visitante: um pin genérico (azul), com o mapa na mão
const Visitante: React.FC<{
  cx: number; base: number; altura: number; t: number; anda?: number; estado?: "normal" | "perdido" | "cansado" | "dormindo"; olha?: number; pulo?: number; mapa?: boolean;
  boca?: string; pote?: boolean;   // (#02) a boca da fala (visema R/A/E/O/M) e o pote de bolo nas mãos
  nao?: number; xicara?: boolean; prato?: number;   // (#03) a mão levantada fazendo "não" (0..1), a xícara (mão esquerda), o prato com N pães (mão direita)
}> = ({
  cx, base, altura, t, anda = 0, estado = "normal", olha = 0, pulo = 0, mapa = true, boca, pote, nao = 0, xicara, prato = 0,
}) => {
  const k = altura / 260;
  const passo = Math.sin(t * 11) * anda;
  const bob = Math.abs(Math.sin(t * 11)) * 6 * anda;
  const cansado = estado === "cansado", dormindo = estado === "dormindo";
  const azul = "#5A8FD8", azul2 = "#3F6DB3";
  const sentado = dormindo;
  return (
    <Ator nome="visita"><div style={{ position: "absolute", left: cx - 100 * k, top: base - 260 * k - pulo + bob, width: 200 * k, height: 260 * k }}>
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
          {boca && !dormindo ? <BocaVisita v={boca} /> : cansado ? <ellipse cx={100} cy={122} rx={10} ry={12} fill={C.tinta} /> : dormindo ? <path d="M92 120 Q100 124 108 120" stroke={C.tinta} strokeWidth={4} fill="none" /> : <path d="M88 118 Q100 126 112 118" stroke={C.tinta} strokeWidth={4} fill="none" strokeLinecap="round" />}
          {/* os braços e o mapa aberto na frente */}
          {nao > 0 ? (() => {
            // o braço levanta e a mão abana "não" (gira no ombro)
            const hx = 46 + (4 - 46) * nao, hy = 172 + (92 - 172) * nao, gira = nao * 16 * Math.sin(t * 17);
            return (
              <g transform={`rotate(${gira} 40 140)`}>
                <path d={`M40 140 Q${30 - 18 * nao} ${158 - 30 * nao} ${hx} ${hy}`} stroke={azul2} strokeWidth={12} strokeLinecap="round" fill="none" />
                <circle cx={hx} cy={hy} r={13} fill="#fff" />
                {[-9, -3, 3, 9].map((dx) => <rect key={dx} x={hx + dx - 2.6} y={hy - 22} width={5.2} height={13} rx={2.6} fill="#fff" />)}
              </g>
            );
          })() : <path d="M40 140 Q30 160 48 172" stroke={azul2} strokeWidth={12} strokeLinecap="round" fill="none" />}
          <path d="M160 140 Q170 160 152 172" stroke={azul2} strokeWidth={12} strokeLinecap="round" fill="none" />
          {mapa && (
            <g transform={`translate(100 172) rotate(${cansado ? 18 : -4})`}>
              <path d="M-62 -26 L-20 -34 L20 -26 L62 -34 V26 L20 34 L-20 26 L-62 34 Z" fill="#F7EBD0" stroke="#B89A6A" strokeWidth={3} />
              <path d="M-20 -34 V26 M20 -26 V34" stroke="#D9C49C" strokeWidth={3} />
              <path d="M-50 18 Q-30 -10 -5 6 T48 -20" stroke={C.coral} strokeWidth={4} strokeDasharray="6 6" fill="none" />
              <circle cx={48} cy={-20} r={6} fill={C.coral} />
            </g>
          )}
          {pote && <PoteDeBolo x={100} y={176} w={86} />}
          {xicara && nao === 0 && <Xicara x={46} y={150} w={34} t={t} />}
          {prato > 0 && <PratoPao x={156} y={162} w={70} n={prato} t={t} vapor={false} />}
          {nao === 0 && <circle cx={46} cy={172} r={11} fill="#fff" />}<circle cx={154} cy={172} r={11} fill="#fff" />
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
    </div></Ator>
  );
};

// ================================================================ o Pertim (o mineiro) + os acessórios (chinelo e xícara)
const VB: Record<string, number[]> = { parado: [0, 18, 240, 270], moto: [-24, 40, 300, 254] };
const vbDe = (pose: string) => VB[pose] ?? [-20, 6, 280, 284];
// chinelo e café: desenhados POR CIMA do Pertim oficial, no mesmo viewBox (o desenho dele não muda): o pé descalço com
// o chinelo cobre o tênis; a xícara fica na luva de baixo (pose "parado")
const Acessorios: React.FC<{ altura: number; pose: Pose; quique?: number; respira?: number; t: number; chinelo?: boolean; cafe?: boolean; pote?: boolean;
  xicara?: boolean; prato?: number; termica?: boolean; aceno?: number }> = ({ altura, pose, quique = 0, respira = 0, t, chinelo, cafe, pote, xicara, prato = 0, termica, aceno = 0 }) => {
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
        {pote && pose === "parado" && <g transform={corpoT}><PoteDeBolo x={216} y={200} w={44} /></g>}
        {/* (#03) a xícara na ponta da mão estendida (o braço do "apontando" gira no ombro em 180, 172) */}
        {xicara && pose === "apontando" && <g transform={`${corpoT} rotate(${aceno} 180 172)`}><Xicara x={234} y={146} w={30} t={t} /></g>}
        {prato > 0 && pose === "parado" && <g transform={corpoT}><PratoPao x={214} y={196} w={64} n={prato} t={t} /></g>}
        {termica && pose === "parado" && (
          <g transform={corpoT}>
            <rect x={203} y={168} width={24} height={44} rx={6} fill="#C9302C" stroke="#3A2C26" strokeWidth={2} /><rect x={206} y={160} width={18} height={10} rx={3} fill="#3A2C26" />
            <rect x={205} y={182} width={20} height={5} fill="#F4EFE8" opacity={0.8} />
          </g>
        )}
      </g>
    </svg>
  );
};
const PertimEm: React.FC<{
  t: number; quadro: number; d: DadosEpisodio; pose: Pose; expr: Expressao; cx: number; base: number; altura: number; olhar?: [number, number];
  chinelo?: boolean; cafe?: boolean; rot?: number; aceno?: number; pote?: boolean; cansado?: number;
  xicara?: boolean; prato?: number; termica?: boolean; sobe?: number;   // (#03) o que ele segura; "sobe": um pulinho (px, para o "dar de ombros")
}> = ({ t, quadro, d, pose, expr, cx, base, altura, olhar = [0, 0], chinelo, cafe, rot = 0, aceno, pote, cansado = 0, xicara, prato = 0, termica, sobe = 0 }) => {
  // a boca mexe só nas falas DELE (o "falante" da cena; sem falante, é o Pertim)
  const falando = d.cenas.some((c) => (c.falante ?? "pertim") === "pertim" && t >= c.voz_t0 - 0.02 && t <= c.voz_t1 + 0.04);
  const boca = bocaNoQuadro({ fps: d.fps, bocas: d.visemas, codigos: {} } as Visemas, quadro, falando);
  const [, , vw, vh] = vbDe(pose);
  const w = (altura * vw) / vh;
  const resp = respiracao(t);
  const rig: PertimRig = { ...resp, piscada: Math.max(cansado, piscadaEm(d.piscadas, t, d.piscada_dur)), olhar, centro: true,
    aceno: aceno ?? (pose === "acenando" ? 12 * Math.sin(t * 9) : pose === "apontando" ? -14 + 3 * Math.sin(t * 2.5) : 0) };
  const [vx, vy] = vbDe(pose), mascara = React.useContext(MascaraCtx);
  return (
    <>
      <Ator nome="pertim">
        <div style={{ position: "absolute", left: cx - w / 2, top: base - altura - sobe, width: w, height: altura, transform: `rotate(${rot}deg)`, transformOrigin: "50% 95%" }}>
          <Pertim v={1} pose={pose} expr={expr} mouth={boca ?? "auto"} altura={altura} rig={rig} />
          {(chinelo || cafe || pote || xicara || prato > 0 || termica) && <Acessorios altura={altura} pose={pose} respira={resp.respira} t={t} chinelo={chinelo} cafe={cafe} pote={pote}
            xicara={xicara} prato={prato} termica={termica} aceno={rig.aceno} />}
        </div>
      </Ator>
      {/* (só na máscara) o rosto: olhos, bochechas e boca, de x 70 a 170 e y 128 a 208 no desenho */}
      {mascara && <Ator nome="rosto"><div style={{ position: "absolute", left: cx - w / 2 + ((70 - vx) / vw) * w, top: base - altura + ((128 - vy) / vh) * altura,
        width: (100 / vw) * w, height: (80 / vh) * altura, background: "#fff" }} /></Ator>}
    </>
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

// ================================================================ #02 em diante: a casa (sala, porta, portão, carro) e o relógio
// (blocos novos; os do #01 não mudam). Coordenadas do mundo (o chão em y CHAO), dentro do <Mundo>.
const minutos = (h: string) => { const [a, b] = h.split(":").map(Number); return a * 60 + b; };
const hhmm = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(Math.floor(m % 60)).padStart(2, "0")}`;
// o relógio do canto: mostra a hora da cena e, a cada troca de hora, os ponteiros dão uma volta a mais, rápido
export const Relogio: React.FC<{ min: number; giro?: number; size?: number }> = ({ min, giro = 0, size = 128 }) => {
  const r = size / 2;
  const angM = min * 6 + giro * 360, angH = min * 0.5 + giro * 30;
  return (
    <div style={{ position: "relative", width: size, height: size + 58 }}>
      <svg width={size} height={size} viewBox="-50 -50 100 100" style={{ filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.3))" }}>
        <circle r={47} fill="#FFF9F1" stroke={C.coral} strokeWidth={6} />
        {Array.from({ length: 12 }).map((_, i) => { const a = (i / 12) * Math.PI * 2; return <line key={i} x1={Math.sin(a) * 36} y1={-Math.cos(a) * 36} x2={Math.sin(a) * (i % 3 ? 40 : 33)} y2={-Math.cos(a) * (i % 3 ? 40 : 33)} stroke={C.tinta} strokeWidth={i % 3 ? 2 : 4} strokeLinecap="round" />; })}
        <line x1={0} y1={0} x2={0} y2={-22} stroke={C.tinta} strokeWidth={6} strokeLinecap="round" transform={`rotate(${angH})`} />
        <line x1={0} y1={6} x2={0} y2={-34} stroke={C.coral} strokeWidth={4} strokeLinecap="round" transform={`rotate(${angM})`} />
        <circle r={4.5} fill={C.tinta} />
      </svg>
      <div style={{ position: "absolute", left: "50%", top: size + 6, transform: "translateX(-50%)", padding: "4px 14px", borderRadius: 999, background: C.tinta, color: AMARELO,
        fontFamily: FONT, fontWeight: W.black, fontSize: r * 0.5, lineHeight: 1.1, letterSpacing: 1, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{hhmm(min)}</div>
    </div>
  );
};
const relogioEm = (d: DadosEpisodio, t: number) => {
  const cs = d.cenas.filter((c) => c.diagrama.relogio);
  if (!cs.length) return null;
  let k = 0;
  cs.forEach((c, i) => { if (t >= c.t0 - 0.1) k = i; });
  const atual = minutos(cs[k].diagrama.relogio), ant = k ? minutos(cs[k - 1].diagrama.relogio) : atual;
  const u = ant === atual ? 1 : inOut(entre(t, cs[k].t0 - 0.1, cs[k].t0 + 0.45));
  return { min: ant + (atual - ant) * u, giro: ant === atual ? 0 : u };
};
// o céu da noite de cidadezinha (a lua do lado esquerdo, longe do relógio)
const NoiteCidade: React.FC<{ t: number; lua?: [number, number] }> = ({ t, lua = [520, 470] }) => (
  <>
    <AbsoluteFill style={{ background: "linear-gradient(to bottom, #16213E 0%, #2B3C68 60%, #3A4F82 100%)" }} />
    {Array.from({ length: 26 }).map((_, i) => {
      const x = random(`ec-x-${i}`) * 1080, y = 230 + random(`ec-y-${i}`) * 650, s = 3 + random(`ec-s-${i}`) * 5, br = 0.5 + 0.5 * Math.sin(t * 3 + i);
      return <div key={i} style={{ position: "absolute", left: x, top: y, width: s, height: s, borderRadius: "50%", background: "#FFF6D8", opacity: 0.4 + 0.6 * br }} />;
    })}
    <div style={{ position: "absolute", left: lua[0], top: lua[1], width: 120, height: 120, borderRadius: "50%", background: "#FFF3C4", boxShadow: "0 0 60px 18px rgba(255,243,196,0.3)" }}>
      <div style={{ position: "absolute", left: 24, top: 30, width: 22, height: 22, borderRadius: "50%", background: "#EADFB0" }} />
    </div>
  </>
);
// a parede e o chão de madeira da casa (sala e porta)
const Interior: React.FC<{ porta?: boolean }> = ({ porta }) => (
  <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0 }}>
    <rect x={0} y={0} width={1080} height={1180} fill="#F3E2C3" />
    {Array.from({ length: 16 }).map((_, i) => <rect key={i} x={i * 70} y={0} width={30} height={1000} fill="#EAD3AE" opacity={0.6} />)}
    <rect x={0} y={1000} width={1080} height={180} fill="#E8C27E" /><rect x={0} y={992} width={1080} height={16} fill="#C9955E" />
    <rect x={0} y={1180} width={1080} height={740} fill="#C98B52" />
    {Array.from({ length: 12 }).map((_, i) => <line key={i} x1={0} y1={1240 + i * 62} x2={1080} y2={1240 + i * 62} stroke="#B57A45" strokeWidth={5} />)}
    {Array.from({ length: 30 }).map((_, i) => <line key={`j${i}`} x1={(i * 197) % 1080} y1={1180 + (i % 12) * 62} x2={(i * 197) % 1080} y2={1242 + (i % 12) * 62} stroke="#A86D3C" strokeWidth={4} />)}
    <rect x={0} y={1172} width={1080} height={14} fill="#8A5A35" />
    {porta ? (
      <g>
        {/* a porta da rua, aberta para a noite */}
        <rect x={150} y={590} width={280} height={600} fill="#7A5233" />
        <rect x={172} y={612} width={236} height={578} fill="#1E2A4A" />
        <circle cx={330} cy={700} r={4} fill="#FFF6D8" /><circle cx={230} cy={760} r={3} fill="#FFF6D8" />
        <path d="M172 1080 Q240 1010 300 1060 T408 1040 V1190 H172 Z" fill="#22332F" />
        <path d="M172 612 L120 640 V1190 L172 1190 Z" fill="#9A6A3A" /><circle cx={150} cy={900} r={7} fill={AMARELO} />
        <rect x={190} y={1186} width={220} height={22} rx={6} fill={C.coral} opacity={0.85} />
        {/* o cabideiro com o chapéu */}
        <rect x={905} y={640} width={14} height={540} rx={6} fill="#7A5233" />
        <path d="M870 700 Q912 640 954 700 Z" fill="#C9955E" /><ellipse cx={912} cy={702} rx={50} ry={10} fill="#B07A44" />
      </g>
    ) : (
      <g>
        {/* a janela com a noite, as cortinas, o quadro de morro e o abajur */}
        <rect x={160} y={520} width={240} height={290} rx={10} fill="#9A6A3A" />
        <rect x={176} y={536} width={208} height={258} fill="#1E2A4A" /><circle cx={330} cy={600} r={26} fill="#FFF3C4" />
        <circle cx={220} cy={580} r={3} fill="#FFF6D8" /><circle cx={260} cy={640} r={3} fill="#FFF6D8" />
        <line x1={280} y1={536} x2={280} y2={794} stroke="#9A6A3A" strokeWidth={8} /><line x1={176} y1={665} x2={384} y2={665} stroke="#9A6A3A" strokeWidth={8} />
        <path d="M150 510 Q190 660 150 830 H190 Q215 660 190 510 Z" fill={C.coral} /><path d="M410 510 Q370 660 410 830 H370 Q345 660 370 510 Z" fill={C.coral} />
        <rect x={480} y={600} width={170} height={130} rx={6} fill="#9A6A3A" /><rect x={492} y={612} width={146} height={106} fill="#9ED8F5" />
        <path d="M492 718 Q540 650 590 700 Q615 670 638 700 V718 Z" fill="#6FAF55" /><circle cx={605} cy={640} r={14} fill={AMARELO} />
        <rect x={930} y={640} width={10} height={540} fill="#3A2C26" /><path d="M880 650 L990 650 L960 580 L910 580 Z" fill={AMARELO} />
        <defs><radialGradient id="cm-brilho"><stop offset="0" stopColor="#FFD66B" stopOpacity={0.35} /><stop offset="1" stopColor="#FFD66B" stopOpacity={0} /></radialGradient></defs><circle cx={935} cy={680} r={220} fill="url(#cm-brilho)" />
        <ellipse cx={540} cy={1340} rx={430} ry={50} fill="#E07B3C" opacity={0.75} />
        {/* a mesinha com o café e o pão de queijo */}
        <rect x={60} y={1050} width={130} height={14} rx={6} fill="#9A6A3A" /><rect x={90} y={1064} width={12} height={120} fill="#7A5233" /><rect x={150} y={1064} width={12} height={120} fill="#7A5233" />
        <rect x={80} y={1022} width={26} height={28} rx={4} fill="#F4EFE8" stroke="#3A2C26" strokeWidth={2} /><ellipse cx={150} cy={1044} rx={30} ry={7} fill="#fff" />
        {[[138, 1036], [156, 1032], [148, 1026]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={9} fill="#F2C063" />)}
      </g>
    )}
  </svg>
);
// o primeiro plano da casa (perto da câmera, preenchendo a parte de baixo)
const FrenteCasa: React.FC<{ porta?: boolean; bolo?: boolean }> = ({ porta, bolo }) => (
  <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0 }}>
    {porta ? (
      <g>
        <rect x={340} y={1590} width={420} height={60} rx={24} fill={C.coral} opacity={0.9} /><rect x={360} y={1604} width={380} height={32} rx={14} fill="none" stroke="#FFF3C4" strokeWidth={4} strokeDasharray="14 10" />
        <path d="M80 1700 L110 1560 H250 L280 1700 Z" fill="#C0643A" /><rect x={100} y={1548} width={160} height={24} rx={8} fill="#A8532E" />
        {[-70, -40, -10, 20, 50, 80].map((a, i) => <path key={i} d={`M180 1552 Q${180 + 2.4 * a} ${1440 - Math.abs(a)} ${180 + 3.4 * a} ${1480 + Math.abs(a) * 0.8}`} stroke="#3E9E4E" strokeWidth={16} fill="none" strokeLinecap="round" />)}
        <path d="M800 1700 L830 1590 H990 L1020 1700 Z" fill="#7A5233" /><path d="M850 1590 Q850 1530 910 1530 Q970 1530 970 1590 Z" fill="#2F7A3A" />
      </g>
    ) : (
      <g>
        <rect x={250} y={1560} width={580} height={36} rx={14} fill="#9A6A3A" /><rect x={280} y={1596} width={520} height={110} fill="#7A5233" />
        <rect x={330} y={1480} width={50} height={84} rx={10} fill="#C9302C" /><rect x={340} y={1466} width={30} height={20} rx={4} fill="#3A2C26" />
        <rect x={420} y={1520} width={46} height={40} rx={6} fill="#F4EFE8" stroke="#3A2C26" strokeWidth={3} /><path d="M466 1530 q18 2 0 20" stroke="#3A2C26" strokeWidth={4} fill="none" />
        <ellipse cx={620} cy={1556} rx={110} ry={16} fill="#F4EFE8" />
        {bolo ? (
          <g>
            {/* (#03) o bolo de fubá, com calda */}
            <path d="M540 1552 V1470 Q540 1452 560 1452 H680 Q700 1452 700 1470 V1552 Z" fill="#E9B44C" />
            <path d="M540 1474 Q540 1452 560 1452 H680 Q700 1452 700 1474 Q690 1494 680 1476 Q668 1500 655 1478 Q640 1502 626 1478 Q612 1500 598 1478 Q584 1498 570 1476 Q556 1496 540 1474 Z" fill="#7A4424" />
            <ellipse cx={620} cy={1462} rx={22} ry={8} fill="#F2D5B0" /><rect x={600} y={1500} width={8} height={8} rx={2} fill="#D99A2B" /><rect x={650} y={1520} width={8} height={8} rx={2} fill="#D99A2B" />
          </g>
        ) : [[560, 1540], [600, 1534], [640, 1540], [680, 1544], [580, 1522], [625, 1516], [660, 1524]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={20} fill="#F2C063" stroke="#D9A043" strokeWidth={3} />)}
      </g>
    )}
  </svg>
);
// o sofá: o encosto (atrás de quem senta) e a frente do assento (na frente: esconde as pernas de quem está sentado)
const SofaFundo: React.FC = () => (
  <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0 }}>
    <rect x={200} y={890} width={680} height={290} rx={60} fill="#2F7A3A" />
    <rect x={225} y={915} width={300} height={200} rx={40} fill="#3E9E4E" /><rect x={555} y={915} width={300} height={200} rx={40} fill="#3E9E4E" />
  </svg>
);
const SofaFrente: React.FC = () => (
  <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0 }}>
    <rect x={190} y={1180} width={700} height={150} rx={36} fill="#2F7A3A" />
    <rect x={200} y={1180} width={680} height={46} rx={22} fill="#4FB15E" />
    <rect x={150} y={1060} width={100} height={270} rx={44} fill="#3E9E4E" /><rect x={830} y={1060} width={100} height={270} rx={44} fill="#3E9E4E" />
    <rect x={220} y={1326} width={24} height={26} rx={6} fill="#5B3A29" /><rect x={836} y={1326} width={24} height={26} rx={6} fill="#5B3A29" />
  </svg>
);
// a rua à noite: a casa do vizinho (com a janela que apaga), o muro com o portão, a casa do Pertim, o poste, a calçada
// (desenhada de x −1400 a 2400 e até y 2600: a câmera afastada do carro e do fecho mostra mais dos lados e de baixo)
const Rua: React.FC<{ luzVizinho: number }> = ({ luzVizinho }) => (
  <svg width={3800} height={2600} viewBox="-1400 0 3800 2600" style={{ position: "absolute", left: -1400, top: 0 }}>
    <defs><radialGradient id="cm-luz"><stop offset="0" stopColor="#FFD66B" stopOpacity={0.45} /><stop offset="1" stopColor="#FFD66B" stopOpacity={0} /></radialGradient></defs>
    {/* mais casas dos lados (só aparecem com a câmera afastada) */}
    <rect x={-700} y={700} width={680} height={420} fill="#9C7F6C" /><path d="M-740 712 L-360 540 L-10 712 Z" fill="#5E3A2E" />
    <rect x={-530} y={780} width={130} height={110} rx={6} fill="#25304E" stroke="#4A3A30" strokeWidth={8} /><line x1={-465} y1={780} x2={-465} y2={890} stroke="#4A3A30" strokeWidth={6} />
    <rect x={-260} y={790} width={110} height={100} rx={6} fill="#25304E" stroke="#4A3A30" strokeWidth={8} />
    <rect x={1080} y={720} width={520} height={420} fill="#B9A58C" /><path d="M1050 732 L1340 580 L1630 732 Z" fill="#6B3527" />
    <rect x={1200} y={800} width={120} height={100} rx={6} fill="#25304E" stroke="#4A3A30" strokeWidth={8} />
    <rect x={110} y={700} width={380} height={420} fill="#8C7B6A" /><path d="M80 712 L300 560 L520 712 Z" fill="#6B3527" />
    {luzVizinho > 0 && <circle cx={300} cy={830} r={190} fill="url(#cm-luz)" opacity={luzVizinho} />}
    <rect x={240} y={770} width={120} height={110} rx={6} fill={interpolateColors(luzVizinho, [0, 1], ["#25304E", "#FFE48A"])} stroke="#4A3A30" strokeWidth={8} />
    <line x1={300} y1={770} x2={300} y2={880} stroke="#4A3A30" strokeWidth={6} />
    <rect x={720} y={680} width={360} height={460} fill="#D9BE96" /><path d="M690 692 L900 540 L1110 692 Z" fill="#8A3B26" />
    <rect x={780} y={820} width={110} height={200} rx={6} fill="#FFD27A" stroke="#4A3A30" strokeWidth={8} /><circle cx={835} cy={900} r={170} fill="url(#cm-luz)" />
    <rect x={940} y={780} width={100} height={90} rx={6} fill="#FFE48A" stroke="#4A3A30" strokeWidth={8} />
    <rect x={-1400} y={1010} width={3800} height={170} fill="#6E6A78" /><rect x={-1400} y={996} width={3800} height={20} rx={6} fill="#86829A" />
    <rect x={588} y={930} width={34} height={250} rx={6} fill="#7E7A90" /><rect x={762} y={930} width={34} height={250} rx={6} fill="#7E7A90" />
    <rect x={622} y={1012} width={140} height={168} fill="#2A3558" />
    {Array.from({ length: 5 }).map((_, i) => <line key={i} x1={600 - i * 7} y1={1020 + i * 4} x2={600 - i * 7} y2={1176} stroke="#2E6E3A" strokeWidth={8} />)}
    <rect x={560} y={1016} width={48} height={10} fill="#2E6E3A" />
    <rect x={1000} y={560} width={14} height={620} fill="#3A3A48" /><path d="M960 570 H1040 L1020 540 H980 Z" fill="#3A3A48" />
    <circle cx={1007} cy={585} r={16} fill="#FFE48A" /><circle cx={1007} cy={600} r={200} fill="url(#cm-luz)" opacity={0.6} />
    <rect x={-1400} y={1180} width={3800} height={140} fill="#5D5A68" /><rect x={-1400} y={1310} width={3800} height={16} fill="#7A7690" />
    {/* os paralelepípedos (o primeiro plano da rua, até embaixo) */}
    <rect x={-1400} y={1326} width={3800} height={1274} fill="#3C4156" />
    {/* (lá embaixo, só com a câmera afastada) a calçada do outro lado da rua, com o meio-fio e o capim */}
    {Array.from({ length: 29 }).map((_, r) => Array.from({ length: 55 }).map((_, c) => (
      <rect key={`${r}-${c}`} x={((c - 19) * 76 + (r % 2) * 38) - 30} y={1340 + r * 44} width={66} height={34} rx={10} fill={(r + c + 2) % 3 ? "#4A5068" : "#535A74"} />
    )))}
    <rect x={-1400} y={1700} width={3800} height={30} fill="#8E8AA2" /><rect x={-1400} y={1730} width={3800} height={900} fill="#5D5A68" />
    <rect x={-1400} y={1800} width={3800} height={800} fill="#2E5A3A" />
    {Array.from({ length: 60 }).map((_, i) => {
      const x = -1400 + i * 64 + 30 * random(`cg-${i}`), y = 1805 + 30 * random(`cgy-${i}`), hh = 70 + 70 * random(`cgh-${i}`);
      return <path key={i} d={`M${x - 26} ${y + 10} Q${x - 12} ${y - hh} ${x} ${y + 10} Q${x + 14} ${y - hh * 0.8} ${x + 28} ${y + 10} Z`} fill={i % 2 ? "#3E7A4A" : "#4C8F57"} />;
    })}
    {Array.from({ length: 18 }).map((_, i) => <circle key={`f${i}`} cx={-1300 + i * 210 + 60 * random(`cf-${i}`)} cy={1790 + 30 * random(`cfy-${i}`)} r={16} fill={i % 3 ? "#FFE48A" : "#F7A6B5"} />)}
  </svg>
);
// o cachorro: sentado → deita (u) → dorme (zz)
const Cachorro: React.FC<{ x: number; u: number; dorme: number; t: number; base?: number }> = ({ x, u, dorme, t, base = CHAO }) => (
  <Ator nome="cachorro"><div style={{ position: "absolute", left: x - 120, top: base - 190, width: 240, height: 200 }}>
    <svg width={240} height={200} viewBox="0 0 240 200" style={{ overflow: "visible" }}>
      <ellipse cx={120} cy={194} rx={90} ry={8} fill="#000" opacity={0.2} />
      <g transform={`translate(0 ${40 * u})`}>
        <path d={`M60 ${170 - 40 * (1 - u)} Q50 ${120 - 30 * (1 - u)} 110 ${110 - 20 * (1 - u)} Q190 ${110 + 10 * u} 196 ${160} Q196 186 170 186 H70 Q50 186 60 ${170 - 40 * (1 - u)} Z`} fill="#B5753E" />
        <path d={`M190 ${150} Q215 ${140 - 20 * (1 - u)} 210 ${120 - 30 * (1 - u)}`} stroke="#B5753E" strokeWidth={10} fill="none" strokeLinecap="round" transform={`rotate(${dorme > 0 ? 0 : 8 * Math.sin(t * 12)} 190 150)`} />
        <g transform={`translate(${70 - 10 * u} ${90 - 30 * (1 - u) + 40 * u}) rotate(${-10 * u})`}>
          <circle r={42} fill="#C9884A" />
          <path d="M-36 -18 Q-62 10 -40 34 Q-30 12 -24 -8 Z" fill="#8A5530" /><path d="M36 -18 Q62 10 40 34 Q30 12 24 -8 Z" fill="#8A5530" />
          <ellipse cx={0} cy={18} rx={18} ry={13} fill="#F2D5B0" /><ellipse cx={0} cy={10} rx={8} ry={6} fill="#2E2421" />
          {dorme > 0 ? (<><path d="M-22 -6 q8 6 14 0" stroke="#2E2421" strokeWidth={4} fill="none" /><path d="M8 -6 q8 6 14 0" stroke="#2E2421" strokeWidth={4} fill="none" /></>)
            : (<><circle cx={-15} cy={-6} r={6} fill="#2E2421" /><circle cx={15} cy={-6} r={6} fill="#2E2421" /></>)}
        </g>
      </g>
    </svg>
    {dorme > 0 && [0, 1, 2].map((i) => { const k = ((t * 0.7 + i / 3) % 1); return <div key={i} style={{ position: "absolute", left: 20 + 30 * k, top: 40 - 80 * k, fontFamily: FONT, fontWeight: W.black, fontSize: 30 + 12 * k, color: "#FFF3C4", opacity: dorme * (1 - k) }}>z</div>; })}
  </div></Ator>
);
// o carro (genérico, de lado, virado para a esquerda) em ESCALA dos personagens: 940 × 540 no mundo (o teto fica acima da
// cabeça do Pertim em pé, que tem 500; a visita cabe sentada, com a cabeça na janela da frente; o cachorro é bem menor).
// Em camadas: o interior escuro → a visita sentada (children) → a lataria com as janelas vazadas, o vidro, as rodas.
export const CARRO = { w: 940, h: 540, janela: { cx: 432, cy: 196 } };   // (coordenadas do carro: o chão em y 540)
const CORPO_CARRO = "M40 290 Q20 292 18 320 L18 440 Q18 470 48 470 L112 470 A80 80 0 0 1 268 470 L672 470 A80 80 0 0 1 828 470 L896 470 Q926 470 926 440 L926 300 Q926 270 900 262 L864 52 Q852 4 800 2 L420 2 Q378 2 356 34 L246 280 Z";
const JANELA_FRENTE = "M268 290 L362 66 Q374 40 404 40 L560 40 L560 290 Z";
const JANELA_TRAS = "M592 40 L792 40 Q820 40 828 70 L860 290 L592 290 Z";
const CarroCena: React.FC<{ x0: number; t: number; vidro: number; liga: number; bla?: number; children?: React.ReactNode }> = ({ x0, t, vidro, liga, bla = 0, children }) => {
  const treme = liga > 0 ? Math.sin(t * 60) * 2 * liga : 0;
  const caixa: React.CSSProperties = { position: "absolute", left: x0, top: CHAO - CARRO.h + treme, width: CARRO.w, height: CARRO.h };
  return (
    <>
      <Ator nome="carro"><div style={caixa}><svg width={CARRO.w} height={CARRO.h} viewBox={`0 0 ${CARRO.w} ${CARRO.h}`} style={{ overflow: "visible" }}>
        <path d={JANELA_FRENTE} fill="#1E2A4A" /><path d={JANELA_TRAS} fill="#1E2A4A" />
        {/* o encosto do banco */}
        <path d="M470 150 Q520 140 540 170 L548 290 H470 Z" fill="#15203A" />
      </svg></div></Ator>
      <div style={{ position: "absolute", left: 0, top: treme, width: 0, height: 0 }}>{children}</div>
      <Ator nome="carro"><div style={caixa}><svg width={CARRO.w} height={CARRO.h} viewBox={`0 0 ${CARRO.w} ${CARRO.h}`} style={{ overflow: "visible" }}>
        <defs><clipPath id="cm-janela-frente"><path d={JANELA_FRENTE} /></clipPath></defs>
        <ellipse cx={470} cy={536} rx={450} ry={14} fill="#000" opacity={0.28} transform={`translate(0 ${-treme})`} />
        {liga > 0 && [0, 1, 2].map((i) => { const k = ((t * 1.6 + i / 3) % 1); return <circle key={i} cx={938 + 70 * k} cy={452 - 36 * k} r={16 + 26 * k} fill="#9A98A8" opacity={0.6 * (1 - k) * liga} />; })}
        {/* a lataria, com as duas janelas vazadas (a de trás, escura; a da frente mostra quem está sentado) */}
        <path d={`${CORPO_CARRO} ${JANELA_FRENTE} ${JANELA_TRAS}`} fillRule="evenodd" fill="#2F9C95" />
        <path d="M30 330 H920" stroke="#25807A" strokeWidth={8} />
        <path d="M250 300 V462 M576 40 V462 M862 300 V462" stroke="#25807A" strokeWidth={6} />
        <path d="M560 40 H592 V290 H560 Z" fill="#25807A" />
        <path d="M420 10 H800 Q838 12 850 40" stroke="#5FC2BA" strokeWidth={8} fill="none" strokeLinecap="round" />
        <rect x={500} y={344} width={50} height={12} rx={6} fill="#1F6B66" /><rect x={790} y={344} width={50} height={12} rx={6} fill="#1F6B66" />
        <path d="M250 286 L226 280 Q214 296 226 310 L252 306 Z" fill="#25807A" />
        <rect x={18} y={340} width={46} height={30} rx={10} fill="#FFE48A" /><rect x={904} y={312} width={24} height={44} rx={8} fill="#E8503A" />
        <rect x={10} y={418} width={70} height={34} rx={12} fill="#8C8A98" /><rect x={880} y={418} width={56} height={34} rx={12} fill="#8C8A98" />
        {/* o vidro da janela da frente: desce para dentro da porta */}
        <g clipPath="url(#cm-janela-frente)"><rect x={250} y={36 + 262 * vidro} width={320} height={262} fill="#A9C7E6" opacity={0.5} />
          <rect x={250} y={36 + 262 * vidro} width={320} height={8} fill="#DDEBF7" opacity={0.8} /></g>
        <path d={JANELA_TRAS} fill="#A9C7E6" opacity={0.45} />
        {[190, 750].map((cx) => (
          <g key={cx} transform={`translate(0 ${-treme})`}>
            <circle cx={cx} cy={468} r={72} fill="#2E2A33" /><circle cx={cx} cy={468} r={38} fill="#9A98A8" /><circle cx={cx} cy={468} r={12} fill="#5D5A68" />
          </g>
        ))}
      </svg></div></Ator>
      {bla > 0 && (
        <div style={{ position: "absolute", left: x0 + 150, top: CHAO - CARRO.h - 190, transform: `scale(${bla})`, transformOrigin: "30% 100%", background: "#fff", border: `9px solid ${C.tinta}`,
          borderRadius: 50, padding: "6px 40px", fontFamily: FONT, fontWeight: W.black, fontSize: 84, color: C.tinta, whiteSpace: "nowrap" }}>blá blá blá…</div>
      )}
    </>
  );
};
// a cena da casa inteira, num instante t (sala, porta, portão, carro e o fecho no portão)
const CasaEmCena: React.FC<{ t: number; quadro: number; d: DadosEpisodio }> = ({ t, quadro, d }) => {
  const cenaEm = d.cenas.find((c) => t >= c.t0 - 1e-6 && t < c.t1) ?? d.cenas[d.cenas.length - 1];
  const tipo = cenaEm.tipo === "fecho" ? (cenaEm.diagrama.cenario ?? "portao") : cenaEm.tipo;
  const cena = (tp: string) => d.cenas.filter((c) => c.tipo === tp);
  const falaVisita = d.cenas.some((c) => c.falante === "visita" && t >= c.voz_t0 - 0.02 && t <= c.voz_t1 + 0.04);
  const bocaVisita = falaVisita ? d.visemas[Math.min(d.visemas.length - 1, quadro)] : undefined;
  const tomadaCarro = d.cenas.some((c) => c.tipo === "carro") && (cenaEm.tipo === "carro" || (cenaEm.tipo === "fecho" && (cenaEm.diagrama.cenario ?? "portao") === "portao"));
  const empurra = tomadaCarro ? 1 : cenaEm.n === 0
    ? 1 + 0.14 * Math.pow(1 - entre(t, 0, 0.9), 1.4)                                  // a abertura: a câmera entra na sala sem parar
    : 1 + 0.05 * (1 - outCubic(entre(t, cenaEm.t0, cenaEm.t0 + 0.35)));               // a câmera chega um tiquinho mais perto a cada corte
  const S = L.pertim, V = L.visitante;
  const conteudo: React.ReactNode[] = [];
  if (tipo === "sala") {
    const sc = cena("sala"), sl = sc.find((c) => c.diagrama.levanta) ?? null;
    const lev = sl ? sl.diagrama.levanta.t : 1e9, per = sl?.diagrama.pernas?.t ?? 1e9;
    const u = inOut(entre(t, lev, lev + 0.45));
    const tap = Math.max(0, Math.sin(Math.PI * entre(t, per, per + 0.22))) + Math.max(0, Math.sin(Math.PI * entre(t, per + 0.22, per + 0.44)));
    const visCx = interpolate(u, [0, 1], [380, 330]), visBase = interpolate(u, [0, 1], [CHAO - 70, CHAO + 10]);
    const pertimSentado = <PertimEm key="p" t={t} quadro={quadro} d={d} pose="parado" expr="sorrindo" cx={690} base={CHAO - 60} altura={500} olhar={t >= sc[0].t1 ? [-1, 0.1] : [0, 0]} />;
    const visita = <Visitante key="v" cx={visCx} base={visBase} altura={440} t={t} mapa={false} boca={bocaVisita} pulo={14 * tap} olha={-0.6} />;
    conteudo.push(<Interior key="i" />, <SofaFundo key="sf" />, pertimSentado);
    if (u < 0.5) conteudo.push(visita, <SofaFrente key="sfr" />);
    else conteudo.push(<SofaFrente key="sfr" />, visita);
    conteudo.push(<FrenteCasa key="fc" />);
    if (tap > 0.05) conteudo.push(<svg key="tap" width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: Math.min(1, tap) }}>
      {[[visCx - 110, CHAO - 120], [visCx + 110, CHAO - 120]].map(([x, y], i) => <g key={i} stroke={AMARELO} strokeWidth={8} strokeLinecap="round"><line x1={x - 20} y1={y} x2={x - 40} y2={y - 20} /><line x1={x + 20} y1={y} x2={x + 40} y2={y - 20} /><line x1={x} y1={y - 8} x2={x} y2={y - 36} /></g>)}
    </svg>);
  } else if (tipo === "porta") {
    const pc = cena("porta")[0], tb = pc.diagrama.bolo?.t ?? 1e9, tf = pc.diagrama.fica?.t ?? 1e9;
    const voa = entre(t, tb, tb + 0.4);
    const pose: Pose = t >= tf ? "apontando" : "parado";
    // a luva do Pertim (pose "parado": a luva de baixo em (201, 207) no viewBox 0 18 240 270) e as mãos da visita
    const PX = 650, alt = 520, w = (alt * 240) / 270, gx = PX - w / 2 + (201 / 240) * w, gy = CHAO - alt + ((207 - 18) / 270) * alt;
    const k = 440 / 260, hx = 310, hy = CHAO - 260 * k + 176 * k;
    conteudo.push(<Interior key="i" porta />);
    conteudo.push(<PertimEm key="p" t={t} quadro={quadro} d={d} pose={pose} expr="sorrindo" cx={PX} base={CHAO} altura={alt} olhar={[-1, 0.1]} pote={t < tb} />);
    conteudo.push(<Visitante key="v" cx={310} base={CHAO} altura={440} t={t} mapa={false} pote={voa >= 1} olha={0.7} />, <FrenteCasa key="fc" porta />);
    if (voa > 0 && voa < 1) {
      const x = gx + (hx - gx) * outCubic(voa), y = gy + (hy - gy) * voa - 160 * Math.sin(Math.PI * voa);
      conteudo.push(<svg key="voa" width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}><g transform={`rotate(${-200 * voa} ${x} ${y})`}><PoteDeBolo x={x} y={y} w={70} /></g></svg>);
    }
  } else {
    // o portão, o carro e o fecho: a mesma rua. No portão, a câmera de sempre (o carro fica fora do quadro); no carro e
    // no fecho, a câmera se afasta para mostrar o carro e o Pertim INTEIROS (folga de ≥ 60 px das bordas; o rosto do
    // Pertim à esquerda da coluna de botões do Instagram, x < 940)
    const pt = cena("portao")[0], cr = cena("carro")[0], fe = d.cenas.find((c) => c.tipo === "fecho");
    const tv = pt?.diagrama.vizinho?.t ?? 1e9, tc = pt?.diagrama.cachorro?.t ?? 1e9;
    const luz = 1 - entre(t, tv, tv + 0.15);
    if (cenaEm.tipo === "portao" || !cr) {
      conteudo.push(
        <div key="rua" style={{ position: "absolute", inset: 0 }}>
          <Rua luzVizinho={luz} />
          <Visitante cx={390} base={CHAO} altura={420} t={t} mapa={false} pote boca={bocaVisita} olha={0.7} />
          <PertimEm t={t} quadro={quadro} d={d} pose="parado" expr="sorrindo" cx={710} base={CHAO} altura={500} olhar={[-1, 0.1]} />
          <Cachorro x={555} base={CHAO + 15} u={inOut(entre(t, tc, tc + 0.45))} dorme={entre(t, tc + 0.7, tc + 0.9)} t={t} />
        </div>,
      );
    } else {
      const PX = 700, x0 = PX - 222 + 50 - CARRO.w, ox = (x0 + PX + 222) / 2;   // o Pertim no portão; o carro logo à esquerda dele
      const noFecho = fe && t >= fe.t0;
      const z = noFecho ? interpolate(t, [fe!.t0, fe!.t0 + 1.2], [0.515, 0.528], { ...clamp, easing: inOut }) : interpolate(t, [cr.t0, cr.t1], [0.495, 0.515], clamp);
      const kV = 420 / 260, janX = x0 + CARRO.janela.cx, sentadaBase = CHAO - CARRO.h + CARRO.janela.cy + (260 - 98) * kV;
      const anda = entre(t, cr.t0, cr.t0 + 0.4), dentro = t >= cr.t0 + 0.5;
      const vidroT = cr.diagrama.vidro?.t ?? 1e9;
      const vidro = inOut(entre(t, vidroT - 0.15, vidroT + 0.15));
      const bla = noFecho ? mola(t, fe!.t0 + 0.4, 0.35, 2) * (0.92 + 0.08 * Math.sin(t * 8)) : 0;
      conteudo.push(
        <div key="rua" style={{ position: "absolute", inset: 0, transform: `translate(${540 - ox}px, 0px) scale(${z})`, transformOrigin: `${ox}px ${CHAO}px` }}>
          <Rua luzVizinho={luz} />
          <CarroCena x0={x0} t={t} vidro={vidro} liga={entre(t, cr.t0 + 0.85, cr.t0 + 1.1)} bla={bla}>
            {dentro && <Visitante cx={janX} base={sentadaBase} altura={420} t={t} mapa={false} boca={vidro > 0.5 ? bocaVisita : undefined} olha={0.8} />}
          </CarroCena>
          <Cachorro x={x0 + 470} base={CHAO + 20} u={1} dorme={1} t={t} />
          {!dentro && <Visitante cx={interpolate(anda, [0, 1], [janX + 130, janX])} base={CHAO} altura={420} t={t} anda={anda < 1 ? 1 : 0} mapa={false} pote olha={-0.8} />}
          <PertimEm t={t} quadro={quadro} d={d} pose="parado" expr="sorrindo" cx={PX} base={CHAO} altura={500} olhar={noFecho ? [0, 0] : [-1, 0.1]} cansado={noFecho ? 0.42 : 0.3} />
        </div>,
      );
    }
  }
  return <div style={{ position: "absolute", inset: 0, transform: `scale(${empurra})`, transformOrigin: `540px ${CHAO}px` }}>{conteudo}</div>;
};

// ================================================================ #03 em diante: a sala da visita (cafe, pao, aceita, exagero, moral) e a legenda nova
// (blocos novos; os do #01 e do #02 não mudam). Coordenadas do mundo (o chão em y CHAO), dentro do <Mundo>.
// a xícara de café com fumacinha (x, y: o meio do fundo da xícara; w: a largura)
const Xicara: React.FC<{ x: number; y: number; w: number; t: number }> = ({ x, y, w, t }) => (
  <g transform={`translate(${x} ${y}) scale(${w / 30})`}>
    {[0, 1].map((i) => { const u = ((t * 0.8 + i * 0.5) % 1); return <path key={i} d={`M${-4 + 8 * i} ${-14 - 22 * u} q-5 -6 0 -12 q5 -6 0 -12`} stroke="#fff" strokeOpacity={0.8 * (1 - u)} strokeWidth={3.2} fill="none" strokeLinecap="round" />; })}
    <path d="M13 -8 a8 8 0 0 1 0 14" stroke="#F4EFE8" strokeWidth={4.5} fill="none" />
    <path d="M-15 -14 H15 L12 10 Q11 14 6 14 H-6 Q-11 14 -12 10 Z" fill="#F4EFE8" stroke="#3A2C26" strokeWidth={2.2} />
    <rect x={-14} y={-4} width={27} height={5} fill={C.coral} />
    <ellipse cx={0} cy={-13} rx={13.5} ry={3} fill="#6B3A1E" />
  </g>
);
// o prato de pão de queijo (x, y: o meio do prato; w: a largura; n: quantos pães; vapor: a fumacinha de quentinho)
const PratoPao: React.FC<{ x: number; y: number; w: number; n: number; t: number; vapor?: boolean }> = ({ x, y, w, n, t, vapor = true }) => {
  const P = [[-20, -4], [0, -6], [20, -4], [-10, -16], [10, -16], [0, -27], [-26, -14], [26, -14], [-14, -30], [14, -30], [0, -40]];
  return (
    <g transform={`translate(${x} ${y}) scale(${w / 80})`}>
      {vapor && [0, 1, 2].map((i) => { const u = ((t * 0.7 + i / 3) % 1); return <path key={i} d={`M${-16 + 16 * i} ${-34 - 30 * u} q-6 -8 0 -16 q6 -8 0 -16`} stroke="#fff" strokeOpacity={0.85 * (1 - u)} strokeWidth={4} fill="none" strokeLinecap="round" />; })}
      <ellipse cx={0} cy={4} rx={40} ry={9} fill="#fff" stroke="#3A2C26" strokeWidth={2} />
      {P.slice(0, n).map(([px, py], i) => <g key={i}><circle cx={px} cy={py} r={11} fill="#F2C063" stroke="#D9A043" strokeWidth={2} /><circle cx={px - 3} cy={py - 4} r={3} fill="#FBE3A6" /></g>)}
    </g>
  );
};
// o contador do canto (no lugar do relógio do #02): "RECUSA 1" → "RECUSA 2" → "ACEITOU!" (verde, com confete)
const contadorEm = (d: DadosEpisodio, t: number) => {
  const ev = d.cenas.filter((c) => c.diagrama.contador).map((c) => c.diagrama.contador as { texto: string; t: number; confete?: boolean });
  const ant = ev.filter((e) => t >= e.t);
  return ant.length ? ant[ant.length - 1] : null;
};
const Contador: React.FC<{ ev: { texto: string; t: number; confete?: boolean }; t: number }> = ({ ev, t }) => {
  const e = mola(t, ev.t, 0.38, 2.6), ok = !!ev.confete;
  const treme = !ok && t - ev.t < 0.45 ? 7 * Math.sin((t - ev.t) * 60) * (1 - (t - ev.t) / 0.45) : 0;
  return (
    <div style={{ position: "relative", transform: `scale(${e}) rotate(${(ok ? -3 : 4) + treme}deg)`, transformOrigin: "50% 50%" }}>
      <div style={{ padding: "10px 26px 12px", borderRadius: 22, background: ok ? VERDE : "#fff", border: `7px solid ${ok ? "#fff" : C.coral}`, boxShadow: "0 8px 0 rgba(34,28,25,0.25), 0 14px 26px rgba(34,28,25,0.25)",
        fontFamily: FONT, fontWeight: W.black, fontSize: 50, lineHeight: 1, letterSpacing: 1, color: ok ? "#fff" : C.coral, whiteSpace: "nowrap" }}>
        {ok ? "✔ " : "✖ "}{ev.texto}
      </div>
      {ok && Array.from({ length: 36 }).map((_, i) => {
        const u = entre(t, ev.t, ev.t + 1.6), a = random(`cf-a-${i}`) * Math.PI * 2, v = 160 + 260 * random(`cf-v-${i}`);
        const x = 150 + Math.cos(a) * v * outCubic(u), y = 40 + Math.sin(a) * v * outCubic(u) * 0.7 + 420 * u * u;
        const cor = [AMARELO, C.coral, "#5A8FD8", "#fff", VERDE][i % 5];
        return u > 0 && u < 1 ? <div key={i} style={{ position: "absolute", left: x, top: y, width: 14, height: 9, background: cor, borderRadius: 2, opacity: 1 - u * u,
          transform: `rotate(${720 * u * (random(`cf-r-${i}`) - 0.5)}deg)` }} /> : null;
      })}
    </div>
  );
};
// a LEGENDA NOVA da série (#03 em diante): solta sobre a cena, palavra a palavra. Cada palavra entra com um pop na hora
// em que é falada; a que está sendo dita fica maior e colorida (amarelo/laranja = Pertim; azul = visita), as já ditas
// voltam ao branco; a palavra-chave fica em verde com o marcador amarelo atrás.
type PalavraPop = { w: string; t0: number; ate: number; chave?: boolean };
type BlocoPop = { cena: number; falante: string; t0: number; t1: number; size?: number; linhas: PalavraPop[][] };
export const COR_FALA: Record<string, [string, string]> = { pertim: ["#F9B233", "#F08A00"], visita: ["#8EC5FF", "#4A86E0"] };
// o espaço entre as palavras nunca some: cada palavra ocupa no layout a largura que tem DESTACADA (12% maior), mais uma
// margem fixa de cada lado; a palavra visível é desenhada por cima, centrada nessa caixa, e cresce só dentro dela
export const LEG_ESCALA_ATIVA = 1.12, LEG_MARGEM = 0.24;   // (em "em": 0,24 de cada lado ≈ 0,48 em entre as caixas)
const PalavraPopV: React.FC<{ p: PalavraPop; t: number; falante: string; size: number }> = ({ p, t, falante, size }) => {
  const entrou = t >= p.t0, ativa = entrou && t < p.ate;
  const s = !entrou ? 0.001 : outBack(entre(t, p.t0, p.t0 + 0.2), 1.2) * (ativa ? LEG_ESCALA_ATIVA : 1);
  const [c1, c2] = COR_FALA[falante] ?? COR_FALA.pertim;
  const fill: React.CSSProperties = ativa ? { backgroundImage: `linear-gradient(180deg, ${c1} 25%, ${c2} 100%)`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }
    : { color: p.chave ? VERDE : "#fff" };
  return (
    <span style={{ position: "relative", display: "inline-block", margin: `0 ${size * LEG_MARGEM}px`, fontSize: size * LEG_ESCALA_ATIVA }}>
      {/* a caixa: a palavra no tamanho destacado, invisível (só ocupa o lugar) */}
      <span style={{ visibility: "hidden" }}>{p.w}</span>
      <span style={{ position: "absolute", inset: 0, display: "flex", justifyContent: "center", alignItems: "center", fontSize: size }}>
        <span style={{ position: "relative", display: "inline-block", transform: `scale(${s})`, transformOrigin: "50% 75%", opacity: entrou ? 1 : 0 }}>
          {p.chave && (
            <svg viewBox="0 0 100 20" preserveAspectRatio="none" style={{ position: "absolute", left: "-2%", width: "104%", bottom: -size * 0.1, height: size * 0.6, overflow: "visible" }}>
              <path d="M4 14 C32 9, 64 17, 96 8" stroke={AMARELO} strokeWidth={size * 0.5} strokeLinecap="round" fill="none" vectorEffect="non-scaling-stroke" />
            </svg>
          )}
          <span style={{ position: "relative", WebkitTextStroke: `${size * 0.24}px ${C.tinta}`, color: C.tinta, filter: "drop-shadow(0 6px 0 rgba(34,28,25,0.4))" }}>{p.w}</span>
          <span style={{ position: "absolute", left: 0, top: 0, ...fill }}>{p.w}</span>
        </span>
      </span>
    </span>
  );
};
const LegendaPop: React.FC<{ t: number; blocos: BlocoPop[] }> = ({ t, blocos }) => {
  const LP = (L as any).legenda_pop as { cx: number; top: number; size: number; linha: number; size2: number; linha2: number; maxW: number };
  const b = blocos.find((x) => t >= x.t0 && t < x.t1);
  if (!b) return null;
  const sz = b.size ?? LP.size, lh = sz === LP.size ? LP.linha : LP.linha2;
  return (
    <div style={{ position: "absolute", left: LP.cx - LP.maxW / 2, top: LP.top, width: LP.maxW, textAlign: "center", fontFamily: FONT, fontWeight: W.black, fontSize: sz, lineHeight: `${lh}px` }}>
      {b.linhas.map((l, i) => <div key={i} style={{ whiteSpace: "nowrap" }}>{l.map((p, j) => <PalavraPopV key={j} p={p} t={t} falante={b.falante} size={sz} />)}</div>)}
    </div>
  );
};
// o texto de compartilhar no fecho ("Manda pro amigo…"), grande, com a mesma letra da legenda nova
const MandaPro: React.FC<{ texto: string; t: number; t0: number; marca: number }> = ({ texto, t, t0, marca }) => {
  const e = mola(t, t0, 0.42, 2.2);
  if (e <= 0) return null;
  const topo = interpolate(t, [marca - 0.1, marca + 0.3], [628, 362], { ...clamp, easing: inOut });
  return (
    <>
    <div style={{ position: "absolute", left: 60, right: 60, top: topo, height: 902 - topo, borderRadius: 44, background: "rgba(34,28,25,0.86)", opacity: Math.min(1, e),
      boxShadow: "0 14px 30px rgba(0,0,0,0.3)" }} />
    <div style={{ position: "absolute", left: 90, right: 90, top: 668, textAlign: "center", fontFamily: FONT, fontWeight: W.black, fontSize: 60, lineHeight: 1.12,
      transform: `scale(${e})`, transformOrigin: "50% 50%" }}>
      <span style={{ position: "relative", display: "inline-block" }}>
        <span style={{ WebkitTextStroke: `16px ${C.tinta}`, color: C.tinta, filter: "drop-shadow(0 7px 0 rgba(34,28,25,0.35))" }}>{texto}</span>
        <span style={{ position: "absolute", left: 0, top: 0, color: "#fff" }}>{texto}</span>
      </span>
    </div>
    </>
  );
};
// a cena da sala da visita (#03), num instante t: o Pertim em pé à esquerda (o anfitrião), a visita sentada no sofá
const TIPOS_SALA_VISITA = ["cafe", "pao", "aceita", "exagero", "moral"];
const SalaVisitaEmCena: React.FC<{ t: number; quadro: number; d: DadosEpisodio }> = ({ t, quadro, d }) => {
  const ce = d.cenas.find((c) => t >= c.t0 - 1e-6 && t < c.t1) ?? d.cenas[d.cenas.length - 1];
  const tipo = ce.tipo === "fecho" ? (ce.diagrama.cenario ?? "sala") : ce.tipo;
  const um = (tp: string) => d.cenas.filter((c) => c.tipo === tp);
  const falaVisita = d.cenas.some((c) => c.falante === "visita" && t >= c.voz_t0 - 0.02 && t <= c.voz_t1 + 0.04);
  const bocaVisita = falaVisita ? d.visemas[Math.min(d.visemas.length - 1, quadro)] : undefined;
  const PX = 400, VX = 690, VB = CHAO - 70, VA = 440;          // o Pertim (em pé) e a visita (sentada)
  // a câmera: na abertura já se move (entra na sala); a cada troca de tipo de cena, chega um tiquinho mais perto; no
  // exagero, um corte mais perto; no fecho, se afasta (o texto de compartilhar e a marca ficam no alto)
  const inicioTipo = (() => { let k = d.cenas.indexOf(ce); while (k > 0 && d.cenas[k - 1].tipo === ce.tipo) k--; return d.cenas[k].t0; })();
  const zBase = tipo === "exagero" ? 1.04 : ce.tipo === "fecho" ? 0.74 : 1;
  const z = ce.n === 0 || inicioTipo === 0 ? zBase * (1 + 0.07 * Math.pow(1 - entre(t, 0, 1.0), 1.4))
    : ce.tipo === "fecho" ? interpolate(t, [ce.t0, ce.t0 + 0.5], [1, 0.74], { ...clamp, easing: inOut })
      : zBase * (1 + 0.04 * (1 - outCubic(entre(t, inicioTipo, inicioTipo + 0.35))));
  const conteudo: React.ReactNode[] = [];
  if (tipo === "moral") {
    // a moral: o Pertim sozinho, de frente, mais perto (a mesma sala, sem o sofá no quadro)
    const sim = ce.diagrama.sim?.t ?? 1e9;
    const zm = 1 + 0.05 * entre(t, ce.t0, ce.t1);
    conteudo.push(
      <div key="m" style={{ position: "absolute", inset: 0, transform: `scale(${zm})`, transformOrigin: `540px ${CHAO}px` }}>
        <Interior />
        <PertimEm t={t} quadro={quadro} d={d} pose="parado" expr={t >= sim ? "piscadinha" : "sorrindo"} cx={540} base={CHAO} altura={620} olhar={[0, 0]} />
      </div>,
    );
  } else {
    // o que acontece em cada cena
    const cafe = um("cafe"), pao = um("pao"), ac = um("aceita")[0], ex = um("exagero")[0];
    const naoT = (cs: Cena[]) => cs.map((c) => c.diagrama.nao?.t).find((x) => x != null) as number | undefined;
    const tNao1 = naoT(cafe), tNao2 = naoT(pao);
    const ronc = pao.map((c) => c.diagrama.ronc?.t).find((x) => x != null) as number | undefined;
    const tPega = ac?.diagrama.pega?.t ?? 1e9;
    const tAc0 = ac?.t0 ?? 1e9;
    // a visita: "não" com a mão (sobe e abana, e baixa no fim da cena), a barriga que ronca, o prato que ela pega
    const naoAmp = (t0?: number, cs?: Cena[]) => t0 == null || !cs?.length ? 0 : inOut(entre(t, t0 - 0.15, t0 + 0.15)) * (1 - inOut(entre(t, cs[cs.length - 1].t1 - 0.35, cs[cs.length - 1].t1 - 0.05)));
    const nao = tipo === "cafe" ? naoAmp(tNao1, cafe) : tipo === "pao" ? naoAmp(tNao2, pao) : 0;
    const roncU = ronc != null ? entre(t, ronc, ronc + 0.6) : 0;
    const treme = roncU > 0 && roncU < 1 ? 6 * Math.sin(t * 70) * (1 - roncU) : 0;
    const pega = entre(t, tPega, tPega + 0.32);
    const comPrato = tipo === "aceita" ? (pega >= 1 ? 5 : 0) : tipo === "exagero" ? 9 : ce.tipo === "fecho" ? Math.max(2, 9 - Math.floor((t - ce.t0) * 1.6)) : 0;
    const comXicara = tipo === "exagero" || ce.tipo === "fecho";
    const inclina = tipo === "aceita" ? -26 * Math.sin(Math.PI * pega) : 0;      // ela se estica para pegar o prato
    const mastiga = ce.tipo === "fecho" && !falaVisita ? (Math.floor(t * 6) % 2 ? "M" : "R") : undefined;
    // o Pertim: estende a xícara (cafe), mostra o prato (pao), dá de ombros e começa a levar embora (aceita), arregala os
    // olhos com a garrafa na mão (exagero), olha para a câmera (fecho)
    let pose: Pose = "parado", expr: Expressao = "sorrindo", olhar: [number, number] = [1, 0.1], px = PX, sobe = 0, rot = 0;
    let xic = false, prato = 0, termica = false;
    if (tipo === "cafe") { pose = "apontando"; xic = true; }
    else if (tipo === "pao") { prato = 7; px = PX + 14 * outCubic(entre(t, pao[0].diagrama.prato?.t ?? pao[0].t0, (pao[0].diagrama.prato?.t ?? pao[0].t0) + 0.3)); }
    else if (tipo === "aceita") {
      const ombro = entre(t, tAc0, tAc0 + 0.5);
      sobe = 22 * Math.abs(Math.sin(Math.PI * 2 * ombro)) * (ombro < 1 ? 1 : 0);
      const vai = entre(t, tAc0 + 0.45, tPega);
      px = PX - 10 * outCubic(vai); rot = -6 * Math.sin(Math.PI * Math.min(1, vai * 1.2)) * (pega >= 1 ? 1 - entre(t, tPega + 0.3, tPega + 0.6) : 1);
      olhar = pega > 0 ? [1, 0.1] : vai > 0 ? [-1, 0] : [0, 0];
      expr = t >= tPega + 0.1 && t < tPega + 0.9 ? "surpreso" : "sorrindo";
      prato = pega > 0 ? 0 : 7;
    } else if (tipo === "exagero") { termica = true; expr = "surpreso"; }
    if (ce.tipo === "fecho") { olhar = [0, 0]; }
    // o voo do prato da luva do Pertim para as mãos da visita
    const alt = 500, w = (alt * 240) / 270, gx = px - w / 2 + (214 / 240) * w, gy = CHAO - alt + ((196 - 18) / 270) * alt;
    const k = VA / 260, hx = VX - 26 + (156 - 100) * k, hy = VB - 260 * k + 162 * k;
    conteudo.push(<Interior key="i" />, <SofaFundo key="sf" />);
    conteudo.push(<Visitante key="v" cx={VX + treme + inclina} base={VB} altura={VA} t={t} mapa={false} boca={bocaVisita ?? mastiga} olha={tipo === "cafe" || tipo === "pao" ? -1 : ce.tipo === "fecho" ? 0 : -0.7}
      nao={nao} xicara={comXicara} prato={comPrato} />);
    conteudo.push(<SofaFrente key="sfr" />);
    conteudo.push(<PertimEm key="p" t={t} quadro={quadro} d={d} pose={pose} expr={expr} cx={px} base={CHAO} altura={alt} olhar={olhar} rot={rot} sobe={sobe}
      xicara={xic} prato={prato} termica={termica} cansado={ce.tipo === "fecho" ? 0.2 : 0} />);
    if (pega > 0 && pega < 1) {
      const x = gx + (hx - gx) * outCubic(pega), y = gy + (hy - gy) * pega - 90 * Math.sin(Math.PI * pega);
      conteudo.push(<svg key="voa" width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}><PratoPao x={x} y={y} w={80} n={7} t={t} /></svg>);
    }
    conteudo.push(<FrenteCasa key="fc" bolo />);
    // "RONC!" (a barriga da visita entrega)
    if (roncU > 0 && roncU < 1) {
      const e = outBack(Math.min(1, roncU * 3), 2.6) * (1 - entre(roncU, 0.75, 1));
      conteudo.push(
        <div key="ronc" style={{ position: "absolute", left: VX - 170, width: 340, textAlign: "center", top: VB - 500, transform: `scale(${e}) rotate(-6deg)`, transformOrigin: "50% 100%", fontFamily: FONT, fontWeight: W.black, fontSize: 74 }}>
          <span style={{ position: "relative" }}>
            <span style={{ WebkitTextStroke: `16px ${C.tinta}`, color: C.tinta }}>RONC!</span>
            <span style={{ position: "absolute", left: 0, top: 0, color: "#fff" }}>RONC!</span>
          </span>
        </div>,
        <svg key="ronc-l" width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: 1 - roncU }}>
          {[-40, 0, 40].map((a, i) => <path key={i} d={`M${VX + 0.5 * a} ${VB - 400} l${1.4 * a} -40`} stroke={C.tinta} strokeWidth={7} strokeLinecap="round" />)}
        </svg>,
      );
    }
    // no exagero: a setinha da visita para o bolo da mesinha, na palavra "bolo"
    if (tipo === "exagero" && ex?.diagrama.bolo) {
      const u = entre(t, ex.diagrama.bolo.t - 0.1, ex.diagrama.bolo.t + 0.25);
      if (u > 0) conteudo.push(
        <svg key="seta" width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <path d={`M${VX - 40} ${VB - 40} Q${VX - 40} ${1430} ${640} ${1440 + 6 * Math.sin(t * 9)}`} stroke={AMARELO} strokeWidth={12} strokeLinecap="round" fill="none" strokeDasharray="22 16" pathLength={1000}
            strokeDashoffset={1000 * (1 - u)} />
          <path d={`M${612} ${1426 + 6 * Math.sin(t * 9)} l36 14 l-30 24`} stroke={AMARELO} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={u} />
        </svg>,
      );
    }
  }
  return <div style={{ position: "absolute", inset: 0, transform: `scale(${z})`, transformOrigin: `540px ${CHAO}px` }}>{conteudo}</div>;
};
// a capa do #03 em diante (cena "sala"): a visita fazendo "não" com a mão e olhando para o pão de queijo do Pertim
const CapaSala: React.FC<{ dados: DadosEpisodio; titulo: string[] }> = ({ dados, titulo }) => (
  <AbsoluteFill style={{ background: "#F3E2C3", overflow: "hidden" }}>
    <div style={{ position: "absolute", inset: 0, transform: "translateY(200px)" }}>
      <Interior />
      <SofaFundo />
      <Visitante cx={745} base={CHAO - 10} altura={500} t={0.37} mapa={false} olha={-1} nao={1} boca="O" />
      <SofaFrente />
      <PertimEm t={0.3} quadro={0} d={dados} pose="parado" expr="sorrindo" cx={300} base={CHAO + 10} altura={540} olhar={[1, 0.1]} prato={7} />
    </div>
    <div style={{ position: "absolute", top: 330, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <SeloSerie numero={dados.numero} size={46} />
    </div>
    <div style={{ position: "absolute", top: 480, left: 90, right: 90, textAlign: "center", fontFamily: FONT, fontWeight: W.black, fontSize: 124, lineHeight: 1.08, letterSpacing: -3, color: C.tinta,
      textShadow: "0 0 30px rgba(255,255,255,0.7)" }}>
      {titulo.map((l, i) => (
        <div key={i}>
          {l.split("*").map((p, j) => j % 2 ? (
            <span key={j} style={{ position: "relative", display: "inline-block", color: VERDE }}>
              <svg viewBox="0 0 100 20" preserveAspectRatio="none" style={{ position: "absolute", left: -12, width: "calc(100% + 24px)", bottom: 4, height: 52, overflow: "visible" }}>
                <path d="M4 13 C30 9, 62 16, 96 7" stroke={AMARELO} strokeWidth={40} strokeLinecap="round" fill="none" vectorEffect="non-scaling-stroke" />
              </svg>
              <span style={{ position: "relative" }}>{p}</span>
            </span>
          ) : <React.Fragment key={j}>{p}</React.Fragment>)}
        </div>
      ))}
    </div>
  </AbsoluteFill>
);

// ================================================================ a montagem
export const CoisaDeMineiro: React.FC<CoisaDeMineiroProps> = (props) => props.mascara ? (
  <MascaraCtx.Provider value={true}>
    <AbsoluteFill style={{ background: "#000" }}>
      <FiltrosMascara />
      <AbsoluteFill style={{ visibility: "hidden" }}><Montagem {...props} /></AbsoluteFill>
    </AbsoluteFill>
  </MascaraCtx.Provider>
) : <Montagem {...props} />;
const Montagem: React.FC<CoisaDeMineiroProps> = ({ dados }) => {
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
  if ((P || R || CM) && t < noiteDesde) {
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
  // ---- #02 em diante: a casa (sala, porta, portão, carro); o fecho com "cenario" acontece nela
  const temCasa = d.cenas.some((c) => ["sala", "porta", "portao", "carro"].includes(c.tipo));
  if (temCasa) {
    const ce = d.cenas.find((c) => t >= c.t0 - 1e-6 && t < c.t1) ?? d.cenas[d.cenas.length - 1];
    const fora = !["sala", "porta"].includes(ce.tipo === "fecho" ? ce.diagrama.cenario ?? "portao" : ce.tipo);
    camada.push(
      <AbsoluteFill key="casa">
        {fora ? <NoiteCidade t={t} /> : <AbsoluteFill style={{ background: "#F3E2C3" }} />}
        <Mundo><CasaEmCena t={t} quadro={quadro} d={d} /></Mundo>
      </AbsoluteFill>,
    );
  }
  // ---- #03 em diante: a sala da visita (o fecho com "cenario": "sala" acontece nela)
  if (d.cenas.some((c) => TIPOS_SALA_VISITA.includes(c.tipo))) {
    camada.push(
      <AbsoluteFill key="sala-visita" style={{ background: "#F3E2C3" }}>
        <Mundo><SalaVisitaEmCena t={t} quadro={quadro} d={d} /></Mundo>
      </AbsoluteFill>,
    );
  }
  const rel = relogioEm(d, t), cont = contadorEm(d, t);
  const fechoD = d.cenas[d.cenas.length - 1].diagrama;
  // a noite caindo (o corte do caminho para a chegada, na batida): o azul da noite desce do alto
  const cai = CH ? entre(t, CH.t0 - 0.25, CH.t0 + 0.1) : 0;
  const sai = CH ? entre(t, CH.t0 + 0.05, CH.t0 + 0.3) : 0;

  return (
    <AbsoluteFill style={{ background: "#7FCBEF" }}>
      {camada}
      {cai > 0 && sai < 1 && <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920 * inCubic(cai), background: "linear-gradient(to bottom, #16213E, #2B3C68)", opacity: 1 - sai }} />}
      {/* (#03 em diante) o texto de compartilhar do fecho, no painel escuro que depois recebe a marca */}
      {fechoD.manda && <MandaPro texto={fechoD.manda.texto} t={t} t0={fechoD.manda.t} marca={d.marca_t} />}
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
      {rel && <div style={{ position: "absolute", left: 870 - 76, top: 292, transform: `scale(${outBack(Math.min(1, t / 0.4 + 0.3), 2)})` }}><Relogio min={rel.min} giro={rel.giro} size={152} /></div>}
      {cont && <div style={{ position: "absolute", right: 70, top: 372 }}><Contador ev={cont} t={t} /></div>}
      {(d.legenda as any).pop ? <Ator nome="legenda"><LegendaPop t={t} blocos={(d.legenda as any).blocos} /></Ator> : <Legenda t={t} dados={d.legenda} />}
    </AbsoluteFill>
  );
};

// ================================================================ a capa (PNG para o "Editar capa"; tudo no recorte 3:4)
export const CapaCoisaDeMineiro: React.FC<CoisaDeMineiroProps> = ({ dados }) => {
  if (!dados) throw new Error("CapaCoisaDeMineiro: os dados do episódio são lidos no calculateMetadata");
  const titulo = dados.capa?.titulo ?? [dados.titulo];
  if (dados.capa?.cena === "portao") return <CapaPortao dados={dados} titulo={titulo} />;
  if (dados.capa?.cena === "sala") return <CapaSala dados={dados} titulo={titulo} />;
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

// a capa do #02 em diante (cena "portao"): a noite no portão, o Pertim e a visita, o relógio marcando a hora da capa
const CapaPortao: React.FC<{ dados: DadosEpisodio; titulo: string[] }> = ({ dados, titulo }) => (
  <AbsoluteFill style={{ background: "#16213E", overflow: "hidden" }}>
    <NoiteCidade t={0.4} lua={[70, 790]} />
    <div style={{ position: "absolute", inset: 0, transform: "translateY(230px)" }}>
      <Rua luzVizinho={0} />
      <Cachorro x={540} u={1} dorme={1} t={0.4} />
      <Visitante cx={300} base={CHAO} altura={470} t={0} mapa={false} pote olha={0.7} boca="A" />
      <PertimEm t={0.3} quadro={0} d={dados} pose="parado" expr="sorrindo" cx={760} base={CHAO + 10} altura={600} olhar={[-1, 0.1]} cansado={0.42} />
    </div>
    <div style={{ position: "absolute", top: 330, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <SeloSerie numero={dados.numero} size={46} />
    </div>
    <div style={{ position: "absolute", top: 480, left: 110, right: 110, textAlign: "center", fontFamily: FONT, fontWeight: W.black, fontSize: 124, lineHeight: 1.08, letterSpacing: -3, color: "#FFF9F1",
      textShadow: "0 6px 24px rgba(0,0,0,0.45)" }}>
      {titulo.map((l, i) => (
        <div key={i}>
          {l.split("*").map((p, j) => j % 2 ? (
            <span key={j} style={{ position: "relative", display: "inline-block", color: VERDE, textShadow: "none" }}>
              <svg viewBox="0 0 100 20" preserveAspectRatio="none" style={{ position: "absolute", left: -12, width: "calc(100% + 24px)", bottom: 4, height: 52, overflow: "visible" }}>
                <path d="M4 13 C30 9, 62 16, 96 7" stroke={AMARELO} strokeWidth={40} strokeLinecap="round" fill="none" vectorEffect="non-scaling-stroke" />
              </svg>
              <span style={{ position: "relative" }}>{p}</span>
            </span>
          ) : <React.Fragment key={j}>{p}</React.Fragment>)}
        </div>
      ))}
    </div>
    <div style={{ position: "absolute", left: 830, top: 730 }}><Relogio min={minutos(dados.capa?.relogio ?? "22:30")} size={170} /></div>
  </AbsoluteFill>
);

// o calculateMetadata: lê os dados do episódio em public/coisa-de-mineiro/<ep>/dados.json
export const carregaEpisodio = async ({ props }: { props: CoisaDeMineiroProps }) => {
  const r = await fetch(staticFile(`coisa-de-mineiro/${props.ep}/dados.json`));
  const dados = (await r.json()) as DadosEpisodio;
  return { durationInFrames: dados.quadros, fps: dados.fps, props: { ...props, dados } };
};
