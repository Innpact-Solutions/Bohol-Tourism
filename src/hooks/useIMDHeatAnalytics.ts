import { useState, useEffect } from 'react';

interface IMDHeatAnalyticsData {
  total_heatwave_days: number;
  severe_heatwave_days: number;
  longest_heatwave_spell_days: number;
  longest_spell_start: string;
  longest_spell_end: string;
  total_warm_nights: number;
}

interface UseIMDHeatAnalyticsResult {
  data: IMDHeatAnalyticsData | null;
  loading: boolean;
  error: string | null;
}

const DEFAULT_DATA: IMDHeatAnalyticsData = {
  total_heatwave_days: 0,
  severe_heatwave_days: 0,
  longest_heatwave_spell_days: 0,
  longest_spell_start: '',
  longest_spell_end: '',
  total_warm_nights: 0
};

export function useIMDHeatAnalytics(year: number): UseIMDHeatAnalyticsResult {
  const [data, setData] = useState<IMDHeatAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log(`🌡️ [IMD-HEAT] Fetching analytics for year: ${year}`);
        
        const url = `https://geo-view-x-backend-0-1-gvdsbcb9d5cghqdw.centralindia-01.azurewebsites.net/weather/imd/heat/kpis?year=${year}`;
        
        // Create Basic Auth header
        const credentials = btoa('admin:vYLnb)VEhhX7y8+Gbr+CnCUe');
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 404) {
            console.warn(`⚠️ [IMD-HEAT] No data found for year ${year} - using default values`);
            setData(DEFAULT_DATA);
            setLoading(false);
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ [IMD-HEAT] Data received:', result);
        
        setData(result);
      } catch (err) {
        console.error('❌ [IMD-HEAT] Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Set default data on error
        setData(DEFAULT_DATA);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [year]);

  return { data, loading, error };
}
