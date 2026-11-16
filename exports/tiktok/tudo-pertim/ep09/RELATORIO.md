# Tudo Pertim EP.09 — "Amanhã é feriado… quem vai cozinhar?"

TikTok + Instagram (Semana UaiPertim: quinta, 19/11, 20h; véspera do feriado de sexta, 20/11).

## Entregas

| Arquivo | O que é |
|---|---|
| `tudo-pertim-09.mp4` | o vídeo final **com a legenda gravada**: 1080×1920, 60 fps, H.264 + AAC 48 kHz, **50,0 s**, −14,0 LUFS, pico real −1,4 dBTP |
| `capa-3x4.jpg` | a capa para o Instagram (1080×1440, recorte 3:4 do quadro 0, como no EP.08) |
| `capa.png` | o quadro 0 (a capa do TikTok); sem legenda |
| `tudo-pertim-09-voz.mp4` | o mesmo vídeo, só com a voz |
| `storyboard.jpg`, `zonas-seguras.jpg` | montagem/pronto por capítulo e a revisão das zonas seguras (com a faixa da legenda) |

Revisão técnica (`reels/tudo-pertim/output/tudo-pertim-09/revisao/relatorio-tecnico.txt`): **RESULTADO: aprovado**, inclusive a seção da legenda. Capa: dentro da regra das capas (palavra-chave "feriado" 47%, linhas do título 68% e 70%, bloco centrado no recorte 3:4).

## Duração por capítulo

| Cap. | Título | Tempo | Duração |
|---|---|---|---|
| 00 | Amanhã é feriado! 🎉 (capa) | 0,00–3,50 s | 3,50 s |
| 01 | Ninguém quer cozinhar. | 4,25–9,75 s | 5,50 s |
| 02 | Café da manhã? | 10,50–16,00 s | 5,50 s |
| 03 | E o almoço? | 16,75–22,25 s | 5,50 s |
| 04 | Faltou algo do mercado? | 23,00–28,50 s | 5,50 s |
| 05 | Chegou e ninguém saiu de casa! (Pertim) | 29,25–34,75 s | 5,50 s |
| 06 | Feriado é dia de quê? | 35,50–41,75 s | 6,25 s |
| 07 | Em breve no Glória. (fecho) | 42,50–50,00 s | 7,50 s |

Trocas de 0,75 s (a folha de calendário). A logo oficial do fecho fica parada nos últimos 3,77 s.

## Voz

Victor Pinho, `eleven_v4` (stability 0,50, similarity 0,75), "Uai pertím" no texto enviado à voz. Uma geração inteira por capítulo; nada emendado.

| Cap. | Tomada | Seed | Fala gravada |
|---|---|---|---|
| 00 | **h** (de 9: a–f com o texto original, g–i com o novo) | 1042 | "Amanhã é feriado… e cê vai cozinhar?" |
| 01–05, 07 | 1ª geração | 42 | o texto do roteiro |
| 06 | **n** (de 15: a–l com as falas longas, m–r nos testes das variantes) | 1042 | "Comenta aí: feriado é dia de quê? Dormir? Churrasco? Maratonar?" |

### As duas falas que mudaram (escolhidas por você)

- **Cap. 00:** o original "…e quem vai cozinhar?" caiu no fim em 6 de 6 tomadas, entre −7,7 e −16,6 st abaixo da mediana (pergunta com "quem" tende a cair). Você escolheu **"…e cê vai cozinhar?"**.
- **Cap. 06:** o original "…Dormir até tarde? Churrasco? Ou maratonar série?" não passou em 6 tomadas. Você escolheu tirar o "Ou", e mesmo assim não passou em mais 6. O contorno do tom mostra o motivo: "TAR-de" e "SÉ-rie" sobem na sílaba tônica (de −9 até +4 st) e caem na sílaba seguinte, e a régua mede o fim da palavra. Testei, sem instalar, as opções curtas (oxítonas) e o "É" do EP.07. As curtas passaram e o "É" não. Você deixou a escolha comigo: fiquei com **"Dormir? Churrasco? Maratonar?"** na fala e na legenda. **Os balões da enquete continuam completos** ("dormir até tarde", "churrasco", "maratonar série").

### Medição da subida das perguntas (`scripts/tomadas.py`, F0 pelo Praat)

"sobe" = fim × começo do último trecho vozeado da frase; "termina" = fim × mediana do tom da fala inteira, em semitons. Pergunta = termina **acima** da mediana.

**Cap. 00 — o gancho**

| Tomada | Seed | Fala | sobe | termina |
|---|---|---|---|---|
| a–c | 42, 1042, 2042 | "…e quem vai cozinhar?" | −22,9 / −18,8 / −22,3 | −14,8 / −14,1 / −16,6 |
| d–f (sem next) | 3042, 4042, 5042 | "…e quem vai cozinhar?" | +4,5 / −20,9 / −13,9 | −7,9 / −15,9 / −7,7 |
| g | 42 | "…e cê vai cozinhar?" | −12,1 | −1,8 |
| **h (instalada)** | 1042 | "…e cê vai cozinhar?" | −3,0 | **+9,8** |
| i | 2042 | "…e cê vai cozinhar?" | −2,3 | **+8,0** |

**Cap. 06 — as três opções da enquete** (termina, em st: 1ª / 2ª / 3ª opção)

| Tomadas | Fala | Resultado |
|---|---|---|
| a–f | "Dormir até tarde? Churrasco? Ou maratonar série?" | nenhuma com as três acima (a melhor, c: −4,0 / +8,7 / −2,2) |
| g–l | "Dormir até tarde? Churrasco? Maratonar série?" | nenhuma (a melhor, j: −5,6 / +6,2 / −1,7) |
| p–r (teste) | "É dormir até tarde? Churrasco? Maratonar série?" | nenhuma (a melhor, q: −1,7 / +7,5 / −9,9) |
| m (teste) | "Dormir? Churrasco? Maratonar?" | +8,5 / −10,9 / +6,7 |
| **n (instalada)** | "Dormir? Churrasco? Maratonar?" | **Dormir? +4,6 · Churrasco? +5,4 · Maratonar? +4,4** (sobe +12,7 / +2,9 / +1,3) |
| o (teste) | "Dormir? Churrasco? Maratonar?" | +4,1 / +5,2 / +5,2 (também passa) |

Os mp3 de todas as tomadas estão em `reels/tudo-pertim/output/tudo-pertim-09/revisao/`: `gancho-*`, `sua-vez-*` e os testes `teste-curtas-*` (a instalada é `teste-curtas-n.mp3`) e `teste-e-*`.

### "Uai pertím" do fecho

Enviado à voz: "Bom feriado, sô! Relaxa, tem **Uai pertím**. Tudo **pertím** de você. Segue a gente!" (na tela e na legenda continua "UaiPertim"). Não consigo ouvir o áudio, então medi no próprio áudio: no "Uai pertím", o "tím" sai **4,3 dB mais forte** que o "per" (70,0 × 65,7 dB) e bem mais longo (0,53 × 0,15 s). É a força no final (per-TÍM), o padrão do v4. **Falta a conferência de ouvido**: o "Uai pertím" fica em **45,3 s** do `tudo-pertim-09-voz.mp4`.

## Legenda

Padrão do motor desde o EP.08: pílula tinta 85%, Poppins 800, texto creme e palavra-chave amarela, na faixa x 90–930, y 1470–1600. O texto segue a fala na grafia da tela, no tempo das tomadas instaladas (nenhuma chamada extra à API). **No cap. 06, o apoio passou a ser "*Comenta* aí: qual é o seu?"**, e o "Comenta" (falado) fica amarelo na legenda.

| Cap. | Tempo | Bloco |
|---|---|---|
| 00 | 0,12–1,78 s | Amanhã é feriado… |
| 00 | 1,78–3,45 s | e cê vai cozinhar? |
| 01 | 4,52–5,87 s | Todo mundo em casa, |
| 01 | 5,87–7,33 s | a pia limpinha… |
| 01 | 7,33–9,70 s | e ninguém quer / encostar no **fogão**. |
| 02 | 10,77–12,43 s | Pão francês quentinho |
| 02 | 12,43–13,48 s | e pão de queijo |
| 02 | 13,48–15,59 s | da **padaria** do Glória. |
| 03 | 17,02–18,97 s | Marmitex **caprichada** ou |
| 03 | 18,97–21,20 s | aquela porção pra dividir. |
| 04 | 23,27–25,22 s | Esqueceu o refri e o carvão? |
| 04 | 25,22–26,97 s | O mercadim **manda**. |
| 05 | 29,52–31,53 s | Chegou tudo pertim… |
| 05 | 31,53–34,26 s | e ninguém precisou sair da **rede**. |
| 06 | 35,77–37,37 s | **Comenta** aí: feriado |
| 06 | 37,37–38,45 s | é dia de quê? |
| 06 | 38,45–41,63 s | Dormir? Churrasco? Maratonar? |
| 07 | 42,77–44,37 s | Bom feriado, sô! |
| 07 | 44,37–46,95 s | Relaxa, tem UaiPertim. |

Como no EP.08, a legenda do fecho some antes dos 3 s finais. "Tudo pertim de você. Segue a gente!" fica de fora da legenda, mas já está na tela (assinatura e chip).

Ajuste no motor feito neste episódio: antes, quando uma oração curta não cabia junto com a vizinha em 6 palavras, a junção parava ali, e o cap. 06 saía com blocos de 1 e 2 palavras (a revisão pegou). Agora a oração curta sempre junta com a vizinha e o bloco é dividido em 3 a 6 palavras, de preferência depois da pontuação. A legenda do EP.08 continua idêntica (conferido).

## O que é novo no motor

- **Transição `"calendario"`**: uma folha de calendário de bloquinho gigante cai do alto e cobre o capítulo. A 1ª folha traz o **"20 · FERIADO"** em destaque (o 20 circulado, com confete); as outras, o 20 com uma figurinha. Aí a folha é **arrancada**: a beira rasga em zigue-zague, aparece o "RASG!" e ela sai voando e girando, revelando a cena seguinte. Cada troca arranca de um jeito, em ciclo de 4: pelo canto, voando para a esquerda; pendurada por um canto, balança e cai; puxada para cima, girando; amassada numa bolinha e jogada fora. A folha sempre sai pela esquerda ou por cima, nunca pela coluna de botões nem por cima da marca. Som: o vento da queda, o "plof", o rasgo do papel e o farfalhar.
- **Capa `"cena": "feriado"`**: o calendário de novembro com o 20 circulado, o confete e a rede de descanso armada.
- **Cenas** `semFogao` (família no sofá, pia limpinha brilhando, fogão com teia de brincadeira e a aranhinha descendo) e `entregaRede` (o Pertim entrega a sacola da marca para quem está deitado na rede, que nem levanta: só tira o braço, pega a sacola e faz joia).
- **Itens novos no mesmo estilo**: calendário do mês, rede, teia e aranhinha, pia, pão francês, marmitex, porção (batata e calabresa com palitinhos), saco de carvão cheio, a sacola da marca como peça, e a lojinha de comida caseira (`caseira`).
- **O Pertim falando com a sacola**: quadros novos `sacola-boca-*` (as 4 bocas, do próprio componente oficial). No CHEGOU ele fala na moto, depois com a sacola e depois em pé; a boca troca 22 vezes. A piscadinha vem depois da fala.
- O `tomadas.py` agora aceita mais de 12 tomadas por capítulo (letras a–z).
- Sem nomes de lojas reais e sem preços; o feriado não é nomeado; sempre "do Glória"/"no Glória". A chave do ElevenLabs não aparece em nenhum arquivo, log ou commit.
