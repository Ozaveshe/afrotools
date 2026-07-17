#!/usr/bin/env python3
"""
Restructure all 53 PAYE calculator pages to match Nigeria template:
1. Wrap SEO content + FAQ into two-column layout
2. Add Save Tool CTA
3. Convert FAQ to two-column accordion
4. Remove stray <afro-chat> elements
5. Remove duplicate SEO guide sections (keep best one)
6. Consolidate tax band tables into guide section
"""
import re, os, sys, html

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PAGES = [
    "algeria/dz-paye.html", "angola/ao-paye.html", "benin/bj-paye.html",
    "botswana/bw-paye.html", "burkina-faso/bf-paye.html", "burundi/bi-paye.html",
    "cameroon/cm-paye.html", "cape-verde/cv-paye.html", "car/cf-paye.html",
    "chad/td-paye.html", "comoros/km-paye.html", "congo/cg-paye.html",
    "cote-divoire/ci-paye.html", "djibouti/dj-paye.html", "dr-congo/cd-paye.html",
    "egypt/eg-paye.html", "eq-guinea/gq-paye.html", "eritrea/er-paye.html",
    "eswatini/sz-paye.html", "ethiopia/et-paye.html", "gabon/ga-paye.html",
    "gambia/gm-paye.html", "ghana/gh-paye.html", "guinea/gn-paye.html",
    "guinea-bissau/gw-paye.html", "kenya/ke-paye.html", "lesotho/ls-paye.html",
    "liberia/lr-paye.html", "libya/ly-paye.html", "madagascar/mg-paye.html",
    "malawi/mw-paye.html", "mali/ml-paye.html", "mauritania/mr-paye.html",
    "mauritius/mu-paye.html", "morocco/ma-paye.html", "mozambique/mz-paye.html",
    "namibia/na-paye.html", "niger/ne-paye.html", "rwanda/rw-paye.html",
    "sao-tome/st-paye.html", "senegal/sn-paye.html", "seychelles/sc-paye.html",
    "sierra-leone/sl-paye.html", "somalia/so-paye.html", "south-africa/za-paye.html",
    "south-sudan/ss-paye.html", "sudan/sd-paye.html", "tanzania/tz-paye.html",
    "togo/tg-paye.html", "tunisia/tn-paye.html", "uganda/ug-paye.html",
    "zambia/zm-paye.html", "zimbabwe/zw-paye.html",
]

def get_tool_id(path):
    return os.path.basename(path).replace('.html', '')

def remove_afro_chat(content):
    """Remove <afro-chat ...> elements"""
    return re.sub(r'<afro-chat\b[^>]*>[^<]*</afro-chat>\s*', '', content)

def remove_afro_chat_selfclose(content):
    """Remove <afro-chat ... /> or <afro-chat ...></afro-chat>"""
    content = re.sub(r'<afro-chat\b[^>]*/>\s*', '', content)
    content = re.sub(r'<afro-chat\b[^>]*></afro-chat>\s*', '', content)
    return content

def add_save_cta(content, tool_id):
    """Add Save CTA section before the FAQ or first SEO section after </main>"""
    save_html = f'''
<!-- SAVE TOOL CTA -->
<section class="ng-save-sec">
  <div class="container">
    <div class="ng-save-card">
      <div class="ng-save-left">
        <div class="ng-save-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        </div>
        <div>
          <h3 class="ng-save-title">Save this calculator</h3>
          <p class="ng-save-desc">Bookmark to your dashboard for quick access anytime.</p>
        </div>
      </div>
      <div class="ng-save-actions">
        <button class="ng-save-btn" id="inlineSaveBtn" onclick="toggleSaveTool()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          Save to My Tools
        </button>
        <button class="ng-save-btn ng-save-btn-ghost" onclick="navigator.share?.({{title:document.title,url:location.href}})">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          Share
        </button>
      </div>
    </div>
  </div>
</section>
'''
    # Insert after </main>
    if '</main>' in content:
        content = content.replace('</main>', '</main>\n' + save_html, 1)
    return content

def convert_faq_to_accordion(content):
    """Convert old faq-grid/faq-item divs to two-column accordion details"""
    # Find old-style FAQ sections
    faq_match = re.search(
        r'(<section\s+class="faq-sec">.*?</section>)',
        content, re.DOTALL
    )
    if not faq_match:
        return content

    old_faq = faq_match.group(1)

    # Extract title/eyebrow
    eyebrow_m = re.search(r'<span\s+class="eyebrow"[^>]*>(.*?)</span>', old_faq)
    eyebrow = eyebrow_m.group(1) if eyebrow_m else 'Tax FAQ'
    title_m = re.search(r'<h2\s+class="sec-title">(.*?)</h2>', old_faq)
    title = title_m.group(1) if title_m else 'Common Questions'

    # Extract FAQ items - handle both div-based and details-based
    items = []

    # Try div-based first: <div class="faq-item"><div class="faq-q">Q</div><p class="faq-a">A</p></div>
    div_items = re.findall(
        r'<div\s+class="faq-item">\s*<div\s+class="faq-q">(.*?)</div>\s*<p\s+class="faq-a">(.*?)</p>\s*</div>',
        old_faq, re.DOTALL
    )
    for q, a in div_items:
        items.append((q.strip(), a.strip()))

    # Also try details-based: <details class="faq-item"><summary>Q</summary><div class="faq-a">A</div></details>
    det_items = re.findall(
        r'<details\s+class="faq-item">\s*<summary>(.*?)</summary>\s*<div\s+class="faq-a">(.*?)</div>\s*</details>',
        old_faq, re.DOTALL
    )
    for q, a in det_items:
        items.append((q.strip(), a.strip()))

    if not items:
        return content

    # Split into two columns
    mid = (len(items) + 1) // 2
    col1 = items[:mid]
    col2 = items[mid:]

    def make_item(q, a, is_first=False):
        open_attr = ' open' if is_first else ''
        return f'''        <details class="ng-faq-item"{open_attr}>
          <summary>{q}</summary>
          <p>{a}</p>
        </details>'''

    col1_html = '\n'.join(make_item(q, a, i == 0) for i, (q, a) in enumerate(col1))
    col2_html = '\n'.join(make_item(q, a) for q, a in col2)

    new_faq = f'''<section class="ng-faq-sec">
  <div class="container">
    <div class="ng-faq-header">
      <span class="eyebrow">{eyebrow}</span>
      <h2 class="ng-faq-title">{title}</h2>
    </div>
    <div class="ng-faq-grid">
      <div class="ng-faq-col">
{col1_html}
      </div>
      <div class="ng-faq-col">
{col2_html}
      </div>
    </div>
  </div>
</section>'''

    content = content.replace(old_faq, new_faq)
    return content

def wrap_seo_sections(content):
    """Wrap inline-styled SEO sections into ng-guide-sec two-column layout"""
    # Find all standalone SEO content sections (inline styled, max-width 800px boxes)
    seo_pattern = r'<section\s+(?:class="container"\s+)?style="(?:max-width:800px|padding:48px)[^"]*">\s*<(?:div[^>]*>)?\s*<h2[^>]*>.*?</(?:section|div)>\s*(?:</section>)?'
    seo_sections = list(re.finditer(seo_pattern, content, re.DOTALL))

    if not seo_sections:
        return content

    # Extract paragraphs and tables from all SEO sections
    all_paras = []
    all_tables = []
    first_title = None

    for m in seo_sections:
        block = m.group(0)
        # Get the first h2 title
        h2_m = re.search(r'<h2[^>]*>(.*?)</h2>', block, re.DOTALL)
        if h2_m and not first_title:
            first_title = re.sub(r'<[^>]+>', '', h2_m.group(1)).strip()

        # Get paragraphs
        paras = re.findall(r'<p[^>]*>(.*?)</p>', block, re.DOTALL)
        for p in paras:
            p_clean = p.strip()
            if p_clean and len(p_clean) > 50:  # Skip tiny notes
                all_paras.append(p_clean)

        # Get tables
        tables = re.findall(r'(<table.*?</table>)', block, re.DOTALL)
        all_tables.extend(tables)

    if not all_paras and not all_tables:
        return content

    # Deduplicate paragraphs (some sections repeat content)
    seen = set()
    unique_paras = []
    for p in all_paras:
        key = re.sub(r'<[^>]+>', '', p)[:100]
        if key not in seen:
            seen.add(key)
            unique_paras.append(p)

    # Build two-column guide: left = text content, right = table + key facts
    # Take first 3 paras for left, rest for right or below
    left_paras = unique_paras[:3]
    remaining_paras = unique_paras[3:]

    left_html = '\n'.join(
        f'        <p style="font-size:0.85rem;color:#475569;line-height:1.65;margin-bottom:1rem;">{p}</p>'
        for p in left_paras
    )

    # Right column: table if exists, else remaining paras
    right_html = ''
    if all_tables:
        # Clean up table styles to use ng-bands-table class
        table = all_tables[0]  # Use the best/first table
        # Strip inline styles from the table and use our classes
        clean_table = re.sub(r'<table\s+style="[^"]*"', '<table class="ng-bands-table"', table)
        clean_table = re.sub(r'<thead>\s*<tr\s+style="[^"]*"', '<thead><tr', clean_table)
        clean_table = re.sub(r'<th\s+style="[^"]*"', '<th', clean_table)
        clean_table = re.sub(r'<td\s+style="[^"]*"', '<td', clean_table)
        clean_table = re.sub(r'<tr\s+style="[^"]*"', '<tr', clean_table)
        right_html = f'''        <div class="ng-guide-card ng-guide-card-table">
          <div class="ng-bands-table-wrap">
            {clean_table}
          </div>
        </div>'''

    if remaining_paras:
        extra = '\n'.join(
            f'        <p style="font-size:0.85rem;color:#475569;line-height:1.65;margin-bottom:1rem;">{p}</p>'
            for p in remaining_paras[:2]
        )
        right_html += f'\n        <div class="ng-guide-card">\n{extra}\n        </div>'

    if not first_title:
        first_title = 'Tax Guide'

    new_guide = f'''<section class="ng-guide-sec">
  <div class="container">
    <div class="ng-guide-header">
      <h2 class="ng-guide-title">{first_title}</h2>
    </div>
    <div class="ng-guide-grid">
      <div class="ng-guide-col">
        <div class="ng-guide-card">
{left_html}
        </div>
      </div>
      <div class="ng-guide-col">
{right_html}
      </div>
    </div>
  </div>
</section>'''

    # Remove all old SEO sections and insert new one
    # Work backwards to preserve positions
    for m in reversed(seo_sections):
        content = content[:m.start()] + content[m.end():]

    # Insert new guide before the FAQ section
    faq_pos = content.find('<section class="ng-faq-sec">')
    if faq_pos == -1:
        faq_pos = content.find('<section class="faq-sec">')
    if faq_pos == -1:
        faq_pos = content.find('<afro-related-tools')

    if faq_pos != -1:
        content = content[:faq_pos] + new_guide + '\n\n' + content[faq_pos:]

    return content

def add_save_script(content, tool_id):
    """Add inline save/bookmark JS before </body>"""
    if 'toggleSaveTool' in content:
        return content

    save_js = f'''<script>
var SAVE_KEY='afro_favs_v2',TOOL_ID='{tool_id}';
function getSavedTools(){{try{{return JSON.parse(localStorage.getItem(SAVE_KEY))||[]}}catch(e){{return[]}}}}
function isToolSaved(){{return getSavedTools().indexOf(TOOL_ID)>=0}}
function toggleSaveTool(){{var l=getSavedTools(),i=l.indexOf(TOOL_ID),s;if(i>=0){{l.splice(i,1);s=false}}else{{l.unshift(TOOL_ID);if(l.length>50)l=l.slice(0,50);s=true}}localStorage.setItem(SAVE_KEY,JSON.stringify(l));updateSaveUI(s)}}
function updateSaveUI(s){{var b=document.getElementById('inlineSaveBtn');if(b)b.innerHTML=s?'<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> Saved':'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> Save to My Tools'}}
document.addEventListener('DOMContentLoaded',function(){{updateSaveUI(isToolSaved())}});
</script>'''

    content = content.replace('</body>', save_js + '\n</body>')
    return content

def add_paye_css_link(content):
    """Ensure paye-tool.css is loaded (contains ng-* styles)"""
    if 'paye-tool.css' not in content:
        # Add before </head>
        content = content.replace('</head>',
            '  <link rel="stylesheet" href="/assets/css/paye-tool.css">\n</head>')
    return content

def process_file(filepath):
    tool_id = get_tool_id(filepath)
    full = os.path.join(BASE, filepath)

    with open(full, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # 1. Remove stray <afro-chat>
    content = remove_afro_chat(content)
    content = remove_afro_chat_selfclose(content)

    # 2. Add Save CTA after </main>
    if 'ng-save-sec' not in content:
        content = add_save_cta(content, tool_id)

    # 3. Convert FAQ to two-column accordion
    if 'ng-faq-sec' not in content and 'faq-sec' in content:
        content = convert_faq_to_accordion(content)

    # 4. Wrap SEO sections into two-column guide
    if 'ng-guide-sec' not in content:
        content = wrap_seo_sections(content)

    # 5. Add save script
    content = add_save_script(content, tool_id)

    # 6. Ensure paye-tool.css loaded
    content = add_paye_css_link(content)

    # 7. Clean up extra blank lines
    content = re.sub(r'\n{4,}', '\n\n\n', content)

    if content != original:
        with open(full, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  UPDATED: {filepath}")
    else:
        print(f"  (no change): {filepath}")

if __name__ == '__main__':
    for p in PAGES:
        full = os.path.join(BASE, p)
        if os.path.exists(full):
            process_file(p)
        else:
            print(f"  SKIP (not found): {p}")
    print(f"\nDone! Processed {len(PAGES)} files.")
