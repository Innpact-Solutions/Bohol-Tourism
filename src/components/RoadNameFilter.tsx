import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, Route, X } from 'lucide-react';

interface RoadNameFilterProps {
  selectedRoadName: string;
  onRoadNameSelect: (roadName: string) => void;
  activeRoadSafetySubLayers: string[];
  onRoadZoom?: (bounds: [number, number, number, number]) => void;
  onResetView?: () => void;
}

interface RoadNameData {
  roadName: string;
  count: number;
}

export function RoadNameFilter({ selectedRoadName, onRoadNameSelect, activeRoadSafetySubLayers, onRoadZoom, onResetView }: RoadNameFilterProps) {
  const [roadFilterOpen, setRoadFilterOpen] = useState(false);
  const [roadNames, setRoadNames] = useState<RoadNameData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const roadFilterRef = useRef<HTMLDivElement>(null);

  // Function to fetch and zoom to road bounds
  const handleRoadSelection = async (roadName: string) => {
    console.log('🛣️ Road selected:', roadName);
    onRoadNameSelect(roadName);
    setRoadFilterOpen(false);
    setSearchQuery('');
    
    // Don't zoom for "all" roads option
    if (roadName === 'all' || !onRoadZoom) {
      return;
    }
    
    // ⚠️ DEPRECATED: Old GIZ_BBSR:Road_Safety layer removed
    // Road Safety layer disabled for Bohol
    console.log('ℹ️ Road Safety layer not available for Bohol. Feature disabled.');
    return;
    
    // OLD CODE (GIZ_BBSR reference removed):
    // Fetch the bounding box for the selected road
    try {
      const ROAD_SAFETY_WFS_URL = '';
      const ROAD_SAFETY_LAYER = '';
      
      // CQL filter to get features for the selected road
      const cqlFilter = `Road_name='${roadName.replace(/'/g, "''")}'`;
      const WFS_URL = `${ROAD_SAFETY_WFS_URL}?service=WFS&version=2.0.0&request=GetFeature&typeName=${ROAD_SAFETY_LAYER}&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=${encodeURIComponent(cqlFilter)}`;
      
      console.log('📍 Fetching road bounds for:', roadName);
      
      const response = await fetch(WFS_URL);
      
      if (!response.ok) {
        throw new Error(`WFS request failed with status ${response.status}`);
      }
      
      const geojson = await response.json();
      
      if (geojson.features && geojson.features.length > 0) {
        // Calculate bounding box from all features
        let minLng = Infinity;
        let minLat = Infinity;
        let maxLng = -Infinity;
        let maxLat = -Infinity;
        
        geojson.features.forEach((feature: any) => {
          if (feature.geometry && feature.geometry.coordinates) {
            const coords = feature.geometry.coordinates;
            // Handle LineString geometry
            if (feature.geometry.type === 'LineString') {
              coords.forEach((coord: number[]) => {
                const [lng, lat] = coord;
                minLng = Math.min(minLng, lng);
                minLat = Math.min(minLat, lat);
                maxLng = Math.max(maxLng, lng);
                maxLat = Math.max(maxLat, lat);
              });
            } else if (feature.geometry.type === 'MultiLineString') {
              coords.forEach((line: number[][]) => {
                line.forEach((coord: number[]) => {
                  const [lng, lat] = coord;
                  minLng = Math.min(minLng, lng);
                  minLat = Math.min(minLat, lat);
                  maxLng = Math.max(maxLng, lng);
                  maxLat = Math.max(maxLat, lat);
                });
              });
            }
          }
        });
        
        // Send bounds to parent to zoom map
        if (isFinite(minLng) && isFinite(minLat) && isFinite(maxLng) && isFinite(maxLat)) {
          const bounds: [number, number, number, number] = [minLng, minLat, maxLng, maxLat];
          console.log('✅ Road bounds calculated:', bounds);
          onRoadZoom(bounds);
        }
      }
    } catch (error) {
      console.error('❌ Failed to fetch road bounds:', error);
    }
  };

  // ⚠️ DEPRECATED: Old GIZ_BBSR:Road_Safety layer removed
  // Fetch unique road names from GeoServer WFS
  useEffect(() => {
    // Road Safety layer disabled for Bohol - skip fetching
    console.log('ℹ️ Road names fetch disabled - Road Safety layer not available for Bohol');
    setIsLoading(false);
    return;
    
    // OLD CODE (GIZ_BBSR reference removed):
    const fetchRoadNames = async () => {
      try {
        // Query the Road_Safety layer to get road names and lengths
        const ROAD_SAFETY_WFS_URL = '';
        const ROAD_SAFETY_LAYER = '';
        
        // Fetch both Road_name and Length_m fields
        const WFS_URL = `${ROAD_SAFETY_WFS_URL}?service=WFS&version=2.0.0&request=GetFeature&typeName=${ROAD_SAFETY_LAYER}&outputFormat=application/json&srsName=EPSG:4326&propertyName=Road_name,Length_m`;
        
        console.log('🛣️ Fetching road names and lengths from:', WFS_URL);
        
        const response = await fetch(WFS_URL);
        
        if (!response.ok) {
          throw new Error(`WFS request failed with status ${response.status}`);
        }
        
        const geojson = await response.json();
        
        if (geojson.features && geojson.features.length > 0) {
          // Group by road name and sum lengths
          const roadLengthMap = new Map<string, number>();
          
          geojson.features.forEach((feature: any) => {
            const roadName = feature.properties?.Road_name;
            const lengthM = feature.properties?.Length_m || 0;
            
            if (roadName && roadName.trim() !== '' && roadName !== 'Unknown Road') {
              const trimmedName = roadName.trim();
              const currentLength = roadLengthMap.get(trimmedName) || 0;
              roadLengthMap.set(trimmedName, currentLength + lengthM);
            }
          });
          
          // Convert to array and sort by road name
          const uniqueRoadNames = Array.from(roadLengthMap.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([name, lengthM]) => ({
              roadName: name,
              count: Math.round((lengthM / 1000) * 10) / 10 // Convert to km, round to 1 decimal
            }));
          
          // Calculate total length for "All Roads"
          const totalLength = Array.from(roadLengthMap.values())
            .reduce((sum, length) => sum + length, 0);
          
          // Add "All Roads" option at the beginning
          const allRoadsOption: RoadNameData = {
            roadName: 'all',
            count: Math.round((totalLength / 1000) * 10) / 10 // Total length in km
          };
          
          setRoadNames([allRoadsOption, ...uniqueRoadNames]);
          console.log('✅ Loaded', uniqueRoadNames.length, 'unique road names with total lengths from Road_Safety layer');
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('❌ Failed to fetch road names:', error);
        setIsLoading(false);
      }
    };
    
    if (activeRoadSafetySubLayers.length > 0) {
      fetchRoadNames();
    }
  }, [activeRoadSafetySubLayers]);

  // Filter roads based on search query
  const filteredRoads = roadNames.filter(road => {
    const searchLower = searchQuery.toLowerCase();
    const roadNameLower = road.roadName.toLowerCase();
    
    return roadNameLower.includes(searchLower);
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roadFilterRef.current && !roadFilterRef.current.contains(event.target as Node)) {
        setRoadFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Don't render if not visible
  if (activeRoadSafetySubLayers.length === 0) {
    return null;
  }

  const selectedRoadData = roadNames.find(r => r.roadName === selectedRoadName);

  return (
    <div className="flex items-center gap-1">
      <div className="relative" ref={roadFilterRef}>
        <button
          onClick={() => setRoadFilterOpen(!roadFilterOpen)}
          className="h-8 pl-3 pr-2 bg-white border border-[#E5E7EB] rounded-lg hover:border-[#14B8A6] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] flex items-center gap-2"
        >
          <Route className="w-3.5 h-3.5 text-[#14B8A6] flex-shrink-0" />
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-[#0F172A]">
              {selectedRoadData 
                ? (selectedRoadData.roadName === 'all' ? 'All Roads' : selectedRoadData.roadName)
                : (isLoading ? 'Loading...' : 'Select Road')}
            </span>
            {selectedRoadData && selectedRoadData.roadName !== 'all' && (
              <span className="text-[10px] text-[#94A3B8]">
                (Road Network)
              </span>
            )}
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-[#6B7280] transition-transform duration-200 ${roadFilterOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Road Dropdown Menu */}
        {roadFilterOpen && (
          <div className="absolute top-full right-0 mt-1 w-80 bg-white border border-[#E5E7EB] rounded-lg shadow-xl z-50 overflow-hidden">
            {/* Search inside dropdown */}
            <div className="p-2 border-b border-[#E5E7EB] bg-[#F8FAFC]">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter road names..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-7 pl-7 pr-2 border border-[#E5E7EB] rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-[#14B8A6] focus:border-[#14B8A6] bg-white"
                />
                <Search className="w-3 h-3 text-[#6B7280] absolute left-2 top-2" />
              </div>
            </div>

            {/* Road List */}
            <div className="max-h-64 overflow-y-auto">
              {filteredRoads.length > 0 ? (
                filteredRoads.map((road) => (
                  <button
                    key={road.roadName}
                    onClick={() => handleRoadSelection(road.roadName)}
                    className={`w-full text-left px-3 py-2 transition-colors duration-150 border-b border-[#F1F5F9] last:border-b-0 ${
                      selectedRoadName === road.roadName
                        ? 'bg-gradient-to-r from-[#F0FDFA] to-[#CCFBF1] border-l-2 border-l-[#14B8A6]'
                        : 'hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className={`text-xs font-medium mb-0.5 ${
                          selectedRoadName === road.roadName ? 'text-[#14B8A6]' : 'text-[#0F172A]'
                        }`}>
                          {road.roadName === 'all' ? 'All Roads' : road.roadName}
                        </div>
                        <div className="flex items-center gap-2">
                          {road.roadName === 'all' ? (
                            <>
                              <span className="text-[10px] text-[#6B7280]">City-wide coverage</span>
                              <span className="text-[10px] text-[#94A3B8]">•</span>
                              <span className="text-[10px] text-[#6B7280]">{road.count} km</span>
                            </>
                          ) : (
                            <span className="text-[10px] text-[#6B7280]">{road.count} km</span>
                          )}
                        </div>
                      </div>
                      {selectedRoadName === road.roadName && (
                        <div className="w-1.5 h-1.5 rounded-full bg-[#14B8A6] ml-2" />
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-6 text-center">
                  <p className="text-xs text-[#94A3B8]">No roads found</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Clear Filter Button - Only show when a specific road is selected */}
      {selectedRoadName !== 'all' && (
        <button
          onClick={() => {
            onRoadNameSelect('all');
            setSearchQuery('');
            // Reset map view to home when clearing road filter
            if (onResetView) {
              onResetView();
            }
          }}
          className="h-8 w-8 flex items-center justify-center rounded-lg bg-[#D1FAE5] hover:bg-[#A7F3D0] text-[#14B8A6] transition-colors group"
          title="Clear road filter"
        >
          <X className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
        </button>
      )}
    </div>
  );
}