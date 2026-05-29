# CyberAnalyst

**Live site:** https://com-480-data-visualization.github.io/CyberAnalyst/

> Two decades of global cyber conflict — mapped, measured, and made readable for anyone.

COM-480 Data Visualization · EPFL 2026 · Erik Hubner, Youcef Amar, Andre Cadet

---

## Overview

CyberAnalyst is an interactive data story that takes you from the macro-level shape of global cyber warfare down to the lived reality of cybercrime in Switzerland. It is structured in three acts:

1. **The Global Pulse** — monthly attack volumes by category from 2018 to 2024, anchored to real geopolitical events
2. **Attack Intensity by Country** — which nations are most targeted, who is behind the attacks, and how the picture shifts between disruption and espionage
3. **Switzerland: A Domestic Deep Dive** — cantonal police data revealing the structure of local cybercrime and the age groups most at risk

---

## Visualizations

| # | Chart | Dataset | Key Interactions |
|---|-------|---------|-----------------|
| 1 | **Streamgraph** — monthly incident volume by attack category (2018–2024) | EuRepoC Global | Toggle categories · hover crosshair for counts · numbered geopolitical event pins |
| 2 | **Globe** — attack intensity per country on a rotatable 3-D globe | EuRepoC Global | Drag to rotate · filter All / Disruption / Exploitation · click country to pin top threat actors |
| 3a | **Network Graph** — hierarchical structure of Swiss cybercrime | Digital crime: Offences by modus operandi | Click any node to highlight its full root-to-leaf path |
| 3b | **Stacked Bar Chart** — cybercrime reports by age group and attack type | Digital crime: Offences by modus operandi | Click any segment or legend item to isolate that attack type across all age groups |

---

## Datasets

| Dataset | Source | Coverage | Records |
|---------|--------|----------|---------|
| EuRepoC Global Cyber Incidents v1.3 | [eurepoc.eu](https://eurepoc.eu) | 2000–2024, 160+ countries | 6,000+ incidents, 60+ variables |
| Digital crime: Offences by modus operandi | [opendata.swiss](https://opendata.swiss/de/dataset/digitale-kriminalitat-straftaten-nach-modusgruppe/resource/95b86043-256d-4fad-a42b-7e3d36d75f70) | 2020–2024, all Swiss cantons | ~190,000 cybercrime records |

---

## Tech Stack

- **React 18** + **Vite 5** — single-page application
- **D3.js v7** — all chart rendering (streamgraph, orthographic globe, radial network, stacked bar chart)
- **HTML Canvas 2D** — globe renderer and animated node-network background
- **TopoJSON** — world map geometry
- **Google Fonts** — Orbitron, Jura, JetBrains Mono
- **GitHub Actions** + **GitHub Pages** — CI/CD deployment

---

## Run Locally

```bash
cd docs
npm install
npm run dev        # dev server → http://localhost:5173
npm run build      # production build → docs/dist/
```

---

## Project Structure

```
docs/
├── src/
│   ├── App.jsx                  # main layout, narrative, hero
│   ├── Streamgraph.jsx          # section 1 — global pulse
│   ├── ChoroplethMap.jsx        # section 2 — globe
│   ├── NetworkGraph.jsx         # section 3a — Swiss crime structure
│   ├── AgeChart.jsx             # section 3b — age susceptibility
│   └── backgrounds/
│       └── nodeNetwork.js       # animated canvas background
├── public/data/
│   ├── graph1.json                    # streamgraph monthly data
│   ├── country-intensity-by-type.json # globe intensity per attack type
│   ├── country-sources.json           # top threat actors per country
│   └── countries-50m.json             # TopoJSON world map
└── screenshots/                 # process book figures
process-book.pdf                 # 8-page process book
```

---

## Process Book

See [process-book.pdf](process-book.pdf) for the full design process — original sketches, what changed and why, technical challenges, and peer assessment.

---

## Team

| Member | Contributions |
|--------|--------------|
| **Erik Hubner** | Website architecture (React + Vite), Streamgraph (D3, event markers, category toggles), animated background, visual identity, deployment pipeline, process book |
| **Youcef Amar** | Globe (orthographic projection, drag rotation, logarithmic colour scale, threat-actor panel), EuRepoC data processing, attack-type filtering |
| **Andre Cadet** | Network graph (radial layout, click-to-highlight), age bar chart (stacked breakdown), Swiss digital crime data processing, narrative copy, insight cards |
