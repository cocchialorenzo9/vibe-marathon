# vibe-marathon

AI-powered daily marathon coaching. Fetches biometric data from your smartwatch, computes training load (ATL/CTL/TSB), and generates a personalised next-day workout recommendation — written to `data/coach.json` and pushed to this repo each morning.

The site is at [cocchialorenzo9.github.io/vibe-marathon](https://cocchialorenzo9.github.io/vibe-marathon/): today's session and the Rome 2027 plan, plus the Season 01 (Munich 2026) race recap and archive. Its source is in [`web/`](web/).

## How it works

1. **Fetch** — the fetch script pulls today's HRV, sleep, resting HR, and yesterday's activity from your watch.
2. **Analyse** — rolling history at `~/.vibe-marathon/history.json` is used to compute ATL (7-day), CTL (42-day), and TSB.
3. **Recommend** — the `/update-coach` skill reasons over readiness signals and the training plan, then writes a recommendation.
4. **Publish** — `data/coach.json` (today's snapshot) and `data/chart-data.json` are committed and pushed, making the dashboard update automatically.

## Web app (`web/`)

Vite + React 18 + TypeScript, deployed to GitHub Pages by `.github/workflows/deploy.yml` on every push to `main` that touches `web/` or `data/`, so a coach data push redeploys the site.

```bash
cd web
npm install
npm run dev        # http://localhost:5173/vibe-marathon/
npm run typecheck
npm test
npm run build      # into web/dist
```

The app imports data through the `@data` alias. In the build it points at `data/`; under `npm test` it points at a frozen copy in `web/src/test/fixtures/`, so the nightly data pushes never break tests. Only `web/src/lib/data.test.ts` reads the real `data/` files, and it checks rules that hold on any day (each date once, moved sessions linked both ways, no unresolved `{LT}` tokens). To test against newer data, copy the file into the fixtures and update the tests that depend on it.

- `#/` — Season 02: today, tomorrow, this week, the 22-week plan and checkpoints, read at build time from `data/training-plan-rome-2027.json`. `#/?date=2026-11-21` previews another day.
- `#/sessions` — the session log: every past plan day next to what Strava recorded (planned vs done, HR per km against the cap, HR bands, what to carry forward), from `data/sessions.json`. The Program calendar shows the same status on past days. `#/sessions?day=2026-10-17` opens one day.
- `#/munich-2026` — Season 01 race recap (figures in `web/src/data/munich2026.ts`).
- `#/munich-2026/{dashboard,race-plan,journal,plan}` — the original Munich pages, moved from the personal site; they still fetch `data/*.json` from raw GitHub (the race plan honours `?ref=<branch>`).

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
| `data/sessions.json` | What actually happened on each past Season 02 plan day, synced nightly from Strava by the `/sync-sessions` scheduled task |
| `data/history.json` | Growing daily history for dashboard charts |

The local history at `~/.vibe-marathon/history.json` includes `avg_hr` and is never committed.

## Tests

```bash
python3 -m pytest scripts/ -v
```
