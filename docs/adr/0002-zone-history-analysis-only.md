# Add a Seiler-zone history as an analysis-only layer, separate from prescription

**Status**: accepted (2026-07-31)

The athlete asked to visualize historical HR zone distribution and use %LT as
the discriminating number. Cross-referencing actual training-journal data
against training-science literature (Seiler & Kjerland 2006; Seiler 2010; a
2025 Frontiers TID review) surfaced two things: this project's existing
%LT-of-LT2 prescription bands (Recovery/Easy-Aerobic/Threshold) don't map onto
the literature's own LT1/LT2-anchored three-zone model, and the athlete's
actual easy/recovery/long-run HR (~150bpm) lands mostly in the literature's
"Zone 2" — the zone research associates with worse marathon/Ironman outcomes
when it dominates volume.

We're introducing the Seiler zone model (Zone 1/2/3, anchored on LT1≈125bpm
provisional / LT2=167bpm device-reported) as a **new, separate classification
used only to analyze actual recorded HR data** (`data/zone-history.json`, a
new file, not a rewrite of `data/chart-data.json`). It does not replace or
touch the existing prescription bands that convert easy/recovery/long *targets*
into HR guidance in `training-plan.json` and `update-coach.md`.

## Considered and rejected

- **Replacing the prescription bands project-wide with Seiler zones** —
  rejected for now; would require rewriting 18 already-edited
  `training-plan.json` entries and `update-coach.md`'s zone reference on the
  same session that surfaced the idea, with no data yet on how well the new
  scale prescribes (as opposed to analyzes). Revisit once the zone-history
  data itself has been observed for a while.
- **Extending `chart-data.json` with new zone fields instead of a new file** —
  rejected; zone-history is running-session-specific (derived from `hr_curve`,
  which not all activity types have), not a general daily aggregate like the
  rest of `chart-data.json`'s fields.
- **Waiting for a real LT1 field test before building anything** — rejected;
  the athlete wants the chart now. Using the ~75%-of-LT2 literature heuristic
  as a flagged-provisional LT1, the same treatment already given to LT2 itself
  before its own field test.

## Consequences

- Two independent %LT scales now coexist in this project: the prescription
  bands (still LTHR-only, unaffected) and the analysis-only Seiler zones (see
  `CONTEXT.md`). A reader must not conflate "Zone 2" with "Easy-Aerobic" — they
  overlap but aren't the same boundaries.
- `zone-history.json` will under-cover history: it can only be computed for
  dates where a running session has a populated `hr_curve` in
  `training-journal.json`, which doesn't exist before 2026-07-16.
- LT1 (125bpm) is a heuristic, not a measurement. If a real LT1 test later
  gives a different number, `zone-history.json` and the dashboard chart both
  need recomputing — same follow-up debt already tracked for LT2's Aug 4 test.
