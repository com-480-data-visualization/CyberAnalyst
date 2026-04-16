import React, { useState, useEffect } from 'react';
import './App.css'; // Gardons le CSS basique pour l'instant
import PlotLibrary from 'react-plotly.js';
const Plot = PlotLibrary.default || PlotLibrary;
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

function App() {
  const [graph1, setGraph1] = useState(null);
  const [graph2, setGraph2] = useState(null);
  const [graph3, setGraph3] = useState(null);
  const [countryIntensity, setCountryIntensity] = useState(null);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Charger les données JSON exportées depuis Python
  useEffect(() => {
    fetch('/data/graph1.json').then(res => res.json()).then(data => setGraph1(data));
    fetch('/data/graph2.json').then(res => res.json()).then(data => setGraph2(data));
    fetch('/data/graph3.json').then(res => res.json()).then(data => setGraph3(data));
    fetch('/data/country-intensity.json').then(res => res.json()).then(data => setCountryIntensity(data));
  }, []);

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* HEADER */}
      <header style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{ fontSize: '3em', color: '#2c3e50' }}>CyberAnalyst</h1>
        <p style={{ fontSize: '1.2em', color: '#7f8c8d' }}>
          From Global Geopolitics to Local Reality: The Evolution of Cyber Threats
        </p>
      </header>

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

      {/* GRAPH 1: Global Pulse */}
      <section style={{ marginBottom: '80px' }}>
        <h2 style={{ borderBottom: '2px solid #ecf0f1', paddingBottom: '10px' }}>1. The Global Pulse (Geopolitical Context)</h2>
        <p>This streamgraph illustrates the shift from stealth exploitation to aggressive disruption following major geopolitical events, such as the 2022 invasion of Ukraine.</p>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          {graph1 ? (
            <Plot data={graph1.data} layout={{ ...graph1.layout, autosize: true }} useResizeHandler style={{ width: '100%', height: '500px' }} />
          ) : <p>Loading Global Data...</p>}
        </div>
      </section>

      {/* GRAPH 2: Swiss Benchmark */}
      <section style={{ marginBottom: '80px' }}>
        <h2 style={{ borderBottom: '2px solid #ecf0f1', paddingBottom: '10px' }}>2. The Attack Profile Benchmark</h2>
        <p>Evaluating Switzerland's threat landscape against highly targeted nations. While Ukraine faces infrastructure sabotage, Switzerland is a prime target for economic espionage.</p>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          {graph2 ? (
            <Plot data={graph2.data} layout={{ ...graph2.layout, autosize: true }} useResizeHandler style={{ width: '100%', height: '500px' }} />
          ) : <p>Loading Benchmark Data...</p>}
        </div>
      </section>

      {/* GRAPH 3: Zurich Local Reality */}
      <section style={{ marginBottom: '80px' }}>
        <h2 style={{ borderBottom: '2px solid #ecf0f1', paddingBottom: '10px' }}>3. The Local Reality (Zurich Deep-Dive)</h2>
        <p>A normalized breakdown of Kanton Zürich's 6.5x growth in cyber offences over the last 8 years, showing the massive industrialization of Cyber Fraud targeting citizens.</p>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          {graph3 ? (
            <Plot data={graph3.data} layout={{ ...graph3.layout, autosize: true }} useResizeHandler style={{ width: '100%', height: '500px' }} />
          ) : <p>Loading Local Data...</p>}
        </div>
      </section>

    </div>
  );
}

export default App;