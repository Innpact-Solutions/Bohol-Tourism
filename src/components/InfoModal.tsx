import { useState } from 'react';
import { X, Info } from 'lucide-react';
import gizLogo from 'figma:asset/39e5f727867207694ca664f2c1e37d6974bebf95.png';
import innpactLogo from 'figma:asset/8653321df4847c5ff5813f7d21dc2de3aa03da09.png';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InfoModal({ isOpen, onClose }: InfoModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'metadata'>('metadata');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#2563EB] to-[#1E40AF] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Info className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white text-lg font-semibold">About This Dashboard</h2>
              <p className="text-blue-100 text-xs">Climate Hazard & Mobility Resilience Platform</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-[#F8FAFC] border-b border-[#E5E7EB] px-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('metadata')}
              className={`px-4 py-3 text-sm font-medium transition-all relative ${
                activeTab === 'metadata'
                  ? 'text-[#2563EB]'
                  : 'text-[#64748B] hover:text-[#475569]'
              }`}
            >
              Data Sources & Metadata
              {activeTab === 'metadata' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB]"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-3 text-sm font-medium transition-all relative ${
                activeTab === 'overview'
                  ? 'text-[#2563EB]'
                  : 'text-[#64748B] hover:text-[#475569]'
              }`}
            >
              Assessment Overview & Methodology
              {activeTab === 'overview' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB]"></div>
              )}
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Purpose of the Dashboard */}
              <div>
                <h3 className="text-sm font-semibold text-[#0F172A] mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-[#2563EB] rounded-full"></div>
                  Purpose of the Dashboard
                </h3>
                <p className="text-sm text-[#475569] leading-relaxed">
                  This dashboard provides a city-wide screening of climate hazards and mobility exposure for Bhubaneswar, integrating heat stress, urban flooding, air pollution, and road network vulnerability. It supports evidence-based urban planning, infrastructure prioritisation, and climate-resilient decision-making at city, ward, and network levels.
                </p>
              </div>

              {/* Assessment Framework */}
              <div>
                <h3 className="text-sm font-semibold text-[#0F172A] mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-[#2563EB] rounded-full"></div>
                  Assessment Framework
                </h3>
                <p className="text-sm text-[#475569] mb-3">
                  The assessment follows the IPCC Risk Framework:
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-3">
                  <p className="text-sm font-medium text-[#0F172A] text-center">
                    Climate Risk = Hazard × Exposure × Vulnerability
                  </p>
                </div>
                <ul className="space-y-2 ml-4">
                  <li className="text-sm text-[#475569] flex items-start gap-2">
                    <span className="text-[#2563EB] mt-1 font-semibold">•</span>
                    <span><span className="font-semibold text-[#0F172A]">Hazard:</span> Intensity and spatial distribution of climate stressors</span>
                  </li>
                  <li className="text-sm text-[#475569] flex items-start gap-2">
                    <span className="text-[#2563EB] mt-1 font-semibold">•</span>
                    <span><span className="font-semibold text-[#0F172A]">Exposure:</span> Buildings, road networks, and public infrastructure located in hazard-prone areas</span>
                  </li>
                  <li className="text-sm text-[#475569] flex items-start gap-2">
                    <span className="text-[#2563EB] mt-1 font-semibold">•</span>
                    <span><span className="font-semibold text-[#0F172A]">Vulnerability:</span> Population concentration, land-use intensity, and infrastructure sensitivity</span>
                  </li>
                </ul>
              </div>

              {/* Hazards Assessed */}
              <div>
                <h3 className="text-sm font-semibold text-[#0F172A] mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-[#2563EB] rounded-full"></div>
                  Hazards Assessed
                </h3>
                <p className="text-sm text-[#475569] mb-3">
                  The dashboard covers three primary climate hazards and one composite index:
                </p>
                
                <div className="space-y-4 ml-4">
                  {/* Heat Stress */}
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A] mb-2 flex items-center gap-2">
                      <span className="text-[#E3000F]">•</span>
                      Heat Stress
                    </p>
                    <ul className="space-y-1 ml-6">
                      <li className="text-sm text-[#475569]">◦ Land Surface Temperature (LST)</li>
                      <li className="text-sm text-[#475569]">◦ Air Surface Temperature (AST)</li>
                      <li className="text-sm text-[#475569]">◦ Relative Humidity (RH)</li>
                      <li className="text-sm text-[#475569]">◦ Wet-Bulb Temperature (WBT)</li>
                      <li className="text-sm text-[#475569]">◦ Wet-Bulb Globe Temperature (WBGT)</li>
                      <li className="text-sm text-[#475569]">◦ Urban Heat Island (UHI)</li>
                      <li className="text-sm text-[#475569]">◦ Integrated Heat Hazard Index (HHI)</li>
                    </ul>
                  </div>

                  {/* Urban Flooding & Waterlogging */}
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A] mb-2 flex items-center gap-2">
                      <span className="text-[#2563EB]">•</span>
                      Urban Flooding & Waterlogging
                    </p>
                    <ul className="space-y-1 ml-6">
                      <li className="text-sm text-[#475569]">◦ Integrated Flood Hazard Index (FHI) based on historic inundation, terrain, and drainage</li>
                    </ul>
                  </div>

                  {/* Air Pollution */}
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A] mb-2 flex items-center gap-2">
                      <span className="text-[#10B981]">•</span>
                      Air Pollution
                    </p>
                    <ul className="space-y-1 ml-6">
                      <li className="text-sm text-[#475569]">◦ PM₂.₅, PM₁₀, NO₂, SO₂, CO, O₃</li>
                      <li className="text-sm text-[#475569]">◦ CPCB AQI-based hazard classification</li>
                    </ul>
                  </div>

                  {/* Multi-Hazard Climate Risk */}
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A] mb-2 flex items-center gap-2">
                      <span className="text-[#8B5CF6]">•</span>
                      Multi-Hazard Climate Risk
                    </p>
                    <ul className="space-y-1 ml-6">
                      <li className="text-sm text-[#475569]">◦ Composite overlay of Heat, Flood, and Air Pollution hazards</li>
                      <li className="text-sm text-[#475569]">◦ Equal-weight integration to identify compounded risk zones</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Time Periods Covered */}
              <div>
                <h3 className="text-sm font-semibold text-[#0F172A] mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-[#2563EB] rounded-full"></div>
                  Time Periods Covered
                </h3>
                <ul className="space-y-2 ml-4">
                  <li className="text-sm text-[#475569] flex items-start gap-2">
                    <span className="text-[#2563EB] mt-1 font-semibold">•</span>
                    <span><span className="font-semibold text-[#0F172A]">Heat Stress:</span> March–May 2025 (pre-monsoon peak summer; seasonal mean values)</span>
                  </li>
                  <li className="text-sm text-[#475569] flex items-start gap-2">
                    <span className="text-[#2563EB] mt-1 font-semibold">•</span>
                    <span><span className="font-semibold text-[#0F172A]">Air Pollution:</span> December–February (winters of 2023–24 and 2024–25), representing peak pollution conditions using seasonal mean values</span>
                  </li>
                  <li className="text-sm text-[#475569] flex items-start gap-2">
                    <span className="text-[#2563EB] mt-1 font-semibold">•</span>
                    <span><span className="font-semibold text-[#0F172A]">Urban Flooding & Waterlogging:</span> 2015–2025, based on historic satellite-derived flood and waterlogging occurrences</span>
                  </li>
                  <li className="text-sm text-[#475569] flex items-start gap-2">
                    <span className="text-[#2563EB] mt-1 font-semibold">•</span>
                    <div>
                      <span className="font-semibold text-[#0F172A]">Future Projections</span> (Heat Stress only, where enabled):
                      <ul className="space-y-1 ml-6 mt-1">
                        <li className="text-sm text-[#475569]">◦ 2040 horizon under IPCC CMIP6 scenarios:</li>
                        <li className="text-sm text-[#475569] ml-4">− SSP1–2.6 (Low emissions)</li>
                        <li className="text-sm text-[#475569] ml-4">− SSP2–4.5 (Medium / current trajectory)</li>
                        <li className="text-sm text-[#475569] ml-4">− SSP5–8.5 (High emissions)</li>
                      </ul>
                    </div>
                  </li>
                </ul>
                <p className="text-sm text-[#475569] mt-3 italic">
                  Seasonal and monthly means represent sustained exposure rather than short-term extremes.
                </p>
              </div>

              {/* Spatial Assessment Levels */}
              <div>
                <h3 className="text-sm font-semibold text-[#0F172A] mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-[#2563EB] rounded-full"></div>
                  Spatial Assessment Levels
                </h3>
                <ul className="space-y-2 ml-4">
                  <li className="text-sm text-[#475569] flex items-start gap-2">
                    <span className="text-[#2563EB] mt-1 font-semibold">•</span>
                    <span><span className="font-semibold text-[#0F172A]">Spot-Level:</span> Individual infrastructure and public amenities assessed using a 100 m buffer</span>
                  </li>
                  <li className="text-sm text-[#475569] flex items-start gap-2">
                    <span className="text-[#2563EB] mt-1 font-semibold">•</span>
                    <span><span className="font-semibold text-[#0F172A]">Network-Level:</span> Road network segmented into 200 m sections, buffered by 50 m, to assess climate risk along mobility corridors</span>
                  </li>
                </ul>
              </div>

              {/* Road Safety Integration */}
              <div>
                <h3 className="text-sm font-semibold text-[#0F172A] mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-[#2563EB] rounded-full"></div>
                  Road Safety Integration
                </h3>
                <p className="text-sm text-[#475569] mb-3">
                  Selected corridors are assessed using the iRAP methodology, enabling:
                </p>
                <ul className="space-y-2 ml-4">
                  <li className="text-sm text-[#475569] flex items-start gap-2">
                    <span className="text-[#2563EB] mt-1 font-semibold">•</span>
                    <span>Star rating–based road safety risk assessment</span>
                  </li>
                  <li className="text-sm text-[#475569] flex items-start gap-2">
                    <span className="text-[#2563EB] mt-1 font-semibold">•</span>
                    <span>Identification of climate-vulnerable and safety-critical road segments</span>
                  </li>
                  <li className="text-sm text-[#475569] flex items-start gap-2">
                    <span className="text-[#2563EB] mt-1 font-semibold">•</span>
                    <span>Support for integrated transport, safety, and climate interventions</span>
                  </li>
                </ul>
              </div>

              {/* Data Validation and Ground Truthing */}
              <div>
                <h3 className="text-sm font-semibold text-[#0F172A] mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-[#2563EB] rounded-full"></div>
                  Data Validation and Ground Truthing
                </h3>
                <p className="text-sm text-[#475569] leading-relaxed">
                  Satellite-derived hazard layers were validated using historical event records, media reports, field observations, and stakeholder inputs. Flood and waterlogging hotspots were cross-verified with documented incidents. Air pollution estimates were cross-checked and calibrated using CPCB ground monitoring station data for Bhubaneswar, ensuring consistency with observed concentrations and AQI categories.
                </p>
              </div>

              {/* Key Outputs Displayed */}
              <div>
                <h3 className="text-sm font-semibold text-[#0F172A] mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-[#2563EB] rounded-full"></div>
                  Key Outputs Displayed
                </h3>
                <ul className="space-y-2 ml-4">
                  <li className="text-sm text-[#475569] flex items-start gap-2">
                    <span className="text-[#2563EB] mt-1 font-semibold">•</span>
                    <span>Hazard intensity maps</span>
                  </li>
                  <li className="text-sm text-[#475569] flex items-start gap-2">
                    <span className="text-[#2563EB] mt-1 font-semibold">•</span>
                    <span>Infrastructure and road network exposure metrics</span>
                  </li>
                  <li className="text-sm text-[#475569] flex items-start gap-2">
                    <span className="text-[#2563EB] mt-1 font-semibold">•</span>
                    <span>Ward-wise and corridor-wise summaries</span>
                  </li>
                  <li className="text-sm text-[#475569] flex items-start gap-2">
                    <span className="text-[#2563EB] mt-1 font-semibold">•</span>
                    <span>Multi-hazard hotspot identification</span>
                  </li>
                  <li className="text-sm text-[#475569] flex items-start gap-2">
                    <span className="text-[#2563EB] mt-1 font-semibold">•</span>
                    <span>Decision-support inputs for Nature-Based Solutions (NbS) and climate resilience planning</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'metadata' && (
            <div className="space-y-6">
              {/* Climate & Environmental Data - Heat Stress */}
              <div>
                <h3 className="text-sm font-semibold text-[#0F172A] mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-[#E3000F] rounded-full"></div>
                  Climate & Environmental Data - Heat Stress
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border border-[#E5E7EB]">
                    <thead>
                      <tr className="bg-[#F8FAFC]">
                        <th className="px-3 py-2 text-left font-semibold text-[#0F172A] border-b border-r border-[#E5E7EB]">Theme</th>
                        <th className="px-3 py-2 text-left font-semibold text-[#0F172A] border-b border-r border-[#E5E7EB]">Parameter / Layer</th>
                        <th className="px-3 py-2 text-left font-semibold text-[#0F172A] border-b border-r border-[#E5E7EB]">Dataset / Method</th>
                        <th className="px-3 py-2 text-left font-semibold text-[#0F172A] border-b border-r border-[#E5E7EB]">Period</th>
                        <th className="px-3 py-2 text-left font-semibold text-[#0F172A] border-b border-[#E5E7EB]">Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-[#F8FAFC]">
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Heat Stress</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Land Surface Temperature (LST)</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Landsat 8 (ST_B10)</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Mar–Oct, 2025</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-[#E5E7EB]">NASA–USGS</td>
                      </tr>
                      <tr className="hover:bg-[#F8FAFC]">
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Heat Stress</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Air Surface Temperature (AST)</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">ERA5 Reanalysis</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Mar–Oct, 2025</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-[#E5E7EB]">ECMWF</td>
                      </tr>
                      <tr className="hover:bg-[#F8FAFC]">
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Heat Stress</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Relative Humidity (RH)</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">ERA5 Reanalysis</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Mar–Oct, 2025</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-[#E5E7EB]">ECMWF</td>
                      </tr>
                      <tr className="hover:bg-[#F8FAFC]">
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Heat Stress</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Wet-Bulb Temperature (WBT)</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Derived (Stull's Equation)</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Mar–Oct, 2025</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-[#E5E7EB]">NDMA-aligned</td>
                      </tr>
                      <tr className="hover:bg-[#F8FAFC]">
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Heat Stress</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Wet-Bulb Globe Temperature (WBGT)</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Derived (Liljegren Method)</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Mar–Oct, 2025</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-[#E5E7EB]">ISO 7243 / NIOSH</td>
                      </tr>
                      <tr className="hover:bg-[#F8FAFC]">
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Heat Stress</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Urban Heat Island (UHI)</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">LST-based spatial smoothing</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Mar–Oct, 2025</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-[#E5E7EB]">GIS-derived</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Urban Flooding & Waterlogging */}
              <div>
                <h3 className="text-sm font-semibold text-[#0F172A] mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-[#2563EB] rounded-full"></div>
                  Urban Flooding & Waterlogging
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border border-[#E5E7EB]">
                    <thead>
                      <tr className="bg-[#F8FAFC]">
                        <th className="px-3 py-2 text-left font-semibold text-[#0F172A] border-b border-r border-[#E5E7EB]">Theme</th>
                        <th className="px-3 py-2 text-left font-semibold text-[#0F172A] border-b border-r border-[#E5E7EB]">Parameter / Layer</th>
                        <th className="px-3 py-2 text-left font-semibold text-[#0F172A] border-b border-r border-[#E5E7EB]">Dataset / Method</th>
                        <th className="px-3 py-2 text-left font-semibold text-[#0F172A] border-b border-r border-[#E5E7EB]">Period</th>
                        <th className="px-3 py-2 text-left font-semibold text-[#0F172A] border-b border-[#E5E7EB]">Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-[#F8FAFC]">
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Flooding</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Historic Flood / Waterlogging Occurrence</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Sentinel-1 SAR (VV)</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">2015–2025</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-[#E5E7EB]">ESA Copernicus</td>
                      </tr>
                      <tr className="hover:bg-[#F8FAFC]">
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Flooding</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Terrain & Slope</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">SRTM DEM</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Static</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-[#E5E7EB]">NASA</td>
                      </tr>
                      <tr className="hover:bg-[#F8FAFC]">
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Flooding</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Drainage Density</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Hydrologically processed DEM</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Static</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-[#E5E7EB]">GIS-derived</td>
                      </tr>
                      <tr className="hover:bg-[#F8FAFC]">
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Flooding</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Flood Hazard Index (FHI)</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Weighted overlay</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">2015–2025</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-[#E5E7EB]">Modelled</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-[#475569] mt-2 italic">
                  Note: Analysis represents natural drainage only; detailed man-made stormwater network data was unavailable.
                </p>
              </div>

              {/* Air Pollution */}
              <div>
                <h3 className="text-sm font-semibold text-[#0F172A] mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-[#10B981] rounded-full"></div>
                  Air Pollution
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border border-[#E5E7EB]">
                    <thead>
                      <tr className="bg-[#F8FAFC]">
                        <th className="px-3 py-2 text-left font-semibold text-[#0F172A] border-b border-r border-[#E5E7EB]">Theme</th>
                        <th className="px-3 py-2 text-left font-semibold text-[#0F172A] border-b border-r border-[#E5E7EB]">Pollutant</th>
                        <th className="px-3 py-2 text-left font-semibold text-[#0F172A] border-b border-r border-[#E5E7EB]">Dataset / Method</th>
                        <th className="px-3 py-2 text-left font-semibold text-[#0F172A] border-b border-r border-[#E5E7EB]">Period</th>
                        <th className="px-3 py-2 text-left font-semibold text-[#0F172A] border-b border-[#E5E7EB]">Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-[#F8FAFC]">
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Air Quality</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">PM₂.₅</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">MODIS AOD + met reanalysis</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Dec–Feb (2025)</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-[#E5E7EB]">NASA</td>
                      </tr>
                      <tr className="hover:bg-[#F8FAFC]">
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Air Quality</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">PM₁₀</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">MODIS AOD + ERA5 / MERRA-2</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Dec–Feb (2025)</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-[#E5E7EB]">NASA / ECMWF</td>
                      </tr>
                      <tr className="hover:bg-[#F8FAFC]">
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Air Quality</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">NO₂</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Sentinel-5P TROPOMI</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Dec–Feb (2025)</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-[#E5E7EB]">ESA</td>
                      </tr>
                      <tr className="hover:bg-[#F8FAFC]">
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Air Quality</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">SO₂</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Sentinel-5P TROPOMI</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Dec–Feb (2025)</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-[#E5E7EB]">ESA</td>
                      </tr>
                      <tr className="hover:bg-[#F8FAFC]">
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Air Quality</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">CO</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Sentinel-5P TROPOMI</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Dec–Feb (2025)</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-[#E5E7EB]">ESA</td>
                      </tr>
                      <tr className="hover:bg-[#F8FAFC]">
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Air Quality</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">O₃</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Sentinel-5P TROPOMI</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Dec–Feb (2025)</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-[#E5E7EB]">ESA</td>
                      </tr>
                      <tr className="hover:bg-[#F8FAFC]">
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Air Quality</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">AQI Classification</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Computed (CPCB NAQI Standard)</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Dec–Feb (2025)</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-[#E5E7EB]">Modelled</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-[#475569] mt-2 italic">
                  Satellite-derived air pollution concentrations were spatially downscaled and cross-checked and calibrated using CPCB ground monitoring station data for Bhubaneswar, ensuring consistency with observed AQI categories.
                </p>
              </div>

              {/* Infrastructure & Mobility Data */}
              <div>
                <h3 className="text-sm font-semibold text-[#0F172A] mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-[#F59E0B] rounded-full"></div>
                  Infrastructure & Mobility Data
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border border-[#E5E7EB]">
                    <thead>
                      <tr className="bg-[#F8FAFC]">
                        <th className="px-3 py-2 text-left font-semibold text-[#0F172A] border-b border-r border-[#E5E7EB]">Theme</th>
                        <th className="px-3 py-2 text-left font-semibold text-[#0F172A] border-b border-r border-[#E5E7EB]">Dataset</th>
                        <th className="px-3 py-2 text-left font-semibold text-[#0F172A] border-b border-r border-[#E5E7EB]">Description</th>
                        <th className="px-3 py-2 text-left font-semibold text-[#0F172A] border-b border-[#E5E7EB]">Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-[#F8FAFC]">
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Roads</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Road Network</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">National highways, major roads, link roads</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-[#E5E7EB]">BMC / State Sources</td>
                      </tr>
                      <tr className="hover:bg-[#F8FAFC]">
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Transport</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Public Transport Assets</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Bus stops, terminals, railway stations, airport</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-[#E5E7EB]">BMC / Bhubaneshwar One</td>
                      </tr>
                      <tr className="hover:bg-[#F8FAFC]">
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Social Infrastructure</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Education Facilities</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Schools, colleges, anganwadis</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-[#E5E7EB]">BMC / Bhubaneshwar One</td>
                      </tr>
                      <tr className="hover:bg-[#F8FAFC]">
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Social Infrastructure</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Health Facilities</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Hospitals, clinics, UCHCs, UPHCs</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-[#E5E7EB]">BMC / Bhubaneshwar One</td>
                      </tr>
                      <tr className="hover:bg-[#F8FAFC]">
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Public Amenities</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Civic & Social Assets</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Markets, parks, religious places, govt. buildings</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-[#E5E7EB]">BMC / Bhubaneshwar One</td>
                      </tr>
                      <tr className="hover:bg-[#F8FAFC]">
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Boundaries</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Administrative Wards</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Ward boundaries for aggregation</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-[#E5E7EB]">BMC / Bhubaneshwar One</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Road Safety Data */}
              <div>
                <h3 className="text-sm font-semibold text-[#0F172A] mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-[#DC2626] rounded-full"></div>
                  Road Safety Data
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border border-[#E5E7EB]">
                    <thead>
                      <tr className="bg-[#F8FAFC]">
                        <th className="px-3 py-2 text-left font-semibold text-[#0F172A] border-b border-r border-[#E5E7EB]">Theme</th>
                        <th className="px-3 py-2 text-left font-semibold text-[#0F172A] border-b border-r border-[#E5E7EB]">Dataset / Method</th>
                        <th className="px-3 py-2 text-left font-semibold text-[#0F172A] border-b border-r border-[#E5E7EB]">Description</th>
                        <th className="px-3 py-2 text-left font-semibold text-[#0F172A] border-b border-[#E5E7EB]">Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-[#F8FAFC]">
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Road Safety</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">iRAP Surveys</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Road attribute coding, video surveys, speed data</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-[#E5E7EB]">iRAP</td>
                      </tr>
                      <tr className="hover:bg-[#F8FAFC]">
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Road Safety</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Star Ratings</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Safety risk classification of corridors</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-[#E5E7EB]">iRAP</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Climate Projections */}
              <div>
                <h3 className="text-sm font-semibold text-[#0F172A] mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-[#8B5CF6] rounded-full"></div>
                  Climate Projections (Heat Stress Only)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border border-[#E5E7EB]">
                    <thead>
                      <tr className="bg-[#F8FAFC]">
                        <th className="px-3 py-2 text-left font-semibold text-[#0F172A] border-b border-r border-[#E5E7EB]">Theme</th>
                        <th className="px-3 py-2 text-left font-semibold text-[#0F172A] border-b border-r border-[#E5E7EB]">Dataset</th>
                        <th className="px-3 py-2 text-left font-semibold text-[#0F172A] border-b border-r border-[#E5E7EB]">Scenario</th>
                        <th className="px-3 py-2 text-left font-semibold text-[#0F172A] border-b border-r border-[#E5E7EB]">Projection Year</th>
                        <th className="px-3 py-2 text-left font-semibold text-[#0F172A] border-b border-[#E5E7EB]">Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-[#F8FAFC]">
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Climate Projection</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">CMIP6 Ensemble</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">SSP1–2.6</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">2040</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-[#E5E7EB]">IPCC</td>
                      </tr>
                      <tr className="hover:bg-[#F8FAFC]">
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Climate Projection</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">CMIP6 Ensemble</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">SSP2–4.5</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">2040</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-[#E5E7EB]">IPCC</td>
                      </tr>
                      <tr className="hover:bg-[#F8FAFC]">
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Climate Projection</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">CMIP6 Ensemble</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">SSP5–8.5</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">2040</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-[#E5E7EB]">IPCC</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Data Use & Limitations */}
              <div>
                <h3 className="text-sm font-semibold text-[#0F172A] mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-[#64748B] rounded-full"></div>
                  Data Use & Limitations
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border border-[#E5E7EB]">
                    <thead>
                      <tr className="bg-[#F8FAFC]">
                        <th className="px-3 py-2 text-left font-semibold text-[#0F172A] border-b border-r border-[#E5E7EB]">Aspect</th>
                        <th className="px-3 py-2 text-left font-semibold text-[#0F172A] border-b border-[#E5E7EB]">Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-[#F8FAFC]">
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Spatial Coverage</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-[#E5E7EB]">Satellite data enables full city coverage but may differ from point observations</td>
                      </tr>
                      <tr className="hover:bg-[#F8FAFC]">
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Flood Modelling</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-[#E5E7EB]">Man-made drainage data not available; natural drainage used</td>
                      </tr>
                      <tr className="hover:bg-[#F8FAFC]">
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Projections</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-[#E5E7EB]">Represent relative climate change, not exact local forecasts</td>
                      </tr>
                      <tr className="hover:bg-[#F8FAFC]">
                        <td className="px-3 py-2 text-[#475569] border-b border-r border-[#E5E7EB]">Intended Use</td>
                        <td className="px-3 py-2 text-[#475569] border-b border-[#E5E7EB]">Screening, prioritisation, and planning (not engineering design)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-[#F8FAFC] px-6 py-4 border-t border-[#E5E7EB] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={gizLogo} alt="GIZ" className="h-6 object-contain" />
            <div className="w-px h-6 bg-[#E5E7EB]"></div>
            <a 
              href="https://innpactsolutions.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 group hover:opacity-80 transition-opacity"
            >
              <img src={innpactLogo} alt="Innpact Solutions" className="h-5 object-contain" />
              <p className="text-xs text-[#64748B] group-hover:text-[#2563EB] transition-colors">
                Developed by Innpact Solutions
              </p>
            </a>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#2563EB] hover:bg-[#1E40AF] text-white text-xs font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}