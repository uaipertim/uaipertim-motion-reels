import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, FONT, W } from "../config/theme";
import { CremeBackground } from "../components/Decor";
import { Twinkles } from "../components/Particles";
import { Chip, ICONS, Icone, Text, glue } from "../carrossel/CarrosselFacim";
import { fitWrap, Wrapped } from "../dicionario/fit";

// STORIES DE DESTAQUE — modelo genérico por JSON (stories/destaques/<nome>.json). Cada card é um MP4 de 6 s
// (30 fps, 180 quadros) e um PNG do quadro final (scripts/destaque.mjs).
//   fundo creme com raios de sol (o mesmo do Story "Conheça") · ícone num círculo · chip opcional · título · texto
//   rodapé discreto: logo oficial pequena + "Tudo pertim de você." (sem @)
// Tudo entra até 1,2 s (36 quadros) e fica parado o resto; só o fundo (raios, brilhos) segue vivo.
// Zona segura do story: conteúdo entre y 250 e 1600, x 80–1000. Cada card se explica sozinho (o destaque pode
// abrir em qualquer um), por isso não tem "1/4" nem "arrasta".

export type DestaqueCard = { titulo: string; texto: string; chip?: string; icone?: Icone };
export type Destaque = { nome: string; trilha?: boolean; cards: DestaqueCard[] };
export type DestaqueProps = Destaque & { card: number; layout?: { titulo: Wrapped; texto: Wrapped } };

export const STORY = { width: 1080, height: 1920, fps: 30, frames: 180 };
export const ZONA = { x0: 80, x1: 1000, y0: 250, y1: 1600 };
const TW = 880; // largura do título e do texto (x 100–980)
const ICON_BOX = 300;
const FOOT_Y = 1470; // o rodapé: logo + frase, até y ~1560
const ENTRA = 36; // tudo parado a partir daqui (1,2 s)

const plain = (t: string) => t.replace(/\*/g, "");

export const measureDestaque = (d: Destaque, i: number) => {
  const c = d.cards[i];
  return {
    titulo: fitWrap(glue(plain(c.titulo)), W.black, TW, [112, 104, 96, 88, 80, 72], 3),
    texto: fitWrap(glue(c.texto), W.extraBold, TW, [58, 54, 50, 46], 4),
  };
};

// a altura do bloco central (para centrar entre o topo da zona segura e o rodapé)
const blockHeight = (c: DestaqueCard, l: { titulo: Wrapped; texto: Wrapped }) =>
  (c.chip ? 92 + 44 : 0) + (c.icone ? ICON_BOX + 64 : 0) + l.titulo.lines.length * l.titulo.size * 1.1 + 44 + l.texto.lines.length * l.texto.size * 1.3;

// entrada: sobe 40 px e aparece, com um leve "back"; termina exatamente em start + dur
const enter = (f: number, start: number, dur = 12) => interpolate(f, [start, start + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.6)) });
const fade = (f: number, start: number, dur = 12) => interpolate(f, [start, start + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const TWINKLES: Array<[number, number]> = [[120, 330], [960, 420], [110, 1300], [970, 1220]];

export const StoryDestaque: React.FC<DestaqueProps> = ({ cards, card, layout, trilha = true }) => {
  if (!layout) throw new Error("StoryDestaque: layout é medido no calculateMetadata");
  const f = useCurrentFrame();
  const c = cards[card];
  const t = layout.titulo, x = layout.texto;
  const h = blockHeight(c, layout);
  const top = ZONA.y0 + (FOOT_Y - 40 - ZONA.y0 - h) / 2;
  const nT = t.lines.length, nX = x.lines.length;
  // horários (quadros): chip 0 · ícone 2 · título 8 + 4/linha · texto 16 + 3/linha · rodapé 12 — tudo termina até 36
  const tLine = (li: number) => enter(f, 8 + 4 * li, 12);
  const xLine = (li: number) => fade(f, 16 + 3 * li, 12);
  const iconE = enter(f, 2, 16);
  const chipE = enter(f, 0, 12);
  const footE = fade(f, 12, 14);
  if (8 + 4 * (nT - 1) + 12 > ENTRA || 16 + 3 * (nX - 1) + 12 > ENTRA) throw new Error("StoryDestaque: texto longo demais para entrar até 1,2 s");
  let y = top;
  const chipY = y;
  if (c.chip) y += 92 + 44;
  const iconY = y;
  if (c.icone) y += ICON_BOX + 64;
  const titleY = y;
  y += nT * t.size * 1.1 + 44;
  const textY = y;
  return (
    <AbsoluteFill style={{ background: C.creme }}>
      <CremeBackground frame={f} rays raysCenter={[540, iconY + ICON_BOX / 2]} raysOpacity={0.12} />
      <Twinkles frame={f} seed={`destaque${card}`} points={TWINKLES} size={34} />

      {c.chip && (
        <div style={{ position: "absolute", top: chipY, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: chipE, transform: `translateY(${(1 - chipE) * 30}px) scale(${0.85 + 0.15 * chipE})` }}>
          <Chip text={c.chip} size={46} />
        </div>
      )}

      {c.icone && (
        <div
          style={{
            position: "absolute", top: iconY, left: 540 - ICON_BOX / 2, width: ICON_BOX, height: ICON_BOX, borderRadius: "50%", background: "#FFF1D6",
            border: `10px solid ${C.amarelo}`, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 14px 0 ${C.cremeDeep}`, opacity: Math.min(1, iconE * 1.5), transform: `scale(${0.6 + 0.4 * iconE})`,
          }}
        >
          <div style={{ transform: "scale(1.75)" }}>{ICONS[c.icone]}</div>
        </div>
      )}

      <div style={{ position: "absolute", top: titleY, left: 100, right: 100 }}>
        <Text
          source={glue(c.titulo)} wrapped={t} weight={W.black} lineHeight={1.1}
          lineStyle={(li) => ({ opacity: Math.min(1, tLine(li) * 1.4), transform: `translateY(${(1 - tLine(li)) * 40}px)` })}
        />
      </div>
      <div style={{ position: "absolute", top: textY, left: 100, right: 100 }}>
        <Text
          source={glue(c.texto)} wrapped={x} weight={W.extraBold} lineHeight={1.3} color="#5A4A42"
          lineStyle={(li) => ({ opacity: xLine(li), transform: `translateY(${(1 - xLine(li)) * 24}px)` })}
        />
      </div>

      {/* rodapé discreto: a logo oficial (o arquivo) + a frase da marca, sem @ */}
      <div style={{ position: "absolute", top: FOOT_Y, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 20, opacity: footE }}>
        <Img src={staticFile("img/uaipertim_logo.png")} style={{ width: 86, height: 86, filter: "drop-shadow(0 6px 10px rgba(198,58,23,0.25))" }} />
        <span style={{ fontFamily: FONT, fontWeight: W.extraBold, fontSize: 40, color: C.tinta, letterSpacing: -0.5 }}>
          Tudo <span style={{ color: C.coral }}>pertim de você.</span>
        </span>
      </div>
      {trilha && <Audio src={staticFile("audio/destaques/trilha.wav")} />}
    </AbsoluteFill>
  );
};
