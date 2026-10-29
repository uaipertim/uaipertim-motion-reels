# Reel de teste "Prazer, Pertim"

O personagem com o rig (`src/personagem/`), em 9:16, 1080×1920 a 60 fps. Composição Remotion: `src/prazer-pertim/PrazerPertim.tsx` (`PrazerPertim`, `PrazerPertim-Capa`, `PertimBocaTeste`).

## Roteiro (texto da tela e da legenda)

1. **Gancho:** o Pertim chega de motinha desde o quadro 0, freia e para no meio olhando para a câmera.
   "Opa! Prazer, eu sou o UaiPertim… mas pode me chamar de Pertim."
2. **Lojinhas:** ele aponta e as lojinhas brotam, uma por palavra, piscando para ele.
   "Eu sei onde fica tudo no Glória: a padaria, o mercadim, a lanchonete…"
3. **Sacola:** ele pega a sacola, sorrindo; em "pertim" chega mais perto, com coraçõezinhos.
   "E logo, logo, vou levar tudo isso pertim de você."
4. **Fecho (6,5 s):** ele acena com a piscadinha, entra o chip "Segue @uaipertim" e a logo oficial fica parada nos últimos 5,2 s.
   "Segue a gente pra não perder a estreia!"

## Voz e mixagem

A voz e a mixagem vêm do pipeline do Explica, Sô! (`reels/explica-so/episodios/prazer-pertim.json`).

- **Voz:** Victor Pinho, perfil "narracao" (eleven_v4). Cada fala é uma geração inteira.
- **Pronúncia:** "UaiPertim" vai para a API como "Uai Pértim". O É aberto foi conferido pelo formante F1, entre 603 e 676 Hz, e a fala da cena 1 ficou como no roteiro.
- **Trilha:** a animada (Tudo Pertim) com efeitos.
- **Volume:** −14 LUFS e pico real ≤ −1 dBTP.

A chave do ElevenLabs nunca fica no repositório.

## Como refazer

```bash
python3 reels/explica-so/scripts/voz.py prazer-pertim     # a voz (só as falas que faltam; usa a API)
python3 reels/explica-so/scripts/linha.py prazer-pertim   # as cenas e as palavras no tempo do vídeo
npm run reel:prazer-pertim                                # preparar.py → audio.py → render.mjs → qa.py → storyboard.py
```

| script | faz |
|---|---|
| `scripts/preparar.py` | grava `dados/` e os efeitos sonoros (`cues.json`) a partir da voz: a cena e os eventos, os visemas (a boca quadro a quadro), as piscadas e os blocos da legenda |
| `scripts/render.mjs` | renderiza o vídeo, a capa e o teste da boca (`video`, `capa`, `boca`; sem argumento, os três) |
| `scripts/qa.py` | grava `output/revisao/relatorio-tecnico.txt`, que termina em "RESULTADO: aprovado" ou "RESULTADO: ajustar" |
| `scripts/storyboard.py` | grava `output/storyboard.png`, com os 12 momentos-chave tirados do MP4 |
| `scripts/quadros.mjs` | renderiza quadros soltos para conferir antes do render inteiro |

`layout.json` guarda as posições (personagem por cena, lojinhas, logo, chip, faixa da legenda, zona segura). A composição e o QA leem o mesmo arquivo.

## Saída (`output/`)

- `uaipertim-prazer-pertim.mp4`: o Reel, com 24,43 s.
- `capa.png` / `capa.jpg` / `capa-3x4.png`: a capa, com o Pertim acenando, e o recorte 3:4.
- `storyboard.png`
- `revisao/relatorio-tecnico.txt`: o QA.
- `revisao/capa-no-feed.jpg` e `revisao/capa.txt`: a capa no feed e a revisão do recorte.
- `revisao/boca-teste.mp4`: só o rosto, falando a cena 1, com a voz sozinha, para conferir a sincronia da boca.
