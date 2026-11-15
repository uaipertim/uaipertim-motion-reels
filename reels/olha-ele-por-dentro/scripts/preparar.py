#!/usr/bin/env python3
"""
Reel "Olha ele por dentro!": os dados da composição a partir da voz (sem API).

    python3 reels/olha-ele-por-dentro/scripts/preparar.py

Lê reels/explica-so/audio/olha-ele-por-dentro/linha.json (as cenas na grade de batidas e as palavras da TELA no tempo do
vídeo) e voz/falas.json (o alinhamento por caractere) e escreve em reels/olha-ele-por-dentro/dados/:
  • cena.json     — a duração, a grade (120 BPM), as cenas e os eventos de cada uma, amarrados às palavras da voz: a tela
                    que acende, as rolagens, os toques, as lupas (punch-in) e os destaques de cada categoria e forma de
                    pagamento; as piscadas do Pertim;
  • visemas.json  — a boca do Pertim quadro a quadro (30 fps; scripts/personagem/fala.py);
  • legenda.json  — os blocos da legenda gravada (texto da tela, a palavra falada em amarelo; até 6 palavras e 2 linhas,
                    cada bloco ≥ 0,8 s). No fecho, a legenda vai até o fim da fala ("Tá chegando no Glória!" não está em
                    nenhum texto da tela);
e reels/explica-so/audio/olha-ele-por-dentro/cues.json (os efeitos sonoros para scripts/audio.py).
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

EP = 'olha-ele-por-dentro'
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


c_g, c_i, c_l, c_p, c_s, c_pg, c_f = CAPS
assert [c['diagrama']['tipo'] for c in CAPS] == ['gancho', 'inicio', 'loja', 'produto', 'sacola', 'pagamento', 'fecho']
T = [c['t0'] for c in CAPS] + [DUR]
RL = LAY['rola']
ev = {}
# 1 · gancho: o celular apagado acende e a logo aparece na tela; o Pertim surge ao lado (já no quadro 0)
ev['gancho'] = {'acende': 0.3, 'logo': 0.55, 'pertim': 0.0}
# 2 · início: a lupa das categorias abre antes de "lanche"; cada categoria acende na sua palavra; a tela rola até
#     "Perto de você" e a lupa mostra o Mercado Central em "mercado"; no fim, o toque no Burger do Glória
pm = palavra(c_i, 'mercado')
ev['inicio'] = {
    'lupa': [r3(palavra(c_i, 'lanche')['t0'] - 0.3), r3(pm['t0'] - 0.42)],
    'cats': [{'i': x['i'], 't': r3(palavra(c_i, x['em'])['t0'] - 0.03)} for x in c_i['diagrama']['categorias']],
    'rola': [r3(pm['t0'] - 0.55), r3(pm['t0'] - 0.02), 0, RL['Main_mercado']],
    'mercado': [r3(pm['t0'] - 0.02), r3(T[2] - 0.22)],
    'toque': r3(T[2] - 0.2),
}
# 3 · loja: entra empurrando (navegação do app); rola pelo cardápio em "cardápio"; a lupa mostra o Smash Duplo (foto,
#     preço e o "+") em "foto"; o toque no "+" antes do corte
pc, pf = palavra(c_l, 'cardápio'), palavra(c_l, 'foto')
ev['loja'] = {'rola': [r3(pc['t0'] - 0.15), r3(pc['t0'] + 1.25), 0, RL['Loja_cardapio']], 'lupa': [r3(pf['t0'] - 0.2), r3(T[3] - 0.12)], 'toque': r3(T[3] - 0.32)}
# 4 · produto: a tela abre a partir do card tocado; rola até o "Turbine seu lanche"; a lupa abre em "É" e o bacon é
#     marcado em "marcar" (o contador "1 de 3" aparece junto); o toque em "Adicionar" antes do corte
pe, pmc = palavra(c_p, 'É'), palavra(c_p, 'marcar')
ev['produto'] = {'rola': [r3(T[3] + 0.3), r3(pe['t0'] - 0.05), 0, RL['Produto_turbine']], 'lupa': [r3(pe['t0'] - 0.12), r3(T[4] - 0.45)],
                 'marca': r3(pmc['t0'] + 0.08), 'toque': r3(T[4] - 0.3)}
# 5 · sacola: sobe como uma folha de baixo; o Smash Duplo acende e o contador pula em "sacola"; o toque em "Continuar"
ev['sacola'] = {'pula': r3(palavra(c_s, 'sacola')['t0'] - 0.05), 'toque': r3(T[5] - 0.28)}
# 6 · pagamento: vira (giro 3D); rola até "Como você quer pagar?"; a lupa abre antes de "Pix" e mostra cada forma na
#     sua palavra (Pix → Cartão de crédito → Pagar na entrega), com o destaque no celular
formas = [r3(palavra(c_pg, x['em'])['t0'] - 0.05) for x in c_pg['diagrama']['formas']]
ev['pagamento'] = {'rola': [r3(T[5] + 0.2), r3(T[5] + 1.0), 0, RL['Checkout_pagar']], 'lupa': [r3(min(formas[0] - 0.45, T[5] + 1.1)), r3(T[6] - 0.12)], 'formas': formas}
# 7 · fecho: o celular se afasta; a logo em "Facim" (para e fica até o fim); "Tudo pertim de você."; o selo "Em breve no
#     Glória" em "Glória"; o Pertim acena e pisca depois da fala
pfa, pgl = palavra(c_f, 'Facim'), palavra(c_f, 'Glória')
lg_e = r3(pfa['t0'] - 0.05)
ev['fecho'] = {'afasta': [r3(T[6] - 0.1), r3(T[6] + 0.5)], 'logo': {'entra': lg_e, 'parada': r3(lg_e + ROT.get('logo_pronta', 0.6))},
               'frase': r3(lg_e + 0.75), 'selo': r3(pgl['t0'] - 0.1), 'pisca': r3(c_f['voz_t1'] + 0.2)}
assert DUR - ev['fecho']['logo']['parada'] >= 3.0 - 1e-6, 'a logo não fica 3 s parada no fim'

# ---------------------------------------------------------------- boca, piscadas e legenda
bocas = fala.visemas(CAPS, FALAS, FPS, NQ)
json.dump({'fps': FPS, 'codigos': fala.CODIGOS, 'bocas': ''.join(bocas)}, open(os.path.join(SAIDA, 'visemas.json'), 'w'))
piscadas = fala.piscadas(bocas, FPS, DUR, inicio=0.9)
LG = LAY['legenda']
blocos = fala.legenda(CAPS, DUR, LG, fim_ultimo=c_f['voz_t1'] + 0.35)
json.dump({'estilo': LG, 'blocos': blocos}, open(os.path.join(SAIDA, 'legenda.json'), 'w'), ensure_ascii=False, indent=1)

cena = {'duracao': DUR, 'fps': FPS, 'quadros': NQ, 'batida': BT, 'bpm': LN['grade']['bpm'],
        'cenas': [{'n': c['n'], 'tipo': c['diagrama']['tipo'], 't0': c['t0'], 't1': c['t1'], 'voz_t0': c['voz_t0'], 'voz_t1': c['voz_t1'],
                   'texto': ' '.join(w['w'] for w in c['palavras'])} for c in CAPS],
        'eventos': ev, 'piscadas': piscadas, 'piscada_dur': 0.16}
json.dump(cena, open(os.path.join(SAIDA, 'cena.json'), 'w'), ensure_ascii=False, indent=1)

# ---------------------------------------------------------------- os efeitos sonoros
E = ev
cues = [{'t': 0.0, 'type': 'pop', 'f': 520}, {'t': E['gancho']['acende'], 'type': 'shine'}, {'t': E['gancho']['logo'], 'type': 'logo'}]
cues += [{'t': T[1] - 0.1, 'type': 'whoosh'}, {'t': E['inicio']['lupa'][0], 'type': 'grow', 'd': 0.3}]
cues += [{'t': x['t'], 'type': 'light', 'i': k} for k, x in enumerate(E['inicio']['cats'])]
cues += [{'t': E['inicio']['rola'][0], 'type': 'slide'}, {'t': E['inicio']['mercado'][0], 'type': 'pop', 'f': 760}, {'t': E['inicio']['toque'], 'type': 'tick'}]
cues += [{'t': T[2], 'type': 'whoosh'}, {'t': E['loja']['rola'][0], 'type': 'slide'}, {'t': E['loja']['lupa'][0], 'type': 'grow', 'd': 0.3},
         {'t': E['loja']['toque'], 'type': 'tick'}]
cues += [{'t': T[3], 'type': 'rise'}, {'t': E['produto']['lupa'][0], 'type': 'grow', 'd': 0.3}, {'t': E['produto']['marca'], 'type': 'check'},
         {'t': E['produto']['toque'], 'type': 'tick'}]
cues += [{'t': T[4], 'type': 'whoosh'}, {'t': E['sacola']['pula'], 'type': 'plop'}, {'t': E['sacola']['pula'] + 0.12, 'type': 'pop', 'f': 880},
         {'t': E['sacola']['toque'], 'type': 'tick'}]
cues += [{'t': T[5], 'type': 'whoosh'}, {'t': E['pagamento']['lupa'][0], 'type': 'grow', 'd': 0.3}]
cues += [{'t': t, 'type': 'light', 'i': k} for k, t in enumerate(E['pagamento']['formas'])]
cues += [{'t': E['fecho']['afasta'][0], 'type': 'whoosh'}, {'t': E['fecho']['logo']['entra'], 'type': 'logo'}, {'t': E['fecho']['frase'], 'type': 'pop', 'f': 700},
         {'t': E['fecho']['selo'], 'type': 'stamp'}, {'t': E['fecho']['pisca'], 'type': 'shine'}]
cues.sort(key=lambda x: x['t'])
json.dump({'duration': DUR, 'cues': cues}, open(os.path.join(AUD, 'cues.json'), 'w'), ensure_ascii=False, indent=1)

print(f'ok -> reels/{EP}/dados/ (cena: {DUR:.2f} s, {NQ} quadros a {FPS} fps; visemas; legenda: {len(blocos)} blocos; {len(piscadas)} piscadas) '
      f'+ cues.json ({len(cues)} efeitos)')
for c in CAPS:
    print(f'  {c["n"]} {c["diagrama"]["tipo"]:10s} {c["t0"]:6.2f}–{c["t1"]:6.2f} s (batidas {c["t0"] / BT:.0f}–{c["t1"] / BT:.0f}) · voz {c["voz_t0"]:.2f}–{c["voz_t1"]:.2f}')
print('  eventos:', json.dumps(ev, ensure_ascii=False))
