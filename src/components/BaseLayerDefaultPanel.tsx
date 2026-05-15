import { useState, useRef, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LayerAreaBreakdown } from './LayerAreaBreakdown';
import { GroundwaterBuildingChart } from './GroundwaterBuildingChart';
import { HeatStressBuildingChart } from './HeatStressBuildingChart';
import { InfiltrationBuildingChart } from './InfiltrationBuildingChart';

// ─── GeoServer WFS live stats ─────────────────────────────────────────────────
const WFS_URL = 'https://geoserver.azure.innpact.ai/geoserver/WorldBank_Bohol/ows';
const WFS_LAYER = 'WorldBank_Bohol:Buildings';

async function wfsCount(cqlFilter?: string): Promise<number> {
  const params = new URLSearchParams({
    service: 'WFS', version: '2.0.0', request: 'GetFeature',
    typeName: WFS_LAYER, resultType: 'hits',
  });
  if (cqlFilter) params.set('CQL_FILTER', cqlFilter);
  try {
    const res = await fetch(`${WFS_URL}?${params.toString()}`);
    const text = await res.text();
    const match = text.match(/numberMatched="(\d+)"/);
    return match ? parseInt(match[1], 10) : 0;
  } catch {
    return 0;
  }
}

interface BuildingStats {
  total: number;
  useTypeCounts: Record<string, number>;
  floorCounts: Record<string, number>;
  areaCounts: Record<string, number>;
  evCounts: Record<string, number>;
  isLoading: boolean;
}

const EMPTY_STATS: BuildingStats = {
  total: 0,
  useTypeCounts: {},
  floorCounts: {},
  areaCounts: {},
  evCounts: {},
  isLoading: false,
};

// ─── Static reference data (fallbacks / structure only) ───────────────────────
const HEIGHT_CLASSES_BASE = [
  { id: 'low_rise',       label: 'Low Rise',       floors: '1–2F', color: '#6EE7B7', sanitation: 'Low demand generator' },
  { id: 'mid_rise',       label: 'Mid Rise',       floors: '3–4F', color: '#FCD34D', sanitation: 'Moderate demand generator' },
  { id: 'high_rise',      label: 'High Rise',      floors: '5–7F', color: '#FB923C', sanitation: 'High demand generator' },
  { id: 'very_high_rise', label: 'Very High Rise', floors: '≥8F',  color: '#F87171', sanitation: 'Bulk wastewater generator' },
];

const AREA_CLASSES_BASE = [
  { id: 'small',      label: 'Small',      range: '<50 m²',        color: '#93C5FD', desc: 'Compact / informal' },
  { id: 'medium',     label: 'Medium',     range: '50–200 m²',     color: '#6EE7B7', desc: 'Typical residential / commercial' },
  { id: 'large',      label: 'Large',      range: '200–1,000 m²',  color: '#FDE68A', desc: 'Mid scale commercial / institutions' },
  { id: 'very_large', label: 'Very Large', range: '>1,000 m²',     color: '#F9A8D4', desc: 'Major facilities' },
];

const USE_CLASSES_BASE = [
  { id: 'residential', label: 'Residential',              color: '#FCD34D' },
  { id: 'commercial',  label: 'Commercial Establishments', color: '#60A5FA' },
  { id: 'education',   label: 'Educational Institutions',  color: '#818CF8' },
  { id: 'government',  label: 'Government & Civic Services', color: '#34D399' },
  { id: 'health',      label: 'Health Facilities',         color: '#F472B6' },
  { id: 'religious',   label: 'Religious Places',          color: '#FBBF24' },
  { id: 'industrial',  label: 'Industrial',                color: '#94A3B8' },
  { id: 'transport',   label: 'Transport & Logistics',     color: '#7C3AED' },
];

const HAZARD_LAYER_NAMES: Record<string, string> = {
  'flood_hazard':    'Urban Flooding',
  'storm_surge':     'Storm Surge',
  'urban_waterlogging': 'Urban Waterlogging',
  'heat_stress_index': 'Heat Stress Index',
  'land_surface_temperature': 'Land Surface Temperature',
  'urban_heat_island': 'Urban Heat Island',
  'wet_bulb_temperature': 'Wet-Bulb Temperature',
  'soil_classification': 'Soil Classification',
  'groundwater_depth': 'Groundwater Depth',
  'geology':         'Geology',
  'sinkhole':        'Sinkhole Risk',
  'groundwater_infiltration_vulnerability': 'Groundwater Infiltration Risk',
  'elevation':       'Elevation Analysis',
  'builtup_density': 'Green Cover',
  'built_up':        'Built-up Density',
  'building_use':    'Building Use Distribution',
  'economic_vulnerability': 'Economic Vulnerability',
  'multihazard_assessment': 'Multi-Hazard Assessment',
};

const C = {
  navy: "#1B3A4B", teal: "#0D9488", tealLight: "#14B8A6", orange: "#F59E0B",
  blue: "#3B82F6", green: "#10B981", purple: "#8B5CF6", red: "#EF4444",
  dark: "#0F172A", darkCard: "#F1F5F9", darkBg: "#ffffff", accent: "#FCD34D",
  gray: "#64748B", grayLight: "#94A3B8", grayBorder: "#E2E8F0", cardBg: "#F8FAFC",
  yellow: "#F59E0B", pink: "#EC4899", cyan: "#06B6D4", indigo: "#6366F1",
};

const tt = { background: C.darkCard, border: "none", borderRadius: 8, color: "#fff", fontSize: 11 };
const tl = { color: '#fff', fontSize: 10 };
const ti = { color: '#fff', fontSize: 10 };

// ─── Reusable sub-components ─────────────────────────────────────────────────

function HBar({ label, pct, color, sub }: { label: string; pct: number; color: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 7 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.grayLight, marginBottom: 3 }}>
        <span>{label}{sub && <span style={{ color: C.gray, fontSize: 9, marginLeft: 5 }}>· {sub}</span>}</span>
        <span style={{ color, fontWeight: 600 }}>{pct}%</span>
      </div>
      <div style={{ background: C.grayBorder, borderRadius: 4, height: 7, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, background: color, height: "100%", borderRadius: 4 }} />
      </div>
    </div>
  );
}

function HoverableBarSegment({ color, width, label, value }: { color: string; width: string; label: string; value: string }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const segmentRef = useRef<HTMLDivElement>(null);
  return (
    <>
      <div ref={segmentRef}
        className="h-full cursor-pointer transition-opacity hover:opacity-80"
        style={{ backgroundColor: color, width }}
        onMouseEnter={(e) => {
          setShowTooltip(true);
          if (segmentRef.current) {
            const rect = segmentRef.current.getBoundingClientRect();
            setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
          }
        }}
        onMouseLeave={() => setShowTooltip(false)}
      />
      {showTooltip && (
        <div className="fixed z-[9999] bg-[#F1F5F9] text-white px-2 py-1.5 rounded shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}>
          <div style={{ fontSize: 9, fontWeight: 500 }}>{label}</div>
          <div style={{ fontSize: 10, fontWeight: 700 }}>{value}</div>
        </div>
      )}
    </>
  );
}

function SectionTitle({ title, subtitle, color = C.red }: { title: string; subtitle?: string; color?: string }) {
  return (
    <div style={{ marginBottom: subtitle ? 12 : 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
        <div style={{ width: 3, height: 16, background: color, borderRadius: 2, flexShrink: 0 }} />
        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{title}</div>
      </div>
      {subtitle && <div style={{ color: C.grayLight, fontSize: 10, paddingLeft: 11 }}>{subtitle}</div>}
    </div>
  );
}

function LayerBanner({ name, color, subtitle }: { name: string; color: string; subtitle: string }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${color}1A 0%, ${C.cardBg} 100%)`,
      borderRadius: 10, padding: "10px 14px", marginBottom: 10,
      border: `1px solid ${color}33`,
      display: "flex", alignItems: "flex-start", gap: 10,
    }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0, marginTop: 5, boxShadow: `0 0 8px ${color}88` }} />
      <div>
        <div style={{ fontSize: 9, color, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 2 }}>Active Layer</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{name}</div>
        <div style={{ fontSize: 10, color: C.grayLight, marginTop: 2 }}>{subtitle}</div>
      </div>
    </div>
  );
}

function CategoryRow({ label, count, pct, color, sub, active = true }: {
  label: string; count: number; pct: number; color: string; sub?: string; active?: boolean;
}) {
  return (
    <div style={{
      background: C.cardBg, borderRadius: 8, padding: "8px 12px",
      borderLeft: `3px solid ${active ? color : C.grayBorder}`,
      opacity: active ? 1 : 0.4, transition: "opacity 0.2s",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
            <div>
              <span style={{ color: "#fff", fontSize: 10, fontWeight: 600 }}>{label}</span>
              {sub && <div style={{ color: C.gray, fontSize: 9 }}>{sub}</div>}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 5, flexShrink: 0 }}>
              <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>{count.toLocaleString()}</span>
              <span style={{ color, fontSize: 9, fontWeight: 600 }}>{pct}%</span>
            </div>
          </div>
          <div style={{ background: C.grayBorder, borderRadius: 3, height: 5, overflow: "hidden" }}>
            <div style={{ width: `${Math.min(pct * 1.2, 100)}%`, background: color, height: "100%", borderRadius: 3 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function InsightBox({ text, color = C.green }: { text: string; color?: string }) {
  return (
    <div style={{ background: C.cardBg, borderRadius: 10, padding: "12px 14px", borderLeft: `3px solid ${color}` }}>
      <div style={{ color, fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Key Insight</div>
      <div style={{ color: C.grayLight, fontSize: 11, lineHeight: 1.8, whiteSpace: "pre-line" }}>{text}</div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function BaseLayerDefaultPanel({
  totalPopulation2024 = 0,
  totalAreaKm2 = 0,
  totalResidentialBuildings = 0,
  activeLayerId = '',
  selectedWardId,
  selectedLguName,
  selectedWardName,
  selectedDonutCategory,
  onDonutCategorySelect,
  activeBuildingCategories = [],
  activeBuildingHeightCategories = [],
  activeBuildingAreaCategories = [],
  isEconomicVulnerabilityActive = false,
}: {
  totalPopulation2024?: number;
  totalAreaKm2?: number;
  totalResidentialBuildings?: number;
  activeLayerId?: string;
  selectedWardId?: string;
  selectedLguName?: string;
  selectedWardName?: string;
  selectedDonutCategory?: string | null;
  onDonutCategorySelect?: (category: string | null) => void;
  activeBuildingCategories?: string[];
  activeBuildingHeightCategories?: string[];
  activeBuildingAreaCategories?: string[];
  isEconomicVulnerabilityActive?: boolean;
}) {
  // ── Live building stats ──────────────────────────────────────────────────
  const [buildingStats, setBuildingStats] = useState<BuildingStats>(EMPTY_STATS);

  // Build CQL admin filter from current LGU / barangay selection
  const buildAdminFilter = useCallback(() => {
    const parts: string[] = [];
    if (selectedWardName && selectedWardName !== 'all') {
      parts.push(`BrgyName='${selectedWardName.replace(/'/g, "''")}'`);
    } else if (selectedLguName && selectedLguName !== 'all') {
      parts.push(`MunName='${selectedLguName.replace(/'/g, "''")}'`);
    }
    return parts.join(' AND ');
  }, [selectedLguName, selectedWardName]);

  const withAdmin = useCallback((f: string) => {
    const admin = buildAdminFilter();
    if (admin && f) return `${f} AND ${admin}`;
    return admin || f || undefined;
  }, [buildAdminFilter]);

  // Fetch live stats whenever admin filter or active building context changes
  const ctx_check = activeBuildingHeightCategories.length > 0 ? 'height'
    : activeBuildingAreaCategories.length > 0 ? 'area'
    : activeBuildingCategories.length > 0 ? 'use'
    : isEconomicVulnerabilityActive ? 'ev'
    : (activeLayerId && HAZARD_LAYER_NAMES[activeLayerId]) ? 'hazard'
    : 'default';

  useEffect(() => {
    setBuildingStats(prev => ({ ...prev, isLoading: true }));

    Promise.all([
      // Total
      wfsCount(withAdmin('')),
      // use_type counts
      wfsCount(withAdmin(`use_type='Residential'`)),
      wfsCount(withAdmin(`use_type='Commercial Establishments'`)),
      wfsCount(withAdmin(`use_type='Educational Institutions'`)),
      wfsCount(withAdmin(`use_type='Government & Civic Services'`)),
      wfsCount(withAdmin(`use_type='Health Facilities'`)),
      wfsCount(withAdmin(`use_type='Religious Places'`)),
      wfsCount(withAdmin(`use_type='Industrial'`)),
      wfsCount(withAdmin(`use_type='Transport & Logistics'`)),
      // floor range counts
      wfsCount(withAdmin(`floors >= 1 AND floors <= 2`)),
      wfsCount(withAdmin(`floors >= 3 AND floors <= 4`)),
      wfsCount(withAdmin(`floors >= 5 AND floors <= 7`)),
      wfsCount(withAdmin(`floors >= 8`)),
      // area range counts
      wfsCount(withAdmin(`area_sqm < 50`)),
      wfsCount(withAdmin(`area_sqm >= 50 AND area_sqm < 200`)),
      wfsCount(withAdmin(`area_sqm >= 200 AND area_sqm < 1000`)),
      wfsCount(withAdmin(`area_sqm >= 1000`)),
      // econ_vuln count — only Economically Vulnerable residential buildings
      wfsCount(withAdmin(`use_type='Residential' AND econ_vuln='Economically Vulnerable'`)),
    ]).then(([total, res, com, edu, gov, hea, rel, ind, tra, lr, mr, hr, vhr, sm, med, lg, xl, evResMid]) => {
      setBuildingStats({
        total,
        useTypeCounts: { residential: res, commercial: com, education: edu, government: gov, health: hea, religious: rel, industrial: ind, transport: tra },
        floorCounts: { low_rise: lr, mid_rise: mr, high_rise: hr, very_high_rise: vhr },
        areaCounts: { small: sm, medium: med, large: lg, very_large: xl },
        evCounts: { economically_vulnerable_residential: evResMid },
        isLoading: false,
      });
    }).catch(() => {
      setBuildingStats(prev => ({ ...prev, isLoading: false }));
    });
  }, [selectedLguName, selectedWardName, withAdmin]);

  // ── Determine active context ────────────────────────────────────────────
  const ctx = ctx_check;

  // ── Build live class arrays from fetched stats ──────────────────────────
  const floorTotal = Object.values(buildingStats.floorCounts).reduce((a, b) => a + b, 0);
  const HEIGHT_CLASSES = HEIGHT_CLASSES_BASE.map(c => {
    const count = buildingStats.floorCounts[c.id] ?? 0;
    const pct = floorTotal > 0 ? Math.round((count / floorTotal) * 100) : 0;
    return { ...c, count, pct };
  });

  const areaTotal = Object.values(buildingStats.areaCounts).reduce((a, b) => a + b, 0);
  const AREA_CLASSES = AREA_CLASSES_BASE.map(c => {
    const count = buildingStats.areaCounts[c.id] ?? 0;
    const pct = areaTotal > 0 ? Math.round((count / areaTotal) * 100) : 0;
    return { ...c, count, pct };
  });

  const useTotal = Object.values(buildingStats.useTypeCounts).reduce((a, b) => a + b, 0);
  const USE_CLASSES = USE_CLASSES_BASE.map(c => {
    const count = buildingStats.useTypeCounts[c.id] ?? 0;
    const pct = useTotal > 0 ? parseFloat(((count / useTotal) * 100).toFixed(1)) : 0;
    return { ...c, count, pct };
  });

  const totalBuildings = buildingStats.total > 0 ? buildingStats.total
    : totalResidentialBuildings > 0 ? totalResidentialBuildings
    : 0;
  const density = totalAreaKm2 > 0 && totalBuildings > 0 ? Math.round(totalBuildings / totalAreaKm2) : 0;
  const structuresLabel = buildingStats.isLoading ? 'Loading…'
    : totalBuildings > 0 ? totalBuildings.toLocaleString()
    : '—';

  // ── Fixed 4 KPI tiles ──────────────────────────────────────────────────────
  const kpis = [
    { label: "Total Population",  value: totalPopulation2024 > 0 ? totalPopulation2024.toLocaleString() : "Loading…", sub: "as of 2024",         color: C.red    },
    { label: "Total Area",        value: totalAreaKm2 > 0 ? `${totalAreaKm2.toFixed(2)} km²` : "Loading…",           sub: "Planning coverage",   color: C.orange },
    { label: "Total Buildings",   value: structuresLabel,                                                              sub: "All building types",  color: C.teal   },
    { label: "Building Density",  value: density > 0 ? `~${density}/km²` : "—",                                      sub: "Avg density",         color: C.blue   },
  ];

  // ── Panel title based on active context ───────────────────────────────────
  const panelTitle =
    ctx === 'height'  ? 'Building Height Analytics' :
    ctx === 'area'    ? 'Building Floor Area Analytics' :
    ctx === 'use'     ? 'Building Use Analytics' :
    ctx === 'ev'      ? 'Economic Vulnerability' :
    ctx === 'hazard'  ? (HAZARD_LAYER_NAMES[activeLayerId] || 'Layer Analysis') :
    'Project Area Overview';

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: C.darkBg, color: "#fff", height: "100%", overflowY: "auto" }}>

      {/* ── HEADER ── */}
      <div style={{ background: `linear-gradient(135deg, ${C.navy} 0%, ${C.dark} 100%)`, padding: "16px 16px 14px", borderBottom: `1px solid ${C.grayBorder}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${C.red}22`, border: `2px solid ${C.red}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>📍</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, color: C.tealLight, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>Analysis Panel</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{panelTitle}</div>
          </div>
          {buildingStats.isLoading && (
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.tealLight, flexShrink: 0, animation: 'pulse 1.2s ease-in-out infinite', opacity: 0.8 }}
              title="Fetching live building stats…" />
          )}
        </div>
        <div style={{ color: C.grayLight, fontSize: 11 }}>
          {selectedLguName && selectedLguName !== 'all' ? selectedLguName : 'Tagbilaran · Dauis · Panglao'}
        </div>
      </div>

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ── FIXED KPI TILES (always shown) ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {kpis.map(o => (
            <div key={o.label} style={{ background: C.cardBg, borderRadius: 10, padding: "10px 12px", borderLeft: `3px solid ${o.color}`, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, right: 0, width: 30, height: 30, background: `${o.color}08`, borderRadius: "0 0 0 30px" }} />
              <div style={{ color: C.grayLight, fontSize: 9, marginBottom: 3, lineHeight: 1.3 }}>{o.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{o.value}</div>
              <div style={{ color: C.gray, fontSize: 9, marginTop: 2 }}>{o.sub}</div>
            </div>
          ))}
        </div>

        {/* ── BUILDING HEIGHT ANALYTICS ── */}
        {ctx === 'height' && (() => {
          return (
            <>
              <LayerBanner name="Building Height Distribution" color="#6EE7B7" subtitle="Sanitation demand proxy by floor count" />
              {/* Donut */}
              <div style={{ background: C.cardBg, borderRadius: 10, padding: "12px 14px", marginBottom: 4 }}>
                <div style={{ color: "#fff", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Floor Count Classes</div>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={HEIGHT_CLASSES} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="count" paddingAngle={2} strokeWidth={0} startAngle={90} endAngle={-270}>
                      {HEIGHT_CLASSES.map((d) => (
                        <Cell key={d.id} fill={d.color}
                          opacity={activeBuildingHeightCategories.length === 0 || activeBuildingHeightCategories.includes(d.id) ? 1 : 0.2} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tt} labelStyle={tl} itemStyle={ti}
                      formatter={(_: any, __: any, p: any) => [p.payload.count.toLocaleString(), p.payload.label]} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px", justifyContent: "center" }}>
                  {HEIGHT_CLASSES.map(c => (
                    <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 4,
                      opacity: activeBuildingHeightCategories.length === 0 || activeBuildingHeightCategories.includes(c.id) ? 1 : 0.3 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: c.color }} />
                      <span style={{ color: C.grayLight, fontSize: 9 }}>{c.label} ({c.floors})</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Per-class bars */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {HEIGHT_CLASSES.map(c => (
                  <CategoryRow key={c.id} label={`${c.label} (${c.floors})`} count={c.count} pct={c.pct}
                    color={c.color} sub={c.sanitation}
                    active={activeBuildingHeightCategories.length === 0 || activeBuildingHeightCategories.includes(c.id)} />
                ))}
              </div>
            </>
          );
        })()}

        {/* ── BUILDING FLOOR AREA ANALYTICS ── */}
        {ctx === 'area' && (() => {
          return (
            <>
              <LayerBanner name="Building Floor Area Distribution" color="#93C5FD" subtitle="GFA-based wastewater generation estimation" />
              {/* Horizontal bar chart */}
              <div style={{ background: C.cardBg, borderRadius: 10, padding: "12px 14px", marginBottom: 4 }}>
                <div style={{ color: "#fff", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Floor Area Classes</div>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={AREA_CLASSES} layout="vertical" barCategoryGap="25%" margin={{ left: 0, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.grayBorder} horizontal={false} />
                    <XAxis type="number" tick={{ fill: C.grayLight, fontSize: 8 }} tickLine={false} axisLine={false}
                      tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                    <YAxis type="category" dataKey="label" tick={{ fill: "#fff", fontSize: 9 }} tickLine={false} axisLine={false} width={72} />
                    <Tooltip contentStyle={tt} labelStyle={tl} itemStyle={ti} formatter={(v: any) => [v.toLocaleString(), 'Buildings']} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {AREA_CLASSES.map((d) => (
                        <Cell key={d.id} fill={d.color}
                          opacity={activeBuildingAreaCategories.length === 0 || activeBuildingAreaCategories.includes(d.id) ? 1 : 0.25} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Per-class breakdown */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {AREA_CLASSES.map(c => (
                  <CategoryRow key={c.id} label={`${c.label} (${c.range})`} count={c.count} pct={c.pct}
                    color={c.color} sub={c.desc}
                    active={activeBuildingAreaCategories.length === 0 || activeBuildingAreaCategories.includes(c.id)} />
                ))}
              </div>
            </>
          );
        })()}

        {/* ── BUILDING USE ANALYTICS ── */}
        {ctx === 'use' && (() => {
          return (
            <>
              <LayerBanner name="Building Use Distribution" color="#FCD34D" subtitle="Land use & occupancy type analysis" />
              {/* Donut */}
              <div style={{ background: C.cardBg, borderRadius: 10, padding: "12px 14px", marginBottom: 4 }}>
                <div style={{ color: "#fff", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Occupancy Distribution</div>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={USE_CLASSES} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="count" paddingAngle={2} strokeWidth={0} startAngle={90} endAngle={-270}>
                      {USE_CLASSES.map((d) => (
                        <Cell key={d.id} fill={d.color}
                          opacity={activeBuildingCategories.length === 0 || activeBuildingCategories.includes(d.id) ? 1 : 0.2} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tt} labelStyle={tl} itemStyle={ti}
                      formatter={(_: any, __: any, p: any) => [p.payload.count.toLocaleString(), p.payload.label]} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px", justifyContent: "center", marginTop: 6 }}>
                  {USE_CLASSES.map(c => (
                    <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 4,
                      opacity: activeBuildingCategories.length === 0 || activeBuildingCategories.includes(c.id) ? 1 : 0.3 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: c.color }} />
                      <span style={{ color: C.grayLight, fontSize: 9 }}>{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Per-category bars */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {USE_CLASSES.map(c => (
                  <CategoryRow key={c.id} label={c.label} count={c.count} pct={c.pct} color={c.color}
                    active={activeBuildingCategories.length === 0 || activeBuildingCategories.includes(c.id)} />
                ))}
              </div>
            </>
          );
        })()}

        {/* ── ECONOMIC VULNERABILITY ANALYTICS ── */}
        {ctx === 'ev' && (() => {
          const evRes = buildingStats.evCounts.economically_vulnerable_residential ?? 0;
          const totalRes = buildingStats.useTypeCounts.residential ?? 0;
          const otherRes = Math.max(totalRes - evRes, 0);
          const pctEv = totalRes > 0 ? parseFloat(((evRes / totalRes) * 100).toFixed(1)) : 0;
          const EV_PIE = [
            { id: 'economically_vulnerable', label: 'Economically Vulnerable', color: '#DC2626', count: evRes },
            { id: 'other_residential',       label: 'Other Residential',       color: '#E5E7EB', count: otherRes },
          ];
          return (
            <>
              <LayerBanner name="Economic Vulnerability Index" color="#F59E0B" subtitle="Economically vulnerable residential buildings — live from layer" />
              {/* Pie chart */}
              <div style={{ background: C.cardBg, borderRadius: 10, padding: "12px 14px", marginBottom: 4 }}>
                <div style={{ color: "#fff", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Economically Vulnerable Residential Buildings</div>
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie data={EV_PIE} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="count" paddingAngle={2} strokeWidth={0} startAngle={90} endAngle={-270}>
                      {EV_PIE.map((d) => (
                        <Cell key={d.id} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tt} labelStyle={tl} itemStyle={ti}
                      formatter={(_: any, __: any, p: any) => [p.payload.count.toLocaleString(), p.payload.label]} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", justifyContent: "center", marginTop: 4 }}>
                  {EV_PIE.map(c => (
                    <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: c.color }} />
                      <span style={{ color: C.grayLight, fontSize: 9 }}>{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Summary card */}
              <div style={{ background: C.cardBg, borderRadius: 10, padding: "12px 14px", borderLeft: `3px solid #DC2626` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#fff", fontSize: 11, fontWeight: 600 }}>Economically Vulnerable Residential</span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ color: "#fff", fontSize: 15, fontWeight: 700 }}>
                      {buildingStats.isLoading ? '…' : evRes.toLocaleString()}
                    </span>
                    {totalRes > 0 && !buildingStats.isLoading && (
                      <span style={{ background: `${C.accent}25`, color: C.accent, fontSize: 9, fontWeight: 600, padding: "1px 6px", borderRadius: 10 }}>
                        {pctEv}%
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ color: C.gray, fontSize: 9, marginTop: 4 }}>
                  out of {buildingStats.isLoading ? '…' : totalRes.toLocaleString()} total residential buildings
                </div>
              </div>
              <div style={{ background: C.cardBg, borderRadius: 10, padding: "12px 14px", borderLeft: `3px solid ${C.orange}` }}>
                <div style={{ color: C.orange, fontSize: 11, fontWeight: 700, marginBottom: 6 }}>What is Economic Vulnerability?</div>
                <div style={{ color: C.grayLight, fontSize: 10, lineHeight: 1.8 }}>
                  Buildings in areas with high poverty incidence or lacking adequate sanitation infrastructure — prioritised for CWIS interventions and subsidised programmes.
                </div>
              </div>
            </>
          );
        })()}

        {/* ── HAZARD / ENVIRONMENTAL LAYER ANALYTICS ── */}
        {ctx === 'hazard' && (() => {
          return (
            <>
              <LayerBanner name={HAZARD_LAYER_NAMES[activeLayerId]} color={C.blue} subtitle="Area distribution by hazard / classification class" />
              <LayerAreaBreakdown
                layerId={activeLayerId}
                layerName={HAZARD_LAYER_NAMES[activeLayerId]}
                selectedWardId={selectedWardId}
                selectedLguName={selectedLguName}
                selectedCategory={selectedDonutCategory}
                onCategorySelect={onDonutCategorySelect}
                darkTheme={true}
              />
              {(activeLayerId === 'heat_stress_index' ||
                activeLayerId === 'land_surface_temperature' ||
                activeLayerId === 'urban_heat_island' ||
                activeLayerId === 'wet_bulb_temperature') && (
                <div style={{ marginTop: 12 }}>
                  {/* Buildings are overlaid only with the final HSI output, so the
                      same card is shown across all 4 heat-stress layers. */}
                  <HeatStressBuildingChart
                    munName={selectedLguName}
                    brgyName={selectedWardName}
                  />
                </div>
              )}
              {activeLayerId === 'groundwater_depth' && (
                <div style={{ marginTop: 12 }}>
                  <GroundwaterBuildingChart
                    munName={selectedLguName}
                    brgyName={selectedWardName}
                  />
                </div>
              )}
              {(activeLayerId === 'groundwater_infiltration_vulnerability' ||
                activeLayerId === 'soil_classification' ||
                activeLayerId === 'geology' ||
                activeLayerId === 'sinkhole') && (
                <div style={{ marginTop: 12 }}>
                  {/* Buildings are overlaid only with the GWI output, so the
                      same card is shown across all 4 Ground Water Infiltration
                      sub-group layers. */}
                  <InfiltrationBuildingChart
                    munName={selectedLguName}
                    brgyName={selectedWardName}
                  />
                </div>
              )}
            </>
          );
        })()}

        {/* ── DEFAULT: no layer active ── */}
        {ctx === 'default' && (
          <>
            {/* LGU snapshot */}
            <div>
              <SectionTitle title="Planning Area" subtitle="3 interconnected LGUs · Bohol Province" color={C.teal} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[
                  { name: "Tagbilaran", barangays: 15, pop: "106k", color: C.teal,   role: "City core"        },
                  { name: "Dauis",      barangays: 12, pop: "53k",  color: C.blue,   role: "Coastal buffer"   },
                  { name: "Panglao",    barangays: 10, pop: "41k",  color: C.orange, role: "Tourism hub"      },
                ].map(lgu => (
                  <div key={lgu.name} style={{ background: C.cardBg, borderRadius: 10, padding: "10px 10px", borderTop: `3px solid ${lgu.color}` }}>
                    <div style={{ color: lgu.color, fontSize: 10, fontWeight: 700 }}>{lgu.name}</div>
                    <div style={{ color: C.gray, fontSize: 9, marginBottom: 6 }}>{lgu.role}</div>
                    <div style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>{lgu.pop}</div>
                    <div style={{ color: C.grayLight, fontSize: 9 }}>population</div>
                    <div style={{ color: C.gray, fontSize: 9, marginTop: 4 }}>{lgu.barangays} barangays</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Geographic context */}
            {(() => {
              const lgu = selectedLguName && selectedLguName !== 'all' ? selectedLguName : null;

              const geoData: Record<string, { subtitle: string; facts: { icon: string; label: string; value: string; sub: string }[] }> = {
                'Tagbilaran City': {
                  subtitle: 'Tagbilaran City · Urban coastal terrain',
                  facts: [
                    { icon: "🌊", label: "Coastline",       value: "~17.9 km", sub: "Cebu Strait frontage"      },
                    { icon: "⛰️", label: "Elevation range",  value: "0–28 m",  sub: "Flat urban coastal plain"  },
                    { icon: "💧", label: "Water table",      value: "1–20 m",  sub: "Very shallow near coast"   },
                    { icon: "🏙️", label: "Urban density",    value: "High",    sub: "Dense core & periurban mix"},
                  ],
                },
                'Dauis': {
                  subtitle: 'Dauis · Coastal & reclaimed areas',
                  facts: [
                    { icon: "🌊", label: "Coastline",       value: "~21.0 km", sub: "Baclayon Bay exposure"      },
                    { icon: "⛰️", label: "Elevation range",  value: "0–35 m",  sub: "Rolling coastal lowland"   },
                    { icon: "💧", label: "Water table",      value: "1–20 m",  sub: "Moderate depth inland"     },
                    { icon: "🦺", label: "Flood risk",       value: "Moderate",sub: "Low-lying reclaimed areas" },
                  ],
                },
                'Panglao': {
                  subtitle: 'Panglao · Karst island terrain',
                  facts: [
                    { icon: "🌊", label: "Coastline",       value: "~32.8 km", sub: "Tourist beaches & coves"   },
                    { icon: "⛰️", label: "Elevation range",  value: "0–52 m",  sub: "Karstic limestone plateau" },
                    { icon: "🏝️", label: "Geology",          value: "Karst",   sub: "Sinkhole / infiltration risk"},
                    { icon: "💧", label: "Water table",      value: "1–20 m",  sub: "Variable — karst dependent"},
                  ],
                },
              };

              const allFacts = [
                { icon: "🌊", label: "Coastline",       value: "~71.7 km", sub: "Storm surge exposure"    },
                { icon: "⛰️", label: "Elevation range",  value: "0–52 m",  sub: "Low-lying coastal plain" },
                { icon: "🏝️", label: "Panglao geology",  value: "Karst",   sub: "Sinkhole / karstic risk" },
                { icon: "💧", label: "Water table",      value: "1–20 m",  sub: "Shallow in coastal areas"},
              ];

              const profile = lgu && geoData[lgu] ? geoData[lgu] : null;
              const subtitle = profile ? profile.subtitle : 'All LGUs · Coastal & topographic factors';
              const facts = profile ? profile.facts : allFacts;

              return (
                <div>
                  <SectionTitle title="Geographic Profile" subtitle={subtitle} color={C.blue} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {facts.map(g => (
                      <div key={g.label} style={{ background: C.cardBg, borderRadius: 10, padding: "10px 12px" }}>
                        <div style={{ fontSize: 16, marginBottom: 4 }}>{g.icon}</div>
                        <div style={{ color: C.grayLight, fontSize: 9 }}>{g.label}</div>
                        <div style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>{g.value}</div>
                        <div style={{ color: C.gray, fontSize: 9 }}>{g.sub}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Prompt card */}
            <div style={{ background: C.cardBg, borderRadius: 10, padding: "14px 16px", textAlign: "center", borderTop: `2px solid ${C.grayBorder}` }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>🗺️</div>
              <div style={{ color: "#fff", fontSize: 11, fontWeight: 600, marginBottom: 4 }}>Select a Layer to Explore</div>
              <div style={{ color: C.grayLight, fontSize: 10, lineHeight: 1.7 }}>
                Turn on a layer from the left panel — building use, height, floor area, economic vulnerability, or any hazard layer — to see detailed analytics here.
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}