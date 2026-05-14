import React, { useEffect, useState } from 'react';
import type { Sector } from '../App';
import {
  fetchHazardLegend,
  fetchHazardLegendLabels,
  fetchInfrastructurePointCounts,
  buildChartRows,
  impactDataCache,
  type ChartRow
} from '../utils/impactDistributionData';

interface DetailedBreakdownDataDrivenProps {
  infraKey: string; // 'educational', 'healthcare', 'public_amenities', 'transport_mobility'
  activeHazardLayerId: string; // e.g., 'GIZ_BBSR:AST_2025'
  activeHazardKey: string; // e.g., 'AST_2025'
  selectedWardId: string;
  selectedSubtypes: string[]; // Array of selected sub-layer names
  subtypes: Array<{ name: string; icon: any }>; // All available subtypes
  categoryName: string;
  activeSector: Sector;
  title?: string;
  unit?: string;
}

export function DetailedBreakdownDataDriven({
  infraKey,
  activeHazardLayerId,
  activeHazardKey,
  selectedWardId,
  selectedSubtypes,
  subtypes,
  categoryName,
  activeSector,
  title = 'Hazard Exposure Distribution - Selected Categories',
  unit = ''
}: DetailedBreakdownDataDrivenProps) {
  const [loading, setLoading] = useState(true);
  const [chartRows, setChartRows] = useState<ChartRow[]>([]);
  const [legendMap, setLegendMap] = useState<Record<number, string>>({});
  const [labelMap, setLabelMap] = useState<Record<number, string>>({});
  const [hoveredSegment, setHoveredSegment] = useState<{ category: string; gridcode: number; count: number; color: string; percent: number; label: string } | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Fetch data when component mounts or dependencies change
  useEffect(() => {
    if (!activeHazardLayerId || !activeHazardKey) {
      console.log('⚠️ No active hazard layer, skipping detailed breakdown data fetch');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      
      try {
        // Check cache first
        const legendCacheKey = activeHazardLayerId;
        const labelCacheKey = activeHazardLayerId;
        const countsCacheKey = `${infraKey}::${activeHazardKey}::${selectedWardId}`;
        
        let legend = impactDataCache.getLegend(legendCacheKey);
        let labels = impactDataCache.getLabels(labelCacheKey);
        let counts = impactDataCache.getCounts(countsCacheKey);

        // Fetch legend if not cached
        if (!legend) {
          console.log(`🎨 Fetching legend for ${activeHazardLayerId}...`);
          legend = await fetchHazardLegend(activeHazardLayerId);
          impactDataCache.setLegend(legendCacheKey, legend);
        } else {
          console.log(`✅ Using cached legend for ${activeHazardLayerId}`);
        }

        // Fetch labels if not cached
        if (!labels) {
          console.log(`🏷️ Fetching labels for ${activeHazardLayerId}...`);
          labels = await fetchHazardLegendLabels(activeHazardLayerId);
          impactDataCache.setLabels(labelCacheKey, labels);
        } else {
          console.log(`✅ Using cached labels for ${activeHazardLayerId}`);
        }

        // Fetch counts if not cached
        if (!counts) {
          console.log(`📊 Fetching counts for ${infraKey} / ${activeHazardKey}...`);
          counts = await fetchInfrastructurePointCounts(
            infraKey,
            activeHazardKey,
            'Category',
            selectedWardId === 'all' ? undefined : selectedWardId
          );
          impactDataCache.setCounts(countsCacheKey, counts);
        } else {
          console.log(`✅ Using cached counts for ${countsCacheKey}`);
        }

        // Filter subtypes to only include selected ones
        const filteredSubtypes = subtypes.filter(st => selectedSubtypes.includes(st.name));

        // Build chart rows
        const rows = buildChartRows(filteredSubtypes, counts, legend);
        
        setLegendMap(legend);
        setLabelMap(labels);
        setChartRows(rows);
        setLoading(false);

      } catch (error) {
        console.error('❌ Failed to fetch detailed breakdown data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [infraKey, activeHazardLayerId, activeHazardKey, selectedWardId, selectedSubtypes, subtypes]);

  const handleMouseEnter = (e: React.MouseEvent, row: ChartRow, segment: { gridcode: number; count: number; color: string }) => {
    const total = row.total;
    const percent = total > 0 ? (segment.count / total) * 100 : 0;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ x: e.clientX, y: rect.top });
    setHoveredSegment({
      category: row.subtype,
      gridcode: segment.gridcode,
      count: segment.count,
      color: segment.color,
      percent,
      label: labelMap[segment.gridcode] || ''
    });
  };

  const handleMouseLeave = () => {
    setHoveredSegment(null);
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="border border-[#E5E7EB] rounded-lg p-3 bg-white shadow-sm mb-3">
        <h3 className="text-[11px] font-semibold text-[#0F172A] mb-3">{title}</h3>
        {categoryName && (
          <div className="mb-2 pb-1.5 border-b border-[#E5E7EB]">
            <h4 className="text-[10px] font-semibold text-[#0F172A]">{categoryName}</h4>
          </div>
        )}
        <div className="space-y-3">
          {selectedSubtypes.map((_, idx) => (
            <div key={idx} className="animate-pulse">
              <div className="h-4 bg-[#F1F5F9] rounded mb-1.5"></div>
              <div className="h-2 bg-[#F1F5F9] rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // No data state
  if (chartRows.length === 0 || chartRows.every(row => row.total === 0)) {
    return (
      <div className="border border-[#E5E7EB] rounded-lg p-3 bg-white shadow-sm mb-3">
        <h3 className="text-[11px] font-semibold text-[#0F172A] mb-3">{title}</h3>
        {categoryName && (
          <div className="mb-2 pb-1.5 border-b border-[#E5E7EB]">
            <h4 className="text-[10px] font-semibold text-[#0F172A]">{categoryName}</h4>
          </div>
        )}
        <div className="text-center py-4">
          <p className="text-[10px] text-[#64748B]">No impacted points for selected categories.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-[#E5E7EB] rounded-lg p-3 bg-white shadow-sm mb-3">
      <h3 className="text-[11px] font-semibold text-[#0F172A] mb-3">{title}</h3>
      
      {categoryName && (
        <div className="mb-2 pb-1.5 border-b border-[#E5E7EB]">
          <h4 className="text-[10px] font-semibold text-[#0F172A]">{categoryName}</h4>
        </div>
      )}
      
      {/* Tooltip */}
      {hoveredSegment && (
        <div 
          className="fixed z-[100000] bg-[#1E293B] text-white px-2.5 py-1.5 rounded shadow-lg pointer-events-none"
          style={{ 
            left: `${tooltipPos.x}px`, 
            top: `${tooltipPos.y - 40}px`,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="text-[10px] font-semibold">{hoveredSegment.category}</div>
          <div className="text-[9px]">
            {hoveredSegment.label && hoveredSegment.label.trim() !== '' 
              ? `${hoveredSegment.label}: ${hoveredSegment.count}${unit ? ` ${unit}` : ''} (${hoveredSegment.percent.toFixed(1)}%)`
              : `Level ${hoveredSegment.gridcode}: ${hoveredSegment.count}${unit ? ` ${unit}` : ''} (${hoveredSegment.percent.toFixed(1)}%)`
            }
          </div>
        </div>
      )}
      
      <div className="space-y-3">
        {chartRows.map((row, idx) => {
          const Icon = row.icon;
          
          // Skip rows with no data
          if (row.total === 0) return null;
          
          return (
            <div key={idx}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  {Icon && <Icon className="w-3 h-3 text-[#64748B]" />}
                  <span className="text-[10px] text-[#64748B] font-medium">{row.subtype}</span>
                </div>
                <span className="text-[10px] text-[#64748B] font-semibold">
                  {Math.round(row.total)}{unit ? ` ${unit}` : ''} total
                </span>
              </div>
              
              {/* Stacked progress bar */}
              <div className="flex gap-0.5 h-2 rounded-full overflow-hidden bg-[#F1F5F9]">
                {row.segments.map((segment, segIdx) => {
                  const percent = row.total > 0 ? (segment.count / row.total) * 100 : 0;
                  if (percent === 0) return null;
                  
                  return (
                    <div 
                      key={segIdx}
                      className="transition-all duration-500 cursor-pointer hover:opacity-80"
                      style={{ 
                        width: `${percent}%`, 
                        backgroundColor: segment.color 
                      }}
                      onMouseEnter={(e) => handleMouseEnter(e, row, segment)}
                      onMouseLeave={handleMouseLeave}
                    />
                  );
                })}
              </div>
              
              {/* Legend with gridcode levels */}
              <div className="flex items-center flex-wrap gap-2 mt-1">
                {row.segments.map((segment, segIdx) => (
                  <div key={segIdx} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: segment.color }} />
                    <span className="text-[9px] text-[#64748B]">
                      {labelMap[segment.gridcode] || `L${segment.gridcode}`}: {segment.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
