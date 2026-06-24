# vibe-marathon

AI-powered daily marathon coaching. Fetches biometric data from Garmin Connect, computes training load (ATL/CTL/TSB), and generates a personalised next-day workout recommendation — written to `data/coach.json` and pushed to this repo each morning.

The live dashboard is at [cocchialorenzo9.github.io/projects/vibe-marathon](https://cocchialorenzo9.github.io/projects/vibe-marathon).

## How it works

1. **Fetch** — `scripts/fetch_garmin.py` pulls today's HRV, sleep, resting HR, body battery, and yesterday's activity from Garmin Connect.
2. **Analyse** — rolling history at `~/.vibe-marathon/history.json` is used to compute ATL (7-day), CTL (42-day), and TSB.
3. **Recommend** — the `/update-coach` skill reasons over readiness signals and the training plan in the sibling `cocchialorenzo9.github.io` repo, then writes a recommendation.
4. **Publish** — `data/coach.json` (today's snapshot) and `data/history.json` (growing history) are committed and pushed, making the dashboard update automatically.

## Setup

```bash
pip install -r requirements.txt
export GARMIN_EMAIL=your@email.com
export GARMIN_PASSWORD=yourpassword
```

Optionally override the history path (default `~/.vibe-marathon/history.json`):

```bash
export COACH_HISTORY_PATH=/path/to/history.json
```

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
