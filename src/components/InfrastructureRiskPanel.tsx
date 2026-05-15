import { useState } from 'react';
import { ChevronDown, Square, Zap, LucideIcon, Star, AlertTriangle, Thermometer, Wind, Droplets, TrendingUp, Shield } from 'lucide-react';

interface InfrastructureRiskPanelProps {
  activeInfraLayers: string[];
  toggleInfraLayer: (layerId: string) => void;
  infrastructureLayers: {
    id: string;
    name: string;
    icon: LucideIcon;
    color: string;
    count: string;
    type: 'point' | 'line';
  }[];
}

export function InfrastructureRiskPanel({
  activeInfraLayers,
  toggleInfraLayer,
  infrastructureLayers,
}: InfrastructureRiskPanelProps) {
  const [layerSectionExpanded, setLayerSectionExpanded] = useState(true);
  const [roadSafetyExpanded, setRoadSafetyExpanded] = useState(false);
  const [roadClimateExpanded, setRoadClimateExpanded] = useState(false);
  const [institutionRatingExpanded, setInstitutionRatingExpanded] = useState(false);
  const [selectedInstitutionType, setSelectedInstitutionType] = useState<string>('schools');

  // Mock data for institutions with climate ratings
  const institutionData = {
    schools: [
      { name: 'Govt. High School Ward 42', climateStars: 2, heatRisk: 'High', aqiRisk: 'High', floodRisk: 'Moderate' },
      { name: 'DAV Public School Ward 18', climateStars: 3, heatRisk: 'Moderate', aqiRisk: 'High', floodRisk: 'Low' },
      { name: 'Kendriya Vidyalaya Ward 35', climateStars: 4, heatRisk: 'Moderate', aqiRisk: 'Moderate', floodRisk: 'Low' },
      { name: 'St. Xavier\'s School Ward 12', climateStars: 2, heatRisk: 'High', aqiRisk: 'Very High', floodRisk: 'Moderate' },
      { name: 'Saraswati Shishu Mandir Ward 28', climateStars: 3, heatRisk: 'Moderate', aqiRisk: 'Moderate', floodRisk: 'Moderate' },
    ],
    hospitals: [
      { name: 'District Hospital Ward 18', climateStars: 1, heatRisk: 'Very High', aqiRisk: 'High', floodRisk: 'Very High' },
      { name: 'AIIMS Bhubaneswar Ward 22', climateStars: 4, heatRisk: 'Low', aqiRisk: 'Moderate', floodRisk: 'Low' },
      { name: 'Capital Hospital Ward 14', climateStars: 2, heatRisk: 'High', aqiRisk: 'High', floodRisk: 'Moderate' },
      { name: 'Apollo Hospital Ward 8', climateStars: 3, heatRisk: 'Moderate', aqiRisk: 'Moderate', floodRisk: 'Low' },
    ],
    amenities: [
      { name: 'Central Park Ward 5', climateStars: 4, heatRisk: 'Low', aqiRisk: 'Moderate', floodRisk: 'Low' },
      { name: 'City Library Ward 11', climateStars: 3, heatRisk: 'Moderate', aqiRisk: 'Moderate', floodRisk: 'Moderate' },
      { name: 'Community Center Ward 7', climateStars: 2, heatRisk: 'High', aqiRisk: 'High', floodRisk: 'Moderate' },
    ],
    transport: [
      { name: 'Master Canteen Bus Stand', climateStars: 2, heatRisk: 'High', aqiRisk: 'Very High', floodRisk: 'Moderate' },
      { name: 'Baramunda Bus Terminal', climateStars: 3, heatRisk: 'Moderate', aqiRisk: 'High', floodRisk: 'Low' },
      { name: 'Kalpana Square Transit Hub', climateStars: 2, heatRisk: 'High', aqiRisk: 'High', floodRisk: 'Moderate' },
    ]
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return '#66BB6A';
      case 'Moderate': return '#FFEE58';
      case 'High': return '#FFA726';
      case 'Very High': return '#EF5350';
      default: return '#9CA3AF';
    }
  };

  const getStarColor = (stars: number) => {
    if (stars <= 2) return '#EF5350';
    if (stars === 3) return '#FFA726';
    return '#66BB6A';
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Subtitle */}
      <div className="px-4 py-2.5 bg-gradient-to-br from-[#F8FAFC] to-white border-b border-[#E5E7EB]">
        <p className="text-[10px] text-[#6B7280] leading-relaxed">
          Multi-hazard exposure across transport and public assets
        </p>
      </div>

      {/* Data Layer Selection - Matching other panels style */}
      <div className="border-b border-[#E5E7EB]">
        <button
          onClick={() => setLayerSectionExpanded(!layerSectionExpanded)}
          className="w-full bg-gradient-to-r from-[#F8FAFC] to-[#F1F5F9] px-4 py-2.5 flex items-center justify-between hover:from-[#F1F5F9] hover:to-[#E5E7EB] transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-1 h-3.5 bg-gradient-to-b from-[#2563EB] to-[#1E40AF] rounded-full" />
            <span className="text-xs font-semibold text-[#0F172A]">Infrastructure Exposure Layers</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-[#6B7280] transition-transform duration-200 ${layerSectionExpanded ? 'rotate-180' : ''}`} />
        </button>

        {layerSectionExpanded && (
          <div className="px-4 py-3 bg-white space-y-1.5">
            {infrastructureLayers.map((layer) => {
              const isActive = activeInfraLayers.includes(layer.id);
              const LayerIcon = layer.icon;

              return (
                <button
                  key={layer.id}
                  onClick={() => toggleInfraLayer(layer.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer group transition-all duration-200 ${
                    isActive 
                      ? 'bg-gradient-to-r from-[#EFF6FF] to-[#DBEAFE] border border-[#93C5FD] shadow-sm' 
                      : 'hover:bg-[#F8FAFC] border border-transparent'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isActive ? 'bg-white shadow-sm' : 'bg-[#F1F5F9]'
                  }`}>
                    <LayerIcon 
                      className="w-4 h-4"
                      style={{ color: isActive ? layer.color : '#94A3B8' }}
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0 text-left">
                    <div className={`text-[11px] font-medium truncate ${
                      isActive ? 'text-[#0F172A]' : 'text-[#64748B]'
                    }`}>
                      {layer.name}
                    </div>
                    <div className="text-[9px] text-[#64748B]">
                      {layer.count}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Road Network Safety Rating */}
      <div className="border-b border-[#E5E7EB]">
        <button
          onClick={() => setRoadSafetyExpanded(!roadSafetyExpanded)}
          className="w-full bg-gradient-to-r from-[#F8FAFC] to-[#F1F5F9] px-4 py-2.5 flex items-center justify-between hover:from-[#F1F5F9] hover:to-[#E5E7EB] transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-1 h-3.5 bg-gradient-to-b from-[#E3000F] to-[#B8000C] rounded-full" />
            <span className="text-xs font-semibold text-[#0F172A]">Road Network Safety Rating</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-[#6B7280] transition-transform duration-200 ${roadSafetyExpanded ? 'rotate-180' : ''}`} />
        </button>

        {roadSafetyExpanded && (
          <div className="px-4 py-3 bg-white">
            <div className="mb-3 p-2.5 bg-gradient-to-br from-[#FEF3F2] to-white rounded-lg border border-[#FEE2E2]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-medium text-[#0F172A]">iRAP Safety Rating</span>
                <Shield className="w-3.5 h-3.5 text-[#E3000F]" />
              </div>
              <div className="text-[8px] text-[#6B7280] leading-relaxed">
                International Road Assessment Programme star rating
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-[#FEE2E2] to-white border border-[#FEE2E2]">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(1)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-[#EF5350] text-[#EF5350]" />
                    ))}
                    {[...Array(4)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 text-[#E5E7EB]" />
                    ))}
                  </div>
                  <span className="text-[10px] font-medium text-[#0F172A]">1 Star</span>
                </div>
                <span className="text-[9px] text-[#6B7280]">42 km</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-[#FEF08A] to-white border border-[#FEF08A]">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(2)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-[#F59E0B] text-[#F59E0B]" />
                    ))}
                    {[...Array(3)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 text-[#E5E7EB]" />
                    ))}
                  </div>
                  <span className="text-[10px] font-medium text-[#0F172A]">2 Star</span>
                </div>
                <span className="text-[9px] text-[#6B7280]">156 km</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-[#FEF9C3] to-white border border-[#FEF9C3]">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(3)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-[#FFEE58] text-[#FFEE58]" />
                    ))}
                    {[...Array(2)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 text-[#E5E7EB]" />
                    ))}
                  </div>
                  <span className="text-[10px] font-medium text-[#0F172A]">3 Star</span>
                </div>
                <span className="text-[9px] text-[#6B7280]">312 km</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-[#D1FAE5] to-white border border-[#D1FAE5]">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(4)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-[#66BB6A] text-[#66BB6A]" />
                    ))}
                    {[...Array(1)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 text-[#E5E7EB]" />
                    ))}
                  </div>
                  <span className="text-[10px] font-medium text-[#0F172A]">4 Star</span>
                </div>
                <span className="text-[9px] text-[#6B7280]">89 km</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-[#DCFCE7] to-white border border-[#DCFCE7]">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-[#22C55E] text-[#22C55E]" />
                    ))}
                  </div>
                  <span className="text-[10px] font-medium text-[#0F172A]">5 Star</span>
                </div>
                <span className="text-[9px] text-[#6B7280]">23 km</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Road Network Climate Rating */}
      <div className="border-b border-[#E5E7EB]">
        <button
          onClick={() => setRoadClimateExpanded(!roadClimateExpanded)}
          className="w-full bg-gradient-to-r from-[#F8FAFC] to-[#F1F5F9] px-4 py-2.5 flex items-center justify-between hover:from-[#F1F5F9] hover:to-[#E5E7EB] transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-1 h-3.5 bg-gradient-to-b from-[#F59E0B] to-[#D97706] rounded-full" />
            <span className="text-xs font-semibold text-[#0F172A]">Road Network Climate Rating</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-[#6B7280] transition-transform duration-200 ${roadClimateExpanded ? 'rotate-180' : ''}`} />
        </button>

        {roadClimateExpanded && (
          <div className="px-4 py-3 bg-white">
            <div className="mb-3 p-2.5 bg-gradient-to-br from-[#FEF9C3] to-white rounded-lg border border-[#FEF08A]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-medium text-[#0F172A]">Climate Vulnerability Index (CVI)</span>
                <Thermometer className="w-3.5 h-3.5 text-[#F59E0B]" />
              </div>
              <div className="text-[8px] text-[#6B7280] leading-relaxed">
                Composite Heat + Flood + AQI + Green Cover
              </div>
            </div>

            <div className="space-y-2">
              <div className="p-2.5 rounded-lg border border-[#E5E7EB] bg-gradient-to-br from-white to-[#F8FAFC]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-medium text-[#0F172A]">Extreme Risk</span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#FEE2E2] text-[#EF5350] font-medium">98 km</span>
                </div>
                <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#EF5350] to-[#B71C1C] rounded-full" style={{ width: '16%' }} />
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-[#E5E7EB] bg-gradient-to-br from-white to-[#F8FAFC]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-medium text-[#0F172A]">High Risk</span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#FEF08A] text-[#F59E0B] font-medium">187 km</span>
                </div>
                <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#FFA726] to-[#F59E0B] rounded-full" style={{ width: '30%' }} />
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-[#E5E7EB] bg-gradient-to-br from-white to-[#F8FAFC]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-medium text-[#0F172A]">Moderate Risk</span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#FEF9C3] text-[#CA8A04] font-medium">245 km</span>
                </div>
                <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#FFEE58] to-[#FDD835] rounded-full" style={{ width: '39%' }} />
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-[#E5E7EB] bg-gradient-to-br from-white to-[#F8FAFC]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-medium text-[#0F172A]">Low Risk</span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#D1FAE5] text-[#22C55E] font-medium">92 km</span>
                </div>
                <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#66BB6A] to-[#22C55E] rounded-full" style={{ width: '15%' }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Institution Climate Star Rating */}
      <div className="border-b border-[#E5E7EB]">
        <button
          onClick={() => setInstitutionRatingExpanded(!institutionRatingExpanded)}
          className="w-full bg-gradient-to-r from-[#F8FAFC] to-[#F1F5F9] px-4 py-2.5 flex items-center justify-between hover:from-[#F1F5F9] hover:to-[#E5E7EB] transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-1 h-3.5 bg-gradient-to-b from-[#8B5CF6] to-[#7C3AED] rounded-full" />
            <span className="text-xs font-semibold text-[#0F172A]">Institution Climate Rating</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-[#6B7280] transition-transform duration-200 ${institutionRatingExpanded ? 'rotate-180' : ''}`} />
        </button>

        {institutionRatingExpanded && (
          <div className="px-4 py-3 bg-white">
            {/* Institution Type Selector */}
            <div className="mb-3">
              <div className="flex gap-1 p-1 bg-[#F1F5F9] rounded-lg">
                <button
                  onClick={() => setSelectedInstitutionType('schools')}
                  className={`flex-1 px-2 py-1.5 rounded-md text-[9px] font-medium transition-all ${
                    selectedInstitutionType === 'schools'
                      ? 'bg-white text-[#2563EB] shadow-sm'
                      : 'text-[#6B7280] hover:text-[#0F172A]'
                  }`}
                >
                  Schools
                </button>
                <button
                  onClick={() => setSelectedInstitutionType('hospitals')}
                  className={`flex-1 px-2 py-1.5 rounded-md text-[9px] font-medium transition-all ${
                    selectedInstitutionType === 'hospitals'
                      ? 'bg-white text-[#2563EB] shadow-sm'
                      : 'text-[#6B7280] hover:text-[#0F172A]'
                  }`}
                >
                  Hospitals
                </button>
                <button
                  onClick={() => setSelectedInstitutionType('amenities')}
                  className={`flex-1 px-2 py-1.5 rounded-md text-[9px] font-medium transition-all ${
                    selectedInstitutionType === 'amenities'
                      ? 'bg-white text-[#2563EB] shadow-sm'
                      : 'text-[#6B7280] hover:text-[#0F172A]'
                  }`}
                >
                  Amenities
                </button>
                <button
                  onClick={() => setSelectedInstitutionType('transport')}
                  className={`flex-1 px-2 py-1.5 rounded-md text-[9px] font-medium transition-all ${
                    selectedInstitutionType === 'transport'
                      ? 'bg-white text-[#2563EB] shadow-sm'
                      : 'text-[#6B7280] hover:text-[#0F172A]'
                  }`}
                >
                  Transport
                </button>
              </div>
            </div>

            {/* Institution List with Details */}
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {institutionData[selectedInstitutionType as keyof typeof institutionData].map((institution, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg border border-[#E5E7EB] bg-gradient-to-br from-white to-[#F8FAFC] hover:shadow-md transition-shadow cursor-pointer"
                >
                  {/* Institution Name and Stars */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="text-[10px] font-medium text-[#0F172A] leading-snug mb-0.5">
                        {institution.name}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-[8px] font-medium text-[#6B7280]">Climate</span>
                      <div className="flex">
                        {[...Array(institution.climateStars)].map((_, i) => (
                          <Star 
                            key={i} 
                            className="w-2.5 h-2.5" 
                            style={{ 
                              fill: getStarColor(institution.climateStars), 
                              color: getStarColor(institution.climateStars) 
                            }} 
                          />
                        ))}
                        {[...Array(5 - institution.climateStars)].map((_, i) => (
                          <Star key={i} className="w-2.5 h-2.5 text-[#E5E7EB]" />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Risk Assessment Details */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Thermometer className="w-3 h-3" style={{ color: getRiskColor(institution.heatRisk) }} />
                      <span className="text-[8px] text-[#6B7280] flex-1">Heat Stress</span>
                      <span 
                        className="text-[8px] font-medium px-1.5 py-0.5 rounded"
                        style={{ 
                          backgroundColor: `${getRiskColor(institution.heatRisk)}20`,
                          color: getRiskColor(institution.heatRisk)
                        }}
                      >
                        {institution.heatRisk}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Wind className="w-3 h-3" style={{ color: getRiskColor(institution.aqiRisk) }} />
                      <span className="text-[8px] text-[#6B7280] flex-1">Air Quality</span>
                      <span 
                        className="text-[8px] font-medium px-1.5 py-0.5 rounded"
                        style={{ 
                          backgroundColor: `${getRiskColor(institution.aqiRisk)}20`,
                          color: getRiskColor(institution.aqiRisk)
                        }}
                      >
                        {institution.aqiRisk}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Droplets className="w-3 h-3" style={{ color: getRiskColor(institution.floodRisk) }} />
                      <span className="text-[8px] text-[#6B7280] flex-1">Flood Risk</span>
                      <span 
                        className="text-[8px] font-medium px-1.5 py-0.5 rounded"
                        style={{ 
                          backgroundColor: `${getRiskColor(institution.floodRisk)}20`,
                          color: getRiskColor(institution.floodRisk)
                        }}
                      >
                        {institution.floodRisk}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-3 pt-3 border-t border-[#E5E7EB]">
              <div className="text-[8px] font-medium text-[#6B7280] mb-1.5">Climate Star Rating Scale:</div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <div className="flex">
                    {[...Array(1)].map((_, i) => (
                      <Star key={i} className="w-2 h-2 fill-[#EF5350] text-[#EF5350]" />
                    ))}
                    {[...Array(2)].map((_, i) => (
                      <Star key={i} className="w-2 h-2 fill-[#EF5350] text-[#EF5350]" />
                    ))}
                  </div>
                  <span className="text-[8px] text-[#6B7280]">= Critical / Very High Risk</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="flex">
                    {[...Array(3)].map((_, i) => (
                      <Star key={i} className="w-2 h-2 fill-[#FFA726] text-[#FFA726]" />
                    ))}
                  </div>
                  <span className="text-[8px] text-[#6B7280]">= Moderate Risk</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="flex">
                    {[...Array(4)].map((_, i) => (
                      <Star key={i} className="w-2 h-2 fill-[#66BB6A] text-[#66BB6A]" />
                    ))}
                    {[...Array(1)].map((_, i) => (
                      <Star key={i} className="w-2 h-2 fill-[#66BB6A] text-[#66BB6A]" />
                    ))}
                  </div>
                  <span className="text-[8px] text-[#6B7280]">= Low Risk / Well Protected</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}