# Teste de voz: eleven_v4 × eleven_multilingual_v2 (sem alterar a produção)

Branch `claude/tiktok`. Nada da produção mudou: `audio/voz_oficial.json`, `scripts/voz.py`, os JSON de episódio e os
episódios ficaram como estavam (este teste só **lê** a voz oficial e a regra `pronounce()` de `audio/elevenlabs.py`).
Voz Victor Pinho (`LuQ9eaWO9yCQrR73VQFa`), **seed 42 em todos**, cada arquivo é **uma geração inteira** (sem emenda e sem
`previous_text`/`next_text`), saída `mp3_44100_128`, endpoint `POST /v1/text-to-speech/{voice}/with-timestamps`.
A chave não aparece em nenhum arquivo: a rede da nuvem injeta o cabeçalho.

Áudios para ouvir: `exports/tiktok/testes/voz-v4/` (cópia de `audios/`).

## 0) Antes de gerar

| Verificação | Resultado |
|---|---|
| `GET /v1/models` | **HTTP 401 `missing_permissions`**: a chave não tem a permissão `models_read`, então não dá para listar os modelos. |
| ID exato do v4 | Testado na prática: **`eleven_v4` → HTTP 200** (gera áudio). `eleven_v4_alpha`, `eleven_v4_preview` e `eleven_multilingual_v4` → HTTP 400 `model_not_found`. (`eleven_v3` também responde 200.) Usado: **`eleven_v4`**. |
| Endpoint `/with-timestamps` no v4 | **Aceita** (HTTP 200, devolve áudio + alinhamento por letra). Obs.: os tempos do v4 vêm em degraus de ~0,04–0,08 s (o v2 vem em ms), então o alinhamento do v4 é mais grosseiro. |
| `seed` no v4 | **Aceita** (HTTP 200) e **tem efeito, mas não é 100% repetível**: a mesma frase com seed 42 duas vezes deu a mesma duração (2,48 s) e espectro muito parecido (correlação 0,93), mas não idêntico; com seed 43 mudou (2,56 s, correlação 0,59). Referência: no v2 a mesma seed 42 duas vezes deu correlação 0,996 (quase igual). |
| `previous_text` / `next_text` no v4 | **Aceita** (HTTP 200) e **tem efeito**: com o mesmo texto e seed 42, mandar contexto mudou a leitura (2,48 s → 2,40 s; correlação 0,53 com a versão sem contexto). Nos arquivos do teste **não** foi enviado contexto (cada arquivo é a frase inteira sozinha). |
| `<break time="0.4s" />` no v4 | **Aceita sem erro (HTTP 200), mas é IGNORADA**: "Trem <break time=\"1.0s\" /> qualquer coisa…" saiu com a mesma duração (4,32 s) e os mesmos silêncios que o texto sem a tag; o alinhamento devolve a tag como letras de duração zero. No v2 a mesma tag de 1,0 s deu 1,11 s de silêncio (funciona). A tag `[pause]` do v4 (não pedida, testada como alternativa) deu ~0,94 s de pausa, sem controle de duração. |

Sondagens: `sonda.py`, `sonda2.py` → `sondas/` (mp3 curtos + `sonda.json`, `sonda2.json`).

## 1–4) Arquivos gerados

| Arquivo | Modelo | Configuração enviada | Seed | Duração | Endpoint / seed | Chiado final (`scripts/chiado.py`) |
|---|---|---|---|---|---|---|
| `A_atual_v2_perr-tim.mp3` | `eleven_multilingual_v2` | stability 0.4, similarity_boost 0.8, style 0.35, use_speaker_boost True | 42 | 17.18 s | HTTP 200 (with-timestamps + seed aceitos) | ok (pior fração 4–10 kHz depois da fala: 0.0) |
| `B_v4_sem-troca_Pertim.mp3` | `eleven_v4` | stability 0.5, similarity_boost 0.75 | 42 | 16.72 s | HTTP 200 (with-timestamps + seed aceitos) | ok (pior fração 4–10 kHz depois da fala: 0.0) |
| `B_v4_Pertim-acento.mp3` | `eleven_v4` | stability 0.5, similarity_boost 0.75 | 42 | 17.28 s | HTTP 200 (with-timestamps + seed aceitos) | ok (pior fração 4–10 kHz depois da fala: 0.0) |
| `B_v4_Perrtim.mp3` | `eleven_v4` | stability 0.5, similarity_boost 0.75 | 42 | 17.04 s | HTTP 200 (with-timestamps + seed aceitos) | ok (pior fração 4–10 kHz depois da fala: 0.0) |
| `B_v4_Perr-tim.mp3` | `eleven_v4` | stability 0.5, similarity_boost 0.75 | 42 | 18.48 s | HTTP 200 (with-timestamps + seed aceitos) | ok (pior fração 4–10 kHz depois da fala: 0.0) |
| `A_atual_v2_dicionario.mp3` | `eleven_multilingual_v2` | stability 0.4, similarity_boost 0.8, style 0.35, use_speaker_boost True | 42 | 13.61 s | HTTP 200 (with-timestamps + seed aceitos) | ok (pior fração 4–10 kHz depois da fala: 0.0) |
| `B_v4_dicionario_Perr-tim.mp3` | `eleven_v4` | stability 0.5, similarity_boost 0.75 | 42 | 12.32 s | HTTP 200 (with-timestamps + seed aceitos) | ok (pior fração 4–10 kHz depois da fala: 0.012) |
| `B_v4_dicionario_Pertim-acento.mp3` | `eleven_v4` | stability 0.5, similarity_boost 0.75 | 42 | 11.92 s | HTTP 200 (with-timestamps + seed aceitos) | ok (pior fração 4–10 kHz depois da fala: 0.001) |

O v2 (A) foi com exatamente `voz_oficial.json`: stability 0.4, similarity_boost 0.8, style 0.35, use_speaker_boost true. O v4 (B) foi só com stability 0.5 e similarity_boost 0.75 (sem `style` e sem `use_speaker_boost`).

### Texto exato enviado à API

- `A_atual_v2_perr-tim.mp3`:
  > Domingo de manhã, cê já fez o pedido no Uai Pérr-tim? A entrega chega pertinho de você, no sábado e também no domingo. Uai, sô, que trem bão! Tudo pérr-tim de você é Uai Pérr-tim. Dúvida? Chama no WhatsApp. E no fim de semana, quem resolve é o Uai Pérr-tim.
- `B_v4_sem-troca_Pertim.mp3`:
  > Domingo de manhã, cê já fez o pedido no UaiPertim? A entrega chega pertinho de você, no sábado e também no domingo. Uai, sô, que trem bão! Tudo pertim de você é UaiPertim. Dúvida? Chama no WhatsApp. E no fim de semana, quem resolve é o UaiPertim.
- `B_v4_Pertim-acento.mp3`:
  > Domingo de manhã, cê já fez o pedido no Uai Pértim? A entrega chega pertinho de você, no sábado e também no domingo. Uai, sô, que trem bão! Tudo pértim de você é Uai Pértim. Dúvida? Chama no WhatsApp. E no fim de semana, quem resolve é o Uai Pértim.
- `B_v4_Perrtim.mp3`:
  > Domingo de manhã, cê já fez o pedido no Uai Pérrtim? A entrega chega pertinho de você, no sábado e também no domingo. Uai, sô, que trem bão! Tudo pérrtim de você é Uai Pérrtim. Dúvida? Chama no WhatsApp. E no fim de semana, quem resolve é o Uai Pérrtim.
- `B_v4_Perr-tim.mp3`:
  > Domingo de manhã, cê já fez o pedido no Uai Pérr-tim? A entrega chega pertinho de você, no sábado e também no domingo. Uai, sô, que trem bão! Tudo pérr-tim de você é Uai Pérr-tim. Dúvida? Chama no WhatsApp. E no fim de semana, quem resolve é o Uai Pérr-tim.
- `A_atual_v2_dicionario.mp3`:
  > Trem. <break time="0.4s" /> Qualquer coisa. Objeto, situação, tudo. Tipo: Me passa esse trem aí. <break time="0.4s" /> Aquele trem do mercado? Em breve, dá pra pedir no Uai Pérr-tim. <break time="0.4s" /> Manda pra quem chama tudo de trem.
- `B_v4_dicionario_Perr-tim.mp3`:
  > Trem. <break time="0.4s" /> Qualquer coisa. Objeto, situação, tudo. Tipo: Me passa esse trem aí. <break time="0.4s" /> Aquele trem do mercado? Em breve, dá pra pedir no Uai Pérr-tim. <break time="0.4s" /> Manda pra quem chama tudo de trem.
- `B_v4_dicionario_Pertim-acento.mp3`:
  > Trem. <break time="0.4s" /> Qualquer coisa. Objeto, situação, tudo. Tipo: Me passa esse trem aí. <break time="0.4s" /> Aquele trem do mercado? Em breve, dá pra pedir no Uai Pértim. <break time="0.4s" /> Manda pra quem chama tudo de trem.

### "UaiPertim" no alinhamento

O alinhamento da ElevenLabs **devolve as letras do texto enviado**, não uma transcrição do que foi falado: ele sempre
"fecha" em `-im` porque foi isso que mandamos. Então ele **não prova** a pronúncia (E aberto/fechado, tônica); só mostra
quanto tempo cada pedaço durou. Também tentei transcrever os áudios (`/v1/speech-to-text`), mas a chave não tem a
permissão `speech_to_text` (HTTP 401). A pronúncia fica para o seu ouvido. Abaixo: o que foi enviado, o que o alinhamento
devolveu, a duração do "Per" (do P até antes do "tim"), do "tim" e do "m" final, em segundos.

| Arquivo | Ocorrência | Enviado → devolvido | "Per" | "tim" | "m" | termina em |
|---|---|---|---|---|---|---|
| `A_atual_v2_perr-tim.mp3` | 1ª (2.43–3.31 s) | `Uai Pérr-tim` → `Uai Pérr-tim` | 0.31 | 0.30 | 0.12 | `-im` |
| `A_atual_v2_perr-tim.mp3` | 2ª (9.67–10.08 s) | `pérr-tim` → `pérr-tim` | 0.24 | 0.16 | 0.02 | `-im` |
| `A_atual_v2_perr-tim.mp3` | 3ª (10.73–11.44 s) | `Uai Pérr-tim` → `Uai Pérr-tim` | 0.21 | 0.29 | 0.12 | `-im` |
| `A_atual_v2_perr-tim.mp3` | 4ª (15.94–16.86 s) | `Uai Pérr-tim` → `Uai Pérr-tim` | 0.28 | 0.40 | 0.15 | `-im` |
| `B_v4_sem-troca_Pertim.mp3` | 1ª (2.20–2.80 s) | `UaiPertim` → `UaiPertim` | 0.20 | 0.20 | 0.08 | `-im` |
| `B_v4_sem-troca_Pertim.mp3` | 2ª (9.72–9.92 s) | `pertim` → `pertim` | 0.09 | 0.11 | 0.04 | `-im` |
| `B_v4_sem-troca_Pertim.mp3` | 3ª (10.80–11.52 s) | `UaiPertim` → `UaiPertim` | 0.20 | 0.20 | 0.08 | `-im` |
| `B_v4_sem-troca_Pertim.mp3` | 4ª (15.88–16.56 s) | `UaiPertim` → `UaiPertim` | 0.24 | 0.24 | 0.08 | `-im` |
| `B_v4_Pertim-acento.mp3` | 1ª (2.20–2.80 s) | `Uai Pértim` → `Uai Pértim` | 0.24 | 0.16 | 0.04 | `-im` |
| `B_v4_Pertim-acento.mp3` | 2ª (9.76–10.16 s) | `pértim` → `pértim` | 0.19 | 0.21 | 0.08 | `-im` |
| `B_v4_Pertim-acento.mp3` | 3ª (11.04–11.84 s) | `Uai Pértim` → `Uai Pértim` | 0.24 | 0.16 | 0.04 | `-im` |
| `B_v4_Pertim-acento.mp3` | 4ª (16.24–17.12 s) | `Uai Pértim` → `Uai Pértim` | 0.27 | 0.21 | 0.08 | `-im` |
| `B_v4_Perrtim.mp3` | 1ª (2.24–2.88 s) | `Uai Pérrtim` → `Uai Pérrtim` | 0.32 | 0.16 | 0.05 | `-im` |
| `B_v4_Perrtim.mp3` | 2ª (9.84–10.24 s) | `pérrtim` → `pérrtim` | 0.24 | 0.16 | 0.05 | `-im` |
| `B_v4_Perrtim.mp3` | 3ª (11.08–11.92 s) | `Uai Pérrtim` → `Uai Pérrtim` | 0.24 | 0.24 | 0.08 | `-im` |
| `B_v4_Perrtim.mp3` | 4ª (16.08–16.88 s) | `Uai Pérrtim` → `Uai Pérrtim` | 0.32 | 0.16 | 0.05 | `-im` |
| `B_v4_Perr-tim.mp3` | 1ª (2.32–3.28 s) | `Uai Pérr-tim` → `Uai Pérr-tim` | 0.36 | 0.20 | 0.08 | `-im` |
| `B_v4_Perr-tim.mp3` | 2ª (10.48–10.96 s) | `pérr-tim` → `pérr-tim` | 0.36 | 0.12 | 0.04 | `-im` |
| `B_v4_Perr-tim.mp3` | 3ª (11.92–12.88 s) | `Uai Pérr-tim` → `Uai Pérr-tim` | 0.36 | 0.20 | 0.08 | `-im` |
| `B_v4_Perr-tim.mp3` | 4ª (17.36–18.32 s) | `Uai Pérr-tim` → `Uai Pérr-tim` | 0.36 | 0.20 | 0.08 | `-im` |
| `A_atual_v2_dicionario.mp3` | 1ª (10.34–11.30 s) | `Uai Pérr-tim` → `Uai Pérr-tim` | 0.31 | 0.34 | 0.09 | `-im` |
| `B_v4_dicionario_Perr-tim.mp3` | 1ª (9.12–10.16 s) | `Uai Pérr-tim` → `Uai Pérr-tim` | 0.40 | 0.24 | 0.08 | `-im` |
| `B_v4_dicionario_Pertim-acento.mp3` | 1ª (9.00–9.68 s) | `Uai Pértim` → `Uai Pértim` | 0.20 | 0.24 | 0.08 | `-im` |

Todas as ocorrências terminam em `-im` no alinhamento e o "m" final tem duração > 0 em todas (nenhuma foi engolida).
Com o hífen ("Pérr-tim"), o v4 alonga o "Per" (0,36 s) e encurta o "tim" (0,12–0,20 s), o contrário do que se quer
(per-TIM); no v2, o "tim" fica parecido ou maior que o "Per" nas três "Uai Pérr-tim" (só no "pérr-tim" minúsculo ele fica menor). Isso é só uma pista de ritmo; a decisão é de ouvido.

**Variante extra do Dicionário no v4:** como o alinhamento não consegue dizer qual variante acerta a pronúncia,
usei a sua regra de reserva: **"Pértim"** → `B_v4_dicionario_Pertim-acento.mp3`.

## 3) Pausas do Dicionário (`<break time="0.4s" />`)

Medido de dois jeitos: o vão no alinhamento (fim da última letra antes da tag → começo da primeira depois) e o silêncio
real no áudio (abaixo de −40 dB do pico). Para comparar, as pausas **sem tag** entre frases ("coisa." → "Objeto",
"tudo." → "Tipo") ficam em ~0,32–0,37 s no v2 e ~0,17–0,29 s no v4.

| Arquivo | Pausa 1 ("Trem." → "Qualquer") | Pausa 2 ("aí." → "Aquele") | Pausa 3 ("Pertim." → "Manda") | ~0,4 s? |
|---|---|---|---|---|
| `A_atual_v2_dicionario.mp3` | alinhamento 0.53 s · silêncio 0.56 s | alinhamento 0.73 s · silêncio 0.77 s | alinhamento 0.59 s · silêncio 0.63 s | sim, a tag funciona: ~0,4 s **somados** à pausa natural do ponto (fica 0,56–0,77 s) |
| `B_v4_dicionario_Perr-tim.mp3` | alinhamento 0.24 s · silêncio 0.31 s | alinhamento 0.24 s · silêncio 0.25 s | alinhamento 0.32 s · silêncio 0.21 s | não: a tag é ignorada; sobra só a pausa natural do ponto (0,21–0,37 s) |
| `B_v4_dicionario_Pertim-acento.mp3` | alinhamento 0.32 s · silêncio 0.37 s | alinhamento 0.32 s · silêncio 0.31 s | alinhamento 0.40 s · silêncio 0.29 s | não: a tag é ignorada; sobra só a pausa natural do ponto (0,21–0,37 s) |

Ou seja: no **v2** a pausa ficou um pouco **maior** que 0,4 s (a tag soma com a pausa do ponto final); no **v4** ela
**não acontece** (fica mais curta que 0,4 s, igual a uma troca de frase comum). Se o v4 for adotado, as pausas do
Dicionário vão precisar de outro recurso (ex.: a tag `[pause]`, que deu ~0,9 s sem controle, ou silêncio inserido na
montagem entre gerações separadas, o que hoje a regra "sem emendar" não permite).

## Arquivos desta pasta

- `api.py`: a chamada à API (a chave só vai no cabeçalho, nunca em arquivo/log); `audio_util.py`: decodificação, palavras, silêncios.
- `sonda.py`, `sonda2.py`: as verificações do passo 0 → `sondas/`.
- `gerar.py`: as gerações do teste (`python3 gerar.py teste` / `python3 gerar.py dicionario Pertim-acento`) → `audios/`, `resultados/`.
- `relatorio.py`: monta este relatório a partir de `resultados/` e `sondas/`.

Para você avaliar de ouvido: sotaque mineiro mantido, tônica de "domingo" (doMINgo), "sábado", "pedido", "entrega",
"também", e qual combinação acerta "UaiPertim".
