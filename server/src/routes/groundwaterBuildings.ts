/**
 * GET /api/groundwater-buildings/stats
 *
 * Returns building count broken down by groundwater depth type.
 * Optionally filtered by mun_name and/or brgy_name.
 *
 * Query params:
 *   munName  - municipality name (optional)
 *   brgyName - barangay name (optional)
 *
 * Response:
 * {
 *   total: number,
 *   breakdown: Array<{
 *     gw_type: string,
 *     gw_gridcode: number,
 *     gw_color: string,
 *     count: number,
 *     use_type_breakdown: Array<{ use_type: string, count: number }>
 *   }>
 * }
 */
import { Router, Request, Response } from "express";
import pool from "../db/pool";

const router = Router();

// Canonical depth-level order (shallow → deep)
const DEPTH_ORDER: Record<string, number> = {
  "0 - 2 m":   1,
  "2 - 5 m":   2,
  "5 - 10 m":  3,
  "10 - 25 m": 4,
  "> 25 m":    5,
};

router.get("/stats", async (req: Request, res: Response) => {
  const munName  = (req.query.munName  as string) || null;
  const brgyName = (req.query.brgyName as string) || null;

  try {
    // Per-depth, per-use_type count
    const result = await pool.query<{
      gw_type: string;
      gw_gridcode: number;
      gw_color: string;
      use_type: string;
      count: string;
    }>(
      `SELECT
         gw_type,
         gw_gridcode,
         gw_color,
         COALESCE(use_type, 'Unknown') AS use_type,
         COUNT(*) AS count
       FROM ovl_bldg_gw
       WHERE ($1::text IS NULL OR mun_name = $1)
         AND ($2::text IS NULL OR brgy_name = $2)
       GROUP BY gw_type, gw_gridcode, gw_color, use_type
       ORDER BY gw_gridcode ASC, use_type ASC`,
      [munName, brgyName]
    );

    // Aggregate into per-depth buckets
    const buckets: Record<string, {
      gw_type: string;
      gw_gridcode: number;
      gw_color: string;
      count: number;
      use_type_breakdown: { use_type: string; count: number }[];
    }> = {};

    for (const row of result.rows) {
      if (!buckets[row.gw_type]) {
        buckets[row.gw_type] = {
          gw_type: row.gw_type,
          gw_gridcode: row.gw_gridcode,
          gw_color: row.gw_color,
          count: 0,
          use_type_breakdown: [],
        };
      }
      const cnt = parseInt(row.count, 10);
      buckets[row.gw_type].count += cnt;
      buckets[row.gw_type].use_type_breakdown.push({
        use_type: row.use_type,
        count: cnt,
      });
    }

    // Sort by canonical depth order
    const breakdown = Object.values(buckets).sort(
      (a, b) =>
        (DEPTH_ORDER[a.gw_type] ?? 99) - (DEPTH_ORDER[b.gw_type] ?? 99)
    );

    const total = breakdown.reduce((s, b) => s + b.count, 0);

    res.json({ total, breakdown });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: "Query failed", message });
  }
});

export default router;
