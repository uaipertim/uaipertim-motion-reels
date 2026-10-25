"""
Qual voz e qual grafia vão para a API, por episódio (usado por voz.py e linha.py).

  • sem o campo "voz" no JSON do episódio (ep01–ep04) → audio/voz_oficial.json (eleven_multilingual_v2) e a regra antiga
    de pronúncia (audio/elevenlabs.py → pronounce(): "UaiPertim" → "Uai Pérr-tim", "Pertim" → "Pérr-tim"). Nada muda.
  • "voz": "v4" (padrão do ep05 em diante) → audio/voz_v4.json (eleven_v4). O texto vai COMO ESTÁ ESCRITO, sem a troca
    "Pérr-tim"; as tags <break …/> saem do texto enviado (o v4 as ignora). Plano B por capítulo, desligado por padrão:
    "pronuncia": "Pértim" no capítulo ("UaiPertim" → "Uai Pértim", "Pertim"/"pertim" → "Pértim", só na API).
  • no v4 o alinhamento vem em degraus de ~40–80 ms: tempo_palavra() atrasa o início de cada palavra ATRASO_V4 e
    arredonda para o quadro (60 fps), para nenhuma peça entrar antes de a palavra soar.
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = os.path.dirname(os.path.dirname(ROOT))
sys.path.insert(0, os.path.join(REPO, 'audio'))
from elevenlabs import pronounce  # noqa: E402  (a regra antiga, do v2)

ARQUIVOS = {'v2': 'voz_oficial.json', 'v4': 'voz_v4.json'}
BREAK = re.compile(r'\s*<break\b[^>]*/?>\s*', re.IGNORECASE)
ATRASO_V4 = 0.06              # s: o alinhamento do v4 chega a marcar a palavra até ~60 ms antes do som (medido no teste 46e4f36)
FPS = 60


def versao(script):
    v = script.get('voz', 'v2')
    if v not in ARQUIVOS:
        raise SystemExit(f'"voz": "{v}" desconhecida no episódio (use "v4" ou deixe sem o campo para a voz antiga v2)')
    return v


def config(script):
    return json.load(open(os.path.join(REPO, 'audio', ARQUIVOS[versao(script)]), encoding='utf-8'))


def troca(texto, mapa):
    """como pronounce(): palavra inteira, ignora maiúsculas, mantém a inicial, chaves mais longas primeiro"""
    for w, s in sorted(mapa.items(), key=lambda kv: -len(kv[0])):
        texto = re.sub(rf'(?<![\wÀ-ÿ]){re.escape(w)}(?![\wÀ-ÿ])',
                       lambda m, s=s: s if m.group(0)[0].isupper() else s[0].lower() + s[1:], texto, flags=re.IGNORECASE)
    return texto


def sem_break(texto):
    return re.sub(r'\s{2,}', ' ', BREAK.sub(' ', texto)).strip()


def para_api(texto, script, cap=None):
    """o texto exatamente como vai para a API"""
    if versao(script) == 'v2':
        return pronounce(texto)
    t = sem_break(texto)
    plano = (cap or {}).get('pronuncia')
    if plano:
        mapas = config(script).get('pronuncia_planoB', {})
        if plano not in mapas:
            raise SystemExit(f'"pronuncia": "{plano}" desconhecida (opções: {", ".join(mapas)})')
        t = troca(t, mapas[plano])
    return t


def palavras_faladas(texto, script):
    """as palavras da tela que são faladas (no v4, sem as tags <break>)"""
    return (sem_break(texto) if versao(script) == 'v4' else texto).split()


def tempo_palavra(t, script):
    """o início de uma palavra no vídeo (v4: atrasado ATRASO_V4 e no quadro mais próximo; v2: como sempre foi)"""
    return round((t + ATRASO_V4) * FPS) / FPS if versao(script) == 'v4' else t
