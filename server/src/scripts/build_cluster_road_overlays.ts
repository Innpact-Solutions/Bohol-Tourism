/**
 * Per-cluster road-network precompute.
 *
 * For every cluster in `tourism_clusters`, intersect with every road in
 * `public."Road_Network"` and store the resulting length (m) keyed by
 * road category. Persisted to `ovl_cluster_roads`:
 *
 *   cluster_id  INTEGER
 *   category    TEXT     -- Municipal/Barangay/Private/National/Trail/Provincial
 *   length_m    DOUBLE PRECISION
 *
 * Run: npx ts-node -r dotenv/config src/scripts/build_cluster_road_overlays.ts
 */
import "dotenv/config";
import pool from "../db/pool";

const ROADS = '"Road_Network"';
const SRID = 32651;

async function main() {
  console.log("Building per-cluster road overlays…");

  console.log("  · (re)creating ovl_cluster_roads…");
  await pool.query(`DROP TABLE IF EXISTS ovl_cluster_roads`);
  await pool.query(`
    CREATE TABLE ovl_cluster_roads (
      cluster_id  INTEGER NOT NULL,
      category    TEXT    NOT NULL,
      length_m    DOUBLE PRECISION NOT NULL,
      PRIMARY KEY (cluster_id, category)
    )
  `);

  const clusterGeom =
    SRID === 32651 ? "c.geom_32651" : `ST_Transform(c.geom, ${SRID})`;

  console.log("  · intersecting cluster polygons with road segments…");
  const sql = `
    INSERT INTO ovl_cluster_roads (cluster_id, category, length_m)
    SELECT
      c.cluster_id,
      r.category,
      SUM(ST_Length(ST_Intersection(${clusterGeom}, r.geom))) AS length_m
    FROM tourism_clusters c
    JOIN public.${ROADS} r
      ON ${clusterGeom} && r.geom
     AND ST_Intersects(${clusterGeom}, r.geom)
    WHERE r.category IS NOT NULL
    GROUP BY c.cluster_id, r.category
    HAVING SUM(ST_Length(ST_Intersection(${clusterGeom}, r.geom))) > 0
  `;
  const r = await pool.query(sql);
  console.log(`     -> ${r.rowCount} rows`);

  await pool.query(`CREATE INDEX idx_ocr_cluster ON ovl_cluster_roads (cluster_id)`);

  const summary = await pool.query(
    `SELECT cluster_id,
            COUNT(*)::int AS categories,
            ROUND((SUM(length_m) / 1000)::numeric, 3) AS total_km
       FROM ovl_cluster_roads
      GROUP BY cluster_id
      ORDER BY cluster_id`
  );
  console.log("\nPer-cluster summary (cluster_id, #categories, total km):");
  summary.rows.forEach((row) =>
    console.log(
      `  ${String(row.cluster_id).padEnd(4)} ${String(row.categories).padEnd(3)} ${row.total_km}`
    )
  );

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
