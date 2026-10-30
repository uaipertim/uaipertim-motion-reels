"""
A fala do Pertim (sem API), comum aos Reels com o personagem (reels/prazer-pertim, reels/pedir-no-uaipertim):
  visemas(caps, falas, fps, nq)  — a boca quadro a quadro (R/A/E/O/M), tirada dos caracteres que a voz recebeu: vogal
                                   aberta → A, "e/i" → E, "o/u" → O, "m/b/p" → M; as outras consoantes pegam a vogal
                                   seguinte (coarticulação); pausas curtas (< 0,12 s) mantêm a forma; a boca fecha em M no
                                   fim de cada "Pertim"; nenhuma boca fica menos de 2 quadros. R na fala = o sorriso.
  piscadas(bocas, fps, dur)      — a cada 2–4 s (aleatório, semente fixa), nunca com a boca aberta (A/O);
  legenda(caps, dur, estilo)     — blocos de até ~8 palavras e 2 linhas (texto da TELA), quebrando nas pausas, cada um
                                   ≥ estilo["minDur"]; o último sai antes dos 3 últimos segundos (ou em `fim_ultimo`).
`caps` são os capítulos de linha.json (reels/explica-so/scripts/linha.py) e `falas` os de voz/falas.json.
"""
import os
import random
import re
import unicodedata
from PIL import ImageFont

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
VOG = {**{c: 'A' for c in 'aáàâã'}, **{c: 'E' for c in 'eéêiíy'}, **{c: 'O' for c in 'oóôõuú'}}
LAB = set('mbp')
COD = {'repouso': 'R', 'A': 'A', 'E': 'E', 'O': 'O', 'MBP': 'M'}
CODIGOS = {'R': 'repouso', 'A': 'A', 'E': 'E', 'O': 'O', 'M': 'MBP'}
FINAL_M = 0.07


def norm(s):
    s = unicodedata.normalize('NFD', s.lower())
    return re.sub(r'[^a-z0-9]', '', ''.join(c for c in s if unicodedata.category(c) != 'Mn'))


def visemas(caps, falas, fps, nq):
    bocas = ['R'] * nq
    for c in caps:
        F = falas[f'{c["n"]:02d}']
        al = F['alinhamento']
        desl = c['voz_t0'] - F['inicio_da_fala']
        ch = al['characters']; st = al['character_start_times_seconds']; en = al['character_end_times_seconds']
        # a classe de cada letra (consoantes sem forma própria: a vogal seguinte da mesma palavra, senão a anterior)
        cls = []
        for x in ch:
            xl = x.lower()
            cls.append(VOG.get(xl) or ('MBP' if xl in LAB else ('?' if xl.isalpha() else None)))
        for i, k in enumerate(cls):
            if k == '?':
                j = i + 1
                while j < len(cls) and cls[j] == '?':
                    j += 1
                nxt = cls[j] if j < len(cls) and cls[j] not in (None, 'MBP') else None
                prv = next((cls[q] for q in range(i - 1, -1, -1) if cls[q] not in ('?', None, 'MBP')), None)
                cls[i] = nxt or prv or 'E'
        for i, k in enumerate(cls):
            if not k:
                continue
            a, b = st[i] + desl, en[i] + desl
            for q in range(max(0, int(round(a * fps))), min(nq, int(round(b * fps)))):
                bocas[q] = COD[k]
    # pausas curtas entre letras (< 0,12 s) não abrem o sorriso: a forma anterior continua (menos o M/B/P, que fica só
    # nos quadros de m/b/p: depois dele, a pausa curta já pega a forma seguinte)
    q = 0
    while q < nq:
        if bocas[q] == 'R':
            j = q
            while j < nq and bocas[j] == 'R':
                j += 1
            if 0 < q and j < nq and (j - q) / fps < 0.12:
                for k in range(q, j):
                    bocas[k] = bocas[q - 1] if bocas[q - 1] != 'M' else bocas[j]
            q = j
        else:
            q += 1
    # a boca fecha em M no fim de cada "Pertim" (o "m" final, que a voz às vezes deixa em "n")
    for c in caps:
        for w in c['palavras']:
            if norm(w['w']).endswith('pertim'):
                for k in range(max(0, int(round((w['t1'] - FINAL_M) * fps))), min(nq, int(round(w['t1'] * fps)))):
                    bocas[k] = 'M'
    # nenhuma boca com menos de 2 quadros: um M curto ganha o quadro seguinte; outra troca curta é absorvida pela boca de
    # antes (ou pela de depois, se a de antes for M)
    for _ in range(6):
        q, mudou = 0, False
        while q < nq:
            j = q
            while j < nq and bocas[j] == bocas[q]:
                j += 1
            if j - q < 2:
                if bocas[q] == 'M' and j < nq:
                    bocas[j] = 'M'                # o M ganha o quadro seguinte e a corrida segue DEPOIS dele (sem
                    q, mudou = j + 1, True        # reavaliar o quadro ganho, que alastraria o M quadro a quadro)
                    continue
                elif q > 0 and bocas[q - 1] != 'M':
                    for k in range(q, j):
                        bocas[k] = bocas[q - 1]
                elif j < nq:
                    for k in range(q, j):
                        bocas[k] = bocas[j]
                mudou = True
            q = j
        if not mudou:
            break
    return bocas


def piscadas(bocas, fps, dur, inicio=1.6, semente=42):
    nq = len(bocas)
    rnd = random.Random(semente)
    out, t = [], inicio
    aberta = lambda a, b: any(bocas[q] in 'AO' for q in range(max(0, int(a * fps)), min(nq, int(b * fps) + 1)))
    while t < dur - 0.5:
        tt = t
        while tt < dur - 0.5 and aberta(tt - 0.08, tt + 0.24):
            tt += 1 / fps
        if tt < dur - 0.5:
            out.append(round(tt, 3))
        t = tt + rnd.uniform(2.0, 4.0)
    return out


LIGA = {'o', 'a', 'os', 'as', 'do', 'da', 'no', 'na', 'de', 'em', 'e', 'que', 'pra', 'um', 'uma', 'por', 'com', 'mais', 'eu', 'me', 'vou', 'isso'}


def legenda(caps, dur, LG, fim_ultimo=None):
    """fim_ultimo: até quando o último bloco pode ficar (padrão: 3,05 s antes do fim, a logo sozinha)"""
    fonte = ImageFont.truetype(os.path.join(REPO, 'public', 'fonts', 'poppins-latin-800-normal.woff2'), LG['size'])
    larg = lambda ws: fonte.getlength(' '.join(w['w'] for w in ws))
    out = []
    for ci, c in enumerate(caps):
        ws = c['palavras']
        blocos, cur = [], []
        for i, w in enumerate(ws):
            cur.append(w)
            nx = ws[i + 1] if i + 1 < len(ws) else None
            pausa = bool(re.search(r'[.?!…:;,]["”’)]*$', w['w'])) or (nx and nx['t0'] - w['t1'] > 0.3)
            if not nx or (pausa and len(cur) >= 2) or (len(cur) >= LG['maxPal'] and norm(w['w']) not in LIGA):
                blocos.append(cur); cur = []
        if cur:
            blocos.append(cur)
        fim = (dur - 3.05 if fim_ultimo is None else fim_ultimo) if ci == len(caps) - 1 else c['t1'] - 0.05
        B = [{'palavras': p, 't0': max(c['t0'], p[0]['t0'] - 0.05)} for p in blocos]
        for i, b in enumerate(B):
            b['t1'] = min(fim, B[i + 1]['t0'] if i + 1 < len(B) else b['palavras'][-1]['t1'] + 0.9)
        # todo bloco ≥ minDur: junta com o vizinho
        for _ in range(40):
            i = next((k for k, b in enumerate(B) if b['t1'] - b['t0'] < LG['minDur']), None)
            if i is None or len(B) < 2:
                break
            j = i if i + 1 < len(B) else i - 1
            B[j:j + 2] = [{'palavras': B[j]['palavras'] + B[j + 1]['palavras'], 't0': B[j]['t0'], 't1': B[j + 1]['t1']}]
        for b in B:
            p = b['palavras']
            if larg(p) <= LG['maxW']:
                linhas = [p]
            else:
                best = min(((max(larg(p[:k]), larg(p[k:])) - (60 if re.search(r'[,;:]$', p[k - 1]['w']) else 0), k) for k in range(1, len(p))))
                linhas = [p[:best[1]], p[best[1]:]]
            out.append({'cena': ci, 't0': round(b['t0'], 4), 't1': round(b['t1'], 4),
                        'linhas': [[{'w': w['w'], 't0': w['t0'], 't1': w['t1']} for w in l] for l in linhas]})
    return out
