"""
Generate country-intensity-by-type.json from the EuRepoC CSV.
Maps raw incident_type values to Disruption / Exploitation / Info-Ops / Others
using the same logic as the streamgraph pipeline, then counts incidents per
country per category using the primary receiver country (first before semicolon).
Country names are normalised to match the TopoJSON names used in country-intensity.json.
"""
import csv, json, collections, os

CSV_PATH = os.path.join(os.path.dirname(__file__), '../Dataset/eurepoc_global_dataset_1_3.csv')
EXISTING_PATH = os.path.join(os.path.dirname(__file__), '../docs/public/data/country-intensity.json')
OUT_PATH = os.path.join(os.path.dirname(__file__), '../docs/public/data/country-intensity-by-type.json')

# Raw incident_type values -> high-level category
# An incident can have multiple types separated by semicolons.
# Priority: Disruption > Exploitation > Info-Ops > Others
DISRUPTION_TYPES = {'Disruption'}
EXPLOITATION_TYPES = {'Data theft', 'Data theft & Doxing', 'Hijacking with Misuse',
                      'Hijacking without Misuse', 'Ransomware'}
def categorize(itype):
    parts = {p.strip() for p in itype.split(';')}
    if parts & DISRUPTION_TYPES:
        return 'Disruption'
    if parts & EXPLOITATION_TYPES:
        return 'Exploitation'
    return 'Others'

# CSV country name -> TopoJSON name
NAME_MAP = {
    'United States': 'United States of America',
    'Korea, Republic of': 'South Korea',
    'Iran, Islamic Republic of': 'Iran',
    'Syrian Arab Republic': 'Syria',
    'Russian Federation': 'Russia',
    'Viet Nam': 'Vietnam',
    'Moldova, Republic of': 'Moldova',
    'Tanzania, United Republic of': 'Tanzania',
    'Venezuela, Bolivarian Republic of': 'Venezuela',
    'Bolivia, Plurinational State of': 'Bolivia',
    "Lao People's Democratic Republic": 'Laos',
    'Bosnia and Herzegovina': 'Bosnia and Herz.',
    'Palestinian Territory, Occupied': 'Palestine',
    'French Guiana': 'Fr. Guiana',
    'Congo, The Democratic Republic of the': 'Dem. Rep. Congo',
    'Myanmar': 'Myanmar',
}

# Load existing All data (authoritative country names from Youcef's pipeline)
with open(EXISTING_PATH) as f:
    existing_all = json.load(f)
valid_countries = set(existing_all.keys())

counts = {k: collections.defaultdict(int) for k in ['Disruption', 'Exploitation', 'Others']}

with open(CSV_PATH) as f:
    for row in csv.DictReader(f):
        raw = row.get('receiver_country', '').strip()
        itype = row.get('incident_type', '').strip()
        if not raw or raw == 'Not available':
            continue
        country = raw.split(';')[0].strip()
        if not country or country == 'Not available':
            continue
        country = NAME_MAP.get(country, country)
        if country not in valid_countries:
            continue
        cat = categorize(itype)
        counts[cat][country] += 1

result = {
    'All': existing_all,
    'Disruption': dict(counts['Disruption']),
    'Exploitation': dict(counts['Exploitation']),
}

with open(OUT_PATH, 'w') as f:
    json.dump(result, f)

for cat in ['Disruption', 'Exploitation']:
    d = counts[cat]
    if d:
        top = max(d.items(), key=lambda x: x[1])
        print(f"{cat}: {len(d)} countries, max={top}")
    else:
        print(f"{cat}: no data")

print(f"Written to {OUT_PATH}")
