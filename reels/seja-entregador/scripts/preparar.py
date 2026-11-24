#!/usr/bin/env python3
"""
Reel "Seja entregador parceiro": os dados da composição a partir da voz (sem API).

    python3 reels/seja-entregador/scripts/preparar.py

Lê reels/explica-so/audio/seja-entregador/linha.json (as cenas na grade de batidas e as palavras da TELA no tempo do
vídeo) e voz/falas.json (o alinhamento por caractere) e escreve em reels/seja-entregador/dados/:
  • cena.json     — a duração, as cenas e os eventos de cada uma, amarrados às palavras da voz: os veículos na rua do
                    Glória (gancho), a chamada, o interruptor "Ficar disponível", a notificação no celular, a coleta na
                    lojinha, as fichas do acerto, o selo do cadastro e o fecho com o CTA do Direct; as piscadas;
  • visemas.json  — a boca do Pertim quadro a quadro (scripts/personagem/fala.py);
  • legenda.json  — a legenda nova (a da Coisa de mineiro #03): blocos de 2 a 4 palavras, cada palavra no tempo em que é
                    falada; as palavras-chave ("chaves" no roteiro) ficam em amarelo/laranja; uma linha na letra grande
                    ou duas na menor, sempre em x 110–906;
e reels/explica-so/audio/seja-entregador/cues.json (os efeitos sonoros para audio.py).
    python3 reels/seja-entregador/scripts/preparar.py --previa   (tempos estimados, sem voz: só para o visual)
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

EP = 'seja-entregador'
AUD = os.path.join(REPO, 'reels', 'explica-so', 'audio', EP)
# --previa: os tempos ESTIMADOS do linha.py --previa (sem voz), só para conferir o visual; nunca vira o vídeo final
PREVIA = '--previa' in sys.argv
if PREVIA:
    sys.argv = ['linha.py', EP, '--previa']
    sys.path.insert(0, os.path.join(REPO, 'reels', 'explica-so', 'scripts'))
    import linha  # noqa: E402
    LN = json.load(open(os.path.join(AUD, 'previa', 'linha.json')))
    FALAS = linha.falas()
else:
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



c_g, c_c, c_d, c_n, c_k, c_a, c_s, c_f = CAPS
assert [c['diagrama']['tipo'] for c in CAPS] == ['gancho', 'chamada', 'disponivel', 'notificacao', 'coleta', 'acerto', 'cadastro', 'fecho']
T = [c['t0'] for c in CAPS] + [DUR]
w0 = lambda c, a, k=1, d=0.03: r3(palavra(c, a, k)['t0'] - d)
ev = {}
# 1 · gancho: a rua do Glória já montada no quadro 0, com o Pertim na motinha à frente (olhando pra câmera); a bike e o carro
#     entram em fila atrás dele; cada veículo ganha a plaquinha na sua palavra; "renda extra" brilha; a placa do Glória pula
ev['gancho'] = {'fila': [0.25, 0.55], 'moto': w0(c_g, 'moto'), 'bike': w0(c_g, 'bike'), 'carro': w0(c_g, 'carro'),
                'renda': w0(c_g, 'renda'), 'gloria': w0(c_g, 'Glória'), 'sai': r3(T[1] - 0.35)}
# 2 · chamada: a logo com o megafone entra no corte; o cartaz "Entregadores parceiros" pipoca em "entregadores"; os três
#     veículos em fila embaixo
ev['chamada'] = {'logo': r3(T[1] + 0.02), 'cartaz': w0(c_c, 'entregadores', d=0.08), 'parceiros': w0(c_c, 'parceiros'), 'veiculos': r3(T[1] + 0.3)}
# 3 · disponível: o cartão com o interruptor entra no corte e liga em "disponível"; o relógio gira em "hora"
ev['disponivel'] = {'cartao': r3(T[2] + 0.02), 'liga': w0(c_d, 'disponível'), 'relogio': w0(c_d, 'hora')}
# 4 · notificação: o celular sobe no corte; a notificação cai em "entrega"; loja, bairro e valor acendem cada um na sua
#     palavra; em "vê" a lupinha passa; o botão "Aceitar" pulsa em "aceitar"
ev['notificacao'] = {'celular': [r3(T[3] - 0.05), r3(T[3] + 0.4)], 'notif': w0(c_n, 'entrega', d=0.05), 'loja': w0(c_n, 'loja'),
                     'bairro': w0(c_n, 'bairro'), 'valor': w0(c_n, 'valor'), 've': w0(c_n, 'vê'), 'aceitar': w0(c_n, 'aceitar')}
# 5 · coleta: o toque em "Aceitar" no "Aceitou?"; o celular sai e a lojinha entra; o Pertim pega a sacola no balcão em
#     "Coleta" (selo "Coletei ✓"); em "leva" ele sai na motinha até a casinha; "Entregue ✓" em "cliente"
pc = palavra(c_k, 'Coleta')
ev['coleta'] = {'toque': r3(T[4] + 0.08), 'troca': [r3(T[4] + 0.35), r3(T[4] + 0.75)], 'pega': r3(pc['t0'] - 0.05), 'coletei': r3(pc['t1'] - 0.05),
                'sai': w0(c_k, 'leva', d=0.1), 'chega': r3(palavra(c_k, 'cliente')['t0'] - 0.05), 'entregue': w0(c_k, 'cliente')}
# 6 · acerto: as duas fichas (loja e entregador) entram no corte; a seta do acerto se desenha em "acerto" e o "direto"
#     pisca; o registro com o check em "registrado"
ev['acerto'] = {'fichas': [r3(T[5] + 0.02), r3(T[5] + 0.16)], 'seta': w0(c_a, 'acerto', d=0.06), 'direto': w0(c_a, 'direto'), 'registro': w0(c_a, 'tudo'),
                'check': w0(c_a, 'registrado')}
# 7 · cadastro: a equipe (três avatares) em "equipe"; o selo verde em "conferência"; o escudo brilha em "segurança"
ev['cadastro'] = {'prancheta': r3(T[6] + 0.02), 'equipe': w0(c_s, 'equipe'), 'selo': w0(c_s, 'conferência', d=0.06), 'seguranca': w0(c_s, 'segurança')}
# 8 · fecho: a rede (os três veículos ligados) em "rede"; em "Chama", a logo (para e fica até o fim), o CTA "Chama no
#     Direct" e o @uaipertim; "Tudo pertim de você."; o Pertim acena e pisca
pch = palavra(c_f, 'Chama')
lg_e = r3(pch['t0'] - 0.05)
ev['fecho'] = {'pergunta': w0(c_f, 'Quer', d=0.0), 'rede': w0(c_f, 'rede'), 'somem': r3(pch['t0'] - 0.15),
               'logo': {'entra': lg_e, 'parada': r3(lg_e + ROT.get('logo_pronta', 0.6))}, 'cta': r3(pch['t0'] + 0.1), 'direct': w0(c_f, 'Direct'),
               'frase': r3(lg_e + 0.75), 'acena': r3(pch['t0'] - 0.05), 'pisca': r3(c_f['voz_t1'] + 0.35)}
assert DUR - ev['fecho']['logo']['parada'] >= 3.0 - 1e-6, 'a logo não fica 3 s parada no fim'

# ---------------------------------------------------------------- boca, piscadas e legenda
bocas = fala.visemas(CAPS, FALAS, FPS, NQ)
json.dump({'fps': FPS, 'codigos': fala.CODIGOS, 'bocas': ''.join(bocas)}, open(os.path.join(SAIDA, 'visemas.json'), 'w'))
piscadas = fala.piscadas(bocas, FPS, DUR, inicio=0.9)
COMPOSTOS = []


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
            if len(tr[i]) == 1 and len(tr) > 1 and not (i == 0 and tr[i][0]['w'].endswith('?')):   # "Aceitou?" fica sozinho
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
            # um pedaço que não cabe em 2 linhas (palavras longas, ex.: "entregadores parceiros!"): procura outra divisão
            # (pedaços de 2 a 4, o mais equilibrado, sem terminar em palavrinha de ligação) em que todos caibam
            def cabe(ws_):
                if larg(ws_) <= LP['maxW']:
                    return True
                return any(max(larg(ws_[:k], LP['size2']), larg(ws_[k:], LP['size2'])) <= LP['maxW'] for k in range(1, len(ws_)))
            def pedacos(tam_):
                k0_, out_ = 0, []
                for t_ in tam_:
                    out_.append([w for u in p[k0_:k0_ + t_] for w in u])
                    k0_ += t_
                return out_
            if not all(cabe(b_) for b_ in pedacos(tam)):
                import itertools
                cands = [list(c_) for m in range(2, 5) for c_ in itertools.product(range(1, 5), repeat=m) if sum(c_) == n and (n < 2 or min(c_) >= 2 or n <= 3)]
                cands = [c_ for c_ in cands if all(cabe(b_) for b_ in pedacos(c_))]
                assert cands, f'cena {c["n"] + 1}: nenhuma divisão da legenda cabe'
                tam = min(cands, key=lambda c_: (len(c_), sum(1 for b_ in pedacos(c_)[:-1] if norm(b_[-1]['w']) in fala.LIGA), max(c_) - min(c_)))
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
cues = [{'t': 0.0, 'type': 'moto'}, {'t': G['fila'][0], 'type': 'whoosh'}, {'t': G['fila'][1], 'type': 'whoosh'}]
cues += [{'t': G[k], 'type': 'pop', 'f': f} for k, f in (('moto', 560), ('bike', 660), ('carro', 760))]
cues += [{'t': G['renda'], 'type': 'shine'}, {'t': G['gloria'], 'type': 'jump'}, {'t': G['sai'], 'type': 'whoosh'}]
Cc = E['chamada']
cues += [{'t': Cc['logo'], 'type': 'logo'}, {'t': Cc['cartaz'], 'type': 'stamp'}, {'t': Cc['veiculos'], 'type': 'slide'}]
D_ = E['disponivel']
cues += [{'t': D_['cartao'], 'type': 'pop', 'f': 620}, {'t': D_['liga'], 'type': 'snap'}, {'t': D_['liga'] + 0.05, 'type': 'check'}, {'t': D_['relogio'], 'type': 'tick'}]
Nn = E['notificacao']
cues += [{'t': Nn['celular'][0], 'type': 'whoosh'}, {'t': Nn['notif'], 'type': 'alert'}]
cues += [{'t': Nn[k], 'type': 'light', 'i': i} for i, k in enumerate(('loja', 'bairro', 'valor'))]
cues += [{'t': Nn['aceitar'], 'type': 'pop', 'f': 720}]
K = E['coleta']
cues += [{'t': K['toque'], 'type': 'tick'}, {'t': K['troca'][0], 'type': 'whoosh'}, {'t': K['pega'], 'type': 'plop'}, {'t': K['coletei'], 'type': 'check'},
         {'t': K['sai'], 'type': 'moto'}, {'t': K['entregue'], 'type': 'check'}, {'t': K['entregue'] + 0.05, 'type': 'door'}]
A = E['acerto']
cues += [{'t': A['fichas'][0], 'type': 'pop', 'f': 600}, {'t': A['fichas'][1], 'type': 'pop', 'f': 700}, {'t': A['seta'], 'type': 'slide'}, {'t': A['registro'], 'type': 'page'},
         {'t': A['check'], 'type': 'check'}]
S_ = E['cadastro']
cues += [{'t': S_['prancheta'], 'type': 'pop', 'f': 600}, {'t': S_['equipe'], 'type': 'pop', 'f': 700}, {'t': S_['selo'], 'type': 'stamp'}, {'t': S_['seguranca'], 'type': 'shine'}]
F = E['fecho']
cues += [{'t': F['pergunta'], 'type': 'question'}, {'t': F['rede'], 'type': 'dots'}, {'t': F['somem'], 'type': 'whoosh'}, {'t': F['logo']['entra'], 'type': 'logo'},
         {'t': F['cta'], 'type': 'pop', 'f': 700}, {'t': F['direct'], 'type': 'msg'}, {'t': F['frase'], 'type': 'pop', 'f': 760}, {'t': F['pisca'], 'type': 'shine'}]
cues.sort(key=lambda x: x['t'])
json.dump({'duration': DUR, 'cues': cues}, open(os.path.join(AUD, 'previa' if PREVIA else '', 'cues.json'), 'w'), ensure_ascii=False, indent=1)

print(f'ok -> reels/{EP}/dados/ (cena: {DUR:.2f} s, {NQ} quadros; visemas; legenda: {len(blocos)} blocos; {len(piscadas)} piscadas) + cues.json ({len(cues)} efeitos)')
for c in CAPS:
    print(f'  {c["n"]} {c["diagrama"]["tipo"]:10s} {c["t0"]:6.2f}–{c["t1"]:6.2f} s · voz {c["voz_t0"]:.2f}–{c["voz_t1"]:.2f}')
for b in blocos:
    print(f'  {b["t0"]:6.2f}–{b["t1"]:6.2f} [{b["size"]}] ' + ' / '.join(' '.join(p['w'] + ('*' if p.get('chave') else '') for p in l) for l in b['linhas']))
