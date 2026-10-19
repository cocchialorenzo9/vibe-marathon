"""
Tests for push_intervals.py's plan-to-Intervals.icu conversion.
Run with: python3 -m pytest scripts/ -v
"""

import json
import os
import re
import sys
import unittest

sys.path.insert(0, os.path.dirname(__file__))
from push_intervals import (
    DEFAULT_PLAN_PATH,
    build_event,
    plan_days,
    stale_external_ids,
)


def _day(date, workout, detail="30 min easy", title="Easy run"):
    return {"date": date, "training": {"type": "easy", "title": title, "detail": detail, "workout": workout}}


class TestBuildEvent(unittest.TestCase):
    def test_running_day_becomes_a_keyed_workout(self):
        event = build_event(_day("2026-10-20", "- 30m 60-85% LTHR"), 165)
        self.assertEqual(event["category"], "WORKOUT")
        self.assertEqual(event["type"], "Run")
        self.assertEqual(event["external_id"], "vibe-marathon:2026-10-20")
        self.assertEqual(event["start_date_local"], "2026-10-20T00:00:00")
        self.assertTrue(event["description"].endswith("- 30m 60-85% LTHR"))

    def test_lt_tokens_in_the_note_are_resolved(self):
        event = build_event(_day("2026-12-01", "- 7km 95-99% LTHR", detail="HR {LT:95%}-{LT:99%}"), 165)
        self.assertTrue(event["description"].startswith("HR 157-163"))

    def test_day_without_workout_is_skipped(self):
        self.assertIsNone(build_event(_day("2026-10-23", None), 165))


class TestPlanDays(unittest.TestCase):
    def test_window_is_start_inclusive_end_exclusive(self):
        plan = {"weeks": [{"days": [_day(d, None) for d in ("2026-10-19", "2026-10-20", "2026-10-21")]}]}
        self.assertEqual([d["date"] for d in plan_days(plan, "2026-10-20", "2026-10-21")], ["2026-10-20"])


class TestStaleExternalIds(unittest.TestCase):
    def test_only_our_events_that_the_plan_dropped(self):
        existing = [
            {"external_id": "vibe-marathon:2026-10-20"},
            {"external_id": "vibe-marathon:2026-10-21"},
            {"external_id": None},
            {"external_id": "someone-else:2026-10-21"},
        ]
        self.assertEqual(
            stale_external_ids(existing, {"vibe-marathon:2026-10-20"}),
            ["vibe-marathon:2026-10-21"],
        )


class TestRomePlanWorkouts(unittest.TestCase):
    """Every workout in the real plan must use only forms Intervals.icu parses."""

    STEP = re.compile(
        r"^- \d+(\.\d+)?(km|m|s|m\d+s)\b"  # duration or distance
        r"( \d+-\d+% LTHR| \d:\d{2}/km Pace| [a-z][a-z -]*?)?"  # target (never bpm) or cue
        r"( intensity=active)?$"
    )

    def test_steps_are_well_formed_and_running_days_have_one(self):
        with open(DEFAULT_PLAN_PATH) as f:
            plan = json.load(f)
        for week in plan["weeks"]:
            for day in week["days"]:
                training = day["training"]
                workout = training.get("workout")
                if training["type"] in ("rest", "swim", "race"):
                    self.assertIsNone(workout, day["date"])
                    continue
                self.assertTrue(workout, f"{day['date']} has no workout")
                for line in workout.splitlines():
                    if line.startswith("-"):
                        self.assertRegex(line, self.STEP, f"{day['date']}: {line}")
                self.assertNotIn("{LT", workout)


if __name__ == "__main__":
    unittest.main()
