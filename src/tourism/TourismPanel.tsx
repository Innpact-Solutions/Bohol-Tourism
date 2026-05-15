// Tourism module — left-drawer "Tourism" section.
// Hierarchical layer toggle UI:
//   • Tourism Sites   → Anchor / Secondary / Supportive
//                       → site_cat sub-filter (Beach / Marine / Nature / ...)
//   • Hospitality     → Premium / Quality
//   • Tourism Clusters → Primary / Emerging / Satellite

import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown, ChevronRight,
  MapPin, Hotel, Sparkles, Palmtree, Info,
  Star, Crown, Circle, CircleDot,
  Umbrella, Fish, Mountain, Landmark, Church, Trees,
  Eye, EyeOff,
} from 'lucide-react';
import { TourismFilters } from './TourismFilters';
import { ClusterList } from './ClusterList';
import { AttractionsList } from './AttractionsList';
import { useTourismUI, TOURISM_SITE_CATEGORIES } from './tourismStore';
import { useTourismData } from './TourismContext';
import { CATEGORY_COLORS, TIER_COLORS } from './styles';

type IconCmp = React.ComponentType<{ className?: string; style?: React.CSSProperties }>;

interface SubLayer {
  id: string;
  label: string;
  description: string;
  count: number;
  icon: IconCmp;
  iconColor: string;
  iconStyle: 'solid' | 'outline'; // solid = filled colored bg, outline = outlined chip
  active: boolean;
  toggle: () => void;
}

interface LayerGroup {
  id: 'sites' | 'hospitality' | 'clusters';
  label: string;
  subtitle: string;
  icon: IconCmp;
  accent: string;
  sublayers: SubLayer[];
}

// ── Section theme: light palette per group, matching its accent line ──────────
interface SectionTheme {
  bg: string;        // active background
  border: string;    // active border
  text: string;      // active primary text
  textMuted: string; // active secondary text
  icon: string;      // active icon color
}
const SECTION_THEMES: Record<'sites' | 'hospitality' | 'clusters', SectionTheme> = {
  // Tourism Sites — green/teal
  sites:       { bg: '#ECFDF5', border: '#10B981', text: '#065F46', textMuted: '#047857', icon: '#059669' },
  // Hospitality — warm orange
  hospitality: { bg: '#FFF7ED', border: '#F97316', text: '#9A3412', textMuted: '#C2410C', icon: '#EA580C' },
  // Clusters — amber/yellow
  clusters:    { bg: '#FEFCE8', border: '#EAB308', text: '#854D0E', textMuted: '#A16207', icon: '#CA8A04' },
};

// ── Category metadata: icon + color per site type ────────────────────────────
const CATEGORY_META: Record<string, { icon: IconCmp; label: string; color: string }> = {
  'Beach':            { icon: Umbrella,  label: 'Beach',          color: CATEGORY_COLORS['Beach'] },
  'Marine':           { icon: Fish,      label: 'Marine',         color: CATEGORY_COLORS['Marine'] },
  'Nature / Viewpoint': { icon: Mountain,  label: 'Nature & Views', color: CATEGORY_COLORS['Nature / Viewpoint'] },
  'Heritage':         { icon: Landmark,  label: 'Heritage',       color: CATEGORY_COLORS['Heritage'] },
  'Faith':            { icon: Church,    label: 'Faith',          color: CATEGORY_COLORS['Faith'] },
  'Urban Park':       { icon: Trees,     label: 'Urban Park',     color: CATEGORY_COLORS['Urban Park'] },

};

export function TourismPanel({
  embedded = false,
  selectedLgu = null,
  selectedBrgy = null,
}: {
  embedded?: boolean;
  selectedLgu?: string | null;
  selectedBrgy?: string | null;
} = {}) {
  const ui = useTourismUI();
  const { clusters, sites, assets, loading } = useTourismData();
  const [openGroup, setOpenGroup] = useState<Record<string, boolean>>({
    sites: false, hospitality: false, clusters: false,
  });
  const [openTier, setOpenTier] = useState<Record<string, boolean>>({
    anchor: false, secondary: false, supportive: false,
  });
  const [sectionExpanded, setSectionExpanded] = useState(true);

  // When the group-level eye toggle fires, collapse every tier's category
  // list so the third hierarchy never auto-expands. Beyond that, the type
  // list only expands when the user explicitly clicks a tier header.
  const suppressTierAutoExpand = useRef(false);

  useEffect(() => {
    if (suppressTierAutoExpand.current) {
      suppressTierAutoExpand.current = false;
      setOpenTier({ anchor: false, secondary: false, supportive: false });
    }
  }, [ui.showAnchor, ui.showSecondary, ui.showSupportive]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  // Combine tourism's own LGU filter (ui.lgu) with the header LGU + Barangay
  // selections so counts shown in the panel match what's actually visible
  // on the map.
  const normHeader = (v?: string | null): string | null => {
    if (!v) return null;
    const t = v.trim();
    if (!t || t.toLowerCase() === 'all' || t === 'All LGUs') return null;
    return t;
  };
  const headerLgu  = normHeader(selectedLgu);
  const headerBrgy = normHeader(selectedBrgy);

  const matchesLgu = (p: any) => {
    if (ui.lgu !== 'All' && p.lgu !== ui.lgu) return false;
    if (headerLgu  && p.lgu  !== headerLgu)  return false;
    if (headerBrgy && p.brgy !== headerBrgy) return false;
    return true;
  };

  const countSites = (perfTier: string) => sites?.features.filter((f: any) => {
    const p = f.properties;
    if (p.site_cat === 'EXCLUDED') return false;
    if (!matchesLgu(p)) return false;
    return p.perf_tier === perfTier;
  }).length ?? 0;

  const countAssets = (tier: string) => assets?.features.filter((f: any) => {
    const p = f.properties;
    if (!matchesLgu(p)) return false;
    return p.asset_tier === tier;
  }).length ?? 0;

  const countClusters = (tier: string) => clusters?.features.filter((f: any) => {
    const p = f.properties;
    if (!matchesLgu(p)) return false;
    return p.tier === tier;
  }).length ?? 0;

  // counts per tier + per (tier, category)
  const countByTierAndCat: Record<string, Record<string, number>> = {
    Anchor: {}, Secondary: {}, Supportive: {},
  };
  sites?.features.forEach((f: any) => {
    const p = f.properties;
    if (p.site_cat === 'EXCLUDED') return;
    if (!matchesLgu(p)) return;
    const tier = p.perf_tier;
    if (!countByTierAndCat[tier]) return;
    countByTierAndCat[tier][p.site_cat] = (countByTierAndCat[tier][p.site_cat] || 0) + 1;
  });

  // ── Group definitions ──────────────────────────────────────────────────────
  const groups: LayerGroup[] = [
    {
      id: 'sites',
      label: 'Tourism Sites',
      subtitle: 'Attractions by performance tier',
      icon: MapPin,
      accent: '#14B8A6',
      sublayers: [
        {
          id: 'anchor',
          label: 'Anchor Sites',
          description: 'Top-performing destinations — high traffic, high reviews.',
          count: countSites('Anchor'),
          icon: Crown,
          iconColor: '#D97706',
          iconStyle: 'solid',
          active: ui.showAnchor,
          toggle: () => ui.setShowAnchor(!ui.showAnchor),
        },
        {
          id: 'secondary',
          label: 'Secondary Sites',
          description: 'Mid-tier attractions worth visiting.',
          count: countSites('Secondary'),
          icon: Star,
          iconColor: '#D97706',
          iconStyle: 'outline',
          active: ui.showSecondary,
          toggle: () => ui.setShowSecondary(!ui.showSecondary),
        },
        {
          id: 'supportive',
          label: 'Supportive Sites',
          description: 'Background context sites.',
          count: countSites('Supportive'),
          icon: CircleDot,
          iconColor: '#64748B',
          iconStyle: 'outline',
          active: ui.showSupportive,
          toggle: () => ui.setShowSupportive(!ui.showSupportive),
        },
      ],
    },
    {
      id: 'hospitality',
      label: 'Hospitality and F&B',
      subtitle: 'Hotels & restaurants',
      icon: Hotel,
      accent: '#6D28D9',
      sublayers: [
        {
          id: 'premium',
          label: 'Premium Stays & Dining',
          description: 'Top-tier hotels & restaurants by ratings and reviews.',
          count: countAssets('Premium'),
          icon: Crown,
          iconColor: '#6D28D9',
          iconStyle: 'solid',
          active: ui.showPremium,
          toggle: () => ui.setShowPremium(!ui.showPremium),
        },
        {
          id: 'quality',
          label: 'Quality Stays & Dining',
          description: 'Mid-tier hotels & restaurants.',
          count: countAssets('Quality'),
          icon: Hotel,
          iconColor: '#A78BFA',
          iconStyle: 'solid',
          active: ui.showQuality,
          toggle: () => ui.setShowQuality(!ui.showQuality),
        },
      ],
    },
    {
      id: 'clusters',
      label: 'Tourism Clusters',
      subtitle: 'Cluster polygons by tier',
      icon: Sparkles,
      accent: '#F59E0B',
      sublayers: [
        {
          id: 'cluster-primary',
          label: 'Primary Clusters',
          description: 'Established clusters.',
          count: countClusters('Primary'),
          icon: Circle,
          iconColor: TIER_COLORS.Primary.stroke,
          iconStyle: 'solid',
          active: ui.showClusterPrimary,
          toggle: () => ui.setShowClusterPrimary(!ui.showClusterPrimary),
        },
        {
          id: 'cluster-emerging',
          label: 'Emerging Clusters',
          description: 'Growing clusters.',
          count: countClusters('Emerging'),
          icon: Circle,
          iconColor: TIER_COLORS.Emerging.stroke,
          iconStyle: 'solid',
          active: ui.showClusterEmerging,
          toggle: () => ui.setShowClusterEmerging(!ui.showClusterEmerging),
        },
        {
          id: 'cluster-satellite',
          label: 'Satellite Clusters',
          description: 'Outlying or linked clusters.',
          count: countClusters('Satellite'),
          icon: Circle,
          iconColor: TIER_COLORS.Satellite.stroke,
          iconStyle: 'outline',
          active: ui.showClusterSatellite,
          toggle: () => ui.setShowClusterSatellite(!ui.showClusterSatellite),
        },
      ],
    },
  ];

  if (loading) {
    return (
      <div
        className={embedded ? 'px-4 py-3 bg-white' : 'h-full flex items-center justify-center bg-white'}
        style={{ color: '#64748B', fontFamily: 'DM Sans, Segoe UI, sans-serif', fontSize: 13 }}
      >
        Loading tourism data…
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // EMBEDDED LAYOUT (used inside LeftDrawer)
  // ────────────────────────────────────────────────────────────────────────────
  if (embedded) {
    return (
      <div className="w-full bg-white text-[#0F172A]" style={{ fontFamily: 'DM Sans, Segoe UI, sans-serif' }}>
        {/* Section header */}
        <button
          onClick={() => setSectionExpanded(!sectionExpanded)}
          className="w-full bg-[#F8FAFC] px-4 py-3 hover:bg-[#F1F5F9] transition-colors text-left flex items-center gap-3 border-b border-[#E2E8F0]"
        >
          <div className="w-7 h-7 rounded-md flex items-center justify-center bg-[#FCD34D33] border border-[#D97706]/40 shrink-0">
            <Palmtree className="w-4 h-4 text-[#B45309]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-[#0F172A] truncate">Tourism</div>
          </div>
          {sectionExpanded ? (
            <ChevronDown className="w-4 h-4 text-[#64748B]" />
          ) : (
            <ChevronRight className="w-4 h-4 text-[#64748B]" />
          )}
        </button>

        {sectionExpanded && (
          <div className="flex flex-col">
            {/* Render each group ----------------------------------------------- */}
            {groups.map((group) => {
              const expanded = openGroup[group.id];
              const activeCount = group.sublayers.filter(s => s.active).length;
              const groupTotal = group.sublayers.reduce((a, s) => a + (s.count || 0), 0);
              const groupBreakdown = group.sublayers.map(s => ({
                label: s.label,
                count: s.count || 0,
              }));

              return (
                <div
                  key={group.id}
                  className="border-t border-[#E2E8F0]"
                  // Any click inside this group section marks it as the active
                  // section so the Tourism Directory panel auto-switches its
                  // tab to match.
                  onClickCapture={() => ui.setActiveSection(group.id as any)}
                >
                  <GroupHeader
                    Icon={group.icon}
                    label={group.label}
                    subtitle={group.subtitle}
                    accent={group.accent}
                    expanded={expanded}
                    anyActive={activeCount > 0}
                    allOn={activeCount === group.sublayers.length}
                    total={groupTotal}
                    breakdown={groupBreakdown}
                    onClick={() => {
                      // If the section is fully off, clicking the header turns it
                      // on and expands to the 1st level (group container only).
                      if (activeCount === 0) {
                        if (group.id === 'sites') suppressTierAutoExpand.current = true;
                        group.sublayers.forEach(s => {
                          if (!s.active) s.toggle();
                        });
                        setOpenGroup(prev => ({ ...prev, [group.id]: true }));
                        return;
                      }
                      // Otherwise, just toggle the group expansion
                      setOpenGroup({ ...openGroup, [group.id]: !expanded });
                    }}
                    onToggleAll={() => {
                      // If anything is on, turn everything off; otherwise turn everything on.
                      const turnOn = activeCount === 0;
                      // For the Sites group, the bulk toggle should NOT cascade
                      // into auto-expanding every tier's category list.
                      if (group.id === 'sites') suppressTierAutoExpand.current = true;
                      group.sublayers.forEach(s => {
                        if (s.active !== turnOn) s.toggle();
                      });
                      // Auto-expand the group itself when turning on, collapse when off
                      setOpenGroup(prev => ({ ...prev, [group.id]: turnOn }));
                    }}
                  />

                  {expanded && group.id !== 'sites' && (
                    <div className="px-3 py-3 bg-white">
                      <div className="space-y-1">
                        {group.sublayers.map(sub => (
                          <SubLayerRow key={sub.id} sub={sub} theme={SECTION_THEMES[group.id]} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sites group: nested 3-level (tier → category-with-count>0) */}
                  {expanded && group.id === 'sites' && (
                    <div className="px-3 py-3 bg-white">
                      <div className="space-y-1">
                        {group.sublayers.map(sub => {
                        const tierKey = sub.label as 'Anchor' | 'Secondary' | 'Supportive';
                        const catCounts = countByTierAndCat[tierKey] || {};
                        const cats = TOURISM_SITE_CATEGORIES.filter(c => (catCounts[c] || 0) > 0);
                        const tierExpanded = openTier[sub.id];
                        const theme = SECTION_THEMES.sites;
                        return (
                          <div key={sub.id}>
                            <SubLayerRow
                              sub={sub}
                              theme={theme}
                              expandable={cats.length > 0}
                              expanded={tierExpanded}
                              onToggleExpand={() => setOpenTier({ ...openTier, [sub.id]: !tierExpanded })}
                            />
                            {tierExpanded && cats.length > 0 && (
                              <div className="mt-1 mb-1.5 ml-6 space-y-0.5">
                                {cats.map((cat) => {
                                  const meta = CATEGORY_META[cat];
                                  const CatIcon = meta.icon;
                                  const count = catCounts[cat] || 0;
                                  // Active only if the parent tier is on AND this category
                                  // is selected for that specific tier AND it has results
                                  // under current LGU/Brgy filters.
                                  const inTierSet = ui.enabledSiteCategoriesByTier[tierKey].has(cat);
                                  const active = sub.active && inTierSet && count > 0;
                                  // Disabled when parent tier is off OR no points match
                                  // the current LGU/Brgy filter for this category.
                                  const disabled = !sub.active || count === 0;
                                  const disabledReason = !sub.active
                                    ? `Enable ${sub.label} to filter by type`
                                    : count === 0
                                      ? `No ${meta.label} sites in current selection`
                                      : undefined;
                                  return (
                                    <button
                                      key={cat}
                                      onClick={() => ui.toggleSiteCategoryForTier(cat, tierKey)}
                                      disabled={disabled}
                                      className={`w-full text-left px-2.5 py-1.5 rounded-md transition-all duration-200 border ${
                                        active
                                          ? 'shadow-sm'
                                          : disabled
                                            ? 'border-transparent opacity-50 cursor-not-allowed'
                                            : 'border-transparent hover:bg-[#F1F5F9]'
                                      }`}
                                      style={active ? { backgroundColor: theme.bg, borderColor: `${theme.border}66` } : undefined}
                                      title={disabledReason}
                                    >
                                      <div className="flex items-center gap-2">
                                        <CatIcon
                                          className="w-3 h-3 flex-shrink-0"
                                          style={{ color: active ? theme.icon : '#94A3B8' }}
                                        />
                                        <span
                                          className="flex-1 text-[10.5px] font-medium leading-tight"
                                          style={{ color: active ? theme.text : disabled ? '#94A3B8' : '#475569' }}
                                        >
                                          {meta.label}
                                        </span>
                                        <span
                                          className="text-[9px] tabular-nums"
                                          style={{ color: active ? theme.textMuted : '#94A3B8' }}
                                        >
                                          {count}
                                        </span>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Legacy non-embedded view -----------------------------------------------------
  return (
    <div
      className="w-72 bg-white border-r border-[#E2E8F0] flex-shrink-0 shadow-lg h-full flex flex-col"
      style={{ fontFamily: 'DM Sans, Segoe UI, sans-serif', color: '#fff', minWidth: 0 }}
    >
      <div className="px-4 pt-4 pb-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
        <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#14B8A6]">Tourism Panel</div>
        <div className="text-[14px] font-bold">Tourism Clusters &amp; Attractions</div>
      </div>
      <div className="px-4 pt-4 pb-0">
        <TourismFilters />
      </div>
      <div className="flex-1 overflow-y-auto pt-2 pb-2">
        {ui.activeTab === 'clusters' ? <ClusterList /> : <AttractionsList />}
      </div>
    </div>
  );
}

// ── Helpers / sub-components ────────────────────────────────────────────────
function enabledAll(s: Set<string>): boolean {
  return TOURISM_SITE_CATEGORIES.every(c => s.has(c));
}

function GroupHeader({
  Icon, label, subtitle, accent, expanded, anyActive, allOn, onClick, onToggleAll,
  total, breakdown,
}: {
  Icon: IconCmp;
  label: string;
  subtitle: string;
  accent: string;
  expanded: boolean;
  anyActive: boolean;
  allOn: boolean;
  onClick: () => void;
  onToggleAll: () => void;
  total?: number;
  breakdown?: { label: string; count: number }[];
}) {
  return (
    <div className="w-full bg-[#F8FAFC] px-4 py-2.5 hover:bg-[#F1F5F9] transition-all duration-200 group">
      <div className="flex items-start justify-between text-left">
        <button
          onClick={onClick}
          className="flex items-start gap-2 flex-1 text-left cursor-pointer"
        >
          <div
            className="w-1 h-3.5 rounded-full mt-0.5 flex-shrink-0"
            style={{
              background: `linear-gradient(to bottom, ${accent}, ${accent}cc)`,
            }}
          />
          <div className="flex-1 text-left min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-semibold text-left text-[#0F172A]">
                {label}
              </h3>
              {typeof total === 'number' && (
                <span
                  className="px-1.5 py-[1px] rounded-full text-[9px] font-bold tabular-nums"
                  style={{ background: `${accent}1f`, color: accent }}
                >
                  {total}
                </span>
              )}
            </div>
          </div>
        </button>
        <div className="ml-2 flex items-center gap-1.5 flex-shrink-0">
          {/* Master visibility toggle for the entire group */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleAll(); }}
            role="switch"
            aria-checked={anyActive}
            title={anyActive ? `Hide ${label}` : `Show ${label}`}
            className="w-6 h-6 rounded-md flex items-center justify-center transition-all duration-150 cursor-pointer flex-shrink-0"
            style={
              anyActive
                ? { backgroundColor: `${accent}1a`, color: accent }
                : { color: '#94A3B8' }
            }
          >
            {anyActive ? (
              <Eye className="w-3.5 h-3.5" strokeWidth={2.25} />
            ) : (
              <EyeOff className="w-3.5 h-3.5" strokeWidth={2} />
            )}
          </button>
          <button
            onClick={onClick}
            className="cursor-pointer p-0.5 -m-0.5"
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-[#64748B] group-hover:text-[#0F172A] transition-colors" />
            ) : (
              <ChevronRight className="w-4 h-4 text-[#64748B] group-hover:text-[#0F172A] transition-colors" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function SubLayerRow({
  sub, theme, expandable, expanded, onToggleExpand,
}: {
  sub: SubLayer;
  theme: SectionTheme;
  expandable?: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
}) {
  const Icon = sub.icon;
  const activeStyle = sub.active
    ? { backgroundColor: theme.bg, borderColor: `${theme.border}66` }
    : undefined;
  return (
    <div
      className={`w-full rounded-md transition-all duration-200 border ${
        sub.active
          ? 'shadow-sm'
          : 'border-transparent hover:bg-[#F1F5F9]'
      }`}
      style={activeStyle}
    >
      <div className="flex items-center gap-0.5">
        <button
          onClick={sub.toggle}
          className="flex-1 text-left px-2.5 py-2 cursor-pointer"
          title={sub.active ? `Hide ${sub.label}` : `Show ${sub.label}`}
        >
          <div className="flex items-start gap-2">
            <Icon
              className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
              style={{ color: sub.active ? theme.icon : '#64748B' }}
            />
            <div className="flex-1 min-w-0">
              <div
                className="text-[11px] font-medium leading-tight"
                style={{ color: sub.active ? theme.text : '#475569' }}
              >
                {sub.label}
              </div>
              <div
                className="text-[9px] leading-tight mt-0.5"
                style={{ color: sub.active ? theme.textMuted : '#64748B' }}
              >
                {sub.description}
              </div>
            </div>
          </div>
        </button>
        {expandable && onToggleExpand && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
            className="px-2 py-2 flex-shrink-0 cursor-pointer transition-colors"
            title={expanded ? 'Collapse types' : 'Expand types'}
          >
            {expanded ? (
              <ChevronDown
                className="w-3.5 h-3.5"
                style={{ color: sub.active ? theme.textMuted : '#94A3B8' }}
              />
            ) : (
              <ChevronRight
                className="w-3.5 h-3.5"
                style={{ color: sub.active ? theme.textMuted : '#94A3B8' }}
              />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
