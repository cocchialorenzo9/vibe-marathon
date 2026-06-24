"""
Tests for fetch_garmin.py parsing functions.
Run with: python3 -m pytest scripts/ -v
      or: python3 -m unittest scripts/test_fetch_garmin.py -v
"""

import json
import os
import sys
import unittest
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.dirname(__file__))
from fetch_garmin import (
    fetch_all,
    parse_activity,
    parse_body_battery,
    parse_hrv,
    parse_resting_hr,
    parse_sleep,
    parse_training_readiness,
)


class TestParseHrv(unittest.TestCase):
    def test_full_response(self):
        data = {"hrvSummary": {"lastNight": 48, "weeklyAvg": 55, "baselineLowUpper": 45, "baselineBalancedLow": 52, "status": "BALANCED"}}
        result = parse_hrv(data)
        self.assertEqual(result["value"], 48)
        self.assertEqual(result["weekly_avg"], 55)
        self.assertEqual(result["status"], "BALANCED")

    def test_missing_summary_key(self):
        self.assertIsNone(parse_hrv({}))
        self.assertIsNone(parse_hrv(None))

    def test_partial_fields(self):
        data = {"hrvSummary": {"lastNight": 42}}
        result = parse_hrv(data)
        self.assertEqual(result["value"], 42)
        self.assertIsNone(result["weekly_avg"])
        self.assertIsNone(result["status"])


class TestParseSleep(unittest.TestCase):
    def test_full_response(self):
        data = {
            "dailySleepDTO": {
                "sleepTimeSeconds": 25920,  # 7.2h
                "sleepScores": {"overall": {"value": 78}},
                "deepSleepSeconds": 5400,
                "remSleepSeconds": 6300,
            }
        }
        result = parse_sleep(data)
        self.assertAlmostEqual(result["hours"], 7.2)
        self.assertEqual(result["score"], 78)
        self.assertEqual(result["deep_seconds"], 5400)

    def test_score_as_plain_int(self):
        # Some Garmin firmware versions return score as plain int, not dict
        data = {"dailySleepDTO": {"sleepTimeSeconds": 21600, "sleepScores": {"overall": 65}}}
        result = parse_sleep(data)
        self.assertEqual(result["score"], 65)

    def test_missing_dto(self):
        self.assertIsNone(parse_sleep({}))
        self.assertIsNone(parse_sleep(None))

    def test_zero_sleep(self):
        data = {"dailySleepDTO": {"sleepTimeSeconds": 0, "sleepScores": None}}
        result = parse_sleep(data)
        self.assertEqual(result["hours"], 0.0)
        self.assertIsNone(result["score"])


class TestParseRestingHr(unittest.TestCase):
    def test_normal(self):
        self.assertEqual(parse_resting_hr({"restingHeartRate": 52}), 52)

    def test_missing_key(self):
        self.assertIsNone(parse_resting_hr({}))

    def test_none_input(self):
        self.assertIsNone(parse_resting_hr(None))


class TestParseTrainingReadiness(unittest.TestCase):
    def test_list_response(self):
        data = [{"score": 72, "level": "GOOD", "contributingFactors": ["HRV", "SLEEP"]}]
        result = parse_training_readiness(data)
        self.assertEqual(result["score"], 72)
        self.assertEqual(result["level"], "GOOD")
        self.assertEqual(result["contributing_factors"], ["HRV", "SLEEP"])

    def test_dict_response(self):
        data = {"score": 55, "level": "MODERATE"}
        result = parse_training_readiness(data)
        self.assertEqual(result["score"], 55)

    def test_empty_list(self):
        self.assertIsNone(parse_training_readiness([]))

    def test_none(self):
        self.assertIsNone(parse_training_readiness(None))


class TestParseBodyBattery(unittest.TestCase):
    def test_normal(self):
        data = [{"bodyBatteryValuesArray": [[0, 80], [1, 60], [2, 45], [3, 70]]}]
        result = parse_body_battery(data)
        self.assertEqual(result["current"], 70)
        self.assertEqual(result["high"], 80)
        self.assertEqual(result["low"], 45)

    def test_filters_none_values(self):
        data = [{"bodyBatteryValuesArray": [[0, None], [1, 60], [2, None], [3, 75]]}]
        result = parse_body_battery(data)
        self.assertEqual(result["current"], 75)
        self.assertEqual(result["high"], 75)
        self.assertEqual(result["low"], 60)

    def test_all_none_values(self):
        data = [{"bodyBatteryValuesArray": [[0, None], [1, None]]}]
        self.assertIsNone(parse_body_battery(data))

    def test_empty_array(self):
        data = [{"bodyBatteryValuesArray": []}]
        self.assertIsNone(parse_body_battery(data))

    def test_none_input(self):
        self.assertIsNone(parse_body_battery(None))
        self.assertIsNone(parse_body_battery([]))


class TestParseActivity(unittest.TestCase):
    def _make_activity(self, type_key, distance=10000, duration=3600, avg_hr=145, speed=2.78):
        return {
            "activityType": {"typeKey": type_key},
            "distance": distance,
            "duration": duration,
            "averageHR": avg_hr,
            "maxHR": 175,
            "calories": 600,
            "averageSpeed": speed,
        }

    def test_prefers_running_over_other(self):
        activities = [
            self._make_activity("cycling"),
            self._make_activity("running"),
        ]
        result = parse_activity(activities)
        self.assertEqual(result["type"], "running")

    def test_falls_back_to_first_if_no_run(self):
        activities = [self._make_activity("cycling"), self._make_activity("swimming")]
        result = parse_activity(activities)
        self.assertEqual(result["type"], "cycling")

    def test_distance_converted_to_km(self):
        result = parse_activity([self._make_activity("running", distance=21100)])
        self.assertAlmostEqual(result["distance_km"], 21.1)

    def test_duration_converted_to_minutes(self):
        result = parse_activity([self._make_activity("running", duration=5400)])
        self.assertAlmostEqual(result["duration_min"], 90.0)

    def test_pace_computed_from_speed(self):
        # 2.78 m/s ≈ 6:00/km
        result = parse_activity([self._make_activity("running", speed=2.78)])
        self.assertAlmostEqual(result["avg_pace_min_km"], 5.99, places=1)

    def test_zero_speed_gives_none_pace(self):
        result = parse_activity([self._make_activity("running", speed=0)])
        self.assertIsNone(result["avg_pace_min_km"])

    def test_none_speed_gives_none_pace(self):
        act = self._make_activity("running")
        act["averageSpeed"] = None
        result = parse_activity([act])
        self.assertIsNone(result["avg_pace_min_km"])

    def test_empty_list_returns_none(self):
        self.assertIsNone(parse_activity([]))
        self.assertIsNone(parse_activity(None))


class TestFetchAll(unittest.TestCase):
    def _make_api(self):
        api = MagicMock()
        api.get_hrv_data.return_value = {"hrvSummary": {"lastNight": 50, "weeklyAvg": 54}}
        api.get_sleep_data.return_value = {
            "dailySleepDTO": {"sleepTimeSeconds": 25200, "sleepScores": {"overall": {"value": 80}}}
        }
        api.get_heart_rates.return_value = {"restingHeartRate": 51}
        api.get_training_readiness.return_value = [{"score": 75, "level": "GOOD"}]
        api.get_body_battery.return_value = [{"bodyBatteryValuesArray": [[0, 85], [1, 60]]}]
        api.get_activities_by_date.return_value = [
            {"activityType": {"typeKey": "running"}, "distance": 10000, "duration": 3600,
             "averageHR": 148, "maxHR": 170, "calories": 650, "averageSpeed": 2.78}
        ]
        return api

    def test_all_fields_populated(self):
        api = self._make_api()
        result = fetch_all(api, "2026-06-23", "2026-06-22")
        self.assertEqual(result["date"], "2026-06-23")
        self.assertEqual(result["hrv"]["value"], 50)
        self.assertAlmostEqual(result["sleep"]["hours"], 7.0)
        self.assertEqual(result["resting_hr"], 51)
        self.assertEqual(result["training_readiness"]["score"], 75)
        self.assertEqual(result["body_battery"]["high"], 85)
        self.assertEqual(result["yesterday_activity"]["type"], "running")

    def test_api_error_stored_per_field(self):
        api = self._make_api()
        api.get_hrv_data.side_effect = Exception("timeout")
        api.get_sleep_data.side_effect = Exception("403 forbidden")
        result = fetch_all(api, "2026-06-23", "2026-06-22")
        self.assertIn("error", result["hrv"])
        self.assertIn("timeout", result["hrv"]["error"])
        self.assertIn("error", result["sleep"])
        # Other fields unaffected
        self.assertEqual(result["resting_hr"], 51)

    def test_no_activity_yesterday(self):
        api = self._make_api()
        api.get_activities_by_date.return_value = []
        result = fetch_all(api, "2026-06-23", "2026-06-22")
        self.assertIsNone(result["yesterday_activity"])

    def test_api_calls_use_correct_dates(self):
        api = self._make_api()
        fetch_all(api, "2026-06-23", "2026-06-22")
        api.get_hrv_data.assert_called_once_with("2026-06-23")
        api.get_activities_by_date.assert_called_once_with("2026-06-22", "2026-06-22")

    def test_result_is_json_serializable(self):
        api = self._make_api()
        result = fetch_all(api, "2026-06-23", "2026-06-22")
        # Should not raise
        json.dumps(result)


if __name__ == "__main__":
    unittest.main()
