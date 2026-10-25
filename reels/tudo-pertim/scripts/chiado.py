"""
Conferência do chiado depois da fala (usada por voz.py, a cada geração, e por qa.py, na revisão).

Depois do fim da última letra do alinhamento, nenhum trecho acima de −45 dBFS pode ter mais de 50% da energia entre
4 e 10 kHz (um "s" que a voz inventou, como "Glória" → "Glórias"), a não ser que a última palavra do texto termine
em s, z ou x. Janelas de 20 ms, passo de 10 ms.

Tolerância (sopro/respiração): janelas reprovadas vizinhas formam um trecho; um trecho ISOLADO de até 30 ms, todo abaixo
de −38 dB, é ignorado. Qualquer chiado mais longo que 30 ms ou acima de −38 dB continua reprovado (ex.: o "Glórias" de
~70 ms a −27 dB).

    python3 scripts/chiado.py <id do episódio>   -> confere as vozes já geradas (só leitura)
"""
import json
import os
import re
import sys
import numpy as np

LIMIAR_DB = -45.0
FRACAO = 0.5
BANDA = (4000.0, 10000.0)
JANELA, PASSO = 0.020, 0.010
SOPRO_MAX_S, SOPRO_MAX_DB = 0.030, -38.0      # trecho curto e baixo depois da fala = sopro, não chiado
VOZ_ATE_HZ = 3000.0                            # v4: o fim da fala pelo som usa só a parte vozeada (abaixo de 3 kHz)


def fim_sonoro(y, sr):
    """o fim da parte vozeada da fala (energia abaixo de 3 kHz acima de −45 dBFS, em janelas de 10 ms): um chiado agudo
    inventado depois da fala NÃO conta como fala (ele continua sendo pego por confere())"""
    from scipy.signal import butter, sosfiltfilt
    z = sosfiltfilt(butter(4, VOZ_ATE_HZ, 'low', fs=sr, output='sos'), np.asarray(y, dtype=np.float64))
    n = int(0.01 * sr); k = len(z) // n
    if k == 0:
        return None
    db = 20 * np.log10(np.sqrt(np.mean(z[:k * n].reshape(k, n) ** 2, axis=1)) + 1e-12)
    idx = np.where(db > LIMIAR_DB)[0]
    return (idx[-1] + 1) * 0.01 if len(idx) else None


def ultima_letra(al, y=None, sr=None):
    """o fim da última letra (alfanumérica) do alinhamento, em segundos. No eleven_v4 o alinhamento às vezes cola a
    última letra no fim do arquivo (o som já tinha acabado antes); nesse caso (fim ≥ duração − 20 ms, com o áudio dado)
    vale o fim da parte vozeada medido no som (fim_sonoro), para a conferência do corte e do chiado medirem a cauda de
    verdade. Nas vozes do v2 (ep01–ep04) isso nunca acontece: o resultado é o de sempre."""
    fim = None
    for c, b in zip(al['characters'], al['character_end_times_seconds']):
        if c.isalnum():
            fim = b
    if y is not None and fim is not None and fim >= len(y) / sr - 0.02:
        fs = fim_sonoro(y, sr)
        if fs is not None:
            fim = min(fim, fs)
    return fim


def termina_em_sibilante(texto):
    ws = re.findall(r'[\wÀ-ÿ]+', texto)
    return bool(ws) and ws[-1].lower()[-1] in 'szx'


def confere(x, sr, al, texto):
    """(ok, motivo, números): x = o áudio mono da geração (float), al = o alinhamento, texto = o texto enviado à API"""
    y = np.asarray(x, dtype=np.float64)
    if y.ndim > 1:
        y = y.mean(axis=1)
    fim = ultima_letra(al, y, sr)
    i0 = int(round(fim * sr))
    cauda = y[i0:]
    n, h = int(JANELA * sr), int(PASSO * sr)
    piores, pior = [], {'db': -120.0, 'fracao': 0.0, 't': None}
    if len(cauda) >= n:
        win = np.hanning(n)
        f = np.fft.rfftfreq(n, 1 / sr)
        banda = (f >= BANDA[0]) & (f <= BANDA[1])
        for k in range(0, len(cauda) - n + 1, h):
            seg = cauda[k:k + n]
            db = 20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-12)
            if db <= LIMIAR_DB:
                continue
            esp = np.abs(np.fft.rfft(seg * win)) ** 2
            fr = float(esp[banda].sum() / (esp.sum() + 1e-20))
            t = fim + k / sr
            if fr > pior['fracao']:
                pior = {'db': round(db, 1), 'fracao': round(fr, 3), 't': round(t, 3)}
            if fr > FRACAO:
                piores.append((round(t, 3), round(db, 1), round(fr, 3)))
    # as janelas reprovadas vizinhas (encostadas ou sobrepostas) formam trechos
    trechos = []
    for w in piores:
        if trechos and w[0] - trechos[-1][-1][0] <= JANELA + 1e-6:
            trechos[-1].append(w)
        else:
            trechos.append([w])
    sopros = [tr for tr in trechos if (tr[-1][0] + JANELA - tr[0][0]) <= SOPRO_MAX_S + 1e-6 and max(w[1] for w in tr) < SOPRO_MAX_DB]
    chiados = [tr for tr in trechos if tr not in sopros]
    num = {'fim_ultima_letra_s': round(fim, 3), 'cauda_s': round(len(cauda) / sr, 3), 'chiado_janelas': len(piores),
           'pior_fracao_4_10khz': pior['fracao'], 'pior_db': pior['db'], 'pior_t': pior['t'],
           'sopros_ignorados': [(tr[0][0], round(tr[-1][0] + JANELA, 3), max(w[1] for w in tr)) for tr in sopros]}
    if chiados and not termina_em_sibilante(texto):
        a, b = chiados[0][0][0], chiados[-1][-1][0] + JANELA
        return False, f'chiado depois da fala ({a:.2f}–{b:.2f} s, até {max(w[2] for tr in chiados for w in tr):.0%} da energia em 4–10 kHz, até {max(w[1] for tr in chiados for w in tr)} dB)', num
    if sopros and not termina_em_sibilante(texto):
        return True, 'ok (sopro curto ignorado: ' + ', '.join(f'{a:.2f}–{b:.2f} s a {db} dB' for a, b, db in num['sopros_ignorados']) + ')', num
    return True, 'ok', num


if __name__ == '__main__':
    from scipy.io import wavfile
    ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ep = sys.argv[1]
    D = json.load(open(os.path.join(ROOT, 'audio', ep, 'voz', 'falas.json')))['capitulos']
    for key in sorted(D):
        f = D[key]
        sr, x = wavfile.read(os.path.join(ROOT, 'audio', ep, 'voz', f'cap-{key}.wav'))
        ok, motivo, num = confere(x.astype(np.float64) / 32768, sr, f['alinhamento'], f.get('texto_api', f['texto']))
        print(f'  cap {key}: {"OK   " if ok else "FALHA"} {motivo} · última letra {num["fim_ultima_letra_s"]} s, cauda {num["cauda_s"]} s, '
              f'pior janela {num["pior_fracao_4_10khz"]:.0%} em 4–10 kHz a {num["pior_db"]} dB'
              + (f' ({num["pior_t"]} s)' if num['pior_t'] is not None else ' (nada acima de −45 dB)'))
