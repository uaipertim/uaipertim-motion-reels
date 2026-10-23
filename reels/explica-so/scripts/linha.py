#!/usr/bin/env python3
"""
A linha do tempo de um episódio da série EXPLICA, SÔ!: junta a narração (audio/<id>/voz/, uma geração por capítulo) e
o roteiro (episodios/<id>.json), e confere o mapa de tempos.

    python3 scripts/linha.py explica-so-01           -> audio/explica-so-01/linha.json  (capítulos, frases, palavras e apoios no tempo do vídeo)
                                                        audio/explica-so-01/voz.wav     (a narração montada, 48 kHz mono)
    python3 scripts/linha.py explica-so-01 --previa  -> audio/explica-so-01/previa/linha.json, com tempos ESTIMADOS (≈14 letras/s)
                                                        e sem voz: só para conferir o visual antes de gastar a API. Nunca vira vídeo final.

Tempo de cada capítulo:
  • a câmera chega no capítulo em t0 (o capítulo 00 começa no quadro 0, já com a capa montada);
  • a voz entra `inicio` s depois (padrão 0,25 s; no capítulo 00, 0,10 s);
  • o capítulo dura até o fim da voz + `segura` (padrão 0,45 s), com mínimo `min` (o fecho usa 7,5 s);
  • a troca para o próximo capítulo (a motinha na rua da entrega) dura TR = 0,9 s.
Linha de apoio: uma por frase (o "apoio" de cada frase no JSON; null = nenhuma), entrando junto com a frase, mas nunca
antes de a anterior ter ficado 1,5 s inteira na tela (entrada de 0,34 s + 1,5 s + folga = 1,92 s entre trocas). A última
fica ao menos 1,92 s antes da troca de capítulo.
Pronúncia: a API recebe o texto com a grafia de pronúncia (audio/elevenlabs.py → pronounce(): "UaiPertim" vira
"Uai Pérr-tim"); as palavras do alinhamento voltam a ser as da tela aqui, então "em": "UaiPertim" funciona normalmente.
Voz: o áudio de cada capítulo entra INTEIRO e contínuo (só se tira o silêncio antes da 1ª letra e depois da última, com
fades de 8 ms / 60 ms nas pontas). Nada é cortado ou emendado dentro de um capítulo; a colocação de cada um fica
registrada em linha.json ("colocacao") para a revisão conferir.

MAPA DE TEMPOS (conferido aqui; se falhar, o script sai com erro e diz o que ajustar em `segura`/`min` — nunca emendar áudio):
  • duração total de 30 a 45 s;
  • cada linha de apoio ≥ 1,5 s inteira na tela;
  • fecho de 6 a 8 s;
  • a logo oficial do fecho já parada nos 3 últimos segundos.
"""
import json
import os
import re
import sys
import unicodedata
import numpy as np
from scipy.io import wavfile
from scipy.signal import resample_poly

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = os.path.dirname(os.path.dirname(ROOT))
sys.path.insert(0, os.path.join(REPO, 'audio'))
from elevenlabs import pronounce  # noqa: E402

EP = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else 'explica-so-01'
PREVIA = '--previa' in sys.argv
AUD = os.path.join(ROOT, 'audio', EP)
DEST = os.path.join(AUD, 'previa') if PREVIA else AUD
SCRIPT = json.load(open(os.path.join(ROOT, 'episodios', EP + '.json'), encoding='utf-8'))
SR_IN, SR = 44100, 48000
TR = 0.9                      # a troca de capítulo (a motinha na rua)
AP_ENTRA = 0.34               # a linha de apoio entra em 0,34 s (a anterior sai antes: as duas nunca se sobrepõem)
AP_LEITURA = 1.5              # e fica ao menos 1,5 s inteira na tela
AP_PASSO = AP_ENTRA + AP_LEITURA + 0.08
PRE, POS = 0.04, 0.30         # o que fica do áudio antes da 1ª letra e depois da última
# duração total: 30–45 s na série; os episódios especiais têm o seu limite (o fecho, os apoios e a logo seguem iguais)
LIMITES = {'historia-uaipertim': (60.0, 80.0)}
DUR_MIN, DUR_MAX = LIMITES.get(EP, (30.0, 45.0))
FECHO_MIN, FECHO_MAX = 6.0, 8.0
LOGO_PRONTA = 0.9             # a logo do fecho entra e para em até 0,9 s depois da palavra (src/anim.js, CENAS.fecho)


def pron(c, t):
    """o texto enviado à API: primeiro as grafias só deste capítulo (campo "pronuncia" do capítulo no JSON, ex.:
    {"UaiPertim": "Uai perr-tím"}), depois a regra fixa de pronúncia (audio/voz_oficial.json → pronounce())"""
    for k, v in sorted((c.get('pronuncia') or {}).items(), key=lambda kv: -len(kv[0])):
        t = re.sub(rf'(?<![\wÀ-ÿ]){re.escape(k)}(?![\wÀ-ÿ])', v, t)
    return pronounce(t)


def norm(s):
    s = unicodedata.normalize('NFD', s.lower())
    return re.sub(r'[^a-z0-9]', '', ''.join(c for c in s if unicodedata.category(c) != 'Mn'))


def letras(al):
    """lista (índice, caractere, início, fim) do alinhamento"""
    return list(zip(range(len(al['characters'])), al['characters'], al['character_start_times_seconds'], al['character_end_times_seconds']))


def tokens(al):
    out, cur = [], None
    for i, c, a, b in letras(al):
        if c.isspace():
            if cur:
                out.append(cur); cur = None
            continue
        if cur is None:
            cur = {'w': '', 'i0': i, 't0': a, 't1': b}
        cur['w'] += c
        if c.isalnum():
            cur['t1'] = b
    if cur:
        out.append(cur)
    return [w for w in out if norm(w['w'])]


def palavras(texto, al, desloc, c):
    """as palavras DA TELA no tempo do vídeo: cada palavra do roteiro consome as palavras da grafia de pronúncia
    (ex.: "UaiPertim." -> "Uai" + "Pérr-tim.")"""
    api = tokens(al)
    out, k = [], 0
    for w in [w for w in texto.split() if norm(w)]:
        n = len([x for x in pron(c, w).split() if norm(x)])
        grupo = api[k:k + n]
        assert len(grupo) == n, f'alinhamento não bate com o texto em "{w}"'
        k += n
        out.append({'w': w, 'n': norm(w), 'i0': grupo[0]['i0'], 't0': round(grupo[0]['t0'] + desloc, 4), 't1': round(grupo[-1]['t1'] + desloc, 4)})
    assert k == len(api), 'sobraram palavras no alinhamento'
    return out


def estimado(texto_api):
    """PRÉVIA: um alinhamento estimado (≈14 letras/s, pausas na pontuação). Só para o visual; nunca para o vídeo final."""
    ch, st, en, t = [], [], [], 0.05
    for i, c in enumerate(texto_api):
        d = 1 / 14.0 if c.isalnum() else 0.03
        if c in ',;:':
            d = 0.16
        elif c in '.?!':
            d = 0.32
        elif c == '…':
            d = 0.38
        ch.append(c); st.append(round(t, 3)); en.append(round(t + d, 3)); t += d
    return {'characters': ch, 'character_start_times_seconds': st, 'character_end_times_seconds': en}


def falas():
    if not PREVIA:
        return json.load(open(os.path.join(AUD, 'voz', 'falas.json')))['capitulos']
    F = {}
    for n, c in enumerate(SCRIPT['capitulos']):
        texto = ' '.join(f['texto'] for f in c['fala'])
        api = pron(c, texto)
        al = estimado(api)
        ws = tokens(al)
        F[f'{n:02d}'] = {'texto': texto, 'texto_api': api, 'alinhamento': al, 'inicio_da_fala': ws[0]['t0'], 'fim_da_fala': ws[-1]['t1'], 'seed': None}
    return F


def mapa(caps, dur):
    """confere o mapa de tempos; devolve a lista de falhas (com o que ajustar)"""
    falhas, linhas = [], []
    linhas.append(f'  duração total {dur:.2f} s (alvo {DUR_MIN:.0f}–{DUR_MAX:.0f} s)')
    if not DUR_MIN <= dur <= DUR_MAX:
        falhas.append(f'duração {dur:.2f} s fora de {DUR_MIN:.0f}–{DUR_MAX:.0f} s: ajuste `segura`/`min` (ou encurte o roteiro e gere a voz do capítulo inteiro de novo)')
    for c in caps:
        for i, a in enumerate(c['apoios']):
            inteira = a['ate'] - (a['t'] + AP_ENTRA)
            linhas.append(f'  cap {c["n"]:02d} apoio {i + 1}: {inteira:.2f} s inteira · "{a["texto"]}"')
            if inteira < AP_LEITURA - 1e-3:
                falhas.append(f'cap {c["n"]:02d}, apoio {i + 1}: só {inteira:.2f} s inteira (mínimo {AP_LEITURA} s): aumente `segura` do capítulo')
    f = caps[-1]
    fd = f['t1'] - f['t0']
    linhas.append(f'  fecho {fd:.2f} s (alvo {FECHO_MIN:.0f}–{FECHO_MAX:.0f} s)')
    if f['diagrama']['tipo'] != 'fecho':
        falhas.append('o último capítulo precisa ser o fecho')
    if not FECHO_MIN <= fd <= FECHO_MAX:
        falhas.append(f'fecho com {fd:.2f} s (alvo {FECHO_MIN:.0f}–{FECHO_MAX:.0f} s): ajuste `min`/`segura` do fecho')
    spec = (f['diagrama'].get('logo') or {}).get('em')
    tl = f['t0'] + 0.4
    if spec and not spec.startswith('+'):
        tl = next((w['t0'] for w in f['palavras'] if w['n'] == norm(spec)), tl)
    elif spec:
        tl = f['t0'] + float(spec[1:])
    tl = min(tl, dur - 3.0 - LOGO_PRONTA)              # o motor nunca deixa a logo entrar depois disso
    parada = tl + LOGO_PRONTA
    linhas.append(f'  logo oficial do fecho parada em {parada:.2f} s · nos últimos {dur - parada:.2f} s (mínimo 3 s)')
    if dur - parada < 3.0 - 1e-3:
        falhas.append('a logo não fica 3 s parada no fim: aumente `min` do fecho')
    return falhas, linhas


def main():
    FALAS = falas()
    caps, t = [], 0.0
    pistas = []
    for n, c in enumerate(SCRIPT['capitulos']):
        F = FALAS[f'{n:02d}']
        texto = ' '.join(f['texto'] for f in c['fala'])
        assert F['texto'] == texto, f'capítulo {n:02d}: o texto mudou desde a narração; rode scripts/voz.py {EP}'
        api = F.get('texto_api', texto)
        assert api == pron(c, texto), f'capítulo {n:02d}: a regra de pronúncia mudou desde a narração; rode scripts/voz.py {EP} --refaz {n}'
        al = F['alinhamento']
        ini, fim = F['inicio_da_fala'], F['fim_da_fala']
        t0 = t
        v0 = t0 + c.get('inicio', 0.10 if n == 0 else 0.25)
        desloc = v0 - ini                               # tempo do arquivo -> tempo do vídeo
        v1 = fim + desloc
        ws = palavras(texto, al, desloc, c)
        # as frases: o trecho de caracteres de cada uma no texto falado (já com a grafia de pronúncia)
        frases, pos = [], 0
        L = letras(al)
        for f in c['fala']:
            fa = pron(c, f['texto'])
            a, b = pos, pos + len(fa)
            alfa = [x for x in L[a:b] if x[1].isalnum()]
            frases.append({'texto': f['texto'], 'apoio': f.get('apoio'), 't0': round(alfa[0][2] + desloc, 4), 't1': round(alfa[-1][3] + desloc, 4)})
            pos = b + 1
        # as linhas de apoio
        apoios = []
        for f in frases:
            if not f['apoio'] or (apoios and apoios[-1]['texto'] == f['apoio']):
                continue
            ta = max(f['t0'] - 0.12, t0 + 0.30, (apoios[-1]['t'] + AP_PASSO) if apoios else -9)
            apoios.append({'t': round(ta, 4), 'texto': f['apoio']})
        t1 = max(v1 + c.get('segura', 0.45), t0 + c.get('min', 0), (apoios[-1]['t'] + AP_PASSO) if apoios else 0)
        for i, a in enumerate(apoios):
            a['ate'] = round(apoios[i + 1]['t'] if i + 1 < len(apoios) else t1 + TR, 4)
        caps.append({'n': n, 'rotulo': c.get('rotulo'), 'tom': c.get('tom', ['creme', 'pessego', 'amarelo', 'verde'][n % 4]),
                     'titulo': c['titulo'], 'risca_titulo': c.get('risca_titulo'), 'diagrama': c['diagrama'],
                     't0': round(t0, 4), 't1': round(t1, 4), 'voz_t0': round(v0, 4), 'voz_t1': round(v1, 4),
                     'palavras': ws, 'frases': frases, 'apoios': apoios, 'seed': F.get('seed')})
        pistas.append((n, ini, fim, desloc))
        t = t1 + TR if n + 1 < len(SCRIPT['capitulos']) else t1
    dur = t
    # o último apoio de cada capítulo sai na troca; o do fecho, no fim do vídeo
    if caps[-1]['apoios']:
        caps[-1]['apoios'][-1]['ate'] = round(dur, 4)
    os.makedirs(DEST, exist_ok=True)
    coloc = []
    if not PREVIA:
        # a narração montada: cada capítulo inteiro, contínuo
        x = np.zeros(int(round(dur * SR)) + SR)
        for n, ini, fim, desloc in pistas:
            sr, y = wavfile.read(os.path.join(AUD, 'voz', f'cap-{n:02d}.wav'))
            y = y.astype(np.float64) / 32768
            a, b = max(0.0, ini - PRE), min(len(y) / sr, fim + POS)
            seg = resample_poly(y[int(round(a * sr)):int(round(b * sr))], SR, sr)
            k0, k1 = int(0.008 * SR), int(0.06 * SR)
            seg[:k0] *= np.linspace(0, 1, k0); seg[-k1:] *= np.linspace(1, 0, k1)
            i = int(round((a + desloc) * SR))
            x[i:i + len(seg)] += seg
            coloc.append({'cap': n, 'arquivo': f'voz/cap-{n:02d}.wav', 'de_s': round(a, 4), 'ate_s': round(b, 4), 'no_video_s': round(a + desloc, 4),
                          'amostras': len(seg), 'fade_ms': [8, 60]})
        x = x[: int(round(dur * SR))]
        wavfile.write(os.path.join(AUD, 'voz.wav'), SR, np.round(np.clip(x, -1, 1) * 32767).astype(np.int16))
    falhas, linhas = mapa(caps, dur)
    json.dump({'episodio': EP, 'titulo': SCRIPT['titulo'], 'marca': SCRIPT.get('marca', '@uaipertim'), 'duracao': round(dur, 4), 'tr': TR,
               'ap_entra': AP_ENTRA, 'ap_leitura': AP_LEITURA, 'previa': PREVIA, 'capitulos': caps, 'colocacao': coloc,
               'mapa': {'ok': not falhas, 'falhas': falhas}},
              open(os.path.join(DEST, 'linha.json'), 'w'), ensure_ascii=False, indent=1)
    print(f'{EP}{" (PRÉVIA, tempos estimados, sem voz)" if PREVIA else ""}: {len(caps)} capítulos, {dur:.2f} s')
    for c in caps:
        print(f'  {c["n"]:02d} {str(c["rotulo"]):24s} {c["t0"]:6.2f}–{c["t1"]:6.2f} s ({c["t1"] - c["t0"]:.2f} s) · voz {c["voz_t0"]:.2f}–{c["voz_t1"]:.2f} · {len(c["apoios"])} apoio(s)')
    print('MAPA DE TEMPOS')
    print('\n'.join(linhas))
    if falhas:
        print('FALHA no mapa de tempos:\n  ' + '\n  '.join(falhas))
        sys.exit(1)
    print('  ok')


if __name__ == '__main__':
    main()
