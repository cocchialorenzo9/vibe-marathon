# Supersede the accepted-volume-gap guidance with a volume-escalation rule

**Status**: accepted (2026-07-29)

`update-coach.md`'s Sub-3h checkpoint reference previously instructed: don't
pad mileage reflexively if `volumeCheck.flagged` comes back true — the gap
between this plan's peak volume (~51-61km/week) and full sub-3h benchmarks
(89-113km/week) was an accepted tradeoff given a compressed build window and
a starting CTL of 15.2, not an oversight. A 2026-07-28 deep-research pass
(prompted by the athlete questioning why quality-focused work should be
enough) found that guidance underweighted the gap: across several
peer-reviewed sources (a 119,452-runner study, a 92-plan quantitative
analysis, a 997-runner RCT cohort), marathon time correlated strongly with
total training volume — specifically the easy/Z1 share of it — more than
with added intensity. One direct estimate put a ~59km/week plan (this plan's
own peak) at a predicted 3:36 finish, not sub-3h.

We're deliberately superseding the "don't pad mileage" guidance for weeks 7
onward with a **volume-escalation rule**: an ongoing `update-coach` mechanism
(Step 4f) that raises future weeks' prescribed volume incrementally, gated by
the existing CTL ramp-rate governance, rather than committing to a new fixed
mileage target today. Weeks 5-6 got a one-time static bump in the meantime,
since the escalation rule needs real data on how the athlete responds before
it can safely start adjusting anything.

## Considered and rejected

- **Lowering the sub-3h goal instead of raising volume** — rejected; the
  athlete chose to keep the goal fixed and treat volume as the only lever.
- **A single fixed rewrite of the whole remaining schedule now** — rejected;
  there's no training data yet on how this athlete responds to deliberately
  higher volume (three single-session overruns in the preceding ten days were
  the only signal available), so committing specific numbers for weeks 9-13
  today would repeat the exact "borrowed number, not governed by readiness"
  mistake the original 2026-07-18 checkpoint already warned against.
- **Adding volume only as longer individual sessions** — rejected in favor of
  a new weekly running day (the Sunday easy run); the same research found
  higher-volume marathon plans add volume mostly through more frequent
  running (6.8 runs/week vs. 4.1), not longer single sessions, and this
  athlete's existing pattern of overruns is already concentrated in single
  big sessions.
- **Holding quality-session volume flat while only easy volume grows** —
  rejected; the athlete specifically asked for quality volume to hold a fixed
  20% share of total volume (an 80/20 target), which means quality has to
  grow alongside easy volume rather than getting proportionally diluted.

## Consequences

- `training-plan.json` now carries `PROVISIONAL` placeholder days for weeks
  7, 9, 10, 11, 13's Sunday easy run — these get finalized one week at a time
  by Step 4f as each week approaches, not decided in advance.
- Recovery weeks (8, 12) and taper (14-15) are exempt from the escalation
  rule by design — see `CONTEXT.md` for the exact scope.
- If a later checkpoint (e.g. the existing week 9 review) finds ramp-rate
  headroom has been consistently near zero, the honest outcome is that the
  volume gap doesn't close much before race day — that's a real possibility
  this rule surfaces via `volumeCheck.projectedWeeklyKm`, not a failure of the
  rule itself.
