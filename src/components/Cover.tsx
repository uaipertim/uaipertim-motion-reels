import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { C, FONT, W } from "../config/theme";
import { CremeBackground } from "./Decor";
import { Twinkles } from "./Particles";
import { Marker } from "./Ui";
import { Part, PopWords } from "./Text";

// "Momento capa" da série: o quadro assentado da cena 3 do Vídeo 1 ("O UaiPertim NÃO é app.").
// Fundo creme com raios, logo circular no topo, linha de apoio e palavra de destaque com marcador amarelo.
// COVER_LAYOUT é a fonte única dos espaçamentos: a cena 3 do Vídeo 1 e as capas usam os mesmos valores.

export const COVER_LAYOUT = {
  logo: { cx: 540, cy: 560, size: 420 },
  line1: { top: 774, size: 108 },
  highlight: { top: 930, size: 300 }, // "NÃO": marcador de 660px, espessura 64, 236px abaixo do topo
  tail: { top: 1290, size: 128 },
} as const;

// brilhos amarelos do Vídeo 1 (cena 3)
const V1_TWINKLES: Array<[number, number]> = [[130, 420], [960, 520], [180, 760], [900, 300], [110, 1180], [985, 1110]];

export type CoverCardProps = {
  lead: Part[] | string; // linha 1 (tinta, Black, como "O UaiPertim")
  highlight: string; // palavra de destaque (coral, com marcador amarelo, como "NÃO")
  highlightSize?: number; // diminua para textos mais longos que "NÃO"
  markerWidth?: number; // largura do marcador (padrão: proporcional ao "NÃO")
  tail?: Part[] | string; // linha 3 opcional (como "é app.")
  twinkles?: Array<[number, number]>; // brilhos: escolha pontos que não encostem no texto
  frame?: number; // só gira os raios/pisca os brilhos; 88 = o mesmo ângulo do frame 268 do Vídeo 1
  offsetY?: number; // desce o bloco inteiro (logo + textos) sem mudar os espaçamentos entre eles
  leadSize?: number; // tamanho da linha 1 (padrão 108, como "O UaiPertim")
  highlightShift?: number; // sobe/desce só o destaque (ex.: para manter o respiro com uma linha 1 menor)
  markerDrop?: number; // desce só o marcador (ex.: para passar abaixo de uma vírgula)
};

export const CoverCard: React.FC<CoverCardProps> = ({
  lead, highlight, highlightSize = COVER_LAYOUT.highlight.size, markerWidth, tail, twinkles = V1_TWINKLES, frame = 88, offsetY = 0,
  leadSize = COVER_LAYOUT.line1.size, highlightShift = 0, markerDrop = 0,
}) => {
  const logo = { ...COVER_LAYOUT.logo, cy: COVER_LAYOUT.logo.cy + offsetY };
  const line1 = { ...COVER_LAYOUT.line1, top: COVER_LAYOUT.line1.top + offsetY };
  const tl = { ...COVER_LAYOUT.tail, top: COVER_LAYOUT.tail.top + offsetY };
  const hlTop = COVER_LAYOUT.highlight.top + offsetY + highlightShift;
  const k = highlightSize / COVER_LAYOUT.highlight.size;
  const settled = 1000; // PopWords já assentado (sem animação)
  return (
    <AbsoluteFill>
      <CremeBackground frame={frame} rays raysCenter={[logo.cx, logo.cy]} raysOpacity={0.12} />
      <Twinkles frame={frame} seed="tw3" points={twinkles} />
      {/* brilho atrás do logo */}
      <div
        style={{
          position: "absolute", left: logo.cx - 330, top: logo.cy - 330, width: 660, height: 660, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 68%)",
        }}
      />
      <div
        style={{
          position: "absolute", left: logo.cx - logo.size / 2, top: logo.cy - logo.size / 2, width: logo.size, height: logo.size,
          filter: "drop-shadow(0 18px 24px rgba(198,58,23,0.35))",
        }}
      >
        <Img src={staticFile("img/uaipertim_logo.png")} style={{ width: "100%", height: "100%" }} />
      </div>

      <div style={{ position: "absolute", top: line1.top, left: 0, right: 0 }}>
        <PopWords parts={lead} frame={settled} start={0} size={leadSize} />
      </div>
      <div style={{ position: "absolute", top: hlTop, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <div style={{ position: "relative" }}>
          <Marker
            width={markerWidth ?? 660 * k} progress={1} thickness={64 * k}
            style={{ position: "absolute", left: -20 * k, top: 236 * k + markerDrop }}
          />
          <span
            style={{
              position: "relative", fontFamily: FONT, fontWeight: W.black, fontSize: highlightSize, lineHeight: 1.05, color: C.coral,
              textShadow: `0 ${12 * k}px 0 ${C.coralDark}`, letterSpacing: -6 * k, whiteSpace: "nowrap",
            }}
          >
            {highlight}
          </span>
        </div>
      </div>
      {tail && (
        <div style={{ position: "absolute", top: tl.top, left: 0, right: 0 }}>
          <PopWords parts={tail} frame={settled} start={0} size={tl.size} />
        </div>
      )}
    </AbsoluteFill>
  );
};
