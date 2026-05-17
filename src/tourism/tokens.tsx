// Tourism design tokens — single source of truth for COLOR + ICON across the
// whole tourism dashboard (left drawer, popups, map markers, right panel,
// charts, legends). Import these tokens rather than hard-coding values so the
// same concept reads identically wherever it appears.
//
// Hue strategy:
//   • Site tiers     — earth tones (amber / teal / slate) — distinct from clusters
//   • Asset (stay) tiers — violet family (deep / lavender / slate-light)
//   • Cluster tiers  — already defined in `styles.ts` as TIER_COLORS
//   • Climate hazards — intuitive natural mappings (heat=red, flood=blue, sinkhole=brown)
//
// Each token carries both an `accent` (for icon / value / bar) and a `tint`
// (for icon background / soft chip / card highlight).

import type { LucideIcon } from 'lucide-react';
import {
  Crown, Star, CircleDot, Circle, Sparkles,
  Hotel, Home, BedDouble,
  Flame, Droplets, Mountain,
  Plane, Ship, Bus,
  Umbrella, Fish, Landmark, Church, Trees,
} from 'lucide-react';

import { CATEGORY_COLORS, TIER_COLORS } from './styles';

export type ColorToken = { accent: string; tint: string };

// ---------------------------------------------------------------------------
// Site performance tiers — Anchor / Secondary / Supportive
// ---------------------------------------------------------------------------
export const SITE_TIER_TOKENS: Record<'Anchor' | 'Secondary' | 'Supportive', ColorToken & { icon: LucideIcon }> = {
  Anchor:     { accent: '#D97706', tint: '#FEF3C7', icon: Crown },     // amber
  Secondary:  { accent: '#0F766E', tint: '#CCFBF1', icon: Star },      // teal
  Supportive: { accent: '#64748B', tint: '#F1F5F9', icon: CircleDot }, // slate
};

// ---------------------------------------------------------------------------
// Asset (Stay & Dining) tiers — Premium / Quality / Tourist Home
// ---------------------------------------------------------------------------
export const ASSET_TIER_TOKENS: Record<'Premium' | 'Quality' | 'TouristHome', ColorToken & { icon: LucideIcon; label: string }> = {
  Premium:     { accent: '#6D28D9', tint: '#F5F3FF', icon: Crown,     label: 'Premium' },      // deep violet
  Quality:     { accent: '#A78BFA', tint: '#EDE9FE', icon: BedDouble, label: 'Quality' },      // lavender
  TouristHome: { accent: '#94A3B8', tint: '#F1F5F9', icon: Home,      label: 'Tourist Home' }, // slate-light
};

// ---------------------------------------------------------------------------
// Cluster tiers — Primary / Emerging / Satellite (re-export of TIER_COLORS
// with matching icons + tints so the panel can render KPI / badges from one map)
// ---------------------------------------------------------------------------
export const CLUSTER_TIER_TOKENS: Record<'Primary' | 'Emerging' | 'Satellite', ColorToken & { icon: LucideIcon }> = {
  Primary:   { accent: TIER_COLORS.Primary.stroke,   tint: '#FFF7ED', icon: Sparkles },
  Emerging:  { accent: TIER_COLORS.Emerging.stroke,  tint: '#F5F3FF', icon: CircleDot },
  Satellite: { accent: TIER_COLORS.Satellite.stroke, tint: '#EFF6FF', icon: Circle },
};

// ---------------------------------------------------------------------------
// Climate hazards — intuitive natural mappings (heat=red, flood=blue, sinkhole=brown)
// ---------------------------------------------------------------------------
export const HAZARD_TOKENS: Record<'heat' | 'flood' | 'sinkhole', ColorToken & { icon: LucideIcon; label: string }> = {
  heat:     { accent: '#DC2626', tint: '#FEE2E2', icon: Flame,    label: 'Heat Stress' },
  flood:    { accent: '#0284C7', tint: '#E0F2FE', icon: Droplets, label: 'Flood Risk' },
  sinkhole: { accent: '#92400E', tint: '#FEF3C7', icon: Mountain, label: 'Sinkhole' },
};

// ---------------------------------------------------------------------------
// Connectivity gateways — icon + accent for the three POIs (airport / port / bus)
// ---------------------------------------------------------------------------
export const CONNECTIVITY_TOKENS: Record<'airport' | 'port' | 'bus', ColorToken & { icon: LucideIcon; label: string }> = {
  airport: { accent: '#0EA5E9', tint: '#E0F2FE', icon: Plane, label: 'Bohol-Panglao Int’l Airport' },
  port:    { accent: '#0F766E', tint: '#CCFBF1', icon: Ship,  label: 'Tagbilaran City Port' },
  bus:     { accent: '#D97706', tint: '#FEF3C7', icon: Bus,   label: 'Dao Integrated Bus Terminal' },
};

// ---------------------------------------------------------------------------
// Site categories — icon per category (color comes from CATEGORY_COLORS in styles.ts)
// ---------------------------------------------------------------------------
export const CATEGORY_ICONS: Record<string, { icon: LucideIcon; short: string }> = {
  'Beach':              { icon: Umbrella, short: 'Beach' },
  'Marine':             { icon: Fish,     short: 'Marine' },
  'Nature / Viewpoint': { icon: Mountain, short: 'Nature' },
  'Heritage':           { icon: Landmark, short: 'Heritage' },
  'Faith':              { icon: Church,   short: 'Faith' },
  'Urban Park':         { icon: Trees,    short: 'Urban' },
};

// Helper: return { icon, accent, tint, short } for a category in one call.
export function getCategoryToken(cat: string): { icon: LucideIcon; short: string; accent: string; tint: string } {
  const meta = CATEGORY_ICONS[cat] || { icon: CircleDot, short: cat || '—' };
  const accent = CATEGORY_COLORS[cat] || '#64748B';
  return { ...meta, accent, tint: accent + '1A' };
}

// Convenience: Hotel/Restaurant/Cafe icons used in the Stay & Dining detail.
export { Hotel } from 'lucide-react';
