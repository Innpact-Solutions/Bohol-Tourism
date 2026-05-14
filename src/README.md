# 🌍 Multi-Hazard Climate Screening & Mobility Exposure Dashboard

> A comprehensive, production-ready template for creating interactive climate risk assessment dashboards for any city worldwide.

![Dashboard Preview](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)
![MapLibre](https://img.shields.io/badge/MapLibre-GL%20JS-orange)
![React](https://img.shields.io/badge/React-18+-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue)

---

## 📖 About

This dashboard template provides a complete solution for visualizing and analyzing multi-hazard climate risks and mobility infrastructure exposure in urban areas. Built with modern web technologies and designed for easy customization, it can be deployed for any city with minimal configuration.

### ✨ Key Features

🗺️ **Interactive Mapping**
- MapLibre GL JS integration
- GeoServer WMS/WMTS layer support
- Real-time layer switching
- 3D building visualization
- Terrain elevation (optional)
- Custom basemap styles

📊 **Analytics & KPIs**
- Building-level hazard exposure analysis
- Area-based risk calculations
- Infrastructure vulnerability assessment
- Road network safety analysis (iRAP)
- Historical trends (2015-2024)
- Future climate projections (2040)

🔥 **Multi-Hazard Support**
- Heat Stress (HHI, LST, AST, WBT, WBGT, UHI, RH)
- Air Pollution (AQI, PM2.5, PM10, NO₂, SO₂, CO, O₃)
- Flood Hazard Index
- Multi-Hazard Composite Assessment
- Road Safety (Vehicle, Motorcycle, Bicycle, Pedestrian)

🏢 **Infrastructure Mapping**
- Educational Institutions
- Healthcare Facilities
- Public Amenities
- Transport Infrastructure
- Population-weighted analysis

📈 **Scenario Planning**
- Baseline (2025)
- SSP1-2.6 (Low emissions, 2040)
- SSP2-4.5 (Medium emissions, 2040)
- SSP5-8.5 (High emissions, 2040)

🎨 **User Experience**
- Responsive design (mobile, tablet, desktop)
- Interactive tutorial system
- Layer opacity controls
- Ward/district filtering
- Comparison view
- Data export (CSV, XLSX, GeoJSON, PDF)
- Chart download functionality

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- GeoServer instance with published layers
- (Optional) Custom API backend

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd climate-dashboard

# Install dependencies
npm install

# Copy configuration templates
cp config/cityConfig.template.ts config/cityConfig.ts
cp config/geoserverLayers.template.ts config/geoserverLayers.ts

# Update configuration files with your city details
# Edit: config/cityConfig.ts
# Edit: config/geoserverLayers.ts

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## ⚙️ Configuration

### Step 1: City Configuration

Edit `/config/cityConfig.ts`:

```typescript
export const CITY_CONFIG = {
  name: 'Your City',
  country: 'Your Country',
  displayName: 'Your City Climate Dashboard',
  shortCode: 'YC',
  timezone: 'Your/Timezone',
};

export const MAP_CONFIG = {
  center: { lng: 0.0, lat: 0.0 },  // Your city coordinates
  initialZoom: 12,
  bounds: {
    southwest: { lng: -1.0, lat: -1.0 },
    northeast: { lng: 1.0, lat: 1.0 },
  },
};

export const GEOSERVER_CONFIG = {
  baseUrl: 'https://your-geoserver.com/geoserver',
  workspace: 'YOUR_WORKSPACE',
};
```

### Step 2: GeoServer Layers

Edit `/config/geoserverLayers.ts`:

Replace all instances of `YOUR_WORKSPACE` with your actual GeoServer workspace name.

```typescript
export const GEOSERVER_WMS_URL = 'https://your-geoserver.com/geoserver/YOUR_WORKSPACE/wms';

// Update layer names
const layerScenarioMap = {
  heat_hhi: {
    baseline_2025: 'YOUR_WORKSPACE:HHI_2025',
    ssp1_2040: 'YOUR_WORKSPACE:HHI_2040_SSP1',
    // ...
  },
};
```

### Step 3: (Optional) API Endpoints

If using custom API backend, update `/config/cityConfig.ts`:

```typescript
export const API_CONFIG = {
  baseUrl: 'https://your-api.com',
  endpoints: {
    buildingHazard: '/api/building-hazard',
    areaKPI: '/api/area-kpi',
    // ...
  },
};
```

---

## 📁 Project Structure

```
├── config/
│   ├── cityConfig.ts                 # City-specific configuration
│   ├── cityConfig.template.ts        # Configuration template
│   ├── geoserverLayers.ts            # GeoServer layer definitions
│   └── geoserverLayers.template.ts   # Layer template
├── components/
│   ├── MapCanvas.tsx                 # Main map component
│   ├── LeftDrawer.tsx                # Layer selection panel
│   ├── RightPanel.tsx                # Analytics panel
│   ├── FloatingLegendPanel.tsx       # Dynamic legend
│   ├── ComparisonView.tsx            # Scenario comparison
│   └── ...
├── hooks/
│   ├── useHazardKPI.ts               # KPI calculation
│   ├── useHazardAreaData.ts          # Area analysis
│   ├── useBuildingHazard.ts          # Building analysis
│   └── ...
├── utils/
│   ├── buildingHazardApi.ts          # Building API client
│   ├── hazardKpiApi.ts               # KPI API client
│   ├── roadNetworkData.ts            # Road analysis
│   └── ...
├── data/
│   ├── heatStressContent.ts          # Heat stress metadata
│   ├── airPollutionContent.ts        # Air pollution metadata
│   ├── floodContent.ts               # Flood metadata
│   └── ...
├── public/
│   └── data/
│       └── legend-definitions.csv     # Legend color schemes
├── App.tsx                            # Root application
├── TEMPLATE_SETUP_GUIDE.md           # Detailed setup guide
└── README.md                          # This file
```

---

## 🗺️ GeoServer Requirements

### Required Layers

Your GeoServer instance should publish these layers (customize names as needed):

**Heat Stress:**
- HHI_2025, HHI_2040_SSP1, HHI_2040_SSP2, HHI_2040_SSP5
- LST_2025, LST_2040_SSP1, LST_2040_SSP2, LST_2040_SSP5
- AST, WBT, WBGT, UHI, RH (similar patterns)

**Air Pollution:**
- Air_AQI, Air_PM25, Air_PM10, Air_NO2, Air_SO2, Air_CO, Air_O3

**Flood:**
- Flood_Hazard

**Multi-Hazard:**
- Multi_Hazard

**Infrastructure:**
- Road_Network, Buildings, Green_Cover, Elevation, Municipal_Boundary, Slum, Builtup

### Layer Attributes

**Road Network:**
```
Ward (integer), Type (string), iRAP_Vehicle (1-5), iRAP_Motorcycle (1-5),
iRAP_Bicycle (1-5), iRAP_Pedestrian (1-5), Length (float)
```

**Buildings:**
```
Ward (integer), Height (float), Type (string), Area (float)
```

**Infrastructure (Schools, Hospitals, etc.):**
```
Name (string), Type (string), Ward (integer), Latitude (float), Longitude (float)
```

### Enable Tile Caching (WMTS)

For better performance:
1. GeoServer → Tile Caching → Gridsets → Enable `EPSG:900913`
2. Tile Caching → Tile Layers → Enable for each layer
3. Generate seed tiles for zoom levels 8-18

---

## 🔌 API Integration (Optional)

The dashboard can work with static GeoServer layers alone, but for advanced features, implement these APIs:

### Building Hazard Analysis

```typescript
POST /api/building-hazard
{
  "layerId": "heat_hhi",
  "scenario": "baseline_2025",
  "wardNumber": 15
}

Response: {
  "success": true,
  "data": {
    "totalBuildings": 2450,
    "riskCounts": { "Low": 850, "Moderate": 980, "High": 520, "Very High": 100 }
  }
}
```

### Area KPI Calculation

```typescript
POST /api/area-kpi
{
  "layerId": "heat_hhi",
  "scenario": "baseline_2025"
}

Response: {
  "success": true,
  "data": {
    "totalArea": 156.8,
    "areaCounts": { "Low": 42.1, "Moderate": 68.9, "High": 35.2, "Very High": 10.6 }
  }
}
```

See `TEMPLATE_SETUP_GUIDE.md` for complete API specifications.

---

## 🎨 Customization

### Branding

Update branding in `/config/cityConfig.ts`:

```typescript
export const BRANDING_CONFIG = {
  organization: 'Your Organization',
  logo: {
    header: '/your-logo.png',
    footer: '/your-footer-logo.png',
  },
  colors: {
    primary: '#2563EB',
    secondary: '#14B8A6',
    heat: '#EF4444',
    air: '#8B5CF6',
    flood: '#3B82F6',
  },
};
```

### Feature Toggles

Enable/disable features:

```typescript
export const FEATURE_FLAGS = {
  tutorial: true,
  comparison: true,
  scenarioPlanning: true,
  historicalTrends: true,
  buildingAnalysis: true,
  buildings3D: true,
  terrain3D: false,  // Disable if no DEM data
};
```

### Legend Colors

Edit `/public/data/legend-definitions.csv` to customize risk category colors and thresholds.

---

## 📊 Technologies

- **Frontend:** React 18, TypeScript 5
- **Mapping:** MapLibre GL JS 3.x
- **GIS:** GeoServer (WMS/WMTS)
- **Charts:** Recharts
- **UI:** Tailwind CSS 4, shadcn/ui
- **State:** React Hooks, Context API
- **Build:** Vite 5
- **Icons:** Lucide React

---

## 🚢 Deployment

### Build

```bash
npm run build
```

Output: `/dist` directory

### Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

### Deploy to Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

### Deploy to AWS S3

```bash
aws s3 sync dist/ s3://your-bucket-name
```

See `TEMPLATE_SETUP_GUIDE.md` for detailed deployment instructions including NGINX configuration.

---

## 📚 Documentation

- **[TEMPLATE_SETUP_GUIDE.md](./TEMPLATE_SETUP_GUIDE.md)** - Complete setup guide
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture
- **[DATA_FETCHING_GUIDE.md](./DATA_FETCHING_GUIDE.md)** - Data fetching patterns
- **[LAYER_ORDER_DOCUMENTATION.md](./LAYER_ORDER_DOCUMENTATION.md)** - Layer rendering
- **[KPI_SYSTEM_EXPLANATION.md](./KPI_SYSTEM_EXPLANATION.md)** - KPI calculations

---

## 🔧 Troubleshooting

### Layers not loading?

1. Check GeoServer URL in browser network tab
2. Verify workspace name (case-sensitive)
3. Ensure CORS enabled on GeoServer
4. Check layer names match exactly

### Map not centered?

1. Update `MAP_CONFIG.center` with correct coordinates
2. Verify format: `{ lng: number, lat: number }`
3. Set appropriate `initialZoom`

### 3D buildings not working?

1. Check `FEATURE_FLAGS.buildings3D = true`
2. Verify Buildings layer has `Height` attribute
3. Ensure height values are numeric

See `TEMPLATE_SETUP_GUIDE.md` for more troubleshooting tips.

---

## 🤝 Contributing

This is a template project. Customize and extend it for your specific needs.

Suggested improvements:
- Add new hazard sectors
- Implement additional API endpoints
- Create custom analysis tools
- Enhance visualizations

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

Built for GIZ (Deutsche Gesellschaft für Internationale Zusammenarbeit) climate resilience projects.

Core technologies:
- [MapLibre GL JS](https://maplibre.org/)
- [GeoServer](https://geoserver.org/)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

---

## 📞 Support

For setup assistance:
1. Read `TEMPLATE_SETUP_GUIDE.md`
2. Check existing documentation files
3. Review console logs for errors
4. Test GeoServer URLs directly

---

**Made with ❤️ for climate resilience**

**Version:** 1.0.0 (Template)  
**Status:** Production Ready  
**Last Updated:** 2024
