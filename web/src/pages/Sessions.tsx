import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";
import { ChevronRight, Info } from "../components/icons";
import { SESSION_TYPES, blockName, dateLong, dayStamp, prose, romePlan, tileTitle, weekdayDate, type PlanDay } from "../lib/plan";
import {
  HR_BANDS,
  LT2,
  STATUS,
  bandOf,
  capFor,
  compareRows,
  mmss,
  pfitzingerName,
  plannedFor,
  sessionLog,
  sessionOn,
  weekProgress,
  type SessionDay,
  type Tone,
} from "../lib/sessions";
import { useToday } from "../lib/useToday";

const weeks = romePlan.weeks;

const TONE: Record<Tone, string> = { neutral: "var(--text-2)", warn: "#c8bfff", bad: "#ffb08a", good: "#7ee89a" };

/** HR scale for the band ladder and lap bars, in bpm. */
const SCALE_LO = 110;
const SCALE_HI = 190;
const pos = (bpm: number) => `${(Math.max(0, Math.min(1, (bpm - SCALE_LO) / (SCALE_HI - SCALE_LO))) * 100).toFixed(1)}%`;

/** A past plan day with whatever the sync has written for it. */
interface Row {
  plan: PlanDay;
  session?: SessionDay;
}

function statusOf(r: Row) {
  return STATUS[r.session?.status ?? "pending"];
}

export default function Sessions() {
  const todayIso = useToday();
  const [params, setParams] = useSearchParams();

  // Every plan day up to today; today only once something is synced for it.
  const groups = weeks
    .map((w) => ({
      week: w,
      rows: w.days
        .filter((d) => d.date < todayIso || (d.date === todayIso && sessionOn(d.date)))
        .map((d): Row => ({ plan: d, session: sessionOn(d.date) }))
        .reverse(),
    }))
    .filter((g) => g.rows.length > 0)
    .reverse();
  const all = groups.flatMap((g) => g.rows);

  const requested = all.find((r) => r.plan.date === params.get("day"));
  const sel = requested ?? all[0];

  const pick = (iso: string) => {
    const next = new URLSearchParams(params);
    next.set("day", iso);
    setParams(next, { replace: true });
  };

  useEffect(() => {
    document.title = "Session log — Vibe Marathon";
  }, []);

  const selWeek = sel ? weeks.find((w) => w.days.includes(sel.plan))! : weeks[0];
  const p = weekProgress(selWeek);
  const synced = new Date(sessionLog.syncedAt);

  return (
    <>
      <SiteNav />
      <main className="container" style={{ paddingBottom: 72 }}>
        <section className="program-head">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span className="eyebrow">PLANNED VS DONE · STRAVA</span>
            <h1 className="program-title">Session log</h1>
            <p className="program-lede">
              Every past day of the plan next to what the watch recorded. Pick a session to see what changed, where
              it sat against your HR cap and bands, and what to carry forward.
            </p>
          </div>
          {sel && (
            <dl className="stat-strip sessions-totals" aria-label={`Week ${selWeek.week} so far`}>
              <div>
                <dt className="label">WEEK {selWeek.week} KM</dt>
                <dd className="disp">
                  {p.kmDone}
                  <span className="of"> / {p.kmPlanned}</span>
                </dd>
              </div>
              <div>
                <dt className="label">RUNS</dt>
                <dd className="disp">
                  {p.runsDone}
                  <span className="of"> / {p.runsPlanned}</span>
                </dd>
              </div>
              <div>
                <dt className="label">HR CAP KEPT</dt>
                <dd className="disp" style={{ color: p.capKept < p.capRuns ? "var(--orange)" : undefined }}>
                  {p.capKept}
                  <span className="of"> / {p.capRuns}</span>
                </dd>
              </div>
              <div>
                <dt className="label">ON PLAN DAY</dt>
                <dd className="disp">
                  {p.onPlanDay}
                  <span className="of"> / {p.runsDone}</span>
                </dd>
              </div>
            </dl>
          )}
        </section>

        {!sel ? (
          <div className="note">
            <Info />
            <p>The plan starts on {dateLong(weeks[0].days[0].date).toLowerCase()}. Sessions show up here the evening they're run.</p>
          </div>
        ) : (
          <div className="program-layout">
            <section aria-labelledby="log-title" className="calendar session-list">
              <h2 id="log-title" className="visually-hidden">
                Past sessions
              </h2>
              {groups.map((g) => (
                <div key={g.week.week} className="session-group">
                  <h3 className="label session-group-title">
                    WEEK {g.week.week} · {blockName(g.week.days[0]).toUpperCase()}
                  </h3>
                  <ul>
                    {g.rows.map((r) => {
                      const st = statusOf(r);
                      const a = r.session?.activity;
                      const on = r === sel;
                      return (
                        <li key={r.plan.date}>
                          <button type="button" className={`session-row${on ? " selected" : ""}`} aria-pressed={on} onClick={() => pick(r.plan.date)}>
                            <span className="swatch" style={{ background: SESSION_TYPES[r.plan.training.type].color }} />
                            <span className="session-row-body">
                              <span className="mono">{dayStamp(r.plan.date)}</span>
                              <span className="session-row-title">
                                {tileTitle(prose(r.plan.training.title))}
                                {r.session?.movedFrom ? ` → ran ${weekdayDate(r.session.movedFrom)}'s run` : ""}
                              </span>
                              <span className="session-row-sub">
                                {a ? `${a.distanceKm.toFixed(2)} km · ${mmss(a.movingSec)}${a.avgHr ? ` · avg ${a.avgHr} bpm` : ""}` : st.line}
                              </span>
                            </span>
                            <span className="status-pill" style={{ color: st.color, borderColor: st.color }}>
                              {st.label}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
              <Link to="/munich-2026" className="session-row session-archive">
                <span className="swatch" style={{ background: SESSION_TYPES.race.color }} />
                <span className="session-row-body">
                  <span className="mono">SUN 11 OCT</span>
                  <span className="session-row-title">Munich Marathon · 3:19:44</span>
                </span>
                <ChevronRight />
              </Link>
            </section>

            <Review row={sel} />
          </div>
        )}
      </main>
      <SiteFooter
        left={`VIBE/MARATHON · data/sessions.json · synced ${synced.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`}
        right="HR bands: ADR 0003 · Not medical advice"
      />
    </>
  );
}

function Review({ row }: { row: Row }) {
  const { plan, session } = row;
  const st = statusOf(row);
  const meant = (session && plannedFor(session)) ?? plan;
  const a = session?.activity;
  const cap = session ? capFor(session) : null;
  const pf = pfitzingerName(meant);
  const week = weeks.find((w) => w.days.includes(plan))!;

  return (
    <section aria-labelledby="rv-title" className="program-week">
      <p className="visually-hidden" aria-live="polite">
        {`${dayStamp(plan.date)}: ${session?.headline ?? prose(plan.training.title)}`}
      </p>
      <div className="program-week-head">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span className="mono" style={{ fontSize: 12, letterSpacing: "0.14em", color: "var(--text-2)" }}>
            {dateLong(plan.date)} · WEEK {week.week}
          </span>
          <h2 id="rv-title" className="section-title-sm" style={{ lineHeight: 1.1 }}>
            {session?.headline ?? prose(plan.training.title)}
          </h2>
        </div>
        <span className="status-pill big" style={{ color: st.color, borderColor: st.color }}>
          {st.label}
        </span>
      </div>

      {!session ? (
        <div className="note">
          <Info />
          <p>
            Nothing synced for this day yet. The Strava sync runs every evening and re-checks the last week, so late
            uploads land on the next run.
          </p>
        </div>
      ) : (
        <>
          <div className="table-wrap" style={{ marginTop: 0 }}>
            <table className="compare">
              <thead>
                <tr>
                  <th scope="col">
                    <span className="visually-hidden">Measure</span>
                  </th>
                  <th scope="col">PLANNED</th>
                  <th scope="col" className="accent">
                    DONE
                  </th>
                  <th scope="col">DIFF</th>
                </tr>
              </thead>
              <tbody>
                {compareRows(session, meant).map((c) => (
                  <tr key={c.key}>
                    <th scope="row">{c.key}</th>
                    <td className="mono">{c.plan}</td>
                    <td className="mono" style={{ fontWeight: 600 }}>
                      {c.done}
                    </td>
                    <td className="mono" style={{ color: TONE[c.tone] }}>
                      {c.diff}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {a?.hrNote && <p className="hr-note">{a.hrNote}</p>}

          {a && a.laps.length > 0 && <Laps laps={a.laps} cap={cap} />}
          {a?.avgHr != null && <BandLadder avg={a.avgHr} max={a.maxHr} cap={cap} />}

          <div className="info-box pf-card">
            <span className="label" style={{ color: "#a497ff" }}>
              PFITZINGER WOULD CALL IT
            </span>
            <strong>{pf.name}</strong>
            <span>{pf.what}</span>
          </div>

          {session.learn.length > 0 && (
            <div className="carry">
              <h3 className="label" style={{ color: "var(--accent)" }}>
                WHAT TO CARRY FORWARD
              </h3>
              <ol>
                {session.learn.map((t, i) => (
                  <li key={i}>
                    <span className="mono">{String(i + 1).padStart(2, "0")}</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <Link to={`/program?day=${plan.date}`} className="outline-pill">
          See the day in the program
        </Link>
        {a && (
          <a className="outline-pill" href={`https://www.strava.com/activities/${a.stravaId}`}>
            Open in Strava
          </a>
        )}
      </div>
    </section>
  );
}

function Laps({ laps, cap }: { laps: { km: number; sec: number; hr: number }[]; cap: number | null }) {
  // Zoom the HR axis onto the run so a few bpm over the cap are visible.
  const hrs = laps.map((l) => l.hr).concat(cap ?? []);
  const lo = Math.min(...hrs) - 12;
  const hi = Math.max(...hrs) + 6;
  const lapPos = (bpm: number) => `${(Math.max(0, Math.min(1, (bpm - lo) / (hi - lo))) * 100).toFixed(1)}%`;
  return (
    <figure className="panel laps" aria-labelledby="laps-title">
      <figcaption className="panel-head" style={{ marginBottom: 14 }}>
        <span id="laps-title" className="label">
          HEART RATE PER KM{cap ? " · VS YOUR CAP" : ""}
        </span>
        {cap && (
          <span className="legend">
            <span>
              <span className="cap-key" />
              Plan cap {cap}
            </span>
          </span>
        )}
      </figcaption>
      <div className="lap-bars">
        {cap && <span className="cap-line" style={{ bottom: lapPos(cap) }} />}
        {laps.map((l, i) => {
          const over = cap != null && l.hr > cap;
          return (
            <div key={i} style={{ flex: `${l.km} 1 0` }}>
              <span className="mono" style={{ color: over ? "#ffb08a" : "var(--text-2)" }}>
                {l.hr}
              </span>
              <div className="bar" style={{ height: lapPos(l.hr), background: over ? "var(--orange)" : SESSION_TYPES.easy.color }} />
            </div>
          );
        })}
      </div>
      <div className="lap-axis">
        {laps.map((l, i) => (
          <div key={i} style={{ flex: `${l.km} 1 0` }}>
            <span className="mono">{l.km < 1 ? `${Math.round(l.km * 1000)} m` : `KM ${i + 1}`}</span>
            <span className="mono">{mmss(l.sec / l.km)}</span>
          </div>
        ))}
      </div>
      <p className="visually-hidden">
        {laps.map((l, i) => `Lap ${i + 1}: ${l.hr} bpm at ${mmss(l.sec / l.km)} per km`).join("; ")}
      </p>
    </figure>
  );
}

function BandLadder({ avg, max, cap }: { avg: number; max: number | null; cap: number | null }) {
  const avgBand = bandOf(avg);
  const marks = [
    cap && { at: cap, label: `CAP ${cap}`, color: "var(--accent)" },
    { at: avg, label: `AVG ${avg}`, color: "#ffb08a" },
    max && { at: max, label: `MAX ${max}`, color: "var(--orange)" },
    { at: LT2, label: `LT ${LT2}`, color: "#ff3d6e" },
  ].filter((m): m is { at: number; label: string; color: string } => !!m);
  return (
    <div className="panel ladder">
      <div className="panel-head" style={{ marginBottom: 14 }}>
        <h3 className="label">WHERE THE RUN SAT · HR BANDS</h3>
        <span className="label" style={{ color: "var(--faint)" }}>
          BPM · TOP EDGE = LT2 {LT2}
        </span>
      </div>
      <div className="ladder-track">
        {HR_BANDS.map((b, i) => {
          const lo = b.lo ?? SCALE_LO;
          const hi = b.hi ?? SCALE_HI;
          return (
            <div
              key={b.label}
              className={`ladder-band${i === avgBand ? " on" : ""}`}
              style={{ left: pos(lo), width: `${((hi - lo) / (SCALE_HI - SCALE_LO)) * 100}%` }}
            >
              <span className="mono">{b.label}</span>
            </div>
          );
        })}
        {marks.map((m, i) => (
          <div key={m.label} className="ladder-mark" style={{ left: pos(m.at), borderColor: m.color }}>
            <span className="mono" style={{ color: m.color, top: 40 + i * 18 }}>
              {m.label}
            </span>
          </div>
        ))}
      </div>
      <p className="ladder-note" style={{ marginTop: 12 + marks.length * 18 }}>
        Average band: <strong>{HR_BANDS[avgBand].label} bpm</strong>
        {cap ? (avg > cap ? `, above the ${cap} cap.` : `, inside the ${cap} cap.`) : "."} Bands classify what the
        watch recorded; the plan's own cap is what the session was written against.
      </p>
    </div>
  );
}
