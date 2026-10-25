"""Teste das grafias do "Pértim" no eleven_v4 (não muda o padrão: só lê audio/voz_v4.json).
4 grafias × seeds 42 e 1042 = 8 arquivos; cada um é UMA geração inteira da frase da validação.
Grava <nome>.mp3, resultados/<nome>.json (corpo enviado — sem chave —, alinhamento, chiado) e TABELA.md."""
import hashlib, json, os, sys

AQ = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(AQ))                                  # api.py, audio_util.py (testes/voz-v4)
sys.path.insert(0, os.path.join(AQ, '..', '..', '..', 'scripts'))       # chiado.py
import api, chiado  # noqa: E402
from audio_util import decode, palavras, SR  # noqa: E402

REPO = os.path.abspath(os.path.join(AQ, '..', '..', '..', '..', '..'))
V4 = json.load(open(os.path.join(REPO, 'audio', 'voz_v4.json'), encoding='utf-8'))
BASE = 'Ô Glória, o UaiPertim chegou pertim docês! Segue a gente pra não perder.'
VARIANTES = [
    ('acento-separado', 'Ô Glória, o Uai Pértim chegou pértim docês! Segue a gente pra não perder.'),
    ('acento-junto', 'Ô Glória, o UaiPértim chegou pértim docês! Segue a gente pra não perder.'),
    ('rr-separado', 'Ô Glória, o Uai Pérrtim chegou pérrtim docês! Segue a gente pra não perder.'),
    ('uai-pe-virgula', 'Ô Glória, o Uai, Pértim, chegou pértim docês! Segue a gente pra não perder.'),
]
SEEDS = [42, 1042]

linhas = []
os.makedirs(os.path.join(AQ, 'resultados'), exist_ok=True)
for var, texto in VARIANTES:
    for seed in SEEDS:
        nome = f'v4_pertim_{var}_s{seed}'
        body = {'text': texto, 'model_id': V4['model'], 'voice_settings': V4['voiceSettings'], 'seed': seed}
        s, det, mp3, al = api.tts(body)
        if not mp3:
            raise SystemExit(f'{nome}: HTTP {s} {det}')
        open(os.path.join(AQ, nome + '.mp3'), 'wb').write(mp3)
        x = decode(mp3)
        ok, motivo, num = chiado.confere(x, SR, al, texto)
        r = {'arquivo': nome + '.mp3', 'modelo': V4['model'], 'configuracao': V4['voiceSettings'], 'voz': api.VOICE, 'seed': seed,
             'texto_base': BASE, 'texto_enviado': texto, 'http': s, 'duracao_s': round(len(x) / SR, 3),
             'md5_mp3': hashlib.md5(mp3).hexdigest(), 'chiado': {'ok': ok, 'motivo': motivo, **num},
             'palavras': [(w['w'], round(w['t0'], 3), round(w['t1'], 3)) for w in palavras(al)], 'alinhamento': al}
        json.dump(r, open(os.path.join(AQ, 'resultados', nome + '.json'), 'w'), ensure_ascii=False, indent=1)
        print(f'{nome}: HTTP {s} · {r["duracao_s"]:.2f} s · chiado {motivo}')
        linhas.append(f'| `{nome}.mp3` | {texto} | {seed} | {r["duracao_s"]:.2f} s | {motivo} (pior fração 4–10 kHz: {num["pior_fracao_4_10khz"]}) |')

open(os.path.join(AQ, 'TABELA.md'), 'w').write(f"""# Grafias do "Pértim" no eleven_v4 (teste; o padrão não mudou)

Frase base (a da validação): "{BASE}". Na validação, com o texto sem troca, "UaiPertim"/"pertim" não saiu com o E aberto.
Aqui só muda o texto enviado à API. Voz {V4['name']} ({api.VOICE}), `{V4['model']}`, ajustes `{json.dumps(V4['voiceSettings'])}`
(sem style/speaker boost), endpoint `with-timestamps`, saída mp3_44100_128, sem previous_text/next_text; cada arquivo é UMA
geração inteira. Chiado: `scripts/chiado.py`. Áudios para ouvir: `exports/tiktok/testes/voz-v4/pertim/`.

| Arquivo | Texto exato enviado | Seed | Duração | Chiado |
|---|---|---|---|---|
""" + '\n'.join(linhas) + '\n')
