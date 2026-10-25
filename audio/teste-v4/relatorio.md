# Teste de voz: multilingual_v2 (atual) × eleven_v4

Teste isolado: a produção não foi tocada (`audio/voz_oficial.json`, `pronounce()` e os episódios ficam como estão). A voz é a oficial (Victor Pinho, `LuQ9eaWO9yCQrR73VQFa`), com seed 42 e uma geração inteira por arquivo, sem emendas.

- **A:** `eleven_multilingual_v2`, com stability 0.40, similarity_boost 0.80, style 0.35 e speaker boost. Usa o dicionário atual de pronúncia.
- **B:** `eleven_v4`, com stability 0.50 e similarity_boost 0.75, sem style e sem speaker boost. "WhatsApp" vai como "Uátsap", igual ao A.

Para refazer: `python3 audio/teste-v4/gerar.py` gera de novo pela API; `python3 audio/teste-v4/analisar.py` só refaz as medições, sem API.

## Os áudios (`saida/`, cada um em mp3 + wav, com o alinhamento no .json)

1. `A-atual.mp3`: A · multilingual_v2 · dicionário atual ("Uai Pérr-tim", "Uátsap")
2. `B-v4-perr-tim.mp3`: B · v4 · "Uai Pérr-tim" (a grafia atual)
3. `B-v4-pertim-acento.mp3`: B · v4 · "Uai Pértim"
4. `B-v4-perrtim.mp3`: B · v4 · "Uai Pérrtim"
5. `B-v4-pertim-puro.mp3`: B · v4 · "UaiPertim" sem troca nenhuma
6. `A-dicionario-pausas.mp3`: A · multilingual_v2 · formato do Dicionário, com <break time="0.4s" />
7. `B-v4-dicionario-pausas.mp3`: B · v4 · formato do Dicionário, com <break time="0.4s" />

Extra: `B-v4-perr-tim-repetida.mp3` é a mesma geração do 2, com a mesma seed (o teste da seed).

## Conferências técnicas do eleven_v4

- **Endpoint `with-timestamps`:** funciona (HTTP 200) e devolve o alinhamento por caractere em todos os arquivos (os caracteres alinhados batem com os enviados: 335/335).
  - Ressalva: os tempos do v4 vêm em degraus de cerca de 40 ms (0,026 · 0,04 · 0,08 · 0,12 · 0,16 s). Por isso, a duração das vogais no v4 é grosseira; o F0 vem do áudio e é mais confiável.
- **Seed:** é aceita, mas não reproduz o arquivo bit a bit. As duas gerações de B-v4-perr-tim com a seed 42 têm o mesmo alinhamento (`True`) e a mesma duração (23.44 s), com o envelope 0,98 parecido e o espectrograma 0,94 parecido. O mp3 não é idêntico (`False`) e a onda difere amostra a amostra. Ou seja: o ritmo e a fala saem iguais, o som sai parecido.
- **`previous_text` e `next_text`:** são aceitos sem erro (HTTP 200).
- **`style` e `use_speaker_boost`:** não são recusados. Uma chamada extra com style 0.35 e speaker boost voltou HTTP 200, sem mensagem de erro. Isso não garante que o v4 use esses valores, só que não reclama deles. Nos áudios B eles não foram enviados.
- **Algum parâmetro recusado:** nenhum. Todas as 10 chamadas voltaram HTTP 200, sem mensagem de erro.
- **Pausas `<break time="0.4s" />`:** a tag não é falada em nenhum dos dois modelos (os caracteres dela vêm com duração zero). O silêncio medido no áudio entre as palavras foi:

| pausa | A (multilingual_v2) | B (v4) |
|---|---|---|
| Domingo. / Substantivo. | 0.46 s | 0.16 s |
| Substantivo. / O | 0.62 s | 0.16 s |
| fome. / Exemplo: | 0.50 s | 0.30 s |

  No A a pausa de 0,4 s aparece (0,46–0,62 s, contando o respiro natural). No v4 ela sai curta (0,16–0,30 s, perto de um fim de frase comum), ou seja, o v4 não respeitou o `<break time="0.4s" />`.

## Tônica do "domingo"

Cada célula mostra a vogal de cada sílaba, como duração (alinhamento) / F0 mediano, e a sílaba mais longa e mais aguda. O esperado é do-**MIN**-go.

| arquivo | ocorrência | do | min | go | tônica medida |
|---|---|---|---|---|---|
| A-atual | domingo | 0.081 s / 248 Hz | 0.058 s / 144 Hz | 0.035 s / 170 Hz | do |
| A-atual | Domingo. (fim de frase) | 0.127 s / 219 Hz | 0.116 s / 123 Hz | 0.116 s / – Hz | do |
| B-v4-perr-tim | domingo | 0.026 s / 249 Hz | 0.040 s / 251 Hz | 0.040 s / 233 Hz | min |
| B-v4-perr-tim | Domingo. (fim de frase) | 0.080 s / 229 Hz | 0.080 s / 161 Hz | 0.160 s / – Hz | do |
| B-v4-pertim-acento | domingo | 0.026 s / 259 Hz | 0.040 s / 253 Hz | 0.040 s / 219 Hz | do |
| B-v4-pertim-acento | Domingo. (fim de frase) | 0.048 s / 149 Hz | 0.048 s / 168 Hz | 0.080 s / 116 Hz | min |
| B-v4-perrtim | domingo | 0.026 s / – Hz | 0.040 s / 241 Hz | 0.040 s / 218 Hz | min |
| B-v4-perrtim | Domingo. (fim de frase) | 0.080 s / 230 Hz | 0.080 s / 205 Hz | 0.080 s / 116 Hz | do |
| B-v4-pertim-puro | domingo | 0.026 s / 246 Hz | 0.020 s / 258 Hz | 0.020 s / 237 Hz | do |
| B-v4-pertim-puro | Domingo. (fim de frase) | 0.080 s / 248 Hz | 0.080 s / 241 Hz | 0.080 s / 132 Hz | do |
| A-dicionario-pausas | Domingo. (fim de frase) | 0.116 s / 187 Hz | 0.082 s / 125 Hz | 0.117 s / 79 Hz | do |
| A-dicionario-pausas | domingo | 0.116 s / 133 Hz | 0.082 s / 129 Hz | 0.023 s / 186 Hz | do |
| B-v4-dicionario-pausas | Domingo. (fim de frase) | 0.080 s / 231 Hz | 0.080 s / 188 Hz | 0.160 s / 70 Hz | do |
| B-v4-dicionario-pausas | domingo | 0.054 s / 227 Hz | 0.040 s / 248 Hz | 0.040 s / 255 Hz | do |

**Ressalvas:**
- A vogal do "min" é nasal e parte dela vai para o "n", então medir só a vogal subestima o "min".
- O "do" de começo de frase pega o F0 alto da entonação.
- No v4, as durações vêm em degraus de 40 ms.
Por isso esta tabela é indicativa; a decisão é de ouvido.

## "UaiPertim": força e final

- **Força:** compara a vogal do PER com a do TIM (mais longa e mais aguda = tônica; "empate" quando cada medida aponta para um lado).
- **Final do TIM:** o murmúrio nasal (ms de energia concentrada abaixo de 500 Hz) e o F2 no fim da vogal.
  - F2 caindo 400 Hz ou mais: lábios fechando, soa "im".
  - F2 alto: língua nos dentes, soa "in".

| arquivo | grafia enviada | posição | vogal PER | vogal TIM | força | murmúrio | F2 meio → fim | final |
|---|---|---|---|---|---|---|---|---|
| A-atual | Uai Pérr-tim | fim de frase | 0.070 s / – Hz | 0.174 s / 157 Hz | TIM | 100 ms | 2561 → 1528 Hz | fecha com consoante nasal, F2 caindo (lábios: "im") |
| A-atual | Uai Pérr-tim | meio | 0.081 s / – Hz | 0.151 s / 121 Hz | TIM | 60 ms | 2404 → 2662 Hz | fecha com consoante nasal, F2 alto (língua: "in") |
| A-atual | Uai Pérr-tim | fim de frase | 0.116 s / 172 Hz | 0.151 s / 105 Hz | empate | 170 ms | 2498 → 1334 Hz | fecha com consoante nasal, F2 caindo (lábios: "im") |
| B-v4-perr-tim | Uai Pérr-tim | fim de frase | 0.080 s / 252 Hz | 0.120 s / 214 Hz | empate | 150 ms | 2573 → 4069 Hz | fecha com consoante nasal, F2 alto (língua: "in") |
| B-v4-perr-tim | Uai Pérr-tim | meio | 0.080 s / 141 Hz | 0.120 s / 190 Hz | TIM | 100 ms | 2590 → 2565 Hz | fecha com consoante nasal, F2 alto (língua: "in") |
| B-v4-perr-tim | Uai Pérr-tim | fim de frase | 0.080 s / 172 Hz | 0.080 s / 189 Hz | empate | 30 ms | 2477 → 2660 Hz | fecha com consoante nasal, F2 alto (língua: "in") |
| B-v4-pertim-acento | Uai Pértim | fim de frase | 0.080 s / 108 Hz | 0.080 s / 200 Hz | empate | 70 ms | 2562 → 3536 Hz | fecha com consoante nasal, F2 alto (língua: "in") |
| B-v4-pertim-acento | Uai Pértim | meio | 0.080 s / 130 Hz | 0.120 s / 210 Hz | TIM | 40 ms | 2535 → 2781 Hz | fecha com consoante nasal, F2 alto (língua: "in") |
| B-v4-pertim-acento | Uai Pértim | fim de frase | 0.080 s / 240 Hz | 0.120 s / 188 Hz | empate | 50 ms | 2425 → 2797 Hz | fecha com consoante nasal, F2 alto (língua: "in") |
| B-v4-perrtim | Uai Pérrtim | fim de frase | 0.080 s / 159 Hz | 0.054 s / – Hz | PER | 80 ms | 2337 → 1773 Hz | fecha com consoante nasal, F2 caindo (lábios: "im") |
| B-v4-perrtim | Uai Pérrtim | meio | 0.080 s / 151 Hz | 0.080 s / 103 Hz | empate | 60 ms | 2375 → 2378 Hz | fecha com consoante nasal, F2 alto (língua: "in") |
| B-v4-perrtim | Uai Pérrtim | fim de frase | 0.080 s / 168 Hz | 0.080 s / – Hz | empate | 90 ms | 2606 → 2303 Hz | fecha com consoante nasal, F2 alto (língua: "in") |
| B-v4-pertim-puro | UaiPertim | fim de frase | 0.080 s / 112 Hz | 0.080 s / 211 Hz | empate | 50 ms | 2552 → 2777 Hz | fecha com consoante nasal, F2 alto (língua: "in") |
| B-v4-pertim-puro | UaiPertim | meio | 0.080 s / 123 Hz | 0.120 s / 185 Hz | TIM | 50 ms | 2541 → 2714 Hz | fecha com consoante nasal, F2 alto (língua: "in") |
| B-v4-pertim-puro | UaiPertim | fim de frase | 0.080 s / 275 Hz | 0.080 s / 176 Hz | empate | 60 ms | 2514 → 2641 Hz | fecha com consoante nasal, F2 alto (língua: "in") |
| A-dicionario-pausas | Uai Pérr-tim | meio | 0.116 s / 143 Hz | 0.116 s / 133 Hz | empate | 40 ms | 2353 → 2604 Hz | fecha com consoante nasal, F2 alto (língua: "in") |
| B-v4-dicionario-pausas | Uai Pérr-tim | meio | 0.080 s / – Hz | 0.080 s / – Hz | empate | 70 ms | 2542 → 2538 Hz | fecha com consoante nasal, F2 alto (língua: "in") |

**Ressalva:** o final ("im" ou "in") é uma estimativa pelo F2 e pelo murmúrio. Serve para comparar os arquivos, não para decidir sozinha.

