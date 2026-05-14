import { X, MapPin } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface WardPopupProps {
  wardName: string;
  wardNumber: string;
  population?: string;
  area?: string;
  density?: string;
  households?: string;
  buildings?: string;
  zone?: string;
  lguName?: string;
  x: number; // Screen pixel X position
  y: number; // Screen pixel Y position
  onClose: () => void;
  onViewDetails?: () => void;
}

export function WardPopup({ 
  wardName, 
  wardNumber, 
  population, 
  area, 
  density, 
  households,
  buildings,
  zone = 'Bohol',
  lguName,
  x, 
  y, 
  onClose,
  onViewDetails 
}: WardPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x, y });

  // Format population number with commas
  const formatNumber = (num: string | undefined) => {
    if (!num || num === 'N/A') return 'N/A';
    const parsed = typeof num === 'string' ? parseInt(num.replace(/,/g, '')) : num;
    return isNaN(parsed) ? 'N/A' : parsed.toLocaleString();
  };

  useEffect(() => {
    if (!popupRef.current) return;

    const popup = popupRef.current;
    const rect = popup.getBoundingClientRect();
    
    // Get parent container size (map container)
    const parent = popup.parentElement;
    if (!parent) {
      console.error('❌ Popup has no parent element!');
      return;
    }
    
    const parentRect = parent.getBoundingClientRect();
    const parentWidth = parentRect.width;
    const parentHeight = parentRect.height;

    let adjustedX = x;
    let adjustedY = y;

    console.log('🎯 Popup positioning:', { 
      inputX: x, 
      inputY: y, 
      popupWidth: rect.width, 
      popupHeight: rect.height, 
      parentWidth, 
      parentHeight,
      parentTop: parentRect.top,
      parentLeft: parentRect.left 
    });

    // Check right edge (relative to parent container)
    if (x + rect.width > parentWidth - 20) {
      adjustedX = parentWidth - rect.width - 20;
      console.log('↔️ Adjusted X for right edge:', adjustedX);
    }

    // Check left edge
    if (adjustedX < 20) {
      adjustedX = 20;
      console.log('↔️ Adjusted X for left edge:', adjustedX);
    }

    // Check bottom edge - CRITICAL: position above if would overflow
    if (y + rect.height > parentHeight - 20) {
      adjustedY = y - rect.height - 40; // Position above the click point
      console.log('⚠️ Popup would overflow bottom, repositioning above. Old Y:', y, 'New Y:', adjustedY);
    }

    // Check top edge
    if (adjustedY < 20) {
      adjustedY = 20;
      console.log('↕️ Adjusted Y for top edge:', adjustedY);
    }

    console.log('✅ Final popup position:', { x: adjustedX, y: adjustedY });
    setPosition({ x: adjustedX, y: adjustedY });
  }, [x, y]);

  return (
    <div
      ref={popupRef}
      className="absolute z-[20] bg-white rounded-lg shadow-xl pointer-events-auto"
      style={{
        left: 0,
        top: 0,
        transform: `translate(${position.x}px, ${position.y}px)`,
        willChange: 'transform',
        width: '220px',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header with gradient background */}
      <div 
        className="p-2 border-b border-gray-200"
        style={{
          background: 'linear-gradient(to bottom right, rgba(37, 99, 235, 0.05) 0%, rgba(30, 64, 175, 0.05) 100%)'
        }}
      >
        {/* Ward Header with Icon */}
        <div className="flex items-start gap-1.5 mb-1.5">
          <div 
            className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(to bottom right, #2563EB 0%, #1E40AF 100%)',
              boxShadow: '0 1px 3px rgba(37, 99, 235, 0.2)'
            }}
          >
            <MapPin className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-semibold text-slate-900 leading-tight mb-0">
              {wardName}
            </h3>
            {lguName && (
              <p className="text-[9px] text-slate-500 mt-0.5">
                {lguName}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-0.5 hover:bg-gray-200/50 rounded transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-3 h-3 text-gray-600" />
          </button>
        </div>
        
        {/* Key Stats - Horizontal Layout */}
        <div className="grid grid-cols-2 gap-1.5">
          <div 
            className="rounded-md p-1.5 border"
            style={{
              background: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(4px)',
              borderColor: 'rgba(229, 231, 235, 0.5)'
            }}
          >
            <div className="text-[8px] text-slate-500 mb-0.5">Population - 2024</div>
            <div className="text-[11px] font-semibold text-gray-800 leading-tight">
              {formatNumber(population)}
            </div>
          </div>
          <div 
            className="rounded-md p-1.5 border"
            style={{
              background: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(4px)',
              borderColor: 'rgba(229, 231, 235, 0.5)'
            }}
          >
            <div className="text-[8px] text-slate-500 mb-0.5">Buildings</div>
            <div className="text-[11px] font-semibold text-[#2563EB] leading-tight">
              {formatNumber(buildings)}
            </div>
          </div>
        </div>
      </div>
      
      {/* Additional Stats */}
      {(area || households) && (
        <div className="p-2.5">
          {area && (
            <div className={`flex justify-between items-center ${households ? 'mb-1.5 pb-1.5 border-b border-slate-100' : ''}`}>
              <span className="text-[9px] text-slate-500 font-medium">Area</span>
              <span className="text-[10px] text-slate-900 font-semibold">{area}</span>
            </div>
          )}
          {households && (
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-slate-500 font-medium">Households</span>
              <span className="text-[10px] text-slate-900 font-semibold">{formatNumber(households)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}