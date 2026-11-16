# Série "Coisa de mineiro" (Instagram @uaipertim)

Humor de situação que todo mineiro reconhece. O objetivo é **entreter e ser compartilhado, não falar do app**. O Pertim
faz o papel do mineiro em todas as cenas.

| # | episódio | estreia | pasta | duração |
|---|---|---|---|---|
| 01 | "É logo ali, é pertim" | sex 20/11, 20h | [`01-e-logo-ali/`](01-e-logo-ali) | 25,50 s |

## Identidade (diferente do Tudo Pertim e dos Reels do app)

- **Selo fixo** "COISA DE MINEIRO #NN": adesivo verde (#3E9E4E) com borda branca, o número em amarelo (#F9B233) e um
  montinho com sol. Fica no alto à esquerda, levemente inclinado, o vídeo todo, e entra com um pop no quadro 0.
- **Cenário de interior** no estilo flat das lojinhas:
  - céu aberto que muda de hora (dia → fim de tarde dourado → noite com lua e estrelas);
  - morros em 3 camadas com parallax e nuvens;
  - estrada de terra com sulcos e pedrinhas, e cerca de madeira;
  - objetos: porteira, mata-burro, vaca, pé de manga, placas de km e a casinha com a luz acesa.
- **A câmera perto** (`layout.json` → `mundo`): o cenário e os personagens ficam 1,35× maiores, ancorados na linha do
  chão, e descem 90 px.
  - Os pés ficam em y 1390, a estrada no terço de baixo da tela, e o primeiro plano de capim (tufos, florzinhas e
    pedrinhas; à noite, vaga-lumes) preenche a parte de baixo, sem faixa vazia.
  - A legenda fica logo abaixo dos pés (y 1400–1520), acima da descrição do Instagram; o selo, no alto.
- **O visitante:** um pin genérico azul (não é o Pertim), com o mapa aberto na mão. Fica perdido, cansado ou dormindo.
- **Sem marca no meio:** nada de celular, telas do app, "em breve" ou "tá chegando". A marca só aparece nos
  `marca_s` segundos finais (2 s): a logo pequena e "Tudo pertim de você.", no céu.
- **Formato:** 1080×1920, 30 fps, 20–30 s.
- **Trilha:** animada, 120 BPM, com todo corte numa batida (modo grade, como no "Olha ele por dentro!").
- **Legenda gravada:** no estilo do "Bateu a fome?", na faixa de baixo.
- **Voz:** Victor Pinho, eleven_v4, perfil "narracao". "Pertim"/"pertim" vai para a voz como "pertím" (grafia c, no campo
  `pronuncia` do topo do roteiro); na tela e na legenda continua "pertim".
- **O Pertim:** a boca vem da voz. Olha para a câmera quando fala com o público e para o visitante quando fala com ele.

## Estrutura

```
reels/coisa-de-mineiro/
  README.md                 este arquivo
  layout.json               o layout da série (o mesmo para todos os episódios): chão, horizonte, selo, legenda, marca,
                            posições do Pertim e do visitante
  scripts/preparar.py <ep>  os dados do episódio → public/coisa-de-mineiro/<ep>/dados.json + o cues.json do áudio
  scripts/render.mjs        video | capa | quadros <ep>
  scripts/qa.py <ep>        a revisão técnica → <ep>/output/revisao/relatorio-tecnico.txt (+ f0-gancho.png)
  scripts/storyboard.py <ep>  1 quadro por cena (<ep>/output/quadros/) + <ep>/output/storyboard.png
  NN-tema/roteiro.json      o roteiro de cada episódio (o único arquivo que muda)
  NN-tema/tomadas/          as tomadas A/B de voz (mp3 + json; scripts/tomadas.py)
  NN-tema/output/           uaipertim-coisa-de-mineiro-NN.mp4, capa.png, capa-3x4.png, quadros/, storyboard.png, revisao/
src/coisa-de-mineiro/CoisaDeMineiro.tsx   UMA composição para todos os episódios (CoisaDeMineiro e CoisaDeMineiro-Capa)
```

**A composição é a mesma para todos os episódios.** Os dados de cada um (as cenas, os diagramas com o tempo de cada
palavra, a boca e a legenda) ficam em `public/coisa-de-mineiro/<ep>/dados.json`, que ela lê no `calculateMetadata`.
Renderizar o episódio = passar `{"ep": "<pasta>"}`. Não é preciso import novo nem composição nova.

A voz, a linha do tempo e a mixagem são as do pipeline do Explica, Sô! (`reels/explica-so/scripts/`).

- **Id do episódio:** é o caminho `coisa-de-mineiro/<pasta>`.
- **Onde os scripts procuram o roteiro:** `voz.py`, `linha.py` e `audio.py` buscam `reels/<id>/roteiro.json`.
- **Campos novos no roteiro** (valem para qualquer Reel):
  - `limites` e `limites_fecho`: a duração do vídeo e do fecho;
  - `pronuncia` no topo: as grafias da voz para todos os capítulos.

### Os tipos de cena (o "tipo" do `diagrama` de cada capítulo)

| tipo | o que mostra | campos |
|---|---|---|
| `pergunta` | o visitante entra pela esquerda com o mapa e fica perdido ("?"); o Pertim fala com o público | — |
| `resposta` | o Pertim aponta a estrada, tranquilo, olhando para o visitante; em `camera`, olha para a câmera (com um brilho) | `camera: {em}` |
| `caminho` | um chicote de câmera na batida e a câmera segue o visitante pela estrada. Cada objeto passa no centro da tela na palavra dele: a porteira abre antes de ele passar, cai uma manga, ele pula o mata-burro com cuidado e desvia da vaca ("Muuu!"). As placas de km pulam; no `segue`, o passo acelera e o dia vira fim de tarde. Se a última placa tem `pendurada`, a câmera freia e PARA nela: o visitante para e olha, e a tabuinha cai e balança (a piada fecha a cena, sem trecho parado) | `objetos: [{tipo: porteira\|mangueira\|mata-burro\|vaca, em}]`; `placas: [{texto: "2 km", em, pendurada?}]` (só km no texto; sem `em`, espalhadas pela cena); `segue: {em}` |
| `chegada` | a noite cai (o azul desce do alto) e o visitante chega exausto; o Pertim já está lá, de chinelo, tomando café, na frente da casinha | — |
| `fecho` | a câmera chega mais perto do Pertim, que pisca para a câmera; o visitante dorme ("z z z"); nos `marca_s` s finais, a logo e "Tudo pertim de você." | `marca_s` (padrão 2) |

O campo `em` aceita:

- a palavra da fala (como na tela);
- `"palavra#2"`: a 2ª vez que a palavra aparece;
- `"+1.2"`: 1,2 s depois do começo da cena;
- `"fim"`: perto do fim da cena.

O `preparar.py` resolve cada `em` para o tempo da palavra no vídeo (`t`).

**Cena nova** (para outro episódio): um bloco novo em `CoisaDeMineiro.tsx`, lendo `cena("<tipo>")` e o diagrama dela,
mais os efeitos sonoros do tipo no `preparar.py` (`cues`). O selo, a legenda, a boca, a marca e o QA vêm sozinhos.

### Os acessórios do Pertim

O desenho oficial (`src/personagem`) **não muda**. O chinelo e a xícara de café são desenhados por cima, no mesmo
viewBox (`Acessorios` em `CoisaDeMineiro.tsx`):

- **chinelo:** o pé descalço cobre o tênis, com o solado verde e a tira amarela;
- **café:** a xícara com fumacinha na luva de baixo da pose "parado".

O desenho não tem a pose "mão no bolso" (o pin não tem bolso). Na resposta, ele aponta com a pose "apontando", que deixa
o outro braço solto e relaxado.

## Como criar o próximo episódio

1. Copie `01-e-logo-ali/roteiro.json` para `NN-tema/roteiro.json`. Troque:
   - `id` (`coisa-de-mineiro/NN-tema`), `numero`, `titulo` e `capa.titulo`;
   - os `capitulos`: a fala, os tipos de cena e os `em`.

   Use os tipos de cena que já existem, ou crie um (acima). Mantenha a regra: perguntas soam como pergunta, humor leve,
   sem caricatura ofensiva, sem nomes de lugares reais e sem falar do app.
2. Gere tudo, em ordem:

```bash
python3 reels/explica-so/scripts/voz.py coisa-de-mineiro/NN-tema          # a voz (usa a API; só as falas que faltam)
python3 scripts/tomadas.py coisa-de-mineiro/NN-tema 0 --seeds 42,1042,2042,3042   # o gancho, se for pergunta: a subida até a tônica (≥ +8 st)
python3 scripts/tomadas.py coisa-de-mineiro/NN-tema 0 --usar <letra>      # a tomada escolhida (sem API)
python3 reels/explica-so/scripts/linha.py coisa-de-mineiro/NN-tema        # as cenas na grade de batidas (confere a duração)
python3 reels/coisa-de-mineiro/scripts/preparar.py NN-tema                # public/coisa-de-mineiro/NN-tema/dados.json + cues.json
python3 reels/explica-so/scripts/audio.py coisa-de-mineiro/NN-tema        # mix.wav (−14 LUFS)
node reels/coisa-de-mineiro/scripts/render.mjs video NN-tema              # NN-tema/output/uaipertim-coisa-de-mineiro-NN.mp4
node reels/coisa-de-mineiro/scripts/render.mjs capa NN-tema               # capa.png + capa-3x4.png
python3 reels/coisa-de-mineiro/scripts/qa.py NN-tema                      # RESULTADO: aprovado
python3 reels/coisa-de-mineiro/scripts/storyboard.py NN-tema              # quadros/ + storyboard.png
```

`render.mjs quadros NN-tema <pasta> <seg> …` renderiza quadros soltos para conferir antes do render inteiro. A chave do
ElevenLabs nunca fica no repositório: nesta nuvem, a rede a põe no cabeçalho `xi-api-key`.

## #01 "É logo ali, é pertim" — decisões e tomadas

| # | cena | tempo (batidas) | voz |
|---|---|---|---|
| 1 | pergunta | 0,0–3,0 s (0–6) | "Já perguntou pra um mineiro onde fica um lugar?" |
| 2 | resposta | 3,0–7,0 s (6–14) | "Ah, é logo ali… é pertim!" (olha para a câmera em "pertim") |
| 3 | caminho | 7,0–15,5 s (14–31) | "Passa a porteira, vira no pé de manga, atravessa o mata-burro… cuidado com a vaca… e segue reto." · porteira 7,72 · manga 9,20 · mata-burro 10,56 · vaca 12,08 · placas 2 km 9,60 · 5 km 11,40 · 12 km em "reto" (13,28) · 27 km 14,30, com "…mais um pouquinho" caindo em 14,85 e a câmera parada nela |
| 4 | chegada | 15,5–20,0 s (31–40) | "Pertim pra mineiro é tudo que a vista alcança." |
| 5 | fecho | 20,0–25,5 s (40–51) | "Marca aquele amigo que sempre fala que é pertim!" · a marca de 23,5 s ao fim |

**Ajustes de 2026-11-16** (aprovado no conceito):

- **A câmera mais perto:** tudo 1,35× maior, o chão preenchendo a parte de baixo e a legenda logo abaixo dos pés. Vale
  para a composição da série.
- **Sem buraco no caminho:** a cena encolheu de 11 s para 8,5 s. Depois de "e segue reto", a câmera acelera e para na
  placa "27 km", com a tabuinha "…mais um pouquinho" caindo. O total foi de 28,0 s para 25,5 s.
- Voz, tomadas, texto e capa não mudaram.

- **Gancho:** tomada **E** (seed 4042, `01-e-logo-ali/tomadas/cap-00/E-seed4042.mp3`). A pergunta sobe até a tônica de
  "lugar" (o pico cai no "GA"): **+8,6 st** no `tomadas.py` e **+8,3 st** no QA (mínimo +8). Das 8 tomadas, só a E e a F
  passaram; na F o pico caía no "lu", antes da tônica.

| tomada | seed | fala (s) | "um" → pico em "lugar" | subida |
|---|---|---|---|---|
| A | 42 | 2.56 | 139 → 172 Hz | +3.6 st |
| B | 1042 | 2.40 | 139 → 190 Hz | +5.5 st |
| C | 2042 | 2.48 | 138 → 179 Hz | +4.4 st |
| D | 3042 | 2.48 | 137 → 200 Hz | +6.6 st |
| E **(usada)** | 4042 | 2.40 | 136 → 224 Hz | +8.6 st |
| F | 5042 | 2.48 | 141 → 225 Hz | +8.1 st |
| G | 6042 | 2.48 | 138 → 155 Hz | +2.1 st |
| H | 7042 | 2.40 | 136 → 188 Hz | +5.6 st |

- **Fala 2** ("Ah, é logo ali… é pertim!"): tomada **B** (seed 1042, `tomadas/cap-01/B-seed1042.mp3`). O "pertím" sai
  com a força no TIM e o F2 caindo no fim ("im").
  - Ela fica abaixo do ritmo mínimo da conferência automática (7,6 letras/s; mínimo 8). É a pausa do "…", esperada
    nessa fala curta.
  - O `voz.py` agora avisa quando nenhuma das 4 gerações passa na conferência. Antes, ele registrava a seed seguinte
    em vez da que gerou o áudio salvo.
- **As outras falas:** seed 42.
- **Mixagem:** −14,0 LUFS, pico real −1,5 dBTP.
- **Duração:** 25,50 s.

QA: `01-e-logo-ali/output/revisao/relatorio-tecnico.txt` (`RESULTADO: aprovado`).
