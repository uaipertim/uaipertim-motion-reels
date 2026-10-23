import type { CapaReelProps } from "./CapaReel";

// Capas novas dos Reels já publicados (só PNG; npm run capas:reels → out/capas/reels/capa-<id>.png).
// Os títulos são os das capas atuais (a palavra de destaque entre *asteriscos*), em linhas já definidas, sem emoji.
export const CAPAS_REELS: CapaReelProps[] = [
  { id: "explica-so-01", selo: "EXPLICA, SÔ!", numero: 1, icone: "balao", ilustracao: "mesa", titulo: ["Faltou um", "*trem*?"], fundo: "creme", cor: "coral" },
  { id: "nao-e-app", selo: "CONHEÇA", icone: "pin", ilustracao: "nao-e-app", titulo: ["O UaiPertim", "*NÃO*", "é app."], fundo: "pessego", cor: "amarelo" },
  { id: "vai-funcionar-assim", selo: "CONHEÇA", icone: "pin", ilustracao: "entrega", titulo: ["Vai funcionar", "*assim, ó*"], fundo: "creme", cor: "verde" },
  { id: "qual-comercio-precisa", selo: "CONTA PRA GENTE", icone: "megafone", ilustracao: "vaga", titulo: ["Qual comércio", "*PRECISA*", "estar aqui?"], fundo: "pessego", cor: "coral" },
];
