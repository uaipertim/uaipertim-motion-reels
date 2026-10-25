"""Teste do fecho e da grafia do "pertim" (força no final, per-TIM) no eleven_v4 (não muda a produção: só lê audio/voz_v4.json).
4 variantes × seeds 42 e 1042 = 8 arquivos; cada um é UMA geração inteira. Confere chiado e corte pelo som (scripts/chiado.py).
Grava <nome>.mp3, resultados/<nome>.json (corpo enviado — sem chave —, alinhamento, chiado) e TABELA.md."""
import hashlib, json, os, sys
import numpy as np

AQ = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(AQ))                                  # api.py, audio_util.py (testes/voz-v4)
sys.path.insert(0, os.path.join(AQ, '..', '..', '..', 'scripts'))       # chiado.py
import api, chiado  # noqa: E402
from audio_util import decode, palavras, SR  # noqa: E402

REPO = os.path.abspath(os.path.join(AQ, '..', '..', '..', '..', '..'))
V4 = json.load(open(os.path.join(REPO, 'audio', 'voz_v4.json'), encoding='utf-8'))
BASE = 'Semana começando? Relaxa, tem UaiPertim. Tudo pertim de você. Segue a gente!'
VARIANTES = [
    ('relaxa_Pertim-acento', 'Semana começando? Relaxa, tem Uai Pértim. Tudo pértim de você. Segue a gente!'),
    ('relaxa_pertim-i', 'Semana começando? Relaxa, tem Uai pertím. Tudo pertím de você. Segue a gente!'),
    ('relaxa_perrtim-grave', 'Semana começando? Relaxa, tem Uai pèrtím. Tudo pèrtím de você. Segue a gente!'),
    ('deixa_Pertim-acento', 'Semana começando? Deixa com o Uai Pértim. Tudo pértim de você. Segue a gente!'),
]
SEEDS = [42, 1042]

linhas = []
os.makedirs(os.path.join(AQ, 'resultados'), exist_ok=True)
for var, texto in VARIANTES:
    for seed in SEEDS:
        nome = f'fecho_{var}_s{seed}'
        body = {'text': texto, 'model_id': V4['model'], 'voice_settings': V4['voiceSettings'], 'seed': seed}
        s, det, mp3, al = api.tts(body)
        if not mp3:
            raise SystemExit(f'{nome}: HTTP {s} {det}')
        open(os.path.join(AQ, nome + '.mp3'), 'wb').write(mp3)
        x = decode(mp3)
        ok, motivo, num = chiado.confere(x, SR, al, texto)
        fim = chiado.ultima_letra(al, x, SR); cauda_db = float(20 * np.log10(np.sqrt(np.mean(np.square(x[-int(0.04 * SR):], dtype=np.float64))) + 1e-12))
        sobra = len(x) / SR - fim
        corte = 'ok' if sobra >= 0.05 and cauda_db <= -45 else 'CORTADA'
        corte_txt = f'{corte} (sobra {sobra:.2f} s, fim do arquivo {cauda_db:.0f} dB)'
        r = {'arquivo': nome + '.mp3', 'modelo': V4['model'], 'configuracao': V4['voiceSettings'], 'voz': api.VOICE, 'seed': seed,
             'texto_base': BASE, 'texto_enviado': texto, 'http': s, 'duracao_s': round(len(x) / SR, 3),
             'md5_mp3': hashlib.md5(mp3).hexdigest(), 'chiado': {'ok': ok, 'motivo': motivo, **num}, 'corte_pelo_som': corte_txt,
             'palavras': [(w['w'], round(w['t0'], 3), round(w['t1'], 3)) for w in palavras(al)], 'alinhamento': al}
        json.dump(r, open(os.path.join(AQ, 'resultados', nome + '.json'), 'w'), ensure_ascii=False, indent=1)
        print(f'{nome}: HTTP {s} · {r["duracao_s"]:.2f} s · chiado {motivo} · corte {corte_txt}')
        linhas.append(f'| `{nome}.mp3` | {texto} | {seed} | {r["duracao_s"]:.2f} s | {motivo} (pior fração 4–10 kHz: {num["pior_fracao_4_10khz"]}) | {corte_txt} |')

open(os.path.join(AQ, 'TABELA.md'), 'w').write(f"""# Fecho e grafia do "pertim" no eleven_v4 (teste; a produção não mudou)

Frase nova: "{BASE}" (a 4ª variante é a frase atual do fecho do EP. 04, de referência). No EP. 04, "com o Uai" emendou ("Uapértim") e a força de "Pértim" não ficou no final (o certo é per-TIM).
Aqui só muda o texto enviado à API. Voz {V4['name']} ({api.VOICE}), `{V4['model']}`, ajustes `{json.dumps(V4['voiceSettings'])}`
(sem style/speaker boost), endpoint `with-timestamps`, saída mp3_44100_128, sem previous_text/next_text; cada arquivo é UMA
geração inteira. Chiado: `scripts/chiado.py`. Corte pelo som: sobra ≥ 50 ms depois da última letra e últimos 40 ms abaixo de −45 dBFS. Áudios para ouvir: `exports/tiktok/testes/voz-v4/fecho/`.

| Arquivo | Texto exato enviado | Seed | Duração | Chiado | Corte pelo som |
|---|---|---|---|---|---|
""" + '\n'.join(linhas) + '\n')
