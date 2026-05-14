import { Router, Request, Response } from "express";
import pool from "../db/pool";

const router = Router();

/**
 * GET /health
 * Returns server status and verifies database connectivity.
 */
router.get("/", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query<{ now: Date }>("SELECT NOW() AS now");
    res.status(200).json({
      status: "ok",
      db: "connected",
      timestamp: result.rows[0].now,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({
      status: "error",
      db: "disconnected",
      message,
    });
  }
});

export default router;
