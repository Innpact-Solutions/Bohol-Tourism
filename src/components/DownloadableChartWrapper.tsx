/**
 * Reusable wrapper component that adds download functionality to charts
 */

import React, { useRef, useState, ReactNode } from 'react';
import { Download } from 'lucide-react';
import { generateChartFilename, downloadChartAsImage } from '../utils/chartDownload';

interface DownloadableChartWrapperProps {
  children: ReactNode;
  sector: string;
  chartType: string;
  scenario: string;
  wardId?: string;
  className?: string;
}

export function DownloadableChartWrapper({
  children,
  sector,
  chartType,
  scenario,
  wardId,
  className = ''
}: DownloadableChartWrapperProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!chartRef.current || isDownloading) return;
    
    setIsDownloading(true);
    try {
      const filename = generateChartFilename(sector, chartType, scenario, wardId);
      await downloadChartAsImage(chartRef.current, filename);
    } catch (error) {
      console.error('Failed to download chart:', error);
      alert('Failed to download chart. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div ref={chartRef}>
        {children}
      </div>
      
      {/* Compact Download Button */}
      <button
        className="absolute top-2 right-2 z-20 bg-white/90 backdrop-blur-sm rounded p-1 shadow-sm hover:bg-white hover:shadow-md transition-all duration-200 border border-gray-200/50 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleDownload}
        disabled={isDownloading}
        title="Download chart as JPG"
      >
        <Download className="w-3 h-3 text-gray-600" />
      </button>
    </div>
  );
}
