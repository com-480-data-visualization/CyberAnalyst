import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import * as d3 from 'd3';

const NODES = [
  { id: 'root',       label: 'Total Cybercrime', count: 14087, depth: 0, color: '#00ffe7' },
  { id: 'fraud',      label: 'Cyber Fraud',       count: 11844, depth: 1, color: '#ef4444' },
  { id: 'core',       label: 'Core Cybercrime',   count: 1594,  depth: 1, color: '#22c55e' },
  { id: 'sexual',     label: 'Sexual Offences',   count: 649,   depth: 1, color: '#a855f7' },
  { id: 'phishing',   label: 'Phishing',          count: 4300,  depth: 2, color: '#fca5a5' },
  { id: 'investment', label: 'Investment Scam',   count: 3200,  depth: 2, color: '#fca5a5' },
  { id: 'romance',    label: 'Romance Scam',      count: 1200,  depth: 2, color: '#fca5a5' },
  { id: 'malware',    label: 'Malware',           count: 700,   depth: 2, color: '#86efac' },
  { id: 'unauth',     label: 'Unauth. Access',    count: 500,   depth: 2, color: '#86efac' },
  { id: 'ddos',       label: 'DDoS',              count: 394,   depth: 2, color: '#86efac' },
];

const LINKS = [
  { source: 'root', target: 'fraud' },
  { source: 'root', target: 'core' },
  { source: 'root', target: 'sexual' },
  { source: 'fraud', target: 'phishing' },
  { source: 'fraud', target: 'investment' },
  { source: 'fraud', target: 'romance' },
  { source: 'core', target: 'malware' },
  { source: 'core', target: 'unauth' },
  { source: 'core', target: 'ddos' },
];

export default function NetworkGraph() {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [selected, setSelected] = useState(null);
  const [dims, setDims] = useState({ width: 800, height: 480 });

  useEffect(() => {
    const ro = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width;
      if (w > 0) setDims({ width: w, height: Math.max(380, w * 0.55) });
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const { width, height } = dims;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const maxCount = d3.max(NODES, d => d.count);
    const rScale = d3.scaleSqrt().domain([0, maxCount]).range([14, 52]);

    // Fixed positions: depth-based layout
    const positions = {
      root:       { x: width / 2,        y: height * 0.12 },
      fraud:      { x: width * 0.25,     y: height * 0.42 },
      core:       { x: width * 0.5,      y: height * 0.42 },
      sexual:     { x: width * 0.75,     y: height * 0.42 },
      phishing:   { x: width * 0.1,      y: height * 0.78 },
      investment: { x: width * 0.25,     y: height * 0.78 },
      romance:    { x: width * 0.38,     y: height * 0.78 },
      malware:    { x: width * 0.52,     y: height * 0.78 },
      unauth:     { x: width * 0.64,     y: height * 0.78 },
      ddos:       { x: width * 0.76,     y: height * 0.78 },
    };

    const nodeMap = Object.fromEntries(NODES.map(n => [n.id, { ...n, ...positions[n.id] }]));

    // Links
    const getAncestors = id => {
      const ancestors = new Set([id]);
      const recurse = i => {
        LINKS.filter(l => l.target === i).forEach(l => { ancestors.add(l.source); recurse(l.source); });
      };
      recurse(id);
      return ancestors;
    };
    const getDescendants = id => {
      const desc = new Set([id]);
      const recurse = i => {
        LINKS.filter(l => l.source === i).forEach(l => { desc.add(l.target); recurse(l.target); });
      };
      recurse(id);
      return desc;
    };

    const activeNodes = selected
      ? new Set([...getAncestors(selected), ...getDescendants(selected)])
      : null;

    // Draw links
    svg.selectAll('.link')
      .data(LINKS)
      .enter().append('line')
      .attr('class', 'link')
      .attr('x1', d => nodeMap[d.source].x)
      .attr('y1', d => nodeMap[d.source].y)
      .attr('x2', d => nodeMap[d.target].x)
      .attr('y2', d => nodeMap[d.target].y)
      .attr('stroke', d => {
        if (!activeNodes) return '#1e2d50';
        return (activeNodes.has(d.source) && activeNodes.has(d.target)) ? '#00ffe766' : '#111827';
      })
      .attr('stroke-width', d => {
        if (!activeNodes) return 2;
        return (activeNodes.has(d.source) && activeNodes.has(d.target)) ? 2.5 : 1;
      })
      .attr('opacity', 0)
      .transition().duration(400).delay((d, i) => i * 50)
      .attr('opacity', 1);

    // Draw nodes
    const nodeG = svg.selectAll('.node')
      .data(NODES)
      .enter().append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${positions[d.id].x},${positions[d.id].y})`)
      .style('cursor', 'pointer')
      .on('mouseover', function (event, d) {
        setTooltip({ x: event.clientX, y: event.clientY, label: d.label, count: d.count, pct: ((d.count / 14087) * 100).toFixed(1) });
      })
      .on('mousemove', function (event) {
        setTooltip(prev => prev ? { ...prev, x: event.clientX, y: event.clientY } : prev);
      })
      .on('mouseleave', () => setTooltip(null))
      .on('click', (event, d) => {
        setSelected(s => s === d.id ? null : d.id);
      });

    nodeG.append('circle')
      .attr('r', 0)
      .attr('fill', d => d.color + '11')
      .attr('stroke', d => d.color + '33')
      .attr('stroke-width', d => selected === d.id ? 3 : 1.5)
      .style('filter', d => activeNodes && activeNodes.has(d.id) ? `drop-shadow(0 0 8px ${d.color})` : 'none')
      .transition().duration(500).delay((d, i) => i * 60).ease(d3.easeBackOut)
      .attr('r', d => rScale(d.count))
      .attr('fill', d => d.color + (activeNodes && !activeNodes.has(d.id) ? '11' : '22'))
      .attr('stroke', d => d.color + (activeNodes && !activeNodes.has(d.id) ? '33' : 'cc'));

    nodeG.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', d => rScale(d.count) + 14)
      .attr('fill', d => activeNodes && !activeNodes.has(d.id) ? '#2a3040' : '#e2e8f0')
      .attr('font-size', d => d.depth === 0 ? 13 : d.depth === 1 ? 11 : 10)
      .attr('font-family', 'inherit')
      .attr('font-weight', d => d.depth === 0 ? 700 : 500)
      .text(d => d.label);

    nodeG.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 5)
      .attr('fill', d => activeNodes && !activeNodes.has(d.id) ? '#2a3040' : d.color)
      .attr('font-size', d => rScale(d.count) > 28 ? 12 : 9)
      .attr('font-family', 'inherit')
      .attr('font-weight', 700)
      .text(d => d.count >= 1000 ? `${(d.count / 1000).toFixed(1)}k` : d.count);

  }, [dims, selected]);

  return (
    <div style={{ position: 'relative' }} ref={containerRef}>
      {selected && (
        <div style={{ marginBottom: 8, fontSize: 12, color: '#4a5568' }}>
          Click again to deselect • Highlighted path from root to "{NODES.find(n => n.id === selected)?.label}"
        </div>
      )}
      <svg ref={svgRef} style={{ width: '100%', display: 'block' }} onMouseLeave={() => setTooltip(null)} />
      {tooltip && createPortal(
        <div style={{
          position: 'fixed', left: tooltip.x + 14, top: tooltip.y + 14, pointerEvents: 'none',
          background: '#141720ee', border: '1px solid #1e2330', borderRadius: 8,
          padding: '8px 14px', fontSize: 13, zIndex: 99999, color: '#e2e8f0',
          boxShadow: '0 4px 20px #00000066', whiteSpace: 'nowrap', fontFamily: 'inherit',
        }}>
          <div style={{ fontWeight: 700, color: '#e2e8f0' }}>{tooltip.label}</div>
          <div>Reports: <b style={{ color: '#00ffe7' }}>{tooltip.count.toLocaleString()}</b></div>
          <div style={{ color: '#8b9bbf' }}>Share of total: <b style={{ color: '#fff' }}>{tooltip.pct}%</b></div>
        </div>,
        document.body
      )}
    </div>
  );
}
