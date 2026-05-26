import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import * as d3 from 'd3';

const COLORS = {
  Disruption: '#3b82f6',
  Exploitation: '#ef4444',
  'Info-Ops': '#22c55e',
  Others: '#6b7280',
};

const EVENTS = [
  { date: '2020-03', label: 'COVID-19 Pandemic', detail: 'Global lockdowns sparked a surge in phishing and healthcare-sector attacks.' },
  { date: '2020-12', label: 'SolarWinds Hack', detail: 'Nation-state supply-chain breach compromised 18,000 organisations worldwide.' },
  { date: '2021-05', label: 'Colonial Pipeline', detail: 'Ransomware halted US fuel supply, demonstrating critical-infrastructure vulnerability.' },
  { date: '2022-02', label: 'Invasion of Ukraine', detail: 'Disruption attacks doubled overnight as cyber became a front-line weapon.' },
  { date: '2023-10', label: 'Israel–Hamas Conflict', detail: 'Hacktivism campaigns intensified; DDoS and defacement surged across the Middle East.' },
];

export default function Streamgraph({ data }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const xScaleRef = useRef(null);   // shared x scale for crosshair
  const marginRef = useRef({ top: 60, right: 20, bottom: 36, left: 50 });
  const [tooltip, setTooltip] = useState(null);
  const [eventTooltip, setEventTooltip] = useState(null);
  const [activeCategories, setActiveCategories] = useState(new Set(Object.keys(COLORS)));
  const [dims, setDims] = useState({ width: 900, height: 420 });

  useEffect(() => {
    const ro = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width;
      if (w > 0) setDims({ width: w, height: Math.max(320, w * 0.44) });
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!data?.data) return;
    const { width, height } = dims;
    const margin = { top: 60, right: 20, bottom: 36, left: 50 };
    const W = width - margin.left - margin.right;
    const H = height - margin.top - margin.bottom;

    marginRef.current = margin;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Decode base64 bdata properly using Uint8Array (handles all byte values correctly)
    const decodeBdata = (bdata) => {
      const binary = atob(bdata);
      return new Uint8Array(binary.length).map((_, i) => binary.charCodeAt(i));
    };

    const categories = data.data
      .filter(s => activeCategories.has(s.name))
      .map(s => s.name);

    // Keep raw ISO strings as keys to avoid timezone shifting from new Date().toISOString()
    const rawXStrings = data.data[0].x; // e.g. "2018-01-01T00:00:00.000000"
    const allDates = rawXStrings.map(s => new Date(s.slice(0, 10) + 'T12:00:00Z'));

    const rawMap = {};
    data.data.forEach(s => {
      const yVals = (typeof s.y === 'object' && s.y.bdata)
        ? decodeBdata(s.y.bdata)
        : s.y;
      s.x.forEach((xStr, i) => { rawMap[`${xStr}__${s.name}`] = yVals[i] || 0; });
    });

    const rows = rawXStrings.map((xStr, i) => {
      const row = { date: allDates[i] };
      categories.forEach(cat => { row[cat] = rawMap[`${xStr}__${cat}`] || 0; });
      return row;
    });

    // Use silhouette offset for a true streamgraph (centered, organic shape)
    const stack = d3.stack().keys(categories).offset(d3.stackOffsetSilhouette).order(d3.stackOrderInsideOut);
    const series = stack(rows);

    const x = d3.scaleTime().domain(d3.extent(allDates)).range([0, W]);
    xScaleRef.current = x;
    const yMin = d3.min(series, s => d3.min(s, d => d[0]));
    const yMax = d3.max(series, s => d3.max(s, d => d[1]));
    const y = d3.scaleLinear().domain([yMin, yMax]).range([H, 0]);

    const area = d3.area()
      .x(d => x(d.data.date))
      .y0(d => y(d[0]))
      .y1(d => y(d[1]))
      .curve(d3.curveCatmullRom);

    // Helper: move the crosshair to an x position in chart coords
    const moveCrosshair = (crosshairG, cx, dateLabel) => {
      crosshairG.style('display', null);
      crosshairG.select('.ch-line').attr('x1', cx).attr('x2', cx);
      crosshairG.select('.ch-dot').attr('cx', cx);
      crosshairG.select('.ch-label').attr('x', cx).text(dateLabel);
    };

    // Draw streams
    // streams reference crosshair via closure; crosshair is appended later but
    // the variable is hoisted here so we use a ref-like holder
    const crosshairHolder = { g: null };

    g.selectAll('.stream')
      .data(series)
      .enter().append('path')
      .attr('class', 'stream')
      .attr('d', area)
      .attr('fill', d => COLORS[d.key] || '#888')
      .attr('fill-opacity', 0)
      .attr('stroke', d => COLORS[d.key] || '#888')
      .attr('stroke-width', 0.5)
      .on('mousemove', function (event, d) {
        const [mx] = d3.pointer(event, g.node());
        const date = x.invert(mx);
        const idx = d3.bisectCenter(allDates, date);
        const row = rows[idx];
        if (!row) return;
        const count = row[d.key] || 0;
        const total = categories.reduce((s, k) => s + (row[k] || 0), 0);
        const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
        setTooltip({ x: event.clientX, y: event.clientY, cat: d.key, count, pct, dateStr: d3.timeFormat('%b %Y')(row.date) });
        d3.select(this).attr('fill-opacity', 1);
        // Update crosshair
        if (crosshairHolder.g) moveCrosshair(crosshairHolder.g, Math.max(0, Math.min(W, mx)), d3.timeFormat('%b %Y')(row.date));
      })
      .on('mouseleave', function () {
        setTooltip(null);
        d3.select(this).attr('fill-opacity', 0.82);
        if (crosshairHolder.g) crosshairHolder.g.style('display', 'none');
      })
      .transition().duration(900).delay((d, i) => i * 150)
      .attr('fill-opacity', 0.82);

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${H})`)
      .call(d3.axisBottom(x).ticks(d3.timeYear.every(1)).tickFormat(d3.timeFormat('%Y')))
      .call(ax => {
        ax.selectAll('line,path').attr('stroke', '#2a3040');
        ax.selectAll('text').attr('fill', '#8b9bbf').attr('font-family', 'inherit');
      });

    // Geopolitical event lines
    EVENTS.forEach((ev, i) => {
      const evDate = new Date(ev.date + '-01');
      const ex = x(evDate);
      if (ex < 0 || ex > W) return;

      g.append('line')
        .attr('x1', ex).attr('x2', ex)
        .attr('y1', 0).attr('y2', H)
        .attr('stroke', '#f59e0b')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '5,4')
        .attr('opacity', 0.7);

      const labelG = g.append('g')
        .attr('transform', `translate(${ex},0)`)
        .style('cursor', 'pointer');

      labelG.append('rect')
        .attr('x', -6).attr('y', -52).attr('width', 12).attr('height', 14)
        .attr('fill', '#f59e0b').attr('rx', 2).attr('opacity', 0.9);

      labelG.append('text')
        .attr('x', 0).attr('y', -41)
        .attr('text-anchor', 'middle')
        .attr('fill', '#0a0c10')
        .attr('font-size', 10)
        .attr('font-weight', 700)
        .text(i + 1);

      labelG
        .on('mouseenter', (event) => {
          setEventTooltip({ x: event.clientX, y: event.clientY, ...ev });
        })
        .on('mousemove', (event) => {
          setEventTooltip(prev => prev ? { ...prev, x: event.clientX, y: event.clientY } : prev);
        })
        .on('mouseleave', () => setEventTooltip(null));
    });

    // Crosshair group (drawn on top of everything)
    const crosshair = g.append('g').attr('class', 'crosshair').style('pointer-events', 'none').style('display', 'none');
    crosshairHolder.g = crosshair;

    crosshair.append('line')
      .attr('class', 'ch-line')
      .attr('y1', 0).attr('y2', H)
      .attr('stroke', 'rgba(255,255,255,0.35)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,3');

    // Small dot at the x-axis intersection
    crosshair.append('circle')
      .attr('class', 'ch-dot')
      .attr('cy', H).attr('r', 3)
      .attr('fill', 'rgba(255,255,255,0.7)')
      .attr('stroke', '#0a0c10').attr('stroke-width', 1);

    // Date label just below the x-axis
    crosshair.append('text')
      .attr('class', 'ch-label')
      .attr('y', H + 28)
      .attr('text-anchor', 'middle')
      .attr('fill', '#8b9bbf')
      .attr('font-size', 11)
      .attr('font-family', 'JetBrains Mono, monospace');

    // Transparent overlay rect — catches mouse in the empty background areas
    // (streams handle their own area; this fills the gaps)
    g.append('rect')
      .attr('width', W).attr('height', H)
      .attr('fill', 'transparent')
      .lower()   // push behind streams so stream mousemove still fires
      .on('mousemove', function (event) {
        const [mx] = d3.pointer(event);
        const cx = Math.max(0, Math.min(W, mx));
        moveCrosshair(crosshair, cx, d3.timeFormat('%b %Y')(x.invert(cx)));
      })
      .on('mouseleave', function () {
        crosshair.style('display', 'none');
      });

  }, [data, activeCategories, dims]);

  const toggleCategory = cat => {
    setActiveCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat) && next.size === 1) return next;
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  return (
    <div style={{ position: 'relative' }} ref={containerRef}>
      {/* Category toggles */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        {Object.entries(COLORS).map(([cat, color]) => (
          <button key={cat} onClick={() => toggleCategory(cat)} style={{
            background: activeCategories.has(cat) ? color + '22' : '#14172044',
            border: `1.5px solid ${activeCategories.has(cat) ? color : '#2a3040'}`,
            color: activeCategories.has(cat) ? color : '#4a5568',
            padding: '4px 12px', borderRadius: 6, cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 12, fontWeight: 600, transition: 'all 0.2s'
          }}>
            {cat}
          </button>
        ))}
      </div>

      <svg ref={svgRef} style={{ width: '100%', display: 'block', overflow: 'visible' }} />

      {/* Event legend */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '8px 16px',
        marginTop: 16,
        padding: '14px 16px',
        background: '#0a0c1088',
        border: '1px solid #1e2330',
        borderRadius: 10,
      }}>
        {EVENTS.map((ev, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
            <span style={{
              flexShrink: 0,
              width: 20, height: 20,
              background: '#f59e0b',
              borderRadius: 4,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#0a0c10',
              marginTop: 1,
            }}>{i + 1}</span>
            <div>
              <div style={{ color: '#f59e0b', fontSize: 12, fontWeight: 700, lineHeight: 1.3 }}>{ev.label}</div>
              <div style={{ color: '#4a5568', fontSize: 11, lineHeight: 1.4 }}>{ev.detail}</div>
            </div>
          </div>
        ))}
      </div>

      {tooltip && createPortal(
        <div style={{
          position: 'fixed', left: tooltip.x + 14, top: tooltip.y + 14,
          pointerEvents: 'none', background: '#141720ee',
          border: `1px solid ${COLORS[tooltip.cat]}`, borderRadius: 8,
          padding: '8px 14px', fontSize: 13, zIndex: 99999,
          color: '#e2e8f0', boxShadow: `0 4px 20px #00000066`,
          whiteSpace: 'nowrap', fontFamily: 'inherit',
        }}>
          <div style={{ color: COLORS[tooltip.cat], fontWeight: 700 }}>{tooltip.cat}</div>
          <div style={{ color: '#8b9bbf', marginTop: 2 }}>{tooltip.dateStr}</div>
          <div style={{ color: '#8b9bbf' }}>Incidents: <span style={{ color: '#fff', fontWeight: 700 }}>{tooltip.count}</span></div>
          <div style={{ color: '#8b9bbf' }}>Share: <span style={{ color: '#fff', fontWeight: 700 }}>{tooltip.pct}%</span></div>
        </div>,
        document.body
      )}

      {eventTooltip && createPortal(
        <div style={{
          position: 'fixed', left: eventTooltip.x + 14, top: eventTooltip.y + 14,
          pointerEvents: 'none', background: '#141720ee',
          border: '1px solid #f59e0b', borderRadius: 8,
          padding: '10px 16px', fontSize: 13, zIndex: 99999,
          maxWidth: 260, color: '#e2e8f0', boxShadow: '0 4px 20px #00000066',
          fontFamily: 'inherit',
        }}>
          <div style={{ color: '#f59e0b', fontWeight: 700 }}>{eventTooltip.label}</div>
          <div style={{ marginTop: 4, color: '#8b9bbf', lineHeight: 1.5 }}>{eventTooltip.detail}</div>
        </div>,
        document.body
      )}
    </div>
  );
}
