"""
Tests for parse_zepp_export.py pure functions.
Uses temporary directories with synthetic CSV fixtures — no real export needed.
Run with: python3 -m pytest scripts/ -v
"""

import csv
import json
import os
import sys
import tempfile
import unittest
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(__file__))
from parse_zepp_export import (
    backfill_history,
    check_history_duplicate,
    compute_activity_hr,
    compute_sleep_score_proxy,
    decode_sport_type,
    find_latest_export,
    get_export_newest_date,
    parse_export,
    read_activity_fallback,
    read_all_dates,
    read_resting_hr,
    read_sleep,
    read_sport_sessions,
    synthesize_history_entry,
    validate_export,
)


# --- Fixtures ---

def _write_csv(path, fieldnames, rows):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)


def _make_export(base_dir, name="7085574765_1000000000000"):
    """Create a minimal valid export directory structure."""
    export = os.path.join(base_dir, name)
    _write_csv(
        os.path.join(export, "SLEEP", "SLEEP.csv"),
        ["date", "deepSleepTime", "shallowSleepTime", "wakeTime", "start", "stop", "REMTime", "naps"],
        [
            {
                "date": "2026-06-29",
                "deepSleepTime": 91, "shallowSleepTime": 217, "wakeTime": 10,
                "start": "2026-06-29 00:00:00+0000",
                "stop": "2026-06-29 06:28:00+0000",
                "REMTime": 70, "naps": "",
            },
            # zero-row: watch not worn
            {
                "date": "2026-06-28",
                "deepSleepTime": 0, "shallowSleepTime": 0, "wakeTime": 0,
                "start": "2026-06-28 22:00:00+0000",
                "stop": "2026-06-28 22:00:00+0000",
                "REMTime": 0, "naps": "",
            },
        ],
    )
    _write_csv(
        os.path.join(export, "HEARTRATE_AUTO", "HR.csv"),
        ["date", "time", "heartRate"],
        [
            {"date": "2026-06-29", "time": "00:30", "heartRate": 55},
            {"date": "2026-06-29", "time": "01:00", "heartRate": 48},
            {"date": "2026-06-29", "time": "01:30", "heartRate": 51},
            {"date": "2026-06-29", "time": "02:00", "heartRate": 49},
            {"date": "2026-06-29", "time": "02:30", "heartRate": 52},
            {"date": "2026-06-29", "time": "03:00", "heartRate": 47},
            {"date": "2026-06-29", "time": "08:50", "heartRate": 120},  # sport session
            {"date": "2026-06-29", "time": "09:00", "heartRate": 135},
            {"date": "2026-06-29", "time": "09:10", "heartRate": 130},
            # yesterday's sport session HR
            {"date": "2026-06-28", "time": "08:50", "heartRate": 145},
            {"date": "2026-06-28", "time": "09:00", "heartRate": 150},
            {"date": "2026-06-28", "time": "09:10", "heartRate": 148},
        ],
    )
    _write_csv(
        os.path.join(export, "SPORT", "SPORT.csv"),
        ["type", "startTime", "sportTime(s)", "maxPace(/meter)", "minPace(/meter)",
         "distance(m)", "avgPace(/meter)", "calories(kcal)"],
        [
            {
                "type": 15, "startTime": "2026-06-28 08:49:50+0000",
                "sportTime(s)": 1416, "maxPace(/meter)": 1.021, "minPace(/meter)": 0.0,
                "distance(m)": 1099.0, "avgPace(/meter)": 1.287779, "calories(kcal)": 247.0,
            },
            {
                "type": 9, "startTime": "2026-06-26 06:23:25+0000",
                "sportTime(s)": 1728, "maxPace(/meter)": 0.13, "minPace(/meter)": 0.0,
                "distance(m)": 8654.0, "avgPace(/meter)": 0.199666, "calories(kcal)": 177.0,
            },
        ],
    )
    _write_csv(
        os.path.join(export, "ACTIVITY", "ACTIVITY.csv"),
        ["date", "steps", "distance", "runDistance", "calories"],
        [
            {"date": "2026-06-29", "steps": 1177, "distance": 829, "runDistance": 716, "calories": 52},
            {"date": "2026-06-28", "steps": 6974, "distance": 4890, "runDistance": 4169, "calories": 571},
            {"date": "2026-06-27", "steps": 17121, "distance": 12995, "runDistance": 10106, "calories": 574},
            {"date": "2026-06-26", "steps": 4163, "distance": 2890, "runDistance": 2503, "calories": 530},
        ],
    )
    return export


class TestFindLatestExport(unittest.TestCase):
    def test_picks_highest_timestamp(self):
        with tempfile.TemporaryDirectory() as d:
            os.makedirs(os.path.join(d, "123_1000"))
            os.makedirs(os.path.join(d, "123_2000"))
            os.makedirs(os.path.join(d, "123_500"))
            result = find_latest_export(d)
            self.assertIn("123_2000", result)

    def test_returns_none_for_empty_dir(self):
        with tempfile.TemporaryDirectory() as d:
            self.assertIsNone(find_latest_export(d))

    def test_returns_none_for_missing_dir(self):
        self.assertIsNone(find_latest_export("/nonexistent/zepp"))

    def test_ignores_non_timestamped_dirs(self):
        with tempfile.TemporaryDirectory() as d:
            os.makedirs(os.path.join(d, "not_an_export"))
            self.assertIsNone(find_latest_export(d))


class TestValidateExport(unittest.TestCase):
    def test_valid_export_no_warnings(self):
        with tempfile.TemporaryDirectory() as d:
            export = _make_export(d)
            self.assertEqual(validate_export(export), [])

    def test_missing_csv_produces_warning(self):
        with tempfile.TemporaryDirectory() as d:
            export = _make_export(d)
            import shutil
            shutil.rmtree(os.path.join(export, "SLEEP"))
            warnings = validate_export(export)
            self.assertTrue(any("SLEEP" in w for w in warnings))


class TestReadSleep(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.export = _make_export(self.tmp)

    def tearDown(self):
        import shutil; shutil.rmtree(self.tmp)

    def test_reads_valid_sleep_row(self):
        result = read_sleep(self.export, "2026-06-29")
        self.assertIsNotNone(result)
        self.assertEqual(result["deep_min"], 91)
        self.assertEqual(result["rem_min"], 70)
        self.assertEqual(result["total_min"], 91 + 217 + 70)

    def test_zero_row_returns_none(self):
        self.assertIsNone(read_sleep(self.export, "2026-06-28"))

    def test_missing_date_returns_none(self):
        self.assertIsNone(read_sleep(self.export, "2025-01-01"))

    def test_start_utc_parsed(self):
        result = read_sleep(self.export, "2026-06-29")
        self.assertIsNotNone(result["start_utc"])
        self.assertEqual(result["start_utc"].tzinfo, timezone.utc)


class TestReadAllDates(unittest.TestCase):
    def test_returns_dates_from_sleep_and_activity(self):
        with tempfile.TemporaryDirectory() as d:
            export = _make_export(d)
            dates = read_all_dates(export)
            self.assertIn("2026-06-29", dates)
            self.assertIn("2026-06-27", dates)
            self.assertEqual(dates, sorted(dates))


class TestComputeSleepScoreProxy(unittest.TestCase):
    def test_zero_total_returns_none(self):
        self.assertIsNone(compute_sleep_score_proxy(0, 0, 0, 0))

    def test_good_sleep_gives_high_score(self):
        # deep=20%, REM=25%, almost no wake → near-max
        score = compute_sleep_score_proxy(deep_min=80, shallow_min=222, rem_min=98, wake_min=5)
        self.assertGreater(score, 75)

    def test_poor_sleep_gives_low_score(self):
        # very little deep and REM, lots of wake
        score = compute_sleep_score_proxy(deep_min=5, shallow_min=200, rem_min=5, wake_min=60)
        self.assertLess(score, 50)

    def test_score_clamped_0_to_100(self):
        score = compute_sleep_score_proxy(deep_min=200, shallow_min=0, rem_min=200, wake_min=0)
        self.assertGreaterEqual(score, 0)
        self.assertLessEqual(score, 100)


class TestReadRestingHr(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.export = _make_export(self.tmp)

    def tearDown(self):
        import shutil; shutil.rmtree(self.tmp)

    def test_returns_min_hr_in_sleep_window(self):
        start = datetime(2026, 6, 29, 0, 0, tzinfo=timezone.utc)
        stop = datetime(2026, 6, 29, 6, 28, tzinfo=timezone.utc)
        rhr, n = read_resting_hr(self.export, "2026-06-29", start, stop)
        self.assertEqual(rhr, 47)
        self.assertGreater(n, 0)

    def test_excludes_sport_session_hr(self):
        # HR at 08:50 (120bpm) is outside sleep window 00:00-06:28
        start = datetime(2026, 6, 29, 0, 0, tzinfo=timezone.utc)
        stop = datetime(2026, 6, 29, 6, 28, tzinfo=timezone.utc)
        rhr, _ = read_resting_hr(self.export, "2026-06-29", start, stop)
        self.assertLessEqual(rhr, 55)  # not 120

    def test_returns_none_when_no_hr_data(self):
        start = datetime(2025, 1, 1, 0, 0, tzinfo=timezone.utc)
        stop = datetime(2025, 1, 1, 6, 0, tzinfo=timezone.utc)
        rhr, n = read_resting_hr(self.export, "2025-01-01", start, stop)
        self.assertIsNone(rhr)
        self.assertEqual(n, 0)


class TestDecodeSportType(unittest.TestCase):
    def test_known_type_9(self):
        self.assertEqual(decode_sport_type(9), "outdoor_cycling")

    def test_known_type_15(self):
        self.assertEqual(decode_sport_type(15), "outdoor_walking")

    def test_known_type_1(self):
        self.assertEqual(decode_sport_type(1), "outdoor_running")

    def test_unknown_type(self):
        result = decode_sport_type(999)
        self.assertIn("999", result)


class TestComputeActivityHr(unittest.TestCase):
    def _make_hr_rows(self):
        return [
            {"date": "2026-06-28", "time": "08:50", "heartRate": "145"},
            {"date": "2026-06-28", "time": "09:00", "heartRate": "150"},
            {"date": "2026-06-28", "time": "09:10", "heartRate": "148"},
            {"date": "2026-06-28", "time": "11:00", "heartRate": "70"},  # outside window
        ]

    def test_computes_avg_and_max(self):
        start = datetime(2026, 6, 28, 8, 49, 50, tzinfo=timezone.utc)
        avg, mx = compute_activity_hr(start, 1416, self._make_hr_rows())
        self.assertEqual(avg, round((145 + 150 + 148) / 3))
        self.assertEqual(mx, 150)

    def test_returns_none_for_fewer_than_3_samples(self):
        start = datetime(2026, 6, 28, 8, 49, 50, tzinfo=timezone.utc)
        rows = [{"date": "2026-06-28", "time": "08:50", "heartRate": "145"}]
        avg, mx = compute_activity_hr(start, 1416, rows)
        self.assertIsNone(avg)
        self.assertIsNone(mx)


class TestReadSportSessions(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.export = _make_export(self.tmp)

    def tearDown(self):
        import shutil; shutil.rmtree(self.tmp)

    def test_finds_session_for_date(self):
        sessions = read_sport_sessions(self.export, "2026-06-28")
        self.assertEqual(len(sessions), 1)
        self.assertEqual(sessions[0]["type_name"], "outdoor_walking")

    def test_no_sessions_for_date(self):
        sessions = read_sport_sessions(self.export, "2026-06-27")
        self.assertEqual(sessions, [])

    def test_distance_converted_to_km(self):
        sessions = read_sport_sessions(self.export, "2026-06-26")
        self.assertAlmostEqual(sessions[0]["distance_km"], 8.654, places=2)

    def test_pace_decoded_to_min_km(self):
        sessions = read_sport_sessions(self.export, "2026-06-28")
        # avgPace 1.287779 s/m → 1.287779 * 1000 / 60 ≈ 21.46 min/km
        self.assertAlmostEqual(sessions[0]["avg_pace_min_km"], 21.46, places=1)

    def test_tss_computed_even_without_hr(self):
        sessions = read_sport_sessions(self.export, "2026-06-28")
        self.assertIsNotNone(sessions[0]["tss"])
        self.assertGreater(sessions[0]["tss"], 0)


class TestReadActivityFallback(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.export = _make_export(self.tmp)

    def tearDown(self):
        import shutil; shutil.rmtree(self.tmp)

    def test_returns_run_distance_in_km(self):
        result = read_activity_fallback(self.export, "2026-06-27")
        self.assertIsNotNone(result)
        self.assertAlmostEqual(result["run_distance_km"], 10.106, places=2)

    def test_returns_none_for_missing_date(self):
        self.assertIsNone(read_activity_fallback(self.export, "2025-01-01"))


class TestCheckHistoryDuplicate(unittest.TestCase):
    def test_duplicate_detected(self):
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            json.dump([{"date": "2026-06-29", "tss": 40}], f)
            path = f.name
        try:
            self.assertTrue(check_history_duplicate(path, "2026-06-29"))
            self.assertFalse(check_history_duplicate(path, "2026-06-28"))
        finally:
            os.unlink(path)

    def test_missing_file_returns_false(self):
        self.assertFalse(check_history_duplicate("/nonexistent/history.json", "2026-06-29"))


class TestGetExportNewestDate(unittest.TestCase):
    def test_returns_newest_date(self):
        with tempfile.TemporaryDirectory() as d:
            export = _make_export(d)
            self.assertEqual(get_export_newest_date(export), "2026-06-29")


class TestSynthesizeHistoryEntry(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.export = _make_export(self.tmp)
        from parse_zepp_export import _load_hr_rows
        self.hr_rows = _load_hr_rows(self.export)

    def tearDown(self):
        import shutil; shutil.rmtree(self.tmp)

    def test_valid_day_produces_entry(self):
        entry = synthesize_history_entry(self.export, "2026-06-29", self.hr_rows)
        self.assertIsNotNone(entry)
        self.assertEqual(entry["date"], "2026-06-29")
        self.assertIn("sleep_hours", entry)
        self.assertIn("resting_hr", entry)
        self.assertIsNone(entry["hrv"])  # never in export

    def test_zero_sleep_row_gives_null_sleep_fields(self):
        entry = synthesize_history_entry(self.export, "2026-06-28", self.hr_rows)
        self.assertIsNotNone(entry)
        self.assertIsNone(entry["sleep_hours"])

    def test_activity_fallback_for_untracked_run(self):
        # 2026-06-27: no SPORT session but 10km runDistance in ACTIVITY
        entry = synthesize_history_entry(self.export, "2026-06-27", self.hr_rows)
        self.assertIsNotNone(entry)
        self.assertAlmostEqual(entry["distance_km"], 10.106, places=2)
        self.assertGreater(entry["tss"], 0)

    def test_returns_none_for_empty_date(self):
        result = synthesize_history_entry(self.export, "2025-01-01", self.hr_rows)
        self.assertIsNone(result)


class TestBackfillHistory(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.zepp_dir = os.path.join(self.tmp, "zepp")
        os.makedirs(self.zepp_dir)
        _make_export(self.zepp_dir)
        self.history_path = os.path.join(self.tmp, "history.json")

    def tearDown(self):
        import shutil; shutil.rmtree(self.tmp)

    def test_backfills_missing_dates(self):
        added = backfill_history(self.zepp_dir, self.history_path)
        self.assertGreater(len(added), 0)
        with open(self.history_path) as f:
            history = json.load(f)
        dates = {e["date"] for e in history}
        self.assertIn("2026-06-29", dates)

    def test_skips_existing_dates(self):
        with open(self.history_path, "w") as f:
            json.dump([{"date": "2026-06-29", "tss": 99, "distance_km": 10}], f)
        added = backfill_history(self.zepp_dir, self.history_path)
        self.assertNotIn("2026-06-29", added)
        # Original entry preserved
        with open(self.history_path) as f:
            history = json.load(f)
        june29 = next(e for e in history if e["date"] == "2026-06-29")
        self.assertEqual(june29["tss"], 99)

    def test_history_sorted_by_date(self):
        backfill_history(self.zepp_dir, self.history_path)
        with open(self.history_path) as f:
            history = json.load(f)
        dates = [e["date"] for e in history]
        self.assertEqual(dates, sorted(dates))

    def test_no_export_returns_empty(self):
        empty_dir = os.path.join(self.tmp, "empty_zepp")
        os.makedirs(empty_dir)
        self.assertEqual(backfill_history(empty_dir, self.history_path), [])


class TestParseExport(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.zepp_dir = os.path.join(self.tmp, "zepp")
        os.makedirs(self.zepp_dir)
        _make_export(self.zepp_dir)
        self.history_path = os.path.join(self.tmp, "history.json")

    def tearDown(self):
        import shutil; shutil.rmtree(self.tmp)

    def test_returns_no_export_when_dir_missing(self):
        result = parse_export("/nonexistent/zepp", "2026-06-29", self.history_path)
        self.assertTrue(result["no_export"])

    def test_auto_fills_sleep_and_resting_hr(self):
        result = parse_export(self.zepp_dir, "2026-06-29", self.history_path)
        self.assertIn("sleep_hours", result["fields"])
        self.assertIn("resting_hr", result["fields"])

    def test_hrv_always_in_missing(self):
        result = parse_export(self.zepp_dir, "2026-06-29", self.history_path)
        self.assertIn("hrv", result["missing"])

    def test_stale_export_warning(self):
        result = parse_export(self.zepp_dir, "2030-01-01", self.history_path)
        self.assertTrue(any("stale" in w.lower() for w in result["warnings"]))

    def test_duplicate_warning(self):
        with open(self.history_path, "w") as f:
            json.dump([{"date": "2026-06-29", "tss": 40}], f)
        result = parse_export(self.zepp_dir, "2026-06-29", self.history_path)
        self.assertTrue(any("already" in w.lower() for w in result["warnings"]))


if __name__ == "__main__":
    unittest.main()
