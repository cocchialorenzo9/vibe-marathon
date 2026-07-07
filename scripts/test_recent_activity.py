"""
Tests for recent_activity.py's pure date-range logic.
Run with: python3 -m pytest scripts/ -v
"""

import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(__file__))
from recent_activity import resolve_range


class TestResolveRange(unittest.TestCase):
    def test_days_only_computes_since(self):
        since, days = resolve_range("2026-07-07", 7)
        self.assertEqual(since, "2026-07-01")
        self.assertEqual(days, 7)

    def test_since_overrides_days(self):
        since, days = resolve_range("2026-07-07", 7, since="2026-06-26")
        self.assertEqual(since, "2026-06-26")
        self.assertEqual(days, 12)

    def test_since_equal_to_today_is_one_day(self):
        since, days = resolve_range("2026-07-07", 7, since="2026-07-07")
        self.assertEqual(since, "2026-07-07")
        self.assertEqual(days, 1)


if __name__ == "__main__":
    unittest.main()
