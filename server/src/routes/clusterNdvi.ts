/**
 * Per-cluster green-cover (NDVI) breakdown.
 *
 * Backed by the precomputed `ovl_cluster_ndvi` table built by
 * `server/src/scripts/build_cluster_ndvi_overlays.ts`. Percentages are
 * computed at read time so they always sum to 100% within a cluster.
 *
 * Endpoints:
 *
 *  GET /api/cluster-ndvi
 *    All clusters, all classes. Use this for dashboards/overlays.
 *    {
 *      classes: [
 *        { gridcode, class, color }            // canonical class metadata
 *      ],
 *      clusters: [
 *        {
 *          cluster_id, name, tier, lgu,
 *          total_km2,                          // sum of all class areas
 *          breakdown: [
 *            { gridcode, class, color, area_km2, pct }
 *          ]
 *        }
 *      ]
 *    }
 *
 *  GET /api/cluster-ndvi/:cluster_id
 *    Same shape as one item of the `clusters` array above.
 */
import { Router, Request, Response } from "express";
import pool from "../db/pool";

const router = Router();

interface Row {
  cluster_id: number;
  name: string;
  tier: string;
  lgu: string;
  gridcode: number | null;
  class_type: string | null;
  color: string | null;
  area_m2: string;
}

/**
 * Fetch the full per-cluster breakdown joined with cluster metadata.
 * Used by both endpoints — the single-cluster endpoint filters in-process
 * because the dataset is tiny (≤ 9 clusters × 6 classes).
 */
async function fetchBreakdown(): Promise<Row[]> {
  const r = await pool.query<Row>(
    `SELECT c.cluster_id, c.name, c.tier, c.lgu,
            o.gridcode, o.class_type, o.color, o.area_m2
       FROM tourism_clusters c
       LEFT JOIN ovl_cluster_ndvi o ON o.cluster_id = c.cluster_id
      ORDER BY c.cluster_id ASC, o.gridcode ASC`
  );
  return r.rows;
}

/** Shape the flat rows into the API's nested per-cluster structure. */
function shape(rows: Row[]) {
  const byCluster = new Map<number, {
    cluster_id: number;
    name: string;
    tier: string;
    lgu: string;
    total_m2: number;
    items: Array<{
      gridcode: number;
      class_type: string | null;
      color: string | null;
      area_m2: number;
    }>;
  }>();

  for (const row of rows) {
    const cid = Number(row.cluster_id);
    let bucket = byCluster.get(cid);
    if (!bucket) {
      bucket = {
        cluster_id: cid,
        name: row.name,
        tier: row.tier,
        lgu: row.lgu,
        total_m2: 0,
        items: [],
      };
      byCluster.set(cid, bucket);
    }
    if (row.gridcode == null) continue; // cluster has no NDVI overlap
    const area = parseFloat(row.area_m2) || 0;
    bucket.total_m2 += area;
    bucket.items.push({
      gridcode: Number(row.gridcode),
      class_type: row.class_type,
      color: row.color,
      area_m2: area,
    });
  }

  // Canonical class metadata — sorted by gridcode and deduplicated across
  // all clusters. Lets the frontend render a consistent legend.
  const classMap = new Map<number, { gridcode: number; class: string | null; color: string | null }>();
  for (const row of rows) {
    if (row.gridcode == null) continue;
    const g = Number(row.gridcode);
    if (!classMap.has(g)) {
      classMap.set(g, {
        gridcode: g,
        class: row.class_type,
        color: row.color,
      });
    }
  }
  const classes = [...classMap.values()].sort((a, b) => a.gridcode - b.gridcode);

  const clusters = [...byCluster.values()]
    .sort((a, b) => a.cluster_id - b.cluster_id)
    .map((b) => {
      const total = b.total_m2;
      return {
        cluster_id: b.cluster_id,
        name: b.name,
        tier: b.tier,
        lgu: b.lgu,
        total_km2: Number((total / 1_000_000).toFixed(3)),
        breakdown: b.items
          .sort((a, b) => a.gridcode - b.gridcode)
          .map((it) => ({
            gridcode: it.gridcode,
            class: it.class_type,
            color: it.color,
            area_km2: Number((it.area_m2 / 1_000_000).toFixed(3)),
            pct: total > 0
              ? Number(((it.area_m2 / total) * 100).toFixed(2))
              : 0,
          })),
      };
    });

  return { classes, clusters };
}

router.get("/", async (_req: Request, res: Response) => {
  try {
    const rows = await fetchBreakdown();
    res.json(shape(rows));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: "Query failed", message });
  }
});

router.get("/:cluster_id", async (req: Request, res: Response) => {
  const cid = parseInt(String(req.params.cluster_id), 10);
  if (!Number.isFinite(cid)) {
    return res.status(400).json({ error: "Invalid cluster_id" });
  }
  try {
    const rows = await fetchBreakdown();
    const shaped = shape(rows);
    const cluster = shaped.clusters.find((c) => c.cluster_id === cid);
    if (!cluster) return res.status(404).json({ error: "Cluster not found" });
    res.json({ classes: shaped.classes, cluster });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: "Query failed", message });
  }
});

export default router;
