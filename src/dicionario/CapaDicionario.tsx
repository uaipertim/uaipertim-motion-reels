import React from "react";
import { AbsoluteFill } from "remotion";
import { C, FONT, W } from "../config/theme";
import { Sunburst } from "../components/Decor";
import { StarShape, Twinkles } from "../components/Particles";
import { PhoneFace } from "../components/Phone";
import { ShopChar } from "../components/Town";
import { BigWord, BookIcon, Episodio, bigWordHeight } from "./DicionarioMineiro";
import { fitCover, Wrapped } from "./fit";

// CAPAS NOVAS DO DICIONÁRIO MINEIRO (só PNG, para trocar a capa dos Reels já publicados; os vídeos não mudam).
// Cada capa: selo "DICIONÁRIO MINEIRO · #NN" (número grande) → ilustração grande → a palavra (tratamento do BigWord)
// → "cê sabe o que significa?". Tudo dentro do recorte 3:4 da grade (y 300–1620, x 110–970).
// Dados no campo "capa" de cada episodios/dicionario/NN-palavra.json: { ilustracao, fundo: creme | pessego, cor }.

export type CapaConfig = { ilustracao: Ilustracao; fundo: "creme" | "pessego"; cor: "coral" | "verde" | "amarelo" | "amarelo-verde" };
export type CapaDicionarioProps = Episodio & { capa: CapaConfig; layout?: { palavra: Wrapped & { widths: number[] } } };
type Ilustracao = "balao-uai" | "casa-loja" | "trenzinho" | "joia" | "aceno" | "espanto" | "cesta";

const WORD = { maxWidth: 0.72 * 1080 - 18, maxSize: 230, top: 1092 }; // mesmo cálculo do fitCover das capas da série
const ILU = { x: 162, y: 440, w: 756, h: 620 }; // ~70% da largura, na metade de cima
const SELO_Y = 360; // centro do selo
const APOIO_Y = 1400;

export const measureCapaDicionario = (p: CapaDicionarioProps) => ({ palavra: fitCover(p.palavra, WORD.maxWidth, WORD.maxSize) });

const COR: Record<CapaConfig["cor"], { raio: string; halo: string }> = {
  coral: { raio: C.coral, halo: C.coralLight },
  verde: { raio: C.verde, halo: C.verdeLight },
  amarelo: { raio: C.amarelo, halo: C.amareloLight },
  "amarelo-verde": { raio: C.amarelo, halo: C.verdeLight },
};

// ---------------------------------------------------------------- selo: "DICIONÁRIO MINEIRO · #07", número grande
const Selo: React.FC<{ numero: number }> = ({ numero }) => {
  const s = 36;
  return (
    <div
      style={{
        display: "inline-flex", alignItems: "center", gap: 18, background: C.coral, borderRadius: 999, padding: "10px 34px 10px 28px",
        boxShadow: `0 7px 0 ${C.coralDark}`,
      }}
    >
      <BookIcon size={s * 1.4} />
      <span style={{ fontFamily: FONT, fontWeight: W.black, fontSize: s, lineHeight: 1, color: "#fff", letterSpacing: s * 0.04, whiteSpace: "nowrap" }}>
        DICIONÁRIO MINEIRO ·
      </span>
      <span style={{ fontFamily: FONT, fontWeight: W.black, fontSize: s * 2.3, lineHeight: 1, color: C.amarelo, letterSpacing: -1, whiteSpace: "nowrap", textShadow: `0 4px 0 ${C.coralDark}` }}>
        #{String(numero).padStart(2, "0")}
      </span>
    </div>
  );
};

// ---------------------------------------------------------------- as ilustrações (coordenadas de 756 × 620)
export const Mao: React.FC<{ x: number; y: number; s: number; rot?: number; flip?: boolean }> = ({ x, y, s, rot = 0, flip }) => (
  // a mãozinha da marca (WaveHandIcon), em escala s (viewBox 100)
  <g transform={`translate(${x} ${y}) ${flip ? `translate(${100 * s} 0) scale(-1 1)` : ""} scale(${s}) rotate(${rot} 56 60)`}>
    <rect x="34" y="20" width="13" height="40" rx="6.5" fill={C.amarelo} />
    <rect x="48" y="12" width="13" height="46" rx="6.5" fill={C.amarelo} />
    <rect x="62" y="16" width="13" height="44" rx="6.5" fill={C.amarelo} />
    <rect x="76" y="26" width="12" height="36" rx="6" fill={C.amarelo} />
    <path d="M32 50 H88 V66 Q88 92 62 92 Q40 92 34 74 L22 54 Q18 46 26 44 Q30 43 34 50 Z" fill={C.amarelo} />
    <path d="M44 70 Q50 80 60 80" stroke={C.amareloDark} strokeWidth="4" strokeLinecap="round" fill="none" />
  </g>
);

const BalaoUai: React.FC = () => (
  <svg width={ILU.w} height={ILU.h} viewBox="0 0 756 620" style={{ overflow: "visible" }}>
    {/* tracinhos de surpresa */}
    {[[118, 96, -40], [70, 200, -70], [640, 92, 40], [690, 196, 70], [378, 18, 0]].map(([x, y, r], i) => (
      <rect key={i} x={x - 14} y={y - 46} width={28} height={92} rx={14} fill={C.amarelo} transform={`rotate(${r} ${x} ${y})`} />
    ))}
    <g transform="translate(0 14)"><path d="M150 110 H606 Q700 110 700 204 V396 Q700 490 606 490 H300 L170 590 L198 490 H150 Q56 490 56 396 V204 Q56 110 150 110 Z" fill={C.coralDark} /></g>
    <path d="M150 110 H606 Q700 110 700 204 V396 Q700 490 606 490 H300 L170 590 L198 490 H150 Q56 490 56 396 V204 Q56 110 150 110 Z" fill={C.coral} />
    <path d="M150 128 H600 Q676 128 680 190" stroke="#fff" strokeOpacity="0.25" strokeWidth="16" strokeLinecap="round" fill="none" />
    <text x="378" y="362" textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize="190" fill="#fff" letterSpacing="-6">Uai?!</text>
  </svg>
);

const CasaLoja: React.FC = () => (
  <>
    <svg width={ILU.w} height={ILU.h} viewBox="0 0 756 620" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <ellipse cx="378" cy="604" rx="350" ry="16" fill="#000" opacity="0.08" />
      {/* a casinha */}
      <rect x="86" y="350" width="262" height="250" rx="12" fill="#FFF3DF" />
      <path d="M60 368 L217 222 L374 368 Z" fill={C.verde} strokeLinejoin="round" />
      <rect x="60" y="358" width="314" height="22" rx="11" fill={C.verdeDark} />
      <rect x="186" y="500" width="62" height="100" rx="10" fill={C.coralDark} />
      <circle cx="236" cy="552" r="5" fill={C.amarelo} />
      {/* a setinha curtinha entre as duas */}
      <path d="M318 312 H438" stroke={C.amarelo} strokeWidth="18" strokeLinecap="round" />
      <path d="M338 290 L314 312 L338 334 M418 290 L442 312 L418 334" stroke={C.amarelo} strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* o pin em cima */}
      <g transform="translate(318 20)">
        <path d="M60 196 C60 196 6 120 6 66 A54 54 0 0 1 114 66 C114 120 60 196 60 196 Z" fill={C.coral} />
        <path d="M60 196 C82 160 114 116 114 66 A54 54 0 0 0 92 22 C100 70 84 140 60 196 Z" fill={C.coralDark} opacity="0.35" />
        <circle cx="60" cy="64" r="24" fill="#fff" />
      </g>
    </svg>
    <PhoneFace width={190} mood="happy" look={[0.5, 0]} style={{ position: "absolute", left: 122, top: 400 }} />
    <div style={{ position: "absolute", left: 398, top: 600 - 290 * 1.28 }}>
      <ShopChar kind="mercado" width={290} mood="happy" look={[-0.5, 0]} lit={0.8} awning={0.5} />
    </div>
  </>
);

const Trenzinho: React.FC = () => (
  <svg width={ILU.w} height={ILU.h} viewBox="0 0 756 620" style={{ overflow: "visible" }}>
    {/* trilhos */}
    {Array.from({ length: 13 }).map((_, i) => <rect key={i} x={10 + i * 58} y={566} width={30} height={30} rx={5} fill="#B98657" />)}
    <rect x="0" y="566" width="756" height="10" rx="5" fill={C.tinta} />
    {/* fumacinha */}
    {[[650, 190, 30], [612, 130, 40], [560, 66, 52]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity={0.9 - i * 0.15} />)}
    {/* vagão de trás: panela + chinelo */}
    <g>
      <rect x="18" y="420" width="196" height="112" rx="16" fill={C.verde} />
      <rect x="18" y="420" width="196" height="24" rx="12" fill={C.verdeDark} />
      {/* panela */}
      <rect x="40" y="342" width="96" height="74" rx="14" fill="#8C97A0" />
      <rect x="30" y="334" width="116" height="16" rx="8" fill="#6F7A84" />
      <rect x="10" y="356" width="34" height="12" rx="6" fill="#6F7A84" />
      <circle cx="88" cy="326" r="9" fill="#6F7A84" />
      {/* chinelo */}
      <g transform="rotate(-24 176 380)">
        <ellipse cx="176" cy="380" rx="26" ry="58" fill={C.amarelo} />
        <path d="M154 388 Q166 360 176 342 Q186 360 198 388" stroke={C.coral} strokeWidth="9" strokeLinecap="round" fill="none" />
      </g>
    </g>
    <rect x="212" y="490" width="40" height="12" rx="6" fill={C.tinta} />
    {/* vagão do meio: queijo + controle remoto */}
    <g>
      <rect x="248" y="420" width="196" height="112" rx="16" fill={C.coral} />
      <rect x="248" y="420" width="196" height="24" rx="12" fill={C.coralDark} />
      {/* queijo */}
      <path d="M262 414 L262 350 L350 322 L350 414 Z" fill="#F3D98E" />
      <path d="M262 350 L350 322 L376 340 L288 368 Z" fill="#FFF1C4" />
      <path d="M350 322 L376 340 V414 H350 Z" fill="#E7C66F" />
      <circle cx="290" cy="384" r="8" fill="#E7C66F" /><circle cx="324" cy="398" r="6" fill="#E7C66F" />
      {/* controle remoto */}
      <g transform="rotate(14 404 360)">
        <rect x="380" y="300" width="50" height="122" rx="14" fill={C.tinta} />
        <circle cx="405" cy="326" r="9" fill={C.coral} />
        {[350, 372, 394].map((y) => [394, 416].map((x) => <circle key={`${x}${y}`} cx={x} cy={y} r="6" fill="#C9BFB4" />))}
      </g>
    </g>
    <rect x="442" y="490" width="40" height="12" rx="6" fill={C.tinta} />
    {/* a locomotiva (amarela), com olhinhos */}
    <g>
      <rect x="476" y="322" width="226" height="210" rx="26" fill={C.amarelo} />
      <rect x="476" y="236" width="122" height="120" rx="18" fill={C.coral} />
      <rect x="498" y="262" width="78" height="62" rx="12" fill="#FFF1D6" />
      <rect x="626" y="236" width="40" height="92" rx="10" fill={C.tinta} />
      <rect x="616" y="224" width="60" height="22" rx="11" fill={C.tinta} />
      <path d="M702 470 L742 532 H702 Z" fill={C.coralDark} />
      <rect x="476" y="440" width="226" height="22" fill={C.amareloDark} />
      {/* olhos */}
      {[620, 670].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy="380" rx="20" ry="25" fill="#fff" stroke={C.tinta} strokeWidth="5" />
          <circle cx={x + 5} cy="384" r="10" fill={C.tinta} /><circle cx={x + 1} cy="378" r="3.5" fill="#fff" />
        </g>
      ))}
      <path d="M622 418 Q646 436 670 418" stroke={C.tinta} strokeWidth="6" strokeLinecap="round" fill="none" />
    </g>
    {/* rodas */}
    {[62, 170, 292, 400, 530, 650].map((x) => (
      <g key={x}>
        <circle cx={x} cy={538} r={x > 500 ? 36 : 28} fill={C.tinta} />
        <circle cx={x} cy={538} r={x > 500 ? 13 : 10} fill={C.cremeDark} />
      </g>
    ))}
  </svg>
);

const Joia: React.FC = () => (
  <svg width={ILU.w} height={ILU.h} viewBox="0 0 756 620" style={{ overflow: "visible" }}>
    {/* a manga e a mão fechada com o polegar pra cima */}
    <rect x="150" y="500" width="250" height="120" rx="26" fill={C.coral} />
    <rect x="150" y="500" width="250" height="26" rx="13" fill={C.coralDark} />
    <rect x="186" y="74" width="104" height="270" rx="52" fill={C.amarelo} />
    <rect x="126" y="254" width="330" height="268" rx="70" fill={C.amarelo} />
    {[300, 362, 424].map((y) => <path key={y} d={`M300 ${y} H446`} stroke={C.amareloDark} strokeWidth="8" strokeLinecap="round" />)}
    <path d="M300 268 Q300 300 300 470" stroke={C.amareloDark} strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.6" />
    <path d="M214 120 Q226 100 252 104" stroke="#FFE8A8" strokeWidth="12" strokeLinecap="round" fill="none" />
    {/* o check verde */}
    <circle cx="594" cy="262" r="132" fill={C.verdeDark} transform="translate(0 10)" />
    <circle cx="594" cy="262" r="132" fill={C.verde} />
    <path d="M528 266 L578 316 L664 216" stroke="#fff" strokeWidth="30" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* brilhinhos */}
    {[[80, 120, 44], [700, 470, 38], [500, 520, 30]].map(([x, y, s], i) => (
      <path key={i} transform={`translate(${x - s / 2} ${y - s / 2}) scale(${s / 100})`} d="M50 4 C54 34 66 46 96 50 C66 54 54 66 50 96 C46 66 34 54 4 50 C34 46 46 34 50 4 Z" fill={i ? C.amarelo : C.coral} />
    ))}
  </svg>
);

const Aceno: React.FC = () => (
  <svg width={ILU.w} height={ILU.h} viewBox="0 0 756 620" style={{ overflow: "visible" }}>
    {/* tracinhos de movimento */}
    {[[90, 230, -30], [60, 330, -10], [96, 430, 12]].map(([x, y, r], i) => (
      <path key={i} d={`M${x} ${y} q-30 -40 0 -80`} stroke={C.verde} strokeWidth="16" strokeLinecap="round" fill="none" transform={`rotate(${r} ${x} ${y})`} />
    ))}
    <Mao x={40} y={130} s={4.6} rot={-14} />
    {/* o balão "Ô, sô!" */}
    <g transform="translate(410 40)">
      <path d="M40 0 H290 Q330 0 330 40 V140 Q330 180 290 180 H120 L60 236 L76 180 H40 Q0 180 0 140 V40 Q0 0 40 0 Z" fill={C.verdeDark} transform="translate(0 9)" />
      <path d="M40 0 H290 Q330 0 330 40 V140 Q330 180 290 180 H120 L60 236 L76 180 H40 Q0 180 0 140 V40 Q0 0 40 0 Z" fill={C.verde} />
      <text x="165" y="118" textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize="84" fill="#fff" letterSpacing="-2">Ô, sô!</text>
    </g>
  </svg>
);

const Espanto: React.FC = () => {
  const w = 380, h = w * 1.28, x0 = (ILU.w - w) / 2, y0 = ILU.h - h - 10;
  return (
    <>
      <svg width={ILU.w} height={ILU.h} viewBox="0 0 756 620" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <ellipse cx="378" cy="606" rx="260" ry="14" fill="#000" opacity="0.08" />
        {/* tracinhos de espanto */}
        {[[150, 160, -40], [110, 270, -70], [606, 160, 40], [646, 270, 70]].map(([x, y, r], i) => (
          <rect key={i} x={x - 12} y={y - 40} width={24} height={80} rx={12} fill={C.coral} transform={`rotate(${r} ${x} ${y})`} />
        ))}
      </svg>
      <div style={{ position: "absolute", left: x0, top: y0 }}>
        <ShopChar kind="restaurante" width={w} mood="surprised" eyeScale={1.35} lit={0.9} awning={0.3} />
      </div>
      {/* as mãos no rosto */}
      <svg width={ILU.w} height={ILU.h} viewBox="0 0 756 620" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <Mao x={x0 - 34} y={y0 + h * 0.5} s={1.5} rot={22} flip />
        <Mao x={x0 + w - 116} y={y0 + h * 0.5} s={1.5} rot={-22} />
      </svg>
      {[[60, 70, 70, C.amarelo], [690, 60, 60, C.coral], [700, 420, 46, C.amarelo], [40, 430, 50, C.coral], [378, -10, 44, C.amarelo]].map(([x, y, s, c], i) => (
        <div key={i} style={{ position: "absolute", left: (x as number) - (s as number) / 2, top: (y as number) - (s as number) / 2 }}><StarShape size={s as number} color={c as string} /></div>
      ))}
    </>
  );
};

const Cesta: React.FC = () => (
  <svg width={ILU.w} height={ILU.h} viewBox="0 0 756 620" style={{ overflow: "visible" }}>
    <ellipse cx="378" cy="604" rx="350" ry="16" fill="#000" opacity="0.08" />
    {/* a alça */}
    <path d="M110 330 C110 110 470 110 470 330" stroke="#B9824A" strokeWidth="30" fill="none" strokeLinecap="round" />
    {/* as quitandas (sobem acima da borda da cesta) */}
    <g transform="translate(0 -46)">
    <rect x="128" y="250" width="132" height="120" rx="12" fill="#E9B872" transform="rotate(-14 194 310)" />
    <path d="M128 250 L260 250 L260 286 L128 286 Z" fill="#F7DEB0" transform="rotate(-14 194 310)" />
    <rect x="128" y="286" width="132" height="12" fill={C.coral} opacity="0.8" transform="rotate(-14 194 310)" />
    <circle cx="300" cy="300" r="56" fill="#C98A4B" /><circle cx="300" cy="300" r="22" fill="#FFF3E6" />
    <circle cx="300" cy="300" r="56" fill="none" stroke="#A86B33" strokeWidth="6" strokeDasharray="10 12" />
    {[[380, 300], [420, 330], [356, 340], [400, 270]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="30" fill="#F2C27A" stroke="#D8973F" strokeWidth="5" />)}
    {[[180, 330], [240, 340]].map(([x, y], i) => (
      <g key={i}><circle cx={x} cy={y} r="40" fill="#E2A15C" /><circle cx={x} cy={y} r="40" fill="none" stroke="#B9824A" strokeWidth="5" />{[[-12, -8], [10, 6], [-4, 14], [12, -14]].map(([dx, dy], k) => <circle key={k} cx={x + dx} cy={y + dy} r="4" fill="#8A4A1C" />)}</g>
    ))}
    </g>
    {/* a cesta de palha */}
    <path d="M80 340 H500 L460 580 H120 Z" fill={C.amareloDark} />
    {[380, 420, 460, 500, 540].map((y) => <path key={y} d={`M${80 + (y - 340) / 6} ${y} H${500 - (y - 340) / 6}`} stroke="#C97C14" strokeWidth="6" />)}
    {[130, 180, 230, 280, 330, 380, 430].map((x) => <path key={x} d={`M${x + 10} 344 L${x + 10 + (290 - x) / 12} 576`} stroke="#F7C35A" strokeWidth="8" opacity="0.7" />)}
    <rect x="70" y="326" width="440" height="30" rx="15" fill="#C97C14" />
    {/* a xícara de café fumegando */}
    <g transform="translate(520 330)">
      {[0, 1, 2].map((i) => <path key={i} d={`M${60 + i * 36} 40 C${44 + i * 36} 0 ${86 + i * 36} -30 ${66 + i * 36} -80`} stroke="#B7A79A" strokeWidth="12" strokeLinecap="round" fill="none" opacity="0.8" />)}
      <ellipse cx="100" cy="240" rx="116" ry="22" fill={C.cremeDeep} />
      <ellipse cx="100" cy="232" rx="110" ry="20" fill="#fff" />
      <path d="M190 120 C246 120 246 196 186 196" stroke="#fff" strokeWidth="22" fill="none" />
      <path d="M22 70 H178 Q174 226 100 226 Q26 226 22 70 Z" fill="#fff" />
      <path d="M24 104 H176 L172 128 H28 Z" fill={C.coral} />
      <ellipse cx="100" cy="72" rx="78" ry="14" fill="#6B3A1E" />
    </g>
  </svg>
);

const ILUSTRACOES: Record<Ilustracao, React.FC> = {
  "balao-uai": BalaoUai, "casa-loja": CasaLoja, trenzinho: Trenzinho, joia: Joia, aceno: Aceno, espanto: Espanto, cesta: Cesta,
};

// ---------------------------------------------------------------- a capa
const TWINK: Array<[number, number]> = [[150, 470], [930, 520], [130, 1180], [950, 1150], [200, 1540], [880, 1560]];
export const CapaDicionario: React.FC<CapaDicionarioProps> = ({ numero, capa, layout }) => {
  if (!layout) throw new Error("CapaDicionario: layout é medido no calculateMetadata");
  const cor = COR[capa.cor];
  const bg = capa.fundo === "pessego"
    ? "radial-gradient(circle at 50% 38%, #FFF1E2 0%, #FBE3CC 55%, #F3CDAC 100%)"
    : `radial-gradient(circle at 50% 38%, #FFF8EE 0%, ${C.creme} 55%, #F1E3D0 100%)`;
  const Ilu = ILUSTRACOES[capa.ilustracao];
  const pw = layout.palavra;
  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <Sunburst frame={0} cx={540} cy={ILU.y + ILU.h / 2} color={cor.raio} opacity={0.12} />
      <Twinkles frame={14} seed={`capa-dic-${numero}`} points={TWINK} size={34} />
      {/* halo atrás da ilustração */}
      <div style={{ position: "absolute", left: 540 - 380, top: ILU.y + ILU.h / 2 - 380, width: 760, height: 760, borderRadius: "50%", background: `radial-gradient(circle, ${cor.halo}66 0%, ${cor.halo}00 68%)` }} />
      <div style={{ position: "absolute", top: SELO_Y - 50, left: 0, right: 0, height: 100, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Selo numero={numero} />
      </div>
      <div style={{ position: "absolute", left: ILU.x, top: ILU.y, width: ILU.w, height: ILU.h }}>
        <Ilu />
      </div>
      <div style={{ position: "absolute", top: WORD.top + (WORD.maxSize * 1.256 - bigWordHeight(pw.lines.length, pw.size)) / 2, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <BigWord lines={pw.lines} size={pw.size} widths={pw.widths} />
      </div>
      <div style={{ position: "absolute", top: APOIO_Y, left: 0, right: 0, textAlign: "center", fontFamily: FONT, fontWeight: W.medium, fontSize: 56, color: C.tinta, letterSpacing: -0.5 }}>
        cê sabe o que significa?
      </div>
    </AbsoluteFill>
  );
};
