# Replace the Seiler Zone 1/2/3 model with fixed HR bands

**Status**: accepted (2026-07-31)

ADR 0002 introduced the Seiler Zone 1/2/3 model (anchored on LT1≈125bpm
provisional / LT2=167bpm device-reported) as an analysis-only classification
of recorded HR data. In practice, almost every run's minutes landed in Zone 2
(LT1 to LT2 is a wide, 42bpm-tall band), which flattened the "which zone was
this run mostly in" signal the athlete actually wanted for a pace comparison
— and LT1 itself was never measured, only estimated at 75% of LT2.

We're replacing it with 5 fixed bpm bands the athlete chose directly: <130,
130-140, 140-155, 155-167, 167+. These don't derive from LT1 at all (only the
top edge is pinned to LT2, since 167+ bpm is definitionally at/above
threshold) — they're plain round numbers, removing LT1's unmeasured-estimate
uncertainty from this classification entirely. `%LT` is still shown for
context, but no longer defines the band boundaries.

## Considered and rejected

- **Keep computing both models side by side** — rejected; nothing in this
  project would consume the Seiler zone fields anymore (the athlete uses the
  band-based pace comparison instead), so keeping them was dead computation.
- **Re-estimate LT1 more precisely instead of abandoning it** — rejected;
  the actual problem (Zone 2 being too wide to be a useful discriminator) isn't
  primarily an LT1-precision problem, and there's still no real LT1 field
  test to base a better estimate on.

## Consequences

- `data/zone-history.json` entries changed shape: `zone1_min`/`zone2_min`/
  `zone3_min`/`dominant_zone` are gone, replaced by `band1_min`...`band5_min`/
  `avg_band` (the band containing the run's average HR, not the band with
  the most minutes — that mode-based field, briefly called `dominant_band`,
  was replaced before anything consumed it). Any code or dashboard reading
  the old fields needs updating (done in this same change).
- The file and script names (`zone-history.json`, `build_zone_history.py`)
  are unchanged for continuity, even though the domain vocabulary moved from
  "zone" to "band" — see `CONTEXT.md`'s "Zone history" entry.
- If LT2 changes (Aug 4 field test or later), band 5's boundary moves with it
  automatically (it's `>=lt2`, not a hardcoded 167); bands 1-4's cutoffs
  (130/140/155) do not move — they're independent round numbers, not %LT-derived.
