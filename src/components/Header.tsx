import React from 'react';
import worldBankLogo from 'figma:asset/28a68ce6f762781887d81ef25d37ca6723765991.png';
import boholLogo from 'figma:asset/675d206072795155b568af95dfafe18a05d798b5.png';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Building2, MapPin, ChevronDown, Search, X, Layers, HelpCircle } from 'lucide-react';
import { useTourismData } from '../tourism/TourismContext';
import { useTourismUI } from '../tourism/tourismStore';


interface HeaderProps {
  onReset: () => void;
  onQueryToggle?: () => void;
  isQueryActive?: boolean;
  onCompareToggle?: () => void;
  selectedWardId: string;
  onWardSelect: (wardId: string, wardName: string, munName?: string) => void;
  selectedLguId: string;
  onLguSelect: (lguId: string, lguName: string) => void;

  isComparisonMode?: boolean;
  onExitComparison?: () => void;
  disableWardFilter?: boolean; // Disable ward filtering when query panel is open
  onLguZoom?: (lguName: string) => void; // New: Handler to zoom to LGU extent
  onBarangayZoom?: (brgyId: string, barangayName: string) => void; // Updated: Pass BrgyID for unique identification
  onInfoOpen?: () => void; // New: Handler to open info modal
  onTutorialOpen?: () => void; // New: Handler to open tutorial
  showTutorialPulse?: boolean; // New: Show pulse animation on tutorial button
}

interface Ward {
  id: string;
  wardNumber: number;
  barangayName: string;
  zone: string;
  population: number;
  brgyId: string; // Add BrgyID for unique identification
}

interface LGU {
  id: string;
  name: string;
  barangayCount: number;
}



export function Header({ onReset, onQueryToggle, isQueryActive, onCompareToggle, selectedWardId, onWardSelect, selectedLguId, onLguSelect, isComparisonMode, onExitComparison, disableWardFilter, onLguZoom, onBarangayZoom, onInfoOpen, onTutorialOpen, showTutorialPulse }: HeaderProps) {
  const [wardFilterOpen, setWardFilterOpen] = useState(false);
  const [wards, setWards] = useState<Ward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [lguFilterOpen, setLguFilterOpen] = useState(false);
  const [lgus, setLgus] = useState<LGU[]>([]);
  const [isLguLoading, setIsLguLoading] = useState(true);
  const [lguSearchQuery, setLguSearchQuery] = useState('');

  // Tourism cluster filter (third dropdown alongside LGU / Barangay)
  const tourismData = useTourismData();
  const tourismUI = useTourismUI();
  const [clusterFilterOpen, setClusterFilterOpen] = useState(false);
  const [clusterSearchQuery, setClusterSearchQuery] = useState('');

  const wardFilterRef = useRef<HTMLDivElement>(null);
  const lguFilterRef = useRef<HTMLDivElement>(null);
  const clusterFilterRef = useRef<HTMLDivElement>(null);
  
  // Dummy user data - will be replaced with actual auth later
  const dummyUser = {
    name: 'John Santos',
    email: 'john.santos@worldbank.org',
    role: 'Project Manager',
    initials: 'JS'
  };

  // Fetch barangay data from GeoServer WFS
  useEffect(() => {
    const fetchWardData = async () => {
      try {
        const WFS_URL = 'https://geoserver.azure.innpact.ai/geoserver/WorldBank_Bohol/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=WorldBank_Bohol:Barangay_Boundary&outputFormat=application/json&srsName=EPSG:4326';
        
        const response = await fetch(WFS_URL);
        if (!response.ok) {
          throw new Error(`WFS request failed with status ${response.status}`);
        }
        
        const geojson = await response.json();
        
        if (geojson.features && geojson.features.length > 0) {
          // Parse barangay data from GeoJSON features
          const wardList: Ward[] = geojson.features
            .map((feature: any, index: number) => {
              const props = feature.properties;
              
              // Try to get ward number, or use index + 1 as synthetic ward number
              let wardNumber = props.Ward || props.WARD || props.ward || props.Ward_No || props.WARD_NO || props.ward_no || props.WardNo;
              if (!wardNumber || wardNumber === '' || wardNumber === null) {
                wardNumber = index + 1; // Use index as synthetic ward number
              }
              
              const barangayName = props.BrgyName || props.brgyname || props.BRGYNAME || props.Barangay_Name || props.Name || props.NAME || `Barangay ${wardNumber}`;
              const zone = props.MunName || props.MUNNAME || props.munname || props.Municipality || props.MUNICIPALITY || props.Zone || props.ZONE || props.zone || 'Unknown Municipality';
              const population = props.Pop_2024 || props.POP_2024 || props.pop_2024 || props.Pop_2011 || props.POP_2011 || props.pop_2011 || props.Population || props.POPULATION || 0;
              // Extract BrgyID - the unique identifier for each barangay (convert to string to ensure consistency)
              const brgyId = String(props.BrgyID || props.Brgy_ID || props.BRGYID || props.brgy_id || `${zone}_${barangayName}`.replace(/\s+/g, '_'));
              
              return {
                id: brgyId, // Use BrgyID as the unique identifier (always string)
                wardNumber: typeof wardNumber === 'number' ? wardNumber : parseInt(wardNumber),
                barangayName: barangayName,
                zone: zone,
                population: typeof population === 'string' ? parseInt(population.replace(/,/g, '')) : population,
                brgyId: brgyId // Store BrgyID for reference (always string)
              };
            })
            // DO NOT remove duplicates - show all barangays even if names are same across LGUs
            .sort((a: Ward, b: Ward) => {
              // Sort by zone (LGU) first, then by barangay name alphabetically
              if (a.zone !== b.zone) {
                return a.zone.localeCompare(b.zone);
              }
              return a.barangayName.localeCompare(b.barangayName);
            });
          
          setWards(wardList);
          console.log('✅ Loaded', wardList.length, 'barangays from GeoServer');
          console.log('📋 Barangay list:', wardList.map(w => w.barangayName));
          
          // Extract unique LGU names for LGU filter
          const lguMap = new Map<string, number>();
          geojson.features.forEach((feature: any) => {
            const props = feature.properties;
            const munName = props.MunName || props.MUNNAME || props.munname || props.Municipality || props.MUNICIPALITY || 'Unknown';
            if (munName && munName !== 'Unknown') {
              lguMap.set(munName, (lguMap.get(munName) || 0) + 1);
            }
          });
          
          // Convert to LGU array and sort
          const lguList: LGU[] = Array.from(lguMap.entries())
            .map(([name, count]) => ({
              id: name.toLowerCase().replace(/\s+/g, '_'),
              name: name,
              barangayCount: count
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
          
          setLgus(lguList);
          console.log('✅ Loaded', lguList.length, 'unique LGUs from GeoServer');
          console.log('📋 LGU list:', lguList.map(l => `${l.name} (${l.barangayCount} barangays)`));
        }
        
        setIsLoading(false);
        setIsLguLoading(false);
      } catch (error) {
        console.error('❌ Failed to fetch barangay data:', error);
        setIsLoading(false);
        setIsLguLoading(false);
      }
    };
    
    fetchWardData();
  }, []);

  const selectedWardData = wards.find(w => w.id === selectedWardId);
  const selectedLguData = lgus.find(l => l.id === selectedLguId);
  
  // Filter wards based on search query AND selected LGU
  const filteredWards = wards.filter(ward => {
    // Filter by LGU if one is selected
    const lguFilter = selectedLguId === 'all' || !selectedLguData
      ? true 
      : ward.zone === selectedLguData?.name;
    
    if (!lguFilter) {
      return false;
    }
    
    // Apply search filter
    const searchLower = searchQuery.toLowerCase();
    const wardNumberStr = ward.wardNumber.toString();
    const barangayName = ward.barangayName.toLowerCase();
    const zone = ward.zone.toLowerCase();
    
    return wardNumberStr.includes(searchLower) || barangayName.includes(searchLower) || zone.includes(searchLower);
  }).sort((a, b) => {
    // Sort by brgyId in ascending order (numeric comparison)
    const brgyIdA = parseInt(String(a.brgyId)) || 0;
    const brgyIdB = parseInt(String(b.brgyId)) || 0;
    return brgyIdA - brgyIdB;
  });
  
  // Create a map of brgyId to display number
  const brgyIdToNumber = new Map<string, number>();
  let counter = 1;
  filteredWards.forEach(ward => {
    brgyIdToNumber.set(String(ward.brgyId), counter++);
  });
  
  // Filter LGUs based on search query
  const filteredLgus = lgus.filter(lgu => {
    const searchLower = lguSearchQuery.toLowerCase();
    const lguName = lgu.name.toLowerCase();
    
    return lguName.includes(searchLower);
  });

  // Format population for display
  const formatPopulation = (pop: number) => {
    if (pop >= 1000000) {
      return `${(pop / 1000000).toFixed(1)}M`;
    } else if (pop >= 1000) {
      return `${(pop / 1000).toFixed(1)}K`;
    }
    return pop.toString();
  };

  // Close barangay dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wardFilterRef.current && !wardFilterRef.current.contains(event.target as Node)) {
        setWardFilterOpen(false);
      }
      if (lguFilterRef.current && !lguFilterRef.current.contains(event.target as Node)) {
        setLguFilterOpen(false);
      }
      if (clusterFilterRef.current && !clusterFilterRef.current.contains(event.target as Node)) {
        setClusterFilterOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close barangay dropdown when query panel is opened
  useEffect(() => {
    if (disableWardFilter && wardFilterOpen) {
      setWardFilterOpen(false);
    }
    if (disableWardFilter && lguFilterOpen) {
      setLguFilterOpen(false);
    }
    if (disableWardFilter && clusterFilterOpen) {
      setClusterFilterOpen(false);
    }
  }, [disableWardFilter, wardFilterOpen, lguFilterOpen, clusterFilterOpen]);

  // Build sorted cluster list from tourism data (Primary -> Emerging -> Satellite, then name)
  const clusterList = useMemo(() => {
    const feats: any[] = tourismData?.clusters?.features ?? [];
    const tierOrder: Record<string, number> = { Primary: 0, Emerging: 1, Satellite: 2 };
    return feats
      .map((f: any) => f?.properties)
      .filter((p: any) => p && typeof p.cluster_id === 'number')
      .map((p: any) => ({
        id: p.cluster_id as number,
        name: String(p.name ?? `Cluster ${p.cluster_id}`),
        tier: String(p.tier ?? ''),
        lgu: String(p.lgu ?? ''),
      }))
      .sort((a, b) => {
        const ta = tierOrder[a.tier] ?? 9;
        const tb = tierOrder[b.tier] ?? 9;
        if (ta !== tb) return ta - tb;
        return a.name.localeCompare(b.name);
      });
  }, [tourismData?.clusters]);

  const allClusterIds = useMemo(() => clusterList.map(c => c.id), [clusterList]);
  const selectedSet = tourismUI.selectedClusterIds;
  const allClustersSelected = selectedSet.size === 0 || selectedSet.size === allClusterIds.length;
  const singleClusterSelected = selectedSet.size === 1
    ? clusterList.find(c => selectedSet.has(c.id)) ?? null
    : null;

  const clusterLabel = allClustersSelected
    ? 'Select Cluster'
    : singleClusterSelected
      ? singleClusterSelected.name
      : `${selectedSet.size} clusters`;

  const filteredClusters = clusterList.filter(c => {
    const q = clusterSearchQuery.trim().toLowerCase();
    if (!q) return true;
    return c.name.toLowerCase().includes(q)
      || c.tier.toLowerCase().includes(q)
      || c.lgu.toLowerCase().includes(q);
  });

  const handleClusterSelect = (id: number) => {
    // Single-select: replace the cluster set with just this id and set detail focus
    tourismUI.setClusterMultiSelect([id]);
    tourismUI.setSelectedClusterId(id);
    // Cluster scope overrides admin filters
    if (selectedLguId !== 'all') onLguSelect('all', 'all');
    if (selectedWardId !== 'all') onWardSelect('all', 'all');
    setClusterFilterOpen(false);
    setClusterSearchQuery('');
    // Zoom the map to the cluster
    window.dispatchEvent(new CustomEvent('tourism:fly-to-cluster', { detail: { cluster_id: id } }));
  };

  const handleClusterClear = () => {
    // Restore default — all clusters selected, no detail focus
    tourismUI.setClusterMultiSelect(allClusterIds);
    tourismUI.setSelectedClusterId(null);
    setClusterSearchQuery('');
  };

  const tierBadgeColor = (tier: string) => {
    if (tier === 'Primary') return 'bg-[#EDE9FE] text-[#6D28D9]';
    if (tier === 'Emerging') return 'bg-[#DBEAFE] text-[#1D4ED8]';
    if (tier === 'Satellite') return 'bg-[#F1F5F9] text-[#475569]';
    return 'bg-[#F1F5F9] text-[#475569]';
  };

  return (
    <header className="h-12 bg-white border-b border-[#E5E7EB] pl-2 pr-4 flex items-center justify-between flex-shrink-0 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          {/* World Bank Logo - Clickable */}
          <a 
            href="https://www.worldbank.org/ext/en/home" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center"
          >
            <img 
              src={worldBankLogo} 
              alt="World Bank Group" 
              className="h-7 w-auto object-contain m-0 p-0 hover:opacity-80 transition-opacity cursor-pointer"
            />
          </a>
          
          {/* Divider */}
          <div className="w-px h-6 bg-[#E5E7EB]" />
          
          <div>
            <h1 className="text-base font-semibold text-[#0F172A] leading-tight">Tourism Potential & Development Insights Dashboard</h1>
            <p className="text-xs text-[#64748B] mt-0.5">Tagbilaran City • Dauis • Panglao</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3" data-guide="area-filters">

        {/* LGU (Local Government Unit) Filter Dropdown Widget */}
        <div className="flex items-center gap-1">
          <div className="relative" ref={lguFilterRef}>
            <button
              onClick={() => {
                if (disableWardFilter) return;
                setLguFilterOpen(!lguFilterOpen);
              }}
              disabled={disableWardFilter}
              className={`h-8 pl-3 pr-2 bg-white border rounded-lg transition-all duration-200 flex items-center gap-2 ${
                disableWardFilter
                  ? 'border-gray-200 opacity-50 cursor-not-allowed'
                  : 'border-[#E5E7EB] hover:border-[#10B981] focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981]'
              }`}
              title={disableWardFilter ? 'LGU filtering is disabled when Query Tool is active' : 'Select Local Government Unit'}
            >
              <Building2 className={`w-3.5 h-3.5 flex-shrink-0 ${disableWardFilter ? 'text-gray-400' : 'text-[#10B981]'}`} />
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-[#0F172A]">
                  {selectedLguData 
                    ? (selectedLguData.id === 'all' ? 'Select LGU' : selectedLguData.name)
                    : (isLguLoading ? 'Loading...' : 'Select LGU')}
                </span>
                {selectedLguData && selectedLguData.id !== 'all' && (
                  <span className="text-[10px] text-[#64748B]">
                    ({selectedLguData.barangayCount} barangays)
                  </span>
                )}
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-[#6B7280] transition-transform duration-200 ${lguFilterOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* LGU Dropdown Menu */}
            {lguFilterOpen && (
              <div className="absolute top-full right-0 mt-1 w-72 bg-white border border-[#E5E7EB] rounded-lg shadow-xl z-50 overflow-hidden">
                {/* Search inside dropdown */}
                <div className="p-2 border-b border-[#E5E7EB] bg-[#F8FAFC]">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Filter LGUs..."
                      value={lguSearchQuery}
                      onChange={(e) => setLguSearchQuery(e.target.value)}
                      autoComplete="off"
                      onFocus={(e) => {
                        e.preventDefault();
                        e.target.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
                      }}
                      className="w-full h-7 pl-7 pr-2 border border-[#E5E7EB] rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-[#10B981] focus:border-[#10B981] bg-white"
                    />
                    <Search className="w-3 h-3 text-[#6B7280] absolute left-2 top-2" />
                  </div>
                </div>

                {/* LGU List */}
                <div className="max-h-64 overflow-y-auto">
                  {filteredLgus.length > 0 ? (
                    filteredLgus.map((lgu) => (
                      <button
                        key={lgu.id}
                        onClick={() => {
                          console.log('🏛️ Header: LGU selected:', lgu.id, 'Name:', lgu.name);
                          onLguSelect(lgu.id, lgu.name);
                          setLguFilterOpen(false);
                          setLguSearchQuery('');
                          if (onLguZoom) {
                            onLguZoom(lgu.name);
                          }
                        }}
                        className={`w-full text-left px-3 py-2 transition-colors duration-150 border-b border-[#F1F5F9] last:border-b-0 ${
                          selectedLguId === lgu.id
                            ? 'bg-gradient-to-r from-[#ECFDF5] to-[#D1FAE5] border-l-2 border-l-[#10B981]'
                            : 'hover:bg-[#F8FAFC]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className={`text-xs font-medium mb-0.5 ${
                              selectedLguId === lgu.id ? 'text-[#10B981]' : 'text-[#0F172A]'
                            }`}>
                              {lgu.name}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-[#6B7280]">{lgu.barangayCount} barangays</span>
                            </div>
                          </div>
                          {selectedLguId === lgu.id && (
                            <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] ml-2" />
                          )}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-6 text-center">
                      <p className="text-xs text-[#64748B]">No LGUs found</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Clear Filter Button - Only show when a specific LGU is selected */}
          {selectedLguId !== 'all' && (
            <button
              onClick={() => {
                onLguSelect('all', 'all');
                onWardSelect('all', 'all');
                setLguSearchQuery('');
                setSearchQuery('');
              }}
              className="h-8 w-8 flex items-center justify-center rounded-lg bg-[#FEE2E2] hover:bg-[#FEF2F2] text-[#DC2626] transition-colors group"
              title="Clear LGU filter"
            >
              <X className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>

        {/* Barangay Filter Dropdown Widget */}
        <div className="flex items-center gap-1">
          <div className="relative" ref={wardFilterRef}>
            <button
              onClick={() => {
                if (disableWardFilter) return;
                setWardFilterOpen(!wardFilterOpen);
              }}
              disabled={disableWardFilter}
              className={`h-8 pl-3 pr-2 bg-white border rounded-lg transition-all duration-200 flex items-center gap-2 ${
                disableWardFilter
                  ? 'border-gray-200 opacity-50 cursor-not-allowed'
                  : 'border-[#E5E7EB] hover:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]'
              }`}
              title={disableWardFilter ? 'Barangay filtering is disabled when Query Tool is active' : 'Select Barangay'}
            >
              <MapPin className={`w-3.5 h-3.5 flex-shrink-0 ${disableWardFilter ? 'text-gray-400' : 'text-[#2563EB]'}`} />
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-[#0F172A]">
                  {selectedWardData 
                    ? (selectedWardData.wardNumber === 0 ? 'Select Barangay' : selectedWardData.barangayName)
                    : (isLoading ? 'Loading...' : 'Select Barangay')}
                </span>
                {selectedWardData && selectedWardData.wardNumber !== 0 && (
                  <span className="text-[10px] text-[#64748B]">
                    ({formatPopulation(selectedWardData.population)})
                  </span>
                )}
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-[#6B7280] transition-transform duration-200 ${wardFilterOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Barangay Dropdown Menu */}
            {wardFilterOpen && (
              <div className="absolute top-full right-0 mt-1 w-80 bg-white border border-[#E5E7EB] rounded-lg shadow-xl z-50 overflow-hidden">
                {/* Search inside dropdown */}
                <div className="p-2 border-b border-[#E5E7EB] bg-[#F8FAFC]">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Filter barangays, zones..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoComplete="off"
                      onFocus={(e) => {
                        e.preventDefault();
                        e.target.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
                      }}
                      className="w-full h-7 pl-7 pr-2 border border-[#E5E7EB] rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB] bg-white"
                    />
                    <Search className="w-3 h-3 text-[#6B7280] absolute left-2 top-2" />
                  </div>
                </div>

                {/* Barangay List */}
                <div className="max-h-64 overflow-y-auto">
                  {filteredWards.length > 0 ? (
                    filteredWards.map((ward) => {
                      const displayNumber = brgyIdToNumber.get(String(ward.brgyId));
                      return (
                        <button
                          key={ward.id}
                          onClick={() => {
                            console.log('📍 Header: Barangay selected:', ward.id, 'Name:', ward.barangayName, 'BrgyID:', ward.brgyId);
                            // Note: We intentionally do NOT call onLguSelect here. The
                            // App-level onWardSelect handler will auto-apply the matching
                            // LGU filter using the `munName` argument (ward.zone), and
                            // it tracks whether the LGU was user-set vs. auto-set so that
                            // clearing the barangay can restore the original state.
                            onWardSelect(ward.id, ward.barangayName, ward.zone);
                            setWardFilterOpen(false);
                            setSearchQuery('');
                            if (onBarangayZoom) {
                              onBarangayZoom(ward.brgyId, ward.barangayName);
                            }
                          }}
                          className={`w-full text-left px-3 py-2 transition-colors duration-150 border-b border-[#F1F5F9] last:border-b-0 ${
                            selectedWardId === ward.id
                              ? 'bg-gradient-to-r from-[#EFF6FF] to-[#DBEAFE] border-l-2 border-l-[#2563EB]'
                              : 'hover:bg-[#F8FAFC]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className={`text-xs font-medium mb-0.5 ${
                                selectedWardId === ward.id ? 'text-[#2563EB]' : 'text-[#0F172A]'
                              }`}>
                                {ward.wardNumber === 0 
                                  ? 'All Barangays' 
                                  : displayNumber 
                                    ? `${displayNumber}. ${ward.barangayName}` 
                                    : ward.barangayName
                                }
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-[#6B7280]">{ward.zone}</span>
                                <span className="text-[10px] text-[#64748B]">•</span>
                                <span className="text-[10px] text-[#6B7280]">Pop: {formatPopulation(ward.population)}</span>
                              </div>
                            </div>
                            {selectedWardId === ward.id && (
                              <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB] ml-2" />
                            )}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-3 py-6 text-center">
                      <p className="text-xs text-[#64748B]">No barangays found</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Clear Filter Button - Only show when a specific ward is selected */}
          {selectedWardId !== 'all' && (
            <button
              onClick={() => {
                onWardSelect('all', 'all');
                setSearchQuery('');
              }}
              className="h-8 w-8 flex items-center justify-center rounded-lg bg-[#FEE2E2] hover:bg-[#FEF2F2] text-[#DC2626] transition-colors group"
              title="Clear barangay filter"
            >
              <X className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>

        {/* Tourism Cluster Filter Dropdown Widget */}
        <div className="flex items-center gap-1">
          <div className="relative" ref={clusterFilterRef}>
            <button
              onClick={() => {
                if (disableWardFilter) return;
                setClusterFilterOpen(!clusterFilterOpen);
              }}
              disabled={disableWardFilter}
              className={`h-8 pl-3 pr-2 bg-white border rounded-lg transition-all duration-200 flex items-center gap-2 ${
                disableWardFilter
                  ? 'border-gray-200 opacity-50 cursor-not-allowed'
                  : 'border-[#E5E7EB] hover:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6]'
              }`}
              title={disableWardFilter ? 'Cluster filtering is disabled when Query Tool is active' : 'Select Tourism Cluster'}
            >
              <Layers className={`w-3.5 h-3.5 flex-shrink-0 ${disableWardFilter ? 'text-gray-400' : 'text-[#8B5CF6]'}`} />
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-[#0F172A]">
                  {clusterList.length === 0 ? 'Loading...' : clusterLabel}
                </span>
                {singleClusterSelected && (
                  <span className="text-[10px] text-[#64748B]">
                    ({singleClusterSelected.tier})
                  </span>
                )}
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-[#6B7280] transition-transform duration-200 ${clusterFilterOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Cluster Dropdown Menu */}
            {clusterFilterOpen && (
              <div className="absolute top-full right-0 mt-1 w-80 bg-white border border-[#E5E7EB] rounded-lg shadow-xl z-50 overflow-hidden">
                {/* Search inside dropdown */}
                <div className="p-2 border-b border-[#E5E7EB] bg-[#F8FAFC]">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Filter clusters by name, tier, LGU..."
                      value={clusterSearchQuery}
                      onChange={(e) => setClusterSearchQuery(e.target.value)}
                      autoComplete="off"
                      onFocus={(e) => {
                        e.preventDefault();
                        e.target.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
                      }}
                      className="w-full h-7 pl-7 pr-2 border border-[#E5E7EB] rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-[#8B5CF6] focus:border-[#8B5CF6] bg-white"
                    />
                    <Search className="w-3 h-3 text-[#6B7280] absolute left-2 top-2" />
                  </div>
                </div>

                {/* "All Clusters" reset row */}
                <button
                  onClick={() => {
                    handleClusterClear();
                    setClusterFilterOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 transition-colors duration-150 border-b border-[#F1F5F9] ${
                    allClustersSelected
                      ? 'bg-gradient-to-r from-[#F5F3FF] to-[#EDE9FE] border-l-2 border-l-[#8B5CF6]'
                      : 'hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`text-xs font-medium ${allClustersSelected ? 'text-[#6D28D9]' : 'text-[#0F172A]'}`}>
                      All Clusters
                    </div>
                    {allClustersSelected && <div className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />}
                  </div>
                </button>

                {/* Cluster List */}
                <div className="max-h-64 overflow-y-auto">
                  {filteredClusters.length > 0 ? (
                    filteredClusters.map((c) => {
                      const isSelected = singleClusterSelected?.id === c.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => handleClusterSelect(c.id)}
                          className={`w-full text-left px-3 py-2 transition-colors duration-150 border-b border-[#F1F5F9] last:border-b-0 ${
                            isSelected
                              ? 'bg-gradient-to-r from-[#F5F3FF] to-[#EDE9FE] border-l-2 border-l-[#8B5CF6]'
                              : 'hover:bg-[#F8FAFC]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className={`text-xs font-medium mb-0.5 truncate ${
                                isSelected ? 'text-[#6D28D9]' : 'text-[#0F172A]'
                              }`}>
                                {c.name}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${tierBadgeColor(c.tier)}`}>
                                  {c.tier || '—'}
                                </span>
                                {c.lgu && (
                                  <span className="text-[10px] text-[#6B7280] truncate">{c.lgu}</span>
                                )}
                              </div>
                            </div>
                            {isSelected && (
                              <div className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] ml-2 flex-shrink-0" />
                            )}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-3 py-6 text-center">
                      <p className="text-xs text-[#64748B]">No clusters found</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Clear Filter Button - Only show when not in default (all-selected) state */}
          {!allClustersSelected && (
            <button
              onClick={handleClusterClear}
              className="h-8 w-8 flex items-center justify-center rounded-lg bg-[#FEE2E2] hover:bg-[#FEF2F2] text-[#DC2626] transition-colors group"
              title="Clear cluster filter"
            >
              <X className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>

        {/* Guide button — opens the onboarding tour */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('bohol-guide:open'))}
          className="h-8 px-2.5 flex items-center gap-1.5 rounded-lg bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
          title="Open dashboard guide"
        >
          <HelpCircle className="w-3.5 h-3.5 text-[#2563EB]" strokeWidth={2.25} />
          <span className="text-xs font-medium">Guide</span>
        </button>

        {/* Exit Comparison Button - Only in comparison mode */}
        {isComparisonMode && onExitComparison && (
          <button
            onClick={onExitComparison}
            className="h-8 px-4 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#E3000F] to-[#B8000C] hover:from-[#B8000C] hover:to-[#8B0009] text-white transition-all duration-200 shadow-sm hover:shadow-md group"
            title="Exit Comparison Mode"
          >
            <X className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium">Exit Comparison</span>
          </button>
        )}

        {/* Bohol Logo - Link to PPDO website */}
        <a 
          href="https://ppdo.bohol.gov.ph/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center ml-2"
          title="Visit PPDO Bohol website"
        >
          <img 
            src={boholLogo} 
            alt="Province of Bohol Official Seal" 
            className="h-9 w-9 object-contain m-0 p-0 hover:opacity-80 transition-opacity cursor-pointer"
          />
        </a>
      </div>
    </header>
  );
}