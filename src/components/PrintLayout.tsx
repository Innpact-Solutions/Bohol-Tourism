import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import maplibregl from 'maplibre-gl@5.15.0';
import 'maplibre-gl/dist/maplibre-gl.css';
import { X, Download, Printer, Layers, Flame, Sun, Thermometer, ThermometerSun, Droplets, Wind, Waves, Route, ShieldAlert, Car, Bike, User, AlertTriangle, Home, TreePine, Building2, Mountain, Gauge } from 'lucide-react';
import html2canvas from 'html2canvas';
import { getUILayerLegend, type LegendEntry } from '../utils/legendLoader';

interface PrintLayoutProps {
  onClose: () => void;
  mapState: {
    center: [number, number];
    zoom: number;
    pitch: number;
    bearing: number;
    visibleLayers: string[];
    basemap: string;
    scenario: string;
    fullStyle?: any; // Complete map style from main map
    sector?: string; // Current sector
    activeLayer?: string; // Active layer name
    wardId?: string; // Selected ward ID
    selectedLguName?: string; // Active LGU filter name
    selectedWardName?: string; // Active barangay filter name
    activeBaseLayers?: string[]; // Active base layers
    activeInfraLayers?: string[]; // Active infrastructure layers
    activeRoadSafetySubLayers?: string[]; // Active road safety sub-layers
    roadNetworkStats?: Record<string, number>; // Road network statistics
    roadSafetyStats?: Record<string, number>; // Road safety statistics
  };
}

export function PrintLayout({ onClose, mapState }: PrintLayoutProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isDownloadingRef = useRef(false); // Prevent multiple simultaneous downloads
  const [mapBounds, setMapBounds] = useState<{
    north: number;
    south: number;
    east: number;
    west: number;
  } | null>(null);
  const [scaleInfo, setScaleInfo] = useState<{
    width: number;
    label: string;
  }>({ width: 100, label: '1 km' });

  // Helper function to convert decimal degrees to degrees/minutes
  const formatCoordinate = (decimal: number, isLongitude: boolean): string => {
    const degrees = Math.floor(Math.abs(decimal));
    const minutes = Math.floor((Math.abs(decimal) - degrees) * 60);
    const direction = isLongitude ? (decimal >= 0 ? 'E' : 'W') : (decimal >= 0 ? 'N' : 'S');
    return `${degrees}°${minutes.toString().padStart(2, '0')}'${direction}`;
  };

  // Calculate scale bar from mapState (same as main map)
  const calculateScale = (zoom: number, lat: number) => {
    // Calculate meters per pixel at this zoom level and latitude
    const metersPerPixel = (40075017 * Math.cos(lat * Math.PI / 180)) / Math.pow(2, zoom + 8);
    
    // Target scale bar width in pixels
    const maxWidth = 100;
    const maxMeters = maxWidth * metersPerPixel;
    
    // Find a nice round number
    let meters: number;
    let label: string;
    
    if (maxMeters > 10000) {
      meters = Math.floor(maxMeters / 10000) * 10000;
      label = `${meters / 1000} km`;
    } else if (maxMeters > 1000) {
      meters = Math.floor(maxMeters / 1000) * 1000;
      label = `${meters / 1000} km`;
    } else if (maxMeters > 100) {
      meters = Math.floor(maxMeters / 100) * 100;
      label = `${meters} m`;
    } else {
      meters = Math.floor(maxMeters / 10) * 10;
      label = `${meters} m`;
    }
    
    const width = (meters / metersPerPixel);
    
    return {
      width: Math.round(width),
      label
    };
  };

  // Calculate scale on mount using mapState values
  useEffect(() => {
    const scale = calculateScale(mapState.zoom, mapState.center[1]);
    setScaleInfo(scale);
  }, [mapState.zoom, mapState.center]);

  // Helper function to generate title based on active layer only
  const getMapTitle = (): string => {
    const {
      activeLayer,
      activeBuildingHeightCategories = [],
      activeBuildingAreaCategories = [],
    } = mapState;

    // Building layers don't set activeLayer — check them first
    if (activeBuildingHeightCategories.length > 0) return 'Building Height';
    if (activeBuildingAreaCategories.length > 0) return 'Building Floor Area';

    if (!activeLayer) {
      return 'Bohol Citywide Inclusive Sanitation (CWIS) Planning & Decision Support Dashboard';
    }

    // Map layer IDs to proper display names
    const layerNames: Record<string, string> = {
      // Climate Hazard layers
      'flood_hazard': 'Urban Flooding',
      'storm_surge': 'Storm Surge',
      'urban_waterlogging': 'Urban Waterlogging',
      'land_surface_temperature': 'Land Surface Temperature',
      'urban_heat_island': 'Urban Heat Island',
      'wet_bulb_temperature': 'Wet-Bulb Temperature',

      // Air Pollution layers
      'air_aqi': 'Air Quality Index (AQI)',
      'air_pm25': 'PM2.5 Concentration',
      'air_pm10': 'PM10 Concentration',
      'air_no2': 'NO₂ (Nitrogen Dioxide)',
      'air_so2': 'SO₂ (Sulfur Dioxide)',
      'air_co': 'CO (Carbon Monoxide)',
      'air_o3': 'O₃ (Ozone)',

      // Environmental / Sensitivity layers
      'soil_classification': 'Soil Classification',
      'groundwater_depth': 'Groundwater Depth',
      'geology': 'Geology',
      'sinkhole': 'Sinkhole Risk',

      // Data layers
      'elevation': 'Elevation Analysis',
      'building_use': 'Building Use Distribution',
      'economic_vulnerability': 'Economic Vulnerability',

      // Multi-Hazard
      'multihazard_assessment': 'Multi-Hazard Assessment',
      'multi_hazard': 'Multi-Hazard Index',
    };

    if (layerNames[activeLayer]) {
      return layerNames[activeLayer];
    }

    // Fallback: convert snake_case to Title Case
    return activeLayer
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Helper function to generate subtitle with LGU/barangay filter information
  const getMapSubtitle = (): string => {
    const { selectedLguName, selectedWardName } = mapState;

    // Both LGU and barangay selected
    if (selectedLguName && selectedWardName) {
      return `${selectedLguName} – ${selectedWardName}`;
    }

    // Only barangay selected (LGU derived from barangay selection)
    if (selectedWardName) {
      return `${selectedWardName}`;
    }

    // Only LGU selected
    if (selectedLguName) {
      return selectedLguName;
    }

    // No filter — show all three LGUs
    return 'Tagbilaran City | Dauis | Panglao';
  };

  // Helper function to generate dynamic filename based on active layer
  const getDownloadFilename = (): string => {
    const { activeLayer } = mapState;

    // Default filename if no active layer
    if (!activeLayer) {
      return 'Bohol_CWIS_Map.jpg';
    }

    // Convert the layer title to Title_Case filename (reuse same mapping as getMapTitle)
    const layerNames: Record<string, string> = {
      'flood_hazard': 'Flood_Hazard',
      'storm_surge': 'Storm_Surge',
      'urban_waterlogging': 'Urban_Waterlogging',
      'land_surface_temperature': 'Land_Surface_Temperature',
      'urban_heat_island': 'Urban_Heat_Island',
      'wet_bulb_temperature': 'Wet_Bulb_Temperature',
      'air_aqi': 'Air_Quality_Index',
      'air_pm25': 'PM2.5_Concentration',
      'air_pm10': 'PM10_Concentration',
      'air_no2': 'NO2_Nitrogen_Dioxide',
      'air_so2': 'SO2_Sulfur_Dioxide',
      'air_co': 'CO_Carbon_Monoxide',
      'air_o3': 'O3_Ozone',
      'soil_classification': 'Soil_Classification',
      'groundwater_depth': 'Groundwater_Depth',
      'geology': 'Geology',
      'sinkhole': 'Sinkhole_Risk',
      'elevation': 'Elevation_Analysis',
      'building_use': 'Building_Use_Distribution',
      'economic_vulnerability': 'Economic_Vulnerability',
      'multihazard_assessment': 'Multi_Hazard_Assessment',
      'multi_hazard': 'Multi_Hazard_Index',
    };

    const layerSlug = layerNames[activeLayer] ||
      activeLayer.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('_');

    return `${layerSlug}.jpg`;
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    console.log('🖨️ Initializing print map...');
    console.log('📍 Center:', mapState.center);
    console.log('🔍 Zoom:', mapState.zoom);
    console.log('🎨 Has full style:', !!mapState.fullStyle);

    // Create print map instance using the exact style from main map
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: mapState.fullStyle, // Use the complete cloned style
      center: mapState.center,
      zoom: mapState.zoom,
      pitch: mapState.pitch,
      bearing: mapState.bearing,
      preserveDrawingBuffer: true, // Enable canvas export
      interactive: true, // MUST be true for WMS layers to load!
      attributionControl: false // Remove MapLibre attribution and info button
    });

    mapRef.current = map;

    // ── Readiness gate ──────────────────────────────────────────────────────
    // Must be declared BEFORE map.on('load') so the hard cap fires even if
    // 'load' never triggers (e.g. when a GeoServer vector-tile source stalls
    // during metadata fetch, blocking the style-load entirely).
    let readyResolved = false;
    const markReady = () => {
      if (readyResolved) return;
      readyResolved = true;
      console.log('✅ Print map ready');
      setIsLoading(false);
    };

    // Absolute hard cap — fires no matter what (load event, idle, render — all optional)
    setTimeout(() => {
      if (!readyResolved) {
        console.warn('⚠️ Print map absolute timeout — showing layout anyway');
        markReady();
      }
    }, 8000);

    // Add scale control (same as MapCanvas)
    map.addControl(new maplibregl.ScaleControl({
      maxWidth: 100,
      unit: 'metric'
    }), 'bottom-left');

    // Wait for map to load
    map.on('load', () => {
      console.log('✅ Print map loaded successfully');
      console.log('🗺️ Map style:', map.getStyle());
      console.log('📦 Sources:', Object.keys(map.getStyle().sources || {}));
      console.log('🎨 Layers:', map.getStyle().layers?.map(l => l.id) || []);
      
      // Calculate and set map bounds
      const bounds = map.getBounds();
      setMapBounds({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      });
      
      // Keep the exact same view as the main map - no auto-fitting
      // User can manually adjust the view before printing if needed

      // Best case: map goes fully idle (all tiles loaded/errored)
      map.once('idle', () => markReady());

      // Good case: first frame rendered → wait 2 s for tile streaming, then proceed
      map.once('render', () => setTimeout(markReady, 2000));

      // Fallback inside load: 5 s grace after load fires (absolute cap is 8 s above)
      setTimeout(markReady, 5000);
    });

    // Helper function to extract coordinates from geometry
    const extractCoordinates = (geometry: any): number[][] => {
      const coords: number[][] = [];
      
      if (!geometry) return coords;
      
      switch (geometry.type) {
        case 'Point':
          coords.push(geometry.coordinates);
          break;
        case 'MultiPoint':
        case 'LineString':
          coords.push(...geometry.coordinates);
          break;
        case 'MultiLineString':
        case 'Polygon':
          geometry.coordinates.forEach((ring: number[][]) => {
            coords.push(...ring);
          });
          break;
        case 'MultiPolygon':
          geometry.coordinates.forEach((polygon: number[][][]) => {
            polygon.forEach((ring: number[][]) => {
              coords.push(...ring);
            });
          });
          break;
        case 'GeometryCollection':
          geometry.geometries.forEach((geom: any) => {
            coords.push(...extractCoordinates(geom));
          });
          break;
      }
      
      return coords;
    };

    // Handle missing images by creating placeholder images
    map.on('styleimagemissing', (e) => {
      const id = e.id;
      console.log('🖼️ Creating placeholder for missing image:', id);
      
      // Create a simple colored circle as placeholder
      const size = 32;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Draw a colored circle based on image name
        ctx.fillStyle = id.includes('edu') ? '#3B82F6' : 
                       id.includes('health') ? '#EF4444' : 
                       id.includes('transport') ? '#10B981' : 
                       id.includes('public') ? '#F59E0B' : 
                       id.includes('road') ? '#8B5CF6' : '#6B7280';
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Add white border
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Add to map
        map.addImage(id, { width: size, height: size, data: ctx.getImageData(0, 0, size, size).data });
      }
    });

    map.on('error', (e) => {
      // Suppress building layer errors (XML/JSON parsing issues)
      if (e.error?.message?.includes('JSON') || e.error?.message?.includes('buildings')) {
        console.warn('⚠️ Suppressed building layer error (non-critical)');
        return;
      }
      console.error('❌ Print map error:', e);
    });

    // Disable all popup interactions
    map.on('click', (e) => {
      e.preventDefault();
      // Don't show any popups in print view
    });

    return () => {
      map.remove();
    };
  }, [mapState]);

  const handleDownloadJPG = async () => {
    if (!mapRef.current || !mapContainerRef.current) {
      alert('Map not ready yet');
      return;
    }

    // Prevent multiple simultaneous downloads
    if (isDownloadingRef.current) {
      console.log('⚠️ Download already in progress');
      return;
    }
    isDownloadingRef.current = true;

    try {
      const map = mapRef.current;
      
      console.log('🎨 Starting JPG export with manually drawn overlays...');
      
      // Wait for map to be completely idle
      if (!map.loaded() || map.isMoving()) {
        console.log('⏳ Waiting for map to become idle...');
        await new Promise<void>((resolve) => {
          map.once('idle', () => {
            console.log('✅ Map is now idle');
            resolve();
          });
        });
      }
      
      // Read actual scale from MapLibre scale control AT DOWNLOAD TIME
      const scaleControlElement = mapContainerRef.current.querySelector('.maplibregl-ctrl-scale');
      
      if (!scaleControlElement) {
        console.error('❌ Scale control element not found in DOM!');
        alert('Scale control not found. Please try again.');
        isDownloadingRef.current = false;
        return;
      }
      
      // Read the ACTUAL values from MapLibre's rendered scale control
      const scaleText = scaleControlElement.textContent || '';
      const computedStyle = window.getComputedStyle(scaleControlElement);
      const scaleWidthStr = computedStyle.width;
      const scaleWidth = parseInt(scaleWidthStr) || 100;
      
      console.log('📏 ===== SCALE VERIFICATION =====');
      console.log('📏 Map zoom level:', map.getZoom());
      console.log('📏 Map center:', map.getCenter());
      console.log('📏 ✅ USING MAPLIBRE DOM VALUES:');
      console.log('📏    Scale text:', scaleText);
      console.log('📏    Scale width:', scaleWidth + 'px (from ' + scaleWidthStr + ')');
      console.log('📏 ❌ IGNORING our calculation:', scaleInfo.label, scaleInfo.width + 'px');
      console.log('📏 ================================');
      
      const actualScaleWidth = scaleWidth;
      const actualScaleLabel = scaleText;
      
      // Step 1: Capture the map canvas
      console.log('📸 Step 1: Capturing map canvas...');
      const capturePromise = new Promise<string>((resolve, reject) => {
        const onRender = () => {
          try {
            const mapCanvas = map.getCanvas();
            console.log('📸 Capturing canvas during render event...');
            console.log('🔍 Canvas dimensions:', mapCanvas.width, 'x', mapCanvas.height);
            
            const dataURL = mapCanvas.toDataURL('image/jpeg', 0.95);
            console.log('✅ Captured map canvas, length:', dataURL.length);
            
            if (dataURL.length < 1000) {
              reject(new Error('Canvas appears empty (data URL too short)'));
              return;
            }
            
            resolve(dataURL);
          } catch (error) {
            reject(error);
          }
        };
        
        map.once('render', onRender);
        setTimeout(() => map.triggerRepaint(), 100);
        
        setTimeout(() => {
          map.off('render', onRender);
          reject(new Error('Timeout waiting for render'));
        }, 10000);
      });
      
      const mapImageDataURL = await capturePromise;
      console.log('✅ Map canvas captured successfully');
      
      // Step 2: Create composite canvas with map + overlays
      console.log('🖼️ Step 2: Creating composite image with overlays...');
      
      // Get the container dimensions
      const container = mapContainerRef.current;
      const containerRect = container.getBoundingClientRect();
      
      // Create final canvas with extra space for title
      const finalCanvas = document.createElement('canvas');
      const scaleFactor = 3; // Higher resolution (increased from 2 to 3)
      const titleHeight = 70; // Space for title and subtitle
      const canvasWidth = containerRect.width;
      const canvasHeight = containerRect.height + titleHeight;
      
      finalCanvas.width = canvasWidth * scaleFactor;
      finalCanvas.height = canvasHeight * scaleFactor;
      const ctx = finalCanvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }
      
      // Scale for higher resolution
      ctx.scale(scaleFactor, scaleFactor);
      
      // Enable better text rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Draw white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      
      // Step 3: Add title and subtitle at the top FIRST
      console.log('📝 Step 3: Adding title and subtitle...');
      const padding = 20;
      
      // Draw white background for title area
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvasWidth, titleHeight);
      
      // Draw title
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 18px Inter, sans-serif';
      ctx.textBaseline = 'top';
      ctx.fillText(getMapTitle(), padding, padding);
      
      // Draw subtitle
      ctx.fillStyle = '#6B7280';
      ctx.font = '13px Inter, sans-serif';
      ctx.textBaseline = 'top';
      ctx.fillText(getMapSubtitle(), padding, padding + 24);
      console.log('✅ Title and subtitle added');
      
      // Step 4: Draw the map image BELOW the title
      console.log('🗺️ Step 4: Drawing map image...');
      const mapImage = new Image();
      await new Promise<void>((resolve, reject) => {
        mapImage.onload = () => resolve();
        mapImage.onerror = reject;
        mapImage.src = mapImageDataURL;
      });
      
      // Draw map below title
      ctx.drawImage(mapImage, 0, titleHeight, containerRect.width, containerRect.height);
      console.log('✅ Map image drawn to canvas');
      
      // Step 5: Draw north arrow manually
      console.log('📍 Step 5: Drawing north arrow...');
      const northArrowX = canvasWidth - 50;
      const northArrowY = titleHeight + 35;
      const arrowRadius = 18;
      
      // Draw outer circle with white background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.arc(northArrowX, northArrowY, arrowRadius, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = '#6B7280';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(northArrowX, northArrowY, arrowRadius, 0, Math.PI * 2);
      ctx.stroke();
      
      // Draw north arrow triangle
      ctx.fillStyle = '#6B7280';
      ctx.beginPath();
      ctx.moveTo(northArrowX, northArrowY - 11); // Top point
      ctx.lineTo(northArrowX + 7, northArrowY + 10); // Bottom right
      ctx.lineTo(northArrowX, northArrowY + 6); // Middle
      ctx.lineTo(northArrowX - 7, northArrowY + 10); // Bottom left
      ctx.closePath();
      ctx.fill();
      console.log('✅ North arrow drawn');
      
      // Draw scale bar (bottom-left) - capture actual DOM element
      console.log('📏 Drawing scale bar from DOM element...');
      const scaleBarX = 15;
      const scaleBarY = canvasHeight - 20;
      const scaleBarWidth = actualScaleWidth;
      const scaleBarHeight = 4;
      
      // Draw white background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.fillRect(scaleBarX, scaleBarY - scaleBarHeight, scaleBarWidth, scaleBarHeight);
      
      // Draw black border (left, right, bottom)
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.beginPath();
      // Left side
      ctx.moveTo(scaleBarX, scaleBarY - scaleBarHeight);
      ctx.lineTo(scaleBarX, scaleBarY);
      // Bottom
      ctx.lineTo(scaleBarX + scaleBarWidth, scaleBarY);
      // Right side
      ctx.lineTo(scaleBarX + scaleBarWidth, scaleBarY - scaleBarHeight);
      ctx.stroke();
      
      // Draw scale label (text inside, left-aligned)
      ctx.fillStyle = '#333';
      ctx.font = '10px "Helvetica Neue", Arial, Helvetica, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(actualScaleLabel, scaleBarX + scaleBarWidth / 2, scaleBarY - 7);
      
      ctx.textAlign = 'left';
      console.log('✅ Scale bar drawn');
      
      // Step 6: Draw legend panel manually
      console.log('📋 Step 6: Drawing legend panel...');
      const legendX = canvasWidth - 220; // Adjusted to match w-52 (208px + 12px margin)
      const legendY = canvasHeight - 30;
      const legendWidth = 208; // Exact match for w-52 (13rem = 208px)
      const borderRadius = 8; // Matches rounded-lg
      let currentY = legendY;
      
      const legends = getAllActiveLegends();
      
      // Helper function to draw rounded rectangle
      const roundRect = (x: number, y: number, width: number, height: number, radius: number) => {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
      };
      
      if (legends.length > 0) {
        // Calculate total height needed
        let totalHeight = 35; // Header height
        legends.forEach(({ legend }) => {
          totalHeight += 28; // Section header
          totalHeight += legend.classes.length * 22; // Each class entry (increased spacing)
          totalHeight += 12; // Padding
        });
        
        // Draw legend background with rounded corners (white with shadow)
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        roundRect(legendX, currentY - totalHeight, legendWidth, totalHeight, borderRadius);
        ctx.fill();
        
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        
        ctx.strokeStyle = '#E5E7EB';
        ctx.lineWidth = 1;
        roundRect(legendX, currentY - totalHeight, legendWidth, totalHeight, borderRadius);
        ctx.stroke();
        
        // Draw legend header with rounded top corners
        const gradient = ctx.createLinearGradient(legendX, currentY - totalHeight, legendX + legendWidth, currentY - totalHeight + 35);
        gradient.addColorStop(0, '#2563EB');
        gradient.addColorStop(1, '#1D4ED8');
        ctx.fillStyle = gradient;
        
        // Clip to rounded top corners only
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(legendX + borderRadius, currentY - totalHeight);
        ctx.lineTo(legendX + legendWidth - borderRadius, currentY - totalHeight);
        ctx.quadraticCurveTo(legendX + legendWidth, currentY - totalHeight, legendX + legendWidth, currentY - totalHeight + borderRadius);
        ctx.lineTo(legendX + legendWidth, currentY - totalHeight + 35);
        ctx.lineTo(legendX, currentY - totalHeight + 35);
        ctx.lineTo(legendX, currentY - totalHeight + borderRadius);
        ctx.quadraticCurveTo(legendX, currentY - totalHeight, legendX + borderRadius, currentY - totalHeight);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        
        // Draw "Legends" text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.textBaseline = 'middle';
        ctx.fillText('Legends', legendX + 12, currentY - totalHeight + 17);
        
        currentY = currentY - totalHeight + 40;
        
        // Draw each legend
        legends.forEach(({ id, legend }, legendIndex) => {
          // Add spacing between legends (but not before first one)
          if (legendIndex > 0) {
            currentY += 12;
          }
          
          // Draw section title (truncate if too long)
          ctx.fillStyle = '#0F172A';
          ctx.font = 'bold 11px Inter, sans-serif';
          ctx.textBaseline = 'middle';
          const maxTitleWidth = legendWidth - 30;
          let titleText = legend.name;
          let titleWidth = ctx.measureText(titleText).width;
          
          // Truncate with ellipsis if needed
          if (titleWidth > maxTitleWidth) {
            while (titleWidth > maxTitleWidth && titleText.length > 0) {
              titleText = titleText.slice(0, -1);
              titleWidth = ctx.measureText(titleText + '...').width;
            }
            titleText += '...';
          }
          
          ctx.fillText(titleText, legendX + 12, currentY + 8);
          
          currentY += 24;
          
          // Draw legend classes
          legend.classes.forEach((cls, idx) => {
            if (legend.type === 'polygon') {
              // Draw color box with slight rounding
              const boxRadius = 2; // Matches rounded for color boxes
              ctx.fillStyle = cls.color;
              roundRect(legendX + 18, currentY, 14, 14, boxRadius);
              ctx.fill();
              
              ctx.strokeStyle = '#E5E7EB';
              ctx.lineWidth = 0.5;
              roundRect(legendX + 18, currentY, 14, 14, boxRadius);
              ctx.stroke();
              
              // Draw label (truncate if needed)
              ctx.fillStyle = '#1F2937';
              ctx.font = '10px Inter, sans-serif';
              ctx.textBaseline = 'middle';
              
              const maxLabelWidth = legendWidth - 90;
              let labelText = cls.label;
              let labelWidth = ctx.measureText(labelText).width;
              
              if (labelWidth > maxLabelWidth) {
                while (labelWidth > maxLabelWidth && labelText.length > 0) {
                  labelText = labelText.slice(0, -1);
                  labelWidth = ctx.measureText(labelText + '...').width;
                }
                labelText += '...';
              }
              
              ctx.fillText(labelText, legendX + 37, currentY + 7);
              
              // Draw value if present
              if (cls.value) {
                ctx.fillStyle = '#6B7280';
                ctx.font = '9px Inter, sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText(cls.value, legendX + legendWidth - 25, currentY + 7);
                ctx.textAlign = 'left';
              }
            } else {
              // Draw line
              ctx.strokeStyle = cls.color;
              ctx.lineWidth = (cls.width || 1) * 1.2;
              ctx.beginPath();
              ctx.moveTo(legendX + 18, currentY + 7);
              ctx.lineTo(legendX + 42, currentY + 7);
              ctx.stroke();
              
              // Draw label (truncate if needed)
              ctx.fillStyle = '#1F2937';
              ctx.font = '10px Inter, sans-serif';
              ctx.textBaseline = 'middle';
              
              const maxLabelWidth = legendWidth - 100;
              let labelText = cls.label;
              let labelWidth = ctx.measureText(labelText).width;
              
              if (labelWidth > maxLabelWidth) {
                while (labelWidth > maxLabelWidth && labelText.length > 0) {
                  labelText = labelText.slice(0, -1);
                  labelWidth = ctx.measureText(labelText + '...').width;
                }
                labelText += '...';
              }
              
              ctx.fillText(labelText, legendX + 48, currentY + 7);
              
              // Draw km if present
              if (cls.km) {
                ctx.fillStyle = '#6B7280';
                ctx.font = '9px Inter, sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText(cls.km, legendX + legendWidth - 25, currentY + 7);
                ctx.textAlign = 'left';
              }
            }
            
            currentY += 22;
          });
          
          currentY += 8;
        });
        
        console.log('✅ Legend panel drawn');
      }
      
      // Step 7: Convert to blob and download
      console.log('💾 Step 7: Converting to JPG and downloading...');
      finalCanvas.toBlob((blob) => {
        if (blob) {
          console.log('✅ Final blob created, size:', blob.size);
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = getDownloadFilename();
          link.href = url;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(url), 100);
          console.log('✅ JPG downloaded successfully with all overlays');
        } else {
          throw new Error('Failed to create blob');
        }
        isDownloadingRef.current = false;
      }, 'image/jpeg', 0.95);
      
    } catch (error) {
      console.error('❌ Error exporting map:', error);
      alert('Failed to export map: ' + (error as Error).message);
      isDownloadingRef.current = false;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Legend types
  interface LegendClass {
    label: string;
    color: string;
    value?: string;
    width?: number;
    km?: string;
    rating?: string;
    symbol?: string;
  }

  interface Legend {
    name: string;
    type: 'polygon' | 'line' | 'point';
    classes: LegendClass[];
    additionalItems?: { name: string; type: 'point' | 'line'; classes: LegendClass[] }[];
  }

  interface ActiveLegend {
    id: string;
    legend: Legend;
  }

  // Get all active legends (similar to FloatingLegendPanel)
  const getAllActiveLegends = (): ActiveLegend[] => {
    const {
      activeLayer,
      scenario,
      activeBaseLayers = [],
      activeInfraLayers = [],
      activeRoadSafetySubLayers = [],
      roadNetworkStats = {},
      roadSafetyStats = {},
      sector,
      activeBuildingHeightCategories = [],
      activeBuildingAreaCategories = [],
    } = mapState;

    const activeLegends: ActiveLegend[] = [];

    // Base layer legends
    const baseLegends: Record<string, Legend> = {
      slum_settlements: {
        name: 'Slum',
        type: 'line',
        classes: [
          { label: 'Slum Boundary', color: '#8B5CF6', width: 2.5 },
        ],
      },
      builtup_density: {
        name: 'Green Cover',
        type: 'polygon',
        classes: [
          { label: 'Sparse (<25%)', color: '#D1FAE5' },
          { label: 'Moderate (25-50%)', color: '#6EE7B7' },
          { label: 'Dense (50-75%)', color: '#10B981' },
          { label: 'Very Dense (>75%)', color: '#047857' },
        ],
      },
      built_up: {
        name: 'Built-up',
        type: 'polygon',
        classes: [
          { label: 'Low (<25%)', color: '#F1F5F9' },
          { label: 'Medium (25-50%)', color: '#CBD5E1' },
          { label: 'High (50-75%)', color: '#64748B' },
          { label: 'Very High (>75%)', color: '#334155' },
        ],
      },
      elevation: {
        name: 'Elevation',
        type: 'polygon',
        classes: [
          { label: 'Low (<20m)', color: '#FEF3C7' },
          { label: 'Medium (20-40m)', color: '#FCD34D' },
          { label: 'High (40-60m)', color: '#F59E0B' },
          { label: 'Very High (>60m)', color: '#B45309' },
        ],
      },
      watershed: {
        name: 'Stream Order',
        type: 'line',
        classes: [
          { label: '1st Order', color: '#B3E5FC', width: 1.0 },
          { label: '2nd Order', color: '#81D4FA', width: 1.5 },
          { label: '3rd Order', color: '#4FC3F7', width: 2.0 },
          { label: '4th Order', color: '#29B6F6', width: 2.5 },
          { label: '5th Order', color: '#1565C0', width: 3.0 },
        ],
        additionalItems: [
          {
            name: 'Outfall Location',
            type: 'point',
            classes: [
              { label: 'Drainage Outfall', color: '#DC2626', symbol: 'circle' }
            ]
          }
        ]
      },
      road_network_base: {
        name: 'Road Network',
        type: 'line',
        classes: [
          {
            label: 'National Highway',
            color: '#B0B0B0',
            width: 3,
            km: roadNetworkStats['National Highway'] !== undefined
              ? `${roadNetworkStats['National Highway'].toFixed(1)} km`
              : 'Loading...'
          },
          {
            label: 'State Highway',
            color: '#C0C0C0',
            width: 2.5,
            km: roadNetworkStats['State Highway'] !== undefined
              ? `${roadNetworkStats['State Highway'].toFixed(1)} km`
              : 'Loading...'
          },
          {
            label: 'Major Road',
            color: '#D5D5D5',
            width: 2,
            km: roadNetworkStats['Major Road'] !== undefined
              ? `${roadNetworkStats['Major Road'].toFixed(1)} km`
              : 'Loading...'
          },
          {
            label: 'Link Road',
            color: '#F0F0F0',
            width: 1.5,
            km: roadNetworkStats['Link Road'] !== undefined
              ? `${roadNetworkStats['Link Road'].toFixed(1)} km`
              : 'Loading...'
          },
        ],
      },
    };

    // Infrastructure legends
    const roadSafetySubCategories: Record<string, { label: string }> = {
      'irap_vehicle': { label: 'Vehicle Safety' },
      'irap_motorcycle': { label: 'Motorcycle Safety' },
      'irap_bicycle': { label: 'Bicycle Safety' },
      'irap_pedestrian': { label: 'Pedestrian Safety' },
    };

    const activeRoadSafetySubLayer = activeRoadSafetySubLayers.length > 0
      ? roadSafetySubCategories[activeRoadSafetySubLayers[0]]
      : null;

    const infraLegends: Record<string, Legend> = {
      road_network: {
        name: 'Road Network',
        type: 'line',
        classes: [
          {
            label: 'National Highway (NH)',
            color: '#EF4444',
            width: 4,
            km: roadNetworkStats['National Highway'] !== undefined
              ? `${roadNetworkStats['National Highway'].toFixed(1)} km`
              : 'Loading...'
          },
          {
            label: 'State Highway (SH)',
            color: '#F59E0B',
            width: 3,
            km: roadNetworkStats['State Highway'] !== undefined
              ? `${roadNetworkStats['State Highway'].toFixed(1)} km`
              : 'Loading...'
          },
          {
            label: 'Major Roads',
            color: '#3B82F6',
            width: 2.5,
            km: roadNetworkStats['Major Road'] !== undefined
              ? `${roadNetworkStats['Major Road'].toFixed(1)} km`
              : 'Loading...'
          },
          {
            label: 'Link Roads',
            color: '#94A3B8',
            width: 2,
            km: roadNetworkStats['Link Road'] !== undefined
              ? `${roadNetworkStats['Link Road'].toFixed(1)} km`
              : 'Loading...'
          },
        ],
      },
      road_safety: {
        name: activeRoadSafetySubLayer ? `${activeRoadSafetySubLayer.label} - iRAP Rating` : 'Road Safety iRAP Rating',
        type: 'line',
        classes: [
          {
            label: '5 Star (Safest)',
            color: '#93c060',
            rating: '5',
            width: 4,
            km: roadSafetyStats['5'] !== undefined ? `${roadSafetyStats['5'].toFixed(1)} km` : 'Loading...'
          },
          {
            label: '4 Star',
            color: '#fdf05e',
            rating: '4',
            width: 4,
            km: roadSafetyStats['4'] !== undefined ? `${roadSafetyStats['4'].toFixed(1)} km` : 'Loading...'
          },
          {
            label: '3 Star',
            color: '#eda308',
            rating: '3',
            width: 4,
            km: roadSafetyStats['3'] !== undefined ? `${roadSafetyStats['3'].toFixed(1)} km` : 'Loading...'
          },
          {
            label: '2 Star',
            color: '#e65336',
            rating: '2',
            width: 4,
            km: roadSafetyStats['2'] !== undefined ? `${roadSafetyStats['2'].toFixed(1)} km` : 'Loading...'
          },
          {
            label: '1 Star (High Risk)',
            color: '#262626',
            rating: '1',
            width: 4,
            km: roadSafetyStats['1'] !== undefined ? `${roadSafetyStats['1'].toFixed(1)} km` : 'Loading...'
          },
          {
            label: 'Not Applicable',
            color: '#9CA3AF',
            rating: 'NA',
            width: 4,
            km: roadSafetyStats['0'] !== undefined ? `${roadSafetyStats['0'].toFixed(1)} km` : 'Loading...'
          },
        ],
      },
    };

    // Add base layer legends
    activeBaseLayers.forEach(layerId => {
      // Exclude road_network_base
      if (layerId !== 'road_network_base' && baseLegends[layerId]) {
        activeLegends.push({
          id: layerId,
          legend: baseLegends[layerId],
        });
      }
    });

    // Add infrastructure legends (road network)
    activeInfraLayers.forEach(layerId => {
      // Skip road_network and road_safety here - road_safety will be added separately below
      if (layerId !== 'road_safety' && layerId !== 'road_network' && infraLegends[layerId]) {
        activeLegends.push({
          id: layerId,
          legend: infraLegends[layerId],
        });
      }
    });

    // Add road safety legend
    if (activeRoadSafetySubLayers.length > 0 && infraLegends['road_safety']) {
      activeLegends.push({
        id: 'road_safety',
        legend: infraLegends['road_safety'],
      });
    }

    // Add main hazard legend from CSV
    if (sector && activeLayer && scenario) {
      const csvEntries = getUILayerLegend(activeLayer, scenario);
      if (csvEntries.length > 0) {
        // Layer names mapping
        const layerNames: Record<string, string> = {
          'heat_hhi': 'Heat Stress Hazard Index (HHI) - Index Score',
          'heat_lst': 'Land Surface Temperature (LST) - °C',
          'heat_ast': 'Air Surface Temperature (AST) - °C',
          'heat_rh': 'Relative Humidity (RH) - %',
          'heat_wbt': 'Wet-Bulb Temperature (WBT) - °C',
          'heat_wbgt': 'Wet-Bulb Globe Temperature (WBGT) - °C',
          'heat_uhi': 'Urban Heat Island (UHI) - °C',
          'air_aqi': 'Air Quality Index (AQI) - Index Score',
          'air_pm25': 'PM2.5 (Fine Particles) - µg/m³',
          'air_pm10': 'PM10 (Coarse Particles) - µg/m³',
          'air_no2': 'NO₂ (Nitrogen Dioxide) - µg/m³',
          'air_so2': 'SO₂ (Sulfur Dioxide) - µg/m³',
          'air_co': 'CO (Carbon Monoxide) - mg/m³',
          'air_o3': 'O₃ (Ozone) - µg/m³',
          'flood_fhi': 'Urban Flooding (FHI) - Index Score',
          'flood_depth': 'Flood Depth',
          'flood_velocity': 'Flood Velocity',
          'flood_duration': 'Flood Duration',
          'flood_frequency': 'Flood Frequency',
          'flood_drainage': 'Drainage Capacity',
          'multihazard_assessment': 'Multi-Hazard Climate Risk - Index Score',
          // CWIS Bohol hazard layers
          'flood_hazard': 'Flood Hazard - Hazard Level',
          'storm_surge': 'Storm Surge - Inundation Depth',
          'urban_waterlogging': 'Urban Waterlogging - Susceptibility',
          'land_surface_temperature': 'Land Surface Temperature - °C',
          'urban_heat_island': 'Urban Heat Island - °C (Anomaly)',
          'wet_bulb_temperature': 'Wet-Bulb Temperature - °C',
          // Environmental / Sensitivity layers
          'soil_classification': 'Soil Classification - Soil Type',
          'groundwater_depth': 'Groundwater Depth - Depth (m)',
          'geology': 'Geology - Geological Type',
          'sinkhole': 'Sinkhole - Risk Level',
          // Data layers
          'elevation': 'Elevation Analysis - Metres (m)',
          'building_use': 'Building Use Distribution',
          'economic_vulnerability': 'Economic Vulnerability - Index Score',
        };

        const hazardLegend: Legend = {
          name: layerNames[activeLayer] || activeLayer,
          type: 'polygon',
          classes: csvEntries.map(entry => ({
            label: entry.label,
            color: entry.color,
            value: entry.description || undefined,
          })),
        };

        activeLegends.push({
          id: 'main',
          legend: hazardLegend,
        });
      }
    }

    // Building Height legend
    const heightClassMap: Record<string, { label: string; desc: string; color: string }> = {
      low_rise:       { label: 'Low Rise',       desc: '1–2 floors', color: '#6EE7B7' },
      mid_rise:       { label: 'Mid Rise',       desc: '3–4 floors', color: '#FCD34D' },
      high_rise:      { label: 'High Rise',      desc: '5–7 floors', color: '#FB923C' },
      very_high_rise: { label: 'Very High Rise', desc: '≥8 floors',   color: '#F87171' },
    };
    if (activeBuildingHeightCategories.length > 0) {
      activeLegends.push({
        id: 'building_height',
        legend: {
          name: 'Building Height',
          type: 'polygon',
          classes: activeBuildingHeightCategories
            .filter(id => heightClassMap[id])
            .map(id => ({ label: heightClassMap[id].label, color: heightClassMap[id].color, value: heightClassMap[id].desc })),
        },
      });
    }

    // Building Floor Area legend
    const areaClassMap: Record<string, { label: string; desc: string; color: string }> = {
      small:      { label: 'Small',      desc: '<50 m²',          color: '#93C5FD' },
      medium:     { label: 'Medium',     desc: '50–200 m²',       color: '#6EE7B7' },
      large:      { label: 'Large',      desc: '200–1,000 m²',    color: '#FDE68A' },
      very_large: { label: 'Very Large', desc: '>1,000 m²',       color: '#F9A8D4' },
    };
    if (activeBuildingAreaCategories.length > 0) {
      activeLegends.push({
        id: 'building_floor_area',
        legend: {
          name: 'Building Floor Area',
          type: 'polygon',
          classes: activeBuildingAreaCategories
            .filter(id => areaClassMap[id])
            .map(id => ({ label: areaClassMap[id].label, color: areaClassMap[id].color, value: areaClassMap[id].desc })),
        },
      });
    }

    console.log('📋 Print Layout - Active Legends:', activeLegends);
    return activeLegends;
  };

  const allLegends = getAllActiveLegends();

  // Function to get icon for each layer (matching FloatingLegendPanel)
  const getLayerIcon = (layerId: string, infraLayerId?: string) => {
    const { activeRoadSafetySubLayers = [] } = mapState;
    
    const roadSafetySubCategories: Record<string, { label: string; icon: any }> = {
      'irap_vehicle': { label: 'Vehicle Safety', icon: Car },
      'irap_motorcycle': { label: 'Motorcycle Safety', icon: Bike },
      'irap_bicycle': { label: 'Bicycle Safety', icon: Bike },
      'irap_pedestrian': { label: 'Pedestrian Safety', icon: User },
    };
    
    const activeRoadSafetySubLayer = activeRoadSafetySubLayers.length > 0 
      ? roadSafetySubCategories[activeRoadSafetySubLayers[0]]
      : null;
    
    // Base layers
    if (infraLayerId === 'slum_settlements') return Home;
    if (infraLayerId === 'builtup_density') return Building2;
    if (infraLayerId === 'built_up') return Building2;
    if (infraLayerId === 'elevation') return Mountain;
    if (infraLayerId === 'watershed') return Droplets;
    if (infraLayerId === 'road_network_base') return Route;
    
    // Infrastructure layers
    if (infraLayerId === 'road_network') return Route;
    if (infraLayerId === 'road_safety') {
      return activeRoadSafetySubLayer ? activeRoadSafetySubLayer.icon : ShieldAlert;
    }
    
    // Heat Stress icons
    if (layerId.includes('heat_hhi')) return Flame;
    if (layerId.includes('heat_lst')) return Sun;
    if (layerId.includes('heat_ast')) return Thermometer;
    if (layerId.includes('heat_rh')) return Droplets;
    if (layerId.includes('heat_wbgt')) return Gauge;
    if (layerId.includes('heat_wbt')) return ThermometerSun;
    if (layerId.includes('heat_uhi')) return Flame;
    
    // Air Pollution icons
    if (layerId.includes('air')) return Wind;
    
    // Flood icons
    if (layerId.includes('flood')) return Waves;
    
    // Multi Hazard icons
    if (layerId.includes('multihazard')) return AlertTriangle;
    
    // Default icon
    return Layers;
  };

  // Render using React Portal to ensure it's at the document root
  const modalContent = (
    <div 
      className="fixed inset-0 bg-white z-[99999] overflow-auto"
      onClick={(e) => {
        // Prevent any clicks from propagating to elements behind
        e.stopPropagation();
      }}
      onMouseDown={(e) => {
        // Prevent mouse events from propagating
        e.stopPropagation();
      }}
      onMouseUp={(e) => {
        // Prevent mouse events from propagating
        e.stopPropagation();
      }}
      onTouchStart={(e) => {
        // Prevent touch events from propagating
        e.stopPropagation();
      }}
      style={{ 
        pointerEvents: 'auto',
        isolation: 'isolate' // Create new stacking context
      }}
    >
      {/* Header - Hide on print */}
      <div className="bg-gray-900 text-white px-4 py-2 flex items-center justify-between print:hidden border-b border-gray-800">
        <h2 className="text-sm font-semibold">Print Layout</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadJPG}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            <Download className="size-3.5" />
            {isLoading ? 'Loading...' : 'Download JPG'}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-800 rounded-md transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* A4 Container - 297mm x 210mm */}
      <div className="flex items-center justify-center min-h-screen p-2 print:p-0 print:block print:min-h-0 bg-gray-100 print:bg-white">
        <div
          className="bg-white shadow-2xl print:shadow-none relative print:!w-[210mm] print:!h-[240mm] print:!max-w-none"
          style={{
            width: '100%',
            maxWidth: '900px',
            aspectRatio: '210 / 240',
            padding: '20px'
          }}
        >
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 print:hidden">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-semibold">Loading map...</p>
              </div>
            </div>
          )}

          {/* Title Bar */}
          <div className="mb-2">
            <h1 className="text-xl font-bold text-gray-900">
              {getMapTitle()}
            </h1>
            <p className="text-sm text-gray-600">{getMapSubtitle()}</p>
          </div>

          {/* Map Container */}
          <div 
            ref={mapContainerRef}
            className="relative bg-gray-200 border border-gray-800"
            style={{ height: 'calc(100% - 60px)' }}
          >
            {/* North Arrow - Top Right */}
            <div className="absolute top-4 right-4 z-20">
              {/* Simple circular compass with north arrow */}
              <svg width="35" height="35" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Outer circle */}
                <circle cx="25" cy="25" r="23" fill="none" stroke="#6B7280" strokeWidth="2.5"/>
                {/* North arrow triangle */}
                <path d="M25 8 L35 38 L25 33 L15 38 Z" fill="#6B7280"/>
              </svg>
            </div>

            {/* Legend Panel - Positioned on map (FloatingLegendPanel style) */}
            {allLegends.length > 0 && (
              <div className="absolute bottom-4 right-4 z-30 w-52">
                {/* Glassmorphism container */}
                <div className="bg-white/95 backdrop-blur-md border border-[#E5E7EB] rounded-lg shadow-2xl overflow-hidden">
                  {/* Header - Compact */}
                  <div className="bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] px-2 py-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3 h-3 text-white" />
                        <h3 className="text-white font-semibold text-[10px]">Legends</h3>
                      </div>
                    </div>
                  </div>

                  {/* Content - No scrolling */}
                  <div className="overflow-hidden">
                    <div className="p-1.5 space-y-2">
                      {allLegends.map(({ id, legend }, legendIndex) => {
                        const isPolygon = legend.type === 'polygon';
                        const LayerIcon = getLayerIcon(mapState.activeLayer || '', id);

                        return (
                          <div key={id} className="space-y-1">
                            {/* Legend Title - No box */}
                            <div className="flex items-center gap-1 px-1">
                              <LayerIcon className="w-3 h-3 text-[#2563EB]" />
                              <span className="text-[9px] font-semibold text-[#0F172A] truncate">
                                {legend.name}
                              </span>
                            </div>

                            {/* Legend Content - No box */}
                            <div className="px-1 space-y-1">
                              {isPolygon ? (
                                <div className="space-y-1">
                                  {legend.classes.map((cls, idx) => (
                                    <div key={idx} className="flex items-center gap-1.5">
                                      <div
                                        className="w-2.5 h-2.5 rounded shadow-sm flex-shrink-0"
                                        style={{ backgroundColor: cls.color }}
                                      />
                                      <div className="flex-1 min-w-0 flex items-center justify-between">
                                        {mapState.activeLayer?.includes('air') ? (
                                          <>
                                            <span className="text-[8px] text-[#1F2937] font-semibold flex-shrink-0">
                                              {cls.label}
                                            </span>
                                            <span className="text-[8px] text-[#6B7280] flex-shrink-0 ml-1.5">
                                              {cls.value}
                                            </span>
                                          </>
                                        ) : (
                                          <>
                                            <span className="text-[8px] text-[#1F2937] font-medium truncate">
                                              {cls.label}
                                            </span>
                                            {cls.value && (
                                              <span className="text-[8px] text-[#6B7280] flex-shrink-0 ml-1.5">
                                                {cls.value}
                                              </span>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  {legend.classes.map((cls, idx) => (
                                    <div key={idx} className="flex items-center gap-1.5">
                                      <div className="w-6 flex items-center justify-center flex-shrink-0">
                                        <div
                                          className="w-full rounded-full"
                                          style={{ 
                                            backgroundColor: cls.color,
                                            height: `${(cls.width || 1) * 0.8}px`
                                          }}
                                        />
                                      </div>
                                      <div className="flex-1 min-w-0 flex items-center justify-between">
                                        <span className="text-[8px] text-[#1F2937] font-medium truncate">
                                          {cls.label}
                                        </span>
                                        {cls.km && (
                                          <span className="text-[8px] text-[#6B7280] flex-shrink-0 ml-1.5">
                                            {cls.km}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print-specific styles */}
      <style>{`
        @media print {
          body {
            margin: 0 !important;
            padding: 0 !important;
          }
          @page {
            size: A4 landscape;
            margin: 0;
          }
        }
        
        /* Disable interactions with elements behind the modal */
        body {
          overflow: hidden !important;
        }
        
        /* Ensure the modal overlay blocks everything */
        .fixed.inset-0 {
          pointer-events: auto !important;
        }
      `}</style>
    </div>
  );

  return createPortal(modalContent, document.body);
}