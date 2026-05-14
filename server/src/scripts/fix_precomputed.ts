import pool from '../db/pool';
import * as fs from 'fs';

(async () => {
  const csvData = JSON.parse(fs.readFileSync('/tmp/csv_ids.json', 'utf-8'));
  const allCsvIds: number[] = [...csvData.r1, ...csvData.r2, ...csvData.r3];
  console.log('Total CSV building IDs:', allCsvIds.length);

  // Get current qualifying_gids for 3,3,3,3
  const pre = await pool.query(
    `SELECT qualifying_gids::text FROM scenario_network_precomputed WHERE density_stop=3 AND gwd_stop=3 AND gwi_stop=3 AND fld_stop=3`
  );
  const currentGids: number[] = JSON.parse(pre.rows[0].qualifying_gids);
  console.log('Current qualifying GIDs:', currentGids.length);

  // Step 1: Find which qualifying grid cells contain at least one CSV building
  const gidsWithCsv = await pool.query<{ grid_gid: number; csv_count: number; total_count: number }>(
    `SELECT b.grid_gid,
            COUNT(CASE WHEN b.id = ANY($2::int[]) THEN 1 END)::int AS csv_count,
            COUNT(*)::int AS total_count
     FROM "Buildings" b
     WHERE b.grid_gid = ANY($1::int[])
     GROUP BY b.grid_gid
     ORDER BY b.grid_gid`,
    [currentGids, allCsvIds]
  );

  let gidsToKeep: number[] = [];
  let gidsToRemove: number[] = [];
  let csvInKept = 0;
  let extraInKept = 0;

  for (const r of gidsWithCsv.rows) {
    if (r.csv_count > 0) {
      gidsToKeep.push(r.grid_gid);
      csvInKept += r.csv_count;
      extraInKept += (r.total_count - r.csv_count);
    } else {
      gidsToRemove.push(r.grid_gid);
    }
  }

  console.log('\n=== GRID CELL ANALYSIS ===');
  console.log('Grid cells with CSV buildings (KEEP):', gidsToKeep.length);
  console.log('Grid cells with ZERO CSV buildings (REMOVE):', gidsToRemove.length);
  console.log('CSV buildings in kept cells:', csvInKept);
  console.log('Extra (non-CSV) buildings still in kept cells:', extraInKept);
  console.log('Removed grid cells:', gidsToRemove);

  // Step 2: Count buildings that will be removed from network
  const removedBldgs = await pool.query<{ mun: string; cnt: number }>(
    `SELECT COALESCE("MunName", 'Unknown') AS mun, COUNT(*)::int AS cnt
     FROM "Buildings" WHERE grid_gid = ANY($1::int[]) GROUP BY "MunName" ORDER BY cnt DESC`,
    [gidsToRemove]
  );
  console.log('\nBuildings removed from network by municipality:');
  let totalRemoved = 0;
  for (const r of removedBldgs.rows) { console.log('  ' + r.mun + ':', r.cnt); totalRemoved += r.cnt; }
  console.log('  Total removed:', totalRemoved);
  console.log('  Extra still in kept cells:', extraInKept);
  console.log('  Total non-CSV buildings:', totalRemoved + extraInKept, '(should be 983)');

  // Step 3: Get new counts by municipality for the KEPT grid cells
  // Only CSV buildings should be network
  const newByMun = await pool.query<{ mun: string; network: number; onsite: number }>(
    `SELECT COALESCE(b."MunName", 'Unknown') AS mun,
            COUNT(CASE WHEN b.id = ANY($2::int[]) THEN 1 END)::int AS network,
            COUNT(CASE WHEN NOT(b.id = ANY($2::int[])) THEN 1 END)::int AS extra
     FROM "Buildings" b
     WHERE b.grid_gid = ANY($1::int[])
     GROUP BY b."MunName" ORDER BY mun`,
    [gidsToKeep, allCsvIds]
  );
  console.log('\n=== NEW BY-MUNICIPALITY COUNTS (network = CSV only) ===');
  for (const r of newByMun.rows) {
    console.log('  ' + r.mun + ': network=' + r.network + ', extra_in_grid=' + r.onsite);
  }

  // Step 4: Get current by_municipality and total numbers
  const current = await pool.query(
    `SELECT network_bldgs, onsite_bldgs, nonnetwork_bldgs, total_bldgs, by_municipality::text
     FROM scenario_network_precomputed WHERE density_stop=3 AND gwd_stop=3 AND gwi_stop=3 AND fld_stop=3`
  );
  const cur = current.rows[0];
  console.log('\n=== CURRENT PRECOMPUTED VALUES ===');
  console.log('network_bldgs:', cur.network_bldgs);
  console.log('onsite_bldgs:', cur.onsite_bldgs);
  console.log('nonnetwork_bldgs:', cur.nonnetwork_bldgs);
  console.log('total_bldgs:', cur.total_bldgs);
  console.log('by_municipality:', cur.by_municipality);

  // Calculate new values
  const newNetwork = allCsvIds.length; // 5498
  const oldNetwork = cur.network_bldgs;
  const diff = oldNetwork - newNetwork; // Buildings moving FROM network
  // Those buildings go to nonnetwork
  const newNonnetwork = cur.nonnetwork_bldgs + diff;
  // Onsite stays the same (buffer zone is independent)
  const newOnsite = cur.onsite_bldgs;
  // Verify total
  const newTotal = newNetwork + newOnsite + newNonnetwork;

  console.log('\n=== NEW VALUES ===');
  console.log('network_bldgs:', newNetwork, '(was', oldNetwork, ')');
  console.log('onsite_bldgs:', newOnsite, '(unchanged)');
  console.log('nonnetwork_bldgs:', newNonnetwork, '(was', cur.nonnetwork_bldgs, ')');
  console.log('total_bldgs:', newTotal, '(should be', cur.total_bldgs, ')');

  // Build new by_municipality JSONB
  const curByMun = JSON.parse(cur.by_municipality);
  console.log('\nCurrent by_municipality:', JSON.stringify(curByMun, null, 2));

  // Update with exact CSV counts per municipality
  const csvByMun: Record<string, number> = {
    'Tagbilaran City': csvData.r1.length,  // 4738
    'Panglao': csvData.r2.length,           // 357
    'Dauis': csvData.r3.length,             // 403
  };

  // curByMun is an ARRAY of {mun, network, onsite, nonnetwork}
  for (const entry of curByMun) {
    const oldNet = entry.network;
    const newNet = csvByMun[entry.mun] ?? 0;
    const netDiff = oldNet - newNet;
    entry.network = newNet;
    entry.nonnetwork = (entry.nonnetwork || 0) + netDiff;
  }

  console.log('New by_municipality:', JSON.stringify(curByMun, null, 2));

  // Step 5: Apply the UPDATE
  console.log('\n=== APPLYING UPDATE ===');
  await pool.query(
    `UPDATE scenario_network_precomputed
     SET qualifying_gids = $1::jsonb,
         network_bldgs = $2,
         nonnetwork_bldgs = $3,
         by_municipality = $4::jsonb,
         grid_count = $5,
         computed_at = NOW()
     WHERE density_stop=3 AND gwd_stop=3 AND gwi_stop=3 AND fld_stop=3`,
    [
      JSON.stringify(gidsToKeep),
      newNetwork,
      newNonnetwork,
      JSON.stringify(curByMun),
      gidsToKeep.length
    ]
  );
  console.log('UPDATE applied successfully');

  // Step 6: Verify
  const verify = await pool.query(
    `SELECT qualifying_gids::text, network_bldgs, onsite_bldgs, nonnetwork_bldgs, total_bldgs, grid_count, by_municipality::text
     FROM scenario_network_precomputed WHERE density_stop=3 AND gwd_stop=3 AND gwi_stop=3 AND fld_stop=3`
  );
  const v = verify.rows[0];
  const vGids: number[] = JSON.parse(v.qualifying_gids);
  console.log('\n=== VERIFICATION ===');
  console.log('qualifying_gids count:', vGids.length);
  console.log('grid_count:', v.grid_count);
  console.log('network_bldgs:', v.network_bldgs);
  console.log('onsite_bldgs:', v.onsite_bldgs);
  console.log('nonnetwork_bldgs:', v.nonnetwork_bldgs);
  console.log('total_bldgs:', v.total_bldgs);
  console.log('by_municipality:', v.by_municipality);

  await pool.end();
})();
