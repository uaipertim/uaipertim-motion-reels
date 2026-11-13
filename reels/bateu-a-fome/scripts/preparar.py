#!/usr/bin/env python3
"""
Reel "Bateu a fome?": os dados da composição a partir da voz (sem API).

    python3 reels/bateu-a-fome/scripts/preparar.py

Lê reels/explica-so/audio/bateu-a-fome/linha.json (as cenas na grade de batidas e as palavras da TELA no tempo do vídeo)
e voz/falas.json (o alinhamento por caractere de cada geração inteira) e escreve em reels/bateu-a-fome/dados/:
  • cena.json     — a duração, a grade (120 BPM), as cenas e os eventos de cada uma, todos amarrados às palavras da voz
                    (o desfile: cada palavra GIGANTE entra na batida e cada sílaba no instante em que a voz a fala);
                    as piscadas do Pertim;
  • visemas.json  — a boca do Pertim quadro a quadro (30 fps; scripts/personagem/fala.py, a mesma dos outros Reels);
  • legenda.json  — os blocos da legenda gravada (texto da tela, a palavra falada em amarelo): até 6 palavras e 2 linhas,
                    cada bloco ≥ 0,8 s; no fecho, a legenda vai só até "UaiPertim." ("Tudo pertim de você." já é o texto
                    grande da tela) e sai antes dos 3 últimos segundos;
e reels/explica-so/audio/bateu-a-fome/cues.json (os efeitos sonoros para scripts/audio.py).
"""
import json
import math
import os
import re
import sys
import unicodedata

AQUI = os.path.dirname(os.path.abspath(__file__))
REEL = os.path.dirname(AQUI)
REPO = os.path.dirname(os.path.dirname(REEL))
sys.path.insert(0, os.path.join(REPO, 'scripts', 'personagem'))
import fala  # noqa: E402

EP = 'bateu-a-fome'
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


def batida_antes(t):
    return math.floor(round(t / BT, 6)) * BT


def letras_no_tempo(cap, w):
    """[(letra, t0)] de uma palavra da tela, pelos caracteres do alinhamento (tempo do vídeo)"""
    F = FALAS[f'{cap["n"]:02d}']
    al = F['alinhamento']
    desl = cap['voz_t0'] - F['inicio_da_fala']
    out, i = [], w['i0']
    while i < len(al['characters']) and not al['characters'][i].isspace():
        if al['characters'][i].isalnum():
            out.append((al['characters'][i], round(al['character_start_times_seconds'][i] + desl, 4)))
        i += 1
    return out


r3 = lambda x: round(x, 3)
c_ganc, c_logo, c_loja, c_mao, c_desf, c_pag, c_rap, c_che, c_fec = CAPS
assert [c['diagrama']['tipo'] for c in CAPS] == ['gancho', 'logo', 'lojas', 'mao', 'desfile', 'pagamento', 'rapidim', 'chegou', 'fecho']

# ---------------------------------------------------------------- os eventos de cada cena
ev = {}
# 1 · gancho: "Bateu a fome?" escrito à mão no ritmo da voz ("a" no "aquela"); o "?" pula no fim de "fome?"
pb, pa, pf = palavra(c_ganc, 'Bateu'), palavra(c_ganc, 'aquela'), palavra(c_ganc, 'fome')
ev['gancho'] = {'escrita': [[0.0, r3(pb['t1'] + 0.05)], [r3(pa['t0']), r3(pa['t0'] + 0.22)], [r3(pf['t0'] - 0.08), r3(pf['t1'] - 0.12)]],
                'interrogacao': r3(pf['t1'] - 0.12), 'sublinha': r3(pf['t1'] + 0.0), 'pertim': 0.0}
# 2 · logo: o pin cai NA batida do corte, quica; o toldo abre em "tem"; a logo explode em "UaiPertim"
pt, pu = palavra(c_logo, 'tem'), palavra(c_logo, 'UaiPertim')
ev['logo'] = {'cai': c_logo['t0'], 'bate': r3(c_logo['t0'] + 0.22), 'toldo': r3(pt['t0'] - 0.04), 'explode': r3(pu['t0'] - 0.04)}
# 3 · lojas: as fileiras de lojinhas descem rápido e param em "lugar"; a moldura fecha em "só"
ev['lojas'] = {'freia': r3(palavra(c_loja, 'lugar')['t0'] - 0.25), 'para': r3(palavra(c_loja, 'lugar')['t0']), 'moldura': r3(palavra(c_loja, 'só')['t0']),
               'gloria': r3(palavra(c_loja, 'Glória')['t0'])}
# 4 · na mão: o celular sobe na mão; "Na palma da sua mão!" entra palavra por palavra
ev['mao'] = {'sobe': c_mao['t0'], 'palavras': [r3(w['t0'] - 0.03) for w in c_mao['palavras']]}
# 5 · desfile: a palavra GIGANTE de cada item entra na batida em que (ou logo antes de) a voz começa a dizê-la; as sílabas
#     estouram uma a uma, cada uma quando a voz a fala; o "+" aperta logo depois da última sílaba
itens = []
for k, it in enumerate(c_desf['diagrama']['itens']):
    w0 = palavra(c_desf, it['em'])
    idx = c_desf['palavras'].index(w0)
    letras = []
    j = idx
    total = sum(len(norm(s)) for s in it['silabas'])
    while len(letras) < total:
        letras += letras_no_tempo(c_desf, c_desf['palavras'][j]); j += 1
    sil, pos = [], 0
    for s in it['silabas']:
        sil.append({'t': s, 't0': r3(letras[pos][1])}); pos += len(norm(s))
    # a batida em (ou logo antes de) a 1ª sílaba; se nela a palavra anterior ainda estiver sendo falada, a batida seguinte
    # ao fim dela (e a 1ª sílaba espera a palavra entrar: no máximo uns centésimos)
    entra = c_desf['t0'] if k == 0 else batida_antes(sil[0]['t0'] - 0.02)
    if k and entra < itens[-1]['fim_fala'] - 0.05:
        entra = math.ceil(round(itens[-1]['fim_fala'] / BT, 6)) * BT
        assert entra - sil[0]['t0'] <= 0.12, f'{it["ilustracao"]}: a palavra entraria {entra - sil[0]["t0"]:.2f} s depois da voz'
        for x in sil:
            x['t0'] = r3(max(x['t0'], entra))
    fim_fala = c_desf['palavras'][j - 1]['t1']
    itens.append({'ilustracao': it['ilustracao'], 'entra': r3(entra), 'silabas': sil, 'mais': r3(fim_fala + 0.06), 'fim_fala': r3(fim_fala)})
ev['desfile'] = {'itens': itens}
# 6 · pagamento: os três selos entram, cada um na sua palavra
ev['pagamento'] = {'selos': [{'t': s['t'], 'em': r3(palavra(c_pag, s['em'])['t0'] - 0.06)} for s in c_pag['diagrama']['selos']]}
# 7 · rapidim: "RAPIDIM" passa ao fundo; o Pertim atravessa de motinha falando; o mapa entra empurrado e a rota pontilhada
#     vai do pin até a casinha
pr = palavra(c_rap, 'rapidim')
ev['rapidim'] = {'cruza': [c_rap['t0'], r3(pr['t0'] + 0.05)], 'mapa': r3(pr['t0'] - 0.05), 'rota': [r3(pr['t0'] + 0.25), r3(c_rap['t1'] - 0.12)]}
# 8 · chegou: o check verde se desenha no corte, "Seu pedido chegou!" na voz e as 5 estrelas acendem uma a uma
pc = palavra(c_che, 'Chegou')
ev['chegou'] = {'check': r3(c_che['t0'] + 0.02), 'texto': r3(pc['t0'] - 0.04), 'estrelas': [r3(pc['t0'] + 0.30 + 0.11 * i) for i in range(5)]}
# 9 · fecho: "Foi facim!" escrito à mão; a logo em "UaiPertim" (para e fica até o fim); "Tudo pertim de você." na voz;
#     o selo "Em breve no Glória" bate logo depois
pfac, pup, ptu, ppe = palavra(c_fec, 'facim'), palavra(c_fec, 'UaiPertim'), palavra(c_fec, 'Tudo'), palavra(c_fec, 'pertim')
ev['fecho'] = {'escrita': [r3(c_fec['t0']), r3(pfac['t1'] - 0.05)], 'logo': {'entra': r3(pup['t0'] - 0.05), 'parada': r3(pup['t0'] - 0.05 + ROT.get('logo_pronta', 0.6))},
               'frase': r3(ptu['t0'] - 0.04), 'selo': r3(ppe['t1'] + 0.12), 'aceno': r3(c_fec['t0'])}
assert DUR - ev['fecho']['logo']['parada'] >= 3.0 - 1e-6, 'a logo não fica 3 s parada no fim'

# ---------------------------------------------------------------- a boca, as piscadas e o olhar do Pertim
bocas = fala.visemas(CAPS, FALAS, FPS, NQ)
json.dump({'fps': FPS, 'codigos': fala.CODIGOS, 'bocas': ''.join(bocas)}, open(os.path.join(SAIDA, 'visemas.json'), 'w'))
piscadas = fala.piscadas(bocas, FPS, DUR, inicio=0.9)
# o Pertim aparece de frente no gancho, na motinha e no fecho: olha sempre para a câmera (pupilas centradas)
aparece = [[0.0, c_ganc['t1']], [c_rap['t0'], ev['rapidim']['cruza'][1] + 0.3], [c_fec['t0'], DUR]]

# ---------------------------------------------------------------- a legenda
LG = LAY['legenda']
caps_leg = []
for c in CAPS:
    c2 = dict(c)
    if c is c_fec:
        c2['palavras'] = [w for w in c['palavras'] if w['t0'] < ptu['t0'] - 0.01]   # só "Foi facim! UaiPertim."
    caps_leg.append(c2)
fim_leg = min(DUR - 3.05, ev['fecho']['frase'] - 0.02)
blocos = fala.legenda(caps_leg, DUR, LG, fim_ultimo=fim_leg)
json.dump({'estilo': LG, 'blocos': blocos}, open(os.path.join(SAIDA, 'legenda.json'), 'w'), ensure_ascii=False, indent=1)

cena = {'duracao': DUR, 'fps': FPS, 'quadros': NQ, 'batida': BT, 'bpm': LN['grade']['bpm'],
        'cenas': [{'n': c['n'], 'tipo': c['diagrama']['tipo'], 't0': c['t0'], 't1': c['t1'], 'voz_t0': c['voz_t0'], 'voz_t1': c['voz_t1'],
                   'texto': ' '.join(w['w'] for w in c['palavras'])} for c in CAPS],
        'eventos': ev, 'piscadas': piscadas, 'piscada_dur': 0.16, 'aparece': aparece}
json.dump(cena, open(os.path.join(SAIDA, 'cena.json'), 'w'), ensure_ascii=False, indent=1)

# ---------------------------------------------------------------- os efeitos sonoros (scripts/audio.py do Explica, Sô!)
E = ev
cues = [{'t': 0.0, 'type': 'pop', 'f': 520}]
cues += [{'t': a, 'type': 'strike'} for a, b in E['gancho']['escrita']]
cues += [{'t': E['gancho']['interrogacao'], 'type': 'question'}]
cues += [{'t': E['logo']['cai'], 'type': 'drop'}, {'t': E['logo']['bate'], 'type': 'flop'}, {'t': E['logo']['bate'] + 0.05, 'type': 'jump'},
         {'t': E['logo']['toldo'], 'type': 'slide'}, {'t': E['logo']['explode'], 'type': 'big'}, {'t': E['logo']['explode'] + 0.05, 'type': 'logo'}]
cues += [{'t': c_loja['t0'], 'type': 'whoosh'}, {'t': c_loja['t0'] + 0.05, 'type': 'sprout', 'i': 0}, {'t': c_loja['t0'] + 0.55, 'type': 'sprout', 'i': 1},
         {'t': E['lojas']['gloria'], 'type': 'sprout', 'i': 2}, {'t': E['lojas']['para'], 'type': 'lock'}, {'t': E['lojas']['moldura'], 'type': 'shine'}]
cues += [{'t': c_mao['t0'], 'type': 'whoosh'}] + [{'t': t, 'type': 'pop', 'f': 560 + 70 * i} for i, t in enumerate(E['mao']['palavras'][:-1])]
cues += [{'t': E['mao']['palavras'][-1], 'type': 'neq'}]
for k, it in enumerate(E['desfile']['itens']):
    cues.append({'t': it['entra'], 'type': 'whoosh' if k == 0 else 'slide'})
    cues += [{'t': s['t0'], 'type': 'pop', 'f': 600 + 110 * i + 40 * k} for i, s in enumerate(it['silabas'])]
    cues.append({'t': it['mais'], 'type': 'chip'})
cues += [{'t': c_pag['t0'], 'type': 'whoosh'}] + [{'t': s['em'], 'type': 'stamp'} for s in E['pagamento']['selos']]
cues += [{'t': c_rap['t0'], 'type': 'moto', 'd': E['rapidim']['cruza'][1] - c_rap['t0']}, {'t': c_rap['t0'] + 0.55, 'type': 'horn'},
         {'t': E['rapidim']['mapa'], 'type': 'whoosh'}, {'t': E['rapidim']['rota'][0], 'type': 'dots', 'd': E['rapidim']['rota'][1] - E['rapidim']['rota'][0]},
         {'t': E['rapidim']['rota'][1], 'type': 'door'}]
cues += [{'t': E['chegou']['check'], 'type': 'check'}] + [{'t': t, 'type': 'light', 'i': i} for i, t in enumerate(E['chegou']['estrelas'])]
cues += [{'t': c_fec['t0'], 'type': 'whoosh'}, {'t': E['fecho']['escrita'][0], 'type': 'strike'}, {'t': E['fecho']['logo']['entra'], 'type': 'logo'},
         {'t': E['fecho']['frase'], 'type': 'pop', 'f': 700}, {'t': E['fecho']['selo'], 'type': 'stamp'}]
cues.sort(key=lambda x: x['t'])
json.dump({'duration': DUR, 'cues': cues}, open(os.path.join(AUD, 'cues.json'), 'w'), ensure_ascii=False, indent=1)

print(f'ok -> reels/bateu-a-fome/dados/ (cena: {DUR:.2f} s, {NQ} quadros a {FPS} fps; visemas; legenda: {len(blocos)} blocos; '
      f'{len(piscadas)} piscadas) + cues.json ({len(cues)} efeitos)')
for c in CAPS:
    print(f'  {c["n"]} {c["diagrama"]["tipo"]:10s} {c["t0"]:6.2f}–{c["t1"]:6.2f} s (batidas {c["t0"] / BT:.0f}–{c["t1"] / BT:.0f})')
for it in itens:
    print(f'  desfile {it["ilustracao"]:12s} entra {it["entra"]:.2f} (batida {it["entra"] / BT:.0f}) · sílabas ' + ' '.join(f'{s["t"]}@{s["t0"]:.2f}' for s in it['silabas']))
