/**
 * Utility to calculate infrastructure counts with ward filtering
 * and hazard exposure analysis
 */

import { calculateHazardExposure, type HazardExposure } from './hazardExposure';
import { fetchPublicAmenitiesCounts } from './publicAmenitiesData';
import { fetchTransportCounts } from './transportData';

// Note: Healthcare and Education now have their own fetch functions in their respective files
// This file now delegates to those functions for public amenities and transport

/**
 * Get counts of public amenities by type, optionally filtered by ward
 */
export async function getPublicAmenitiesCounts(selectedWardId?: string): Promise<Record<string, number>> {
  return await fetchPublicAmenitiesCounts(selectedWardId);
}

/**
 * Get total count of public amenities, optionally filtered by ward
 */
export async function getTotalPublicAmenitiesCount(selectedWardId?: string): Promise<number> {
  const counts = await fetchPublicAmenitiesCounts(selectedWardId);
  return Object.values(counts).reduce((sum, count) => sum + count, 0);
}

/**
 * Get counts of transport infrastructure by type, optionally filtered by ward
 */
export async function getTransportCounts(selectedWardId?: string): Promise<Record<string, number>> {
  return await fetchTransportCounts(selectedWardId);
}

/**
 * Get total count of transport infrastructure, optionally filtered by ward
 */
export async function getTotalTransportCount(selectedWardId?: string): Promise<number> {
  const counts = await fetchTransportCounts(selectedWardId);
  return Object.values(counts).reduce((sum, count) => sum + count, 0);
}

/**
 * Get hazard exposure for public amenities
 */
export async function getPublicAmenitiesHazardExposure(
  selectedWardId: string | null,
  hazardLayerId: string | null
): Promise<HazardExposure> {
  const total = await getTotalPublicAmenitiesCount(selectedWardId || undefined);
  return calculateHazardExposure(total, hazardLayerId, selectedWardId, 2002);
}

/**
 * Get hazard exposure for transport infrastructure
 */
export async function getTransportHazardExposure(
  selectedWardId: string | null,
  hazardLayerId: string | null
): Promise<HazardExposure> {
  const total = await getTotalTransportCount(selectedWardId || undefined);
  return calculateHazardExposure(total, hazardLayerId, selectedWardId, 3003);
}