# Sync planned workouts to the watch through Intervals.icu

**Status**: accepted (2026-10-19)

The athlete wants each day's session on the Amazfit T-Rex 3 without typing it
into the Zepp app. Zepp has no public API for writing workouts, but it syncs
planned workouts from Intervals.icu (and TrainingPeaks): Intervals.icu pushes
the next 7 days whenever they change and a few times a day.

We push the plan to Intervals.icu with its REST API
(`scripts/push_intervals.py`), from the nightly `sync-sessions` task:

- **One event per running day**, `external_id = "vibe-marathon:<date>"`, sent
  with `events/bulk?upsert=true`, so re-running updates instead of
  duplicating. Events we created for a day that no longer has a workout are
  deleted with `events/bulk-delete`; events the athlete adds by hand are never
  touched. Window: today + 13 days.
- **Structured data in the plan, not prose parsing.** Each day carries
  `training.workout` in Intervals.icu workout syntax, written alongside
  `training.detail` (a one-off script generated them for the Rome plan).
  Parsing the prose on every push would break silently whenever a coach edit
  rephrased a session.
- **Every HR target as % LTHR, easy caps included.** Intervals.icu doesn't
  parse absolute bpm targets, so the plan follows it: the easy caps that were
  fixed bpm became percentages that give the same bpm at LT 165 (130 -> 79%,
  140 -> 85%, 145 -> 88%, 158 -> 96%), written `{LT:85%}` in the prose and
  `60-85% LTHR` in the workout (the 60% floor only keeps the watch from
  nagging about running too slowly). This supersedes ADR 0006's "easy caps
  stay plain bpm": now every cap moves with LT, and the plan's prose and the
  watch can never disagree. The script also sets Intervals.icu's Run LTHR to
  `data/athlete.json`'s when they differ, so % LTHR is the same bpm on the
  watch as in the plan.
- **Auth** comes from the cloud environment's network secret for
  `intervals.icu` (Basic auth, user `API_KEY`); `INTERVALS_API_KEY` works for
  local runs. The athlete id is in `data/athlete.json` (`intervalsIcu`).

## Considered and rejected

- **TrainingPeaks** — its API is partner-only, and syncing planned workouts
  needs Premium.
- **FIT files imported into Zepp by hand** — works for any watch, but isn't
  automatic; kept as the fallback if Zepp stops syncing from Intervals.icu.
- **Parsing `training.detail` at push time** — see above.

## Consequences

- Any change to a plan day's `detail` must update its `workout` too; the
  Python test `test_push_intervals.py` checks every workout uses only the step
  forms Intervals.icu parses.
- Long runs with "cap X, last N min cap Y" are split at an estimated km
  (~5:30/km), so the watch's total distance can differ slightly from the plan.
- Rest, swim and race days are not pushed.
