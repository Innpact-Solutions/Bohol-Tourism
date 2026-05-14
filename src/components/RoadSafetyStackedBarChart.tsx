/**
 * Stacked Horizontal Bar Chart for Road Safety Hazard Analysis
 * Displays safety ratings (1-5 stars) with hazard level breakdown within each bar
 * Uses the NEW by_safety_rating API data for proper cross-tabulation display
 */

import React, { useState, useEffect } from 'react';
import { RoadSafetyAnalysisResponse } from '../utils/roadSafetyAnalysis';

interface Props {
  data: RoadSafetyAnalysisResponse;
}

// Safety star colors based on iRAP standard (green for 5-star to black for 1-star)
const STAR_COLORS: Record<number, string> = {
  5: '#00AA00', // Green - 5 Star (Safest)
  4: '#76B82A', // Yellow-Green - 4 Star
  3: '#FFD700', // Yellow/Gold - 3 Star
  2: '#FF8C00', // Dark Orange - 2 Star
  1: '#000000', // Black - 1 Star (Least Safe)
};

// Helper function to get simplified label from gridcode_type
function getSimplifiedLabel(gridcodeType: string): string {
  const type = gridcodeType.toLowerCase();
  
  // Skip "NA" gridcodes
  if (type === 'na' || type === 'n/a') {
    return '';
  }
  
  // Map common hazard levels
  if (type.includes('low') || type === '1') {
    return 'Low';
  }
  if (type.includes('moderate') || type.includes('medium') || type === '2') {
    return 'Moderate';
  }
  if (type.includes('high') || type === '3') {
    return 'High';
  }
  if (type.includes('extreme') || type.includes('very high') || type === '4') {
    return 'Extreme';
  }
  
  // For temperature ranges
  if (type.includes('< 25') || type.includes('<25')) {
    return 'Low';
  }
  if (type.includes('25') && type.includes('28')) {
    return 'Moderate';
  }
  if (type.includes('28') && type.includes('30')) {
    return 'High';
  }
  if (type.includes('> 30') || type.includes('>30') || type.includes('30')) {
    return 'Extreme';
  }
  
  // Otherwise use the original type
  return gridcodeType;
}

// Helper function to get star rating from gridcode (for fallback display when by_safety_rating is not available)
function getStarRatingFromGridcode(gridcode: number): { stars: number; label: string } {
  const starMap: Record<number, { stars: number; label: string }> = {
    1: { stars: 5, label: '5-Star' },
    2: { stars: 4, label: '4-Star' },
    3: { stars: 3, label: '3-Star' },
    4: { stars: 2, label: '2-Star' },
    5: { stars: 1, label: '1-Star' }
  };
  
  return starMap[gridcode] || { stars: 0, label: 'Unknown' };
}

export function RoadSafetyStackedBarChart({ data }: Props) {
  // Tooltip state
  const [hoveredSegment, setHoveredSegment] = useState<{
    label: string;
    value: number;
    color: string;
    x: number;
    y: number;
    percentage: number;
  } | null>(null);

  // Animation state - triggers bar filling animation
  const [isAnimated, setIsAnimated] = useState(false);

  // Trigger animation on mount or data change
  useEffect(() => {
    setIsAnimated(false);
    const timer = setTimeout(() => setIsAnimated(true), 50);
    return () => clearTimeout(timer);
  }, [data.analysis_id]);

  // Tooltip handlers
  const handleMouseMove = (segment: any, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setHoveredSegment({
      label: segment.label,
      value: segment.value,
      color: segment.color,
      x: event.clientX,
      y: rect.top - 8,
      percentage: segment.percentage,
    });
  };

  // Check if this is mock/fallback data (indicated by negative analysis_id)
  const isMockData = data.analysis_id < 0;
  
  // If backend is unavailable, show only the warning - NO DUMMY DATA
  if (isMockData) {
    return (
      <div className="border border-[#E5E7EB] rounded-lg p-4 bg-white shadow-sm mb-3">
        <h3 className="text-[11px] font-semibold text-[#0F172A] mb-3">
          Road Safety by Star Rating
        </h3>
        
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-[10px] text-yellow-800 flex items-start gap-2">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <div className="font-semibold mb-1">Backend API Unavailable</div>
            <div>The analysis backend is currently not reachable. Data will load automatically when the connection is restored.</div>
          </div>
        </div>
      </div>
    );
  }
  
  // Try to get by_safety_rating data
  const bySafetyRating = data.by_safety_rating;
  
  // Get vehicle type for title
  const vehicleType = data.vehicle_type_filter || 'All Vehicles';
  const vehicleTypeLabel = vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1);
  
  // Check if we have safety rating data with hazard breakdown
  // The backend should return entries with gridcode columns like: { star_rating: 5, star_label: "5-Star", total_km: 23.6, "1": 4.5, "2": 19.0 }
  const hasSafetyRatingData = bySafetyRating && bySafetyRating.length > 0;
  
  // Check if the safety rating entries have gridcode breakdown (numeric keys)
  const hasGridcodeBreakdown = hasSafetyRatingData && bySafetyRating[0] && 
    data.gridcodes.some(gc => bySafetyRating[0].hasOwnProperty(String(gc)));
  
  console.log('🔍 [RoadSafetyStackedBarChart] Data check:', {
    hasSafetyRatingData,
    hasGridcodeBreakdown,
    safetyRatingCount: bySafetyRating?.length || 0,
    sampleEntry: bySafetyRating?.[0],
    gridcodes: data.gridcodes
  });
  
  // If we don't have the necessary data structure from the API, show a message
  if (!hasSafetyRatingData || !hasGridcodeBreakdown) {
    return (
      <div className="border border-[#E5E7EB] rounded-lg p-4 bg-white shadow-sm mb-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[11px] font-semibold text-[#0F172A]">
            Road Safety by Star Rating & Hazard Level
          </h3>
          <span className="text-[9px] text-[#64748B] bg-[#F8FAFC] px-2 py-0.5 rounded">
            {vehicleTypeLabel}
          </span>
        </div>
        
        <div className="p-3 bg-blue-50 border border-blue-200 rounded text-[10px] text-blue-800 flex items-start gap-2">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <div className="font-semibold mb-1">Cross-Tabulation Data Required</div>
            <div>The backend API needs to provide hazard breakdown by safety rating. Please contact the backend team to add a <code className="bg-blue-100 px-1 rounded text-[9px]">by_safety_rating</code> field that contains hazard gridcode breakdown for each iRAP star rating (similar to <code className="bg-blue-100 px-1 rounded text-[9px]">by_road_type</code> in the road network analysis).</div>
          </div>
        </div>
        
        {/* Show summary data that we do have */}
        <div className="mt-3 pt-3 border-t border-[#E5E7EB]">
          <div className="text-[10px] text-[#64748B] mb-2">Available Data (Total Length by Rating):</div>
          <div className="space-y-1">
            {data.by_gridcode.map(item => {
              const rating = getStarRatingFromGridcode(item.gridcode);
              if (rating.stars === 0) return null;
              
              return (
                <div key={item.gridcode} className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: STAR_COLORS[rating.stars] }}
                    />
                    <span 
                      className="font-semibold"
                      style={{ color: STAR_COLORS[rating.stars] }}
                    >
                      {rating.label}
                    </span>
                    <div className="flex items-center gap-0.5">
                      {[...Array(rating.stars)].map((_, i) => (
                        <svg key={i} className="w-2.5 h-2.5" fill={STAR_COLORS[rating.stars]} viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <span className="text-[#64748B]">{item.length_km.toFixed(1)} km</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
  
  // If we have the proper data structure, display the stacked bar chart
  return (
    <div className="border border-[#E5E7EB] rounded-lg p-4 bg-white shadow-sm mb-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[11px] font-semibold text-[#0F172A]">
          Road Safety by Star Rating & Hazard Level
        </h3>
        <div className="flex items-center gap-2">
          {/* Ward Filter Indicator */}
          {data.ward_filter && (
            <span className="text-[9px] text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#2563EB]/20 flex items-center gap-1">
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              Ward {data.ward_filter}
            </span>
          )}
          {/* Vehicle Type Badge */}
          <span className="text-[9px] text-[#64748B] bg-[#F8FAFC] px-2 py-0.5 rounded">
            {vehicleTypeLabel}
          </span>
        </div>
      </div>
      
      <div className="space-y-4">
        {bySafetyRating.map((rating, index) => {
          // Calculate percentages for each hazard gridcode
          const segments: Array<{
            gridcode: string;
            value: number;
            percentage: number;
            color: string;
            label: string;
            type: string;
          }> = [];
          
          data.gridcodes.forEach(gc => {
            const gcStr = String(gc);
            const value = rating[gcStr];
            const numValue = typeof value === 'number' ? value : 0;
            
            if (numValue > 0) {
              const percentage = (numValue / rating.total_km) * 100;
              const type = data.gridcode_types[gcStr] || `Level ${gc}`;
              const label = getSimplifiedLabel(type);
              
              // Skip NA segments
              if (label === '') return;
              
              segments.push({
                gridcode: gcStr,
                value: numValue,
                percentage,
                color: data.gridcode_colors[gcStr] || '#ccc',
                label,
                type,
              });
            }
          });
          
          return (
            <div key={index} className="space-y-1.5">
              {/* Star Rating Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span 
                    className="text-[11px] font-semibold"
                    style={{ color: STAR_COLORS[rating.safety_rating] }}
                  >
                    {rating.star_label}
                  </span>
                  <div className="flex items-center gap-0.5">
                    {[...Array(rating.safety_rating)].map((_, i) => (
                      <svg key={i} className="w-3.5 h-3.5" fill={STAR_COLORS[rating.safety_rating]} viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <span className="text-[10px] text-[#64748B] flex-shrink-0">
                  {rating.total_km.toFixed(1)} km total
                </span>
              </div>
              
              {/* Stacked Bar - Shows hazard breakdown within this safety rating */}
              <div className="flex h-2 rounded-full overflow-hidden bg-[#F3F4F6]">
                {segments.map((segment, segIndex) => (
                  <div
                    key={segIndex}
                    style={{
                      width: isAnimated ? `${segment.percentage}%` : '0%',
                      backgroundColor: segment.color,
                      transition: `width 800ms ease-out ${segIndex * 50}ms`,
                    }}
                    className="cursor-pointer hover:opacity-80"
                    onMouseMove={(e) => handleMouseMove(segment, e)}
                    onMouseLeave={() => setHoveredSegment(null)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Tooltip */}
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
                {hoveredSegment.label}
              </span>
            </div>
            <div className="text-[9px] text-gray-300 font-medium pl-3.5 whitespace-nowrap">
              {hoveredSegment.value.toFixed(2)} km ({hoveredSegment.percentage.toFixed(1)}%)
            </div>
          </div>
        </div>
      )}
      
      {/* Summary Footer */}
      <div className="mt-4 pt-3 border-t border-[#E5E7EB]">
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="flex justify-between">
            <span className="text-[#64748B]">Total Network:</span>
            <span className="text-[#0F172A] font-semibold">
              {data.total_length_km.toFixed(1)} km
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#64748B]">Roads Analyzed:</span>
            <span className="text-[#0F172A] font-semibold">
              {data.metadata.roads_count}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}