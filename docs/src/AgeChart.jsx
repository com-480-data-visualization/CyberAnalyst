import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import * as d3 from 'd3';

const AGE_DATA = [
  { group: '0–17',  count: 210,  pct: 1.5 },
  { group: '18–24', count: 1040, pct: 7.4 },
  { group: '25–34', count: 2480, pct: 17.6 },
  { group: '35–44', count: 3110, pct: 22.1 },
  { group: '45–54', count: 2870, pct: 20.4 },
  { group: '55–64', count: 2360, pct: 16.8 },
  { group: '65+',   count: 2017, pct: 14.3 },
];

export default function AgeChart() {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [dims, setDims] = useState({ width: 700, height: 320 });

  useEffect(() => {
    const ro = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width;
      if (w > 0) setDims({ width: w, height: Math.max(260, w * 0.38) });
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const { width, height } = dims;
    const margin = { top: 24, right: 20, bottom: 48, left: 54 };
    const W = width - margin.left - margin.right;
    const H = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand().domain(AGE_DATA.map(d => d.group)).range([0, W]).padding(0.28);
    const y = d3.scaleLinear().domain([0, d3.max(AGE_DATA, d => d.count) * 1.12]).range([H, 0]);

    const maxIdx = AGE_DATA.reduce((mi, d, i, a) => d.count > a[mi].count ? i : mi, 0);

    // Grid lines
    g.selectAll('.grid')
      .data(y.ticks(5))
      .enter().append('line')
      .attr('x1', 0).attr('x2', W)
      .attr('y1', d => y(d)).attr('y2', d => y(d))
      .attr('stroke', '#1e2330').attr('stroke-dasharray', '3,3');

    // Bars
    const bars = g.selectAll('.bar')
      .data(AGE_DATA)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.group))
      .attr('y', H)
      .attr('width', x.bandwidth())
      .attr('height', 0)
      .attr('rx', 4)
      .attr('fill', (d, i) => i === maxIdx ? '#00ffe7' : '#3b82f6')
      .attr('fill-opacity', 0.85)
      .style('cursor', 'pointer');

    bars.transition().duration(700).delay((d, i) => i * 80)
      .attr('y', d => y(d.count))
      .attr('height', d => H - y(d.count));

    bars
      .on('mouseover', function (event, d) {
        d3.select(this).attr('fill-opacity', 1);
        setTooltip({ x: event.clientX, y: event.clientY, ...d });
      })
      .on('mousemove', function (event) {
        setTooltip(prev => prev ? { ...prev, x: event.clientX, y: event.clientY } : prev);
      })
      .on('mouseleave', function () {
        d3.select(this).attr('fill-opacity', 0.85);
        setTooltip(null);
      });

    // Percentage labels on top
    g.selectAll('.label')
      .data(AGE_DATA)
      .enter().append('text')
      .attr('class', 'label')
      .attr('x', d => x(d.group) + x.bandwidth() / 2)
      .attr('y', d => y(d.count) - 6)
      .attr('text-anchor', 'middle')
      .attr('fill', (d, i) => i === maxIdx ? '#00ffe7' : '#8b9bbf')
      .attr('font-size', 11)
      .attr('font-family', 'inherit')
      .attr('font-weight', 600)
      .attr('opacity', 0)
      .text(d => `${d.pct}%`)
      .transition().delay(600).duration(300).attr('opacity', 1);

    // X axis
    g.append('g').attr('transform', `translate(0,${H})`)
      .call(d3.axisBottom(x))
      .call(ax => {
        ax.selectAll('line,path').attr('stroke', '#1e2330');
        ax.selectAll('text').attr('fill', '#8b9bbf').attr('font-family', 'inherit').attr('font-size', 12);
      });

    // Y axis
    g.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => d >= 1000 ? `${d/1000}k` : d))
      .call(ax => {
        ax.selectAll('line,path').attr('stroke', '#1e2330');
        ax.selectAll('text').attr('fill', '#8b9bbf').attr('font-family', 'inherit').attr('font-size', 11);
      });

    // Axis labels
    g.append('text')
      .attr('x', W / 2).attr('y', H + 40)
      .attr('text-anchor', 'middle')
      .attr('fill', '#4a5568').attr('font-size', 12)
      .text('Age group');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -H / 2).attr('y', -42)
      .attr('text-anchor', 'middle')
      .attr('fill', '#4a5568').attr('font-size', 12)
      .text('Reported incidents');

  }, [dims]);

  return (
    <div ref={containerRef}>
      <svg ref={svgRef} style={{ width: '100%', display: 'block' }} onMouseLeave={() => setTooltip(null)} />
      {tooltip && createPortal(
        <div style={{
          position: 'fixed', left: tooltip.x + 14, top: tooltip.y + 14, pointerEvents: 'none',
          background: '#141720ee', border: '1px solid #1e2330', borderRadius: 8,
          padding: '8px 14px', fontSize: 13, zIndex: 99999, color: '#e2e8f0',
          boxShadow: '0 4px 20px #00000066', whiteSpace: 'nowrap', fontFamily: 'inherit',
        }}>
          <div style={{ fontWeight: 700, color: '#e2e8f0' }}>Age {tooltip.group}</div>
          <div>Reports: <b style={{ color: '#00ffe7' }}>{tooltip.count.toLocaleString()}</b></div>
          <div>Share: <b style={{ color: '#fff' }}>{tooltip.pct}%</b></div>
        </div>,
        document.body
      )}
    </div>
  );
}
