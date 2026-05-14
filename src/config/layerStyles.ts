/**
 * Layer Styles Configuration
 * 
 * This file defines the color schemes and classifications for all map layers.
 * Modifying this file will automatically update:
 * - GeoServer layer styling (via SLD)
 * - Floating legend panel colors and labels
 * - Any other UI components that reference these styles
 * 
 * 🔒 CRITICAL: Keep this file in sync with GeoServer SLD styles
 */

export interface LayerStyleEntry {
  value: string;          // Classification value or range (e.g., "0 - 10 m")
  color: string;          // Hex color code (e.g., "#f6fd96")
  label: string;          // Display label for legend
  description?: string;   // Optional description
  gridcode?: number;      // Optional grid code for raster layers
}

export interface LayerStyleDefinition {
  layerId: string;                    // Layer ID (e.g., "elevation")
  layerName: string;                  // Display name
  type: 'polygon' | 'raster' | 'line' | 'point';  // Geometry type
  propertyName?: string;              // GeoServer property name for classification
  styles: LayerStyleEntry[];          // Classification entries
}

/**
 * Layer Styles Configuration
 * Add new layer styles here - they will automatically appear in the legend
 */
export const LAYER_STYLES: Record<string, LayerStyleDefinition> = {
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // BASE LAYERS
  // ═══════════════════════════════════════════════════════════════════════════════
  
  elevation: {
    layerId: 'elevation',
    layerName: 'Elevation',
    type: 'polygon',
    propertyName: 'Elevation',
    styles: [
      {
        value: '0 - 10 m',
        color: '#f6fd96',
        label: '0 - 10 m',
        description: 'Very Low Elevation'
      },
      {
        value: '10 - 20 m',
        color: '#f5db6d',
        label: '10 - 20 m',
        description: 'Low Elevation'
      },
      {
        value: '20 - 40 m',
        color: '#f1b841',
        label: '20 - 40 m',
        description: 'Medium Elevation'
      },
      {
        value: '40 - 60 m',
        color: '#b96823',
        label: '40 - 60 m',
        description: 'High Elevation'
      },
      {
        value: '60 - 190 m',
        color: '#7f0d05',
        label: '60 - 190 m',
        description: 'Very High Elevation'
      }
    ]
  },

  // builtup_density: {
  //   layerId: 'builtup_density',
  //   layerName: 'Green Cover',
  //   type: 'polygon',
  //   propertyName: 'Type',
  //   styles: [
  //     {
  //       value: 'Dense Forest',
  //       color: '#1a5d1a',
  //       label: 'Dense Forest',
  //       description: 'High vegetation density'
  //     },
  //     // Add more classifications as needed
  //   ]
  // },

  // built_up: {
  //   layerId: 'built_up',
  //   layerName: 'Built-up Area',
  //   type: 'polygon',
  //   propertyName: 'Type',
  //   styles: [
  //     {
  //       value: 'Residential',
  //       color: '#e8b4b8',
  //       label: 'Residential',
  //       description: 'Residential buildings'
  //     },
  //     // Add more classifications as needed
  //   ]
  // },

  // ═══════════════════════════════════════════════════════════════════════════════
  // ENVIRONMENTAL SENSITIVITY LAYERS
  // ═══════════════════════════════════════════════════════════════════════════════
  
  // soil_classification: {
  //   layerId: 'soil_classification',
  //   layerName: 'Soil Classification',
  //   type: 'polygon',
  //   propertyName: 'SoilType',
  //   styles: [
  //     {
  //       value: 'Clay',
  //       color: '#8B4513',
  //       label: 'Clay',
  //       description: 'Clay soil'
  //     },
  //     // Add more soil types as needed
  //   ]
  // },

};

/**
 * Helper function to get layer style by ID
 */
export function getLayerStyle(layerId: string): LayerStyleDefinition | null {
  return LAYER_STYLES[layerId] || null;
}

/**
 * Helper function to get all layer IDs that have style definitions
 */
export function getStyledLayerIds(): string[] {
  return Object.keys(LAYER_STYLES);
}

/**
 * Helper function to convert hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Helper function to generate SLD XML for a layer style
 * This can be used to generate GeoServer SLD files programmatically
 */
export function generateSLD(layerStyleDef: LayerStyleDefinition): string {
  const { layerName, propertyName, styles, type } = layerStyleDef;
  
  let sldXml = `<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor xmlns="http://www.opengis.net/sld" xsi:schemaLocation="http://www.opengis.net/sld http://schemas.opengis.net/sld/1.1.0/StyledLayerDescriptor.xsd" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:ogc="http://www.opengis.net/ogc" version="1.1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:se="http://www.opengis.net/se">
  <NamedLayer>
    <se:Name>${layerName}</se:Name>
    <UserStyle>
      <se:Name>${layerName}</se:Name>
      <se:FeatureTypeStyle>
`;

  // Generate rules for each style entry
  styles.forEach(style => {
    const symbolizer = type === 'polygon' ? 'PolygonSymbolizer' : 
                       type === 'line' ? 'LineSymbolizer' : 
                       'PointSymbolizer';
    
    sldXml += `        <se:Rule>
          <se:Name>${style.label}</se:Name>
          <se:Description>
            <se:Title>${style.label}</se:Title>
          </se:Description>
`;

    if (propertyName) {
      sldXml += `          <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>${propertyName}</ogc:PropertyName>
              <ogc:Literal>${style.value}</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>
`;
    }

    if (type === 'polygon') {
      sldXml += `          <se:${symbolizer}>
            <se:Fill>
              <se:SvgParameter name="fill">${style.color}</se:SvgParameter>
            </se:Fill>
          </se:${symbolizer}>
`;
    } else if (type === 'line') {
      sldXml += `          <se:${symbolizer}>
            <se:Stroke>
              <se:SvgParameter name="stroke">${style.color}</se:SvgParameter>
              <se:SvgParameter name="stroke-width">2</se:SvgParameter>
            </se:Stroke>
          </se:${symbolizer}>
`;
    }

    sldXml += `        </se:Rule>
`;
  });

  sldXml += `      </se:FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>`;

  return sldXml;
}
