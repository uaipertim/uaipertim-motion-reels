# Teste de pronúncia do "Pertim" (perfil "narracao", eleven_v4)

O É aberto está certo, mas o final do "Pertim" soa "Pértin" (com N). Todas as amostras usam a mesma voz (Victor Pinho), o
mesmo perfil (eleven_v4, stability 0.50, similarity 0.75) e a frase da tela "Prazer, eu sou o UaiPertim, mas pode me chamar
de Pertim.". Cada MP3 é uma geração inteira, sem emenda. Script: `gerar.py`; dados: `amostras.json`.

| arquivo | grafia | texto enviado à API | seed |
|---|---|---|---|
| a1.mp3 | Pértim (a atual) | Prazer, eu sou o Uai Pértim, mas pode me chamar de Pértim. | 42 |
| a2.mp3 | Pértim (a atual) | Prazer, eu sou o Uai Pértim, mas pode me chamar de Pértim. | 1042 |
| b.mp3 | Pértĩ | Prazer, eu sou o Uai Pértĩ, mas pode me chamar de Pértĩ. | 42 |
| c.mp3 | Pértimm | Prazer, eu sou o Uai Pértimm, mas pode me chamar de Pértimm. | 42 |
| d.mp3 | Pertim (sem troca) | Prazer, eu sou o UaiPertim, mas pode me chamar de Pertim. | 42 |
| e.mp3 | Pértim + ponto logo depois | Prazer, eu sou o Uai Pértim. Mas pode me chamar de Pértim. | 42 |

Na e, a vírgula depois de "Uai Pértim" virou ponto (só no texto enviado; a tela continua com a frase do roteiro).
A grafia escolhida vai para as 3 ocorrências do Reel ("UaiPertim" e "Pertim" na cena 1, "pertim de você" na cena 3).

**Escolhida em 2026-10-29: d** ("UaiPertim" / "Pertim" sem troca). Registrada no perfil "narracao" de
`audio/voz_oficial.json`; as cenas 1 e 3 do Reel foram geradas de novo com ela.
