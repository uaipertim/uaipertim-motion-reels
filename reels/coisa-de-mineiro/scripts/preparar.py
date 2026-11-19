#!/usr/bin/env python3
"""
Série "Coisa de mineiro": os dados de UM episódio para a composição (sem API).

    python3 reels/coisa-de-mineiro/scripts/preparar.py 01-e-logo-ali

Lê o roteiro (reels/coisa-de-mineiro/<ep>/roteiro.json), a linha do tempo e a voz do pipeline do Explica, Sô!
(reels/explica-so/audio/coisa-de-mineiro/<ep>/linha.json e voz/falas.json) e grava:
  • public/coisa-de-mineiro/<ep>/dados.json — tudo o que a composição CoisaDeMineiro precisa, num arquivo só (ela o lê
    no calculateMetadata; episódio novo = JSON novo, sem mexer no código):
      - o episódio (número, título, capa) e as cenas (tipo, início/fim, fala) com os DIAGRAMAS do roteiro, onde todo
        campo {"em": ...} ganha "t" (o tempo da palavra no vídeo; "palavra#2" = a 2ª vez; "+1.2" = 1,2 s depois do
        começo da cena; "fim" = perto do fim da cena);
      - o caminho (cena "caminho"): o tempo de cada placa de km, espalhadas pela cena, e o "segue" (a estrada que não
        acaba: o passo acelera e o dia vira tarde);
      - a marca: o tempo em que entra (os "marca_s" segundos finais do fecho);
      - a boca do Pertim quadro a quadro (visemas a 30 fps), as piscadas e a legenda gravada (texto da tela; a palavra
        falada em amarelo; até 6 palavras e 2 linhas; cada bloco ≥ 0,8 s; sai antes da marca);
  • reels/explica-so/audio/coisa-de-mineiro/<ep>/cues.json — os efeitos sonoros para scripts/audio.py.
"""
import copy
import json
import os
import re
import sys
import unicodedata

AQUI = os.path.dirname(os.path.abspath(__file__))
SERIE = os.path.dirname(AQUI)
REPO = os.path.dirname(os.path.dirname(SERIE))
sys.path.insert(0, os.path.join(REPO, 'scripts', 'personagem'))
import fala  # noqa: E402

EP = sys.argv[1] if len(sys.argv) > 1 else '01-e-logo-ali'
EPID = f'coisa-de-mineiro/{EP}'
AUD = os.path.join(REPO, 'reels', 'explica-so', 'audio', EPID)
ROT = json.load(open(os.path.join(SERIE, EP, 'roteiro.json')))
LN = json.load(open(os.path.join(AUD, 'linha.json')))
FALAS = json.load(open(os.path.join(AUD, 'voz', 'falas.json')))['capitulos']
LAY = json.load(open(os.path.join(SERIE, 'layout.json')))
FPS = LAY['fps']
DUR = LN['duracao']
NQ = int(round(DUR * FPS))
CAPS = LN['capitulos']
SAI = os.path.join(REPO, 'public', 'coisa-de-mineiro', EP)
os.makedirs(SAI, exist_ok=True)
r3 = lambda x: round(x, 3)


def norm(s):
    s = unicodedata.normalize('NFD', s.lower())
    return re.sub(r'[^a-z0-9]', '', ''.join(c for c in s if unicodedata.category(c) != 'Mn'))


def quando(cap, em):
    if em == 'fim':
        return cap['t1'] - 0.6
    if em == 'apos':                                   # logo depois da fala da cena
        return cap['voz_t1'] + 0.08
    if em.startswith('+'):
        return cap['t0'] + float(em[1:])
    alvo, k = (em.split('#') + ['1'])[:2]
    n = 0
    for w in cap['palavras']:
        if norm(w['w']) == norm(alvo):
            n += 1
            if n == int(k):
                return w['t0']
    raise SystemExit(f'cena {cap["n"] + 1}: a palavra "{alvo}" não está na fala')


def resolve(cap, d):
    """todo dict com "em" ganha "t" (o tempo da palavra no vídeo)"""
    if isinstance(d, dict):
        if 'em' in d:
            d['t'] = r3(quando(cap, d['em']))
        for v in d.values():
            resolve(cap, v)
    elif isinstance(d, list):
        for v in d:
            resolve(cap, v)


cenas = []
for c in CAPS:
    dg = copy.deepcopy(c['diagrama'])
    resolve(c, dg)
    if dg['tipo'] == 'caminho':
        # as placas de km: espalhadas pela cena (a estrada que não acaba); o "segue" acelera o passo
        # placas com "em" (dict {texto, em, pendurada?}) têm o tempo delas; as só com texto são espalhadas pela cena
        if dg.get('placas') and all(isinstance(p, dict) for p in dg['placas']):
            dg['placas_t'] = [p['t'] for p in dg['placas']]
        n = 0 if dg.get('placas_t') else len(dg.get('placas', []))
        objs = [o['t'] for o in dg.get('objetos', [])]
        pts = []
        for k in range(n):
            t = c['t0'] + (k + 1) * (c['t1'] - c['t0']) / (n + 1)
            while any(abs(t - o) < 0.6 for o in objs):          # nunca no mesmo instante de um objeto do caminho
                t += 0.35
            pts.append(r3(t))
        if n:
            dg['placas_t'] = pts
    cenas.append({'n': c['n'], 'tipo': dg['tipo'], 'falante': ROT['capitulos'][c['n']].get('falante', 'pertim'), 't0': c['t0'], 't1': c['t1'], 'voz_t0': c['voz_t0'], 'voz_t1': c['voz_t1'],
                  'texto': ' '.join(w['w'] for w in c['palavras']), 'diagrama': dg})
fecho = cenas[-1]
assert fecho['tipo'] == 'fecho', 'o último capítulo é o fecho'
marca_t = r3(DUR - fecho['diagrama'].get('marca_s', 2.0))
assert marca_t >= fecho['voz_t1'] - 0.05, 'a marca entra antes de a fala do fecho terminar: aumente o "segura" do fecho'

bocas = fala.visemas(CAPS, FALAS, FPS, NQ)
piscadas = fala.piscadas(bocas, FPS, DUR, inicio=0.9)
LG = LAY['legenda']
POP = ROT.get('legenda_estilo') == 'pop'


COMPOSTOS = [['pao', 'de', 'queijo']]


def legenda_pop():
    """(#03 em diante) a legenda nova: blocos de 2 a 4 palavras, nunca atravessando a troca de cena; cada palavra com o
    tempo em que é falada ("ate": até quando fica destacada); a palavra-chave do capítulo ("chave", "palavra#2" = a 2ª vez)
    marcada; o falante do capítulo (a cor do destaque); até 2 linhas na largura da faixa"""
    from PIL import ImageFont
    LP = LAY['legenda_pop']
    fontes = {sz: ImageFont.truetype(os.path.join(REPO, 'public', 'fonts', 'poppins-latin-800-normal.woff2'), sz) for sz in (LP['size'], LP['size2'])}
    def larg(ws, sz=LP['size']):
        f_ = fontes[sz]
        return (sum(f_.getlength(w['w']) + sz * 0.26 for w in ws)        # as palavras e os espaços (margem de 0,13 em)
                + 0.12 * max(f_.getlength(w['w']) for w in ws) + sz * 0.24)  # + a destacada, que cresce 12%, e o contorno
    out = []
    for c in CAPS:
        rc = ROT['capitulos'][c['n']]
        ws = [dict(w) for w in c['palavras']]
        ch = rc.get('chave')
        if ch:
            alvo, k = (ch.split('#') + ['1'])[:2]
            idx = [i for i, w in enumerate(ws) if norm(w['w']) == norm(alvo)]
            assert len(idx) >= int(k), f'cena {c["n"] + 1}: a palavra-chave "{ch}" não está na fala'
            ws[idx[int(k) - 1]]['chave'] = True
        # os trechos: quebra depois da pontuação; trecho de 1 palavra junta com o vizinho; trecho grande vira pedaços de ≤ 4
        tr, cur = [], []
        for w in ws:
            cur.append(w)
            if re.search(r'[.?!…,;:]["”’)]*$', w['w']):
                tr.append(cur); cur = []
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
            # um nome composto ("pão de queijo") conta como UMA palavra e nunca se divide entre blocos
            p, i = [], 0
            while i < len(p0):
                k = next((len(cp) for cp in COMPOSTOS if [norm(w['w']) for w in p0[i:i + len(cp)]] == cp), 1)
                p.append(p0[i:i + k]); i += k
            n = len(p)
            partes = 1 if n <= 4 else -(-n // 4)
            tam = [n // partes + (1 if k < n % partes else 0) for k in range(partes)]
            # nenhum pedaço termina numa palavrinha de ligação ("de", "que", "um"…): troca a sobra de lugar
            if partes == 2 and norm(p[tam[0] - 1][-1]['w']) in fala.LIGA and tam[0] - 1 >= 2:
                tam = [tam[0] - 1, tam[1] + 1]
            if partes == 2 and norm(p[tam[0] - 1][-1]['w']) in fala.LIGA and tam[1] - 1 >= 2:
                tam = [tam[0] + 1, tam[1] - 1]
            k0 = 0
            for t_ in tam:
                blocos.append([w for u in p[k0:k0 + t_] for w in u]); k0 += t_
        dgc = cenas[c['n']]['diagrama']
        manda = dgc['manda'].get('t') if isinstance(dgc.get('manda'), dict) else None
        for bi, b in enumerate(blocos):
            fim = blocos[bi + 1][0]['t0'] - 0.02 if bi + 1 < len(blocos) else min(b[-1]['t1'] + 0.45, c['t1'] - 0.08, marca_t - 0.05, manda or 1e9)
            pal = [{'w': w['w'], 't0': round(w['t0'], 3), 'ate': round(min(fim, b[j + 1]['t0'] if j + 1 < len(b) else w['t1'] + 0.12), 3), **({'chave': True} if w.get('chave') else {})}
                   for j, w in enumerate(b)]
            # uma linha na letra grande; se não couber, duas linhas na letra menor (a legenda nunca passa de y ~1560)
            if larg(b) <= LP['maxW']:
                linhas, sz = [pal], LP['size']
            else:
                sz = LP['size2']
                k = min(range(1, len(b)), key=lambda k: max(larg(b[:k], sz), larg(b[k:], sz)))
                linhas = [pal[:k], pal[k:]]
                assert all(larg([{'w': p_['w']} for p_ in l], sz) <= LP['maxW'] for l in linhas), f'cena {c["n"] + 1}: um bloco da legenda não cabe em 2 linhas'
            out.append({'cena': c['n'], 'falante': rc.get('falante', 'pertim'), 't0': round(max(c['t0'], b[0]['t0'] - 0.06), 3), 't1': round(fim, 3), 'size': sz, 'linhas': linhas})
    return out


blocos = legenda_pop() if POP else fala.legenda(CAPS, DUR, LG, fim_ultimo=min(marca_t - 0.05, fecho['voz_t1'] + 0.4))

dados = {'ep': EP, 'numero': ROT['numero'], 'titulo': ROT['titulo'], 'capa': ROT.get('capa'), 'duracao': DUR, 'fps': FPS, 'quadros': NQ,
         'batida': LN['grade']['batida_s'], 'cenas': cenas, 'marca_t': marca_t, 'piscadas': piscadas, 'piscada_dur': 0.16,
         'visemas': ''.join(bocas), 'legenda': {'pop': True, 'estilo': LAY['legenda_pop'], 'blocos': blocos} if POP else {'estilo': LG, 'blocos': blocos}}
json.dump(dados, open(os.path.join(SAI, 'dados.json'), 'w'), ensure_ascii=False)

# ---------------------------------------------------------------- os efeitos sonoros, por tipo de cena
SOM = {'porteira': 'door', 'mangueira': 'plop', 'mata-burro': 'cut', 'vaca': 'jump'}
cues = [{'t': 0.0, 'type': 'stamp'}]
for c in cenas:
    d = c['diagrama']
    if c['tipo'] == 'pergunta':
        cues += [{'t': c['t0'] + 0.35, 'type': 'whoosh'}, {'t': c['voz_t1'] - 0.15, 'type': 'question'}]
    elif c['tipo'] == 'resposta':
        cues += [{'t': c['t0'] + 0.05, 'type': 'pop', 'f': 620}]
        if d.get('camera'):
            cues += [{'t': d['camera']['t'], 'type': 'shine'}]
    elif c['tipo'] == 'caminho':
        cues += [{'t': c['t0'], 'type': 'whoosh'}]
        cues += [{'t': o['t'], 'type': SOM.get(o['tipo'], 'pop')} for o in d.get('objetos', [])]
        cues += [{'t': t, 'type': 'pop', 'f': 600 + 120 * k} for k, t in enumerate(d.get('placas_t', []))]
        cues += [{'t': t + 0.55, 'type': 'jump'} for p, t in zip(d.get('placas', []), d.get('placas_t', [])) if isinstance(p, dict) and p.get('pendurada')]
        if d.get('segue'):
            cues += [{'t': d['segue']['t'], 'type': 'rise'}]
    elif c['tipo'] == 'chegada':
        cues += [{'t': c['t0'], 'type': 'whoosh'}, {'t': c['t0'] + 0.3, 'type': 'shine'}, {'t': c['t0'] + 1.2, 'type': 'flop'}, {'t': c['voz_t1'] - 0.3, 'type': 'clink'}]
    elif c['tipo'] == 'fecho':
        cues += [{'t': c['t0'] + 0.15, 'type': 'shine'}]
    # os tipos do #02 (a casa: sala, porta, portão, carro)
    elif c['tipo'] == 'sala':
        if d.get('levanta'):
            cues += [{'t': d['levanta']['t'], 'type': 'whoosh'}]
        if d.get('pernas'):
            cues += [{'t': d['pernas']['t'], 'type': 'pop', 'f': 520}, {'t': d['pernas']['t'] + 0.22, 'type': 'pop', 'f': 560}]
    elif c['tipo'] == 'porta':
        if d.get('bolo'):
            cues += [{'t': d['bolo']['t'], 'type': 'whoosh'}, {'t': d['bolo']['t'] + 0.4, 'type': 'plop'}]
        if d.get('fica'):
            cues += [{'t': d['fica']['t'], 'type': 'jump'}]
    elif c['tipo'] == 'portao':
        if d.get('cachorro'):
            cues += [{'t': d['cachorro']['t'], 'type': 'flop'}]
        if d.get('vizinho'):
            cues += [{'t': d['vizinho']['t'], 'type': 'tick'}]
    elif c['tipo'] == 'carro':
        cues += [{'t': c['t0'] + 0.55, 'type': 'door'}, {'t': c['t0'] + 0.85, 'type': 'moto', 'd': 0.9}]
        if d.get('vidro'):
            cues += [{'t': d['vidro']['t'] - 0.15, 'type': 'slide'}]
    # os tipos do #03 (a sala da visita)
    if c['tipo'] in ('cafe', 'pao', 'aceita', 'exagero', 'moral'):
        if c['tipo'] != cenas[c['n'] - 1]['tipo'] if c['n'] else True:
            cues += [{'t': c['t0'], 'type': 'cut' if c['tipo'] == 'exagero' else 'whoosh'}]
        if d.get('nao'):
            cues += [{'t': d['nao']['t'], 'type': 'deny'}]
        if d.get('prato'):
            cues += [{'t': d['prato']['t'], 'type': 'pop', 'f': 560}]
        if d.get('ronc'):
            cues += [{'t': d['ronc']['t'], 'type': 'ronc'}]
        if d.get('pega'):
            cues += [{'t': d['pega']['t'], 'type': 'whoosh'}, {'t': d['pega']['t'] + 0.32, 'type': 'plop'}]
        if c['tipo'] == 'aceita':
            cues += [{'t': c['t0'] + 0.05, 'type': 'jump'}]
        if d.get('bolo'):
            cues += [{'t': d['bolo']['t'], 'type': 'pop', 'f': 760}]
        if d.get('sim'):
            cues += [{'t': d['sim']['t'], 'type': 'shine'}]
    if d.get('contador'):
        cues += [{'t': d['contador']['t'] + 0.02, 'type': 'big' if d['contador'].get('confete') else 'stamp'}]
    if c['tipo'] == 'fecho' and isinstance(d.get('manda'), dict):
        cues += [{'t': d['manda']['t'], 'type': 'pop', 'f': 520}]
hora_ant = None
for c in cenas:
    h = c['diagrama'].get('relogio')
    if h and hora_ant and h != hora_ant:
        cues += [{'t': c['t0'] - 0.05, 'type': 'count', 'd': 0.45}]
    hora_ant = h or hora_ant
cues += [{'t': marca_t, 'type': 'logo'}]
cues.sort(key=lambda x: x['t'])
json.dump({'duration': DUR, 'cues': cues}, open(os.path.join(AUD, 'cues.json'), 'w'), ensure_ascii=False, indent=1)

print(f'ok -> public/coisa-de-mineiro/{EP}/dados.json ({DUR:.2f} s, {NQ} quadros; {len(blocos)} blocos de legenda; {len(piscadas)} piscadas; marca em {marca_t:.2f} s) + cues.json ({len(cues)} efeitos)')
for c in cenas:
    ts = {k: v['t'] for k, v in c['diagrama'].items() if isinstance(v, dict) and 't' in v}
    obj = [(o['tipo'], o['t']) for o in c['diagrama'].get('objetos', [])]
    print(f'  {c["n"] + 1} {c["tipo"]:9s} {c["t0"]:6.2f}–{c["t1"]:6.2f} s · voz {c["voz_t0"]:.2f}–{c["voz_t1"]:.2f} {ts or ""} {obj or ""} {c["diagrama"].get("placas_t", "")}')
