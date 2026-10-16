import { DRILLS, cycleMs, drillsIn, poseAt } from "./drills";
import { romePlan, splitStrength } from "./plan";

const kinds = (text: string) => drillsIn(text).map((d) => d.kind);

describe("drillsIn", () => {
  it("reads the S1 foundation block in order", () => {
    expect(
      kinds(
        "HOME STRENGTH S1, foundation (~35 min, after the run): Bulgarian split squat 3x10/leg, single-leg Romanian deadlift 3x10/leg, single-leg calf raise off a step 3x12/leg straight knee + 2x12 bent knee, single-leg glute bridge 3x12/leg, side plank 3x30 s/side.",
      ),
    ).toEqual(["bss", "rdl", "calf", "bridge", "sideplank"]);
  });

  it("tells a split squat from a Bulgarian split squat and a split-squat jump", () => {
    expect(kinds("Bulgarian split squat 3x5")).toEqual(["bss"]);
    expect(kinds("split-squat jumps 3x6/leg")).toEqual(["splitjump"]);
    expect(kinds("taper: split squat 2x5/leg and single-leg calf raise 2x8/leg, pogo hops 2x15")).toEqual([
      "splitsquat",
      "calf",
      "pogo",
    ]);
  });

  it("finds every drill somewhere in the Rome plan, and at least one in every block that names its exercises", () => {
    const blocks = romePlan.weeks
      .flatMap((w) => w.days)
      .map((d) => splitStrength(d.training.detail).strength)
      .filter((s): s is string => !!s);
    expect(blocks.length).toBeGreaterThan(0);
    // Recovery weeks only say "S1 exercises at 2 sets each".
    for (const b of blocks.filter((b) => !/recovery week/.test(b))) expect(drillsIn(b).length).toBeGreaterThan(0);
    const seen = new Set(blocks.flatMap(kinds));
    expect([...seen].sort()).toEqual(DRILLS.map((d) => d.kind).sort());
  });
});

describe("poseAt", () => {
  it("loops and stays inside the drawing box", () => {
    for (const d of DRILLS) {
      const len = cycleMs(d.kind);
      expect(poseAt(d.kind, 0)).toEqual(poseAt(d.kind, len));
      for (let t = 0; t < len; t += 37) {
        for (const [x, y] of Object.values(poseAt(d.kind, t))) {
          expect(x).toBeGreaterThanOrEqual(0);
          expect(x).toBeLessThanOrEqual(120);
          expect(y).toBeGreaterThanOrEqual(-16);
          expect(y).toBeLessThanOrEqual(116);
        }
      }
    }
  });
});
