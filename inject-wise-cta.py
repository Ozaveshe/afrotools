#!/usr/bin/env python3
"""
Inject <wise-cta> into AfroTools pages.
Usage: python inject-wise-cta.py
"""

import os
import re
import glob

BASE = os.path.dirname(os.path.abspath(__file__))

AFFILIATE_LINK = "https://wise.prf.hn/click/camref:1011l5EEWt"

# Pages to skip entirely
SKIP_PATTERNS = [
    "pdf-workspace", "cv-builder", "afrodraft", "engineering/afrodraft",
    "image-", "design-", "developer-", "dev-tools", "qr-",
]

def should_skip(path):
    norm = path.replace("\\", "/").lower()
    return any(p in norm for p in SKIP_PATTERNS)

def already_has_wise_cta(content):
    return "wise-cta" in content or "wise-cta.js" in content

def inject_script_tag(content):
    """Add wise-cta.js before </head> if not already present."""
    if "wise-cta.js" in content:
        return content
    script_tag = '<script src="/assets/js/wise-cta.js" defer></script>\n'
    return content.replace("</head>", script_tag + "</head>", 1)

def inject_cta_tag(content, context, country=""):
    """Inject <wise-cta> before FAQ section or before </main> or before <afro-footer>."""
    country_attr = f' country="{country}"' if country else ""
    cta_html = f'\n<div style="padding: 0 20px; max-width: 760px; margin: 0 auto;">\n  <wise-cta context="{context}"{country_attr}></wise-cta>\n</div>\n'

    # Priority 1: before a FAQ comment or section
    faq_patterns = [
        r'([ \t]*<!--\s*FAQ\s*-->)',
        r'([ \t]*<section[^>]*class="[^"]*faq[^"]*")',
        r'([ \t]*<div[^>]*class="[^"]*faq[^"]*")',
        r'([ \t]*<section[^>]*id="faq[^"]*")',
    ]
    for pat in faq_patterns:
        m = re.search(pat, content, re.IGNORECASE)
        if m:
            return content[:m.start()] + cta_html + content[m.start():]

    # Priority 2: before </main>
    if "</main>" in content:
        return content.replace("</main>", cta_html + "</main>", 1)

    # Priority 3: before <afro-related-tools> or <afro-newsletter-cta>
    for tag in ["<afro-related-tools", "<afro-newsletter-cta", "<afro-footer"]:
        if tag in content:
            return content.replace(tag, cta_html + tag, 1)

    return content

def extract_country_from_html(content, filepath):
    """Try to extract country name from H1 or title."""
    # Try H1 first
    m = re.search(r'<h1[^>]*>([^<]+)</h1>', content, re.IGNORECASE)
    if m:
        text = m.group(1).strip()
        # Look for known country names
        countries = [
            "Nigeria", "Kenya", "Ghana", "South Africa", "Egypt", "Tanzania",
            "Uganda", "Ethiopia", "Cameroon", "Côte d'Ivoire", "Ivory Coast",
            "Senegal", "Mali", "Burkina Faso", "Niger", "Guinea", "Rwanda",
            "Benin", "Togo", "Sierra Leone", "Liberia", "Mauritania", "Gambia",
            "Cabo Verde", "Cape Verde", "Sao Tome", "Equatorial Guinea",
            "Gabon", "Congo", "DRC", "DR Congo", "Central African Republic",
            "Chad", "Sudan", "South Sudan", "Eritrea", "Djibouti", "Somalia",
            "Comoros", "Madagascar", "Mauritius", "Seychelles", "Mozambique",
            "Zimbabwe", "Zambia", "Malawi", "Botswana", "Namibia", "Lesotho",
            "Eswatini", "Swaziland", "Angola", "Libya", "Tunisia", "Algeria",
            "Morocco", "Western Sahara",
        ]
        for c in countries:
            if c.lower() in text.lower():
                return c
    # Fall back to folder name
    parts = filepath.replace("\\", "/").split("/")
    if len(parts) >= 2:
        folder = parts[-3] if parts[-1] == "index.html" else parts[-2]
        return folder.replace("-", " ").title()
    return ""


# ── 1. Budget / Loan / Savings / Compound / Retirement tools ─────────────────
BUDGET_PATTERNS = [
    "budget*", "loan*", "savings*", "retirement*", "compound*",
    "50-30-20*", "envelope*", "album-budget", "beach-holiday-budget",
    "concert-budget", "construction-budget", "festival-travel-budget",
    "film-budget", "funeral-savings", "hajj-budget", "edu-savings",
    "home-loan*", "home-renovation*", "car-loan*", "freelance-invoice",
    "invoice-factoring", "loan-compare", "loan-consolidation",
    "loan-shark*", "microfinance-loan", "proforma-invoice",
    "savings-goal",
]

processed = []
skipped = []

tools_dir = os.path.join(BASE, "tools")

for pattern in BUDGET_PATTERNS:
    matched = glob.glob(os.path.join(tools_dir, pattern, "index.html"))
    for filepath in matched:
        if should_skip(filepath):
            skipped.append(filepath)
            continue
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        if already_has_wise_cta(content):
            print(f"  [skip] already has wise-cta: {filepath}")
            continue
        content = inject_script_tag(content)
        content = inject_cta_tag(content, "budget")
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        processed.append(filepath)
        print(f"  [budget] {filepath}")


# ── 2. PAYE / Salary-Tax pages across all country folders ────────────────────
# Patterns: *-paye, *-salary-tax, *-salary*, *-income-tax
PAYE_PATTERNS = [
    "*-paye*", "*-salary*", "*-income-tax*", "*-payroll*",
]

country_dirs = []
for item in os.listdir(BASE):
    item_path = os.path.join(BASE, item)
    if (os.path.isdir(item_path)
            and not item.startswith(".")
            and item not in ["tools", "assets", "api", "admin", "blog",
                             "about", "contact", "categories", "salary-tax",
                             "engineering", "legal", "fintech", "transport",
                             "education", "energy", "climate", "diaspora",
                             "religious-cultural", "sports", "personal-finance",
                             "mining", "creative", "security", "travel",
                             "career", "manufacturing", "uniquely-african",
                             "node_modules", ".git", ".github", ".claude",
                             "_redirects", "_headers"]):
        country_dirs.append(item_path)

for country_dir in country_dirs:
    for pattern in PAYE_PATTERNS:
        # Check both index.html inside a subdir and .html files directly
        for filepath in glob.glob(os.path.join(country_dir, pattern + "/index.html")):
            if should_skip(filepath):
                skipped.append(filepath)
                continue
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            if already_has_wise_cta(content):
                continue
            country = extract_country_from_html(content, filepath)
            content = inject_script_tag(content)
            content = inject_cta_tag(content, "paye", country)
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(content)
            processed.append(filepath)
            print(f"  [paye] {filepath} (country={country})")

        # Also check .html files directly in country dir
        for filepath in glob.glob(os.path.join(country_dir, pattern + ".html")):
            if should_skip(filepath):
                skipped.append(filepath)
                continue
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            if already_has_wise_cta(content):
                continue
            country = extract_country_from_html(content, filepath)
            content = inject_script_tag(content)
            content = inject_cta_tag(content, "paye", country)
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(content)
            processed.append(filepath)
            print(f"  [paye-html] {filepath} (country={country})")


# ── 3. General fallback: remaining /tools/*/index.html pages ─────────────────
# Exclude already-processed + excluded paths
EXCLUDE_TOOLS = [
    "pdf-workspace", "cv-builder", "afrodraft", "image-", "design-",
    "developer-", "dev-", "qr-", "remittance-compare", "remittance-v2",
    "currency-converter", "vat-calculator", "invoice-generator",
    "mobile-money-fees", "freelance-invoice", "proforma-invoice",
    "invoice-factoring",
]

for filepath in glob.glob(os.path.join(tools_dir, "*/index.html")):
    norm = filepath.replace("\\", "/").lower()
    if any(e in norm for e in EXCLUDE_TOOLS):
        continue
    if should_skip(filepath):
        skipped.append(filepath)
        continue
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    if already_has_wise_cta(content):
        continue
    # Determine context from tool path
    tool_name = os.path.basename(os.path.dirname(filepath)).lower()
    if any(p in tool_name for p in ["budget", "loan", "saving", "retirement", "compound", "50-30"]):
        ctx = "budget"
    elif any(p in tool_name for p in ["salary", "paye", "payroll", "income-tax"]):
        ctx = "paye"
    elif any(p in tool_name for p in ["vat", "tax"]):
        ctx = "vat"
    elif any(p in tool_name for p in ["mobile-money", "mpesa", "momo"]):
        ctx = "mobile-money"
    elif any(p in tool_name for p in ["remit", "send-money", "transfer"]):
        ctx = "remittance"
    elif any(p in tool_name for p in ["currency", "forex", "fx", "exchange"]):
        ctx = "currency"
    else:
        ctx = "general"
    content = inject_script_tag(content)
    content = inject_cta_tag(content, ctx)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    processed.append(filepath)
    print(f"  [general/{ctx}] {filepath}")


print(f"\n✅ Done. Processed {len(processed)} files, skipped {len(skipped)} excluded files.")
