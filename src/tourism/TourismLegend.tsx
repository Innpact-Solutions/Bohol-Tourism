// Tourism legend block — renders inside the FloatingLegendPanel.
// Shows currently-visible tourism sub-layers grouped by Sites / Hospitality / Clusters
// + the per-category color key for site points.

import React from 'react';
import { MapPin, Hotel, Sparkles } from 'lucide-react';
import { useTourismUI } from './tourismStore';
import { CATEGORY_COLORS, TIER_COLORS } from './styles';

type DotStyle = 'solid' | 'outline' | 'dashed' | 'darkRing';

function LegendDot({
  color, style = 'solid', size = 10, ringColor,
}: { color: string; style?: DotStyle; size?: number; ringColor?: string }) {
  const baseStyle: React.CSSProperties = {
    width: size, height: size, borderRadius: '50%', display: 'inline-block', flexShrink: 0,
  };
  if (style === 'outline') {
    return <span style={{ ...baseStyle, background: '#fff', border: `1.5px solid ${color}` }} />;
  }
  if (style === 'dashed') {
    return <span style={{ ...baseStyle, background: `${color}55`, border: `1.5px dashed ${color}` }} />;
  }
  if (style === 'darkRing') {
    return <span style={{ ...baseStyle, background: color, boxShadow: `0 0 0 1.5px ${ringColor ?? '#1F2738'}` }} />;
  }
  return <span style={{ ...baseStyle, background: color, boxShadow: `0 0 0 1.5px ${ringColor ?? '#fff'}` }} />;
}

interface Row {
  label: string;
  color: string;
  style?: DotStyle;
  size?: number;
  ringColor?: string;
  active: boolean;
}

function LegendSection({
  title, Icon, accent, rows,
}: {
  title: string;
  Icon: React.ComponentType<{ className?: string }>;
  accent: string;
  rows: Row[];
}) {
  const activeRows = rows.filter(r => r.active);
  if (activeRows.length === 0) return null;
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-md overflow-hidden shadow-sm">
      <div className="bg-gradient-to-r from-[#F8FAFC] to-white px-2.5 py-1.5 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5" />
          <span className="text-[10px] font-semibold text-[#0F172A] truncate" style={{ color: accent }}>
            {title}
          </span>
        </div>
      </div>
      <div className="p-2 space-y-1">
        {activeRows.map((r) => (
          <div key={r.label} className="flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center" style={{ width: 14, height: 14 }}>
              <LegendDot color={r.color} style={r.style} size={r.size} ringColor={r.ringColor} />
            </span>
            <span className="text-[10px] text-[#1F2937] font-medium">{r.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TourismLegend() {
  const ui = useTourismUI();

  const anyOn =
    ui.showAnchor || ui.showSecondary || ui.showSupportive ||
    ui.showPremium || ui.showQuality || ui.showBookingAccommodations ||
    ui.showClusterPrimary || ui.showClusterEmerging || ui.showClusterSatellite;

  if (!anyOn) return null;

  // Sites: color comes from category (see key below). Tier only changes size & ring.
  // Anchor = large filled w/ white ring. Secondary = medium filled w/ white ring.
  // Supportive = small filled w/ dark ring (matches map paint).
  const siteSampleColor = '#8A8275';
  const sitesRows: Row[] = [
    { label: 'Anchor site (large)',     color: siteSampleColor, style: 'solid',    size: 12, active: ui.showAnchor },
    { label: 'Secondary site (medium)', color: siteSampleColor, style: 'solid',    size: 9,  active: ui.showSecondary },
    { label: 'Supportive site (small)', color: siteSampleColor, style: 'solid',    size: 6,  active: ui.showSupportive },
  ];

  const hospitalityRows: Row[] = [
    { label: 'Premium (hotels & restaurants)', color: '#6D28D9', style: 'solid', size: 9, active: ui.showPremium },
    { label: 'Quality (hotels & restaurants)', color: '#A78BFA', style: 'solid', size: 8, active: ui.showQuality },
    { label: 'Tourist homes',                  color: '#FF5A5F', style: 'solid', size: 8, active: ui.showBookingAccommodations },
  ];

  const clustersRows: Row[] = [
    { label: 'Primary cluster',   color: TIER_COLORS.Primary.stroke,   style: 'solid', size: 12, active: ui.showClusterPrimary },
    { label: 'Emerging cluster',  color: TIER_COLORS.Emerging.stroke,  style: 'solid', size: 12, active: ui.showClusterEmerging },
    { label: 'Satellite cluster', color: TIER_COLORS.Satellite.stroke, style: 'solid', size: 12, active: ui.showClusterSatellite },
  ];

  const activeCategories = Object.entries(CATEGORY_COLORS)
    .filter(([k]) => k !== 'EXCLUDED')
    .filter(([cat]) => ui.enabledSiteCategories.has(cat));
  const showCategoryKey =
    (ui.showAnchor || ui.showSecondary || ui.showSupportive) && activeCategories.length > 0;

  return (
    <>
      <LegendSection
        title="Tourism Sites"
        Icon={(props) => <MapPin {...props} style={{ color: '#14B8A6' }} />}
        accent="#0F766E"
        rows={sitesRows}
      />

      {showCategoryKey && (
        <div className="bg-white border border-[#E5E7EB] rounded-md overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-[#F8FAFC] to-white px-2.5 py-1.5 border-b border-[#E5E7EB]">
            <span className="text-[10px] font-semibold text-[#0F172A]">Site point color by type</span>
          </div>
          <div className="p-2 grid grid-cols-2 gap-x-2 gap-y-1">
            {Object.entries(CATEGORY_COLORS)
              .filter(([k]) => k !== 'EXCLUDED')
              .filter(([cat]) => ui.enabledSiteCategories.has(cat))
              .map(([cat, color]) => {
                return (
                  <div
                    key={cat}
                    className="flex items-center gap-1.5 min-w-0"
                  >
                    <span
                      className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: color }}
                    />
                    <span className="text-[10px] truncate text-[#1F2937]">
                      {cat}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      <LegendSection
        title="Hospitality"
        Icon={(props) => <Hotel {...props} style={{ color: '#6D28D9' }} />}
        accent="#5B21B6"
        rows={hospitalityRows}
      />

      <LegendSection
        title="Tourism Clusters"
        Icon={(props) => <Sparkles {...props} style={{ color: '#F59E0B' }} />}
        accent="#B45309"
        rows={clustersRows}
      />
    </>
  );
}
