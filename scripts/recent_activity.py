#!/usr/bin/env python3
"""
List individual sport sessions (excluding commute cycling) from the last N
days across all Zepp export snapshots in data/zepp/, selecting per-date
whichever export is most complete.

Used by the /update-coach skill's Step 4c to build data/coach.json's
`recentActivity` field. Prints a single JSON object to stdout; nothing is
written to disk.

Usage:
  python3 scripts/recent_activity.py [--days N] [--zepp-dir PATH] [--today YYYY-MM-DD]
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


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--days", type=int, default=7,
                         help="Size of the trailing window, in days (default: 7)")
    parser.add_argument("--zepp-dir", default=DEFAULT_ZEPP_DIR,
                         help="Path to the Zepp export root (default: data/zepp)")
    parser.add_argument("--today", default=None,
                         help="Override today's date (YYYY-MM-DD), for testing")
    args = parser.parse_args()

    today_str = args.today or date.today().isoformat()
    since_str = (
        datetime.strptime(today_str, "%Y-%m-%d") - timedelta(days=args.days - 1)
    ).strftime("%Y-%m-%d")

    if not os.path.isdir(args.zepp_dir):
        print(json.dumps({
            "since": since_str, "today": today_str, "days": args.days,
            "sessions": [], "no_export": True,
        }, indent=2))
        return

    sessions = build_recent_sessions(args.zepp_dir, since_str, today_str, ATHLETE_MAX_HR)
    print(json.dumps({
        "since": since_str, "today": today_str, "days": args.days,
        "sessions": sessions, "no_export": False,
    }, indent=2))


if __name__ == "__main__":
    main()
