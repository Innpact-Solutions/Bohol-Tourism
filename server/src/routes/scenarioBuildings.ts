/**
 * POST /api/scenario-buildings
 *
 * Given a list of Grid cell GIDs that qualify as "Network Coverage" from the
 * Module 1 Scenario Creator, returns building counts broken down by sanitation
 * zone and by municipality.
 *
 * Zone classification:
 *   - grid_gid IN qualifying gids        → Network Coverage
 *   - all others                          → Non-Network Coverage
 *   (sewer_feas field has been removed from Buildings table)
 *
 * Body: { gridGids: number[] }
 *
 * Response:
 * {
 *   total: number,
 *   network: number,
 *   onsite: number,
 *   nonnetwork: number,
 *   byMunicipality: Array<{ mun: string, network: number, onsite: number, nonnetwork: number }>
 * }
 */
import { Router, Request, Response } from "express";
import pool from "../db/pool";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  const body = req.body as { gridGids?: unknown };
  const { gridGids } = body;

  if (
    !Array.isArray(gridGids) ||
    gridGids.some((g) => typeof g !== "number" && typeof g !== "string")
  ) {
    return res.status(400).json({ error: "gridGids must be an array of numbers" });
  }

  const gids = (gridGids as (number | string)[]).map((g) => Number(g)).filter((g) => !isNaN(g));

  try {
    if (gids.length === 0) {
      const totalResult = await pool.query<{ total: string }>(
        `SELECT COUNT(*) AS total FROM "Buildings"`
      );
      const totalCount = parseInt(totalResult.rows[0].total, 10);
      return res.json({
        total: totalCount,
        network: 0,
        onsite: 0,
        nonnetwork: totalCount,
        byMunicipality: [],
      });
    }

    const result = await pool.query<{
      zone: string;
      mun: string;
      count: string;
    }>(
      `SELECT
         CASE
           WHEN grid_gid = ANY($1::int[])               THEN 'Network Coverage'
           ELSE                                              'Non-Network Coverage'
         END AS zone,
         COALESCE("MunName", 'Unknown') AS mun,
         COUNT(*) AS count
       FROM "Buildings"
       GROUP BY zone, "MunName"
       ORDER BY zone, mun`,
      [gids]
    );

    let network = 0;
    let onsite = 0;
    let nonnetwork = 0;
    const munMap: Record<string, { network: number; onsite: number; nonnetwork: number }> = {};

    for (const row of result.rows) {
      const count = parseInt(row.count, 10);
      const mun = row.mun;
      if (!munMap[mun]) munMap[mun] = { network: 0, onsite: 0, nonnetwork: 0 };
      if (row.zone === "Network Coverage") {
        network += count;
        munMap[mun].network += count;
      } else {
        nonnetwork += count;
        munMap[mun].nonnetwork += count;
      }
    }

    const total = network + onsite + nonnetwork;

    return res.json({
      total,
      network,
      onsite,
      nonnetwork,
      byMunicipality: Object.entries(munMap).map(([mun, counts]) => ({
        mun,
        ...counts,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: "Query failed", message });
  }
});

export default router;
