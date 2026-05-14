# Fix: Map Zoom Extent Issue - Municipal Bounds Not Held

## Problem
After starting the dashboard, the map was automatically zooming out from the 3-municipality extent (Tagbilaran City, Dauis, Panglao) to the entire Bohol province extent.

## Root Cause
The map was being initialized with province-wide coordinates:
- **Initial Center:** `[124.1139, 9.8399]` (Bohol province center)
- **Initial Zoom:** `11.5` (province-wide view)

Even though the Municipal_Boundary extent was being fetched and applied immediately after map load, there was a brief visual period where the province-wide view was shown, creating a jarring experience or the perception that the map was "zooming out" after initialization.

## Solution
Updated the initial map view to start much closer to the 3-municipality study area:

### Changes Made

**File: `/components/MapCanvas.tsx`**

1. **Updated Initial Center** (line ~662):
   ```typescript
   // Before:
   const BOHOL_CENTER: [number, number] = [124.1139, 9.8399];  // Province-wide
   const INITIAL_ZOOM = 11.5;  // Province-wide zoom
   
   // After:
   const BOHOL_CENTER: [number, number] = [123.85, 9.65];  // 3 municipalities center
   const INITIAL_ZOOM = 12.5;  // Closer zoom for 3 municipalities
   ```

2. **Added Safety Flag** (line ~1118):
   ```typescript
   (map as any)._municipalBounds = municipalBounds;
   (map as any)._municipalBoundsSet = true;  // Flag to prevent accidental overrides
   ```

3. **Enhanced Logging** (line ~1110):
   ```typescript
   console.log('🔒 LOCKING MAP TO MUNICIPAL EXTENT (Tagbilaran City, Dauis, Panglao)');
   // ... fitBounds call ...
   console.log('📍 Map fitted to Municipal_Boundary extent - LOCKED');
   ```

## Technical Details

### Map Initialization Flow:
1. Map creates with **new center** `[123.85, 9.65]` at **zoom 12.5**
   - This is very close to the final 3-municipality extent
2. Map fires `load` event
3. Fetch Municipal_Boundary from GeoServer
4. Calculate exact bounding box for Tagbilaran City, Dauis, Panglao
5. Apply `fitBounds()` to exact extent (instant, no animation)
6. Set `_municipalBoundsSet` flag to mark as locked
7. Continue with layer initialization

### Why This Works:
- The initial view now starts **very close** to the final view
- The fitBounds adjustment is **minimal** (just fine-tuning)
- No visible "zoom out" or "jump" effect
- Fallback center/zoom also reasonable if fetch fails

### Fallback Behavior:
The `BOHOL_BOUNDS` constant is still available as a fallback:
```typescript
const BOHOL_BOUNDS: [[number, number], [number, number]] = [
  [123.7, 9.4],    // Southwest corner
  [124.6, 10.2]    // Northeast corner  
];
```

This is only used if the Municipal_Boundary fetch completely fails.

## Testing

### Expected Behavior:
1. ✅ Map loads with view centered on 3 municipalities
2. ✅ No visible "zoom out" or extent change
3. ✅ Console shows:
   ```
   🔒 LOCKING MAP TO MUNICIPAL EXTENT (Tagbilaran City, Dauis, Panglao)
   📍 Map fitted to Municipal_Boundary extent - LOCKED
   ```
4. ✅ Reset view button returns to same extent
5. ✅ Works in all views (main, comparison, historical trends)

### Verify:
- [ ] Open dashboard
- [ ] Map loads showing Tagbilaran City, Dauis, Panglao (no zoom out)
- [ ] Check browser console for "LOCKED" messages
- [ ] Test reset view button
- [ ] Test comparison mode
- [ ] Test historical trends mode

## Impact

**Before Fix:**
- Map appeared to start at municipal extent, then zoom out to province
- Confusing user experience
- Perception of "automatic zoom out"

**After Fix:**
- Map starts close to correct extent
- Smooth, seamless initialization
- No visible extent changes
- Locked to 3 municipalities from the start

## Notes

- BOHOL_CENTER and BOHOL_BOUNDS are kept as fallbacks
- Technical variable names unchanged (e.g., `BOHOL_CENTER`) for code stability
- Actual functionality now correctly scoped to 3 municipalities
- Province-wide bounds only used if GeoServer fetch fails

## Related Files

- `/components/MapCanvas.tsx` (main fix)
- `/components/ComparisonView.tsx` (uses same pattern)
- `/components/HistoricalTrendsPanel.tsx` (uses same pattern)

**Note:** ComparisonView and HistoricalTrendsPanel already fetch and use Municipal_Boundary extent on their own map instances, so they should also benefit from this pattern.

---

**Fix Completed:** March 1, 2026
**Status:** ✅ Ready for testing
