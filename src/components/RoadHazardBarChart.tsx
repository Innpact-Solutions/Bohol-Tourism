/**
 * Road Hazard Bar Chart Component (Custom API Version)
 * 
 * Demonstrates fetching from custom REST API endpoint and rendering
 * a stacked bar chart with legend colors and labels.
 */

import React, { useEffect, useState, useCallback } from 'react';
// REMOVED: API imports disabled for CWIS dashboard redevelopment
// import { 
//   roadHazardLengthClient, 
//   transformToChartData,
//   type ChartRow 
// } from '../utils/customApiClient';
import { fetchHazardLegend, fetchHazardLegendLabels } from '../utils/impactDistributionData';

// Type definition moved here since it's no longer imported
export interface ChartRow {
  category: string;      // e.g., "NH", "SH" (road type or subtype)
  segments: Array<{
    gridcode: number;
    value: number;        // length_km or count
    color: string;
    label: string;        // e.g., "Low", "Moderate", "High"
  }>;
  total: number;
}

interface RoadHazardBarChartProps {
  hazardName: string;       // e.g., 'AST_2025'
  hazardLayerId: string;    // e.g., 'GIZ_BBSR:AST_2025' (for legend colors)
  selectedWardId?: string;  // e.g., 'ward_27' or 'all'
}

export function RoadHazardBarChart({
  hazardName,
  hazardLayerId,
  selectedWardId = 'all',
}: RoadHazardBarChartProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartRow[]>([]);
  const [legendColors, setLegendColors] = useState<Record<number, string>>({});
  const [legendLabels, setLegendLabels] = useState<Record<number, string>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log(`📊 Loading chart data for ${hazardName}, ward: ${selectedWardId}`);

      // 1. Fetch legend colors and labels (cached via GeoServer)
      const [colors, labels] = await Promise.all([
        fetchHazardLegend(hazardLayerId),
        fetchHazardLegendLabels(hazardLayerId),
      ]);

      setLegendColors(colors);
      setLegendLabels(labels);

      // REMOVED: API call disabled for CWIS dashboard redevelopment
      console.log('ℹ️ [RoadHazardBarChart] API fetch disabled - to be redeveloped for CWIS dashboard');
      
      // 2. Parse ward number (not used without API)
      // const wardNumber = selectedWardId === 'all' 
      //   ? null 
      //   : parseInt(selectedWardId.split('_')[1]);

      // 3. REMOVED: Fetch road hazard data from custom API
      // const response = await roadHazardLengthClient.fetch(hazardName, wardNumber);
      // const chartRows = transformToChartData(response.rows, colors, labels);
      
      // Mock empty data
      const chartRows: ChartRow[] = [];
      setChartData(chartRows);

    } catch (err) {
      console.error('Failed to load chart data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [hazardName, hazardLayerId, selectedWardId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Loading state
  if (loading) {
    return (
      <div className="border border-[#E5E7EB] rounded-lg p-4 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 bg-[#F1F5F9] rounded w-48 animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i}>
              <div className="h-4 bg-[#F1F5F9] rounded w-24 mb-2 animate-pulse"></div>
              <div className="h-8 bg-[#F1F5F9] rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="border border-[#E5E7EB] rounded-lg p-4 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[#0F172A]">
            Road Length by Hazard Exposure
          </h3>
        </div>
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <p className="text-xs text-red-700">{error}</p>
          <button
            onClick={() => loadData()}
            className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (chartData.length === 0) {
    return (
      <div className="border border-[#E5E7EB] rounded-lg p-4 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[#0F172A]">
            Road Length by Hazard Exposure
          </h3>
        </div>
        <p className="text-xs text-[#64748B]">No data available for selected filters</p>
      </div>
    );
  }

  return (
    <div className="border border-[#E5E7EB] rounded-lg p-4 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#0F172A]">
          Road Length by Hazard Exposure
        </h3>
        {/* REMOVED: Refresh button (API disabled)
        <button
          onClick={() => {
            roadHazardLengthClient.clearCache();
            loadData();
          }}
          className="text-xs text-[#2563EB] hover:text-[#1D4ED8] transition-colors"
          title="Refresh data"
        >
          ↻ Refresh
        </button>
        */}
      </div>

      {/* Chart */}
      <div className="space-y-4">
        {chartData.map((row, idx) => (
          <div key={idx}>
            {/* Row Label */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#64748B] font-medium">
                {row.category}
              </span>
              <span className="text-xs text-[#0F172A] font-semibold">
                {row.total.toFixed(1)} km
              </span>
            </div>

            {/* Stacked Bar */}
            <div className="relative flex gap-0.5 h-10 rounded overflow-hidden bg-[#F1F5F9]">
              {row.segments.map((segment, segIdx) => {
                const percent = row.total > 0 
                  ? (segment.value / row.total) * 100 
                  : 0;

                if (percent < 0.5) return null; // Skip very small segments

                return (
                  <div
                    key={segIdx}
                    className="group relative flex items-center justify-center transition-all duration-200 hover:opacity-90 cursor-pointer"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: segment.color,
                    }}
                  >
                    {/* Value label (show if segment is wide enough) */}
                    {percent > 12 && (
                      <span className="text-[10px] text-white font-semibold drop-shadow">
                        {segment.value.toFixed(1)}
                      </span>
                    )}

                    {/* Hover tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#0F172A] text-white text-[10px] rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {segment.label}: {segment.value.toFixed(2)} km ({percent.toFixed(1)}%)
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#0F172A]"></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center flex-wrap gap-3 mt-2">
              {row.segments.map((segment, segIdx) => (
                <div key={segIdx} className="flex items-center gap-1.5">
                  <div 
                    className="w-3 h-3 rounded border border-white shadow-sm" 
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className="text-[10px] text-[#64748B]">
                    {segment.label}: {segment.value.toFixed(1)} km
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer info */}
      <div className="mt-4 pt-3 border-t border-[#E5E7EB]">
        <p className="text-[9px] text-[#94A3B8]">
          Data source: Custom API • Hazard: {hazardName} • Ward: {selectedWardId === 'all' ? 'All' : selectedWardId.split('_')[1]}
        </p>
      </div>
    </div>
  );
}