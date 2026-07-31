"""
Tests for build_zone_history.py's band-classification and journal-filtering logic.
Run with: python3 -m pytest scripts/ -v
"""

import json
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(__file__))
from build_zone_history import build_zone_history, classify_curve_bands


class TestClassifyCurveBands(unittest.TestCase):
    def test_empty_curve_returns_none(self):
        self.assertIsNone(classify_curve_bands([], lt2=167))

    def test_buckets_by_band_boundary(self):
        curve = [
            {"t_min": 0, "hr": 110},  # band1 (<130)
            {"t_min": 1, "hr": 129},  # band1 (<130)
            {"t_min": 2, "hr": 130},  # band2 (130-140)
            {"t_min": 3, "hr": 139},  # band2
            {"t_min": 4, "hr": 140},  # band3 (140-155)
            {"t_min": 5, "hr": 154},  # band3
            {"t_min": 6, "hr": 155},  # band4 (155-167)
            {"t_min": 7, "hr": 166},  # band4
            {"t_min": 8, "hr": 167},  # band5 (167+)
            {"t_min": 9, "hr": 175},  # band5
        ]
        result = classify_curve_bands(curve, lt2=167)
        self.assertEqual(result["band1_min"], 2)
        self.assertEqual(result["band2_min"], 2)
        self.assertEqual(result["band3_min"], 2)
        self.assertEqual(result["band4_min"], 2)
        self.assertEqual(result["band5_min"], 2)

    def test_avg_pct_lt_computed_against_lt2(self):
        curve = [{"t_min": 0, "hr": 167}, {"t_min": 1, "hr": 167}]
        result = classify_curve_bands(curve, lt2=167)
        self.assertEqual(result["avg_pct_lt"], 100)

    def test_avg_band_reflects_mean_not_individual_samples(self):
        # Two low-band minutes and one high-band minute average out to a
        # middle band that no individual sample was actually in.
        curve = [{"t_min": 0, "hr": 110}, {"t_min": 1, "hr": 110}, {"t_min": 2, "hr": 200}]
        result = classify_curve_bands(curve, lt2=167)
        self.assertEqual(result["avg_band"], 3)

    def test_avg_band_boundary_follows_lt2(self):
        curve = [{"t_min": 0, "hr": 160}]
        # With a lower lt2, 160bpm now falls in the top (5th) band.
        self.assertEqual(classify_curve_bands(curve, lt2=158)["avg_band"], 5)
        self.assertEqual(classify_curve_bands(curve, lt2=167)["avg_band"], 4)

    def test_top_band_follows_lt2(self):
        curve = [{"t_min": 0, "hr": 160}]
        # With a lower lt2, 160bpm now falls in the top (5th) band.
        result = classify_curve_bands(curve, lt2=158)
        self.assertEqual(result["band5_min"], 1)
        self.assertEqual(result["band4_min"], 0)


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

    def test_includes_avg_pace_min_km_from_journal(self):
        path = self._write_journal([
            {"date": "2026-07-09", "type": "outdoor_running",
             "hr_curve": [{"t_min": 0, "hr": 130}], "avg_pace_min_km": 5.5},
        ])
        result = build_zone_history(path)
        self.assertEqual(result[0]["avg_pace_min_km"], 5.5)
        os.unlink(path)

    def test_avg_pace_min_km_none_when_missing(self):
        path = self._write_journal([
            {"date": "2026-07-09", "type": "outdoor_running",
             "hr_curve": [{"t_min": 0, "hr": 130}]},
        ])
        result = build_zone_history(path)
        self.assertIsNone(result[0]["avg_pace_min_km"])
        os.unlink(path)

    def test_includes_distance_km_from_journal(self):
        path = self._write_journal([
            {"date": "2026-07-09", "type": "outdoor_running",
             "hr_curve": [{"t_min": 0, "hr": 130}], "distance_km": 21.02},
        ])
        result = build_zone_history(path)
        self.assertEqual(result[0]["distance_km"], 21.02)
        os.unlink(path)

    def test_distance_km_none_when_missing(self):
        path = self._write_journal([
            {"date": "2026-07-09", "type": "outdoor_running",
             "hr_curve": [{"t_min": 0, "hr": 130}]},
        ])
        result = build_zone_history(path)
        self.assertIsNone(result[0]["distance_km"])
        os.unlink(path)


if __name__ == "__main__":
    unittest.main()
