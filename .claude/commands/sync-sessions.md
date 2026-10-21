Sync what actually happened, from Strava, into `data/sessions.json` (the site's Sessions page
and the Program calendar's "What happened" panels). Runs unattended every evening as a
scheduled task, so never ask questions: decide, write, push.

Follow these steps in order.

## Step 1 — Work out the window

- Read `data/training-plan-rome-2027.json` and `data/sessions.json`.
- Today = the local date in Europe/Rome (`TZ=Europe/Rome date +%F`).
- Window = every plan day from **7 days before today through today**, clamped to the plan's
  dates. Days before the plan starts are never written. Re-checking the last week catches late
  uploads and sessions moved across days.
- Days already in `sessions.json` *outside* the window are final: never touch them.

## Step 2 — Pull Strava

Use the Strava MCP tools (read-only):

1. `list_activities` with `range_start` = window start `T00:00:00`, `range_end` = today
   `T23:59:59`, ordering ascending.
2. For each activity in the window, `get_activity_performance` for average/max HR and `laps`.

If the Strava tools aren't available or fail, stop without writing anything and say why.

## Step 3 — Classify each plan day in the window

Plan day = `weeks[].days[]` entry. Run = Strava `sport_type` containing "Run". The plan's HR
cap is the upper bound of the first `60-N% LTHR` step in the day's `training.workout`,
converted to bpm against `data/athlete.json` (`60-79% LTHR` -> 79% of 165 = 130). Quality and
race days (`training.type` "tempo"/"race") have no cap.

Pick one `status` per day:

| status  | when |
|---------|------|
| `rest`  | Rest day (`training.type` "rest") and nothing recorded. |
| `done`  | The planned session was done that day, inside the HR cap (average and every full km lap ≤ cap; no cap → just done). |
| `over`  | The planned run was done that day, but the average or any full km lap went over the cap. |
| `moved` | Nothing that day, but the session was clearly done on a nearby day instead (±2 days, same kind, similar distance). Set `movedTo`. |
| `extra` | Something was recorded on a day that didn't plan it. If it's a moved session, set `movedFrom` (and `movedTo` on the other day). |
| `none`  | A session was planned, nothing was recorded, and it wasn't moved. |

Today: only write it once there's an activity, or the day is a rest day and it's after 21:00.
A planned day with no activity *today* is not `none` yet: leave it out.

Easy and recovery days are prescribed in km with a stop-by time: the workout step
`- 8km 60-85% LTHR` and the note "~45 min, stop by 55 min". The HR cap still decides `done` vs `over`. A run that ended short of the km
at about the stop-by time is `done` as planned, not a miss; say so in `summary`.

Swims and strength without the watch don't show up in Strava; mark those `none` and say in
`summary` that they can be added if done off-watch.

## Step 4 — Write each day

```json
{
  "date": "2026-10-17",
  "status": "over",
  "headline": "Recovery run, a little too quick",
  "summary": "One or two sentences for the calendar panel: what happened vs the plan.",
  "movedTo": "2026-10-16",
  "movedFrom": "2026-10-15",
  "activity": {
    "stravaId": "20623666498",
    "sport": "Run",
    "distanceKm": 4.37,
    "movingSec": 1500,
    "avgHr": 134,
    "maxHr": 141,
    "hrNote": "Only when a reading is clearly wrong (e.g. a sensor lock-on lap).",
    "laps": [{ "km": 1, "sec": 352, "hr": 130 }]
  },
  "learn": ["1–3 concrete things to carry forward, written to the athlete."]
}
```

- `movedTo`, `movedFrom`, `activity`, `hrNote`: omit when they don't apply.
- `activity` = the main activity that day (the one matching the plan). Mention any others in
  `summary`.
- `distanceKm`: 2 decimals. `laps`: Strava's laps, `km` = lap distance / 1000 (3 decimals for a
  partial last lap), `sec` = moving time, `hr` = rounded average HR.
- `headline`: short, plain, no exclamation marks. `learn`: specific to the numbers (paces,
  laps, cap), never generic advice. Use the project's language from `CONTEXT.md`: HR bands
  (<130, 130–140, 140–155, 155–LT, LT+) and LT, both from `data/athlete.json`, HR cap. The plan writes HR as `% LTHR`; convert it to rounded bpm against `data/athlete.json` before quoting or comparing. Don't use %max-HR zones.
- Keep `days` sorted by date, one entry per date. Set `syncedAt` to now (ISO 8601 with the
  Europe/Rome offset).

## Step 5 — Check and publish

```bash
cd web && npm ci && npm test && npm run typecheck && cd ..
```

If tests fail, fix the data (not the tests) and rerun. Then, only if `data/sessions.json`
changed:

```bash
git add data/sessions.json
git commit -m "chore: sync sessions $(TZ=Europe/Rome date +%F)"
git push origin HEAD:main
```

This is a data-only commit straight to `main`, like the coach update, so the Pages deploy runs
right away. Never commit anything else from this task.

## Step 5b — Push the coming days to the watch

```bash
python3 scripts/push_intervals.py --today "$(TZ=Europe/Rome date +%F)"
```

This sends the next 14 days of the plan's `training.workout`s to Intervals.icu, which syncs
them to the Zepp app and the watch. It always runs, even when `sessions.json` didn't change, so
plan edits reach the watch within a day. It writes nothing to the repo. If it fails (no
network, auth error), don't retry or work around it: carry on and say so in the report.

## Step 6 — Report

One short summary: days written or changed, and each one's status, plus the push result
(how many workouts were sent or removed, or why the push failed).
