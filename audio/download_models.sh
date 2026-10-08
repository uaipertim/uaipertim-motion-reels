#!/usr/bin/env bash
# Baixa os modelos de voz para audio/models/
#  - Piper pt-BR (padrão): pt_BR-cadu-medium e pt_BR-faber-medium — falantes brasileiros nativos,
#    datasets CC0 (uso comercial liberado). Fonte: releases do sherpa-onnx no GitHub.
#  - Kokoro v1.0 (alternativa, vozes pf_dora/pm_alex/pm_santa).
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)/models"
mkdir -p "$DIR/piper"
TMP="$(mktemp -d)"
for v in cadu faber; do
  if [ ! -f "$DIR/piper/pt_BR-$v-medium.onnx" ]; then
    curl -fL --retry 3 "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-pt_BR-$v-medium.tar.bz2" | tar xj -C "$TMP"
    cp "$TMP/vits-piper-pt_BR-$v-medium/pt_BR-$v-medium.onnx" "$TMP/vits-piper-pt_BR-$v-medium/pt_BR-$v-medium.onnx.json" "$DIR/piper/"
    cp "$TMP/vits-piper-pt_BR-$v-medium/MODEL_CARD" "$DIR/piper/pt_BR-$v-medium.MODEL_CARD.md"
  fi
done
rm -rf "$TMP"
BASE=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
for f in kokoro-v1.0.onnx voices-v1.0.bin; do
  [ -f "$DIR/$f" ] || curl -fL --retry 3 -o "$DIR/$f" "$BASE/$f"
done
echo "Modelos em $DIR"
