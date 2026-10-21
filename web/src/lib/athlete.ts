import athleteJson from "@data/athlete.json";

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
 * Plan text writes LT-anchored HR as percentages of LTHR, so it never needs
 * re-editing when LT moves: "{LT:95%}" -> 157 and "{LT:100%}" -> 165 at LT 165.
 */
export function resolveLt(text: string, lt: number = LT2): string {
  return text.replace(/\{LT:(\d+(?:\.\d+)?)%\}/g, (_, pct: string) => String(pctOfLt(Number(pct), lt)));
}

/** resolveLt applied to every string inside a JSON value. */
export function resolveLtDeep<T>(value: T, lt: number = LT2): T {
  if (typeof value === "string") return resolveLt(value, lt) as T;
  if (Array.isArray(value)) return value.map((v) => resolveLtDeep(v, lt)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolveLtDeep(v, lt)])) as T;
  }
  return value;
}
