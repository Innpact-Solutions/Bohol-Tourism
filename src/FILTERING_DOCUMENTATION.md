# 🔍 LGU and Barangay Filtering Documentation

## Overview
All layers in **Climate Hazard Layers** and **Environmental Sensitivity Layers** support automatic filtering based on the LGU and Barangay dropdowns in the header using standardized field names.

---

## 📋 Standardized Field Names

### Required Fields in GeoServer Layers
All layers that support filtering must have these exact field names in their attribute table:

| Field Name | Type | Purpose | Example Values |
|------------|------|---------|----------------|
| `MunName` | String | Municipality/LGU name | "Tagbilaran City", "Dauis", "Panglao" |
| `BrgyName` | String | Barangay name | "Poblacion 1", "Cogon", "Tawala" |

---

## 🌊 Climate Hazard Layers (6 Layers)

### Configuration File
`/config/cwisLayersConfig.ts`

### Supported Layers
1. **Storm Surge** ✅ ENABLED
   - Layer: `WorldBank_Bohol:StormSurge`
   - Filtering: LGU (`MunName`) + Barangay (`BrgyName`)
   
2. **Flood Hazard** ⚠️ PLACEHOLDER
   - To enable: Set `workspace` and `geoserverLayer` in config
   - Filtering: LGU (`MunName`) + Barangay (`BrgyName`)
   
3. **Urban Waterlogging** ⚠️ PLACEHOLDER
   - To enable: Set `workspace` and `geoserverLayer` in config
   - Filtering: LGU (`MunName`) + Barangay (`BrgyName`)
   
4. **Land Surface Temperature** ⚠️ PLACEHOLDER
   - To enable: Set `workspace` and `geoserverLayer` in config
   - Filtering: LGU (`MunName`) + Barangay (`BrgyName`)
   
5. **Urban Heat Island** ⚠️ PLACEHOLDER
   - To enable: Set `workspace` and `geoserverLayer` in config
   - Filtering: LGU (`MunName`) + Barangay (`BrgyName`)
   
6. **Wet Bulb Temperature** ⚠️ PLACEHOLDER
   - To enable: Set `workspace` and `geoserverLayer` in config
   - Filtering: LGU (`MunName`) + Barangay (`BrgyName`)

### How CWIS Filtering Works
```typescript
// When user selects LGU or Barangay in header
getCWISLayerWMSUrl('storm_surge', 'Tagbilaran City', 'Poblacion 1')
// Generates WMS URL with CQL filter:
// CQL_FILTER=MunName='Tagbilaran City' AND BrgyName='Poblacion 1'
```

---

## 🌲 Environmental Sensitivity Layers (4 Layers)

### Configuration File
`/config/environmentalLayers.ts`

### Supported Layers
1. **Soil Classification** ✅ ENABLED
   - Layer: `WorldBank_Bohol:SoilClassification`
   - Filtering: LGU (`MunName`) + Barangay (`BrgyName`)
   
2. **Groundwater Depth** ⚠️ PLACEHOLDER
   - To enable: Set `enabled: true` and update `workspace` and `geoserverLayer`
   - Filtering: LGU (`MunName`) + Barangay (`BrgyName`)
   
3. **Geology** ⚠️ PLACEHOLDER
   - To enable: Set `enabled: true` and update `workspace` and `geoserverLayer`
   - Filtering: LGU (`MunName`) + Barangay (`BrgyName`)
   
4. **Sinkhole** ⚠️ PLACEHOLDER
   - To enable: Set `enabled: true` and update `workspace` and `geoserverLayer`
   - Filtering: LGU (`MunName`) + Barangay (`BrgyName`)

### How Environmental Filtering Works
```typescript
// When user selects LGU or Barangay in header
getEnvironmentalLayerWMSUrl('soil_classification', 'Dauis', null)
// Generates WMS URL with CQL filter:
// CQL_FILTER=MunName='Dauis'
```

---

## 🔧 How to Enable a New Layer

### For Climate Hazard Layers

**1. Edit `/config/cwisLayersConfig.ts`:**
```typescript
flood_hazard: {
  id: 'flood_hazard',
  name: 'Flood Hazard',
  geoserverLayer: 'FloodHazard',        // ← Update this
  workspace: 'WorldBank_Bohol',         // ← Update this
  opacity: 0.7,
  unit: 'Hazard Level',
  tooltip: 'Areas at risk of flooding during extreme weather events.'
}
```

**2. Ensure GeoServer layer has required fields:**
- `MunName` (text field)
- `BrgyName` (text field)

**3. Test filtering:**
- Enable layer in left panel
- Select LGU in header dropdown
- Select Barangay in header dropdown
- Layer should automatically filter

### For Environmental Sensitivity Layers

**1. Edit `/config/environmentalLayers.ts`:**
```typescript
soil_classification: {
  id: 'soil_classification',
  name: 'Soil Classification',
  geoserverLayer: 'SoilClassification', // ← Update this
  workspace: 'WorldBank_Bohol',         // ← Update this
  opacity: 0.7,
  unit: 'Soil Type',
  tooltip: 'Classification of soil types affecting sanitation infrastructure.',
  enabled: true                         // ← Set to true
}
```

**2. Ensure GeoServer layer has required fields:**
- `MunName` (text field)
- `BrgyName` (text field)

**3. Test filtering:**
- Enable layer in left panel
- Select LGU in header dropdown
- Select Barangay in header dropdown
- Layer should automatically filter

---

## 🎯 Filter Behavior

### LGU Filter Only
When user selects an LGU but no Barangay:
```
CQL_FILTER=MunName='Tagbilaran City'
```
Shows all features within that municipality.

### Barangay Filter Only
When user selects a Barangay but LGU is "All":
```
CQL_FILTER=BrgyName='Poblacion 1'
```
Shows all features in that Barangay (across all municipalities).

### Both Filters
When user selects both LGU and Barangay:
```
CQL_FILTER=MunName='Tagbilaran City' AND BrgyName='Poblacion 1'
```
Shows features in that specific Barangay within that municipality.

### No Filters
When both dropdowns are set to "All":
```
No CQL_FILTER applied
```
Shows all features across all municipalities and barangays.

---

## 🗺️ MapCanvas Integration

The filtering is handled automatically in `/components/MapCanvas.tsx`:

```typescript
// CWIS Layers
if (isCWISLayer) {
  const munNameForFilter = (selectedLguName && selectedLguName !== 'all') 
    ? selectedLguName : null;
  const brgyNameForFilter = (selectedWardName && selectedWardName !== 'all') 
    ? selectedWardName : null;
  
  tileUrl = getCWISLayerWMSUrl(layerId, munNameForFilter, brgyNameForFilter);
}

// Environmental Layers
if (isEnvironmentalLayer) {
  const munNameForFilter = (selectedLguName && selectedLguName !== 'all') 
    ? selectedLguName : null;
  const brgyNameForFilter = (selectedWardName && selectedWardName !== 'all') 
    ? selectedWardName : null;
  
  tileUrl = getEnvironmentalLayerWMSUrl(layerId, munNameForFilter, brgyNameForFilter);
}
```

---

## ✅ Current Status

### Fully Working
- ✅ Storm Surge (Climate Hazard)
  - LGU filtering: `MunName` ✅ WORKING
  - Barangay filtering: `BrgyName` ✅ WORKING
  - Auto-refresh on filter change: ✅ ENABLED

- ✅ Soil Classification (Environmental Sensitivity)
  - LGU filtering: `MunName` ✅ WORKING
  - Barangay filtering: `BrgyName` ✅ WORKING
  - Auto-refresh on filter change: ✅ ENABLED

### Ready to Enable (Need GeoServer layers)
- ⚠️ Flood Hazard
- ⚠️ Urban Waterlogging
- ⚠️ Land Surface Temperature
- ⚠️ Urban Heat Island
- ⚠️ Wet Bulb Temperature
- ⚠️ Groundwater Depth
- ⚠️ Geology
- ⚠️ Sinkhole

All placeholder layers are configured and ready. Simply update the workspace and layer names in the config files, and filtering will work automatically!

---

## 🔒 Important Notes

1. **Field Names are Locked**: All layers MUST use `MunName` and `BrgyName`
2. **No Code Changes Needed**: When enabling new layers, only config files need updates
3. **Automatic Filter Application**: MapCanvas applies filters automatically based on header selections
4. **Case Sensitive**: Filter values are case-sensitive and use exact matching
5. **Special Characters**: Single quotes in names are automatically escaped

---

## 📝 Testing Checklist

When enabling a new layer:

- [ ] Layer appears in left panel
- [ ] Layer renders on map when toggled on
- [ ] Setting LGU to "Tagbilaran City" filters layer correctly
- [ ] Setting Barangay to specific name filters layer correctly
- [ ] Setting both LGU and Barangay filters layer correctly
- [ ] Resetting filters to "All" shows complete layer
- [ ] Console logs show correct CQL_FILTER in WMS URL
- [ ] Layer legend displays correctly