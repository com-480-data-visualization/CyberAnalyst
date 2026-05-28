import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import * as d3 from 'd3';

/* ── Data ── */
const AGE_DATA = [
  { group: '0–17',  total: 210,  pct: 1.5,
    'Phishing': 25,   'Investment Scam': 4,   'Romance Scam': 4,   'Advance-Fee': 6,   'CEO / BEC': 0,   'E-Commerce': 10,
    'Malware': 17,    'Unauth. Access': 6,    'DDoS': 6,
    'Sextortion': 10, 'Grooming': 13, 'Other': 119 },
  { group: '18–24', total: 1040, pct: 7.4,
    'Phishing': 229,  'Investment Scam': 52,  'Romance Scam': 42,  'Advance-Fee': 52,  'CEO / BEC': 31,  'E-Commerce': 73,
    'Malware': 73,    'Unauth. Access': 42,   'DDoS': 31,
    'Sextortion': 42, 'Grooming': 31, 'Other': 342 },
  { group: '25–34', total: 2480, pct: 17.6,
    'Phishing': 794,  'Investment Scam': 298, 'Romance Scam': 198, 'Advance-Fee': 174, 'CEO / BEC': 198, 'E-Commerce': 174,
    'Malware': 149,   'Unauth. Access': 99,   'DDoS': 74,
    'Sextortion': 50, 'Grooming': 25, 'Other': 247 },
  { group: '35–44', total: 3110, pct: 22.1,
    'Phishing': 1057, 'Investment Scam': 560, 'Romance Scam': 311, 'Advance-Fee': 218, 'CEO / BEC': 311, 'E-Commerce': 187,
    'Malware': 156,   'Unauth. Access': 124,  'DDoS': 62,
    'Sextortion': 31, 'Grooming': 0,  'Other': 93 },
  { group: '45–54', total: 2870, pct: 20.4,
    'Phishing': 861,  'Investment Scam': 631, 'Romance Scam': 344, 'Advance-Fee': 230, 'CEO / BEC': 287, 'E-Commerce': 144,
    'Malware': 115,   'Unauth. Access': 86,   'DDoS': 57,
    'Sextortion': 29, 'Grooming': 0,  'Other': 86 },
  { group: '55–64', total: 2360, pct: 16.8,
    'Phishing': 637,  'Investment Scam': 566, 'Romance Scam': 330, 'Advance-Fee': 212, 'CEO / BEC': 142, 'E-Commerce': 94,
    'Malware': 71,    'Unauth. Access': 71,   'DDoS': 24,
    'Sextortion': 24, 'Grooming': 0,  'Other': 189 },
  { group: '65+',   total: 2017, pct: 14.3,
    'Phishing': 444,  'Investment Scam': 403, 'Romance Scam': 323, 'Advance-Fee': 202, 'CEO / BEC': 61,  'E-Commerce': 61,
    'Malware': 40,    'Unauth. Access': 40,   'DDoS': 20,
    'Sextortion': 20, 'Grooming': 0,  'Other': 403 },
];

/* ── Category config ── */
const CATEGORIES = [
  // Cyber Fraud group
  { key: 'Phishing',        color: '#ef4444', group: 'Cyber Fraud' },
  { key: 'Investment Scam', color: '#f97316', group: 'Cyber Fraud' },
  { key: 'Romance Scam',    color: '#f59e0b', group: 'Cyber Fraud' },
  { key: 'Advance-Fee',     color: '#eab308', group: 'Cyber Fraud' },
  { key: 'CEO / BEC',       color: '#84cc16', group: 'Cyber Fraud' },
  { key: 'E-Commerce',      color: '#22c55e', group: 'Cyber Fraud' },
  // Core Cybercrime
  { key: 'Malware',         color: '#3b82f6', group: 'Core Cybercrime' },
  { key: 'Unauth. Access',  color: '#6366f1', group: 'Core Cybercrime' },
  { key: 'DDoS',            color: '#8b5cf6', group: 'Core Cybercrime' },
  // Sexual Offences
  { key: 'Sextortion',      color: '#ec4899', group: 'Sexual Offences' },
  { key: 'Grooming',        color: '#f472b6', group: 'Sexual Offences' },
  // Other
  { key: 'Other',           color: '#475569', group: 'Other' },
];

const KEYS = CATEGORIES.map(c => c.key);
const COLOR_MAP = Object.fromEntries(CATEGORIES.map(c => [c.key, c.color]));

const GROUP_COLORS = {
  'Cyber Fraud':      '#ef4444',
  'Core Cybercrime':  '#3b82f6',
  'Sexual Offences':  '#ec4899',
  'Other':            '#475569',
};

export default function AgeChart() {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [dims, setDims] = useState({ width: 700, height: 340 });
  const [selected, setSelected] = useState(null); // selected category key

  useEffect(() => {
    const ro = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width;
      if (w > 0) setDims({ width: w, height: Math.max(380, w * 0.52) });
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const { width, height } = dims;
    const margin = { top: 44, right: 32, bottom: 64, left: 72 };
    const W = width - margin.left - margin.right;
    const H = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const x = d3.scaleBand()
      .domain(AGE_DATA.map(d => d.group))
      .range([0, W])
      .padding(0.35);

    const maxTotal = d3.max(AGE_DATA, d => d.total);
    const y = d3.scaleLinear()
      .domain([0, maxTotal * 1.15])
      .range([H, 0]);

    // Stack
    const stack = d3.stack().keys(KEYS).order(d3.stackOrderNone);
    const series = stack(AGE_DATA);

    // Grid lines
    g.selectAll('.grid')
      .data(y.ticks(5))
      .enter().append('line')
      .attr('x1', 0).attr('x2', W)
      .attr('y1', d => y(d)).attr('y2', d => y(d))
      .attr('stroke', '#1e2330').attr('stroke-dasharray', '3,4').attr('stroke-width', 1);

    // Stacked bars
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
      .attr('y', H)   // animate from bottom
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
      .transition().duration(600).delay((d, i) => {
        const ageIdx = AGE_DATA.findIndex(a => a.group === d.data.group);
        return ageIdx * 70;
      })
      .attr('y', d => y(d[1]))
      .attr('height', d => Math.max(0, y(d[0]) - y(d[1])));

    // Total count labels above each bar
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

    // X axis
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

    // Y axis
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

    // Axis labels
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
      .text('Reported Incidents');

    // Click on empty area to deselect
    svg.on('click', () => setSelected(null));

  }, [dims, selected]);

  // Group categories for legend
  const legendGroups = [...new Set(CATEGORIES.map(c => c.group))];

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Chart */}
      <svg
        ref={svgRef}
        style={{ width: '100%', display: 'block' }}
        onMouseLeave={() => setTooltip(null)}
      />

      {/* Legend */}
      <div style={{ marginTop: 24, paddingLeft: 72, paddingRight: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {legendGroups.map(grp => (
          <div key={grp}>
            {/* Group label */}
            <div style={{
              fontSize: 9, fontWeight: 700, color: GROUP_COLORS[grp],
              textTransform: 'uppercase', letterSpacing: '0.14em',
              fontFamily: "'Orbitron', monospace",
              marginBottom: 8,
            }}>
              {grp}
            </div>
            {/* Items in a horizontal row */}
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

        {/* Instruction hint */}
        <div style={{
          fontSize: 11, color: '#2a3040', fontStyle: 'italic',
          fontFamily: "'Jura', monospace", marginTop: 4,
        }}>
          {selected
            ? `Showing: ${selected} · click again to reset`
            : 'Click any bar segment or legend item to isolate that attack type'}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && createPortal(
        <div style={{
          position: 'fixed', left: tooltip.x + 14, top: tooltip.y - 10,
          pointerEvents: 'none', zIndex: 99999,
          background: '#141720ee', border: '1px solid #1e2330', borderRadius: 8,
          padding: '8px 14px', fontSize: 13, zIndex: 99999, color: '#e2e8f0',
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
