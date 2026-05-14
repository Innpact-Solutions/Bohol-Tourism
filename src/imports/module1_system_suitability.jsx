import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from "recharts";

const C = {
  navy: "#1B3A4B", teal: "#0D9488", tealLight: "#14B8A6", orange: "#F59E0B",
  blue: "#3B82F6", green: "#10B981", purple: "#8B5CF6", red: "#EF4444",
  dark: "#0F172A", darkCard: "#1E293B", darkBg: "#0B1120", accent: "#FCD34D",
  gray: "#64748B", grayLight: "#94A3B8", grayBorder: "#334155", cardBg: "#162032",
  indigo: "#6366F1", pink: "#EC4899", cyan: "#06B6D4",
};

const tt = { background: C.darkCard, border: "none", borderRadius: 8, color: "#fff", fontSize: 11 };

const HBar = ({ label, pct, color }) => (
  <div style={{ marginBottom: 5 }}>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.grayLight, marginBottom: 2 }}>
      <span>{label}</span><span style={{ color, fontWeight: 600 }}>{pct}%</span>
    </div>
    <div style={{ background: C.grayBorder, borderRadius: 4, height: 7, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, background: color, height: "100%", borderRadius: 4 }} />
    </div>
  </div>
);

export default function Module1() {
  // ── ZONE SUMMARY ──
  const zones = [
    { label: "Network Coverage", value: "24,785", pct: "~45%", sub: "Number of buildings suitable", color: C.teal },
    { label: "Non-Network Coverage", value: "19,828", pct: "~36%", sub: "Number of buildings suitable", color: C.blue },
    { label: "On-Site Treatment", value: "2,754", pct: "~5%", sub: "Number of buildings suitable", color: C.orange },
    { label: "Sensitive Settlements in Network", value: "~42%", pct: "", sub: "Based on combined climate hazards and environmental sensitivity", color: C.red },
  ];

  // ── COVERAGE DISTRIBUTION DATA ──
  const networkRisk = [
    { name: "Flood Hazard", value: 30 },
    { name: "High GWT", value: 25 },
    { name: "High Infiltration", value: 20 },
    { name: "Limited Risk", value: 25 },
  ];
  const networkBuild = [
    { name: "Residential", value: 45 },
    { name: "Hotels/Resorts", value: 22 },
    { name: "Commercial", value: 20 },
    { name: "Institutional", value: 13 },
  ];

  const nonNetRisk = [
    { name: "Flood Hazard", value: 35 },
    { name: "High GWT", value: 30 },
    { name: "High Infiltration", value: 20 },
    { name: "Limited Risk", value: 15 },
  ];
  const nonNetBuild = [
    { name: "Residential", value: 60 },
    { name: "Hotels/Resorts", value: 15 },
    { name: "Commercial", value: 15 },
    { name: "Institutional", value: 10 },
  ];

  const onSiteRisk = [
    { name: "Flood Hazard", value: 25 },
    { name: "High GWT", value: 30 },
    { name: "High Infiltration", value: 25 },
    { name: "Limited Risk", value: 20 },
  ];
  const onSiteBuild = [
    { name: "Hospitality", value: 35 },
    { name: "Residential", value: 20 },
    { name: "Education", value: 15 },
    { name: "Healthcare", value: 15 },
    { name: "Public Services", value: 15 },
  ];

  // ── LGU SUITABILITY ──
  const lguData = [
    { name: "Tagbilaran", Network: 58, NonNetwork: 28, OnSite: 8 },
    { name: "Dauis", Network: 38, NonNetwork: 42, OnSite: 6 },
    { name: "Panglao", Network: 32, NonNetwork: 48, OnSite: 4 },
  ];

  const riskColors = [C.red, C.orange, C.blue, C.green];
  const buildColors = [C.orange, C.purple, C.blue, C.teal, C.indigo];

  // ── NESTED DONUT COMPONENT ──
  const NestedDonut = ({ title, color, riskData, buildData, count, pct }) => (
    <div style={{ flex: 1, minWidth: 260, background: C.cardBg, borderRadius: 12, padding: "18px 20px", borderTop: `3px solid ${color}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>{title}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span style={{ color, fontSize: 11, fontWeight: 600 }}>{count}</span>
          {pct && <span style={{ color: C.gray, fontSize: 10 }}>({pct})</span>}
        </div>
      </div>

      {/* Nested donut */}
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ flex: "0 0 140px" }}>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              {/* Outer: Climate Risk */}
              <Pie data={riskData} cx="50%" cy="50%" innerRadius={46} outerRadius={62} dataKey="value" paddingAngle={2} strokeWidth={0}>
                {riskData.map((_, i) => <Cell key={i} fill={riskColors[i]} />)}
              </Pie>
              {/* Inner: Building Use */}
              <Pie data={buildData} cx="50%" cy="50%" innerRadius={22} outerRadius={42} dataKey="value" paddingAngle={2} strokeWidth={0}>
                {buildData.map((_, i) => <Cell key={i} fill={buildColors[i]} />)}
              </Pie>
              <Tooltip contentStyle={tt} formatter={(v) => `${v}%`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, fontSize: 9 }}>
          <div style={{ color: C.tealLight, fontWeight: 600, marginBottom: 4, fontSize: 10 }}>Climate & Env. Risk (outer)</div>
          {riskData.map((d, i) => (
            <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: riskColors[i], flexShrink: 0 }} />
              <span style={{ color: C.grayLight }}>{d.name}</span>
              <span style={{ marginLeft: "auto", color: riskColors[i], fontWeight: 600 }}>{d.value}%</span>
            </div>
          ))}
          <div style={{ color: C.orange, fontWeight: 600, marginBottom: 4, marginTop: 6, fontSize: 10 }}>Building Use (inner)</div>
          {buildData.map((d, i) => (
            <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: buildColors[i], flexShrink: 0 }} />
              <span style={{ color: C.grayLight }}>{d.name}</span>
              <span style={{ marginLeft: "auto", color: buildColors[i], fontWeight: 600 }}>{d.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: C.darkBg, minHeight: "100vh", color: "#fff" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <div style={{ background: `linear-gradient(135deg, ${C.navy} 0%, ${C.dark} 100%)`, padding: "24px 28px 20px", borderBottom: `1px solid ${C.grayBorder}` }}>
        <div style={{ fontSize: 10, color: C.tealLight, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Module 1</div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>System Suitability</div>
        <div style={{ color: C.grayLight, fontSize: 12, marginTop: 4 }}>Appropriate Sanitation Systems by Location</div>
      </div>

      <div style={{ padding: "24px 28px", maxWidth: 940, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ── SANITATION ZONE SUMMARY ── */}
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Sanitation Zone Summary</div>
          <div style={{ color: C.grayLight, fontSize: 11, marginBottom: 14 }}>Across settlements of all three LGUs</div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {zones.map(z => (
              <div key={z.label} style={{
                flex: 1, minWidth: 180, background: C.cardBg, borderRadius: 12, padding: "16px 18px",
                borderLeft: `3px solid ${z.color}`, position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: 0, right: 0, width: 50, height: 50, background: `${z.color}08`, borderRadius: "0 0 0 50px" }} />
                <div style={{ color: C.grayLight, fontSize: 11, marginBottom: 4 }}>{z.label}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 24, fontWeight: 700 }}>{z.value}</span>
                  {z.pct && <span style={{ background: `${z.color}25`, color: z.color, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 10 }}>{z.pct}</span>}
                </div>
                <div style={{ color: C.gray, fontSize: 10, marginTop: 4 }}>{z.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── COVERAGE DISTRIBUTION (3 nested donuts) ── */}
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Coverage Distribution</div>
          <div style={{ color: C.grayLight, fontSize: 11, marginBottom: 14 }}>Climate & environmental risk (outer ring) · Building use (inner ring)</div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <NestedDonut title="Network Coverage" color={C.teal} riskData={networkRisk} buildData={networkBuild} count="24,785" pct="~45%" />
            <NestedDonut title="Non-Network Coverage" color={C.blue} riskData={nonNetRisk} buildData={nonNetBuild} count="19,828" pct="~36%" />
            <NestedDonut title="On-Site Treatment" color={C.orange} riskData={onSiteRisk} buildData={onSiteBuild} count="2,754" pct="~5%" />
          </div>
        </div>

        {/* ── SUITABILITY BY LGU ── */}
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>System Suitability by LGU</div>
          <div style={{ color: C.grayLight, fontSize: 11, marginBottom: 14 }}>Percentage of buildings suitable for each system type</div>

          <div style={{ background: C.cardBg, borderRadius: 12, padding: 16 }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={lguData}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.grayBorder} />
                <XAxis dataKey="name" tick={{ fill: "#fff", fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fill: C.grayLight, fontSize: 9 }} tickLine={false} unit="%" />
                <Tooltip contentStyle={tt} formatter={(v) => `${v}%`} />
                <Bar dataKey="Network" fill={C.teal} name="Network" radius={[3,3,0,0]} />
                <Bar dataKey="NonNetwork" fill={C.blue} name="Non-Network" radius={[3,3,0,0]} />
                <Bar dataKey="OnSite" fill={C.orange} name="On-Site" radius={[3,3,0,0]} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── KEY INSIGHT ── */}
        <div style={{ background: C.cardBg, borderRadius: 12, padding: "16px 20px", borderLeft: `3px solid ${C.green}` }}>
          <div style={{ color: C.green, fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Key Insight</div>
          <div style={{ color: C.grayLight, fontSize: 12, lineHeight: 1.7 }}>
            Network coverage is most suitable in high-density settlements with deep groundwater and low flood risk. Tagbilaran CBD shows 58% network suitability.
          </div>
        </div>

      </div>
    </div>
  );
}
