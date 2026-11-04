#!/usr/bin/env python3
"""
Tomadas de um capítulo para escolher pela entonação (ex.: uma fala que tem de soar como pergunta).

    python3 scripts/tomadas.py tudo-pertim-06 6 --seeds 42,1042,2042 --palavras quê,Lanche,Pizza,pastel --nome sua-vez
        -> gera uma tomada por seed (cada uma é UMA geração inteira, pelo mesmo caminho do voz.py: a voz do episódio, a
           grafia de pronúncia e o contexto previous/next), confere cada uma como o voz.py (ritmo, pausas, corte pelo som,
           chiado), mede o F0 no fim de cada palavra pedida, grava output/<id>/revisao/<nome>-a.mp3, -b.mp3, … e o
           relatório <nome>-tomadas.txt, e guarda o áudio exato de cada tomada em audio/<id>/tomadas/ (fora do git)
    python3 scripts/tomadas.py tudo-pertim-06 6 --instala b
        -> instala a tomada b (o MESMO áudio medido, não uma geração nova: a seed do v4 não repete o áudio) como a voz
           do capítulo em audio/<id>/voz/cap-NN.wav + falas.json, no formato do voz.py

    --sem-next  não manda o texto do capítulo seguinte como contexto (next_text): use quando a voz começa a falar o
                começo do próximo capítulo no fim da tomada (ex.: um "s" inventado quando o próximo começa com "S…")

    --remedir   refaz só a medição (e o relatório) das tomadas já guardadas, sem chamar a API

Entonação (F0 medido com o Praat, via praat-parselmouth: pitch por autocorrelação, 75–500 Hz, passo de 10 ms). A fala é
dividida em frases pelas pausas do próprio áudio (≥ 120 ms abaixo de 30 dB do pico) e as N últimas frases são as N palavras
pedidas (ex.: "…de quê?" | "Lanche?" | "Pizza?" | "Ou pastel?"; o alinhamento do v4 é grosseiro demais para cortar a
palavra). Em cada frase, o último trecho vozeado agudo (o rangido grave do fim — mediana abaixo de 60% da mediana da fala —
não conta) dá: "sobe" = fim × começo do trecho, e "termina" = fim × mediana da fala inteira, em semitons. Pergunta termina
acima da mediana; afirmação termina abaixo. A melhor tomada é a que passa na conferência e tem o maior "termina" mínimo
entre as palavras (a pior decide), desempatando pela média do "sobe".
"""
import hashlib
import json
import os
import subprocess
import sys
import time
import numpy as np
from scipy.io import wavfile

AQUI = os.path.dirname(os.path.abspath(__file__))
ORIG = sys.argv[:]
EP, N = ORIG[1], int(ORIG[2])
sys.argv = [os.path.join(AQUI, 'voz.py'), EP]          # o voz.py lê o episódio do argv ao ser importado
sys.path.insert(0, AQUI)
import voz  # noqa: E402  (tts, confere, palavras, para_api, a voz do episódio)

ROOT = voz.ROOT
OPT = {}
_a = ORIG[3:]
for i, k in enumerate(_a):
    if k.startswith('--'):
        OPT[k[2:]] = _a[i + 1] if i + 1 < len(_a) and not _a[i + 1].startswith('--') else True
KEY = f'{N:02d}'
TOM = os.path.join(ROOT, 'audio', EP, 'tomadas')
REV = os.path.join(ROOT, 'output', EP, 'revisao')
SR = voz.SR


def norm(s):
    import unicodedata
    s = unicodedata.normalize('NFD', s.lower())
    return ''.join(c for c in s if c.isalnum() and unicodedata.category(c) != 'Mn')


def entonacao(path, n):
    """[(sobe_st, termina_st)] das n últimas frases (ver o cabeçalho) e a mediana do F0"""
    import parselmouth
    snd = parselmouth.Sound(path)
    it = snd.to_intensity(time_step=0.01)
    iv = it.values[0]
    fala = iv > iv.max() - 30
    segs, ini, sil, fim = [], None, 0, None
    for tt, fl in zip(it.xs(), fala):
        if fl:
            ini = tt if ini is None else ini
            fim, sil = tt, 0
        elif ini is not None:
            sil += 0.01
            if sil >= 0.12:
                segs.append((ini, fim)); ini, sil = None, 0
    if ini is not None:
        segs.append((ini, fim))
    pt = snd.to_pitch_ac(time_step=0.01, pitch_floor=75, pitch_ceiling=500, very_accurate=True)
    tp, f = pt.xs(), pt.selected_array['frequency']
    med = float(np.median(f[f > 0]))
    out = []
    for a, b in segs[-n:]:
        idx = np.where((tp >= a - 0.02) & (tp <= b + 0.04) & (f > 0))[0]
        runs = [r for r in np.split(idx, np.where(np.diff(idx) > 2)[0] + 1) if len(r) >= 3 and np.median(f[r]) >= 0.6 * med]
        if not runs:
            out.append((None, None)); continue
        run = f[runs[-1]]
        out.append((round(float(12 * np.log2(run[-1] / run[0])), 1), round(float(12 * np.log2(run[-1] / med)), 1)))
    return out, round(med)


def relatorio(res, api, nome, prev, nxt):
    boas = [r for r in res if r['ok']]
    melhor = max(boas, key=lambda r: (r['min'], r['media'])) if boas else None
    linhas = [f"{nome}-{r['letra']}.mp3 · seed {r['seed']} · {r['dur']} s · conferência: {r['motivo']} · F0 mediano {r['med']} Hz · "
              + ', '.join(f'{w}: sobe {"—" if v[0] is None else f"{v[0]:+.1f}"} st, termina {"—" if v[1] is None else f"{v[1]:+.1f}"} st' for w, v in r['ent'].items()) for r in res]
    txt = (f'Tomadas do capítulo {KEY} de {EP} (voz {voz.VOZ["name"]}, {voz.MODEL}; texto enviado: "{api}"; '
           f'contexto: previous_text {"sim" if prev else "não"}, next_text {"sim" if nxt else "não"}) — {time.strftime("%Y-%m-%d %H:%M")}\n\n' + '\n'.join(linhas)
           + (f'\n\nMELHOR: {nome}-{melhor["letra"]}.mp3 (seed {melhor["seed"]}): a pior palavra termina {melhor["min"]:+.1f} st da mediana (pergunta: acima); subida média {melhor["media"]:+.1f} st\n'
              if melhor else '\n\nNENHUMA tomada passou na conferência.\n'))
    open(os.path.join(REV, f'{nome}-tomadas.txt'), 'a').write(txt + '\n')
    print(txt)


def medida(letra, alvo):
    d = json.load(open(os.path.join(TOM, f'cap-{KEY}-{letra}.json')))
    ent, med = entonacao(os.path.join(TOM, f'cap-{KEY}-{letra}.wav'), len(alvo))
    ent = dict(zip(alvo, ent))
    fins = [v[1] for v in ent.values() if v[1] is not None]
    subs = [v[0] for v in ent.values() if v[0] is not None]
    sr, pcm = wavfile.read(os.path.join(TOM, f'cap-{KEY}-{letra}.wav'))
    return d, {'letra': letra, 'seed': d['seed'], 'ok': d['confere'][0], 'motivo': d['confere'][1], 'ent': ent, 'med': med,
               'min': min(fins) if len(fins) == len(alvo) else -99, 'media': float(np.mean(subs)) if subs else -99, 'dur': round(len(pcm) / sr, 2)}


def gerar():
    c = voz.SCRIPT['capitulos'][N]
    caps = voz.SCRIPT['capitulos']
    texto = voz.texto_cap(c)
    voz.confere_texto(texto)
    api = voz.para_api(texto, voz.SCRIPT, c)
    prev = voz.para_api(voz.texto_cap(caps[N - 1]), voz.SCRIPT, caps[N - 1]) if N else None
    nxt = voz.para_api(voz.texto_cap(caps[N + 1]), voz.SCRIPT, caps[N + 1]) if N + 1 < len(caps) and 'sem-next' not in OPT else None
    seeds = [int(s) for s in str(OPT.get('seeds', '42,1042,2042')).split(',')]
    alvo = [w for w in str(OPT.get('palavras', '')).split(',') if w]
    nome = OPT.get('nome', f'cap-{KEY}')
    os.makedirs(TOM, exist_ok=True); os.makedirs(REV, exist_ok=True)
    res = []
    for j, seed in enumerate(seeds):
        letra = 'abcdefgh'[j]
        x, al, fmt = voz.tts(api, prev, nxt, seed)
        ok, motivo, num = voz.confere(x, al, api)
        pcm = np.round(np.clip(x, -1, 1) * 32767).astype(np.int16)
        wavfile.write(os.path.join(TOM, f'cap-{KEY}-{letra}.wav'), SR, pcm)
        json.dump({'seed': seed, 'formato': fmt, 'texto': texto, 'texto_api': api, 'contexto': {'previous_text': prev, 'next_text': nxt}, 'alinhamento': al,
                   'confere': [ok, motivo, num], 'palavras': alvo}, open(os.path.join(TOM, f'cap-{KEY}-{letra}.json'), 'w'), ensure_ascii=False)
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', os.path.join(TOM, f'cap-{KEY}-{letra}.wav'), '-codec:a', 'libmp3lame', '-b:a', '192k',
                        os.path.join(REV, f'{nome}-{letra}.mp3')], check=True)
        d, r = medida(letra, alvo)
        res.append(r)
        d['entonacao'] = r['ent']; json.dump(d, open(os.path.join(TOM, f'cap-{KEY}-{letra}.json'), 'w'), ensure_ascii=False)
    relatorio(res, api, nome, prev, nxt)


def remedir():
    alvo = [w for w in str(OPT.get('palavras', '')).split(',') if w]
    nome = OPT.get('nome', f'cap-{KEY}')
    res, d = [], None
    for letra in 'abcdefgh':
        if not os.path.exists(os.path.join(TOM, f'cap-{KEY}-{letra}.json')):
            break
        d, r = medida(letra, alvo)
        res.append(r)
        d['entonacao'] = r['ent']; json.dump(d, open(os.path.join(TOM, f'cap-{KEY}-{letra}.json'), 'w'), ensure_ascii=False)
    relatorio(res, d['texto_api'], nome, d['contexto']['previous_text'], d['contexto']['next_text'])


def instala(letra):
    d = json.load(open(os.path.join(TOM, f'cap-{KEY}-{letra}.json')))
    sr, pcm = wavfile.read(os.path.join(TOM, f'cap-{KEY}-{letra}.wav'))
    x = pcm.astype(np.float32) / 32768
    ok, motivo, num = voz.confere(x, d['alinhamento'], d['texto_api'])
    if not ok:
        raise SystemExit(f'a tomada {letra} não passa na conferência: {motivo}')
    c = voz.SCRIPT['capitulos'][N]
    assert d['texto'] == voz.texto_cap(c) and d['texto_api'] == voz.para_api(d['texto'], voz.SCRIPT, c), 'o texto mudou desde a tomada'
    path = os.path.join(voz.OUT, 'falas.json')
    D = json.load(open(path))
    atual = D['capitulos'].get(KEY)
    hist = (atual['historico'] if atual and atual['texto'] == d['texto'] else [])
    hist.append({'seed': d['seed'], 'formato': d['formato'], 'resultado': motivo, **num, 'quando': time.strftime('%Y-%m-%d %H:%M'), 'tomada': letra})
    wavfile.write(os.path.join(voz.OUT, f'cap-{KEY}.wav'), SR, pcm)
    ws = voz.palavras(d['alinhamento'])
    D['capitulos'][KEY] = {'n': N, 'texto': d['texto'], 'texto_api': d['texto_api'], 'seed': d['seed'], 'formato': d['formato'], 'duracao_audio': round(len(x) / SR, 3),
                           'inicio_da_fala': round(ws[0]['t0'], 3), 'fim_da_fala': round(voz.chiado.ultima_letra(d['alinhamento'], x, SR), 3),
                           'sha1_audio': hashlib.sha1(pcm.tobytes()).hexdigest(), 'geracoes': len(hist), 'historico': hist, 'alinhamento': d['alinhamento'],
                           'tomada': letra, 'entonacao': d.get('entonacao')}
    if voz.versao(voz.SCRIPT) == 'v4':
        D['capitulos'][KEY]['pronuncia_planoB'] = c.get('pronuncia')
    json.dump(D, open(path, 'w'), ensure_ascii=False, indent=1)
    print(f'instalada a tomada {letra} (seed {d["seed"]}) em {os.path.relpath(os.path.join(voz.OUT, f"cap-{KEY}.wav"), ROOT)}')


if __name__ == '__main__':
    if 'instala' in OPT:
        instala(OPT['instala'])
    elif 'remedir' in OPT:
        remedir()
    else:
        gerar()
