#!/usr/bin/env python3
"""
Reel "Pedir no UaiPertim é assim": os dados da composição a partir da voz (sem API).

    python3 reels/pedir-no-uaipertim/scripts/preparar.py

Lê reels/explica-so/audio/pedir-no-uaipertim/linha.json (as cenas e as palavras da TELA no tempo do vídeo) e
voz/falas.json (o alinhamento de cada geração inteira) e escreve em reels/pedir-no-uaipertim/dados/:
  • cena.json     — a duração, as cenas, as trocas (cada uma de um tipo, nenhuma repetida), os eventos de cada cena
                    amarrados às palavras da fala (o toque na categoria em "escolhe", o bacon em "bacon", o "Pagar na
                    entrega" em "entrega", cada etapa do pedido na palavra dela…), as piscadas e as rolagens do celular;
  • visemas.json  — a boca quadro a quadro (scripts/personagem/fala.py, a mesma do "Prazer, Pertim");
  • legenda.json  — os blocos da legenda (texto da tela), cada um ≥ 1,5 s; a do fecho vai até o fim da fala;
e reels/explica-so/audio/pedir-no-uaipertim/cues.json (os efeitos sonoros para scripts/audio.py).
"""
import json
import os
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
REEL = os.path.dirname(AQUI)
REPO = os.path.dirname(os.path.dirname(REEL))
sys.path.insert(0, os.path.join(REPO, 'scripts', 'personagem'))
import fala  # noqa: E402

AUD = os.path.join(REPO, 'reels', 'explica-so', 'audio', 'pedir-no-uaipertim')
LN = json.load(open(os.path.join(AUD, 'linha.json')))
FALAS = json.load(open(os.path.join(AUD, 'voz', 'falas.json')))['capitulos']
LAY = json.load(open(os.path.join(REEL, 'layout.json')))
FPS = LAY['fps']
DUR = LN['duracao']
NQ = int(round(DUR * FPS))
CAPS = LN['capitulos']
SAIDA = os.path.join(REEL, 'dados')
os.makedirs(SAIDA, exist_ok=True)


def w(n, alvo, k=1, campo='t0'):
    """o tempo (no vídeo) da k-ésima palavra `alvo` da cena n"""
    achou = [p for p in CAPS[n]['palavras'] if p['n'] == fala.norm(alvo)]
    if len(achou) < k:
        raise SystemExit(f'cena {n + 1}: a palavra "{alvo}" não está na fala')
    return round(achou[k - 1][campo], 3)


T = [c['t0'] for c in CAPS]                 # o começo de cada cena; a troca para a cena k acontece em [T[k] − 0,9, T[k]]
TR = LN['tr']
bocas = fala.visemas(CAPS, FALAS, FPS, NQ)
json.dump({'fps': FPS, 'codigos': fala.CODIGOS, 'bocas': ''.join(bocas)}, open(os.path.join(SAIDA, 'visemas.json'), 'w'))

# ---------------------------------------------------------------- os eventos de cada cena
ev = {
    'gancho': {'freia': 0.70, 'para': 1.20, 'fome': w(0, 'fome?'), 'assim': w(0, 'assim:')},
    'inicio': {'adesivos': w(1, 'Abre,'), 'toque': w(1, 'escolhe'), 'quer': w(1, 'quer...')},
    'produto': {'loja': T[2], 'produto': w(2, 'lanche'), 'foto': w(2, 'jeito.'), 'bacon': w(2, 'bacon,'), 'adicionar': w(2, 'claro.'),
                'sacola': round(w(2, 'bacon,') - 0.3, 3)},
    'checkout': {'itens': [round(T[3] + 0.10 + 0.22 * k, 3) for k in range(3)], 'contador': [round(T[3] + 0.25, 3), round(T[3] + 1.05, 3)],
                 'tela': round(w(3, 'Paga') - 0.30, 3), 'toque_entrega': w(3, 'entrega,'), 'dinheiro': w(3, 'dinheiro'),
                 'maquininha': w(3, 'maquininha.'), 'toque_pedido': round(w(3, 'maquininha.', campo='t1') + 0.10, 3)},
    'acompanhar': {'etapas': round(T[4] + 0.15, 3), 'marcas': [w(4, 'acompanhar:'), w(4, 'aceita,'), w(4, 'entrega.')],
                   'prepara': w(4, 'prepara'), 'moto': [w(4, 'sai'), round(w(4, 'sai') + 1.15, 3)], 'carimbo': w(4, 'Sem'),
                   'balao': w(4, 'esperando'), 'puf': w(4, 'WhatsApp.', campo='t1')},
    'pontos': {'chuva': T[5], 'saldo': w(5, 'pedido'), 'contador': [w(5, 'rende'), round(w(5, 'rende') + 0.8, 3)], 'cupom': w(5, 'pontos!')},
    'fecho': {'logo': {'entra': round(T[6] + 0.3, 3), 'parada': round(T[6] + 1.2, 3)}, 'texto': w(6, 'Tá'), 'chip': round(w(6, 'Tá') + 0.25, 3),
              'piscadinha': round(CAPS[6]['voz_t1'] + 0.25, 3)},
}
# as trocas de cena: uma de cada tipo (nunca a mesma duas vezes)
TROCAS = ['giro', 'zoom', 'chicote', 'faixa', 'empurra', 'iris']
trocas = [{'para': k + 1, 'tipo': TROCAS[k], 't0': round(T[k + 1] - TR, 3), 't1': round(T[k + 1], 3)} for k in range(6)]
# o celular: que tela mostra e a rolagem (px de CSS do topo da página) — o Checkout nunca acima de y 535 (Pix e cartão)
CK = ev['checkout']
celular = [
    {'t': T[1] - TR, 'tela': 'Main', 'rola': [[0, 0]]},
    {'t': T[2] - 0.45, 'tela': 'Loja', 'rola': [[0, 0], [0.9, 0]]},
    # o Produto: o bacon (y 715) já aparece no topo; depois desce até o "Adicionar" (y 1047, o fim da página: 278)
    {'t': ev['produto']['produto'], 'tela': 'Produto', 'rola': [[0, 0], [ev['produto']['bacon'] + 0.15 - ev['produto']['produto'], 0],
                                                              [ev['produto']['adicionar'] - 0.1 - ev['produto']['bacon'] - 0.15, 278]]},
    {'t': T[3] - TR * 0.5, 'tela': 'Sacola', 'rola': [[0, 0]]},
    # o Checkout: Pix e cartão on-line vão até y 527 (CSS) e NUNCA aparecem; a tela começa em 531 ("Pagar na entrega")
    {'t': CK['tela'], 'tela': 'Checkout', 'rola': [[0, 531], [CK['toque_pedido'] - 0.5 - CK['tela'], 531], [0.4, 578]]},
    {'t': T[4] - TR * 0.5, 'tela': 'Acompanhar', 'rola': [[0, 0]]},
    {'t': T[5] - TR * 0.5, 'tela': 'Fidelidade', 'rola': [[0, 0], [2.4, 0], [0.6, 328]]},   # 328 = o fim da página (o cupom)
]
for s in celular:                            # a rolagem é cumulativa no tempo: [duração desde o passo anterior, y]
    t = s['t']; pts = []
    for d, y in s['rola']:
        t += d; pts.append([round(t, 3), y])
    s['rola'] = pts
    s['t'] = round(s['t'], 3)
piscadas = fala.piscadas(bocas, FPS, DUR)
cena = {'duracao': DUR, 'fps': FPS, 'quadros': NQ, 'tr': TR,
        'cenas': [{'n': c['n'], 'tipo': c['diagrama']['tipo'], 't0': c['t0'], 't1': c['t1'], 'voz_t0': c['voz_t0'], 'voz_t1': c['voz_t1']} for c in CAPS],
        'trocas': trocas, 'eventos': ev, 'celular': celular, 'piscadas': piscadas, 'piscada_dur': 0.16, 'olhares': []}
json.dump(cena, open(os.path.join(SAIDA, 'cena.json'), 'w'), ensure_ascii=False, indent=1)

# ---------------------------------------------------------------- legenda (a do fecho vai até o fim da fala)
LG = LAY['legenda']
blocos = fala.legenda(CAPS, DUR, LG, fim_ultimo=DUR - 0.3)
json.dump({'estilo': LG, 'blocos': blocos}, open(os.path.join(SAIDA, 'legenda.json'), 'w'), ensure_ascii=False, indent=1)

# ---------------------------------------------------------------- os efeitos sonoros (scripts/audio.py do Explica, Sô!)
g, ini, pr, ck, ac, po, fe = (ev[k] for k in ('gancho', 'inicio', 'produto', 'checkout', 'acompanhar', 'pontos', 'fecho'))
cues = [{'t': 0.0, 'type': 'moto', 'd': 1.1}, {'t': g['freia'], 'type': 'skid'}, {'t': g['para'] + 0.05, 'type': 'horn'},
        {'t': g['fome'], 'type': 'big'}]
cues += [{'t': trocas[0]['t0'] + 0.1, 'type': 'whoosh'}, {'t': trocas[0]['t1'] - 0.15, 'type': 'snap'}]
cues += [{'t': ini['adesivos'] + 0.07 * k, 'type': 'pop', 'f': 560 + 60 * k} for k in range(6)]
cues += [{'t': ini['toque'], 'type': 'tick'}, {'t': ini['toque'] + 0.12, 'type': 'pop', 'f': 760}]
cues += [{'t': trocas[1]['t0'] + 0.1, 'type': 'rise'}, {'t': trocas[1]['t1'] - 0.2, 'type': 'whoosh'}]
cues += [{'t': pr['produto'] - 0.05, 'type': 'slide'}, {'t': pr['foto'], 'type': 'big'}, {'t': pr['sacola'], 'type': 'plop'},
         {'t': pr['bacon'], 'type': 'check'}, {'t': pr['adicionar'], 'type': 'drop'}, {'t': pr['adicionar'] + 0.55, 'type': 'plop'}]
cues += [{'t': trocas[2]['t0'] + 0.15, 'type': 'trans', 'd': 0.4}]
cues += [{'t': t + 0.32, 'type': 'plop'} for t in ck['itens']]
cues += [{'t': ck['contador'][0], 'type': 'count', 'd': ck['contador'][1] - ck['contador'][0]}, {'t': ck['contador'][1], 'type': 'coin'},
         {'t': ck['tela'], 'type': 'slide'}, {'t': ck['toque_entrega'], 'type': 'tick'}, {'t': ck['toque_entrega'] + 0.1, 'type': 'check'},
         {'t': ck['dinheiro'], 'type': 'pop', 'f': 620}, {'t': ck['maquininha'], 'type': 'pop', 'f': 700},
         {'t': ck['toque_pedido'], 'type': 'tick'}, {'t': ck['toque_pedido'] + 0.08, 'type': 'big'}]
cues += [{'t': trocas[3]['t0'] + 0.1, 'type': 'whoosh'}]
cues += [{'t': ac['etapas'], 'type': 'plop'}] + [{'t': t, 'type': 'node', 'k': 2 + 2 * i} for i, t in enumerate(ac['marcas'])]
cues += [{'t': ac['moto'][0] - 0.1, 'type': 'moto', 'd': ac['moto'][1] - ac['moto'][0]}, {'t': ac['carimbo'], 'type': 'stamp'},
         {'t': ac['balao'], 'type': 'msg'}, {'t': ac['puf'], 'type': 'flop'}]
cues += [{'t': trocas[4]['t0'] + 0.1, 'type': 'whoosh'}, {'t': po['chuva'] + 0.05, 'type': 'coinsfall'}, {'t': po['saldo'], 'type': 'plop'},
         {'t': po['contador'][0], 'type': 'count', 'd': po['contador'][1] - po['contador'][0]}, {'t': po['contador'][1], 'type': 'pop', 'f': 820},
         {'t': po['cupom'], 'type': 'slide'}]
cues += [{'t': trocas[5]['t0'] + 0.1, 'type': 'rise'}, {'t': fe['logo']['entra'], 'type': 'logo'}, {'t': fe['texto'], 'type': 'title'},
         {'t': fe['chip'], 'type': 'chip'}]
cues.sort(key=lambda x: x['t'])
json.dump({'duration': DUR, 'cues': cues}, open(os.path.join(AUD, 'cues.json'), 'w'), ensure_ascii=False, indent=1)
print(f'ok -> reels/pedir-no-uaipertim/dados/ (cena {DUR:.2f} s, visemas {NQ} quadros, legenda {len(blocos)} blocos, '
      f'{len(piscadas)} piscadas) + cues.json ({len(cues)} efeitos)')
