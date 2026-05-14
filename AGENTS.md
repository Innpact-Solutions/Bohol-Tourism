# AGENTS.md — Bohol CWIS Dashboard: Architecture & API Guide

This file describes the full project architecture and explains how to extend the Express/PostGIS backend when new data is needed by the frontend.

---

## Project Structure

```
Bohol_CWIS_Dashboard/
├── src/                        # React + Vite frontend (TypeScript)
│   ├── components/             # UI components
│   ├── hooks/                  # Data fetching hooks
│   ├── utils/                  # API client utilities
│   │   └── customApiClient.ts  # Generic REST client → reads VITE_API_BASE_URL
│   └── config/                 # GeoServer layer configs, map config
│
├── server/                     # Express TypeScript backend
│   ├── src/
│   │   ├── index.ts            # Entry point — Express app, CORS, route mounting
│   │   ├── db/
│   │   │   └── pool.ts         # pg.Pool singleton from DATABASE_URL
│   │   └── routes/
│   │       ├── health.ts       # GET /health
│   │       └── tables.ts       # GET /api/tables
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── build/                      # Vite production output (deployed to BoholDashboard)
├── .github/workflows/
│   └── deploy.yml              # CI/CD: two parallel jobs → both Azure App Services
└── AGENTS.md                   # This file
```

---

## Azure Infrastructure

| Resource | Type | URL |
|---|---|---|
| **BoholDashboard** | App Service — Node 22, SE Asia | `https://boholdashboard-ctfydscra6cdeafz.southeastasia-01.azurewebsites.net` |
| **bohol-cwis-api** | App Service — Node 22, SE Asia | `https://bohol-cwis-api.azurewebsites.net` |
| **gvx-prod-db** | Azure Database for PostgreSQL (PostGIS) | `gvx-prod-db.postgres.database.azure.com:5432` |
| Resource Group | `philippines` | Subscription: `Microsoft Azure Sponsorship` |

**BoholDashboard** serves the compiled React app using:
```
pm2 serve /home/site/wwwroot/build --no-daemon --spa
```
The `--spa` flag means all unknown routes fall back to `index.html`, so React Router works correctly.

**bohol-cwis-api** is the Express/PostGIS backend. It runs the compiled `dist/index.js` on `$PORT` (Azure sets this automatically).

---

## Data Sources

The frontend pulls data from three origins:

| Origin | What it serves |
|---|---|
| **GeoServer** (`geoserver.azure.innpact.ai`) | WMS raster hazard tiles; WFS GeoJSON for boundaries, infrastructure POIs, road networks |
| **Legacy Azure REST API** (`geo-view-x-backend-*.azurewebsites.net`) | Building hazard analysis, POI spatial queries |
| **bohol-cwis-api** (this backend) | PostGIS data — currently health check + table listing; new routes go here |

The frontend `customApiClient.ts` reads `import.meta.env.VITE_API_BASE_URL` as the base URL for `bohol-cwis-api`. In the GitHub Actions build this is injected as `https://bohol-cwis-api.azurewebsites.net`.

---

## Backend: Adding a New Route

All backend code lives in `server/src/`. Follow this pattern for every new data endpoint.

### 1. Create the route file

```ts
// server/src/routes/myData.ts
import { Router, Request, Response } from "express";
import pool from "../db/pool";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const { ward } = req.query;           // optional query param

  try {
    // Always use parameterized queries — never interpolate user input into SQL
    const result = await pool.query(
      `SELECT id, name, geom
       FROM public.my_table
       WHERE ($1::text IS NULL OR ward_name = $1)
       ORDER BY name`,
      [ward ?? null]
    );
    res.json({ count: result.rows.length, data: result.rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: "Query failed", message });
  }
});

export default router;
```

### 2. Mount it in index.ts

```ts
// server/src/index.ts
import myDataRouter from "./routes/myData";

app.use("/api/my-data", myDataRouter);
```

### 3. Call it from the frontend

Use `customApiClient.ts`, or call `fetch` directly:

```ts
const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/my-data?ward=Tagbilaran`);
const json = await res.json();
```

For a reusable hook, follow the pattern in `src/hooks/` (see `useBuildingHazard.ts` for a POST example, `useRoadNetworkData.ts` for a GET example).

---

## Current API Endpoints

### `GET /health`
Verifies the server is running and can reach the database.

**Response:**
```json
{
  "status": "ok",
  "db": "connected",
  "timestamp": "2026-04-03T07:00:00.000Z"
}
```

**Error (500):**
```json
{
  "status": "error",
  "db": "disconnected",
  "message": "..."
}
```

---

### `GET /api/tables`
Lists all table names in the `public` schema of the PostGIS database. Useful for discovery during development.

**Response:**
```json
{
  "count": 42,
  "tables": [
    { "table_name": "barangay_boundary", "table_type": "BASE TABLE" },
    { "table_name": "education",         "table_type": "BASE TABLE" },
    ...
  ]
}
```

---

## PostGIS Tips

The database has the PostGIS extension enabled. Spatial queries can use standard PostGIS functions.

**Return GeoJSON directly from SQL** (avoids manual serialization):
```sql
SELECT json_build_object(
  'type', 'FeatureCollection',
  'features', json_agg(
    json_build_object(
      'type', 'Feature',
      'geometry', ST_AsGeoJSON(geom)::json,
      'properties', json_build_object('id', id, 'name', name)
    )
  )
) AS geojson
FROM public.my_spatial_table;
```

**Filter by bounding box:**
```sql
WHERE ST_Intersects(geom, ST_MakeEnvelope($1, $2, $3, $4, 4326))
```

**Filter by barangay name** (consistent with how GeoServer WFS calls are filtered in the frontend):
```sql
WHERE ward_name = $1          -- matches BrgyName field convention used in GeoServer layers
```

---

## Local Development

```bash
# Terminal 1 — Frontend (Vite dev server on :3000)
npm run dev

# Terminal 2 — Backend (ts-node + nodemon on :8080)
cd server
cp .env.example .env    # fill in real DATABASE_URL
npm run dev
```

The frontend's `customApiClient.ts` falls back to `http://localhost:8080` is not wired for local dev automatically — set `VITE_API_BASE_URL=http://localhost:8080` in a root `.env.local` file to point the frontend at the local backend:

```bash
# .env.local (root — never commit)
VITE_API_BASE_URL=http://localhost:8080
```

---

## CI/CD: GitHub Actions

File: `.github/workflows/deploy.yml`

Two **parallel** jobs trigger on every push to `main`:

| Job | Builds | Deploys to | Secret required |
|---|---|---|---|
| `deploy-frontend` | `npm run build` at root → `build/` | BoholDashboard App Service | `AZURE_FRONTEND_PUBLISH_PROFILE` |
| `deploy-backend` | `npm run build` in `server/` → `server/dist/` | bohol-cwis-api App Service | `AZURE_BACKEND_PUBLISH_PROFILE` |

Both secrets are publish profile XMLs downloaded from the Azure portal or via `az webapp deployment list-publishing-profiles`.

`VITE_API_BASE_URL` is injected at build time as `https://bohol-cwis-api.azurewebsites.net` so the frontend always points at the production backend after deployment.

---

## Environment Variables

### Backend (`server/.env` locally; App Service settings in production)

| Variable | Description |
|---|---|
| `DATABASE_URL` | Full PostgreSQL connection string — database: `philippines`, `sslmode=verify-full` |
| `PORT` | HTTP port — Azure sets this automatically; defaults to `8080` |
| `NODE_ENV` | `development` or `production` — controls SSL enforcement |
| `ALLOWED_ORIGIN` | CORS allowed origin — set to the frontend hostname in production |

### Frontend (injected at build time via Vite)

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Base URL of `bohol-cwis-api` — used by `customApiClient.ts` |
