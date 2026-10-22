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
| **tudo-pertim-01** | "Prazer, UaiPertim!" | 00 capa · 01 quem sou eu · 02 o que tem · 03 como funciona · 04 sem aperto · 05 feito em Minas · 06 sua vez · 07 fecho | prévia sem voz (tempos estimados) em [`exports/tiktok/tudo-pertim/ep01/previa/`](../../exports/tiktok/tudo-pertim/ep01/previa) |

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
   - O confete do fecho termina antes dos 3 últimos segundos. Todo texto do fecho fica ≥ 3 s parado antes do fim.
9. **Voz oficial** (`audio/voz_oficial.json`; só na etapa final, depois da prévia aprovada).
   - Victor Pinho, `LuQ9eaWO9yCQrR73VQFa`, `eleven_multilingual_v2`. **Cada capítulo é UMA geração inteira** (endpoint `with-timestamps`). Nunca se emendam palavras ou trechos; se uma frase sair ruim, o capítulo inteiro é gerado de novo com outra seed (`--refaz N`).
   - **Pronúncia** (só no texto enviado à API, por `audio/elevenlabs.py → pronounce()`): "UaiPertim" → "Uai Pérr-tim", "Pertim"/"pertim" → "Pérr-tim".
   - O `voz.py` recusa "de Glória": é sempre "do Glória"/"no Glória". Se a API recusar a voz, o script **para e avisa**; a voz nunca é trocada.
   - A chave nunca aparece em chat, log, arquivo ou commit.
10. **Mix.** −14 LUFS, pico real ≤ −1 dBTP, trilha com ducking suave sob a voz.
11. **Formato e zonas seguras.**
    - 9:16, 1080×1920, 60 fps, **45–60 s**.
    - Conteúdo entre **x 80–940 e y 265–1456**. Nada em **x ≥ 940 entre y 1060 e 1560**: o motor recorta essa coluna, e a revisão confere caixa por caixa e pixel por pixel.
    - Essa área já fica dentro da interface do TikTok (≈ 130 px no topo, 380 px embaixo e 140 px à direita). A `zonas-seguras.jpg` desenha também esse contorno, em azul.
    - **Capa** = quadro 0: cada linha do título com ≤ 72% da largura (778 px), conteúdo entre y 285–1635, bloco (adesivo + título + motinha) centrado no recorte 3:4.

## Fazer o próximo episódio (só pelo JSON)

1. Copie `episodios/tudo-pertim-01.json` para `episodios/tudo-pertim-02.json` e troque `id`, `titulo` e os `capitulos` (formato abaixo). Não mexa em código.
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

### A chave da API

A chave do ElevenLabs fica **só em Segredos de rede**: a rede da nuvem põe o cabeçalho `xi-api-key` nas chamadas a `api.elevenlabs.io`. Fora da nuvem, exporte `ELEVENLABS_API_KEY` (ou `XI_API_KEY`) no terminal. Os scripts só leem a variável e nunca a imprimem, salvam ou registram.

## Formato do JSON

```json
{
  "id": "tudo-pertim-02",
  "titulo": "texto livre",
  "marca": "@uaipertim",
  "bpm": 120,
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
- **`fala`:** as frases do capítulo, na ordem. O texto falado é a junção delas e vai **inteiro numa geração só**.
- **`apoio`:** a linha de apoio que entra com a frase (`null` = nenhuma). Aceita `*marcador amarelo*` e `~coral~`.
- **`titulo`:** sempre 2 linhas (a 2ª em coral). Na capa, `👀` no fim de uma linha vira os olhinhos desenhados (piscam e olham em volta), e `marcador` é a palavra no marcador amarelo.
- **`tom`:** `creme`, `pessego`, `amarelo` ou `verde`.
- **Tempo do capítulo:** `inicio` é a pausa antes da voz (padrão 0,25 s; capa 0,10 s); `segura` é o tempo depois da voz antes da troca (padrão 0,45 s); `min` é a duração mínima; `seed` é a seed da 1ª geração.
- **`em` (dentro da cena):** a palavra da fala que dispara a peça (`"queijo"`, `"queijo#2"` para a 2ª vez, `"+1.2"` para 1,2 s depois do começo do capítulo, ou `"fim"`). Vale a palavra como aparece na tela (`"UaiPertim"`).

### Biblioteca de cenas

| `tipo` | Visual | Campos |
|---|---|---|
| `capa` | Adesivo do episódio, título grande (palavra no marcador amarelo, olhinhos 👀 piscando), a motinha chegando freando e derrapando (no quadro 0 já está na derrapada, com fumaça e marca de pneu), confete, figurinhas "UAI!" e brilho, buzina | `marcador`, `olhos: {em}`, `confete: {em}`, `buzina: {em}` |
| `quem` | A logo oficial entra com mola no meio da praça; as lojinhas brotam em volta (olhando para a logo) e o coreto; estrela, coração e confete | `logo: {em}`, `lojas: [{tipo, em}]` (até 4), `confete: {em}` |
| `vitrine` | 4 lojinhas dormindo acendem uma a uma (brilho, placa balançando, olhinhos abrindo), cada uma com o seu item pulando na batida e a plaquinha do nome; o docim pula no fim, com corações e confete | `lojas: [{tipo, t, em, item: pao\|cesta\|remedio\|lanche\|queijo\|doce}]` (até 4), `docim: {em}` |
| `pedido` | A sacola da marca enche (itens caindo), ganha o check; a motinha cruza, a sacola pula para a garupa e ela para na porta da casinha, que abre; os passos ESCOLHEU · PEDIU · CHEGOU com check | `sacola: {em}`, `itens: [pao, queijo, doce]`, `pedido: {em}`, `moto: {em}`, `porta: {em}`, `passos: [3 textos]` |
| `aperto` | 3 chips com ícone (fila, sol, pijama…) pulam com "boing", tremem e são riscados um a um; embaixo, a casinha abre, a motinha chega e a lojinha comemora | `chips: [{t, icone: fila\|sol\|pijama\|chuva\|chinelo, em}]` (3) |
| `minas` | Os morros de Minas sobem; 3 lojinhas brotam juntas, pulam na mesma batida e sorriem; o selo "do Glória" é carimbado; o coração bate na batida, com confete | `montanhas: {em}`, `lojas: {em}`, `selo: {t: [linha pequena, linha grande], em}`, `coracao: {em}` |
| `comenta` | A lojinha-mistério (placa com "?"), grande e no centro, olha para os balões de comentário que brotam em volta, em ondas de 2 (emoji + texto + "pop"), com figurinhas de coração, estrela e brilho pipocando entre eles | `loja: {em}`, `baloes: [{t, emoji, em}]` (até 6; dois com o mesmo `em` brotam juntos, um logo depois do outro) |
| `fecho` | Título do capítulo, a logo oficial grande e fixa, a assinatura "Tudo pertim de você.", chip "Segue @uaipertim" com seta e confete final | `logo: {em}`, `assinatura: {t, em}`, `chip: {t, em}`, `confete: {em}` |

**Cena nova:** é um bloco `CENAS.<nome> = { setup(cap), draw(ctx, cap, t) }` em `src/anim.js`.

- No `setup`, resolva os tempos com `at(cap, "palavra")` e registre os sons com `cue(t, 'tipo')`.
- No `draw`, use as peças prontas: `lojinha` (com olhinhos, pulo na batida, olhar e sorriso), `moto` (com a sacola da marca), `casinha`, `coreto`, `selo`, `sticker` (estrela, coração, brilho, "UAI!"), `confete`, `olhos`, os `ITENS`, `chip` (com `ICONES`), `check`, `marker`, `hop` (o pulinho na batida), `enter`/`pop`/`ent`.
- Marque as peças com `BOX(nome, …)` para a revisão.
- O resto vem sozinho: rótulo em adesivo, título com soco, apoio, a troca com a motinha, a barra de progresso, a marca, as zonas seguras e as caixas da revisão. A cena vai de `cap.cenaTop` (o pé do apoio) até `PE` (y 1450).

## Estrutura

```
episodios/<id>.json       roteiro (o único arquivo que muda entre episódios)
scripts/episodio.sh       o comando único (e --previa, sem voz)
scripts/voz.py            narração: voz oficial, uma geração inteira por capítulo (with-timestamps), pronounce(), conferida e com histórico
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
