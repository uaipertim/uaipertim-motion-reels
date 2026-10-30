# Teste A/B de pronúncia de "UaiPertim" (Reel "Pedir no UaiPertim é assim")

Voz Victor Pinho, perfil "narracao" (eleven_v4, stability 0.50, similarity 0.75), seed 42. Cada MP3 é a fala INTEIRA,
uma geração só, sem emenda. Só muda a grafia enviada à voz; na tela continua "UaiPertim". Script: `gerar.py`; dados:
`amostras.json`.

| grafia | fala 1 ("Bateu aquela fome? Ó, pedir no … é assim:") | fala 7 ("…. Tá chegando no Glória!") |
|---|---|---|
| A) UaiPertim (atual) | f1-A-uaipertim-atual.mp3 | f7-A-uaipertim-atual.mp3 |
| B) Uai Pértim | f1-B-uai-pertim-acento-no-e.mp3 | f7-B-uai-pertim-acento-no-e.mp3 |
| C) Uai pertím | f1-C-uai-pertim-acento-no-i.mp3 | f7-C-uai-pertim-acento-no-i.mp3 |
| D) Uai Pertim (separado, sem acento) | f1-D-uai-pertim-separado.mp3 | f7-D-uai-pertim-separado.mp3 |
| E) UaiPértim | f1-E-uaipertim-acento-no-e-junto.mp3 | f7-E-uaipertim-acento-no-e-junto.mp3 |

F) Dicionário de pronúncia / alias: o pipeline não usa os dicionários da ElevenLabs. Um alias só troca o texto antes de
falar (o mesmo que B–E), então não foi gerado.

A grafia escolhida vale para todas as falas com "UaiPertim" ou "Pertim".
