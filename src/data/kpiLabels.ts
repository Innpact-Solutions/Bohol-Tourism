/**
 * Centralized KPI Labels Configuration
 * All KPI titles and subtitles are managed here for easy updates
 * Update any text in this file to reflect changes across the dashboard
 */

export const KPI_LABELS = {
  // ============================================================================
  // ROAD SAFETY SECTOR
  // ============================================================================
  roadSafety: {
    safeRoads: {
      id: 'road_safe_roads',
      title: 'Safe Roads (3-5 ★)',
      subtitle: 'Safe',
    },
    unsafeRoads: {
      id: 'road_unsafe_roads',
      title: 'Unsafe Roads (1-2 ★)',
      subtitle: 'Unsafe',
    },
  },

  // ============================================================================
  // HEAT STRESS SECTOR
  // ============================================================================
  heatStress: {
    hotspots: {
      id: 'heat_hotspots',
      title: 'Heat Stress Hotspotsss',
      subtitle: 'High & Severe Heat Hazard',
    },
    buildingsExposed: {
      id: 'heat_buildings',
      title: 'Buildings Exposed',
      subtitle: 'Under Heat Stress',
    },
    infraServicesAffected: {
      id: 'heat_infra',
      title: 'Infra. & Services Affected',
      subtitle: 'Facilities Affected',
    },
    roadNetworkExposed: {
      id: 'heat_roads',
      title: 'Road Network Exposed',
      subtitle: 'Under Heat Hazard',
    },
  },

  // ============================================================================
  // AIR POLLUTION SECTOR
  // ============================================================================
  airPollution: {
    poorSevereAQI: {
      id: 'air_aqi_areas',
      title: 'Poor–Severe AQI Areas',
      subtitle: 'Unhealthy Air Quality',
    },
    buildingsExposed: {
      id: 'air_buildings',
      title: 'Buildings Exposed',
      subtitle: 'Exposed to Poor Air',
    },
    infraServicesAffected: {
      id: 'air_infra',
      title: 'Infra. & Services Affected',
      subtitle: 'In Polluted Zones',
    },
    roadNetworkExposed: {
      id: 'air_roads',
      title: 'Road Network Exposed',
      subtitle: 'In Poor AQI Areas',
    },
  },

  // ============================================================================
  // FLOOD SECTOR
  // ============================================================================
  flood: {
    floodProneAreas: {
      id: 'flood_prone_areas',
      title: 'Flood-Prone Areas',
      subtitle: 'High Flood Susceptibility',
    },
    buildingsExposed: {
      id: 'flood_buildings',
      title: 'Buildings Exposed to Flood',
      subtitle: 'In Flood-Prone Areas',
    },
    infraServicesAffected: {
      id: 'flood_infra',
      title: 'Infra. & Services Affected',
      subtitle: 'Under Flood Hazard',
    },
    roadNetworkAffected: {
      id: 'flood_roads',
      title: 'Road Network Affected',
      subtitle: 'Prone to Inundation',
    },
  },

  // ============================================================================
  // MULTI-HAZARD SECTOR
  // ============================================================================
  multiHazard: {
    highExposureZones: {
      id: 'multi_exposure_zones',
      title: 'High Multi-Hazard Exposure Zones',
      subtitle: 'Combined Climate Hazard Hotspots',
    },
    buildingsExposed: {
      id: 'multi_buildings',
      title: 'Buildings with Multi-Hazard Exposure',
      subtitle: 'Exposed to Multiple Hazards',
    },
    infraServicesExposed: {
      id: 'multi_infra',
      title: 'Infra. & Services Exposed',
      subtitle: 'Under Compounded Hazard',
    },
    roadNetworkExposed: {
      id: 'multi_roads',
      title: 'Road Network with Multi-Hazard Exposure',
      subtitle: 'Exposed to Multiple Hazards',
    },
  },

  // ============================================================================
  // INFRASTRUCTURE LAYERS - EDUCATION
  // ============================================================================
  education: {
    selectedFacilities: {
      id: 'edu_selected_facilities',
      title: 'Selected Facilities',
      subtitle: 'Educational institutions',
    },
    hazardExposure: {
      id: 'edu_hazard_exposure',
      title: 'Hazard Exposure',
      // subtitle is dynamic: "X in Extreme, Y in High Hazard" or "No Hazard Data"
    },
    totalFacilities: {
      id: 'edu_total_facilities',
      title: 'Total Facilities',
      subtitle: 'Educational institutions',
    },
    highExposureScenario: {
      id: 'edu_high_exposure_scenario',
      title: 'High Exposure',
      subtitle: 'High heat zones',
    },
    highHazardExposure: {
      id: 'edu_high_hazard_exposure',
      title: 'High Hazard Exposure',
      subtitle: 'Severe climate hazard exposure',
    },
  },

  // ============================================================================
  // INFRASTRUCTURE LAYERS - HEALTHCARE
  // ============================================================================
  healthcare: {
    selectedFacilities: {
      id: 'health_selected_facilities',
      title: 'Selected Facilities',
      subtitle: 'Healthcare centers',
    },
    hazardExposure: {
      id: 'health_hazard_exposure',
      title: 'Hazard Exposure',
      // subtitle is dynamic: "X in Extreme, Y in High Hazard" or "No Hazard Data"
    },
    totalFacilities: {
      id: 'health_total_facilities',
      title: 'Total Facilities',
      subtitle: 'Healthcare centers',
    },
    highExposureScenario: {
      id: 'health_high_exposure_scenario',
      title: 'High Exposure',
      subtitle: 'Requiring intervention',
    },
    highHazardExposure: {
      id: 'health_high_hazard_exposure',
      title: 'High Hazard Exposure',
      subtitle: 'Severe climate hazard exposure',
    },
  },

  // ============================================================================
  // INFRASTRUCTURE LAYERS - PUBLIC AMENITIES
  // ============================================================================
  publicAmenities: {
    selectedFacilities: {
      id: 'amenity_selected_facilities',
      title: 'Selected Facilities',
      subtitle: 'Public amenities',
    },
    hazardExposure: {
      id: 'amenity_hazard_exposure',
      title: 'Hazard Exposure',
      // subtitle is dynamic: "X in Extreme, Y in High Hazard" or "No Hazard Data"
    },
    totalFacilities: {
      id: 'amenity_total_facilities',
      title: 'Total Facilities',
      subtitle: 'Public amenities',
    },
    highHazardExposure: {
      id: 'amenity_high_hazard_exposure',
      title: 'High Hazard Exposure',
      subtitle: 'Severe climate hazard exposure',
    },
  },

  // ============================================================================
  // INFRASTRUCTURE LAYERS - TRANSPORT HUBS
  // ============================================================================
  transport: {
    selectedFacilities: {
      id: 'transport_selected_facilities',
      title: 'Selected Facilities',
      subtitle: 'Transport facilities',
    },
    hazardExposure: {
      id: 'transport_hazard_exposure',
      title: 'Hazard Exposure',
      // subtitle is dynamic: "X in Extreme, Y in High Hazard" or "No Hazard Data"
    },
    totalHubs: {
      id: 'transport_total_hubs',
      title: 'Total Hubs',
      subtitle: 'Transport facilities',
    },
    highHazardExposure: {
      id: 'transport_high_hazard_exposure',
      title: 'High Hazard Exposure',
      subtitle: 'Severe climate hazard exposure',
    },
  },

  // ============================================================================
  // WARD ANALYTICS - MAIN KPIS
  // ============================================================================
  wardAnalytics: {
    wardArea: {
      id: 'ward_area',
      title: 'Ward Area',
      subtitle: 'High Heat Stress',
    },
    population: {
      id: 'ward_population',
      title: 'Population',
      subtitle: 'Residents Affected',
    },
    buildings: {
      id: 'ward_buildings',
      title: 'Buildings',
      subtitle: 'Exposed Structures',
    },
    infraPublicServices: {
      id: 'ward_infra_services',
      title: 'Infra. & Public Services',
      subtitle: 'Critical Facilities',
    },
  },

  // ============================================================================
  // WARD ANALYTICS - EDUCATION IN WARD
  // ============================================================================
  wardEducation: {
    selectedFacilities: {
      id: 'ward_edu_selected',
      title: 'Selected Facilities',
      subtitle: 'Facilities',
    },
    hazardExposure: {
      id: 'ward_edu_hazard_exposure',
      title: 'Hazard Exposure',
      // subtitle is dynamic: "X in Extreme, Y in High Hazard" or "No Hazard Data"
    },
    inWard: {
      id: 'ward_edu_in_ward',
      title: 'In Ward',
      subtitle: 'Facilities',
    },
    highRisk: {
      id: 'ward_edu_high_risk',
      title: 'High Risk',
      subtitle: 'Critical exposure',
    },
  },

  // ============================================================================
  // WARD ANALYTICS - HEALTHCARE IN WARD
  // ============================================================================
  wardHealthcare: {
    selectedFacilities: {
      id: 'ward_health_selected',
      title: 'Selected Facilities',
      subtitle: 'Facilities',
    },
    hazardExposure: {
      id: 'ward_health_hazard_exposure',
      title: 'Hazard Exposure',
      // subtitle is dynamic: "X in Extreme, Y in High Hazard" or "No Hazard Data"
    },
    inWard: {
      id: 'ward_health_in_ward',
      title: 'In Ward',
      subtitle: 'Facilities',
    },
    highRisk: {
      id: 'ward_health_high_risk',
      title: 'High Risk',
      subtitle: 'Critical exposure',
    },
  },

  // ============================================================================
  // WARD ANALYTICS - PUBLIC AMENITIES IN WARD
  // ============================================================================
  wardPublicAmenities: {
    selectedFacilities: {
      id: 'ward_amenity_selected',
      title: 'Selected Facilities',
      subtitle: 'Facilities',
    },
    hazardExposure: {
      id: 'ward_amenity_hazard_exposure',
      title: 'Hazard Exposure',
      // subtitle is dynamic: "X in Extreme, Y in High Hazard" or "No Hazard Data"
    },
    inWard: {
      id: 'ward_amenity_in_ward',
      title: 'In Ward',
      subtitle: 'Facilities',
    },
    highRisk: {
      id: 'ward_amenity_high_risk',
      title: 'High Risk',
      subtitle: 'Critical exposure',
    },
  },

  // ============================================================================
  // WARD ANALYTICS - TRANSPORT HUBS IN WARD
  // ============================================================================
  wardTransport: {
    selectedFacilities: {
      id: 'ward_transport_selected',
      title: 'Selected Facilities',
      subtitle: 'Facilities',
    },
    hazardExposure: {
      id: 'ward_transport_hazard_exposure',
      title: 'Hazard Exposure',
      // subtitle is dynamic: "X in Extreme, Y in High Hazard" or "No Hazard Data"
    },
    inWard: {
      id: 'ward_transport_in_ward',
      title: 'In Ward',
      subtitle: 'Facilities',
    },
    highRisk: {
      id: 'ward_transport_high_risk',
      title: 'High Risk',
      subtitle: 'Critical exposure',
    },
  },
};

// ============================================================================
// HELPER FUNCTIONS FOR DYNAMIC SUBTITLES
// ============================================================================

/**
 * Generate dynamic hazard exposure subtitle
 * @param extreme - Count of facilities in extreme hazard
 * @param high - Count of facilities in high hazard
 * @returns Formatted subtitle string
 */
export function getHazardExposureSubtitle(extreme: number, high: number): string {
  if (extreme === 0 && high === 0) {
    return 'No Hazard Data';
  }
  return `${extreme} in Extreme, ${high} in High Hazard`;
}
