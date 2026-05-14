/**
 * InfiltrationBuildingChart
 *
 * Card shown in the right side panel when the "Groundwater Infiltration"
 * layer is active. Shows the count of buildings in each infiltration-
 * vulnerability class — assigned via a majority-area spatial overlay
 * (Buildings × GroundWater_Infiltration_Vulnerability) computed in PostGIS
 * (`ovl_bldg_gwi`). Headlines the count of buildings on High and Very-High
 * vulnerability ground, since these are the most critical for sanitation
 * (highest risk of groundwater contamination from pit latrines / septic
 * tanks in karst terrain).
 *
 * Styled to match the dark theme used by `BaseLayerDefaultPanel`,
 * `LayerAreaBreakdown`, `HeatStressBuildingChart` and `GroundwaterBuildingChart`.
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
import { ShieldAlert, AlertTriangle } from 'lucide-react';
import {
  useInfiltrationBuildingStats,
  type GwiBucket,
} from '../hooks/useInfiltrationBuildingStats';

interface Props {
  munName?: string | null;
  brgyName?: string | null;
}

// Dark-theme tokens.
const C = {
  cardBg: '#1E293B',
  panelBg: '#162032',
  border: '#334155',
  textPrimary: '#fff',
  textSecondary: '#E2E8F0',
  textMuted: '#94A3B8',
  high: '#FB8C00',
  veryHigh: '#C62828',
};

// Strip parenthetical detail for compact axis labels.
function shortLabel(type: string): string {
  return type.split('(')[0].trim();
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: GwiBucket }>;
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
          color: b.gwi_color,
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: b.gwi_color,
            display: 'inline-block',
          }}
        />
        {b.gwi_type}
      </div>
      <div style={{ color: C.textSecondary, fontWeight: 500 }}>
        {b.count.toLocaleString()} buildings
      </div>
    </div>
  );
}

export function InfiltrationBuildingChart({ munName, brgyName }: Props) {
  const { data, loading, error } = useInfiltrationBuildingStats(munName, brgyName);

  const highPct =
    data && data.total > 0 ? (data.highCount / data.total) * 100 : 0;
  const veryHighPct =
    data && data.total > 0 ? (data.veryHighCount / data.total) * 100 : 0;
  const combinedPct =
    data && data.total > 0 ? (data.highAndVeryHigh / data.total) * 100 : 0;

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
            background: 'rgba(198, 40, 40, 0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <ShieldAlert style={{ width: 14, height: 14, color: '#FCA5A5' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.textPrimary }}>
            Buildings by Infiltration Vulnerability
          </div>
          <div style={{ fontSize: 9, color: C.textMuted, marginTop: 2 }}>
            Majority-area overlay · Buildings × Karst Infiltration Risk
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
              border: `2px solid ${C.veryHigh}`,
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
          {/* Headline callout: High + Very High (the critical classes) */}
          <div
            style={{
              background: C.cardBg,
              borderRadius: 10,
              padding: '12px 14px',
              marginBottom: 10,
              borderLeft: `3px solid ${C.veryHigh}`,
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
              <AlertTriangle style={{ width: 12, height: 12, color: '#FCA5A5' }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: C.textSecondary }}>
                Buildings on High &amp; Very-High Vulnerability Ground
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
                  color: C.veryHigh,
                  fontSize: 22,
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                {combinedPct.toFixed(1)}%
              </span>
              <span style={{ color: C.textSecondary, fontSize: 11 }}>
                {data.highAndVeryHigh.toLocaleString()} of{' '}
                {data.total.toLocaleString()}
              </span>
            </div>

            {/* Stacked bar: High / Very High */}
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
              {veryHighPct > 0 && (
                <div style={{ width: `${veryHighPct}%`, background: C.veryHigh }} />
              )}
            </div>

            {/* High / Very High split tiles */}
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
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: C.high }} />
                  High
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.textPrimary, lineHeight: 1.1 }}>
                  {data.highCount.toLocaleString()}
                </div>
                <div style={{ fontSize: 9, color: C.textMuted }}>{highPct.toFixed(1)}%</div>
              </div>
              <div
                style={{
                  background: C.panelBg,
                  borderRadius: 8,
                  padding: '8px 10px',
                  borderLeft: `3px solid ${C.veryHigh}`,
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
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: C.veryHigh }} />
                  Very High
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.textPrimary, lineHeight: 1.1 }}>
                  {data.veryHighCount.toLocaleString()}
                </div>
                <div style={{ fontSize: 9, color: C.textMuted }}>{veryHighPct.toFixed(1)}%</div>
              </div>
            </div>
          </div>

          {/* Full breakdown chart */}
          {data.breakdown.length > 0 && (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart
                data={data.breakdown.map((b) => ({
                  ...b,
                  label: shortLabel(b.gwi_type),
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
                    <Cell key={idx} fill={entry.gwi_color} />
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
            {data.breakdown.map((b) => {
              const pct = data.total > 0 ? (b.count / data.total) * 100 : 0;
              return (
                <div
                  key={b.gwi_gridcode}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: C.cardBg,
                    borderRadius: 6,
                    padding: '5px 8px',
                    borderLeft: `3px solid ${b.gwi_color}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: b.gwi_color,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 10, color: C.textSecondary }}>
                      {shortLabel(b.gwi_type)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.textPrimary }}>
                      {b.count.toLocaleString()}
                    </span>
                    <span
                      style={{
                        background: `${b.gwi_color}25`,
                        color: b.gwi_color,
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
