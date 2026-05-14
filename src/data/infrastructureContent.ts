/**
 * INFRASTRUCTURE LAYERS - Right Panel Content Configuration
 * 
 * This file contains ALL text content for Infrastructure layers (Education, Healthcare, Public Amenities, Transport).
 * Edit any text here to update the dashboard instantly.
 * Content is organized top-to-bottom matching the right panel layout.
 */

// ============================================================================
// EDUCATION LAYER
// ============================================================================
export const EDUCATION = {
  // Main section header
  sectionHeader: {
    title: 'Education Facilities Overview',
    color: '#2563EB',
  },
  
  // KPI tiles
  kpiTiles: {
    selectedFacilities: {
      title: 'Selected Facilities',
      subtitle: 'Educational institutions',
    },
    hazardExposure: {
      title: 'Hazard Exposure',
      // subtitle is dynamic: "X in Extreme, Y in High Hazard"
    },
    totalFacilities: {
      title: 'Total Facilities',
      subtitle: 'Educational institutions',
    },
    highExposure: {
      title: 'High Exposure',
      subtitle: 'High heat zones',
    },
    highHazardExposure: {
      title: 'High Hazard Exposure',
      subtitle: 'Severe climate hazard exposure',
    },
  },
  
  // Sub-layer names
  subLayers: {
    school: 'Schools',
    college: 'Colleges',
    kindergarten: 'Kindergartens',
  },
  
  // Charts
  charts: {
    distribution: {
      title: 'Education Facilities by Hazard Level',
      loadingText: 'Loading distribution...',
      errorText: 'Failed to load data',
    },
  },
};

// ============================================================================
// HEALTHCARE LAYER
// ============================================================================
export const HEALTHCARE = {
  // Main section header
  sectionHeader: {
    title: 'Healthcare Facilities Overview',
    color: '#DC2626',
  },
  
  // KPI tiles
  kpiTiles: {
    selectedFacilities: {
      title: 'Selected Facilities',
      subtitle: 'Healthcare centers',
    },
    hazardExposure: {
      title: 'Hazard Exposure',
      // subtitle is dynamic: "X in Extreme, Y in High Hazard"
    },
    totalFacilities: {
      title: 'Total Facilities',
      subtitle: 'Healthcare centers',
    },
    highExposure: {
      title: 'High Exposure',
      subtitle: 'Requiring intervention',
    },
    highHazardExposure: {
      title: 'High Hazard Exposure',
      subtitle: 'Severe climate hazard exposure',
    },
  },
  
  // Sub-layer names
  subLayers: {
    hospital: 'Hospitals',
    healthCentre: 'Health Centres',
    nursingHome: 'Nursing Homes',
  },
  
  // Charts
  charts: {
    distribution: {
      title: 'Healthcare Facilities by Hazard Level',
      loadingText: 'Loading distribution...',
      errorText: 'Failed to load data',
    },
  },
};

// ============================================================================
// PUBLIC AMENITIES LAYER
// ============================================================================
export const PUBLIC_AMENITIES = {
  // Main section header
  sectionHeader: {
    title: 'Public Amenities Overview',
    color: '#059669',
  },
  
  // KPI tiles
  kpiTiles: {
    selectedFacilities: {
      title: 'Selected Facilities',
      subtitle: 'Public amenities',
    },
    hazardExposure: {
      title: 'Hazard Exposure',
      // subtitle is dynamic: "X in Extreme, Y in High Hazard"
    },
    totalFacilities: {
      title: 'Total Facilities',
      subtitle: 'Public amenities',
    },
    highHazardExposure: {
      title: 'High Hazard Exposure',
      subtitle: 'Severe climate hazard exposure',
    },
  },
  
  // Sub-layer names
  subLayers: {
    communityCentre: 'Community Centres',
    cultureCentre: 'Culture Centres',
    fireStation: 'Fire Stations',
    governmentBuildings: 'Government Buildings',
    park: 'Parks',
    petrolPump: 'Petrol Pumps',
    playgroundStadium: 'Playgrounds/Stadiums',
    policeOutpost: 'Police Outposts',
    religious: 'Religious Places',
    telephoneExchange: 'Telephone Exchanges',
    haatMarket: 'Haat/Markets',
    vendingZones: 'Vending Zones',
  },
  
  // Charts
  charts: {
    distribution: {
      title: 'Public Amenities by Hazard Level',
      loadingText: 'Loading distribution...',
      errorText: 'Failed to load data',
    },
  },
};

// ============================================================================
// TRANSPORT LAYER
// ============================================================================
export const TRANSPORT = {
  // Main section header
  sectionHeader: {
    title: 'Transport Hubs Overview',
    color: '#7C3AED',
  },
  
  // KPI tiles
  kpiTiles: {
    selectedFacilities: {
      title: 'Selected Facilities',
      subtitle: 'Transport facilities',
    },
    hazardExposure: {
      title: 'Hazard Exposure',
      // subtitle is dynamic: "X in Extreme, Y in High Hazard"
    },
    totalHubs: {
      title: 'Total Hubs',
      subtitle: 'Transport facilities',
    },
    highHazardExposure: {
      title: 'High Hazard Exposure',
      subtitle: 'Severe climate hazard exposure',
    },
  },
  
  // Sub-layer names
  subLayers: {
    airport: 'Airports',
    busTerminal: 'Bus Terminals',
    busStop: 'Bus Stops',
    evCharging: 'EV Charging Stations',
    railwayStation: 'Railway Stations',
  },
  
  // Charts
  charts: {
    distribution: {
      title: 'Transport Hubs by Hazard Level',
      loadingText: 'Loading distribution...',
      errorText: 'Failed to load data',
    },
  },
};

// ============================================================================
// WARD ANALYTICS
// ============================================================================
export const WARD_ANALYTICS = {
  // Section header
  sectionHeader: {
    title: 'Ward Analytics',
    color: '#2563EB',
  },
  
  // Main KPIs
  mainKpis: {
    wardArea: {
      title: 'Ward Area',
      subtitle: 'High Heat Stress',
    },
    population: {
      title: 'Population',
      subtitle: 'Residents Affected',
    },
    buildings: {
      title: 'Buildings',
      subtitle: 'Exposed Structures',
    },
    infraPublicServices: {
      title: 'Infra. & Public Services',
      subtitle: 'Critical Facilities',
    },
  },
  
  // Ward-specific infrastructure KPIs
  education: {
    selectedFacilities: {
      title: 'Selected Facilities',
      subtitle: 'Facilities',
    },
    hazardExposure: {
      title: 'Hazard Exposure',
      // subtitle is dynamic
    },
    inWard: {
      title: 'In Ward',
      subtitle: 'Facilities',
    },
    highRisk: {
      title: 'High Risk',
      subtitle: 'Critical exposure',
    },
  },
  
  healthcare: {
    selectedFacilities: {
      title: 'Selected Facilities',
      subtitle: 'Facilities',
    },
    hazardExposure: {
      title: 'Hazard Exposure',
      // subtitle is dynamic
    },
    inWard: {
      title: 'In Ward',
      subtitle: 'Facilities',
    },
    highRisk: {
      title: 'High Risk',
      subtitle: 'Critical exposure',
    },
  },
  
  publicAmenities: {
    selectedFacilities: {
      title: 'Selected Facilities',
      subtitle: 'Facilities',
    },
    hazardExposure: {
      title: 'Hazard Exposure',
      // subtitle is dynamic
    },
    inWard: {
      title: 'In Ward',
      subtitle: 'Facilities',
    },
    highRisk: {
      title: 'High Risk',
      subtitle: 'Critical exposure',
    },
  },
  
  transport: {
    selectedFacilities: {
      title: 'Selected Facilities',
      subtitle: 'Facilities',
    },
    hazardExposure: {
      title: 'Hazard Exposure',
      // subtitle is dynamic
    },
    inWard: {
      title: 'In Ward',
      subtitle: 'Facilities',
    },
    highRisk: {
      title: 'High Risk',
      subtitle: 'Critical exposure',
    },
  },
};

// ============================================================================
// LOADING & ERROR STATES
// ============================================================================
export const LOADING_STATES = {
  facilities: {
    loadingText: 'Loading facilities...',
  },
  exposure: {
    loadingText: 'Calculating hazard exposure...',
  },
  general: {
    loadingText: 'Loading...',
  },
};

export const ERROR_STATES = {
  facilities: {
    errorText: 'Failed to load facilities',
  },
  exposure: {
    errorText: 'Failed to calculate exposure',
  },
  general: {
    errorText: 'An error occurred',
  },
};
