import React, { useMemo } from "react";
import { C, FONT, W } from "../config/theme";

// A LEGENDA GRAVADA dos Reels do Pertim: pílula tinta 85% com o texto creme e a palavra falada em amarelo.
// `dados` = o legenda.json de scripts/personagem/fala.py → legenda() (blocos com as palavras no tempo do vídeo).
export type LegendaDados = {
  estilo: { cx: number; base: number; size: number; lh: number; padX: number; padY: number };
  blocos: Array<{ t0: number; t1: number; linhas: Array<Array<{ w: string; t0: number; t1: number }>> }>;
};

export const Legenda: React.FC<{ t: number; dados: LegendaDados }> = ({ t, dados }) => {
  const st = dados.estilo;
  const b = dados.blocos.find((x) => t >= x.t0 && t < x.t1);
  const medir = useMemo(() => {
    const c = document.createElement("canvas").getContext("2d")!;
    c.font = `800 ${st.size}px ${FONT}`;
    return (s: string) => c.measureText(s).width;
  }, [st.size]);
  if (!b) return null;
  const todas = b.linhas.flat();
  let atual = -1;
  todas.forEach((w, i) => { if (t >= w.t0 - 0.02) atual = i; });
  const larg = Math.max(...b.linhas.map((l) => medir(l.map((w) => w.w).join(" "))));
  const wPill = larg + 2 * st.padX, hPill = b.linhas.length * st.lh + 2 * st.padY;
  let k = -1;
  return (
    <div style={{ position: "absolute", left: st.cx - wPill / 2, top: st.base - hPill, width: wPill, height: hPill, borderRadius: Math.min(22, hPill / 2), background: "rgba(34,28,25,0.85)", opacity: Math.min(1, (t - b.t0) / 0.08), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      {b.linhas.map((l, li) => (
        <div key={li} style={{ fontFamily: FONT, fontWeight: W.extraBold, fontSize: st.size, lineHeight: `${st.lh}px`, whiteSpace: "nowrap" }}>
          {l.map((w, wi) => { k++; return <span key={wi} style={{ color: k === atual ? C.amarelo : C.papel }}>{wi ? " " : ""}{w.w}</span>; })}
        </div>
      ))}
    </div>
  );
};
