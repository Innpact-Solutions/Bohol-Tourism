/**
 * MULTI-HAZARD SECTOR - Right Panel Content Configuration
 * 
 * This file contains ALL text content for the Multi-Hazard right panel.
 * Edit any text here to update the dashboard instantly.
 * Content is organized top-to-bottom matching the right panel layout.
 */

// ============================================================================
// SCENARIO INFO CARD (Top of panel)
// ============================================================================
export const SCENARIO_INFO = {
  title: 'Baseline Scenario',
  description: 'Based on Composite Multi-Hazard Index | 2025',
  referenceYearLabel: 'Reference Year:',
  referenceYear: '2025',
};

// ============================================================================
// MAIN SECTION HEADER
// ============================================================================
export const SECTION_HEADER = {
  title: 'Multi-Hazard Composite Index Overview',
  color: '#F59E0B',
};

// ============================================================================
// KPI TILES (4 main KPIs)
// ============================================================================
export const KPI_TILES = {
  highExposureZones: {
    title: 'High Multi-Hazard Exposure Zones',
    subtitle: 'Combined Climate Hazard Hotspots',
  },
  buildings: {
    title: 'Buildings with Multi-Hazard Exposure',
    subtitle: 'Exposed to Multiple Hazards',
  },
  infrastructure: {
    title: 'Infra. & Services Exposed',
    subtitle: 'Under Compounded Hazard',
  },
  roadNetwork: {
    title: 'Road Network with Multi-Hazard Exposure',
    subtitle: 'Exposed to Multiple Hazards',
  },
};

// ============================================================================
// SUB-LAYER OVERVIEW HEADERS
// ============================================================================
export const SUB_LAYER_HEADERS = {
  heatflood: 'Heat-Flood Combined Overview',
  heatair: 'Heat-Air Combined Overview',
};

// ============================================================================
// IMPACT DISTRIBUTION CHART
// ============================================================================
export const IMPACT_DISTRIBUTION = {
  sectionTitle: 'Impact Distribution by Multi-Hazard Level',
  chartTitle: 'Multi-Hazard Impact Distribution',
  loadingText: 'Loading impact data...',
  // ... existing code ...'
  errorText: 'Failed to load impact data',
  noDataText: 'No impact data available',
  // Legend labels (Multi-hazard impact categories)
  legend: {
    severeImpact: 'Severe Impact',
    significantImpact: 'Significant Impact',
    manageableImpact: 'Manageable Impact',
    minimalImpact: 'Minimal Impact',
  },
  // Row labels for the chart
  rowLabels: {
    area: 'Area Coverage',
    buildings: 'Buildings',
    infrastructure: 'Infrastructure',
    roads: 'Road Network',
  },
};

// ============================================================================
// DETAILED BREAKDOWN CHART
// ============================================================================
export const DETAILED_BREAKDOWN = {
  sectionTitle: 'Detailed Infrastructure Breakdown',
  chartTitle: 'Infrastructure Exposure by Type',
  loadingText: 'Loading breakdown data...',
  errorText: 'Failed to load breakdown data',
  noDataText: 'No breakdown data available',
  // Infrastructure category labels
  categories: {
    education: 'Education',
    healthcare: 'Healthcare',
    publicAmenities: 'Public Amenities',
    transport: 'Transport',
  },
};

// ============================================================================
// ROAD NETWORK HAZARD ANALYSIS
// ============================================================================
export const ROAD_NETWORK_ANALYSIS = {
  sectionTitle: 'Road Network Multi Hazard Analysis',
  loadingText: 'Loading road network data...',
  loadingDescription: 'Computing road-level multi-hazard exposure',
  errorText: 'Failed to load road network data',
  noDataText: 'No road network data available',
  chartTitle: 'Road Network by Multi-Hazard Level',
  // Road type labels
  roadTypes: {
    national: 'National Highways',
    state: 'State Highways',
    major: 'Major Roads',
    minor: 'Minor Roads',
    arterial: 'Arterial Roads',
    collector: 'Collector Roads',
    local: 'Local Roads',
  },
  // Multi-hazard level labels
  hazardLevels: {
    severeImpact: 'Severe Impact',
    significantImpact: 'Significant Impact',
    manageableImpact: 'Manageable Impact',
    minimalImpact: 'Minimal Impact',
  },
};

// ============================================================================
// LOADING & ERROR STATES
// ============================================================================
export const LOADING_STATES = {
  kpi: {
    loadingText: 'Loading KPIs...',
  },
  chart: {
    loadingText: 'Loading chart data...',
  },
  general: {
    loadingText: 'Loading...',
  },
};

export const ERROR_STATES = {
  kpi: {
    errorText: 'Failed to load KPI data',
  },
  chart: {
    errorText: 'Failed to load chart data',
  },
  general: {
    errorText: 'An error occurred',
  },
};