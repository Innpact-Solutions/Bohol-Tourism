/**
 * One-time migration: create buildings_groundwater_depth table
 *
 * Uses a majority-based spatial join: for each building, the GroundWater
 * polygon with the largest intersection area is assigned as the building's
 * groundwater depth class.
 *
 * Run once: npx ts-node src/scripts/create_buildings_groundwater.ts
 */
import "dotenv/config";
import pool from "../db/pool";

async function main() {
  console.log("Creating buildings_groundwater_depth table (majority-based overlay)...");

  await pool.query(`DROP TABLE IF EXISTS buildings_groundwater_depth`);

  // Buildings: EPSG:4326 | GroundWater: EPSG:32651
  // Reproject Buildings to 32651 for the spatial join, then work in 32651
  await pool.query(`
    CREATE TABLE buildings_groundwater_depth AS
    SELECT
      b.id         AS building_id,
      b."ID"       AS building_uid,
      b.use_type,
      b."MunName"  AS mun_name,
      b."BrgyName" AS brgy_name,
      gw_maj."Type"       AS gw_type,
      gw_maj.gridcode     AS gw_gridcode,
      gw_maj.color_code   AS gw_color
    FROM "Buildings" b
    CROSS JOIN LATERAL (
      SELECT
        gw."Type",
        gw.gridcode,
        gw.color_code
      FROM "GroundWater" gw
      WHERE ST_Intersects(ST_Transform(b.geom, 32651), gw.geom)
      ORDER BY ST_Area(ST_Intersection(ST_Transform(b.geom, 32651), gw.geom)) DESC
      LIMIT 1
    ) gw_maj
  `);

  console.log("Table created. Adding indexes...");

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_bgd_gw_type   ON buildings_groundwater_depth (gw_type);
    CREATE INDEX IF NOT EXISTS idx_bgd_mun_name  ON buildings_groundwater_depth (mun_name);
    CREATE INDEX IF NOT EXISTS idx_bgd_brgy_name ON buildings_groundwater_depth (brgy_name);
    CREATE INDEX IF NOT EXISTS idx_bgd_use_type  ON buildings_groundwater_depth (use_type);
  `);

  const count = await pool.query(`SELECT COUNT(*) FROM buildings_groundwater_depth`);
  console.log(`Done. Rows inserted: ${count.rows[0].count}`);

  await pool.end();
}

main().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
