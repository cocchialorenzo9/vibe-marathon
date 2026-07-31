# vibe-marathon

A single athlete's marathon training plan and daily coaching loop. `data/training-plan.json` is the prescribed schedule; `data/coach.json`, `data/training-journal.json`, and the local history file capture what actually happened; the `update-coach` skill reconciles the two on every run.

## Language

**CTL (Chronic Training Load)**:
Exponentially-weighted 42-day average of daily TSS — the athlete's longer-horizon fitness/fatigue-capacity proxy.
_Avoid_: fitness score, base fitness

**ATL (Acute Training Load)**:
Exponentially-weighted 7-day average of daily TSS — short-horizon fatigue proxy.
_Avoid_: fatigue score

**TSB (Training Stress Balance)**:
CTL minus ATL — the day-to-day readiness/freshness signal used to gate session intensity.
_Avoid_: freshness, form

**LT (Lactate Threshold)**:
The heart-rate (bpm) anchor all effort zones in this plan are computed from; currently 167bpm, device-reported and unconfirmed until the Aug 4 field test.
_Avoid_: threshold pace, max HR

**CTL ramp-rate governance**:
The rule capping how fast CTL is allowed to rise (3-5 points/week while HRV/TSB aren't both green), regardless of what a session's written prescription says — a brake on the *written* schedule, not a target to hit.
_Avoid_: volume ceiling, mileage cap

**De-escalation safety valve**:
The standing rule (from the 2026-07-18 checkpoint) to propose scaling weeks 10-11's long runs back down if CTL ran hotter than the ramp-rate ceiling, or HRV/TSB stayed red, in the weeks leading into them. A proposal to the athlete, never a silent edit.
_Avoid_: rollback, safety net

**Recovery week**:
A scheduled week (currently 4, 8, 12) where both intensity and, for add-on days, frequency drop. Existing "core" sessions get shortened/slowed rather than removed, but days added purely for extra volume are dropped entirely.
_Avoid_: deload week, easy week

**Quality session / quality day**:
A scheduled session run at tempo, LT-cruise, or marathon-pace effort, as opposed to easy/aerobic volume.
_Avoid_: hard day, workout

## Volume recalibration (started 2026-07-29)

**Volume recalibration**:
The effort to raise this plan's weekly running volume (peaking ~51-61km/week) toward what research suggests better predicts a sub-3h finish, without changing the fixed sub-3h goal itself.
_Avoid_: mileage bump, plan rewrite

**Static bump**:
The near-term half of the volume recalibration — concrete, fixed session/volume changes written directly into `training-plan.json` now, before there's real data on how the athlete responds to more volume.
_Avoid_: quick fix, immediate change

**Volume-escalation rule**:
The longer-horizon half of the volume recalibration — an `update-coach` rule, active from week 7 onward, that re-evaluates on every run but only ever writes new numbers into the next week that hasn't started yet (never the current or a past week). It raises both easy volume (via the Sunday easy run and existing session durations) and quality volume together, spending the existing CTL ramp-rate governance's headroom, so the 80/20 target holds as total volume grows. The escalation-direction counterpart to the de-escalation safety valve.
_Avoid_: volume-ramp rule, dynamic bump

**Sunday easy run**:
A new easy/recovery-effort running day placed after Saturday's long run — the primary mechanism for the volume recalibration (added frequency, not longer individual sessions). Full-length in normal build/peak weeks; a short (~15-20min) version in recovery weeks; entirely absent during taper. Weeks 5-6 are the static bump; week 7 onward is governed by the volume-escalation rule.
_Avoid_: Sunday day, bonus run, extra day

**Quality volume**:
The at-effort distance within a tempo/LT-cruise/MP-segment session only — excluding that same session's warmup, cooldown, and float/jog recovery, which count as easy volume even though the session's own `training.type` is "tempo" or "long". Distinct from "quality session," which refers to the whole session.
_Avoid_: tempo km, hard volume

**80/20 target**:
The volume recalibration's ratio constraint: quality volume held at a fixed ~20% share of each week's total volume, with the other ~80% easy. Unlike the CTL ramp-rate governance (a ceiling nothing is meant to hit), this is an active target — as total volume grows, quality volume (more/longer reps in existing sessions) grows with it to keep the ratio, rather than staying flat while easy volume dilutes its share.
_Avoid_: quality ceiling, intensity cap

## Zone history (started 2026-07-31)

**LT2**:
The anaerobic threshold / maximal lactate steady state — the highest sustainable intensity before blood lactate accumulates faster than it clears. This is what this project's existing `LT` term (167bpm, device-reported) actually measures; devices/watches that report "lactate threshold" are estimating LT2, not LT1.
_Avoid_: max HR, threshold pace

**LT1**:
The aerobic threshold — the highest intensity at which blood lactate is still near baseline. Currently estimated at ~125bpm (~75% of LT2), a field-test heuristic from training-science literature, not a real test result — provisional until a dedicated LT1 field test exists (distinct from the LT2-focused Aug 4 field test).
_Avoid_: easy threshold, zone 1 ceiling

**Training zone (1/2/3)**:
The Seiler three-zone classification of *actual recorded* effort, anchored on LT1/LT2: Zone 1 below LT1 (true easy), Zone 2 between LT1 and LT2 ("moderate," associated in marathon/Ironman research with worse performance when it dominates volume), Zone 3 above LT2 (hard). Used only to classify what a session's `hr_curve` actually shows — separate from and never a replacement for this project's existing prescription bands (Recovery/Easy-Aerobic/Threshold, still %LT-of-LT2 and still used to write `training-plan.json`'s easy/recovery/long guidance).
_Avoid_: HR zone (ambiguous with the prescription bands), zone 4/5 (not part of this 3-zone scale)

**Zone history**:
The day-by-day record of time spent in each training zone, built from running sessions' `hr_curve` only (other activity types, e.g. swimming, don't carry a curve). One bar/point per day; days with no qualifying running session are simply absent, not zero.
_Avoid_: zone chart, HR history
