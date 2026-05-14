/**
 * Stacked Horizontal Bar Chart for Road Network Hazard Analysis
 * Modern design with interactive tooltips
 */

import React, { useState, useEffect } from 'react';
import { RoadNetworkAnalysisResponse } from '../utils/roadNetworkAnalysis';

interface Props {
  data: RoadNetworkAnalysisResponse;
  hasActiveRoadSafety?: boolean;
}

// Helper function to get simplified label from gridcode_type
function getSimplifiedLabel(gridcodeType: string): string {
  const type = gridcodeType.toLowerCase();
  
  // Skip "NA" gridcodes
  if (type === 'na' || type === 'n/a') {
    return '';
  }
  
  // Map temperature ranges to simple labels
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
  
  // For other hazard types, use the gridcode_type as-is
  return gridcodeType;
}

export function RoadNetworkStackedBarChart({ data, hasActiveRoadSafety }: Props) {
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

  // Check if this is mock/fallback data (indicated by negative analysis_id)
  const isMockData = data.analysis_id < 0;
  
  // Hide section when road safety layers are active
  if (hasActiveRoadSafety) {
    return null;
  }
  
  // If backend is unavailable, show only the warning - NO DUMMY DATA
  if (isMockData) {
    return (
      <div className="border border-[#E5E7EB] rounded-lg p-4 bg-white shadow-sm mb-3">
        <h3 className="text-[11px] font-semibold text-[#0F172A] mb-3">
          Road Network by Heat Stress Level
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

  const handleMouseEnter = (segment: any, event: React.MouseEvent) => {
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

  const handleMouseLeave = () => {
    setHoveredSegment(null);
  };
  
  // Define the desired order for road types
  const roadTypeOrder = [
    'National Highway',
    'State Highway',
    'Major Road',
    'Link Road'
  ];
  
  // Sort road types according to the predefined order
  const sortedRoadTypes = [...data.by_road_type].sort((a, b) => {
    const indexA = roadTypeOrder.indexOf(a.road_type);
    const indexB = roadTypeOrder.indexOf(b.road_type);
    
    // If both are in the order list, sort by their position
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    // If only A is in the list, it comes first
    if (indexA !== -1) return -1;
    // If only B is in the list, it comes first
    if (indexB !== -1) return 1;
    // If neither is in the list, maintain original order
    return 0;
  });
  
  return (
    null
  );
}