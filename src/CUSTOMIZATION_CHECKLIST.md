# ✅ Dashboard Customization Checklist

Use this checklist when setting up the dashboard for a new city.

---

## 📋 Pre-Deployment Checklist

### 1. Configuration Files

- [ ] Copy `config/cityConfig.template.ts` → `config/cityConfig.ts`
- [ ] Copy `config/geoserverLayers.template.ts` → `config/geoserverLayers.ts`

### 2. City Information (`config/cityConfig.ts`)

- [ ] Update `CITY_CONFIG.name` (e.g., 'Mumbai')
- [ ] Update `CITY_CONFIG.country`
- [ ] Update `CITY_CONFIG.region`
- [ ] Update `CITY_CONFIG.displayName` (shown in header)
- [ ] Update `CITY_CONFIG.shortCode` (e.g., 'MUM')
- [ ] Update `CITY_CONFIG.timezone`

### 3. GeoServer Configuration

- [ ] Update `GEOSERVER_CONFIG.baseUrl`
- [ ] Update `GEOSERVER_CONFIG.workspace`
- [ ] Configure authentication if needed (`GEOSERVER_CONFIG.auth`)
- [ ] Test WMS URL in browser: `{baseUrl}/{workspace}/wms?service=WMS&request=GetCapabilities`
- [ ] Test WMTS URL in browser: `{baseUrl}/gwc/service/wmts?REQUEST=GetCapabilities`

### 4. Map Configuration

- [ ] Update `MAP_CONFIG.center` (city center coordinates)
- [ ] Set `MAP_CONFIG.initialZoom` (recommended: 11-13)
- [ ] Set `MAP_CONFIG.bounds.southwest` (southwest corner)
- [ ] Set `MAP_CONFIG.bounds.northeast` (northeast corner)
- [ ] Configure 3D settings if needed

### 5. GeoServer Layers (`config/geoserverLayers.ts`)

- [ ] Find & Replace ALL `YOUR_WORKSPACE` → your actual workspace name
- [ ] Update `GEOSERVER_WMS_URL` with full WMS endpoint
- [ ] Update heat stress layer names in `layerScenarioMap`
- [ ] Update air pollution layer names
- [ ] Update flood layer name
- [ ] Update multi-hazard layer name
- [ ] Update base layer names (roads, buildings, boundaries)
- [ ] Update road network layer name
- [ ] Verify all layer names match GeoServer exactly (case-sensitive!)

### 6. Scenario Configuration

- [ ] Verify `SCENARIO_CONFIG.historicalYears` (years with data)
- [ ] Verify `SCENARIO_CONFIG.baselineYear`
- [ ] Update scenario IDs and names if different
- [ ] Remove scenarios not applicable to your city

### 7. Hazard Sectors

- [ ] Enable/disable sectors in `HAZARD_SECTORS`
- [ ] Set `hasScenarios` for sectors with projections
- [ ] Set `hasHistorical` for sectors with historical data
- [ ] Remove layers not available for your city

### 8. Infrastructure Configuration

- [ ] Verify `INFRASTRUCTURE_CONFIG.education.categories`
- [ ] Verify `INFRASTRUCTURE_CONFIG.healthcare.categories`
- [ ] Verify `INFRASTRUCTURE_CONFIG.publicAmenities.categories`
- [ ] Verify `INFRASTRUCTURE_CONFIG.transport.categories`
- [ ] Enable/disable base layers as needed

### 9. API Configuration (if using custom APIs)

- [ ] Update `API_CONFIG.baseUrl`
- [ ] Update endpoint paths if different
- [ ] Set `API_CONFIG.timeout` appropriately
- [ ] Configure retry settings
- [ ] Test each API endpoint with sample data

### 10. Ward/District Configuration

- [ ] Update `WARD_CONFIG.divisionType` ('ward', 'district', 'zone', etc.)
- [ ] Set `WARD_CONFIG.totalWards`
- [ ] Verify `WARD_CONFIG.labelField` matches GeoServer attribute name

### 11. Branding

- [ ] Update `BRANDING_CONFIG.organization`
- [ ] Add logo files to `/public` directory
- [ ] Update `BRANDING_CONFIG.logo.header` path
- [ ] Update `BRANDING_CONFIG.logo.footer` path
- [ ] Customize color scheme in `BRANDING_CONFIG.colors`
- [ ] Update footer copyright and credits

### 12. Feature Flags

- [ ] Review all `FEATURE_FLAGS` settings
- [ ] Disable features not needed for your city
- [ ] Set `buildings3D` based on data availability
- [ ] Set `terrain3D` based on DEM data availability

### 13. Default Settings

- [ ] Set `DEFAULTS.defaultSector` (first sector shown on load)
- [ ] Set `DEFAULTS.defaultLayer` (first layer shown)
- [ ] Set `DEFAULTS.defaultScenario`
- [ ] Update `DEFAULTS.defaultBaseLayers` (layers active on load)

---

## 🗺️ GeoServer Checklist

### Layer Publishing

- [ ] All heat stress layers published with correct names
- [ ] All air pollution layers published
- [ ] Flood hazard layer published
- [ ] Multi-hazard layer published
- [ ] Road network layer published with required attributes
- [ ] Buildings layer published with height data
- [ ] Infrastructure layers (schools, hospitals, etc.) published
- [ ] Base layers (green cover, elevation, boundaries) published

### Layer Attributes

**Road Network Layer:**
- [ ] Has `Ward` field (integer)
- [ ] Has `Type` field (string)
- [ ] Has `iRAP_Vehicle` field (1-5)
- [ ] Has `iRAP_Motorcycle` field (1-5)
- [ ] Has `iRAP_Bicycle` field (1-5)
- [ ] Has `iRAP_Pedestrian` field (1-5)
- [ ] Has `Length` field (float, in km)

**Buildings Layer:**
- [ ] Has `Ward` field (integer)
- [ ] Has `Height` field (float, in meters)
- [ ] Has `Type` field (string)
- [ ] Has `Area` field (float)

**Infrastructure Layers:**
- [ ] Have `Name` field (string)
- [ ] Have `Type` field (string)
- [ ] Have `Ward` field (integer)
- [ ] Have geometry (Point or Polygon)

### Layer Styling

- [ ] Heat stress layers have color ramps
- [ ] Air pollution layers have color ramps
- [ ] Flood layer has color ramp
- [ ] Road network has appropriate style
- [ ] Buildings have default fill style
- [ ] Infrastructure points have icons/markers

### Tile Caching (Optional but Recommended)

- [ ] WMTS enabled for all raster layers
- [ ] Gridset `EPSG:900913` configured
- [ ] Tile cache seeded for zoom levels 8-18
- [ ] Tile format set to `image/png`

### Security

- [ ] CORS enabled if dashboard on different domain
- [ ] Authentication configured if required
- [ ] Layer security rules set if needed

---

## 🔌 API Checklist (Optional)

If implementing custom API backend:

### Endpoints Implemented

- [ ] `/api/building-hazard` - Building-level analysis
- [ ] `/api/area-kpi` - Area-based KPI calculations
- [ ] `/api/poi-query` - Infrastructure vulnerability queries
- [ ] `/api/road-network` - Road network analysis
- [ ] `/api/road-safety` - Road safety star rating analysis
- [ ] `/api/historical-trends` - Historical trend data
- [ ] `/api/imd-heat-calendar` - Heat calendar data

### API Testing

- [ ] Test building hazard endpoint with sample ward
- [ ] Test area KPI endpoint with sample scenario
- [ ] Test POI query with sample infrastructure type
- [ ] Test road network analysis
- [ ] Verify response format matches expected schema
- [ ] Test error handling (invalid ward, missing layer, etc.)

### API Security

- [ ] CORS configured for dashboard domain
- [ ] Rate limiting implemented
- [ ] Authentication if required
- [ ] Input validation

---

## 🎨 UI Customization Checklist

### Content Files

- [ ] Review `/data/heatStressContent.ts` - update descriptions
- [ ] Review `/data/airPollutionContent.ts` - update descriptions
- [ ] Review `/data/floodContent.ts` - update descriptions
- [ ] Review `/data/roadSafetyContent.ts` - update descriptions
- [ ] Update `/data/kpiLabels.ts` if KPI names differ

### Legend Definitions

- [ ] Review `/public/data/legend-definitions.csv`
- [ ] Update risk category thresholds if needed
- [ ] Update color schemes to match your data
- [ ] Ensure all layer IDs have legend entries

### Component Customization

- [ ] Update header title in `/components/Header.tsx` (if needed)
- [ ] Update footer in `/components/Footer.tsx` (if needed)
- [ ] Customize basemap styles if using custom tiles
- [ ] Adjust chart colors/styles if needed

---

## ✅ Testing Checklist

### Configuration Validation

- [ ] Run `validateCityConfig()` - no errors
- [ ] All required fields filled in
- [ ] No placeholder values remaining (`YOUR_*`, `0.0`, etc.)

### Map Testing

- [ ] Map loads and shows correct city
- [ ] Map center is correct
- [ ] Initial zoom level is appropriate
- [ ] Map bounds restrict panning correctly
- [ ] Basemap loads properly

### Layer Testing

**Heat Stress:**
- [ ] HHI layer loads for baseline
- [ ] HHI layer loads for SSP1
- [ ] HHI layer loads for SSP2
- [ ] HHI layer loads for SSP5
- [ ] Historical years switch correctly
- [ ] All 7 heat layers work (HHI, LST, AST, WBT, WBGT, UHI, RH)

**Air Pollution:**
- [ ] AQI layer loads
- [ ] PM2.5 layer loads
- [ ] PM10 layer loads
- [ ] All 7 air layers work

**Other Sectors:**
- [ ] Flood layer loads
- [ ] Multi-hazard layer loads
- [ ] Road Safety layers load (4 types)

**Base Layers:**
- [ ] Road network displays
- [ ] Buildings display
- [ ] Green cover displays
- [ ] Municipal boundary displays
- [ ] 3D buildings work (if enabled)

### Feature Testing

- [ ] Layer opacity slider works
- [ ] Ward filter dropdown works
- [ ] Ward selection filters data correctly
- [ ] Scenario selector switches correctly
- [ ] Year selector works (for historical data)
- [ ] Legend updates when layer changes
- [ ] Legend highlights match map on click
- [ ] Tutorial works (if enabled)
- [ ] Comparison view works (if enabled)

### Analytics Testing

- [ ] KPI tiles show data
- [ ] Charts render correctly
- [ ] Building analysis works
- [ ] Road network analysis works
- [ ] Infrastructure query works
- [ ] Historical trends work (if enabled)

### Performance Testing

- [ ] Initial load < 5 seconds
- [ ] Layer switching < 2 seconds
- [ ] Ward filtering < 1 second
- [ ] No console errors
- [ ] No memory leaks on layer switching

### Mobile Testing

- [ ] Dashboard loads on mobile
- [ ] Map panning/zooming works
- [ ] Drawer opens/closes smoothly
- [ ] Charts are responsive
- [ ] Touch interactions work

---

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] No console errors
- [ ] No placeholder values in config
- [ ] Logos and images added
- [ ] Environment variables set

### Build

- [ ] `npm run build` completes successfully
- [ ] Build output in `/dist` directory
- [ ] No build warnings

### Production Testing

- [ ] Test production build locally: `npm run preview`
- [ ] Verify all features work in production build
- [ ] Check network requests in production
- [ ] Verify GeoServer URLs work from production domain

### Deployment

- [ ] Deploy to hosting platform (Vercel/Netlify/AWS/etc.)
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] CORS configured on GeoServer for production domain
- [ ] API endpoints accessible from production
- [ ] Test live URL in different browsers

### Post-Deployment

- [ ] Verify dashboard loads on production URL
- [ ] Test all major features
- [ ] Check analytics/monitoring setup
- [ ] Create backup of configuration
- [ ] Document deployment for team

---

## 📝 Final Checks

- [ ] All documentation reviewed
- [ ] Team trained on dashboard usage
- [ ] User guide created (if needed)
- [ ] Support contact information added
- [ ] Version number updated
- [ ] Changelog created

---

## 🎉 Ready to Launch!

Once all items are checked, your dashboard is ready for production use.

**Remember:** Keep this checklist for future updates and new city deployments!

---

**Checklist Version:** 1.0  
**Last Updated:** 2024
