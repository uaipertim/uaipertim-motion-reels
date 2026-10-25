"""0b) Confirmação do <break> no eleven_v4 sem a pontuação ajudando (e a tag [pause] como alternativa),
e a referência de repetibilidade da seed no eleven_multilingual_v2. Grava sondas/sonda2.json."""
import hashlib, json
import api
from audio_util import decode, palavras, silencios, SR

V4 = {'model_id': 'eleven_v4', 'voice_settings': {'stability': 0.5, 'similarity_boost': 0.75}}
V2 = {'model_id': 'eleven_multilingual_v2', 'voice_settings': {'stability': 0.4, 'similarity_boost': 0.8, 'style': 0.35, 'use_speaker_boost': True}}
R = {}
for nome, base, texto in [('v4_sem_pausa', V4, 'Trem qualquer coisa objeto situação tudo.'),
                          ('v4_break_1s_sem_ponto', V4, 'Trem <break time="1.0s" /> qualquer coisa objeto situação tudo.'),
                          ('v4_tag_pause', V4, 'Trem [pause] qualquer coisa objeto situação tudo.'),
                          ('v2_break_1s_sem_ponto', V2, 'Trem <break time="1.0s" /> qualquer coisa objeto situação tudo.'),
                          ('v2_seed42_a', V2, 'Domingo de manhã, cê já fez o pedido?'),
                          ('v2_seed42_b', V2, 'Domingo de manhã, cê já fez o pedido?')]:
    s, det, mp3, al = api.tts({**base, 'text': texto, 'seed': 42})
    r = {'modelo': base['model_id'], 'texto': texto, 'http': s, 'erro': det}
    if mp3:
        open(f'sondas/{nome}.mp3', 'wb').write(mp3); x = decode(mp3)
        r.update(duracao=round(len(x) / SR, 3), silencios=silencios(x), md5_audio=hashlib.md5(mp3).hexdigest(),
                 palavras=[(w['w'], round(w['t0'], 3), round(w['t1'], 3)) for w in palavras(al)])
    R[nome] = r
    print(nome, s, det or '', r.get('duracao'), r.get('silencios'))
json.dump(R, open('sondas/sonda2.json', 'w'), ensure_ascii=False, indent=1)
