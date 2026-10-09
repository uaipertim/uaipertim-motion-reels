import React from "react";

// Dessaturação + onda de cor (Vídeo 4): fora da onda o conteúdo fica cinza; dentro do círculo
// que cresce a partir de (cx, cy), as cores voltam. Sem onda (r = undefined), aplica só `gray`.
export const ColorWave: React.FC<{
  gray: number; // 0 = cores normais, 1 = cinza total
  r?: number; // raio da onda em px (desenha a borda brilhante enquanto cresce)
  cx?: number;
  cy?: number;
  fade?: number; // 0..1 some com a borda no fim da onda
  children: React.ReactNode;
}> = ({ gray, r, cx = 540, cy = 960, fade = 0, children }) => {
  const filter = gray > 0 ? `grayscale(${gray}) brightness(${1 + 0.04 * gray})` : undefined;
  if (r === undefined || r <= 0) return <div style={{ position: "absolute", inset: 0, filter }}>{children}</div>;
  const hole = `radial-gradient(circle at ${cx}px ${cy}px, transparent ${r}px, #000 ${r + 3}px)`;
  return (
    <>
      <div style={{ position: "absolute", inset: 0 }}>{children}</div>
      <div style={{ position: "absolute", inset: 0, filter, maskImage: hole, WebkitMaskImage: hole }}>{children}</div>
      {/* borda da onda */}
      <div
        style={{
          position: "absolute", left: cx - r - 14, top: cy - r - 14, width: (r + 14) * 2, height: (r + 14) * 2, borderRadius: "50%",
          border: `16px solid rgba(255,255,255,${0.75 * (1 - fade)})`, boxShadow: `0 0 0 10px rgba(249,178,51,${0.55 * (1 - fade)}), 0 0 60px 20px rgba(255,210,122,${0.5 * (1 - fade)})`,
          pointerEvents: "none",
        }}
      />
    </>
  );
};
