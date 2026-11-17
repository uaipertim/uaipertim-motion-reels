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
blocos = fala.legenda(CAPS, DUR, LG, fim_ultimo=min(marca_t - 0.05, fecho['voz_t1'] + 0.4))

dados = {'ep': EP, 'numero': ROT['numero'], 'titulo': ROT['titulo'], 'capa': ROT.get('capa'), 'duracao': DUR, 'fps': FPS, 'quadros': NQ,
         'batida': LN['grade']['batida_s'], 'cenas': cenas, 'marca_t': marca_t, 'piscadas': piscadas, 'piscada_dur': 0.16,
         'visemas': ''.join(bocas), 'legenda': {'estilo': LG, 'blocos': blocos}}
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
