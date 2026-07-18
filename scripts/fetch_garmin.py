#!/usr/bin/env python3
"""
Fetch today's biometric data from Garmin Connect.

Required env vars:
  GARMIN_EMAIL      Garmin Connect account email
  GARMIN_PASSWORD   Garmin Connect account password

Optional env vars:
  COACH_HISTORY_PATH  Path to local history JSON file
                      (default: ~/.vibe-marathon/history.json)

Prints a JSON object to stdout.
"""

import json
import os
import sys
from datetime import date, timedelta

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

HISTORY_PATH = os.path.expanduser(
    os.environ.get("COACH_HISTORY_PATH", "~/.vibe-marathon/history.json")
)


def parse_hrv(hrv_data):
    if not hrv_data or "hrvSummary" not in hrv_data:
        return None
    s = hrv_data["hrvSummary"]
    low = s.get("baselineLowUpper")
    high = s.get("baselineBalancedLow")
    if low and high:
        baseline = round((low + high) / 2)
    else:
        baseline = low or high or None
    return {
        "value": s.get("lastNight"),
        "baseline": baseline,
        "status": s.get("status"),
    }


def parse_sleep(sleep_data):
    if not sleep_data or "dailySleepDTO" not in sleep_data:
        return None
    s = sleep_data["dailySleepDTO"]
    total_seconds = s.get("sleepTimeSeconds", 0)
    scores = s.get("sleepScores") or {}
    overall = scores.get("overall")
    score = overall.get("value") if isinstance(overall, dict) else overall
    return {
        "hours": round(total_seconds / 3600, 1),
        "score": score,
        "deep_seconds": s.get("deepSleepSeconds"),
        "rem_seconds": s.get("remSleepSeconds"),
    }


def parse_resting_hr(hr_data):
    if not hr_data:
        return None
    return hr_data.get("restingHeartRate")


def parse_vo2max(max_metrics_data):
    if not max_metrics_data:
        return None
    if isinstance(max_metrics_data, list):
        if not max_metrics_data:
            return None
        max_metrics_data = max_metrics_data[0]
    generic = max_metrics_data.get("generic") or {}
    value = generic.get("vo2MaxPreciseValue") or generic.get("vo2MaxValue")
    if value is None:
        return None
    return {"value": round(value, 1), "source": "garmin_max_metrics"}


def parse_training_readiness(tr_data):
    if not tr_data:
        return None
    if isinstance(tr_data, list):
        if not tr_data:
            return None
        tr = tr_data[0]
    else:
        tr = tr_data
    return {
        "score": tr.get("score"),
        "source": "garmin_training_readiness",
    }


def parse_body_battery(bb_data):
    if not bb_data or not isinstance(bb_data, list) or not bb_data[0]:
        return None
    values = [v[1] for v in bb_data[0].get("bodyBatteryValuesArray", []) if v[1] is not None]
    if not values:
        return None
    return {
        "current": values[-1],
        "high": max(values),
        "low": min(values),
    }


def parse_activity(activities):
    if not activities:
        return None
    run = next((a for a in activities if "running" in a.get("activityType", {}).get("typeKey", "").lower()), None)
    act = run or activities[0]
    speed = act.get("averageSpeed") or 0
    return {
        "type": act.get("activityType", {}).get("typeKey", "unknown"),
        "distance_km": round((act.get("distance") or 0) / 1000, 2),
        "duration_min": round((act.get("duration") or 0) / 60, 1),
        "avg_hr": act.get("averageHR"),
        "max_hr": act.get("maxHR"),
        "calories": act.get("calories"),
        "avg_pace_min_km": round(1000 / speed / 60, 2) if speed > 0 else None,
    }


def fetch_all(api, today, yesterday):
    result = {"date": today, "source": "garmin"}
    try:
        result["hrv"] = parse_hrv(api.get_hrv_data(today))
    except Exception as e:
        result["hrv"] = {"error": str(e)}
    try:
        result["sleep"] = parse_sleep(api.get_sleep_data(today))
    except Exception as e:
        result["sleep"] = {"error": str(e)}
    try:
        result["resting_hr"] = parse_resting_hr(api.get_heart_rates(today))
    except Exception as e:
        result["resting_hr"] = {"error": str(e)}
    try:
        result["readiness"] = parse_training_readiness(api.get_training_readiness(today))
    except Exception as e:
        result["readiness"] = {"error": str(e)}
    try:
        result["vo2max"] = parse_vo2max(api.get_max_metrics(today))
    except Exception as e:
        result["vo2max"] = {"error": str(e)}
    try:
        result["body_battery"] = parse_body_battery(api.get_body_battery(today))
    except Exception as e:
        result["body_battery"] = {"error": str(e)}
    try:
        result["yesterday_activity"] = parse_activity(api.get_activities_by_date(yesterday, yesterday))
    except Exception as e:
        result["yesterday_activity"] = {"error": str(e)}
    return result


def main():
    try:
        from garminconnect import Garmin
    except ImportError:
        print(json.dumps({"error": "garminconnect not installed. Run: pip3 install garminconnect"}))
        sys.exit(1)

    email = os.environ.get("GARMIN_EMAIL")
    password = os.environ.get("GARMIN_PASSWORD")
    if not email or not password:
        print(json.dumps({"error": "GARMIN_EMAIL and GARMIN_PASSWORD environment variables must be set"}))
        sys.exit(1)

    today = date.today().isoformat()
    yesterday = (date.today() - timedelta(days=1)).isoformat()

    try:
        api = Garmin(email, password)
        api.login()
    except Exception as e:
        print(json.dumps({"error": f"Garmin login failed: {str(e)}"}))
        sys.exit(1)

    result = fetch_all(api, today, yesterday)
    result["history_path"] = HISTORY_PATH
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
