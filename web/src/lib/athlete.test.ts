import athleteJson from "../../../data/athlete.json";
import { LT2, pctOfLt, resolveLt, resolveLtDeep } from "./athlete";

describe("athlete", () => {
  it("reads LT from data/athlete.json", () => {
    expect(LT2).toBe(athleteJson.lthr.bpm);
  });

  it("resolves LT-relative tokens", () => {
    expect(resolveLt("HR {LT-9}-{LT-2}; never {LT}+", 165)).toBe("HR 156-163; never 165+");
    expect(resolveLt("{LT+3}", 160)).toBe("163");
    expect(resolveLt("no tokens, HR cap 140", 165)).toBe("no tokens, HR cap 140");
  });

  it("resolves tokens in nested plan JSON", () => {
    expect(resolveLtDeep({ a: ["{LT-1}"], b: { c: "{LT}" }, n: 3 }, 165)).toEqual({ a: ["164"], b: { c: "165" }, n: 3 });
  });

  it("computes %LT", () => {
    expect(pctOfLt(95, 165)).toBe(157);
  });
});
