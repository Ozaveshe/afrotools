#!/usr/bin/env python3
"""
Remove <wise-cta> from non-financial AfroTools pages.
Keeps CTAs only on tools where a Wise money-transfer message is relevant.
"""

import os, re, glob

BASE = os.path.dirname(os.path.abspath(__file__))

# ── Tools that should NOT have a Wise CTA ────────────────────────────────────
# These are clearly non-financial: health, language, dev utilities, design,
# education (non-cost), cultural, entertainment, legal/compliance admin.

REMOVE_TOOLS = set([
    # Language / translation
    "amharic-translator", "arabic-numerals", "french-african", "hausa-translator",
    "igbo-translator", "pidgin-translator", "swahili-translator", "transliterate",
    "yoruba-translator", "zulu-translator",

    # Developer / tech utilities
    "african-api-directory", "african-domains", "api-tester", "background-remover",
    "backup-duration", "base64", "binary-converter", "commit-message-gen",
    "cookie-consent", "cron-builder", "css-gradient", "data-converter",
    "diff-checker", "docker-compose-gen", "favicon-generator", "hash-generator",
    "html-entities", "html-to-pdf", "htaccess-gen", "json-formatter", "jwt-decoder",
    "markdown-editor", "meta-tag-gen", "meta-tag-generator", "password-generator",
    "password-strength", "pwa-manifest", "regex-tester", "robots-txt", "sitemap-gen",
    "sql-formatter", "sql-playground", "url-encoder", "ussd-flow-builder",
    "ussd-simulator", "uuid-generator", "color-contrast", "color-picker",
    "colour-palette",

    # PDF tools (document tools, not financial)
    "pdf-bates", "pdf-chat", "pdf-compare", "pdf-compress", "pdf-convert",
    "pdf-editor", "pdf-find-replace", "pdf-form-filler", "pdf-header-footer",
    "pdf-merge-split", "pdf-ocr", "pdf-page-numbers", "pdf-password", "pdf-redact",
    "pdf-reorder", "pdf-repair", "pdf-sign", "pdf-to-audio", "pdf-translate",
    "pdf-watermark", "pdf-workflow", "document-pdf",

    # Health / wellness
    "air-quality", "blood-group", "blood-pressure", "bmi-calculator", "child-growth",
    "csection-vs-natural", "diabetes-risk", "drug-dosage", "due-date",
    "genotype-checker", "malaria-risk", "maternal-mortality", "medical-report",
    "ovulation-calc", "sickle-cell", "vaccine-schedule", "waist-hip-ratio",
    "water-intake", "water-quality",

    # Education (non-cost / non-financial)
    "algebra-solver", "citation-generator", "classroom-size", "course-load",
    "degree-checker", "education-hub", "exam-countdown", "exam-timetable",
    "flashcard-maker", "fraction-calc", "gpa-calculator", "grade-tracker",
    "ielts-calculator", "jamb-aggregate", "kcse-calculator", "matric-points",
    "periodic-table", "phishing-quiz", "plagiarism-pct", "study-planner",
    "university-ranking", "waec-calculator",

    # Cultural / entertainment / lifestyle
    "afcon-predictor", "africa-conflict", "african-meal-plan", "african-name-meaning",
    "african-palette", "african-proverbs", "afroatlas", "afrokitchen",
    "betting-odds", "fantasy-football", "islamic-calendar", "meme-generator",
    "nollywood-pitch", "roman-numerals", "traditional-vs-western",

    # Design / creative (non-business)
    "flyer-maker", "floor-plan", "logo-maker", "social-card", "thumbnail-maker",
    "watermark-bulk",

    # Admin / civic utilities
    "age-calculator", "birth-death-cert", "countdown-timer", "idea-board",
    "marriage-cert", "national-id-guide", "packing-list", "passport-checklist",
    "passport-photo", "pomodoro", "public-holidays", "random-picker",
    "statutory-declaration", "time-zone", "voter-registration",

    # Legal / compliance admin (not financial outcomes)
    "breach-notification", "cross-border-data", "data-compliance", "dpa-generator",
    "dpia-tool", "gdpr-vs-africa", "ip-protection", "ip-rights-africa",
    "kenya-dpa", "legal-aid", "nda-generator", "ndpa-checker", "popia-checker",
    "privacy-policy-gen",

    # Career / HR (non-financial)
    "cover-letter-generator", "interview-prep", "linkedin-optimizer",
    "personal-brand-audit",

    # Social / marketing (non-financial)
    "social-media-calendar",
])

SCRIPT_TAG = '<script src="/assets/js/wise-cta.js" defer></script>'
CTA_PATTERN = re.compile(
    r'\n?<!-- Wise Affiliate CTA -->\n<div[^>]*>\s*<wise-cta[^>]*/?\s*>(?:</wise-cta>)?\s*</div>\n?',
    re.DOTALL
)
# Also match alternate wrapper (section tag)
CTA_PATTERN2 = re.compile(
    r'\n?<!-- Wise Affiliate CTA -->\n<section[^>]*>\s*<wise-cta[^>]*/?\s*>(?:</wise-cta>)?\s*</section>\n?',
    re.DOTALL
)
# Match bare <wise-cta> tags
CTA_PATTERN3 = re.compile(r'\n?[ \t]*<wise-cta[^>]*/?\s*>(?:</wise-cta>)?\n?')

removed = []
errors = []

tools_dir = os.path.join(BASE, "tools")

for tool_name in REMOVE_TOOLS:
    filepath = os.path.join(tools_dir, tool_name, "index.html")
    if not os.path.exists(filepath):
        continue
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        if "wise-cta" not in content:
            continue  # nothing to do

        original = content

        # Remove CTA block (div wrapper)
        content = CTA_PATTERN.sub('\n', content)
        # Remove CTA block (section wrapper)
        content = CTA_PATTERN2.sub('\n', content)
        # Remove any remaining bare wise-cta tags
        content = CTA_PATTERN3.sub('\n', content)
        # Remove script tag
        content = content.replace('\n' + SCRIPT_TAG, '')
        content = content.replace(SCRIPT_TAG + '\n', '')
        content = content.replace(SCRIPT_TAG, '')

        if content != original:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(content)
            removed.append(tool_name)
            print(f"  [removed] {tool_name}")
        else:
            print(f"  [no-match] {tool_name} — wise-cta present but pattern not matched")

    except Exception as e:
        errors.append((tool_name, str(e)))
        print(f"  [error] {tool_name}: {e}")

print(f"\nDone. Removed from {len(removed)} tools.")
if errors:
    print(f"Errors: {errors}")
