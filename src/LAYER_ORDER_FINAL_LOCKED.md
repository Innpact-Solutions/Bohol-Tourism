# 🔒 FINAL LOCKED LAYER ORDER - BOHOL CWIS DASHBOARD 🔒

## ⚠️ CRITICAL: THIS LAYER ORDER IS FROZEN AND LOCKED ⚠️

**Last Updated:** March 2, 2026 (Layer Order Fix Applied)  
**Status:** PRODUCTION - DO NOT MODIFY WITHOUT EXPLICIT APPROVAL

---

## 📋 Final Layer Order (Bottom to Top)

This document defines the **ABSOLUTE, UNCHANGEABLE** layer order for the entire Bohol CWIS Dashboard application.

### Layer Stack (Z-Index Order)

| Priority | Layer Type | Description | Locked |
|----------|-----------|-------------|---------|
| **950** | **Ward Labels** | ABSOLUTE TOP - Always visible above everything | 🔒 YES |
| **900** | **Basemap Labels** | ALL Carto text/road names/place names | 🔒 YES |
| **800** | **Road Safety** | IRAP layers | ✓ |
| **700** | **Infrastructure Points** | Education, Healthcare, Transport, Amenities | ✓ |
| **670** | **Watershed & Labels** | Above all boundaries | 🔒 YES |
| **660-620** | **Administrative Boundaries** | Municipal (660), Ward Highlight (640), Ward Outline (630), Ward Fill (620) | 🔒 YES |
| **610** | **Road Network** | **Includes basemap roads + custom road network** | 🔒 YES |
| **600** | **Waterbody** | Water features | ✓ |
| **400** | **Slum Settlements** | Informal areas | ✓ |
| **350-320** | **Buildings** | Highlight (350), 3D (340), 2D (330), Fill (320) | ✓ |
| **200** | **Hazard Layers** | Heat, Air, Flood, Multi-Hazard | ✓ |
| **150** | **Base Data Layers** | Elevation, Green Cover, Built-up | 🔒 YES |
| **100** | **Basemap Detail** | Non-road basemap features (buildings from basemap) | 🔒 YES |
| **0** | **Basemap Base** | Background, water, landuse | 🔒 YES |

---

## 🎯 Key Requirements (Client Specifications)

### 1. **Basemap Base (Priority 0)**
- Grey and satellite imagery WITHOUT road network
- Always at the very bottom
- Includes: background, water, landuse

### 2. **Thematic Polygon Layers (Priority 150)** 🔒 FIXED
- Elevation, Green Cover, Built-up layers
- Always on top of basemap base
- **Must be BELOW road network (610)**
- **Must be BELOW administrative boundaries (620-660)**
- 🎯 **FIX APPLIED:** `enforceStrictLayerOrder()` now called after base layers are added

### 3. **Road Network (Priority 610)**
- **CRITICAL**: Includes BOTH basemap road layers AND custom road network
- Must be on top of thematic layers (150)
- Must be BELOW administrative boundaries (620-660)

### 4. **Administrative Boundaries (Priority 620-660)**
- Municipal and Barangay/Ward boundaries
- Must be on top of road network (610)
- Below all labels (900+)

### 5. **Labels (Priority 900-950)**
- Basemap labels (900): Road names, place names, POIs
- Ward/Barangay labels (940-950)
- Always on top of everything except ward labels

---

## 🔧 Implementation Details

### Priority Assignment Logic

The `getLayerPriority()` function in `/components/MapCanvas.tsx` implements this order:

```typescript
// Basemap road layers → Priority 610 (ROAD_NETWORK)
if (id.includes('road') || id.includes('highway') || id.includes('street') ||
    id.includes('bridge') || id.includes('tunnel') ||
    id.includes('ferry') || id.includes('path')) {
  return LAYER_ORDER_PRIORITY.ROAD_NETWORK; // 610
}

// Basemap building layers → Priority 100 (BASEMAP_DETAIL)
if (id.includes('building')) {
  return LAYER_ORDER_PRIORITY.BASEMAP_DETAIL; // 100
}

// Custom road network → Priority 610 (ROAD_NETWORK)
if (id.startsWith('road_network')) {
  return LAYER_ORDER_PRIORITY.ROAD_NETWORK; // 610
}

// Thematic layers → Priority 150 (BASE_DATA_LAYERS)
if (id === 'elevation' || id === 'green_cover' || id === 'built_up') {
  return LAYER_ORDER_PRIORITY.BASE_DATA_LAYERS; // 150
}

// Administrative boundaries → Priority 620-660
if (id.startsWith('ward-') || id === 'ward' || id.includes('ward')) {
  // Ward Fill: 620, Outline: 630, Highlight: 640, Labels: 940
}

if (id === 'municipal-boundary' || id.includes('municipal')) {
  // Municipal Boundary: 660, Labels: 950
}
```

### 🆕 CRITICAL FIX APPLIED (March 2, 2026)

**Issue:** Elevation, green_cover, and built_up layers were appearing ABOVE road network and administrative boundaries.

**Root Cause:** `enforceStrictLayerOrder()` was not being called after base layers were added (lines 3094-3145 in MapCanvas.tsx).

**Solution:** Added `enforceStrictLayerOrder()` call immediately after base layers are added:

```typescript
// Line ~3144 in MapCanvas.tsx
console.log('✅ Base layer added to map:', layerId, ...);

// 🔒 ENFORCE STRICT LAYER ORDER - Critical for base layers
setTimeout(() => {
  if (map && map.getStyle && map.getStyle()) {
    enforceStrictLayerOrder(map);
    console.log('✅ Layer ordering enforced for base layer:', layerId);
  }
}, 100);
```

**Status:** ✅ FIXED - Base layers now correctly positioned below road network

---

## ✅ Verification Checklist

After any layer changes, verify:

- [ ] Basemap base (grey/satellite) is at the bottom
- [ ] Thematic layers (elevation, etc.) are visible above basemap
- [ ] **Thematic layers are BELOW road network** 🔒 CRITICAL
- [ ] Road network is visible above thematic layers
- [ ] Administrative boundaries are visible above road network
- [ ] Labels are on top of all layers
- [ ] Toggling any layer OFF does not change the order of remaining layers
- [ ] Switching basemap (grey ↔ satellite) maintains layer order

---

## 🚫 Prohibited Actions

**DO NOT:**

1. Change priority values without explicit approval
2. Reorder basemap road layers above administrative boundaries
3. Move thematic layers above road network
4. Change label priority below 900
5. Modify the `enforceStrictLayerOrder()` function without approval
6. Remove `enforceStrictLayerOrder()` calls after layer additions

---

## 📞 Change Request Process

If layer order changes are needed:

1. Document the specific requirement
2. Get explicit approval from client
3. Update this document with new order
4. Update `LAYER_ORDER_PRIORITY` constants
5. Update `getLayerPriority()` function
6. Test all layer combinations
7. Document changes in git commit

---

## 🔒 Lock Status

**This layer order is LOCKED and FROZEN as of March 2, 2026.**

All changes require explicit client approval and must be documented in this file.

**Implemented in:** `/components/MapCanvas.tsx`
- Lines 13-30: Documentation
- Lines 8027-8077: LAYER_ORDER_PRIORITY constants
- Lines 8093-8243: getLayerPriority() function
- Lines 8349-8486: enforceStrictLayerOrder() function
- Line ~3155: Base layer order enforcement (CRITICAL FIX)

---

## 🐛 Known Issues

**RESOLVED:** ✅ Elevation layer appearing above road network (Fixed March 2, 2026)

---

## 📚 Related Documentation

- `/LAYER_ORDER_DOCUMENTATION.md` - Technical implementation details
- `/components/MapCanvas.tsx` - Main implementation
- `/PROJECT_STRUCTURE.md` - Overall project structure

---

**END OF DOCUMENT**
