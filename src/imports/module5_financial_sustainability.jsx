import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie } from "recharts";

const C = {
  navy: "#1B3A4B", teal: "#0D9488", tealLight: "#14B8A6", orange: "#F59E0B",
  blue: "#3B82F6", green: "#10B981", purple: "#8B5CF6", red: "#EF4444",
  dark: "#0F172A", darkCard: "#1E293B", darkBg: "#0B1120", accent: "#FCD34D",
  gray: "#64748B", grayLight: "#94A3B8", grayBorder: "#334155", cardBg: "#162032",
};

const tt = { background: C.darkCard, border: "none", borderRadius: 8, color: "#fff", fontSize: 11 };

export default function Module5() {
  const summary = [
    { label: "Total CWIS Investment", value: "$20.41M", pct: "100%", sub: "Across all sanitation value chain", color: C.teal },
    { label: "Network Solutions", value: "$17.26M", pct: "84.6%", sub: "Sewer + STPs + DWIF", color: C.orange },
    { label: "Non-Network Solutions", value: "$3.15M", pct: "15.4%", sub: "Toilets + collection & transport", color: C.blue },
    { label: "Avg Cost per Capita", value: "$104", pct: "3 LGUs", sub: "Based on ~197,000 population", color: C.green },
  ];

  // LGU Breakdown
  const lguData = [
    { name: "Tagbilaran", Toilet: 0.95, Collection: 0.20, Treatment: 10.25 },
    { name: "Dauis", Toilet: 0.70, Collection: 0.10, Treatment: 4.38 },
    { name: "Panglao", Toilet: 0.56, Collection: 0.05, Treatment: 3.22 },
  ];

  // Non-Network vs Network (stacked bars)
  const nnVsNw = [
    { name: "Non-Network", "Toilet Access": 2.21, "Collection": 0.35, "FSTP": 3.40 },
    { name: "Network", "Sewer Network": 8.04, "STP": 6.02, "DWIF": 2.00 },
  ];

  // Component breakdown
  const componentData = [
    { name: "Sewer Network", value: 8.04, share: "39.4%", color: C.teal },
    { name: "Treatment (STP)", value: 6.02, share: "29.5%", color: C.green },
    { name: "Treatment (FSTP)", value: 3.40, share: "16.7%", color: C.purple },
    { name: "Toilet Access", value: 2.21, share: "10.8%", color: C.orange },
    { name: "Treatment (DWIF)", value: 2.00, share: "9.8%", color: "#34D399" },
    { name: "Collection", value: 0.35, share: "1.7%", color: C.blue },
  ];

  // Toilet interventions
  const toiletData = [
    { name: "Super.+Contain.+Soak", units: "600 HH", cost: 0.90 },
    { name: "Contain.+Soak Pit", units: "450 HH", cost: 0.54 },
    { name: "Soak Pit Only", units: "300 HH", cost: 0.21 },
    { name: "Public Toilet Upgrade", units: "15 fac.", cost: 0.12 },
    { name: "Community Toilet Up.", units: "12 fac.", cost: 0.11 },
    { name: "New Public Toilets", units: "10 fac.", cost: 0.20 },
    { name: "New Community Toilets", units: "8 fac.", cost: 0.14 },
  ];

  // Collection interventions
  const collectionData = [
    { name: "Fleet 10 KL", units: "2 trucks", perUnit: "80K", cost: 0.160 },
    { name: "Fleet 5 KL", units: "2 trucks", perUnit: "50K", cost: 0.100 },
    { name: "Fleet 2 KL", units: "3 trucks", perUnit: "25K", cost: 0.075 },
    { name: "Add. Pumps", units: "2 pumps", perUnit: "6K", cost: 0.012 },
  ];

  // Treatment interventions
  const treatmentData = [
    { name: "FSTP Upgrade Dauis", cap: "1 MLD", cost: 0.20 },
    { name: "FSTP Tagbilaran", cap: "4.0 MLD", cost: 3.20 },
    { name: "Catch. 1 Network", cap: "12.8 km", cost: 1.70 },
    { name: "STP 1", cap: "0.90 MLD", cost: 1.25 },
    { name: "Catch. 2 Network", cap: "11.5 km", cost: 1.52 },
    { name: "STP 2", cap: "0.80 MLD", cost: 1.11 },
    { name: "Catch. 3 Network", cap: "19.2 km", cost: 2.59 },
    { name: "STP 3", cap: "1.50 MLD", cost: 1.96 },
    { name: "Catch. 4 Network", cap: "16.8 km", cost: 2.23 },
    { name: "STP 4", cap: "1.28 MLD", cost: 1.70 },
    { name: "DWIF 1", cap: "1.8 MLD", cost: 0.75 },
    { name: "DWIF 2", cap: "1.4 MLD", cost: 0.64 },
    { name: "DWIF 3", cap: "1.3 MLD", cost: 0.61 },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: C.darkBg, minHeight: "100vh", color: "#fff" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet" />

      <div style={{ background: `linear-gradient(135deg, ${C.navy} 0%, ${C.dark} 100%)`, padding: "24px 28px 20px", borderBottom: `1px solid ${C.grayBorder}` }}>
        <div style={{ fontSize: 10, color: C.tealLight, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Module 5</div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>Financial Sustainability</div>
        <div style={{ color: C.grayLight, fontSize: 12, marginTop: 4 }}>Understanding of costing across all CWIS interventions</div>
      </div>

      <div style={{ padding: "24px 28px", maxWidth: 940, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ── SUMMARY CARDS ── */}
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Total Investment Summary</div>
          <div style={{ color: C.grayLight, fontSize: 11, marginBottom: 14 }}>All values in USD</div>
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

        {/* ── LGU BREAKDOWN ── */}
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Investment Breakdown by LGU</div>
          <div style={{ color: C.grayLight, fontSize: 11, marginBottom: 14 }}>Toilet, Collection, and Treatment investment per LGU (USD Million)</div>
          <div style={{ background: C.cardBg, borderRadius: 12, padding: 16 }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={lguData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={C.grayBorder} horizontal={false} />
                <XAxis type="number" tick={{ fill: C.grayLight, fontSize: 9 }} tickLine={false} unit="M" />
                <YAxis dataKey="name" type="category" tick={{ fill: "#fff", fontSize: 11 }} tickLine={false} width={80} />
                <Tooltip contentStyle={tt} formatter={(v) => `$${v.toFixed(2)}M`} />
                <Bar dataKey="Toilet" fill={C.orange} name="Toilet" stackId="a" />
                <Bar dataKey="Collection" fill={C.blue} name="Collection" stackId="a" />
                <Bar dataKey="Treatment" fill={C.teal} name="Treatment" stackId="a" radius={[0,4,4,0]} />
                <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── NON-NETWORK vs NETWORK ── */}
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Non-Network vs Network Investment</div>
          <div style={{ color: C.grayLight, fontSize: 11, marginBottom: 14 }}>Non-Network $5.96M (29.2%) · Network $16.06M (78.7%)</div>
          <div style={{ background: C.cardBg, borderRadius: 12, padding: 16 }}>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={nnVsNw} layout="vertical" barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke={C.grayBorder} horizontal={false} />
                <XAxis type="number" tick={{ fill: C.grayLight, fontSize: 9 }} tickLine={false} unit="M" />
                <YAxis dataKey="name" type="category" tick={{ fill: "#fff", fontSize: 11 }} tickLine={false} width={90} />
                <Tooltip contentStyle={tt} formatter={(v) => `$${v.toFixed(2)}M`} />
                <Bar dataKey="Toilet Access" fill={C.orange} stackId="a" />
                <Bar dataKey="Collection" fill={C.blue} stackId="a" />
                <Bar dataKey="FSTP" fill={C.purple} stackId="a" radius={[0,4,4,0]} />
                <Bar dataKey="Sewer Network" fill={C.teal} stackId="a" />
                <Bar dataKey="STP" fill={C.green} stackId="a" />
                <Bar dataKey="DWIF" fill="#34D399" stackId="a" radius={[0,4,4,0]} />
                <Legend wrapperStyle={{ fontSize: 9, paddingTop: 8 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── COMPONENT BREAKDOWN ── */}
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Component Breakdown</div>
          <div style={{ color: C.grayLight, fontSize: 11, marginBottom: 14 }}>All 6 components ranked by investment size</div>
          <div style={{ background: C.cardBg, borderRadius: 12, padding: 16 }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={componentData}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.grayBorder} />
                <XAxis dataKey="name" tick={{ fill: "#fff", fontSize: 8 }} tickLine={false} angle={-15} textAnchor="end" height={45} />
                <YAxis tick={{ fill: C.grayLight, fontSize: 9 }} tickLine={false} unit="M" />
                <Tooltip contentStyle={tt} formatter={(v) => `$${v.toFixed(2)}M`} />
                <Bar dataKey="value" name="USD Million" radius={[4,4,0,0]}>
                  {componentData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── INTERVENTION DETAILS (3 charts) ── */}
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Intervention Investment Details</div>

          {/* Toilet */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: C.orange, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Toilet Access — $2.21M</div>
            <div style={{ background: C.cardBg, borderRadius: 12, padding: "14px 12px" }}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={toiletData} layout="vertical" barCategoryGap="15%">
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grayBorder} horizontal={false} />
                  <XAxis type="number" tick={{ fill: C.grayLight, fontSize: 9 }} tickLine={false} unit="M" />
                  <YAxis dataKey="name" type="category" tick={{ fill: "#fff", fontSize: 8 }} tickLine={false} width={130} interval={0} />
                  <Tooltip contentStyle={tt} formatter={(v) => `$${v.toFixed(2)}M`} />
                  <Bar dataKey="cost" name="Cost (USD M)" fill={C.orange} radius={[0,4,4,0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Collection */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: C.blue, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Collection & Transportation — $0.347M</div>
            <div style={{ background: C.cardBg, borderRadius: 12, padding: "14px 12px" }}>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={collectionData} layout="vertical" barCategoryGap="15%">
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grayBorder} horizontal={false} />
                  <XAxis type="number" tick={{ fill: C.grayLight, fontSize: 9 }} tickLine={false} unit="M" />
                  <YAxis dataKey="name" type="category" tick={{ fill: "#fff", fontSize: 9 }} tickLine={false} width={80} interval={0} />
                  <Tooltip contentStyle={tt} formatter={(v) => `$${v.toFixed(3)}M`} />
                  <Bar dataKey="cost" name="Cost (USD M)" fill={C.blue} radius={[0,4,4,0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Treatment */}
          <div>
            <div style={{ color: C.teal, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Treatment, Disposal & Re-use — $19.46M</div>
            <div style={{ background: C.cardBg, borderRadius: 12, padding: "14px 12px", maxHeight: 380, overflowY: "auto" }}>
              <ResponsiveContainer width="100%" height={treatmentData.length * 26 + 30}>
                <BarChart data={treatmentData} layout="vertical" barCategoryGap="12%">
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grayBorder} horizontal={false} />
                  <XAxis type="number" tick={{ fill: C.grayLight, fontSize: 9 }} tickLine={false} unit="M" />
                  <YAxis dataKey="name" type="category" tick={{ fill: "#fff", fontSize: 8 }} tickLine={false} width={110} interval={0} />
                  <Tooltip contentStyle={tt} formatter={(v) => `$${v.toFixed(2)}M`} />
                  <Bar dataKey="cost" name="Cost (USD M)" radius={[0,4,4,0]} barSize={12}>
                    {treatmentData.map((d, i) => (
                      <Cell key={i} fill={d.name.includes("DWIF") ? "#34D399" : d.name.includes("STP") ? C.green : d.name.includes("Catch") ? C.blue : d.name.includes("FSTP") ? C.purple : C.teal} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── KEY INSIGHTS ── */}
        <div style={{ background: C.cardBg, borderRadius: 12, padding: "16px 20px", borderLeft: `3px solid ${C.green}` }}>
          <div style={{ color: C.green, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Key Insights</div>
          <div style={{ color: C.grayLight, fontSize: 12, lineHeight: 1.8 }}>
            • New STPs and sewer networks drive most of the investment, with STP-3 and the Tagbilaran FSTP being the largest components.<br/>
            • Upgrading the existing Dauis FSTP requires relatively low investment, while still supporting expanded septage treatment capacity.
          </div>
        </div>

      </div>
    </div>
  );
}
