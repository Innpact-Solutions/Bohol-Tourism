import { useState, useEffect, useRef } from 'react';
import { Search, MapPin } from 'lucide-react';

interface LocationResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  type: string;
  name: string;
  geojson?: {
    type: string;
    coordinates: any;
  };
  osm_type?: string;
}

interface LocationSearchProps {
  onLocationSelect?: (location: { lat: number; lng: number; name: string; geojson?: any }) => void;
}

export function LocationSearch({ onLocationSelect }: LocationSearchProps) {
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [locationResults, setLocationResults] = useState<LocationResult[]>([]);
  const [locationSearchOpen, setLocationSearchOpen] = useState(false);
  const [locationSearchLoading, setLocationSearchLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<LocationResult[]>([]);
  const [prominentLocations, setProminentLocations] = useState<LocationResult[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const locationSearchRef = useRef<HTMLDivElement>(null);

  // Bohol LGU bounding box (Tagbilaran City, Dauis, Panglao)
  const BHUBANESWAR_BBOX = {
    minLat: 9.54,
    maxLat: 9.75,
    minLon: 123.75,
    maxLon: 123.95
  };

  // Fetch prominent locations from GeoServer on component mount
  useEffect(() => {
    const fetchProminentLocations = async () => {
      try {
        // List of prominent locations across the three LGUs: Tagbilaran City, Dauis, Panglao
        const prominentLocationNames = [
          'Tagbilaran City Hall',
          'Bohol Provincial Capitol',
          'Carlos P. Garcia Memorial Park Tagbilaran',
          'Tagbilaran City Port',
          'Holy Name University Tagbilaran',
          'Cogon Public Market Tagbilaran',
          'Dauis Church',
          'Dauis Municipal Hall',
          'Panglao Church',
          'Alona Beach Panglao',
        ];

        const results = await Promise.all(
          prominentLocationNames.map(async (name) => {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(name + ', Bohol, Philippines')}&limit=1&polygon_geojson=1`;
            try {
              const response = await fetch(url);
              const data = await response.json();
              return data[0];
            } catch (err) {
              return null;
            }
          })
        );

        const validResults = results.filter(r => r != null);
        setProminentLocations(validResults);
      } catch (error) {
        console.error('Failed to fetch prominent locations:', error);
      }
    };

    fetchProminentLocations();
  }, []);

  // Handle location search with Nominatim API
  const handleLocationSearch = async (query: string) => {
    if (query.trim() === '') {
      setLocationResults([]);
      return;
    }

    setLocationSearchLoading(true);
    
    console.log('🔍 Searching for:', query);

    try {
      // First try to search within Bhubaneswar
      const localUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Bohol, Philippines')}&limit=8&polygon_geojson=1&addressdetails=1`;
      
      const localResponse = await fetch(localUrl);
      const localData = await localResponse.json();
      
      console.log('📍 Local search results:', localData);

      // Filter results to only those within the bounding box
      const filteredLocalData = localData.filter((item: LocationResult) => {
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        return (
          lat >= BHUBANESWAR_BBOX.minLat &&
          lat <= BHUBANESWAR_BBOX.maxLat &&
          lon >= BHUBANESWAR_BBOX.minLon &&
          lon <= BHUBANESWAR_BBOX.maxLon
        );
      });

      console.log('📍 Filtered results (within bbox):', filteredLocalData);

      if (filteredLocalData.length > 0) {
        setLocationResults(filteredLocalData);
      } else {
        // If no results within bbox, fall back to general search
        const generalUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&polygon_geojson=1&addressdetails=1&viewbox=${BHUBANESWAR_BBOX.minLon},${BHUBANESWAR_BBOX.minLat},${BHUBANESWAR_BBOX.maxLon},${BHUBANESWAR_BBOX.maxLat}&bounded=1`;
        
        const generalResponse = await fetch(generalUrl);
        const generalData = await generalResponse.json();
        
        console.log('📍 General search results:', generalData);
        setLocationResults(generalData);
      }
    } catch (error) {
      console.error('❌ Failed to fetch location data:', error);
      setLocationResults([]);
    } finally {
      setLocationSearchLoading(false);
    }
  };

  // Handle location selection
  const handleLocationSelect = (location: LocationResult) => {
    if (onLocationSelect) {
      onLocationSelect({
        lat: parseFloat(location.lat),
        lng: parseFloat(location.lon),
        name: location.name,
        geojson: location.geojson
      });
    }
    setLocationSearchQuery('');
    setLocationResults([]);
    setLocationSearchOpen(false);
    // Add to search history
    if (!searchHistory.find(h => h.place_id === location.place_id)) {
      setSearchHistory([location, ...searchHistory.slice(0, 9)]); // Keep only the last 10 searches
    }
  };

  // Debounce search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (locationSearchQuery.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        handleLocationSearch(locationSearchQuery);
      }, 500);
    } else {
      setLocationResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [locationSearchQuery]);

  // Close location dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationSearchRef.current && !locationSearchRef.current.contains(event.target as Node)) {
        setLocationSearchOpen(false);
      }
    };

    if (locationSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [locationSearchOpen]);

  return (
    <div className="relative" ref={locationSearchRef}>
      <input
        type="text"
        placeholder="Search locations..."
        value={locationSearchQuery}
        onChange={(e) => {
          setLocationSearchQuery(e.target.value);
          setLocationSearchOpen(true);
        }}
        onFocus={() => setLocationSearchOpen(true)}
        className="w-44 h-7 pl-7 pr-2.5 border border-[#E5E7EB] rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all bg-white/95 backdrop-blur-sm shadow-sm"
      />
      <Search className="w-3 h-3 text-[#6B7280] absolute left-2.5 top-2" />
      
      {/* Location Dropdown */}
      {locationSearchOpen && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-[#E5E7EB] rounded-lg shadow-xl z-50 overflow-hidden max-h-96">
          {locationSearchLoading ? (
            <div className="px-4 py-6 text-center">
              <p className="text-xs text-[#94A3B8]">Searching...</p>
            </div>
          ) : locationSearchQuery.trim() === '' ? (
            // Show search history first, then prominent locations when search is empty
            <div>
              {/* Recent Searches */}
              {searchHistory.length > 0 && (
                <>
                  <div className="px-3 py-2 bg-gradient-to-r from-[#EFF6FF] to-[#E0F2FE] border-b border-[#BAE6FD]">
                    <p className="text-[10px] font-semibold text-[#0369A1]">RECENT SEARCHES</p>
                  </div>
                  <div>
                    {searchHistory.slice(0, 3).map((location) => (
                      <button
                        key={`history-${location.place_id}`}
                        onClick={() => handleLocationSelect(location)}
                        className="w-full text-left px-3 py-2.5 hover:bg-[#F8FAFC] transition-colors duration-150 border-b border-[#F1F5F9] group bg-gradient-to-r from-[#FAFBFD] to-white"
                      >
                        <div className="flex items-start gap-2">
                          <MapPin className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${location.geojson ? 'text-[#E3000F]' : 'text-[#2563EB]'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-[#0F172A] group-hover:text-[#2563EB] transition-colors truncate">
                              {location.name}
                            </div>
                            <div className="text-[10px] text-[#6B7280] mt-0.5 line-clamp-1">
                              {location.display_name}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {/* Popular Locations */}
              <div className="px-3 py-2 bg-[#F8FAFC] border-b border-[#E5E7EB]">
                <p className="text-[10px] font-medium text-[#64748B]">POPULAR LOCATIONS</p>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {prominentLocations.map((location) => (
                  <button
                    key={location.place_id}
                    onClick={() => handleLocationSelect(location)}
                    className="w-full text-left px-3 py-2.5 hover:bg-[#F8FAFC] transition-colors duration-150 border-b border-[#F1F5F9] last:border-b-0 group"
                  >
                    <div className="flex items-start gap-2">
                      <MapPin className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${location.geojson ? 'text-[#E3000F]' : 'text-[#2563EB]'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-[#0F172A] group-hover:text-[#2563EB] transition-colors truncate">
                          {location.name}
                        </div>
                        <div className="text-[10px] text-[#6B7280] mt-0.5 line-clamp-1">
                          {location.display_name}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : locationResults.length > 0 ? (
            // Show search results
            <div className="max-h-80 overflow-y-auto">
              {locationResults.map((location) => (
                <button
                  key={location.place_id}
                  onClick={() => handleLocationSelect(location)}
                  className="w-full text-left px-3 py-2.5 hover:bg-[#F8FAFC] transition-colors duration-150 border-b border-[#F1F5F9] last:border-b-0 group"
                >
                  <div className="flex items-start gap-2">
                    <MapPin className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${location.geojson ? 'text-[#E3000F]' : 'text-[#2563EB]'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-[#0F172A] group-hover:text-[#2563EB] transition-colors truncate">
                        {location.name}
                      </div>
                      <div className="text-[10px] text-[#6B7280] mt-0.5 line-clamp-1">
                        {location.display_name}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            // No results found
            <div className="px-4 py-6 text-center">
              <p className="text-xs text-[#94A3B8]">No results found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
