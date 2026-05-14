/**
 * Road Name Star Rating Distribution Chart
 * Horizontal bar chart showing star rating breakdown by road name
 * UI matches Road Network Exposed chart
 * Uses GeoServer data for accurate star rating distribution
 */

import React, { useState, useEffect, useRef } from 'react';
import { ArrowUpDown, RotateCcw } from 'lucide-react';
import { fetchRoadStarRatingsByName, RoadStarRatingByName } from '../utils/roadSafetyData';

interface Props {
  vehicleType: 'vehicle' | 'motorcycle' | 'pedestrian' | 'bicyclist';
  selectedWardId?: string;
  selectedRoadName?: string;
  onSegmentClick?: (roadName: string, starRating: string, vehicleType: string) => void; // NEW: Callback when segment is clicked
  onReset?: () => void; // NEW: Callback when reset button is clicked
}

// Safety star colors based on iRAP standard (green for 5-star to black for 1-star)
const STAR_COLORS: Record<number, string> = {
  5: '#93c060', // Green - 5 Star (Safest) - matches donut chart
  4: '#fdf05e', // Yellow - 4 Star - matches donut chart
  3: '#eda308', // Amber/Orange - 3 Star - matches donut chart
  2: '#e65336', // Red - 2 Star - matches donut chart
  1: '#262626', // Black - 1 Star (Least Safe) - matches donut chart
};

// Map vehicle type to GeoServer field name
const VEHICLE_TYPE_FIELD_MAP: Record<string, 'Vehicle_St' | 'Motorcycli' | 'Bicyclist_' | 'Pedestrian'> = {
  'vehicle': 'Vehicle_St',
  'motorcycle': 'Motorcycli',
  'pedestrian': 'Pedestrian',
  'bicyclist': 'Bicyclist_',
};

type SortOption = 'total_length' | 'name_asc' | 'safest' | 'least_safe';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'total_length', label: 'Total Length' },
  { value: 'safest', label: 'Safest Roads' },
  { value: 'least_safe', label: 'Least Safe Roads' },
  { value: 'name_asc', label: 'Name' },
];

export function RoadNameStarRatingChart({ vehicleType, selectedWardId, selectedRoadName, onSegmentClick, onReset }: Props) {
  const [data, setData] = useState<RoadStarRatingByName[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('total_length');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  
  // Tooltip state
  const [hoveredSegment, setHoveredSegment] = useState<{
    label: string;
    stars: number;
    value: number;
    color: string;
    x: number;
    y: number;
    percentage: number;
  } | null>(null);

  // Animation state - triggers bar filling animation
  const [isAnimated, setIsAnimated] = useState(false);

  // Close sort menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setShowSortMenu(false);
      }
    };

    if (showSortMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSortMenu]);

  // Fetch data from GeoServer
  useEffect(() => {
    let isCancelled = false;

    const loadData = async () => {
      // Don't reset animation or show loading on subsequent loads
      const isInitialLoad = data.length === 0;
      
      if (isInitialLoad) {
        setLoading(true);
      }
      
      try {
        const fieldName = VEHICLE_TYPE_FIELD_MAP[vehicleType];
        const result = await fetchRoadStarRatingsByName(fieldName, selectedWardId, selectedRoadName);
        
        if (!isCancelled) {
          setData(result);
          setLoading(false);
          
          // Only trigger animation on first load
          if (isInitialLoad) {
            setTimeout(() => {
              setIsAnimated(true);
            }, 50);
          }
        }
      } catch (error) {
        console.error('Error fetching road star ratings:', error);
        if (!isCancelled) {
          setData([]);
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [vehicleType, selectedWardId, selectedRoadName]);

  // Remove the effect that resets animation on data/sort changes
  // This was causing the flicker
  // useEffect(() => {
  //   setIsAnimated(false);
  //   const timer = setTimeout(() => setIsAnimated(true), 50);
  //   return () => clearTimeout(timer);
  // }, [data, sortBy]);

  const handleMouseEnter = (segment: any, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setHoveredSegment({
      label: segment.label,
      stars: segment.stars,
      value: segment.value,
      color: segment.color,
      x: event.clientX,
      y: rect.top - 8,
      percentage: segment.percentage,
    });
  };

  const handleMouseMove = (segment: any, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setHoveredSegment({
      label: segment.label,
      stars: segment.stars,
      value: segment.value,
      color: segment.color,
      x: event.clientX,
      y: rect.top - 8,
      percentage: segment.percentage,
    });
  };

  const handleMouseLeave = () => {
    setHoveredSegment(null);
  };

  // Calculate safety score for each road (weighted by star rating)
  const calculateSafetyScore = (road: RoadStarRatingByName): number => {
    // Higher score = safer (5-star gets most weight, 1-star gets least)
    return (
      (road['5star'] * 5) +
      (road['4star'] * 4) +
      (road['3star'] * 3) +
      (road['2star'] * 2) +
      (road['1star'] * 1)
    ) / road.total_km;
  };

  // Sort roads based on selected option
  const sortedRoads = [...data].sort((a, b) => {
    switch (sortBy) {
      case 'total_length':
        return b.total_km - a.total_km;
      
      case 'name_asc':
        return a.road_name.localeCompare(b.road_name);
      
      case 'safest':
        // Higher safety score first
        return calculateSafetyScore(b) - calculateSafetyScore(a);
      
      case 'least_safe':
        // Lower safety score first
        return calculateSafetyScore(a) - calculateSafetyScore(b);
      
      default:
        return b.total_km - a.total_km;
    }
  });

  const handleSortChange = (option: SortOption) => {
    setSortBy(option);
    setShowSortMenu(false);
  };

  // Get assessment type label
  const assessmentTypeLabel = vehicleType === 'vehicle' 
    ? 'Vehicle Safety'
    : vehicleType === 'motorcycle'
    ? 'Motorcycle Safety'
    : vehicleType === 'pedestrian'
    ? 'Pedestrian Safety'
    : 'Bicyclist Safety';

  if (loading) {
    return (
      <div className="border border-[#E5E7EB] rounded-lg p-4 bg-white shadow-sm mb-3">
        <h3 className="text-[11px] font-semibold text-[#0F172A] mb-4">
          {assessmentTypeLabel}
        </h3>
        <div className="text-[10px] text-[#64748B] text-center py-4">
          Loading...
        </div>
      </div>
    );
  }

  if (sortedRoads.length === 0) {
    return (
      <div className="border border-[#E5E7EB] rounded-lg p-4 bg-white shadow-sm mb-3">
        <h3 className="text-[11px] font-semibold text-[#0F172A] mb-4">
          {assessmentTypeLabel}
        </h3>
        <div className="text-[10px] text-[#64748B] text-center py-4">
          No road data available
        </div>
      </div>
    );
  }

  const currentSortLabel = SORT_OPTIONS.find(opt => opt.value === sortBy)?.label || 'Total Length';

  return (
    <div className="border border-[#E5E7EB] rounded-lg p-4 bg-white shadow-sm mb-3">
      {/* Header with Sort Icon */}
      <div className="flex items-center justify-between mb-3 min-h-[20px]">
        <h3 className="text-[11px] font-semibold text-[#0F172A] flex-shrink-0">
          {assessmentTypeLabel}
        </h3>
        
        {/* Action Buttons: Reset + Sort */}
        <div className="flex items-center gap-1">
          {/* Reset Button - Only show if there's an active filter */}
          {onReset && selectedRoadName && selectedRoadName !== 'all' && (
            <button
              onClick={onReset}
              className="flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 transition-colors group"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#EF4444] group-hover:text-[#DC2626]" />
              <span className="text-[9px] font-medium text-[#EF4444] group-hover:text-[#DC2626]">
                Reset
              </span>
            </button>
          )}
          
          {/* Compact Sort Icon with Dropdown */}
          <div className="relative" ref={sortMenuRef}>
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-50 transition-colors group"
              title={`Sort by: ${currentSortLabel}`}
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#2563EB]" />
              <span className="text-[9px] font-medium text-[#64748B] group-hover:text-[#2563EB]">
                Sort
              </span>
            </button>

            {/* Dropdown Menu */}
            {showSortMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-[#E5E7EB] rounded-md shadow-lg z-50 min-w-[140px]">
                {SORT_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleSortChange(option.value)}
                    className={`w-full text-left px-3 py-2 text-[9px] font-medium transition-colors first:rounded-t-md last:rounded-b-md ${
                      sortBy === option.value
                        ? 'bg-[#2563EB] text-white'
                        : 'text-[#0F172A] hover:bg-gray-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subtitle showing count and current sort */}
      <div className="text-[9px] text-[#64748B] mb-3">
        {sortedRoads.length} road{sortedRoads.length !== 1 ? 's' : ''} • {currentSortLabel}
      </div>
      
      {/* Scrollable container for all roads */}
      <div className="space-y-3.5 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {sortedRoads.map((road, index) => {
          // Calculate percentages for each star rating
          const segments: Array<{
            stars: number;
            value: number;
            percentage: number;
            color: string;
            label: string;
          }> = [];
          
          // Process star ratings in descending order (5-star to 1-star)
          [5, 4, 3, 2, 1].forEach(stars => {
            const value = road[`${stars}star` as keyof RoadStarRatingByName] as number;
            
            if (value > 0) {
              // Calculate percentage based on total_km
              const percentage = (value / road.total_km) * 100;
              
              segments.push({
                stars,
                value,
                percentage,
                color: STAR_COLORS[stars],
                label: `${stars}-Star`,
              });
            }
          });
          
          return (
            <div key={index} className="space-y-2">
              {/* Road Name Header */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-[#0F172A] truncate max-w-[65%]" title={road.road_name}>
                  {road.road_name}
                </span>
                <span className="text-[9px] font-medium text-[#64748B]">
                  {road.total_km.toFixed(1)} km
                </span>
              </div>
              
              {/* Modern Stacked Bar with rounded corners and shadow */}
              <div 
                className="relative flex h-3 rounded-lg overflow-hidden bg-gradient-to-r from-gray-100 to-gray-50 shadow-inner"
                style={{ border: '1px solid #E5E7EB' }}
              >
                {segments.map((segment, segIndex) => (
                  <div
                    key={segIndex}
                    style={{
                      width: isAnimated ? `${segment.percentage}%` : '0%',
                      backgroundColor: segment.color,
                      transition: `width 800ms ease-out ${segIndex * 50}ms`,
                    }}
                    className="relative cursor-pointer hover:opacity-90 hover:brightness-110"
                    onMouseEnter={(e) => handleMouseEnter(segment, e)}
                    onMouseMove={(e) => handleMouseMove(segment, e)}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => {
                      if (onSegmentClick) {
                        const starRatingValue = `${segment.stars}star`;
                        console.log(`🎯 [RoadNameChart] Segment clicked: ${road.road_name} - ${starRatingValue} - ${vehicleType}`);
                        onSegmentClick(road.road_name, starRatingValue, vehicleType);
                      }
                    }}
                  >
                    {/* Subtle separator between segments */}
                    {segIndex < segments.length - 1 && (
                      <div className="absolute right-0 top-0 bottom-0 w-px bg-white/30" />
                    )}
                  </div>
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

      {/* Custom scrollbar styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #F1F5F9;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #CBD5E1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94A3B8;
        }
      `}</style>
    </div>
  );
}