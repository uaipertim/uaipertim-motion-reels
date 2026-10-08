// Paleta e tipografia da marca UaiPertim.
export const C = {
  coral: "#F2502B",
  coralBg: "#E7431C",
  creme: "#F6EEE2",
  amarelo: "#F9B233",
  verde: "#3E9E4E",
  tinta: "#221C19",
  branco: "#FFFFFF",
  // tons de apoio derivados da paleta (sombras, realces)
  coralDark: "#C63A17",
  coralLight: "#FF8A63",
  amareloDark: "#E3951A",
  amareloLight: "#FFD27A",
  verdeDark: "#2D7A3A",
  verdeLight: "#7FC66E",
  cremeDark: "#EADBC6",
  cremeDeep: "#E2CDB2",
  papel: "#FFF9F1",
  logoCoral: "#F74E2A",
} as const;

export const FONT = "Poppins";

export const W = {
  medium: 500,
  extraBold: 800,
  black: 900,
} as const;

// Reels: topo ~220px e base ~420px livres de texto crítico.
export const SAFE = { top: 220, bottom: 420 } as const;
