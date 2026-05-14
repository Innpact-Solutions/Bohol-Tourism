/**
 * GET /api/scenario-results
 *
 * Instant lookup of precomputed Module 1 scenario results.
 *
 * Query params (all required, integers 1–4):
 *   d  — density_stop   (1=Low … 4=VeryHigh)
 *   g  — gwd_stop       (1=Deep … 4=VeryShallow)
 *   w  — gwi_stop       (1=LowVuln … 4=VeryHighVuln)
 *   f  — fld_stop       (1=NoFlood … 4=High)
 *
 * Response 200:
 * {
 *   density_stop: number,
 *   gwd_stop:     number,
 *   gwi_stop:     number,
 *   fld_stop:     number,
 *   grid_count:   number,
 *   area_ha:      string,          // NUMERIC → string from pg
 *   network_bldgs:    number,
 *   onsite_bldgs:     number,
 *   nonnetwork_bldgs: number,
 *   total_bldgs:      number,
 *   by_municipality:  Array<{ mun: string, network: number, onsite: number, nonnetwork: number }>,
 *   computed_at:  string
 * }
 *
 * Response 503 — table not yet populated (run precomputation first)
 * Response 400 — invalid params
 * Response 404 — row missing (should never happen after full precompute)
 */
import { Router, Request, Response } from "express";
import pool from "../db/pool";

const router = Router();

function parseStop(value: unknown, name: string): number | null {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 4) return null;
  return n;
}

router.get("/", async (req: Request, res: Response) => {
  const d = parseStop(req.query.d, "d");
  const g = parseStop(req.query.g, "g");
  const w = parseStop(req.query.w, "w");
  const f = parseStop(req.query.f, "f");

  if (d === null || g === null || w === null || f === null) {
    return res.status(400).json({
      error: "Invalid parameters. d, g, w, f must each be an integer from 1 to 4.",
      received: { d: req.query.d, g: req.query.g, w: req.query.w, f: req.query.f },
    });
  }

  try {
    // Check table exists
    const tableCheck = await pool.query<{ exists: boolean }>(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'scenario_network_precomputed'
      ) AS exists
    `);

    if (!tableCheck.rows[0].exists) {
      return res.status(503).json({
        error: "Precomputed table not found.",
        hint: "Run: cd server && npx ts-node src/scripts/precompute_scenario_network.ts  OR  POST /api/admin/recompute-scenario",
      });
    }

    // Check whether buffer_bldg_ids column exists (added by updated precompute script)
    const bufColCheck = await pool.query<{ exists: boolean }>(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'scenario_network_precomputed'
          AND column_name = 'buffer_bldg_ids'
      ) AS exists
    `);
    const hasBufferCol = bufColCheck.rows[0].exists;

    const result = await pool.query<{
      density_stop: number;
      gwd_stop: number;
      gwi_stop: number;
      fld_stop: number;
      grid_count: number;
      area_ha: string;
      network_bldgs: number;
      onsite_bldgs: number;
      nonnetwork_bldgs: number;
      total_bldgs: number;
      by_municipality: Array<{ mun: string; network: number; onsite: number; nonnetwork: number }>;
      computed_at: string;
      buffer_bldgs: number;
    }>(
      `SELECT density_stop, gwd_stop, gwi_stop, fld_stop,
              grid_count, area_ha,
              network_bldgs, onsite_bldgs, nonnetwork_bldgs, total_bldgs,
              by_municipality, computed_at,
              ${hasBufferCol
                ? `jsonb_array_length(COALESCE(buffer_bldg_ids, '[]'::jsonb))`
                : `0`
              } AS buffer_bldgs
       FROM scenario_network_precomputed
       WHERE density_stop = $1
         AND gwd_stop     = $2
         AND gwi_stop     = $3
         AND fld_stop     = $4`,
      [d, g, w, f]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Row not found for the given combination.",
        hint: "Re-run precomputation to populate all 256 rows.",
        params: { d, g, w, f },
      });
    }

    const row = result.rows[0];
    return res.json({
      density_stop:     Number(row.density_stop),
      gwd_stop:         Number(row.gwd_stop),
      gwi_stop:         Number(row.gwi_stop),
      fld_stop:         Number(row.fld_stop),
      grid_count:       Number(row.grid_count),
      area_ha:          parseFloat(String(row.area_ha)),
      network_bldgs:    Number(row.network_bldgs),
      onsite_bldgs:     Number(row.onsite_bldgs),
      nonnetwork_bldgs: Number(row.nonnetwork_bldgs),
      total_bldgs:      Number(row.total_bldgs),
      by_municipality:  row.by_municipality,
      computed_at:      row.computed_at,
      buffer_bldgs:     Number(row.buffer_bldgs ?? 0),
      ingrid_bldgs:     Number(row.network_bldgs) - Number(row.buffer_bldgs ?? 0),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: "Query failed", message });
  }
});

export default router;
