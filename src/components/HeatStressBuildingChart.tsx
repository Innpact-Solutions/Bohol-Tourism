/**
 * HeatStressBuildingChart
 *
 * Card shown in the right side panel when the "Heat Stress Index" layer is
 * active. Shows the count of buildings in each HSI class — assigned via a
 * majority-area spatial overlay (Buildings × HS_HSI) computed in PostGIS
 * (`ovl_bldg_hsi`). Headlines the count of buildings exposed to High and
 * Extreme heat stress.
 *
 * Styled to match the dark theme used by `BaseLayerDefaultPanel` and
 * `LayerAreaBreakdown`.
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
import { Flame, AlertTriangle } from 'lucide-react';
import {
  useHeatStressBuildingStats,
  type HsiBucket,
} from '../hooks/useHeatStressBuildingStats';

interface Props {
  /** Municipality name filter (e.g. "Tagbilaran City") — pass null for all */
  munName?: string | null;
  /** Barangay name filter — pass null for all */
  brgyName?: string | null;
}

// Dark-theme tokens (match BaseLayerDefaultPanel / LayerAreaBreakdown).
const C = {
  cardBg: '#ffffff',
  panelBg: '#F8FAFC',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  high: '#fdae61',
  extreme: '#d73027',
};

function shortLabel(type: string): string {
  return type.split('(')[0].trim();
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: HsiBucket }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const b = payload[0].payload;
  return (
    <div
      style={{
        background: C.cardBg,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        padding: '8px 10px',
        color: C.textPrimary,
        fontSize: 10,
        minWidth: 140,
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
          color: b.hsi_color,
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: b.hsi_color,
            display: 'inline-block',
          }}
        />
        {b.hsi_type}
      </div>
      <div style={{ color: C.textSecondary, fontWeight: 500 }}>
        {b.count.toLocaleString()} buildings
      </div>
    </div>
  );
}

export function HeatStressBuildingChart({ munName, brgyName }: Props) {
  const { data, loading, error } = useHeatStressBuildingStats(munName, brgyName);

  const highPct =
    data && data.total > 0 ? (data.highCount / data.total) * 100 : 0;
  const extremePct =
    data && data.total > 0 ? (data.extremeCount / data.total) * 100 : 0;
  const combinedPct =
    data && data.total > 0 ? (data.highAndExtreme / data.total) * 100 : 0;

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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            background: 'rgba(220, 38, 38, 0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Flame style={{ width: 14, height: 14, color: '#FCA5A5' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.textPrimary }}>
            Buildings by Heat Stress Class
          </div>
          <div style={{ fontSize: 9, color: C.textMuted, marginTop: 2 }}>
            Majority-area overlay · Buildings × Heat Stress Index
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
              border: '2px solid #DC2626',
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
          {/* Headline callout: High + Extreme */}
          <div
            style={{
              background: C.cardBg,
              borderRadius: 10,
              padding: '12px 14px',
              marginBottom: 10,
              borderLeft: `3px solid ${C.extreme}`,
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
              <AlertTriangle
                style={{ width: 12, height: 12, color: '#FCA5A5' }}
              />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: C.textSecondary,
                }}
              >
                Buildings in High &amp; Extreme Heat Stress
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
                  color: C.extreme,
                  fontSize: 22,
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                {combinedPct.toFixed(1)}%
              </span>
              <span style={{ color: C.textSecondary, fontSize: 11 }}>
                {data.highAndExtreme.toLocaleString()} of{' '}
                {data.total.toLocaleString()}
              </span>
            </div>

            {/* Stacked bar: High / Extreme */}
            <div
              style={{
                display: 'flex',
                height: 8,
                borderRadius: 4,
                overflow: 'hidden',
                background: C.border,
              }}
            >
              {highPct > 0 && (
                <div style={{ width: `${highPct}%`, background: C.high }} />
              )}
              {extremePct > 0 && (
                <div
                  style={{ width: `${extremePct}%`, background: C.extreme }}
                />
              )}
            </div>

            {/* High / Extreme split tiles */}
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
                  borderLeft: `3px solid ${C.high}`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 9,
                    fontWeight: 600,
                    color: C.high,
                    marginBottom: 2,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      background: C.high,
                    }}
                  />
                  High
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: C.textPrimary,
                    lineHeight: 1.1,
                  }}
                >
                  {data.highCount.toLocaleString()}
                </div>
                <div style={{ fontSize: 9, color: C.textMuted }}>
                  {highPct.toFixed(1)}%
                </div>
              </div>
              <div
                style={{
                  background: C.panelBg,
                  borderRadius: 8,
                  padding: '8px 10px',
                  borderLeft: `3px solid ${C.extreme}`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 9,
                    fontWeight: 600,
                    color: '#FCA5A5',
                    marginBottom: 2,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      background: C.extreme,
                    }}
                  />
                  Extreme
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: C.textPrimary,
                    lineHeight: 1.1,
                  }}
                >
                  {data.extremeCount.toLocaleString()}
                </div>
                <div style={{ fontSize: 9, color: C.textMuted }}>
                  {extremePct.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Full breakdown chart */}
          {data.breakdown.length > 0 && (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart
                data={data.breakdown.map((b) => ({
                  ...b,
                  label: shortLabel(b.hsi_type),
                }))}
                margin={{ top: 4, right: 6, left: -18, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={C.border}
                  vertical={false}
                />
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
                  {data.breakdown.map((entry, idx) => (
                    <Cell key={idx} fill={entry.hsi_color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {/* Per-class legend rows */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              marginTop: 8,
            }}
          >
            {data.breakdown.map((b) => (
              <div
                key={b.hsi_gridcode}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: C.cardBg,
                  borderRadius: 6,
                  padding: '5px 8px',
                  borderLeft: `3px solid ${b.hsi_color}`,
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: b.hsi_color,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 10, color: C.textSecondary }}>
                    {b.hsi_type}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 6,
                  }}
                >
                  <span style={{ fontSize: 10, color: '#CBD5E1' }}>
                    {b.count.toLocaleString()}
                  </span>
                  <span
                    style={{
                      background: `${b.hsi_color}25`,
                      color: b.hsi_color,
                      fontSize: 9,
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: 8,
                    }}
                  >
                    {data.total > 0
                      ? ((b.count / data.total) * 100).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
