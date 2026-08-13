# Allow in-place correction of same-day training-journal entries

**Status**: accepted (2026-08-13)

`data/training-journal.json` is documented (via the `update-coach` skill's
Step 4d) as permanent and append-only — "this file only grows," specifically
so a session's reflection is never lost or quietly rewritten by a later
re-read. On 2026-08-13, the athlete corrected the record on the same day it
was written: the 2026-08-12 long-run entry characterized a late HR spike
(148→173bpm across the final ~13 minutes) as passive cardiac drift
compounding on a night of short sleep and low HRV. The athlete clarified it
was actually a deliberate, recurring **fatigue-finish surge** (see
`CONTEXT.md`) — a self-directed pace push to sub-MP effort (4:00-4:20/km)
at the end of a long run, done specifically because the legs are tired, not
despite it.

We edited that entry in place rather than leaving the wrong analysis on the
record. Reasoning: the append-only rule protects against a *later* rewrite
of settled history, not a same-day correction offered by the athlete before
anything downstream had consumed the wrong text. `coach.json`'s own
`recentActivity` lesson/analysis fields for that date were fixed for the
same reason.

## Considered and rejected

- **Leaving the original entry untouched and only applying the corrected
  understanding going forward** — rejected. The athlete explicitly asked for
  the entry itself to be corrected, and nothing downstream had yet consumed
  the wrong version.
- **Appending a separate "correction" entry/note without touching the
  original** — rejected as unnecessary ceremony for a same-day fix; reserved
  instead for genuine after-the-fact corrections to already-settled history
  (see ADR 0004's approach to ADR 0001, which is exactly that pattern).

## Consequences

- The append-only rule now has a narrow, explicit exception: an entry
  written earlier the same day may be corrected in place if the athlete
  provides new facts before the entry has informed anything downstream. Once
  a day has passed, or the entry has already shaped some other output,
  a correction should follow ADR 0004's precedent instead — a new
  entry/ADR that supersedes, not an in-place edit.
- Past long-run entries showing a similar late HR spike (most notably
  2026-08-04) were **not** retroactively edited under this ADR — they're
  outside the same-day window. Any correction to those needs the athlete's
  confirmation first and, if made, should follow the append-and-supersede
  pattern, not an in-place edit.
