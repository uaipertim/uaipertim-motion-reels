import type { CoverCardProps } from "../components/Cover";

// Capas (thumbnails) dos Reels: textos e ajustes de cada uma. Componente: components/Cover.tsx (CoverCard).
// Zona segura: logo e texto entre y=285 e y=1635 (grade 3:4 e feed 4:5), margem lateral ≥ 80px.
export const COVERS: Record<string, CoverCardProps> = {
  video2: {
    lead: "Vai funcionar", // tinta, mesmo peso de "O UaiPertim"
    highlight: "assim, ó", // coral, com marcador amarelo (como o "NÃO")
    highlightSize: 185, // "assim, ó" com ~777px (≤ 72% da largura): margem para o zoom do recorte da grade
    markerWidth: 798, // acompanha a largura do destaque
    offsetY: 207, // sem a 3ª linha, o bloco desce para ficar centrado nos recortes 3:4 e 4:5
    leadSize: 90, // apoio reduzido na mesma proporção do destaque (185/190)
    highlightShift: -19, // mantém o respiro entre as linhas com a linha 1 menor
    markerDrop: 25, // o marcador passa abaixo da ponta da vírgula de "assim,"
    // brilhos longe do logo e do texto
    twinkles: [[130, 400], [950, 430], [900, 300], [215, 640], [865, 600], [140, 1470], [940, 1450], [210, 1590], [880, 1600]],
  },
  video3: {
    lead: "Qual comércio", // tinta, linha de apoio
    highlight: "PRECISA", // coral, com marcador amarelo (como o "NÃO")
    tail: "estar aqui?", // tinta, mesmo tamanho da linha 1
    leadSize: 92,
    tailSize: 92,
    highlightSize: 175, // "PRECISA" com ~729px: já dentro dos 72% da largura
    markerWidth: 790,
    offsetY: 164, // bloco centrado nos recortes 3:4 e 4:5
    highlightShift: -37, // ~55px entre a cedilha do "ç" e o topo de "PRECISA"
    tailShift: -153, // ~45px entre o marcador e "estar aqui?"
    twinkles: [[130, 400], [950, 430], [900, 300], [215, 640], [865, 600], [140, 1470], [940, 1450], [210, 1590], [880, 1600]],
  },
};
