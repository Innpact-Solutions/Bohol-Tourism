/**
 * IMD Heat Calendar API
 * Fetches daily heat intensity data for calendar visualization
 */

import { fetchWithTimeout } from './fetchWithTimeout';

const API_BASE_URL = 'https://geo-view-x-backend-0-1-gvdsbcb9d5cghqdw.centralindia-01.azurewebsites.net';

export interface IMDHeatCalendarDay {
  date: string; // ISO date format
  tmax_c: number | null;
  tmin_c: number | null;
  tmax_bin: number | null; // 1-5 intensity
  hw_flag: number; // 0 or 1 (heatwave flag)
  wn_flag: number; // 0 or 1 (warm night flag)
}

/**
 * Fetch IMD heat calendar data for a specific year and month
 * Returns array of daily data directly
 */
export async function fetchIMDHeatCalendar(
  year: number,
  month: number
): Promise<IMDHeatCalendarDay[]> {
  // Pad month with leading zero if needed (e.g., 5 -> "05")
  const monthStr = String(month).padStart(2, '0');
  const url = `${API_BASE_URL}/weather/imd/heat/calendar?year=${year}&month=${monthStr}`;
  
  console.log(`🗓️ [IMD-CALENDAR] Fetching calendar for year: ${year}, month: ${monthStr}`);
  
  // Create Basic Auth header (same as KPI endpoint)
  const credentials = btoa('admin:vYLnb)VEhhX7y8+Gbr+CnCUe');
  
  const response = await fetchWithTimeout(url, {
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    console.error(`❌ [IMD-CALENDAR] Failed to fetch: ${response.status} ${response.statusText}`);
    throw new Error(`Failed to fetch IMD heat calendar: ${response.statusText}`);
  }

  const data: IMDHeatCalendarDay[] = await response.json();
  console.log('✅ [IMD-CALENDAR] Data received:', data);
  console.log('✅ [IMD-CALENDAR] First item:', data[0]);
  console.log('✅ [IMD-CALENDAR] Array length:', data.length);
  
  return data;
}