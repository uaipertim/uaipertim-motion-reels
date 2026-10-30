# Reel "Pedir no UaiPertim é assim" (Instagram @uaipertim)

Primeiro Reel com o app por dentro, narrado pelo Pertim. Formato 9:16, 1080×1920 a 60 fps, com 39,70 s. Composição Remotion: `src/pedir-no-uaipertim/PedirNoUaiPertim.tsx` (efeitos em `efeitos.tsx`).

As telas, os recortes, as fotos e a logo vêm do pacote `telas-reel-uaipertim.zip` e do complemento `complemento-pagamento.zip` (Checkout-pix, Acompanhar-pix, opcao-pix, opcao-cartao, acompanhar-etapas-pix). As que o Reel usa estão em `public/pedir-no-uaipertim/`. Os LEIA-ME e os pontos (posição de cada recorte, em px de CSS × 3) estão em `fonte/`: `pontos.json` e `pontos-pagamento.json`, que vale por cima e traz também o "Pagar na entrega" e o "Fazer pedido" medidos no Checkout-pix.

## Roteiro (texto da tela e da legenda)

1. **Gancho:** a motinha entra freando de lado e para olhando para a câmera; "BATEU A FOME?" estoura.
   "Bateu aquela fome? Ó, pedir no UaiPertim é assim:"
2. **Início:** o celular entra girando (tela Main); as fotos das categorias saem voando como adesivos; toque em Lanches.
   "Abre, escolhe o que quer..."
3. **Loja e produto:** a capa do Burger do Glória dá zoom; a foto do Smash Duplo salta; o bacon marca com um pop; o "Adicionar" voa para dentro da sacola.
   "...monta o lanche do seu jeito. Com bacon, claro."
4. **Sacola e checkout (pagamento híbrido):** os 3 itens caem na sacola quicando e o total sobe até R$ 70,80. As três opções saltam do Checkout-pix uma por vez, cada uma na sua palavra (Pix → cartão → na entrega, com a nota e a maquininha). Em "preferir", um toque com ripple deixa o Pix marcado e as outras duas voltam. Depois vem o toque em "Fazer pedido" com confete.
   "Paga pelo app, no Pix ou no cartão, ou na entrega, do jeito que preferir."
5. **Acompanhar (Acompanhar-pix):** as etapas marcam uma por vez com "plim" (pagamento confirmado → loja aceitou e preparou → saiu para entrega); o Pertim cruza a tela de moto; carimbo "CHEGA ATÉ 20h35"; um balão "digitando…" some num puf.
   "Aí é só acompanhar: a loja aceita, prepara e sai pra entrega. Sem ficar esperando resposta no WhatsApp."
6. **Pão de Queijo Points:** chuva de pão de queijo; o saldo sobe de 130 para 150 com o "+20"; o cupom desliza.
   "E cada pedido ainda rende pão de queijo... em pontos!"
7. **Fecho:** a logo redonda com fundo transparente (`logo/logo-selo-transparente.png`, sombra redonda) + "Tá chegando no Glória" + chip "Segue @uaipertim"; o Pertim acena.
   "UaiPertim. Tá chegando no Glória!"

As trocas de cena são todas diferentes: giro, zoom, chicote, faixa, empurra e íris.

## Regras do Reel

- **Pagamento híbrido (pelo app ou na entrega):** aparecem as três formas, e nunca duas marcadas ao mesmo tempo. O recorte "Pagar na entrega" do pacote anterior vem marcado, então a composição põe por cima o contorno claro e o rádio vazio do Checkout-pix. O QA confere isso pelos pixels do vídeo.
- **Olhar na câmera:** o Pertim fala sempre olhando para a câmera, com as pupilas centradas em todos os quadros.
- **Boca:** sai dos visemas da voz (`scripts/personagem/fala.py`, a mesma do "Prazer, Pertim").
- **Selo "Imagens ilustrativas":** discreto, no vídeo todo. Fica no alto à esquerda, dentro da área segura e fora da coluna dos botões do Instagram.

## Voz e mixagem

A voz e a mixagem vêm do pipeline do Explica, Sô! (`reels/explica-so/episodios/pedir-no-uaipertim.json`).

- **Voz:** Victor Pinho, perfil "narracao" (eleven_v4). Cada fala é uma geração inteira.
- **Pronúncia:** "UaiPertim" vai para a voz como "UaiPértim" nas falas 1 e 7 (opção E do teste A/B em `teste-pronuncia/`, aprovada; campo `pronuncia` das falas no JSON do episódio). Na tela continua "UaiPertim".
- **Takes aprovados de ouvido:** a fala 1 e a fala 7 do vídeo são EXATAMENTE os arquivos aprovados no teste (`teste-pronuncia/f1-E-…mp3` e `f7-E-…mp3`), convertidos por `scripts/usar_aprovados.py` sem gerar a voz de novo. O alinhamento por letra vem por DTW (MFCC + energia) da geração anterior da mesma fala, guardada em `voz/ref-alinhamento-cap-XX.wav`. Em `falas.json` elas ficam com `"aprovado": true`, e `voz.py` nunca gera de novo uma fala aprovada, nem com `--refaz`. O QA confere o hash, o WAV igual ao MP3 decodificado e o envelope no MP4 final.
- **Regra:** depois que um áudio é aprovado de ouvido, ele não é gerado de novo. O vídeo usa o arquivo aprovado.
- **Trilha:** a animada (Tudo Pertim) com os efeitos de `cues.json`.
- **Volume:** −14 LUFS e pico real ≤ −1 dBTP.

A chave do ElevenLabs nunca fica no repositório.

## Como refazer

```bash
python3 reels/explica-so/scripts/voz.py pedir-no-uaipertim     # a voz (só as falas que faltam; usa a API; nunca as aprovadas)
python3 reels/pedir-no-uaipertim/scripts/usar_aprovados.py     # as falas 1 e 7 = os takes aprovados no teste (sem API)
python3 reels/explica-so/scripts/linha.py pedir-no-uaipertim   # as cenas e as palavras no tempo do vídeo
python3 reels/pedir-no-uaipertim/scripts/preparar.py           # dados/ (cena, visemas, legenda) + cues.json
python3 reels/explica-so/scripts/audio.py pedir-no-uaipertim   # mix.wav
node reels/pedir-no-uaipertim/scripts/render.mjs               # output/uaipertim-pedir-no-uaipertim.mp4
python3 reels/pedir-no-uaipertim/scripts/qa.py                 # output/revisao/relatorio-tecnico.txt
python3 reels/pedir-no-uaipertim/scripts/storyboard.py         # output/storyboard.png (--previa: antes do vídeo)
```

## Saída (`output/`)

- `uaipertim-pedir-no-uaipertim.mp4`: o Reel.
- `storyboard.png`: um quadro por cena.
- `revisao/relatorio-tecnico.txt`: o QA.
