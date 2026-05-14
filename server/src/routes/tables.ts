import { Router, Request, Response } from "express";
import pool from "../db/pool";

const router = Router();

/**
 * GET /api/tables
 * Returns all table names in the public schema of the PostGIS database.
 */
router.get("/", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query<{ table_name: string; table_type: string }>(
      `SELECT table_name, table_type
       FROM information_schema.tables
       WHERE table_schema = 'public'
       ORDER BY table_type, table_name`
    );
    res.status(200).json({
      count: result.rows.length,
      tables: result.rows,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({
      error: "Failed to query tables",
      message,
    });
  }
});

export default router;
