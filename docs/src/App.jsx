import React, { useState, useEffect } from 'react';
import './App.css'; // Gardons le CSS basique pour l'instant
import PlotLibrary from 'react-plotly.js';
const Plot = PlotLibrary.default || PlotLibrary;
import CyberMap from './CyberMap';

function App() {
  const [graph1, setGraph1] = useState(null);
  const [graph2, setGraph2] = useState(null);
  const [graph3Network, setGraph3Network] = useState(null);
  const [graph3Age, setGraph3Age] = useState(null);
  const [countryIntensity, setCountryIntensity] = useState(null);

  // Charger les données JSON exportées depuis Python
  useEffect(() => {
    const base = import.meta.env.BASE_URL;
    fetch(`${base}data/graph1.json`).then(res => res.json()).then(data => setGraph1(data));
    fetch(`${base}data/graph2.json`).then(res => res.json()).then(data => setGraph2(data));
    fetch(`${base}data/graph3-network.json`).then(res => res.json()).then(data => setGraph3Network(data));
    fetch(`${base}data/graph3-age.json`).then(res => res.json()).then(data => setGraph3Age(data));
    fetch(`${base}data/country-intensity.json`).then(res => res.json()).then(data => setCountryIntensity(data));
  }, []);

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* HEADER */}
      <header style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{ fontSize: '3em', color: '#2c3e50' }}>CyberAnalyst</h1>
        <p style={{ fontSize: '1.2em', color: '#7f8c8d' }}>
          From Global Geopolitics to Local Reality: The Evolution of Cyber Threats
        </p>
      </header>

      {/* <CyberMap countryIntensity={countryIntensity} /> */}

      {/* GRAPH 1: Global Pulse */}
      <section style={{ marginBottom: '80px' }}>
        <h2 style={{ borderBottom: '2px solid #ecf0f1', paddingBottom: '10px' }}>1. The Global Pulse (Geopolitical Context)</h2>
        <p>This streamgraph illustrates the shift from stealth exploitation to aggressive disruption following major geopolitical events, such as the 2022 invasion of Ukraine.</p>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          {graph1 ? (
            <Plot data={graph1.data} layout={{ ...graph1.layout, autosize: true }} useResizeHandler style={{ width: '100%', height: '500px' }} />
          ) : <p>Loading Global Data...</p>}
        </div>
      </section>

      {/* GRAPH 2: Swiss Benchmark */}
      <section style={{ marginBottom: '80px' }}>
        <h2 style={{ borderBottom: '2px solid #ecf0f1', paddingBottom: '10px' }}>2. The Attack Profile Benchmark</h2>
        <p>Evaluating Switzerland's threat landscape against highly targeted nations. While Ukraine faces infrastructure sabotage, Switzerland is a prime target for economic espionage.</p>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          {graph2 ? (
            <Plot data={graph2.data} layout={{ ...graph2.layout, autosize: true }} useResizeHandler style={{ width: '100%', height: '500px' }} />
          ) : <p>Loading Benchmark Data...</p>}
        </div>
      </section>

      {/* GRAPH 3A: Zurich Structure POC */}
      <section style={{ marginBottom: '80px' }}>
        <h2 style={{ borderBottom: '2px solid #ecf0f1', paddingBottom: '10px' }}>3A. Zurich Cybercrime Structure (POC)</h2>
        <p>A placeholder network-style overview of local cybercrime categories and subcategories in Zurich.</p>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          {graph3Network ? (
            <Plot data={graph3Network.data} layout={{ ...graph3Network.layout, autosize: true }} useResizeHandler style={{ width: '100%', height: '600px' }} />
          ) : <p>Loading Zurich Structure POC...</p>}
        </div>
      </section>

      {/* GRAPH 3B: Age Susceptibility POC */}
      <section style={{ marginBottom: '80px' }}>
        <h2 style={{ borderBottom: '2px solid #ecf0f1', paddingBottom: '10px' }}>3B. Age Susceptibility (POC)</h2>
        <p>A placeholder bar chart showing how cybercrime exposure can be compared across age groups.</p>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          {graph3Age ? (
            <Plot data={graph3Age.data} layout={{ ...graph3Age.layout, autosize: true }} useResizeHandler style={{ width: '100%', height: '500px' }} />
          ) : <p>Loading Age POC...</p>}
        </div>
      </section>

      

    </div>
  );
}

export default App;