import React, { useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';

const geoUrl = '/data/countries-50m.json';

const projection = 'geoMercator';
const projectionConfig = {
  scale: 165,
  center: [0, 15]
};

const EXCLUDED_COUNTRY_IDS = new Set(['010']); // Antarctica

// Color scale helper: intensity → color (white to dark red)
const getColorByIntensity = (intensity, minIntensity, maxIntensity) => {
  if (intensity === null || intensity === undefined) return '#f3f4f6'; // light gray
  if (maxIntensity === minIntensity) return '#dc2626'; // uniform color if all same
  
  // Normalize intensity to 0-1
  const normalized = (intensity - minIntensity) / (maxIntensity - minIntensity);
  
  // Interpolate from light red (#fee) to dark red (#b91c1c)
  const r = Math.round(254 - normalized * 118); // 254 → 136
  const g = Math.round(226 - normalized * 218); // 226 → 8
  const b = Math.round(226 - normalized * 195); // 226 → 31
  
  return `rgb(${r}, ${g}, ${b})`;
};

function CyberMap({ countryIntensity }) {
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  return (
    <div style={{ width: 'min(900px, 100%)', margin: '0 auto 32px', position: 'relative' }}>
      {hoveredCountry && (
        <div
          style={{
            position: 'fixed',
            left: `${tooltipPos.x + 10}px`,
            top: `${tooltipPos.y + 10}px`,
            backgroundColor: '#1f2937',
            color: '#fff',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 'bold',
            pointerEvents: 'none',
            zIndex: 1000,
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            whiteSpace: 'nowrap'
          }}
        >
          {hoveredCountry.name}: <span style={{ color: '#fca5a5' }}>{hoveredCountry.intensity}</span> incident{hoveredCountry.intensity !== 1 ? 's' : ''}
        </div>
      )}
      <ComposableMap
        style={{ width: '100%', height: 'auto' }}
        projection={projection}
        projectionConfig={projectionConfig}
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies
              .filter((geo) => !EXCLUDED_COUNTRY_IDS.has(geo.id))
              .map((geo) => {
                const countryName = geo.properties?.name;
                const intensity = countryIntensity?.[countryName];
                const intensityValues = countryIntensity ? Object.values(countryIntensity) : [];
                const minIntensity = intensityValues.length > 0 ? Math.min(...intensityValues) : 0;
                const maxIntensity = intensityValues.length > 0 ? Math.max(...intensityValues) : 1;
                const fillColor = getColorByIntensity(intensity, minIntensity, maxIntensity);
                
                const handleMouseEnter = (evt) => {
                  setHoveredCountry({ name: countryName, intensity: intensity || 0 });
                  setTooltipPos({ x: evt.clientX, y: evt.clientY });
                };
                
                const handleMouseMove = (evt) => {
                  setTooltipPos({ x: evt.clientX, y: evt.clientY });
                };
                
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={handleMouseEnter}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => setHoveredCountry(null)}
                    title={intensity ? `${countryName}: ${intensity} incidents` : countryName}
                    style={{
                      default: {
                        fill: fillColor,
                        stroke: '#94a3b8',
                        strokeWidth: 0.35,
                        outline: 'none',
                        cursor: 'pointer'
                      },
                      hover: {
                        fill: intensity ? '#7f1d1d' : '#d1d5db',
                        stroke: '#1f2937',
                        strokeWidth: 0.55,
                        outline: 'none',
                        cursor: 'pointer'
                      },
                      pressed: {
                        fill: '#991b1b',
                        stroke: '#111827',
                        strokeWidth: 0.55,
                        outline: 'none'
                      }
                    }}
                  />
                );
              })
          }
        </Geographies>
      </ComposableMap>
    </div>
  );
}

export default CyberMap;
