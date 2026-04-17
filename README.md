# CyberAnalyst

Website link: https://com-480-data-visualization.github.io/CyberAnalyst/

## Dataset

This is a list of incidents from 2000 to 2024 with over 60 variables such as start to end date, threat actors, attack type and much more. Some of these are easier to process than others.

The data is sourced by the European Repository of Cyber Incidents (EuRepoC) and reviewed by interdisciplinary experts. 

For processing, the data types are pretty generic. We often have countries concerned or basic attack type categories which are easy to classify and present. Others like the detailed names and descriptions will need a little more pre-processing through the use of LLMs.

# Problematic: Evolution of Cyber Warfare

There is an ever going armsrace between countries, companies and individuals over data, be it bank records, military positions or simple tiktok trends. Cybersecurity is the study of preventing such attacks and through our dataset we can retrace their history and link them to different geopolitical conflicts.

With the resources available, we can:
- Plot intensity and frequence of cyber attacks over time
- Map out attacks and concerned actors, while linking them to wider political events
- Identify trends in intent from simple disruption to corporate espionnage.

By doing this, we summarise 2 decades of cyber war and make it readable. This allows us to reach an audience of analysts that might want to catch up on what has been happening without any of the technical side. It allows may cater to the curiousities of the average person for geopolitical conflicts.

## Exploratory Data Analysis

*Pre-processing of the data set you chose*
*• Show some basic statistics and get insights about the data*

### EuRepoC Global Dataset

The EuRepoC dataset is a structured CSV where each row represents one cyber incident. Most fields are categorical (country names, attack type, initiator category) with multi-value entries separated by semicolons — for example, a single incident may list several receiver countries or several attack types at once. These were exploded and deduplicated before analysis.

We provide basic statistics in a [Jupyter notebook](Analysis/eurepoc_global_dataset_1_3%20analysis.ipynb), notably:

- **Incident volume over time** — incidents per year from 2000 to 2024, showing the sharp escalation from ~30/year in 2007 to 723 in 2023
- **Attack type breakdown** — frequency of each incident type (Hijacking with Misuse, Disruption, Data theft, Ransomware, etc.) and their trend over time
- **Target and initiator geography** — top 15 targeted countries and top 12 initiator countries (excluding unattributed)
- **Weighted intensity distribution** — mean score of 2.44 out of 11, heavily right-skewed toward low-severity operations
- **Attribution patterns** — attribution rate per year and breakdown of attribution methods (technical/forensic, government statements, legal proceedings)
- **Geopolitical context** — initiator × target heatmap revealing the dominant Russia → Ukraine and China → United States corridors

The main data quality issue is `economic_impact`, missing in ~48% of rows, reflecting how rarely financial damage figures are publicly disclosed. All other key columns are well-populated.

### KTZH Kanton Zürich Cybercrime Dataset

The KTZH dataset is a compact, clean CSV with **93 rows and 10 columns** — one row per subcategory per year. Each row records the number of offences (total, completed, attempted), the population of Kanton Zürich, and an offence rate per 1,000 residents. No values are missing. German category labels were translated to English before analysis.

We provide basic statistics in a [Jupyter notebook](Analysis/KTZH_00001202_00003680%20analysis.ipynb), notably:

- **Total offences per year and year-on-year growth** — from 2,166 in 2017 to 14,162 in 2024, a 6.5× increase; the sharpest single-year jump was +65% between 2017 and 2018, and +46% in 2024
- **Category breakdown** — **Digital Financial Crime** dominates with 78.7% of all offences (42,368 total), followed by Cybercrime narrow (12.7%) and Cyber Sexual Offences (7.3%)
- **Subcategory breakdown** — **Cyber Fraud** alone accounts for 36,126 offences, far ahead of Financial & Package Agents (4,311), Sexual Offences (3,939), and Phishing (3,795)
- **Completion rate by subcategory** — most offences are successfully carried out; Data Leaking and Crypto Theft have near-100% completion, while **Sextortion** has the lowest rate (~66%), suggesting a higher proportion of failed attempts or early interceptions
- **Offence rate per 1,000 residents** — the canton-normalised rate grew from 1.5 in 2017 to 8.8 in 2024, visualised as a heatmap across all subcategories and years

The data is entirely complete with no missing values, though coverage is limited to 8 years (2017–2024) and to Kanton Zürich only — which motivates our comparison with the global EuRepoC dataset.

## Related Work

### EuRepoC Global Dataset

**What others have done with the data:**

EuRepoC publishes an [interactive dashboard](https://eurepoc.eu/dashboard) on their own website, offering filtering by country, year, and actor type. Academic work using the dataset includes studies on cyber conflict escalation, attribution norms, and the relationship between offline and online conflict intensity. The dataset is also used in EU policy reports on cyber diplomacy.

**Why our approach is original:**

EuRepoC's own dashboard is primarily a filter-and-table tool — it doesn't offer narrative, temporal storytelling, or cross-dimensional analysis (e.g. how attack types shift by actor, or how attribution rates evolve). Our visualization will:
- Focus on **interconnections** between actors, targets, and methods rather than isolated statistics
- Use **linked views** so that selecting a country reveals its attack profile, targets, and intensity distribution simultaneously
- Emphasize **geopolitical context** by annotating timelines with real-world events
- Make attribution uncertainty a visible, first-class element of the story

### KTZH Kanton Zürich Cybercrime Statistics

**What others have done with the data:**

The Kantonspolizei Zürich and the Statistical Office of Kanton Zürich publish yearly crime reports that include this data in tabular form. The Federal Statistical Office (FSF) aggregates similar figures nationally in the Swiss Federal Police Crime Statistics (PKS), which is the primary tool used by journalists and policy makers to track crime trends in Switzerland. The PKS offers national-level breakdowns with some cantonal drill-down, but its web interface is limited to static tables and year-by-year PDFs — there is no interactive visualization of longitudinal trends or subcategory dynamics.

Fedpol and the National Cyber Security Centre (NCSC, now BACS) also publish annual threat reports that reference growing cybercrime figures, but these are narrative reports rather than explorable data tools. No publicly available visualization specifically tracks the subcategory-level growth trajectory of cybercrime in Zürich over time.

**Why our approach is original:**

The official presentations of this data (PDF reports, static HTML tables) make it nearly impossible to perceive the structural shifts that are visible in the data: the dominance of financial crime, the acceleration of phishing, the plateau in technical attacks like hacking and DDoS. Our visualization will:
- Show **longitudinal subcategory trends** that are invisible in year-by-year static tables
- Surface the **completion rate dimension** — the contrast between high-success fraud and the lower interception rate of Sextortion tells a story about victim behavior and law enforcement capacity
- Enable **direct comparison with the global EuRepoC data** to show how Switzerland's domestic cybercrime picture relates to the geopolitical threat landscape it sits within
- Frame Zürich as a **local case study** embedded in a global story, grounding abstract geopolitical conflict in concrete, human-scale crime statistics

