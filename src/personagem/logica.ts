// O PERTIM, personagem oficial do UaiPertim: a lógica das variações, portada sem mudança de desenho do componente do
// Claude Design (src/personagem/fonte/pertim-personagem.dc.html → renderVals). Aqui só os valores (o que aparece e onde);
// o desenho fica em Pertim.tsx, camada por camada, com as cores exatas do arquivo.
//
// Variações: versão (1 principal, 3 app), vista (frente, três quartos), expressão, boca (repouso, A, E, O, M/B/P) e pose
// (parado, acenando, apontando, sacola, comemorando, correndo, moto). O rig (respiração, piscada, olhar, boca falando,
// troca de pose) entra por cima destes valores, em rig.ts.

export type Versao = 1 | 3;
export type Vista = "frente" | "tq";
export type Expressao = "neutro" | "sorrindo" | "alegre" | "curioso" | "surpreso" | "pensativo" | "apressado" | "piscadinha";
export type Boca = "repouso" | "A" | "E" | "O" | "MBP";
export type Pose = "parado" | "acenando" | "apontando" | "sacola" | "comemorando" | "correndo" | "moto";
export type Recorte = "corpo" | "rosto";
export type Camada = "todas" | "mochila" | "pernas" | "corpo" | "capacete" | "viseira" | "olhos" | "boca" | "bracos";
export const BOCAS: Boca[] = ["repouso", "A", "E", "O", "MBP"];
export const EXPRESSOES: Expressao[] = ["neutro", "sorrindo", "alegre", "curioso", "surpreso", "pensativo", "apressado", "piscadinha"];
export const POSES: Pose[] = ["parado", "acenando", "apontando", "sacola", "comemorando", "correndo", "moto"];

// as cores do arquivo (paleta da ficha do personagem)
export const COR = {
  coral: "#F2502B", coralEscuro: "#E7431C", amarelo: "#F9B233", laranja: "#F08A00", creme: "#F6EEE2", verde: "#3E9E4E",
  tinta: "#221C19", branco: "#FFFFFF", brilhoCapacete: "#F87A5D",
} as const;

export type PertimBase = {
  v?: Versao; view?: Vista; expr?: Expressao; mouth?: Boca | "auto"; pose?: Pose; crop?: Recorte; layer?: Camada;
};

type Olho = { open: boolean; lid: boolean; happy: boolean; wink: boolean; px: number; py: number; s: number; lidD: string; lineD: string };
const E = (o: Partial<Olho> = {}): Olho => ({ open: true, lid: false, happy: false, wink: false, px: 2, py: 2, s: 1, lidD: "M0,0", lineD: "M0,0", ...o });
const LF = { lid: true, lidD: "M-20,-22 H20 V-3 H-20 Z", lineD: "M-14.8,-3 H14.8" };
const LAL = { lid: true, lidD: "M-20,-22 H20 V-1 L-20,-13 Z", lineD: "M-12,-10.6 L14.6,-2.6" };
const LAR = { lid: true, lidD: "M-20,-22 H20 V-13 L-20,-1 Z", lineD: "M-14.6,-2.6 L12,-10.6" };
// [olho esquerdo, olho direito, boca da expressão, bochecha]
const X: Record<Expressao, [Olho, Olho, string, number]> = {
  neutro: [E(), E(), "repouso", 0.32],
  sorrindo: [E({ px: 2, py: 1 }), E({ px: 2, py: 1 }), "sorriso", 0.45],
  alegre: [E({ open: false, happy: true }), E({ open: false, happy: true }), "sorriso", 0.5],
  curioso: [E({ px: 4, py: -2, s: 1.1 }), E({ px: 4, py: -1, ...LF }), "curioso", 0.32],
  surpreso: [E({ px: 0, py: 0, s: 1.16 }), E({ px: 0, py: 0, s: 1.16 }), "O", 0.28],
  pensativo: [E({ px: -4, py: -6 }), E({ px: -4, py: -6 }), "hmm", 0.28],
  apressado: [E({ px: 5, py: 1, ...LAL }), E({ px: 5, py: 1, ...LAR }), "grit", 0.4],
  piscadinha: [E({ px: 2, py: 1 }), E({ open: false, wink: true }), "smirk", 0.42],
};

export type OlhoFinal = Olho & { t: string; g1x: number; g1y: number; g2x: number; g2y: number };

export const pertimVals = (p: PertimBase) => {
  const v: Versao = p.v === 3 ? 3 : 1;
  const v1 = v === 1;
  const pose: Pose = v1 ? p.pose ?? "parado" : "parado";
  const moto = pose === "moto";
  const expr: Expressao = p.expr ?? "neutro";
  const crop = p.crop ?? "corpo";
  const layer = p.layer ?? "todas";
  const tq = (p.view ?? "frente") === "tq" || pose === "correndo" || moto;
  const all = layer === "todas";
  const L = (k: Camada) => all || layer === k;
  const body = crop !== "rosto";

  let vb = [0, 18, 240, 270];
  if (!body) vb = v === 1 ? [28, 36, 184, 184] : [41, 42, 158, 158];
  else if (moto) vb = [-24, 40, 300, 254];
  else if (pose !== "parado") vb = [-20, 6, 280, 284];

  const base = moto ? "translate(110 108) scale(0.8) translate(-120 -120)" : v === 3 ? "translate(120 116) scale(0.86) translate(-120 -120)" : "";
  let tilt = "";
  if (pose === "correndo") tilt = "rotate(8 120 240)";
  else if (!moto && expr === "curioso") tilt = "rotate(-7 120 220)";
  else if (!moto && expr === "apressado") tilt = "rotate(5 120 230)";
  const pinT = `${base} ${tilt}`.trim();
  const charT = pose === "comemorando" ? "translate(0 -14)" : "";

  const x = X[expr] || X.neutro;
  const fin = (e: Olho, cx: number, sx: number): OlhoFinal => ({
    ...e, t: `translate(${cx} 152) scale(${e.s * sx} ${e.s})`, g1x: e.px + 3.5, g1y: e.py - 4.2, g2x: e.px - 3, g2y: e.py + 4.5,
  });
  const eL = fin(x[0], 98, 1);
  const eR = fin(x[1], 142, tq ? 0.84 : 1);
  const boca = p.mouth && p.mouth !== "auto" && BOCAS.includes(p.mouth) ? p.mouth : x[2];

  const d = {
    sombra: all && body, pack: L("mochila") && (tq || layer === "mochila"), alcas: L("mochila"), alcaR: !tq || layer === "mochila",
    corpo: L("corpo"), capacete: L("capacete"), viseira: L("viseira"), olhos: L("olhos"), boca: L("boca"),
    bracos: L("bracos") && body && !moto, pernas: L("pernas") && body, moto: all && moto && body,
  };
  const a = {
    l1: v1 && ["parado", "acenando", "apontando"].includes(pose), lBag: v1 && pose === "sacola", lUp: v1 && pose === "comemorando",
    lBack: v1 && pose === "correndo", r1: v1 && ["parado", "sacola"].includes(pose), rWave: v1 && pose === "acenando",
    rPoint: v1 && pose === "apontando", rUp: v1 && pose === "comemorando", rFwd: v1 && pose === "correndo", v3: v === 3,
  };
  const g = { v1: v1 && pose !== "correndo" && !moto, run: v1 && pose === "correndo" };
  const fx = {
    local: all, dots: expr === "pensativo", sweat: expr === "apressado", spark: expr === "piscadinha", world: all && body,
    speed: expr === "apressado" && !moto && pose !== "correndo", runfx: pose === "correndo", confetti: pose === "comemorando",
  };
  let sh = { cx: 120, cy: 276, rx: 50, ry: 7 };
  if (v === 3) sh = { cx: 120, cy: 276, rx: 32, ry: 5 };
  if (pose === "comemorando") sh = { cx: 120, cy: 276, rx: 36, ry: 5 };
  if (pose === "correndo") sh = { cx: 122, cy: 273, rx: 60, ry: 7 };
  if (moto) sh = { cx: 150, cy: 284, rx: 130, ry: 7 };

  return {
    v, pose, expr, tq, vb, label: `UaiPertim, versão ${v}`, pinT, charT, eL, eR, boca, cheek: x[3], d, a, g, fx, sh,
    faceT: tq ? "translate(15 1)" : "", brimT: tq ? "translate(7 0)" : "", visorT: tq ? "translate(6 0)" : "", strapT: tq ? "translate(6 0)" : "",
  };
};
export type PertimVals = ReturnType<typeof pertimVals>;
