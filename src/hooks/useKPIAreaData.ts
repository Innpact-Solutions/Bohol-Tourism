// React hook for KPI Area Data
import { useState, useEffect } from 'react';
import type { Sector, Scenario } from '../App';
import { fetchKPIAreaData, type KPIAreaResult } from '../utils/kpiAreaCalculation';

/**
 * Hook to fetch and manage KPI area data for the first KPI in each hazard section
 */
export function useKPIAreaData(
  sector: Sector,
  scenario: Scenario,
  selectedWardId?: string
): KPIAreaResult | null {
  const [data, setData] = useState<KPIAreaResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      // Clear stale data immediately when dependencies change
      if (isMounted) {
        setIsLoading(true);
        setData(null);
      }
      
      try {
        const result = await fetchKPIAreaData(sector, scenario, selectedWardId);
        if (isMounted) {
          setData(result);
        }
      } catch (error) {
        console.error('Error loading KPI area data:', error);
        if (isMounted) {
          setData(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [sector, scenario, selectedWardId]);

  return data;
}