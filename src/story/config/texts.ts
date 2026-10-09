// Story "Conheça" (destaque): TODOS os textos de tela por card.
// Sem narração e sem legenda; cada card se explica sozinho (o destaque pode abrir em qualquer card).
// Tempos em ./timeline.json (fonte única para vídeo e áudio).

// ⚠️ ÚNICO TEXTO TEMPORÁRIO do destaque (faixa do card 4). No lançamento, troque aqui
// (ex.: "JÁ ESTÁ NO AR") e rode `npm run render:story` para gerar os MP4 de novo.
export const LAUNCH_TEXT = "CHEGANDO EM BREVE";

export const STORY_TEXTS = {
  card1: {
    hello: "Uai, prazer!", // + 👋
    intro: ["Eu sou o ", "UaiPertim", "."], // "UaiPertim" em coral
    support: ["O comércio da sua cidade,", "num lugar só."],
  },
  card2: {
    text1: ["Não precisa", "baixar nada."],
    text2: ["É só abrir o link", "no navegador."], // + 🔗
    url: "uaipertim.com.br",
  },
  card3: {
    title: ["Tem de tudo,", ["pertim", " de você."]], // 2ª linha: "pertim" em coral
    // ícones de categoria em volta do pin
    categories: [
      { icon: "restaurantes", label: "Restaurantes" },
      { icon: "mercados", label: "Mercados" },
      { icon: "farmacias", label: "Farmácias" },
      { icon: "padarias", label: "Padarias" },
      { icon: "pets", label: "Pet shops" },
      { icon: "agro", label: "Agropecuárias" },
      { icon: "bebidas", label: "Bebidas" },
      { icon: "mais", label: "e muito mais" },
    ],
    city: ["Começando por", "São João Batista do Glória."], // 📍 + cidade
  },
  card4: {
    ribbon: LAUNCH_TEXT,
    cta: ["Segue o ", "@uaipertim", "e ativa o"], // + 🔔
    slogan: ["Tudo ", "pertim", " de você."],
  },
} as const;
