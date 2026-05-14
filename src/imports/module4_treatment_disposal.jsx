import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

const C = {
  navy: "#1B3A4B", teal: "#0D9488", tealLight: "#14B8A6", orange: "#F59E0B",
  blue: "#3B82F6", green: "#10B981", purple: "#8B5CF6", red: "#EF4444",
  dark: "#0F172A", darkCard: "#1E293B", darkBg: "#0B1120", accent: "#FCD34D",
  gray: "#64748B", grayLight: "#94A3B8", grayBorder: "#334155", cardBg: "#162032",
  pink: "#EC4899", cyan: "#06B6D4",
};

const tt = { background: C.darkCard, border: "none", borderRadius: 8, color: "#fff", fontSize: 11 };

export default function Module4() {
  const summary = [
    { label: "FSTP Service Coverage", value: "24,785", pct: "~100%", sub: "All settlement areas catered by emptying services", color: C.green },
    { label: "SFS Service Coverage", value: "19,828", pct: "~36%", sub: "Solid free sewer system network coverage", color: C.teal },
    { label: "DWIF Service Coverage", value: "12,754", pct: "~12%", sub: "Dry weather interceptor flow coverage", color: C.blue },
    { label: "Re-use Volume", value: "2 ML", pct: "~30%", sub: "Re-use of treated volume from STPs", color: C.purple },
  ];

  const fstpData = [
    { name: "Tagbilaran", "FSTP Dauis": 20, "FSTP Tagbilaran": 80 },
    { name: "Dauis", "FSTP Dauis": 100, "FSTP Tagbilaran": 0 },
    { name: "Panglao", "FSTP Dauis": 100, "FSTP Tagbilaran": 0 },
  ];

  const sfsData = [
    { name: "STP 1", Tagbilaran: 10, Dauis: 8, Panglao: 0 },
    { name: "STP 2", Tagbilaran: 15, Dauis: 5, Panglao: 0 },
    { name: "STP 3", Tagbilaran: 0, Dauis: 0, Panglao: 15 },
    { name: "STP 4", Tagbilaran: 0, Dauis: 5, Panglao: 10 },
  ];

  const capacityData = [
    { name: "Panglao TP", capacity: 2.5, s100: 6.5, s125: 4.2, s150: 2.1 },
    { name: "Dauis TP", capacity: 2.0, s100: 5.8, s125: 3.9, s150: 1.8 },
    { name: "Tag. TP-1", capacity: 4.5, s100: 9.5, s125: 6.3, s150: 3.4 },
    { name: "Tag. TP-2", capacity: 3.8, s100: 8.2, s125: 5.7, s150: 2.9 },
  ];

  // DWIF as chart data
  const dwifPopServed = [
    { name: "Tagbilaran", value: 31500, pct: 30 },
    { name: "Panglao", value: 18000, pct: 45 },
    { name: "Dauis", value: 13000, pct: 25 },
  ];
  const dwifFlow = [
    { name: "Tagbilaran", flow: 2.84, capacity: 3.2 },
    { name: "Panglao", flow: 1.62, capacity: 2.4 },
    { name: "Dauis", flow: 1.17, capacity: 1.4 },
  ];

  // Reuse bar data
  const reuseBarData = [
    { name: "Hotels/Resorts", Tagbilaran: 12, Dauis: 18, Panglao: 42 },
    { name: "Parks/Gardens", Tagbilaran: 18, Dauis: 14, Panglao: 10 },
    { name: "Schools", Tagbilaran: 14, Dauis: 10, Panglao: 8 },
    { name: "Health Centres", Tagbilaran: 8, Dauis: 8, Panglao: 6 },
    { name: "Public Offices", Tagbilaran: 12, Dauis: 10, Panglao: 8 },
    { name: "Green Cover", Tagbilaran: 16, Dauis: 22, Panglao: 16 },
    { name: "Industries", Tagbilaran: 20, Dauis: 18, Panglao: 10 },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: C.darkBg, minHeight: "100vh", color: "#fff" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet" />

      <div style={{ background: `linear-gradient(135deg, ${C.navy} 0%, ${C.dark} 100%)`, padding: "24px 28px 20px", borderBottom: `1px solid ${C.grayBorder}` }}>
        <div style={{ fontSize: 10, color: C.tealLight, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Module 4</div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>Treatment, Disposal & Safe Re-use</div>
        <div style={{ color: C.grayLight, fontSize: 12, marginTop: 4 }}>Optimizing Treated Wastewater Discharge to Protect Environment and Public Health</div>
      </div>

      <div style={{ padding: "24px 28px", maxWidth: 940, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ── TREATMENT COVERAGE SUMMARY ── */}
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Treatment Coverage Summary</div>
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

        {/* ── FSTP CATCHMENT ── */}
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>FSTP Treatment Catchment</div>
          <div style={{ color: C.grayLight, fontSize: 11, marginBottom: 14 }}>Distribution of FSTP service by LGU</div>
          <div style={{ background: C.cardBg, borderRadius: 12, padding: 16 }}>
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={fstpData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={C.grayBorder} horizontal={false} />
                <XAxis type="number" tick={{ fill: C.grayLight, fontSize: 9 }} tickLine={false} unit="%" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" tick={{ fill: "#fff", fontSize: 11 }} tickLine={false} width={80} />
                <Tooltip contentStyle={tt} formatter={(v) => `${v}%`} />
                <Bar dataKey="FSTP Dauis" fill={C.blue} name="FSTP Dauis" stackId="a" />
                <Bar dataKey="FSTP Tagbilaran" fill={C.teal} name="FSTP Tagbilaran" stackId="a" radius={[0,4,4,0]} />
                <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── SFS COVERAGE ── */}
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Solid-Free Sewer Service Coverage</div>
          <div style={{ color: C.grayLight, fontSize: 11, marginBottom: 14 }}>Population served (%) by each STP across LGUs</div>
          <div style={{ background: C.cardBg, borderRadius: 12, padding: 16 }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sfsData}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.grayBorder} />
                <XAxis dataKey="name" tick={{ fill: "#fff", fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fill: C.grayLight, fontSize: 9 }} tickLine={false} unit="%" />
                <Tooltip contentStyle={tt} formatter={(v) => `${v}%`} />
                <Bar dataKey="Tagbilaran" fill={C.teal} stackId="a" />
                <Bar dataKey="Dauis" fill={C.blue} stackId="a" />
                <Bar dataKey="Panglao" fill={C.orange} stackId="a" radius={[4,4,0,0]} />
                <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── TREATMENT CAPACITY & NETWORK ── */}
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Treatment Capacity & Network Length</div>
          <div style={{ color: C.grayLight, fontSize: 11, marginBottom: 14 }}>Sewer pipe length by diameter and treatment plant capacity</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 2, minWidth: 320, background: C.cardBg, borderRadius: 12, padding: 16 }}>
              <div style={{ color: "#fff", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Sewer Network Length (km)</div>
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={capacityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grayBorder} />
                  <XAxis dataKey="name" tick={{ fill: "#fff", fontSize: 9 }} tickLine={false} />
                  <YAxis tick={{ fill: C.grayLight, fontSize: 9 }} tickLine={false} unit=" km" />
                  <Tooltip contentStyle={tt} formatter={(v) => `${v} km`} />
                  <Bar dataKey="s100" fill={C.teal} name="100 mm" stackId="a" />
                  <Bar dataKey="s125" fill={C.blue} name="125 mm" stackId="a" />
                  <Bar dataKey="s150" fill={C.orange} name="150 mm" stackId="a" radius={[4,4,0,0]} />
                  <Legend wrapperStyle={{ fontSize: 9 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, minWidth: 200, background: C.cardBg, borderRadius: 12, padding: 16 }}>
              <div style={{ color: "#fff", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Treatment Capacity (MLD)</div>
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={capacityData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grayBorder} horizontal={false} />
                  <XAxis type="number" tick={{ fill: C.grayLight, fontSize: 9 }} tickLine={false} unit=" MLD" />
                  <YAxis dataKey="name" type="category" tick={{ fill: "#fff", fontSize: 8 }} tickLine={false} width={70} />
                  <Tooltip contentStyle={tt} formatter={(v) => `${v} MLD`} />
                  <Bar dataKey="capacity" name="Capacity" radius={[0,4,4,0]}>
                    {capacityData.map((_, i) => <Cell key={i} fill={[C.orange, C.blue, C.teal, C.green][i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── DWIF COVERAGE (graphical) ── */}
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>DWIF Coverage</div>
          <div style={{ color: C.grayLight, fontSize: 11, marginBottom: 14 }}>Dry Weather Interceptor Flow — Total: 5.63 MLD · 62,500 population served · 4 DWIFs</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {/* Population served */}
            <div style={{ flex: 1, minWidth: 280, background: C.cardBg, borderRadius: 12, padding: 16 }}>
              <div style={{ color: "#fff", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Population Served & Coverage %</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={dwifPopServed}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grayBorder} />
                  <XAxis dataKey="name" tick={{ fill: "#fff", fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fill: C.grayLight, fontSize: 9 }} tickLine={false} />
                  <Tooltip contentStyle={tt} formatter={(v, name) => name === "pct" ? `${v}%` : v.toLocaleString()} />
                  <Bar dataKey="value" name="Pop. Served" radius={[4,4,0,0]}>
                    {dwifPopServed.map((_, i) => <Cell key={i} fill={[C.teal, C.orange, C.blue][i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {/* % labels */}
              <div style={{ display: "flex", justifyContent: "space-around", marginTop: 4 }}>
                {dwifPopServed.map((d, i) => (
                  <div key={d.name} style={{ textAlign: "center" }}>
                    <div style={{ color: [C.teal, C.orange, C.blue][i], fontSize: 16, fontWeight: 700 }}>{d.pct}%</div>
                    <div style={{ color: C.grayLight, fontSize: 9 }}>coverage</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Flow vs Capacity */}
            <div style={{ flex: 1, minWidth: 280, background: C.cardBg, borderRadius: 12, padding: 16 }}>
              <div style={{ color: "#fff", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Estimated Flow vs DWIF Capacity (MLD)</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={dwifFlow}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grayBorder} />
                  <XAxis dataKey="name" tick={{ fill: "#fff", fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fill: C.grayLight, fontSize: 9 }} tickLine={false} unit=" MLD" />
                  <Tooltip contentStyle={tt} formatter={(v) => `${v} MLD`} />
                  <Bar dataKey="flow" fill={C.blue} name="Est. Flow" radius={[3,3,0,0]} />
                  <Bar dataKey="capacity" fill={C.green} name="Capacity" radius={[3,3,0,0]} />
                  <Legend wrapperStyle={{ fontSize: 9 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── REUSE DISTRIBUTION (bar only, spaced) ── */}
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Potential Treated Reuse Distribution</div>
          <div style={{ color: C.grayLight, fontSize: 11, marginBottom: 14 }}>Reuse hotspots by application across LGUs — 107 total sites</div>
          <div style={{ background: C.cardBg, borderRadius: 12, padding: 16 }}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={reuseBarData} layout="vertical" barCategoryGap="20%" barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.grayBorder} horizontal={false} />
                <XAxis type="number" tick={{ fill: C.grayLight, fontSize: 9 }} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: "#fff", fontSize: 10 }} tickLine={false} width={100} interval={0} />
                <Tooltip contentStyle={tt} />
                <Bar dataKey="Tagbilaran" fill={C.teal} barSize={7} radius={[0,4,4,0]} />
                <Bar dataKey="Dauis" fill={C.blue} barSize={7} radius={[0,4,4,0]} />
                <Bar dataKey="Panglao" fill={C.orange} barSize={7} radius={[0,4,4,0]} />
                <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── KEY INSIGHTS ── */}
        <div style={{ background: C.cardBg, borderRadius: 12, padding: "16px 20px", borderLeft: `3px solid ${C.green}` }}>
          <div style={{ color: C.green, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Key Insights</div>
          <div style={{ color: C.grayLight, fontSize: 12, lineHeight: 1.8 }}>
            • 4 Dry Weather Interceptor catchments capture wastewater from 12 key outfalls, serving 47,250 residents across 14,190 ha.<br/>
            • Solid Free Sewer system includes 4 STPs with a total treatment capacity of 4,480 m³/day.<br/>
            • 107 treated water reuse hotspots identified, with 1,990 m³/day supply potential vs 2,110 m³/day demand.<br/>
            • Hotels & resorts dominate reuse opportunities (42 sites, ~850 m³/day).
          </div>
        </div>

      </div>
    </div>
  );
}
