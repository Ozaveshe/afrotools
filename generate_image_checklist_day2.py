from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER

# Brand colors
BLUE_PRIMARY = colors.HexColor('#007AFF')
BLUE_DARK = colors.HexColor('#0063D1')
BLUE_PALE = colors.HexColor('#E8F2FF')
BG_DARK = colors.HexColor('#0A1628')
TEXT_DARK = colors.HexColor('#0f172a')
GREY_LIGHT = colors.HexColor('#F1F5F9')
GREY_MID = colors.HexColor('#CBD5E1')
WHITE = colors.white

# 125 critical images — Day 2 — ordered by priority / category
# ZERO overlap with Day 1 (agriculture / irrigation / seed-rate / fertilizer / cassava)
IMAGES = [
    # ── CATEGORY 1: Platform Core (4) ──────────────────────────────────────────
    ("Platform Core — Flagship Tools", None, None),
    (1,   "afrokitchen",              "AfroKitchen — African Recipe Hub"),
    (2,   "afrostream",               "AfroStream — Streaming Discovery"),
    (3,   "afroprices",               "AfroPrices — Price Comparison"),
    (4,   "afropoints",               "AfroPoints — Rewards & Gamification"),

    # ── CATEGORY 2: Creator Suite — Top 20 (20) ───────────────────────────────
    ("Creator Suite — Content Creator Tools", None, None),
    (5,   "creator-analytics",        "Creator Analytics Dashboard"),
    (6,   "creator-invoice",          "Creator Invoice Generator"),
    (7,   "creator-money",            "Creator Monetization Calculator"),
    (8,   "creator-calendar",         "Creator Content Calendar"),
    (9,   "creator-hashtags",         "Creator Hashtag Generator"),
    (10,  "creator-captions",         "Creator Caption Writer"),
    (11,  "creator-carousel",         "Creator Carousel Maker"),
    (12,  "creator-thumb",            "Creator Thumbnail Designer"),
    (13,  "creator-pricing",          "Creator Pricing Calculator"),
    (14,  "creator-brand",            "Creator Brand Kit Builder"),
    (15,  "creator-kit",              "Creator Media Kit"),
    (16,  "creator-bios",             "Creator Bio Generator"),
    (17,  "creator-hooks",            "Creator Hook Writer"),
    (18,  "creator-scripts",          "Creator Script Templates"),
    (19,  "creator-titles",           "Creator Title Generator"),
    (20,  "creator-resize",           "Creator Image Resizer"),
    (21,  "creator-schedule",         "Creator Posting Schedule"),
    (22,  "creator-research",         "Creator Topic Research"),
    (23,  "creator-course",           "Creator Course Builder"),
    (24,  "creator-repurpose",        "Creator Content Repurposer"),

    # ── CATEGORY 3: Finance & Money (15) ───────────────────────────────────────
    ("Finance & Money Tools", None, None),
    (25,  "compound-interest",        "Compound Interest Calculator"),
    (26,  "fixed-deposit",            "Fixed Deposit Calculator"),
    (27,  "net-worth",                "Net Worth Calculator"),
    (28,  "debt-snowball",            "Debt Snowball Planner"),
    (29,  "emergency-fund",           "Emergency Fund Calculator"),
    (30,  "savings-goal-tracker",     "Savings Goal Tracker"),
    (31,  "money-market",             "Money Market Rate Comparator"),
    (32,  "dividend-yield",           "Dividend Yield Calculator"),
    (33,  "bond-yield",               "Bond Yield Calculator"),
    (34,  "tbill-calc",               "Treasury Bill Calculator"),
    (35,  "stock-portfolio",          "Stock Portfolio Tracker"),
    (36,  "dca-calc",                 "Dollar-Cost Averaging Calculator"),
    (37,  "real-return",              "Real Return (Inflation-Adjusted)"),
    (38,  "fire-calc",                "FIRE Calculator (Early Retirement)"),
    (39,  "multi-income-tracker",     "Multi-Income Stream Tracker"),

    # ── CATEGORY 4: Business & Startup (12) ────────────────────────────────────
    ("Business & Startup Tools", None, None),
    (40,  "startup-runway",           "Startup Runway Calculator"),
    (41,  "burn-rate",                "Burn Rate Calculator"),
    (42,  "unit-economics",           "Unit Economics Calculator"),
    (43,  "churn-rate",               "Churn Rate Calculator"),
    (44,  "tam-sam-som",              "TAM SAM SOM Market Sizing"),
    (45,  "cash-flow-forecast",       "Cash Flow Forecast Tool"),
    (46,  "business-registration",    "Business Registration Guide"),
    (47,  "business-planner",         "Business Plan Generator"),
    (48,  "company-type-selector",    "Company Type Selector"),
    (49,  "business-license",         "Business License Checker"),
    (50,  "business-insurance",       "Business Insurance Calculator"),
    (51,  "business-continuity",      "Business Continuity Planner"),

    # ── CATEGORY 5: PDF & Document Tools (10) ──────────────────────────────────
    ("PDF & Document Workspace", None, None),
    (52,  "pdf-chat",                 "PDF Chat — AI Document Q&A"),
    (53,  "pdf-compare",              "PDF Compare — Diff Two PDFs"),
    (54,  "pdf-convert",              "PDF Convert — Format Converter"),
    (55,  "pdf-translate",            "PDF Translate — Multi-Language"),
    (56,  "pdf-to-audio",             "PDF to Audio — Listen to Docs"),
    (57,  "pdf-find-replace",         "PDF Find & Replace"),
    (58,  "pdf-reorder",              "PDF Page Reorder"),
    (59,  "pdf-repair",               "PDF Repair Tool"),
    (60,  "pdf-bates",                "PDF Bates Numbering"),
    (61,  "pdf-workflow",             "PDF Workflow Automation"),

    # ── CATEGORY 6: Health & Wellness (10) ─────────────────────────────────────
    ("Health & Wellness", None, None),
    (62,  "genotype-checker",         "Genotype Compatibility Checker"),
    (63,  "blood-group",              "Blood Group Compatibility"),
    (64,  "pregnancy-nutrition",      "Pregnancy Nutrition Guide"),
    (65,  "child-growth",             "Child Growth Tracker"),
    (66,  "breastfeeding-tracker",    "Breastfeeding Tracker"),
    (67,  "maternal-mortality",       "Maternal Mortality Risk Tool"),
    (68,  "hiv-treatment-cost",       "HIV Treatment Cost Calculator"),
    (69,  "mental-health-cost",       "Mental Health Cost Estimator"),
    (70,  "drug-price-compare",       "Drug Price Comparator"),
    (71,  "health-insurance-compare", "Health Insurance Comparator"),

    # ── CATEGORY 7: Property & Real Estate (8) ─────────────────────────────────
    ("Property & Real Estate", None, None),
    (72,  "rent-vs-buy",              "Rent vs Buy Calculator"),
    (73,  "property-roi",             "Property ROI Calculator"),
    (74,  "mortgage-affordability",   "Mortgage Affordability Tool"),
    (75,  "home-loan-eligibility",    "Home Loan Eligibility Checker"),
    (76,  "property-valuation",       "Property Valuation Estimator"),
    (77,  "home-renovation-cost",     "Home Renovation Cost Calculator"),
    (78,  "rent-affordability",       "Rent Affordability Calculator"),
    (79,  "short-let-calc",           "Short-Let / Airbnb Calculator"),

    # ── CATEGORY 8: Legal & Contracts (8) ──────────────────────────────────────
    ("Legal & Contracts", None, None),
    (80,  "contract-generator",       "Contract Generator"),
    (81,  "nda-generator",            "NDA Generator"),
    (82,  "will-generator",           "Will Generator"),
    (83,  "privacy-policy-gen",       "Privacy Policy Generator"),
    (84,  "partnership-agreement",    "Partnership Agreement Builder"),
    (85,  "shareholder-agreement",    "Shareholder Agreement Builder"),
    (86,  "power-of-attorney",        "Power of Attorney Generator"),
    (87,  "freelance-contract",       "Freelance Contract Generator"),

    # ── CATEGORY 9: Tax & Payroll (8) ──────────────────────────────────────────
    ("Tax & Payroll", None, None),
    (88,  "paye-calculator",          "PAYE Tax Calculator"),
    (89,  "freelancer-tax",           "Freelancer Tax Calculator"),
    (90,  "wht-calculator",           "Withholding Tax Calculator"),
    (91,  "capital-allowances",       "Capital Allowances Calculator"),
    (92,  "inheritance-tax",          "Inheritance Tax Calculator"),
    (93,  "turnover-tax",             "Turnover Tax Calculator"),
    (94,  "overtime-calc",            "Overtime Pay Calculator"),
    (95,  "leave-calculator",         "Leave Days Calculator"),

    # ── CATEGORY 10: Trade & Import-Export (8) ─────────────────────────────────
    ("Trade & Import-Export", None, None),
    (96,  "hs-code-lookup",           "HS Code Lookup Tool"),
    (97,  "landed-cost",              "Landed Cost Calculator"),
    (98,  "incoterms-calculator",     "Incoterms Calculator"),
    (99,  "mini-importation",         "Mini Importation Calculator"),
    (100, "vehicle-import-duty",      "Vehicle Import Duty Calculator"),
    (101, "customs-time",             "Customs Clearance Time Estimator"),
    (102, "demurrage-calculator",     "Demurrage Cost Calculator"),
    (103, "shipping-estimator",       "Shipping Cost Estimator"),

    # ── CATEGORY 11: Education & Career (8) ────────────────────────────────────
    ("Education & Career", None, None),
    (104, "university-admission",     "University Admission Checker"),
    (105, "scholarship-check",        "Scholarship Eligibility Checker"),
    (106, "study-abroad-cost",        "Study Abroad Cost Calculator"),
    (107, "student-budget",           "Student Budget Planner"),
    (108, "interview-prep",           "Interview Prep Tool"),
    (109, "salary-negotiation",       "Salary Negotiation Helper"),
    (110, "linkedin-optimizer",       "LinkedIn Profile Optimizer"),
    (111, "career-switch",            "Career Switch Calculator"),

    # ── CATEGORY 12: Insurance (5) ─────────────────────────────────────────────
    ("Insurance", None, None),
    (112, "car-insurance",            "Car Insurance Calculator"),
    (113, "life-insurance-calc",      "Life Insurance Calculator"),
    (114, "fire-insurance",           "Fire Insurance Calculator"),
    (115, "motor-third-party",        "Motor Third-Party Calculator"),
    (116, "travel-insurance",         "Travel Insurance Comparator"),

    # ── CATEGORY 13: Energy & Utilities (5) ────────────────────────────────────
    ("Energy & Utilities", None, None),
    (117, "solar-roi",                "Solar ROI Calculator"),
    (118, "solar-sizing",             "Solar Panel Sizing Tool"),
    (119, "electricity-tariff",       "Electricity Tariff Calculator"),
    (120, "prepaid-meter",            "Prepaid Meter Calculator"),
    (121, "solar-vs-generator",       "Solar vs Generator Comparator"),

    # ── CATEGORY 14: Developer Tools (4) ───────────────────────────────────────
    ("Developer Tools", None, None),
    (122, "json-formatter",           "JSON Formatter & Validator"),
    (123, "docker-compose-gen",       "Docker Compose Generator"),
    (124, "commit-message-gen",       "Commit Message Generator"),
    (125, "pwa-manifest",             "PWA Manifest Generator"),
]

# ─── Build PDF ───────────────────────────────────────────────────────────────

OUTPUT = "AfroTools_Image_Checklist_Day2.pdf"

doc = SimpleDocTemplate(
    OUTPUT,
    pagesize=A4,
    rightMargin=15*mm,
    leftMargin=15*mm,
    topMargin=18*mm,
    bottomMargin=15*mm,
)

styles = getSampleStyleSheet()

style_title = ParagraphStyle(
    "Title", fontName="Helvetica-Bold", fontSize=20,
    textColor=WHITE, alignment=TA_LEFT, spaceAfter=2*mm,
)
style_subtitle = ParagraphStyle(
    "Subtitle", fontName="Helvetica", fontSize=10,
    textColor=colors.HexColor('#93C5FD'), alignment=TA_LEFT, spaceAfter=0,
)
style_cat = ParagraphStyle(
    "Cat", fontName="Helvetica-Bold", fontSize=9,
    textColor=BLUE_DARK, alignment=TA_LEFT,
    spaceBefore=4*mm, spaceAfter=1*mm,
)
style_num = ParagraphStyle(
    "Num", fontName="Helvetica-Bold", fontSize=8.5,
    textColor=BLUE_PRIMARY, alignment=TA_CENTER,
)
style_fname = ParagraphStyle(
    "FName", fontName="Courier-Bold", fontSize=7.5,
    textColor=TEXT_DARK, alignment=TA_LEFT,
)
style_ext = ParagraphStyle(
    "Ext", fontName="Courier", fontSize=7,
    textColor=colors.HexColor('#64748B'), alignment=TA_LEFT,
)
style_app = ParagraphStyle(
    "App", fontName="Helvetica", fontSize=8,
    textColor=colors.HexColor('#334155'), alignment=TA_LEFT,
)

story = []

# ── Header banner ────────────────────────────────────────────────────────────
header_data = [[
    Paragraph("AfroTools  |  Image Creation Checklist", style_title),
    Paragraph("Day 2  —  125 Critical Images  —  2026-04-02", style_subtitle),
]]
header_table = Table(header_data, colWidths=[180*mm])
header_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), BG_DARK),
    ('TOPPADDING',    (0, 0), (-1, -1), 8),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ('LEFTPADDING',   (0, 0), (-1, -1), 8),
    ('RIGHTPADDING',  (0, 0), (-1, -1), 8),
    ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
]))
story.append(header_table)
story.append(Spacer(1, 4*mm))

# ── Instructions ─────────────────────────────────────────────────────────────
instr_style = ParagraphStyle(
    "Instr", fontName="Helvetica", fontSize=7.5,
    textColor=colors.HexColor('#475569'), leading=11,
)
story.append(Paragraph(
    "Save images as  <b>.webp</b>  (primary) + <b>.svg</b>  (optional fallback) "
    "into  <b>assets/img/tools/</b>.  "
    "Recommended size: <b>400 x 300 px</b> @ 72 dpi.  "
    "Tick each box when done.",
    instr_style,
))
story.append(Spacer(1, 3*mm))

# ── Column header row ─────────────────────────────────────────────────────────
col_hdr_style = ParagraphStyle(
    "ColHdr", fontName="Helvetica-Bold", fontSize=7.5,
    textColor=WHITE, alignment=TA_LEFT,
)
col_row = [
    Paragraph("", col_hdr_style),          # checkbox col
    Paragraph("#", col_hdr_style),
    Paragraph("Filename  (save as *.webp)", col_hdr_style),
    Paragraph("Tool / App Name", col_hdr_style),
]

table_data = [col_row]
row_styles = [
    ('BACKGROUND', (0, 0), (-1, 0), BLUE_DARK),
    ('TEXTCOLOR',  (0, 0), (-1, 0), WHITE),
    ('TOPPADDING',    (0, 0), (-1, 0), 5),
    ('BOTTOMPADDING', (0, 0), (-1, 0), 5),
    ('LEFTPADDING',   (0, 0), (-1, -1), 5),
    ('RIGHTPADDING',  (0, 0), (-1, -1), 5),
    ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
    ('FONTNAME',      (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE',      (0, 0), (-1, 0), 7.5),
    ('GRID',          (0, 0), (-1, -1), 0.3, GREY_MID),
]

cat_rows = []   # track which rows are category headers
item_count = 0

for entry in IMAGES:
    if len(entry) == 3 and entry[1] is None:
        # Category header row
        cat_rows.append(len(table_data))
        table_data.append([
            Paragraph(entry[0], ParagraphStyle(
                "CH", fontName="Helvetica-Bold", fontSize=7.5,
                textColor=BLUE_DARK,
            )),
            "", "", ""
        ])
    else:
        num, fname, appname = entry
        item_count += 1
        bg = WHITE if (item_count % 2 == 0) else GREY_LIGHT
        table_data.append([
            Paragraph("[ ]", ParagraphStyle(
                "CB", fontName="Helvetica", fontSize=10,
                textColor=colors.HexColor('#94A3B8'), alignment=TA_CENTER,
            )),
            Paragraph(str(num), style_num),
            Paragraph(fname + ".webp", style_fname),
            Paragraph(appname, style_app),
        ])

# Apply category header styles
for i, row in enumerate(table_data):
    if i == 0:
        continue
    if i in cat_rows:
        row_styles += [
            ('BACKGROUND',   (0, i), (-1, i), BLUE_PALE),
            ('SPAN',         (0, i), (-1, i)),
            ('TOPPADDING',   (0, i), (-1, i), 4),
            ('BOTTOMPADDING',(0, i), (-1, i), 4),
        ]

tbl = Table(
    table_data,
    colWidths=[10*mm, 10*mm, 80*mm, 80*mm],
    repeatRows=1,
)
tbl.setStyle(TableStyle(row_styles))

# Per-row alternating background (skip header + cat rows)
alt = True
for i in range(1, len(table_data)):
    if i in cat_rows:
        alt = True
        continue
    bg = GREY_LIGHT if alt else WHITE
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, i), (-1, i), bg),
    ]))
    alt = not alt

story.append(tbl)
story.append(Spacer(1, 4*mm))

# ── Footer note ──────────────────────────────────────────────────────────────
footer_style = ParagraphStyle(
    "Footer", fontName="Helvetica-Oblique", fontSize=7,
    textColor=colors.HexColor('#94A3B8'), alignment=TA_CENTER,
)
story.append(HRFlowable(width="100%", thickness=0.5, color=GREY_MID))
story.append(Spacer(1, 2*mm))
story.append(Paragraph(
    "AfroTools — Image Checklist Day 2  |  "
    "Day 1 (125 agric images) DONE  |  "
    "Remaining after Day 2: ~219 tools still need images  |  "
    "Total tools: 697  |  With images: ~353/697",
    footer_style,
))

doc.build(story)
print(f"PDF created: {OUTPUT}")
print(f"Items: {item_count}")
