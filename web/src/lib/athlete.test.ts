import athleteJson from "@data/athlete.json";
import { LT2, pctOfLt, resolveLt, resolveLtDeep } from "./athlete";

describe("athlete", () => {
  it("reads LT from athlete.json", () => {
    expect(LT2).toBe(athleteJson.lthr.bpm);
  });

  it("resolves %LTHR tokens", () => {
    expect(resolveLt("HR {LT:95%}-{LT:99%}; never {LT:100%}+", 165)).toBe("HR 157-163; never 165+");
    expect(resolveLt("passes {LT:99.5%}, settle <={LT:97.5%}", 167)).toBe("passes 166, settle <=163");
    expect(resolveLt("no tokens, HR cap 140", 165)).toBe("no tokens, HR cap 140");
  });

  it("resolves tokens in nested plan JSON", () => {
    expect(resolveLtDeep({ a: ["{LT:99.5%}"], b: { c: "{LT:100%}" }, n: 3 }, 165)).toEqual({ a: ["164"], b: { c: "165" }, n: 3 });
  });

  it("computes %LT", () => {
    expect(pctOfLt(95, 165)).toBe(157);
  });
});
