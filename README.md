# CyberAnalyst

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

