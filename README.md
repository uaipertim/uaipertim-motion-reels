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

**Sem locução, com legenda animada.** O Vídeo 1 usa só trilha + efeitos sonoros, e a narração aparece como legenda estilo karaokê (`src/components/Captions.tsx`):
- Os blocos entram com pulinho e as palavras pipocam uma a uma.
- A palavra "da vez" ganha marcador coral, e as `*palavras*` entre asteriscos ficam em amarelo.
- A pílula pulsa de leve na batida (124 bpm).
- A faixa fica em y ≈ 1380–1480, acima da área que a interface do Reels cobre.

Textos e tempos ficam em `captions` no `src/config/timeline.json`. Para voltar a usar voz (ex.: locução gravada), ponha `narration.enabled: true` e, se quiser, `captions.enabled: false`.

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

O celular-personagem da cena 1 vira o "palco" (`src/v2/scenes/Stage.tsx`): cada toque do cursor abre a tela seguinte com zoom-through. A passagem 5→6 é um swipe coral.

Componentes novos, reutilizáveis nos próximos vídeos:
- `components/Guide.tsx`: cursor/dedinho com ripple, badge de passo 1-2-3, zoom-through.
- `components/AppUi.tsx`: cabeçalho do app, busca, tiles de categoria, mapa cartoon, card de estabelecimento, linha do tempo do pedido e estradinha com o motinho.
- `components/AppIcons.tsx`: ícones novos (motinho, lojinha, setinha, piscadinha 😉 etc.).

Regras de conteúdo seguidas:
- O card é um exemplo genérico, "Comércio da cidade".
- O lançamento aparece como "CHEGANDO EM BREVE", sem data.
- A abertura leva o chip "PRÉVIA".

## Como editar

- **Textos de tela:** `src/config/texts.ts` (Vídeo 1) · `src/v2/config/texts.ts` (Vídeo 2)
- **Tempos (fonte única para vídeo e áudio):** `src/config/timeline.json` (Vídeo 1) · `src/v2/config/timeline.json` (Vídeo 2)
  - `scenes`: início e duração de cada cena
  - `beats`: momentos das animações, em frames locais de cada cena (ex.: `s2.stamp` = carimbo)
  - `captions`: legenda animada (texto e frames de cada bloco; Vídeo 1)
  - `narration.items`: texto, frame de entrada e velocidade de cada fala (`narration.enabled` liga ou desliga a voz)
  - `sfx`: cada efeito sonoro aponta para um beat, então se o beat muda o som acompanha
  - `music`: bpm, acordes, seções (respiro, pico), `breakBars` (breques) e `accents` (os "degraus" dos passos 1-2-3 no Vídeo 2)
- **Paleta e fontes:** `src/config/theme.ts`
- **Helpers de animação** (spring com overshoot, respiração, flutuação, squash): `src/lib/anim.ts`

Depois de mexer em tempos ou falas, regere o áudio e renderize de novo:

```bash
npm run audio       # Vídeo 1: locução + SFX + trilha + mix → public/audio/mix.wav
npm run render      # → out/uaipertim_video1_nao-precisa-baixar.mp4
npm run audio:v2    # Vídeo 2 → public/audio/v2/mix.wav
npm run render:v2   # → out/uaipertim_video2_vai-funcionar-assim.mp4
npm run studio      # pré-visualização interativa (as duas composições)
```

## Setup

```bash
npm install
# áudio (Python 3 + FluidSynth)
sudo apt-get install fluidsynth fluid-soundfont-gm
npm run audio:setup   # baixa as vozes (Piper pt-BR + Kokoro) e instala as libs Python
```

## Áudio (gerado pelo projeto, sem samples externos)

- **Locução:** desligada no Vídeo 1, que usa legenda animada. No Vídeo 2: voz **Piper `pt_BR-cadu-medium`**, treinada com um falante brasileiro nativo (dataset CC0, uso comercial liberado), rodando offline (`audio/tts.py`).
  - A pronúncia é ajustada em `narration.phonemeFixes.piper`: o "Uaai" sai numa sílaba, levemente arrastado, e o "w" de Uai-Pertim fica bem marcado. A grafia mineira entra direto no texto: "baixá", "instalá", "ocupá".
  - O modelo varia a cada geração. A `seed` de cada fala em `timeline.json` fixa o take escolhido.
  - `audio/pick_takes.py` (opcional, usa Whisper) gera vários takes por fala, transcreve cada um e grava a seed do mais fiel ao texto.
  - No Vídeo 2 a marca fica num trecho próprio da fala, um pouco mais lento (`speedMul`). Cada trecho pode ter `seed` e `pauseAfter` próprios. A voz `cadu` fala devagar, então as falas 1–3 vão a ~1,2–1,3× e algumas avançam alguns frames sobre a cena seguinte, como num corte em "L" de edição.
  - Para trocar a voz, mude `narration.voice` (`pt_BR-faber-medium` é outra voz masculina brasileira). Para voltar ao Kokoro, use `"engine": "kokoro"` com `"voice": "pf_dora"`, mas o sotaque dele soa estrangeiro.
- **Trilha:** 124 bpm, composta em MIDI (`audio/music.py`) e renderizada com FluidSynth + FluidR3 GM. Leva violão nylon em voicing de ukulele, marimba, glockenspiel/celesta, baixo, palmas e shaker. Sobe nas cenas 1–2, tem um respiro de ~1s no swipe da cena 3, cresce até o pico no CTA e fecha com o acorde do sting no end card.
- **SFX:** sintetizados em numpy (`audio/sfx.py`): glup, alarme, boing, carimbo, whoosh, pop mágico, sininho, digitação, tap, plop, confete etc.
- **Mix:** `audio/mix.py` faz o ducking da trilha guiado pela voz (-10 dB no Vídeo 1, -9 dB com 120 ms de antecipação no Vídeo 2), a automação por seção e normaliza em -14 LUFS com limiter (pico -1.5 dBFS).
- **Vários vídeos:** todos os scripts aceitam `--video v1|v2` (padrão `v1`). A saída de cada vídeo vai para `audio/build/<vídeo>` e para o seu `mix.wav`.

**Trocar por voz gravada:** grave as falas `n1`…`n6` como WAV, coloque em `audio/build/vo/` (Vídeo 1) ou `audio/build/v2/vo/` (Vídeo 2) com esses nomes e rode `python3 audio/build_audio.py [--video v2] --no-tts`.

## Notas

- A Poppins é carregada localmente (`public/fonts`, arquivos do `@fontsource/poppins`) via `@remotion/fonts`. Assim o render funciona offline. O `@remotion/google-fonts` continua instalado como alternativa.
- O lançamento aparece como **"EM BREVE"**, sem data, conforme o prompt. Isso substitui o "segunda quinzena de agosto" que estava no roteiro.
- `assets/` guarda os originais recebidos. `public/img/` tem as versões preparadas: logo com fundo transparente, a marca sem texto e a home ampliada em 3×.
- `node scripts/stills.mjs 120 300 …` renderiza quadros avulsos em `out/stills/` para revisão. Para o Vídeo 2, use `COMP=Video2-VaiFuncionarAssim`.
