#!/usr/bin/env bash
# Corte curto a partir de um Reel existente:  npm run corte -- A   (ou o caminho: cortes/corte-A.json)
# Saída: out/cortes/corte-X.mp4 + out/cortes/capa-corte-X.png (quadro 0 = capa)
set -euo pipefail
cd "$(dirname "$0")/.."
arg="${1:?informe a letra do corte (ex.: A) ou o caminho do JSON}"
if [[ -f "$arg" ]]; then json="$arg"; else json="cortes/corte-${arg^^}.json"; fi
id=$(basename "$json" .json)        # corte-A
mkdir -p out/cortes
python3 audio/cortes.py "$json"
npx remotion render CorteCurto "out/cortes/$id.mp4" --props="$json"
npx remotion still CorteCurto "out/cortes/capa-$id.png" --frame=0 --props="$json"
echo "pronto: out/cortes/$id.mp4"
