import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { Link } from 'react-router-dom';
import {
  ComposedChart, LineChart, BarChart, PieChart, ScatterChart,
  Line, Bar, Area, Pie, Cell, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { typeColors, typeLabels, activityLabel, formatPace, useIsMobile, RecentSessionCard } from './shared';

const COACH_URL = 'https://raw.githubusercontent.com/cocchialorenzo9/vibe-marathon/main/data/coach.json';
const HISTORY_URL = 'https://raw.githubusercontent.com/cocchialorenzo9/vibe-marathon/main/data/chart-data.json';
const PLAN_URL = 'https://raw.githubusercontent.com/cocchialorenzo9/vibe-marathon/main/data/training-plan.json';
const ZONE_HISTORY_URL = 'https://raw.githubusercontent.com/cocchialorenzo9/vibe-marathon/main/data/zone-history.json';

// 5 fixed-bpm HR bands (not LT1/LT2-anchored Seiler zones — see
// vibe-marathon's docs/adr/0003-hr-bands-replace-seiler-zones.md). %LT shown
// for context only, computed against LT2=165bpm (device-reported); update if
// that number changes.
const BAND_DEFS = [
  { key: 1, label: "<130bpm (<79% LT)", color: "#4CAF93" },
  { key: 2, label: "130–140bpm (79–85% LT)", color: "#8BC34A" },
  { key: 3, label: "140–155bpm (85–94% LT)", color: "#E8A838" },
  { key: 4, label: "155–165bpm (94–100% LT)", color: "#E8894A" },
  { key: 5, label: "165+bpm (100%+ LT)", color: "#E05C5C" },
];

function BandPaceTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const bandEntries = payload.filter(p => p.dataKey !== "distance_km" && p.value != null);
  const volumeEntry = payload.find(p => p.dataKey === "distance_km");
  if (!bandEntries.length && volumeEntry?.value == null) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: 8, padding: "8px 10px", fontSize: 12 }}>
      <div style={{ color: "#666", marginBottom: 4 }}>{label}</div>
      {bandEntries.map(entry => (
        <div key={entry.dataKey} style={{ color: entry.color || entry.stroke, fontWeight: 700 }}>
          {entry.name}: {formatPace(entry.value)}
        </div>
      ))}
      {volumeEntry?.value != null && (
        <div style={{ color: "#888", marginTop: 4 }}>Volume: {volumeEntry.value}km</div>
      )}
    </div>
  );
}

const phaseColors = {
  base: "#4CAF93",
  build: "#E8A838",
  peak: "#E05C5C",
  taper: "#7B68EE",
};

function MetricCard({ label, value, sub, color }) {
  return (
    <div style={{
      flex: "1 1 130px",
      background: "#f8f9fa",
      border: "1.5px solid #e0e0e0",
      borderRadius: 12,
      padding: "14px 16px",
      textAlign: "center",
    }}>
      <div style={{ fontSize: 12, color: "#666", fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: color || "#1a1a2e", lineHeight: 1.2 }}>
        {value ?? "—"}
      </div>
      {sub && <div style={{ fontSize: 11, color: "#888", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

const METRIC_GLOSSARY = [
  {
    term: "Sleep",
    what: "Hours slept the night before, from the watch's sleep tracking.",
    read: "7h+ is green, 6-7h amber, under 6h red. Total duration matters more than the watch's own stage breakdown.",
    move: "Consistent bedtimes and enough total hours matter more than any single habit.",
  },
  {
    term: "Resting HR",
    what: "The lowest sustained 30-minute average heart rate overnight — not just the single lowest reading, which is too easily thrown off by one noisy sensor blip.",
    read: "Trending down over months = fitness improving. A one-day spike often means illness, heat, or incomplete recovery.",
    move: "Drops slowly with consistent aerobic training; spikes quickly (and temporarily) from poor sleep, heat, illness, or alcohol.",
  },
  {
    term: "TSB (Form)",
    what: "Training Stress Balance = CTL − ATL — are you carrying more fitness than fatigue right now, or the reverse?",
    read: "-10 to +10 is roughly neutral. -10 to -30 is where productive training actually happens. Below -30 is a real caution zone. +15 to +25 is race-ready fresh.",
    move: "Moves automatically as CTL/ATL do — managed by choosing when to push and when to back off, not targeted directly.",
  },
  {
    term: "CTL (Fitness)",
    what: "A 42-day rolling average of daily training stress (TSS) — a slow-moving proxy for fitness built up over roughly six weeks.",
    read: "Higher = more built-up aerobic fitness. It moves slowly on purpose — one big week barely shifts it.",
    move: "Consistent weeks over months. A safe ceiling is roughly 5-8 points/week — pushing faster for weeks on end raises injury/illness risk rather than fitness.",
  },
  {
    term: "ATL (Fatigue)",
    what: "The same rolling-average idea as CTL, but over just 7 days — how much you've asked of your body recently.",
    read: "Higher = more short-term fatigue on board. Unlike CTL, it's supposed to swing — up after a hard week, down after an easy one.",
    move: "A hard week raises it fast; a rest day or easy week brings it down fast. Normal, not a warning sign by itself.",
  },
  {
    term: "TSS (bars in the chart below)",
    what: "One number per day combining how long you went and how hard, so a short brutal session and a long easy run can both be measured on the same scale. 100 ≈ one hour at your lactate-threshold effort.",
    read: "Higher = more taxing. A run that didn't feel hard can still score high if heart rate sat above the easy zone for a long time.",
    move: "Run longer, run harder, or both — duration counts linearly, intensity counts squared, so a small pace increase costs disproportionately more.",
  },
  {
    term: "HR bands",
    what: "5 fixed heart-rate bands used to classify each run's minutes: <130bpm, 130-140, 140-155, 155-165, 165+ (the top edge is your lactate threshold, LT2, 165bpm device-reported). These are plain round bpm numbers, not derived from an estimated aerobic threshold — %LT is shown for context only, it doesn't define the boundaries. Running sessions only — analysis of what actually happened, separate from this plan's own easy/recovery/long HR targets.",
    read: "Each run is categorized into a single band by its average heart rate — not the band it spent the most minutes in, so a run with a hard mid-run push can average into a higher band than most of its minutes were actually in.",
    move: "There's no prescription tied to these bands (unlike the easy/recovery/long HR targets elsewhere) — they're purely descriptive, for comparing pace across runs.",
  },
  {
    term: "Pace by band / Pace vs. effort",
    what: "Each run's average pace (min/km) against the HR band its average heart rate falls into (\"Pace by band\" — one dot per run) or against its average %LT (\"Pace vs. effort\"). The grey bars on \"Pace by band\" are that run's distance — a fast pace on a short run reads differently than the same pace on a long one.",
    read: "If recent runs sit at a faster pace for the same (or lower) band/%LT than older runs, that's a real efficiency gain — the heart is doing less work for the same speed. Weigh it against the volume bar: a fast day on low volume is a smaller signal than the same pace sustained over a long run.",
    move: "Track this over months, not days — week-to-week noise (heat, fatigue, terrain) swamps small efficiency gains in the short term.",
  },
];

function MetricGlossary() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 28 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", textAlign: "left", border: "1.5px solid #e0e0e0",
          borderRadius: open ? "12px 12px 0 0" : 12, background: open ? "#f8f9fa" : "#fff",
          padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
        }}
      >
        <span style={{ fontSize: 14 }}>❓</span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>What do these numbers mean?</span>
        <span style={{ fontSize: 11, color: "#ccc", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>▼</span>
      </button>
      {open && (
        <div style={{ border: "1.5px solid #e0e0e0", borderTop: "none", borderRadius: "0 0 12px 12px", background: "#fff", padding: "14px 16px" }}>
          {METRIC_GLOSSARY.map((m, i) => (
            <div key={m.term} style={{ marginBottom: i < METRIC_GLOSSARY.length - 1 ? 14 : 0, paddingBottom: i < METRIC_GLOSSARY.length - 1 ? 14 : 0, borderBottom: i < METRIC_GLOSSARY.length - 1 ? "1px solid #f0f0f0" : "none" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e", marginBottom: 4 }}>{m.term}</div>
              <div style={{ fontSize: 12, color: "#555", lineHeight: 1.5, marginBottom: 4 }}>{m.what}</div>
              <div style={{ fontSize: 12, color: "#555", lineHeight: 1.5, marginBottom: 4 }}><strong style={{ color: "#1a1a2e" }}>Reading it: </strong>{m.read}</div>
              <div style={{ fontSize: 12, color: "#555", lineHeight: 1.5 }}><strong style={{ color: "#1a1a2e" }}>Moving it: </strong>{m.move}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function groupByType(history) {
  const counts = {};
  for (const entry of history) {
    const type = entry.recommendation_type;
    if (!type || !typeColors[type]) continue;
    counts[type] = (counts[type] || 0) + 1;
  }
  return Object.entries(counts).map(([type, count]) => ({
    type,
    label: typeLabels[type] || type,
    count,
    color: typeColors[type],
  }));
}

// Takes zoneHistory (not the plan-driven `history`) — every entry there is
// already a device-registered running session (see build_zone_history.py in
// the vibe-marathon repo), so no recommendation_type filtering is needed.
function groupByWeek(runs) {
  const weeks = {};
  for (const entry of runs) {
    const d = new Date(entry.date + 'T00:00:00');
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const weekNum = Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
    const key = `W${String(weekNum).padStart(2, '0')}`;
    if (!weeks[key]) weeks[key] = { week: key, distance_km: 0 };
    weeks[key].distance_km = Math.round((weeks[key].distance_km + (entry.distance_km || 0)) * 10) / 10;
  }
  return Object.values(weeks).slice(-12);
}

function getPlanDay(plan, date) {
  if (!plan?.weeks) return undefined;
  for (const week of plan.weeks) {
    const day = (week.days || []).find(d => d.date === date);
    if (day) return day;
  }
  return undefined;
}

function getUpcomingDays(plan, n = 7) {
  if (!plan?.weeks) return [];
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = [];
  for (const week of plan.weeks) {
    for (const day of week.days || []) {
      if (day.date >= today && upcoming.length < n) {
        upcoming.push({ ...day, phase: week.phase, weekLabel: week.label });
      }
    }
  }
  return upcoming;
}

function UpcomingDayCard({ day, isMobile }) {
  const [open, setOpen] = useState(false);
  const color = typeColors[day.training?.type] || "#9E9E9E";
  const label = typeLabels[day.training?.type] || day.training?.type || "Rest";
  const d = new Date(day.date + 'T00:00:00');
  const dateStr = d.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div style={{
      border: `1.5px solid ${open ? color : "#e0e0e0"}`,
      borderRadius: 12,
      background: open ? `${color}08` : "#fff",
      marginBottom: 8,
      overflow: "hidden",
      transition: "border-color 0.15s",
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", textAlign: "left", background: "none", border: "none",
          cursor: "pointer", padding: "12px 14px",
          display: "flex", alignItems: "center", gap: 10,
        }}
      >
        <div style={{ flexShrink: 0, textAlign: "center", minWidth: 44 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#1a1a2e" }}>{dateStr.split(' ')[0]}</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#1a1a2e" }}>{dateStr.split(' ').slice(1).join(' ')}</div>
        </div>
        <div style={{ flex: 1 }}>
          {day.training ? (
            <>
              <span style={{
                background: color, color: "white", borderRadius: 6,
                padding: "2px 7px", fontSize: 10, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.04em", marginRight: 7,
              }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>
                {day.training.title}
              </span>
            </>
          ) : (
            <span style={{ fontSize: 13, color: "#999" }}>Rest day</span>
          )}
          {day.bigPicture && (
            <div style={{ fontSize: 11, color: "#888", marginTop: 2, lineHeight: 1.4 }}>
              {day.bigPicture.slice(0, 80)}{day.bigPicture.length > 80 ? '…' : ''}
            </div>
          )}
        </div>
        <div style={{ fontSize: 11, color: "#ccc", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }}>▼</div>
      </button>

      {open && (
        <div style={{ padding: "0 14px 14px 14px" }}>
          {day.training?.detail && (
            <div style={{
              fontSize: 13, color: "#444", lineHeight: 1.55,
              borderLeft: `3px solid ${color}`, paddingLeft: 10, marginBottom: 10,
            }}>
              {day.training.detail}
            </div>
          )}
          {day.bigPicture && (
            <p style={{ fontSize: 12, color: "#555", margin: "0 0 8px 0", lineHeight: 1.55 }}>
              {day.bigPicture}
            </p>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {day.movement && (
              <div style={{
                background: "#f0faf2", borderRadius: 8, padding: "6px 10px",
                fontSize: 11, color: "#2e7d32", flex: "1 1 140px",
              }}>
                <span style={{ fontWeight: 700 }}>🚲 Move: </span>{day.movement}
              </div>
            )}
            {day.food && (
              <div style={{
                background: "#fffbf0", borderRadius: 8, padding: "6px 10px",
                fontSize: 11, color: "#7a5200", flex: "1 1 140px",
              }}>
                <span style={{ fontWeight: 700 }}>🍝 Food: </span>{day.food}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function VibeDashboard() {
  const [coach, setCoach] = useState(null);
  const [history, setHistory] = useState([]);
  const [plan, setPlan] = useState(null);
  const [zoneHistory, setZoneHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    Promise.all([
      fetch(COACH_URL).then(r => r.json()).catch(() => null),
      fetch(HISTORY_URL).then(r => r.json()).catch(() => []),
      fetch(PLAN_URL).then(r => r.json()).catch(() => null),
      fetch(ZONE_HISTORY_URL).then(r => r.json()).catch(() => []),
    ]).then(([coachData, histData, planData, zoneData]) => {
      setCoach(coachData);
      setHistory(Array.isArray(histData) ? histData : []);
      setPlan(planData);
      setZoneHistory(Array.isArray(zoneData) ? zoneData : []);
      setLoading(false);
    });
  }, []);

  const readiness = coach?.readiness;
  const rec = coach?.recommendation;
  const recentActivity = coach?.recentActivity;
  const recColor = typeColors[rec?.type] || "#9E9E9E";

  const todayDate = new Date().toISOString().slice(0, 10);
  const todayPlanDay = getPlanDay(plan, todayDate);
  const todayColor = typeColors[todayPlanDay?.training?.type] || "#9E9E9E";
  const todayLabel = typeLabels[todayPlanDay?.training?.type] || (todayPlanDay?.training ? todayPlanDay.training.type : "Rest");

  const notStarted = coach?.date == null && history.length === 0;
  const noHistory = coach?.date != null && history.length === 0;

  const last90 = history.slice(-90).map(e => ({ ...e, date: e.date?.slice(5) }));
  const zoneLast60 = zoneHistory.slice(-60).map(e => ({ ...e, date: e.date?.slice(5) }));
  const paceRuns = zoneLast60.filter(e => e.avg_pace_min_km != null);
  const paceHalf = Math.ceil(paceRuns.length / 2);
  const paceEarlier = paceRuns.slice(0, paceHalf);
  const paceRecent = paceRuns.slice(paceHalf);
  const bandPaceData = paceRuns.map(e => {
    const row = { date: e.date, distance_km: e.distance_km };
    BAND_DEFS.forEach(b => {
      row[`band${b.key}_pace`] = e.avg_band === b.key ? e.avg_pace_min_km : null;
    });
    return row;
  });
  const weeklyVol = groupByWeek(zoneHistory);
  const trainingMix = groupByType(history);
  const hasCharts = history.length > 0;

  const upcomingDays = getUpcomingDays(plan, 7);
  // getUpcomingDays includes today (see below), but the active dashboard state
  // already shows today in its own dedicated "Today" card — exclude it here
  // so it doesn't also appear at the top of "Next 7 sessions".
  const futureDays = upcomingDays.filter(d => d.date !== todayDate);

  const raceDate = (() => {
    if (!coach?.date || !coach?.daysToRace) return null;
    const d = new Date(coach.date + 'T00:00:00');
    d.setDate(d.getDate() + coach.daysToRace);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  })();

  const px = isMobile ? "12px 14px" : "32px 28px";

  return (
    <Layout title="Vibe Marathon — Dashboard" description="Live marathon preparation dashboard">
      <div style={{ maxWidth: 900, margin: "0 auto", padding: px, fontFamily: "inherit" }}>

        {/* Breadcrumb */}
        <div style={{ marginBottom: 20 }}>
          <Link to="/munich-2026" style={{ fontSize: 13, color: "#4CAF93", fontWeight: 600, textDecoration: "none" }}>
            ← Munich 2026
          </Link>
        </div>

        {/* Title */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: "#1a1a2e", marginBottom: 4 }}>
            🏃 Vibe Marathon
          </h1>
          <p style={{ color: "#666", fontSize: 14, margin: 0 }}>
            Munich Marathon 2026 · live preparation dashboard
          </p>
        </div>

        {/* Race plan */}
        <Link to="/munich-2026/race-plan" style={{ textDecoration: "none" }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
            background: "#1a1a2e", color: "#fff", borderRadius: 12, padding: "12px 16px", marginBottom: 24,
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800 }}>🏁 Race plan · Sun Oct 11</div>
              <div style={{ fontSize: 12, color: "#c8c8d8" }}>Pacing lanes, checkpoint decisions, honey fueling</div>
            </div>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#4ade80" }}>→</span>
          </div>
        </Link>

        {loading ? (
          <div style={{ color: "#888", textAlign: "center", padding: 64, fontSize: 15 }}>Loading…</div>
        ) : !coach ? (
          <div style={{ color: "#E05C5C", textAlign: "center", padding: 64 }}>Could not load coach data.</div>
        ) : notStarted ? (
          /* ── Pre-training state ── */
          <>
            <div style={{ textAlign: "center", padding: isMobile ? "32px 0 24px" : "48px 0 32px" }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🗓️</div>
              <div style={{
                fontSize: isMobile ? 64 : 88,
                fontWeight: 900,
                color: "#1a1a2e",
                lineHeight: 1,
                marginBottom: 8,
              }}>
                {coach.daysToRace}
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, color: "#555", marginBottom: 4 }}>
                days to race day
              </div>
              {raceDate && (
                <div style={{ fontSize: 13, color: "#999", marginBottom: 28 }}>
                  Munich Marathon · {raceDate}
                </div>
              )}
              <div style={{
                display: "inline-block",
                background: "#f8f9fa",
                border: "1.5px solid #e0e0e0",
                borderRadius: 14,
                padding: "18px 24px",
                maxWidth: 420,
                textAlign: "left",
              }}>
                <p style={{ fontSize: 14, color: "#444", margin: "0 0 0 0", lineHeight: 1.6 }}>
                  Training hasn't started yet. This dashboard will come alive once daily coach
                  updates begin — showing workout recommendations, recovery signals, and
                  training load trends.
                </p>
              </div>
            </div>

            {/* Show upcoming plan even before training starts */}
            {upcomingDays.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1a1a2e", marginBottom: 12 }}>
                  Coming up — first 7 sessions
                </h3>
                {upcomingDays.map(day => (
                  <UpcomingDayCard key={day.date} day={day} isMobile={isMobile} />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Today / Tomorrow */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
              {todayPlanDay && (
                <div style={{
                  flex: isMobile ? "1 1 100%" : "1 1 320px",
                  minWidth: 0,
                  border: `2px solid ${todayColor}`,
                  borderRadius: 14,
                  padding: "16px 20px",
                  background: `${todayColor}12`,
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                    Today
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                    {todayPlanDay.training ? (
                      <>
                        <span style={{
                          background: todayColor,
                          color: "white",
                          borderRadius: 8,
                          padding: "3px 10px",
                          fontSize: 12,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}>
                          {todayLabel}
                        </span>
                        <span style={{ fontWeight: 700, fontSize: isMobile ? 15 : 17, color: "#1a1a2e" }}>
                          {todayPlanDay.training.title}
                        </span>
                      </>
                    ) : (
                      <span style={{ fontWeight: 700, fontSize: isMobile ? 15 : 17, color: "#999" }}>Rest day</span>
                    )}
                  </div>
                  {todayPlanDay.training?.detail && (
                    <p style={{
                      fontSize: 13,
                      color: "#555",
                      margin: "0 0 8px 0",
                      borderLeft: `3px solid ${todayColor}`,
                      paddingLeft: 12,
                      lineHeight: 1.5,
                    }}>
                      {todayPlanDay.training.detail}
                    </p>
                  )}
                  {todayPlanDay.bigPicture && (
                    <p style={{ fontSize: 13, color: "#555", margin: "0 0 10px 0", lineHeight: 1.55 }}>
                      {todayPlanDay.bigPicture}
                    </p>
                  )}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {todayPlanDay.movement && (
                      <div style={{
                        background: "#f0faf2", borderRadius: 8, padding: "6px 10px",
                        fontSize: 11, color: "#2e7d32", flex: "1 1 140px",
                      }}>
                        <span style={{ fontWeight: 700 }}>🚲 Move: </span>{todayPlanDay.movement}
                      </div>
                    )}
                    {todayPlanDay.food && (
                      <div style={{
                        background: "#fffbf0", borderRadius: 8, padding: "6px 10px",
                        fontSize: 11, color: "#7a5200", flex: "1 1 140px",
                      }}>
                        <span style={{ fontWeight: 700 }}>🍝 Food: </span>{todayPlanDay.food}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {rec && (
                <div style={{
                  flex: isMobile ? "1 1 100%" : "1 1 320px",
                  minWidth: 0,
                  border: `2px solid ${recColor}`,
                  borderRadius: 14,
                  padding: "16px 20px",
                  background: `${recColor}12`,
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                    Tomorrow
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                    <span style={{
                      background: recColor,
                      color: "white",
                      borderRadius: 8,
                      padding: "3px 10px",
                      fontSize: 12,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}>
                      {rec.type}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: isMobile ? 15 : 17, color: "#1a1a2e" }}>
                      {rec.title}
                    </span>
                  </div>
                  {rec.reasoning && (
                    <p style={{ fontSize: 14, color: "#444", margin: "0 0 10px 0", lineHeight: 1.55 }}>
                      {rec.reasoning}
                    </p>
                  )}
                  {rec.sessionDetail && (
                    <p style={{
                      fontSize: 13,
                      color: "#555",
                      margin: "0 0 8px 0",
                      borderLeft: `3px solid ${recColor}`,
                      paddingLeft: 12,
                      lineHeight: 1.5,
                    }}>
                      {rec.sessionDetail}
                    </p>
                  )}
                  {rec.bikeNote && (
                    <p style={{ fontSize: 12, color: "#777", margin: "6px 0 0 0" }}>🚴 {rec.bikeNote}</p>
                  )}
                  {rec.swimNote && (
                    <p style={{ fontSize: 12, color: "#777", margin: "4px 0 0 0" }}>🏊 {rec.swimNote}</p>
                  )}
                </div>
              )}
            </div>

            {/* Hero */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
              <MetricCard label="Days to Race" value={coach.daysToRace} color="#1a1a2e" />
              <MetricCard
                label="Phase"
                value={coach.phase ? coach.phase.charAt(0).toUpperCase() + coach.phase.slice(1) : "—"}
                color={phaseColors[coach.phase] || "#1a1a2e"}
              />
            </div>

            {/* Key metrics */}
            {readiness && (
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28 }}>
                <MetricCard
                  label="Sleep"
                  value={readiness.sleep?.hours != null ? `${readiness.sleep.hours}h` : "—"}
                  color={
                    readiness.sleep?.hours == null ? "#9E9E9E"
                    : readiness.sleep.hours >= 7 ? "#4CAF93"
                    : readiness.sleep.hours >= 6 ? "#E8A838"
                    : "#E05C5C"
                  }
                />
                <MetricCard
                  label="Resting HR"
                  value={readiness.restingHR?.value ?? "—"}
                  sub={readiness.restingHR?.trend ?? null}
                  color={
                    readiness.restingHR?.trend === "normal" ? "#4CAF93"
                    : readiness.restingHR?.trend === "elevated" ? "#E05C5C"
                    : "#1a1a2e"
                  }
                />
                <MetricCard
                  label="TSB (Form)"
                  value={readiness.tsb != null ? readiness.tsb.toFixed(1) : "—"}
                  sub="CTL − ATL"
                  color={
                    readiness.tsb == null ? "#9E9E9E"
                    : readiness.tsb >= 0 ? "#4CAF93"
                    : readiness.tsb >= -15 ? "#E8A838"
                    : "#E05C5C"
                  }
                />
              </div>
            )}

            <MetricGlossary />

            {/* Performance Management Chart (PMC) */}
            {hasCharts && last90.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1a1a2e", marginBottom: 12 }}>
                  Performance Management Chart — last 90 days
                </h3>
                <ResponsiveContainer width="100%" height={240}>
                  <ComposedChart data={last90} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={Math.floor(last90.length / 6)} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} domain={[0, 'auto']} />
                    <Tooltip />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                    <Bar yAxisId="right" dataKey="tss" fill="#B0BEC5" name="TSS" barSize={4} radius={[1, 1, 0, 0]} />
                    <Area yAxisId="left" type="monotone" dataKey="tsb" name="TSB (Form)"
                          stroke="#7B68EE" fill="#7B68EE" fillOpacity={0.15}
                          strokeWidth={1.5} strokeDasharray="4 2" baseValue={0} />
                    <Line yAxisId="left" type="monotone" dataKey="ctl" stroke="#4CAF93" dot={false} name="CTL (Fitness)" strokeWidth={2} />
                    <Line yAxisId="left" type="monotone" dataKey="atl" stroke="#E8A838" dot={false} name="ATL (Fatigue)" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Pace by HR band — one dot per run, categorized by its average HR */}
            {paceRuns.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1a1a2e", marginBottom: 4 }}>
                  Pace by HR band
                </h3>
                <p style={{ fontSize: 12, color: "#888", margin: "0 0 12px 0", lineHeight: 1.5 }}>
                  Each run's pace, plotted on the HR band its average heart rate falls into.
                  Lower = faster. The grey bars are that run's distance (km), so a high dot that's
                  also a tall bar was both hard and long. Dots on the same band are connected across
                  runs; hover to see just that run's band and volume.
                </p>
                <ResponsiveContainer width="100%" height={240}>
                  <ComposedChart data={bandPaceData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={Math.floor(bandPaceData.length / 8)} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10 }} label={{ value: 'min/km', angle: -90, position: 'insideLeft', fontSize: 10 }} domain={['dataMin - 0.3', 'dataMax + 0.3']} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} domain={[0, 'auto']} label={{ value: 'km', angle: 90, position: 'insideRight', fontSize: 10 }} />
                    <Tooltip content={<BandPaceTooltip />} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                    <Bar yAxisId="right" dataKey="distance_km" fill="#B0BEC5" name="Volume (km)" barSize={6} radius={[2, 2, 0, 0]} />
                    {BAND_DEFS.map(b => (
                      <Line
                        key={b.key}
                        yAxisId="left"
                        type="monotone"
                        dataKey={`band${b.key}_pace`}
                        name={b.label}
                        stroke={b.color}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        connectNulls
                      />
                    ))}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Pace vs. effort (%LT) — earlier vs. recent runs */}
            {paceRuns.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1a1a2e", marginBottom: 4 }}>
                  Pace vs. effort
                </h3>
                <p style={{ fontSize: 12, color: "#888", margin: "0 0 12px 0", lineHeight: 1.5 }}>
                  Each dot is one run: effort (avg %LT) vs. pace. "Recent" dots sitting lower/left of
                  "Earlier" dots (faster pace at the same or lower effort) would signal real efficiency gains.
                </p>
                <ResponsiveContainer width="100%" height={220}>
                  <ScatterChart margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis type="number" dataKey="avg_pct_lt" name="Avg %LT" unit="%" tick={{ fontSize: 10 }} domain={['dataMin - 5', 'dataMax + 5']} label={{ value: '%LT', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                    <YAxis type="number" dataKey="avg_pace_min_km" name="Pace" tick={{ fontSize: 10 }} domain={['dataMin - 0.3', 'dataMax + 0.3']} label={{ value: 'min/km', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      formatter={(value, name) => name === "Pace" ? [formatPace(value), name] : [`${value}%`, name]}
                      labelFormatter={() => ""}
                    />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                    <Scatter name="Earlier" data={paceEarlier} fill="#bbb" />
                    <Scatter name="Recent" data={paceRecent} fill="#1a1a2e" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Weekly Volume + Training Mix */}
            {hasCharts && (
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 32 }}>
                {weeklyVol.length > 0 && (
                  <div style={{ flex: isMobile ? "1 1 100%" : "1 1 300px", minWidth: 0 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1a1a2e", marginBottom: 12 }}>
                      Weekly Volume (km)
                    </h3>
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart data={weeklyVol} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="distance_km" name="km" stroke="#4CAF93" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {trainingMix.length > 0 && (
                  <div style={{ flex: isMobile ? "1 1 100%" : "1 1 260px", minWidth: 0 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1a1a2e", marginBottom: 12 }}>
                      Training Mix
                    </h3>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Tooltip />
                        <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                        <Pie data={trainingMix} dataKey="count" nameKey="label" innerRadius={35} outerRadius={55} paddingAngle={2}>
                          {trainingMix.map(entry => (
                            <Cell key={entry.type} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {noHistory && (
              <div style={{
                border: "1.5px solid #e0e0e0",
                borderRadius: 14,
                padding: "28px 24px",
                textAlign: "center",
                background: "#fafafa",
                marginBottom: 32,
              }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📈</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e", marginBottom: 6 }}>
                  Training has started — charts building up
                </div>
                <p style={{ fontSize: 13, color: "#888", margin: 0, lineHeight: 1.6 }}>
                  Today's data is in. Training load, weekly volume, and trend charts will
                  appear here as daily updates accumulate over the coming days.
                </p>
              </div>
            )}

            {/* Upcoming Days */}
            {futureDays.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1a1a2e", marginBottom: 12 }}>
                  Next 7 sessions
                </h3>
                {futureDays.map(day => (
                  <UpcomingDayCard key={day.date} day={day} isMobile={isMobile} />
                ))}
              </div>
            )}

            {/* Recent Sessions */}
            {recentActivity?.sessions?.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1a1a2e", margin: 0 }}>
                    Recent Sessions
                  </h3>
                  <Link to="/munich-2026/journal" style={{ fontSize: 12, color: "#4CAF93", fontWeight: 600, textDecoration: "none" }}>
                    View full Training Journal →
                  </Link>
                </div>
                {recentActivity.analysis && (
                  <p style={{ fontSize: 12, color: "#888", margin: "0 0 12px 0", lineHeight: 1.5 }}>
                    {recentActivity.analysis}
                  </p>
                )}
                {recentActivity.sessions.map(session => (
                  <RecentSessionCard key={session.date + session.type} session={session} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div style={{ fontSize: 11, color: "#bbb", textAlign: "center", marginTop: 20, paddingTop: 20, borderTop: "1px solid #f0f0f0" }}>
          Updated daily via{' '}
          <a href="https://github.com/cocchialorenzo9/vibe-marathon" style={{ color: "#bbb" }}>
            vibe-marathon
          </a>
          {' · '}
          <Link to="/munich-2026/plan" style={{ color: "#bbb" }}>
            view full base plan
          </Link>
        </div>
      </div>
    </Layout>
  );
}
