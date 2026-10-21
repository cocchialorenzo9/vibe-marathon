import { romePlan } from "./plan";
import { HR_BANDS, LT2, bandOf, capFor, compareRows, keptCap, sessionOn, weekProgress } from "./sessions";

const planDay = (iso: string) => romePlan.weeks.flatMap((w) => w.days).find((d) => d.date === iso)!;

describe("HR bands", () => {
  it("puts each bpm in exactly one band, with LT2 as the top edge", () => {
    expect(HR_BANDS[bandOf(129)].label).toBe("< 130");
    expect(HR_BANDS[bandOf(130)].label).toBe("130–140");
    expect(HR_BANDS[bandOf(LT2 - 1)].label).toBe(`155–${LT2}`);
    expect(HR_BANDS[bandOf(LT2)].label).toBe(`${LT2}+`);
  });
});

describe("planned vs done", () => {
  it("compares a run to its own day's plan", () => {
    const s = sessionOn("2026-10-17")!;
    const rows = compareRows(s, planDay("2026-10-17"));
    expect(rows.find((r) => r.key === "Pace")).toMatchObject({ done: "5:43 /km", diff: "17 s faster" });
    expect(rows.find((r) => r.key === "Avg HR")).toMatchObject({ diff: "+4 over cap", tone: "bad" });
  });

  it("checks a moved run against the day it came from", () => {
    const s = sessionOn("2026-10-16")!;
    expect(capFor(s)).toBe(130);
    expect(compareRows(s, planDay("2026-10-15"))[0]).toMatchObject({ key: "Day", plan: "THU 15", done: "FRI 16", diff: "+1 day" });
    expect(keptCap(s)).toBe(false);
  });

  it("totals a week against its plan from whatever is logged", () => {
    const week = romePlan.weeks[0];
    const runs = week.days
      .map((d) => sessionOn(d.date))
      .filter((s) => s?.activity && /run/i.test(s.activity.sport));
    const p = weekProgress(week);
    expect(p.kmDone).toBeCloseTo(runs.reduce((sum, s) => sum + s!.activity!.distanceKm, 0), 1);
    expect(p.kmPlanned).toBe(week.estKm);
    expect(p.runsDone).toBe(runs.length);
    expect(p.onPlanDay).toBe(runs.filter((s) => !s!.movedFrom).length);
    expect(p.capKept).toBeLessThanOrEqual(p.capRuns);
    expect(p.capRuns).toBeLessThanOrEqual(p.runsDone);
  });
});
