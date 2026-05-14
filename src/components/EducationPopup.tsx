import { X, GraduationCap, BookOpen, School, Baby, Flame, Wind, Droplets, AlertTriangle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { getHazardInfo } from '../utils/legendLoader';

interface EducationPopupProps {
  name: string;
  category: string;
  categoryType: string; // Raw category type: 'university', 'college', 'school', 'anganwadi'
  subcategory?: string; // Optional subcategory like 'Primary school', 'Secondary school', etc.
  hhi2025?: string | number;
  airAqi?: string | number;
  floodHazard?: string | number;
  multiHazard?: string | number;
  x: number; // Screen pixel X position
  y: number; // Screen pixel Y position
  onClose: () => void;
}

export function EducationPopup({ 
  name, 
  category,
  categoryType,
  subcategory,
  hhi2025,
  airAqi,
  floodHazard,
  multiHazard,
  x, 
  y, 
  onClose 
}: EducationPopupProps) {
  // Get hazard level text and color from legend definitions
  const getHazardInfoFromLegend = (
    value: string | number | undefined, 
    layerName: string
  ) => {
    if (!value || value === 'N/A' || value === '') {
      return { label: 'N/A', color: '#94a3b8', description: '' };
    }
    
    const gridcode = typeof value === 'string' ? parseInt(value, 10) : Math.round(value);
    
    // Get the hazard info from legend definitions
    const hazardInfo = getHazardInfo(layerName, gridcode);
    
    if (hazardInfo) {
      return {
        label: hazardInfo.label,
        color: hazardInfo.color,
        description: hazardInfo.description
      };
    }
    
    // Fallback if not found in legend
    return { label: String(value), color: '#64748b', description: '' };
  };

  // Get the appropriate icon based on category type
  const getIcon = () => {
    // Safety check: handle undefined categoryType
    if (!categoryType) {
      console.warn('⚠️ EducationPopup: categoryType is undefined, using fallback icon');
      return School;
    }
    
    switch (categoryType.toLowerCase()) {
      case 'university':
        return GraduationCap;
      case 'college':
        return BookOpen;
      case 'school':
        return School;
      case 'anganwadi':
        return Baby;
      default:
        return School; // fallback
    }
  };
  
  const IconComponent = getIcon();
  const popupRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x, y });

  useEffect(() => {
    if (!popupRef.current) return;

    const popup = popupRef.current;
    const rect = popup.getBoundingClientRect();
    
    // Get parent container size (map container)
    const parent = popup.parentElement;
    if (!parent) {
      console.error('❌ Education Popup has no parent element!');
      return;
    }
    
    const parentRect = parent.getBoundingClientRect();
    const parentWidth = parentRect.width;
    const parentHeight = parentRect.height;

    // Default offset: Position popup ABOVE and slightly to the LEFT of click point
    const OFFSET_X = -10; // Slight left offset
    const OFFSET_Y = -15; // Position above the icon
    const ARROW_HEIGHT = 8; // Visual spacing for popup arrow/pointer
    
    // Calculate initial position (above and left of click point)
    let adjustedX = x + OFFSET_X;
    let adjustedY = y - rect.height - ARROW_HEIGHT + OFFSET_Y;

    console.log('🎓 Education popup positioning:', { 
      inputX: x, 
      inputY: y, 
      popupWidth: rect.width, 
      popupHeight: rect.height, 
      parentWidth, 
      parentHeight,
      initialX: adjustedX,
      initialY: adjustedY
    });

    // Check and adjust for boundaries
    // Right edge: if popup would overflow right, align to right edge with padding
    if (adjustedX + rect.width > parentWidth - 20) {
      adjustedX = parentWidth - rect.width - 20;
      console.log('↔️ Adjusted X for right edge:', adjustedX);
    }

    // Left edge: ensure minimum padding from left
    if (adjustedX < 20) {
      adjustedX = 20;
      console.log('↔️ Adjusted X for left edge:', adjustedX);
    }

    // Top edge: if popup would overflow top, position BELOW the click point instead
    if (adjustedY < 20) {
      adjustedY = y + ARROW_HEIGHT + 20; // Position below the icon
      console.log('⚠️ Education popup would overflow top, repositioning below. New Y:', adjustedY);
    }

    // Bottom edge: if still would overflow bottom (rare), clamp to bottom
    if (adjustedY + rect.height > parentHeight - 20) {
      adjustedY = parentHeight - rect.height - 20;
      console.log('↕️ Adjusted Y for bottom edge:', adjustedY);
    }

    console.log('✅ Final education popup position:', { x: adjustedX, y: adjustedY });
    setPosition({ x: adjustedX, y: adjustedY });
  }, [x, y]);

  const heatInfo = getHazardInfoFromLegend(hhi2025, 'HHI_2025');
  const airInfo = getHazardInfoFromLegend(airAqi, 'Air_AQI');
  const floodInfo = getHazardInfoFromLegend(floodHazard, 'Flood_Hazard');
  const multiInfo = getHazardInfoFromLegend(multiHazard, 'Multi_Hazard_BBSR');

  return (
    <div
      ref={popupRef}
      className="absolute z-[20] bg-white rounded-lg shadow-xl pointer-events-auto"
      style={{
        left: 0,
        top: 0,
        transform: `translate(${position.x}px, ${position.y}px)`,
        willChange: 'transform',
        width: '240px',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header with gradient background */}
      <div 
        className="p-2 border-b border-gray-200"
        style={{
          background: 'linear-gradient(to bottom right, rgba(139, 92, 246, 0.05) 0%, rgba(109, 40, 217, 0.05) 100%)'
        }}
      >
        {/* Icon and Title */}
        <div className="flex items-start gap-1.5 mb-1.5">
          <div 
            className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(to bottom right, #8B5CF6 0%, #7C3AED 100%)',
              boxShadow: '0 1px 3px rgba(139, 92, 246, 0.3)'
            }}
          >
            <IconComponent className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-semibold text-slate-900 leading-tight mb-0">
              {name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-0.5 hover:bg-gray-200/50 rounded transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-3 h-3 text-gray-600" />
          </button>
        </div>
        
        {/* Category Badge */}
        <div 
          className="inline-flex items-center gap-1.5 rounded-md p-1.5 border"
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(4px)',
            borderColor: 'rgba(229, 231, 235, 0.5)'
          }}
        >
          <div 
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: '#8B5CF6' }}
          />
          <div className="text-[10px] font-semibold" style={{ color: '#8B5CF6' }}>
            {category}
            {subcategory && ` • ${subcategory}`}
          </div>
        </div>
      </div>
      
      {/* Hazard Levels */}
      <div className="p-2.5">
        <div className="space-y-1.5">
          {/* Heat Stress */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Flame className="w-3 h-3 text-orange-500" />
              <span className="text-[9px] text-slate-600 font-medium">Heat Stress</span>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[9px] text-right">
                <span className="text-slate-800 font-semibold">{heatInfo.label}</span>
                {heatInfo.description && <span className="text-slate-500"> ({heatInfo.description})</span>}
              </span>
              <div 
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: heatInfo.color }}
                title={`${heatInfo.label} - ${heatInfo.description}`}
              />
            </div>
          </div>
          
          {/* Air Quality */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Wind className="w-3 h-3 text-sky-500" />
              <span className="text-[9px] text-slate-600 font-medium">Air Quality</span>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[9px] text-right">
                <span className="text-slate-800 font-semibold">{airInfo.label}</span>
                {airInfo.description && <span className="text-slate-500"> ({airInfo.description})</span>}
              </span>
              <div 
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: airInfo.color }}
                title={`${airInfo.label} - ${airInfo.description}`}
              />
            </div>
          </div>
          
          {/* Flood Risk */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Droplets className="w-3 h-3 text-blue-500" />
              <span className="text-[9px] text-slate-600 font-medium">Flood Risk</span>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[9px] text-right">
                <span className="text-slate-800 font-semibold">{floodInfo.label}</span>
                {floodInfo.description && <span className="text-slate-500"> ({floodInfo.description})</span>}
              </span>
              <div 
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: floodInfo.color }}
                title={`${floodInfo.label} - ${floodInfo.description}`}
              />
            </div>
          </div>
          
          {/* Multi-Hazard */}
          <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100">
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <AlertTriangle className="w-3 h-3 text-purple-500" />
              <span className="text-[9px] text-slate-600 font-semibold">Multi-Hazard</span>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[9px] text-right">
                <span className="text-slate-800 font-semibold">{multiInfo.label}</span>
                {multiInfo.description && <span className="text-slate-500"> ({multiInfo.description})</span>}
              </span>
              <div 
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: multiInfo.color }}
                title={`${multiInfo.label} - ${multiInfo.description}`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}