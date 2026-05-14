import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Mountain, Droplets, Layers, AlertTriangle, Flame, Wind, Waves, Zap, Info, X, Home, Building2, Store, Users } from 'lucide-react';

/**
 * LayerAreaBreakdown Component
 * 
 * Displays donut chart with area distribution and quick facts for climate/environmental layers
 * 
 * GeoServer Configuration (for future real data connection):
 * - Base URL: https://geoserver.azure.innpact.ai/geoserver/
 * - Workspace: WorldBank_Bohol
 * - WFS Endpoint: https://geoserver.azure.innpact.ai/geoserver/WorldBank_Bohol/wfs
 * - Layer naming: PascalCase (e.g., SoilClassification, GroundwaterDepth)
 * - Expected fields: Type (category), color_code (HEX color), Shape_Area (sq meters)
 * - Filtering: BrgyName (barangay), MunName (municipality)
 * 
 * TODO: Enable real data fetch once CORS is configured on GeoServer
 */

interface LayerAreaBreakdownProps {
  layerId: string;
  layerName: string;
  selectedWardId?: string;
  selectedLguName?: string;
  selectedCategory?: string | null; // Selected category for map filtering
  onCategorySelect?: (category: string | null) => void; // Callback when category is clicked
  darkTheme?: boolean; // Match the dark panel style of BaseLayerDefaultPanel
}

interface AreaData {
  category: string;
  area: number;
  percentage: number;
  color: string;
  count?: number; // Number of features (used for building-level layers)
}

interface QuickFact {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}

// Layer configuration with colors and field names
const LAYER_CONFIG: Record<string, {
  fieldName: string;
  geoserverLayerName: string; // Actual GeoServer layer name
  areaField?: string; // Override the property used to sum area (defaults to Shape_Area)
  propertyNames?: string[]; // Optional list of properties to request (reduces payload)
  colors: Record<string, string>;
  gridcodeMap?: Record<number, { label: string; color: string }>; // for gridcode-based layers
  quickFacts: (data: AreaData[], totalArea: number) => QuickFact[];
}> = {
  soil_classification: {
    fieldName: 'Type',
    geoserverLayerName: 'SoilClassification',
    colors: {
      'San Miguel Clay': '#D2691E',
      'Faraon Clay': '#8B4513',
      'Bolinao Clay Loam': '#A0522D',
      'Lugo Clay': '#CD853F',
      'Hydrosol': '#4682B4'
    },
    quickFacts: (data, totalArea) => {
      const clayTypes = data.filter(d => d.category.includes('Clay'));
      const clayArea = clayTypes.reduce((sum, d) => sum + d.area, 0);
      const dominant = data.length > 0 ? data[0] : null;
      return [
        {
          icon: Mountain,
          label: 'Dominant Soil Type',
          value: dominant ? dominant.category : 'N/A',
          color: '#D2691E'
        },
        {
          icon: Info,
          label: 'Clay-Based Soils',
          value: `${((clayArea / totalArea) * 100).toFixed(1)}%`,
          color: '#8B4513'
        },
        {
          icon: Droplets,
          label: 'Septic System Impact',
          value: clayArea > totalArea * 0.5 ? 'High Retention' : 'Moderate',
          color: '#4682B4'
        }
      ];
    }
  },
  groundwater_depth: {
    fieldName: 'Depth',
    geoserverLayerName: 'GroundWater',
    colors: {
      '0-5 m': '#FF6B6B',
      '5-10 m': '#FFA07A',
      '10-15 m': '#FFD700',
      '15-20 m': '#90EE90',
      '20-25 m': '#87CEEB',
      '> 25 m': '#5F9EA0'
    },
    quickFacts: (data, totalArea) => {
      const shallow = data.filter(d => d.category === '0-5 m' || d.category === '5-10 m');
      const shallowArea = shallow.reduce((sum, d) => sum + d.area, 0);
      const deep = data.filter(d => d.category === '20-25 m' || d.category === '> 25 m');
      const deepArea = deep.reduce((sum, d) => sum + d.area, 0);
      return [
        {
          icon: AlertTriangle,
          label: 'Shallow Groundwater',
          value: `${((shallowArea / totalArea) * 100).toFixed(1)}%`,
          color: '#FF6B6B'
        },
        {
          icon: Droplets,
          label: 'Contamination Risk',
          value: shallowArea > totalArea * 0.3 ? 'High' : 'Moderate',
          color: '#FFA07A'
        },
        {
          icon: Info,
          label: 'Safe Depth Zones',
          value: `${((deepArea / totalArea) * 100).toFixed(1)}%`,
          color: '#5F9EA0'
        }
      ];
    }
  },
  geology: {
    fieldName: 'Type',
    geoserverLayerName: 'Geology',
    colors: {
      'Alluvial Deposits': '#DEB887',
      'Ubay Sandstone': '#D2B48C',
      'Carmen Formation': '#BC8F8F',
      'Maribojoc Limestone': '#C9A876'
    },
    quickFacts: (data, totalArea) => {
      const limestone = data.find(d => d.category.includes('Limestone'));
      const sandstone = data.find(d => d.category.includes('Sandstone'));
      const dominant = data.length > 0 ? data[0] : null;
      return [
        {
          icon: Layers,
          label: 'Dominant Formation',
          value: dominant ? dominant.category : 'N/A',
          color: '#BC8F8F'
        },
        {
          icon: AlertTriangle,
          label: 'Karst Features',
          value: limestone ? `${limestone.percentage.toFixed(1)}%` : '0%',
          color: '#C9A876'
        },
        {
          icon: Info,
          label: 'Infrastructure Stability',
          value: sandstone ? 'Moderate' : 'Variable',
          color: '#D2B48C'
        }
      ];
    }
  },
  sinkhole: {
    fieldName: 'gridcode',
    geoserverLayerName: 'Sinkhole', // ✅ WorldBank_Bohol:Sinkhole
    propertyNames: ['gridcode', 'color_code', 'Shape_Area'],
    gridcodeMap: {
      1: { label: 'Sinkhole Presence',     color: '#D95F0E' },
      2: { label: 'No Sinkhole Detected',  color: '#F0F0F0' },
    },
    colors: {
      'Sinkhole Presence':    '#D95F0E',
      'No Sinkhole Detected': '#F0F0F0',
    },
    quickFacts: (data, totalArea) => {
      const risk = data.filter(d => d.category === 'Sinkhole Presence');
      const riskArea = risk.reduce((sum, d) => sum + d.area, 0);
      return [
        {
          icon: AlertTriangle,
          label: 'Sinkhole Zones',
          value: `${((riskArea / totalArea) * 100).toFixed(1)}%`,
          color: '#D95F0E'
        },
        {
          icon: Info,
          label: 'Infrastructure Threat',
          value: riskArea > totalArea * 0.2 ? 'Significant' : riskArea > 0 ? 'Limited' : 'None',
          color: '#FDD835'
        },
        {
          icon: Layers,
          label: 'Monitoring Required',
          value: riskArea > 0 ? 'Yes' : 'No',
          color: '#C62828'
        }
      ];
    }
  },
  // CWIS Climate Hazard Layers
  flood_hazard: {
    fieldName: 'Type', // reads Type + color_code directly from GeoServer features
    geoserverLayerName: 'Flood', // ✅ CONNECTED: WorldBank_Bohol:Flood
    colors: {
      'Low':      '#73DFFF',
      'Moderate': '#00A9E6',
      'High':     '#004C73',
    },
    quickFacts: (data, totalArea) => {
      const floodArea = data.filter(d => d.category !== 'No Flood Area' && d.category !== 'No Flood');
      const floodTotal = floodArea.reduce((sum, d) => sum + d.area, 0);
      const highRisk = data.filter(d => d.category === 'High Flood Hazard' || d.category === 'Moderate Flood Hazard');
      const highRiskArea = highRisk.reduce((sum, d) => sum + d.area, 0);
      return [
        {
          icon: Waves,
          label: 'Flood-Prone Areas',
          value: `${((floodTotal / totalArea) * 100).toFixed(1)}%`,
          color: '#1FA9CF'
        },
        {
          icon: AlertTriangle,
          label: 'Septic Overflow Risk',
          value: highRiskArea > totalArea * 0.3 ? 'High' : 'Moderate',
          color: '#6EC5D8'
        },
        {
          icon: Droplets,
          label: 'CWIS Adaptation Need',
          value: highRiskArea > 0 ? 'Critical' : 'Low',
          color: '#BFDCEB'
        }
      ];
    }
  },
  storm_surge: {
    fieldName: 'Hazard',
    geoserverLayerName: 'StormSurge',
    colors: {
      'No Risk': '#FFFFD9',
      'Low': '#97D6B9',
      'Moderate': '#1F80B8',
      'High': '#081D58'
    },
    quickFacts: (data, totalArea) => {
      const highRisk = data.filter(d => d.category === 'High' || d.category === 'Moderate');
      const highRiskArea = highRisk.reduce((sum, d) => sum + d.area, 0);
      return [
        {
          icon: Waves,
          label: 'Coastal Exposure',
          value: `${((highRiskArea / totalArea) * 100).toFixed(1)}%`,
          color: '#081D58'
        },
        {
          icon: AlertTriangle,
          label: 'Infrastructure Damage Risk',
          value: highRiskArea > totalArea * 0.2 ? 'High' : 'Low',
          color: '#1F80B8'
        },
        {
          icon: Info,
          label: 'Saltwater Intrusion',
          value: highRiskArea > 0 ? 'Possible' : 'Unlikely',
          color: '#97D6B9'
        }
      ];
    }
  },
  urban_waterlogging: {
    fieldName: 'Risk',
    geoserverLayerName: 'UrbanWaterlogging',
    colors: {
      'No Risk': '#FFFFD9',
      'Low': '#97D6B9',
      'Moderate': '#1F80B8',
      'High': '#081D58'
    },
    quickFacts: (data, totalArea) => {
      const highRisk = data.filter(d => d.category === 'High' || d.category === 'Moderate');
      const highRiskArea = highRisk.reduce((sum, d) => sum + d.area, 0);
      return [
        {
          icon: Droplets,
          label: 'Waterlogging Zones',
          value: `${((highRiskArea / totalArea) * 100).toFixed(1)}%`,
          color: '#081D58'
        },
        {
          icon: AlertTriangle,
          label: 'Drainage Impact',
          value: highRiskArea > totalArea * 0.3 ? 'Severe' : 'Moderate',
          color: '#1F80B8'
        },
        {
          icon: Info,
          label: 'Sanitation Service',
          value: highRiskArea > 0 ? 'Disrupted' : 'Normal',
          color: '#97D6B9'
        }
      ];
    }
  },
  heat_stress_index: {
    fieldName: 'Type',
    geoserverLayerName: 'HS_HSI', // ✅ CONNECTED: WorldBank_Bohol:HS_HSI
    propertyNames: ['Type', 'Shape_Area', 'color_code'],
    colors: {
      'Low (HSI < 0.28)':           '#1a9850',
      'Moderate (HSI 0.28–0.38)':   '#fee08b',
      'High (HSI 0.38–0.50)':       '#fdae61',
      'Extreme (HSI ≥ 0.50)':        '#d73027',
    },
    quickFacts: (data, totalArea) => {
      const hot = data.filter(d => d.category.startsWith('High') || d.category.startsWith('Extreme'));
      const hotArea = hot.reduce((sum, d) => sum + d.area, 0);
      return [
        {
          icon: Flame,
          label: 'High / Extreme HSI Zones',
          value: `${((hotArea / totalArea) * 100).toFixed(1)}%`,
          color: '#d73027'
        },
        {
          icon: AlertTriangle,
          label: 'Worker Safety Impact',
          value: hotArea > totalArea * 0.3 ? 'Critical' : hotArea > 0 ? 'Moderate' : 'Low',
          color: '#fdae61'
        },
        {
          icon: Info,
          label: 'Heat Adaptation Need',
          value: hotArea > 0 ? 'Required' : 'Low Priority',
          color: '#fee08b'
        }
      ];
    }
  },
  land_surface_temperature: {
    fieldName: 'Type',
    geoserverLayerName: 'HS_LST', // ✅ CONNECTED: WorldBank_Bohol:HS_LST
    propertyNames: ['Type', 'Shape_Area', 'color_code'],
    colors: {
      'Cool (< 28°C)':         '#2c7bb6',
      'Mild (28–32°C)':        '#abd9e9',
      'Warm (32–36°C)':        '#ffffbf',
      'Hot (36–40°C)':         '#fdae61',
      'Very hot (40–45°C)':    '#f46d43',
      'Extreme (> 45°C)':      '#a50026',
    },
    quickFacts: (data, totalArea) => {
      const hotZones = data.filter(d => d.category.startsWith('Hot') || d.category.startsWith('Very hot') || d.category.startsWith('Extreme'));
      const hotArea = hotZones.reduce((sum, d) => sum + d.area, 0);
      return [
        {
          icon: Flame,
          label: 'Heat Stress Zones',
          value: `${((hotArea / totalArea) * 100).toFixed(1)}%`,
          color: '#a50026'
        },
        {
          icon: AlertTriangle,
          label: 'Worker Safety Impact',
          value: hotArea > totalArea * 0.3 ? 'High Risk' : hotArea > 0 ? 'Moderate' : 'Low',
          color: '#fdae61'
        },
        {
          icon: Info,
          label: 'Operation Timing',
          value: hotArea > 0 ? 'Adjust Schedule' : 'Normal',
          color: '#ffffbf'
        }
      ];
    }
  },
  urban_heat_island: {
    fieldName: 'Type',
    geoserverLayerName: 'HS_UHI', // ✅ CONNECTED: WorldBank_Bohol:HS_UHI
    propertyNames: ['Type', 'Shape_Area', 'color_code'],
    colors: {
      'Rural cool island (< -3°C)':       '#2166ac',
      'Slightly cooler (-3 to -1°C)':     '#67a9cf',
      'Neutral (-1 to +1°C)':             '#f7f7f7',
      'Weak UHI (+1 to +3°C)':            '#fddbc7',
      'Moderate UHI (+3 to +5°C)':        '#ef8a62',
      'Strong UHI (> +5°C)':              '#b2182b',
    },
    quickFacts: (data, totalArea) => {
      const uhi = data.filter(d => d.category.startsWith('Moderate UHI') || d.category.startsWith('Strong UHI'));
      const uhiArea = uhi.reduce((sum, d) => sum + d.area, 0);
      return [
        {
          icon: Flame,
          label: 'Urban Heat Islands',
          value: `${((uhiArea / totalArea) * 100).toFixed(1)}%`,
          color: '#b2182b'
        },
        {
          icon: AlertTriangle,
          label: 'FSM Worker Exposure',
          value: uhiArea > totalArea * 0.2 ? 'Critical' : uhiArea > 0 ? 'Moderate' : 'Low',
          color: '#ef8a62'
        },
        {
          icon: Info,
          label: 'Mitigation Need',
          value: uhiArea > 0 ? 'Required' : 'Low Priority',
          color: '#fddbc7'
        }
      ];
    }
  },
  wet_bulb_temperature: {
    fieldName: 'Type',
    geoserverLayerName: 'HS_WBT', // ✅ CONNECTED: WorldBank_Bohol:HS_WBT
    propertyNames: ['Type', 'Shape_Area', 'color_code'],
    colors: {
      'Safe (< 24°C)':                 '#2c7bb6',
      'Caution (24–27°C)':             '#abd9e9',
      'Extreme caution (27–30°C)':     '#ffffbf',
      'Danger (30–32°C)':              '#fdae61',
      'Extreme danger (32–35°C)':      '#d73027',
      'Survivability limit (> 35°C)':  '#67001f',
    },
    quickFacts: (data, totalArea) => {
      const dangerous = data.filter(d => d.category.startsWith('Danger') || d.category.startsWith('Extreme danger') || d.category.startsWith('Survivability'));
      const dangerArea = dangerous.reduce((sum, d) => sum + d.area, 0);
      return [
        {
          icon: Flame,
          label: 'Heat Stress Zones',
          value: `${((dangerArea / totalArea) * 100).toFixed(1)}%`,
          color: '#67001f'
        },
        {
          icon: AlertTriangle,
          label: 'Outdoor Work Risk',
          value: dangerArea > totalArea * 0.3 ? 'Extreme' : dangerArea > 0 ? 'High' : 'Low',
          color: '#fdae61'
        },
        {
          icon: Info,
          label: 'PPE Requirements',
          value: dangerArea > 0 ? 'Enhanced' : 'Standard',
          color: '#ffffbf'
        }
      ];
    }
  },
  // Data Layers
  elevation: {
    fieldName: 'ElevationRange',
    geoserverLayerName: 'Elevation',
    colors: {
      '0-10 m': '#1a5e3a',
      '10-25 m': '#3d8b59',
      '25-50 m': '#78b878',
      '50-100 m': '#b8d996',
      '100-200 m': '#e6f5b4',
      '> 200 m': '#ffffcc'
    },
    quickFacts: (data, totalArea) => {
      const lowLying = data.filter(d => d.category === '0-10 m' || d.category === '10-25 m');
      const lowArea = lowLying.reduce((sum, d) => sum + d.area, 0);
      const dominant = data.length > 0 ? data[0] : null;
      return [
        {
          icon: Mountain,
          label: 'Dominant Elevation',
          value: dominant ? dominant.category : 'N/A',
          color: '#78b878'
        },
        {
          icon: AlertTriangle,
          label: 'Low-Lying Areas',
          value: `${((lowArea / totalArea) * 100).toFixed(1)}%`,
          color: '#3d8b59'
        },
        {
          icon: Info,
          label: 'Drainage Challenge',
          value: lowArea > totalArea * 0.4 ? 'High' : 'Moderate',
          color: '#1a5e3a'
        }
      ];
    }
  },
  building_use: {
    fieldName: 'use_type',
    geoserverLayerName: 'Buildings',
    colors: {
      'Residential': '#EAB308',
      'Commercial': '#3B82F6',
      'Education': '#06B6D4',
      'Government & Civic': '#10B981',
      'Health': '#EF4444',
      'Religious': '#F97316'
    },
    quickFacts: (data, totalArea) => {
      const residential = data.find(d => d.category === 'Residential');
      const commercial = data.find(d => d.category === 'Commercial');
      const dominant = data.length > 0 ? data[0] : null;
      return [
        {
          icon: Home,
          label: 'Dominant Building Type',
          value: dominant ? dominant.category : 'N/A',
          color: '#EAB308'
        },
        {
          icon: Building2,
          label: 'Residential Share',
          value: residential ? `${residential.percentage.toFixed(1)}%` : '0%',
          color: '#EAB308'
        },
        {
          icon: Store,
          label: 'Commercial Share',
          value: commercial ? `${commercial.percentage.toFixed(1)}%` : '0%',
          color: '#3B82F6'
        }
      ];
    }
  },
  economic_vulnerability: {
    fieldName: 'econ_vuln',
    geoserverLayerName: 'Buildings',
    areaField: 'area_sqm',
    propertyNames: ['econ_vuln', 'area_sqm', 'MunName', 'BrgyName'],
    colors: {
      'Economically Vulnerable': '#DC2626',
      'Others': '#E5E7EB'
    },
    quickFacts: (data, totalArea) => {
      const vulnerable = data.find(d => d.category === 'Economically Vulnerable');
      const vulnerableArea = vulnerable?.area ?? 0;
      const vulnerablePct = totalArea > 0 ? (vulnerableArea / totalArea) * 100 : 0;
      const dominant = data.length > 0 ? data[0] : null;
      return [
        {
          icon: AlertTriangle,
          label: 'Economically Vulnerable Footprint',
          value: `${vulnerablePct.toFixed(1)}%`,
          color: '#DC2626'
        },
        {
          icon: Info,
          label: 'Dominant Category',
          value: dominant ? dominant.category : 'N/A',
          color: '#64748B'
        },
        {
          icon: Users,
          label: 'Priority Intervention',
          value: vulnerablePct > 30 ? 'Required' : 'Monitor',
          color: vulnerablePct > 30 ? '#DC2626' : '#0EA5E9'
        }
      ];
    }
  },
  groundwater_infiltration_vulnerability: {
    fieldName: 'Type',
    geoserverLayerName: 'GroundWater_Infiltration_Vulnerability',
    colors: {
      'Low':       '#a8e6cf',
      'Moderate':  '#ffd3b6',
      'High':      '#ff8b94',
      'Very High': '#c0392b',
    },
    quickFacts: (data, totalArea) => {
      const highRisk = data.filter(d => d.category === 'High' || d.category === 'Very High');
      const highRiskArea = highRisk.reduce((sum, d) => sum + d.area, 0);
      return [
        {
          icon: Droplets,
          label: 'High Infiltration Risk',
          value: `${((highRiskArea / totalArea) * 100).toFixed(1)}%`,
          color: '#ff8b94'
        },
        {
          icon: AlertTriangle,
          label: 'Contamination Risk',
          value: highRiskArea > totalArea * 0.3 ? 'High' : 'Moderate',
          color: '#ffd3b6'
        },
        {
          icon: Layers,
          label: 'Sanitation Constraint',
          value: highRiskArea > 0 ? 'Significant' : 'Low',
          color: '#a8e6cf'
        }
      ];
    }
  }
};

// Module-level cache: keyed by `${layerId}|${ward}|${lgu}`. Survives layer
// toggles within a session so re-visiting a layer is instantaneous.
const breakdownCache = new Map<string, { areaData: AreaData[]; totalArea: number }>();

export function LayerAreaBreakdown({ layerId, layerName, selectedWardId = 'all', selectedLguName, selectedCategory, onCategorySelect, darkTheme = false }: LayerAreaBreakdownProps) {
  const cacheKey = `${layerId}|${selectedWardId ?? 'all'}|${selectedLguName ?? 'all'}`;
  const cached = breakdownCache.get(cacheKey);
  const [areaData, setAreaData] = useState<AreaData[]>(cached?.areaData ?? []);
  const [totalArea, setTotalArea] = useState(cached?.totalArea ?? 0);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🌍 [LayerAreaBreakdown] Component mounted/updated:', { layerId, layerName, selectedWardId, selectedLguName });

    // Cache hit — hydrate state synchronously, skip the network round-trip.
    const hit = breakdownCache.get(cacheKey);
    if (hit) {
      setAreaData(hit.areaData);
      setTotalArea(hit.totalArea);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchRealData = async () => {
      setLoading(true);
      setError(null);

      try {
        const config = LAYER_CONFIG[layerId];
        console.log('🔍 [LayerAreaBreakdown] Layer config lookup:', { 
          layerId, 
          configFound: !!config,
          availableLayerIds: Object.keys(LAYER_CONFIG)
        });
        
        if (!config) {
          console.warn('⚠️ [LayerAreaBreakdown] Layer configuration not found for:', layerId);
          setError('Layer configuration not available');
          setLoading(false);
          return;
        }

        console.log('✅ [LayerAreaBreakdown] Config found:', {
          geoserverLayerName: config.geoserverLayerName,
          fieldName: config.fieldName,
          colorCount: Object.keys(config.colors).length
        });

        // Build GeoServer WFS request
        const baseUrl = 'https://geoserver.azure.innpact.ai/geoserver/WorldBank_Bohol/wfs';
        const params = new URLSearchParams({
          service: 'WFS',
          version: '2.0.0',
          request: 'GetFeature',
          typeName: `WorldBank_Bohol:${config.geoserverLayerName}`,
          outputFormat: 'application/json',
          srsName: 'EPSG:4326'
        });

        // Limit properties to reduce payload when configured
        if (config.propertyNames && config.propertyNames.length > 0) {
          params.append('propertyName', config.propertyNames.join(','));
        }

        // Add CQL filter for selected ward/LGU
        const filters: string[] = [];
        
        if (selectedWardId && selectedWardId !== 'all') {
          filters.push(`BrgyName='${selectedWardId}'`);
          console.log('🔍 [LayerAreaBreakdown] Adding ward filter:', selectedWardId);
        }
        
        if (selectedLguName && selectedLguName !== 'All Municipalities' && selectedLguName !== 'all') {
          filters.push(`MunName='${selectedLguName}'`);
          console.log('🔍 [LayerAreaBreakdown] Adding LGU filter:', selectedLguName);
        }

        if (filters.length > 0) {
          const cqlFilter = filters.join(' AND ');
          params.append('CQL_FILTER', cqlFilter);
          console.log('🔍 [LayerAreaBreakdown] CQL Filter applied:', cqlFilter);
        } else {
          console.log('🔍 [LayerAreaBreakdown] No filters applied (fetching all data)');
        }

        const url = `${baseUrl}?${params.toString()}`;
        console.log('🌍 [LayerAreaBreakdown] ========================================');
        console.log('🌍 [LayerAreaBreakdown] FETCHING FROM GEOSERVER');
        console.log('🌍 [LayerAreaBreakdown] Full URL:', url);
        console.log('🌍 [LayerAreaBreakdown] Layer:', `WorldBank_Bohol:${config.geoserverLayerName}`);
        console.log('🌍 [LayerAreaBreakdown] Expected field:', config.fieldName);
        console.log('🌍 [LayerAreaBreakdown] ========================================');

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          mode: 'cors'
        });

        console.log('📡 [LayerAreaBreakdown] Response received:');
        console.log('📡 [LayerAreaBreakdown] - Status:', response.status);
        console.log('📡 [LayerAreaBreakdown] - Status Text:', response.statusText);
        console.log('📡 [LayerAreaBreakdown] - OK:', response.ok);
        console.log('📡 [LayerAreaBreakdown] - Headers:', {
          contentType: response.headers.get('content-type'),
          contentLength: response.headers.get('content-length'),
          cors: response.headers.get('access-control-allow-origin')
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ [LayerAreaBreakdown] ========================================');
          console.error('❌ [LayerAreaBreakdown] SERVER ERROR RESPONSE');
          console.error('❌ [LayerAreaBreakdown] Status:', response.status, response.statusText);
          console.error('❌ [LayerAreaBreakdown] Error body:', errorText);
          console.error('❌ [LayerAreaBreakdown] ========================================');
          throw new Error(`GeoServer request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('📊 [LayerAreaBreakdown] ========================================');
        console.log('📊 [LayerAreaBreakdown] DATA RECEIVED FROM GEOSERVER');
        console.log('📊 [LayerAreaBreakdown] Total features:', data.features?.length || 0);
        console.log('📊 [LayerAreaBreakdown] Data type:', data.type);
        console.log('📊 [LayerAreaBreakdown] CRS:', data.crs);
        
        if (data.features && data.features.length > 0) {
          const firstFeature = data.features[0];
          console.log('📊 [LayerAreaBreakdown] First feature structure:');
          console.log('📊 [LayerAreaBreakdown] - Type:', firstFeature.type);
          console.log('📊 [LayerAreaBreakdown] - Geometry type:', firstFeature.geometry?.type);
          console.log('📊 [LayerAreaBreakdown] - Properties:', firstFeature.properties);
          console.log('📊 [LayerAreaBreakdown] - Available property keys:', Object.keys(firstFeature.properties || {}));
          
          // Check if our expected fields exist
          console.log('📊 [LayerAreaBreakdown] Field validation:');
          console.log('📊 [LayerAreaBreakdown] - Looking for field:', config.fieldName);
          console.log('📊 [LayerAreaBreakdown] - Field exists?', config.fieldName in (firstFeature.properties || {}));
          console.log('📊 [LayerAreaBreakdown] - Field value:', firstFeature.properties?.[config.fieldName]);
          console.log('📊 [LayerAreaBreakdown] - "Type" field exists?', 'Type' in (firstFeature.properties || {}));
          console.log('📊 [LayerAreaBreakdown] - "Type" value:', firstFeature.properties?.Type);
          console.log('📊 [LayerAreaBreakdown] - "Shape_Area" exists?', 'Shape_Area' in (firstFeature.properties || {}));
          console.log('📊 [LayerAreaBreakdown] - "Shape_Area" value:', firstFeature.properties?.Shape_Area);
          console.log('📊 [LayerAreaBreakdown] - "color_code" exists?', 'color_code' in (firstFeature.properties || {}));
          console.log('📊 [LayerAreaBreakdown] - "color_code" value:', firstFeature.properties?.color_code);
        }
        console.log('📊 [LayerAreaBreakdown] ========================================');

        if (!data.features || data.features.length === 0) {
          console.warn('⚠️ [LayerAreaBreakdown] No features returned');
          setError('No data available for selected area');
          setLoading(false);
          return;
        }

        // Process features to sum area by Type
        const areaByType: Record<string, { area: number; color: string; count: number }> = {};
        let processedCount = 0;
        let skippedCount = 0;

        console.log('🔄 [LayerAreaBreakdown] Processing features...');

        data.features.forEach((feature: any, index: number) => {
          const properties = feature.properties;
          let type: string;
          let color: string;

          if (config.gridcodeMap) {
            const gc = parseInt(
              properties.gridcode ?? properties.Gridcode ?? properties.GRIDCODE ?? '0',
              10
            );
            const mapped = config.gridcodeMap[gc];
            if (!mapped) { skippedCount++; return; } // skip unmapped gridcodes (e.g. 0 = no hazard)
            type = mapped.label;
            color = mapped.color;
          } else {
            type = properties[config.fieldName] || properties.Type;
            color = properties.color_code || config.colors[type] || '#999999';
          }

          const areaFieldName = config.areaField ?? 'Shape_Area';
          const area = parseFloat(
            properties[areaFieldName] ?? properties.Shape_Area ?? properties.SHAPE_AREA ?? properties.shape_area ?? '0'
          ) || 0;

          if (index < 3) {
            console.log(`🔄 [LayerAreaBreakdown] Feature ${index}:`, {
              type,
              area,
              color,
              rawShapeArea: properties.Shape_Area,
              allProperties: properties
            });
          }

          if (type) {
            if (!areaByType[type]) {
              areaByType[type] = { area: 0, color, count: 0 };
              console.log(`🆕 [LayerAreaBreakdown] New category found: "${type}" with color ${color}`);
            }
            areaByType[type].area += area;
            areaByType[type].count += 1;
            processedCount++;
          } else {
            skippedCount++;
            if (skippedCount <= 3) {
              console.warn(`⚠️ [LayerAreaBreakdown] Feature ${index} has no type field:`, properties);
            }
          }
        });

        console.log('🔄 [LayerAreaBreakdown] Processing complete:');
        console.log('🔄 [LayerAreaBreakdown] - Processed features:', processedCount);
        console.log('🔄 [LayerAreaBreakdown] - Skipped features:', skippedCount);
        console.log('🔄 [LayerAreaBreakdown] - Unique categories found:', Object.keys(areaByType).length);

        // Calculate total area
        const total = Object.values(areaByType).reduce((sum, item) => sum + item.area, 0);
        console.log('📏 [LayerAreaBreakdown] Total area calculated:', total, 'sq meters');

        // Convert to array and calculate percentages
        const processedData: AreaData[] = Object.entries(areaByType)
          .map(([category, data]) => ({
            category,
            area: data.area,
            percentage: (data.area / total) * 100,
            color: data.color,
            count: data.count
          }))
          .sort((a, b) => b.area - a.area); // Sort by area descending (largest first)

        console.log('✅ [LayerAreaBreakdown] ========================================');
        console.log('✅ [LayerAreaBreakdown] FINAL PROCESSED DATA');
        console.log('✅ [LayerAreaBreakdown] Categories:', processedData.length);
        console.log('✅ [LayerAreaBreakdown] Total area:', total, 'sq meters');
        console.log('✅ [LayerAreaBreakdown] Breakdown:');
        processedData.forEach((item, index) => {
          console.log(`✅ [LayerAreaBreakdown]   ${index + 1}. ${item.category}: ${item.percentage.toFixed(1)}% (${item.area.toFixed(0)} sq m) - Color: ${item.color}`);
        });
        console.log('✅ [LayerAreaBreakdown] ========================================');

        setAreaData(processedData);
        setTotalArea(total);
        breakdownCache.set(cacheKey, { areaData: processedData, totalArea: total });
        setLoading(false);
      } catch (err) {
        console.error('❌ [LayerAreaBreakdown] ========================================');
        console.error('❌ [LayerAreaBreakdown] ERROR OCCURRED');
        console.error('❌ [LayerAreaBreakdown] Error type:', err instanceof Error ? err.name : typeof err);
        console.error('❌ [LayerAreaBreakdown] Error message:', err instanceof Error ? err.message : String(err));
        console.error('❌ [LayerAreaBreakdown] Error stack:', err instanceof Error ? err.stack : 'No stack trace');
        console.error('❌ [LayerAreaBreakdown] Full error object:', err);
        console.error('❌ [LayerAreaBreakdown] ========================================');
        setError(err instanceof Error ? err.message : 'Failed to fetch layer data');
        setLoading(false);
      }
    };

    fetchRealData();
  }, [layerId, selectedWardId, selectedLguName]);

  // Dark theme constants (matching BaseLayerDefaultPanel)
  const D = {
    cardBg: '#162032', grayBorder: '#334155', gray: '#64748B',
    grayLight: '#94A3B8', dark: '#0F172A',
    tt: { background: '#1E293B', border: 'none', borderRadius: 8, color: '#fff', fontSize: 11 },
  };

  if (loading) {
    if (darkTheme) {
      // Silent placeholder matching the donut card's footprint so the layout
      // does not jump and no transient layer-name text flashes.
      return (
        <div style={{
          background: `linear-gradient(135deg, #3B82F61A 0%, #1E293B 100%)`,
          border: '1px solid #3B82F633',
          borderTop: 'none',
          borderRadius: '0 0 10px 10px',
          marginTop: -10,
          marginBottom: 10,
          height: 210,
        }} />
      );
    }
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-gradient-to-b from-[#2563EB] to-[#1E40AF] rounded-full" />
          <h3 className="text-xs font-semibold text-[#0F172A]">{layerName}</h3>
        </div>
        <div className="border border-[#E5E7EB] rounded-lg p-6 bg-white shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
            <div className="text-[10px] text-[#64748B] text-center">Loading {layerName} distribution...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    if (darkTheme) {
      return (
        <>
          <div style={{ color: '#fff', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{layerName}</div>
          <div style={{ color: '#EF4444', fontSize: 10 }}>Data unavailable: {error}</div>
        </>
      );
    }
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-gradient-to-b from-[#2563EB] to-[#1E40AF] rounded-full" />
          <h3 className="text-xs font-semibold text-[#0F172A]">{layerName}</h3>
        </div>
        <div className="border border-[#FCA5A5] bg-[#FEF2F2] rounded-lg p-4 shadow-sm">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-[#EF4444] flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-[10px] font-semibold text-[#EF4444]">Data Not Available</div>
              <div className="text-[9px] text-[#7F1D1D] mt-1">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (areaData.length === 0) {
    if (darkTheme) {
      return (
        <>
          <div style={{ color: '#fff', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{layerName}</div>
          <div style={{ color: D.grayLight, fontSize: 10 }}>No data available for this area</div>
        </>
      );
    }
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-gradient-to-b from-[#2563EB] to-[#1E40AF] rounded-full" />
          <h3 className="text-xs font-semibold text-[#0F172A]">{layerName}</h3>
        </div>
        <div className="border border-[#E5E7EB] rounded-lg p-4 bg-white shadow-sm">
          <div className="text-[10px] text-[#64748B] text-center">No data available for this layer</div>
        </div>
      </div>
    );
  }

  const config = LAYER_CONFIG[layerId];
  const quickFacts = config ? config.quickFacts(areaData, totalArea) : [];

  // Format area for display (convert from sq meters to sq km)
  const formatArea = (area: number) => {
    const sqKm = area / 1000000;
    return sqKm >= 1 ? `${sqKm.toFixed(1)} km²` : `${(area / 10000).toFixed(1)} ha`;
  };

  // Handle category click for map filtering
  const handleCategoryClick = (category: string) => {
    console.log('🎯 [LayerAreaBreakdown] Category clicked:', category);
    console.log('🎯 [LayerAreaBreakdown] Current selectedCategory:', selectedCategory);
    
    if (selectedCategory === category) {
      // Deselect if clicking the same category
      console.log('🎯 [LayerAreaBreakdown] Deselecting category');
      onCategorySelect?.(null);
    } else {
      // Select new category
      console.log('🎯 [LayerAreaBreakdown] Selecting category for map filter:', category);
      onCategorySelect?.(category);
    }
  };

  // Helper function to get opacity based on selection state
  const getSegmentOpacity = (category: string) => {
    if (!selectedCategory) return 1; // No filter active
    return category === selectedCategory ? 1 : 0.2; // Dim non-selected
  };

  // ── BINARY RENDER (Economic Vulnerability: Yes / No) ────────────────────
  // The Buildings layer's econ_vuln field only has two values
  // ("Economically Vulnerable" vs "Others"), so a donut + quick-facts grid
  // is overkill. Show a focused summary instead.
  if (layerId === 'economic_vulnerability') {
    const vulnerable = areaData.find(d => d.category === 'Economically Vulnerable');
    const others = areaData.find(d => d.category === 'Others');
    const totalCount = areaData.reduce((sum, d) => sum + (d.count ?? 0), 0);
    const vulnCount = vulnerable?.count ?? 0;
    const vulnPct = vulnerable?.percentage ?? 0;
    const othersCount = others?.count ?? 0;
    const othersPct = others?.percentage ?? 0;
    const formatCount = (n: number) => n.toLocaleString();

    if (darkTheme) {
      return (
        <>
          <div style={{ color: '#fff', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>{layerName}</div>

          {/* Headline stat */}
          <div style={{ background: '#1E293B', borderRadius: 10, padding: '12px 14px', marginBottom: 8 }}>
            <div style={{ color: '#94A3B8', fontSize: 10, marginBottom: 4 }}>Economically vulnerable buildings</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ color: '#DC2626', fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{vulnPct.toFixed(1)}%</span>
              <span style={{ color: '#E2E8F0', fontSize: 11 }}>{formatCount(vulnCount)} of {formatCount(totalCount)}</span>
            </div>

            {/* Stacked bar */}
            <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginTop: 10, background: '#334155' }}>
              {vulnPct > 0 && <div style={{ width: `${vulnPct}%`, background: '#DC2626' }} />}
              {othersPct > 0 && <div style={{ width: `${othersPct}%`, background: '#E5E7EB' }} />}
            </div>
          </div>

          {/* Per-category clickable rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {areaData.map(d => (
              <div
                key={d.category}
                onClick={() => handleCategoryClick(d.category)}
                style={{
                  background: '#1E293B', borderRadius: 8, padding: '8px 12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer',
                  opacity: selectedCategory && selectedCategory !== d.category ? 0.35 : 1,
                  transition: 'opacity 0.2s',
                  borderLeft: `3px solid ${d.color}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                  <span style={{ color: '#E2E8F0', fontSize: 11, fontWeight: 500 }}>{d.category}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ color: '#CBD5E1', fontSize: 10 }}>{formatCount(d.count ?? 0)}</span>
                  <span style={{ background: `${d.color}25`, color: d.color, fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 8 }}>
                    {d.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {selectedCategory && (
            <button
              onClick={() => onCategorySelect?.(null)}
              style={{
                marginTop: 8, width: '100%', background: '#1E293B', border: '1px solid #EF444460',
                color: '#EF4444', fontSize: 11, fontWeight: 600, borderRadius: 8, padding: '7px 0', cursor: 'pointer',
              }}
            >
              ✕ Reset Filter
            </button>
          )}
        </>
      );
    }

    // Light theme
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-gradient-to-b from-[#2563EB] to-[#1E40AF] rounded-full" />
          <h3 className="text-xs font-semibold text-[#0F172A]">{layerName}</h3>
        </div>

        {/* Headline stat card */}
        <div className="border border-[#E5E7EB] rounded-lg p-3 bg-gradient-to-br from-white to-gray-50/50 shadow-sm">
          <div className="text-[10px] text-[#64748B] mb-1">Economically vulnerable buildings</div>
          <div className="flex items-baseline gap-2">
            <span className="text-[22px] font-bold text-[#DC2626] leading-none">{vulnPct.toFixed(1)}%</span>
            <span className="text-[11px] text-[#475569]">{formatCount(vulnCount)} of {formatCount(totalCount)}</span>
          </div>
          <div className="flex h-2 rounded overflow-hidden mt-3 bg-[#F1F5F9]">
            {vulnPct > 0 && <div style={{ width: `${vulnPct}%`, background: '#DC2626' }} />}
            {othersPct > 0 && <div style={{ width: `${othersPct}%`, background: '#E5E7EB' }} />}
          </div>
        </div>

        {/* Clickable category rows */}
        <div className="space-y-1.5">
          {areaData.map(d => (
            <div
              key={d.category}
              onClick={() => handleCategoryClick(d.category)}
              className="flex items-center justify-between border border-[#E5E7EB] rounded-lg px-3 py-2 bg-white hover:shadow-sm cursor-pointer transition-all"
              style={{
                borderLeft: `3px solid ${d.color}`,
                opacity: selectedCategory && selectedCategory !== d.category ? 0.4 : 1,
              }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                <span className="text-[11px] font-medium text-[#0F172A]">{d.category}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[10px] text-[#64748B]">{formatCount(d.count ?? 0)}</span>
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: `${d.color}25`, color: d.color }}
                >
                  {d.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {selectedCategory && (
          <button
            onClick={() => onCategorySelect?.(null)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5 text-red-600" />
            <span className="text-[11px] font-semibold text-red-600">Reset</span>
          </button>
        )}
      </div>
    );
  }

  // ── DARK THEME RENDER (matches BaseLayerDefaultPanel style) ──────────────
  if (darkTheme) {
    return (
      <>
        {/* Donut chart card — visually continues the LayerBanner above (no gap,
            matching gradient, only bottom corners rounded). */}
        <div style={{
          background: `linear-gradient(135deg, #3B82F61A 0%, #1E293B 100%)`,
          border: '1px solid #3B82F633',
          borderTop: 'none',
          borderRadius: '0 0 10px 10px',
          padding: '4px 14px 12px',
          marginTop: -10,
          marginBottom: 10,
        }}>
          <ResponsiveContainer width="100%" height={170}>
            <PieChart>
              <Pie
                data={areaData}
                cx="50%" cy="50%"
                innerRadius={55} outerRadius={78}
                dataKey="area" paddingAngle={2}
                stroke="#ffffff" strokeWidth={1.5}
                startAngle={90} endAngle={-270}
                onClick={(d) => handleCategoryClick(d.category)}
                cursor="pointer"
              >
                {areaData.map((entry, i) => (
                  <Cell
                    key={`cell-dark-${i}`}
                    fill={entry.color}
                    opacity={getSegmentOpacity(entry.category)}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#0F172A', border: '1px solid #334155', borderRadius: 8, fontSize: 11, color: '#fff' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload as AreaData;
                  return (
                    <div style={{ background: '#0F172A', border: '1px solid #334155', borderRadius: 8, padding: '6px 10px' }}>
                      <div style={{ color: d.color, fontSize: 10, fontWeight: 700, marginBottom: 2 }}>{d.category}</div>
                      <div style={{ color: '#94A3B8', fontSize: 10 }}>Area: <span style={{ color: '#fff', fontWeight: 600 }}>{(d.area / 1_000_000).toFixed(1)} km²</span></div>
                      <div style={{ color: '#94A3B8', fontSize: 10 }}>Share: <span style={{ color: d.color, fontWeight: 600 }}>{d.percentage.toFixed(1)}%</span></div>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Per-category bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {areaData.map(d => (
              <div
                key={d.category}
                onClick={() => handleCategoryClick(d.category)}
                style={{
                  background: '#1E293B', borderRadius: 8, padding: '6px 12px',
                  display: 'flex', alignItems: 'center', gap: 8,
                  cursor: 'pointer',
                  opacity: selectedCategory && selectedCategory !== d.category ? 0.35 : 1,
                  transition: 'opacity 0.2s',
                  borderLeft: `3px solid ${d.color}`,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3, gap: 6 }}>
                    {(() => {
                      const m = d.category.match(/^([^(]+?)\s*\((.+)\)\s*$/);
                      const main = m ? m[1].trim() : d.category;
                      const sub = m ? m[2].trim() : null;
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                          <span style={{ color: '#E2E8F0', fontSize: 10, fontWeight: 500, lineHeight: 1.2 }}>{main}</span>
                          {sub && (
                            <span style={{ color: '#94A3B8', fontSize: 8.5, fontWeight: 400, lineHeight: 1.2, marginTop: 1 }}>{sub}</span>
                          )}
                        </div>
                      );
                    })()}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, flexShrink: 0 }}>
                      <span style={{ color: '#CBD5E1', fontSize: 10, fontWeight: 600 }}>{(d.area / 1_000_000).toFixed(1)} km²</span>
                      <span style={{ background: `${d.color}25`, color: d.color, fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 8 }}>{d.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div style={{ background: '#334155', borderRadius: 3, height: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(d.percentage * 1.2, 100)}%`, background: d.color, height: '100%', borderRadius: 3 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

        {/* Reset button */}
        {selectedCategory && (
          <button
            onClick={() => onCategorySelect?.(null)}
            style={{
              marginTop: 8, width: '100%', background: '#1E293B', border: '1px solid #EF444460',
              color: '#EF4444', fontSize: 11, fontWeight: 600, borderRadius: 8, padding: '7px 0', cursor: 'pointer',
            }}
          >
            ✕ Reset Filter
          </button>
        )}
      </>
    );
  }

  // ── DEFAULT (LIGHT) THEME RENDER ──────────────────────────────────────────
  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <div className="w-1 h-4 bg-gradient-to-b from-[#2563EB] to-[#1E40AF] rounded-full" />
        <h3 className="text-xs font-semibold text-[#0F172A]">{layerName}</h3>
      </div>

      {/* Donut Chart */}
      <div className="border border-[#E5E7EB] rounded-lg p-3 bg-gradient-to-br from-white to-gray-50/50 shadow-sm">
        
        <div className="relative">
          {/* Center Text */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center bg-white/90 backdrop-blur-sm rounded-full w-[85px] h-[85px] flex flex-col items-center justify-center shadow-lg">
              <div className="text-[14px] font-bold text-[#0F172A] leading-none">
                {formatArea(totalArea)}
              </div>
              <div className="text-[8px] font-medium text-gray-500 mt-1">Total Area</div>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={190}>
            <PieChart>
              <Pie
                data={areaData}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={80}
                paddingAngle={2}
                dataKey="area"
                startAngle={90}
                endAngle={-270}
                onClick={(data) => handleCategoryClick(data.category)}
                cursor="pointer"
              >
                {areaData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color} 
                    stroke="#fff" 
                    strokeWidth={2} 
                    opacity={getSegmentOpacity(entry.category)}
                    className="transition-opacity duration-200 hover:opacity-80"
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as AreaData;
                    return (
                      <div className="bg-white px-2 py-1.5 rounded shadow-lg border border-gray-200">
                        <div className="text-[10px] font-semibold text-gray-900">{data.category}</div>
                        <div className="text-[9px] text-gray-500">Area: {(data.area / 1_000_000).toFixed(4)} km²</div>
                        <div className="text-[9px] font-medium text-blue-600">{data.percentage.toFixed(1)}%</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Reset Filter Button - Only shows when filter is active */}
      {selectedCategory && (
        <button
          onClick={() => {
            console.log('🔄 [LayerAreaBreakdown] Reset button clicked');
            onCategorySelect?.(null);
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors group"
        >
          <X className="w-3.5 h-3.5 text-red-600 group-hover:text-red-700" />
          <span className="text-[11px] font-semibold text-red-600 group-hover:text-red-700">
            Reset
          </span>
        </button>
      )}

      {/* Quick Facts Cards */}
      {quickFacts.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[11px] font-semibold text-[#0F172A]">Quick Facts</h4>
          <div className="grid grid-cols-1 gap-2">
            {quickFacts.map((fact, index) => {
              const IconComponent = fact.icon;
              return (
                <div
                  key={index}
                  className="border border-[#E5E7EB] rounded-lg p-2.5 bg-white hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${fact.color}15` }}
                    >
                      <IconComponent className="w-3.5 h-3.5" style={{ color: fact.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="text-[9px] text-[#64748B]">{fact.label}</div>
                      <div className="text-[11px] font-bold text-[#0F172A] mt-0.5">{fact.value}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}