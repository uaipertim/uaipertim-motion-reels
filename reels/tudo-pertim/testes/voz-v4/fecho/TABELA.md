# Fecho e grafia do "pertim" no eleven_v4 (teste; a produção não mudou)

Frase nova: "Semana começando? Relaxa, tem UaiPertim. Tudo pertim de você. Segue a gente!" (a 4ª variante é a frase atual do fecho do EP. 04, de referência). No EP. 04, "com o Uai" emendou ("Uapértim") e a força de "Pértim" não ficou no final (o certo é per-TIM).
Aqui só muda o texto enviado à API. Voz Victor Pinho (LuQ9eaWO9yCQrR73VQFa), `eleven_v4`, ajustes `{"stability": 0.5, "similarity_boost": 0.75}`
(sem style/speaker boost), endpoint `with-timestamps`, saída mp3_44100_128, sem previous_text/next_text; cada arquivo é UMA
geração inteira. Chiado: `scripts/chiado.py`. Corte pelo som: sobra ≥ 50 ms depois da última letra e últimos 40 ms abaixo de −45 dBFS. Áudios para ouvir: `exports/tiktok/testes/voz-v4/fecho/`.

| Arquivo | Texto exato enviado | Seed | Duração | Chiado | Corte pelo som |
|---|---|---|---|---|---|
| `fecho_relaxa_Pertim-acento_s42.mp3` | Semana começando? Relaxa, tem Uai Pértim. Tudo pértim de você. Segue a gente! | 42 | 6.08 s | ok (pior fração 4–10 kHz: 0.0) | ok (sobra 0.16 s, fim do arquivo -88 dB) |
| `fecho_relaxa_Pertim-acento_s1042.mp3` | Semana começando? Relaxa, tem Uai Pértim. Tudo pértim de você. Segue a gente! | 1042 | 5.92 s | ok (pior fração 4–10 kHz: 0.04) | ok (sobra 0.24 s, fim do arquivo -89 dB) |
| `fecho_relaxa_pertim-i_s42.mp3` | Semana começando? Relaxa, tem Uai pertím. Tudo pertím de você. Segue a gente! | 42 | 6.00 s | ok (pior fração 4–10 kHz: 0.0) | ok (sobra 0.16 s, fim do arquivo -86 dB) |
| `fecho_relaxa_pertim-i_s1042.mp3` | Semana começando? Relaxa, tem Uai pertím. Tudo pertím de você. Segue a gente! | 1042 | 5.92 s | ok (pior fração 4–10 kHz: 0.0) | ok (sobra 0.16 s, fim do arquivo -89 dB) |
| `fecho_relaxa_perrtim-grave_s42.mp3` | Semana começando? Relaxa, tem Uai pèrtím. Tudo pèrtím de você. Segue a gente! | 42 | 6.08 s | ok (pior fração 4–10 kHz: 0.0) | ok (sobra 0.16 s, fim do arquivo -89 dB) |
| `fecho_relaxa_perrtim-grave_s1042.mp3` | Semana começando? Relaxa, tem Uai pèrtím. Tudo pèrtím de você. Segue a gente! | 1042 | 6.08 s | ok (pior fração 4–10 kHz: 0.0) | ok (sobra 0.16 s, fim do arquivo -88 dB) |
| `fecho_deixa_Pertim-acento_s42.mp3` | Semana começando? Deixa com o Uai Pértim. Tudo pértim de você. Segue a gente! | 42 | 5.60 s | ok (pior fração 4–10 kHz: 0.013) | ok (sobra 0.16 s, fim do arquivo -83 dB) |
| `fecho_deixa_Pertim-acento_s1042.mp3` | Semana começando? Deixa com o Uai Pértim. Tudo pértim de você. Segue a gente! | 1042 | 5.60 s | ok (pior fração 4–10 kHz: 0.026) | ok (sobra 0.24 s, fim do arquivo -90 dB) |
