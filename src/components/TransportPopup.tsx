import { X, Plane, Bus, CircleDot, Zap, Fuel, Train, Bike, Warehouse, Flame, Wind, Droplets, AlertTriangle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { getHazardInfo } from '../utils/legendLoader';

interface TransportPopupProps {
  name: string;
  category: string;
  categoryType: string; // Raw category type
  subcategory?: string; // Optional subcategory if exists
  hhi2025?: string | number;
  airAqi?: string | number;
  floodHazard?: string | number;
  multiHazard?: string | number;
  x: number; // Screen pixel X position
  y: number; // Screen pixel Y position
  onClose: () => void;
}

export function TransportPopup({ 
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
}: TransportPopupProps) {
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
    if (!categoryType) {
      console.warn('⚠️ TransportPopup: categoryType is undefined, using fallback icon');
      return Bus;
    }
    
    switch (categoryType.toLowerCase()) {
      case 'airport':
        return Plane;
      case 'bus_stand':
      case 'bus stand':
      case 'bus_terminal':
      case 'bus terminal':
        return Bus;
      case 'metro_station':
      case 'metro station':
        return CircleDot;
      case 'charging_station':
      case 'charging station':
        return Zap;
      case 'fuel_station':
      case 'fuel station':
        return Fuel;
      case 'railway_station':
      case 'railway station':
        return Train;
      case 'parking':
        return Bike;
      case 'warehouse':
        return Warehouse;
      default:
        return Bus;
    }
  };
  
  const IconComponent = getIcon();
  const popupRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x, y });

  useEffect(() => {
    if (!popupRef.current) return;

    const popup = popupRef.current;
    const rect = popup.getBoundingClientRect();
    
    const parent = popup.parentElement;
    if (!parent) {
      console.error('❌ Transport Popup has no parent element!');
      return;
    }
    
    const parentRect = parent.getBoundingClientRect();
    const parentWidth = parentRect.width;
    const parentHeight = parentRect.height;

    const OFFSET_X = -10;
    const OFFSET_Y = -15;
    const ARROW_HEIGHT = 8;
    
    let adjustedX = x + OFFSET_X;
    let adjustedY = y - rect.height - ARROW_HEIGHT + OFFSET_Y;

    if (adjustedX + rect.width > parentWidth - 20) {
      adjustedX = parentWidth - rect.width - 20;
    }

    if (adjustedX < 20) {
      adjustedX = 20;
    }

    if (adjustedY < 20) {
      adjustedY = y + ARROW_HEIGHT + 20;
    }

    if (adjustedY + rect.height > parentHeight - 20) {
      adjustedY = parentHeight - rect.height - 20;
    }

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
      <div 
        className="p-2 border-b border-gray-200"
        style={{
          background: 'linear-gradient(to bottom right, rgba(34, 197, 94, 0.05) 0%, rgba(22, 163, 74, 0.05) 100%)'
        }}
      >
        <div className="flex items-start gap-1.5 mb-1.5">
          <div 
            className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(to bottom right, #22C55E 0%, #16A34A 100%)',
              boxShadow: '0 1px 3px rgba(34, 197, 94, 0.3)'
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
            style={{ background: '#22C55E' }}
          />
          <div className="text-[10px] font-semibold" style={{ color: '#22C55E' }}>
            {category}
            {subcategory && ` • ${subcategory}`}
          </div>
        </div>
      </div>
      
      <div className="p-2.5">
        <div className="space-y-1.5">
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