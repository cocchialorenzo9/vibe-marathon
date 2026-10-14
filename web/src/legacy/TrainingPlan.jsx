import React, { useState, useEffect, useMemo } from 'react';
import Layout from './Layout';
import { formatPace, RecentSessionCard } from './shared';

const PLAN_URL = 'https://raw.githubusercontent.com/cocchialorenzo9/vibe-marathon/main/data/training-plan.json';
const COACH_URL = 'https://raw.githubusercontent.com/cocchialorenzo9/vibe-marathon/main/data/coach.json';

const FALLBACK_PACES = [
  { label: "Race Goal", pace: "4:16/km", color: "#e05c5c", desc: "Sub-3h marathon" },
  { label: "Marathon Pace (MP)", pace: "4:10–4:20/km", color: "#E8A838", desc: "Core of the plan" },
  { label: "Tempo run", pace: "4:30–4:40/km", color: "#7B68EE", desc: "Controlled effort" },
  { label: "Easy run", pace: "~75-85% LT", color: "#4CAF93", desc: "Can hold a conversation" },
  { label: "Long run", pace: "~75-85% LT", color: "#4CAF93", desc: "Never push hard" },
];

const EMOJI_BY_TYPE = { swim: "🏊 ", race: "🏅 " };

function extractLTBand(detail) {
  const m = /~?\d+-\d+%\s*LT/.exec(detail || "");
  return m ? `~${m[0].replace(/^~/, "")}` : null;
}

function findFirstDetailByType(planData, type) {
  for (const w of planData?.weeks || []) {
    for (const d of w.days || []) {
      if (d.training?.type === type && /LT/.test(d.training.detail || "")) return d.training.detail;
    }
  }
  return null;
}

function formatBpmRange(range) {
  if (!Array.isArray(range) || range.length !== 2) return null;
  return `${range[0]}–${range[1]} bpm`;
}

function mapPlanWeeks(planData) {
  if (!Array.isArray(planData?.weeks)) return null;
  return planData.weeks.map((w) => ({
    week: w.week,
    phase: w.phase,
    label: w.label,
    bikeNote: w.bikeNote,
    swimNote: w.swimNote,
    tip: w.tip,
    estKm: w.estKm ?? null,
    hasRace: (w.days || []).some((d) => d.training?.type === "race"),
    sessions: (w.days || []).map((d) => ({
      day: d.dayLabel,
      type: d.training?.type ?? "rest",
      title: `${EMOJI_BY_TYPE[d.training?.type] ?? ""}${d.training?.title ?? "Rest day"}`,
      detail: d.training?.detail ?? "",
    })),
  }));
}

function computePaces(plan, coach) {
  if (!plan) return FALLBACK_PACES;
  const easyLT = extractLTBand(findFirstDetailByType(plan, "easy")) ?? "~75-85% LT";
  const longLT = extractLTBand(findFirstDetailByType(plan, "long")) ?? "~75-85% LT";
  const ltBpm = formatBpmRange(coach?.readiness?.lactateThreshold?.easyAerobic_bpm);
  const realPace = coach?.volumeCheck?.realZone2Pace_min_km;
  const paceEstimate = realPace != null
    ? `≈${formatPace(realPace)} — estimated from limited data, will refine as more easy runs are logged`
    : "Can hold a conversation";
  return [
    { label: "Race Goal", pace: plan.goalPace ?? "4:16/km", color: "#e05c5c", desc: "Sub-3h marathon" },
    { label: "Marathon Pace (MP)", pace: "4:10–4:20/km", color: "#E8A838", desc: "Core of the plan" },
    { label: "Tempo run", pace: "4:30–4:40/km", color: "#7B68EE", desc: "Controlled effort" },
    { label: "Easy run", pace: ltBpm ? `${ltBpm} (${easyLT})` : easyLT, color: "#4CAF93", desc: paceEstimate },
    { label: "Long run", pace: ltBpm ? `${ltBpm} (${longLT})` : longLT, color: "#4CAF93", desc: "Never push hard" },
  ];
}

const PHASES = [
  {
    id: "base",
    name: "Base Phase",
    weeks: "1–4",
    dates: "Jul 5 – Aug 1",
    color: "#4CAF93",
    bg: "#f0faf6",
    border: "#b2ddd1",
    description: "Build aerobic endurance and routine. Start touching marathon pace in a controlled way. Monday swim class is still active — use it as your weekly warm-up.",
    nutrition: {
      points: [
        "Carbs: 55–60% of daily calories (pasta, rice, whole-grain bread, oats)",
        "Protein: 1.4–1.6g/kg of body weight to support muscular adaptation",
        "Hydration: 2–2.5L of water per day — daily cycling makes you sweat more than you realize",
        "Pre-run (1–2h before): banana, toast with jam, energy bar",
        "Post-workout (within 30min): protein + carbs (e.g. Greek yogurt + fruit)",
        "Avoid: excess alcohol, ultra-processed foods, heavy meals the night before a long run",
      ],
    },
  },
  {
    id: "build",
    name: "Build Phase",
    weeks: "5–9",
    dates: "Aug 2 – Sep 6",
    color: "#E8A838",
    bg: "#fdf8ee",
    border: "#f0d89a",
    description: "Increasing volume with more structured quality sessions. Monday swim class ends — real rest days open up. The bike becomes an active recovery tool.",
    nutrition: {
      points: [
        "Carbs: 60–65% — longer runs need more glycogen",
        "Carb load the night before long runs: risotto, pasta, polenta",
        "During long runs (>60min): gel or dates every 40–45 min — train your gut too",
        "Protein: 1.6–1.8g/kg — muscles are under greater stress",
        "Iron & B vitamins: red meat 2x/week, legumes, spinach",
        "Omega-3 to reduce inflammation: salmon, walnuts, flaxseeds 3–4x/week",
      ],
    },
  },
  {
    id: "peak",
    name: "Peak Phase",
    weeks: "10–13",
    dates: "Sep 7 – Oct 4",
    color: "#E05C5C",
    bg: "#fdf1f1",
    border: "#f0b8b8",
    description: "Maximum volume and race simulations. Daily cycling stays but ONLY at easy pace. Consider the U-Bahn on days after long runs or hard interval sessions.",
    nutrition: {
      points: [
        "Carbs: 65–70% — you're at peak load",
        "Test your race strategy during long runs (which gels, at what km, how much water)",
        "Electrolytes after long runs: water + pinch of salt + lemon, or sports drink",
        "Don't try new foods or supplements less than 3 weeks before the race",
        "Magnesium & potassium daily: banana, spinach, almonds to prevent cramps",
        "Sleep: minimum 8h — 70% of adaptation happens overnight",
      ],
    },
  },
  {
    id: "taper",
    name: "Tapering",
    weeks: "14–15",
    dates: "Oct 5 – Oct 11",
    color: "#7B68EE",
    bg: "#f5f3ff",
    border: "#ccc6f8",
    description: "Total volume reduction. Daily cycling is fine but at a relaxed pace. In race week consider cutting or skipping the bike Thursday–Saturday.",
    nutrition: {
      points: [
        "Day –3: start carbo-loading (pasta, rice, bread) — 8–10g of carbs/kg",
        "Day –1: light but carb-rich dinner, nothing new",
        "Race morning: breakfast 2–3h before — porridge or toast with honey, banana + coffee",
        "During the marathon: gel every 5–6km from km 15. Start at 4:20/km, hold to km 35, then give everything",
        "Post-race: protein + carbs within 30min, then celebrate!",
        "Avoid: alcohol, fatty foods, excess fiber in the 2 days before the race",
      ],
    },
  },
];

const typeStyle = {
  easy: { label: "Easy", bg: "#e8f5e9", color: "#2e7d32", dot: "#4caf50" },
  tempo: { label: "Quality", bg: "#fff3e0", color: "#e65100", dot: "#ff9800" },
  long: { label: "Long Run", bg: "#e3f2fd", color: "#1565c0", dot: "#2196f3" },
  "medium-long": { label: "Medium-Long", bg: "#e3f2fd", color: "#1565c0", dot: "#2196f3" },
  race: { label: "RACE", bg: "#f3e5f5", color: "#6a1b9a", dot: "#9c27b0" },
  swim: { label: "Swim", bg: "#e0f7fa", color: "#00695c", dot: "#00bcd4" },
  rest: { label: "Rest", bg: "#f5f5f5", color: "#757575", dot: "#9e9e9e" },
};

const phaseMap = Object.fromEntries(PHASES.map((p) => [p.id, p]));

const RESOURCES = [
  {
    category: "📋 Training Plans",
    items: [
      { name: "Hal Higdon — Novice 1 (free)", url: "https://www.halhigdon.com/training-programs/marathon-training/novice-1-marathon/", desc: "The most widely used plan for first-time marathoners. Free downloadable PDF. Gold-standard reference cited across r/firstmarathon." },
      { name: "Hal Higdon — Marathon 3 (3 days/week)", url: "https://www.halhigdon.com/training-programs/marathon-training/marathon-3/", desc: "The Higdon plan designed for 3 runs per week. Includes structured cross-training — the inspiration behind this plan." },
      { name: "Marathon Handbook — Guide & Training", url: "https://marathonhandbook.com/", desc: "Free guides, daily newsletter. Great for nutrition, shoes, and cross-training. Read by 320k+ runners." },
    ],
  },
  {
    category: "💬 Reddit Community",
    items: [
      { name: "r/running", url: "https://www.reddit.com/r/running/", desc: "The main subreddit. Wiki with beginner resources, discussions on training plans, injuries, and gear." },
      { name: "r/firstmarathon", url: "https://www.reddit.com/r/firstmarathon/", desc: "Specific to first-time marathoners. Very supportive community." },
      { name: "r/runningshoegeeks", url: "https://www.reddit.com/r/runningshoegeeks/", desc: "Shoe discussions with no sponsors or ads. Real reviews from real runners." },
    ],
  },
  {
    category: "👟 Shoes — Buying Guide",
    items: [
      { name: "iRunFar — Best Marathon Shoes 2026", url: "https://www.irunfar.com/best-marathon-shoes", desc: "For beginners: ASICS Superblast 3 (top pick — cushioning + versatility in one shoe). Alternative: Adidas Adizero EVO SL." },
      { name: "The Run Testers — Best Shoes 2026", url: "https://theruntesters.com/the-best-marathon-running-shoes/", desc: "For beginners: ASICS Novablast 5 (value). For maximum comfort: Nike Vomero Plus." },
      { name: "r/runningshoegeeks", url: "https://www.reddit.com/r/runningshoegeeks/", desc: "Before buying, post your gait/pronation and budget. The community responds within hours." },
      { name: "laufshop.de — Best German online running store", url: "https://www.laufshop.de/", desc: "Germany's largest running-specific online retailer. Wide selection, 30-day returns, reliable sizing. Best first stop after your Laufanalyse if the in-store price is high." },
      { name: "SportScheck — Online + Munich store", url: "https://www.sportscheck.com/", desc: "Large sports chain with an online store and Munich locations. Easy 30-day returns in-store or by post. Good for price-comparing before buying." },
    ],
  },
  {
    category: "⌚ GPS Watches — Buying Guide",
    items: [
      { name: "Coros Pace 3 — Best value (~€200)", url: "https://www.coros.com/", desc: "r/running's favorite for price-to-performance. Extremely accurate GPS, 38h battery in continuous GPS mode, weighs 39g — you barely feel it. No subscription required. Has full triathlon mode + open-water swim GPS — already future-proof if you move into tri." },
      { name: "Garmin Forerunner 165 — Entry Garmin (~€250)", url: "https://www.garmin.com/", desc: "The entry point into the Garmin ecosystem. All essential features: GPS, HR, heart rate zones, VO2Max, intervals. Has basic multisport mode — check tri features against your goals before committing. More than enough for a first marathon." },
      { name: "Garmin Forerunner 265 — Recommended (~€350)", url: "https://www.garmin.com/", desc: "Garmin's best-seller for serious runners. AMOLED display, HRV status (tells you each morning how recovered you are), Training Readiness score, Body Battery. Full triathlon mode with open-water swim GPS and transition support — covers sprint to 70.3 Ironman." },
      { name: "Garmin Forerunner 955 — Dedicated tri watch (~€500)", url: "https://www.garmin.com/", desc: "The Garmin built specifically for triathlon. Full Ironman support, ClimbPro for cycling, PacePro for running, Training Readiness, ~20h GPS battery. Overkill for a first marathon — but worth knowing it exists. Buy the FR265 first; consider upgrading when you sign up for your first 70.3." },
      { name: "DC Rainmaker — Independent GPS Reviews", url: "https://www.dcrainmaker.com/", desc: "The absolute reference site for GPS sports watch reviews. Every watch gets an 8,000+ word review with real GPS testing and HR comparisons. Search 'best triathlon GPS watch' for tri-specific content covering sprint to full Ironman." },
      { name: "r/Garmin — Community & advice", url: "https://www.reddit.com/r/Garmin/", desc: "Large Garmin users community (~180k members). Best place for watch-specific questions: feature setup, firmware updates, training metrics explained. Much more specific than r/running for watch topics." },
      { name: "r/COROS — Community & advice", url: "https://www.reddit.com/r/COROS/", desc: "Coros users community. Smaller but focused — firmware updates, triathlon mode setup, open water swim tips. Useful if you go with the Pace 3." },
    ],
  },
  {
    category: "🏊🚴🏃 Triathlon & Ironman",
    items: [
      { name: "r/triathlon — Main community", url: "https://www.reddit.com/r/triathlon/", desc: "The main triathlon subreddit. Beginner-friendly wiki, gear advice, training plans, race reports. Great place to ask 'I come from running, how do I start tri?'" },
      { name: "r/IronmanTriathlon — Ironman-specific", url: "https://www.reddit.com/r/IronmanTriathlon/", desc: "Focused on full and 70.3 Ironman distances. Race reports, long-course nutrition, bike setup, and taper advice. Read before committing to a registration." },
      { name: "r/Swimming — technique & open water", url: "https://www.reddit.com/r/Swimming/", desc: "Pool and open water swimming community. Your weekly swim sessions are a head start — this community helps you build efficiency before you need it for a tri." },
      { name: "DC Rainmaker — Best triathlon GPS watches", url: "https://www.dcrainmaker.com/", desc: "Search 'best triathlon GPS watch' on this site for dedicated tri content with real test data, covering sprint-distance up to full Ironman watches." },
    ],
  },
];

const WATCH_TIPS = [
  "Essential features for this plan: real-time GPS pace, interval timer (for repeats), HR monitor, at least 10–12h GPS battery (for the full race).",
  "Coros Pace 3 (~€200): best price-to-performance, outstanding battery, precise GPS. Great if you want serious data without paying the Garmin premium.",
  "Garmin Forerunner 265 (~€350): recommended if you want Training Readiness (tells you 0–100 each morning how ready you are to train hard — very useful with daily cycling).",
  "You don't need the watch before week 1: buy it by end of June so you have July to learn the features. First 2 weeks use it only for pace — then add HR and intervals.",
  "Apple Watch works (with Strava or Garmin Connect), but the battery doesn't last 3h GPS in continuous workout mode — borderline for the marathon.",
  "Thinking about triathlon? Both the Coros Pace 3 and Garmin FR265 already support tri mode (swim → bike → run auto-transitions, open water GPS). The Coros Pace 3's 38h battery also covers a full Ironman. No need to buy a separate watch later.",
];

const SHOE_TIPS = [
  "First step: free gait analysis at a store in Munich. They analyze your running on a treadmill — filters out half the choices.",
  "Budget guide: €130–180 for a training shoe. Avoid carbon plate shoes — they add no value during a beginner's prep.",
  "Buy them in July, break them in over the first 3–4 weeks. In September consider a second identical pair to keep fresh for race day.",
  "Size: go 0.5–1 size up from your regular shoes. Feet swell during long runs.",
  "Top picks 2026 for beginners: ASICS Superblast 3 (versatile top pick), ASICS Novablast 5 (value), Nike Vomero Plus (maximum comfort).",
];

export default function MarathonPage() {
  const [activeWeek, setActiveWeek] = useState(null);
  const [activePhase, setActivePhase] = useState(null);
  const [activeRes, setActiveRes] = useState(null);
  const [view, setView] = useState("weeks");
  const [isMobile, setIsMobile] = useState(false);
  const [showZoneGlossary, setShowZoneGlossary] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 480);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const [plan, setPlan] = useState(null);
  const [coach, setCoach] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(PLAN_URL).then((r) => r.json()).catch(() => null),
      fetch(COACH_URL).then((r) => r.json()).catch(() => null),
    ]).then(([planData, coachData]) => {
      setPlan(planData);
      setCoach(coachData);
      setDataLoading(false);
    });
  }, []);

  const weeks = useMemo(() => mapPlanWeeks(plan), [plan]);
  const paces = useMemo(() => computePaces(plan, coach), [plan, coach]);
  const recentActivity = coach?.recentActivity;
  const volumeCheck = coach?.volumeCheck;
  const weekKmRange = useMemo(() => {
    if (!weeks) return null;
    const withKm = weeks.filter((w) => w.estKm != null);
    if (!withKm.length) return null;
    const min = withKm.reduce((a, b) => (a.estKm < b.estKm ? a : b));
    const max = withKm.reduce((a, b) => (a.estKm > b.estKm ? a : b));
    return { min, max };
  }, [weeks]);

  const TABS = [
    { id: "weeks", label: "📅 Plan" },
    { id: "nutrition", label: "🥗 Nutrition" },
    { id: "resources", label: "📚 Resources" },
  ];

  const pad = isMobile ? "10px" : "14px";

  return (
    <Layout title="Munich Marathon Plan — Sub 3h" description="15-week sub-3h marathon training plan for the Munich Marathon 2026, with cycling and swimming cross-training.">
      <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: "#f7f8fc", minHeight: "100vh" }}>

        <div style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)", color: "white", padding: isMobile ? "18px 14px 16px" : "24px 18px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", opacity: 0.5, marginBottom: 5 }}>Training Plan</div>
          <div style={{ fontSize: isMobile ? 19 : 24, fontWeight: 800, letterSpacing: -0.5 }}>Munich Marathon</div>
          <div style={{ fontSize: isMobile ? 11 : 13, opacity: 0.6, marginTop: 3 }}>October 11, 2026 · 15 weeks · 3 sessions/week</div>

          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(224,92,92,0.25)", border: "1.5px solid rgba(224,92,92,0.6)", borderRadius: 20, padding: "5px 14px", marginTop: 12 }}>
            <span style={{ fontSize: 15 }}>🎯</span>
            <span style={{ fontWeight: 800, fontSize: isMobile ? 12 : 14, color: "#ff8a8a" }}>SUB 3 HOURS</span>
            <span style={{ fontSize: 11, opacity: 0.7 }}>→ 4:16/km</span>
          </div>

          <div style={{ marginTop: 10, display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
            <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 16, padding: "4px 10px", fontSize: 11 }}>📍 Jul 5, 2026</div>
            <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 16, padding: "4px 10px", fontSize: 11 }}>⏱ 5km in 22min</div>
            <div style={{ background: "rgba(0,188,212,0.2)", borderRadius: 16, padding: "4px 10px", fontSize: 11, color: "#80deea" }}>🏊 Swim Mon (→Jul) then Wed</div>
            <div style={{ background: "rgba(76,175,80,0.2)", borderRadius: 16, padding: "4px 10px", fontSize: 11, color: "#a5d6a7" }}>🚲 Bike 9km/day (4.5km each way)</div>
            <div style={{ background: "rgba(76,175,80,0.15)", borderRadius: 16, padding: "4px 10px", fontSize: 11, color: "#a5d6a7" }}>🏊🚲 Wed: up to 20km (work + pool)</div>
            {coach?.readiness?.lactateThreshold?.estimate_bpm != null && (
              <div style={{ background: "rgba(224,92,92,0.15)", borderRadius: 16, padding: "4px 10px", fontSize: 11, color: "#ff9a9a" }}>
                🫀 LT ~{coach.readiness.lactateThreshold.estimate_bpm} bpm
              </div>
            )}
            {coach?.readiness?.vo2max?.value != null && (
              <div style={{ background: "rgba(224,92,92,0.15)", borderRadius: 16, padding: "4px 10px", fontSize: 11, color: "#ff9a9a" }}>
                📈 VO2max {coach.readiness.vo2max.value} (est.)
              </div>
            )}
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 5, overflowX: "auto", paddingBottom: 2 }}>
            {paces.map((p, i) => (
              <div key={i} style={{ flexShrink: 0, background: "rgba(255,255,255,0.07)", borderRadius: 7, padding: "5px 9px", textAlign: "left", minWidth: isMobile ? 82 : 100 }}>
                <div style={{ fontSize: 9, opacity: 0.55, marginBottom: 1 }}>{p.label}</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: p.color }}>{p.pace}</div>
                <div style={{ fontSize: 9, opacity: 0.45 }}>{p.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "#fffbf0", borderBottom: "1px solid #f0e0a0", padding: "10px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#b8860b", marginBottom: 5 }}>🚲🏊 Personalized cross-training rules</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { icon: "🏊", text: "Jul: swim MON (class) → run moved to TUE", color: "#00695c" },
              { icon: "🏊", text: "Aug–Oct: open swim WED (active recovery)", color: "#00695c" },
              { icon: "🚲", text: "9km/day = real load (zone 1) — EASY on pre-quality days", color: "#2e7d32" },
              { icon: "🚇", text: "U-Bahn: before long run, after hard intervals, one leg in Peak", color: "#1565c0" },
              { icon: "🏊🚲", text: "Wed: 9km work + 11km pool = 20km — ok in Base, cut to one in Peak", color: "#7B68EE" },
            ].map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, background: "white", borderRadius: 12, padding: "4px 9px", fontSize: isMobile ? 10 : 11, color: r.color, border: "1px solid #f0e0a0" }}>
                <span>{r.icon}</span><span>{r.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", borderBottom: "2px solid #eee", background: "white" }}>
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setView(t.id)} style={{
              flex: 1, padding: "12px 4px", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
              background: view === t.id ? "white" : "#fafafa",
              color: view === t.id ? "#1a1a2e" : "#999",
              borderBottom: view === t.id ? "3px solid #1a1a2e" : "3px solid transparent",
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {view === "weeks" && (
          <div style={{ padding: pad }}>
            {recentActivity?.sessions?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1a1a2e", marginBottom: 6 }}>📈 Recent Activity</div>
                {recentActivity.analysis && (
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 8, lineHeight: 1.4 }}>
                    {recentActivity.analysis}
                  </div>
                )}
                {recentActivity.sessions.map((s) => (
                  <RecentSessionCard key={s.date + s.type} session={s} />
                ))}
              </div>
            )}
            {(weekKmRange || volumeCheck) && (
              <div style={{ background: "#f0faf6", border: "1.5px solid #b2ddd1", borderRadius: 11, padding: "10px 13px", marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#2e7d32", marginBottom: 4 }}>📐 How pace, HR zones & volume work here</div>
                <div style={{ fontSize: 11, color: "#555", lineHeight: 1.5 }}>
                  Easy/long runs are prescribed by heart-rate zone{paces[3]?.pace ? ` (${paces[3].pace})` : ""}, not fixed pace — pace shown is only an estimate.
                  {weekKmRange && ` Weekly running volume ranges from ~${Math.round(weekKmRange.min.estKm)}km (week ${weekKmRange.min.week}) to ~${Math.round(weekKmRange.max.estKm)}km at peak (week ${weekKmRange.max.week}).`}
                  {volumeCheck?.referenceNote && ` ${volumeCheck.referenceNote}`}
                </div>
                <button
                  onClick={() => setShowZoneGlossary(v => !v)}
                  style={{
                    marginTop: 7, background: "none", border: "none", cursor: "pointer", padding: 0,
                    fontSize: 10, fontWeight: 700, color: "#2e7d32", textDecoration: "underline",
                  }}
                >
                  {showZoneGlossary ? "Hide" : "What are LT and VO2max?"}
                </button>
                {showZoneGlossary && (
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #b2ddd1" }}>
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#2e7d32" }}>Lactate Threshold (LT)</div>
                      <div style={{ fontSize: 11, color: "#555", lineHeight: 1.5 }}>
                        The effort level where your body crosses from "sustainable for a long time" to
                        "burning through your matches" — the heart rate at which lactate starts building up
                        faster than you can clear it. All the zone bands above are set as a percentage of
                        this one number. It rises slowly with months of threshold/tempo training and is
                        re-measured every 6-10 weeks, not something a single workout changes.
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#2e7d32" }}>VO2max</div>
                      <div style={{ fontSize: 11, color: "#555", lineHeight: 1.5 }}>
                        The maximum rate your body can take in and use oxygen — a ceiling on your aerobic
                        engine size. A higher number means a bigger ceiling to work with, but it's a
                        talent-plus-training combination and doesn't by itself predict race performance the
                        way LT and training load do, since it doesn't account for how much of that ceiling
                        you can actually sustain. It moves slowly (months, not weeks).
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div style={{ display: "flex", gap: 5, marginBottom: 14, flexWrap: "wrap" }}>
              {PHASES.map((p) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 4, background: p.bg, border: `1px solid ${p.border}`, borderRadius: 16, padding: "3px 9px", fontSize: 10, fontWeight: 600, color: p.color }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: p.color, display: "inline-block" }} />
                  {p.name}
                </div>
              ))}
            </div>

            {dataLoading ? (
              <div style={{ textAlign: "center", color: "#999", fontSize: 12, padding: "24px 0" }}>Loading plan…</div>
            ) : !weeks ? (
              <div style={{ textAlign: "center", color: "#E05C5C", fontSize: 12, padding: "24px 0" }}>
                Couldn't load the live plan right now — check back soon.
              </div>
            ) : weeks.map((w) => {
              const phase = phaseMap[w.phase];
              const isOpen = activeWeek === w.week;
              return (
                <div key={w.week} style={{ marginBottom: 8 }}>
                  <button onClick={() => setActiveWeek(isOpen ? null : w.week)} style={{
                    width: "100%", textAlign: "left", border: `1.5px solid ${isOpen ? phase.color : phase.border}`,
                    borderRadius: isOpen ? "12px 12px 0 0" : 12, background: isOpen ? phase.bg : "white",
                    padding: "11px 13px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: phase.color, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
                      {w.week === 15 ? "🏅" : w.week}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>
                        Wk. {w.week} <span style={{ fontWeight: 400, color: "#888", fontSize: 11 }}>· {w.label}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ fontSize: 10, color: phase.color, fontWeight: 600 }}>{phase.name}</div>
                        {w.hasRace ? (
                          <div style={{ fontSize: 10, color: "#888", background: "#f0f0f0", borderRadius: 8, padding: "1px 7px", fontWeight: 600 }}>
                            🏃 42.2 km (race day)
                          </div>
                        ) : w.estKm != null && (
                          <div style={{ fontSize: 10, color: "#888", background: "#f0f0f0", borderRadius: 8, padding: "1px 7px", fontWeight: 600 }}>
                            🏃 ~{Math.round(w.estKm)} km
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: "#bbb", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</div>
                  </button>

                  {isOpen && (
                    <div style={{ border: `1.5px solid ${phase.color}`, borderTop: "none", borderRadius: "0 0 12px 12px", background: "white", padding: "13px" }}>
                      {w.sessions.map((s, i) => {
                        const t = typeStyle[s.type];
                        return (
                          <div key={i} style={{ display: "flex", gap: 9, marginBottom: i < w.sessions.length - 1 ? 11 : 0, alignItems: "flex-start" }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.dot, flexShrink: 0, marginTop: 5 }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: "#1a1a2e" }}>{s.day}</span>
                                <span style={{ background: t.bg, color: t.color, borderRadius: 8, padding: "2px 7px", fontSize: 10, fontWeight: 700 }}>{t.label}</span>
                              </div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "#222", marginTop: 1 }}>{s.title}</div>
                              <div style={{ fontSize: 11, color: "#666", marginTop: 1, lineHeight: 1.4 }}>{s.detail}</div>
                            </div>
                          </div>
                        );
                      })}

                      <div style={{ marginTop: 11, background: "#f8f9fa", borderRadius: 7, padding: "8px 10px", borderLeft: `3px solid ${phase.color}` }}>
                        <span style={{ fontSize: 11, color: "#555" }}>💡 {w.tip}</span>
                      </div>
                      <div style={{ marginTop: 7, background: "#f0faf2", borderRadius: 7, padding: "8px 10px", borderLeft: "3px solid #4CAF93" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#2e7d32", marginBottom: 2 }}>🚲 Cycling this week</div>
                        <span style={{ fontSize: 11, color: "#444" }}>{w.bikeNote}</span>
                      </div>
                      <div style={{ marginTop: 7, background: "#e0f7fa", borderRadius: 7, padding: "8px 10px", borderLeft: "3px solid #00bcd4" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#00695c", marginBottom: 2 }}>🏊 Swimming this week</div>
                        <span style={{ fontSize: 11, color: "#444" }}>{w.swimNote}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {view === "nutrition" && (
          <div style={{ padding: pad }}>
            <div style={{ background: "linear-gradient(135deg, #1a1a2e, #0f3460)", borderRadius: 11, padding: "13px", marginBottom: 13, color: "white" }}>
              <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 5 }}>⚡ Nutrition for sub-3h</div>
              <div style={{ fontSize: 11, opacity: 0.8, lineHeight: 1.5 }}>
                A sub-3h marathon burns ~2,500–2,800 kcal during the race. Strategy: gel every 5–6 km from km 15 (every ~25 min). Train your gut in training — never try anything new on race day. Daily cycling (9km/day) adds ~300 kcal: eat accordingly. Wednesday with pool (20km bike total) → ~600 kcal extra vs a no-bike day.
              </div>
            </div>

            <div style={{ fontSize: 11, color: "#888", marginBottom: 11 }}>Tap a phase for period-specific advice.</div>
            {PHASES.map((p) => {
              const isOpen = activePhase === p.id;
              return (
                <div key={p.id} style={{ marginBottom: 9 }}>
                  <button onClick={() => setActivePhase(isOpen ? null : p.id)} style={{
                    width: "100%", textAlign: "left", border: `1.5px solid ${isOpen ? p.color : p.border}`,
                    borderRadius: isOpen ? "11px 11px 0 0" : 11, background: isOpen ? p.bg : "white",
                    padding: "12px 13px", cursor: "pointer", display: "flex", alignItems: "center", gap: 9,
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: "#888" }}>Wks. {p.weeks} · {p.dates}</div>
                    </div>
                    <div style={{ fontSize: 11, color: "#bbb", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</div>
                  </button>
                  {isOpen && (
                    <div style={{ border: `1.5px solid ${p.color}`, borderTop: "none", borderRadius: "0 0 11px 11px", background: "white", padding: "13px" }}>
                      <div style={{ fontSize: 11, color: "#666", marginBottom: 11, fontStyle: "italic" }}>{p.description}</div>
                      {p.nutrition.points.map((point, i) => (
                        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
                          <div style={{ width: 19, height: 19, borderRadius: "50%", background: p.bg, border: `1.5px solid ${p.border}`, color: p.color, fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {i + 1}
                          </div>
                          <div style={{ fontSize: 12, color: "#333", lineHeight: 1.5, paddingTop: 1 }}>{point}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            <div style={{ background: "#1a1a2e", borderRadius: 11, padding: "14px", marginTop: 7, color: "white" }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 9 }}>🔑 Golden Rules</div>
              {[
                "Don't change nutrition or gear within 2 weeks of the race",
                "Weigh pasta/rice uncooked to calculate grams correctly",
                "Strategic caffeine: coffee or caffeine gels tested in training, used at km 25–30 on race day",
                "Daily bike = ~300 kcal extra (9km/day): don't undereat on run days. Wednesday with pool = ~600 kcal extra",
                "Alcohol: minimize during Peak weeks. One drink on the weekend is ok in Base/Build",
                "If you're hungry at night, eat — your body in intense training needs constant fuel",
              ].map((tip, i) => (
                <div key={i} style={{ display: "flex", gap: 6, marginBottom: 7, fontSize: 11, opacity: 0.85 }}>
                  <span style={{ color: "#ffd700", flexShrink: 0 }}>→</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === "resources" && (
          <div style={{ padding: pad }}>
            <div style={{ background: "linear-gradient(135deg, #1a1a2e, #16213e)", borderRadius: 11, padding: "13px", marginBottom: 14, color: "white", border: "1.5px solid rgba(123,104,238,0.4)" }}>
              <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 7 }}>⌚ Before buying a GPS watch</div>
              {WATCH_TIPS.map((tip, i) => (
                <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6, fontSize: 11, opacity: 0.85 }}>
                  <span style={{ color: "#b39ddb", flexShrink: 0 }}>→</span>
                  <span style={{ lineHeight: 1.4 }}>{tip}</span>
                </div>
              ))}
            </div>
            <div style={{ background: "linear-gradient(135deg, #1a1a2e, #0f3460)", borderRadius: 11, padding: "13px", marginBottom: 14, color: "white" }}>
              <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 7 }}>👟 Before buying shoes</div>
              {SHOE_TIPS.map((tip, i) => (
                <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6, fontSize: 11, opacity: 0.85 }}>
                  <span style={{ color: "#ffd700", flexShrink: 0 }}>→</span>
                  <span style={{ lineHeight: 1.4 }}>{tip}</span>
                </div>
              ))}
            </div>

            <div style={{ background: "linear-gradient(135deg, #0f3460, #1a1a2e)", borderRadius: 11, padding: "13px", marginBottom: 14, color: "white", border: "1.5px solid rgba(232,168,56,0.4)" }}>
              <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 7 }}>🏊🚴🏃 If you're thinking about triathlon</div>
              {[
                "Your current setup (running + daily cycling + weekly swimming) is already a triathlon base. Key differences to add: open-water swim, bike-to-run brick sessions, and transitions.",
                "Entry path: Sprint (750m swim / 20km bike / 5km run) → Olympic (1.5km / 40km / 10km) → Half Ironman 70.3 (1.9km / 90km / 21km) → Full Ironman (3.8km / 180km / 42km).",
                "Your watch: both Coros Pace 3 and Garmin FR265 already handle all three disciplines — no extra gear needed to start.",
                "For triathlon, swimming is usually the priority weak point for runners. 3 months of consistent pool work before your first tri makes a big difference.",
              ].map((tip, i) => (
                <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6, fontSize: 11, opacity: 0.85 }}>
                  <span style={{ color: "#E8A838", flexShrink: 0 }}>→</span>
                  <span style={{ lineHeight: 1.4 }}>{tip}</span>
                </div>
              ))}
            </div>

            {RESOURCES.map((cat, ci) => (
              <div key={ci} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e", marginBottom: 7 }}>{cat.category}</div>
                {cat.items.map((item, ii) => {
                  const resKey = `${ci}-${ii}`;
                  const isOpen = activeRes === resKey;
                  return (
                    <div key={ii} style={{ marginBottom: 6 }}>
                      <button onClick={() => setActiveRes(isOpen ? null : resKey)} style={{
                        width: "100%", textAlign: "left", border: `1.5px solid ${isOpen ? "#1a1a2e" : "#e0e0e0"}`,
                        borderRadius: isOpen ? "9px 9px 0 0" : 9, background: isOpen ? "#f0f4ff" : "white",
                        padding: "10px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 7,
                      }}>
                        <div style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "#1a1a2e" }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: "#bbb", transform: isOpen ? "rotate(180deg)" : "none" }}>▼</div>
                      </button>
                      {isOpen && (
                        <div style={{ border: "1.5px solid #1a1a2e", borderTop: "none", borderRadius: "0 0 9px 9px", background: "white", padding: "11px 12px" }}>
                          <div style={{ fontSize: 11, color: "#555", lineHeight: 1.5, marginBottom: 9 }}>{item.desc}</div>
                          <a href={item.url} target="_blank" rel="noopener noreferrer" style={{
                            display: "inline-flex", alignItems: "center", gap: 4, background: "#1a1a2e", color: "white",
                            borderRadius: 7, padding: "6px 11px", fontSize: 11, fontWeight: 600, textDecoration: "none",
                          }}>
                            Open →
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            <div style={{ background: "#f0faf6", border: "1.5px solid #b2ddd1", borderRadius: 11, padding: "13px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#2e7d32", marginBottom: 7 }}>📍 Gait analysis in Munich</div>
              {[
                { name: "Running Point München", addr: "Schillerstraße 6, 80336 München" },
                { name: "ASICS Store München", addr: "Kaufingerstraße 15, 80331 München" },
                { name: "Intersport Running", addr: "Various locations in the city" },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 7, marginBottom: 5, fontSize: 11 }}>
                  <span style={{ color: "#4CAF93", flexShrink: 0 }}>📍</span>
                  <div><strong>{s.name}</strong><div style={{ color: "#666", fontSize: 10 }}>{s.addr}</div></div>
                </div>
              ))}
              <div style={{ marginTop: 7, fontSize: 10, color: "#666", fontStyle: "italic" }}>
                Free — bring your current shoes so they can see your wear pattern.
              </div>
            </div>

            <div style={{ background: "#f0faf6", border: "1.5px solid #b2ddd1", borderRadius: 11, padding: "13px", marginTop: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#2e7d32", marginBottom: 7 }}>✅ After your Laufanalyse: what to do next</div>
              {[
                "During the analysis: write down your pronation type (neutral / overpronation / underpronation), the recommended shoe category (neutral / stability / motion control), specific model names, and the size they suggest.",
                "You're not obligated to buy in-store. The analysis is free because they hope you'll buy there — but it's totally normal to take the info and shop online.",
                "If they have your model in stock: try it on to confirm the fit and size. Those 5 minutes are worth it. Then buy wherever is cheapest.",
                "Online is usually 20–40% cheaper. Good German retailers: laufshop.de, SportScheck.de, running24.de, and brand sites (asics.com, nike.com) — which often run sales.",
                "Return policy matters: laufshop.de and SportScheck offer 30-day returns. Some even accept returns on worn shoes — check before ordering.",
                "Before clicking buy: post your pronation type + recommended model on r/runningshoegeeks for a quick second opinion.",
              ].map((tip, i) => (
                <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6, fontSize: 11 }}>
                  <span style={{ color: "#4CAF93", flexShrink: 0 }}>→</span>
                  <span style={{ color: "#444", lineHeight: 1.4 }}>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ padding: "12px", textAlign: "center", fontSize: 10, color: "#bbb" }}>
          5km in 22min → Sub-3h · Bike 9km/day · Wed: up to 20km (work + pool) · Swim Mon (Jul) then Wed · Plan based on Hal Higdon &amp; r/running
        </div>
      </div>
    </Layout>
  );
}
