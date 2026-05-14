/**
 * FSTP Building Coverage Precomputation
 * ======================================
 * Creates and populates `fstp_building_coverage` — a table that records,
 * for every building, which FSTP service-area zone (band) it falls within
 * for each (FacilityNm, Scenario) combination.
 *
 * Priority rule: if a building falls within multiple band polygons for the same
 * (FacilityNm, Scenario), it is assigned the highest-priority (nearest) band:
 *   '< 10 min' > '10 - 20 min' > '20 - 30 min' > '> 30 min'
 *
 * Buildings outside all service-area polygons are NOT stored (they are
 * implicitly "uncovered" — total_buildings minus covered_buildings).
 *
 * Run:
 *   cd server && npx ts-node src/scripts/precompute_fstp_buildings.ts
 */
import "dotenv/config";
import pool from "../db/pool";

async function main() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  FSTP Building Coverage Precomputation");
  console.log("═══════════════════════════════════════════════════════");

  const client = await pool.connect();
  try {
    // 1. Ensure GIST index on Buildings (native SRID 32651)
    console.log("\n[1/5] Ensuring spatial indexes on Buildings...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_buildings_geom
        ON "Buildings" USING GIST (geom);
    `);
    console.log("      ✓ Buildings index ready");

    // 2. Count check
    const bldgCount = await client.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM "Buildings"`
    );
    const fsaCount = await client.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM "FSTP_Service_Area"`
    );
    console.log(
      `\n[2/5] Source data: ${bldgCount.rows[0].count} buildings, ${fsaCount.rows[0].count} service-area polygons`
    );

    // 3. Materialise FSTP zones in 32651 so the spatial join stays in one SRID
    //    (per-row ST_Transform inside ST_Intersects prevents index use and is very slow)
    console.log("\n[3/5] Materialising FSTP zones in SRID 32651...");
    await client.query(`
      DROP TABLE IF EXISTS _fstp_sa_32651;
      CREATE TEMP TABLE _fstp_sa_32651 AS
        SELECT
          "FacilityNm",
          "Scenario",
          "Type",
          ST_Transform(geom, 32651) AS geom
        FROM "FSTP_Service_Area";
      CREATE INDEX ON _fstp_sa_32651 USING GIST (geom);
    `);
    console.log("      ✓ temp table + index created");

    // 4. Create / replace result table
    console.log("\n[4/5] Creating fstp_building_coverage table...");
    await client.query(`
      DROP TABLE IF EXISTS fstp_building_coverage;
      CREATE TABLE fstp_building_coverage (
        building_id   INTEGER   NOT NULL,
        facility_nm   VARCHAR   NOT NULL,
        scenario      VARCHAR   NOT NULL,
        band          VARCHAR   NOT NULL,
        mun_name      VARCHAR,
        brgy_name     VARCHAR,
        use_type      VARCHAR,
        PRIMARY KEY (building_id, facility_nm, scenario)
      );
    `);
    console.log("      ✓ table created");

    // 5. Populate via spatial join — both sides in 32651 so indexes are used.
    //    DISTINCT ON picks the highest-priority band when a centroid falls in
    //    multiple concentric rings for the same (facility, scenario).
    console.log("\n[5/5] Running spatial join (this may take a few minutes)...");
    const result = await client.query(`
      INSERT INTO fstp_building_coverage (
        building_id, facility_nm, scenario, band,
        mun_name, brgy_name, use_type
      )
      SELECT DISTINCT ON (b.id, fsa."FacilityNm", fsa."Scenario")
        b.id,
        fsa."FacilityNm",
        fsa."Scenario",
        fsa."Type",
        b."MunName",
        b."BrgyName",
        b.use_type
      FROM "Buildings" b
      JOIN _fstp_sa_32651 fsa
        ON ST_Intersects(ST_Centroid(b.geom), fsa.geom)
      ORDER BY
        b.id,
        fsa."FacilityNm",
        fsa."Scenario",
        CASE fsa."Type"
          WHEN '< 10 min'    THEN 1
          WHEN '10 - 20 min' THEN 2
          WHEN '20 - 30 min' THEN 3
          WHEN '> 30 min'    THEN 4
          ELSE 5
        END ASC
    `);
    console.log(`      ✓ inserted ${result.rowCount} coverage rows`);

    // Query-time indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_fstp_bldg_cov_facility
        ON fstp_building_coverage (facility_nm, scenario);
      CREATE INDEX IF NOT EXISTS idx_fstp_bldg_cov_band
        ON fstp_building_coverage (facility_nm, scenario, band);
    `);
    console.log("      ✓ query indexes created");

    // Summary
    const summary = await client.query<{ facility_nm: string; scenario: string; band: string; cnt: string }>(`
      SELECT facility_nm, scenario, band, COUNT(*) AS cnt
      FROM fstp_building_coverage
      GROUP BY facility_nm, scenario, band
      ORDER BY facility_nm, scenario,
        CASE band
          WHEN '< 10 min'    THEN 1
          WHEN '10 - 20 min' THEN 2
          WHEN '20 - 30 min' THEN 3
          WHEN '> 30 min'    THEN 4
          ELSE 5
        END
    `);
    console.log("\n── Coverage Summary ─────────────────────────────────────");
    let lastFac = "";
    for (const row of summary.rows) {
      if (row.facility_nm !== lastFac) {
        console.log(`\n  ${row.facility_nm}`);
        lastFac = row.facility_nm;
      }
      console.log(
        `    ${row.scenario.padEnd(7)}  ${row.band.padEnd(12)}  ${parseInt(row.cnt, 10).toLocaleString()} buildings`
      );
    }
    console.log("\n═══════════════════════════════════════════════════════");
    console.log("  ✅ Precomputation complete");
    console.log("═══════════════════════════════════════════════════════\n");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("❌ Precomputation failed:", err);
  process.exit(1);
});
