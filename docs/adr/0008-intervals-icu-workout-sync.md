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
- **The workout is the plan.** Each day's `training.workout`, in
  Intervals.icu workout syntax, is the only description of the session: step
  lines first, then the coaching notes as plain paragraphs (Intervals.icu
  keeps text after the last step as text, even with "3x10" or "85% LTHR" in
  it). It replaced `training.detail` (one-off scripts generated the steps
  and moved the prose into notes, minus the clause the steps already say).
  The site renders it for reading (`web/src/lib/workout.ts`, HR shown in
  bpm); the script sends it unchanged. One field means a change to the plan
  is a change to what the watch gets — they cannot drift apart, and nothing
  parses prose.
- **Every HR target as % LTHR, easy caps included.** Intervals.icu doesn't
  parse absolute bpm targets, so the plan follows it: the easy caps that were
  fixed bpm became percentages that give the same bpm at LT 165 (130 -> 79%,
  140 -> 85%, 145 -> 88%, 158 -> 96%), e.g. `60-85% LTHR` (the 60% floor
  only keeps the watch from nagging about running too slowly). Notes use the
  same notation ("if HR passes 99.5% LTHR"). This supersedes ADR 0006's
  "easy caps stay plain bpm" and its `{LT:n%}` tokens: one notation, and every
  cap moves with LT. The script also sets Intervals.icu's Run LTHR to
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
- **Parsing the prose at push time** — breaks silently whenever an edit
  rephrases a session.
- **Keeping prose and steps side by side** — two descriptions of one session
  drift apart.

## Consequences

- Editing a session means editing its `workout`. `test_push_intervals.py`
  checks every workout uses only step forms Intervals.icu parses and never
  bpm; the web tests check the site shows no raw `% LTHR`.
- The site's HR cap for a day is its first `60-N% LTHR` step; quality and race
  days have none (the hill-sprint day lost the 140 cap its prose implied).
- Long runs with "cap X, last N min cap Y" are split at an estimated km
  (~5:30/km), so the watch's total distance can differ slightly from the plan.
- Rest, swim and race days are not pushed.
