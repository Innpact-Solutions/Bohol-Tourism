/**
 * One-time migration: create ovl_bldg_hsi table
 *
 * Majority-based spatial overlay of Buildings × Heat Stress Index (HS_HSI).
 * For each building, the HS_HSI polygon with the largest intersection area
 * is assigned as the building's heat stress class.
 *
 * Pre-projects buildings into 32651 (HS_HSI native CRS) and indexes both
 * sides so the LATERAL ST_Intersects join uses the GiST bbox filter
 * instead of scanning every polygon for every building.
 *
 * Run: npx ts-node src/scripts/create_buildings_heat_stress.ts
 */
import "dotenv/config";
import pool from "../db/pool";

async function main() {
  console.log("Creating ovl_bldg_hsi (majority-based Buildings × HS_HSI overlay)...");

  // 1. Ensure GiST index on the heat-stress polygons.
  console.log("  · ensuring GiST index on HS_HSI.geom …");
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_hs_hsi_geom ON "HS_HSI" USING GIST (geom)`
  );

  // 2. Build a temp table of buildings reprojected to 32651 with a GiST index.
  console.log("  · projecting buildings to EPSG:32651 (temp table) …");
  await pool.query(`DROP TABLE IF EXISTS bld_32651_tmp`);
  await pool.query(`
    CREATE UNLOGGED TABLE bld_32651_tmp AS
    SELECT
      b.id          AS building_id,
      b."ID"        AS building_uid,
      b.use_type,
      b."MunName"   AS mun_name,
      b."BrgyName"  AS brgy_name,
      ST_Transform(b.geom, 32651) AS geom_32651
    FROM "Buildings" b
    WHERE b.geom IS NOT NULL
  `);
  await pool.query(
    `CREATE INDEX idx_bld_32651_tmp_geom ON bld_32651_tmp USING GIST (geom_32651)`
  );
  await pool.query(`ANALYZE bld_32651_tmp`);

  // 3. Run the majority join, now using both GiST indexes.
  console.log("  · running majority-area spatial join …");
  await pool.query(`DROP TABLE IF EXISTS ovl_bldg_hsi`);
  await pool.query(`
    CREATE TABLE ovl_bldg_hsi AS
    SELECT
      b.building_id,
      b.building_uid,
      b.use_type,
      b.mun_name,
      b.brgy_name,
      hsi_maj."Type"     AS hsi_type,
      hsi_maj.gridcode   AS hsi_gridcode,
      hsi_maj.color_code AS hsi_color
    FROM bld_32651_tmp b
    CROSS JOIN LATERAL (
      SELECT
        hsi."Type",
        hsi.gridcode,
        hsi.color_code
      FROM "HS_HSI" hsi
      WHERE hsi.geom && b.geom_32651
        AND ST_Intersects(hsi.geom, b.geom_32651)
      ORDER BY ST_Area(ST_Intersection(hsi.geom, b.geom_32651)) DESC
      LIMIT 1
    ) hsi_maj
  `);

  console.log("  · adding indexes on ovl_bldg_hsi …");
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_bhsi_gridcode  ON ovl_bldg_hsi (hsi_gridcode);
    CREATE INDEX IF NOT EXISTS idx_bhsi_mun_name  ON ovl_bldg_hsi (mun_name);
    CREATE INDEX IF NOT EXISTS idx_bhsi_brgy_name ON ovl_bldg_hsi (brgy_name);
    CREATE INDEX IF NOT EXISTS idx_bhsi_use_type  ON ovl_bldg_hsi (use_type);
  `);

  await pool.query(`DROP TABLE IF EXISTS bld_32651_tmp`);

  const total = await pool.query(`SELECT COUNT(*)::int AS c FROM ovl_bldg_hsi`);
  const breakdown = await pool.query(
    `SELECT hsi_gridcode, hsi_type, COUNT(*)::int AS c
       FROM ovl_bldg_hsi
       GROUP BY hsi_gridcode, hsi_type
       ORDER BY hsi_gridcode`
  );
  console.log(`Done. Rows inserted: ${total.rows[0].c}`);
  console.table(breakdown.rows);

  await pool.end();
}

main().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
