# Validação da voz v4 no fluxo do Tudo Pertim

Um capítulo de teste (`episodio.json`, `"voz": "v4"`) passou pelo fluxo real: `scripts/voz.py` → `scripts/linha.py` →
`render.cjs cues` → `scripts/audio.py` → `render.cjs video` (+ `info`), por `valida.sh`. Nenhum episódio de produção foi tocado.

## Voz (scripts/voz.py)

- modelo **eleven_v4** · ajustes `{"stability": 0.5, "similarity_boost": 0.75}` (sem style/speaker boost) · voz Victor Pinho (LuQ9eaWO9yCQrR73VQFa)
- texto na tela: "Ô Glória, o UaiPertim chegou pertim docês! Segue a gente pra não perder."
- **texto enviado à API**: "Ô Glória, o Uai Pértim chegou pértim docês! Segue a gente pra não perder."  (sem troca "Pérr-tim": sim; sem `<break>`: sim)
- seed usada **1042** · 2 geração(ões) · formato `mp3_44100_128` · áudio 5.20 s · fala 0.00–5.04 s
- conferência do voz.py: seed 42: ok (11.9 letras/s, maior pausa 0.28 s); seed 1042: ok (11.3 letras/s, maior pausa 0.32 s)
- **chiado final** (`scripts/chiado.py`): ok — fim da última letra 5.04 s, pior fração 4–10 kHz depois da fala 0.037
- alinhamento devolvido (letras): "Ô Glória, o Uai Pértim chegou pértim docês! Segue a gente pra não perder."
- "UaiPertim" na linha do tempo: `UaiPertim` em 1.117 s

## Linha do tempo (scripts/linha.py)

- capítulo 0.00–7.50 s · voz 0.10–5.14 s · 13 palavras · 1 apoio(s)
- mapa de tempos: falhas: duração 7.50 s fora de 45–60 s: ajuste `segura`/`min` (ou encurte o roteiro e gere a voz do capítulo inteiro de novo)
  (um capítulo só não fecha os 45–60 s de um episódio: essa é a única falha esperada aqui)
- degraus do alinhamento: tempos de letra em múltiplos de ~0.053 s

Palavras (gatilhos das peças): "bruto" = começo pelo alinhamento; "no vídeo" = depois do atraso de 60 ms e do
arredondamento para o quadro (60 fps); "som real" = onde o som começa na narração montada (só dá para medir em palavra
que vem depois de silêncio). Positivo na última coluna = o som começa DEPOIS do gatilho (peça adiantada).

| palavra | bruto (s) | no vídeo (s) | quadro | som real (s) | som − gatilho |
|---|---|---|---|---|---|
| Ô | 0.100 | 0.167 | 10 | 0.165 | -2 ms |
| Glória, | 0.340 | 0.400 | 24 | — | (sem silêncio antes) |
| o | 0.980 | 1.033 | 62 | 0.975 | -58 ms |
| UaiPertim | 1.060 | 1.117 | 67 | — | (sem silêncio antes) |
| chegou | 1.940 | 2.000 | 120 | — | (sem silêncio antes) |
| pertim | 2.420 | 2.483 | 149 | 2.440 | -43 ms |
| docês! | 3.060 | 3.117 | 187 | — | (sem silêncio antes) |
| Segue | 3.780 | 3.833 | 230 | 3.780 | -53 ms |
| a | 4.060 | 4.117 | 247 | — | (sem silêncio antes) |
| gente | 4.180 | 4.233 | 254 | — | (sem silêncio antes) |
| pra | 4.500 | 4.567 | 274 | — | (sem silêncio antes) |
| não | 4.633 | 4.700 | 282 | — | (sem silêncio antes) |
| perder. | 4.820 | 4.883 | 293 | — | (sem silêncio antes) |

- todos os gatilhos caem exatamente num quadro: sim
- peça antes da palavra: nenhuma — onde deu para medir, toda peça entra depois de o som começar (a mais justa, 2 ms depois)

## Render

- `validacao-v4.mp4`: 7.50 s · streams ['video,1080,1920,60/1', 'audio,0/0']
- palavras com "em" que não dispararam peça (motor.json → palavras_sem_peca): [] (vazio = todas dispararam)
- a logo do fecho entra em 1.117 s (o gatilho de "UaiPertim") e para em 2.017 s; peças do capítulo de 1.117 a 3.900 s
- a narração usada no render é a salva em `voz/` (cap-00.wav, sha1 752f9482e4e6…): re-rodar `valida.sh` não chama a API
