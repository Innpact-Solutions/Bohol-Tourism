import React, { useState } from 'react';
import { BarChart3, Search } from 'lucide-react';
import { RightPanel } from './RightPanel';
import { QueryPanel } from './QueryPanel';
import { ModuleAnalyticsPanel } from './ModuleAnalyticsPanel';
import { BaseLayerDefaultPanel } from './BaseLayerDefaultPanel';
import type { Sector, Scenario } from '../App';
import type { CWISModule } from './ModuleNavigationTabs';

interface RightPanelContainerProps {
  activeSector: Sector;
  activeLayerId: string;
  selectedWard: string | null;
  selectedWardName?: string;
  scenario: Scenario;
  activeInfraLayers: string[];
  activeEducationSubLayers: string[];
  activeHealthcareSubLayers: string[];
  activePublicAmenitiesSubLayers: string[];
  activeTransportSubLayers: string[];
  activeRoadSafetySubLayers: string[];
  showQueryPanel: boolean;
  onCloseQuery: () => void;
  activeBaseLayers: string[];
  selectedWardId?: string;
  selectedRoadName?: string;
  activeHazardLayerId?: string;
  activeHazardKey?: string;
  onQueryResults?: (results: any[]) => void;
  onEnableInfraLayers?: () => void; // Callback to enable infrastructure layers
  onQueryExecuted?: () => void; // Callback when query is executed
  onApplyFilters?: (filters: {
    educationSubLayers: string[];
    healthcareSubLayers: string[];
    publicAmenitiesSubLayers: string[];
    transportSubLayers: string[];
  }) => void; // Callback to apply infrastructure filters
  onZoomToPoint?: (lat: number, lng: number, name: string) => void; // Callback to zoom to a specific point
  onCloseResults?: () => void; // Callback when query results are closed
  onRoadNetworkSelect?: (selection: { category: string; gridcode: string; hazardColor?: string } | null) => void; // Callback when a road network result is selected
  onActivateHazardLayer?: (hazardType: 'heat' | 'air' | 'flood' | 'multiHazard') => void; // Callback to activate a hazard layer
  onZoomToWards?: (wardIds: string[]) => void; // Callback to zoom map to fit selected ward(s)
  onZoomToRoadSegment?: (features: any[], category: string, gridcode: string, color: string) => void; // Callback to zoom to and highlight road segment
  // Infrastructure counts - preloaded from App.tsx
  educationCounts?: Record<string, number>;
  healthcareCounts?: Record<string, number>;
  publicAmenitiesCounts?: Record<string, number>;
  transportCounts?: Record<string, number>;
  roadNetworkStats?: Record<string, number>; // Road network statistics (km)
  roadSafetyStats?: Record<string, number>; // Road safety statistics (km by star rating)
  selectedRoadStarSegment?: { roadName: string; starRating: string; vehicleType: string } | null; // NEW: Selected road star segment
  onRoadStarSegmentSelect?: (segment: { roadName: string; starRating: string; vehicleType: string } | null) => void; // NEW: Callback to select road star segment
  onZoomToRoadStarSegment?: (roadName: string, starRating: string, vehicleType: string) => void; // NEW: Callback to zoom to road star segment
  onResetBarChartFilters?: () => void; // NEW: Callback to reset all bar chart filters
  selectedDonutCategory?: string | null; // NEW: Selected donut category for map filtering
  onDonutCategorySelect?: (category: string | null) => void; // NEW: Callback to select donut category
  // NEW: CWIS Module props
  activeModule?: CWISModule;
  activeFstpLayers?: any[];
  selectedLguName?: string;
  totalResidentialBuildings?: number; // NEW: Sum of Res_Buildings from loaded barangay boundaries
  totalAreaKm2?: number; // NEW: Sum of Shape_Area converted to km² from loaded barangay boundaries
  totalPopulation2024?: number; // NEW: Sum of Pop_2024 from loaded barangay boundaries
  activeBuildingCategories?: string[];
  activeBuildingHeightCategories?: string[];
  activeBuildingAreaCategories?: string[];
  isEconomicVulnerabilityActive?: boolean;
  scenarioStats?: {
    grid_count: number; area_ha: number;
    network_bldgs: number; onsite_bldgs: number; nonnetwork_bldgs: number; total_bldgs: number;
    by_municipality: Array<{ mun: string; network: number; onsite: number; nonnetwork: number }>;
    zones?: Array<{ cluster_id: number; mun: string; network_bldgs: number; grid_cells: number; area_ha: number; tourism_cells: number; centroid_lng: number; centroid_lat: number; bbox_minlng: number; bbox_minlat: number; bbox_maxlng: number; bbox_maxlat: number; brgy_names: string[]; use_type_pct: Array<{ name: string; pct: number }>; buffer_geom_geojson?: any; buffer_area_ha?: number | null; buffer_bldgs?: number }>;
  } | null;
  isScenarioRunning?: boolean;
  onZoneClick?: (zone: { cluster_id: number; bbox_minlng: number; bbox_minlat: number; bbox_maxlng: number; bbox_maxlat: number; mun: string; buffer_geom_geojson?: any }) => void;
}

export function RightPanelContainer({
  activeSector,
  activeLayerId,
  selectedWard,
  selectedWardName,
  scenario,
  activeInfraLayers,
  activeEducationSubLayers,
  activeHealthcareSubLayers,
  activePublicAmenitiesSubLayers,
  activeTransportSubLayers,
  activeRoadSafetySubLayers,
  showQueryPanel,
  onCloseQuery,
  activeBaseLayers,
  selectedWardId = 'all',
  selectedRoadName = 'all',
  activeHazardLayerId = '',
  activeHazardKey = '',
  onQueryResults,
  onEnableInfraLayers,
  onQueryExecuted,
  onApplyFilters,
  onZoomToPoint,
  onCloseResults,
  onRoadNetworkSelect,
  onActivateHazardLayer,
  onZoomToWards,
  onZoomToRoadSegment,
  educationCounts = {},
  healthcareCounts = {},
  publicAmenitiesCounts = {},
  transportCounts = {},
  roadNetworkStats = {},
  roadSafetyStats = {},
  selectedRoadStarSegment = null,
  onRoadStarSegmentSelect,
  onZoomToRoadStarSegment,
  onResetBarChartFilters,
  selectedDonutCategory = null,
  onDonutCategorySelect,
  activeModule,
  selectedLguName,
  totalResidentialBuildings = 0,
  totalAreaKm2 = 0,
  totalPopulation2024 = 0,
  activeBuildingCategories = [],
  activeBuildingHeightCategories = [],
  activeBuildingAreaCategories = [],
  isEconomicVulnerabilityActive = false,
  isScenarioRunning = false,
  scenarioStats = null,
  activeFstpLayers = [],
  onZoneClick,
}: RightPanelContainerProps) {
  // Debug: Log what we're receiving and passing
  console.log('🏠 [RightPanelContainer] Received totalResidentialBuildings:', totalResidentialBuildings);
  console.log('📐 [RightPanelContainer] Received totalAreaKm2:', totalAreaKm2.toFixed(2), 'km²');
  console.log('👥 [RightPanelContainer] Received totalPopulation2024:', totalPopulation2024.toLocaleString());
  console.log('🏠 [RightPanelContainer] activeModule:', activeModule);
  
  return (
    <div 
      data-tutorial="right-panel"
      className="w-[330px] bg-[#0B1120] border-l border-[#334155] flex flex-col flex-shrink-0 shadow-lg"
    >
      {/* Panel Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Priority 1: Show Module Analytics if a module is active */}
        {activeModule ? (
          <ModuleAnalyticsPanel 
            activeModule={activeModule} 
            selectedLguName={selectedLguName || 'Bohol'}
            totalResidentialBuildings={totalResidentialBuildings}
            totalAreaKm2={totalAreaKm2}
            isScenarioRunning={isScenarioRunning}
            totalPopulation2024={totalPopulation2024}
            scenarioStats={scenarioStats}
            onZoneClick={onZoneClick}
            activeFstpLayers={activeFstpLayers}
          />
        ) : !showQueryPanel ? (
          // Priority 2: Show base layer default panel
          <BaseLayerDefaultPanel
            totalPopulation2024={totalPopulation2024}
            totalAreaKm2={totalAreaKm2}
            totalResidentialBuildings={totalResidentialBuildings}
            activeLayerId={activeLayerId}
            selectedWardId={selectedWardId}
            selectedLguName={selectedLguName}
            selectedWardName={selectedWardName}
            selectedDonutCategory={selectedDonutCategory}
            onDonutCategorySelect={onDonutCategorySelect}
            activeBuildingCategories={activeBuildingCategories}
            activeBuildingHeightCategories={activeBuildingHeightCategories}
            activeBuildingAreaCategories={activeBuildingAreaCategories}
            isEconomicVulnerabilityActive={isEconomicVulnerabilityActive}
          />
        ) : (
          <QueryPanel
            isOpen={true}
            onClose={onCloseQuery}
            activeSector={activeSector}
            selectedWard={selectedWard || undefined}
            scenario={scenario}
            activeHazardKey={activeHazardKey}
            onQueryResults={onQueryResults}
            onEnableInfraLayers={onEnableInfraLayers}
            onQueryExecuted={onQueryExecuted}
            onApplyFilters={onApplyFilters}
            onZoomToPoint={onZoomToPoint}
            onCloseResults={onCloseResults}
            onRoadNetworkSelect={onRoadNetworkSelect}
            onActivateHazardLayer={onActivateHazardLayer}
            onZoomToWards={onZoomToWards}
            onZoomToRoadSegment={onZoomToRoadSegment}
            educationCounts={educationCounts}
            healthcareCounts={healthcareCounts}
            publicAmenitiesCounts={publicAmenitiesCounts}
            transportCounts={transportCounts}
            roadNetworkStats={roadNetworkStats}
            roadSafetyStats={roadSafetyStats}
            selectedRoadStarSegment={selectedRoadStarSegment}
            onRoadStarSegmentSelect={onRoadStarSegmentSelect}
            onZoomToRoadStarSegment={onZoomToRoadStarSegment}
            onResetBarChartFilters={onResetBarChartFilters}
            selectedDonutCategory={selectedDonutCategory}
            onDonutCategorySelect={onDonutCategorySelect}
          />
        )}
      </div>
    </div>
  );
}