import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from "recharts";

const C = {
  navy: "#1B3A4B", teal: "#0D9488", tealLight: "#14B8A6", orange: "#F59E0B",
  blue: "#3B82F6", green: "#10B981", purple: "#8B5CF6", red: "#EF4444",
  dark: "#0F172A", darkCard: "#1E293B", darkBg: "#0B1120", accent: "#FCD34D",
  gray: "#64748B", grayLight: "#94A3B8", grayBorder: "#334155", cardBg: "#162032",
  yellow: "#F59E0B", pink: "#EC4899", cyan: "#06B6D4", indigo: "#6366F1",
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

export default function BaseLayerKPI() {
  const overview = [
    { label: "Total Population", value: "201,744", sub: "as of 2024", color: C.red },
    { label: "Total Area", value: "122.1 km²", sub: "Planning coverage", color: C.orange },
    { label: "Residential Buildings", value: "~55,078", sub: "Residential units", color: C.teal },
    { label: "Bulk & Non-Residential", value: "~532", sub: "Institutional sources", color: C.blue },
  ];

  const buildingUse = [
    { name: "Residential", count: 55078, pct: 83.2, color: C.yellow },
    { name: "Commercial & Retail", count: 4120, pct: 6.2, color: C.blue },
    { name: "Tourism & Hospitality", count: 2890, pct: 4.4, color: C.purple },
    { name: "Education & Institutional", count: 1680, pct: 2.5, color: C.indigo },
    { name: "Healthcare", count: 520, pct: 0.8, color: C.pink },
    { name: "Govt & Public Services", count: 890, pct: 1.3, color: C.green },
    { name: "Religious & Cultural", count: 1032, pct: 1.6, color: C.orange },
  ];

  const bulkByFloors = [
    { name: "3 Floors", count: 210 },
    { name: "4 Floors", count: 145 },
    { name: "5 Floors", count: 98 },
    { name: "6+ Floors", count: 79 },
  ];
  const bulkByArea = [
    { name: "100–200 sqm", count: 85 },
    { name: "200–500 sqm", count: 195 },
    { name: "500–1000 sqm", count: 162 },
    { name: ">1000 sqm", count: 90 },
  ];

  // Economic Vulnerability — single overall distribution by LGU (count of EV buildings)
  const evData = [
    { name: "Tagbilaran", buildings: 3420, pct: 6.2 },
    { name: "Dauis", buildings: 1850, pct: 3.3 },
    { name: "Panglao", buildings: 1880, pct: 3.4 },
  ];
  const totalEV = 7150;

  // Climate & Environmental Sensitivity — 3 consolidated layers
  const riskLayers = [
    {
      name: "Flood Hazard",
      color: C.blue,
      desc: "Flood hazard level across project area",
      bars: [{ label: "High", pct: 28 }, { label: "Moderate", pct: 32 }, { label: "Low", pct: 40 }],
    },
    {
      name: "Groundwater Depth",
      color: C.teal,
      desc: "Depth to groundwater table (metres)",
      bars: [{ label: "0–2m (Shallow)", pct: 20 }, { label: "2–5m", pct: 30 }, { label: "5–10m", pct: 35 }, { label: ">10m (Deep)", pct: 15 }],
    },
    {
      name: "Ground Infiltration",
      color: C.orange,
      desc: "Combined soil, sinkhole, and geology risk",
      bars: [{ label: "High Risk", pct: 25 }, { label: "Moderate Risk", pct: 35 }, { label: "Low Risk", pct: 40 }],
    },
  ];
  const riskBarColors = [C.red, C.orange, C.green, C.teal];

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: C.darkBg, minHeight: "100vh", color: "#fff" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <div style={{ background: `linear-gradient(135deg, ${C.navy} 0%, ${C.dark} 100%)`, padding: "24px 28px 20px", borderBottom: `1px solid ${C.grayBorder}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${C.red}22`, border: `2px solid ${C.red}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>📍</div>
          <div>
            <div style={{ fontSize: 10, color: C.tealLight, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>Base Layer</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>Project Area Overview</div>
          </div>
        </div>
        <div style={{ color: C.grayLight, fontSize: 12 }}>Tagbilaran · Dauis · Panglao</div>
      </div>

      <div style={{ padding: "24px 28px", maxWidth: 940, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ── PROJECT AREA OVERVIEW ── */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {overview.map(o => (
            <div key={o.label} style={{
              flex: 1, minWidth: 170, background: C.cardBg, borderRadius: 12, padding: "16px 18px",
              borderLeft: `3px solid ${o.color}`, position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: 0, right: 0, width: 50, height: 50, background: `${o.color}08`, borderRadius: "0 0 0 50px" }} />
              <div style={{ color: C.grayLight, fontSize: 11, marginBottom: 4 }}>{o.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#fff" }}>{o.value}</div>
              <div style={{ color: C.gray, fontSize: 10, marginTop: 2 }}>{o.sub}</div>
            </div>
          ))}
        </div>

        {/* ── BUILDING USE ── */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ width: 4, height: 20, background: C.red, borderRadius: 2 }} />
            <div style={{ fontSize: 15, fontWeight: 700 }}>Building Layers</div>
          </div>
          <div style={{ color: C.grayLight, fontSize: 11, marginBottom: 14 }}>7 building categories · ~66,210 total structures</div>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <div style={{ flex: "0 0 220px", background: C.cardBg, borderRadius: 12, padding: 16 }}>
              <div style={{ color: "#fff", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Building Use</div>
              <ResponsiveContainer width="100%" height={195}>
                <PieChart>
                  <Pie data={buildingUse} cx="50%" cy="50%" innerRadius={48} outerRadius={80} dataKey="count" paddingAngle={2} strokeWidth={0}>
                    {buildingUse.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tt} formatter={(v) => v.toLocaleString()} />
                  <text x="50%" y="46%" textAnchor="middle" fill="#fff" fontSize={17} fontWeight={700}>66,210</text>
                  <text x="50%" y="57%" textAnchor="middle" fill={C.grayLight} fontSize={9}>buildings</text>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div style={{ flex: 1, minWidth: 280, display: "flex", flexDirection: "column", gap: 5 }}>
              {buildingUse.map(b => (
                <div key={b.name} style={{ background: C.cardBg, borderRadius: 8, padding: "7px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: b.color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#fff", fontSize: 11, fontWeight: 500 }}>{b.name}</span>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                        <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>{b.count.toLocaleString()}</span>
                        <span style={{ color: b.color, fontSize: 10, fontWeight: 600 }}>{b.pct}%</span>
                      </div>
                    </div>
                    <div style={{ marginTop: 2, background: C.grayBorder, borderRadius: 3, height: 4, overflow: "hidden" }}>
                      <div style={{ width: `${Math.min(b.pct * 1.2, 100)}%`, background: b.color, height: "100%", borderRadius: 3 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── BULK GENERATORS ── */}
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Bulk Generators</div>
          <div style={{ color: C.grayLight, fontSize: 11, marginBottom: 14 }}>~532 non-residential bulk sources · By floors and built-up area</div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 260, background: C.cardBg, borderRadius: 12, padding: 16 }}>
              <div style={{ color: "#fff", fontSize: 12, fontWeight: 600, marginBottom: 10 }}>By Number of Floors</div>
              <ResponsiveContainer width="100%" height={170}>
                <BarChart data={bulkByFloors}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grayBorder} />
                  <XAxis dataKey="name" tick={{ fill: "#fff", fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fill: C.grayLight, fontSize: 9 }} tickLine={false} />
                  <Tooltip contentStyle={tt} />
                  <Bar dataKey="count" name="Buildings" radius={[4,4,0,0]}>
                    {bulkByFloors.map((_, i) => <Cell key={i} fill={[C.teal, C.blue, C.purple, C.orange][i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ flex: 1, minWidth: 260, background: C.cardBg, borderRadius: 12, padding: 16 }}>
              <div style={{ color: "#fff", fontSize: 12, fontWeight: 600, marginBottom: 10 }}>By Built-up Area</div>
              <ResponsiveContainer width="100%" height={170}>
                <BarChart data={bulkByArea}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grayBorder} />
                  <XAxis dataKey="name" tick={{ fill: "#fff", fontSize: 9 }} tickLine={false} />
                  <YAxis tick={{ fill: C.grayLight, fontSize: 9 }} tickLine={false} />
                  <Tooltip contentStyle={tt} />
                  <Bar dataKey="count" name="Buildings" radius={[4,4,0,0]}>
                    {bulkByArea.map((_, i) => <Cell key={i} fill={[C.green, C.teal, C.blue, C.indigo][i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── ECONOMIC VULNERABILITY ── */}
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Economic Vulnerability</div>
          <div style={{ color: C.grayLight, fontSize: 11, marginBottom: 14 }}>~{totalEV.toLocaleString()} economically vulnerable buildings (~13% of total)</div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {evData.map((ev, i) => (
              <div key={ev.name} style={{
                flex: 1, minWidth: 200, background: C.cardBg, borderRadius: 12, padding: "16px 18px",
                borderTop: `3px solid ${[C.teal, C.blue, C.orange][i]}`,
              }}>
                <div style={{ color: "#fff", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{ev.name}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 24, fontWeight: 700 }}>{ev.buildings.toLocaleString()}</span>
                  <span style={{ background: `${[C.teal, C.blue, C.orange][i]}25`, color: [C.teal, C.blue, C.orange][i], fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 10 }}>{ev.pct}%</span>
                </div>
                <div style={{ color: C.grayLight, fontSize: 10, marginTop: 4 }}>EV buildings identified</div>
              </div>
            ))}
            <div style={{ flex: 1, minWidth: 200, background: C.cardBg, borderRadius: 12, padding: "16px 18px", borderTop: `3px solid ${C.accent}` }}>
              <div style={{ color: C.accent, fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Total EV</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 24, fontWeight: 700 }}>{totalEV.toLocaleString()}</span>
                <span style={{ background: `${C.accent}25`, color: C.accent, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 10 }}>~13%</span>
              </div>
              <div style={{ color: C.grayLight, fontSize: 10, marginTop: 4 }}>of total buildings</div>
            </div>
          </div>
        </div>

        {/* ── CLIMATE & ENVIRONMENTAL SENSITIVITY ── */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ width: 4, height: 20, background: C.blue, borderRadius: 2 }} />
            <div style={{ fontSize: 15, fontWeight: 700 }}>Climate & Environmental Sensitivity</div>
          </div>
          <div style={{ color: C.grayLight, fontSize: 11, marginBottom: 14 }}>3 key risk layers assessed across the project area</div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {riskLayers.map(rl => (
              <div key={rl.name} style={{ flex: 1, minWidth: 240, background: C.cardBg, borderRadius: 12, padding: "16px 18px", borderLeft: `3px solid ${rl.color}` }}>
                <div style={{ color: "#fff", fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{rl.name}</div>
                <div style={{ color: C.gray, fontSize: 10, marginBottom: 10 }}>{rl.desc}</div>
                {rl.bars.map((b, bi) => (
                  <HBar key={b.label} label={b.label} pct={b.pct} color={riskBarColors[bi]} />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ── KEY INSIGHTS ── */}
        <div style={{ background: C.cardBg, borderRadius: 12, padding: "16px 20px", borderLeft: `3px solid ${C.green}` }}>
          <div style={{ color: C.green, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Key Insights</div>
          <div style={{ color: C.grayLight, fontSize: 12, lineHeight: 1.8 }}>
            • ~45% of buildings fall within climate and environmentally sensitive zones.<br/>
            • ~13% of buildings (~7,150) are classified as economically vulnerable.<br/>
            • 532 bulk generators identified — majority in the 200–500 sqm built-up range with 3–4 floors.
          </div>
        </div>

      </div>
    </div>
  );
}
