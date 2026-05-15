/**
 * One-time migration: build per-cluster hazard exposure overlays.
 *
 * For every tourism_cluster polygon, computes the intersected area (m²)
 * with every class polygon of each registered hazard layer, broken down by
 * Type / gridcode / color_code. Results are stored in `ovl_cluster_hazards`:
 *
 *   cluster_id INT,
 *   hazard     TEXT     -- 'heat_stress' | 'flood' | 'sinkhole'
 *   class_type TEXT     -- e.g. 'High', 'Extreme'
 *   gridcode   INT      -- 1=Low, 2=Moderate, 3=High, 4=Extreme (when applicable)
 *   color      TEXT
 *   area_m2    DOUBLE PRECISION
 *
 * Hazards are processed only if the source table exists. Missing tables are
 * logged and skipped — the frontend renders "No data" for those.
 *
 * Run: npx ts-node src/scripts/build_cluster_hazard_overlays.ts
 */
import "dotenv/config";
import pool from "../db/pool";

interface HazardSpec {
  hazard: string;        // logical key returned by the API
  table: string;         // PG table name (case-sensitive, quoted)
  typeCol: string | null; // column with the class label (null if not present)
  gridcodeCol: string;   // numeric gradient column
  colorCol: string;      // hex color column
  /** SRID of the source table's geom column. */
  sourceSrid: number;
}

const HAZARDS: HazardSpec[] = [
  {
    hazard: "heat_stress",
    table: '"HS_HSI"',
    typeCol: '"Type"',
    gridcodeCol: "gridcode",
    colorCol: "color_code",
    sourceSrid: 32651,
  },
  // Optional — only run if these tables exist. Names follow the convention
  // used by HS_HSI / GroundWater (PascalCase). Adjust if your DB differs.
  {
    hazard: "flood",
    table: '"Flood_Hazard"',
    typeCol: '"Type"',
    gridcodeCol: "gridcode",
    colorCol: "color_code",
    sourceSrid: 32651,
  },
  {
    hazard: "sinkhole",
    table: '"Sinkhole"',
    typeCol: null, // Sinkhole table has no Type column — use gridcode only
    gridcodeCol: "gridcode",
    colorCol: "color_code",
    sourceSrid: 32651,
  },
];

async function tableExists(qualified: string): Promise<boolean> {
  // Strip surrounding quotes for the lookup but preserve case.
  const raw = qualified.replace(/^"|"$/g, "");
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
  console.log("Building per-cluster hazard overlays…");

  // Sanity: tourism_clusters must exist first.
  if (!(await tableExists('"tourism_clusters"')) && !(await tableExists("tourism_clusters"))) {
    throw new Error(
      "tourism_clusters table not found. Run load_tourism_clusters.ts first."
    );
  }

  console.log("  · (re)creating ovl_cluster_hazards…");
  await pool.query(`DROP TABLE IF EXISTS ovl_cluster_hazards`);
  await pool.query(`
    CREATE TABLE ovl_cluster_hazards (
      cluster_id  INTEGER NOT NULL,
      hazard      TEXT    NOT NULL,
      class_type  TEXT,
      gridcode    INTEGER,
      color       TEXT,
      area_m2     DOUBLE PRECISION NOT NULL,
      PRIMARY KEY (cluster_id, hazard, gridcode)
    )
  `);

  for (const h of HAZARDS) {
    const exists = await tableExists(h.table);
    if (!exists) {
      console.log(`  · SKIP ${h.hazard}: source table ${h.table} not found`);
      continue;
    }
    console.log(`  · ${h.hazard}: aggregating cluster intersection areas…`);

    // We use the pre-projected cluster geometry (geom_32651) and the hazard
    // table's native SRID. If they differ we transform on the fly.
    const clusterGeom =
      h.sourceSrid === 32651 ? "c.geom_32651" : `ST_Transform(c.geom, ${h.sourceSrid})`;

    const typeSelect = h.typeCol ? `h.${h.typeCol}` : `NULL::text`;
    const typeGroup  = h.typeCol ? `, h.${h.typeCol}` : ``;

    const sql = `
      INSERT INTO ovl_cluster_hazards (cluster_id, hazard, class_type, gridcode, color, area_m2)
      SELECT
        c.cluster_id,
        $1 AS hazard,
        ${typeSelect}     AS class_type,
        h.${h.gridcodeCol} AS gridcode,
        h.${h.colorCol}   AS color,
        SUM(ST_Area(ST_Intersection(${clusterGeom}, h.geom))) AS area_m2
      FROM tourism_clusters c
      JOIN ${h.table} h
        ON ${clusterGeom} && h.geom
       AND ST_Intersects(${clusterGeom}, h.geom)
      GROUP BY c.cluster_id, h.${h.gridcodeCol}, h.${h.colorCol}${typeGroup}
      HAVING SUM(ST_Area(ST_Intersection(${clusterGeom}, h.geom))) > 0
    `;
    const r = await pool.query(sql, [h.hazard]);
    console.log(`     -> ${r.rowCount} rows`);
  }

  console.log("  · adding indexes…");
  await pool.query(`
    CREATE INDEX idx_och_cluster ON ovl_cluster_hazards (cluster_id);
    CREATE INDEX idx_och_hazard  ON ovl_cluster_hazards (hazard);
  `);

  const { rows } = await pool.query(
    `SELECT hazard, COUNT(*)::int AS n
       FROM ovl_cluster_hazards
       GROUP BY hazard ORDER BY hazard`
  );
  console.log("\nOverlay summary:");
  rows.forEach((r) => console.log(`  ${r.hazard.padEnd(12)} ${r.n} rows`));

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
