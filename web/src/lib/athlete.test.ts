import athleteJson from "@data/athlete.json";
import { LT2, lthrToBpm, lthrToBpmDeep, pctOfLt } from "./athlete";

describe("athlete", () => {
  it("reads LT from athlete.json", () => {
    expect(LT2).toBe(athleteJson.lthr.bpm);
  });

  it("shows % LTHR as bpm", () => {
    expect(lthrToBpm("HR cap 85% LTHR; threshold 95-99% LTHR", 165)).toBe("HR cap 140 bpm; threshold 157-163 bpm");
    expect(lthrToBpm("if HR passes 99.5% LTHR, settle <=97.5% LTHR", 167)).toBe("if HR passes 166 bpm, settle <=163 bpm");
    expect(lthrToBpm("no HR here, 3x10/leg", 165)).toBe("no HR here, 3x10/leg");
  });

  it("converts nested plan JSON", () => {
    expect(lthrToBpmDeep({ a: ["99.5% LTHR"], b: { c: "100% LTHR" }, n: 3 }, 165)).toEqual({ a: ["164 bpm"], b: { c: "165 bpm" }, n: 3 });
  });

  it("computes %LT", () => {
    expect(pctOfLt(95, 165)).toBe(157);
  });
});
