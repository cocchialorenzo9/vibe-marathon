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
import { STATUS, capFor, mmss, paceOf, plannedFor, sessionOn, type SessionDay, type SessionStatus } from "../lib/sessions";
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

const STATUS_LEGEND: SessionStatus[] = ["done", "over", "moved", "extra", "none"];

/** "Fri 16" for jump buttons. */
const shortDay = (iso: string) => {
  const s = weekdayDate(iso);
  return s.charAt(0) + s.slice(1, 3).toLowerCase() + s.slice(3);
};

/** One line under a day tile saying what happened. */
function statusLine(s: SessionDay): string {
  const km = s.activity ? `${s.activity.distanceKm.toFixed(2)} km` : "";
  if (s.status === "moved" && s.movedTo) return `Moved to ${shortDay(s.movedTo)}`;
  if (s.status === "extra") return s.movedFrom ? `Ran ${km} (from ${shortDay(s.movedFrom)})` : `Ran ${km}`;
  if (s.status === "over") return `${km} · over HR cap`;
  if (s.status === "done") return km ? `${km} · done` : "Done";
  return STATUS[s.status].line;
}

function tileValue(d: PlanDay): string {
  const s = sessionOn(d.date);
  if (s?.status === "extra" && s.activity) return `${formatKm(Math.round(s.activity.distanceKm * 10) / 10)} km`;
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
  const done = sessionOn(selDay.date);

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
            <div className="cal-legend status-legend">
              <span className="label">PAST DAYS · FROM STRAVA</span>
              {STATUS_LEGEND.map((k) => (
                <span key={k}>
                  <span className="cell-badge static" style={{ background: STATUS[k].color }} aria-hidden="true">
                    {STATUS[k].badge}
                  </span>
                  {STATUS[k].line}
                </span>
              ))}
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
                      const s = sessionOn(d.date);
                      // A day that ran something it didn't plan shows what was run.
                      const t = s?.status === "extra" ? SESSION_TYPES.easy : SESSION_TYPES[d.training.type];
                      const missed = s?.status === "moved" || s?.status === "none";
                      const cls = [
                        "cell",
                        i === sel && "selected",
                        d.date === todayIso && "today",
                        d.date < todayIso && (!s || s.status === "rest") && "past",
                        missed && "missed",
                      ]
                        .filter(Boolean)
                        .join(" ");
                      const km = s?.status === "extra" && s.activity ? s.activity.distanceKm : isRun(d) ? d.estKm! : null;
                      return (
                        <button
                          key={d.date}
                          type="button"
                          className={cls}
                          style={missed ? { color: t.color, borderColor: t.color } : { background: t.color, color: t.ink }}
                          aria-label={`${dayStamp(d.date)}: ${prose(d.training.title)}${s ? `, ${STATUS[s.status].line.toLowerCase()}` : ""}${d.date === todayIso ? " (today)" : ""}`}
                          aria-pressed={i === sel}
                          onClick={() => pick(i)}
                        >
                          <span className="mono">{km != null ? Math.round(km) : ""}</span>
                          {d.estMin.strength > 0 && <span className="cell-dot" style={{ background: missed ? t.color : t.ink }} />}
                          {s && s.status !== "rest" && (
                            <span className="cell-badge" style={{ background: STATUS[s.status].color }} aria-hidden="true">
                              {STATUS[s.status].badge}
                            </span>
                          )}
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
                const s = sessionOn(d.date);
                const missed = s?.status === "moved" || s?.status === "none";
                return (
                  <button
                    key={d.date}
                    type="button"
                    className={`day-btn${i === sel ? " selected" : ""}${d.date < todayIso && (!s || s.status === "rest") ? " past" : ""}`}
                    aria-pressed={i === sel}
                    onClick={() => pick(i)}
                  >
                    <span className="day-btn-bar" style={{ background: t.color }} />
                    <span className="day-top">
                      <span>{weekdayDate(d.date)}</span>
                      <span className="day-tag">{d.date === todayIso ? "TODAY" : ""}</span>
                    </span>
                    <span className={`day-title${missed ? " struck" : ""}`}>{tileTitle(d.training.title)}</span>
                    <span className="day-val">{tileValue(d)}</span>
                    {s && (
                      <span className="day-status mono" style={{ color: STATUS[s.status].color }}>
                        <span className="cell-badge static" style={{ background: STATUS[s.status].color }} aria-hidden="true">
                          {STATUS[s.status].badge}
                        </span>
                        {statusLine(s)}
                      </span>
                    )}
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
                {done && <WhatHappened s={done} onJump={(iso) => pick(days.findIndex((d) => d.date === iso))} />}
                {done && <span className="label">PLANNED</span>}
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

function WhatHappened({ s, onJump }: { s: SessionDay; onJump: (iso: string) => void }) {
  const st = STATUS[s.status];
  const a = s.activity;
  const meant = plannedFor(s);
  const cap = capFor(s);
  const hrColor = (v: number | null) => (cap && v != null && v > cap ? "#ffb08a" : undefined);
  const target = s.movedTo ?? s.movedFrom;
  return (
    <section aria-labelledby="act-title" className="what-happened" style={{ borderColor: st.color }}>
      <div className="what-happened-head">
        <h4 id="act-title" className="label">
          WHAT HAPPENED
        </h4>
        <span className="status-pill solid" style={{ background: st.color }}>
          {st.badge} {st.label}
        </span>
      </div>
      {a && (
        <dl className="act-stats">
          <div>
            <dt className="label">DISTANCE</dt>
            <dd className="disp">{a.distanceKm.toFixed(2)} km</dd>
            <dd className="mono">{s.movedFrom || !meant?.estKm ? "plan: rest" : `plan ${formatKm(meant.estKm)} km`}</dd>
          </div>
          <div>
            <dt className="label">TIME</dt>
            <dd className="disp">{mmss(a.movingSec)}</dd>
            <dd className="mono">{meant?.estMin.run ? `plan ${formatMinutes(meant.estMin.run)}` : ""}</dd>
          </div>
          <div>
            <dt className="label">PACE</dt>
            <dd className="disp">{paceOf(a.movingSec, a.distanceKm)}</dd>
            <dd className="mono">{meant?.estKm && meant.estMin.run ? `target ~${paceOf(meant.estMin.run * 60, meant.estKm)}` : ""}</dd>
          </div>
          {a.avgHr != null && (
            <div>
              <dt className="label">AVG HR</dt>
              <dd className="disp" style={{ color: hrColor(a.avgHr) }}>
                {a.avgHr}
              </dd>
              <dd className="mono">{cap ? `cap ${cap}` : ""}</dd>
            </div>
          )}
          {a.maxHr != null && (
            <div>
              <dt className="label">MAX HR</dt>
              <dd className="disp" style={{ color: hrColor(a.maxHr) }}>
                {a.maxHr}
              </dd>
              <dd className="mono">{cap ? `cap ${cap}` : ""}</dd>
            </div>
          )}
        </dl>
      )}
      <p>{s.summary}</p>
      <div className="what-happened-links">
        {target && (
          <button type="button" className="outline-pill violet" onClick={() => onJump(target)}>
            {s.movedTo ? `See it on ${shortDay(target)} →` : `← Planned for ${shortDay(target)}`}
          </button>
        )}
        {s.status !== "rest" && (
          <Link to={`/sessions?day=${s.date}`} className="outline-pill">
            Full review: laps, HR bands, notes
          </Link>
        )}
      </div>
    </section>
  );
}
