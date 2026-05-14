# Bohol Tourism/CWIS Dashboard — Comprehensive Project Assessment

**Last Updated:** May 14, 2026 | **Version:** 0.21.0

---

## 1. Project Type & Purpose

### Overview
This is a **Citywide Inclusive Sanitation (CWIS) Planning & Decision Support Dashboard** for Bohol, Philippines. It's a sophisticated geospatial data visualization and analysis platform designed to help municipal planners, environmental managers, and decision-makers assess climate hazards, infrastructure vulnerability, and sanitation planning scenarios.

### Primary Goals
- **Hazard Assessment**: Display and analyze climate and environmental hazards (heat stress, flooding, air quality, storm surge)
- **Infrastructure Analysis**: Evaluate building exposure to hazards and plan infrastructure interventions
- **Scenario Planning**: Support infrastructure planning decisions (FSTP facilities, sewer networks, road safety improvements)
- **Multi-hazard Analysis**: Enable comparison of different climate scenarios and planning alternatives
- **Risk Visualization**: Provide interactive maps, charts, and statistics to stakeholders

### Target Users
- Municipal planners and engineers
- Environmental/climate specialists
- Infrastructure decision-makers
- Government officials
- NGO partners involved in sanitation and climate adaptation

---

## 2. Technology Stack

### Frontend
| Component | Technology | Version |
|-----------|-----------|---------|
| **Framework** | React | 18.3.1 |
| **Build Tool** | Vite | 6.3.5 |
| **Language** | TypeScript | 5.x |
| **CSS Framework** | Tailwind CSS | 4.1.12 |
| **UI Components** | Radix UI | Latest (26+ components) |
| **Mapping Library** | MapLibre GL | 5.15.0 |
| **Charting** | Recharts | 2.15.2 |
| **Data Visualization** | Turf.js, JsPDF, html2canvas, modern-screenshot |
| **Form Handling** | React Hook Form | 7.55.0 |
| **Icons** | Lucide React | 0.487.0 |
| **Theme Management** | next-themes | 0.4.6 |
| **Notifications** | Sonner | 2.0.3 |
| **Carousels** | Embla Carousel | 8.6.0 |
| **3D Panorama** | Pannellum | 2.5.7 |

### Backend
| Component | Technology | Version |
|-----------|-----------|---------|
| **Framework** | Express | 4.21.2 |
| **Language** | TypeScript | 5.7.3 |
| **Runtime** | Node.js | 22+ required |
| **Database** | PostgreSQL + PostGIS | Azure-hosted |
| **Database Client** | pg (node-postgres) | 8.13.3 |
| **Middleware** | CORS | 2.8.5 |
| **Development** | ts-node, nodemon | Dev dependencies |
| **Environment** | dotenv | 16.4.5 |

### External Services
| Service | Purpose | URL |
|---------|---------|-----|
| **GeoServer** | WMS/WFS geospatial data | geoserver.azure.innpact.ai |
| **Azure Database for PostgreSQL** | PostGIS spatial database | gvx-prod-db.postgres.database.azure.com |
| **Azure App Services** | Hosting (Frontend & Backend) | See Deployment section |

---

## 3. Directory Structure

```
Bohol-Tourism/
│
├── src/                                    # React Frontend (TypeScript)
│   ├── components/                         # 40+ React components
│   │   ├── MapCanvas.tsx                   # Main interactive map
│   │   ├── Header.tsx, Footer.tsx          # Layout components
│   │   ├── LeftDrawer.tsx                  # Layer controls
│   │   ├── RightPanelContainer.tsx         # Analytics panels
│   │   ├── ModulePanel.tsx                 # Scenario planning panels
│   │   ├── FloatingLegendPanel.tsx         # Dynamic legend
│   │   ├── BuildingPopup.tsx               # Building detail popups
│   │   ├── AlertsPanel.tsx                 # Alert notifications
│   │   ├── ComparisonView.tsx              # Side-by-side layer comparison
│   │   ├── PanoramaViewerModal.tsx         # 3D panorama viewer
│   │   ├── TutorialOverlay.tsx             # Interactive tutorial
│   │   ├── ModuleNavigationTabs.tsx        # Multi-module navigation
│   │   ├── HistoricalTrendsPanel.tsx       # Time series analytics
│   │   ├── InfrastructureRiskPanel.tsx     # Infrastructure analysis
│   │   ├── RoadSafetyPanel.tsx             # Road safety metrics
│   │   ├── [50+ other specialized components]
│   │   └── ui/                             # Radix UI wrappers (buttons, dialogs, etc.)
│   │
│   ├── config/                             # Configuration files
│   │   ├── geoserverLayers.ts              # WMS layer definitions
│   │   ├── cwisLayersConfig.ts             # CWIS hazard layers
│   │   ├── environmentalLayers.ts          # Environmental layer configs
│   │   ├── cityConfig.ts                   # City-specific settings
│   │   ├── layerStyles.ts                  # Legend and color schemes
│   │   └── panoramaLocations.ts            # 3D panorama locations
│   │
│   ├── contexts/                           # React Context/Providers
│   │   └── HazardDataContext.tsx           # Preloads all sector KPI data
│   │
│   ├── hooks/                              # Custom React hooks
│   │   ├── useBuildingHazard.ts            # Building hazard queries
│   │   ├── useHazardAreaData.ts            # Hazard area statistics
│   │   ├── useHazardKPI.ts                 # KPI calculations
│   │   ├── useRoadNetworkData.ts           # Road network analysis
│   │   ├── useRoadSafetyData.ts            # Road safety metrics
│   │   ├── useFstpBuildingStats.ts         # FSTP facility coverage
│   │   ├── useGroundwaterBuildingStats.ts  # Groundwater analysis
│   │   ├── useHeatStressBuildingStats.ts   # Heat exposure analysis
│   │   ├── useIMDHeatAnalytics.ts          # IMD heat calendar analytics
│   │   └── [more data hooks...]
│   │
│   ├── utils/                              # Utility functions
│   │   ├── customApiClient.ts              # Generic REST client (reads VITE_API_BASE_URL)
│   │   ├── buildingHazardApi.ts            # Building hazard queries
│   │   ├── hazardAreaData.ts               # Hazard area calculations
│   │   ├── roadNetworkData.ts              # Road network analysis
│   │   ├── roadSafetyData.ts               # Road safety API calls
│   │   ├── educationData.ts                # Education POI data
│   │   ├── healthcareData.ts               # Healthcare POI data
│   │   ├── publicAmenitiesData.ts          # Public amenities data
│   │   ├── transportData.ts                # Transport data
│   │   ├── legendLoader.ts                 # Load legend definitions
│   │   ├── chartDownload.ts                # Export charts to PDF/PNG
│   │   ├── areaCalculation.ts              # Spatial area calculations
│   │   ├── buildingsCache.ts               # Client-side cache for buildings
│   │   ├── historicalTrendsApi.ts          # Time series data
│   │   └── [more utility functions...]
│   │
│   ├── data/                               # Static data & definitions
│   │   ├── airPollutionContent.ts          # Air quality descriptions
│   │   ├── floodContent.ts                 # Flood hazard descriptions
│   │   ├── heatStressContent.ts            # Heat stress descriptions
│   │   ├── infrastructureContent.ts        # Infrastructure descriptions
│   │   ├── roadSafetyContent.ts            # Road safety descriptions
│   │   ├── multiHazardContent.ts           # Multi-hazard descriptions
│   │   ├── legendDefinitions.ts            # Legend display data
│   │   └── kpiLabels.ts                    # KPI label translations
│   │
│   ├── styles/                             # Global styles
│   │   └── globals.css                     # Tailwind utilities and animations
│   │
│   ├── assets/                             # Static assets
│   │   └── [images, logos, Figma assets]
│   │
│   ├── App.tsx                             # Main app component
│   ├── main.tsx                            # Entry point
│   ├── index.css                           # Tailwind import + keyframe animations
│   └── env.d.ts                            # TypeScript Vite env declarations
│
├── server/                                 # Express Backend (TypeScript)
│   ├── src/
│   │   ├── index.ts                        # Express app setup + route mounting
│   │   │                                   #   - CORS configuration
│   │   │                                   #   - JSON middleware
│   │   │                                   #   - Route initialization
│   │   │
│   │   ├── db/
│   │   │   ├── pool.ts                     # pg.Pool singleton (connects via DATABASE_URL)
│   │   │   ├── overlayRegistry.ts          # Manage spatial overlay tables
│   │   │   └── scenarioPrecompute.ts       # Precompute Module 1/3 scenarios
│   │   │
│   │   ├── routes/                         # API endpoints
│   │   │   ├── health.ts                   # GET /health (database connectivity check)
│   │   │   ├── tables.ts                   # GET /api/tables (list database tables)
│   │   │   ├── groundwaterBuildings.ts     # GET /api/groundwater-buildings/stats
│   │   │   ├── heatStressBuildings.ts      # GET /api/heat-stress-buildings/stats
│   │   │   ├── infiltrationBuildings.ts    # GET /api/infiltration-buildings/stats
│   │   │   ├── scenarioBuildings.ts        # GET /api/scenario-buildings (all scenarios)
│   │   │   ├── scenarioResults.ts          # GET /api/scenario-results (Module 1)
│   │   │   ├── scenarioGrid.ts             # GET /api/scenario-grid (raster grid data)
│   │   │   ├── fstpBuildingStats.ts        # GET /api/fstp-building-stats (Module 3)
│   │   │   ├── fleetStats.ts               # GET /api/fleet-stats (fleet analysis)
│   │   │   └── adminRebuild.ts             # POST /api/admin/rebuild (regenerate tables)
│   │   │
│   │   ├── scripts/                        # Database initialization & precomputation
│   │   │   ├── setup_overlay_registry.ts   # Setup spatial overlay tables
│   │   │   ├── create_buildings_groundwater.ts
│   │   │   ├── create_buildings_heat_stress.ts
│   │   │   ├── create_buildings_infiltration.ts
│   │   │   ├── precompute_scenario_network.ts
│   │   │   ├── precompute_fstp_buildings.ts
│   │   │   ├── exclude_buildings.ts
│   │   │   └── [more data scripts...]
│   │   │
│   │   └── data/
│   │       └── manual-sewer-zones.json     # Static sewer zone definitions
│   │
│   ├── dist/                               # Compiled JavaScript (generated)
│   ├── package.json                        # Backend dependencies & scripts
│   ├── tsconfig.json                       # TypeScript configuration
│   └── .env.example                        # Environment variable template
│
├── build/                                  # Compiled React app (generated by Vite)
├── public/                                 # Static assets
│   ├── pannellum.js/css                    # 3D panorama viewer
│   ├── panoramas/                          # 3D panorama images
│   └── temp/                               # Temporary CSV data files
│
├── .github/
│   └── workflows/
│       └── deploy.yml                      # CI/CD GitHub Actions
│
├── vite.config.ts                          # Vite build configuration
├── tsconfig.json                           # Frontend TypeScript config
├── tsconfig.node.json                      # Node build tools TypeScript config
├── package.json                            # Root dependencies (frontend)
├── index.html                              # HTML entry point
├── AGENTS.md                               # Architecture & API guide
├── README.md                               # Quick start guide
└── [other markdown docs]                   # Multiple implementation guides
```

---

## 4. Key Components

### Layout & Navigation Components
| Component | Purpose | Key Features |
|-----------|---------|--------------|
| **Header** | Top navigation bar | Logo, title, help link |
| **Footer** | Bottom footer | Attribution, links |
| **LeftDrawer** | Left panel with layer controls | Layer toggles, visibility, opacity |
| **LeftRail** | Left sidebar navigation | Tab navigation between views |
| **RightPanelContainer** | Right side analytics | Dynamically loads different panels based on mode |
| **ModuleNavigationTabs** | Multi-module tabs | Heat, Air, Flood, Infrastructure, Road Safety, Base Layers |
| **WardFilterBar** | Geographic filter | Municipality/barangay selector |

### Map & Visualization Components
| Component | Purpose | Key Features |
|-----------|---------|--------------|
| **MapCanvas** | Main interactive map | MapLibre GL rendering, layer switching, zoom/pan |
| **FloatingLegendPanel** | Dynamic legend | Shows classifications for active layers |
| **ComparisonView** | Side-by-side map comparison | Displays two scenarios/layers side-by-side |
| **PanoramaViewerModal** | 3D street view | Pannellum integration for immersive viewing |
| **TutorialOverlay** | Interactive tutorial | Guided walkthrough for new users |

### Hazard Analysis Components
| Component | Purpose |
|-----------|---------|
| **HeatStressBuildingChart** | Building exposure to heat hazards |
| **GroundwaterBuildingChart** | Groundwater depth distribution analysis |
| **InfiltrationBuildingChart** | Soil infiltration capacity analysis |
| **AreaDistributionChart** | Hazard area by classification |
| **ImpactDistributionDataDriven** | Impact metrics by zone |
| **HistoricalTrendsPanel** | Time series analysis over years |
| **IMDHeatCalendar** | Calendar heatmap of temperature trends |

### Infrastructure & Planning Components
| Component | Purpose | Features |
|-----------|---------|----------|
| **InfrastructureRiskPanel** | Infrastructure assessment | POI analysis, exposure metrics |
| **RoadSafetyFilterPanel** | Road safety analytics | Star ratings, accident analysis |
| **RoadLengthChart** | Road network statistics | Length by type, classification |
| **RoadNameStarRatingChart** | Individual road metrics | Safety ratings per road |
| **ModulePanel** | Scenario planning (FSTP, networks) | Service area, coverage analysis |
| **AlertsPanel** | Critical warnings & notifications | High-risk area alerts |

### Popup & Detail Components
| Component | Purpose |
|-----------|---------|
| **BuildingPopup** | Individual building details |
| **WardPopup** | Ward/barangay information |
| **EducationPopup** | School/education facility details |
| **HealthcarePopup** | Hospital/clinic information |
| **PublicAmenitiesPopup** | Market, church, other POIs |
| **TransportPopup** | Transport infrastructure details |
| **RoadSafetyPopup** | Road segment safety metrics |

### Data & Analytics Components
| Component | Purpose |
|-----------|---------|
| **ModuleAnalyticsPanel** | Main analytics for module |
| **DetailedBreakdownDataDriven** | Detailed statistics tables |
| **LayerAreaBreakdown** | Area statistics by classification |
| **VennDiagramSimple** | Multi-hazard overlap visualization |
| **DownloadableChartWrapper** | Export charts to PDF/PNG |
| **QueryPanel** | Spatial query interface |
| **RoadNetworkStackedBarChart** | Road network composition |
| **RoadHazardBarChart** | Road hazard exposure |

---

## 5. Data Flow Architecture

### End-to-End Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ USER INTERACTION (React Components)                         │
│ - Map clicks, layer selection, date picking                 │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ STATE MANAGEMENT (React Context + Hooks)                    │
│ - HazardDataContext (preloads KPI data)                     │
│ - useHazardAreaData, useBuildingHazard, etc.               │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ API CLIENTS (Utility functions)                             │
│ - customApiClient.ts (generic REST client)                 │
│ - buildingHazardApi.ts, hazardKpiApi.ts, etc.             │
└────────────┬─────────────┬──────────────┬─────────────────┘
             │             │              │
             ▼             ▼              ▼
┌──────────────────┐  ┌─────────────┐  ┌──────────────────┐
│ WMS RASTER TILES │  │ EXPRESS API │  │ WFS VECTORS      │
│ GeoServer        │  │ bohol-cwis- │  │ GeoServer        │
│ (geoserver.     │  │ api         │  │ (Boundaries,     │
│  azure.         │  │ /health     │  │  Infrastructure) │
│  innpact.ai)    │  │ /api/*      │  │                  │
│                 │  │             │  │                  │
│ ✅ Heat (HHI,  │  │ ✅ GET      │  │ ✅ Barangay     │
│    LST, UHI,   │  │  /api/      │  │    Boundaries   │
│    WBT)        │  │  groundwater-│  │                  │
│ ✅ Flood       │  │  buildings  │  │ ✅ Roads         │
│ ✅ Storm Surge │  │ ✅ GET /api/│  │                  │
│ ✅ Air Quality │  │  fstp-      │  │ ✅ Education    │
│ ✅ Other       │  │  building-  │  │    (Schools)     │
│    hazards     │  │  stats      │  │                  │
│                 │  │ ✅ GET /api/│  │ ✅ Healthcare   │
│                 │  │  scenario-  │  │    (Hospitals)  │
│                 │  │  results    │  │                  │
│                 │  │ ✅ POST     │  │ ✅ Transport    │
│                 │  │  /admin/    │  │                  │
│                 │  │  rebuild    │  │                  │
│                 │  │             │  │                  │
└──────────────────┘  └─────────────┘  └──────────────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │ PostgreSQL + PostGIS │
                  │                      │
                  │ Tables:              │
                  │ - Buildings          │
                  │ - ovl_bldg_gw        │
                  │ - ovl_bldg_hs        │
                  │ - fstp_building_*    │
                  │ - scenario_results_* │
                  │ - Barangays          │
                  │ - Roads              │
                  │ - POIs               │
                  │                      │
                  └──────────────────────┘
```

### Key Data Sources

| Source | Type | What it provides | Usage |
|--------|------|-----------------|-------|
| **GeoServer WMS** | Raster tiles | Heat stress, flood, air quality maps | Layer rendering on map |
| **GeoServer WFS** | Vector features | Boundaries, roads, infrastructure | POI queries, feature queries |
| **PostGIS Database** | Vector/Raster | Building analysis, spatial joins | Building statistics, scenario results |
| **Legacy Backend** | REST API | Building hazard analysis, POI spatial queries | Historical data, detailed lookups |
| **bohol-cwis-api** | REST API | Precomputed statistics, scenario results | Fast KPI calculations |

---

## 6. Configuration Files

### Frontend Configuration

#### **vite.config.ts**
- **Build tool**: Vite 6.3.5
- **Plugins**: React, Tailwind CSS
- **Resolves**: Complex module aliases for Radix UI, Recharts, and Figma assets
- **Version Strategy**: Auto-incremented from git commit count (`v0.commitCount`)
- **Key config**: 
  ```typescript
  plugins: [react(), tailwindcss()],
  resolve: { extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'] }
  ```

#### **tsconfig.json** (Frontend)
- **Target**: ES2020
- **Strict Mode**: Disabled (`strict: false`) for flexibility
- **Module System**: ESNext (for tree-shaking)
- **JSX**: `react-jsx` (automatic JSX transform)
- **Special handling**: `allowImportingTsExtensions` for direct .ts imports

#### **index.css**
```css
@import 'tailwindcss' source(none);
@source './**/*.{js,ts,jsx,tsx}';
@import 'tw-animate-css';
@import './styles/globals.css';
```
- Tailwind v4 with content scanning
- Custom keyframe animations (fadeSlideIn)
- Animation CSS library integration

#### **package.json** (Frontend)
**Scripts:**
- `npm run dev` — Vite dev server (port 3000)
- `npm run build` — Production build to `build/` directory

**Key Dependencies:**
- UI: 26+ Radix UI components, Lucide icons
- Maps: MapLibre GL 5.15.0
- Charts: Recharts 2.15.2
- Data: Turf.js (spatial analysis)
- Export: JsPDF, html2canvas (PDF/image export)

---

### Backend Configuration

#### **server/tsconfig.json**
- **Target**: ES2020
- **Module System**: CommonJS (for Node.js)
- **Output**: `dist/` directory
- **Strict Mode**: Enabled (`strict: true`)
- **Source Maps**: Enabled for debugging

#### **server/package.json**
**Scripts:**
- `npm run dev` — ts-node + nodemon for development (watches `src/`)
- `npm run build` — TypeScript compilation (`tsc`) → `dist/`
- `npm run start` — Run compiled `dist/index.js`
- `npm run type-check` — Type checking without emit
- Special scripts:
  - `npm run setup:registry` — Initialize overlay registry
  - `npm run rebuild:groundwater` — Rebuild groundwater analysis tables
  - `npm run rebuild:heat-stress` — Rebuild heat stress analysis tables

**Key Dependencies:**
- Framework: Express 4.21.2
- Database: pg 8.13.3 (node-postgres)
- CORS: For frontend cross-origin access
- Environment: dotenv for config

#### **.env Template** (server/.env.example)
```env
DATABASE_URL=postgresql://user:password@gvx-prod-db.postgres.database.azure.com:5432/philippines?sslmode=verify-full
PORT=8080
NODE_ENV=production
ALLOWED_ORIGIN=https://boholdashboard-ctfydscra6cdeafz.southeastasia-01.azurewebsites.net
```

---

### GeoServer Configuration Files

#### **src/config/geoserverLayers.ts**
- **Purpose**: Map WMS layer IDs to GeoServer workspace names
- **Structure**: 
  ```typescript
  const layerScenarioMap = {
    heat_hhi: { '2015': 'WORKSPACE:HHI_2015', ... },
    heat_lst: { ... },
    air_aqi: { ... },
    ...
  }
  ```
- **Scenarios supported**: 2015–2024 historical + baseline_2025 + SSP1/2/5 2040 projections
- **Status**: Template with placeholder `YOUR_WORKSPACE:` (needs city-specific configuration)

#### **src/config/cwisLayersConfig.ts**
- **Purpose**: CWIS hazard layer definitions
- **Includes**:
  ```typescript
  flood_hazard, storm_surge, heat_stress_index, 
  land_surface_temperature, urban_heat_island, wet_bulb_temperature
  ```
- **Status**: ✅ Connected to GeoServer (WorldBank_Bohol workspace)

#### **src/config/layerStyles.ts**
- **Purpose**: Color schemes and classifications for legends
- **Structure**: `LayerStyleDefinition` with color codes, labels, descriptions
- **Example**:
  ```typescript
  elevation: {
    layerId: 'elevation',
    styles: [
      { value: '0 - 10 m', color: '#f6fd96', label: '0 - 10 m' },
      ...
    ]
  }
  ```
- **Auto-syncs**: Legend colors match GeoServer SLD styles

---

## 7. Routes & Pages

### Frontend Routes (React)
The application uses a **module-based navigation** system rather than traditional URL routing:

| Module | Access | Purpose | Key Features |
|--------|--------|---------|--------------|
| **Heat Stress** | Tab 1 - LeftDrawer | Temperature & heat stress analysis | HHI, LST, UHI, WBT, WBGT, RH layers |
| **Air Quality** | Tab 2 - LeftDrawer | Air pollution assessment | AQI, CO, NO2, PM2.5, PM10 |
| **Flooding** | Tab 3 - LeftDrawer | Urban flood risk | Flood hazard, infiltration, storm surge |
| **Multi-Hazard** | Tab 4 - LeftDrawer | Combined hazard analysis | Overlap metrics, composite scoring |
| **Infrastructure** | Tab 5 - LeftDrawer | POI analysis | Education, healthcare, transport, utilities |
| **Road Safety** | Tab 6 - LeftDrawer | Road network safety | Star ratings, accident hotspots |
| **Base Layers** | Tab 7 - LeftDrawer | Geographic base data | Elevation, greenness, population density |
| **Environmental** | Tab 8 - LeftDrawer | Soil classification | Infiltration, permeability |

### Module-Specific Views
- **ModulePanel**: Scenario planning interface for infrastructure (FSTP facilities, sewer networks)
- **ComparisonView**: Side-by-side comparison of two layers/scenarios
- **HistoricalTrendsPanel**: Time series display (2015–2024)
- **AlertsPanel**: Critical warnings and high-risk zones

### Special Features
- **Full-screen Map Mode**: Maximize map view
- **Tutorial Mode**: Guided walkthrough with highlights and tooltips
- **Ward/Barangay Filter**: Geographic drill-down

---

## 8. Backend API Endpoints

### Base URL
- **Production**: `https://bohol-cwis-api.azurewebsites.net`
- **Local Dev**: `http://localhost:8080`
- **Environment Variable**: `VITE_API_BASE_URL` (read by frontend)

### Endpoints

#### Health & Discovery
| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/health` | GET | Database connectivity check | `{ status: "ok", db: "connected", timestamp }` |
| `/api/tables` | GET | List all database tables | `{ count, tables: [{ table_name, table_type }] }` |

#### Building Analysis (Overlays)
| Endpoint | Method | Query Params | Response | Purpose |
|----------|--------|--------------|----------|---------|
| `/api/groundwater-buildings/stats` | GET | `munName`, `brgyName` | Building count by groundwater depth | Groundwater exposure analysis |
| `/api/heat-stress-buildings/stats` | GET | `munName`, `brgyName` | Building count by heat stress level | Heat exposure analysis |
| `/api/infiltration-buildings/stats` | GET | `munName`, `brgyName` | Building count by infiltration type | Soil infiltration analysis |

#### Scenario Planning (Module 1)
| Endpoint | Method | Query Params | Response | Purpose |
|----------|--------|--------------|----------|---------|
| `/api/scenario-results` | GET | `d`, `g`, `w`, `f` (1–4) | Precomputed scenario stats | Fast Module 1 lookup |
| `/api/scenario-buildings` | GET | `density`, `gwd`, `gwi`, `fld` | All scenario results across all parameters | Full scenario enumeration |
| `/api/scenario-grid` | GET | `density`, `gwd`, `gwi`, `fld` | Raster grid for map rendering | Visual scenario display |

#### Infrastructure Planning (Module 3)
| Endpoint | Method | Query Params | Response | Purpose |
|----------|--------|--------------|----------|---------|
| `/api/fstp-building-stats` | GET | `facility_nm`, `scenario` | Building coverage by service band | FSTP coverage analysis |
| `/api/fstp-building-stats/geojson` | GET | Same as above | GeoJSON FeatureCollection | Map visualization of coverage |
| `/api/fleet-stats` | GET | `facility_nm`, `scenario` | Fleet vehicle statistics | Collection vehicle analysis |

#### Admin
| Endpoint | Method | Body | Purpose |
|----------|--------|------|---------|
| `/api/admin/rebuild` | POST | `{ tables: string[] }` | Regenerate specified overlay tables | Database maintenance |

### Response Format
**Success (200):**
```json
{
  "count": number,
  "data": [...] or "total": number,
  "precomputed": boolean,
  "computed_at": ISO timestamp
}
```

**Error (400/500):**
```json
{
  "error": "Human-readable error",
  "message": "Detailed technical message",
  "received": { params }
}
```

---

## 9. Styling & UI System

### CSS Framework: Tailwind CSS 4

#### Configuration
- **Version**: 4.1.12 (latest)
- **Integration**: Vite plugin (`@tailwindcss/vite`)
- **Content scanning**: Automatic detection from `**/*.{js,ts,jsx,tsx}`
- **Utilities**: Full Tailwind suite (spacing, colors, shadows, animations, etc.)

#### Custom Extensions
**Keyframe Animations** (in `index.css`):
```css
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

**Animation Library**: `tw-animate-css` for CSS animation presets

#### Color Scheme
- **Hazard Colors**: Defined in `src/config/layerStyles.ts`
- **Example Heat Hazard**: 
  - `#FFD700` (yellow) = Low risk
  - `#FF8C00` (orange) = Medium risk
  - `#FF0000` (red) = High risk
  - `#8B0000` (dark red) = Very high risk

### Component Library: Radix UI

#### 26+ Components Included
- **Layout**: Separator, ScrollArea
- **Dialogs**: Dialog, AlertDialog, Drawer (Vaul)
- **Inputs**: Input, Button, Checkbox, Radio, Switch, Slider, Toggle
- **Selection**: Select, ComboBox, ContextMenu
- **Menus**: Dropdown, Navigation, Menubar
- **Overlay**: Popover, HoverCard, Tooltip
- **Tabs**: Tabs, Accordion, Collapsible
- **Forms**: Label, integrated with React Hook Form
- **Aspect**: AspectRatio for responsive media

#### Styling Approach
- **Radix UI Primitive + Tailwind**: Components are unstyled primitives
- **Custom UI Wrappers**: `src/components/ui/` contains tailored Radix components
- **Utility Classes**: All styling via Tailwind classes

### Typography & Icons
- **Icons**: Lucide React (487 icons)
- **Font Stack**: System fonts (no custom fonts specified)
- **Responsive Text**: Tailwind responsive sizing (`text-sm`, `md:text-base`, `lg:text-lg`)

### Charts & Visualizations
- **Recharts**: Bar, line, pie, area charts
- **Custom Components**: 
  - VennDiagram for hazard overlaps
  - AreaDistributionChart for classification breakdowns
  - HistoricalTrendsPanel for time series
  - DownloadableChartWrapper for export functionality

---

## 10. Deployment

### Infrastructure Overview
| Resource | Type | Region | URL |
|----------|------|--------|-----|
| **BoholDashboard** | Azure App Service (Node 22) | South East Asia | `https://boholdashboard-ctfydscra6cdeafz.southeastasia-01.azurewebsites.net` |
| **bohol-cwis-api** | Azure App Service (Node 22) | South East Asia | `https://bohol-cwis-api.azurewebsites.net` |
| **gvx-prod-db** | Azure Database for PostgreSQL | South East Asia | `gvx-prod-db.postgres.database.azure.com:5432` |
| **Resource Group** | `philippines` | Subscription: Microsoft Azure Sponsorship | — |

### CI/CD Pipeline

**GitHub Actions Workflow** (`.github/workflows/deploy.yml`)

Triggers: Every push to `main` branch

**Two Parallel Jobs:**

#### Job 1: Deploy Frontend (`deploy-frontend`)
1. **Trigger**: Push to `main`
2. **Build**:
   - `npm install` (root)
   - `npm run build` (Vite) → generates `build/` directory
   - **Inject env**: `VITE_API_BASE_URL=https://bohol-cwis-api.azurewebsites.net`
3. **Deploy**: Publish to **BoholDashboard** App Service
   - Uses secret: `AZURE_FRONTEND_PUBLISH_PROFILE`
   - Startup command: `pm2 serve /home/site/wwwroot/build --no-daemon --spa`
   - `--spa` flag: All unknown routes → `index.html` (React Router)

#### Job 2: Deploy Backend (`deploy-backend`)
1. **Trigger**: Push to `main` (parallel with Job 1)
2. **Build**:
   - `npm install` (server/)
   - `npm run build` (TypeScript) → generates `server/dist/`
3. **Deploy**: Publish to **bohol-cwis-api** App Service
   - Uses secret: `AZURE_BACKEND_PUBLISH_PROFILE`
   - Startup command: `node dist/index.js`
   - Port: Auto-set by Azure (checks `$PORT` env var, defaults to 8080)

### Environment Variables

#### Frontend (Vite)
| Variable | Value | Purpose |
|----------|-------|---------|
| `VITE_API_BASE_URL` | `https://bohol-cwis-api.azurewebsites.net` | Backend API base URL |

#### Backend (Node.js)
| Variable | Example Value | Purpose |
|----------|--------------|---------|
| `DATABASE_URL` | `postgresql://...@gvx-prod-db...` | PostgreSQL connection string |
| `PORT` | `8080` | HTTP listen port (Azure sets automatically) |
| `NODE_ENV` | `production` | Environment mode (controls SSL, logging) |
| `ALLOWED_ORIGIN` | `https://boholdashboard-...` | CORS allowed origin(s) |

### Deployment Flow

```
GitHub (main branch)
    ↓
    ├── [Job 1] Build Frontend
    │   ├── npm install
    │   ├── npm run build (Vite)
    │   ├── inject VITE_API_BASE_URL
    │   └── publish to BoholDashboard App Service
    │
    └── [Job 2] Build Backend (parallel)
        ├── npm install (server/)
        ├── npm run build (TypeScript)
        └── publish to bohol-cwis-api App Service
```

### Local Development

**Terminal 1 — Frontend:**
```bash
npm run dev
# Vite dev server on http://localhost:3000
# Reads .env.local for VITE_API_BASE_URL
```

**Terminal 2 — Backend:**
```bash
cd server
cp .env.example .env  # Fill in real DATABASE_URL
npm run dev
# ts-node + nodemon on http://localhost:8080
# Watches src/ for changes
```

**Frontend → Backend Connection (Local):**
```bash
# .env.local (root, never commit)
VITE_API_BASE_URL=http://localhost:8080
```

### Database Migrations & Initialization

#### Setup Scripts (in `server/src/scripts/`)
```bash
# Initialize overlay registry (spatial tables)
npm run setup:registry

# Rebuild groundwater analysis tables
npm run rebuild:groundwater

# Rebuild heat stress analysis tables
npm run rebuild:heat-stress

# Rebuild infiltration analysis tables
npm run rebuild:infiltration
```

These scripts:
1. Connect to PostgreSQL via `DATABASE_URL`
2. Create/populate spatial overlay tables
3. Pre-join building features with hazard layers
4. Create indices for fast queries

---

## 11. Key Technologies Summary

### Frontend Ecosystem
- **UI/UX**: React 18 + Radix UI + Tailwind CSS 4
- **Mapping**: MapLibre GL JS (vector tiles)
- **Data Viz**: Recharts (charts) + Turf.js (spatial analysis)
- **Build**: Vite 6 (fast dev server, optimized builds)
- **Language**: TypeScript (strict type checking)

### Backend Ecosystem
- **Server**: Express (minimal, fast REST API)
- **Database**: PostgreSQL + PostGIS (spatial queries)
- **Language**: TypeScript (strict mode enabled)
- **Deployment**: Azure App Services (serverless + managed DB)

### External Services
- **GeoServer**: WMS/WFS for raster & vector geospatial data
- **Azure**: Cloud infrastructure (App Services, PostgreSQL, Container Registry)
- **GitHub**: Source control + CI/CD

---

## 12. Architecture Highlights

### Strengths
✅ **Modular Architecture**: Clear separation of frontend (React) and backend (Express)  
✅ **Scalable Design**: Precomputed scenario results + caching for fast responses  
✅ **Type Safety**: Full TypeScript across frontend and backend  
✅ **Modern Tooling**: Vite (fast builds), Tailwind (utility-first CSS), Radix UI (accessible)  
✅ **Geospatial Focus**: PostGIS + MapLibre for professional mapping  
✅ **Export Capabilities**: PDF/PNG chart export, GeoJSON support  
✅ **Real-time Data**: Context preloading ensures instant module switching  

### Deployment Advantages
✅ **CI/CD Automation**: GitHub Actions → Azure automatically  
✅ **Parallel Jobs**: Frontend and backend deploy independently  
✅ **Environment Management**: Secrets and env vars secure via GitHub  
✅ **Geographic Proximity**: SE Asia region for optimal latency  

### Extensibility
✅ **Plugin-based Layers**: New GeoServer layers → config files only (no code change)  
✅ **Custom Hazard Modules**: New sectors can be added following established patterns  
✅ **Scenario Framework**: Module 1 (SDM) and Module 3 (FSTP) use same precompute infrastructure  
✅ **Chart Components**: Reusable components for new analytics panels  

---

## 13. Quick Reference: Key Files to Modify

| Task | File(s) | Modification |
|------|---------|--------------|
| Add new GeoServer layer | `src/config/geoserverLayers.ts`, `src/config/cwisLayersConfig.ts` | Add layer definition + scenario mappings |
| Change color scheme | `src/config/layerStyles.ts` | Update color hex codes |
| Add new chart | `src/components/` | Create component + integrate into RightPanel |
| Add new API endpoint | `server/src/routes/*.ts` | New route file + mount in `server/src/index.ts` |
| Change deployment URL | `.github/workflows/deploy.yml` | Update `VITE_API_BASE_URL` injection |
| Modify styling globally | `src/index.css`, `src/styles/globals.css` | Update Tailwind directives |
| Add data source | `src/hooks/` + `src/utils/` | Create hook + utility API client |

---

## Conclusion

The **Bohol CWIS Dashboard** is a **production-grade geospatial planning platform** combining:
- **Advanced visualization** (MapLibre + Recharts)
- **Spatial analysis** (PostGIS + Turf.js)
- **Scenario modeling** (precomputed results)
- **Multi-modal interface** (map, charts, tables, 3D panoramas)
- **Cloud-native architecture** (Azure infrastructure)

The architecture is **well-designed for extension** — new hazards, layers, and analysis modules can be added following established patterns without core framework changes.

