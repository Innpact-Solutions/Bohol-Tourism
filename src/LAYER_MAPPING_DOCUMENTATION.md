# Complete Layer Mapping Documentation
## GIZ Bohol CWIS Dashboard - Left Panel to GeoServer Layers

This document provides a comprehensive mapping of all layers in the left side panel to their corresponding GeoServer layer names.

---

## 📊 Overview

The dashboard organizes layers into 4 main categories:
1. **Base Layers** (8 layers) - Foundational geographic data
2. **Data Layers** (4 building categories with subcategories)
3. **Climate Hazard Layers** (6 CWIS hazard layers)
4. **Environmental Sensitivity Layers** (4 environmental layers)

---

## 1️⃣ BASE LAYERS (8 Layers)

### Base Layer Configuration
**Location**: `/components/LeftDrawer.tsx` lines 648-709  
**GeoServer Config**: `/config/geoserverLayers.ts` lines 360-409

| Left Panel ID | Left Panel Name | GeoServer Layer | Workspace | Rendering Type | Field Support |
|--------------|-----------------|-----------------|-----------|----------------|---------------|
| `municipal_boundary` | Municipal Boundary | `Municipal_Boundary` | `GIZ_BBSR` | **Vector (WFS)** | MunName |
| `ward_boundary` | Barangay Boundary | `Barangay_Boundary` | `WorldBank_Bohol` | **Vector (WFS)** | BrgyName, BrgyID, MunName |
| `road_network_base` | Road Network | `Road_Network_IRAP` | `WorldBank_Bohol` | **MVT (Vector Tiles)** | MunName, BrgyName, Road_Class |
| `waterbody` | Waterbody | `Waterbody` | `GIZ_BBSR` | **Vector (WFS)** | - |
| `elevation` | Elevation | `Elevation` | `WorldBank_Bohol` | **Raster (WMS)** | - |
| `watershed` | Watershed and Drainage | `Drainage_Network` | `WorldBank_Bohol` | **Vector (WFS)** | Watershed_ID, Stream_Order |
| `green_cover` | Green Cover Index | `Green_Cover` | `YOUR_WORKSPACE` | **Raster (WMS)** | - |
| `buildings` | Buildings | `Buildings` | `WorldBank_Bohol` | **MVT (Vector Tiles)** | MunName, BrgyName, Building_Use |

---

## 2️⃣ DATA LAYERS (Building Categories)

### Building Categories Configuration
**Location**: `/components/LeftDrawer.tsx` lines 711-800  
**GeoServer Layer**: `WorldBank_Bohol:Buildings`  
**Rendering**: MVT (Mapbox Vector Tiles) with CQL_FILTER

| Category ID | Category Name | Subcategories (Building_Use field values) | Icon | Color |
|------------|---------------|------------------------------------------|------|-------|
| `residential` | Residential | `Residential` | Home | #EAB308 |
| `commercial` | Commercial & Retail | `Commercial / Service`, `Commercial Other / Market`, `Personal Service`, `Restaurant / Food Service`, `Retail / Shop`, `Small Commercial` | ShoppingBag | #3B82F6 |
| `tourism` | Tourism & Hospitality | `Hotel / Lodging`, `Resort / Tourism Accommodation`, `Tourism Apartment / Villa Compound` | Plane | #8B5CF6 |
| `education` | Education & Institutional | `Education`, `Government / Public Service`, `Healthcare`, `Religious` | GraduationCap | #06B6D4 |

**Filtering Mechanism**:
- LGU Filter: `CQL_FILTER=MunName='${munName}'`
- Barangay Filter: `CQL_FILTER=BrgyName='${brgyName}'`
- Building Type Filter: `CQL_FILTER=Building_Use='${category}'`
- Combined: `CQL_FILTER=MunName='X' AND BrgyName='Y' AND Building_Use='Z'`

---

## 3️⃣ CLIMATE HAZARD LAYERS (6 CWIS Layers)

### CWIS Layer Configuration
**Location**: `/config/cwisLayersConfig.ts` lines 20-75  
**Workspace**: `WorldBank_Bohol`  
**Rendering**: WMS (Web Map Service)  
**Status**: **Storm Surge ENABLED**, other 5 layers remain placeholders

| Left Panel ID | Left Panel Name | GeoServer Layer | Status | Unit | Notes |
|--------------|-----------------|-----------------|--------|------|-------|
| `flood_hazard` | Flood Hazard | `PLACEHOLDER_FloodHazard` | 🚧 Not Connected | Hazard Level | Will be linked later |
| `storm_surge` | Storm Surge | `StormSurge` | ✅ **CONNECTED** | Inundation Depth | **ACTIVE - Fully functional** |
| `urban_waterlogging` | Urban Waterlogging | `PLACEHOLDER_UrbanWaterlogging` | 🚧 Not Connected | Waterlogging Susceptibility | Will be linked later |
| `land_surface_temperature` | Land Surface Temperature | `PLACEHOLDER_LandSurfaceTemperature` | 🚧 Not Connected | °C (Degrees Celsius) | Will be linked later |
| `urban_heat_island` | Urban Heat Island | `PLACEHOLDER_UrbanHeatIsland` | 🚧 Not Connected | °C (Anomaly) | Will be linked later |
| `wet_bulb_temperature` | Wet Bulb Temperature | `PLACEHOLDER_WetBulbTemperature` | 🚧 Not Connected | °C (Wet-Bulb) | Will be linked later |

### ✅ Storm Surge Layer - FULLY ENABLED

**GeoServer Configuration:**
- Full Layer Name: `WorldBank_Bohol:StormSurge`
- WMS Endpoint: `https://geoserver.azure.innpact.ai/geoserver/WorldBank_Bohol/wms`
- SRS: EPSG:3857 (Web Mercator)
- Format: image/png (transparent)

**Legend Configuration:**
```typescript
'StormSurge': [
  { gridcode: 1, color: '#EDF8FB', label: '0-0.5 m', description: 'Minimal inundation depth' },
  { gridcode: 2, color: '#B3CDE3', label: '0.5-1.0 m', description: 'Low inundation depth' },
  { gridcode: 3, color: '#8C96C6', label: '1.0-2.0 m', description: 'Moderate inundation depth' },
  { gridcode: 4, color: '#8856A7', label: '2.0-3.0 m', description: 'High inundation depth' },
  { gridcode: 5, color: '#810F7C', label: '> 3.0 m', description: 'Very high inundation depth' },
]
```

**Filtering Support:**
- ✅ LGU Filter: `CQL_FILTER=MunName='Tagbilaran City'`
- ✅ Barangay Filter: `CQL_FILTER=BrgyName='Poblacion I'`
- ✅ Combined Filters: `CQL_FILTER=MunName='X' AND BrgyName='Y'`

**Files Modified for Storm Surge:**
1. `/config/cwisLayersConfig.ts` - Layer configuration updated (workspace: `WorldBank_Bohol`, layer: `StormSurge`)
2. `/config/geoserverLayers.ts` - Scenario mapping enabled for all 4 scenarios
3. `/utils/legendLoader.ts` - Layer ID mapping: `storm_surge` → `StormSurge`
4. `/data/legendDefinitions.ts` - Legend color scale enabled (5 gridcodes)
5. `/components/MapCanvas.tsx` - Rendering enabled with WMS forcing

**⚠️ Other 5 CWIS Layers - Still Disabled:**
- Other layers appear in the left panel UI but will not render on the map
- Console will show: `⚠️ CWIS layer rendering disabled - GeoServer not yet connected`
- Legend definitions are commented out
- WMS URL generation returns `null` for placeholder layers

**To Enable Additional CWIS Layers Later:**
1. Update `/config/cwisLayersConfig.ts` - Replace `PLACEHOLDER_WORKSPACE` and `PLACEHOLDER_LayerName` with actual values
2. Uncomment relevant layer in `/config/geoserverLayers.ts` - Scenario mappings
3. Uncomment relevant layer in `/utils/legendLoader.ts` - Layer ID mappings
4. Uncomment relevant layer in `/data/legendDefinitions.ts` - Legend color scales
5. Update `/components/MapCanvas.tsx` line 1721 - Add layer ID to the exception list (like Storm Surge)

---

## 4️⃣ ENVIRONMENTAL SENSITIVITY LAYERS (4 Layers)

### Environmental Layers Configuration
**Location**: `/components/LeftDrawer.tsx` lines 640-646  
**Type**: Raster layers (expected but currently showing placeholder)

| Left Panel ID | Left Panel Name | Expected GeoServer Layer | Status | Icon | Color |
|--------------|-----------------|-------------------------|--------|------|-------|
| `soil_classification` | Soil Classification | `WorldBank_Bohol:SoilClassification` | 🚧 Not yet connected | Mountain | #8B5CF6 |
| `groundwater_depth` | Groundwater Depth | `WorldBank_Bohol:GroundwaterDepth` | 🚧 Not yet connected | Droplets | #3B82F6 |
| `geology` | Geology | `WorldBank_Bohol:Geology` | 🚧 Not yet connected | Layers | #F59E0B |
| `sinkhole` | Sinkhole | `WorldBank_Bohol:Sinkhole` | 🚧 Not yet connected | AlertTriangle | #EF4444 |

**Note**: These layers are defined in the UI but not yet fully integrated with GeoServer layers. They appear in the left panel under the Infrastructure sector.

---

## 🗺️ INFRASTRUCTURE OVERLAY LAYERS (4 Categories)

These are data overlays rendered from WFS point data, NOT raster layers.

### Infrastructure Layer Configuration
**Workspace**: `WorldBank_Bohol`  
**Rendering**: Clustered Point Layers (WFS GeoJSON)  
**Filtering**: Supports MunName and BrgyName filtering

| Layer ID | Layer Name | GeoServer Layer | Type Field | Rendering |
|----------|-----------|-----------------|------------|-----------|
| `educational` | Educational | `Education` | `Type` | Clustered points with subcategory filtering |
| `healthcare` | Healthcare | `Healthcare` | `Type` | Clustered points with subcategory filtering |
| `public_amenities` | Public Amenities | `PublicAmenities` | `Type` | Clustered points with subcategory filtering |
| `transport_mobility` | Transport & Mobility | `Transport` | `Type` | Clustered points with subcategory filtering |

**WFS URL Example**:
```
https://geoserver.azure.innpact.ai/geoserver/WorldBank_Bohol/ows?
  service=WFS&
  version=1.0.0&
  request=GetFeature&
  typeName=WorldBank_Bohol:Education&
  outputFormat=application/json&
  srsName=EPSG:4326&
  CQL_FILTER=MunName='Tagbilaran City' AND BrgyName='Poblacion I' AND Type='Elementary School'
```

---

## 🔧 Key Configuration Files

### 1. `/config/geoserverLayers.ts`
- **Purpose**: Main GeoServer layer configuration
- **Contains**: Heat stress layers, air pollution layers, flood layers, multi-hazard, base layers
- **Key Function**: `getLayerNameForScenario(layerId, scenario)` - Maps layer ID + scenario to GeoServer layer name
- **Key Function**: `getWMSTileUrl(layerName, wardNumber, forceWMS, categoryName, munName, brgyName)` - Builds WMS tile URLs with CQL filters

### 2. `/config/cwisLayersConfig.ts`
- **Purpose**: CWIS-specific climate hazard layer configuration
- **Contains**: 6 CWIS hazard layers (flood, storm surge, waterlogging, LST, UHI, WBT)
- **Key Function**: `getCWISLayerFullName(layerId)` - Returns `workspace:layerName`
- **Key Function**: `getCWISLayerWMSUrl(layerId, munName, brgyName)` - Builds WMS URL with filtering

### 3. `/components/LeftDrawer.tsx`
- **Purpose**: Left panel UI definition
- **Contains**: All layer definitions, icons, colors, subcategories
- **Lines 648-709**: Base layers array
- **Lines 711-800**: Building use categories array
- **Lines 640-646**: Environmental sensitivity layers array

### 4. `/components/MapCanvas.tsx`
- **Purpose**: Main map rendering component
- **Line 1717**: CWIS layer detection
- **Line 1721**: Force WMS for CWIS layers
- **Line 1722**: Call to `getWMSTileUrl` with all filters
- **Line 2137-3596**: Base layer loading and rendering
- **Line 5037+**: Infrastructure layer rendering (education, healthcare, etc.)

### 5. `/utils/legendLoader.ts`
- **Purpose**: Legend system integration
- **Contains**: Mapping from layer IDs to legend definitions
- **Lines 30-35**: CWIS layer to legend name mapping

### 6. `/data/legendDefinitions.ts`
- **Purpose**: Legend color scales and value definitions
- **Contains**: Complete legend definitions for all 6 CWIS layers
- **Format**: Each layer has `type`, `colors`, `values`, `labels`, `unit`

---

## 🎯 Filtering System

### Filter Hierarchy (Most Specific to Least Specific)
1. **Barangay Filter** (`BrgyName`) - Most specific
2. **LGU Filter** (`MunName`) - Municipality level
3. **Ward Filter** (`Ward`) - Legacy system (not actively used)
4. **Category Filter** (`Type` or `Building_Use`) - For point data and buildings

### Filter Application

**Base Layers (Raster)**:
```typescript
getWMSTileUrl(
  geoserverLayerName,     // e.g., 'WorldBank_Bohol:Elevation'
  wardNumberForFilter,    // Ward number (legacy, usually null)
  forceWMS,              // true for CWIS layers
  selectedDonutCategory,  // null for base layers
  munNameForFilter,      // e.g., 'Tagbilaran City'
  brgyNameForFilter      // e.g., 'Poblacion I'
)
```

**CWIS Climate Hazard Layers (Raster)**:
```typescript
getWMSTileUrl(
  'WorldBank_Bohol:StormSurge',
  null,                  // No ward filter
  true,                  // Force WMS
  null,                  // No category filter
  'Tagbilaran City',     // LGU filter
  'Poblacion I'          // Barangay filter
)
```

**Building Layers (Vector)**:
```typescript
// MVT tile URL with CQL_FILTER
const filters = [];
if (munName) filters.push(`MunName='${munName}'`);
if (brgyName) filters.push(`BrgyName='${brgyName}'`);
if (buildingUse) filters.push(`Building_Use='${buildingUse}'`);
const cqlFilter = filters.join(' AND ');
```

**Infrastructure Layers (Point WFS)**:
```typescript
// WFS URL with CQL_FILTER
const WFS_URL = `...&CQL_FILTER=${encodeURIComponent(
  `MunName='${munName}' AND BrgyName='${brgyName}' AND Type='${type}'`
)}`;
```

---

## 🚀 Recent Changes (Current Session)

### Issue #1: Storm Surge Layer Legend Missing ✅ FIXED
**Problem**: Console warnings "Unknown layer ID: storm_surge"  
**Root Cause**: 6 CWIS layers not integrated into legend system  
**Solution**:
1. Added layer mappings to `/utils/legendLoader.ts`
2. Added complete legend definitions to `/data/legendDefinitions.ts`
3. Added WMS forcing for CWIS layers in `/components/MapCanvas.tsx`

### Issue #2: Barangay Filtering Not Working ✅ FIXED
**Problem**: Buildings not displaying when barangay filter applied  
**Root Cause**: `getWMSTileUrl()` didn't support barangay filtering  
**Solution**:
1. Added `brgyName` parameter to `getWMSTileUrl()` function
2. Added `BrgyName='${brgyName}'` to CQL_FILTER logic
3. Updated all `getWMSTileUrl()` calls to pass barangay filter
4. Applied to both hazard layers and base layers

---

## 📝 Field Name Standards

All GeoServer layers use standardized field names for filtering:

| Field Name | Purpose | Data Type | Example Values |
|-----------|---------|-----------|----------------|
| `MunName` | Municipality/LGU name | String | `Tagbilaran City`, `Dauis`, `Panglao` |
| `BrgyName` | Barangay name | String | `Poblacion I`, `Cogon`, `Dampas` |
| `BrgyID` | Unique barangay identifier | String | `072201001`, `072201002` |
| `Ward` | Ward number (legacy) | Integer | `1`, `2`, `3` |
| `Building_Use` | Building category | String | `Residential`, `Commercial / Service` |
| `Type` | Infrastructure type | String | `Elementary School`, `Barangay Health Station` |
| `Road_Class` | Road classification | String | `National Highway`, `Major Roads` |
| `Watershed_ID` | Watershed identifier | String | Various watershed IDs |
| `Stream_Order` | Stream order classification | Integer | `1`, `2`, `3`, `4`, `5` |

---

## 🔍 Debugging Tips

### Check Layer Loading
```javascript
// Console output from MapCanvas.tsx
console.log('🔍 [LAYER LOAD] Layer classification:', { isHeatStressLayer, isCWISLayer });
console.log('📡📡📡 [LAYER LOAD] WMS Tile URL:', tileUrl);
console.log('🔍 [LAYER LOAD] Applying LGU filter:', munNameForFilter);
console.log('🔍 [LAYER LOAD] Applying Barangay filter:', brgyNameForFilter);
```

### Check Legend Loading
```javascript
// Console output from legendLoader.ts
console.log('🗺️ [getUILayerLegend] Mapped to GeoServer layer:', geoserverLayerName);
console.log('📋 [getUILayerLegend] Legend definition found');
```

### Check Filter Application
```javascript
// Console output from geoserverLayers.ts
console.log('🌐 [getWMSTileUrl] Called with:', { layerName, munName, brgyName });
console.log('🌐 [getWMSTileUrl] Applied CQL_FILTER:', cqlFilter);
```

---

## 📞 Support

For questions about layer mapping or GeoServer configuration, refer to:
- GeoServer Layer Config: `/config/geoserverLayers.ts`
- CWIS Layer Config: `/config/cwisLayersConfig.ts`
- Left Drawer UI: `/components/LeftDrawer.tsx`
- Map Rendering: `/components/MapCanvas.tsx`

---

**Last Updated**: Current session  
**Dashboard Version**: GIZ Bohol CWIS Decision Support Dashboard  
**GeoServer Workspace**: `WorldBank_Bohol` (primary), `GIZ_BBSR` (boundaries, waterbody)