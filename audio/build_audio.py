"""Gera todo o áudio do vídeo a partir de src/config/timeline.json.

    python3 audio/build_audio.py          # locução + sfx + trilha + mix
    python3 audio/build_audio.py --no-tts # reaproveita a locução já gerada (ou gravada)
"""
import sys

import mix
import music
import sfx
import tts

if __name__ == "__main__":
    if "--no-tts" not in sys.argv:
        tts.main()
    sfx.build()
    music.main()
    mix.main()
