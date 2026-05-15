// Tourism module — TypeScript type definitions
// All cluster / site / asset records as produced by the upstream QGIS pipeline.

export type ClusterTier = 'Primary' | 'Emerging' | 'Satellite';
export type SiteTier    = 'Anchor' | 'Secondary' | 'Supportive' | 'Minor' | 'Unrated' | 'Excluded';
export type AssetTier   = 'Premium' | 'Quality' | 'Standard' | 'Low' | 'Unrated';
export type LGU         = 'Tagbilaran City' | 'Dauis' | 'Panglao';

export type SiteCategory =
  | 'Beach'
  | 'Marine'
  | 'Nature / Viewpoint'
  | 'Heritage'
  | 'Faith'
  | 'Urban Park'
  | 'Other Attraction'
  | 'EXCLUDED';

export interface ClusterProps {
  cluster_id: number;
  name: string;
  tier: ClusterTier;
  lgu: LGU | string;
  n_anchor: number;
  n_sec: number;
  n_supp: number;
  n_prem: number;
  n_qual: number;
  area_km2: number;
  area_land?: number;
  area_water?: number;
  pct_water?: number;
  potential?: number;
  priority?: number;
  anchors_names?: string;
}

export interface SiteProps {
  uid: string;
  place_id?: string;
  name: string;
  category?: string;
  subcat?: string;
  site_cat: SiteCategory;
  perf_tier: SiteTier;
  perf_score?: number;
  rating?: number;
  n_ratings?: number;
  lgu: string;
  brgy?: string;
  vicinity?: string;
  phone?: string | null;
  website?: string | null;
  open_now?: string;
  gmap_url?: string;
}

export interface AssetProps {
  uid: string;
  place_id?: string;
  name: string;
  subcat?: string;
  asset_cat?: string;
  asset_tier: AssetTier;
  perf_score?: number;
  rating?: number;
  n_ratings?: number;
  lgu: string;
  brgy?: string;
  vicinity?: string;
  gmap_url?: string;
}

export interface BarangayOverlap {
  brgy: string;
  mun: string;
  pct: number;
  area_km2: number;
  pop_2024?: number | null;
}

export interface DestinationRef {
  name: string;
  cat: SiteCategory | string;
  score?: number;
  lgu: string;
}

export interface ClusterMembership {
  cluster_id: number;
  name: string;
  tier: ClusterTier;
  lgu: string;
  area_km2: number;
  area_total_km2?: number;
  area_land_km2?: number;
  area_water_km2?: number;
  pct_water?: number;
  potential_score?: number;
  priority_rank?: number;
  anchors:    DestinationRef[];
  secondary:  DestinationRef[];
  supportive: DestinationRef[];
  premium:    DestinationRef[];
  quality:    DestinationRef[];
  barangays?: BarangayOverlap[];
}

export interface PhotoEntry {
  file: string;
  attribution: string;
}
export interface PhotoIndexEntry {
  name: string;
  lgu: string;
  tier: string;
  photos: PhotoEntry[];
}
export type PhotoIndex = Record<string, PhotoIndexEntry>;

// GeoJSON-typed records --------------------------------------------------
import type { Feature, FeatureCollection, Polygon, MultiPolygon, Point } from 'geojson';

export type ClusterFeature = Feature<Polygon | MultiPolygon, ClusterProps>;
export type ClusterFC      = FeatureCollection<Polygon | MultiPolygon, ClusterProps>;
export type SiteFeature    = Feature<Point, SiteProps>;
export type SiteFC         = FeatureCollection<Point, SiteProps>;
export type AssetFeature   = Feature<Point, AssetProps>;
export type AssetFC        = FeatureCollection<Point, AssetProps>;
