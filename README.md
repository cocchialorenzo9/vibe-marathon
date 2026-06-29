# vibe-marathon

AI-powered daily marathon coaching. Fetches biometric data from your smartwatch, computes training load (ATL/CTL/TSB), and generates a personalised next-day workout recommendation — written to `data/coach.json` and pushed to this repo each morning.

The live dashboard is at [cocchialorenzo9.github.io/projects/vibe-marathon](https://cocchialorenzo9.github.io/projects/vibe-marathon).

## How it works

1. **Fetch** — the fetch script pulls today's HRV, sleep, resting HR, and yesterday's activity from your watch.
2. **Analyse** — rolling history at `~/.vibe-marathon/history.json` is used to compute ATL (7-day), CTL (42-day), and TSB.
3. **Recommend** — the `/update-coach` skill reasons over readiness signals and the training plan, then writes a recommendation.
4. **Publish** — `data/coach.json` (today's snapshot) and `data/chart-data.json` are committed and pushed, making the dashboard update automatically.

## Setup

```bash
pip install -r requirements.txt
```

Optionally override the history path (default `~/.vibe-marathon/history.json`):

```bash
export COACH_HISTORY_PATH=/path/to/history.json
```

## Device support

Set `WATCH_SOURCE` to select your device (default: `amazfit`):

### Amazfit Trex 3 (primary)

```bash
python3 scripts/fetch_amazfit.py
```

Prompts for ~6 values from the Zepp app (Health tab → Sleep, HRV, Heart Rate; Exercise tab → yesterday's workout). Takes about 2 minutes. HRV baseline is computed automatically from local history once you have 3+ days of data.

### Garmin (legacy)

```bash
export WATCH_SOURCE=garmin
export GARMIN_EMAIL=your@email.com
export GARMIN_PASSWORD=yourpassword
```

### Switching devices mid-plan

Local history entries are device-agnostic — the same fields are stored regardless of source. Switching is safe; HRV baseline rebuilds from history over ~7 days.

## Daily update

Run the `/update-coach` skill in Claude Code — it handles fetching, reasoning, and committing in one step.

## Data files

| File | Description |
|---|---|
| `data/coach.json` | Today's readiness snapshot and recommendation |
| `data/history.json` | Growing daily history for dashboard charts |

The local history at `~/.vibe-marathon/history.json` includes `avg_hr` and is never committed.

## Tests

```bash
python3 -m pytest scripts/ -v
```
