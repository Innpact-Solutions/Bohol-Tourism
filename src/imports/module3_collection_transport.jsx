import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

const C = {
  navy: "#1B3A4B", teal: "#0D9488", tealLight: "#14B8A6", orange: "#F59E0B",
  blue: "#3B82F6", green: "#10B981", purple: "#8B5CF6", red: "#EF4444",
  dark: "#0F172A", darkCard: "#1E293B", darkBg: "#0B1120", accent: "#FCD34D",
  gray: "#64748B", grayLight: "#94A3B8", grayBorder: "#334155", cardBg: "#162032",
};

const tt = { background: C.darkCard, border: "none", borderRadius: 8, color: "#fff", fontSize: 11 };

export default function Module3() {
  const summary = [
    { label: "Accessible Settlements", value: "24,785", pct: "~45%", sub: "Serviceable by desludging trucks of 10 KL, 5 KL, 2 KL", color: C.green },
    { label: "Inaccessible Settlements", value: "9,828", pct: "~16%", sub: "Current suction truck capacity unable to provide service", color: C.red },
    { label: ">30 Min from FSTP", value: "2,754", pct: "~5%", sub: "Settlements beyond 30 min travel time from existing FSTP", color: C.orange },
    { label: "Priority Scheduled Desludging", value: "2,754", pct: "~5%", sub: "Identified through multi-criteria selection layers", color: C.purple },
  ];

  const fleetData = [
    { name: "10 KL", accessible: 35, partial: 10, inaccessible: 55 },
    { name: "5 KL", accessible: 55, partial: 15, inaccessible: 30 },
    { name: "2 KL", accessible: 70, partial: 12, inaccessible: 18 },
  ];

  // Stacked bar data — each row is one criteria
  const scenarioData = [
    { name: "Building Use", s1: 50, s2: 30, s3: 10, s4: 10, l1: "Tourism", l2: "Commercial", l3: "Residential", l4: "Institutional", c1: C.purple, c2: C.blue, c3: C.teal, c4: C.green },
    { name: "Bulk Generator", s1: 40, s2: 30, s3: 20, s4: 10, l1: ">3 Floors", l2: ">4 Floors", l3: ">5 Floors", l4: ">6 Floors", c1: "#F97316", c2: "#FB923C", c3: "#FDBA74", c4: "#FED7AA" },
    { name: "Climate & Env.", s1: 38, s2: 29, s3: 33, s4: 0, l1: "Flood", l2: "High GWT", l3: "Infiltration", l4: "", c1: C.red, c2: C.blue, c3: C.orange, c4: "transparent" },
  ];

  const travelData = [
    { name: "Tagbilaran", "0–10 min": 45, "10–20 min": 30, "20–30 min": 15, ">30 min": 10 },
    { name: "Dauis", "0–10 min": 55, "10–20 min": 25, "20–30 min": 12, ">30 min": 8 },
    { name: "Panglao", "0–10 min": 30, "10–20 min": 35, "20–30 min": 20, ">30 min": 15 },
  ];

  // Custom stacked bar renderer
  const StackedRow = ({ d }) => {
    const segments = [
      { pct: d.s1, label: d.l1, color: d.c1 },
      { pct: d.s2, label: d.l2, color: d.c2 },
      { pct: d.s3, label: d.l3, color: d.c3 },
    ];
    if (d.s4 > 0) segments.push({ pct: d.s4, label: d.l4, color: d.c4 });

    return (
      <div style={{ marginBottom: 14 }}>
        <div style={{ color: "#fff", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{d.name}</div>
        {/* Bar */}
        <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", height: 28 }}>
          {segments.map((seg, i) => (
            <div key={i} style={{
              width: `${seg.pct}%`, background: seg.color, height: "100%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 9, fontWeight: 700, color: "#fff",
              borderRight: i < segments.length - 1 ? `1px solid ${C.darkBg}` : "none",
              minWidth: seg.pct > 5 ? 0 : 0,
            }}>
              {seg.pct >= 15 ? `${seg.pct}%` : ""}
            </div>
          ))}
        </div>
        {/* Labels */}
        <div style={{ display: "flex", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
          {segments.map((seg, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: seg.color }} />
              <span style={{ color: C.grayLight, fontSize: 10 }}>{seg.label}</span>
              <span style={{ color: seg.color, fontSize: 10, fontWeight: 600 }}>{seg.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: C.darkBg, minHeight: "100vh", color: "#fff" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <div style={{ background: `linear-gradient(135deg, ${C.navy} 0%, ${C.dark} 100%)`, padding: "24px 28px 20px", borderBottom: `1px solid ${C.grayBorder}` }}>
        <div style={{ fontSize: 10, color: C.tealLight, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Module 3</div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>Collection & Transport</div>
        <div style={{ color: C.grayLight, fontSize: 12, marginTop: 4 }}>Towards Improved Service Accessibility and Collection Systems</div>
      </div>

      <div style={{ padding: "24px 28px", maxWidth: 940, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ── ACCESSIBILITY SUMMARY ── */}
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Accessibility Summary</div>
          <div style={{ color: C.grayLight, fontSize: 11, marginBottom: 14 }}>Across settlements of all three LGUs</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {summary.map(s => (
              <div key={s.label} style={{
                flex: 1, minWidth: 180, background: C.cardBg, borderRadius: 12, padding: "16px 18px",
                borderLeft: `3px solid ${s.color}`, position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: 0, right: 0, width: 50, height: 50, background: `${s.color}08`, borderRadius: "0 0 0 50px" }} />
                <div style={{ color: C.grayLight, fontSize: 11, marginBottom: 4 }}>{s.label}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 24, fontWeight: 700 }}>{s.value}</span>
                  <span style={{ background: `${s.color}25`, color: s.color, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 10 }}>{s.pct}</span>
                </div>
                <div style={{ color: C.gray, fontSize: 10, marginTop: 4 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FLEET ACCESSIBILITY ── */}
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Fleet Accessibility Coverage</div>
          <div style={{ color: C.grayLight, fontSize: 11, marginBottom: 14 }}>Coverage by truck capacity — 10 KL, 5 KL, 2 KL</div>
          <div style={{ background: C.cardBg, borderRadius: 12, padding: 16 }}>
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={fleetData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={C.grayBorder} horizontal={false} />
                <XAxis type="number" tick={{ fill: C.grayLight, fontSize: 9 }} tickLine={false} unit="%" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" tick={{ fill: "#fff", fontSize: 12 }} tickLine={false} width={55} />
                <Tooltip contentStyle={tt} formatter={(v) => `${v}%`} />
                <Bar dataKey="accessible" fill={C.green} name="Accessible" stackId="a" />
                <Bar dataKey="partial" fill={C.orange} name="Partial" stackId="a" />
                <Bar dataKey="inaccessible" fill={C.red} name="Inaccessible" stackId="a" radius={[0, 4, 4, 0]} />
                <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── DESLUDGING SCENARIOS (3 stacked rows) ── */}
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Potential Scheduled Desludging Scenarios</div>
          <div style={{ color: C.grayLight, fontSize: 11, marginBottom: 14 }}>Selection based on building use, bulk generator profile, and climate & environmental risk</div>
          <div style={{ background: C.cardBg, borderRadius: 12, padding: "18px 20px 10px" }}>
            {scenarioData.map(d => <StackedRow key={d.name} d={d} />)}
          </div>
        </div>

        {/* ── SETTLEMENT PROXIMITY ── */}
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Settlement Proximity to FSTP</div>
          <div style={{ color: C.grayLight, fontSize: 11, marginBottom: 14 }}>Travel time to FSTP from LGUs</div>
          <div style={{ background: C.cardBg, borderRadius: 12, padding: 16 }}>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={travelData}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.grayBorder} />
                <XAxis dataKey="name" tick={{ fill: "#fff", fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fill: C.grayLight, fontSize: 9 }} tickLine={false} unit="%" />
                <Tooltip contentStyle={tt} formatter={(v) => `${v}%`} />
                <Bar dataKey="0–10 min" fill={C.green} radius={[3, 3, 0, 0]} />
                <Bar dataKey="10–20 min" fill={C.teal} radius={[3, 3, 0, 0]} />
                <Bar dataKey="20–30 min" fill={C.orange} radius={[3, 3, 0, 0]} />
                <Bar dataKey=">30 min" fill={C.red} radius={[3, 3, 0, 0]} />
                <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── KEY INSIGHT ── */}
        <div style={{ background: C.cardBg, borderRadius: 12, padding: "16px 20px", borderLeft: `3px solid ${C.green}` }}>
          <div style={{ color: C.green, fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Key Insight</div>
          <div style={{ color: C.grayLight, fontSize: 12, lineHeight: 1.7 }}>
            Factoring both FSTP locations reduces average travel time to 8 minutes and optimizes fleet efficiency by 44%. Proposed Tagbilaran FSTP would improve coverage for Tagbilaran City and Panglao areas.
          </div>
        </div>

      </div>
    </div>
  );
}
