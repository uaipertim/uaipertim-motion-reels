import timeline from "./timeline.json";

// Acesso tipado à timeline única (também lida pelos scripts de áudio).
export const TL = timeline;
export const FPS = timeline.fps;
export const SCENES = timeline.scenes;
export const BEATS = timeline.beats;
export const TRANSITIONS = timeline.transitions;
export const CAPTIONS = timeline.captions;
export const MUSIC = timeline.music;

export type SceneKey = keyof typeof timeline.scenes;
