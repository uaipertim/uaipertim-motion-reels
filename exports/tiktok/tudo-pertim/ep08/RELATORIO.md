# Tudo Pertim EP.08 — "Que calor, sô!"

TikTok + Instagram (Semana UaiPertim: terça, 17/11, 20h).

## Entregas

| Arquivo | O que é |
|---|---|
| `tudo-pertim-08.mp4` | o vídeo final: 1080×1920, 60 fps, H.264 + AAC 48 kHz, **50,25 s**, −14,0 LUFS, pico real −1,6 dBTP |
| `capa-3x4.jpg` | a capa para o Instagram (1080×1440, recorte 3:4 do quadro 0, como no EP.07) |
| `capa.png` | o quadro 0 (a capa do TikTok) |
| `tudo-pertim-08-voz.mp4` | o mesmo vídeo, só com a voz |
| `storyboard.jpg`, `zonas-seguras.jpg` | montagem/pronto por capítulo e a revisão das zonas seguras |

Revisão técnica (`reels/tudo-pertim/output/tudo-pertim-08/revisao/relatorio-tecnico.txt`): **RESULTADO: aprovado**. Capa: dentro da regra das capas (palavra-chave "calor" 36%, linhas do título 70% e 41%, bloco centrado no recorte 3:4).

## Duração por capítulo

| Cap. | Título | Tempo | Duração |
|---|---|---|---|
| 00 | Que calor, sô! 🥵 (capa) | 0,00–3,50 s | 3,50 s |
| 01 | Tá quente demais. | 4,25–9,75 s | 5,50 s |
| 02 | O açaí salva! | 10,50–16,25 s | 5,75 s |
| 03 | E pra refrescar? | 17,00–22,50 s | 5,50 s |
| 04 | Faltou o gelo? | 23,25–28,75 s | 5,50 s |
| 05 | Chegou ainda gelado! (Pertim) | 29,50–35,00 s | 5,50 s |
| 06 | No calor, é o quê? | 35,75–42,00 s | 6,25 s |
| 07 | Em breve no Glória. (fecho) | 42,75–50,25 s | 7,50 s |

Trocas de 0,75 s (o picolé). A logo oficial do fecho fica parada nos últimos 3,68 s.

## Voz

Victor Pinho, `eleven_v4` (stability 0,50, similarity 0,75). Uma geração inteira por capítulo; nada emendado.

| Cap. | Tomada | Seed |
|---|---|---|
| 00 | **f** (de 9 tomadas, a–i) | 5042 |
| 01–05, 07 | 1ª geração | 42 |
| 06 | **a** (de 3 tomadas) | 42 |

### Medição da subida das perguntas (`scripts/tomadas.py`, F0 pelo Praat)

"sobe" = fim × começo do último trecho vozeado da frase; "termina" = fim × mediana do tom da fala inteira, em semitons. Pergunta = termina **acima** da mediana.

**Cap. 06 — "Açaí? Sorvete? Ou picolé?"**: a tomada **a** passa, com as três subindo:

| Opção | sobe | termina |
|---|---|---|
| Açaí? | +16,9 st | **+8,9 st** |
| Sorvete? | +8,7 st | **+8,7 st** |
| Ou picolé? | +6,1 st | **+10,6 st** |

(as tomadas b e c também passaram; a **a** é a de maior subida.)

**Cap. 00 — o gancho "Tá derretendo aí também?"**: **pelo critério estrito ("termina acima da mediana"), nenhuma das 9 tomadas passou.**

| Tomada | Seed | Contexto | sobe | termina |
|---|---|---|---|---|
| a | 42 | com next | −5,9 | −0,7 |
| b | 1042 | com next | −11,8 | −6,6 |
| c | 2042 | com next | 0,0 | −4,4 |
| d | 3042 | sem next | −14,0 | −3,7 |
| e | 4042 | sem next | +1,6 | 0,0 |
| **f (instalada)** | 5042 | sem next | **+4,4** | **−0,4** |
| g | 6042 | sem next | −8,5 | −2,1 |
| h | 7042 | sem next | −12,5 | −6,1 |
| i | 8042 | sem next | +6,7 | −1,4 |

O contorno de perto (F0 a cada 10 ms, relativo à mediana) mostra o desenho de pergunta no "também": o "tam" grave e o "BÉM" bem agudo. Na **f**, o tom vai de −8,2 st no "tam" até **+12,5 st** no "bém" (subida de ~21 st). O que deixa o "termina" em −0,4 st é só a queda dos últimos ~80 ms da sílaba, um tique abaixo da mediana. As tomadas a, c, e e i têm o mesmo desenho (pico de +6,8 a +9,6 st no "bém").

**O texto não foi trocado.** Se você quiser que o gancho passe também no critério estrito, estas são as opções de fala (só o texto falado muda; a tela continua "Que calor, sô! 🥵"):

1. "Que calor, sô! Tá derretendo aí também, é?"
2. "Que calor, sô! Cê também tá derretendo?"
3. "Que calor, sô! Tá derretendo aí, né?"

É só me dizer qual, que eu gero as tomadas, meço e refaço o capítulo 00.

### "Uai pertím" do fecho

Enviado à API: "Que calor, sô! Relaxa, tem **Uai pertím**. Tudo **pertím** de você. Segue a gente!" (na tela e na legenda continua "UaiPertim"). Eu não consigo ouvir o áudio, então medi a sílaba tônica no próprio áudio: no "Uai pertím", o "tím" sai **10 dB mais forte** que o "per" (70,2 × 59,8 dB) e bem mais longo. É a força no final (per-TÍM), o padrão do v4. **Ainda falta a conferência de ouvido**: o "Uai pertím" fica em **45,7 s** do `tudo-pertim-08-voz.mp4`.

## O que é novo no motor

- **Transição `"picole"`**: um picolé com olhinhos atravessa a tela e, por onde passa, a tela derrete. A calda escorre com dedos e gotas pingando, cobre o capítulo e escorre para fora, abrindo a cena seguinte. O sabor muda a cada troca (morango, manga, limão, coco), e o jeito também (reto, aos pulinhos, balançando, pirueta). Som: vento, a calda escorrendo e os "plic".
- **Capa `"cena": "sol"`**: o sol de rachar com cara de cansado (língua de fora, suando), o termômetro estourando e o chão rachado.
- **Cenas** `calorao`, `acai`, `freezer`, `gelo` e `entregaGelada`. Itens novos no mesmo estilo: sol, termômetro, ventilador, forminha de gelo, copo de açaí, picolé, pote de sorvete, coco, saco de gelo, garrafas suando, caixa térmica (com a logo oficial, o arquivo), a gota, as ondas de calor, a névoa e o floquinho.
- **O Pertim falando**: quadros novos com as 4 bocas de fala, saídos do próprio componente oficial (nada redesenhado). A boca de cada quadro sai do alinhamento da voz + o envelope do áudio (`"boca": true` → `linha.py`). No CHEGOU, a boca dele troca 19 vezes durante a fala.
- Sem nomes de lojas reais e sem preços; sempre "do Glória"/"no Glória". A chave do ElevenLabs não aparece em nenhum arquivo, log ou commit.
