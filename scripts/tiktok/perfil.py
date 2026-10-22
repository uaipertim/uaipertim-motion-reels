# Foto de perfil do TikTok: o arquivo oficial public/img/uaipertim_mark.png apenas redimensionado e
# centralizado sobre a mesma cor coral do círculo do arquivo (sem redesenho, sem alterar formas/cores).
import numpy as np
from PIL import Image, ImageDraw
SRC = 'public/img/uaipertim_mark.png'
OUT = 'exports/tiktok/perfil/tiktok-perfil-simbolo.png'
PREV = 'exports/tiktok/perfil/previa-simbolo.png'
W = 1080; FRAC = 0.56
mark = Image.open(SRC).convert('RGBA')
a = np.array(mark).astype(int)
al = a[..., 3]
# cor coral interna: a cor dominante dos pixels opacos do círculo
opq = a[al == 255][:, :3]
vals, cnt = np.unique(opq, axis=0, return_counts=True)
coral = tuple(int(v) for v in vals[cnt.argmax()])
# bbox do desenho = pixels opacos que diferem do coral (inclui sombras suaves)
m = (np.abs(a[..., :3] - np.array(coral)).sum(-1) > 15) & (al > 200)
ys, xs = np.where(m)
x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
s = FRAC * W / (x1 - x0)
# achata o arquivo sobre o próprio coral ANTES de redimensionar: a borda do círculo some sem emenda
# (redimensionar com transparência deixa um anel claro na borda)
flat = Image.new('RGBA', mark.size, coral + (255,)); flat.alpha_composite(mark)
big = flat.convert('RGB').resize((round(mark.width * s), round(mark.height * s)), Image.LANCZOS)
cx, cy = (x0 + x1) / 2 * s, (y0 + y1) / 2 * s
canvas = Image.new('RGBA', (W, W), coral + (255,))
off = (round(W / 2 - cx), round(W / 2 - cy))
canvas.paste(big, off)
out = canvas.convert('RGB')
out.save(OUT, optimize=True)
# conferências
o = np.array(out).astype(int)
dm = np.abs(o - np.array(coral)).sum(-1) > 15
yy, xx = np.where(dm)
r = np.sqrt((xx - W / 2 + 0.5) ** 2 + (yy - W / 2 + 0.5) ** 2)
print('coral', '#%02X%02X%02X' % coral, 'escala %.4f' % s)
print('largura do desenho %d px = %.1f%%' % (xx.max() - xx.min() + 1, 100 * (xx.max() - xx.min() + 1) / W))
print('bbox', xx.min(), xx.max(), yy.min(), yy.max(), '| raio máx do desenho %.0f px de 540 (%.0f%%)' % (r.max(), 100 * r.max() / 540))
ring = np.abs(o - np.array(coral)).sum(-1)[~dm]
print('fundo fora do desenho: desvio máx', int(ring.max()))
# prévia: máscara circular em 200 e 60 px
def circ(sz):
    im = out.resize((sz, sz), Image.LANCZOS).convert('RGBA')
    k = 4; mk = Image.new('L', (sz * k, sz * k), 0); ImageDraw.Draw(mk).ellipse((0, 0, sz * k - 1, sz * k - 1), fill=255)
    im.putalpha(mk.resize((sz, sz), Image.LANCZOS)); return im
pv = Image.new('RGB', (420, 280), (246, 238, 226))
pv.paste(c := circ(200), (40, 40), c)
pv.paste(c := circ(60), (300, 110), c)
pv.save(PREV, optimize=True)
