import { C } from "../../config/theme";

// Vídeo 3 — "Qual comércio PRECISA estar aqui?": TODOS os textos de tela por cena.
// Sem narração e sem legenda: estes textos contam a história sozinhos.
// Tempos em ./timeline.json (fonte única para vídeo e áudio).
// Regra: nenhum nome de estabelecimento real — só termos genéricos.
export const TEXTS3 = {
  s1: {
    question: "?",
    line1: "Qual comércio da cidade",
    emphasis: "PRECISA",
    line3: "estar aqui?",
  },
  s2: {
    line1: "Elas tão esperando",
    line2: "você…", // + 👀 (olhinhos desenhados)
    field: "Adicione um comentário…",
    publish: "Publicar",
  },
  s3: {
    line1: "A cidade toda",
    line2: "respondendo!", // + 💬
    // balões de comentário: avatar = bolinha colorida (sem rosto); shop = lojinha que acende
    balloons: [
      { shop: "padaria", text: "a padaria da esquina!", icon: "pao", avatar: C.amarelo },
      { shop: "mercado", text: "o mercadinho do bairro", icon: "carrinho", avatar: C.verde },
      { shop: "restaurante", text: "aquele restaurante bom demais", icon: "delicia", avatar: C.coralLight },
      { shop: "pet", text: "o pet shop que cuida do meu bichinho", icon: "patinha", avatar: C.verdeLight },
      { shop: "farmacia", text: "a farmácia de sempre", icon: "remedio", avatar: C.amareloDark },
    ],
    counterCap: "999+",
  },
  s4: {
    line1: "Comenta e marca",
    line2: "o dono", // + 📣
    at: "@",
    tag: "padaria", // genérico (categoria), não é nome de estabelecimento
    field: "Adicione um comentário…",
    publish: "Publicar",
  },
  s5: {
    headline: ["Bora montar o ", "UaiPertim"], // "UaiPertim" em coral
    headline2: "com a cara da nossa cidade.",
    pill1: "Comenta e marca o dono", // 💬 (pílula coral)
    pill2: "Segue o @uaipertim", // 🔔 (pílula branca)
    ribbon: "CHEGANDO EM BREVE",
    slogan: ["Tudo ", "pertim", " de você."],
    handle: "@uaipertim",
  },
} as const;
