import { fetchAreaDistribution } from './areaCalculation';
import type { Sector, Scenario } from '../types';

export interface HistoricalTrendsData {
  year: number;
  gridcode3: number; // Percentage for 2nd highest severity
  gridcode4: number; // Percentage for highest severity
  gridcode3Color: string;
  gridcode4Color: string;
  gridcode3Label: string;
  gridcode4Label: string;
}

/**
 * Fetch historical trends data for a specific layer across all years (2015-2025)
 * Returns the last 2 gridcodes separately (e.g., for HHI: gridcodes 3, 4)
 * 
 * @param layerId - Layer ID (e.g., 'heat_hhi', 'heat_lst', 'heat_ast')
 * @param wardId - Optional ward filter (e.g., 'ward_1' or 'all')
 * @returns Array of yearly data with last 2 gridcodes from 2015 to 2025
 */
export async function fetchHistoricalTrends(
  layerId: string,
  wardId?: string
): Promise<HistoricalTrendsData[]> {
  try {
    console.log(`📊 [HistoricalTrendsAPI] Fetching data for ${layerId}, ward: ${wardId || 'all'}`);
    
    // Extract layer type from layerId (e.g., 'heat_hhi' -> 'HHI')
    const layerType = layerId.split('_')[1]?.toUpperCase() || 'HHI';
    
    const years = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
    const results: HistoricalTrendsData[] = [];
    
    // Fetch area distribution for each year
    for (const year of years) {
      try {
        console.log(`📊 [HistoricalTrendsAPI] Fetching year ${year}...`);
        
        const areaData = await fetchAreaDistribution(
          'heat' as Sector,
          layerId,
          'baseline_2025' as Scenario, // Scenario doesn't matter when year is provided
          wardId && wardId !== 'all' ? wardId : undefined,
          year
        );
        
        console.log(`📊 [HistoricalTrendsAPI] Year ${year} data:`, areaData);
        
        // Calculate total area for percentage calculation
        const totalArea = areaData.reduce((sum, item) => sum + item.value, 0);
        console.log(`📊 [HistoricalTrendsAPI] Year ${year} total area:`, totalArea);
        
        // Sort by gridcode to identify the last 2 gridcodes
        const sortedByGridcode = [...areaData].sort((a, b) => (a.gridcode || 0) - (b.gridcode || 0));
        
        console.log(`📊 [HistoricalTrendsAPI] Year ${year} sorted gridcodes:`, sortedByGridcode.map(d => ({ gridcode: d.gridcode, name: d.name, value: d.value })));
        
        // Get the last 2 gridcodes (highest severity levels)
        const lastTwo = sortedByGridcode.slice(-2);
        
        console.log(`📊 [HistoricalTrendsAPI] Year ${year} last two gridcodes:`, lastTwo.map(d => ({ 
          gridcode: d.gridcode, 
          name: d.name, 
          value: d.value,
          color: d.color,
          percentage: totalArea > 0 ? ((d.value / totalArea) * 100).toFixed(2) : '0'
        })));
        
        // Extract percentages and metadata for each of the last 2 gridcodes
        // The data already has the correct colors and names from the server
        const gridcode3Data = lastTwo[0] || { value: 0, gridcode: 0, color: '#FC8D59', name: 'N/A' };
        const gridcode4Data = lastTwo[1] || { value: 0, gridcode: 0, color: '#D73027', name: 'N/A' };
        
        results.push({
          year,
          gridcode3: totalArea > 0 ? parseFloat(((gridcode3Data.value / totalArea) * 100).toFixed(2)) : 0,
          gridcode4: totalArea > 0 ? parseFloat(((gridcode4Data.value / totalArea) * 100).toFixed(2)) : 0,
          gridcode3Color: gridcode3Data.color,
          gridcode4Color: gridcode4Data.color,
          gridcode3Label: gridcode3Data.name,
          gridcode4Label: gridcode4Data.name
        });
      } catch (error) {
        console.error(`❌ [HistoricalTrendsAPI] Error fetching year ${year}:`, error);
        // Add zero values for missing years
        results.push({
          year,
          gridcode3: 0,
          gridcode4: 0,
          gridcode3Color: '#FC8D59',
          gridcode4Color: '#D73027',
          gridcode3Label: 'N/A',
          gridcode4Label: 'N/A'
        });
      }
    }
    
    console.log(`✅ [HistoricalTrendsAPI] Final results:`, results);
    
    return results;
  } catch (error) {
    console.error(`❌ [HistoricalTrendsAPI] Error fetching data:`, error);
    throw error;
  }
}