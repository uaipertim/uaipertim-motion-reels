# Série EXPLICA, SÔ! — vídeos explicativos do @uaipertim em capítulos (30–45 s)

Vídeos curtos que explicam uma coisa do dia a dia em capítulos, com a cara da UaiPertim. O motor é o da Série Explica (FAZLO Hospeda), adaptado à marca. É um **modelo reutilizável**: cada episódio é só um JSON (`episodios/<id>.json`) e um comando.

| Episódio | Tema | Capítulos | Saída |
|---|---|---|---|
| **explica-so-01** | "Faltou um trem?" | 00 capa · 01 o causo · 02 o Glória tem · 03 a sacola · 04 chegou · 05 fecho | `output/explica-so-01/` (gerado quando a voz estiver liberada; ver "Estado") |

Em cada episódio, `output/<id>/` traz:

- **Vídeo:** `uaipertim-<id>.mp4` (1080×1920, 60 fps, H.264 + AAC 48 kHz).
- **Capa:** `capa.jpg` e `capa.png`. A capa é o quadro 0 do vídeo.
- **Storyboard:** `storyboard.jpg`, com 1 quadro do meio da montagem e 1 do capítulo pronto, por capítulo.
- **Revisão:** a pasta `revisao/` traz `relatorio-tecnico.txt` (termina em `RESULTADO: aprovado` ou lista o que falhou), `zonas-seguras.jpg`, `capa-no-feed.jpg`, `capa.txt` e `motor.json`.

## Estado do explica-so-01

O motor, as cenas e o roteiro estão prontos e conferidos numa **prévia sem voz** (`--previa`, abaixo). A narração ainda não foi gerada: em 22/10/2026 a API do ElevenLabs recusou a chave dos Segredos de rede (`HTTP 401 invalid_api_key`, inclusive em `/v1/user`). Como manda a regra, o `voz.py` parou e a voz não foi trocada. Depois de corrigir a chave, rode `scripts/episodio.sh explica-so-01`.

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
   - Título "Em breve / no Glória".
   - A **logo oficial grande** entra com mola e para. Ela fica **parada e visível nos 3 últimos segundos** (o motor nunca a deixa entrar depois de fim − 3,9 s).
   - Chip coral "Segue @uaipertim", com uma seta desenhada.
   - Todo texto do fecho fica **≥ 3 s parado** antes do fim.
8. **Voz oficial da UaiPertim** (`audio/voz_oficial.json`).
   - Victor Pinho, `LuQ9eaWO9yCQrR73VQFa`, `eleven_multilingual_v2`: estabilidade 0,40 · semelhança 0,80 · estilo 0,35 · speaker boost · seed 42 como ponto de partida.
   - **Cada capítulo é UMA geração inteira** (endpoint `with-timestamps`, todas as frases numa chamada). Se uma frase sair ruim, o capítulo inteiro é gerado de novo com outra seed (`--refaz N`, seed + 1000). Nunca se emendam palavras ou trechos.
   - **Pronúncia:** vale a regra de `audio/elevenlabs.py → pronounce()`, só no texto enviado à API: "UaiPertim" → "Uai Pérr-tim", "Pertim"/"pertim" → "Pérr-tim". Na tela continua normal.
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
| `praca` | Praça com gramado, árvores e coreto; lojinhas com olhinhos brotando do chão, com a placa do nome; linhas pontilhadas coral até a praça; selo coral de carimbo | `praca: {em}`, `lojas: [{tipo: padaria\|mercado\|farmacia\|loja, t, em}]` (até 3), `linhas: {em}`, `selo: {t: [linha pequena, linha grande], em}` |
| `sacola` | Sacola de papel com a logo oficial; os itens aparecem, caem dentro e ficam saindo pela boca; os nomes em chips; check verde | `sacola: {em}`, `itens: [{tipo: queijo\|pao\|doce, t, em}]` (até 3), `check: {em}` |
| `entrega` | Rua com tracejado coral; a motinha entra e para na porta; a porta da casinha abre com luz; chips riscados em coral | `moto: {em}`, `porta: {em}`, `chips: [{t, icone: fila\|chuva\|chinelo, em}]` (2 + 1 por linha) |
| `fecho` | Título do capítulo, a logo oficial grande e fixa, chip coral com seta | `logo: {em}`, `chip: {t, em}` |

**Cena nova:** é um bloco `CENAS.<nome> = { setup(cap), draw(ctx, cap, t) }` em `src/anim.js`.

- No `setup`, resolva os tempos com `at(cap, "palavra")` e registre os sons com `cue(t, 'tipo')`.
- No `draw`, use as peças prontas: `shop` (lojinha com olhinhos), `moto`, `casinha`, `coreto`, `arvore`, `selo`, `xicara`, `prato`, `sofa`, `chinelos`, os `ITENS`, `chip`, `check`, `marker`, `interrog`, `enter`/`pop`/`ent`.
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
