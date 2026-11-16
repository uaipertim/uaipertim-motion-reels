import React from "react";
import { Img, staticFile } from "remotion";
import { C, FONT, W } from "../config/theme";

// O CELULAR GENÉRICO com uma tela do app (public/telas-app/celular/*.png, 1170 px de largura = 390 × 3), no mesmo
// desenho do Reel "Olha ele por dentro!" (src/olha-ele-por-dentro/): corpo tinta arredondado, botões laterais, só o
// furinho da câmera — sem marca de aparelho e sem barra de status falsa.
//   recorte  [y0, y1]: o trecho da tela (px do PNG) que aparece no alto da tela do celular, ampliado o máximo possível
//            para caber INTEIRO na altura visível; abaixo de y1 a tela continua até a borda (o celular sai do quadro)
//   destaque [[x0, y0, x1, y1], …]: caixas contornadas em coral (como a lupa do Reel)
//   foco     esmaece o resto da tela em volta do destaque
//   neutro   (só na Checkout.png) tira a pré-seleção do Pix: a borda coral do card vira a borda cinza dos outros e o
//            rádio cheio vira o vazio (copiado do rádio do "Cartão de crédito", da mesma tela) — as 3 formas iguais

export type TelaApp = { tela: string; recorte: [number, number]; destaque?: number[][]; foco?: boolean; neutro?: boolean };
export const BEZEL = 0.042;

export const CorpoCelular: React.FC<{ w: number; h: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ w, h, children, style }) => {
  const bz = w * BEZEL;
  return (
    <div style={{ position: "absolute", width: w, height: h, ...style }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: w * 0.15, background: C.tinta, boxShadow: `inset 0 0 0 ${w * 0.012}px #4A3E38, 0 30px 60px rgba(34,28,25,0.28)` }} />
      <div style={{ position: "absolute", right: -w * 0.013, top: h * 0.2, width: w * 0.017, height: Math.min(h * 0.09, w * 0.19), borderRadius: 6, background: "#3B312C" }} />
      <div style={{ position: "absolute", left: -w * 0.013, top: h * 0.17, width: w * 0.017, height: Math.min(h * 0.06, w * 0.13), borderRadius: 6, background: "#3B312C" }} />
      <div style={{ position: "absolute", left: bz, top: bz, width: w - 2 * bz, height: h - 2 * bz, borderRadius: w * 0.11, overflow: "hidden", background: "#FAF8F5" }}>
        {children}
      </div>
      <div style={{ position: "absolute", left: w / 2 - w * 0.013, top: bz + w * 0.02, width: w * 0.026, height: w * 0.026, borderRadius: "50%", background: "#0D0B0A", boxShadow: "inset 0 0 0 2px #2A2421" }} />
    </div>
  );
};

// o conteúdo da tela, em px do PNG (largura 1170), com as correções do "neutro"
const Neutro: React.FC<{ src: string }> = ({ src }) => (
  <>
    {/* a borda do card do Pix (coral, 6 px, raio 53) vira a borda dos outros cards (cinza #ECE7E1, 3 px) */}
    {/*   em camadas SOBREPOSTAS (sem emenda entre elas, onde o coral de baixo apareceria no antialiasing): um anel branco
          largo por cima da borda coral, um anel da cor da página por fora e a borda cinza de 3 px por cima de tudo */}
    <div style={{ position: "absolute", left: 57, top: 1095, width: 1056, height: 432, borderRadius: 56, border: "11px solid #FFFFFF", boxSizing: "border-box" }} />
    <div style={{ position: "absolute", left: 54, top: 1092, width: 1062, height: 438, borderRadius: 59, border: "6px solid #FAF8F5", boxSizing: "border-box" }} />
    <div style={{ position: "absolute", left: 59, top: 1097, width: 1052, height: 428, borderRadius: 54, border: "3px solid #ECE7E1", boxSizing: "border-box" }} />
    {/* o rádio do Pix (cheio) vira o rádio vazio do Cartão de crédito */}
    <div style={{ position: "absolute", left: 991, top: 1174, width: 75, height: 75, overflow: "hidden", background: "#fff" }}>
      <Img src={src} style={{ position: "absolute", left: -994, top: -1627, width: 1170, maxWidth: "none" }} />
    </div>
  </>
);

export const TelaRecortada: React.FC<TelaApp & { largura: number; alturaVisivel: number }> = ({ tela, recorte, destaque, foco, neutro, largura, alturaVisivel }) => {
  const s = largura / 1170;
  const [y0] = recorte;
  const src = staticFile(`telas-app/celular/${tela}`);
  const caixa = (b: number[]) => ({ x: b[0] * s, y: (b[1] - y0) * s, w: (b[2] - b[0]) * s, h: (b[3] - b[1]) * s });
  const raio = 46 * s;
  return (
    <>
      <div style={{ position: "absolute", left: 0, top: -y0 * s, width: 1170, transform: `scale(${s})`, transformOrigin: "0 0" }}>
        <Img src={src} style={{ display: "block", width: 1170, maxWidth: "none" }} />
        {neutro && tela === "Checkout.png" && <Neutro src={src} />}
      </div>
      {foco && destaque?.length ? (
        <svg width={largura} height={alturaVisivel} style={{ position: "absolute", left: 0, top: 0 }}>
          <path fillRule="evenodd" fill="rgba(250,248,245,0.68)"
            d={`M0 0 H${largura} V${alturaVisivel} H0 Z ` + destaque.map((b) => { const c = caixa(b); return `M${c.x + raio} ${c.y} H${c.x + c.w - raio} A${raio} ${raio} 0 0 1 ${c.x + c.w} ${c.y + raio} V${c.y + c.h - raio} A${raio} ${raio} 0 0 1 ${c.x + c.w - raio} ${c.y + c.h} H${c.x + raio} A${raio} ${raio} 0 0 1 ${c.x} ${c.y + c.h - raio} V${c.y + raio} A${raio} ${raio} 0 0 1 ${c.x + raio} ${c.y} Z`; }).join(" ")} />
        </svg>
      ) : null}
      {destaque?.map((b, i) => {
        const c = caixa(b);
        return <div key={i} style={{ position: "absolute", left: c.x, top: c.y, width: c.w, height: c.h, borderRadius: raio, border: `${Math.max(5, 9 * s)}px solid ${C.coral}`,
          boxShadow: `0 0 0 ${Math.max(6, 10 * s)}px rgba(249,178,51,0.35)`, boxSizing: "border-box" }} />;
      })}
    </>
  );
};

// o selo dos posts com telas (regra de public/telas-app/README.md)
export const SeloIlustrativo: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 24, style }) => (
  <div style={{ fontFamily: FONT, fontWeight: W.extraBold, fontSize: size, lineHeight: `${size + 8}px`, color: C.tinta, opacity: 0.6, background: "rgba(255,249,241,0.85)",
    borderRadius: 999, padding: `3px ${size * 0.7}px`, letterSpacing: 0.4, whiteSpace: "nowrap", ...style }}>
    Lojas e valores ilustrativos
  </div>
);
