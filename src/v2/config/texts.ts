// Vídeo 2 — "Vai funcionar assim, ó": TODOS os textos de tela por cena.
// Tempos em ./timeline.json (fonte única para vídeo e áudio).
export const TEXTS2 = {
  s1: {
    title: ["Vai funcionar", "assim, ó"],
    chip: "PRÉVIA",
  },
  s2: {
    step: "Escolha a sua cidade",
    city: "São João Batista do Glória",
    uf: "MG",
    action: "ALTERAR",
  },
  s3: {
    step: "Escolha a categoria",
    step2: "ou busque o que quiser",
    search: "Busque por comida ou estabelecimento",
    typed: "pão de queijo",
    section: "Categorias",
  },
  s4: {
    step: "Veja quem tá aberto e peça!",
    list: "Abertos agora",
    // exemplo genérico — não usar nome de estabelecimento real
    card: { name: "Comércio da cidade", subtitle: "Lanches · Centro", rating: "4.9", time: "30–45 min", open: "Aberto", button: "Pedir agora ›" },
  },
  s5: {
    title: ["Acompanha tudo", "em tempo real"],
    header: "Seu pedido",
    steps: ["Pedido recebido", "Preparando", "A caminho", "Chegou!"],
  },
  s6: {
    head1: "Facim, facim.",
    head2: "Segue e ativa o",
    url: "uaipertim.com.br",
    selo: "SEM BAIXAR NADA",
    ribbon: "CHEGANDO EM BREVE",
    slogan: ["Tudo ", "pertim", " de você."],
    handle: "@uaipertim",
  },
} as const;
