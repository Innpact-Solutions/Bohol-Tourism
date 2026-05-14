import { X, Car, Bike, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import irapLogo from 'figma:asset/067ddfa2e72bc87374b143c2af0e56ab8881d1d4.png';

interface RoadSafetyPopupProps {
  roadName: string;
  section: string;
  distance: string;
  vehicleRating: number;
  motorcycleRating: number;
  bicycleRating: number;
  pedestrianRating: number;
  codingLink?: string;
  x: number; // Screen pixel X position
  y: number; // Screen pixel Y position
  onClose: () => void;
}

export function RoadSafetyPopup({ 
  roadName,
  section,
  distance,
  vehicleRating,
  motorcycleRating,
  bicycleRating,
  pedestrianRating,
  codingLink,
  x, 
  y, 
  onClose
}: RoadSafetyPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x, y });

  // Star rating colors matching iRAP standards
  const starColors: Record<number, string> = {
    0: '#64748B',
    1: '#262626',  // Black - High Risk
    2: '#e65336',  // Red
    3: '#eda308',  // Orange
    4: '#fdf05e',  // Yellow
    5: '#93c060'   // Green - Safest
  };

  // Icons for each rating type - matching left panel icons
  const iconComponents = {
    vehicle: Car,
    motorcycle: Bike,
    bicycle: Bike,
    pedestrian: User
  };

  const createStarRatingHTML = (rating: number, ratingType: keyof typeof iconComponents) => {
    const validRating = rating >= 0 && rating <= 5 ? rating : 0;
    const color = starColors[validRating];
    const IconComponent = iconComponents[ratingType];
    const isNA = !rating || rating === 0;
    
    return (
      <div className="flex items-center gap-1.5 py-1">
        <div className="text-slate-500 flex-shrink-0 w-3.5 flex justify-center">
          <IconComponent className="w-3 h-3" />
        </div>
        <div className="flex-1 flex gap-0.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <span 
              key={i}
              style={{ color: i <= validRating ? color : '#E5E7EB' }}
              className="text-[11px] leading-none"
            >
              ★
            </span>
          ))}
        </div>
        <div 
          className="text-[8px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap"
          style={{ 
            color: '#94A3B8',
            background: '#F8FAFC'
          }}
        >
          {isNA ? 'NA' : `${validRating}/5`}
        </div>
      </div>
    );
  };

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
    let adjustedY = y - rect.height - 20; // Position above the click point by default

    // Check right edge
    if (adjustedX + rect.width > parentWidth - 20) {
      adjustedX = parentWidth - rect.width - 20;
    }

    // Check left edge
    if (adjustedX < 20) {
      adjustedX = 20;
    }

    // Check if positioning above would go off top edge
    if (adjustedY < 20) {
      adjustedY = y + 20; // Position below instead
    }

    // Check bottom edge if positioned below
    if (adjustedY + rect.height > parentHeight - 20) {
      adjustedY = parentHeight - rect.height - 20;
    }

    setPosition({ x: adjustedX, y: adjustedY });
  }, [x, y]);

  return (
    <div
      ref={popupRef}
      className="absolute z-[20] bg-white rounded-lg pointer-events-auto"
      style={{
        left: 0,
        top: 0,
        transform: `translate(${position.x}px, ${position.y}px)`,
        willChange: 'transform',
        width: '220px',
        fontFamily: 'Inter, system-ui, sans-serif',
        boxShadow: '0 10px 25px rgba(37, 99, 235, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(37, 99, 235, 0.15)'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="p-2 bg-white rounded-t-lg border-b border-gray-200">
        <div className="flex items-center gap-1.5">
          <div 
            className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 p-1 border border-gray-200"
            style={{ background: '#F8FAFC' }}
          >
            <img src={irapLogo} alt="iRAP" className="w-full h-full object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-900 leading-tight mb-0.5">
              {roadName}
            </div>
            <div className="text-[9px] text-slate-500 leading-tight">
              {section} · ({distance})
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Safety Ratings */}
      <div className="p-2 bg-white">
        <div className="text-[9px] text-slate-500 tracking-wide font-semibold mb-1.5">
          iRAP Safety Rating
        </div>
        {createStarRatingHTML(vehicleRating, 'vehicle')}
        {createStarRatingHTML(motorcycleRating, 'motorcycle')}
        {createStarRatingHTML(bicycleRating, 'bicycle')}
        {createStarRatingHTML(pedestrianRating, 'pedestrian')}
      </div>

      {/* Coding Link */}
      {codingLink && (
        <div className="px-2 pb-2 bg-white rounded-b-lg">
          <a
            href={codingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-2 py-1.5 text-center text-[10px] font-semibold text-white rounded transition-all"
            style={{
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              boxShadow: '0 1px 3px rgba(37, 99, 235, 0.2)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)';
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(37, 99, 235, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(37, 99, 235, 0.2)';
            }}
          >
            View Detailed Coding
          </a>
        </div>
      )}
    </div>
  );
}