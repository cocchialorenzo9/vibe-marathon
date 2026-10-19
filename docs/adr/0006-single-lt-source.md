# One source of truth for lactate threshold: `data/athlete.json`

**Status**: accepted (2026-10-19)

LT (lactate-threshold HR) anchors TSS, the top HR band, the %LT effort zones
and every threshold/MP heart-rate target in the plans. Until now the number
was copied into four Python constants, a web constant, band labels, plan prose
and the coaching commands, so the watch moving LT from 167 to 165bpm touched
a dozen files.

`data/athlete.json` now holds it (`lthr.bpm`, `source`, `asOf`), together with
the HR band cutoffs and the %LT effort-zone percentages:

- **Python** reads it through `scripts/athlete.py` (`LTHR`, `HR_BAND_CUTOFFS`);
  `ATHLETE_LTHR` still overrides it for a one-off run.
- **Web** reads it through `web/src/lib/athlete.ts` (`LT2`, band edges).
- **Plan text** writes LT-anchored heart rate as percentages of LTHR —
  `{LT:95%}`, `{LT:99.5%}`, `{LT:100%}` — which `romePlan` resolves (rounded
  bpm) on load. Percentages match how the effort zones are defined (%LT) and
  scale correctly when LT moves. The threshold range is 95-99% (159-165 at LT
  167, 157-163 at 165); the "ease off" trigger 99.5%, MP "settle" 97.5%.
  Easy caps (130/140/145) are plain bpm and stay so until the Nov 21 field
  test decides whether they should follow LT.
- **Coaching commands** (`update-coach`, `sync-sessions`) and `CONTEXT.md`
  point at the file instead of quoting a number.

A new LT is therefore: edit `data/athlete.json`, run
`python3 scripts/build_zone_history.py` (zone-history is derived data), done.

## Considered and rejected

- **Fixed bpm offsets from LT (`{LT-9}`)** — rejected; an offset is not
  physiologically proportional, so it drifts from the %LT zones as LT moves.
- **Rewriting history against the new LT** — rejected; journal entries,
  checkpoints and the Munich recap were judged against the LT of their day.

## Consequences

- Agents and humans reading raw Rome-plan JSON see `{LT:95%}` rather than a
  number and must resolve it against `data/athlete.json`.
- `data/zone-history.json` still needs a rebuild after an LT change; it is a
  derived file committed for the web app.
