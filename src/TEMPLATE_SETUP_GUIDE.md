# 🌍 Multi-Hazard Climate Screening Dashboard - Template Setup Guide

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Configuration Steps](#configuration-steps)
5. [GeoServer Setup](#geoserver-setup)
6. [API Integration](#api-integration)
7. [Customization Guide](#customization-guide)
8. [Testing & Validation](#testing--validation)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

This is a complete, production-ready template for creating multi-hazard climate screening dashboards for any city. The dashboard provides:

- **🗺️ Interactive Map**: MapLibre GL JS with GeoServer layer integration
- **📊 Analytics**: KPI calculations, charts, and trend analysis
- **🔥 Multi-Hazard Support**: Heat stress, air pollution, flood, multi-hazard assessment
- **🚗 Road Safety Analysis**: iRAP-based road network safety assessment
- **🏢 Infrastructure Mapping**: Schools, hospitals, public amenities, transport hubs
- **📈 Scenario Planning**: Climate projection scenarios (SSP1, SSP2, SSP5)
- **🎨 3D Visualization**: Building extrusion and terrain visualization
- **📱 Responsive Design**: Works on desktop, tablet, and mobile

---

## ✅ Prerequisites

### Required Software

- **Node.js** 18+ and npm/yarn
- **GeoServer** 2.20+ (with published layers)
- **Git** for version control

### Required Data

1. **Spatial Data Layers** (GeoTIFF, Shapefile, or PostGIS):
   - Heat stress indices (HHI, LST, AST, WBT, WBGT, UHI, RH)
   - Air pollution data (AQI, PM2.5, PM10, NO₂, SO₂, CO, O₃)
   - Flood hazard index
   - Multi-hazard composite
   - Road network (with iRAP safety ratings)
   - Infrastructure points (schools, hospitals, amenities, transport)
   - Base layers (buildings, green cover, elevation, boundaries)

2. **API Backend** (optional but recommended):
   - Building hazard analysis endpoint
   - KPI calculation endpoint
   - POI query endpoint
   - Road network analysis endpoint
   - Historical trends endpoint

---

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd climate-dashboard

# Install dependencies
npm install
```

### 2. Configure for Your City

```bash
# Copy template configuration
cp config/cityConfig.template.ts config/cityConfig.ts
cp config/geoserverLayers.template.ts config/geoserverLayers.ts

# Edit configuration files
# Update with your city-specific details
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the dashboard.

---

## ⚙️ Configuration Steps

### Step 1: City Configuration (`/config/cityConfig.ts`)

Update the following sections:

#### Basic Information

```typescript
export const CITY_CONFIG = {
  name: 'Mumbai',                    // Your city name
  country: 'India',
  region: 'Maharashtra',
  displayName: 'Mumbai Climate Dashboard',
  shortCode: 'MUM',
  timezone: 'Asia/Kolkata',
};
```

#### GeoServer Connection

```typescript
export const GEOSERVER_CONFIG = {
  baseUrl: 'https://geoserver.your-domain.com/geoserver',
  workspace: 'MUMBAI_CLIMATE',       // Your GeoServer workspace
  
  // Auth if required
  auth: {
    required: true,
    username: 'your_username',
    password: 'your_password',
  },
};
```

#### Map Configuration

```typescript
export const MAP_CONFIG = {
  center: {
    lng: 72.8777,     // Mumbai longitude
    lat: 19.0760,     // Mumbai latitude
  },
  initialZoom: 11,
  
  bounds: {
    southwest: { lng: 72.7760, lat: 18.8920 },
    northeast: { lng: 73.0300, lat: 19.2700 },
  },
};
```

### Step 2: GeoServer Layers (`/config/geoserverLayers.ts`)

Replace `YOUR_WORKSPACE` with your actual workspace name throughout the file:

```typescript
// Find and replace all instances:
// YOUR_WORKSPACE:HHI_2025 → MUMBAI_CLIMATE:HHI_2025

export const GEOSERVER_WMS_URL = 'https://geoserver.your-domain.com/geoserver/MUMBAI_CLIMATE/wms';

const layerScenarioMap: Record<string, Record<string, string>> = {
  heat_hhi: {
    '2024': 'MUMBAI_CLIMATE:HHI_2024',
    baseline_2025: 'MUMBAI_CLIMATE:HHI_2025',
    ssp1_2040: 'MUMBAI_CLIMATE:HHI_2040_SSP1',
    // ...
  },
  // ...
};
```

### Step 3: API Endpoints (`/config/cityConfig.ts`)

```typescript
export const API_CONFIG = {
  baseUrl: 'https://api.your-domain.com',
  endpoints: {
    buildingHazard: '/api/building-hazard',
    areaKPI: '/api/area-kpi',
    poiQuery: '/api/poi-query',
    roadNetwork: '/api/road-network',
    roadSafety: '/api/road-safety',
    historicalTrends: '/api/historical-trends',
    imdHeatCalendar: '/api/imd-heat-calendar',
  },
};
```

---

## 🗺️ GeoServer Setup

### Layer Naming Convention

Follow this naming pattern for consistency:

**Heat Stress Layers:**
- `HHI_YYYY` or `HHI_YYYY_SSPn` (e.g., `HHI_2025`, `HHI_2040_SSP1`)
- `LST_YYYY` or `LST_YYYY_SSPn`
- `AST_YYYY` or `AST_YYYY_SSPn`
- `WBT_YYYY` or `WBT_YYYY_SSPn`
- `WBGT_YYYY` or `WBGT_YYYY_SSPn`
- `UHI_YYYY` (usually no projections)
- `RH_YYYY` (usually no projections)

**Air Pollution Layers:**
- `Air_AQI`, `Air_PM25`, `Air_PM10`, `Air_NO2`, `Air_SO2`, `Air_CO`, `Air_O3`

**Flood & Multi-Hazard:**
- `Flood_Hazard`
- `Multi_Hazard`

**Infrastructure:**
- `Road_Network`
- `Buildings`
- `Green_Cover`
- `Builtup`
- `Elevation`
- `Municipal_Boundary`
- `Slum`

### Required Layer Attributes

**Road Network Layer:**
```
- Ward (integer): Ward/district number
- Type (string): Road category
- iRAP_Vehicle (integer): 1-5 star rating
- iRAP_Motorcycle (integer): 1-5 star rating
- iRAP_Bicycle (integer): 1-5 star rating
- iRAP_Pedestrian (integer): 1-5 star rating
- Length (float): Road segment length in km
```

**Buildings Layer:**
```
- Ward (integer): Ward number
- Height (float): Building height in meters
- Type (string): Building type/use
- Area (float): Building footprint area
```

**Infrastructure Layers (Schools, Hospitals, etc.):**
```
- Name (string): Facility name
- Type (string): Facility category
- Ward (integer): Ward number
- Latitude (float)
- Longitude (float)
```

### Enable WMTS for Better Performance

1. Go to GeoServer → Tile Caching → Gridsets
2. Ensure `EPSG:900913` gridset exists
3. Go to Tile Caching → Tile Layers
4. Enable tile caching for each layer
5. Set tile format to `image/png`
6. Generate seed tiles for zoom levels 8-18

---

## 🔌 API Integration

### Building Hazard Analysis API

**Endpoint:** `POST /api/building-hazard`

**Request:**
```json
{
  "layerId": "heat_hhi",
  "scenario": "baseline_2025",
  "wardNumber": 15
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalBuildings": 2450,
    "riskCounts": {
      "Low": 850,
      "Moderate": 980,
      "High": 520,
      "Very High": 100
    },
    "riskPercentages": {
      "Low": 34.7,
      "Moderate": 40.0,
      "High": 21.2,
      "Very High": 4.1
    }
  }
}
```

### Area KPI Calculation API

**Endpoint:** `POST /api/area-kpi`

**Request:**
```json
{
  "layerId": "heat_hhi",
  "scenario": "baseline_2025",
  "wardNumber": 15
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalArea": 15.6,
    "areaCounts": {
      "Low": 4.2,
      "Moderate": 6.8,
      "High": 3.5,
      "Very High": 1.1
    },
    "areaPercentages": {
      "Low": 26.9,
      "Moderate": 43.6,
      "High": 22.4,
      "Very High": 7.1
    }
  }
}
```

### POI Query API

**Endpoint:** `POST /api/poi-query`

**Request:**
```json
{
  "layerId": "heat_hhi",
  "scenario": "baseline_2025",
  "poiType": "schools",
  "wardNumber": 15
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalPOIs": 45,
    "results": [
      {
        "name": "Government High School Ward 15",
        "type": "Primary School",
        "riskLevel": "High",
        "riskValue": 78.5,
        "latitude": 19.0760,
        "longitude": 72.8777
      }
      // ...
    ],
    "statistics": {
      "Low": 12,
      "Moderate": 18,
      "High": 13,
      "Very High": 2
    }
  }
}
```

### Road Network Analysis API

**Endpoint:** `POST /api/road-network`

**Request:**
```json
{
  "layerId": "heat_hhi",
  "scenario": "baseline_2025",
  "wardNumber": 15
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalLength": 125.8,
    "lengthByRisk": {
      "Low": 42.3,
      "Moderate": 58.7,
      "High": 20.5,
      "Very High": 4.3
    },
    "percentages": {
      "Low": 33.6,
      "Moderate": 46.7,
      "High": 16.3,
      "Very High": 3.4
    }
  }
}
```

---

## 🎨 Customization Guide

### Branding

Update `/config/cityConfig.ts`:

```typescript
export const BRANDING_CONFIG = {
  organization: 'Mumbai Municipal Corporation',
  
  logo: {
    header: '/images/mumbai-logo.png',
    footer: '/images/mumbai-footer.png',
  },
  
  colors: {
    primary: '#FF6B00',      // Mumbai orange
    secondary: '#0066CC',    // Mumbai blue
    // ...
  },
  
  footer: {
    copyright: '© 2024 Mumbai Municipal Corporation',
    credits: 'Developed by Urban Planning Department',
  },
};
```

### Feature Flags

Enable/disable features in `/config/cityConfig.ts`:

```typescript
export const FEATURE_FLAGS = {
  tutorial: true,              // Enable interactive tutorial
  comparison: true,            // Enable scenario comparison view
  scenarioPlanning: true,      // Enable future projections
  historicalTrends: true,      // Enable historical trends panel
  buildingAnalysis: true,      // Enable building-level analysis
  roadSafetyAnalysis: true,    // Enable road safety module
  buildings3D: true,           // Enable 3D building visualization
  terrain3D: false,            // Disable terrain 3D (if no DEM)
};
```

### Layer Availability

Configure which sectors are available:

```typescript
export const HAZARD_SECTORS = {
  heatStress: {
    enabled: true,           // Show heat stress sector
    hasScenarios: true,      // Has future projections
    hasHistorical: true,     // Has historical data
    layers: ['heat_hhi', 'heat_lst', ...],
  },
  
  airPollution: {
    enabled: true,
    hasScenarios: false,     // No projections
    hasHistorical: false,    // No historical data
    layers: ['air_aqi', 'air_pm25', ...],
  },
  
  // Set enabled: false to hide a sector
  flood: {
    enabled: false,
  },
};
```

### Basemap Styles

Update basemap options in `/config/cityConfig.ts`:

```typescript
export const BASEMAP_STYLES = {
  default: 'mapbox://styles/mapbox/light-v11',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  
  // Or use custom MapTiler/Maptiler styles
  custom: 'https://api.maptiler.com/maps/streets/style.json?key=YOUR_KEY',
};
```

---

## ✅ Testing & Validation

### 1. Configuration Validation

Add validation check in your code:

```typescript
import { validateCityConfig } from './config/cityConfig';

const validation = validateCityConfig();
if (!validation.valid) {
  console.error('Configuration errors:', validation.errors);
}
```

### 2. GeoServer Connection Test

Test WMS/WMTS URLs in browser:

```
https://your-geoserver.com/geoserver/WORKSPACE/wms?service=WMS&version=1.1.0&request=GetCapabilities

https://your-geoserver.com/geoserver/gwc/service/wmts?REQUEST=GetCapabilities
```

### 3. Layer Visibility Test

1. Start development server
2. Navigate to Heat Stress sector
3. Select each layer and verify it loads
4. Test scenario switching (Baseline → SSP1 → SSP2 → SSP5)
5. Test year selector for historical data

### 4. API Integration Test

Test each API endpoint with sample requests:

```bash
curl -X POST https://your-api.com/api/building-hazard \
  -H "Content-Type: application/json" \
  -d '{"layerId":"heat_hhi","scenario":"baseline_2025","wardNumber":1}'
```

### 5. Ward Filtering Test

1. Click on ward filter dropdown
2. Select a ward
3. Verify map zooms to ward
4. Verify KPIs update for selected ward
5. Verify layers show only selected ward data

---

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

This creates optimized production files in `/dist`.

### Environment Variables

Create `.env.production`:

```env
VITE_GEOSERVER_URL=https://geoserver.your-domain.com
VITE_API_URL=https://api.your-domain.com
VITE_MAPBOX_TOKEN=your_mapbox_token
```

### Deploy to Static Hosting

**Vercel:**
```bash
npm install -g vercel
vercel --prod
```

**Netlify:**
```bash
npm install -g netlify-cli
netlify deploy --prod
```

**AWS S3 + CloudFront:**
```bash
aws s3 sync dist/ s3://your-bucket-name
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

### NGINX Configuration

```nginx
server {
    listen 80;
    server_name climate-dashboard.your-domain.com;
    
    root /var/www/climate-dashboard;
    index index.html;
    
    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # GeoServer proxy (optional)
    location /geoserver/ {
        proxy_pass https://geoserver.your-domain.com/geoserver/;
        proxy_set_header Host $host;
    }
    
    # API proxy (optional)
    location /api/ {
        proxy_pass https://api.your-domain.com/;
        proxy_set_header Host $host;
    }
}
```

---

## 🔧 Troubleshooting

### Layers Not Loading

**Problem:** Map shows but layers don't appear

**Solutions:**
1. Check GeoServer URL in browser console network tab
2. Verify workspace name matches exactly (case-sensitive)
3. Check layer names in GeoServer match config
4. Verify CORS is enabled on GeoServer
5. Check authentication credentials if required

### API Errors

**Problem:** `API request failed` errors

**Solutions:**
1. Check API URL is correct
2. Verify API endpoints are accessible
3. Check request/response format matches expected schema
4. Enable CORS on API server
5. Check authentication tokens if required

### Map Not Centered Correctly

**Problem:** Map shows wrong location on load

**Solutions:**
1. Update `MAP_CONFIG.center` with correct coordinates
2. Set appropriate `initialZoom` level
3. Verify coordinates are in correct format (lng, lat)
4. Check map bounds are set correctly

### 3D Buildings Not Showing

**Problem:** Building extrusion not working

**Solutions:**
1. Check `FEATURE_FLAGS.buildings3D` is `true`
2. Verify Buildings layer has `Height` attribute
3. Check GeoServer layer has numeric height values
4. Ensure MapLibre GL JS supports 3D (v2.0+)

### Ward Filtering Not Working

**Problem:** Ward selection doesn't filter data

**Solutions:**
1. Verify GeoServer layers have `Ward` attribute
2. Check Ward field is numeric (integer)
3. Ensure CQL_FILTER syntax is correct
4. Test WMS URL with filter in browser

---

## 📚 Additional Resources

### Documentation Files

- `/ARCHITECTURE.md` - System architecture overview
- `/DATA_FETCHING_GUIDE.md` - Data fetching patterns
- `/LAYER_ORDER_DOCUMENTATION.md` - Layer rendering order
- `/KPI_SYSTEM_EXPLANATION.md` - KPI calculation logic
- `/docs/CSV_LEGEND_SYSTEM.md` - Legend configuration

### Key Code Files

- `/App.tsx` - Main application component
- `/components/MapCanvas.tsx` - Map rendering logic
- `/components/LeftDrawer.tsx` - Layer selection panel
- `/components/RightPanel.tsx` - Analytics panel
- `/hooks/useHazardKPI.ts` - KPI calculation hook
- `/utils/buildingHazardApi.ts` - Building analysis API client

### Support

For issues and questions:
- Check existing documentation files
- Review console logs for error messages
- Test GeoServer URLs directly in browser
- Verify API responses with Postman/cURL

---

## 📝 License

This template is provided as-is for creating climate dashboard applications.
Customize and deploy for your specific city requirements.

---

**Version:** 1.0.0  
**Last Updated:** 2024  
**Template Type:** Multi-Hazard Climate Screening Dashboard
