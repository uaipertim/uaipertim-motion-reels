import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, FONT, W } from "../config/theme";
import { CremeBackground } from "../components/Decor";
import { StarShape, Twinkles } from "../components/Particles";
import { ShopChar } from "../components/Town";
import { DirectBalloon } from "../components/Invite";
import { PaperPlaneIcon, ScooterIcon } from "../components/AppIcons";
import { Pertim, PertimRig } from "../personagem/Pertim";
import type { Expressao, Pose } from "../personagem/logica";
import { bocaNoQuadro, piscadaEm, respiracao, Visemas } from "../personagem/rig";
import { clamp01, inCubic, inOut, outBack, outCubic } from "../pedir-no-uaipertim/efeitos";
import {
  Avatar, Balcao, Bike, Carro, CasaCliente, Casinha, IconeEscudo, IconeLoja, IconeNota, IconeOlho, IconePin, Igrejinha, Interruptor, Lua,
  PlacaGloria, Prancheta, Relogio, Sacola, Selo, Sol,
} from "./Ilustracoes";
import LAYOUT from "../../reels/seja-entregador/layout.json";
import CENA from "../../reels/seja-entregador/dados/cena.json";
import VISEMAS from "../../reels/seja-entregador/dados/visemas.json";
import LEGENDA from "../../reels/seja-entregador/dados/legenda.json";

// REEL "SEJA ENTREGADOR PARCEIRO" (1080×1920, 30 fps): a chamada para o cadastro na rede de entregadores parceiros do
// UaiPertim, narrada pelo Pertim. A voz, a linha do tempo (todo corte numa batida da trilha animada, 120 BPM) e a mixagem
// vêm do pipeline do Explica, Sô! (reels/seja-entregador/roteiro.json); os tempos, de reels/seja-entregador/dados/
// (scripts/preparar.py, amarrados às palavras da voz); as posições, de reels/seja-entregador/layout.json.
//   1 gancho:      a rua do Glória já montada no quadro 0: o Pertim na motinha à frente, olhando pra câmera; a bike e o
//                  carro entram em fila atrás; cada um ganha a plaquinha na sua palavra; "Renda extra?" e a placa do Glória;
//   2 chamada:     a logo com as ondas do chamado; o cartaz "Entregadores parceiros"; os três veículos;
//   3 disponível:  o interruptor "Ficar disponível" liga; o relógio gira entre o sol e a lua;
//   4 notificação: o celular e a notificação "Nova entrega disponível · Padaria do Centro · Bairro Centro · R$ 8,00"
//                  (loja, bairro e valor acendem cada um na sua palavra; "Valores ilustrativos");
//   5 coleta:      o toque em "Aceitar"; o Pertim pega a sacola no balcão da lojinha ("Coletei ✓") e leva na motinha até a
//                  casinha do cliente ("Entregue ✓");
//   6 acerto:      as fichas da loja e do entregador ligadas pela seta do acerto direto; o registro no app com o check;
//   7 cadastro:    a prancheta, a equipe e o selo verde "Cadastro conferido pessoalmente pela equipe";
//   8 fecho:       a rede (os três veículos ligados); a logo, "Tudo pertim de você.", o CTA "Chama no Direct" e o
//                  @uaipertim; o Pertim acena.
// O Pertim sempre olha para a câmera e nunca aparece bravo. A legenda é a nova (LegendaPop), em x 110–906.
// `mascara` (só para o QA): "legenda" = só a legenda, branca, sobre o transparente; "conteudo" = tudo menos o fundo e a legenda.

export type SejaEntregadorProps = { mascara?: "legenda" | "conteudo" };
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

// um elemento que pipoca no seu centro (cx, cy) a partir de t0 e some no fim da cena
const Pop: React.FC<{ t: number; t0: number; cx: number; cy: number; fim?: number; children: React.ReactNode; dur?: number; s?: number }> = ({ t, t0, cx, cy, fim = 1e9, children, dur = 0.35, s = 1.9 }) => {
  const e = mola(t, t0, dur, s) * (1 - entre(t, fim - 0.16, fim));
  if (e <= 0.001) return null;
  return (
    <div style={abs(cx, cy, { width: 0, height: 0 })}>
      <div style={{ position: "absolute", left: 0, top: 0, transform: `translate(-50%, -50%) scale(${e})`, opacity: Math.min(1, e * 3) }}>{children}</div>
    </div>
  );
};
const Cartao: React.FC<{ w: number; h?: number; children: React.ReactNode; pad?: number; style?: React.CSSProperties }> = ({ w, h, children, pad = 28, style }) => (
  <div style={{ width: w, height: h, boxSizing: "border-box", padding: pad, borderRadius: 40, background: "#fff", border: `6px solid ${C.cremeDeep}`,
    boxShadow: "0 14px 0 rgba(34,28,25,0.08), 0 26px 44px rgba(34,28,25,0.16)", ...style }}>{children}</div>
);
const Txt: React.FC<{ size: number; cor?: string; peso?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ size, cor = C.tinta, peso = W.black, children, style }) => (
  <div style={{ fontFamily: FONT, fontWeight: peso, fontSize: size, lineHeight: 1.12, color: cor, letterSpacing: -0.02 * size, whiteSpace: "nowrap", ...style }}>{children}</div>
);
const Marcador: React.FC<{ u: number; children: React.ReactNode }> = ({ u, children }) => (
  <span style={{ position: "relative", display: "inline-block" }}>
    <span style={{ position: "absolute", left: "-4%", right: `${104 - 108 * clamp01(u)}%`, bottom: "6%", height: "38%", background: C.amarelo, borderRadius: 10, zIndex: 0 }} />
    <span style={{ position: "relative" }}>{children}</span>
  </span>
);
const Toque: React.FC<{ t: number; t0: number; x: number; y: number; r?: number }> = ({ t, t0, x, y, r = 60 }) => {
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
const Brilhos: React.FC<{ t: number; t0: number; cx: number; cy: number; r?: number; n?: number }> = ({ t, t0, cx, cy, r = 120, n = 6 }) => {
  const u = entre(t, t0, t0 + 0.5);
  if (u <= 0 || u >= 1) return null;
  return (
    <>
      {Array.from({ length: n }).map((_, i) => {
        const a = (i / n) * Math.PI * 2 + 0.3, d = r * (0.6 + 0.6 * outCubic(u));
        return <div key={i} style={abs(cx + Math.cos(a) * d - 18, cy + Math.sin(a) * d - 18, { opacity: 1 - u, transform: `rotate(${u * 180}deg)` })}><StarShape size={36} color={i % 2 ? C.coral : C.amarelo} /></div>;
      })}
    </>
  );
};

// ---------------------------------------------------------------- o Pertim (sempre olhando para a câmera)
const VB: Record<string, [number, number]> = { moto: [300, 254], parado: [240, 270] };
const larguraDe = (pose: string, altura: number) => { const [w, h] = VB[pose] ?? [280, 284]; return (altura * w) / h; };
const falandoEm = (t: number) => S.some((c) => t >= c.voz_t0 - 0.02 && t <= c.voz_t1 + 0.04);
const PertimEm: React.FC<{ t: number; quadro: number; pose: Pose; expr?: Expressao; cx: number; base: number; altura: number; desde?: number; aceno?: number; style?: React.CSSProperties }> = ({
  t, quadro, pose, expr = "sorrindo", cx, base, altura, desde = -9, aceno, style,
}) => {
  const pop = 1 + 0.07 * Math.sin(Math.PI * entre(t, desde, desde + 0.25));
  const h = altura * pop, w = larguraDe(pose, h);
  const boca = bocaNoQuadro(VISEMAS as Visemas, quadro, falandoEm(t));
  const rig: PertimRig = { ...respiracao(t), piscada: piscadaEm(CENA.piscadas, t, CENA.piscada_dur), olhar: [0, 0], centro: true,
    aceno: aceno ?? (pose === "acenando" ? 12 * Math.sin(t * 9) : pose === "apontando" ? -18 + 4 * Math.sin(t * 3) : 0) };
  return (
    <div style={abs(cx - w / 2, base - h, { width: w, height: h, ...style })}>
      <Pertim v={1} pose={pose} expr={expr} mouth={boca ?? "auto"} altura={h} rig={rig} />
    </div>
  );
};
// no canto (cenas 2, 3, 4, 6 e 7): a pose de cada momento
type Estado = { pose: Pose; expr: Expressao };
const CANTO: Array<[number, Estado]> = [
  [T[1], { pose: "apontando", expr: "sorrindo" }],
  [T[2], { pose: "parado", expr: "sorrindo" }],
  [EV.disponivel.liga, { pose: "comemorando", expr: "alegre" }],
  [T[3], { pose: "apontando", expr: "sorrindo" }],
  [EV.notificacao.ve, { pose: "parado", expr: "sorrindo" }],
  [T[5], { pose: "apontando", expr: "sorrindo" }],
  [EV.acerto.check, { pose: "parado", expr: "sorrindo" }],
  [T[6], { pose: "parado", expr: "sorrindo" }],
  [EV.cadastro.selo, { pose: "apontando", expr: "sorrindo" }],
  [EV.cadastro.seguranca, { pose: "parado", expr: "piscadinha" }],
];
const PertimCanto: React.FC<{ t: number; quadro: number }> = ({ t, quadro }) => {
  if (!(noar(t, 1) || noar(t, 2) || noar(t, 3) || noar(t, 5) || noar(t, 6))) return null;
  let k = 0;
  CANTO.forEach(([ts], i) => { if (t >= ts) k = i; });
  const [desde, e] = CANTO[k];
  const P = L.pertim.canto;
  // entra deslizando de baixo quando volta para o canto (cenas 2 e 6)
  const volta = [T[1], T[5]].find((x) => t >= x && t < x + 0.4);
  const dy = volta !== undefined ? 360 * (1 - outBack(entre(t, volta, volta + 0.35), 1.4)) : 0;
  return <PertimEm t={t} quadro={quadro} pose={e.pose} expr={e.expr} cx={P.cx} base={P.base + dy} altura={P.altura} desde={desde} />;
};

// ---------------------------------------------------------------- o fundo
const Toldo: React.FC = () => {
  const n = 12, sw = 1080 / n, h = 92;
  return (
    <svg width={1080} height={h + 40} style={abs(0, 0)}>
      {Array.from({ length: n }).map((_, i) => (
        <path key={i} d={`M${i * sw} 0 H${(i + 1) * sw} V${h} A${sw / 2} ${sw / 2.6} 0 0 1 ${i * sw} ${h} Z`} fill={i % 2 ? C.creme : C.coral} />
      ))}
      <rect x={0} y={0} width={1080} height={14} fill={C.coralDark} />
    </svg>
  );
};
// a rua (calçada, asfalto com a faixa tracejada correndo) e as casinhas do Glória ao fundo (parallax)
const CASAS: Array<{ dx: number; w: number; parede?: string; janela?: string; telhado?: string; andares?: 1 | 2; igreja?: boolean }> = [
  { dx: 0, w: 210, janela: C.verde, andares: 2 }, { dx: 230, w: 190, parede: "#FBE3CC", janela: "#3E7FB8" }, { dx: 430, w: 200, igreja: true },
  { dx: 650, w: 200, janela: C.coral, andares: 2 }, { dx: 870, w: 180, parede: "#FFF1C9", janela: C.verde }, { dx: 1070, w: 210, parede: "#E9F2E2", janela: "#B5482A", andares: 2 },
];
const PERIODO = 1300;
const Rua: React.FC<{ t: number; desloca: number; casasY?: number; casas?: boolean; y0?: number; y1?: number; calcada?: number }> = ({ desloca, casasY = 935, casas = true, ...o }) => {
  const semRua = React.useContext(SemRua);
  const R = { ...L.rua, ...Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) };
  if (semRua) return null;
  const off = (desloca * 0.35) % PERIODO;
  const faixa = desloca % 160;
  return (
    <svg width={1080} height={1920} style={abs(0, 0)}>
      {casas && [0, 1].map((rep) => (
        <g key={rep} transform={`translate(${-off + rep * PERIODO - 60} 0)`}>
          {CASAS.map((c, i) => c.igreja ? <Igrejinha key={i} x={c.dx} base={casasY} w={c.w} /> :
            <Casinha key={i} x={c.dx} base={casasY} w={c.w} parede={c.parede} janela={c.janela} telhado={c.telhado} andares={c.andares} />)}
        </g>
      ))}
      <rect x={0} y={R.y0} width={1080} height={R.calcada} fill="#E9DCC8" />
      <rect x={0} y={R.y0 + R.calcada - 6} width={1080} height={8} fill="#D6C4A8" />
      <rect x={0} y={R.y0 + R.calcada} width={1080} height={R.y1 - R.y0 - R.calcada} fill="#7A6B62" />
      {Array.from({ length: 9 }).map((_, i) => (
        <rect key={i} x={i * 160 - faixa} y={(R.y0 + R.calcada + R.y1) / 2 - 7} width={90} height={14} rx={7} fill="#F6EEE2" opacity={0.9} />
      ))}
      <rect x={0} y={R.y1} width={1080} height={22} fill="#D6C4A8" />
      <rect x={0} y={R.y1 + 22} width={1080} height={70} fill="#E9DCC8" opacity={0.9} />
    </svg>
  );
};

// ---------------------------------------------------------------- 1 · o gancho: a rua do Glória
const Plaquinha: React.FC<{ texto: string; cor?: string }> = ({ texto, cor = C.coral }) => (
  <div style={{ position: "relative", padding: "10px 26px", borderRadius: 999, background: cor, boxShadow: `0 6px 0 ${cor === C.coral ? C.coralDark : C.verdeDark}`,
    fontFamily: FONT, fontWeight: W.black, fontSize: 40, lineHeight: 1, color: "#fff", whiteSpace: "nowrap" }}>
    {texto}
    <svg width={30} height={18} viewBox="0 0 30 18" style={abs(0, 0, { left: "50%", top: "100%", marginLeft: -15, marginTop: -2 })}><path d="M0 0 H30 L15 18 Z" fill={cor} /></svg>
  </div>
);
const Gancho: React.FC<{ t: number; quadro: number }> = ({ t, quadro }) => {
  if (!noar(t, 0)) return null;
  const G = EV.gancho, GL = L.gancho;
  const sai = inCubic(entre(t, G.sai, T[1])) * 1300;
  const giro = t * 720;
  const bob = (f: number) => 3 * Math.sin(t * f);
  const bx = GL.bike.cx - 760 * (1 - outBack(entre(t, G.fila[0], G.fila[0] + 0.6), 1.2)) + sai;
  const cx = GL.carro.cx - 760 * (1 - outBack(entre(t, G.fila[1], G.fila[1] + 0.6), 1.2)) + sai;
  const mx = GL.moto.cx + 18 * Math.sin(t * 1.6) + sai;
  const bw = GL.bike.w, cw = GL.carro.w, mw = larguraDe("moto", GL.moto.altura);
  const placa = mola(t, 0, 0.3, 2) * 1;
  const pulo = Math.sin(Math.PI * entre(t, G.gloria, G.gloria + 0.4));
  const renda = mola(t, G.renda, 0.35, 2.2);
  return (
    <>
      <Rua t={t} desloca={t * 260 + sai * 0.4} />
      {/* a placa do Glória no alto, já no quadro 0 */}
      <div style={abs(540 - 150, 250 + bob(2.2), { width: 300, transform: `scale(${0.9 + 0.1 * placa})`, transformOrigin: "50% 0%" })}>
        <div style={{ height: 148, overflow: "hidden" }}><PlacaGloria w={300} pulo={pulo} /></div>
      </div>
      <Brilhos t={t} t0={G.gloria} cx={540} cy={320} r={170} />
      {renda > 0 && (
        <div style={abs(0, 470, { width: 1080, display: "flex", justifyContent: "center", transform: `scale(${renda})`, opacity: Math.min(1, renda * 3) })}>
          <Txt size={96}><Marcador u={entre(t, G.renda + 0.15, G.renda + 0.55)}>Renda extra</Marcador>?</Txt>
        </div>
      )}
      {/* o carro (atrás), a bike e o Pertim na motinha (na frente) */}
      <div style={abs(cx - cw / 2, GL.carro.base - (cw * 200) / 320 + bob(7))}><Carro w={cw} giro={giro} balanco={1.5 * Math.sin(t * 13)} /></div>
      <div style={abs(bx - bw / 2, GL.bike.base - bw + bob(6))}><Bike w={bw} giro={giro} pedal={t * 9} /></div>
      {/* as linhas de velocidade atrás de cada um */}
      <svg width={1080} height={1920} style={abs(0, 0)}>
        {[[cx - cw / 2 - 20, GL.carro.base - 60], [bx - bw / 2 - 10, GL.bike.base - 70], [mx - mw / 2 + 20, GL.moto.base - 90]].map(([x, y], i) => (
          <g key={i} opacity={0.5}>{[0, 1, 2].map((k) => {
            const u = (t * 2.2 + k / 3 + i * 0.2) % 1;
            return <path key={k} d={`M${x - 20 - 90 * u} ${y + k * 22} h${-60 * (1 - u)}`} stroke="#fff" strokeWidth="9" strokeLinecap="round" opacity={1 - u} />;
          })}</g>
        ))}
      </svg>
      <PertimEm t={t} quadro={quadro} pose="moto" cx={mx} base={GL.moto.base + bob(8)} altura={GL.moto.altura} />
      {/* as plaquinhas de cada veículo, na sua palavra */}
      <Pop t={t} t0={G.carro} cx={cx} cy={GL.carro.base - (cw * 200) / 320 - 70} fim={G.sai}><Plaquinha texto="Carro" cor={C.verde} /></Pop>
      <Pop t={t} t0={G.bike} cx={bx + 30} cy={GL.bike.base - bw - 60} fim={G.sai}><Plaquinha texto="Bike" cor={C.verde} /></Pop>
      <Pop t={t} t0={G.moto} cx={mx + 20} cy={GL.moto.base - GL.moto.altura - 50} fim={G.sai}><Plaquinha texto="Moto" /></Pop>
      <Twinkles frame={quadro} seed="se-gancho" points={[[150, 300], [930, 330], [120, 720], [960, 700]]} size={30} />
    </>
  );
};

// ---------------------------------------------------------------- 2 · a chamada
const Ondas: React.FC<{ t: number; cx: number; cy: number; r: number }> = ({ t, cx, cy, r }) => (
  <svg width={1080} height={1920} style={abs(0, 0)}>
    {[-1, 1].map((lado) => [0, 1, 2].map((k) => {
      const u = (t * 1.4 + k / 3) % 1, rr = r + 30 + 90 * u;
      const a = 0.55;
      return <path key={`${lado}${k}`} d={`M${cx + lado * rr * Math.cos(a)} ${cy - rr * Math.sin(a)} A${rr} ${rr} 0 0 ${lado > 0 ? 1 : 0} ${cx + lado * rr * Math.cos(a)} ${cy + rr * Math.sin(a)}`}
        stroke={k % 2 ? C.amarelo : C.coral} strokeWidth={12 * (1 - u) + 3} strokeLinecap="round" fill="none" opacity={1 - u} />;
    }))}
  </svg>
);
const Circulo: React.FC<{ d: number; children: React.ReactNode }> = ({ d, children }) => (
  <div style={{ width: d, height: d, borderRadius: "50%", background: "#fff", border: `6px solid ${C.cremeDeep}`, boxShadow: "0 10px 22px rgba(34,28,25,0.16)",
    display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>{children}</div>
);
const Veiculos: React.FC<{ t: number; t0: number; xs: number[]; y: number; d: number; fim?: number; giro: number }> = ({ t, t0, xs, y, d, fim, giro }) => (
  <>
    <Pop t={t} t0={t0} cx={xs[0]} cy={y} fim={fim}><Circulo d={d}><ScooterIcon size={d * 0.72} wheelSpin={giro} /></Circulo></Pop>
    <Pop t={t} t0={t0 + 0.1} cx={xs[1]} cy={y} fim={fim}><Circulo d={d}><div style={{ marginTop: d * 0.06 }}><Bike w={d * 0.8} giro={giro} pedal={giro / 60} /></div></Circulo></Pop>
    <Pop t={t} t0={t0 + 0.2} cx={xs[2]} cy={y} fim={fim}><Circulo d={d}><Carro w={d * 0.82} giro={giro} /></Circulo></Pop>
  </>
);
const Chamada: React.FC<{ t: number }> = ({ t }) => {
  if (!noar(t, 1)) return null;
  const E = EV.chamada, fim = T[2];
  const lg = mola(t, E.logo, 0.4, 2) * (1 - entre(t, fim - 0.16, fim));
  return (
    <>
      {lg > 0.01 && <Ondas t={t} cx={605} cy={440} r={130} />}
      <div style={abs(605 - 135, 440 - 135, { width: 270, height: 270, transform: `scale(${lg}) rotate(${(1 - Math.min(1, lg)) * -20}deg)`, filter: "drop-shadow(0 14px 22px rgba(198,58,23,0.3))" })}>
        <Img src={staticFile("img/uaipertim_logo.png")} style={{ width: "100%", height: "100%" }} />
      </div>
      <Pop t={t} t0={E.cartaz} cx={605} cy={790} fim={fim} s={2.2}>
        <Cartao w={620} pad={30} style={{ textAlign: "center", transform: `rotate(${-2 + 0.8 * Math.sin(t * 2.5)}deg)` }}>
          <Txt size={34} cor={C.coral} peso={W.extraBold} style={{ letterSpacing: 3 }}>PROCURA-SE</Txt>
          <Txt size={68} style={{ marginTop: 6 }}>Entregadores</Txt>
          <Txt size={68}><Marcador u={entre(t, E.parceiros, E.parceiros + 0.4)}><span style={{ color: C.coral }}>parceiros</span></Marcador></Txt>
        </Cartao>
      </Pop>
      <Veiculos t={t} t0={E.veiculos + 0.5} xs={[440, 615, 790]} y={1090} d={150} fim={fim} giro={t * 300} />
    </>
  );
};

// ---------------------------------------------------------------- 3 · ficar disponível
const Disponivel: React.FC<{ t: number }> = ({ t }) => {
  if (!noar(t, 2)) return null;
  const E = EV.disponivel, fim = T[3];
  const liga = inOut(entre(t, E.liga, E.liga + 0.22));
  const giro = 360 * 3 * inOut(entre(t, E.relogio, E.relogio + 1.2)) + 300;
  return (
    <>
      <Pop t={t} t0={E.cartao} cx={610} cy={660} fim={fim}>
        <Cartao w={560} pad={34} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26, boxShadow: liga > 0.5 ? `0 0 0 ${14 * liga}px rgba(62,158,78,0.22), 0 26px 44px rgba(34,28,25,0.16)` : undefined }}>
          <Txt size={50}>Ficar disponível</Txt>
          <Interruptor w={260} liga={liga} />
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: liga > 0.5 ? C.verde : "#B5A897", boxShadow: liga > 0.5 ? `0 0 0 ${6 + 3 * Math.sin(t * 8)}px rgba(62,158,78,0.25)` : undefined }} />
            <Txt size={36} peso={W.extraBold} cor={liga > 0.5 ? C.verde : "#9A8E80"}>{liga > 0.5 ? "Disponível" : "Indisponível"}</Txt>
          </div>
        </Cartao>
      </Pop>
      <Brilhos t={t} t0={E.liga} cx={610} cy={660} r={240} n={8} />
      <Pop t={t} t0={E.relogio - 0.1} cx={610} cy={1085} fim={fim}><Relogio s={190} giro={giro} /></Pop>
      <Pop t={t} t0={E.relogio} cx={430} cy={1060} fim={fim}><div style={{ transform: `rotate(${t * 40}deg)` }}><Sol s={110} /></div></Pop>
      <Pop t={t} t0={E.relogio + 0.1} cx={795} cy={1060} fim={fim}><div style={{ transform: `rotate(${6 * Math.sin(t * 3)}deg)` }}><Lua s={104} /></div></Pop>
    </>
  );
};

// ---------------------------------------------------------------- 4 · a notificação no celular (e o toque em "Aceitar" na 5)
const CEL = L.celular, NT = L.notif;
const LINHAS = [
  { chave: "loja" as const, icone: (s: number) => <IconeLoja s={s} />, texto: "Padaria do Centro" },
  { chave: "bairro" as const, icone: (s: number) => <IconePin s={s} />, texto: "Bairro Centro" },
  { chave: "valor" as const, icone: (s: number) => <IconeNota s={s} />, texto: "R$ 8,00" },
];
const NOTIF_Y = { linha0: 228, passo: 86, botoes: 500, h: 600 };
const Notificacao: React.FC<{ t: number; e: number }> = ({ t, e }) => {
  const N = EV.notificacao, K = EV.coleta;
  const marca = (t0: number, prox: number) => (t < t0 ? 0 : t < prox ? mola(t, t0, 0.3, 2.4) : 0.4);
  const proxs = [N.bairro, N.valor, N.ve];
  const pulso = t >= N.aceitar ? 1 + 0.07 * Math.sin(Math.PI * clamp01((t - N.aceitar) / 0.3)) + 0.025 * Math.sin(t * 10) * (t < K.toque ? 1 : 0) : 1;
  const varre = entre(t, N.ve, N.ve + 0.6);
  return (
    <div style={abs(NT.x, NT.y, { width: NT.w, height: NOTIF_Y.h, transform: `scale(${e})`, transformOrigin: "50% 0%", opacity: Math.min(1, e * 3) })}>
      <Cartao w={NT.w} h={NOTIF_Y.h} pad={0} style={{ position: "relative", overflow: "hidden", borderRadius: 46, border: `6px solid ${C.coral}` }}>
        <div style={abs(36, 30, { display: "flex", alignItems: "center", gap: 16 })}>
          <Img src={staticFile("img/uaipertim_logo.png")} style={{ width: 58, height: 58 }} />
          <Txt size={30} peso={W.extraBold} cor="#8A7E72">UaiPertim · agora</Txt>
        </div>
        <Txt size={52} style={abs(36, 110)}>Nova entrega disponível</Txt>
        {LINHAS.map((l, i) => {
          const y = NOTIF_Y.linha0 + i * NOTIF_Y.passo;
          const m = marca(N[l.chave], proxs[i]);
          return (
            <div key={l.chave} style={abs(24, y, { width: NT.w - 60, height: 74, borderRadius: 22, display: "flex", alignItems: "center", gap: 20, paddingLeft: 14, boxSizing: "border-box",
              background: m > 0 ? `rgba(249,178,51,${0.28 * Math.min(1, m)})` : "transparent", border: m > 0 ? `${m > 0.5 ? 6 : 4}px solid ${C.coral}` : "6px solid transparent",
              transform: `scale(${1 + 0.04 * Math.max(0, m - 0.4)})` })}>
              {l.icone(58)}
              <Txt size={44} peso={W.extraBold}>{l.texto}</Txt>
            </div>
          );
        })}
        {/* os botões */}
        <div style={abs(36, NOTIF_Y.botoes, { width: 300, height: 74, borderRadius: 999, border: `5px solid ${C.cremeDeep}`, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center" })}>
          <Txt size={34} peso={W.extraBold} cor="#8A7E72">Agora não</Txt>
        </div>
        <div style={abs(NT.w - 36 - 330, NOTIF_Y.botoes, { width: 330, height: 74, borderRadius: 999, background: C.verde, boxShadow: `0 6px 0 ${C.verdeDark}`,
          display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${pulso})` })}>
          <Txt size={38} cor="#fff">Aceitar</Txt>
        </div>
        {/* a lupinha passando ("Cê vê tudo") */}
        {varre > 0 && varre < 1 && <div style={abs(0, 100 + 400 * inOut(varre), { width: NT.w, height: 90, background: "linear-gradient(180deg, rgba(249,178,51,0) 0%, rgba(249,178,51,0.32) 50%, rgba(249,178,51,0) 100%)" })} />}
      </Cartao>
      <Pop t={t} t0={N.ve} cx={NT.w - 20} cy={14} dur={0.3}><div style={{ width: 100, height: 100, borderRadius: "50%", background: "#fff", boxShadow: "0 8px 18px rgba(34,28,25,0.22)", display: "flex", alignItems: "center", justifyContent: "center" }}><IconeOlho s={74} /></div></Pop>
      <Toque t={t} t0={K.toque} x={NT.w - 36 - 165} y={NOTIF_Y.botoes + 37} r={70} />
    </div>
  );
};
const Celular: React.FC<{ t: number }> = ({ t }) => {
  const bz = CEL.w * 0.045;
  return (
    <div style={abs(CEL.x, CEL.y, { width: CEL.w, height: CEL.h })}>
      <div style={{ position: "absolute", inset: 0, borderRadius: CEL.w * 0.15, background: C.tinta, boxShadow: `inset 0 0 0 ${CEL.w * 0.012}px #4A3E38, 0 40px 80px rgba(34,28,25,0.3)` }} />
      <div style={abs(bz, bz, { width: CEL.w - 2 * bz, height: CEL.h - 2 * bz, borderRadius: CEL.w * 0.11, overflow: "hidden",
        background: `linear-gradient(160deg, #FFE7C2 0%, #FFC9A8 55%, ${C.coralLight} 100%)` })}>
        <Txt size={30} peso={W.extraBold} cor={C.tinta} style={abs(0, 44, { width: CEL.w - 2 * bz, textAlign: "center", opacity: 0.6 })}>quarta-feira</Txt>
        <Txt size={70} cor={C.tinta} style={abs(0, 0, { top: CEL.h - 2 * bz - 120, width: CEL.w - 2 * bz, textAlign: "center", opacity: 0.12 })}>UaiPertim</Txt>
      </div>
      <div style={abs(CEL.w / 2 - 9, bz + 14, { width: 18, height: 18, borderRadius: "50%", background: "#0D0B0A" })} />
    </div>
  );
};
const NotaIlustrativa: React.FC<{ a: number }> = ({ a }) => {
  if (a <= 0) return null;
  const N = L.nota;
  return (
    <div style={abs(N.cx - 300, N.y - N.size, { width: 600, display: "flex", justifyContent: "center", opacity: a })}>
      <div style={{ fontFamily: FONT, fontWeight: W.extraBold, fontSize: N.size, lineHeight: `${N.size + 10}px`, color: C.tinta, background: "rgba(255,249,241,0.94)", borderRadius: 999,
        padding: "3px 18px", letterSpacing: 0.4, whiteSpace: "nowrap", boxShadow: "0 3px 8px rgba(34,28,25,0.12)" }}><span style={{ opacity: 0.7 }}>{N.texto}</span></div>
    </div>
  );
};
const CenaNotificacao: React.FC<{ t: number }> = ({ t }) => {
  const N = EV.notificacao, K = EV.coleta;
  if (t < N.celular[0] || t > K.troca[1]) return null;
  const sobe = (1 - outBack(entre(t, N.celular[0], N.celular[1]), 1.3)) * 1400;
  const sai = -1200 * inCubic(entre(t, K.troca[0], K.troca[1]));
  const e = mola(t, N.notif, 0.42, 1.6);
  return (
    <div style={abs(sai, 0, { width: 1080, height: 1920 })}>
      <div style={abs(0, sobe, { width: 1080, height: 1920 })}><Celular t={t} /></div>
      {e > 0 && <Notificacao t={t} e={e} />}
      <NotaIlustrativa a={entre(t, N.notif + 0.2, N.notif + 0.5)} />
    </div>
  );
};

// ---------------------------------------------------------------- 5 · a coleta na lojinha e a entrega
const Coleta: React.FC<{ t: number; quadro: number }> = ({ t, quadro }) => {
  const K = EV.coleta;
  if (t < K.troca[0] || t >= T[5]) return null;
  const entra = 1200 * (1 - outCubic(entre(t, K.troca[0], K.troca[1])));
  const cam = 900 * inOut(entre(t, K.sai, K.chega));
  const giro = t * 720;
  const pegou = t >= K.pega, saiu = t >= K.sai;
  // o Pertim: parado no balcão → pega a sacola → sai na motinha até a casinha (em coordenadas do mundo)
  const px = saiu ? interpolate(t, [K.sai, K.chega], [330, 1150], { ...clamp, easing: inOut }) : 330;
  const pose: Pose = saiu ? "moto" : pegou ? "sacola" : "parado";
  const desde = saiu ? K.sai : pegou ? K.pega : K.troca[0];
  const ox = entra - cam;
  const abre = entre(t, K.entregue, K.entregue + 0.3);
  return (
    <>
      <Rua t={t} desloca={cam * 1.6} casas={false} y0={1170} y1={1330} calcada={92} />
      <div style={abs(ox, 0, { width: 2200, height: 1920 })}>
        <div style={abs(470, 1250 - 360 * 1.28)}><ShopChar kind="padaria" width={360} mood="happy" lit={1} blink={piscadaEm(CENA.piscadas, t + 0.4, 0.16)} awning={0.3} /></div>
        <div style={abs(490, 730, { width: 320, display: "flex", justifyContent: "center" })}>
          <div style={{ padding: "8px 22px", borderRadius: 999, background: "#fff", border: `4px solid ${C.cremeDeep}`, fontFamily: FONT, fontWeight: W.black, fontSize: 30, color: C.tinta, whiteSpace: "nowrap" }}>Padaria do Centro</div>
        </div>
        <div style={abs(500, 1250 - 120)}><Balcao w={300} /></div>
        {!pegou && <div style={abs(600, 1130 - 104)}><Sacola w={86} /></div>}
        <div style={abs(1400, 1250 - 260 * 240 / 220)}><CasaCliente w={260} abre={abre} /></div>
      </div>
      <PertimEm t={t} quadro={quadro} pose={pose} cx={px + ox} base={1262} altura={saiu ? 300 : 330} desde={desde} />
      <Pop t={t} t0={K.coletei} cx={340 + ox} cy={850} fim={K.sai + 0.15}><Selo texto="Coletei" cor={C.coral} size={44} /></Pop>
      <Pop t={t} t0={K.entregue} cx={1530 + ox} cy={760} fim={T[5]}><Selo texto="Entregue" size={44} /></Pop>
      <Brilhos t={t} t0={K.entregue} cx={1530 + ox} cy={1040} r={130} />
    </>
  );
};

// ---------------------------------------------------------------- 6 · o acerto direto com a loja, registrado no app
const Ficha: React.FC<{ icone: React.ReactNode; titulo: string; sub: string; cor: string }> = ({ icone, titulo, sub, cor }) => (
  <Cartao w={290} pad={22} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, borderTop: `16px solid ${cor}` }}>
    <div style={{ width: 132, height: 132, borderRadius: "50%", background: C.creme, display: "flex", alignItems: "center", justifyContent: "center" }}>{icone}</div>
    <Txt size={40} style={{ marginTop: 6 }}>{titulo}</Txt>
    <Txt size={26} peso={W.extraBold} cor="#8A7E72">{sub}</Txt>
  </Cartao>
);
const Acerto: React.FC<{ t: number }> = ({ t }) => {
  if (!noar(t, 5)) return null;
  const A = EV.acerto, fim = T[6];
  const u = inOut(entre(t, A.seta, A.seta + 0.5));
  const ck = entre(t, A.check, A.check + 0.3);
  const sai = entre(t, fim - 0.16, fim);
  return (
    <>
      <Pop t={t} t0={A.fichas[0]} cx={455} cy={640} fim={fim}><Ficha icone={<IconeLoja s={100} />} titulo="Loja" sub="Padaria do Centro" cor={C.amarelo} /></Pop>
      <Pop t={t} t0={A.fichas[1]} cx={775} cy={640} fim={fim}><Ficha icone={<ScooterIcon size={104} />} titulo="Entregador" sub="parceiro" cor={C.coral} /></Pop>
      {/* a seta do acerto (ida e volta), desenhada em "acerto" */}
      {u > 0 && (
        <svg width={1080} height={1920} style={abs(0, 0, { opacity: 1 - sai })}>
          <path d="M455 820 Q615 930 775 820" stroke={C.verde} strokeWidth="12" strokeLinecap="round" fill="none" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - u} />
          {u > 0.95 && <path d="M752 812 L782 814 L772 842" stroke={C.verde} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none" />}
          {u > 0.95 && <path d="M478 812 L448 814 L458 842" stroke={C.verde} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none" />}
        </svg>
      )}
      <Pop t={t} t0={A.direto} cx={615} cy={905} fim={fim}>
        <div style={{ padding: "10px 26px", borderRadius: 999, background: C.verde, boxShadow: `0 6px 0 ${C.verdeDark}` }}><Txt size={36} cor="#fff">acerto direto</Txt></div>
      </Pop>
      <Pop t={t} t0={A.registro} cx={615} cy={1085} fim={fim}>
        <Cartao w={600} pad={22} style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Img src={staticFile("img/uaipertim_logo.png")} style={{ width: 84, height: 84 }} />
          <div style={{ flex: 1 }}>
            <Txt size={36}>Tudo registrado</Txt>
            <Txt size={26} peso={W.extraBold} cor="#8A7E72">entrega · loja · entregador</Txt>
          </div>
          <div style={{ width: 70, height: 70, borderRadius: "50%", background: ck > 0 ? C.verde : C.cremeDark, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${1 + 0.2 * Math.sin(Math.PI * ck)})` }}>
            <svg width={44} height={44} viewBox="0 0 24 24"><path d="M5 12.5 L10 17.5 L19 7" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" fill="none" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - ck} /></svg>
          </div>
        </Cartao>
      </Pop>
    </>
  );
};

// ---------------------------------------------------------------- 7 · o cadastro com conferência pessoal
const Cadastro: React.FC<{ t: number }> = ({ t }) => {
  if (!noar(t, 6)) return null;
  const E = EV.cadastro, fim = T[7];
  const enche = entre(t, E.prancheta + 0.3, E.selo + 0.4);
  const brilho = t >= E.seguranca ? 0.5 + 0.5 * Math.sin((t - E.seguranca) * 6) : 0;
  return (
    <>
      <Pop t={t} t0={E.prancheta} cx={470} cy={620} fim={fim}><div style={{ transform: `rotate(${-4 + 1.5 * Math.sin(t * 2)}deg)` }}><Prancheta w={250} enche={enche} check={t >= E.selo ? 1 : 0} /></div></Pop>
      <Pop t={t} t0={E.equipe} cx={780} cy={520} fim={fim}><Avatar s={128} cor={C.verdeLight} /></Pop>
      <Pop t={t} t0={E.equipe + 0.1} cx={700} cy={680} fim={fim}><Avatar s={128} cor={C.amareloLight} pele="#8A5A3B" /></Pop>
      <Pop t={t} t0={E.equipe + 0.2} cx={850} cy={690} fim={fim}><Avatar s={128} cor={C.coralLight} pele="#E2B48C" /></Pop>
      <Pop t={t} t0={E.selo} cx={612} cy={1010} fim={fim} s={2.2}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "22px 34px 22px 24px", borderRadius: 48, background: C.verde,
          boxShadow: `inset 0 0 0 6px ${C.verdeDark}, inset 0 0 0 10px rgba(255,255,255,0.5), 0 10px 0 ${C.verdeDark}, 0 22px 36px rgba(34,28,25,0.22)` }}>
          <IconeEscudo s={116} brilho={brilho} />
          <div>
            <Txt size={40} cor="#fff">Cadastro conferido</Txt>
            <Txt size={40} cor={C.amareloLight}>pessoalmente</Txt>
            <Txt size={40} cor="#fff">pela equipe</Txt>
          </div>
        </div>
      </Pop>
      <Brilhos t={t} t0={E.seguranca} cx={612} cy={1010} r={300} n={8} />
    </>
  );
};

// ---------------------------------------------------------------- 8 · o fecho
const Fecho: React.FC<{ t: number; quadro: number }> = ({ t, quadro }) => {
  if (!noar(t, 7)) return null;
  const E = EV.fecho, F = L.fecho, P = L.pertim.fecho;
  const out: React.ReactNode[] = [];
  const sai = entre(t, E.somem, E.somem + 0.3);
  // a rede: os três veículos ligados ao pin do UaiPertim (em "rede"); em "Chama", entram na logo
  const centro = [605, 610];
  const nos = [[440, 470], [770, 470], [605, 830]];
  const ur = inOut(entre(t, E.rede, E.rede + 0.4));
  if (sai < 1) {
    out.push(
      <svg key="rede" width={1080} height={1920} style={abs(0, 0, { opacity: 1 - sai })}>
        {nos.map(([x, y], i) => <path key={i} d={`M${centro[0]} ${centro[1]} L${centro[0] + (x - centro[0]) * ur} ${centro[1] + (y - centro[1]) * ur}`} stroke={C.coral} strokeWidth="8" strokeDasharray="4 16" strokeLinecap="round" />)}
      </svg>,
    );
    out.push(<Pop key="pin" t={t} t0={T[7] + 0.05} cx={centro[0] + (F.logo.cx - centro[0]) * sai} cy={centro[1] + (F.logo.cy - centro[1]) * sai} fim={E.somem + 0.3}><IconePin s={110} /></Pop>);
    const ic = [<ScooterIcon key="m" size={104} wheelSpin={t * 300} />, <Bike key="b" w={116} giro={t * 300} pedal={t * 5} />, <Carro key="c" w={120} giro={t * 300} />];
    nos.forEach(([x, y], i) => {
      const xx = x + (F.logo.cx - x) * inCubic(sai), yy = y + (F.logo.cy - y) * inCubic(sai);
      out.push(<Pop key={`n${i}`} t={t} t0={T[7] + 0.1 + 0.1 * i} cx={xx} cy={yy} fim={E.somem + 0.3}><div style={{ transform: `scale(${1 - 0.6 * sai})` }}><Circulo d={150}>{ic[i]}</Circulo></div></Pop>);
    });
  }
  // o "?" perto do Pertim
  const q = mola(t, E.pergunta + 0.1, 0.4, 2.4) * (1 - sai);
  if (q > 0.01) out.push(
    <div key="q" style={abs(110, 760, { width: 150, height: 150, transform: `scale(${q}) rotate(${-8 + 6 * Math.sin(t * 4)}deg)` })}>
      <svg width={150} height={150} viewBox="-60 -60 120 120" style={{ overflow: "visible" }}>
        <path d="M-52 -30 Q-52 -50 -32 -50 H32 Q52 -50 52 -30 V18 Q52 38 32 38 H-4 L-26 58 L-20 38 H-32 Q-52 38 -52 18 Z" fill={C.coralDark} transform="translate(0 6)" />
        <path d="M-52 -30 Q-52 -50 -32 -50 H32 Q52 -50 52 -30 V18 Q52 38 32 38 H-4 L-26 58 L-20 38 H-32 Q-52 38 -52 18 Z" fill={C.coral} />
        <text x="0" y="22" textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize="76" fill="#fff">?</text>
      </svg>
    </div>,
  );
  // a logo (para e fica até o fim), "Tudo pertim de você.", o CTA e o @uaipertim
  const eLogo = interpolate(t, [E.logo.entra, E.logo.parada], [0, 1], clamp);
  const kLogo = eLogo >= 1 ? 1 : outBack(eLogo / 0.85, 1.9);
  if (eLogo > 0) {
    out.push(<Twinkles key="tw" frame={quadro} seed="se-fecho" points={[[300, 380], [910, 380], [300, 600], [910, 600]]} size={30} />);
    out.push(
      <div key="logo" style={abs(F.logo.cx - F.logo.d / 2, F.logo.cy - F.logo.d / 2, { width: F.logo.d, height: F.logo.d, transform: `scale(${kLogo})`, opacity: Math.min(1, eLogo * 4),
        filter: "drop-shadow(0 16px 26px rgba(198,58,23,0.32))" })}>
        <Img src={staticFile("img/uaipertim_logo.png")} style={{ width: "100%", height: "100%" }} />
      </div>,
    );
  }
  out.push(
    <Pop key="fr" t={t} t0={E.frase} cx={F.logo.cx} cy={F.frase.cy}>
      <Txt size={F.frase.size}>Tudo <span style={{ color: C.coral }}>pertim de você.</span></Txt>
    </Pop>,
  );
  out.push(
    <Pop key="cta" t={t} t0={E.cta} cx={F.cta.cx} cy={F.cta.cy} s={2.2}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "18px 38px 18px 26px", borderRadius: 999, background: C.coral, boxShadow: `0 10px 0 ${C.coralDark}, 0 24px 40px rgba(198,58,23,0.3)`,
        transform: `rotate(${-1.5 + Math.sin(t * 3)}deg)` }}>
        <div style={{ width: 84, height: 84, borderRadius: "50%", background: "rgba(255,255,255,0.22)", border: "5px solid rgba(255,255,255,0.75)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <PaperPlaneIcon size={52} />
        </div>
        <Txt size={F.cta.size} cor="#fff">Chama no Direct</Txt>
      </div>
    </Pop>,
  );
  out.push(
    <Pop key="dm" t={t} t0={E.direct} cx={F.direct.cx} cy={F.direct.cy}>
      <DirectBalloon handle="@uaipertim" fontSize={60} heartIn={mola(t, E.direct + 0.5, 0.3, 2.4)} frame={quadro} />
    </Pop>,
  );
  if (t > E.pisca + 0.15 && t < E.pisca + 0.9) out.push(
    <div key="st" style={abs(300, 930, { opacity: interpolate(t, [E.pisca + 0.15, E.pisca + 0.35, E.pisca + 0.9], [0, 1, 0], clamp) })}><StarShape size={50} color={C.amarelo} /></div>,
  );
  const dy = 420 * (1 - outBack(entre(t, T[7], T[7] + 0.4), 1.4));
  const acena = t >= E.acena;
  out.push(<PertimEm key="pt" t={t} quadro={quadro} pose={acena ? "acenando" : "apontando"} expr={t >= E.pisca ? "piscadinha" : "sorrindo"} cx={P.cx} base={P.base + dy} altura={P.altura} desde={acena ? E.acena : T[7]} />);
  return <>{out}</>;
};

// ---------------------------------------------------------------- a legenda nova (a da Coisa de mineiro #03, LegendaPop)
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
export const SejaEntregador: React.FC<SejaEntregadorProps> = ({ mascara }) => {
  const quadro = useCurrentFrame();
  const t = quadro / FPS;
  if (mascara === "legenda") return <AbsoluteFill><LegendaPop t={t} branca /></AbsoluteFill>;
  const rua = noar(t, 0) || (t >= EV.coleta.troca[0] && t < T[5]);
  const conteudo = (
    <>
      <Gancho t={t} quadro={quadro} />
      <Chamada t={t} />
      <Disponivel t={t} />
      <Coleta t={t} quadro={quadro} />
      <CenaNotificacao t={t} />
      <Acerto t={t} />
      <Cadastro t={t} />
      <Fecho t={t} quadro={quadro} />
      <PertimCanto t={t} quadro={quadro} />
    </>
  );
  // na máscara do conteúdo, a rua (fundo de cena, de borda a borda) não entra: só os personagens e os elementos
  if (mascara === "conteudo") return <AbsoluteFill><MascaraSemRua>{conteudo}</MascaraSemRua></AbsoluteFill>;
  return (
    <AbsoluteFill style={{ background: C.creme }}>
      <CremeBackground frame={quadro} rays raysCenter={[600, rua ? 700 : 900]} raysOpacity={0.16} enfeites={false} />
      {!rua && <div style={abs(605 - 560, 860 - 560, { width: 1120, height: 1120, borderRadius: "50%", background: "radial-gradient(circle, rgba(242,80,43,0.14) 0%, rgba(242,80,43,0) 65%)" })} />}
      <Toldo />
      {conteudo}
      <LegendaPop t={t} />
    </AbsoluteFill>
  );
};
// a rua é fundo: na máscara do QA ela fica invisível (o contexto avisa o <Rua> para não desenhar)
const SemRua = React.createContext(false);
const MascaraSemRua: React.FC<{ children: React.ReactNode }> = ({ children }) => <SemRua.Provider value>{children}</SemRua.Provider>;
export const useSemRua = () => React.useContext(SemRua);

export const SE = { duracao: CENA.quadros, fps: FPS };
