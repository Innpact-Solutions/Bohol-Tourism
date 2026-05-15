// Tourism module — React context for data loading
// Loads all 5 tourism JSONs once on mount, exposes them to descendants.
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { ClusterFC, SiteFC, AssetFC, ClusterMembership, PhotoIndex } from './types';
import { TOURISM_PATHS } from '../config/tourismConfig';

interface TourismData {
  clusters:   ClusterFC | null;
  sites:      SiteFC | null;
  assets:     AssetFC | null;
  membership: ClusterMembership[] | null;
  photoIndex: PhotoIndex | null;
}

interface TourismContextValue extends TourismData {
  loading: boolean;
  error:   string | null;
  // Helpers
  getPhotosFor:    (uid: string | undefined) => string[];        // returns relative URLs
  getMembershipFor:(cluster_id: number) => ClusterMembership | undefined;
}

const TourismContext = createContext<TourismContextValue | null>(null);

export function TourismProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<TourismData>({
    clusters: null, sites: null, assets: null, membership: null, photoIndex: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [clusters, sites, assets, membership, photoIndex] = await Promise.all([
          fetch(TOURISM_PATHS.clusters).then(r => r.ok ? r.json() : Promise.reject(r.status)),
          fetch(TOURISM_PATHS.sites).then(r => r.ok ? r.json() : Promise.reject(r.status)),
          fetch(TOURISM_PATHS.assets).then(r => r.ok ? r.json() : Promise.reject(r.status)),
          fetch(TOURISM_PATHS.membership).then(r => r.ok ? r.json() : Promise.reject(r.status)),
          fetch(TOURISM_PATHS.photoIndex).then(r => r.ok ? r.json() : Promise.reject(r.status)),
        ]);
        if (cancelled) return;
        setData({ clusters, sites, assets, membership, photoIndex });
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(String(err));
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const getPhotosFor = (uid: string | undefined): string[] => {
    if (!uid || !data.photoIndex) return [];
    const entry = data.photoIndex[uid];
    if (!entry || !entry.photos) return [];
    return entry.photos.map(p => `${TOURISM_PATHS.photoBase}/${p.file}`);
  };

  const getMembershipFor = (id: number): ClusterMembership | undefined => {
    return data.membership?.find(m => m.cluster_id === id);
  };

  const value: TourismContextValue = {
    ...data, loading, error, getPhotosFor, getMembershipFor,
  };
  return <TourismContext.Provider value={value}>{children}</TourismContext.Provider>;
}

export function useTourismData(): TourismContextValue {
  const ctx = useContext(TourismContext);
  if (!ctx) throw new Error('useTourismData must be used inside TourismProvider');
  return ctx;
}
