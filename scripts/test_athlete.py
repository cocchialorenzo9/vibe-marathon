"""
Tests for athlete.py, the loader for data/athlete.json (the single LT source).
Run with: python3 -m pytest scripts/ -v
"""

import importlib
import json
import os
import sys
import unittest
from unittest import mock

sys.path.insert(0, os.path.dirname(__file__))
import athlete


class TestAthlete(unittest.TestCase):
    def test_lthr_comes_from_athlete_json(self):
        with open(athlete.ATHLETE_PATH) as f:
            data = json.load(f)
        with mock.patch.dict(os.environ, {}, clear=False):
            os.environ.pop("ATHLETE_LTHR", None)
            reloaded = importlib.reload(athlete)
        self.assertEqual(reloaded.LTHR, data["lthr"]["bpm"])
        self.assertEqual(reloaded.HR_BAND_CUTOFFS, tuple(data["hrBandCutoffs"]))

    def test_env_var_overrides_lthr(self):
        with mock.patch.dict(os.environ, {"ATHLETE_LTHR": "170"}):
            self.assertEqual(importlib.reload(athlete).LTHR, 170)
        importlib.reload(athlete)

    def test_band_cutoffs_sit_below_lthr(self):
        self.assertLess(max(athlete.HR_BAND_CUTOFFS), athlete.LTHR)


if __name__ == "__main__":
    unittest.main()
