#!/usr/bin/env python3
"""
Fix two issues across all 53 PAYE pages:
1. Add Save button to tool-info-card (between body and footer)
2. Remove old inline-styled SEO sections (duplicated by ng-guide-sec)
"""

import re, os, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SAVE_BLOCK = '''          <div class="tool-info-save">
            <button class="tool-info-save-btn" id="sidebarSaveBtn" onclick="toggleSaveTool()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              <span id="sidebarSaveLabel">Save to My Tools</span>
            </button>
          </div>'''


def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()

    changes = []

    # 1. Add save button to tool-info-card if missing
    if 'tool-info-card' in html and 'tool-info-save' not in html:
        # Insert before tool-info-footer
        html = html.replace(
            '          <div class="tool-info-footer">',
            SAVE_BLOCK + '\n          <div class="tool-info-footer">'
        )
        if 'tool-info-save' in html:
            changes.append('added tool-card save')

    # 2. Remove old inline-styled SEO sections
    # Pattern A: <section style="max-width:800px;...">...</section>
    old_seo_a = re.findall(
        r'<section\s+(?:class="container"\s+)?style="[^"]*max-width:\s*800px[^"]*"[^>]*>.*?</section>',
        html, re.DOTALL
    )
    for block in old_seo_a:
        html = html.replace(block, '')
        changes.append('removed old SEO (max-width:800px)')

    # Pattern B: <section style="padding:..."><div style="max-width:800px...">
    old_seo_b = re.findall(
        r'<section\s+style="[^"]*padding:\s*\d+px[^"]*"[^>]*>\s*<div\s+style="[^"]*max-width:\s*800px[^"]*"[^>]*>.*?</div>\s*</section>',
        html, re.DOTALL
    )
    for block in old_seo_b:
        html = html.replace(block, '')
        changes.append('removed old SEO (padding section)')

    # Also remove stray <!-- SEO Guide --> / <!-- SEO Content --> / <!-- More Tools --> comments
    html = re.sub(r'\n*<!-- (?:SEO Guide|SEO Content|More Tools) -->\n*', '\n', html)

    # Also remove stray <!-- FAQ --> comments that are now empty
    html = re.sub(r'\n<!-- FAQ -->\n+(?=\n)', '\n', html)

    # Clean up excessive blank lines
    html = re.sub(r'\n{4,}', '\n\n', html)

    if changes:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html)
        print(f"  FIXED {os.path.basename(filepath)}: {', '.join(changes)}")
    else:
        print(f"  OK    {os.path.basename(filepath)}")

    return changes


def main():
    paye_files = sorted(glob.glob(os.path.join(ROOT, '*', '*-paye.html')))
    paye_files = [f for f in paye_files if
                  'widgets' not in f and
                  os.sep + 'fr' + os.sep not in f and
                  'nigeria' not in f]

    print(f"Processing {len(paye_files)} PAYE files...\n")

    total = 0
    for filepath in paye_files:
        changes = process_file(filepath)
        total += len(changes)

    print(f"\nDone. {total} changes.")

    # Verify
    print("\n=== VERIFICATION ===")
    issues = 0
    for filepath in paye_files:
        with open(filepath, 'r', encoding='utf-8') as f:
            html = f.read()
        fname = os.path.basename(filepath)

        if 'tool-info-card' in html and 'tool-info-save' not in html:
            print(f"  MISSING tool-info-save: {fname}")
            issues += 1

        if re.search(r'style="[^"]*max-width:\s*800px', html):
            print(f"  OLD SEO still present: {fname}")
            issues += 1

    if issues == 0:
        print("  ALL PASS")


if __name__ == '__main__':
    main()
