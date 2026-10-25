#!/usr/bin/env python3
"""
Medições do teste de voz (sem API): lê audio/teste-v4/saida/*.json + .wav e escreve as tabelas em saida/medidas.json.
  • "domingo": a vogal de cada sílaba (do · min · go): duração (alinhamento) e F0 → a tônica é a mais longa/aguda.
  • "UaiPertim": a vogal do PER e a do TIM (duração e F0) → onde está a força; e o fim do TIM: se fecha com murmúrio
    nasal (consoante) e para onde vai o F2 no fim da vogal (cai = lábios fechando, "im"; fica alto = língua, "in").
  • pausas (<break time="0.4s" />): o silêncio medido no áudio entre a palavra antes e a depois de cada pausa.
  • seed: as duas gerações iguais de B-v4-perr-tim (bytes, duração e semelhança da onda).
Indicativo: alinhamento por caractere + acústica simples. Quem decide é o ouvido.
"""
import glob, json, os, re
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter, resample_poly, sosfilt

SAIDA = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'saida')


def carrega(nome):
    J = json.load(open(os.path.join(SAIDA, nome + '.json')))
    sr, y = wavfile.read(os.path.join(SAIDA, nome + '.wav'))
    al = J['alinhamento']
    C = list(zip(al['characters'], al['character_start_times_seconds'], al['character_end_times_seconds']))
    return J, sr, y.astype(float) / 32768, C


def f0(y, sr, t0, t1, fmin=70, fmax=320):
    lo = sosfilt(butter(4, 900, 'low', fs=sr, output='sos'), y)
    n, out, t = int(0.04 * sr), [], t0
    while t + 0.04 <= max(t1, t0 + 0.04):
        fr = lo[int(t * sr):int(t * sr) + n]; fr = fr - fr.mean()
        if np.sqrt(np.mean(fr ** 2)) > 0.008:
            W, ks = n // 2, np.arange(int(sr / fmax), int(sr / fmin))
            d = np.array([np.sum((fr[:W] - fr[k:k + W]) ** 2) for k in ks])
            cm = d / (np.cumsum(d) / np.arange(1, len(d) + 1) + 1e-12)
            idx = np.where(cm < 0.15)[0]
            if len(idx):
                i = idx[0]
                while i + 1 < len(cm) and cm[i + 1] < cm[i]: i += 1
                out.append(sr / ks[i])
        t += 0.01
    return round(float(np.median(out))) if out else None


def formantes(y, sr, t0, t1):
    seg = resample_poly(y[max(0, int(t0 * sr) - 200):int(t1 * sr) + 200], 10000, sr); res = []
    for k in range(0, len(seg) - 200, 50):
        fr = lfilter([1, -0.63], 1, seg[k:k + 200] * np.hamming(200))
        if np.sqrt(np.mean(fr ** 2)) < 0.006: continue
        o = 10; r = np.correlate(fr, fr, 'full')[199:199 + o + 1]
        R = np.array([[r[abs(a - b)] for b in range(o)] for a in range(o)])
        a = np.linalg.solve(R + 1e-9 * np.eye(o), -r[1:o + 1]); rt = np.roots(np.concatenate([[1], a])); rt = rt[np.imag(rt) > 0]
        f = sorted(ff for ff, bw in zip(np.angle(rt) * 5000 / np.pi, -np.log(np.abs(rt)) * 10000 / np.pi) if ff > 200 and bw < 500)
        if len(f) >= 2: res.append(f[:2])
    return res


def vogal(y, sr, C, j):
    a, b = C[j][1], C[j][2]
    return {'dur': round(b - a, 3), 'f0': f0(y, sr, a, b)}


def palavras(C):
    """(texto, início, fim, índice do 1º caractere) de cada palavra do alinhamento"""
    out, cur, i0 = [], '', None
    for i, (c, a, b) in enumerate(C):
        if c.isspace():
            if cur: out.append((cur, C[i0][1], C[i - 1][2], i0))
            cur, i0 = '', None
            continue
        if i0 is None: i0 = i
        cur += c
    if cur: out.append((cur, C[i0][1], C[-1][2], i0))
    return out


def domingos(nome):
    J, sr, y, C = carrega(nome); res = []
    for w, a, b, i0 in palavras(C):
        if re.sub(r'[^a-z]', '', w.lower()) != 'domingo': continue
        vs = [i0 + k for k, c in enumerate(w) if c.lower() in 'oi'][:3]          # do · min · go
        s = [vogal(y, sr, C, j) for j in vs]
        dur = [x['dur'] for x in s]; f = [x['f0'] or 0 for x in s]
        pontos = [(dur[k] == max(dur)) + (f[k] == max(f)) for k in range(3)]
        ton = ['do', 'MIN', 'go'][int(np.argmax(pontos))] if max(pontos) else '?'
        fim = bool(re.search(r'[.?!]$', w))
        res.append({'palavra': w, 'fim_de_frase': fim, 'do': s[0], 'min': s[1], 'go': s[2], 'tonica': ton.lower() if ton != 'MIN' else 'min'})
    return res


def pertins(nome):
    """cada UaiPertim: a vogal do PER e a do TIM; o fim do TIM (murmúrio nasal e F2 no fim da vogal)"""
    J, sr, y, C = carrega(nome); txt = ''.join(c for c, _, _ in C); res = []
    for m in re.finditer(r'Uai ?P[ée]rr?-?t[ií]m', txt):
        s = m.start(); w = m.group(0)
        je = s + w.lower().index('p') + 1                                       # a vogal do PER
        jt = s + len(w) - 3                                                     # o t
        ji, jm = jt + 1, jt + 2                                                 # o i e o m do TIM
        ve, vi = vogal(y, sr, C, je), vogal(y, sr, C, ji)
        a, b = C[ji][1], C[jm][2]                                               # do começo do i ao fim do m
        fs = formantes(y, sr, a, b)
        f2m = round(float(np.median([x[1] for x in fs[: max(1, len(fs) // 2)]]))) if fs else None
        f2f = round(float(np.median([x[1] for x in fs[-2:]]))) if len(fs) >= 2 else None
        # murmúrio nasal: o trecho do fim com energia baixa e concentrada abaixo de 500 Hz
        seg = y[int(a * sr):int(b * sr)]; hop = int(0.01 * sr); mur = 0
        for k in range(0, max(0, len(seg) - hop), hop):
            fr = seg[k:k + hop]
            if len(fr) < hop: break
            sp = np.abs(np.fft.rfft(fr * np.hanning(len(fr)))) ** 2; fq = np.fft.rfftfreq(len(fr), 1 / sr)
            if sp[fq < 500].sum() / (sp.sum() + 1e-12) > 0.85 and np.sqrt(np.mean(fr ** 2)) > 0.004: mur += 1
        forca = 'TIM' if (vi['dur'] > ve['dur']) + ((vi['f0'] or 0) > (ve['f0'] or 0)) >= 2 else ('PER' if (vi['dur'] < ve['dur']) + ((vi['f0'] or 0) < (ve['f0'] or 0)) >= 2 else 'empate')
        if mur * 10 < 30:
            fim = 'vogal nasal, sem consoante marcada'
        elif f2m and f2f and f2m - f2f >= 400:
            fim = 'fecha com consoante nasal, F2 caindo (lábios: "im")'
        else:
            fim = 'fecha com consoante nasal, F2 alto (língua: "in")'
        res.append({'grafia': w, 'fim_de_frase': txt[m.end():m.end() + 1] in '.?!', 'vogal_PER': ve, 'vogal_TIM': vi, 'forca': forca,
                    'murmurio_ms': mur * 10, 'F2_meio': f2m, 'F2_fim': f2f, 'fim': fim})
    return res


def pausas(nome):
    J, sr, y, C = carrega(nome); txt = ''.join(c for c, _, _ in C); res = []
    env = np.sqrt(np.convolve(y ** 2, np.ones(int(0.01 * sr)) / int(0.01 * sr), 'same'))
    lim = env.max() * 10 ** (-40 / 20)
    tem_tag = '<break' in txt
    # as palavras antes e depois de cada pausa
    pares = [('Domingo.', 'Substantivo.'), ('Substantivo.', 'O'), ('fome.', 'Exemplo:')]
    W = palavras(C)
    for a_, b_ in pares:
        ia = next((k for k, w in enumerate(W) if w[0] == a_), None)
        if ia is None: res.append({'entre': f'{a_} / {b_}', 'erro': 'palavra não encontrada no alinhamento'}); continue
        ib = next((k for k in range(ia + 1, len(W)) if W[k][0] == b_), None)
        t0, t1 = W[ia][2], W[ib][1]
        z = env[int(t0 * sr):int(t1 * sr)] < lim
        # o maior trecho contínuo de silêncio entre as duas palavras
        best = cur = 0
        for v in z:
            cur = cur + 1 if v else 0; best = max(best, cur)
        res.append({'entre': f'{a_} / {b_}', 'intervalo_alinhamento_s': round(t1 - t0, 3), 'silencio_medido_s': round(best / sr, 3)})
    return {'tag_no_alinhamento': tem_tag, 'pausas': res}


def seed():
    a, b = (json.load(open(os.path.join(SAIDA, n + '.json'))) for n in ('B-v4-perr-tim', 'B-v4-perr-tim-repetida'))
    _, ya = wavfile.read(os.path.join(SAIDA, 'B-v4-perr-tim.wav')); _, yb = wavfile.read(os.path.join(SAIDA, 'B-v4-perr-tim-repetida.wav'))
    ya, yb = ya.astype(float), yb.astype(float); n = min(len(ya), len(yb))
    c = float(np.corrcoef(ya[:n], yb[:n])[0, 1])
    return {'mp3_identico': a['sha1_mp3'] == b['sha1_mp3'], 'duracao_s': [round(len(ya) / 44100, 3), round(len(yb) / 44100, 3)],
            'correlacao_da_onda': round(c, 4),
            'alinhamento_identico': a['alinhamento']['character_start_times_seconds'] == b['alinhamento']['character_start_times_seconds']}


if __name__ == '__main__':
    M = {'arquivos': {}}
    for nome in ['A-atual', 'B-v4-perr-tim', 'B-v4-pertim-acento', 'B-v4-perrtim', 'B-v4-pertim-puro', 'A-dicionario-pausas', 'B-v4-dicionario-pausas']:
        J = json.load(open(os.path.join(SAIDA, nome + '.json')))
        M['arquivos'][nome] = {'texto_api': J['texto_api'], 'tem_alinhamento': J['tem_alinhamento'],
                               'caracteres_alinhados': len(J['alinhamento']['characters']), 'caracteres_enviados': len(J['texto_api']),
                               'domingo': domingos(nome), 'uaipertim': pertins(nome)}
        if 'pausas' in nome: M['arquivos'][nome]['pausas'] = pausas(nome)
    M['seed'] = seed()
    json.dump(M, open(os.path.join(SAIDA, 'medidas.json'), 'w'), ensure_ascii=False, indent=1)
    print(json.dumps(M, ensure_ascii=False, indent=1)[:12000])
