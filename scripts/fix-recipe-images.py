#!/usr/bin/env python3
"""
Fix recipe pages:
1. Update og:image + twitter:image to use the recipe's actual Unsplash photo
2. Inject a visible <img> element into the hero card so users see the food photo
"""
import os
import re
import sys

RECIPES_DIR = os.path.join(os.path.dirname(__file__), '..', 'tools', 'afrokitchen', 'recipes')
FALLBACK_IMG = 'https://afrotools.com/assets/img/og-default.png'

# Regex to pull the first "image" field from the Recipe JSON-LD block
IMG_IN_SCHEMA = re.compile(r'"image"\s*:\s*"(https://images\.unsplash\.com/[^"]+)"')

OG_IMAGE_TAG = re.compile(
    r'(<meta property="og:image" content=")[^"]+(")',
)
TWITTER_IMAGE_TAG = re.compile(
    r'(<meta name="twitter:image" content=")[^"]+(")',
)

# Where to inject the hero image — just before the credit line in the hero card
CREDIT_LINE = re.compile(
    r'(\s*<div class="ak-static-credit">)',
)

IMG_TEMPLATE = (
    '\n        <img src="{url}" alt="{name}" '
    'class="ak-static-hero-img" loading="lazy" width="600" height="400" '
    'style="width:100%;height:220px;object-fit:cover;border-radius:12px;margin-bottom:4px;">'
)

# Pull recipe name from <title>
TITLE_RE = re.compile(r'<title>([^|<]+)')

updated = 0
skipped = 0
already_ok = 0

for entry in sorted(os.listdir(RECIPES_DIR)):
    fpath = os.path.join(RECIPES_DIR, entry, 'index.html')
    if not os.path.isfile(fpath):
        continue

    html = open(fpath, encoding='utf-8').read()

    m = IMG_IN_SCHEMA.search(html)
    if not m:
        skipped += 1
        continue

    unsplash_url = m.group(1)

    # Check if already fixed
    if unsplash_url in html and FALLBACK_IMG not in html:
        already_ok += 1
        continue

    # Pull recipe name for alt text
    name_m = TITLE_RE.search(html)
    recipe_name = name_m.group(1).strip() if name_m else entry

    new_html = html

    # 1. Update og:image
    new_html = OG_IMAGE_TAG.sub(r'\g<1>' + unsplash_url + r'\g<2>', new_html)

    # 2. Update twitter:image
    new_html = TWITTER_IMAGE_TAG.sub(r'\g<1>' + unsplash_url + r'\g<2>', new_html)

    # 3. Inject <img> before the credit line (only if not already there)
    if 'ak-static-hero-img' not in new_html:
        img_tag = IMG_TEMPLATE.format(url=unsplash_url, name=recipe_name)
        new_html = CREDIT_LINE.sub(img_tag + r'\1', new_html, count=1)

    if new_html != html:
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(new_html)
        updated += 1
        print(f'  fixed: {entry}')

print(f'\nDone — updated: {updated}, skipped (no unsplash url): {skipped}, already ok: {already_ok}')
