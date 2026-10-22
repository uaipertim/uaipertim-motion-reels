import { L, Linha } from "./kit";

// Stories de destaque: TODOS os textos de tela (os aprovados), já quebrados em linhas pelas regras fixas:
// nunca separar as duas últimas palavras de uma frase, emoji grudado na última palavra, "do Glória" junto.
// L("texto", ["destaque em coral"], …). Sem @ do perfil.

type CardTexto = { titulo: Linha[]; apoio: Linha[]; emoji?: string };

export const DUVIDAS: Record<"card1" | "card2" | "card3" | "card4", CardTexto> = {
  card1: { titulo: [L(["Dúvidas?"])], emoji: "🤔", apoio: [L("As perguntas que mais"), L("chegam pra gente.")] },
  card2: { titulo: [L("É ", ["pago"], " pra"), L("quem compra?")], apoio: [L("Não. Pra quem"), L("compra, é ", ["grátis."])] },
  card3: { titulo: [L(["Onde"]), L("vai funcionar?")], apoio: [L("Começando pelo ", ["Glória."]), L("Depois, mais"), L("cidades de Minas.")] },
  card4: { titulo: [L(["Quando"], " começa?")], apoio: [L("Ativa o ", ["sininho"], " 🔔"), L("no perfil pra saber primeiro.")] },
};

export const LOJISTA: Record<"card1" | "card2" | "card3" | "card4", CardTexto> = {
  card1: { titulo: [L("Tem ", ["comércio"]), L("no Glória?")], emoji: "👀", apoio: [L("Esse destaque é pra ", ["você."])] },
  card2: { titulo: [L("Seu ", ["comércio"], " no"), L("celular da cidade")], apoio: [L("Quem é do Glória vai"), L("poder pedir de ", ["você."])] },
  card3: { titulo: [L(["Parceiro"], " desde"), L("o começo")], apoio: [L("Os primeiros comércios"), L("parceiros entram na"), L("nossa ", ["divulgação."])] },
  card4: { titulo: [L("Quer saber ", ["mais?"])], apoio: [L("Chama a gente no ", ["direct"], " 📩")] },
};

export const EXPLICA_SO = {
  card1: {
    chip: "SÉRIE NOVA",
    titulo: [L("Explica, ", ["Sô!"])],
    apoio: [L("O comércio do Glória"), L("explicado do jeito mineiro."), L("Episódio novo ", ["toda semana."])],
  },
};
