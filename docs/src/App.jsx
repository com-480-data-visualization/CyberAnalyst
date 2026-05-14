import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import Streamgraph from './Streamgraph';
import ChoroplethMap from './ChoroplethMap';
import NetworkGraph from './NetworkGraph';
import AgeChart from './AgeChart';

/* ── Animated counter ── */
function useCounter(target, duration = 1600) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const tick = (now) => {
          const t = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - t, 3);
          setVal(Math.round(ease * target));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        obs.disconnect();
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);
  return { ref, val };
}

/* ── Scroll-reveal hook ── */
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/* ── Components ── */
function SectionHeader({ number, title, subtitle }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
        <span className="badge-pulse" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 36, height: 36, borderRadius: '50%',
          background: '#00ffe711', border: '1.5px solid #00ffe744',
          color: '#00ffe7', fontSize: 15, fontWeight: 700, flexShrink: 0,
        }}>{number}</span>
        <h2 style={{ fontSize: '1.45em', color: '#e2e8f0', margin: 0, letterSpacing: '-0.02em' }}>
          {title}
        </h2>
      </div>
      {subtitle && <p style={{ color: '#8b9bbf', lineHeight: 1.65, paddingLeft: 50 }}>{subtitle}</p>}
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div className="card-scanline" style={{
      background: '#0f1117',
      border: '1px solid #1e2330',
      borderRadius: 14,
      padding: '28px',
      boxShadow: '0 4px 32px #00000066',
      ...style,
    }}>
      {children}
    </div>
  );
}

function StatBadge({ label, value, suffix = '', color = '#00ffe7', delay = 0 }) {
  const { ref, val } = useCounter(value);
  return (
    <div ref={ref} className="stat-float" style={{
      background: '#141720', border: `1px solid ${color}33`,
      borderRadius: 10, padding: '14px 20px', textAlign: 'center', minWidth: 120,
      animationDelay: `${delay}s`,
      transition: 'border-color 0.3s, box-shadow 0.3s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color + '88'; e.currentTarget.style.boxShadow = `0 0 20px ${color}22`; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = color + '33'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ fontSize: 26, fontWeight: 700, color, letterSpacing: '-0.03em' }}>
        {val}{suffix}
      </div>
      <div style={{ fontSize: 11, color: '#4a5568', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </div>
    </div>
  );
}

function InsightCard({ color, icon, text }) {
  return (
    <div style={{
      flex: '1 1 260px',
      background: '#0f1117',
      border: `1px solid ${color}22`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 10, padding: '14px 18px',
      display: 'flex', gap: 12, alignItems: 'flex-start',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${color}22`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
      <p style={{ color: '#8b9bbf', fontSize: 13, lineHeight: 1.65, margin: 0 }}>{text}</p>
    </div>
  );
}

function LoadingPlaceholder({ label }) {
  return (
    <div style={{
      height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#2a3040', fontSize: 13, letterSpacing: '0.05em', gap: 10,
    }}>
      <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
      {label}
    </div>
  );
}

/* ── Main App ── */
export default function App() {
  const sec1Ref = useReveal();
  const sec2Ref = useReveal();
  const sec3Ref = useReveal();

  const [graph1, setGraph1] = useState(null);
  const [countryIntensity, setCountryIntensity] = useState(null);
  const [countrySources, setCountrySources] = useState(null);

  useEffect(() => {
    const base = import.meta.env.BASE_URL;
    fetch(`${base}data/graph1.json`).then(r => r.json()).then(setGraph1);
    fetch(`${base}data/country-intensity.json`).then(r => r.json()).then(setCountryIntensity);
    fetch(`${base}data/country-sources.json`).then(r => r.json()).then(setCountrySources);
  }, []);

  return (
    <div style={{ fontFamily: 'inherit', maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>

      {/* ── HERO ── */}
      <header className="hero-fadein" style={{
        textAlign: 'center', padding: '80px 0 60px',
        borderBottom: '1px solid #1e2330', marginBottom: 70,
      }}>
        <div style={{
          display: 'inline-block', padding: '3px 12px', borderRadius: 6,
          background: '#00ffe711', border: '1px solid #00ffe733',
          color: '#00ffe7', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 22,
        }}>
          COM-480 Data Visualization · EPFL 2025
        </div>

        <h1 className="hero-title" style={{
          fontSize: 'clamp(2.2rem, 5vw, 4rem)', lineHeight: 1.08,
          letterSpacing: '-0.04em', color: '#e2e8f0', marginBottom: 22,
          textShadow: '0 0 60px #00ffe722',
        }}>
          Cyber<span style={{ color: '#00ffe7' }}>Analyst</span>
        </h1>

        <p style={{
          maxWidth: 580, margin: '0 auto 36px', fontSize: '1.1em',
          color: '#8b9bbf', lineHeight: 1.7,
        }}>
          From global geopolitics to local reality — two decades of cyber conflict
          mapped, measured and made readable for anyone.
        </p>

        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <StatBadge value={6000} suffix="+" label="Global incidents"  color="#00ffe7" delay={0.0} />
          <StatBadge value={2024}         label="Up to year"          color="#3b82f6" delay={0.2} />
          <StatBadge value={14087}        label="Swiss reports"       color="#ef4444" delay={0.4} />
          <StatBadge value={160}  suffix="+" label="Countries"        color="#22c55e" delay={0.6} />
        </div>

        <div style={{ marginTop: 44, color: '#2a3040', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          scroll to explore ↓
        </div>
      </header>

      {/* ── SECTION 1 ── */}
      <section ref={sec1Ref} className="reveal" style={{ marginBottom: 80 }}>
        <SectionHeader
          number="1"
          title="The Global Pulse"
          subtitle="Monthly volume of global cyber incidents from 2018 to 2024, broken down by attack category. Geopolitical events are marked — hover the numbered pins for context. Toggle categories to isolate individual bands."
        />
        <Card>
          {graph1 ? <Streamgraph data={graph1} /> : <LoadingPlaceholder label="Streaming incident data…" />}
        </Card>
        <div style={{ display: 'flex', gap: 16, marginTop: 18, flexWrap: 'wrap' }}>
          <InsightCard color="#3b82f6" icon="⚡"
            text="Disruption attacks doubled in Feb 2022 after Russia's invasion of Ukraine, becoming the dominant attack vector." />
          <InsightCard color="#ef4444" icon="🔍"
            text="Exploitation (espionage & ransomware) dominated in 2018–21, peaking during COVID when remote surfaces expanded." />
          <InsightCard color="#22c55e" icon="📢"
            text="Info-Ops campaigns peaked around contested elections and declined sharply after 2022 as kinetic conflict replaced them." />
        </div>
      </section>

      {/* ── SECTION 2 ── */}
      <section ref={sec2Ref} className="reveal" style={{ marginBottom: 80 }}>
        <SectionHeader
          number="2"
          title="Attack Intensity by Country"
          subtitle="Each country is shaded by total incident count in the EuRepoC dataset. Drag to rotate the globe, scroll to explore. Click any country to pin its top attributed threat actors."
        />
        <Card>
          {countryIntensity
            ? <ChoroplethMap countryIntensity={countryIntensity} countrySources={countrySources} />
            : <LoadingPlaceholder label="Loading globe…" />}
        </Card>
        <div style={{ display: 'flex', gap: 16, marginTop: 18, flexWrap: 'wrap' }}>
          <InsightCard color="#00ffe7" icon="🌍"
            text="The United States and Ukraine absorb the largest share of global attacks — the US for espionage, Ukraine for disruption." />
          <InsightCard color="#a855f7" icon="🇨🇭"
            text="Switzerland, despite its neutrality, is a prime target for economic espionage given its financial and pharmaceutical sectors." />
        </div>
      </section>

      {/* ── SECTION 3 ── */}
      <section ref={sec3Ref} className="reveal" style={{ marginBottom: 80 }}>
        <SectionHeader
          number="3"
          title="Switzerland: A Domestic Deep Dive"
          subtitle="Zooming in on reported cybercrime within Switzerland using cantonal police data. Explore how crime categories break down hierarchically and which age groups are most vulnerable."
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
          <Card>
            <h3 style={{ color: '#8b9bbf', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              3a — Cybercrime Structure
            </h3>
            <p style={{ color: '#4a5568', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
              Node size encodes incident volume. Click any node to highlight its full path from root to leaf.
            </p>
            <NetworkGraph />
          </Card>

          <Card>
            <h3 style={{ color: '#8b9bbf', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              3b — Susceptibility by Age Group
            </h3>
            <p style={{ color: '#4a5568', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
              The 35–44 age group files the most cybercrime reports. The <span style={{ color: '#00ffe7' }}>peak bar</span> is highlighted.
            </p>
            <AgeChart />
          </Card>
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 18, flexWrap: 'wrap' }}>
          <InsightCard color="#ef4444" icon="💸"
            text="Cyber fraud dominates Swiss cybercrime at 84% of all reports, with phishing and investment scams leading." />
          <InsightCard color="#00ffe7" icon="👤"
            text="The 35–44 cohort is the most targeted age group, while minors and young adults are comparatively underrepresented." />
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: '1px solid #1e2330', paddingTop: 32, marginTop: 40,
        display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'space-between',
        fontSize: 12, color: '#2a3040',
      }}>
        <div>
          <div style={{ color: '#4a5568', marginBottom: 6, fontWeight: 600 }}>Datasets</div>
          <div>EuRepoC Global Dataset v1.3 — international cyber incidents</div>
          <div>KTZH Cantonal Police — Swiss cybercrime reports (Zurich)</div>
        </div>
        <div>
          <div style={{ color: '#4a5568', marginBottom: 6, fontWeight: 600 }}>Built with</div>
          <div>D3.js · React · Vite · TopoJSON · GitHub Pages</div>
        </div>
        <div>
          <div style={{ color: '#4a5568', marginBottom: 6, fontWeight: 600 }}>Team CyberAnalyst</div>
          <div>COM-480 Data Visualization · EPFL · 2025</div>
        </div>
      </footer>
    </div>
  );
}
