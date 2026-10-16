import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";
import DrillAnimation from "../components/DrillAnimation";
import MuscleMap from "../components/MuscleMap";
import { ArrowLeft } from "../components/icons";
import { DRILLS, drillsIn, muscleNames, type DrillGroup, type DrillKind } from "../lib/drills";
import { romePlan, splitStrength } from "../lib/plan";

const GROUPS: { group: DrillGroup; title: string; sub: string }[] = [
  { group: "strength", title: "Strength", sub: "S1 SESSIONS · AFTER THE RUN" },
  { group: "plyo", title: "Plyometrics", sub: "S2 SESSIONS · FOOT CONTACTS COUNT" },
  { group: "core", title: "Core", sub: "HOLDS AND SLOW CONTROL" },
];

// How many plan days prescribe each drill.
const sessionCount = romePlan.weeks
  .flatMap((w) => w.days)
  .reduce<Partial<Record<DrillKind, number>>>((acc, d) => {
    const { strength } = splitStrength(d.training.detail);
    if (strength) for (const dr of drillsIn(strength)) acc[dr.kind] = (acc[dr.kind] ?? 0) + 1;
    return acc;
  }, {});
const strengthDays = romePlan.weeks.flatMap((w) => w.days).filter((d) => splitStrength(d.training.detail).strength).length;

export default function Drills() {
  const [params] = useSearchParams();
  const focus = params.get("drill");

  useEffect(() => {
    if (focus) document.getElementById(`drill-${focus}`)?.scrollIntoView({ block: "center" });
  }, [focus]);

  return (
    <>
      <SiteNav />
      <main className="container" style={{ paddingBottom: 72 }}>
        <section className="program-head">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Link to="/program" className="back-link">
              <ArrowLeft />
              Back to the program
            </Link>
            <span className="eyebrow">HOME STRENGTH · {DRILLS.length} DRILLS</span>
            <h1 className="program-title">Drill library</h1>
            <p className="program-lede">
              Every exercise in the Rome plan's home sessions, shown as a loop. The working leg or body part is
              highlighted. No gym needed: a chair, a step and a backpack for load.
            </p>
          </div>
          <div className="drills-season">
            <MuscleMap drills={DRILLS} size={110} label="Muscles the drill library works, front and back" />
            <span className="label">
              {strengthDays} STRENGTH SESSIONS · BRIGHTER = MORE DRILLS
            </span>
          </div>
        </section>

        {GROUPS.map(({ group, title, sub }) => (
          <section key={group} className="drill-group" aria-labelledby={`g-${group}`}>
            <div className="drill-group-head">
              <h2 id={`g-${group}`} className="section-title-sm">
                {title}
              </h2>
              <span className="label">{sub}</span>
            </div>
            <ul className="drill-grid">
              {DRILLS.filter((d) => d.group === group).map((d) => (
                <li key={d.kind} id={`drill-${d.kind}`} className={`drill-card${focus === d.kind ? " focused" : ""}`}>
                  <div className="drill-stage">
                    <DrillAnimation kind={d.kind} />
                  </div>
                  <div className="drill-body">
                    <h3 className="drill-name">{d.name}</h3>
                    <p className="drill-cue">{d.cue}</p>
                    <div className="drill-muscles">
                      <MuscleMap drills={[d]} size={44} label={`Muscles worked: ${muscleNames(d.muscles).join(", ")}`} />
                      <ul className="muscle-chips" aria-label="Muscles worked">
                        {muscleNames(d.muscles).map((m) => (
                          <li key={m} className="muscle-chip">
                            {m}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <span className="label">
                      {sessionCount[d.kind] ?? 0} SESSIONS IN THE PLAN
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
      <SiteFooter left="VIBE/MARATHON · Drill library" right="Not medical advice" />
    </>
  );
}
