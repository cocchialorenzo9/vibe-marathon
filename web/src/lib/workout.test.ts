import { parseWorkout, renderStep, renderWorkout } from "./workout";

const EASY_STRIDES = "- 30m 60-85% LTHR\n\nStrides 6x\n- 20s stride intensity=active\n- 60s walk-back\n\nHard ceiling: walk a hill.";

describe("workout", () => {
  it("splits steps from notes", () => {
    const { blocks, notes } = parseWorkout(EASY_STRIDES);
    expect(blocks).toEqual([
      { header: null, steps: ["30m 60-85% LTHR"] },
      { header: "Strides 6x", steps: ["20s stride intensity=active", "60s walk-back"] },
    ]);
    expect(notes).toBe("Hard ceiling: walk a hill.");
  });

  it("renders steps in bpm", () => {
    expect(renderStep("30m 60-85% LTHR", 165)).toBe("30 min, HR ≤140");
    expect(renderStep("5km 95-99% LTHR", 165)).toBe("5 km at HR 157-163");
    expect(renderStep("4km 4:09/km Pace", 165)).toBe("4 km at 4:09/km");
    expect(renderStep("1200m 3:48/km Pace intensity=active", 165)).toBe("1200 m at 3:48/km");
    expect(renderStep("2m30s jog", 165)).toBe("2′30″ jog");
  });

  it("renders a whole workout as the session line", () => {
    expect(renderWorkout(EASY_STRIDES, 165)).toBe(
      "30 min, HR ≤140 -> Strides 6× (20 s stride, 60 s walk-back). Hard ceiling: walk a hill.",
    );
  });

  it("keeps a note-only day as its text", () => {
    expect(renderWorkout("Full rest. Walking is fine.", 165)).toBe("Full rest. Walking is fine.");
  });
});
