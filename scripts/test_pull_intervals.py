"""
Tests for pull_intervals.py's pure conversion functions.
Run with: python3 -m pytest scripts/ -v
"""

import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(__file__))
from pull_intervals import km_laps, to_activity


class TestKmLaps(unittest.TestCase):
    def test_steady_pace_gives_equal_full_km(self):
        t = list(range(0, 601))          # 600 s
        d = [x * 5.0 for x in t]         # 5 m/s -> 3000 m, 200 s/km
        laps = km_laps(t, d, [140] * len(t))
        self.assertEqual([l["km"] for l in laps], [1.0, 1.0, 1.0])
        self.assertEqual([l["sec"] for l in laps], [200, 200, 200])
        self.assertEqual(laps[0]["hr"], 140)

    def test_split_time_is_interpolated_at_the_km_mark(self):
        laps = km_laps([0, 10], [0, 2000], [150, 150])
        self.assertEqual([l["sec"] for l in laps], [5, 5])

    def test_short_last_split_kept_tiny_one_dropped(self):
        t = list(range(0, 101))
        self.assertEqual(km_laps(t, [x * 12.0 for x in t], [130] * 101)[-1]["km"], 0.2)
        self.assertEqual(len(km_laps(t, [x * 10.02 for x in t], [130] * 101)), 1)

    def test_empty_streams(self):
        self.assertEqual(km_laps([], [], []), [])

    def test_missing_hr_samples_ignored(self):
        laps = km_laps([0, 100, 200], [0, 500, 1000], [0, 120, 140])
        self.assertEqual(laps[0]["hr"], 130)


class TestToActivity(unittest.TestCase):
    RAW = {"id": "i1", "start_date_local": "2026-11-04T18:38:42", "type": "Run", "name": "Evening Run",
           "distance": 8788.87, "moving_time": 2934, "average_heartrate": 136, "max_heartrate": 154}

    def test_converts_units(self):
        a = to_activity(self.RAW)
        self.assertEqual((a["date"], a["distanceKm"], a["movingSec"], a["avgHr"]), ("2026-11-04", 8.79, 2934, 136))

    def test_empty_stub_is_skipped(self):
        self.assertIsNone(to_activity({**self.RAW, "distance": None, "moving_time": 0}))


if __name__ == "__main__":
    unittest.main()
