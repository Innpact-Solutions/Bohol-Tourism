# Map Extent Calculation - Simplified Approach

## 🎯 Current Implementation (Single Source of Truth)

The map extent and zoom are now calculated **purely from GeoServer data** - no hardcoded fallbacks or approximations!

---

## **How It Works**

### Step 1: Map Initialization (Lines 1000-1010)
```typescript
const map = new maplibregl.Map({
  container: mapContainerRef.current,
  style: getBasemapStyle(basemap),
  center: [0, 0],  // Temporary placeholder
  zoom: 1,         // Temporary placeholder
  // ... other config
});
```

**Why [0, 0] and zoom 1?**
- These are just temporary placeholders
- Map will be immediately repositioned once GeoServer data loads
- No confusion from hardcoded approximations!

---

### Step 2: Fetch Barangay Boundary from GeoServer (Lines 1050-1056)
```typescript
console.log('📡 Fetching Barangay_Boundary extent from GeoServer...');

const BARANGAY_WFS_URL = 'https://geoserver.azure.innpact.ai/geoserver/WorldBank_Bohol/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=WorldBank_Bohol:Barangay_Boundary&outputFormat=application/json&srsName=EPSG:4326';

const response = await fetchWithTimeout(BARANGAY_WFS_URL, { timeout: 10000 });
const geojson = await response.json();
```

**What This Returns:**
- GeoJSON FeatureCollection with all barangay polygons
- Includes ALL barangays in Tagbilaran City, Dauis, and Panglao

---

### Step 3: Calculate Bounding Box (Lines 1058-1084)
```typescript
// Initialize with extreme values
let minLng = Infinity, minLat = Infinity;
let maxLng = -Infinity, maxLat = -Infinity;

// Loop through ALL coordinates in ALL barangay features
geojson.features.forEach((feature: any) => {
  if (feature.geometry.type === 'Polygon') {
    feature.geometry.coordinates[0].forEach((coord: [number, number]) => {
      const [lng, lat] = coord;
      minLng = Math.min(minLng, lng);  // Westernmost point
      minLat = Math.min(minLat, lat);  // Southernmost point
      maxLng = Math.max(maxLng, lng);  // Easternmost point
      maxLat = Math.max(maxLat, lat);  // Northernmost point
    });
  }
  // Also handles MultiPolygon geometries
});

// Create bounding box
const barangayBounds: [[number, number], [number, number]] = [[minLng, minLat], [maxLng, maxLat]];
```

**Result:**
```javascript
barangayBounds = [
  [123.7xxx, 9.5xxx],  // Southwest corner (min lng, min lat)
  [123.9xxx, 9.7xxx]   // Northeast corner (max lng, max lat)
]
```

**This is the smallest rectangle that contains ALL barangays in the 3 municipalities!**

---

### Step 4: Fit Map to Calculated Extent (Lines 1089-1100)
```typescript
console.log('🔒 LOCKING MAP TO BARANGAY EXTENT (Tagbilaran City, Dauis, Panglao)');

map.fitBounds(barangayBounds, {
  padding: 80,   // 80px buffer on all sides
  duration: 0,   // Instant (no animation)
  maxZoom: 14    // Don't zoom closer than level 14
});

// Store for later use (reset button, etc.)
(map as any)._barangayBounds = barangayBounds;
(map as any)._barangayBoundsSet = true;
```

**What `fitBounds()` Does:**
- Automatically calculates the perfect zoom level to fit the bounds
- Centers the map on the bounding box
- Applies padding to prevent features from touching edges
- Respects the maxZoom constraint

**Zoom Calculation (MapLibre GL Internal):**
```javascript
// Simplified algorithm
const lngZoom = Math.log2(360 / longitudeSpan) + Math.log2(effectiveWidth / 256) - 1;
const latZoom = Math.log2(180 / latitudeSpan) + Math.log2(effectiveHeight / 256) - 1;
const finalZoom = Math.min(lngZoom, latZoom, maxZoom);
```

**Result:**
- ✅ Perfect fit every time
- ✅ Adapts to any screen size
- ✅ Always shows complete study area
- ✅ No manual zoom level needed!

---

## 🔄 Reset View Function (Lines 663-678)

```typescript
const resetToStudyAreaExtent = (map: any, duration: number = 1500) => {
  const barangayBounds = (map as any)._barangayBounds;
  
  if (barangayBounds) {
    console.log('📍 Resetting to Barangay_Boundary extent');
    map.fitBounds(barangayBounds, {
      padding: 80,
      duration: duration,  // ← Animated (1500ms)
      pitch: 0,
      bearing: 0,
      essential: true
    });
  } else {
    console.warn('⚠️ Barangay bounds not available for reset');
  }
};
```

**Used By:**
- Reset View button in UI
- Ward filter "Show All" function
- Road filter clear/reset
- Home view transitions
- Any feature that needs to return to default extent

**Key Difference from Initial Load:**
- Uses **animation** (duration: 1500ms or 2000ms) for smooth transition
- Resets pitch and bearing to 0° (top-down view)

---

## ✅ Advantages of This Approach

### 1. **Single Source of Truth**
- ❌ No hardcoded center coordinates
- ❌ No hardcoded zoom levels
- ❌ No hardcoded fallback bounds
- ✅ Everything calculated from actual GeoServer data

### 2. **Always Accurate**
- Adapts automatically if barangay boundaries change
- No manual updates needed
- Precision based on real geometry

### 3. **Responsive**
- Works on any screen size
- Desktop, tablet, mobile - all perfect
- `fitBounds()` handles all calculations

### 4. **Clean & Simple**
- No confusion about which values are used when
- Clear data flow: GeoServer → Calculate → Display
- Easy to understand and maintain

### 5. **Consistent Behavior**
- All reset/home functions use the same barangay bounds
- Predictable user experience
- No jumping between different "home" positions

---

## 📊 Configuration Parameters

### Padding (Line 1092)
```typescript
padding: 80  // pixels
```
- Adds visual breathing room
- Prevents features from touching map edges
- Can be customized per side: `{ top: 80, bottom: 80, left: 80, right: 80 }`

### Duration (Line 1093)
```typescript
duration: 0  // milliseconds
```
- `0` = Instant (initial load)
- `1500` = Smooth animation (reset view, road filter clear)
- `2000` = Slower animation (home view transitions from query panel)

### Max Zoom (Line 1094)
```typescript
maxZoom: 14
```
- Prevents excessive zoom on small areas
- Good balance between detail and context
- Can be adjusted if needed

---

## 🔍 Data Source

**Layer:** `WorldBank_Bohol:Barangay_Boundary`

**Coverage:** All barangays in:
- Tagbilaran City
- Dauis Municipality
- Panglao Municipality

**Geometry Type:** Polygon / MultiPolygon

**Coordinate System:** EPSG:4326 (WGS84)

---

## 🎯 All Functions Using Barangay Bounds

### 1. Initial Map Load (Line 1091)
- Duration: 0ms (instant)
- Purpose: Set default view on dashboard load

### 2. Reset View Button (Line 668)
- Duration: 1500ms
- Purpose: Return to study area after user navigation

### 3. Ward Filter "Show All" (Line 668)
- Duration: 1500ms
- Purpose: Reset view when clearing ward filter

### 4. Road Filter Clear (Line ~4295)
- Duration: 1500ms
- Purpose: Return to study area when clearing road selection

### 5. Home View Transitions (Line ~4060)
- Duration: 2000ms
- Purpose: Smooth return to study area from query results

---

## 💡 Summary

**Before:** 3-stage process with hardcoded values and fallbacks  
**Now:** 1-stage process - pure GeoServer data calculation

**Result:**
- ✅ Simpler code
- ✅ More accurate extent
- ✅ No maintenance needed
- ✅ Always shows complete study area
- ✅ Works perfectly on any screen size
- ✅ Consistent behavior across all reset functions

**The zoom level is NEVER manually set** - it's always automatically calculated by MapLibre GL to perfectly fit your barangay boundaries! 🎯
