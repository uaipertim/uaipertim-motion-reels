#!/usr/bin/env python3
"""
Usa EXATAMENTE os takes aprovados de ouvido no teste A/B como a fala 1 e a fala 7 do Reel (sem gerar voz de novo):

    python3 reels/pedir-no-uaipertim/scripts/usar_aprovados.py

  • confere o hash de cada MP3 aprovado (teste-pronuncia/amostras.json) — é o mesmo arquivo que foi ouvido;
  • converte para o formato do pipeline (WAV mono 44,1 kHz, 16 bits) em reels/explica-so/audio/pedir-no-uaipertim/voz/;
  • tira o alinhamento por caractere do PRÓPRIO arquivo, sem API: a geração anterior da mesma fala (mesmo texto, mesma
    voz, com o alinhamento da ElevenLabs) é casada com o take aprovado por DTW sobre MFCC, e os tempos de cada letra passam
    de uma para a outra pelo caminho do DTW (o alinhamento forçado da ElevenLabs pede uma permissão que a chave não tem).
    A geração anterior fica guardada como referência (voz/ref-alinhamento-cap-XX.wav + "alinhamento_ref" em falas.json);
  • grava em voz/falas.json com "aprovado": a origem, os hashes e o alinhamento. scripts/voz.py nunca gera de novo uma fala
    aprovada (nem com --refaz): o vídeo usa o arquivo aprovado.
Não usa a API.
"""
import hashlib, json, os, shutil, subprocess, sys, time
import numpy as np
from scipy.fft import dct
from scipy.io import wavfile
from scipy.signal import stft

AQUI = os.path.dirname(os.path.abspath(__file__))
REEL = os.path.dirname(AQUI)
REPO = os.path.dirname(os.path.dirname(REEL))
TESTE = os.path.join(REEL, 'teste-pronuncia')
VOZ = os.path.join(REPO, 'reels', 'explica-so', 'audio', 'pedir-no-uaipertim', 'voz')
SR = 44100
APROVADOS = {'00': 'f1-E-uaipertim-acento-no-e-junto.mp3', '06': 'f7-E-uaipertim-acento-no-e-junto.mp3'}


def mfcc(y, sr, hop=0.01):
    """MFCC (13) a cada 10 ms, com as derivadas, normalizados"""
    n = int(0.025 * sr); h = int(hop * sr)
    f, _, Z = stft(y, sr, nperseg=n, noverlap=n - h, boundary=None, padded=False)
    P = np.abs(Z) ** 2
    mel = lambda x: 2595 * np.log10(1 + x / 700)
    pts = 700 * (10 ** (np.linspace(mel(60), mel(7600), 42) / 2595) - 1)
    fb = np.zeros((40, len(f)))
    for i in range(40):
        a_, c_, b_ = pts[i], pts[i + 1], pts[i + 2]
        fb[i] = np.clip(np.minimum((f - a_) / (c_ - a_), (b_ - f) / (b_ - c_)), 0, None)
    M = dct(np.log(fb @ P + 1e-10), axis=0, norm='ortho')[:13]
    D_ = np.gradient(M, axis=1)
    E = np.log(P.sum(0) + 1e-10)[None, :]
    X = np.vstack([M, D_, E, E]).T                 # a energia conta em dobro: segura as pausas no lugar
    return (X - X.mean(0)) / (X.std(0) + 1e-9)


def dtw(A, B):
    """caminho de menor custo entre as sequências A (n×d) e B (m×d)"""
    C = np.sqrt(((A[:, None, :] - B[None, :, :]) ** 2).sum(-1))
    n, m = C.shape
    acc = np.full((n + 1, m + 1), np.inf); acc[0, 0] = 0
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            acc[i, j] = C[i - 1, j - 1] + min(acc[i - 1, j], acc[i, j - 1], acc[i - 1, j - 1])
    i, j, cam = n, m, []
    while i > 0 and j > 0:
        cam.append((i - 1, j - 1))
        k = np.argmin([acc[i - 1, j - 1], acc[i - 1, j], acc[i, j - 1]])
        i, j = (i - 1, j - 1) if k == 0 else (i - 1, j) if k == 1 else (i, j - 1)
    cam = np.array(cam[::-1])
    return cam, float(acc[n, m] / len(cam))


def falado(y, limiar=0.02):
    """o trecho com fala (energia em janelas de 10 ms acima do limiar): (início, fim) em segundos"""
    h = int(0.01 * SR)
    e = np.array([np.sqrt(np.mean(y[i:i + h] ** 2)) for i in range(0, len(y) - h, h)])
    on = np.where(e > limiar)[0]
    return max(0.0, on[0] * 0.01 - 0.02), min(len(y) / SR, (on[-1] + 1) * 0.01 + 0.02)


def transferir(ref_wav, ref_al, novo_pcm):
    """os tempos de cada letra da geração de referência levados para o take aprovado pelo caminho do DTW (MFCC + energia),
    só no trecho com fala de cada um (as pontas de silêncio ficam fora, então o começo e o fim batem com o áudio)"""
    _, r = wavfile.read(ref_wav)
    a_ = r.astype(np.float64) / 32768; b_ = novo_pcm.astype(np.float64) / 32768
    (a0, a1), (b0, b1) = falado(a_), falado(b_)
    A = mfcc(a_[int(a0 * SR):int(a1 * SR)], SR); B = mfcc(b_[int(b0 * SR):int(b1 * SR)], SR)
    cam, custo = dtw(A, B)
    ta, tb = a0 + cam[:, 0] * 0.01 + 0.0125, b0 + cam[:, 1] * 0.01 + 0.0125
    ua = np.unique(ta)
    tb_m = np.array([tb[ta == u].mean() for u in ua])
    xs = np.concatenate([[a0], ua, [a1]]); ys = np.concatenate([[b0], tb_m, [b1]])
    mapa = lambda t: float(np.interp(t, xs, ys))
    al = {'characters': list(ref_al['characters']),
          'character_start_times_seconds': [round(mapa(t), 4) for t in ref_al['character_start_times_seconds']],
          'character_end_times_seconds': [round(mapa(t), 4) for t in ref_al['character_end_times_seconds']]}
    return al, custo


amostras = {a['arquivo']: a for a in json.load(open(os.path.join(TESTE, 'amostras.json')))['amostras']}
path = os.path.join(VOZ, 'falas.json')
D = json.load(open(path))
for key, arq in APROVADOS.items():
    mp3 = open(os.path.join(TESTE, arq), 'rb').read()
    a = amostras[arq]
    if hashlib.sha1(mp3).hexdigest() != a['sha1_mp3']:
        sys.exit(f'PAROU: {arq} não é o arquivo aprovado (o hash não bate com amostras.json)')
    F = D['capitulos'][key]
    if a['texto_api'] != F['texto_api']:
        sys.exit(f'PAROU: o texto do take aprovado ("{a["texto_api"]}") não é o da fala {key} ("{F["texto_api"]}")')
    pcm = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(TESTE, arq), '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'],
                                       capture_output=True, check=True).stdout, np.int16)
    wav = os.path.join(VOZ, f'cap-{key}.wav')
    ref = os.path.join(VOZ, f'ref-alinhamento-cap-{key}.wav')
    if not F.get('aprovado'):                      # a 1ª vez: a geração anterior vira a referência do alinhamento
        shutil.copyfile(wav, ref)
        F['alinhamento_ref'] = F['alinhamento']
    al, loss = transferir(ref, F['alinhamento_ref'], pcm)
    wavfile.write(wav, SR, pcm)
    letras = [(c, s, e) for c, s, e in zip(al['characters'], al['character_start_times_seconds'], al['character_end_times_seconds']) if c.strip()]
    alfa = [x for x in letras if x[0].isalnum()]
    hist = F.get('historico', [])
    D['capitulos'][key] = {**{k: v for k, v in F.items() if k not in ('alinhamento',)}, 'alinhamento_ref': F['alinhamento_ref'],
                           'aprovado': True, 'seed': a['seed'], 'formato': 'mp3_44100_128 (o take do teste, convertido sem gerar de novo)',
                           'origem': {'arquivo': f'reels/pedir-no-uaipertim/teste-pronuncia/{arq}', 'sha1_mp3': a['sha1_mp3'],
                                      'aprovado': 'de ouvido pelo cliente (teste A/B, opção E)', 'quando': time.strftime('%Y-%m-%d %H:%M')},
                           'duracao_audio': round(len(pcm) / SR, 3), 'inicio_da_fala': round(alfa[0][1], 3), 'fim_da_fala': round(alfa[-1][2], 3),
                           'sha1_audio': hashlib.sha1(pcm.tobytes()).hexdigest(), 'alinhamento': al,
                           'alinhamento_fonte': f'DTW (MFCC) com a geração anterior da mesma fala, voz/ref-alinhamento-cap-{key}.wav (custo médio {loss:.3f})', 'historico': hist}
    print(f'ok fala {int(key) + 1}: {arq} -> voz/cap-{key}.wav ({len(pcm) / SR:.2f} s; fala {alfa[0][1]:.2f}–{alfa[-1][2]:.2f} s; custo do DTW {loss:.3f})')
json.dump(D, open(path, 'w'), ensure_ascii=False, indent=1)
