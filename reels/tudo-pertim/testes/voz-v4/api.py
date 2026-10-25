"""Chamada mínima à ElevenLabs para o teste de voz v4 (não mexe na produção).
A chave nunca é lida/impressa aqui: nesta nuvem a rede injeta o cabeçalho xi-api-key; se houver XI_API_KEY no ambiente,
ela vai só no cabeçalho, nunca em log ou arquivo."""
import base64, json, os, urllib.request, urllib.error

VOICE = 'LuQ9eaWO9yCQrR73VQFa'                       # Victor Pinho (a mesma da voz oficial)
BASE = 'https://api.elevenlabs.io/v1/text-to-speech/{v}{ts}?output_format=mp3_44100_128'


def tts(body, timestamps=True):
    """Devolve (status_http, detalhe_do_erro, mp3_bytes, alignment)."""
    h = {'Content-Type': 'application/json', 'Accept': 'application/json' if timestamps else 'audio/mpeg'}
    key = os.environ.get('ELEVENLABS_API_KEY') or os.environ.get('XI_API_KEY')
    if key:
        h['xi-api-key'] = key
    url = BASE.format(v=VOICE, ts='/with-timestamps' if timestamps else '')
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers=h, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            raw = r.read()
            if not timestamps:
                return r.status, None, raw, None
            d = json.loads(raw)
            return r.status, None, base64.b64decode(d['audio_base64']), d.get('alignment')
    except urllib.error.HTTPError as e:
        try:
            det = json.load(e).get('detail')
        except Exception:
            det = None
        if isinstance(det, dict):
            det = {k: det.get(k) for k in ('status', 'code', 'message')}
        return e.code, det, None, None
