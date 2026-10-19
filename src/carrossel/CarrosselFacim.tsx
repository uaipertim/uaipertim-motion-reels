import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { C, FONT, W } from "../config/theme";
import { CremeBackground, DotGrid, Sunburst } from "../components/Decor";
import { Twinkles } from "../components/Particles";
import { GridIcon, PinIcon, ScooterIcon, StoreIcon } from "../components/AppIcons";
import { fitWrap, Wrapped } from "../dicionario/fit";

// CARROSSEL "FACIM, FACIM" — modelo fixo, estático (1080×1350, 4:5). Cada carrossel é só um JSON
// (carrosseis/facim/NN-tema.json); cada slide vira um PNG (scripts/carrossel.mjs).
//   capa:     chip + pergunta grande (*palavra-chave* com marcador amarelo) + "arrasta →"
//   conteudo: título curto + texto (até ~25 palavras) + ícone do tema + progresso (2/6)
//   final:    "Manda pra quem…" grande + "Segue a gente pra saber quando abrir" + logo
// Margens laterais ≥ 80 px; na capa creme (C1–C4), ≥ 114 px; na capa coral (C5 em diante), ≥ 120 px — assim nada
// encosta na borda no recorte 3:4 da grade (que corta ~34 px de cada lado).
// CAPA: "coral" (fundo coral, título branco, destaque amarelo com marcador creme, chip invertido) ou "creme" (o modelo
// antigo). Campo opcional "capa" no JSON; padrão = coral a partir do C5 e creme nos anteriores (já publicados).

export type Icone = "navegador" | "gratis" | "cadastro" | "cidade" | "categoria" | "loja" | "entrega" | "calendario";
export type Slide = { tipo: "capa" | "conteudo" | "final"; titulo: string; texto?: string; icone?: Icone };
export type Carrossel = { numero: number; chip: string; capa?: "coral" | "creme"; slides: Slide[] };
export type CarrosselProps = Carrossel & { slide: number; layout?: { titulo: Wrapped; texto?: Wrapped } };

export const SLIDE = { width: 1080, height: 1350 };
const M = 80; // margem lateral
const M_CAPA_CREME = 34 + 80; // capa creme: margem dentro do recorte 3:4
const M_CAPA_CORAL = 120; // capa coral: mínimo de 120 px de cada lado
export const capaCoral = (c: { numero: number; capa?: "coral" | "creme" }) => (c.capa ?? (c.numero >= 5 ? "coral" : "creme")) === "coral";
const CARD = { left: M, right: SLIDE.width - M, pad: 72 };

const plain = (t: string) => t.replace(/\*/g, "");
// emoji grudado na palavra anterior (NBSP): nunca fica sozinho numa linha
export const glue = (t: string) => t.replace(/ +(\p{Extended_Pictographic})/gu, "\u00A0$1");

const glueSlide = (s: Slide): Slide => ({ ...s, titulo: glue(s.titulo), texto: s.texto ? glue(s.texto) : s.texto });

// medido em calculateMetadata (fontes carregadas)
export const measureSlide = (c: Carrossel, i: number) => {
  const s = glueSlide(c.slides[i]);
  if (s.tipo === "capa") return { titulo: fitWrap(plain(s.titulo), W.black, SLIDE.width - 2 * (capaCoral(c) ? M_CAPA_CORAL : M_CAPA_CREME), [124, 114, 104, 96, 88, 80], 4) };
  if (s.tipo === "final")
    return {
      titulo: fitWrap(plain(s.titulo), W.black, SLIDE.width - 2 * M, [108, 100, 92, 84, 76], 4),
      texto: fitWrap(s.texto ?? "", W.extraBold, SLIDE.width - 2 * M, [46, 42, 38], 2),
    };
  const inner = CARD.right - CARD.left - 2 * CARD.pad;
  return {
    titulo: fitWrap(plain(s.titulo), W.black, inner, [78, 70, 64, 58], 3),
    texto: fitWrap(s.texto ?? "", W.medium, inner, [50, 46, 42, 38], 6),
  };
};

// palavras com trechos destacados entre *asteriscos*
const tokens = (t: string) => {
  let hl = false;
  return t.split(/ +/).filter(Boolean).map((tok) =>
    tok.split("*").flatMap((p, i) => {
      if (i > 0) hl = !hl;
      return p ? [{ t: p, hl }] : [];
    }),
  );
};

const Text: React.FC<{
  source: string; wrapped: Wrapped; weight: number; color?: string; align?: "center" | "left"; lineHeight?: number;
  accent?: (w: string, i: number) => string | undefined; hlColor?: string; markerColor?: string; markerShine?: boolean; markerDrop?: number;
}> = ({ source, wrapped, weight, color = C.tinta, align = "center", lineHeight = 1.12, accent, hlColor = C.coral, markerColor = C.amarelo, markerShine = true, markerDrop = 0 }) => {
  const toks = tokens(source);
  let k = 0;
  const size = wrapped.size;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: align === "center" ? "center" : "flex-start" }}>
      {wrapped.lines.map((line, li) => {
        const n = line.split(/ +/).length;
        const words = toks.slice(k, k + n);
        const base = k;
        k += n;
        return (
          <div key={li} style={{ display: "flex", whiteSpace: "nowrap", gap: size * 0.22 }}>
            {words.map((segs, wi) => (
              <span key={wi} style={{ fontFamily: FONT, fontWeight: weight, fontSize: size, lineHeight, letterSpacing: -1, color: accent?.(plain(segs.map((s) => s.t).join("")), base + wi) ?? color }}>
                {segs.map((s, si) =>
                  s.hl ? (
                    <span key={si} style={{ position: "relative", display: "inline-block", color: hlColor }}>
                      {/* marcador amarelo (mesma curva do Marker da série), esticado na largura da palavra */}
                      <svg
                        viewBox="0 0 100 20" preserveAspectRatio="none"
                        style={{ position: "absolute", left: -size * 0.08, width: `calc(100% + ${size * 0.16}px)`, bottom: size * (0.02 - markerDrop), height: size * 0.42, overflow: "visible" }}
                      >
                        <path d="M4 13 C30 9, 62 16, 96 7" stroke={markerColor} strokeWidth={size * 0.27} strokeLinecap="round" fill="none" vectorEffect="non-scaling-stroke" />
                        {markerShine && <path d="M4 10 C30 6, 62 13, 96 4" stroke="#fff" strokeOpacity={0.35} strokeWidth={size * 0.05} strokeLinecap="round" fill="none" vectorEffect="non-scaling-stroke" />}
                      </svg>
                      <span style={{ position: "relative" }}>{s.t}</span>
                    </span>
                  ) : (
                    <React.Fragment key={si}>{s.t}</React.Fragment>
                  ),
                )}
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
};

const Chip: React.FC<{ text: string; size: number; invert?: boolean }> = ({ text, size, invert }) => (
  <div
    style={{
      display: "inline-flex", alignItems: "center", gap: size * 0.4, background: invert ? C.creme : C.coral, borderRadius: size * 2,
      padding: `${size * 0.32}px ${size * 0.75}px`, boxShadow: invert ? `0 ${size * 0.16}px 0 ${C.cremeDeep}` : `0 ${size * 0.16}px 0 ${C.coralDark}`,
    }}
  >
    <svg width={size * 0.9} height={size * 0.9} viewBox="0 0 24 24">
      <path d="M13 2 L4 14 H11 L10 22 L20 9 H13 Z" fill={invert ? C.coral : C.amarelo} />
    </svg>
    <span style={{ fontFamily: FONT, fontWeight: W.black, fontSize: size, lineHeight: 1.1, color: invert ? C.coral : "#fff", letterSpacing: size * 0.05, whiteSpace: "nowrap" }}>{text}</span>
  </div>
);

// ---- ícones simples (coral/amarelo/tinta) ----
const ICON = 100;
const Svg: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg width={ICON} height={ICON} viewBox="0 0 100 100">{children}</svg>
);
const ICONS: Record<Icone, React.ReactNode> = {
  navegador: (
    <Svg>
      <rect x="26" y="8" width="48" height="84" rx="10" fill={C.coral} />
      <rect x="31" y="18" width="38" height="62" rx="4" fill="#fff" />
      <rect x="35" y="23" width="30" height="9" rx="4.5" fill={C.amarelo} />
      <path d="M41 46 a7 7 0 0 1 10 0 M49 54 a7 7 0 0 1 -10 0" stroke={C.coral} strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M44 51 L50 49" stroke={C.coral} strokeWidth="4" strokeLinecap="round" />
      <circle cx="50" cy="86" r="3" fill="#fff" />
    </Svg>
  ),
  gratis: (
    <Svg>
      <path d="M14 46 L46 14 H84 V52 L52 84 Z" fill={C.coral} />
      <circle cx="70" cy="28" r="7" fill="#fff" />
      <path d="M49 68 C34 58 32 48 38 43 C43 39 48 42 49 46 C50 42 55 39 60 43 C66 48 64 58 49 68 Z" fill={C.amarelo} />
    </Svg>
  ),
  cadastro: (
    <Svg>
      <rect x="12" y="20" width="76" height="60" rx="10" fill={C.coral} />
      <circle cx="36" cy="44" r="10" fill="#fff" />
      <path d="M22 70 C22 58 50 58 50 70 Z" fill="#fff" />
      <rect x="56" y="38" width="24" height="7" rx="3.5" fill={C.amarelo} />
      <rect x="56" y="52" width="18" height="7" rx="3.5" fill="#fff" />
    </Svg>
  ),
  calendario: (
    <Svg>
      <rect x="14" y="20" width="72" height="66" rx="10" fill={C.coral} />
      <rect x="14" y="20" width="72" height="18" rx="9" fill={C.coralDark} />
      <rect x="28" y="12" width="8" height="18" rx="4" fill={C.tinta} />
      <rect x="64" y="12" width="8" height="18" rx="4" fill={C.tinta} />
      <path d="M50 46 L55 57 L67 58 L58 66 L61 78 L50 71 L39 78 L42 66 L33 58 L45 57 Z" fill={C.amarelo} />
    </Svg>
  ),
  cidade: <PinIcon size={ICON} color={C.coral} />,
  categoria: <GridIcon size={ICON} color={C.coral} />,
  loja: <StoreIcon size={ICON} color={C.coral} />,
  entrega: <ScooterIcon size={ICON} color={C.coral} />,
};

const Logo: React.FC<{ size: number }> = ({ size }) => (
  <div style={{ width: size, height: size, filter: "drop-shadow(0 12px 18px rgba(198,58,23,0.3))" }}>
    <Img src={staticFile("img/uaipertim_logo.png")} style={{ width: "100%", height: "100%" }} />
  </div>
);

const TWINKLES: Array<[number, number]> = [[50, 520], [1030, 420], [48, 1180], [1032, 1010]];

export const CarrosselFacim: React.FC<CarrosselProps> = ({ numero, chip, capa, slides, slide, layout }) => {
  if (!layout) throw new Error("CarrosselFacim: layout é medido no calculateMetadata");
  const s = glueSlide(slides[slide]);
  const total = slides.length;
  const coral = s.tipo === "capa" && capaCoral({ numero, capa });
  const M_CAPA = coral ? M_CAPA_CORAL : M_CAPA_CREME;
  return (
    <AbsoluteFill style={{ background: coral ? C.coral : C.creme }}>
      {coral ? (
        <AbsoluteFill style={{ background: C.coral, overflow: "hidden" }}>
          <Sunburst frame={0} cx={540} cy={600} color={C.coralBg} opacity={0.5} />
          <DotGrid cols={5} rows={3} color={C.creme} style={{ left: 60, top: 70, opacity: 0.35 }} frame={0} />
          <div style={{ position: "absolute", right: -170, top: -150, width: 420, height: 420, borderRadius: "50%", border: `5px solid ${C.creme}`, opacity: 0.35 }} />
        </AbsoluteFill>
      ) : (
        <CremeBackground frame={0} rays raysCenter={[540, 600]} raysOpacity={0.1} />
      )}
      <Twinkles frame={14} seed="facim" points={TWINKLES} size={30} color={coral ? C.creme : undefined} />

      {s.tipo === "capa" && (() => {
        const h = layout.titulo.lines.length * layout.titulo.size * 1.12;
        return (
          <>
            <div style={{ position: "absolute", top: 230, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
              <Chip text={chip} size={44} invert={coral} />
            </div>
            <div style={{ position: "absolute", top: 690 - h / 2, left: M_CAPA, right: M_CAPA }}>
              <Text source={s.titulo} wrapped={layout.titulo} weight={W.black} {...(coral ? { color: "#fff", hlColor: C.amarelo, markerColor: C.creme, markerShine: false, markerDrop: 0.07 } : {})} />
            </div>
            <div
              style={{
                position: "absolute", right: M_CAPA, bottom: 150, fontFamily: FONT, fontWeight: W.extraBold, fontSize: 38,
                color: coral ? C.creme : C.tinta, opacity: coral ? 1 : 0.6, letterSpacing: 0.5,
              }}
            >
              arrasta →
            </div>
          </>
        );
      })()}

      {s.tipo === "conteudo" && (() => {
        const t = layout.titulo;
        const x = layout.texto!;
        const iconBox = 168;
        const cardH = CARD.pad + iconBox + 44 + t.lines.length * t.size * 1.1 + 20 + 14 + 28 + x.lines.length * x.size * 1.32 + CARD.pad;
        const top = (SLIDE.height - cardH) / 2 + 40;
        return (
          <>
            <div style={{ position: "absolute", top: 110, left: M }}>
              <Chip text={chip} size={30} />
            </div>
            <div
              style={{
                position: "absolute", top: 112, right: M, fontFamily: FONT, fontWeight: W.extraBold, fontSize: 34, color: C.tinta, opacity: 0.55,
                letterSpacing: 1, lineHeight: "58px",
              }}
            >
              {slide + 1}/{total}
            </div>
            <div
              style={{
                position: "absolute", top, left: CARD.left, width: CARD.right - CARD.left, background: "#fff", borderRadius: 48,
                boxShadow: `0 12px 0 ${C.cremeDeep}, 0 24px 44px rgba(34,28,25,0.10)`, padding: CARD.pad, boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  width: iconBox, height: iconBox, borderRadius: iconBox / 2, background: "#FFF1D6", display: "flex",
                  alignItems: "center", justifyContent: "center", border: `6px solid ${C.amarelo}`, boxSizing: "border-box",
                }}
              >
                <div style={{ transform: "scale(0.95)" }}>{s.icone ? ICONS[s.icone] : null}</div>
              </div>
              <div style={{ height: 44 }} />
              <Text source={s.titulo} wrapped={t} weight={W.black} align="left" lineHeight={1.1} />
              <div style={{ width: 110, height: 14, borderRadius: 7, background: C.amarelo, margin: "20px 0 28px" }} />
              <Text source={s.texto ?? ""} wrapped={x} weight={W.medium} align="left" lineHeight={1.32} color="#3A302B" />
            </div>
          </>
        );
      })()}

      {s.tipo === "final" && (() => {
        const t = layout.titulo;
        const x = layout.texto!;
        const logo = 230;
        const h = t.lines.length * t.size * 1.1 + 48 + x.lines.length * x.size * 1.25 + 90 + logo;
        const top = (SLIDE.height - h) / 2 + 20;
        return (
          <div style={{ position: "absolute", top, left: M, right: M, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Text source={s.titulo} wrapped={t} weight={W.black} lineHeight={1.1} accent={(w, i) => (i === 0 && /^manda$/i.test(w) ? C.coral : undefined)} />
            <div style={{ height: 48 }} />
            <Text source={s.texto ?? ""} wrapped={x} weight={W.extraBold} lineHeight={1.25} color="#5A4A42" />
            <div style={{ height: 90 }} />
            <Logo size={logo} />
          </div>
        );
      })()}
    </AbsoluteFill>
  );
};
