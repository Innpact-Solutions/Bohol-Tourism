/**
 * ============================================================================
 * BHUBANESWAR CLIMATE RISK DASHBOARD - RIGHT PANEL CONTENT CONFIGURATION
 * ============================================================================
 * 
 * This is the MASTER configuration file for all text content in the right panel.
 * 
 * HOW TO USE:
 * -----------
 * 1. Open any of the sector-specific files in the /data/ folder
 * 2. Edit the text you want to change
 * 3. Save the file (auto-saves in Figma Make)
 * 4. Changes will appear instantly in the dashboard preview
 * 
 * FILES ORGANIZATION:
 * ------------------
 * Each file is organized TOP-TO-BOTTOM matching the right panel layout.
 * All files follow the same structure for consistency:
 * 
 * 📄 heatStressContent.ts      - Heat Stress sector content
 * 📄 airPollutionContent.ts    - Air Pollution sector content
 * 📄 floodContent.ts           - Flood sector content
 * 📄 multiHazardContent.ts     - Multi-Hazard sector content
 * 📄 infrastructureContent.ts  - Education, Healthcare, Public Amenities, Transport layers
 * 📄 roadSafetyContent.ts      - Road Safety iRAP analysis content
 * 📄 kpiLabels.ts             - Legacy KPI labels (still in use)
 * 
 * STRUCTURE INSIDE EACH FILE:
 * --------------------------
 * ✅ SCENARIO_INFO         - Top scenario card text
 * ✅ SECTION_HEADER        - Main section title
 * ✅ KPI_TILES             - All KPI titles and subtitles
 * ✅ SUB_LAYER_HEADERS     - Sub-layer overview titles
 * ✅ IMPACT_DISTRIBUTION   - Impact chart labels and text
 * ✅ DETAILED_BREAKDOWN    - Breakdown chart labels
 * ✅ ROAD_NETWORK_ANALYSIS - Road network chart labels
 * ✅ LOADING_STATES        - Loading messages
 * ✅ ERROR_STATES          - Error messages
 * 
 * EXAMPLES:
 * ---------
 * 
 * Example 1: Change Heat Stress KPI title
 * Open: /data/heatStressContent.ts
 * Find: KPI_TILES.hotspots.title
 * Change: 'Heat Stress Hotspots' → 'Your New Title'
 * 
 * Example 2: Change Air Pollution section header
 * Open: /data/airPollutionContent.ts
 * Find: SECTION_HEADER.title
 * Change: 'Air Quality Index (AQI) Overview' → 'Your New Title'
 * 
 * Example 3: Change Education facility subtitle
 * Open: /data/infrastructureContent.ts
 * Find: EDUCATION.kpiTiles.selectedFacilities.subtitle
 * Change: 'Educational institutions' → 'Your New Subtitle'
 * 
 * NOTES:
 * ------
 * • Keep text concise for better UI appearance
 * • Maintain consistent terminology across all sectors
 * • Color codes are in HEX format (e.g., '#E3000F')
 * • Some subtitles are dynamic (calculated from data)
 * • All changes are instant - no build step required
 * 
 * ============================================================================
 */

// Export all sector content
export * as HeatStressContent from './heatStressContent';
export * as AirPollutionContent from './airPollutionContent';
export * as FloodContent from './floodContent';
export * as MultiHazardContent from './multiHazardContent';
export * as InfrastructureContent from './infrastructureContent';
export * as RoadSafetyContent from './roadSafetyContent';

// Export legacy KPI labels (still in use throughout the app)
export { KPI_LABELS, getHazardExposureSubtitle } from './kpiLabels';

/**
 * QUICK REFERENCE GUIDE
 * =====================
 * 
 * HEAT STRESS SECTOR:
 * - KPI Titles: Heat Hotspots, Buildings Exposed, Infrastructure Affected, Road Network
 * - Sub-layers: LST, AST, RH, WBT, WBGT, UHI, NDVI
 * - Special: Includes Scenario Planning section
 * 
 * AIR POLLUTION SECTOR:
 * - KPI Titles: Poor-Severe AQI Areas, Buildings, Infrastructure, Roads
 * - Sub-layers: NO₂, SO₂, CO, PM₁₀, PM₂.₅, O₃
 * - Focus: Air Quality Index categories
 * 
 * FLOOD SECTOR:
 * - KPI Titles: Flood-Prone Areas, Buildings, Infrastructure, Road Network
 * - Sub-layers: Flood Susceptibility, Waterlogging Risk
 * - Focus: Flood risk levels
 * 
 * MULTI-HAZARD SECTOR:
 * - KPI Titles: High Exposure Zones, Buildings, Infrastructure, Road Network
 * - Sub-layers: Heat-Flood Combined, Heat-Air Combined
 * - Focus: Compounded hazard impacts
 * 
 * INFRASTRUCTURE LAYERS:
 * - Education: Schools, Colleges, Kindergartens
 * - Healthcare: Hospitals, Health Centres, Nursing Homes
 * - Public Amenities: 12+ facility types (parks, fire stations, etc.)
 * - Transport: Airports, Bus terminals, Railway stations, EV charging, Bus stops
 * 
 * ROAD SAFETY (iRAP):
 * - Star Ratings: 1-5 star classification
 * - Vehicle Types: Vehicle, Pedestrian, Motorcycle, Bicycle
 * - Focus: Road safety star rating distribution
 * 
 * WARD ANALYTICS:
 * - Appears when a ward is selected
 * - Shows: Ward Area, Population, Buildings, Infrastructure breakdown
 * - Per-sector: Education, Healthcare, Public Amenities, Transport in ward
 */

// Helper type for content structure (for TypeScript users)
export interface ContentSection {
  title?: string;
  subtitle?: string;
  description?: string;
  color?: string;
  loadingText?: string;
  errorText?: string;
  noDataText?: string;
}

export interface KPITileContent {
  title: string;
  subtitle: string;
  id?: string;
}

export interface ChartContent {
  title: string;
  subtitle?: string;
  loadingText: string;
  errorText: string;
  noDataText?: string;
  legend?: Record<string, string>;
  rowLabels?: Record<string, string>;
}
