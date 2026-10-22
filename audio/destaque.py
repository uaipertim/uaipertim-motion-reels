"""Áudio de um story de destaque (Dúvidas, Lojista, Explica, Sô!), igual ao do Story "Conheça":
a MESMA trilha (audio/music.py: 124 bpm, Dó maior, ukulele + marimba + glock + baixo) montada em frases de 6 s,
os efeitos (audio/sfx.py) nos beats da timeline e o mix em -14 LUFS com limitador de pico real (audio/mix.py),
cortado em card1..cardN.wav. Sem narração.

    python3 audio/destaque.py duvidas   -> public/audio/destaques/duvidas/mix.wav + card1.wav … card4.wav

A timeline (fonte única de tempos para vídeo e áudio) é src/story/destaques/config/<nome>.json.
"""
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
nome = sys.argv[1]
os.environ["UAI_TIMELINE"] = str(ROOT / "src" / "story" / "destaques" / "config" / f"{nome}.json")
os.environ["UAI_BUILD"] = str(ROOT / "audio" / "build" / "destaques" / nome)
os.environ["UAI_MIX"] = str(ROOT / "public" / "audio" / "destaques" / nome / "mix.wav")
sys.path.insert(0, str(ROOT / "audio"))

import mix  # noqa: E402
import music  # noqa: E402
import sfx  # noqa: E402

if __name__ == "__main__":
    sfx.build()
    music.main()
    mix.main()
