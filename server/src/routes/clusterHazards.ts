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

      const dominant = breakdown.reduce(
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
