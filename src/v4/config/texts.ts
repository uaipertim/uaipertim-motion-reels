// Vídeo 4 — "Ele te acha?" (convite ao comerciante): TODOS os textos de tela por cena.
// Sem narração e sem legenda: estes textos contam a história sozinhos.
// Tempos em ./timeline.json (fonte única para vídeo e áudio).
// Regras: sem WhatsApp e sem telefone; sem condições comerciais; lançamento = "CHEGANDO EM BREVE".
export const TEXTS4 = {
  s1: {
    chip: "Pra você, comerciante", // + 👋
    line1: "Seu cliente já procura",
    line2: "tudo pelo celular.",
    search: "onde comprar aqui…",
  },
  s2: {
    headline: ["Ele te ", "acha?"], // "acha?" com marcador amarelo
    subline1: "Muito comércio bom ainda",
    subline2: ["é ", "invisível", " na internet."], // "invisível" em coral apagado
    stamp: "NÃO ENCONTRADO",
  },
  s3: {
    line1: ["O ", "UaiPertim", " coloca você"], // "UaiPertim" em coral
    line2: "no mapa da cidade.", // + 📍
  },
  s4: {
    // cards de benefício: icon = desenho do "emoji" (👀 📲 📦)
    cards: [
      { icon: "olhos", text: "Mais visibilidade na cidade" },
      { icon: "celular", text: "Seus clientes te encontram fácil" },
      { icon: "caixa", text: "Você mesmo cadastra seus produtos" },
    ],
  },
  s5: {
    seal: ["Não precisa entender", "de tecnologia"], // + 😉
    // \n = quebra de linha na placa
    steps: [
      { icon: "direct", text: "Chama a gente\nno direct" },
      { icon: "cadastro", text: "Faz o cadastro com\num representante" },
      { icon: "foguete", text: "Seus produtos\nno ar" },
    ],
  },
  s6: {
    headline: ["Seja um dos primeiros", "da cidade."],
    cta: "Chama a gente no direct", // + 💬 (fica parado na tela até o fim)
    handle: "@uaipertim",
    ribbon: "CHEGANDO EM BREVE",
    slogan: ["Tudo ", "pertim", " de você."],
  },
} as const;
