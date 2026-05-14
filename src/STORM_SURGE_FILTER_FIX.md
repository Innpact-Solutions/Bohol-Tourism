# 🔧 Storm Surge Filter Fix - Complete

## Problem
Storm Surge layer was not filtering when LGU or Barangay dropdowns were changed in the header.

## Root Cause
The `useEffect` hook in `/components/MapCanvas.tsx` (line 2034) that manages GeoServer layer loading was missing `selectedLguName` and `selectedWardName` in its dependency array.

### Before (Broken):
```typescript
}, [activeSector, activeLayerId, scenario, mapReady, selectedWardId, styleLoadCounter, selectedDonutCategory]);
```

When the user changed LGU or Barangay filters:
- ❌ The filter state variables updated correctly
- ❌ But the useEffect didn't re-run
- ❌ The WMS layer wasn't reloaded with new filters
- ❌ The layer continued showing unfiltered data

## Solution
Added `selectedLguName` and `selectedWardName` to the useEffect dependency array.

### After (Fixed):
```typescript
}, [activeSector, activeLayerId, scenario, mapReady, selectedWardId, styleLoadCounter, selectedDonutCategory, selectedLguName, selectedWardName]);
```

Now when the user changes LGU or Barangay filters:
- ✅ The filter state variables update
- ✅ The useEffect detects the change and re-runs
- ✅ The WMS layer is removed and reloaded
- ✅ `getCWISLayerWMSUrl()` is called with new filter values
- ✅ New WMS URL includes updated `CQL_FILTER` parameter
- ✅ GeoServer returns filtered data
- ✅ Map displays filtered layer

## Files Modified

### 1. `/components/MapCanvas.tsx`
**Line 2034** - Added missing dependencies to useEffect:
```typescript
}, [activeSector, activeLayerId, scenario, mapReady, selectedWardId, 
    styleLoadCounter, selectedDonutCategory, selectedLguName, selectedWardName]);
    //                                        ^^^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^
    //                                        ADDED THESE TWO
```

**Lines 1700-1703** - Added debug logging:
```typescript
console.log('🔍 [CWIS LAYER] Filter values from props:', { selectedLguName, selectedWardName });
const munNameForFilter = (selectedLguName && selectedLguName !== 'all') ? selectedLguName : null;
const brgyNameForFilter = (selectedWardName && selectedWardName !== 'all') ? selectedWardName : null;
console.log('🔍 [CWIS LAYER] Processed filters:', { munNameForFilter, brgyNameForFilter });
```

### 2. `/FILTERING_DOCUMENTATION.md`
Updated status section to reflect working filter state.

## How It Works Now

### User Action Flow:
1. User clicks LGU dropdown in header
2. User selects "Tagbilaran City"
3. `setSelectedLguName("Tagbilaran City")` is called
4. `selectedLguName` state updates from "all" to "Tagbilaran City"
5. useEffect detects dependency change
6. `addGeoServerLayers()` function runs
7. Existing Storm Surge layer is removed
8. `getCWISLayerWMSUrl('storm_surge', 'Tagbilaran City', null)` is called
9. Function generates WMS URL with: `CQL_FILTER=MunName='Tagbilaran City'`
10. New WMS layer source is created with filtered URL
11. Map displays only Storm Surge data for Tagbilaran City

### Filter Combination Examples:

#### LGU Only
```
User: Selects "Dauis" LGU
Result: CQL_FILTER=MunName='Dauis'
Shows: All storm surge in Dauis municipality
```

#### Barangay Only
```
User: Selects "Poblacion 1" Barangay
Result: CQL_FILTER=BrgyName='Poblacion 1'
Shows: All storm surge in Poblacion 1 (any municipality)
```

#### Both LGU + Barangay
```
User: Selects "Tagbilaran City" LGU + "Cogon" Barangay
Result: CQL_FILTER=MunName='Tagbilaran City' AND BrgyName='Cogon'
Shows: Storm surge in Cogon barangay within Tagbilaran City only
```

#### Reset to All
```
User: Selects "All LGUs"
Result: No CQL_FILTER
Shows: All storm surge data (entire study area)
```

## Testing Verification

### Console Logs to Watch:
When changing filters, you should see:
```
🔍 [CWIS LAYER] Filter values from props: { selectedLguName: 'Tagbilaran City', selectedWardName: 'all' }
🔍 [CWIS LAYER] Processed filters: { munNameForFilter: 'Tagbilaran City', brgyNameForFilter: null }
✅ Generated WMS URL for CWIS layer "storm_surge": https://geoserver.azure.innpact.ai/geoserver/WorldBank_Bohol/wms?...&CQL_FILTER=MunName%3D%27Tagbilaran%20City%27
🔍 [CWIS LAYER] Applying LGU filter: Tagbilaran City
```

### Visual Verification:
1. ✅ Storm Surge layer appears on map
2. ✅ Select "Tagbilaran City" → Layer extent shrinks to Tagbilaran only
3. ✅ Select "Dauis" → Layer extent shifts to Dauis
4. ✅ Select "All LGUs" → Layer shows entire study area
5. ✅ Select Barangay → Layer filters to that barangay
6. ✅ Change both filters → Layer responds immediately

## Impact on Other Layers

### ✅ Already Working:
All other overlay layers (buildings, education, healthcare, transport) already had filtering working because they use different rendering methods (GeoJSON with client-side filtering).

### ✅ Now Fixed:
- Storm Surge (CWIS Climate Hazard Layer)

### ✅ Ready to Work (When Enabled):
These layers will automatically support filtering when connected to GeoServer:
- Flood Hazard
- Urban Waterlogging
- Land Surface Temperature
- Urban Heat Island
- Wet Bulb Temperature
- Soil Classification (Environmental)
- Groundwater Depth (Environmental)
- Geology (Environmental)
- Sinkhole (Environmental)

All use the same `getCWISLayerWMSUrl()` or `getEnvironmentalLayerWMSUrl()` functions with `MunName` and `BrgyName` filtering.

## Code Patterns

### Filter Variable Extraction Pattern:
```typescript
// Convert "all" to null for CQL filter logic
const munNameForFilter = (selectedLguName && selectedLguName !== 'all') 
  ? selectedLguName : null;
const brgyNameForFilter = (selectedWardName && selectedWardName !== 'all') 
  ? selectedWardName : null;
```

### WMS URL Generation Pattern:
```typescript
// CWIS Layers
if (isCWISLayer) {
  tileUrl = getCWISLayerWMSUrl(layerId, munNameForFilter, brgyNameForFilter);
}

// Environmental Layers
if (isEnvironmentalLayer) {
  tileUrl = getEnvironmentalLayerWMSUrl(layerId, munNameForFilter, brgyNameForFilter);
}
```

### CQL Filter Building Pattern:
```typescript
const filters: string[] = [];

if (munName && munName !== 'all') {
  filters.push(`MunName='${escapedMunName}'`);
}

if (brgyName && brgyName !== 'all') {
  filters.push(`BrgyName='${escapedBrgyName}'`);
}

if (filters.length > 0) {
  const cqlFilter = filters.join(' AND ');
  url += `&CQL_FILTER=${encodeURIComponent(cqlFilter)}`;
}
```

## Status: ✅ RESOLVED

Storm Surge filtering is now fully operational with:
- ✅ LGU filtering via `MunName` field
- ✅ Barangay filtering via `BrgyName` field
- ✅ Combined filtering support
- ✅ Automatic layer refresh on filter change
- ✅ Console logging for debugging
- ✅ All Environmental Sensitivity Layers configured identically
- ✅ Ready for additional CWIS layers when GeoServer layers are available

---

**Date Fixed:** March 8, 2026  
**Fixed By:** System Update  
**Severity:** Medium (Feature Not Working)  
**Priority:** High (User-Facing Functionality)
