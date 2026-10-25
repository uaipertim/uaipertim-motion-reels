"""0) Sondagem prática do eleven_v4: endpoint with-timestamps, seed, previous_text/next_text e <break>.
Grava sondas/sonda.json (sem chave) e os mp3 curtos em sondas/."""
import hashlib, json
import api

V4 = {'model_id': 'eleven_v4', 'voice_settings': {'stability': 0.5, 'similarity_boost': 0.75}}
FRASE = 'Domingo de manhã, cê já fez o pedido?'
R = {}


def run(nome, body, ts=True):
    s, det, mp3, al = api.tts({**V4, **body}, ts)
    if mp3:
        open(f'sondas/{nome}.mp3', 'wb').write(mp3)
    R[nome] = {'enviado': {k: v for k, v in body.items()}, 'http': s, 'erro': det,
               'md5_audio': hashlib.md5(mp3).hexdigest() if mp3 else None, 'tem_alinhamento': bool(al)}
    if al:
        R[nome]['alinhamento'] = al
    print(nome, s, det or '', R[nome]['md5_audio'] or '')
    return al


run('endpoint_sem_timestamps', {'text': FRASE, 'seed': 42}, ts=False)
run('seed42_a', {'text': FRASE, 'seed': 42})
run('seed42_b', {'text': FRASE, 'seed': 42})
run('seed43', {'text': FRASE, 'seed': 43})
run('contexto', {'text': FRASE, 'seed': 42, 'previous_text': 'Uai, sô!', 'next_text': 'A entrega chega pertinho.'})
run('break_com', {'text': 'Trem. <break time="0.4s" /> Qualquer coisa.', 'seed': 42})
run('break_sem', {'text': 'Trem. Qualquer coisa.', 'seed': 42})
run('break_1s', {'text': 'Trem. <break time="1.0s" /> Qualquer coisa.', 'seed': 42})
json.dump(R, open('sondas/sonda.json', 'w'), ensure_ascii=False, indent=1)
