import React from 'react';
import { Filter, X, RotateCcw, MapPin, Route, Car, AlertCircle } from 'lucide-react';
import { RoadSafetyFilters, RoadSafetyQueryFilters } from '../utils/roadSafetyAnalysis';

interface RoadSafetyFilterPanelProps {
  availableFilters: RoadSafetyFilters;
  appliedFilters: RoadSafetyQueryFilters;
  onFilterChange: (filterType: keyof RoadSafetyQueryFilters, value: string | null) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
  isLoading?: boolean;
}

const VEHICLE_TYPE_OPTIONS = [
  { value: 'vehicle', label: 'Vehicle Safety', icon: Car, description: '4-wheeled vehicles' },
  { value: 'motorcycle', label: 'Motorcycle Safety', icon: Car, description: '2-wheeled motorized' },
  { value: 'pedestrian', label: 'Pedestrian Safety', icon: Car, description: 'Walking safety' },
  { value: 'bicyclist', label: 'Bicyclist Safety', icon: Car, description: 'Cycling safety' }
];

export function RoadSafetyFilterPanel({
  availableFilters,
  appliedFilters,
  onFilterChange,
  onResetFilters,
  hasActiveFilters,
  isLoading = false
}: RoadSafetyFilterPanelProps) {
  
  // Helper to get ward display name
  const getWardDisplayName = (ward: string | null) => {
    if (!ward) return null;
    // Remove 'ward_' prefix if present
    const wardNumber = ward.replace('ward_', '');
    return `Ward ${wardNumber}`;
  };
  
  // Helper to get vehicle type display name
  const getVehicleTypeDisplayName = (vehicleType: string | null) => {
    if (!vehicleType) return null;
    const option = VEHICLE_TYPE_OPTIONS.find(opt => opt.value === vehicleType);
    return option?.label || vehicleType;
  };
  
  return null;
}