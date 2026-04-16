# **CyberAnalysts** - Milestone 2

## Project Goal

There is an ever-going arms race between countries, companies, and individuals over data — be it bank records, military positions, or political influence. Our project retraces the history of cyber conflict and links it to the geopolitical events that shaped it, making two decades of cyber warfare readable to anyone without a technical background.

Our project helps users understand:

- **Where attacks happen globally** — which countries are the most targeted and what types of attacks they face
- **How attack types evolve over time** — tracking shifts in the nature of cyberattacks across the years, and how major geopolitical events correlate with those shifts
- **Whether Switzerland is as exposed as other nations** — evaluating if Switzerland faces the same level and severity of attacks as the most targeted countries in the world

## Visualizations

### 1) World Map of Attack Intensity by Country & by Attack Type (selectable) — Choropleth Map

#### Description & sketch

A choropleth world map where each country is colored by its **share of global cyber attacks**, with darker shades indicating a higher percentage. The default view shows overall attack intensity across all types.

On the side, a **dropdown menu** lets the user filter by attack category:
- All (default)
- Disruption
- Exploitation
- Info-Ops
- Others

Selecting a category updates the map to show each country's share of that specific attack type, for example, switching to "Disruption" would highlight Ukraine and Russia more heavily, while "Info-Ops" would shift focus toward the United States. The color scale is always normalized to the currently selected filter so relative differences remain visible.

**Interactions:**
- Dropdown menu to switch between attack type views
- Hover on a country → tooltip showing country name, percentage of selected attack type, and raw incident count
- *(Extra)* Click on a country to pin a detail panel showing its full attack type breakdown

#### Tools & lectures needed

**Tools:**
- D3.js
- TopoJSON
- Leaflet (maybe)

**Lectures:**
- 4_2_D3
- 5_1_Interaction
- 6_1_Perception_colors
- 6_2_Mark_channel
- 8_1_Maps
- 8_2_Practical_maps

### 2) Most Frequent Attack Types per Country Over Time — Streamgraph

#### Description & sketch

A streamgraph showing the **monthly volume of global cyber incidents from 2018 to 2024**, stacked by attack category:
- **Disruption** — DDoS, defacement, wiper malware
- **Exploitation** — data theft, ransomware, hijacking, espionage
- **Info-Ops** — disinformation, phishing, influence campaigns
- **Others**

We chose a streamgraph over a simple line chart because it simultaneously conveys the **total volume explosion** over time and the **shift in attack composition** — for example, the Disruption band visibly doubles after February 2022. A line chart would require the reader to mentally reconstruct both dimensions.

Vertical dashed markers annotate key geopolitical events directly on the time axis, directly addressing the professor's feedback on showing the influence of political context on cyberattacks:
- COVID-19 Pandemic (Mar 2020)
- SolarWinds Breach (Dec 2020)
- Colonial Pipeline Attack (May 2021)
- Russia's Invasion of Ukraine (Feb 2022)
- Israel-Hamas Conflict (Oct 2023)

**Interactions:**
- Hover on each band → exact incident count and percentage for that month
- Hover on event markers → short annotation explaining the event and its cyber impact
- *(Extra)* Toggle to isolate/hide individual attack categories

#### Tools & lectures needed

**Tools:**
- D3.js
- Plotly.js

**Lectures:**
- 4_2_D3
- 5_1_Interaction
- 6_1_Perception_colors
- 6_2_Mark_channel
- 11_1_Tabular_data

### 3) Comparing Switzerland Against Other Countries — Grouped Bar Chart + Intensity Panel

#### Description & sketch

After seeing the global picture in visualizations 1 and 2, this final section zooms in on Switzerland: directly addressing the professor's feedback — *"evaluate if Switzerland has the same level of attacks as other countries"*.

Two side-by-side panels compare Switzerland against Ukraine, the United States, and the Global Average:

**Left panel — Attack volume & type (grouped bar chart):**
The number of incidents per country broken down by attack type (Disruption, Exploitation, Info-Ops), showing both how frequently Switzerland is targeted compared to other nations and what kind of attacks it faces. Switzerland surprisingly leads on Disruption share (52.2%), higher than even Ukraine.

**Right panel — Attack severity uplift (bar chart):**
The average `weighted_intensity` score (0–11) per country, showing how severe the attacks directed at Switzerland are compared to those hitting other countries. Together the two panels answer the professor's question: not just how often Switzerland is hit, but how hard.

**Interactions:**
- Hover on a bar → exact count or intensity score and raw incident count
- Click a country to highlight it across both panels simultaneously
- *(Extra)* Breakdown of initiator categories per country (state-sponsored vs. criminal vs. hacktivist)
- *(Extra)* Breakdown of targeted sectors per country (critical infrastructure, government, corporate)

#### Tools & lectures needed

**Tools:**
- D3.js
- Plotly.js

**Lectures:**
- 4_2_D3
- 5_1_Interaction
- 6_1_Perception_colors
- 6_2_Mark_channel
- 11_1_Tabular_data


### Website development

## Additional ideas