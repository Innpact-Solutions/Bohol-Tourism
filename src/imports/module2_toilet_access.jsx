import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";

const C = {
  navy: "#1B3A4B", teal: "#0D9488", tealLight: "#14B8A6", orange: "#F59E0B",
  blue: "#3B82F6", green: "#10B981", purple: "#8B5CF6", red: "#EF4444",
  dark: "#0F172A", darkCard: "#1E293B", darkBg: "#0B1120", accent: "#FCD34D",
  gray: "#64748B", grayLight: "#94A3B8", grayBorder: "#334155", cardBg: "#162032",
};

const tt = { background: C.darkCard, border: "none", borderRadius: 8, color: "#fff", fontSize: 11 };

export default function Module2() {
  const summary = [
    { label: "High Containment Risk", value: "24,785", pct: "~45%", sub: "Factoring floods, ground water table and ground infiltrations", color: C.red },
    { label: "Limited Containment Risk", value: "19,828", pct: "~36%", sub: "Factoring floods, ground water table and ground infiltrations", color: C.orange },
    { label: "EV – High Containment Risk", value: "2,754", pct: "~5%", sub: "Factoring floods, ground water table and ground infiltrations", color: C.purple },
    { label: "EV – Limited Containment Risk", value: "2,754", pct: "~5%", sub: "Factoring floods, ground water table and ground infiltrations", color: C.blue },
  ];

  const lguData = [
    { name: "Tagbilaran", P1: 220, P2: 310, P3: 420, P4: 510 },
    { name: "Dauis", P1: 90, P2: 140, P3: 180, P4: 210 },
    { name: "Panglao", P1: 80, P2: 120, P3: 160, P4: 190 },
  ];

  const barangayData = [
    { name: "Cogon", lgu: "Tagbilaran", P1: 34, P2: 56, P3: 67, P4: 67 },
    { name: "Dao", lgu: "Tagbilaran", P1: 24, P2: 40, P3: 49, P4: 49 },
    { name: "Dampas", lgu: "Tagbilaran", P1: 22, P2: 37, P3: 45, P4: 45 },
    { name: "Booy", lgu: "Tagbilaran", P1: 21, P2: 36, P3: 43, P4: 43 },
    { name: "Totolan", lgu: "Dauis", P1: 19, P2: 32, P3: 39, P4: 39 },
    { name: "Manga", lgu: "Tagbilaran", P1: 17, P2: 29, P3: 35, P4: 35 },
    { name: "Bool", lgu: "Tagbilaran", P1: 16, P2: 27, P3: 33, P4: 33 },
    { name: "Danao", lgu: "Panglao", P1: 16, P2: 27, P3: 32, P4: 32 },
    { name: "Taloto", lgu: "Tagbilaran", P1: 15, P2: 25, P3: 31, P4: 31 },
    { name: "Mansasa", lgu: "Tagbilaran", P1: 15, P2: 24, P3: 30, P4: 30 },
    { name: "Songculan", lgu: "Dauis", P1: 14, P2: 23, P3: 28, P4: 28 },
    { name: "San Isidro", lgu: "Tagbilaran", P1: 14, P2: 23, P3: 27, P4: 27 },
    { name: "Pob. (Panglao)", lgu: "Panglao", P1: 14, P2: 23, P3: 27, P4: 27 },
    { name: "Tiptip", lgu: "Tagbilaran", P1: 13, P2: 22, P3: 27, P4: 27 },
    { name: "Tabalong", lgu: "Dauis", P1: 13, P2: 22, P3: 26, P4: 26 },
    { name: "Bingag", lgu: "Dauis", P1: 13, P2: 21, P3: 26, P4: 26 },
    { name: "Ubujan", lgu: "Tagbilaran", P1: 13, P2: 21, P3: 26, P4: 26 },
    { name: "Catarman", lgu: "Dauis", P1: 12, P2: 20, P3: 25, P4: 25 },
    { name: "Tawala", lgu: "Panglao", P1: 12, P2: 20, P3: 25, P4: 25 },
    { name: "Tangnan", lgu: "Panglao", P1: 10, P2: 18, P3: 22, P4: 22 },
    { name: "Mayacabac", lgu: "Dauis", P1: 10, P2: 18, P3: 21, P4: 21 },
    { name: "Poblacion II", lgu: "Tagbilaran", P1: 10, P2: 17, P3: 21, P4: 21 },
    { name: "Mariveles", lgu: "Dauis", P1: 9, P2: 15, P3: 19, P4: 19 },
    { name: "Doljo", lgu: "Panglao", P1: 9, P2: 15, P3: 19, P4: 19 },
    { name: "Poblacion I", lgu: "Tagbilaran", P1: 8, P2: 14, P3: 17, P4: 17 },
    { name: "Biking", lgu: "Dauis", P1: 8, P2: 14, P3: 17, P4: 17 },
    { name: "Bil-isan", lgu: "Panglao", P1: 8, P2: 14, P3: 17, P4: 17 },
    { name: "Looc", lgu: "Panglao", P1: 7, P2: 13, P3: 16, P4: 16 },
    { name: "Tinago", lgu: "Dauis", P1: 7, P2: 13, P3: 16, P4: 16 },
    { name: "Bolod", lgu: "Panglao", P1: 6, P2: 10, P3: 13, P4: 13 },
    { name: "Libaong", lgu: "Panglao", P1: 6, P2: 9, P3: 11, P4: 11 },
    { name: "Pob. (Dauis)", lgu: "Dauis", P1: 5, P2: 9, P3: 11, P4: 11 },
    { name: "Dao (Dauis)", lgu: "Dauis", P1: 5, P2: 9, P3: 11, P4: 11 },
    { name: "Cabawan", lgu: "Tagbilaran", P1: 5, P2: 8, P3: 10, P4: 10 },
    { name: "San Isidro (D)", lgu: "Dauis", P1: 4, P2: 7, P3: 9, P4: 9 },
    { name: "Lourdes", lgu: "Panglao", P1: 4, P2: 6, P3: 8, P4: 8 },
  ];

  const selectionParams = [
    { key: "Building Use", value: "Residential" },
    { key: "Bulk Generator", value: "> 3 floors" },
    { key: "Economic Vulnerability", value: "On" },
    { key: "Risk Selections", value: "All three risk" },
    { key: "Priority Level", value: "Priority 2" },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: C.darkBg, minHeight: "100vh", color: "#fff" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <div style={{ background: `linear-gradient(135deg, ${C.navy} 0%, ${C.dark} 100%)`, padding: "24px 28px 20px", borderBottom: `1px solid ${C.grayBorder}` }}>
        <div style={{ fontSize: 10, color: C.tealLight, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Module 2</div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>Toilet Access</div>
        <div style={{ color: C.grayLight, fontSize: 12, marginTop: 4 }}>Understanding Containment Risk and Identifying Priority Beneficiaries</div>
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

        {/* ── PRIORITY BY LGU (stacked bar) ── */}
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Priority Beneficiaries by LGU</div>
          <div style={{ color: C.grayLight, fontSize: 11, marginBottom: 14 }}>Stacked by priority level across all three LGUs</div>
          <div style={{ background: C.cardBg, borderRadius: 12, padding: 16 }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={lguData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={C.grayBorder} />
                <XAxis type="number" tick={{ fill: C.grayLight, fontSize: 9 }} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: "#fff", fontSize: 12 }} tickLine={false} width={90} />
                <Tooltip contentStyle={tt} />
                <Bar dataKey="P1" fill={C.red} name="Priority 1" stackId="a" />
                <Bar dataKey="P2" fill={C.orange} name="Priority 2" stackId="a" />
                <Bar dataKey="P3" fill={C.blue} name="Priority 3" stackId="a" />
                <Bar dataKey="P4" fill={C.purple} name="Priority 4" stackId="a" radius={[0,4,4,0]} />
                <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── PRIORITY BY BARANGAY (scrollable horizontal stacked bar) ── */}
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Priority Beneficiaries by Barangay</div>
          <div style={{ color: C.grayLight, fontSize: 11, marginBottom: 14 }}>All 36 barangays · Scroll to view all</div>
          <div style={{ background: C.cardBg, borderRadius: 12, padding: "16px 8px 8px 8px", maxHeight: 420, overflowY: "auto" }}>
            <ResponsiveContainer width="100%" height={barangayData.length * 26 + 40}>
              <BarChart data={barangayData} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.grayBorder} horizontal={false} />
                <XAxis type="number" tick={{ fill: C.grayLight, fontSize: 8 }} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: "#fff", fontSize: 9 }} tickLine={false} width={100} interval={0} />
                <Tooltip contentStyle={tt} formatter={(v, name) => [v, name]} />
                <Bar dataKey="P1" fill={C.red} name="Priority 1" stackId="a" barSize={14} />
                <Bar dataKey="P2" fill={C.orange} name="Priority 2" stackId="a" barSize={14} />
                <Bar dataKey="P3" fill={C.blue} name="Priority 3" stackId="a" barSize={14} />
                <Bar dataKey="P4" fill={C.purple} name="Priority 4" stackId="a" barSize={14} radius={[0,3,3,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Sticky legend below */}
          <div style={{ display: "flex", gap: 16, justifyContent: "center", padding: "10px 0 0", flexWrap: "wrap" }}>
            {[["Priority 1", C.red], ["Priority 2", C.orange], ["Priority 3", C.blue], ["Priority 4", C.purple]].map(([l, c]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: C.grayLight }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />{l}
              </div>
            ))}
          </div>
        </div>

        {/* ── CURRENT SELECTION PARAMETERS ── */}
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Current Selection Parameters</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {selectionParams.map(sp => (
              <div key={sp.key} style={{
                background: C.cardBg, borderRadius: 10, padding: "10px 16px",
                border: `1px solid ${C.grayBorder}`, display: "flex", alignItems: "center", gap: 10,
              }}>
                <span style={{ color: C.grayLight, fontSize: 11 }}>{sp.key}</span>
                <span style={{ color: C.accent, fontSize: 12, fontWeight: 700, background: `${C.accent}15`, padding: "2px 8px", borderRadius: 6 }}>{sp.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
