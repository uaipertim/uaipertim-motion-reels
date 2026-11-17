# Série "Coisa de mineiro" (Instagram @uaipertim)

Humor de situação que todo mineiro reconhece. O objetivo é **entreter e ser compartilhado, não falar do app**. O Pertim
faz o papel do mineiro em todas as cenas.

| # | episódio | estreia | pasta | duração |
|---|---|---|---|---|
| 01 | "É logo ali, é pertim" | Reel de teste | [`01-e-logo-ali/`](01-e-logo-ali) | 25,50 s |
| 02 | "A despedida mineira" | sex 20/11, 20h | [`02-a-despedida-mineira/`](02-a-despedida-mineira) | 25,00 s |

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
  No #02 é a visita (o mesmo desenho, sem o mapa, com o pote de bolo).
- **As vozes fixas da série** (eleven_v4, perfil "narracao"):
  - **Pertim = Victor Pinho** (`LuQ9eaWO9yCQrR73VQFa`), a voz oficial da UaiPertim (`audio/voz_oficial.json`);
  - **visita = Sergio - Friendly and Encouraging** (`RGbeQtiShYRDVCrd9b9w`, biblioteca pública da ElevenLabs), a voz
    fixa da visita em TODOS os episódios. Escolhida de ouvido em 2026-11-17 entre 4 vozes (comparativo em
    `02-a-despedida-mineira/vozes-visita/`).

  O campo `falante` do capítulo (`"pertim"` por padrão, ou `"visita"`) diz de quem é a fala. A boca de quem fala segue a
  voz, e a do outro fica fechada. A voz de cada falante fica no topo do roteiro, em
  `"vozes": {"visita": {"name": "Sergio - Friendly and Encouraging", "voiceId": "RGbeQtiShYRDVCrd9b9w"}}`. Com ela, o
  `voz.py` gera as falas da visita com a voz dela, e o QA confere a voz de cada fala.
  - `scripts/vozes_visita.py gerar | medir | comparativo` gera e compara vozes candidatas.
  - `scripts/vozes_visita.py instalar <ep> <voice_id>` confere e põe a tomada escolhida nas falas da visita.
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
| `fecho` | a câmera chega mais perto do Pertim, que pisca para a câmera; o visitante dorme ("z z z"); nos `marca_s` s finais, a logo e "Tudo pertim de você." Com `cenario` (#02), acontece na casa: o Pertim olha para a câmera, cansado mas sorrindo, e a visita continua no carro ("blá blá blá…") | `marca_s` (padrão 2); `cenario: "portao"` |
| `sala` (#02) | a sala de noite (janela, quadro, abajur, sofá verde, mesinha de centro com café e pão de queijo no primeiro plano); o Pertim e a visita sentados. Em `levanta`, a visita se levanta; em `pernas`, bate nas pernas | `levanta: {em}`, `pernas: {em}` |
| `porta` (#02) | a porta da rua aberta para a noite, cabideiro, capacho e vasos no primeiro plano. Em `bolo`, o pote de bolo voa da mão do Pertim para a da visita; em `fica`, o Pertim aponta de volta para a sala | `bolo: {em}`, `fica: {em}` |
| `portao` (#02) | a rua de noite: a casa do vizinho com a janela acesa, o muro com o portão, a casa do Pertim, o poste e os paralelepípedos no primeiro plano (o carro fica fora do quadro). Em `cachorro`, o cachorro deita e dorme; em `vizinho`, a janela do vizinho apaga | `cachorro: {em}`, `vizinho: {em}` |
| `carro` (#02) | a câmera se afasta para o carro e o Pertim aparecerem INTEIROS. O carro tem a escala dos personagens (940 × 540 no mundo: o teto acima da cabeça do Pertim, de 500; a visita sentada com a cabeça na janela; o cachorro bem menor). A visita entra e liga o motor (fumacinha); em `vidro`, o vidro desce. O fecho com `cenario: "portao"` continua nessa mesma tomada | `vidro: {em}` |

**O relógio** (#02): todo capítulo com `relogio: "HH:MM"` no diagrama mostra um relógio no alto à direita, ao lado do
selo. A cada troca de hora, os ponteiros dão uma volta rápida e o mostrador digital conta até a hora nova, na batida do
corte (com o som de contagem). A capa usa `capa.relogio`.

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

`render.mjs quadros NN-tema <pasta> <seg> …` renderiza quadros soltos para conferir antes do render inteiro.

**Personagens na tela (QA):** o `qa.py` roda `render.mjs mascara NN-tema`, que renderiza só os personagens e o carro, cada
um numa cor chapada (10 quadros/s, meia resolução, em `output/revisao/mascara/`, fora do git). Com isso ele confere:

- parado, nenhum personagem (Pertim, visita/visitante, cachorro, vaca) nem o carro fica cortado pela borda, nem a menos
  de 60 px dela (entrando ou saindo de cena, em movimento, pode);
- o rosto do Pertim nunca fica na coluna de botões do Instagram (x ≥ 940 entre y 1060 e 1560). A chave do
ElevenLabs nunca fica no repositório: nesta nuvem, a rede a põe no cabeçalho `xi-api-key`.

## #02 "A despedida mineira" — decisões e tomadas

A despedida que começa na sala e termina uma hora depois no portão. O relógio do canto acompanha:
21:00 → 21:20 → 21:50 → 22:30.

| # | cena | tempo (batidas) | voz | relógio |
|---|---|---|---|---|
| 1 | sala | 0,0–3,0 s (0–6) | "Sabe quanto tempo dura uma despedida mineira?" | 21:00 |
| 2 | sala (visita) | 3,0–6,0 s (6–12) | "Bom, gente… vou indo, né?" (voz da visita) · levanta 3,15 · bate nas pernas 4,91 | 21:00 |
| 3 | porta | 6,0–10,5 s (12–21) | "Leva um pedaço de bolo! Ah, mas fica mais um pouquinho!" · o bolo voa 7,16 · aponta a sala 8,40 | 21:20 |
| 4 | portão | 10,5–14,5 s (21–29) | "E a sua mãe, como é que tá? E aquele seu primo?" · o cachorro deita 11,66 · o vizinho apaga a luz 13,80 | 21:50 |
| 5 | carro (visita) | 14,5–19,0 s (29–38) | "Ah, esqueci de te contar uma coisa…" (voz da visita) · entra 14,5–15,0 · liga 15,35 · o vidro desce 15,70 | 22:30 |
| 6 | fecho | 19,0–25,0 s (38–50) | "Marca aquele amigo que demora uma hora pra ir embora!" · a marca de 23,0 s ao fim | 22:30 |

- **Sem trecho parado:** a abertura entra na sala com a câmera em movimento; a câmera chega um pouco mais perto em
  cada corte e vai até a janela do carro na fala da visita.
- **Gancho:** tomada **V** (seed 14042, `02-a-despedida-mineira/tomadas/cap-00/V-seed14042.mp3`). A pergunta sobe de
  142 Hz ("despedida") para 238 Hz no "NEI" de "mineira": **+9,0 st** (mínimo +8). Foram 25 tomadas; só a V passou.
  - A–L e T–Y: o texto normal, seeds diferentes.
  - M–P: com "??" no fim.
  - Q–S: sem o contexto da fala seguinte.

| tomada | seed | variação | subida | | tomada | seed | variação | subida |
|---|---|---|---|---|---|---|---|---|
| A | 42 | — | +2.3 st | | N | 1042 | "??" | +6.8 st |
| B | 1042 | — | +7.1 st | | O | 3042 | "??" | +4.9 st |
| C | 2042 | — | +3.6 st | | P | 8042 | "??" | +5.7 st |
| D | 3042 | — | +7.3 st | | Q | 1042 | sem contexto | +3.4 st |
| E | 4042 | — | +3.1 st | | R | 3042 | sem contexto | +3.2 st |
| F | 5042 | — | +5.8 st | | S | 11042 | sem contexto | +3.8 st |
| G | 6042 | — | +4.5 st | | T | 12042 | — | +4.7 st |
| H | 7042 | — | +3.0 st | | U | 13042 | — | +6.2 st |
| I | 8042 | — | +6.1 st | | **V (usada)** | 14042 | — | **+9.0 st** |
| J | 9042 | — | +5.3 st | | W | 15042 | — | +1.2 st |
| K | 10042 | — | +5.5 st | | X | 16042 | — | +4.9 st |
| L | 11042 | — | +6.5 st | | Y | 17042 | — | +2.9 st |
| M | 42 | "??" | +5.2 st | | | | | |

- **As outras falas do Pertim:** seed 42.
- **As falas da visita (2 e 5):** voz Sergio, seed 42 (as tomadas do comparativo, inteiras). Fala 2: 2,16 s,
  7,9 letras/s; fala 5: 2,72 s, 9,9 letras/s.
- **Carro e enquadramento (ajuste de 2026-11-17):** o carro foi redesenhado na escala dos personagens, e o carro e o
  fecho viraram uma tomada afastada, com tudo inteiro. O portão e a porta foram reenquadrados.
- **Mixagem:** −14,0 LUFS, pico real −1,5 dBTP.
- **Duração:** 25,00 s (a fala 5 ficou mais longa com a voz da visita: a cena do carro ganhou uma batida).
- **Capa:** o Pertim e a visita (com o pote de bolo) no portão, o cachorro dormindo e o relógio marcando 22:30.
- **O #01 não mudou:** os blocos do #02 são novos. Os quadros do #01 renderizados de novo batem com o vídeo dele.

QA: `02-a-despedida-mineira/output/revisao/relatorio-tecnico.txt` (`RESULTADO: aprovado`).

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
