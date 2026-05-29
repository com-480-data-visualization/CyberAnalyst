import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import * as d3 from 'd3';

/* ── Category config — matches keys in age-chart.json ── */
const CATEGORIES = [
  { key: 'Cyber Fraud',      color: '#ef4444', group: 'Property Crime' },
  { key: 'Phishing',         color: '#f97316', group: 'Core Cybercrime' },
  { key: 'Hacking',          color: '#3b82f6', group: 'Core Cybercrime' },
  { key: 'DDoS',             color: '#6366f1', group: 'Core Cybercrime' },
  { key: 'Sextortion (€)',   color: '#f59e0b', group: 'Property Crime' },
  { key: 'Sexual Offences',  color: '#a855f7', group: 'Sexual Offences' },
  { key: 'Defamation',       color: '#22c55e', group: 'Defamation' },
];

const KEYS = CATEGORIES.map(c => c.key);
const COLOR_MAP = Object.fromEntries(CATEGORIES.map(c => [c.key, c.color]));

const GROUP_COLORS = {
  'Property Crime':   '#ef4444',
  'Core Cybercrime':  '#3b82f6',
  'Sexual Offences':  '#a855f7',
  'Defamation':       '#22c55e',
};

export default function AgeChart({ data: AGE_DATA }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [dims, setDims] = useState({ width: 700, height: 340 });
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const ro = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width;
      if (w > 0) setDims({ width: w, height: Math.max(380, w * 0.52) });
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!AGE_DATA) return;
    const { width, height } = dims;
    const margin = { top: 44, right: 32, bottom: 64, left: 72 };
    const W = width - margin.left - margin.right;
    const H = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .domain(AGE_DATA.map(d => d.group))
      .range([0, W])
      .padding(0.35);

    const maxTotal = d3.max(AGE_DATA, d => d.total);
    const y = d3.scaleLinear()
      .domain([0, maxTotal * 1.15])
      .range([H, 0]);

    const stack = d3.stack().keys(KEYS).order(d3.stackOrderNone);
    const series = stack(AGE_DATA);

    g.selectAll('.grid')
      .data(y.ticks(5))
      .enter().append('line')
      .attr('x1', 0).attr('x2', W)
      .attr('y1', d => y(d)).attr('y2', d => y(d))
      .attr('stroke', '#1e2330').attr('stroke-dasharray', '3,4').attr('stroke-width', 1);

    const maxIdx = AGE_DATA.reduce((mi, d, i, a) => d.total > a[mi].total ? i : mi, 0);

    const layers = g.selectAll('.layer')
      .data(series)
      .enter().append('g')
      .attr('class', 'layer');

    layers.selectAll('rect')
      .data((d) => d.map(v => ({ ...v, key: d.key })))
      .enter().append('rect')
      .attr('x', d => x(d.data.group))
      .attr('width', x.bandwidth())
      .attr('y', H)
      .attr('height', 0)
      .attr('rx', 2)
      .attr('fill', d => COLOR_MAP[d.key])
      .attr('fill-opacity', d => {
        if (!selected) return 0.82;
        return d.key === selected ? 1.0 : 0.15;
      })
      .style('cursor', 'pointer')
      .on('mouseover', function (event, d) {
        setTooltip({
          x: event.clientX, y: event.clientY,
          group: d.data.group,
          key: d.key,
          count: d.data[d.key],
          total: d.data.total,
          pct: d.data.pct,
          color: COLOR_MAP[d.key],
        });
      })
      .on('mousemove', function (event) {
        setTooltip(prev => prev ? { ...prev, x: event.clientX, y: event.clientY } : prev);
      })
      .on('mouseleave', function () {
        setTooltip(null);
      })
      .on('click', function (event, d) {
        event.stopPropagation();
        setSelected(prev => prev === d.key ? null : d.key);
      })
      .transition().duration(600).delay((d) => {
        const ageIdx = AGE_DATA.findIndex(a => a.group === d.data.group);
        return ageIdx * 70;
      })
      .attr('y', d => y(d[1]))
      .attr('height', d => Math.max(0, y(d[0]) - y(d[1])));

    g.selectAll('.total-label')
      .data(AGE_DATA)
      .enter().append('text')
      .attr('class', 'total-label')
      .attr('x', d => x(d.group) + x.bandwidth() / 2)
      .attr('y', d => y(d.total) - 7)
      .attr('text-anchor', 'middle')
      .attr('fill', (d, i) => i === maxIdx ? '#00ffb4' : '#8b9bbf')
      .attr('font-size', 11)
      .attr('font-family', "'JetBrains Mono', monospace")
      .attr('font-weight', 700)
      .attr('opacity', 0)
      .text(d => `${d.total >= 1000 ? (d.total / 1000).toFixed(1) + 'k' : d.total}  ${d.pct}%`)
      .transition().delay(550).duration(300).attr('opacity', 1);

    g.append('g').attr('transform', `translate(0,${H})`)
      .call(d3.axisBottom(x).tickSize(6))
      .call(ax => {
        ax.selectAll('line,path').attr('stroke', '#1e2330');
        ax.selectAll('text')
          .attr('fill', '#8b9bbf')
          .attr('font-family', "'Jura', monospace")
          .attr('font-size', 13)
          .attr('dy', '1.4em');
      });

    g.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => d >= 1000 ? `${d / 1000}k` : d))
      .call(ax => {
        ax.selectAll('line,path').attr('stroke', '#1e2330');
        ax.selectAll('text')
          .attr('fill', '#8b9bbf')
          .attr('font-family', "'Jura', monospace")
          .attr('font-size', 12)
          .attr('dx', '-4px');
      });

    g.append('text')
      .attr('x', W / 2).attr('y', H + 54)
      .attr('text-anchor', 'middle')
      .attr('fill', '#4a5568').attr('font-size', 12)
      .attr('font-family', "'Jura', monospace")
      .text('Age Group (Years)');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -H / 2).attr('y', -58)
      .attr('text-anchor', 'middle')
      .attr('fill', '#4a5568').attr('font-size', 12)
      .attr('font-family', "'Jura', monospace")
      .text('Reported Offences');

    svg.on('click', () => setSelected(null));

  }, [dims, selected, AGE_DATA]);

  const legendGroups = [...new Set(CATEGORIES.map(c => c.group))];

  if (!AGE_DATA) return null;

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <svg
        ref={svgRef}
        style={{ width: '100%', display: 'block' }}
        onMouseLeave={() => setTooltip(null)}
      />

      <div style={{ marginTop: 24, paddingLeft: 72, paddingRight: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {legendGroups.map(grp => (
          <div key={grp}>
            <div style={{
              fontSize: 9, fontWeight: 700, color: GROUP_COLORS[grp],
              textTransform: 'uppercase', letterSpacing: '0.14em',
              fontFamily: "'Orbitron', monospace",
              marginBottom: 8,
            }}>
              {grp}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px' }}>
              {CATEGORIES.filter(c => c.group === grp).map(cat => (
                <div
                  key={cat.key}
                  onClick={() => setSelected(prev => prev === cat.key ? null : cat.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    cursor: 'pointer',
                    opacity: selected && selected !== cat.key ? 0.28 : 1,
                    transition: 'opacity 0.2s',
                    padding: '4px 0',
                  }}
                >
                  <span style={{
                    width: 12, height: 12, borderRadius: 3, flexShrink: 0,
                    background: cat.color,
                    boxShadow: selected === cat.key ? `0 0 8px ${cat.color}` : 'none',
                    transition: 'box-shadow 0.2s',
                  }} />
                  <span style={{
                    fontSize: 12.5,
                    color: selected === cat.key ? '#e2e8f0' : '#8b9bbf',
                    fontFamily: "'Jura', monospace",
                    fontWeight: selected === cat.key ? 700 : 400,
                    whiteSpace: 'nowrap',
                  }}>
                    {cat.key}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div style={{
          fontSize: 11, color: '#2a3040', fontStyle: 'italic',
          fontFamily: "'Jura', monospace", marginTop: 4,
        }}>
          {selected
            ? `Showing: ${selected} · click again to reset`
            : 'Click any bar segment or legend item to isolate that crime type'}
        </div>
      </div>

      {tooltip && createPortal(
        <div style={{
          position: 'fixed', left: tooltip.x + 14, top: tooltip.y - 10,
          pointerEvents: 'none', zIndex: 99999,
          background: '#141720ee', border: '1px solid #1e2330', borderRadius: 8,
          padding: '8px 14px', fontSize: 13, color: '#e2e8f0',
          boxShadow: '0 4px 20px #00000066', whiteSpace: 'nowrap', fontFamily: 'inherit',
        }}>
          <div style={{ fontWeight: 700, color: '#e2e8f0' }}>Age {tooltip.group}</div>
          <div style={{ color: tooltip.color, fontWeight: 700 }}>{tooltip.key}: <span style={{ color: '#fff' }}>{tooltip.count.toLocaleString()}</span></div>
          <div style={{ color: '#4a5568', fontSize: 11 }}>Total: {tooltip.total.toLocaleString()} ({tooltip.pct}%)</div>
        </div>,
        document.body
      )}
    </div>
  );
}
