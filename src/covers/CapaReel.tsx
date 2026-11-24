import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { C, FONT, W } from "../config/theme";
import { Sunburst } from "../components/Decor";
import { StarShape, Twinkles } from "../components/Particles";
import { ShopChar } from "../components/Town";
import { ScooterIcon } from "../components/AppIcons";
import { fitWrap, Wrapped } from "../dicionario/fit";
import { Text } from "../carrossel/CarrosselFacim";
import { BreadIcon, BurgerIcon } from "../components/Icons";
import { Pertim } from "../personagem/Pertim";

// CAPAS NOVAS DE REELS JÁ PUBLICADOS (só PNG, para "Editar capa → Adicionar da galeria"; os vídeos não mudam), no padrão
// das capas do Dicionário (src/dicionario/CapaDicionario.tsx) e dos carrosséis (src/carrossel/CapaFacim.tsx):
//   selo no topo (estilo do chip; número grande quando houver) → ilustração grande na metade de cima → o título da capa
//   atual (a palavra de destaque em coral com marcador amarelo, mesmas linhas, sem emoji). Sem logo, sem tela.
// Tudo dentro do recorte 3:4 da grade: y 300–1620, x 110–970. Os dados de cada capa ficam em src/covers/capasReels.ts.

export type CapaReelProps = {
  id: string; selo: string; numero?: number; icone: "balao" | "pin" | "megafone";
  ilustracao: Ilustracao; titulo: string[]; fundo: "creme" | "pessego"; cor: "coral" | "verde" | "amarelo";
  layout?: { titulo: Wrapped; fonte: string };
  aviso?: string;   // um aviso discreto embaixo (ex.: "Lojas e valores ilustrativos", nas capas com telas do app)
  semFundo?: boolean;   // só para o QA: sem o fundo (creme, raios e halo), para medir onde está o conteúdo
  margem?: number;  // a margem lateral do título e dos brilhos (padrão 110; 135 = a regra das capas que valem na grade E na aba Reels)
};
type Ilustracao = "mesa" | "nao-e-app" | "entrega" | "vaga" | "fome" | "dentro" | "cesta" | "entregador" | "acompanha";

const SAFE = { x0: 110, x1: 970, y0: 300, y1: 1620 };
const SELO_Y = 372;                                     // centro do selo
const ILU = { x: 162, y: 470, w: 756, h: 600 };         // ~70% da largura, na metade de cima
const TITULO = { cy: 1330, maxH: 470, maxW: 820, sizes: [170, 156, 144, 132, 120, 110, 100, 92, 84] };

// medido em calculateMetadata (fontes carregadas): as linhas dadas, no maior tamanho em que todas cabem
export const measureCapaReel = (c: CapaReelProps) => {
  const lines = c.titulo.map((l) => l.replace(/\*/g, ""));
  const maxW = c.margem ? 1080 - 2 * c.margem : TITULO.maxW;
  const size = TITULO.sizes.find((z) => lines.length * z * 1.12 <= TITULO.maxH && lines.every((l) => fitWrap(l, W.black, maxW, [z], 1).ok)) ?? TITULO.sizes[TITULO.sizes.length - 1];
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

// 5 · Bateu a fome?: o Pertim na motinha (o personagem oficial, olhando para a câmera), com o hambúrguer e o pão de queijo
//     voando em balõezinhos e a rua tracejada
const Fome: React.FC = () => {
  const h = 430, w = (h * 300) / 254;
  return (
    <>
      <Svg abs>
        <ellipse cx="378" cy="584" rx="340" ry="14" fill="#000" opacity="0.08" />
        <rect x="0" y="548" width="756" height="30" rx="14" fill={C.cremeDeep} />
        <path d="M20 563 H736" stroke={C.coral} strokeWidth="7" strokeDasharray="34 24" strokeLinecap="round" />
        {[[30, 470, 120], [40, 410, 80], [60, 350, 100]].map(([x, y, l], i) => <path key={i} d={`M${x} ${y} H${x + l}`} stroke={C.tinta} strokeOpacity="0.25" strokeWidth="9" strokeLinecap="round" />)}
        {/* os balõezinhos dos itens */}
        <circle cx="120" cy="130" r="92" fill="#fff" stroke={C.tinta} strokeWidth="6" />
        <path d="M150 214 L178 262 L190 206 Z" fill="#fff" stroke={C.tinta} strokeWidth="6" strokeLinejoin="round" />
        <circle cx="636" cy="120" r="84" fill="#fff" stroke={C.tinta} strokeWidth="6" />
        <path d="M602 196 L578 244 L566 190 Z" fill="#fff" stroke={C.tinta} strokeWidth="6" strokeLinejoin="round" />
        <Brilho x={300} y={40} s={44} c={C.coral} /><Brilho x={470} y={70} s={34} /><Brilho x={720} y={300} s={30} />
      </Svg>
      <div style={{ position: "absolute", left: 120 - 64, top: 130 - 66 }}><BurgerIcon size={128} /></div>
      <div style={{ position: "absolute", left: 636 - 58, top: 120 - 62 }}><BreadIcon size={116} /></div>
      <div style={{ position: "absolute", left: 400 - w / 2, top: 572 - h, width: w, height: h, transform: "rotate(-4deg)", transformOrigin: "50% 95%" }}>
        <Pertim v={1} pose="moto" expr="alegre" altura={h} rig={{ olhar: [0, 0], centro: true }} />
      </div>
    </>
  );
};

// 6 · Olha ele por dentro!: o celular (genérico) com a tela do Início do app (public/telas-app/celular/Main.png, o topo) e o
//     Pertim espiando por trás dele, olhando para a câmera
const Dentro: React.FC = () => {
  const cw = 300, ch = 600, bz = 13, tw = cw - 2 * bz, th = ch - 2 * bz;
  const ph = 330, pw = (ph * 240) / 270;
  return (
    <>
      <Svg abs>
        <ellipse cx="378" cy="590" rx="250" ry="12" fill="#000" opacity="0.08" />
        <Brilho x={120} y={120} s={44} c={C.coral} /><Brilho x={650} y={90} s={36} /><Brilho x={80} y={420} s={30} />
      </Svg>
      {/* o Pertim, atrás do celular, espiando pela direita */}
      <div style={{ position: "absolute", left: 520 - pw / 2, top: 150, width: pw, height: ph, transform: "rotate(10deg)", transformOrigin: "50% 90%" }}>
        <Pertim v={1} pose="parado" expr="surpreso" altura={ph} rig={{ olhar: [0, 0], centro: true }} />
      </div>
      <div style={{ position: "absolute", left: 378 - cw / 2 - 40, top: 0, width: cw, height: ch, transform: "rotate(-6deg)" }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: cw * 0.15, background: C.tinta, boxShadow: `inset 0 0 0 4px #4A3E38, 0 24px 44px rgba(34,28,25,0.3)` }} />
        <div style={{ position: "absolute", left: bz, top: bz, width: tw, height: th, borderRadius: cw * 0.11, overflow: "hidden", background: "#FAF8F5" }}>
          <Img src={staticFile("telas-app/celular/Main.png")} style={{ width: tw, height: (tw * 4140) / 1170, maxWidth: "none" }} />
        </div>
        <div style={{ position: "absolute", left: cw / 2 - 6, top: bz + 6, width: 12, height: 12, borderRadius: "50%", background: "#0D0B0A" }} />
      </div>
      {/* a mãozinha dele segurando a borda do celular */}
      <svg width={60} height={60} viewBox="-30 -30 60 60" style={{ position: "absolute", left: 378 + cw / 2 - 40 - 30, top: 230, overflow: "visible" }}>
        <circle r={20} fill={C.coral} /><circle cx={-15} cy={-3} r={9} fill={C.coral} />
      </svg>
    </>
  );
};

// 7 · Pão de Queijo Points: o Pertim com uma cesta de pão de queijo quentinho (as duas luvas na borda da cesta), olhando
//     para a câmera, com as moedinhas de pontos e os cartões "+30" e "+20" (os da tela do programa) em volta
const PaoBola: React.FC<{ x: number; y: number; r: number }> = ({ x, y, r }) => (
  <g>
    <ellipse cx={x} cy={y + r * 0.12} rx={r} ry={r * 0.84} fill="#D7962F" />
    <ellipse cx={x} cy={y} rx={r} ry={r * 0.84} fill="#F2C063" />
    <ellipse cx={x - r * 0.32} cy={y - r * 0.34} rx={r * 0.36} ry={r * 0.18} fill="#FFE6A6" transform={`rotate(-18 ${x - r * 0.32} ${y - r * 0.34})`} />
    <circle cx={x + r * 0.3} cy={y + r * 0.1} r={r * 0.09} fill="#C47E1E" opacity={0.55} /><circle cx={x - r * 0.2} cy={y + r * 0.35} r={r * 0.07} fill="#C47E1E" opacity={0.5} />
  </g>
);
const MoedaCapa: React.FC<{ x: number; y: number; r: number; rot?: number }> = ({ x, y, r, rot = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${r / 48})`}>
    <circle r="48" fill={C.amareloDark} /><circle r="44" cy="-3" fill={C.amarelo} /><circle r="32" cy="-3" fill="none" stroke="#FFE08A" strokeWidth="5" />
    <path d="M-17 4 C-19 -11 -9 -18 0 -18 C9 -18 19 -11 17 4 C16 12 9 15 0 15 C-9 15 -16 12 -17 4 Z" fill={C.amareloDark} transform="translate(0 -3)" />
    <path d="M-17 1 C-19 -14 -9 -21 0 -21 C9 -21 19 -14 17 1 C16 9 9 12 0 12 C-9 12 -16 9 -17 1 Z" fill="#FFE08A" transform="translate(0 -3)" />
  </g>
);
const CartaoPontos: React.FC<{ x: number; y: number; txt: string; rot: number }> = ({ x, y, txt, rot }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <rect x="-82" y="-50" width="164" height="100" rx="26" fill="#000" opacity="0.08" transform="translate(0 8)" />
    <rect x="-82" y="-50" width="164" height="100" rx="26" fill="#fff" stroke={C.cremeDeep} strokeWidth="4" />
    <text x="0" y="20" textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize="58" fill={C.coral}>{txt}</text>
  </g>
);
const Cesta: React.FC = () => {
  // o Pertim acenando (viewBox das poses com braço: -20 6 280 284) com a cesta pendurada na mão esquerda (luva em 39 207)
  const ph = 470, k = ph / 284, pw = 280 * k, px = 378 - pw / 2, py = 584 - (276 - 6) * k;
  return (
    <>
      <Svg abs>
        <ellipse cx="378" cy="586" rx="250" ry="14" fill="#000" opacity="0.08" />
        <CartaoPontos x={112} y={250} txt="+30" rot={-8} />
        <CartaoPontos x={648} y={214} txt="+20" rot={7} />
        <MoedaCapa x={96} y={420} r={40} rot={-14} /><MoedaCapa x={668} y={420} r={46} rot={12} /><MoedaCapa x={600} y={60} r={30} rot={-8} /><MoedaCapa x={170} y={78} r={26} rot={10} />
        <Brilho x={300} y={40} s={40} c={C.coral} /><Brilho x={720} y={320} s={30} /><Brilho x={40} y={140} s={30} />
      </Svg>
      <div style={{ position: "absolute", left: px, top: py, width: pw, height: ph }}>
        <Pertim v={1} pose="acenando" expr="sorrindo" altura={ph} rig={{ olhar: [0, 0], centro: true, aceno: 6 }} />
      </div>
      <svg viewBox="-20 6 280 284" width={pw} height={ph} style={{ position: "absolute", left: px, top: py, overflow: "visible" }}>
        {[0, 1, 2].map((i) => <path key={i} d={`M${18 + i * 18} 186 c-6 -8 6 -12 0 -20`} stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" opacity={0.95 - i * 0.15} />)}
        <path d="M-10 222 Q39 170 88 222" stroke="#8A5427" strokeWidth="6" fill="none" strokeLinecap="round" />
        <PaoBola x={6} y={214} r={15} /><PaoBola x={72} y={214} r={15} /><PaoBola x={39} y={206} r={18} /><PaoBola x={22} y={198} r={12} /><PaoBola x={56} y={198} r={12} />
        <path d="M-18 220 H96 L88 266 Q87 272 80 272 H-2 Q-9 272 -10 266 Z" fill="#C98A4B" />
        {[234, 250].map((y) => <path key={y} d={`M${-15 + (y - 220) * 0.18} ${y} H${93 - (y - 220) * 0.18}`} stroke="#A86B33" strokeWidth="3.5" />)}
        {[6, 26, 52, 72].map((x) => <path key={x} d={`M${x} 226 L${x + (x < 39 ? 2 : -2)} 270`} stroke="#A86B33" strokeWidth="3" opacity="0.8" />)}
        <rect x="-22" y="214" width="122" height="11" rx="5.5" fill="#E0A863" />
        <rect x="2" y="238" width="74" height="19" rx="9.5" fill="#fff" opacity="0.94" />
        <text x="39" y="252" textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize="12" fill={C.coral}>+ PONTOS</text>
        {/* a luva por cima da alça (segurando) */}
        <g transform="translate(39 198) rotate(18)"><circle r="10.5" fill={C.coral} /><circle cx="-8.5" cy="-1" r="4.6" fill={C.coral} /><rect x="-8" y="-15.5" width="16" height="7" rx="3.5" fill={C.creme} /></g>
      </svg>
    </>
  );
};


// 8 · Seja entregador parceiro: o Pertim na motinha (pose "moto", olhando para a câmera), acenando com a outra mão, e a
//     sacola da entrega na garupa; a rua tracejada embaixo, uma plaquinha de pin e brilhos em volta
const SacolaCapa: React.FC = () => (
  <g>
    <path d="M30 168 Q30 150 40 150 Q50 150 50 168" stroke={C.coralDark} strokeWidth="4" fill="none" />
    <path d="M20 168 H60 L57 206 Q57 210 52 210 H28 Q23 210 23 206 Z" fill={C.coral} />
    <path d="M48 168 H60 L57 206 Q57 210 52 210 H46 Z" fill={C.coralDark} />
    <circle cx="40" cy="188" r="9.5" fill={C.creme} />
    <path d="M40 196 C40 196 34.5 190 34.5 186.5 A5.5 5.5 0 0 1 45.5 186.5 C45.5 190 40 196 40 196 Z" fill={C.coral} />
    <circle cx="40" cy="186.5" r="2" fill={C.creme} />
  </g>
);
const Entregador: React.FC = () => {
  // a pose "moto" (viewBox -24 40 300 254): o corpo vai em translate(110 108) scale(0.8) translate(-120 -120); o ombro
  // esquerdo do corpo (60, 166) fica em (62, 145); dali sai o braço do aceno, para cima
  const ph = 430, k = ph / 254, pw = 300 * k, px = 378 - pw / 2 + 20, py = 560 - (294 - 40) * k + 10;
  const vb = "-24 40 300 254";
  return (
    <>
      <Svg abs>
        <rect x="-10" y="548" width="776" height="40" rx="20" fill="#7A6B62" opacity="0.18" />
        {[40, 200, 360, 520, 680].map((x) => <rect key={x} x={x} y="563" width="90" height="10" rx="5" fill="#fff" opacity="0.7" />)}
        <Brilho x={70} y={120} s={44} c={C.coral} /><Brilho x={700} y={110} s={36} /><Brilho x={690} y={380} s={30} c={C.coral} /><Brilho x={60} y={400} s={28} />
      </Svg>
      <div style={{ position: "absolute", left: px, top: py, width: pw, height: ph }}>
        <Pertim v={1} pose="moto" expr="sorrindo" altura={ph} rig={{ olhar: [0, 0], centro: true }} />
      </div>
      <svg viewBox={vb} width={pw} height={ph} style={{ position: "absolute", left: px, top: py, overflow: "visible" }}>
        <g transform="translate(-6 10) scale(1.15) translate(-4 -30)"><SacolaCapa /></g>
        <path d="M64 146 Q30 134 14 112" stroke="#F08A00" strokeWidth="11" strokeLinecap="round" fill="none" />
        <g transform="translate(9 104) rotate(-218)"><circle r="10.5" fill={C.coral} /><circle cx="-8.5" cy="-1" r="4.6" fill={C.coral} /><rect x="-8" y="-15.5" width="16" height="7" rx="3.5" fill={C.creme} /></g>
        <g stroke={C.tinta} strokeOpacity={0.3} strokeWidth={3.5} strokeLinecap="round" fill="none"><path d="M-10 88 Q-18 100 -12 112" /><path d="M-20 82 Q-30 100 -22 118" /></g>
      </svg>
    </>
  );
};

// 9 · Cadê meu pedido?: o celular com a tela de acompanhamento (Acompanhar.png na linha do tempo: "Saiu para entrega" aceso)
//     e o Pertim espiando por trás dele, olhando para a câmera; um "?" e brilhos em volta
const Acompanha: React.FC = () => {
  const pw = 320, ph = 590, px = 150, py = 4, bz = 13, tw = pw - 2 * bz, k = tw / 1170, rola = 1020;
  const alt = 430, s = alt / 270, wP = 240 * s;
  return (
    <>
      <Svg abs>
        <ellipse cx="378" cy="590" rx="260" ry="12" fill="#000" opacity="0.08" />
        <Brilho x={110} y={110} s={42} c={C.coral} /><Brilho x={700} y={90} s={34} /><Brilho x={80} y={420} s={28} /><Brilho x={720} y={470} s={30} c={C.coral} />
      </Svg>
      {/* o Pertim atrás do celular, espiando pela direita */}
      <div style={{ position: "absolute", left: 545 - wP / 2, top: 592 - alt, width: wP, height: alt, transform: "rotate(-10deg)", transformOrigin: "50% 100%" }}>
        <Pertim v={1} pose="parado" expr="sorrindo" altura={alt} rig={{ olhar: [0, 0], centro: true }} />
      </div>
      <div style={{ position: "absolute", left: px, top: py, width: pw, height: ph, transform: "rotate(-5deg)", transformOrigin: "50% 100%" }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 46, background: C.tinta, boxShadow: "inset 0 0 0 4px #4A3E38, 0 24px 44px rgba(34,28,25,0.3)" }} />
        <div style={{ position: "absolute", left: bz, top: bz, width: tw, height: ph - 2 * bz, borderRadius: 36, overflow: "hidden", background: "#FAF8F5" }}>
          <Img src={staticFile("telas-app/celular/Acompanhar.png")} style={{ position: "absolute", left: 0, top: -rola * k, width: 1170 * k, height: 3540 * k, maxWidth: "none" }} />
          {/* o status "Saiu para entrega" aceso */}
          <div style={{ position: "absolute", left: 50 * k, top: (1408 - rola) * k, width: 1070 * k, height: 164 * k, borderRadius: 14, border: `5px solid ${C.coral}`, boxShadow: "0 0 0 6px rgba(249,178,51,0.35)" }} />
        </div>
        <div style={{ position: "absolute", left: pw / 2 - 7, top: bz + 8, width: 14, height: 14, borderRadius: "50%", background: "#0D0B0A" }} />
      </div>
      {/* o "?" */}
      <svg width={120} height={120} viewBox="-60 -60 120 120" style={{ position: "absolute", left: 640, top: 40, overflow: "visible", transform: "rotate(10deg)" }}>
        <path d="M-52 -30 Q-52 -50 -32 -50 H32 Q52 -50 52 -30 V18 Q52 38 32 38 H22 L34 58 L4 38 H-32 Q-52 38 -52 18 Z" fill={C.coralDark} transform="translate(0 6)" />
        <path d="M-52 -30 Q-52 -50 -32 -50 H32 Q52 -50 52 -30 V18 Q52 38 32 38 H22 L34 58 L4 38 H-32 Q-52 38 -52 18 Z" fill={C.coral} />
        <text x="0" y="22" textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize="76" fill="#fff">?</text>
      </svg>
    </>
  );
};

const ILUSTRACOES: Record<Ilustracao, React.FC> = { mesa: Mesa, "nao-e-app": NaoEApp, entrega: Entrega, vaga: Vaga, fome: Fome, dentro: Dentro, cesta: Cesta, entregador: Entregador, acompanha: Acompanha };

// ---------------------------------------------------------------- a capa
const TWINK: Array<[number, number]> = [[150, 470], [930, 520], [130, 1120], [950, 1100], [170, 1560], [910, 1570]];
export const CapaReel: React.FC<CapaReelProps> = ({ id, selo, numero, icone, ilustracao, fundo, cor, layout, aviso, margem, semFundo }) => {
  if (!layout) throw new Error("CapaReel: layout é medido no calculateMetadata");
  const k = COR[cor];
  const bg = fundo === "pessego"
    ? "radial-gradient(circle at 50% 38%, #FFF1E2 0%, #FBE3CC 55%, #F3CDAC 100%)"
    : `radial-gradient(circle at 50% 38%, #FFF8EE 0%, ${C.creme} 55%, #F1E3D0 100%)`;
  const Ilu = ILUSTRACOES[ilustracao];
  const t = layout.titulo, th = t.lines.length * t.size * 1.12;
  return (
    <AbsoluteFill style={{ background: semFundo ? undefined : bg, overflow: "hidden" }}>
      {!semFundo && <Sunburst frame={0} cx={540} cy={ILU.y + ILU.h / 2} color={k.raio} opacity={0.12} />}
      <Twinkles frame={14} seed={`capa-reel-${id}`} points={margem ? TWINK.map(([x, y]) => [Math.min(1080 - margem - 20, Math.max(margem + 20, x)), y] as [number, number]) : TWINK} size={34} />
      {!semFundo && <div style={{ position: "absolute", left: 540 - 400, top: ILU.y + ILU.h / 2 - 400, width: 800, height: 800, borderRadius: "50%", background: `radial-gradient(circle, ${k.halo}66 0%, ${k.halo}00 68%)` }} />}
      <div style={{ position: "absolute", top: SELO_Y - 60, left: 0, right: 0, height: 120, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Selo texto={selo} numero={numero} icone={icone} />
      </div>
      <div style={{ position: "absolute", left: ILU.x, top: ILU.y, width: ILU.w, height: ILU.h }}>
        <Ilu />
      </div>
      <div style={{ position: "absolute", top: TITULO.cy - th / 2, left: margem ?? SAFE.x0, right: margem ?? 1080 - SAFE.x1 }}>
        <Text source={layout.fonte} wrapped={t} weight={W.black} />
      </div>
      {aviso && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1568, display: "flex", justifyContent: "center" }}>
          <div style={{ fontFamily: FONT, fontWeight: W.extraBold, fontSize: 24, lineHeight: "32px", color: C.tinta, opacity: 0.6, background: "rgba(255,249,241,0.85)", borderRadius: 999, padding: "4px 18px", whiteSpace: "nowrap" }}>{aviso}</div>
        </div>
      )}
    </AbsoluteFill>
  );
};
