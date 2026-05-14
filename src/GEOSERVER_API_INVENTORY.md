# GeoServer & API Data Source Inventory
## Bohol CWIS Dashboard - Complete Database & API Reference

---

## 🌐 GeoServer Instance
**Base URL:** `https://geoserver.azure.innpact.ai/geoserver/`

---

## 📊 WORKSPACES (Databases)

### 1. ✅ **WorldBank_Bohol** (ACTIVE - Bohol CWIS Data)
Primary workspace for all Bohol-specific CWIS dashboard data

### 2. ⚠️ **GIZ_BBSR** (DEPRECATED - Old Project Data)
Old workspace from previous Bhubaneswar/Mumbai climate dashboard
**Status:** Should be removed/replaced with Bohol data

---

## 🗺️ ACTIVE LAYERS (WorldBank_Bohol Workspace)

### **Administrative Boundaries**

| Layer Name | Type | Format | Used In | Filter Fields | Status |
|------------|------|--------|---------|--------------|--------|
| `Barangay_Boundary` | WFS | GeoJSON | MapCanvas, Header, ComparisonView, HistoricalTrendsPanel, App.tsx | `MunName`, `BrgyName`, `BrgyID` | ✅ Active |
| `Barangay_Boundary_Point` | WFS | GeoJSON | MapCanvas, ComparisonView, HistoricalTrendsPanel | `MunName`, `BrgyName`, `BrgyID` | ✅ Active |
| `Municipal_Boundary` | WFS | GeoJSON | MapCanvas, ComparisonView, HistoricalTrendsPanel, App.tsx | `MunName` | ✅ Active |
| `Municipal_Boundary_Point` | WFS | GeoJSON | MapCanvas | `MunName` | ✅ Active |

**Purpose:** Administrative boundary filtering for 3 municipalities (Tagbilaran City, Dauis, Panglao)

**Files Using:**
- `/App.tsx` - LGU zoom (line 883), Barangay zoom (line 965)
- `/components/Header.tsx` - Barangay dropdown (line 75)
- `/components/MapCanvas.tsx` - Boundary rendering (line 1148, 10338, 10532, 11030, 11171)
- `/components/ComparisonView.tsx` - Scenario comparison (line 436, 759, 827)
- `/components/HistoricalTrendsPanel.tsx` - Historical trends (line 611, 1662, 1803)

---

### **Base Layers (Data Layers)**

| Layer Name | Type | Format | Used In | Filter Fields | Status |
|------------|------|--------|---------|--------------|--------|
| `Buildings` | WMS | Raster Tiles | MapCanvas, ComparisonView, HistoricalTrendsPanel | `MunName`, `BrgyName` | ✅ Active |
| `Road_Network` | WMS | Raster Tiles | MapCanvas, ComparisonView, HistoricalTrendsPanel | `MunName`, `BrgyName` | ✅ Active |

**Purpose:** Building footprints and road network visualization

**Files Using:**
- `/components/MapCanvas.tsx` - Building layer (line 2500, 2505)
- `/components/ComparisonView.tsx` - Road layer (line 1318, 1323), Buildings (line 2023, 2028, 2494, 2499)
- `/components/HistoricalTrendsPanel.tsx` - Road (line 2194, 2199), Buildings (line 2436, 2441)

---

### **CWIS Climate Hazard Layers** (6 layers)

| Layer Name | ID | Workspace | Filter Fields | Status |
|------------|-----|-----------|--------------|--------|
| `StormSurge` | `storm_surge` | WorldBank_Bohol | `MunName`, `BrgyName` | ✅ Connected |
| Flood Hazard | `flood_hazard` | PLACEHOLDER | - | ⚠️ Placeholder |
| Urban Waterlogging | `urban_waterlogging` | PLACEHOLDER | - | ⚠️ Placeholder |
| Land Surface Temperature | `land_surface_temperature` | PLACEHOLDER | - | ⚠️ Placeholder |
| Urban Heat Island | `urban_heat_island` | PLACEHOLDER | - | ⚠️ Placeholder |
| Wet Bulb Temperature | `wet_bulb_temperature` | PLACEHOLDER | - | ⚠️ Placeholder |

**Configuration File:** `/config/cwisLayersConfig.ts`

**Files Using:**
- `/components/MapCanvas.tsx` - Layer rendering (line 1707-1708)
- `/components/LeftDrawer.tsx` - UI controls for 6 CWIS layers

**Console Warnings:** Placeholder layers will show warnings when clicked (expected behavior)

---

### **Environmental Sensitivity Layers** (4 layers)

| Layer Name | ID | Workspace | Filter Fields | Status |
|------------|-----|-----------|--------------|--------|
| `SoilClassification` | `soil_classification` | WorldBank_Bohol | `MunName`, `BrgyName` | ✅ Connected |
| `GroundWater` | `groundwater_depth` | WorldBank_Bohol | `MunName`, `BrgyName` | ✅ Connected |
| `Geology` | `geology` | WorldBank_Bohol | `MunName`, `BrgyName` | ✅ Connected |
| Sinkhole | `sinkhole` | PLACEHOLDER | - | ⚠️ Placeholder |

**Configuration File:** `/config/environmentalLayers.ts`

**Files Using:**
- `/components/MapCanvas.tsx` - Layer rendering (line 1744-1745)
- `/components/LeftDrawer.tsx` - UI controls for 4 environmental layers

**Features:**
- Soil Classification: 7 soil types
- Groundwater Depth: 5 depth categories
- Geology: 2 geological formations (Alluvium, Maribojoc Limestone)

---

### **Watershed & Drainage Layers**

| Layer Name | Type | Format | Used In | Filter Fields | Status |
|------------|------|--------|---------|--------------|--------|
| `Watershed` | WFS | GeoJSON | MapCanvas | `MunName`, `BrgyName` | ✅ Active |
| `Drainage` | WFS | GeoJSON | MapCanvas | `MunName`, `BrgyName` | ✅ Active |
| `Drain_Outfall` | WFS | GeoJSON | MapCanvas | `MunName`, `BrgyName` | ✅ Active |
| `Watershed_Point` | WFS | GeoJSON | MapCanvas | `MunName`, `BrgyName` | ✅ Active |

**Purpose:** Watershed management and drainage infrastructure

**Files Using:**
- `/components/MapCanvas.tsx` - Watershed (line 3298-3299), Drainage (line 3388), Drain Outfall (line 3453), Watershed Points (line 3572)

**Part of:** Base Layers section (toggle-able from left drawer)

---

## ❌ DEPRECATED LAYERS (GIZ_BBSR Workspace - TO BE REMOVED)

### **Old Project Layers (Not Applicable to Bohol)**

| Layer Name | Type | Old Project | Current Status | Recommendation |
|------------|------|-------------|----------------|----------------|
| `GIZ_BBSR:Waterbody` | WFS | Bhubaneswar | ✅ REMOVED | 🗑️ All references removed |
| `GIZ_BBSR:Municipal_Boundary` | WFS | Bhubaneswar | ✅ REMOVED | 🗑️ All references removed, using WorldBank_Bohol version |
| `GIZ_BBSR:Slum` | WFS | Mumbai/Bhubaneswar | ✅ REMOVED | 🗑️ All references removed |
| `GIZ_BBSR:Ward_Boundary` | WMS | Mumbai/Bhubaneswar | ✅ REMOVED | 🗑️ All references removed, using Barangay_Boundary |
| `GIZ_BBSR:Road_Safety` | WFS | iRAP data | ✅ REMOVED | 🗑️ All references removed |

**Files Cleaned Up:**
- ✅ `/utils/areaCalculation.ts` - Updated to WorldBank_Bohol workspace
- ✅ `/utils/impactDistributionData.ts` - Updated to WorldBank_Bohol workspace
- ✅ `/components/MapCanvas.tsx` - Disabled Slum, Waterbody, Ward_Boundary, Road_Safety
- ✅ `/components/ComparisonView.tsx` - Disabled Waterbody, Municipal_Boundary
- ✅ `/components/HistoricalTrendsPanel.tsx` - Disabled Municipal_Boundary, Waterbody
- ✅ `/components/RoadNameFilter.tsx` - Disabled Road_Safety
- ✅ `/components/QueryPanel.tsx` - Cleaned up commented Ward_Boundary code

**Console Errors Eliminated:** All GIZ_BBSR 404 errors removed! ✅

---

## 🔧 CONFIGURATION FILES

### **1. GeoServer Layers Config**
**File:** `/config/geoserverLayers.ts`
**Purpose:** Placeholder for heat/climate layers (not used in CWIS dashboard)
**Status:** ⚠️ Template file, contains placeholder data

### **2. CWIS Layers Config**
**File:** `/config/cwisLayersConfig.ts`
**Purpose:** 6 CWIS climate hazard layers
**Connected:** 1/6 (Storm Surge only)
**Function:** `getCWISLayerWMSUrl(layerId, munName, brgyName)`

### **3. Environmental Layers Config**
**File:** `/config/environmentalLayers.ts`
**Purpose:** 4 environmental sensitivity layers
**Connected:** 3/4 (Soil, Groundwater, Geology)
**Function:** `getEnvironmentalLayerWMSUrl(layerId, munName, brgyName)`

### **4. City Config**
**File:** `/config/cityConfig.ts`
**Purpose:** City-specific configuration (Bohol municipalities, barangays)

---

## 🔍 FILTER FIELD STANDARDIZATION

All WorldBank_Bohol layers use standardized filter fields:

| Field Name | Type | Purpose | Example Values |
|------------|------|---------|----------------|
| `MunName` | String | Municipality/LGU filtering | "Tagbilaran City", "Dauis", "Panglao" |
| `BrgyName` | String | Barangay filtering | "Poblacion 1", "Cogon", "Dampas" |
| `BrgyID` | String | Unique barangay identifier | "072202001", "072203001" |

**Applied Across:** All overlay layers (Buildings, Roads, CWIS layers, Environmental layers, Watershed)

---

## 📋 CLEANUP RECOMMENDATIONS

### **High Priority (Causing Console Errors)**

1. **Remove GIZ_BBSR Waterbody references**
   - Files: ComparisonView.tsx, HistoricalTrendsPanel.tsx, MapCanvas.tsx
   - Replace with WorldBank_Bohol waterbody layer (if available)

2. **Remove GIZ_BBSR Municipal_Boundary duplicate**
   - Files: ComparisonView.tsx, HistoricalTrendsPanel.tsx
   - Already using WorldBank_Bohol:Municipal_Boundary

3. **Remove Slum layer references**
   - Files: MapCanvas.tsx
   - Not applicable to Bohol context

4. **Remove/Replace Road Safety (iRAP) references**
   - Files: MapCanvas.tsx, RoadNameFilter.tsx
   - Currently hidden in UI (infrastructure section disabled)

5. **Remove Ward_Boundary references**
   - Files: MapCanvas.tsx
   - Old structure, using Barangay_Boundary instead

### **Medium Priority (Placeholder Warnings)**

6. **Connect remaining CWIS layers** (5 layers pending)
   - Update `/config/cwisLayersConfig.ts`
   - Add GeoServer layer names and workspace

7. **Connect Sinkhole environmental layer**
   - Update `/config/environmentalLayers.ts`

### **Low Priority (Code Cleanup)**

8. **Clean up commented code**
   - QueryPanel.tsx - Remove old commented WFS calls

9. **Update geoserverLayers.ts**
   - Remove placeholder template data
   - Configure for Bohol-specific needs (if needed)

---

## 🎯 SUMMARY

### **Total Layers Inventory:**
- ✅ **Active & Connected:** 15 layers
- ⚠️ **Placeholder (Not Connected):** 6 layers
- ❌ **Deprecated (To Remove):** 5 layers
- 📊 **Total:** 26 layer references

### **Active Workspaces:**
- ✅ WorldBank_Bohol (primary)
- ❌ GIZ_BBSR (deprecated, remove)

### **Console Error Sources:**
1. GIZ_BBSR workspace layers (404 errors)
2. Placeholder CWIS layers (warning messages)
3. Placeholder environmental layers (warning messages)

### **Files Requiring Cleanup:**
- `/components/MapCanvas.tsx` (most references)
- `/components/ComparisonView.tsx`
- `/components/HistoricalTrendsPanel.tsx`
- `/components/RoadNameFilter.tsx`
- `/components/QueryPanel.tsx`

---

## 📞 Next Steps

**To eliminate console errors:**
1. Remove all `GIZ_BBSR` workspace references
2. Connect placeholder CWIS layers OR hide them from UI
3. Connect Sinkhole layer OR hide from UI
4. Clean up old commented code

**Would you like me to proceed with removing the deprecated GIZ_BBSR references?**