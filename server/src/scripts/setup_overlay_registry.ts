/**
 * One-time setup: creates the overlay_registry metadata table.
 *
 * Run once: npm run setup:registry
 *
 * The registry stores every spatial overlay table alongside:
 *   code        short machine-readable key  e.g. "bldg_gw"
 *   tag         grouping label              e.g. "env", "flood", "hazard"
 *   table_name  actual PG table             e.g. "ovl_bldg_gw"
 *   rebuild_sql CREATE TABLE AS SELECT ...  executed on every rebuild
 *   index_sql   CREATE INDEX statements     executed after rebuild
 *
 * Adding a new overlay later = INSERT a row here, no code changes needed.
 */
import "dotenv/config";
import pool from "../db/pool";

async function main() {
  console.log("Setting up overlay_registry table...");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS overlay_registry (
      id            SERIAL PRIMARY KEY,
      code          TEXT UNIQUE NOT NULL,
      tag           TEXT        NOT NULL,
      table_name    TEXT UNIQUE NOT NULL,
      source_layer  TEXT        NOT NULL,
      hazard_layer  TEXT        NOT NULL,
      description   TEXT,
      rebuild_sql   TEXT        NOT NULL,
      index_sql     TEXT,
      last_rebuilt_at TIMESTAMPTZ,
      row_count       INTEGER
    )
  `);

  // ── Register: Buildings × GroundWater depth ──────────────────────────────
  await pool.query(`
    INSERT INTO overlay_registry
      (code, tag, table_name, source_layer, hazard_layer, description, rebuild_sql, index_sql)
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8
    )
    ON CONFLICT (code) DO UPDATE SET
      tag          = EXCLUDED.tag,
      table_name   = EXCLUDED.table_name,
      source_layer = EXCLUDED.source_layer,
      hazard_layer = EXCLUDED.hazard_layer,
      description  = EXCLUDED.description,
      rebuild_sql  = EXCLUDED.rebuild_sql,
      index_sql    = EXCLUDED.index_sql
  `,
  [
    /* code        */ "bldg_gw",
    /* tag         */ "env",
    /* table_name  */ "ovl_bldg_gw",
    /* source      */ "Buildings",
    /* hazard      */ "GroundWater",
    /* description */ "Buildings × GroundWater depth — majority-area spatial join (SRID 32651)",
    /* rebuild_sql */ `
      CREATE TABLE ovl_bldg_gw AS
      SELECT
        b.id         AS building_id,
        b."ID"       AS building_uid,
        b.use_type,
        b."MunName"  AS mun_name,
        b."BrgyName" AS brgy_name,
        gw_maj."Type"      AS gw_type,
        gw_maj.gridcode    AS gw_gridcode,
        gw_maj.color_code  AS gw_color
      FROM "Buildings" b
      CROSS JOIN LATERAL (
        SELECT gw."Type", gw.gridcode, gw.color_code
        FROM "GroundWater" gw
        WHERE ST_Intersects(ST_Transform(b.geom, 32651), gw.geom)
        ORDER BY ST_Area(ST_Intersection(ST_Transform(b.geom, 32651), gw.geom)) DESC
        LIMIT 1
      ) gw_maj
    `,
    /* index_sql   */ `
      CREATE INDEX idx_obg_gw_type   ON ovl_bldg_gw (gw_type);
      CREATE INDEX idx_obg_mun_name  ON ovl_bldg_gw (mun_name);
      CREATE INDEX idx_obg_brgy_name ON ovl_bldg_gw (brgy_name);
      CREATE INDEX idx_obg_use_type  ON ovl_bldg_gw (use_type);
    `,
  ]);

  const { rows } = await pool.query(`SELECT code, tag, table_name, description FROM overlay_registry ORDER BY id`);
  console.log("\nRegistered overlays:");
  rows.forEach((r: any) => console.log(`  [${r.tag}] ${r.code} → ${r.table_name}  ${r.description}`));

  await pool.end();
}

main().catch((err) => {
  console.error("Setup failed:", err.message);
  process.exit(1);
});
