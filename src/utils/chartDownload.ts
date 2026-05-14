/**
 * Utility functions for downloading charts as images
 */

/**
 * Generate a filename for chart downloads
 * Format: {SECTOR}_{CHART_TYPE}_{SCENARIO}_{YEAR}_BBSR.png
 */
export function generateChartFilename(
  sector: string,
  chartType: string,
  scenario: string,
  wardId?: string
): string {
  // Map sector codes to uppercase abbreviations
  const sectorCodes: Record<string, string> = {
    'heat': 'HEAT',
    'air': 'AIR',
    'flood': 'FLOOD',
    'multi': 'MULTI',
    'multihazard': 'MULTI'
  };

  // Extract scenario type and year from scenario string
  let scenarioCode = 'BASELINE';
  let year = '2025';
  
  if (scenario.startsWith('baseline_')) {
    scenarioCode = 'BASELINE';
    const yearMatch = scenario.match(/(\d{4})/);
    year = yearMatch ? yearMatch[1] : '2025';
  } else if (scenario.startsWith('ssp')) {
    const sspMatch = scenario.match(/^ssp(\d+)_(\d{4})$/);
    if (sspMatch) {
      scenarioCode = `SSP${sspMatch[1]}`;
      year = sspMatch[2];
    }
  }

  const sectorCode = sectorCodes[sector] || sector.toUpperCase();
  const chartTypeCode = chartType.toUpperCase().replace(/\s+/g, '_');
  
  // Add ward suffix if specific ward is selected
  const wardSuffix = wardId && wardId !== 'all' ? `_WARD${wardId.replace(/^ward_/i, '')}` : '';
  
  return `${sectorCode}_${chartTypeCode}_${scenarioCode}_${year}_BBSR${wardSuffix}.png`;
}

/**
 * Download a chart element as PNG with transparent background
 */
export async function downloadChartAsImage(
  elementRef: HTMLElement,
  filename: string
): Promise<void> {
  try {
    console.log('📊 Starting chart download:', filename);
    console.log('📸 Rendering with modern-screenshot...');
    
    // Use modern-screenshot directly on the original element (not a clone)
    // This ensures all dynamically rendered content (like Recharts labels) is captured
    const { domToPng } = await import('modern-screenshot');
    
    // Convert to PNG with transparent background
    const dataUrl = await domToPng(elementRef, {
      scale: 3,
      filter: (node: HTMLElement) => {
        // Skip WebGL canvases (map elements)
        if (node.tagName === 'CANVAS' && node.classList?.contains('maplibregl-canvas')) {
          return false;
        }
        return true;
      }
    });
    
    console.log('💾 Saving image...');
    
    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    
    // Download the blob
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    console.log('✅ Chart downloaded successfully:', filename);
    
  } catch (error) {
    console.error('❌ Error downloading chart:', error);
    throw error;
  }
}