#!/usr/bin/env python3
"""Verificação dos dois perfis de voz (audio/voz_oficial.json → perfis), pelo caminho de produção (audio/elevenlabs.py →
speak(texto, perfil)): uma frase em cada perfil, para conferir que cada um chama o modelo e a grafia certos.

    python3 audio/teste-v4/verificar.py  ->  audio/teste-v4/saida/verificacao-narracao.mp3 e verificacao-pausas.mp3 (+ .json)
A chave não aparece aqui (Segredos de rede / variável de ambiente)."""
import json, os, sys
AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(AQUI), ''))
from elevenlabs import perfil, speak  # noqa: E402

FRASE = "No domingo, pede pelo UaiPertim, que é pertinho. Uai, é o UaiPertim."
for nome in ('narracao', 'pausas'):
    p = perfil(nome)
    texto_api, mp3, al = speak(FRASE, nome)
    base = os.path.join(AQUI, 'saida', f'verificacao-{nome}')
    open(base + '.mp3', 'wb').write(mp3)
    json.dump({'perfil': nome, 'modelo': p['model'], 'voice_settings': p['voiceSettings'], 'voice_id': p['voiceId'], 'seed': p['seed'],
               'texto': FRASE, 'texto_api': texto_api, 'alinhamento': al}, open(base + '.json', 'w'), ensure_ascii=False, indent=1)
    print(f'ok {os.path.relpath(base, os.path.dirname(os.path.dirname(AQUI)))}.mp3 · {p["model"]} · {json.dumps(p["voiceSettings"])} · "{texto_api}"')
