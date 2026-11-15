# Reel "Olha ele por dentro!" (Instagram @uaipertim · Semana UaiPertim, seg 16/11, 20h)

A primeira vez que o app aparece, narrada pelo Pertim. Formato 9:16, 1080×1920 a **30 fps**, com **27,50 s** (825 quadros).
Composição Remotion: `src/olha-ele-por-dentro/OlhaElePorDentro.tsx` (`OlhaElePorDentro`). Roteiro: `roteiro.json`, nesta pasta.

As telas são os PNGs de `public/telas-app/celular/` (ver `public/telas-app/README.md`). Este Reel usa só **Main, Loja,
Produto, Sacola e Checkout**; nunca `Cartao.png`. Lojas, produtos e valores são fictícios. O selo **"Lojas e valores
ilustrativos"** fica fixo no alto, o vídeo todo, e também está na capa.

## Roteiro e cenas (todo corte numa batida)

Trilha animada do Tudo Pertim, 120 BPM (uma batida a cada 0,5 s), no modo **grade** do `linha.py` (como no "Bateu a fome?"):
cada cena termina na primeira batida depois do fim da fala.

| # | cena | tempo (batidas) | voz | tela | entrada |
|---|---|---|---|---|---|
| 1 | gancho | 0,0–3,0 s (0–6) | "Psiu! Quer ver o UaiPertim por dentro?" | o celular apagado acende (brilho) e a logo aparece na tela; o Pertim entra deslizando ao lado desde o quadro 0 | movimento desde o quadro 0 |
| 2 | início | 3,0–9,5 s (6–19) | "Logo de cara, as lojas do Glória: lanche, pizza, açaí, padaria, mercado…" | Main.png; lupa nas categorias, cada uma acende na sua palavra (Lanches, Pizzas, Açaí, Padaria); a tela rola até "Perto de você" e a lupa mostra o Mercado Central; toque no Burger do Glória | a logo da abertura encolhe e vira a logo do cabeçalho do app |
| 3 | loja | 9,5–14,5 s (19–29) | "Escolheu a loja? O cardápio tá todo aqui, com foto e preço." | Loja.png rolando pelo cardápio; lupa no Smash Duplo (foto, preço e o "+"); toque no "+" | a Loja entra empurrando (navegação do app) |
| 4 | produto | 14,5–17,5 s (29–35) | "Quer caprichar? É só marcar." | Produto.png rola até "Turbine seu lanche"; lupa; o bacon é marcado em "marcar" (o "1 de 3" aparece junto); toque em "Adicionar" | o Produto abre a partir do card tocado |
| 5 | sacola | 17,5–19,5 s (35–39) | "Joga na sacola…" | Sacola.png; o Smash Duplo acende, o contador de itens pula e sobe um "+1"; toque em "Continuar" | a Sacola sobe como uma folha |
| 6 | pagamento | 19,5–23,5 s (39–47) | "…e paga do jeito que quiser: Pix, cartão ou na entrega." | Checkout.png rola até "Como você quer pagar?"; a lupa passa por Pix → Cartão de crédito → Pagar na entrega, cada um na sua palavra, com o destaque no celular | o celular gira (3D) |
| 7 | fecho | 23,5–27,5 s (47–55) | "Facim, né? Tá chegando no Glória!" | logo (para em 24,17 s e fica até o fim), "Tudo pertim de você." e o selo "Em breve no Glória"; o Pertim acena e pisca | o celular se afasta |

## Decisões

- **Mercado nas categorias.** A fileira de categorias do Início tem Todos, Lanches, Pizzas, Açaí e Padaria; não tem
  "Mercado". No "mercado" da fala, a tela rola até "Perto de você" e a lupa mostra o **Mercado Central** (loja fictícia
  do pacote de telas).
- **O bacon "marcando".** O PNG do Produto já vem com "Bacon crocante" marcado e o contador "1 de 3". Até "marcar", a
  caixa do bacon é coberta pela caixa vazia do "Cheddar extra" (um pedaço da própria tela) e o "1 de 3" fica escondido
  (um retângulo da cor do cabeçalho). No toque, os dois voltam com um pop. O preço do botão "Adicionar" (R$ 37,90, já
  com o bacon) não muda.
- **Barras fixas.** A barra de baixo de cada tela (navegação do Início, "Ver sacola", "Adicionar", "Continuar",
  "Fazer pedido e pagar") fica presa no pé do celular enquanto o resto rola, como no app. O "Ver sacola" da Loja é um
  botão flutuante: fica só o retângulo arredondado, com sombra.
- **Celular genérico** (sem marca e sem barra de status): 690×1440 px (**75% da altura**), em x 245–935, fora da coluna
  dos botões do Instagram. Só tem o furinho da câmera.
- **Lupas (punch-in)** no alto (y 325–690, x 90–930): moldura coral, lupinha no canto, o trecho aumentado marcado com
  tracejado no celular e um fio até a lupa. O conteúdo da lupa é a mesma tela, com os mesmos destaques e toques.
- **Toques:** um círculo coral que aperta e duas ondas (coral e amarela) que abrem.
- **Pertim V1** no canto de baixo à esquerda, fora da tela do app (vai até x 257; a tela começa em x 274).
  - Olha sempre para a câmera, e a boca vem dos visemas da voz.
  - Muda de pose em cada cena: apontando para o celular, parado, comemorando quando o bacon é marcado, com a sacola, e
    acenando e piscando no fecho.
- **Legenda gravada** no estilo do "Bateu a fome?", na faixa de baixo (y 1336–1456), por cima do celular. No fecho, vai
  até o fim da fala, porque "Tá chegando no Glória!" não aparece escrito na tela: só os ~1,2 s finais ficam limpos (a
  logo fica parada 3,3 s).
- **Fundo:** creme com raios, o toldo listrado coral no alto e um halo coral atrás do celular.

## Voz

- **Voz:** Victor Pinho, perfil `narracao` (eleven_v4). Cada fala é uma geração inteira.
- **Pronúncia:** grafia c, aprovada no "Bateu a fome?": "UaiPertim" vai para a voz como "Uai pertím" (campo `pronuncia`
  da fala 1). Na tela e na legenda continua "UaiPertim". Só a fala 1 tem "Pertim". Não houve comparativo, porque a grafia
  já tinha sido aprovada e esta fala não levantou dúvida.
- **Glória:** só "do/no Glória".
- **Tomadas:** fala 1 = tomada **E** (seed 4042, `tomadas/cap-00/E-seed4042.mp3`); as outras com a seed 42 (`voz.py`).

**A pergunta do gancho sobe até a tônica.** Medido com o `scripts/tomadas.py` (subida da mediana do F0 em "por" até o
pico em "dentro") e conferido no `qa.py`: **+11,0 st** (121 → 230 Hz; mínimo +8 st). O pico cai no fim do "DEN", como
no contorno natural da pergunta. Gráfico: `output/revisao/f0-gancho.png`.

| tomada | seed | fala (s) | "por" → pico em "dentro" | subida |
|---|---|---|---|---|
| A | 42 | 2.40 | 135 → 217 Hz | +8.2 st |
| B | 1042 | 2.40 | 125 → 225 Hz | +10.2 st |
| C | 2042 | 2.32 | 131 → 194 Hz | +6.8 st |
| D | 3042 | 2.32 | 125 → 210 Hz | +9.0 st |
| E **(usada)** | 4042 | 2.40 | 121 → 230 Hz | +11.0 st |

## Mixagem

- −14,0 LUFS e pico real −1,6 dBTP depois do AAC.
- Efeitos em `cues.json`: a tela que acende, a logo, as lupas abrindo, cada categoria e forma de pagamento acendendo, os
  toques, o check do bacon, a sacola e o carimbo do selo.
- O sting final da trilha cai numa batida.

## Como refazer

```bash
python3 reels/explica-so/scripts/voz.py olha-ele-por-dentro           # a voz (só as falas que faltam; usa a API)
python3 scripts/tomadas.py olha-ele-por-dentro 0 --seeds 42,1042      # tomadas A/B de uma fala, com a subida até a tônica (usa a API)
python3 scripts/tomadas.py olha-ele-por-dentro 0 --usar E             # a tomada escolhida vira a fala da cena (sem API)
python3 reels/explica-so/scripts/linha.py olha-ele-por-dentro         # as cenas na grade de batidas
python3 reels/olha-ele-por-dentro/scripts/preparar.py                 # dados/ (cena, visemas, legenda) + cues.json
python3 reels/explica-so/scripts/audio.py olha-ele-por-dentro         # mix.wav
node reels/olha-ele-por-dentro/scripts/render.mjs                     # output/uaipertim-olha-ele-por-dentro.mp4
python3 reels/olha-ele-por-dentro/scripts/qa.py                       # output/revisao/relatorio-tecnico.txt + f0-gancho.png
python3 reels/olha-ele-por-dentro/scripts/storyboard.py               # output/quadros/ (1 por cena) + output/storyboard.png
npm run capas:reels -- olha-ele-por-dentro                            # a capa (CapaReel-olha-ele-por-dentro) → out/capas/reels/
```

`scripts/quadros.mjs` renderiza quadros soltos para conferir antes do render inteiro. Posições: `layout.json` (o celular,
as telas com as barras fixas e os pontos de toque/lupa em px do PNG, as lupas, o Pertim, o fecho).

A chave do ElevenLabs nunca fica no repositório: nesta nuvem, a rede a põe no cabeçalho `xi-api-key`.

## Saída (`output/`)

- `uaipertim-olha-ele-por-dentro.mp4`: o Reel (H.264 yuv420p, 1080×1920, 30 fps, 27,50 s, AAC 48 kHz estéreo).
- `capa.png` e `capa-3x4.png`: a capa no padrão do grid (selo "SEMANA UAIPERTIM", o celular com o Início e o Pertim
  espiando, "Olha ele / *por dentro*!" e o aviso "Lojas e valores ilustrativos").
  - É a `CapaReel-olha-ele-por-dentro` (`src/covers/capasReels.ts`).
  - O `capa-3x4.png` é o recorte da grade (y 240–1680).
- `quadros/cena-N-<tipo>.png`: 1 quadro de revisão por cena, tirado do MP4; `storyboard.png` reúne os 7.
- `revisao/relatorio-tecnico.txt`: o QA (`RESULTADO: aprovado`); `revisao/f0-gancho.png`.
