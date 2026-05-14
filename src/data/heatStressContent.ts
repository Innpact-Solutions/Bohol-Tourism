/**
 * HEAT STRESS SECTOR - Right Panel Content Configuration
 *
 * This file contains ALL text content for the Heat Stress right panel.
 * Edit any text here to update the dashboard instantly.
 * Content is organized top-to-bottom matching the right panel layout.
 */

// ============================================================================
// SCENARIO INFO CARD (Top of panel)
// ============================================================================
export const SCENARIO_INFO = {
  baseline: {
    title: "Baseline Scenario",
    description:
      "LST-Based Heat Hotspots | Top 10 Days , 2025",
    referenceYearLabel: "Reference Year:",
    referenceYear: "2025",
  },
  ssp1: {
    title: "SSP1-2040 (Sustainability)",
    description:
      "Low emissions pathway with sustainable development",
  },
  ssp2: {
    title: "SSP2-2040 (Middle Road)",
    description:
      "Moderate emissions pathway with mixed development",
  },
  ssp5: {
    title: "SSP5-2040 (Fossil-fueled)",
    description:
      "High emissions pathway with fossil fuel development",
  },
};

// ============================================================================
// MAIN SECTION HEADER
// ============================================================================
export const SECTION_HEADER = {
  title: "Project Area Overview",
  color: "#E3000F",
};

// ============================================================================
// KPI TILES (4 main KPIs)
// ============================================================================
export const KPI_TILES = {
  hotspots: {
    title: "Residential Buildings",
    subtitle: "Residential units",
  },
  buildings: {
    title: "Bulk & Non-Residential",
    subtitle: "Commercial & institutional sources",
  },
  infrastructure: {
    title: "Total Area",
    subtitle: "Planning coverage",
  },
  roadNetwork: {
    title: "Total Population",
    subtitle: "Total population as of 2024",
  },
};

// ============================================================================
// SUB-LAYER OVERVIEW HEADERS
// ============================================================================
export const SUB_LAYER_HEADERS = {
  lst: "Land Surface Temperature (LST) Overview",
  ast: "Air Surface Temperature (AST) Overview",
  rh: "Relative Humidity (RH) Overview",
  wbt: "Wet-Bulb Temperature (WBT) Overview",
  wbgt: "Wet-Bulb Globe Temperature (WBGT) Overview",
  uhi: "Urban Heat Island (UHI) Overview",
  ndvi: "NDVI Overview",
};

// ============================================================================
// SCENARIO PLANNING SECTION
// ============================================================================
export const SCENARIO_PLANNING = {
  sectionTitle: "Climate Scenario Planning",
  description:
    "Compare heat stress impacts across different climate scenarios",
  scenarioLabels: {
    baseline_2025: "2025 Baseline",
    ssp1_2040: "SSP1-2040 (Sustainability)",
    ssp2_2040: "SSP2-2040 (Middle Road)",
    ssp5_2040: "SSP5-2040 (Fossil-fueled)",
  },
  comparisonTitle: "Scenario Comparison",
  comparisonDescription:
    "Compare key metrics across climate scenarios",
};

// ============================================================================
// IMPACT DISTRIBUTION CHART
// ============================================================================
export const IMPACT_DISTRIBUTION = {
  sectionTitle: "Impact Distribution by Hazard Level",
  chartTitle: "Heat Stress Hazard Impact Distribution",
  loadingText: "Loading impact data...",
  errorText: "Failed to load impact data",
  noDataText: "No impact data available",
  // Legend labels
  legend: {
    extreme: "Extreme",
    high: "High",
    moderate: "Moderate",
    low: "Low",
  },
  // Row labels for the chart
  rowLabels: {
    area: "Area Coverage",
    buildings: "Buildings",
    infrastructure: "Infrastructure",
    roads: "Road Network",
  },
};

// ============================================================================
// DETAILED BREAKDOWN CHART
// ============================================================================
export const DETAILED_BREAKDOWN = {
  sectionTitle: "Detailed Infrastructure Breakdown",
  chartTitle: "Infrastructure Exposure by Type",
  loadingText: "Loading breakdown data...",
  errorText: "Failed to load breakdown data",
  noDataText: "No breakdown data available",
  // Infrastructure category labels
  categories: {
    education: "Education",
    healthcare: "Healthcare",
    publicAmenities: "Public Amenities",
    transport: "Transport",
  },
};

// ============================================================================
// ROAD NETWORK HAZARD ANALYSIS
// ============================================================================
export const ROAD_NETWORK_ANALYSIS = {
  sectionTitle: "Road Network Hazard Analysis",
  loadingText: "Loading road network data...",
  loadingDescription: "Computing road-level hazard exposure",
  errorText: "Failed to load road network data",
  noDataText: "No road network data available",
  chartTitle: "Road Network by Hazard Level",
  // Road type labels
  roadTypes: {
    national: "National Highways",
    state: "State Highways",
    major: "Major Roads",
    minor: "Minor Roads",
    arterial: "Arterial Roads",
    collector: "Collector Roads",
    local: "Local Roads",
  },
  // Hazard level labels
  hazardLevels: {
    extreme: "Extreme",
    high: "High",
    moderate: "Moderate",
    low: "Low",
  },
};

// ============================================================================
// ROAD SAFETY ANALYSIS (iRAP)
// ============================================================================
export const ROAD_SAFETY_ANALYSIS = {
  sectionTitle: "Road Safety Hazard Analysis",
  loadingText: "Loading road safety analysis...",
  loadingDescription: "Computing road-level hazard exposure",
  errorText: "Failed to load road safety data",
  noDataText: "No road safety data available",
  chartTitle: "Road Safety by Star Rating",
  // Star rating labels
  starRatings: {
    "5star": "5 Star - Safest",
    "4star": "4 Star - Safe",
    "3star": "3 Star - Moderate",
    "2star": "2 Star - Unsafe",
    "1star": "1 Star - Very Unsafe",
  },
  // Vehicle type labels (for filters)
  vehicleTypes: {
    vehicle: "Vehicle",
    motorcycle: "Motorcycle",
    pedestrian: "Pedestrian",
    bicycle: "Bicycle",
  },
};

// ============================================================================
// LOADING & ERROR STATES
// ============================================================================
export const LOADING_STATES = {
  kpi: {
    loadingText: "Loading KPIs...",
  },
  chart: {
    loadingText: "Loading chart data...",
  },
  general: {
    loadingText: "Loading...",
  },
};

export const ERROR_STATES = {
  kpi: {
    errorText: "Failed to load KPI data",
  },
  chart: {
    errorText: "Failed to load chart data",
  },
  general: {
    errorText: "An error occurred",
  },
};