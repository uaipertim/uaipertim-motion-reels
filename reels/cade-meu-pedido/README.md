# Reel "Cadê meu pedido?" (Instagram @uaipertim · sex 27/11, 20h)

Uma demonstração rápida do app com as telas reais, com o destaque no **acompanhamento do pedido**, narrada pelo Pertim. Mesma
linha visual e técnica do "Pão de Queijo Points", sem repetir a estrutura do "Olha ele por dentro!": o tour é rápido e o
acompanhamento é a cena mais longa.

- Formato 9:16, 1080×1920 a **30 fps**, com **30,00 s** (900 quadros).
- Composição Remotion: `src/cade-meu-pedido/CadeMeuPedido.tsx` (`CadeMeuPedido`).
- Roteiro: `roteiro.json`; posições: `layout.json`.

## Roteiro e cenas (todo corte numa batida)

Trilha animada do app, 120 BPM, no modo **grade** do `linha.py`, **no nível padrão** (sem `trilha_db`). Ela toca também no
gancho e no fecho sem fala. A nota **"Lojas e valores ilustrativos"** fica fixa no rodapé (y 1584) enquanto as telas aparecem.

| # | cena | tempo | voz | o que acontece |
|---|---|---|---|---|
| 1 | gancho | 0,0–5,0 s | "Pediu um lanche e ficou de olho no portão, perguntando: cadê meu pedido?" | já no quadro 0: o muro, o portão, o relógio girando e o Pertim espiando por cima do portão (expressão "surpreso", olhando pra câmera); o balão "cadê meu pedido?" pipoca em 0,45 s e pula de novo em "cadê" |
| 2 | whatsapp | 5,0–9,0 s | "No UaiPertim, cê não precisa ficar perguntando no WhatsApp." | os balões "e aí, já saiu?", "e aí??", "já saiu?", "cadê meu pedido?" se empilham e somem com um "puf!" no fim de "WhatsApp" |
| 3 | pedido | 9,0–13,0 s | "Escolhe a loja, monta a sacola e fecha o pedido." | o celular sobe com o Início; toque na loja → Loja; toque no "+" (com o "+1") e em "Ver sacola" → Sacola; toque em "Continuar" → Checkout; toque em "Fazer pedido e pagar" |
| 4 | pagamento | 13,0–17,0 s | "Paga no Pix pelo app, no cartão… ou na entrega." | Pix.png com a lupa no QR; em "cartão", o Checkout volta com a opção "Cartão de crédito" acesa; em "entrega", "Pagar na entrega" acende e pipoca o selo verde "ou na entrega" |
| 5 | acompanha | 17,0–22,5 s | "E acompanha tudo: aceito, em preparo, pronto… saiu pra entrega!" | Acompanhar.png na linha do tempo e o painel "Pedido #UP-1024" com a barrinha: Aceito → Em preparo → Pronto → Saiu para entrega acendem cada um na sua palavra e a motinha anda até ele; as linhas da tela acendem junto; o Pertim comemora no "saiu" |
| 6 | aviso | 22,5–25,5 s | "E quando sai, chega o aviso no celular." | a notificação "UaiPertim · agora / Seu pedido saiu para entrega 🛵" cai no topo do celular e o sininho toca em "aviso" |
| 7 | fecho | 25,5–30,0 s | "Quantas vezes cê já perguntou 'cadê meu pedido'? Conta aqui!" | o celular sai; o Pertim chega no portão com a sacola; a logo redonda (sem fundo branco) entra em "Quantas" e fica parada até o fim (3,8 s), com "Tudo pertim de você."; em "Conta", ele põe a sacola no chão e acena, e entra o balão "Conta aqui 👇" |

## Decisões

- **O cartão aparece no Checkout** (decisão de 2026-11-24): a opção "Cartão de crédito" da Checkout.png acende. A
  Cartao.png continua fora: o README das telas marca "não usar por enquanto", e ela mostra "Varanda Burguer", "página segura
  do Asaas" e o selo "Aguardando".
- **A tela Acompanhar começa rolada 700 px**, e o painel dos status abre logo antes da tela entrar, cobrindo o alto dela. O
  alto da tela tem o Pertim de motinha com a expressão "apressado" (sobrancelhas inclinadas), que pode ler como bravo. As
  linhas da linha do tempo ficam visíveis logo abaixo do painel.
- **A tela Acompanhar tem 4 linhas** (Pagamento confirmado, Loja aceitou e preparou, Saiu para entrega, Entregue). Por isso os
  4 status pedidos vão no painel, e Aceito, Em preparo e Pronto acendem a linha "Loja aceitou e preparou".
- **A logo do fecho entra em "Quantas"**, não em "Conta": assim fica parada 3 s no fim e o Reel cabe em 30 s.
- **Pertim V1** sempre olhando para a câmera; a boca vem dos visemas da voz. No canto de baixo à esquerda nas cenas 2–6.
  Nunca bravo nem "apressado".
- **Legenda nova (`LegendaPop`)**, como no "Pão de Queijo Points": faixa **x 110–906**, y 1400–1548, palavras-chave em
  amarelo/laranja (`"chaves"` no roteiro). Nenhum bloco termina em palavrinha de ligação ("e ficou / de olho no portão").
- **No QA, o muro e o portão são cenário:** ficam fora da máscara do conteúdo, como a rua do "Seja entregador parceiro".

## Voz

- **Voz:** Victor Pinho (`LuQ9eaWO9yCQrR73VQFa`), perfil `narracao` (eleven_v4). Cada fala é uma geração inteira.
- **Pronúncia:** "UaiPertim" vai como "Uai pertím" e "WhatsApp" como "Uátsap" (`pronuncia` no topo do roteiro). Na tela,
  a grafia oficial.
- **Fala 7, a pergunta** (`"pergunta": true`, wh-question): o pico de F0 do trecho da pergunta tem de estar em "Quantas".
  Ficou a tomada **B** (seed 1042). O contorno sobe direto em "Quantas" e cai depois, sem saltos de oitava; a C também
  tinha o pico na interrogativa, mas com o F0 oscilando.

| tomada | seed | pico da pergunta | na interrogativa? |
|---|---|---|---|
| A | 42 | 374 Hz em 2,29 s | não |
| **B (usada)** | 1042 | 356 Hz em 0,16 s | **sim** (+13,5 st sobre o resto) |
| C | 2042 | 377 Hz em 0,27 s | sim (contorno irregular) |
| D | 3042 | 383 Hz em 2,31 s | não |

- **As outras falas:** seed 42.

## Capa

`CapaReel-cade-meu-pedido` (`src/covers/capasReels.ts`), no padrão da grade: selo "CONHEÇA", fundo creme com raios, o celular
com a tela de acompanhamento ("Saiu para entrega" aceso) e o Pertim espiando por trás dele, com um "?"; título
"Cadê meu / *pedido*?" com "pedido" em coral no marcador amarelo; `margem: 135` (o QA mede o conteúdo sem o fundo).

## Como refazer

```bash
python3 reels/explica-so/scripts/voz.py cade-meu-pedido                              # a voz (usa a API)
python3 scripts/tomadas.py cade-meu-pedido 6 --seeds 42,1042,2042,3042               # tomadas da pergunta (mede a wh-question)
python3 scripts/tomadas.py cade-meu-pedido 6 --usar B
python3 reels/explica-so/scripts/linha.py cade-meu-pedido                            # as cenas na grade de batidas
python3 reels/cade-meu-pedido/scripts/preparar.py                                    # dados/ (cena, visemas, legenda) + cues.json
python3 reels/explica-so/scripts/audio.py cade-meu-pedido                            # mix.wav (trilha no nível padrão)
node reels/cade-meu-pedido/scripts/render.mjs                                        # output/uaipertim-cade-meu-pedido.mp4
node reels/cade-meu-pedido/scripts/render.mjs capa                                   # output/capa.png + capa-3x4.png
node reels/cade-meu-pedido/scripts/render.mjs mascara                                # máscaras do QA (fora do git)
python3 reels/cade-meu-pedido/scripts/qa.py                                          # output/revisao/relatorio-tecnico.txt
```

`render.mjs prancha <png> <seg> …` monta uma prancha de quadros para revisar.

## Saída (`output/`)

- `uaipertim-cade-meu-pedido.mp4`: o Reel (H.264 yuv420p, 1080×1920, 30 fps, 30,00 s, AAC 48 kHz estéreo).
- `capa.png` (9:16) e `capa-3x4.png` (o recorte da grade, y 240–1680).
- `legenda.txt`: a legenda do post e a sugestão de comentário fixado.
- `revisao/relatorio-tecnico.txt` (inclui o nível da trilha comparado com o do "Olha ele por dentro!") e
  `revisao/f0-cena-7.png`.
