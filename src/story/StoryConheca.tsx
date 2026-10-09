import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { C } from "../config/theme";
import { CARDS, CardId } from "./config/timeline";
import { Card1Prazer } from "./cards/Card1Prazer";
import { Card2NaoEApp } from "./cards/Card2NaoEApp";
import { Card3TemDeTudo } from "./cards/Card3TemDeTudo";
import { Card4EmBreve } from "./cards/Card4EmBreve";

// Story "Conheça" (destaque): 4 cards de 6s, cada um uma composição/MP4 (card1.mp4 … card4.mp4).
// O áudio é UMA trilha de 24s (public/audio/story/mix.wav) cortada por card (cardN.wav).

const CARD_COMPONENTS: Record<CardId, React.FC> = {
  card1: Card1Prazer,
  card2: Card2NaoEApp,
  card3: Card3TemDeTudo,
  card4: Card4EmBreve,
};

export const StoryCard: React.FC<{ card: CardId; withAudio?: boolean }> = ({ card, withAudio = true }) => {
  const Comp = CARD_COMPONENTS[card];
  return (
    <AbsoluteFill style={{ background: C.creme }}>
      <Comp />
      {withAudio && <Audio src={staticFile(`audio/story/${card}.wav`)} />}
    </AbsoluteFill>
  );
};

// Prévia: os 4 cards em sequência com a trilha inteira (só para revisão; não é um entregável).
export const StoryPreview: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => (
  <AbsoluteFill style={{ background: C.creme }}>
    {(Object.keys(CARDS) as CardId[]).map((k) => (
      <Sequence key={k} from={CARDS[k].from} durationInFrames={CARDS[k].duration} name={CARDS[k].name}>
        <StoryCard card={k} withAudio={false} />
      </Sequence>
    ))}
    {withAudio && <Audio src={staticFile("audio/story/mix.wav")} />}
  </AbsoluteFill>
);
