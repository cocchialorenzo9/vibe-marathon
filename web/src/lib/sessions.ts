import sessionsJson from "../../../data/sessions.json";
import { HR_BAND_CUTOFFS, LT2 } from "./athlete";
import { daysBetween, hrCap, romePlan, weekdayDate, type PlanDay, type PlanWeek } from "./plan";

/**
 * What actually happened on a plan day, as synced from Strava into
 * data/sessions.json by the sync-sessions scheduled task.
 * - done:  run on the planned day, inside the plan's HR cap
 * - over:  run on the planned day, average or a lap over the HR cap
 * - extra: something was done on a day that didn't plan it (usually a moved session)
 * - moved: the planned session was done on another day instead (see movedTo)
 * - none:  nothing recorded for a planned session
 * - rest:  rest day, rested
 */
export type SessionStatus = "done" | "over" | "extra" | "moved" | "none" | "rest";

export interface Lap {
  /** Lap length in km (1 for full kilometre splits). */
  km: number;
  sec: number;
  hr: number;
}

export interface Activity {
  stravaId: string;
  sport: string;
  distanceKm: number;
  movingSec: number;
  avgHr: number | null;
  maxHr: number | null;
  hrNote?: string;
  laps: Lap[];
}

export interface SessionDay {
  date: string;
  status: SessionStatus;
  headline: string;
  summary: string;
  movedTo?: string;
  movedFrom?: string;
  activity?: Activity;
  learn: string[];
}

export interface SessionLog {
  source: string;
  syncedAt: string;
  days: SessionDay[];
}

export const sessionLog = sessionsJson as unknown as SessionLog;

const byDate = new Map(sessionLog.days.map((d) => [d.date, d]));
const planDays = romePlan.weeks.flatMap((w) => w.days);
const planByDate = new Map(planDays.map((d) => [d.date, d]));

export function sessionOn(iso: string): SessionDay | undefined {
  return byDate.get(iso);
}

/** Badge, colour and wording for each status; `pending` is a past day the sync hasn't written yet. */
export const STATUS: Record<SessionStatus | "pending", { label: string; line: string; badge: string; color: string }> = {
  done: { label: "DONE", line: "Done", badge: "✓", color: "#7ee89a" },
  over: { label: "OVER HR CAP", line: "Over HR cap", badge: "!", color: "#ffb08a" },
  extra: { label: "RAN · NOT PLANNED TODAY", line: "Ran", badge: "+", color: "#c8bfff" },
  moved: { label: "MOVED", line: "Moved", badge: "→", color: "#c8bfff" },
  none: { label: "NOT LOGGED", line: "Not logged", badge: "–", color: "#97a1ad" },
  rest: { label: "REST ✓", line: "Rested", badge: "✓", color: "#7e8894" },
  pending: { label: "NOT SYNCED", line: "Not synced yet", badge: "?", color: "#7e8894" },
};

/** The HR cap the session was run against: a moved session keeps the cap of the day it came from. */
export function capFor(s: SessionDay): number | null {
  const plan = planByDate.get(s.movedFrom ?? s.date);
  return plan ? hrCap(plan.training) : null;
}

/** 352 -> "5:52" */
export function mmss(sec: number): string {
  const s = Math.round(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function paceOf(sec: number, km: number): string {
  return km > 0 ? `${mmss(sec / km)} /km` : "—";
}

export { LT2 };

/** The plan's HR bands (ADR 0003); the top edge is pinned to LT2. */
const BAND_EDGES = [...HR_BAND_CUTOFFS, LT2];
export const HR_BANDS: { lo: number | null; hi: number | null; label: string }[] = [
  ...BAND_EDGES.map((hi, i) => ({
    lo: i === 0 ? null : BAND_EDGES[i - 1],
    hi,
    label: i === 0 ? `< ${hi}` : `${BAND_EDGES[i - 1]}–${hi}`,
  })),
  { lo: LT2, hi: null, label: `${LT2}+` },
];

/** Index into HR_BANDS of the band that contains `hr` (the run's "average band" when given its average). */
export function bandOf(hr: number): number {
  return HR_BANDS.findIndex((b) => (b.lo === null || hr >= b.lo) && (b.hi === null || hr < b.hi));
}

export type Tone = "neutral" | "warn" | "bad" | "good";

export interface CompareRow {
  key: string;
  plan: string;
  done: string;
  diff: string;
  tone: Tone;
}

const signedKm = (km: number) => `${km >= 0 ? "+" : "−"}${Math.abs(km).toFixed(2)} km`;
const signedTime = (sec: number) => `${sec >= 0 ? "+" : "−"}${mmss(Math.abs(sec))}`;

/** Planned-vs-done rows for one day. `plan` is the plan day the session was meant for. */
export function compareRows(s: SessionDay, plan: PlanDay): CompareRow[] {
  const a = s.activity;
  const cap = capFor(s);
  const planKm = plan.estKm;
  const planSec = plan.estMin.run * 60;

  if (!a) {
    if (s.status === "rest") return [{ key: "Activity", plan: "rest", done: "rest", diff: "✓", tone: "good" }];
    const diff = s.status === "moved" ? "moved" : "not logged";
    const rows: CompareRow[] = [];
    if (planKm) rows.push({ key: "Distance", plan: `${planKm} km`, done: "—", diff, tone: "warn" });
    rows.push({ key: "Duration", plan: plan.estMin.total ? mmss(plan.estMin.total * 60) : "—", done: "—", diff, tone: "warn" });
    if (cap) rows.push({ key: "HR cap", plan: `≤ ${cap}`, done: "—", diff: "", tone: "neutral" });
    return rows;
  }

  const rows: CompareRow[] = [];
  if (s.movedFrom) {
    const shift = daysBetween(s.movedFrom, s.date);
    rows.push({
      key: "Day",
      plan: weekdayDate(s.movedFrom),
      done: weekdayDate(s.date),
      diff: `${shift > 0 ? "+" : "−"}${Math.abs(shift)} day${Math.abs(shift) === 1 ? "" : "s"}`,
      tone: "warn",
    });
  }
  rows.push({
    key: "Distance",
    plan: planKm ? `${planKm} km` : "—",
    done: `${a.distanceKm.toFixed(2)} km`,
    diff: planKm ? signedKm(a.distanceKm - planKm) : "",
    tone: "neutral",
  });
  rows.push({
    key: "Time",
    plan: planSec ? mmss(planSec) : "—",
    done: mmss(a.movingSec),
    diff: planSec ? signedTime(a.movingSec - planSec) : "",
    tone: "neutral",
  });
  if (planKm && planSec && a.distanceKm > 0) {
    const delta = Math.round(a.movingSec / a.distanceKm - planSec / planKm);
    rows.push({
      key: "Pace",
      plan: `~${paceOf(planSec, planKm)}`,
      done: paceOf(a.movingSec, a.distanceKm),
      diff: delta === 0 ? "on pace" : `${Math.abs(delta)} s ${delta < 0 ? "faster" : "slower"}`,
      tone: delta < -10 ? "warn" : "neutral",
    });
  }
  if (a.avgHr != null) {
    const over = cap != null && a.avgHr > cap;
    rows.push({
      key: "Avg HR",
      plan: cap ? `≤ ${cap}` : "—",
      done: `${a.avgHr} bpm`,
      diff: cap ? (over ? `+${a.avgHr - cap} over cap` : "under cap") : "",
      tone: cap ? (over ? "bad" : "good") : "neutral",
    });
  }
  if (a.maxHr != null && cap) {
    rows.push({
      key: "Max HR",
      plan: `≤ ${cap}`,
      done: `${a.maxHr} bpm`,
      diff: a.maxHr > cap ? `+${a.maxHr - cap}` : "under cap",
      tone: a.maxHr > cap ? "bad" : "good",
    });
  }
  return rows;
}

const isRun = (a?: Activity) => !!a && /run/i.test(a.sport);

/** Did a run stay under its cap: average and every full lap at or below it. */
export function keptCap(s: SessionDay): boolean | null {
  const cap = capFor(s);
  const a = s.activity;
  if (!cap || !a || !isRun(a)) return null;
  return (a.avgHr ?? 0) <= cap && a.laps.every((l) => l.hr <= cap);
}

/** Planned vs done totals for one plan week, counting only the days synced so far. */
export function weekProgress(week: PlanWeek) {
  const logged = week.days.map((d) => byDate.get(d.date)).filter((s): s is SessionDay => !!s);
  const runs = logged.filter((s) => isRun(s.activity));
  const capChecks = runs.map(keptCap).filter((k): k is boolean => k !== null);
  return {
    kmDone: Math.round(runs.reduce((sum, s) => sum + s.activity!.distanceKm, 0) * 10) / 10,
    kmPlanned: week.estKm,
    runsDone: runs.length,
    runsPlanned: week.days.filter((d) => d.training.type !== "swim" && (d.estKm ?? 0) > 0).length,
    capKept: capChecks.filter(Boolean).length,
    capRuns: capChecks.length,
    onPlanDay: runs.filter((s) => !s.movedFrom).length,
  };
}

/** Pfitzinger's name for a session, as a plain-language comparison (no %max-HR zones; see ADR 0003). */
export function pfitzingerName(day: PlanDay): { name: string; what: string } {
  const { type, title } = day.training;
  if (type === "rest" || type === "swim") return { name: "Rest or cross-training", what: "No running. Easy swimming or cycling counts as recovery." };
  if (type === "race") return { name: "Tune-up race", what: "Race effort. Pfitzinger uses 8K–15K tune-ups in the last weeks." };
  if (/recovery/i.test(title)) return { name: "Recovery run", what: "Short and relaxed. Its job is blood flow, not fitness." };
  if (/lactate|LT field|threshold/i.test(title)) return { name: "Lactate-threshold run", what: "Continuous tempo at 15K to half-marathon race pace." };
  if (/VO2/i.test(title)) return { name: "VO₂max intervals", what: "600 m to 1,600 m repeats at 5K race pace, with jog recovery." };
  if (/MP|marathon-pace|race-pace/i.test(title)) return { name: "Marathon-pace run", what: "Race-specific: long stretches at goal marathon pace." };
  if (type === "long" || type === "medium-long") return { name: "Long / medium-long run", what: "Endurance at a steady effort; a little quicker at the end if fresh." };
  return { name: "General aerobic run", what: "Steady easy running that builds the aerobic base." };
}

/** The plan day a session was meant for: its own day, or the day it was moved from. */
export function plannedFor(s: SessionDay): PlanDay | undefined {
  return planByDate.get(s.movedFrom ?? s.date);
}
