/**
 * GroundwaterBuildingChart
 *
 * Bar chart shown in the right side panel when the "Groundwater Depth" layer
 * is active. Shows the count of buildings in each depth level, colour-coded
 * to match the map legend. Hovering a bar reveals the use-type breakdown.
 *
 * Styled to match the dark theme used by `BaseLayerDefaultPanel`,
 * `LayerAreaBreakdown` and `HeatStressBuildingChart`.
 */
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Droplets, AlertTriangle } from 'lucide-react';
import { useGroundwaterBuildingStats, type DepthBucket } from '../hooks/useGroundwaterBuildingStats';

interface Props {
  /** Municipality name filter (e.g. "Tagbilaran City") — pass null for all */
  munName?: string | null;
  /** Barangay name filter — pass null for all */
  brgyName?: string | null;
}

// Dark-theme tokens (match BaseLayerDefaultPanel / LayerAreaBreakdown /
// HeatStressBuildingChart).
const C = {
  cardBg: '#ffffff',
  panelBg: '#F8FAFC',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  accent: '#0EA5E9',
  accentSoft: '#7DD3FC',
};

// Short axis labels to keep the chart readable
const SHORT_LABEL: Record<string, string> = {
  '0 - 2 m':   '0–2 m',
  '2 - 5 m':   '2–5 m',
  '5 - 10 m':  '5–10 m',
  '10 - 25 m': '10–25 m',
  '> 25 m':    '>25 m',
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: DepthBucket }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const bucket = payload[0].payload;

  return (
    <div
      style={{
        background: C.cardBg,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        padding: '8px 10px',
        color: C.textPrimary,
        fontSize: 10,
        minWidth: 160,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 11,
          fontWeight: 600,
          marginBottom: 4,
          color: bucket.gw_color,
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: bucket.gw_color,
            display: 'inline-block',
          }}
        />
        {bucket.gw_type}
      </div>
      <div style={{ color: C.textSecondary, fontWeight: 500, marginBottom: 6 }}>
        {bucket.count.toLocaleString()} buildings
      </div>
      {bucket.use_type_breakdown.map((ut) => (
        <div
          key={ut.use_type}
          style={{ display: 'flex', justifyContent: 'space-between', gap: 12, color: C.textMuted }}
        >
          <span>{ut.use_type}</span>
          <span style={{ color: C.textSecondary, fontWeight: 500 }}>
            {ut.count.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

export function GroundwaterBuildingChart({ munName, brgyName }: Props) {
  const { data, loading, error } = useGroundwaterBuildingStats(munName, brgyName);

  // "Shallow" callout combines the two shallowest depth classes (0–2 m and
  // 2–5 m) — buildings here face the highest groundwater-related sanitation
  // risk (e.g. pit-latrine contamination, septic-tank flotation).
  const shallow02 = data?.breakdown.find((b) => b.gw_type === '0 - 2 m');
  const shallow25 = data?.breakdown.find((b) => b.gw_type === '2 - 5 m');
  const shallow02Count = shallow02?.count ?? 0;
  const shallow25Count = shallow25?.count ?? 0;
  const shallowTotal = shallow02Count + shallow25Count;
  const shallowColor = shallow02?.gw_color ?? '#0EA5E9';
  const shallow25Color = shallow25?.gw_color ?? '#38BDF8';
  const total = data?.total ?? 0;
  const pct02 = total > 0 ? (shallow02Count / total) * 100 : 0;
  const pct25 = total > 0 ? (shallow25Count / total) * 100 : 0;
  const pctShallow = total > 0 ? (shallowTotal / total) * 100 : 0;

  return (
    <div
      style={{
        background: C.panelBg,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        padding: 12,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            background: 'rgba(14, 165, 233, 0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Droplets style={{ width: 14, height: 14, color: C.accentSoft }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.textPrimary }}>
            Buildings by Groundwater Depth
          </div>
          <div style={{ fontSize: 9, color: C.textMuted, marginTop: 2 }}>
            Count per depth level · majority-area assignment
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 0',
            gap: 8,
          }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              border: `2px solid ${C.accent}`,
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          <span style={{ fontSize: 10, color: C.textMuted }}>Loading…</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div
          style={{
            padding: '16px 0',
            textAlign: 'center',
            fontSize: 10,
            color: '#F87171',
          }}
        >
          Failed to load data: {error}
        </div>
      )}

      {data && !loading && (
        <>
          {/* Headline callout: Shallow (0–2 m + 2–5 m) */}
          <div
            style={{
              background: C.cardBg,
              borderRadius: 10,
              padding: '12px 14px',
              marginBottom: 10,
              borderLeft: `3px solid ${shallowColor}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 6,
              }}
            >
              <AlertTriangle style={{ width: 12, height: 12, color: C.accentSoft }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: C.textSecondary }}>
                Buildings on Shallow Groundwater (0–5 m)
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 8,
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  color: shallowColor,
                  fontSize: 22,
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                {pctShallow.toFixed(1)}%
              </span>
              <span style={{ color: C.textSecondary, fontSize: 11 }}>
                {shallowTotal.toLocaleString()} of {total.toLocaleString()}
              </span>
            </div>

            {/* Stacked bar: 0–2 m / 2–5 m */}
            <div
              style={{
                display: 'flex',
                height: 8,
                borderRadius: 4,
                overflow: 'hidden',
                background: C.border,
              }}
            >
              {pct02 > 0 && <div style={{ width: `${pct02}%`, background: shallowColor }} />}
              {pct25 > 0 && <div style={{ width: `${pct25}%`, background: shallow25Color }} />}
            </div>

            {/* 0–2 / 2–5 split tiles */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
                marginTop: 10,
              }}
            >
              <div
                style={{
                  background: C.panelBg,
                  borderRadius: 8,
                  padding: '8px 10px',
                  borderLeft: `3px solid ${shallowColor}`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 9,
                    fontWeight: 600,
                    color: shallowColor,
                    marginBottom: 2,
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: shallowColor }} />
                  0–2 m
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.textPrimary, lineHeight: 1.1 }}>
                  {shallow02Count.toLocaleString()}
                </div>
                <div style={{ fontSize: 9, color: C.textMuted }}>{pct02.toFixed(1)}%</div>
              </div>
              <div
                style={{
                  background: C.panelBg,
                  borderRadius: 8,
                  padding: '8px 10px',
                  borderLeft: `3px solid ${shallow25Color}`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 9,
                    fontWeight: 600,
                    color: shallow25Color,
                    marginBottom: 2,
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: shallow25Color }} />
                  2–5 m
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.textPrimary, lineHeight: 1.1 }}>
                  {shallow25Count.toLocaleString()}
                </div>
                <div style={{ fontSize: 9, color: C.textMuted }}>{pct25.toFixed(1)}%</div>
              </div>
            </div>
          </div>

          {/* Bar chart */}
          <ResponsiveContainer width="100%" height={160}>
            <BarChart
              data={data.breakdown.map((b) => ({
                ...b,
                label: SHORT_LABEL[b.gw_type] ?? b.gw_type,
              }))}
              margin={{ top: 4, right: 6, left: -18, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: C.textMuted }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: C.textMuted }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                }
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
              />
              <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={36}>
                {data.breakdown.map((entry, index) => (
                  <Cell key={index} fill={entry.gw_color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Per-class legend rows */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              marginTop: 8,
            }}
          >
            {data.breakdown.map((b) => {
              const pct = data.total > 0 ? (b.count / data.total) * 100 : 0;
              return (
                <div
                  key={b.gw_type}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: C.cardBg,
                    borderRadius: 6,
                    padding: '5px 8px',
                    borderLeft: `3px solid ${b.gw_color}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: b.gw_color,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 10, color: C.textSecondary }}>
                      {b.gw_type}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.textPrimary }}>
                      {b.count.toLocaleString()}
                    </span>
                    <span
                      style={{
                        background: `${b.gw_color}25`,
                        color: b.gw_color,
                        fontSize: 9,
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: 8,
                      }}
                    >
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
