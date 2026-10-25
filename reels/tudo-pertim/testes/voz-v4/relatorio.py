"""Monta RELATORIO.md a partir de resultados/*.json e sondas/*.json (sem chamar a API)."""
import json, os

AQ = os.path.dirname(os.path.abspath(__file__))
ORDEM = ['A_atual_v2_perr-tim', 'B_v4_sem-troca_Pertim', 'B_v4_Pertim-acento', 'B_v4_Perrtim', 'B_v4_Perr-tim',
         'A_atual_v2_dicionario', 'B_v4_dicionario_Perr-tim', 'B_v4_dicionario_Pertim-acento']
R = {n: json.load(open(os.path.join(AQ, 'resultados', n + '.json'))) for n in ORDEM}
S = json.load(open(os.path.join(AQ, 'sondas', 'sonda.json'))); S2 = json.load(open(os.path.join(AQ, 'sondas', 'sonda2.json')))


def cfg(r):
    return ', '.join(f'{k} {v}' for k, v in r['configuracao'].items())


L = []
L.append('''# Teste de voz: eleven_v4 × eleven_multilingual_v2 (sem alterar a produção)

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
| Endpoint `/with-timestamps` no v4 | **Aceita** (HTTP 200, devolve áudio + alinhamento por letra). Obs.: os tempos do v4 vêm em degraus de ~0,04–0,08 s (o v2 vem em ms), então o alinhamento do v4 é mais grosseiro. |''')
sa, sb, sc = S['seed42_a'], S['seed42_b'], S['seed43']
L.append(f'''| `seed` no v4 | **Aceita** (HTTP 200) e **tem efeito, mas não é 100% repetível**: a mesma frase com seed 42 duas vezes deu a mesma duração (2,48 s) e espectro muito parecido (correlação 0,93), mas não idêntico; com seed 43 mudou (2,56 s, correlação 0,59). Referência: no v2 a mesma seed 42 duas vezes deu correlação 0,996 (quase igual). |
| `previous_text` / `next_text` no v4 | **Aceita** (HTTP 200) e **tem efeito**: com o mesmo texto e seed 42, mandar contexto mudou a leitura (2,48 s → 2,40 s; correlação 0,53 com a versão sem contexto). Nos arquivos do teste **não** foi enviado contexto (cada arquivo é a frase inteira sozinha). |
| `<break time="0.4s" />` no v4 | **Aceita sem erro (HTTP 200), mas é IGNORADA**: "Trem <break time=\\"1.0s\\" /> qualquer coisa…" saiu com a mesma duração (4,32 s) e os mesmos silêncios que o texto sem a tag; o alinhamento devolve a tag como letras de duração zero. No v2 a mesma tag de 1,0 s deu 1,11 s de silêncio (funciona). A tag `[pause]` do v4 (não pedida, testada como alternativa) deu ~0,94 s de pausa, sem controle de duração. |

Sondagens: `sonda.py`, `sonda2.py` → `sondas/` (mp3 curtos + `sonda.json`, `sonda2.json`).

## 1–4) Arquivos gerados
''')
L.append('| Arquivo | Modelo | Configuração enviada | Seed | Duração | Endpoint / seed | Chiado final (`scripts/chiado.py`) |')
L.append('|---|---|---|---|---|---|---|')
for n in ORDEM:
    r = R[n]
    L.append(f"| `{r['arquivo']}` | `{r['modelo']}` | {cfg(r)} | {r['seed']} | {r['duracao_s']:.2f} s | HTTP {r['http']} (with-timestamps + seed aceitos) | {r['chiado']['motivo']} (pior fração 4–10 kHz depois da fala: {r['chiado']['pior_fracao_4_10khz']}) |")
L.append('\nO v2 (A) foi com exatamente `voz_oficial.json`: stability 0.4, similarity_boost 0.8, style 0.35, use_speaker_boost true. '
         'O v4 (B) foi só com stability 0.5 e similarity_boost 0.75 (sem `style` e sem `use_speaker_boost`).\n')
L.append('### Texto exato enviado à API\n')
for n in ORDEM:
    L.append(f"- `{R[n]['arquivo']}`:\n  > {R[n]['texto_enviado']}")
L.append('''
### "UaiPertim" no alinhamento

O alinhamento da ElevenLabs **devolve as letras do texto enviado**, não uma transcrição do que foi falado: ele sempre
"fecha" em `-im` porque foi isso que mandamos. Então ele **não prova** a pronúncia (E aberto/fechado, tônica); só mostra
quanto tempo cada pedaço durou. Também tentei transcrever os áudios (`/v1/speech-to-text`), mas a chave não tem a
permissão `speech_to_text` (HTTP 401). A pronúncia fica para o seu ouvido. Abaixo: o que foi enviado, o que o alinhamento
devolveu, a duração do "Per" (do P até antes do "tim"), do "tim" e do "m" final, em segundos.
''')
L.append('| Arquivo | Ocorrência | Enviado → devolvido | "Per" | "tim" | "m" | termina em |')
L.append('|---|---|---|---|---|---|---|')
for n in ORDEM:
    for i, m in enumerate(R[n]['marcas'], 1):
        L.append(f"| `{R[n]['arquivo']}` | {i}ª ({m['inicio_s']:.2f}–{m['fim_s']:.2f} s) | `{m['enviado']}` → `{m['devolvido']}` | {m['per_s']:.2f} | {m['tim_s']:.2f} | {m['m_s']:.2f} | `-{m['devolvido'][-2:]}` |")
L.append('''
Todas as ocorrências terminam em `-im` no alinhamento e o "m" final tem duração > 0 em todas (nenhuma foi engolida).
Com o hífen ("Pérr-tim"), o v4 alonga o "Per" (0,36 s) e encurta o "tim" (0,12–0,20 s), o contrário do que se quer
(per-TIM); no v2, o "tim" fica parecido ou maior que o "Per" nas três "Uai Pérr-tim" (só no "pérr-tim" minúsculo ele fica menor). Isso é só uma pista de ritmo; a decisão é de ouvido.

**Variante extra do Dicionário no v4:** como o alinhamento não consegue dizer qual variante acerta a pronúncia,
usei a sua regra de reserva: **"Pértim"** → `B_v4_dicionario_Pertim-acento.mp3`.

## 3) Pausas do Dicionário (`<break time="0.4s" />`)

Medido de dois jeitos: o vão no alinhamento (fim da última letra antes da tag → começo da primeira depois) e o silêncio
real no áudio (abaixo de −40 dB do pico). Para comparar, as pausas **sem tag** entre frases ("coisa." → "Objeto",
"tudo." → "Tipo") ficam em ~0,32–0,37 s no v2 e ~0,17–0,29 s no v4.
''')
L.append('| Arquivo | Pausa 1 ("Trem." → "Qualquer") | Pausa 2 ("aí." → "Aquele") | Pausa 3 ("Pertim." → "Manda") | ~0,4 s? |')
L.append('|---|---|---|---|---|')
for n in ORDEM[5:]:
    pz = R[n]['pausas']
    c = ' | '.join(f"alinhamento {p['vao_alinhamento_s']:.2f} s · silêncio {p['silencio_medido_s']:.2f} s" for p in pz)
    ok = 'sim, a tag funciona: ~0,4 s **somados** à pausa natural do ponto (fica 0,56–0,77 s)' if n.startswith('A_') else 'não: a tag é ignorada; sobra só a pausa natural do ponto (0,21–0,37 s)'
    L.append(f"| `{R[n]['arquivo']}` | {c} | {ok} |")
L.append('''
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
''')
open(os.path.join(AQ, 'RELATORIO.md'), 'w').write('\n'.join(L))
print('ok -> RELATORIO.md')
