import { X, Clock } from 'lucide-react';
import { useState } from 'react';
import type { Sector, Scenario } from '../App';

interface WardFilterBarProps {
  activeSector: Sector;
  scenario: Scenario;
  onScenarioChange: (scenario: Scenario) => void;
  selectedWard: string | null;
  onWardChange: (ward: string | null) => void;
}

const wards = [
  { id: 'ward_1', name: 'Ward 1 - Kalpana' },
  { id: 'ward_15', name: 'Ward 15 - Nayapalli' },
  { id: 'ward_28', name: 'Ward 28 - Jaydev Vihar' },
  { id: 'ward_42', name: 'Ward 42 - Satya Nagar' },
  { id: 'ward_55', name: 'Ward 55 - Chandrasekharpur' },
  { id: 'ward_60', name: 'Ward 60 - Patia' },
];

const scenarioLabels = {
  baseline_2025: '2025 Baseline',
  ssp1_2040: 'SSP1-2040',
  ssp2_2040: 'SSP2-2040',
  ssp5_2040: 'SSP5-2040',
};

export function WardFilterBar({
  activeSector,
  scenario,
  onScenarioChange,
  selectedWard,
  onWardChange,
}: WardFilterBarProps) {
  const [wardOpen, setWardOpen] = useState(false);
  const [scenarioOpen, setScenarioOpen] = useState(false);

  const selectedWardName = wards.find(w => w.id === selectedWard)?.name || '';
  const scenarioAvailable = activeSector === 'heat';

  return (
    <div className="h-11 bg-white/95 backdrop-blur-sm border-b border-[#E5E7EB]/50 px-4 flex items-center gap-2 flex-shrink-0 shadow-sm">
      {/* Ward Filter */}
      <div className="relative">
        <button
          onClick={() => setWardOpen(!wardOpen)}
          className="h-8 px-3 border border-[#E5E7EB] rounded-lg text-xs text-[#1F2937] hover:bg-[#F8FAFC] hover:border-[#2563EB] transition-all flex items-center gap-2 min-w-[180px] font-medium"
        >
          {selectedWard ? (
            <>
              <span className="flex-1 text-left truncate">{selectedWardName}</span>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onWardChange(null);
                }}
                className="flex-shrink-0 hover:scale-110 transition-transform cursor-pointer"
                role="button"
                aria-label="Clear selection"
              >
                <X className="w-3 h-3 text-[#6B7280]" />
              </div>
            </>
          ) : (
            <span className="text-[#6B7280]">Filter by Ward</span>
          )}
        </button>
        
        {wardOpen && (
          <div className="absolute top-9 left-0 w-60 max-h-64 bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-white/40 overflow-hidden z-20">
            <div className="p-2">
              <input
                type="text"
                placeholder="Search wards..."
                className="w-full h-7 px-2 border border-[#E5E7EB] rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              />
            </div>
            <div className="max-h-48 overflow-y-auto">
              {wards.map((ward) => (
                <button
                  key={ward.id}
                  onClick={() => {
                    onWardChange(ward.id);
                    setWardOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-xs hover:bg-[#F8FAFC] transition-colors ${
                    selectedWard === ward.id ? 'bg-gradient-to-r from-[#EFF6FF] to-transparent text-[#2563EB] font-medium' : 'text-[#1F2937]'
                  }`}
                >
                  {ward.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Scenario Badge/Control */}
      <div className="relative">
        {scenarioAvailable ? (
          <>
            <button
              onClick={() => setScenarioOpen(!scenarioOpen)}
              className="h-8 px-3 border border-[#E5E7EB] rounded-lg text-xs text-[#1F2937] hover:bg-[#F8FAFC] hover:border-[#2563EB] transition-all font-medium"
            >
              Scenario: {scenarioLabels[scenario]}
            </button>
            {scenarioOpen && (
              <div className="absolute top-9 left-0 w-48 bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-white/40 overflow-hidden z-20">
                {(Object.keys(scenarioLabels) as Scenario[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      onScenarioChange(s);
                      setScenarioOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs hover:bg-[#F8FAFC] transition-colors ${
                      scenario === s ? 'bg-gradient-to-r from-[#EFF6FF] to-transparent text-[#2563EB] font-medium' : 'text-[#1F2937]'
                    }`}
                  >
                    {scenarioLabels[s]}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div
            className="h-8 px-3 border border-[#E5E7EB] rounded-lg text-xs text-[#9CA3AF] flex items-center cursor-not-allowed font-medium"
            title="Scenarios available only for Heat Stress"
          >
            Scenario: Not Available
          </div>
        )}
      </div>

      {/* Real-time timestamp (only for realtime sector) */}
      {activeSector === 'realtime' && (
        <div className="ml-auto flex items-center gap-2 px-3 h-8 bg-gradient-to-r from-[#EFF6FF] to-[#DBEAFE] rounded-lg border border-[#2563EB]/20">
          <Clock className="w-3.5 h-3.5 text-[#2563EB] animate-pulse" />
          <span className="text-xs text-[#1F2937] font-medium">Updated 11:05 IST • Auto 5m</span>
        </div>
      )}
    </div>
  );
}