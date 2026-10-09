import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, FONT, W } from "../../config/theme";
import { TEXTS2 } from "../config/texts";
import { BEATS2, SCENES2 } from "../config/timeline";
import { clamp, pop, popOut } from "../../lib/anim";
import { CremeBackground } from "../../components/Decor";
import { AppCategoryTile, AppHeader, CATEGORY_DEFS, PlaceholderCard, SearchBar } from "../../components/AppUi";
import { SearchIcon } from "../../components/AppIcons";
import { cursorPos, RevealFade, TapCursor, ZoomThrough } from "../../components/Guide";
import { StarPops } from "../../components/Particles";
import { PopWords } from "../../components/Text";
import { SCREEN, StagePhone, StepTitle, toVideo } from "./Stage";

// CENA 3 · Passo 2: a categoria — tiles pipocam e dançam, cursor passeia e toca em uma; depois a busca.
const B = BEATS2.s3;
const DUR = SCENES2.s3.duration;
const TILE = 130;
const SLOT = SCREEN.w / 5;
const ROW_TOP = 420;
const SELECTED = 3; // Restaurantes
export const tileCenter = (i: number): [number, number] => [SLOT * i + SLOT / 2, ROW_TOP + TILE / 2];

export const S3Categoria: React.FC = () => {
  const f = useCurrentFrame();
  const t1Out = popOut(f, B.text2 - 6, 6);
  const out = popOut(f, DUR - 8, 7);

  // cursor: passeia por Mercados e Farmácias, toca em Restaurantes, vai pra busca
  const keys = [
    { f: B.hovers[0] - 14, x: 980, y: 1500 },
    { f: B.hovers[0], ...xy(1) },
    { f: B.hovers[1], ...xy(2) },
    { f: B.tap - 4, ...xy(SELECTED) },
    { f: B.tap + 10, ...xy(SELECTED) },
    { f: B.typeStart, x: toVideo(140, 0)[0], y: toVideo(0, 255)[1] },
  ];
  const [cx, cy] = cursorPos(f, keys);
  const tapT = f - B.tap;
  const selected = tapT >= 0 ? Math.min(1, tapT / 3) : 0;
  const typed = TEXTS2.s3.typed.slice(0, Math.max(0, Math.floor(f - B.typeStart + 1)));
  const glow = f >= B.text2 ? Math.min(1, (f - B.text2) / 6) : 0;

  return (
    <AbsoluteFill>
      <CremeBackground frame={f + SCENES2.s3.from} />
      <StagePhone>
        <div style={{ position: "absolute", left: 0, top: 104 }}>
          <AppHeader width={SCREEN.w} />
        </div>
        <div style={{ position: "absolute", left: 32, top: 222 }}>
          <SearchBar width={SCREEN.w - 64} placeholder={TEXTS2.s3.search} typed={typed} glow={glow} caret={glow > 0 && Math.floor(f / 6) % 2 === 0} />
        </div>
        <div style={{ position: "absolute", left: 36, right: 36, top: 352, display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontFamily: FONT, fontWeight: W.extraBold, fontSize: 36, color: C.tinta }}>{TEXTS2.s3.section}</span>
          <span style={{ fontFamily: FONT, fontWeight: W.extraBold, fontSize: 28, color: C.coral }}>Ver todas</span>
        </div>
        {CATEGORY_DEFS.map((d, i) => {
          const p = pop(f, B.tiles[i], { damping: 8, stiffness: 230 });
          const [tx, ty] = tileCenter(i);
          const [vx, vy] = toVideo(tx, ty);
          const near = Math.max(0, 1 - Math.hypot(cx - vx, cy - vy) / 90);
          const hover = 1 + 0.1 * near * (f > B.hovers[0] - 14 ? 1 : 0);
          const isSel = i === SELECTED;
          const grow = isSel ? 1 + 0.12 * pop(f, B.tap, { damping: 7, stiffness: 200 }) * (tapT >= 0 ? 1 : 0) : 1;
          const petWig = i === 4 && f >= B.petWiggle ? Math.sin((f - B.petWiggle) * 0.8) * 12 * Math.exp(-(f - B.petWiggle) * 0.1) : 0;
          const dance = Math.sin(f * 0.18 + i * 1.3) * 4 + petWig;
          const bob = Math.sin(f * 0.22 + i) * 4;
          return (
            <div
              key={d.kind}
              style={{
                position: "absolute", left: tx - (TILE + 10) / 2, top: ROW_TOP + bob, zIndex: isSel ? 3 : 1,
                transform: `scale(${p * hover * grow}) rotate(${dance}deg)`, transformOrigin: "50% 40%",
              }}
            >
              <AppCategoryTile kind={d.kind} label={d.label} size={TILE} selected={isSel ? selected : 0} />
            </div>
          );
        })}
        {/* flash no toque */}
        {tapT >= 0 && tapT < 8 && (
          <div style={{ position: "absolute", left: tileCenter(SELECTED)[0] - 120, top: tileCenter(SELECTED)[1] - 120, width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.95), rgba(255,255,255,0) 70%)", opacity: 1 - tapT / 8 }} />
        )}
        <div style={{ position: "absolute", left: 36, top: 640, fontFamily: FONT, fontWeight: W.extraBold, fontSize: 36, color: C.tinta }}>Estabelecimentos</div>
        <div style={{ position: "absolute", left: 32, top: 700, opacity: interpolate(f, [30, 50], [0, 1], clamp) }}>
          <PlaceholderCard width={SCREEN.w - 64} />
        </div>
        <ZoomThrough frame={f} start={B.zoomOut} dur={DUR - B.zoomOut} cx={tileCenter(SELECTED)[0]} cy={tileCenter(SELECTED)[1]} color={C.coral} />
        <RevealFade frame={f} dur={B.reveal} />
      </StagePhone>
      <StarPops frame={f} start={B.tap} cx={toVideo(...tileCenter(SELECTED))[0]} cy={toVideo(...tileCenter(SELECTED))[1]} radius={130} count={8} seed="v2s3" size={44} />
      <StepTitle n={2} text={TEXTS2.s3.step} frame={f} badgeAt={B.badge} textAt={B.text1} out={out} textOut={t1Out} />
      {f >= B.text2 - 1 && (
        <div style={{ position: "absolute", top: 390, left: 0, right: 0 }}>
          <PopWords parts={TEXTS2.s3.step2} frame={f} start={B.text2} stagger={3} size={70} out={out} after={<SearchIcon size={74} />} />
        </div>
      )}
      <TapCursor frame={f} appear={B.hovers[0] - 14} hide={B.zoomOut - 2} keys={keys} taps={[B.tap]} />
    </AbsoluteFill>
  );
};

function xy(i: number) {
  const [x, y] = toVideo(...tileCenter(i));
  return { x, y };
}
