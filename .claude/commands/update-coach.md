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
- `bikeNote`: advice on the 14km/day commute bike given the session
- `swimNote`: advice on Wednesday pool session if applicable

Be direct. No padding. Reference actual numbers.

## Step 4b — Regenerate upcoming day recommendations

Read `data/training-plan.json`. For each day in `weeks[].days[]` whose `date` is between **tomorrow** and **14 days from today** (inclusive), regenerate these three fields:

- **`movement`**: Based on the session type and today's readiness:
  - `swim`: "Bike to pool is fine" or "U-Bahn — legs heavy from [TSB/yesterday]"
  - `easy`: "Bike both ways fine" unless TSB is very negative
  - `tempo`/`long`: "U-Bahn to work" before hard sessions, "easy bike home" or U-Bahn after
  - `race`: "No cycling today"
  - Rest days: "Easy bike both ways is fine"

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

## Step 5 — Write the output files

Write `data/coach.json` with this exact schema:

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
  "daysToRace": <int>
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

Also append today's sanitized entry to **`data/chart-data.json`** in this repo (the public dashboard file — no biometrics). Read the current array, replace any existing entry with today's date, then append:
```json
{
  "date": "<today YYYY-MM-DD>",
  "tss": <float>,
  "distance_km": <float>,
  "ctl": <float>,
  "atl": <float>,
  "tsb": <float>,
  "readiness_score": <int>,
  "recommendation_type": "<easy|tempo|long|race|swim|rest>"
}
```

Fields deliberately omitted from `data/chart-data.json`: `hrv`, `resting_hr`, `sleep_hours`, `sleep_score`, `avg_hr`. These remain only in the local history file.

## Step 6 — Commit and push

```bash
git add data/coach.json data/chart-data.json data/training-plan.json
git commit -m "chore: coach update $(date +%Y-%m-%d)"
git push
```

Note: the local history file lives outside the repo at `history_path` and is never committed. `data/history.json` is in `.gitignore`.

Then tell the user:
- Readiness score and the main reason behind it
- Tomorrow's recommendation
- Whether any plan adjustment was made and why
- A brief summary of what changed in the next 14 days' recommendations
