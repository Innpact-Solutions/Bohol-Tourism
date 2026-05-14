import React, { useRef, useEffect, useState } from 'react';
import { 
  TrendingUp, AlertTriangle, Info, BarChart3, 
  Target, Users, DollarSign, MapPin, Building2,
  Shield, Truck, Recycle, FileText, Download,
  Home, Factory, Navigation, Coins, CheckCircle,
  ArrowUpRight, ArrowDownRight, Minus, Share2,
  PlusCircle, FileDown, GitCompare, Layers as LayersIcon, Network, Loader2
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList, ComposedChart, Line } from 'recharts';
import type { CWISModule } from './ModuleNavigationTabs';
import type { FstpFacilityState } from './ModulePanel';
import { useFstpBuildingStats, resolveFacilityNm } from '../hooks/useFstpBuildingStats';
import { useFleetStats } from '../hooks/useFleetStats';

// Shared dark tooltip style — ensures light text on dark background across all recharts Tooltip instances
const TOOLTIP_DARK = {
  contentStyle: { background: '#1E293B', border: 'none', borderRadius: 8, color: '#fff', fontSize: 11 },
  labelStyle: { color: '#fff', fontSize: 10 },
  itemStyle: { color: '#fff', fontSize: 10 },
};

// Hoverable Bar Segment Component with Tooltip
function HoverableBarSegment({ color, width, label, value }: { color: string; width: string; label: string; value: string }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const segmentRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = (e: React.MouseEvent) => {
    setShowTooltip(true);
    if (segmentRef.current) {
      const rect = segmentRef.current.getBoundingClientRect();
      setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
    }
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  return (
    <>
      <div
        ref={segmentRef}
        className="h-full cursor-pointer transition-opacity hover:opacity-80"
        style={{ backgroundColor: color, width }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
      {showTooltip && (
        <div
          className="fixed z-[9999] bg-[#1E293B] text-white px-2 py-1.5 rounded shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <div className="text-[9px] font-medium">{label}</div>
          <div className="text-[10px] font-semibold">{value}</div>
        </div>
      )}
    </>
  );
}

interface ModuleAnalyticsPanelProps {
  activeModule: CWISModule;
  selectedLguName: string;
  totalResidentialBuildings?: number;
  totalAreaKm2?: number;
  totalPopulation2024?: number;
  activeFstpLayers?: FstpFacilityState[];
  onZoneClick?: (zone: { cluster_id: number; bbox_minlng: number; bbox_minlat: number; bbox_maxlng: number; bbox_maxlat: number; mun: string; buffer_geom_geojson?: any }) => void;
  scenarioStats?: {
    grid_count: number; area_ha: number;
    network_bldgs: number; onsite_bldgs: number; nonnetwork_bldgs: number; total_bldgs: number;
    by_municipality: Array<{ mun: string; network: number; onsite: number; nonnetwork: number }>;
    buffer_bldgs?: number;
    buffer_area_ha?: number | null;
    density_stop?: number; gwd_stop?: number; gwi_stop?: number; fld_stop?: number;
    zones?: Array<{ cluster_id: number; mun: string; network_bldgs: number; grid_cells: number; area_ha: number; tourism_cells: number; centroid_lng: number; centroid_lat: number; bbox_minlng: number; bbox_minlat: number; bbox_maxlng: number; bbox_maxlat: number; brgy_names: string[]; use_type_pct: Array<{ name: string; pct: number }>; buffer_geom_geojson?: any; buffer_area_ha?: number | null; buffer_bldgs?: number }>;
    zone_breakdown?: {
      network:    { useType: { name: string; value: number }[]; hazard: { name: string; value: number }[] };
      buffer:     { useType: { name: string; value: number }[]; hazard: { name: string; value: number }[] };
      nonNetwork: { useType: { name: string; value: number }[]; hazard: { name: string; value: number }[] };
    } | null;
  } | null;
  isScenarioRunning?: boolean;
}

export function ModuleAnalyticsPanel({ activeModule, selectedLguName, totalResidentialBuildings = 0, totalAreaKm2 = 0, totalPopulation2024 = 0, scenarioStats = null, isScenarioRunning = false, onZoneClick, activeFstpLayers = [] }: ModuleAnalyticsPanelProps) {
  if (!activeModule) return null;

  const moduleConfig = getModuleConfig(activeModule);

  return (
    <div className="h-full flex flex-col bg-[#0B1120]">
      {/* Header with Module Name */}
      <div 
        className="px-4 py-3 border-b border-[#334155]"
        style={{
          background: `linear-gradient(135deg, ${moduleConfig.color}15, ${moduleConfig.color}05)`
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <moduleConfig.icon className="w-5 h-5" style={{ color: moduleConfig.color }} />
          <h2 className="text-sm font-bold text-[#E2E8F0]">{moduleConfig.title}</h2>
        </div>
        {/* Show question for all modules except Module 1 */}
        {activeModule !== 'module1_suitability' && (
          <p className="text-[10px] text-[#94A3B8] font-medium">Towards Improved Service Accessibility and Collection Systems</p>
        )}
        {/* Add subtitle for Module 1 */}
        {activeModule === 'module1_suitability' && (
          <p className="text-[10px] text-[#94A3B8] font-semibold mt-0.5">
            Appropriate Sanitation Systems by Location
          </p>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {activeModule === 'module1_suitability' && <Module1Content totalResidentialBuildings={totalResidentialBuildings} scenarioStats={scenarioStats} isScenarioRunning={isScenarioRunning} onZoneClick={onZoneClick} />}
          {activeModule === 'module2_containment' && <Module2Content />}
          {activeModule === 'module3_collection' && <Module3Content activeFstpLayers={activeFstpLayers} />}
          {activeModule === 'module4_treatment' && <Module4Content />}
          {activeModule === 'module5_financial' && <Module5Content />}
          {activeModule === 'module6_enabling' && <Module6Content />}
        </div>
      </div>
    </div>
  );
}

// Helper to get module configuration
function getModuleConfig(module: CWISModule) {
  const configs = {
    module1_suitability: {
      title: 'Module 1 — System Suitability',
      icon: LayersIcon,
      color: '#3B82F6',
      question: 'Where should we invest in networked infrastructure?'
    },
    module2_containment: {
      title: 'Module 2 — Toilet Access',
      icon: Shield,
      color: '#8B5CF6',
      question: 'Which households require priority support for safe containment?'
    },
    module3_collection: {
      title: 'Module 3 — Collection & Transport',
      icon: Truck,
      color: '#06B6D4',
      question: 'Can we realistically service all premises?'
    },
    module4_treatment: {
      title: 'Module 4 — Treatment, Disposal & Re-use',
      icon: Recycle,
      color: '#10B981',
      question: 'Is treatment infrastructure sufficient and optimally located?'
    },
    module5_financial: {
      title: 'Module 5 — Financial Sustainability',
      icon: DollarSign,
      color: '#F59E0B',
      question: 'What are the comprehensive costs across all CWIS interventions?'
    },
    module6_enabling: {
      title: 'Module 6 — Enabling Environment',
      icon: Users,
      color: '#EF4444',
      question: 'How do we phase implementation and ensure institutional readiness?'
    }
  };
  return configs[module as keyof typeof configs];
}

// KPI Tile Component (matching RightPanel.tsx UI exactly)
interface KPITileProps {
  title: string;
  value: string;
  subtitle: string;
  color: string;
  percentage?: string;
  isDummy?: boolean;
}

function KPITile({ title, value, subtitle, color, percentage, isDummy = false }: KPITileProps) {
  const titleRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const [titleOverflows, setTitleOverflows] = useState(false);
  const [subtitleOverflows, setSubtitleOverflows] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (titleRef.current) {
        setTitleOverflows(titleRef.current.scrollWidth > titleRef.current.clientWidth);
      }
      if (subtitleRef.current) {
        setSubtitleOverflows(subtitleRef.current.scrollWidth > subtitleRef.current.clientWidth);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [title, subtitle]);

  return (
    <div className="relative border border-[#334155] rounded-lg p-3 bg-[#162032] hover:shadow-md transition-all duration-200 group overflow-hidden h-[78px]">
      <div 
        className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl -translate-y-8 translate-x-8 opacity-20 group-hover:opacity-30 transition-opacity duration-500"
        style={{ backgroundColor: color }}
      />
      <div className="relative">
        {/* Line 1: Title - Left Aligned (single line, fixed font) */}
        <div className="text-[10px] text-[#94A3B8] font-medium mb-1.5 overflow-hidden">
          <div 
            ref={titleRef}
            className={`whitespace-nowrap ${titleOverflows ? 'inline-block animate-scroll-text' : ''}`}
          >
            {title}
            {titleOverflows && <span className="inline-block pl-8">{title}</span>}
          </div>
        </div>
        
        {/* Line 2: Value (left) + Percentage (right) - Centered in box */}
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <div 
            className={`font-bold truncate ${isDummy ? 'text-[#E3000F]' : 'text-[#E2E8F0]'}`} 
            style={{ fontSize: '14px', lineHeight: '18px' }}
          >
            {value}
          </div>
          {percentage && (
            <div 
              className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
              style={{ 
                backgroundColor: `${color}15`, 
                color: isDummy ? '#E3000F' : color 
              }}
            >
              {percentage}
            </div>
          )}
        </div>
        
        {/* Line 3: Footer - Left Aligned (single line) */}
        <div className="text-[9px] text-[#94A3B8] leading-tight overflow-hidden">
          <div 
            ref={subtitleRef}
            className={`whitespace-nowrap ${subtitleOverflows ? 'inline-block animate-scroll-text' : ''}`}
          >
            {subtitle}
            {subtitleOverflows && <span className="inline-block pl-8">{subtitle}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// Insight Box Component
function InsightBox({ 
  icon: Icon, 
  message,
  color = '#3B82F6'
}: {
  icon: React.ElementType;
  message: string;
  color?: string;
}) {
  return (
    <div 
      className="border-l-4 rounded-r-lg p-3 shadow-sm"
      style={{ 
        borderLeftColor: color,
        backgroundColor: `${color}08`
      }}
    >
      <div className="flex items-start gap-2">
        <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color }} />
        <p className="text-[11px] text-[#CBD5E1] leading-relaxed font-medium">
          {message}
        </p>
      </div>
    </div>
  );
}

// Action Button Component
function ActionButton({ 
  icon: Icon, 
  label,
  variant = 'primary',
  color = '#3B82F6'
}: {
  icon: React.ElementType;
  label: string;
  variant?: 'primary' | 'secondary';
  color?: string;
}) {
  return (
    <button 
      className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all hover:shadow-md ${
        variant === 'primary' 
          ? 'text-white shadow-sm' 
          : 'bg-[#162032] border border-[#334155] text-[#94A3B8] hover:border-[#475569]'
      }`}
      style={variant === 'primary' ? { backgroundColor: color } : {}}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

// Section Title Component
function SectionTitle({ title }: { title: string }) {
  return (
    <h3 className="text-[11px] font-bold text-[#E2E8F0] mb-2 tracking-wide">
      {title}
    </h3>
  );
}

// Animated integer counter — smoothly transitions from previous value to target
function useAnimatedNumber(target: number, duration = 900): number {
  const [displayed, setDisplayed] = React.useState(target);
  const prevRef = React.useRef(target);
  const rafRef  = React.useRef<number | null>(null);

  React.useEffect(() => {
    const from = prevRef.current;
    const to   = target;
    if (from === to) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setDisplayed(Math.round(from + (to - from) * eased));
      if (t < 1) { rafRef.current = requestAnimationFrame(step); }
      else        { prevRef.current = to; }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return displayed;
}

// Animated bar-chart data — interpolates each cell from previous to target using RAF
type LguRow = { name: string; fullName: string; Network: number; OnSite: number; NonNetwork: number };

function useAnimatedLguData(target: LguRow[], duration = 800): LguRow[] {
  const [displayed, setDisplayed] = React.useState<LguRow[]>(target);
  const prevRef = React.useRef<LguRow[]>(target);
  const rafRef  = React.useRef<number | null>(null);

  React.useEffect(() => {
    const from = prevRef.current;
    const to   = target;
    const same = from.length === to.length && from.every((r, i) =>
      r.Network === to[i]?.Network && r.OnSite === to[i]?.OnSite && r.NonNetwork === to[i]?.NonNetwork
    );
    if (same) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayed(to.map((toRow, i) => {
        const fromRow = from[i] ?? { ...toRow, Network: 0, OnSite: 0, NonNetwork: 0 };
        return {
          ...toRow,
          Network:    Math.round(fromRow.Network    + (toRow.Network    - fromRow.Network)    * eased),
          OnSite:     Math.round(fromRow.OnSite     + (toRow.OnSite     - fromRow.OnSite)     * eased),
          NonNetwork: Math.round(fromRow.NonNetwork + (toRow.NonNetwork - fromRow.NonNetwork) * eased),
        };
      }));
      if (t < 1) { rafRef.current = requestAnimationFrame(step); }
      else        { prevRef.current = to; setDisplayed(to); }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return displayed;
}

// MODULE 1: System Suitability
function Module1Content({
  totalResidentialBuildings = 0,
  scenarioStats: scenarioStatsProp = null,
  isScenarioRunning = false,
  onZoneClick,
}: {
  totalResidentialBuildings?: number;
  isScenarioRunning?: boolean;
  onZoneClick?: (zone: { cluster_id: number; bbox_minlng: number; bbox_minlat: number; bbox_maxlng: number; bbox_maxlat: number; mun: string; buffer_geom_geojson?: any }) => void;
  scenarioStats?: {
    grid_count: number; area_ha: number;
    network_bldgs: number; onsite_bldgs: number; nonnetwork_bldgs: number; total_bldgs: number;
    by_municipality: Array<{ mun: string; network: number; onsite: number; nonnetwork: number }>;
    buffer_bldgs?: number;
    buffer_area_ha?: number | null;
    density_stop?: number; gwd_stop?: number; gwi_stop?: number; fld_stop?: number;
    zones?: Array<{ cluster_id: number; mun: string; network_bldgs: number; grid_cells: number; area_ha: number; tourism_cells: number; centroid_lng: number; centroid_lat: number; bbox_minlng: number; bbox_minlat: number; bbox_maxlng: number; bbox_maxlat: number; brgy_names: string[]; use_type_pct: Array<{ name: string; pct: number }>; buffer_geom_geojson?: any; buffer_area_ha?: number | null; buffer_bldgs?: number }>;
    zone_breakdown?: {
      network:    { useType: { name: string; value: number }[]; hazard: { name: string; value: number }[] };
      buffer:     { useType: { name: string; value: number }[]; hazard: { name: string; value: number }[] };
      nonNetwork: { useType: { name: string; value: number }[]; hazard: { name: string; value: number }[] };
    } | null;
  } | null;
}) {
  const C = {
    navy: "#1B3A4B", teal: "#0D9488", tealLight: "#14B8A6", orange: "#F59E0B",
    blue: "#3B82F6", green: "#10B981", purple: "#8B5CF6", red: "#EF4444",
    dark: "#0F172A", darkCard: "#1E293B", darkBg: "#0B1120", accent: "#FCD34D",
    gray: "#64748B", grayLight: "#94A3B8", grayBorder: "#334155", cardBg: "#162032",
    indigo: "#6366F1", pink: "#EC4899", cyan: "#06B6D4",
  };

  const [activeZoneIdx, setActiveZoneIdx] = useState<number | null>(null);

  // While a scenario is running we "freeze" the right-panel to the previously
  // rendered stats, so the animated counters only move from the old values to
  // the new ones AFTER the "Updating…" overlay disappears.
  const [scenarioStats, setDisplayedStats] = React.useState(scenarioStatsProp);
  React.useEffect(() => {
    if (!isScenarioRunning) {
      setDisplayedStats(scenarioStatsProp);
    }
  }, [isScenarioRunning, scenarioStatsProp]);

  const fmt = (n: number) => n.toLocaleString();
  const pctOf = (n: number, total: number) =>
    total > 0 ? `${Math.round((n / total) * 100)}%` : "—";

  // Derived KPI values
  const hasStats = scenarioStats !== null;
  const total = hasStats ? scenarioStats.total_bldgs : 0;

  // Animated counters — each transitions smoothly when scenarioStats changes
  const animNetwork    = useAnimatedNumber(hasStats ? scenarioStats.network_bldgs    : 0);
  const animNonNetwork = useAnimatedNumber(hasStats ? scenarioStats.nonnetwork_bldgs : 0);
  const animOnsite     = useAnimatedNumber(hasStats ? scenarioStats.onsite_bldgs     : 0);
  const animGrid       = useAnimatedNumber(hasStats ? scenarioStats.grid_count       : 0);
  const animTotal      = useAnimatedNumber(hasStats ? scenarioStats.total_bldgs      : 0);

  const zones = [
    {
      label: "Network",
      value: hasStats ? fmt(animNetwork) : "—",
      pct: hasStats ? pctOf(scenarioStats.network_bldgs, total) : "",
      sub: "Buildings suitable for network connection",
      color: C.tealLight,
      footnote: hasStats && (scenarioStats.buffer_bldgs ?? 0) > 0
        ? `incl. ${fmt(scenarioStats.buffer_bldgs!)} network-region buildings`
        : null,
    },
    {
      label: "Non-Network / Decentralised",
      value: hasStats ? fmt(animNonNetwork) : "—",
      pct: hasStats ? pctOf(scenarioStats.nonnetwork_bldgs, total) : "",
      sub: "Buildings suitable for decentralised systems",
      color: C.orange,
    },
    {
      label: "On-Site Treatment",
      value: hasStats ? fmt(animOnsite) : "—",
      pct: hasStats ? pctOf(scenarioStats.onsite_bldgs, total) : "",
      sub: "Buildings with on-site treatment suitability",
      color: C.purple,
    },
    {
      label: "Suitable Area",
      value: hasStats && scenarioStats!.buffer_area_ha != null
        ? `${scenarioStats!.buffer_area_ha.toFixed(1)} ha`
        : "—",
      pct: "",
      sub: "Total network coverage corridor area",
      color: C.tealLight,
    },
  ];

  // Municipality chart data — memoized so reference only changes when scenarioStats changes
  const lguData = React.useMemo<LguRow[]>(() => {
    if (!scenarioStats) return [];
    return scenarioStats.by_municipality.map(m => {
      const munTotal = m.network + m.onsite + m.nonnetwork;
      return {
        name: m.mun.length > 10 ? m.mun.slice(0, 10) + "…" : m.mun,
        fullName: m.mun,
        Network:    munTotal > 0 ? Math.round((m.network    / munTotal) * 100) : 0,
        OnSite:     munTotal > 0 ? Math.round((m.onsite     / munTotal) * 100) : 0,
        NonNetwork: munTotal > 0 ? Math.round((m.nonnetwork / munTotal) * 100) : 0,
      };
    });
  }, [scenarioStats]);

  // Animated bar data — transitions from previous values to new ones on each scenario run
  const animLguData = useAnimatedLguData(lguData);

  // Key insight — top network municipality
  const topMun = hasStats && scenarioStats.by_municipality.length > 0
    ? scenarioStats.by_municipality.reduce((best, m) => {
        const t = m.network + m.onsite + m.nonnetwork;
        const bT = best.network + best.onsite + best.nonnetwork;
        return t > 0 && m.network / t > (bT > 0 ? best.network / bT : 0) ? m : best;
      }, scenarioStats.by_municipality[0])
    : null;
  const topMunPct = topMun
    ? Math.round((topMun.network / (topMun.network + topMun.onsite + topMun.nonnetwork)) * 100)
    : 0;
  const overallNetPct = hasStats && total > 0
    ? Math.round((scenarioStats.network_bldgs / total) * 100)
    : 0;

  // Live zone breakdown — replace hardcoded arrays when real data is available
  const zd = scenarioStats?.zone_breakdown;

  // Zone profiles tab state — kept for dead-code block below
  const [activeZoneTab, setActiveZoneTab] = useState<0 | 1 | 2>(0);

  const riskColors  = [C.red, C.orange, C.blue, C.green];
  const buildColors = [C.orange, C.purple, C.blue, C.teal, C.indigo];

  const networkRisk  = zd?.network?.hazard   ?? [{ name: "Flood Hazard", value: 30 }, { name: "Shallow GWT", value: 25 }, { name: "High Infiltration", value: 20 }, { name: "Limited Risk", value: 25 }];
  const networkBuild = zd?.network?.useType  ?? [{ name: "Residential", value: 45 }, { name: "Commercial", value: 25 }, { name: "Institutional", value: 20 }, { name: "Other", value: 10 }];
  const nonNetRisk   = zd?.nonNetwork?.hazard  ?? [{ name: "Flood Hazard", value: 35 }, { name: "Shallow GWT", value: 30 }, { name: "High Infiltration", value: 20 }, { name: "Limited Risk", value: 15 }];
  const nonNetBuild  = zd?.nonNetwork?.useType ?? [{ name: "Residential", value: 60 }, { name: "Commercial", value: 20 }, { name: "Institutional", value: 15 }, { name: "Other", value: 5 }];
  const onSiteRisk   = zd?.buffer?.hazard    ?? [{ name: "Flood Hazard", value: 25 }, { name: "Shallow GWT", value: 30 }, { name: "High Infiltration", value: 25 }, { name: "Limited Risk", value: 20 }];
  const onSiteBuild  = zd?.buffer?.useType   ?? [{ name: "Residential", value: 55 }, { name: "Commercial", value: 20 }, { name: "Institutional", value: 15 }, { name: "Other", value: 10 }];

  const NestedDonut = ({ title, color, riskData, buildData, count, pct }: {
    title: string; color: string;
    riskData: { name: string; value: number }[]; buildData: { name: string; value: number }[];
    count: string; pct: string;
  }) => (
    <div style={{ background: C.cardBg, borderRadius: 10, padding: "14px 16px", borderTop: `3px solid ${color}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>{title}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span style={{ color, fontSize: 11, fontWeight: 600 }}>{count}</span>
          {pct && <span style={{ color: C.gray, fontSize: 10 }}>({pct})</span>}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ flexShrink: 0, width: 120 }}>
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie data={riskData} cx="50%" cy="50%" innerRadius={38} outerRadius={52} dataKey="value" paddingAngle={2} strokeWidth={0}>
                {riskData.map((_, i) => <Cell key={i} fill={riskColors[i]} />)}
              </Pie>
              <Pie data={buildData} cx="50%" cy="50%" innerRadius={18} outerRadius={34} dataKey="value" paddingAngle={2} strokeWidth={0}>
                {buildData.map((_, i) => <Cell key={i} fill={buildColors[i]} />)}
              </Pie>
              <Tooltip {...TOOLTIP_DARK} formatter={(v: any) => `${v}%`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, fontSize: 9 }}>
          <div style={{ color: C.tealLight, fontWeight: 600, marginBottom: 3, fontSize: 9 }}>Climate & Env. Risk (outer)</div>
          {riskData.map((d, i) => (
            <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: riskColors[i], flexShrink: 0 }} />
              <span style={{ color: C.grayLight }}>{d.name}</span>
              <span style={{ marginLeft: "auto", color: riskColors[i], fontWeight: 600 }}>{d.value}%</span>
            </div>
          ))}
          <div style={{ color: C.orange, fontWeight: 600, marginBottom: 3, marginTop: 5, fontSize: 9 }}>Building Use (inner)</div>
          {buildData.map((d, i) => (
            <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: buildColors[i], flexShrink: 0 }} />
              <span style={{ color: C.grayLight }}>{d.name}</span>
              <span style={{ marginLeft: "auto", color: buildColors[i], fontWeight: 600 }}>{d.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: C.darkBg, margin: "-16px", color: "#fff", paddingBottom: 24, position: "relative" }}>
      {/* Frozen / updating overlay — shown during a scenario run so the previous
          KPI values stay visible but look temporarily locked. When the run
          finishes, this disappears and the animated counters smoothly move
          from the old values to the new ones. */}
      {isScenarioRunning && hasStats && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 20,
            pointerEvents: "auto",
            cursor: "wait",
            background: "rgba(11,17,32,0.35)",
            backdropFilter: "blur(1px)",
            WebkitBackdropFilter: "blur(1px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(22,32,50,0.92)",
              border: `1px solid ${C.grayBorder}`,
              borderRadius: 999,
              padding: "5px 12px",
              fontSize: 10,
              fontWeight: 600,
              color: C.tealLight,
              boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                border: `2px solid ${C.tealLight}`,
                borderTopColor: "transparent",
                animation: "spin 0.9s linear infinite",
              }}
            />
            Updating scenario…
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      )}
      <div style={{ padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: 20, transition: "filter 200ms, opacity 200ms", filter: isScenarioRunning && hasStats ? "saturate(0.85)" : "none", opacity: isScenarioRunning && hasStats ? 0.85 : 1 }}>

        {/* ── ACTIVE SCENARIO · compact 4-unit scale per driver ── */}
        {(() => {
          const drivers = [
            { key: 'density', label: 'Density',       stop: scenarioStats?.density_stop, labels: ['Low Density','Medium Density','High Density','Very High Density'],     color: C.tealLight },
            { key: 'gwd',     label: 'GW Depth',      stop: scenarioStats?.gwd_stop,     labels: ['GWT > 10 m','GWT 5–10 m','GWT 2–5 m','GWT < 2 m'],                       color: C.blue },
            { key: 'gwi',     label: 'Infiltration',  stop: scenarioStats?.gwi_stop,     labels: ['Low Infiltration','Karst Formation','Karst+Sinkhole','Highly Permeable'], color: C.indigo },
            { key: 'fld',     label: 'Flood',         stop: scenarioStats?.fld_stop,     labels: ['No Flood','Low Flood','Moderate Flood','High Flood'],                    color: C.orange },
          ];
          const anySet = drivers.some(d => typeof d.stop === 'number' && d.stop! > 0);
          if (!anySet) return null;
          return (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Active Scenario</div>
              <div style={{ color: C.grayLight, fontSize: 11, marginBottom: 10 }}>
                Thresholds selected for this run (1–4 on each driver)
              </div>
              <div
                style={{
                  background: C.cardBg,
                  borderRadius: 10,
                  padding: "12px 14px",
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto 1fr",
                  columnGap: 16,
                  rowGap: 10,
                  alignItems: "center",
                }}
              >
                {drivers.map(d => {
                  const stop = d.stop && d.stop >= 1 && d.stop <= 4 ? d.stop : 0;
                  const current = stop > 0 ? d.labels[stop - 1] : 'not set';
                  return (
                    <React.Fragment key={d.key}>
                      <span
                        style={{ color: C.grayLight, fontSize: 10.5, fontWeight: 600, whiteSpace: "nowrap" }}
                        title={current}
                      >
                        {d.label}
                      </span>
                      <div style={{ display: "flex", gap: 3, alignItems: "center" }} title={current}>
                        {[1, 2, 3, 4].map(i => {
                          const active = stop > 0 && i <= stop;
                          const selected = i === stop;
                          return (
                            <div
                              key={i}
                              style={{
                                flex: 1,
                                height: 9,
                                borderRadius: 2,
                                background: active ? d.color : C.grayBorder,
                                opacity: active ? (selected ? 1 : 0.5) : 0.6,
                                boxShadow: selected ? `0 0 0 1px ${d.color}80` : 'none',
                              }}
                            />
                          );
                        })}
                        <span style={{ color: stop > 0 ? d.color : C.gray, fontSize: 10, fontWeight: 700, marginLeft: 6, minWidth: 20, textAlign: "right" }}>
                          {stop > 0 ? `${stop}/4` : '—'}
                        </span>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* ── KEY FINDINGS (was Scenario Results) KPIs — 2 per row ── */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Key Findings</div>
          <div style={{ color: C.grayLight, fontSize: 11, marginBottom: 12 }}>
            {hasStats ? `${fmt(animTotal)} total buildings · click ↻ Run Scenario to refresh` : "Click ↻ Run Scenario in the left panel to load results"}
          </div>

          {!hasStats ? (
            <div style={{
              background: C.cardBg, borderRadius: 10, padding: "20px 16px",
              textAlign: "center", color: C.gray, fontSize: 11,
              border: `1px dashed ${C.grayBorder}`,
            }}>
              <div style={{ fontSize: 20, marginBottom: 8, opacity: 0.4 }}>⚙</div>
              Select scenario parameters and click<br /><span style={{ color: C.tealLight }}>↻ Run Scenario</span> to load results
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {zones.map(z => (
                <div key={z.label} style={{
                  background: C.cardBg, borderRadius: 10, padding: "10px 12px",
                  borderLeft: `3px solid ${z.color}`, position: "relative", overflow: "hidden",
                }}>
                  <div style={{ position: "absolute", top: 0, right: 0, width: 34, height: 34, background: `${z.color}08`, borderRadius: "0 0 0 34px" }} />
                  <div style={{ color: C.grayLight, fontSize: 9, marginBottom: 3, lineHeight: 1.3 }}>{z.label}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 5, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>{z.value}</span>
                    {z.pct && <span style={{ background: `${z.color}25`, color: z.color, fontSize: 9, fontWeight: 600, padding: "1px 6px", borderRadius: 10 }}>{z.pct}</span>}
                  </div>
                  <div style={{ color: C.gray, fontSize: 9, marginTop: 3, lineHeight: 1.3 }}>{z.sub}</div>
                  {'footnote' in z && z.footnote && (
                    <div
                      style={{ color: C.grayLight, fontSize: 9, marginTop: 3, lineHeight: 1.3, fontStyle: 'italic' }}
                      title="Buildings within 120m of the network zone boundary, connectable via short private laterals"
                    >
                      {z.footnote}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── SYSTEM SUITABILITY BY LGU — animated stacked bars ── */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>System Suitability by LGU</div>
          <div style={{ color: C.grayLight, fontSize: 11, marginBottom: 12 }}>
            {hasStats ? "Share of buildings suitable per system type" : "Awaiting scenario results"}
          </div>
          <div style={{ background: C.cardBg, borderRadius: 10, padding: 14 }}>
            {!hasStats || lguData.length === 0 ? (
              <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", color: C.gray, fontSize: 11 }}>
                No municipality data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(160, animLguData.length * 52)}>
                <BarChart data={animLguData} layout="vertical" barGap={2} barCategoryGap="30%" margin={{ left: 6, right: 24, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grayBorder} horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: C.grayLight, fontSize: 9 }} tickLine={false} unit="%" />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#fff", fontSize: 9 }} tickLine={false} width={70} />
                  <Tooltip
                    {...TOOLTIP_DARK}
                    formatter={(v: any, name: string) => [`${v}%`, name]}
                    labelFormatter={(_: any, payload: any[]) => payload?.[0]?.payload?.fullName ?? ""}
                  />
                  <Bar dataKey="Network"    fill={C.tealLight} name="Network"     stackId="a" isAnimationActive={false} radius={[0,0,0,0]}>
                    <LabelList dataKey="Network"    position="insideRight" style={{ fill: "#fff", fontSize: 8 }} formatter={(v: any) => v > 5 ? `${v}%` : ""} />
                  </Bar>
                  <Bar dataKey="OnSite"     fill={C.purple}    name="On-Site"     stackId="a" isAnimationActive={false} radius={[0,0,0,0]}>
                    <LabelList dataKey="OnSite"     position="insideRight" style={{ fill: "#fff", fontSize: 8 }} formatter={(v: any) => v > 5 ? `${v}%` : ""} />
                  </Bar>
                  <Bar dataKey="NonNetwork" fill={C.orange}    name="Non-Network" stackId="a" isAnimationActive={false} radius={[0,3,3,0]}>
                    <LabelList dataKey="NonNetwork" position="insideRight" style={{ fill: "#fff", fontSize: 8 }} formatter={(v: any) => v > 5 ? `${v}%` : ""} />
                  </Bar>
                  <Legend wrapperStyle={{ fontSize: 9, paddingTop: 6, color: C.grayLight }} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── SEWER ZONE CARDS — one per disconnected polygon cluster ── */}
        {(() => {
          // Label maps for the 4 scenario stop parameters
          const DENSITY_LABELS = ['Low Density','Medium Density','High Density','Very High Density'];
          const GWD_LABELS     = ['GWT > 10 m','GWT 5–10 m','GWT 2–5 m','GWT < 2 m'];
          const GWI_LABELS     = ['Low Infiltration','Karst Formation','Karst+Sinkhole','Highly Permeable'];
          const FLD_LABELS     = ['No Flood','Low Flood','Moderate Flood','High Flood'];
          // Estimated wastewater per network building (m³/day)
          const WW_PER_BLDG = (150 * 4.5) / 1000; // 150 L/cap/day × 4.5 persons

          // All active scenario parameter chips
          const ds = scenarioStats?.density_stop ?? 0;
          const gs = scenarioStats?.gwd_stop ?? 0;
          const ws = scenarioStats?.gwi_stop ?? 0;
          const fs = scenarioStats?.fld_stop ?? 0;
          const scenarioChips: string[] = [
            ds > 0 ? DENSITY_LABELS[ds - 1] : null,
            gs > 0 ? GWD_LABELS[gs - 1]     : null,
            ws > 0 ? GWI_LABELS[ws - 1]     : null,
            fs > 0 ? FLD_LABELS[fs - 1]     : null,
          ].filter(Boolean) as string[];

          // Use per-cluster zones if available, fall back to by_municipality grouping
          const clusterZones = hasStats && Array.isArray(scenarioStats!.zones) && scenarioStats!.zones!.length > 0
            ? scenarioStats!.zones!
            : null;

          if (!hasStats) {
            return (
              <div style={{ background: C.cardBg, borderRadius: 10, padding: '16px', border: `1px dashed ${C.grayBorder}`, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: C.gray }}>Run a scenario to see per-zone network summaries</div>
              </div>
            );
          }

          if (!clusterZones || clusterZones.length === 0) {
            return (
              <div style={{ background: C.cardBg, borderRadius: 10, padding: '14px', border: `1px dashed ${C.grayBorder}`, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: C.gray }}>No network zones identified for this scenario</div>
              </div>
            );
          }

          return (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Network Coverage Regions</div>
              <div style={{ color: C.grayLight, fontSize: 11, marginBottom: 10 }}>
                {clusterZones.length} network coverage region{clusterZones.length !== 1 ? 's' : ''} identified
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {clusterZones.map((zone, idx) => {
                  const bufBldgs = (zone as any).buffer_bldgs ?? 0;
                  const wwM3Day = Math.round(bufBldgs * WW_PER_BLDG);
                  const bufAreaHa = (zone as any).buffer_area_ha ?? zone.area_ha;
                  const isActive = activeZoneIdx === idx;
                  return (
                    <div
                      key={zone.cluster_id}
                      onClick={() => {
                        setActiveZoneIdx(idx);
                        if (onZoneClick) onZoneClick(zone);
                      }}
                      style={{
                        background: isActive ? `${C.tealLight}12` : C.cardBg,
                        borderRadius: 10,
                        borderLeft: `3px solid ${isActive ? C.tealLight : C.grayBorder}`,
                        padding: '11px 13px',
                        cursor: 'pointer',
                        transition: 'background 0.15s, border-color 0.15s',
                        outline: isActive ? `1px solid ${C.tealLight}40` : 'none',
                      }}
                    >
                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            background: isActive ? `${C.tealLight}40` : `${C.tealLight}25`, color: C.tealLight,
                            fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 6,
                            flexShrink: 0,
                          }}>Network Zone {idx + 1}</span>
                          <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>{zone.mun}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ color: C.gray, fontSize: 9 }}>{bufAreaHa} ha</span>
                          <span title="Click to zoom on map" style={{ color: isActive ? C.tealLight : C.gray, fontSize: 9 }}>⊕</span>
                        </div>
                      </div>

                      {/* Barangays */}
                      {zone.brgy_names && zone.brgy_names.length > 0 && (
                        <div style={{ marginBottom: 7 }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                            {zone.brgy_names.map(b => (
                              <span key={b} style={{
                                background: '#0B1120', color: C.grayLight,
                                fontSize: 8, padding: '1px 5px', borderRadius: 4,
                                border: `1px solid ${C.grayBorder}`,
                              }}>{b}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Stats row */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5, marginBottom: 8 }}>
                        {[
                          { label: 'Connectable Bldgs', val: fmt(bufBldgs),           color: C.tealLight },
                          { label: 'Wastewater (m³/d)',  val: `~${fmt(wwM3Day)}`,      color: C.cyan },
                          { label: 'Area',                val: `${bufAreaHa} ha`,       color: C.cyan },
                        ].map(s => (
                          <div key={s.label} style={{
                            background: '#0B1120', borderRadius: 7, padding: '6px 8px',
                            textAlign: 'center',
                          }}>
                            <div style={{ color: s.color, fontSize: 12, fontWeight: 700, lineHeight: 1 }}>{s.val}</div>
                            <div style={{ color: C.gray, fontSize: 8, marginTop: 2, lineHeight: 1.2 }}>{s.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Land use breakdown bar */}
                      {zone.use_type_pct && zone.use_type_pct.length > 0 && (() => {
                        const USE_COLORS: Record<string, string> = {
                          Residential:   '#f6e717',
                          Commercial:    '#e40021',
                          Institutional: '#2963ea',
                          Tourism:       '#8B5CF6',
                          Industrial:    '#94A3B8',
                          Other:         '#64748B',
                        };
                        return (
                          <div style={{ marginBottom: 8 }}>
                            <div style={{ color: C.grayLight, fontSize: 8, marginBottom: 4 }}>Land Use Mix</div>
                            {/* Stacked bar */}
                            <div style={{ display: 'flex', borderRadius: 4, overflow: 'hidden', height: 8, marginBottom: 5 }}>
                              {zone.use_type_pct.map(u => (
                                <div key={u.name} title={`${u.name}: ${u.pct}%`} style={{
                                  width: `${u.pct}%`,
                                  background: USE_COLORS[u.name] ?? C.grayBorder,
                                  transition: 'width 0.3s',
                                }} />
                              ))}
                            </div>
                            {/* Legend chips */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 6px' }}>
                              {zone.use_type_pct.map(u => (
                                <div key={u.name} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                  <div style={{ width: 6, height: 6, borderRadius: 2, background: USE_COLORS[u.name] ?? C.grayBorder, flexShrink: 0 }} />
                                  <span style={{ color: C.grayLight, fontSize: 8 }}>{u.name} {u.pct}%</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Scenario criteria chips + tourism */}
                      {(() => {
                        const hasTourism = zone.tourism_cells > 0;
                        if (scenarioChips.length === 0 && !hasTourism) return null;
                        return (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                            {scenarioChips.map(label => (
                              <span key={label} style={{
                                background: '#0B1120', color: C.grayLight,
                                fontSize: 8, padding: '2px 6px', borderRadius: 5,
                                border: `1px solid ${C.grayBorder}`,
                              }}>{label}</span>
                            ))}
                            {hasTourism && (
                              <span style={{
                                background: '#0B1120', color: '#F59E0B',
                                fontSize: 8, padding: '2px 6px', borderRadius: 5,
                                border: `1px solid #F59E0B50`,
                              }}>Tourism Zone</span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {false && (() => {
          type ZoneKey = "network" | "nonnetwork" | "onsite";
          const buildTypeColors = [C.orange, C.purple, C.blue, C.teal, C.indigo];

          const zoneDefs = [
            {
              idx: 0 as const,
              label: "Zone 1 — Network Sewerage",
              shortLabel: "Zone 1",
              color: C.tealLight,
              lguKey: "network" as ZoneKey,
              count: hasStats ? scenarioStats!.network_bldgs : 0,
              buildTypes: zd?.network?.useType ?? [],
              facts: [
                { icon: "⬛", label: "Density",    val: "High urban / peri-urban" },
                { icon: "💧", label: "Groundwater", val: "> 1.5 m depth" },
                { icon: "🌊", label: "Flood risk",  val: "Low – moderate" },
                { icon: "🔧", label: "System",      val: "Centralised sewer + WWTP" },
                { icon: "✓",  label: "Advantage",   val: "Lowest per-HH O&M cost at scale" },
              ],
            },
            {
              idx: 1 as const,
              label: "Zone 2 — Non-Network",
              shortLabel: "Zone 2",
              color: C.orange,
              lguKey: "nonnetwork" as ZoneKey,
              count: hasStats ? scenarioStats!.nonnetwork_bldgs : 0,
              buildTypes: zd?.nonNetwork?.useType ?? [],
              facts: [
                { icon: "⬛", label: "Density",    val: "Medium peri-urban / coastal" },
                { icon: "💧", label: "Groundwater", val: "0.8 – 1.5 m depth" },
                { icon: "🌊", label: "Flood risk",  val: "Moderate – high" },
                { icon: "🔧", label: "System",      val: "Communal / package treatment" },
                { icon: "✓",  label: "Advantage",   val: "30–50% lower capex vs. network" },
              ],
            },
            {
              idx: 2 as const,
              label: "Zone 3 — On-Site",
              shortLabel: "Zone 3",
              color: C.purple,
              lguKey: "onsite" as ZoneKey,
              count: hasStats ? scenarioStats!.onsite_bldgs : 0,
              buildTypes: zd?.buffer?.useType ?? [],
              facts: [
                { icon: "⬛", label: "Density",    val: "Low rural / dispersed" },
                { icon: "💧", label: "Groundwater", val: "Variable / deep" },
                { icon: "🌊", label: "Flood risk",  val: "Low (remote areas)" },
                { icon: "🔧", label: "System",      val: "Septic tank / biodigester" },
                { icon: "✓",  label: "Advantage",   val: "No network investment needed" },
              ],
            },
          ];

          const activeZone = zoneDefs[activeZoneTab];
          const lguList = hasStats
            ? scenarioStats!.by_municipality
                .filter(m => activeZone.lguKey === "network" ? m.network > 0 : activeZone.lguKey === "nonnetwork" ? m.nonnetwork > 0 : m.onsite > 0)
                .sort((a, b) => {
                  const va = activeZone.lguKey === "network" ? a.network : activeZone.lguKey === "nonnetwork" ? a.nonnetwork : a.onsite;
                  const vb = activeZone.lguKey === "network" ? b.network : activeZone.lguKey === "nonnetwork" ? b.nonnetwork : b.onsite;
                  return vb - va;
                })
            : [];

          return (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 10 }}>Sewer Zone Profiles</div>

              {/* Tab row */}
              <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
                {zoneDefs.map(z => {
                  const isActive = activeZoneTab === z.idx;
                  return (
                    <button
                      key={z.idx}
                      onClick={() => setActiveZoneTab(z.idx)}
                      style={{
                        flex: 1, padding: "6px 4px", borderRadius: 8,
                        border: `1.5px solid ${isActive ? z.color : C.grayBorder}`,
                        background: isActive ? `${z.color}20` : C.cardBg,
                        color: isActive ? z.color : C.grayLight,
                        fontSize: 10, fontWeight: isActive ? 700 : 500,
                        cursor: "pointer", transition: "all 0.15s",
                        textAlign: "center", lineHeight: 1.3,
                      }}
                    >
                      {z.shortLabel}
                      {hasStats && (
                        <div style={{ fontSize: 9, color: isActive ? z.color : C.gray, marginTop: 1, fontWeight: 600 }}>
                          {fmt(z.count)} · {pctOf(z.count, total)}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Active tab content */}
              <div style={{ background: C.cardBg, borderRadius: 10, padding: "12px 14px", borderTop: `3px solid ${activeZone.color}` }}>

                {/* Zone label */}
                <div style={{ color: "#fff", fontSize: 12, fontWeight: 700, marginBottom: 10 }}>{activeZone.label}</div>

                {/* Fact rows */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                  {activeZone.facts.map(f => (
                    <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 58, color: C.grayLight, fontSize: 9, fontWeight: 600, flexShrink: 0 }}>{f.label}</div>
                      <div style={{ flex: 1, height: 1, background: C.grayBorder }} />
                      <div style={{ color: f.label === "Advantage" ? activeZone.color : "#fff", fontSize: 10, fontWeight: f.label === "Advantage" ? 600 : 400, textAlign: "right", maxWidth: 160 }}>{f.val}</div>
                    </div>
                  ))}
                </div>

                {/* LGUs */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ color: C.grayLight, fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>LGUs</div>
                  {hasStats ? (
                    lguList.length > 0 ? (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {lguList.map(m => {
                          const v = activeZone.lguKey === "network" ? m.network : activeZone.lguKey === "nonnetwork" ? m.nonnetwork : m.onsite;
                          return (
                            <span key={m.mun} style={{
                              background: `${activeZone.color}18`, color: activeZone.color,
                              fontSize: 9, fontWeight: 600, padding: "2px 8px",
                              borderRadius: 10, border: `1px solid ${activeZone.color}35`,
                            }}>
                              {m.mun} · {fmt(v)}
                            </span>
                          );
                        })}
                      </div>
                    ) : <span style={{ color: C.gray, fontSize: 10 }}>—</span>
                  ) : (
                    <span style={{ color: C.gray, fontSize: 10, fontStyle: "italic" }}>Run scenario to load</span>
                  )}
                </div>

                {/* Building Mix */}
                <div>
                  <div style={{ color: C.grayLight, fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Building Mix</div>
                  {activeZone.buildTypes.length > 0 ? (
                    <>
                      <div style={{ display: "flex", height: 6, borderRadius: 4, overflow: "hidden", marginBottom: 5, gap: 1 }}>
                        {activeZone.buildTypes.map((b, i) => (
                          <div key={b.name} style={{ flex: b.value, background: buildTypeColors[i % buildTypeColors.length] }} title={`${b.name}: ${b.value}%`} />
                        ))}
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "3px 10px" }}>
                        {activeZone.buildTypes.map((b, i) => (
                          <div key={b.name} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                            <div style={{ width: 6, height: 6, borderRadius: 2, background: buildTypeColors[i % buildTypeColors.length], flexShrink: 0 }} />
                            <span style={{ color: C.grayLight, fontSize: 9 }}>{b.name}</span>
                            <span style={{ color: buildTypeColors[i % buildTypeColors.length], fontSize: 9, fontWeight: 700 }}>{b.value}%</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <span style={{ color: C.gray, fontSize: 10, fontStyle: "italic" }}>Run scenario to load</span>
                  )}
                </div>

              </div>
            </div>
          );
        })()}

        {/* ── COVERAGE DISTRIBUTION — 3 nested donuts (only shown when real stats are loaded) ── */}
        {hasStats && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Coverage Distribution</div>
          <div style={{ color: C.grayLight, fontSize: 11, marginBottom: 12 }}>Climate & environmental risk (outer ring) · Building use (inner ring)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <NestedDonut title="Network Coverage"     color={C.tealLight} riskData={networkRisk}  buildData={networkBuild}  count={fmt(animNetwork)}    pct={pctOf(scenarioStats!.network_bldgs,    total)} />
            <NestedDonut title="Non-Network Coverage" color={C.orange}    riskData={nonNetRisk}   buildData={nonNetBuild}   count={fmt(animNonNetwork)} pct={pctOf(scenarioStats!.nonnetwork_bldgs, total)} />
            <NestedDonut title="On-Site Treatment"    color={C.purple}    riskData={onSiteRisk}   buildData={onSiteBuild}   count={fmt(animOnsite)}     pct={pctOf(scenarioStats!.onsite_bldgs,     total)} />
          </div>
        </div>
        )}

        {/* ── KEY INSIGHT ── */}
        <div style={{ background: C.cardBg, borderRadius: 10, padding: "14px 16px", borderLeft: `3px solid ${C.green}` }}>
          <div style={{ color: C.green, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Key Insight</div>
          {!hasStats ? (
            <div style={{ color: C.gray, fontSize: 11, lineHeight: 1.8 }}>
              Run a scenario to see insights based on actual data.
            </div>
          ) : (
            <div style={{ color: C.grayLight, fontSize: 11, lineHeight: 1.8 }}>
              {topMun && (
                <>• <span style={{ color: "#fff" }}>{topMun.mun}</span> shows the highest network suitability at <span style={{ color: C.tealLight }}>{topMunPct}%</span> of its buildings.<br /></>
              )}
              • Overall <span style={{ color: C.tealLight }}>{overallNetPct}%</span> of buildings across the study area are suitable for network sewerage.<br />
              • Network coverage is most suitable in high-density settlements with deep groundwater and low flood risk.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// MODULE 2: Toilet Access
function Module2Content() {
  const C = {
    navy: "#1B3A4B", teal: "#0D9488", tealLight: "#14B8A6", orange: "#F59E0B",
    blue: "#3B82F6", green: "#10B981", purple: "#8B5CF6", red: "#EF4444",
    dark: "#0F172A", darkCard: "#1E293B", darkBg: "#0B1120", accent: "#FCD34D",
    gray: "#64748B", grayLight: "#94A3B8", grayBorder: "#334155", cardBg: "#162032",
  };
  const tt = { background: C.darkCard, border: "none", borderRadius: 8, color: "#fff", fontSize: 11 };

  const summary = [
    { label: "High Containment Risk",        value: "24,785", pct: "~45%", sub: "Factoring floods, ground water table and ground infiltrations", color: C.red    },
    { label: "Limited Containment Risk",      value: "19,828", pct: "~36%", sub: "Factoring floods, ground water table and ground infiltrations", color: C.orange },
    { label: "EV – High Containment Risk",    value: "2,754",  pct: "~5%",  sub: "Factoring floods, ground water table and ground infiltrations", color: C.purple },
    { label: "EV – Limited Containment Risk", value: "2,754",  pct: "~5%",  sub: "Factoring floods, ground water table and ground infiltrations", color: C.blue   },
  ];

  const lguData = [
    { name: "Tagbilaran", P1: 220, P2: 310, P3: 420, P4: 510 },
    { name: "Dauis",      P1:  90, P2: 140, P3: 180, P4: 210 },
    { name: "Panglao",    P1:  80, P2: 120, P3: 160, P4: 190 },
  ];
  const maxLguTotal = Math.max(...lguData.map(d => d.P1 + d.P2 + d.P3 + d.P4));
  const pColors: [string, string][] = [["P1", C.red], ["P2", C.orange], ["P3", C.blue], ["P4", C.purple]];
  const pLabels: Record<string, string> = { P1: "Priority 1", P2: "Priority 2", P3: "Priority 3", P4: "Priority 4" };

  const barangayData = [
    { name: "Cogon",          lgu: "Tagbilaran", P1: 34, P2: 56, P3: 67, P4: 67 },
    { name: "Dao",            lgu: "Tagbilaran", P1: 24, P2: 40, P3: 49, P4: 49 },
    { name: "Dampas",         lgu: "Tagbilaran", P1: 22, P2: 37, P3: 45, P4: 45 },
    { name: "Booy",           lgu: "Tagbilaran", P1: 21, P2: 36, P3: 43, P4: 43 },
    { name: "Totolan",        lgu: "Dauis",      P1: 19, P2: 32, P3: 39, P4: 39 },
    { name: "Manga",          lgu: "Tagbilaran", P1: 17, P2: 29, P3: 35, P4: 35 },
    { name: "Bool",           lgu: "Tagbilaran", P1: 16, P2: 27, P3: 33, P4: 33 },
    { name: "Danao",          lgu: "Panglao",    P1: 16, P2: 27, P3: 32, P4: 32 },
    { name: "Taloto",         lgu: "Tagbilaran", P1: 15, P2: 25, P3: 31, P4: 31 },
    { name: "Mansasa",        lgu: "Tagbilaran", P1: 15, P2: 24, P3: 30, P4: 30 },
    { name: "Songculan",      lgu: "Dauis",      P1: 14, P2: 23, P3: 28, P4: 28 },
    { name: "San Isidro",     lgu: "Tagbilaran", P1: 14, P2: 23, P3: 27, P4: 27 },
    { name: "Pob. (Panglao)", lgu: "Panglao",    P1: 14, P2: 23, P3: 27, P4: 27 },
    { name: "Tiptip",         lgu: "Tagbilaran", P1: 13, P2: 22, P3: 27, P4: 27 },
    { name: "Tabalong",       lgu: "Dauis",      P1: 13, P2: 22, P3: 26, P4: 26 },
    { name: "Bingag",         lgu: "Dauis",      P1: 13, P2: 21, P3: 26, P4: 26 },
    { name: "Ubujan",         lgu: "Tagbilaran", P1: 13, P2: 21, P3: 26, P4: 26 },
    { name: "Catarman",       lgu: "Dauis",      P1: 12, P2: 20, P3: 25, P4: 25 },
    { name: "Tawala",         lgu: "Panglao",    P1: 12, P2: 20, P3: 25, P4: 25 },
    { name: "Tangnan",        lgu: "Panglao",    P1: 10, P2: 18, P3: 22, P4: 22 },
    { name: "Mayacabac",      lgu: "Dauis",      P1: 10, P2: 18, P3: 21, P4: 21 },
    { name: "Poblacion II",   lgu: "Tagbilaran", P1: 10, P2: 17, P3: 21, P4: 21 },
    { name: "Mariveles",      lgu: "Dauis",      P1:  9, P2: 15, P3: 19, P4: 19 },
    { name: "Doljo",          lgu: "Panglao",    P1:  9, P2: 15, P3: 19, P4: 19 },
    { name: "Poblacion I",    lgu: "Tagbilaran", P1:  8, P2: 14, P3: 17, P4: 17 },
    { name: "Biking",         lgu: "Dauis",      P1:  8, P2: 14, P3: 17, P4: 17 },
    { name: "Bil-isan",       lgu: "Panglao",    P1:  8, P2: 14, P3: 17, P4: 17 },
    { name: "Looc",           lgu: "Panglao",    P1:  7, P2: 13, P3: 16, P4: 16 },
    { name: "Tinago",         lgu: "Dauis",      P1:  7, P2: 13, P3: 16, P4: 16 },
    { name: "Bolod",          lgu: "Panglao",    P1:  6, P2: 10, P3: 13, P4: 13 },
    { name: "Libaong",        lgu: "Panglao",    P1:  6, P2:  9, P3: 11, P4: 11 },
    { name: "Pob. (Dauis)",   lgu: "Dauis",      P1:  5, P2:  9, P3: 11, P4: 11 },
    { name: "Dao (Dauis)",    lgu: "Dauis",      P1:  5, P2:  9, P3: 11, P4: 11 },
    { name: "Cabawan",        lgu: "Tagbilaran", P1:  5, P2:  8, P3: 10, P4: 10 },
    { name: "San Isidro (D)", lgu: "Dauis",      P1:  4, P2:  7, P3:  9, P4:  9 },
    { name: "Lourdes",        lgu: "Panglao",    P1:  4, P2:  6, P3:  8, P4:  8 },
  ];
  const maxBarangayP4 = Math.max(...barangayData.map(d => d.P4));

  const selectionParams = [
    { key: "Building Use",           value: "Residential"    },
    { key: "Bulk Generator",         value: "> 3 floors"     },
    { key: "Economic Vulnerability", value: "On"             },
    { key: "Risk Selections",        value: "All three risk" },
    { key: "Priority Level",         value: "Priority 2"     },
  ];

  const sectionTitle = (text: string, sub?: string) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{text}</div>
      {sub && <div style={{ color: C.grayLight, fontSize: 11, marginTop: 3 }}>{sub}</div>}
    </div>
  );
  const chartCard = (children: React.ReactNode) => (
    <div style={{ background: C.cardBg, borderRadius: 10, padding: 14 }}>{children}</div>
  );

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: C.darkBg, margin: "-16px", color: "#fff", paddingBottom: 24 }}>
      <div style={{ padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ── CONTAINMENT RISK KPIs — 2 per row ── */}
        <div>
          {sectionTitle("Accessibility Summary", "Across settlements of all three LGUs")}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {summary.map(s => (
              <div key={s.label} style={{
                background: C.cardBg, borderRadius: 10, padding: "10px 12px",
                borderLeft: `3px solid ${s.color}`, position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: 0, right: 0, width: 34, height: 34, background: `${s.color}08`, borderRadius: "0 0 0 34px" }} />
                <div style={{ color: C.grayLight, fontSize: 9, marginBottom: 3, lineHeight: 1.3 }}>{s.label}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 5, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{s.value}</span>
                  <span style={{ background: `${s.color}25`, color: s.color, fontSize: 9, fontWeight: 600, padding: "1px 6px", borderRadius: 10 }}>{s.pct}</span>
                </div>
                <div style={{ color: C.gray, fontSize: 9, marginTop: 3, lineHeight: 1.3 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── PRIORITY BY LGU — CSS horizontal stacked bars ── */}
        <div>
          {sectionTitle("Priority Beneficiaries by LGU", "Stacked by priority level across all three LGUs")}
          {chartCard(
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {lguData.map(d => {
                  const total = d.P1 + d.P2 + d.P3 + d.P4;
                  const relWidth = (total / maxLguTotal) * 100;
                  return (
                    <div key={d.name}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ color: "#fff", fontSize: 11, fontWeight: 600 }}>{d.name}</span>
                        <span style={{ color: C.grayLight, fontSize: 10 }}>{total.toLocaleString()} households</span>
                      </div>
                      <div style={{ width: "100%", height: 22, background: "#1B3A4B", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ width: `${relWidth}%`, height: "100%", display: "flex" }}>
                          {pColors.map(([key, color]) => {
                            const val = (d as any)[key] as number;
                            return (
                              <HoverableBarSegment key={key} color={color} width={`${(val / total) * 100}%`} label={pLabels[key]} value={`${val}`} />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 14, marginTop: 10, justifyContent: "center", flexWrap: "wrap" }}>
                {pColors.map(([key, color]) => (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
                    <span style={{ color: C.grayLight, fontSize: 10 }}>{pLabels[key]}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── PRIORITY BY BARANGAY — scrollable CSS rows ── */}
        <div>
          {sectionTitle("Priority Beneficiaries by Barangay", "All 36 barangays · Scroll to view all")}
          {chartCard(
            <>
              <div style={{ maxHeight: 400, overflowY: "auto", display: "flex", flexDirection: "column", gap: 7, paddingRight: 4 }}>
                {barangayData.map(d => {
                  const total = d.P1 + d.P2 + d.P3 + d.P4;
                  const relWidth = (d.P4 / maxBarangayP4) * 100;
                  const lguColor = d.lgu === "Tagbilaran" ? C.teal : d.lgu === "Dauis" ? C.blue : C.orange;
                  return (
                    <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 90, flexShrink: 0 }}>
                        <div style={{ color: "#fff", fontSize: 10, lineHeight: 1.2 }}>{d.name}</div>
                        <div style={{ color: lguColor, fontSize: 8 }}>{d.lgu}</div>
                      </div>
                      <div style={{ flex: 1, height: 16, background: "#1B3A4B", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: `${relWidth}%`, height: "100%", display: "flex" }}>
                          {pColors.map(([key, color]) => {
                            const val = (d as any)[key] as number;
                            return (
                              <HoverableBarSegment key={key} color={color} width={`${(val / total) * 100}%`} label={pLabels[key]} value={`${val}`} />
                            );
                          })}
                        </div>
                      </div>
                      <span style={{ color: C.grayLight, fontSize: 9, width: 20, textAlign: "right", flexShrink: 0 }}>{d.P4}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 14, marginTop: 10, justifyContent: "center", flexWrap: "wrap", borderTop: `1px solid ${C.grayBorder}`, paddingTop: 10 }}>
                {pColors.map(([key, color]) => (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
                    <span style={{ color: C.grayLight, fontSize: 10 }}>{pLabels[key]}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── CURRENT SELECTION PARAMETERS ── */}
        <div>
          {sectionTitle("Current Selection Parameters")}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {selectionParams.map(sp => (
              <div key={sp.key} style={{
                background: C.cardBg, borderRadius: 10, padding: "8px 14px",
                border: `1px solid ${C.grayBorder}`, display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{ color: C.grayLight, fontSize: 10 }}>{sp.key}</span>
                <span style={{ color: C.accent, fontSize: 11, fontWeight: 700, background: `${C.accent}15`, padding: "1px 7px", borderRadius: 6 }}>{sp.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── KEY INSIGHT ── */}
        <div style={{ background: C.cardBg, borderRadius: 10, padding: "14px 16px", borderLeft: `3px solid ${C.purple}` }}>
          <div style={{ color: C.purple, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Key Insight</div>
          <div style={{ color: C.grayLight, fontSize: 11, lineHeight: 1.8 }}>
            • 24,785 buildings (~45%) face high containment risk from combined flood, groundwater and infiltration exposure.<br />
            • Cogon, Dao, and Dampas in Tagbilaran have the highest priority beneficiary counts across all four priority levels.<br />
            • EV households (5% each) require targeted support alongside standard containment improvement interventions.
          </div>
        </div>

      </div>
    </div>
  );
}

// MODULE 3: Collection & Transport — live data from fleet-stats + fstp-building-stats APIs
function Module3Content({ activeFstpLayers }: { activeFstpLayers: FstpFacilityState[] }) {
  const C = {
    navy: "#1B3A4B", teal: "#0D9488", tealLight: "#14B8A6", orange: "#F59E0B",
    blue: "#3B82F6", green: "#10B981", purple: "#8B5CF6", red: "#EF4444",
    dark: "#0F172A", darkCard: "#1E293B", darkBg: "#0B1120", accent: "#FCD34D",
    gray: "#64748B", grayLight: "#94A3B8", grayBorder: "#334155", cardBg: "#162032",
    cyan: "#06B6D4",
  };

  const CLASS_COLORS: Record<string, string> = {
    "10 KL Truck": "#22C55E",
    "5 KL Truck": "#3B82F6",
    "With Booster Pump": "#F59E0B",
    "Hard to Access": "#EF4444",
  };
  const CLASS_ORDER = ["10 KL Truck", "5 KL Truck", "With Booster Pump", "Hard to Access"];

  const tt = { background: C.darkCard, border: "none", borderRadius: 8, color: "#fff", fontSize: 11 };

  // Live data hooks
  const { data: fleetData, loading: fleetLoading, error: fleetError } = useFleetStats();
  const { data: fstpData, loading: fstpLoading } = useFstpBuildingStats(activeFstpLayers);

  // Loading state
  if (fleetLoading) {
    return (
      <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: C.darkBg, margin: "-16px", color: "#fff", paddingBottom: 24 }}>
        <div style={{ padding: "24px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <Loader2 size={22} style={{ color: C.teal, animation: "spin 1s linear infinite" }} />
          <div style={{ color: C.grayLight, fontSize: 11 }}>Loading fleet accessibility data…</div>
        </div>
      </div>
    );
  }

  if (fleetError || !fleetData) {
    return (
      <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: C.darkBg, margin: "-16px", color: "#fff", paddingBottom: 24 }}>
        <div style={{ padding: "16px", background: "#451a1a", borderRadius: 8, margin: 16, borderLeft: `3px solid ${C.red}` }}>
          <div style={{ color: C.red, fontSize: 11, fontWeight: 600, marginBottom: 4 }}>Failed to load data</div>
          <div style={{ color: C.grayLight, fontSize: 10 }}>{fleetError ?? 'No data'}</div>
        </div>
      </div>
    );
  }

  // Derive KPI values from live fleet data
  const accessible = fleetData.by_class.filter(c => c.dslg_class === '10 KL Truck' || c.dslg_class === '5 KL Truck')
    .reduce((s, c) => s + c.count, 0);
  const accessiblePct = fleetData.total_buildings > 0 ? ((accessible / fleetData.total_buildings) * 100).toFixed(1) : '0';
  const hardToAccess = fleetData.by_class.find(c => c.dslg_class === 'Hard to Access')?.count ?? 0;
  const hardPct = fleetData.total_buildings > 0 ? ((hardToAccess / fleetData.total_buildings) * 100).toFixed(1) : '0';
  const boosterPump = fleetData.by_class.find(c => c.dslg_class === 'With Booster Pump')?.count ?? 0;
  const boosterPct = fleetData.total_buildings > 0 ? ((boosterPump / fleetData.total_buildings) * 100).toFixed(1) : '0';

  const summary = [
    { label: "Truck Accessible", value: accessible.toLocaleString(), pct: `${accessiblePct}%`, sub: "Serviceable by 10 KL or 5 KL desludging trucks", color: C.green },
    { label: "Hard to Access", value: hardToAccess.toLocaleString(), pct: `${hardPct}%`, sub: "Beyond truck and pipe reach", color: C.red },
    { label: "Booster Pump Required", value: boosterPump.toLocaleString(), pct: `${boosterPct}%`, sub: "Extended pipe, additional equipment needed", color: C.orange },
    { label: "Total Classified", value: fleetData.classified.toLocaleString(), pct: `${fleetData.total_buildings > 0 ? ((fleetData.classified / fleetData.total_buildings) * 100).toFixed(1) : 0}%`, sub: `Out of ${fleetData.total_buildings.toLocaleString()} total buildings`, color: C.blue },
  ];

  // Fleet accessibility chart: stacked bar per class showing municipality breakdown
  const fleetChartData = CLASS_ORDER.map(cls => {
    const classTotal = fleetData.by_class.find(c => c.dslg_class === cls)?.count ?? 0;
    return { name: cls.replace('With Booster Pump', 'Booster Pump'), count: classTotal, pct: fleetData.classified > 0 ? Math.round((classTotal / fleetData.classified) * 100) : 0 };
  });

  // Municipality chart data for fleet
  const munChartData = fleetData.by_municipality.slice(0, 8).map(m => ({
    name: m.mun_name.replace('City of ', '').replace('Municipality of ', ''),
    ...CLASS_ORDER.reduce((acc, cls) => ({ ...acc, [cls]: m.classes[cls] ?? 0 }), {} as Record<string, number>),
    total: m.total,
  }));

  // FSTP travel data (from existing hook, if available)
  const BAND_ORDER = ["< 10 min", "10 - 20 min", "20 - 30 min", "> 30 min"];
  const BAND_COLORS: Record<string, string> = { "< 10 min": "#16A34A", "10 - 20 min": "#FACC15", "20 - 30 min": "#F97316", "> 30 min": "#DC2626" };
  const hasFstpData = fstpData && fstpData.covered > 0;
  const fstpMunData = hasFstpData ? fstpData.by_municipality.slice(0, 8).map(m => ({
    name: m.mun.replace('City of ', '').replace('Municipality of ', ''),
    ...BAND_ORDER.reduce((acc, b) => ({ ...acc, [b]: m.band_counts[b] ?? 0 }), {} as Record<string, number>),
    total: m.total,
  })) : [];

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: C.darkBg, margin: "-16px", color: "#fff", paddingBottom: 24 }}>
      <div style={{ padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ── ACCESSIBILITY SUMMARY ── */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 3 }}>Accessibility Summary</div>
          <div style={{ color: C.grayLight, fontSize: 10, marginBottom: 10 }}>Fleet accessibility classification across all buildings</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {summary.map(s => (
              <div key={s.label} style={{
                background: C.cardBg, borderRadius: 10, padding: "12px 14px",
                borderLeft: `3px solid ${s.color}`, position: "relative", overflow: "hidden",
              }}>
                <div style={{ color: C.grayLight, fontSize: 9, marginBottom: 3 }}>{s.label}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontSize: 18, fontWeight: 700 }}>{s.value}</span>
                  <span style={{ background: `${s.color}25`, color: s.color, fontSize: 9, fontWeight: 600, padding: "1px 6px", borderRadius: 8 }}>{s.pct}</span>
                </div>
                <div style={{ color: C.gray, fontSize: 9, marginTop: 3, lineHeight: 1.4 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FLEET ACCESSIBILITY BREAKDOWN ── */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 3 }}>Fleet Accessibility Breakdown</div>
          <div style={{ color: C.grayLight, fontSize: 10, marginBottom: 10 }}>Building count by vehicle access class</div>
          <div style={{ background: C.cardBg, borderRadius: 10, padding: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {fleetChartData.map(d => (
                <div key={d.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: CLASS_COLORS[CLASS_ORDER.find(c => d.name === c || d.name === c.replace('With Booster Pump', 'Booster Pump')) ?? ''] ?? C.gray, flexShrink: 0 }} />
                      <span style={{ color: "#fff", fontSize: 11 }}>{d.name}</span>
                    </div>
                    <span style={{ color: C.grayLight, fontSize: 11 }}>{d.count.toLocaleString()} <span style={{ fontSize: 9, color: C.gray }}>({d.pct}%)</span></span>
                  </div>
                  <div style={{ width: "100%", height: 5, background: "#1e3a4a", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${d.pct}%`, height: "100%", background: CLASS_COLORS[CLASS_ORDER.find(c => d.name === c || d.name === c.replace('With Booster Pump', 'Booster Pump')) ?? ''] ?? C.gray, borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── BY MUNICIPALITY ── */}
        {munChartData.length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 3 }}>Accessibility by Municipality</div>
            <div style={{ color: C.grayLight, fontSize: 10, marginBottom: 10 }}>Building classification per LGU</div>
            <div style={{ background: C.cardBg, borderRadius: 10, padding: 14 }}>
              <ResponsiveContainer width="100%" height={Math.max(160, munChartData.length * 35)}>
                <BarChart data={munChartData} layout="vertical" barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grayBorder} horizontal={false} />
                  <XAxis type="number" tick={{ fill: C.grayLight, fontSize: 9 }} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={72} tick={{ fill: "#fff", fontSize: 9 }} tickLine={false} />
                  <Tooltip contentStyle={tt} formatter={(v: any, name: string) => [v.toLocaleString(), name]} />
                  {CLASS_ORDER.map(cls => (
                    <Bar key={cls} dataKey={cls} stackId="a" fill={CLASS_COLORS[cls]} />
                  ))}
                  <Legend wrapperStyle={{ fontSize: 9, paddingTop: 6 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── FSTP SETTLEMENT PROXIMITY (live when FSTP enabled) ── */}
        {hasFstpData && fstpMunData.length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 3 }}>Settlement Proximity to FSTP</div>
            <div style={{ color: C.grayLight, fontSize: 10, marginBottom: 10 }}>Buildings within FSTP service bands per municipality</div>
            <div style={{ background: C.cardBg, borderRadius: 10, padding: 14 }}>
              <ResponsiveContainer width="100%" height={Math.max(160, fstpMunData.length * 35)}>
                <BarChart data={fstpMunData} layout="vertical" barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grayBorder} horizontal={false} />
                  <XAxis type="number" tick={{ fill: C.grayLight, fontSize: 9 }} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={72} tick={{ fill: "#fff", fontSize: 9 }} tickLine={false} />
                  <Tooltip contentStyle={tt} formatter={(v: any, name: string) => [v.toLocaleString(), name]} />
                  {BAND_ORDER.map(b => (
                    <Bar key={b} dataKey={b} stackId="a" fill={BAND_COLORS[b]} />
                  ))}
                  <Legend wrapperStyle={{ fontSize: 9, paddingTop: 6 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── FSTP COVERAGE (live when FSTP enabled) ── */}
        {hasFstpData && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 3 }}>FSTP Service Coverage</div>
            <div style={{ color: C.grayLight, fontSize: 10, marginBottom: 10 }}>{fstpData!.covered.toLocaleString()} of {fstpData!.total_buildings.toLocaleString()} buildings within service area</div>
            <div style={{ background: C.cardBg, borderRadius: 10, padding: "10px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ color: C.grayLight, fontSize: 10 }}>Coverage</span>
                <span style={{ color: fstpData!.coverage_pct >= 70 ? C.green : fstpData!.coverage_pct >= 40 ? C.orange : C.red, fontSize: 11, fontWeight: 700 }}>{fstpData!.coverage_pct.toFixed(1)}%</span>
              </div>
              <div style={{ width: "100%", height: 8, background: "#1e3a4a", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${Math.min(fstpData!.coverage_pct, 100)}%`, height: "100%", background: fstpData!.coverage_pct >= 70 ? C.green : fstpData!.coverage_pct >= 40 ? C.orange : C.red, borderRadius: 4, transition: "width 0.5s ease" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
                {fstpData!.by_band.map(b => (
                  <div key={b.band} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: b.color, flexShrink: 0 }} />
                    <span style={{ color: "#fff", fontSize: 10, flex: 1 }}>{b.band}</span>
                    <span style={{ color: C.grayLight, fontSize: 10, fontWeight: 600 }}>{b.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── DESLUDGING SCENARIOS (placeholder) ── */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 3 }}>Potential Scheduled Desludging Scenarios</div>
          <div style={{ color: C.grayLight, fontSize: 10, marginBottom: 10 }}>Selection based on building use, bulk generator profile, and climate risk</div>
          <div style={{ background: C.cardBg, borderRadius: 10, padding: "14px 14px 6px" }}>
            {[
              { name: "Building Use", segments: [
                { pct: 50, label: "Tourism", color: C.purple },
                { pct: 30, label: "Commercial", color: C.blue },
                { pct: 10, label: "Residential", color: C.teal },
                { pct: 10, label: "Institutional", color: C.green },
              ]},
              { name: "Bulk Generator", segments: [
                { pct: 40, label: ">3 Floors", color: "#F97316" },
                { pct: 30, label: ">4 Floors", color: "#FB923C" },
                { pct: 20, label: ">5 Floors", color: "#FDBA74" },
                { pct: 10, label: ">6 Floors", color: "#FED7AA" },
              ]},
              { name: "Climate & Env.", segments: [
                { pct: 38, label: "Flood", color: C.red },
                { pct: 29, label: "High GWT", color: C.blue },
                { pct: 33, label: "Infiltration", color: C.orange },
              ]},
            ].map(d => (
              <div key={d.name} style={{ marginBottom: 14 }}>
                <div style={{ color: "#fff", fontSize: 11, fontWeight: 600, marginBottom: 6 }}>{d.name}</div>
                <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", height: 24 }}>
                  {d.segments.map((seg, i) => (
                    <div key={i} style={{
                      width: `${seg.pct}%`, background: seg.color, height: "100%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 8, fontWeight: 700, color: "#fff",
                      borderRight: i < d.segments.length - 1 ? `1px solid ${C.darkBg}` : "none",
                    }}>
                      {seg.pct >= 15 ? `${seg.pct}%` : ""}
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                  {d.segments.map((seg, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <div style={{ width: 7, height: 7, borderRadius: 2, background: seg.color }} />
                      <span style={{ color: C.grayLight, fontSize: 9 }}>{seg.label}</span>
                      <span style={{ color: seg.color, fontSize: 9, fontWeight: 600 }}>{seg.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ color: C.gray, fontSize: 9, fontStyle: "italic", marginTop: 4, marginBottom: 4, borderTop: `1px solid ${C.grayBorder}`, paddingTop: 8 }}>
              Placeholder — will be populated when cross-analysis model is available
            </div>
          </div>
        </div>

        {/* ── KEY INSIGHT ── */}
        <div style={{ background: C.cardBg, borderRadius: 10, padding: "12px 14px", borderLeft: `3px solid ${C.green}` }}>
          <div style={{ color: C.green, fontSize: 11, fontWeight: 700, marginBottom: 4 }}>Key Insight</div>
          <div style={{ color: C.grayLight, fontSize: 11, lineHeight: 1.6 }}>
            {accessible > 0 && fleetData.total_buildings > 0
              ? `${accessiblePct}% of buildings (${accessible.toLocaleString()}) are directly accessible by desludging trucks. ${hardToAccess.toLocaleString()} buildings (${hardPct}%) remain hard to access and require alternative collection strategies.`
              : 'Fleet accessibility data is being processed.'}
            {hasFstpData && ` FSTP service coverage reaches ${fstpData!.coverage_pct.toFixed(1)}% of buildings within active service bands.`}
          </div>
        </div>

      </div>
    </div>
  );
}

// MODULE 4: Treatment, Disposal & Re-use
function Module4Content() {
  const C = {
    navy: "#1B3A4B", teal: "#0D9488", tealLight: "#14B8A6", orange: "#F59E0B",
    blue: "#3B82F6", green: "#10B981", purple: "#8B5CF6", red: "#EF4444",
    dark: "#0F172A", darkCard: "#1E293B", darkBg: "#0B1120", accent: "#FCD34D",
    gray: "#64748B", grayLight: "#94A3B8", grayBorder: "#334155", cardBg: "#162032",
  };
  const tt = { background: C.darkCard, border: "none", borderRadius: 8, color: "#fff", fontSize: 11 };

  const summary = [
    { label: "FSTP Service Coverage", value: "24,785", pct: "~100%", sub: "All settlement areas catered by emptying services", color: C.green  },
    { label: "SFS Service Coverage",  value: "19,828", pct: "~36%",  sub: "Solid free sewer system network coverage",          color: C.teal   },
    { label: "DWIF Service Coverage", value: "12,754", pct: "~12%",  sub: "Dry weather interceptor flow coverage",              color: C.blue   },
    { label: "Re-use Volume",         value: "2 ML",   pct: "~30%",  sub: "Re-use of treated volume from STPs",                color: C.purple },
  ];
  const fstpRows = [
    { name: "Tagbilaran", dauis: 20,  tagb: 80  },
    { name: "Dauis",      dauis: 100, tagb: 0   },
    { name: "Panglao",    dauis: 100, tagb: 0   },
  ];
  const sfsData = [
    { name: "STP 1", Tagbilaran: 10, Dauis: 8,  Panglao: 0  },
    { name: "STP 2", Tagbilaran: 15, Dauis: 5,  Panglao: 0  },
    { name: "STP 3", Tagbilaran: 0,  Dauis: 0,  Panglao: 15 },
    { name: "STP 4", Tagbilaran: 0,  Dauis: 5,  Panglao: 10 },
  ];
  const capacityData = [
    { name: "Panglao TP", s100: 6.5, s125: 4.2, s150: 2.1, capacity: 2.5, capColor: C.orange },
    { name: "Dauis TP",   s100: 5.8, s125: 3.9, s150: 1.8, capacity: 2.0, capColor: C.blue   },
    { name: "Tag. TP-1",  s100: 9.5, s125: 6.3, s150: 3.4, capacity: 4.5, capColor: C.teal   },
    { name: "Tag. TP-2",  s100: 8.2, s125: 5.7, s150: 2.9, capacity: 3.8, capColor: C.green  },
  ];
  const dwifPopServed = [
    { name: "Tagbilaran", value: 31500, pct: 30, color: C.teal   },
    { name: "Panglao",    value: 18000, pct: 45, color: C.orange },
    { name: "Dauis",      value: 13000, pct: 25, color: C.blue   },
  ];
  const dwifFlow = [
    { name: "Tagbilaran", flow: 2.84, capacity: 3.2 },
    { name: "Panglao",    flow: 1.62, capacity: 2.4 },
    { name: "Dauis",      flow: 1.17, capacity: 1.4 },
  ];
  const reuseBarData = [
    { name: "Hotels/Resorts",  Tagbilaran: 12, Dauis: 18, Panglao: 42 },
    { name: "Parks/Gardens",   Tagbilaran: 18, Dauis: 14, Panglao: 10 },
    { name: "Schools",         Tagbilaran: 14, Dauis: 10, Panglao: 8  },
    { name: "Health Centres",  Tagbilaran: 8,  Dauis: 8,  Panglao: 6  },
    { name: "Public Offices",  Tagbilaran: 12, Dauis: 10, Panglao: 8  },
    { name: "Green Cover",     Tagbilaran: 16, Dauis: 22, Panglao: 16 },
    { name: "Industries",      Tagbilaran: 20, Dauis: 18, Panglao: 10 },
  ];

  const sectionTitle = (text: string, sub?: string) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{text}</div>
      {sub && <div style={{ color: C.grayLight, fontSize: 11, marginTop: 3 }}>{sub}</div>}
    </div>
  );
  const chartCard = (children: React.ReactNode, title?: string) => (
    <div style={{ background: C.cardBg, borderRadius: 10, padding: 14 }}>
      {title && <div style={{ color: "#fff", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>{title}</div>}
      {children}
    </div>
  );

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: C.darkBg, margin: "-16px", color: "#fff", paddingBottom: 24 }}>
      <div style={{ padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ── TREATMENT COVERAGE SUMMARY ── */}
        <div>
          {sectionTitle("Treatment Coverage Summary", "Across settlements of all three LGUs")}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {summary.map(s => (
              <div key={s.label} style={{
                background: C.cardBg, borderRadius: 10, padding: "10px 12px",
                borderLeft: `3px solid ${s.color}`, position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: 0, right: 0, width: 34, height: 34, background: `${s.color}08`, borderRadius: "0 0 0 34px" }} />
                <div style={{ color: C.grayLight, fontSize: 9, marginBottom: 3 }}>{s.label}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 5, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{s.value}</span>
                  <span style={{ background: `${s.color}25`, color: s.color, fontSize: 9, fontWeight: 600, padding: "1px 6px", borderRadius: 10 }}>{s.pct}</span>
                </div>
                <div style={{ color: C.gray, fontSize: 9, marginTop: 3, lineHeight: 1.3 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FSTP CATCHMENT — CSS stacked horizontal bars ── */}
        <div>
          {sectionTitle("FSTP Treatment Catchment", "Distribution of FSTP service by LGU")}
          {chartCard(
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {fstpRows.map(d => (
                  <div key={d.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ color: "#fff", fontSize: 11, fontWeight: 600 }}>{d.name}</span>
                      <span style={{ color: C.grayLight, fontSize: 10 }}>100%</span>
                    </div>
                    <div style={{ width: "100%", height: 22, background: "#1B3A4B", borderRadius: 4, overflow: "hidden", display: "flex" }}>
                      {d.dauis > 0 && <HoverableBarSegment color={C.blue} width={`${d.dauis}%`} label="FSTP Dauis"       value={`${d.dauis}%`} />}
                      {d.tagb  > 0 && <HoverableBarSegment color={C.teal} width={`${d.tagb}%`}  label="FSTP Tagbilaran" value={`${d.tagb}%`}  />}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 14, marginTop: 10, justifyContent: "center" }}>
                {([["FSTP Dauis", C.blue], ["FSTP Tagbilaran", C.teal]] as [string,string][]).map(([n, c]) => (
                  <div key={n} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
                    <span style={{ color: C.grayLight, fontSize: 10 }}>{n}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── SFS COVERAGE — vertical grouped bars ── */}
        <div>
          {sectionTitle("Solid-Free Sewer Service Coverage", "Population served (%) by each STP across LGUs")}
          {chartCard(
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={sfsData} barGap={2} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke={C.grayBorder} />
                <XAxis dataKey="name" tick={{ fill: "#fff", fontSize: 10 }} tickLine={false} />
                <YAxis tick={{ fill: C.grayLight, fontSize: 9 }} tickLine={false} unit="%" />
                <Tooltip {...TOOLTIP_DARK} formatter={(v: any) => `${v}%`} />
                <Bar dataKey="Tagbilaran" fill={C.teal}   radius={[3,3,0,0]} />
                <Bar dataKey="Dauis"      fill={C.blue}   radius={[3,3,0,0]} />
                <Bar dataKey="Panglao"    fill={C.orange} radius={[3,3,0,0]} />
                <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8, color: C.grayLight }} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── TREATMENT CAPACITY & NETWORK ── */}
        <div>
          {sectionTitle("Treatment Capacity & Network Length", "Sewer pipe length by diameter and plant capacity")}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {chartCard(
              <ResponsiveContainer width="100%" height={185}>
                <BarChart data={capacityData} barGap={2} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grayBorder} />
                  <XAxis dataKey="name" tick={{ fill: "#fff", fontSize: 9 }} tickLine={false} />
                  <YAxis tick={{ fill: C.grayLight, fontSize: 9 }} tickLine={false} unit=" km" />
                  <Tooltip {...TOOLTIP_DARK} formatter={(v: any) => `${v} km`} />
                  <Bar dataKey="s100" name="100 mm" fill={C.teal}   radius={[3,3,0,0]} />
                  <Bar dataKey="s125" name="125 mm" fill={C.blue}   radius={[3,3,0,0]} />
                  <Bar dataKey="s150" name="150 mm" fill={C.orange} radius={[3,3,0,0]} />
                  <Legend wrapperStyle={{ fontSize: 9, paddingTop: 6, color: C.grayLight }} />
                </BarChart>
              </ResponsiveContainer>,
              "Sewer Network Length (km)"
            )}
            {chartCard(
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={capacityData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grayBorder} horizontal={false} />
                  <XAxis type="number" tick={{ fill: C.grayLight, fontSize: 9 }} tickLine={false} unit=" MLD" />
                  <YAxis dataKey="name" type="category" tick={{ fill: "#fff", fontSize: 9 }} tickLine={false} width={70} />
                  <Tooltip {...TOOLTIP_DARK} formatter={(v: any) => `${v} MLD`} />
                  <Bar dataKey="capacity" name="Capacity" radius={[0,4,4,0]}>
                    {capacityData.map((d, i) => <Cell key={i} fill={d.capColor} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>,
              "Treatment Plant Capacity (MLD)"
            )}
          </div>
        </div>

        {/* ── DWIF COVERAGE ── */}
        <div>
          {sectionTitle("DWIF Coverage", "Dry Weather Interceptor Flow — Total: 5.63 MLD · 62,500 population served · 4 DWIFs")}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {chartCard(
              <>
                <ResponsiveContainer width="100%" height={165}>
                  <BarChart data={dwifPopServed}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.grayBorder} />
                    <XAxis dataKey="name" tick={{ fill: "#fff", fontSize: 10 }} tickLine={false} />
                    <YAxis tick={{ fill: C.grayLight, fontSize: 9 }} tickLine={false} />
                    <Tooltip {...TOOLTIP_DARK} formatter={(v: any, name: any) => name === "pct" ? `${v}%` : v.toLocaleString()} />
                    <Bar dataKey="value" name="Pop. Served" radius={[4,4,0,0]}>
                      {dwifPopServed.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", justifyContent: "space-around", marginTop: 6 }}>
                  {dwifPopServed.map(d => (
                    <div key={d.name} style={{ textAlign: "center" }}>
                      <div style={{ color: d.color, fontSize: 16, fontWeight: 700 }}>{d.pct}%</div>
                      <div style={{ color: C.grayLight, fontSize: 9 }}>coverage</div>
                    </div>
                  ))}
                </div>
              </>,
              "Population Served & Coverage %"
            )}
            {chartCard(
              <ResponsiveContainer width="100%" height={165}>
                <BarChart data={dwifFlow} barGap={3} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grayBorder} />
                  <XAxis dataKey="name" tick={{ fill: "#fff", fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fill: C.grayLight, fontSize: 9 }} tickLine={false} unit=" MLD" />
                  <Tooltip {...TOOLTIP_DARK} formatter={(v: any) => `${v} MLD`} />
                  <Bar dataKey="flow"     fill={C.blue}  name="Est. Flow" radius={[3,3,0,0]} />
                  <Bar dataKey="capacity" fill={C.green} name="Capacity"  radius={[3,3,0,0]} />
                  <Legend wrapperStyle={{ fontSize: 9, paddingTop: 6, color: C.grayLight }} />
                </BarChart>
              </ResponsiveContainer>,
              "Estimated Flow vs DWIF Capacity (MLD)"
            )}
          </div>
        </div>

        {/* ── REUSE DISTRIBUTION ── */}
        <div>
          {sectionTitle("Potential Treated Reuse Distribution", "Reuse hotspots by application across LGUs — 107 total sites")}
          {chartCard(
            <ResponsiveContainer width="100%" height={270}>
              <BarChart data={reuseBarData} layout="vertical" barGap={2} barCategoryGap="18%">
                <CartesianGrid strokeDasharray="3 3" stroke={C.grayBorder} horizontal={false} />
                <XAxis type="number" tick={{ fill: C.grayLight, fontSize: 9 }} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: "#fff", fontSize: 10 }} tickLine={false} width={98} interval={0} />
                <Tooltip {...TOOLTIP_DARK} />
                <Bar dataKey="Tagbilaran" fill={C.teal}   barSize={7} radius={[0,4,4,0]} />
                <Bar dataKey="Dauis"      fill={C.blue}   barSize={7} radius={[0,4,4,0]} />
                <Bar dataKey="Panglao"    fill={C.orange} barSize={7} radius={[0,4,4,0]} />
                <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8, color: C.grayLight }} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── KEY INSIGHTS ── */}
        <div style={{ background: C.cardBg, borderRadius: 10, padding: "14px 16px", borderLeft: `3px solid ${C.green}` }}>
          <div style={{ color: C.green, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Key Insights</div>
          <div style={{ color: C.grayLight, fontSize: 11, lineHeight: 1.8 }}>
            • 4 Dry Weather Interceptor catchments capture wastewater from 12 key outfalls, serving 47,250 residents across 14,190 ha.<br />
            • Solid Free Sewer system includes 4 STPs with a total treatment capacity of 4,480 m³/day.<br />
            • 107 treated water reuse hotspots identified, with 1,990 m³/day supply potential vs 2,110 m³/day demand.<br />
            • Hotels &amp; resorts dominate reuse opportunities (42 sites, ~850 m³/day).
          </div>
        </div>

      </div>
    </div>
  );
}



// MODULE 5: Financial Sustainability
function Module5Content() {
  const C = {
    navy: "#1B3A4B", teal: "#0D9488", tealLight: "#14B8A6", orange: "#F59E0B",
    blue: "#3B82F6", green: "#10B981", purple: "#8B5CF6", red: "#EF4444",
    dark: "#0F172A", darkCard: "#1E293B", darkBg: "#0B1120", accent: "#FCD34D",
    gray: "#64748B", grayLight: "#94A3B8", grayBorder: "#334155", cardBg: "#162032",
  };
  const tt = { background: "#1E293B", border: "none", borderRadius: 8, color: "#fff", fontSize: 11 };

  const summary = [
    { label: "Total CWIS Investment", value: "$20.41M", pct: "100%", sub: "Across all sanitation value chain", color: C.teal },
    { label: "Network Solutions", value: "$17.26M", pct: "84.6%", sub: "Sewer + STPs + DWIF", color: C.orange },
    { label: "Non-Network Solutions", value: "$3.15M", pct: "15.4%", sub: "Toilets + collection & transport", color: C.blue },
    { label: "Avg Cost per Capita", value: "$104", pct: "3 LGUs", sub: "Based on ~197,000 population", color: C.green },
  ];
  const lguData = [
    { name: "Tagbilaran", Toilet: 0.95, Collection: 0.20, Treatment: 10.25 },
    { name: "Dauis", Toilet: 0.70, Collection: 0.10, Treatment: 4.38 },
    { name: "Panglao", Toilet: 0.56, Collection: 0.05, Treatment: 3.22 },
  ];
  const nnVsNw = [
    { name: "Non-Network", "Toilet Access": 2.21, "Collection": 0.35, "FSTP": 3.40 },
    { name: "Network", "Sewer Network": 8.04, "STP": 6.02, "DWIF": 2.00 },
  ];
  const componentData = [
    { name: "Sewer Network", value: 8.04, color: C.teal },
    { name: "Treatment (STP)", value: 6.02, color: C.green },
    { name: "Treatment (FSTP)", value: 3.40, color: C.purple },
    { name: "Toilet Access", value: 2.21, color: C.orange },
    { name: "Treatment (DWIF)", value: 2.00, color: "#34D399" },
    { name: "Collection", value: 0.35, color: C.blue },
  ];
  const toiletData = [
    { name: "Super.+Contain.+Soak", cost: 0.90 },
    { name: "Contain.+Soak Pit", cost: 0.54 },
    { name: "Soak Pit Only", cost: 0.21 },
    { name: "Public Toilet Upgrade", cost: 0.12 },
    { name: "Community Toilet Up.", cost: 0.11 },
    { name: "New Public Toilets", cost: 0.20 },
    { name: "New Community Toilets", cost: 0.14 },
  ];
  const collectionData = [
    { name: "Fleet 10 KL", cost: 0.160 },
    { name: "Fleet 5 KL", cost: 0.100 },
    { name: "Fleet 2 KL", cost: 0.075 },
    { name: "Add. Pumps", cost: 0.012 },
  ];
  const treatmentData = [
    { name: "FSTP Upgrade Dauis", cost: 0.20 },
    { name: "FSTP Tagbilaran", cost: 3.20 },
    { name: "Catch. 1 Network", cost: 1.70 },
    { name: "STP 1", cost: 1.25 },
    { name: "Catch. 2 Network", cost: 1.52 },
    { name: "STP 2", cost: 1.11 },
    { name: "Catch. 3 Network", cost: 2.59 },
    { name: "STP 3", cost: 1.96 },
    { name: "Catch. 4 Network", cost: 2.23 },
    { name: "STP 4", cost: 1.70 },
    { name: "DWIF 1", cost: 0.75 },
    { name: "DWIF 2", cost: 0.64 },
    { name: "DWIF 3", cost: 0.61 },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: C.darkBg, margin: "-16px", color: "#fff", paddingBottom: 24 }}>
      <div style={{ padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ── SUMMARY CARDS ── */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, color: "#fff" }}>Total Investment Summary</div>
          <div style={{ color: C.grayLight, fontSize: 11, marginBottom: 12 }}>All values in USD</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {summary.map(s => (
              <div key={s.label} style={{
                background: C.cardBg, borderRadius: 10, padding: "10px 12px",
                borderLeft: `3px solid ${s.color}`, position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: 0, right: 0, width: 34, height: 34, background: `${s.color}08`, borderRadius: "0 0 0 34px" }} />
                <div style={{ color: C.grayLight, fontSize: 9, marginBottom: 3 }}>{s.label}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 5, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{s.value}</span>
                  <span style={{ background: `${s.color}25`, color: s.color, fontSize: 9, fontWeight: 600, padding: "1px 6px", borderRadius: 10 }}>{s.pct}</span>
                </div>
                <div style={{ color: C.gray, fontSize: 9, marginTop: 3, lineHeight: 1.3 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── LGU BREAKDOWN ── */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, color: "#fff" }}>Investment Breakdown by LGU</div>
          <div style={{ color: C.grayLight, fontSize: 11, marginBottom: 12 }}>Toilet, Collection & Treatment per LGU (USD Million)</div>
          <div style={{ background: C.cardBg, borderRadius: 10, padding: 14 }}>
            {(() => {
              const maxTotal = Math.max(...lguData.map(d => d.Toilet + d.Collection + d.Treatment));
              return (
                <div style={{ padding: "2px 0" }}>
                  {lguData.map(d => {
                    const total = d.Toilet + d.Collection + d.Treatment;
                    const barPct = (total / maxTotal) * 100;
                    return (
                      <div key={d.name} style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                          <span style={{ color: "#fff", fontSize: 11, fontWeight: 600 }}>{d.name}</span>
                          <span style={{ color: C.grayLight, fontSize: 10 }}>${total.toFixed(2)}M total</span>
                        </div>
                        <div style={{ width: "100%", height: 22, background: "#1B3A4B", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ width: `${barPct}%`, height: "100%", display: "flex", borderRadius: 4, overflow: "hidden" }}>
                            <HoverableBarSegment color={C.orange} width={`${(d.Toilet / total) * 100}%`} label="Toilet" value={`$${d.Toilet.toFixed(2)}M`} />
                            <HoverableBarSegment color={C.blue} width={`${(d.Collection / total) * 100}%`} label="Collection" value={`$${d.Collection.toFixed(2)}M`} />
                            <HoverableBarSegment color={C.teal} width={`${(d.Treatment / total) * 100}%`} label="Treatment" value={`$${d.Treatment.toFixed(2)}M`} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ display: "flex", gap: 14, marginTop: 6, justifyContent: "center" }}>
                    {([["Toilet", C.orange], ["Collection", C.blue], ["Treatment", C.teal]] as [string, string][]).map(([name, color]) => (
                      <div key={name} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                        <span style={{ color: C.grayLight, fontSize: 10 }}>{name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* ── NON-NETWORK vs NETWORK ── */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, color: "#fff" }}>Non-Network vs Network Investment</div>
          <div style={{ color: C.grayLight, fontSize: 11, marginBottom: 12 }}>Non-Network $5.96M (29.2%) · Network $16.06M (78.7%)</div>
          <div style={{ background: C.cardBg, borderRadius: 10, padding: 14 }}>
            {(() => {
              const nnVsNwConfig = [
                {
                  name: "Non-Network",
                  total: 5.96,
                  segments: [
                    { label: "Toilet Access", value: 2.21, color: C.orange },
                    { label: "Collection", value: 0.35, color: C.blue },
                    { label: "FSTP", value: 3.40, color: C.purple },
                  ]
                },
                {
                  name: "Network",
                  total: 16.06,
                  segments: [
                    { label: "Sewer Network", value: 8.04, color: C.teal },
                    { label: "STP", value: 6.02, color: C.green },
                    { label: "DWIF", value: 2.00, color: "#34D399" },
                  ]
                }
              ];
              const maxTotal = 16.06;
              return (
                <div style={{ padding: "2px 0" }}>
                  {nnVsNwConfig.map(row => {
                    const barPct = (row.total / maxTotal) * 100;
                    return (
                      <div key={row.name} style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                          <span style={{ color: "#fff", fontSize: 11, fontWeight: 600 }}>{row.name}</span>
                          <span style={{ color: C.grayLight, fontSize: 10 }}>${row.total.toFixed(2)}M</span>
                        </div>
                        <div style={{ width: "100%", height: 22, background: "#1B3A4B", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ width: `${barPct}%`, height: "100%", display: "flex", borderRadius: 4, overflow: "hidden" }}>
                            {row.segments.map(seg => (
                              <HoverableBarSegment
                                key={seg.label}
                                color={seg.color}
                                width={`${(seg.value / row.total) * 100}%`}
                                label={seg.label}
                                value={`$${seg.value.toFixed(2)}M`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 6, justifyContent: "center" }}>
                    {([
                      ["Toilet Access", C.orange], ["Collection", C.blue], ["FSTP", C.purple],
                      ["Sewer Network", C.teal], ["STP", C.green], ["DWIF", "#34D399"]
                    ] as [string, string][]).map(([name, color]) => (
                      <div key={name} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                        <span style={{ color: C.grayLight, fontSize: 9 }}>{name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* ── COMPONENT BREAKDOWN ── */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, color: "#fff" }}>Component Breakdown</div>
          <div style={{ color: C.grayLight, fontSize: 11, marginBottom: 12 }}>All 6 components ranked by investment size</div>
          <div style={{ background: C.cardBg, borderRadius: 10, padding: 14 }}>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={componentData}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.grayBorder} />
                <XAxis dataKey="name" tick={{ fill: "#fff", fontSize: 8 }} tickLine={false} angle={-15} textAnchor="end" height={50} />
                <YAxis tick={{ fill: C.grayLight, fontSize: 9 }} tickLine={false} unit="M" />
                <Tooltip {...TOOLTIP_DARK} formatter={(v: any) => `$${Number(v).toFixed(2)}M`} />
                <Bar dataKey="value" name="USD Million" radius={[4, 4, 0, 0]}>
                  {componentData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── INTERVENTION DETAILS ── */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "#fff" }}>Intervention Investment Details</div>

          {/* Toilet */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ color: C.orange, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Toilet Access — $2.21M</div>
            <div style={{ background: C.cardBg, borderRadius: 10, padding: "12px 10px" }}>
              <ResponsiveContainer width="100%" height={195}>
                <BarChart data={toiletData} layout="vertical" barCategoryGap="15%">
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grayBorder} horizontal={false} />
                  <XAxis type="number" tick={{ fill: C.grayLight, fontSize: 9 }} tickLine={false} unit="M" />
                  <YAxis dataKey="name" type="category" tick={{ fill: "#fff", fontSize: 8 }} tickLine={false} width={130} interval={0} />
                  <Tooltip {...TOOLTIP_DARK} formatter={(v: any) => `$${Number(v).toFixed(2)}M`} />
                  <Bar dataKey="cost" name="Cost (USD M)" fill={C.orange} radius={[0, 4, 4, 0]} barSize={10} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Collection */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ color: C.blue, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Collection & Transportation — $0.347M</div>
            <div style={{ background: C.cardBg, borderRadius: 10, padding: "12px 10px" }}>
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={collectionData} layout="vertical" barCategoryGap="15%">
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grayBorder} horizontal={false} />
                  <XAxis type="number" tick={{ fill: C.grayLight, fontSize: 9 }} tickLine={false} unit="M" />
                  <YAxis dataKey="name" type="category" tick={{ fill: "#fff", fontSize: 9 }} tickLine={false} width={80} interval={0} />
                  <Tooltip {...TOOLTIP_DARK} formatter={(v: any) => `$${Number(v).toFixed(3)}M`} />
                  <Bar dataKey="cost" name="Cost (USD M)" fill={C.blue} radius={[0, 4, 4, 0]} barSize={10} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Treatment */}
          <div>
            <div style={{ color: C.teal, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Treatment, Disposal & Re-use — $19.46M</div>
            <div style={{ background: C.cardBg, borderRadius: 10, padding: "12px 10px", maxHeight: 360, overflowY: "auto" }}>
              <ResponsiveContainer width="100%" height={treatmentData.length * 26 + 30}>
                <BarChart data={treatmentData} layout="vertical" barCategoryGap="12%">
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grayBorder} horizontal={false} />
                  <XAxis type="number" tick={{ fill: C.grayLight, fontSize: 9 }} tickLine={false} unit="M" />
                  <YAxis dataKey="name" type="category" tick={{ fill: "#fff", fontSize: 8 }} tickLine={false} width={110} interval={0} />
                  <Tooltip {...TOOLTIP_DARK} formatter={(v: any) => `$${Number(v).toFixed(2)}M`} />
                  <Bar dataKey="cost" name="Cost (USD M)" radius={[0, 4, 4, 0]} barSize={10}>
                    {treatmentData.map((d, i) => (
                      <Cell key={i} fill={
                        d.name.includes("DWIF") ? "#34D399"
                        : d.name.includes("STP") ? C.green
                        : d.name.includes("Catch") ? C.blue
                        : d.name.includes("FSTP") ? C.purple
                        : C.teal
                      } />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── KEY INSIGHTS ── */}
        <div style={{ background: C.cardBg, borderRadius: 10, padding: "14px 16px", borderLeft: `3px solid ${C.green}` }}>
          <div style={{ color: C.green, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Key Insights</div>
          <div style={{ color: C.grayLight, fontSize: 11, lineHeight: 1.8 }}>
            • New STPs and sewer networks drive most of the investment, with STP-3 and the Tagbilaran FSTP being the largest components.<br />
            • Upgrading the existing Dauis FSTP requires relatively low investment, while still supporting expanded septage treatment capacity.
          </div>
        </div>

      </div>
    </div>
  );
}

// MODULE 6: Enabling Environment
function Module6Content() {
  const C = {
    navy: "#1B3A4B", teal: "#0D9488", tealLight: "#14B8A6", orange: "#F59E0B",
    blue: "#3B82F6", green: "#10B981", purple: "#8B5CF6", red: "#EF4444",
    dark: "#0F172A", darkCard: "#1E293B", darkBg: "#0B1120", accent: "#FCD34D",
    gray: "#64748B", grayLight: "#94A3B8", grayBorder: "#334155", cardBg: "#162032",
    cyan: "#06B6D4",
  };
  const tt = { background: C.darkCard, border: "none", borderRadius: 8, color: "#fff", fontSize: 11 };

  const phases = [
    { name: "Phase 1",      period: "2027–2030", cost: "$6M",    pct: 27, interventions: 18, buildings: 8200, color: C.teal,   tag: "SHORT-TERM"  },
    { name: "Phase 2",      period: "2030–2035", cost: "$8M",    pct: 36, interventions: 25, buildings: 6800, color: C.blue,   tag: "MEDIUM-TERM" },
    { name: "Phase 3",      period: "2035–2040", cost: "$8M",    pct: 37, interventions: 28, buildings: 4100, color: C.purple, tag: "LONG-TERM"   },
    { name: "New Bldg Apps",period: "2026",       cost: "1,254", pct: 2,  interventions: 0,  buildings: 1254, color: C.orange, tag: "ANNUAL"      },
  ];
  const interventionMix = [
    { name: "Phase 1 (2027–30)", Toilet: 5, Collection: 3, Network: 4, Treatment: 4 },
    { name: "Phase 2 (2030–35)", Toilet: 6, Collection: 4, Network: 7, Treatment: 5 },
    { name: "Phase 3 (2035–40)", Toilet: 4, Collection: 3, Network: 9, Treatment: 8 },
  ];
  const buildingsByPhase = [
    { name: "Phase 1", Tagbilaran: 4500, Dauis: 2100, Panglao: 1600 },
    { name: "Phase 2", Tagbilaran: 3600, Dauis: 1800, Panglao: 1400 },
    { name: "Phase 3", Tagbilaran: 2100, Dauis: 1200, Panglao: 800  },
  ];
  const riskData = [
    { name: "Flood Hazard",        value: 2850, color: C.red    },
    { name: "Ground Infiltration", value: 1620, color: C.orange },
    { name: "High Groundwater",    value: 1340, color: C.blue   },
  ];
  const permitData = [
    { month: "Jan", applied: 28, approved: 22 }, { month: "Feb", applied: 31, approved: 25 },
    { month: "Mar", applied: 35, approved: 29 }, { month: "Apr", applied: 27, approved: 21 },
    { month: "May", applied: 33, approved: 27 }, { month: "Jun", applied: 29, approved: 24 },
    { month: "Jul", applied: 32, approved: 26 }, { month: "Aug", applied: 30, approved: 25 },
    { month: "Sep", applied: 26, approved: 22 }, { month: "Oct", applied: 28, approved: 23 },
    { month: "Nov", applied: 24, approved: 20 }, { month: "Dec", applied: 24, approved: 19 },
  ];
  const mixColors = [C.orange, C.blue, C.teal, C.green];
  const mixKeys   = ["Toilet", "Collection", "Network", "Treatment"];

  const sectionTitle = (text: string, sub?: string) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{text}</div>
      {sub && <div style={{ color: C.grayLight, fontSize: 11, marginTop: 3 }}>{sub}</div>}
    </div>
  );
  const chartCard = (children: React.ReactNode, title?: string) => (
    <div style={{ background: C.cardBg, borderRadius: 10, padding: 14 }}>
      {title && <div style={{ color: "#fff", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>{title}</div>}
      {children}
    </div>
  );

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: C.darkBg, margin: "-16px", color: "#fff", paddingBottom: 24 }}>
      <div style={{ padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ── IMPLEMENTATION PHASING KPIs — 2 per row ── */}
        <div>
          {sectionTitle("Implementation Phasing", "Across settlements of all three LGUs")}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {phases.map(p => (
              <div key={p.name} style={{
                background: C.cardBg, borderRadius: 10, padding: "10px 12px",
                borderLeft: `3px solid ${p.color}`, position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: 0, right: 0, width: 34, height: 34, background: `${p.color}08`, borderRadius: "0 0 0 34px" }} />
                <div style={{ color: p.color, fontSize: 8, fontWeight: 700, letterSpacing: 1.2, marginBottom: 2 }}>{p.tag}</div>
                <div style={{ color: C.grayLight, fontSize: 9, marginBottom: 3 }}>{p.name} <span style={{ color: C.gray }}>({p.period})</span></div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 5, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{p.cost}</span>
                  <span style={{ background: `${p.color}25`, color: p.color, fontSize: 9, fontWeight: 600, padding: "1px 6px", borderRadius: 10 }}>~{p.pct}%</span>
                </div>
                {p.interventions > 0
                  ? <div style={{ color: C.gray, fontSize: 9, marginTop: 3 }}>{p.interventions} interventions · {p.buildings.toLocaleString()} bldgs</div>
                  : <div style={{ color: C.gray, fontSize: 9, marginTop: 3 }}>Construction applications (total properties)</div>
                }
                <div style={{ marginTop: 8, background: C.grayBorder, borderRadius: 4, height: 5, overflow: "hidden" }}>
                  <div style={{ width: `${p.pct}%`, background: `linear-gradient(90deg, ${p.color}, ${p.color}88)`, height: "100%", borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── INTERVENTION MIX — CSS horizontal stacked bars ── */}
        <div>
          {sectionTitle("Intervention Mix by Phase", "Interventions across the sanitation value chain")}
          {chartCard(
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {interventionMix.map(d => {
                  const total = mixKeys.reduce((s, k) => s + (d as any)[k], 0);
                  return (
                    <div key={d.name}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ color: "#fff", fontSize: 11, fontWeight: 600 }}>{d.name}</span>
                        <span style={{ color: C.grayLight, fontSize: 10 }}>{total} total</span>
                      </div>
                      <div style={{ width: "100%", height: 22, background: "#1B3A4B", borderRadius: 4, overflow: "hidden", display: "flex" }}>
                        {mixKeys.map((k, i) => {
                          const val = (d as any)[k];
                          return val > 0 ? (
                            <HoverableBarSegment key={k} color={mixColors[i]} width={`${(val / total) * 100}%`} label={k} value={`${val}`} />
                          ) : null;
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 10, justifyContent: "center", flexWrap: "wrap" }}>
                {mixKeys.map((k, i) => (
                  <div key={k} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: mixColors[i] }} />
                    <span style={{ color: C.grayLight, fontSize: 10 }}>{k}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── BUILDINGS COVERED BY PHASE — grouped bars ── */}
        <div>
          {sectionTitle("Buildings Covered by Phase", "Rollout across Tagbilaran, Dauis, Panglao")}
          {chartCard(
            <ResponsiveContainer width="100%" height={185}>
              <BarChart data={buildingsByPhase} barGap={2} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke={C.grayBorder} />
                <XAxis dataKey="name" tick={{ fill: "#fff", fontSize: 10 }} tickLine={false} />
                <YAxis tick={{ fill: C.grayLight, fontSize: 9 }} tickLine={false} />
                <Tooltip {...TOOLTIP_DARK} formatter={(v: any) => v.toLocaleString()} />
                <Bar dataKey="Tagbilaran" fill={C.teal}   radius={[3,3,0,0]} />
                <Bar dataKey="Dauis"      fill={C.blue}   radius={[3,3,0,0]} />
                <Bar dataKey="Panglao"    fill={C.orange} radius={[3,3,0,0]} />
                <Legend wrapperStyle={{ fontSize: 9, paddingTop: 6, color: C.grayLight }} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── CONTAINMENT RISK — donut + risk cards ── */}
        <div>
          {sectionTitle("Containment Risk Assessment", "Risk identified across ~5,810 new building applications")}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: "0 0 175px", background: C.cardBg, borderRadius: 10, padding: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ResponsiveContainer width="100%" height={175}>
                <PieChart>
                  <Pie data={riskData} cx="50%" cy="50%" innerRadius={48} outerRadius={76} dataKey="value" paddingAngle={3} strokeWidth={0}>
                    {riskData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip {...TOOLTIP_DARK} formatter={(v: any) => v.toLocaleString()} />
                  <text x="50%" y="47%" textAnchor="middle" fill="#fff" fontSize={18} fontWeight={700}>5,810</text>
                  <text x="50%" y="58%" textAnchor="middle" fill={C.grayLight} fontSize={9}>applications</text>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, minWidth: 160, display: "flex", flexDirection: "column", gap: 8 }}>
              {riskData.map(r => (
                <div key={r.name} style={{ background: C.cardBg, borderRadius: 8, padding: "10px 12px", borderLeft: `3px solid ${r.color}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                    <span style={{ color: "#fff", fontSize: 11, fontWeight: 600 }}>{r.name}</span>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                      <span style={{ color: r.color, fontSize: 15, fontWeight: 700 }}>{r.value.toLocaleString()}</span>
                      <span style={{ color: C.gray, fontSize: 10 }}>({(r.value / 5810 * 100).toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div style={{ background: C.grayBorder, borderRadius: 4, height: 6, overflow: "hidden" }}>
                    <div style={{ width: `${(r.value / 5810 * 100)}%`, background: `linear-gradient(90deg, ${r.color}, ${r.color}88)`, height: "100%", borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── DIGITAL PERMIT TRACKING ── */}
        <div>
          {sectionTitle("Digital Permit Tracking (2026)", "Building applications with location and containment risk checks")}
          {chartCard(
            <>
              <ResponsiveContainer width="100%" height={210}>
                <ComposedChart data={permitData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grayBorder} />
                  <XAxis dataKey="month" tick={{ fill: "#fff", fontSize: 9 }} tickLine={false} />
                  <YAxis tick={{ fill: C.grayLight, fontSize: 9 }} tickLine={false} />
                  <Tooltip {...TOOLTIP_DARK} />
                  <Bar dataKey="applied" name="Applications" fill={`${C.blue}88`} radius={[3,3,0,0]} />
                  <Line type="monotone" dataKey="approved" name="Approved" stroke={C.green} strokeWidth={2.5} dot={{ r: 3, fill: C.green }} />
                  <Legend wrapperStyle={{ fontSize: 9, paddingTop: 4, color: C.grayLight }} />
                </ComposedChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", justifyContent: "space-around", padding: "10px 0 4px", borderTop: `1px solid ${C.grayBorder}`, marginTop: 4 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: C.blue,   fontSize: 18, fontWeight: 700 }}>347</div>
                  <div style={{ color: C.grayLight, fontSize: 9 }}>Total Applications</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: C.green,  fontSize: 18, fontWeight: 700 }}>283</div>
                  <div style={{ color: C.grayLight, fontSize: 9 }}>Approved</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: C.accent, fontSize: 18, fontWeight: 700 }}>81.6%</div>
                  <div style={{ color: C.grayLight, fontSize: 9 }}>Approval Rate</div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── KEY INSIGHTS ── */}
        <div style={{ background: C.cardBg, borderRadius: 10, padding: "14px 16px", borderLeft: `3px solid ${C.green}` }}>
          <div style={{ color: C.green, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Key Insights</div>
          <div style={{ color: C.grayLight, fontSize: 11, lineHeight: 1.8 }}>
            • Phasing plan covers ~19,100 buildings: Phase 1 (8,200), Phase 2 (6,800), Phase 3 (4,100).<br />
            • Containment risk identified in ~5,810 buildings: flood (2,850), infiltration (1,620), high groundwater (1,340).<br />
            • Containment database maps ~89% of premises (8,200 residential, 2,300 non-residential).<br />
            • Digital permit system tracks 347 new building applications with location and containment risk checks.
          </div>
        </div>

      </div>
    </div>
  );
}