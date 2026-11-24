#!/usr/bin/env python3
"""
A tela do painel do lojista SEM o botão "Recusar" (o painel não tem mais esse botão): nos dois cartões da coluna "Novos" da
public/telas-app/painel/Lojista.png fica só o "Aceitar", vermelho, em largura total.

    python3 scripts/painel_so_aceitar.py    -> public/telas-app/painel/Lojista-so-aceitar.png

Nada é redesenhado à mão: o botão novo é feito dos pixels do "Aceitar" original (os cantos arredondados, a cor e o texto),
esticado só no miolo liso; o lugar do "Recusar" vira o branco do cartão. Coordenadas em px do PNG (2×).
"""
from pathlib import Path
import numpy as np
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
SRC = RAIZ / "public/telas-app/painel/Lojista.png"
DST = RAIZ / "public/telas-app/painel/Lojista-so-aceitar.png"
RECUSAR_X0, ACEITAR = 530, (828, 704, 1112, 784)        # cartão 1; o cartão 2 fica 382 px abaixo
CAPS = 34                                                # os cantos arredondados que ficam como estão

im = Image.open(SRC).convert("RGB")
for dy in (0, 382):
    x0, y0, x1, y1 = ACEITAR[0], ACEITAR[1] + dy, ACEITAR[2], ACEITAR[3] + dy
    bt = np.asarray(im.crop((x0, y0 - 1, x1 + 1, y1 + 1))).copy()          # o botão com 1 px de folga (o anti-aliasing)
    h, w = bt.shape[:2]
    # o texto "Aceitar": os pixels claros dentro do miolo
    claro = (bt.astype(int).sum(2) > 500)
    claro[:, :CAPS] = claro[:, w - CAPS:] = False
    xs = np.nonzero(claro.any(0))[0]
    tx0, tx1 = xs.min() - 6, xs.max() + 7
    texto = bt[:, tx0:tx1]
    # o botão novo: canto esquerdo + miolo liso + canto direito, na largura de Recusar + Aceitar
    W = x1 + 1 - RECUSAR_X0
    novo = np.empty((h, W, 3), np.uint8)
    novo[:] = bt[:, CAPS + 2][:, None, :]                                    # o miolo: uma coluna lisa do original, com a borda suavizada
    novo[:, :CAPS] = bt[:, :CAPS]
    novo[:, W - CAPS:] = bt[:, w - CAPS:]
    cx = (W - texto.shape[1]) // 2
    novo[:, cx:cx + texto.shape[1]] = texto
    # apaga o Recusar e o vão (o branco do cartão) e põe o botão novo
    a = np.asarray(im).copy()
    a[y0 - 2:y1 + 3, RECUSAR_X0 - 2:x1 + 2] = 255
    a[y0 - 1:y0 - 1 + h, RECUSAR_X0:RECUSAR_X0 + W] = novo
    im = Image.fromarray(a)
im.save(DST, optimize=True)
print("ok", DST.relative_to(RAIZ))
