import timeline from "./timeline.json";

// Acesso tipado à timeline do Vídeo 4 (também lida por audio/*.py --video v4).
export const TL4 = timeline;
export const SCENES4 = timeline.scenes;
export const BEATS4 = timeline.beats;
export const TRANSITIONS4 = timeline.transitions;

// frame absoluto de um beat local de cena
export const abs4 = (scene: keyof typeof SCENES4, local: number) => SCENES4[scene].from + local;
