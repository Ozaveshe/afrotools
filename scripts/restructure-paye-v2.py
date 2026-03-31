#!/usr/bin/env python3
"""
Single-pass restructure of all 53 PAYE pages to match Nigeria reference.
Inserts Save CTA + Guide + FAQ sections before <afro-related-tools>.
Converts old FAQ and inline SEO sections to new format.
Removes <afro-chat>.
"""

import re, os, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def get_meta(html):
    """Extract country name and tool ID."""
    m = re.search(r'current="([^"]+)"', html)
    tool_id = m.group(1) if m else ''

    m = re.search(r'name="country"\s+value="([^"]+)"', html) or \
        re.search(r'value="([^"]+)"[^>]*name="country"', html)
    if m:
        country = m.group(1)
    else:
        m = re.search(r'<title>([^|<]+)', html)
        country = m.group(1).split('PAYE')[0].strip() if m else 'Unknown'
    return country, tool_id


def build_save_cta(country, tool_id):
    return f'''<!-- SAVE TOOL CTA -->
<section class="ng-save-sec">
  <div class="container">
    <div class="ng-save-card">
      <div class="ng-save-left">
        <div class="ng-save-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        </div>
        <div>
          <h3 class="ng-save-title">Save this calculator</h3>
          <p class="ng-save-desc">Bookmark {country} PAYE to your personal dashboard for quick access anytime.</p>
        </div>
      </div>
      <div class="ng-save-actions">
        <button class="ng-save-btn" id="inlineSaveBtn" onclick="toggleSaveTool()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          Save to My Tools
        </button>
        <button class="ng-save-btn ng-save-btn-ghost" onclick="typeof shareCalc==='function'?shareCalc():navigator.share?.({{title:document.title,url:location.href}})">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          Share
        </button>
      </div>
    </div>
  </div>
</section>'''


def extract_faq_items(html):
    """Extract FAQ Q&A pairs from various old formats."""
    items = []

    # Format 1: <details><summary>Q</summary><div class="faq-a">A</div></details>
    details = re.findall(
        r'<details[^>]*>\s*<summary>(.*?)</summary>\s*(?:<div[^>]*>)?(.*?)(?:</div>)?\s*</details>',
        html, re.DOTALL
    )
    if details:
        for q, a in details:
            a = a.strip()
            if not a.startswith('<p'):
                a = f'<p>{a}</p>'
            items.append((q.strip(), a))
        return items

    # Format 2: <div class="faq-item"><div class="faq-q">Q</div><p class="faq-a">A</p></div>
    faq_divs = re.findall(
        r'<div[^>]*class="faq-item"[^>]*>\s*<div[^>]*class="faq-q"[^>]*>(.*?)</div>\s*<p[^>]*class="faq-a"[^>]*>(.*?)</p>\s*</div>',
        html, re.DOTALL
    )
    if faq_divs:
        for q, a in faq_divs:
            items.append((q.strip(), f'<p>{a.strip()}</p>'))
        return items

    # Format 3: Inline styled divs (CAR/Eq Guinea style)
    inline_items = re.findall(
        r'<div[^>]*style="[^"]*padding:\s*18px[^"]*"[^>]*>\s*<div[^>]*>(.*?)</div>\s*<p[^>]*>(.*?)</p>\s*</div>',
        html, re.DOTALL
    )
    if inline_items:
        for q, a in inline_items:
            items.append((q.strip(), f'<p>{a.strip()}</p>'))
        return items

    return items


def build_faq_section(items, country):
    if not items:
        return ''

    mid = (len(items) + 1) // 2
    col1 = items[:mid]
    col2 = items[mid:]

    def col_html(col_items, first_open=False):
        out = ''
        for i, (q, a) in enumerate(col_items):
            open_attr = ' open' if (i == 0 and first_open) else ''
            out += f'''        <details class="ng-faq-item"{open_attr}>
          <summary>{q}</summary>
          {a}
        </details>
'''
        return out

    return f'''<!-- FAQ -->
<section class="ng-faq-sec">
  <div class="container">
    <div class="ng-faq-header">
      <span class="eyebrow">{country} Tax FAQ</span>
      <h2 class="ng-faq-title">Common PAYE Questions</h2>
    </div>
    <div class="ng-faq-grid">
      <div class="ng-faq-col">
{col_html(col1, first_open=True)}      </div>
      <div class="ng-faq-col">
{col_html(col2)}      </div>
    </div>
  </div>
</section>'''


def extract_and_build_guide(html, country):
    """Find inline-styled SEO section and convert to ng-guide-sec."""
    # Pattern 1: <section style="max-width:800px...">
    pattern1 = r'<section\s+style="[^"]*max-width:\s*800px[^"]*"[^>]*>\s*(.*?)\s*</section>'
    # Pattern 2: <section style="padding:..."><div style="max-width:800px...">
    pattern2 = r'<section\s+style="[^"]*padding:[^"]*"[^>]*>\s*<div\s+style="[^"]*max-width:\s*800px[^"]*"[^>]*>\s*(.*?)\s*</div>\s*</section>'
    # Pattern 3: Ghana-style <section> with class containing guide/seo content
    pattern3 = r'<section\s+style="[^"]*padding:[^"]*background:[^"]*"[^>]*>\s*<div[^>]*>\s*(.*?)\s*</div>\s*</section>'

    match = re.search(pattern1, html, re.DOTALL)
    if not match:
        match = re.search(pattern2, html, re.DOTALL)
    if not match:
        # Try pattern3 only if it contains a tax guide heading
        match = re.search(pattern3, html, re.DOTALL)
        if match and not re.search(r'(?:Tax Guide|PAYE.*Calculated|Tax Bands)', match.group(1), re.IGNORECASE):
            match = None

    if not match:
        return '', html

    old_section = match.group(0)
    inner = match.group(1)

    # Extract H2
    h2_match = re.search(r'<h2[^>]*>(.*?)</h2>', inner, re.DOTALL)
    title = re.sub(r'<[^>]+>', '', h2_match.group(1)).strip() if h2_match else f'{country} PAYE Tax Guide'

    # Extract paragraphs
    paragraphs = re.findall(r'<p[^>]*>(.*?)</p>', inner, re.DOTALL)

    # Extract table
    table_match = re.search(r'(?:<div[^>]*>\s*)?<table[^>]*>.*?</table>(?:\s*</div>)?', inner, re.DOTALL)
    table_html = table_match.group(0) if table_match else ''

    # Extract H3
    h3_match = re.search(r'<h3[^>]*>(.*?)</h3>', inner, re.DOTALL)
    table_title = re.sub(r'<[^>]+>', '', h3_match.group(1)).strip() if h3_match else f'{country} Tax Bands'

    # Find and remove footer note from paragraphs
    footer_note = ''
    if paragraphs:
        last_p = paragraphs[-1]
        clean_last = re.sub(r'<[^>]+>', '', last_p).strip().lower()
        if any(kw in clean_last for kw in ['employee', 'employer', 'applied', 'currency', 'source', 'annual']):
            if len(clean_last) < 200:  # Short note
                footer_note = f'<p>{paragraphs.pop()}</p>'

    # Clean table
    if table_html:
        table_clean = re.sub(r'\s+style="[^"]*"', '', table_html)
        table_clean = table_clean.replace('<table', '<table class="ng-bands-table"', 1)
        if 'ng-bands-table-wrap' not in table_clean:
            table_clean = f'<div class="ng-bands-table-wrap">{table_clean}</div>'
    else:
        table_clean = ''

    # Build left column cards
    left_cards = ''
    for p in paragraphs:
        p_clean = re.sub(r'\s+style="[^"]*"', '', p)
        left_cards += f'''        <div class="ng-guide-card">
          <p style="font-size:0.85rem;color:#475569;line-height:1.65;margin-bottom:0;">{p_clean}</p>
        </div>
'''

    guide = f'''<!-- TWO-COLUMN GUIDE -->
<section class="ng-guide-sec">
  <div class="container">
    <div class="ng-guide-header">
      <h2 class="ng-guide-title">{title}</h2>
    </div>
    <div class="ng-guide-grid">
      <div class="ng-guide-col">
{left_cards}      </div>
      <div class="ng-guide-col">
        <div class="ng-guide-card ng-guide-card-table">
          <h3>{table_title}</h3>
          {table_clean}
        </div>
      </div>
    </div>'''

    if footer_note:
        footer_clean = re.sub(r'\s+style="[^"]*"', '', footer_note)
        guide += f'''
    <div class="ng-guide-footer-note">
      {footer_clean}
    </div>'''

    guide += '''
  </div>
</section>'''

    # Remove old section from HTML
    html = html.replace(old_section, '')
    return guide, html


def find_old_faq(html):
    """Find and remove old FAQ section, return items and cleaned HTML."""
    # Pattern 1: <section class="faq-sec"> with faq-inner
    m = re.search(r'<section\s+class="faq-sec"[^>]*>.*?</section>', html, re.DOTALL)
    if m:
        items = extract_faq_items(m.group(0))
        html = html[:m.start()] + html[m.end():]
        return items, html

    # Pattern 2: <section class="container faq-sec">
    m = re.search(r'<section\s+class="container faq-sec"[^>]*>.*?</section>', html, re.DOTALL)
    if m:
        items = extract_faq_items(m.group(0))
        html = html[:m.start()] + html[m.end():]
        return items, html

    # Pattern 3: Inline-styled FAQ section (CAR/Eq Guinea)
    m = re.search(r'<section\s+style="[^"]*padding:\s*52px[^"]*"[^>]*>\s*<div[^>]*>\s*<span[^>]*>FAQ</span>.*?</section>', html, re.DOTALL)
    if m:
        items = extract_faq_items(m.group(0))
        html = html[:m.start()] + html[m.end():]
        return items, html

    return [], html


def extract_wise_cta(html):
    """Extract wise-cta div."""
    m = re.search(r'<div[^>]*>\s*<wise-cta[^>]*></wise-cta>\s*</div>', html, re.DOTALL)
    if m:
        wise = m.group(0)
        html = html[:m.start()] + html[m.end():]
        return wise, html
    return '', html


def remove_afro_chat(html):
    return re.sub(r'\s*<afro-chat[^>]*>.*?</afro-chat>', '', html, flags=re.DOTALL)


def add_save_js(html, tool_id):
    if 'toggleSaveTool' in html:
        return html
    js = f'''<script>
function toggleSaveTool(){{
  var KEY='afro_favs_v2',id='{tool_id}';
  var favs=JSON.parse(localStorage.getItem(KEY)||'[]');
  var idx=favs.indexOf(id);
  if(idx>-1){{favs.splice(idx,1)}}else{{favs.push(id)}}
  localStorage.setItem(KEY,JSON.stringify(favs));
  updateSaveUI();
}}
function updateSaveUI(){{
  var KEY='afro_favs_v2',id='{tool_id}';
  var saved=JSON.parse(localStorage.getItem(KEY)||'[]').indexOf(id)>-1;
  var btn=document.getElementById('inlineSaveBtn');
  if(btn){{btn.innerHTML=saved?'<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> Saved':'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> Save to My Tools';btn.classList.toggle('saved',saved);}}
  var sb=document.querySelector('.tool-info-save-btn');
  if(sb){{sb.textContent=saved?'Saved':'Save';sb.classList.toggle('saved',saved);}}
}}
document.addEventListener('DOMContentLoaded',updateSaveUI);
</script>'''
    html = html.replace('</body>', js + '\n</body>')
    return html


def ensure_paye_css(html):
    if 'paye-tool.css' in html:
        return html
    return html.replace('</head>', '<link rel="stylesheet" href="/assets/css/paye-tool.css">\n</head>')


def ensure_instrument_serif(html):
    if 'Instrument+Serif' in html or 'Instrument Serif' in html:
        return html
    m = re.search(r'(https://fonts\.googleapis\.com/css2\?[^"]+)', html)
    if m and 'Instrument' not in m.group(1):
        return html.replace(m.group(1), m.group(1) + '&family=Instrument+Serif:ital@0;1')
    return html


def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()

    country, tool_id = get_meta(html)
    changes = []

    # Skip if already fully restructured
    if 'ng-save-sec' in html and 'ng-guide-sec' in html and 'ng-faq-sec' in html:
        print(f"  SKIP {os.path.basename(filepath)} — already done")
        return

    # Partial fix: if save+faq exist but guide is missing, just add guide
    if 'ng-save-sec' in html and 'ng-faq-sec' in html and 'ng-guide-sec' not in html:
        html = ensure_paye_css(html)
        html = ensure_instrument_serif(html)
        guide_html, html = extract_and_build_guide(html, country)
        if guide_html:
            # Insert guide between save and FAQ
            faq_pos = html.find('<section class="ng-faq-sec">')
            # Look for wise-cta before FAQ
            wise_before_faq = html.rfind('<wise-cta', 0, faq_pos)
            if wise_before_faq > 0:
                # Find the containing div
                div_start = html.rfind('<div', 0, wise_before_faq)
                insert_pos = div_start
            else:
                insert_pos = faq_pos
            html = html[:insert_pos] + '\n' + guide_html + '\n\n' + html[insert_pos:]
            html = re.sub(r'\n{4,}', '\n\n', html)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(html)
            print(f"  PATCHED {os.path.basename(filepath)}: added ng-guide-sec")
        else:
            print(f"  WARN {os.path.basename(filepath)}: no SEO section found for guide conversion")
        return

    # 1. Remove afro-chat
    new_html = remove_afro_chat(html)
    if new_html != html:
        changes.append('removed afro-chat')
        html = new_html

    # 2. Ensure CSS/fonts
    html = ensure_paye_css(html)
    html = ensure_instrument_serif(html)

    # 3. Extract old FAQ items + remove old FAQ section
    faq_items, html = find_old_faq(html)
    if faq_items:
        changes.append(f'extracted {len(faq_items)} FAQ items')

    # 4. Extract and build guide from inline SEO section
    guide_html, html = extract_and_build_guide(html, country)
    if guide_html:
        changes.append('converted SEO to ng-guide-sec')

    # 5. Extract wise-cta (will re-insert in correct position)
    wise_html, html = extract_wise_cta(html)

    # 6. Build all new sections
    save_html = build_save_cta(country, tool_id)
    faq_html = build_faq_section(faq_items, country) if faq_items else ''

    # 7. Build the ordered insertion block
    # Order: Save → Guide → wise-cta → FAQ
    insertion = '\n'
    insertion += save_html + '\n\n'
    if guide_html:
        insertion += guide_html + '\n\n'
    if wise_html:
        insertion += wise_html + '\n\n'
    if faq_html:
        insertion += faq_html + '\n\n'

    changes.append('added ng-save-sec')
    if faq_html:
        changes.append('added ng-faq-sec')

    # 8. Insert before <afro-related-tools>
    anchor = re.search(r'<afro-related-tools[^>]*>', html)
    if anchor:
        pos = anchor.start()
        # Also clean up any stray paragraphs between modal and related-tools
        html = html[:pos] + insertion + html[pos:]
    else:
        # Fallback: insert before <afro-footer>
        anchor = re.search(r'<afro-footer', html)
        if anchor:
            pos = anchor.start()
            html = html[:pos] + insertion + html[pos:]

    # 9. Add save JS
    html = add_save_js(html, tool_id)
    changes.append('added save JS')

    # 10. Clean excessive blank lines
    html = re.sub(r'\n{4,}', '\n\n', html)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(html)

    print(f"  DONE {os.path.basename(filepath)}: {', '.join(changes)}")


def verify_all(paye_files):
    print("\n=== VERIFICATION ===")
    all_ok = True
    for filepath in paye_files:
        with open(filepath, 'r', encoding='utf-8') as f:
            html = f.read()

        fname = os.path.basename(filepath)
        missing = []
        for sec in ['ng-save-sec', 'ng-guide-sec', 'ng-faq-sec']:
            if sec not in html:
                missing.append(sec)

        if missing:
            print(f"  MISSING {fname}: {', '.join(missing)}")
            all_ok = False

        # Check order
        save_pos = html.find('ng-save-sec')
        guide_pos = html.find('ng-guide-sec')
        faq_pos = html.find('ng-faq-sec')
        related_pos = html.find('afro-related-tools')

        order_issues = []
        if save_pos > 0 and guide_pos > 0 and save_pos > guide_pos:
            order_issues.append('save after guide')
        if guide_pos > 0 and faq_pos > 0 and guide_pos > faq_pos:
            order_issues.append('guide after faq')
        if faq_pos > 0 and related_pos > 0 and faq_pos > related_pos:
            order_issues.append('faq after related-tools')

        if order_issues:
            print(f"  ORDER {fname}: {', '.join(order_issues)}")
            all_ok = False

        # Check no afro-chat
        if 'afro-chat' in html:
            print(f"  STRAY afro-chat in {fname}")
            all_ok = False

        # Check save JS
        if 'toggleSaveTool' not in html:
            print(f"  MISSING save JS in {fname}")
            all_ok = False

    if all_ok:
        print("  ALL 53 pages: PASS")
    return all_ok


def main():
    paye_files = sorted(glob.glob(os.path.join(ROOT, '*', '*-paye.html')))
    paye_files = [f for f in paye_files if
                  'widgets' not in f and
                  os.sep + 'fr' + os.sep not in f and
                  'nigeria' not in f]

    print(f"Restructuring {len(paye_files)} PAYE files...\n")

    for filepath in paye_files:
        process_file(filepath)

    verify_all(paye_files)


if __name__ == '__main__':
    main()
