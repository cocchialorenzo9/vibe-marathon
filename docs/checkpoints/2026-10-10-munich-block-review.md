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
| Dec 9 (wk 9) | Aerobic check: HR over 5 km at 5:30/km vs Nov 4, plus the Nov 21 test | HR ≥3 bpm lower, weeks 7–9 ≥90% done, no niggles → specific block as written; otherwise hold volume 2 more weeks |
| Dec 20 (wk 10) | Pisa Half Marathon, easy with sister (~6:00/km, HR ≤140) | Not a checkpoint; fuel and cup-drinking rehearsal. Replaced the Dec 20 10K (decided 2026-10-12) |
| Jan 24 (wk 15) | 10K | ≤39:00 sub-3 on track · 39–40 → 3:00–3:05 · >40 → ~3:08–3:12 |
| Feb 14 (wk 18) | Half marathon | ≤1:26:00 sub-3 · 1:26–1:29 → 3:00–3:05 · >1:29 → ~3:08–3:12; sets final race MP |

Caveats: the threshold is watch-estimated, HR is from a wrist sensor and the
5K is a Strava estimate. These numbers are directional until a race or lab
test confirms them.

## 5. First draft plan shape (superseded by section 9)

| Weeks | Dates | Phase | km/week | Focus |
|---|---|---|---|---|
| 1–2 | Oct 12–25 | Recovery | 14 → 30 | Post-Munich; easy only |
| 3–10 | Oct 26 – Dec 20 | Base | 42 → 72 (recovery wks 6, 10) | 5→7 runs, HR cap 140, hills/strides, threshold reps, strength 2×, LT test, HR checks, fuel test, Pisa HM easy |
| 11–12 | Dec 21 – Jan 3 | Holiday bridge | 69, 76 | Hold volume |
| 13–20 | Jan 4 – Feb 28 | Specific | 80 → 92 (recovery wks 15, 18) | 1–2 quality sessions + long run carrying MP (10→16 km at MP), 10K, HM |
| 21–22 | Mar 1–14 | Taper | 63 → race | Volume −40–60%, intensity kept (Bosquet 2007, *MSSE*) |

The draft is **not wired into `update-coach`** (that still reads
`training-plan.json`, which runs through Munich). To activate: after Munich
and the 2 recovery weeks, move it into `training-plan.json`, adjust for the
race result, and write `race-plan.json` for Rome after the HM checkpoint.

## 6. Munich result — 2026-10-11

**Chip time 3:19:43** (4:44/km official). This was the athlete's first
marathon, 15 weeks after starting from almost no running base.

Strava activity 20539174342. The watch measured 42.53 km (0.8% long), so
watch splits run slightly fast against the official km markers.

| Section (watch km) | Pace | Grade-adj. pace | Avg HR | Notes |
|---|---|---|---|---|
| 0–5 | 4:44 | 4:41 | 160 | Plan: 4:42–4:46, HR ≤152 |
| 5–10 | 4:35 | 4:34 | 161 | A-stretch lane, HR above the 158 ceiling |
| 10–15 | 4:34 | 4:38 | 158 | Net downhill |
| 15–20 | 4:33 | 4:32 | 158 | |
| 20–25 | 4:32 | 4:28 | 159 | Half in ~1:36:24 (watch); climbing starts |
| 25–30 | 4:40 | 4:32 | 158 | Course climbs (net +23 m); effort held |
| 30–35 | 4:52 | 4:55 | 155 | Grade-adj. pace held to km 32; pee stop at km 33 |
| 35–40 | 5:12 | 5:10 | 151 | Continuous running; legs heavy, eased off once sub-3:15 was gone |
| 40–42.5 | 4:53 | 4:55 | 154 | Picked up again at the finish (last 1.5 km ~4:45) |

Halves (watch): **1:36:24 / 1:43:48**, a positive split of ~7.5 min (+7.7%).

Grade-adjusted pace comes from the altitude stream, weighted by Minetti et
al.'s (2002, *J Appl Physiol*) energy-cost-of-gradient curve. The watch
logged ~185 m of ascent (Strava's summary says 123 m). Munich climbs ~40 m
between km 21 and km 33, so **the raw slowdown from km 27 to 32 was mostly
the course, not a fade**. Grade-adjusted effort held at ~4:30–4:39 until
km 32, at a steady HR of 156–157. The real break came **after the pee stop
at km 33**: grade-adjusted pace went to 4:50, then 5:03–5:20 for km 35–41,
with HR falling to 149–152 and cadence dropping from ~170 to ~165–167 spm.

What the data says:

- **The race went out at A-stretch effort, chosen deliberately.** It ran
  4:32–4:35/km at HR 158–161 (~95–96% of the device LT) for 25 km. The
  "A-real" lane in `race-plan.json` predicted 3:15–3:18 for its pacing;
  going out faster gave 3:19:43.
- **Effort held to km 32; after the stop the legs and the decision set
  the pace.** Grade-adjusted pace was steady to km 32. After the stop, pace,
  HR and cadence all fell together, and the athlete reports heavy legs plus
  a deliberate ease-off once sub-3:15 was gone. A falling HR with falling
  pace fits muscular/peripheral fatigue better than a cardiovascular limit.
  In marathoners, late-race pace loss tracks blood markers of muscle damage,
  not dehydration (Del Coso et al. 2013, *PLoS ONE*). The final 1.5 km at
  ~4:45 argues against severe glycogen depletion, since a true bonk rarely
  allows a rally. That's an inference: an HR trace can't separate causes.
- **Counterfactual.** Holding the km 26–32 grade-adjusted effort over the
  last 10.5 km (net downhill) would have meant ~4:33–4:40/km instead of the
  actual average, saving ~4–5 min → **~3:14:30–3:16**. That's an upper bound
  on what was available that day, not a demonstrated result: the legs may
  not have held even without the stop.
- **Gut problems the whole race; drinking was too much (corrected
  2026-10-12 from the athlete's report).** All 8 honey sips (~210 g sugar ≈
  63 g/h) went down *on paper*. But the athlete had upper-GI symptoms all
  race: burping up the honey, close to vomiting, nausea in cold gusts. They
  also had lower-GI urgency. The km 33 stop was partly the bladder, partly
  the gut. After it the GI symptoms eased, but the athlete could no longer
  drink: two small sips of water or isotonic drink at most, and cold water
  hurt the stomach. Realistically, then, **less carbohydrate was absorbed
  than was swallowed, and almost no fluid or fuel went in over the last
  ~9 km**. Drinking was also above plan early, causing bladder discomfort.
  Consensus guidance is to drink to thirst (Hew-Butler et al. 2015, *Clin J
  Sport Med*). Drinking beyond thirst gave no performance benefit in a
  meta-analysis (Goulet 2011, *Br J Sports Med*) and raises the risk of
  exercise-associated hyponatremia. See section 7.
- **Pacing.** In large recreational datasets, runners who slow sharply late
  in a marathon are the slower finishers overall (Smyth 2021, *PLoS ONE*,
  "hitting the wall"). Marathon world records are run at near-even pace.
  How much a 4:40-ish even pace would have saved can't be known from one
  race; don't count minutes from it.

### How the result recalibrates the models

| Model | Predicted | Actual 3:19:43 |
|---|---|---|
| Daniels VDOT from the Strava 5K (VDOT ~51.5) | ~3:06 | 13–14 min slower → marathon VDOT ≈ 47.5 |
| Tanda 2011 (training load) | ~3:30 | 10 min faster |
| `race-plan.json` A-real lane | 3:15–3:18 | 2–5 min slower, with a faster-than-lane first half |

The **~4-point gap between 5K VDOT and marathon VDOT** confirms the
section 2 diagnosis: the speed is there, but endurance can't hold it yet.

### What changes for Rome

- **Sub-3 now needs −19:44 (−9.9%) from the chip time, or ~−7.5–8% from
  the ~3:14:30–3:16 counterfactual**, in 22 weeks. That's a big jump, even
  for a novice in the fastest-improving phase. *(Superseded 2026-10-12 by
  section 9: the athlete chose sub-3 as the target, with a Pfitzinger
  18/70-style block. The checkpoints can still re-target downward.)*
- **Marathon pace in the plan is 4:16/km** (sub-3). It moves only if the
  Jan 24 10K or Feb 14 HM checkpoint re-targets.
- **Hydration rule:** drink to thirst in long runs and the race. Practise
  it on every long run over 25 km and note any bladder discomfort.
- **Pacing rule for Rome:** first half no faster than goal MP. The HR
  ceiling gets set from the measured LT after the Nov 21 field test.
- **Durability** (section 3, point 6) moves up in priority. The race broke
  at km 32–33, which is exactly the zone the specific block's 26–33 km long
  runs with MP finishes are built to train.
- **Fix GI tolerance** (section 7): run the base-block fuel test (gels vs honey blend vs drink mix vs diluted honey), gut-train every long run, go low-FODMAP before the race.

## 7. Fuelling and GI distress (rewritten 2026-10-12)

The first version of this section said fuelling worked. That was based on
the sips being taken. The athlete's GI report changes the verdict:
**fuelling failed on tolerance, not on quantity.**

### What likely went wrong, by strength of evidence

1. **The honey mix was extremely concentrated.** Each flask held ~105 g
   sugar in ~165 mL (≈60% carbohydrate, per `race-plan.json`), against the
   ~6–8% of a standard sports drink. Very concentrated, high-osmolality
   carbohydrate slows gastric emptying and draws water into the gut. Both
   are established causes of bloating, nausea and diarrhoea during exercise
   (de Oliveira, Burini & Jeukendrup 2014, *Sports Med*, review). A cup of
   water after each sip only partly dilutes it. The Sep 26 long run already
   flagged "very concentrated honey" with a slump at km 27.
2. **Too much free fructose.** Honey is ~38% fructose to ~31% glucose.
   Fructose beyond the glucose amount is absorbed less well and is a
   recognised driver of GI symptoms. Reviews of glucose–fructose mixes
   favour roughly 1:0.8 glucose:fructose, i.e. *more* glucose than
   fructose (Rowlands et al. 2015, *Sports Med*). The carb load (honey,
   jam, juice) added more fructose in the 36 h before. Excess fructose is a
   FODMAP, and a low-FODMAP diet before exercise cut GI symptoms in runners
   who suffer from them (Lis et al. 2018, *MSSE*; small study).
3. **High intensity reduces gut blood flow.** At ~95% of LT for 2.5+ h,
   blood is diverted away from the gut, which impairs absorption and raises
   symptoms. This is "exercise-induced gastrointestinal syndrome" (Costa et
   al. 2017, *Aliment Pharmacol Ther*, review). Going out at A-stretch
   effort made this worse than the plan's lanes would have.
4. **Not rehearsed at race intensity.** Fuelling was practised at most once
   (Sep 26, easy pace, ~60 g/h). The gut adapts: two weeks of repeated
   carbohydrate intake during running reduced GI symptoms and carbohydrate
   malabsorption (Costa et al. 2017, *Appl Physiol Nutr Metab*). The
   athlete never did this.
5. **Lower-quality evidence, plausible:** swallowing air while drinking
   from cups on the move can cause burping. Cold water and cold air causing
   discomfort has no solid evidence behind it, but personal tolerance
   varies, so carry room-temperature fluid if cold hurts.

### Did it cost the race?

Probably part of it. The km 33 stop was partly GI, and after it almost no
fuel or fluid went in for ~45 min. That re-opens carbohydrate shortfall as a
contributor to the km 34–41 fade, alongside the legs and the deliberate
ease-off. The final-km rally still argues against a full bonk. The data
can't apportion the causes.

### What changes for Rome

1. **Pick the fuel by testing, not by guessing.** Honey isn't ruled out.
   It improved a cycling time trial about as much as a dextrose gel in a
   small study (Earnest et al. 2004, *J Strength Cond Res*). The Munich
   problems point to concentration and fructose excess, which a blend can
   fix. But fructose malabsorption is common and could also explain the
   symptoms, so the base block tests four strategies head to head (below).
   No 60% honey flasks either way.
2. **Gut training.** Fuel in every long run and every MP session from the
   base block onward, at race-intensity sessions too. Start at ~40 g/h and
   build to 60, then 75–90 g/h by the specific block, logging GI symptoms
   from 0 to 10.
3. **Low-FODMAP, low-fibre, low-fructose for the 24–48 h before the race**,
   trialled first before the Feb 14 HM checkpoint and big long runs. Carb
   load with rice, pasta, white bread, potatoes and sports drink rather
   than honey, juice and jam.
4. **Drink to thirst; learn your sweat rate.** Weigh before and after long
   runs (1 kg ≈ 1 L), and don't gain weight in the race. Carry
   room-temperature fluid if cold water hurts.
5. **No NSAIDs (ibuprofen etc.) before or during the race.** They increase
   gut permeability during exercise (van Wijck et al. 2012, *MSSE*).
6. **Caffeine: low priority now.** It improves endurance performance (ISSN,
   Guest et al. 2021), but it also speeds gut motility, so only trial it
   once GI symptoms are solved.
7. **Pace.** Starting at the plan's HR lane, not A-stretch, also protects
   gut blood flow.

### Fuel test, base block (`fuelTest` in `data/training-plan-rome-2027.json`)

| Strategy | What | Long runs |
|---|---|---|
| A | 1:0.8 glucose:fructose gels, each with 150–200 mL water | Nov 8, Jan 3 |
| B | Honey + maltodextrin, ~24%, ~1:0.65 G:F (58 g honey + 17 g malto, water to 250 mL per 60 g carbs) | Nov 15, Dec 27 |
| C | 1:0.8 drink mix only, ~12–13% | Nov 22, Dec 13 |
| D | Honey only, ~24% (80 g honey, water to 250 mL per 60 g carbs) | Nov 29, Dec 6 |

- **Order:** A-B-C-D-D-C-B-A, so the carb target, which rises from 40 to
  65 g/h, affects every strategy about equally.
- **D vs B** isolates the fructose ratio. **D vs Munich** isolates
  concentration, since D uses the same honey at ~24% instead of ~60%.
- **Log after each run:** upper-GI 0–10, lower-GI 0–10, any stops, whether
  you could still drink in the last 20 min, and temperature. Keep the
  pre-run meal and timing the same each time.
- **Decide on Jan 3:** the lowest mean GI score wins (on a tie, the simpler
  option) and becomes the fuel for the specific block, the half marathon and
  Rome. If every strategy averages 3 or more, see a sports dietitian or GP
  (e.g. a fructose malabsorption breath test) before raising the carb
  target further.
- **Limits:** two runs per strategy can show a clear winner but can't
  separate small differences.

## 8. Rome course vs Munich

- **Elevation is not the big difference.** Third-party sources put Rome at
  ~100 m of total gain, with an altitude range of ~8–31 m. Munich logged
  123 m (Strava summary). There is no official figure from the organiser
  yet; check the GPX once it's published. The plan's flat-route training
  fits either course.
- **The real differences are the surface and the turns.**
  - Reports say Rome's cobblestones (*sampietrini*) fall mainly in km 30–40,
    exactly where Munich broke, though the location is not officially
    confirmed.
  - The course has many turns, including a 180° turn near Piazza del Popolo.
  - Running on uneven terrain raised metabolic cost by ~5% in a lab study
    (Voloshina & Ferris 2015, *J Exp Biol*). Rome's stones are flatter than
    that lab surface, so read it as direction, not size.
- **What the plan does about it:** the specific-block long runs with MP
  finishes put part of the MP segment on cobbled or uneven surfaces
  (Munich's Altstadt has plenty) and include tight turns. Race pacing
  allows ~5–10 s/km slower on the cobbled stretches at the same effort,
  rather than chasing pace there.

## 9. Sub-3 block (decided 2026-10-12)

The athlete chose **sub-3:00 (4:16/km)** as the Rome target and asked for
sub-3-level weekly mileage modelled on Pfitzinger's 18/70 plan. The
checkpoints, fuel test, Pisa and the GI rules all stay.

### Shape (`data/training-plan-rome-2027.json`)

| Weeks | Dates | Phase (Pfitzinger mesocycle) | km/week | Key work |
|---|---|---|---|---|
| 1–2 | Oct 12–25 | Recovery | 14 → 30 | Post-Munich, easy only |
| 3–4 | Oct 26 – Nov 8 | Rebuild | 45 → 60 | Hills, first medium-long runs, HR check baseline Nov 4 |
| 5–10 | Nov 9 – Dec 20 | Endurance (block wks 1–6) | 66 → 86, recovery wks 6 and 10 | 1 LT run (5→7 km at LT), 2 medium-long runs (14–18 km), long runs 21→28 km, LT test Nov 21, HR check Dec 9, Pisa easy Dec 20 |
| 11–15 | Dec 21 – Jan 24 | LT + endurance (wks 7–11) | 88 → 100, recovery wk 14, 10K wk 15 | LT runs to 9 km, medium-long runs to 20 km, first MP long run (32 km with 14 at MP) |
| 16–19 | Jan 25 – Feb 21 | Race preparation (wks 12–15) | 104 → **110 peak**, HM wk 18 | VO2max intervals, 34 km long run, 30 km with 19 at MP, 32 km with 16 at MP |
| 20–22 | Feb 22 – Mar 14 | Taper (wks 16–18) | 85 → 66 → race | Pfitzinger's 3-week taper, intensity kept (Bosquet 2007) |

Eight weeks at 85+ km, five at 98+ km, peak ~110 km. Pfitzinger 18/70 peaks
at ~113 km.

### What the science says about this choice

- **For it:** weekly volume is the training variable most strongly linked
  to marathon time (Doherty et al. 2020 meta-analysis; Tanda 2011). Under
  Tanda's model, 100+ km/week brings sub-3 within reach at the training
  paces this athlete already runs.
- **Against it: injury risk.** The athlete's training age is ~4 months,
  with a 73 km peak and a 43 km average. Large, fast increases in running
  volume are linked to running injuries (Nielsen et al. 2014, *JOSPT*:
  >30% over two weeks), and there is no validated "safe" ramp rate. The
  plan keeps every two-week step under ~30% except where a recovery week
  sits in between. It also puts recovery weeks every 3–4 weeks and keeps
  ~80% of running easy.
- **Guard rails, written into the plan:**
  - A niggle lasting more than two runs, or resting HR up 5+ bpm for 3+
    days, means repeating the previous week's volume instead of
    progressing.
  - The Dec 9 aerobic check decides whether volume climbs to 88–110 km
    from Dec 21, or holds at ~86 km for two more weeks.
  - The Jan 24 10K and Feb 14 HM still re-target the race pace (3:00–3:05
    or ~3:08–3:12) if the fitness isn't there. Volume stays the same either
    way.

## 10. Training pace, strength and swimming (decided 2026-10-12)

The athlete reviewed Marathon Handbook's 20-week sub-3 plan and chose four
changes. Weekly mileage from section 9 stays exactly as it was.

- **Training marathon pace 4:09/km, race at 4:15–4:16/km.** 4:09 is 2:55
  pace. Training there leaves ~5 min of slack, so the race can be run at
  4:15–4:16 for sub-3. All MP work (MP segments in long runs, race-pace
  medium-long runs, race-pace runs, taper sessions) uses 4:09.
  - **Caution from the athlete's own data:** in the Oct 1 simulation,
    4:16/km already cost HR 166–169, i.e. threshold. Until fitness
    improves, 4:09 will sit at or above threshold. Every 4:09 block
    carries a guard: if lap HR passes 166, finish it at 4:16 and log it.
    That keeps the sessions threshold-like rather than VO2max-like. The
    10K and HM checkpoints still re-target the race if needed.
  - **Race-pace exposures added** (Marathon Handbook-style), without
    adding run days:
    - Nov 26: 2×2.5 km inside the medium-long run.
    - Dec 3: 2×3 km inside the medium-long run.
    - Dec 24: race-pace run, 2×4 km.
    - Feb 26: race-pace run, 2×4 km.

    These come on top of the MP long runs and taper sessions.
- **Home strength** (`strengthProgram` in the plan JSON), 31 sessions.
  - **Equipment:** a loaded backpack, a step, and optionally dumbbells or a
    kettlebell.
  - **S1:** heavy single-leg work (Bulgarian split squat, single-leg RDL,
    calf raises, hip thrust, Copenhagen plank).
  - **S2:** plyometrics and core.
  - **Phases:** foundation (wks 2–6), max strength (wks 7–15), maintain
    (wks 16–20), taper (wk 21). Recovery weeks use S1 only.
  - **Placement:** S1 goes after a quality run, and nothing is scheduled
    the day before a quality run or the long run.
  - **Evidence:** Balsalobre-Fernández 2016; Blagrove 2018. Loads have to
    stay heavy for the economy benefit, which is why added weight matters.
- **Swimming** (`swimming` in the plan JSON).
  - **17 easy pool sessions** replace the Monday recovery run, the day
    after the long run. The km move into other easy runs, with recovery
    runs capped at 10 km and easy runs at 14 km. Where that wasn't enough,
    a plain rest day became a short recovery run.
  - **Peak week (wk 17)** keeps its Monday run, with an optional swim
    added.
  - **What swimming is for:** recovery and extra aerobic time. It doesn't
    stand in for running km.
