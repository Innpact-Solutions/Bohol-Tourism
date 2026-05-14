import { Thermometer, Wind, Droplets, Info, Layers, HelpCircle, Shield } from 'lucide-react';
import type { Sector } from '../App';

interface LeftRailProps {
  activeSector: Sector;
  onSectorChange: (sector: Sector) => void;
  onInfoOpen: () => void;
  onTutorialOpen?: () => void;
  showTutorialPulse?: boolean;
}

const sectors = [
  { id: 'heat' as Sector, label: 'Heat Stress', icon: Thermometer },
  { id: 'air' as Sector, label: 'Air Pollution', icon: Wind },
  { id: 'flood' as Sector, label: 'Flood', icon: Droplets },
  { id: 'multihazard' as Sector, label: 'Multi Hazard', icon: Layers },
  { id: 'roadsafety' as Sector, label: 'Road Safety', icon: Shield },
];

export function LeftRail({ activeSector, onSectorChange, onInfoOpen, onTutorialOpen, showTutorialPulse }: LeftRailProps) {
  return (
    <div 
      data-tutorial="left-rail"
      className="w-16 bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#0F172A] flex flex-col items-center py-3 gap-1.5 flex-shrink-0 shadow-xl border-r border-white/5"
    >
      {sectors.map((sector) => {
        const isActive = activeSector === sector.id;
        const Icon = sector.icon;
        return (
          <button
            key={sector.id}
            onClick={() => onSectorChange(sector.id)}
            data-tutorial={sector.id === 'flood' ? 'flood-sector' : undefined}
            className={`w-[56px] h-auto py-2 flex flex-col items-center justify-center rounded-lg transition-all duration-200 relative group ${
              isActive
                ? 'bg-gradient-to-br from-[#2563EB] to-[#1E40AF] text-white shadow-lg shadow-[#2563EB]/30 scale-105'
                : 'text-[#94A3B8] hover:bg-white/10 hover:text-white hover:scale-105'
            }`}
            title={sector.label}
          >
            {isActive && (
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#2563EB] rounded-r-full shadow-lg shadow-[#2563EB]/50" />
            )}
            <Icon className="w-4.5 h-4.5" />
            <span className="text-[8.5px] mt-1 font-medium text-center leading-tight px-0.5">{sector.label}</span>
          </button>
        );
      })}
      
      {/* Spacer to push buttons to bottom */}
      <div className="flex-1" />
      
      {/* Tutorial Button */}
      {onTutorialOpen && (
        <button
          className="w-[56px] h-auto py-2 flex flex-col items-center justify-center rounded-lg text-[#94A3B8] hover:bg-white/10 hover:text-white hover:scale-105 transition-all duration-200 group relative"
          title="Guided Tour"
          onClick={onTutorialOpen}
        >
          {/* Pulsing indicator dot */}
          {showTutorialPulse && (
            <>
              <div className="absolute top-1 right-1 w-2 h-2 bg-[#2563EB] rounded-full animate-pulse" />
              <div className="absolute top-1 right-1 w-2 h-2 bg-[#2563EB] rounded-full animate-ping" />
            </>
          )}
          
          <HelpCircle className="w-4.5 h-4.5" />
          <span className="text-[8px] mt-1 font-medium text-center leading-tight">Guided Tour</span>
        </button>
      )}
      
      {/* Info Button */}
      <button
        className="w-[56px] h-auto py-2 flex flex-col items-center justify-center rounded-lg text-[#94A3B8] hover:bg-white/10 hover:text-white hover:scale-105 transition-all duration-200 group"
        title="Information"
        onClick={onInfoOpen}
      >
        <Info className="w-4.5 h-4.5" />
        <span className="text-[8px] mt-1 font-medium text-center leading-tight">Info</span>
      </button>
    </div>
  );
}