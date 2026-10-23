import React from "react";
import { AbsoluteFill } from "remotion";
import { C, FONT, W } from "../config/theme";
import { Sunburst } from "../components/Decor";
import { StarShape, Twinkles } from "../components/Particles";
import { ShopChar } from "../components/Town";
import { ScooterIcon } from "../components/AppIcons";
import { fitWrap, Wrapped } from "../dicionario/fit";
import { Text } from "../carrossel/CarrosselFacim";

// CAPAS NOVAS DE REELS JÁ PUBLICADOS (só PNG, para "Editar capa → Adicionar da galeria"; os vídeos não mudam), no padrão
// das capas do Dicionário (src/dicionario/CapaDicionario.tsx) e dos carrosséis (src/carrossel/CapaFacim.tsx):
//   selo no topo (estilo do chip; número grande quando houver) → ilustração grande na metade de cima → o título da capa
//   atual (a palavra de destaque em coral com marcador amarelo, mesmas linhas, sem emoji). Sem logo, sem tela.
// Tudo dentro do recorte 3:4 da grade: y 300–1620, x 110–970. Os dados de cada capa ficam em src/covers/capasReels.ts.

export type CapaReelProps = {
  id: string; selo: string; numero?: number; icone: "balao" | "pin" | "megafone";
  ilustracao: Ilustracao; titulo: string[]; fundo: "creme" | "pessego"; cor: "coral" | "verde" | "amarelo";
  layout?: { titulo: Wrapped; fonte: string };
};
type Ilustracao = "mesa" | "nao-e-app" | "entrega" | "vaga";

const SAFE = { x0: 110, x1: 970, y0: 300, y1: 1620 };
const SELO_Y = 372;                                     // centro do selo
const ILU = { x: 162, y: 470, w: 756, h: 600 };         // ~70% da largura, na metade de cima
const TITULO = { cy: 1330, maxH: 470, maxW: 820, sizes: [170, 156, 144, 132, 120, 110, 100, 92, 84] };

// medido em calculateMetadata (fontes carregadas): as linhas dadas, no maior tamanho em que todas cabem
export const measureCapaReel = (c: CapaReelProps) => {
  const lines = c.titulo.map((l) => l.replace(/\*/g, ""));
  const size = TITULO.sizes.find((z) => lines.length * z * 1.12 <= TITULO.maxH && lines.every((l) => fitWrap(l, W.black, TITULO.maxW, [z], 1).ok)) ?? TITULO.sizes[TITULO.sizes.length - 1];
  return { titulo: { size, lines, ok: true }, fonte: c.titulo.join(" ") };
};

const COR = {
  coral: { raio: C.coral, halo: C.coralLight },
  verde: { raio: C.verde, halo: C.verdeLight },
  amarelo: { raio: C.amarelo, halo: C.amareloLight },
};

// ---------------------------------------------------------------- selo (estilo do chip): texto + número grande opcional
const IconeSelo: React.FC<{ tipo: CapaReelProps["icone"]; s: number }> = ({ tipo, s }) => (
  <svg width={s} height={s} viewBox="0 0 24 24">
    {tipo === "balao" && (<><path d="M4 4 H20 Q22 4 22 6 V15 Q22 17 20 17 H11 L6 21 L7 17 H4 Q2 17 2 15 V6 Q2 4 4 4 Z" fill={C.amarelo} /><path d="M10 8.5 Q10 6.6 12 6.6 Q14 6.6 14 8.4 Q14 9.8 12.2 10.4 V11.6" stroke={C.coral} strokeWidth="1.8" strokeLinecap="round" fill="none" /><circle cx="12.2" cy="14" r="1.1" fill={C.coral} /></>)}
    {tipo === "pin" && (<><path d="M12 22 C12 22 4 14 4 9 A8 8 0 0 1 20 9 C20 14 12 22 12 22 Z" fill={C.amarelo} /><circle cx="12" cy="9" r="3.2" fill={C.coral} /></>)}
    {tipo === "megafone" && (<><path d="M3 9 H7 L17 4 V20 L7 15 H3 Z" fill={C.amarelo} /><path d="M19.5 9 Q21.5 12 19.5 15" stroke={C.amarelo} strokeWidth="2" strokeLinecap="round" fill="none" /></>)}
  </svg>
);
const Selo: React.FC<{ texto: string; numero?: number; icone: CapaReelProps["icone"] }> = ({ texto, numero, icone }) => {
  const s = numero ? 36 : 44;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 18, background: C.coral, borderRadius: 999, padding: numero ? "10px 34px 10px 28px" : "18px 44px 18px 34px", boxShadow: `0 7px 0 ${C.coralDark}` }}>
      <IconeSelo tipo={icone} s={s * 1.35} />
      <span style={{ fontFamily: FONT, fontWeight: W.black, fontSize: s, lineHeight: 1, color: "#fff", letterSpacing: s * 0.05, whiteSpace: "nowrap" }}>{texto}{numero ? " ·" : ""}</span>
      {numero ? (
        <span style={{ fontFamily: FONT, fontWeight: W.black, fontSize: s * 2.3, lineHeight: 1, color: C.amarelo, letterSpacing: -1, whiteSpace: "nowrap", textShadow: `0 4px 0 ${C.coralDark}` }}>
          #{String(numero).padStart(2, "0")}
        </span>
      ) : null}
    </div>
  );
};

// ---------------------------------------------------------------- as ilustrações (coordenadas de 756 × 600)
const Svg: React.FC<{ children: React.ReactNode; abs?: boolean }> = ({ children, abs }) => (
  <svg width={ILU.w} height={ILU.h} viewBox="0 0 756 600" style={{ overflow: "visible", ...(abs ? { position: "absolute", left: 0, top: 0 } : {}) }}>{children}</svg>
);
const Brilho: React.FC<{ x: number; y: number; s: number; c?: string }> = ({ x, y, s, c = C.amarelo }) => (
  <path transform={`translate(${x - s / 2} ${y - s / 2}) scale(${s / 100})`} d="M50 4 C54 34 66 46 96 50 C66 54 54 66 50 96 C46 66 34 54 4 50 C34 46 46 34 50 4 Z" fill={c} />
);

// 1 · a mesa do Explica, Sô! (a cena "mesa" do motor, reels/explica-so/src/anim.js): toalha xadrez, café fumegando,
//     o prato posto e o lugar vazio do queijo com o "?"
const Mesa: React.FC = () => {
  const Y = 360;                                        // o tampo da mesa
  return (
    <Svg>
      <ellipse cx="378" cy="590" rx="330" ry="14" fill="#000" opacity="0.08" />
      {/* os pés e o tampo */}
      <rect x="70" y={Y + 50} width="30" height="186" rx="8" fill="#A86B33" />
      <rect x="656" y={Y + 50} width="30" height="186" rx="8" fill="#A86B33" />
      <rect x="30" y={Y} width="696" height="34" rx="14" fill="#C98A4B" />
      {/* a toalha xadrez com a barra ondulada */}
      <clipPath id="toalha"><rect x="84" y={Y + 6} width="588" height="96" rx="8" /></clipPath>
      <g clipPath="url(#toalha)">
        {Array.from({ length: 23 }).flatMap((_, i) => Array.from({ length: 4 }).map((__, j) => (
          <rect key={`${i}-${j}`} x={84 + i * 26} y={Y + 6 + j * 26} width="26" height="26" fill={(i + j) % 2 ? C.coral : C.papel} opacity={(i + j) % 2 ? 0.9 : 1} />
        )))}
      </g>
      {Array.from({ length: 15 }).map((_, i) => <path key={i} d={`M${84 + i * 39.2} ${Y + 102} a19.6 13 0 0 0 39.2 0 Z`} fill={C.papel} />)}
      {/* a xícara de café passadim, fumegando */}
      <g transform={`translate(190 ${Y + 2}) scale(1.5)`}>
        {[0, 1, 2].map((i) => <path key={i} d={`M${-16 + i * 16} -86 C${-28 + i * 16} -100 ${-4 + i * 16} -112 ${-16 + i * 16} -128`} stroke="#B7A79A" strokeWidth="5" strokeLinecap="round" fill="none" opacity={0.85 - i * 0.12} />)}
        <ellipse cx="0" cy="-6" rx="56" ry="11" fill={C.cremeDeep} />
        <ellipse cx="0" cy="-10" rx="52" ry="10" fill="#fff" />
        <path d="M36 -56 a15 15 0 0 1 0 28" stroke="#fff" strokeWidth="9" fill="none" />
        <path d="M-36 -66 H36 Q34 -14 0 -14 Q-34 -14 -36 -66 Z" fill="#fff" stroke={C.cremeDeep} strokeWidth="3" />
        <path d="M-34.6 -52 H34.6 L33 -42 H-33 Z" fill={C.coral} />
        <ellipse cx="0" cy="-66" rx="36" ry="7" fill="#6B3A1E" />
      </g>
      {/* o prato posto, com garfo e faca */}
      <g transform={`translate(390 ${Y + 2}) scale(1.35)`}>
        <ellipse cx="0" cy="-10" rx="62" ry="16" fill={C.cremeDeep} />
        <ellipse cx="0" cy="-14" rx="60" ry="15" fill="#fff" />
        <ellipse cx="0" cy="-14" rx="38" ry="9" fill="none" stroke={C.cremeDark} strokeWidth="3" />
        <path d="M-76 -6 L-74 -30 M-80 -30 V-40 M-74 -30 V-42 M-68 -30 V-40 M76 -6 L78 -40" stroke="#8A7A6E" strokeWidth="5" strokeLinecap="round" />
      </g>
      {/* o lugar vazio do queijo (tracejado) e o "?" */}
      <g transform={`translate(590 ${Y + 2}) scale(1.35)`}>
        <ellipse cx="0" cy="-14" rx="60" ry="16" fill="none" stroke={C.coral} strokeWidth="4" strokeDasharray="10 9" />
        <ellipse cx="0" cy="-14" rx="36" ry="9" fill="none" stroke={C.coral} strokeWidth="4" strokeDasharray="10 9" opacity="0.6" />
      </g>
      <circle cx="590" cy="186" r="96" fill="none" stroke={C.coral} strokeWidth="5" opacity="0.25" />
      <circle cx="590" cy="186" r="74" fill={C.coralDark} transform="translate(0 7)" />
      <circle cx="590" cy="186" r="74" fill={C.coral} />
      <text x="590" y="222" textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize="104" fill="#fff">?</text>
      <Brilho x={80} y={130} s={44} /><Brilho x={700} y={60} s={32} c={C.coral} /><Brilho x={420} y={90} s={30} />
    </Svg>
  );
};

// 2 · Não é app: o botão "baixar" riscado + o pin com um elo de link ao lado
const NaoEApp: React.FC = () => (
  <Svg>
    <ellipse cx="378" cy="590" rx="320" ry="14" fill="#000" opacity="0.08" />
    {/* o botão "baixar" (sem tela em volta), riscado */}
    <g transform="translate(20 110) rotate(-6 230 95)">
      <rect x="0" y="12" width="460" height="190" rx="95" fill="#A99F96" />
      <rect x="0" y="0" width="460" height="190" rx="95" fill="#CFC5BB" />
      <path d="M96 50 V122 M68 96 L96 124 L124 96 M66 142 H126" stroke="#fff" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <text x="292" y="120" textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize="78" fill="#fff" letterSpacing="2">BAIXAR</text>
    </g>
    {/* riscado como um texto tachado: atravessa o botão no meio das letras */}
    <path d="M-6 250 L506 180" stroke={C.papel} strokeWidth="24" strokeLinecap="round" />
    <path d="M-6 250 L506 180" stroke={C.coralDark} strokeWidth="13" strokeLinecap="round" transform="translate(0 5)" />
    <path d="M-6 250 L506 180" stroke={C.coral} strokeWidth="13" strokeLinecap="round" />
    {/* o pin coral e o elo de link */}
    <g transform="translate(470 210)">
      <path d="M110 380 C110 380 10 240 10 140 A100 100 0 0 1 210 140 C210 240 110 380 110 380 Z" fill={C.coralDark} transform="translate(0 10)" />
      <path d="M110 380 C110 380 10 240 10 140 A100 100 0 0 1 210 140 C210 240 110 380 110 380 Z" fill={C.coral} />
      <circle cx="110" cy="140" r="52" fill="#fff" />
    </g>
    {/* o elo de link, ao lado do pin */}
    <g transform="translate(350 430) rotate(-28)">
      <rect x="-96" y="-34" width="118" height="68" rx="34" fill="none" stroke={C.amareloDark} strokeWidth="20" />
      <rect x="-22" y="-34" width="118" height="68" rx="34" fill="none" stroke={C.amarelo} strokeWidth="20" />
    </g>
    <Brilho x={690} y={120} s={44} c={C.coral} /><Brilho x={140} y={470} s={36} /><Brilho x={380} y={540} s={28} c={C.coral} />
  </Svg>
);

// 3 · Vai funcionar assim: a motinha saindo da lojinha com a sacola, a rua tracejada até a casinha
const Entrega: React.FC = () => (
  <>
    <Svg abs>
      <ellipse cx="378" cy="590" rx="360" ry="14" fill="#000" opacity="0.08" />
      {/* a rua com o tracejado coral, da lojinha até a casinha */}
      <path d="M60 560 C220 520 300 600 420 560 S640 520 720 560" stroke={C.cremeDeep} strokeWidth="70" fill="none" strokeLinecap="round" />
      <path d="M60 560 C220 520 300 600 420 560 S640 520 720 560" stroke={C.coral} strokeWidth="9" strokeDasharray="30 22" fill="none" />
      {/* a casinha (à direita) */}
      <rect x="560" y="356" width="176" height="170" rx="12" fill="#F7D08A" />
      <path d="M540 368 L648 268 L756 368 Z" fill={C.coral} />
      <rect x="536" y="360" width="224" height="20" rx="10" fill={C.coralDark} />
      <rect x="626" y="440" width="52" height="86" rx="8" fill="#FFE9A8" />
      <rect x="626" y="440" width="22" height="86" rx="6" fill={C.coralDark} />
      <rect x="576" y="400" width="38" height="36" rx="6" fill="#FFE48A" stroke="#8A4A1C" strokeWidth="5" />
    </Svg>
    {/* a lojinha (à esquerda) */}
    <div style={{ position: "absolute", left: 6, top: 530 - 236 * 1.28 }}>
      <ShopChar kind="mercado" width={236} mood="happy" look={[0.9, 0.2]} lit={1} awning={0.5} />
    </div>
    <div style={{ position: "absolute", left: 330, top: 300, transform: "rotate(-6deg)" }}>
      <ScooterIcon size={260} />
    </div>
    {/* os riscos de velocidade e a sacola em cima do baú da motinha */}
    <Svg abs>
      {[0, 1, 2].map((i) => <path key={i} d={`M${262 - i * 10} ${398 + i * 30} H${310 - i * 6}`} stroke={C.coral} strokeWidth="9" strokeLinecap="round" opacity={0.75 - i * 0.18} />)}
      <g transform="translate(362 344) rotate(-6 35 0)">
        <path d="M16 -40 C16 -66 54 -66 54 -40" stroke={C.coralDark} strokeWidth="8" fill="none" strokeLinecap="round" />
        <path d="M2 -40 H68 L72 18 H-2 Z" fill="#E9B872" />
        <path d="M2 -40 H68 L69 -26 H1 Z" fill={C.coral} />
      </g>
    </Svg>
    <Svg abs><Brilho x={360} y={90} s={40} c={C.coral} /><Brilho x={700} y={180} s={34} /><Brilho x={80} y={60} s={30} /></Svg>
  </>
);

// 4 · Qual comércio precisa estar aqui: a fileira de lojinhas com uma vaga vazia e a placa "?" no lugar da loja
const Vaga: React.FC = () => {
  const w = 178, base = 520, xs = [8, 196, 384, 572];   // 4 lugares na fileira; o 3º é a vaga
  return (
    <>
      <Svg abs>
        <ellipse cx="378" cy="590" rx="370" ry="14" fill="#000" opacity="0.08" />
        <rect x="0" y={base - 4} width="756" height="30" rx="12" fill={C.cremeDeep} />
        {/* a vaga: o terreno tracejado */}
        <rect x={xs[2] + 6} y={base - 214} width={w - 12} height="210" rx="16" fill={C.coral} fillOpacity="0.07" stroke={C.coral} strokeWidth="6" strokeDasharray="18 14" />
        {/* a placa "?" fincada no lugar da loja */}
        <g transform={`translate(${xs[2] + w / 2} ${base})`}>
          <rect x="-8" y="-170" width="16" height="170" rx="6" fill="#A86B33" />
          <rect x="-74" y="-300" width="148" height="140" rx="22" fill={C.coralDark} transform="translate(0 8)" />
          <rect x="-74" y="-300" width="148" height="140" rx="22" fill={C.coral} />
          <text x="0" y="-188" textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize="118" fill="#fff">?</text>
        </g>
      </Svg>
      {(["padaria", "farmacia", null, "lanchonete"] as const).map((kind, i) =>
        kind ? (
          <div key={i} style={{ position: "absolute", left: xs[i], top: base - w * 1.28 }}>
            <ShopChar kind={kind} width={w} mood="happy" look={[i < 2 ? 0.8 : -0.8, 0.1]} lit={0.9} awning={0.4} />
          </div>
        ) : null,
      )}
      {[[xs[2] + w / 2 - 110, 120, 44, C.amarelo], [xs[2] + w / 2 + 110, 150, 34, C.coral]].map(([x, y, s, c], i) => (
        <div key={i} style={{ position: "absolute", left: (x as number) - (s as number) / 2, top: (y as number) - (s as number) / 2 }}><StarShape size={s as number} color={c as string} /></div>
      ))}
    </>
  );
};

const ILUSTRACOES: Record<Ilustracao, React.FC> = { mesa: Mesa, "nao-e-app": NaoEApp, entrega: Entrega, vaga: Vaga };

// ---------------------------------------------------------------- a capa
const TWINK: Array<[number, number]> = [[150, 470], [930, 520], [130, 1120], [950, 1100], [170, 1560], [910, 1570]];
export const CapaReel: React.FC<CapaReelProps> = ({ id, selo, numero, icone, ilustracao, fundo, cor, layout }) => {
  if (!layout) throw new Error("CapaReel: layout é medido no calculateMetadata");
  const k = COR[cor];
  const bg = fundo === "pessego"
    ? "radial-gradient(circle at 50% 38%, #FFF1E2 0%, #FBE3CC 55%, #F3CDAC 100%)"
    : `radial-gradient(circle at 50% 38%, #FFF8EE 0%, ${C.creme} 55%, #F1E3D0 100%)`;
  const Ilu = ILUSTRACOES[ilustracao];
  const t = layout.titulo, th = t.lines.length * t.size * 1.12;
  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <Sunburst frame={0} cx={540} cy={ILU.y + ILU.h / 2} color={k.raio} opacity={0.12} />
      <Twinkles frame={14} seed={`capa-reel-${id}`} points={TWINK} size={34} />
      <div style={{ position: "absolute", left: 540 - 400, top: ILU.y + ILU.h / 2 - 400, width: 800, height: 800, borderRadius: "50%", background: `radial-gradient(circle, ${k.halo}66 0%, ${k.halo}00 68%)` }} />
      <div style={{ position: "absolute", top: SELO_Y - 60, left: 0, right: 0, height: 120, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Selo texto={selo} numero={numero} icone={icone} />
      </div>
      <div style={{ position: "absolute", left: ILU.x, top: ILU.y, width: ILU.w, height: ILU.h }}>
        <Ilu />
      </div>
      <div style={{ position: "absolute", top: TITULO.cy - th / 2, left: SAFE.x0, right: 1080 - SAFE.x1 }}>
        <Text source={layout.fonte} wrapped={t} weight={W.black} />
      </div>
    </AbsoluteFill>
  );
};
