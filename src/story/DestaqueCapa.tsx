import React from "react";
import { AbsoluteFill } from "remotion";
import { C } from "../config/theme";

// CAPAS DOS DESTAQUES (1080×1920): fundo coral liso e um ícone creme no centro, sem texto. O Instagram recorta a
// capa no círculo central da largura toda (1080 px): cada desenho ocupa um quadrado de 630 px (~57% do diâmetro), centrado.
// Mesmo traço nos 4: formas cheias creme com recortes coral (como os ícones do carrossel, numa cor só).

export type CapaIcone = "conheca" | "duvidas" | "lojista" | "explica-so";
const S = 630; // o ícone ocupa um quadrado de 630 px: ~57% do círculo da largura toda (1080 px), que o Instagram usa por padrão
const K = C.creme, O = C.coral;

const ICONES: Record<CapaIcone, React.ReactNode> = {
  // mãozinha acenando (o WaveHandIcon da marca, em creme)
  conheca: (
    <g>
      <path d="M16 30 Q12 22 20 20" stroke={K} strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M8 46 Q2 35 9 26" stroke={K} strokeWidth="5" strokeLinecap="round" fill="none" />
      <g transform="rotate(-14 56 60)">
        <rect x="34" y="20" width="13" height="40" rx="6.5" fill={K} />
        <rect x="48" y="12" width="13" height="46" rx="6.5" fill={K} />
        <rect x="62" y="16" width="13" height="44" rx="6.5" fill={K} />
        <rect x="76" y="26" width="12" height="36" rx="6" fill={K} />
        <path d="M32 50 H88 V66 Q88 92 62 92 Q40 92 34 74 L22 54 Q18 46 26 44 Q30 43 34 50 Z" fill={K} />
        <path d="M47.5 34 V50 M61.5 32 V50 M75.5 36 V50" stroke={O} strokeWidth="2.6" strokeLinecap="round" />
        <path d="M44 70 Q50 80 60 80" stroke={O} strokeWidth="4" strokeLinecap="round" fill="none" />
      </g>
    </g>
  ),
  // balão com "?"
  duvidas: (
    <g>
      <path d="M50 10 C25 10 8 25 8 46 C8 59 15 69 26 75 L21 93 L43 80 C45.5 80.6 47.8 81 50 81 C75 81 92 66 92 46 C92 25 75 10 50 10 Z" fill={K} />
      <path d="M38 35 C38 23 62 23 62 36 C62 46 50 47 50 56" stroke={O} strokeWidth="9" strokeLinecap="round" fill="none" />
      <circle cx="50" cy="68" r="5.5" fill={O} />
    </g>
  ),
  // lojinha: fachada com toldo
  lojista: (
    <g>
      <rect x="16" y="46" width="68" height="44" rx="4" fill={K} />
      {/* o toldo: 5 gomos creme com a barra recortada; as divisões coral marcam as listras, e um vão separa toldo e parede */}
      {Array.from({ length: 5 }).map((_, i) => (
        <path key={i} d={`M${12 + i * 15.2} 28 H${27.2 + i * 15.2} V44 A7.6 7.6 0 0 1 ${12 + i * 15.2} 44 Z`} fill={K} />
      ))}
      {Array.from({ length: 4 }).map((_, i) => (
        <path key={`d${i}`} d={`M${27.2 + i * 15.2} 31 V44`} stroke={O} strokeWidth="2.6" strokeLinecap="round" />
      ))}
      <path d="M16 51.5 H84" stroke={O} strokeWidth="3" />
      <rect x="9" y="20" width="82" height="10" rx="5" fill={K} />
      <rect x="26" y="58" width="18" height="32" rx="3" fill={O} />
      <circle cx="40" cy="75" r="2" fill={K} />
      <rect x="52" y="58" width="24" height="18" rx="3" fill={O} />
      <path d="M52 67 H76" stroke={K} strokeWidth="2.5" />
    </g>
  ),
  // motinha de entrega
  "explica-so": (
    <g>
      <rect x="6" y="20" width="34" height="30" rx="6" fill={K} />
      <path d="M6 30 H40" stroke={O} strokeWidth="4" />
      <path d="M12 56 H58 L70 40 H80 L76 46 L68 62 Q60 72 46 72 H22 Q10 72 12 56 Z" fill={K} />
      <path d="M70 40 L64 20" stroke={K} strokeWidth="7" strokeLinecap="round" />
      <path d="M57 20 H73" stroke={K} strokeWidth="7" strokeLinecap="round" />
      {[22, 76].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="78" r="13" fill={K} />
          <circle cx={cx} cy="78" r="5" fill={O} />
        </g>
      ))}
      <path d="M2 62 H-10 M4 70 H-6" stroke={K} strokeWidth="4" strokeLinecap="round" opacity="0.7" />
    </g>
  ),
};

// a caixa de cada desenho (x, y, largura, altura em unidades do desenho), para os 4 terem o mesmo tamanho visual
const CAIXA: Record<CapaIcone, [number, number, number, number]> = {
  conheca: [2, 6, 92, 92],
  duvidas: [8, 10, 84, 84],
  lojista: [7.5, 18, 85, 74],
  "explica-so": [-11, 18, 104, 75],
};

export const DestaqueCapa: React.FC<{ icone: CapaIcone }> = ({ icone }) => {
  const [x, y, w, h] = CAIXA[icone];
  const lado = Math.max(w, h);
  const vb = `${x + w / 2 - lado / 2} ${y + h / 2 - lado / 2} ${lado} ${lado}`;
  return (
  <AbsoluteFill style={{ background: C.coral, alignItems: "center", justifyContent: "center" }}>
    <svg width={S} height={S} viewBox={vb} style={{ overflow: "visible" }}>
      {ICONES[icone]}
    </svg>
  </AbsoluteFill>
  );
};
