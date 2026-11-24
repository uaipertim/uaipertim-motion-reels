# Carrosséis animados (lâminas em vídeo, em loop)

São carrosséis do Instagram em que cada lâmina é um vídeo curto em loop. O motor é o do Quiz #01
([`carrosseis/quiz/`](../quiz)):

- `scripts/quiz.mjs` renderiza;
- `scripts/quiz_qa.py` faz o QA e a prévia.

Os dois recebem o caminho do JSON. Um JSON com `"composicao"` diz:

- a composição Remotion;
- o formato (`"formato": [1080, 1350]`) e o respiro de cima e de baixo (`"respiro"`);
- a pasta de saída (`"saida"`) e o nome da capa (`"capa_arquivo"`);
- as lâminas (`"laminas"`), cada uma com:
  - `segundos`;
  - `estatico`: o segundo do quadro que vira o PNG do plano B;
  - `crf` (opcional): a qualidade do H.264.

| # | carrossel | publicação | JSON | composição | saída |
|---|---|---|---|---|---|
| 02 | "Como chega o seu pedido?" | ter 24/11, 12h | [`02-como-chega-o-seu-pedido.json`](02-como-chega-o-seu-pedido.json) | `ComoChega` (`src/carrossel-animado/ComoChega.tsx`) | `out/carrosseis/animados/02-como-chega-o-seu-pedido/` |
| 03 | "Seu comércio no UaiPertim" (pro lojista) | qui 26/11, 12h | [`03-seu-comercio-no-uaipertim.json`](03-seu-comercio-no-uaipertim.json) | `SeuComercio` (`src/carrossel-animado/SeuComercio.tsx`) | `out/carrosseis/animados/03-seu-comercio-no-uaipertim/` |

## Formato: 4:5 (1080 × 1350)

O agendador do Instagram não aceita vídeo 3:4, por isso os carrosséis animados saem em 4:5 a partir do #02 (o Quiz #01 é 3:4).

- H.264, 30 fps, sem áudio, de 6 a 8 s por lâmina.
- Todo o conteúdo fica em x 135–945 e y 60–1290 (respiro de 60 px em cima e embaixo).
- O quadro 0 da lâmina 1 é a capa completa, e `capa-4x5.png` é esse quadro.
- Toda animação é periódica na duração da lâmina: os raios giram 20° (um raio), e os brilhos, a respiração e as rodas fecham
  ciclos inteiros. O que acende, apaga suave antes do fim.
- **Emenda do loop no MP4:** o último quadro também é quadro-chave (I), como o primeiro (`-force_key_frames`), para a volta
  não ganhar a diferença de compressão de um quadro P. Na capa, que se mexe inteira, o `crf` é 12.

## #02 "Como chega o seu pedido?" (7 lâminas, 49 s no total)

| lâmina | o que mostra | duração | PNG (plano B) |
|---|---|---|---|
| 1 · capa | selo "COMO FUNCIONA"; o Pertim na motinha (com a mochila de entrega) entre a lojinha e a casa, a estrada correndo; "Como *chega* o seu pedido?"; "Arrasta pra ver →" | 6 s | quadro 0 |
| 2 · escolha | Checkout.png num celular; o destaque e o toque passam por "Entrega" e "Retirar na loja", e os chips Entrega / Retirada acendem junto; "Cada loja escolhe as formas que oferece"; "Lojas e valores ilustrativos" | 7 s | 1,8 s (Entrega) |
| 3 · entrega: a loja | "Escolheu entrega? Quem leva é *a loja* que decide" + "Pode ser a equipe da própria loja…": a motinha sai da lojinha e chega na porta da casa | 7 s | 3,2 s |
| 4 · entrega: parceiro | "…ou um entregador *parceiro* do UaiPertim": Chama → Aceita → Coleta → Leva acendem; o selo verde "Cadastrado e conferido pessoalmente pela equipe" (com brilho); o cadeado e "Seu telefone só aparece pro entregador depois que ele coleta o pedido" | 8 s | 4,4 s |
| 5 · retirada | "Prefere buscar? Retirada no *balcão*": "Passou pertim? Busca na loja, sem taxa de entrega."; o Pertim acenando na porta da lojinha | 7 s | 2,0 s |
| 6 · acompanha | Acompanhar.png num celular e o cartão com os 5 status (Aceito → Em preparo → Pronto → Saiu para entrega → Entregue) acendendo; a notificação "Seu pedido saiu para entrega 🛵"; "Lojas e valores ilustrativos" | 8 s | 5,2 s |
| 7 · fecho | "E você, vai de *entrega* ou *retirada*?"; os cartões "Entrega" (a motinha) e "Retirada no balcão" (o balcão) acendem um a um; "Comenta: entrega ou retirada? 👇"; o Pertim; a logo redonda sem fundo e "Tudo pertim de você" | 7 s | quadro 0 |

**Decisões:**

- **O que o cliente escolhe (correção de 2026-11-20):** só entre ENTREGA e RETIRADA NO BALCÃO. Na entrega, quem leva é a
  loja que decide: a equipe da própria loja (lâmina 3) ou um entregador parceiro da rede (lâmina 4). Por isso:
  - as lâminas 3–5 não têm mais número;
  - a enquete do fecho tem só as duas opções que o cliente escolhe.
- **Quebra de linha fixa:** `quebra` (opcional) no JSON fixa as linhas de um título (lâminas 4 e 7). Sem ela, o título quebra
  sozinho em até 3 linhas.

- **A tela Acompanhar** tem 4 linhas: Pagamento confirmado, Loja aceitou e preparou, Saiu para entrega, Entregue. Por isso:
  - os 5 status pedidos vão num cartão ao lado;
  - as linhas da tela acendem junto com o status que corresponde (Aceito, Em preparo e Pronto na linha "Loja aceitou e
    preparou").
- **O celular da Acompanhar começa na linha do tempo** (rola 1000 px do PNG). O alto da tela tem o Pertim de motinha com a
  expressão "apressado" (sobrancelhas inclinadas), que pode ler como bravo.
- **A tela Checkout** já mostra "Entrega" selecionada; o destaque (anel + toque) passa pelas duas abas sem redesenhar o app.
- **Palavras:** "entrega" sempre (nunca "frete"); "Pertim/pertim" como na tela; nada de "aguarde" ou "não é app".

**Refazer:**

```bash
node scripts/quiz.mjs carrosseis/animados/02-como-chega-o-seu-pedido.json            # lamina-1..7.mp4/.png + capa-4x5.png
node scripts/quiz.mjs carrosseis/animados/02-como-chega-o-seu-pedido.json mascara    # máscaras do QA (sem fundo)
node scripts/quiz.mjs carrosseis/animados/02-como-chega-o-seu-pedido.json loop       # quadros da emenda sem compressão
python3 scripts/quiz_qa.py carrosseis/animados/02-como-chega-o-seu-pedido.json       # revisao/relatorio-tecnico.txt + previa.png
```

`SO=3,5` antes do comando refaz só essas lâminas. `quadros <lâmina> <quadro…>` tira quadros soltos.

## #03 "Seu comércio no UaiPertim" (7 lâminas, 49 s no total)

Para o LOJISTA do Glória: atrair as primeiras lojas parceiras do lançamento. Selo "PRO LOJISTA" (com a lojinha no lugar do pin).

| lâmina | o que mostra | duração | PNG (plano B) |
|---|---|---|---|
| 1 · capa | selo "PRO LOJISTA"; a lojinha com toldo (olhinhos, placa balançando) e o Pertim apontando pra ela, olhando pra câmera; "Seu *comércio* no UaiPertim"; "Arrasta pra ver →" | 6 s | quadro 0 |
| 2 · vitrine | "Sua vitrine montada *junto* com você" + "No cadastro, a nossa equipe monta o cardápio, as fotos e os preços com você. Depois, cê atualiza tudo pelo painel."; LojistaCardapio.png num notebook: os anéis passam pelo cardápio, pelas fotos e pelos preços, e os chips Cardápio · Fotos · Preços acendem; "Lojas e valores ilustrativos" | 7 s | 4,4 s |
| 3 · pedido no painel | "Pedido chega *organizado* no painel" + "Sem ficar repetindo cardápio e preço no WhatsApp o dia todo."; os balões de pergunta ("Qual o preço?", "Manda o cardápio?", "Ainda tem?") somem e um pedido novo chega na coluna "Novos" do painel (Lojista.png, recorte sem os números do dia), com o aviso "Novo pedido!" e o toque em "Aceitar"; "Lojas e valores ilustrativos" | 7 s | 3,6 s |
| 4 · entrega | "Entrega do seu *jeito*" + "A loja escolhe como faz:"; os cartões Equipe da própria loja · Entregador parceiro · Retirada no balcão acendem um a um | 7 s | 4,6 s |
| 5 · pagamento | "Recebe pelo app ou na *entrega*": Pelo app (Pix, Cartão) e Na entrega (Dinheiro, Pix, Cartão) acendem; o selo amarelo "Comissão de 5% só nos pedidos pagos pelo app"; "As taxas do meio de pagamento ficam com a loja." | 7 s | 4,2 s |
| 6 · mensalidade | "*3* *meses* sem mensalidade": o contador 0 → 3 meses (com o calendário); "Pras lojas do lançamento."; "Depois, R$ 49,90/mês"; o cartão verde "Pão de Queijo Points sem custo pra loja: os prêmios são bancados pelo UaiPertim" | 8 s | 4,8 s |
| 7 · fecho | "Quer sua *loja* no UaiPertim?"; o Pertim acenando ao lado da lojinha (com o cordão de luzinhas); o CTA "Chama a gente no Direct 📩"; uaipertim@uaipertim.com.br; a logo redonda sem fundo e "Tudo pertim de você" | 7 s | quadro 0 |

**Decisões:**

- **Valores** no campo `"valores"` do JSON (3 meses, R$ 49,90, 5%); o QA dos textos confere se a tela (OCR), as lâminas e a
  legenda batem com ele e se não aparece nenhum outro valor.
- **Sem promessa de vendas ou resultado**; "entrega", nunca "frete"; o WhatsApp só aparece como o jeito antigo (lâmina 3),
  nunca como canal de suporte. O contato é o Direct e o e-mail.
- **A tela Lojista.png** entra recortada nas colunas "Novos" e "Em preparo": os números do dia (pedidos, vendas) ficam de fora,
  para não ler como resultado prometido.
- **Marcador numa palavra só:** dentro de um marcador de várias palavras o espaço fica estreito ("seu jeito" lia como
  "seujeito" no OCR). Por isso "Entrega do seu *jeito*", "ou na *entrega*", "Quer sua *loja*" e "*3* *meses*".
- **O contador da lâmina 6** começa invisível no quadro 0 e some no fim, para a emenda do loop não saltar de 3 para 0.

**QA dos textos** (`scripts/carrossel_textos_qa.py <json>`, além do `quiz_qa.py`): OCR (tesseract, português, 12 passadas
por canal de cor) do PNG de cada lâmina. Confere que nenhum par de palavras vizinhas aparece grudado, que ≥ 90% das palavras de
tela são lidas (legibilidade), que a menor fonte é ≥ 24 px, os valores e as regras de texto. Grava `revisao/textos-qa.txt`.

```bash
node scripts/quiz.mjs carrosseis/animados/03-seu-comercio-no-uaipertim.json            # lamina-1..7.mp4/.png + capa-4x5.png
node scripts/quiz.mjs carrosseis/animados/03-seu-comercio-no-uaipertim.json mascara
node scripts/quiz.mjs carrosseis/animados/03-seu-comercio-no-uaipertim.json loop
python3 scripts/quiz_qa.py carrosseis/animados/03-seu-comercio-no-uaipertim.json       # revisao/relatorio-tecnico.txt + previa.png
python3 scripts/carrossel_textos_qa.py carrosseis/animados/03-seu-comercio-no-uaipertim.json   # revisao/textos-qa.txt
```
