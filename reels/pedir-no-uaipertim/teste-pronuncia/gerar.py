#!/usr/bin/env python3
"""
TESTE A/B de pronúncia de "UaiPertim" no Reel "Pedir no UaiPertim é assim" (perfil "narracao": eleven_v4, Victor Pinho).
A fala 1 e a fala 7 INTEIRAS em cada grafia (só o texto enviado à voz muda; a tela continua "UaiPertim"). Cada MP3 é uma
geração inteira, seed 42, sem emenda. Não mexe na produção.

    python3 reels/pedir-no-uaipertim/teste-pronuncia/gerar.py      -> f1-*.mp3, f7-*.mp3 aqui + amostras.json

A chave da API não aparece aqui: nesta nuvem a rede a põe no cabeçalho xi-api-key (Segredos de rede); fora dela, use
ELEVENLABS_API_KEY no ambiente. Nada é impresso nem salvo além do áudio e do texto enviado.
"""
import hashlib, json, os, sys, urllib.error, urllib.request

AQUI = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(os.path.dirname(AQUI)))
VOZ = json.load(open(os.path.join(REPO, 'audio', 'voz_oficial.json'), encoding='utf-8'))
P = VOZ['perfis']['narracao']
API = f'https://api.elevenlabs.io/v1/text-to-speech/{VOZ["voiceId"]}?output_format=mp3_44100_128'
FALAS = {'f1': 'Bateu aquela fome? Ó, pedir no {} é assim:', 'f7': '{}. Tá chegando no Glória!'}
GRAFIAS = [  # letra, nome do arquivo, grafia enviada
    ('A', 'uaipertim-atual', 'UaiPertim'),
    ('B', 'uai-pertim-acento-no-e', 'Uai Pértim'),
    ('C', 'uai-pertim-acento-no-i', 'Uai pertím'),
    ('D', 'uai-pertim-separado', 'Uai Pertim'),
    ('E', 'uaipertim-acento-no-e-junto', 'UaiPértim'),
]
feitas = []
for f, modelo in FALAS.items():
    for letra, nome, grafia in GRAFIAS:
        texto = modelo.format(grafia)
        body = {'text': texto, 'model_id': P['model'], 'voice_settings': P['voiceSettings'], 'seed': 42}
        headers = {'Content-Type': 'application/json', 'Accept': 'audio/mpeg'}
        key = os.environ.get('ELEVENLABS_API_KEY') or os.environ.get('XI_API_KEY')
        if key:
            headers['xi-api-key'] = key                     # nunca impresso nem gravado
        req = urllib.request.Request(API, data=json.dumps(body).encode(), headers=headers, method='POST')
        try:
            with urllib.request.urlopen(req, timeout=240) as r:
                mp3 = r.read()
        except urllib.error.HTTPError as e:
            print(f'PAROU em {f}-{letra}: HTTP {e.code} {e.read().decode("utf-8", "replace")[:400]}')   # voz não encontrada / sem permissão
            sys.exit(1)
        arq = f'{f}-{letra}-{nome}.mp3'
        open(os.path.join(AQUI, arq), 'wb').write(mp3)
        feitas.append({'arquivo': arq, 'fala': f, 'grafia': grafia, 'texto_api': texto, 'seed': 42, 'modelo': P['model'],
                       'ajustes': P['voiceSettings'], 'sha1_mp3': hashlib.sha1(mp3).hexdigest()})
        print(f'ok {arq} · "{texto}"')
json.dump({'voz': VOZ['name'], 'voice_id': VOZ['voiceId'], 'amostras': feitas},
          open(os.path.join(AQUI, 'amostras.json'), 'w'), ensure_ascii=False, indent=1)
