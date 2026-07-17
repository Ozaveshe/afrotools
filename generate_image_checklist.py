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

# 125 critical images — ordered by priority / category
IMAGES = [
    # ── CATEGORY 1: New Featured Agriculture Tools (8) ──────────────────────
    ("New Featured Agriculture Tools", None, None),
    (1,  "cocoa-tracker",              "Cocoa Price Tracker"),
    (2,  "coffee-calculator",          "Coffee Revenue Calculator"),
    (3,  "commodity-prices",           "Commodity Prices Dashboard"),
    (4,  "cooperative-calculator",     "Cooperative Savings Calculator"),
    (5,  "storage-loss",               "Storage Loss Calculator"),
    (6,  "tractor-calculator",         "Tractor Cost Calculator"),
    (7,  "vaccination-schedule",       "Livestock Vaccination Schedule"),
    (8,  "crop-rotation-planner",      "Crop Rotation Planner"),

    # ── CATEGORY 2: Agriculture Core / Landing Tools (8) ────────────────────
    ("Agriculture Core & Category Tools", None, None),
    (9,  "farm-profit",                "Farm Profit / Loss Calculator"),
    (10, "farm-size-converter",        "Farm Size Converter"),
    (11, "fish-farming",               "Fish Farming ROI Calculator"),
    (12, "greenhouse",                 "Greenhouse Profitability Tool"),
    (13, "poultry-roi",                "Poultry ROI Calculator"),
    (14, "agric-profit",               "Agric Profit Tool"),
    (15, "seed-rate-calculator",       "Seed Rate Calculator (Generic)"),
    (16, "fertilizer-calculator",      "Fertilizer Calculator (Generic)"),

    # ── CATEGORY 3: Top 25 Irrigation Country Pages ─────────────────────────
    ("Irrigation Calculators — Top 25 Countries", None, None),
    (17, "irrigation-nigeria",         "Nigeria Irrigation Calculator"),
    (18, "irrigation-ethiopia",        "Ethiopia Irrigation Calculator"),
    (19, "irrigation-egypt",           "Egypt Irrigation Calculator"),
    (20, "irrigation-dr-congo",        "DR Congo Irrigation Calculator"),
    (21, "irrigation-tanzania",        "Tanzania Irrigation Calculator"),
    (22, "irrigation-kenya",           "Kenya Irrigation Calculator"),
    (23, "irrigation-south-africa",    "South Africa Irrigation Calculator"),
    (24, "irrigation-uganda",          "Uganda Irrigation Calculator"),
    (25, "irrigation-sudan",           "Sudan Irrigation Calculator"),
    (26, "irrigation-algeria",         "Algeria Irrigation Calculator"),
    (27, "irrigation-morocco",         "Morocco Irrigation Calculator"),
    (28, "irrigation-ghana",           "Ghana Irrigation Calculator"),
    (29, "irrigation-mozambique",      "Mozambique Irrigation Calculator"),
    (30, "irrigation-angola",          "Angola Irrigation Calculator"),
    (31, "irrigation-cameroon",        "Cameroon Irrigation Calculator"),
    (32, "irrigation-niger",           "Niger Irrigation Calculator"),
    (33, "irrigation-mali",            "Mali Irrigation Calculator"),
    (34, "irrigation-senegal",         "Senegal Irrigation Calculator"),
    (35, "irrigation-zambia",          "Zambia Irrigation Calculator"),
    (36, "irrigation-zimbabwe",        "Zimbabwe Irrigation Calculator"),
    (37, "irrigation-guinea",          "Guinea Irrigation Calculator"),
    (38, "irrigation-rwanda",          "Rwanda Irrigation Calculator"),
    (39, "irrigation-benin",           "Benin Irrigation Calculator"),
    (40, "irrigation-somalia",         "Somalia Irrigation Calculator"),
    (41, "irrigation-chad",            "Chad Irrigation Calculator"),

    # ── CATEGORY 4: Seed Rate — Top 20 Countries ────────────────────────────
    ("Seed Rate Calculators — Top 20 Countries", None, None),
    (42, "seed-rate-nigeria",          "Nigeria Seed Rate Calculator"),
    (43, "seed-rate-ethiopia",         "Ethiopia Seed Rate Calculator"),
    (44, "seed-rate-kenya",            "Kenya Seed Rate Calculator"),
    (45, "seed-rate-ghana",            "Ghana Seed Rate Calculator"),
    (46, "seed-rate-egypt",            "Egypt Seed Rate Calculator"),
    (47, "seed-rate-tanzania",         "Tanzania Seed Rate Calculator"),
    (48, "seed-rate-south-africa",     "South Africa Seed Rate Calculator"),
    (49, "seed-rate-uganda",           "Uganda Seed Rate Calculator"),
    (50, "seed-rate-morocco",          "Morocco Seed Rate Calculator"),
    (51, "seed-rate-senegal",          "Senegal Seed Rate Calculator"),
    (52, "seed-rate-cameroon",         "Cameroon Seed Rate Calculator"),
    (53, "seed-rate-dr-congo",         "DR Congo Seed Rate Calculator"),
    (54, "seed-rate-angola",           "Angola Seed Rate Calculator"),
    (55, "seed-rate-zambia",           "Zambia Seed Rate Calculator"),
    (56, "seed-rate-mali",             "Mali Seed Rate Calculator"),
    (57, "seed-rate-mozambique",       "Mozambique Seed Rate Calculator"),
    (58, "seed-rate-zimbabwe",         "Zimbabwe Seed Rate Calculator"),
    (59, "seed-rate-cote-d-ivoire",    "Cote d'Ivoire Seed Rate Calculator"),
    (60, "seed-rate-niger",            "Niger Seed Rate Calculator"),
    (61, "seed-rate-algeria",          "Algeria Seed Rate Calculator"),

    # ── CATEGORY 5: Fertilizer — Top 20 Countries ───────────────────────────
    ("Fertilizer Calculators — Top 20 Countries", None, None),
    (62, "fertilizer-nigeria",         "Nigeria Fertilizer Calculator"),
    (63, "fertilizer-ethiopia",        "Ethiopia Fertilizer Calculator"),
    (64, "fertilizer-kenya",           "Kenya Fertilizer Calculator"),
    (65, "fertilizer-ghana",           "Ghana Fertilizer Calculator"),
    (66, "fertilizer-egypt",           "Egypt Fertilizer Calculator"),
    (67, "fertilizer-tanzania",        "Tanzania Fertilizer Calculator"),
    (68, "fertilizer-south-africa",    "South Africa Fertilizer Calculator"),
    (69, "fertilizer-uganda",          "Uganda Fertilizer Calculator"),
    (70, "fertilizer-morocco",         "Morocco Fertilizer Calculator"),
    (71, "fertilizer-senegal",         "Senegal Fertilizer Calculator"),
    (72, "fertilizer-cameroon",        "Cameroon Fertilizer Calculator"),
    (73, "fertilizer-dr-congo",        "DR Congo Fertilizer Calculator"),
    (74, "fertilizer-angola",          "Angola Fertilizer Calculator"),
    (75, "fertilizer-zambia",          "Zambia Fertilizer Calculator"),
    (76, "fertilizer-mali",            "Mali Fertilizer Calculator"),
    (77, "fertilizer-mozambique",      "Mozambique Fertilizer Calculator"),
    (78, "fertilizer-zimbabwe",        "Zimbabwe Fertilizer Calculator"),
    (79, "fertilizer-cote-d-ivoire",   "Cote d'Ivoire Fertilizer Calculator"),
    (80, "fertilizer-niger",           "Niger Fertilizer Calculator"),
    (81, "fertilizer-rwanda",          "Rwanda Fertilizer Calculator"),

    # ── CATEGORY 6: Crop Yield — Generic + Top 15 ───────────────────────────
    ("Crop Yield Estimators — Generic + Top 15", None, None),
    (82, "crop-yield-estimator",       "Crop Yield Estimator (Generic)"),
    (83, "irrigation-calculator",      "Irrigation Calculator (Generic)"),
    (84, "crop-yield-nigeria",         "Nigeria Crop Yield Estimator"),
    (85, "crop-yield-ethiopia",        "Ethiopia Crop Yield Estimator"),
    (86, "crop-yield-kenya",           "Kenya Crop Yield Estimator"),
    (87, "crop-yield-ghana",           "Ghana Crop Yield Estimator"),
    (88, "crop-yield-egypt",           "Egypt Crop Yield Estimator"),
    (89, "crop-yield-tanzania",        "Tanzania Crop Yield Estimator"),
    (90, "crop-yield-south-africa",    "South Africa Crop Yield Estimator"),
    (91, "crop-yield-uganda",          "Uganda Crop Yield Estimator"),
    (92, "crop-yield-morocco",         "Morocco Crop Yield Estimator"),
    (93, "crop-yield-senegal",         "Senegal Crop Yield Estimator"),
    (94, "crop-yield-cameroon",        "Cameroon Crop Yield Estimator"),
    (95, "crop-yield-dr-congo",        "DR Congo Crop Yield Estimator"),
    (96, "crop-yield-angola",          "Angola Crop Yield Estimator"),
    (97, "crop-yield-zambia",          "Zambia Crop Yield Estimator"),

    # ── CATEGORY 7: Cassava Processing — 15 Countries ───────────────────────
    ("Cassava Processing — 15 Countries", None, None),
    (98,  "cassava-processing",             "Cassava Processing (Generic)"),
    (99,  "cassava-processing-nigeria",     "Nigeria Cassava Processing"),
    (100, "cassava-processing-ghana",       "Ghana Cassava Processing"),
    (101, "cassava-processing-dr-congo",    "DR Congo Cassava Processing"),
    (102, "cassava-processing-cameroon",    "Cameroon Cassava Processing"),
    (103, "cassava-processing-angola",      "Angola Cassava Processing"),
    (104, "cassava-processing-tanzania",    "Tanzania Cassava Processing"),
    (105, "cassava-processing-uganda",      "Uganda Cassava Processing"),
    (106, "cassava-processing-mozambique",  "Mozambique Cassava Processing"),
    (107, "cassava-processing-cote-d-ivoire","Cote d'Ivoire Cassava Processing"),
    (108, "cassava-processing-malawi",      "Malawi Cassava Processing"),
    (109, "cassava-processing-benin",       "Benin Cassava Processing"),
    (110, "cassava-processing-madagascar",  "Madagascar Cassava Processing"),
    (111, "cassava-processing-guinea",      "Guinea Cassava Processing"),
    (112, "cassava-processing-sierra-leone","Sierra Leone Cassava Processing"),
    (113, "cassava-processing-togo",        "Togo Cassava Processing"),

    # ── CATEGORY 8: Core Missing Tools ──────────────────────────────────────
    ("Core Tools Missing Images", None, None),
    (114, "afroatlas",                 "AfroAtlas Country Comparison"),
    (115, "soil-ph-calculator",        "Soil pH Calculator"),
    (116, "farm-payroll",              "Farm Payroll Manager"),
    (117, "export-docs",               "Export Documentation Helper"),

    # ── CATEGORY 9: French Localization PAYE/TVA (12) ───────────────────────
    ("French PAYE & TVA Tools", None, None),
    (118, "bf-paye-fr",               "Burkina Faso Salaire Net (FR)"),
    (119, "bf-tva-fr",                "Burkina Faso TVA (FR)"),
    (120, "cd-paye-fr",               "RD Congo Salaire Net (FR)"),
    (121, "cg-paye-fr",               "Congo Salaire Net (FR)"),
    (122, "ci-paye-fr",               "Cote d'Ivoire Salaire Net (FR)"),
    (123, "cm-paye-fr",               "Cameroun Salaire Net (FR)"),
    (124, "sn-paye-fr",               "Senegal Salaire Net (FR)"),
    (125, "tg-paye-fr",               "Togo Salaire Net (FR)"),
]

# ─── Build PDF ───────────────────────────────────────────────────────────────

OUTPUT = "AfroTools_Image_Checklist_Day1.pdf"

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
    Paragraph("Day 1  —  125 Critical Images  —  2026-03-26", style_subtitle),
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

# Apply alternating row colors and category header styles
for i, row in enumerate(table_data):
    if i == 0:
        continue  # already styled header
    if i in cat_rows:
        row_styles += [
            ('BACKGROUND',   (0, i), (-1, i), BLUE_PALE),
            ('SPAN',         (0, i), (-1, i)),
            ('TOPPADDING',   (0, i), (-1, i), 4),
            ('BOTTOMPADDING',(0, i), (-1, i), 4),
        ]
    else:
        # alternate shading
        pass  # handled via cell background below

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
    "AfroTools — Image Checklist Day 1 of ongoing daily batch  |  "
    "Total missing across all tools: ~412  |  "
    "Tomorrow: remaining irrigation, seed-rate & crop-yield country variants",
    footer_style,
))

doc.build(story)
print(f"PDF created: {OUTPUT}")
print(f"Items: {item_count}")
