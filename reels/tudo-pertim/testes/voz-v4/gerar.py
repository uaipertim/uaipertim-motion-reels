"""Teste de voz v4 vs v2 (NÃO mexe na produção: só lê audio/voz_oficial.json e audio/elevenlabs.py → pronounce()).
Cada arquivo é UMA geração inteira (seed 42), sem emendar nada e sem previous_text/next_text.

    python3 gerar.py teste            -> os 5 arquivos do texto de teste
    python3 gerar.py dicionario NOME  -> A_atual_v2_dicionario + B_v4_dicionario_Perr-tim (+ a variante NOME, se dada)

Grava audios/<nome>.mp3 e resultados/<nome>.json (corpo enviado — sem chave —, alinhamento, durações, chiado, pausas)."""
import hashlib, json, os, re, sys
import api
from audio_util import decode, palavras, silencios, SR

AQUI = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(AQUI, '..', '..', '..', '..'))
sys.path.insert(0, os.path.join(REPO, 'audio'))
sys.path.insert(0, os.path.join(AQUI, '..', '..', 'scripts'))
from elevenlabs import pronounce  # noqa: E402  (a regra atual: UaiPertim → Uai Pérr-tim, Pertim → Pérr-tim)
import chiado  # noqa: E402

VOZ = json.load(open(os.path.join(REPO, 'audio', 'voz_oficial.json'), encoding='utf-8'))
SEED = 42
A = {'model_id': VOZ['model'], 'voice_settings': VOZ['voiceSettings']}                     # exatamente a voz oficial
B = {'model_id': 'eleven_v4', 'voice_settings': {'stability': 0.5, 'similarity_boost': 0.75}}  # sem style/speaker boost

TESTE = ('Domingo de manhã, cê já fez o pedido no UaiPertim? A entrega chega pertinho de você, no sábado e também no domingo. '
         'Uai, sô, que trem bão! Tudo pertim de você é UaiPertim. Dúvida? Chama no WhatsApp. '
         'E no fim de semana, quem resolve é o UaiPertim.')
DICIONARIO = ('Trem. <break time="0.4s" /> Qualquer coisa. Objeto, situação, tudo. Tipo: Me passa esse trem aí. '
              '<break time="0.4s" /> Aquele trem do mercado? Em breve, dá pra pedir no UaiPertim. <break time="0.4s" /> '
              'Manda pra quem chama tudo de trem.')

VARIANTES = {
    'sem-troca_Pertim': {},
    'Pertim-acento': {'UaiPertim': 'Uai Pértim', 'Pertim': 'Pértim'},
    'Perrtim': {'UaiPertim': 'Uai Pérrtim', 'Pertim': 'Pérrtim'},
    'Perr-tim': {'UaiPertim': 'Uai Pérr-tim', 'Pertim': 'Pérr-tim'},
}


def troca(texto, mapa):
    """igual a pronounce(): palavra inteira, ignora maiúsculas, mantém a inicial, chaves mais longas primeiro"""
    for w, s in sorted(mapa.items(), key=lambda kv: -len(kv[0])):
        texto = re.sub(rf'(?<![\wÀ-ÿ]){re.escape(w)}(?![\wÀ-ÿ])',
                       lambda m, s=s: s if m.group(0)[0].isupper() else s[0].lower() + s[1:], texto, flags=re.IGNORECASE)
    return texto


def marcas(enviado, al):
    """cada ocorrência de UaiPertim/pertim no texto enviado, como o alinhamento a devolveu, com os tempos de cada letra"""
    ch, st, en = al['characters'], al['character_start_times_seconds'], al['character_end_times_seconds']
    alinhado = ''.join(ch)
    out = []
    for m in re.finditer(r'(?:Uai\s)?P[ée]rr?-?tim|UaiPertim', enviado, flags=re.IGNORECASE):
        i, j = m.start(), m.end()
        if alinhado[i:j] != enviado[i:j]:
            out.append({'enviado': m.group(0), 'devolvido': alinhado[i:j], 'aviso': 'o alinhamento não bate com o texto enviado'}); continue
        k = j - 3                                                     # o "tim" final
        out.append({'enviado': m.group(0), 'devolvido': alinhado[i:j], 'ultima_letra': alinhado[j - 1],
                    'inicio_s': round(st[i], 3), 'fim_s': round(en[j - 1], 3),
                    'per_s': round(st[k] - st[i + m.group(0).lower().index('p')], 3),
                    'tim_s': round(en[j - 1] - st[k], 3), 'm_s': round(en[j - 1] - st[j - 1], 3),
                    'letras': [(alinhado[x], round(st[x], 3), round(en[x], 3)) for x in range(i, j)]})
    return out


def pausas(enviado, al, x):
    """para cada <break>: o vão entre a última letra antes da tag e a primeira depois (alinhamento) e o silêncio medido ali"""
    ch, st, en = al['characters'], al['character_start_times_seconds'], al['character_end_times_seconds']
    sil = silencios(x, limiar_db=-40, minimo=0.05)
    out = []
    for m in re.finditer(r'<break[^>]*/>', enviado):
        a = max(q for q in range(m.start()) if ch[q].isalnum()); b = min(q for q in range(m.end(), len(ch)) if ch[q].isalnum())
        t0, t1 = en[a], st[b]
        dentro = [s for s in sil if s[1] > t0 - 0.15 and s[0] < t1 + 0.15]
        out.append({'tag': m.group(0), 'antes': ch[a], 'depois': ch[b], 'vao_alinhamento_s': round(t1 - t0, 3),
                    'silencio_medido_s': round(max((s[2] for s in dentro), default=0.0), 3), 'silencios_ali': dentro})
    return out


def gera(nome, base, enviado, original):
    body = {**base, 'text': enviado, 'seed': SEED}
    s, det, mp3, al = api.tts(body)
    r = {'arquivo': nome + '.mp3', 'modelo': base['model_id'], 'configuracao': base['voice_settings'], 'seed': SEED,
         'endpoint': 'POST /v1/text-to-speech/{voice}/with-timestamps?output_format=mp3_44100_128', 'voz': api.VOICE,
         'texto_original': original, 'texto_enviado': enviado, 'http': s, 'erro': det}
    if mp3:
        os.makedirs(os.path.join(AQUI, 'audios'), exist_ok=True)
        open(os.path.join(AQUI, 'audios', nome + '.mp3'), 'wb').write(mp3)
        x = decode(mp3)
        ok, motivo, num = chiado.confere(x, SR, al, enviado)
        r.update(duracao_s=round(len(x) / SR, 3), md5_mp3=hashlib.md5(mp3).hexdigest(), chiado={'ok': ok, 'motivo': motivo, **num},
                 marcas=marcas(enviado, al), pausas=pausas(enviado, al, x) if '<break' in enviado else None,
                 palavras=[(w['w'], round(w['t0'], 3), round(w['t1'], 3)) for w in palavras(al)], alinhamento=al)
    os.makedirs(os.path.join(AQUI, 'resultados'), exist_ok=True)
    json.dump(r, open(os.path.join(AQUI, 'resultados', nome + '.json'), 'w'), ensure_ascii=False, indent=1)
    print(f"{nome}: HTTP {s} {det or ''} · {r.get('duracao_s')} s · chiado {r.get('chiado', {}).get('motivo')}")
    for mk in r.get('marcas') or []:
        print(f"   {mk['enviado']!r} -> {mk['devolvido']!r} · per {mk.get('per_s')} s · tim {mk.get('tim_s')} s · m {mk.get('m_s')} s")
    for pz in r.get('pausas') or []:
        print(f"   pausa: alinhamento {pz['vao_alinhamento_s']} s · silêncio {pz['silencio_medido_s']} s")
    return r


def remede():
    """refaz só as medidas (marcas) a partir do alinhamento já gravado, sem chamar a API"""
    for f in sorted(os.listdir(os.path.join(AQUI, 'resultados'))):
        p = os.path.join(AQUI, 'resultados', f); r = json.load(open(p))
        if r.get('alinhamento'):
            r['marcas'] = marcas(r['texto_enviado'], r['alinhamento']); json.dump(r, open(p, 'w'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    if sys.argv[1:2] == ['remede']:
        remede(); sys.exit()
    qual = sys.argv[1] if len(sys.argv) > 1 else 'teste'
    if qual == 'teste':
        gera('A_atual_v2_perr-tim', A, pronounce(TESTE), TESTE)
        gera('B_v4_sem-troca_Pertim', B, TESTE, TESTE)
        gera('B_v4_Pertim-acento', B, troca(TESTE, VARIANTES['Pertim-acento']), TESTE)
        gera('B_v4_Perrtim', B, troca(TESTE, VARIANTES['Perrtim']), TESTE)
        gera('B_v4_Perr-tim', B, troca(TESTE, VARIANTES['Perr-tim']), TESTE)
    else:
        gera('A_atual_v2_dicionario', A, pronounce(DICIONARIO), DICIONARIO)
        gera('B_v4_dicionario_Perr-tim', B, troca(DICIONARIO, VARIANTES['Perr-tim']), DICIONARIO)
        if len(sys.argv) > 2:
            v = sys.argv[2]
            gera(f'B_v4_dicionario_{v}', B, troca(DICIONARIO, VARIANTES[v]), DICIONARIO)
