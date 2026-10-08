import React from "react";
import { Img, staticFile } from "remotion";
import { C, FONT, W } from "../config/theme";
import { TEXTS } from "../config/texts";
import { Lock } from "../components/Icons";
import { Phone } from "../components/Phone";

// Celular das cenas 4–5 com a home real (uaipertim_home.png) no navegador.
export const HOME_PHONE = { w: 470, h: 940 };

export const HomePhone: React.FC<{
  typed: number; // nº de caracteres da URL visíveis
  homeIn: number; // 0 → página embaixo (fora), 1 → no lugar
  scroll?: number; // px de rolagem da página
  loading?: number; // 0..1 bolinhas de carregamento
  frame: number;
}> = ({ typed, homeIn, scroll = 0, loading = 0, frame }) => {
  const screenW = HOME_PHONE.w - HOME_PHONE.w * 0.042 * 2;
  const barH = 84;
  const imgH = (screenW / 343) * 803;
  const url = TEXTS.s4.url.slice(0, Math.floor(typed));
  return (
    <Phone width={HOME_PHONE.w} height={HOME_PHONE.h} screenBg="#fff" notch={false}>
      {/* página em branco + carregando */}
      <div style={{ position: "absolute", left: 0, right: 0, top: barH, bottom: 0, background: "#FBF6EF" }}>
        {loading > 0 && (
          <div style={{ position: "absolute", top: "40%", left: 0, right: 0, display: "flex", justifyContent: "center", gap: 18, opacity: loading }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 26, height: 26, borderRadius: 13, background: [C.coral, C.amarelo, C.verde][i],
                  transform: `translateY(${Math.sin(frame * 0.5 - i * 0.9) * 14}px)`,
                }}
              />
            ))}
          </div>
        )}
      </div>
      {/* home real subindo */}
      <div
        style={{
          position: "absolute", left: 0, top: barH, width: screenW, height: imgH,
          transform: `translateY(${(1 - homeIn) * (HOME_PHONE.h + 100) - scroll}px)`,
        }}
      >
        <Img src={staticFile("img/uaipertim_home.png")} style={{ width: screenW, height: imgH, display: "block" }} />
      </div>
      {/* barra de endereço do navegador do celular */}
      <div
        style={{
          position: "absolute", left: 0, right: 0, top: 0, height: barH, background: "#fff", borderBottom: `3px solid ${C.cremeDark}`,
          display: "flex", alignItems: "flex-end", padding: "0 18px 12px",
        }}
      >
        <div
          style={{
            flex: 1, height: 46, borderRadius: 23, background: C.creme, display: "flex", alignItems: "center", gap: 8, paddingLeft: 14,
          }}
        >
          <Lock size={22} />
          <span style={{ fontFamily: FONT, fontWeight: W.extraBold, fontSize: 22, color: C.tinta, whiteSpace: "nowrap" }}>{url}</span>
        </div>
      </div>
    </Phone>
  );
};
