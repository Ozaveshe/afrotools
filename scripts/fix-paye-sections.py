#!/usr/bin/env python3
"""
Fix all 53 PAYE pages to match Nigeria reference structure:
1. ng-save-sec  — Save CTA
2. ng-guide-sec — Two-column guide (converted from inline-styled SEO section)
3. ng-faq-sec   — Two-column accordion FAQ
Plus: remove <afro-chat>, add save JS, ensure paye-tool.css loaded
"""

import re, os, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Country metadata extracted from file paths + content
def get_country_info(filepath):
    """Extract country name and tool ID from the file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()

    # Get tool_id from afro-related-tools or hidden input
    m = re.search(r'current="([^"]+)"', html)
    tool_id = m.group(1) if m else ''

    # Get country name from <title> or hidden input
    m = re.search(r'value="([^"]+)"[^>]*name="country"', html) or \
        re.search(r'name="country"\s+value="([^"]+)"', html)
    if m:
        country = m.group(1)
    else:
        m = re.search(r'<title>([^|<]+)', html)
        country = m.group(1).split('PAYE')[0].strip() if m else 'This Country'

    return html, country, tool_id


def remove_afro_chat(html):
    """Remove <afro-chat> elements."""
    return re.sub(r'<afro-chat[^>]*>.*?</afro-chat>\s*', '', html, flags=re.DOTALL)


def has_section(html, cls):
    return cls in html


def build_save_cta(country, tool_id):
    return f'''
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
</section>
'''


def convert_inline_seo_to_guide(html, country):
    """Find inline-styled SEO section and convert to ng-guide-sec two-column layout."""
    # Pattern: <section style="max-width:800px..."> with H2, paragraphs, table
    pattern = r'<section\s+style="[^"]*max-width:\s*800px[^"]*"[^>]*>\s*(.*?)\s*</section>'
    match = re.search(pattern, html, re.DOTALL)
    if not match:
        return html, False

    old_section = match.group(0)
    inner = match.group(1)

    # Extract H2
    h2_match = re.search(r'<h2[^>]*>(.*?)</h2>', inner, re.DOTALL)
    title = h2_match.group(1) if h2_match else f'{country} PAYE Tax Guide'
    # Clean inline styles from title
    title = re.sub(r'<[^>]+>', '', title).strip()

    # Extract paragraphs (before the table)
    paragraphs = re.findall(r'<p[^>]*>(.*?)</p>', inner, re.DOTALL)

    # Extract table
    table_match = re.search(r'<(?:div[^>]*>)?\s*<table[^>]*>.*?</table>\s*(?:</div>)?', inner, re.DOTALL)
    table_html = table_match.group(0) if table_match else ''

    # Clean table: remove inline styles, add ng-bands-table class
    if table_html:
        # Remove inline styles from table and its children
        table_clean = re.sub(r'\s+style="[^"]*"', '', table_html)
        # Add proper classes
        table_clean = table_clean.replace('<table', '<table class="ng-bands-table"', 1)
        # Wrap in ng-bands-table-wrap if not already
        if 'ng-bands-table-wrap' not in table_clean:
            table_clean = f'<div class="ng-bands-table-wrap">{table_clean}</div>'
    else:
        table_clean = ''

    # Extract H3 (table title)
    h3_match = re.search(r'<h3[^>]*>(.*?)</h3>', inner, re.DOTALL)
    table_title = re.sub(r'<[^>]+>', '', h3_match.group(1)).strip() if h3_match else f'{country} Tax Bands'

    # Extract footer note (last <p> after table, usually smaller text)
    footer_note = ''
    last_p_match = re.search(r'<p[^>]*>[^<]*(?:employee|employer|applied|currency|source)[^<]*</p>\s*$', inner, re.DOTALL | re.IGNORECASE)
    if last_p_match:
        footer_text = re.sub(r'<[^>]+>', '', last_p_match.group(0)).strip()
        # Remove it from paragraphs list
        for i, p in enumerate(paragraphs):
            clean_p = re.sub(r'<[^>]+>', '', p).strip()
            if clean_p == footer_text:
                paragraphs.pop(i)
                break
        footer_note = f'<p>{footer_text}</p>'

    # Build left column: paragraphs as guide cards
    left_cards = ''
    for p in paragraphs:
        # Clean inline styles
        p_clean = re.sub(r'\s+style="[^"]*"', '', p)
        # Keep <strong>, <a> tags
        left_cards += f'''        <div class="ng-guide-card">
          <p style="font-size:0.85rem;color:#475569;line-height:1.65;margin-bottom:0;">{p_clean}</p>
        </div>
'''

    # Build the ng-guide-sec
    guide_section = f'''<section class="ng-guide-sec">
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
        guide_section += f'''
    <div class="ng-guide-footer-note">
      {footer_note}
    </div>'''

    guide_section += '''
  </div>
</section>'''

    html = html.replace(old_section, guide_section)
    return html, True


def convert_old_faq_to_ng(html, country):
    """Convert old-format FAQ (faq-sec/faq-grid) to ng-faq-sec two-column accordion."""
    # Pattern 1: <section class="container faq-sec"> (Ghana style)
    pattern1 = r'<section\s+class="[^"]*faq-sec[^"]*"[^>]*>.*?</section>'
    # Pattern 2: <section> with FAQ heading and old details
    pattern2 = r'<section[^>]*>\s*<div[^>]*>\s*<span[^>]*>FAQ</span>.*?</section>'

    match = re.search(pattern1, html, re.DOTALL) or re.search(pattern2, html, re.DOTALL)
    if not match:
        return html, False

    old_faq = match.group(0)

    # Skip if already ng-faq-sec
    if 'ng-faq-sec' in old_faq:
        return html, False

    # Extract all <details> items
    details = re.findall(r'<details[^>]*>\s*<summary>(.*?)</summary>\s*(?:<div[^>]*>)?(.*?)(?:</div>)?\s*</details>', old_faq, re.DOTALL)

    if not details:
        return html, False

    # Split into two columns
    mid = (len(details) + 1) // 2
    col1 = details[:mid]
    col2 = details[mid:]

    def build_col(items, first_open=False):
        result = ''
        for i, (summary, answer) in enumerate(items):
            # Clean answer text
            answer = answer.strip()
            # Remove wrapping <p> if not present, add if needed
            if not answer.startswith('<p'):
                answer = f'<p>{answer}</p>'
            open_attr = ' open' if (i == 0 and first_open) else ''
            result += f'''        <details class="ng-faq-item"{open_attr}>
          <summary>{summary.strip()}</summary>
          {answer}
        </details>
'''
        return result

    new_faq = f'''<section class="ng-faq-sec">
  <div class="container">
    <div class="ng-faq-header">
      <span class="eyebrow">{country} Tax FAQ</span>
      <h2 class="ng-faq-title">Common PAYE Questions</h2>
    </div>
    <div class="ng-faq-grid">
      <div class="ng-faq-col">
{build_col(col1, first_open=True)}      </div>
      <div class="ng-faq-col">
{build_col(col2)}      </div>
    </div>
  </div>
</section>'''

    html = html.replace(old_faq, new_faq)
    return html, True


def add_save_js(html, tool_id):
    """Add toggleSaveTool script if not present."""
    if 'toggleSaveTool' in html:
        return html

    save_js = '''<script>
function toggleSaveTool(){
  var KEY='afro_favs_v2',id='{tool_id}';
  var favs=JSON.parse(localStorage.getItem(KEY)||'[]');
  var idx=favs.indexOf(id);
  if(idx>-1){favs.splice(idx,1)}else{favs.push(id)}
  localStorage.setItem(KEY,JSON.stringify(favs));
  updateSaveUI();
}
function updateSaveUI(){
  var KEY='afro_favs_v2',id='{tool_id}';
  var saved=JSON.parse(localStorage.getItem(KEY)||'[]').indexOf(id)>-1;
  var btn=document.getElementById('inlineSaveBtn');
  if(btn){btn.innerHTML=saved?'<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> Saved':'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> Save to My Tools';btn.classList.toggle('saved',saved);}
  var sb=document.querySelector('.tool-info-save-btn');
  if(sb){sb.textContent=saved?'Saved':'Save';sb.classList.toggle('saved',saved);}
}
document.addEventListener('DOMContentLoaded',updateSaveUI);
</script>'''.replace('{tool_id}', tool_id)

    html = html.replace('</body>', save_js + '\n</body>')
    return html


def ensure_paye_css(html):
    """Ensure paye-tool.css is linked."""
    if 'paye-tool.css' in html:
        return html
    # Insert before </head>
    css_link = '<link rel="stylesheet" href="/assets/css/paye-tool.css">\n'
    html = html.replace('</head>', css_link + '</head>')
    return html


def ensure_google_fonts(html):
    """Ensure Instrument Serif font is loaded."""
    if 'Instrument+Serif' in html or 'Instrument Serif' in html:
        return html
    # Add to existing Google Fonts link or insert new one
    if 'fonts.googleapis.com' in html:
        # Add Instrument Serif to existing font link
        m = re.search(r'(https://fonts\.googleapis\.com/css2\?[^"]+)', html)
        if m and 'Instrument' not in m.group(1):
            old_url = m.group(1)
            new_url = old_url + '&family=Instrument+Serif:ital@0;1'
            html = html.replace(old_url, new_url)
    return html


def insert_save_section(html, save_html):
    """Insert save CTA before the first major section after calculator."""
    # Try inserting before ng-guide-sec
    if '<section class="ng-guide-sec">' in html:
        return html.replace('<section class="ng-guide-sec">', save_html + '\n<section class="ng-guide-sec">')
    # Try inserting before wise-cta
    m = re.search(r'<div[^>]*>\s*<wise-cta', html)
    if m:
        return html[:m.start()] + save_html + '\n' + html[m.start():]
    # Try inserting before ng-faq-sec
    if '<section class="ng-faq-sec">' in html:
        return html.replace('<section class="ng-faq-sec">', save_html + '\n<section class="ng-faq-sec">')
    # Try inserting before afro-related-tools
    if '<afro-related-tools' in html:
        m = re.search(r'<afro-related-tools', html)
        return html[:m.start()] + save_html + '\n' + html[m.start():]
    # Try inserting before afro-footer
    if '<afro-footer' in html:
        m = re.search(r'<afro-footer', html)
        return html[:m.start()] + save_html + '\n' + html[m.start():]
    return html


def process_file(filepath):
    html, country, tool_id = get_country_info(filepath)
    changes = []

    # Remove afro-chat
    new_html = remove_afro_chat(html)
    if new_html != html:
        changes.append('removed afro-chat')
        html = new_html

    # Ensure CSS
    html = ensure_paye_css(html)
    html = ensure_google_fonts(html)

    # Convert inline SEO section to ng-guide-sec (if not already present)
    if not has_section(html, 'ng-guide-sec'):
        html, converted = convert_inline_seo_to_guide(html, country)
        if converted:
            changes.append('converted SEO to ng-guide-sec')

    # Convert old FAQ to ng-faq-sec (if not already present)
    if not has_section(html, 'ng-faq-sec'):
        html, converted = convert_old_faq_to_ng(html, country)
        if converted:
            changes.append('converted FAQ to ng-faq-sec')

    # Add save CTA (if not already present)
    if not has_section(html, 'ng-save-sec'):
        save_html = build_save_cta(country, tool_id)
        html = insert_save_section(html, save_html)
        if has_section(html, 'ng-save-sec'):
            changes.append('added ng-save-sec')

    # Add save JS
    old_len = len(html)
    html = add_save_js(html, tool_id)
    if len(html) != old_len:
        changes.append('added save JS')

    if changes:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html)
        print(f"  FIXED {os.path.basename(filepath)}: {', '.join(changes)}")
    else:
        print(f"  OK    {os.path.basename(filepath)}")

    return changes


def main():
    paye_files = sorted(glob.glob(os.path.join(ROOT, '*', '*-paye.html')))
    # Exclude widgets, fr, nigeria
    paye_files = [f for f in paye_files if
                  'widgets' not in f and
                  os.sep + 'fr' + os.sep not in f and
                  'nigeria' not in f]

    print(f"Processing {len(paye_files)} PAYE files...\n")

    total_changes = 0
    for filepath in paye_files:
        changes = process_file(filepath)
        total_changes += len(changes)

    print(f"\nDone. {total_changes} changes across {len(paye_files)} files.")

    # Verify
    print("\n=== VERIFICATION ===")
    for section in ['ng-save-sec', 'ng-guide-sec', 'ng-faq-sec']:
        missing = []
        for filepath in paye_files:
            with open(filepath, 'r', encoding='utf-8') as f:
                if section not in f.read():
                    missing.append(os.path.basename(filepath))
        if missing:
            print(f"MISSING {section}: {', '.join(missing)}")
        else:
            print(f"ALL OK: {section}")


if __name__ == '__main__':
    main()
