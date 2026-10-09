"""Gera todo o áudio de um vídeo a partir da timeline dele.

    python3 audio/build_audio.py                 # Vídeo 1 (src/config/timeline.json)
    python3 audio/build_audio.py --video v2      # Vídeo 2 (src/v2/config/timeline.json)
    python3 audio/build_audio.py --no-tts        # reaproveita a locução já gerada (ou gravada)
"""
import os
import sys

if "--video" in sys.argv:
    os.environ["UAI_VIDEO"] = sys.argv[sys.argv.index("--video") + 1]

import mix  # noqa: E402
import music  # noqa: E402
import sfx  # noqa: E402
import tts  # noqa: E402

if __name__ == "__main__":
    if "--no-tts" not in sys.argv:
        tts.main()
    sfx.build()
    music.main()
    mix.main()
