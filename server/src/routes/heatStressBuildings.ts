/**
 * GET /api/heat-stress-buildings/stats
 *
 * Returns building counts overlaid on the Heat Stress Index (HS_HSI) layer
 * using a majority-area spatial join (pre-computed in `ovl_bldg_hsi`).
 *
 * Query params:
 *   munName  - municipality name (optional)
 *   brgyName - barangay name (optional)
 *
 * Response:
 * {
 *   total: number,
 *   highCount: number,           // gridcode = 3
 *   extremeCount: number,        // gridcode = 4
 *   highAndExtreme: number,
 *   breakdown: Array<{
 *     hsi_type: string,
 *     hsi_gridcode: number,      // 1=Low, 2=Moderate, 3=High, 4=Extreme
 *     hsi_color: string,
 *     count: number
 *   }>
 * }
 */
import { Router, Request, Response } from "express";
import pool from "../db/pool";

const router = Router();

router.get("/stats", async (req: Request, res: Response) => {
  const munName = (req.query.munName as string) || null;
  const brgyName = (req.query.brgyName as string) || null;

  try {
    const result = await pool.query<{
      hsi_type: string;
      hsi_gridcode: number;
      hsi_color: string;
      count: string;
    }>(
      `SELECT
         hsi_type,
         hsi_gridcode,
         hsi_color,
         COUNT(*) AS count
       FROM ovl_bldg_hsi
       WHERE ($1::text IS NULL OR mun_name = $1)
         AND ($2::text IS NULL OR brgy_name = $2)
       GROUP BY hsi_type, hsi_gridcode, hsi_color
       ORDER BY hsi_gridcode ASC`,
      [munName, brgyName]
    );

    const breakdown = result.rows.map((r) => ({
      hsi_type: r.hsi_type,
      hsi_gridcode: r.hsi_gridcode,
      hsi_color: r.hsi_color,
      count: parseInt(r.count, 10),
    }));

    const total = breakdown.reduce((s, b) => s + b.count, 0);
    const highCount =
      breakdown.find((b) => b.hsi_gridcode === 3)?.count ?? 0;
    const extremeCount =
      breakdown.find((b) => b.hsi_gridcode === 4)?.count ?? 0;

    res.json({
      total,
      highCount,
      extremeCount,
      highAndExtreme: highCount + extremeCount,
      breakdown,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: "Query failed", message });
  }
});

export default router;
