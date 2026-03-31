#!/usr/bin/env python3
"""
Reorder PAYE page sections to match Nigeria reference:
  Save CTA → Guide → wise-cta → FAQ → Related Tools → Footer
"""

import re, os, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def extract_section(html, pattern):
    """Extract a section matching pattern and return (section_html, html_without_section)."""
    match = re.search(pattern, html, re.DOTALL)
    if not match:
        return None, html
    section = match.group(0)
    html_without = html[:match.start()] + html[match.end():]
    # Clean up extra blank lines
    html_without = re.sub(r'\n{3,}', '\n\n', html_without)
    return section, html_without


def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()

    # Extract all the sections we want to reorder
    save_sec, html = extract_section(html, r'<!-- SAVE TOOL CTA -->\s*<section class="ng-save-sec">.*?</section>')
    if not save_sec:
        save_sec, html = extract_section(html, r'<section class="ng-save-sec">.*?</section>')

    guide_sec, html = extract_section(html, r'(?:<!-- (?:TWO-COLUMN GUIDE|FAQ) -->\s*)?<section class="ng-guide-sec">.*?</section>')

    # wise-cta div
    wise_sec, html = extract_section(html, r'<div[^>]*>\s*<wise-cta[^>]*></wise-cta>\s*</div>')

    faq_sec, html = extract_section(html, r'(?:<!-- FAQ[^>]*-->\s*)?<section class="ng-faq-sec">.*?</section>')

    related_sec, html = extract_section(html, r'(?:<!-- RELATED TOOLS[^>]*-->\s*)?<afro-related-tools[^>]*></afro-related-tools>')

    footer_sec, html = extract_section(html, r'<afro-footer></afro-footer>')

    if not save_sec or not faq_sec or not related_sec or not footer_sec:
        print(f"  SKIP {os.path.basename(filepath)} — missing critical sections")
        return False

    # Build the ordered block
    ordered = '\n'
    if save_sec:
        ordered += '\n<!-- SAVE TOOL CTA -->\n' + save_sec.strip() + '\n'
    if guide_sec:
        ordered += '\n<!-- TWO-COLUMN GUIDE -->\n' + guide_sec.strip() + '\n'
    if wise_sec:
        ordered += '\n' + wise_sec.strip() + '\n'
    if faq_sec:
        ordered += '\n<!-- FAQ -->\n' + faq_sec.strip() + '\n'
    ordered += '\n<!-- RELATED TOOLS -->\n' + related_sec.strip() + '\n'
    ordered += '\n' + footer_sec.strip() + '\n'

    # Insert the ordered block before the first <script> after the calculator area
    # The best anchor: right before the script tags at the end
    # Find the position where <script> blocks start (after removing all sections)
    # We'll insert before </body> or before the first <script> that follows the main content

    # Actually, let's insert before the first <script> or </body>
    # But we need to be careful — there might be <script> tags inside the calculator

    # Simplest: insert before </body> tag, after removing footer
    # But the scripts need to come after footer...

    # Better approach: find where footer was and insert the ordered block there
    # Since we removed all sections, find the last content before scripts

    # Find insertion point: after last non-script content before </body>
    # Look for the PDF modal end or similar marker

    # Actually the safest: insert before the first standalone <script> tag
    # that appears near the end (after all HTML content)

    # Find the last </section> or </div> before <script> blocks
    script_matches = list(re.finditer(r'\n<script(?:\s|>)', html))
    if script_matches:
        insert_pos = script_matches[0].start()
    else:
        insert_pos = html.find('</body>')

    if insert_pos == -1:
        print(f"  SKIP {os.path.basename(filepath)} — no insertion point")
        return False

    new_html = html[:insert_pos] + ordered + '\n' + html[insert_pos:]

    # Clean up excessive blank lines
    new_html = re.sub(r'\n{4,}', '\n\n', new_html)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_html)

    print(f"  REORDERED {os.path.basename(filepath)}")
    return True


def verify(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()

    save_pos = html.find('ng-save-sec')
    guide_pos = html.find('ng-guide-sec')
    faq_pos = html.find('ng-faq-sec')
    related_pos = html.find('afro-related-tools')
    footer_pos = html.find('afro-footer')

    issues = []
    if save_pos > guide_pos and guide_pos > 0:
        issues.append('save after guide')
    if guide_pos > faq_pos and guide_pos > 0:
        issues.append('guide after faq')
    if faq_pos > related_pos:
        issues.append('faq after related')
    if related_pos > footer_pos:
        issues.append('related after footer')

    if issues:
        print(f"  ORDER ISSUE {os.path.basename(filepath)}: {', '.join(issues)}")
        return False
    return True


def main():
    paye_files = sorted(glob.glob(os.path.join(ROOT, '*', '*-paye.html')))
    paye_files = [f for f in paye_files if
                  'widgets' not in f and
                  os.sep + 'fr' + os.sep not in f and
                  'nigeria' not in f]

    print(f"Reordering {len(paye_files)} PAYE files...\n")

    for filepath in paye_files:
        process_file(filepath)

    print(f"\n=== VERIFICATION ===")
    ok = 0
    for filepath in paye_files:
        if verify(filepath):
            ok += 1
    print(f"\n{ok}/{len(paye_files)} pages in correct order.")


if __name__ == '__main__':
    main()
