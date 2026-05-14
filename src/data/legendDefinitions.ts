/**
 * Legend Definitions - Embedded Data
 * 
 * Contains all legend definitions for hazard layers and base layers.
 * This data was originally in CSV format but is now embedded directly
 * to avoid file loading issues in the Figma Make environment.
 * 
 * For base layers with custom styling (elevation, green_cover, built_up, etc.),
 * see /config/layerStyles.ts which maintains the source of truth for colors and classifications.
 */

export interface LegendEntry {
  gridcode: number;
  color: string;
  label: string;
  description: string;
}

export const LEGEND_DATA: Record<string, LegendEntry[]> = {
  // ═══════════════════════════════════════════════════════════════════════════════
  // BASE LAYERS (Synchronized with /config/layerStyles.ts)
  // ═══════════════════════════════════════════════════════════════════════════════
  
  'elevation': [
    { gridcode: 1, color: '#f6fd96', label: '0 - 10 m', description: 'Very Low Elevation' },
    { gridcode: 2, color: '#f5db6d', label: '10 - 20 m', description: 'Low Elevation' },
    { gridcode: 3, color: '#f1b841', label: '20 - 40 m', description: 'Medium Elevation' },
    { gridcode: 4, color: '#b96823', label: '40 - 60 m', description: 'High Elevation' },
    { gridcode: 5, color: '#7f0d05', label: '60 - 190 m', description: 'Very High Elevation' },
  ],

  'Builtup_Density': [
    { gridcode: 1, color: '#FFF5CE', label: '< 20%', description: 'Very Low Built-up' },
    { gridcode: 2, color: '#FFCC66', label: '20 – 40%', description: 'Low Built-up' },
    { gridcode: 3, color: '#FF9900', label: '40 – 60%', description: 'Moderate Built-up' },
    { gridcode: 4, color: '#CC4400', label: '60 – 80%', description: 'High Built-up' },
    { gridcode: 5, color: '#7F0000', label: '> 80%', description: 'Very High Built-up' },
  ],

  // ═══════════════════════════════════════════════════════════════════════════════
  // HEAT STRESS LAYERS
  // ═══════════════════════════════════════════════════════════════════════════════
  
  'AST_2025': [
    { gridcode: 1, color: '#FFFFCC', label: '< 28 °C', description: 'Safe' },
    { gridcode: 2, color: '#FED976', label: '28–31 °C', description: 'Caution' },
    { gridcode: 3, color: '#FD8D3C', label: '31–35 °C', description: 'Moderate' },
    { gridcode: 4, color: '#F43D25', label: '35–38 °C', description: 'High' },
    { gridcode: 5, color: '#800026', label: '≥ 38 °C', description: 'Extreme' },
  ],
  'AST_SSP1_2040': [
    { gridcode: 1, color: '#FFFFCC', label: '< 28 °C', description: 'Safe' },
    { gridcode: 2, color: '#FED976', label: '28–31 °C', description: 'Caution' },
    { gridcode: 3, color: '#FD8D3C', label: '31–35 °C', description: 'Moderate' },
    { gridcode: 4, color: '#F43D25', label: '35–38 °C', description: 'High' },
    { gridcode: 5, color: '#800026', label: '≥ 38 °C', description: 'Extreme' },
  ],
  'AST_SSP2_2040': [
    { gridcode: 1, color: '#FFFFCC', label: '< 28 °C', description: 'Safe' },
    { gridcode: 2, color: '#FED976', label: '28–31 °C', description: 'Caution' },
    { gridcode: 3, color: '#FD8D3C', label: '31–35 °C', description: 'Moderate' },
    { gridcode: 4, color: '#F43D25', label: '35–38 °C', description: 'High' },
    { gridcode: 5, color: '#800026', label: '≥ 38 °C', description: 'Extreme' },
  ],
  'AST_SSP5_2040': [
    { gridcode: 1, color: '#FFFFCC', label: '< 28 °C', description: 'Safe' },
    { gridcode: 2, color: '#FED976', label: '28–31 °C', description: 'Caution' },
    { gridcode: 3, color: '#FD8D3C', label: '31–35 °C', description: 'Moderate' },
    { gridcode: 4, color: '#F43D25', label: '35–38 °C', description: 'High' },
    { gridcode: 5, color: '#800026', label: '≥ 38 °C', description: 'Extreme' },
  ],

  'Air_AQI': [
    { gridcode: 1, color: '#5EAD5B', label: '0–50', description: 'Good' },
    { gridcode: 2, color: '#A3CE63', label: '51–100', description: 'Satisfactory' },
    { gridcode: 3, color: '#FBFE56', label: '101–200', description: 'Moderate' },
    { gridcode: 4, color: '#E69D39', label: '201–300', description: 'Poor' },
    { gridcode: 5, color: '#DC3022', label: '301–400', description: 'Very Poor' },
    { gridcode: 6, color: '#A52117', label: '> 401', description: 'Extreme' },
  ],
  'Air_CO': [
    { gridcode: 1, color: '#5EAD5B', label: '0 – 1.0', description: 'Good' },
    { gridcode: 2, color: '#A3CE63', label: '1.1 – 2.0', description: 'Satisfactory' },
    { gridcode: 3, color: '#FBFE56', label: '2.1 - 10', description: 'Moderate' },
    { gridcode: 4, color: '#E69D39', label: '10.1 - 17', description: 'Poor' },
    { gridcode: 5, color: '#DC3022', label: '17.1 - 34', description: 'Very Poor' },
    { gridcode: 6, color: '#A52117', label: '> 34', description: 'Extreme' },
  ],
  'Air_NO2': [
    { gridcode: 1, color: '#5EAD5B', label: '0 – 40', description: 'Good' },
    { gridcode: 2, color: '#A3CE63', label: '41 – 80', description: 'Satisfactory' },
    { gridcode: 3, color: '#FBFE56', label: '81 - 180', description: 'Moderate' },
    { gridcode: 4, color: '#E69D39', label: '181 - 280', description: 'Poor' },
    { gridcode: 5, color: '#DC3022', label: '281 - 400', description: 'Very Poor' },
    { gridcode: 6, color: '#A52117', label: '> 400', description: 'Extreme' },
  ],
  'Air_O3': [
    { gridcode: 1, color: '#5EAD5B', label: '0 – 50', description: 'Good' },
    { gridcode: 2, color: '#A3CE63', label: '51 – 100', description: 'Satisfactory' },
    { gridcode: 3, color: '#FBFE56', label: '101 - 168', description: 'Moderate' },
    { gridcode: 4, color: '#E69D39', label: '169 - 208', description: 'Poor' },
    { gridcode: 5, color: '#DC3022', label: '209 - 748', description: 'Very Poor' },
    { gridcode: 6, color: '#A52117', label: '> 748', description: 'Extreme' },
  ],
  'Air_PM10': [
    { gridcode: 1, color: '#5EAD5B', label: '0 – 50', description: 'Good' },
    { gridcode: 2, color: '#A3CE63', label: '51 – 100', description: 'Satisfactory' },
    { gridcode: 3, color: '#FBFE56', label: '101 – 250', description: 'Moderate' },
    { gridcode: 4, color: '#E69D39', label: '251 – 350', description: 'Poor' },
    { gridcode: 5, color: '#DC3022', label: '351– 430', description: 'Very Poor' },
    { gridcode: 6, color: '#A52117', label: '> 430', description: 'Extreme' },
  ],
  'Air_PM25': [
    { gridcode: 1, color: '#5EAD5B', label: '0 – 30', description: 'Good' },
    { gridcode: 2, color: '#A3CE63', label: '31 – 60', description: 'Satisfactory' },
    { gridcode: 3, color: '#FBFE56', label: '61 – 90', description: 'Moderate' },
    { gridcode: 4, color: '#E69D39', label: '91 – 120', description: 'Poor' },
    { gridcode: 5, color: '#DC3022', label: '121– 250', description: 'Very Poor' },
    { gridcode: 6, color: '#A52117', label: '> 250', description: 'Extreme' },
  ],
  'Air_SO2': [
    { gridcode: 1, color: '#5EAD5B', label: '0 – 40', description: 'Good' },
    { gridcode: 2, color: '#A3CE63', label: '41 – 80', description: 'Satisfactory' },
    { gridcode: 3, color: '#FBFE56', label: '81 – 380', description: 'Moderate' },
    { gridcode: 4, color: '#E69D39', label: '381 – 800', description: 'Poor' },
    { gridcode: 5, color: '#DC3022', label: '801– 1600', description: 'Very Poor' },
    { gridcode: 6, color: '#A52117', label: '> 1600', description: 'Extreme' },
  ],

  'Flood_Hazard': [
    { gridcode: 1, color: '#E1E1E1', label: 'No flood', description: 'No event' },
    { gridcode: 2, color: '#30CFFF', label: 'Low', description: '4-6 events' },
    { gridcode: 3, color: '#009FF7', label: 'Medium', description: '6-10 events' },
    { gridcode: 4, color: '#005CE6', label: 'High', description: '>10 events' },
  ],

  'HHI_2025': [
    { gridcode: 1, color: '#91CF60', label: 'Low', description: 'Comfortable/Manageable' },
    { gridcode: 2, color: '#FFFFBF', label: 'Moderate', description: 'Heat Stress Possible' },
    { gridcode: 3, color: '#FC8D59', label: 'High', description: 'Severe Heat Stress Likely' },
    { gridcode: 4, color: '#D73027', label: 'Extreme', description: 'Life-Threatening' },
  ],
  'HHI_SSP1_2040': [
    { gridcode: 1, color: '#91CF60', label: 'Low', description: 'Comfortable/Manageable' },
    { gridcode: 2, color: '#FFFFBF', label: 'Moderate', description: 'Heat Stress Possible' },
    { gridcode: 3, color: '#FC8D59', label: 'High', description: 'Severe Heat Stress Likely' },
    { gridcode: 4, color: '#D73027', label: 'Extreme', description: 'Life-Threatening' },
  ],
  'HHI_SSP2_2040': [
    { gridcode: 1, color: '#91CF60', label: 'Low', description: 'Comfortable/Manageable' },
    { gridcode: 2, color: '#FFFFBF', label: 'Moderate', description: 'Heat Stress Possible' },
    { gridcode: 3, color: '#FC8D59', label: 'High', description: 'Severe Heat Stress Likely' },
    { gridcode: 4, color: '#D73027', label: 'Extreme', description: 'Life-Threatening' },
  ],
  'HHI_SSP5_2040': [
    { gridcode: 1, color: '#91CF60', label: 'Low', description: 'Comfortable/Manageable' },
    { gridcode: 2, color: '#FFFFBF', label: 'Moderate', description: 'Heat Stress Possible' },
    { gridcode: 3, color: '#FC8D59', label: 'High', description: 'Severe Heat Stress Likely' },
    { gridcode: 4, color: '#D73027', label: 'Extreme', description: 'Life-Threatening' },
  ],

  'LST_2025': [
    { gridcode: 1, color: '#E0F3DB', label: '< 32 °C', description: 'Safe' },
    { gridcode: 2, color: '#FFFFBF', label: '32–36 °C', description: 'Caution' },
    { gridcode: 3, color: '#FEE08B', label: '36–40 °C', description: 'Moderate' },
    { gridcode: 4, color: '#FDAE61', label: '40–45 °C', description: 'High' },
    { gridcode: 5, color: '#D73027', label: '> 45 °C', description: 'Extreme' },
  ],
  'LST_SSP1_2040': [
    { gridcode: 1, color: '#E0F3DB', label: '< 32 °C', description: 'Safe' },
    { gridcode: 2, color: '#FFFFBF', label: '32–36 °C', description: 'Caution' },
    { gridcode: 3, color: '#FEE08B', label: '36–40 °C', description: 'Moderate' },
    { gridcode: 4, color: '#FDAE61', label: '40–45 °C', description: 'High' },
    { gridcode: 5, color: '#D73027', label: '> 45 °C', description: 'Extreme' },
  ],
  'LST_SSP2_2040': [
    { gridcode: 1, color: '#E0F3DB', label: '< 32 °C', description: 'Safe' },
    { gridcode: 2, color: '#FFFFBF', label: '32–36 °C', description: 'Caution' },
    { gridcode: 3, color: '#FEE08B', label: '36–40 °C', description: 'Moderate' },
    { gridcode: 4, color: '#FDAE61', label: '40–45 °C', description: 'High' },
    { gridcode: 5, color: '#D73027', label: '> 45 °C', description: 'Extreme' },
  ],
  'LST_SSP5_2040': [
    { gridcode: 1, color: '#E0F3DB', label: '< 32 °C', description: 'Safe' },
    { gridcode: 2, color: '#FFFFBF', label: '32–36 °C', description: 'Caution' },
    { gridcode: 3, color: '#FEE08B', label: '36–40 °C', description: 'Moderate' },
    { gridcode: 4, color: '#FDAE61', label: '40–45 °C', description: 'High' },
    { gridcode: 5, color: '#D73027', label: '> 45 °C', description: 'Extreme' },
  ],

  'Multi_Hazard_BBSR': [
    { gridcode: 1, color: '#91CF60', label: 'Low', description: 'Minimal Impact' },
    { gridcode: 2, color: '#FFFFBF', label: 'Moderate', description: 'Manageable Impact' },
    { gridcode: 3, color: '#FC8D59', label: 'High', description: 'Significant Impact' },
    { gridcode: 4, color: '#D73027', label: 'Very High', description: 'Severe Impact' },
  ],

  'RH_2025': [
    { gridcode: 1, color: '#AACDAB', label: '< 30%', description: 'Extremely Dry' },
    { gridcode: 2, color: '#F1FB7C', label: '30–40%', description: 'Very Dry' },
    { gridcode: 3, color: '#F9A248', label: '40–50%', description: 'Moderate RH' },
    { gridcode: 4, color: '#EF6C32', label: '50–60%', description: 'Elevated RH' },
    { gridcode: 5, color: '#B2182B', label: '> 60%', description: 'High RH' },
  ],

  'UHI_2025': [
    { gridcode: 1, color: '#38A1D0', label: '< 1 °C', description: 'Negligible' },
    { gridcode: 2, color: '#AACDAB', label: '1–2 °C', description: 'Mild' },
    { gridcode: 3, color: '#F1FB7C', label: '2–3 °C', description: 'Moderate' },
    { gridcode: 4, color: '#F9A248', label: '3–5 °C', description: 'High' },
    { gridcode: 5, color: '#EF2820', label: '≥ 5 °C', description: 'Extreme' },
  ],

  'WBGT_2025': [
    { gridcode: 1, color: '#FEE825', label: '< 28 °C', description: 'Safe' },
    { gridcode: 2, color: '#5DC963', label: '28–30 °C', description: 'Caution' },
    { gridcode: 3, color: '#21918D', label: '30–32 °C', description: 'Moderate' },
    { gridcode: 4, color: '#3B528C', label: '32–34 °C', description: 'High' },
    { gridcode: 5, color: '#440154', label: '> 34 °C', description: 'Extreme' },
  ],
  'WBGT_SSP1_2040': [
    { gridcode: 1, color: '#FEE825', label: '< 28 °C', description: 'Safe' },
    { gridcode: 2, color: '#5DC963', label: '28–30 °C', description: 'Caution' },
    { gridcode: 3, color: '#21918D', label: '30–32 °C', description: 'Moderate' },
    { gridcode: 4, color: '#3B528C', label: '32–34 °C', description: 'High' },
    { gridcode: 5, color: '#440154', label: '> 34 °C', description: 'Extreme' },
  ],
  'WBGT_SSP2_2040': [
    { gridcode: 1, color: '#FEE825', label: '< 28 °C', description: 'Safe' },
    { gridcode: 2, color: '#5DC963', label: '28–30 °C', description: 'Caution' },
    { gridcode: 3, color: '#21918D', label: '30–32 °C', description: 'Moderate' },
    { gridcode: 4, color: '#3B528C', label: '32–34 °C', description: 'High' },
    { gridcode: 5, color: '#440154', label: '> 34 °C', description: 'Extreme' },
  ],
  'WBGT_SSP5_2040': [
    { gridcode: 1, color: '#FEE825', label: '< 28 °C', description: 'Safe' },
    { gridcode: 2, color: '#5DC963', label: '28–30 °C', description: 'Caution' },
    { gridcode: 3, color: '#21918D', label: '30–32 °C', description: 'Moderate' },
    { gridcode: 4, color: '#3B528C', label: '32–34 °C', description: 'High' },
    { gridcode: 5, color: '#440154', label: '> 34 °C', description: 'Extreme' },
  ],

  'WBT_2025': [
    { gridcode: 1, color: '#FFF5EB', label: '< 25 °C', description: 'Safe' },
    { gridcode: 2, color: '#FDBE85', label: '25–28 °C', description: 'Caution' },
    { gridcode: 3, color: '#FD8D3C', label: '28–30 °C', description: 'Moderate' },
    { gridcode: 4, color: '#E6550D', label: '30–33 °C', description: 'High' },
    { gridcode: 5, color: '#7F2704', label: '≥ 33 °C', description: 'Extreme' },
  ],
  'WBT_SSP1_2040': [
    { gridcode: 1, color: '#FFF5EB', label: '< 25 °C', description: 'Safe' },
    { gridcode: 2, color: '#FDBE85', label: '25–28 °C', description: 'Caution' },
    { gridcode: 3, color: '#FD8D3C', label: '28–30 °C', description: 'Moderate' },
    { gridcode: 4, color: '#E6550D', label: '30–33 °C', description: 'High' },
    { gridcode: 5, color: '#7F2704', label: '≥ 33 °C', description: 'Extreme' },
  ],
  'WBT_SSP2_2040': [
    { gridcode: 1, color: '#FFF5EB', label: '< 25 °C', description: 'Safe' },
    { gridcode: 2, color: '#FDBE85', label: '25–28 °C', description: 'Caution' },
    { gridcode: 3, color: '#FD8D3C', label: '28–30 °C', description: 'Moderate' },
    { gridcode: 4, color: '#E6550D', label: '30–33 °C', description: 'High' },
    { gridcode: 5, color: '#7F2704', label: '≥ 33 °C', description: 'Extreme' },
  ],
  'WBT_SSP5_2040': [
    { gridcode: 1, color: '#FFF5EB', label: '< 25 °C', description: 'Safe' },
    { gridcode: 2, color: '#FDBE85', label: '25–28 °C', description: 'Caution' },
    { gridcode: 3, color: '#FD8D3C', label: '28–30 °C', description: 'Moderate' },
    { gridcode: 4, color: '#E6550D', label: '30–33 °C', description: 'High' },
    { gridcode: 5, color: '#7F2704', label: '≥ 33 °C', description: 'Extreme' },
  ],

  // ════════════════════���════════════════════════════════════════════════════════
  // CWIS CLIMATE HAZARD LAYERS (WorldBank Bohol - 6 layers)
  // ✅ Storm Surge: ENABLED (connected to GeoServer)
  // ⚠️ Other 5 layers: DISABLED (GeoServer layers not yet connected)
  // ═══════════════════════════════════════════════════════════════════════════════

  // ✅ STORM SURGE - ENABLED
  'StormSurge': [
    { gridcode: 1, color: '#08519C', label: 'SSA 1 (2–3 m)', description: 'Moderate surge' },
    { gridcode: 2, color: '#3182BD', label: 'SSA 2 (3–4 m)', description: 'High surge' },
    { gridcode: 3, color: '#6BAED6', label: 'SSA 3 (4–5 m)', description: 'Very high surge' },
    { gridcode: 4, color: '#BDD7E7', label: 'SSA 4 (>5 m)', description: 'Extreme surge' },
  ],

  // ✅ FLOOD HAZARD - ENABLED
  'FloodHazard': [
    { gridcode: 1, color: '#73DFFF', label: 'Low', description: 'Shallow flooding' },
    { gridcode: 2, color: '#00A9E6', label: 'Moderate', description: 'Moderate flooding' },
    { gridcode: 3, color: '#004C73', label: 'High', description: 'Deep or fast flooding' },
  ],

  // ✅ HEAT STRESS INDEX - HS_HSI
  'HS_HSI': [
    { gridcode: 1, color: '#1a9850', label: 'Low (HSI < 0.28)', description: 'Low heat stress' },
    { gridcode: 2, color: '#fee08b', label: 'Moderate (HSI 0.28–0.38)', description: 'Moderate heat stress' },
    { gridcode: 3, color: '#fdae61', label: 'High (HSI 0.38–0.50)', description: 'High heat stress' },
    { gridcode: 4, color: '#d73027', label: 'Extreme (HSI ≥ 0.50)', description: 'Extreme heat stress' },
  ],

  // ✅ LAND SURFACE TEMPERATURE - HS_LST
  'HS_LST': [
    { gridcode: 1, color: '#2c7bb6', label: 'Cool (< 28°C)', description: 'Cool surface' },
    { gridcode: 2, color: '#abd9e9', label: 'Mild (28–32°C)', description: 'Mild surface' },
    { gridcode: 3, color: '#ffffbf', label: 'Warm (32–36°C)', description: 'Warm surface' },
    { gridcode: 4, color: '#fdae61', label: 'Hot (36–40°C)', description: 'Hot surface' },
    { gridcode: 5, color: '#f46d43', label: 'Very hot (40–45°C)', description: 'Very hot surface' },
    { gridcode: 6, color: '#a50026', label: 'Extreme (> 45°C)', description: 'Extreme surface temperature' },
  ],

  // ✅ URBAN HEAT ISLAND - HS_UHI
  'HS_UHI': [
    { gridcode: 1, color: '#2166ac', label: 'Rural cool island (< -3°C)', description: 'Rural cool island' },
    { gridcode: 2, color: '#67a9cf', label: 'Slightly cooler (-3 to -1°C)', description: 'Slightly cooler than baseline' },
    { gridcode: 3, color: '#f7f7f7', label: 'Neutral (-1 to +1°C)', description: 'Neutral' },
    { gridcode: 4, color: '#fddbc7', label: 'Weak UHI (+1 to +3°C)', description: 'Weak urban heat island' },
    { gridcode: 5, color: '#ef8a62', label: 'Moderate UHI (+3 to +5°C)', description: 'Moderate urban heat island' },
    { gridcode: 6, color: '#b2182b', label: 'Strong UHI (> +5°C)', description: 'Strong urban heat island' },
  ],

  // ✅ WET BULB TEMPERATURE - HS_WBT
  'HS_WBT': [
    { gridcode: 1, color: '#2c7bb6', label: 'Safe (< 24°C)', description: 'Safe' },
    { gridcode: 2, color: '#abd9e9', label: 'Caution (24–27°C)', description: 'Caution' },
    { gridcode: 3, color: '#ffffbf', label: 'Extreme caution (27–30°C)', description: 'Extreme caution' },
    { gridcode: 4, color: '#fdae61', label: 'Danger (30–32°C)', description: 'Danger' },
    { gridcode: 5, color: '#d73027', label: 'Extreme danger (32–35°C)', description: 'Extreme danger' },
    { gridcode: 6, color: '#67001f', label: 'Survivability limit (> 35°C)', description: 'Survivability limit' },
  ],

  /* ⚠️ DISABLED - Urban Waterlogging not yet connected to GeoServer

  'UrbanWaterlogging': [
    { gridcode: 1, color: '#F7FCF0', label: 'Very Low', description: 'Minimal waterlogging susceptibility' },
    { gridcode: 2, color: '#C7E9C0', label: 'Low', description: 'Low waterlogging susceptibility' },
    { gridcode: 3, color: '#74C476', label: 'Moderate', description: 'Moderate waterlogging susceptibility' },
    { gridcode: 4, color: '#238B45', label: 'High', description: 'High waterlogging susceptibility' },
    { gridcode: 5, color: '#00441B', label: 'Very High', description: 'Very high waterlogging susceptibility' },
  ],
  */

  // ═══════════════════════════════════════════════════════════════════════════════
  // ENVIRONMENTAL SENSITIVITY LAYERS
  // ═══════════════════════════════════════════════════════════════════════════════
  
  'SoilClassification': [
    { gridcode: 1, color: '#F5DEB3', label: 'Beach Sand', description: 'High Infiltration' },
    { gridcode: 2, color: '#D2B48C', label: 'Bolinao Clay', description: 'Moderate Infiltration' },
    { gridcode: 3, color: '#A0826D', label: 'Faroan Clay', description: 'Low Infiltration' },
    { gridcode: 4, color: '#87CEEB', label: 'Hydrosol', description: 'Saturated Soil' },
  ],

  'GroundWater': [
    { gridcode: 1, color: '#8B4513', label: '0 – 2 m', description: 'Very Shallow Groundwater' },
    { gridcode: 2, color: '#D2B48C', label: '2 – 5 m', description: 'Shallow Groundwater' },
    { gridcode: 3, color: '#F5DEB3', label: '5 – 10 m', description: 'Moderate Groundwater Depth' },
    { gridcode: 4, color: '#B8D4C8', label: '10 – 25 m', description: 'Deep Groundwater' },
    { gridcode: 5, color: '#5F9EA0', label: '> 25 m', description: 'Very Deep Groundwater' },
  ],

  'Geology': [
    { gridcode: 1, color: '#6B7D8C', label: 'Alluvium', description: 'Unconsolidated Sediments' },
    { gridcode: 2, color: '#C9A876', label: 'Maribojoc Limestone', description: 'Karstic Limestone' },
  ],

  'GroundWater_Infiltration_Vulnerability': [
    { gridcode: 1, color: '#66BB6A', label: 'Low Vulnerability', description: 'Non-Karst / Alluvial Areas' },
    { gridcode: 2, color: '#FDD835', label: 'Moderate Vulnerability', description: 'Limestone (Karst Formation)' },
    { gridcode: 3, color: '#FB8C00', label: 'High Vulnerability', description: 'Limestone with Sinkhole Influence' },
    { gridcode: 4, color: '#C62828', label: 'Very High Vulnerability', description: 'Highly Permeable Karst (Sand + Sinkhole)' },
  ],

  'Sinkhole': [
    { gridcode: 1, color: '#D95F0E', label: 'Sinkhole Presence', description: 'Confirmed / Mapped Sinkhole Zones' },
    { gridcode: 2, color: '#F0F0F0', label: 'No Sinkhole Detected', description: 'No Identified Karst Collapse Features' },
  ],
};