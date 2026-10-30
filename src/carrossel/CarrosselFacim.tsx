import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { C, FONT, W } from "../config/theme";
import { CremeBackground, DotGrid, Sunburst } from "../components/Decor";
import { Twinkles } from "../components/Particles";
import { GridIcon, PinIcon, ScooterIcon, StoreIcon } from "../components/AppIcons";
import { ShopChar, ShopCharKind } from "../components/Town";
import { Pertim } from "../personagem/Pertim";
import type { Expressao, Pose } from "../personagem/logica";
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

export type Icone =
  | "navegador" | "gratis" | "cadastro" | "cidade" | "categoria" | "loja" | "entrega" | "calendario"
  | "seguir" | "sino" | "check" | "dinheiro" | "lanche" | "sofa" | "duvida" | "mensagem" | "cardapio";
// no lugar do ícone, o Pertim (src/personagem, V1) numa pose da página aprovada, com lojinhas opcionais ao lado
export type PertimNoSlide = { pose: Pose; expr: Expressao; lojinhas?: ShopCharKind[] };
// quebra (opcional, na capa e no conteúdo): as linhas do título já definidas; o corpo diminui até todas caberem na margem
export type Slide = { tipo: "capa" | "conteudo" | "final"; titulo: string; texto?: string; icone?: Icone; pertim?: PertimNoSlide; quebra?: string[] };
export type Carrossel = { numero: number; chip: string; capa?: "coral" | "creme"; slides: Slide[] };
export type CarrosselProps = Carrossel & { slide: number; layout?: { titulo: Wrapped; texto?: Wrapped } };

export const SLIDE = { width: 1080, height: 1350 };
const M = 80; // margem lateral
const M_CAPA_CREME = 34 + 80; // capa creme: margem dentro do recorte 3:4
const M_CAPA_CORAL = 120; // capa coral: mínimo de 120 px de cada lado
export const capaCoral = (c: { numero: number; capa?: "coral" | "creme" }) => (c.capa ?? (c.numero >= 5 ? "coral" : "creme")) === "coral";
const CARD = { left: M, right: SLIDE.width - M, pad: 72 };

const plain = (t: string) => t.replace(/\*/g, "");
// emoji grudado na palavra anterior (NBSP): nunca fica sozinho numa linha; "pertim de você", "do Glória" e
// "no Glória" também nunca se separam
export const glue = (t: string) =>
  t
    .replace(/ +(\p{Extended_Pictographic})/gu, "\u00A0$1")
    .replace(/(\*?pertim) +(de) +(você)/giu, "$1\u00A0$2\u00A0$3")
    .replace(/\b([dn]o) +(\*?Glória)/gu, "$1\u00A0$2");

const glueSlide = (s: Slide): Slide => ({ ...s, titulo: glue(s.titulo), texto: s.texto ? glue(s.texto) : s.texto });

// medido em calculateMetadata (fontes carregadas)
export const measureSlide = (c: Carrossel, i: number) => {
  const s = glueSlide(c.slides[i]);
  if (s.tipo === "capa") {
    const larg = SLIDE.width - 2 * (capaCoral(c) ? M_CAPA_CORAL : M_CAPA_CREME), sizes = [124, 114, 104, 96, 88, 80, 72];
    if (s.quebra?.length) {
      const lines = s.quebra.map((l) => glue(plain(l)));
      if (lines.join(" ").replace(/\u00A0/g, " ") !== plain(s.titulo).replace(/\u00A0/g, " ")) throw new Error("capa: a quebra não bate com o título");
      const size = sizes.find((z) => lines.every((l) => fitWrap(l, W.black, larg, [z], 1).ok)) ?? sizes[sizes.length - 1];
      return { titulo: { size, lines, ok: true } };
    }
    return { titulo: fitWrap(plain(s.titulo), W.black, larg, sizes, 4) };
  }
  if (s.tipo === "final")
    return {
      titulo: fitWrap(plain(s.titulo), W.black, SLIDE.width - 2 * M, [108, 100, 92, 84, 76], 4),
      texto: fitWrap(s.texto ?? "", W.extraBold, SLIDE.width - 2 * M, [46, 42, 38], 2),
    };
  const inner = CARD.right - CARD.left - 2 * CARD.pad;
  // quebra (opcional) também no título do slide de conteúdo: as linhas definidas, no maior tamanho em que todas cabem
  if (s.quebra?.length) {
    const lines = s.quebra.map((l) => glue(plain(l)));
    if (lines.join(" ").replace(/\u00A0/g, " ") !== plain(s.titulo).replace(/\u00A0/g, " ")) throw new Error(`slide ${i + 1}: a quebra não bate com o título`);
    const size = [78, 70, 64, 58].find((z) => lines.every((l) => fitWrap(l, W.black, inner, [z], 1).ok)) ?? 58;
    return { titulo: { size, lines, ok: true }, texto: fitWrap(s.texto ?? "", W.medium, inner, [50, 46, 42, 38], 6) };
  }
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

export const Text: React.FC<{
  source: string; wrapped: Wrapped; weight: number; color?: string; align?: "center" | "left"; lineHeight?: number;
  accent?: (w: string, i: number) => string | undefined; hlColor?: string; markerColor?: string; markerShine?: boolean; markerDrop?: number; lineStyle?: (li: number) => React.CSSProperties;
}> = ({ source, wrapped, weight, color = C.tinta, align = "center", lineHeight = 1.12, accent, hlColor = C.coral, markerColor = C.amarelo, markerShine = true, markerDrop = 0, lineStyle }) => {
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
          <div key={li} style={{ display: "flex", whiteSpace: "nowrap", gap: size * 0.22, ...lineStyle?.(li) }}>
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

export const Chip: React.FC<{ text: string; size: number; invert?: boolean }> = ({ text, size, invert }) => (
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
export const ICONS: Record<Icone, React.ReactNode> = {
  cardapio: (
    <Svg>
      <rect x="20" y="10" width="60" height="80" rx="10" fill={C.coral} />
      <rect x="27" y="17" width="46" height="66" rx="6" fill="#fff" />
      <rect x="35" y="25" width="30" height="9" rx="4.5" fill={C.amarelo} />
      {[44, 56, 68].map((y) => (
        <g key={y}>
          <circle cx="36" cy={y} r="3.5" fill={C.coral} />
          <rect x="43" y={y - 3} width="22" height="6" rx="3" fill={C.cremeDeep} />
        </g>
      ))}
    </Svg>
  ),
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
  // seguir: pessoinha com o "+" amarelo
  seguir: (
    <Svg>
      <circle cx="40" cy="32" r="17" fill={C.coral} />
      <path d="M10 86 C10 60 70 60 70 86 Z" fill={C.coral} />
      <circle cx="74" cy="58" r="19" fill={C.amarelo} />
      <path d="M74 48 V68 M64 58 H84" stroke="#fff" strokeWidth="7" strokeLinecap="round" />
    </Svg>
  ),
  // sino: o sininho com o badalo amarelo e o som
  sino: (
    <Svg>
      <path d="M50 14 C33 14 26 28 26 44 V60 L16 74 H84 L74 60 V44 C74 28 67 14 50 14 Z" fill={C.coral} />
      <rect x="44" y="8" width="12" height="10" rx="5" fill={C.coralDark} />
      <circle cx="50" cy="82" r="9" fill={C.amarelo} />
      <path d="M86 30 Q93 40 88 52 M14 30 Q7 40 12 52" stroke={C.amarelo} strokeWidth="6" strokeLinecap="round" fill="none" />
    </Svg>
  ),
  // check: o quadradinho marcado
  check: (
    <Svg>
      <rect x="12" y="12" width="76" height="76" rx="18" fill={C.coral} />
      <path d="M28 52 L44 68 L74 34" stroke="#fff" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="84" cy="16" r="9" fill={C.amarelo} />
    </Svg>
  ),
  // dinheiro: a nota coral com as moedas amarelas
  dinheiro: (
    <Svg>
      <rect x="8" y="22" width="76" height="46" rx="8" fill={C.coral} transform="rotate(-8 46 45)" />
      <circle cx="46" cy="45" r="12" fill="#fff" transform="rotate(-8 46 45)" />
      <ellipse cx="70" cy="80" rx="20" ry="8" fill={C.amareloDark} />
      <rect x="50" y="68" width="40" height="12" fill={C.amareloDark} />
      <ellipse cx="70" cy="68" rx="20" ry="8" fill={C.amarelo} />
      <ellipse cx="70" cy="68" rx="11" ry="4" fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="3" />
    </Svg>
  ),
  // lanche: o sanduíche
  lanche: (
    <Svg>
      <path d="M14 46 C14 22 86 22 86 46 Z" fill={C.amarelo} />
      <circle cx="38" cy="34" r="2.5" fill="#fff" /><circle cx="52" cy="30" r="2.5" fill="#fff" /><circle cx="64" cy="36" r="2.5" fill="#fff" />
      <path d="M10 52 Q20 46 30 52 T50 52 T70 52 T90 52 V58 H10 Z" fill={C.verde} />
      <rect x="12" y="58" width="76" height="12" rx="6" fill={C.coral} />
      <rect x="14" y="72" width="72" height="14" rx="7" fill={C.amareloDark} />
    </Svg>
  ),
  // sofá: coral, com a almofada amarela
  sofa: (
    <Svg>
      <rect x="20" y="28" width="60" height="34" rx="10" fill={C.coral} />
      <rect x="14" y="52" width="72" height="22" rx="8" fill={C.coralDark} />
      <rect x="6" y="42" width="18" height="36" rx="8" fill={C.coral} />
      <rect x="76" y="42" width="18" height="36" rx="8" fill={C.coral} />
      <rect x="28" y="36" width="24" height="18" rx="6" fill={C.amarelo} transform="rotate(-10 40 45)" />
      <rect x="14" y="78" width="7" height="10" rx="3" fill={C.tinta} />
      <rect x="79" y="78" width="7" height="10" rx="3" fill={C.tinta} />
    </Svg>
  ),
  // dúvida: o balão com "?"
  duvida: (
    <Svg>
      <path d="M50 12 C26 12 10 26 10 46 C10 58 16 67 26 73 L22 90 L42 78 C45 79 47 80 50 80 C74 80 90 66 90 46 C90 26 74 12 50 12 Z" fill={C.coral} />
      <path d="M40 36 C40 26 60 26 60 37 C60 45 50 46 50 54" stroke="#fff" strokeWidth="8" strokeLinecap="round" fill="none" />
      <circle cx="50" cy="66" r="5" fill={C.amarelo} />
    </Svg>
  ),
  // mensagem: o envelope com o coraçãozinho
  mensagem: (
    <Svg>
      <rect x="10" y="24" width="80" height="56" rx="10" fill={C.coral} />
      <path d="M14 30 L50 56 L86 30" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M78 20 C70 14 64 22 70 28 L78 34 L86 28 C92 22 86 14 78 20 Z" fill={C.amarelo} />
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

// o Pertim no cartão (no lugar do ícone): de pé no chãozinho creme, com as lojinhas atrás quando a pose pede
const PERTIM_BOX = 390;
const PertimCena: React.FC<{ p: PertimNoSlide; largura: number }> = ({ p, largura }) => {
  const moto = p.pose === "moto";
  const vb = moto ? [300, 254] : p.pose === "parado" ? [240, 270] : [280, 284];
  const altura = moto ? 360 : 400;
  const w = (altura * vb[0]) / vb[1];
  const lojas = p.lojinhas ?? [];
  const cx = lojas.length ? largura * 0.36 : largura / 2;
  return (
    <div style={{ position: "relative", width: largura, height: PERTIM_BOX }}>
      <div style={{ position: "absolute", left: "12%", right: "12%", bottom: 6, height: 26, borderRadius: "50%", background: "#F3E4CC" }} />
      {lojas.map((k, i) => {
        const lw = 170, lx = largura * 0.6 + i * 128 - (lojas.length - 1) * 30, base = PERTIM_BOX - 14 - (i % 2) * 12;
        return (
          <div key={k} style={{ position: "absolute", left: lx - lw / 2, top: base - lw * 1.28 }}>
            <ShopChar kind={k} width={lw} mood="happy" look={[-0.6, 0.2]} lit={0.9} awning={0.3} />
          </div>
        );
      })}
      <div style={{ position: "absolute", left: cx - w / 2, top: PERTIM_BOX - altura * (moto ? 0.944 : p.pose === "parado" ? 0.951 : 0.947) - 18 }}>
        <Pertim v={1} pose={p.pose} expr={p.expr} altura={altura} rig={{ centro: true }} />
      </div>
    </div>
  );
};

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
        const iconBox = s.pertim ? PERTIM_BOX : 168;
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
              {s.pertim ? <PertimCena p={s.pertim} largura={CARD.right - CARD.left - 2 * CARD.pad} /> : (
                <div
                  style={{
                    width: iconBox, height: iconBox, borderRadius: iconBox / 2, background: "#FFF1D6", display: "flex",
                    alignItems: "center", justifyContent: "center", border: `6px solid ${C.amarelo}`, boxSizing: "border-box",
                  }}
                >
                  <div style={{ transform: "scale(0.95)" }}>{s.icone ? ICONS[s.icone] : null}</div>
                </div>
              )}
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
            <Text source={s.titulo} wrapped={t} weight={W.black} lineHeight={1.1} accent={(w, i) => (i === 0 && /^(manda|marca)$/i.test(w) ? C.coral : undefined)} />
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
