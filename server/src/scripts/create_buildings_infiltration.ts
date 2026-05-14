/**
 * One-time migration: create `ovl_bldg_gwi` table
 *
 * Majority-based spatial overlay of Buildings × GroundWater Infiltration
 * Vulnerability. For each building, the GWI polygon with the largest
 * intersection area is assigned as the building's infiltration-
 * vulnerability class.
 *
 * Pre-projects buildings into 32651 (GWI native CRS) and indexes both
 * sides so the LATERAL ST_Intersects join uses the GiST bbox filter
 * instead of scanning every polygon for every building.
 *
 * Run: npx ts-node src/scripts/create_buildings_infiltration.ts
 */
import "dotenv/config";
import pool from "../db/pool";

async function main() {
  console.log("Creating ovl_bldg_gwi (majority-based Buildings × GroundWater_Infiltration_Vulnerability overlay)...");

  console.log("  · ensuring GiST index on GroundWater_Infiltration_Vulnerability.geom …");
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_gwi_geom ON "GroundWater_Infiltration_Vulnerability" USING GIST (geom)`
  );

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

  console.log("  · running majority-area spatial join …");
  await pool.query(`DROP TABLE IF EXISTS ovl_bldg_gwi`);
  await pool.query(`
    CREATE TABLE ovl_bldg_gwi AS
    SELECT
      b.building_id,
      b.building_uid,
      b.use_type,
      b.mun_name,
      b.brgy_name,
      gwi_maj."Type"     AS gwi_type,
      gwi_maj.gridcode   AS gwi_gridcode,
      gwi_maj.color_code AS gwi_color
    FROM bld_32651_tmp b
    CROSS JOIN LATERAL (
      SELECT
        gwi."Type",
        gwi.gridcode,
        gwi.color_code
      FROM "GroundWater_Infiltration_Vulnerability" gwi
      WHERE gwi.geom && b.geom_32651
        AND ST_Intersects(gwi.geom, b.geom_32651)
      ORDER BY ST_Area(ST_Intersection(gwi.geom, b.geom_32651)) DESC
      LIMIT 1
    ) gwi_maj
  `);

  console.log("  · adding indexes on ovl_bldg_gwi …");
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_bgwi_gridcode  ON ovl_bldg_gwi (gwi_gridcode);
    CREATE INDEX IF NOT EXISTS idx_bgwi_mun_name  ON ovl_bldg_gwi (mun_name);
    CREATE INDEX IF NOT EXISTS idx_bgwi_brgy_name ON ovl_bldg_gwi (brgy_name);
    CREATE INDEX IF NOT EXISTS idx_bgwi_use_type  ON ovl_bldg_gwi (use_type);
  `);

  await pool.query(`DROP TABLE IF EXISTS bld_32651_tmp`);

  const total = await pool.query(`SELECT COUNT(*)::int AS c FROM ovl_bldg_gwi`);
  const breakdown = await pool.query(
    `SELECT gwi_gridcode, gwi_type, COUNT(*)::int AS c
       FROM ovl_bldg_gwi
       GROUP BY gwi_gridcode, gwi_type
       ORDER BY gwi_gridcode`
  );
  console.log(`Done. Rows inserted: ${total.rows[0].c}`);
  console.table(breakdown.rows);

  await pool.end();
}

main().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
