/**
 * Climate Scenario Comparison Chart
 * Custom animated chart with bars, connecting line, and animated dots
 */

import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Check, Leaf, TrendingUp, Flame, Download } from 'lucide-react';
import { generateChartFilename, downloadChartAsImage } from '../utils/chartDownload';

interface ScenarioData {
  name: string;
  area: number;
  fill: string;
  percentage: number;
}

interface Props {
  data: ScenarioData[];
  sector: string;
  scenario: string;
  wardId?: string;
}

// Get icon for each scenario (matching left panel icons)
function getScenarioIcon(name: string, color: string) {
  const iconProps = { size: 12, strokeWidth: 2.5, color };
  
  if (name.includes('Baseline')) return <Check {...iconProps} />;
  if (name.includes('SSP1')) return <Leaf {...iconProps} />;
  if (name.includes('SSP2')) return <TrendingUp {...iconProps} />;
  if (name.includes('SSP5')) return <Flame {...iconProps} />;
  return null;
}

export function ClimateScenarioComparison({ data, sector, scenario, wardId }: Props) {
  const [animatedPoints, setAnimatedPoints] = useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const maxArea = Math.max(...data.map(d => d.area));
  
  // Create a stable key from data to prevent unnecessary re-animations
  const dataKey = JSON.stringify(data.map(d => ({ name: d.name, area: d.area })));

  const handleDownload = async () => {
    if (!chartContainerRef.current || isDownloading) return;
    
    setIsDownloading(true);
    try {
      const filename = generateChartFilename(sector, 'SCENARIO_COMPARISON', scenario, wardId);
      await downloadChartAsImage(chartContainerRef.current, filename);
    } catch (error) {
      console.error('Failed to download chart:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  // Animate points appearing one by one
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    // Reset animation
    setAnimatedPoints([]);
    
    // Animate each point with delay - faster animation
    data.forEach((_, index) => {
      const timer = setTimeout(() => {
        setAnimatedPoints(prev => [...prev, index]);
      }, index * 450); // 450ms delay between each point for faster animation
      
      timers.push(timer);
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [dataKey]); // Only re-animate when data actually changes

  return (
    <div className="border border-[#E5E7EB] rounded-lg p-2 bg-white shadow-sm mb-3" ref={chartContainerRef}>
      <h3 className="text-[11px] font-semibold text-[#0F172A] mb-2">Heat Stress Hotspots over Scenarios</h3>
      
      <div ref={containerRef} className="relative">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart 
            data={data} 
            margin={{ top: 35, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 9, fill: '#64748B', fontWeight: 500 }}
              interval={0}
              angle={-15}
              textAnchor="end"
              height={40}
            />
            <YAxis 
              tick={{ fontSize: 9, fill: '#64748B' }}
              domain={[0, maxArea * 1.1]}
              tickFormatter={(value) => Math.round(value).toString()}
              width={35}
              label={{ value: 'km²', angle: -90, position: 'insideLeft', style: { fontSize: 9, fill: '#64748B' } }}
            />
            <Tooltip
              wrapperStyle={{ zIndex: 1000 }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-gray-900 rounded-lg px-3 py-2 shadow-xl border border-gray-700" style={{ zIndex: 1000 }}>
                      <div className="text-[10px] font-semibold text-white mb-1">{data.name}</div>
                      <div className="text-[11px] text-white font-bold">{data.area.toFixed(2)} km²</div>
                      <div className="text-[9px] text-gray-300 mt-0.5">{data.percentage.toFixed(2)}% of total area</div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar 
              dataKey="area" 
              radius={[6, 6, 0, 0]}
              maxBarSize={80}
              animationDuration={400}
              animationBegin={0}
              animationEasing="ease-out"
              isAnimationActive={false}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.fill}
                  style={{
                    opacity: animatedPoints.includes(index) ? 1 : 0,
                    transform: animatedPoints.includes(index) ? 'scaleY(1)' : 'scaleY(0)',
                    transformOrigin: 'bottom',
                    transition: `all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.45}s`
                  }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Custom SVG overlay for animated line and dots */}
        <svg 
          className="absolute top-0 left-0 pointer-events-none"
          style={{ width: '100%', height: '180px' }}
        >
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#94A3B8" />
              <stop offset="33%" stopColor="#6EE7B7" />
              <stop offset="66%" stopColor="#FCD34D" />
              <stop offset="100%" stopColor="#FCA5A5" />
            </linearGradient>
          </defs>

          {/* Draw connecting line segments */}
          {data.map((point, index) => {
            if (index === 0 || !animatedPoints.includes(index)) return null;
            
            const prevPoint = data[index - 1];
            const chartWidth = containerRef.current?.offsetWidth || 0;
            const chartHeight = 180;
            const margin = { top: 35, right: 10, left: 25, bottom: 40 };
            const plotWidth = chartWidth - margin.left - margin.right;
            const plotHeight = chartHeight - margin.top - margin.bottom;
            
            // Calculate x positions (centered on each bar)
            const barWidth = plotWidth / data.length;
            const x1 = margin.left + (index - 1) * barWidth + barWidth / 2;
            const x2 = margin.left + index * barWidth + barWidth / 2;
            
            // Calculate y positions based on area value (same scale as bars)
            const maxValue = maxArea * 1.1;
            const y1 = margin.top + plotHeight - (prevPoint.area / maxValue) * plotHeight;
            const y2 = margin.top + plotHeight - (point.area / maxValue) * plotHeight;
            
            return (
              <g key={`line-${index}`}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="url(#lineGradient)"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: 200,
                    strokeDashoffset: 200,
                    animation: `drawLine 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${(index - 1) * 0.45 + 0.25}s forwards`
                  }}
                />
              </g>
            );
          })}

          {/* Draw animated dots and labels */}
          {data.map((point, index) => {
            if (!animatedPoints.includes(index)) return null;
            
            const chartWidth = containerRef.current?.offsetWidth || 0;
            const chartHeight = 180;
            const margin = { top: 35, right: 10, left: 25, bottom: 40 };
            const plotWidth = chartWidth - margin.left - margin.right;
            const plotHeight = chartHeight - margin.top - margin.bottom;
            
            const barWidth = plotWidth / data.length;
            const x = margin.left + index * barWidth + barWidth / 2;
            
            // Calculate y position based on area value (same scale as bars)
            const maxValue = maxArea * 1.1;
            const y = margin.top + plotHeight - (point.area / maxValue) * plotHeight;
            
            return (
              <g key={`dot-${index}`}>
                {/* Outer pulse circle */}
                <circle
                  cx={x}
                  cy={y}
                  r={8}
                  fill={point.fill}
                  opacity={0.3}
                  style={{
                    animation: `pulse 0.9s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.45}s`
                  }}
                />
                
                {/* Main dot */}
                <circle
                  cx={x}
                  cy={y}
                  r={5}
                  fill={point.fill}
                  stroke="#fff"
                  strokeWidth={2}
                  style={{
                    animation: `popIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.45}s backwards`
                  }}
                />
                
                {/* Percentage label - dark grey, positioned just below the dot */}
                <text
                  x={x}
                  y={y + 18}
                  fill="#4B5563"
                  fontSize={10}
                  fontWeight={600}
                  textAnchor="middle"
                  style={{
                    animation: `fadeInUp 0.35s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.45 + 0.2}s backwards`
                  }}
                >
                  {point.percentage.toFixed(1)}%
                </text>
              </g>
            );
          })}
        </svg>

        {/* Animated scenario icons */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          {data.map((point, index) => {
            if (!animatedPoints.includes(index)) return null;
            
            const chartWidth = containerRef.current?.offsetWidth || 0;
            const margin = { left: 25 };
            const plotWidth = chartWidth - margin.left - 10;
            const barWidth = plotWidth / data.length;
            const x = margin.left + index * barWidth + barWidth / 2;
            
            return (
              <div
                key={`icon-${index}`}
                className="absolute"
                style={{
                  left: `${x}px`,
                  top: '8px',
                  transform: 'translateX(-50%)',
                  animation: `smoothSlideIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.45 + 0.15}s backwards`
                }}
              >
                <div 
                  className="rounded-full p-1 shadow-md"
                  style={{ 
                    backgroundColor: point.fill,
                    border: '2px solid white'
                  }}
                >
                  {getScenarioIcon(point.name, '#fff')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes drawLine {
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes popIn {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes pulse {
          0% {
            r: 5;
            opacity: 0.6;
          }
          100% {
            r: 15;
            opacity: 0;
          }
        }

        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes smoothSlideIn {
          0% {
            transform: translateX(-50%) translateY(-10px);
            opacity: 0;
          }
          100% {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }
      `}</style>

      {/* Download button */}
      <button
        className="absolute top-2 right-2 bg-gray-100 rounded-full p-1 shadow-md"
        onClick={handleDownload}
      >
        <Download size={14} color="#0F172A" />
      </button>
    </div>
  );
}