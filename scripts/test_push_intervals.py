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


def _day(date, workout, title="Easy run", type_="easy"):
    return {"date": date, "training": {"type": type_, "title": title, "workout": workout}}


class TestBuildEvent(unittest.TestCase):
    def test_running_day_is_sent_as_written(self):
        workout = "- 30m 60-85% LTHR\n\nHard ceiling: walk a hill rather than cross it."
        event = build_event(_day("2026-10-20", workout))
        self.assertEqual(event["category"], "WORKOUT")
        self.assertEqual(event["type"], "Run")
        self.assertEqual(event["external_id"], "vibe-marathon:2026-10-20")
        self.assertEqual(event["start_date_local"], "2026-10-20T00:00:00")
        self.assertEqual(event["description"], workout)

    def test_day_without_steps_is_skipped(self):
        self.assertIsNone(build_event(_day("2026-10-23", "Full rest. Walking is fine.", type_="rest")))


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
    """The plan's workouts are its only session description: check every one."""

    STEP = re.compile(
        r"^- \d+(\.\d+)?(km|m|s|m\d+s)\b"  # duration or distance
        r"( \d+-\d+% LTHR| \d:\d{2}/km Pace| [a-z][a-z -]*?)?"  # target (never bpm) or cue
        r"( intensity=active)?$"
    )

    def test_running_days_have_well_formed_steps_and_others_have_none(self):
        with open(DEFAULT_PLAN_PATH) as f:
            plan = json.load(f)
        for week in plan["weeks"]:
            for day in week["days"]:
                training = day["training"]
                self.assertNotIn("detail", training, day["date"])
                workout = training["workout"]
                steps = [l for l in workout.splitlines() if l.startswith("- ")]
                if training["type"] in ("rest", "swim", "race"):
                    self.assertEqual(steps, [], day["date"])
                    continue
                self.assertTrue(steps, f"{day['date']} has no steps")
                for line in steps:
                    self.assertRegex(line, self.STEP, f"{day['date']}: {line}")
                self.assertNotRegex(workout, r"\d{3} ?bpm", f"{day['date']}: write HR as % LTHR")


if __name__ == "__main__":
    unittest.main()
