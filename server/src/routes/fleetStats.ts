/**
 * GET /api/fleet-stats
 *
 * Returns building counts grouped by dslg_class (fleet accessibility)
 * and optionally by municipality.
 *
 * Query params:
 *   mun_name — optional municipality filter
 *
 * Response:
 * {
 *   total_buildings: number,
 *   classified: number,
 *   unclassified: number,
 *   by_class: [{ dslg_class, count, pct }],
 *   by_municipality: [{ mun_name, classes: { "10 KL Truck": n, ... }, total }],
 *   by_use_type: [{ use_type, classes: { "10 KL Truck": n, ... }, total }]
 * }
 */
import { Router, Request, Response } from "express";
import pool from "../db/pool";

const router = Router();

const CLASS_ORDER = ["10 KL Truck", "5 KL Truck", "With Booster Pump", "Hard to Access"];

router.get("/", async (req: Request, res: Response) => {
  const { mun_name } = req.query;

  try {
    const munFilter = mun_name ? `AND "MunName" = $1` : "";
    const params: any[] = mun_name ? [mun_name] : [];

    // Total buildings
    const totalRes = await pool.query(
      `SELECT COUNT(*) AS total FROM public."Buildings" WHERE 1=1 ${munFilter}`,
      params
    );
    const total_buildings = parseInt(totalRes.rows[0].total, 10);

    // By dslg_class
    const classRes = await pool.query(
      `SELECT dslg_class, COUNT(*) AS count
       FROM public."Buildings"
       WHERE dslg_class IS NOT NULL ${munFilter}
       GROUP BY dslg_class
       ORDER BY count DESC`,
      params
    );
    const classified = classRes.rows.reduce((sum: number, r: any) => sum + parseInt(r.count, 10), 0);
    const by_class = CLASS_ORDER.map(cls => {
      const row = classRes.rows.find((r: any) => r.dslg_class === cls);
      const count = row ? parseInt(row.count, 10) : 0;
      return { dslg_class: cls, count, pct: total_buildings > 0 ? Math.round((count / total_buildings) * 1000) / 10 : 0 };
    });

    // By municipality + class
    const munRes = await pool.query(
      `SELECT "MunName" AS mun_name, dslg_class, COUNT(*) AS count
       FROM public."Buildings"
       WHERE dslg_class IS NOT NULL ${munFilter}
       GROUP BY "MunName", dslg_class
       ORDER BY "MunName"`,
      params
    );
    const munMap: Record<string, Record<string, number>> = {};
    for (const r of munRes.rows) {
      if (!munMap[r.mun_name]) munMap[r.mun_name] = {};
      munMap[r.mun_name][r.dslg_class] = parseInt(r.count, 10);
    }
    const by_municipality = Object.entries(munMap).map(([mun_name, classes]) => ({
      mun_name,
      classes,
      total: Object.values(classes).reduce((s, v) => s + v, 0),
    })).sort((a, b) => b.total - a.total);

    // By use_type + class
    const useRes = await pool.query(
      `SELECT COALESCE(use_type, 'Unknown') AS use_type, dslg_class, COUNT(*) AS count
       FROM public."Buildings"
       WHERE dslg_class IS NOT NULL ${munFilter}
       GROUP BY use_type, dslg_class
       ORDER BY COUNT(*) DESC`,
      params
    );
    const useMap: Record<string, Record<string, number>> = {};
    for (const r of useRes.rows) {
      if (!useMap[r.use_type]) useMap[r.use_type] = {};
      useMap[r.use_type][r.dslg_class] = parseInt(r.count, 10);
    }
    const by_use_type = Object.entries(useMap).map(([use_type, classes]) => ({
      use_type,
      classes,
      total: Object.values(classes).reduce((s, v) => s + v, 0),
    })).sort((a, b) => b.total - a.total);

    res.json({
      total_buildings,
      classified,
      unclassified: total_buildings - classified,
      by_class,
      by_municipality,
      by_use_type,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Fleet stats query failed:", message);
    res.status(500).json({ error: "Query failed", message });
  }
});

export default router;
