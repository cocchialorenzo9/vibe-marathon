#!/usr/bin/env python3
"""
Push the upcoming days of the training plan to Intervals.icu as planned
workouts. Intervals.icu then syncs the next 7 days to the Zepp app, which puts
them on the Amazfit T-Rex 3.

Each plan day's `training.workout` is Intervals.icu workout text (steps, then
coaching notes) and the plan's only description of the session. Every day
whose workout has steps becomes one WORKOUT event, sent as written, keyed by external_id "vibe-marathon:<date>" so re-running
updates the same event instead of duplicating it. Events this script created
earlier for a day that no longer has a workout are deleted. Events you add
yourself in Intervals.icu are never touched.

Workouts give every HR target as % LTHR ("60-85% LTHR"), the only HR form
Intervals.icu parses, and pace targets as "4:09/km Pace" (see
docs/adr/0007-intervals-icu-workout-sync.md). The Run sport's LTHR in
Intervals.icu is set to data/athlete.json's value when they differ, so % LTHR
means the same bpm on the watch as in the plan.

Auth: inside a cloud session the agent proxy adds the API key for
intervals.icu. Elsewhere set INTERVALS_API_KEY (Settings -> Developer
Settings on intervals.icu); it is sent as Basic auth with user "API_KEY".

Usage:
  python3 scripts/push_intervals.py [--days N] [--today YYYY-MM-DD] [--plan PATH] [--dry-run]
"""

import argparse
import base64
import json
import os
import sys
import urllib.request
from datetime import date, timedelta

_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, _SCRIPT_DIR)
from athlete import INTERVALS_ATHLETE_ID, LTHR

DEFAULT_PLAN_PATH = os.path.join(_SCRIPT_DIR, "..", "data", "training-plan-rome-2027.json")
API_BASE = "https://intervals.icu/api/v1"
EXTERNAL_ID_PREFIX = "vibe-marathon:"


# --- Pure functions (fully unit-testable) ---

def external_id(date_str):
    return EXTERNAL_ID_PREFIX + date_str


def plan_days(plan, start, end):
    """Plan days with start <= date < end (ISO date strings), in date order."""
    days = [d for w in plan["weeks"] for d in w["days"] if start <= d["date"] < end]
    return sorted(days, key=lambda d: d["date"])


def has_steps(workout):
    return any(line.startswith("- ") for line in workout.splitlines())


def build_event(day):
    """The Intervals.icu event for one plan day, or None when its workout has no steps (rest, swim, race)."""
    training = day["training"]
    workout = training["workout"]
    if not has_steps(workout):
        return None
    return {
        "category": "WORKOUT",
        "type": "Run",
        "name": training["title"],
        "start_date_local": f"{day['date']}T00:00:00",
        "external_id": external_id(day["date"]),
        "description": workout,
    }


def stale_external_ids(existing_events, wanted_ids):
    """external_ids this script created earlier that the plan no longer wants."""
    return sorted(
        e["external_id"]
        for e in existing_events
        if (e.get("external_id") or "").startswith(EXTERNAL_ID_PREFIX)
        and e["external_id"] not in wanted_ids
    )


# --- HTTP ---

def _request(method, path, body=None):
    req = urllib.request.Request(API_BASE + path, method=method)
    req.add_header("User-Agent", "vibe-marathon")  # Cloudflare rejects urllib's default agent
    key = os.environ.get("INTERVALS_API_KEY")
    if key:
        token = base64.b64encode(f"API_KEY:{key}".encode()).decode()
        req.add_header("Authorization", f"Basic {token}")
    data = None
    if body is not None:
        data = json.dumps(body).encode()
        req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, data=data, timeout=30) as resp:
        raw = resp.read()
    return json.loads(raw) if raw else None


def sync_run_lthr(athlete_id, lthr, dry_run):
    settings = _request("GET", f"/athlete/{athlete_id}/sport-settings/Run")
    current = settings.get("lthr")
    if current == lthr:
        return None
    if not dry_run:
        _request("PUT", f"/athlete/{athlete_id}/sport-settings/Run", {"lthr": lthr})
    return {"from": current, "to": lthr}


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--days", type=int, default=14, help="days ahead to push, today included (default 14)")
    parser.add_argument("--today", default=date.today().isoformat())
    parser.add_argument("--plan", default=DEFAULT_PLAN_PATH)
    parser.add_argument("--dry-run", action="store_true", help="print what would change, write nothing")
    args = parser.parse_args()

    athlete_id = os.environ.get("INTERVALS_ATHLETE_ID", INTERVALS_ATHLETE_ID)
    if not athlete_id:
        sys.exit("No Intervals.icu athlete id: set intervalsIcu.athleteId in data/athlete.json")

    with open(args.plan) as f:
        plan = json.load(f)
    start = args.today
    end = (date.fromisoformat(start) + timedelta(days=args.days)).isoformat()

    events = [e for e in (build_event(d) for d in plan_days(plan, start, end)) if e]
    last = (date.fromisoformat(end) - timedelta(days=1)).isoformat()  # API's newest is inclusive
    existing = _request("GET", f"/athlete/{athlete_id}/events?oldest={start}&newest={last}")
    stale = stale_external_ids(existing, {e["external_id"] for e in events})
    lthr_change = sync_run_lthr(athlete_id, LTHR, args.dry_run)

    if not args.dry_run:
        if events:
            _request("POST", f"/athlete/{athlete_id}/events/bulk?upsert=true", events)
        if stale:
            _request("PUT", f"/athlete/{athlete_id}/events/bulk-delete", [{"external_id": x} for x in stale])

    print(json.dumps({
        "dryRun": args.dry_run,
        "window": [start, end],
        "upserted": [{"date": e["start_date_local"][:10], "name": e["name"]} for e in events],
        "deleted": stale,
        "runLthr": lthr_change,
        "events": events if args.dry_run else None,
    }, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
