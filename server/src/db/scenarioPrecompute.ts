/**
 * Module 1 Scenario — In-Memory Computation Engine
 * =================================================
 * Loads grid cells + buildings from DB once, then evaluates all 256
 * slider combinations entirely in Node.js — applying the three spatial
 * post-processing rules that cannot be expressed cleanly in a single SQL pass:
 *
 *  Rule 1 — Gap-fill:   a non-qualifying cell that has ≥ 3 qualifying 4-neighbours
 *                        is pulled into the qualifying set (one pass).
 *  Rule 2 — Min cluster: connected components (4-connectivity) with ≤ 5 cells
 *                        are removed.  All clusters including tourism are subject to this rule.
 *  Rule 3 — Min span:   clusters that do not span at least 2 grid rows AND
 *                        2 grid columns are removed.  All clusters including tourism are subject to this rule.
 *
 * Grid cell (col, row) indices are derived from the cell centroid:
 *   col = FLOOR(centroid_x / 100)
 *   row = FLOOR(centroid_y / 100)
 * This works because the grid is a regular 100 m × 100 m EPSG:32651 grid.
 */

// ── Types ──────────────────────────────────────────────────────────────────
export interface GridCell {
  gid: number;
  col: number;
  row: number;
  den_rank: number;
  fld_score: number;
  gwd_score: number;
  gwi_score: number;
  is_tourism: boolean;
  cell_ha: number;
}

export interface Building {
  grid_gid: number | null;
  mun: string;
}

export interface ComboStats {
  grid_count: number;
  area_ha: number;
  network_bldgs: number;
  onsite_bldgs: number;
  nonnetwork_bldgs: number;
  total_bldgs: number;
  by_municipality: Array<{ mun: string; network: number; onsite: number; nonnetwork: number }>;
  qualifying_gids: number[];
}

// ── Step 1: raw qualification ──────────────────────────────────────────────
export function computeRawQualifying(
  cells: GridCell[],
  ds: number, gs: number, ws: number, fs: number
): Set<number> {
  const s = new Set<number>();
  for (const c of cells) {
    if (
      c.is_tourism ||
      (c.den_rank >= ds && (c.fld_score >= fs || c.gwd_score >= gs || c.gwi_score >= ws))
    ) {
      s.add(c.gid);
    }
  }
  return s;
}

// ── Step 2: gap-fill (one pass, non-tourism non-qualifying cells) ──────────
export function applyGapFill(
  qualifying: Set<number>,
  adj: Map<number, number[]>
): Set<number> {
  const result = new Set(qualifying);
  for (const [gid, neighbors] of adj) {
    if (result.has(gid)) continue;
    let count = 0;
    for (const n of neighbors) if (result.has(n)) count++;
    if (count >= 3) result.add(gid);
  }
  return result;
}

// ── Step 3: connected components (4-connectivity BFS) ─────────────────────
export function connectedComponents(
  gidSet: Set<number>,
  adj: Map<number, number[]>
): Set<number>[] {
  const visited = new Set<number>();
  const components: Set<number>[] = [];
  for (const gid of gidSet) {
    if (visited.has(gid)) continue;
    const comp = new Set<number>();
    const queue: number[] = [gid];
    visited.add(gid);
    while (queue.length > 0) {
      const cur = queue.pop()!;
      comp.add(cur);
      for (const n of (adj.get(cur) ?? [])) {
        if (!visited.has(n) && gidSet.has(n)) {
          visited.add(n);
          queue.push(n);
        }
      }
    }
    components.push(comp);
  }
  return components;
}

// ── Step 4: apply cluster size + span filters ──────────────────────────────
export function applyClusterFilters(
  gidSet: Set<number>,
  adj: Map<number, number[]>,
  gidToCell: Map<number, GridCell>,
  _tourismGids?: Set<number> // kept for call-site compatibility; no longer used
): Set<number> {
  const components = connectedComponents(gidSet, adj);
  const result = new Set<number>();
  for (const comp of components) {
    // Rule 2: min cluster size > 5 (applies to all clusters including tourism)
    if (comp.size <= 5) continue;
    // Rule 3: must span ≥ 2 rows AND ≥ 2 cols (applies to all clusters including tourism)
    let minCol = Infinity, maxCol = -Infinity;
    let minRow = Infinity, maxRow = -Infinity;
    for (const g of comp) {
      const cell = gidToCell.get(g)!;
      if (cell.col < minCol) minCol = cell.col;
      if (cell.col > maxCol) maxCol = cell.col;
      if (cell.row < minRow) minRow = cell.row;
      if (cell.row > maxRow) maxRow = cell.row;
    }
    if (maxCol - minCol < 1 || maxRow - minRow < 1) continue;
    for (const g of comp) result.add(g);
  }
  return result;
}

// ── Step 5: build adjacency map from col/row indices ──────────────────────
export function buildAdjacency(cells: GridCell[]): Map<number, number[]> {
  const posToGid = new Map<string, number>();
  for (const c of cells) posToGid.set(`${c.col},${c.row}`, c.gid);
  const adj = new Map<number, number[]>();
  const dirs: [number, number][] = [[1,0],[-1,0],[0,1],[0,-1]];
  for (const c of cells) {
    const neighbors: number[] = [];
    for (const [dc, dr] of dirs) {
      const n = posToGid.get(`${c.col + dc},${c.row + dr}`);
      if (n !== undefined) neighbors.push(n);
    }
    adj.set(c.gid, neighbors);
  }
  return adj;
}

// ── Step 6: count buildings given the final qualifying set ─────────────────
export function computeStats(
  finalSet: Set<number>,
  buildings: Building[],
  gidToCell: Map<number, GridCell>
): ComboStats {
  const munMap = new Map<string, { network: number; onsite: number; nonnetwork: number }>();

  let network = 0, onsite = 0, nonnetwork = 0;
  for (const b of buildings) {
    const zone =
      b.grid_gid != null && finalSet.has(b.grid_gid) ? 'network' : 'nonnetwork';
    if (zone === 'network') network++;
    else                    nonnetwork++;

    if (!munMap.has(b.mun)) munMap.set(b.mun, { network: 0, onsite: 0, nonnetwork: 0 });
    munMap.get(b.mun)![zone]++;
  }

  let area_ha = 0;
  for (const gid of finalSet) {
    const cell = gidToCell.get(gid);
    if (cell) area_ha += cell.cell_ha;
  }

  const by_municipality = [...munMap.entries()]
    .map(([mun, v]) => ({ mun, ...v }))
    .sort((a, b) => (b.network + b.onsite + b.nonnetwork) - (a.network + a.onsite + a.nonnetwork) || a.mun.localeCompare(b.mun));

  return {
    grid_count: finalSet.size,
    area_ha: Math.round(area_ha * 100) / 100,
    network_bldgs: network,
    onsite_bldgs: onsite,
    nonnetwork_bldgs: nonnetwork,
    total_bldgs: network + onsite + nonnetwork,
    by_municipality,
    qualifying_gids: [...finalSet],
  };
}

// ── Legacy SQL builder (kept for reference, no longer used by precompute) ──
/** @deprecated Use the in-memory functions above. */
export function buildPrecomputeSQL(): string {
  return /* sql */ `
  INSERT INTO scenario_network_precomputed
    ( density_stop, gwd_stop, gwi_stop, fld_stop,
      grid_count, area_ha,
      network_bldgs, onsite_bldgs, nonnetwork_bldgs, total_bldgs,
      by_municipality )
  WITH

  /* ── 1. Normalise Grid fields ───────────────────────────────────────── */
  grid_data AS (
    SELECT
      gid,
      CASE den_type
        WHEN 'Low Density'        THEN 1
        WHEN 'Medium Density'     THEN 2
        WHEN 'High Density'       THEN 3
        WHEN 'Very High Density'  THEN 4
        ELSE 0
      END                                      AS den_rank,
      COALESCE(fld_score, 0)::SMALLINT         AS fld_score,
      COALESCE(gwd_score, 0)::SMALLINT         AS gwd_score,
      COALESCE(gwi_score, 0)::SMALLINT         AS gwi_score,
      (tour_zone = 'High Tourism Zone')        AS is_tourism,
      ROUND(COALESCE(cell_m2, 10000) / 10000.0, 4) AS cell_ha
    FROM "Grid"
  ),

  /* ── 2. All 256 slider combinations ────────────────────────────────── */
  combos AS (
    SELECT d.v::SMALLINT AS ds,
           g.v::SMALLINT AS gs,
           w.v::SMALLINT AS ws,
           f.v::SMALLINT AS fs
    FROM generate_series(1, 4) AS d(v)
    CROSS JOIN generate_series(1, 4) AS g(v)
    CROSS JOIN generate_series(1, 4) AS w(v)
    CROSS JOIN generate_series(1, 4) AS f(v)
  ),

  /* ── 3. Qualifying grid cells per combo ─────────────────────────────── */
  grid_qual AS (
    SELECT c.ds, c.gs, c.ws, c.fs,
           gd.gid,
           gd.cell_ha
    FROM   combos    c
    CROSS JOIN grid_data gd
    WHERE  gd.is_tourism
        OR (    gd.den_rank  >= c.ds
            AND (   gd.fld_score >= c.fs
                 OR gd.gwd_score >= c.gs
                 OR gd.gwi_score >= c.ws ))
  ),

  /* ── 4. Grid count + area per combo ─────────────────────────────────── */
  grid_summary AS (
    SELECT ds, gs, ws, fs,
           COUNT(*)::INT                         AS grid_count,
           ROUND(SUM(cell_ha)::NUMERIC, 2)      AS area_ha
    FROM   grid_qual
    GROUP  BY ds, gs, ws, fs
  ),

  /* ── 5. Building zone per combo (cross-join buildings × combos) ──────── */
  bldg_scored AS (
    SELECT
      c.ds, c.gs, c.ws, c.fs,
      COALESCE(b."MunName", 'Unknown') AS mun,
      CASE
        WHEN gq.gid IS NOT NULL                  THEN 'network'
        WHEN b.sewer_feas = 'On-Site Treatment'  THEN 'onsite'
        ELSE                                          'nonnetwork'
      END AS zone
    FROM combos        c
    CROSS JOIN "Buildings" b
    LEFT  JOIN grid_qual  gq
           ON  gq.gid = b.grid_gid
           AND gq.ds  = c.ds
           AND gq.gs  = c.gs
           AND gq.ws  = c.ws
           AND gq.fs  = c.fs
  ),

  /* ── 6. Aggregate: combo × municipality × zone ─────────────────────── */
  bldg_mun_zone AS (
    SELECT ds, gs, ws, fs, mun, zone,
           COUNT(*)::INT AS cnt
    FROM   bldg_scored
    GROUP  BY ds, gs, ws, fs, mun, zone
  ),

  /* ── 7. Pivot zones per combo × municipality ───────────────────────── */
  bldg_mun_pivot AS (
    SELECT ds, gs, ws, fs, mun,
      SUM(CASE WHEN zone = 'network'    THEN cnt ELSE 0 END)::INT AS network,
      SUM(CASE WHEN zone = 'onsite'     THEN cnt ELSE 0 END)::INT AS onsite,
      SUM(CASE WHEN zone = 'nonnetwork' THEN cnt ELSE 0 END)::INT AS nonnetwork
    FROM bldg_mun_zone
    GROUP BY ds, gs, ws, fs, mun
  ),

  /* ── 8. Build by_municipality JSONB per combo ──────────────────────── */
  mun_json AS (
    SELECT ds, gs, ws, fs,
      JSONB_AGG(
        JSONB_BUILD_OBJECT(
          'mun',        mun,
          'network',    network,
          'onsite',     onsite,
          'nonnetwork', nonnetwork
        )
        ORDER BY (network + onsite + nonnetwork) DESC, mun
      ) AS by_municipality
    FROM bldg_mun_pivot
    GROUP BY ds, gs, ws, fs
  ),

  /* ── 9. Total buildings per combo ───────────────────────────────────── */
  bldg_totals AS (
    SELECT ds, gs, ws, fs,
      SUM(CASE WHEN zone = 'network'    THEN cnt ELSE 0 END)::INT AS network_bldgs,
      SUM(CASE WHEN zone = 'onsite'     THEN cnt ELSE 0 END)::INT AS onsite_bldgs,
      SUM(CASE WHEN zone = 'nonnetwork' THEN cnt ELSE 0 END)::INT AS nonnetwork_bldgs,
      SUM(cnt)::INT                                                AS total_bldgs
    FROM bldg_mun_zone
    GROUP BY ds, gs, ws, fs
  )

  /* ── 10. Final join and insert ──────────────────────────────────────── */
  SELECT
    gs.ds,
    gs.gs,
    gs.ws,
    gs.fs,
    gs.grid_count,
    gs.area_ha,
    COALESCE(bt.network_bldgs,    0),
    COALESCE(bt.onsite_bldgs,     0),
    COALESCE(bt.nonnetwork_bldgs, 0),
    COALESCE(bt.total_bldgs,      0),
    COALESCE(mj.by_municipality, '[]'::JSONB)
  FROM grid_summary gs
  LEFT JOIN bldg_totals bt USING (ds, gs, ws, fs)
  LEFT JOIN mun_json    mj USING (ds, gs, ws, fs)
  ORDER BY gs.ds, gs.gs, gs.ws, gs.fs
  `;
}
