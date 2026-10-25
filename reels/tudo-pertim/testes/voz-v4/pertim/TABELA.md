# Grafias do "Pértim" no eleven_v4 (teste; o padrão não mudou)

Frase base (a da validação): "Ô Glória, o UaiPertim chegou pertim docês! Segue a gente pra não perder.". Na validação, com o texto sem troca, "UaiPertim"/"pertim" não saiu com o E aberto.
Aqui só muda o texto enviado à API. Voz Victor Pinho (LuQ9eaWO9yCQrR73VQFa), `eleven_v4`, ajustes `{"stability": 0.5, "similarity_boost": 0.75}`
(sem style/speaker boost), endpoint `with-timestamps`, saída mp3_44100_128, sem previous_text/next_text; cada arquivo é UMA
geração inteira. Chiado: `scripts/chiado.py`. Áudios para ouvir: `exports/tiktok/testes/voz-v4/pertim/`.

| Arquivo | Texto exato enviado | Seed | Duração | Chiado |
|---|---|---|---|---|
| `v4_pertim_acento-separado_s42.mp3` | Ô Glória, o Uai Pértim chegou pértim docês! Segue a gente pra não perder. | 42 | 5.12 s | ok (pior fração 4–10 kHz: 0.0) |
| `v4_pertim_acento-separado_s1042.mp3` | Ô Glória, o Uai Pértim chegou pértim docês! Segue a gente pra não perder. | 1042 | 5.20 s | ok (pior fração 4–10 kHz: 0.034) |
| `v4_pertim_acento-junto_s42.mp3` | Ô Glória, o UaiPértim chegou pértim docês! Segue a gente pra não perder. | 42 | 5.28 s | ok (pior fração 4–10 kHz: 0.03) |
| `v4_pertim_acento-junto_s1042.mp3` | Ô Glória, o UaiPértim chegou pértim docês! Segue a gente pra não perder. | 1042 | 5.20 s | ok (pior fração 4–10 kHz: 0.0) |
| `v4_pertim_rr-separado_s42.mp3` | Ô Glória, o Uai Pérrtim chegou pérrtim docês! Segue a gente pra não perder. | 42 | 5.28 s | ok (pior fração 4–10 kHz: 0.0) |
| `v4_pertim_rr-separado_s1042.mp3` | Ô Glória, o Uai Pérrtim chegou pérrtim docês! Segue a gente pra não perder. | 1042 | 5.28 s | ok (pior fração 4–10 kHz: 0.025) |
| `v4_pertim_uai-pe-virgula_s42.mp3` | Ô Glória, o Uai, Pértim, chegou pértim docês! Segue a gente pra não perder. | 42 | 5.68 s | ok (pior fração 4–10 kHz: 0.01) |
| `v4_pertim_uai-pe-virgula_s1042.mp3` | Ô Glória, o Uai, Pértim, chegou pértim docês! Segue a gente pra não perder. | 1042 | 6.00 s | ok (pior fração 4–10 kHz: 0.024) |
