// The rest of the suite reads the frozen copy in src/test/fixtures; these
// checks run against the real data/ files the site is built from, so a bad
// sync or plan edit still fails here. Keep them to rules that hold on any
// day: no dates, no counts.
import athleteJson from "../../../data/athlete.json";
import sessionsJson from "../../../data/sessions.json";
import romePlanJson from "../../../data/training-plan-rome-2027.json";
import { lthrToBpmDeep } from "./athlete";
import type { SessionLog } from "./sessions";

const sessionLog = sessionsJson as unknown as SessionLog;
const planDates = new Set(romePlanJson.weeks.flatMap((w) => w.days.map((d) => d.date)));
const byDate = new Map(sessionLog.days.map((d) => [d.date, d]));
const STATUSES = ["done", "over", "extra", "moved", "none", "rest"];

describe("data/sessions.json", () => {
  it("only holds plan days, each once, sorted by date", () => {
    const dates = sessionLog.days.map((d) => d.date);
    expect(new Set(dates).size).toBe(dates.length);
    expect([...dates].sort()).toEqual(dates);
    for (const d of dates) expect(planDates.has(d)).toBe(true);
  });

  it("uses known statuses", () => {
    for (const s of sessionLog.days) expect(STATUSES).toContain(s.status);
  });

  it("links moved sessions both ways", () => {
    for (const s of sessionLog.days) {
      if (s.movedTo) expect(byDate.get(s.movedTo)?.movedFrom).toBe(s.date);
      if (s.movedFrom) expect(byDate.get(s.movedFrom)?.movedTo).toBe(s.date);
    }
  });
});

describe("data/training-plan-rome-2027.json", () => {
  const days = romePlanJson.weeks.flatMap((w) => w.days);

  it("describes every day with a workout and nothing else", () => {
    for (const d of days) {
      expect(typeof d.training.workout).toBe("string");
      expect(d.training).not.toHaveProperty("detail");
    }
  });

  it("writes heart rate as % LTHR, which converts to bpm against data/athlete.json", () => {
    const text = JSON.stringify(romePlanJson);
    expect(text).not.toMatch(/\{LT|\d{3} ?bpm/);
    expect(JSON.stringify(lthrToBpmDeep(romePlanJson, athleteJson.lthr.bpm))).not.toMatch(/% LTHR/);
  });
});
