import { X, Building2, Layers, MapPin, SquareStack, Droplets } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface BuildingPopupProps {
  useType?: string;
  useSub?: string;
  bldgName?: string;
  barangay?: string;
  municipality?: string;
  floors?: string | number;
  areaSqm?: string | number;
  sewerFeas?: string;     // raw DB value e.g. 'Sewer Feasible'
  showSewerZone?: boolean; // show only when Module 1 buildings mode active
  x: number;
  y: number;
  onClose: () => void;
}

export function BuildingPopup({ 
  useType,
  useSub,
  bldgName,
  barangay,
  municipality,
  floors,
  areaSqm,
  sewerFeas,
  showSewerZone = false,
  x, 
  y, 
  onClose
}: BuildingPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x, y });

  useEffect(() => {
    if (!popupRef.current) return;

    const popup = popupRef.current;
    const rect = popup.getBoundingClientRect();
    
    // Get parent container size (map container)
    const parent = popup.parentElement;
    if (!parent) return;
    
    const parentRect = parent.getBoundingClientRect();
    const parentWidth = parentRect.width;
    const parentHeight = parentRect.height;

    let adjustedX = x;
    let adjustedY = y;

    // Check right edge (relative to parent container)
    if (x + rect.width > parentWidth - 20) {
      adjustedX = parentWidth - rect.width - 20;
    }

    // Check left edge
    if (adjustedX < 20) {
      adjustedX = 20;
    }

    // Check bottom edge - position above if would overflow
    if (y + rect.height > parentHeight - 20) {
      adjustedY = y - rect.height - 40; // Position above the click point
    }

    // Check top edge
    if (adjustedY < 20) {
      adjustedY = 20;
    }

    setPosition({ x: adjustedX, y: adjustedY });
  }, [x, y]);

  const displayArea = areaSqm && areaSqm !== 'N/A'
    ? `${Number(areaSqm).toFixed(0)} m²`
    : 'N/A';

  // Map raw DB sewer_feas values to UI-friendly zone labels
  const sewerZoneLabel: Record<string, { label: string; color: string }> = {
    'Sewer Feasible':   { label: 'Network Coverage',      color: '#14B8A6' },
    'Non-Sewer':        { label: 'Non-Network Coverage',  color: '#F59E0B' },
    'On-Site Treatment':{ label: 'On-site Treatment',     color: '#8B5CF6' },
  };
  const zoneInfo = sewerFeas ? sewerZoneLabel[sewerFeas] : null;

  return (
    <div
      ref={popupRef}
      className="absolute z-[25] bg-white rounded-lg shadow-xl pointer-events-auto"
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
      {/* Header */}
      <div 
        className="p-2 border-b border-gray-200"
        style={{
          background: 'linear-gradient(to bottom right, rgba(71, 85, 105, 0.05) 0%, rgba(51, 65, 85, 0.05) 100%)'
        }}
      >
        <div className="flex items-start gap-1.5">
          <div 
            className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(to bottom right, #475569 0%, #334155 100%)',
              boxShadow: '0 1px 3px rgba(71, 85, 105, 0.2)'
            }}
          >
            <Building2 className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-semibold text-slate-900 leading-tight">
              {bldgName && bldgName !== 'N/A' ? bldgName : (useType || 'Building')}
            </h3>
            {bldgName && bldgName !== 'N/A' && (
              <p className="text-[9px] text-slate-400 leading-tight mt-0.5">
                {useType}{useSub && useSub !== 'N/A' ? ` · ${useSub}` : ''}
              </p>
            )}
            {(!bldgName || bldgName === 'N/A') && useSub && useSub !== 'N/A' && (
              <p className="text-[9px] text-slate-500 leading-tight mt-0.5">
                {useSub}
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
      </div>
      
      {/* Location */}
      <div className="px-2 pt-2 pb-1">
        <div className="flex items-start gap-1.5">
          <MapPin className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-[10px] font-medium text-slate-700 leading-tight">
              {barangay && barangay !== 'N/A' ? barangay : '—'}
            </div>
            {municipality && municipality !== 'N/A' && (
              <div className="text-[9px] text-slate-500 leading-tight">
                {municipality}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className={`px-2 ${showSewerZone ? 'pt-0 pb-1.5' : 'pb-2'}`}>
        <div className="grid grid-cols-2 gap-1">
          {/* Floors */}
          <div className="bg-slate-50 rounded p-1.5 text-center border border-slate-100">
            <Layers className="w-2.5 h-2.5 text-slate-400 mx-auto mb-0.5" />
            <div className="text-[10px] font-semibold text-slate-800">
              {floors && floors !== 'N/A' ? floors : '—'}
            </div>
            <div className="text-[8px] text-slate-500">Floors</div>
          </div>
          {/* Area */}
          <div className="bg-slate-50 rounded p-1.5 text-center border border-slate-100">
            <SquareStack className="w-2.5 h-2.5 text-slate-400 mx-auto mb-0.5" />
            <div className="text-[10px] font-semibold text-slate-800">
              {displayArea}
            </div>
            <div className="text-[8px] text-slate-500">Area</div>
          </div>
        </div>
      </div>

      {/* Sanitation Zone — shown only in Module 1 buildings mode */}
      {showSewerZone && (
        <div className="px-2 pb-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 pt-1.5">
            <Droplets className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <span className="text-[9px] text-slate-500 flex-shrink-0">Sanitation Zone</span>
            {zoneInfo ? (
              <span
                className="ml-auto text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: `${zoneInfo.color}22`, color: zoneInfo.color }}
              >
                {zoneInfo.label}
              </span>
            ) : (
              <span className="ml-auto text-[9px] text-slate-400">—</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}