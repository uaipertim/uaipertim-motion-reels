// TODOS os textos de tela, por cena. Edite aqui sem mexer nas animações.
// Tempos ficam em ./timeline.json (fonte única para vídeo e áudio).
export const TEXTS = {
  s1: {
    title: ["Mais um app", "pra baixar?"],
    storageLabel: "Armazenamento",
    storagePercent: 99,
  },
  s2: {
    stamp: ["ARMAZENAMENTO", "CHEIO!"],
    title: ["Não cabe", "mais nada!"],
    newAppBadge: "NOVO",
  },
  s3: {
    // "O UaiPertim NÃO é app."
    lead: "O",
    brandA: "Uai",
    brandB: "Pertim",
    nao: "NÃO",
    tail: "é app.",
  },
  s4: {
    title1: ["É só abrir", "o link"],
    title2: ["Sem baixar", "nada."],
    url: "uaipertim.com.br",
  },
  s5: {
    title: ["Tudo da sua cidade,", "num lugar só."],
    shops: ["MERCADO", "PADARIA", "RESTAURANTE", "FARMÁCIA", "PET SHOP", "LOJINHA"],
  },
  s6: {
    headline: "Segue e ativa o",
    ribbon: "ESTREIA · EM BREVE",
    reminder: "Ative o lembrete",
    slogan: ["Tudo ", "pertim", " de você."],
    handle: "@uaipertim",
  },
  categories: ["Restaurantes", "Mercados", "Farmácias", "Padarias", "Pet Shops"],
} as const;
