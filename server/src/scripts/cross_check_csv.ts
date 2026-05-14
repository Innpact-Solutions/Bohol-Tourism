import pool from '../db/pool';
import * as fs from 'fs';

(async () => {
  const csvData = JSON.parse(fs.readFileSync('/tmp/csv_ids.json', 'utf-8'));
  const r1Ids: number[] = csvData.r1;
  const r2Ids: number[] = csvData.r2;
  const r3Ids: number[] = csvData.r3;
  console.log('CSV counts: R1=' + r1Ids.length + ', R2=' + r2Ids.length + ', R3=' + r3Ids.length);

  const precomp = await pool.query(
    `SELECT qualifying_gids::text FROM scenario_network_precomputed WHERE density_stop=3 AND gwd_stop=3 AND gwi_stop=3 AND fld_stop=3`
  );
  const qGids: number[] = JSON.parse(precomp.rows[0].qualifying_gids);
  console.log('Qualifying grid GIDs:', qGids.length);

  const regions: [string, number[]][] = [['R1 Tagbilaran', r1Ids], ['R2 Panglao', r2Ids], ['R3 Dauis', r3Ids]];
  for (const [name, ids] of regions) {
    const r = await pool.query(
      `SELECT
        COUNT(*)::int AS found,
        COUNT(CASE WHEN grid_gid = ANY($2::int[]) THEN 1 END)::int AS in_grid,
        COUNT(CASE WHEN grid_gid IS NOT NULL AND NOT(grid_gid = ANY($2::int[])) THEN 1 END)::int AS outside,
        COUNT(CASE WHEN grid_gid IS NULL THEN 1 END)::int AS no_gid
       FROM "Buildings" WHERE id = ANY($1::int[])`,
      [ids, qGids]
    );
    const row = r.rows[0];
    console.log('\n=== ' + name + ' ===');
    console.log('CSV:', ids.length, '| Found in DB:', row.found, '| In qualifying grid:', row.in_grid, '| Outside grid:', row.outside, '| No grid_gid:', row.no_gid);
    console.log('Match rate:', Math.round(row.in_grid / ids.length * 100) + '%');
  }

  const allCsv = [...r1Ids, ...r2Ids, ...r3Ids];

  // Reverse: in precomputed grid but NOT in CSVs
  const rev = await pool.query(
    `SELECT COALESCE("MunName", 'Unknown') AS mun, COUNT(*)::int AS cnt
     FROM "Buildings" WHERE grid_gid = ANY($1::int[]) AND NOT(id = ANY($2::int[]))
     GROUP BY "MunName" ORDER BY cnt DESC`,
    [qGids, allCsv]
  );
  console.log('\n=== In precomputed grid but NOT in CSVs ===');
  let extra = 0;
  for (const r of rev.rows) { console.log(r.mun + ':', r.cnt); extra += r.cnt; }
  console.log('Total extra:', extra);

  // In CSVs but NOT in qualifying grid
  const missing = await pool.query(
    `SELECT COALESCE("MunName", 'Unknown') AS mun, COUNT(*)::int AS cnt
     FROM "Buildings" WHERE id = ANY($1::int[]) AND (grid_gid IS NULL OR NOT(grid_gid = ANY($2::int[])))
     GROUP BY "MunName" ORDER BY cnt DESC`,
    [allCsv, qGids]
  );
  console.log('\n=== In CSVs but NOT in qualifying grid ===');
  let miss = 0;
  for (const r of missing.rows) { console.log(r.mun + ':', r.cnt); miss += r.cnt; }
  console.log('Total missing:', miss);

  await pool.end();
})();
