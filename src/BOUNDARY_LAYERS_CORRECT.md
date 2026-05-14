# 🗺️ Boundary Layers - CORRECT Setup Guide

## You Were Right! 

The dashboard uses **separate POINT layers for labels**, not calculated centroids from polygons.

---

## 📊 Required GeoServer Layers

You need **4 layers total**:

### 1. Ward_Boundary (POLYGON)
**Purpose:** Ward boundaries for selection, filtering, and display

| Property | Details |
|----------|---------|
| **Layer Name** | `Ward_Boundary` (or `Barangay_Boundary`) |
| **Geometry Type** | **POLYGON** or MultiPolygon |
| **Coordinate System** | EPSG:4326 (WGS84) |
| **Access Method** | WFS (Web Feature Service) |

**Required Attributes:**
```
Ward (or Barangay)  → INTEGER   Ward/Barangay number
Zone                → STRING    Zone name
Pop_2011            → INTEGER   Population
Area                → FLOAT     Area in sq km (optional)
Density             → FLOAT     Population density (optional)
Households          → INTEGER   Households (optional)
```

**Used For:**
- ✅ Ward boundary lines (dotted grey)
- ✅ Ward fill (transparent clickable area)
- ✅ Ward highlight (blue when selected)
- ✅ Click detection
- ✅ Ward filter dropdown

---

### 2. Ward_Point (POINT) ⭐ **FOR LABELS**
**Purpose:** Label positions for ward numbers

| Property | Details |
|----------|---------|
| **Layer Name** | `Ward_Point` (or `Barangay_Point`) |
| **Geometry Type** | **POINT** |
| **Coordinate System** | EPSG:4326 (WGS84) |
| **Access Method** | WFS (Web Feature Service) |

**Required Attributes:**
```
Ward (or Barangay)  → INTEGER   Ward/Barangay number (must match Ward_Boundary)
```

**Used For:**
- ✅ Ward label positions ("Ward 1", "Ward 2", etc.)
- ✅ Label text at exact centroid locations

**How to Create:**
In GeoServer or QGIS, create point centroids from your ward polygons:
```sql
-- PostGIS example
CREATE TABLE Ward_Point AS
SELECT 
  Ward,
  ST_Centroid(geom) AS geom
FROM Ward_Boundary;
```

---

### 3. Municipal_Boundary (POLYGON)
**Purpose:** City/Province outer boundary

| Property | Details |
|----------|---------|
| **Layer Name** | `Municipal_Boundary` (or `City_Boundary`) |
| **Geometry Type** | **POLYGON** or MultiPolygon |
| **Coordinate System** | EPSG:4326 (WGS84) |
| **Access Method** | WFS (Web Feature Service) |

**Required Attributes:**
```
Name    → STRING    Municipality/City name
Type    → STRING    Administrative level (optional)
```

**Used For:**
- ✅ Outer boundary line (red)
- ✅ Administrative context

---

### 4. (Optional) Municipal_Point (POINT)
**Purpose:** City label position

| Property | Details |
|----------|---------|
| **Layer Name** | `Municipal_Point` |
| **Geometry Type** | **POINT** |
| **Coordinate System** | EPSG:4326 (WGS84) |
| **Access Method** | WFS (Web Feature Service) |

**Status:** Currently NOT used in the dashboard (can be added later)

---

## 🎨 How Layers Are Displayed

### From Ward_Boundary (POLYGON):

**Creates 3 MapLibre layers:**

1. **ward-boundaries-fill** (Transparent clickable area)
   - Type: `fill`
   - Opacity: 0.01 (nearly invisible)
   - Purpose: Click detection
   - Min Zoom: 10

2. **ward-boundaries** (Outline)
   - Type: `line`
   - Color: Dark grey (#374151)
   - Pattern: Dotted (3, 3)
   - Width: 0.5px - 1.2px (zoom-dependent)
   - Min Zoom: 10

3. **ward-boundaries-highlight** (Selection)
   - Type: `line`
   - Color: Blue (#2563EB)
   - Width: 1.5px - 3px (zoom-dependent)
   - Shows: When ward is selected
   - Min Zoom: 10

---

### From Ward_Point (POINT):

**Creates 1 MapLibre layer:**

4. **ward-labels** (Text labels)
   - Type: `symbol`
   - Text: Ward number ("1", "2", "3", etc.)
   - Font Size: 8px - 13px (zoom-dependent)
   - Color: Dark slate (#1E293B)
   - Halo: White (2px)
   - Min Zoom: 10
   - **Source:** Ward_Point layer (NOT polygon centroids!)

---

### From Municipal_Boundary (POLYGON):

**Creates 2 MapLibre layers:**

1. **municipal-boundary-border** (Shadow/outline)
   - Type: `line`
   - Color: White (#FFFFFF)
   - Width: 5px
   - Opacity: 0.6
   - Min Zoom: 8

2. **municipal-boundary** (Main line)
   - Type: `line`
   - Color: Red (#E3000F)
   - Width: 3px
   - Opacity: 0.9
   - Min Zoom: 8

---

## 🔗 WFS URLs You Need to Provide

### 1. Ward Boundary (Polygon)
```
https://your-geoserver.com/geoserver/BOHOL_CWIS/ows
  ?service=WFS
  &version=1.0.0
  &request=GetFeature
  &typeName=BOHOL_CWIS:Ward_Boundary
  &outputFormat=application/json
  &srsName=EPSG:4326
```

### 2. Ward Point (For Labels)
```
https://your-geoserver.com/geoserver/BOHOL_CWIS/ows
  ?service=WFS
  &version=1.0.0
  &request=GetFeature
  &typeName=BOHOL_CWIS:Ward_Point
  &outputFormat=application/json
  &srsName=EPSG:4326
```

### 3. Municipal Boundary
```
https://your-geoserver.com/geoserver/BOHOL_CWIS/ows
  ?service=WFS
  &version=1.0.0
  &request=GetFeature
  &typeName=BOHOL_CWIS:Municipal_Boundary
  &outputFormat=application/json
  &srsName=EPSG:4326
```

---

## 📝 Files That Need Updating

### Ward_Boundary URLs (4 files):

1. **`/components/Header.tsx`** - Line ~48
2. **`/components/MapCanvas.tsx`** - Line ~9102
3. **`/components/ComparisonView.tsx`** - Line ~651
4. **`/components/HistoricalTrendsPanel.tsx`** - Line ~1575

### Ward_Point URLs (3 files):

1. **`/components/MapCanvas.tsx`** - Line ~9254
2. **`/components/ComparisonView.tsx`** - Line ~719
3. **`/components/HistoricalTrendsPanel.tsx`** - Line ~1716

### Municipal_Boundary URL (1 file):

1. **`/components/MapCanvas.tsx`** - Line ~9671

---

## 🧪 Testing Checklist

### Test 1: Ward_Boundary (Polygon)
```bash
# Open in browser:
https://your-geoserver.com/geoserver/BOHOL_CWIS/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=BOHOL_CWIS:Ward_Boundary&outputFormat=application/json&srsName=EPSG:4326
```

**Expected:**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[...]]]
      },
      "properties": {
        "Ward": 1,
        "Zone": "Zone 1",
        "Pop_2011": 15000
      }
    }
  ]
}
```

### Test 2: Ward_Point (Point)
```bash
# Open in browser:
https://your-geoserver.com/geoserver/BOHOL_CWIS/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=BOHOL_CWIS:Ward_Point&outputFormat=application/json&srsName=EPSG:4326
```

**Expected:**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [124.11, 9.84]
      },
      "properties": {
        "Ward": 1
      }
    }
  ]
}
```

### Test 3: Visual Check in Dashboard

1. **Start:** `npm run dev`
2. **Zoom in to level 10+**
3. **Check:**
   - ✅ Ward boundaries visible (dotted grey lines)
   - ✅ Ward labels visible ("1", "2", "3", etc.)
   - ✅ Municipal boundary visible (red line)
4. **Click on ward:**
   - ✅ Ward popup appears with statistics
   - ✅ Ward highlights in blue
5. **Check console:**
   ```
   ✅ Ward Boundary GeoJSON source added
   ✅ Ward_Point source added
   ✅ Ward labels added using Ward_Point layer
   ✅ Municipal Boundary GeoJSON loaded
   ```

---

## 🚨 Common Issues

### Issue 1: "Labels not showing"
**Cause:** Missing Ward_Point layer
**Solution:** Create Ward_Point layer from polygon centroids

### Issue 2: "Labels in wrong position"
**Cause:** Ward_Point coordinates don't match polygon centroids
**Solution:** Regenerate Ward_Point using ST_Centroid()

### Issue 3: "Ward number mismatch"
**Cause:** Ward attribute name different in Ward_Point vs Ward_Boundary
**Solution:** Ensure both layers use same attribute name (e.g., "Ward")

### Issue 4: "Labels duplicated or scattered"
**Cause:** Using polygon for labels instead of points
**Solution:** Use Ward_Point layer, not Ward_Boundary for labels

---

## 📊 Layer Summary

| Layer Name | Geometry | Purpose | Visible Layer Count |
|------------|----------|---------|---------------------|
| **Ward_Boundary** | POLYGON | Boundaries, clicks, selection | 3 (fill, line, highlight) |
| **Ward_Point** | POINT | Labels | 1 (symbol/text) |
| **Municipal_Boundary** | POLYGON | City boundary | 2 (border, line) |

**Total MapLibre Layers Created:** 6 layers from 3 GeoServer layers

---

## 🎯 What to Provide

Please share these 3 GeoServer WFS URLs:

1. ✅ **Ward_Boundary** (Polygon) - For boundaries and selection
2. ✅ **Ward_Point** (Point) - For label positions ⭐ **IMPORTANT**
3. ✅ **Municipal_Boundary** (Polygon) - For city boundary

**Format:**
```
Ward Boundary: https://...
Ward Point: https://...
Municipal Boundary: https://...
```

---

**Thank you for the correction! The Ward_Point layer is indeed essential for proper label positioning.** 🙏
