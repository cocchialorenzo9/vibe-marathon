import { LT2, lthrToBpm, pctOfLt } from "./athlete";

/**
 * A plan day's `training.workout` is Intervals.icu workout text — the one
 * source for both the watch and this site. Paragraphs with "- " step lines
 * are the structure (an optional header line, e.g. "Strides 6x"); every
 * other paragraph is coaching notes.
 */
export interface WorkoutBlock {
  header: string | null;
  steps: string[];
}

export function parseWorkout(text: string): { blocks: WorkoutBlock[]; notes: string } {
  const blocks: WorkoutBlock[] = [];
  const notes: string[] = [];
  for (const para of text.split(/\n\s*\n/)) {
    const lines = para.split("\n").map((l) => l.trim()).filter(Boolean);
    const steps = lines.filter((l) => l.startsWith("- ")).map((l) => l.slice(2));
    if (steps.length === 0) {
      notes.push(lines.join("\n"));
      continue;
    }
    const header = lines[0].startsWith("- ") ? null : lines[0];
    blocks.push({ header, steps });
  }
  return { blocks, notes: notes.join("\n\n") };
}

const UNITS: [RegExp, string][] = [
  [/^(\d+)m(\d+)s$/, "$1′$2″"],
  [/^(\d+(?:\.\d+)?)km$/, "$1 km"],
  [/^(\d+)m$/, "$1 min"],
  [/^(\d+)s$/, "$1 s"],
];

/** "30m 60-85% LTHR" -> "30 min, HR ≤140"; "4km 4:09/km Pace" -> "4 km at 4:09/km". */
export function renderStep(step: string, lt: number = LT2): string {
  const [size, ...rest] = step.replace(/ intensity=\w+/, "").split(" ");
  let length = size;
  for (const [re, out] of UNITS) if (re.test(size)) length = size.replace(re, out);
  if (/^\d+m$/.test(size) && Number(size.slice(0, -1)) >= 100) length = `${size.slice(0, -1)} m`; // 1200m is metres
  const target = rest.join(" ");
  const floorCap = target.match(/^60-(\d+(?:\.\d+)?)% LTHR$/);
  if (floorCap) return `${length}, HR ≤${pctOfLt(Number(floorCap[1]), lt)}`;
  if (/% LTHR$/.test(target)) return `${length} at HR ${lthrToBpm(target, lt).replace(" bpm", "")}`;
  const pace = target.match(/^(\d:\d\d\/km) Pace$/);
  if (pace) return `${length} at ${pace[1]}`;
  return target ? `${length} ${target}` : length;
}

/** The workout as one readable line plus its notes, HR in bpm — what the site shows as the session. */
export function renderWorkout(text: string, lt: number = LT2): string {
  const { blocks, notes } = parseWorkout(text);
  const structure = blocks
    .map(({ header, steps }) => {
      const body = steps.map((s) => renderStep(s, lt)).join(", ");
      const reps = header?.match(/(\d+)x$/);
      if (reps) return `${header!.replace(/\s*\d+x$/, "")} ${reps[1]}× (${body})`;
      return header ? `${header}: ${body}` : body;
    })
    .join(" -> ");
  const prose = lthrToBpm(notes, lt);
  return [structure && `${structure}.`, prose].filter(Boolean).join(" ");
}
