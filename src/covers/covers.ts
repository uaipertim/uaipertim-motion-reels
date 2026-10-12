import type { CoverCardProps } from "../components/Cover";

// Capas (thumbnails) dos Reels: textos e ajustes de cada uma. Componente: components/Cover.tsx (CoverCard).
// Gabarito = frame 268 do Vídeo 1: logo no mesmo lugar e tamanho; destaque com a largura do "NÃO" (~665px,
// ~62% da tela); linhas de apoio com até a largura de "O UaiPertim" (655px); marcador de 64px de espessura.
// Zona segura: logo e texto entre y=285 e y=1635 (grade 3:4 e feed 4:5).
export const COVERS: Record<string, CoverCardProps> = {
  video2: {
    lead: "Vai funcionar", // tinta, linha de apoio
    highlight: "assim, ó", // coral, com marcador amarelo (como o "NÃO")
    leadSize: 94, // maior tamanho em que "Vai funcionar" cabe na largura de "O UaiPertim"
    highlightSize: 158, // "assim, ó" com a largura do "NÃO"
    markerWidth: 660,
    markerThickness: 64,
    logoScale: 1.024,
    highlightShift: 59, // mesmo respiro linha 1 → destaque da capa 3
    markerDrop: 17, // o marcador passa logo abaixo da ponta da vírgula de "assim,"
  },
  video3: {
    lead: "Qual comércio", // tinta, linha de apoio
    highlight: "PRECISA", // coral, com marcador amarelo (como o "NÃO")
    tail: "estar aqui?", // tinta, mesmo tamanho da linha 1
    leadSize: 88, // maior tamanho em que "Qual comércio" cabe na largura de "O UaiPertim"
    tailSize: 88,
    highlightSize: 159, // "PRECISA" com a largura do "NÃO"
    markerWidth: 660,
    markerThickness: 64,
    logoScale: 1.024,
    highlightShift: 44, // destaque centrado entre as linhas de apoio
    markerDrop: -10, // marcador encostando na base do texto, como no "NÃO"
    tailShift: 46, // "estar aqui?" termina onde termina o "é app." (bloco com a altura do frame 268)
  },
};
