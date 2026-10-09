import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C } from "../config/theme";
import { TEXTS } from "../config/texts";
import { BEATS, SCENES } from "../config/timeline";
import { breathe, clamp, float, pop, popOut } from "../lib/anim";
import { CoralBackground } from "../components/Decor";
import { CATEGORY_ICONS, LinkIcon } from "../components/Icons";
import { BrowserBar, CategoryTile } from "../components/Ui";
import { PopWords } from "../components/Text";
import { HOME_PHONE, HomePhone } from "./HomePhone";

// CENA 4 · É só o link — URL se digita sozinha → toque (ripple) → home sobe no celular.
const B = BEATS.s4;
const DUR = SCENES.s4.duration;
export const PHONE4 = { cx: 540, cy: 780 + HOME_PHONE.h / 2 };
export const TILE_SPOTS: Array<[number, number]> = [[150, 860], [930, 920], [150, 1080], [930, 1140], [150, 1280]];

export const typedAt = (f: number) => interpolate(f, [B.typeStart, B.typeStart + TEXTS.s4.url.length * B.typeEvery], [0, TEXTS.s4.url.length], clamp);

export const Scene4Link: React.FC = () => {
  const f = useCurrentFrame();
  const exit = popOut(f, DUR - 9, 8);
  const typed = typedAt(f);
  const t1Out = popOut(f, B.text2 - 8, 7);

  const barIn = pop(f, B.browserIn, { damping: 11, stiffness: 150 });
  const barExit = interpolate(f, [DUR - 10, DUR], [0, -700], clamp);
  const phoneIn = pop(f, B.phoneIn, { damping: 12, stiffness: 120 });
  const homeIn = pop(f, B.homeSlide, { damping: 11, stiffness: 110 });
  const loading = f >= B.tap && f < B.homeSlide + 6 ? 1 : 0;

  return (
    <AbsoluteFill>
      <CoralBackground frame={f} />
      {/* títulos */}
      <div style={{ position: "absolute", top: 232, left: 0, right: 0 }}>
        <PopWords parts={TEXTS.s4.title1[0]} frame={f} start={B.text1} size={104} color="#fff" out={t1Out} shadow={`0 6px 0 ${C.coralDark}`} />
        <PopWords
          parts={[{ t: TEXTS.s4.title1[1], color: C.amarelo }]}
          frame={f}
          start={B.text1 + 5}
          size={118}
          out={t1Out}
          shadow={`0 6px 0 ${C.coralDark}`}
          after={<LinkIcon size={112} style={{ transform: `rotate(${Math.sin(f * 0.15) * 10}deg)` }} />}
        />
      </div>
      <div style={{ position: "absolute", top: 232, left: 0, right: 0 }}>
        <PopWords parts={TEXTS.s4.title2[0]} frame={f} start={B.text2} size={104} color="#fff" out={exit} shadow={`0 6px 0 ${C.coralDark}`} />
        <PopWords parts={[{ t: TEXTS.s4.title2[1], color: C.amarelo }]} frame={f} start={B.text2 + 5} size={124} out={exit} shadow={`0 6px 0 ${C.coralDark}`} />
      </div>

      {/* celular com a home */}
      <div
        style={{
          position: "absolute", left: PHONE4.cx - HOME_PHONE.w / 2, top: 780, transform: `translateY(${(1 - phoneIn) * 1100}px) rotate(${(1 - phoneIn) * 8}deg)`,
        }}
      >
        <HomePhone typed={typed} homeIn={homeIn} loading={loading} frame={f} />
      </div>

      {/* barra do navegador */}
      <div
        style={{
          position: "absolute", left: 70, top: 500, transform: `translateY(${(1 - barIn) * -520 + barExit}px) scale(${breathe(f, 50, 0.012)})`,
        }}
      >
        <BrowserBar width={940} url={TEXTS.s4.url} typed={typed} frame={f} tapFrame={B.tap} />
      </div>

      {/* categorias pipocando ao redor do celular */}
      {B.cats.map((at, i) => {
        const p = pop(f, at, { damping: 8, stiffness: 190 }) * exit;
        const [x, y] = TILE_SPOTS[i];
        const sx = PHONE4.cx + (x - PHONE4.cx) * Math.min(1, p);
        const sy = PHONE4.cy - 200 + (y - PHONE4.cy + 200) * Math.min(1, p);
        const Icon = CATEGORY_ICONS[i];
        return (
          <div
            key={i}
            style={{
              position: "absolute", left: sx - 95, top: sy - 95 + float(f, 44, 8, i * 1.3),
              transform: `scale(${p}) rotate(${Math.sin(f * 0.12 + i) * 5}deg)`,
            }}
          >
            <CategoryTile size={190} icon={<Icon size={110} />} label={TEXTS.categories[i]} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
