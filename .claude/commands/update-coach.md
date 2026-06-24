Follow these steps exactly, in order. Do not skip steps.

## Step 1 — Fetch today's Garmin data

Run the fetch script:
```
python3 scripts/fetch_garmin.py
```

The script reads `GARMIN_EMAIL` and `GARMIN_PASSWORD` from environment variables. If they are not set, ask the user to set them before continuing (e.g. `export GARMIN_EMAIL=... GARMIN_PASSWORD=...`).

The output also includes `history_path` — the local path where history is stored (from `COACH_HISTORY_PATH` env var, defaults to `~/.vibe-marathon/history.json`).

The script prints a JSON object to stdout. Parse it.

## Step 2 — Load rolling history

Read the history file at the path reported in `history_path` from Step 1. It is a JSON array of daily entries. Each entry has: `date`, `tss`, `distance_km`, `avg_hr`, `hrv`, `resting_hr`, `sleep_hours`, `sleep_score`.

If the file does not exist yet, create the directory and treat history as an empty array.

Compute from the array:
- **ATL** (Acute Training Load): exponential weighted average of `tss` over the last 7 days, time constant 7
- **CTL** (Chronic Training Load): exponential weighted average of `tss` over the last 42 days, time constant 42
- **TSB** = CTL − ATL

If history is empty, start ATL=0, CTL=0.

## Step 3 — Identify tomorrow's scheduled session

Read `../cocchialorenzo9.github.io/src/pages/marathon.jsx` (adjust path if repos are not siblings). Find the `WEEKS` array. Identify the entry whose `label` date range covers **tomorrow**'s date. Extract the sessions for tomorrow and the current `phase`.

If tomorrow falls outside all weeks (before week 1 or after race day), note that explicitly.

## Step 4 — Reason and generate the recommendation

Given:
- Today's HRV vs baseline (higher = more recovered)
- Resting HR trend
- Sleep score
- TSB (positive = rested; below -15 = caution; below -25 = swap to easy)
- CTL (current fitness level)
- Tomorrow's scheduled session

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

Append today's data as a new entry at the end of the history file at `history_path`:
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

## Step 6 — Commit and push

```bash
git add data/coach.json
git commit -m "chore: coach update $(date +%Y-%m-%d)"
git push
```

Note: the history file lives outside the repo at `history_path` and is never committed.

Then tell the user:
- Readiness score and the main reason behind it
- Tomorrow's recommendation
- Whether any plan adjustment was made and why
