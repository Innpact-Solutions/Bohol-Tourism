/**
 * GET /api/fstp-building-stats
 * GET /api/fstp-building-stats/geojson
 *
 * Returns building coverage statistics and GeoJSON for the FSTP Module 3
 * service-area scenario selected by the user.
 *
 * The "facility_nm" parameter is determined client-side the same way
 * MapCanvas resolves it:
 *   • 1 facility  → FacilityNm from the DB (e.g. "Existing FSTP (Dauis)")
 *   • 2 facilities → combined name (e.g. "Existing + JAICA")
 *   • 3 facilities → "All Three FSTPs"
 *
 * GET /api/fstp-building-stats
 * Query params:
 *   facility_nm  — FacilityNm string (required)
 *   scenario     — "Normal" | "Peak" (required)
 *   bands        — comma-separated active bands (optional, default = all 4)
 *
 * Response:
 * {
 *   total_buildings: number,   -- total buildings in the DB
 *   covered: number,           -- buildings inside any active band
 *   uncovered: number,
 *   coverage_pct: number,      -- % covered (0–100)
 *   by_band: [{ band, count, color }],
 *   by_municipality: [{ mun, band_counts: {band: count}, total: number }],
 *   by_use_type: [{ use_type, count }],
 *   precomputed: boolean       -- false if table missing (falls back to live query)
 * }
 *
 * GET /api/fstp-building-stats/geojson
 * Same query params.
 * Returns a GeoJSON FeatureCollection of building centroids with properties:
 *   { band, mun_name, brgy_name, use_type }
 * Only covered (inside a band) buildings are returned.
 */
import { Router, Request, Response } from "express";
import pool from "../db/pool";

const router = Router();

const BAND_COLORS: Record<string, string> = {
  "< 10 min":    "#16A34A",
  "10 - 20 min": "#FACC15",
  "20 - 30 min": "#F97316",
  "> 30 min":    "#DC2626",
};

const ALL_BANDS = ["< 10 min", "10 - 20 min", "20 - 30 min", "> 30 min"];

function parseBands(raw: unknown): string[] {
  if (typeof raw === "string" && raw.trim()) {
    return raw.split(",").map((b) => b.trim()).filter((b) => ALL_BANDS.includes(b));
  }
  return ALL_BANDS;
}

async function isTableReady(client: any): Promise<boolean> {
  const r = await client.query(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_name = 'fstp_building_coverage'
    ) AS exists
  `);
  return r.rows[0].exists as boolean;
}

async function getTotalBuildings(client: any): Promise<number> {
  const r = await client.query(`SELECT COUNT(*) AS count FROM "Buildings"`);
  return parseInt(r.rows[0].count as string, 10);
}

// ── GET /api/fstp-building-stats ──────────────────────────────────────────────
router.get("/", async (req: Request, res: Response) => {
  const { facility_nm, scenario, bands: bandsRaw } = req.query;

  if (!facility_nm || typeof facility_nm !== "string") {
    return res.status(400).json({ error: "facility_nm query param is required" });
  }
  if (!scenario || (scenario !== "Normal" && scenario !== "Peak")) {
    return res.status(400).json({ error: "scenario must be 'Normal' or 'Peak'" });
  }

  const activeBands = parseBands(bandsRaw);

  const client = await pool.connect();
  try {
    const tableReady = await isTableReady(client);
    const totalBuildings = await getTotalBuildings(client);

    if (!tableReady) {
      return res.status(503).json({
        error: "Precomputed coverage table not found.",
        hint: "Run: cd server && npx ts-node src/scripts/precompute_fstp_buildings.ts  OR  POST /api/admin/precompute-fstp",
      });
    }

    // Band breakdown
    const bandResult = await client.query<{ band: string; count: string }>(
      `SELECT band, COUNT(*) AS count
       FROM fstp_building_coverage
       WHERE facility_nm = $1
         AND scenario    = $2
         AND band        = ANY($3::text[])
       GROUP BY band`,
      [facility_nm, scenario, activeBands]
    );

    const bandMap: Record<string, number> = {};
    for (const row of bandResult.rows) {
      bandMap[row.band] = parseInt(row.count, 10);
    }

    const byBand = ALL_BANDS
      .filter((b) => activeBands.includes(b))
      .map((b) => ({
        band:  b,
        count: bandMap[b] ?? 0,
        color: BAND_COLORS[b] ?? "#94A3B8",
      }));

    const covered = byBand.reduce((s, b) => s + b.count, 0);

    // Municipality breakdown
    const munResult = await client.query<{ mun_name: string; band: string; count: string }>(
      `SELECT COALESCE(mun_name, 'Unknown') AS mun_name, band, COUNT(*) AS count
       FROM fstp_building_coverage
       WHERE facility_nm = $1
         AND scenario    = $2
         AND band        = ANY($3::text[])
       GROUP BY mun_name, band
       ORDER BY mun_name, band`,
      [facility_nm, scenario, activeBands]
    );

    const munMap: Record<string, { band_counts: Record<string, number>; total: number }> = {};
    for (const row of munResult.rows) {
      if (!munMap[row.mun_name]) munMap[row.mun_name] = { band_counts: {}, total: 0 };
      const cnt = parseInt(row.count, 10);
      munMap[row.mun_name].band_counts[row.band] = cnt;
      munMap[row.mun_name].total += cnt;
    }

    const byMunicipality = Object.entries(munMap)
      .map(([mun, v]) => ({ mun, ...v }))
      .sort((a, b) => b.total - a.total);

    // Use-type breakdown
    const useResult = await client.query<{ use_type: string; count: string }>(
      `SELECT COALESCE(use_type, 'Unknown') AS use_type, COUNT(*) AS count
       FROM fstp_building_coverage
       WHERE facility_nm = $1
         AND scenario    = $2
         AND band        = ANY($3::text[])
       GROUP BY use_type
       ORDER BY count DESC`,
      [facility_nm, scenario, activeBands]
    );

    const byUseType = useResult.rows.map((r) => ({
      use_type: r.use_type,
      count:    parseInt(r.count, 10),
    }));

    return res.json({
      total_buildings: totalBuildings,
      covered,
      uncovered:    totalBuildings - covered,
      coverage_pct: totalBuildings > 0 ? Math.round((covered / totalBuildings) * 1000) / 10 : 0,
      by_band:        byBand,
      by_municipality: byMunicipality,
      by_use_type:    byUseType,
      precomputed:    true,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: "Query failed", message });
  } finally {
    client.release();
  }
});

// ── GET /api/fstp-building-stats/geojson ─────────────────────────────────────
// Returns centroids of covered buildings as GeoJSON for map rendering.
// Only covered buildings are included (uncovered ones stay at default style).
router.get("/geojson", async (req: Request, res: Response) => {
  const { facility_nm, scenario, bands: bandsRaw } = req.query;

  if (!facility_nm || typeof facility_nm !== "string") {
    return res.status(400).json({ error: "facility_nm query param is required" });
  }
  if (!scenario || (scenario !== "Normal" && scenario !== "Peak")) {
    return res.status(400).json({ error: "scenario must be 'Normal' or 'Peak'" });
  }

  const activeBands = parseBands(bandsRaw);

  const client = await pool.connect();
  try {
    const tableReady = await isTableReady(client);
    if (!tableReady) {
      return res.status(503).json({
        error: "Precomputed coverage table not found.",
        hint: "Run precompute_fstp_buildings script first.",
      });
    }

    // Return centroids with band property — MapLibre uses band for colour
    const result = await client.query(
      `SELECT json_build_object(
         'type', 'FeatureCollection',
         'features', COALESCE(json_agg(feat), '[]'::json)
       ) AS geojson
       FROM (
         SELECT json_build_object(
           'type',       'Feature',
           'geometry',   ST_AsGeoJSON(ST_Transform(ST_Centroid(b.geom), 4326))::json,
           'properties', json_build_object(
             'id',        b.id,
             'band',      c.band,
             'mun_name',  c.mun_name,
             'brgy_name', c.brgy_name,
             'use_type',  c.use_type
           )
         ) AS feat
         FROM fstp_building_coverage c
         JOIN "Buildings" b ON b.id = c.building_id
         WHERE c.facility_nm = $1
           AND c.scenario    = $2
           AND c.band        = ANY($3::text[])
       ) sub`,
      [facility_nm, scenario, activeBands]
    );

    res.setHeader("Content-Type", "application/json");
    return res.json(result.rows[0].geojson);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: "GeoJSON query failed", message });
  } finally {
    client.release();
  }
});

// ── GET /api/fstp-building-stats/ids ─────────────────────────────────────────
// Returns building IDs grouped by band — used by MapCanvas to filter the
// existing buildings MVT source without fetching geometry.
// Response: { by_band: { "< 10 min": [1,2,...], "10 - 20 min": [...], ... } }
router.get("/ids", async (req: Request, res: Response) => {
  const { facility_nm, scenario, bands: bandsRaw } = req.query;

  if (!facility_nm || typeof facility_nm !== "string") {
    return res.status(400).json({ error: "facility_nm query param is required" });
  }
  if (!scenario || (scenario !== "Normal" && scenario !== "Peak")) {
    return res.status(400).json({ error: "scenario must be 'Normal' or 'Peak'" });
  }

  const activeBands = parseBands(bandsRaw);

  const client = await pool.connect();
  try {
    const tableReady = await isTableReady(client);
    if (!tableReady) {
      return res.status(503).json({ error: "Precomputed coverage table not found." });
    }

    const result = await client.query(
      `SELECT band, array_agg(building_id ORDER BY building_id) AS ids
       FROM fstp_building_coverage
       WHERE facility_nm = $1
         AND scenario    = $2
         AND band        = ANY($3::text[])
       GROUP BY band`,
      [facility_nm, scenario, activeBands]
    );

    const byBand: Record<string, number[]> = {};
    for (const row of result.rows) {
      byBand[row.band] = row.ids;
    }

    return res.json({ by_band: byBand });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: "IDs query failed", message });
  } finally {
    client.release();
  }
});

// ── POST /api/fstp-building-stats/precompute ─────────────────────────────────
// Triggers precomputation (async — returns 202 immediately).
router.post("/precompute", async (_req: Request, res: Response) => {
  res.status(202).json({
    message: "Precomputation started. Check server logs for progress.",
    hint:    "Alternatively run: cd server && npx ts-node src/scripts/precompute_fstp_buildings.ts",
  });
  // Fire and forget — actual work happens asynchronously
  (async () => {
    const client = await pool.connect();
    try {
      // Ensure index on buildings
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_buildings_geom
          ON "Buildings" USING GIST (geom);
      `);
      // Materialise FSTP zones in 32651 so ST_Intersects can use the index
      await client.query(`
        DROP TABLE IF EXISTS _fstp_sa_32651_api;
        CREATE TEMP TABLE _fstp_sa_32651_api AS
          SELECT "FacilityNm", "Scenario", "Type",
                 ST_Transform(geom, 32651) AS geom
          FROM "FSTP_Service_Area";
        CREATE INDEX ON _fstp_sa_32651_api USING GIST (geom);
      `);
      await client.query(`
        DROP TABLE IF EXISTS fstp_building_coverage;
        CREATE TABLE fstp_building_coverage (
          building_id INTEGER NOT NULL,
          facility_nm VARCHAR NOT NULL,
          scenario    VARCHAR NOT NULL,
          band        VARCHAR NOT NULL,
          mun_name    VARCHAR,
          brgy_name   VARCHAR,
          use_type    VARCHAR,
          PRIMARY KEY (building_id, facility_nm, scenario)
        );
      `);
      await client.query(`
        INSERT INTO fstp_building_coverage (
          building_id, facility_nm, scenario, band,
          mun_name, brgy_name, use_type
        )
        SELECT DISTINCT ON (b.id, fsa."FacilityNm", fsa."Scenario")
          b.id, fsa."FacilityNm", fsa."Scenario", fsa."Type",
          b."MunName", b."BrgyName", b.use_type
        FROM "Buildings" b
        JOIN _fstp_sa_32651_api fsa
          ON ST_Intersects(ST_Centroid(b.geom), fsa.geom)
        ORDER BY b.id, fsa."FacilityNm", fsa."Scenario",
          CASE fsa."Type"
            WHEN '< 10 min'    THEN 1
            WHEN '10 - 20 min' THEN 2
            WHEN '20 - 30 min' THEN 3
            WHEN '> 30 min'    THEN 4
            ELSE 5
          END ASC
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_fstp_bldg_cov_facility
          ON fstp_building_coverage (facility_nm, scenario);
        CREATE INDEX IF NOT EXISTS idx_fstp_bldg_cov_band
          ON fstp_building_coverage (facility_nm, scenario, band);
      `);
      console.log("[FSTP Precompute] ✅ Completed successfully via API trigger");
    } catch (err) {
      console.error("[FSTP Precompute] ❌ Failed:", err);
    } finally {
      client.release();
    }
  })();
});

export default router;
