import React, { useState, useEffect } from 'react';

export const typeColors = {
  easy: "#4CAF93",
  tempo: "#E8A838",
  long: "#7B68EE",
  "medium-long": "#7B68EE",
  race: "#E05C5C",
  swim: "#4FC3F7",
  rest: "#9E9E9E",
};

export const typeLabels = {
  easy: "Easy",
  tempo: "Quality",
  long: "Long Run",
  "medium-long": "Medium-Long",
  race: "RACE",
  swim: "Swim",
  rest: "Rest",
};

const activityLabels = {
  outdoor_running: "🏃 Run",
  indoor_running: "🏃 Treadmill",
  treadmill_running: "🏃 Treadmill",
  swimming: "🏊 Swim",
  open_water_swimming: "🏊 Swim",
  outdoor_cycling: "🚴 Bike",
  indoor_cycling: "🚴 Bike",
  walking: "🚶 Walk",
};

export function activityLabel(type) {
  if (activityLabels[type]) return activityLabels[type];
  if (typeof type !== "string" || !type) return "Session";
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function formatPace(minPerKm) {
  if (minPerKm == null) return "—";
  const min = Math.floor(minPerKm);
  const sec = Math.round((minPerKm - min) * 60);
  return `${min}:${String(sec).padStart(2, '0')}/km`;
}

export function RecentSessionCard({ session }) {
  const d = new Date(session.date + 'T00:00:00');
  const dateStr = d.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div style={{
      border: "1.5px solid #e0e0e0",
      borderRadius: 12,
      background: "#fff",
      padding: "12px 14px",
      marginBottom: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#1a1a2e" }}>{dateStr}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#666" }}>{activityLabel(session.type_name)}</span>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginLeft: "auto" }}>
          {session.distance_km != null && (
            <span style={{ background: "#f5f5f5", borderRadius: 6, padding: "2px 8px", fontSize: 11, color: "#555" }}>
              {session.distance_km.toFixed(1)} km
            </span>
          )}
          {session.avg_pace_min_km != null && (
            <span style={{ background: "#f5f5f5", borderRadius: 6, padding: "2px 8px", fontSize: 11, color: "#555" }}>
              {formatPace(session.avg_pace_min_km)}
            </span>
          )}
          <span style={{ background: "#f5f5f5", borderRadius: 6, padding: "2px 8px", fontSize: 11, color: "#555" }}>
            {session.avg_hr ?? "—"}{session.max_hr != null ? ` / ${session.max_hr}` : ""} bpm
          </span>
        </div>
      </div>
      {session.lesson && (
        <div style={{
          fontSize: 12, color: "#444", lineHeight: 1.5,
          borderLeft: "3px solid #7B68EE", paddingLeft: 10,
        }}>
          💡 {session.lesson}
        </div>
      )}
    </div>
  );
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 600);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return isMobile;
}
