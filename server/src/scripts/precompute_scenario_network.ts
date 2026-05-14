/**
 * Module 1 Scenario Network Coverage — Precomputation Script
 * ===========================================================
 * Drops and recreates `scenario_network_precomputed`, populating all 256
 * slider-combination rows using in-memory spatial logic in Node.js.
 *
 * Spatial rules applied (previously missing from the pure-SQL version):
 *   ① Gap-fill:    non-qualifying cells enclosed on ≥ 3 of 4 sides → included
 *   ② Min cluster: connected components with ≤ 5 cells → removed
 *                 (tourism clusters are exempt from ② and ③)
 *   ③ Min span:    clusters not spanning ≥ 2 rows AND ≥ 2 columns → removed
 *
 * Run:
 *   cd server && npx ts-node src/scripts/precompute_scenario_network.ts
 */
import "dotenv/config";
import pool from "../db/pool";
import {
  GridCell, Building, ComboStats,
  buildAdjacency, computeRawQualifying,
  applyGapFill, applyClusterFilters, computeStats,
} from "../db/scenarioPrecompute";

async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  Module 1 — Scenario Network Coverage Precomputation (256 rows)");
  console.log("  (with gap-fill, min-cluster-size, and min-span rules)");
  console.log("═══════════════════════════════════════════════════════════════");

  const client = await pool.connect();
  try {
    // ── 1. Supporting indexes ──────────────────────────────────────────────
    console.log("\n[1/5] Creating supporting indexes...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_buildings_grid_gid
        ON "Buildings" (grid_gid);
      CREATE INDEX IF NOT EXISTS idx_grid_scenario_fields
        ON "Grid" (den_type, fld_score, gwd_score, gwi_score, tour_zone);
    `);
    console.log("      ✓ indexes ready");

    // ── 2. Load grid cells from DB ─────────────────────────────────────────
    console.log("\n[2/5] Loading grid cells...");
    const gridResult = await client.query<{
      gid: string; col: string; row: string;
      den_type: string | null; fld_score: string | null;
      gwd_score: string | null; gwi_score: string | null;
      tour_zone: string | null; cell_m2: string | null;
    }>(`
      SELECT
        gid::TEXT,
        FLOOR(ST_X(ST_Centroid(ST_Envelope(geom))) / 100)::INT::TEXT AS col,
        FLOOR(ST_Y(ST_Centroid(ST_Envelope(geom))) / 100)::INT::TEXT AS row,
        den_type, fld_score, gwd_score, gwi_score, tour_zone, cell_m2
      FROM "Grid"
    `);

    const DEN_RANK: Record<string, number> = {
      'Low Density': 1, 'Medium Density': 2, 'High Density': 3, 'Very High Density': 4,
    };

    const cells: GridCell[] = gridResult.rows.map(r => ({
      gid:       Number(r.gid),
      col:       Number(r.col),
      row:       Number(r.row),
      den_rank:  DEN_RANK[r.den_type ?? ''] ?? 0,
      fld_score: Math.min(4, Math.max(0, Number(r.fld_score ?? 0))),
      gwd_score: Math.min(4, Math.max(0, Number(r.gwd_score ?? 0))),
      gwi_score: Math.min(4, Math.max(0, Number(r.gwi_score ?? 0))),
      is_tourism: r.tour_zone === 'High Tourism Zone',
      cell_ha:   Math.round((Number(r.cell_m2 ?? 10000) / 10000) * 10000) / 10000,
    }));
    console.log(`      ✓ ${cells.length} grid cells loaded`);

    // ── 3. Load buildings ──────────────────────────────────────────────────
    console.log("\n[3/5] Loading buildings...");
    const bldgResult = await client.query<{
      grid_gid: string | null; mun: string | null;
    }>(`
      SELECT grid_gid::TEXT, COALESCE("MunName", 'Unknown') AS mun
      FROM "Buildings"
    `);
    const buildings: Building[] = bldgResult.rows.map(r => ({
      grid_gid:  r.grid_gid != null ? Number(r.grid_gid) : null,
      mun:        r.mun ?? 'Unknown',
    }));
    console.log(`      ✓ ${buildings.length} buildings loaded`);

    // ── 4. Build adjacency + helper lookups once ───────────────────────────
    console.log("\n[4/5] Building spatial adjacency map...");
    const adj        = buildAdjacency(cells);
    const gidToCell  = new Map<number, GridCell>(cells.map(c => [c.gid, c]));
    const tourismGids = new Set<number>(cells.filter(c => c.is_tourism).map(c => c.gid));
    console.log(`      ✓ adjacency map ready (${cells.length} nodes, ${tourismGids.size} tourism cells)`);

    // ── 5. Create / reset table ────────────────────────────────────────────
    await client.query(`
      DROP TABLE IF EXISTS scenario_network_precomputed;
      CREATE TABLE scenario_network_precomputed (
        density_stop     SMALLINT      NOT NULL,
        gwd_stop         SMALLINT      NOT NULL,
        gwi_stop         SMALLINT      NOT NULL,
        fld_stop         SMALLINT      NOT NULL,
        grid_count       INTEGER       NOT NULL DEFAULT 0,
        area_ha          NUMERIC(12,2) NOT NULL DEFAULT 0,
        network_bldgs    INTEGER       NOT NULL DEFAULT 0,
        onsite_bldgs     INTEGER       NOT NULL DEFAULT 0,
        nonnetwork_bldgs INTEGER       NOT NULL DEFAULT 0,
        total_bldgs      INTEGER       NOT NULL DEFAULT 0,
        by_municipality  JSONB         NOT NULL DEFAULT '[]',
        qualifying_gids  JSONB         NOT NULL DEFAULT '[]',
        buffer_bldg_ids  JSONB                  DEFAULT '[]'::jsonb,
        buffer_geom      TEXT,
        computed_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        PRIMARY KEY (density_stop, gwd_stop, gwi_stop, fld_stop)
      );
    `);

    // ── 6. Compute all 256 combinations ───────────────────────────────────
    console.log("\n[5/5] Computing 256 scenario combinations...");
    const t0 = Date.now();
    const rows: Array<[number, number, number, number, ComboStats]> = [];

    for (let ds = 1; ds <= 4; ds++) {
      for (let gs = 1; gs <= 4; gs++) {
        for (let ws = 1; ws <= 4; ws++) {
          for (let fs = 1; fs <= 4; fs++) {
            // ① Raw qualification
            const raw = computeRawQualifying(cells, ds, gs, ws, fs);
            // ② Gap-fill
            const filled = applyGapFill(raw, adj);
            // ③ Cluster size + span filters (tourism exempt)
            const finalSet = applyClusterFilters(filled, adj, gidToCell, tourismGids);
            // ④ Building count + area
            const stats = computeStats(finalSet, buildings, gidToCell);
            rows.push([ds, gs, ws, fs, stats]);
          }
        }
        process.stdout.write(`\r      d=${ds} g=${gs}: ${(ds-1)*16+(gs-1)*4} / 64 combos...`);
      }
    }
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`\r      ✓ all 256 combinations computed in ${elapsed}s`);

    // ── 7. Bulk insert + buffer zone computation ─────────────────────────────
    console.log("      Inserting rows and computing buffer zones...");
    for (const [ds, gs, ws, fs, s] of rows) {
      // ── Buffer zone computation ────────────────────────────────────────
      let bufferBldgIds: number[] = [];
      let bufGeomWkt: string | null = null;

      if (s.qualifying_gids.length > 0) {
        // Step 1: union qualifying cells and buffer by 120m
        const bufGeomResult = await client.query<{ buf_geom: string; buf_geom_wkt: string }>(`
          SELECT
            ST_Buffer(ST_Union(g.geom), 120)                             AS buf_geom,
            ST_AsText(
              ST_Transform(
                ST_Buffer(ST_Union(g.geom), 120),
                4326
              )
            )                                                             AS buf_geom_wkt
          FROM "Grid" g
          WHERE g.gid = ANY($1::int[])
        `, [s.qualifying_gids]);

        const bufGeom    = bufGeomResult.rows[0]?.buf_geom    ?? null;
        bufGeomWkt       = bufGeomResult.rows[0]?.buf_geom_wkt ?? null;

        // Step 2: buildings in buffer zone but NOT in qualifying grid cells.
        // Bulk wastewater generators (commercial, institutional, industrial, or
        // multi-storey buildings) are matched by full footprint intersection so
        // large buildings straddling the buffer boundary are captured correctly.
        if (bufGeom) {
          const bufBldgResult = await client.query<{ id: number }>(`
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
          `, [bufGeom, s.qualifying_gids]);
          bufferBldgIds = bufBldgResult.rows.map(r => r.id);
        }
      }

      // Step 3: network_bldgs includes buffer buildings
      const totalNetworkBldgs = s.network_bldgs + bufferBldgIds.length;

      await client.query(
        `INSERT INTO scenario_network_precomputed
           (density_stop, gwd_stop, gwi_stop, fld_stop,
            grid_count, area_ha,
            network_bldgs, onsite_bldgs, nonnetwork_bldgs, total_bldgs,
            by_municipality, qualifying_gids,
            buffer_bldg_ids, buffer_geom)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [ds, gs, ws, fs,
         s.grid_count, s.area_ha,
         totalNetworkBldgs, s.onsite_bldgs, s.nonnetwork_bldgs, s.total_bldgs,
         JSON.stringify(s.by_municipality),
         JSON.stringify(s.qualifying_gids),
         JSON.stringify(bufferBldgIds),
         bufGeomWkt]
      );
    }
    const { rows: countRows } = await client.query(
      `SELECT COUNT(*) AS n FROM scenario_network_precomputed`
    );
    console.log(`      ✓ ${countRows[0].n} rows inserted`);

    // ── Sanity check: default scenario (d=3, g=3, w=3, f=3) ───────────────
    const check = await client.query(`
      SELECT grid_count, area_ha,
             network_bldgs, onsite_bldgs, nonnetwork_bldgs, total_bldgs
      FROM   scenario_network_precomputed
      WHERE  density_stop = 3 AND gwd_stop = 3 AND gwi_stop = 3 AND fld_stop = 3
    `);
    if (check.rows.length) {
      const r = check.rows[0];
      console.log("\n  Default scenario (d=3, g=3, w=3, f=3):");
      console.log(`    Grid cells  : ${r.grid_count}  (~${r.area_ha} ha)`);
      console.log(`    Network     : ${r.network_bldgs}`);
      console.log(`    On-site     : ${r.onsite_bldgs}`);
      console.log(`    Non-Network : ${r.nonnetwork_bldgs}`);
      console.log(`    Total bldgs : ${r.total_bldgs}`);
    }

    if (countRows[0].n !== "256") {
      console.warn(`\n  ⚠ WARNING: expected 256 rows, got ${countRows[0].n}`);
    } else {
      console.log("\n  ✅ Precomputation complete — all 256 rows ready.");
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error("\n❌ Fatal error:", err.message ?? err);
  process.exit(1);
});
