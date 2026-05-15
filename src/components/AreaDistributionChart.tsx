import React, { useEffect, useState, useRef, useCallback } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from 'recharts';
import { Download, RotateCcw } from 'lucide-react';
import { motion, useSpring, useTransform, animate } from 'motion/react';
import { fetchAreaDistribution, type AreaDistributionData } from '../utils/areaCalculation';
import type { Sector, Scenario } from '../App';
import { generateChartFilename, downloadChartAsImage } from '../utils/chartDownload';

// Helper function to map layer IDs to display names
function getLayerDisplayName(layerId: string): string {
  const layerNames: Record<string, string> = {
    // Heat Stress layers
    'heat_hhi': 'Heat Stress Hazard Index',
    'heat_lst': 'Land Surface Temperature',
    'heat_ast': 'Air Surface Temperature',
    'heat_rh': 'Relative Humidity',
    'heat_wbt': 'Wet-Bulb Temperature',
    'heat_wbgt': 'Wet-Bulb Globe Temperature',
    'heat_uhi': 'Urban Heat Island',
    // Air Pollution layers
    'air_aqi': 'Air Quality Index',
    'air_no2': 'NO₂ (Nitrogen Dioxide)',
    'air_so2': 'SO₂ (Sulfur Dioxide)',
    'air_co': 'CO (Carbon Monoxide)',
    'air_o3': 'O₃ (Ozone)',
    'air_pm25': 'PM2.5',
    'air_pm10': 'PM10',
    // Flood layer
    'flood_fhi': 'Flood Waterlogging Hazard Index',
    // Multi Hazard layer
    'multihazard_assessment': 'Multi Hazard Assessment',
  };
  
  return layerNames[layerId] || 'Hazard';
}

// Simplified chart title - no longer includes layer name since it's in the main heading
function getChartTitle(layerId: string): string {
  return 'Impact Distribution';
}

// Format scenario for display
function formatScenario(scenario: Scenario): string {
  if (scenario === 'baseline_2025') return 'Baseline 2025';
  if (scenario === 'ssp1_2040') return 'SSP1 2040';
  if (scenario === 'ssp2_2040') return 'SSP2 2040';
  if (scenario === 'ssp5_2040') return 'SSP5 2040';
  return scenario;
}

// Helper function to brighten a color on hover
function brightenColor(color: string, percent: number = 20): string {
  // Convert hex to RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Increase brightness
  const newR = Math.min(255, r + (255 - r) * (percent / 100));
  const newG = Math.min(255, g + (255 - g) * (percent / 100));
  const newB = Math.min(255, b + (255 - b) * (percent / 100));
  
  // Convert back to hex
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0');
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}

interface AreaDistributionChartProps {
  activeSector: Sector;
  activeLayerId: string;
  scenario: Scenario;
  title: string;
  selectedWardId?: string;
  showLabelsInUI?: boolean; // Control whether to show labels in UI (always shown in PNG)
  year?: number; // Optional year for historical trends (overrides scenario)
  chartType?: 'donut' | 'bar'; // Chart type selection
  selectedCategory?: string | null; // Selected category for map filtering
  onCategorySelect?: (category: string | null) => void; // Callback when category is clicked
}

export function AreaDistributionChart({
  activeSector,
  activeLayerId,
  scenario,
  title,
  selectedWardId,
  showLabelsInUI = true,
  year,
  chartType = 'donut',
  selectedCategory = null,
  onCategorySelect
}: AreaDistributionChartProps) {
  const [areaData, setAreaData] = useState<AreaDistributionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalArea, setTotalArea] = useState(0);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Store animated percentage values for smooth counting
  const [animatedPercentages, setAnimatedPercentages] = useState<{ [key: string]: number }>({});
  const animationStartTimeRef = useRef<number>(0);
  const animationStartValuesRef = useRef<{ [key: string]: number }>({});
  const animationTargetValuesRef = useRef<{ [key: string]: number }>({});
  const [animationTick, setAnimationTick] = useState(0); // Force re-renders
  const isFirstRenderRef = useRef(true); // Track first render for bar animation
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  
  // Animated label component that counts the percentage smoothly
  const AnimatedBarLabel = (props: any) => {
    const { x, y, width, height, value, index } = props;
    
    const dataItem = areaData[index];
    if (!dataItem) return null;
    
    const targetPercentage = dataItem?.percentage ? parseFloat(dataItem.percentage) : 0;
    // REMOVED: Don't hide label for 0% values - show "0.0%" instead
    // if (targetPercentage === 0) return null;
    
    const labelX = x + width / 2;
    const isSmallBar = height < 20;
    const labelY = isSmallBar ? y - 7 : y + 7;
    
    const categoryKey = dataItem.name;
    const displayPercentage = animatedPercentages[categoryKey] ?? targetPercentage;
    
    // Change label color based on hover state
    const isHovered = hoveredBarIndex === index;
    const labelColor = isHovered ? '#0F172A' : '#64748B'; // Dark when hovered, lighter gray normally

    return (
      <g>
        <text
          x={labelX}
          y={labelY}
          fill={labelColor}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="9"
          fontWeight="600"
          fontFamily="Inter, sans-serif"
          style={{ transition: 'fill 0.2s ease' }}
        >
          {displayPercentage.toFixed(1)}%
        </text>
      </g>
    );
  };
  
  // Animate percentages when data changes
  useEffect(() => {
    if (areaData.length === 0 || chartType !== 'bar') return;
    
    console.log('📊 Starting percentage animation for new data');
    
    // Set up animation start/target values
    const startTime = Date.now();
    animationStartTimeRef.current = startTime;
    
    areaData.forEach(item => {
      const key = item.name;
      const targetValue = parseFloat(item.percentage || '0');
      const startValue = animatedPercentages[key] ?? 0; // Start from current or 0
      
      animationStartValuesRef.current[key] = startValue;
      animationTargetValuesRef.current[key] = targetValue;
    });
    
    // Animation loop
    const duration = 300; // Match Recharts
    let animationFrameId: number;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-in-out
      const easeProgress = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      const newPercentages: { [key: string]: number } = {};
      
      areaData.forEach(item => {
        const key = item.name;
        const startValue = animationStartValuesRef.current[key] ?? 0;
        const targetValue = animationTargetValuesRef.current[key] ?? 0;
        newPercentages[key] = startValue + (targetValue - startValue) * easeProgress;
      });
      
      setAnimatedPercentages(newPercentages);
      setAnimationTick(prev => prev + 1); // Force chart re-render
      
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        console.log('✅ Animation complete');
      }
    };
    
    animationFrameId = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [areaData, chartType]);

  const handleDownload = async () => {
    if (!chartContainerRef.current || isDownloading) return;
    
    console.log('🎨 Starting download, setting isDownloading to true');
    setIsDownloading(true);
    
    // Much longer delay to ensure React re-renders the chart with labels
    await new Promise(resolve => setTimeout(resolve, 800));
    
    try {
      const filename = generateChartFilename(
        activeSector,
        'IMPACT_DISTRIBUTION',
        scenario,
        selectedWardId
      );
      console.log('📸 Capturing chart with labels visible');
      await downloadChartAsImage(chartContainerRef.current, filename);
    } catch (error) {
      console.error('Failed to download chart:', error);
    } finally {
      console.log('✅ Download complete, setting isDownloading to false');
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    let isCancelled = false;
    
    // Keep old data visible - don't clear anything
    setError(null);

    console.log('📊 AreaDistributionChart: Fetching data for', { activeSector, activeLayerId, scenario, year });

    fetchAreaDistribution(activeSector, activeLayerId, scenario, selectedWardId, year)
      .then(data => {
        if (isCancelled) return; // Don't update state if component unmounted or deps changed
        
        console.log('✅ AreaDistributionChart: Received data:', data);
        
        // Calculate total area
        const total = data.reduce((sum, item) => sum + item.value, 0);
        
        // Sort by gridcode (ascending) and add percentage to each item
        const dataWithPercentage = data
          .sort((a, b) => (a.gridcode || 0) - (b.gridcode || 0))
          .map(item => ({
            ...item,
            percentage: ((item.value / total) * 100).toFixed(1),
            percentageValue: (item.value / total) * 100 // Numeric percentage for bar chart
          }));
        
        console.log('📊 Sorted data by gridcode:', dataWithPercentage.map(d => ({ name: d.name, gridcode: d.gridcode })));
        console.log('📊 Data with percentage:', dataWithPercentage.map(d => ({ name: d.name, percentage: d.percentage, value: d.value })));
        
        // Update data - this triggers smooth animation
        setAreaData(dataWithPercentage);
        setTotalArea(total);
        isFirstRenderRef.current = false; // Disable bar animation after first render
      })
      .catch(err => {
        if (isCancelled) return; // Don't update state if component unmounted or deps changed
        
        // Don't show error for "Failed to fetch" - just log it as warning
        if (err instanceof TypeError && err.message === 'Failed to fetch') {
          console.warn('⚠️ AreaDistributionChart: Network error or layer not available');
          setError(null); // Don't show error UI for expected network issues
          setAreaData([]); // Clear data to show "No data" message
        } else {
          console.error('❌ AreaDistributionChart: Error fetching data:', err);
          setError('Failed to load area data');
        }
      });
    
    return () => {
      isCancelled = true;
    };
  }, [activeSector, activeLayerId, scenario, selectedWardId, year]);

  return (
    null
  );
}

// Custom Tooltip Component
function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    return (
      <div className="bg-white rounded px-2 py-1.5 shadow-lg border border-[#E2E8F0]">
        <div className="flex items-center gap-1.5 mb-0.5">
          <div 
            className="w-2 h-2 rounded-sm flex-shrink-0" 
            style={{ backgroundColor: data.color }}
          />
          <span className="text-white text-[10px] font-medium">{data.name}</span>
        </div>
        <div className="text-[9px] text-white font-medium pl-3.5">
          {data.value.toFixed(2)} km² ({data.percentage}%)
        </div>
      </div>
    );
  }
  return null;
}

// Custom label component for PNG download
function renderCustomLabel(props: any) {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
  
  console.log('🏷️ renderCustomLabel called with percent:', percent);
  
  // Only show label if percentage is >= 5% to avoid clutter
  const percentValue = percent * 100; // percent is a decimal (0.15 = 15%)
  
  console.log('🏷️ percentValue:', percentValue, 'will render:', percentValue >= 5);
  
  if (percentValue < 5) return null;
  
  const RADIAN = Math.PI / 180;
  // Position label between inner and outer radius
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
  console.log('🏷️ Rendering label at position:', { x, y }, 'text:', `${Math.round(percentValue)}%`);
  
  return (
    <g>
      {/* Stroke/outline for readability */}
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fill="none"
        stroke="rgba(0,0,0,0.5)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fontSize="12"
        fontWeight="700"
        fontFamily="Inter, sans-serif"
      >
        {Math.round(percentValue)}%
      </text>
      {/* Main white text */}
      <text
        x={x}
        y={y}
        fill="#ffffff"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="12"
        fontWeight="700"
        fontFamily="Inter, sans-serif"
      >
        {Math.round(percentValue)}%
      </text>
    </g>
  );
}