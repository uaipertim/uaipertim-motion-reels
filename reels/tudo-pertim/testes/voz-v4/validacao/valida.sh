#!/usr/bin/env bash
# Validação da voz v4 no fluxo REAL do Tudo Pertim: voz.py → linha.py → cues → audio.py → render (um capítulo só).
# O capítulo de teste (episodio.json, "voz": "v4") entra por um momento como episódio temporário com nome próprio
# (episodios/teste-voz-v4-validacao.json, audio/…, output/…); no fim os resultados vêm para esta pasta e o temporário
# é apagado (nada fica nas pastas de produção). Nenhum episódio de verdade é tocado.
#   bash testes/voz-v4/validacao/valida.sh            (gera a voz na API só se ainda não houver narração salva aqui)
set -euo pipefail
AQUI="$(cd "$(dirname "$0")" && pwd)"
cd "$AQUI/../../.."                                   # reels/tudo-pertim
EP=teste-voz-v4-validacao
limpa() { rm -rf "episodios/$EP.json" "audio/$EP" "output/$EP"; }
trap limpa EXIT
limpa
cp "$AQUI/episodio.json" "episodios/$EP.json"
if [ -f "$AQUI/voz/falas.json" ]; then                # a narração aprovada fica salva: nunca regenerar só para re-renderizar
  mkdir -p "audio/$EP" && cp -r "$AQUI/voz" "audio/$EP/voz"
fi
python3 scripts/voz.py "$EP"
# um capítulo só não fecha 45–60 s: o mapa de tempos acusa a duração total (esperado neste teste); o resto tem de passar
python3 scripts/linha.py "$EP" | tee "$AQUI/linha.txt" || true
node scripts/render.cjs cues --ep "$EP"
python3 scripts/audio.py "$EP"
node scripts/render.cjs video --ep "$EP"
node scripts/render.cjs info --ep "$EP"
rm -rf "$AQUI/voz"; cp -r "audio/$EP/voz" "$AQUI/voz"
cp "audio/$EP/linha.json" "audio/$EP/voz.wav" "$AQUI/"
cp "output/$EP/uaipertim-$EP.mp4" "$AQUI/validacao-v4.mp4"
cp "output/$EP/revisao/motor.json" "$AQUI/motor.json"
python3 "$AQUI/confere.py"
