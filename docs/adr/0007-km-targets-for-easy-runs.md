# Easy runs are set in km; HR guides them; time is an estimate

**Status**: accepted (2026-10-21)

The Rome plan measured volume in km (weekly totals, the 88-110 km peak, the
>30% jump guard) but wrote its 59 easy and recovery runs in minutes ("45 min
easy, HR cap 140"), with the km back-computed from an assumed pace that
varied from 5:00 to 6:15/km. The athlete ran the minutes, not the km, so a
slow day (post-marathon legs, heat, a hill under a strict cap) quietly took
km off the week: Oct 18's 30 min recovery run was planned as 5.0 km and came
in at 4.84. Long, medium-long and most tempo runs were already in km.

From Oct 21 onward, easy and recovery runs read
`8 km easy (~45 min, stop by 55), HR cap 140 bpm`:

- **km is the target.** `estKm` and every weekly total are unchanged.
- **The HR cap guides the effort** and still decides `done` vs `over`.
- **Time is an estimate** at recent pace for that cap: ~5:40/km at 140
  (late-block runs at 130-140 bpm ran 5:20-5:40, post-Munich ~5:50) and
  ~6:10/km at 130 (runs under 130 bpm, 6:00-6:15), +3 min for strides,
  +6 min for hill sprints. `estMin.run` and `estHours` follow.
- **Stop-by time** = estimate × 1.15, rounded up to 5 min. If the cap holds
  the athlete slow enough to reach it first, the run ends there and the km
  stay short. That counts as done.

Days before Oct 21 keep the prescription they were run against.

## Considered and rejected

- **Pure km + HR cap, no time limit.** On a bad day, holding the cap makes
  the run longer, adding time on feet exactly when recovery is worst. Time
  prescriptions handle this automatically; the stop-by time keeps that.
- **Keep minutes, fix the pace assumptions.** Still leaves the athlete
  running a different number from the one the plan counts.
- **Re-deriving km from a single new pace.** Would have changed every weekly
  total; the volume progression was designed in km and is kept.

## Consequences

- As easy pace improves, the same km take less time: `update-coach` Step 4e
  refreshes the estimate and stop-by time in future weeks, never the km.
- `sync-sessions` treats a run that stopped short at about the stop-by time
  as done.
- The site shows km as the day's value and minutes as `~N′`, an estimate.

**Update (2026-10-21)**: ADR 0008 moved the session text into each day's
`training.workout`; the km is now the workout step (`- 8km 60-85% LTHR`) and
the estimate and stop-by time a note ("~45 min, stop by 55 min").
