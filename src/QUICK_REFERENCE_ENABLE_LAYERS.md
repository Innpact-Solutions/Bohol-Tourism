# 🚀 Quick Reference: Enable New Layers

This guide shows you exactly how to enable new CWIS Climate Hazard Layers and Environmental Sensitivity Layers.

---

## ✅ Currently Enabled Layers

### Climate Hazard Layers (1/6)
- ✅ **Storm Surge** - `WorldBank_Bohol:StormSurge`

### Environmental Sensitivity Layers (1/4)
- ✅ **Soil Classification** - `WorldBank_Bohol:SoilClassification`

---

## 📝 Step-by-Step: Enable a CWIS Climate Hazard Layer

### Example: Enable Flood Hazard

**1. Get the GeoServer Layer Name**
From GeoServer, identify:
- Workspace: `WorldBank_Bohol`
- Layer: `FloodHazard` (or whatever the actual layer name is)

**2. Edit `/config/cwisLayersConfig.ts`**
Find the `flood_hazard` entry and update:

```typescript
flood_hazard: {
  id: 'flood_hazard',
  name: 'Flood Hazard',
  geoserverLayer: 'FloodHazard',        // ← UPDATE THIS
  workspace: 'WorldBank_Bohol',         // ← UPDATE THIS
  opacity: 0.7,
  unit: 'Hazard Level',
  tooltip: 'Areas at risk of flooding during extreme weather events.'
}
```

**3. Verify Field Names in GeoServer**
Ensure the layer has these attribute fields:
- `MunName` (text) - for LGU filtering
- `BrgyName` (text) - for Barangay filtering

**4. Test**
- Refresh the dashboard
- Open Left Drawer → Climate Hazard Layers
- Toggle on "Flood Hazard"
- Try LGU and Barangay filters
- Check console for: `✅ Generated WMS URL for CWIS layer "flood_hazard"`

**Done!** The layer should now work with filtering.

---

## 📝 Step-by-Step: Enable an Environmental Sensitivity Layer

### Example: Enable Groundwater Depth

**1. Get the GeoServer Layer Name**
From GeoServer, identify:
- Workspace: `WorldBank_Bohol`
- Layer: `GroundwaterDepth` (or whatever the actual layer name is)

**2. Edit `/config/environmentalLayers.ts`**
Find the `groundwater_depth` entry and update:

```typescript
groundwater_depth: {
  id: 'groundwater_depth',
  name: 'Groundwater Depth',
  geoserverLayer: 'GroundwaterDepth',   // ← UPDATE THIS
  workspace: 'WorldBank_Bohol',         // ← UPDATE THIS
  opacity: 0.7,
  unit: 'Depth (m)',
  tooltip: 'Depth to groundwater table affecting septic systems and contamination risk.',
  enabled: true                         // ← SET TO TRUE
}
```

**3. Verify Field Names in GeoServer**
Ensure the layer has these attribute fields:
- `MunName` (text) - for LGU filtering
- `BrgyName` (text) - for Barangay filtering

**4. Test**
- Refresh the dashboard
- Open Left Drawer → Environmental Sensitivity Layers
- Toggle on "Groundwater Depth"
- Try LGU and Barangay filters
- Check console for: `✅ Generated WMS URL for Environmental layer "groundwater_depth"`

**Done!** The layer should now work with filtering.

---

## 🔑 Critical Requirements

### Every Layer MUST Have These Fields:

```sql
-- GeoServer Layer Attributes
MunName    VARCHAR  -- "Tagbilaran City", "Dauis", "Panglao"
BrgyName   VARCHAR  -- "Poblacion 1", "Cogon", "Tawala", etc.
```

### Field Name Rules:
- ✅ **Exactly** `MunName` (case-sensitive)
- ✅ **Exactly** `BrgyName` (case-sensitive)
- ❌ NOT `Municipality`, `MUN_NAME`, `munname`, etc.
- ❌ NOT `Barangay`, `BRGY_NAME`, `brgyname`, etc.

**If field names don't match exactly, filtering will not work!**

---

## 📋 Complete Layer Checklist

Use this when enabling any layer:

### CWIS Climate Hazard Layer Checklist
- [ ] Obtained GeoServer workspace name
- [ ] Obtained GeoServer layer name
- [ ] Verified layer has `MunName` field
- [ ] Verified layer has `BrgyName` field
- [ ] Updated `workspace` in `/config/cwisLayersConfig.ts`
- [ ] Updated `geoserverLayer` in `/config/cwisLayersConfig.ts`
- [ ] Tested layer toggle (on/off)
- [ ] Tested LGU filter (Tagbilaran City)
- [ ] Tested Barangay filter
- [ ] Tested combined LGU + Barangay filter
- [ ] Tested "Reset to All" filter
- [ ] Checked console logs for WMS URL
- [ ] Verified layer appears on map
- [ ] Verified layer stacks correctly

### Environmental Sensitivity Layer Checklist
- [ ] Obtained GeoServer workspace name
- [ ] Obtained GeoServer layer name
- [ ] Verified layer has `MunName` field
- [ ] Verified layer has `BrgyName` field
- [ ] Updated `workspace` in `/config/environmentalLayers.ts`
- [ ] Updated `geoserverLayer` in `/config/environmentalLayers.ts`
- [ ] Set `enabled: true` in config
- [ ] Tested layer toggle (on/off)
- [ ] Tested LGU filter (Tagbilaran City)
- [ ] Tested Barangay filter
- [ ] Tested combined LGU + Barangay filter
- [ ] Tested "Reset to All" filter
- [ ] Checked console logs for WMS URL
- [ ] Verified layer appears on map
- [ ] Verified layer stacks correctly

---

## 🛠️ Common Issues & Solutions

### Issue: Layer doesn't appear
**Solution**: Check console for error messages. Most common:
```
⚠️ CWIS layer "flood_hazard" not yet connected to GeoServer
```
→ You forgot to update `workspace` or `geoserverLayer` in config file

### Issue: Layer appears but doesn't filter
**Solution**: Check GeoServer layer attributes:
```sql
-- Run this query in GeoServer or database
SELECT MunName, BrgyName FROM your_layer LIMIT 1;
```
→ Field names must be exactly `MunName` and `BrgyName`

### Issue: Layer filters but shows wrong data
**Solution**: Check filter values in console:
```
🔍 [CWIS LAYER] Applying LGU filter: Tagbilaran City
```
→ Verify the municipality/barangay names match exactly (case-sensitive)

### Issue: Layer doesn't refresh when filter changes
**Solution**: Already fixed! The useEffect now includes `selectedLguName` and `selectedWardName` dependencies.

---

## 📚 Configuration Files Reference

### CWIS Climate Hazard Layers
**File**: `/config/cwisLayersConfig.ts`

**Layers**:
- `flood_hazard` - Flood Hazard
- `storm_surge` - Storm Surge ✅
- `urban_waterlogging` - Urban Waterlogging
- `land_surface_temperature` - Land Surface Temperature
- `urban_heat_island` - Urban Heat Island
- `wet_bulb_temperature` - Wet Bulb Temperature

### Environmental Sensitivity Layers
**File**: `/config/environmentalLayers.ts`

**Layers**:
- `soil_classification` - Soil Classification ✅
- `groundwater_depth` - Groundwater Depth
- `geology` - Geology
- `sinkhole` - Sinkhole

### MapCanvas Integration
**File**: `/components/MapCanvas.tsx`

**Layer Detection** (Line 1676):
```typescript
const isCWISLayer = ['flood_hazard', 'storm_surge', ...].includes(layerId);
const isEnvironmentalLayer = ['soil_classification', ...].includes(layerId);
```

**Layer Cleanup** (Line 1645):
```typescript
const layersToRemove = [..., 'storm_surge', ..., 'soil_classification', ...];
```

---

## 🎯 Filter Examples

### LGU Only
```javascript
// User selects: LGU = "Dauis"
CQL_FILTER = "MunName='Dauis'"
// Shows: All data within Dauis municipality
```

### Barangay Only
```javascript
// User selects: Barangay = "Poblacion 1"
CQL_FILTER = "BrgyName='Poblacion 1'"
// Shows: All data in Poblacion 1 (any municipality)
```

### Both LGU + Barangay
```javascript
// User selects: LGU = "Tagbilaran City", Barangay = "Cogon"
CQL_FILTER = "MunName='Tagbilaran City' AND BrgyName='Cogon'"
// Shows: Only data in Cogon within Tagbilaran City
```

### Reset to All
```javascript
// User selects: LGU = "All", Barangay = "All"
CQL_FILTER = (none)
// Shows: Complete layer across entire study area
```

---

## 💡 Pro Tips

1. **Always check console logs** - They show exactly what's happening with filters
2. **Test incrementally** - Enable one layer at a time
3. **Verify field names first** - Most issues come from mismatched field names
4. **Use exact names** - Filters are case-sensitive and require exact matches
5. **Check GeoServer directly** - Verify layer exists and has correct fields before configuring

---

## 🆘 Need Help?

### Debug Checklist
1. Open browser console (F12)
2. Enable the layer
3. Look for these log patterns:
   - ✅ Success: `✅ Generated WMS URL for CWIS layer...`
   - ⚠️ Warning: `⚠️ Layer not yet connected to GeoServer`
   - ❌ Error: `❌ No CWIS config found for...`

### Console Commands
```javascript
// Check if layer config exists
import { getCWISLayerConfig } from '/config/cwisLayersConfig';
getCWISLayerConfig('flood_hazard');

// Check if Environmental layer config exists
import { getEnvironmentalLayerConfig } from '/config/environmentalLayers';
getEnvironmentalLayerConfig('groundwater_depth');
```

---

## 📊 Status Dashboard

| Layer | Type | Status | Filtering | Auto-Refresh |
|-------|------|--------|-----------|--------------|
| Storm Surge | Climate | ✅ Working | ✅ Yes | ✅ Yes |
| Flood Hazard | Climate | ⚠️ Placeholder | ✅ Ready | ✅ Ready |
| Urban Waterlogging | Climate | ⚠️ Placeholder | ✅ Ready | ✅ Ready |
| Land Surface Temperature | Climate | ⚠️ Placeholder | ✅ Ready | ✅ Ready |
| Urban Heat Island | Climate | ⚠️ Placeholder | ✅ Ready | ✅ Ready |
| Wet Bulb Temperature | Climate | ⚠️ Placeholder | ✅ Ready | ✅ Ready |
| Soil Classification | Environmental | ✅ Working | ✅ Yes | ✅ Yes |
| Groundwater Depth | Environmental | ⚠️ Placeholder | ✅ Ready | ✅ Ready |
| Geology | Environmental | ⚠️ Placeholder | ✅ Ready | ✅ Ready |
| Sinkhole | Environmental | ⚠️ Placeholder | ✅ Ready | ✅ Ready |

**Legend**:
- ✅ Working = Layer enabled and connected to GeoServer
- ⚠️ Placeholder = Configuration ready, needs GeoServer layer name
- ✅ Yes = Feature implemented and tested
- ✅ Ready = Feature configured and will work when layer is enabled
