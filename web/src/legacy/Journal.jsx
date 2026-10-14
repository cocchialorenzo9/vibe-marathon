import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { Link } from 'react-router-dom';
import { typeColors, typeLabels, activityLabel, formatPace, useIsMobile } from './shared';

const JOURNAL_URL = 'https://raw.githubusercontent.com/cocchialorenzo9/vibe-marathon/main/data/training-journal.json';

const PAGE_SIZE = 15;

function JournalEntryCard({ entry }) {
  const d = new Date(entry.date + 'T00:00:00');
  const dateStr = d.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const scheduledColor = typeColors[entry.scheduled] || "#9E9E9E";
  const scheduledLabel = typeLabels[entry.scheduled] || entry.scheduled;

  return (
    <div style={{
      border: "1.5px solid #e0e0e0",
      borderRadius: 12,
      background: "#fff",
      padding: "14px 16px",
      marginBottom: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>{dateStr}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#666" }}>{activityLabel(entry.type)}</span>
        {entry.scheduled && (
          <span style={{
            background: `${scheduledColor}18`, color: scheduledColor, borderRadius: 6,
            padding: "2px 8px", fontSize: 10, fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.04em",
          }}>
            Planned: {scheduledLabel}
          </span>
        )}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginLeft: "auto" }}>
          {entry.distance_km != null && (
            <span style={{ background: "#f5f5f5", borderRadius: 6, padding: "2px 8px", fontSize: 11, color: "#555" }}>
              {entry.distance_km.toFixed(1)} km
            </span>
          )}
          {entry.avg_pace_min_km != null && (
            <span style={{ background: "#f5f5f5", borderRadius: 6, padding: "2px 8px", fontSize: 11, color: "#555" }}>
              {formatPace(entry.avg_pace_min_km)}
            </span>
          )}
          {(entry.avg_hr != null || entry.max_hr != null) && (
            <span style={{ background: "#f5f5f5", borderRadius: 6, padding: "2px 8px", fontSize: 11, color: "#555" }}>
              {entry.avg_hr ?? "—"}{entry.max_hr != null ? ` / ${entry.max_hr}` : ""} bpm
            </span>
          )}
        </div>
      </div>

      {entry.wentWell && (
        <div style={{ fontSize: 12, color: "#2e7d32", lineHeight: 1.55, borderLeft: "3px solid #4CAF93", paddingLeft: 10, marginBottom: 8 }}>
          <span style={{ fontWeight: 700 }}>✅ Went well — </span>{entry.wentWell}
        </div>
      )}
      {entry.wentWrong && (
        <div style={{ fontSize: 12, color: "#7a5200", lineHeight: 1.55, borderLeft: "3px solid #E8A838", paddingLeft: 10, marginBottom: 8 }}>
          <span style={{ fontWeight: 700 }}>⚠️ Went wrong — </span>{entry.wentWrong}
        </div>
      )}
      {entry.nextTime && (
        <div style={{ fontSize: 12, color: "#4a3f8c", lineHeight: 1.55, borderLeft: "3px solid #7B68EE", paddingLeft: 10 }}>
          <span style={{ fontWeight: 700 }}>🎯 Next time — </span>{entry.nextTime}
        </div>
      )}
    </div>
  );
}

export default function VibeMarathonJournal() {
  const [journal, setJournal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetch(JOURNAL_URL)
      .then(r => r.json())
      .then(data => setJournal(Array.isArray(data) ? data : []))
      .catch(() => setJournal([]))
      .finally(() => setLoading(false));
  }, []);

  const entries = (journal || []).slice().sort((a, b) => b.date.localeCompare(a.date));
  const visibleEntries = entries.slice(0, visibleCount);
  const px = isMobile ? "12px 14px" : "32px 28px";

  return (
    <Layout title="Vibe Marathon — Training Journal" description="What each past training session taught me">
      <div style={{ maxWidth: 900, margin: "0 auto", padding: px, fontFamily: "inherit" }}>

        {/* Breadcrumb */}
        <div style={{ marginBottom: 20 }}>
          <Link to="/munich-2026/dashboard" style={{ fontSize: 13, color: "#4CAF93", fontWeight: 600, textDecoration: "none" }}>
            ← Dashboard
          </Link>
        </div>

        {/* Title */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: "#1a1a2e", marginBottom: 4 }}>
            📓 Training Journal
          </h1>
          <p style={{ color: "#666", fontSize: 14, margin: 0 }}>
            What each session taught me
          </p>
        </div>

        {loading ? (
          <div style={{ color: "#888", textAlign: "center", padding: 64, fontSize: 15 }}>Loading…</div>
        ) : entries.length === 0 ? (
          <div style={{ color: "#888", textAlign: "center", padding: 64, fontSize: 15 }}>No journal entries yet.</div>
        ) : (
          <>
            {visibleEntries.map(entry => (
              <JournalEntryCard key={entry.date} entry={entry} />
            ))}
            {visibleCount < entries.length && (
              <div style={{ textAlign: "center", marginTop: 16, marginBottom: 24 }}>
                <button
                  onClick={() => setVisibleCount(entries.length)}
                  style={{
                    background: "#f8f9fa", border: "1.5px solid #e0e0e0", borderRadius: 10,
                    padding: "8px 18px", fontSize: 13, fontWeight: 600, color: "#4CAF93",
                    cursor: "pointer",
                  }}
                >
                  Show all {entries.length} entries
                </button>
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
        </div>
      </div>
    </Layout>
  );
}
