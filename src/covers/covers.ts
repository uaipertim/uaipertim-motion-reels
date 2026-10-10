import type { CoverCardProps } from "../components/Cover";

// Capas (thumbnails) dos Reels: textos e ajustes de cada uma. Componente: components/Cover.tsx (CoverCard).
// Zona segura: logo e texto entre y=285 e y=1635 (grade 3:4 e feed 4:5), margem lateral ≥ 80px.
export const COVERS: Record<string, CoverCardProps> = {
  video2: {
    lead: "Vai funcionar", // tinta, mesmo peso de "O UaiPertim"
    highlight: "assim, ó", // coral, com marcador amarelo (como o "NÃO")
    highlightSize: 190,
    markerWidth: 820,
    offsetY: 190, // sem a 3ª linha, o bloco desce para ficar centrado nos recortes 3:4 e 4:5
    // brilhos longe do logo e do texto
    twinkles: [[130, 400], [950, 430], [900, 300], [215, 640], [865, 600], [140, 1470], [940, 1450], [210, 1590], [880, 1600]],
  },
};
