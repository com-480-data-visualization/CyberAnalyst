// ── Node Network — depth layers + expanding pulse rings + mouse interaction ──
export function startNodeNetwork() {
  const canvas = document.createElement('canvas');
  canvas.id = 'bg-canvas';
  Object.assign(canvas.style, {
    position: 'fixed', inset: '0',
    width: '100%', height: '100%',
    zIndex: '-2', pointerEvents: 'none',
  });
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');

  // ── Config ────────────────────────────────────────────────────────────────
  const NODE_COUNT  = 95;
  const EDGE_DIST   = 140;
  const PULSE_EVERY = 90;   // frames between auto pulses

  // Depth layers: 0 = far (dim, slow), 1 = mid, 2 = near (bright, fast)
  const LAYERS = [
    { speed: 0.12, rMin: 0.6, rMax: 1.2, alpha: 0.25, edgeAlpha: 0.12, count: 0.35 },
    { speed: 0.25, rMin: 1.2, rMax: 2.2, alpha: 0.55, edgeAlpha: 0.30, count: 0.40 },
    { speed: 0.40, rMin: 2.0, rMax: 3.5, alpha: 0.90, edgeAlpha: 0.55, count: 0.25 },
  ];

  // Node types: 0 = teal accent, 1 = blue, 2 = dim
  const N_TEAL  = 'rgba(0,255,180,';
  const N_BLUE  = 'rgba(59,130,246,';
  const N_DIM   = 'rgba(0,180,120,';
  const E_TEAL  = 'rgba(0,255,180,';
  const E_BLUE  = 'rgba(59,130,246,';
  const E_DIM   = 'rgba(0,100,80,';

  let W, H, nodes, frame = 0;
  let mouse = { x: -9999, y: -9999, active: false };

  // Expanding ring pulses (separate from node pulses)
  let rings = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    buildNodes();
  }

  function buildNodes() {
    nodes = [];
    LAYERS.forEach((layer, li) => {
      const count = Math.round(NODE_COUNT * layer.count);
      for (let i = 0; i < count; i++) {
        const speed = layer.speed * (0.6 + Math.random() * 0.8);
        const angle = Math.random() * Math.PI * 2;
        nodes.push({
          x:  Math.random() * W,
          y:  Math.random() * H,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          r:  layer.rMin + Math.random() * (layer.rMax - layer.rMin),
          layer: li,
          type: Math.random() < 0.20 ? 0 : Math.random() < 0.38 ? 1 : 2,
          pulse: 0,
          // Slight twinkle phase
          phase: Math.random() * Math.PI * 2,
        });
      }
    });
  }

  resize();
  window.addEventListener('resize', resize);

  // ── Mouse tracking ────────────────────────────────────────────────────────
  function onMouseMove(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  }
  function onMouseLeave() { mouse.active = false; }
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseleave', onMouseLeave);

  // Click → spawn pulse ring at cursor
  window.addEventListener('click', e => {
    rings.push({ x: e.clientX, y: e.clientY, r: 0, maxR: 220, alpha: 0.9, teal: true });
    // Also trigger a node pulse from nearest node
    let best = null, bestD = Infinity;
    nodes.forEach(n => {
      const d = Math.hypot(n.x - e.clientX, n.y - e.clientY);
      if (d < bestD) { bestD = d; best = n; }
    });
    if (best) best.pulse = 1.0;
  });

  // ── Auto pulse ────────────────────────────────────────────────────────────
  function triggerAutoPulse() {
    // Pick a random layer-2 (near) node as source
    const near = nodes.filter(n => n.layer === 2);
    const src  = near[Math.floor(Math.random() * near.length)];
    if (src) {
      src.pulse = 1.0;
      rings.push({ x: src.x, y: src.y, r: 0, maxR: 180, alpha: 0.7, teal: src.type === 0 });
    }
  }

  // ── Draw ──────────────────────────────────────────────────────────────────
  function draw() {
    frame++;
    ctx.clearRect(0, 0, W, H);

    // Ambient centre glow
    const ag = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.min(W,H)*0.55);
    ag.addColorStop(0, 'rgba(0,255,160,0.05)');
    ag.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = ag; ctx.fillRect(0, 0, W, H);

    // Mouse proximity glow
    if (mouse.active) {
      const mg = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 180);
      mg.addColorStop(0, 'rgba(0,255,180,0.07)');
      mg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = mg; ctx.fillRect(0, 0, W, H);
    }

    if (frame % PULSE_EVERY === 0) triggerAutoPulse();

    // ── Pulse propagation ──────────────────────────────────────────────────
    nodes.forEach(n => {
      if (n.pulse > 0.015) {
        nodes.forEach(m => {
          if (m === n) return;
          const d = Math.hypot(m.x - n.x, m.y - n.y);
          if (d < EDGE_DIST + 20 && m.pulse < n.pulse * 0.88)
            m.pulse = Math.max(m.pulse, n.pulse * 0.72);
        });
        n.pulse *= 0.955;
      }
    });

    // ── Expanding rings ────────────────────────────────────────────────────
    rings = rings.filter(ring => ring.alpha > 0.01);
    rings.forEach(ring => {
      const progress = ring.r / ring.maxR;
      ring.r  += 2.8 + ring.r * 0.015;
      ring.alpha *= 0.965;

      const color = ring.teal ? `rgba(0,255,180,` : `rgba(59,130,246,`;
      // Outer ring
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
      ctx.strokeStyle = color + (ring.alpha * 0.7).toFixed(3) + ')';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Inner glowing core ring
      if (ring.r > 8) {
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ring.r * 0.7, 0, Math.PI * 2);
        ctx.strokeStyle = color + (ring.alpha * 0.25).toFixed(3) + ')';
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
    });

    // ── Edges (draw back-to-front by layer) ───────────────────────────────
    for (let li = 0; li < 3; li++) {
      const layer = LAYERS[li];
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        if (a.layer !== li) continue;
        for (let j = i+1; j < nodes.length; j++) {
          const b = nodes[j];
          // Only connect same or adjacent layers
          if (Math.abs(a.layer - b.layer) > 1) continue;
          const dx = b.x - a.x, dy = b.y - a.y;
          const d  = Math.sqrt(dx*dx + dy*dy);
          if (d > EDGE_DIST) continue;

          const proximity = 1 - d / EDGE_DIST;
          const depthAlpha = (layer.edgeAlpha + LAYERS[b.layer].edgeAlpha) / 2;
          const pulse = Math.max(a.pulse, b.pulse);
          const baseAlpha = proximity * depthAlpha;
          const finalAlpha = Math.min(0.85, baseAlpha + pulse * 0.55);

          const ci = (a.type===0||b.type===0) ? E_TEAL : (a.type===1||b.type===1) ? E_BLUE : E_DIM;

          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = ci + finalAlpha.toFixed(3) + ')';
          ctx.lineWidth = pulse > 0.15 ? 0.6 + pulse * 0.9 : 0.4 + proximity * 0.4;
          ctx.stroke();
        }
      }
    }

    // ── Nodes (back-to-front) ─────────────────────────────────────────────
    for (let li = 0; li < 3; li++) {
      const layer = LAYERS[li];
      nodes.forEach(n => {
        if (n.layer !== li) return;

        const p = n.pulse;
        const twinkle = 0.85 + 0.15 * Math.sin(frame * 0.04 + n.phase);
        const baseAlpha = layer.alpha * twinkle;
        const finalAlpha = Math.min(1, baseAlpha + p * 0.35);

        // Mouse repulsion for layer 2 nodes
        if (li === 2 && mouse.active) {
          const mdx = n.x - mouse.x, mdy = n.y - mouse.y;
          const md = Math.sqrt(mdx*mdx + mdy*mdy);
          if (md < 120 && md > 0.1) {
            const force = (1 - md/120) * 0.6;
            n.vx += (mdx / md) * force;
            n.vy += (mdy / md) * force;
            // Speed cap
            const spd = Math.sqrt(n.vx*n.vx + n.vy*n.vy);
            if (spd > layer.speed * 3) { n.vx *= (layer.speed*3)/spd; n.vy *= (layer.speed*3)/spd; }
          }
        }

        // Pulse halo
        if (p > 0.04) {
          const haloR = n.r + p * (li === 2 ? 18 : 10);
          ctx.beginPath();
          ctx.arc(n.x, n.y, haloR, 0, Math.PI*2);
          ctx.fillStyle = n.type===0
            ? `rgba(0,255,180,${p * 0.14 * layer.alpha})`
            : `rgba(59,130,246,${p * 0.11 * layer.alpha})`;
          ctx.fill();
        }

        // Core dot
        const drawR = n.r + (p > 0.12 ? p * (li+1) * 0.9 : 0);
        ctx.beginPath();
        ctx.arc(n.x, n.y, drawR, 0, Math.PI*2);
        ctx.fillStyle = n.type===0
          ? N_TEAL + finalAlpha.toFixed(3) + ')'
          : n.type===1
            ? N_BLUE + (finalAlpha * 0.85).toFixed(3) + ')'
            : N_DIM  + (finalAlpha * 0.5).toFixed(3) + ')';
        ctx.fill();

        // Bright centre highlight on large near-layer nodes
        if (li === 2 && n.r > 2.5) {
          ctx.beginPath();
          ctx.arc(n.x - n.r*0.25, n.y - n.r*0.25, n.r * 0.35, 0, Math.PI*2);
          ctx.fillStyle = `rgba(255,255,255,${0.25 * twinkle})`;
          ctx.fill();
        }

        // Move + friction to avoid runaway speed
        n.vx *= 0.998; n.vy *= 0.998;
        n.x += n.vx; n.y += n.vy;
        if (n.x < -20) n.x = W+20;
        if (n.x > W+20) n.x = -20;
        if (n.y < -20) n.y = H+20;
        if (n.y > H+20) n.y = -20;
      });
    }

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
}
