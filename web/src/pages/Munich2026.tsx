import { useEffect } from "react";
import { Link } from "react-router-dom";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";
import { ArrowLeft, ArrowRight } from "../components/icons";
import {
  BLOCK,
  BLOCK_WEEKS_KM,
  COMPARISON,
  HR_BANDS,
  HR_PER_KM,
  LESSONS,
  MODELS,
  MUNICH,
  PACE_PER_KM,
} from "../data/munich2026";

const ARCHIVE = [
  { to: "/munich-2026/dashboard", title: "Coach dashboard", text: "Training load, zone history and the daily tips as they stood on race week." },
  { to: "/munich-2026/race-plan", title: "Race plan", text: "HR-led pacing lanes, checkpoints, the decision tree and the honey fuelling plan." },
  { to: "/munich-2026/journal", title: "Training journal", text: "What went well, what went wrong and what to change, session by session." },
  { to: "/munich-2026/plan", title: "15-week plan", text: "The full Munich training plan, with cross-training and reading list." },
];

function mmss(s: number): string {
  return `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
}

function hms(s: number): string {
  return `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

const avg = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;

// Prediction track spans 3:00–3:35.
const TRACK_LO = 10800;
const TRACK_HI = 12900;
const trackPos = (s: number) => `${(((s - TRACK_LO) / (TRACK_HI - TRACK_LO)) * 100).toFixed(1)}%`;

export default function Munich2026() {
  useEffect(() => {
    document.title = "Munich Marathon 2026 — Vibe Marathon";
  }, []);

  const steadyPace = mmss(avg(PACE_PER_KM.slice(1, 29)));
  const fadePace = mmss(avg(PACE_PER_KM.slice(32, 41)));
  const bandTotal = HR_BANDS.reduce((s, b) => s + b.minutes, 0);
  const bandMax = Math.max(...HR_BANDS.map((b) => b.minutes));
  const blockMax = Math.max(...BLOCK_WEEKS_KM) * 1.07;

  return (
    <>
      <SiteNav />
      <main className="container">
        <section style={{ padding: "64px 0 48px", display: "flex", flexDirection: "column", gap: 28 }}>
          <Link to="/" className="back">
            <ArrowLeft />
            Back to Season 02
          </Link>
          <div className="label" style={{ fontSize: 12, letterSpacing: "0.14em" }}>
            SEASON 01 · SUN 11 OCT 2026 · FIRST MARATHON
          </div>
          <h1 className="disp" style={{ fontSize: "clamp(40px, 6vw, 72px)", fontWeight: 800, lineHeight: 1, letterSpacing: "-0.02em" }}>
            Munich Marathon
          </h1>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 440px), 1fr))", gap: 32, alignItems: "end" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span className="eyebrow">CHIP TIME</span>
              <span className="chip-time">{MUNICH.chipTime}</span>
            </div>
            <div className="stat-strip two">
              <Stat label="FIRST HALF" value={MUNICH.firstHalf} />
              <Stat label="SECOND HALF" value={MUNICH.secondHalf} />
              <Stat label="AVG PACE" value={MUNICH.avgPace} unit="/km" />
              <Stat label="AVG HR" value={String(MUNICH.avgHr)} unit=" bpm" />
              <Stat label="SPLIT" value={MUNICH.split} color="var(--orange)" />
              <Stat label="CARBS" value={String(MUNICH.carbsPerHour)} unit=" g/h" />
            </div>
          </div>
          <p className="mono" style={{ fontSize: 12, color: "var(--faint)" }}>
            Halves from the watch, which measured 0.8% long. Second half includes a stop at km 33.
          </p>
        </section>

        <section aria-labelledby="pace-title" className="section" style={{ paddingTop: 48, paddingBottom: 48 }}>
          <div className="week-head" style={{ marginBottom: 20 }}>
            <h2 id="pace-title" className="section-title-sm">
              Pace, km by km
            </h2>
            <div className="legend">
              <span>
                <span className="swatch" style={{ background: "var(--accent)" }} />
                km 1–30 · on plan
              </span>
              <span>
                <span className="swatch" style={{ background: "var(--orange)" }} />
                km 31–43 · the fade
              </span>
            </div>
          </div>
          <div className="panel" style={{ padding: 24 }}>
            <div className="label" style={{ marginBottom: 12 }}>
              PACE · TALLER IS FASTER
            </div>
            <div className="pace-bars" role="img" aria-label={`Pace per km: about ${steadyPace} per km to km 29, fading to ${fadePace} from km 33`}>
              {PACE_PER_KM.map((p, i) => (
                <div key={i}>
                  <span className="mono">{i + 1 === 33 ? "STOP" : ""}</span>
                  <div
                    className="bar"
                    style={{
                      height: `${Math.max(6, ((345 - p) / 85) * 100).toFixed(1)}%`,
                      background: i + 1 <= 30 ? "var(--accent)" : "var(--orange)",
                      borderRadius: "3px 3px 0 0",
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="label" style={{ margin: "18px 0 8px" }}>
              HEART RATE · {Math.min(...HR_PER_KM)}–{Math.max(...HR_PER_KM)} BPM
            </div>
            <div className="hr-bars" aria-hidden="true">
              {HR_PER_KM.map((hr, i) => (
                <div key={i} style={{ height: `${(((hr - 144) / 20) * 100).toFixed(1)}%` }} />
              ))}
            </div>
            <div className="panel-foot">
              <span>KM 1</span>
              <span>KM 21</span>
              <span>KM 43 (WATCH)</span>
            </div>
          </div>
          <div className="grid-auto" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginTop: 14 }}>
            <MiniStat label="KM 2–29 AVERAGE" value={steadyPace} unit="/km" />
            <MiniStat label="KM 33–41 AVERAGE" value={fadePace} unit="/km" color="var(--orange)" />
            <MiniStat label="IF KM 26–32 EFFORT HAD HELD" value="3:14:30–3:16:00" />
          </div>
        </section>

        <section aria-labelledby="block-title" className="section" style={{ paddingTop: 48, paddingBottom: 48 }}>
          <div className="cards" style={{ gap: 24 }}>
            <div className="panel" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <h2 id="block-title" className="disp" style={{ fontSize: 22, fontWeight: 700 }}>
                The training block
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8 }}>
                <BlockStat label="TOTAL" value={`${BLOCK.totalKm} km`} />
                <BlockStat label="RUNS" value={String(BLOCK.runs)} />
                <BlockStat label="PEAK WEEK" value={`${BLOCK.peakWeekKm} km`} />
                <BlockStat label="LONGEST" value={String(BLOCK.longestKm)} />
              </div>
              <div className="bars" style={{ height: 180, gap: 6 }} role="img" aria-label="Weekly running km, 6 July to 5 October, peaking at 73 km">
                {BLOCK_WEEKS_KM.map((km, i) => (
                  <div key={i} className="bar-col" style={{ gap: 4 }}>
                    <span className="mono" style={{ fontSize: 9, color: "var(--dim)" }}>
                      {Math.round(km)}
                    </span>
                    <div className="bar" style={{ height: `${((km / blockMax) * 100).toFixed(1)}%`, background: "var(--slate)", borderRadius: "3px 3px 0 0" }} />
                  </div>
                ))}
              </div>
              <div className="panel-foot" style={{ paddingTop: 0 }}>
                <span>6 JUL</span>
                <span>WEEKLY KM</span>
                <span>5 OCT</span>
              </div>
            </div>

            <div className="panel" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <h2 className="disp" style={{ fontSize: 22, fontWeight: 700 }}>
                Time in heart-rate bands
              </h2>
              <p style={{ fontSize: 14, color: "var(--muted)" }}>{Math.round(bandTotal / 60)} hours of running, 7 Jul – 8 Oct.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {HR_BANDS.map((b) => (
                  <div key={b.bpm} className="band-row">
                    <span className="mono" style={{ fontSize: 12, color: "var(--text-2)" }}>
                      {b.bpm}
                    </span>
                    <div className="band-track">
                      <div style={{ width: `${((b.minutes / bandMax) * 100).toFixed(1)}%`, background: b.color }} />
                    </div>
                    <span className="mono" style={{ fontSize: 12, textAlign: "right" }}>
                      {Math.round((b.minutes / bandTotal) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="pred-title" className="section" style={{ paddingTop: 48, paddingBottom: 48 }}>
          <h2 id="pred-title" className="section-title-sm" style={{ marginBottom: 8 }}>
            Predicted vs real
          </h2>
          <p style={{ marginBottom: 24, fontSize: 15, color: "var(--muted)" }}>Three models before the race. The line marks {MUNICH.chipTime}.</p>
          <div className="panel" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
            {MODELS.map((m) => {
              const d = m.seconds - MUNICH.chipSeconds;
              return (
                <div key={m.name} className="model-row">
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <span style={{ fontSize: 15, fontWeight: 500 }}>{m.name}</span>
                    <span className="mono" style={{ fontSize: 14, color: "var(--text-2)" }}>
                      {hms(m.seconds)}{" "}
                      <span style={{ color: d < 0 ? "var(--orange)" : "var(--slate)" }}>
                        {d < 0 ? "−" : "+"}
                        {Math.round(Math.abs(d) / 60)} min
                      </span>
                    </span>
                  </div>
                  <div className="model-track">
                    <div className="model-actual" style={{ left: trackPos(MUNICH.chipSeconds) }} />
                    <div className="model-dot" style={{ left: trackPos(m.seconds) }} />
                  </div>
                </div>
              );
            })}
            <div className="panel-foot" style={{ paddingTop: 0 }}>
              <span>3:00</span>
              <span>3:15</span>
              <span>3:35</span>
            </div>
          </div>
        </section>

        <section aria-labelledby="lessons-title" className="section" style={{ paddingTop: 48, paddingBottom: 48 }}>
          <h2 id="lessons-title" className="section-title-sm" style={{ marginBottom: 24 }}>
            What Munich taught
          </h2>
          <div className="grid-auto" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: 14 }}>
            {LESSONS.map((l) => (
              <article key={l.tag} className="lesson">
                <span className="mono">{l.tag}</span>
                <h3>{l.title}</h3>
                <p>{l.text}</p>
              </article>
            ))}
          </div>

          <div className="table-wrap">
            <table>
              <caption>Munich block vs Rome plan</caption>
              <thead>
                <tr>
                  <th scope="col">
                    <span className="visually-hidden">Metric</span>
                  </th>
                  <th scope="col">MUNICH 2026</th>
                  <th scope="col" className="accent">
                    ROME 2027
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map(([k, a, b]) => (
                  <tr key={k}>
                    <th scope="row">{k}</th>
                    <td>{a}</td>
                    <td>{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="archive-title" className="section" style={{ paddingTop: 48, paddingBottom: 72 }}>
          <div className="section-head" style={{ marginBottom: 24 }}>
            <span className="eyebrow">SEASON 01 ARCHIVE</span>
            <h2 id="archive-title" className="section-title-sm">
              The Munich tools
            </h2>
          </div>
          <div className="cards" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))" }}>
            {ARCHIVE.map((a) => (
              <Link key={a.to} to={a.to} className="card">
                <strong>{a.title}</strong>
                <p>{a.text}</p>
                <span className="cta" style={{ fontSize: 14 }}>
                  Open <ArrowRight />
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter left="VIBE/MARATHON · Season 01 archive" right="Data: Strava activity streams, Garmin zone history" />
    </>
  );
}

function Stat({ label, value, unit, color }: { label: string; value: string; unit?: string; color?: string }) {
  return (
    <div>
      <span className="label">{label}</span>
      <span className="stat-value" style={{ color }}>
        {value}
        {unit && <span className="unit">{unit}</span>}
      </span>
    </div>
  );
}

function MiniStat({ label, value, unit, color }: { label: string; value: string; unit?: string; color?: string }) {
  return (
    <div className="card" style={{ padding: 18, borderRadius: 16, gap: 6 }}>
      <span className="label">{label}</span>
      <span className="disp" style={{ fontSize: 22, fontWeight: 700, color }}>
        {value}
        {unit && <span className="unit">{unit}</span>}
      </span>
    </div>
  );
}

function BlockStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mono" style={{ fontSize: 10, color: "var(--dim)" }}>
        {label}
      </div>
      <div className="disp" style={{ fontSize: 20, fontWeight: 700 }}>
        {value}
      </div>
    </div>
  );
}
