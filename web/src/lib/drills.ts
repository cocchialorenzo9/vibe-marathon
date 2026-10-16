import type { Muscle } from "react-body-highlighter";

/**
 * The home-strength drills in the Rome plan, and the stick-figure loops that
 * show them. Poses are joint positions in a 120×132 SVG box (ground at y=110);
 * an animation holds each frame for `h` ms, then eases to the next over `d` ms.
 */

export type DrillKind =
  | "bss"
  | "splitsquat"
  | "rdl"
  | "calf"
  | "bridge"
  | "hipthrust"
  | "sideplank"
  | "copenhagen"
  | "pogo"
  | "skip"
  | "boxjump"
  | "deadbug"
  | "bounds"
  | "splitjump"
  | "lateral";

export type Limb = "legNear" | "legFar" | "torso";
type Pt = [number, number];
const JOINTS = ["H", "N", "P", "K1", "F1", "T1", "K2", "F2", "T2", "E1", "W1", "E2", "W2"] as const;
type Joint = (typeof JOINTS)[number];
export type Pose = Record<Joint, Pt>;
type PartialPose = Partial<Pose> & Omit<Pose, "T1" | "T2">;
type Frame = { h: number; d: number; p: PartialPose };
export type Box = { x: number; y: number; w: number; h: number };
type Motion = { hi: Limb[]; frames: Frame[]; p1?: Box; p2?: Box };

const S0: PartialPose = {
  H: [60, 20], N: [60, 32], P: [60, 62], K1: [62, 85], F1: [61, 107], K2: [58, 85], F2: [57, 107],
  E1: [63, 47], W1: [64, 61], E2: [57, 47], W2: [56, 61],
};
const mv = (p: PartialPose, dx: number, dy: number): PartialPose =>
  Object.fromEntries(Object.entries(p).map(([k, v]) => [k, [v[0] + dx, v[1] + dy]])) as PartialPose;
const pz = (base: PartialPose, over: Partial<Pose>): PartialPose => ({ ...base, ...over });
const pointToes = (p: PartialPose) => pz(p, { T1: [p.F1[0] + 4, p.F1[1] + 7], T2: [p.F2[0] + 4, p.F2[1] + 7] });
// Facing the viewer, for the side-to-side hops.
const front = (cx: number, dy: number, bend: number): PartialPose => ({
  H: [cx, 20 + dy + bend], N: [cx, 32 + dy + bend], P: [cx, 62 + dy + bend], K1: [cx + 6, 85 + dy], F1: [cx + 5, 107 + dy],
  T1: [cx + 10, 108 + dy], K2: [cx - 6, 85 + dy], F2: [cx - 5, 107 + dy], T2: [cx - 10, 108 + dy],
  E1: [cx + 11, 46 + dy + bend], W1: [cx + 14, 58 + dy + bend], E2: [cx - 11, 46 + dy + bend], W2: [cx - 14, 58 + dy + bend],
});
const pogoG = pz(S0, { K1: [64, 85], K2: [60, 85], E1: [66, 46], W1: [73, 50], E2: [54, 46], W2: [61, 52] });
const calfPose = (dy: number) => mv(pz(S0, { K2: [58, 85], F2: [49, 95], T2: [44, 99], E1: [76, 40], W1: [96, 42] }), 0, dy);
const stand = pz(S0, { K1: [63, 84], K2: [59, 84] });
const deadbugRest: PartialPose = {
  H: [16, 96], N: [28, 100], P: [60, 102], K1: [62, 80], F1: [82, 80], T1: [86, 74], K2: [60, 80], F2: [80, 80], T2: [84, 74],
  E1: [30, 86], W1: [32, 72], E2: [28, 86], W2: [30, 72],
};

const MOTIONS: Record<DrillKind, Motion> = {
  bss: { hi: ["legNear"], p1: { x: 6, y: 84, w: 32, h: 26 }, frames: [
    { h: 220, d: 900, p: { H: [62, 20], N: [62, 32], P: [58, 61], K1: [70, 83], F1: [74, 107], K2: [47, 88], F2: [30, 82], T2: [22, 85], E1: [63, 46], W1: [64, 60], E2: [59, 46], W2: [58, 60] } },
    { h: 160, d: 900, p: { H: [64, 38], N: [63, 50], P: [55, 78], K1: [76, 80], F1: [74, 107], K2: [47, 102], F2: [30, 82], T2: [22, 85], E1: [64, 64], W1: [65, 78], E2: [60, 64], W2: [59, 78] } } ] },
  splitsquat: { hi: ["legNear"], frames: [
    { h: 220, d: 900, p: { H: [60, 20], N: [60, 32], P: [58, 62], K1: [70, 84], F1: [74, 107], K2: [47, 85], F2: [38, 103], T2: [46, 109], E1: [61, 46], W1: [62, 60], E2: [57, 46], W2: [56, 60] } },
    { h: 160, d: 900, p: { H: [60, 38], N: [60, 50], P: [56, 80], K1: [76, 82], F1: [74, 107], K2: [48, 104], F2: [34, 102], T2: [42, 109], E1: [61, 64], W1: [62, 78], E2: [57, 64], W2: [56, 78] } } ] },
  rdl: { hi: ["legNear"], frames: [
    { h: 300, d: 1200, p: pz(S0, { K2: [57, 84], F2: [55, 102] }) },
    { h: 250, d: 1200, p: { H: [94, 46], N: [84, 52], P: [58, 62], K1: [62, 85], F1: [61, 107], K2: [38, 60], F2: [16, 60], T2: [17, 67], E1: [84, 66], W1: [84, 80], E2: [82, 66], W2: [81, 80] } } ] },
  calf: { hi: ["legNear"], p1: { x: 56, y: 96, w: 40, h: 14 }, p2: { x: 100, y: 0, w: 4, h: 110 }, frames: [
    { h: 200, d: 800, p: pz(calfPose(-8), { F1: [60, 99], T1: [67, 96] }) },
    { h: 300, d: 800, p: pz(calfPose(-19), { F1: [60, 88], T1: [67, 96] }) } ] },
  bridge: { hi: ["legNear", "torso"], frames: [
    { h: 200, d: 800, p: { H: [18, 100], N: [30, 104], P: [60, 105], K1: [78, 84], F1: [88, 106], T1: [96, 108], K2: [80, 95], F2: [100, 86], T2: [103, 79], E1: [42, 106], W1: [54, 107], E2: [42, 105], W2: [54, 106] } },
    { h: 400, d: 800, p: { H: [18, 100], N: [30, 104], P: [60, 84], K1: [80, 80], F1: [88, 106], T1: [96, 108], K2: [82, 76], F2: [102, 68], T2: [105, 61], E1: [42, 106], W1: [54, 107], E2: [42, 105], W2: [54, 106] } } ] },
  hipthrust: { hi: ["legNear", "torso"], p1: { x: 4, y: 84, w: 30, h: 26 }, frames: [
    { h: 200, d: 800, p: { H: [18, 76], N: [30, 82], P: [50, 104], K1: [72, 86], F1: [84, 106], T1: [92, 108], K2: [72, 94], F2: [94, 90], T2: [97, 83], E1: [34, 92], W1: [40, 100], E2: [33, 92], W2: [39, 100] } },
    { h: 400, d: 800, p: { H: [18, 76], N: [30, 82], P: [60, 82], K1: [80, 80], F1: [84, 106], T1: [92, 108], K2: [82, 76], F2: [104, 68], T2: [107, 61], E1: [34, 92], W1: [40, 100], E2: [33, 92], W2: [39, 100] } } ] },
  sideplank: { hi: ["torso"], frames: [
    { h: 900, d: 900, p: { H: [20, 70], N: [30, 78], P: [62, 90], K1: [82, 98], F1: [100, 106], T1: [103, 99], K2: [81, 99], F2: [99, 107], T2: [102, 100], E1: [32, 62], W1: [34, 46], E2: [30, 106], W2: [42, 107] } },
    { h: 200, d: 900, p: { H: [20, 71], N: [30, 79], P: [62, 96], K1: [82, 101], F1: [100, 106], T1: [103, 99], K2: [81, 102], F2: [99, 107], T2: [102, 100], E1: [32, 63], W1: [34, 47], E2: [30, 106], W2: [42, 107] } } ] },
  copenhagen: { hi: ["legNear", "legFar"], p1: { x: 84, y: 86, w: 32, h: 24 }, frames: [
    { h: 300, d: 1000, p: { H: [20, 68], N: [30, 76], P: [60, 86], K1: [86, 85], F1: [104, 84], T1: [110, 82], K2: [76, 98], F2: [90, 106], T2: [96, 108], E1: [44, 72], W1: [56, 82], E2: [30, 106], W2: [42, 107] } },
    { h: 700, d: 1000, p: { H: [20, 64], N: [30, 72], P: [60, 80], K1: [86, 85], F1: [104, 84], T1: [110, 82], K2: [80, 90], F2: [96, 90], T2: [102, 88], E1: [44, 68], W1: [56, 78], E2: [30, 106], W2: [42, 107] } } ] },
  pogo: { hi: ["legNear", "legFar"], frames: [
    { h: 40, d: 170, p: pogoG },
    { h: 20, d: 170, p: pointToes(mv(pogoG, 0, -13)) } ] },
  skip: { hi: ["legNear"], frames: [
    { h: 60, d: 300, p: { H: [62, 10], N: [62, 22], P: [60, 52], K1: [76, 56], F1: [72, 76], T1: [80, 78], K2: [60, 75], F2: [58, 97], T2: [62, 104], E1: [54, 34], W1: [48, 44], E2: [70, 28], W2: [76, 16] } },
    { h: 0, d: 220, p: stand },
    { h: 60, d: 300, p: { H: [62, 10], N: [62, 22], P: [60, 52], K2: [76, 56], F2: [72, 76], T2: [80, 78], K1: [60, 75], F1: [58, 97], T1: [62, 104], E2: [54, 34], W2: [48, 44], E1: [70, 28], W1: [76, 16] } },
    { h: 0, d: 220, p: stand } ] },
  boxjump: { hi: ["legNear", "legFar"], p1: { x: 76, y: 88, w: 36, h: 22 }, frames: [
    { h: 250, d: 380, p: { H: [46, 40], N: [44, 52], P: [36, 76], K1: [52, 86], F1: [42, 107], K2: [50, 87], F2: [40, 107], E1: [34, 60], W1: [26, 68], E2: [33, 61], W2: [25, 69] } },
    { h: 0, d: 380, p: { H: [70, 0], N: [68, 12], P: [64, 40], K1: [78, 50], F1: [74, 70], K2: [76, 52], F2: [72, 72], E1: [78, 10], W1: [86, 2], E2: [76, 12], W2: [84, 4] } },
    { h: 200, d: 500, p: { H: [98, 34], N: [94, 44], P: [84, 68], K1: [100, 74], F1: [90, 85], K2: [98, 75], F2: [88, 85], E1: [100, 48], W1: [108, 50], E2: [98, 50], W2: [106, 52] } },
    { h: 500, d: 700, p: mv(S0, 32, -22) } ] },
  deadbug: { hi: ["torso"], frames: [
    { h: 150, d: 600, p: deadbugRest },
    { h: 300, d: 600, p: pz(deadbugRest, { K1: [80, 96], F1: [100, 99], T1: [104, 93], E2: [16, 94], W2: [4, 98] }) },
    { h: 150, d: 600, p: deadbugRest },
    { h: 300, d: 600, p: { H: [16, 96], N: [28, 100], P: [60, 102], K2: [80, 96], F2: [100, 99], T2: [104, 93], K1: [62, 80], F1: [82, 80], T1: [86, 74], E2: [30, 86], W2: [32, 72], E1: [16, 94], W1: [4, 98] } } ] },
  bounds: { hi: ["legNear"], frames: [
    { h: 40, d: 400, p: { H: [64, 12], N: [62, 24], P: [58, 52], K1: [78, 60], F1: [80, 82], T1: [88, 83], K2: [44, 70], F2: [30, 84], T2: [33, 91], E1: [50, 36], W1: [42, 44], E2: [70, 34], W2: [80, 30] } },
    { h: 40, d: 400, p: { H: [64, 12], N: [62, 24], P: [58, 52], K2: [78, 60], F2: [80, 82], T2: [88, 83], K1: [44, 70], F1: [30, 84], T1: [33, 91], E2: [50, 36], W2: [42, 44], E1: [70, 34], W1: [80, 30] } } ] },
  splitjump: { hi: ["legNear", "legFar"], frames: [
    { h: 200, d: 300, p: { H: [60, 38], N: [60, 50], P: [58, 78], K1: [76, 82], F1: [76, 107], K2: [50, 102], F2: [36, 100], T2: [42, 108], E1: [54, 62], W1: [50, 74], E2: [66, 62], W2: [70, 74] } },
    { h: 0, d: 300, p: pointToes(mv(S0, 0, -16)) },
    { h: 200, d: 300, p: { H: [60, 38], N: [60, 50], P: [58, 78], K2: [76, 82], F2: [76, 107], K1: [50, 102], F1: [36, 100], T1: [42, 108], E2: [54, 62], W2: [50, 74], E1: [66, 62], W1: [70, 74] } },
    { h: 0, d: 300, p: pointToes(mv(S0, 0, -16)) } ] },
  lateral: { hi: ["legNear", "legFar"], p1: { x: 59, y: 103, w: 2, h: 8 }, frames: [
    { h: 60, d: 200, p: front(44, 0, 3) },
    { h: 0, d: 200, p: front(60, -11, 0) },
    { h: 60, d: 200, p: front(76, 0, 3) },
    { h: 0, d: 200, p: front(60, -11, 0) } ] },
};

export type DrillGroup = "strength" | "plyo" | "core";

export interface Drill {
  kind: DrillKind;
  name: string;
  cue: string;
  group: DrillGroup;
  /** Main movers, in react-body-highlighter's muscle vocabulary. */
  muscles: Muscle[];
  /** How the plan text names it. */
  match: RegExp;
}

export const DRILLS: Drill[] = [
  { kind: "bss", group: "strength", name: "Bulgarian split squat", cue: "Rear foot on a chair. Drop the back knee straight down; front knee tracks over the toes.", muscles: ["quadriceps", "gluteal", "adductor"], match: /bulgarian split squat/i },
  { kind: "rdl", group: "strength", name: "Single-leg Romanian deadlift", cue: "Hinge at the hip with a flat back. Hips square, free leg reaches long behind.", muscles: ["hamstring", "gluteal", "lower-back"], match: /romanian deadlift/i },
  { kind: "calf", group: "strength", name: "Single-leg calf raise", cue: "Ball of the foot on the step edge. Full drop below the step, then rise all the way up.", muscles: ["calves", "left-soleus", "right-soleus"], match: /calf raise/i },
  { kind: "bridge", group: "strength", name: "Single-leg glute bridge", cue: "Drive through the heel. Hips stay level at the top.", muscles: ["gluteal", "hamstring"], match: /glute bridge/i },
  { kind: "hipthrust", group: "strength", name: "Single-leg hip thrust", cue: "Shoulders on the sofa edge. Push the hips to a straight line and pause.", muscles: ["gluteal", "hamstring"], match: /hip thrust/i },
  { kind: "splitsquat", group: "strength", name: "Split squat", cue: "Back knee drops straight down, torso tall.", muscles: ["quadriceps", "gluteal"], match: /(?<!bulgarian )\bsplit squat\b/i },
  { kind: "pogo", group: "plyo", name: "Pogo hops", cue: "Stiff ankles, quick contacts. Bounce off the balls of the feet.", muscles: ["calves", "left-soleus", "right-soleus"], match: /pogo hops/i },
  { kind: "skip", group: "plyo", name: "Skipping for height", cue: "Drive the knee and the opposite arm up. Go for height, not distance.", muscles: ["calves", "gluteal", "quadriceps"], match: /skipping for height/i },
  { kind: "boxjump", group: "plyo", name: "Step / low-box jump", cue: "Swing the arms, land softly with bent knees. Step down, don’t jump down.", muscles: ["quadriceps", "gluteal", "calves"], match: /box jumps?/i },
  { kind: "bounds", group: "plyo", name: "Alternate-leg bounds", cue: "Long, springy strides. Drive the knee forward and push off hard.", muscles: ["gluteal", "hamstring", "calves"], match: /bounds/i },
  { kind: "splitjump", group: "plyo", name: "Split-squat jump", cue: "Jump from a low lunge, switch legs in the air, land soft.", muscles: ["quadriceps", "gluteal", "calves"], match: /split-squat jumps?/i },
  { kind: "lateral", group: "plyo", name: "Lateral line hops", cue: "Feet together, hop side to side over a line. Short, quick contacts.", muscles: ["calves", "abductors", "adductor"], match: /lateral line hops/i },
  { kind: "sideplank", group: "core", name: "Side plank", cue: "Elbow under the shoulder. Head, hips and feet in one line.", muscles: ["obliques", "abs", "abductors"], match: /side plank/i },
  { kind: "copenhagen", group: "core", name: "Copenhagen plank", cue: "Top leg on the bench, lift the hips. Squeeze the inner thigh.", muscles: ["adductor", "obliques"], match: /copenhagen plank/i },
  { kind: "deadbug", group: "core", name: "Dead bug", cue: "Low back pressed into the floor. Extend the opposite arm and leg slowly.", muscles: ["abs"], match: /dead bug/i },
];

export const DRILL_BY_KIND = Object.fromEntries(DRILLS.map((d) => [d.kind, d])) as Record<DrillKind, Drill>;

export const MUSCLE_LABELS: Partial<Record<Muscle, string>> = {
  quadriceps: "Quads",
  gluteal: "Glutes",
  hamstring: "Hamstrings",
  adductor: "Adductors",
  abductors: "Abductors",
  calves: "Calves",
  "left-soleus": "Soleus",
  "right-soleus": "Soleus",
  "lower-back": "Lower back",
  abs: "Abs",
  obliques: "Obliques",
};

/** Muscle names for display, with the left/right soleus folded into one. */
export function muscleNames(muscles: Muscle[]): string[] {
  return [...new Set(muscles.map((m) => MUSCLE_LABELS[m] ?? m))];
}

/** The drills a "HOME STRENGTH …" block names, in the order it names them. */
export function drillsIn(text: string): Drill[] {
  return DRILLS.map((d) => ({ d, at: text.search(d.match) }))
    .filter((x) => x.at >= 0)
    .sort((a, b) => a.at - b.at)
    .map((x) => x.d);
}

/** The props (bench, step, wall, line) and highlighted limbs of a drill. */
export const motionProps = (kind: DrillKind) => ({ p1: MOTIONS[kind].p1, p2: MOTIONS[kind].p2, hi: MOTIONS[kind].hi });

const withToes = (p: PartialPose): Pose => ({
  ...p,
  T1: p.T1 ?? [p.F1[0] + 8, p.F1[1] + 2],
  T2: p.T2 ?? [p.F2[0] + 8, p.F2[1] + 2],
});
const ease = (x: number) => 0.5 - Math.cos(Math.PI * x) / 2;

/** Total loop length in ms. */
export function cycleMs(kind: DrillKind): number {
  return MOTIONS[kind].frames.reduce((s, f) => s + f.h + f.d, 0);
}

/** The interpolated pose `ms` into the loop. */
export function poseAt(kind: DrillKind, ms: number): Pose {
  const frames = MOTIONS[kind].frames;
  let t = ((ms % cycleMs(kind)) + cycleMs(kind)) % cycleMs(kind);
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    if (t < f.h) return withToes(f.p);
    t -= f.h;
    if (t < f.d) {
      const a = withToes(f.p);
      const b = withToes(frames[(i + 1) % frames.length].p);
      const k = ease(t / f.d);
      return Object.fromEntries(JOINTS.map((j) => [j, [a[j][0] + (b[j][0] - a[j][0]) * k, a[j][1] + (b[j][1] - a[j][1]) * k]])) as Pose;
    }
    t -= f.d;
  }
  return withToes(frames[0].p);
}
