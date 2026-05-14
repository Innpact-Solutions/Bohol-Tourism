// Context for preloading and managing all hazard area data
// Preloads KPI data for all sectors on app start for instant sector switching

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Sector, Scenario } from '../App';
import { fetchHazardArea, type HazardAreaResult } from '../utils/hazardAreaData';
import { preloadBuildingsData } from '../utils/buildingsCache';

interface HazardDataState {
  heat: HazardAreaResult | null;
  air: HazardAreaResult | null;
  flood: HazardAreaResult | null;
  multihazard: HazardAreaResult | null;
}

interface HazardDataContextValue {
  data: HazardDataState;
  isLoading: boolean;
  isInitialLoad: boolean;
  error: string | null;
  refreshData: (scenario: Scenario, selectedWardId?: string) => Promise<void>;
}

const HazardDataContext = createContext<HazardDataContextValue | null>(null);

interface HazardDataProviderProps {
  children: ReactNode;
  initialScenario: Scenario;
  selectedWardId?: string;
}

export function HazardDataProvider({ children, initialScenario, selectedWardId }: HazardDataProviderProps) {
  const [data, setData] = useState<HazardDataState>({
    heat: null,
    air: null,
    flood: null,
    multihazard: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentScenario, setCurrentScenario] = useState(initialScenario);
  const [currentWardId, setCurrentWardId] = useState(selectedWardId);

  // Fetch all sector data in parallel
  const loadAllData = async (scenario: Scenario, wardId?: string) => {
    console.log('🚀 [HAZARD DATA CONTEXT] Preloading all sector KPI data...');
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all 4 sectors in parallel
      const [heatData, airData, floodData, multihazardData] = await Promise.all([
        fetchHazardArea('heat', 'heat_hhi', scenario, wardId),
        fetchHazardArea('air', 'air_aqi', scenario, wardId),
        fetchHazardArea('flood', 'flood_fhi', scenario, wardId),
        fetchHazardArea('multihazard', 'multihazard_assessment', scenario, wardId),
      ]);

      console.log('✅ [HAZARD DATA CONTEXT] All sector data loaded:', {
        heat: heatData?.totalAreaKm2.toFixed(2) + ' km²',
        air: airData?.totalAreaKm2.toFixed(2) + ' km²',
        flood: floodData?.totalAreaKm2.toFixed(2) + ' km²',
        multihazard: multihazardData?.totalAreaKm2.toFixed(2) + ' km²',
      });

      setData({
        heat: heatData,
        air: airData,
        flood: floodData,
        multihazard: multihazardData,
      });
    } catch (err) {
      // Silently handle fetch errors - expected when backend is unavailable
      console.log('ℹ️  Hazard KPI data not available (backend not connected)');
      setError('Backend not connected');
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  };

  // Initial load on mount
  useEffect(() => {
    // Preload hazard data for all sectors
    loadAllData(currentScenario, currentWardId);
    
    // ALSO: Preload buildings data in parallel (non-blocking)
    // This ensures buildings are ready instantly when user zooms to level 14+
    preloadBuildingsData().catch(err => {
      console.warn('⚠️ Buildings preload failed, will load on-demand:', err);
    });
  }, []);

  // Refresh when scenario or ward changes
  const refreshData = async (scenario: Scenario, wardId?: string) => {
    if (scenario !== currentScenario || wardId !== currentWardId) {
      console.log('🔄 [HAZARD DATA CONTEXT] Scenario/ward changed, reloading data...');
      setCurrentScenario(scenario);
      setCurrentWardId(wardId);
      await loadAllData(scenario, wardId);
    }
  };

  return (
    <HazardDataContext.Provider value={{ data, isLoading, isInitialLoad, error, refreshData }}>
      {children}
    </HazardDataContext.Provider>
  );
}

export function useHazardData() {
  const context = useContext(HazardDataContext);
  if (!context) {
    throw new Error('useHazardData must be used within HazardDataProvider');
  }
  return context;
}

// Hook to get data for a specific sector
export function useHazardDataForSector(sector: Sector): HazardAreaResult | null {
  const { data, isLoading } = useHazardData();
  
  if (isLoading) {
    return null;
  }
  
  return data[sector];
}