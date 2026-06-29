"""
Tests for fetch_amazfit.py pure computation functions.
Run with: python3 -m pytest scripts/ -v
      or: python3 -m unittest scripts/test_fetch_amazfit.py -v
"""

import json
import os
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, os.path.dirname(__file__))
from fetch_amazfit import (
    build_canonical,
    compute_hr_baseline,
    compute_hrv_baseline,
    compute_readiness_score,
    hrv_status,
    load_history,
)


def _history(entries):
    """Build a history list from (hrv, resting_hr) tuples."""
    return [{"hrv": h, "resting_hr": r} for h, r in entries]


class TestComputeHrvBaseline(unittest.TestCase):
    def test_empty_history_returns_none(self):
        self.assertIsNone(compute_hrv_baseline([]))

    def test_fewer_than_three_returns_none(self):
        self.assertIsNone(compute_hrv_baseline(_history([(50, 52), (55, 51)])))

    def test_three_or_more_returns_average(self):
        h = _history([(50, 52), (52, 51), (48, 53)])
        self.assertEqual(compute_hrv_baseline(h), 50)

    def test_uses_last_seven_only(self):
        # 10 entries; only last 7 matter
        old = [(90, 60)] * 3  # would skew the average high
        recent = [(50, 52), (52, 51), (48, 53), (51, 50), (49, 52), (50, 51), (53, 50)]
        h = _history(old + recent)
        result = compute_hrv_baseline(h)
        expected = round(sum(v for v, _ in recent) / len(recent))
        self.assertEqual(result, expected)

    def test_none_hrv_entries_skipped(self):
        h = [{"hrv": None, "resting_hr": 52}, {"hrv": 50, "resting_hr": 51}, {"hrv": 52, "resting_hr": 50}, {"hrv": 48, "resting_hr": 53}]
        self.assertEqual(compute_hrv_baseline(h), 50)


class TestComputeHrBaseline(unittest.TestCase):
    def test_empty_history_returns_none(self):
        self.assertIsNone(compute_hr_baseline([]))

    def test_fewer_than_three_returns_none(self):
        self.assertIsNone(compute_hr_baseline(_history([(50, 52)])))

    def test_three_or_more_returns_average(self):
        h = _history([(50, 50), (52, 52), (48, 54)])
        self.assertEqual(compute_hr_baseline(h), 52)

    def test_none_rhr_entries_skipped(self):
        h = [{"hrv": 50, "resting_hr": None}, {"hrv": 52, "resting_hr": 50}, {"hrv": 48, "resting_hr": 52}, {"hrv": 51, "resting_hr": 54}]
        self.assertEqual(compute_hr_baseline(h), 52)


class TestComputeReadinessScore(unittest.TestCase):
    def test_all_signals_good_gives_high_score(self):
        # HRV +15% above baseline, sleep score 90, resting HR at baseline
        score = compute_readiness_score(
            hrv_value=57, hrv_baseline=50,   # +14%, pushes toward +20 HRV points
            sleep_score=90, sleep_hours=None,
            resting_hr=50, hr_baseline=50,   # neutral
        )
        self.assertGreater(score, 70)

    def test_all_signals_poor_gives_low_score(self):
        # HRV -20% below baseline, sleep score 40, resting HR elevated
        score = compute_readiness_score(
            hrv_value=40, hrv_baseline=50,   # -20%
            sleep_score=40, sleep_hours=None,
            resting_hr=58, hr_baseline=50,   # +16% elevated
        )
        self.assertLess(score, 40)

    def test_neutral_signals_gives_around_50(self):
        score = compute_readiness_score(
            hrv_value=50, hrv_baseline=50,
            sleep_score=70, sleep_hours=None,
            resting_hr=50, hr_baseline=50,
        )
        self.assertEqual(score, 50)

    def test_missing_hrv_baseline_skips_hrv_component(self):
        # Without HRV, only sleep + resting HR contribute
        score = compute_readiness_score(
            hrv_value=None, hrv_baseline=None,
            sleep_score=70, sleep_hours=None,
            resting_hr=50, hr_baseline=50,
        )
        self.assertEqual(score, 50)  # all neutral

    def test_missing_sleep_score_falls_back_to_hours(self):
        # 8h sleep → high proxy score → above neutral
        score = compute_readiness_score(
            hrv_value=None, hrv_baseline=None,
            sleep_score=None, sleep_hours=8.0,
            resting_hr=None, hr_baseline=None,
        )
        self.assertGreater(score, 50)

    def test_score_clamped_to_0_100(self):
        # Extreme bad signals
        score = compute_readiness_score(
            hrv_value=20, hrv_baseline=50,   # -60%, way below
            sleep_score=0, sleep_hours=None,
            resting_hr=70, hr_baseline=50,   # +40% elevated
        )
        self.assertGreaterEqual(score, 0)
        self.assertLessEqual(score, 100)

    def test_all_none_returns_50(self):
        score = compute_readiness_score(None, None, None, None, None, None)
        self.assertEqual(score, 50)


class TestHrvStatus(unittest.TestCase):
    def test_balanced_when_near_baseline(self):
        self.assertEqual(hrv_status(50, 50), "balanced")
        self.assertEqual(hrv_status(52, 50), "balanced")
        self.assertEqual(hrv_status(48, 50), "balanced")  # -4%, within threshold

    def test_unbalanced_when_moderately_below(self):
        # -10% below baseline
        self.assertEqual(hrv_status(45, 50), "unbalanced")

    def test_low_when_far_below(self):
        # -20% below baseline
        self.assertEqual(hrv_status(40, 50), "low")

    def test_unknown_when_value_none(self):
        self.assertEqual(hrv_status(None, 50), "unknown")
        self.assertEqual(hrv_status(50, None), "unknown")
        self.assertEqual(hrv_status(None, None), "unknown")

    def test_unknown_when_baseline_zero(self):
        self.assertEqual(hrv_status(50, 0), "unknown")


class TestBuildCanonical(unittest.TestCase):
    def _build(self, **overrides):
        defaults = dict(
            today="2026-06-29",
            hrv_value=52,
            hrv_baseline=50,
            sleep_hours=7.5,
            sleep_score=80,
            deep_seconds=4800,
            rem_seconds=5400,
            resting_hr=51,
            hr_baseline=52,
            yesterday_activity=None,
        )
        defaults.update(overrides)
        return build_canonical(**defaults)

    def test_source_is_amazfit(self):
        self.assertEqual(self._build()["source"], "amazfit")

    def test_body_battery_is_null(self):
        self.assertIsNone(self._build()["body_battery"])

    def test_readiness_source_is_computed(self):
        self.assertEqual(self._build()["readiness"]["source"], "computed")

    def test_readiness_score_is_int(self):
        self.assertIsInstance(self._build()["readiness"]["score"], int)

    def test_hrv_baseline_passed_through(self):
        result = self._build(hrv_baseline=48)
        self.assertEqual(result["hrv"]["baseline"], 48)

    def test_sleep_fields_present(self):
        result = self._build()
        self.assertEqual(result["sleep"]["hours"], 7.5)
        self.assertEqual(result["sleep"]["score"], 80)
        self.assertEqual(result["sleep"]["deep_seconds"], 4800)

    def test_output_is_json_serializable(self):
        result = self._build()
        json.dumps(result)  # must not raise

    def test_with_yesterday_activity(self):
        act = {"type": "running", "distance_km": 10.0, "duration_min": 54.0,
               "avg_hr": 148, "max_hr": 171, "calories": 640, "avg_pace_min_km": 5.4}
        result = self._build(yesterday_activity=act)
        self.assertEqual(result["yesterday_activity"]["type"], "running")

    def test_all_none_inputs_still_produces_valid_schema(self):
        result = build_canonical(
            today="2026-06-29",
            hrv_value=None, hrv_baseline=None,
            sleep_hours=None, sleep_score=None,
            deep_seconds=None, rem_seconds=None,
            resting_hr=None, hr_baseline=None,
            yesterday_activity=None,
        )
        self.assertEqual(result["source"], "amazfit")
        self.assertIsNone(result["hrv"]["value"])
        self.assertIsNone(result["body_battery"])
        self.assertEqual(result["readiness"]["score"], 50)


class TestLoadHistory(unittest.TestCase):
    def test_missing_file_returns_empty_list(self):
        self.assertEqual(load_history("/nonexistent/path/history.json"), [])

    def test_valid_file_returns_list(self):
        import tempfile
        data = [{"date": "2026-06-28", "hrv": 50, "resting_hr": 52}]
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            json.dump(data, f)
            path = f.name
        try:
            result = load_history(path)
            self.assertEqual(result, data)
        finally:
            os.unlink(path)

    def test_corrupt_json_returns_empty_list(self):
        import tempfile
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            f.write("not valid json {{")
            path = f.name
        try:
            self.assertEqual(load_history(path), [])
        finally:
            os.unlink(path)


if __name__ == "__main__":
    unittest.main()
