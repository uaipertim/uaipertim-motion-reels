# Reel "Seja entregador parceiro" (Instagram @uaipertim · qua 25/11, 20h)

Chamada para o cadastro na rede de entregadores parceiros do UaiPertim, que estará ligada no lançamento. Narrado pelo
Pertim, na mesma linha visual e técnica do "Pão de Queijo Points".

- Formato 9:16, 1080×1920 a **30 fps**, com **38,00 s** (1140 quadros).
- Composição Remotion: `src/seja-entregador/SejaEntregador.tsx` (`SejaEntregador`); as ilustrações próprias ficam em
  `src/seja-entregador/Ilustracoes.tsx`.
- Roteiro: `roteiro.json`; posições: `layout.json`.

## Duração

O alvo pedido era 25 a 30 s, mas as 8 falas do roteiro dão cerca de 37 s de narração no ritmo dos outros Reels.
**Decisão de 2026-11-24:** o roteiro ficou inteiro. A voz deu 32,3 s de fala; com os cortes na batida e a logo parada
3,5 s no fim, o Reel ficou com **38,00 s** (`"limites": [30, 40]` no roteiro e no QA).

## Roteiro e cenas (todo corte numa batida)

Trilha animada do app, 120 BPM, no modo **grade** do `linha.py`, **no nível padrão** (sem `trilha_db`), como o "Olha ele
por dentro!" e o "Pão de Queijo Points". A trilha toca também no gancho e no fecho sem fala.

| # | cena | voz | o que acontece |
|---|---|---|---|
| 1 | gancho | "Tem moto, bike ou carro… e quer fazer uma renda extra aqui no Glória?" | a rua do Glória já montada no quadro 0 (casinhas, igrejinha, placa "São João Batista do Glória"): o Pertim na motinha à frente, olhando pra câmera; a bike e o carro entram em fila atrás; cada veículo ganha a plaquinha na sua palavra; "Renda extra?" com o marcador; a placa pula em "Glória" |
| 2 | chamada | "O UaiPertim tá chamando entregadores parceiros!" | a logo com as ondas do chamado; o cartaz "PROCURA-SE · Entregadores parceiros"; os três veículos |
| 3 | disponível | "Cê fica disponível na hora que quiser." | o cartão com o interruptor "Ficar disponível" (ilustração própria, não é tela do app) que liga em "disponível"; o relógio gira entre o sol e a lua |
| 4 | notificação | "A entrega chega no celular, com a loja, o bairro e o valor. Cê vê tudo antes de aceitar." | o celular e a notificação "Nova entrega disponível · Padaria do Centro · Bairro Centro · R$ 8,00"; cada linha acende na sua palavra; a lupinha passa em "vê"; o "Aceitar" pulsa; nota **"Valores ilustrativos"** embaixo |
| 5 | coleta | "Aceitou? Coleta na loja e leva até o cliente." | o toque em "Aceitar"; o Pertim pega a sacola no balcão da lojinha com toldo ("Coletei ✓"), sai na motinha até a casinha do cliente ("Entregue ✓") |
| 6 | acerto | "O acerto é direto com a loja, e fica tudo registrado no app." | as fichas "Loja" e "Entregador parceiro" ligadas pela seta do "acerto direto"; o registro "Tudo registrado" com o check. Sem cifrão voando e sem valor de ganho |
| 7 | cadastro | "O cadastro é feito pela nossa equipe, com conferência pessoal, pra todo mundo trabalhar com segurança." | a prancheta "Cadastro", a equipe (avatares sem rosto) e o selo verde "Cadastro conferido pessoalmente pela equipe", com o escudo que brilha em "segurança" |
| 8 | fecho | "Quer entrar pra rede? Chama a gente no Direct!" | o "?" e a rede (moto, bike e carro ligados ao pin); em "Chama": a logo redonda (sem fundo branco), "Tudo pertim de você.", o CTA grande "Chama no Direct" e o balão "@uaipertim"; o Pertim acena |

## Decisões

- **Pertim (rig 2D atual, V1)** sempre olhando para a câmera (`olhar: [0, 0], centro: true`), nunca bravo; a boca vem dos
  visemas da voz. Na rua do gancho e na coleta ele está dentro da cena (poses `moto`, `parado` e `sacola`); nas cenas
  2, 3, 4, 6 e 7 fica no canto de baixo à esquerda; no fecho acena.
- **Lojas e valores fictícios:** "Padaria do Centro", "Bairro Centro", "R$ 8,00", com a nota "Valores ilustrativos".
- **Sem promessa** de valor de ganho, quantidade de entregas ou "renda garantida"; sem CPF, CNH ou documentos (só
  "conferência pessoal"); sempre "entrega", nunca "frete"; sem "aguarde". O QA confere tudo isso.
- **Legenda gravada no estilo LegendaPop** (`dados/legenda.json`), a mesma do "Pão de Queijo Points": faixa **x 110–906**,
  y 1400–1548; palavras-chave em amarelo/laranja (`"chaves"` no roteiro). Blocos de até 4 palavras; quando um bloco não
  cabe em 2 linhas ("entregadores parceiros!"), o `preparar.py` procura outra divisão em que todos caibam. "Aceitou?"
  fica num bloco sozinho.

## Voz

- **Voz:** Victor Pinho (`LuQ9eaWO9yCQrR73VQFa`), perfil `narracao` (eleven_v4). Cada fala é uma geração inteira.
- **Pronúncia:** "UaiPertim" vai para a voz como "Uai pertím" (`pronuncia` no topo do roteiro); na tela, "UaiPertim".
  "o Glória" no masculino.
- **Perguntas de sim/não (falas 1 e 8, `"pergunta": true`):** pela regra das tomadas, o F0 sobe ≥ +8 st da palavra
  anterior até o pico na última palavra da pergunta (a tônica: "GLÓ-ria", "RE-de"). As tomadas ficam em
  `tomadas/cap-00` e `tomadas/cap-07`; a escolha e as medidas estão no relatório técnico e em `output/revisao/f0-cena-*.png`.

## Capa

`CapaReel-seja-entregador` (`src/covers/capasReels.ts`), no padrão da grade: selo em pílula "ENTREGADOR PARCEIRO", fundo
creme com raios, ilustração do Pertim na motinha com a sacola na garupa, acenando; título "Bora *entregar* / com o
Pertim?" com "entregar" em coral no marcador amarelo; `margem: 135` (todo o conteúdo em x 135–945, medido sem o fundo pelo QA).

## Como refazer

```bash
python3 reels/explica-so/scripts/voz.py seja-entregador                              # a voz (usa a API)
python3 scripts/tomadas.py seja-entregador 0 --seeds 42,1042,2042,3042               # tomadas das perguntas (medem a subida)
python3 scripts/tomadas.py seja-entregador 7 --seeds 42,1042,2042,3042
python3 scripts/tomadas.py seja-entregador 0 --usar <L>                              # (e 7 --usar <L>)
python3 reels/explica-so/scripts/linha.py seja-entregador                            # as cenas na grade de batidas
python3 reels/seja-entregador/scripts/preparar.py                                    # dados/ (cena, visemas, legenda) + cues.json
python3 reels/explica-so/scripts/audio.py seja-entregador                            # mix.wav (trilha no nível padrão)
node reels/seja-entregador/scripts/render.mjs                                        # output/uaipertim-seja-entregador-parceiro.mp4
node reels/seja-entregador/scripts/render.mjs capa                                   # output/capa.png + capa-3x4.png
node reels/seja-entregador/scripts/render.mjs mascara                                # máscaras do QA (fora do git)
python3 reels/seja-entregador/scripts/qa.py                                          # output/revisao/relatorio-tecnico.txt
```

Sem a voz, `linha.py seja-entregador --previa` + `preparar.py --previa` + `audio.py seja-entregador --previa` montam a
prévia com tempos estimados (`render.mjs` grava então `…_previa.mp4`, fora do git). `render.mjs prancha <png> <seg> …`
monta uma prancha de quadros para revisar.

A chave do ElevenLabs nunca fica no repositório: o proxy da rede a injeta no cabeçalho `xi-api-key`.

## Saída (`output/`)

- `uaipertim-seja-entregador-parceiro.mp4`: o Reel (H.264 yuv420p, 1080×1920, 30 fps, AAC 48 kHz estéreo).
- `capa.png` (9:16) e `capa-3x4.png` (o recorte da grade, y 240–1680).
- `legenda.txt`: a legenda do post e a sugestão de comentário fixado.
- `revisao/relatorio-tecnico.txt` (`RESULTADO: aprovado`; inclui o nível da trilha comparado com o do "Olha ele por dentro!") e os gráficos de F0.
