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
