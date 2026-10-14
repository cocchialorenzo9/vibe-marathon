// Season 01 race analysis: Strava laps and Garmin zone history for the
// 2026-10-11 Munich Marathon, condensed from
// docs/checkpoints/2026-10-10-munich-block-review.md.

export const MUNICH = {
  date: "2026-10-11",
  chipTime: "3:19:44",
  chipSeconds: 11984,
  firstHalf: "1:36:24",
  secondHalf: "1:43:48",
  split: "+7:24",
  avgPace: "4:44",
  avgHr: 157,
  carbsPerHour: 63,
  peakWeekKm: 73,
};

/** Watch laps, seconds per km (43 laps: the watch measured 0.8% long). */
export const PACE_PER_KM = [
  325, 271, 278, 276, 270, 274, 277, 278, 277, 268, 271, 274, 275, 276, 274, 272, 276, 272, 274, 272, 270, 271, 278,
  269, 272, 272, 278, 281, 278, 290, 281, 284, 319, 287, 292, 309, 300, 318, 308, 323, 302, 289, 283,
];

/** Average HR per lap, bpm. */
export const HR_PER_KM = [
  159, 163, 161, 158, 160, 162, 161, 162, 160, 162, 160, 159, 157, 158, 157, 157, 157, 158, 159, 160, 161, 162, 159,
  158, 158, 159, 159, 157, 157, 156, 157, 157, 154, 153, 152, 151, 152, 150, 151, 149, 151, 155, 156,
];

/** Weekly running km, 6 Jul – 5 Oct. */
export const BLOCK_WEEKS_KM = [25.3, 26.6, 32.7, 18.4, 44.1, 48.1, 46.1, 25.9, 57.6, 63.3, 68.8, 73.3, 53.6, 16.7];

export const BLOCK = { totalKm: 600, runs: 57, peakWeekKm: 73, longestKm: 31.6 };

/** Minutes of running per HR band, 7 Jul – 8 Oct. */
export const HR_BANDS: { bpm: string; minutes: number; color: string }[] = [
  { bpm: "<130 bpm", minutes: 469, color: "#46505C" },
  { bpm: "130–140 bpm", minutes: 926, color: "#7C93AA" },
  { bpm: "140–155 bpm", minutes: 1221, color: "#A9BCCD" },
  { bpm: "155–167 bpm", minutes: 533, color: "#FF7A3D" },
  { bpm: "167+ bpm", minutes: 137, color: "#FF4D2E" },
];

/** Pre-race finish-time predictions, seconds. */
export const MODELS: { name: string; seconds: number }[] = [
  { name: "Daniels VDOT from 5K", seconds: 11160 },
  { name: "Race-plan pace lane", seconds: 11790 },
  { name: "Tanda training-load model", seconds: 12600 },
];

export const LESSONS = [
  {
    tag: "01 · FUEL",
    title: "The gut was the limit",
    text: "8 honey sips at ~60% concentration gave 63 g/h, with stomach trouble the whole race. Rome adds four fuel tests (A–D) in long runs.",
  },
  {
    tag: "02 · DURABILITY",
    title: "The fade began at km 30",
    text: "Pace held around 4:34 for 29 km, then slipped past 5:00 while heart rate dropped. More volume and longer runs target exactly this.",
  },
  {
    tag: "03 · VOLUME",
    title: "Three runs a week is not enough",
    text: "Munich peaked at 73 km. Rome builds to 5–7 runs and 109.5 km, with marathon-pace work at 4:09/km.",
  },
];

export const COMPARISON: [string, string, string][] = [
  ["Length", "15 weeks", "22 weeks"],
  ["Runs per week", "3", "5–7"],
  ["Peak week", "73.3 km", "109.5 km"],
  ["Longest run", "31.6 km", "34 km"],
  ["Fuel rehearsal", "—", "Tests A–D"],
  ["Goal", "Sub-3", "Sub-3, with 10K and HM checkpoints"],
];
