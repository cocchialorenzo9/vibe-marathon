import {
  blockName,
  daySubtitle,
  dayValue,
  formatMinutes,
  fuelTest,
  gateName,
  locate,
  prose,
  romePlan,
  shortTitle,
  splitStrength,
  tileTitle,
  weekCounts,
  weekRange,
} from "./plan";

describe("locate", () => {
  it("finds today, tomorrow and the week inside the plan", () => {
    const pos = locate(romePlan, "2026-10-14");
    expect(pos.status).toBe("during");
    expect(pos.today.date).toBe("2026-10-14");
    expect(pos.tomorrow?.date).toBe("2026-10-15");
    expect(pos.week.week).toBe(1);
    expect(pos.daysToGo).toBe(151);
  });

  it("clamps to the first day before the plan starts", () => {
    const pos = locate(romePlan, "2026-10-01");
    expect(pos.status).toBe("before");
    expect(pos.today.date).toBe(romePlan.weeks[0].days[0].date);
  });

  it("clamps to race day after the plan ends", () => {
    const pos = locate(romePlan, "2027-04-01");
    expect(pos.status).toBe("after");
    expect(pos.today.training.type).toBe("race");
    expect(pos.tomorrow).toBeNull();
    expect(pos.daysToGo).toBe(0);
  });
});

describe("day formatting", () => {
  const week1 = romePlan.weeks[0];
  const [mon, , wed, thu] = week1.days;

  it("shortens titles", () => {
    expect(shortTitle(wed.training.title)).toBe("Easy swim");
    expect(shortTitle("Recovery run")).toBe("Recovery run");
  });

  it("summarises a run with its HR cap and estimated minutes", () => {
    expect(daySubtitle(thu)).toBe("HR ≤130 · ~24′");
    expect(dayValue(thu)).toBe("4 km");
  });

  it("falls back to minutes, then a dash", () => {
    expect(dayValue(wed)).toBe("25′");
    expect(dayValue(mon)).toBe("—");
  });

  it("names the block and counts sessions", () => {
    expect(blockName(mon)).toBe("Post-Munich recovery");
    expect(blockName(thu)).toBe("Post-Munich recovery");
    expect(weekCounts(week1)).toEqual({ runs: 3, swims: 1 });
    expect(weekRange(week1)).toBe("12–18 OCT");
    expect(weekRange(romePlan.weeks[2])).toBe("26 OCT–1 NOV");
  });

  it("drops editorial notes from gate names", () => {
    expect(gateName("Aerobic check (replaces Dec 20 10K)")).toBe("Aerobic check");
  });
});

describe("program helpers", () => {
  it("splits the home strength block out of a session", () => {
    const { session, strength } = splitStrength("50 min easy. HOME STRENGTH S1, foundation: squats.");
    expect(session).toBe("50 min easy.");
    expect(strength).toBe("HOME STRENGTH S1, foundation: squats.");
    expect(splitStrength("Full rest.").strength).toBeNull();
  });

  it("finds the week's fuel test", () => {
    expect(fuelTest(romePlan.weeks[3])).toBe("A");
    expect(fuelTest(romePlan.weeks[0])).toBeNull();
  });

  it("formats minutes and titles", () => {
    expect(formatMinutes(95)).toBe("1h 35′");
    expect(formatMinutes(40)).toBe("40′");
    expect(formatMinutes(0)).toBe("—");
    expect(tileTitle("Long run (fuel test A)")).toBe("Long run");
    expect(prose("easy -- HR <=140")).toBe("easy — HR ≤140");
  });
});

describe("plan as shown", () => {
  const days = romePlan.weeks.flatMap((w) => w.days);

  it("shows heart rate in bpm, never % LTHR", () => {
    const shown = { ...romePlan, weeks: romePlan.weeks.map((w) => ({ ...w, days: w.days.map((d) => ({ ...d, training: { ...d.training, workout: "" } })) })) };
    expect(JSON.stringify(shown)).not.toMatch(/% LTHR/);
  });

  it("renders every day's session from its workout", () => {
    for (const d of days) expect(d.training.detail.length).toBeGreaterThan(0);
    const easy = days.find((d) => d.date === "2026-10-20")!;
    expect(easy.training.detail).toBe("30 min, HR ≤140. Hard ceiling: walk a hill rather than cross it.");
  });
});
