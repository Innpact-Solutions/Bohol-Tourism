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

interface ImpactDistributionDataDrivenProps {
  infraKey: string; // 'educational', 'healthcare', 'public_amenities', 'transport_mobility'
  activeHazardLayerId: string; // e.g., 'GIZ_BBSR:AST_2025'
  activeHazardKey: string; // e.g., 'AST_2025'
  selectedWardId: string;
  subtypes: Array<{ name: string; icon: any }>;
  categoryName: string;
  activeSector: Sector;
  title?: string;
  unit?: string;
}

export function ImpactDistributionDataDriven({
  infraKey,
  activeHazardLayerId,
  activeHazardKey,
  selectedWardId,
  subtypes,
  categoryName,
  activeSector,
  title = 'Hazard Exposure Distribution',
  unit = ''
}: ImpactDistributionDataDrivenProps) {
  const [loading, setLoading] = useState(true);
  const [chartRows, setChartRows] = useState<ChartRow[]>([]);
  const [legendMap, setLegendMap] = useState<Record<number, string>>({});
  const [labelMap, setLabelMap] = useState<Record<number, string>>({});
  const [hoveredSegment, setHoveredSegment] = useState<{
    category: string;
    gridcode: number;
    count: number;
    color: string;
    percent: number;
    label: string;
    x: number;
    y: number;
  } | null>(null);

  // Animation state - triggers bar filling animation
  const [isAnimated, setIsAnimated] = useState(false);

  // Fetch data when component mounts or dependencies change
  useEffect(() => {
    if (!activeHazardLayerId || !activeHazardKey) {
      console.log('⚠️ No active hazard layer, skipping impact distribution data fetch');
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

        // Build chart rows
        const rows = buildChartRows(subtypes, counts, legend);
        
        setLegendMap(legend);
        setLabelMap(labels);
        setChartRows(rows);
        setLoading(false);

        // Trigger animation after data is loaded
        setIsAnimated(false);
        setTimeout(() => setIsAnimated(true), 50);

      } catch (error) {
        console.error('❌ Failed to fetch impact distribution data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [infraKey, activeHazardLayerId, activeHazardKey, selectedWardId, subtypes]);

  const handleMouseEnter = (e: React.MouseEvent, row: ChartRow, segment: { gridcode: number; count: number; color: string }) => {
    const total = row.total;
    const percent = total > 0 ? (segment.count / total) * 100 : 0;
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredSegment({
      category: row.subtype,
      gridcode: segment.gridcode,
      count: segment.count,
      color: segment.color,
      percent,
      label: labelMap[segment.gridcode] || '',
      x: e.clientX,
      y: rect.top
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
          {subtypes.map((_, idx) => (
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
          <p className="text-[10px] text-[#64748B]">No impacted points for this hazard layer.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-[#E5E7EB] rounded-lg p-4 bg-white shadow-sm mb-3">
      <h3 className="text-[11px] font-semibold text-[#0F172A] mb-4">{title}</h3>
      
      {categoryName && (
        <div className="mb-3 pb-2 border-b border-[#E5E7EB]">
          <h4 className="text-[10px] font-semibold text-[#0F172A]">{categoryName}</h4>
        </div>
      )}
      
      {/* Custom Tooltip - matches Road Network style */}
      {hoveredSegment && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: `${hoveredSegment.x}px`,
            top: `${hoveredSegment.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="bg-gray-900 rounded-md px-2.5 py-1.5 shadow-lg border border-gray-700">
            <div className="flex items-center gap-1.5 mb-0.5">
              <div
                className="w-2 h-2 rounded-sm flex-shrink-0"
                style={{ backgroundColor: hoveredSegment.color }}
              />
              <span className="text-white text-[10px] font-medium">
                {hoveredSegment.label && hoveredSegment.label.trim() !== '' 
                  ? hoveredSegment.label
                  : `Level ${hoveredSegment.gridcode}`
                }
              </span>
            </div>
            <div className="text-[9px] text-gray-300 font-medium pl-3.5 whitespace-nowrap">
              {hoveredSegment.count}{unit ? ` ${unit}` : ''} ({hoveredSegment.percent.toFixed(1)}%)
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-3.5">
        {chartRows.map((row, idx) => {
          const Icon = row.icon;
          const isRoadNetwork = row.subtype.includes('Highway') || row.subtype.includes('Road');
          
          // Skip rows with no data
          if (row.total === 0) return null;
          
          return (
            <div key={idx} className="space-y-2">
              {/* Category Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {Icon && !isRoadNetwork && <Icon className="w-3 h-3 text-[#0F172A]" />}
                  <span className="text-[10px] font-semibold text-[#0F172A]">{row.subtype}</span>
                </div>
                <span className="text-[9px] font-medium text-[#64748B]">
                  {Math.round(row.total)}{unit ? ` ${unit}` : ''}
                </span>
              </div>
              
              {/* Modern Stacked Bar with rounded corners and shadow - matches Road Network */}
              <div 
                className="relative flex h-3 rounded-lg overflow-hidden bg-gradient-to-r from-gray-100 to-gray-50 shadow-inner"
                style={{ border: '1px solid #E5E7EB' }}
              >
                {row.segments.map((segment, segIdx) => {
                  const percent = row.total > 0 ? (segment.count / row.total) * 100 : 0;
                  if (percent === 0) return null;
                  
                  return (
                    <div
                      key={segIdx}
                      style={{
                        width: isAnimated ? `${percent}%` : '0%',
                        backgroundColor: segment.color,
                        transition: `width 800ms ease-out ${segIdx * 50}ms`,
                      }}
                      className="relative cursor-pointer hover:opacity-90 hover:brightness-110"
                      onMouseEnter={(e) => handleMouseEnter(e, row, segment)}
                      onMouseLeave={handleMouseLeave}
                    >
                      {/* Subtle separator between segments */}
                      {segIdx < row.segments.length - 1 && (
                        <div className="absolute right-0 top-0 bottom-0 w-px bg-white/30" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}