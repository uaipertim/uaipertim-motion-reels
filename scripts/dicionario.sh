#!/usr/bin/env bash
# Dicionário Mineiro: gera um episódio a partir do JSON dele.
#   npm run dicionario -- 01        (ou o caminho do JSON: episodios/dicionario/01-uai.json)
# Saída em out/dicionario/: dicionario-NN-slug.mp4, capa-dicionario-NN.png (quadro 0) e capa-dicionario-NN_3x4.png.
set -euo pipefail
cd "$(dirname "$0")/.."
arg="${1:?informe o número do episódio (ex.: 01) ou o caminho do JSON}"
if [[ -f "$arg" ]]; then json="$arg"; else json=$(ls episodios/dicionario/"$(printf '%02d' "$((10#$arg))")"-*.json); fi
base=$(basename "$json" .json)          # ex.: 01-uai
nn=${base%%-*}
mkdir -p out/dicionario
python3 audio/dicionario.py "$json"
npx remotion render DicionarioMineiro "out/dicionario/dicionario-$base.mp4" --props="$json"
npx remotion still DicionarioMineiro "out/dicionario/capa-dicionario-$nn.png" --frame=0 --props="$json"
# prévia do recorte 3:4 da grade (y 240–1680)
ffmpeg -loglevel error -y -i "out/dicionario/capa-dicionario-$nn.png" -vf "crop=1080:1440:0:240" "out/dicionario/capa-dicionario-${nn}_3x4.png"
echo "pronto: out/dicionario/dicionario-$base.mp4"
