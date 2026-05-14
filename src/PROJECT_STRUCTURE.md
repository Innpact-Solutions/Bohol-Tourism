# 📁 Multi-Hazard Climate Dashboard - Project Structure

## Overview

This is a clean, production-ready template for creating multi-hazard climate screening dashboards for any city worldwide.

---

## 📂 Directory Structure

```
climate-dashboard/
│
├── 📄 Documentation (Root Level)
│   ├── README.md                        # Project overview & quick start
│   ├── TEMPLATE_SETUP_GUIDE.md          # Complete setup guide (⭐ START HERE)
│   ├── CUSTOMIZATION_CHECKLIST.md       # Setup validation checklist
│   ├── TEMPLATE_OVERVIEW.md             # Documentation index & reference
│   ├── MIGRATION_GUIDE.md               # Migration from other cities
│   ├── TEMPLATE_CREATION_SUMMARY.md     # Template creation details
│   └── PROJECT_STRUCTURE.md             # This file
│
├── ⚙️ Configuration
│   └── config/
│       ├── cityConfig.template.ts       # Configuration template (reference)
│       ├── cityConfig.ts                # ⚠️ UPDATE THIS: Active city config
│       ├── geoserverLayers.template.ts  # GeoServer layer template (reference)
│       └── geoserverLayers.ts           # ⚠️ UPDATE THIS: Active layer config
│
├── 🗺️ Core Application
│   ├── App.tsx                          # Root application component
│   └── contexts/
│       └── HazardDataContext.tsx        # Global data context
│
├── 🧩 Components
│   ├── components/
│   │   ├── MapCanvas.tsx                # Main map component (MapLibre GL JS)
│   │   ├── LeftDrawer.tsx               # Layer selection panel
│   │   ├── LeftRail.tsx                 # Sector selection sidebar
│   │   ├── RightPanel.tsx               # Analytics panel
│   │   ├── RightPanelContainer.tsx      # Analytics container
│   │   ├── FloatingLegendPanel.tsx      # Dynamic map legend
│   │   ├── Header.tsx                   # Application header
│   │   ├── Footer.tsx                   # Application footer
│   │   │
│   │   ├── 📊 Analytics & Charts
│   │   │   ├── AreaDistributionChart.tsx
│   │   │   ├── DetailedBreakdownDataDriven.tsx
│   │   │   ├── ImpactDistributionDataDriven.tsx
│   │   │   ├── HistoricalTrendsPanel.tsx
│   │   │   ├── IMDHeatCalendar.tsx
│   │   │   ├── RoadHazardBarChart.tsx
│   │   │   ├── RoadLengthChart.tsx
│   │   │   ├── RoadNameStarRatingChart.tsx
│   │   │   ├── RoadNetworkStackedBarChart.tsx
│   │   │   ├── RoadSafetyStackedBarChart.tsx
│   │   │   └── DownloadableChartWrapper.tsx
│   │   │
│   │   ├── 🔍 Panels & Filters
│   │   │   ├── InfrastructureRiskPanel.tsx
│   │   │   ├── InfraRightPanel.tsx
│   │   │   ├── QueryPanel.tsx
│   │   │   ├── AlertsPanel.tsx
│   │   │   ├── RoadSafetyFilterPanel.tsx
│   │   │   ├── WardFilterBar.tsx
│   │   │   ├── RoadNameFilter.tsx
│   │   │   └── LocationSearch.tsx
│   │   │
│   │   ├── 💬 Popups
│   │   │   ├── BuildingPopup.tsx
│   │   │   ├── WardPopup.tsx
│   │   │   ├── EducationPopup.tsx
│   │   │   ├── HealthcarePopup.tsx
│   │   │   ├── PublicAmenitiesPopup.tsx
│   │   │   ├── TransportPopup.tsx
│   │   │   └── RoadSafetyPopup.tsx
│   │   │
│   │   ├── 📋 Features
│   │   │   ├── ComparisonView.tsx          # Scenario comparison
│   │   │   ├── ClimateScenarioComparison.tsx
│   │   │   ├── TutorialOverlay.tsx         # Interactive tutorial
│   │   │   ├── TutorialClickIndicator.tsx
│   │   │   ├── InfoModal.tsx
│   │   │   ├── InitialLoadingOverlay.tsx
│   │   │   └── PrintLayout.tsx
│   │   │
│   │   ├── figma/
│   │   │   └── ImageWithFallback.tsx       # Image loading component
│   │   │
│   │   └── ui/                             # shadcn/ui components
│   │       ├── accordion.tsx
│   │       ├── alert.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── chart.tsx
│   │       ├── dialog.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── input.tsx
│   │       ├── select.tsx
│   │       ├── slider.tsx
│   │       ├── table.tsx
│   │       ├── tabs.tsx
│   │       └── ... (30+ UI components)
│
├── 🪝 Custom Hooks
│   └── hooks/
│       ├── useBuildingHazard.ts         # Building-level hazard analysis
│       ├── useHazardAreaData.ts         # Area-based hazard calculations
│       ├── useHazardKPI.ts              # KPI calculations
│       ├── useKPIAreaData.ts            # Area KPI data
│       ├── useIMDHeatAnalytics.ts       # IMD heat analytics
│       ├── usePOIQuery.ts               # Infrastructure queries
│       ├── useRoadNetworkData.ts        # Road network analysis
│       ├── useRoadSafetyData.ts         # Road safety analysis
│       └── useRoadSafetyFilters.ts      # Road safety filters
│
├── 🛠️ Utilities
│   └── utils/
│       ├── 🌐 API Clients
│       │   ├── buildingHazardApi.ts     # Building hazard API
│       │   ├── hazardKpiApi.ts          # KPI API
│       │   ├── poiQueryApi.ts           # POI query API
│       │   ├── historicalTrendsApi.ts   # Historical trends API
│       │   ├── imdHeatCalendarApi.ts    # IMD heat calendar API
│       │   └── customApiClient.ts       # Generic API client
│       │
│       ├── 📊 Data Processing
│       │   ├── hazardAreaData.ts        # Hazard area calculations
│       │   ├── hazardExposure.ts        # Exposure calculations
│       │   ├── areaCalculation.ts       # Area metrics
│       │   ├── kpiAreaCalculation.ts    # KPI area calculations
│       │   ├── impactDistributionData.ts
│       │   ├── roadNetworkAnalysis.ts   # Road network processing
│       │   ├── roadSafetyAnalysis.ts    # Road safety analysis
│       │   └── roadLengthData.ts        # Road length calculations
│       │
│       ├── 🗺️ Infrastructure Data
│       │   ├── educationData.ts         # Schools, colleges
│       │   ├── healthcareData.ts        # Hospitals, clinics
│       │   ├── publicAmenitiesData.ts   # Parks, libraries
│       │   ├── transportData.ts         # Stations, stops
│       │   └── infrastructureData.ts    # General infrastructure
│       │
│       ├── 🎨 Visualization
│       │   ├── legendLoader.ts          # Legend configuration
│       │   ├── chartDownload.ts         # Chart export
│       │   └── hazardMapping.ts         # Hazard color mapping
│       │
│       ├── ⚙️ Configuration
│       │   ├── buildingHazardConfig.ts  # Building analysis config
│       │   ├── hazardKpiConfig.ts       # KPI config
│       │   └── buildingsCache.ts        # Buildings caching
│       │
│       └── 🔧 Helpers
│           ├── fetchWithTimeout.ts      # API timeout handling
│           ├── roadNetworkData.ts       # Road network helpers
│           └── roadSafetyData.ts        # Road safety helpers
│
├── 📚 Data & Content
│   ├── data/
│   │   ├── heatStressContent.ts         # ⚠️ Customize: Heat sector content
│   │   ├── airPollutionContent.ts       # ⚠️ Customize: Air sector content
│   │   ├── floodContent.ts              # ⚠️ Customize: Flood sector content
│   │   ├── multiHazardContent.ts        # ⚠️ Customize: Multi-hazard content
│   │   ├── roadSafetyContent.ts         # ⚠️ Customize: Road safety content
│   │   ├── infrastructureContent.ts     # Infrastructure metadata
│   │   ├── kpiLabels.ts                 # KPI labels & descriptions
│   │   ├── legendDefinitions.ts         # Legend definitions
│   │   └── index.ts                     # Data exports
│   │
│   └── docs/
│       └── CSV_LEGEND_SYSTEM.md         # Legend CSV documentation
│
├── 🎨 Styles
│   └── styles/
│       └── globals.css                  # Global styles (Tailwind CSS)
│
├── 📦 Public Assets
│   └── public/
│       └── data/
│           └── legend-definitions.csv   # ⚠️ Customize: Legend color schemes
│
└── 📋 Configuration Files
    ├── package.json                     # Dependencies
    ├── tsconfig.json                    # TypeScript config
    ├── vite.config.ts                   # Vite build config
    └── tailwind.config.js               # Tailwind config
```

---

## 🎯 Files You MUST Update

When customizing this template for your city, you **must** update these files:

### 1. Configuration (Required)

| File | What to Update |
|------|----------------|
| `/config/cityConfig.ts` | City name, coordinates, GeoServer URL, workspace, map bounds, branding |
| `/config/geoserverLayers.ts` | Replace ALL `YOUR_WORKSPACE` with your actual GeoServer workspace name |

### 2. Content (Recommended)

| File | What to Update |
|------|----------------|
| `/data/heatStressContent.ts` | Heat stress descriptions for your city |
| `/data/airPollutionContent.ts` | Air pollution descriptions for your city |
| `/data/floodContent.ts` | Flood hazard descriptions for your city |
| `/data/multiHazardContent.ts` | Multi-hazard content for your city |
| `/data/roadSafetyContent.ts` | Road safety content for your city |

### 3. Legend (Recommended)

| File | What to Update |
|------|----------------|
| `/public/data/legend-definitions.csv` | Color schemes and risk thresholds matching your data |

### 4. Branding (Optional)

| File | What to Update |
|------|----------------|
| `/public/logo-header.png` | Your organization's header logo |
| `/public/logo-footer.png` | Your organization's footer logo |
| `/config/cityConfig.ts` | Update `BRANDING_CONFIG` section |

---

## 📖 Documentation Files

### Essential Documentation

1. **README.md**
   - Quick overview of the template
   - Quick start instructions
   - Feature list
   - Technology stack

2. **TEMPLATE_SETUP_GUIDE.md** ⭐ **START HERE**
   - Complete step-by-step setup instructions
   - GeoServer configuration
   - Layer requirements
   - API specifications
   - Deployment guide
   - Troubleshooting

3. **CUSTOMIZATION_CHECKLIST.md**
   - Pre-deployment checklist (100+ items)
   - Configuration validation
   - GeoServer checklist
   - Testing checklist
   - Deployment checklist

### Reference Documentation

4. **TEMPLATE_OVERVIEW.md**
   - Documentation index
   - Quick reference guide
   - Feature matrix
   - Where to find what

5. **MIGRATION_GUIDE.md**
   - Migrating from Bhubaneswar to your city
   - Step-by-step migration process
   - Data preparation
   - Common issues

6. **TEMPLATE_CREATION_SUMMARY.md**
   - What was done to create this template
   - What was removed
   - Statistics

7. **PROJECT_STRUCTURE.md** (This file)
   - Complete project structure
   - File descriptions
   - What to update

### Technical Documentation

8. **docs/CSV_LEGEND_SYSTEM.md**
   - Legend CSV format specification
   - Color scheme documentation

---

## 🔧 Key Technologies

| Technology | Purpose | Version |
|------------|---------|---------|
| **React** | UI framework | 18+ |
| **TypeScript** | Type safety | 5+ |
| **Vite** | Build tool | 5+ |
| **MapLibre GL JS** | Map rendering | 3.x |
| **Tailwind CSS** | Styling | 4.x |
| **shadcn/ui** | UI components | Latest |
| **Recharts** | Charts & graphs | Latest |
| **Lucide React** | Icons | Latest |

---

## 🗺️ GeoServer Integration

### Required GeoServer Layers

Your GeoServer instance must have these layers published:

**Heat Stress (7 layers):**
- HHI, LST, AST, WBT, WBGT, UHI, RH
- Pattern: `{workspace}:HHI_2025`, `{workspace}:HHI_2040_SSP1`, etc.

**Air Pollution (7 layers):**
- AQI, PM2.5, PM10, NO₂, SO₂, CO, O₃
- Pattern: `{workspace}:Air_AQI`, etc.

**Flood (1 layer):**
- FHI
- Pattern: `{workspace}:Flood_Hazard`

**Multi-Hazard (1 layer):**
- Composite assessment
- Pattern: `{workspace}:Multi_Hazard`

**Road Safety (1 layer):**
- Road network with iRAP ratings
- Pattern: `{workspace}:Road_Network`

**Infrastructure (7+ layers):**
- Buildings, Roads, Green Cover, Boundaries, etc.
- Pattern: `{workspace}:Buildings`, etc.

### Layer Attributes Required

**Road Network:**
- Ward (integer), Type (string), iRAP_Vehicle (1-5), iRAP_Motorcycle (1-5), iRAP_Bicycle (1-5), iRAP_Pedestrian (1-5), Length (float)

**Buildings:**
- Ward (integer), Height (float), Type (string), Area (float)

**Infrastructure POIs:**
- Name (string), Type (string), Ward (integer), geometry (Point)

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy configuration templates
cp config/cityConfig.template.ts config/cityConfig.ts
cp config/geoserverLayers.template.ts config/geoserverLayers.ts

# 3. Update configuration files
# Edit: config/cityConfig.ts (city name, coordinates, GeoServer URL)
# Edit: config/geoserverLayers.ts (replace YOUR_WORKSPACE)

# 4. Start development server
npm run dev

# 5. Open browser
# http://localhost:5173
```

---

## 📦 Build & Deploy

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy (choose your platform)
vercel --prod              # Vercel
netlify deploy --prod      # Netlify
aws s3 sync dist/ s3://... # AWS S3
```

---

## ✅ Validation

Before deployment, validate your configuration:

```typescript
import { validateCityConfig } from './config/cityConfig';

const result = validateCityConfig();
if (!result.valid) {
  console.error('Configuration errors:', result.errors);
}
```

---

## 🎨 Customization

### Feature Flags

Enable/disable features in `/config/cityConfig.ts`:

```typescript
export const FEATURE_FLAGS = {
  tutorial: true,           // Interactive tutorial
  comparison: true,         // Scenario comparison
  buildings3D: true,        // 3D building visualization
  terrain3D: false,         // 3D terrain (requires DEM)
  historicalTrends: true,   // 2015-2024 trends
  // ... more flags
};
```

### Branding

Update branding in `/config/cityConfig.ts`:

```typescript
export const BRANDING_CONFIG = {
  organization: 'Your Organization',
  logo: {
    header: '/logo-header.png',
    footer: '/logo-footer.png',
  },
  colors: {
    primary: '#2563EB',
    // ... more colors
  },
};
```

---

## 📞 Support

**Documentation:**
- Read `TEMPLATE_SETUP_GUIDE.md` for complete instructions
- Use `CUSTOMIZATION_CHECKLIST.md` for validation
- Check `TEMPLATE_OVERVIEW.md` for quick reference

**Troubleshooting:**
- Check browser console for errors
- Test GeoServer URLs directly
- Verify configuration values
- See `TEMPLATE_SETUP_GUIDE.md` troubleshooting section

---

## 📄 License

MIT License - See LICENSE file for details

---

**Template Version:** 1.0.0  
**Status:** Production Ready  
**Last Updated:** 2024

---

**Made for creating climate-resilient cities worldwide 🌍**
