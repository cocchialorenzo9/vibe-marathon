import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { Link } from 'react-router-dom';
import { useIsMobile } from './shared';

const RAW_BASE = 'https://raw.githubusercontent.com/cocchialorenzo9/vibe-marathon';

const tones = {
  push: { bg: "#E8F6F0", border: "#4CAF93", text: "#1f6b52" },
  hold: { bg: "#FDF3E1", border: "#E8A838", text: "#7a5200" },
  fallback: { bg: "#FCEDE4", border: "#E07B4C", text: "#8a3a12" },
  survival: { bg: "#FBE9E9", border: "#E05C5C", text: "#8f2222" },
  neutral: { bg: "#f8f9fa", border: "#d0d0d0", text: "#1a1a2e" },
};

const laneTone = { A: "push", R: "hold", B: "fallback", C: "survival" };

// Data file is plain ASCII; render arrows and comparison signs properly.
function pretty(s) {
  if (typeof s !== "string") return s;
  return s.replace(/->/g, "→").replace(/<=/g, "≤").replace(/>=/g, "≥");
}

function paceToSec(s) {
  const m = String(s).trim().match(/^(\d+):(\d{1,2})$/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : NaN;
}

// Parses range labels like "<= 4:32", "4:33-4:38", ">= 4:53", "< 150", "161-163".
function parseRange(label, toNum) {
  const s = label.replace(/\s/g, "");
  let m;
  if ((m = s.match(/^<=(.+)$/))) return [-Infinity, toNum(m[1])];
  if ((m = s.match(/^>=(.+)$/))) return [toNum(m[1]), Infinity];
  if ((m = s.match(/^<(.+)$/))) return [-Infinity, toNum(m[1]) - 1];
  if ((m = s.match(/^>(.+)$/))) return [toNum(m[1]) + 1, Infinity];
  if ((m = s.match(/^(.+)-(.+)$/))) return [toNum(m[1]), toNum(m[2])];
  return [NaN, NaN];
}

function inRange(v, [lo, hi]) {
  return v >= lo && v <= hi;
}

const card = {
  border: "1.5px solid #e0e0e0",
  borderRadius: 12,
  background: "#fff",
  padding: "14px 16px",
  marginBottom: 12,
};

const th = { textAlign: "left", padding: "6px 8px", fontSize: 11, color: "#888", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1.5px solid #eee", whiteSpace: "nowrap" };
const td = { padding: "7px 8px", fontSize: 13, color: "#333", borderBottom: "1px solid #f2f2f2", verticalAlign: "top" };

function Section({ id, title, subtitle, children }) {
  return (
    <div id={id} style={{ marginBottom: 32, scrollMarginTop: 80 }}>
      <h2 style={{ fontSize: 17, fontWeight: 800, color: "var(--ifm-heading-color)", margin: "0 0 4px 0" }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 13, color: "var(--ifm-color-emphasis-700)", margin: "0 0 12px 0", lineHeight: 1.5 }}>{subtitle}</p>}
      {children}
    </div>
  );
}

function Pill({ tone = "neutral", children, active, onClick }) {
  const t = tones[tone];
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? (tone === "neutral" ? "#1a1a2e" : t.border) : t.bg, color: active ? "#fff" : t.text,
        border: `1.5px solid ${active && tone === "neutral" ? "#1a1a2e" : t.border}`, borderRadius: 999, padding: "4px 12px",
        fontSize: 12, fontWeight: 700, cursor: onClick ? "pointer" : "default",
      }}
    >
      {children}
    </button>
  );
}

function ScrollX({ children, bare }) {
  const scroll = { overflowX: "auto", WebkitOverflowScrolling: "touch" };
  return <div style={bare ? scroll : { ...card, ...scroll }}>{children}</div>;
}

/* ── Decision tree ─────────────────────────────────────────────── */

function DecisionTree({ nodes, onSelect }) {
  const W = 680, nodeW = 320, nodeH = 56, brW = 180, gap = 40;
  const nodeX = (W - nodeW) / 2;
  const brX = [40, 250, 460];
  let y = 10;
  const elems = [];

  nodes.forEach((n, i) => {
    const top = y;
    const clickable = n.branches.length > 0 || n.id === "km35";
    elems.push(
      <g key={n.id} style={{ cursor: clickable ? "pointer" : "default" }} onClick={() => clickable && onSelect(n.id)}>
        <rect x={nodeX} y={top} width={nodeW} height={nodeH} rx={8} fill="#f8f9fa" stroke="#c8c8c8" />
        <text x={W / 2} y={top + 22} textAnchor="middle" fontSize={14} fontWeight={700} fill="#1a1a2e">{pretty(n.title)}</text>
        <text x={W / 2} y={top + 41} textAnchor="middle" fontSize={12} fill="#666">{pretty(n.sub)}</text>
      </g>
    );
    y = top + nodeH;
    if (n.branches.length) {
      const bTop = y + gap;
      n.branches.forEach((b, j) => {
        const t = tones[b.tone] || tones.neutral;
        const cx = brX[j] + brW / 2;
        elems.push(<line key={`${n.id}-in-${j}`} x1={W / 2 + (j - 1) * 20} y1={y} x2={cx} y2={bTop - 3} stroke="#aaa" strokeWidth={1.2} markerEnd="url(#rp-arrow)" />);
        elems.push(
          <g key={`${n.id}-b-${j}`} style={{ cursor: "pointer" }} onClick={() => onSelect(n.id)}>
            <rect x={brX[j]} y={bTop} width={brW} height={nodeH} rx={8} fill={t.bg} stroke={t.border} />
            <text x={cx} y={bTop + 22} textAnchor="middle" fontSize={14} fontWeight={700} fill={t.text}>{pretty(b.title)}</text>
            <text x={cx} y={bTop + 41} textAnchor="middle" fontSize={12} fill={t.text}>{pretty(b.sub)}</text>
          </g>
        );
        if (i < nodes.length - 1) {
          elems.push(<line key={`${n.id}-out-${j}`} x1={cx} y1={bTop + nodeH} x2={W / 2 + (j - 1) * 40} y2={bTop + nodeH + gap - 3} stroke="#aaa" strokeWidth={1.2} markerEnd="url(#rp-arrow)" />);
        }
      });
      y = bTop + nodeH + gap;
    } else if (i < nodes.length - 1) {
      elems.push(<line key={`${n.id}-down`} x1={W / 2} y1={y} x2={W / 2} y2={y + gap - 3} stroke="#aaa" strokeWidth={1.2} markerEnd="url(#rp-arrow)" />);
      y += gap;
    }
  });

  const legendY = y + 18;
  const legend = [["push", "On target / push"], ["hold", "Adjust / hold"], ["fallback", "Fall back"], ["survival", "Survival"]];

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${legendY + 20}`} role="img" aria-label="Race decision tree">
      <defs>
        <marker id="rp-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
      </defs>
      {elems}
      {legend.map(([tone, label], k) => (
        <g key={tone}>
          <rect x={60 + k * 150} y={legendY - 10} width={14} height={14} rx={3} fill={tones[tone].bg} stroke={tones[tone].border} />
          <text x={80 + k * 150} y={legendY + 1} fontSize={12} fill="#666">{label}</text>
        </g>
      ))}
    </svg>
  );
}

function DecisionTreeList({ nodes, onSelect }) {
  return (
    <div>
      {nodes.map((n, i) => (
        <div key={n.id}>
          <div onClick={() => onSelect(n.id)} style={{ background: "#f8f9fa", border: "1.5px solid #c8c8c8", borderRadius: 10, padding: "8px 12px", textAlign: "center", cursor: "pointer" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#1a1a2e" }}>{pretty(n.title)}</div>
            <div style={{ fontSize: 12, color: "#666" }}>{pretty(n.sub)}</div>
          </div>
          {n.branches.length > 0 && (
            <div style={{ borderLeft: "2px solid #ddd", margin: "6px 0 0 16px", paddingLeft: 10 }}>
              {n.branches.map(b => {
                const t = tones[b.tone] || tones.neutral;
                return (
                  <div key={b.title} onClick={() => onSelect(n.id)} style={{ background: t.bg, border: `1.5px solid ${t.border}`, borderRadius: 8, padding: "6px 10px", marginBottom: 6, cursor: "pointer" }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: t.text }}>{pretty(b.title)}</span>
                    <span style={{ fontSize: 12, color: t.text }}> · {pretty(b.sub)}</span>
                  </div>
                );
              })}
            </div>
          )}
          {i < nodes.length - 1 && <div style={{ textAlign: "center", color: "#aaa", fontSize: 14, lineHeight: "20px" }}>↓</div>}
        </div>
      ))}
    </div>
  );
}

/* ── Checkpoint grid + "what does my watch say?" ───────────────── */

function CheckpointPanel({ cp }) {
  const [pace, setPace] = useState("");
  const [hr, setHr] = useState("");
  const hasGrid = cp.rows.length > 0;

  const paceSec = paceToSec(pace);
  const hrNum = Number(hr);
  const paceErr = pace && isNaN(paceSec) ? "Use m:ss, e.g. 4:50" : "";
  const hrErr = hr && !(hrNum >= 80 && hrNum <= 220) ? "Enter a heart rate in bpm" : "";
  const valid = !isNaN(paceSec) && hrNum >= 80 && hrNum <= 220;

  let hit = null;
  if (hasGrid && valid) {
    const r = cp.rows.findIndex(row => inRange(paceSec, parseRange(row.pace, paceToSec)));
    const c = cp.hrBands.findIndex(b => inRange(hrNum, parseRange(b, Number)));
    if (r >= 0 && c >= 0) hit = { r, c };
  }

  const inputStyle = { width: 90, padding: "6px 10px", fontSize: 14, border: "1.5px solid #d0d0d0", borderRadius: 8 };

  return (
    <div>
      <div style={{ ...card, background: "#fafbfc" }}>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}><b>Read:</b> {pretty(cp.read)}</div>
        <div style={{ fontSize: 12, color: "#666" }}><b>Target splits:</b> {cp.targets}</div>
      </div>

      {hasGrid && (
        <>
          <div style={{ ...card, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e", width: "100%" }}>What does my watch say at {cp.title.split(" -")[0]}?</div>
            <label style={{ fontSize: 12, color: "#666" }}>
              Last-lap pace<br />
              <input value={pace} onChange={e => setPace(e.target.value)} placeholder="4:50" style={inputStyle} />
              {paceErr && <div style={{ fontSize: 12, color: "#E05C5C" }}>{paceErr}</div>}
            </label>
            <label style={{ fontSize: 12, color: "#666" }}>
              Lap avg HR<br />
              <input value={hr} onChange={e => setHr(e.target.value.replace(/[^\d]/g, ""))} placeholder="150" inputMode="numeric" style={inputStyle} />
              {hrErr && <div style={{ fontSize: 12, color: "#E05C5C" }}>{hrErr}</div>}
            </label>
            {hit && (() => {
              const cell = cp.rows[hit.r].cells[hit.c];
              const t = tones[cell.tone];
              return (
                <div style={{ flex: "1 1 220px", background: t.bg, border: `1.5px solid ${t.border}`, color: t.text, borderRadius: 10, padding: "8px 12px", fontSize: 14, fontWeight: 700 }}>
                  {pretty(cell.text)}
                </div>
              );
            })()}
          </div>

          <ScrollX>
            <table style={{ display: "table", borderCollapse: "separate", borderSpacing: 4, width: "100%", minWidth: 560 }}>
              <thead>
                <tr>
                  <th style={{ ...th, borderBottom: "none" }}>Pace \ HR</th>
                  {cp.hrBands.map(b => <th key={b} style={{ ...th, borderBottom: "none", textAlign: "center" }}>{pretty(b)}</th>)}
                </tr>
              </thead>
              <tbody>
                {cp.rows.map((row, r) => (
                  <tr key={row.pace}>
                    <td style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e", whiteSpace: "nowrap", padding: "6px 8px" }}>{pretty(row.pace)}</td>
                    {row.cells.map((cell, c) => {
                      const t = tones[cell.tone];
                      const isHit = hit && hit.r === r && hit.c === c;
                      return (
                        <td key={c} style={{
                          background: t.bg, color: t.text, border: `${isHit ? 3 : 1}px solid ${t.border}`,
                          borderRadius: 8, padding: "6px 8px", fontSize: 12, lineHeight: 1.35, fontWeight: isHit ? 700 : 500,
                        }}>
                          {pretty(cell.text)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollX>
        </>
      )}

      <div style={card}>
        {cp.examples.map(ex => (
          <div key={ex.q} style={{ fontSize: 13, lineHeight: 1.55, borderLeft: "3px solid #7B68EE", paddingLeft: 10, marginBottom: 10 }}>
            <div style={{ fontWeight: 700, color: "#4a3f8c" }}>{pretty(ex.q)}</div>
            <div style={{ color: "#444" }}>{pretty(ex.a)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Course fueling strip ──────────────────────────────────────── */

function CourseStrip({ stations, sips }) {
  const W = 900, x0 = 30, x1 = 870, axisY = 90;
  const kx = km => x0 + (Math.max(0, km) / 42.195) * (x1 - x0);
  const checkpoints = [10, 21.1, 30, 35];
  const sipColor = f => (f === "A" ? "#E8A838" : f === "B" ? "#E07B4C" : "#8a3a12");

  return (
    <svg width="100%" viewBox={`0 0 ${W} 170`} role="img" aria-label="Course map with aid stations and honey sips">
      {checkpoints.map(k => (
        <g key={k}>
          <line x1={kx(k)} y1={40} x2={kx(k)} y2={130} stroke="#7B68EE" strokeDasharray="3 3" strokeWidth={1} />
          <text x={kx(k)} y={148} textAnchor="middle" fontSize={12} fontWeight={700} fill="#4a3f8c">{k === 21.1 ? "Half" : `km ${k}`}</text>
        </g>
      ))}
      <line x1={x0} y1={axisY} x2={x1} y2={axisY} stroke="#1a1a2e" strokeWidth={2} />
      <text x={x0} y={166} fontSize={11} fill="#888">Start</text>
      <text x={x1} y={166} textAnchor="end" fontSize={11} fill="#888">42.2</text>
      {stations.water.map(k => <circle key={`w${k}`} cx={kx(k)} cy={axisY} r={6} fill="#4FC3F7" stroke="#fff" strokeWidth={1.5} />)}
      {stations.supply.map(k => <rect key={`s${k}`} x={kx(k) - 6} y={axisY - 6} width={12} height={12} rx={2} fill="#4CAF93" stroke="#fff" strokeWidth={1.5} />)}
      {sips.filter(s => s.n > 0).map(s => (
        <g key={s.n}>
          <line x1={kx(s.km)} y1={axisY - 8} x2={kx(s.km)} y2={56} stroke={sipColor(s.flask)} strokeWidth={1.5} />
          <circle cx={kx(s.km)} cy={46} r={10} fill={sipColor(s.flask)} />
          <text x={kx(s.km)} y={50} textAnchor="middle" fontSize={11} fontWeight={700} fill="#fff">{s.flask === "Coke" ? "C" : s.n}</text>
        </g>
      ))}
      <g>
        <circle cx={40} cy={14} r={6} fill="#4FC3F7" /><text x={52} y={18} fontSize={12} fill="#555">Water station</text>
        <rect x={154} y={8} width={12} height={12} rx={2} fill="#4CAF93" /><text x={172} y={18} fontSize={12} fill="#555">Supply station</text>
        <circle cx={286} cy={14} r={7} fill="#E8A838" /><text x={298} y={18} fontSize={12} fill="#555">Sip, flask A</text>
        <circle cx={390} cy={14} r={7} fill="#E07B4C" /><text x={402} y={18} fontSize={12} fill="#555">Sip, flask B</text>
        <circle cx={494} cy={14} r={7} fill="#8a3a12" /><text x={506} y={18} fontSize={12} fill="#555">Coke</text>
      </g>
    </svg>
  );
}

/* ── Pace vs HR evidence chart ─────────────────────────────────── */

function PaceHrChart({ curve }) {
  const W = 680, H = 300, L = 56, R = 20, T = 20, B = 50;
  const pMin = 255, pMax = 345, hMin = 128, hMax = 168;
  // Faster pace to the right.
  const px = s => L + ((pMax - s) / (pMax - pMin)) * (W - L - R);
  const py = h => T + ((hMax - h) / (hMax - hMin)) * (H - T - B);
  const ticksP = [260, 270, 280, 290, 300, 310, 320, 330, 340];
  const ticksH = [130, 140, 150, 160, 167];
  const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Pace versus heart rate from training">
      <rect x={L} y={py(159)} width={W - L - R} height={py(154) - py(159)} fill="#E8F6F0" />
      <rect x={px(282)} y={T} width={px(276) - px(282)} height={H - T - B} fill="#FDF3E1" />
      <line x1={L} y1={py(167)} x2={W - R} y2={py(167)} stroke="#E05C5C" strokeDasharray="4 3" />
      <text x={W - R - 4} y={py(167) - 5} textAnchor="end" fontSize={11} fill="#8f2222">LT 167</text>
      <text x={L + 6} y={py(159) + 13} fontSize={11} fill="#1f6b52">Marathon HR 154-159</text>
      <text x={px(279)} y={H - B - 6} textAnchor="middle" fontSize={11} fill="#7a5200">Target 4:36-4:42</text>
      {ticksP.map(s => (
        <g key={s}>
          <line x1={px(s)} y1={H - B} x2={px(s)} y2={H - B + 4} stroke="#999" />
          <text x={px(s)} y={H - B + 17} textAnchor="middle" fontSize={11} fill="#777">{fmt(s)}</text>
        </g>
      ))}
      {ticksH.map(h => (
        <g key={h}>
          <line x1={L - 4} y1={py(h)} x2={L} y2={py(h)} stroke="#999" />
          <text x={L - 8} y={py(h) + 4} textAnchor="end" fontSize={11} fill="#777">{h}</text>
        </g>
      ))}
      <line x1={L} y1={H - B} x2={W - R} y2={H - B} stroke="#999" />
      <line x1={L} y1={T} x2={L} y2={H - B} stroke="#999" />
      <text x={(W + L) / 2} y={H - 8} textAnchor="middle" fontSize={11} fill="#777">Pace /km (faster →)</text>
      <text x={L - 8} y={T - 8} textAnchor="end" fontSize={11} fill="#777">bpm</text>
      {curve.map(pt => {
        const [p1, p2] = pt.pace.split("-").map(paceToSec);
        const [h1, h2] = pt.hr.split("-").map(Number);
        const x = px(p2), w = Math.max(6, px(p1) - px(p2));
        const y = py(h2), h = Math.max(6, py(h1) - py(h2));
        return <rect key={pt.pace} x={x} y={y} width={w} height={h} rx={3} fill="#7B68EE" opacity={0.75} />;
      })}
    </svg>
  );
}

/* ── Page ──────────────────────────────────────────────────────── */

export default function VibeMarathonRacePlan() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lane, setLane] = useState("A");
  const [cpId, setCpId] = useState("km10");
  const isMobile = useIsMobile();

  useEffect(() => {
    // ?ref=<branch> previews an unmerged race plan.
    const ref = new URLSearchParams(window.location.hash.split("?")[1] || "").get("ref") || "main";
    fetch(`${RAW_BASE}/${ref}/data/race-plan.json`)
      .then(r => (r.ok ? r.json() : null))
      .then(setPlan)
      .catch(() => setPlan(null))
      .finally(() => setLoading(false));
  }, []);

  const selectCheckpoint = id => {
    setCpId(id);
    const el = document.getElementById("checkpoints");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const px = isMobile ? "12px 14px" : "32px 28px";
  const laneCols = [["A", "A-stretch"], ["R", "A-real"], ["B", "B"]];
  const hl = id => (id === lane ? { background: tones[laneTone[id]].bg, fontWeight: 700 } : {});

  return (
    <Layout title="Vibe Marathon — Race Plan" description="Munich Marathon 2026 race plan: pacing lanes, checkpoints and fueling">
      <div style={{ maxWidth: 900, margin: "0 auto", padding: px, fontFamily: "inherit" }}>

        <div style={{ marginBottom: 20 }}>
          <Link to="/munich-2026/dashboard" style={{ fontSize: 13, color: "#4CAF93", fontWeight: 600, textDecoration: "none" }}>
            ← Dashboard
          </Link>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: "var(--ifm-heading-color)", marginBottom: 4 }}>
            🏁 Race Plan
          </h1>
          {plan && (
            <p style={{ color: "var(--ifm-color-emphasis-700)", fontSize: 14, margin: 0 }}>
              {plan.race.name} · Sun Oct 11, {plan.race.startTime} · {plan.race.start}
            </p>
          )}
        </div>

        {loading ? (
          <div style={{ color: "#888", textAlign: "center", padding: 64, fontSize: 15 }}>Loading…</div>
        ) : !plan ? (
          <div style={{ color: "#E05C5C", textAlign: "center", padding: 64 }}>Could not load the race plan.</div>
        ) : (
          <>
            {/* Summary */}
            <div style={{ ...card, borderColor: "#1a1a2e", background: "#1a1a2e", color: "#fff" }}>
              <div style={{ fontSize: 14, lineHeight: 1.6 }}>{pretty(plan.summary)}</div>
            </div>
            <div style={{ ...card }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#1a1a2e", marginBottom: 8 }}>Golden rules</div>
              <ol style={{ margin: 0, paddingLeft: 20 }}>
                {plan.goldenRules.map(r => <li key={r} style={{ fontSize: 13, color: "#333", lineHeight: 1.55, marginBottom: 4 }}>{pretty(r)}</li>)}
              </ol>
            </div>

            {/* Lanes */}
            <Section id="lanes" title="Goal lanes" subtitle="Pick a lane to highlight it in the tables below. Lanes only move down before km 30.">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                {plan.lanes.map(l => (
                  <Pill key={l.id} tone={laneTone[l.id]} active={lane === l.id} onClick={() => setLane(l.id)}>{l.name}</Pill>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
                {plan.lanes.map(l => {
                  const t = tones[laneTone[l.id]];
                  const active = lane === l.id;
                  return (
                    <div key={l.id} onClick={() => setLane(l.id)} style={{
                      border: `${active ? 2.5 : 1.5}px solid ${t.border}`, background: t.bg, borderRadius: 12,
                      padding: "12px 14px", cursor: "pointer",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: t.text }}>{l.name}</span>
                        <span style={{ fontSize: 15, fontWeight: 800, color: t.text }}>{l.finish}</span>
                      </div>
                      <div style={{ fontSize: 12, color: t.text, margin: "4px 0 6px" }}>
                        {l.paceBand}/km · HR {pretty(l.hr)}
                      </div>
                      <div style={{ fontSize: 12, color: "#444", lineHeight: 1.5 }}>{pretty(l.when)}</div>
                    </div>
                  );
                })}
              </div>
            </Section>

            {/* Phases */}
            <Section id="phases" title="Pace and HR by phase" subtitle="Obey whichever ceiling you hit first. Expected HR already includes normal drift.">
              <ScrollX>
                <table style={{ display: "table", borderCollapse: "collapse", width: "100%", minWidth: 640 }}>
                  <thead>
                    <tr>
                      <th style={th}>km</th>
                      {laneCols.map(([id, name]) => <th key={id} style={{ ...th, ...hl(id) }}>{name}</th>)}
                      <th style={th}>Expected HR</th>
                      <th style={th}>HR ceiling</th>
                      <th style={th}>Pace ceiling</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.phases.map(p => (
                      <tr key={p.km}>
                        <td style={{ ...td, fontWeight: 700, whiteSpace: "nowrap" }}>{p.km}</td>
                        {laneCols.map(([id]) => <td key={id} style={{ ...td, whiteSpace: "nowrap", ...hl(id) }}>{p[id]}</td>)}
                        <td style={{ ...td, whiteSpace: "nowrap" }}>{p.expectedHr}</td>
                        <td style={{ ...td, fontWeight: 700, color: "#8f2222" }}>{p.hrCeiling}</td>
                        <td style={{ ...td, fontWeight: 700, color: "#8a3a12", whiteSpace: "nowrap" }}>{p.paceCeiling}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollX>
              <div style={card}>
                {plan.phases.map(p => (
                  <div key={p.km} style={{ fontSize: 12, color: "#666", lineHeight: 1.5 }}><b>{p.km}:</b> {pretty(p.note)}</div>
                ))}
              </div>
            </Section>

            {/* Splits */}
            <Section id="splits" title="Target splits" subtitle="Use the official km markers, not watch distance.">
              <ScrollX>
                <table style={{ display: "table", borderCollapse: "collapse", width: "100%", minWidth: 520 }}>
                  <thead>
                    <tr>
                      <th style={th}>Lane</th>
                      {plan.splits.columns.map(c => <th key={c} style={th}>{c}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {plan.splits.rows.map(r => {
                      const name = plan.lanes.find(l => l.id === r.lane)?.name;
                      return (
                        <tr key={r.lane} style={hl(r.lane)}>
                          <td style={{ ...td, fontWeight: 700 }}>{name}</td>
                          {r.values.map((v, i) => <td key={i} style={{ ...td, fontVariantNumeric: "tabular-nums" }}>{v}</td>)}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </ScrollX>
            </Section>

            {/* Decision tree */}
            <Section id="tree" title="Decision tree" subtitle="Tap a checkpoint to jump to its pace × HR grid.">
              <div style={{ ...card, padding: isMobile ? 8 : 16 }}>
                {isMobile
                  ? <DecisionTreeList nodes={plan.decisionTree} onSelect={selectCheckpoint} />
                  : <DecisionTree nodes={plan.decisionTree} onSelect={selectCheckpoint} />}
              </div>
            </Section>

            {/* Checkpoints */}
            <Section id="checkpoints" title="Checkpoints" subtitle="Type what your watch shows right after the km beep, or read the grid.">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                {plan.checkpoints.map(cp => (
                  <Pill key={cp.id} tone="neutral" active={cpId === cp.id} onClick={() => setCpId(cp.id)}>{cp.title.split(" -")[0]}</Pill>
                ))}
              </div>
              {plan.checkpoints.filter(cp => cp.id === cpId).map(cp => <CheckpointPanel key={cp.id} cp={cp} />)}
            </Section>

            {/* Over-ceiling protocol */}
            <Section id="protocol" title="If HR goes over the ceiling" subtitle="Judge on lap-avg HR. HR lags a pace change by 60–90 s.">
              <div style={card}>
                {plan.overCapProtocol.map(p => (
                  <div key={p.trigger} style={{ display: "flex", gap: 10, padding: "6px 0", borderBottom: "1px solid #f2f2f2", flexWrap: isMobile ? "wrap" : "nowrap" }}>
                    <div style={{ flex: "0 0 220px", fontSize: 13, fontWeight: 700, color: "#8f2222" }}>{pretty(p.trigger)}</div>
                    <div style={{ fontSize: 13, color: "#333", lineHeight: 1.5 }}>{pretty(p.action)}</div>
                  </div>
                ))}
              </div>
              <div style={{ ...card, background: "#fafbfc" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#1a1a2e", marginBottom: 4 }}>3:15 pacer</div>
                <div style={{ fontSize: 13, color: "#333", lineHeight: 1.55 }}>{pretty(plan.pacer.strategy)}</div>
              </div>
            </Section>

            {/* Fueling */}
            <Section id="fueling" title="Fueling" subtitle={`${plan.fueling.targetCarbsPerHour} · every sip followed by water from a cup`}>
              <div style={{ ...card, padding: isMobile ? 8 : 14 }}>
                <ScrollX bare>
                  <div style={{ minWidth: 560 }}>
                    <CourseStrip stations={plan.stations} sips={plan.fueling.sips} />
                  </div>
                </ScrollX>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
                {plan.fueling.flasks.map(f => (
                  <div key={f.name} style={{ ...card, marginBottom: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#1a1a2e" }}>{f.name}</div>
                    <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>{f.pocket} · {f.carbs} carbs</div>
                    <div style={{ fontSize: 13, color: "#333", lineHeight: 1.5, marginBottom: 6 }}>{pretty(f.recipe)}</div>
                    <div style={{ fontSize: 12, color: "#666" }}>{pretty(f.sips)}</div>
                  </div>
                ))}
              </div>

              <ScrollX>
                <table style={{ display: "table", borderCollapse: "collapse", width: "100%", minWidth: 520 }}>
                  <thead>
                    <tr>{["Sip", "km", "~Time", "Station", "Flask", ""].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {plan.fueling.sips.map(s => (
                      <tr key={s.n}>
                        <td style={{ ...td, fontWeight: 700 }}>{s.n === 0 ? "pre" : s.flask === "Coke" ? "bonus" : s.n}</td>
                        <td style={td}>{s.km < 0 ? "—" : s.km}</td>
                        <td style={td}>{s.time}</td>
                        <td style={td}>{s.station}</td>
                        <td style={td}>{s.flask}</td>
                        <td style={{ ...td, color: "#666", fontSize: 12 }}>{pretty(s.note || "")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollX>

              <div style={{ ...card, marginTop: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#1a1a2e", marginBottom: 6 }}>Prep</div>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {plan.fueling.prep.map(p => <li key={p} style={{ fontSize: 13, color: "#333", lineHeight: 1.55 }}>{pretty(p)}</li>)}
                </ul>
              </div>

              <div style={{ ...card }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#1a1a2e", marginBottom: 6 }}>Why ~200 g of honey is enough · burn {plan.fueling.totalBurn}</div>
                {plan.fueling.energyBudget.map(e => (
                  <div key={e.source} style={{ display: "flex", gap: 10, padding: "5px 0", borderBottom: "1px solid #f2f2f2", flexWrap: "wrap" }}>
                    <div style={{ flex: "0 0 220px", fontSize: 13, fontWeight: 700, color: "#333" }}>{e.source}</div>
                    <div style={{ flex: "0 0 200px", fontSize: 13, color: "#1f6b52", fontWeight: 700 }}>{e.amount}</div>
                    <div style={{ flex: "1 1 200px", fontSize: 12, color: "#666" }}>{pretty(e.note)}</div>
                  </div>
                ))}
                <div style={{ fontSize: 12, color: "#555", lineHeight: 1.55, marginTop: 10 }}>{pretty(plan.fueling.why)}</div>
              </div>

              <div style={{ ...card, fontSize: 12, color: "#7a5200", lineHeight: 1.55, borderLeft: "3px solid #E8A838" }}>
                <b>Lesson from Sep 26 — </b>{pretty(plan.fueling.sep26Lesson)}
              </div>
            </Section>

            {/* Hydration */}
            <Section id="hydration" title="Hydration" subtitle={pretty(plan.hydration.plan)}>
              <div style={card}>
                {plan.hydration.estimate.map(e => (
                  <div key={e.label} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "5px 0", borderBottom: "1px solid #f2f2f2", flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, color: "#333" }}>{e.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>{pretty(e.value)}</span>
                  </div>
                ))}
                <div style={{ fontSize: 12, color: "#666", marginTop: 8, lineHeight: 1.5 }}>
                  <b>Supply stations:</b> {pretty(plan.stations.supplyContents)}
                </div>
              </div>
            </Section>

            {/* Timeline */}
            <Section id="timeline" title="Race weekend timeline">
              <div style={card}>
                {plan.timeline.map(t => (
                  <div key={t.when} style={{ display: "flex", gap: 12, padding: "8px 0", borderBottom: "1px solid #f2f2f2" }}>
                    <div style={{ flex: "0 0 86px", fontSize: 13, fontWeight: 800, color: "#4CAF93" }}>{t.when}</div>
                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                      {t.items.map(i => <li key={i} style={{ fontSize: 13, color: "#333", lineHeight: 1.55 }}>{pretty(i)}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </Section>

            {/* Watch */}
            <Section id="watch" title="Watch setup" subtitle={plan.watch.device}>
              <div style={card}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#1a1a2e", marginBottom: 6 }}>Race data page</div>
                {plan.watch.racePage.map(f => (
                  <div key={f.field} style={{ display: "flex", gap: 10, padding: "5px 0", borderBottom: "1px solid #f2f2f2", flexWrap: "wrap" }}>
                    <div style={{ flex: "0 0 200px", fontSize: 13, fontWeight: 700, color: "#333" }}>{f.field}</div>
                    <div style={{ fontSize: 13, color: "#555" }}>{pretty(f.use)}</div>
                  </div>
                ))}
                <ul style={{ margin: "10px 0 0", paddingLeft: 20 }}>
                  {plan.watch.settings.map(s => <li key={s} style={{ fontSize: 13, color: "#333", lineHeight: 1.55 }}>{pretty(s)}</li>)}
                </ul>
                <div style={{ fontSize: 12, color: "#666", marginTop: 8 }}>{pretty(plan.watch.h10)}</div>
              </div>
            </Section>

            {/* Evidence */}
            <Section id="evidence" title="Why these numbers" subtitle={pretty(plan.evidence.intro)}>
              <div style={{ ...card, padding: isMobile ? 8 : 14 }}>
                <ScrollX bare>
                  <div style={{ minWidth: 520 }}>
                    <PaceHrChart curve={plan.evidence.hrPaceCurve} />
                  </div>
                </ScrollX>
                <div style={{ fontSize: 11, color: "#888", textAlign: "center", marginTop: 4 }}>
                  Purple = measured pace/HR ranges from Strava laps in this block
                </div>
              </div>
              {plan.evidence.sessions.map(s => (
                <div key={s.date} style={{ ...card, padding: "10px 14px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>
                    {new Date(s.date + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} · {s.name}
                  </div>
                  <div style={{ fontSize: 12, color: "#555", lineHeight: 1.5 }}>{pretty(s.detail)}</div>
                </div>
              ))}
              <ul style={{ ...card, paddingLeft: 32 }}>
                {plan.evidence.conclusions.map(c => <li key={c} style={{ fontSize: 13, color: "#333", lineHeight: 1.55 }}>{pretty(c)}</li>)}
              </ul>
            </Section>

            <div style={{ ...card, borderColor: "#E05C5C", background: "#FBE9E9", color: "#8f2222", fontSize: 13, fontWeight: 600 }}>
              ⚠️ {pretty(plan.redFlags)}
            </div>
          </>
        )}

        <div style={{ fontSize: 11, color: "#bbb", textAlign: "center", marginTop: 20, paddingTop: 20, borderTop: "1px solid #f0f0f0" }}>
          Data from{' '}
          <a href="https://github.com/cocchialorenzo9/vibe-marathon/blob/main/data/race-plan.json" style={{ color: "#bbb" }}>
            vibe-marathon/data/race-plan.json
          </a>
        </div>
      </div>
    </Layout>
  );
}
