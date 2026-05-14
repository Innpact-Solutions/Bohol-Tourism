/**
 * Example: Road Length Bar Chart Component
 * Displays road lengths aggregated by road type and hazard exposure level
 */

import React, { useEffect, useState } from 'react';
import { 
  fetchRoadLengthByHazard, 
  buildRoadLengthChartData,
  roadLengthCache,
  type RoadLengthChartRow 
} from '../utils/roadLengthData';
import { fetchHazardLegend } from '../utils/impactDistributionData';

interface RoadLengthChartProps {
  hazardName: string;        // e.g., 'AST_2025'
  hazardLayerId: string;     // e.g., 'GIZ_BBSR:AST_2025'
  wardId: string;            // e.g., 'ward_27' or 'all'
  roadTableName?: string;    // Optional: custom road table name
}

export function RoadLengthChart({
  hazardName,
  hazardLayerId,
  wardId,
  roadTableName = 'GIZ_BBSR:Road_Network_Hazard'
}: RoadLengthChartProps) {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<RoadLengthChartRow[]>([]);
  const [legendColors, setLegendColors] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // REMOVED: API call disabled for CWIS dashboard redevelopment
        console.log('ℹ️ [RoadLengthChart] API fetch disabled - to be redeveloped for CWIS dashboard');
        
        // 1. Fetch hazard legend colors (cached) - keeping this as it's GeoServer metadata
        const colors = await fetchHazardLegend(hazardLayerId);
        setLegendColors(colors);

        // 2. REMOVED: Cache and GeoServer fetch disabled
        // let roadData = roadLengthCache.get(hazardName, wardId);
        // if (!roadData) {
        //   roadData = await fetchRoadLengthByHazard(hazardName, wardId, roadTableName);
        //   roadLengthCache.set(hazardName, wardId, roadData);
        // }

        // Mock empty data
        const roadData: any[] = [];
        const chartRows = buildRoadLengthChartData(roadData, colors);
        setChartData(chartRows);

      } catch (err) {
        console.error('Failed to load road length data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [hazardName, hazardLayerId, wardId, roadTableName]);

  if (loading) {
    return (
      <div className="border border-[#E5E7EB] rounded-lg p-4 bg-white">
        <h3 className="text-sm font-semibold text-[#0F172A] mb-4">Road Length by Hazard Exposure</h3>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-[#F1F5F9] rounded mb-2"></div>
              <div className="h-6 bg-[#F1F5F9] rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-[#E5E7EB] rounded-lg p-4 bg-white">
        <h3 className="text-sm font-semibold text-[#0F172A] mb-4">Road Length by Hazard Exposure</h3>
        <p className="text-xs text-red-600">{error}</p>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="border border-[#E5E7EB] rounded-lg p-4 bg-white">
        <h3 className="text-sm font-semibold text-[#0F172A] mb-4">Road Length by Hazard Exposure</h3>
        <p className="text-xs text-[#64748B]">No road data available</p>
      </div>
    );
  }

  return (
    <div className="border border-[#E5E7EB] rounded-lg p-4 bg-white shadow-sm">
      <h3 className="text-sm font-semibold text-[#0F172A] mb-4">
        Road Length by Hazard Exposure
      </h3>

      <div className="space-y-4">
        {chartData.map((row, idx) => (
          <div key={idx}>
            {/* Road Type Label */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#64748B] font-medium">
                {row.roadType}
              </span>
              <span className="text-xs text-[#64748B] font-semibold">
                {row.totalLength.toFixed(1)} km total
              </span>
            </div>

            {/* Stacked Bar */}
            <div className="flex gap-0.5 h-8 rounded overflow-hidden bg-[#F1F5F9]">
              {row.segments.map((segment, segIdx) => {
                const percent = row.totalLength > 0 
                  ? (segment.lengthKm / row.totalLength) * 100 
                  : 0;
                
                if (percent === 0) return null;

                return (
                  <div
                    key={segIdx}
                    className="flex items-center justify-center transition-all duration-300 hover:opacity-80"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: segment.color
                    }}
                    title={`Level ${segment.gridcode}: ${segment.lengthKm.toFixed(1)} km (${percent.toFixed(1)}%)`}
                  >
                    {percent > 10 && (
                      <span className="text-[9px] text-white font-semibold">
                        {segment.lengthKm.toFixed(1)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center flex-wrap gap-3 mt-2">
              {row.segments.map((segment, segIdx) => (
                <div key={segIdx} className="flex items-center gap-1.5">
                  <div 
                    className="w-3 h-3 rounded" 
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className="text-[10px] text-[#64748B]">
                    L{segment.gridcode}: {segment.lengthKm.toFixed(1)} km
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
