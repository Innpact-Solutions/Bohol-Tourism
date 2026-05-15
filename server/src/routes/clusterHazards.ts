/**
 * GET /api/cluster-hazards/:cluster_id
 *
 * Returns per-hazard exposure summary for a single tourism cluster, computed
 * from the pre-built `ovl_cluster_hazards` table (see
 * server/src/scripts/build_cluster_hazard_overlays.ts).
 *
 * Response shape:
 * {
 *   cluster_id: 1,
 *   name: '...',
 *   tier: 'Primary',
 *   lgu: '...',
 *   land_area_km2: 4.94,
 *   hazards: {
 *     heat_stress: {
 *       available: true,
 *       headline_pct: 78.2,         // % of land area in High + Extreme classes
 *       dominant_class: 'High',
 *       breakdown: [
 *         { class: 'Low',     gridcode: 1, color: '#...', area_km2: 0.5, pct: 10.1 },
 *         ...
 *       ]
 *     },
 *     flood:    { available: false },
 *     sinkhole: { available: false }
 *   }
 * }
 */
import { Router, Request, Response } from "express";
import pool from "../db/pool";

const router = Router();

/**
 * GET /api/cluster-hazards/summary
 *
 * Lightweight per-cluster headline percentages across all three hazards,
 * returned in a single round-trip. Used by the analytics panel KPI grid
 * to count clusters that exceed a high-hazard threshold without N
 * separate requests.
 */
router.get("/summary", async (_req: Request, res: Response) => {
  try {
    const r = await pool.query(
      `
      WITH areas AS (
        SELECT cluster_id, name, tier, lgu,
               COALESCE(area_land, 0) * 1000000.0 AS land_area_m2
          FROM tourism_clusters
      ),
      hazard_high AS (
        SELECT
          cluster_id,
          hazard,
          SUM(
            CASE
              WHEN hazard = 'heat_stress' AND gridcode IN (3, 4) THEN area_m2
              WHEN hazard = 'flood'       AND gridcode IN (3, 4) THEN area_m2
              WHEN hazard = 'sinkhole'    AND gridcode = 1       THEN area_m2
              ELSE 0
            END
          ) AS high_area_m2
          FROM ovl_cluster_hazards
         GROUP BY cluster_id, hazard
      )
      SELECT
        a.cluster_id,
        a.name,
        a.tier,
        a.lgu,
        COALESCE(MAX(CASE WHEN h.hazard = 'heat_stress'
          THEN h.high_area_m2 / NULLIF(a.land_area_m2, 0) * 100 END), 0) AS heat_pct,
        COALESCE(MAX(CASE WHEN h.hazard = 'flood'
          THEN h.high_area_m2 / NULLIF(a.land_area_m2, 0) * 100 END), 0) AS flood_pct,
        COALESCE(MAX(CASE WHEN h.hazard = 'sinkhole'
          THEN h.high_area_m2 / NULLIF(a.land_area_m2, 0) * 100 END), 0) AS sinkhole_pct
      FROM areas a
      LEFT JOIN hazard_high h ON h.cluster_id = a.cluster_id
      GROUP BY a.cluster_id, a.name, a.tier, a.lgu, a.land_area_m2
      ORDER BY a.cluster_id ASC
      `
    );
    const rows = r.rows.map((row: any) => ({
      cluster_id: Number(row.cluster_id),
      name: row.name,
      tier: row.tier,
      lgu: row.lgu,
      heat_pct: Number(Number(row.heat_pct).toFixed(1)),
      flood_pct: Number(Number(row.flood_pct).toFixed(1)),
      sinkhole_pct: Number(Number(row.sinkhole_pct).toFixed(1)),
    }));
    res.json({ count: rows.length, clusters: rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: "Query failed", message });
  }
});

const HAZARD_KEYS = ["heat_stress", "flood", "sinkhole"] as const;
type HazardKey = (typeof HAZARD_KEYS)[number];

/** gridcodes considered "high risk" — included in the headline %. */
const HIGH_RISK_GRIDCODES: Record<HazardKey, Set<number>> = {
  heat_stress: new Set([3, 4]), // High + Extreme HSI
  flood: new Set([3, 4]),       // Moderate + High flood
  sinkhole: new Set([1]),       // gridcode 1 = susceptible
};

/** Fallback class labels for hazards whose source table has no Type column. */
const FALLBACK_LABELS: Record<HazardKey, Record<number, string>> = {
  heat_stress: {},
  flood: {},
  sinkhole: { 1: "Susceptible", 2: "Not Susceptible" },
};

/**
 * GET /api/cluster-hazards/class-breakdown
 *
 * Aggregate class-level breakdown across all tourism clusters, grouped by
 * hazard. Used by the right-panel hazard pie chart to show the share of
 * total cluster area in each hazard class.
 */
router.get("/class-breakdown", async (_req: Request, res: Response) => {
  try {
    const r = await pool.query(
      `SELECT hazard, class_type, gridcode, color,
              SUM(area_m2) AS area_m2
         FROM ovl_cluster_hazards
        GROUP BY hazard, class_type, gridcode, color
        ORDER BY hazard, gridcode ASC`
    );

    const byHazard: Record<string, any[]> = {
      heat_stress: [],
      flood: [],
      sinkhole: [],
    };
    const totals: Record<string, number> = {
      heat_stress: 0,
      flood: 0,
      sinkhole: 0,
    };

    for (const row of r.rows as any[]) {
      const h = row.hazard as string;
      if (!(h in byHazard)) continue;
      const areaM2 = parseFloat(row.area_m2) || 0;
      totals[h] += areaM2;
      byHazard[h].push({
        gridcode: row.gridcode == null ? null : Number(row.gridcode),
        class_type: row.class_type,
        color: row.color,
        area_m2: areaM2,
      });
    }

    const result: Record<string, any[]> = {};
    for (const h of HAZARD_KEYS) {
      const total = totals[h] || 0;
      result[h] = byHazard[h].map((b) => ({
        gridcode: b.gridcode,
        class:
          b.class_type ??
          (b.gridcode != null ? FALLBACK_LABELS[h][b.gridcode] : null) ??
          null,
        color: b.color,
        area_km2: b.area_m2 / 1_000_000,
        pct: total > 0 ? Number(((b.area_m2 / total) * 100).toFixed(2)) : 0,
      }));
    }

    res.json({ hazards: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: "Query failed", message });
  }
});

interface BreakdownRow {
  class_type: string | null;
  gridcode: number | null;
  color: string | null;
  area_m2: string;
}

router.get("/:cluster_id", async (req: Request, res: Response) => {
  const clusterId = parseInt(String(req.params.cluster_id), 10);
  if (!Number.isFinite(clusterId)) {
    return res.status(400).json({ error: "Invalid cluster_id" });
  }

  try {
    // 1. Cluster metadata (used for the denominator and the response envelope)
    const cluster = await pool.query<{
      cluster_id: number;
      name: string;
      tier: string;
      lgu: string;
      area_land: number;
    }>(
      `SELECT cluster_id, name, tier, lgu, area_land
         FROM tourism_clusters
        WHERE cluster_id = $1`,
      [clusterId]
    );
    if (cluster.rowCount === 0) {
      return res.status(404).json({ error: "Cluster not found" });
    }
    const c = cluster.rows[0];
    const landAreaKm2 = Number(c.area_land) || 0;
    const landAreaM2 = landAreaKm2 * 1_000_000;

    // 2. Per-hazard breakdowns
    const hazards: Record<string, any> = {};
    for (const hazard of HAZARD_KEYS) {
      const r = await pool.query<BreakdownRow>(
        `SELECT class_type, gridcode, color, area_m2
           FROM ovl_cluster_hazards
          WHERE cluster_id = $1 AND hazard = $2
          ORDER BY gridcode ASC`,
        [clusterId, hazard]
      );

      if (r.rowCount === 0) {
        hazards[hazard] = { available: false };
        continue;
      }

      const breakdown = r.rows.map((row) => {
        const areaM2 = parseFloat(row.area_m2) || 0;
        const label =
          row.class_type ??
          (row.gridcode != null ? FALLBACK_LABELS[hazard][row.gridcode] : null) ??
          null;
        return {
          class: label,
          gridcode: row.gridcode,
          color: row.color,
          area_km2: areaM2 / 1_000_000,
          pct: landAreaM2 > 0 ? (areaM2 / landAreaM2) * 100 : 0,
        };
      });

      const headlineSet = HIGH_RISK_GRIDCODES[hazard];
      const headlinePct = breakdown
        .filter((b) => b.gridcode != null && headlineSet.has(b.gridcode))
        .reduce((s, b) => s + b.pct, 0);

      // Dominant class: within the high-risk headline set, pick the highest
      // severity gridcode that has measurable area. This way "High" is
      // surfaced whenever it is present, even if a lower-severity class
      // (e.g. Moderate) covers slightly more land. Falls back to the overall
      // largest-area class if no headline class is represented.
      const headlineRows = breakdown
        .filter((b) => b.gridcode != null && headlineSet.has(b.gridcode) && b.area_km2 > 0)
        .sort((a, b) => (b.gridcode ?? 0) - (a.gridcode ?? 0));
      const dominant =
        headlineRows[0] ??
        breakdown.reduce(
          (best, cur) => (cur.area_km2 > (best?.area_km2 ?? -1) ? cur : best),
          null as (typeof breakdown)[number] | null
        );

      hazards[hazard] = {
        available: true,
        headline_pct: Number(headlinePct.toFixed(1)),
        dominant_class: dominant?.class ?? null,
        breakdown,
      };
    }

    res.json({
      cluster_id: c.cluster_id,
      name: c.name,
      tier: c.tier,
      lgu: c.lgu,
      land_area_km2: landAreaKm2,
      hazards,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: "Query failed", message });
  }
});

export default router;
