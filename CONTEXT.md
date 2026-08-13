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

## Zone history (started 2026-07-31, revised 2026-07-31)

**LT2**:
The anaerobic threshold / maximal lactate steady state — the highest sustainable intensity before blood lactate accumulates faster than it clears. This is what this project's existing `LT` term (167bpm, device-reported) actually measures; devices/watches that report "lactate threshold" are estimating LT2, not LT1.
_Avoid_: max HR, threshold pace

**HR band**:
One of 5 fixed-bpm buckets used to classify *actual recorded* running effort: <130, 130-140, 140-155, 155-167, 167+ (the top edge pinned to LT2 — 167+ is definitionally at/above threshold). Chosen directly as round bpm numbers, not derived from an estimated aerobic threshold — see `docs/adr/0003-hr-bands-replace-seiler-zones.md` for why this replaced the earlier LT1/LT2-anchored Seiler Zone 1/2/3 model. Used only to classify what a session's `hr_curve` actually shows — separate from and never a replacement for this project's existing prescription bands (Recovery/Easy-Aerobic/Threshold, still %LT-of-LT2 and still used to write `training-plan.json`'s easy/recovery/long guidance).
_Avoid_: zone (reserved for the retired Seiler model), training zone

**Average band**:
The HR band containing a single run's *average* HR (not the band with the most minutes — a run can average into a band none of its individual samples were actually in). Used to categorize a whole run by one band for pace comparison, since there's no per-sample GPS distance to split pace by band *within* one run.
_Avoid_: dominant band, primary zone, main band

## Week boundary (started 2026-08-10)

**Plan week**:
The Sunday-Saturday week grouping used structurally throughout `training-plan.json` and the `update-coach` automation — load-bearing, not arbitrary: recovery weeks (4, 8, 12) begin with a reduced Sunday easy run right after the prior week's Saturday long run, and end with a reduced Saturday long run before the next Sunday resumes normal build. The volume-escalation rule's target-week search (Step 4f) and the CTL ramp-rate governance's week-over-week check both operate on this boundary.
_Avoid_: just "week" when Mon-Sun could also be meant, training week

**Athlete week**:
The athlete's own Monday-Sunday mental model of a week — used only when conversationally discussing or reporting "this week's volume" with the athlete. Never used to restructure `training-plan.json`'s day-to-week grouping or the automation that depends on plan weeks; a display/communication convention only.
_Avoid_: just "week" when plan week could also be meant

**Zone history**:
The day-by-day record of time spent in each HR band (plus average %LT and pace), built from running sessions' `hr_curve` only (other activity types, e.g. swimming, don't carry a curve). One entry per day; days with no qualifying running session are simply absent, not zero. Kept the `zone-history.json`/`build_zone_history.py` file names for continuity even after the underlying model moved from Seiler zones to HR bands.
_Avoid_: zone chart, HR history

## Fatigue-finish surge (identified 2026-08-13)

**Fatigue-finish surge**:
An athlete-initiated pace push in the closing portion of a long run, done as often as the athlete can manage regardless of whether that day's prescription includes a formal MP segment — deliberately run at or beyond marathon pace while already fatigued, as fatigue-resistance practice. Confirmed on 2026-08-12 (83:55–93:13 of a 96.5-minute easy-effort long run, pace 4:00-4:20/km against a 4:16-4:20/km MP target, HR 163-173bpm — above the 167bpm LT). A recurring habit, not a one-off; likely present on other past long runs (e.g. 2026-08-04) previously misread as passive drift.
_Avoid_: MP finish (reserved for this plan's *prescribed*, exact-pace long-run segments, e.g. week 9's "last 30 at 4:20/km"), cardiac drift (a passive, fatigue-driven HR rise with no intentional pace change)
