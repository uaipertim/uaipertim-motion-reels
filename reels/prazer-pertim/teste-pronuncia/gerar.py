#!/usr/bin/env python3
"""
TESTE de pronúncia do "Pertim" no perfil "narracao" (eleven_v4, Victor Pinho): o final está soando "Pértin" (com N).
Mesma frase em cada grafia; cada amostra é UMA geração inteira (nada emendado). Não mexe na produção.

    python3 reels/prazer-pertim/teste-pronuncia/gerar.py      -> <nome>.mp3 aqui + amostras.json

A chave da API não aparece aqui: nesta nuvem a rede a põe no cabeçalho xi-api-key (Segredos de rede); fora dela, use
ELEVENLABS_API_KEY no ambiente. Nada é impresso nem salvo além do áudio e do texto enviado.
"""
import base64, hashlib, json, os, sys, urllib.error, urllib.request

AQUI = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(os.path.dirname(AQUI)))
VOZ = json.load(open(os.path.join(REPO, 'audio', 'voz_oficial.json'), encoding='utf-8'))
P = VOZ['perfis']['narracao']
API = f'https://api.elevenlabs.io/v1/text-to-speech/{VOZ["voiceId"]}?output_format=mp3_44100_128'
FRASE = 'Prazer, eu sou o UaiPertim, mas pode me chamar de Pertim.'
AMOSTRAS = [  # nome, grafia, texto enviado, seed
    ('a1', 'Pértim (a atual)', 'Prazer, eu sou o Uai Pértim, mas pode me chamar de Pértim.', 42),
    ('a2', 'Pértim (a atual), outra seed', 'Prazer, eu sou o Uai Pértim, mas pode me chamar de Pértim.', 1042),
    ('b', 'Pértĩ', 'Prazer, eu sou o Uai Pértĩ, mas pode me chamar de Pértĩ.', 42),
    ('c', 'Pértimm', 'Prazer, eu sou o Uai Pértimm, mas pode me chamar de Pértimm.', 42),
    ('d', 'Pertim (sem troca)', 'Prazer, eu sou o UaiPertim, mas pode me chamar de Pertim.', 42),
    ('e', 'Pértim com ponto logo depois', 'Prazer, eu sou o Uai Pértim. Mas pode me chamar de Pértim.', 42),
]

feitas = []
for nome, grafia, texto, seed in AMOSTRAS:
    body = {'text': texto, 'model_id': P['model'], 'voice_settings': P['voiceSettings'], 'seed': seed}
    headers = {'Content-Type': 'application/json', 'Accept': 'audio/mpeg'}
    key = os.environ.get('ELEVENLABS_API_KEY') or os.environ.get('XI_API_KEY')
    if key:
        headers['xi-api-key'] = key                     # nunca impresso nem gravado
    req = urllib.request.Request(API, data=json.dumps(body).encode(), headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=240) as r:
            mp3 = r.read()
    except urllib.error.HTTPError as e:
        det = e.read().decode('utf-8', 'replace')[:400]
        print(f'PAROU em {nome}: HTTP {e.code} {det}')   # voz não encontrada / sem permissão: não troca de voz
        sys.exit(1)
    open(os.path.join(AQUI, nome + '.mp3'), 'wb').write(mp3)
    feitas.append({'nome': nome, 'grafia': grafia, 'texto_api': texto, 'seed': seed, 'modelo': P['model'],
                   'ajustes': P['voiceSettings'], 'sha1_mp3': hashlib.sha1(mp3).hexdigest()})
    print(f'ok {nome}.mp3 ({len(mp3) / 1024:.0f} kB) · {grafia}')
json.dump({'frase_da_tela': FRASE, 'voz': VOZ['name'], 'voice_id': VOZ['voiceId'], 'amostras': feitas},
          open(os.path.join(AQUI, 'amostras.json'), 'w'), ensure_ascii=False, indent=1)
