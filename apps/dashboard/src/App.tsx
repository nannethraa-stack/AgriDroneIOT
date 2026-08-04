import React, { useEffect, useMemo, useRef, useState } from "react";

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

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

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

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function severityStyle(severity: AlertItem["severity"]): React.CSSProperties {
  if (severity === "critical") {
    return {
      background: "rgba(239,68,68,0.12)",
      border: "1px solid rgba(239,68,68,0.3)",
    };
  }
  if (severity === "warning") {
    return {
      background: "rgba(245,158,11,0.12)",
      border: "1px solid rgba(245,158,11,0.3)",
    };
  }
  return {
    background: "rgba(59,130,246,0.12)",
    border: "1px solid rgba(59,130,246,0.3)",
  };
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

function Sparkline({
  values,
  stroke = "#38bdf8",
}: {
  values: number[];
  stroke?: string;
}) {
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

export default function App() {
  const [telemetry, setTelemetry] = useState<Telemetry>({
    temperature: 28.4,
    humidity: 61,
    soilMoisture: 48,
    battery: 86,
    altitude: 32,
    speed: 11,
    gpsLock: true,
    signal: 93,
  });

  const [alerts, setAlerts] = useState<AlertItem[]>([
    {
      id: "ok",
      severity: "info",
      title: "All systems nominal",
      detail: "Telemetry is stable and within expected ranges.",
      time: nowTime(),
    },
  ]);

  const [history, setHistory] = useState<Snapshot[]>([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const alertSeenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const id = setInterval(() => {
      setTelemetry((prev) => {
        const next = {
          temperature: clamp(prev.temperature + (Math.random() - 0.5) * 1.2, 24, 39),
          humidity: clamp(prev.humidity + (Math.random() - 0.5) * 3.5, 35, 92),
          soilMoisture: clamp(prev.soilMoisture + (Math.random() - 0.5) * 4, 20, 95),
          battery: clamp(prev.battery - 0.05 - Math.random() * 0.08, 5, 100),
          altitude: clamp(prev.altitude + (Math.random() - 0.5) * 2.5, 0, 120),
          speed: clamp(prev.speed + (Math.random() - 0.5) * 1.8, 0, 35),
          gpsLock: Math.random() > 0.97 ? false : Math.random() > 0.03 ? true : prev.gpsLock,
          signal: clamp(prev.signal + (Math.random() - 0.5) * 2.2, 45, 100),
        };

        const newAlerts: AlertItem[] = [];
        if (next.battery < 25) {
          newAlerts.push({
            id: "battery-critical",
            severity: "critical",
            title: "Battery low",
            detail: `Battery at ${next.battery.toFixed(0)}%. Return to base soon.`,
            time: nowTime(),
          });
        } else if (next.battery < 40) {
          newAlerts.push({
            id: "battery-warning",
            severity: "warning",
            title: "Battery declining",
            detail: `Battery at ${next.battery.toFixed(0)}%. Plan recharge window.`,
            time: nowTime(),
          });
        }

        if (next.soilMoisture < 35) {
          newAlerts.push({
            id: "soil-critical",
            severity: "critical",
            title: "Irrigation needed",
            detail: `Soil moisture is ${next.soilMoisture.toFixed(0)}%.`,
            time: nowTime(),
          });
        } else if (next.soilMoisture < 45) {
          newAlerts.push({
            id: "soil-warning",
            severity: "warning",
            title: "Soil moisture dropping",
            detail: `Current moisture ${next.soilMoisture.toFixed(0)}%.`,
            time: nowTime(),
          });
        }

        if (next.temperature > 35) {
          newAlerts.push({
            id: "heat-warning",
            severity: "warning",
            title: "Heat stress risk",
            detail: `Temperature peaked at ${next.temperature.toFixed(1)}°C.`,
            time: nowTime(),
          });
        }

        if (!next.gpsLock) {
          newAlerts.push({
            id: "gps-critical",
            severity: "critical",
            title: "GPS signal lost",
            detail: "Drone navigation is using fallback stabilization mode.",
            time: nowTime(),
          });
        }

        if (next.signal < 60) {
          newAlerts.push({
            id: "signal-warning",
            severity: "warning",
            title: "Weak telemetry signal",
            detail: `Signal strength is ${next.signal.toFixed(0)}%.`,
            time: nowTime(),
          });
        }

        if (newAlerts.length === 0) {
          newAlerts.push({
            id: "ok",
            severity: "info",
            title: "All systems nominal",
            detail: "Telemetry is stable and within expected ranges.",
            time: nowTime(),
          });
        }

        for (const alert of newAlerts) {
          if (!alertSeenRef.current.has(alert.id + alert.title)) {
            alertSeenRef.current.add(alert.id + alert.title);
            setAlerts((prevAlerts) => [alert, ...prevAlerts].slice(0, 6));
          } else if (alert.severity !== "info") {
            setAlerts((prevAlerts) => {
              const filtered = prevAlerts.filter((a) => a.id !== alert.id);
              return [alert, ...filtered].slice(0, 6);
            });
          }
        }

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

  const missionStatus = useMemo(() => {
    if (telemetry.battery < 25) return "Return to base";
    if (!telemetry.gpsLock) return "Searching GPS";
    if (telemetry.soilMoisture < 35) return "Irrigation needed";
    return "Mission active";
  }, [telemetry]);

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
            <h1 style={{ margin: "8px 0 6px", fontSize: 34 }}>Real-time dashboard</h1>
            <div style={{ color: "rgba(255,255,255,0.72)" }}>
              Live telemetry simulation for drone monitoring and crop operations.
            </div>
          </div>

          <div
            style={{
              ...metricCard,
              minWidth: 260,
              animation: telemetry.battery < 25 || !telemetry.gpsLock ? "pulse 1.2s infinite" : "none",
            }}
          >
            <div style={labelStyle}>Mission status</div>
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
            <div style={labelStyle}>Drone feed</div>
            <div
              style={{
                height: 320,
                borderRadius: 16,
                background:
                  "radial-gradient(circle at top, rgba(56,189,248,0.35), transparent 40%), linear-gradient(180deg, rgba(15,23,42,0.9), rgba(2,6,23,0.95))",
                position: "relative",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div style={{ position: "absolute", inset: 16, border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12 }} />
              <div style={{ position: "absolute", left: 24, top: 24, fontSize: 12, color: "#a7f3d0" }}>LIVE</div>
              <div style={{ position: "absolute", right: 24, top: 24, fontSize: 12, color: "#93c5fd" }}>CAM 01</div>
              <div style={{ position: "absolute", bottom: 24, left: 24, color: "rgba(255,255,255,0.8)" }}>
                Simulated drone stream overlay
              </div>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "repeating-linear-gradient(180deg, transparent 0 20px, rgba(255,255,255,0.03) 20px 21px)",
                }}
              />
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
      </div>

      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(248,113,113,0.45); }
          70% { box-shadow: 0 0 0 18px rgba(248,113,113,0); }
          100% { box-shadow: 0 0 0 0 rgba(248,113,113,0); }
        }
      `}</style>
    </div>
  );
}
