import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';

const ATTACK_TYPES = ['All', 'Disruption', 'Exploitation'];

const TYPE_COLORS = {
  All:          ['#0f1a2e', '#1e40af', '#3b82f6', '#93c5fd'],
  Disruption:   ['#0f1a2e', '#1d4ed8', '#2563eb', '#60a5fa'],
  Exploitation: ['#1a0f10', '#991b1b', '#dc2626', '#fca5a5'],
};

const STARS = Array.from({ length: 120 }, () => ({
  x: Math.random(),
  y: Math.random(),
  r: Math.random() * 1.1,
  o: Math.random() * 0.5 + 0.1,
}));

export default function ChoroplethMap({ countryIntensity, countrySources }) {
  const svgRef          = useRef(null);
  const containerRef    = useRef(null);
  const worldRef        = useRef(null);
  const rotationRef     = useRef([0, -20]);
  const spinTimerRef    = useRef(null);
  const dimsRef         = useRef({ width: 900, height: 500 });
  const selectedTypeRef   = useRef('All');
  const intensityRef      = useRef(null);
  const sourcesRef        = useRef(null);
  const hoveredCountryRef = useRef(null);
  const totalIncidentsRef = useRef(0);

  const [selectedType,  setSelectedType]  = useState('All');
  const [tooltip,       setTooltip]       = useState(null);
  const [pinnedCountry, setPinnedCountry] = useState(null);
  const [dims,          setDims]          = useState({ width: 900, height: 500 });
  const [isSpinning,    setIsSpinning]    = useState(false);

  // Keep refs in sync with latest state/props
  useEffect(() => { dimsRef.current = dims; }, [dims]);
  useEffect(() => { selectedTypeRef.current = selectedType; }, [selectedType]);
  useEffect(() => { intensityRef.current = countryIntensity; }, [countryIntensity]);
  useEffect(() => { sourcesRef.current = countrySources; }, [countrySources]);

  // Resize observer
  useEffect(() => {
    const ro = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width;
      if (w > 0) setDims({ width: w, height: Math.max(400, Math.min(w * 0.75, 600)) });
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const drawPaths = useCallback(() => {
    if (!worldRef.current || !intensityRef.current || !svgRef.current) return;
    const { width, height } = dimsRef.current;
    const type = selectedTypeRef.current;
    const intensityData = intensityRef.current?.[type] || intensityRef.current?.['All'] || {};
    const radius = Math.min(width, height) / 2 - 10;
    const [lambda, phi] = rotationRef.current;

    const projection = d3.geoOrthographic()
      .scale(radius)
      .translate([width / 2, height / 2])
      .rotate([lambda, phi, 0])
      .clipAngle(90);

    const path = d3.geoPath().projection(projection);
    const countries = topojson.feature(worldRef.current, worldRef.current.objects.countries);
    const graticule = d3.geoGraticule();

    const values = Object.values(intensityData).filter(v => v > 0);
    const maxVal = d3.max(values) || 1;
    const totalIncidents = Object.values(intensityData).reduce((a, b) => a + b, 0);
    totalIncidentsRef.current = totalIncidents;
    const colorScale = d3.scaleSequentialLog(
      d3.interpolateRgbBasis(TYPE_COLORS[type])
    ).domain([0.5, maxVal]);

    const svg = d3.select(svgRef.current);

    svg.select('#legend-max').text(`${maxVal} total incidents`);

    const grad = svg.select('defs #map-grad');
    grad.selectAll('stop').remove();
    TYPE_COLORS[type].forEach((c, i, arr) => {
      grad.append('stop').attr('offset', `${(i / (arr.length - 1)) * 100}%`).attr('stop-color', c);
    });

    // Ocean sphere
    svg.select('#ocean').selectAll('*').remove();
    svg.select('#ocean').append('path')
      .datum({ type: 'Sphere' }).attr('d', path)
      .attr('fill', '#0a1628');

    // Graticule
    svg.select('#graticule').selectAll('*').remove();
    svg.select('#graticule').append('path')
      .datum(graticule()).attr('d', path)
      .attr('stroke', '#0d2040').attr('stroke-width', 0.5).attr('fill', 'none');

    // Countries
    const countryPaths = svg.select('#countries').selectAll('path')
      .data(countries.features.filter(d => d.id !== undefined), d => d.id);

    countryPaths.enter().append('path')
      .attr('class', 'country')
      .style('cursor', 'pointer')
      .on('mouseover', function (event, d) {
        const name  = d.properties?.name;
        const type  = selectedTypeRef.current;
        const val   = (intensityRef.current?.[type] || intensityRef.current?.['All'] || {})[name] || 0;
        const total = totalIncidentsRef.current;
        const pct   = total > 0 ? ((val / total) * 100).toFixed(2) : '0.00';
        setTooltip({ x: event.clientX, y: event.clientY, name, val, pct });
        hoveredCountryRef.current = name;
        drawPaths();
      })
      .on('mousemove', (event) => {
        setTooltip(prev => prev ? { ...prev, x: event.clientX, y: event.clientY } : prev);
      })
      .on('mouseout', function (event, d) {
        setTooltip(null);
        hoveredCountryRef.current = null;
        drawPaths();
      })
      .on('click', (event, d) => {
        const name    = d.properties?.name;
        const type    = selectedTypeRef.current;
        const val     = (intensityRef.current?.[type] || intensityRef.current?.['All'] || {})[name] || 0;
        const total   = totalIncidentsRef.current;
        const pct     = total > 0 ? ((val / total) * 100).toFixed(2) : '0.00';
        const sources = sourcesRef.current?.[name] || {};
        setPinnedCountry(p => p?.name === name ? null : { name, val, pct, sources });
      })
      .merge(countryPaths)
      .attr('d', d => path(d) || '')
      .attr('visibility', d => {
        const p = path(d);
        return (!p || p.length < 10) ? 'hidden' : 'visible';
      })
      .attr('fill', d => {
        const val = intensityData[d.properties?.name];
        return val > 0 ? colorScale(val) : '#1a2235';
      })
      .attr('stroke', d => {
        if (d.properties?.name === hoveredCountryRef.current) return '#00ffe7';
        return intensityData[d.properties?.name] > 0 ? '#1e3050' : 'none';
      })
      .attr('stroke-width', d => d.properties?.name === hoveredCountryRef.current ? 1.2 : 0.4);

    // Atmosphere
    svg.select('#atmosphere').selectAll('*').remove();
    svg.select('#atmosphere').append('path')
      .datum({ type: 'Sphere' }).attr('d', path)
      .attr('fill', 'url(#globe-glow)')
      .attr('stroke', '#00ffe7')
      .attr('stroke-width', 0.8)
      .attr('stroke-opacity', 0.25);
  }, []);

  const initSvg = useCallback(() => {
    if (!svgRef.current) return;
    const { width, height } = dimsRef.current;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    // Defs
    const defs = svg.append('defs');
    const glow = defs.append('radialGradient').attr('id', 'globe-glow')
      .attr('cx', '50%').attr('cy', '50%').attr('r', '50%');
    glow.append('stop').attr('offset', '85%').attr('stop-color', '#0a0f1e').attr('stop-opacity', 0);
    glow.append('stop').attr('offset', '100%').attr('stop-color', '#00ffe7').attr('stop-opacity', 0.18);

    const grad = defs.append('linearGradient').attr('id', 'map-grad');
    TYPE_COLORS[selectedTypeRef.current].forEach((c, i, arr) => {
      grad.append('stop').attr('offset', `${(i / (arr.length - 1)) * 100}%`).attr('stop-color', c);
    });

    // Space background
    svg.append('rect').attr('width', width).attr('height', height).attr('fill', '#05070d');

    // Stars (static, drawn once)
    svg.append('g').attr('id', 'stars')
      .selectAll('circle').data(STARS).enter().append('circle')
      .attr('cx', d => d.x * width)
      .attr('cy', d => d.y * height)
      .attr('r', d => d.r)
      .attr('fill', '#fff')
      .attr('opacity', d => d.o);

    // Groups for dynamic content
    svg.append('g').attr('id', 'ocean');
    svg.append('g').attr('id', 'graticule');
    svg.append('g').attr('id', 'countries');
    svg.append('g').attr('id', 'atmosphere').attr('pointer-events', 'none');

    // Legend
    const legendW = Math.min(160, width * 0.18);
    const lx = width - legendW - 16;
    const ly = height - 28;
    svg.append('rect').attr('id', 'legend-rect')
      .attr('x', lx).attr('y', ly).attr('width', legendW).attr('height', 8)
      .attr('rx', 3).attr('fill', 'url(#map-grad)');
    svg.append('text').attr('x', lx).attr('y', ly - 14)
      .attr('fill', '#4a5568').attr('font-size', 9).attr('font-family', 'inherit').text('Total incidents');
    svg.append('text').attr('x', lx).attr('y', ly - 4)
      .attr('fill', '#4a5568').attr('font-size', 9).attr('font-family', 'inherit').text('0');
    svg.append('text').attr('id', 'legend-max').attr('x', lx + legendW).attr('y', ly - 4)
      .attr('fill', '#4a5568').attr('font-size', 9).attr('font-family', 'inherit')
      .attr('text-anchor', 'end');

    // Drag
    svg.call(
      d3.drag()
        .on('start', () => {
          stopSpin();
          hoveredCountryRef.current = null;
          setTooltip(null);
          svg.style('cursor', 'grabbing');
        })
        .on('drag', (event) => {
          rotationRef.current = [
            rotationRef.current[0] + event.dx * 0.4,
            Math.max(-90, Math.min(90, rotationRef.current[1] - event.dy * 0.4)),
          ];
          drawPaths();
        })
        .on('end', () => svg.style('cursor', 'grab'))
    );
    svg.style('cursor', 'grab');
  }, [drawPaths]);

  const stopSpin = useCallback(() => {
    if (spinTimerRef.current) { spinTimerRef.current.stop(); spinTimerRef.current = null; }
    setIsSpinning(false);
  }, []);

  const startSpin = useCallback(() => {
    if (spinTimerRef.current) return;
    spinTimerRef.current = d3.timer(() => {
      hoveredCountryRef.current = null;
      setTooltip(null);
      rotationRef.current = [rotationRef.current[0] + 0.3, rotationRef.current[1]];
      drawPaths();
    });
    setIsSpinning(true);
  }, [drawPaths]);

  // Load world once
  useEffect(() => {
    const base = import.meta.env.BASE_URL;
    fetch(`${base}data/countries-50m.json`)
      .then(r => r.json())
      .then(w => {
        worldRef.current = w;
        initSvg();
        drawPaths();
      });
    return () => stopSpin();
  }, [initSvg, drawPaths, stopSpin]);

  // Re-init on resize
  useEffect(() => {
    if (worldRef.current) { initSvg(); drawPaths(); }
  }, [dims, initSvg, drawPaths]);

  // Redraw on type or data change
  useEffect(() => {
    if (worldRef.current) drawPaths();
  }, [selectedType, countryIntensity, drawPaths]);

  return (
    <div style={{ width: '100%' }} ref={containerRef}>
      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
        {ATTACK_TYPES.map(t => (
          <button key={t} onClick={() => setSelectedType(t)} style={{
            background:  selectedType === t ? '#00ffe722' : '#14172044',
            border:      `1.5px solid ${selectedType === t ? '#00ffe7' : '#1e2330'}`,
            color:       selectedType === t ? '#00ffe7' : '#4a5568',
            padding: '4px 14px', borderRadius: 6, cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 12, fontWeight: 600, transition: 'all 0.2s',
          }}>{t}</button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          <button onClick={() => isSpinning ? stopSpin() : startSpin()} style={{
            ...ctrlBtn,
            borderColor: isSpinning ? '#00ffe7' : '#1e2330',
            color: isSpinning ? '#00ffe7' : '#8b9bbf',
          }}>
            {isSpinning ? '⏸ Stop' : '▶ Auto-spin'}
          </button>
          <button onClick={() => { rotationRef.current = [0, -20]; drawPaths(); }} style={ctrlBtn}>
            ⟳ Reset
          </button>
          <span style={{ fontSize: 11, color: '#2a3040' }}>Drag · Click to pin</span>
        </div>
      </div>

      {/* Globe */}
      <div onMouseLeave={() => setTooltip(null)}>
        <svg ref={svgRef} style={{ width: '100%', display: 'block', borderRadius: 12 }} />
      </div>

      {/* Tooltip portal */}
      {tooltip && createPortal(
        <div style={{
          position: 'fixed', left: tooltip.x + 14, top: tooltip.y + 14,
          pointerEvents: 'none', background: '#141720ee',
          border: '1px solid #2a3040', borderRadius: 8, padding: '8px 14px',
          fontSize: 13, zIndex: 99999, color: '#e2e8f0',
          boxShadow: '0 4px 20px #00000066', whiteSpace: 'nowrap', fontFamily: 'inherit',
        }}>
          <div style={{ fontWeight: 700 }}>{tooltip.name}</div>
          {tooltip.val > 0 ? <>
            <div style={{ color: '#8b9bbf', marginTop: 2 }}>
              Incidents: <span style={{ color: '#00ffe7', fontWeight: 700 }}>{tooltip.val}</span>
            </div>
            <div style={{ color: '#8b9bbf' }}>
              Global share: <span style={{ color: '#fff', fontWeight: 700 }}>{tooltip.pct}%</span>
            </div>
          </> : <div style={{ color: '#4a5568', marginTop: 2 }}>No data</div>}
        </div>,
        document.body
      )}

      {/* Pinned country */}
      {pinnedCountry && (
        <div style={{
          marginTop: 16, background: '#0a0c10',
          border: '1px solid #00ffe733', borderRadius: 10, padding: '16px 20px', fontSize: 13,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'baseline', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, color: '#e2e8f0', fontSize: 15 }}>{pinnedCountry.name}</span>
              {pinnedCountry.val > 0 ? <>
                <span style={{ color: '#8b9bbf' }}>Incidents: <span style={{ color: '#00ffe7', fontWeight: 700 }}>{pinnedCountry.val}</span></span>
                <span style={{ color: '#8b9bbf' }}>Share: <span style={{ color: '#fff', fontWeight: 700 }}>{pinnedCountry.pct}%</span></span>
              </> : <span style={{ color: '#4a5568' }}>No data</span>}
            </div>
            <button onClick={() => setPinnedCountry(null)} style={{
              background: 'none', border: '1px solid #1e2330', color: '#8b9bbf',
              cursor: 'pointer', fontSize: 14, borderRadius: 4, padding: '2px 8px', fontFamily: 'inherit',
            }}>✕</button>
          </div>
          {pinnedCountry.val > 0 && <>
            <div style={{ fontSize: 11, color: '#4a5568', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Top attributed threat actors
            </div>
            {Object.keys(pinnedCountry.sources).length === 0
              ? <div style={{ color: '#4a5568', fontStyle: 'italic' }}>No attribution data available</div>
              : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px 32px' }}>
                  {Object.entries(pinnedCountry.sources).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([actor, count]) => (
                    <div key={actor} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ color: '#8b9bbf', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{actor}</span>
                      <span style={{ color: '#e2e8f0', fontWeight: 600, flexShrink: 0 }}>{count}</span>
                    </div>
                  ))}
                </div>
            }
          </>}
        </div>
      )}
    </div>
  );
}

const ctrlBtn = {
  background: '#14172088', border: '1px solid #1e2330', color: '#8b9bbf',
  cursor: 'pointer', fontSize: 12, borderRadius: 4, padding: '4px 10px',
  fontFamily: 'inherit', transition: 'all 0.2s',
};
