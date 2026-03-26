"""Batch-update og:image on French PAYE pages to use dynamic /og-image endpoint."""
import os, re
from urllib.parse import quote

COUNTRY_MAP = {
    'algerie': 'DZ', 'algeria': 'DZ',
    'benin': 'BJ',
    'burkina-faso': 'BF',
    'burundi': 'BI',
    'cameroun': 'CM', 'cameroon': 'CM',
    'cape-verde': 'CV',
    'car': 'CF', 'centrafrique': 'CF',
    'comores': 'KM',
    'congo': 'CG',
    'cote-divoire': 'CI',
    'djibouti': 'DJ',
    'dr-congo': 'CD',
    'eq-guinea': 'GQ',
    'gabon': 'GA',
    'ghana': 'GH',
    'guinea': 'GN', 'guinee': 'GN',
    'guinea-bissau': 'GW',
    'madagascar': 'MG',
    'mali': 'ML',
    'maroc': 'MA', 'morocco': 'MA',
    'mauritanie': 'MR', 'mauritania': 'MR',
    'mauritius': 'MU',
    'mayotte': 'YT',
    'niger': 'NE',
    'nigeria': 'NG',
    'kenya': 'KE',
    'reunion': 'RE',
    'rwanda': 'RW',
    'senegal': 'SN',
    'seychelles': 'SC',
    'togo': 'TG',
    'tunisie': 'TN', 'tunisia': 'TN',
    'south-africa': 'ZA',
}

updated = 0
skipped = 0

fr_dir = os.path.join(os.path.dirname(__file__), '..', 'fr')

for root, dirs, files in os.walk(fr_dir):
    for fname in files:
        if not fname.endswith('.html'):
            continue
        fpath = os.path.join(root, fname)
        rel = fpath.replace('\\', '/').lower()

        # Skip blog and comparison pages (already updated)
        if '/blog/' in rel or '/comparer/' in rel:
            skipped += 1
            continue

        with open(fpath, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()

        # Only process pages with a static og:image (skip if already dynamic)
        if 'og-image?' in content:
            skipped += 1
            continue
        if 'og:image' not in content or '/assets/img/' not in content:
            skipped += 1
            continue

        # Extract og:title
        m = re.search(r'<meta\s+property="og:title"\s+content="([^"]+)"', content)
        if not m:
            m = re.search(r'<meta\s+content="([^"]+)"\s+property="og:title"', content)
        title = m.group(1) if m else 'Calculateur AfroTools'

        # Get country code from path parts
        parts = rel.split('/')
        country_code = 'CI'  # default francophone
        for part in parts:
            if part in COUNTRY_MAP:
                country_code = COUNTRY_MAP[part]
                break

        # Build dynamic URL
        encoded_title = quote(title, safe='')
        sub = quote('Calculateur fiscal gratuit — Afrique francophone', safe='')
        new_url = f'https://afrotools.com/og-image?title={encoded_title}&country={country_code}&sub={sub}&lang=fr'

        # Replace og:image content attribute
        new_content = re.sub(
            r'(<meta\s+property="og:image"[^>]*content=")[^"]*(")',
            lambda m: m.group(1) + new_url + m.group(2),
            content
        )
        # Also handle reversed attribute order
        new_content = re.sub(
            r'(<meta\s+content=")[^"]*("\s+property="og:image")',
            lambda m: m.group(1) + new_url + m.group(2),
            new_content
        )

        if new_content != content:
            with open(fpath, 'w', encoding='utf-8', errors='replace') as f:
                f.write(new_content)
            updated += 1
        else:
            skipped += 1

print(f"Updated: {updated} files")
print(f"Skipped: {skipped} files")
