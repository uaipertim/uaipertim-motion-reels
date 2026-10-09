import timeline from "./timeline.json";

// Acesso tipado à timeline do Vídeo 3 (também lida por audio/*.py --video v3).
export const TL3 = timeline;
export const SCENES3 = timeline.scenes;
export const BEATS3 = timeline.beats;
export const TRANSITIONS3 = timeline.transitions;

// frame absoluto de um beat local de cena
export const abs3 = (scene: keyof typeof SCENES3, local: number) => SCENES3[scene].from + local;
