/**
 * Per-cluster road network breakdown.
 *
 * Backed by the precomputed `ovl_cluster_roads` table built by
 * `server/src/scripts/build_cluster_road_overlays.ts`. Percentages are
 * computed at read time so they always sum to 100% within a cluster.
 *
 * Endpoints:
 *
 *  GET /api/cluster-roads
 *    All clusters, all categories.
 *    {
 *      categories: string[],
 *      clusters: [
 *        {
 *          cluster_id, name, tier, lgu,
 *          total_km,
 *          breakdown: [
 *            { category, length_km, pct }
 *          ]
 *        }
 *      ]
 *    }
 *
 *  GET /api/cluster-roads/:cluster_id
 *    Same shape as one entry of the `clusters` array.
 */
import { Router, Request, Response } from "express";
import pool from "../db/pool";

const router = Router();

interface Row {
  cluster_id: number;
  name: string;
  tier: string;
  lgu: string;
  category: string | null;
  length_m: string;
}

async function fetchBreakdown(): Promise<Row[]> {
  const r = await pool.query<Row>(
    `SELECT c.cluster_id, c.name, c.tier, c.lgu,
            o.category, o.length_m
       FROM tourism_clusters c
       LEFT JOIN ovl_cluster_roads o ON o.cluster_id = c.cluster_id
      ORDER BY c.cluster_id ASC, o.category ASC`
  );
  return r.rows;
}

function shape(rows: Row[]) {
  const byCluster = new Map<number, {
    cluster_id: number;
    name: string;
    tier: string;
    lgu: string;
    total_m: number;
    items: Array<{ category: string; length_m: number }>;
  }>();
  const catSet = new Set<string>();

  for (const row of rows) {
    const cid = Number(row.cluster_id);
    let bucket = byCluster.get(cid);
    if (!bucket) {
      bucket = {
        cluster_id: cid,
        name: row.name,
        tier: row.tier,
        lgu: row.lgu,
        total_m: 0,
        items: [],
      };
      byCluster.set(cid, bucket);
    }
    if (!row.category) continue;
    const len = parseFloat(row.length_m) || 0;
    bucket.total_m += len;
    bucket.items.push({ category: row.category, length_m: len });
    catSet.add(row.category);
  }

  const categories = [...catSet].sort();

  const clusters = [...byCluster.values()]
    .sort((a, b) => a.cluster_id - b.cluster_id)
    .map((b) => ({
      cluster_id: b.cluster_id,
      name: b.name,
      tier: b.tier,
      lgu: b.lgu,
      total_km: Number((b.total_m / 1000).toFixed(3)),
      breakdown: b.items
        .sort((a, b) => a.category.localeCompare(b.category))
        .map((it) => ({
          category: it.category,
          length_km: Number((it.length_m / 1000).toFixed(3)),
          pct: b.total_m > 0
            ? Number(((it.length_m / b.total_m) * 100).toFixed(2))
            : 0,
        })),
    }));

  return { categories, clusters };
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
    res.json({ categories: shaped.categories, cluster });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: "Query failed", message });
  }
});

export default router;
