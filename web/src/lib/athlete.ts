import athleteJson from "../../../data/athlete.json";

/**
 * The athlete's physiological anchors from data/athlete.json — the single
 * source of truth for lactate-threshold HR. A new LT is a one-line edit there.
 */
export const LT2: number = athleteJson.lthr.bpm;
export const HR_BAND_CUTOFFS: number[] = athleteJson.hrBandCutoffs;

/** bpm at `pct`% of LT, rounded. */
export function pctOfLt(pct: number, lt: number = LT2): number {
  return Math.round((lt * pct) / 100);
}

/**
 * The plan writes heart rate the way Intervals.icu does, as % LTHR; this
 * shows it in bpm: "HR cap 85% LTHR" -> "HR cap 140 bpm", "95-99% LTHR" ->
 * "157-163 bpm" at LT 165.
 */
export function lthrToBpm(text: string, lt: number = LT2): string {
  return text.replace(/(\d+(?:\.\d+)?)(?:-(\d+(?:\.\d+)?))?% LTHR/g, (_, a: string, b?: string) =>
    b ? `${pctOfLt(Number(a), lt)}-${pctOfLt(Number(b), lt)} bpm` : `${pctOfLt(Number(a), lt)} bpm`,
  );
}

/** lthrToBpm applied to every string inside a JSON value. */
export function lthrToBpmDeep<T>(value: T, lt: number = LT2): T {
  if (typeof value === "string") return lthrToBpm(value, lt) as T;
  if (Array.isArray(value)) return value.map((v) => lthrToBpmDeep(v, lt)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, lthrToBpmDeep(v, lt)])) as T;
  }
  return value;
}
