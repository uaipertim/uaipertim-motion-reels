# Reel "Pedir no UaiPertim é assim" (Instagram @uaipertim)

Primeiro Reel com o app por dentro, narrado pelo Pertim. Formato 9:16, 1080×1920 a 60 fps, com 39,37 s. Composição Remotion: `src/pedir-no-uaipertim/PedirNoUaiPertim.tsx` (efeitos em `efeitos.tsx`).

As telas, os recortes, as fotos e a logo vêm do pacote `telas-reel-uaipertim.zip`. As que o Reel usa estão em `public/pedir-no-uaipertim/`. O LEIA-ME e o `pontos.json` (posição de cada recorte, em px de CSS × 3) estão em `fonte/`.

## Roteiro (texto da tela e da legenda)

1. **Gancho:** a motinha entra freando de lado e para olhando para a câmera; "BATEU A FOME?" estoura.
   "Bateu aquela fome? Ó, pedir no UaiPertim é assim:"
2. **Início:** o celular entra girando (tela Main); as fotos das categorias saem voando como adesivos; toque em Lanches.
   "Abre, escolhe o que quer..."
3. **Loja e produto:** a capa do Burger do Glória dá zoom; a foto do Smash Duplo salta; o bacon marca com um pop; o "Adicionar" voa para dentro da sacola.
   "...monta o lanche do seu jeito. Com bacon, claro."
4. **Sacola e checkout:** os 3 itens caem na sacola quicando e o total sobe até R$ 70,80; toque com ripple em "Pagar na entrega" (com a nota e a maquininha); toque em "Fazer pedido" com confete.
   "Paga na entrega, no dinheiro ou na maquininha."
5. **Acompanhar:** as etapas marcam uma por vez ("plim"); o Pertim cruza a tela de moto; carimbo "CHEGA ATÉ 20h35"; um balão "digitando…" some num puf.
   "Aí é só acompanhar: a loja aceita, prepara e sai pra entrega. Sem ficar esperando resposta no WhatsApp."
6. **Pão de Queijo Points:** chuva de pão de queijo; o saldo sobe de 130 para 150 com o "+20"; o cupom desliza.
   "E cada pedido ainda rende pão de queijo... em pontos!"
7. **Fecho:** a logo (selo) + "Tá chegando no Glória" + chip "Segue @uaipertim"; o Pertim acena.
   "UaiPertim. Tá chegando no Glória!"

As trocas de cena são todas diferentes: giro, zoom, chicote, faixa, empurra e íris.

## Regras do Reel

- **Pagamento só "Pagar na entrega".** A PNG do Checkout tem Pix e Cartão de crédito em y 1090–1580. A tela do celular nunca mostra essa faixa: a rolagem do Checkout começa em 531 px de CSS (`layout.json` → `proibido`). O QA confere isso quadro a quadro.
- **Olhar na câmera:** o Pertim fala sempre olhando para a câmera, com as pupilas centradas em todos os quadros.
- **Boca:** sai dos visemas da voz (`scripts/personagem/fala.py`, a mesma do "Prazer, Pertim").
- **Selo "Imagens ilustrativas":** discreto, no vídeo todo. Fica no alto à esquerda, dentro da área segura e fora da coluna dos botões do Instagram.

## Voz e mixagem

A voz e a mixagem vêm do pipeline do Explica, Sô! (`reels/explica-so/episodios/pedir-no-uaipertim.json`).

- **Voz:** Victor Pinho, perfil "narracao" (eleven_v4). Cada fala é uma geração inteira, e "UaiPertim"/"Pertim" vão sem troca de grafia.
- **Trilha:** a animada (Tudo Pertim) com os efeitos de `cues.json`.
- **Volume:** −14 LUFS e pico real ≤ −1 dBTP.

A chave do ElevenLabs nunca fica no repositório.

## Como refazer

```bash
python3 reels/explica-so/scripts/voz.py pedir-no-uaipertim     # a voz (só as falas que faltam; usa a API)
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
