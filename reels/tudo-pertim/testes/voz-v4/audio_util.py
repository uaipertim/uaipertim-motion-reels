"""Utilidades do teste: decodificar mp3, palavras do alinhamento e pausas medidas pelo silêncio."""
import subprocess
import numpy as np

SR = 44100


def decode(mp3):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', '-', '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'],
                         input=mp3, capture_output=True, check=True).stdout
    return np.frombuffer(raw, '<i2').astype(np.float32) / 32768


def palavras(al):
    out, cur = [], None
    for c, a, b in zip(al['characters'], al['character_start_times_seconds'], al['character_end_times_seconds']):
        if c.isspace():
            if cur:
                out.append(cur); cur = None
            continue
        if cur is None:
            cur = {'w': '', 't0': a, 't1': b}
        cur['w'] += c; cur['t1'] = b
    if cur:
        out.append(cur)
    return out


def silencios(x, limiar_db=-40, minimo=0.12, janela=0.01):
    """Trechos de silêncio (RMS < limiar) com pelo menos `minimo` s, ignorando o começo e o fim do arquivo."""
    n = int(SR * janela); k = len(x) // n
    rms = np.sqrt(np.mean(x[:k * n].reshape(k, n) ** 2, axis=1) + 1e-12)
    db = 20 * np.log10(rms / (np.max(rms) + 1e-12))
    fala = np.where(db > limiar_db)[0]
    if not len(fala):
        return []
    a, b = fala[0], fala[-1]
    out, ini = [], None
    for i in range(a, b + 1):
        if db[i] <= limiar_db and ini is None:
            ini = i
        elif db[i] > limiar_db and ini is not None:
            if (i - ini) * janela >= minimo:
                out.append((round(ini * janela, 3), round(i * janela, 3), round((i - ini) * janela, 3)))
            ini = None
    return out
