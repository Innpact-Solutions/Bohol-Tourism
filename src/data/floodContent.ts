/**
 * FLOOD SECTOR - Right Panel Content Configuration
 * 
 * This file contains ALL text content for the Flood right panel.
 * Edit any text here to update the dashboard instantly.
 * Content is organized top-to-bottom matching the right panel layout.
 */

// ============================================================================
// SCENARIO INFO CARD (Top of panel)
// ============================================================================
export const SCENARIO_INFO = {
  title: 'Baseline Scenario',
  description: 'Based on Urban Flooding Index | 2015–2025',
  referenceYearLabel: 'Reference Year:',
  referenceYear: 'Historical Events',
};

// ============================================================================
// MAIN SECTION HEADER
// ============================================================================
export const SECTION_HEADER = {
  title: 'Urban Flooding Overview',
  color: '#3B82F6',
};

// ============================================================================
// KPI TILES (4 main KPIs)
// ============================================================================
export const KPI_TILES = {
  floodProneAreas: {
    title: 'Flood-Prone Areas',
    subtitle: 'High Flood Susceptibility',
  },
  buildings: {
    title: 'Buildings Exposed to Flood',
    subtitle: 'In Flood-Prone Areas',
  },
  infrastructure: {
    title: 'Infra. & Services Affected',
    subtitle: 'In Flood-Prone Areas',
  },
  roadNetwork: {
    title: 'Road Network Affected',
    subtitle: 'In Flood-Prone Areas',
  },
};

// ============================================================================
// SUB-LAYER OVERVIEW HEADERS
// ============================================================================
export const SUB_LAYER_HEADERS = {
  susceptibility: 'Flood Susceptibility Overview',
  waterlogging: 'Waterlogging Risk Overview',
};

// ============================================================================
// IMPACT DISTRIBUTION CHART
// ============================================================================
export const IMPACT_DISTRIBUTION = {
  sectionTitle: 'Impact Distribution by Flood Risk',
  chartTitle: 'Urban Flooding Impact Distribution',
  loadingText: 'Loading impact data...',
  errorText: 'Failed to load impact data',
  noDataText: 'No impact data available',
  // Legend labels (Flood risk categories)
  legend: {
    highRisk: 'High Flood Risk',
    susceptible: 'Flood Susceptible',
    waterlogging: 'Waterlogging Risk',
    noRisk: 'No Flood Risk',
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
  sectionTitle: 'Road Network Flood Analysis',
  loadingText: 'Loading road network data...',
  loadingDescription: 'Computing road-level flood exposure',
  errorText: 'Failed to load road network data',
  noDataText: 'No road network data available',
  chartTitle: 'Road Network by Flood Risk',
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
  // Flood risk level labels
  floodLevels: {
    highRisk: 'High Flood Risk',
    susceptible: 'Flood Susceptible',
    waterlogging: 'Waterlogging Risk',
    noRisk: 'No Risk',
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