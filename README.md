# uaipertim-motion-reels

Vídeos de motion graphic (Reels 9:16) para o Instagram do UaiPertim, a plataforma de comércio local de Minas Gerais. Estilo cartoon, feito em Remotion.

## Vídeo 1 — "Não precisa baixar nada"

- **Arquivo final:** [`out/uaipertim_video1_nao-precisa-baixar.mp4`](out/uaipertim_video1_nao-precisa-baixar.mp4) (H.264 yuv420p, 1080×1920, 30fps, 26s / 780 frames, AAC 48 kHz estéreo, -14 LUFS)
- **Roteiro e prompt originais:** [`docs/ROTEIRO.md`](docs/ROTEIRO.md), [`docs/LEIA-ME_e_PROMPT.md`](docs/LEIA-ME_e_PROMPT.md)

| Cena | Frames | Componente |
|---|---|---|
| 1 · A dor | 0–90 | `src/scenes/Scene1Dor.tsx` (+ `DorStage.tsx`, compartilhado com a 2) |
| 2 · Transborda | 90–180 | `src/scenes/Scene2Transborda.tsx` |
| 3 · A virada | 180–300 | `src/scenes/Scene3Virada.tsx` |
| 4 · É só o link | 300–450 | `src/scenes/Scene4Link.tsx` (+ `HomePhone.tsx`) |
| 5 · A cidade ganha vida | 450–600 | `src/scenes/Scene5Cidade.tsx` |
| 6 · Fecho + CTA + end card | 600–780 | `src/scenes/Scene6Fecho.tsx` |

Transições: swipe coral (2→3), o logo "engole" a cena (3→4), zoom-out (4→5) e swipe amarelo (5→6).

**Só visual + trilha.** O Vídeo 1 não tem locução nem legenda: os elementos já contam a proposta do app, e o som é a trilha com os efeitos sonoros. O projeto ainda guarda as duas opções, ambas desligadas no `src/config/timeline.json`:
- Voz: `narration.enabled`.
- Legenda animada estilo karaokê: `captions.enabled`, componente `src/components/Captions.tsx`.

## Vídeo 2 — "Vai funcionar assim, ó"

- **Arquivo final:** [`out/uaipertim_video2_vai-funcionar-assim.mp4`](out/uaipertim_video2_vai-funcionar-assim.mp4) (H.264 yuv420p, 1080×1920, 30fps, 28s / 840 frames, AAC 48 kHz estéreo, -14 LUFS)
- **Composição:** `Video2-VaiFuncionarAssim` (`src/v2/Video2.tsx`)
- **Roteiro e prompt originais:** [`docs/video2/ROTEIRO.md`](docs/video2/ROTEIRO.md), [`docs/video2/LEIA-ME_e_PROMPT.md`](docs/video2/LEIA-ME_e_PROMPT.md)

| Cena | Frames | Componente |
|---|---|---|
| 1 · Abertura (chip PRÉVIA) | 0–105 | `src/v2/scenes/S1Abertura.tsx` |
| 2 · Passo 1: a cidade | 105–240 | `src/v2/scenes/S2Cidade.tsx` |
| 3 · Passo 2: a categoria | 240–390 | `src/v2/scenes/S3Categoria.tsx` |
| 4 · Passo 3: quem tá aberto | 390–555 | `src/v2/scenes/S4Aberto.tsx` |
| 5 · Acompanha em tempo real | 555–690 | `src/v2/scenes/S5TempoReal.tsx` |
| 6 · Fecho + CTA + end card | 690–840 | `src/v2/scenes/S6Fecho.tsx` |

**Só visual + trilha**, como o Vídeo 1: sem locução e sem legenda. Os efeitos sonoros acompanham cada toque, e a trilha marca os passos 1-2-3.

O celular-personagem da cena 1 vira o "palco" (`src/v2/scenes/Stage.tsx`): cada toque do cursor abre a tela seguinte com zoom-through. A passagem 5→6 é um swipe coral.

Componentes novos, reutilizáveis nos próximos vídeos:
- `components/Guide.tsx`: cursor/dedinho com ripple, badge de passo 1-2-3, zoom-through.
- `components/AppUi.tsx`: cabeçalho do app, busca, tiles de categoria, mapa cartoon, card de estabelecimento, linha do tempo do pedido e estradinha com o motinho.
- `components/AppIcons.tsx`: ícones novos (motinho, lojinha, setinha, piscadinha 😉 etc.).

Regras de conteúdo seguidas:
- O card é um exemplo genérico, "Comércio da cidade".
- O lançamento aparece como "CHEGANDO EM BREVE", sem data.
- A abertura leva o chip "PRÉVIA".

## Vídeo 3 — "Qual comércio PRECISA estar aqui?"

- **Arquivo final:** [`out/uaipertim_video3_qual-comercio-precisa.mp4`](out/uaipertim_video3_qual-comercio-precisa.mp4) (H.264 yuv420p, 1080×1920, 30fps, 25s / 750 frames, AAC 48 kHz estéreo, -14 LUFS)
- **Composição:** `Video3-QualComercioPrecisa` (`src/v3/Video3.tsx`)
- **Roteiro e prompt originais:** [`docs/video3/ROTEIRO.md`](docs/video3/ROTEIRO.md), [`docs/video3/LEIA-ME_e_PROMPT.md`](docs/video3/LEIA-ME_e_PROMPT.md)

| Cena | Frames | Componente |
|---|---|---|
| 1 · A pergunta (balão "?" estoura) | 0–120 | `src/v3/scenes/S1Pergunta.tsx` |
| 2 · As lojinhas esperam | 120–240 | `src/v3/scenes/S2Esperam.tsx` |
| 3 · A cidade responde | 240–420 | `src/v3/scenes/S3Responde.tsx` |
| 4 · Marca o dono | 420–570 | `src/v3/scenes/S4MarcaDono.tsx` |
| 5 · Fecho + CTA + end card | 570–750 | `src/v3/scenes/S5Fecho.tsx` |

As cenas 2–5 acontecem na mesma cidadezinha, sem corte: `src/v3/scenes/Town.tsx` é o palco. Ele cuida da câmera (desce na cena 3, aproxima na padaria na cena 4 e faz o zoom out na 5), das lojinhas acendendo, da notificação no telhado e dos pins. Os balões, o contador 💬 e os campos de comentário ficam em `src/v3/scenes/CommentLayer.tsx`, que as cenas 3 e 4 compartilham. A passagem 1→2 é um swipe creme.

**Só visual + trilha**, como os Vídeos 1 e 2: sem locução e sem legenda. Cada texto de tela fica pelo menos 1,5s (as frases longas, ~2,5s). A trilha segue a seção "Trilha" do roteiro:
- cena 2 em suspense (só ukulele + tic-tac);
- na cena 3 entra tudo, com palmas dobradas (`doubleClapBars`) e um "plim" que sobe de tom a cada balão;
- na cena 4, uma pausa curta no "@" (`mutes`) e a explosão na notificação (acento + virada pro pico);
- na cena 5, o pico no CTA e o sting no end card.

Componentes novos, reutilizáveis:
- `components/Town.tsx`: lojinhas-personagem (`ShopChar`) com os olhinhos do celular-personagem, placa com ícone da categoria, toldo, vitrines que acendem e halo de "acende inteira"; notificação no telhado (`RoofNotification`, sininho + bolinha vermelha "1").
- `components/Comments.tsx`: balão de comentário com avatar em bolinha colorida (sem rosto) e coraçãozinho pulsando, balãozinho de reação, campo "Adicione um comentário…" com cursor de texto, etiqueta "@" e contador 💬.
- `components/AppIcons.tsx`: olhinhos 👀, balão 💬, megafone 📣, carinha 😋, cápsula 💊, garrafa, folha e prato com tampa.

Regras de conteúdo seguidas:
- Os balões só usam termos genéricos (padaria da esquina, mercadinho do bairro…). A etiqueta é "@padaria", a categoria, sem nome de estabelecimento.
- O contador 💬 é só ilustrativo: sobe rápido, para em "999+" e some antes do fecho, que não mostra número nenhum.
- O lançamento aparece como "CHEGANDO EM BREVE", sem data.

## Vídeo 4 — "Ele te acha?" (convite ao comerciante)

- **Arquivo final:** [`out/uaipertim_video4_ele-te-acha.mp4`](out/uaipertim_video4_ele-te-acha.mp4) (H.264 yuv420p, 1080×1920, 30fps, 28s / 840 frames, AAC 48 kHz estéreo, -14 LUFS)
- **Composição:** `Video4-EleTeAcha` (`src/v4/Video4.tsx`)
- **Roteiro e prompt originais:** [`docs/video4/ROTEIRO.md`](docs/video4/ROTEIRO.md), [`docs/video4/LEIA-ME_e_PROMPT.md`](docs/video4/LEIA-ME_e_PROMPT.md)

| Cena | Frames | Componente |
|---|---|---|
| 1 · O cliente procura | 0–135 | `src/v4/scenes/S1Procura.tsx` |
| 2 · A loja invisível | 135–270 | `src/v4/scenes/S2Invisivel.tsx` |
| 3 · Acende no mapa | 270–420 | `src/v4/scenes/S3Acende.tsx` |
| 4 · Os benefícios | 420–585 | `src/v4/scenes/S4Beneficios.tsx` |
| 5 · É simples entrar | 585–720 | `src/v4/scenes/S5Simples.tsx` |
| 6 · Fecho + CTA + end card | 720–840 | `src/v4/scenes/S6Fecho.tsx` |

A protagonista é a Lojinha, uma lojinha-personagem sem nome, só com o ícone de vitrine na placa. Ela começa apagada, transparente e triste (toldo murcho), acende quando o pin do UaiPertim cai nela e termina acenando com o toldo.

As cenas 2–5 acontecem num palco só, sem corte (`src/v4/scenes/Stage.tsx`): cidade cinza → onda de cor → zoom na Lojinha (benefícios) → estradinha dos 3 passos. A geometria compartilhada fica em `src/v4/scenes/layout.ts`: a lente, a onda, o caminho da Lojinha e as placas.

Transições:
- 1→2: a lupa da barra de busca cresce e a cidade aparece dentro da lente.
- 2→3 e 5→6: swipe coral.
- 3→4: zoom na Lojinha.
- 4→5: a Lojinha encolhe e vai pra largada da trilha.

**Só visual + trilha**, como os vídeos anteriores. A trilha segue o roteiro:
- cenas 1–2 na versão triste (`sections.sad`: ukulele em tom menor, meio-tempo, abafado por um passa-baixa, `music.muffle`);
- virada no impacto do pin (f352), com prato e a trilha completa junto com a onda de cor;
- acento em cada benefício e em cada passo;
- pico no CTA e sting no end card.

Componentes novos, reutilizáveis:
- `components/Search.tsx`: lupa cartoon, barra de busca com lupa e carimbo "NÃO ENCONTRADO".
- `components/ColorWave.tsx`: dessaturação + onda de cor circular.
- `components/Invite.tsx`: card de benefício com check que se desenha, placa da trilha, selo e balão do direct.
- Lojinha (`components/Town.tsx`): agora também murcha o toldo, ganha brilho nos olhinhos e acende um cordão de luzinhas.
- Olhinhos (`components/Phone.tsx`): humor "triste".
- Ícones novos em `components/AppIcons.tsx`: 👋 📲 📦 📝 🚀 e o aviãozinho do direct.

Regras de conteúdo seguidas:
- O CTA é pelo direct do Instagram: "Chama a gente no direct" + @uaipertim, parados na tela por ~2,6s até o fim.
- Sem WhatsApp e sem telefone em nenhuma cena.
- Sem condições comerciais (taxas, comissões, mensalidade).
- Nenhum estabelecimento real: a Lojinha não tem nome.
- O lançamento aparece como "CHEGANDO EM BREVE", sem data.

## Como editar

- **Textos de tela:** `src/config/texts.ts` (Vídeo 1) · `src/v2/config/texts.ts` (Vídeo 2) · `src/v3/config/texts.ts` (Vídeo 3) · `src/v4/config/texts.ts` (Vídeo 4)
- **Tempos (fonte única para vídeo e áudio):** `src/config/timeline.json` (Vídeo 1) · `src/v2/config/timeline.json` (Vídeo 2) · `src/v3/config/timeline.json` (Vídeo 3) · `src/v4/config/timeline.json` (Vídeo 4)
  - `scenes`: início e duração de cada cena
  - `beats`: momentos das animações, em frames locais de cada cena (ex.: `s2.stamp` = carimbo)
  - `captions`: legenda animada opcional (texto e frames de cada bloco; desligada no Vídeo 1)
  - `narration.items`: texto, frame de entrada e velocidade de cada fala (`narration.enabled` liga ou desliga a voz)
  - `sfx`: cada efeito sonoro aponta para um beat, então se o beat muda o som acompanha. O `at` aceita `"nome"`, `"nome[i]"` (um item de uma lista de beats) ou um número; `offset` desloca o som em frames
  - `music`: bpm, acordes, seções (respiro, suspense, pico), `breakBars` (breques), `accents` (stabs em frames absolutos: os "degraus" dos passos 1-2-3 no Vídeo 2, o estouro do balão e a notificação no Vídeo 3), `doubleClapBars` (palmas dobradas), `mutes` (pausas curtas da trilha), `levels` (volume por seção, só no vídeo que pedir), `crashBars` (prato no 1º tempo) e `muffle` (trilha abafada até um frame)
- **Paleta e fontes:** `src/config/theme.ts`
- **Helpers de animação** (spring com overshoot, respiração, flutuação, squash): `src/lib/anim.ts`

Depois de mexer em tempos ou falas, regere o áudio e renderize de novo:

```bash
npm run audio       # Vídeo 1: locução + SFX + trilha + mix → public/audio/mix.wav
npm run render      # → out/uaipertim_video1_nao-precisa-baixar.mp4
npm run audio:v2    # Vídeo 2 → public/audio/v2/mix.wav
npm run render:v2   # → out/uaipertim_video2_vai-funcionar-assim.mp4
npm run audio:v3    # Vídeo 3 → public/audio/v3/mix.wav
npm run render:v3   # → out/uaipertim_video3_qual-comercio-precisa.mp4
npm run audio:v4    # Vídeo 4 → public/audio/v4/mix.wav
npm run render:v4   # → out/uaipertim_video4_ele-te-acha.mp4
npm run studio      # pré-visualização interativa (as quatro composições)
```

## Setup

```bash
npm install
# áudio (Python 3 + FluidSynth)
sudo apt-get install fluidsynth fluid-soundfont-gm
npm run audio:setup   # baixa as vozes (Piper pt-BR + Kokoro) e instala as libs Python
```

## Áudio (gerado pelo projeto, sem samples externos)

- **Locução:** desligada nos quatro vídeos (decisão: só visual + trilha + efeitos; `narration.enabled: false`). O pipeline de voz continua pronto caso um vídeo futuro precise: **Piper `pt_BR-cadu-medium`**, treinada com um falante brasileiro nativo (dataset CC0, uso comercial liberado), rodando offline (`audio/tts.py`).
  - A pronúncia é ajustada em `narration.phonemeFixes.piper`: o "Uaai" sai numa sílaba, levemente arrastado, e o "w" de Uai-Pertim fica bem marcado. A grafia mineira entra direto no texto: "baixá", "instalá", "ocupá".
  - O modelo varia a cada geração. A `seed` de cada fala em `timeline.json` fixa o take escolhido.
  - `audio/pick_takes.py` (opcional, usa Whisper) gera vários takes por fala, transcreve cada um e grava a seed do mais fiel ao texto.
  - No Vídeo 2 a marca fica num trecho próprio da fala, um pouco mais lento (`speedMul`). Cada trecho pode ter `seed` e `pauseAfter` próprios. A voz `cadu` fala devagar, então as falas 1–3 vão a ~1,2–1,3× e algumas avançam alguns frames sobre a cena seguinte, como num corte em "L" de edição.
  - Para trocar a voz, mude `narration.voice` (`pt_BR-faber-medium` é outra voz masculina brasileira). Para voltar ao Kokoro, use `"engine": "kokoro"` com `"voice": "pf_dora"`, mas o sotaque dele soa estrangeiro.
- **Trilha:** 124 bpm, composta em MIDI (`audio/music.py`) e renderizada com FluidSynth + FluidR3 GM. Leva violão nylon em voicing de ukulele, marimba, glockenspiel/celesta, baixo, palmas e shaker. Sobe nas cenas 1–2, tem um respiro de ~1s no swipe da cena 3, cresce até o pico no CTA e fecha com o acorde do sting no end card.
- **SFX:** sintetizados em numpy (`audio/sfx.py`): glup, alarme, boing, carimbo, whoosh, pop mágico, sininho, digitação, tap, plop, confete etc. No Vídeo 4: lupa girando, "plim" triste e desafinado, toldo murchando, check, passinhos, foguetinho e o interruptor do holofote. No Vídeo 3 entram ainda o "fuuu" do balão enchendo, o estouro, o tic-tac de relógio cartoon (nas colcheias da trilha), o "hmm?" das lojinhas (zumbido de kazoo, sem voz humana), o "plim" subindo de tom, o "fiuuu" da etiqueta, a notificação e a mini-comemoração.
- **Mix:** `audio/mix.py` faz a automação por seção (subidas, respiro, pico) e normaliza em -14 LUFS com limiter. Quando há voz, também faz o ducking da trilha. Nos Vídeos 2, 3 e 4 o limitador é true peak com lookahead (`master.truePeak`), para o pico real ficar abaixo de -1 dBTP depois do AAC.
- **Vários vídeos:** todos os scripts aceitam `--video v1|v2|v3|v4` (padrão `v1`). A saída de cada vídeo vai para `audio/build/<vídeo>` e para o seu `mix.wav`.

**Trocar por voz gravada:** grave as falas `n1`…`n6` como WAV, coloque em `audio/build/vo/` (Vídeo 1) ou `audio/build/v2/vo/` (Vídeo 2) com esses nomes e rode `python3 audio/build_audio.py [--video v2] --no-tts`.

## Notas

- A Poppins é carregada localmente (`public/fonts`, arquivos do `@fontsource/poppins`) via `@remotion/fonts`. Assim o render funciona offline. O `@remotion/google-fonts` continua instalado como alternativa.
- O lançamento aparece como **"EM BREVE"**, sem data, conforme o prompt. Isso substitui o "segunda quinzena de agosto" que estava no roteiro.
- `assets/` guarda os originais recebidos. `public/img/` tem as versões preparadas: logo com fundo transparente, a marca sem texto e a home ampliada em 3×.
- `node scripts/stills.mjs 120 300 …` renderiza quadros avulsos em `out/stills/` para revisão. Para os outros vídeos, use `COMP=Video2-VaiFuncionarAssim`, `COMP=Video3-QualComercioPrecisa` ou `COMP=Video4-EleTeAcha`.
