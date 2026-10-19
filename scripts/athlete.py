"""
The athlete's physiological anchors, read from data/athlete.json — the single
source of truth for lactate-threshold HR (LTHR) and the HR band cutoffs.

When the watch or a field test produces a new LT, edit data/athlete.json only;
every script, the web app and the coaching commands read it from there. The
ATHLETE_LTHR env var still overrides it for one-off runs.
"""

import json
import os
import re

_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ATHLETE_PATH = os.path.join(_SCRIPT_DIR, "..", "data", "athlete.json")


def load_athlete(path=ATHLETE_PATH):
    with open(path) as f:
        return json.load(f)


_ATHLETE = load_athlete()

LTHR = int(os.environ.get("ATHLETE_LTHR", _ATHLETE["lthr"]["bpm"]))
HR_BAND_CUTOFFS = tuple(_ATHLETE["hrBandCutoffs"])
INTERVALS_ATHLETE_ID = _ATHLETE.get("intervalsIcu", {}).get("athleteId")

_LT_TOKEN = re.compile(r"\{LT:(\d+(?:\.\d+)?)%\}")


def resolve_lt(text, lthr=None):
    """Plan text's "{LT:95%}" tokens -> rounded bpm (mirrors web/src/lib/athlete.ts)."""
    lt = LTHR if lthr is None else lthr
    return _LT_TOKEN.sub(lambda m: str(round_half_up(lt * float(m[1]) / 100)), text)


def round_half_up(x):
    """Math.round semantics, so Python and the web app agree on .5 cases."""
    return int(x + 0.5) if x >= 0 else -int(-x + 0.5)
