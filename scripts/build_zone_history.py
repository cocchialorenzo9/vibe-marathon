#!/usr/bin/env python3
"""
Build data/zone-history.json: a day-by-day record of time spent in each
Seiler training zone (Zone 1 below LT1, Zone 2 between LT1-LT2, Zone 3 above
LT2), computed from data/training-journal.json's per-session hr_curve.

This is an analysis-only classification of *actual recorded* effort, separate
from this project's existing %LT-of-LT2 prescription bands (Recovery/
Easy-Aerobic/Threshold, still used unchanged in training-plan.json and
update-coach.md) — see CONTEXT.md and docs/adr/0002-zone-history-analysis-only.md.

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
# changes). LT1: aerobic threshold, no direct test yet — provisional ~75% of
# LT2, a field-test heuristic from training-science literature, not a
# measurement. Both overridable via env for a future field-test update.
DEFAULT_LT2 = int(os.environ.get("ATHLETE_LT2", 167))
DEFAULT_LT1 = int(os.environ.get("ATHLETE_LT1", round(DEFAULT_LT2 * 0.75)))

# Matches decode_sport_type's running type_names in parse_zepp_export.py.
_RUNNING_TYPES = {"outdoor_running", "treadmill"}


def classify_curve_zones(hr_curve, lt1, lt2):
    """
    Bucket an hr_curve's samples into Zone 1 (<lt1), Zone 2 (lt1-lt2), Zone 3
    (>=lt2), plus the average %LT (of LT2) across the curve. Each hr_curve
    sample is treated as ~1 minute, matching compute_hr_curve's own "coarse
    per-minute" approximation in parse_zepp_export.py.

    Returns None for an empty/missing curve.
    """
    if not hr_curve:
        return None

    zone1_min = zone2_min = zone3_min = 0
    total_hr = 0
    for sample in hr_curve:
        hr = sample["hr"]
        total_hr += hr
        if hr < lt1:
            zone1_min += 1
        elif hr < lt2:
            zone2_min += 1
        else:
            zone3_min += 1

    avg_hr = total_hr / len(hr_curve)
    zone_minutes = {1: zone1_min, 2: zone2_min, 3: zone3_min}
    # Ties broken toward the lower zone number (the more conservative read of
    # "what kind of run was this").
    dominant_zone = max(zone_minutes, key=lambda z: (zone_minutes[z], -z))
    return {
        "zone1_min": zone1_min,
        "zone2_min": zone2_min,
        "zone3_min": zone3_min,
        "avg_pct_lt": round(avg_hr / lt2 * 100),
        "dominant_zone": dominant_zone,
    }


def build_zone_history(journal_path, lt1=DEFAULT_LT1, lt2=DEFAULT_LT2):
    """
    Return a list of {date, zone1_min, zone2_min, zone3_min, avg_pct_lt,
    dominant_zone, avg_pace_min_km} dicts, one per training-journal.json
    entry that is a running session with a non-empty hr_curve, sorted
    ascending by date.

    avg_pace_min_km is the whole-session average pace already computed by
    parse_zepp_export.py — there's no per-sample GPS distance in hr_curve
    (or in the underlying Zepp export) to split pace by zone *within* a
    single run, so dominant_zone (the zone with the most minutes) is the
    finest grain available for a pace-vs-zone comparison.
    """
    if not os.path.exists(journal_path):
        return []

    with open(journal_path) as f:
        journal = json.load(f)

    history = []
    for entry in journal:
        if entry.get("type") not in _RUNNING_TYPES:
            continue
        zones = classify_curve_zones(entry.get("hr_curve") or [], lt1, lt2)
        if zones is None:
            continue
        history.append({
            "date": entry["date"],
            **zones,
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
