import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import SiteNav, { REPO_URL, scrollToSection } from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";
import { ArrowRight, Info, SessionIcon } from "../components/icons";
import {
  PHASE_COLORS,
  PHASE_LABELS,
  blockName,
  dayStamp,
  daySubtitle,
  dayValue,
  formatKm,
  gateName,
  hrCap,
  locate,
  parseIso,
  romePlan,
  shortDate,
  shortTitle,
  weekCounts,
  weekRange,
  weekdayDate,
  type Phase,
  type PlanDay,
} from "../lib/plan";
import { useToday } from "../lib/useToday";
import { MUNICH } from "../data/munich2026";

// Race targets from the plan's goalFinish: 2:55:00 at 4:09/km, ~5 min of slack under 3:00.
const GOAL = "2:55:00";
const RACE_PACE = "4:09";
const DASHBOARD_URL = "https://claude.ai/artifact/TXv5oj3qerwvULrr8ZggPW";

/** Deep link into the program page with a day selected. */
const programDay = (iso: string) => `/program?day=${iso}`;

export default function Home() {
  const todayIso = useToday();
  const { state } = useLocation();
  const plan = romePlan;
  const pos = locate(plan, todayIso);
  const weeks = plan.weeks;
  const peak = Math.max(...weeks.map((w) => w.estKm));
  const totalKm = Math.round(weeks.reduce((s, w) => s + w.estKm, 0));
  const planDays = weeks.reduce((s, w) => s + w.days.length, 0);
  const raceDay = weeks[weeks.length - 1].days[weeks[weeks.length - 1].days.length - 1];

  useEffect(() => {
    document.title = "Vibe Marathon — Road to Rome";
    const section = (state as { section?: string } | null)?.section;
    if (section) scrollToSection(section);
  }, [state]);

  return (
    <>
      <SiteNav />
      <main className="container">
        <section id="today" className="hero">
          <div className="hero-left">
            <div className="season-pill">
              <span className="dot" />
              SEASON 02 · MUNICH → ROME
            </div>
            <h1 className="hero-title">
              Sub-3
              <br />
              in <em>Rome.</em>
            </h1>
            <p className="lede">
              A {weeks.length}-week marathon plan built in code. Watch data goes in, training load is computed, and
              a session for every day comes out. Open for anyone who wants to follow along.
            </p>
            <div className="stat-strip" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))" }}>
              <div>
                <span className="label">DAYS TO GO</span>
                <span className="stat-value" style={{ color: "var(--accent)" }}>
                  {pos.daysToGo}
                </span>
              </div>
              <div>
                <span className="label">GOAL</span>
                <span className="stat-value">{GOAL}</span>
              </div>
              <div>
                <span className="label">RACE PACE</span>
                <span className="stat-value">
                  {RACE_PACE}
                  <span className="unit">/km</span>
                </span>
              </div>
              <div>
                <span className="label">BASELINE</span>
                <span className="stat-value">{MUNICH.chipTime}</span>
              </div>
            </div>
            <div className="mono" style={{ fontSize: 13, color: "var(--dim)" }}>
              Maratona di Roma · Sun 14 Mar 2027 · Week {pos.week.week} of {weeks.length}
            </div>
          </div>

          <div className="today-col">
            <TodayCard day={pos.today} label={pos.status === "during" ? "TODAY" : pos.status === "before" ? "DAY 1" : "RACE DAY"} phase={pos.week.phase} week={pos.week.week} />
            {pos.tomorrow && <TomorrowCard day={pos.tomorrow} />}
            <div className="note">
              <Info />
              <p>
                <strong>Coach note, week {pos.week.week}.</strong> {pos.week.tip}
              </p>
            </div>
          </div>
        </section>

        <ThisWeek todayIso={todayIso} />

        <section id="plan" aria-labelledby="plan-title" className="section">
          <div className="plan-intro">
            <div className="section-head" style={{ margin: 0 }}>
              <span className="eyebrow">THE PLAN</span>
              <h2 id="plan-title" className="section-title">
                {weeks.length} weeks to Rome
              </h2>
            </div>
            <div className="plan-cta">
              <p>
                Recovery, then base, then marathon-specific work at 4:09/km, then taper. Five to seven runs a week,
                with pool and home strength sessions. Volume peaks at {formatKm(peak)} km — Munich's peak was{" "}
                {MUNICH.peakWeekKm} km.
              </p>
              <Link to="/program" className="cta">
                Browse every day of the program <ArrowRight />
              </Link>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <span className="label">WEEKLY KM · PLANNED</span>
              <div className="legend">
                {(Object.keys(PHASE_LABELS) as Phase[]).map((p) => (
                  <span key={p}>
                    <span className="swatch" style={{ background: PHASE_COLORS[p] }} />
                    {PHASE_LABELS[p]}
                  </span>
                ))}
              </div>
            </div>
            <div className="bars" role="img" aria-label={`Planned weekly kilometres, ${weeks.length} weeks, peaking at ${formatKm(peak)} km`}>
              {weeks.map((w) => {
                const current = w.week === pos.week.week && pos.status === "during";
                return (
                  <div key={w.week} className={`bar-col${current ? " current" : ""}`}>
                    <span className="mono">{Math.round(w.estKm)}</span>
                    <div
                      className={`bar${current ? " current" : ""}`}
                      style={{ height: `${((w.estKm / (peak * 1.03)) * 100).toFixed(1)}%`, background: PHASE_COLORS[w.phase] }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="bar-axis" aria-hidden="true">
              {weeks.map((w) => (
                <span key={w.week} className={w.week === pos.week.week && pos.status === "during" ? "current" : ""}>
                  {w.week}
                </span>
              ))}
            </div>
            <div className="panel-foot">
              <span>{dateLong(weeks[0].days[0].date)}</span>
              <span>{totalKm.toLocaleString("en-US")} KM TOTAL</span>
              <span style={{ color: "var(--orange)" }}>{dateLong(raceDay.date)} · RACE</span>
            </div>
          </div>

          <h3 className="disp" style={{ margin: "40px 0 16px", fontSize: 18, fontWeight: 700 }}>
            Checkpoints
          </h3>
          <ol className="checkpoints">
            {plan.gates.map((g) => (
              <li key={g.date}>
                <Link to={programDay(g.date)} className={`checkpoint${g.date < todayIso ? " past" : ""}`}>
                  <span className="mono">
                    {shortDate(g.date)} · WK {g.week}
                  </span>
                  <strong>{gateName(g.name)}</strong>
                  <p title={g.rule}>{g.rule}</p>
                </Link>
              </li>
            ))}
            <li>
              <Link to={programDay(raceDay.date)} className="checkpoint race">
                <span className="mono">
                  {shortDate(raceDay.date)} · WK {weeks.length}
                </span>
                <strong>Maratona di Roma</strong>
                <p>2:55:00 at {RACE_PACE}/km, ~5 min of slack under 3:00.</p>
              </Link>
            </li>
          </ol>
        </section>

        <section id="data" aria-labelledby="data-title" className="section">
          <div className="section-head">
            <span className="eyebrow">UNDER THE HOOD</span>
            <h2 id="data-title" className="section-title">
              Data in, session out
            </h2>
          </div>

          <div className="pipeline">
            {[
              ["01 · COLLECT", "Garmin + Strava", "Runs, swims, heart rate, streams"],
              ["02 · MODEL", "ATL · CTL · TSB", "Fatigue, fitness and form each day"],
              ["03 · COACH", "coach.json", "Today's recommendation, pushed daily"],
              ["04 · PUBLISH", "This page", "GitHub Pages, open to everyone"],
            ].map(([step, title, text]) => (
              <div key={step}>
                <span className="mono">{step}</span>
                <strong>{title}</strong>
                <span>{text}</span>
              </div>
            ))}
          </div>

          <div className="cards">
            <a className="feature" href={DASHBOARD_URL}>
              <div className="feature-body">
                <span className="badge">LIVE DASHBOARD</span>
                <span className="feature-title">Munich to Rome training</span>
                <p>
                  The full picture behind this plan: the Munich block, race analysis, every day of the Rome plan and
                  two reference plans for comparison. A worked example of what the data sources produce.
                </p>
                <span className="cta">
                  Open the dashboard <ArrowRight />
                </span>
              </div>
              <div className="mini" aria-hidden="true">
                <div className="mini-stats">
                  <div>
                    <div className="mono">MUNICH</div>
                    <div className="disp">{MUNICH.chipTime}</div>
                  </div>
                  <div>
                    <div className="mono">PEAK WEEK</div>
                    <div className="disp">{formatKm(peak)}</div>
                  </div>
                  <div>
                    <div className="mono">PLAN DAYS</div>
                    <div className="disp">{planDays}</div>
                  </div>
                </div>
                <div className="mini-bars">
                  {weeks.map((w) => (
                    <div key={w.week} style={{ height: `${((w.estKm / (peak * 1.03)) * 100).toFixed(1)}%`, background: PHASE_COLORS[w.phase] }} />
                  ))}
                </div>
              </div>
            </a>
            <div className="card">
              <span className="label">SOURCE</span>
              <strong>Garmin Connect</strong>
              <p>Daily activities and heart rate; the input for the training-load model.</p>
            </div>
            <div className="card">
              <span className="label">SOURCE</span>
              <strong>Strava</strong>
              <p>Activity streams — pace, heart rate, cadence and altitude per km.</p>
            </div>
            <a className="card" href={REPO_URL}>
              <span className="label">CODE</span>
              <strong>vibe-marathon on GitHub</strong>
              <p>The plan as JSON, the scripts and the checkpoint reviews.</p>
            </a>
          </div>
        </section>

        <section aria-labelledby="s1-title" className="section" style={{ paddingBottom: 72 }}>
          <Link to="/munich-2026" className="teaser">
            <div className="teaser-body">
              <span className="label" style={{ fontSize: 12, letterSpacing: "0.14em" }}>
                SEASON 01 · DONE
              </span>
              <h2 id="s1-title" className="disp" style={{ fontSize: "clamp(28px, 3.6vw, 40px)", fontWeight: 700, lineHeight: 1.1 }}>
                Munich Marathon 2026
              </h2>
              <p>First marathon, 11 October. Splits, heart rate, fuelling and what changes for Rome.</p>
              <span className="cta">
                See the race <ArrowRight />
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span className="big-time">{MUNICH.chipTime}</span>
              <span className="mono" style={{ fontSize: 13, color: "var(--dim)" }}>
                CHIP TIME · 42.195 KM · {MUNICH.avgPace}/KM
              </span>
            </div>
          </Link>
        </section>
      </main>
      <SiteFooter
        left="VIBE/MARATHON · Lorenzo Cocchia · Munich"
        right={`Plan updated ${prettyDate(romePlan.generatedAt)} · Not medical advice`}
      />
    </>
  );
}

/** "2026-10-10" -> "10 Oct 2026" */
function prettyDate(iso: string): string {
  return parseIso(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** "2026-10-12" -> "12 OCT 2026" */
function dateLong(iso: string): string {
  return `${shortDate(iso)} ${iso.slice(0, 4)}`;
}

function TodayCard({ day, label, phase, week }: { day: PlanDay; label: string; phase: Phase; week: number }) {
  const { training, estMin, estKm } = day;
  return (
    <article aria-labelledby="today-title" className="today-card">
      <div className="today-top">
        <span>
          {label} · {dayStamp(day.date)}
        </span>
        <span className="today-tag">
          {PHASE_LABELS[phase].toUpperCase()} · WK {week}
        </span>
      </div>
      <div className="today-head">
        <div className="today-icon">
          <SessionIcon type={training.type} size={34} />
        </div>
        <h2 id="today-title" className="today-title">
          {shortTitle(training.title)}
        </h2>
      </div>
      <div className="today-stats">
        <div>
          <span className="label">DURATION</span>
          <span className="v">{estMin.total > 0 ? `${estMin.total}′` : "—"}</span>
        </div>
        <div>
          <span className="label">DISTANCE</span>
          <span className="v">{estKm ? `${formatKm(estKm)} km` : "—"}</span>
        </div>
        <div>
          <span className="label">HR CAP</span>
          <span className="v">{hrCap(training.detail) ? `≤${hrCap(training.detail)}` : "—"}</span>
        </div>
      </div>
      <p className="today-detail">{training.detail}</p>
      <div className="chips">
        {[day.movement, day.food].filter(Boolean).map((c) => (
          <span key={c} className="chip">
            {c}
          </span>
        ))}
      </div>
    </article>
  );
}

function TomorrowCard({ day }: { day: PlanDay }) {
  const cap = hrCap(day.training.detail);
  return (
    <article aria-labelledby="tmrw-title" className="next-card">
      <div className="next-icon">
        <SessionIcon type={day.training.type} />
      </div>
      <div className="next-body">
        <span className="label" style={{ fontSize: 12, letterSpacing: "0.14em" }}>
          TOMORROW · {dayStamp(day.date)}
        </span>
        <h3 id="tmrw-title">{shortTitle(day.training.title)}</h3>
        <p>{day.training.detail}</p>
      </div>
      <div className="next-stats">
        <div>
          <span className="v">
            {day.estKm ? formatKm(day.estKm) : day.estMin.total > 0 ? day.estMin.total : "—"}
            <span className="unit">{day.estKm ? " km" : day.estMin.total > 0 ? " min" : ""}</span>
          </span>
          <span className="label">{day.estKm ? "DISTANCE" : "DURATION"}</span>
        </div>
        {cap && (
          <div>
            <span className="v">≤{cap}</span>
            <span className="label">HR CAP</span>
          </div>
        )}
      </div>
    </article>
  );
}

function ThisWeek({ todayIso }: { todayIso: string }) {
  const { week, tomorrow } = locate(romePlan, todayIso);
  const { runs, swims } = weekCounts(week);
  const summary = [
    weekRange(week),
    `${formatKm(week.estKm)} KM PLANNED`,
    `${runs} RUN${runs === 1 ? "" : "S"}`,
    swims ? `${swims} SWIM${swims === 1 ? "" : "S"}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section aria-labelledby="week-title" style={{ padding: "24px 0 56px" }}>
      <div className="week-head">
        <h2 id="week-title">
          This week <span>· {blockName(week.days[0])}</span>
        </h2>
        <div className="week-head-right">
          <span className="mono">{summary}</span>
          <Link to={programDay(todayIso)} className="cta">
            Full program <ArrowRight />
          </Link>
        </div>
      </div>
      <ol className="week-grid">
        {week.days.map((d) => {
          const status =
            d.date < todayIso ? "done" : d.date === todayIso ? "today" : d.date === tomorrow?.date ? "next" : "";
          const tag = { done: "DONE", today: "TODAY", next: "NEXT", "": "" }[status];
          return (
            <li key={d.date}>
              <Link to={programDay(d.date)} className={`day ${status}`}>
                <span className="day-top">
                  <span>{weekdayDate(d.date)}</span>
                  <span className="day-tag">{tag}</span>
                </span>
                <span className="day-title">{shortTitle(d.training.title)}</span>
                <span className="day-val">{dayValue(d)}</span>
                <span className="day-sub">{daySubtitle(d)}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
