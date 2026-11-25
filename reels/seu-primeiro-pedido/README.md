# Reel "Seu primeiro pedido" (Instagram @uaipertim · dom 29/11, 20h)

Do começo ao fim, como fazer o primeiro pedido no UaiPertim, com as telas do app e narração do Pertim. Não repete o "Cadê meu
pedido?": o foco é **como pedir**, até a confirmação. O acompanhamento aparece só num relance ("Pedido recebido").

- Formato 9:16, 1080×1920 a **30 fps**, com **30,50 s** (915 quadros).
- Composição Remotion: `src/seu-primeiro-pedido/SeuPrimeiroPedido.tsx` (`SeuPrimeiroPedido`), no molde do "Cadê meu pedido?".
- Roteiro: `roteiro.json`; posições: `layout.json`.

## O fluxo do app (conferido no repositório `uaipertim/uaipertim`, só leitura, HEAD b09f362)

A ordem das telas e os textos são os do app:

1. Início (`Main.png`).
2. Loja (`Loja.png`).
3. Produto (`Produto.png`), com as opções "Ponto da carne" (obrigatório) e "Turbine seu lanche" e o botão "Adicionar"
   (`src/components/product/ProductSheet.tsx`: "Adicionar à sacola").
4. A barra "Ver sacola" (`MobileFixedCartBar.tsx`).
5. Sacola (`Sacola.png`), com o botão "Continuar".
6. Finalizar pedido (`Checkout.png`; `src/components/checkout/CheckoutSheet.tsx`): "Entrega" ou "Retirar na loja", o
   endereço, "Como você quer pagar?" (Pix, Cartão de crédito, Pagar na entrega) e "Fazer pedido e pagar"
   (`ClientArea.tsx`: "Fazer pedido" quando é na entrega).
7. O primeiro status, recriado no estilo do app com os textos de `src/components/account/trackingView.ts`: no pagamento pelo
   app, "Pago pelo app · Pagamento confirmado! · Burger do Glória já recebeu seu pedido e vai confirmar em instantes."; o
   primeiro passo, "Pedido recebido", aceso; os seguintes ("Pedido aceito", "Em preparação", "Saiu para entrega") apagados.

O app chama de **sacola** (não "carrinho"). A AcompanharPagamento.png ("Falta só pagar") não entra.

**Pagamento:** a narração segue o texto do carrossel #04 ("no Pix ou no cartão pelo app, ou na entrega"). Segundo o
`CLAUDE.md` do app, hoje o MVP recebe dinheiro, cartão e Pix na entrega; o Pix e o cartão pelo app (página do Asaas) entram antes do
piloto oficial, já homologados no sandbox.

**Pontos:** `loyaltyService.ts`, padrão de 30 de boas-vindas (só depois de confirmar o e-mail) e 20 por pedido concluído
(`server/orderStatusChange.ts`). A fala não cita número ("quando o pedido chega, já rende Pão de Queijo Points"). A tela
mostra só o "+20 pontos a cada pedido concluído".

## Roteiro e cenas (todo corte numa batida)

Trilha animada do app, 120 BPM, no modo **grade** do `linha.py`, **no nível padrão** (sem `trilha_db`). A nota **"Lojas e
valores ilustrativos"** fica fixa no rodapé enquanto as telas aparecem.

| # | cena | tempo | voz | o que acontece |
|---|---|---|---|---|
| 1 | gancho | 0,0–3,5 s | "Seu primeiro pedido no UaiPertim? É facim, ó!" | já no quadro 0: "Seu *primeiro* pedido?" no alto e o Pertim segurando o celular (a tela acende); em "facim", o selo "É facim!" com brilhos |
| 2 | loja | 3,5–6,0 s | "Abre o app e escolhe a loja." | o celular sobe com o Início; o anel e o toque na loja (Burger do Glória) → Loja |
| 3 | sacola | 6,0–9,5 s | "Toca no lanche, escolhe as opções e põe na sacola." | o toque no Smash Duplo → Produto, que rola até as opções; "Ao ponto" e "Bacon crocante" acendem; o toque em "Adicionar" → de volta à Loja, com o "+1" no contador da sacola |
| 4 | entrega | 9,5–15,5 s | "No fim, cê escolhe: entrega ou retirada. Se for entrega, confere o endereço." | o toque em "Ver sacola" → Sacola; o toque em "Continuar" → Finalizar pedido; "Entrega" e "Retirar na loja" acendem, cada um na sua palavra; o endereço acende |
| 5 | pagamento | 15,5–22,5 s | "Escolhe como pagar: no Pix ou no cartão pelo app, ou na entrega. Aí é só fazer o pedido!" | Pix, "Cartão de crédito" e "Pagar na entrega" acendem; o toque em "Fazer pedido e pagar"; o cartão "Pagamento confirmado!" com "Pedido recebido" aceso, num relance |
| 6 | bônus | 22,5–26,5 s | "E quando o pedido chega, já rende Pão de Queijo Points!" | o pão de queijo fumegando; as moedinhas saltam e giram em volta; o cartão "Pão de Queijo Points · +20 pontos a cada pedido concluído" |
| 7 | fecho | 26,5–30,5 s | "Segue a gente pra saber do lançamento!" | a logo redonda (parada nos 3,3 s finais), @uaipertim, "Tudo pertim de você." e a pílula "Segue a gente pra saber do lançamento"; o Pertim acena |

## Voz

- **Voz:** Victor Pinho (`LuQ9eaWO9yCQrR73VQFa`), perfil `narracao` (eleven_v4, estabilidade 0,5 · semelhança 0,75), as
  mesmas do "Cadê meu pedido?". Cada fala é uma geração inteira.
- **Pronúncia:** "UaiPertim" vai como "Uai pertím" (`pronuncia` no topo do roteiro). Na tela, a grafia oficial.
- **Fala 1, a pergunta** (`"pergunta": true`, de sim/não): "Seu primeiro pedido no UaiPertim?". O F0 tem de subir
  ≥ +8 st de "no" até o pico em "pertím" (a tônica TÍM). As 4 tomadas sobem. Ficou a **C** (seed 2042): é a que sobe mais e
  termina mais alto, e a única em que o "pertím" fecha em "im" (o F2 cai).

| tomada | seed | "no" → pico | subida | fim | "pertím" fecha em |
|---|---|---|---|---|---|
| A | 42 | 135 → 290 Hz | +13,3 st | 189 Hz | "in" |
| B | 1042 | 148 → 269 Hz | +10,3 st | 207 Hz | "in" |
| **C (usada)** | 2042 | 138 → 342 Hz | **+15,7 st** | **252 Hz** | **"im"** |
| D | 3042 | 131 → 329 Hz | +16,0 st | 206 Hz | "in" |

- **Fala 6:** seed 3042. As seeds 42, 1042 e 2042 saíram com a fala cortada no fim e não passaram na conferência.
- **As outras falas:** seed 42.

## Capa

`CapaReel-seu-primeiro-pedido` (`src/covers/capasReels.ts`), no padrão da grade: selo "PASSO A PASSO", fundo creme com raios,
o celular na tela do Smash Duplo com o toque em "Adicionar", o Pertim apontando pro celular e a sacolinha com o "+1"; título
"Seu *primeiro* / pedido" com "primeiro" em coral no marcador amarelo; `margem: 135` (o QA mede o conteúdo sem o fundo).

## Como refazer

```bash
python3 reels/explica-so/scripts/voz.py seu-primeiro-pedido                          # a voz (usa a API)
python3 scripts/tomadas.py seu-primeiro-pedido 0 --seeds 42,1042,2042,3042           # tomadas da pergunta
python3 scripts/tomadas.py seu-primeiro-pedido 0 --usar C
python3 reels/explica-so/scripts/linha.py seu-primeiro-pedido                        # as cenas na grade de batidas
python3 reels/seu-primeiro-pedido/scripts/preparar.py                                # dados/ (cena, visemas, legenda) + cues.json
python3 reels/explica-so/scripts/audio.py seu-primeiro-pedido                        # mix.wav (trilha no nível padrão)
node reels/seu-primeiro-pedido/scripts/render.mjs                                    # output/uaipertim-seu-primeiro-pedido.mp4
node reels/seu-primeiro-pedido/scripts/render.mjs capa                               # output/capa.png + capa-3x4.png
node reels/seu-primeiro-pedido/scripts/render.mjs mascara                            # máscaras do QA (fora do git)
python3 reels/seu-primeiro-pedido/scripts/qa.py                                      # output/revisao/relatorio-tecnico.txt
```

A chave do ElevenLabs nunca fica no repositório: o proxy da rede a injeta no cabeçalho `xi-api-key`.

## Saída (`output/`)

- `uaipertim-seu-primeiro-pedido.mp4`: o Reel (H.264 yuv420p, 1080×1920, 30 fps, 30,50 s, AAC 48 kHz estéreo).
- `capa.png` (9:16) e `capa-3x4.png` (o recorte da grade, y 240–1680).
- `legenda.txt`: a legenda do post e a sugestão de comentário fixado.
- `revisao/relatorio-tecnico.txt` e `revisao/f0-cena-1.png`.
