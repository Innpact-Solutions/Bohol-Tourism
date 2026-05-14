/**
 * GET /api/scenario-grid
 *
 * Returns a GeoJSON FeatureCollection of grid cell geometries that qualify
 * for the given slider combination — AFTER applying the three spatial rules
 * (gap-fill, min-cluster-size > 5, min-span ≥ 2 rows × 2 cols).
 *
 * The qualifying GID list is looked up from the precomputed table, then
 * the actual geometries are fetched from PostGIS.
 *
 * Query params (all required, integers 1–4):
 *   d  — density_stop
 *   g  — gwd_stop
 *   w  — gwi_stop
 *   f  — fld_stop
 *
 * Response 200: GeoJSON FeatureCollection
 * Response 400: invalid params
 * Response 503: precomputed table not found
 * Response 404: combo row missing
 */
import { Router, Request, Response } from "express";
import pool from "../db/pool";

const router = Router();

function parseStop(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 4) return null;
  return n;
}

router.get("/", async (req: Request, res: Response) => {
  const d = parseStop(req.query.d);
  const g = parseStop(req.query.g);
  const w = parseStop(req.query.w);
  const f = parseStop(req.query.f);

  // Optional admin-boundary filter params
  const munName  = (req.query.munName  as string) || null;
  const brgyName = (req.query.brgyName as string) || null;

  if (d === null || g === null || w === null || f === null) {
    return res.status(400).json({
      error: "Invalid parameters. d, g, w, f must each be an integer from 1 to 4.",
    });
  }

  try {
    // 1. Check table exists
    const tableCheck = await pool.query<{ exists: boolean }>(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'scenario_network_precomputed'
      ) AS exists
    `);
    if (!tableCheck.rows[0].exists) {
      return res.status(503).json({
        error: "Precomputed table not found.",
        hint: "Run: cd server && npx ts-node src/scripts/precompute_scenario_network.ts",
      });
    }

    // 2. Check qualifying_gids column exists (old table may not have it)
    const colCheck = await pool.query<{ exists: boolean }>(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'scenario_network_precomputed'
          AND column_name = 'qualifying_gids'
      ) AS exists
    `);
    if (!colCheck.rows[0].exists) {
      return res.status(503).json({
        error: "qualifying_gids column missing.",
        hint: "Re-run the precomputation script to rebuild the table.",
      });
    }

    // 3. Fetch qualifying GIDs + buffer data from precomputed table
    // Check whether buffer columns exist (added by updated precompute script)
    const bufColCheck = await pool.query<{ exists: boolean }>(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'scenario_network_precomputed'
          AND column_name = 'buffer_bldg_ids'
      ) AS exists
    `);
    const hasBufferCols = bufColCheck.rows[0].exists;

    const selectCols = hasBufferCols
      ? `qualifying_gids::text, buffer_bldg_ids::text,
         ST_AsGeoJSON(ST_GeomFromText(buffer_geom, 4326)) AS buffer_geom_json,
         ST_Area(buffer_geom) / 10000 AS buffer_area_ha,
         COALESCE(excluded_bldg_ids::text, '[]') AS excluded_bldg_ids`
      : `qualifying_gids::text, NULL::text AS buffer_bldg_ids, NULL::text AS buffer_geom_json,
         NULL::float AS buffer_area_ha,
         COALESCE(excluded_bldg_ids::text, '[]') AS excluded_bldg_ids`;

    const precomputed = await pool.query<{ qualifying_gids: string; buffer_bldg_ids: string | null; buffer_geom_json: string | null; buffer_area_ha: number | null; excluded_bldg_ids: string }>(
      `SELECT ${selectCols}
       FROM scenario_network_precomputed
       WHERE density_stop = $1 AND gwd_stop = $2 AND gwi_stop = $3 AND fld_stop = $4`,
      [d, g, w, f]
    );
    if (precomputed.rows.length === 0) {
      return res.status(404).json({ error: "Row not found for the given combination." });
    }

    const allGids: number[] = JSON.parse(precomputed.rows[0].qualifying_gids ?? '[]');
    let bufferBldgIds: number[] = JSON.parse(precomputed.rows[0].buffer_bldg_ids ?? '[]');
    let bufferGeomJson: any = precomputed.rows[0].buffer_geom_json ? JSON.parse(precomputed.rows[0].buffer_geom_json) : null;
    let bufferAreaHa: number | null = precomputed.rows[0].buffer_area_ha ?? null;
    const excludedBldgIds: number[] = JSON.parse(precomputed.rows[0].excluded_bldg_ids ?? '[]');

    // ── Admin boundary filtering (LGU / Barangay) ─────────────────────────
    // When munName or brgyName is provided, restrict qualifying GIDs to those
    // that spatially fall within the selected admin boundary; then recompute
    // the buffer polygon clipped to that boundary.
    let gids = allGids;
    if (allGids.length > 0 && (munName || brgyName)) {
      try {
        const filterParams: (number[] | string)[] = [allGids];
        let boundaryFilter: string;
        if (brgyName) {
          filterParams.push(brgyName);
          boundaryFilter = `AND bb."BrgyName" = $2`;
        } else {
          // munName only
          filterParams.push(munName!);
          boundaryFilter = `AND bb."MunName" = $2`;
        }

        const filterResult = await pool.query<{ gid: number }>(
          `SELECT DISTINCT g.gid
           FROM "Grid" g
           JOIN "Barangay_Boundary" bb
             ON ST_Within(ST_Centroid(g.geom), bb.geom)
           WHERE g.gid = ANY($1::int[])
             ${boundaryFilter}`,
          filterParams
        );
        gids = filterResult.rows.map((r) => Number(r.gid));
        console.log(`[scenario-grid] Admin filter (${brgyName ? `brgy=${brgyName}` : `mun=${munName}`}): ${allGids.length} → ${gids.length} GIDs`);

        // Recompute buffer polygon clipped to the selected admin boundary
        bufferBldgIds = [];
        bufferAreaHa  = null;
        if (gids.length > 0) {
          const adminBufParams: (number[] | string)[] = [gids];
          let adminGeomClause: string;
          if (brgyName) {
            adminBufParams.push(brgyName);
            adminGeomClause = `(SELECT ST_Union(geom) FROM "Barangay_Boundary" WHERE "BrgyName" = $2)`;
          } else {
            adminBufParams.push(munName!);
            adminGeomClause = `(SELECT ST_Union(geom) FROM "Barangay_Boundary" WHERE "MunName" = $2)`;
          }

          // Fetch both native-CRS geometry (for building lookup) and GeoJSON (for map display)
          const newBufResult = await pool.query<{ buf_geom: string; buf_geom_json: string | null; buf_area_ha: number | null }>(
            `SELECT
               ST_Intersection(
                 ST_Buffer(ST_Union(g.geom), 120),
                 ${adminGeomClause}
               ) AS buf_geom,
               ST_AsGeoJSON(
                 ST_Transform(
                   ST_Intersection(
                     ST_Buffer(ST_Union(g.geom), 120),
                     ${adminGeomClause}
                   ),
                   4326
                 )
               ) AS buf_geom_json,
               ST_Area(
                 ST_Intersection(
                   ST_Buffer(ST_Union(g.geom), 120),
                   ${adminGeomClause}
                 )
               ) / 10000 AS buf_area_ha
             FROM "Grid" g
             WHERE g.gid = ANY($1::int[])`,
            adminBufParams
          );
          const bufGeom = newBufResult.rows[0]?.buf_geom ?? null;
          bufferGeomJson = newBufResult.rows[0]?.buf_geom_json ? JSON.parse(newBufResult.rows[0].buf_geom_json) : null;
          bufferAreaHa  = newBufResult.rows[0]?.buf_area_ha  ?? null;

          // Find buildings in the buffer zone that are NOT in qualifying grid cells.
          // For bulk wastewater generators (commercial, institutional, industrial,
          // or multi-storey), use the full building footprint (ST_Intersects) so
          // that large buildings straddling the buffer boundary are included even
          // when their centroid lies outside the buffer.
          if (bufGeom) {
            const bufBldgResult = await pool.query<{ id: number }>(
              `SELECT b.id
               FROM "Buildings" b
               WHERE (
                 ST_Within(ST_Centroid(b.geom), $1::geometry)
                 OR (
                   ST_Intersects(b.geom, $1::geometry)
                   AND (
                     b.use_type IN (
                       'Commercial Establishments',
                       'Educational Institutions',
                       'Health Facilities',
                       'Industrial',
                       'Government & Civic Services'
                     )
                     OR b.floors >= 3
                   )
                 )
               )
               AND b.grid_gid != ALL($2::int[])`,
              [bufGeom, gids]
            );
            bufferBldgIds = bufBldgResult.rows.map((r: { id: number }) => r.id);
          }
        } else {
          bufferGeomJson = null;
          bufferAreaHa  = null;
        }
      } catch (adminErr) {
        // Spatial filter failed — fall back to unfiltered results
        console.warn('[scenario-grid] Admin boundary filter failed, returning unfiltered:', adminErr instanceof Error ? adminErr.message : adminErr);
        gids = allGids;
      }
    }

    // If precomputed buffer columns are empty (script not yet re-run), compute on-the-fly
    if (gids.length > 0 && bufferGeomJson === null && !munName && !brgyName) {
      try {
        const bufGeomResult = await pool.query<{ buf_geom: string; buf_geom_json: string; buf_area_ha: number }>(`
          SELECT
            ST_Intersection(
              ST_Buffer(ST_Union(g.geom), 120),
              (SELECT ST_Union(mb.geom) FROM "Municipal_Boundary" mb)
            )                                                              AS buf_geom,
            ST_AsGeoJSON(
              ST_Transform(
                ST_Intersection(
                  ST_Buffer(ST_Union(g.geom), 120),
                  (SELECT ST_Union(mb.geom) FROM "Municipal_Boundary" mb)
                ),
                4326
              )
            )                                                              AS buf_geom_json,
            ST_Area(
              ST_Intersection(
                ST_Buffer(ST_Union(g.geom), 120),
                (SELECT ST_Union(mb.geom) FROM "Municipal_Boundary" mb)
              )
            ) / 10000                                                     AS buf_area_ha
          FROM "Grid" g
          WHERE g.gid = ANY($1::int[])
        `, [gids]);

        const bufGeom = bufGeomResult.rows[0]?.buf_geom ?? null;
        bufferGeomJson = bufGeomResult.rows[0]?.buf_geom_json ? JSON.parse(bufGeomResult.rows[0].buf_geom_json) : null;
        bufferAreaHa  = bufGeomResult.rows[0]?.buf_area_ha  ?? null;

        if (bufGeom) {
          const bufBldgResult = await pool.query<{ id: number }>(`
            SELECT b.id
            FROM "Buildings" b
            WHERE (
              ST_Within(ST_Centroid(b.geom), $1::geometry)
              OR (
                ST_Intersects(b.geom, $1::geometry)
                AND (
                  b.use_type IN (
                    'Commercial Establishments',
                    'Educational Institutions',
                    'Health Facilities',
                    'Industrial',
                    'Government & Civic Services'
                  )
                  OR b.floors >= 3
                )
              )
            )
            AND b.grid_gid != ALL($2::int[])
          `, [bufGeom, gids]);
          bufferBldgIds = bufBldgResult.rows.map((r: { id: number }) => r.id);
        }
      } catch (bufErr) {
        // Buffer computation failed (e.g. geometry column missing) — serve grid without buffer
        console.warn('[scenario-grid] On-the-fly buffer computation failed:', bufErr instanceof Error ? bufErr.message : bufErr);
        bufferBldgIds = [];
        bufferGeomJson = null;
      }
    }

    if (!gids || gids.length === 0) {
      return res.json({ type: "FeatureCollection", features: [], bufferBldgIds, bufferGeomJson, bufferAreaHa });
    }

    // 4. Fetch geometries from PostGIS as GeoJSON — include cluster_id per cell
    //    ST_ClusterDBSCAN(eps:=250, minpoints:=1) groups qualifying grid cells whose
    //    nearest edges are within 250m — just above 2× the 120m service buffer radius.
    //    This ensures clusters whose 120m buffers would visually merge (gap ≤ 240m)
    //    are treated as one zone, matching the single merged polygon on the map.
    const geomResult = await pool.query<{ geojson: any }>(
      `WITH gid_clusters AS (
         SELECT gid,
                ST_ClusterDBSCAN(geom, eps := 250, minpoints := 1) OVER () AS cluster_id
         FROM "Grid"
         WHERE gid = ANY($1::bigint[])
       )
       SELECT json_build_object(
         'type', 'FeatureCollection',
         'features', COALESCE(json_agg(
           json_build_object(
             'type',       'Feature',
             'id',         'Grid.' || gc.gid,
             'geometry',   ST_AsGeoJSON(ST_Transform(g.geom, 4326), 6)::json,
             'properties', json_build_object('gid', gc.gid, 'cluster_id', gc.cluster_id)
           )
         ), '[]'::json)
       ) AS geojson
       FROM gid_clusters gc
       JOIN "Grid" g ON g.gid = gc.gid`,
      [gids]
    );

    // ── Zone breakdown: use-type + hazard for all 3 coverage zones ──────────
    // Runs 6 queries in parallel (3 zones × 2 metrics).
    // Used by the Coverage Distribution donuts in ModuleAnalyticsPanel.
    let zoneBreakdown: any = null;
    try {
      const USE_TYPE_CASE = `
        CASE b.use_type
          WHEN 'Residential'                THEN 'Residential'
          WHEN 'Commercial Establishments'  THEN 'Commercial'
          WHEN 'Industrial'                 THEN 'Industrial'
          WHEN 'Religious Places'           THEN 'Institutional'
          WHEN 'Government & Civic Services' THEN 'Institutional'
          WHEN 'Educational Institutions'   THEN 'Institutional'
          WHEN 'Health Facilities'          THEN 'Institutional'
          ELSE 'Other'
        END`;

      const HAZ_CASE = `
        CASE
          WHEN g.fld_haz IN ('High','Moderate')                              THEN 'Flood Hazard'
          WHEN g.gw_depth IN ('Shallow (2-5 m)','Very Shallow (< 2 m)')     THEN 'Shallow GWT'
          WHEN g.gw_infil LIKE 'High%' OR g.gw_infil LIKE 'Very High%'      THEN 'High Infiltration'
          ELSE 'Limited Risk'
        END`;

      // Network zone: buildings in qualifying grid cells (excluding manually excluded buildings)
      const USE_NET = `SELECT ${USE_TYPE_CASE} AS name, COUNT(*)::int AS cnt
        FROM "Buildings" b WHERE b.grid_gid = ANY($1::bigint[]) AND NOT (b.id = ANY($2::int[])) GROUP BY 1 ORDER BY cnt DESC`;
      const HAZ_NET = `SELECT ${HAZ_CASE} AS name, COUNT(*)::int AS cnt
        FROM "Buildings" b JOIN "Grid" g ON b.grid_gid = g.gid
        WHERE g.gid = ANY($1::bigint[]) AND NOT (b.id = ANY($2::int[])) GROUP BY 1`;

      // Buffer zone: buildings in 120 m sewer buffer
      const USE_BUF = `SELECT ${USE_TYPE_CASE} AS name, COUNT(*)::int AS cnt
        FROM "Buildings" b WHERE b.id = ANY($1::int[]) GROUP BY 1 ORDER BY cnt DESC`;
      const HAZ_BUF = `SELECT ${HAZ_CASE} AS name, COUNT(*)::int AS cnt
        FROM "Buildings" b JOIN "Grid" g ON b.grid_gid = g.gid
        WHERE b.id = ANY($1::int[]) GROUP BY 1`;

      // Non-network zone: buildings with a grid_gid not in network or buffer
      // Also includes manually excluded buildings (they are in qualifying grid cells but excluded from network)
      const USE_NON = `SELECT ${USE_TYPE_CASE} AS name, COUNT(*)::int AS cnt
        FROM "Buildings" b
        WHERE b.grid_gid IS NOT NULL
          AND (
            (NOT (b.grid_gid = ANY($1::bigint[])) AND NOT (b.id = ANY($2::int[])))
            OR (b.id = ANY($3::int[]))
          )
        GROUP BY 1 ORDER BY cnt DESC`;
      const HAZ_NON = `SELECT ${HAZ_CASE} AS name, COUNT(*)::int AS cnt
        FROM "Buildings" b JOIN "Grid" g ON b.grid_gid = g.gid
        WHERE b.grid_gid IS NOT NULL
          AND (
            (NOT (b.grid_gid = ANY($1::bigint[])) AND NOT (b.id = ANY($2::int[])))
            OR (b.id = ANY($3::int[]))
          )
        GROUP BY 1`;

      const toPct = (rows: { name: string; cnt: number }[]) => {
        const total = rows.reduce((s, r) => s + (r.cnt ?? 0), 0);
        if (!total) return [];
        return rows.map(r => ({ name: r.name, value: Math.round((r.cnt / total) * 100) }));
      };

      const [nuR, nhR, buR, bhR, nnuR, nnhR] = await Promise.all([
        pool.query<{ name: string; cnt: number }>(USE_NET, [gids, excludedBldgIds]),
        pool.query<{ name: string; cnt: number }>(HAZ_NET, [gids, excludedBldgIds]),
        pool.query<{ name: string; cnt: number }>(USE_BUF, [bufferBldgIds]),
        pool.query<{ name: string; cnt: number }>(HAZ_BUF, [bufferBldgIds]),
        pool.query<{ name: string; cnt: number }>(USE_NON, [gids, bufferBldgIds, excludedBldgIds]),
        pool.query<{ name: string; cnt: number }>(HAZ_NON, [gids, bufferBldgIds, excludedBldgIds]),
      ]);

      zoneBreakdown = {
        network:    { useType: toPct(nuR.rows),  hazard: toPct(nhR.rows) },
        buffer:     { useType: toPct(buR.rows),  hazard: toPct(bhR.rows) },
        nonNetwork: { useType: toPct(nnuR.rows), hazard: toPct(nnhR.rows) },
      };
      console.log('[scenario-grid] Zone breakdown computed successfully');
    } catch (bdErr) {
      console.warn('[scenario-grid] Zone breakdown failed (non-fatal):', bdErr instanceof Error ? bdErr.message : bdErr);
    }

    const geojson: any = geomResult.rows[0]?.geojson ?? { type: "FeatureCollection", features: [] };

    // ── Per-cluster zone summaries ───────────────────────────────────────────
    // Each connected group of qualifying grid cells is one sewer zone.
    // We compute: dominant LGU name, total network buildings, grid cell count,
    // area (ha), and optionally barangay names.
    let zones: Array<{
      cluster_id: number;
      mun: string;
      network_bldgs: number;
      grid_cells: number;
      area_ha: number;
      tourism_cells: number;
      centroid_lng: number;
      centroid_lat: number;
      bbox_minlng: number;
      bbox_minlat: number;
      bbox_maxlng: number;
      bbox_maxlat: number;
      brgy_names: string[];
      buffer_geom_geojson?: any;
      buffer_area_ha?: number | null;
      buffer_bldgs?: number;
    }> = [];
    try {
      const zoneStatsResult = await pool.query<{
        cluster_id: number;
        mun: string;
        network_bldgs: number;
        grid_cells: number;
        area_ha: number;
        tourism_cells: number;
        centroid_lng: number;
        centroid_lat: number;
        bbox_minlng: number;
        bbox_minlat: number;
        bbox_maxlng: number;
        bbox_maxlat: number;
      }>(
        `WITH gid_clusters AS (
           SELECT gid,
                  ST_ClusterDBSCAN(geom, eps := 250, minpoints := 1) OVER () AS cluster_id
           FROM "Grid"
           WHERE gid = ANY($1::bigint[])
         ),
         cluster_bldg AS (
           SELECT gc.cluster_id,
                  COALESCE(b."MunName", 'Unknown') AS mun,
                  COUNT(b.id)::int AS bldg_count
           FROM gid_clusters gc
           LEFT JOIN "Buildings" b ON b.grid_gid = gc.gid AND NOT (b.id = ANY($2::int[]))
           GROUP BY gc.cluster_id, b."MunName"
         ),
         cluster_mun_total AS (
           SELECT cluster_id, SUM(bldg_count)::int AS total_bldgs
           FROM cluster_bldg GROUP BY cluster_id
         ),
         cluster_dominant_mun AS (
           SELECT DISTINCT ON (cluster_id) cluster_id, mun
           FROM cluster_bldg
           ORDER BY cluster_id, bldg_count DESC
         ),
         cluster_geom AS (
           SELECT gc.cluster_id,
                  COUNT(DISTINCT gc.gid)::int AS grid_cells,
                  ROUND((SUM(ST_Area(g.geom)) / 10000)::numeric, 2)::float AS area_ha,
                  COUNT(CASE WHEN g.tour_zone = 'High Tourism Zone' THEN 1 END)::int AS tourism_cells,
                  ST_X(ST_Transform(ST_Centroid(ST_Collect(g.geom)), 4326))::float AS centroid_lng,
                  ST_Y(ST_Transform(ST_Centroid(ST_Collect(g.geom)), 4326))::float AS centroid_lat,
                  ST_XMin(ST_Transform(ST_Envelope(ST_Collect(g.geom)), 4326))::float AS bbox_minlng,
                  ST_YMin(ST_Transform(ST_Envelope(ST_Collect(g.geom)), 4326))::float AS bbox_minlat,
                  ST_XMax(ST_Transform(ST_Envelope(ST_Collect(g.geom)), 4326))::float AS bbox_maxlng,
                  ST_YMax(ST_Transform(ST_Envelope(ST_Collect(g.geom)), 4326))::float AS bbox_maxlat
           FROM gid_clusters gc
           JOIN "Grid" g ON g.gid = gc.gid
           GROUP BY gc.cluster_id
         )
         SELECT cg.cluster_id,
                COALESCE(cdm.mun, 'Unknown') AS mun,
                COALESCE(cmt.total_bldgs, 0) AS network_bldgs,
                cg.grid_cells,
                cg.area_ha,
                cg.tourism_cells,
                cg.centroid_lng,
                cg.centroid_lat,
                cg.bbox_minlng,
                cg.bbox_minlat,
                cg.bbox_maxlng,
                cg.bbox_maxlat
         FROM cluster_geom cg
         LEFT JOIN cluster_dominant_mun cdm ON cdm.cluster_id = cg.cluster_id
         LEFT JOIN cluster_mun_total cmt ON cmt.cluster_id = cg.cluster_id
         ORDER BY cmt.total_bldgs DESC NULLS LAST`,
        [gids, excludedBldgIds]
      );

      // Build zone objects, then try to enrich with barangay names
      const baseZones = zoneStatsResult.rows.map(r => ({
        cluster_id: r.cluster_id,
        mun: r.mun,
        network_bldgs: r.network_bldgs,
        grid_cells: r.grid_cells,
        area_ha: r.area_ha,
        tourism_cells: r.tourism_cells,
        centroid_lng: r.centroid_lng,
        centroid_lat: r.centroid_lat,
        bbox_minlng: r.bbox_minlng,
        bbox_minlat: r.bbox_minlat,
        bbox_maxlng: r.bbox_maxlng,
        bbox_maxlat: r.bbox_maxlat,
        brgy_names: [] as string[],
        use_type_pct: [] as Array<{ name: string; pct: number }>,
      }));

      // Optional barangay enrichment (non-fatal)
      try {
        const brgyResult = await pool.query<{ cluster_id: number; brgy_names: string[] }>(
          `WITH gid_clusters AS (
             SELECT gid,
                    ST_ClusterDBSCAN(geom, eps := 250, minpoints := 1) OVER () AS cluster_id
             FROM "Grid"
             WHERE gid = ANY($1::bigint[])
           )
           SELECT gc.cluster_id,
                  array_agg(DISTINCT bb."BrgyName" ORDER BY bb."BrgyName")
                    FILTER (WHERE bb."BrgyName" IS NOT NULL) AS brgy_names
           FROM gid_clusters gc
           JOIN "Grid" g ON g.gid = gc.gid
           LEFT JOIN "Barangay_Boundary" bb ON ST_Within(ST_Centroid(g.geom), bb.geom)
           GROUP BY gc.cluster_id`,
          [gids]
        );
        const brgyMap = new Map(brgyResult.rows.map(r => [r.cluster_id, r.brgy_names ?? []]));
        for (const z of baseZones) {
          z.brgy_names = brgyMap.get(z.cluster_id) ?? [];
        }
      } catch (brgyErr) {
        console.warn('[scenario-grid] Barangay enrichment failed (non-fatal):', brgyErr instanceof Error ? brgyErr.message : brgyErr);
      }

      // Optional per-cluster land use enrichment (non-fatal)
      try {
        const useTypeResult = await pool.query<{ cluster_id: number; use_cat: string; cnt: number }>(
          `WITH gid_clusters AS (
             SELECT gid,
                    ST_ClusterDBSCAN(geom, eps := 250, minpoints := 1) OVER () AS cluster_id
             FROM "Grid"
             WHERE gid = ANY($1::bigint[])
           )
           SELECT gc.cluster_id,
                  CASE b.use_type
                    WHEN 'Residential'                       THEN 'Residential'
                    WHEN 'Commercial Establishments'         THEN 'Commercial'
                    WHEN 'Industrial'                        THEN 'Industrial'
                    WHEN 'Religious Places'                  THEN 'Institutional'
                    WHEN 'Government & Civic Services'       THEN 'Institutional'
                    WHEN 'Educational Institutions'          THEN 'Institutional'
                    WHEN 'Health Facilities'                 THEN 'Institutional'
                    WHEN 'Hotel / Lodging'                   THEN 'Tourism'
                    WHEN 'Resort / Tourism Accommodation'    THEN 'Tourism'
                    WHEN 'Tourism Apartment / Villa Compound' THEN 'Tourism'
                    ELSE 'Other'
                  END AS use_cat,
                  COUNT(b.id)::int AS cnt
           FROM gid_clusters gc
           JOIN "Buildings" b ON b.grid_gid = gc.gid AND NOT (b.id = ANY($2::int[]))
           GROUP BY gc.cluster_id, use_cat
           ORDER BY gc.cluster_id, cnt DESC`,
          [gids, excludedBldgIds]
        );
        // Group rows by cluster_id and compute percentages
        const useMap = new Map<number, Array<{ name: string; cnt: number }>>();
        for (const row of useTypeResult.rows) {
          if (!useMap.has(row.cluster_id)) useMap.set(row.cluster_id, []);
          useMap.get(row.cluster_id)!.push({ name: row.use_cat, cnt: row.cnt });
        }
        for (const z of baseZones) {
          const rows = useMap.get(z.cluster_id) ?? [];
          const total = rows.reduce((s, r) => s + r.cnt, 0);
          z.use_type_pct = total > 0
            ? rows.map(r => ({ name: r.name, pct: Math.round((r.cnt / total) * 100) }))
            : [];
        }
      } catch (useErr) {
        console.warn('[scenario-grid] Use type enrichment failed (non-fatal):', useErr instanceof Error ? useErr.message : useErr);
      }

      // Optional per-cluster buffer enrichment — adds buffer polygon GeoJSON, area, and connectable building count.
      // The buffer is clipped to the same admin boundary used for the overall scenario buffer so it
      // matches exactly what is rendered on the map canvas (scenario-buffer layer).
      try {
        // Build the clip-boundary expression to match the main buffer computation:
        //   - brgyName filter → clip to that barangay
        //   - munName filter  → clip to that municipality
        //   - no filter       → clip to full Municipal_Boundary (trims to shoreline)
        let clipBoundaryExpr: string;
        const clusterBufParams: (number[] | string)[] = [gids];
        if (brgyName) {
          clusterBufParams.push(brgyName);
          clipBoundaryExpr = `(SELECT ST_Union(geom) FROM "Barangay_Boundary" WHERE "BrgyName" = $2)`;
        } else if (munName) {
          clusterBufParams.push(munName);
          clipBoundaryExpr = `(SELECT ST_Union(geom) FROM "Barangay_Boundary" WHERE "MunName" = $2)`;
        } else {
          clipBoundaryExpr = `(SELECT ST_Union(geom) FROM "Municipal_Boundary")`;
        }

        const clusterBufResult = await pool.query<{
          cluster_id: number;
          buffer_geom_geojson: any;
          buffer_area_ha: number;
          buffer_bldgs: number;
        }>(
          `WITH gid_clusters AS (
             SELECT gid,
                    ST_ClusterDBSCAN(geom, eps := 250, minpoints := 1) OVER () AS cluster_id
             FROM "Grid"
             WHERE gid = ANY($1::bigint[])
           ),
           clip_boundary AS (
             SELECT ${clipBoundaryExpr} AS geom
           ),
           cluster_data AS (
             SELECT gc.cluster_id,
                    ST_Intersection(
                      ST_Buffer(ST_Union(g.geom), 120),
                      (SELECT geom FROM clip_boundary)
                    ) AS buf_geom,
                    array_agg(gc.gid) AS cluster_gids
             FROM gid_clusters gc
             JOIN "Grid" g ON g.gid = gc.gid
             GROUP BY gc.cluster_id
           )
           SELECT
             cd.cluster_id,
             ST_AsGeoJSON(ST_Transform(cd.buf_geom, 4326))::json AS buffer_geom_geojson,
             ROUND((ST_Area(cd.buf_geom) / 10000)::numeric, 2)::float AS buffer_area_ha,
             COUNT(DISTINCT b.id)::int AS buffer_bldgs
           FROM cluster_data cd
           LEFT JOIN "Buildings" b ON (
             (
               ST_Within(ST_Centroid(b.geom), cd.buf_geom)
               OR (
                 ST_Intersects(b.geom, cd.buf_geom)
                 AND (
                   b.use_type IN ('Commercial Establishments','Educational Institutions','Health Facilities','Industrial','Government & Civic Services')
                   OR b.floors >= 3
                 )
               )
             )
             AND (b.grid_gid IS NULL OR NOT (b.grid_gid = ANY(cd.cluster_gids)))
           )
           GROUP BY cd.cluster_id, cd.buf_geom`,
          clusterBufParams
        );
        const bufMap = new Map(clusterBufResult.rows.map(r => [r.cluster_id, {
          buffer_geom_geojson: r.buffer_geom_geojson,
          buffer_area_ha: r.buffer_area_ha,
          buffer_bldgs: r.buffer_bldgs,
        }]));
        for (const z of baseZones) {
          const bd = bufMap.get(z.cluster_id);
          if (bd) {
            (z as any).buffer_geom_geojson = bd.buffer_geom_geojson;
            (z as any).buffer_area_ha = bd.buffer_area_ha;
            (z as any).buffer_bldgs = bd.buffer_bldgs;
          }
        }
      } catch (bufErr) {
        console.warn('[scenario-grid] Per-cluster buffer enrichment failed (non-fatal):', bufErr instanceof Error ? bufErr.message : bufErr);
      }

      zones = baseZones;
      console.log(`[scenario-grid] ${zones.length} sewer zone cluster(s) identified`);
    } catch (zoneErr) {
      console.warn('[scenario-grid] Zone cluster computation failed (non-fatal):', zoneErr instanceof Error ? zoneErr.message : zoneErr);
    }

    res.json(Object.assign({}, geojson, { bufferBldgIds, bufferGeomJson, bufferAreaHa, zoneBreakdown, zones, excludedBldgIds: excludedBldgIds }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: "Query failed", message });
  }
});

export default router;
