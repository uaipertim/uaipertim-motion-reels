"""Confere a validação da voz v4 (lê o que valida.sh trouxe para esta pasta) e escreve VALIDACAO.md."""
import json, os, subprocess, sys
import numpy as np
from scipy.io import wavfile

AQ = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(AQ, '..', '..', '..', 'scripts'))
import chiado  # noqa: E402

F = json.load(open(os.path.join(AQ, 'voz', 'falas.json')))
cap = F['capitulos']['00']
L = json.load(open(os.path.join(AQ, 'linha.json')))
c0 = L['capitulos'][0]
sr, y = wavfile.read(os.path.join(AQ, 'voz', 'cap-00.wav')); y = y.astype(np.float64) / 32768
ok_ch, motivo_ch, num_ch = chiado.confere(y, sr, cap['alinhamento'], cap['texto_api'])

# o começo real das palavras que vêm depois de um silêncio, na narração montada (tempo do vídeo)
sv, v = wavfile.read(os.path.join(AQ, 'voz.wav')); v = v.astype(np.float64) / 32768
n = int(0.005 * sv); k = len(v) // n
db = 20 * np.log10(np.sqrt(np.mean(v[:k * n].reshape(k, n) ** 2, axis=1)) + 1e-9); db -= db.max()
som = db > -40
inicios = [i * 0.005 for i in range(1, k) if som[i] and not som[max(0, i - 16):i].any()]    # som depois de ≥ 80 ms de silêncio

al = cap['alinhamento']; ch, st = al['characters'], al['character_start_times_seconds']
desloc = c0['voz_t0'] - cap['inicio_da_fala']
linhas, piores = [], []
ws = c0['palavras']
dono = {}                                              # cada começo de som vai para a palavra de gatilho mais próximo
for t in inicios:
    w = min(ws, key=lambda w: abs(w['t0'] - t))
    if abs(w['t0'] - t) < 0.2 and (w['w'] not in dono or abs(dono[w['w']] - w['t0']) > abs(t - w['t0'])):
        dono[w['w']] = t
for w in ws:
    bruto = st[w['i0']] + desloc
    real = dono.get(w['w'])
    adiantada = None if real is None else round(real - w['t0'], 3)
    if adiantada is not None:
        piores.append(adiantada)
    linhas.append(f"| {w['w']} | {bruto:.3f} | {w['t0']:.3f} | {round(w['t0'] * 60)} | " + (f'{real:.3f} | {adiantada * 1000:+.0f} ms' if real is not None else '— | (sem silêncio antes)') + ' |')
quadros_ok = all(abs(w['t0'] * 60 - round(w['t0'] * 60)) < 0.01 for w in c0['palavras'])   # (linha.json guarda 4 casas)
mot = json.load(open(os.path.join(AQ, 'motor.json')))
dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', os.path.join(AQ, 'validacao-v4.mp4')], capture_output=True, text=True).stdout)
streams = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'stream=codec_type,width,height,r_frame_rate', '-of', 'csv=p=0', os.path.join(AQ, 'validacao-v4.mp4')], capture_output=True, text=True).stdout.split()

marca = [x for x in c0['palavras'] if x['n'] == 'uaipertim']
txt = ''.join(ch)
R = f"""# Validação da voz v4 no fluxo do Tudo Pertim

Um capítulo de teste (`episodio.json`, `"voz": "v4"`) passou pelo fluxo real: `scripts/voz.py` → `scripts/linha.py` →
`render.cjs cues` → `scripts/audio.py` → `render.cjs video` (+ `info`), por `valida.sh`. Nenhum episódio de produção foi tocado.

## Voz (scripts/voz.py)

- modelo **{F['modelo']}** · ajustes `{json.dumps(F['ajustes'])}` (sem style/speaker boost) · voz {F['voz']} ({F['voice_id']})
- texto na tela: "{cap['texto']}"
- **texto enviado à API**: "{cap['texto_api']}"  (sem troca "Pérr-tim": {'sim' if 'Pérr' not in cap['texto_api'] else 'NÃO'}; sem `<break>`: {'sim' if '<break' not in cap['texto_api'] else 'NÃO'})
- seed usada **{cap['seed']}** · {cap['geracoes']} geração(ões) · formato `{cap['formato']}` · áudio {cap['duracao_audio']:.2f} s · fala {cap['inicio_da_fala']:.2f}–{cap['fim_da_fala']:.2f} s
- conferência do voz.py: {'; '.join(f"seed {h['seed']}: {h['resultado']} ({h['ritmo_letras_s']} letras/s, maior pausa {h['maior_pausa_s']} s)" for h in cap['historico'])}
- **chiado final** (`scripts/chiado.py`): {motivo_ch} — fim da última letra {num_ch['fim_ultima_letra_s']} s, pior fração 4–10 kHz depois da fala {num_ch['pior_fracao_4_10khz']}
- alinhamento devolvido (letras): "{txt}"
- "UaiPertim" na linha do tempo: {', '.join(f"`{x['w']}` em {x['t0']:.3f} s" for x in marca)}

## Linha do tempo (scripts/linha.py)

- capítulo {c0['t0']:.2f}–{c0['t1']:.2f} s · voz {c0['voz_t0']:.2f}–{c0['voz_t1']:.2f} s · {len(c0['palavras'])} palavras · {len(c0['apoios'])} apoio(s)
- mapa de tempos: {'ok' if L['mapa']['ok'] else 'falhas: ' + '; '.join(L['mapa']['falhas'])}
  (um capítulo só não fecha os 45–60 s de um episódio: essa é a única falha esperada aqui)
- degraus do alinhamento: tempos de letra em múltiplos de ~{np.median(np.diff(sorted(set(st)))):.3f} s

Palavras (gatilhos das peças): "bruto" = começo pelo alinhamento; "no vídeo" = depois do atraso de 60 ms e do
arredondamento para o quadro (60 fps); "som real" = onde o som começa na narração montada (só dá para medir em palavra
que vem depois de silêncio). Positivo na última coluna = o som começa DEPOIS do gatilho (peça adiantada).

| palavra | bruto (s) | no vídeo (s) | quadro | som real (s) | som − gatilho |
|---|---|---|---|---|---|
""" + '\n'.join(linhas) + f"""

- todos os gatilhos caem exatamente num quadro: {'sim' if quadros_ok else 'NÃO'}
- peça antes da palavra: {('nenhuma — onde deu para medir, toda peça entra depois de o som começar (a mais justa, ' + f'{-max(piores) * 1000:.0f} ms depois)') if piores and max(piores) <= 0 else f'ATENÇÃO: uma peça entra {max(piores) * 1000:.0f} ms antes do som'}

## Render

- `validacao-v4.mp4`: {dur:.2f} s · streams {streams}
- palavras com "em" que não dispararam peça (motor.json → palavras_sem_peca): {json.dumps(mot['palavras_sem_peca'], ensure_ascii=False)} (vazio = todas dispararam)
- a logo do fecho entra em {mot['fecho']['logo']['entra']:.3f} s (o gatilho de "UaiPertim") e para em {mot['fecho']['logo']['parada']:.3f} s; peças do capítulo de {mot['montagens'][0]['primeira']:.3f} a {mot['montagens'][0]['ultima']:.3f} s
- a narração usada no render é a salva em `voz/` (cap-00.wav, sha1 {cap['sha1_audio'][:12]}…): re-rodar `valida.sh` não chama a API
"""
open(os.path.join(AQ, 'VALIDACAO.md'), 'w').write(R)
print(R)
