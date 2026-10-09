import timeline from "./timeline.json";

// Acesso tipado à timeline do story (também lida por audio/*.py --video story).
export const TLS = timeline;
export const CARDS = timeline.scenes;
export const BEATS_S = timeline.beats;
export type CardId = keyof typeof CARDS;
