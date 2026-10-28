#!/usr/bin/env bash
# Um episódio da série EXPLICA, SÔ! (UaiPertim), do roteiro ao vídeo revisado, num comando só:
#   scripts/episodio.sh explica-so-02              (gera na API a narração dos capítulos que ainda não têm)
#   scripts/episodio.sh explica-so-02 --refaz 3,5  (gera de novo, INTEIROS, os capítulos 3 e 5, com outra seed)
#   scripts/episodio.sh explica-so-02 --previa     (sem API: tempos estimados, sem voz, só para conferir o visual)
# Lê episodios/explica-so-02.json e gera, em output/explica-so-02/: o MP4, a capa (png + jpg), o storyboard e a revisão.
# A chave do ElevenLabs NUNCA fica no repositório: nesta nuvem a rede a põe no cabeçalho xi-api-key
# (Segredos de rede); fora dela, exporte ELEVENLABS_API_KEY no ambiente do terminal.
set -euo pipefail
cd "$(dirname "$0")/.."
EP="${1:?uso: scripts/episodio.sh <id do episódio, ex. explica-so-02> [--refaz 3,5 | --previa]}"
test -f "episodios/$EP.json" || { echo "episodios/$EP.json não existe"; exit 1; }
if [ "${2:-}" = "--previa" ]; then
  python3 scripts/linha.py "$EP" --previa
  node scripts/render.cjs cues --ep "$EP" --previa
  python3 scripts/audio.py "$EP" --previa
  node scripts/render.cjs video --ep "$EP" --previa
  node scripts/render.cjs capa --ep "$EP" --previa
  python3 scripts/revisao_capa.py . --saida "output/$EP/previa"
  node scripts/render.cjs info --ep "$EP" --previa
  python3 scripts/qa.py "$EP" --previa || true
  python3 scripts/storyboard.py "$EP" --previa
  exit 0
fi
python3 scripts/voz.py "$EP" ${2:+"$2"} ${3:+"$3"}  # uma geração inteira por capítulo (só os que faltam ou mudaram); para se a voz for recusada
python3 scripts/linha.py "$EP"                      # capítulos, frases, apoios e palavras no tempo do vídeo + a narração montada + o mapa de tempos
node scripts/render.cjs cues --ep "$EP"             # os eventos da animação -> audio/$EP/cues.json
python3 scripts/audio.py "$EP"                      # voz + trilha contínua com ducking + efeitos -> audio/$EP/mix.wav (−14 LUFS)
node scripts/render.cjs video --ep "$EP"            # -> output/$EP/uaipertim-<id>.mp4
# a capa: o quadro 0. Com "capa_separada": true no JSON, a capa.png aprovada (usada no "Editar capa") fica como está
# e o quadro 0 é o gancho animado
if python3 -c "import json,sys; sys.exit(0 if json.load(open('episodios/$EP.json')).get('capa_separada') else 1)"; then
  echo "capa separada: output/$EP/capa.png fica como está (o quadro 0 é o gancho)"
else
  node scripts/render.cjs capa --ep "$EP"           # -> output/$EP/capa.png (o quadro 0) + revisao/capa-caixas.json
fi
python3 scripts/revisao_capa.py . --saida "output/$EP"
node scripts/render.cjs info --ep "$EP"             # -> revisao/motor.json + caixas.json (dados para a revisão)
python3 scripts/qa.py "$EP"
python3 scripts/storyboard.py "$EP"
