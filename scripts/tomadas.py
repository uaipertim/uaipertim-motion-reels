#!/usr/bin/env python3
"""
TOMADAS A/B de uma fala (ElevenLabs, voz oficial, perfil do roteiro) — com a medição de cada tomada.

    python3 scripts/tomadas.py <id> <cap> [--seeds 42,1042,2042] [--grafia "UaiPertim=UaiPértim"] [--rotulo b]
        gera uma tomada por seed (e por grafia, se houver) da fala INTEIRA do capítulo <cap> do roteiro <id>
        -> reels/<id>/tomadas/cap-NN/<L>-seed<S>[-<rotulo>].wav + .mp3 (para ouvir) + .json (alinhamento)
           reels/<id>/tomadas/cap-NN/medidas.json e a tabela no console
        --sem-contexto: sem o texto vizinho (previous_text/next_text) na chamada
        --perfil pausas: só para comparar, as tomadas no outro perfil da voz oficial (o vídeo segue o perfil do roteiro)
        --antes "..." / --depois "...": outro texto vizinho (só contexto da entonação; não é falado)
    python3 scripts/tomadas.py <id> <cap> --medir          só mede de novo as tomadas que já existem (sem API)
    python3 scripts/tomadas.py <id> <cap> --usar <L>       a tomada <L> vira a fala do capítulo (audio/<id>/voz/cap-NN.wav +
                                                           falas.json, com a origem registrada); depois rode linha.py

O roteiro é reels/explica-so/episodios/<id>.json ou reels/<id>/roteiro.json; a voz, o perfil e a regra de pronúncia são
os de reels/explica-so/scripts/voz.py (o mesmo tts(), a mesma conferência). Cada tomada é UMA geração inteira da fala
do capítulo: nada é cortado nem emendado.

MEDIDAS (indicativas; quem decide é o ouvido):
  • fala_s e ritmo (letras/s), maior pausa interna;
  • pergunta (fala que termina em "?"): o F0 (YIN, janela 40 ms, passo 10 ms) da última palavra — o F0 no começo
    dela (mediana dos 1ºs 0,10 s com voz), o mínimo, o F0 no fim (mediana dos últimos 0,10 s com voz) e a subida
    fim − mínimo em semitons. "sobe" = +2 st ou mais;
  • cada "Pertim"/"UaiPertim": a vogal do PER (F1: "é" aberto ≳ 480 Hz) e a do TIM (duração e F0: a força), e o fim
    (murmúrio nasal + F2 caindo = lábios, "im"; F2 alto = "in").

A chave da API NÃO aparece aqui: nesta nuvem a rede a põe no cabeçalho xi-api-key; fora dela, ELEVENLABS_API_KEY.
"""
import hashlib
import json
import os
import re
import subprocess
import sys
import time
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter, resample_poly, sosfilt

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARGS = sys.argv[1:]
if len(ARGS) < 2:
    raise SystemExit(__doc__)
EP, CAP = ARGS[0], int(ARGS[1])


def opt(nome, padrao=None):
    return ARGS[ARGS.index(nome) + 1] if nome in ARGS else padrao


# o voz.py do Explica, Sô! lê o episódio de sys.argv[1]: carrega com o argv dele
sys.argv = ['voz.py', EP]
sys.path.insert(0, os.path.join(REPO, 'reels', 'explica-so', 'scripts'))
import voz  # noqa: E402

# --perfil <nome>: só para COMPARAR (amostras): gera as tomadas com outro perfil da voz oficial (ex.: "pausas")
if opt('--perfil'):
    voz.PERFIL = opt('--perfil')
    voz.VOZ = voz.perfil(voz.PERFIL)
    voz.MODEL, voz.SETTINGS = voz.VOZ['model'], voz.VOZ['voiceSettings']
    voz.PASSO = 0.04 if voz.MODEL == 'eleven_v4' else 0.0
C = voz.SCRIPT['capitulos'][CAP]
KEY = f'{CAP:02d}'
PASTA = os.path.join(REPO, 'reels', EP, 'tomadas', f'cap-{KEY}')
SR = voz.SR


# ---------------------------------------------------------------- acústica
def f0_trilha(y, sr, t0, t1, fmin=70, fmax=400):
    """[(t, f0 ou None)] a cada 10 ms (YIN simples, como em audio/teste-v4/analisar.py)"""
    lo = sosfilt(butter(4, 900, 'low', fs=sr, output='sos'), y)
    n, out, t = int(0.04 * sr), [], t0
    W, ks = n // 2, np.arange(int(sr / fmax), int(sr / fmin))
    while t + 0.04 <= t1 + 0.02:
        fr = lo[int(t * sr):int(t * sr) + n]
        f = None
        if len(fr) == n:
            fr = fr - fr.mean()
            if np.sqrt(np.mean(fr ** 2)) > 0.006:
                d = np.array([np.sum((fr[:W] - fr[k:k + W]) ** 2) for k in ks])
                cm = d / (np.cumsum(d) / np.arange(1, len(d) + 1) + 1e-12)
                idx = np.where(cm < 0.15)[0]
                if len(idx):
                    i = idx[0]
                    while i + 1 < len(cm) and cm[i + 1] < cm[i]:
                        i += 1
                    f = sr / ks[i]
        out.append((round(t + 0.02, 3), f))
        t += 0.01
    return out


def mediana(fs):
    fs = [f for f in fs if f]
    return float(np.median(fs)) if fs else None


def formantes(y, sr, t0, t1):
    seg = resample_poly(y[max(0, int(t0 * sr) - 200):int(t1 * sr) + 200], 10000, sr)
    res = []
    for k in range(0, len(seg) - 200, 50):
        fr = lfilter([1, -0.63], 1, seg[k:k + 200] * np.hamming(200))
        if np.sqrt(np.mean(fr ** 2)) < 0.006:
            continue
        o = 10
        r = np.correlate(fr, fr, 'full')[199:199 + o + 1]
        R = np.array([[r[abs(a - b)] for b in range(o)] for a in range(o)])
        a = np.linalg.solve(R + 1e-9 * np.eye(o), -r[1:o + 1])
        rt = np.roots(np.concatenate([[1], a]))
        rt = rt[np.imag(rt) > 0]
        f = sorted(ff for ff, bw in zip(np.angle(rt) * 5000 / np.pi, -np.log(np.abs(rt)) * 10000 / np.pi) if ff > 200 and bw < 500)
        if len(f) >= 2:
            res.append(f[:2])
    return res


def letras(al):
    return list(zip(al['characters'], al['character_start_times_seconds'], al['character_end_times_seconds']))


def palavras(L):
    out, cur, i0 = [], '', None
    for i, (c, a, b) in enumerate(L):
        if c.isspace():
            if cur:
                out.append((cur, i0, i - 1))
            cur, i0 = '', None
            continue
        if i0 is None:
            i0 = i
        cur += c
    if cur:
        out.append((cur, i0, len(L) - 1))
    return [w for w in out if re.search(r'\w', w[0])]


def pergunta(y, sr, L):
    """a subida do F0 na última palavra de uma fala que termina em "?" """
    W = palavras(L)
    w, i0, i1 = W[-1]
    alfa = [k for k in range(i0, i1 + 1) if L[k][0].isalnum()]
    a, b = L[alfa[0]][1], L[alfa[-1]][2]
    # o fim da fala de verdade: a energia (o alinhamento do v4 vem em degraus de ~40 ms)
    env = np.sqrt(np.convolve(y ** 2, np.ones(int(0.01 * sr)) / int(0.01 * sr), 'same'))
    lim = env.max() * 10 ** (-35 / 20)
    k = min(len(y) - 1, int((b + 0.25) * sr))
    while k > int(a * sr) and env[k] < lim:
        k -= 1
    b = max(b, k / sr)
    tr = f0_trilha(y, sr, a, b)
    voz_ = [(t, f) for t, f in tr if f]
    if len(voz_) < 4:
        return {'palavra': w, 'erro': 'F0 não medido'}
    ini = mediana([f for t, f in voz_ if t <= voz_[0][0] + 0.10])
    fim = mediana([f for t, f in voz_ if t >= voz_[-1][0] - 0.10])
    mn = min(f for t, f in voz_)
    tmin = next(t for t, f in voz_ if f == mn)
    st = 12 * np.log2(fim / mn)
    # a última vogal (a postônica de "fome?"): o F0 no começo dela × no fim da fala. É ela que tem que subir
    jv = max(k for k in range(i0, i1 + 1) if L[k][0].lower() in 'aeiouáéíóúâêôãõ')
    tv = [(t, f) for t, f in tr if f and t >= L[jv][1]]
    pv = None
    if len(tv) >= 3:
        v0 = mediana([f for t, f in tv if t <= tv[0][0] + 0.06])
        v1 = mediana([f for t, f in tv if t >= tv[-1][0] - 0.06])
        pv = {'f0_inicio_hz': round(v0), 'f0_fim_hz': round(v1), 'st': round(float(12 * np.log2(v1 / v0)), 1), 'quadros_com_voz': len(tv)}
    return {'ultima_vogal': pv,'palavra': w, 'de_s': round(a, 3), 'ate_s': round(b, 3), 'f0_inicio_hz': round(ini), 'f0_min_hz': round(mn), 't_min_s': round(tmin, 3),
            'f0_fim_hz': round(fim), 'subida_st': round(float(st), 1), 'fim_vs_inicio_st': round(float(12 * np.log2(fim / ini)), 1),
            'sobe': bool(pv and pv['st'] >= 2.0),
            'contorno_hz': [round(f) if f else 0 for t, f in tr][::2]}


def pertins(y, sr, L):
    txt = ''.join(c for c, _, _ in L)
    res = []
    for m in re.finditer(r'(Uai ?)?[Pp][ée]rr?-?t[ií]m', txt):
        s, w = m.start(), m.group(0)
        je = s + w.lower().rindex('p') + 1                    # a vogal do PER
        ji = s + len(w) - 2                                   # o i do TIM
        jm = s + len(w) - 1                                   # o m
        ve = {'dur': round(L[je][2] - L[je][1], 3), 'f0': mediana([f for t, f in f0_trilha(y, sr, L[je][1], L[je][2])])}
        vi = {'dur': round(L[ji][2] - L[ji][1], 3), 'f0': mediana([f for t, f in f0_trilha(y, sr, L[ji][1], L[ji][2])])}
        fe = formantes(y, sr, L[je][1], L[je][2])
        f1e = round(float(np.max([x[0] for x in fe]))) if fe else None
        fs = formantes(y, sr, L[ji][1], L[jm][2])
        f2m = round(float(np.median([x[1] for x in fs[: max(1, len(fs) // 2)]]))) if fs else None
        f2f = round(float(np.median([x[1] for x in fs[-2:]]))) if len(fs) >= 2 else None
        pt = (vi['dur'] > ve['dur']) + ((vi['f0'] or 0) > (ve['f0'] or 0))
        res.append({'grafia': w, 'F1_PER_max_hz': f1e, 'E_aberto': bool(f1e and f1e >= 480),
                    'vogal_PER': {'dur': ve['dur'], 'f0': round(ve['f0']) if ve['f0'] else None},
                    'vogal_TIM': {'dur': vi['dur'], 'f0': round(vi['f0']) if vi['f0'] else None},
                    'forca': 'TIM' if pt >= 1 and vi['dur'] >= ve['dur'] else 'PER',
                    'F2_meio': f2m, 'F2_fim': f2f, 'fim': 'im (F2 cai)' if f2m and f2f and f2m - f2f >= 300 else 'in? (F2 alto)'})
    return res


def medir_tomada(base):
    J = json.load(open(base + '.json'))
    sr, y = wavfile.read(base + '.wav')
    y = y.astype(np.float64) / 32768
    L = letras(J['alinhamento'])
    ok, motivo, num = voz.confere(y, J['alinhamento'], J['texto_api'])
    m = {'tomada': J['letra'], 'arquivo': os.path.basename(base) + '.mp3', 'seed': J['seed'], 'texto_api': J['texto_api'], 'conferencia': motivo, **num}
    if J['texto'].rstrip().endswith('?'):
        m['pergunta'] = pergunta(y, sr, L)
    pt = pertins(y, sr, L)
    if pt:
        m['pertim'] = pt
    return m


# ---------------------------------------------------------------- gerar / medir / usar
def bases():
    if not os.path.isdir(PASTA):
        return []
    return sorted(os.path.join(PASTA, f[:-5]) for f in os.listdir(PASTA) if f.endswith('.json') and f != 'medidas.json')


def gerar():
    os.makedirs(PASTA, exist_ok=True)
    texto = voz.texto_cap(C)
    voz.confere_texto(texto)
    caps = voz.SCRIPT['capitulos']
    grafias = [None]
    if opt('--grafia'):
        grafias = [dict(kv.split('=', 1) for kv in opt('--grafia').split(';'))]
    seeds = [int(s) for s in (opt('--seeds') or str(C.get('seed', voz.SEED0))).split(',')]
    rot = opt('--rotulo')
    ja = len(bases())
    k = ja
    for g in grafias:
        c = dict(C)
        if g:
            c['pronuncia'] = {**(C.get('pronuncia') or {}), **g}
        api = voz.pron(c, texto)
        prev = voz.pron(caps[CAP - 1], voz.texto_cap(caps[CAP - 1])) if CAP else None
        nxt = voz.pron(caps[CAP + 1], voz.texto_cap(caps[CAP + 1])) if CAP + 1 < len(caps) else None
        if '--sem-contexto' in ARGS:                  # sem previous_text/next_text (a fala sozinha)
            prev = nxt = None
        if opt('--antes') is not None:                # previous_text/next_text próprios (só contexto: não são falados)
            prev = opt('--antes') or None
        if opt('--depois') is not None:
            nxt = opt('--depois') or None
        for s in seeds:
            letra = chr(ord('A') + k) if k < 26 else chr(ord('A') + k // 26 - 1) + chr(ord('A') + k % 26)
            x, al, fmt = voz.tts(api, prev, nxt, s)
            base = os.path.join(PASTA, f'{letra}-seed{s}' + (f'-{rot}' if rot else ''))
            pcm = np.round(np.clip(x, -1, 1) * 32767).astype(np.int16)
            wavfile.write(base + '.wav', SR, pcm)
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', base + '.wav', '-c:a', 'libmp3lame', '-b:a', '192k', base + '.mp3'], check=True)
            json.dump({'letra': letra, 'cap': CAP, 'texto': texto, 'texto_api': api, 'seed': s, 'perfil': voz.PERFIL, 'modelo': voz.MODEL,
                       'contexto': {'previous_text': prev, 'next_text': nxt}, 'formato': fmt, 'sha1_audio': hashlib.sha1(pcm.tobytes()).hexdigest(), 'quando': time.strftime('%Y-%m-%d %H:%M'),
                       'alinhamento': al}, open(base + '.json', 'w'), ensure_ascii=False)
            print(f'  {letra}: seed {s} · "{api}"')
            k += 1


def medir():
    M = [medir_tomada(b) for b in bases()]
    json.dump({'episodio': EP, 'cap': CAP, 'texto': voz.texto_cap(C), 'voz': voz.VOZ['name'], 'perfil': voz.PERFIL, 'modelo': voz.MODEL,
               'tomadas': M}, open(os.path.join(PASTA, 'medidas.json'), 'w'), ensure_ascii=False, indent=1)
    print(f'cap {KEY} · "{voz.texto_cap(C)}"')
    for m in M:
        lin = f'  {m["tomada"]} seed {m["seed"]:>5} · {m["fala_s"]:.2f} s · {m["ritmo_letras_s"]} letras/s · pausa {m["maior_pausa_s"]} s · {m["conferencia"]}'
        p = m.get('pergunta')
        if p and 'erro' not in p:
            v = p['ultima_vogal'] or {}
            lin += (f' · "{p["palavra"]}" F0 {p["f0_inicio_hz"]}→mín {p["f0_min_hz"]}→fim {p["f0_fim_hz"]} Hz · última vogal {v.get("f0_inicio_hz")}→{v.get("f0_fim_hz")} Hz '
                    f'({v.get("st", 0):+.1f} st) {"SOBE" if p["sobe"] else "não sobe"}')
        for q in m.get('pertim', []):
            lin += f' · {q["grafia"]}: F1 é {q["F1_PER_max_hz"]} Hz, força {q["forca"]}, fim {q["fim"]}'
        print(lin)


def usar(letra):
    b = next((x for x in bases() if os.path.basename(x).startswith(letra + '-')), None)
    if not b:
        raise SystemExit(f'tomada {letra} não existe em {PASTA}')
    J = json.load(open(b + '.json'))
    texto = voz.texto_cap(C)
    if J['texto'] != texto:
        raise SystemExit('o texto da tomada não é o do roteiro')
    sr, y = wavfile.read(b + '.wav')
    x = y.astype(np.float32) / 32768
    ok, motivo, num = voz.confere(x, J['alinhamento'], J['texto_api'])
    os.makedirs(voz.OUT, exist_ok=True)
    wavfile.write(os.path.join(voz.OUT, f'cap-{KEY}.wav'), sr, y)
    path = os.path.join(voz.OUT, 'falas.json')
    D = json.load(open(path)) if os.path.exists(path) else {'capitulos': {}}
    ant = D['capitulos'].get(KEY)
    hist = (ant['historico'] if ant and ant['texto'] == texto else []) + [
        {'seed': J['seed'], 'texto_api': J['texto_api'], 'formato': J['formato'], 'resultado': motivo, **num, 'quando': J['quando'],
         'origem': f'tomada {letra} ({os.path.relpath(b, REPO)}.mp3)'}]
    ws = voz.palavras(J['alinhamento'])
    D['capitulos'][KEY] = {'n': CAP, 'texto': texto, 'texto_api': J['texto_api'], 'perfil': J['perfil'], 'modelo': J['modelo'], 'seed': J['seed'],
                           'formato': J['formato'], 'duracao_audio': round(len(x) / sr, 3), 'inicio_da_fala': round(ws[0]['t0'], 3),
                           'fim_da_fala': round(ws[-1]['fim_letra'], 3), 'sha1_audio': J['sha1_audio'], 'geracoes': len(hist), 'historico': hist,
                           'tomada': {'letra': letra, 'arquivo': os.path.relpath(b, REPO) + '.mp3'}, 'alinhamento': J['alinhamento']}
    D.update({'voz': voz.VOZ['name'], 'voice_id': voz.VOICE, 'perfil': voz.PERFIL, 'modelo': voz.MODEL, 'ajustes': voz.SETTINGS,
              'pronuncia': voz.VOZ.get('pronuncia', {}), 'regra': 'uma geração inteira por capítulo; nada emendado'})
    json.dump(D, open(path, 'w'), ensure_ascii=False, indent=1)
    # se a tomada usa uma grafia própria, ela precisa estar no campo "pronuncia" do capítulo (linha.py confere)
    if J['texto_api'] != voz.pron(C, texto):
        print(f'  ATENÇÃO: a tomada foi enviada como "{J["texto_api"]}"; ponha a grafia no campo "pronuncia" do capítulo {KEY}')
    print(f'ok: tomada {letra} (seed {J["seed"]}) é a fala do capítulo {KEY} · {motivo}')


if __name__ == '__main__':
    if '--usar' in ARGS:
        usar(opt('--usar'))
    else:
        if '--medir' not in ARGS:
            gerar()
        medir()
