/**
 * Probe what NDVI / green-cover source data is available in the PostGIS DB.
 * Lists candidate table names and reports geometry / raster column type.
 *
 * Run: npx ts-node src/scripts/check_ndvi_source.ts
 */
import "dotenv/config";
import pool from "../db/pool";

async function main() {
  const r = await pool.query(`
    SELECT c.relname AS name,
           n.nspname AS schema,
           c.relkind AS kind
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND (c.relname ILIKE '%ndvi%'
            OR c.relname ILIKE '%green%'
            OR c.relname ILIKE '%vegetation%'
            OR c.relname ILIKE '%landcover%'
            OR c.relname ILIKE '%land_cover%')
     ORDER BY c.relname
  `);
  console.log("Candidate tables:");
  for (const row of r.rows) {
    console.log(` - ${row.schema}.${row.name} (kind=${row.kind})`);
    const cols = await pool.query(
      `SELECT column_name, data_type, udt_name
         FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = $2
        ORDER BY ordinal_position`,
      [row.schema, row.name]
    );
    for (const c of cols.rows) {
      console.log(`     · ${c.column_name}  ${c.data_type}/${c.udt_name}`);
    }
  }

  // Also list any raster tables in the DB.
  const rasters = await pool.query(`
    SELECT r_table_schema, r_table_name, r_raster_column, srid
      FROM raster_columns
  `).catch(() => ({ rows: [] as any[] }));
  console.log(`\nRaster tables (${rasters.rows.length}):`);
  for (const r of rasters.rows) {
    console.log(` - ${r.r_table_schema}.${r.r_table_name} col=${r.r_raster_column} srid=${r.srid}`);
  }

  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
