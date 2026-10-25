# Série TUDO PERTIM — a série do @uaipertim no TikTok (45–60 s, em capítulos)

Vídeos curtos e animados que apresentam a UaiPertim ao Glória, em capítulos. O motor nasceu do da [EXPLICA, SÔ!](../explica-so) e mantém a **ideia** de animação dela: a cena se constrói peça por peça no ritmo da voz, os personagens são vivos e os efeitos são sincronizados. Também mantém o fluxo: um JSON por episódio, `--previa` sem API, revisão de zonas seguras e storyboard.

A **estrutura** é outra:
- não há estrada lateral com nós numerados;
- a troca de capítulo é a motinha atravessando a tela;
- o progresso é uma barra estilo stories no topo;
- título e apoio ficam centralizados, com o rótulo em adesivo;
- as cenas são maiores e ocupam a área central inteira.

A cara é **mais jovem, animada e viva**, com a marca em destaque. A pasta `reels/explica-so/` (Instagram) não é alterada por esta série.

## A estrutura do vídeo

1. **Troca de capítulo (wipe com a motinha).**
   - A motinha (o mascote, com a sacola da logo oficial) atravessa a tela na horizontal, de um lado ao outro. A passagem dela **varre** o capítulo atual e revela o próximo: de um lado da borda ainda está o capítulo que sai, e do outro, o que entra.
   - Ao longo da borda passa uma faixa creme macia com confete, e atrás da motinha fica um rastro de poeira. O som do motor anda junto, de um lado ao outro.
   - Dura **1,5 tempo da batida** (0,75 s a 120 bpm) e começa num meio tempo: o `linha.py` arredonda o fim de cada capítulo para a grade de colcheias do bpm.
   - Cada troca varia um pouco (tabela `VARIA` em `src/anim.js`): o sentido alterna (da capa para o 01 ela vai da direita para a esquerda), a altura muda, e algumas trocas têm pulinho ou empinada.
   - A motinha da troca sempre passa acima de y 1060, nunca pela coluna de botões.
2. **Progresso.** Uma barra discreta logo abaixo da marca do topo (y ≈ 392, dentro da zona segura), estilo stories.
   - Tem um segmento arredondado por capítulo, sem contar a capa, e cada um enche em coral durante o seu capítulo.
   - O segmento do fecho termina de encher 3 s antes do fim, para o fecho ficar parado.
   - A barra aparece na primeira troca; a capa (quadro 0) não a mostra.
3. **Layout do capítulo.**
   - **Rótulo** do capítulo como **adesivo inclinado** (fundo amarelo ou coral alternando, borda branca, leve rotação). Entra com "plop" meio tempo antes do título, em y ≈ 452.
   - **Título** centralizado e grande (Poppins Black, até 100 px; 2 linhas, tinta + coral). Entra com **soco** na batida: a 1ª linha no 1º tempo cheio depois de a varredura passar do meio, a 2ª meio tempo depois.
   - **Linha de apoio** centralizada logo abaixo do título (até 780 px de largura), com as regras de marcador e quebra abaixo.
   - **Cena** do pé do apoio até **y 1450**, de x 90 a 930. Lojinhas, motinha, chips, balões e itens são cerca de 30% maiores que no primeiro corte da série. Nada passa pela coluna de botões (x ≥ 940 entre y 1060 e 1560): o motor recorta essa faixa.
4. **Capa (quadro 0).**
   - O adesivo "TUDO PERTIM · EP. NN", o título grande com o 👀 em olhinhos desenhados e a motinha grande chegando freando e derrapando. No quadro 0 ela já está na derrapada, inteira na tela.
   - O bloco fica centrado no recorte 3:4.
   - No fim da capa, a motinha arranca para a esquerda, e a troca vem pela direita.

| Episódio | Tema | Capítulos | Estado |
|---|---|---|---|
| **tudo-pertim-01** | "Prazer, UaiPertim!" | 00 capa · 01 quem sou eu · 02 o que tem · 03 como funciona · 04 sem aperto · 05 feito em Minas · 06 sua vez · 07 fecho | final com voz, 52,25 s, revisão aprovada: [`exports/tiktok/tudo-pertim/ep01/`](../../exports/tiktok/tudo-pertim/ep01) |
| **tudo-pertim-02** | "Um dia no Glória" | 00 capa · 01 7h da manhã · 02 meio-dia · 03 3h da tarde · 04 6h da tarde · 05 sexta à noite · 06 sua vez · 07 fecho | final com voz, 51,5 s, revisão aprovada: [`exports/tiktok/tudo-pertim/ep02/`](../../exports/tiktok/tudo-pertim/ep02) |
| **tudo-pertim-03** | "Visita sem avisar" (transição da galinha) | 00 capa · 01 o desespero · 02 a cozinha · 03 socorro · 04 o capricho · 05 chegou · 06 sua vez · 07 fecho | final com voz, 50,75 s, revisão aprovada: [`exports/tiktok/tudo-pertim/ep03/`](../../exports/tiktok/tudo-pertim/ep03) |
| **tudo-pertim-04** | "Segunda sem coragem" (transição da sacola; 1º episódio com a voz v4) | 00 capa · 01 a geladeira · 02 a preguiça · 03 a solução · 04 a lista · 05 chegou · 06 sua vez · 07 fecho | final com voz v4, 54,5 s, revisão aprovada: [`exports/tiktok/tudo-pertim/ep04/`](../../exports/tiktok/tudo-pertim/ep04) |
| **tudo-pertim-05** | "Churrasco de domingo" (transição do vira-lata; voz v4) | 00 capa · 01 o causo · 02 o açougue · 03 o mercadim · 04 geladim · 05 chegou · 06 sua vez · 07 fecho | final com voz v4, 49,25 s, revisão aprovada: [`exports/tiktok/tudo-pertim/ep05/`](../../exports/tiktok/tudo-pertim/ep05) |

O "Segunda sem coragem" e o "Churrasco de domingo" trocaram de número (o Segunda é o EP. 04 e o Churrasco, o EP. 05): JSON, pastas de áudio e de saída, exports e o adesivo da capa acompanham. O Churrasco foi para a voz v4 (no v2, o "Domingo" do começo da capa saía "DÓmingo").

Em cada episódio, `output/<id>/` traz:

- **Vídeo:** `uaipertim-<id>.mp4` (1080×1920, 60 fps, H.264 + AAC 48 kHz).
- **Capa:** `capa.jpg` e `capa.png`. A capa é o quadro 0 do vídeo.
- **Storyboard:** `storyboard.jpg`, com 1 quadro do meio da montagem e 1 do capítulo pronto, por capítulo.
- **Revisão:** a pasta `revisao/` traz `relatorio-tecnico.txt` (termina em `RESULTADO: aprovado` ou lista o que falhou), `zonas-seguras.jpg`, `capa-no-feed.jpg`, `capa.txt` e `motor.json`.

A prévia (`--previa`) vai para `output/<id>/previa/`, fora do git. A cópia para revisão fica em `exports/tiktok/tudo-pertim/epNN/previa/`.

## A cara da série (o que muda em relação à EXPLICA, SÔ!)

1. **Ritmo.**
   - Capítulos de **5–7 s** (a capa e o fecho têm regra própria). O `linha.py` confere e para se algum sair da faixa.
   - Trilha animada no BPM do episódio (`"bpm"` no JSON, 118–124; padrão 120): bumbo em todos os tempos, palma no 2 e no 4, chimbal, baixo em colcheias, acordes "pluck" no contratempo e um sininho (Dó → Sol → Lá menor → Fá).
   - **Títulos com "soco":** cada linha entra com zoom rápido (de 1,45×) e leve overshoot, em 0,3 s, no tempo da batida. O som do soco (bumbo + palma) cai junto, e o "plop" do adesivo do rótulo vem meio tempo antes.
2. **Personagens.**
   - **As lojinhas com olhinhos** piscam, pulam na batida, sorriem (a boca abre e mostra a linguinha) e olham para o que acontece na cena: a logo, a motinha, os balões.
   - **A motinha amarela é o mascote:** cruza a tela em toda troca de capítulo e entrega a sacola na cena do pedido. Leva sempre **a sacola da marca na garupa**, com a logo oficial, nunca espelhada. Na capa ela chega freando e derrapando.
3. **Elementos vivos.**
   - Figurinhas que pipocam: estrela, coração, brilho e "UAI!".
   - Confete nos destaques.
   - Balões de fala com emoji e chips com ícones riscados com "boing".
   - Efeitos sonoros sincronizados com cada peça: soco, derrapagem, buzina, boing, lojinha brotando e acendendo, piscadinha, confete, carimbo, coração, porta, sacola.
4. **Marca.**
   - A logo oficial (`public/img/uaipertim_logo.png`, o arquivo, nunca redesenhada) fica fixa no topo de todos os quadros (y 305–363), com "Uai**Pertim**" e o @ do JSON.
   - Ela também aparece em pontos-chave: no meio da praça (cap. 01), na sacola e na garupa da motinha, e grande e parada no fecho.
   - A assinatura "Tudo **pertim de você**." vem com marcador amarelo.
5. **Mantém da EXPLICA, SÔ!**
   - A paleta: coral `#F2502B`, coral profundo `#E7431C`, creme `#F6EEE2`, amarelo `#F9B233`, verde `#3E9E4E` e tinta `#221C19`.
   - Poppins (Black, ExtraBold e Medium, de `public/fonts`).
   - O fundo creme com raios de sol.
   - As zonas seguras, a linha de apoio e o fecho com a logo parada nos 3 últimos segundos.
6. **Proibido:**
   - tela, celular ou interface de app;
   - qualquer mensagem do tipo "não é app";
   - nomes de lojas reais (só categorias: padaria, mercadim, farmácia…);
   - trechos de vídeos já postados.
7. **Linha de apoio.**
   - No máximo uma por frase, curta, com `*marcador amarelo*` (ou `~coral~`).
   - Fica **≥ 1,5 s inteira na tela**. A anterior sai antes de a próxima entrar, e nunca fica por cima de peça de cena.
   - **Quebra de linha:** nunca separa as duas últimas palavras de uma frase. O emoji gruda na última palavra. "pertim de você", "do Glória" e "no Glória" ficam sempre juntos.
8. **Fecho (6–8 s; `min` 7,5).**
   - Título "Em breve / no Glória.".
   - A **logo oficial grande** entra com mola e **para**: fica visível e parada nos 3 últimos segundos.
   - Assinatura "Tudo pertim de você." e chip coral "Segue @uaipertim" com seta.
   - **A fala do fecho (regra para todo episódio novo):** a pergunta é para quem assiste e o UaiPertim entra como **resposta**. Ex.: "Semana começando? Deixa com o UaiPertim. Tudo pertim de você. Segue a gente!". **Nunca** "UaiPertim. <pergunta>?" (a marca antes da pergunta).
   - O confete do fecho termina antes dos 3 últimos segundos. Todo texto do fecho fica ≥ 3 s parado antes do fim.
9. **Voz** (só na etapa final, depois da prévia aprovada). Sempre Victor Pinho, `LuQ9eaWO9yCQrR73VQFa`, endpoint `with-timestamps`, seed 42 como ponto de partida. **Cada capítulo é UMA geração inteira.** Nunca se emendam palavras ou trechos; se uma frase sair ruim, o capítulo inteiro é gerado de novo com outra seed (`--refaz N`, até 3 seeds; se as 3 falharem, o script para e ninguém muda o texto sem avisar). Veja "Voz v2 × v4" abaixo.
   - **ep01–ep03** (sem o campo `"voz"`): `audio/voz_oficial.json`, `eleven_multilingual_v2`. **Pronúncia** (só no texto enviado à API, por `audio/elevenlabs.py → pronounce()`): "UaiPertim" → "Uai Pérr-tim", "Pertim"/"pertim" → "Pérr-tim".
   - **ep04 em diante: `"voz": "v4"`** no JSON do episódio → `audio/voz_v4.json`, `eleven_v4`. Pronúncia padrão: "UaiPertim" → "Uai Pértim", "Pertim"/"pertim" → "Pértim"/"pértim" (só na API).
   - O `voz.py` recusa "de Glória": é sempre "do Glória"/"no Glória". Se a API recusar a voz, o script **para e avisa**; a voz nunca é trocada.
   - A chave nunca aparece em chat, log, arquivo ou commit.
10. **Mix.** −14 LUFS, pico real ≤ −1 dBTP, trilha com ducking suave sob a voz.
11. **Formato e zonas seguras.**
    - 9:16, 1080×1920, 60 fps, **45–60 s**.
    - Conteúdo entre **x 80–940 e y 265–1456**. Nada em **x ≥ 940 entre y 1060 e 1560**: o motor recorta essa coluna, e a revisão confere caixa por caixa e pixel por pixel.
    - Essa área já fica dentro da interface do TikTok (≈ 130 px no topo, 380 px embaixo e 140 px à direita). A `zonas-seguras.jpg` desenha também esse contorno, em azul.
    - **Capa** = quadro 0: cada linha do título com ≤ 72% da largura (778 px), conteúdo entre y 285–1635, bloco (adesivo + título + motinha) centrado no recorte 3:4.

## Transição por episódio (opcional, desde o ep03)

A troca de capítulo é escolhida no JSON do episódio, em `"transicao"`. Sem o campo, continua a motinha, e o ep01 e o ep02 saem idênticos.

| `transicao` | Quem atravessa e varre o capítulo | Variações a cada troca | Som |
|---|---|---|---|
| *(sem o campo)* / `"moto"` | A motinha com a sacola da marca, com poeira e confete na borda | Sentido alterna; altura, pulinho e empinada mudam (`VARIA`) | Motor + vento, andando de um lado ao outro |
| `"viralata"` | Um vira-lata caramelo correndo com uma linguiça na boca (tamanho de protagonista, ≈ 400 px, contorno tinta); **o rastro de poeira e fumacinha** ao longo da borda varre o capítulo | Em ciclo de 4: correndo feliz, aos pulinhos, a linguiça balançando; derrapa no meio e volta um passo; com o tio da churrasqueira (avental e pegador) correndo atrás; para no meio, olha para a câmera e sai em disparada. O sentido alterna e a altura muda (`VARIA_V`) | Patinhas em galope + latidinho abafado, andando de um lado ao outro |
| `"sacola"` | A sacola comilona da UaiPertim (papel creme, faixa coral, a **logo oficial** de `public/img` — nunca redesenhada, deformada, espelhada nem coberta —, olhinhos no estilo das lojinhas, contorno tinta, ≈ 400 px com as alças) pula na tela um pulo a cada meio tempo, abre uma **boca abaixo da logo** e "engole" o capítulo com um **NHAC!** no tempo cheio; atrás dela já está o próximo ("ploc"); **as migalhas** varrem a borda | Em ciclo de 4: pulo e nhac direto; bochechas cheias, mastigando; palitando os dentes; para no meio e suspira satisfeita ("ahh…") com coraçõezinhos. O sentido alterna e a altura muda (`VARIA_S`). Boca, migalhas, "NHAC!" e figurinhas nunca ficam por cima da logo; ao pular, só o papel amassa | Pulinhos de papel + mordida crocante (NHAC!) + "ploc"; mastigando, o tique do palito ou o "ahh" |
| `"galinha"` | Uma galinha caipira em disparada, batendo as asas; **as penas** que voam ao longo da borda varrem o capítulo | Em ciclo de 4: tropeça no meio; com o pintinho correndo atrás; freia no meio e olha para a câmera; dá um pulão. O sentido alterna e a altura muda (`VARIA_G`) | Cacarejo ("có-có-có-CÓÓ") + bater de asas, andando de um lado ao outro |

- A duração é a mesma para todas: 1,5 tempo da batida (0,75 s a 120 bpm), começando num meio tempo.
- Quem atravessa fica sempre com a base acima de y 1060, fora da coluna de botões.
- Com a galinha, a motinha não faz as trocas; ela só aparece dentro das cenas que a usam (ex.: `chegou`).
- No `fecho`, `"cachorro": {"em": "+1.6"}` faz o vira-lata cruzar ao fundo, do mesmo jeito.
- No `fecho`, `"sacola": {"em": "+1.6"}` faz a sacola comilona passar ao fundo aos pulos, com um nhac (atrás da logo e do texto; termina antes dos 3 s finais).
- No `fecho`, `"galinha": {"em": "+1.6"}` faz a galinha cruzar ao fundo uma última vez, atrás da logo e do texto. Ela termina antes dos 3 s finais, então nada se mexe sobre a logo parada.
- **Transição nova:** é uma função `travessiaX(k, u)` (posição, borda da varredura, sentido e jeito) mais `drawWipeX(ctx, t, k, u)` em `src/anim.js`. Ela é ligada em `travessia()`/`drawWipe()` pelo valor de `TRANS`, com o som próprio em `scripts/audio.py`.

## Céu do dia e relógio (opcionais, desde o ep02)

Os dois só aparecem quando o JSON pede. Um episódio sem eles (como o ep01) é desenhado exatamente como antes.

- **`"ceu"` no capítulo:** `amanhecer`, `meiodia`, `tarde`, `porDoSol`, `noite` ou `creme`.
  - O céu de cada capítulo é um degradê com as cores da paleta, e é varrido junto com a motinha na troca.
  - Dentro da faixa da coluna de botões, os dois céus se fundem, sem borda.
  - O sol faz um arco: nasce à esquerda (na capa ele vai subindo), passa alto atrás da marca ao meio-dia e se põe à direita, fora da área do título.
  - À noite o sol some e a lua sobe, com estrelas (nunca na coluna de botões). Nos céus de dia, nuvens passam devagar, para a imagem nunca ficar parada.
  - Com o céu, a marca do topo fica sem o véu creme. No pôr do sol e à noite ela fica clara (creme/amarelo), e a barra de progresso também.
  - **À noite**, título e apoio usam creme (1ª linha) e amarelo (2ª linha e `~coral~`). O `*marcador*` vira coral, para o texto creme não sumir sobre o amarelo.
- **`"relogio": {"h": 7, "m": 0}` no capítulo:** um despertador grande (ícone, sem texto) no canto de cima à direita da cena (x ≈ 842, `cenaTop` + 84).
  - Entra com "plop" e um tilintar um tempo depois do título.
  - Os ponteiros correm da hora do capítulo anterior até a deste. Na capa, `⏰` no fim de uma linha do título vira um relógio desenhado girando rápido.
  - As cenas do ep02 deixam esse canto livre (x ≥ 770 até `cenaTop` + 160).

## Fazer o próximo episódio (só pelo JSON)

1. Copie `episodios/tudo-pertim-01.json` para `episodios/tudo-pertim-02.json` e troque `id`, `titulo` e os `capitulos` (formato abaixo). **Do ep04 em diante, ponha `"voz": "v4"`** (ep01–ep03 não têm o campo). Não mexa em código.
2. Confira o visual **sem gastar a API** (tempos estimados, sem voz; vai para `output/<id>/previa/`, fora do git):

```bash
cd reels/tudo-pertim
scripts/episodio.sh tudo-pertim-02 --previa
```

3. Gere o episódio de verdade (só depois da prévia aprovada):

```bash
scripts/episodio.sh tudo-pertim-02              # voz (só os capítulos que faltam) → linha do tempo → vídeo → capa → revisão → storyboard
scripts/episodio.sh tudo-pertim-02 --refaz 4    # gera de novo o capítulo 4 INTEIRO (outra seed) e refaz o resto
```

O comando roda, em ordem:

1. `voz.py`: uma geração inteira por capítulo.
2. `linha.py`: a linha do tempo, a narração montada sem cortes e o **mapa de tempos**. Ele confere: total de 45–60 s, capítulos do meio de 5–7 s, cada apoio ≥ 1,5 s, fecho de 6–8 s e logo parada nos 3 últimos s. Se falhar, ajuste `segura`/`min` no JSON; nunca emende áudio.
3. `render.cjs cues`: os eventos de som tirados da animação.
4. `audio.py`: voz + trilha + efeitos, em −14 LUFS.
5. `render.cjs video`, `render.cjs capa` + `revisao_capa.py`, e `render.cjs info`.
6. `qa.py`: o `relatorio-tecnico.txt`, que precisa terminar em `RESULTADO: aprovado`. Na prévia ele nunca sai aprovado, porque falta a voz.
7. `storyboard.py`.

### Voz v2 × v4 (o campo `"voz"`)

**A partir do ep04, o padrão é `"voz": "v4"`** no JSON do episódio. Sem o campo, o episódio usa a voz antiga (v2), que continua valendo para ep01–ep03: a narração deles já está salva e eles renderizam idênticos.

| | v2 (sem o campo; ep01–ep03) | v4 (`"voz": "v4"`; ep04+) |
|---|---|---|
| Configuração | `audio/voz_oficial.json`: `eleven_multilingual_v2`, stability 0,40 · similarity 0,80 · style 0,35 · speaker boost | `audio/voz_v4.json`: `eleven_v4`, stability 0,50 · similarity 0,75 (sem `style` e sem `use_speaker_boost`) |
| Grafia enviada à API | "UaiPertim" → "Uai Pérr-tim", "Pertim" → "Pérr-tim" | **sempre "UaiPertim" → "Uai Pértim" e "Pertim"/"pertim" → "Pértim"/"pértim"** (grafia "acento-separado", aprovada de ouvido no teste `75e8a04`); na tela continua "UaiPertim"/"pertim" |
| Plano B de pronúncia | — | **no capítulo**, só na API: `"pronuncia": "UaiPértim"` ("UaiPertim" → "UaiPértim" junto, "pertim" → "pértim") ou `"pronuncia": "sem-troca"` (texto como escrito; só para testes). **Reprovadas, não usar:** "Pérrtim" e a forma com vírgulas "Uai, Pértim," |
| `<break …/>` | funciona | **ignorado pelo v4**: o `voz.py` tira as tags do texto enviado. A pausa entre capítulos vem da linha do tempo; dentro do capítulo, fica a pausa natural da pontuação |
| Seed | quase repetível | **não é repetível**: a narração aprovada fica salva em `audio/<id>/voz/` e o render sempre usa o arquivo salvo. Nunca regenere a voz só para re-renderizar (o `voz.py` só chama a API para capítulo novo, com texto mudado ou pedido em `--refaz`) |
| Fim da fala | o fim da última letra do alinhamento | igual; mas quando o alinhamento cola a última letra no fim do arquivo (acontece no v4: o som já tinha acabado), o fim da fala é medido no som, só na parte vozeada (< 3 kHz, `scripts/chiado.py → fim_sonoro`), para a conferência do corte e do chiado medirem a cauda de verdade. A conferência do corte também exige os últimos 40 ms do arquivo abaixo de −45 dBFS. Nas vozes do v2 isso nunca acontece: o resultado é o de sempre |
| Alinhamento | em ms | em degraus de ~40–80 ms: o `linha.py` atrasa o início de cada palavra 60 ms e o arredonda para o quadro (60 fps), para nenhuma peça entrar antes de a palavra soar |

Vale para as duas: recusar "de Glória" (sempre "do Glória"/"no Glória"), a checagem de chiado final e as 3 seeds por capítulo. A validação do fluxo com o v4 (um capítulo passando por `voz.py` → `linha.py` → render) está em `testes/voz-v4/validacao/` (`valida.sh`, `VALIDACAO.md`); o teste de comparação v2 × v4, em `testes/voz-v4/RELATORIO.md`.

### A chave da API

A chave do ElevenLabs fica **só em Segredos de rede**: a rede da nuvem põe o cabeçalho `xi-api-key` nas chamadas a `api.elevenlabs.io`. Fora da nuvem, exporte `ELEVENLABS_API_KEY` (ou `XI_API_KEY`) no terminal. Os scripts só leem a variável e nunca a imprimem, salvam ou registram.

## Formato do JSON

```json
{
  "id": "tudo-pertim-02",
  "titulo": "texto livre",
  "marca": "@uaipertim",
  "bpm": 120,
  "voz": "v4",
  "capitulos": [
    { "rotulo": "TUDO PERTIM · EP. 02", "tom": "amarelo", "titulo": ["Tá chegando", "no Glória 👀"],
      "fala": [{ "texto": "Ô Glória, tem novidade chegando pertim docês!", "apoio": null }],
      "diagrama": { "tipo": "capa", "marcador": "Glória", "olhos": { "em": "Glória" }, "confete": { "em": "novidade" }, "buzina": { "em": "pertim" } } },
    { "rotulo": "QUEM SOU EU", "tom": "pessego", "titulo": ["Prazer,", "UaiPertim!"],
      "fala": [
        { "texto": "Prazer, eu sou o UaiPertim!", "apoio": null },
        { "texto": "O comércio do Glória, tudo num lugar só.", "apoio": "O comércio do Glória, *tudo num lugar só*." }
      ],
      "diagrama": { "tipo": "quem", "logo": { "em": "UaiPertim" }, "lojas": [{ "tipo": "padaria", "em": "comércio" }], "confete": { "em": "só" } },
      "inicio": 0.25, "segura": 0.6, "min": 0, "seed": 42 }
  ]
}
```

- **Os capítulos:** o **capítulo 0 é a capa** (cena `capa`), e o seu `rotulo` ("TUDO PERTIM · EP. NN") vira o adesivo da capa. Cada capítulo 1… ganha um segmento na barra de progresso. O último é sempre o `fecho`, com `"min": 7.5`.
- **`bpm`:** o andamento da trilha e da entrada dos títulos (118–124).
- **`voz`:** `"v4"` (padrão do ep04 em diante) ou sem o campo (a voz antiga v2 de ep01–ep03). Veja "Voz v2 × v4". No v4, o capítulo aceita `"pronuncia": "UaiPértim"` ou `"sem-troca"` (plano B; o padrão é "Uai Pértim").
- **`fala`:** as frases do capítulo, na ordem. O texto falado é a junção delas e vai **inteiro numa geração só**.
- **`apoio`:** a linha de apoio que entra com a frase (`null` = nenhuma). Aceita `*marcador amarelo*` e `~coral~`.
- **`titulo`:** sempre 2 linhas (a 2ª em coral). Na capa, `👀` no fim de uma linha vira os olhinhos desenhados (piscam e olham em volta), `⏰` vira o relógio girando, e `marcador` é a palavra no marcador amarelo.
- **`ceu`** e **`relogio`** (opcionais): veja "Céu do dia e relógio".
- **`tom`:** `creme`, `pessego`, `amarelo` ou `verde`.
- **Tempo do capítulo:** `inicio` é a pausa antes da voz (padrão 0,25 s; capa 0,10 s); `segura` é o tempo depois da voz antes da troca (padrão 0,45 s); `min` é a duração mínima; `seed` é a seed da 1ª geração.
- **`em` (dentro da cena):** a palavra da fala que dispara a peça (`"queijo"`, `"queijo#2"` para a 2ª vez, `"+1.2"` para 1,2 s depois do começo do capítulo, ou `"fim"`). Vale a palavra como aparece na tela (`"UaiPertim"`).

### Biblioteca de cenas

| `tipo` | Visual | Campos |
|---|---|---|
| `capa` com `"cena": "segunda"` | O adesivo, o título e, no lugar da motinha, o calendário com o "SEG" caindo (preso num aro só), o bonequinho bocejando enrolado no cobertor xadrez e a geladeira entreaberta com a luzinha escapando | `cena: "segunda"`, `marcador`, `calendario: {em}`, `geladeira: {em}`, `bocejo: {em}` |
| `capa` com `"cena": "churrasco"` | O adesivo, o título e, no lugar da motinha, a churrasqueira apagada com uma fumacinha triste, o saco de carvão vazio virado e o vira-lata sentado com cara de pidão (choraminga na palavra) | `cena: "churrasco"`, `marcador`, `cao: {em}` |
| `capa` com `"cena": "porta"` | O adesivo, o título e, no lugar da motinha, a porta tremendo com o "TOC TOC" (batidas a cada 1,5 s) e a lata de biscoito vazia com a mosquinha rodando | `cena: "porta"`, `marcador`, `lata: {em}` |
| `capa` | Adesivo do episódio, título grande (palavra no marcador amarelo, olhinhos 👀 piscando), a motinha chegando freando e derrapando (no quadro 0 já está na derrapada, com fumaça e marca de pneu), confete, figurinhas "UAI!" e brilho, buzina | `marcador`, `olhos: {em}`, `confete: {em}`, `buzina: {em}` |
| `quem` | A logo oficial entra com mola no meio da praça; as lojinhas brotam em volta (olhando para a logo) e o coreto; estrela, coração e confete | `logo: {em}`, `lojas: [{tipo, em}]` (até 4), `confete: {em}` |
| `vitrine` | 4 lojinhas dormindo acendem uma a uma (brilho, placa balançando, olhinhos abrindo), cada uma com o seu item pulando na batida e a plaquinha do nome; o docim pula no fim, com corações e confete | `lojas: [{tipo, t, em, item: pao\|cesta\|remedio\|lanche\|queijo\|doce}]` (até 4), `docim: {em}` |
| `pedido` | A sacola da marca enche (itens caindo), ganha o check; a motinha cruza, a sacola pula para a garupa e ela para na porta da casinha, que abre; os passos ESCOLHEU · PEDIU · CHEGOU com check | `sacola: {em}`, `itens: [pao, queijo, doce]`, `pedido: {em}`, `moto: {em}`, `porta: {em}`, `passos: [3 textos]` |
| `aperto` | 3 chips com ícone (fila, sol, pijama…) pulam com "boing", tremem e são riscados um a um; embaixo, a casinha abre, a motinha chega e a lojinha comemora | `chips: [{t, icone: fila\|sol\|pijama\|chuva\|chinelo, em}]` (3) |
| `minas` | Os morros de Minas sobem; 3 lojinhas brotam juntas, pulam na mesma batida e sorriem; o selo "do Glória" é carimbado; o coração bate na batida, com confete | `montanhas: {em}`, `lojas: {em}`, `selo: {t: [linha pequena, linha grande], em}`, `coracao: {em}` |
| `comenta` | A lojinha-mistério (placa com "?"), grande e no centro, olha para os balões de comentário que brotam em volta, em ondas de 2 (emoji + texto + "pop"), com figurinhas de coração, estrela e brilho pipocando entre eles | `loja: {em}`, `baloes: [{t, emoji, em}]` (até 6; dois com o mesmo `em` brotam juntos, um logo depois do outro) |
| `manha` | A mesinha com a xícara fumegando; o "?" do que acabou; a padaria dormindo ("z z z", toldo enrolado) que abre o toldo, acende e sorri; os pães de queijo pulando da porta em pirâmide | `xicara: {em}`, `acabou: {em}`, `padaria: {em}`, `paes: {em}` |
| `almoco` | O letreiro "RONC!" tremendo; o prato feito (arroz, feijão, bife e salada) com vapor; o garfo e a faca dançando na batida | `ronc: {em}`, `prato: {em}`, `talheres: {em}`, `rapidim: {em}` |
| `calor` | O sol forte com raios girando; o termômetro com o mercúrio subindo; a sorveteria soltando picolés e casquinha | `termometro: {em}`, `sorveteria: {em}`, `picoles: {em}`, `geladim: {em}` |
| `janta` | O mercadim; o tomate que sai quicando três vezes até cair na sacola da marca; o check | `mercadim: {em}`, `tomate: {em}`, `resolve: {em}` |
| `noite` | A pizza girando; o lanche e o espetinho pipocando e pulando na batida; a motinha chegando com a sacola | `pizza: {em}`, `lanche: {em}`, `espeto: {em}`, `moto: {em}` |
| `enquete` | Balões de resposta (emoji opcional + texto, do tamanho da resposta), inclinados e desalinhados, um a um com "pop", com corações e estrelas pipocando. Com 5 ou 6 respostas, os balões ficam mais baixos e entram em ondas | `opcoes: [{t, emoji?, em}]` (até 6) |
| `visita` | A porta tremendo com dois "TOC!", que abre com luz; os bonequinhos da visita (corpo de pílula, olhos de pontinho, sem cara infantil) brotando um a um; os balões "Ô de casa!" | `toc: {em}`, `abre: {em}`, `pessoas: [{em}]` (até 5) |
| `cozinha` | O bule fumegando na mesinha; o armário de parede que abre vazio, com teia e aranhinha; o "?"; a lata de biscoito que tomba vazia | `bule: {em}`, `armario: {em}`, `lata: {em}` |
| `socorro` | A lojinha (padaria, ou a de `loja`) pulando de alegria; os itens voando da porta para a sacola com a logo oficial; o check | `loja` (opcional: `mercado`, `acougue`…), `padaria: {em}` ou `lojinha: {em}`, `itens: [{tipo, em, som?}]` (até 4; `som` troca o "plop" da chegada, ex.: `flop` para o saco de carvão) |
| `capricho` | O mercadim num gramadinho; a toalha xadrez desenrolando na mesa; os itens saindo do mercadim e pousando um a um | `toalha: {em}`, `itens: [{tipo, em}]` (até 3: queijo, doce, requeijao, …) |
| `chegou` | A motinha chegando com a sacola; a mesa farta; a visita atrás da mesa com coraçõezinhos subindo; a piscadinha para a câmera | `moto: {em}`, `mesa: {em}`, `visita: {em}`, `piscadinha: {em}` |
| `causo` | A família brotando (bonequinhos do ep03); o tio de avental e pegador ao lado da churrasqueira apagada; o "?" sobre a grelha vazia | `familia: {em}`, `tio: {em}`, `grelha: {em}` |
| `acougue` | A lojinha do açougue (toldo vermelho e branco); a picanha e a costelinha pulando na tábua; a linguiça pendurada no gancho, balançando | `picanha: {em}`, `linguica: {em}`, `costelinha: {em}`, `manda: {em}` |
| `geladim` | O isopor abre; três garrafas de refri (sem marca, com gotinhas) sobem geladas; os brilhos de "trincando"; os cubos de gelo tilintando e o saco de gelo caindo com "tum" | `isopor: {em}`, `refri: {em}`, `trincando: {em}`, `gelo: {em}` |
| `churrasco` | A motinha chegando; a churrasqueira acesa com a grelha enchendo; a fumaça que vira coração; a família comemorando; o tio jogando um pedacinho para o vira-lata, que abana o rabo | `moto: {em}`, `grelha: {em}`, `fumaca: {em}`, `familia: {em}`, `pedacinho: {em}` |
| `geladeira` | A geladeira abre com luz; no tempo da voz aparecem o limão solitário, o meio queijo e o pote de sorvete, que abre e mostra o feijão ("?!" e o bonequinho de pijama levando susto, de cabelo em pé); o grilinho canta lá dentro ("cri-cri") | `abre: {em}`, `limao: {em}`, `queijo: {em}`, `sorvete: {em}`, `feijao: {em}` |
| `preguica` | O bonequinho de pijama afundando no sofá, a nuvem cinza com chuvisco só em cima dele, o "Zzz" subindo e os chinelos no chão | `nuvem: {em}`, `afunda: {em}`, `zzz: {em}`, `chinelo: {em}` |
| `solucao` | 3 lojinhas brotam apagadas e acendem em sequência (brilho, sorriso, bracinho acenando), com estrela e coração | `lojas: [{tipo, em}]` (3; `hortifruti`, `mercado`, `acougue`…), `brota: {em}` |
| `lista` | Os itens da compra (sem marca) caem um a um do alto na sacola da marca e ficam aparecendo pela boca; check, confete e figurinhas atrás da sacola | `itens: [{tipo, em}]` (até 5: `arroz`, `feijao`, `ovos`, `verdura`, `cafe`, `limao`, …) |
| `leve` | A motinha chega; a geladeira abre cheia e iluminada; o bonequinho se espreguiça feliz; a nuvem cinza vira sol sorrindo | `moto: {em}`, `geladeira: {em}`, `espreguica: {em}`, `sol: {em}` |
| `fecho` | Título do capítulo, a logo oficial grande e fixa, a assinatura "Tudo pertim de você.", chip "Segue @uaipertim" com seta e confete final | `logo: {em}`, `assinatura: {t, em}`, `chip: {t, em}`, `confete: {em}`; opcionais, cruzando ao fundo antes dos 3 s finais: `galinha`, `cachorro` ou `sacola: {em}` |

**Cena nova:** é um bloco `CENAS.<nome> = { setup(cap), draw(ctx, cap, t) }` em `src/anim.js`.

- No `setup`, resolva os tempos com `at(cap, "palavra")` e registre os sons com `cue(t, 'tipo')`.
- No `draw`, use as peças prontas: `lojinha` (com olhinhos, pulo na batida, olhar e sorriso), `moto` (com a sacola da marca), `casinha`, `coreto`, `selo`, `sticker` (estrela, coração, brilho, "UAI!"), `confete`, `olhos`, os `ITENS`, `chip` (com `ICONES`), `check`, `marker`, `hop` (o pulinho na batida), `enter`/`pop`/`ent`.
- Marque as peças com `BOX(nome, …)` para a revisão.
- O resto vem sozinho: rótulo em adesivo, título com soco, apoio, a troca com a motinha, a barra de progresso, a marca, as zonas seguras e as caixas da revisão. A cena vai de `cap.cenaTop` (o pé do apoio) até `PE` (y 1450).

## Estrutura

```
episodios/<id>.json       roteiro (o único arquivo que muda entre episódios)
scripts/episodio.sh       o comando único (e --previa, sem voz)
scripts/voz.py            narração: uma geração inteira por capítulo (with-timestamps), conferida e com histórico; v2 ou v4 pelo campo "voz"
scripts/voz_versao.py     qual voz (voz_oficial.json v2 ou voz_v4.json) e qual grafia vão para a API; tempo das palavras no v4
testes/voz-v4/            teste v2 × v4 (RELATORIO.md) e validação do fluxo com o v4 (validacao/), fora da produção
scripts/linha.py          linha do tempo + narração montada sem cortes + mapa de tempos (45–60 s, capítulos 5–7 s, apoios, fecho, logo)
scripts/audio.py          voz + trilha animada (bpm do episódio) com ducking + efeitos → audio/<id>/mix.wav (−14 LUFS)
scripts/render.cjs        cues | info | capa | video | stills (Chromium headless, quadro a quadro; servidor na raiz do repo)
scripts/revisao_capa.py   regra das capas (recorte 3:4, play, contador, y 285–1635, palavra-chave ≤ 72%)
scripts/qa.py             revisão técnica → revisao/relatorio-tecnico.txt + zonas-seguras.jpg (com o contorno do TikTok)
scripts/storyboard.py     montagem + pronto, por capítulo
src/anim.js               motor (window.TUDO): troca com a motinha (wipe), barra de progresso, adesivo + título com soco, apoio, cenas, marca
src/index.html            página de render e de prévia no navegador (?ep=<id>, com som; ?previa para os tempos estimados)
```

Para ver no navegador: na raiz do repositório, rode `npx http-server -p 8080` e abra `http://localhost:8080/reels/tudo-pertim/src/index.html?ep=tudo-pertim-01&previa`.

**Dependências:** Node com `playwright` (Chromium), `ffmpeg` e Python 3 com `numpy`, `scipy`, `pillow` e `soundfile` (usado por `audio/common.py`, que o `voz.py` e o `linha.py` importam para a pronúncia).
