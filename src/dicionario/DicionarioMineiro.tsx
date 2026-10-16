import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, FONT, W } from "../config/theme";
import { clamp, pop, popOut, wiggle } from "../lib/anim";
import { CremeBackground } from "../components/Decor";
import { StarPops, Twinkles } from "../components/Particles";
import { Marker } from "../components/Ui";
import { SHOP_RATIO, ShopChar, ShopCharKind } from "../components/Town";
import { fitCover, fitWrap, Wrapped } from "./fit";

// DICIONÁRIO MINEIRO — modelo fixo da série. Cada episódio é só um JSON (episodios/dicionario/NN-palavra.json);
// os tempos das cenas vêm da voz (public/audio/dicionario/NN/timing.json, gerado por audio/dicionario.py)
// e os tamanhos de texto são medidos em calculateMetadata (Root.tsx → dicionarioMetadata).
//
//   capa (quadro 0 completo) → significado + balão com o exemplo → ponte com a UaiPertim → CTA + logo pequeno
//
// Zonas seguras: capa entre y=285 e y=1635 com a palavra em até 72% da largura (recortes 3:4 e 4:5);
// demais cenas com texto entre x=80 e x=940 e entre y=220 e y=1480 (fora da legenda e dos botões do Instagram).

export type Episodio = { numero: number; palavra: string; significado: string; exemplo: string; ponte: string; cta: string };
type Span = { from: number; duration: number };
export type Timing = {
  fps: number;
  durationInFrames: number;
  scenes: { capa: Span; significado: Span; ponte: Span; cta: Span };
  beats: { balloon: number };
  speech: Array<{ id: string; scene: string; from: number; to: number }>;
};
export type Layout = {
  capa: Wrapped & { widths: number[] };
  header: Wrapped;
  significado: Wrapped;
  exemplo: Wrapped;
  ponte: Wrapped;
  cta: Wrapped;
  // posições (y) calculadas para cada episódio ocupar a zona segura inteira, de y=220 a y=1480
  sig: { headerTop: number; cardTop: number; cardH: number; balloonTop: number; exH: number; shopTop: number };
  pon: { textTop: number; shopTop: number };
};
export type DicionarioProps = Episodio & { timing?: Timing; layout?: Layout };

const SAFE = { left: 80, right: 940, top: 220, bottom: 1480 };
const CX = (SAFE.left + SAFE.right) / 2; // centro da coluna de texto (cenas 2–4)
const COVER = { top: 285, bottom: 1635, maxWidth: 0.72 * 1080 - 18, maxSize: 300 };
const CONTENT_TOP = SAFE.top + 110; // abaixo do selo do topo
const CHIP_BOTTOM = SAFE.top + 12 + 32 * 1.1 + 2 * 32 * 0.32; // fim do selo pequeno das cenas 2–4
// cena do significado: lojinha grande ancorada no pé da zona segura; o balão sai dela, à direita
const SIG = { cardPad: 56, label: 34, shopW: 300, balloonLeft: 380, balloonPad: 40, balloonOverlap: 200, minGap: 32, maxGap: 120 };
const BALLOON = { left: SIG.balloonLeft, right: SAFE.right, pad: SIG.balloonPad };
const SHOP_W = SIG.shopW;
// cena da ponte: 3 lojinhas ocupando a largura da zona (x 80–940), ancoradas embaixo
const PON = { shopW: 250, step: 305 };
// TROCA DE CENA: a cena seguinte entra OVERLAP quadros antes do corte. O TEXTO da cena que sai some primeiro
// (até 3 quadros antes do corte) e o texto da que entra só começa depois disso (TEXT_IN): nunca há texto
// sobre texto. Os objetos (card, balão, lojinhas) da cena que sai ficam até o corte: nunca há quadro vazio.
const OVERLAP = 5;
const TEXT_IN = OVERLAP - 3;
const textOut = (t: number, dur: number) => interpolate(t, [dur - OVERLAP - 1, dur - 3], [1, 0], clamp);
const objOut = (t: number, dur: number) => popOut(t, dur - 2, 2);
const SHOPS: ShopCharKind[] = ["padaria", "mercado", "farmacia", "pet", "restaurante", "bebidas", "lanchonete", "hortifruti"];

export const nn = (n: number) => String(n).padStart(2, "0");

// texto do CTA na tela: aspas tipográficas e emoji grudado na palavra anterior (não fica sozinho numa linha)
export const ctaText = (cta: string) => cta.replace(/'([^']+)'/g, "‘$1’").replace(/ (\p{Extended_Pictographic})/gu, "\u00A0$1");

// tamanhos e posições medidos (em calculateMetadata, com as fontes carregadas): o conteúdo cresce até
// preencher a zona segura (y=220 a y=1480), sem passar dela
const W_COL = SAFE.right - SAFE.left;
export const measureLayout = (ep: Episodio): Layout => {
  // --- significado: selo → palavra → card → balão (ao lado da lojinha) → lojinha no pé da zona
  const shopTop = SAFE.bottom - SIG.shopW * SHOP_RATIO;
  const exemplo = fitWrap(`“${ep.exemplo}”`, W.black, BALLOON.right - BALLOON.left - 2 * BALLOON.pad, [70, 66, 62, 58, 54, 50, 46], 4);
  const exH = exemplo.lines.length * exemplo.size * 1.12 + 2 * BALLOON.pad;
  const balloonTop = shopTop + SIG.balloonOverlap - exH;
  const cardH = (w: Wrapped) => 2 * SIG.cardPad + SIG.label * 1.2 + 14 + w.lines.length * w.size * 1.14;
  // par (palavra, significado) mais equilibrado que cabe: maximiza o MENOR dos dois tamanhos relativos.
  // A palavra é medida com o espaçamento das capas (fitCover) e nunca passa da largura da zona (x 80–940).
  const headerH = (h: Wrapped) => (h.lines.length - 1) * h.size * 1.07 + h.size * 1.1;
  const combos: Array<[number, number]> = [];
  for (const hs of [190, 170, 150, 130, 112, 96]) for (const ss of [84, 80, 76, 72, 66, 60, 54]) combos.push([hs, ss]);
  const score = ([hs, ss]: [number, number]) => Math.min(hs / 190, ss / 84) + 0.01 * (hs / 190 + ss / 84);
  combos.sort((a, b) => score(b) - score(a));
  let header: Wrapped = fitCover(ep.palavra, W_COL, 96);
  let significado = fitWrap(ep.significado, W.extraBold, W_COL - 2 * SIG.cardPad, [54], 3);
  for (const [hs, ss] of combos) {
    const h = fitCover(ep.palavra, W_COL, hs);
    if (h.size < hs) continue; // a palavra não cabe neste tamanho
    const sg = fitWrap(ep.significado, W.extraBold, W_COL - 2 * SIG.cardPad, [ss], 3);
    if (sg.lines.length > 3) continue;
    if (CHIP_BOTTOM + 3 * SIG.minGap + headerH(h) + cardH(sg) <= balloonTop) {
      header = h;
      significado = sg;
      break;
    }
  }
  const gap = Math.min(SIG.maxGap, (balloonTop - CHIP_BOTTOM - headerH(header) - cardH(significado)) / 3);
  const headerTop = CHIP_BOTTOM + gap;
  const cardTop = headerTop + headerH(header) + gap;
  // --- ponte: texto grande centrado entre o selo e as lojinhas, que ficam no pé da zona
  const ponShopTop = SAFE.bottom - PON.shopW * SHOP_RATIO;
  const room = ponShopTop - 60 - (CHIP_BOTTOM + 40);
  let ponte = fitWrap(ep.ponte, W.black, W_COL, [60], 6);
  for (const size of [124, 116, 108, 100, 92, 84, 76, 70, 64]) {
    const w = fitWrap(ep.ponte, W.black, W_COL, [size], 5);
    if (w.lines.length <= 5 && w.lines.length * size * 1.12 <= room) {
      ponte = w;
      break;
    }
  }
  const ponH = ponte.lines.length * ponte.size * 1.12;
  return {
    capa: fitCover(ep.palavra, COVER.maxWidth, COVER.maxSize),
    header,
    significado,
    exemplo,
    ponte,
    cta: fitWrap(ctaText(ep.cta), W.black, W_COL, [108, 100, 92, 84, 76, 70], 4),
    sig: { headerTop, cardTop, cardH: cardH(significado), balloonTop, exH, shopTop },
    pon: { textTop: (CHIP_BOTTOM + 40 + ponShopTop - 60) / 2 - ponH / 2, shopTop: ponShopTop },
  };
};

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");

// Linhas de texto com as palavras pipocando; `accent` decide a cor de cada palavra.
const Lines: React.FC<{
  wrapped: Wrapped; t: number; start: number; weight: number; color?: string; stagger?: number; lineHeight?: number;
  accent?: (word: string) => string | undefined; align?: "center" | "left"; shadow?: string;
}> = ({ wrapped, t, start, weight, color = C.tinta, stagger = 2, lineHeight = 1.12, accent, align = "center", shadow }) => {
  let i = 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: align === "center" ? "center" : "flex-start" }}>
      {wrapped.lines.map((line, li) => (
        <div key={li} style={{ display: "flex", justifyContent: align === "center" ? "center" : "flex-start", whiteSpace: "nowrap" }}>
          {line.split(" ").map((w, wi) => {
            // cada palavra anima JÁ na posição final: só aparece (fade) e sobe um pouco; sem escala, sem mexer
            // na horizontal e sem mudar o espaçamento → nenhuma palavra encosta na outra em quadro nenhum
            const at = start + i++ * stagger;
            const rise = pop(t, at, { damping: 14, stiffness: 160 });
            const fade = interpolate(t, [at, at + 3], [0, 1], clamp);
            return (
              <span
                key={wi}
                style={{
                  display: "inline-block", fontFamily: FONT, fontWeight: weight, fontSize: wrapped.size, lineHeight,
                  color: accent?.(w) ?? color, letterSpacing: -1, marginRight: wi < line.split(" ").length - 1 ? wrapped.size * 0.2 : 0,
                  transform: `translateY(${(1 - rise) * 26}px)`, opacity: fade, textShadow: shadow,
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

const BookIcon: React.FC<{ size: number; color?: string }> = ({ size, color = "#fff" }) => (
  <svg width={size} height={size * 0.78} viewBox="0 0 100 78">
    <path d="M50 14 C38 4 18 4 4 8 L4 70 C18 66 38 66 50 76 Z" fill={color} />
    <path d="M50 14 C62 4 82 4 96 8 L96 70 C82 66 62 66 50 76 Z" fill={color} opacity={0.82} />
    <path d="M50 14 L50 76" stroke={C.coral} strokeWidth="4" />
  </svg>
);

// Selo da série: "DICIONÁRIO MINEIRO #N"
const Chip: React.FC<{ numero: number; size: number }> = ({ numero, size }) => (
  <div
    style={{
      display: "inline-flex", alignItems: "center", gap: size * 0.35, background: C.coral, borderRadius: size * 2,
      padding: `${size * 0.32}px ${size * 0.7}px`, boxShadow: `0 ${size * 0.16}px 0 ${C.coralDark}`,
    }}
  >
    <BookIcon size={size * 1.15} />
    <span style={{ fontFamily: FONT, fontWeight: W.black, fontSize: size, lineHeight: 1.1, color: "#fff", letterSpacing: size * 0.04, whiteSpace: "nowrap" }}>
      DICIONÁRIO MINEIRO <span style={{ color: C.amarelo }}>#{numero}</span>
    </span>
  </div>
);

// palavra-título com o mesmo tratamento das capas (coral, sombra coral escura, marcador amarelo)
const BigWord: React.FC<{ lines: string[]; size: number; widths?: number[] }> = ({ lines, size, widths }) => {
  const k = size / 300;
  const last = lines.length - 1;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {lines.map((l, i) => (
        <div key={i} style={{ position: "relative", marginTop: i ? size * 0.02 : 0 }}>
          {widths && i === last && (
            <Marker
              width={widths[i] + 40 * k} progress={1} thickness={64 * k}
              style={{ position: "absolute", left: -20 * k, top: 236 * k }}
            />
          )}
          <span
            style={{
              position: "relative", fontFamily: FONT, fontWeight: W.black, fontSize: size, lineHeight: 1.05, color: C.coral,
              textShadow: `0 ${12 * k}px 0 ${C.coralDark}`, letterSpacing: -6 * k, whiteSpace: "nowrap",
            }}
          >
            {l}
          </span>
        </div>
      ))}
    </div>
  );
};

// altura do bloco da palavra (do topo da 1ª linha até o fim do marcador)
const bigWordHeight = (lines: number, size: number) => (lines - 1) * size * 1.07 + size * (236 / 300) + 64 * (size / 300) * 2.2;

// ---------------- CENA 1 · CAPA (quadro 0 já completo) ----------------
const Capa: React.FC<{ ep: Episodio; L: Layout; dur: number }> = ({ ep, L, dur }) => {
  const t = useCurrentFrame();
  const chipH = 46 * 1.1 + 2 * 46 * 0.32;
  const gap = 64;
  const wordH = bigWordHeight(L.capa.lines.length, L.capa.size);
  const top = (COVER.top + COVER.bottom) / 2 - (chipH + gap + wordH) / 2;
  // quique: começa em repouso no frame 0 (quadro completo) e já sai pulando; depois pulsa de leve
  const hop = 30 * Math.abs(Math.sin((Math.PI * t) / 13)) * Math.exp(-t / 26);
  const pulse = 1 + 0.03 * Math.sin((2 * Math.PI * t) / 28);
  // a capa (selo + palavra, no centro) fica até o corte: o texto que entra (cabeçalho, no topo) não a cruza
  // e o texto do card só começa no corte
  const out = interpolate(t, [dur - 4, dur], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ opacity: out, transform: `scale(${0.9 + 0.1 * out})` }}>
      <div style={{ position: "absolute", top, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <div style={{ transform: `rotate(${Math.sin(t * 0.12) * 1.5}deg)` }}>
          <Chip numero={ep.numero} size={46} />
        </div>
      </div>
      <div
        style={{
          position: "absolute", top: top + chipH + gap, left: 0, right: 0, display: "flex", justifyContent: "center",
          transform: `translateY(${-hop}px) scale(${pulse})`, transformOrigin: "50% 70%",
        }}
      >
        <BigWord lines={L.capa.lines} size={L.capa.size} widths={L.capa.widths} />
      </div>
      <StarPops frame={t} start={2} cx={540} cy={top + chipH + gap + wordH / 2} radius={L.capa.size * 1.5} count={8} seed={`dic-capa-${ep.numero}`} size={46} />
    </AbsoluteFill>
  );
};

// selo pequeno no topo das cenas 2–4
const TopChip: React.FC<{ numero: number; t: number }> = ({ numero, t }) => (
  <div style={{ position: "absolute", top: SAFE.top + 12, left: SAFE.left, right: 1080 - SAFE.right, display: "flex", justifyContent: "center" }}>
    <div style={{ transform: `scale(${pop(t, 0)})` }}>
      <Chip numero={numero} size={32} />
    </div>
  </div>
);

const TopChipSeq: React.FC<{ numero: number }> = ({ numero }) => <TopChip numero={numero} t={useCurrentFrame()} />;

// ---------------- CENA 2 · SIGNIFICADO + EXEMPLO ----------------
const Significado: React.FC<{ ep: Episodio; L: Layout; dur: number; balloonAt: number }> = ({ ep, L, dur, balloonAt }) => {
  const t = useCurrentFrame();
  const tx = textOut(t, dur);
  const ob = objOut(t, dur);
  const { headerTop, cardTop, cardH, balloonTop, exH, shopTop } = L.sig;
  const b = pop(t, balloonAt, { damping: 9, stiffness: 190 });
  const talking = t >= balloonAt && t < balloonAt + 40;
  const shopIn = pop(t, 1, { damping: 10, stiffness: 160 });
  return (
    <AbsoluteFill>
      {/* palavra (cabeçalho do verbete) */}
      <div style={{ position: "absolute", top: headerTop, left: SAFE.left, width: SAFE.right - SAFE.left, display: "flex", justifyContent: "center", transform: `scale(${pop(t, TEXT_IN)})`, opacity: tx }}>
        <BigWord lines={L.header.lines} size={L.header.size} />
      </div>
      {/* card do significado */}
      <div
        style={{
          position: "absolute", top: cardTop, left: SAFE.left, width: SAFE.right - SAFE.left, height: cardH, background: "#fff", borderRadius: 44,
          boxShadow: `0 12px 0 ${C.cremeDeep}, 0 22px 40px rgba(34,28,25,0.12)`, transform: `scale(${pop(t, 1, { damping: 11, stiffness: 170 }) * ob})`,
          padding: SIG.cardPad, boxSizing: "border-box",
        }}
      >
        <div style={{ opacity: tx * interpolate(t, [TEXT_IN, TEXT_IN + 3], [0, 1], clamp) }}>
          <div style={{ fontFamily: FONT, fontWeight: W.black, fontSize: SIG.label, letterSpacing: 3, color: C.coral, lineHeight: `${SIG.label * 1.2}px`, marginBottom: 14 }}>
            SIGNIFICADO
          </div>
        </div>
        <div style={{ opacity: tx }}>
          <Lines wrapped={L.significado} t={t} start={TEXT_IN + 3} weight={W.extraBold} align="left" lineHeight={1.14} stagger={1} />
        </div>
      </div>
      {/* balão de fala com o exemplo, saindo da lojinha */}
      <div
        style={{
          position: "absolute", top: balloonTop, left: BALLOON.left, width: BALLOON.right - BALLOON.left, height: exH,
          transform: `scale(${b * ob})`, transformOrigin: "0% 100%", opacity: t >= balloonAt ? 1 : 0,
        }}
      >
        <svg width={BALLOON.right - BALLOON.left} height={exH + 40} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <path d={`M30 ${exH - 70} L-46 ${exH + 6} L60 ${exH - 4} Z`} fill={C.amareloDark} transform="translate(0 8)" />
          <rect x={0} y={8} width={BALLOON.right - BALLOON.left} height={exH} rx={40} fill={C.amareloDark} />
          <path d={`M30 ${exH - 70} L-46 ${exH + 6} L60 ${exH - 4} Z`} fill={C.amarelo} />
          <rect x={0} y={0} width={BALLOON.right - BALLOON.left} height={exH} rx={40} fill={C.amarelo} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: `0 ${BALLOON.pad}px`, opacity: tx }}>
          <Lines wrapped={L.exemplo} t={t} start={balloonAt + 2} weight={W.black} stagger={1} />
        </div>
      </div>
      {/* lojinha falando */}
      <div
        style={{
          position: "absolute", left: SAFE.left, top: shopTop, width: SHOP_W,
          transform: `translateY(${-(talking ? Math.abs(Math.sin((t - balloonAt) * 0.5)) * 10 : 0)}px) scale(${shopIn * ob})`, transformOrigin: "50% 100%",
        }}
      >
        <ShopChar
          kind={SHOPS[(ep.numero - 1) % SHOPS.length]} width={SHOP_W} mood="happy" look={[0.6, -0.4]} blink={(t + 9) % 70 < 4 ? 0.9 : 0}
          lit={0.8} awning={talking ? 0.5 + 0.5 * Math.sin((t - balloonAt) * 0.5) : 0.3} signSwing={wiggle(t, balloonAt, 8, 0.5, 0.08)}
        />
      </div>
    </AbsoluteFill>
  );
};

// ---------------- CENA 3 · PONTE COM A UAIPERTIM ----------------
const Ponte: React.FC<{ ep: Episodio; L: Layout; dur: number }> = ({ ep, L, dur }) => {
  const t = useCurrentFrame();
  const tx = textOut(t, dur);
  const ob = objOut(t, dur);
  const key = norm(ep.palavra);
  const accent = (w: string) => (norm(w) === "uaipertim" || (key.length > 1 && norm(w) === key) ? C.coral : undefined);
  const { textTop, shopTop } = L.pon;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: textTop, left: SAFE.left, width: SAFE.right - SAFE.left, opacity: tx }}>
        <Lines wrapped={L.ponte} t={t} start={TEXT_IN} weight={W.black} accent={accent} stagger={2} />
      </div>
      {/* lojinhas da cidade acendendo */}
      {(["padaria", "mercado", "farmacia"] as ShopCharKind[]).map((k, i) => {
        const at = 1 + i * 3;
        const s = pop(t, at, { damping: 9, stiffness: 170 });
        const lit = interpolate(t, [at + 10, at + 18], [0.15, 1], clamp);
        const wave = Math.sin((t - at) * 0.3 + i);
        return (
          <div
            key={k}
            style={{
              position: "absolute", left: CX - PON.shopW / 2 + (i - 1) * PON.step, top: shopTop, width: PON.shopW,
              transform: `translateY(${-Math.max(0, wave) * 6}px) scale(${s * ob})`, transformOrigin: "50% 100%",
            }}
          >
            <ShopChar kind={k} width={PON.shopW} mood="happy" look={[0, -0.2]} lit={lit} glow={lit > 0.9 ? 0.4 : 0} awning={0.4 + 0.3 * wave} bulbs={lit} bulbPhase={t + i * 5} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------- CENA 4 · CTA + LOGO PEQUENO ----------------
const Cta: React.FC<{ ep: Episodio; L: Layout }> = ({ ep, L }) => {
  const t = useCurrentFrame();
  const quoted = new Set((ep.cta.match(/'([^']+)'/g) ?? []).flatMap((q) => q.replace(/'/g, "").split(/\s+/).map(norm)));
  const accent = (w: string) => (/^manda$/i.test(w) || quoted.has(norm(w)) ? C.coral : undefined);
  const logo = 210;
  const textH = L.cta.lines.length * L.cta.size * 1.1;
  const groupH = textH + 80 + logo;
  const textTop = Math.max(CONTENT_TOP, (CONTENT_TOP + SAFE.bottom) / 2 - groupH / 2);
  const logoTop = Math.min(SAFE.bottom - logo, textTop + textH + 80);
  const breathe = 1 + 0.015 * Math.sin(t * 0.15);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: textTop, left: SAFE.left, width: SAFE.right - SAFE.left, transform: `scale(${breathe})` }}>
        <Lines wrapped={L.cta} t={t} start={TEXT_IN} weight={W.black} accent={accent} stagger={1} lineHeight={1.1} />
      </div>
      <div
        style={{
          position: "absolute", left: CX - logo / 2, top: logoTop, width: logo, height: logo, transform: `scale(${pop(t, 8, { damping: 9, stiffness: 170 })})`,
          filter: "drop-shadow(0 12px 18px rgba(198,58,23,0.3))",
        }}
      >
        <Img src={staticFile("img/uaipertim_logo.png")} style={{ width: "100%", height: "100%" }} />
      </div>
      <StarPops frame={t} start={8} cx={CX} cy={logoTop + logo / 2} radius={170} count={7} seed={`dic-logo-${ep.numero}`} size={38} />
    </AbsoluteFill>
  );
};

const TWINKLES: Array<[number, number]> = [[46, 330], [1030, 420], [40, 1000], [1035, 1120], [130, 1580], [960, 1610], [560, 1700]];

export const DicionarioMineiro: React.FC<DicionarioProps> = (props) => {
  const f = useCurrentFrame();
  const { timing, layout, ...ep } = props;
  if (!timing || !layout) throw new Error("DicionarioMineiro: rode audio/dicionario.py para gerar o timing do episódio");
  const S = timing.scenes;
  return (
    <AbsoluteFill style={{ background: C.creme }}>
      <CremeBackground frame={f + 88} rays raysCenter={[540, 900]} raysOpacity={0.14} />
      <Twinkles frame={f} seed="dic" points={TWINKLES} />
      <Sequence from={S.capa.from} durationInFrames={S.capa.duration} name="Capa">
        <Capa ep={ep} L={layout} dur={S.capa.duration} />
      </Sequence>
      {/* a cena seguinte entra OVERLAP quadros antes do corte, enquanto a anterior sai: nunca há quadro só com o fundo */}
      <Sequence from={S.significado.from - OVERLAP} durationInFrames={S.significado.duration + OVERLAP} name="Significado + exemplo">
        <Significado ep={ep} L={layout} dur={S.significado.duration + OVERLAP} balloonAt={timing.beats.balloon - S.significado.from + OVERLAP} />
      </Sequence>
      <Sequence from={S.ponte.from - OVERLAP} durationInFrames={S.ponte.duration + OVERLAP} name="Ponte">
        <Ponte ep={ep} L={layout} dur={S.ponte.duration + OVERLAP} />
      </Sequence>
      <Sequence from={S.cta.from - OVERLAP} durationInFrames={S.cta.duration + OVERLAP} name="CTA">
        <Cta ep={ep} L={layout} />
      </Sequence>
      <Sequence from={S.significado.from - OVERLAP} name="Selo (cenas 2–4)">
        <TopChipSeq numero={ep.numero} />
      </Sequence>
      <Audio src={staticFile(`audio/dicionario/${nn(ep.numero)}/mix.wav`)} />
    </AbsoluteFill>
  );
};
