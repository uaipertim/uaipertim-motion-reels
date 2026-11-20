#!/usr/bin/env python3
"""
Reel "Pão de Queijo Points": os dados da composição a partir da voz (sem API).

    python3 reels/pao-de-queijo-points/scripts/preparar.py

Lê reels/explica-so/audio/pao-de-queijo-points/linha.json (as cenas na grade de batidas e as palavras da TELA no tempo do
vídeo) e voz/falas.json (o alinhamento por caractere) e escreve em reels/pao-de-queijo-points/dados/:
  • cena.json     — a duração, as cenas e os eventos de cada uma, amarrados às palavras da voz: o pão de queijo que vira
                    moedinhas e o contador (gancho), o celular que sobe com o Início, o toque em "Ver prêmios", as lupas e
                    os destaques (saldo, +30, +20, a lista "Troque seus pontos", os níveis), o fecho; as piscadas;
  • visemas.json  — a boca do Pertim quadro a quadro (scripts/personagem/fala.py);
  • legenda.json  — a legenda nova (a da Coisa de mineiro #03): blocos de 2 a 4 palavras, cada palavra no tempo em que é
                    falada; as palavras-chave ("chaves" no roteiro) ficam em amarelo/laranja; uma linha na letra grande
                    ou duas na menor, sempre em x 110–906;
e reels/explica-so/audio/pao-de-queijo-points/cues.json (os efeitos sonoros para audio.py).
"""
import json
import os
import re
import sys
import unicodedata

AQUI = os.path.dirname(os.path.abspath(__file__))
REEL = os.path.dirname(AQUI)
REPO = os.path.dirname(os.path.dirname(REEL))
sys.path.insert(0, os.path.join(REPO, 'scripts', 'personagem'))
import fala  # noqa: E402

EP = 'pao-de-queijo-points'
AUD = os.path.join(REPO, 'reels', 'explica-so', 'audio', EP)
LN = json.load(open(os.path.join(AUD, 'linha.json')))
FALAS = json.load(open(os.path.join(AUD, 'voz', 'falas.json')))['capitulos']
LAY = json.load(open(os.path.join(REEL, 'layout.json')))
ROT = json.load(open(os.path.join(REEL, 'roteiro.json')))
FPS = LAY['fps']
DUR = LN['duracao']
NQ = int(round(DUR * FPS))
BT = LN['grade']['batida_s']
CAPS = LN['capitulos']
SAIDA = os.path.join(REEL, 'dados')
os.makedirs(SAIDA, exist_ok=True)
r3 = lambda x: round(x, 3)


def norm(s):
    s = unicodedata.normalize('NFD', s.lower())
    return re.sub(r'[^a-z0-9]', '', ''.join(c for c in s if unicodedata.category(c) != 'Mn'))


def palavra(cap, alvo, k=1):
    n = 0
    for w in cap['palavras']:
        if norm(w['w']) == norm(alvo):
            n += 1
            if n == k:
                return w
    raise SystemExit(f'cena {cap["n"]}: a palavra "{alvo}" não está na fala')


c_g, c_b, c_p, c_t, c_n, c_f = CAPS
assert [c['diagrama']['tipo'] for c in CAPS] == ['gancho', 'boasvindas', 'pedido', 'troca', 'niveis', 'fecho']
T = [c['t0'] for c in CAPS] + [DUR]
ev = {}
# 1 · gancho: o pão de queijo quentinho já está na tela no quadro 0 (fumacinha, quique); em 0,7 s ele estoura em moedinhas
#     que caem no contador, que sobe até 150 (cada moeda que cai soma); o celular sobe com o Início em "rende" e o contador
#     voa para o banner "Pão de Queijo Points"; o banner acende em "pontos"
estoura = 0.7
moedas = [r3(estoura + 0.28 + 0.072 * k) for k in range(14)]
pr = palavra(c_g, 'rende')
ev['gancho'] = {'estoura': estoura, 'moedas': moedas, 'conta_fim': moedas[-1], 'celular': [r3(pr['t0'] - 0.1), r3(pr['t0'] + 0.45)],
                'voa': [r3(pr['t0'] + 0.1), r3(pr['t0'] + 0.65)], 'banner': r3(palavra(c_g, 'pontos')['t0'] - 0.05)}
# 2 · boas-vindas: o toque em "Ver prêmios" logo antes do corte e a tela do Pão de Queijo Points entra empurrando; o saldo
#     acende; a lupa dos cartões +30/+20 abre e o +30 acende em "trinta" (a lupa fica aberta na cena 3)
ev['boasvindas'] = {'toque': r3(T[1] - 0.22), 'entra': [r3(T[1] - 0.05), r3(T[1] + 0.25)], 'saldo': [r3(T[1] + 0.3), r3(palavra(c_b, 'trinta')['t0'] - 0.3)],
                    'lupa': [r3(palavra(c_b, 'trinta')['t0'] - 0.42), r3(T[3] - 0.12)], 'mais30': r3(palavra(c_b, 'trinta')['t0'] - 0.03)}
# 3 · pedido: o +20 acende em "pedido" e pula com um "+20" subindo em "vinte"
ev['pedido'] = {'mais20': r3(palavra(c_p, 'pedido')['t0'] - 0.03), 'vinte': r3(palavra(c_p, 'vinte')['t0'] - 0.03)}
# 4 · troca: a lupa da lista "Troque seus pontos" abre em "Juntou?"; os dois descontos acendem em "desconto"; a lupa desce
#     até o "Benefício na entrega", que acende em "entrega"
pd, pe = palavra(c_t, 'desconto'), palavra(c_t, 'entrega')
ev['troca'] = {'lupa': [r3(T[3] + 0.08), r3(T[4] - 0.12)], 'desconto': r3(pd['t0'] - 0.03), 'desce': r3(pe['t0'] - 0.45), 'entrega': r3(pe['t0'] - 0.03),
               'toque': r3(pd['t0'] + 0.35)}
# 5 · níveis: a tela rola até "Níveis"; a lupa abre e cada nível acende na sua palavra; no "Diamante", brilho e confete
nv = [{'i': x['i'], 't': r3(palavra(c_n, x['em'])['t0'] - 0.03)} for x in c_n['diagrama']['niveis']]
ev['niveis'] = {'rola': [r3(T[4] + 0.05), r3(T[4] + 0.75), 0, LAY['rola']['Fidelidade_niveis']], 'lupa': [r3(T[4] + 0.6), r3(T[5] - 0.12)], 'niveis': nv}
# 6 · fecho: o celular se afasta e os quatro prêmios da lista saem dele e ficam em leque, com o "?"; em "Conta", os prêmios
#     saem e a logo entra (para e fica até o fim), com "Tudo pertim de você." e o balão de comentário; o Pertim acena e pisca
pc = palavra(c_f, 'Conta')
lg_e = r3(pc['t0'] - 0.05)
ev['fecho'] = {'afasta': [r3(T[5] - 0.1), r3(T[5] + 0.45)], 'cartoes': [r3(T[5] + 0.15 + 0.12 * k) for k in range(4)], 'pergunta': r3(palavra(c_f, 'Qual')['t0']),
               'somem': r3(pc['t0'] - 0.15), 'logo': {'entra': lg_e, 'parada': r3(lg_e + ROT.get('logo_pronta', 0.6))}, 'frase': r3(lg_e + 0.55),
               'comenta': r3(palavra(c_f, 'aqui')['t0'] + 0.05), 'acena': r3(pc['t0'] - 0.05), 'pisca': r3(c_f['voz_t1'] + 0.25)}
assert DUR - ev['fecho']['logo']['parada'] >= 3.0 - 1e-6, 'a logo não fica 3 s parada no fim'

# ---------------------------------------------------------------- boca, piscadas e legenda
bocas = fala.visemas(CAPS, FALAS, FPS, NQ)
json.dump({'fps': FPS, 'codigos': fala.CODIGOS, 'bocas': ''.join(bocas)}, open(os.path.join(SAIDA, 'visemas.json'), 'w'))
piscadas = fala.piscadas(bocas, FPS, DUR, inicio=0.9)
COMPOSTOS = [['pao', 'de', 'queijo']]


def legenda_pop():
    """a legenda nova (Coisa de mineiro #03): blocos de 2 a 4 palavras, nunca atravessando a troca de cena; cada palavra com
    o tempo em que é falada ("ate": até quando fica destacada); as palavras-chave marcadas; até 2 linhas na largura da faixa"""
    from PIL import ImageFont
    LP = LAY['legenda_pop']
    fontes = {sz: ImageFont.truetype(os.path.join(REPO, 'public', 'fonts', 'poppins-latin-800-normal.woff2'), sz) for sz in (LP['size'], LP['size2'])}

    def larg(ws, sz=LP['size']):
        # cada palavra ocupa a largura que tem destacada (12% maior) + 0,24 em de cada lado (o espaço nunca some)
        return sum(fontes[sz].getlength(w['w']) * 1.12 + sz * 0.48 for w in ws)
    out = []
    for c in CAPS:
        rc = ROT['capitulos'][c['n']]
        ws = [dict(w) for w in c['palavras']]
        # as palavras-chave (um nome composto, "pão de queijo", marca as 3 palavras)
        for ch in rc.get('chaves', []):
            alvo = [norm(x) for x in ch.split()]
            achou = False
            for i in range(len(ws) - len(alvo) + 1):
                if [norm(w['w']) for w in ws[i:i + len(alvo)]] == alvo:
                    for w in ws[i:i + len(alvo)]:
                        w['chave'] = True
                    achou = True
                    break
            assert achou, f'cena {c["n"] + 1}: a palavra-chave "{ch}" não está na fala'
        # os trechos: quebra depois da pontuação; trecho de 1 palavra junta com o vizinho; trecho grande vira pedaços de ≤ 4
        tr, cur = [], []
        for w in ws:
            cur.append(w)
            if re.search(r'[.?!…,;:]["”’)]*$', w['w']):
                tr.append(cur)
                cur = []
        if cur:
            tr.append(cur)
        i = 0
        while i < len(tr):
            if len(tr[i]) == 1 and len(tr) > 1:
                j = i + 1 if i + 1 < len(tr) else i - 1
                a, b = sorted((i, j))
                tr[a:b + 1] = [tr[a] + tr[b]]
                i = 0
                continue
            i += 1
        blocos = []
        for p0 in tr:
            p, i = [], 0
            while i < len(p0):
                k = next((len(cp) for cp in COMPOSTOS if [norm(w['w']) for w in p0[i:i + len(cp)]] == cp), 1)
                p.append(p0[i:i + k])
                i += k
            n = len(p)
            partes = 1 if n <= 4 else -(-n // 4)
            tam = [n // partes + (1 if k < n % partes else 0) for k in range(partes)]
            # nenhum pedaço termina numa palavrinha de ligação ("de", "que", "um"…)
            if partes == 2 and norm(p[tam[0] - 1][-1]['w']) in fala.LIGA and tam[0] - 1 >= 2:
                tam = [tam[0] - 1, tam[1] + 1]
            if partes == 2 and norm(p[tam[0] - 1][-1]['w']) in fala.LIGA and tam[1] - 1 >= 2:
                tam = [tam[0] + 1, tam[1] - 1]
            if max(tam) > 4:                    # a troca deixou um pedaço com 5: divide em 3 (sem terminar em palavrinha de ligação)
                partes = 3
                tam = [n // 3 + (1 if k < n % 3 else 0) for k in range(3)]
                for a in range(2):
                    if norm(p[sum(tam[:a + 1]) - 1][-1]['w']) in fala.LIGA and tam[a + 1] < 4:
                        tam[a] -= 1
                        tam[a + 1] += 1
            k0 = 0
            for t_ in tam:
                blocos.append([w for u in p[k0:k0 + t_] for w in u])
                k0 += t_
        for bi, b in enumerate(blocos):
            fim = blocos[bi + 1][0]['t0'] - 0.02 if bi + 1 < len(blocos) else min(b[-1]['t1'] + 0.45, c['t1'] - 0.08)
            if c['n'] == len(CAPS) - 1:
                fim = min(fim, c['voz_t1'] + 0.45)
            pal = [{'w': w['w'], 't0': r3(w['t0']), 'ate': r3(min(fim, b[j + 1]['t0'] if j + 1 < len(b) else w['t1'] + 0.12)), **({'chave': True} if w.get('chave') else {})}
                   for j, w in enumerate(b)]
            if larg(b) <= LP['maxW']:
                linhas, sz = [pal], LP['size']
            else:
                sz = LP['size2']
                ns = [norm(w['w']) for w in b]
                dentro = {i0 + j for i0 in range(len(b)) for cp in COMPOSTOS if ns[i0:i0 + len(cp)] == cp for j in range(1, len(cp))}
                ks = [k for k in range(1, len(b)) if k not in dentro]
                k = min(ks, key=lambda k: max(larg(b[:k], sz), larg(b[k:], sz)) + (200 if ns[k - 1] in fala.LIGA else 0))
                linhas = [pal[:k], pal[k:]]
                assert all(larg([{'w': p_['w']} for p_ in l], sz) <= LP['maxW'] for l in linhas), f'cena {c["n"] + 1}: um bloco da legenda não cabe em 2 linhas'
            out.append({'cena': c['n'], 't0': r3(max(c['t0'], b[0]['t0'] - 0.06)), 't1': r3(fim), 'size': sz, 'linhas': linhas})
    return out


blocos = legenda_pop()
json.dump({'estilo': LAY['legenda_pop'], 'blocos': blocos}, open(os.path.join(SAIDA, 'legenda.json'), 'w'), ensure_ascii=False, indent=1)

cena = {'duracao': DUR, 'fps': FPS, 'quadros': NQ, 'batida': BT, 'bpm': LN['grade']['bpm'],
        'cenas': [{'n': c['n'], 'tipo': c['diagrama']['tipo'], 't0': c['t0'], 't1': c['t1'], 'voz_t0': c['voz_t0'], 'voz_t1': c['voz_t1'],
                   'texto': ' '.join(w['w'] for w in c['palavras'])} for c in CAPS],
        'eventos': ev, 'piscadas': piscadas, 'piscada_dur': 0.16}
json.dump(cena, open(os.path.join(SAIDA, 'cena.json'), 'w'), ensure_ascii=False, indent=1)

# ---------------------------------------------------------------- os efeitos sonoros
E = ev
G = E['gancho']
cues = [{'t': 0.0, 'type': 'pop', 'f': 520}, {'t': G['estoura'], 'type': 'big'}, {'t': G['estoura'] + 0.05, 'type': 'coinsfall'}]
cues += [{'t': t, 'type': 'coin'} for t in G['moedas'][::3]]
cues += [{'t': G['moedas'][0], 'type': 'count'}, {'t': G['conta_fim'] + 0.05, 'type': 'check'}]
cues += [{'t': G['celular'][0], 'type': 'whoosh'}, {'t': G['voa'][1], 'type': 'plop'}, {'t': G['banner'], 'type': 'light', 'i': 0}]
B = E['boasvindas']
cues += [{'t': B['toque'], 'type': 'tick'}, {'t': B['entra'][0], 'type': 'whoosh'}, {'t': B['saldo'][0], 'type': 'light', 'i': 1}, {'t': B['lupa'][0], 'type': 'grow', 'd': 0.3},
         {'t': B['mais30'], 'type': 'coin'}]
cues += [{'t': E['pedido']['mais20'], 'type': 'light', 'i': 2}, {'t': E['pedido']['vinte'], 'type': 'coin'}]
Tr = E['troca']
cues += [{'t': Tr['lupa'][0], 'type': 'grow', 'd': 0.3}, {'t': Tr['desconto'], 'type': 'light', 'i': 0}, {'t': Tr['toque'], 'type': 'tick'}, {'t': Tr['desce'], 'type': 'slide'},
         {'t': Tr['entrega'], 'type': 'light', 'i': 1}]
N = E['niveis']
cues += [{'t': N['rola'][0], 'type': 'slide'}, {'t': N['lupa'][0], 'type': 'grow', 'd': 0.3}]
cues += [{'t': x['t'], 'type': 'light', 'i': k} for k, x in enumerate(N['niveis'])]
cues += [{'t': N['niveis'][-1]['t'] + 0.05, 'type': 'shine'}]
F = E['fecho']
cues += [{'t': F['afasta'][0], 'type': 'whoosh'}] + [{'t': t, 'type': 'pop', 'f': 620 + 80 * k} for k, t in enumerate(F['cartoes'])]
cues += [{'t': F['pergunta'], 'type': 'question'}, {'t': F['somem'], 'type': 'whoosh'}, {'t': F['logo']['entra'], 'type': 'logo'}, {'t': F['frase'], 'type': 'pop', 'f': 700},
         {'t': F['comenta'], 'type': 'msg'}, {'t': F['pisca'], 'type': 'shine'}]
cues.sort(key=lambda x: x['t'])
json.dump({'duration': DUR, 'cues': cues}, open(os.path.join(AUD, 'cues.json'), 'w'), ensure_ascii=False, indent=1)

print(f'ok -> reels/{EP}/dados/ (cena: {DUR:.2f} s, {NQ} quadros; visemas; legenda: {len(blocos)} blocos; {len(piscadas)} piscadas) + cues.json ({len(cues)} efeitos)')
for c in CAPS:
    print(f'  {c["n"]} {c["diagrama"]["tipo"]:10s} {c["t0"]:6.2f}–{c["t1"]:6.2f} s · voz {c["voz_t0"]:.2f}–{c["voz_t1"]:.2f}')
for b in blocos:
    print(f'  {b["t0"]:6.2f}–{b["t1"]:6.2f} [{b["size"]}] ' + ' / '.join(' '.join(p['w'] + ('*' if p.get('chave') else '') for p in l) for l in b['linhas']))
