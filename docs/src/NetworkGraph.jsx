import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import * as d3 from 'd3';

const CAT_COLOR = { property: '#ef4444', core: '#22c55e', sexual: '#a855f7', defamation: '#f59e0b' };

function nodeColor(d) {
  if (d.depth === 0) return '#00ffe7';
  const cat = d.depth === 1 ? d.data.id : d.parent?.data.id;
  return CAT_COLOR[cat] ?? '#8b9bbf';
}

function getFamily(node) {
  const ids = new Set();
  node.ancestors().forEach(n => ids.add(n.data.id));
  node.descendants().forEach(n => ids.add(n.data.id));
  return ids;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function NetworkGraph({ data: TREE }) {
  const svgRef       = useRef(null);
  const containerRef = useRef(null);
  const [tooltip,  setTooltip]  = useState(null);
  const [selected, setSelected] = useState(null);
  const [dims,     setDims]     = useState({ width: 800, height: 520 });

  useEffect(() => {
    const ro = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width;
      if (w > 0) setDims({ width: w, height: Math.max(460, Math.min(w * 0.72, 600)) });
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!TREE) return;
    const { width, height } = dims;
    const cx = width / 2;
    const cy = height / 2;
    const minDim = Math.min(width, height);

    // Ring radii
    const R0 = minDim * 0.09;  // root node
    const R1 = minDim * 0.27;  // depth-1 ring
    const R2 = minDim * 0.44;  // depth-2 ring
    const labelR = minDim * 0.50; // label ring

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    // ── Build hierarchy + positions ──────────────────────────────────────────
    const root = d3.hierarchy(TREE).sum(d => d.count);

    // Use d3.cluster to get angular positions; layout on a full circle
    // Each leaf gets equal angular space so fraud's 6 leaves don't crowd others
    const leaves = root.leaves();
    const nLeaves = leaves.length; // 11 leaves total

    // Assign equal arc to every leaf, then back-propagate midpoints to parents
    leaves.forEach((leaf, i) => {
      leaf._angle = (2 * Math.PI * (i + 0.5)) / nLeaves;
    });

    // Parent angle = mean of children angles (handle wrap-around)
    function assignAngles(node) {
      if (!node.children) return;
      node.children.forEach(assignAngles);
      // Circular mean
      const angles = node.children.map(c => c._angle);
      let sumSin = 0, sumCos = 0;
      angles.forEach(a => { sumSin += Math.sin(a); sumCos += Math.cos(a); });
      node._angle = Math.atan2(sumSin / angles.length, sumCos / angles.length);
    }
    assignAngles(root);

    // Cartesian position per depth
    function pos(node) {
      const a = node._angle;
      const r = node.depth === 0 ? 0 : node.depth === 1 ? R1 : R2;
      return { x: cx + r * Math.cos(a - Math.PI / 2), y: cy + r * Math.sin(a - Math.PI / 2) };
    }

    const allNodes = root.descendants();
    allNodes.forEach(n => { const p = pos(n); n._x = p.x; n._y = p.y; });

    // Active family for highlighting
    const selNode = selected ? allNodes.find(n => n.data.id === selected) : null;
    const family  = selNode ? getFamily(selNode) : null;

    const rScale = d3.scaleSqrt()
      .domain([0, TREE.count])
      .range([8, R0]);

    const linkW = d3.scaleSqrt()
      .domain([0, TREE.count])
      .range([1, 7]);

    // ── Defs ─────────────────────────────────────────────────────────────────
    const defs = svg.append('defs');
    const filt = defs.append('filter').attr('id', 'ng-glow')
      .attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    filt.append('feGaussianBlur').attr('stdDeviation', 4).attr('result', 'blur');
    filt.append('feMerge').selectAll('feMergeNode').data(['blur', 'SourceGraphic']).enter()
      .append('feMergeNode').attr('in', d => d);

    // ── Subtle guide rings ────────────────────────────────────────────────────
    [R1, R2].forEach(r => {
      svg.append('circle').attr('cx', cx).attr('cy', cy).attr('r', r)
        .attr('fill', 'none').attr('stroke', '#1e2330')
        .attr('stroke-dasharray', '3,7').attr('opacity', 0.35);
    });

    // ── Links — curved bezier ─────────────────────────────────────────────────
    const linkGroup = svg.append('g');

    root.links().forEach((link, i) => {
      const sx = link.source._x, sy = link.source._y;
      const tx = link.target._x, ty = link.target._y;

      // Offset start/end to the circle edge along the link direction
      const srcR = rScale(link.source.data.count);
      const tgtR = rScale(link.target.data.count);
      const dx = tx - sx, dy = ty - sy;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const ux = dx / dist, uy = dy / dist;

      const s = { x: sx + ux * srcR, y: sy + uy * srcR };
      const t = { x: tx - ux * tgtR, y: ty - uy * tgtR };

      // Control point: pull towards center for depth-1 links, push out for depth-2
      const pull = link.source.depth === 0 ? 0.35 : 0.2;
      const mx = (s.x + t.x) / 2 * (1 - pull) + cx * pull;
      const my = (s.y + t.y) / 2 * (1 - pull) + cy * pull;

      const col = nodeColor(link.target);
      const w = linkW(link.target.data.count ?? 0);
      const active = !family || (family.has(link.source.data.id) && family.has(link.target.data.id));

      linkGroup.append('path')
        .attr('d', `M${s.x},${s.y} Q${mx},${my} ${t.x},${t.y}`)
        .attr('fill', 'none')
        .attr('stroke', active ? col + '88' : '#0d1220')
        .attr('stroke-width', active ? (family ? w + 1.5 : w) : 0.8)
        .attr('opacity', 0)
        .transition().duration(500).delay(i * 40)
        .attr('opacity', 1);
    });

    // ── Nodes ─────────────────────────────────────────────────────────────────
    const nodeGroup = svg.append('g');

    allNodes.forEach((n, i) => {
      const col    = nodeColor(n);
      const r      = rScale(n.data.count);
      const active = !family || family.has(n.data.id);
      const isSelected = n.data.id === selected;

      const g = nodeGroup.append('g')
        .attr('transform', `translate(${n._x},${n._y})`)
        .style('cursor', 'pointer')
        .on('mouseover', (event) => {
          const pct = ((n.data.count / TREE.count) * 100).toFixed(1);
          setTooltip({ x: event.clientX, y: event.clientY, label: n.data.label, count: n.data.count, pct, color: col });
        })
        .on('mousemove', (event) => {
          setTooltip(prev => prev ? { ...prev, x: event.clientX, y: event.clientY } : prev);
        })
        .on('mouseleave', () => setTooltip(null))
        .on('click', () => setSelected(s => s === n.data.id ? null : n.data.id));

      // Outer glow halo
      if (active && n.depth > 0) {
        g.append('circle').attr('r', 0)
          .attr('fill', col + '14').attr('stroke', 'none')
          .transition().duration(600).delay(i * 45)
          .attr('r', r + 9);
      }

      // Main circle
      g.append('circle').attr('r', 0)
        .attr('fill', active ? col + '22' : '#0d1118')
        .attr('stroke', active ? col + (isSelected ? 'ee' : '99') : col + '18')
        .attr('stroke-width', isSelected ? 2.5 : 1.5)
        .style('filter', isSelected ? `drop-shadow(0 0 10px ${col})` : 'none')
        .transition().duration(600).delay(i * 45).ease(d3.easeBackOut)
        .attr('r', r);

      // Count inside node (only if big enough)
      if (r > 14) {
        g.append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', n.depth === 0 ? -10 : 4)
          .attr('fill', active ? col : col + '22')
          .attr('font-size', r > 35 ? 13 : r > 20 ? 11 : 9)
          .attr('font-weight', 700)
          .attr('font-family', 'JetBrains Mono, monospace')
          .attr('pointer-events', 'none')
          .attr('opacity', 0)
          .text(n.data.count >= 1000 ? `${(n.data.count / 1000).toFixed(1)}k` : n.data.count)
          .transition().duration(400).delay(i * 45 + 200).attr('opacity', 1);

        if (n.depth === 0) {
          g.append('text')
            .attr('text-anchor', 'middle').attr('dy', 13)
            .attr('fill', '#00ffe7').attr('font-size', 10)
            .attr('font-weight', 700)
            .attr('letter-spacing', '0.06em')
            .attr('text-transform', 'uppercase')
            .attr('font-family', 'JetBrains Mono, monospace').attr('pointer-events', 'none')
            .attr('opacity', 0).text('TOTAL REPORTS')
            .transition().duration(400).delay(250).attr('opacity', 1);
        }
      }

      // External label — pushed along the radial angle, clear of the circle
      if (n.depth > 0) {
        const angle  = n._angle - Math.PI / 2;
        const deg    = (angle * 180) / Math.PI;

        // Per-node overrides: force label to a specific side
        // 'start' = text flows right from offset point, 'end' = text flows left
        const sideOverride = { sexual: 'right', core: 'right', defamation: 'right' }; // force label to the right of the node
        const side = sideOverride[n.data.id];

        let lDist = r + 16;
        let lx, ly, anchor;
        if (side === 'right') {
          lx = lDist;   // always place offset to the right
          ly = 0;
          anchor = 'start';
        } else {
          lx = Math.cos(angle) * lDist;
          ly = Math.sin(angle) * lDist;
          anchor = deg > -60 && deg < 60 ? 'start'
                 : deg > 120 || deg < -120 ? 'end'
                 : 'middle';
        }

        const labelColor = active
          ? (n.depth === 1 ? col : '#c8d4e8')
          : '#1e2330';
        const fontSize  = n.depth === 1 ? 12.5 : 11;
        const fontWeight = n.depth === 1 ? 700 : 500;

        // Dark backdrop pill for readability
        g.append('text')
          .attr('x', lx).attr('y', ly)
          .attr('text-anchor', anchor).attr('dy', '0.35em')
          .attr('fill', '#0a0c10')
          .attr('font-size', fontSize)
          .attr('font-weight', fontWeight)
          .attr('font-family', 'inherit')
          .attr('stroke', '#0a0c10')
          .attr('stroke-width', 4)
          .attr('stroke-linejoin', 'round')
          .attr('paint-order', 'stroke')
          .attr('pointer-events', 'none')
          .attr('opacity', 0)
          .text(n.data.label)
          .transition().duration(400).delay(i * 45 + 150).attr('opacity', active ? 1 : 0);

        // Foreground text
        g.append('text')
          .attr('x', lx).attr('y', ly)
          .attr('text-anchor', anchor).attr('dy', '0.35em')
          .attr('fill', labelColor)
          .attr('font-size', fontSize)
          .attr('font-weight', fontWeight)
          .attr('font-family', 'inherit')
          .attr('pointer-events', 'none')
          .attr('opacity', 0)
          .text(n.data.label)
          .transition().duration(400).delay(i * 45 + 150).attr('opacity', 1);
      }
    });

  }, [dims, selected, TREE]);

  if (!TREE) return null;

  const allTreeNodes = TREE.children
    ? TREE.children.flatMap(c => [c, ...(c.children || [])]).concat([TREE])
    : [TREE];

  return (
    <div style={{ position: 'relative' }} ref={containerRef}>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {(TREE.children || []).map(child => {
          const color = CAT_COLOR[child.id] ?? '#8b9bbf';
          return (
            <div key={child.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
              <span style={{ fontSize: 11, color: '#4a5568' }}>{child.label}</span>
            </div>
          );
        })}
        <span style={{ fontSize: 11, color: '#2a3040', marginLeft: 'auto' }}>
          {selected
            ? `Path: ${allTreeNodes.find(n => n.id === selected)?.label} · Click again to reset`
            : 'Node size = incident count · Click to highlight path'}
        </span>
      </div>

      <svg ref={svgRef} style={{ width: '100%', display: 'block', overflow: 'visible' }}
        onMouseLeave={() => setTooltip(null)} />

      {tooltip && createPortal(
        <div style={{
          position: 'fixed', left: tooltip.x + 14, top: tooltip.y + 14,
          pointerEvents: 'none', background: '#141720ee',
          border: `1px solid ${tooltip.color}44`, borderRadius: 8,
          padding: '8px 14px', fontSize: 13, zIndex: 99999, color: '#e2e8f0',
          boxShadow: '0 4px 20px #00000066', whiteSpace: 'nowrap', fontFamily: 'inherit',
        }}>
          <div style={{ fontWeight: 700, color: tooltip.color }}>{tooltip.label}</div>
          <div style={{ color: '#8b9bbf', marginTop: 2 }}>
            Reports: <span style={{ color: '#fff', fontWeight: 700 }}>{tooltip.count.toLocaleString()}</span>
          </div>
          <div style={{ color: '#8b9bbf' }}>
            Share of total: <span style={{ color: '#fff', fontWeight: 700 }}>{tooltip.pct}%</span>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
