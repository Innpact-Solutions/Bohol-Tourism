# 🚀 START HERE - Multi-Hazard Climate Dashboard Template

Welcome! This is your **quick start guide** to get the dashboard running for your city.

---

## ⚡ Quick Start (5 Minutes)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Copy Configuration Templates

```bash
cp config/cityConfig.template.ts config/cityConfig.ts
cp config/geoserverLayers.template.ts config/geoserverLayers.ts
```

### Step 3: Update Basic Configuration

Open `/config/cityConfig.ts` and update:

```typescript
export const CITY_CONFIG = {
  name: 'Mumbai',              // ← Your city name
  country: 'India',
  displayName: 'Mumbai Climate Dashboard',
  // ...
};

export const MAP_CONFIG = {
  center: {
    lng: 72.8777,              // ← Your city longitude
    lat: 19.0760,              // ← Your city latitude
  },
  // ...
};

export const GEOSERVER_CONFIG = {
  baseUrl: 'https://your-geoserver.com/geoserver',  // ← Your GeoServer URL
  workspace: 'MUMBAI_CLIMATE',                       // ← Your workspace name
  // ...
};
```

### Step 4: Update GeoServer Layer Names

Open `/config/geoserverLayers.ts` and:

**Find & Replace:**
```
Find:    YOUR_WORKSPACE
Replace: MUMBAI_CLIMATE    (or your actual workspace name)
```

**Update URLs:**
```typescript
export const GEOSERVER_WMS_URL = 
  'https://your-geoserver.com/geoserver/MUMBAI_CLIMATE/wms';
```

### Step 5: Start Development Server

```bash
npm run dev
```

Open your browser: **http://localhost:5173**

---

## ✅ You're Done!

If the map loads and shows layers, you're all set! 🎉

---

## 📚 What's Next?

### Essential Reading (In Order)

1. **[README.md](./README.md)**
   - Project overview
   - Features list
   - Technology stack

2. **[TEMPLATE_SETUP_GUIDE.md](./TEMPLATE_SETUP_GUIDE.md)** ⭐ **COMPREHENSIVE GUIDE**
   - Detailed setup instructions
   - GeoServer configuration
   - Layer requirements
   - API integration
   - Deployment instructions

3. **[CUSTOMIZATION_CHECKLIST.md](./CUSTOMIZATION_CHECKLIST.md)** ⭐ **VALIDATION**
   - Pre-deployment checklist (100+ items)
   - Testing checklist
   - Deployment checklist

### Reference Documentation

4. **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)**
   - Complete file structure
   - What each file does
   - What to update

5. **[TEMPLATE_OVERVIEW.md](./TEMPLATE_OVERVIEW.md)**
   - Documentation index
   - Quick reference
   - Feature matrix

6. **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)**
   - Migrating from other cities
   - Data preparation
   - Common issues

---

## ⚙️ Configuration Files

### Must Update (Required)

| File | Purpose | Priority |
|------|---------|----------|
| `/config/cityConfig.ts` | City info, GeoServer, map settings | 🔴 Critical |
| `/config/geoserverLayers.ts` | Layer names & mappings | 🔴 Critical |

### Should Update (Recommended)

| File | Purpose | Priority |
|------|---------|----------|
| `/data/heatStressContent.ts` | Heat sector descriptions | 🟡 High |
| `/data/airPollutionContent.ts` | Air sector descriptions | 🟡 High |
| `/data/floodContent.ts` | Flood sector descriptions | 🟡 High |
| `/public/data/legend-definitions.csv` | Legend colors | 🟡 High |

### Can Update (Optional)

| File | Purpose | Priority |
|------|---------|----------|
| Logos in `/public/` | Branding | 🟢 Medium |
| `/config/cityConfig.ts` → `BRANDING_CONFIG` | Colors, footer | 🟢 Medium |

---

## 🗺️ GeoServer Requirements

### You Need

1. **GeoServer instance** (2.20+)
2. **Published layers** with correct names
3. **CORS enabled** (if dashboard on different domain)
4. **(Optional) WMTS tile caching** for better performance

### Layer Naming Pattern

Your layers should follow this pattern:

```
{WORKSPACE}:HHI_2025
{WORKSPACE}:HHI_2040_SSP1
{WORKSPACE}:LST_2025
{WORKSPACE}:Air_AQI
{WORKSPACE}:Flood_Hazard
{WORKSPACE}:Road_Network
{WORKSPACE}:Buildings
```

Example with workspace `MUMBAI_CLIMATE`:
```
MUMBAI_CLIMATE:HHI_2025
MUMBAI_CLIMATE:LST_2025
MUMBAI_CLIMATE:Air_AQI
```

### Required Layer Attributes

**Road Network:**
- Ward (integer)
- iRAP_Vehicle (1-5)
- iRAP_Motorcycle (1-5)
- iRAP_Bicycle (1-5)
- iRAP_Pedestrian (1-5)

**Buildings:**
- Ward (integer)
- Height (float, in meters)

---

## 🎯 Feature Checklist

After starting the dashboard, verify these features work:

### Basic Features
- [ ] Map loads and centers on your city
- [ ] Basemap displays correctly
- [ ] Left panel opens/closes
- [ ] Sector buttons work (Heat, Air, Flood, etc.)

### Layer Loading
- [ ] Heat stress layers load
- [ ] Air pollution layers load
- [ ] Flood layer loads (if available)
- [ ] Road network displays
- [ ] Buildings display

### Controls
- [ ] Layer opacity slider works
- [ ] Scenario selector works (Baseline, SSP1, SSP2, SSP5)
- [ ] Year selector works (for historical data)
- [ ] Ward filter dropdown works

### Analytics
- [ ] KPI tiles show data
- [ ] Charts render correctly
- [ ] Legend displays and updates

---

## ❌ Common Issues

### Issue: Map doesn't center on city

**Solution:**
```typescript
// In /config/cityConfig.ts
export const MAP_CONFIG = {
  center: {
    lng: 72.8777,  // Make sure these are YOUR city coordinates
    lat: 19.0760,  // Format: decimal degrees (not DMS)
  },
};
```

### Issue: Layers don't load

**Solution 1:** Check GeoServer URL in browser
```
https://your-geoserver.com/geoserver/WORKSPACE/wms?service=WMS&request=GetCapabilities
```

**Solution 2:** Verify workspace name (case-sensitive!)
```typescript
// Must match exactly (case-sensitive)
workspace: 'MUMBAI_CLIMATE'  // NOT 'mumbai_climate' or 'Mumbai_Climate'
```

**Solution 3:** Check layer names match GeoServer
```typescript
// Must match exactly as published in GeoServer
'MUMBAI_CLIMATE:HHI_2025'  // NOT 'MUMBAI_CLIMATE:hhi_2025'
```

### Issue: CORS errors

**Solution:** Enable CORS in GeoServer:
```xml
<!-- In GeoServer web.xml -->
<filter>
  <filter-name>CorsFilter</filter-name>
  <filter-class>org.apache.catalina.filters.CorsFilter</filter-class>
  <init-param>
    <param-name>cors.allowed.origins</param-name>
    <param-value>*</param-value>
  </init-param>
</filter>
```

---

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

Output: `/dist` directory

### Deploy Options

**Vercel (Recommended):**
```bash
npm install -g vercel
vercel --prod
```

**Netlify:**
```bash
npm install -g netlify-cli
netlify deploy --prod
```

**AWS S3:**
```bash
aws s3 sync dist/ s3://your-bucket
```

**Traditional Hosting:**
Upload `/dist` folder contents to your web server.

---

## 📞 Getting Help

### Documentation Order

1. Read this file (START_HERE.md) ✅ You're here!
2. Follow [TEMPLATE_SETUP_GUIDE.md](./TEMPLATE_SETUP_GUIDE.md)
3. Use [CUSTOMIZATION_CHECKLIST.md](./CUSTOMIZATION_CHECKLIST.md) to validate
4. Check [TEMPLATE_OVERVIEW.md](./TEMPLATE_OVERVIEW.md) for reference

### Troubleshooting

1. Check browser console for errors (F12)
2. Verify GeoServer URLs work in browser
3. Check configuration values
4. See [TEMPLATE_SETUP_GUIDE.md](./TEMPLATE_SETUP_GUIDE.md) → Troubleshooting section

### Testing

```bash
# Test GeoServer connectivity
curl "https://your-geoserver.com/geoserver/WORKSPACE/wms?service=WMS&request=GetCapabilities"

# Test specific layer
curl "https://your-geoserver.com/geoserver/WORKSPACE/wms?service=WMS&version=1.1.0&request=GetMap&layers=WORKSPACE:HHI_2025&bbox=72,19,73,20&width=800&height=600&srs=EPSG:4326&format=image/png"
```

---

## 🎨 What This Template Provides

### Out-of-the-Box Features

✅ **Multi-Hazard Sectors:**
- Heat Stress (7 indices)
- Air Pollution (7 pollutants)
- Flood Hazard
- Multi-Hazard Composite
- Road Safety (iRAP)

✅ **Climate Scenarios:**
- Baseline 2025
- SSP1-2.6 (Low emissions, 2040)
- SSP2-4.5 (Medium emissions, 2040)
- SSP5-8.5 (High emissions, 2040)

✅ **Historical Data:**
- 2015-2024 time series (for heat stress)

✅ **Analytics:**
- Building-level exposure analysis
- Area-based risk calculations
- Infrastructure vulnerability queries
- Road network safety analysis
- Interactive charts and KPIs

✅ **UI Features:**
- Interactive map (MapLibre GL JS)
- 3D building visualization
- Layer opacity controls
- Ward/district filtering
- Scenario comparison view
- Interactive tutorial
- Data export (CSV, XLSX, GeoJSON, PDF)

---

## 📋 Quick Validation

Before considering setup complete:

- [ ] Configuration files updated
- [ ] GeoServer URL tested in browser
- [ ] Map loads and centers on city
- [ ] At least one hazard layer loads
- [ ] KPI tiles show data
- [ ] Charts render
- [ ] No console errors

---

## 🎯 Next Actions

1. **Complete Basic Setup** (5 minutes)
   - Follow steps 1-5 above
   - Verify dashboard loads

2. **Detailed Configuration** (30-60 minutes)
   - Read [TEMPLATE_SETUP_GUIDE.md](./TEMPLATE_SETUP_GUIDE.md)
   - Configure all GeoServer layers
   - Update content descriptions

3. **Customization** (1-2 hours)
   - Add logos
   - Customize branding
   - Adjust legend colors
   - Fine-tune settings

4. **Testing** (30 minutes)
   - Use [CUSTOMIZATION_CHECKLIST.md](./CUSTOMIZATION_CHECKLIST.md)
   - Test all features
   - Verify data displays correctly

5. **Deployment** (30 minutes)
   - Build production version
   - Deploy to hosting
   - Test live site

---

## 🌍 Ready to Build a Climate-Resilient Dashboard!

This template gives you everything needed to create a professional, production-ready climate risk assessment dashboard for your city.

**Let's get started! 🚀**

---

**Template Version:** 1.0.0  
**Status:** Production Ready  
**Last Updated:** 2024

---

**Questions?** Read [TEMPLATE_SETUP_GUIDE.md](./TEMPLATE_SETUP_GUIDE.md) for comprehensive documentation.
