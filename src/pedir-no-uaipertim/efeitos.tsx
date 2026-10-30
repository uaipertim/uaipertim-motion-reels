import React from "react";
import { Img, random, staticFile } from "remotion";
import { C, FONT, W } from "../config/theme";
import { MarcaPin } from "../personagem/Pertim";

// Os elementos gráficos do Reel "Pedir no UaiPertim é assim": tudo é função do tempo (segundos), sem estado.

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const outBack = (x: number, s = 1.9) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2));
export const outCubic = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
export const inCubic = (x: number) => Math.pow(clamp01(x), 3);
export const inOut = (x: number) => { const u = clamp01(x); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
// sobe com mola de 0 a 1 em `dur` segundos a partir de t0
export const mola = (t: number, t0: number, dur = 0.4, s = 1.9) => outBack((t - t0) / dur, s);
export const asset = (p: string) => staticFile(`pedir-no-uaipertim/${p}`);

// linhas de velocidade: traços que atravessam uma região na direção `ang` (graus), com força 0..1
export const LinhasVelocidade: React.FC<{ t: number; forca: number; ang?: number; caixa?: [number, number, number, number]; n?: number; seed: string; cor?: string }> = ({
  t, forca, ang = 0, caixa = [0, 0, 1080, 1920], n = 18, seed, cor = C.tinta,
}) => {
  if (forca <= 0.01) return null;
  const [x0, y0, x1, y1] = caixa;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, L = Math.hypot(x1 - x0, y1 - y0);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none", opacity: Math.min(1, forca) }}>
      <g transform={`rotate(${ang} ${cx} ${cy})`}>
        {Array.from({ length: n }).map((_, i) => {
          const r = (k: string) => random(`${seed}-${i}-${k}`);
          const comp = 120 + r("c") * 260;
          const y = cy - L / 2 + r("y") * L;
          const vel = 2600 + r("v") * 1800;
          const x = cx - L / 2 + (((r("x") * L + t * vel) % (L + comp)) - comp);
          return <line key={i} x1={x} y1={y} x2={x + comp} y2={y} stroke={cor} strokeOpacity={0.16 + 0.22 * r("o")} strokeWidth={4 + r("w") * 7} strokeLinecap="round" />;
        })}
      </g>
    </svg>
  );
};

// linhas de velocidade radiais (o zoom para dentro do celular)
export const LinhasRadiais: React.FC<{ t: number; forca: number; cx: number; cy: number; seed: string }> = ({ t, forca, cx, cy, seed }) => {
  if (forca <= 0.01) return null;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none", opacity: Math.min(1, forca) }}>
      {Array.from({ length: 34 }).map((_, i) => {
        const r = (k: string) => random(`${seed}-${i}-${k}`);
        const a = (i / 34) * Math.PI * 2 + r("a") * 0.15;
        const d0 = 160 + ((r("d") * 900 + t * 2400) % 900);
        const d1 = d0 + 120 + r("l") * 220;
        return <line key={i} x1={cx + Math.cos(a) * d0} y1={cy + Math.sin(a) * d0} x2={cx + Math.cos(a) * d1} y2={cy + Math.sin(a) * d1}
          stroke={i % 3 ? C.tinta : C.coral} strokeOpacity={0.3} strokeWidth={5 + r("w") * 6} strokeLinecap="round" />;
      })}
    </svg>
  );
};

// o toque: a luva do Pertim chega, aperta e solta um ripple
export const Toque: React.FC<{ t: number; t0: number; x: number; y: number }> = ({ t, t0, x, y }) => {
  const u = t - t0;
  if (u < -0.45 || u > 0.9) return null;
  const chega = outCubic((u + 0.45) / 0.4);
  const aperta = u >= 0 && u < 0.12 ? 0.86 : 1;
  const sai = clamp01((u - 0.45) / 0.3);
  const dx = (1 - chega) * 260 + sai * 220, dy = (1 - chega) * 300 + sai * 260;
  return (
    <>
      {u >= 0 && [0, 0.12].map((d, i) => {
        const k = clamp01((u - d) / 0.5);
        return k > 0 && k < 1 ? (
          <div key={i} style={{ position: "absolute", left: x - 30 - 70 * k, top: y - 30 - 70 * k, width: 60 + 140 * k, height: 60 + 140 * k, borderRadius: "50%",
            border: `${8 * (1 - k) + 2}px solid ${i ? C.amarelo : C.coral}`, opacity: 1 - k }} />
        ) : null;
      })}
      {u >= 0 && u < 0.25 && <div style={{ position: "absolute", left: x - 34, top: y - 34, width: 68, height: 68, borderRadius: "50%", background: C.amarelo, opacity: 0.45 * (1 - u / 0.25) }} />}
      <div style={{ position: "absolute", left: x + dx - 26, top: y + dy - 14, opacity: 1 - sai, transform: `scale(${aperta})`, transformOrigin: "26px 14px" }}>
        <svg width={120} height={150} viewBox="0 0 60 75" style={{ overflow: "visible", filter: "drop-shadow(0 6px 6px rgba(34,28,25,0.25))" }}>
          {/* a luva branca do Pertim, com o indicador esticado */}
          <path d="M13 4 Q13 0 17 0 Q21 0 21 4 L21 30 Q24 26 28 28 Q31 25 35 28 Q38 26 42 30 Q46 31 46 38 L46 52 Q46 66 32 70 L22 70 Q12 68 8 56 L4 44 Q2 38 7 37 Q11 37 13 42 Z"
            fill={C.branco} stroke={C.tinta} strokeWidth={3} strokeLinejoin="round" />
          <path d="M8 62 Q24 74 44 60 L44 70 Q30 78 10 72 Z" fill={C.coral} stroke={C.tinta} strokeWidth={3} strokeLinejoin="round" />
        </svg>
      </div>
    </>
  );
};

// a foto que vira adesivo: círculo com borda branca grossa, sombra e um brilho
export const Adesivo: React.FC<{ src: string; d: number; rot?: number; style?: React.CSSProperties; borda?: number }> = ({ src, d, rot = 0, style, borda }) => {
  const b = borda ?? Math.max(6, d * 0.06);
  return (
    <div style={{ position: "absolute", width: d, height: d, borderRadius: "50%", background: C.branco, padding: b, boxSizing: "border-box",
      boxShadow: "0 14px 26px rgba(34,28,25,0.28)", transform: `rotate(${rot}deg)`, ...style }}>
      <Img src={src} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", display: "block" }} />
      <div style={{ position: "absolute", left: b + d * 0.12, top: b + d * 0.08, width: d * 0.3, height: d * 0.14, borderRadius: "50%", background: "rgba(255,255,255,0.45)", transform: "rotate(-30deg)" }} />
    </div>
  );
};

// o recorte que SALTA do celular: sai do lugar dele na tela (de) e vai para o alvo (para), com mola, sombra e borda clara
export type Caixa = { x: number; y: number; w: number; h: number };
export const Recorte: React.FC<{ src: string; de: Caixa; para: Caixa; p: number; rot?: number; sombra?: number; children?: React.ReactNode; opacidade?: number }> = ({
  src, de, para, p, rot = 0, sombra = 1, children, opacidade = 1,
}) => {
  if (p <= 0) return null;
  const e = outBack(p, 1.6), m = clamp01(p);
  const x = de.x + (para.x - de.x) * e, y = de.y + (para.y - de.y) * e - Math.sin(Math.PI * m) * 60;
  const w = de.w + (para.w - de.w) * e, h = de.h + (para.h - de.h) * e;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, transform: `rotate(${rot * m}deg)`, opacity: opacidade,
      filter: `drop-shadow(0 ${18 * sombra * m}px ${22 * sombra * m}px rgba(34,28,25,${0.3 * m}))` }}>
      <Img src={asset(`recortes/${src}.png`)} style={{ width: "100%", height: "100%", display: "block" }} />
      {children}
    </div>
  );
};

// a explosão de texto ("BATEU A FOME?"): estrela amarela de pontas + texto com contorno, tremendo um pouco
export const Estouro: React.FC<{ t: number; t0: number; cx: number; cy: number; linhas: string[]; sai?: number }> = ({ t, t0, cx, cy, linhas, sai = 99 }) => {
  const u = t - t0;
  if (u < 0) return null;
  const e = outBack(u / 0.35, 2.4) * (1 - inCubic((t - sai) / 0.3));
  if (e <= 0.001) return null;
  const tremor = u < 0.5 ? Math.sin(u * 90) * 6 * (1 - u / 0.5) : 0;
  const pontas = 16;
  const pts = Array.from({ length: pontas * 2 }).map((_, i) => {
    const a = (i / (pontas * 2)) * Math.PI * 2;
    const r = i % 2 ? 300 : 410 + (i % 4 === 0 ? 40 : 0);
    return `${Math.cos(a) * r * 1.15},${Math.sin(a) * r * 0.78}`;
  }).join(" ");
  return (
    <div style={{ position: "absolute", left: cx, top: cy, transform: `translate(${tremor}px, 0) scale(${e * 0.82}) rotate(${-4 + Math.sin(u * 3) * 1.5}deg)` }}>
      <svg width={1000} height={720} viewBox="-500 -360 1000 720" style={{ position: "absolute", left: -500, top: -360, overflow: "visible" }}>
        <polygon points={pts} fill={C.amarelo} stroke={C.tinta} strokeWidth={8} strokeLinejoin="round" transform={`rotate(${u * 12})`} />
      </svg>
      <div style={{ position: "absolute", left: -480, width: 960, top: -linhas.length * 64, textAlign: "center", fontFamily: FONT, fontWeight: W.black, fontSize: 124,
        lineHeight: "128px", letterSpacing: -3, color: C.coral, WebkitTextStroke: `10px ${C.tinta}`, paintOrder: "stroke fill" }}>
        {linhas.map((l, i) => <div key={i} style={{ color: i ? C.coral : C.branco }}>{l}</div>)}
      </div>
    </div>
  );
};

// o carimbo que bate na tela
export const Carimbo: React.FC<{ t: number; t0: number; cx: number; cy: number; texto: string[]; rot?: number }> = ({ t, t0, cx, cy, texto, rot = -9 }) => {
  const u = t - t0;
  if (u < 0) return null;
  const k = u < 0.12 ? 2.6 - 1.7 * (u / 0.12) : 0.9 + 0.1 * outBack((u - 0.12) / 0.25, 3);
  const tremor = u > 0.12 && u < 0.4 ? Math.sin(u * 120) * 7 * (1 - (u - 0.12) / 0.28) : 0;
  return (
    <div style={{ position: "absolute", left: cx, top: cy, transform: `translate(-50%,-50%) translate(${tremor}px,${tremor * 0.5}px) rotate(${rot}deg) scale(${k})`, opacity: Math.min(1, u / 0.06) }}>
      {u > 0.12 && u < 0.7 && [0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2 + 0.4, d = 260 + (u - 0.12) * 260;
        return <div key={i} style={{ position: "absolute", left: Math.cos(a) * d - 20, top: Math.sin(a) * d * 0.5 - 20, width: 40, height: 40, borderRadius: "50%", background: C.cremeDeep, opacity: 0.8 * (1 - (u - 0.12) / 0.58) }} />;
      })}
      <div style={{ border: `10px solid ${C.coral}`, borderRadius: 26, padding: "14px 36px", background: "rgba(255,249,241,0.92)", boxShadow: `inset 0 0 0 6px ${C.papel}, inset 0 0 0 10px ${C.coral}`,
        fontFamily: FONT, fontWeight: W.black, color: C.coral, textAlign: "center", whiteSpace: "nowrap" }}>
        <div style={{ fontSize: 40, letterSpacing: 6, lineHeight: "48px" }}>{texto[0]}</div>
        <div style={{ fontSize: 96, letterSpacing: -2, lineHeight: "100px" }}>{texto[1]}</div>
      </div>
    </div>
  );
};

// a sacola de entrega (papel coral com a marca do pin), que engole o que cai nela e quica
export const Sacola: React.FC<{ cx: number; cy: number; w: number; quique?: number; style?: React.CSSProperties }> = ({ cx, cy, w, quique = 0, style }) => {
  const h = w * 1.05;
  const sy = 1 - 0.12 * quique, sx = 1 + 0.08 * quique;
  return (
    <div style={{ position: "absolute", left: cx - w / 2, top: cy - h / 2, width: w, height: h, transform: `scale(${sx}, ${sy})`, transformOrigin: "50% 100%", ...style }}>
      <svg width={w} height={h} viewBox="0 0 100 105" style={{ overflow: "visible", filter: "drop-shadow(0 12px 14px rgba(34,28,25,0.25))" }}>
        <path d="M30 26 Q30 6 50 6 Q70 6 70 26" stroke={C.coralDark} strokeWidth={7} fill="none" strokeLinecap="round" />
        <path d="M10 24 H90 L84 98 Q84 103 79 103 H21 Q16 103 16 98 Z" fill={C.coral} stroke={C.tinta} strokeWidth={3.5} strokeLinejoin="round" />
        <path d="M68 24 H90 L84 98 Q84 103 79 103 H72 Z" fill={C.coralDark} />
        <rect x={8} y={20} width={84} height={10} rx={5} fill={C.coralDark} stroke={C.tinta} strokeWidth={3} />
        <circle cx={47} cy={64} r={22} fill={C.creme} />
        <MarcaPin transform="translate(47 64) scale(1.6)" />
      </svg>
    </div>
  );
};

// a etiqueta amarela com um número que sobe (o total da sacola, os pontos)
export const Etiqueta: React.FC<{ cx: number; cy: number; titulo: string; valor: string; e: number; rot?: number; pulso?: number }> = ({ cx, cy, titulo, valor, e, rot = -4, pulso = 0 }) => {
  if (e <= 0) return null;
  return (
    <div style={{ position: "absolute", left: cx, top: cy, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${e * (1 + 0.08 * pulso)})`, background: C.amarelo,
      border: `5px solid ${C.tinta}`, borderRadius: 22, padding: "8px 26px 12px", boxShadow: `0 8px 0 ${C.tinta}`, textAlign: "center", fontFamily: FONT, whiteSpace: "nowrap" }}>
      <div style={{ fontWeight: W.extraBold, fontSize: 26, color: C.tinta, letterSpacing: 2 }}>{titulo}</div>
      <div style={{ fontWeight: W.black, fontSize: 64, lineHeight: "66px", color: C.tinta, fontVariantNumeric: "tabular-nums" }}>{valor}</div>
    </div>
  );
};

// o selo discreto, em todo o vídeo: (x, y) = o canto superior ESQUERDO; altura = size + 8 + 2 × 4 (a revisão confere a caixa)
export const Selo: React.FC<{ x: number; y: number; size: number }> = ({ x, y, size }) => (
  <div style={{ position: "absolute", left: x, top: y, fontFamily: FONT, fontWeight: W.extraBold, fontSize: size, lineHeight: `${size + 8}px`, color: C.tinta, opacity: 0.55,
    background: "rgba(255,249,241,0.7)", borderRadius: 999, padding: "4px 14px", letterSpacing: 0.5, whiteSpace: "nowrap" }}>
    Imagens ilustrativas
  </div>
);

// nuvenzinha de "puf" (fumaça da freada, o balão que some)
export const Puf: React.FC<{ t: number; t0: number; x: number; y: number; n?: number; raio?: number; seed: string; cor?: string }> = ({ t, t0, x, y, n = 7, raio = 120, seed, cor = C.cremeDeep }) => {
  const u = (t - t0) / 0.6;
  if (u < 0 || u > 1) return null;
  return (
    <>
      {Array.from({ length: n }).map((_, i) => {
        const r = (k: string) => random(`${seed}-${i}-${k}`);
        const a = (i / n) * Math.PI * 2 + r("a"), d = raio * outCubic(u) * (0.6 + 0.6 * r("d")), s = (36 + 40 * r("s")) * (1 - 0.5 * u);
        return <div key={i} style={{ position: "absolute", left: x + Math.cos(a) * d - s / 2, top: y + Math.sin(a) * d * 0.7 - s / 2, width: s, height: s, borderRadius: "50%", background: cor, opacity: 1 - u }} />;
      })}
    </>
  );
};
