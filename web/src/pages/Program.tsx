import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";
import DrillAnimation from "../components/DrillAnimation";
import MuscleMap from "../components/MuscleMap";
import { ChevronLeft, ChevronRight, Info } from "../components/icons";
import {
  PHASE_COLORS,
  PHASE_LABELS,
  SESSION_TYPES,
  blockName,
  dateLong,
  dayStamp,
  formatKm,
  formatMinutes,
  fuelTest,
  parseIso,
  prose,
  romePlan,
  shortDate,
  splitStrength,
  tileTitle,
  weekCounts,
  weekRange,
  weekdayDate,
  type Phase,
  type PlanDay,
  type SessionType,
} from "../lib/plan";
import { drillsIn, muscleNames } from "../lib/drills";
import { useToday } from "../lib/useToday";

const weeks = romePlan.weeks;
const days = weeks.flatMap((w) => w.days);
const weekOf = (i: number) => Math.floor(i / 7);

const LEGEND_ORDER: SessionType[] = ["easy", "medium-long", "long", "tempo", "race", "swim", "rest"];
const typeCounts = days.reduce<Partial<Record<SessionType, number>>>((acc, d) => {
  acc[d.training.type] = (acc[d.training.type] ?? 0) + 1;
  return acc;
}, {});
const totalKm = Math.round(weeks.reduce((s, w) => s + w.estKm, 0));
const totalRuns = weeks.reduce((s, w) => s + weekCounts(w).runs, 0);

const isRun = (d: PlanDay) => d.training.type !== "swim" && (d.estKm ?? 0) > 0;

function tileValue(d: PlanDay): string {
  if (d.training.type === "rest") return "—";
  if (isRun(d)) return `${formatKm(d.estKm!)} km`;
  return formatMinutes(d.estMin.total);
}

export default function Program() {
  const todayIso = useToday();
  const [params, setParams] = useSearchParams();

  const todayIdx = days.findIndex((d) => d.date === todayIso);
  const fallback = todayIdx >= 0 ? todayIdx : todayIso < days[0].date ? 0 : days.length - 1;
  const requested = days.findIndex((d) => d.date === params.get("day"));
  const sel = requested >= 0 ? requested : fallback;

  const pick = (i: number) => {
    const next = new URLSearchParams(params);
    next.set("day", days[Math.max(0, Math.min(days.length - 1, i))].date);
    setParams(next, { replace: true });
  };

  useEffect(() => {
    document.title = "The program — Vibe Marathon";
  }, []);

  const selDay = days[sel];
  const week = weeks[weekOf(sel)];
  const { runs, swims } = weekCounts(week);
  const gym = week.days.filter((d) => d.estMin.strength > 0).length;
  const longest = Math.max(0, ...week.days.filter(isRun).map((d) => d.estKm!));
  const fuel = fuelTest(week);
  const quality = week.days.filter((d) => d.training.type === "tempo" || d.training.type === "race").length;
  const stats: [string, string][] = [
    ["KM", formatKm(week.estKm)],
    ["RUNS", String(runs)],
    ["LONGEST", longest ? `${formatKm(longest)} km` : "—"],
    ["HOURS", week.estHours ? String(week.estHours.total) : "—"],
    ["SWIM · GYM", `${swims} · ${gym}`],
    fuel ? ["FUEL TEST", fuel] : ["QUALITY", String(quality)],
  ];

  const type = SESSION_TYPES[selDay.training.type];
  const { session, strength } = splitStrength(selDay.training.detail);
  const strengthDrills = strength ? drillsIn(strength) : [];
  const raceDay = days[days.length - 1];

  return (
    <>
      <SiteNav />
      <main className="container" style={{ paddingBottom: 72 }}>
        <section className="program-head">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span className="eyebrow">
              SEASON 02 · {shortDate(days[0].date)} {days[0].date.slice(0, 4)} → {shortDate(raceDay.date)}{" "}
              {raceDay.date.slice(0, 4)}
            </span>
            <h1 className="program-title">The program</h1>
            <p className="program-lede">Every day of the road to Rome. Pick any day on the calendar to load its week.</p>
          </div>
          <dl className="program-totals">
            <div>
              <dt className="label">DAYS</dt>
              <dd className="disp">{days.length}</dd>
            </div>
            <div>
              <dt className="label">KM PLANNED</dt>
              <dd className="disp">{totalKm.toLocaleString("en-US")}</dd>
            </div>
            <div>
              <dt className="label">RUNS</dt>
              <dd className="disp">{totalRuns}</dd>
            </div>
          </dl>
        </section>

        <div className="program-layout">
          <section aria-labelledby="cal-title" className="calendar">
            <h2 id="cal-title" className="label calendar-title">
              CALENDAR
            </h2>
            <div className="cal-legend">
              {LEGEND_ORDER.map((t) => (
                <span key={t}>
                  <span className="swatch" style={{ background: SESSION_TYPES[t].color }} />
                  {SESSION_TYPES[t].label} <span className="mono">{typeCounts[t] ?? 0}</span>
                </span>
              ))}
              <span>
                <span className="swatch strength-swatch" />+ strength
              </span>
            </div>

            <div className="cal-row cal-dow" aria-hidden="true">
              <span />
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <span key={i} className="mono">
                  {d}
                </span>
              ))}
            </div>

            <div className="cal-rows">
              {weeks.map((w, wi) => {
                const on = wi === weekOf(sel);
                return (
                  <div key={w.week} className={`cal-row${on ? " on" : ""}`}>
                    <div className="cal-week">
                      <span className="cal-phase" style={{ background: PHASE_COLORS[w.phase] }} />
                      <span>
                        <span className="mono cal-num">W{w.week}</span>
                        <span className="mono cal-start">{shortDate(w.days[0].date)}</span>
                      </span>
                    </div>
                    {w.days.map((d, j) => {
                      const i = wi * 7 + j;
                      const t = SESSION_TYPES[d.training.type];
                      const cls = ["cell", i === sel && "selected", d.date === todayIso && "today", d.date < todayIso && "past"]
                        .filter(Boolean)
                        .join(" ");
                      return (
                        <button
                          key={d.date}
                          type="button"
                          className={cls}
                          style={{ background: t.color, color: t.ink }}
                          aria-label={`${dayStamp(d.date)}: ${prose(d.training.title)}${d.date === todayIso ? " (today)" : ""}`}
                          aria-pressed={i === sel}
                          onClick={() => pick(i)}
                        >
                          <span className="mono">{isRun(d) ? Math.round(d.estKm!) : ""}</span>
                          {d.estMin.strength > 0 && <span className="cell-dot" style={{ background: t.ink }} />}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            <div className="cal-legend phases">
              {(Object.keys(PHASE_LABELS) as Phase[]).map((p) => (
                <span key={p}>
                  <span className="cal-phase" style={{ background: PHASE_COLORS[p], height: 14 }} />
                  {PHASE_LABELS[p]}
                </span>
              ))}
            </div>
          </section>

          <section aria-labelledby="wk-title" className="program-week">
            <p className="visually-hidden" aria-live="polite">
              {`${dayStamp(selDay.date)}, week ${week.week}: ${prose(selDay.training.title)}`}
            </p>
            <div className="program-week-head">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span className="eyebrow" style={{ color: PHASE_COLORS[week.phase] }}>
                  WEEK {week.week} OF {weeks.length} · {PHASE_LABELS[week.phase].toUpperCase()}
                </span>
                <h2 id="wk-title" className="section-title-sm" style={{ lineHeight: 1.1 }}>
                  {blockName(week.days[0])}
                </h2>
                <span className="mono" style={{ fontSize: 13, color: "var(--dim)" }}>
                  {weekRange(week)}
                </span>
              </div>
              <div className="week-nav">
                <button type="button" className="icon-btn" aria-label="Previous week" onClick={() => pick(sel - 7)} disabled={weekOf(sel) === 0}>
                  <ChevronLeft />
                </button>
                <button type="button" className="icon-btn today-btn" onClick={() => pick(fallback)}>
                  TODAY
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="Next week"
                  onClick={() => pick(sel + 7)}
                  disabled={weekOf(sel) === weeks.length - 1}
                >
                  <ChevronRight />
                </button>
              </div>
            </div>

            <dl className="stat-strip week-stats">
              {stats.map(([k, v]) => (
                <div key={k}>
                  <dt className="label">{k}</dt>
                  <dd className="disp">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="note">
              <Info />
              <p>{prose(week.tip)}</p>
            </div>

            <div className="week-days">
              {week.days.map((d, j) => {
                const i = weekOf(sel) * 7 + j;
                const t = SESSION_TYPES[d.training.type];
                return (
                  <button
                    key={d.date}
                    type="button"
                    className={`day-btn${i === sel ? " selected" : ""}${d.date < todayIso ? " past" : ""}`}
                    aria-pressed={i === sel}
                    onClick={() => pick(i)}
                  >
                    <span className="day-btn-bar" style={{ background: t.color }} />
                    <span className="day-top">
                      <span>{weekdayDate(d.date)}</span>
                      <span className="day-tag">{d.date === todayIso ? "TODAY" : ""}</span>
                    </span>
                    <span className="day-title">{tileTitle(d.training.title)}</span>
                    <span className="day-val">{tileValue(d)}</span>
                  </button>
                );
              })}
            </div>

            <article aria-labelledby="day-title" className="day-detail">
              <div style={{ height: 6, background: type.color }} />
              <div className="day-detail-body">
                <div className="day-detail-top">
                  <span className="mono">
                    {dateLong(selDay.date)}
                    {selDay.date === todayIso ? " · TODAY" : ""}
                  </span>
                  <span className="type-pill" style={{ background: type.color, color: type.ink }}>
                    {type.label.toUpperCase()}
                  </span>
                </div>
                <h3 id="day-title" className="day-detail-title">
                  {prose(selDay.training.title)}
                </h3>
                <dl className="day-detail-stats">
                  <div>
                    <dt className="label">DISTANCE</dt>
                    <dd className="disp">{isRun(selDay) ? `${formatKm(selDay.estKm!)} km` : "—"}</dd>
                  </div>
                  <div>
                    <dt className="label">DURATION</dt>
                    <dd className="disp">{formatMinutes(selDay.estMin.total)}</dd>
                  </div>
                </dl>
                <p className="day-detail-text">{prose(session)}</p>
                {strength && (
                  <div className="info-box">
                    <span className="label" style={{ color: "var(--accent)" }}>
                      HOME STRENGTH
                    </span>
                    <span>{prose(strength.replace(/^HOME STRENGTH,?\s*/, ""))}</span>
                    {strengthDrills.length > 0 && (
                      <>
                        <ul className="strength-drills" aria-label="Drills in this session">
                          {strengthDrills.map((d) => (
                            <li key={d.kind}>
                              <Link className="strength-drill" to={`/drills?drill=${d.kind}`}>
                                <DrillAnimation kind={d.kind} />
                                <span>{d.name}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                        <div className="strength-foot">
                          <MuscleMap
                            drills={strengthDrills}
                            size={64}
                            label={`Muscles this session works: ${muscleNames(strengthDrills.flatMap((d) => d.muscles)).join(", ")}`}
                          />
                          <Link to="/drills" className="mono" style={{ fontSize: 12 }}>
                            DRILL LIBRARY →
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                )}
                <div className="info-grid">
                  <div className="info-box">
                    <span className="label">COMMUTE</span>
                    <span>{prose(selDay.movement)}</span>
                  </div>
                  <div className="info-box">
                    <span className="label">FOOD</span>
                    <span>{prose(selDay.food)}</span>
                  </div>
                </div>
              </div>
            </article>
          </section>
        </div>
      </main>
      <SiteFooter
        left="VIBE/MARATHON · data/training-plan-rome-2027.json"
        right={`Race day ${parseIso(raceDay.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · Not medical advice`}
      />
    </>
  );
}
