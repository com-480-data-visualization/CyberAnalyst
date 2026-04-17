import React, { useState, useEffect } from 'react';
import { MapContainer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as topojson from 'topojson-client';

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
  const [geoData, setGeoData] = useState(null);

  useEffect(() => {
    const base = import.meta.env.BASE_URL;
    fetch(`${base}data/countries-50m.json`)
      .then(res => res.json())
      .then(data => {
        // Convert TopoJSON to GeoJSON
        const geojson = topojson.feature(data, data.objects.countries);
        setGeoData(geojson);
      });
  }, []);

  if (!geoData) return <div>Loading map...</div>;

  const intensityValues = countryIntensity ? Object.values(countryIntensity) : [];
  const minIntensity = intensityValues.length > 0 ? Math.min(...intensityValues) : 0;
  const maxIntensity = intensityValues.length > 0 ? Math.max(...intensityValues) : 1;

  const onEachFeature = (feature, layer) => {
    const countryName = feature.properties?.name;
    const intensity = countryIntensity?.[countryName];
    
    // Skip Antarctica
    if (feature.id === '010') return;

    // Set the color based on intensity
    const fillColor = getColorByIntensity(intensity, minIntensity, maxIntensity);
    layer.setStyle({
      fillColor: fillColor,
      fillOpacity: 0.8,
      color: '#94a3b8',
      weight: 0.5,
      opacity: 1
    });

    // Add hover effect
    layer.on('mouseenter', (e) => {
      const target = e.target;
      target.setStyle({
        fillColor: intensity ? '#7f1d1d' : '#d1d5db',
        color: '#1f2937',
        weight: 1
      });
      setHoveredCountry({ 
        name: countryName, 
        intensity: intensity || 0 
      });
      setTooltipPos({ x: e.originalEvent.clientX, y: e.originalEvent.clientY });
    });

    layer.on('mousemove', (e) => {
      setTooltipPos({ x: e.originalEvent.clientX, y: e.originalEvent.clientY });
    });

    layer.on('mouseleave', (e) => {
      const target = e.target;
      target.setStyle({
        fillColor: fillColor,
        color: '#94a3b8',
        weight: 0.5
      });
      setHoveredCountry(null);
    });
  };

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
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ width: '100%', height: '500px', borderRadius: '8px', backgroundColor: '#f3f4f6' }}
        zoomControl={false}
        dragging={false}
        touchZoom={false}
        doubleClickZoom={false}
        scrollWheelZoom={false}
        keyboard={false}
      >
        <GeoJSON data={geoData} onEachFeature={onEachFeature} />
      </MapContainer>
    </div>
  );
}

export default CyberMap;
