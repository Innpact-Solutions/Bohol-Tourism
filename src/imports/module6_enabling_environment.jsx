import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Line, ComposedChart } from "recharts";

const C = {
  navy: "#1B3A4B", teal: "#0D9488", tealLight: "#14B8A6", orange: "#F59E0B",
  blue: "#3B82F6", green: "#10B981", purple: "#8B5CF6", red: "#EF4444",
  dark: "#0F172A", darkCard: "#1E293B", darkBg: "#0B1120", accent: "#FCD34D",
  gray: "#64748B", grayLight: "#94A3B8", grayBorder: "#334155", cardBg: "#162032",
};

const tooltipStyle = { background: C.darkCard, border: "none", borderRadius: 8, color: "#fff", fontSize: 11 };

export default function Module6() {
  const phases = [
    { name: "Phase 1", period: "2027–2030", cost: 6, pct: 27, interventions: 18, buildings: 8200, color: C.teal, tag: "SHORT-TERM" },
    { name: "Phase 2", period: "2030–2035", cost: 8, pct: 36, interventions: 25, buildings: 6800, color: C.blue, tag: "MEDIUM-TERM" },
    { name: "Phase 3", period: "2035–2040", cost: 8, pct: 37, interventions: 28, buildings: 4100, color: C.purple, tag: "LONG-TERM" },
  ];

  const interventionMix = [
    { name: "Phase 1\n(2027–30)", Toilet: 5, Collection: 3, Network: 4, Treatment: 4 },
    { name: "Phase 2\n(2030–35)", Toilet: 6, Collection: 4, Network: 7, Treatment: 5 },
    { name: "Phase 3\n(2035–40)", Toilet: 4, Collection: 3, Network: 9, Treatment: 8 },
  ];

  const buildingsByPhase = [
    { name: "Phase 1", Tagbilaran: 4500, Dauis: 2100, Panglao: 1600 },
    { name: "Phase 2", Tagbilaran: 3600, Dauis: 1800, Panglao: 1400 },
    { name: "Phase 3", Tagbilaran: 2100, Dauis: 1200, Panglao: 800 },
  ];

  const riskData = [
    { name: "Flood Hazard", value: 2850, color: C.red },
    { name: "Ground Infiltration", value: 1620, color: C.orange },
    { name: "High Groundwater", value: 1340, color: C.blue },
  ];

  const permitData = [
    { month: "Jan", applied: 28, approved: 22 }, { month: "Feb", applied: 31, approved: 25 },
    { month: "Mar", applied: 35, approved: 29 }, { month: "Apr", applied: 27, approved: 21 },
    { month: "May", applied: 33, approved: 27 }, { month: "Jun", applied: 29, approved: 24 },
    { month: "Jul", applied: 32, approved: 26 }, { month: "Aug", applied: 30, approved: 25 },
    { month: "Sep", applied: 26, approved: 22 }, { month: "Oct", applied: 28, approved: 23 },
    { month: "Nov", applied: 24, approved: 20 }, { month: "Dec", applied: 24, approved: 19 },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: C.darkBg, minHeight: "100vh", color: "#fff" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet" />

      {/* ── HEADER ── */}
      <div style={{ background: `linear-gradient(135deg, ${C.navy} 0%, ${C.dark} 100%)`, padding: "24px 28px 20px", borderBottom: `1px solid ${C.grayBorder}` }}>
        <div style={{ fontSize: 10, color: C.tealLight, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Module 6</div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>Enabling Environment</div>
        <div style={{ color: C.grayLight, fontSize: 12, marginTop: 4 }}>What it takes to make the sanitation system work</div>
      </div>

      <div style={{ padding: "24px 28px", maxWidth: 920, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ── IMPLEMENTATION PHASING ── */}
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Implementation Phasing</div>
          <div style={{ color: C.grayLight, fontSize: 11, marginBottom: 16 }}>Across settlements of all three LGUs</div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {phases.map(p => (
              <div key={p.name} style={{
                flex: 1, minWidth: 200, background: C.cardBg, borderRadius: 14, padding: "20px 22px",
                borderTop: `3px solid ${p.color}`, position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: `${p.color}10`, border: `1px solid ${p.color}20` }} />
                <div style={{ fontSize: 9, fontWeight: 700, color: p.color, letterSpacing: 1.5, marginBottom: 2 }}>{p.tag}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{p.name} <span style={{ fontWeight: 400, color: C.grayLight, fontSize: 11 }}>({p.period})</span></div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 10 }}>
                  <span style={{ fontSize: 30, fontWeight: 700 }}>${p.cost}M</span>
                  <span style={{ background: `${p.color}25`, color: p.color, fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 10 }}>~{p.pct}%</span>
                </div>
                <div style={{ color: C.grayLight, fontSize: 11, marginTop: 8, lineHeight: 1.5 }}>
                  {p.interventions} interventions · {p.buildings.toLocaleString()} buildings
                </div>
                <div style={{ marginTop: 12, background: C.grayBorder, borderRadius: 6, height: 7, overflow: "hidden" }}>
                  <div style={{ width: `${p.pct}%`, background: `linear-gradient(90deg, ${p.color}, ${p.color}99)`, height: "100%", borderRadius: 6 }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12, background: C.cardBg, borderRadius: 12, padding: "14px 20px", borderLeft: `3px solid ${C.orange}`, display: "flex", alignItems: "center", gap: 16 }}>
            <div>
              <div style={{ color: C.grayLight, fontSize: 11 }}>New Building Applications (2026)</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 2 }}>
                <span style={{ fontSize: 22, fontWeight: 700 }}>1,254</span>
                <span style={{ background: `${C.orange}25`, color: C.orange, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 10 }}>~2%</span>
              </div>
              <div style={{ color: C.gray, fontSize: 10, marginTop: 2 }}>Construction applications with respect to total properties</div>
            </div>
          </div>
        </div>

        {/* ── INTERVENTION MIX + BUILDINGS BY LGU ── */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 300 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Intervention Mix by Phase</div>
            <div style={{ color: C.grayLight, fontSize: 11, marginBottom: 12 }}>Interventions across sanitation value chain</div>
            <div style={{ background: C.cardBg, borderRadius: 12, padding: "16px 12px 10px" }}>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={interventionMix}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grayBorder} />
                  <XAxis dataKey="name" tick={{ fill: "#fff", fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fill: C.grayLight, fontSize: 9 }} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="Toilet" fill={C.orange} stackId="a" />
                  <Bar dataKey="Collection" fill={C.blue} stackId="a" />
                  <Bar dataKey="Network" fill={C.teal} stackId="a" />
                  <Bar dataKey="Treatment" fill={C.green} stackId="a" radius={[4,4,0,0]} />
                  <Legend wrapperStyle={{ fontSize: 9 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 300 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Buildings Covered by Phase</div>
            <div style={{ color: C.grayLight, fontSize: 11, marginBottom: 12 }}>Rollout across Tagbilaran, Dauis, Panglao</div>
            <div style={{ background: C.cardBg, borderRadius: 12, padding: "16px 12px 10px" }}>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={buildingsByPhase}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grayBorder} />
                  <XAxis dataKey="name" tick={{ fill: "#fff", fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fill: C.grayLight, fontSize: 9 }} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => v.toLocaleString()} />
                  <Bar dataKey="Tagbilaran" fill={C.teal} radius={[3,3,0,0]} />
                  <Bar dataKey="Dauis" fill={C.blue} radius={[3,3,0,0]} />
                  <Bar dataKey="Panglao" fill={C.orange} radius={[3,3,0,0]} />
                  <Legend wrapperStyle={{ fontSize: 9 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── CONTAINMENT RISK FOR NEW BUILDING APPLICATIONS ── */}
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Containment Risk Assessment for New Building Applications</div>
          <div style={{ color: C.grayLight, fontSize: 11, marginBottom: 14 }}>Risk identified across ~5,810 new building applications</div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <div style={{ flex: "0 0 220px", background: C.cardBg, borderRadius: 12, padding: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie data={riskData} cx="50%" cy="50%" innerRadius={48} outerRadius={78} dataKey="value" paddingAngle={3} strokeWidth={0}>
                    {riskData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => v.toLocaleString()} />
                  <text x="50%" y="47%" textAnchor="middle" fill="#fff" fontSize={20} fontWeight={700}>5,810</text>
                  <text x="50%" y="58%" textAnchor="middle" fill={C.grayLight} fontSize={9}>applications</text>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, minWidth: 280, display: "flex", flexDirection: "column", gap: 10 }}>
              {riskData.map(r => (
                <div key={r.name} style={{ background: C.cardBg, borderRadius: 10, padding: "12px 16px", borderLeft: `3px solid ${r.color}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{r.name}</span>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span style={{ color: r.color, fontSize: 18, fontWeight: 700 }}>{r.value.toLocaleString()}</span>
                      <span style={{ color: C.gray, fontSize: 10 }}>({(r.value / 5810 * 100).toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div style={{ background: C.grayBorder, borderRadius: 5, height: 8, overflow: "hidden" }}>
                    <div style={{ width: `${(r.value / 5810 * 100)}%`, background: `linear-gradient(90deg, ${r.color}, ${r.color}88)`, height: "100%", borderRadius: 5 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── DIGITAL PERMIT TRACKING ── */}
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Digital Permit Tracking (2026)</div>
          <div style={{ color: C.grayLight, fontSize: 11, marginBottom: 12 }}>Building applications with location and containment risk checks</div>
          <div style={{ background: C.cardBg, borderRadius: 12, padding: "16px 12px 10px" }}>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={permitData}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.grayBorder} />
                <XAxis dataKey="month" tick={{ fill: "#fff", fontSize: 9 }} tickLine={false} />
                <YAxis tick={{ fill: C.grayLight, fontSize: 9 }} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="applied" fill={`${C.blue}88`} name="Applications" radius={[3,3,0,0]} />
                <Line type="monotone" dataKey="approved" name="Approved" stroke={C.green} strokeWidth={2.5} dot={{ r: 3, fill: C.green }} />
                <Legend wrapperStyle={{ fontSize: 9, paddingTop: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", justifyContent: "space-around", padding: "10px 0 4px", borderTop: `1px solid ${C.grayBorder}` }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ color: C.blue, fontSize: 18, fontWeight: 700 }}>347</div>
                <div style={{ color: C.grayLight, fontSize: 9 }}>Total Applications</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ color: C.green, fontSize: 18, fontWeight: 700 }}>283</div>
                <div style={{ color: C.grayLight, fontSize: 9 }}>Approved</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ color: C.accent, fontSize: 18, fontWeight: 700 }}>81.6%</div>
                <div style={{ color: C.grayLight, fontSize: 9 }}>Approval Rate</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── KEY INSIGHTS ── */}
        <div style={{ background: C.cardBg, borderRadius: 12, padding: "16px 20px", borderLeft: `3px solid ${C.green}` }}>
          <div style={{ color: C.green, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Key Insights</div>
          <div style={{ color: C.grayLight, fontSize: 12, lineHeight: 1.8 }}>
            • Phasing plan covers ~19,100 buildings: Phase 1 (8,200), Phase 2 (6,800), Phase 3 (4,100).<br/>
            • Containment risk identified in ~5,810 buildings: flood (2,850), infiltration (1,620), high groundwater (1,340).<br/>
            • Containment database maps ~89% of premises (8,200 residential, 2,300 non-residential).<br/>
            • Digital permit system tracks 347 new building applications with location and containment risk checks.
          </div>
        </div>

      </div>
    </div>
  );
}
