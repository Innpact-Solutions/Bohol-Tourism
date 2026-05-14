import { useState } from 'react';
import {  AlertTriangle, TrendingUp, Users, MapPin, Star } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

export function InfraRightPanel() {
  const [selectedAssetTab, setSelectedAssetTab] = useState<'schools' | 'hospitals' | 'transit' | 'ev' | 'roads' | 'road_safety'>('schools');

  // Mock data for citywide exposure
  const assetDistributionData = [
    { name: 'Low', value: 45, color: '#66BB6A' },
    { name: 'Moderate', value: 33, color: '#FFEE58' },
    { name: 'High', value: 19, color: '#FFA726' },
    { name: 'Very High', value: 8, color: '#EF5350' },
    { name: 'Extreme', value: 4, color: '#B71C1C' },
  ];

  // Mock data for risk by infrastructure type (Schools tab shown)
  const hazardShareData = [
    { hazard: 'Heat', value: 68 },
    { hazard: 'AQI', value: 45 },
    { hazard: 'Flood', value: 22 },
  ];

  // Road corridor data
  const corridorData = [
    { name: 'Airport Corridor', rcvi: 8.6, stars: 2, hazards: 'Heat + AQI' },
    { name: 'Cuttack–Puri Road', rcvi: 8.2, stars: 2, hazards: 'Flood + Heat' },
    { name: 'Janpath Road', rcvi: 7.8, stars: 3, hazards: 'AQI' },
    { name: 'Khandagiri Rd', rcvi: 7.4, stars: 3, hazards: 'Heat' },
    { name: 'Nayapalli Rd', rcvi: 6.9, stars: 3, hazards: 'Flood' },
  ];

  // Road stretch detail data (for radar chart)
  const roadDetailData = [
    { metric: 'Heat Stress', value: 8.6 },
    { metric: 'Flood Risk', value: 4.2 },
    { metric: 'Air Quality', value: 7.8 },
    { metric: 'Road Safety', value: 3.5 },
  ];

  // Road Safety Assessment data
  const roadSafetyDistributionData = [
    { name: '5-Star', value: 12, color: '#22C55E' },
    { name: '4-Star', value: 28, color: '#84CC16' },
    { name: '3-Star', value: 35, color: '#F59E0B' },
    { name: '2-Star', value: 18, color: '#F97316' },
    { name: '1-Star', value: 7, color: '#EF4444' },
  ];

  const criticalRoadSegmentsData = [
    { name: 'Janpath (NH-16)', rating: 2, type: 'Pedestrian', hazards: 'Heat High / AQI Moderate' },
    { name: 'Airport Road', rating: 1, type: 'Vehicle', hazards: 'Heat Extreme / Flood Moderate' },
    { name: 'Khandagiri Road', rating: 2, type: 'Bicycle', hazards: 'Heat High' },
    { name: 'Nayapalli Square', rating: 2, type: 'Motorcycle', hazards: 'AQI High / Heat Moderate' },
    { name: 'Rasulgarh Flyover', rating: 3, type: 'Vehicle', hazards: 'Flood High' },
  ];

  return (
    <div className="space-y-3">
      {/* Section 1 - Citywide Multi-Hazard Exposure */}
      <div className="border border-[#E5E7EB] rounded-lg p-3 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-medium text-[#0F172A]">Citywide Exposure Overview</h3>
        </div>

        {/* KPI Pills Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-gradient-to-br from-[#FEF3F2] to-white p-2 rounded-lg border border-[#FEE2E2]">
            <div style={{ fontSize: '20px', lineHeight: '24px' }} className="font-semibold text-[#E3000F] mb-0.5">521</div>
            <div className="text-[9px] text-[#6B7280] leading-tight">Total Assets at Risk</div>
            <div className="text-[8px] text-[#9CA3AF]">transport + public facilities</div>
          </div>
          <div className="bg-gradient-to-br from-[#FEF9C3] to-white p-2 rounded-lg border border-[#FEF08A]">
            <div style={{ fontSize: '20px', lineHeight: '24px' }} className="font-semibold text-[#E3000F] mb-0.5">34%</div>
            <div className="text-[9px] text-[#6B7280] leading-tight">High / Very High Risk</div>
            <div className="text-[8px] text-[#9CA3AF]">multi-hazard composite</div>
          </div>
          <div className="bg-gradient-to-br from-[#FECACA] to-white p-2 rounded-lg border border-[#FCA5A5]">
            <div style={{ fontSize: '20px', lineHeight: '24px' }} className="font-semibold text-[#E3000F] mb-0.5">28</div>
            <div className="text-[9px] text-[#6B7280] leading-tight">Critical Lifeline Assets</div>
            <div className="text-[8px] text-[#9CA3AF]">hospitals, fire, command</div>
          </div>
          <div className="bg-gradient-to-br from-[#E0E7FF] to-white p-2 rounded-lg border border-[#C7D2FE]">
            <div style={{ fontSize: '20px', lineHeight: '24px' }} className="font-semibold text-[#E3000F] mb-0.5">132 km</div>
            <div className="text-[9px] text-[#6B7280] leading-tight">Climate-Exposed Roads</div>
            <div className="text-[8px] text-[#9CA3AF]">Heat / Flood / AQI overlap</div>
          </div>
        </div>

        {/* Stacked Bar Chart */}
        <div>
          <div className="text-[10px] font-medium text-[#0F172A] mb-2">Asset Distribution by Risk Level</div>
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={assetDistributionData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 9, fill: '#6B7280' }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: '#6B7280' }} width={60} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  fontSize: '10px'
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {assetDistributionData.map((entry, index) => (
                  <Bar key={`bar-${index}`} dataKey="value" fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Section 2 - Risk by Infrastructure Type */}
      <div className="border border-[#E5E7EB] rounded-lg bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#E5E7EB]">
          <h3 className="text-xs font-medium text-[#0F172A]">Risk by Infrastructure Type</h3>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#E5E7EB] bg-[#F8FAFC] overflow-x-auto">
          {[
            { id: 'schools', label: 'Schools' },
            { id: 'hospitals', label: 'Hospitals' },
            { id: 'transit', label: 'Transit' },
            { id: 'ev', label: 'EV Charging' },
            { id: 'roads', label: 'Roads' },
            { id: 'road_safety', label: 'Road Safety' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedAssetTab(tab.id as any)}
              className={`px-3 py-1.5 text-[9px] font-medium whitespace-nowrap transition-colors ${
                selectedAssetTab === tab.id
                  ? 'text-[#2563EB] border-b-2 border-[#2563EB] bg-white'
                  : 'text-[#6B7280] hover:text-[#0F172A]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-3 space-y-2">
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-gradient-to-br from-[#FEF3F2] to-white rounded-lg border border-[#FEE2E2]">
              <div style={{ fontSize: '16px', lineHeight: '20px' }} className="font-semibold text-[#E3000F] mb-0.5">32</div>
              <div className="text-[8px] text-[#6B7280]">High/V.High Zones</div>
            </div>
            <div className="text-center p-2 bg-gradient-to-br from-[#FEF9C3] to-white rounded-lg border border-[#FEF08A]">
              <div style={{ fontSize: '16px', lineHeight: '20px' }} className="font-semibold text-[#E3000F] mb-0.5">14</div>
              <div className="text-[8px] text-[#6B7280]">Multi-Hazard</div>
            </div>
            <div className="text-center p-2 bg-gradient-to-br from-[#E0E7FF] to-white rounded-lg border border-[#C7D2FE]">
              <div style={{ fontSize: '16px', lineHeight: '20px' }} className="font-semibold text-[#E3000F] mb-0.5">95k</div>
              <div className="text-[8px] text-[#6B7280]">Pop. Served</div>
            </div>
          </div>

          {/* Bar Chart */}
          <div>
            <div className="text-[10px] font-medium text-[#0F172A] mb-2">Share of Assets in High/Very High Risk by Hazard</div>
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={hazardShareData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="hazard" tick={{ fontSize: 9, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 9, fill: '#6B7280' }} label={{ value: '%', angle: -90, position: 'insideLeft', style: { fontSize: 9, fill: '#6B7280' } }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    fontSize: '10px'
                  }}
                />
                <Bar dataKey="value" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top 5 Critical Assets */}
          <div>
            <div className="text-[10px] font-medium text-[#0F172A] mb-1.5">Top 5 Critical Assets</div>
            <div className="space-y-1">
              <div className="flex items-start gap-1.5 p-1.5 bg-[#FEF3F2] rounded text-[9px] border border-[#FEE2E2]">
                <AlertTriangle className="w-3 h-3 text-[#EF5350] flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[#0F172A]">Ward 42 – Govt. High School</div>
                  <div className="text-[#6B7280] text-[8px]">Heat High / Flood Moderate / AQI High</div>
                </div>
              </div>
              <div className="flex items-start gap-1.5 p-1.5 bg-[#FEF3F2] rounded text-[9px] border border-[#FEE2E2]">
                <AlertTriangle className="w-3 h-3 text-[#EF5350] flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[#0F172A]">Ward 18 – District Hospital</div>
                  <div className="text-[#6B7280] text-[8px]">Flood Very High / Access roads at risk</div>
                </div>
              </div>
              <div className="flex items-start gap-1.5 p-1.5 bg-[#FEF9C3] rounded text-[9px] border border-[#FEF08A]">
                <AlertTriangle className="w-3 h-3 text-[#F59E0B] flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[#0F172A]">Ward 23 – Primary Health Centre</div>
                  <div className="text-[#6B7280] text-[8px]">Heat High / AQI Moderate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3 - Road Network Vulnerability */}
      <div className="border border-[#E5E7EB] rounded-lg bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#E5E7EB]">
          <h3 className="text-xs font-medium text-[#0F172A]">Road Network Vulnerability Index</h3>
        </div>

        <div className="p-3 grid grid-cols-2 gap-3">
          {/* Left Column - Corridor List */}
          <div>
            <div className="text-[10px] font-medium text-[#0F172A] mb-2">Priority Corridors (Top 10)</div>
            <div className="space-y-1.5">
              {corridorData.map((corridor, idx) => (
                <div key={idx} className="p-1.5 bg-gradient-to-r from-[#F8FAFC] to-white rounded border border-[#E5E7EB] hover:border-[#2563EB] transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="text-[9px] font-medium text-[#0F172A]">{corridor.name}</div>
                    <div className="flex items-center gap-1">
                      <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded ${
                        corridor.rcvi > 8 ? 'bg-[#FEE2E2] text-[#EF5350]' :
                        corridor.rcvi > 7 ? 'bg-[#FEF08A] text-[#F59E0B]' :
                        'bg-[#C7D2FE] text-[#2563EB]'
                      }`}>
                        {corridor.rcvi}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-2.5 h-2.5 ${
                            i < corridor.stars ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-[#E5E7EB]'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="text-[7px] text-[#6B7280]">{corridor.hazards}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 text-[8px] text-[#9CA3AF] leading-relaxed">
              RCVI = Road Climate Vulnerability Index (Heat + Flood + AQI + Greenness)
            </div>
          </div>

          {/* Right Column - Road Stretch Detail */}
          <div>
            <div className="text-[10px] font-medium text-[#0F172A] mb-2">Selected Corridor Snapshot</div>
            <div className="p-2 bg-gradient-to-br from-[#F8FAFC] to-white rounded-lg border border-[#E5E7EB]">
              {/* Radar Chart */}
              <ResponsiveContainer width="100%" height={120}>
                <RadarChart data={roadDetailData}>
                  <PolarGrid stroke="#E5E7EB" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 8, fill: '#6B7280' }} />
                  <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fontSize: 8, fill: '#6B7280' }} />
                  <Radar name="Risk" dataKey="value" stroke="#2563EB" fill="#2563EB" fillOpacity={0.3} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      fontSize: '9px'
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-[#EF5350]" />
                  <div>
                    <div className="text-[9px] text-[#6B7280]">Length in buffer</div>
                    <div className="text-[10px] font-medium text-[#0F172A]">3.2 km</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3 text-[#22C55E]" />
                  <div>
                    <div className="text-[9px] text-[#6B7280]">Tree cover 30m</div>
                    <div className="text-[10px] font-medium text-[#0F172A]">18%</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-3 h-3 text-[#8B5CF6]" />
                  <div>
                    <div className="text-[9px] text-[#6B7280]">Schools</div>
                    <div className="text-[10px] font-medium text-[#0F172A]">4</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-[#EF4444]" />
                  <div>
                    <div className="text-[9px] text-[#6B7280]">Hospitals</div>
                    <div className="text-[10px] font-medium text-[#0F172A]">1</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4 - iRAP Road Safety Assessment */}
      <div className="border border-[#E5E7EB] rounded-lg bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#E5E7EB]">
          <h3 className="text-xs font-medium text-[#0F172A]\">iRAP Road Safety Assessment</h3>
        </div>

        <div className="p-3 space-y-3">
          {/* KPI Grid */}
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center p-2 bg-gradient-to-br from-[#DCFCE7] to-white rounded-lg border border-[#BBF7D0]">
              <div style={{ fontSize: '16px', lineHeight: '20px' }} className="font-semibold text-[#E3000F] mb-0.5">12%</div>
              <div className="text-[8px] text-[#6B7280]\">5/4-Star</div>
            </div>
            <div className="text-center p-2 bg-gradient-to-br from-[#FEF9C3] to-white rounded-lg border border-[#FEF08A]">
              <div style={{ fontSize: '16px', lineHeight: '20px' }} className="font-semibold text-[#E3000F] mb-0.5">35%</div>
              <div className="text-[8px] text-[#6B7280]\">3-Star</div>
            </div>
            <div className="text-center p-2 bg-gradient-to-br from-[#FED7AA] to-white rounded-lg border border-[#FDBA74]">
              <div style={{ fontSize: '16px', lineHeight: '20px' }} className="font-semibold text-[#E3000F] mb-0.5">18%</div>
              <div className="text-[8px] text-[#6B7280]\">2-Star</div>
            </div>
            <div className="text-center p-2 bg-gradient-to-br from-[#FEE2E2] to-white rounded-lg border border-[#FECACA]">
              <div style={{ fontSize: '16px', lineHeight: '20px' }} className="font-semibold text-[#E3000F] mb-0.5">7%</div>
              <div className="text-[8px] text-[#6B7280]\">1-Star</div>
            </div>
          </div>

          {/* Safety Rating Distribution Chart */}
          <div>
            <div className="text-[10px] font-medium text-[#0F172A] mb-2">Safety Rating Distribution by Road Length (km)</div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={roadSafetyDistributionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 9, fill: '#6B7280' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    fontSize: '10px'
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {roadSafetyDistributionData.map((entry, index) => (
                    <Bar key={`bar-${index}`} dataKey="value" fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Critical Road Segments */}
          <div>
            <div className="text-[10px] font-medium text-[#0F172A] mb-1.5">Critical Road Segments (Low Safety + High Climate Hazard)</div>
            <div className="space-y-1.5">
              {criticalRoadSegmentsData.map((segment, idx) => (
                <div key={idx} className="p-1.5 bg-gradient-to-r from-[#FEF3F2] to-white rounded border border-[#FEE2E2]">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-[9px] font-medium text-[#0F172A]">{segment.name}</div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-2.5 h-2.5 rounded-sm flex items-center justify-center ${
                            i < segment.rating 
                              ? segment.rating === 1 ? 'bg-[#EF4444]' : segment.rating === 2 ? 'bg-[#F97316]' : 'bg-[#F59E0B]'
                              : 'bg-[#E5E7EB]'
                          }`}
                        >
                          <span className="text-[6px] text-white font-bold">★</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-medium text-[#6B7280]">{segment.type} Safety</span>
                    <span className="text-[7px] text-[#9CA3AF]">{segment.hazards}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="text-[8px] text-[#9CA3AF] leading-relaxed p-2 bg-[#F8FAFC] rounded border border-[#E5E7EB]">
            <strong className="text-[#6B7280]">iRAP Star Rating:</strong> International Road Assessment Programme standard for road safety. 5-star = safest, 1-star = least safe. Ratings shown for Vehicle, Motorcycle, Bicycle, and Pedestrian safety.
          </div>
        </div>
      </div>
    </div>
  );
}