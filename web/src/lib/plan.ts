import romePlanJson from "../../../data/training-plan-rome-2027.json";

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

export const romePlan = romePlanJson as unknown as Plan;

export const PHASE_LABELS: Record<Phase, string> = {
  recovery: "Recovery",
  base: "Base",
  specific: "Specific",
  taper: "Taper",
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
