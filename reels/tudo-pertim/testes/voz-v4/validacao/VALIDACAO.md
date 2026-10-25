# Validação da voz v4 no fluxo do Tudo Pertim

Um capítulo de teste (`episodio.json`, `"voz": "v4"`) passou pelo fluxo real: `scripts/voz.py` → `scripts/linha.py` →
`render.cjs cues` → `scripts/audio.py` → `render.cjs video` (+ `info`), por `valida.sh`. Nenhum episódio de produção foi tocado.

## Voz (scripts/voz.py)

- modelo **eleven_v4** · ajustes `{"stability": 0.5, "similarity_boost": 0.75}` (sem style/speaker boost) · voz Victor Pinho (LuQ9eaWO9yCQrR73VQFa)
- texto na tela: "Ô Glória, o UaiPertim chegou pertim docês! Segue a gente pra não perder."
- **texto enviado à API**: "Ô Glória, o UaiPertim chegou pertim docês! Segue a gente pra não perder."  (sem troca "Pérr-tim": sim; sem `<break>`: sim)
- seed usada **42** · 1 geração(ões) · formato `mp3_44100_128` · áudio 4.96 s · fala 0.00–4.80 s
- conferência do voz.py: seed 42: ok (11.9 letras/s, maior pausa 0.28 s)
- **chiado final** (`scripts/chiado.py`): ok — fim da última letra 4.8 s, pior fração 4–10 kHz depois da fala 0.03
- alinhamento devolvido (letras): "Ô Glória, o UaiPertim chegou pertim docês! Segue a gente pra não perder."
- "UaiPertim" na linha do tempo: `UaiPertim` em 1.083 s

## Linha do tempo (scripts/linha.py)

- capítulo 0.00–7.50 s · voz 0.10–4.90 s · 13 palavras · 1 apoio(s)
- mapa de tempos: falhas: duração 7.50 s fora de 45–60 s: ajuste `segura`/`min` (ou encurte o roteiro e gere a voz do capítulo inteiro de novo)
  (um capítulo só não fecha os 45–60 s de um episódio: essa é a única falha esperada aqui)
- degraus do alinhamento: tempos de letra em múltiplos de ~0.060 s

Palavras (gatilhos das peças): "bruto" = começo pelo alinhamento; "no vídeo" = depois do atraso de 60 ms e do
arredondamento para o quadro (60 fps); "som real" = onde o som começa na narração montada (só dá para medir em palavra
que vem depois de silêncio). Positivo na última coluna = o som começa DEPOIS do gatilho (peça adiantada).

| palavra | bruto (s) | no vídeo (s) | quadro | som real (s) | som − gatilho |
|---|---|---|---|---|---|
| Ô | 0.100 | 0.167 | 10 | 0.130 | -37 ms |
| Glória, | 0.340 | 0.400 | 24 | — | (sem silêncio antes) |
| o | 0.940 | 1.000 | 60 | 0.935 | -65 ms |
| UaiPertim | 1.020 | 1.083 | 65 | — | (sem silêncio antes) |
| chegou | 1.740 | 1.800 | 108 | — | (sem silêncio antes) |
| pertim | 2.100 | 2.167 | 130 | 2.150 | -17 ms |
| docês! | 2.820 | 2.883 | 173 | — | (sem silêncio antes) |
| Segue | 3.540 | 3.600 | 216 | 3.495 | -105 ms |
| a | 3.820 | 3.883 | 233 | — | (sem silêncio antes) |
| gente | 3.940 | 4.000 | 240 | — | (sem silêncio antes) |
| pra | 4.260 | 4.317 | 259 | — | (sem silêncio antes) |
| não | 4.393 | 4.450 | 267 | — | (sem silêncio antes) |
| perder. | 4.580 | 4.633 | 278 | — | (sem silêncio antes) |

- todos os gatilhos caem exatamente num quadro: sim
- peça antes da palavra: nenhuma — onde deu para medir, toda peça entra depois de o som começar (a mais justa, 17 ms depois)

## Render

- `validacao-v4.mp4`: 7.50 s · streams ['video,1080,1920,60/1', 'audio,0/0']
- palavras com "em" que não dispararam peça (motor.json → palavras_sem_peca): [] (vazio = todas dispararam)
- a logo do fecho entra em 1.083 s (o gatilho de "UaiPertim") e para em 1.983 s; peças do capítulo de 1.083 a 3.750 s
- a narração usada no render é a salva em `voz/` (cap-00.wav, sha1 35cb00302e5f…): re-rodar `valida.sh` não chama a API
