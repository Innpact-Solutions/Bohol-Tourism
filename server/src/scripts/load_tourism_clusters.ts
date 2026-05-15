/**
 * One-time migration: load the 9 tourism clusters into PostGIS.
 *
 * Reads ../public/data/tourism/clusters.geojson from the repo root and creates
 * `tourism_clusters` with both EPSG:4326 (geom) and EPSG:32651 (geom_32651)
 * geometries so spatial joins against HS_HSI / Flood / Sinkhole layers don't
 * pay a ST_Transform cost on every call.
 *
 * Re-running this script is safe — it drops and recreates the table.
 *
 * Run: npx ts-node src/scripts/load_tourism_clusters.ts
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import pool from "../db/pool";

async function main() {
  // Resolve the clusters GeoJSON file. Local dev runs from `server/`; in
  // production the file lives next to the deployed bundle at ../public/...
  const candidates = [
    path.resolve(__dirname, "../../../public/data/tourism/clusters.geojson"),
    path.resolve(__dirname, "../../public/data/tourism/clusters.geojson"),
    path.resolve(process.cwd(), "../public/data/tourism/clusters.geojson"),
    path.resolve(process.cwd(), "public/data/tourism/clusters.geojson"),
  ];
  const file = candidates.find((p) => fs.existsSync(p));
  if (!file) {
    throw new Error(
      `clusters.geojson not found. Tried:\n  ${candidates.join("\n  ")}`
    );
  }
  console.log(`Loading clusters from ${file}`);

  const geojson = JSON.parse(fs.readFileSync(file, "utf-8"));
  if (geojson.type !== "FeatureCollection" || !Array.isArray(geojson.features)) {
    throw new Error("Invalid GeoJSON: expected FeatureCollection");
  }
  console.log(`  · ${geojson.features.length} cluster features`);

  console.log("Creating tourism_clusters table…");
  await pool.query(`DROP TABLE IF EXISTS tourism_clusters`);
  await pool.query(`
    CREATE TABLE tourism_clusters (
      cluster_id   INTEGER PRIMARY KEY,
      name         TEXT,
      tier         TEXT,
      lgu          TEXT,
      priority     INTEGER,
      area_km2     DOUBLE PRECISION,
      area_land    DOUBLE PRECISION,
      area_water   DOUBLE PRECISION,
      pct_water    DOUBLE PRECISION,
      potential    DOUBLE PRECISION,
      geom         GEOMETRY(MultiPolygon, 4326),
      geom_32651   GEOMETRY(MultiPolygon, 32651)
    )
  `);

  // Coerce GeoJSON property values: the source file uses the string "NULL"
  // for missing numeric fields, which Postgres can't cast to integer/double.
  const num = (v: unknown): number | null => {
    if (v === null || v === undefined) return null;
    if (typeof v === "string" && v.trim().toUpperCase() === "NULL") return null;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const str = (v: unknown): string | null => {
    if (v === null || v === undefined) return null;
    if (typeof v === "string" && v.trim().toUpperCase() === "NULL") return null;
    return String(v);
  };

  for (const f of geojson.features) {
    const p = f.properties ?? {};
    await pool.query(
      `INSERT INTO tourism_clusters
         (cluster_id, name, tier, lgu, priority,
          area_km2, area_land, area_water, pct_water, potential,
          geom, geom_32651)
       VALUES
         ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
          ST_Multi(ST_GeomFromGeoJSON($11)),
          ST_Multi(ST_Transform(ST_GeomFromGeoJSON($11), 32651)))`,
      [
        num(p.cluster_id),
        str(p.name),
        str(p.tier),
        str(p.lgu),
        num(p.priority),
        num(p.area_km2),
        num(p.area_land),
        num(p.area_water),
        num(p.pct_water),
        num(p.potential),
        JSON.stringify(f.geometry),
      ]
    );
  }

  console.log("Adding GiST indexes…");
  await pool.query(
    `CREATE INDEX idx_tourism_clusters_geom       ON tourism_clusters USING GIST (geom);
     CREATE INDEX idx_tourism_clusters_geom_32651 ON tourism_clusters USING GIST (geom_32651);`
  );
  await pool.query(`ANALYZE tourism_clusters`);

  const { rows } = await pool.query(
    `SELECT cluster_id, tier, lgu, area_land FROM tourism_clusters ORDER BY cluster_id`
  );
  console.log("\nLoaded clusters:");
  rows.forEach((r) =>
    console.log(`  #${r.cluster_id}  ${r.tier.padEnd(10)} ${r.lgu.padEnd(20)}  land ${r.area_land} km²`)
  );

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
