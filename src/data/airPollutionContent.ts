/**
 * AIR POLLUTION SECTOR - Right Panel Content Configuration
 * 
 * This file contains ALL text content for the Air Pollution right panel.
 * Edit any text here to update the dashboard instantly.
 * Content is organized top-to-bottom matching the right panel layout.
 */

// ============================================================================
// SCENARIO INFO CARD (Top of panel)
// ============================================================================
export const SCENARIO_INFO = {
  title: 'Baseline Scenario',
  description: 'Based on Air Quality Index | Dec–Feb (2025)',
  referenceYearLabel: 'Reference Year:',
  referenceYear: '2025',
};

// ============================================================================
// MAIN SECTION HEADER
// ============================================================================
export const SECTION_HEADER = {
  title: 'Air Quality Index (AQI) Overview',
  color: '#9C27B0',
};

// ============================================================================
// KPI TILES (4 main KPIs)
// ============================================================================
export const KPI_TILES = {
  poorSevereAreas: {
    title: 'Poor–Severe AQI Areas',
    subtitle: 'Unhealthy Air Quality',
  },
  buildings: {
    title: 'Buildings Exposed',
    subtitle: 'Exposed to Poor Air',
  },
  infrastructure: {
    title: 'Infra. & Services Affected',
    subtitle: 'Exposed to Poor Air',
  },
  roadNetwork: {
    title: 'Road Network Exposed',
    subtitle: 'Exposed to Poor Air',
  },
};

// ============================================================================
// SUB-LAYER OVERVIEW HEADERS
// ============================================================================
export const SUB_LAYER_HEADERS = {
  no2: 'NO₂ (Nitrogen Dioxide) Overview',
  so2: 'SO₂ (Sulfur Dioxide) Overview',
  co: 'CO (Carbon Monoxide) Overview',
  pm10: 'PM₁₀ (Particulate Matter) Overview',
  pm25: 'PM₂.₅ (Particulate Matter) Overview',
  o3: 'O₃ (Ozone) Overview',
};

// ============================================================================
// IMPACT DISTRIBUTION CHART
// ============================================================================
export const IMPACT_DISTRIBUTION = {
  sectionTitle: 'Impact Distribution by AQI Level',
  chartTitle: 'AQI Impact Distribution',
  loadingText: 'Loading impact data...',
  errorText: 'Failed to load impact data',
  noDataText: 'No impact data available',
  // Legend labels (AQI categories)
  legend: {
    hazardous: 'Hazardous',
    veryUnhealthy: 'Very Unhealthy',
    unhealthy: 'Unhealthy',
    unhealthySensitive: 'Unhealthy for Sensitive Groups',
    moderate: 'Moderate',
    good: 'Good',
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
  sectionTitle: 'Road Network Hazard Analysis',
  loadingText: 'Loading road network data...',
  loadingDescription: 'Computing road-level hazard exposure',
  errorText: 'Failed to load road network data',
  noDataText: 'No road network data available',
  chartTitle: 'Road Network by AQI Level',
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
  // AQI level labels
  aqiLevels: {
    hazardous: 'Hazardous',
    veryUnhealthy: 'Very Unhealthy',
    unhealthy: 'Unhealthy',
    unhealthySensitive: 'Unhealthy for Sensitive',
    moderate: 'Moderate',
    good: 'Good',
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