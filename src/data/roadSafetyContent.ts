/**
 * ROAD SAFETY (iRAP) - Right Panel Content Configuration
 * 
 * This file contains ALL text content for the Road Safety iRAP analysis in the right panel.
 * Edit any text here to update the dashboard instantly.
 * Content is organized top-to-bottom matching the right panel layout.
 */

// ============================================================================
// MAIN SECTION HEADER
// ============================================================================
export const SECTION_HEADER = {
  title: 'Road Safety Analysis (iRAP)',
  color: '#EF4444',
};

// ============================================================================
// KPI TILES (Road Safety Star Ratings)
// ============================================================================
export const KPI_TILES = {
  safeRoads: {
    title: 'Safe Roads (3-5 ★)',
    subtitle: 'Safe',
  },
  unsafeRoads: {
    title: 'Unsafe Roads (1-2 ★)',
    subtitle: 'Unsafe',
  },
};

// ============================================================================
// VEHICLE TYPE TABS
// ============================================================================
export const VEHICLE_TYPES = {
  vehicle: {
    label: 'Vehicle',
    icon: 'Car',
  },
  pedestrian: {
    label: 'Pedestrian',
    icon: 'User',
  },
  motorcycle: {
    label: 'Motorcycle',
    icon: 'Bike',
  },
  bicycle: {
    label: 'Bicycle',
    icon: 'Bike',
  },
};

// ============================================================================
// STAR RATING LABELS
// ============================================================================
export const STAR_RATINGS = {
  '5star': {
    label: '5 Star',
    description: 'Safest',
    color: '#93c060',
  },
  '4star': {
    label: '4 Star',
    description: 'Safe',
    color: '#fdf05e',
  },
  '3star': {
    label: '3 Star',
    description: 'Moderate',
    color: '#eda308',
  },
  '2star': {
    label: '2 Star',
    description: 'Unsafe',
    color: '#e65336',
  },
  '1star': {
    label: '1 Star',
    description: 'Very Unsafe',
    color: '#d12d27',
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
  chartTitle: 'Road Network by Hazard Level',
  // Note about backend caching
  cacheNote: {
    title: 'Backend Processing',
    description: 'The backend caches results, so subsequent requests are instant',
  },
};

// ============================================================================
// ROAD SAFETY HAZARD ANALYSIS
// ============================================================================
export const ROAD_SAFETY_ANALYSIS = {
  sectionTitle: 'Road Safety Hazard Analysis',
  loadingText: 'Loading road safety analysis...',
  loadingDescription: 'Computing road-level hazard exposure',
  errorText: 'Failed to load road safety data',
  noDataText: 'No road safety data available',
  chartTitle: 'Road Safety by Star Rating',
};

// ============================================================================
// FILTER PANEL
// ============================================================================
export const FILTER_PANEL = {
  title: 'Filter Road Safety Data',
  description: 'Apply filters to analyze specific road segments',
  clearFiltersButton: 'Clear All Filters',
  applyFiltersButton: 'Apply Filters',
  
  // Filter labels
  filters: {
    vehicleType: {
      label: 'Vehicle Type',
      options: {
        vehicle: 'Vehicle',
        motorcycle: 'Motorcycle',
        pedestrian: 'Pedestrian',
        bicyclist: 'Bicycle',
      },
    },
    ward: {
      label: 'Ward',
      placeholder: 'Select ward...',
    },
    roadName: {
      label: 'Road Name',
      placeholder: 'Select road...',
    },
    starRating: {
      label: 'Star Rating',
      options: {
        '1': '1 Star',
        '2': '2 Star',
        '3': '3 Star',
        '4': '4 Star',
        '5': '5 Star',
      },
    },
    roadClass: {
      label: 'Road Class',
      placeholder: 'Select road class...',
    },
  },
  
  // Loading state
  loadingFilters: 'Loading filter options...',
  
  // Active filters badge
  activeFiltersBadge: {
    label: 'Active Filters',
    count: '{count} applied',
  },
};

// ============================================================================
// STAR RATING DISTRIBUTION CHART
// ============================================================================
export const STAR_RATING_CHART = {
  title: 'Road Safety Star Rating Distribution',
  subtitle: 'Total road length by star rating',
  loadingText: 'Loading star ratings...',
  errorText: 'Failed to load star rating data',
  noDataText: 'No star rating data available',
  // Axis labels
  xAxisLabel: 'Road Length (km)',
  yAxisLabel: 'Star Rating',
  // Legend
  legendTitle: 'Star Rating',
  // Tooltip
  tooltipFormat: '{value} km',
};

// ============================================================================
// ROAD TYPE BREAKDOWN CHART
// ============================================================================
export const ROAD_TYPE_CHART = {
  title: 'Road Type Breakdown',
  subtitle: 'Road safety by road classification',
  loadingText: 'Loading road types...',
  errorText: 'Failed to load road type data',
  noDataText: 'No road type data available',
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
};

// ============================================================================
// HAZARD EXPOSURE CHART (for road safety within hazard context)
// ============================================================================
export const HAZARD_EXPOSURE_CHART = {
  title: 'Road Safety within Hazard Zones',
  subtitle: 'Star ratings across different hazard levels',
  loadingText: 'Loading hazard exposure...',
  errorText: 'Failed to load hazard exposure data',
  noDataText: 'No hazard exposure data available',
  // Hazard level labels
  hazardLevels: {
    extreme: 'Extreme Hazard',
    high: 'High Hazard',
    moderate: 'Moderate Hazard',
    low: 'Low Hazard',
  },
};

// ============================================================================
// LOADING & ERROR STATES
// ============================================================================
export const LOADING_STATES = {
  starRatings: {
    loadingText: 'Loading star ratings...',
  },
  roadNetwork: {
    loadingText: 'Loading road network...',
  },
  filters: {
    loadingText: 'Loading filters...',
  },
  general: {
    loadingText: 'Loading...',
  },
};

export const ERROR_STATES = {
  starRatings: {
    errorText: 'Failed to load star ratings',
  },
  roadNetwork: {
    errorText: 'Failed to load road network data',
  },
  filters: {
    errorText: 'Failed to load filter options',
  },
  general: {
    errorText: 'An error occurred',
  },
};
