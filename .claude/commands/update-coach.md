Follow these steps exactly, in order. Do not skip steps.

## Step 1 — Fetch today's biometric data

Check the `WATCH_SOURCE` environment variable (default: `amazfit`).

- **`WATCH_SOURCE=amazfit`** (or unset): run `python3 scripts/fetch_amazfit.py`
  - If a Zepp export is present in `data/zepp/`, the script auto-fills sleep, resting HR,
    and yesterday's activity. It will also **backfill any missed days** from the export into
    local history before running — report any backfilled dates to the user.
  - Only HRV requires manual entry (it is not included in Zepp exports).
  - **After backfill, check for missing HRV**: scan the local history file for any entries
    dated **2026-06-29 or later** (when HRV tracking started) where `hrv` is `null`. If any
    exist, ask the user in a single batched question for those dates' values (e.g. "Missing
    HRV for Jun 30, Jul 1, Jul 2 — what were they?"). Write their answers back into the
    matching history entries (leave an entry `null` if they don't have it) before moving to
    Step 2, so this run's baseline and delta calculations use the corrected data.

- **`WATCH_SOURCE=garmin`**: run `python3 scripts/fetch_garmin.py`
  - Requires `GARMIN_EMAIL` and `GARMIN_PASSWORD`. If not set, ask the user to export them before continuing.

Both scripts print a canonical `BiometricReading` JSON object to stdout. Parse it. The `source` field confirms which device was used. The `history_path` field gives the local history file path.

**If the Zepp export is stale** (the script will warn you), tell the user:
"Your Zepp export is from {date}. If you trained since then, sync your watch, re-export from the Zepp app, and drop the new folder into `data/zepp/` before re-running."

## Step 2 — Load rolling history

Read the history file at the path reported in `history_path` from Step 1. It is a JSON array of daily entries. Each entry has: `date`, `tss`, `distance_km`, `avg_hr`, `hrv`, `resting_hr`, `sleep_hours`, `sleep_score`.

If the file does not exist yet, create the directory and treat history as an empty array.

Compute from the array:
- **ATL** (Acute Training Load): exponential weighted average of `tss` over the last 7 days, time constant 7
- **CTL** (Chronic Training Load): exponential weighted average of `tss` over the last 42 days, time constant 42
- **TSB** = CTL − ATL

If history is empty, start ATL=0, CTL=0.

## Step 3 — Identify tomorrow's scheduled session

Read `data/training-plan.json`. Find the entry in `weeks[].days[]` whose `date` field equals **tomorrow**'s date (YYYY-MM-DD format). Extract:
- The session's `training.type`, `training.title`, `training.detail`
- The parent week's `phase`

If tomorrow falls outside all weeks (before week 1 or after race day), note that explicitly.

## Step 4 — Reason and generate the recommendation

Given:
- Today's HRV vs baseline (`hrv.value` vs `hrv.baseline`). If `hrv.baseline` is null (first week on a new device), use the last available HRV value as a rough proxy or skip HRV delta reasoning and note "HRV baseline building up."
- Resting HR trend
- Sleep score (`sleep.score`)
- TSB (positive = rested; below -15 = caution; below -25 = swap to easy)
- CTL (current fitness level)
- Tomorrow's scheduled session
- `readiness.score` from the device (supplementary — use it as a cross-check against your own reasoning, not a replacement)
- `body_battery` may be null (Amazfit does not provide it) — skip this signal if null

Decide whether tomorrow should:
- **Proceed as planned** — readiness is good
- **Proceed with reduced intensity** — HRV 10–20% below baseline OR TSB below -15
- **Swap to easy/recovery** — HRV >20% below baseline OR TSB below -25 OR sleep score <60

Write a recommendation with:
- `type`: one of `easy`, `tempo`, `long`, `race`, `swim`, `rest`
- `title`: 5–8 words, direct
- `reasoning`: 2–4 sentences referencing specific numbers (e.g. "HRV is 13% below baseline", "TSB is -18")
- `sessionDetail`: actual workout instructions (copy/adapt from the plan)
- `bikeNote`: advice on the 14km/day commute bike given the session. **The bike
  is all-or-nothing** — if used, it goes both directions (to work AND home);
  never split bike one way and U-Bahn the other, the bike can't be in two
  places. If tomorrow is a Saturday or Sunday, there's no work commute at all
  — don't give office-commute advice; only address getting to/from a session
  if one is scheduled (e.g. a long run's start point).
- `swimNote`: advice on Wednesday pool session if applicable

Be direct. No padding. Reference actual numbers.

## Step 4b — Regenerate upcoming day recommendations

Read `data/training-plan.json`. For each day in `weeks[].days[]` whose `date` is between **tomorrow** and **14 days from today** (inclusive), regenerate these three fields:

- **`movement`**: The athlete always trains before work, so movement is about
  the round-trip work commute *after* that morning's session, never framed as
  "before/after" the session itself. **The bike is all-or-nothing: bike both
  ways, or U-Bahn/transit both ways — never split directions or chain a
  bike-out with a transit-back**, since a bike left at one end can't get
  ridden home from the other.

  **On Saturdays and Sundays there is no work commute** (check the day's
  `dayLabel` prefix) — skip office-commute framing entirely; only describe
  transport to/from a scheduled session itself (e.g. "no cycling before the
  long run" or "no commute today, it's the weekend").

  On weekdays, based on session type and today's readiness:
  - `swim`: "Bike both ways to the pool is fine" or "U-Bahn both ways — legs heavy from [TSB/yesterday]"
  - `easy`: "Bike both ways fine" unless TSB is very negative, then "U-Bahn both ways"
  - `tempo`/`long`: "Bike both ways" if legs are fresh, otherwise "U-Bahn both ways" to protect them — pick one, don't split
  - `race`: "No cycling today"
  - Rest days (weekday): "Easy bike both ways is fine"

- **`food`**: Based on the session type and phase:
  - Before long/tempo: high carb (pasta, rice, polenta). Reference the phase's nutrition strategy.
  - After hard session: protein + carbs within 30 min
  - Rest/easy days: normal balanced meals with phase-appropriate carb %
  - Peak/taper phase: mention specific carb-loading or gel strategies as relevant

- **`bigPicture`**: 2–3 sentences placing this day in the training arc:
  - Reference week number, phase, and where the athlete is in the plan
  - Reference TSB or readiness context where relevant (e.g. "after this week's fatigue" or "legs are fresh")
  - Give a forward-looking hook: what this session prepares for

Write these changes back into `data/training-plan.json`. Modify only the `movement`, `food`, and `bigPicture` fields of future days (date ≥ tomorrow). Leave past days and the training fields (`type`, `title`, `detail`) unchanged.

## Step 4c — Recent activity analysis

Skip this step if `WATCH_SOURCE=garmin` — multi-day per-session history isn't
available for Garmin yet (`fetch_garmin.py` only fetches yesterday's single
activity). Set `recentActivity` to `null` in Step 5 and mention to the user
that recent-activity detail was skipped.

Otherwise, run:

```bash
python3 scripts/recent_activity.py --days 7
```

This prints `since`/`today`/`days`/`sessions` — a flat list of **individual**
workouts across the last 7 days, newest first (one entry per run/swim/etc.,
not summed per day — a day with a swim class plus bike-commute legs shows the
swim only). **Bike-commute sessions are already excluded** by the script
(cycling in this plan is always the commute, never a training session) — if
`sessions` is missing an expected day, check whether it was cycling-only
before assuming something's wrong. Each session has: `date`, `type_name`
(e.g. `outdoor_running`, `swimming`), `distance_km`, `duration_min`, `avg_hr`,
`max_hr`, `calories`, `tss`, `avg_pace_min_km` — HR/pace fields may be `null`.
If `no_export` is `true`, set `recentActivity` to `null` and skip the rest of
this step.

For **each session**, write a one-sentence `lesson` — a specific, concrete
takeaway about that individual activity, not a generic comment. Reason using:
- **HR-zone compliance**: easy/Zone 2 target is ~60–75% of max HR
  (`ATHLETE_MAX_HR`, default 190) ≈ 114–142bpm. If a session that should have
  been easy (check `data/training-plan.json` for that date if it falls in a
  plan week, otherwise judge from pace/duration) shows `avg_hr` well above
  ~142bpm, say so plainly (e.g. "pace was on target but HR was tempo-effort,
  not easy — likely fatigue").
- Whether pace, duration, and effort line up with what the session looks like
  it was for.

Then write one `analysis` string (1–3 sentences) for the **overall window**:
volume/TSS trend (climbing/flat/dropping, and whether that matches the
current phase), plus any cross-session pattern or anomaly (e.g. a stretch of
several days with no sessions, or more than one session running hot). This is
the macro view; `lesson` is the per-activity view — don't repeat the same
point in both.

This is a judgment call, not a formula — reason about it the way Step 4's
`reasoning` field already gets reasoned about, not via a hardcoded script.

## Step 4d — Update the permanent training journal

Skip this step if `WATCH_SOURCE=garmin`, same reason as Step 4c.

`data/training-journal.json` is a **permanent, append-only archive** — unlike
`recentActivity` above (a rolling 7-day snapshot that gets overwritten every
run), this file accumulates one entry per real training day for the life of
the whole plan and is never edited or pruned by later runs. It exists so a
session's coaching reflection is never lost just because a few days passed,
and so it survives gaps in when `/update-coach` actually gets run.

1. Read `data/training-journal.json` (create as `[]` if missing).
2. Find the backfill range: the day after the journal's last entry, through
   **today** (inclusive). If the journal is empty, start from the earliest
   date present in local history (from Step 2) instead of just the last
   week — a from-scratch run should capture everything available, not only
   recent days.
3. Run `python3 scripts/recent_activity.py --since <range-start>` to get
   per-session detail across the whole range (however long — this may cover
   weeks if the journal hasn't been updated in a while).
4. **Cross-reference against local history** (already loaded in Step 2) for
   every date in the range: if a date has no non-cycling session in the
   script's output but its `distance_km`/`tss` clears **distance_km ≥ 1.5 or
   tss ≥ 5**, archive it anyway using history's own numbers, with
   `duration_min`/`avg_hr`/`max_hr` set to `null` and `type` noted as
   auto-detected (e.g. `"auto-detected running"`) — the watch's step counter
   picked up real activity even though no formal workout was started. If a
   date is below that threshold and has no session, skip it entirely — it's
   either a pure bike-commute day or genuinely negligible movement, not a
   training day worth reflecting on.
5. For each new entry, use this schema:

```json
{
  "date": "<YYYY-MM-DD>",
  "type": "<best-known label>",
  "scheduled": "<training-plan.json's scheduled training.type, or null>",
  "distance_km": <float>,
  "duration_min": <float or null>,
  "avg_hr": <int or null>,
  "max_hr": <int or null>,
  "tss": <float>,
  "avg_pace_min_km": <float or null>,
  "wentWell": "<specific>",
  "wentWrong": "<specific, well-explained>",
  "nextTime": "<concrete action, with reasoning>"
}
```

   - `type`: the best-known label for what actually happened (use
     `type_name` from the script when a real session exists; for
     unmapped/generic Zepp type codes, infer the likely activity from
     context — duration, distance, HR, and whether it falls in a plan swim
     week — rather than printing the raw unhelpful code)
   - `scheduled`: `data/training-plan.json`'s scheduled `training.type` for
     that date if it falls in a plan week, else `null`
   - `distance_km`/`duration_min`/`avg_hr`/`max_hr`/`avg_pace_min_km`/`tss`:
     when a real non-cycling session exists, use that session's own facts
     from the script (never the bike-commute-inclusive day total). One
     exception: if the session's own `distance_km` is 0 due to a GPS
     dropout but local history shows a real distance for that day (an
     activity-fallback override, same logic already used elsewhere in this
     pipeline), use history's corrected distance instead of the raw 0.
   - `wentWell`, `wentWrong`, `nextTime`: a genuine, specific reflection —
     compare against the scheduled session's intent when there is one, use
     the ~114–142bpm easy-HR-zone reference from Step 4c for effort
     compliance, and reference TSB/fatigue context from local history where
     it's relevant. `wentWrong` should be honestly explained, not padded —
     "nothing notable, executed as intended" is a fine answer when it's true
     and you say why you think so; don't invent a problem to fill the field.
     This is judgment, same as Step 4c's `lesson`, just one level deeper per
     entry.
6. Append the new entries (sorted by date) to the array and write the file
   back. Never modify or remove existing entries — this file only grows.

## Step 5 — Write the output files

Write `data/coach.json` with this exact schema. `recentActivity` is `null`
when Step 4c was skipped (Garmin source, or no Zepp export found). Bike-commute
sessions are never included in it.

```json
{
  "date": "<today's date YYYY-MM-DD>",
  "generatedFor": "<tomorrow's date YYYY-MM-DD>",
  "readiness": {
    "score": <0-100 computed from HRV delta + sleep score + TSB>,
    "hrv": { "value": <int>, "baseline": <int>, "delta_pct": <int> },
    "restingHR": { "value": <int>, "trend": "normal|elevated|low" },
    "sleep": { "hours": <float>, "score": <int 0-100> },
    "tsb": <float>,
    "ctl": <float>,
    "atl": <float>
  },
  "recommendation": {
    "type": "<easy|tempo|long|race|swim|rest>",
    "title": "<short title>",
    "reasoning": "<2-4 sentences with numbers>",
    "sessionDetail": "<workout instructions>",
    "bikeNote": "<bike commute advice>",
    "swimNote": "<swim advice or empty string>"
  },
  "phase": "<base|build|peak|taper>",
  "daysToRace": <int>,
  "recentActivity": {
    "since": "<YYYY-MM-DD, start of the 7-day window>",
    "sessions": [
      {
        "date": "<YYYY-MM-DD>",
        "type": "<type_name, e.g. outdoor_running>",
        "distance_km": <float>,
        "duration_min": <float>,
        "avg_hr": <int or null>,
        "max_hr": <int or null>,
        "avg_pace_min_km": <float or null>,
        "tss": <float>,
        "lesson": "<one-sentence takeaway from this specific activity>"
      }
    ],
    "analysis": "<1-3 sentences: overall volume/TSS trend and any cross-session pattern>"
  }
}
```

Append today's data as a new entry at the end of the **local** history file at `history_path`:
```json
{
  "date": "<today YYYY-MM-DD>",
  "tss": <computed: roughly duration_min/60 * (avg_hr/max_hr)^2 * 100>,
  "distance_km": <float>,
  "avg_hr": <int or null>,
  "hrv": <int>,
  "resting_hr": <int>,
  "sleep_hours": <float>,
  "sleep_score": <int>
}
```

Create the directory for the history file if it does not exist.

Also update **`data/chart-data.json`** in this repo (the public dashboard file — no biometrics).

**Don't just append today — backfill any gap.** Read the current array and find its last `date`. If any dates in the local history file (from Step 2) fall strictly between that last date and today, `data/chart-data.json` is missing days (this happens whenever `/update-coach` doesn't run every single day, or a Zepp backfill fills in days retroactively — see Step 1). For **every** such missing date, and finally for today, append one entry:

```json
{
  "date": "<YYYY-MM-DD>",
  "tss": <float>,
  "distance_km": <float>,
  "ctl": <float>,
  "atl": <float>,
  "tsb": <float>,
  "readiness_score": <int>,
  "recommendation_type": "<easy|tempo|long|race|swim|rest>"
}
```

- `ctl`/`atl`/`tsb` for a backfilled date: replay the ATL/CTL EWMA (Step 2's formula) forward through the full local history up to and including that date — don't just reuse today's values for every gap day, the chart needs the real day-by-day trajectory.
- `readiness_score` for a backfilled date: recompute with that date's own HRV/sleep/resting-HR against the baseline as it stood *using only entries before that date* (avoid leaking later data into an earlier day's score).
- `recommendation_type` for a backfilled date: use `data/training-plan.json`'s scheduled `training.type` for that date if the date falls within a plan week (e.g. a swim-class day must show `"swim"`, not a generic fallback derived from unrelated tracked activity like a bike commute). If the date is outside the plan entirely (pre-training), fall back to `"rest"` when that day's `tss` is 0, else `"easy"`.

If an entry for today's date already exists (e.g. from a same-day re-run), replace it rather than duplicating.

Fields deliberately omitted from `data/chart-data.json`: `hrv`, `resting_hr`, `sleep_hours`, `sleep_score`, `avg_hr`. These remain only in the local history file.

## Step 6 — Commit and push

```bash
git add data/coach.json data/chart-data.json data/training-plan.json data/training-journal.json
git commit -m "chore: coach update $(date +%Y-%m-%d)"
git push
```

Note: the local history file lives outside the repo at `history_path` and is never committed. `data/history.json` is in `.gitignore`.

Then tell the user:
- Readiness score and the main reason behind it
- Tomorrow's recommendation
- Whether any plan adjustment was made and why
- A brief summary of what changed in the next 14 days' recommendations
