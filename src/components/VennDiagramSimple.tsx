import React, { useState } from 'react';
import { Building2, Factory, Users } from 'lucide-react';

export function VennDiagramSelector() {
  const [selectedRegion, setSelectedRegion] = useState<string>('none');
  const [hoveredRegion, setHoveredRegion] = useState<string>('none');
  
  // Venn diagram regions - exactly 7 regions
  const regions = [
    { id: 'flood_only', label: 'Flood Only', color: '#3B82F6' },
    { id: 'infiltration_only', label: 'Ground Infiltration Only', color: '#8B5CF6' },
    { id: 'water_table_only', label: 'High Water Table Only', color: '#06B6D4' },
    { id: 'flood_infiltration', label: 'Flood + Infiltration', color: '#6366F1' },
    { id: 'flood_water', label: 'Flood + Water Table', color: '#2563EB' },
    { id: 'infiltration_water', label: 'Infiltration + Water Table', color: '#7C3AED' },
    { id: 'all_three', label: 'All Three Risks', color: '#4F46E5' },
  ];

  const handleReset = () => {
    setSelectedRegion('none');
    setHoveredRegion('none');
  };

  const isActive = (regionId: string) => selectedRegion === regionId || hoveredRegion === regionId;

  return (
    null
  );
}

// New Containment Risk Interaction Diagram Component
export function ContainmentRiskInteractionDiagram() {
  const [selectedCategory, setSelectedCategory] = useState<string>('building_use');
  const [selectedRiskRegion, setSelectedRiskRegion] = useState<string>('none');
  const [hoveredItem, setHoveredItem] = useState<string>('none');
  const [tooltipContent, setTooltipContent] = useState<{ text: string; x: number; y: number } | null>(null);

  const categories = [
    { id: 'building_use', label: 'Building Use', icon: Building2 },
    { id: 'bulk_generator', label: 'Bulk Generator', icon: Factory },
    { id: 'economic_vulnerability', label: 'Economic Vulnerability', icon: Users },
  ];

  // Define 8 states including the default/none state
  const vennRegions = [
    { id: 'none', label: 'Default State', description: 'No risk factor selected', color: '#64748B', icon: '○' },
    { id: 'no_risk', label: 'No Significant Risk', description: 'Buildings with no climate/environmental risks', color: '#64748B', icon: '○' },
    { id: 'flood_only', label: 'Flood Risk Only', description: 'Buildings with only flood risk exposure', color: '#3B82F6', icon: '●' },
    { id: 'infiltration_only', label: 'Ground Infiltration Only', description: 'Buildings with only infiltration risk', color: '#10B981', icon: '●' },
    { id: 'groundwater_only', label: 'Groundwater Depth Only', description: 'Buildings with only groundwater concerns', color: '#A855F7', icon: '●' },
    { id: 'flood_infiltration', label: 'Flood + Infiltration', description: 'Buildings exposed to both flood and infiltration risks', color: '#0891B2', icon: '◐' },
    { id: 'flood_groundwater', label: 'Flood + Groundwater', description: 'Buildings exposed to flood and groundwater risks', color: '#7C3AED', icon: '◐' },
    { id: 'infiltration_groundwater', label: 'Infiltration + Groundwater', description: 'Buildings exposed to infiltration and groundwater risks', color: '#059669', icon: '◐' },
    { id: 'all_three', label: 'All Three Risks', description: 'Buildings exposed to all three risk factors', color: '#DC2626', icon: '◉' },
  ];

  const handleReset = () => {
    setSelectedCategory('');
    setSelectedRiskRegion('none');
    setHoveredItem('none');
  };

  const isActive = (id: string) => 
    selectedRiskRegion === id || hoveredItem === id;

  // Circle positions for the Venn diagram
  const floodCircle = { cx: 120, cy: 90, r: 48 };
  const infiltrationCircle = { cx: 84, cy: 140, r: 48 };
  const groundwaterCircle = { cx: 156, cy: 140, r: 48 };

  // Helper function to determine which region was clicked based on position
  const handleDiagramClick = (event: React.MouseEvent<SVGSVGElement>) => {
    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 240;
    const y = ((event.clientY - rect.top) / rect.height) * 240;

    // Check if point is inside outer circle
    const distanceFromCenter = Math.sqrt((x - 120) ** 2 + (y - 120) ** 2);
    const inOuterCircle = distanceFromCenter <= 100;

    // Check if point is inside each circle
    const inFlood = Math.sqrt((x - floodCircle.cx) ** 2 + (y - floodCircle.cy) ** 2) <= floodCircle.r;
    const inInfiltration = Math.sqrt((x - infiltrationCircle.cx) ** 2 + (y - infiltrationCircle.cy) ** 2) <= infiltrationCircle.r;
    const inGroundwater = Math.sqrt((x - groundwaterCircle.cx) ** 2 + (y - groundwaterCircle.cy) ** 2) <= groundwaterCircle.r;

    // Determine which region based on which circles contain the point
    let clickedRegion = '';
    if (inFlood && inInfiltration && inGroundwater) {
      clickedRegion = 'all_three';
    } else if (inFlood && inInfiltration) {
      clickedRegion = 'flood_infiltration';
    } else if (inFlood && inGroundwater) {
      clickedRegion = 'flood_groundwater';
    } else if (inInfiltration && inGroundwater) {
      clickedRegion = 'infiltration_groundwater';
    } else if (inFlood) {
      clickedRegion = 'flood_only';
    } else if (inInfiltration) {
      clickedRegion = 'infiltration_only';
    } else if (inGroundwater) {
      clickedRegion = 'groundwater_only';
    } else if (inOuterCircle) {
      // Clicked in outer area (no risk)
      clickedRegion = 'no_risk';
    }

    // Toggle behavior: if clicking on already selected region, deselect it
    if (clickedRegion && selectedRiskRegion === clickedRegion) {
      setSelectedRiskRegion('none');
    } else if (clickedRegion) {
      setSelectedRiskRegion(clickedRegion);
    }
  };

  // Helper function for hover detection
  const handleDiagramHover = (event: React.MouseEvent<SVGSVGElement>) => {
    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 240;
    const y = ((event.clientY - rect.top) / rect.height) * 240;

    // Check if point is inside outer circle but outside inner circles
    const distanceFromCenter = Math.sqrt((x - 120) ** 2 + (y - 120) ** 2);
    const inOuterCircle = distanceFromCenter <= 100;

    // Check if point is inside each circle
    const inFlood = Math.sqrt((x - floodCircle.cx) ** 2 + (y - floodCircle.cy) ** 2) <= floodCircle.r;
    const inInfiltration = Math.sqrt((x - infiltrationCircle.cx) ** 2 + (y - infiltrationCircle.cy) ** 2) <= infiltrationCircle.r;
    const inGroundwater = Math.sqrt((x - groundwaterCircle.cx) ** 2 + (y - groundwaterCircle.cy) ** 2) <= groundwaterCircle.r;

    // Get selected category label
    const categoryLabel = categories.find(c => c.id === selectedCategory)?.label || 'Building Category';

    // Determine which region based on which circles contain the point
    let regionId = '';
    let tooltipText = '';

    if (inFlood && inInfiltration && inGroundwater) {
      regionId = 'all_three';
      tooltipText = 'All Three Risks';
    } else if (inFlood && inInfiltration) {
      regionId = 'flood_infiltration';
      tooltipText = 'Flood + Infiltration';
    } else if (inFlood && inGroundwater) {
      regionId = 'flood_groundwater';
      tooltipText = 'Flood + Groundwater';
    } else if (inInfiltration && inGroundwater) {
      regionId = 'infiltration_groundwater';
      tooltipText = 'Infiltration + Groundwater';
    } else if (inFlood) {
      regionId = 'flood_only';
      tooltipText = 'Flood Risk Only';
    } else if (inInfiltration) {
      regionId = 'infiltration_only';
      tooltipText = 'Ground Infiltration Only';
    } else if (inGroundwater) {
      regionId = 'groundwater_only';
      tooltipText = 'Groundwater Depth Only';
    } else if (inOuterCircle) {
      // Hovering in outer circle but not in any inner circles - show category
      regionId = 'no_risk';
      tooltipText = `${categoryLabel} - No Risk`;
    }

    if (regionId) {
      setHoveredItem(regionId);
      setTooltipContent({
        text: tooltipText,
        x: event.clientX,
        y: event.clientY
      });
    } else {
      setHoveredItem('none');
      setTooltipContent(null);
    }
  };

  return (
    <div className="bg-[#F8FAFC] border border-[#1E3A5F] rounded-md p-3 shadow-sm">
      {/* Building Category Toggle Buttons */}
      <div className="mb-3">
        <label className="block text-[11px] font-bold text-[#64748B] mb-1.5">
          Building Category
        </label>
        <div className="space-y-1">
          {categories.map((category) => {
            const isActive = selectedCategory === category.id;
            const CategoryIcon = category.icon;
            
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`w-full text-left px-2.5 py-2 rounded-md transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white shadow-sm shadow-[#8B5CF6]/20'
                    : 'hover:bg-[#F1F5F9] text-[#475569]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CategoryIcon className={`w-3.5 h-3.5 flex-shrink-0 ${
                    isActive ? 'text-white' : 'text-[#A78BFA]'
                  }`} />
                  <span className={`text-[11px] font-medium flex-1 ${isActive ? 'text-white' : 'text-[#E2E8F0]'}`}>
                    {category.label}
                  </span>
                  {isActive && (
                    <div className="w-1.5 h-1.5 bg-white rounded-full flex-shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Diagram */}
      <div className="relative w-full" style={{ paddingBottom: '100%' }}>
        <svg
          className="absolute inset-0 w-full h-full cursor-pointer"
          viewBox="0 0 240 240"
          xmlns="http://www.w3.org/2000/svg"
          onClick={handleDiagramClick}
          onMouseMove={handleDiagramHover}
          onMouseLeave={() => {
            setHoveredItem('none');
            setTooltipContent(null);
          }}
        >
          <defs>
            {/* Clip paths for each circle */}
            <clipPath id="floodClip2">
              <circle cx={floodCircle.cx} cy={floodCircle.cy} r={floodCircle.r} />
            </clipPath>
            <clipPath id="infiltrationClip2">
              <circle cx={infiltrationCircle.cx} cy={infiltrationCircle.cy} r={infiltrationCircle.r} />
            </clipPath>
            <clipPath id="groundwaterClip2">
              <circle cx={groundwaterCircle.cx} cy={groundwaterCircle.cy} r={groundwaterCircle.r} />
            </clipPath>
          </defs>

          {/* Outer circle - light grey with thin outline (Building Categories boundary) */}
          <circle
            cx="120"
            cy="120"
            r="100"
            fill="#0B1120"
            fillOpacity="0.35"
            stroke="#475569"
            strokeWidth="1.5"
            opacity="0.6"
            className="pointer-events-none"
          />

          {/* Background circle outlines - always visible */}
          <circle
            cx={floodCircle.cx}
            cy={floodCircle.cy}
            r={floodCircle.r}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2.5"
            opacity={0.6}
            className="pointer-events-none"
          />
          <circle
            cx={infiltrationCircle.cx}
            cy={infiltrationCircle.cy}
            r={infiltrationCircle.r}
            fill="none"
            stroke="#10B981"
            strokeWidth="2.5"
            opacity={0.6}
            className="pointer-events-none"
          />
          <circle
            cx={groundwaterCircle.cx}
            cy={groundwaterCircle.cy}
            r={groundwaterCircle.r}
            fill="none"
            stroke="#A855F7"
            strokeWidth="2.5"
            opacity={0.6}
            className="pointer-events-none"
          />

          {/* FILLED REGIONS - Highlights for selections */}

          {/* Region 0: No Risk (Outer area) - Outside all three circles */}
          {isActive('no_risk') && (
            <g className="pointer-events-none">
              <defs>
                <mask id="noRiskMask">
                  <circle cx="120" cy="120" r="100" fill="white" />
                  <circle cx={floodCircle.cx} cy={floodCircle.cy} r={floodCircle.r} fill="black" />
                  <circle cx={infiltrationCircle.cx} cy={infiltrationCircle.cy} r={infiltrationCircle.r} fill="black" />
                  <circle cx={groundwaterCircle.cx} cy={groundwaterCircle.cy} r={groundwaterCircle.r} fill="black" />
                </mask>
              </defs>
              <circle
                cx="120"
                cy="120"
                r="100"
                fill="#94A3B8"
                opacity={selectedRiskRegion === 'no_risk' ? 0.35 : 0.2}
                mask="url(#noRiskMask)"
                className="transition-opacity duration-200"
              />
            </g>
          )}

          {/* Region 1: Flood Only - NON-OVERLAPPING PART ONLY */}
          {isActive('flood_only') && (
            <g className="pointer-events-none">
              <defs>
                <mask id="floodOnlyMask">
                  <circle cx={floodCircle.cx} cy={floodCircle.cy} r={floodCircle.r} fill="white" />
                  <circle cx={infiltrationCircle.cx} cy={infiltrationCircle.cy} r={infiltrationCircle.r} fill="black" />
                  <circle cx={groundwaterCircle.cx} cy={groundwaterCircle.cy} r={groundwaterCircle.r} fill="black" />
                </mask>
              </defs>
              <circle
                cx={floodCircle.cx}
                cy={floodCircle.cy}
                r={floodCircle.r}
                fill="#3B82F6"
                opacity={selectedRiskRegion === 'flood_only' ? 0.65 : 0.45}
                mask="url(#floodOnlyMask)"
                className="transition-opacity duration-200"
              />
            </g>
          )}

          {/* Region 2: Infiltration Only - NON-OVERLAPPING PART ONLY */}
          {isActive('infiltration_only') && (
            <g className="pointer-events-none">
              <defs>
                <mask id="infiltrationOnlyMask">
                  <circle cx={infiltrationCircle.cx} cy={infiltrationCircle.cy} r={infiltrationCircle.r} fill="white" />
                  <circle cx={floodCircle.cx} cy={floodCircle.cy} r={floodCircle.r} fill="black" />
                  <circle cx={groundwaterCircle.cx} cy={groundwaterCircle.cy} r={groundwaterCircle.r} fill="black" />
                </mask>
              </defs>
              <circle
                cx={infiltrationCircle.cx}
                cy={infiltrationCircle.cy}
                r={infiltrationCircle.r}
                fill="#10B981"
                opacity={selectedRiskRegion === 'infiltration_only' ? 0.65 : 0.45}
                mask="url(#infiltrationOnlyMask)"
                className="transition-opacity duration-200"
              />
            </g>
          )}

          {/* Region 3: Groundwater Only - NON-OVERLAPPING PART ONLY */}
          {isActive('groundwater_only') && (
            <g className="pointer-events-none">
              <defs>
                <mask id="groundwaterOnlyMask">
                  <circle cx={groundwaterCircle.cx} cy={groundwaterCircle.cy} r={groundwaterCircle.r} fill="white" />
                  <circle cx={floodCircle.cx} cy={floodCircle.cy} r={floodCircle.r} fill="black" />
                  <circle cx={infiltrationCircle.cx} cy={infiltrationCircle.cy} r={infiltrationCircle.r} fill="black" />
                </mask>
              </defs>
              <circle
                cx={groundwaterCircle.cx}
                cy={groundwaterCircle.cy}
                r={groundwaterCircle.r}
                fill="#A855F7"
                opacity={selectedRiskRegion === 'groundwater_only' ? 0.65 : 0.45}
                mask="url(#groundwaterOnlyMask)"
                className="transition-opacity duration-200"
              />
            </g>
          )}

          {/* Region 4: Flood + Infiltration (TWO-WAY OVERLAP, excluding center) */}
          {isActive('flood_infiltration') && (
            <g className="pointer-events-none">
              <defs>
                <mask id="floodInfiltrationMask">
                  <rect x="0" y="0" width="240" height="240" fill="white" />
                  <circle cx={groundwaterCircle.cx} cy={groundwaterCircle.cy} r={groundwaterCircle.r} fill="black" />
                </mask>
              </defs>
              <g clipPath="url(#floodClip2)" mask="url(#floodInfiltrationMask)">
                <g clipPath="url(#infiltrationClip2)">
                  <rect
                    x="0"
                    y="0"
                    width="240"
                    height="240"
                    fill="#0891B2"
                    opacity={selectedRiskRegion === 'flood_infiltration' ? 0.8 : 0.6}
                    className="transition-opacity duration-200"
                  />
                </g>
              </g>
            </g>
          )}

          {/* Region 5: Flood + Groundwater (TWO-WAY OVERLAP, excluding center) */}
          {isActive('flood_groundwater') && (
            <g className="pointer-events-none">
              <defs>
                <mask id="floodGroundwaterMask">
                  <rect x="0" y="0" width="240" height="240" fill="white" />
                  <circle cx={infiltrationCircle.cx} cy={infiltrationCircle.cy} r={infiltrationCircle.r} fill="black" />
                </mask>
              </defs>
              <g clipPath="url(#floodClip2)" mask="url(#floodGroundwaterMask)">
                <g clipPath="url(#groundwaterClip2)">
                  <rect
                    x="0"
                    y="0"
                    width="240"
                    height="240"
                    fill="#7C3AED"
                    opacity={selectedRiskRegion === 'flood_groundwater' ? 0.8 : 0.6}
                    className="transition-opacity duration-200"
                  />
                </g>
              </g>
            </g>
          )}

          {/* Region 6: Infiltration + Groundwater (TWO-WAY OVERLAP, excluding center) */}
          {isActive('infiltration_groundwater') && (
            <g className="pointer-events-none">
              <defs>
                <mask id="infiltrationGroundwaterMask">
                  <rect x="0" y="0" width="240" height="240" fill="white" />
                  <circle cx={floodCircle.cx} cy={floodCircle.cy} r={floodCircle.r} fill="black" />
                </mask>
              </defs>
              <g clipPath="url(#infiltrationClip2)" mask="url(#infiltrationGroundwaterMask)">
                <g clipPath="url(#groundwaterClip2)">
                  <rect
                    x="0"
                    y="0"
                    width="240"
                    height="240"
                    fill="#059669"
                    opacity={selectedRiskRegion === 'infiltration_groundwater' ? 0.8 : 0.6}
                    className="transition-opacity duration-200"
                  />
                </g>
              </g>
            </g>
          )}

          {/* Region 7: All Three */}
          {isActive('all_three') && (
            <g clipPath="url(#floodClip2)" className="pointer-events-none">
              <g clipPath="url(#infiltrationClip2)">
                <g clipPath="url(#groundwaterClip2)">
                  <rect
                    x="0"
                    y="0"
                    width="240"
                    height="240"
                    fill="#DC2626"
                    opacity={selectedRiskRegion === 'all_three' ? 0.85 : 0.65}
                    className="transition-opacity duration-200"
                  />
                </g>
              </g>
            </g>
          )}

          {/* Circle labels - positioned inside each circle with better readability */}
          <text
            x="120"
            y="85"
            textAnchor="middle"
            fill="#93C5FD"
            fontSize="9"
            fontWeight="600"
            letterSpacing="0.3"
            className="pointer-events-none select-none"
            style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
          >
            Flood Risk
          </text>

          <text
            x="68"
            y="138"
            textAnchor="middle"
            fill="#6EE7B7"
            fontSize="9"
            fontWeight="600"
            letterSpacing="0.3"
            className="pointer-events-none select-none"
            style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
          >
            Ground
          </text>
          <text
            x="68"
            y="148"
            textAnchor="middle"
            fill="#6EE7B7"
            fontSize="9"
            fontWeight="600"
            letterSpacing="0.3"
            className="pointer-events-none select-none"
            style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
          >
            Infiltration
          </text>

          <text
            x="172"
            y="138"
            textAnchor="middle"
            fill="#D8B4FE"
            fontSize="9"
            fontWeight="600"
            letterSpacing="0.3"
            className="pointer-events-none select-none"
            style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
          >
            Groundwater
          </text>
          <text
            x="172"
            y="148"
            textAnchor="middle"
            fill="#D8B4FE"
            fontSize="9"
            fontWeight="600"
            letterSpacing="0.3"
            className="pointer-events-none select-none"
            style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
          >
            Depth
          </text>
        </svg>
      </div>

      {/* Selected Combination Display - Simple, no heading */}
      {selectedRiskRegion !== 'none' && (() => {
        const categoryLabel = categories.find(c => c.id === selectedCategory)?.label || 'Building Category';
        const regionData = vennRegions.find((r) => r.id === selectedRiskRegion);
        const displayLabel = selectedRiskRegion === 'no_risk' 
          ? `${categoryLabel} - No Risk` 
          : regionData?.label || '';
        
        return (
          <div className="mt-3">
            <div className="bg-[#1E1B4B] rounded-md p-3 border border-[#8B5CF6]/40 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                {/* Text Content */}
                <div className="text-[11px] font-medium text-[#C4B5FD]">
                  {displayLabel}
                </div>

                {/* Clear button */}
                <button
                  onClick={() => setSelectedRiskRegion('none')}
                  className="p-1.5 hover:bg-white/10 rounded transition-colors flex-shrink-0"
                  title="Clear selection"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M9 3L3 9M3 3L9 9"
                      stroke="#94A3B8"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Tooltip */}
      {tooltipContent && (
        <div
          className="fixed z-[9999] px-3 py-2 bg-[#F1F5F9] border border-[#3B82F6]/50 rounded-lg shadow-2xl pointer-events-none"
          style={{
            left: `${tooltipContent.x + 12}px`,
            top: `${tooltipContent.y - 8}px`,
            transform: 'translateY(-100%)'
          }}
        >
          <div className="text-[11px] font-medium text-white whitespace-nowrap">
            {tooltipContent.text}
          </div>
        </div>
      )}
    </div>
  );
}