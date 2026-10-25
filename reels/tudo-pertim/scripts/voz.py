#!/usr/bin/env python3
"""
Narração de um episódio da série TUDO PERTIM (UaiPertim) — ElevenLabs, endpoint com marcação de tempo (with-timestamps).

    python3 scripts/voz.py tudo-pertim-01               -> gera os capítulos que ainda não têm narração
    python3 scripts/voz.py tudo-pertim-01 --refaz 3,5   -> gera de novo os capítulos 3 e 5, INTEIROS (nova seed)
    python3 scripts/voz.py tudo-pertim-01 --medir       -> só mostra a conferência (sem chamar a API)
    python3 scripts/voz.py tudo-pertim-02 --refaz 0 --seed 2042   -> gera o capítulo 0 INTEIRO com exatamente essa seed
                                                                    (uma tentativa só; se não passar na conferência, para)

REGRA DA SÉRIE: cada capítulo é UMA geração inteira (todas as frases do capítulo numa chamada só). Se uma frase sair
ruim, o capítulo inteiro é gerado de novo com outra seed; nunca se emendam palavras ou trechos de gerações diferentes.
Cada capítulo fica em audio/<id>/voz/cap-NN.wav (o áudio que a API devolveu, sem cortes) e o histórico em falas.json.

Conferência automática de cada geração (se falhar, o capítulo inteiro é gerado de novo com outra seed, até 3 vezes;
se as 3 falharem, o script PARA, guarda o histórico e não troca o áudio que já existia — nunca se muda o texto sozinho):
  • ritmo entre 8 e 19 caracteres falados por segundo;
  • nenhuma pausa interna maior que 0,9 s entre palavras;
  • a fala termina antes do fim do áudio (nada cortado no fim): sobram ≥ 50 ms depois da última letra e os últimos 40 ms
    do arquivo estão abaixo de −45 dBFS (no v4, quando a última letra vem colada no fim do arquivo, o fim da fala é medido no som: chiado.py);
  • nenhum chiado depois da fala (scripts/chiado.py): depois do fim da última letra do alinhamento, nenhum trecho acima
    de −45 dB com mais de 50% da energia em 4–10 kHz, a não ser que a última palavra termine em s/z/x (ex.: um
    "Glória" que sai "Glórias").

VOZ (scripts/voz_versao.py escolhe pelo campo "voz" do JSON do episódio; sempre Victor Pinho, LuQ9eaWO9yCQrR73VQFa,
seed 42 como ponto de partida):
  • sem o campo (ep01–ep03): audio/voz_oficial.json — eleven_multilingual_v2, estabilidade 0,40 · semelhança 0,80 ·
    estilo 0,35 · speaker boost. Pronúncia de audio/elevenlabs.py → pronounce(): só o texto enviado à API muda
    ("UaiPertim" → "Uai Pérr-tim", "Pertim" → "Pérr-tim"); na tela continua normal.
  • "voz": "v4" (padrão do ep04 em diante): audio/voz_v4.json — eleven_v4, estabilidade 0,50 · semelhança 0,75 (sem
    style nem speaker boost). Pronúncia padrão (só na API): "UaiPertim" → "Uai Pértim", "Pertim" → "Pértim"; as tags
    <break …/> saem do texto enviado (o v4 as ignora). Plano B por capítulo: "pronuncia": "UaiPértim" ou "sem-troca".
    A seed do v4 não é 100% repetível: a narração aprovada fica salva aqui e o render sempre usa o arquivo salvo
    (este script só chama a API para capítulo novo, com texto mudado ou pedido em --refaz).
O texto vizinho vai como contexto (previous_text / next_text), já com a mesma grafia.
Se a API recusar a voz (não encontrada, sem permissão, chave inválida), o script PARA e avisa: nunca troca de voz.

A chave da API NÃO fica no repositório nem é impressa: nesta nuvem a rede a põe no cabeçalho xi-api-key
(Segredos de rede); fora dela, defina ELEVENLABS_API_KEY (ou XI_API_KEY) no ambiente.
"""
import base64
import hashlib
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request
import numpy as np
from scipy.io import wavfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = os.path.dirname(os.path.dirname(ROOT))
sys.path.insert(0, os.path.join(REPO, 'audio'))
from voz_versao import config, para_api, versao  # noqa: E402  (v2 ou v4 por episódio, e a grafia enviada à API)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import chiado  # noqa: E402  (a conferência do chiado depois da fala)

EP = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else 'tudo-pertim-01'
OUT = os.path.join(ROOT, 'audio', EP, 'voz')
API = 'https://api.elevenlabs.io/v1/text-to-speech/{voice}/with-timestamps?output_format={fmt}'
SCRIPT = json.load(open(os.path.join(ROOT, 'episodios', EP + '.json'), encoding='utf-8'))
VOZ = config(SCRIPT)                                   # audio/voz_oficial.json (v2) ou audio/voz_v4.json ("voz": "v4")
VOICE, MODEL, SETTINGS, SEED0 = VOZ['voiceId'], VOZ['model'], VOZ['voiceSettings'], VOZ.get('seed', 42)
SR = 44100
TENTATIVAS = 3
PARA = ('voice_not_found', 'invalid_api_key', 'unauthorized', 'missing_permissions', 'needs_authorization', 'voice_access_denied',
        'quota_exceeded', 'detected_unusual_activity')


def texto_cap(c):
    return ' '.join(f['texto'] for f in c['fala'])


def confere_texto(t):
    if re.search(r'\bde\s+Glória\b', t, re.IGNORECASE):
        raise SystemExit(f'o texto diz "de Glória" (o certo é "do Glória"/"no Glória"): {t}')


def tts(text, prev, nxt, seed):
    body = {'text': text, 'model_id': MODEL, 'voice_settings': SETTINGS, 'seed': seed, 'previous_text': prev, 'next_text': nxt}
    headers = {'Content-Type': 'application/json', 'Accept': 'application/json'}
    key = os.environ.get('ELEVENLABS_API_KEY') or os.environ.get('XI_API_KEY')
    if key:
        headers['xi-api-key'] = key                    # nunca impresso nem gravado
    ultimo = VOZ.get('outputFormat', 'mp3_44100_128')
    for fmt in ('pcm_44100', 'mp3_44100_192', ultimo):  # o melhor que o plano liberar
        req = urllib.request.Request(API.format(voice=VOICE, fmt=fmt), data=json.dumps(body).encode(), headers=headers, method='POST')
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                d = json.load(r)
        except urllib.error.HTTPError as e:
            try:
                det = json.load(e).get('detail', {})
            except Exception:
                det = {}
            status = det.get('status', '') if isinstance(det, dict) else ''
            msg = det.get('message', '') if isinstance(det, dict) else str(det)
            if e.code in (401, 404) or status in PARA:
                raise SystemExit(f'PARADO: a API recusou a voz oficial ({VOZ["name"]}, {VOICE}): HTTP {e.code} {status} — {msg}\n'
                                 '  A voz não é trocada. Confira a chave em Segredos de rede (xi-api-key) e se a voz está em My Voices.')
            if e.code in (400, 403, 422) and fmt != ultimo:
                continue                                # formato não liberado no plano: tenta o próximo
            raise SystemExit(f'PARADO: HTTP {e.code} {status} — {msg}')
        raw = base64.b64decode(d['audio_base64'])
        if fmt.startswith('pcm'):
            x = np.frombuffer(raw, '<i2').astype(np.float32) / 32768
        else:
            x = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', '-', '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'],
                                             input=raw, capture_output=True, check=True).stdout, '<i2').astype(np.float32) / 32768
        return x, d['alignment'], fmt
    raise SystemExit('nenhum formato de áudio aceito pela API')


def palavras(al):
    ch, st, en = al['characters'], al['character_start_times_seconds'], al['character_end_times_seconds']
    out, cur = [], None
    for c, a, b in zip(ch, st, en):
        if c.isspace():
            if cur:
                out.append(cur); cur = None
            continue
        if cur is None:
            cur = {'w': '', 't0': a, 't1': b, 'fim_letra': None}
        cur['w'] += c; cur['t1'] = b
        if c.isalnum():
            cur['fim_letra'] = b
    if cur:
        out.append(cur)
    return [w for w in out if w['fim_letra'] is not None]


def confere(x, al, texto):
    """(ok, motivo, números) de uma geração"""
    ws = palavras(al)
    ini, fim = ws[0]['t0'], chiado.ultima_letra(al, x, SR)   # (no v4, a última letra colada no fim do arquivo vem do som)
    letras = sum(c.isalnum() for c in texto)
    ritmo = letras / max(0.1, fim - ini)
    gaps = [b['t0'] - a['fim_letra'] for a, b in zip(ws, ws[1:])]
    maior = max(gaps) if gaps else 0.0
    sobra = len(x) / SR - fim
    n = {'ritmo_letras_s': round(ritmo, 1), 'maior_pausa_s': round(maior, 2), 'sobra_no_fim_s': round(sobra, 2), 'fala_s': round(fim - ini, 2)}
    if not 8 <= ritmo <= 19:
        return False, f'ritmo {ritmo:.1f} letras/s', n
    if maior > 0.9:
        return False, f'pausa interna de {maior:.2f} s', n
    cauda = x[-int(0.04 * SR):]
    n['fim_do_arquivo_db'] = round(float(20 * np.log10(np.sqrt(np.mean(np.square(cauda, dtype=np.float64))) + 1e-12)), 1)
    if sobra < 0.05 or n['fim_do_arquivo_db'] > -45:
        return False, 'fala cortada no fim', n
    ok_ch, motivo_ch, num_ch = chiado.confere(x, SR, al, texto)
    n.update({'chiado_pior_fracao': num_ch['pior_fracao_4_10khz'], 'chiado_pior_db': num_ch['pior_db']})
    if not ok_ch:
        return False, motivo_ch, n
    return True, 'ok', n


def gerar(refaz, seed_fixa=None):
    os.makedirs(OUT, exist_ok=True)
    caps = SCRIPT['capitulos']
    path = os.path.join(OUT, 'falas.json')
    D = json.load(open(path)) if os.path.exists(path) else {'capitulos': {}}
    for n, c in enumerate(caps):
        key = f'{n:02d}'
        texto = texto_cap(c)
        confere_texto(texto)
        api = para_api(texto, SCRIPT, c)
        if MODEL == 'eleven_v4' and '<break' in api:
            raise SystemExit(f'capítulo {key}: sobrou <break> no texto do v4 (ele ignora a tag)')
        atual = D['capitulos'].get(key)
        if atual and atual['texto'] == texto and atual.get('texto_api') == api and n not in refaz and os.path.exists(os.path.join(OUT, f'cap-{key}.wav')):
            continue
        prev = para_api(texto_cap(caps[n - 1]), SCRIPT, caps[n - 1]) if n else None
        nxt = para_api(texto_cap(caps[n + 1]), SCRIPT, caps[n + 1]) if n + 1 < len(caps) else None
        hist = atual['historico'] if atual and atual['texto'] == texto else []
        seed = c.get('seed', SEED0) + 1000 * len(hist)
        tentativas = TENTATIVAS
        if seed_fixa is not None and n in refaz:
            seed, tentativas = seed_fixa, 1                 # a seed escolhida: uma geração inteira, sem trocar de seed
        for k in range(tentativas):
            x, al, fmt = tts(api, prev, nxt, seed)
            ok, motivo, num = confere(x, al, api)
            hist.append({'seed': seed, 'formato': fmt, 'resultado': motivo, **num, 'quando': time.strftime('%Y-%m-%d %H:%M')})
            print(f'  cap {key}: seed {seed} · {motivo} · {num["fala_s"]} s · {num["ritmo_letras_s"]} letras/s · maior pausa {num["maior_pausa_s"]} s')
            if ok:
                break
            seed += 1000
        if not ok:
            # as 3 seeds falharam: guarda o histórico, mantém o áudio que já existia e para (o texto nunca muda sozinho)
            if atual:
                atual['historico'] = hist; atual['geracoes'] = len(hist)
                json.dump(D, open(path, 'w'), ensure_ascii=False, indent=1)
            raise SystemExit(f'PARADO: o capítulo {key} falhou na conferência em {tentativas} seed(s) seguida(s) ({motivo}). '
                             'Nada foi trocado; decida antes de mudar o texto.')
        pcm = np.round(np.clip(x, -1, 1) * 32767).astype(np.int16)
        wavfile.write(os.path.join(OUT, f'cap-{key}.wav'), SR, pcm)
        ws = palavras(al)
        D['capitulos'][key] = {'n': n, 'texto': texto, 'texto_api': api, 'seed': seed, 'formato': fmt, 'duracao_audio': round(len(x) / SR, 3),
                               'inicio_da_fala': round(ws[0]['t0'], 3), 'fim_da_fala': round(chiado.ultima_letra(al, x, SR), 3),
                               'sha1_audio': hashlib.sha1(pcm.tobytes()).hexdigest(), 'geracoes': len(hist), 'historico': hist,
                               'alinhamento': al}
        D.update({'voz': VOZ['name'], 'voice_id': VOICE, 'modelo': MODEL, 'ajustes': SETTINGS, 'pronuncia': VOZ.get('pronuncia', {}),
                  'regra': 'uma geração inteira por capítulo; nada emendado'})
        if versao(SCRIPT) == 'v4':                       # (o v2 grava falas.json exatamente como antes)
            D['versao_voz'] = 'v4'
            D['capitulos'][key]['pronuncia_planoB'] = c.get('pronuncia')
        json.dump(D, open(path, 'w'), ensure_ascii=False, indent=1)


def medir():
    D = json.load(open(os.path.join(OUT, 'falas.json')))
    tot = 0
    print(f'voz: {D["voz"]} · modelo {D["modelo"]} · ajustes {json.dumps(D["ajustes"])}')
    for key in sorted(D['capitulos']):
        f = D['capitulos'][key]
        d = f['fim_da_fala'] - f['inicio_da_fala']; tot += d
        print(f'  cap {key}: {d:5.2f} s · {f["geracoes"]} geração(ões), usada a seed {f["seed"]} · "{f["texto"][:60]}…"')
    print(f'  soma das falas: {tot:.1f} s')


if __name__ == '__main__':
    refaz = set()
    if '--refaz' in sys.argv:
        refaz = {int(v) for v in sys.argv[sys.argv.index('--refaz') + 1].split(',')}
    if '--medir' not in sys.argv:
        gerar(refaz, int(sys.argv[sys.argv.index('--seed') + 1]) if '--seed' in sys.argv else None)
    medir()
