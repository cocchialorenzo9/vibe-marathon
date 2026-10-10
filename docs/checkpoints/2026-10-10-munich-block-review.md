# Munich block review and Rome 2027 outlook — 2026-10-10

Written the day before Munich (Oct 11 2026), after the race plan had already
moved the target from sub-3:00 to 3:15–3:22. Looks at why the 15-week block
didn't produce sub-3 fitness, and what the evidence says to change before the
**Maratona di Roma, Sunday 14 March 2027**. The draft plan that follows from
this lives in `data/training-plan-rome-2027.json`.

Data: Strava activity list Jul 6 – Oct 10 (all runs), Strava best efforts and
laps for Sep 24, Sep 26 and Oct 1, `data/zone-history.json`,
`data/training-journal.json`, `data/coach.json`.

**Update this file after Munich.** The race result is the best single
predictor we'll have, so it replaces every model estimate below.

## 1. What the block actually was

| | Munich block (Jul 6 – Oct 10) | Pfitzinger 18/70 (typical sub-3) |
|---|---|---|
| Running before the block | ~6 short runs in the previous 6 months | Years of consistent running |
| Avg km/week | **43** (51–55 in the last 8 weeks) | ~90 |
| Weeks > 60 km | **3** (63, 69, 73 — Sep 7–27) | ~10+ |
| Runs/week | 3–5 | 6–7 |
| Longest run | 31.6 km (Sep 26) | 32–35 km, several times |
| Strength sessions | 2 total | regular |

Weekly km (Mon–Sun): 25, 27, 33, 18, 44, 48, 46, 26, 58, 63, 69, 73, 54, 17.

The athlete went from near zero to 73 km/week in 11 weeks. That's real
progress, but it's about half the volume sub-3 runners carry, and only held
for about 3 weeks.

## 2. Where fitness stands: two models disagree, and the gap is the diagnosis

- **Speed (Daniels VDOT).** Strava's estimated 5K of 19:29 ≈ VDOT 51.5 →
  ~3:06–3:07 marathon *if endurance were fully developed*. Sub-3 needs ≈
  VDOT 54: 5K ~18:40, 10K ~38:40, HM ~1:25:40.
- **Training load (Tanda 2011, *J Hum Sport Exerc* 6(3)).** Marathon pace
  (s/km) = 17.1 + 140·e^(−0.0053·K) + 0.55·P, where K = mean km/week and P =
  mean training pace over the last 8 weeks. K = 50.7 and P = 5:18/km give
  **~4:59/km ≈ 3:30**. The model comes from a small amateur sample, so treat
  it as directional.

That's ~3:05 speed against ~3:20–3:30 endurance support. Vickers & Vertosick
(2016, *BMC Sports Sci Med Rehabil*) found the same pattern across
recreational runners: low weekly mileage makes marathon times worse than
shorter races predict.

Evidence from the athlete's own data:
- **Oct 1 race simulation:** 4:16/km cost 166–169 bpm, which is the device
  LT (167). Sub-3 pace is currently threshold effort, and threshold effort
  can only be held for about an hour.
- **Sep 26 31.6 km, steady ~5:35/km:** HR drifted from ~134 to 146–153 over
  the second half. More than 5% drift at the same pace suggests aerobic
  endurance isn't built yet. That threshold is a coaching rule of thumb
  (Friel), not lab research.

## 3. Where to improve, ranked by strength of evidence

1. **Run more, more often, for longer.** Doherty et al. (2020, *J Sci Med
   Sport*, meta-analysis) and Emig & Peltonen (2020, *Nat Commun*, real-world
   data) agree: faster marathoners run more km/week, more sessions per week
   and longer long runs. Under Tanda's model, sub-3 at 60 km/week would need
   a mean training pace of 4:09/km (not realistic); at 90–100 km/week it
   needs ~4:36–4:44/km. Target: 6–7 runs/week, peak 80–92 km, at least
   75 km/week for about 8 weeks.
   *Injury risk:* the "10% rule" didn't reduce injuries in an RCT
   (Buist 2008, *Am J Sports Med*). More than a 30% increase over two weeks
   was linked to more injuries (Nielsen 2014, *JOSPT*). So build steadily
   and avoid jumps.
2. **Make easy runs actually easy.** HR bands over the block: <130 14%,
   130–140 28%, **140–155 37%, 155–167 16%**, 167+ 4%. The journal shows the
   same pattern again and again: recovery runs averaged 146–159 bpm (Sep 22,
   Sep 24, Oct 6); a 100-min recovery-week long run became 178 min (Sep 26,
   TSB −39); long runs picked up surges nobody planned. Well-trained
   distance runners do ~75–80% of their training below their first lactate
   threshold (Seiler 2010, *IJSPP*; Casado et al. 2022 on marathoners), and
   that distribution beat threshold-heavy training in an RCT (Stöggl &
   Sperlich 2014, *Front Physiol*).
3. **Measure your thresholds instead of guessing.** LT 167 bpm is still the
   watch's estimate: the Aug 4 field test never happened, and the first
   threshold (top of "easy") has never been measured. Fix: a lab lactate
   test, or a 30-min TT / 10K. For a daily easy ceiling, a chest strap with
   DFA-α1 (≈0.75 at the first threshold; Rogers et al. 2021) has been
   validated against lab tests.
4. **Structured threshold work, done as prescribed.** Performance comes down
   to three things: VO₂max, the share of it you can sustain (which tracks
   LT), and economy (Joyner & Coyle 2008, *J Physiol*). For this athlete the
   middle one has the most room to move. Quality sessions mostly drifted
   into continuous efforts or were cut short (Sep 1, 17, 29; Oct 1, 8).
5. **Strength and plyometrics, twice a week.** Heavy strength and plyometric
   work improves running economy in distance runners with no loss of
   endurance (Balsalobre-Fernández 2016, *JSCR*, meta-analysis; Blagrove 2018,
   *Sports Med*).
6. **Marathon-specific long runs and gut training.** Long runs with steady MP
   segments train the ability to hold pace when tired (Maunder et al. 2021,
   *Sports Med*). Practise race fuelling at 60–90 g carbs/h: training the gut
   reduces stomach problems (Costa et al. 2017).
7. **Recovery basics.** Sleep restriction impairs endurance performance
   (Fullagar 2015 review). Alcohol after exercise reduces muscle repair
   (Parr 2014, *PLoS One*).
8. **Carbon-plated shoes, if not already used.** They reduce the energy cost
   of running by ~4% (Hoogkamer 2018). At this speed that's worth roughly
   2–3% in race time.

## 4. Rome: realistic?

There are 22 weeks after Munich. Sub-3 is **possible, not likely**. It needs
about 2.5–3 VDOT points *plus* doubling sustained volume. Training age is
only ~4 months, which is when improvement is fastest. Rather than commit
now, the plan uses checkpoints:

| When | Checkpoint | Decision |
|---|---|---|
| Nov 21 (wk 6) | 30-min LT field test | Replaces device LT; rescale every HR number in the plan |
| Dec 20 (wk 10) | 10K #1 | ≤40:00 → specific block as written; slower → hold volume 2 more weeks |
| Jan 24 (wk 15) | 10K #2 | ≤39:00 sub-3 on track · 39–40 → 3:00–3:05 · >40 → ~3:08–3:12 |
| Feb 14 (wk 18) | Half marathon | ≤1:26:00 sub-3 · 1:26–1:29 → 3:00–3:05 · >1:29 → ~3:08–3:12; sets final race MP |

Caveats: the threshold is watch-estimated, HR is from a wrist sensor and the
5K is a Strava estimate. These numbers are directional until a race or lab
test confirms them.

## 5. Draft plan shape (`data/training-plan-rome-2027.json`)

| Weeks | Dates | Phase | km/week | Focus |
|---|---|---|---|---|
| 1–2 | Oct 12–25 | Recovery | 14 → 30 | Post-Munich; easy only |
| 3–10 | Oct 26 – Dec 20 | Base | 42 → 72 (recovery wks 6, 10) | 5→7 runs, HR cap 140, hills/strides, threshold reps, strength 2×, LT test, 10K #1 |
| 11–12 | Dec 21 – Jan 3 | Holiday bridge | 69, 76 | Hold volume |
| 13–20 | Jan 4 – Feb 28 | Specific | 80 → 92 (recovery wks 15, 18) | 1–2 quality sessions + long run carrying MP (10→16 km at MP), 10K #2, HM |
| 21–22 | Mar 1–14 | Taper | 63 → race | Volume −40–60%, intensity kept (Bosquet 2007, *MSSE*) |

The draft is **not wired into `update-coach`** (that still reads
`training-plan.json`, which runs through Munich). To activate: after Munich
and the 2 recovery weeks, move it into `training-plan.json`, adjust for the
race result, and write `race-plan.json` for Rome after the HM checkpoint.
