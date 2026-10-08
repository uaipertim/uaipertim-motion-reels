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

## Como editar

- **Textos de tela:** `src/config/texts.ts`
- **Tempos (fonte única para vídeo e áudio):** `src/config/timeline.json`
  - `scenes`: início e duração de cada cena
  - `beats`: momentos das animações, em frames locais de cada cena (ex.: `s2.stamp` = carimbo)
  - `narration.items`: texto, frame de entrada e velocidade de cada fala
  - `sfx`: cada efeito sonoro aponta para um beat, então se o beat muda o som acompanha
  - `music`: bpm, acordes e seções (respiro, pico)
- **Paleta e fontes:** `src/config/theme.ts`
- **Helpers de animação** (spring com overshoot, respiração, flutuação, squash): `src/lib/anim.ts`

Depois de mexer em tempos ou falas, regere o áudio e renderize de novo:

```bash
npm run audio     # locução + SFX + trilha + mix → public/audio/mix.wav
npm run render    # → out/uaipertim_video1_nao-precisa-baixar.mp4
npm run studio    # pré-visualização interativa
```

## Setup

```bash
npm install
# áudio (Python 3 + FluidSynth)
sudo apt-get install fluidsynth fluid-soundfont-gm
npm run audio:setup   # baixa o modelo de TTS Kokoro e instala as libs Python
```

## Áudio (gerado pelo projeto, sem samples externos)

- **Locução:** Kokoro TTS v1.0 offline, voz pt-BR `pf_dora` (`audio/tts.py`). As pronúncias são ajustadas em `narration.phonemeFixes`: "Uai" sai com uma sílaba só e "UaiPertim"/"pertim" com o jeitinho mineiro. Também tem queda do "r" no infinitivo ("baixá", "instalá", "ocupá"). Cada fala é acelerada sozinha se passar de `maxSeconds`.
- **Trilha:** 124 bpm, composta em MIDI (`audio/music.py`) e renderizada com FluidSynth + FluidR3 GM. Leva violão nylon em voicing de ukulele, marimba, glockenspiel/celesta, baixo, palmas e shaker. Sobe nas cenas 1–2, tem um respiro de ~1s no swipe da cena 3, cresce até o pico no CTA e fecha com o acorde do sting no end card.
- **SFX:** sintetizados em numpy (`audio/sfx.py`): glup, alarme, boing, carimbo, whoosh, pop mágico, sininho, digitação, tap, plop, confete etc.
- **Mix:** `audio/mix.py` faz o ducking da trilha guiado pela voz (-10 dB), a automação por seção e normaliza em -14 LUFS com limiter (pico -1.5 dBFS).

**Trocar por voz gravada:** grave as falas `n1`…`n6` como WAV, coloque em `audio/build/vo/` com esses nomes e rode `python3 audio/build_audio.py --no-tts`.

## Notas

- A Poppins é carregada localmente (`public/fonts`, arquivos do `@fontsource/poppins`) via `@remotion/fonts`. Assim o render funciona offline. O `@remotion/google-fonts` continua instalado como alternativa.
- O lançamento aparece como **"EM BREVE"**, sem data, conforme o prompt. Isso substitui o "segunda quinzena de agosto" que estava no roteiro.
- `assets/` guarda os originais recebidos. `public/img/` tem as versões preparadas: logo com fundo transparente, a marca sem texto e a home ampliada em 3×.
- `node scripts/stills.mjs 120 300 …` renderiza quadros avulsos em `out/stills/` para revisão.
