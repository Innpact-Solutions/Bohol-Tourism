import React, { useState } from 'react';
import { X, LayoutGrid, Shield, Truck, Recycle, DollarSign, Users, RefreshCw, Download, Info, ChevronDown, ChevronRight, Layers, Map, Settings, Sliders, CheckSquare, List, MapPin, Building2, FileText, Globe, Network, Home, Wrench, Factory, Calendar, Database, UserCheck, Waves, Droplets, Zap, AlertTriangle, AlertOctagon, AlertCircle, Flag, Route, Navigation, Circle, Hotel, TreeDeciduous, GraduationCap, Heart, Building, Leaf, Sprout, PlusCircle, Container, PlusSquare, Upload, MousePointer, ArrowDown, CheckCircle, Package, Box, Check } from 'lucide-react';
import type { CWISModule } from './ModuleNavigationTabs';
import { VennDiagramSelector, ContainmentRiskInteractionDiagram } from './VennDiagramSimple';

export interface FstpFacilityState {
  facilityId: number;
  facilityName: string;
  enabled: boolean;
  scenario: 'Normal' | 'Peak';
  activeBands: string[];
}

export const DEFAULT_FSTP_LAYERS: FstpFacilityState[] = [
  { facilityId: 3, facilityName: 'Existing FSTP (Dauis)',          enabled: false, scenario: 'Normal', activeBands: ['< 10 min', '10 - 20 min', '20 - 30 min', '> 30 min'] },
  { facilityId: 1, facilityName: 'FSTP Tagbilaran, Option 1 (Dao)',     enabled: false, scenario: 'Normal', activeBands: ['< 10 min', '10 - 20 min', '20 - 30 min', '> 30 min'] },
  { facilityId: 2, facilityName: 'FSTP Tagbilaran, Option 2 (Tiptip)', enabled: false, scenario: 'Normal', activeBands: ['< 10 min', '10 - 20 min', '20 - 30 min', '> 30 min'] },
];

const FSTP_FACILITY_META: Record<number, { color: string; description: string }> = {
  3: { color: '#22C55E', description: 'Operational treatment plant in Dauis municipality' },
  1: { color: '#3B82F6', description: 'Proposed FSTP site in Brgy. Dao, Tagbilaran' },
  2: { color: '#A855F7', description: 'Proposed FSTP site in Brgy. Tiptip, Tagbilaran' },
};

interface ModulePanelProps {
  activeModule: CWISModule;
  onClose: () => void;
  activeSewerCategories?: string[];
  onSewerCategoriesChange?: (cats: string[]) => void;
  activeGridSewerCategories?: string[];
  onGridSewerCategoriesChange?: (cats: string[]) => void;
  sewerViewMode?: 'grid' | 'buildings';
  onSewerViewModeChange?: (mode: 'grid' | 'buildings') => void;
  onScenarioResult?: (geojson: any | null, networkGids?: number[], bufferBldgIds?: number[], bufferGeomJson?: any | null, excludedBldgIds?: number[]) => void;
  onStatsChange?: (stats: {
    grid_count: number; area_ha: number;
    network_bldgs: number; onsite_bldgs: number; nonnetwork_bldgs: number; total_bldgs: number;
    by_municipality: Array<{ mun: string; network: number; onsite: number; nonnetwork: number }>;
  } | null) => void;
  selectedLguName?: string;
  selectedWardName?: string;
  isBuildingsLoading?: boolean;
  onScenarioRunningChange?: (running: boolean) => void;
  onUserRun?: () => void;
  activeFstpLayers?: FstpFacilityState[];
  onFstpLayersChange?: (layers: FstpFacilityState[]) => void;
  showFstpBuildings?: boolean;
  onShowFstpBuildingsChange?: (v: boolean) => void;
  activeFleetClasses?: string[];
  onFleetClassesChange?: (classes: string[]) => void;
}

// Helper function to get icon for a layer
function getLayerIcon(layerName: string) {
  // Module 1 - System Suitability
  if (layerName.includes('Network Coverage')) return Network;
  if (layerName.includes('Non-Network')) return Building2;
  if (layerName.includes('On-site')) return Home;
  
  // Module 2 - Toilet Access
  if (layerName.includes('Existing')) return Building2;
  if (layerName.includes('Upgrades') || layerName.includes('Refurbishment')) return Wrench;
  if (layerName.includes('Proposed Public')) return MapPin;
  if (layerName.includes('Proposed Community')) return Users;
  
  // Module 3 - Collection & Transport
  if (layerName.includes('Fleet Capacity (10 KL)')) return Truck;
  if (layerName.includes('Fleet Capacity (5 KL)')) return Truck;
  if (layerName.includes('Fleet Capacity (2 KL)')) return Truck;
  if (layerName.includes('Need Additional Pump')) return Zap;
  if (layerName.includes('Inaccessible')) return X;
  
  // Module 3 - Travel Time Network Analysis
  if (layerName.includes('Existing FSTP') && layerName.includes('Dauis')) return Route;
  if (layerName.includes('Proposed FSTP') && layerName.includes('Tagbilaran')) return Route;
  if (layerName.includes('Factoring Both FSTP')) return Navigation;
  
  // Module 4 - Treatment
  if (layerName.includes('FSTP')) return Factory;
  if (layerName.includes('Dauis')) return Recycle;
  if (layerName.includes('Tagbilaran')) return Recycle;
  
  // Module 5 - Financial
  if (layerName.includes('Safe Toilet')) return Shield;
  if (layerName.includes('Public and Community')) return MapPin;
  if (layerName.includes('Collection')) return Truck;
  if (layerName.includes('Treatment')) return Recycle;
  if (layerName.includes('Interceptor')) return Waves;
  if (layerName.includes('Overall')) return DollarSign;
  
  // Module 6 - Enabling
  if (layerName.includes('Phase')) return Calendar;
  if (layerName.includes('Short Term')) return Calendar;
  if (layerName.includes('Medium Term')) return Calendar;
  if (layerName.includes('Long Term')) return Calendar;
  
  // Default
  return Layers;
}

export function ModulePanel({ activeModule, onClose, activeSewerCategories = [], onSewerCategoriesChange, activeGridSewerCategories = [], onGridSewerCategoriesChange, sewerViewMode = 'buildings', onSewerViewModeChange, onScenarioResult, onStatsChange, selectedLguName, selectedWardName, isBuildingsLoading = false, onScenarioRunningChange, onUserRun, activeFstpLayers = DEFAULT_FSTP_LAYERS, onFstpLayersChange, showFstpBuildings = false, onShowFstpBuildingsChange, activeFleetClasses = [], onFleetClassesChange }: ModulePanelProps) {
  if (!activeModule) return null;

  const moduleConfig = getModuleConfig(activeModule);
  
  // Collapsible section states
  const [outputLayerExpanded, setOutputLayerExpanded] = useState(true);
  const [scenarioExpanded, setScenarioExpanded] = useState(true);
  const [publicToiletsExpanded, setPublicToiletsExpanded] = useState(true);
  const [additionalExpanded, setAdditionalExpanded] = useState(true);
  const [additional2Expanded, setAdditional2Expanded] = useState(true);
  const [additional3Expanded, setAdditional3Expanded] = useState(true);

  return (
    <div className="w-72 bg-[#0B1120] border-r border-[#334155] flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-3 border-b border-[#334155]"
        style={{
          background: `linear-gradient(135deg, ${moduleConfig.color}22, #162032)`
        }}
      >
        <div className="flex items-center gap-2">
          <moduleConfig.icon 
            className="w-5 h-5" 
            style={{ color: moduleConfig.color }}
          />
          <div>
            <div className="text-[10px] font-bold text-[#94A3B8]">
              {moduleConfig.moduleNumber}
            </div>
            <div className="text-[12px] font-bold text-white">
              {moduleConfig.title}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-[#1E293B] rounded transition-colors"
          title="Close panel"
        >
          <X className="w-4 h-4 text-[#94A3B8]" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0B1120]">
        {/* Purpose */}
        <div className="px-4 py-3 border-b border-[#334155] bg-[#162032]">
          <div className="text-[12px] font-bold text-[#94A3B8] mb-1.5">🎯 Purpose</div>
          <div className="text-[11px] text-[#94A3B8] leading-relaxed">
            {moduleConfig.purpose}
          </div>
        </div>

        {/* Output Layer Selector Section - Collapsible */}
        {(moduleConfig.outputLayerTitle || moduleConfig.outputLayers || moduleConfig.useVennDiagram || moduleConfig.useHierarchicalLayers) && !moduleConfig.skipOutputSection && (
          <div className="border-b border-[#334155]">
          <button
            onClick={() => setOutputLayerExpanded(!outputLayerExpanded)}
            className="w-full bg-[#162032] px-4 py-2.5 hover:bg-[#1E293B] transition-all duration-200 text-left cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2 flex-1">
                <div className="w-1 h-3.5 rounded-full mt-0.5 flex-shrink-0" style={{ background: `linear-gradient(to bottom, ${moduleConfig.color}, ${moduleConfig.color}CC)` }} />
                <div className="flex-1">
                  <h3 className="text-xs font-semibold text-white">
                    {moduleConfig.outputLayerTitle || 'Output Layer Selector'}
                  </h3>
                </div>
              </div>
              <div className="ml-2 flex-shrink-0">
                {outputLayerExpanded ? (
                  <ChevronDown className="w-4 h-4 text-[#94A3B8] group-hover:text-white transition-colors" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-white transition-colors" />
                )}
              </div>
            </div>
          </button>
          {outputLayerExpanded && (
            <div className="px-3 py-3 bg-[#0B1120]">
              {moduleConfig.useVennDiagram ? (
                <>
                  <VennDiagramSelector />
                  <ContainmentRiskInteractionDiagram />
                </>
              ) : moduleConfig.useHierarchicalLayers ? (
                <HierarchicalLayerSelector 
                  layers={moduleConfig.hierarchicalLayers}
                  moduleColor={moduleConfig.color}
                />
              ) : moduleConfig.useModule3Fleet ? (
                <Module3FleetSelector
                  activeClasses={activeFleetClasses}
                  onChange={classes => {
                    onFleetClassesChange?.(classes);
                    // Mutual exclusivity: fleet on → disable all FSTP
                    if (classes.length > 0) {
                      onFstpLayersChange?.(activeFstpLayers.map(f => ({ ...f, enabled: false })));
                    }
                  }}
                />
              ) : activeModule === 'module1_suitability' ? (
                // ── Module 1: unified Sanitation Zone selector ──────────────
                <div className="space-y-3">
                  {/* Zone multi-select — buildings only */}
                  <div>
                    <div className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Zones</div>
                    <div className="space-y-1">
                      {([
                        { label: 'Network Coverage',     value: 'Sewer Feasible',    color: '#14B8A6', icon: Network  },
                        { label: 'On-site Treatment',    value: 'On-site Treatment', color: '#8B5CF6', icon: Building2 },
                        { label: 'Non-Network Coverage', value: 'Non-Sewer',         color: '#F59E0B', icon: Building2 },
                      ] as const).map(opt => {
                        const activeCats = activeSewerCategories;
                        const isActive = activeCats.includes(opt.value);
                        const Icon = opt.icon;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => {
                              const next = isActive
                                ? activeSewerCategories.filter(v => v !== opt.value)
                                : [...activeSewerCategories, opt.value];
                              onSewerCategoriesChange?.(next);
                            }}
                            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-left transition-all duration-200 ${
                              isActive
                                ? 'text-white shadow-sm'
                                : 'hover:bg-[#1E293B] text-[#CBD5E1]'
                            }`}
                            style={{
                              background: isActive ? `linear-gradient(to right, ${opt.color}CC, ${opt.color}99)` : undefined,
                            }}
                          >
                            <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-white' : ''}`}
                              style={{ color: isActive ? undefined : opt.color }} />
                            <span className={`text-[11px] font-medium flex-1 ${isActive ? 'text-white' : 'text-[#CBD5E1]'}`}>
                              {opt.label}
                            </span>
                            {isActive && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white opacity-80" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <OutputLayerSelector 
                  layers={moduleConfig.outputLayers}
                  defaultLayer={moduleConfig.defaultLayer}
                  moduleColor={moduleConfig.color}
                />
              )}
            </div>
          )}
          </div>
        )}

        {/* Scenario Creator Section - Collapsible */}
        {moduleConfig.scenarioCreatorTitle && (
          <div className="border-b border-[#334155]">
            <button
              onClick={() => setScenarioExpanded(!scenarioExpanded)}
              className="w-full bg-[#162032] px-4 py-2.5 hover:bg-[#1E293B] transition-all duration-200 text-left cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2 flex-1">
                  <div className="w-1 h-3.5 rounded-full mt-0.5 flex-shrink-0" style={{ background: `linear-gradient(to bottom, ${moduleConfig.color}, ${moduleConfig.color}CC)` }} />
                  <div className="flex-1">
                    <h3 className="text-xs font-semibold text-white">
                      {moduleConfig.scenarioCreatorTitle || 'Scenario Creator'}
                    </h3>
                  </div>
                </div>
                <div className="ml-2 flex-shrink-0">
                  {scenarioExpanded ? (
                    <ChevronDown className="w-4 h-4 text-[#94A3B8] group-hover:text-white transition-colors" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-white transition-colors" />
                  )}
                </div>
              </div>
            </button>
            {scenarioExpanded && (
              <div className="px-3 py-3 bg-[#0B1120]">
                {(moduleConfig.scenarioUseHierarchicalLayers || (moduleConfig.useHierarchicalLayers && !moduleConfig.outputLayerTitle)) ? (
                  <HierarchicalLayerSelector 
                    layers={moduleConfig.hierarchicalLayers}
                    moduleColor={moduleConfig.color}
                    defaultExpanded={true}
                  />
                ) : (
                  activeModule === 'module1_suitability' ? (
                    <Module1ScenarioCreator
                      moduleColor={moduleConfig.color}
                      onScenarioResult={onScenarioResult}
                      onStatsChange={onStatsChange}
                      selectedLguName={selectedLguName}
                      selectedWardName={selectedWardName}
                      isBuildingsLoading={isBuildingsLoading}
                      onScenarioRunningChange={onScenarioRunningChange}
                      onUserRun={onUserRun}
                    />
                  ) : (
                  <ScenarioCreator 
                    config={moduleConfig.scenarioConfig}
                    moduleColor={moduleConfig.color}
                  />
                  )
                )}
              </div>
            )}
          </div>
        )}

        {/* Public and Community Toilets (Module 2 only) - Collapsible */}
        {moduleConfig.publicToiletsSection && (
          <div className="border-b border-[#334155]">
            <button
              onClick={() => setPublicToiletsExpanded(!publicToiletsExpanded)}
              className="w-full bg-[#162032] px-4 py-2.5 hover:bg-[#1E293B] transition-all duration-200 text-left cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2 flex-1">
                  <div className="w-1 h-3.5 rounded-full mt-0.5 flex-shrink-0" style={{ background: `linear-gradient(to bottom, ${moduleConfig.color}, ${moduleConfig.color}CC)` }} />
                  <div className="flex-1">
                    <h3 className="text-xs font-semibold text-white">
                      {moduleConfig.publicToiletsSection.title}
                    </h3>
                  </div>
                </div>
                <div className="ml-2 flex-shrink-0">
                  {publicToiletsExpanded ? (
                    <ChevronDown className="w-4 h-4 text-[#94A3B8] group-hover:text-white transition-colors" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-white transition-colors" />
                  )}
                </div>
              </div>
            </button>
            {publicToiletsExpanded && (
              <div className="px-3 py-3 bg-[#0B1120]">
                <OutputLayerSelector 
                  layers={moduleConfig.publicToiletsSection.layers}
                  defaultLayer={moduleConfig.publicToiletsSection.defaultLayer}
                  radioGroupName="public-toilets"
                  moduleColor={moduleConfig.color}
                />
              </div>
            )}
          </div>
        )}

        {/* Additional Section (Module 3 & 4) - Collapsible */}
        {moduleConfig.additionalSection && (
          <div className="border-b border-[#334155]">
            <button
              onClick={() => setAdditionalExpanded(!additionalExpanded)}
              className="w-full bg-[#162032] px-4 py-2.5 hover:bg-[#1E293B] transition-all duration-200 text-left cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2 flex-1">
                  <div className="w-1 h-3.5 rounded-full mt-0.5 flex-shrink-0" style={{ background: `linear-gradient(to bottom, ${moduleConfig.color}, ${moduleConfig.color}CC)` }} />
                  <div className="flex-1">
                    <h3 className="text-xs font-semibold text-white">
                      {moduleConfig.additionalSection.title}
                    </h3>
                  </div>
                </div>
                <div className="ml-2 flex-shrink-0">
                  {additionalExpanded ? (
                    <ChevronDown className="w-4 h-4 text-[#94A3B8] group-hover:text-white transition-colors" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-white transition-colors" />
                  )}
                </div>
              </div>
            </button>
            {additionalExpanded && (
              <div className="px-3 py-3 space-y-3 bg-[#0B1120]">
                {activeModule === 'module3_collection' ? (
                  <FstpTravelTimePanel
                    value={activeFstpLayers}
                    onChange={layers => {
                      (onFstpLayersChange ?? (() => {}))(layers);
                      // Mutual exclusivity: FSTP enabled → clear fleet classes
                      if (layers.some(f => f.enabled)) {
                        onFleetClassesChange?.([]);
                      }
                    }}
                    showBuildings={showFstpBuildings}
                    onShowBuildingsChange={onShowFstpBuildingsChange ?? (() => {})}
                  />
                ) : moduleConfig.additionalSection.useHierarchicalLayers ? (
                  <HierarchicalLayerSelector 
                    layers={moduleConfig.additionalSection.hierarchicalLayers}
                    moduleColor={moduleConfig.color}
                    defaultExpanded={true}
                  />
                ) : (
                  <>
                    {moduleConfig.additionalSection.layers && (
                      <ServiceAreaLayerSelector 
                        layers={moduleConfig.additionalSection.layers}
                        defaultLayer={moduleConfig.additionalSection.defaultLayer}
                        moduleColor={moduleConfig.color}
                      />
                    )}
                    {moduleConfig.additionalSection.radioGroups && moduleConfig.additionalSection.radioGroups.map((group: any) => (
                      <RadioGroupControl key={group.label} label={group.label} options={group.options} defaultValue={group.defaultValue} moduleColor={moduleConfig.color} />
                    ))}
                    {moduleConfig.additionalSection.checkboxes && (
                      <div className="space-y-1">
                        {moduleConfig.additionalSection.checkboxes.map((checkbox: string) => (
                          <CheckboxControl key={checkbox} label={checkbox} />
                        ))}
                      </div>
                    )}
                    {moduleConfig.additionalSection.checkboxesWithIcons && (
                      <div className="space-y-1">
                        {moduleConfig.additionalSection.checkboxesWithIcons.map((checkbox: any) => (
                          <CheckboxWithIconControl key={checkbox.label} label={checkbox.label} iconName={checkbox.icon} moduleColor={moduleConfig.color} />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Additional Section 2 (Module 6) - Collapsible */}
        {moduleConfig.additionalSection2 && (
          <div className="border-b border-[#334155]">
            <button
              onClick={() => setAdditional2Expanded(!additional2Expanded)}
              className="w-full bg-[#162032] px-4 py-2.5 hover:bg-[#1E293B] transition-all duration-200 text-left cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2 flex-1">
                  <div className="w-1 h-3.5 rounded-full mt-0.5 flex-shrink-0" style={{ background: `linear-gradient(to bottom, ${moduleConfig.color}, ${moduleConfig.color}CC)` }} />
                  <div className="flex-1">
                    <h3 className="text-xs font-semibold text-white">
                      {moduleConfig.additionalSection2.title}
                    </h3>
                  </div>
                </div>
                <div className="ml-2 flex-shrink-0">
                  {additional2Expanded ? (
                    <ChevronDown className="w-4 h-4 text-[#94A3B8] group-hover:text-white transition-colors" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-white transition-colors" />
                  )}
                </div>
              </div>
            </button>
            {additional2Expanded && (
              <div className="px-3 py-3 space-y-3 bg-[#0B1120]">
                {moduleConfig.additionalSection2.radioGroups && moduleConfig.additionalSection2.radioGroups.map((group: any) => (
                  <RadioGroupControl key={group.label} label={group.label} options={group.options} defaultValue={group.defaultValue} />
                ))}
                {moduleConfig.additionalSection2.checkboxes && (
                  <div className="space-y-1">
                    {moduleConfig.additionalSection2.checkboxes.map((checkbox: string) => (
                      <CheckboxControl key={checkbox} label={checkbox} />
                    ))}
                  </div>
                )}
                {moduleConfig.additionalSection2.useHierarchicalLayers && (
                  <HierarchicalLayerSelector 
                    layers={moduleConfig.additionalSection2.hierarchicalLayers}
                    moduleColor={moduleConfig.color}
                    defaultExpanded={true}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* Additional Section 3 - Collapsible */}
        {moduleConfig.additionalSection3 && (
          <div className="border-b border-[#334155]">
            <button
              onClick={() => setAdditional3Expanded(!additional3Expanded)}
              className="w-full bg-[#162032] px-4 py-2.5 hover:bg-[#1E293B] transition-all duration-200 text-left cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2 flex-1">
                  <div className="w-1 h-3.5 rounded-full mt-0.5 flex-shrink-0" style={{ background: `linear-gradient(to bottom, ${moduleConfig.color}, ${moduleConfig.color}CC)` }} />
                  <div className="flex-1">
                    <h3 className="text-xs font-semibold text-white">
                      {moduleConfig.additionalSection3.title}
                    </h3>
                  </div>
                </div>
                <div className="ml-2 flex-shrink-0">
                  {additional3Expanded ? (
                    <ChevronDown className="w-4 h-4 text-[#94A3B8] group-hover:text-white transition-colors" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-white transition-colors" />
                  )}
                </div>
              </div>
            </button>
            {additional3Expanded && (
              <div className="px-3 py-3 space-y-3 bg-[#0B1120]">
                {moduleConfig.additionalSection3.useHierarchicalLayers && (
                  <HierarchicalLayerSelector 
                    layers={moduleConfig.additionalSection3.hierarchicalLayers}
                    moduleColor={moduleConfig.color}
                    defaultExpanded={true}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Output Layer Selector Component - LeftDrawer Style with Icons
function OutputLayerSelector({ layers, defaultLayer, radioGroupName, moduleColor }: { layers: string[], defaultLayer: string, radioGroupName?: string, moduleColor: string }) {
  const [selected, setSelected] = useState(defaultLayer);

  // Determine gradient colors based on moduleColor
  const getGradientColors = () => {
    if (moduleColor === '#06B6D4') {
      // Cyan for Module 3
      return {
        from: '#0891B2',
        to: '#0E7490',
        iconColor: '#0891B2'
      };
    } else if (moduleColor === '#10B981') {
      // Green for Module 4
      return {
        from: '#059669',
        to: '#047857',
        iconColor: '#10B981'
      };
    } else if (moduleColor === '#F59E0B') {
      // Amber for Module 5
      return {
        from: '#D97706',
        to: '#B45309',
        iconColor: '#F59E0B'
      };
    } else if (moduleColor === '#EF4444') {
      // Red for Module 6
      return {
        from: '#DC2626',
        to: '#B91C1C',
        iconColor: '#EF4444'
      };
    } else if (moduleColor === '#8B5CF6') {
      // Purple for Module 2
      return {
        from: '#7C3AED',
        to: '#6D28D9',
        iconColor: '#8B5CF6'
      };
    }
    // Default blue
    return {
      from: '#2563EB',
      to: '#1E40AF',
      iconColor: '#2563EB'
    };
  };

  const colors = getGradientColors();

  return (
    <div className="space-y-1">
      {layers.map((layer) => {
        const isActive = selected === layer;
        const LayerIcon = getLayerIcon(layer);
        
        return (
          <button
            key={layer}
            onClick={() => setSelected(layer)}
            className={`w-full text-left px-2.5 py-2 rounded-md transition-all duration-200 ${
              isActive
                ? 'text-white shadow-sm'
                : 'hover:bg-[#1E293B] text-[#CBD5E1]'
            }`}
            style={{
              background: isActive ? `linear-gradient(to right, ${colors.from}, ${colors.to})` : undefined,
              boxShadow: isActive ? `0 1px 2px 0 ${colors.from}33` : undefined
            }}
          >
            <div className="flex items-start gap-2">
              <LayerIcon 
                className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${isActive ? 'text-white' : ''}`}
                style={{ color: isActive ? undefined : colors.iconColor }}
              />
              <div className="flex-1">
                <div className={`text-[11px] font-medium ${isActive ? 'text-white' : 'text-[#CBD5E1]'}`}>
                  {layer}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// Multi-Select Output Layer Selector Component - LeftDrawer Style with Icons (Improved Toggle Pattern)
function MultiSelectLayerSelector({ layers, defaultLayers, moduleColor }: { layers: string[], defaultLayers: string[], moduleColor: string }) {
  const [selected, setSelected] = useState(defaultLayers);

  const handleToggle = (layer: string) => {
    if (selected.includes(layer)) {
      setSelected(selected.filter((l) => l !== layer));
    } else {
      setSelected([...selected, layer]);
    }
  };

  // Determine gradient colors based on moduleColor
  const getGradientColors = () => {
    if (moduleColor === '#06B6D4') {
      // Cyan for Module 3
      return {
        from: '#0891B2',
        to: '#0E7490',
        iconColor: '#0891B2'
      };
    } else if (moduleColor === '#10B981') {
      // Green for Module 4
      return {
        from: '#059669',
        to: '#047857',
        iconColor: '#10B981'
      };
    } else if (moduleColor === '#F59E0B') {
      // Amber for Module 5
      return {
        from: '#D97706',
        to: '#B45309',
        iconColor: '#F59E0B'
      };
    } else if (moduleColor === '#EF4444') {
      // Red for Module 6
      return {
        from: '#DC2626',
        to: '#B91C1C',
        iconColor: '#EF4444'
      };
    } else if (moduleColor === '#8B5CF6') {
      // Purple for Module 2
      return {
        from: '#7C3AED',
        to: '#6D28D9',
        iconColor: '#8B5CF6'
      };
    }
    // Default blue
    return {
      from: '#2563EB',
      to: '#1E40AF',
      iconColor: '#2563EB'
    };
  };

  const colors = getGradientColors();

  return (
    <div className="space-y-1">
      {layers.map((layer) => {
        const isActive = selected.includes(layer);
        const LayerIcon = getLayerIcon(layer);
        
        return (
          <button
            key={layer}
            onClick={() => handleToggle(layer)}
            className={`w-full text-left px-2.5 py-2 rounded-md transition-all duration-200 ${
              isActive
                ? 'text-white shadow-sm'
                : 'hover:bg-[#1E293B] text-[#CBD5E1]'
            }`}
            style={{
              background: isActive ? `linear-gradient(to right, ${colors.from}, ${colors.to})` : undefined,
              boxShadow: isActive ? `0 1px 2px 0 ${colors.from}33` : undefined
            }}
          >
            <div className="flex items-start gap-2">
              <LayerIcon 
                className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${isActive ? 'text-white' : ''}`}
                style={{ color: isActive ? undefined : colors.iconColor }}
              />
              <div className="flex-1 min-w-0">
                <div className={`text-[11px] font-medium ${isActive ? 'text-white' : 'text-[#CBD5E1]'}`}>
                  {layer}
                </div>
              </div>
              {isActive && (
                <div className="flex-shrink-0 ml-1">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// Location Input Interactive Component - Upload, Lat/Long, and Pin on Map
function LocationInputInteractive({ moduleColor }: { moduleColor: string }) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [latLong, setLatLong] = useState({ lat: '', long: '' });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const gradientColors = moduleColor === '#EF4444' 
    ? { from: '#DC2626', to: '#B91C1C', light: '#FEE2E2' }
    : { from: '#2563EB', to: '#1E40AF', light: '#DBEAFE' };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setShowUploadModal(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Upload Data Button - Compact */}
      <button
        onClick={() => setShowUploadModal(true)}
        className="w-full group relative overflow-hidden rounded-md border transition-all duration-200 hover:shadow-sm"
        style={{ 
          borderColor: `${moduleColor}40`,
          backgroundColor: '#162032'
        }}
      >
        <div 
          className="absolute left-0 top-0 bottom-0 w-0.5 transition-all duration-200 group-hover:w-1"
          style={{ 
            background: `linear-gradient(to bottom, ${gradientColors.from}, ${gradientColors.to})`
          }}
        />
        
        <div className="flex items-center gap-2 px-2.5 py-2 pl-3">
          <div 
            className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center"
            style={{ backgroundColor: `${moduleColor}20` }}
          >
            <Upload className="w-3.5 h-3.5" style={{ color: moduleColor }} />
          </div>
          
          <div className="flex-1 text-left min-w-0">
            <div className="text-[10px] font-semibold text-white">Upload Location Data</div>
            <div className="text-[9px] text-[#94A3B8] truncate">
              {uploadedFile ? (
                <span className="font-medium" style={{ color: moduleColor }}>{uploadedFile.name}</span>
              ) : (
                'KML, SHP, Photo'
              )}
            </div>
          </div>
          
          <ChevronRight className="w-3.5 h-3.5 text-[#CBD5E1] group-hover:text-[#94A3B8] transition-colors flex-shrink-0" />
        </div>
      </button>

      {/* Coordinates Input - Compact */}
      <div 
        className="rounded-md border overflow-hidden"
        style={{ 
          borderColor: `${moduleColor}40`,
          backgroundColor: '#162032'
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center gap-2 px-2.5 py-1.5 border-b"
          style={{ 
            backgroundColor: `${moduleColor}15`,
            borderColor: `${moduleColor}30`
          }}
        >
          <div 
            className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center"
            style={{ backgroundColor: `${moduleColor}25` }}
          >
            <Navigation className="w-3 h-3" style={{ color: moduleColor }} />
          </div>
          <div className="text-[10px] font-semibold text-white">Enter Coordinates</div>
        </div>
        
        {/* Input Fields */}
        <div className="p-2 space-y-1.5">
          <div>
            <label className="block text-[8px] font-medium text-[#94A3B8] mb-0.5">Latitude</label>
            <input
              type="text"
              placeholder="e.g., 9.6475"
              value={latLong.lat}
              onChange={(e) => setLatLong({ ...latLong, lat: e.target.value })}
              className="w-full px-2 py-1.5 text-[10px] border border-[#334155] rounded transition-all duration-200 focus:outline-none focus:ring-1 focus:border-transparent bg-[#0B1120] text-white placeholder-[#475569]"
              style={{ 
                '--tw-ring-color': `${moduleColor}40`
              } as React.CSSProperties}
            />
          </div>
          <div>
            <label className="block text-[8px] font-medium text-[#94A3B8] mb-0.5">Longitude</label>
            <input
              type="text"
              placeholder="e.g., 123.8534"
              value={latLong.long}
              onChange={(e) => setLatLong({ ...latLong, long: e.target.value })}
              className="w-full px-2 py-1.5 text-[10px] border border-[#334155] rounded transition-all duration-200 focus:outline-none focus:ring-1 focus:border-transparent bg-[#0B1120] text-white placeholder-[#475569]"
              style={{ 
                '--tw-ring-color': `${moduleColor}40`
              } as React.CSSProperties}
            />
          </div>
          
          {/* Quick Action Button */}
          {(latLong.lat || latLong.long) && (
            <button
              className="w-full mt-1 px-2 py-1.5 rounded text-white text-[9px] font-semibold transition-all duration-200 hover:shadow-sm flex items-center justify-center gap-1"
              style={{
                background: `linear-gradient(to right, ${gradientColors.from}, ${gradientColors.to})`
              }}
            >
              <Navigation className="w-2.5 h-2.5" />
              Locate on Map
            </button>
          )}
        </div>
      </div>

      {/* Upload Modal - Enhanced */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10000] animate-fadeIn" onClick={() => setShowUploadModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 animate-slideUp" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div 
              className="px-6 py-4 border-b flex items-center justify-between"
              style={{ 
                background: `linear-gradient(to right, ${moduleColor}08, ${moduleColor}05)`,
                borderColor: `${moduleColor}20`
              }}
            >
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${moduleColor}15` }}
                >
                  <Upload className="w-4 h-4" style={{ color: moduleColor }} />
                </div>
                <h3 className="text-sm font-bold text-[#0F172A]">Upload Location Data</h3>
              </div>
              <button 
                onClick={() => setShowUploadModal(false)} 
                className="text-[#94A3B8] hover:text-[#0F172A] transition-colors rounded-lg p-1 hover:bg-[#F1F5F9]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Drag & Drop Zone */}
              <div 
                className="border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 hover:border-opacity-60"
                style={{ 
                  borderColor: `${moduleColor}30`,
                  backgroundColor: `${moduleColor}05`
                }}
              >
                <div 
                  className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${moduleColor}15` }}
                >
                  <Upload className="w-7 h-7" style={{ color: moduleColor }} />
                </div>
                <div className="text-xs text-[#475569] mb-1 font-medium">
                  Drag and drop your file here
                </div>
                <div className="text-[10px] text-[#94A3B8] mb-4">
                  or click the button below
                </div>
                <input
                  type="file"
                  accept=".kml,.zip,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-xs font-semibold cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105"
                  style={{
                    background: `linear-gradient(to right, ${gradientColors.from}, ${gradientColors.to})`
                  }}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Select File
                </label>
              </div>
              
              {/* File Info */}
              <div className="bg-[#F8FAFC] rounded-lg p-4 border border-[#E2E8F0]">
                <div className="text-[10px] font-semibold text-[#475569] mb-2 flex items-center gap-1.5">
                  <div className="w-1 h-4 rounded-full" style={{ backgroundColor: moduleColor }} />
                  Supported Formats
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  <div className="flex items-center gap-2 text-[10px] text-[#64748B]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#CBD5E1]"></div>
                    KML files (.kml)
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-[#64748B]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#CBD5E1]"></div>
                    Shapefile (compressed as .zip)
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-[#64748B]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#CBD5E1]"></div>
                    Geotagged photos (.jpg, .jpeg, .png)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Hierarchical Layer Selector Component - Parent/Child expandable structure with icons
function HierarchicalLayerSelector({ layers, moduleColor, defaultExpanded = true }: { layers: any[], moduleColor: string, defaultExpanded?: boolean }) {
  // Initialize all parent layers as expanded or collapsed based on defaultExpanded prop
  const [expandedParents, setExpandedParents] = useState<string[]>(defaultExpanded ? layers.map(layer => layer.name) : []);
  const [expandedSublayers, setExpandedSublayers] = useState<string[]>([]); // For 3rd level
  const [selectedLayer, setSelectedLayer] = useState<string>('');

  const toggleParent = (parentName: string) => {
    if (expandedParents.includes(parentName)) {
      setExpandedParents(expandedParents.filter(p => p !== parentName));
    } else {
      setExpandedParents([...expandedParents, parentName]);
    }
  };

  const toggleSublayer = (sublayerName: string) => {
    if (expandedSublayers.includes(sublayerName)) {
      setExpandedSublayers(expandedSublayers.filter(s => s !== sublayerName));
    } else {
      setExpandedSublayers([...expandedSublayers, sublayerName]);
    }
  };

  const selectSublayer = (sublayerName: string) => {
    setSelectedLayer(sublayerName);
  };

  const selectStandalone = (layerName: string) => {
    setSelectedLayer(layerName);
  };

  // Map icon names to icon components
  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, any> = {
      'Home': Home,
      'Users': Users,
      'Truck': Truck,
      'PlusCircle': PlusCircle,
      'Container': Container,
      'Droplets': Droplets,
      'RefreshCw': RefreshCw,
      'Building2': Building2,
      'PlusSquare': PlusSquare,
      'Factory': Factory,
      'Network': Network,
      'Waves': Waves,
      'Recycle': Recycle,
      'MapPin': MapPin,
      'Layers': Layers,
      'Upload': Upload,
      'Navigation': Navigation,
      'MousePointer': MousePointer,
      'AlertTriangle': AlertTriangle,
      'ArrowDown': ArrowDown,
      'CheckCircle': CheckCircle,
      'Database': Database,
      'Package': Package,
      'Box': Box
    };
    return iconMap[iconName] || Layers;
  };

  // Get icon for parent layers
  const getParentIcon = (layer: any) => {
    if (layer.icon) return getIconComponent(layer.icon);
    if (layer.name === 'FSTP') return Factory;
    if (layer.name === 'Solid Free Sewer') return Network;
    if (layer.name === 'Dry Weather Interceptor Flow') return Waves;
    if (layer.name.includes('Solid Free Sewer Catchment')) return Network;
    return Layers;
  };

  // Get icon for sublayers
  const getSublayerIcon = (sublayer: any, parentName: string) => {
    // Check if sublayer is an object with an icon property
    if (typeof sublayer === 'object' && sublayer.icon) return getIconComponent(sublayer.icon);
    
    // Fallback to parent-based icons
    if (parentName === 'FSTP') return Recycle;
    if (parentName === 'Solid Free Sewer') return Factory;
    if (parentName === 'Dry Weather Interceptor Flow') return Droplets;
    if (parentName.includes('Solid Free Sewer Catchment')) {
      const sublayerName = typeof sublayer === 'string' ? sublayer : sublayer.name;
      if (sublayerName === 'Network') return Network;
      if (sublayerName === 'Treatment Unit') return Factory;
    }
    return MapPin;
  };

  // Get icon for standalone items
  const getStandaloneIcon = (layer: any) => {
    if (typeof layer === 'object' && layer.icon) return getIconComponent(layer.icon);
    const layerName = typeof layer === 'string' ? layer : layer.name;
    if (layerName.includes('FSTP')) return Recycle;
    if (layerName.includes('Network')) return Network;
    if (layerName.includes('Treatment')) return Factory;
    return Layers;
  };

  // Dynamic gradient colors based on moduleColor
  const getGradientColors = () => {
    if (moduleColor === '#10B981') {
      // Green for Module 4
      return {
        from: '#059669',
        to: '#047857',
        iconColor: '#10B981'
      };
    } else if (moduleColor === '#F59E0B') {
      // Orange/Amber for Module 5
      return {
        from: '#D97706',
        to: '#B45309',
        iconColor: '#F59E0B'
      };
    } else if (moduleColor === '#EF4444') {
      // Red for Module 6
      return {
        from: '#DC2626',
        to: '#B91C1C',
        iconColor: '#EF4444'
      };
    }
    // Default (blue)
    return {
      from: '#2563EB',
      to: '#1E40AF',
      iconColor: '#2563EB'
    };
  };

  const colors = getGradientColors();
  const gradientFrom = colors.from;
  const gradientTo = colors.to;
  const iconColor = colors.iconColor;

  return (
    <div className="space-y-1.5">
      {layers.map((layer) => {
        // Check if this is a standalone item (no sublayers) or a parent with sublayers
        // Interactive layers should be treated as parents even if they have empty sublayers
        const isStandalone = !layer.interactive && (!layer.sublayers || layer.sublayers.length === 0);
        
        if (isStandalone) {
          // Render as standalone item
          const isActive = selectedLayer === layer.name;
          const StandaloneIcon = getStandaloneIcon(layer);
          
          return (
            <button
              key={layer.name}
              onClick={() => selectStandalone(layer.name)}
              className={`w-full text-left px-2.5 py-2 rounded-md transition-all duration-200 ${
                isActive
                  ? 'text-white shadow-sm'
                  : 'hover:bg-[#1E293B] text-[#CBD5E1]'
              }`}
              style={{
                background: isActive ? `linear-gradient(to right, ${gradientFrom}, ${gradientTo})` : undefined,
                boxShadow: isActive ? `0 1px 2px 0 ${gradientFrom}33` : undefined
              }}
            >
              <div className="flex items-start gap-2">
                <StandaloneIcon 
                  className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${isActive ? 'text-white' : ''}`}
                  style={{ color: isActive ? undefined : iconColor }}
                />
                <div className="flex-1">
                  <div className={`text-[11px] font-medium ${isActive ? 'text-white' : 'text-[#CBD5E1]'}`}>
                    {layer.name}
                  </div>
                </div>
                {isActive && (
                  <div className="w-1.5 h-1.5 bg-white rounded-full flex-shrink-0 mt-1" />
                )}
              </div>
            </button>
          );
        }
        
        // Render as parent with sublayers
        const isExpanded = expandedParents.includes(layer.name);
        const ParentIcon = getParentIcon(layer);
        
        return (
          <div key={layer.name} className="space-y-1">
            {/* Parent Layer */}
            <button
              onClick={() => toggleParent(layer.name)}
              className="w-full text-left px-2.5 py-2 rounded-md transition-all duration-200 bg-[#162032] hover:bg-[#1E293B] border border-[#334155]"
            >
              <div className="flex items-center gap-2">
                {/* Expand/Collapse Icon */}
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-[#64748B] flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-[#64748B] flex-shrink-0" />
                )}
                
                {/* Parent Icon */}
                <ParentIcon 
                  className="w-3.5 h-3.5 flex-shrink-0"
                  style={{ color: iconColor }}
                />
                
                {/* Parent Name */}
                <div className="flex-1">
                  <div className="text-[11px] font-semibold text-white">
                    {layer.name}
                  </div>
                </div>
              </div>
            </button>

            {/* Sublayers or Interactive Content */}
            {isExpanded && (
              <div className="ml-4 space-y-1">
                {layer.interactive && layer.name === 'Location Input' ? (
                  <LocationInputInteractive moduleColor={moduleColor} />
                ) : layer.sublayers && layer.sublayers.length > 0 ? (
                  layer.sublayers.map((sublayer: any) => {
                  const sublayerName = typeof sublayer === 'string' ? sublayer : sublayer.name;
                  const hasNestedSublayers = typeof sublayer === 'object' && sublayer.sublayers && sublayer.sublayers.length > 0;
                  
                  if (hasNestedSublayers) {
                    // Render as expandable 2nd level parent
                    const isSubExpanded = expandedSublayers.includes(sublayerName);
                    const SublayerIcon = getSublayerIcon(sublayer, layer.name);
                    
                    return (
                      <div key={sublayerName} className="space-y-1">
                        <button
                          onClick={() => toggleSublayer(sublayerName)}
                          className="w-full text-left px-2.5 py-1.5 rounded-md transition-all duration-200 bg-[#162032] hover:bg-[#1E293B] border border-[#334155]"
                        >
                          <div className="flex items-center gap-2">
                            {isSubExpanded ? (
                              <ChevronDown className="w-3 h-3 text-[#64748B] flex-shrink-0" />
                            ) : (
                              <ChevronRight className="w-3 h-3 text-[#64748B] flex-shrink-0" />
                            )}
                            <SublayerIcon 
                              className="w-3 h-3 flex-shrink-0"
                              style={{ color: iconColor }}
                            />
                            <div className="flex-1">
                              <div className="text-[11px] font-medium text-white">
                                {sublayerName}
                              </div>
                            </div>
                          </div>
                        </button>
                        
                        {/* 3rd level sublayers */}
                        {isSubExpanded && (
                          <div className="ml-4 space-y-1">
                            {sublayer.sublayers.map((nestedSublayer: any) => {
                              const nestedName = typeof nestedSublayer === 'string' ? nestedSublayer : nestedSublayer.name;
                              const isActive = selectedLayer === nestedName;
                              const NestedIcon = typeof nestedSublayer === 'object' && nestedSublayer.icon 
                                ? getIconComponent(nestedSublayer.icon) 
                                : MapPin;
                              
                              return (
                                <button
                                  key={nestedName}
                                  onClick={() => selectSublayer(nestedName)}
                                  className={`w-full text-left px-2.5 py-1.5 rounded-md transition-all duration-200 ${
                                    isActive ? 'text-white shadow-sm' : 'hover:bg-[#1E293B] text-[#CBD5E1]'
                                  }`}
                                  style={{
                                    background: isActive ? `linear-gradient(to right, ${gradientFrom}, ${gradientTo})` : undefined,
                                    boxShadow: isActive ? `0 1px 2px 0 ${gradientFrom}33` : undefined
                                  }}
                                >
                                  <div className="flex items-start gap-2">
                                    <NestedIcon 
                                      className={`w-3 h-3 mt-0.5 flex-shrink-0 ${isActive ? 'text-white' : ''}`}
                                      style={{ color: isActive ? undefined : iconColor }}
                                    />
                                    <div className="flex-1">
                                      <div className={`text-[10px] font-medium ${isActive ? 'text-white' : 'text-[#CBD5E1]'}`}>
                                        {nestedName}
                                      </div>
                                    </div>
                                    {isActive && (
                                      <div className="w-1.5 h-1.5 bg-white rounded-full flex-shrink-0 mt-0.5" />
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }
                  
                  // Render as simple 2nd level sublayer
                  const isActive = selectedLayer === sublayerName;
                  const SublayerIcon = getSublayerIcon(sublayer, layer.name);
                  
                  return (
                    <button
                      key={sublayerName}
                      onClick={() => selectSublayer(sublayerName)}
                      className={`w-full text-left px-2.5 py-2 rounded-md transition-all duration-200 ${
                        isActive ? 'text-white shadow-sm' : 'hover:bg-[#1E293B] text-[#CBD5E1]'
                      }`}
                      style={{
                        background: isActive ? `linear-gradient(to right, ${gradientFrom}, ${gradientTo})` : undefined,
                        boxShadow: isActive ? `0 1px 2px 0 ${gradientFrom}33` : undefined
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <SublayerIcon 
                          className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${isActive ? 'text-white' : ''}`}
                          style={{ color: isActive ? undefined : iconColor }}
                        />
                        <div className="flex-1">
                          <div className={`text-[11px] font-medium ${isActive ? 'text-white' : 'text-[#CBD5E1]'}`}>
                            {sublayerName}
                          </div>
                        </div>
                        {isActive && (
                          <div className="w-1.5 h-1.5 bg-white rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>
                    </button>
                  );
                })) : null}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Module 1 Scenario Creator — Wired to GeoServer WFS + Backend Stats API
// ────────────────────────────────────────────────────────────────────────────
const DENSITY_STOPS = [
  { label: 'Low Density',       subLabel: 'Sparse Built-up Area (GSI 0–0.15) — On-Site Preferred',                     denTypes: ['Low Density', 'Medium Density', 'High Density', 'Very High Density'] },
  { label: 'Medium Density',    subLabel: 'Mixed Built-up Area (GSI 0.15–0.30) — Decentralised Clusters Work',         denTypes: ['Medium Density', 'High Density', 'Very High Density'] },
  { label: 'High Density',      subLabel: 'Compact Built-up Area (GSI 0.30–0.45) — Sewer Network Viable',              denTypes: ['High Density', 'Very High Density'] },
  { label: 'Very High Density', subLabel: 'Very Compact Built-up Area (GSI > 0.45) — Centralised Sewer Preferred',     denTypes: ['Very High Density'] },
];
const GWD_STOPS = [
  { label: 'Deep (> 10 m)',        subLabel: 'Deep Groundwater (> 10 m) — Safe for Soak / Leach Systems',               score: 1 },
  { label: 'Moderate (5–10 m)',    subLabel: 'Moderate Groundwater (5–10 m) — On-Site OK with Sealed Septic',           score: 2 },
  { label: 'Shallow (2–5 m)',      subLabel: 'Shallow Groundwater (2–5 m) — Contamination Risk, prefer Network',        score: 3 },
  { label: 'Very Shallow (< 2 m)', subLabel: 'Very Shallow Groundwater (< 2 m) — Sewer Network Strongly Favoured',      score: 4 },
];
const GWI_STOPS = [
  { label: 'Low Vulnerability',       subLabel: 'Non-Karst Ground — Aquifer Protected, On-Site Fine',                   score: 1 },
  { label: 'Moderate Vulnerability',  subLabel: 'Karst Formation — use Sealed Septic, limit Soak Pits',                 score: 2 },
  { label: 'High Vulnerability',      subLabel: 'Karst with Sinkholes — Contamination Risk, Network Preferred',         score: 3 },
  { label: 'Very High Vulnerability', subLabel: 'Highly Permeable Ground — Sealed Systems or Sewer Network Only',       score: 4 },
];
const FLD_STOPS = [
  { label: 'No Flood',  subLabel: 'No Flood Hazard — All Systems Viable',                          score: 1 },
  { label: 'Low',       subLabel: 'Low Flood Hazard — Most Systems OK, elevate Tank Vents',        score: 2 },
  { label: 'Moderate',  subLabel: 'Moderate Flood Hazard — Seal / Raise On-Site, Network Better',  score: 3 },
  { label: 'High',      subLabel: 'High Flood Hazard — Sealed Tanks or Sewer Network Required',    score: 4 },
];

const GRID_WFS_BASE =
  'https://geoserver.azure.innpact.ai/geoserver/WorldBank_Bohol/ows' +
  '?service=WFS&version=1.0.0&request=GetFeature&typeName=WorldBank_Bohol:Grid' +
  '&outputFormat=application/json&srsName=EPSG:4326&maxFeatures=50000';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? '';

function SteppedSlider({
  label,
  stops,
  defaultIndex: _defaultIndex,
  value,
  onChange,
  color,
}: {
  label: string;
  stops: Array<{ label: string; subLabel: string }>;
  defaultIndex: number;
  value: number;
  onChange: (i: number) => void;
  color: string;
}) {
  return (
    <div className="bg-[#162032] border border-[#334155] rounded-md p-2.5 hover:border-[#475569] transition-colors">
      {/* Header row: icon · label · current-value pill */}
      <div className="flex items-center gap-2 mb-2">
        <Sliders className="w-3.5 h-3.5 text-[#94A3B8] flex-shrink-0" />
        <span className="text-[10px] font-semibold text-[#94A3B8] flex-1 truncate">{label}</span>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap"
          style={{ color, borderColor: `${color}50`, backgroundColor: `${color}15` }}
        >
          {stops[value].label}
        </span>
      </div>

      {/* Modern segmented control — 4 equal pill buttons */}
      <div
        role="radiogroup"
        aria-label={label}
        className="grid grid-cols-4 gap-1"
      >
        {stops.map((s, i) => {
          const active = i === value;
          const filled = i <= value;
          return (
            <button
              key={i}
              role="radio"
              aria-checked={active}
              onClick={() => onChange(i)}
              title={`${s.label} — ${s.subLabel}`}
              className="relative flex flex-col items-center justify-center rounded-md py-1.5 px-1 transition-all focus:outline-none focus:ring-1 focus:ring-offset-0"
              style={{
                background: active ? `${color}22` : filled ? `${color}0F` : '#0F172A',
                border: `1px solid ${active ? color : filled ? `${color}40` : '#334155'}`,
                boxShadow: active ? `0 0 0 1px ${color}60` : 'none',
              }}
            >
              <span
                className="text-[11px] font-bold leading-none"
                style={{ color: active ? color : filled ? `${color}CC` : '#64748B' }}
              >
                {i + 1}
              </span>
              <span
                className="w-full h-[3px] mt-1 rounded-full"
                style={{ background: filled ? color : '#334155', opacity: active ? 1 : filled ? 0.55 : 0.6 }}
              />
            </button>
          );
        })}
      </div>

      {/* Current stop — plain-language description */}
      <p className="text-[9.5px] leading-snug mt-2" style={{ color: `${color}CC` }}>
        {stops[value].subLabel}
      </p>
    </div>
  );
}

function Module1ScenarioCreator({
  moduleColor,
  onScenarioResult,
  onStatsChange,
  selectedLguName,
  selectedWardName,
  isBuildingsLoading = false,
  onScenarioRunningChange,
  onUserRun,
}: {
  moduleColor: string;
  onScenarioResult?: (geojson: any | null, networkGids?: number[], bufferBldgIds?: number[], bufferGeomJson?: any | null, excludedBldgIds?: number[]) => void;
  onStatsChange?: (stats: {
    grid_count: number; area_ha: number;
    network_bldgs: number; onsite_bldgs: number; nonnetwork_bldgs: number; total_bldgs: number;
    by_municipality: Array<{ mun: string; network: number; onsite: number; nonnetwork: number }>;
    density_stop?: number; gwd_stop?: number; gwi_stop?: number; fld_stop?: number;
    zones?: Array<{ cluster_id: number; mun: string; network_bldgs: number; grid_cells: number; area_ha: number; tourism_cells: number; centroid_lng: number; centroid_lat: number; bbox_minlng: number; bbox_minlat: number; bbox_maxlng: number; bbox_maxlat: number; brgy_names: string[]; use_type_pct: Array<{ name: string; pct: number }>; buffer_geom_geojson?: any; buffer_area_ha?: number | null; buffer_bldgs?: number }>;
  } | null) => void;
  selectedLguName?: string;
  selectedWardName?: string;
  isBuildingsLoading?: boolean;
  onScenarioRunningChange?: (running: boolean) => void;
  onUserRun?: () => void;
}) {
  const [densityIdx, setDensityIdx] = React.useState(2); // default: High Density (stop 3)
  const [gwdIdx,     setGwdIdx]     = React.useState(2); // default: Shallow (stop 3)
  const [gwiIdx,     setGwiIdx]     = React.useState(2); // default: High Vulnerability (stop 3)
  const [fldIdx,     setFldIdx]     = React.useState(2); // default: Moderate (stop 3)

  // Map overlay + stats state — only updated when button is clicked
  const [mapRunning, setMapRunning] = React.useState(false);
  const apiFetchDone = React.useRef(false); // true once the API fetch has completed
  const isUserRun = React.useRef(false);    // true when run was triggered by the button (not auto-load)
  const dismissTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mapError,   setMapError]   = React.useState<string | null>(null);

  // Keep mapRunning true until BOTH the API fetch is done AND MapCanvas finishes rendering buildings.
  // Use a 400ms debounce so transient false flashes (caused by effect cleanup in MapCanvas) don't
  // prematurely dismiss the loader before the next render cycle sets isBuildingsLoading back to true.
  React.useEffect(() => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
    if (apiFetchDone.current && !isBuildingsLoading) {
      dismissTimer.current = setTimeout(() => {
        if (apiFetchDone.current && !isBuildingsLoading) {
          apiFetchDone.current = false;
          setMapRunning(false);
        }
        dismissTimer.current = null;
      }, 400);
    }
  }, [isBuildingsLoading]);

  // Notify parent whenever running state changes (parent relays to MapCanvas for overlay)
  React.useEffect(() => {
    onScenarioRunningChange?.(mapRunning);
  }, [mapRunning]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cycling loader messages (kept for map canvas messaging only — panel widget removed)
  const SCENARIO_LOADING_MSGS = [
    'Initialising scenario parameters…',
    'Scanning built-up density grid cells…',
    'Applying groundwater depth thresholds…',
    'Checking ground infiltration risk scores…',
    'Evaluating flood hazard classifications…',
    'Identifying high tourism priority zones…',
    'Running gap-fill cluster analysis…',
    'Qualifying sewer network grid cells…',
    'Computing 120 m buffer corridor…',
    'Tagging bulk wastewater generators…',
    'Classifying buildings by sewer type…',
    'Compiling sewer coverage statistics…',
    'Rendering buildings on map…',
    'Applying sewer zone colours…',
    'Finalising map view…',
  ];
  const [loadingMsgIdx, setLoadingMsgIdx] = React.useState(0);
  React.useEffect(() => {
    if (!mapRunning) { setLoadingMsgIdx(0); return; }
    const iv = setInterval(() => {
      setLoadingMsgIdx((i) => (i + 1) % SCENARIO_LOADING_MSGS.length);
    }, 900);
    return () => clearInterval(iv);
  }, [mapRunning]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-load overlay on first mount with default slider values
  const didAutoLoad = React.useRef(false);

  // Build CQL filter for WFS request (map overlay only)
  const buildCqlFilter = () => {
    const denTypeList = DENSITY_STOPS[densityIdx].denTypes.map((d) => `'${d}'`).join(',');
    const gwdScore = GWD_STOPS[gwdIdx].score;
    const gwiScore = GWI_STOPS[gwiIdx].score;
    const fldScore = FLD_STOPS[fldIdx].score;
    const condA = `(den_type IN (${denTypeList}) AND (fld_score >= ${fldScore} OR gwd_score >= ${gwdScore} OR gwi_score >= ${gwiScore}))`;
    const condB = `(tour_zone = 'High Tourism Zone')`;
    return `${condA} OR ${condB}`;
  };

  // Recalculate button: fetches filtered grid geometry + stats from backend
  const handleRecalculate = async () => {
    setMapRunning(true);
    setMapError(null);
    onScenarioResult?.(null);
    // Intentionally DO NOT clear stats here — keep old values visible in the
    // right-side panel so they appear "frozen" during the run and animate
    // smoothly to the new values when the API response arrives.
    try {
      const d = densityIdx + 1;
      const g = gwdIdx     + 1;
      const w = gwiIdx     + 1;
      const f = fldIdx     + 1;

      // Build optional admin-boundary filter params
      const filterParams = new URLSearchParams();
      if (selectedWardName && selectedWardName !== 'all') {
        filterParams.set('brgyName', selectedWardName);
      } else if (selectedLguName && selectedLguName !== 'all') {
        filterParams.set('munName', selectedLguName);
      }
      const filterSuffix = filterParams.toString() ? `&${filterParams.toString()}` : '';

      // Fetch map overlay (cluster-filtered GeoJSON) + precomputed stats in parallel
      const [gridResp, statsResp] = await Promise.all([
        fetch(`${API_BASE}/api/scenario-grid?d=${d}&g=${g}&w=${w}&f=${f}${filterSuffix}`),
        fetch(`${API_BASE}/api/scenario-results?d=${d}&g=${g}&w=${w}&f=${f}`),
      ]);

      if (!gridResp.ok) throw new Error(`Scenario grid error: ${gridResp.status}`);
      const gridContentType = gridResp.headers.get('content-type') ?? '';
      if (!gridContentType.includes('application/json')) {
        throw new Error('Service is starting up — please wait a moment and try again.');
      }
      const geojson = await gridResp.json();

      // Extract qualifying GIDs for buildings-mode colouring
      const networkGids: number[] = (geojson.features ?? []).map((feat: any) => {
        const fromProps = feat.properties?.gid ?? feat.properties?.id;
        if (fromProps != null) return Number(fromProps);
        const m = String(feat.id ?? '').match(/\.(\d+)$/);
        return m ? Number(m[1]) : null;
      }).filter((g: number | null) => g !== null) as number[];

      // Extract buffer data and zone breakdown from the response
      const bufferBldgIds: number[] = geojson.bufferBldgIds ?? [];
      const bufferGeomJson: any | null = geojson.bufferGeomJson ?? null;
      const bufferAreaHa: number | null  = geojson.bufferAreaHa  ?? null;
      const zoneBreakdown = geojson.zoneBreakdown ?? null;
      const zones = geojson.zones ?? [];
      const excludedBldgIds: number[] = geojson.excludedBldgIds ?? [];

      onScenarioResult?.(geojson, networkGids, bufferBldgIds, bufferGeomJson, excludedBldgIds);
      if (isUserRun.current) {
        onUserRun?.();
        isUserRun.current = false;
      }

      const statsContentType = statsResp.headers.get('content-type') ?? '';
      if (statsResp.ok && statsContentType.includes('application/json')) {
        const statsData = await statsResp.json();
        // Attach buffer area so right panel KPI can show it
        statsData.buffer_area_ha = bufferAreaHa;
        // Attach live zone breakdown for Coverage Distribution donuts
        statsData.zone_breakdown = zoneBreakdown;
        // Attach per-cluster zone summaries (one per disconnected polygon group)
        statsData.zones = zones;
        // Attach slider stop values so right panel can show hazard drivers
        statsData.density_stop = d;
        statsData.gwd_stop     = g;
        statsData.gwi_stop     = w;
        statsData.fld_stop     = f;
        // Filter by_municipality client-side when an LGU filter is active
        if (selectedLguName && selectedLguName !== 'all' && statsData?.by_municipality) {
          statsData.by_municipality = statsData.by_municipality.filter(
            (row: { mun: string }) => row.mun === selectedLguName
          );
          // Recalculate top-level KPIs from the filtered municipality data
          const filteredMuns: Array<{ mun: string; network: number; onsite: number; nonnetwork: number }> = statsData.by_municipality;
          statsData.network_bldgs    = filteredMuns.reduce((s: number, m: { network: number }) => s + m.network, 0);
          statsData.onsite_bldgs     = filteredMuns.reduce((s: number, m: { onsite: number }) => s + m.onsite, 0);
          statsData.nonnetwork_bldgs = filteredMuns.reduce((s: number, m: { nonnetwork: number }) => s + m.nonnetwork, 0);
          statsData.total_bldgs      = statsData.network_bldgs + statsData.onsite_bldgs + statsData.nonnetwork_bldgs;
          // Recalculate grid_count and buffer_area_ha from filtered zones
          if (Array.isArray(statsData.zones)) {
            statsData.zones = statsData.zones.filter(
              (z: { mun: string }) => z.mun === selectedLguName
            );
            statsData.grid_count = statsData.zones.reduce((s: number, z: { grid_cells: number }) => s + z.grid_cells, 0);
            statsData.buffer_area_ha = statsData.zones.reduce((s: number, z: { buffer_area_ha?: number | null }) => s + (z.buffer_area_ha ?? 0), 0);
            statsData.area_ha = statsData.zones.reduce((s: number, z: { area_ha: number }) => s + z.area_ha, 0);
            statsData.buffer_bldgs = statsData.zones.reduce((s: number, z: { buffer_bldgs?: number }) => s + (z.buffer_bldgs ?? 0), 0);
          }
        }
        onStatsChange?.(statsData);
      }
    } catch (err) {
      setMapError(err instanceof Error ? err.message : 'Unknown error');
      setMapRunning(false); // on error, stop immediately — no buildings to wait for
    } finally {
      // Signal that the API fetch is done; mapRunning will clear once buildings finish rendering
      apiFetchDone.current = true;
    }
  };

  // Auto-load map overlay once on mount with default slider values (d=3,g=3,w=3,f=3)
  React.useEffect(() => {
    if (didAutoLoad.current) return;
    didAutoLoad.current = true;
    isUserRun.current = true; // treat initial load as a zoom-triggering event
    handleRecalculate();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-run when LGU or barangay filter changes (only after initial load)
  React.useEffect(() => {
    if (!didAutoLoad.current) return;
    handleRecalculate();
  }, [selectedLguName, selectedWardName]); // eslint-disable-line react-hooks/exhaustive-deps

  const pct = (n: number, total: number) =>
    total > 0 ? `${Math.round((n / total) * 100)}%` : '0%';

  return (
    <div className="space-y-2.5">
      {/* Brief intro — tells users what this panel does in plain language */}
      <div className="text-[10px] leading-snug text-[#94A3B8] bg-[#0D1829] border border-[#1E3A5F] rounded-md px-2.5 py-2">
        Adjust the parameters below to identify new sewer network regions. Each slider sets the threshold above which an area qualifies.
      </div>

      {/* Slider 1 — Built-up Density */}
      <SteppedSlider
        label="Built-up Density"
        stops={DENSITY_STOPS}
        defaultIndex={2}
        value={densityIdx}
        onChange={setDensityIdx}
        color={moduleColor}
      />
      {/* Slider 2 — Groundwater Depth */}
      <SteppedSlider
        label="Groundwater Depth"
        stops={GWD_STOPS}
        defaultIndex={2}
        value={gwdIdx}
        onChange={setGwdIdx}
        color={moduleColor}
      />
      {/* Slider 3 — Ground Infiltration */}
      <SteppedSlider
        label="Ground Infiltration"
        stops={GWI_STOPS}
        defaultIndex={2}
        value={gwiIdx}
        onChange={setGwiIdx}
        color={moduleColor}
      />
      {/* Slider 4 — Flood Hazard */}
      <SteppedSlider
        label="Flood Hazard"
        stops={FLD_STOPS}
        defaultIndex={2}
        value={fldIdx}
        onChange={setFldIdx}
        color={moduleColor}
      />

      {/* Other Conditions */}
      <div className="bg-[#0D1829] border border-[#1E3A5F] rounded-md p-2.5 text-[9.5px] text-[#94A3B8] leading-relaxed">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#64B5F6] mb-1">
          <Info className="w-3 h-3 flex-shrink-0" />
          Other Rules
        </div>
        <ul className="pl-3 list-disc marker:text-[#475569] space-y-0.5">
          <li>Tourism zones auto-qualify</li>
          <li>Enclosed cells gap-filled</li>
          <li>Clusters: &gt; 5 cells across ≥ 2 rows &amp; columns</li>
        </ul>
      </div>

      <button
        onClick={() => { isUserRun.current = true; handleRecalculate(); }}
        disabled={mapRunning}
        className="w-full py-2 px-3 rounded-md text-[11px] font-semibold text-white transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed hover:brightness-110"
        style={{ backgroundColor: moduleColor }}
      >
        <RefreshCw className={`w-3.5 h-3.5 ${mapRunning ? 'animate-spin' : ''}`} />
        {mapRunning ? 'Running Scenario…' : 'Run Scenario'}
      </button>

      {mapError && (
        <div className="bg-red-900/30 border border-red-700/50 rounded-md px-2.5 py-2 text-[10px] text-red-300 space-y-1.5">
          <div>⚠ {mapError}</div>
          <button
            onClick={handleRecalculate}
            className="text-[10px] text-red-200 underline hover:text-white transition-colors"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}

// Scenario Creator Component
function ScenarioCreator({ config, moduleColor }: { config: any, moduleColor: string }) {
  return (
    <div className="space-y-2.5">
      {/* Priority List */}
      {config.priorityList && (
        <PriorityListControl priorities={config.priorityList} />
      )}

      {/* Sliders */}
      {config.sliders && config.sliders.map((slider: any) => (
        <SliderControl key={slider.label} label={slider.label} color={moduleColor} min={slider.min} max={slider.max} defaultValue={slider.defaultValue} unit={slider.unit} />
      ))}

      {/* Option Sliders (discrete options) */}
      {config.optionSliders && config.optionSliders.map((slider: any) => (
        <OptionSliderControl key={slider.label} label={slider.label} options={slider.options} defaultIndex={slider.defaultIndex} color={moduleColor} />
      ))}

      {/* Dropdowns */}
      {config.dropdowns && config.dropdowns.map((dropdown: any) => (
        <DropdownControl key={dropdown.label} label={dropdown.label} options={dropdown.options} />
      ))}

      {/* Radio Groups */}
      {config.radioGroups && config.radioGroups.map((group: any) => (
        <RadioGroupControl key={group.label} label={group.label} options={group.options} defaultValue={group.defaultValue} />
      ))}

      {/* Toggles */}
      {config.toggles && config.toggles.map((toggle: any) => (
        <ToggleControl key={toggle.label} label={toggle.label} />
      ))}

      {/* Checkboxes */}
      {config.checkboxes && config.checkboxes.map((checkbox: any) => (
        <CheckboxControl key={checkbox.label} label={checkbox.label} />
      ))}

      {/* Checkboxes with Icons (Module 3 Style) */}
      {config.checkboxesWithIcons && (
        <div className="space-y-1">
          {config.checkboxesWithIcons.map((checkbox: any) => (
            <CheckboxWithIconControl key={checkbox.label} label={checkbox.label} iconName={checkbox.icon} moduleColor={moduleColor} />
          ))}
        </div>
      )}

      {/* Action Button */}
      {config.buttonLabel && (
        <button
          className="w-full py-2 px-3 rounded-md text-[11px] font-semibold text-white transition-all hover:brightness-110 shadow-sm flex items-center justify-center gap-2"
          style={{ backgroundColor: moduleColor }}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {config.buttonLabel}
        </button>
      )}

      {/* Special Export Button for Module 6 */}
      {config.exportButton && (
        <button
          className="w-full py-2 px-3 rounded-md text-[11px] font-medium text-white bg-[#64748B] hover:bg-[#475569] transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          <Download className="w-3.5 h-3.5" />
          {config.exportButton}
        </button>
      )}
    </div>
  );
}

// Helper Components
function SliderControl({ label, color, min, max, defaultValue, unit }: { label: string, color: string, min?: number, max?: number, defaultValue?: number, unit?: string }) {
  const minVal = min ?? 0;
  const maxVal = max ?? 100;
  const defaultVal = defaultValue ?? 50;
  const unitStr = unit ?? '%';
  
  const [value, setValue] = useState(defaultVal);
  
  // Calculate percentage for gradient background
  const percentage = ((value - minVal) / (maxVal - minVal)) * 100;
  
  return (
    <div className="bg-[#162032] border border-[#334155] rounded-md p-2">
      <div className="flex items-center gap-2 mb-2">
        <Sliders className="w-3.5 h-3.5 text-[#94A3B8] flex-shrink-0" />
        <label className="text-[10px] font-medium text-[#94A3B8] flex-1">{label}</label>
        <span className="text-[11px] font-semibold text-white px-2 py-0.5 bg-[#0B1120] border border-[#334155] rounded">{value}{unitStr}</span>
      </div>
      <input
        type="range"
        min={minVal}
        max={maxVal}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${color} 0%, ${color} ${percentage}%, #334155 ${percentage}%, #334155 100%)`
        }}
      />
    </div>
  );
}

function OptionSliderControl({ label, options, defaultIndex, color }: { label: string, options: string[], defaultIndex?: number, color: string }) {
  const defaultIdx = defaultIndex ?? 0;
  
  const [selectedIndex, setSelectedIndex] = useState(defaultIdx);
  
  return (
    <div className="bg-[#162032] border border-[#334155] rounded-md p-2">
      <div className="flex items-center gap-2 mb-2">
        <Sliders className="w-3.5 h-3.5 text-[#94A3B8] flex-shrink-0" />
        <label className="text-[10px] font-medium text-[#94A3B8] flex-1">{label}</label>
        <span className="text-[10px] font-semibold text-white px-2 py-0.5 bg-[#0B1120] border border-[#334155] rounded">{options[selectedIndex]}</span>
      </div>
      <input
        type="range"
        min={0}
        max={options.length - 1}
        value={selectedIndex}
        onChange={(e) => setSelectedIndex(Number(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${color} 0%, ${color} 100%)`
        }}
      />
    </div>
  );
}

function DropdownControl({ label, options }: { label: string, options: string[] }) {
  const [selected, setSelected] = useState(options[0]);
  
  return (
    <div className="bg-[#162032] border border-[#334155] rounded-md p-2">
      <div className="flex items-center gap-2 mb-1.5">
        <List className="w-3.5 h-3.5 text-[#94A3B8] flex-shrink-0" />
        <label className="text-[10px] font-medium text-[#94A3B8] flex-1">{label}</label>
      </div>
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="w-full px-2.5 py-1.5 bg-[#0B1120] border border-[#334155] rounded text-[11px] text-white focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
      >
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

function RadioGroupControl({ label, options, defaultValue, moduleColor }: { label: string, options: string[], defaultValue?: string, moduleColor?: string }) {
  const [selected, setSelected] = useState(defaultValue || options[0]);
  
  // Dynamic gradient colors based on moduleColor
  const getGradientColors = () => {
    if (moduleColor === '#06B6D4') {
      // Cyan for Module 3
      return { from: '#0891B2', to: '#0E7490' };
    } else if (moduleColor === '#10B981') {
      // Green for Module 4
      return { from: '#059669', to: '#047857' };
    } else if (moduleColor === '#F59E0B') {
      // Amber for Module 5
      return { from: '#D97706', to: '#B45309' };
    } else if (moduleColor === '#EF4444') {
      // Red for Module 6
      return { from: '#DC2626', to: '#B91C1C' };
    } else if (moduleColor === '#8B5CF6') {
      // Purple for Module 2
      return { from: '#7C3AED', to: '#6D28D9' };
    }
    // Default (blue)
    return { from: '#2563EB', to: '#1E40AF' };
  };
  
  const colors = getGradientColors();
  const activeColorFrom = colors.from;
  const activeColorTo = colors.to;
  const inactiveIconColor = moduleColor || '#2563EB';
  
  return (
    <div className="bg-[#162032] border border-[#334155] rounded-md p-2">
      <div className="flex items-center gap-2 mb-1.5">
        <CheckSquare className="w-3.5 h-3.5 text-[#94A3B8] flex-shrink-0" />
        <div className="text-[10px] font-medium text-[#94A3B8] flex-1">{label}</div>
      </div>
      <div className="space-y-1">
        {options.map((option) => {
          const isActive = selected === option;
          return (
            <button
              key={option}
              onClick={() => setSelected(option)}
              className={`w-full text-left px-2.5 py-2 rounded-md transition-all duration-200 ${
                isActive
                  ? 'text-white shadow-sm'
                  : 'hover:bg-[#1E293B] text-[#CBD5E1]'
              }`}
              style={{
                background: isActive ? `linear-gradient(to right, ${activeColorFrom}, ${activeColorTo})` : undefined,
                boxShadow: isActive ? `0 1px 2px 0 ${activeColorFrom}33` : undefined
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[11px] font-medium ${isActive ? 'text-white' : 'text-[#CBD5E1]'}`}>
                  {option}
                </span>
                {isActive && (
                  <div className="w-1.5 h-1.5 bg-white rounded-full flex-shrink-0" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ToggleControl({ label }: { label: string }) {
  const [enabled, setEnabled] = useState(false);
  
  return (
    <button
      onClick={() => setEnabled(!enabled)}
      className={`w-full text-left px-2.5 py-2 rounded-md transition-all duration-200 ${
        enabled
          ? 'bg-gradient-to-r from-[#0891B2] to-[#0E7490] text-white shadow-sm shadow-[#0891B2]/20'
          : 'hover:bg-[#1E293B] text-[#CBD5E1]'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[11px] font-medium ${enabled ? 'text-white' : 'text-[#CBD5E1]'}`}>{label}</span>
        {enabled && (
          <div className="w-1.5 h-1.5 bg-white rounded-full flex-shrink-0" />
        )}
      </div>
    </button>
  );
}

function CheckboxControl({ label }: { label: string }) {
  const [checked, setChecked] = useState(false);
  
  return (
    <button
      onClick={() => setChecked(!checked)}
      className={`w-full text-left px-2.5 py-2 rounded-md transition-all duration-200 ${
        checked
          ? 'bg-gradient-to-r from-[#0891B2] to-[#0E7490] text-white shadow-sm shadow-[#0891B2]/20'
          : 'hover:bg-[#1E293B] text-[#CBD5E1]'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[11px] font-medium ${checked ? 'text-white' : 'text-[#CBD5E1]'}`}>{label}</span>
        {checked && (
          <div className="w-1.5 h-1.5 bg-white rounded-full flex-shrink-0" />
        )}
      </div>
    </button>
  );
}

function CheckboxWithIconControl({ label, iconName, moduleColor }: { label: string, iconName: string, moduleColor: string }) {
  const [checked, setChecked] = useState(false);
  
  // Map icon name to actual icon component
  const getIcon = (name: string) => {
    const iconMap: { [key: string]: any } = {
      'Factory': Factory,
      'Building2': Building2,
      'Database': Database,
      'Home': Home,
      'Truck': Truck,
      'Zap': Zap,
      'X': X,
      'Hotel': Hotel,
      'Waves': Waves,
      'TreeDeciduous': TreeDeciduous,
      'GraduationCap': GraduationCap,
      'Heart': Heart,
      'Building': Building,
      'Leaf': Leaf,
      'Sprout': Sprout,
      'UserCheck': UserCheck,
      'AlertCircle': AlertCircle
    };
    return iconMap[name] || Building2;
  };
  
  const IconComponent = getIcon(iconName);
  
  // Dynamic gradient colors based on moduleColor
  const getGradientColors = () => {
    if (moduleColor === '#10B981') {
      // Green for Module 4
      return {
        from: '#059669',
        to: '#047857',
        iconColor: '#10B981',
        shadow: '#059669'
      };
    } else if (moduleColor === '#06B6D4') {
      // Cyan for Module 3
      return {
        from: '#0891B2',
        to: '#0E7490',
        iconColor: '#0891B2',
        shadow: '#0891B2'
      };
    } else if (moduleColor === '#EF4444') {
      // Red for Module 6
      return {
        from: '#DC2626',
        to: '#B91C1C',
        iconColor: '#EF4444',
        shadow: '#DC2626'
      };
    } else if (moduleColor === '#8B5CF6') {
      // Purple for Module 2
      return {
        from: '#7C3AED',
        to: '#6D28D9',
        iconColor: '#8B5CF6',
        shadow: '#7C3AED'
      };
    }
    // Default (blue)
    return {
      from: '#2563EB',
      to: '#1E40AF',
      iconColor: '#2563EB',
      shadow: '#2563EB'
    };
  };

  const colors = getGradientColors();
  
  return (
    <button
      onClick={() => setChecked(!checked)}
      className={`w-full text-left px-2.5 py-2 rounded-md transition-all duration-200 ${
        checked
          ? 'text-white shadow-sm'
          : 'hover:bg-[#1E293B] text-[#CBD5E1]'
      }`}
      style={{
        background: checked ? `linear-gradient(to right, ${colors.from}, ${colors.to})` : undefined,
        boxShadow: checked ? `0 1px 2px 0 ${colors.shadow}33` : undefined
      }}
    >
      <div className="flex items-start gap-2">
        <IconComponent 
          className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${checked ? 'text-white' : ''}`}
          style={{ color: checked ? undefined : colors.iconColor }}
        />
        <div className="flex-1 min-w-0">
          <div className={`text-[11px] font-medium ${checked ? 'text-white' : 'text-[#CBD5E1]'}`}>
            {label}
          </div>
        </div>
        {checked && (
          <div className="flex-shrink-0 ml-1">
            <div className="w-1.5 h-1.5 bg-white rounded-full" />
          </div>
        )}
      </div>
    </button>
  );
}

function PriorityListControl({ priorities }: { priorities: Array<{ level: string, risk: string }> }) {
  const [selected, setSelected] = useState<string | null>(null);
  
  // Helper function to get priority icon and color based on level
  const getPriorityStyle = (level: string) => {
    if (level === 'Priority 1') {
      return { 
        icon: AlertOctagon, 
        color: '#DC2626', 
        bgColor: '#FEF2F2', 
        borderColor: '#FCA5A5',
        badge: '1',
        label: 'Critical'
      };
    } else if (level === 'Priority 2') {
      return { 
        icon: AlertTriangle, 
        color: '#DC2626', 
        bgColor: '#FEFEFE', 
        borderColor: '#E5E7EB',
        badge: '2',
        label: 'High'
      };
    } else if (level === 'Priority 3') {
      return { 
        icon: AlertCircle, 
        color: '#64748B', 
        bgColor: '#FEFEFE', 
        borderColor: '#E5E7EB',
        badge: '3',
        label: 'Medium'
      };
    } else if (level === 'Priority 4') {
      return { 
        icon: Flag, 
        color: '#64748B', 
        bgColor: '#FEFEFE', 
        borderColor: '#E5E7EB',
        badge: '4',
        label: 'Low'
      };
    } else {
      return { 
        icon: Flag, 
        color: '#64748B', 
        bgColor: '#FEFEFE', 
        borderColor: '#E5E7EB',
        badge: '5',
        label: 'EV Only'
      };
    }
  };
  
  return (
    <div className="space-y-1.5">
      {priorities.map((priority) => {
        const isActive = selected === priority.level;
        const style = getPriorityStyle(priority.level);
        const PriorityIcon = style.icon;
        
        return (
          <button
            key={priority.level}
            onClick={() => setSelected(priority.level === selected ? null : priority.level)}
            className={`w-full text-left px-3 py-2.5 rounded-md transition-all duration-200 border ${
              isActive
                ? 'bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white shadow-md border-transparent'
                : 'hover:shadow-sm'
            }`}
            style={{
              backgroundColor: isActive ? undefined : style.bgColor,
              borderColor: isActive ? undefined : style.borderColor
            }}
          >
            <div className="flex items-start gap-2.5">
              {/* Priority Badge & Icon */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <div 
                  className={`flex items-center justify-center w-5 h-5 rounded-full font-bold text-[9px] ${
                    isActive ? 'bg-white text-[#8B5CF6]' : 'text-white'
                  }`}
                  style={{ backgroundColor: isActive ? undefined : style.color }}
                >
                  {style.badge}
                </div>
                <PriorityIcon 
                  className={`w-3.5 h-3.5 ${isActive ? 'text-white' : ''}`}
                  style={{ color: isActive ? undefined : style.color }}
                />
              </div>
              
              {/* Text Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[10px] font-bold tracking-wide ${
                    isActive ? 'text-white' : ''
                  }`}
                  style={{ color: isActive ? undefined : style.color }}
                  >
                    {priority.level}
                  </span>
                  <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-white/20 text-white' : ''
                  }`}
                  style={{ 
                    backgroundColor: isActive ? undefined : `${style.color}15`,
                    color: isActive ? undefined : style.color
                  }}
                  >
                    {style.label}
                  </span>
                </div>
                <div className={`text-[10px] leading-relaxed ${
                  isActive ? 'text-white/95' : 'text-[#475569]'
                }`}>
                  {priority.risk}
                </div>
              </div>
              
              {/* Active Indicator */}
              {isActive && (
                <div className="flex-shrink-0">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// Module Configuration
function getModuleConfig(module: CWISModule) {
  const configs = {
    module1_suitability: {
      moduleNumber: 'Module 1',
      title: 'System Suitability',
      color: '#3B82F6',
      icon: LayoutGrid,
      purpose: 'Guide the selection of appropriate sanitation systems across existing and upcoming settlement areas.',
      outputLayerTitle: 'Sanitation Zone',
      outputLayers: [
        'Network Coverage',
        'Non-Network Coverage',
        'On-site Treatment System'
      ],
      defaultLayer: 'Network Coverage',
      scenarioCreatorTitle: 'Define Sewer Regions',
      scenarioConfig: {
        sliders: [
          { label: 'Settlement Density (pph)', min: 60, max: 500, defaultValue: 150, unit: 'pph' },
          { label: 'Groundwater Level (meters)', min: 2, max: 24, defaultValue: 10, unit: 'm' },
          { label: 'Ground Infiltration Risk (% sinkhole area/km²)', min: 1, max: 10, defaultValue: 3, unit: '%' },
          { label: 'Flood Hazard Risk Level', min: 1, max: 5, defaultValue: 3, unit: '' }
        ],
        buttonLabel: 'Recalculate Suitability'
      }
    },
    module2_containment: {
      moduleNumber: 'Module 2',
      title: 'Toilet Access',
      color: '#8B5CF6',
      icon: Shield,
      purpose: 'Mapping containment systems from individual to community and public toilets, across different climate and environmental risk conditions.',
      outputLayerTitle: 'Containment Risk Mapping',
      useVennDiagram: true,
      multiSelectOutputLayers: true,
      outputLayers: [
        'Flood',
        'Ground infiltration',
        'Ground water table',
        'Bulk Generators',
        'No significant risk'
      ],
      defaultLayers: ['Flood'],
      scenarioCreatorTitle: 'Priority Beneficiaries Selections',
      scenarioConfig: {
        priorityList: [
          { level: 'Priority 1', risk: 'Flood + Groundwater Depth + Ground Infiltration + Heat' },
          { level: 'Priority 2', risk: 'Any 3 risks' },
          { level: 'Priority 3', risk: 'Any 2 risks' },
          { level: 'Priority 4', risk: 'Any 1 risk' },
          { level: 'Priority 5', risk: 'EV Housing only' }
        ]
      },
      publicToiletsSection: {
        title: 'Public and Community Toilets',
        layers: [
          'Existing',
          'Proposed Upgrades/Refurbishment',
          'Proposed Public Toilets',
          'Proposed Community toilets'
        ],
        defaultLayer: 'Existing'
      }
    },
    module3_collection: {
      moduleNumber: 'Module 3',
      title: 'Collection & Transport',
      color: '#06B6D4',
      icon: Truck,
      purpose: 'Identifies where desludging trucks can reach, where access is constrained, and potential scenarios for regular emptying.',
      outputLayerTitle: 'Fleet Accessibility',
      useModule3Fleet: true,
      additionalSection: {
        title: 'Desludging Travel Time',
        layers: [
          'Existing FSTP – Dauis',
          'Proposed FSTP – Tagbilaran',
          'Factoring Both FSTP'
        ],
        defaultLayer: 'Existing FSTP – Dauis'
      }
    },
    module4_treatment: {
      moduleNumber: 'Module 4',
      title: 'Treatment, Disposal & Re-use',
      color: '#10B981',
      icon: Recycle,
      purpose: 'Evaluate treatment node configuration, catchment coverage, and potential re-use opportunities.',
      outputLayerTitle: 'Proposed Treatment Catchment',
      useHierarchicalLayers: true,
      hierarchicalLayers: [
        {
          name: 'FSTP',
          defaultExpanded: true,
          sublayers: [
            'Existing FSTP – Dauis',
            'Proposed FSTP – Tagbilaran'
          ]
        },
        {
          name: 'Solid Free Sewer',
          defaultExpanded: true,
          sublayers: [
            'Treatment plant 1',
            'Treatment plant 2',
            'Treatment plant 3',
            'Treatment plant 4'
          ]
        },
        {
          name: 'Dry Weather Interceptor Flow',
          defaultExpanded: true,
          sublayers: [
            'Catchment 1',
            'Catchment 2',
            'Catchment 3',
            'Catchment 4'
          ]
        }
      ],
      additionalSection: {
        title: 'Potential Re-use Hotspots',
        checkboxesWithIcons: [
          { label: 'Hotel', icon: 'Hotel' },
          { label: 'Resorts', icon: 'Waves' },
          { label: 'Public Park/Garden', icon: 'TreeDeciduous' },
          { label: 'School/Collages (large premises)', icon: 'GraduationCap' },
          { label: 'Health Centre (large premises)', icon: 'Heart' },
          { label: 'Public offices (large premises)', icon: 'Building' },
          { label: 'Plant/Trees based green cover', icon: 'Leaf' },
          { label: 'Potential Industries', icon: 'Factory' }
        ]
      }
    },
    module5_financial: {
      moduleNumber: 'Module 5',
      title: 'Financial Sustainability',
      color: '#F59E0B',
      icon: DollarSign,
      purpose: 'Mapping infrastructure interventions, locations, and costs across the sanitation value chain for both network and non-network solutions.',
      skipOutputSection: true,
      scenarioCreatorTitle: 'Cost Summary',
      useHierarchicalLayers: true,
      hierarchicalLayers: [
        {
          name: 'Cost Summary',
          icon: 'DollarSign',
          sublayers: []
        }
      ],
      additionalSection: {
        title: 'Toilet Access',
        useHierarchicalLayers: true,
        hierarchicalLayers: [
          {
            name: 'Individual Toilets',
            icon: 'Home',
            defaultExpanded: true,
            sublayers: [
              { name: 'Super structure + Containment + Soak Pit', icon: 'PlusCircle' },
              { name: 'Containment + Soak pit', icon: 'Container' },
              { name: 'Soak pit only', icon: 'Droplets' }
            ]
          },
          {
            name: 'Public and Community Toilets',
            icon: 'Users',
            defaultExpanded: true,
            sublayers: [
              {
                name: 'Existing Upgrades',
                icon: 'RefreshCw',
                defaultExpanded: false,
                sublayers: [
                  { name: 'Public Toilet', icon: 'Building2' },
                  { name: 'Community Toilets', icon: 'Users' }
                ]
              },
              {
                name: 'Built New Units',
                icon: 'PlusSquare',
                defaultExpanded: false,
                sublayers: [
                  { name: 'Public', icon: 'Building2' },
                  { name: 'Community Toilets', icon: 'Users' }
                ]
              }
            ]
          }
        ]
      },
      additionalSection2: {
        title: 'Collection and Transportation',
        useHierarchicalLayers: true,
        hierarchicalLayers: [
          {
            name: 'Fleet Capacity (10 KL)',
            icon: 'Truck',
            defaultExpanded: true,
            sublayers: []
          },
          {
            name: 'Fleet Capacity (5 KL)',
            icon: 'Truck',
            defaultExpanded: true,
            sublayers: []
          },
          {
            name: 'Fleet Capacity (2 KL)',
            icon: 'Truck',
            defaultExpanded: true,
            sublayers: []
          },
          {
            name: 'Additional Pump',
            icon: 'Zap',
            defaultExpanded: true,
            sublayers: []
          }
        ]
      },
      additionalSection3: {
        title: 'Treatment, Disposal and Re-use',
        useHierarchicalLayers: true,
        hierarchicalLayers: [
          {
            name: 'FSTP (Non-Network)',
            icon: 'Factory',
            defaultExpanded: true,
            sublayers: [
              { name: 'Existing FSTP Upgrade, Dauis', icon: 'Recycle' },
              { name: 'Proposed FSTP, Tagbilaran', icon: 'Recycle' }
            ]
          },
          {
            name: 'Solid-Free Sewer (Network)',
            icon: 'Network',
            defaultExpanded: true,
            sublayers: [
              {
                name: 'Catchment 1',
                icon: 'Droplets',
                defaultExpanded: false,
                sublayers: [
                  { name: 'Network', icon: 'Network' },
                  { name: 'Treatment Unit', icon: 'Recycle' }
                ]
              },
              {
                name: 'Catchment 2',
                icon: 'Droplets',
                defaultExpanded: false,
                sublayers: [
                  { name: 'Network', icon: 'Network' },
                  { name: 'Treatment Unit', icon: 'Recycle' }
                ]
              },
              {
                name: 'Catchment 3',
                icon: 'Droplets',
                defaultExpanded: false,
                sublayers: [
                  { name: 'Network', icon: 'Network' },
                  { name: 'Treatment Unit', icon: 'Recycle' }
                ]
              },
              {
                name: 'Catchment 4',
                icon: 'Droplets',
                defaultExpanded: false,
                sublayers: [
                  { name: 'Network', icon: 'Network' },
                  { name: 'Treatment Unit', icon: 'Recycle' }
                ]
              }
            ]
          },
          {
            name: 'DWIF (Outfall Treatment)',
            icon: 'Waves',
            defaultExpanded: true,
            sublayers: [
              { name: 'Catchment 1', icon: 'Droplets' },
              { name: 'Catchment 2', icon: 'Droplets' },
              { name: 'Catchment 3', icon: 'Droplets' }
            ]
          }
        ]
      }
    },
    module6_enabling: {
      moduleNumber: 'Module 6',
      title: 'Enabling Environment',
      color: '#EF4444',
      icon: Users,
      purpose: 'Intervention phasing, database of existing systems, and guidance for installing new systems based on risk conditions.',
      outputLayerTitle: 'Implementation Phasing',
      outputLayers: [
        'Phase 1 – Short Term',
        'Phase 2 – Medium Term',
        'Phase 3 – Long Term'
      ],
      defaultLayer: 'Phase 1 – Short Term',
      scenarioCreatorTitle: 'Facilitating New Building Plan Applications',
      scenarioUseHierarchicalLayers: true,
      hierarchicalLayers: [
        {
          name: 'Location Input',
          icon: 'MapPin',
          interactive: true,
          defaultExpanded: true,
          sublayers: []
        },
        {
          name: 'Potential Containment Risk',
          icon: 'AlertTriangle',
          defaultExpanded: true,
          sublayers: [
            { name: 'Flood', icon: 'Waves' },
            { name: 'Ground Infiltration', icon: 'ArrowDown' },
            { name: 'Ground Water Table', icon: 'Droplets' },
            { name: 'No Significant Risk', icon: 'CheckCircle' }
          ]
        },
        {
          name: 'Database of Existing Containment',
          icon: 'Database',
          defaultExpanded: true,
          sublayers: [
            {
              name: 'Residential Premises',
              icon: 'Home',
              defaultExpanded: false,
              sublayers: [
                { name: 'Septic Tank + Soak Pit', icon: 'Container' },
                { name: 'Septic Tank without Soak Pit', icon: 'Package' },
                { name: 'Unlined Tank', icon: 'Box' }
              ]
            },
            {
              name: 'Non-Residential Premises and Small Capacity',
              icon: 'Building2',
              defaultExpanded: false,
              sublayers: [
                { name: 'Septic Tank + Soak Pit', icon: 'Container' },
                { name: 'Septic Tank without Soak Pit', icon: 'Package' },
                { name: 'Unlined Tank', icon: 'Box' }
              ]
            }
          ]
        }
      ],
      additionalSection: {
        title: 'Roles and Responsibility Mapping',
        checkboxesWithIcons: [
          { label: 'Responsibility Matrix', icon: 'UserCheck' },
          { label: 'Raise Request/Complain', icon: 'AlertCircle' }
        ]
      }
    }
  };

  return configs[module as keyof typeof configs];
}

// ─── FSTP Travel Time Panel (Module 3) ──────────────────────────────────────

const FSTP_DRIVE_TIME_BANDS = [
  { key: '< 10 min',    color: '#16A34A' },
  { key: '10 - 20 min', color: '#FACC15' },
  { key: '20 - 30 min', color: '#F97316' },
  { key: '> 30 min',    color: '#DC2626' },
];

const FLEET_CLASSES = [
  { key: '10 KL Truck',       label: '10 KL Truck',       color: '#22C55E', description: 'Large truck, main road access' },
  { key: '5 KL Truck',        label: '5 KL Truck',        color: '#3B82F6', description: 'Small truck, internal road access' },
  { key: 'With Booster Pump', label: 'With Booster Pump', color: '#F59E0B', description: 'Extended pipe, additional equipment needed' },
  { key: 'Hard to Access',    label: 'Hard to Access',    color: '#EF4444', description: 'Beyond truck and pipe reach' },
];

const FLEET_ICONS: Record<string, React.ComponentType<any>> = {
  '10 KL Truck': Truck,
  '5 KL Truck': Truck,
  'With Booster Pump': Zap,
  'Hard to Access': AlertTriangle,
};

function Module3FleetSelector({
  activeClasses,
  onChange,
}: {
  activeClasses: string[];
  onChange: (classes: string[]) => void;
}) {
  const allKeys = FLEET_CLASSES.map(c => c.key);
  const isOn = activeClasses.length > 0;

  const handleHeaderClick = () => {
    onChange(isOn ? [] : allKeys);
  };

  const toggleSub = (key: string) => {
    const next = activeClasses.includes(key)
      ? activeClasses.filter(k => k !== key)
      : [...activeClasses, key];
    onChange(next);
  };

  return (
    <div className="space-y-1">
      {/* Header row — click toggles all sub-layers */}
      <button
        onClick={handleHeaderClick}
        className={`w-full text-left px-2.5 py-2 rounded-md transition-all duration-200 border ${
          isOn ? 'bg-[#162032] border-[#334155]' : 'bg-[#0B1826] border-[#1E3A5F] hover:border-[#334155]'
        }`}
      >
        <div className="flex items-center gap-2">
          <Truck className={`w-3.5 h-3.5 flex-shrink-0 ${isOn ? 'text-[#38BDF8]' : 'text-[#475569]'}`} />
          <span className={`text-[11px] font-semibold ${isOn ? 'text-white' : 'text-[#64748B]'}`}>Desludging Vehicle Access</span>
        </div>
      </button>

      {/* Sub-layers — always visible */}
      <div className="ml-6 mt-1 space-y-1">
          {FLEET_CLASSES.map(cls => {
            const active = activeClasses.includes(cls.key);
            const SubIcon = FLEET_ICONS[cls.key] || Truck;
            return (
              <button
                key={cls.key}
                onClick={() => toggleSub(cls.key)}
                className={`w-full text-left px-2.5 py-2.5 rounded-md transition-all duration-150 ${
                  active ? 'bg-[#0F2235]' : 'hover:bg-[#0C1825]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <SubIcon className={`w-3.5 h-3.5 flex-shrink-0 ${active ? 'text-[#94A3B8]' : 'text-[#475569]'}`} />
                  <span className={`text-[11px] font-medium flex-1 ${active ? 'text-white' : 'text-[#64748B]'}`}>
                    {cls.label}
                  </span>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cls.color, opacity: active ? 1 : 0.35 }} />
                </div>
                <div className={`mt-0.5 ml-5.5 text-[9px] leading-snug ${active ? 'text-[#64748B]' : 'text-[#475569]'}`}>
                  {cls.description}
                </div>
              </button>
            );
          })}
      </div>
    </div>
  );
}

function FstpTravelTimePanel({
  value,
  onChange,
  showBuildings,
  onShowBuildingsChange,
}: {
  value: FstpFacilityState[];
  onChange: (v: FstpFacilityState[]) => void;
  showBuildings: boolean;
  onShowBuildingsChange: (v: boolean) => void;
}) {
  // Derive global peak traffic state: on if ANY enabled facility uses 'Peak'
  const anyEnabled = value.some(f => f.enabled);
  const isPeakTraffic = anyEnabled && value.filter(f => f.enabled).every(f => f.scenario === 'Peak');

  const toggleFacility = (facilityId: number) => {
    onChange(value.map(f => f.facilityId === facilityId ? { ...f, enabled: !f.enabled } : f));
  };

  const togglePeakTraffic = () => {
    const newScenario = isPeakTraffic ? 'Normal' : 'Peak';
    onChange(value.map(f => ({ ...f, scenario: newScenario as 'Normal' | 'Peak' })));
  };

  return (
    <div className="space-y-1">
      {/* Header row — non-collapsible */}
      <div className="px-2.5 py-2 rounded-md bg-[#162032] border border-[#334155]">
        <div className="flex items-center gap-2">
          <Route className="w-3.5 h-3.5 text-[#06B6D4] flex-shrink-0" />
          <span className="text-[11px] font-semibold text-white">FSTP Service Coverage</span>
        </div>
      </div>

      {/* Sub-layers — always visible */}
      <div className="ml-6 mt-1 space-y-1">
          {value.map(facility => {
            const meta = FSTP_FACILITY_META[facility.facilityId] || { color: '#64748B', description: '' };
            const isExisting = facility.facilityName.toLowerCase().includes('existing');
            return (
              <button
                key={facility.facilityId}
                onClick={() => toggleFacility(facility.facilityId)}
                className={`w-full text-left px-2.5 py-2.5 rounded-md transition-all duration-150 ${
                  facility.enabled ? 'bg-[#0F2235]' : 'hover:bg-[#0C1825]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MapPin className={`w-3.5 h-3.5 flex-shrink-0 ${facility.enabled ? 'text-[#94A3B8]' : 'text-[#475569]'}`} />
                  <span className={`text-[11px] font-medium flex-1 ${facility.enabled ? 'text-white' : 'text-[#64748B]'}`}>
                    {facility.facilityName}
                  </span>
                  <span className={`text-[9px] px-1.5 py-px rounded-full font-medium flex-shrink-0 ${
                    isExisting ? 'bg-[#14532D] text-[#86EFAC]' : 'bg-[#172554] text-[#93C5FD]'
                  }`}>
                    {isExisting ? 'Existing' : 'Proposed'}
                  </span>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: meta.color, opacity: facility.enabled ? 1 : 0.35 }} />
                </div>
                <div className={`mt-0.5 ml-5.5 text-[9px] leading-snug ${facility.enabled ? 'text-[#64748B]' : 'text-[#475569]'}`}>
                  {meta.description}
                </div>
              </button>
            );
          })}

          {/* Divider */}
          <div className="border-t border-[#1E3A5F] my-1" />

          {/* Peak Traffic sub-option */}
          <button
            onClick={togglePeakTraffic}
            className={`w-full text-left px-2.5 py-2.5 rounded-md transition-all duration-150 ${
              isPeakTraffic ? 'bg-[#0F2235]' : 'hover:bg-[#0C1825]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Navigation className={`w-3.5 h-3.5 flex-shrink-0 ${isPeakTraffic ? 'text-[#94A3B8]' : 'text-[#475569]'}`} />
              <span className={`text-[11px] font-medium flex-1 ${isPeakTraffic ? 'text-white' : 'text-[#64748B]'}`}>Peak Traffic</span>
              {isPeakTraffic && <Check className="w-3 h-3 text-[#06B6D4] flex-shrink-0" />}
            </div>
            <div className={`mt-0.5 ml-5.5 text-[9px] leading-snug ${isPeakTraffic ? 'text-[#64748B]' : 'text-[#475569]'}`}>
              Apply peak-hour congestion to travel time estimates
            </div>
          </button>

          {/* Show Buildings sub-option */}
          <button
            onClick={() => onShowBuildingsChange(!showBuildings)}
            className={`w-full text-left px-2.5 py-2.5 rounded-md transition-all duration-150 ${
              showBuildings ? 'bg-[#0F2235]' : 'hover:bg-[#0C1825]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Building2 className={`w-3.5 h-3.5 flex-shrink-0 ${showBuildings ? 'text-[#94A3B8]' : 'text-[#475569]'}`} />
              <span className={`text-[11px] font-medium flex-1 ${showBuildings ? 'text-white' : 'text-[#64748B]'}`}>Show Buildings</span>
              {showBuildings && <Check className="w-3 h-3 text-[#06B6D4] flex-shrink-0" />}
            </div>
            <div className={`mt-0.5 ml-5.5 text-[9px] leading-snug ${showBuildings ? 'text-[#64748B]' : 'text-[#475569]'}`}>
              Overlay individual building footprints within service bands
            </div>
          </button>
        </div>
    </div>
  );
}

// Service Area Layer Selector Component - Uniform color with dot icons for FSTP service areas
function ServiceAreaLayerSelector({ layers, defaultLayer, moduleColor }: { layers: string[], defaultLayer: string, moduleColor: string }) {
  const [selected, setSelected] = useState(defaultLayer);

  // Use uniform cyan gradient for Module 3
  const gradientFrom = '#0891B2';
  const gradientTo = '#0E7490';

  return (
    <div className="space-y-1">
      {layers.map((layer) => {
        const isActive = selected === layer;
        
        return (
          <button
            key={layer}
            onClick={() => setSelected(layer)}
            className={`w-full text-left px-2.5 py-2 rounded-md transition-all duration-200 ${
              isActive
                ? 'text-white shadow-sm'
                : 'hover:bg-[#F8FAFC] text-[#1F2937]'
            }`}
            style={{
              background: isActive ? `linear-gradient(to right, ${gradientFrom}, ${gradientTo})` : undefined,
              boxShadow: isActive ? `0 1px 2px 0 ${gradientFrom}33` : undefined
            }}
          >
            <div className="flex items-start gap-2">
              {/* Dot Icon */}
              <Circle 
                className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-[#0891B2]'}`}
                fill={isActive ? 'currentColor' : 'currentColor'}
              />
              
              {/* Layer Name */}
              <div className="flex-1">
                <div className={`text-[11px] font-medium ${isActive ? 'text-white' : 'text-[#0F172A]'}`}>
                  {layer}
                </div>
              </div>

              {/* Active Indicator Dot */}
              {isActive && (
                <div className="w-1.5 h-1.5 bg-white rounded-full flex-shrink-0 mt-1" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}