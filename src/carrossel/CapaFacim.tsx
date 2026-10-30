import React from "react";
import { AbsoluteFill } from "remotion";
import { C, FONT, W } from "../config/theme";
import { Sunburst } from "../components/Decor";
import { StarShape, Twinkles } from "../components/Particles";
import { ShopChar } from "../components/Town";
import { fitWrap, Wrapped } from "../dicionario/fit";
import { Mao } from "../dicionario/CapaDicionario";
import { Carrossel, Text, glue, measureSlide } from "./CarrosselFacim";
import { Pertim } from "../personagem/Pertim";

// CAPAS NOVAS DOS CARROSSÉIS "FACIM FACIM" (só o slide-1; os slides 2–6 não mudam), no modelo das capas novas do
// Dicionário (src/dicionario/CapaDicionario.tsx), em 1080×1350:
//   selo "FACIM FACIM · #07" (número grande) → ilustração grande na metade de cima → o título atual (mesma palavra em
//   coral com marcador amarelo, mesmas quebras, sem o emoji) → "arrasta pra ver →".
// Tudo dentro do recorte 3:4 da grade: x 130–950 e y 90–1260. Sem logo, sem tela/celular.
// Dados no campo "capaNova" de cada carrosseis/facim/NN-tema.json: { ilustracao, fundo: creme | pessego, cor }.

export type CapaNova = { ilustracao: Ilustracao; fundo: "creme" | "pessego"; cor: "coral" | "verde" | "amarelo" };
export type CapaFacimProps = Carrossel & { capaNova: CapaNova; layout?: { titulo: Wrapped; fonte: string } };
type Ilustracao = "mao-vez" | "passos" | "sacola" | "loja-aberto" | "sino" | "moeda-coracao" | "geladeira" | "pertim" | "restaurante-balao";

const H = 1350;
const SAFE = { x0: 130, x1: 950, y0: 90, y1: 1260 };
const SELO_Y = 165;                                     // centro do selo
const ILU = { x: 178, y: 250, w: 724, h: 460 };         // ~67% da largura, na metade de cima
const TITULO = { cy: 945, maxH: 380, sizes: [120, 112, 104, 96, 88, 80, 72] };
const APOIO_Y = 1168;

// o emoji da capa antiga sai (a ilustração faz o papel dele); o resto do título fica igual
const semEmoji = (t: string) => t.replace(/[  ]*\p{Extended_Pictographic}️?/gu, "").trim();

// medido em calculateMetadata (fontes carregadas): as MESMAS quebras da capa atual (measureSlide), sem o emoji, no
// maior tamanho em que todas as linhas cabem em x 130–950
export const measureCapaFacim = (c: CapaFacimProps) => {
  const atual = measureSlide(c, 0).titulo;
  const lines = atual.lines.map(semEmoji).filter(Boolean);
  const larg = SAFE.x1 - SAFE.x0;
  const size = TITULO.sizes.find((z) => lines.length * z * 1.12 <= TITULO.maxH && lines.every((l) => fitWrap(l, W.black, larg, [z], 1).ok)) ?? TITULO.sizes[TITULO.sizes.length - 1];
  return { titulo: { size, lines, ok: true }, fonte: semEmoji(glue(c.slides[0].titulo)) };
};

const COR: Record<CapaNova["cor"], { raio: string; halo: string }> = {
  coral: { raio: C.coral, halo: C.coralLight },
  verde: { raio: C.verde, halo: C.verdeLight },
  amarelo: { raio: C.amarelo, halo: C.amareloLight },
};

// ---------------------------------------------------------------- selo: "FACIM FACIM · #07", número grande
const Selo: React.FC<{ texto: string; numero: number }> = ({ texto, numero }) => {
  const s = 34;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 16, background: C.coral, borderRadius: 999, padding: "8px 34px 8px 26px", boxShadow: `0 7px 0 ${C.coralDark}` }}>
      <svg width={s * 1.2} height={s * 1.2} viewBox="0 0 24 24"><path d="M13 2 L4 14 H11 L10 22 L20 9 H13 Z" fill={C.amarelo} /></svg>
      <span style={{ fontFamily: FONT, fontWeight: W.black, fontSize: s, lineHeight: 1, color: "#fff", letterSpacing: s * 0.05, whiteSpace: "nowrap" }}>{texto} ·</span>
      <span style={{ fontFamily: FONT, fontWeight: W.black, fontSize: s * 2.3, lineHeight: 1, color: C.amarelo, letterSpacing: -1, whiteSpace: "nowrap", textShadow: `0 4px 0 ${C.coralDark}` }}>
        #{String(numero).padStart(2, "0")}
      </span>
    </div>
  );
};

// ---------------------------------------------------------------- as ilustrações (coordenadas de 724 × 460)
const Svg: React.FC<{ children: React.ReactNode; abs?: boolean }> = ({ children, abs }) => (
  <svg width={ILU.w} height={ILU.h} viewBox="0 0 724 460" style={{ overflow: "visible", ...(abs ? { position: "absolute", left: 0, top: 0 } : {}) }}>{children}</svg>
);
const Sombra: React.FC<{ cx?: number; rx?: number }> = ({ cx = 362, rx = 300 }) => <ellipse cx={cx} cy="452" rx={rx} ry="12" fill="#000" opacity="0.08" />;
const Brilho: React.FC<{ x: number; y: number; s: number; c?: string }> = ({ x, y, s, c = C.amarelo }) => (
  <path transform={`translate(${x - s / 2} ${y - s / 2}) scale(${s / 100})`} d="M50 4 C54 34 66 46 96 50 C66 54 54 66 50 96 C46 66 34 54 4 50 C34 46 46 34 50 4 Z" fill={c} />
);
// balãozinho de fala com um "?"
const BalaoQ: React.FC<{ x: number; y: number; r: number; bg: string; fg: string; rot?: number }> = ({ x, y, r, bg, fg, rot = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <path d={`M${-r} ${-r * 0.55} Q${-r} ${-r * 0.85} ${-r * 0.7} ${-r * 0.85} H${r * 0.7} Q${r} ${-r * 0.85} ${r} ${-r * 0.55} V${r * 0.45} Q${r} ${r * 0.75} ${r * 0.7} ${r * 0.75} H${-r * 0.1} L${-r * 0.5} ${r * 1.15} L${-r * 0.42} ${r * 0.75} H${-r * 0.7} Q${-r} ${r * 0.75} ${-r} ${r * 0.45} Z`} fill={bg} />
    <text x="0" y={r * 0.42} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={r * 1.25} fill={fg}>?</text>
  </g>
);

// C1 · a mão levantada pedindo a vez + 3 balõezinhos "?"
const MaoVez: React.FC = () => (
  <Svg>
    <Sombra cx={330} rx={170} />
    {/* tracinhos de "eu! eu!" */}
    {[[214, 90, -50], [190, 190, -80], [520, 70, 40]].map(([x, y, r], i) => (
      <rect key={i} x={x - 11} y={y - 34} width={22} height={68} rx={11} fill={C.amarelo} transform={`rotate(${r} ${x} ${y})`} />
    ))}
    {/* a manga e a mão aberta, levantada */}
    <rect x="322" y="290" width="186" height="170" rx="34" fill={C.coral} />
    <rect x="322" y="290" width="186" height="34" rx="17" fill={C.coralDark} />
    <Mao x={208} y={-16} s={3.5} />
    {/* os balõezinhos "?" */}
    <BalaoQ x={600} y={150} r={74} bg={C.coral} fg="#fff" rot={8} />
    <BalaoQ x={626} y={350} r={54} bg={C.amarelo} fg={C.tinta} rot={-6} />
    <BalaoQ x={96} y={250} r={62} bg={C.verde} fg="#fff" rot={-10} />
    <Brilho x={690} y={250} s={34} c={C.coral} /><Brilho x={40} y={120} s={40} />
  </Svg>
);

// C2 · o caminho com 3 passos numerados: pin → lojinha → sacola
const Sacolinha: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  // sacola de papel (sem logo); (x, y) = o centro da base
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-34 -100 C-34 -150 34 -150 34 -100" stroke={C.coralDark} strokeWidth="10" fill="none" strokeLinecap="round" />
    <path d="M-62 -100 H62 L70 0 H-70 Z" fill="#E9B872" />
    <path d="M-62 -100 H62 L64 -78 H-64 Z" fill={C.coral} />
    <path d="M18 -100 L22 0 H70 L62 -100 Z" fill="#000" opacity="0.06" />
    <circle cx="0" cy="-42" r="16" fill="#fff" opacity="0.85" />
  </g>
);
const Pin: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  // o pin coral; (x, y) = a ponta
  <g transform={`translate(${x - 60 * s} ${y - 196 * s}) scale(${s})`}>
    <path d="M60 196 C60 196 6 120 6 66 A54 54 0 0 1 114 66 C114 120 60 196 60 196 Z" fill={C.coral} />
    <path d="M60 196 C82 160 114 116 114 66 A54 54 0 0 0 92 22 C100 70 84 140 60 196 Z" fill={C.coralDark} opacity="0.35" />
    <circle cx="60" cy="64" r="24" fill="#fff" />
  </g>
);
const PASSOS = [118, 362, 606];
const Passos: React.FC = () => (
  <>
    <Svg abs>
      {/* a rua */}
      <path d="M0 404 C120 360 230 430 362 404 S600 360 724 404" stroke={C.cremeDeep} strokeWidth="64" fill="none" strokeLinecap="round" />
      <path d="M0 404 C120 360 230 430 362 404 S600 360 724 404" stroke="#fff" strokeWidth="8" strokeDasharray="22 18" fill="none" opacity="0.8" />
      {/* as setinhas entre os passos */}
      {[240, 484].map((x) => <path key={x} d={`M${x - 14} ${388} L${x + 6} 404 L${x - 14} 420`} stroke={C.verde} strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" fill="none" />)}
      <Pin x={PASSOS[0]} y={352} s={0.95} />
      <Sacolinha x={PASSOS[2]} y={356} s={1.18} />
    </Svg>
    <div style={{ position: "absolute", left: PASSOS[1] - 100, top: 356 - 200 * 1.28 }}>
      <ShopChar kind="mercado" width={200} mood="happy" look={[0.3, 0.2]} lit={0.9} awning={0.4} />
    </div>
    <Svg abs>
      {/* os números dos passos, em cima da rua */}
      {PASSOS.map((x, i) => (
        <g key={x}>
          <circle cx={x} cy={412} r={38} fill={C.verdeDark} />
          <circle cx={x} cy={406} r={38} fill={C.verde} />
          <text x={x} y={422} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize="46" fill="#fff">{i + 1}</text>
        </g>
      ))}
    </Svg>
  </>
);

// C3 · a sacola UaiPertim cheia: pão, remédio, ração e lanche saindo
const Sacola: React.FC = () => (
  <Svg>
    <Sombra cx={362} rx={220} />
    {/* as alças (atrás) */}
    {[300, 424].map((x) => <path key={x} d={`M${x - 40} 214 C${x - 40} 130 ${x + 40} 130 ${x + 40} 214`} stroke={C.coralDark} strokeWidth="16" fill="none" strokeLinecap="round" />)}
    {/* o pão (bisnaga), de pé, inclinado */}
    <g transform="rotate(-24 250 150)">
      <rect x="216" y="40" width="70" height="230" rx="35" fill="#D9913E" />
      <rect x="222" y="44" width="58" height="222" rx="29" fill="#EDB463" />
      {[90, 140, 190].map((y) => <path key={y} d={`M234 ${y} L268 ${y - 22}`} stroke="#FFE2A8" strokeWidth="9" strokeLinecap="round" />)}
    </g>
    {/* o remédio (caixinha com a cruz verde) */}
    <g transform="rotate(-6 330 140)">
      <rect x="290" y="74" width="84" height="150" rx="10" fill="#fff" stroke={C.cremeDeep} strokeWidth="5" />
      <rect x="290" y="74" width="84" height="30" rx="8" fill={C.verde} />
      <rect x="323" y="128" width="18" height="52" rx="4" fill={C.verde} /><rect x="306" y="145" width="52" height="18" rx="4" fill={C.verde} />
    </g>
    {/* a ração (saquinho com a patinha) */}
    <g transform="rotate(10 438 130)">
      <path d="M392 60 H486 L496 230 H382 Z" fill={C.amareloDark} />
      <path d="M392 60 H486 L488 84 H390 Z" fill="#C97C14" />
      <circle cx="440" cy="150" r="20" fill="#fff" />
      {[[-24, -24], [-8, -34], [10, -34], [26, -24]].map(([dx, dy], i) => <circle key={i} cx={440 + dx} cy={150 + dy} r="9" fill="#fff" />)}
    </g>
    {/* o lanche (hambúrguer) */}
    <g transform="translate(560 108) rotate(14)">
      <path d="M-70 0 Q-70 -60 0 -60 Q70 -60 70 0 Z" fill="#E8A64A" />
      {[[-30, -34], [0, -44], [28, -30]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="6" ry="3.5" fill="#FFF4D2" />)}
      <path d="M-76 2 Q-50 16 -24 4 T26 4 T76 2 V14 H-76 Z" fill={C.verde} />
      <rect x="-72" y="14" width="144" height="24" rx="12" fill="#7A3A18" />
      <rect x="-68" y="40" width="136" height="22" rx="11" fill="#E8A64A" />
    </g>
    {/* a frente da sacola (cobre o pé dos itens), com a faixa coral e o pin da marca */}
    <path d="M196 214 H528 L548 452 H176 Z" fill="#E9B872" />
    <path d="M196 214 H528 L531 252 H193 Z" fill={C.coral} />
    <path d="M430 214 H528 L548 452 H448 Z" fill="#000" opacity="0.06" />
    <Pin x={362} y={410} s={0.62} />
    <Brilho x={120} y={120} s={44} c={C.coral} /><Brilho x={650} y={330} s={38} /><Brilho x={680} y={40} s={28} c={C.coral} />
  </Svg>
);

// C5 · a lojinha grande com olhos, a placa "ABERTO" e o megafone
const LojaAberto: React.FC = () => {
  const w = 330, h = w * 1.28, x0 = 86, y0 = 452 - h, k = w / 200;
  return (
    <>
      <Svg abs><Sombra cx={x0 + w / 2} rx={200} /></Svg>
      <div style={{ position: "absolute", left: x0, top: y0 }}>
        <ShopChar kind="padaria" width={w} mood="happy" look={[0.7, -0.2]} lit={1} awning={0.6} sparkle={0.6} />
      </div>
      <Svg abs>
        {/* a placa ABERTO pendurada na porta */}
        <g transform={`translate(${x0 + 100 * k} ${y0 + 182 * k})`}>
          <path d="M-46 0 L0 -26 L46 0" stroke={C.tinta} strokeWidth="5" fill="none" strokeLinejoin="round" />
          <circle cx="0" cy="-26" r="7" fill={C.amarelo} />
          <rect x="-96" y="0" width="192" height="68" rx="16" fill={C.verdeDark} transform="translate(0 6)" />
          <rect x="-96" y="0" width="192" height="68" rx="16" fill={C.verde} />
          <text x="0" y="48" textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize="40" fill="#fff" letterSpacing="2">ABERTO</text>
        </g>
        {/* o megafone, anunciando */}
        <g transform="translate(470 196) rotate(-16)">
          <rect x="-12" y="22" width="34" height="74" rx="12" fill={C.tinta} transform="rotate(-8 0 40)" />
          <path d="M0 -26 L150 -92 V100 L0 34 Z" fill={C.coral} />
          <path d="M150 -92 V100 L162 98 V-90 Z" fill={C.coralDark} />
          <rect x="-36" y="-30" width="44" height="68" rx="14" fill={C.coralDark} />
          <path d="M40 -30 L130 -70" stroke="#fff" strokeOpacity="0.3" strokeWidth="12" strokeLinecap="round" />
          {[0, 1, 2].map((i) => <path key={i} d={`M${190 + i * 30} ${-80 - i * 14} Q${236 + i * 40} 4 ${190 + i * 30} ${88 + i * 14}`} stroke={i === 1 ? C.amarelo : C.coral} strokeWidth="12" strokeLinecap="round" fill="none" />)}
        </g>
      </Svg>
      {[[690, 40, 44, C.amarelo], [440, 30, 34, C.coral]].map(([x, y, s, c], i) => (
        <div key={i} style={{ position: "absolute", left: (x as number) - (s as number) / 2, top: (y as number) - (s as number) / 2 }}><StarShape size={s as number} color={c as string} /></div>
      ))}
    </>
  );
};

// C7 · o sininho grande tocando, com as ondas
const Sino: React.FC = () => (
  <Svg>
    <Sombra cx={362} rx={160} />
    {/* as ondas do som */}
    {[0, 1, 2].map((i) => (
      <g key={i} stroke={i === 1 ? C.amarelo : C.coral} strokeWidth="14" strokeLinecap="round" fill="none">
        <path d={`M${160 - i * 44} ${110 - i * 18} Q${120 - i * 56} 220 ${160 - i * 44} ${330 + i * 18}`} />
        <path d={`M${564 + i * 44} ${110 - i * 18} Q${604 + i * 56} 220 ${564 + i * 44} ${330 + i * 18}`} />
      </g>
    ))}
    <g transform="rotate(-13 362 40)">
      <circle cx="362" cy="40" r="26" fill="none" stroke={C.amareloDark} strokeWidth="14" />
      {/* o badalo, balançando pro lado */}
      <circle cx="398" cy="402" r="40" fill={C.coral} />
      <circle cx="386" cy="390" r="12" fill="#fff" opacity="0.4" />
      {/* o corpo do sino */}
      <path d="M362 62 C262 62 230 150 230 234 V300 Q230 340 196 364 H528 Q494 340 494 300 V234 C494 150 462 62 362 62 Z" fill={C.amarelo} />
      <path d="M362 62 C432 62 470 120 486 190 V300 Q486 342 520 364 H420 Q460 330 460 280 V220 C460 140 420 80 362 62 Z" fill={C.amareloDark} opacity="0.55" />
      <rect x="180" y="352" width="364" height="40" rx="20" fill={C.amareloDark} />
      <path d="M282 110 Q300 90 330 84" stroke="#FFE8A8" strokeWidth="16" strokeLinecap="round" fill="none" />
    </g>
    <Brilho x={110} y={40} s={40} c={C.coral} /><Brilho x={640} y={420} s={36} c={C.coral} /><Brilho x={640} y={30} s={30} />
  </Svg>
);

// C8 · a moedinha com coração indo da casinha pra lojinha
const MoedaCoracao: React.FC = () => (
  <>
    <Svg abs>
      <Sombra cx={362} rx={340} />
      {/* a casinha */}
      <rect x="40" y="276" width="200" height="176" rx="12" fill="#FFF3DF" />
      <path d="M18 290 L140 176 L262 290 Z" fill={C.verde} />
      <rect x="18" y="282" width="244" height="20" rx="10" fill={C.verdeDark} />
      <rect x="112" y="370" width="54" height="82" rx="9" fill={C.coralDark} />
      <circle cx="156" cy="414" r="5" fill={C.amarelo} />
      <rect x="60" y="324" width="40" height="38" rx="6" fill="#FFE48A" stroke="#8A4A1C" strokeWidth="5" />
      {/* o caminho da moeda */}
      <path d="M210 250 Q362 -40 520 210" stroke={C.verde} strokeWidth="10" strokeDasharray="4 22" strokeLinecap="round" fill="none" />
      <path d="M494 200 L522 214 L530 182" stroke={C.verde} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
    <div style={{ position: "absolute", left: 496, top: 452 - 210 * 1.28 }}>
      <ShopChar kind="mercado" width={210} mood="happy" look={[-0.6, -0.3]} lit={0.9} awning={0.4} sparkle={0.7} />
    </div>
    <Svg abs>
      {/* a moedinha com o coração, com o rastro */}
      {[0, 1, 2].map((i) => <path key={i} d={`M${262 - i * 6} ${110 + i * 34} H${300 - i * 8}`} stroke={C.amarelo} strokeWidth="10" strokeLinecap="round" opacity={0.8 - i * 0.2} />)}
      <g transform="translate(372 116) rotate(-12)">
        <circle cx="0" cy="8" r="74" fill={C.amareloDark} />
        <circle cx="0" cy="0" r="74" fill={C.amarelo} />
        <circle cx="0" cy="0" r="56" fill="none" stroke="#FFE08A" strokeWidth="7" />
        <path d="M0 34 C-54 -2 -38 -46 -2 -26 L0 -24 L2 -26 C38 -46 54 -2 0 34 Z" fill={C.coral} />
        <path d="M-40 -44 Q-30 -58 -12 -62" stroke="#fff" strokeOpacity="0.6" strokeWidth="9" strokeLinecap="round" fill="none" />
      </g>
      {[[640, 60, 40], [690, 140, 26]].map(([x, y, s], i) => (
        <path key={i} transform={`translate(${x} ${y}) scale(${s / 100})`} d="M0 34 C-60 -6 -44 -52 -2 -30 L0 -28 L2 -30 C44 -52 60 -6 0 34 Z" fill={C.coral} />
      ))}
    </Svg>
  </>
);

// C9 · a geladeira aberta e vazia, com a lua na janela
const Geladeira: React.FC = () => (
  <Svg>
    <Sombra cx={460} rx={230} />
    {/* a janela com a noite e a lua */}
    <rect x="20" y="30" width="220" height="220" rx="22" fill="#fff" />
    <rect x="36" y="46" width="188" height="188" rx="12" fill="#34406E" />
    <path d="M150 90 A54 54 0 1 0 196 170 A44 44 0 1 1 150 90 Z" fill={C.amarelo} />
    {[[70, 80, 22], [96, 190, 16], [190, 70, 14]].map(([x, y, s], i) => <Brilho key={i} x={x} y={y} s={s} c="#FFE8A8" />)}
    <rect x="124" y="46" width="12" height="188" fill="#fff" /><rect x="36" y="134" width="188" height="12" fill="#fff" />
    <rect x="8" y="244" width="244" height="18" rx="9" fill={C.cremeDeep} />
    {/* a geladeira: o corpo, o interior iluminado e vazio */}
    <rect x="300" y="14" width="260" height="438" rx="30" fill="#FFFDF8" stroke={C.cremeDeep} strokeWidth="6" />
    <rect x="320" y="34" width="220" height="400" rx="16" fill="#DDEFF6" />
    <ellipse cx="430" cy="54" rx="90" ry="26" fill="#FFFBE0" opacity="0.9" />
    <rect x="320" y="146" width="220" height="12" fill="#fff" />
    {[236, 316].map((y) => <rect key={y} x="330" y={y} width="200" height="8" rx="4" fill="#fff" opacity="0.9" />)}
    <rect x="336" y="380" width="188" height="44" rx="10" fill="#C7E2EE" />
    {/* a porta aberta (de lado, em perspectiva) */}
    <path d="M562 22 L700 64 V420 L562 452 Z" fill="#FFFDF8" stroke={C.cremeDeep} strokeWidth="6" strokeLinejoin="round" />
    <path d="M582 88 L684 112 V136 L582 116 Z M582 240 L684 250 V272 L582 266 Z M582 360 L684 356 V378 L582 386 Z" fill={C.cremeDark} />
    <rect x="672" y="170" width="14" height="70" rx="7" fill={C.cremeDeep} />
    {/* o vento frio saindo */}
    {[0, 1].map((i) => <path key={i} d={`M${370 + i * 60} ${200 + i * 70} q20 -14 40 0 t40 0`} stroke="#fff" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.9" />)}
  </Svg>
);

// C4 · o Pertim (src/personagem, V1) acenando com a piscadinha, grande, de pé no chão da ilustração
const PertimAcenando: React.FC = () => {
  const altura = 500, w = (altura * 280) / 284;
  return (
    <div style={{ position: "relative", width: ILU.w, height: ILU.h }}>
      <Svg abs><Sombra rx={170} /></Svg>
      <div style={{ position: "absolute", left: ILU.w / 2 - w / 2, top: 452 - altura * 0.947 }}>
        <Pertim v={1} pose="acenando" expr="piscadinha" altura={altura} rig={{ aceno: 8 }} />
      </div>
    </div>
  );
};

// C6 · a lojinha restaurante com olhinhos e o balão "O que tem hoje?", com a resposta "digitando" (sem tela de app)
const RestauranteBalao: React.FC = () => {
  const lw = 300;
  return (
    <div style={{ position: "relative", width: ILU.w, height: ILU.h }}>
      <Svg abs>
        <Sombra cx={190} rx={170} />
        {/* o balão da pergunta */}
        <g filter="drop-shadow(0 8px 10px rgba(34,28,25,0.15))">
          <path d="M370 30 H690 Q714 30 714 54 V150 Q714 174 690 174 H460 L420 210 L428 174 H370 Q346 174 346 150 V54 Q346 30 370 30 Z" fill="#fff" />
        </g>
        <text x="530" y="92" textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize="40" fill={C.tinta}>O que tem</text>
        <text x="530" y="142" textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize="44" fill={C.coral}>hoje?</text>
        {/* a resposta "digitando…" */}
        <g filter="drop-shadow(0 8px 10px rgba(34,28,25,0.15))">
          <path d="M460 236 H640 Q662 236 662 258 V306 Q662 328 640 328 H600 L612 360 L572 328 H460 Q438 328 438 306 V258 Q438 236 460 236 Z" fill={C.cremeDark} />
        </g>
        {[0, 1, 2].map((i) => <circle key={i} cx={510 + i * 40} cy={282} r="13" fill="#9C8F86" opacity={0.55 + 0.2 * i} />)}
        <Brilho x={330} y={60} s={34} />
        <Brilho x={700} y={400} s={26} c={C.coral} />
      </Svg>
      <div style={{ position: "absolute", left: 190 - lw / 2, top: 448 - lw * 1.28 }}>
        <ShopChar kind="restaurante" width={lw} mood="happy" look={[0.8, -0.6]} lit={0.9} awning={0.4} />
      </div>
    </div>
  );
};

const ILUSTRACOES: Record<Ilustracao, React.FC> = {
  "mao-vez": MaoVez, passos: Passos, sacola: Sacola, "loja-aberto": LojaAberto, sino: Sino, "moeda-coracao": MoedaCoracao, geladeira: Geladeira,
  pertim: PertimAcenando, "restaurante-balao": RestauranteBalao,
};

// ---------------------------------------------------------------- a capa
const TWINK: Array<[number, number]> = [[160, 300], [920, 320], [150, 760], [930, 740], [180, 1215], [900, 1225]];
export const CapaFacim: React.FC<CapaFacimProps> = ({ numero, chip, capaNova, layout }) => {
  if (!layout) throw new Error("CapaFacim: layout é medido no calculateMetadata");
  const cor = COR[capaNova.cor];
  const bg = capaNova.fundo === "pessego"
    ? "radial-gradient(circle at 50% 38%, #FFF1E2 0%, #FBE3CC 55%, #F3CDAC 100%)"
    : `radial-gradient(circle at 50% 38%, #FFF8EE 0%, ${C.creme} 55%, #F1E3D0 100%)`;
  const Ilu = ILUSTRACOES[capaNova.ilustracao];
  const t = layout.titulo, th = t.lines.length * t.size * 1.12;
  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <Sunburst frame={0} cx={540} cy={ILU.y + ILU.h / 2} color={cor.raio} opacity={0.12} />
      <Twinkles frame={14} seed={`capa-facim-${numero}`} points={TWINK} size={30} />
      {/* halo atrás da ilustração */}
      <div style={{ position: "absolute", left: 540 - 380, top: ILU.y + ILU.h / 2 - 380, width: 760, height: 760, borderRadius: "50%", background: `radial-gradient(circle, ${cor.halo}66 0%, ${cor.halo}00 68%)` }} />
      <div style={{ position: "absolute", top: SELO_Y - 50, left: 0, right: 0, height: 100, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Selo texto={chip} numero={numero} />
      </div>
      <div style={{ position: "absolute", left: ILU.x, top: ILU.y, width: ILU.w, height: ILU.h }}>
        <Ilu />
      </div>
      <div style={{ position: "absolute", top: TITULO.cy - th / 2, left: SAFE.x0, right: 1080 - SAFE.x1 }}>
        <Text source={layout.fonte} wrapped={t} weight={W.black} />
      </div>
      <div style={{ position: "absolute", top: APOIO_Y, left: 0, right: 0, textAlign: "center", fontFamily: FONT, fontWeight: W.medium, fontSize: 46, color: C.tinta, letterSpacing: -0.3 }}>
        arrasta pra ver →
      </div>
    </AbsoluteFill>
  );
};
export const CAPA_FACIM = { width: 1080, height: H };
