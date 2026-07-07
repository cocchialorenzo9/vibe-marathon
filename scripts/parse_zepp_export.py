#!/usr/bin/env python3
"""
Parse Zepp Health data export directories into canonical biometric fields.

Called by fetch_amazfit.py when data/zepp/ contains an export.
Export layout: data/zepp/{userId}_{timestamp}/ with subdirectories per data type.
"""

import csv
import glob
import json
import os
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

# HEARTRATE_AUTO/HEARTRATE csv timestamps are local wall-clock time (unlike
# SLEEP/SPORT, which carry an explicit UTC offset) — must be localized before
# comparing against UTC windows.
ATHLETE_TZ = ZoneInfo(os.environ.get("ATHLETE_TZ", "Europe/Berlin"))

# Sport type codes observed on Amazfit Trex 3 and from Amazfit documentation
SPORT_TYPES = {
    1: "outdoor_running",
    2: "treadmill",
    3: "outdoor_cycling",
    6: "outdoor_cycling",
    7: "indoor_cycling",
    8: "walking",
    9: "outdoor_cycling",   # confirmed: Trex 3 cycling at ~18 km/h
    13: "outdoor_walking",
    15: "outdoor_walking",  # confirmed: Trex 3 slow outdoor session
    16: "strength_training",
    20: "swimming",
    26: "hiking",
}

_RUNNING_TYPES = {1, 2}
_CYCLING_TYPES = {3, 6, 7, 9}
_WALKING_TYPES = {8, 13, 15}

DEFAULT_MAX_HR = 190


# --- Directory / file helpers ---

def find_latest_export(zepp_dir):
    """Return path to the export subdir with the highest timestamp suffix, or None."""
    if not os.path.isdir(zepp_dir):
        return None
    candidates = []
    for entry in os.listdir(zepp_dir):
        full = os.path.join(zepp_dir, entry)
        if not os.path.isdir(full):
            continue
        parts = entry.rsplit("_", 1)
        if len(parts) == 2 and parts[1].isdigit():
            candidates.append((int(parts[1]), full))
    return max(candidates)[1] if candidates else None


def _find_csv(export_dir, subdir):
    """Glob for the single CSV file inside a named subdirectory."""
    files = glob.glob(os.path.join(export_dir, subdir, "*.csv"))
    return files[0] if files else None


def _read_csv(path):
    """Read a CSV with BOM-safe UTF-8; returns list of dicts."""
    if not path or not os.path.exists(path):
        return []
    with open(path, newline="", encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def validate_export(export_dir):
    """Return list of warning strings for missing CSV files."""
    warnings = []
    for subdir in ("SLEEP", "HEARTRATE_AUTO", "SPORT", "ACTIVITY"):
        if not _find_csv(export_dir, subdir):
            warnings.append(f"Missing {subdir} CSV in export")
    return warnings


# --- Timestamp parsing ---

def _parse_utc(ts_str):
    """Parse '2026-06-29 06:28:00+0000' to an aware UTC datetime, or None."""
    if not ts_str or not ts_str.strip():
        return None
    s = ts_str.strip().replace("+0000", "+00:00")
    try:
        return datetime.fromisoformat(s)
    except ValueError:
        return None


# --- Sleep ---

def read_sleep(export_dir, date_str):
    """
    Return sleep data for date_str (YYYY-MM-DD), or None if unavailable / zero-row.
    dict: deep_min, shallow_min, rem_min, wake_min, total_min, start_utc, stop_utc
    """
    rows = _read_csv(_find_csv(export_dir, "SLEEP"))
    for row in rows:
        if row.get("date") != date_str:
            continue
        deep = int(row.get("deepSleepTime", 0) or 0)
        shallow = int(row.get("shallowSleepTime", 0) or 0)
        rem = int(row.get("REMTime", 0) or 0)
        wake = int(row.get("wakeTime", 0) or 0)
        total = deep + shallow + rem
        if total == 0:
            return None  # zero-row: watch not worn or sync issue
        return {
            "deep_min": deep,
            "shallow_min": shallow,
            "rem_min": rem,
            "wake_min": wake,
            "total_min": total,
            "start_utc": _parse_utc(row.get("start", "")),
            "stop_utc": _parse_utc(row.get("stop", "")),
        }
    return None


def read_all_dates(export_dir):
    """Return sorted list of all dates that appear in SLEEP or ACTIVITY CSVs."""
    dates = set()
    for subdir in ("SLEEP", "ACTIVITY"):
        for row in _read_csv(_find_csv(export_dir, subdir)):
            d = row.get("date", "")
            if d:
                dates.add(d)
    return sorted(dates)


def get_export_newest_date(export_dir):
    """Return the newest date in the SLEEP CSV, or None."""
    rows = _read_csv(_find_csv(export_dir, "SLEEP"))
    dates = [r["date"] for r in rows if r.get("date")]
    return max(dates) if dates else None


def compute_sleep_score_proxy(deep_min, shallow_min, rem_min, wake_min):
    """
    0-100 sleep quality proxy from composition.
    Weights: deep ratio (35 pts), REM ratio (30 pts), efficiency (35 pts).
    Returns None if total sleep is zero.
    """
    total = deep_min + shallow_min + rem_min
    if total == 0:
        return None
    time_in_bed = total + wake_min
    efficiency = max(0.0, (total - wake_min) / time_in_bed) if time_in_bed > 0 else 0.0
    score = (
        min(deep_min / total / 0.20, 1.0) * 35
        + min(rem_min / total / 0.25, 1.0) * 30
        + min(efficiency, 1.0) * 35
    )
    return max(0, min(100, round(score)))


# --- Heart rate ---

def _load_hr_rows(export_dir):
    """Load all HEARTRATE_AUTO rows."""
    return _read_csv(_find_csv(export_dir, "HEARTRATE_AUTO"))


def _hr_in_window(hr_rows, start_utc, end_utc):
    """Filter HEARTRATE_AUTO rows to a UTC window. Returns list of int bpm."""
    result = []
    for row in hr_rows:
        try:
            local_dt = datetime.strptime(
                f"{row['date']} {row['time']}", "%Y-%m-%d %H:%M"
            ).replace(tzinfo=ATHLETE_TZ)
            dt = local_dt.astimezone(timezone.utc)
            if start_utc <= dt <= end_utc:
                bpm = int(row["heartRate"])
                if bpm > 0:
                    result.append(bpm)
        except (ValueError, KeyError):
            continue
    return result


def read_resting_hr(export_dir, date_str, sleep_start_utc, sleep_stop_utc, hr_rows=None):
    """
    Estimate resting HR from HEARTRATE_AUTO during the sleep window.
    Falls back to 22:00 prev-day → 08:00 this-day if sleep times unavailable.
    Returns (resting_hr_int, n_samples) or (None, 0).
    """
    if hr_rows is None:
        hr_rows = _load_hr_rows(export_dir)

    if sleep_start_utc and sleep_stop_utc:
        values = _hr_in_window(hr_rows, sleep_start_utc, sleep_stop_utc)
    else:
        base = datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        values = _hr_in_window(hr_rows, base - timedelta(hours=2), base + timedelta(hours=8))

    # Filter artifacts: < 35 is sensor error; > 120 during sleep is movement artefact
    values = [v for v in values if 35 < v < 120]
    if not values:
        return None, 0
    return min(values), len(values)


# --- Sport sessions ---

def decode_sport_type(type_code):
    """Map Zepp sport type int to human-readable string."""
    return SPORT_TYPES.get(int(type_code), f"sport_type_{type_code}")


def compute_activity_hr(sport_start_utc, sport_duration_s, hr_rows):
    """
    Compute (avg_hr, max_hr) from HEARTRATE_AUTO during a sport session.
    Returns (None, None) if fewer than 3 samples found.
    """
    end_utc = sport_start_utc + timedelta(seconds=sport_duration_s)
    values = _hr_in_window(hr_rows, sport_start_utc, end_utc)
    if len(values) < 3:
        return None, None
    return round(sum(values) / len(values)), max(values)


def _compute_tss(duration_min, avg_hr, max_hr):
    """TSS ≈ (duration_h) × (avg_hr / max_hr)² × 100."""
    if avg_hr and max_hr and avg_hr > 0 and max_hr > 0:
        return round((duration_min / 60) * (avg_hr / max_hr) ** 2 * 100, 1)
    return None


def _fallback_tss(type_code, distance_m, duration_min):
    """Rough TSS when HR is unavailable, by activity type."""
    km = distance_m / 1000
    if type_code in _RUNNING_TYPES:
        return round(km * 5, 1)
    if type_code in _CYCLING_TYPES:
        return round(km * 2, 1)
    if type_code in _WALKING_TYPES:
        return round(km * 1, 1)
    return round(duration_min / 60 * 30, 1)


def read_sport_sessions(export_dir, date_str, hr_rows=None, max_hr=DEFAULT_MAX_HR):
    """
    Return list of sport session dicts for sessions starting on date_str.
    Each dict: type, type_name, distance_km, duration_min, avg_hr, max_hr,
               calories, tss, avg_pace_min_km
    """
    if hr_rows is None:
        hr_rows = _load_hr_rows(export_dir)

    sessions = []
    for row in _read_csv(_find_csv(export_dir, "SPORT")):
        start_str = row.get("startTime", "")
        if not start_str.startswith(date_str):
            continue
        start_utc = _parse_utc(start_str)
        if not start_utc:
            continue

        duration_s = float(row.get("sportTime(s)", 0) or 0)
        duration_min = round(duration_s / 60, 1)
        distance_m = float(row.get("distance(m)", 0) or 0)
        avg_pace_s_m = float(row.get("avgPace(/meter)", 0) or 0)
        type_code = int(float(row.get("type", 0) or 0))
        calories = round(float(row.get("calories(kcal)", 0) or 0))

        avg_hr, sess_max_hr = compute_activity_hr(start_utc, duration_s, hr_rows)
        tss = _compute_tss(duration_min, avg_hr, max_hr) or _fallback_tss(type_code, distance_m, duration_min)

        sessions.append({
            "type": type_code,
            "type_name": decode_sport_type(type_code),
            "distance_km": round(distance_m / 1000, 2),
            "duration_min": duration_min,
            "avg_hr": avg_hr,
            "max_hr": sess_max_hr,
            "calories": calories,
            "tss": tss,
            "avg_pace_min_km": round(avg_pace_s_m * 1000 / 60, 2) if avg_pace_s_m > 0 else None,
        })
    return sessions


def read_activity_fallback(export_dir, date_str):
    """Return ACTIVITY daily totals for date_str, or None."""
    for row in _read_csv(_find_csv(export_dir, "ACTIVITY")):
        if row.get("date") != date_str:
            continue
        steps = int(row.get("steps", 0) or 0)
        if steps == 0:
            return None
        return {
            "steps": steps,
            "run_distance_km": round(float(row.get("runDistance", 0) or 0) / 1000, 2),
            "total_distance_km": round(float(row.get("distance", 0) or 0) / 1000, 2),
            "calories": round(float(row.get("calories", 0) or 0)),
        }
    return None


def _pick_primary_session(sessions):
    """Pick most training-relevant session: running > cycling > other."""
    for type_set in (_RUNNING_TYPES, _CYCLING_TYPES):
        for s in sessions:
            if s["type"] in type_set:
                return s
    return sessions[0] if sessions else None


# --- History duplicate check ---

def check_history_duplicate(history_path, date_str):
    """Return True if date_str already has an entry in history.json."""
    if not os.path.exists(history_path):
        return False
    try:
        with open(history_path) as f:
            history = json.load(f)
        return any(e.get("date") == date_str for e in history)
    except (json.JSONDecodeError, IOError):
        return False


# --- History backfill ---

def synthesize_history_entry(export_dir, date_str, hr_rows, max_hr=DEFAULT_MAX_HR):
    """
    Build a history.json-compatible dict for date_str from export data.
    Returns None if the date has no meaningful data at all.
    """
    sleep = read_sleep(export_dir, date_str)
    sleep_hours = sleep_score = resting_hr = None
    if sleep:
        sleep_hours = round(sleep["total_min"] / 60, 1)
        sleep_score = compute_sleep_score_proxy(
            sleep["deep_min"], sleep["shallow_min"], sleep["rem_min"], sleep["wake_min"]
        )
        resting_hr, _ = read_resting_hr(
            export_dir, date_str, sleep["start_utc"], sleep["stop_utc"], hr_rows
        )

    sessions = read_sport_sessions(export_dir, date_str, hr_rows, max_hr)
    activity = read_activity_fallback(export_dir, date_str)

    total_tss = sum(s["tss"] for s in sessions)
    sport_distance_km = sum(s["distance_km"] for s in sessions)
    primary = _pick_primary_session(sessions)
    avg_hr = primary["avg_hr"] if primary else None

    # Add TSS for auto-detected running only when no SPORT session exists at all —
    # if a session was already recorded (even with distance=0, e.g. a GPS dropout),
    # its own duration/HR-based TSS already covers that day's effort and stacking
    # this bonus on top double-counts the same activity. Distance is still taken
    # from the activity summary when it's the larger figure, since a GPS dropout
    # loses distance tracking without meaning less ground was covered.
    act_run_km = activity["run_distance_km"] if activity else 0
    if act_run_km > sport_distance_km + 0.5:
        extra_km = act_run_km - sport_distance_km
        if not sessions:
            total_tss += extra_km * 4  # rough proxy for untracked easy running
        sport_distance_km = act_run_km

    if sleep is None and not sessions and not activity:
        return None

    return {
        "date": date_str,
        "tss": round(total_tss, 1),
        "distance_km": round(sport_distance_km, 2),
        "avg_hr": avg_hr,
        "hrv": None,  # not in Zepp export; filled on future /update-coach runs
        "resting_hr": resting_hr,
        "sleep_hours": sleep_hours,
        "sleep_score": sleep_score,
    }


def backfill_history(export_dir, history_path, max_hr=DEFAULT_MAX_HR):
    """
    Append history entries for any export dates missing from history.json.
    Returns list of newly added date strings.
    """
    latest = find_latest_export(export_dir)
    if not latest:
        return []

    hr_rows = _load_hr_rows(latest)

    history = []
    if os.path.exists(history_path):
        try:
            with open(history_path) as f:
                history = json.load(f)
        except (json.JSONDecodeError, IOError):
            history = []

    existing = {e["date"] for e in history}
    added = []

    for date_str in read_all_dates(latest):
        if date_str in existing:
            continue
        entry = synthesize_history_entry(latest, date_str, hr_rows, max_hr)
        if entry:
            history.append(entry)
            added.append(date_str)

    if added:
        history.sort(key=lambda e: e["date"])
        os.makedirs(os.path.dirname(os.path.abspath(history_path)), exist_ok=True)
        with open(history_path, "w") as f:
            json.dump(history, f, indent=2)

    return added


# --- Main entry point: today's biometric fields ---

def parse_export(zepp_dir, target_date, history_path):
    """
    Parse the latest export for target_date.
    Returns {fields, warnings, missing, no_export}.
    """
    latest = find_latest_export(zepp_dir)
    if not latest:
        return {"fields": {}, "warnings": [], "missing": [], "no_export": True}

    warnings = validate_export(latest)
    hr_rows = _load_hr_rows(latest)
    max_hr = int(os.environ.get("ATHLETE_MAX_HR", DEFAULT_MAX_HR))

    # Staleness
    newest = get_export_newest_date(latest)
    if newest and newest < target_date:
        warnings.append(
            f"Export may be stale (newest: {newest}). "
            f"Sync watch → Zepp app → re-export for today's data."
        )

    # Duplicate
    if check_history_duplicate(history_path, target_date):
        warnings.append(
            f"Today ({target_date}) already in history — will be updated."
        )

    fields = {}
    missing = ["hrv"]  # never in export

    # Sleep for today
    sleep = read_sleep(latest, target_date)
    if sleep:
        fields["sleep_hours"] = round(sleep["total_min"] / 60, 1)
        fields["deep_seconds"] = sleep["deep_min"] * 60
        fields["rem_seconds"] = sleep["rem_min"] * 60
        score = compute_sleep_score_proxy(
            sleep["deep_min"], sleep["shallow_min"], sleep["rem_min"], sleep["wake_min"]
        )
        if score is not None:
            fields["sleep_score"] = score
        resting_hr, n_hr = read_resting_hr(
            latest, target_date, sleep["start_utc"], sleep["stop_utc"], hr_rows
        )
        if resting_hr:
            fields["resting_hr"] = resting_hr
            if n_hr < 5:
                warnings.append(
                    f"Only {n_hr} overnight HR samples — resting HR estimate may be imprecise."
                )
        else:
            missing.append("resting_hr")
    else:
        warnings.append(
            f"No sleep data for {target_date} (watch may not have been worn last night)."
        )
        missing += ["sleep_hours", "sleep_score", "resting_hr"]

    # Yesterday's workout
    yesterday = (
        datetime.strptime(target_date, "%Y-%m-%d") - timedelta(days=1)
    ).strftime("%Y-%m-%d")

    sessions = read_sport_sessions(latest, yesterday, hr_rows, max_hr)
    activity = read_activity_fallback(latest, yesterday)

    if sessions:
        primary = _pick_primary_session(sessions)
        fields["yesterday_activity"] = {
            "type": primary["type_name"],
            "distance_km": primary["distance_km"],
            "duration_min": primary["duration_min"],
            "avg_hr": primary["avg_hr"],
            "max_hr": primary["max_hr"],
            "calories": primary["calories"],
            "avg_pace_min_km": primary["avg_pace_min_km"],
        }
        if len(sessions) > 1:
            warnings.append(
                f"{len(sessions)} sport sessions on {yesterday}; "
                f"using {primary['type_name']} as primary."
            )
    elif activity and activity["run_distance_km"] > 2.0:
        warnings.append(
            f"No sport session for {yesterday}; using daily activity summary "
            f"({activity['run_distance_km']} km running detected, likely auto-tracked)."
        )
        fields["yesterday_activity"] = {
            "type": "outdoor_running",
            "distance_km": activity["run_distance_km"],
            "duration_min": None,
            "avg_hr": None,
            "max_hr": None,
            "calories": activity["calories"],
            "avg_pace_min_km": None,
        }

    return {"fields": fields, "warnings": warnings, "missing": missing, "no_export": False}
