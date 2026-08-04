import React, { useEffect, useMemo, useState } from "react";

type Telemetry = {
  temperature: number;
  humidity: number;
  soilMoisture: number;
  battery: number;
  altitude: number;
  speed: number;
  gpsLock: boolean;
  signal: number;
};

type AlertItem = {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  detail: string;
  action: string;
  time: string;
};

type Snapshot = {
  time: string;
  temperature: number;
  humidity: number;
  soilMoisture: number;
  battery: number;
  signal: number;
};

type Diagnosis = {
  title: string;
  detail: string;
  action: string;
  severity: AlertItem["severity"];
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const nowTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

const metricCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 16,
  padding: 18,
  boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  color: "rgba(255,255,255,0.72)",
  marginBottom: 10,
};

const valueStyle: React.CSSProperties = {
  fontSize: 30,
  fontWeight: 700,
  color: "#fff",
};

function severityStyle(severity: AlertItem["severity"]): React.CSSProperties {
  if (severity === "critical") return { background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)" };
  if (severity === "warning") return { background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)" };
  return { background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)" };
}

function Gauge({
  label,
  value,
  suffix,
  min = 0,
  max = 100,
}: {
  label: string;
  value: number;
  suffix: string;
  min?: number;
  max?: number;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={metricCard}>
      <div style={labelStyle}>{label}</div>
      <div style={valueStyle}>
        {value.toFixed(1)}
        {suffix}
      </div>
      <div style={{ marginTop: 12, height: 10, borderRadius: 999, background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
        <div
          style={{
            width: `${clamp(pct, 0, 100)}%`,
            height: "100%",
            background: "linear-gradient(90deg, #38bdf8, #22c55e)",
          }}
        />
      </div>
    </div>
  );
}

function Sparkline({ values, stroke = "#38bdf8" }: { values: number[]; stroke?: string }) {
  const width = 320;
  const height = 90;
  const padding = 8;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((v, i) => {
      const x = padding + (i * (width - padding * 2)) / (values.length - 1);
      const y = height - padding - ((v - min) * (height - padding * 2)) / range;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
      <polyline fill="none" stroke={stroke} strokeWidth="3" points={points} />
    </svg>
  );
}

function inferDiagnosis(t: Telemetry): Diagnosis {
  const lowSoil = t.soilMoisture < 35;
  const lowBattery = t.battery < 25;
  const hot = t.temperature > 35;
  const weakSignal = t.signal < 60;
  const gpsLost = !t.gpsLock;

  if (gpsLost && weakSignal && lowBattery) {
    return {
      title: "Early-Stage Fungal Infection / Root Rot",
      detail: "Localized stress pattern with unstable telemetry and elevated field risk.",
      action: "Trigger localized bio fungicide or targeted copper application.",
      severity: "critical",
    };
  }

  if (lowSoil && hot) {
    return {
      title: "Nitrogen (N) Starvation",
      detail: "Uniform canopy fading with metabolic stress and reduced growth vigor.",
      action: "Execute a variable-rate nitrogen top-up via spreader map.",
      severity: "warning",
    };
  }

  if (lowSoil && weakSignal) {
    return {
      title: "Potassium (K) Deficiency",
      detail: "Marginal yellowing and necrosis are consistent with mobile nutrient reallocation.",
      action: "Apply targeted potassium-rich liquid fertilizer to the zone.",
      severity: "warning",
    };
  }

  if (hot && t.humidity < 45) {
    return {
      title: "Iron (Fe) or Zinc (Zn) Deficiency",
      detail: "Interveinal chlorosis on younger leaves and stunting suggest high pH lockout.",
      action: "Spot-apply a chelated iron/zinc foliar spray via drone sprayer.",
      severity: "critical",
    };
  }

  return {
    title: "Mixed Canopy Stress",
    detail: "Crop stress indicators are present; confirm with drone AI and soil context.",
    action: "Continue monitoring and schedule a zone-level re-scan.",
    severity: "info",
  };
}

export default function App() {
  const [telemetry, setTelemetry] = useState<Telemetry>({
    temperature: 31,
    humidity: 54,
    soilMoisture: 46,
    battery: 84,
    altitude: 28,
    speed: 10,
    gpsLock: true,
    signal: 91,
  });
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => {
      setTelemetry((prev) => {
        const next = {
          temperature: clamp(prev.temperature + (Math.random() - 0.5) * 1.6, 24, 40),
          humidity: clamp(prev.humidity + (Math.random() - 0.5) * 3.8, 32, 92),
          soilMoisture: clamp(prev.soilMoisture + (Math.random() - 0.5) * 3.6, 15, 95),
          battery: clamp(prev.battery - 0.05 - Math.random() * 0.08, 5, 100),
          altitude: clamp(prev.altitude + (Math.random() - 0.5) * 2.6, 0, 120),
          speed: clamp(prev.speed + (Math.random() - 0.5) * 1.8, 0, 35),
          gpsLock: Math.random() > 0.97 ? false : Math.random() > 0.03 ? true : prev.gpsLock,
          signal: clamp(prev.signal + (Math.random() - 0.5) * 2.2, 40, 100),
        };

        const diagnosis = inferDiagnosis(next);
        const newAlert: AlertItem = {
          id: diagnosis.title,
          severity: diagnosis.severity,
          title: diagnosis.title,
          detail: diagnosis.detail,
          action: diagnosis.action,
          time: nowTime(),
        };

        setAlerts((prevAlerts) => [newAlert, ...prevAlerts.filter((a) => a.id !== newAlert.id)].slice(0, 6));
        setHistory((prevHistory) =>
          [
            ...prevHistory,
            {
              time: nowTime(),
              temperature: next.temperature,
              humidity: next.humidity,
              soilMoisture: next.soilMoisture,
              battery: next.battery,
              signal: next.signal,
            },
          ].slice(-20)
        );
        setLastUpdated(new Date());
        return next;
      });
    }, 1000);

    return () => clearInterval(id);
  }, []);

  const diagnosis = useMemo(() => inferDiagnosis(telemetry), [telemetry]);
  const missionStatus =
    diagnosis.severity === "critical" ? "Intervention needed" : diagnosis.severity === "warning" ? "Zone under stress" : "Mission active";

  const latest = history.slice(-8);
  const tempTrend = latest.length >= 2 ? latest.map((h) => h.temperature) : [telemetry.temperature, telemetry.temperature + 1];
  const moistureTrend = latest.length >= 2 ? latest.map((h) => h.soilMoisture) : [telemetry.soilMoisture, telemetry.soilMoisture - 1];
  const batteryTrend = latest.length >= 2 ? latest.map((h) => h.battery) : [telemetry.battery, telemetry.battery - 1];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #07111f 0%, #0b1b2d 100%)",
        color: "white",
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            marginBottom: 24,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 14,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                color: "#7dd3fc",
              }}
            >
              AgriDroneIOT
            </div>
            <h1 style={{ margin: "8px 0 6px", fontSize: 34 }}>Crop stress intelligence dashboard</h1>
            <div style={{ color: "rgba(255,255,255,0.72)" }}>
              Drone AI symptom detection, VOC interpretation, and action prescriptions.
            </div>
          </div>
          <div style={{ ...metricCard, minWidth: 280 }}>
            <div style={labelStyle}>Field diagnosis</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{missionStatus}</div>
            <div style={{ marginTop: 8, color: "rgba(255,255,255,0.72)", fontSize: 13 }}>
              Updated {lastUpdated.toLocaleTimeString()}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          <Gauge label="Temperature" value={telemetry.temperature} suffix="°C" min={0} max={50} />
          <Gauge label="Humidity" value={telemetry.humidity} suffix="%" />
          <Gauge label="Soil moisture" value={telemetry.soilMoisture} suffix="%" />
          <Gauge label="Battery" value={telemetry.battery} suffix="%" />
          <Gauge label="Altitude" value={telemetry.altitude} suffix=" m" min={0} max={150} />
          <Gauge label="Speed" value={telemetry.speed} suffix=" m/s" min={0} max={40} />
          <div style={metricCard}>
            <div style={labelStyle}>GPS lock</div>
            <div style={{ ...valueStyle, color: telemetry.gpsLock ? "#4ade80" : "#f87171" }}>
              {telemetry.gpsLock ? "Locked" : "Lost"}
            </div>
          </div>
          <div style={metricCard}>
            <div style={labelStyle}>Signal strength</div>
            <div style={valueStyle}>{telemetry.signal.toFixed(0)}%</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginTop: 16 }}>
          <div style={metricCard}>
            <div style={labelStyle}>Drone AI visual symptom reading</div>
            <div
              style={{
                padding: 16,
                borderRadius: 16,
                background: "rgba(15,23,42,0.9)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>{diagnosis.title}</div>
              <div style={{ color: "rgba(255,255,255,0.78)", marginBottom: 14 }}>{diagnosis.detail}</div>
              <div style={{ fontWeight: 700, color: diagnosis.severity === "critical" ? "#fca5a5" : diagnosis.severity === "warning" ? "#fcd34d" : "#93c5fd" }}>
                Prescription: {diagnosis.action}
              </div>
            </div>
          </div>

          <div style={{ ...metricCard, display: "flex", flexDirection: "column", gap: 12, maxHeight: 360, overflow: "auto" }}>
            <div style={labelStyle}>Live alert feed</div>
            {alerts.map((alert) => (
              <div key={alert.id + alert.time} style={{ padding: 14, borderRadius: 12, ...severityStyle(alert.severity) }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{alert.title}</div>
                  <div style={{ fontSize: 11, opacity: 0.85 }}>{alert.time}</div>
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.82)" }}>{alert.detail}</div>
                <div style={{ fontSize: 12, marginTop: 8, color: "rgba(255,255,255,0.78)" }}>Action: {alert.action}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginTop: 16 }}>
          <div style={metricCard}>
            <div style={labelStyle}>Temperature trend</div>
            <Sparkline values={tempTrend} stroke="#38bdf8" />
          </div>
          <div style={metricCard}>
            <div style={labelStyle}>Soil moisture trend</div>
            <Sparkline values={moistureTrend} stroke="#22c55e" />
          </div>
          <div style={metricCard}>
            <div style={labelStyle}>Battery trend</div>
            <Sparkline values={batteryTrend} stroke="#f59e0b" />
          </div>
        </div>

        <div style={{ ...metricCard, marginTop: 16 }}>
          <div style={labelStyle}>Mock drone spray action panel</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
            <ActionTile
              title="Spray mode"
              value={
                diagnosis.title.includes("Iron") || diagnosis.title.includes("Zinc")
                  ? "Chelated foliar spray"
                  : diagnosis.title.includes("Potassium")
                    ? "K-rich liquid spray"
                    : diagnosis.title.includes("Nitrogen")
                      ? "Variable-rate N top-up"
                      : diagnosis.title.includes("Fungal")
                        ? "Targeted bio fungicide"
                        : "Standby"
              }
            />
            <ActionTile title="Target zone" value="Zone A12 / stress cluster" />
            <ActionTile title="Coverage" value="15.8 ha planned" />
            <ActionTile title="Flow rate" value="1.4 L/min simulated" />
            <ActionTile title="Altitude" value="3.5 m AGL" />
            <ActionTile title="Path" value="Adaptive raster sweep" />
          </div>
          <div style={{ marginTop: 14, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button style={actionButton("#22c55e")} onClick={() => alert(`Starting spray mission: ${diagnosis.action}`)}>
              Start spray mission
            </button>
            <button style={actionButton("#38bdf8")} onClick={() => alert("Loading zone map and dosage prescription.")}>
              Load zone map
            </button>
            <button style={actionButton("#f59e0b")} onClick={() => alert("Simulated mission paused.")}>
              Pause mission
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionTile({ title, value }: { title: string; value: string }) {
  return (
    <div style={{ padding: 14, borderRadius: 14, background: "rgba(15,23,42,0.9)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 16, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function actionButton(color: string): React.CSSProperties {
  return {
    border: "none",
    borderRadius: 12,
    padding: "12px 16px",
    background: color,
    color: "white",
    fontWeight: 700,
    cursor: "pointer",
  };
}
