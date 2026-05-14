import React from 'react';
import worldBankLogo from 'figma:asset/28a68ce6f762781887d81ef25d37ca6723765991.png';
import boholLogo from 'figma:asset/675d206072795155b568af95dfafe18a05d798b5.png';
import { useState, useEffect, useRef } from 'react';
import { Building2, MapPin, ChevronDown, Filter, GitCompare, Search, X } from 'lucide-react';
import { RoadNameFilter } from './RoadNameFilter';

interface HeaderProps {
  onReset: () => void;
  onQueryToggle?: () => void;
  isQueryActive?: boolean;
  onCompareToggle?: () => void;
  selectedWardId: string;
  onWardSelect: (wardId: string, wardName: string, munName?: string) => void;
  selectedLguId: string;
  onLguSelect: (lguId: string, lguName: string) => void;
  selectedRoadName: string;
  onRoadNameSelect: (roadName: string) => void;
  activeRoadSafetySubLayers: string[];
  onRoadZoom?: (bounds: [number, number, number, number]) => void;
  onResetView?: () => void;
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



export function Header({ onReset, onQueryToggle, isQueryActive, onCompareToggle, selectedWardId, onWardSelect, selectedLguId, onLguSelect, selectedRoadName, onRoadNameSelect, activeRoadSafetySubLayers, onRoadZoom, onResetView, isComparisonMode, onExitComparison, disableWardFilter, onLguZoom, onBarangayZoom, onInfoOpen, onTutorialOpen, showTutorialPulse }: HeaderProps) {
  const [wardFilterOpen, setWardFilterOpen] = useState(false);
  const [wards, setWards] = useState<Ward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [lguFilterOpen, setLguFilterOpen] = useState(false);
  const [lgus, setLgus] = useState<LGU[]>([]);
  const [isLguLoading, setIsLguLoading] = useState(true);
  const [lguSearchQuery, setLguSearchQuery] = useState('');
  
  const wardFilterRef = useRef<HTMLDivElement>(null);
  const lguFilterRef = useRef<HTMLDivElement>(null);
  
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
  }, [disableWardFilter, wardFilterOpen, lguFilterOpen]);

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
            <h1 className="text-base font-semibold text-[#0F172A] leading-tight">Decision Support Dashboard for Citywide Inclusive Sanitation (CWIS)</h1>
            <p className="text-xs text-[#64748B] mt-0.5">Tagbilaran City • Dauis • Panglao <span className="text-[#94A3B8]">[{(import.meta as any).env?.VITE_APP_VERSION ?? 'v0.20'}]</span></p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Road Name Filter Dropdown Widget - Only visible when iRAP layers are active */}
        <RoadNameFilter
          selectedRoadName={selectedRoadName}
          onRoadNameSelect={onRoadNameSelect}
          activeRoadSafetySubLayers={activeRoadSafetySubLayers}
          onRoadZoom={onRoadZoom}
          onResetView={onResetView}
        />

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
                  <span className="text-[10px] text-[#94A3B8]">
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
                      <p className="text-xs text-[#94A3B8]">No LGUs found</p>
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
                  <span className="text-[10px] text-[#94A3B8]">
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
                                <span className="text-[10px] text-[#94A3B8]">•</span>
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
                      <p className="text-xs text-[#94A3B8]">No barangays found</p>
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

        {/* Query Tool Button */}
        <button
          className="h-8 px-3 flex items-center justify-center gap-1.5 rounded-lg bg-[#1E293B] hover:bg-[#334155] text-white transition-all duration-200 shadow-sm border border-[#334155] group"
          title="Query Tool"
        >
          <Filter className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-white transition-colors" />
          <span className="text-xs font-medium text-[#E2E8F0]">Query Tool</span>
        </button>

        {/* Compare Button */}
        <button
          onClick={onCompareToggle}
          className="h-8 px-3 flex items-center justify-center gap-1.5 rounded-lg bg-[#1E293B] hover:bg-[#334155] text-white transition-all duration-200 shadow-sm border border-[#334155] group"
          title="Compare Layers"
        >
          <GitCompare className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-white transition-colors" />
          <span className="text-xs font-medium text-[#E2E8F0]">Compare</span>
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