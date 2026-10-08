#!/usr/bin/env bash
# Baixa o modelo de TTS Kokoro v1.0 (vozes pt-BR: pf_dora, pm_alex, pm_santa) para audio/models/
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)/models"
mkdir -p "$DIR"
BASE=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
for f in kokoro-v1.0.onnx voices-v1.0.bin; do
  [ -f "$DIR/$f" ] || curl -fL --retry 3 -o "$DIR/$f" "$BASE/$f"
done
echo "Modelos em $DIR"
