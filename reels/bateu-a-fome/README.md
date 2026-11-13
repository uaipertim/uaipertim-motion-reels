# Reel "Bateu a fome?" (Instagram @uaipertim)

Comercial rápido no ritmo de anúncio de delivery, narrado pelo Pertim. Formato 9:16, 1080×1920 a **30 fps**, com **26,00 s** (780 quadros).
Composição Remotion: `src/bateu-a-fome/BateuAFome.tsx` (`BateuAFome`). Roteiro: `roteiro.json`, nesta pasta.

Da referência (comercial de delivery), só ficaram o ritmo e a estrutura: cortes de 1 a 2 s no tempo da batida.
Não há identidade, slogan nem elemento de outra marca. Também não há preço, nome de loja real nem tela do app: o
celular da cena 4 é genérico, com blocos e cards.

## Roteiro e cenas (todo corte numa batida)

A trilha é a **animada do Tudo Pertim** (`"trilha": "animada"`, 120 BPM, uma batida a cada 0,5 s, começando em t = 0).
`"grade": true` no roteiro liga o modo **grade de batidas** do `linha.py`:

- não há troca de 0,9 s entre as cenas;
- cada cena começa onde a anterior termina e dura no mínimo `batidas`;
- cada cena termina na **primeira batida depois do fim da fala** + `segura`.

| # | cena | tempo (batidas) | voz | tela | entrada |
|---|---|---|---|---|---|
| 1 | gancho | 0,0–1,5 s (0–3) | "Bateu aquela fome?" | fundo creme com raios, "Bateu a fome?" escrito à mão (Caveat, traço que se desenha letra a letra), o "?" pula; o Pertim sobe falando | movimento desde o quadro 0 |
| 2 | logo | 1,5–3,5 s (3–7) | "Uai... tem UaiPertim!" | o pin cai na batida e quica, o toldo listrado abre em "tem", a logo explode em "UaiPertim" (raios, confete) | íris coral a partir do impacto do pin |
| 3 | lojas | 3,5–7,0 s (7–14) | "As lojas do Glória, tudo num lugar só." | fileiras de lojinhas com olhinhos descendo rápido; freiam e param em "lugar"; a moldura com o pin fecha em "só" | empurra para baixo |
| 4 | na mão | 7,0–9,0 s (14–18) | "Na palma da sua mão." | mão segurando um celular estilizado (blocos e cards genéricos); "Na palma da sua mão!" palavra por palavra | zoom-out: as lojinhas viram a tela do celular |
| 5 | desfile | 9,0–14,0 s (18–28) | "Pão de queijo, hambúrguer, pizza, açaí... e até o mercado!" | palavras GIGANTES em sílabas, foto em adesivo e o botão "+" (sem preço); selo "Imagens ilustrativas" | zoom para dentro da tela; entre as palavras, a cor varre da direita |
| 6 | pagamento | 14,0–17,0 s (28–34) | "Paga no Pix, no cartão ou na entrega." | três selos carimbados, cada um na sua palavra: Pix, Cartão, Na entrega | a tela se parte em três faixas que caem |
| 7 | rapidim | 17,0–19,5 s (34–39) | "E o Pertim leva rapidim!" | "RAPIDIM" gigante passando ao fundo e o Pertim atravessando de motinha; depois o mapa simples, com a rota pontilhada do pin até a casinha | chicote horizontal; o mapa entra empurrando |
| 8 | chegou | 19,5–21,0 s (39–42) | "Chegou!" | check verde, "Seu pedido chegou!" e 5 estrelas acendendo uma a uma | íris verde saindo da porta da casinha |
| 9 | fecho | 21,0–26,0 s (42–52) | "Foi facim! UaiPertim. Tudo pertim de você." | "Foi facim!" à mão, a logo (para em 22,91 s e fica até o fim), "Tudo pertim de você." e o selo "Em breve no Glória"; o Pertim acena e pisca | faixa diagonal amarela |

**O desfile.** Cada palavra entra numa batida: 18, 20, 22, 24 e 26. Cada sílaba estoura no instante em que a voz a fala
(pelo alinhamento por caractere). O "+" aperta quando a palavra termina.

- Pão de queijo: 9,00 s · Pão 9,08 · de 9,32 · queijo 9,52
- Ham-búr-guer: 10,00 s · 10,16 · 10,36 · 10,60
- Piz-za: 11,00 s · 11,36 · 11,53
- A-ça-í: 12,00 s · 12,00 · 12,04 · 12,28
- Mer-ca-do: 13,00 s · 13,44 · 13,59 · 13,72

As fotos do desfile são as fotos de categoria já usadas no Reel "Pedir no UaiPertim" (`public/pedir-no-uaipertim/fotos/`).

**Por que 26 s, e não 25.** O v4 fala ~9–10 letras/s, e a soma das falas dá 21,3 s. Com os cortes nas batidas, a
cena 3 precisou de 3,5 s (a fala tem 2,88 s) e a cena 6 de 3,0 s. Mesmo assim, o total ficou no limite pedido (22–26 s).
Seeds diferentes quase não mudam a duração da fala (variação de ±0,1 s).

## Voz

- **Voz:** Victor Pinho, perfil `narracao` (eleven_v4, estabilidade 0,50, semelhança 0,75). Cada fala é UMA geração inteira.
- **Pronúncia:** "UaiPertim"/"Pertim" vão para a voz sem troca de grafia (padrão atual).
- **Glória:** só "do/no Glória"; o `voz.py` recusa "de Glória".
- **Tomadas escolhidas** (geradas com `scripts/tomadas.py`, instaladas com `--usar`; tudo em `tomadas/`):

| cena | fala | tomada | seed | fala (s) | por quê |
|---|---|---|---|---|---|
| 1 | Bateu aquela fome? | K (`cap-00/K-seed2042-duas-interrogacoes.mp3`), enviada como "fome??" | 2042 | 1,20 | a maior subida até a tônica e o fim mais alto entre as completas (ver abaixo) |
| 2 | Uai... tem UaiPertim! | C (`cap-01/C-seed2042.mp3`) | 2042 | 1,76 | a mais curta; o fim do "Pertim" com F2 caindo ("im") |
| 3 | As lojas do Glória… | C (`cap-02/C-seed2042.mp3`) | 2042 | 2,88 | a mais curta das 6 |
| 4 | Na palma da sua mão. | voz.py | 42 | 1,44 | — |
| 5 | Pão de queijo… | F (`cap-04/F-seed5042.mp3`) | 5042 | 4,80 | a mais curta das 6 |
| 6 | Paga no Pix… | D (`cap-05/D-seed3042.mp3`) | 3042 | 2,56 | a mais curta das 6 |
| 7 | E o Pertim leva rapidim! | D (`cap-06/D-seed3042.mp3`) | 3042 | 1,76 | a mais curta; o fim do "Pertim" com F2 caindo ("im") |
| 8 | Chegou! | voz.py | 42 | 0,56 | — |
| 9 | Foi facim! UaiPertim. Tudo pertim de você. | E (`cap-08/E-seed4042.mp3`) | 4042 | 3,76 | o "pertim de você" com F2 caindo ("im") |

**Pronúncia do "Pertim".** A medição acústica das falas 2, 7 e 9 não é conclusiva. O alinhamento do v4 vem em degraus
de 40 ms, e o F1 do "é" saiu instável. As amostras A/B de cada fala estão em `tomadas/cap-01`, `cap-06` e `cap-08`
para conferir de ouvido. Para trocar uma fala:

```bash
python3 scripts/tomadas.py bateu-a-fome <cap> --usar <letra>
```

Depois, refaça a partir do `linha.py` (ver "Como refazer").

## A subida da pergunta do gancho (F0)

Medido com `scripts/tomadas.py` (YIN, passo de 10 ms) e conferido no `qa.py`, na voz usada no vídeo
(gráfico: `output/revisao/f0-gancho.png`):

- **sobe:** de 120 Hz (mediana de "aquela") para **237 Hz na tônica "FO"**, ou seja, **+11,9 st**;
- **depois cai:** o fim do trecho com voz fica em 162 Hz (−6,6 st em relação ao pico), e o "-me" final sai grave e quase sem voz.

**A pergunta NÃO termina subindo.** Nenhuma das 41 tomadas fez o "-me" final subir. O contorno é sempre o da pergunta
comum do português: sobe na tônica e cai na postônica. Das 41 tomadas, 32 estão completas e 9 saíram cortadas.

As variações testadas (só no texto enviado; tela e legenda continuam "Bateu a fome?"/"Bateu aquela fome?"):

- 8 seeds;
- "fome??", "FOME?", "fome?!", "fome...?" e "fomee?";
- sem o texto vizinho como contexto, e com outro contexto;
- as marcas de entonação do v4 ("[curious]", "[questioning, rising intonation]", "[pitch rises at the end of the
  question]", "[excited, upspeak]"). Elas saíram **cortadas no fim** (o áudio termina ainda com som, a −27 dB) e
  foram descartadas;
- só para comparar, 4 tomadas no perfil `pausas` (multilingual_v2), que também caem.

A tomada K é a de fim mais alto entre as completas no perfil `narracao`. A tabela completa (pico = F0 máximo em "fome";
fim = mediana dos 3 últimos quadros com voz):

| tomada | seed | texto enviado à voz | variação | pico na tônica | fim | fim × pico | áudio |
|---|---|---|---|---|---|---|---|
| A | 42 | `Bateu aquela fome?` | padrão | 219 Hz | 120 Hz | -10.4 st | completa |
| B | 1042 | `Bateu aquela fome?` | padrão | 213 Hz | 118 Hz | -10.3 st | completa |
| C | 2042 | `Bateu aquela fome?` | padrão | 200 Hz | 98 Hz | -12.4 st | completa |
| D | 3042 | `Bateu aquela fome?` | padrão | 200 Hz | 94 Hz | -13.0 st | completa |
| E | 4042 | `Bateu aquela fome?` | padrão | 223 Hz | 92 Hz | -15.3 st | completa |
| F | 5042 | `Bateu aquela fome?` | padrão | 233 Hz | 124 Hz | -11.0 st | completa |
| G | 6042 | `Bateu aquela fome?` | padrão | 235 Hz | 121 Hz | -11.5 st | completa |
| H | 7042 | `Bateu aquela fome?` | padrão | 198 Hz | 120 Hz | -8.6 st | completa |
| I | 42 | `Bateu aquela fome??` | duas-interrogacoes | 236 Hz | 114 Hz | -12.5 st | completa |
| J | 1042 | `Bateu aquela fome??` | duas-interrogacoes | 209 Hz | 120 Hz | -9.7 st | completa |
| K **(usada)** | 2042 | `Bateu aquela fome??` | duas-interrogacoes | 237 Hz | 162 Hz | -6.6 st | completa |
| L | 42 | `Bateu aquela FOME?` | maiusculas | 216 Hz | 124 Hz | -9.6 st | completa |
| M | 1042 | `Bateu aquela FOME?` | maiusculas | 218 Hz | 104 Hz | -12.9 st | completa |
| N | 42 | `Bateu aquela fome?!` | interrog-exclam | 255 Hz | 172 Hz | -6.8 st | completa |
| O | 1042 | `Bateu aquela fome?!` | interrog-exclam | 255 Hz | 102 Hz | -15.9 st | completa |
| P | 42 | `Bateu aquela fome...?` | reticencias | 208 Hz | 143 Hz | -6.5 st | completa |
| Q | 1042 | `Bateu aquela fome...?` | reticencias | 215 Hz | 115 Hz | -10.9 st | completa |
| R | 42 | `Bateu aquela fome?` | sem-contexto | 255 Hz | 125 Hz | -12.4 st | completa |
| S | 1042 | `Bateu aquela fome?` | sem-contexto | 253 Hz | 118 Hz | -13.3 st | completa |
| T | 2042 | `Bateu aquela fome?` | sem-contexto | 266 Hz | 102 Hz | -16.5 st | completa |
| U | 3042 | `Bateu aquela fome?` | sem-contexto | 241 Hz | 101 Hz | -15.1 st | completa |
| V | 42 | `Bateu aquela fomee?` | fomee | 264 Hz | 83 Hz | -20.0 st | completa |
| W | 1042 | `Bateu aquela fomee?` | fomee | 267 Hz | 85 Hz | -19.8 st | completa |
| X | 42 | `[curious] Bateu aquela fome?` | tag-curious | 217 Hz | 127 Hz | -9.3 st | completa |
| Y | 1042 | `[curious] Bateu aquela fome?` | tag-curious | 224 Hz | 128 Hz | -9.7 st | completa |
| Z | 42 | `[questioning, rising intonation] Bateu aquela fome?` | tag-rising | 345 Hz | 206 Hz | -8.9 st | cortada |
| AA | 1042 | `[questioning, rising intonation] Bateu aquela fome?` | tag-rising | 290 Hz | 111 Hz | -16.6 st | cortada |
| AB | 42 | `[pitch rises at the end of the question] Bateu aquela fome?` | tag-sobe-no-fim | 304 Hz | 181 Hz | -9.0 st | cortada |
| AC | 1042 | `[pitch rises at the end of the question] Bateu aquela fome?` | tag-sobe-no-fim | 350 Hz | 113 Hz | -19.5 st | cortada |
| AD | 2042 | `[pitch rises at the end of the question] Bateu aquela fome?` | tag-sobe-no-fim | 207 Hz | 137 Hz | -7.1 st | cortada |
| AE | 42 | `[excited, upspeak] Bateu aquela fome?` | tag-upspeak | 368 Hz | 132 Hz | -17.7 st | cortada |
| AF | 1042 | `[excited, upspeak] Bateu aquela fome?` | tag-upspeak | 313 Hz | 125 Hz | -15.9 st | cortada |
| AG | 2042 | `[excited, upspeak] Bateu aquela fome?` | tag-upspeak | 342 Hz | 298 Hz | -2.4 st | cortada |
| AH | 42 | `Bateu aquela fome?` | ctx-hein | 241 Hz | 105 Hz | -14.4 st | completa |
| AI | 1042 | `Bateu aquela fome?` | ctx-hein | 256 Hz | 108 Hz | -14.9 st | completa |
| AJ | 42 | `Bateu aquela fome?` | ctx-me-conta | 177 Hz | 87 Hz | -12.4 st | completa |
| AK | 1042 | `Bateu aquela fome?` | ctx-me-conta | 159 Hz | 75 Hz | -13.1 st | completa |
| AL | 42 | `Bateu aquela fome?` | perfil-pausas-v2 | 147 Hz | 144 Hz | -0.3 st | completa |
| AM | 1042 | `Bateu aquela fome?` | perfil-pausas-v2 | 136 Hz | 79 Hz | -9.5 st | completa |
| AN | 2042 | `Bateu aquela fome?` | perfil-pausas-v2 | 136 Hz | 85 Hz | -8.1 st | completa |
| AO | 3042 | `Bateu aquela fome?` | perfil-pausas-v2 | 185 Hz | 161 Hz | -2.4 st | completa |

## Legenda, Pertim e mixagem

- **Legenda gravada:** mesmo estilo do "Por que UaiPertim?" (`src/personagem/Legenda.tsx`): pílula tinta a 85%,
  Poppins ExtraBold creme e a palavra falada em amarelo.
  - Texto e tempo: o texto da tela, nunca a grafia enviada à voz; até 6 palavras e 2 linhas; cada bloco ≥ 0,8 s.
  - Posição: fica na faixa y 1336–1456, abaixo de tudo o que as cenas desenham (y ≤ 1310).
  - No fecho: vai até "UaiPertim." ("Tudo pertim de você." é o texto grande da tela) e sai em 22,95 s, deixando os
    3 últimos segundos limpos.
- **Pertim V1** (`src/personagem`): aparece de frente no gancho, na motinha e no fecho.
  - Olha sempre para a câmera (pupilas centradas, `olhar [0, 0]`).
  - A boca vem dos visemas da voz (`scripts/personagem/fala.py`, a 30 fps) e pisca a cada 2–4 s.
- **Logo:** `public/img/uaipertim_logo.png`, redonda e sem fundo. Na cena 2, sobre o coral, ganha um anel creme para se
  separar do fundo.
- **Mixagem:** −14,0 LUFS e pico real −1,6 dBTP (depois do AAC).
  - Trilha animada a ~10 dB abaixo da voz, com ducking.
  - Efeitos sonoros em `cues.json` (escrita, pin caindo, toldo, explosão, lojinhas, pops das sílabas, carimbos, motinha,
    buzina, rota, check, estrelas).
  - O sting final cai numa batida (24,5 s).

## Como refazer

```bash
python3 reels/explica-so/scripts/voz.py bateu-a-fome          # a voz (só as falas que faltam; usa a API)
python3 scripts/tomadas.py bateu-a-fome 0 --seeds 42,1042      # tomadas A/B de uma fala, com as medidas (usa a API)
python3 scripts/tomadas.py bateu-a-fome 0 --usar K             # a tomada escolhida vira a fala da cena (sem API)
python3 reels/explica-so/scripts/linha.py bateu-a-fome         # as cenas na grade de batidas
python3 reels/bateu-a-fome/scripts/preparar.py                 # dados/ (cena, visemas, legenda) + cues.json
python3 reels/explica-so/scripts/audio.py bateu-a-fome         # mix.wav
node reels/bateu-a-fome/scripts/render.mjs                     # output/uaipertim-bateu-a-fome.mp4
python3 reels/bateu-a-fome/scripts/qa.py                       # output/revisao/relatorio-tecnico.txt + f0-gancho.png
python3 reels/bateu-a-fome/scripts/storyboard.py               # output/quadros/ (1 por cena) + output/storyboard.png
npm run capas:reels -- bateu-a-fome                            # a capa (CapaReel-bateu-a-fome) → out/capas/reels/
```

`scripts/quadros.mjs` renderiza quadros soltos para conferir antes do render inteiro.

A chave do ElevenLabs nunca fica no repositório: nesta nuvem, a rede a põe no cabeçalho `xi-api-key`.

## Saída (`output/`)

- `uaipertim-bateu-a-fome.mp4`: o Reel (H.264 yuv420p, 1080×1920, 30 fps, 26,00 s, AAC 48 kHz estéreo).
- `capa.png` e `capa-3x4.png`: a capa no padrão das capas do grid (selo "CONHEÇA", o Pertim na motinha grande com o
  hambúrguer e o pão nos balõezinhos, "Bateu a *fome*?").
  - É a `CapaReel-bateu-a-fome` (`src/covers/capasReels.ts`), sobe pelo "Editar capa".
  - O `capa-3x4.png` é o recorte da grade (y 240–1680).
- `quadros/cena-N-<tipo>.png`: 1 quadro de revisão por cena, tirado do MP4; `storyboard.png` reúne os 9.
- `revisao/relatorio-tecnico.txt`: o QA (`RESULTADO: aprovado`, com o AVISO da pergunta que não termina subindo).
- `revisao/f0-gancho.png`: o gráfico do F0 do gancho.
