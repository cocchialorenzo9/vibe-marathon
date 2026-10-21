import romePlanJson from "@data/training-plan-rome-2027.json";
import { resolveLtDeep } from "./athlete";

export type SessionType =
  | "rest"
  | "easy"
  | "tempo"
  | "medium-long"
  | "long"
  | "swim"
  | "race";

export type Phase = "recovery" | "base" | "specific" | "taper";

export interface PlanDay {
  date: string; // YYYY-MM-DD
  dayLabel: string;
  training: { type: SessionType; title: string; detail: string; estKm: number | null };
  movement: string;
  food: string;
  bigPicture: string;
  estKm: number | null;
  estMin: { run: number; swim: number; strength: number; total: number };
}

export interface PlanWeek {
  week: number;
  phase: Phase;
  label: string;
  tip: string;
  estKm: number;
  estHours?: { run: number; swim: number; strength: number; total: number };
  days: PlanDay[];
}

export interface Gate {
  week: number;
  date: string;
  name: string;
  rule: string;
}

export interface Plan {
  race: string;
  generatedAt: string;
  raceDate: string;
  weeks: PlanWeek[];
  gates: Gate[];
}

/** HR written as "{LT:95%}"-style %LTHR tokens in the plan JSON resolves against data/athlete.json here. */
export const romePlan = resolveLtDeep(romePlanJson) as unknown as Plan;

export const PHASE_LABELS: Record<Phase, string> = {
  recovery: "Recovery",
  base: "Base",
  specific: "Specific",
  taper: "Taper",
};

export const PHASE_COLORS: Record<Phase, string> = {
  recovery: "var(--gray)",
  base: "var(--slate)",
  specific: "var(--accent)",
  taper: "var(--orange)",
};

/** Calendar colours per session type; `ink` is the text colour on top of `color`. */
export const SESSION_TYPES: Record<SessionType, { label: string; color: string; ink: string }> = {
  easy: { label: "Easy", color: "#5b8db8", ink: "#06121c" },
  "medium-long": { label: "Medium-long", color: "#a497ff", ink: "#0d0a24" },
  long: { label: "Long", color: "#ffc23d", ink: "#1f1600" },
  tempo: { label: "Quality", color: "#ff7a3d", ink: "#1f0c02" },
  race: { label: "Race", color: "#ff3d6e", ink: "#22030b" },
  swim: { label: "Swim", color: "#3dd6e0", ink: "#02191b" },
  rest: { label: "Rest", color: "#2b323b", ink: "#c9d1da" },
};

const DAY_MS = 86_400_000;

/** Local calendar date as YYYY-MM-DD (the plan is written in Munich time). */
export function isoDate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function parseIso(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((parseIso(toIso).getTime() - parseIso(fromIso).getTime()) / DAY_MS);
}

export interface PlanPosition {
  /** The day shown as "today": clamped to the plan's first or last day. */
  today: PlanDay;
  tomorrow: PlanDay | null;
  week: PlanWeek;
  daysToGo: number;
  status: "before" | "during" | "after";
}

export function locate(plan: Plan, todayIso: string): PlanPosition {
  const days = plan.weeks.flatMap((w) => w.days);
  const first = days[0];
  const last = days[days.length - 1];
  let idx = days.findIndex((d) => d.date === todayIso);
  let status: PlanPosition["status"] = "during";
  if (idx === -1) {
    if (todayIso < first.date) {
      idx = 0;
      status = "before";
    } else {
      idx = days.length - 1;
      status = "after";
    }
  }
  const today = days[idx];
  const week = plan.weeks.find((w) => w.days.includes(today)) ?? plan.weeks[0];
  return {
    today,
    tomorrow: status === "during" ? days[idx + 1] ?? null : null,
    week,
    daysToGo: Math.max(0, daysBetween(todayIso, last.date)),
    status,
  };
}

/** "Pool session -- easy swim" -> "Easy swim". */
export function shortTitle(title: string): string {
  const part = title.split(" -- ").pop() ?? title;
  return part.charAt(0).toUpperCase() + part.slice(1);
}

export function hrCap(detail: string): number | null {
  const m = detail.match(/HR (?:cap|<=|≤)\s*(\d{3})/i);
  return m ? Number(m[1]) : null;
}

/** "Post-Munich recovery: Marathon..." or "Post-Munich recovery (recovery)." -> "Post-Munich recovery". */
export function blockName(day: PlanDay): string {
  return day.bigPicture.split(/[:(]/)[0].replace(/\.$/, "").trim();
}

export function weekCounts(week: PlanWeek) {
  const runs = week.days.filter((d) => (d.estKm ?? 0) > 0).length;
  const swims = week.days.filter((d) => d.estMin.swim > 0).length;
  return { runs, swims };
}

/** Short one-line summary for a day tile. */
export function daySubtitle(day: PlanDay): string {
  const cap = hrCap(day.training.detail);
  if (cap && day.estMin.run > 0) return `HR ≤${cap} · ${day.estMin.run}′`;
  const first = day.training.detail.split(/[.;(]/)[0].trim();
  return first.length > 34 ? `${first.slice(0, 32).trimEnd()}…` : first;
}

export function dayValue(day: PlanDay): string {
  if (day.estKm) return `${formatKm(day.estKm)} km`;
  if (day.estMin.total > 0) return `${day.estMin.total}′`;
  return "—";
}

export function formatKm(km: number): string {
  return Number.isInteger(km) ? String(km) : km.toFixed(1);
}

/** Gate names carry editorial notes in parentheses; the card shows the name only. */
export function gateName(name: string): string {
  return name.replace(/\s*\(.*\)\s*$/, "");
}

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

/** "2026-10-14" -> "WED 14 OCT" */
export function dayStamp(iso: string): string {
  const d = parseIso(iso);
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** "2026-10-14" -> "14 OCT" */
export function shortDate(iso: string): string {
  const d = parseIso(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** "2026-10-14" -> "WED 14" */
export function weekdayDate(iso: string): string {
  const d = parseIso(iso);
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()}`;
}

/** Week range like "12–18 OCT" or "26 OCT–1 NOV". */
export function weekRange(week: PlanWeek): string {
  const a = parseIso(week.days[0].date);
  const b = parseIso(week.days[week.days.length - 1].date);
  return a.getMonth() === b.getMonth()
    ? `${a.getDate()}–${b.getDate()} ${MONTHS[b.getMonth()]}`
    : `${a.getDate()} ${MONTHS[a.getMonth()]}–${b.getDate()} ${MONTHS[b.getMonth()]}`;
}

/** The plan appends the home strength block to the session text; split it back out. */
export function splitStrength(detail: string): { session: string; strength: string | null } {
  const at = detail.indexOf("HOME STRENGTH");
  if (at === -1) return { session: detail.trim(), strength: null };
  return { session: detail.slice(0, at).trim(), strength: detail.slice(at).trim() };
}

/** ASCII stand-ins in the plan JSON ("--", "<=") rendered as typography. */
export function prose(text: string): string {
  return text.replace(/ -- /g, " — ").replace(/<=/g, "≤");
}

/** "Long run (fuel test A)" -> "Long run"; also drops the "Pool session --" prefix. */
export function tileTitle(title: string): string {
  return shortTitle(title).split(" (")[0];
}

/** Fuel test letter run in this week's long run, if any. */
export function fuelTest(week: PlanWeek): string | null {
  for (const d of week.days) {
    const m = d.training.title.match(/fuel test ([A-Z])\b/i);
    if (m) return m[1].toUpperCase();
  }
  return null;
}

/** 95 -> "1h 35′", 40 -> "40′", 0 -> "—" */
export function formatMinutes(min: number): string {
  if (!min) return "—";
  return min >= 60 ? `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, "0")}′` : `${min}′`;
}

const WEEKDAYS_LONG = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

/** "2026-11-03" -> "TUESDAY · 3 NOV 2026" */
export function dateLong(iso: string): string {
  const d = parseIso(iso);
  return `${WEEKDAYS_LONG[d.getDay()]} · ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
