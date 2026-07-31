#!/usr/bin/env python3
"""
Build data/zone-history.json: a day-by-day record of time spent in each HR
band, computed from data/training-journal.json's per-session hr_curve.

Bands are 5 fixed bpm cutoffs the athlete chose directly — <130, 130-140,
140-155, 155-167, 167+ — not the LT1/LT2-anchored Seiler Zone 1/2/3 model
this file used before (see docs/adr/0003-hr-bands-replace-seiler-zones.md
for why: LT1 was never measured, only a heuristic, and added a layer of
uncertainty the fixed bands sidestep). The top edge (167) is pinned to LT2
itself, since 167+ bpm is definitionally at/above threshold.

Running sessions only (outdoor_running/treadmill) — other activity types
(e.g. swim) either carry no hr_curve or aren't what the %LT bands were
derived from. A day with no qualifying running session is simply absent, not
a zero entry.

Full rebuild every run (not incremental) — training-journal.json is already
the durable source of truth, so recomputing from scratch is cheap and avoids
drift between the two files.

Usage:
  python3 scripts/build_zone_history.py [--journal PATH] [--out PATH]
"""

import argparse
import json
import os

_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_JOURNAL_PATH = os.path.join(_SCRIPT_DIR, "..", "data", "training-journal.json")
DEFAULT_OUT_PATH = os.path.join(_SCRIPT_DIR, "..", "data", "zone-history.json")

# LT2: anaerobic threshold / MLSS, device-reported (see the Lactate-threshold
# reference in .claude/commands/update-coach.md — keep in sync if that number
# changes). Overridable via env for a future field-test update.
DEFAULT_LT2 = int(os.environ.get("ATHLETE_LT2", 167))

# Fixed bpm cutoffs for bands 1-4's upper edge; band 5 is everything >= LT2.
# These are round numbers the athlete picked directly, not derived from LT1.
BAND_CUTOFFS = (130, 140, 155)

# Matches decode_sport_type's running type_names in parse_zepp_export.py.
_RUNNING_TYPES = {"outdoor_running", "treadmill"}


def classify_curve_bands(hr_curve, lt2, band_cutoffs=BAND_CUTOFFS):
    """
    Bucket an hr_curve's samples into 5 fixed-bpm bands: <cutoffs[0],
    cutoffs[0]-cutoffs[1], ..., cutoffs[-1]-lt2, >=lt2. Each hr_curve sample
    is treated as ~1 minute, matching compute_hr_curve's own "coarse
    per-minute" approximation in parse_zepp_export.py.

    Also returns avg_pct_lt (average %LT of lt2 across the curve) and
    dominant_band (the band with the most minutes, ties broken toward the
    lower band).

    Returns None for an empty/missing curve.
    """
    if not hr_curve:
        return None

    cutoffs = list(band_cutoffs) + [lt2]
    band_minutes = [0] * (len(cutoffs) + 1)
    total_hr = 0
    for sample in hr_curve:
        hr = sample["hr"]
        total_hr += hr
        idx = 0
        for cutoff in cutoffs:
            if hr >= cutoff:
                idx += 1
            else:
                break
        band_minutes[idx] += 1

    avg_hr = total_hr / len(hr_curve)
    dominant_band = max(
        range(1, len(band_minutes) + 1),
        key=lambda b: (band_minutes[b - 1], -b),
    )
    result = {f"band{i + 1}_min": m for i, m in enumerate(band_minutes)}
    result["avg_pct_lt"] = round(avg_hr / lt2 * 100)
    result["dominant_band"] = dominant_band
    return result


def build_zone_history(journal_path, lt2=DEFAULT_LT2):
    """
    Return a list of {date, band1_min..band5_min, avg_pct_lt, dominant_band,
    avg_pace_min_km} dicts, one per training-journal.json entry that is a
    running session with a non-empty hr_curve, sorted ascending by date.

    avg_pace_min_km is the whole-session average pace already computed by
    parse_zepp_export.py — there's no per-sample GPS distance in hr_curve
    (or in the underlying Zepp export) to split pace by band *within* a
    single run, so dominant_band (the band with the most minutes) is the
    finest grain available for a pace-vs-band comparison.
    """
    if not os.path.exists(journal_path):
        return []

    with open(journal_path) as f:
        journal = json.load(f)

    history = []
    for entry in journal:
        if entry.get("type") not in _RUNNING_TYPES:
            continue
        bands = classify_curve_bands(entry.get("hr_curve") or [], lt2)
        if bands is None:
            continue
        history.append({
            "date": entry["date"],
            **bands,
            "avg_pace_min_km": entry.get("avg_pace_min_km"),
        })

    history.sort(key=lambda e: e["date"])
    return history


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--journal", default=DEFAULT_JOURNAL_PATH,
                         help="Path to data/training-journal.json")
    parser.add_argument("--out", default=DEFAULT_OUT_PATH,
                         help="Path to write data/zone-history.json")
    args = parser.parse_args()

    history = build_zone_history(args.journal)
    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    with open(args.out, "w") as f:
        json.dump(history, f, indent=2)
        f.write("\n")

    print(f"Wrote {len(history)} entries to {args.out}")


if __name__ == "__main__":
    main()
