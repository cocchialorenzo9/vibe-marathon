#!/usr/bin/env python3
"""
List individual sport sessions (excluding commute cycling) from the last N
days across all Zepp export snapshots in data/zepp/, selecting per-date
whichever export is most complete.

Used by the /update-coach skill's Step 4c to build data/coach.json's
`recentActivity` field. Prints a single JSON object to stdout; nothing is
written to disk.

Usage:
  python3 scripts/recent_activity.py [--days N] [--since YYYY-MM-DD] [--zepp-dir PATH] [--today YYYY-MM-DD]

--since, when given, is an explicit start date and overrides --days.
"""

import argparse
import json
import os
import sys
from datetime import date, datetime, timedelta

_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# data/zepp/ relative to the project root (one level above scripts/), same
# resolution pattern as fetch_amazfit.py's ZEPP_DIR.
DEFAULT_ZEPP_DIR = os.path.join(_SCRIPT_DIR, "..", "data", "zepp")
ATHLETE_MAX_HR = int(os.environ.get("ATHLETE_MAX_HR", 190))

sys.path.insert(0, _SCRIPT_DIR)
from parse_zepp_export import build_recent_sessions


def resolve_range(today_str, days, since=None):
    """
    Return (since_str, days) for the query window. An explicit `since`
    overrides `days`; `days` is always recomputed from the actual span so
    the reported value is accurate either way.
    """
    since_str = since or (
        datetime.strptime(today_str, "%Y-%m-%d") - timedelta(days=days - 1)
    ).strftime("%Y-%m-%d")
    span = (datetime.strptime(today_str, "%Y-%m-%d") - datetime.strptime(since_str, "%Y-%m-%d")).days + 1
    return since_str, span


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--days", type=int, default=7,
                         help="Size of the trailing window, in days (default: 7). Ignored if --since is given.")
    parser.add_argument("--since", default=None,
                         help="Explicit start date (YYYY-MM-DD), overrides --days")
    parser.add_argument("--zepp-dir", default=DEFAULT_ZEPP_DIR,
                         help="Path to the Zepp export root (default: data/zepp)")
    parser.add_argument("--today", default=None,
                         help="Override today's date (YYYY-MM-DD), for testing")
    args = parser.parse_args()

    today_str = args.today or date.today().isoformat()
    since_str, days = resolve_range(today_str, args.days, args.since)

    if not os.path.isdir(args.zepp_dir):
        print(json.dumps({
            "since": since_str, "today": today_str, "days": days,
            "sessions": [], "no_export": True,
        }, indent=2))
        return

    sessions = build_recent_sessions(args.zepp_dir, since_str, today_str, ATHLETE_MAX_HR)
    print(json.dumps({
        "since": since_str, "today": today_str, "days": days,
        "sessions": sessions, "no_export": False,
    }, indent=2))


if __name__ == "__main__":
    main()
