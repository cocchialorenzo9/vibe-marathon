Follow these steps exactly, in order. Do not skip steps.

## Step 1 — Fetch today's biometric data

Check the `WATCH_SOURCE` environment variable (default: `amazfit`).

- **`WATCH_SOURCE=amazfit`** (or unset): run `python3 scripts/fetch_amazfit.py`
  - If a Zepp export is present in `data/zepp/`, the script auto-fills sleep, resting HR,
    and yesterday's activity. It will also **backfill any missed days** from the export into
    local history before running — report any backfilled dates to the user.
  - HRV and sleep score both require manual entry — HRV isn't in the Zepp export at all, and
    the export's own sleep-score field can't be trusted (it's a locally-computed proxy from
    deep/REM ratios that ignores total sleep duration, verified wrong against the user's real
    Zepp app numbers), so both need the user's own numbers read off the Zepp app. Sleep hours
    still auto-fill correctly from the export.
  - **VO2max also requires manual entry** — it isn't in the Zepp export either. Unlike
    HRV/sleep-score, don't ask every run: VO2max changes slowly, so only prompt for a refreshed
    number if none is on record yet in `data/coach.json`'s `readiness.vo2max`, if more than ~4
    weeks have passed since `asOf`, or if the user proactively mentions a new number (e.g. from
    the Zepp app's Running Status card, if the watch model surfaces one).
  - **After backfill, check for missing HRV and sleep score**: scan the local history file for
    any entries missing either field. `hrv` is expected `null` before **2026-06-29** (when HRV
    tracking started) — only flag `hrv: null` for dates **on or after** that. `sleep_score` has
    no such floor — it's been wrong since day one — so flag `sleep_score: null` for **any**
    history entry, regardless of date. If either set is non-empty, ask the user in a single
    batched question (e.g. "Missing HRV for Jun 30, Jul 1, Jul 2 — what were they?" and
    separately "Missing sleep score for Jun 26–Jul 9 — what were they, from the Zepp app?").
    Write their answers back into the matching history entries (leave an entry `null` if they
    don't have it) before moving to Step 2, so this run's baseline and delta calculations use
    the corrected data.

- **`WATCH_SOURCE=garmin`**: run `python3 scripts/fetch_garmin.py`
  - Requires `GARMIN_EMAIL` and `GARMIN_PASSWORD`. If not set, ask the user to export them before continuing.

Both scripts print a canonical `BiometricReading` JSON object to stdout. Parse it. The `source` field confirms which device was used. The `history_path` field gives the local history file path.

**If the Zepp export is stale** (the script will warn you), tell the user:
"Your Zepp export is from {date}. If you trained since then, sync your watch, re-export from the Zepp app, and drop the new folder into `data/zepp/` before re-running."

## Step 2 — Load rolling history

Read the history file at the path reported in `history_path` from Step 1. It is a JSON array of daily entries. Each entry has: `date`, `tss`, `distance_km`, `avg_hr`, `hrv`, `resting_hr`, `sleep_hours`, `sleep_score`.

If the file does not exist yet, create the directory and treat history as an empty array.

Compute from the array:
- **ATL** (Acute Training Load): exponential weighted average of `tss` over the last 7 days, time constant 7
- **CTL** (Chronic Training Load): exponential weighted average of `tss` over the last 42 days, time constant 42
- **TSB** = CTL − ATL

If history is empty, start ATL=0, CTL=0.

## Step 3 — Identify tomorrow's scheduled session

Read `data/training-plan.json`. Find the entry in `weeks[].days[]` whose `date` field equals **tomorrow**'s date (YYYY-MM-DD format). Extract:
- The session's `training.type`, `training.title`, `training.detail`
- The parent week's `phase`

If tomorrow falls outside all weeks (before week 1 or after race day), note that explicitly.

## Lactate-threshold & VO2max reference (used in Steps 4, 4c, 4d, 4e, 5)

Current LT estimate: **167bpm**, device-reported — the athlete's Amazfit/Zepp
watch computes and updates this automatically after each run; the user has
opted to use it as the primary number over the earlier ~155bpm Karvonen-
heuristic estimate. Treat this as watch-computed, not lab-tested — this
project has twice caught watch/app-computed metrics being wrong (a
fabricated sleep-score proxy, a miscalibrated zone-2 alert), so it isn't
beyond doubt, but it's the athlete's explicit call. Still superseded by the
field test planned for ~Aug 4, 2026 (Week 5, Build day 1) if that produces a
materially different number. When the LT number changes (either from the
watch or the field test), update this block, **and** `DEFAULT_LTHR` in
`scripts/parse_zepp_export.py` (or set the `ATHLETE_LTHR` env var) — TSS is
now computed against LTHR (see Step 5's history-entry schema), so a stale
Python constant would silently miscompute every session's TSS after a field
test changes the number. `training-plan.json`'s day entries use %LT, not
bpm, so those never need re-editing.

Zone bands (replace pace for easy/recovery/long guidance):
- Recovery: 65–75% of LT ≈ 109–125bpm
- Easy/Aerobic: 75–85% of LT ≈ 125–142bpm
- Threshold/LT-specific: ~95–100% of LT ≈ 159–167bpm — used by the Tuesday
  "LT cruise interval" sessions added to `training-plan.json` (weeks 7, 9, 10,
  13). This band moves the same way the other two do whenever the LT number
  changes (Aug 4 field test, and any later re-test).

This is a project-custom 3-band %LT scale, not identical to any named external
framework (e.g. Friel's %LTHR zones use a different percentage scale for a
similarly-anchored number) — don't cross-reference outside charts against these
percentages.

Marathon-pace/tempo/race-pace sessions are unaffected — those keep pace numbers.

**VO2max**: current estimate lives in `data/coach.json`'s `readiness.vo2max`
(`value`, `unit: "ml/kg/min"`, `status: "manual"|"garmin_max_metrics"`,
`asOf`, `history`). Same confidence caveat as LT — a manually-entered or
watch-estimated number, not lab-tested, refreshed slowly (see Step 1's
amazfit branch and Step 5's schema). If `readiness.vo2max` doesn't exist yet
in `coach.json`, ask the user for a starting number once rather than
blocking every future run on it; leave it `null` if they don't have one.

## Sub-3h checkpoint reference (used in Steps 4, 4e, 6)

A checkpoint review on 2026-07-18 (week 3 of base, VO2max 54, LT 167bpm
unconfirmed, CTL 15.2 / ATL 34.4 / TSB -19.2) compared this plan against
published sub-3h methodology (Pfitzinger-tier benchmarks: 55-70mi/~89-113km
peak weeks, 32-35km peak long runs) and sports-science literature on LT
training, CTL ramp rates, and HRV-guided autoregulation. It landed the same
day as the mileage-increase commit that raised the peak long run to 165min
(~29km, week 11) and peak week to ~51km — if you're ever asked to "fix" these
numbers back down because they look like an unexplained jump from an older
note or chat, check git history first; this was deliberate, not drift.

That written schedule is now more ambitious on paper than the checkpoint's
own conservative default would have been from a CTL of 15.2 — which makes
the rules below a **real-time brake on executing the schedule as written**,
not just a way to decide whether to add more:

- **CTL ramp-rate governance.** Published guidance (Friel / TrainingPeaks,
  corroborated across independent sources but not itself adversarially
  verified) puts a sustainable CTL ramp at roughly 5-8 points/week, with 3-5/
  week as the more conservative real-world figure. Compute the trailing
  week-over-week CTL delta each run. While HRV or TSB aren't both clearly
  green (HRV within its baseline band AND TSB ≥ -15 for several consecutive
  days), treat **3-5 CTL points/week** as the ceiling and flag it in
  `reasoning` if the actual delta is running hotter than that — this is a
  volume brake, not a target to hit.
- **De-escalation safety valve for weeks 10-11.** The now-scheduled 150min/
  ~25km (week 10) and 165min/~29km (week 11) long runs are big single jumps
  from a low starting CTL. Around week 9 (~Sep 1-5), if CTL has been running
  hotter than the ramp ceiling above, or HRV/TSB have been repeatedly red
  rather than green in the preceding 2-3 weeks, proactively propose scaling
  those two long runs back toward the previous, more conservative distances
  (~20-21km and ~22-23km respectively) — a suggestion to the athlete, never a
  silent edit to `training-plan.json`. Written schedule is the ceiling if
  readiness supports it, not a mandate independent of it.
- **Second quality day — now committed, not a trigger.** As of 2026-07-18,
  Tuesday LT cruise-interval sessions are scheduled directly in
  `training-plan.json` (weeks 7, 9, 10, 13 — progressing 4×5' → 5×5' → 4×6' →
  3×6' at threshold pace), phased in alongside a new Monday medium-long run
  (weeks 5, 6, 7, 9, 10, 11, 13; see the zone-band note above for the
  threshold pace those Tuesday sessions use). Week 11 (the hardest week)
  deliberately keeps Tuesday plain-easy — don't add LT intervals there even if
  readiness looks great, a third quality-ish day in the hardest week is bad
  periodization regardless of fitness. The old version of this bullet framed
  the second quality day as something to *propose* once HRV/TSB had been
  green for 10 days; that's superseded, it's the default now. What replaces
  it is a **rollback safety valve**: if HRV/TSB are trending red heading into
  one of weeks 7/9/10/13, propose downgrading that week's Tuesday session to
  plain easy effort (or shortening/dropping that week's Monday medium-long)
  rather than executing the schedule blindly — same "propose, don't silently
  edit `training-plan.json`" principle as the long-run valve above, just
  protecting a now-busier default schedule instead of deciding whether to add
  to a lighter one.
- **LT re-test reminder.** The ~Aug 4 field test replaces the device-reported
  167bpm with a real number — update the Lactate-threshold reference block
  above when that happens (nothing else needs editing; day entries use %LT,
  not bpm). Because LT typically shifts over 8-10 weeks of specific training,
  flag a suggestion for a second field test around week 10-11 (peak phase,
  ~Sep 6-19) rather than trusting the Aug 4 number unchanged for the rest of
  the plan.
- **Known, accepted gap — don't "fix" reflexively.** Even after the mileage
  increase, peak week (~51km) sits below full Pfitzinger-tier sub-3h
  benchmarks (89-113km) and close to but still under Step 4e's own Higdon
  reference (~61km). That gap is an accepted tradeoff given the compressed
  build window and a starting CTL of 15.2 (see week 11's own `tip` field), not
  an oversight. If `volumeCheck.flagged` comes back true, the response is
  *not* to pad mileage further — that fights the ramp-rate governance above.

## Step 4 — Reason and generate the recommendation

Given:
- Today's HRV vs baseline (`hrv.value` vs `hrv.baseline`). `hrv.baseline` is a
  geometric mean of the trailing window (log-space averaging, per Plews et al.
  2013 — raw-ms HRV is non-normally distributed), not a plain arithmetic mean
  — compute `delta_pct` as a log-ratio, `round(math.log(value/baseline)*100)`,
  not `(value-baseline)/baseline*100`, so this field stays consistent with how
  `fetch_amazfit.py`'s `hrv_status`/`compute_readiness_score` now do the same
  comparison internally. If `hrv.baseline` is null (first week on a new
  device), use the last available HRV value as a rough proxy or skip HRV delta
  reasoning and note "HRV baseline building up."
- Resting HR trend
- Sleep score (`sleep.score`)
- TSB (positive = rested; below -15 = caution; below -25 = swap to easy)
- CTL (current fitness level)
- Tomorrow's scheduled session
- `readiness.score` from the device (supplementary — use it as a cross-check against your own reasoning, not a replacement)
- `body_battery` may be null (Amazfit does not provide it) — skip this signal if null
- VO2max estimate (see reference above) — use it as a qualitative sanity check on whether the
  sub-3h goal pace is aerobically realistic (Daniels' VDOT tables or Riegel's exponent formula
  are the standard tools for this kind of check, but reason about it qualitatively rather than
  running a rigid formula — this file is a reasoning prompt, not executable code). Flag it in
  `reasoning` only when something looks materially mismatched, not on every run.

Decide whether tomorrow should:
- **Proceed as planned** — readiness is good
- **Proceed with reduced intensity** — HRV 10–20% below baseline OR TSB below -15
- **Swap to easy/recovery** — HRV >20% below baseline OR TSB below -25 OR sleep score <60

Write a recommendation with:
- `type`: one of `easy`, `tempo`, `long`, `race`, `swim`, `rest`
- `title`: 5–8 words, direct
- `reasoning`: 2–4 sentences referencing specific numbers (e.g. "HRV is 13% below baseline", "TSB is -18")
- `sessionDetail`: actual workout instructions (copy/adapt from the plan). If
  the plan's `training.detail` expresses effort as %LT, translate it to the
  current bpm range (see the Lactate-threshold reference above) so the
  athlete gets an actual number to target — the plan text itself stays
  %LT-only, this is where the runtime bpm value shows up.
- `bikeNote`: advice on the 14km/day commute bike given the session. **The bike
  is all-or-nothing** — if used, it goes both directions (to work AND home);
  never split bike one way and U-Bahn the other, the bike can't be in two
  places. If tomorrow is a Saturday or Sunday, there's no work commute at all
  — don't give office-commute advice; only address getting to/from a session
  if one is scheduled (e.g. a long run's start point).
- `swimNote`: advice on Wednesday pool session if applicable

Be direct. No padding. Reference actual numbers.

## Step 4b — Regenerate upcoming day recommendations

Read `data/training-plan.json`. For each day in `weeks[].days[]` whose `date` is between **tomorrow** and **14 days from today** (inclusive), regenerate these three fields:

- **`movement`**: The athlete always trains before work, so movement is about
  the round-trip work commute *after* that morning's session, never framed as
  "before/after" the session itself. **The bike is all-or-nothing: bike both
  ways, or U-Bahn/transit both ways — never split directions or chain a
  bike-out with a transit-back**, since a bike left at one end can't get
  ridden home from the other.

  **On Saturdays and Sundays there is no work commute** (check the day's
  `dayLabel` prefix) — skip office-commute framing entirely; only describe
  transport to/from a scheduled session itself (e.g. "no cycling before the
  long run" or "no commute today, it's the weekend").

  On weekdays, based on session type and today's readiness:
  - `swim`: "Bike both ways to the pool is fine" or "U-Bahn both ways — legs heavy from [TSB/yesterday]"
  - `easy`: "Bike both ways fine" unless TSB is very negative, then "U-Bahn both ways"
  - `tempo`/`long`: "Bike both ways" if legs are fresh, otherwise "U-Bahn both ways" to protect them — pick one, don't split
  - `race`: "No cycling today"
  - Rest days (weekday): "Easy bike both ways is fine"

- **`food`**: Based on the session type and phase:
  - Before long/tempo: high carb (pasta, rice, polenta). Reference the phase's nutrition strategy.
  - After hard session: protein + carbs within 30 min
  - Rest/easy days: normal balanced meals with phase-appropriate carb %
  - Peak/taper phase: mention specific carb-loading or gel strategies as relevant

- **`bigPicture`**: 2–3 sentences placing this day in the training arc:
  - Reference week number, phase, and where the athlete is in the plan
  - Reference TSB or readiness context where relevant (e.g. "after this week's fatigue" or "legs are fresh")
  - Give a forward-looking hook: what this session prepares for

Write these changes back into `data/training-plan.json`. Modify only the `movement`, `food`, and `bigPicture` fields of future days (date ≥ tomorrow). Leave past days and the training fields (`type`, `title`, `detail`) unchanged.

## Step 4c — Recent activity analysis

Skip this step if `WATCH_SOURCE=garmin` — multi-day per-session history isn't
available for Garmin yet (`fetch_garmin.py` only fetches yesterday's single
activity). Set `recentActivity` to `null` in Step 5 and mention to the user
that recent-activity detail was skipped.

Otherwise, run:

```bash
python3 scripts/recent_activity.py --days 7
```

This prints `since`/`today`/`days`/`sessions` — a flat list of **individual**
workouts across the last 7 days, newest first (one entry per run/swim/etc.,
not summed per day — a day with a swim class plus bike-commute legs shows the
swim only). **Bike-commute sessions are already excluded** by the script
(cycling in this plan is always the commute, never a training session) — if
`sessions` is missing an expected day, check whether it was cycling-only
before assuming something's wrong. Each session has: `date`, `type_name`
(e.g. `outdoor_running`, `swimming`), `distance_km`, `duration_min`, `avg_hr`,
`max_hr`, `calories`, `tss`, `avg_pace_min_km` — HR/pace fields may be `null`.
If `no_export` is `true`, set `recentActivity` to `null` and skip the rest of
this step.

Each session may also carry `hr_curve`: a list of `{"t_min", "hr"}` points
(minutes elapsed since the session started, and bpm at that point),
reconstructed from `HEARTRATE_AUTO`'s continuous per-minute background
sampling cross-referenced against the session's own start/duration — the
dedicated per-workout HR export has never had real data, so this is the only
source of intra-session detail available. Present whenever ≥3 samples were
found, else `[]`. Use it to reason about a session's **internal structure**
— cardiac drift across repeated efforts, whether HR climbed steadily through
a long run or was elevated from the start, whether a "tempo"/interval
session's blended avg/max hides sharper segment-by-segment spikes — rather
than reading only the whole-session `avg_hr`/`max_hr`. This is judgment, not
a formula: don't try to algorithmically detect interval boundaries, just
narrate what the curve shows.

For **each session**, write a one-sentence `lesson` — a specific, concrete
takeaway about that individual activity, not a generic comment. Reason using:
- **HR-zone compliance**: easy/aerobic sessions target ~75–85% of LT ≈
  125–142bpm; recovery-week/very-slow sessions target ~65–75% of LT ≈
  109–125bpm (see the Lactate-threshold reference above — current LT 167bpm,
  device-reported). If a session that should have been easy (check
  `data/training-plan.json` for that date if it falls in a plan week,
  otherwise judge from pace/duration) shows `avg_hr` well above ~142bpm (or
  above ~125bpm on a recovery day), say so plainly (e.g. "pace was on target
  but HR was tempo-effort, not easy — likely fatigue").
- Whether pace, duration, and effort line up with what the session looks like
  it was for.

Then write one `analysis` string (1–3 sentences) for the **overall window**:
volume/TSS trend (climbing/flat/dropping, and whether that matches the
current phase), plus any cross-session pattern or anomaly (e.g. a stretch of
several days with no sessions, or more than one session running hot). This is
the macro view; `lesson` is the per-activity view — don't repeat the same
point in both.

This is a judgment call, not a formula — reason about it the way Step 4's
`reasoning` field already gets reasoned about, not via a hardcoded script.

## Step 4d — Update the permanent training journal

Skip this step if `WATCH_SOURCE=garmin`, same reason as Step 4c.

`data/training-journal.json` is a **permanent, append-only archive** — unlike
`recentActivity` above (a rolling 7-day snapshot that gets overwritten every
run), this file accumulates one entry per real training day for the life of
the whole plan and is never edited or pruned by later runs. It exists so a
session's coaching reflection is never lost just because a few days passed,
and so it survives gaps in when `/update-coach` actually gets run.

1. Read `data/training-journal.json` (create as `[]` if missing).
2. Find the backfill range: the day after the journal's last entry, through
   **today** (inclusive). If the journal is empty, start from the earliest
   date present in local history (from Step 2) instead of just the last
   week — a from-scratch run should capture everything available, not only
   recent days.
3. Run `python3 scripts/recent_activity.py --since <range-start>` to get
   per-session detail across the whole range (however long — this may cover
   weeks if the journal hasn't been updated in a while).
4. **Cross-reference against local history** (already loaded in Step 2) for
   every date in the range: if a date has no non-cycling session in the
   script's output but its `distance_km`/`tss` clears **distance_km ≥ 1.5 or
   tss ≥ 5**, archive it anyway using history's own numbers, with
   `duration_min`/`avg_hr`/`max_hr` set to `null` and `type` noted as
   auto-detected (e.g. `"auto-detected running"`) — the watch's step counter
   picked up real activity even though no formal workout was started. If a
   date is below that threshold and has no session, skip it entirely — it's
   either a pure bike-commute day or genuinely negligible movement, not a
   training day worth reflecting on.
5. For each new entry, use this schema:

```json
{
  "date": "<YYYY-MM-DD>",
  "type": "<best-known label>",
  "scheduled": "<training-plan.json's scheduled training.type, or null>",
  "distance_km": <float>,
  "duration_min": <float or null>,
  "avg_hr": <int or null>,
  "max_hr": <int or null>,
  "hr_curve": [{"t_min": <int>, "hr": <int>}] or [],
  "tss": <float>,
  "avg_pace_min_km": <float or null>,
  "wentWell": "<specific>",
  "wentWrong": "<specific, well-explained>",
  "nextTime": "<concrete action, with reasoning>"
}
```

   - `type`: the best-known label for what actually happened (use
     `type_name` from the script when a real session exists; for
     unmapped/generic Zepp type codes, infer the likely activity from
     context — duration, distance, HR, and whether it falls in a plan swim
     week — rather than printing the raw unhelpful code)
   - `scheduled`: `data/training-plan.json`'s scheduled `training.type` for
     that date if it falls in a plan week, else `null`
   - `distance_km`/`duration_min`/`avg_hr`/`max_hr`/`avg_pace_min_km`/`tss`:
     when a real non-cycling session exists, use that session's own facts
     from the script (never the bike-commute-inclusive day total). One
     exception: if the session's own `distance_km` is 0 due to a GPS
     dropout but local history shows a real distance for that day (an
     activity-fallback override, same logic already used elsewhere in this
     pipeline), use history's corrected distance instead of the raw 0.
   - `hr_curve`: carry over the session's `hr_curve` from the script output
     unchanged (`[]` if unavailable).
   - `wentWell`, `wentWrong`, `nextTime`: a genuine, specific reflection —
     compare against the scheduled session's intent when there is one, use
     the %LT easy/recovery HR-zone reference from Step 4c (~125–142bpm
     easy/aerobic, ~109–125bpm recovery) for effort compliance, and
     reference TSB/fatigue context from local history where
     it's relevant. When `hr_curve` is non-empty, use it the same way as
     Step 4c to ground `wentWrong`/`nextTime` in the session's actual
     internal shape (e.g. "HR climbed from 140 to 168 across three visible
     efforts" rather than just citing the blended max). `wentWrong` should be
     honestly explained, not padded — "nothing notable, executed as
     intended" is a fine answer when it's true and you say why you think so;
     don't invent a problem to fill the field. This is judgment, same as
     Step 4c's `lesson`, just one level deeper per entry.
6. Append the new entries (sorted by date) to the array and write the file
   back. Never modify or remove existing entries — this file only grows.

## Step 4e — Refresh weekly training-volume estimates

Skip this step if `WATCH_SOURCE=garmin`, same reason as Step 4c (no multi-day
per-session history available yet to build a reliable pace baseline).

This step exists because the plan's easy/long/recovery sessions are
prescribed as **time + %LT effort**, not a fixed pace — correct for guiding
effort, but it means nobody can see, at a glance, how much real distance a
week's time-based prescription actually adds up to at the athlete's *current*
pace. Recompute this every run rather than treating it as a one-time
calculation — real pace at a given effort changes as fitness builds, so a
static number would just reintroduce the same kind of stale assumption this
step exists to prevent.

1. **Compute `realZone2Pace_min_km`**: read `data/training-journal.json`,
   take entries from the trailing 21–28 days whose `scheduled` is
   `easy`/`long`/`recovery` AND whose `avg_hr` actually falls inside the
   `recovery_bpm`–`easyAerobic_bpm` band from the Lactate-threshold reference
   above (i.e. genuinely easy effort, not a session that drifted into tempo
   territory despite being scheduled easy — exclude those, they'd bias the
   pace faster than reality). Take the median `avg_pace_min_km` of the
   surviving entries. If fewer than 2 qualifying entries exist, use whatever
   is available and note the low confidence rather than skipping the step.
2. **Compute `estKm` per day and per week**: walk all weeks in
   `data/training-plan.json`. For each day whose `training.type` is
   `easy`/`long`/`recovery`, set `training.estKm` = prescribed minutes ×
   `realZone2Pace_min_km` (parse minutes from `training.detail`; where a day
   mixes an easy portion with an explicit MP-pace segment, e.g. "first 100
   at easy effort, last 20 at 4:20/km", compute each portion with its own
   pace and sum). For `tempo` days, compute distance from the day's own
   explicit rep/pace structure (already a fixed pace, unaffected by this
   step) plus an easy-pace estimate for warmup/cooldown minutes. Skip `swim`
   and `race` days. Sum each week's day-level `estKm` into `week.estKm`.
   Write these fields back into `data/training-plan.json`.
3. **Write `coach.json`'s `volumeCheck` block** (see Step 5 schema) with
   `realZone2Pace_min_km`, today's `thisWeekEstKm`, `peakWeekEstKm` (the
   `week.estKm` for whichever week has the plan's highest value), a
   `referenceNote` comparing that peak to Hal Higdon's "Marathon 3" program
   (this plan's stated inspiration, ~61km/week at its peak) as a well-known
   external reference point, and `flagged: true` if the peak is more than
   ~15% below that reference.
4. **Never auto-edit session durations from this step.** This step only
   estimates and surfaces distance implied by the *current* prescription —
   deciding to actually change a week's prescribed minutes to close a volume
   gap is a training-design decision for the athlete, not something to do
   silently as a side effect of recomputing an estimate.

## Step 5 — Write the output files

Write `data/coach.json` with this exact schema. `recentActivity` is `null`
when Step 4c was skipped (Garmin source, or no Zepp export found). Bike-commute
sessions are never included in it.

```json
{
  "date": "<today's date YYYY-MM-DD>",
  "generatedFor": "<tomorrow's date YYYY-MM-DD>",
  "readiness": {
    "score": <0-100 computed from HRV delta + sleep score + resting-HR delta>,
    "hrv": { "value": <int>, "baseline": <int>, "delta_pct": <int> },
    "restingHR": { "value": <int>, "trend": "normal|elevated|low" },
    "sleep": { "hours": <float>, "score": <int 0-100> },
    "tsb": <float>,
    "ctl": <float>,
    "atl": <float>,
    "lactateThreshold": {
      "estimate_bpm": <int, from the Lactate-threshold reference above>,
      "range_bpm": [<int>, <int>],
      "status": "<provisional|device-reported, matching the reference above>",
      "recovery_bpm": [<int>, <int>],
      "easyAerobic_bpm": [<int>, <int>]
    },
    "vo2max": {
      "value": <float or null>,
      "unit": "ml/kg/min",
      "status": "<manual|garmin_max_metrics>",
      "asOf": "<YYYY-MM-DD>",
      "history": [{"date": "<YYYY-MM-DD>", "value": <float>}]
    }
  },
  "volumeCheck": {
    "realZone2Pace_min_km": <float or null, from Step 4e>,
    "asOf": "<YYYY-MM-DD>",
    "thisWeekEstKm": <float>,
    "peakWeekEstKm": {"week<N>": <float>, ...},
    "referenceNote": "<comparison to Higdon Marathon 3's ~61km/week peak>",
    "flagged": <bool>
  },
  "recommendation": {
    "type": "<easy|tempo|long|race|swim|rest>",
    "title": "<short title>",
    "reasoning": "<2-4 sentences with numbers>",
    "sessionDetail": "<workout instructions>",
    "bikeNote": "<bike commute advice>",
    "swimNote": "<swim advice or empty string>"
  },
  "phase": "<base|build|peak|taper>",
  "daysToRace": <int>,
  "recentActivity": {
    "since": "<YYYY-MM-DD, start of the 7-day window>",
    "sessions": [
      {
        "date": "<YYYY-MM-DD>",
        "type": "<type_name, e.g. outdoor_running>",
        "distance_km": <float>,
        "duration_min": <float>,
        "avg_hr": <int or null>,
        "max_hr": <int or null>,
        "hr_curve": [{"t_min": <int>, "hr": <int>}] or [],
        "avg_pace_min_km": <float or null>,
        "tss": <float>,
        "lesson": "<one-sentence takeaway from this specific activity>"
      }
    ],
    "analysis": "<1-3 sentences: overall volume/TSS trend and any cross-session pattern>"
  }
}
```

Append today's data as a new entry at the end of the **local** history file at `history_path`:
```json
{
  "date": "<today YYYY-MM-DD>",
  "tss": <computed: duration_min/60 * (avg_hr/LTHR)^2 * 100 — hrTSS convention,
          LTHR from the Lactate-threshold reference above (167bpm), not max_hr>,
  "distance_km": <float>,
  "avg_hr": <int or null>,
  "hrv": <int>,
  "resting_hr": <int>,
  "sleep_hours": <float>,
  "sleep_score": <int>
}
```

Create the directory for the history file if it does not exist.

Also update **`data/chart-data.json`** in this repo (the public dashboard file — no biometrics).

**Don't just append today — backfill any gap.** Read the current array and find its last `date`. If any dates in the local history file (from Step 2) fall strictly between that last date and today, `data/chart-data.json` is missing days (this happens whenever `/update-coach` doesn't run every single day, or a Zepp backfill fills in days retroactively — see Step 1). For **every** such missing date, and finally for today, append one entry:

```json
{
  "date": "<YYYY-MM-DD>",
  "tss": <float>,
  "distance_km": <float>,
  "ctl": <float>,
  "atl": <float>,
  "tsb": <float>,
  "readiness_score": <int>,
  "recommendation_type": "<easy|tempo|long|race|swim|rest>"
}
```

- `ctl`/`atl`/`tsb` for a backfilled date: replay the ATL/CTL EWMA (Step 2's formula) forward through the full local history up to and including that date — don't just reuse today's values for every gap day, the chart needs the real day-by-day trajectory.
- `readiness_score` for a backfilled date: recompute with that date's own HRV/sleep/resting-HR against the baseline as it stood *using only entries before that date* (avoid leaking later data into an earlier day's score).
- `recommendation_type` for a backfilled date: use `data/training-plan.json`'s scheduled `training.type` for that date if the date falls within a plan week (e.g. a swim-class day must show `"swim"`, not a generic fallback derived from unrelated tracked activity like a bike commute). If the date is outside the plan entirely (pre-training), fall back to `"rest"` when that day's `tss` is 0, else `"easy"`.

If an entry for today's date already exists (e.g. from a same-day re-run), replace it rather than duplicating.

Fields deliberately omitted from `data/chart-data.json`: `hrv`, `resting_hr`, `sleep_hours`, `sleep_score`, `avg_hr`. These remain only in the local history file.

## Step 6 — Commit and push

```bash
git add data/coach.json data/chart-data.json data/training-plan.json data/training-journal.json
git commit -m "chore: coach update $(date +%Y-%m-%d)"
git push
```

Note: the local history file lives outside the repo at `history_path` and is never committed. `data/history.json` is in `.gitignore`.

Then tell the user:
- Readiness score and the main reason behind it
- Tomorrow's recommendation
- Whether any plan adjustment was made and why
- A brief summary of what changed in the next 14 days' recommendations
- Current LT estimate (167bpm, device-reported) and the %LT bpm target for
  tomorrow's or recent easy/recovery sessions, when relevant — not forced
  into every summary if it doesn't apply
- Current VO2max estimate, when it's on record and relevant — same
  not-forced-into-every-summary qualifier as LT
- The weekly-volume check from Step 4e (`volumeCheck`), when `flagged` is
  true or the number materially changed since last run — not forced into
  every summary either
- The CTL ramp-rate check from the Sub-3h checkpoint reference above, when
  this week's actual delta exceeds whichever ceiling currently applies
- Whether either trigger from the Sub-3h checkpoint reference has newly been
  met: the week 10-11 de-escalation safety valve, or the second
  quality-session trigger — surfaced as a proposal, not a done deal
