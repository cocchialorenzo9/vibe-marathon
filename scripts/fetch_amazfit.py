#!/usr/bin/env python3
"""
Fetch today's biometric data from Amazfit Trex 3.

Prompts for values from the Zepp app (~2 min):
  Health tab → Sleep, HRV, Heart Rate cards
  Exercise tab → yesterday's workout

Optional env vars:
  COACH_HISTORY_PATH  Path to local history JSON (default: ~/.vibe-marathon/history.json)

Prints a canonical BiometricReading JSON object to stdout.
"""

import json
import os
import sys
from datetime import date

# data/zepp/ relative to the project root (one level above scripts/)
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ZEPP_DIR = os.path.join(_SCRIPT_DIR, "..", "data", "zepp")
ATHLETE_MAX_HR = int(os.environ.get("ATHLETE_MAX_HR", 190))

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

HISTORY_PATH = os.path.expanduser(
    os.environ.get("COACH_HISTORY_PATH", "~/.vibe-marathon/history.json")
)

# --- Pure computation functions (fully unit-testable) ---

def load_history(history_path):
    if not os.path.exists(history_path):
        return []
    try:
        with open(history_path) as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return []


def compute_hrv_baseline(history):
    """7-day trailing average of HRV from local history. None if < 3 entries."""
    recent = [e["hrv"] for e in history[-7:] if e.get("hrv") is not None]
    if len(recent) < 3:
        return None
    return round(sum(recent) / len(recent))


def compute_hr_baseline(history):
    """7-day trailing average of resting HR from local history. None if < 3 entries."""
    recent = [e["resting_hr"] for e in history[-7:] if e.get("resting_hr") is not None]
    if len(recent) < 3:
        return None
    return round(sum(recent) / len(recent))


def compute_readiness_score(hrv_value, hrv_baseline, sleep_score, sleep_hours, resting_hr, hr_baseline):
    """
    0-100 readiness score from available signals.
    Weights: HRV delta 40%, sleep 40%, resting HR 20%.
    Neutral baseline (50) when a signal is unavailable.
    """
    score = 50.0
    if hrv_value is not None and hrv_baseline is not None and hrv_baseline > 0:
        delta_pct = (hrv_value - hrv_baseline) / hrv_baseline * 100
        score += max(-20, min(20, delta_pct * 2))
    if sleep_score is not None:
        score += max(-20, min(20, (sleep_score - 70) / 70 * 20))
    elif sleep_hours is not None:
        proxy = max(0.0, min(100.0, (sleep_hours - 5) / 3 * 100))
        score += max(-20, min(20, (proxy - 70) / 70 * 20))
    if resting_hr is not None and hr_baseline is not None and hr_baseline > 0:
        delta_pct = (resting_hr - hr_baseline) / hr_baseline * 100
        score += max(-10, min(10, -delta_pct))
    return max(0, min(100, round(score)))


def hrv_status(hrv_value, hrv_baseline):
    if hrv_value is None or hrv_baseline is None or hrv_baseline == 0:
        return "unknown"
    delta_pct = (hrv_value - hrv_baseline) / hrv_baseline * 100
    if delta_pct >= -5:
        return "balanced"
    elif delta_pct >= -15:
        return "unbalanced"
    else:
        return "low"


def build_canonical(today, hrv_value, hrv_baseline, sleep_hours, sleep_score,
                    deep_seconds, rem_seconds, resting_hr, hr_baseline,
                    yesterday_activity):
    readiness_score = compute_readiness_score(
        hrv_value, hrv_baseline, sleep_score, sleep_hours, resting_hr, hr_baseline
    )
    return {
        "date": today,
        "source": "amazfit",
        "hrv": {
            "value": hrv_value,
            "baseline": hrv_baseline,
            "status": hrv_status(hrv_value, hrv_baseline),
        },
        "sleep": {
            "hours": sleep_hours,
            "score": sleep_score,
            "deep_seconds": deep_seconds,
            "rem_seconds": rem_seconds,
        },
        "resting_hr": resting_hr,
        "readiness": {
            "score": readiness_score,
            "source": "computed",
        },
        "body_battery": None,
        "yesterday_activity": yesterday_activity,
        "history_path": HISTORY_PATH,
    }


# --- Interactive entry ---

def _prompt_int(label):
    try:
        raw = input(f"  {label} (Enter to skip): ").strip()
    except EOFError:
        return None
    if not raw:
        return None
    try:
        return int(float(raw))
    except ValueError:
        return None


def _prompt_float(label):
    try:
        raw = input(f"  {label} (Enter to skip): ").strip()
    except EOFError:
        return None
    if not raw:
        return None
    try:
        return float(raw)
    except ValueError:
        return None


def interactive_entry(today, history):
    print("=== Amazfit Trex 3 — daily reading ===", file=sys.stderr)
    print("Open Zepp app → Health → today's data\n", file=sys.stderr)

    hrv_value = _prompt_int("Last night's HRV (ms)")
    sleep_hours = _prompt_float("Sleep duration (hours, e.g. 7.5)")
    sleep_score = _prompt_int("Sleep score (0-100)")
    deep_min = _prompt_int("Deep sleep (minutes)")
    rem_min = _prompt_int("REM sleep (minutes)")
    resting_hr = _prompt_int("Resting heart rate (bpm)")

    print("\nYesterday's training:", file=sys.stderr)
    try:
        activity_type = input("  Activity type (running/cycling/swim/other, Enter for rest): ").strip() or None
    except EOFError:
        activity_type = None

    yesterday_activity = None
    if activity_type:
        distance_km = _prompt_float("  Distance (km)")
        duration_min = _prompt_float("  Duration (minutes)")
        avg_hr = _prompt_int("  Avg HR (bpm)")
        max_hr = _prompt_int("  Max HR (bpm)")
        calories = _prompt_int("  Calories")
        if distance_km and duration_min and duration_min > 0:
            speed_ms = distance_km * 1000 / (duration_min * 60)
            avg_pace = round(1000 / speed_ms / 60, 2) if speed_ms > 0 else None
        else:
            avg_pace = None
        yesterday_activity = {
            "type": activity_type,
            "distance_km": distance_km,
            "duration_min": duration_min,
            "avg_hr": avg_hr,
            "max_hr": max_hr,
            "calories": calories,
            "avg_pace_min_km": avg_pace,
        }

    hrv_baseline = compute_hrv_baseline(history)
    hr_baseline = compute_hr_baseline(history)
    deep_sec = deep_min * 60 if deep_min is not None else None
    rem_sec = rem_min * 60 if rem_min is not None else None

    return build_canonical(
        today, hrv_value, hrv_baseline, sleep_hours, sleep_score,
        deep_sec, rem_sec, resting_hr, hr_baseline, yesterday_activity
    )


def main():
    today = date.today().isoformat()
    history = load_history(HISTORY_PATH)
    auto_fields = {}
    missing_fields = []

    # --- Try Zepp export ---
    if os.path.isdir(ZEPP_DIR):
        sys.path.insert(0, _SCRIPT_DIR)
        from parse_zepp_export import backfill_history, parse_export

        backfilled = backfill_history(ZEPP_DIR, HISTORY_PATH, ATHLETE_MAX_HR)
        if backfilled:
            print(
                f"[zepp] Backfilled {len(backfilled)} day(s): {', '.join(backfilled)}",
                file=sys.stderr,
            )
            history = load_history(HISTORY_PATH)

        parsed = parse_export(ZEPP_DIR, today, HISTORY_PATH)
        for w in parsed.get("warnings", []):
            print(f"[zepp] {w}", file=sys.stderr)

        auto_fields = parsed.get("fields", {})
        missing_fields = parsed.get("missing", [])

        if auto_fields:
            parts = []
            sh = auto_fields.get("sleep_hours")
            dm = (auto_fields.get("deep_seconds") or 0) // 60
            rm = (auto_fields.get("rem_seconds") or 0) // 60
            rhr = auto_fields.get("resting_hr")
            sc = auto_fields.get("sleep_score")
            if sh: parts.append(f"sleep {sh}h")
            if dm: parts.append(f"deep {dm}min")
            if rm: parts.append(f"REM {rm}min")
            if rhr: parts.append(f"resting HR {rhr}bpm")
            if sc: parts.append(f"sleep score ~{sc}")
            if auto_fields.get("yesterday_activity"):
                a = auto_fields["yesterday_activity"]
                parts.append(f"yesterday: {a['type']} {a['distance_km']}km")
            if parts:
                print(f"[zepp] Auto-filled: {', '.join(parts)}", file=sys.stderr)
        if missing_fields:
            print(f"[zepp] Still needed: {', '.join(missing_fields)}", file=sys.stderr)

    # --- Prompt for what's missing ---
    print("\n=== Amazfit Trex 3 — daily reading ===", file=sys.stderr)
    if "hrv" in missing_fields or not missing_fields:
        print("Open Zepp app → Health → HRV card\n", file=sys.stderr)

    hrv_value = _prompt_int("Last night's HRV (ms)")

    sleep_hours = auto_fields.get("sleep_hours")
    if sleep_hours is None:
        sleep_hours = _prompt_float("Sleep duration (hours, e.g. 7.5)")

    sleep_score = auto_fields.get("sleep_score")
    if sleep_score is None:
        sleep_score = _prompt_int("Sleep score (0-100)")

    deep_seconds = auto_fields.get("deep_seconds")
    if deep_seconds is None:
        deep_min = _prompt_int("Deep sleep (minutes)")
        deep_seconds = deep_min * 60 if deep_min is not None else None

    rem_seconds = auto_fields.get("rem_seconds")
    if rem_seconds is None:
        rem_min = _prompt_int("REM sleep (minutes)")
        rem_seconds = rem_min * 60 if rem_min is not None else None

    resting_hr = auto_fields.get("resting_hr")
    if resting_hr is None:
        resting_hr = _prompt_int("Resting heart rate (bpm)")

    yesterday_activity = auto_fields.get("yesterday_activity")
    if yesterday_activity is None:
        print("\nYesterday's training:", file=sys.stderr)
        try:
            activity_type = (
                input("  Activity type (running/cycling/swim/other, Enter for rest): ").strip()
                or None
            )
        except EOFError:
            activity_type = None

        if activity_type:
            distance_km = _prompt_float("  Distance (km)")
            duration_min = _prompt_float("  Duration (minutes)")
            avg_hr = _prompt_int("  Avg HR (bpm)")
            max_hr = _prompt_int("  Max HR (bpm)")
            calories = _prompt_int("  Calories")
            if distance_km and duration_min and duration_min > 0:
                speed_ms = distance_km * 1000 / (duration_min * 60)
                avg_pace = round(1000 / speed_ms / 60, 2) if speed_ms > 0 else None
            else:
                avg_pace = None
            yesterday_activity = {
                "type": activity_type,
                "distance_km": distance_km,
                "duration_min": duration_min,
                "avg_hr": avg_hr,
                "max_hr": max_hr,
                "calories": calories,
                "avg_pace_min_km": avg_pace,
            }

    hrv_baseline = compute_hrv_baseline(history)
    hr_baseline = compute_hr_baseline(history)
    result = build_canonical(
        today, hrv_value, hrv_baseline, sleep_hours, sleep_score,
        deep_seconds, rem_seconds, resting_hr, hr_baseline, yesterday_activity,
    )
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
