# Pull recorded sessions from Intervals.icu, not Strava

**Status**: accepted (2026-11-10)

`sync-sessions` read activities through the Strava MCP, which needs a paid
Strava subscription. When that lapsed the nightly sync stopped. Intervals.icu
already receives every watch activity from Zepp (we push the plan there, see
0008), including swims that Strava never carried, and the agent proxy already
authenticates it.

`scripts/pull_intervals.py` now does the read: activities for the window, plus
1 km splits built from the time/distance/heartrate streams (Intervals.icu has
no per-km laps). Everything after that (status classification, HR cap, the
`sessions.json` shape) is unchanged. Days already written keep their
`stravaId`; new days carry `intervalsId`, and the Sessions page links to
whichever exists.

Known difference: splits are our own interpolation, so they can differ from
Strava's by a second or two. A first km with an implausibly low HR is a sensor
warm-up and is flagged with `hrNote`.
