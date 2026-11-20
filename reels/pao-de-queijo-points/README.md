# Reel "Pão de Queijo Points" (Instagram @uaipertim · seg 23/11, 20h)

Apresenta o programa de fidelidade do app, narrado pelo Pertim, com a tela real do app num celular animado. É a mesma
linha do "Olha ele por dentro!".

- Formato 9:16, 1080×1920 a **30 fps**, com **28,50 s** (855 quadros).
- Composição Remotion: `src/pao-de-queijo-points/PaoDeQueijoPoints.tsx` (`PaoDeQueijoPoints`).
- Roteiro: `roteiro.json`; posições: `layout.json`.

As telas são `public/telas-app/celular/Main.png` (a abertura) e `Fidelidade.png`. Prêmios e valores são fictícios: a nota
**"Prêmios e valores ilustrativos"** fica fixa no rodapé (y 1584) enquanto a tela aparece, até os prêmios saírem no fecho.

## Roteiro e cenas (todo corte numa batida)

Trilha animada do app, 120 BPM, no modo **grade** do `linha.py`. Ela fica **baixinha** por baixo da voz: `"trilha_db": -15`
no roteiro (o padrão da animada é −10), com o ducking de sempre.

| # | cena | tempo (batidas) | voz | o que acontece |
|---|---|---|---|---|
| 1 | gancho | 0,0–5,0 s (0–10) | "Sabia que pedir no UaiPertim rende pão de queijo… em pontos?" | ver a lista abaixo |
| 2 | boas-vindas | 5,0–8,5 s (10–17) | "Cê já começa com trinta pontos de boas-vindas." | toque em "Ver prêmios" e a tela do Pão de Queijo Points entra empurrando; o saldo acende; a lupa dos cartões abre e o "+30" acende em "trinta" |
| 3 | pedido | 8,5–12,0 s (17–24) | "E a cada pedido concluído, ganha mais vinte." | o "+20" acende em "pedido" e pula, com um "+20" subindo, em "vinte" |
| 4 | troca | 12,0–16,5 s (24–33) | "Juntou? Troca por cupom de desconto… ou até pela entrega." | a lupa da lista "Troque seus pontos"; os 2 descontos acendem em "desconto" (toque em "Resgatar"); a lupa desce e o "Benefício na entrega" acende em "entrega" |
| 5 | níveis | 16,5–22,5 s (33–45) | "E ainda vai subindo de nível: Bronze, Prata, Ouro… até Diamante!" | a tela rola até "Níveis"; a lupa; cada nível acende na sua palavra; no "Diamante", confete e o Pertim comemora |
| 6 | fecho | 22,5–28,5 s (45–57) | "Qual prêmio cê ia pegar primeiro? Conta aqui!" | ver a lista abaixo |

**Gancho (cena 1):**

- O pão de queijo quentinho, com fumacinha, já está na tela no quadro 0.
- Em 0,7 s ele estoura em 14 moedinhas que caem num contador: 0 → 150 pontos às 1,9 s.
- Em "rende", o celular sobe com o Início e o contador voa para o banner "Pão de Queijo Points".
- O banner acende em "pontos".

**Fecho (cena 6):**

- O celular se afasta e os 4 prêmios da lista (recortes da própria tela) ficam em leque, com um "?".
- Em "Conta", os prêmios saem e entram:
  - a logo, que para em 25,13 s e fica 3,4 s;
  - "Tudo pertim de você.";
  - o balão "Conta nos comentários".
- O Pertim acena e pisca.

## Decisões

- **Celular, lupas e toques** são os do "Olha ele por dentro!":
  - o celular genérico em x 245–935;
  - as lupas no alto, maiores aqui (y 300–780), com o trecho aumentado tracejado no celular.
- **Pertim V1** no canto de baixo à esquerda (cx 180), sempre olhando para a câmera; a boca vem dos visemas da voz.
  - Poses: apontando, parado, comemorando (no "vinte" e no "Diamante", com piscadinha) e acenando no fecho.
  - Nunca bravo.
- **Legenda nova, a da Coisa de mineiro #03** (`LegendaPop` na composição; blocos em `dados/legenda.json`):
  - Poppins 800 branca com contorno escuro, palavra a palavra com pop;
  - a palavra dita fica maior, em amarelo/laranja;
  - as **palavras-chave** (`"chaves"` no roteiro) ficam em amarelo/laranja depois de ditas: pão de queijo, pontos, trinta,
    vinte, desconto, entrega, os 4 níveis e prêmio;
  - faixa segura **x 110–906**, y 1400–1548;
  - o espaço entre as palavras é reservado, como no #03.
  - Um bloco tem no máximo 4 palavras ("pão de queijo" conta como uma). Se a regra da palavrinha de ligação deixasse um
    pedaço com 5, ele vira 3.
- **Sem "aguarde", sem "não é app"** e sem "Em breve": o fecho é a pergunta + "Conta nos comentários".

## Voz

- **Voz:** Victor Pinho (`LuQ9eaWO9yCQrR73VQFa`), perfil `narracao` (eleven_v4). Cada fala é uma geração inteira.
- **Pronúncia:** "UaiPertim" vai para a voz como "Uai pertím" e "Pertim" como "pertím" (`pronuncia` no topo do roteiro). Na
  tela e na legenda continua "UaiPertim".
- **Fala 1:** tomada **B** (seed 1042, `tomadas/cap-00/B-seed1042.mp3`). O "pertím" fecha em "im" (o F2 cai), com a força
  no TIM. Na A (seed 42), o fim soava "in".
- **Fala 6, a única pergunta** (`"pergunta": true`), segue a regra das wh-questions: o pico de F0 do trecho da pergunta
  (até o "?") tem de estar na palavra interrogativa, "Qual". O `scripts/tomadas.py` agora mede isso (`pergunta_wh`).
  Ficou a tomada **B**: pico de 296 Hz em "Qual", +8,5 st sobre o resto da pergunta. Gráfico em
  `output/revisao/f0-cena-6.png`.

| tomada | seed | pico da pergunta | na interrogativa? | "Qual" sobre o resto |
|---|---|---|---|---|
| A | 42 | 237 Hz em 0,35 s ("prêmio") | não | +3,5 st |
| **B (usada)** | 1042 | 296 Hz em 0,14 s | **sim** | **+8,5 st** |
| C | 2042 | 283 Hz em 0,11 s | sim | +6,6 st |
| D | 3042 | 302 Hz em 0,17 s | sim | +7,8 st |

- **As outras falas:** seed 42.
- **Mixagem:** −14,1 LUFS e pico real −1,5 dBTP depois do AAC.

## Capa

`CapaReel-pao-de-queijo-points` (`src/covers/capasReels.ts`), no padrão da grade:

- selo "CONHEÇA" e fundo creme com raios;
- ilustração: o Pertim acenando, com uma cesta de pão de queijo quentinho na outra mão, as moedinhas de pontos e os cartões
  "+30" e "+20";
- título "Seu pedido / rende *pontos*!", com "pontos" em coral no marcador amarelo;
- `margem: 135`: o título e os brilhos ficam em x 135–945, a regra das capas que valem na grade e na aba Reels. O QA mede o
  conteúdo da capa sem o fundo: x 143–929.

## Como refazer

```bash
python3 reels/explica-so/scripts/voz.py pao-de-queijo-points                        # a voz (usa a API)
python3 scripts/tomadas.py pao-de-queijo-points 5 --seeds 42,1042,2042,3042          # tomadas da pergunta, com a medida da wh-question
python3 scripts/tomadas.py pao-de-queijo-points 5 --usar B                           # (e 0 --usar B)
python3 reels/explica-so/scripts/linha.py pao-de-queijo-points                       # as cenas na grade de batidas
python3 reels/pao-de-queijo-points/scripts/preparar.py                               # dados/ (cena, visemas, legenda) + cues.json
python3 reels/explica-so/scripts/audio.py pao-de-queijo-points                       # mix.wav (trilha a −15 dB)
node reels/pao-de-queijo-points/scripts/render.mjs                                   # output/uaipertim-pao-de-queijo-points.mp4
node reels/pao-de-queijo-points/scripts/render.mjs capa                              # output/capa.png + capa-3x4.png
node reels/pao-de-queijo-points/scripts/render.mjs mascara                           # máscaras do QA (fora do git)
python3 reels/pao-de-queijo-points/scripts/qa.py                                     # output/revisao/relatorio-tecnico.txt
```

`render.mjs quadros <dir> <seg> …` renderiza quadros soltos.

A chave do ElevenLabs nunca fica no repositório: o proxy da rede a injeta no cabeçalho `xi-api-key` (segredo de rede deste
ambiente).

## Saída (`output/`)

- `uaipertim-pao-de-queijo-points.mp4`: o Reel (H.264 yuv420p, 1080×1920, 30 fps, 28,50 s, AAC 48 kHz estéreo).
- `capa.png` (9:16) e `capa-3x4.png` (o recorte da grade, y 240–1680).
- `legenda.txt`: a legenda do post e a sugestão de comentário fixado.
- `revisao/relatorio-tecnico.txt` (`RESULTADO: aprovado`) e `revisao/f0-cena-6.png`.
