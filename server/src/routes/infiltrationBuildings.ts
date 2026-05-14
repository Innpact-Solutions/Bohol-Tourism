/**
 * GET /api/infiltration-buildings/stats
 *
 * Returns building counts overlaid on the GroundWater Infiltration
 * Vulnerability layer using a majority-area spatial join (pre-computed in
 * `ovl_bldg_gwi`).
 *
 * Query params:
 *   munName  - municipality name (optional)
 *   brgyName - barangay name (optional)
 *
 * Response:
 * {
 *   total: number,
 *   highCount: number,       // gridcode = 4
 *   veryHighCount: number,   // gridcode = 5
 *   highAndVeryHigh: number,
 *   breakdown: Array<{
 *     gwi_type: string,
 *     gwi_gridcode: number,  // 2=Low, 3=Moderate, 4=High, 5=Very High
 *     gwi_color: string,
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
      gwi_type: string;
      gwi_gridcode: number;
      gwi_color: string;
      count: string;
    }>(
      `SELECT
         gwi_type,
         gwi_gridcode,
         gwi_color,
         COUNT(*) AS count
       FROM ovl_bldg_gwi
       WHERE ($1::text IS NULL OR mun_name = $1)
         AND ($2::text IS NULL OR brgy_name = $2)
       GROUP BY gwi_type, gwi_gridcode, gwi_color
       ORDER BY gwi_gridcode ASC`,
      [munName, brgyName]
    );

    const breakdown = result.rows.map((r) => ({
      gwi_type: r.gwi_type,
      gwi_gridcode: r.gwi_gridcode,
      gwi_color: r.gwi_color,
      count: parseInt(r.count, 10),
    }));

    const total = breakdown.reduce((s, b) => s + b.count, 0);
    const highCount =
      breakdown.find((b) => b.gwi_gridcode === 4)?.count ?? 0;
    const veryHighCount =
      breakdown.find((b) => b.gwi_gridcode === 5)?.count ?? 0;

    res.json({
      total,
      highCount,
      veryHighCount,
      highAndVeryHigh: highCount + veryHighCount,
      breakdown,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: "Query failed", message });
  }
});

export default router;
