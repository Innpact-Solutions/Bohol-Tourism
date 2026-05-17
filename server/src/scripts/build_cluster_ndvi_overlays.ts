/**
 * Per-cluster green-cover (NDVI) precompute.
 *
 * For every row in `tourism_clusters`, intersect with each polygon class of
 * `public."NDVI"` and store the resulting area (m²) keyed by NDVI gridcode.
 * Persisted to `ovl_cluster_ndvi`:
 *
 *   cluster_id  INTEGER
 *   gridcode    INTEGER   -- 1..6 (Water → Very dense forest)
 *   class_type  TEXT      -- NDVI."Type"
 *   color       TEXT      -- NDVI.color_code
 *   area_m2     DOUBLE PRECISION
 *
 * The percentages served by the API are derived at read time from these
 * area_m2 values relative to the SUM of the cluster's NDVI classes (so the
 * five/six classes always sum to 100% within the cluster).
 *
 * Run: npx ts-node src/scripts/build_cluster_ndvi_overlays.ts
 */
import "dotenv/config";
import pool from "../db/pool";

const NDVI_TABLE = '"NDVI"';
const NDVI_SRID = 32651;

async function tableExists(name: string): Promise<boolean> {
  const raw = name.replace(/^"|"$/g, "");
  const r = await pool.query(
    `SELECT 1 FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = $1 AND n.nspname = 'public'
      LIMIT 1`,
    [raw]
  );
  return (r.rowCount ?? 0) > 0;
}

async function main() {
  console.log("Building per-cluster NDVI overlays…");

  if (!(await tableExists('"tourism_clusters"')) && !(await tableExists("tourism_clusters"))) {
    throw new Error("tourism_clusters not found. Run load_tourism_clusters.ts first.");
  }
  if (!(await tableExists(NDVI_TABLE))) {
    throw new Error(`Source table public.${NDVI_TABLE} not found.`);
  }

  console.log("  · (re)creating ovl_cluster_ndvi…");
  await pool.query(`DROP TABLE IF EXISTS ovl_cluster_ndvi`);
  await pool.query(`
    CREATE TABLE ovl_cluster_ndvi (
      cluster_id  INTEGER NOT NULL,
      gridcode    INTEGER NOT NULL,
      class_type  TEXT,
      color       TEXT,
      area_m2     DOUBLE PRECISION NOT NULL,
      PRIMARY KEY (cluster_id, gridcode)
    )
  `);

  const clusterGeom =
    NDVI_SRID === 32651 ? "c.geom_32651" : `ST_Transform(c.geom, ${NDVI_SRID})`;

  console.log("  · intersecting cluster polygons with NDVI classes…");
  const sql = `
    INSERT INTO ovl_cluster_ndvi (cluster_id, gridcode, class_type, color, area_m2)
    SELECT
      c.cluster_id,
      n.gridcode,
      MAX(n."Type")       AS class_type,
      MAX(n.color_code)   AS color,
      SUM(ST_Area(ST_Intersection(${clusterGeom}, n.geom))) AS area_m2
    FROM tourism_clusters c
    JOIN public.${NDVI_TABLE} n
      ON ${clusterGeom} && n.geom
     AND ST_Intersects(${clusterGeom}, n.geom)
    GROUP BY c.cluster_id, n.gridcode
    HAVING SUM(ST_Area(ST_Intersection(${clusterGeom}, n.geom))) > 0
  `;
  const r = await pool.query(sql);
  console.log(`     -> ${r.rowCount} rows`);

  await pool.query(`CREATE INDEX idx_ocn_cluster ON ovl_cluster_ndvi (cluster_id)`);

  const summary = await pool.query(
    `SELECT cluster_id, COUNT(*)::int AS classes,
            ROUND(SUM(area_m2)::numeric / 1e6, 3) AS total_km2
       FROM ovl_cluster_ndvi
      GROUP BY cluster_id
      ORDER BY cluster_id`
  );
  console.log("\nPer-cluster summary (cluster_id, #classes, total km²):");
  summary.rows.forEach((r) =>
    console.log(`  ${String(r.cluster_id).padEnd(4)} ${String(r.classes).padEnd(3)} ${r.total_km2}`)
  );

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
