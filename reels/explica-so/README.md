# Série EXPLICA, SÔ! — vídeos explicativos do @uaipertim em capítulos (30–45 s)

Vídeos curtos que explicam uma coisa do dia a dia em capítulos, com a cara da UaiPertim. O motor é o da Série Explica (FAZLO Hospeda), adaptado à marca. É um **modelo reutilizável**: cada episódio é só um JSON (`episodios/<id>.json`) e um comando.

| Episódio | Tema | Capítulos | Saída |
|---|---|---|---|
| **explica-so-01** | "Faltou um trem?" | 00 capa · 01 o causo · 02 o Glória tem · 03 a sacola · 04 chegou · 05 fecho | [`output/explica-so-01/`](output/explica-so-01) · 38,6 s |
| **historia-uaipertim** (especial) | "Por que UaiPertim?" (a nossa história) | 00 capa · 01 o Glória hoje · 02 do outro lado do balcão · 03 a ideia · 04 o nome · 05 feito aqui · 06 fecho | [`output/historia-uaipertim/`](output/historia-uaipertim) · 63,8 s |

Em cada episódio, `output/<id>/` traz:

- **Vídeo:** `uaipertim-<id>.mp4` (1080×1920, 60 fps, H.264 + AAC 48 kHz).
- **Capa:** `capa.jpg` e `capa.png`. A capa é o quadro 0 do vídeo.
- **Storyboard:** `storyboard.jpg`, com 1 quadro do meio da montagem e 1 do capítulo pronto, por capítulo.
- **Revisão:** a pasta `revisao/` traz `relatorio-tecnico.txt` (termina em `RESULTADO: aprovado` ou lista o que falhou), `zonas-seguras.jpg`, `capa-no-feed.jpg`, `capa.txt` e `motor.json`.

## Estado do explica-so-01

Pronto e aprovado (`output/explica-so-01/revisao/relatorio-tecnico.txt` termina em `RESULTADO: aprovado`): 38,56 s, voz oficial com seed 42 em todos os capítulos (uma geração inteira cada).

- **Versões:** na 2ª, foram gerados de novo os capítulos 00 (sem o "sô") e 02. Na 3ª, só o 02: o assunto é o queijo, então a farmácia saiu e ficaram padaria e mercadim, cada um com o balãozinho de queijo.
- **Pronúncia:** o "é" de "Pérr-tim" foi conferido pelo alinhamento. Deu F1 de 552 Hz (cap. 02) e 532 Hz (cap. 05), na faixa do "é" aberto de "Café" (527 Hz), não do "ê" fechado de "cadê" (413 Hz).

## Episódio especial "Por que UaiPertim?" (`historia-uaipertim`)

A história do UaiPertim, no mesmo motor e com a mesma identidade. O que muda em relação aos episódios da série:

- **Duração de 60–80 s** (só para este id: `LIMITES` em `scripts/linha.py` e `scripts/qa.py`). O fecho, os apoios e a logo seguem as regras de sempre.
- **Trilha mais calma:** perfil `historia-uaipertim` em `scripts/audio.py`. É a mesma família de instrumentos a 80 BPM, com o arpejo mais espaçado, sem shaker, o pulso grave mais leve, os efeitos 2 dB mais baixos e sem os cômicos (o "boing" vira um ping suave).
- **Capa no padrão das capas novas do Dicionário** (cena `capaHistoria`):
  - selo coral "A NOSSA HISTÓRIA" no topo;
  - a lojinha curiosa grande olhando para o título;
  - "Por que / UaiPertim?" com o marcador amarelo, tudo centrado no recorte 3:4.
  - Com `"marca": false`, a marca do topo não aparece no quadro 0 e entra na troca para o capítulo 01.
- **Saída extra:** `capa-3x4.png`, o recorte 3:4 da capa, para conferir e para o "Editar capa". O `capa.png` é a capa inteira, 9:16.
- **Pronúncia** (só na API, em `audio/voz_oficial.json`): "UaiFood" → "Uai fúdi", "WhatsApp" → "Uátsap", "Burguer" → "Búrguer". Grafias de um capítulo só vão no campo `"pronuncia"` do capítulo, no JSON (`pron()` em `voz.py`/`linha.py`); este episódio não precisou delas.

**Estado:** pronto e aprovado (`output/historia-uaipertim/revisao/relatorio-tecnico.txt` termina em `RESULTADO: aprovado`), com 63,77 s.

- **Capítulos:** 00 2,80 s · 01 9,20 s · 02 9,77 s · 03 8,48 s · 04 12,09 s · 05 8,53 s · 06 7,50 s, com trocas de 0,9 s.
- **Versão 4:** o nome saiu da fala do fecho, que agora é "E essa é a nossa história. Chegando em breve no Glória. Segue a gente!" (seed 42, uma geração inteira). A logo oficial entra em "história"; o resto da tela do fecho não mudou.
- **Versão 3:**
  - capítulo 06 gerado de novo (seed 1042) até o "Pertim" ficar com a força no TIM;
  - na cena do 05, a logo oficial do Varanda Burguer House (`public/img/parceiros/varanda-burguer-house.png`) num círculo branco, entrando com pop em "Varanda" e parada até a troca, com o selo verde "PRIMEIRO PARCEIRO" no canto.
  - A voz dos capítulos 00 a 05 não mudou.
  - O "Pérr-tim" do 06 ficou com o TIM tônico: a vogal do i tem 0,151 s e 147 Hz, contra 0,116 s e 136 Hz do é, e o é continua aberto (F1 até 554 Hz).
  - A logo fica inteira e parada por 2,74 s antes da troca. O arquivo é o print enviado, com o perfil Display P3 original; o motor só tira o fundo do print, fora da borda do disco laranja (`disco` no JSON).
  - O master de `audio.py` agora confere o pico real depois do AAC (`tp_aac`) e desce o teto do limitador até o vídeo ficar ≤ −1,3 dBTP. Neste episódio o teto ficou em −4,2 dBTP, e o vídeo em −1,8 dBTP.
- **Versão 2 (correções):**
  - 00 gerado de novo até a pergunta subir no fim;
  - 01 com "Uátsap";
  - 04 com "Uai fúdi" e o "Pertim" com a força no TIM;
  - na cena do 02, um balão só, com o contador ×1 → ×30.
  - A voz dos capítulos 02, 03, 05 e 06 não mudou.
- **Voz:**
  - capítulo 00 com a seed 5042, a 5ª de 7 gerações inteiras: o F0 dos últimos 0,6 s sobe de 98 para 230 Hz e termina em 204 Hz (+8,5 st), e o "Pérr-tim" tem o TIM tônico e o é aberto (F1 até 523 Hz);
  - capítulos 01 e 04 com a seed 1042;
  - os outros com a seed 42.
- **Pronúncia** (conferida pelo alinhamento):
  - "Uátsap" com o á aberto (F1 734 Hz) e o p final soltando, um estouro em −38 dB depois da oclusão;
  - "fúdi" com o ú fechado (F1 299 Hz) e o i final (F2 2198 Hz, 0,18 s);
  - o "Pérr-tim" do 04 com o TIM tônico nas duas vezes (vogal do TIM com 0,175 s contra 0,116 s do é; F0 143 contra 133 Hz e 130 contra 109 Hz) e o é aberto (F1 até 543 e 535 Hz);
  - "Búrguer" com o ú fechado (F1 326 Hz).

## A cara da UaiPertim (o que muda em relação ao motor do Hospeda)

1. **Paleta e fundo.**
   - Cores: coral `#F2502B`, coral profundo `#E7431C`, creme `#F6EEE2`, amarelo `#F9B233`, verde `#3E9E4E` e tinta `#221C19`.
   - O fundo é creme, com raios de sol suaves girando devagar (o `Sunburst` de `src/components/Decor.tsx`), as bolinhas coral e um confete leve.
   - Cada capítulo tem um brilho quente próprio, escolhido em `tom`: `creme`, `pessego`, `amarelo` ou `verde`.
2. **Tipografia.** Poppins Black (títulos), ExtraBold (rótulos e destaques) e Medium (apoio). As fontes vêm de `public/fonts` do próprio repositório.
3. **A rota da entrega.**
   - Uma rua clara com tracejado coral liga os nós 01…05 pela esquerda da tela.
   - Dentro do capítulo, o tracejado vai ficando forte do nó até o pé do quadro, como uma barra de progresso.
   - Na troca de capítulo (0,9 s), **a motinha amarela de entrega** sai do nó, faz o S da rua e estaciona no próximo nó. A câmera vai junto e o nó novo acende.
   - Os capítulos ficam a 1400 px um do outro no mundo, e o título do capítulo novo já entra durante a troca. Assim **nenhum quadro da troca fica vazio**.
4. **Marca fixa.** No topo de todos os quadros (y 305–363) vão a logo oficial (`public/img/uaipertim_logo.png`, o arquivo, nunca redesenhada), "Uai**Pertim**" e o @ do JSON (`marca`).
5. **A cena se constrói.**
   - Cada capítulo tem um rótulo coral (máquina de escrever), um título fixo em 2 linhas (tinta + coral) e uma linha de apoio.
   - A **cena** cresce peça por peça, cada peça na palavra da voz que a dispara.
   - O estilo é o das lojinhas de `src/components/Town.tsx` e `Scenery.tsx`: fachadas com olhinhos, toldo listrado, placa com ícone, árvores e o pin coral.
   - **Proibido:** tela, celular ou interface de app; mensagem do tipo "não é app"; trechos de vídeos já postados.
6. **Linha de apoio.**
   - Uma por frase, com `*marcador amarelo*` (ou `~coral~`) para destacar.
   - Fica **≥ 1,5 s inteira na tela**. A anterior sai antes de a próxima entrar, e nunca fica por cima de peça de cena.
   - **Quebra de linha:** nunca separa as duas últimas palavras de uma frase. O emoji gruda na última palavra. "pertim de você", "do Glória" e "no Glória" ficam sempre juntos.
   - Em 2 linhas, a quebra é a mais equilibrada, de preferência depois de vírgula.
7. **Fecho (6–8 s; `min` 7,5).**
   - Título "Em breve / no Glória.".
   - A **logo oficial grande** entra com mola e para. Ela fica **parada e visível nos 3 últimos segundos** (o motor nunca a deixa entrar depois de fim − 3,9 s).
   - Chip coral "Segue @uaipertim", com uma seta desenhada.
   - Todo texto do fecho fica **≥ 3 s parado** antes do fim.
8. **Voz oficial da UaiPertim** (`audio/voz_oficial.json`).
   - Victor Pinho, `LuQ9eaWO9yCQrR73VQFa`, com seed 42 como ponto de partida. A voz tem **dois perfis** (decisão do teste em `audio/teste-v4/relatorio.md`), escolhidos pelo campo `"perfil_voz"` do JSON do episódio:
     - **`narracao` (o padrão para todo episódio novo):** `eleven_v4`, com estabilidade 0,50 e semelhança 0,75. Não envia style nem speaker boost (fica o padrão do modelo).
     - **`pausas`:** `eleven_multilingual_v2`, com estabilidade 0,40, semelhança 0,80, estilo 0,35 e speaker boost. Use para texto com `<break time=... />`, que o v4 não respeita. O `voz.py` avisa no console se um episódio no perfil `narracao` tiver `<break>`; ele não converte sozinho.
   - **Episódios já publicados:** o `explica-so-01` e o `historia-uaipertim` foram gerados no que hoje é o perfil `pausas` e ficam marcados `"perfil_voz": "pausas"` (refazer o vídeo não gera a voz de novo).
   - O `falas.json` registra o perfil e o modelo de cada capítulo. Um capítulo é gerado de novo se o texto, a grafia enviada ou o perfil mudarem.
   - **Alinhamento do eleven_v4:** vem em degraus de ~40 ms. Por isso a conferência automática tem essa folga: pausa interna até 0,94 s; e, se o alinhamento terminar no último degrau, quem decide se a fala foi cortada é o áudio (os 30 ms finais em silêncio). O `linha.py` também guarda 0,04 s a mais antes da 1ª letra. A regra de uma geração inteira por capítulo não muda.
   - **Cada capítulo é UMA geração inteira** (endpoint `with-timestamps`, todas as frases numa chamada). Se uma frase sair ruim, o capítulo inteiro é gerado de novo com outra seed (`--refaz N`, seed + 1000). Nunca se emendam palavras ou trechos.
   - **Pronúncia:** vale o dicionário do perfil (`audio/elevenlabs.py → pronounce(texto, perfil)`), só no texto enviado à API; na tela continua normal.
     - No perfil `narracao`: "UaiPertim" → "Uai Pértim", "Pertim"/"pertim" → "Pértim".
     - No perfil `pausas`: "UaiPertim" → "Uai Pérr-tim", "Pertim"/"pertim" → "Pérr-tim".
     - Nos dois: "WhatsApp" → "Uátsap", "UaiFood" → "Uai fúdi", "Burguer" → "Búrguer".
     - Uma grafia só de um capítulo vai no campo `"pronuncia"` do capítulo.
   - O `voz.py` recusa "de Glória": é sempre "do Glória"/"no Glória".
   - Se a API recusar a voz (não encontrada, sem permissão, chave inválida), o script **para e avisa**. A voz nunca é trocada.
9. **Mix.** −14 LUFS, pico real ≤ −1 dBTP. A trilha sintetizada é contínua, alegre (Dó 7M(9) → Lá m9 → Fá 7M(9) → Sol 6/9, 100 BPM), com ducking suave sob a voz. Os efeitos vêm da animação: a motinha, a buzina, a porta, o "boing" do "?", as lojinhas brotando, o carimbo, os itens caindo na sacola e o check.
10. **Formato e zonas seguras.**
    - 9:16, 1080×1920, 60 fps, **30–45 s**.
    - Conteúdo entre **x 80–940 e y 265–1456**. Nada em **x ≥ 940 entre y 1060 e 1560**: o motor recorta essa coluna, e a revisão confere caixa por caixa e pixel por pixel.
    - **Capa** = quadro 0: palavra-chave e cada linha do título com ≤ 72% da largura (778 px), conteúdo entre y 285–1635, bloco centrado no recorte 3:4.

## Fazer o próximo episódio (só pelo JSON)

1. Copie `episodios/explica-so-01.json` para `episodios/explica-so-02.json` e troque `id`, `titulo` e os `capitulos` (formato abaixo). Não mexa em código.
2. Confira o visual **sem gastar a API** (tempos estimados, sem voz; vai para `output/<id>/previa/`, fora do git):

```bash
cd reels/explica-so
scripts/episodio.sh explica-so-02 --previa
```

3. Gere o episódio de verdade:

```bash
scripts/episodio.sh explica-so-02              # voz (só os capítulos que faltam) → linha do tempo → vídeo → capa → revisão → storyboard
scripts/episodio.sh explica-so-02 --refaz 4    # gera de novo o capítulo 4 INTEIRO (outra seed) e refaz o resto
```

O comando roda, em ordem:

1. `voz.py`: uma geração inteira por capítulo.
2. `linha.py`: a linha do tempo, a narração montada sem cortes e o **mapa de tempos**. Ele confere: total de 30–45 s, cada apoio ≥ 1,5 s, fecho de 6–8 s e logo parada nos 3 últimos s. Se falhar, ajuste `segura`/`min` no JSON; nunca emende áudio.
3. `render.cjs cues`: os eventos de som tirados da animação.
4. `audio.py`: voz + trilha + efeitos, em −14 LUFS.
5. `render.cjs video`, `render.cjs capa` + `revisao_capa.py`, e `render.cjs info`.
6. `qa.py`: o `relatorio-tecnico.txt`, que precisa terminar em `RESULTADO: aprovado`.
7. `storyboard.py`.

Se alguma palavra `em` não estiver na fala, a revisão acusa ("toda palavra 'em' da cena está na fala") e a peça entra num tempo padrão.

### A chave da API

A chave do ElevenLabs fica **só em Segredos de rede**: a rede da nuvem põe o cabeçalho `xi-api-key` nas chamadas a `api.elevenlabs.io`. Fora da nuvem, exporte `ELEVENLABS_API_KEY` (ou `XI_API_KEY`) no terminal. Os scripts só leem a variável e nunca a imprimem, salvam ou registram. A chave nunca vai para chat, arquivo ou commit.

A narração gerada (`audio/<id>/voz/cap-NN.wav` + `falas.json`) fica no repositório, então o episódio pode ser refeito sem chamar a API. O `falas.json` guarda, por capítulo:

- o texto da tela e o texto enviado à API (com a grafia de pronúncia);
- a seed usada e o sha1 do áudio;
- o histórico de todas as gerações inteiras feitas, com ritmo, maior pausa e o motivo de cada recusa.

**Conferência automática da voz:** ritmo de 8–19 letras/s, nenhuma pausa interna > 0,9 s e fala não cortada no fim. Se falhar, o capítulo inteiro é gerado de novo com outra seed, até 4 vezes.

## Formato do JSON

```json
{
  "id": "explica-so-02",
  "titulo": "texto livre",
  "marca": "@uaipertim",
  "capitulos": [
    { "rotulo": "EXPLICA, SÔ! · EP. 02", "tom": "creme", "titulo": ["Faltou um", "trem?"],
      "fala": [{ "texto": "Faltou um trem em casa, sô?", "apoio": null }],
      "diagrama": { "tipo": "capa", "marcador": "trem", "pulo": { "em": "trem" } } },
    { "rotulo": "O CAUSO", "tom": "pessego", "titulo": ["Café passadim,", "mesa posta…"],
      "fala": [
        { "texto": "Café passadim, mesa posta… e cadê o queijo?", "apoio": "Cadê o *queijo*?" },
        { "texto": "E sair de casa agora? Uai, dá uma preguiça…", "apoio": "Sair de casa agora? *Preguiça*." }
      ],
      "diagrama": { "tipo": "mesa", "xicara": { "em": "Café" }, "prato": { "em": "mesa" }, "vazio": { "em": "queijo" }, "preguica": { "em": "preguiça" } },
      "inicio": 0.25, "segura": 0.45, "min": 0, "seed": 42 }
  ]
}
```

- **Os capítulos:** o **capítulo 0 é a capa** (cena `capa`), e o seu `rotulo` vira o chip da capa. Os capítulos 1… ganham os nós 01…. O último é sempre o `fecho`, com `"min": 7.5`.
- **`fala`:** as frases do capítulo, na ordem. O texto falado é a junção delas e vai **inteiro numa geração só**. Separe em frases para a linha de apoio entrar junto com o trecho certo.
- **`apoio`:** a linha de apoio que entra com a frase (`null` = nenhuma; igual à anterior = continua). Aceita `*marcador amarelo*` e `~coral~`.
- **`titulo`:** sempre 2 linhas (a 2ª em coral); o tamanho se ajusta à largura. Na capa, `marcador` é a palavra no marcador amarelo, e `pulo` faz a pontuação final ("?" ou "!") pular na palavra.
- **`tom`:** `creme`, `pessego`, `amarelo` ou `verde`.
- **Tempo do capítulo:**
  - `inicio` é a pausa antes da voz (padrão 0,25 s; capítulo 0: 0,10 s).
  - `segura` é o tempo depois da voz antes da troca (padrão 0,45 s).
  - `min` é a duração mínima.
  - `seed` é a seed da 1ª geração (padrão 42; cada nova geração do capítulo soma 1000).
- **`em` (dentro da cena):** a palavra da fala que dispara a peça.
  - `"queijo"` dispara na 1ª vez que a palavra aparece; `"queijo#2"`, na 2ª.
  - `"+1.2"` dispara 1,2 s depois do começo do capítulo; `"fim"`, perto do fim.
  - Vale a palavra como aparece na tela (`"UaiPertim"`), mesmo que a API receba outra grafia.

### Biblioteca de cenas

| `tipo` | Visual | Campos |
|---|---|---|
| `capa` | Chip, título grande com a palavra no marcador amarelo, a pontuação final que pula, a mesa com a xícara e o lugar vazio | `marcador`, `pulo: {em}` |
| `mesa` | Mesa com toalha xadrez; xícara de café com fumacinha; prato com talheres; lugar vazio tracejado com "?" pulsando; sofá com almofada, "z z z" e chinelos | `xicara: {em}`, `prato: {em}`, `vazio: {em}`, `preguica: {em}` |
| `praca` | Praça com gramado, árvores e coreto; lojinhas com olhinhos brotando do chão, com a placa do nome; linhas pontilhadas coral até a praça; selo coral de carimbo | `praca: {em}`, `lojas: [{tipo: padaria\|mercado\|farmacia\|loja, t, em, balao?: queijo\|pao\|doce}]` (até 3; com 2, ficam simétricas e o selo é carimbado na frente da praça; `balao` põe o item num balãozinho ao lado da lojinha), `linhas: {em}`, `selo: {t: [linha pequena, linha grande], em}` |
| `sacola` | Sacola de papel com a logo oficial; os itens aparecem, caem dentro e ficam saindo pela boca; os nomes em chips; check verde | `sacola: {em}`, `itens: [{tipo: queijo\|pao\|doce, t, em}]` (até 3), `check: {em}` |
| `entrega` | Rua com tracejado coral; a motinha entra e para na porta; a porta da casinha abre com luz; chips riscados em coral | `moto: {em}`, `porta: {em}`, `chips: [{t, icone: fila\|chuva\|chinelo, em}]` (2 + 1 por linha) |
| `fecho` | Título do capítulo, a logo oficial grande e fixa, chip coral com seta | `logo: {em}`, `chip: {t, em}` |
| `capaHistoria` | Capa no padrão do Dicionário: selo coral (o `rotulo`), a lojinha curiosa grande olhando para o título, título com a palavra no marcador amarelo e a pontuação que pula | `marcador`, `pulo: {em}`, `loja` (tipo da lojinha), `marca: false` (sem a marca no quadro 0) |
| `mensagens` | Casinha com relógio; balões de mensagem genéricos (creme ou verde da marca, sem logo de aplicativo) chegando um atrás do outro; "digitando…" piscando enquanto o relógio corre | `casa: {em}`, `msgs: [{lado: esq\|dir, t?, tipo?: cardapio\|digitando, em}]` (até 4) |
| `balcao` | Lojinha atrás do balcão, suando cada vez mais; UM balão grande e, ao lado, o contador que sobe (×1 → ×2 → ×5 → ×12 → ×30); o sol vira lua embaixo do contador | `loja: {em, tipo}`, `suor: {em}`, `balao: {t: [linha 1, linha 2], em}`, `contador: {n: [números], em: [palavras]}`, `sol: {em}` |
| `ideia` | Balões espalhados que estouram e a lâmpada que acende; lojinhas que descem e se arrumam lado a lado numa rua; check | `some: {em}`, `lojas: {em, tipos: [4 tipos]}`, `rua: {em}`, `check: {em}` |
| `nome` | Placa "UaiFood" com o carimbo, que vira "UaiPertim"; o mapinha de Minas em cima do "Uai"; lojinha e casinha que se aproximam até ficarem coladinhas | `placa`, `carimbo: {em, t}`, `vira`, `minas`, `casas: {em, loja}`, `perto` (todos com `em`) |
| `feito` | Calendário com as folhas virando até "3 MESES"; mapinha de Minas com o pin; selo verde. Com `parceiro`, a **logo do parceiro** (o arquivo, como está) num card branco ou num círculo, com ~43% da largura, entrando com pop e parada até a troca, e o calendário e o mapinha menores à esquerda. Sem `parceiro`, a lojinha do hambúrguer com o nome escrito | `calendario: {em, folhas: [[número, rótulo]…]}`, `vira`, `minas`, `selo: {em, t: [2 linhas]}` e `parceiro: {img, em, forma: card\|circulo, disco?: {cx, cy, r}}` (ou `loja` + `nome: {em, t}`) |

**Cena nova:** é um bloco `CENAS.<nome> = { setup(cap), draw(ctx, cap, t) }` em `src/anim.js`.

- No `setup`, resolva os tempos com `at(cap, "palavra")` e registre os sons com `cue(t, 'tipo')`.
- No `draw`, use as peças prontas: `shop` (lojinha com olhinhos; tipos `padaria`, `mercado`, `farmacia`, `loja`, `lanchonete`, `restaurante`), `balao`, `relogio`, `minas`, `lampada`, `coracao`, `gota`, `moto`, `casinha`, `coreto`, `arvore`, `selo`, `xicara`, `prato`, `sofa`, `chinelos`, os `ITENS`, `chip`, `check`, `marker`, `interrog`, `enter`/`pop`/`ent`.
- Marque as peças com `BOX(nome, …)` para a revisão.
- O resto vem sozinho: título, apoio, rota da entrega, câmera, marca, zonas seguras e caixas da revisão.

## Estrutura

```
episodios/<id>.json       roteiro (o único arquivo que muda entre episódios)
scripts/episodio.sh       o comando único (e --previa, sem voz)
scripts/voz.py            narração: voz oficial, uma geração inteira por capítulo (with-timestamps), pronounce(), conferida e com histórico
scripts/linha.py          linha do tempo + narração montada sem cortes + mapa de tempos (30–45 s, apoios, fecho, logo)
scripts/audio.py          voz + trilha contínua com ducking + efeitos → audio/<id>/mix.wav (−14 LUFS)
scripts/render.cjs        cues | info | capa | video | stills (Chromium headless, quadro a quadro; servidor na raiz do repo)
scripts/revisao_capa.py   regra das capas (recorte 3:4, play, contador, y 285–1635, palavra-chave ≤ 72%)
scripts/qa.py             revisão técnica → revisao/relatorio-tecnico.txt
scripts/storyboard.py     montagem + pronto, por capítulo
src/anim.js               motor (window.EXPLICA): rota da entrega, motinha, câmera, cabeçalho, apoio, cenas, marca
src/index.html            página de render e de prévia no navegador (?ep=<id>, com som; ?previa para os tempos estimados)
```

Para ver no navegador: na raiz do repositório, rode `npx http-server -p 8080` e abra `http://localhost:8080/reels/explica-so/src/index.html?ep=explica-so-01`. Acrescente `&previa` para ver antes de gerar a voz.

**Dependências:** Node com `playwright` (Chromium), `ffmpeg` e Python 3 com `numpy`, `scipy`, `pillow` e `soundfile` (usado por `audio/common.py`, que o `voz.py` importa para a pronúncia).
