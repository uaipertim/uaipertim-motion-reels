#!/usr/bin/env python3
"""
TESTE de voz (não altera a produção): a voz oficial do UaiPertim (Victor Pinho, LuQ9eaWO9yCQrR73VQFa) em dois modelos.
  A) a configuração atual de audio/voz_oficial.json (eleven_multilingual_v2, 0.40 / 0.80 / style 0.35 / speaker boost),
     com o dicionário atual de pronúncia (pronounce() de audio/elevenlabs.py, só lido);
  B) eleven_v4, stability 0.50, similarity_boost 0.75, SEM style e SEM use_speaker_boost (padrão do modelo).
Mesma voz, mesmo texto, seed 42. Cada arquivo é UMA geração inteira (endpoint with-timestamps), nunca emendada.

    python3 audio/teste-v4/gerar.py      -> audio/teste-v4/saida/<nome>.mp3 + .wav + .json (alinhamento) + tecnico.json

A chave da API não aparece aqui: nesta nuvem a rede a põe no cabeçalho xi-api-key (Segredos de rede); fora dela, use
ELEVENLABS_API_KEY no ambiente. Nada é impresso nem salvo além das respostas da API (áudio, alinhamento, mensagens de erro).
"""
import base64, hashlib, json, os, re, subprocess, sys, time, urllib.error, urllib.request

AQUI = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(AQUI))
sys.path.insert(0, os.path.join(REPO, 'audio'))
from elevenlabs import pronounce  # noqa: E402  (só leitura: a regra de produção, sem mudar nada)

SAIDA = os.path.join(AQUI, 'saida')
VOZ = json.load(open(os.path.join(REPO, 'audio', 'voz_oficial.json'), encoding='utf-8'))
VOICE = VOZ['voiceId']
API = 'https://api.elevenlabs.io/v1/text-to-speech/{voice}/with-timestamps?output_format=mp3_44100_128'
SEED = 42
A = {'model_id': VOZ['model'], 'voice_settings': VOZ['voiceSettings']}
B = {'model_id': 'eleven_v4', 'voice_settings': {'stability': 0.50, 'similarity_boost': 0.75}}

TEXTO = ("Ô, sô, cê já ouviu falar do UaiPertim? No domingo à tarde, bateu a fome e a geladeira tava vazia. Aí foi só fazer "
         "o pedido e esperar a entrega, pertinho de casa. No sábado também tem! E pode chamar no WhatsApp do comércio, uai, mas "
         "com o UaiPertim é mais rapidim. Sabe qual é o melhor dia pra pedir? Domingo. Uai, é o UaiPertim.")
PAUSAS = ('Domingo. <break time="0.4s" /> Substantivo. <break time="0.4s" /> O dia de folga que termina com fome. '
          '<break time="0.4s" /> Exemplo: domingo à noite, a geladeira vazia… e o UaiPertim pertinho.')


def troca(t, pertim):
    """os textos B: "WhatsApp" -> "Uátsap" (igual ao A) e "Pertim" na grafia do teste (None = como está)"""
    t = re.sub(r'(?<![\wÀ-ÿ])WhatsApp(?![\wÀ-ÿ])', 'Uátsap', t)
    if pertim:
        t = re.sub(r'(?<![\wÀ-ÿ])UaiPertim(?![\wÀ-ÿ])', 'Uai ' + pertim, t)
        t = re.sub(r'(?<![\wÀ-ÿ])Pertim(?![\wÀ-ÿ])', pertim, t)
    return t


def tts(cfg, text, extra=None):
    body = {'text': text, **cfg, 'seed': SEED, **(extra or {})}
    headers = {'Content-Type': 'application/json', 'Accept': 'application/json'}
    key = os.environ.get('ELEVENLABS_API_KEY') or os.environ.get('XI_API_KEY')
    if key:
        headers['xi-api-key'] = key                     # nunca impresso nem gravado
    req = urllib.request.Request(API.format(voice=VOICE), data=json.dumps(body).encode(), headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=240) as r:
            return {'ok': True, 'http': r.status, 'resposta': json.load(r), 'enviado': {k: v for k, v in body.items() if k != 'text'}}
    except urllib.error.HTTPError as e:
        try:
            det = json.load(e)
        except Exception:
            det = {}
        return {'ok': False, 'http': e.code, 'erro': det, 'enviado': {k: v for k, v in body.items() if k != 'text'}}


def salva(nome, r, texto_api):
    d = r['resposta']
    mp3 = base64.b64decode(d['audio_base64'])
    open(os.path.join(SAIDA, nome + '.mp3'), 'wb').write(mp3)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(SAIDA, nome + '.mp3'), '-ar', '44100', '-ac', '1',
                    os.path.join(SAIDA, nome + '.wav')], check=True)
    al = d.get('alignment') or d.get('normalized_alignment')
    json.dump({'nome': nome, 'texto_api': texto_api, 'enviado': r['enviado'], 'sha1_mp3': hashlib.sha1(mp3).hexdigest(),
               'tem_alinhamento': bool(d.get('alignment')), 'tem_alinhamento_normalizado': bool(d.get('normalized_alignment')),
               'alinhamento': al, 'quando': time.strftime('%Y-%m-%d %H:%M')},
              open(os.path.join(SAIDA, nome + '.json'), 'w'), ensure_ascii=False, indent=1)
    print(f'  ok {nome}.mp3 ({len(mp3) / 1024:.0f} kB)')


def main():
    os.makedirs(SAIDA, exist_ok=True)
    T = {}
    pedidos = [
        ('A-atual', A, pronounce(TEXTO)),
        ('B-v4-perr-tim', B, troca(TEXTO, 'Pérr-tim')),
        ('B-v4-pertim-acento', B, troca(TEXTO, 'Pértim')),
        ('B-v4-perrtim', B, troca(TEXTO, 'Pérrtim')),
        ('B-v4-pertim-puro', B, troca(TEXTO, None)),
        ('A-dicionario-pausas', A, pronounce(PAUSAS)),
        ('B-v4-dicionario-pausas', B, troca(PAUSAS, 'Pérr-tim')),
    ]
    for nome, cfg, texto in pedidos:
        r = tts(cfg, texto)
        T[nome] = {k: v for k, v in r.items() if k != 'resposta'}
        if not r['ok']:
            print(f'  FALHA {nome}: HTTP {r["http"]} {json.dumps(r["erro"], ensure_ascii=False)[:300]}')
            if r['http'] in (401, 404) or 'voice' in json.dumps(r['erro']).lower() and 'not' in json.dumps(r['erro']).lower():
                print('PARADO: a API recusou a chave ou a voz; a voz não é trocada.')
                break
            continue
        salva(nome, r, texto)
    # conferências técnicas do v4
    if T.get('B-v4-perr-tim', {}).get('ok'):
        r = tts(B, troca(TEXTO, 'Pérr-tim'))                       # a mesma geração de novo, seed 42
        T['B-v4-perr-tim-repetida'] = {k: v for k, v in r.items() if k != 'resposta'}
        if r['ok']:
            salva('B-v4-perr-tim-repetida', r, troca(TEXTO, 'Pérr-tim'))
        r = tts(B, 'Pode chamar, sô.', {'previous_text': 'No sábado também tem!', 'next_text': 'Uai, é o Uai Pérr-tim.'})
        T['B-v4-previous-next'] = {k: v for k, v in r.items() if k != 'resposta'}
        r = tts({'model_id': 'eleven_v4', 'voice_settings': {'stability': 0.50, 'similarity_boost': 0.75, 'style': 0.35, 'use_speaker_boost': True}}, 'Pode chamar, sô.')
        T['B-v4-com-style-e-speaker-boost'] = {k: v for k, v in r.items() if k != 'resposta'}
    json.dump(T, open(os.path.join(SAIDA, 'tecnico.json'), 'w'), ensure_ascii=False, indent=1)
    for k, v in T.items():
        print(f'  {k}: HTTP {v["http"]}' + ('' if v['ok'] else ' · ' + json.dumps(v.get('erro'), ensure_ascii=False)[:300]))


if __name__ == '__main__':
    main()
