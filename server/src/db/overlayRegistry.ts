/**
 * Overlay Registry utilities
 *
 * These functions are used by the admin rebuild routes and can also
 * be imported by any future migration script.
 */
import pool from "./pool";

export interface OverlayEntry {
  id: number;
  code: string;
  tag: string;
  table_name: string;
  source_layer: string;
  hazard_layer: string;
  description: string | null;
  rebuild_sql: string;
  index_sql: string | null;
  last_rebuilt_at: Date | null;
  row_count: number | null;
}

/** Return all registered overlays, optionally filtered by tag. */
export async function listOverlays(tag?: string): Promise<OverlayEntry[]> {
  const { rows } = await pool.query<OverlayEntry>(
    `SELECT * FROM overlay_registry
     WHERE ($1::text IS NULL OR tag = $1)
     ORDER BY id`,
    [tag ?? null]
  );
  return rows;
}

/** Rebuild a single overlay from its registry entry and update metadata. */
export async function rebuildOverlay(entry: OverlayEntry): Promise<number> {
  const started = Date.now();

  // Drop & recreate
  await pool.query(`DROP TABLE IF EXISTS "${entry.table_name}"`);
  await pool.query(entry.rebuild_sql);

  // Indexes (semicolon-separated statements)
  if (entry.index_sql) {
    const stmts = entry.index_sql
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const stmt of stmts) {
      await pool.query(stmt);
    }
  }

  // Row count
  const { rows } = await pool.query(
    `SELECT COUNT(*) AS count FROM "${entry.table_name}"`
  );
  const rowCount = parseInt(rows[0].count, 10);

  // Update registry metadata
  await pool.query(
    `UPDATE overlay_registry
     SET last_rebuilt_at = NOW(), row_count = $1
     WHERE code = $2`,
    [rowCount, entry.code]
  );

  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  console.log(
    `[overlay] rebuilt ${entry.table_name} (${entry.code}) — ${rowCount} rows in ${elapsed}s`
  );

  return rowCount;
}
