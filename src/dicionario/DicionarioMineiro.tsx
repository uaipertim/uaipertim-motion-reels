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
};
export type DicionarioProps = Episodio & { timing?: Timing; layout?: Layout };

const SAFE = { left: 80, right: 940, top: 220, bottom: 1480 };
const CX = (SAFE.left + SAFE.right) / 2; // centro da coluna de texto (cenas 2–4)
const COVER = { top: 285, bottom: 1635, maxWidth: 0.72 * 1080 - 18, maxSize: 300 };
const CONTENT_TOP = SAFE.top + 110; // abaixo do selo do topo
const CARD_PAD = 48;
const BALLOON = { left: 210, right: SAFE.right, pad: 38 };
const SHOP_W = 210;
const SHOPS: ShopCharKind[] = ["padaria", "mercado", "farmacia", "pet", "restaurante", "bebidas", "lanchonete", "hortifruti"];

export const nn = (n: number) => String(n).padStart(2, "0");

// texto do CTA na tela: aspas tipográficas e emoji grudado na palavra anterior (não fica sozinho numa linha)
export const ctaText = (cta: string) => cta.replace(/'([^']+)'/g, "‘$1’").replace(/ (\p{Extended_Pictographic})/gu, "\u00A0$1");

// tamanhos medidos (em calculateMetadata, com as fontes carregadas)
export const measureLayout = (ep: Episodio): Layout => ({
  capa: fitCover(ep.palavra, COVER.maxWidth, COVER.maxSize),
  header: fitWrap(ep.palavra, W.black, SAFE.right - SAFE.left, [150, 130, 112, 96], 1),
  significado: fitWrap(ep.significado, W.extraBold, SAFE.right - SAFE.left - 2 * CARD_PAD, [72, 66, 60, 54, 50], 3),
  exemplo: fitWrap(`“${ep.exemplo}”`, W.black, BALLOON.right - BALLOON.left - 2 * BALLOON.pad, [62, 56, 50, 46], 3),
  ponte: fitWrap(ep.ponte, W.black, SAFE.right - SAFE.left, [96, 88, 80, 72, 66, 60], 5),
  cta: fitWrap(ctaText(ep.cta), W.black, SAFE.right - SAFE.left, [108, 100, 92, 84, 76, 70], 4),
});

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
            const s = pop(t, start + i++ * stagger);
            return (
              <span
                key={wi}
                style={{
                  display: "inline-block", fontFamily: FONT, fontWeight: weight, fontSize: wrapped.size, lineHeight,
                  color: accent?.(w) ?? color, letterSpacing: -1, marginRight: wi < line.split(" ").length - 1 ? wrapped.size * 0.2 : 0,
                  transform: `translateY(${(1 - s) * 30}px) scale(${s})`, transformOrigin: "50% 80%", textShadow: shadow,
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
  const out = popOut(t, dur - 6, 6);
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

// ---------------- CENA 2 · SIGNIFICADO + EXEMPLO ----------------
const Significado: React.FC<{ ep: Episodio; L: Layout; dur: number; balloonAt: number }> = ({ ep, L, dur, balloonAt }) => {
  const t = useCurrentFrame();
  const out = popOut(t, dur - 5, 5);
  const headerTop = SAFE.top + 100;
  const cardTop = headerTop + L.header.size * 1.05 + 70;
  const sigH = L.significado.lines.length * L.significado.size * 1.14;
  const cardH = CARD_PAD + 40 + 12 + sigH + CARD_PAD;
  const exH = L.exemplo.lines.length * L.exemplo.size * 1.12 + 2 * BALLOON.pad;
  const shopTop = SAFE.bottom - SHOP_W * SHOP_RATIO;
  const balloonTop = Math.max(cardTop + cardH + 46, shopTop - 34 - exH);
  const b = pop(t, balloonAt, { damping: 9, stiffness: 190 });
  const talking = t >= balloonAt && t < balloonAt + 40;
  const shopIn = pop(t, 4, { damping: 10, stiffness: 160 });
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <TopChip numero={ep.numero} t={t} />
      {/* palavra (cabeçalho do verbete) */}
      <div style={{ position: "absolute", top: headerTop, left: SAFE.left, width: SAFE.right - SAFE.left, display: "flex", justifyContent: "center", transform: `scale(${pop(t, 1)})` }}>
        <BigWord lines={L.header.lines} size={L.header.size} />
      </div>
      {/* card do significado */}
      <div
        style={{
          position: "absolute", top: cardTop, left: SAFE.left, width: SAFE.right - SAFE.left, height: cardH, background: "#fff", borderRadius: 44,
          boxShadow: `0 12px 0 ${C.cremeDeep}, 0 22px 40px rgba(34,28,25,0.12)`, transform: `scale(${pop(t, 3, { damping: 11, stiffness: 170 })})`,
          padding: CARD_PAD, boxSizing: "border-box",
        }}
      >
        <div style={{ fontFamily: FONT, fontWeight: W.black, fontSize: 32, letterSpacing: 3, color: C.coral, lineHeight: "40px", marginBottom: 12 }}>
          SIGNIFICADO
        </div>
        <Lines wrapped={L.significado} t={t} start={6} weight={W.extraBold} align="left" lineHeight={1.14} stagger={1} />
      </div>
      {/* balão de fala com o exemplo, saindo da lojinha */}
      <div
        style={{
          position: "absolute", top: balloonTop, left: BALLOON.left, width: BALLOON.right - BALLOON.left, height: exH,
          transform: `scale(${b})`, transformOrigin: "12% 100%", opacity: t >= balloonAt ? 1 : 0,
        }}
      >
        <svg width={BALLOON.right - BALLOON.left} height={exH + 40} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <path d={`M60 ${exH - 6} L28 ${exH + 38} L118 ${exH - 6} Z`} fill={C.amareloDark} transform="translate(0 8)" />
          <rect x={0} y={8} width={BALLOON.right - BALLOON.left} height={exH} rx={40} fill={C.amareloDark} />
          <path d={`M60 ${exH - 6} L28 ${exH + 38} L118 ${exH - 6} Z`} fill={C.amarelo} />
          <rect x={0} y={0} width={BALLOON.right - BALLOON.left} height={exH} rx={40} fill={C.amarelo} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: `0 ${BALLOON.pad}px` }}>
          <Lines wrapped={L.exemplo} t={t} start={balloonAt + 2} weight={W.black} stagger={1} />
        </div>
      </div>
      {/* lojinha falando */}
      <div
        style={{
          position: "absolute", left: SAFE.left, top: shopTop, width: SHOP_W,
          transform: `translateY(${(1 - shopIn) * 300 - (talking ? Math.abs(Math.sin((t - balloonAt) * 0.5)) * 10 : 0)}px)`,
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
  const out = popOut(t, dur - 5, 5);
  const key = norm(ep.palavra);
  const accent = (w: string) => (norm(w) === "uaipertim" || (key.length > 1 && norm(w) === key) ? C.coral : undefined);
  const textH = L.ponte.lines.length * L.ponte.size * 1.12;
  const groupH = textH + 90 + 190 * SHOP_RATIO;
  const textTop = Math.max(CONTENT_TOP, (CONTENT_TOP + SAFE.bottom) / 2 - groupH / 2);
  const shopTop = Math.min(SAFE.bottom - 190 * SHOP_RATIO, textTop + textH + 90);
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <TopChip numero={ep.numero} t={t} />
      <div style={{ position: "absolute", top: textTop, left: SAFE.left, width: SAFE.right - SAFE.left }}>
        <Lines wrapped={L.ponte} t={t} start={2} weight={W.black} accent={accent} stagger={2} />
      </div>
      {/* lojinhas da cidade acendendo */}
      {(["padaria", "mercado", "farmacia"] as ShopCharKind[]).map((k, i) => {
        const at = 6 + i * 4;
        const s = pop(t, at, { damping: 9, stiffness: 170 });
        const lit = interpolate(t, [at + 10, at + 18], [0.15, 1], clamp);
        const wave = Math.sin((t - at) * 0.3 + i);
        return (
          <div
            key={k}
            style={{
              position: "absolute", left: CX - 95 + (i - 1) * 270, top: shopTop, width: 190,
              transform: `translateY(${(1 - s) * 260 - Math.max(0, wave) * 6}px)`,
            }}
          >
            <ShopChar kind={k} width={190} mood="happy" look={[0, -0.2]} lit={lit} glow={lit > 0.9 ? 0.4 : 0} awning={0.4 + 0.3 * wave} bulbs={lit} bulbPhase={t + i * 5} />
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
      <TopChip numero={ep.numero} t={t} />
      <div style={{ position: "absolute", top: textTop, left: SAFE.left, width: SAFE.right - SAFE.left, transform: `scale(${breathe})` }}>
        <Lines wrapped={L.cta} t={t} start={1} weight={W.black} accent={accent} stagger={1} lineHeight={1.1} />
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
      <Sequence from={S.significado.from} durationInFrames={S.significado.duration} name="Significado + exemplo">
        <Significado ep={ep} L={layout} dur={S.significado.duration} balloonAt={timing.beats.balloon - S.significado.from} />
      </Sequence>
      <Sequence from={S.ponte.from} durationInFrames={S.ponte.duration} name="Ponte">
        <Ponte ep={ep} L={layout} dur={S.ponte.duration} />
      </Sequence>
      <Sequence from={S.cta.from} durationInFrames={S.cta.duration} name="CTA">
        <Cta ep={ep} L={layout} />
      </Sequence>
      <Audio src={staticFile(`audio/dicionario/${nn(ep.numero)}/mix.wav`)} />
    </AbsoluteFill>
  );
};
