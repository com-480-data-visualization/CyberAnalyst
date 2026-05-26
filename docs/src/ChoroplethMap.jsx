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

// Generated once at module load — stable across renders
const STARS = Array.from({ length: 120 }, () => ({
  x: Math.random(), y: Math.random(),
  r: Math.random() * 1.1 + 0.2,
  o: Math.random() * 0.5 + 0.2,
}));

const ctrlBtn = {
  background: '#14172088', border: '1px solid #1e2330', color: '#8b9bbf',
  cursor: 'pointer', fontSize: 12, borderRadius: 4, padding: '4px 10px',
  fontFamily: 'inherit', transition: 'all 0.2s',
};

export default function ChoroplethMap({ countryIntensity, countrySources }) {
  // ── DOM refs ──────────────────────────────────────────────────────────────
  const canvasRef      = useRef(null);
  const containerRef   = useRef(null);

  // ── Data refs (never stale in callbacks) ──────────────────────────────────
  const worldRef             = useRef(null);
  const featuresRef          = useRef([]);   // TopoJSON features, Kosovo filtered
  const graticuleRef         = useRef(null);
  const rotationRef          = useRef([0, -20]);
  const dimsRef              = useRef({ width: 900, height: 500 });
  const selectedTypeRef      = useRef('All');
  const intensityRef         = useRef(null);
  const sourcesRef           = useRef(null);
  const hoveredRef           = useRef(null); // country name string | null
  const totalRef             = useRef(0);
  const colorScaleRef        = useRef(null);
  const colorCacheRef        = useRef({});   // name -> fill string, rebuilt on type change
  const lastBuiltTypeRef     = useRef(null);
  const spinTimerRef         = useRef(null);
  const rafRef               = useRef(null); // pending requestAnimationFrame id
  const projectionRef        = useRef(null); // reused projection object

  // ── React state (only for UI re-renders outside canvas) ───────────────────
  const [selectedType,  setSelectedType]  = useState('All');
  const [tooltip,       setTooltip]       = useState(null);
  const [pinnedCountry, setPinnedCountry] = useState(null);
  const [dims,          setDims]          = useState({ width: 900, height: 500 });
  const [isSpinning,    setIsSpinning]    = useState(false);

  // Sync refs with state/props
  useEffect(() => { dimsRef.current = dims; }, [dims]);
  useEffect(() => { selectedTypeRef.current = selectedType; lastBuiltTypeRef.current = null; }, [selectedType]);
  useEffect(() => { intensityRef.current = countryIntensity; lastBuiltTypeRef.current = null; }, [countryIntensity]);
  useEffect(() => { sourcesRef.current = countrySources; }, [countrySources]);

  // Resize observer
  useEffect(() => {
    const ro = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width;
      if (w > 0) setDims({ width: w, height: Math.max(400, Math.min(w * 0.72, 580)) });
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // ── Color cache: rebuilt only when type or data changes ──────────────────
  const rebuildColors = useCallback(() => {
    const type = selectedTypeRef.current;
    if (type === lastBuiltTypeRef.current && colorScaleRef.current) return;
    lastBuiltTypeRef.current = type;

    const data = intensityRef.current?.[type] || {};
    const vals = Object.values(data).filter(v => v > 0);
    const maxVal = d3.max(vals) || 1;
    totalRef.current = vals.reduce((a, b) => a + b, 0);

    colorScaleRef.current = d3.scaleSequentialLog(
      d3.interpolateRgbBasis(TYPE_COLORS[type])
    ).domain([0.5, maxVal]);

    const cache = {};
    featuresRef.current.forEach(f => {
      const name = f.properties?.name;
      const v = data[name];
      cache[name] = v > 0 ? colorScaleRef.current(v) : '#1a2235';
    });
    colorCacheRef.current = cache;

    // Store max for legend
    if (canvasRef.current) canvasRef.current._legendMax = maxVal;
  }, []);

  // ── Single draw call — pure canvas, no DOM mutations ─────────────────────
  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !featuresRef.current.length) return;

    rebuildColors();

    const { width, height } = dimsRef.current;
    const dpr    = window.devicePixelRatio || 1;
    const ctx    = canvas.getContext('2d');
    const radius = Math.min(width, height) / 2 - 10;

    // Update shared projection in-place
    const proj = projectionRef.current;
    proj.scale(radius)
        .translate([width / 2, height / 2])
        .rotate([rotationRef.current[0], rotationRef.current[1], 0]);

    const path = d3.geoPath(proj, ctx);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    // Space background
    ctx.fillStyle = '#05070d';
    ctx.fillRect(0, 0, width, height);

    // Stars (static positions)
    for (const s of STARS) {
      ctx.beginPath();
      ctx.arc(s.x * width, s.y * height, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${s.o})`;
      ctx.fill();
    }

    // Ocean
    ctx.beginPath();
    path({ type: 'Sphere' });
    ctx.fillStyle = '#0a1628';
    ctx.fill();

    // Graticule
    ctx.beginPath();
    path(graticuleRef.current);
    ctx.strokeStyle = '#0d2040';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Countries
    const hovered = hoveredRef.current;
    const colors  = colorCacheRef.current;
    for (const f of featuresRef.current) {
      const name = f.properties?.name;
      ctx.beginPath();
      path(f);
      ctx.fillStyle = colors[name] || '#1a2235';
      ctx.fill();
      if (name === hovered) {
        ctx.strokeStyle = '#00ffe7';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (colors[name] !== '#1a2235') {
        ctx.strokeStyle = '#1e3050';
        ctx.lineWidth = 0.4;
        ctx.stroke();
      }
    }

    // Atmosphere glow
    const cx = width / 2, cy = height / 2;
    const glow = ctx.createRadialGradient(cx, cy, radius * 0.86, cx, cy, radius + 2);
    glow.addColorStop(0, 'rgba(0,255,231,0)');
    glow.addColorStop(1, 'rgba(0,255,231,0.18)');
    ctx.beginPath();
    path({ type: 'Sphere' });
    ctx.fillStyle = glow;
    ctx.fill();
    ctx.beginPath();
    path({ type: 'Sphere' });
    ctx.strokeStyle = 'rgba(0,255,231,0.22)';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Legend
    const legendW = Math.min(160, width * 0.18);
    const lx = width - legendW - 16;
    const ly = height - 28;
    const colors4 = TYPE_COLORS[selectedTypeRef.current];
    const lgGrad = ctx.createLinearGradient(lx, 0, lx + legendW, 0);
    colors4.forEach((c, i) => lgGrad.addColorStop(i / (colors4.length - 1), c));
    ctx.fillStyle = lgGrad;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(lx, ly, legendW, 8, 3);
    else ctx.rect(lx, ly, legendW, 8);
    ctx.fill();
    ctx.fillStyle = '#4a5568';
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Incidents', lx, ly - 14);
    ctx.fillText('0', lx, ly - 4);
    ctx.textAlign = 'right';
    ctx.fillText(canvas._legendMax ?? '', lx + legendW, ly - 4);

    ctx.restore();
  }, [rebuildColors]);

  // Schedule a draw on the next animation frame, coalescing rapid calls
  const scheduleFrame = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      drawFrame();
    });
  }, [drawFrame]);

  // ── Hit test: which country is under (x, y) in CSS pixels ────────────────
  const countryAtPoint = useCallback((cssX, cssY) => {
    if (!featuresRef.current.length) return null;
    const dpr  = window.devicePixelRatio || 1;
    const px   = cssX * dpr;
    const py   = cssY * dpr;
    const { width, height } = dimsRef.current;
    const radius = Math.min(width, height) / 2 - 10;

    // Scratch canvas for hit-testing (never shown)
    const scratch = document.createElement('canvas');
    scratch.width  = Math.ceil(width  * dpr);
    scratch.height = Math.ceil(height * dpr);
    const sctx = scratch.getContext('2d');
    sctx.scale(dpr, dpr);

    const proj = d3.geoOrthographic()
      .scale(radius)
      .translate([width / 2, height / 2])
      .rotate([rotationRef.current[0], rotationRef.current[1], 0])
      .clipAngle(90);
    const path = d3.geoPath(proj, sctx);

    for (let i = featuresRef.current.length - 1; i >= 0; i--) {
      sctx.beginPath();
      path(featuresRef.current[i]);
      if (sctx.isPointInPath(px, py)) return featuresRef.current[i];
    }
    return null;
  }, []);

  // ── Canvas init: size + event wiring ────────────────────────────────────
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { width, height } = dimsRef.current;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = Math.ceil(width  * dpr);
    canvas.height = Math.ceil(height * dpr);
    canvas.style.width  = width  + 'px';
    canvas.style.height = height + 'px';
  }, []);

  // ── Spin & stop ──────────────────────────────────────────────────────────
  const stopSpin = useCallback(() => {
    if (spinTimerRef.current) { spinTimerRef.current.stop(); spinTimerRef.current = null; }
    setIsSpinning(false);
  }, []);

  const startSpin = useCallback(() => {
    if (spinTimerRef.current) return;
    spinTimerRef.current = d3.timer(() => {
      hoveredRef.current = null;
      rotationRef.current[0] += 0.25;
      scheduleFrame();
    });
    setIsSpinning(true);
  }, [scheduleFrame]);

  // ── Wire drag + hover once on mount ─────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Shared projection reused by drawFrame (avoids creating one per frame)
    projectionRef.current = d3.geoOrthographic().clipAngle(90);

    let isDragging = false;

    const onMouseMove = (event) => {
      if (isDragging) return; // handled by drag
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const f = countryAtPoint(x, y);
      const name = f?.properties?.name ?? null;
      if (name !== hoveredRef.current) {
        hoveredRef.current = name;
        scheduleFrame();
      }
      if (name) {
        const t   = selectedTypeRef.current;
        const val = (intensityRef.current?.[t] || {})[name] || 0;
        const tot = totalRef.current;
        const pct = tot > 0 ? ((val / tot) * 100).toFixed(2) : '0.00';
        setTooltip({ x: event.clientX, y: event.clientY, name, val, pct });
      } else {
        setTooltip(null);
      }
    };

    const onMouseLeave = () => {
      hoveredRef.current = null;
      setTooltip(null);
      scheduleFrame();
    };

    const onClick = (event) => {
      const rect = canvas.getBoundingClientRect();
      const f = countryAtPoint(event.clientX - rect.left, event.clientY - rect.top);
      if (!f) return;
      const name = f.properties?.name;
      const t    = selectedTypeRef.current;
      const val  = (intensityRef.current?.[t] || {})[name] || 0;
      const tot  = totalRef.current;
      const pct  = tot > 0 ? ((val / tot) * 100).toFixed(2) : '0.00';
      const sources = sourcesRef.current?.[name] || {};
      setPinnedCountry(p => p?.name === name ? null : { name, val, pct, sources });
    };

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);
    canvas.addEventListener('click', onClick);

    // D3 drag — no hit-testing during drag, just rotate + redraw
    d3.select(canvas).call(
      d3.drag()
        .on('start', () => {
          isDragging = true;
          stopSpin();
          hoveredRef.current = null;
          setTooltip(null);
          canvas.style.cursor = 'grabbing';
        })
        .on('drag', (event) => {
          rotationRef.current[0] += event.dx * 0.4;
          rotationRef.current[1] = Math.max(-90, Math.min(90, rotationRef.current[1] - event.dy * 0.4));
          scheduleFrame();
        })
        .on('end', () => {
          isDragging = false;
          canvas.style.cursor = 'grab';
        })
    );
    canvas.style.cursor = 'grab';

    return () => {
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      canvas.removeEventListener('click', onClick);
      d3.select(canvas).on('.drag', null);
    };
  }, [countryAtPoint, scheduleFrame, stopSpin]);

  // ── Load world data once ─────────────────────────────────────────────────
  useEffect(() => {
    const base = import.meta.env.BASE_URL;
    fetch(`${base}data/countries-50m.json`)
      .then(r => r.json())
      .then(w => {
        worldRef.current = w;
        featuresRef.current = topojson.feature(w, w.objects.countries)
          .features.filter(f => f.id !== undefined);
        graticuleRef.current = d3.geoGraticule()();
        initCanvas();
        scheduleFrame();
      });
    return () => {
      stopSpin();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Resize ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!featuresRef.current.length) return;
    initCanvas();
    scheduleFrame();
  }, [dims, initCanvas, scheduleFrame]);

  // ── Redraw on type / data change ─────────────────────────────────────────
  useEffect(() => {
    if (featuresRef.current.length) scheduleFrame();
  }, [selectedType, countryIntensity, scheduleFrame]);

  return (
    <div style={{ width: '100%' }} ref={containerRef}>
      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
        {ATTACK_TYPES.map(t => (
          <button key={t} onClick={() => setSelectedType(t)} style={{
            background: selectedType === t ? '#00ffe722' : '#14172044',
            border:     `1.5px solid ${selectedType === t ? '#00ffe7' : '#1e2330'}`,
            color:      selectedType === t ? '#00ffe7' : '#4a5568',
            padding: '4px 14px', borderRadius: 6, cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 12, fontWeight: 600, transition: 'all 0.2s',
          }}>{t}</button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          <button onClick={() => isSpinning ? stopSpin() : startSpin()} style={{
            ...ctrlBtn,
            borderColor: isSpinning ? '#00ffe7' : '#1e2330',
            color:       isSpinning ? '#00ffe7' : '#8b9bbf',
          }}>
            {isSpinning ? '⏸ Stop' : '▶ Auto-spin'}
          </button>
          <button onClick={() => { rotationRef.current = [0, -20]; scheduleFrame(); }} style={ctrlBtn}>
            ⟳ Reset
          </button>
          <span style={{ fontSize: 11, color: '#2a3040' }}>Drag · Click to pin</span>
        </div>
      </div>

      {/* Globe — canvas */}
      <canvas ref={canvasRef} style={{ width: '100%', display: 'block', borderRadius: 12 }} />

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

      {/* Pinned country card */}
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
