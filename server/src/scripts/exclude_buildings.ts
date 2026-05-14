import pool from '../db/pool';
import * as fs from 'fs';

(async () => {
  const excludedIds: number[] = JSON.parse(fs.readFileSync('/tmp/excluded_ids.json','utf-8'));
  console.log('Excluded IDs to remove from network:', excludedIds.length);

  // Verify these are in the R1 CSV list
  const csvData = JSON.parse(fs.readFileSync('/tmp/csv_ids.json','utf-8'));
  const r1Ids: number[] = csvData.r1;
  const r1Set = new Set(r1Ids);
  const inR1 = excludedIds.filter(id => r1Set.has(id));
  const notInR1 = excludedIds.filter(id => !r1Set.has(id));
  console.log('In R1 CSV:', inR1.length, '| Not in R1 CSV:', notInR1.length);
  if (notInR1.length > 0) console.log('IDs not in R1:', notInR1.slice(0, 10));

  // Get current precomputed values
  const pre = await pool.query(
    `SELECT network_bldgs, onsite_bldgs, nonnetwork_bldgs, total_bldgs, by_municipality::text
     FROM scenario_network_precomputed WHERE density_stop=3 AND gwd_stop=3 AND gwi_stop=3 AND fld_stop=3`
  );
  const cur = pre.rows[0];
  const curByMun = JSON.parse(cur.by_municipality);

  console.log('\nCurrent: net=' + cur.network_bldgs + ' on=' + cur.onsite_bldgs + ' non=' + cur.nonnetwork_bldgs);

  // New counts: move excluded from network to nonnetwork
  const newNetwork = cur.network_bldgs - excludedIds.length;
  const newNonnetwork = cur.nonnetwork_bldgs + excludedIds.length;
  console.log('New:     net=' + newNetwork + ' on=' + cur.onsite_bldgs + ' non=' + newNonnetwork);
  console.log('Total check:', newNetwork + cur.onsite_bldgs + newNonnetwork, '==', cur.total_bldgs);

  // Update Tagbilaran City in by_municipality
  for (const entry of curByMun) {
    if (entry.mun === 'Tagbilaran City') {
      console.log('\nTagbilaran before: net=' + entry.network + ' non=' + entry.nonnetwork);
      entry.network -= excludedIds.length;
      entry.nonnetwork += excludedIds.length;
      console.log('Tagbilaran after:  net=' + entry.network + ' non=' + entry.nonnetwork);
    }
  }

  // Apply update
  await pool.query(
    `UPDATE scenario_network_precomputed
     SET network_bldgs = $1,
         nonnetwork_bldgs = $2,
         by_municipality = $3::jsonb,
         computed_at = NOW()
     WHERE density_stop=3 AND gwd_stop=3 AND gwi_stop=3 AND fld_stop=3`,
    [newNetwork, newNonnetwork, JSON.stringify(curByMun)]
  );
  console.log('\nUPDATE applied');

  // Verify
  const v = await pool.query(
    `SELECT network_bldgs, onsite_bldgs, nonnetwork_bldgs, total_bldgs, by_municipality::text
     FROM scenario_network_precomputed WHERE density_stop=3 AND gwd_stop=3 AND gwi_stop=3 AND fld_stop=3`
  );
  const vr = v.rows[0];
  const vbm = JSON.parse(vr.by_municipality);
  console.log('\n=== VERIFIED (3,3,3,3) ===');
  console.log('Network:', vr.network_bldgs, '| Onsite:', vr.onsite_bldgs, '| Non-network:', vr.nonnetwork_bldgs);
  console.log('Sum:', vr.network_bldgs + vr.onsite_bldgs + vr.nonnetwork_bldgs, '| Total:', vr.total_bldgs);
  for (const m of vbm) {
    console.log(m.mun + ': net=' + m.network + ' on=' + m.onsite + ' non=' + m.nonnetwork + ' sum=' + (m.network+m.onsite+m.nonnetwork));
  }

  await pool.end();
})();
