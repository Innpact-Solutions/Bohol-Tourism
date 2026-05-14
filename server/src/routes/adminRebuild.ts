/**
 * Admin overlay management routes
 *
 * GET  /api/admin/overlays              list all registered overlays (optionally ?tag=)
 * POST /api/admin/rebuild?tag=<tag>     rebuild all overlays with this tag
 * POST /api/admin/rebuild?code=<code>   rebuild one specific overlay by code
 * POST /api/admin/rebuild               rebuild ALL overlays (no filter)
 *
 * Optional protection: set ADMIN_SECRET env var → require
 *   Authorization: Bearer <secret>
 */
import { Router, Request, Response } from "express";
import { listOverlays, rebuildOverlay } from "../db/overlayRegistry";
import pool from "../db/pool";
import { buildPrecomputeSQL } from "../db/scenarioPrecompute";

const router = Router();

/** Simple auth guard */
function checkAuth(req: Request, res: Response): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return true; // no secret set → open
  const auth = req.headers["authorization"] ?? "";
  if (auth !== `Bearer ${secret}`) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

// ── GET /api/admin/overlays ─────────────────────────────────────────────────
router.get("/overlays", async (req: Request, res: Response) => {
  const tag = (req.query.tag as string) || undefined;
  try {
    const overlays = await listOverlays(tag);
    res.json({ count: overlays.length, overlays });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: "Failed to list overlays", message });
  }
});

// ── POST /api/admin/rebuild ─────────────────────────────────────────────────
router.post("/rebuild", async (req: Request, res: Response) => {
  if (!checkAuth(req, res)) return;

  const tag  = (req.query.tag  as string) || undefined;
  const code = (req.query.code as string) || undefined;

  try {
    const overlays = await listOverlays(tag);
    const targets = code ? overlays.filter((o) => o.code === code) : overlays;

    if (targets.length === 0) {
      res.status(404).json({
        error: "No matching overlays found",
        tag: tag ?? null,
        code: code ?? null,
      });
      return;
    }

    const results: Array<{ code: string; tag: string; table_name: string; rows: number; elapsed_seconds: number }> = [];

    for (const entry of targets) {
      const t0 = Date.now();
      const rowCount = await rebuildOverlay(entry);
      results.push({
        code: entry.code,
        tag: entry.tag,
        table_name: entry.table_name,
        rows: rowCount,
        elapsed_seconds: parseFloat(((Date.now() - t0) / 1000).toFixed(1)),
      });
    }

    res.json({ status: "ok", rebuilt: results.length, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[admin] rebuild failed:", message);
    res.status(500).json({ error: "Rebuild failed", message });
  }
});

// ── POST /api/admin/recompute-scenario ──────────────────────────────────────
// Rebuilds the scenario_network_precomputed table with all 256 slider combos.
// This is a long-running operation (1–4 min); the response waits for completion.
router.post("/recompute-scenario", async (req: Request, res: Response) => {
  if (!checkAuth(req, res)) return;

  const client = await pool.connect();
  try {
    console.log("[admin] recompute-scenario started");
    const t0 = Date.now();

    // Indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_buildings_grid_gid
        ON "Buildings" (grid_gid);
      CREATE INDEX IF NOT EXISTS idx_grid_scenario_fields
        ON "Grid" (den_type, fld_score, gwd_score, gwi_score, tour_zone);
    `);

    // Drop & recreate table
    await client.query(`
      DROP TABLE IF EXISTS scenario_network_precomputed;
      CREATE TABLE scenario_network_precomputed (
        density_stop     SMALLINT      NOT NULL,
        gwd_stop         SMALLINT      NOT NULL,
        gwi_stop         SMALLINT      NOT NULL,
        fld_stop         SMALLINT      NOT NULL,
        grid_count       INTEGER       NOT NULL DEFAULT 0,
        area_ha          NUMERIC(12,2) NOT NULL DEFAULT 0,
        network_bldgs    INTEGER       NOT NULL DEFAULT 0,
        onsite_bldgs     INTEGER       NOT NULL DEFAULT 0,
        nonnetwork_bldgs INTEGER       NOT NULL DEFAULT 0,
        total_bldgs      INTEGER       NOT NULL DEFAULT 0,
        by_municipality  JSONB         NOT NULL DEFAULT '[]',
        computed_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        PRIMARY KEY (density_stop, gwd_stop, gwi_stop, fld_stop)
      );
    `);

    // Run the single-pass INSERT for all 256 combos
    await client.query(buildPrecomputeSQL());

    const elapsed = parseFloat(((Date.now() - t0) / 1000).toFixed(1));
    const { rows } = await client.query(
      `SELECT COUNT(*) AS n FROM scenario_network_precomputed`
    );
    const rowCount = parseInt(rows[0].n, 10);

    console.log(`[admin] recompute-scenario done: ${rowCount} rows in ${elapsed}s`);
    res.json({
      status: "ok",
      rows: rowCount,
      elapsed_seconds: elapsed,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[admin] recompute-scenario failed:", message);
    res.status(500).json({ error: "Recompute failed", message });
  } finally {
    client.release();
  }
});

export default router;
