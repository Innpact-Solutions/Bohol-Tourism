# 🔄 Migration Guide: From Bhubaneswar to Your City

This guide helps you migrate from the Bhubaneswar implementation to your city.

---

## 📋 Overview

The template has been cleaned of all Bhubaneswar-specific references. This guide shows you exactly what was changed and what you need to update.

---

## ✨ What Was Removed

### GeoServer Configuration

**Removed:**
```typescript
// OLD (Bhubaneswar-specific)
export const GEOSERVER_WMS_URL = 'https://geoserver.azure.innpact.ai/geoserver/GIZ_BBSR/wms';
const workspace = 'GIZ_BBSR';
```

**Replaced with:**
```typescript
// NEW (Template)
export const GEOSERVER_WMS_URL = 'https://your-geoserver.com/geoserver/YOUR_WORKSPACE/wms';
const workspace = 'YOUR_WORKSPACE';
```

### All Layer Names

**Removed:**
```typescript
// OLD
'GIZ_BBSR:HHI_2025'
'GIZ_BBSR:LST_2025'
'GIZ_BBSR:Road_Network_BBSR_v2'
'GIZ_BBSR:Multi_Hazard_BBSR'
```

**Replaced with:**
```typescript
// NEW
'YOUR_WORKSPACE:HHI_2025'
'YOUR_WORKSPACE:LST_2025'
'YOUR_WORKSPACE:Road_Network'
'YOUR_WORKSPACE:Multi_Hazard'
```

### City Information

**Removed:**
```typescript
// OLD
name: 'Bhubaneswar'
country: 'India'
region: 'Odisha'
center: { lng: 85.8245, lat: 20.2961 }
```

**Replaced with:**
```typescript
// NEW
name: 'Sample City'
country: 'Country'
region: 'Region'
center: { lng: 0.0, lat: 0.0 }
```

### API URLs

**Removed:**
```typescript
// OLD
baseUrl: 'https://api.innpact.ai/bhubaneswar'
```

**Replaced with:**
```typescript
// NEW
baseUrl: 'https://your-api.com'
```

---

## 🔄 Step-by-Step Migration

### Step 1: Prepare Your Data

Ensure you have the following ready:

#### Spatial Data Layers
- [ ] Heat stress rasters (GeoTIFF)
- [ ] Air pollution rasters
- [ ] Flood hazard raster
- [ ] Multi-hazard composite raster
- [ ] Road network shapefile/geodatabase
- [ ] Buildings shapefile/geodatabase with height attribute
- [ ] Infrastructure points (schools, hospitals, etc.)
- [ ] Base layers (boundaries, green cover, elevation)

#### City Information
- [ ] City center coordinates (latitude, longitude)
- [ ] City bounding box (southwest, northeast corners)
- [ ] Administrative divisions (ward count, ward boundaries)
- [ ] Official city name and region

#### Technical Setup
- [ ] GeoServer instance URL
- [ ] GeoServer workspace name
- [ ] (Optional) Custom API endpoints
- [ ] (Optional) Authentication credentials

---

### Step 2: GeoServer Setup

#### 2.1 Create Workspace

```sql
-- In GeoServer Admin UI:
1. Workspaces → Add new workspace
2. Name: YOUR_CITY_CODE (e.g., 'MUM' for Mumbai)
3. Namespace URI: http://your-organization.com/YOUR_CITY_CODE
4. Default workspace: Yes (if this is your only city)
```

#### 2.2 Publish Layers

Follow the naming convention:

**Heat Stress Layers:**
```
HHI_2015, HHI_2016, ..., HHI_2024, HHI_2025
HHI_2040_SSP1, HHI_2040_SSP2, HHI_2040_SSP5

LST_2015, LST_2016, ..., LST_2024, LST_2025
LST_2040_SSP1, LST_2040_SSP2, LST_2040_SSP5

AST_*, WBT_*, WBGT_*, UHI_*, RH_* (same pattern)
```

**Air Pollution Layers:**
```
Air_AQI
Air_PM25
Air_PM10
Air_NO2
Air_SO2
Air_CO
Air_O3
```

**Other Layers:**
```
Flood_Hazard
Multi_Hazard
Road_Network
Buildings
Green_Cover
Builtup
Elevation
Municipal_Boundary
Slum
```

#### 2.3 Configure Styles

Apply appropriate SLD styles for color ramps:

**Heat Stress Example:**
```xml
<!-- HHI Style: Red-Yellow-Green color ramp -->
<sld:ColorMap>
  <sld:ColorMapEntry color="#d73027" quantity="0" label="Very High"/>
  <sld:ColorMapEntry color="#fc8d59" quantity="25" label="High"/>
  <sld:ColorMapEntry color="#fee08b" quantity="50" label="Moderate"/>
  <sld:ColorMapEntry color="#d9ef8b" quantity="75" label="Low"/>
  <sld:ColorMapEntry color="#91cf60" quantity="100" label="Very Low"/>
</sld:ColorMap>
```

#### 2.4 Enable Tile Caching

```bash
# In GeoServer Admin UI:
1. Tile Caching → Gridsets
2. Ensure EPSG:900913 exists
3. Tile Caching → Tile Layers
4. For each layer:
   - Enable tile caching
   - Set format: image/png
   - Gridset: EPSG:900913
   - Zoom levels: 8-18
5. Seed tiles (optional but recommended)
```

---

### Step 3: Update Configuration Files

#### 3.1 City Configuration

Edit `/config/cityConfig.ts`:

```typescript
// Update these values
export const CITY_CONFIG = {
  name: 'Mumbai',              // Your city name
  country: 'India',
  region: 'Maharashtra',
  displayName: 'Mumbai Climate Risk Assessment Dashboard',
  shortCode: 'MUM',
  timezone: 'Asia/Kolkata',
};

export const GEOSERVER_CONFIG = {
  baseUrl: 'https://geoserver.your-org.com/geoserver',
  workspace: 'MUM_CLIMATE',    // Your workspace name
  // ... rest
};

export const MAP_CONFIG = {
  center: {
    lng: 72.8777,              // Mumbai longitude
    lat: 19.0760,              // Mumbai latitude
  },
  initialZoom: 11,
  bounds: {
    southwest: { lng: 72.7760, lat: 18.8920 },
    northeast: { lng: 73.0300, lat: 19.2700 },
  },
};

export const WARD_CONFIG = {
  divisionType: 'ward',
  totalWards: 227,             // Mumbai has 227 wards
  labelField: 'Ward',
  enableFiltering: true,
};
```

#### 3.2 GeoServer Layers

Edit `/config/geoserverLayers.ts`:

**Find & Replace:**
```
Find:    YOUR_WORKSPACE
Replace: MUM_CLIMATE
```

**Update URLs:**
```typescript
export const GEOSERVER_WMS_URL = 
  'https://geoserver.your-org.com/geoserver/MUM_CLIMATE/wms';
```

**Verify layer scenario mappings:**
```typescript
const layerScenarioMap: Record<string, Record<string, string>> = {
  heat_hhi: {
    '2015': 'MUM_CLIMATE:HHI_2015',
    // ... add all years you have data for
    '2024': 'MUM_CLIMATE:HHI_2024',
    baseline_2025: 'MUM_CLIMATE:HHI_2025',
    ssp1_2040: 'MUM_CLIMATE:HHI_2040_SSP1',
    ssp2_2040: 'MUM_CLIMATE:HHI_2040_SSP2',
    ssp5_2040: 'MUM_CLIMATE:HHI_2040_SSP5',
  },
  // ... repeat for all layers
};
```

---

### Step 4: Customize Content

#### 4.1 Sector Descriptions

Update `/data/heatStressContent.ts`:

```typescript
export const heatStressContent = {
  title: 'Heat Stress in Mumbai',
  subtitle: 'Multi-dimensional heat exposure assessment for Mumbai Metropolitan Region',
  description: `
    Comprehensive heat stress analysis using 7 indices to evaluate thermal comfort,
    health risks, and outdoor work safety across Mumbai's diverse urban landscape.
    
    [Customize this description for your city]
  `,
  // ... update other fields
};
```

Repeat for:
- `/data/airPollutionContent.ts`
- `/data/floodContent.ts`
- `/data/multiHazardContent.ts`
- `/data/roadSafetyContent.ts`

#### 4.2 Legend Definitions

Update `/public/data/legend-definitions.csv`:

```csv
layerId,category,color,label,minValue,maxValue
heat_hhi,Very High,#d73027,Very High Risk,80,100
heat_hhi,High,#fc8d59,High Risk,60,80
heat_hhi,Moderate,#fee08b,Moderate Risk,40,60
heat_hhi,Low,#d9ef8b,Low Risk,20,40
heat_hhi,Very Low,#91cf60,Very Low Risk,0,20
```

Adjust thresholds based on your city's data distribution.

#### 4.3 KPI Labels

Update `/data/kpiLabels.ts` if needed:

```typescript
export const kpiLabels = {
  totalArea: 'Total City Area',
  exposedArea: 'Exposed Area',
  buildingsAtRisk: 'Buildings at Risk',
  // ... customize labels for your city
};
```

---

### Step 5: Branding Customization

#### 5.1 Logos

Add your organization logos:

```bash
# Add files to public directory
public/
  ├── logo-header.png     # Header logo (recommended: 200x60px)
  └── logo-footer.png     # Footer logo (recommended: 150x50px)
```

Update paths in `/config/cityConfig.ts`:

```typescript
export const BRANDING_CONFIG = {
  organization: 'Mumbai Municipal Corporation',
  logo: {
    header: '/logo-header.png',
    footer: '/logo-footer.png',
  },
  colors: {
    primary: '#FF6B00',      // Customize your brand colors
    secondary: '#0066CC',
    // ...
  },
  footer: {
    copyright: '© 2024 Mumbai Municipal Corporation',
    credits: 'Developed by Urban Planning Department',
  },
};
```

#### 5.2 Color Scheme

Customize dashboard colors to match your brand:

```typescript
export const BRANDING_CONFIG = {
  colors: {
    primary: '#YOUR_PRIMARY_COLOR',
    secondary: '#YOUR_SECONDARY_COLOR',
    accent: '#YOUR_ACCENT_COLOR',
    
    // Sector colors
    heat: '#EF4444',         // Keep or customize
    air: '#8B5CF6',
    flood: '#3B82F6',
    multiHazard: '#F59E0B',
    roadSafety: '#14B8A6',
  },
};
```

---

### Step 6: API Integration (Optional)

If you have custom APIs:

#### 6.1 Update API Configuration

```typescript
export const API_CONFIG = {
  baseUrl: 'https://api.mumbai-climate.com',
  endpoints: {
    buildingHazard: '/api/v1/analysis/buildings',
    areaKPI: '/api/v1/analysis/area-kpi',
    poiQuery: '/api/v1/query/infrastructure',
    roadNetwork: '/api/v1/analysis/road-network',
    roadSafety: '/api/v1/analysis/road-safety',
    historicalTrends: '/api/v1/data/historical-trends',
    imdHeatCalendar: '/api/v1/data/imd-heat-calendar',
  },
  timeout: 30000,
  retry: {
    attempts: 3,
    delay: 1000,
  },
};
```

#### 6.2 Test API Endpoints

```bash
# Test building hazard endpoint
curl -X POST https://api.mumbai-climate.com/api/v1/analysis/buildings \
  -H "Content-Type: application/json" \
  -d '{
    "layerId": "heat_hhi",
    "scenario": "baseline_2025",
    "wardNumber": 1
  }'

# Expected response:
{
  "success": true,
  "data": {
    "totalBuildings": 2450,
    "riskCounts": {
      "Low": 850,
      "Moderate": 980,
      "High": 520,
      "Very High": 100
    }
  }
}
```

---

### Step 7: Feature Configuration

#### 7.1 Enable/Disable Features

Review and update feature flags:

```typescript
export const FEATURE_FLAGS = {
  // Core features
  tutorial: true,              // Keep for new users
  comparison: true,            // Enable scenario comparison
  scenarioPlanning: true,      // Enable if you have projections
  
  // Analytics features
  historicalTrends: true,      // Enable if you have 2015-2024 data
  climateProjections: true,    // Enable if you have SSP scenarios
  imdHeatAnalytics: false,     // Disable if not using IMD data
  
  // Advanced features
  buildingAnalysis: true,      // Enable if you have building-level API
  roadSafetyAnalysis: true,    // Enable if you have iRAP data
  poiQueries: true,            // Enable if you have infrastructure data
  
  // 3D features
  buildings3D: true,           // Enable if buildings have height data
  terrain3D: false,            // Enable if you have DEM data
};
```

#### 7.2 Sector Availability

Disable sectors you don't have data for:

```typescript
export const HAZARD_SECTORS = {
  heatStress: {
    enabled: true,           // You have heat data
    hasScenarios: true,      // You have projections
    hasHistorical: true,     // You have 2015-2024 data
  },
  
  airPollution: {
    enabled: true,           // You have air data
    hasScenarios: false,     // No projections available
    hasHistorical: false,    // No historical data
  },
  
  flood: {
    enabled: false,          // Disable if no flood data
  },
  
  multiHazard: {
    enabled: true,           // You have composite assessment
  },
  
  roadSafety: {
    enabled: true,           // You have iRAP data
  },
};
```

---

### Step 8: Testing

#### 8.1 Configuration Validation

```typescript
// Run validation
import { validateCityConfig } from './config/cityConfig';

const result = validateCityConfig();
if (!result.valid) {
  console.error('Configuration errors:', result.errors);
  // Fix errors before proceeding
}
```

#### 8.2 Layer Testing Checklist

Test each layer manually:

- [ ] Heat HHI loads for baseline 2025
- [ ] Heat HHI loads for SSP1 2040
- [ ] Heat LST loads
- [ ] All 7 heat layers work
- [ ] Air AQI loads
- [ ] All 7 air layers work
- [ ] Flood layer loads (if enabled)
- [ ] Multi-hazard layer loads
- [ ] Road network displays with iRAP ratings
- [ ] Buildings display (2D and 3D if enabled)
- [ ] Infrastructure points display
- [ ] Municipal boundary displays

#### 8.3 Feature Testing

- [ ] Layer opacity control works
- [ ] Ward filtering works
- [ ] Scenario switching works
- [ ] Year selection works (historical)
- [ ] Legend updates correctly
- [ ] KPI tiles show data
- [ ] Charts render
- [ ] Building analysis works
- [ ] Road analysis works
- [ ] Tutorial works
- [ ] Comparison view works

---

### Step 9: Deployment Preparation

#### 9.1 Environment Variables

Create `.env.production`:

```env
VITE_GEOSERVER_URL=https://geoserver.your-org.com
VITE_GEOSERVER_WORKSPACE=MUM_CLIMATE
VITE_API_URL=https://api.mumbai-climate.com
VITE_MAPBOX_TOKEN=pk.your_mapbox_token_here
```

#### 9.2 Build for Production

```bash
# Install dependencies
npm install

# Run build
npm run build

# Test production build locally
npm run preview
```

#### 9.3 Pre-Deployment Checklist

- [ ] All configuration values updated
- [ ] No placeholder values (`YOUR_*`, `0.0`, etc.)
- [ ] All required GeoServer layers published
- [ ] Tile caching enabled on GeoServer
- [ ] CORS enabled on GeoServer
- [ ] API endpoints tested (if using)
- [ ] Logos added
- [ ] Content updated for your city
- [ ] Legend colors match data
- [ ] Build completes without errors
- [ ] Production build tested locally

---

## 🔍 Verification Commands

### Check GeoServer Connectivity

```bash
# Test WMS GetCapabilities
curl "https://geoserver.your-org.com/geoserver/MUM_CLIMATE/wms?service=WMS&request=GetCapabilities"

# Test WMTS GetCapabilities
curl "https://geoserver.your-org.com/geoserver/gwc/service/wmts?REQUEST=GetCapabilities"

# Test specific layer
curl "https://geoserver.your-org.com/geoserver/MUM_CLIMATE/wms?service=WMS&version=1.1.0&request=GetMap&layers=MUM_CLIMATE:HHI_2025&bbox=72.7,18.8,73.0,19.3&width=800&height=600&srs=EPSG:4326&format=image/png"
```

### Check Layer Names

```bash
# List all layers in workspace
curl "https://geoserver.your-org.com/geoserver/rest/workspaces/MUM_CLIMATE/layers" \
  -u admin:geoserver
```

---

## 🚨 Common Migration Issues

### Issue: "Layer not found" errors

**Cause:** Layer names don't match exactly (case-sensitive)

**Solution:**
1. Check GeoServer layer list
2. Verify workspace name matches
3. Ensure layer names use exact capitalization
4. Check for typos in configuration

### Issue: Map doesn't center on city

**Cause:** Incorrect coordinates

**Solution:**
1. Use decimal degrees, not DMS format
2. Format: `{ lng: number, lat: number }`
3. Verify longitude comes before latitude
4. Check coordinates are in WGS84 (EPSG:4326)

### Issue: Scenarios don't switch

**Cause:** Missing layers for scenarios

**Solution:**
1. Publish all scenario layers (SSP1, SSP2, SSP5)
2. Update `layerScenarioMap` with correct layer names
3. Check layer names follow naming convention
4. Verify projection layers exist in GeoServer

### Issue: Ward filtering not working

**Cause:** Missing or incorrect Ward attribute

**Solution:**
1. Ensure all layers have `Ward` attribute (integer)
2. Check attribute name matches `WARD_CONFIG.labelField`
3. Verify ward numbers are numeric, not strings
4. Test CQL filter in GeoServer preview

---

## 📊 Data Migration Checklist

### Spatial Data Preparation

- [ ] Heat stress rasters reprojected to EPSG:3857
- [ ] Air pollution rasters reprojected to EPSG:3857
- [ ] Flood raster reprojected to EPSG:3857
- [ ] Road network has Ward attribute
- [ ] Road network has iRAP rating attributes (1-5)
- [ ] Buildings have Height attribute (meters)
- [ ] Buildings have Ward attribute
- [ ] Infrastructure points have required attributes
- [ ] All shapefiles use UTF-8 encoding

### Attribute Requirements

**Road Network:**
```
Ward (integer): 1-227
Type (string): e.g., "Primary", "Secondary"
iRAP_Vehicle (integer): 1-5
iRAP_Motorcycle (integer): 1-5
iRAP_Bicycle (integer): 1-5
iRAP_Pedestrian (integer): 1-5
Length (float): km
```

**Buildings:**
```
Ward (integer): 1-227
Height (float): meters
Type (string): e.g., "Residential", "Commercial"
Area (float): square meters
```

**Infrastructure (Schools/Hospitals/etc.):**
```
Name (string): Facility name
Type (string): Category
Ward (integer): 1-227
geometry: Point (latitude/longitude)
```

---

## ✅ Migration Complete!

Once you've completed all steps:

1. ✅ Configuration updated
2. ✅ GeoServer layers published
3. ✅ Content customized
4. ✅ Testing complete
5. ✅ Ready for deployment

Your city-specific dashboard is ready!

---

**Migration Version:** 1.0  
**Last Updated:** 2024
