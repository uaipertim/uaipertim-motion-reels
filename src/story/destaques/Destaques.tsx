import React from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import { C } from "../../config/theme";
import { DUVIDAS_CARDS } from "./Duvidas";
import { LOJISTA_CARDS } from "./Lojista";
import { EXPLICA_SO_CARDS } from "./ExplicaSo";

// STORIES DE DESTAQUE (Dúvidas, Lojista, Explica, Sô!) — como o Story "Conheça": cada card é uma cena animada própria
// (um componente por card), 6 s / 180 frames a 30 fps, um MP4 por card. Tempos: src/story/destaques/config/<nome>.json
// (fonte única para vídeo e áudio). Áudio: a trilha do "Conheça" + efeitos, cortada em card1..cardN.wav
// (python3 audio/destaque.py <nome>). Gerar tudo: npm run destaque -- <nome>.
export const DESTAQUES = { duvidas: DUVIDAS_CARDS, lojista: LOJISTA_CARDS, "explica-so": EXPLICA_SO_CARDS } as const;
export type DestaqueNome = keyof typeof DESTAQUES;
export const DESTAQUE_IDS: Record<DestaqueNome, string> = { duvidas: "Duvidas", lojista: "Lojista", "explica-so": "ExplicaSo" };

export const DestaqueCard: React.FC<{ nome: DestaqueNome; card: number; withAudio?: boolean }> = ({ nome, card, withAudio = true }) => {
  const Comp = DESTAQUES[nome][card];
  return (
    <AbsoluteFill style={{ background: C.creme, overflow: "hidden" }}>
      <Comp />
      {withAudio && <Audio src={staticFile(`audio/destaques/${nome}/card${card + 1}.wav`)} />}
    </AbsoluteFill>
  );
};
