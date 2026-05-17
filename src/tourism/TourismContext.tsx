// Tourism module — React context for data loading
// Loads all 5 tourism JSONs once on mount, exposes them to descendants.
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { ClusterFC, SiteFC, AssetFC, ClusterMembership, PhotoIndex, BookingAccommodationFC, BookingPhotoIndex } from './types';
import { TOURISM_PATHS } from '../config/tourismConfig';

interface TourismData {
  clusters:   ClusterFC | null;
  sites:      SiteFC | null;
  assets:     AssetFC | null;
  membership: ClusterMembership[] | null;
  photoIndex: PhotoIndex | null;
  assetPhotoIndex: PhotoIndex | null;
  accommodationsBooking: BookingAccommodationFC | null;
  bookingPhotoIndex: BookingPhotoIndex | null;
}

interface TourismContextValue extends TourismData {
  loading: boolean;
  error:   string | null;
  // Helpers
  getPhotosFor:      (uid: string | undefined) => string[];       // site photos (local)
  getAssetPhotosFor: (uid: string | undefined) => string[];       // hotel/asset photos (Google Places, local)
  getBookingPhotosFor: (bk_id: string | undefined) => string[];   // booking accommodation photos
  getMembershipFor:  (cluster_id: number) => ClusterMembership | undefined;
}

const TourismContext = createContext<TourismContextValue | null>(null);

export function TourismProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<TourismData>({
    clusters: null, sites: null, assets: null, membership: null, photoIndex: null, assetPhotoIndex: null,
    accommodationsBooking: null, bookingPhotoIndex: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [clusters, sites, assets, membership, photoIndex, assetPhotoIndex, accommodationsBooking, bookingPhotoIndex] = await Promise.all([
          fetch(TOURISM_PATHS.clusters).then(r => r.ok ? r.json() : Promise.reject(r.status)),
          fetch(TOURISM_PATHS.sites).then(r => r.ok ? r.json() : Promise.reject(r.status)),
          fetch(TOURISM_PATHS.assets).then(r => r.ok ? r.json() : Promise.reject(r.status)),
          fetch(TOURISM_PATHS.membership).then(r => r.ok ? r.json() : Promise.reject(r.status)),
          fetch(TOURISM_PATHS.photoIndex).then(r => r.ok ? r.json() : Promise.reject(r.status)),
          // Asset photo index is optional — empty object if file missing so the
          // app still loads in older builds before the backfill ran.
          fetch(TOURISM_PATHS.assetPhotoIndex).then(r => r.ok ? r.json() : {}).catch(() => ({})),
          // Booking.com accommodations — optional, graceful fallback.
          fetch(TOURISM_PATHS.accommodationsBooking).then(r => r.ok ? r.json() : null).catch(() => null),
          fetch(TOURISM_PATHS.accommodationBookingPhotoIndex).then(r => r.ok ? r.json() : {}).catch(() => ({})),
        ]);
        if (cancelled) return;
        // Restrict tourism sites to the 66 ranked attractions (Anchor / Secondary / Supportive).
        // Lower-rated entries (Minor, Unrated, Excluded) are dropped here so they
        // don't appear in cluster bubbles, lists, or counts anywhere downstream.
        const RANKED_TIERS = new Set(['Anchor', 'Secondary', 'Supportive']);
        const filteredSites = sites && Array.isArray(sites.features)
          ? { ...sites, features: sites.features.filter((f: any) => RANKED_TIERS.has(f?.properties?.perf_tier)) }
          : sites;
        setData({ clusters, sites: filteredSites, assets, membership, photoIndex, assetPhotoIndex, accommodationsBooking, bookingPhotoIndex });
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

  const getAssetPhotosFor = (uid: string | undefined): string[] => {
    if (!uid || !data.assetPhotoIndex) return [];
    const entry = data.assetPhotoIndex[uid];
    if (!entry || !entry.photos) return [];
    return entry.photos.map(p => `${TOURISM_PATHS.assetPhotoBase}/${p.file}`);
  };

  const getBookingPhotosFor = (bk_id: string | undefined): string[] => {
    if (!bk_id || !data.bookingPhotoIndex) return [];
    const entry = (data.bookingPhotoIndex as any)[bk_id];
    if (!entry || !entry.photos) return [];
    return entry.photos.map((p: any) => `${TOURISM_PATHS.accommodationBookingPhotoBase}/${p.file}`);
  };

  const getMembershipFor = (id: number): ClusterMembership | undefined => {
    return data.membership?.find(m => m.cluster_id === id);
  };

  const value: TourismContextValue = {
    ...data, loading, error, getPhotosFor, getAssetPhotosFor, getBookingPhotosFor, getMembershipFor,
  };
  return <TourismContext.Provider value={value}>{children}</TourismContext.Provider>;
}

export function useTourismData(): TourismContextValue {
  const ctx = useContext(TourismContext);
  if (!ctx) throw new Error('useTourismData must be used inside TourismProvider');
  return ctx;
}
