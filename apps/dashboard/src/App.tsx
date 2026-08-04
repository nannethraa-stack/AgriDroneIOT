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
      <div
        style={{
          marginTop: 12,
          height: 10,
          borderRadius: 999,
          background: "rgba(255,255,255,0.12)",
          overflow: "hidden",
        }}
      >
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

  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => {
      setTelemetry((prev) => ({
        temperature: clamp(prev.temperature + (Math.random() - 0.5) * 1.2, 24, 39),
        humidity: clamp(prev.humidity + (Math.random() - 0.5) * 3.5, 35, 92),
        soilMoisture: clamp(prev.soilMoisture + (Math.random() - 0.5) * 4, 20, 95),
        battery: clamp(prev.battery - 0.05 - Math.random() * 0.08, 5, 100),
        altitude: clamp(prev.altitude + (Math.random() - 0.5) * 2.5, 0, 120),
        speed: clamp(prev.speed + (Math.random() - 0.5) * 1.8, 0, 35),
        gpsLock: Math.random() > 0.02 ? true : prev.gpsLock,
        signal: clamp(prev.signal + (Math.random() - 0.5) * 2.2, 45, 100),
      }));
      setLastUpdated(new Date());
    }, 1000);

    return () => clearInterval(id);
  }, []);

  const missionStatus = useMemo(() => {
    if (telemetry.battery < 20) return "Return to base";
    if (!telemetry.gpsLock) return "Searching GPS";
    if (telemetry.soilMoisture < 35) return "Irrigation needed";
    return "Mission active";
  }, [telemetry]);

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

          <div style={{ ...metricCard, minWidth: 240 }}>
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
            <div style={valueStyle}>{telemetry.gpsLock ? "Locked" : "Lost"}</div>
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
              <div
                style={{
                  position: "absolute",
                  inset: 16,
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 12,
                }}
              />
              <div style={{ position: "absolute", left: 24, top: 24, fontSize: 12, color: "#a7f3d0" }}>
                LIVE
              </div>
              <div style={{ position: "absolute", right: 24, top: 24, fontSize: 12, color: "#93c5fd" }}>
                CAM 01
              </div>
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

          <div style={{ ...metricCard, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={labelStyle}>Alerts</div>
            <div
              style={{
                padding: 14,
                borderRadius: 12,
                background: "rgba(34,197,94,0.12)",
                border: "1px solid rgba(34,197,94,0.25)",
              }}
            >
              Spraying route optimized
            </div>
            <div
              style={{
                padding: 14,
                borderRadius: 12,
                background: "rgba(59,130,246,0.12)",
                border: "1px solid rgba(59,130,246,0.25)",
              }}
            >
              Telemetry stream stable
            </div>
            <div
              style={{
                padding: 14,
                borderRadius: 12,
                background: "rgba(245,158,11,0.12)",
                border: "1px solid rgba(245,158,11,0.25)",
              }}
            >
              Soil dryness trending upward
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
