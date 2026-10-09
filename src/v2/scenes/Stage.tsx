import React from "react";
import { C } from "../../config/theme";
import { Phone } from "../../components/Phone";
import { StepBadge } from "../../components/Guide";
import { PopWords } from "../../components/Text";

// Palco do Vídeo 2: o celular "zoomado" (a tela vira o cenário de cada passo).
export const STAGE = { left: 90, top: 540, w: 900, h: 1700 };
export const BEZEL = STAGE.w * 0.042;
export const SCREEN = { left: STAGE.left + BEZEL, top: STAGE.top + BEZEL, w: STAGE.w - 2 * BEZEL };
// Na cena 1 o mesmo celular aparece pequeno (personagem) — o zoom da cena 2 parte daqui.
export const SMALL = { scale: 0.49, cy: 1150 };
export const STAGE_CY = STAGE.top + STAGE.h / 2;

// Converte coordenadas da tela do celular (0,0 = canto da tela) para o vídeo.
export const toVideo = (x: number, y: number): [number, number] => [SCREEN.left + x, SCREEN.top + y];

export const StagePhone: React.FC<{
  children?: React.ReactNode;
  scale?: number;
  dy?: number;
  sx?: number;
  sy?: number;
  rot?: number;
  screenBg?: string;
}> = ({ children, scale = 1, dy = 0, sx = 1, sy = 1, rot = 0, screenBg = C.papel }) => (
  <div
    style={{
      position: "absolute", left: STAGE.left, top: STAGE.top, width: STAGE.w, height: STAGE.h,
      transform: `translateY(${dy}px) rotate(${rot}deg) scale(${scale * sx}, ${scale * sy})`, transformOrigin: "50% 50%",
    }}
  >
    <Phone width={STAGE.w} height={STAGE.h} screenBg={screenBg}>
      {children}
    </Phone>
  </div>
);

// Título de passo: badge 1-2-3 quicando + frase.
export const StepTitle: React.FC<{
  n: number; text: string; frame: number; badgeAt: number; textAt: number; out?: number; textOut?: number; textOverride?: React.ReactNode; size?: number;
}> = ({ n, text, frame, badgeAt, textAt, out = 1, textOut = 1, textOverride, size = 74 }) => (
  <>
    <div style={{ position: "absolute", top: 232, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <StepBadge n={n} frame={frame} start={badgeAt} size={132} out={out} />
    </div>
    <div style={{ position: "absolute", top: 390, left: 0, right: 0 }}>
      {textOverride ?? <PopWords parts={text} frame={frame} start={textAt} stagger={3} size={size} out={out * textOut} />}
    </div>
  </>
);
