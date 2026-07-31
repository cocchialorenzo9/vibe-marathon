"""
Tests for build_zone_history.py's zone-classification and journal-filtering logic.
Run with: python3 -m pytest scripts/ -v
"""

import json
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(__file__))
from build_zone_history import build_zone_history, classify_curve_zones


class TestClassifyCurveZones(unittest.TestCase):
    def test_empty_curve_returns_none(self):
        self.assertIsNone(classify_curve_zones([], lt1=125, lt2=167))

    def test_buckets_by_zone_boundary(self):
        curve = [
            {"t_min": 0, "hr": 110},  # zone1 (<125)
            {"t_min": 1, "hr": 124},  # zone1 (<125)
            {"t_min": 2, "hr": 125},  # zone2 (>=125, <167)
            {"t_min": 3, "hr": 150},  # zone2
            {"t_min": 4, "hr": 167},  # zone3 (>=167)
            {"t_min": 5, "hr": 170},  # zone3
        ]
        result = classify_curve_zones(curve, lt1=125, lt2=167)
        self.assertEqual(result["zone1_min"], 2)
        self.assertEqual(result["zone2_min"], 2)
        self.assertEqual(result["zone3_min"], 2)

    def test_avg_pct_lt_computed_against_lt2(self):
        curve = [{"t_min": 0, "hr": 167}, {"t_min": 1, "hr": 167}]
        result = classify_curve_zones(curve, lt1=125, lt2=167)
        self.assertEqual(result["avg_pct_lt"], 100)


class TestBuildZoneHistory(unittest.TestCase):
    def _write_journal(self, entries):
        f = tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False)
        json.dump(entries, f)
        f.close()
        return f.name

    def test_missing_journal_returns_empty(self):
        self.assertEqual(build_zone_history("/nonexistent/path.json"), [])

    def test_skips_non_running_types(self):
        path = self._write_journal([
            {"date": "2026-07-06", "type": "swim", "hr_curve": [{"t_min": 0, "hr": 130}]},
            {"date": "2026-07-07", "type": "outdoor_walking", "hr_curve": [{"t_min": 0, "hr": 110}]},
        ])
        self.assertEqual(build_zone_history(path), [])
        os.unlink(path)

    def test_skips_running_entries_without_curve(self):
        path = self._write_journal([
            {"date": "2026-07-01", "type": "auto-detected running"},
            {"date": "2026-07-02", "type": "outdoor_running", "hr_curve": []},
        ])
        self.assertEqual(build_zone_history(path), [])
        os.unlink(path)

    def test_includes_treadmill_and_outdoor_running(self):
        path = self._write_journal([
            {"date": "2026-07-09", "type": "outdoor_running",
             "hr_curve": [{"t_min": 0, "hr": 130}]},
            {"date": "2026-07-08", "type": "treadmill",
             "hr_curve": [{"t_min": 0, "hr": 140}]},
        ])
        result = build_zone_history(path)
        self.assertEqual([e["date"] for e in result], ["2026-07-08", "2026-07-09"])
        os.unlink(path)

    def test_sorted_ascending_by_date(self):
        path = self._write_journal([
            {"date": "2026-07-31", "type": "outdoor_running",
             "hr_curve": [{"t_min": 0, "hr": 130}]},
            {"date": "2026-07-07", "type": "outdoor_running",
             "hr_curve": [{"t_min": 0, "hr": 130}]},
        ])
        result = build_zone_history(path)
        self.assertEqual([e["date"] for e in result], ["2026-07-07", "2026-07-31"])
        os.unlink(path)


if __name__ == "__main__":
    unittest.main()
