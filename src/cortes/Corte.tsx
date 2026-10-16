import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame } from "remotion";
import { C, FONT, W } from "../config/theme";
import { pop, popOut } from "../lib/anim";
import { CremeBackground } from "../components/Decor";
import { StarPops, Twinkles } from "../components/Particles";
import { Marker } from "../components/Ui";
import { Video } from "../Video";
import { Video2 } from "../v2/Video2";
import { Video3 } from "../v3/Video3";
import { fitCover, fitWrap, Wrapped } from "../dicionario/fit";

// CORTES CURTOS: trechos dos Reels originais (as cenas são as mesmas, renderizadas de novo a partir do quadro
// "inicio" do vídeo de origem) + gancho novo no quadro 0 (vale como capa) + fecho "Manda pra quem…" com o logo.
// Cada corte é um JSON em cortes/corte-X.json; o áudio sai de audio/cortes.py (trilha/efeitos do original, -14 LUFS).
//
// Zonas seguras: gancho (capa) entre y=285 e y=1635 com no máximo 72% da largura; fecho entre x=80–940 e y=220–1480.

export type Corte = {
  id: string; // "A", "B"…
  fonte: "v1" | "v2" | "v3"; // vídeo de origem
  inicio: number; // quadro de entrada no vídeo de origem
  fim: number; // quadro de saída no vídeo de origem (exclusivo)
  gancho: string; // texto do gancho; *destaque* = coral com marcador amarelo
  ganchoTopo: number; // y do topo do bloco do gancho (dentro de 285–1635)
  ganchoDur: number; // quadros em que o gancho fica na tela antes de sair
  fecho: string; // "Manda pra quem…"
  fechoDur: number; // quadros do fecho (≥ 60 = 2 s)
  narrado?: boolean; // true = mantém a narração do original (só existe no Vídeo 3)
  painelTopo?: number; // opcional: o painel creme do gancho começa mais acima (para cobrir um título do original)
};
type Layout = { lead: Wrapped; hl: Wrapped & { widths: number[] }; fecho: Wrapped };
export type CorteProps = Corte & { layout?: Layout };

const SAFE = { left: 80, right: 940, top: 220, bottom: 1480 };
const COVER_W = 0.72 * 1080 - 18;
const SOURCES = { v1: Video, v2: Video2, v3: Video3 } as const;

const glue = (t: string) => t.replace(/ +(\p{Extended_Pictographic})/gu, " $1");
// "Mais um app? *NÃO!*" → lead "Mais um app?", destaque "NÃO!" (+ o que vier depois, ex.: emoji)
export const splitGancho = (g: string) => {
  const m = g.match(/^(.*?)\*([^*]+)\*(.*)$/);
  if (!m) return { lead: g.trim(), hl: "" };
  return { lead: m[1].trim(), hl: glue(`${m[2]}${m[3]}`.trim()) };
};

// texto antes do destaque: de preferência numa linha só (até 76 px); se não couber, até 3 linhas
const leadFit = (lead: string) => {
  const one = fitWrap(lead, W.black, COVER_W, [112, 100, 92, 84, 76], 1);
  return one.lines.length <= 1 ? one : fitWrap(lead, W.black, COVER_W, [100, 92, 84, 76], 3);
};

export const measureCorte = (c: Corte): Layout => {
  const { lead, hl } = splitGancho(c.gancho);
  return {
    lead: leadFit(lead),
    hl: fitCover(hl, COVER_W, 230), // mesmo tratamento da palavra das capas (pode ir em 2 linhas)
    fecho: fitWrap(glue(c.fecho), W.black, SAFE.right - SAFE.left, [108, 100, 92, 84, 76, 70], 4),
  };
};

const Lines: React.FC<{ w: Wrapped; color?: string; accent?: (word: string, i: number) => string | undefined; t?: number; start?: number }> = ({
  w, color = C.tinta, accent, t, start = 0,
}) => {
  let i = 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {w.lines.map((line, li) => (
        <div key={li} style={{ display: "flex", whiteSpace: "nowrap", gap: w.size * 0.2 }}>
          {line.split(" ").map((word, wi) => {
            const k = i++;
            const s = t === undefined ? 1 : pop(t, start + k);
            return (
              <span
                key={wi}
                style={{
                  display: "inline-block", fontFamily: FONT, fontWeight: W.black, fontSize: w.size, lineHeight: 1.1, letterSpacing: -1,
                  color: accent?.(word, k) ?? color, transform: `translateY(${(1 - s) * 30}px) scale(${s})`, transformOrigin: "50% 80%",
                }}
              >
                {word}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// Gancho: completo no quadro 0 (capa), num painel creme por cima da cena; pulsa de leve e sai.
const Gancho: React.FC<{ c: Corte; L: Layout }> = ({ c, L }) => {
  const t = useCurrentFrame();
  const out = popOut(t, c.ganchoDur - 8, 8);
  const pulse = 1 + 0.025 * Math.sin((2 * Math.PI * t) / 26);
  const hs = L.hl.size;
  const k = hs / 300;
  const leadH = L.lead.lines[0] ? L.lead.lines.length * L.lead.size * 1.1 : 0;
  const hlH = (L.hl.lines.length - 1) * hs * 1.07 + hs * 1.25;
  const pad = 46;
  const last = L.hl.lines.length - 1;
  return (
    <AbsoluteFill style={{ opacity: Math.max(0, out), transform: `scale(${0.85 + 0.15 * Math.max(0, out)})`, transformOrigin: `540px ${c.ganchoTopo + 200}px` }}>
      <div
        style={{
          position: "absolute", top: Math.min(c.painelTopo ?? Infinity, c.ganchoTopo - pad), left: 90, right: 90,
          height: c.ganchoTopo + leadH + hlH + pad - Math.min(c.painelTopo ?? Infinity, c.ganchoTopo - pad),
          background: C.papel, borderRadius: 56, boxShadow: `0 14px 0 ${C.cremeDeep}, 0 26px 50px rgba(34,28,25,0.18)`,
        }}
      />
      <div style={{ position: "absolute", top: c.ganchoTopo, left: 0, right: 0 }}>
        {leadH > 0 && <Lines w={L.lead} />}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", transform: `scale(${pulse})`, transformOrigin: "50% 60%" }}>
          {L.hl.lines.map((l, i) => (
            <div key={i} style={{ position: "relative", marginTop: i ? hs * 0.02 : 0 }}>
              {i === last && <Marker width={L.hl.widths[i] + 40 * k} progress={1} thickness={64 * k} style={{ position: "absolute", left: -20 * k, top: 236 * k }} />}
              <span
                style={{
                  position: "relative", fontFamily: FONT, fontWeight: W.black, fontSize: hs, lineHeight: 1.05, color: C.coral,
                  textShadow: `0 ${12 * k}px 0 ${C.coralDark}`, letterSpacing: -6 * k, whiteSpace: "nowrap",
                }}
              >
                {l}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Fecho: "Manda pra quem…" + logo pequeno, no fundo creme da série.
const Fecho: React.FC<{ c: Corte; L: Layout }> = ({ c, L }) => {
  const t = useCurrentFrame();
  const logo = 210;
  const textH = L.fecho.lines.length * L.fecho.size * 1.1;
  const groupH = textH + 80 + logo;
  const top = Math.max(SAFE.top + 60, (SAFE.top + SAFE.bottom) / 2 - groupH / 2);
  const cx = (SAFE.left + SAFE.right) / 2;
  return (
    <AbsoluteFill>
      <CremeBackground frame={t + 40} rays raysCenter={[540, 900]} raysOpacity={0.14} />
      <Twinkles frame={t} seed={`corte-${c.id}`} points={[[46, 420], [1030, 520], [40, 1200], [1035, 1300]]} />
      <div style={{ position: "absolute", top, left: SAFE.left, width: SAFE.right - SAFE.left, transform: `scale(${1 + 0.012 * Math.sin(t * 0.15)})` }}>
        <Lines w={L.fecho} t={t} start={1} accent={(w, i) => (i === 0 && /^manda$/i.test(w) ? C.coral : undefined)} />
      </div>
      <div style={{ position: "absolute", left: cx - logo / 2, top: top + textH + 80, width: logo, height: logo, transform: `scale(${pop(t, 8)})`, filter: "drop-shadow(0 12px 18px rgba(198,58,23,0.3))" }}>
        <Img src={staticFile("img/uaipertim_logo.png")} style={{ width: "100%", height: "100%" }} />
      </div>
      <StarPops frame={t} start={8} cx={cx} cy={top + textH + 80 + logo / 2} radius={170} count={7} seed={`corte-logo-${c.id}`} size={38} />
    </AbsoluteFill>
  );
};

export const CorteCurto: React.FC<CorteProps> = (props) => {
  const { layout, ...c } = props;
  if (!layout) throw new Error("CorteCurto: layout é medido no calculateMetadata");
  const Source = SOURCES[c.fonte] as React.FC<{ withAudio?: boolean }>;
  const trecho = c.fim - c.inicio;
  return (
    <AbsoluteFill style={{ background: C.creme }}>
      <Sequence durationInFrames={trecho} name={`Trecho do ${c.fonte} (${c.inicio}–${c.fim})`}>
        <Sequence from={-c.inicio}>
          <Source withAudio={false} />
        </Sequence>
      </Sequence>
      <Sequence durationInFrames={c.ganchoDur} name="Gancho (capa)">
        <Gancho c={c} L={layout} />
      </Sequence>
      <Sequence from={trecho} durationInFrames={c.fechoDur} name="Fecho">
        <Fecho c={c} L={layout} />
      </Sequence>
      <Audio src={staticFile(`audio/cortes/corte-${c.id}.wav`)} />
    </AbsoluteFill>
  );
};
