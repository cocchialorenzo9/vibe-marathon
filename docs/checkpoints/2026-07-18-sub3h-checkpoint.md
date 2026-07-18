# Sub-3h checkpoint — 2026-07-18

Week 3 of 15, base phase. 85 days out from Munich Marathon (Oct 11 2026, goal
4:16/km). A deep-research pass (6 search angles, 28 sources fetched, 111 claims
extracted, 25 adversarially verified) fit published sub-3h methodology against
this athlete's own data.

**Snapshot at generation time** (`data/coach.json`, 2026-07-16): VO2max 54
ml/kg/min (device), LT 167bpm (device-reported, unconfirmed), CTL 15.2 / ATL
34.4 / TSB -19.2, HRV 65ms vs 78ms baseline (-17%), sleep score 80 (7.7h).

## Where you actually stand

**VO2max 54 doesn't settle the question.** [High confidence] VDOT (the
standard training-pace metric) is explicitly a composite of VO2max *and*
running economy — two runners with identical VO2max can have meaningfully
different achievable marathon paces because economy (oxygen cost at a given
speed) is documented as a better predictor of performance than VO2max alone.
Sources: [brenoamelo.com/calculators/vdot](https://www.brenoamelo.com/calculators/vdot),
[PMC8924290](https://pmc.ncbi.nlm.nih.gov/articles/PMC8924290/) — corroborated
by fellrnr.com, Run Regimen, and Conley & Krahenbuhl (1980), which found
economy alone explained 65% of performance variance in a VO2max-homogeneous
group.

**What we could not confirm.** Several specific numbers circulating online did
not survive adversarial verification and should be treated skeptically: a
claimed "VO2max 63 minimum for 4:16/km," a "VO2max explains 59% of marathon
performance" statistic, a VDOT-51 → 3:23 worked example, and a claimed 20-30
sec/mile LT-to-goal-pace offset. All single-blog-sourced, none independently
corroborated. Nobody's calculator can reliably tell you whether 54 is "enough"
from VO2max alone — the number that matters is the field-tested LT and
whether the legs can hold goal pace for 3 hours.

**Directional note** [single source, not independently verified]: lactate
threshold correlates far more strongly with distance-race finishing time than
VO2max alone (r=0.91 vs r=0.63) per
[sportcoaching.com.au](https://sportcoaching.com.au/lactate-threshold-running-guide/).
If that holds, the device LT (167bpm, unconfirmed) is a more load-bearing
number than VO2max — reason enough to get it field-tested rather than trust
the watch estimate.

## The gap vs. published sub-3h structures

| Plan | Peak weekly volume | Peak long run | Quality/wk | Weeks |
|---|---|---|---|---|
| This plan (at checkpoint time) | not tracked in km/wk | 22-23 km | 1 | 15 |
| Pfitzinger 18/55 | ~89 km | ~32 km | 2 | 18 |
| Pfitzinger 18/70 | ~113 km | ~35 km | 2 | 18 |
| Pfitzinger 12/70 (compressed) | ~113 km | ~34 km (wk 7) | 2 | 12 |

[High confidence, corroborated across runbryanrun.com, runningwithrock.com,
mycalcbuddy.com, buenavida.run] — the plan's structure sat well below
established sub-3h-caliber tiers at checkpoint time.

## Restructuring recommendations (as proposed)

- **Govern volume by ramp rate, not a borrowed mileage target.** Friel/
  TrainingPeaks-sourced guidance puts a sustainable CTL ramp at ~5-8 points/
  week, 3-5/week as the conservative real-world figure [directional]. Given
  suppressed HRV and ATL already 2.3× CTL, treat 3-5/week as the ceiling until
  HRV and TSB both trend back toward baseline.
- **Extend the long-run runway, don't accept 22-23km as the ceiling** — real
  specificity risk for a 42km race, but only once readiness actually supports
  it (see Key judgment call below).
- **Keep one quality session/week through base, add a second only once
  volume supports it** — standard practice is 1/week, 2/week for advanced
  runners [directional, marathonhandbook.com]. LT-pace "cruise intervals"
  target the LT-vs-VO2max correlation finding directly.
- **Don't lean on the bike commute or swim to replace running volume.**
  [High confidence, medium evidence quality] A small, underpowered
  meta-analysis found no statistically significant VO2max difference between
  cycling-only and running-only training; a separate, older review found
  swimming produces the weakest VO2max transfer of the three modalities.
  Directionally useful, not strong enough to substitute for run mileage.

## LT field test protocol (Aug 4)

Standard Friel 30-minute test
([joefrieltraining.com](https://joefrieltraining.com/the-30-minute-test-is-easy-really/)):
10-15min warm-up → 30min solo all-out sustainable effort → average HR over
the **last 20 minutes** = estimated LTHR. Recompute zones in `coach.json` from
the new number; `training-plan.json` day entries use %LT, not bpm, so they
never need re-editing. Worth a second test around week 10-11 (peak phase) —
LT typically shifts over 8-10 weeks of specific training.

## Autoregulation rules

**The two-branch HRV rule** [high confidence, PMC7432021, PMC7663087]: train
moderate-to-hard when 7-day rolling HRV sits within baseline ±0.5 SD;
downgrade to low-intensity/rest below that band.

**What it won't do** [medium confidence, JSAMS 2021 meta-analysis, 8 studies/
198 participants]: HRV-guided training produces a significant improvement in
submaximal physiological markers (g=0.296) but a small, non-significant effect
on actual race performance (g=0.079). It manages overtraining risk — it does
not, by itself, buy race-day speed. A newer (2023) study found a small but
significant performance benefit, so this evidence base is still moving.

## Open questions (unresolved by this research pass)

- Exact LT training pace/duration prescription for the Aug 4 result.
- Precise target CTL magnitude (vs. just ramp rate) for a 4:16/km goal.
- A verified VO2max/pace threshold specific to sub-3h at 4:16/km.
- Whether bike commute + swim can quantifiably offset low run mileage (thin
  evidence either way).

---

## Implementation status (updated 2026-07-18, same day)

**Key judgment call at the time:** don't hard-code the report's illustrative
~26-28km peak-long-run number into the schedule immediately — CTL was 15.2
and HRV/TSB were both showing real fatigue, so a fixed new distance record on
a fixed calendar date would repeat the exact "borrowed number, not governed
by readiness" mistake this report flags. The original plan was to defer that
specific number to a readiness-gated trigger around week 9.

**What actually happened next:** a separate commit (`df1f4af`, same day,
18:20) phased in a *larger* mileage increase than this report's own
illustrative sketch — using real zone-2 pace data (~5:45-6:00/km, not the
retired 5:00-5:20/km assumption) rather than a fixed calendar decision. Peak
long run is now 165min/~29km (week 11), peak week ~51km (still below
Higdon's ~61km/week reference and further below the Pfitzinger tiers above —
an accepted tradeoff, not an oversight).

Given that, the findings above were wired into the actual project as:

- `data/training-plan.json` — 8 day-entries had their `bigPicture`/`food`
  narrative text corrected to match the already-updated `training.detail`/
  `estKm` fields (a real consistency bug, independent of this report).
- `.claude/commands/update-coach.md` — a new "Sub-3h checkpoint reference"
  section persists the governance rules above across every future
  `/update-coach` run: CTL ramp-rate ceiling, a **de-escalation safety
  valve** for weeks 10-11 (since the schedule is now more ambitious than a
  pure ramp-rate-first approach would have chosen — if readiness doesn't
  cooperate by week 9, scale back rather than blindly execute), the second
  quality-session trigger, the LT re-test reminder, and the accepted-gap
  note so `volumeCheck.flagged` doesn't get "fixed" by reflexively padding
  mileage.

This file is the point-in-time research record. `update-coach.md` is the
living, enforced version — if the two ever disagree on a specific number,
trust `update-coach.md` and treat this file as historical context for *why*.
