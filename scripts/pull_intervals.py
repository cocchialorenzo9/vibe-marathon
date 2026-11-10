#!/usr/bin/env python3
"""
Pull recorded activities from Intervals.icu for the sync-sessions task.

Intervals.icu receives every watch activity through Zepp, swims and strength
included, so it replaces the Strava MCP (which needs a paid subscription).
Prints one JSON object to stdout and writes nothing to disk:

  {"window": [from, to], "activities": [{intervalsId, date, start, sport,
   distanceKm, movingSec, avgHr, maxHr, laps: [{km, sec, hr}]}]}

`laps` are 1 km splits (a shorter last split is kept when >= 50 m), built from
the activity's time/distance/heartrate streams, for runs only. Activities with
no distance and no time (stubs) are skipped.

Auth: inside a cloud session the agent proxy adds the API key. Elsewhere set
INTERVALS_API_KEY; the athlete id comes from data/athlete.json.

Usage:
  python3 scripts/pull_intervals.py --from YYYY-MM-DD --to YYYY-MM-DD
"""

import argparse
import base64
import json
import os
import sys
import urllib.request

_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, _SCRIPT_DIR)
from athlete import INTERVALS_ATHLETE_ID

API_BASE = "https://intervals.icu/api/v1"
MIN_PARTIAL_M = 50


# --- Pure functions (fully unit-testable) ---

def km_laps(time_s, dist_m, hr):
    """1 km splits from per-sample streams, interpolating time at each exact km mark.

    `sec` is elapsed time inside the split, `hr` the mean of the samples in it.
    A shorter last split is kept when it is at least MIN_PARTIAL_M long.
    """
    laps = []
    if not dist_m:
        return laps
    d0 = dist_m[0]
    mark = d0 + 1000.0
    lap_start_t, lap_start_i, lap_start_d = time_s[0], 0, d0
    for i in range(1, len(dist_m)):
        while dist_m[i] >= mark:
            span = dist_m[i] - dist_m[i - 1]
            t = time_s[i] if span <= 0 else time_s[i - 1] + (mark - dist_m[i - 1]) / span * (time_s[i] - time_s[i - 1])
            laps.append(_lap(1.0, t - lap_start_t, hr[lap_start_i + 1 : i + 1]))
            lap_start_t, lap_start_i, lap_start_d = t, i, mark
            mark += 1000.0
    rest = dist_m[-1] - lap_start_d
    if rest >= MIN_PARTIAL_M:
        laps.append(_lap(round(rest / 1000, 3), time_s[-1] - lap_start_t, hr[lap_start_i + 1 :]))
    return laps


def _lap(km, sec, samples):
    samples = [h for h in samples if h]
    return {"km": km, "sec": round(sec), "hr": round(sum(samples) / len(samples)) if samples else 0}


def to_activity(raw, laps=None):
    """Session-ready record from an Intervals.icu activity, or None for an empty stub."""
    distance = raw.get("distance") or 0
    moving = raw.get("moving_time") or 0
    if not distance and not moving:
        return None
    return {
        "intervalsId": raw["id"],
        "date": raw["start_date_local"][:10],
        "start": raw["start_date_local"],
        "sport": raw.get("type"),
        "name": raw.get("name"),
        "distanceKm": round(distance / 1000, 2),
        "movingSec": int(moving),
        "avgHr": raw.get("average_heartrate"),
        "maxHr": raw.get("max_heartrate"),
        "laps": laps or [],
    }


# --- HTTP ---

def _get(path):
    req = urllib.request.Request(API_BASE + path)
    req.add_header("User-Agent", "vibe-marathon")  # Cloudflare rejects urllib's default agent
    key = os.environ.get("INTERVALS_API_KEY")
    if key:
        token = base64.b64encode(f"API_KEY:{key}".encode()).decode()
        req.add_header("Authorization", f"Basic {token}")
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())


def fetch_laps(activity_id):
    streams = {s["type"]: s["data"] for s in _get(f"/activity/{activity_id}/streams?types=time,distance,heartrate")}
    if not streams.get("distance") or not streams.get("time"):
        return []
    hr = streams.get("heartrate") or [0] * len(streams["distance"])
    return km_laps(streams["time"], streams["distance"], hr)


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--from", dest="start", required=True)
    parser.add_argument("--to", dest="end", required=True)
    args = parser.parse_args()

    athlete_id = os.environ.get("INTERVALS_ATHLETE_ID", INTERVALS_ATHLETE_ID) or "0"
    raws = _get(f"/athlete/{athlete_id}/activities?oldest={args.start}&newest={args.end}")
    out = []
    for raw in sorted(raws, key=lambda r: r["start_date_local"]):
        is_run = "Run" in (raw.get("type") or "")
        a = to_activity(raw, fetch_laps(raw["id"]) if is_run else None)
        if a:
            out.append(a)
    print(json.dumps({"window": [args.start, args.end], "activities": out}, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
