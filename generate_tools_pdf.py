"""
AfroTools: 1000+ New Tools Roadmap - PDF Generator
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.units import inch, mm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas
from datetime import datetime

# ── Colors ──
PRIMARY = HexColor("#007AFF")
DARK = HexColor("#0a1929")
ACCENT = HexColor("#00C853")
WARN = HexColor("#FF6D00")
LIGHT_BG = HexColor("#F0F4FA")
LIGHT_BORDER = HexColor("#D0D8E8")
WHITE = white
BLACK = black
CATEGORY_COLORS = {
    "A": HexColor("#2E7D32"), "B": HexColor("#1565C0"), "C": HexColor("#6A1B9A"),
    "D": HexColor("#C62828"), "E": HexColor("#00838F"), "F": HexColor("#EF6C00"),
    "G": HexColor("#2E7D32"), "H": HexColor("#4527A0"), "I": HexColor("#AD1457"),
    "J": HexColor("#00695C"), "K": HexColor("#D84315"), "L": HexColor("#1B5E20"),
    "M": HexColor("#283593"), "N": HexColor("#B71C1C"), "O": HexColor("#1B5E20"),
    "P": HexColor("#4A148C"), "Q": HexColor("#0D47A1"), "R": HexColor("#BF360C"),
    "S": HexColor("#00695C"), "T": HexColor("#E65100"), "U": HexColor("#33691E"),
    "V": HexColor("#4E342E"), "W": HexColor("#37474F"), "X": HexColor("#880E4F"),
    "Y": HexColor("#263238"), "Z": HexColor("#1A237E"), "MEGA": HexColor("#FF6F00"),
}


def build_pdf():
    filename = "AfroTools_1000_Tools_Roadmap.pdf"
    doc = SimpleDocTemplate(
        filename, pagesize=A4,
        topMargin=0.6*inch, bottomMargin=0.6*inch,
        leftMargin=0.6*inch, rightMargin=0.6*inch
    )

    styles = getSampleStyleSheet()

    # Custom styles
    styles.add(ParagraphStyle(
        'CoverTitle', parent=styles['Title'],
        fontSize=32, leading=38, textColor=DARK,
        spaceAfter=6, alignment=TA_CENTER, fontName='Helvetica-Bold'
    ))
    styles.add(ParagraphStyle(
        'CoverSub', parent=styles['Normal'],
        fontSize=14, leading=18, textColor=PRIMARY,
        spaceAfter=20, alignment=TA_CENTER
    ))
    styles.add(ParagraphStyle(
        'CatHeader', parent=styles['Heading1'],
        fontSize=16, leading=20, textColor=DARK,
        spaceBefore=18, spaceAfter=8, fontName='Helvetica-Bold'
    ))
    styles.add(ParagraphStyle(
        'SubHeader', parent=styles['Heading2'],
        fontSize=12, leading=15, textColor=PRIMARY,
        spaceBefore=10, spaceAfter=4, fontName='Helvetica-Bold'
    ))
    styles.add(ParagraphStyle(
        'ToolItem', parent=styles['Normal'],
        fontSize=8.5, leading=11, textColor=DARK,
    ))
    styles.add(ParagraphStyle(
        'ToolItemBold', parent=styles['Normal'],
        fontSize=8.5, leading=11, textColor=DARK, fontName='Helvetica-Bold'
    ))
    styles.add(ParagraphStyle(
        'SmallNote', parent=styles['Normal'],
        fontSize=7.5, leading=10, textColor=HexColor("#666666"),
    ))
    styles.add(ParagraphStyle(
        'TableHeader', parent=styles['Normal'],
        fontSize=8, leading=10, textColor=WHITE, fontName='Helvetica-Bold',
    ))
    styles.add(ParagraphStyle(
        'TableCell', parent=styles['Normal'],
        fontSize=8, leading=10, textColor=DARK,
    ))
    styles.add(ParagraphStyle(
        'TableCellBold', parent=styles['Normal'],
        fontSize=8, leading=10, textColor=DARK, fontName='Helvetica-Bold',
    ))
    styles.add(ParagraphStyle(
        'AdvisoryTitle', parent=styles['Heading2'],
        fontSize=13, leading=16, textColor=DARK,
        spaceBefore=14, spaceAfter=6, fontName='Helvetica-Bold'
    ))
    styles.add(ParagraphStyle(
        'LegendText', parent=styles['Normal'],
        fontSize=9, leading=12, textColor=DARK,
    ))

    story = []
    W = A4[0] - 1.2*inch  # available width

    # ── Helper: make a tool table ──
    def make_tool_table(tools, cat_letter, header_color=None):
        if not header_color:
            header_color = CATEGORY_COLORS.get(cat_letter, PRIMARY)

        col_widths = [0.06*W, 0.48*W, 0.12*W, 0.34*W]
        header = [
            Paragraph("#", styles['TableHeader']),
            Paragraph("Tool", styles['TableHeader']),
            Paragraph("Scale", styles['TableHeader']),
            Paragraph("Notes / Inspiration", styles['TableHeader']),
        ]
        data = [header]
        for t in tools:
            row = [
                Paragraph(str(t[0]), styles['TableCell']),
                Paragraph(t[1], styles['TableCellBold']),
                Paragraph(t[2], styles['TableCell']),
                Paragraph(t[3], styles['TableCell']),
            ]
            data.append(row)

        tbl = Table(data, colWidths=col_widths, repeatRows=1)
        tbl_style = [
            ('BACKGROUND', (0, 0), (-1, 0), header_color),
            ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('GRID', (0, 0), (-1, -1), 0.4, LIGHT_BORDER),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ]
        for i in range(1, len(data)):
            if i % 2 == 0:
                tbl_style.append(('BACKGROUND', (0, i), (-1, i), LIGHT_BG))
        tbl.setStyle(TableStyle(tbl_style))
        return tbl

    def make_simple_table(data_rows, col_widths, header_color=PRIMARY):
        tbl = Table(data_rows, colWidths=col_widths, repeatRows=1)
        tbl_style = [
            ('BACKGROUND', (0, 0), (-1, 0), header_color),
            ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('GRID', (0, 0), (-1, -1), 0.4, LIGHT_BORDER),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ]
        for i in range(1, len(data_rows)):
            if i % 2 == 0:
                tbl_style.append(('BACKGROUND', (0, i), (-1, i), LIGHT_BG))
        tbl.setStyle(TableStyle(tbl_style))
        return tbl

    def section_break():
        story.append(Spacer(1, 6))
        story.append(HRFlowable(width="100%", thickness=0.5, color=LIGHT_BORDER))
        story.append(Spacer(1, 6))

    # ══════════════════════════════════════════════════════
    # COVER PAGE
    # ══════════════════════════════════════════════════════
    story.append(Spacer(1, 2*inch))
    story.append(Paragraph("AFROTOOLS", styles['CoverTitle']))
    story.append(Paragraph("1,000+ New Tools Roadmap", styles['CoverSub']))
    story.append(Spacer(1, 0.3*inch))
    story.append(HRFlowable(width="40%", thickness=2, color=PRIMARY))
    story.append(Spacer(1, 0.3*inch))
    story.append(Paragraph("From 395 to 1,395+ tools across 54 African countries", styles['CoverSub']))
    story.append(Spacer(1, 0.5*inch))

    cover_stats = [
        [Paragraph("Metric", styles['TableHeader']), Paragraph("Value", styles['TableHeader'])],
        [Paragraph("Current Tools", styles['TableCellBold']), Paragraph("395 live tools", styles['TableCell'])],
        [Paragraph("New Tools Proposed", styles['TableCellBold']), Paragraph("1,000+ new tools", styles['TableCell'])],
        [Paragraph("Categories", styles['TableCellBold']), Paragraph("26 categories (13 existing + 13 new)", styles['TableCell'])],
        [Paragraph("x54 Templates", styles['TableCellBold']), Paragraph("19+ templates = 1,026+ country tools", styles['TableCell'])],
        [Paragraph("Total Addressable", styles['TableCellBold']), Paragraph("1,750+ tools", styles['TableCell'])],
    ]
    story.append(make_simple_table(cover_stats, [0.35*W, 0.65*W], DARK))
    story.append(Spacer(1, 0.5*inch))
    story.append(Paragraph(f"Generated: {datetime.now().strftime('%B %d, %Y')}", ParagraphStyle(
        'DateStyle', parent=styles['Normal'], fontSize=10, alignment=TA_CENTER, textColor=HexColor("#999999")
    )))
    story.append(PageBreak())

    # ══════════════════════════════════════════════════════
    # LEGEND PAGE
    # ══════════════════════════════════════════════════════
    story.append(Paragraph("How to Read This Document", styles['CatHeader']))
    story.append(Spacer(1, 6))
    legend_items = [
        "(x54) = Replicate for each of the 54 African countries = 54 tools from 1 template",
        "(x15) = Top 15 African economies only (NG, KE, ZA, GH, EG, ET, TZ, UG, RW, CI, CM, SN, MA, TN, AO)",
        "(x1) = Pan-African / single tool",
        "[DDPE] = Addresses Africa's Digital/Data/Privacy/Economy pain point",
        "[ASIA] = Inspired by Asian markets (India, Indonesia, China, Singapore)",
        "[US] = Inspired by US/Western markets",
    ]
    for item in legend_items:
        story.append(Paragraph(f"<bullet>&bull;</bullet> <b>{item.split('=')[0].strip()}</b> {('= ' + '= '.join(item.split('=')[1:])).strip() if '=' in item else ''}", styles['LegendText']))
        story.append(Spacer(1, 2))

    story.append(Spacer(1, 12))
    story.append(Paragraph("The Fastest Path to 1,000 Tools", styles['SubHeader']))
    story.append(Paragraph(
        "Build 19 country-replicated templates. Each template is one codebase, deployed 54 times "
        "with country-specific data. That is your moat - no one else has the data for all 54 countries.",
        styles['LegendText']
    ))
    story.append(PageBreak())

    # ══════════════════════════════════════════════════════
    # TABLE OF CONTENTS
    # ══════════════════════════════════════════════════════
    story.append(Paragraph("Table of Contents", styles['CatHeader']))
    story.append(Spacer(1, 8))
    toc_items = [
        ("A", "Agriculture & Agribusiness", "1-30", "~300+"),
        ("B", "Import/Export & Trade", "31-50", "~200+"),
        ("C", "Real Estate & Property", "51-70", "~150+"),
        ("D", "HR, Payroll & Workforce", "71-95", "~250+"),
        ("E", "Insurance", "96-110", "~150+"),
        ("F", "Telecommunications & Mobile", "111-125", "~150+"),
        ("G", "Energy & Utilities", "126-145", "~120+"),
        ("H", "Legal & Compliance", "146-178", "~250+"),
        ("I", "Fintech & Digital Banking", "179-210", "~100+"),
        ("J", "Education & EdTech", "211-235", "~100+"),
        ("K", "Transportation & Logistics", "236-255", "~100+"),
        ("L", "Government & Civic", "256-275", "~200+"),
        ("M", "Small Business & Entrepreneurship", "276-320", "~50+"),
        ("N", "Health & Wellness", "321-347", "~100+"),
        ("O", "Climate & Environment", "348-360", "~80+"),
        ("P", "Diaspora Tools", "361-377", "~100+"),
        ("Q", "Developer & Tech Tools", "378-400", "~25+"),
        ("R", "Religious & Cultural", "401-420", "~120+"),
        ("S", "Sports & Entertainment", "421-435", "~15+"),
        ("T", "Personal Finance Deep-Dive", "436-460", "~150+"),
        ("U", "Construction & Engineering", "461-480", "~25+"),
        ("V", "Mining & Extractives", "481-490", "~30+"),
        ("W", "Manufacturing & Production", "491-500", "~15+"),
        ("X", "Creative Economy", "501-520", "~20+"),
        ("Y", "Security & Safety", "521-532", "~15+"),
        ("Z", "Miscellaneous High-Value", "533-566", "~40+"),
        ("MEGA", "x54 Country Templates", "567-1000+", "1,000+"),
    ]
    toc_data = [
        [Paragraph("Cat", styles['TableHeader']),
         Paragraph("Category Name", styles['TableHeader']),
         Paragraph("Tool #s", styles['TableHeader']),
         Paragraph("Total (with x54)", styles['TableHeader'])],
    ]
    for cat, name, nums, total in toc_items:
        color = CATEGORY_COLORS.get(cat, PRIMARY)
        toc_data.append([
            Paragraph(f"<font color='#{color.hexval()[2:]}'><b>{cat}</b></font>", styles['TableCell']),
            Paragraph(name, styles['TableCellBold']),
            Paragraph(nums, styles['TableCell']),
            Paragraph(total, styles['TableCell']),
        ])
    story.append(make_simple_table(toc_data, [0.08*W, 0.52*W, 0.18*W, 0.22*W], DARK))
    story.append(PageBreak())

    # ══════════════════════════════════════════════════════
    # ALL TOOL CATEGORIES
    # ══════════════════════════════════════════════════════

    # ── CATEGORY A: AGRICULTURE ──
    story.append(Paragraph("CATEGORY A: AGRICULTURE & AGRIBUSINESS", styles['CatHeader']))
    story.append(Paragraph(
        "Africa's #1 employer, barely represented in the current stack. Asia's biggest digital wins "
        "(India's AgriStack, Indonesia's TaniHub) started here. 60% of Africa's workforce is in agriculture.",
        styles['SmallNote']
    ))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Crop & Farm Calculators", styles['SubHeader']))
    tools_a1 = [
        (1, "Crop Yield Estimator", "x54", "[ASIA] India Kisan app"),
        (2, "Fertilizer Calculator (NPK ratios)", "x54", "[US] Granular"),
        (3, "Irrigation Water Calculator", "x54", ""),
        (4, "Seed Rate Calculator", "x54", ""),
        (5, "Farm Profit/Loss Calculator", "x54", ""),
        (6, "Livestock Feed Calculator", "x15", ""),
        (7, "Poultry Farm ROI Calculator", "x15", "[DDPE] #1 SME in NG, KE, GH"),
        (8, "Fish Farming (Aquaculture) ROI", "x15", ""),
        (9, "Crop Rotation Planner", "x1", ""),
        (10, "Harvest Date Estimator", "x54", "Regional climate data"),
        (11, "Farm Size Converter (acres/hectares/plots)", "x1", ""),
        (12, "Pesticide Dosage Calculator", "x1", ""),
        (13, "Soil pH Calculator", "x1", ""),
        (14, "Greenhouse Cost Estimator", "x15", ""),
        (15, "Cassava Processing Profit Calculator", "x15", "West Africa staple"),
        (16, "Cocoa Yield & Export Price Tracker", "x1", "CI, GH, CM, NG"),
        (17, "Coffee Grade & Price Calculator", "x1", "ET, KE, TZ, UG, RW"),
        (18, "Livestock Vaccination Schedule", "x54", ""),
        (19, "Farm Worker Payroll Calculator", "x54", "Ties into PAYE"),
        (20, "Agricultural Land Valuation Tool", "x15", ""),
        (21, "Commodity Price Tracker (Africa)", "x1", "[ASIA] India MCX"),
        (22, "Tractor/Equipment Lease vs Buy", "x1", ""),
        (23, "Grain Storage Loss Calculator", "x1", "[DDPE] Post-harvest loss 30-40%"),
        (24, "Cooperative Dividend Calculator", "x1", "[DDPE] Farmer co-ops"),
        (25, "Agricultural Export Docs Checklist", "x54", ""),
    ]
    story.append(make_tool_table(tools_a1, "A"))
    story.append(Spacer(1, 8))
    story.append(Paragraph("AgriFinance", styles['SubHeader']))
    tools_a2 = [
        (26, "Farm Loan Eligibility Calculator", "x15", "[DDPE] <5% farmers access credit"),
        (27, "Crop Insurance Premium Calculator", "x15", "[ASIA] India PMFBY model"),
        (28, "Warehouse Receipt Financing Calc", "x1", "[DDPE]"),
        (29, "Agri-Input Price Comparator", "x15", ""),
        (30, "Smallholder Farm Budget Planner", "x1", ""),
    ]
    story.append(make_tool_table(tools_a2, "A"))
    story.append(PageBreak())

    # ── CATEGORY B: IMPORT/EXPORT ──
    story.append(Paragraph("CATEGORY B: IMPORT/EXPORT & TRADE", styles['CatHeader']))
    story.append(Paragraph(
        "Africa's intra-continental trade is only 15%. AfCFTA is changing this. HUGE gap in tooling.",
        styles['SmallNote']
    ))
    tools_b = [
        (31, "Import Duty Calculator", "x54", "[DDPE] Country-specific HS codes"),
        (32, "Customs Tariff Lookup (HS Code Search)", "x54", "[US] USITC"),
        (33, "AfCFTA Tariff Reduction Tracker", "x1", "[DDPE] Free trade compliance"),
        (34, "Landed Cost Calculator (CIF/FOB)", "x54", "[US] Flexport"),
        (35, "Container Shipping Cost Estimator", "x1", ""),
        (36, "Exchange Rate Impact on Import Cost", "x15", ""),
        (37, "Letter of Credit (LC) Fee Calculator", "x1", ""),
        (38, "Export Documentation Checklist", "x54", ""),
        (39, "Certificate of Origin Generator", "x54", "[DDPE] AfCFTA compliance"),
        (40, "Port Demurrage Calculator", "x15", "Lagos, Mombasa, Durban etc."),
        (41, "Incoterms Calculator & Explainer", "x1", ""),
        (42, "Trade Finance Cost Comparator", "x1", ""),
        (43, "Commodity Import/Export Volume Tracker", "x15", ""),
        (44, "Cross-Border Payment Fee Comparator", "x15", "[ASIA] TransferWise model"),
        (45, "ECOWAS Trade Levy Calculator", "x1", ""),
        (46, "SADC Rules of Origin Checker", "x1", ""),
        (47, "EAC Common External Tariff Lookup", "x1", ""),
        (48, "Proforma Invoice Generator (Intl)", "x1", ""),
        (49, "Packing List Generator", "x1", ""),
        (50, "Bill of Lading Template Generator", "x1", ""),
    ]
    story.append(make_tool_table(tools_b, "B"))
    story.append(PageBreak())

    # ── CATEGORY C: REAL ESTATE ──
    story.append(Paragraph("CATEGORY C: REAL ESTATE & PROPERTY", styles['CatHeader']))
    story.append(Paragraph("Currently only stamp duty + rent-buy. Barely scratching the surface.", styles['SmallNote']))
    tools_c = [
        (51, "Land Title Verification Checklist", "x54", "[DDPE] #1 property risk: land fraud"),
        (52, "Property Valuation Estimator", "x15", "[US] Zillow Zestimate"),
        (53, "Rent Affordability Calculator", "x54", ""),
        (54, "Tenant Screening Checklist", "x15", ""),
        (55, "Rental Agreement Generator", "x54", "Country-specific tenancy law"),
        (56, "Property Management Fee Calculator", "x15", ""),
        (57, "Building Material Cost Estimator", "x54", "[DDPE] Costs vary wildly"),
        (58, "House Construction Budget Planner", "x15", ""),
        (59, "Property Development Feasibility", "x15", ""),
        (60, "Land Survey Cost Estimator", "x15", ""),
        (61, "Property Capital Gains Tax Calc", "x54", "Extends CGT tools"),
        (62, "Strata/Service Charge Calculator", "x15", ""),
        (63, "Short-Let (Airbnb) Income Calculator", "x15", "[US] AirDNA model"),
        (64, "Real Estate Agent Commission Calc", "x54", ""),
        (65, "Buy vs Rent Decision Tool", "x54", "Better than current rent-buy"),
        (66, "Plot Size Converter", "x1", "Africa-specific plot units"),
        (67, "Building Permit Checklist", "x54", "[DDPE] Bureaucratic pain"),
        (68, "Diaspora Property Investment Calc", "x15", "[DDPE] Huge diaspora demand"),
        (69, "Off-Plan vs Ready Property Comparator", "x1", ""),
        (70, "Property Tax Calculator", "x54", "Different from income tax"),
    ]
    story.append(make_tool_table(tools_c, "C"))
    story.append(PageBreak())

    # ── CATEGORY D: HR & PAYROLL ──
    story.append(Paragraph("CATEGORY D: HR, PAYROLL & WORKFORCE", styles['CatHeader']))
    story.append(Paragraph("PAYE exists but no actual HR tools. Africa's gig economy + SME explosion needs this.", styles['SmallNote']))
    tools_d = [
        (71, "Payslip Generator", "x54", "[US] Gusto"),
        (72, "Minimum Wage Checker", "x54", "[DDPE] Constantly changing"),
        (73, "Overtime Calculator", "x54", "Country-specific labor law"),
        (74, "Leave/PTO Calculator", "x54", ""),
        (75, "Gratuity/Severance Calculator", "x54", ""),
        (76, "End of Service Benefits Calculator", "x54", "[DDPE] Workers rights"),
        (77, "Employee Cost Calc (Total Cost to Co.)", "x54", ""),
        (78, "Freelancer Rate Card Generator", "x15", ""),
        (79, "Job Offer Comparison Tool", "x1", "[US] Levels.fyi model"),
        (80, "Remote Worker Tax Obligations", "x15", "[DDPE] Cross-border remote"),
        (81, "Expatriate Tax Calculator", "x15", ""),
        (82, "Staff Loan Repayment Calculator", "x1", ""),
        (83, "Salary Advance Calculator", "x1", ""),
        (84, "Commission Structure Builder", "x1", ""),
        (85, "Shift Schedule Generator", "x1", ""),
        (86, "Employee Turnover Cost Calculator", "x1", ""),
        (87, "Hiring Cost Calculator", "x15", ""),
        (88, "Redundancy/Retrenchment Calculator", "x54", "Country labor law"),
        (89, "Maternity/Paternity Leave Calculator", "x54", ""),
        (90, "NSSF/Social Security Contribution Calc", "x54", "All countries"),
        (91, "Pension Fund Projection Tool", "x54", ""),
        (92, "Work Permit Cost Estimator", "x54", ""),
        (93, "Domestic Worker Salary Guide", "x15", "[DDPE] Huge informal sector"),
        (94, "Gig Worker Income Tracker", "x1", "[ASIA] Grab/Gojek driver tools"),
        (95, "Contractor vs Employee Tax Comparison", "x54", ""),
    ]
    story.append(make_tool_table(tools_d, "D"))
    story.append(PageBreak())

    # ── CATEGORY E: INSURANCE ──
    story.append(Paragraph("CATEGORY E: INSURANCE", styles['CatHeader']))
    story.append(Paragraph("Africa's insurance penetration is <3%. Massive opportunity.", styles['SmallNote']))
    tools_e = [
        (96, "Car Insurance Premium Estimator", "x54", "[DDPE] Many overpaying"),
        (97, "Health Insurance Plan Comparator", "x15", "[US] Healthcare.gov model"),
        (98, "Life Insurance Needs Calculator", "x15", ""),
        (99, "Funeral/Burial Insurance Calculator", "x15", "[DDPE] Big in SA, KE, NG"),
        (100, "Travel Insurance Cost Estimator", "x1", ""),
        (101, "Business Insurance Estimator", "x15", ""),
        (102, "Crop Insurance Calculator", "x15", "Ties into AgriTech"),
        (103, "Motor Vehicle Third-Party Premium", "x54", "Mandatory most countries"),
        (104, "Professional Indemnity Calculator", "x1", ""),
        (105, "Fire Insurance Premium Estimator", "x1", ""),
        (106, "Marine/Cargo Insurance Calculator", "x1", ""),
        (107, "Microinsurance Premium Calculator", "x15", "[ASIA] India micro-insurance"),
        (108, "Insurance Claim Tracker/Checklist", "x1", ""),
        (109, "Workers Compensation Calculator", "x54", ""),
        (110, "NHIF/NHIS Contribution Calculator", "x54", "Country health insurance"),
    ]
    story.append(make_tool_table(tools_e, "E"))
    story.append(Spacer(1, 10))

    # ── CATEGORY F: TELECOM ──
    story.append(Paragraph("CATEGORY F: TELECOMMUNICATIONS & MOBILE", styles['CatHeader']))
    story.append(Paragraph("Mobile-first continent. Data is expensive. This is where the users ARE.", styles['SmallNote']))
    tools_f = [
        (111, "Mobile Data Plan Comparator", "x54", "[DDPE] Data poverty is real"),
        (112, "USSD Code Directory", "x54", "[DDPE] Most Africans use USSD"),
        (113, "Airtime to Cash Value Calculator", "x15", ""),
        (114, "Mobile Money Fee Calculator", "x54", "[DDPE] M-Pesa, MTN MoMo, OPay"),
        (115, "Data Usage Calculator", "x1", ""),
        (116, "Roaming Cost Calculator (Africa)", "x15", ""),
        (117, "Internet Speed vs Cost Comparator", "x54", "[DDPE]"),
        (118, "Fiber vs LTE vs 5G Comparator", "x15", ""),
        (119, "Telecom Number Portability Guide", "x54", ""),
        (120, "SIM Registration Status Checker", "x15", "[DDPE] Mandatory SIM reg"),
        (121, "DSTV/GoTV/Showmax Package Comparator", "x15", ""),
        (122, "Starlink vs Local ISP Comparator", "x15", "Hot topic in Africa"),
        (123, "Business Internet Cost Calculator", "x15", ""),
        (124, "SMS Bulk Pricing Calculator", "x1", ""),
        (125, "WhatsApp Biz vs SMS Cost Comparator", "x1", "[DDPE] WhatsApp dominates"),
    ]
    story.append(make_tool_table(tools_f, "F"))
    story.append(PageBreak())

    # ── CATEGORY G: ENERGY ──
    story.append(Paragraph("CATEGORY G: ENERGY & UTILITIES", styles['CatHeader']))
    story.append(Paragraph("Africa's biggest infrastructure gap. Solar is booming. 600M without reliable power.", styles['SmallNote']))
    tools_g = [
        (126, "Electricity Tariff Calculator", "x54", "[DDPE] Tariff confusion"),
        (127, "Solar Panel ROI Calculator", "x54", "[DDPE] Off-grid explosion"),
        (128, "Solar System Size Calculator", "x1", ""),
        (129, "Inverter/Battery Sizing Tool", "x1", "[DDPE] NG: 60M generators"),
        (130, "Generator Fuel Cost Calculator", "x15", ""),
        (131, "Solar vs Generator Cost Comparison", "x15", "[DDPE] Critical SME decision"),
        (132, "Prepaid Meter Unit Calculator", "x54", ""),
        (133, "Electricity Bill Verifier", "x15", "[DDPE] Estimated billing disputes"),
        (134, "Water Bill Calculator", "x15", ""),
        (135, "Gas/LPG Cost Calculator", "x15", ""),
        (136, "Carbon Footprint Calculator", "x1", ""),
        (137, "EV Charging Cost Calculator", "x1", "Forward-looking"),
        (138, "Home Energy Audit Tool", "x1", ""),
        (139, "Power Backup Duration Calculator", "x1", ""),
        (140, "Pay-As-You-Go Solar Payment Calc", "x15", "[ASIA] M-Kopa model"),
        (141, "Diesel vs Solar Farm Cost Comparison", "x1", ""),
        (142, "Mini-Grid Feasibility Calculator", "x1", ""),
        (143, "Appliance Power Consumption Calc", "x1", ""),
        (144, "Electricity Outage Cost Calc (Biz)", "x15", "[DDPE]"),
        (145, "Biogas Digester ROI Calculator", "x1", ""),
    ]
    story.append(make_tool_table(tools_g, "G"))
    story.append(PageBreak())

    # ── CATEGORY H: LEGAL ──
    story.append(Paragraph("CATEGORY H: LEGAL & COMPLIANCE", styles['CatHeader']))
    story.append(Paragraph("Currently 10 legal tools. Africa needs 100+. Regulatory complexity is THE pain point.", styles['SmallNote']))
    story.append(Paragraph("Business Legal", styles['SubHeader']))
    tools_h1 = [
        (146, "Business Registration Checklist", "x54", "[DDPE] #1 barrier to formalization"),
        (147, "Company Type Selector (LLC/LTD/Sole)", "x54", "[US] LegalZoom"),
        (148, "Business License Checker", "x54", ""),
        (149, "Tax ID Number (TIN) Guide", "x54", ""),
        (150, "Annual Returns Filing Reminder", "x54", ""),
        (151, "Trademark Registration Checklist", "x54", ""),
        (152, "IP Protection Guide", "x1", ""),
        (153, "NDA Generator", "x1", ""),
        (154, "Partnership Agreement Generator", "x1", ""),
        (155, "Shareholder Agreement Template", "x1", ""),
        (156, "Board Resolution Template Generator", "x1", ""),
        (157, "Company Winding-Up Checklist", "x54", ""),
        (158, "Foreign Company Registration Guide", "x54", ""),
    ]
    story.append(make_tool_table(tools_h1, "H"))
    story.append(Spacer(1, 6))
    story.append(Paragraph("Data Privacy & Compliance [DDPE]", styles['SubHeader']))
    tools_h2 = [
        (159, "NDPA Compliance Checker (Nigeria)", "x1", "[DDPE] Data protection"),
        (160, "POPIA Compliance Checker (South Africa)", "x1", ""),
        (161, "Kenya Data Protection Act Checker", "x1", ""),
        (162, "GDPR vs African Data Law Comparator", "x1", ""),
        (163, "Privacy Policy Generator", "x54", "Country-specific DPA"),
        (164, "Cookie Consent Banner Generator", "x1", ""),
        (165, "Data Breach Notification Template", "x54", ""),
        (166, "Data Processing Agreement Generator", "x1", ""),
        (167, "Cross-Border Data Transfer Checklist", "x15", "[DDPE]"),
        (168, "DPIA Tool", "x1", "Data Protection Impact Assessment"),
    ]
    story.append(make_tool_table(tools_h2, "H"))
    story.append(Spacer(1, 6))
    story.append(Paragraph("Personal Legal", styles['SubHeader']))
    tools_h3 = [
        (169, "Will/Testament Generator", "x54", "[DDPE] <5% have wills"),
        (170, "Power of Attorney Generator", "x54", ""),
        (171, "Divorce Settlement Calculator", "x15", ""),
        (172, "Child Support Calculator", "x54", ""),
        (173, "Inheritance Tax Calculator", "x54", ""),
        (174, "Bail Bond Calculator", "x15", ""),
        (175, "Court Fee Calculator", "x54", ""),
        (176, "Legal Aid Eligibility Checker", "x15", ""),
        (177, "Statutory Declaration Template", "x54", ""),
        (178, "Affidavit Generator", "x54", ""),
    ]
    story.append(make_tool_table(tools_h3, "H"))
    story.append(PageBreak())

    # ── CATEGORY I: FINTECH ──
    story.append(Paragraph("CATEGORY I: FINTECH & DIGITAL BANKING", styles['CatHeader']))
    story.append(Paragraph("Africa is THE global fintech frontier. Basic finance exists but not fintech-specific tools.", styles['SmallNote']))
    story.append(Paragraph("Savings & Investment", styles['SubHeader']))
    tools_i1 = [
        (179, "Fixed Deposit Rate Comparator", "x54", "[ASIA] BankBazaar"),
        (180, "Money Market Fund Comparator", "x15", ""),
        (181, "Treasury Bill Yield Calculator", "x54", "[DDPE] T-bills huge in NG, KE, GH"),
        (182, "Government Bond Yield Calculator", "x15", ""),
        (183, "Stock Portfolio Tracker", "x15", "[US] Robinhood model"),
        (184, "Dividend Yield Calculator", "x1", ""),
        (185, "SACCO/Credit Union Savings Calc", "x15", "[DDPE] SACCOs massive in KE, TZ"),
        (186, "Thrift/Cooperative Returns Calc", "x15", ""),
        (187, "Dollar-Cost Averaging Calc (Stocks)", "x1", ""),
        (188, "Real Return (After Inflation) Calc", "x54", "[DDPE] Inflation is brutal"),
        (189, "Investment Property vs Stocks Comp.", "x1", ""),
        (190, "Emergency Fund Calculator", "x1", ""),
        (191, "Financial Independence (FIRE) Calc", "x1", ""),
        (192, "Net Worth Tracker", "x1", ""),
    ]
    story.append(make_tool_table(tools_i1, "I"))
    story.append(Spacer(1, 6))
    story.append(Paragraph("Lending & Credit", styles['SubHeader']))
    tools_i2 = [
        (193, "Loan Shark vs Bank Rate Comparator", "x15", "[DDPE] Predatory lending crisis"),
        (194, "Microfinance Loan Calculator", "x15", ""),
        (195, "Digital Lending App Rate Comparator", "x15", "[DDPE] Branch, FairMoney etc."),
        (196, "Credit Score Explainer & Simulator", "x15", "[US] Credit Karma"),
        (197, "Debt Snowball/Avalanche Calculator", "x1", ""),
        (198, "Loan Consolidation Calculator", "x1", ""),
        (199, "BNPL Cost Calculator", "x15", "[ASIA] Atome model"),
        (200, "Asset Finance Calculator", "x15", ""),
        (201, "Invoice Factoring Calculator", "x1", ""),
        (202, "Trade Credit Terms Calculator", "x1", ""),
    ]
    story.append(make_tool_table(tools_i2, "I"))
    story.append(Spacer(1, 6))
    story.append(Paragraph("Payments & Transfers", styles['SubHeader']))
    tools_i3 = [
        (203, "Remittance Fee Comparator (Diaspora)", "x54", "[DDPE] $100B+ market"),
        (204, "Payment Gateway Fee Comparator", "x15", "Paystack vs Flutterwave vs Stripe"),
        (205, "POS Transaction Fee Calculator", "x15", ""),
        (206, "Mobile Money vs Bank Transfer Comp.", "x54", ""),
        (207, "QR Payment Generator", "x1", "[ASIA] WeChat/Paytm"),
        (208, "Bill Split Calculator (mobile money)", "x1", ""),
        (209, "Merchant Fee Calculator", "x15", ""),
        (210, "Cross-Border B2B Payment Comparator", "x1", ""),
    ]
    story.append(make_tool_table(tools_i3, "I"))
    story.append(PageBreak())

    # ── CATEGORY J: EDUCATION ──
    story.append(Paragraph("CATEGORY J: EDUCATION & EDTECH", styles['CatHeader']))
    story.append(Paragraph("Currently 20 tools. Africa has 400M+ students. Massive gap.", styles['SmallNote']))
    tools_j = [
        (211, "School Fees Comparison Tool", "x54", "[DDPE] School fee burden"),
        (212, "Student Budget Planner", "x1", ""),
        (213, "Scholarship Eligibility Checker", "x15", ""),
        (214, "Study Abroad Cost Calculator", "x54", "Origin + destination"),
        (215, "JAMB Score Calculator (Nigeria)", "x1", "Massive traffic potential"),
        (216, "KCSE Grade Calculator (Kenya)", "x1", ""),
        (217, "Matric Point Calculator (S. Africa)", "x1", ""),
        (218, "WAEC/NECO Grade Point Calculator", "x1", ""),
        (219, "CGPA to GPA Converter", "x1", ""),
        (220, "University Admission Points Calc", "x15", "Country-specific"),
        (221, "Student Loan Repayment Calculator", "x15", ""),
        (222, "HELB Repayment Calculator (Kenya)", "x1", "Expand existing"),
        (223, "NYSC Allowance Calculator (Nigeria)", "x1", ""),
        (224, "National Service Calculator (Ghana)", "x1", ""),
        (225, "Classroom Size Calculator", "x1", "For school administrators"),
        (226, "Teacher Salary Scale Lookup", "x54", ""),
        (227, "Exam Timetable Generator", "x1", ""),
        (228, "Research Citation Generator", "x1", ""),
        (229, "Plagiarism Percentage Estimator", "x1", ""),
        (230, "Course Load/Credit Hour Planner", "x1", ""),
        (231, "Boarding School Cost Calculator", "x15", ""),
        (232, "Tutoring Rate Calculator", "x15", ""),
        (233, "Professional Cert ROI Calculator", "x1", ""),
        (234, "Coding Bootcamp Comparator (Africa)", "x1", ""),
        (235, "Education Savings Plan Calculator", "x15", ""),
    ]
    story.append(make_tool_table(tools_j, "J"))
    story.append(PageBreak())

    # ── CATEGORY K: TRANSPORT ──
    story.append(Paragraph("CATEGORY K: TRANSPORTATION & LOGISTICS", styles['CatHeader']))
    story.append(Paragraph("Logistics is 75% of product cost in Africa vs 15% in US. Huge pain point.", styles['SmallNote']))
    tools_k = [
        (236, "Fuel Cost per Trip Calculator", "x54", "[DDPE] Fuel price volatility"),
        (237, "Vehicle Operating Cost Calculator", "x1", ""),
        (238, "Ride-Hailing Fare Estimator", "x15", "[ASIA] Grab fare tool"),
        (239, "Truck Load Optimizer", "x1", ""),
        (240, "Delivery Cost Estimator", "x15", ""),
        (241, "Import Duty & Landed Cost Calculator", "x54", "[DDPE] Huge cost component"),
        (242, "Car Loan vs Cash Purchase Comp.", "x15", ""),
        (243, "Vehicle Depreciation Calculator", "x1", ""),
        (244, "Fleet Fuel Budget Calculator", "x1", ""),
        (245, "Boda-Boda/Okada Daily Income Calc", "x15", "[DDPE] Gig transport"),
        (246, "Logistics Route Cost Comparator", "x1", ""),
        (247, "Shipping Weight/Volume Calculator", "x1", ""),
        (248, "Customs Clearance Time Estimator", "x15", ""),
        (249, "Vehicle Registration Renewal Checker", "x54", ""),
        (250, "Road Worthiness Certificate Checklist", "x54", ""),
        (251, "Parking Fee Calculator", "x15", ""),
        (252, "Toll Fee Calculator", "x15", ""),
        (253, "Last-Mile Delivery Cost Optimizer", "x1", "[ASIA] Lalamove model"),
        (254, "Matatu/Danfo Route Fare Calculator", "x15", "Public transit"),
        (255, "Flight Price Tracker (Domestic Africa)", "x1", ""),
    ]
    story.append(make_tool_table(tools_k, "K"))
    story.append(PageBreak())

    # ── CATEGORY L: GOVERNMENT ──
    story.append(Paragraph("CATEGORY L: GOVERNMENT & CIVIC", styles['CatHeader']))
    story.append(Paragraph("Massive DDPE gap. Government services are opaque. Be the transparency layer.", styles['SmallNote']))
    tools_l = [
        (256, "Government Budget Tracker", "x54", "[DDPE] Accountability"),
        (257, "Tax Revenue Per Capita Calculator", "x54", ""),
        (258, "Constituency/LGA Fund Allocation", "x15", ""),
        (259, "National ID Registration Checklist", "x54", "[DDPE] Digital ID push"),
        (260, "Voter Registration Guide", "x54", ""),
        (261, "Passport Application Checklist", "x54", ""),
        (262, "Visa Requirement Checker (Africa)", "x54", "[DDPE] Visa-free score"),
        (263, "Public Holiday Calendar", "x54", ""),
        (264, "Government Contract Value Tracker", "x15", ""),
        (265, "FOI Request Template", "x15", "Freedom of Information"),
        (266, "Birth/Death Certificate Guide", "x54", ""),
        (267, "Marriage Certificate Guide", "x54", ""),
        (268, "Land Registry Fee Calculator", "x54", ""),
        (269, "National Pension Estimator", "x54", ""),
        (270, "Social Welfare Eligibility Checker", "x15", ""),
        (271, "Youth Employment Scheme Finder", "x15", ""),
        (272, "Government Scholarship Finder", "x15", ""),
        (273, "Public Procurement Opportunity Finder", "x15", ""),
        (274, "Local Govt Revenue Dashboard", "x15", ""),
        (275, "Budget Allocation Comparator (YoY)", "x15", ""),
    ]
    story.append(make_tool_table(tools_l, "L"))
    story.append(PageBreak())

    # ── CATEGORY M: SMALL BUSINESS ──
    story.append(Paragraph("CATEGORY M: SMALL BUSINESS & ENTREPRENEURSHIP", styles['CatHeader']))
    story.append(Paragraph("Africa has 50M+ SMEs. They need tools, not just calculators.", styles['SmallNote']))
    story.append(Paragraph("Business Setup & Operations", styles['SubHeader']))
    tools_m1 = [
        (276, "Business Plan Financial Projections", "x1", "Extend existing planner"),
        (277, "Startup Runway Calculator", "x1", "[US] Y Combinator"),
        (278, "Market Size (TAM/SAM/SOM) Calc", "x15", ""),
        (279, "Pricing Strategy Calculator", "x1", ""),
        (280, "Unit Economics Calculator", "x1", ""),
        (281, "Customer Acquisition Cost Calc", "x1", ""),
        (282, "Customer Lifetime Value Calculator", "x1", ""),
        (283, "Churn Rate Calculator", "x1", ""),
        (284, "Burn Rate Calculator", "x1", ""),
        (285, "Franchise Fee Calculator", "x15", ""),
        (286, "Business Valuation Calculator (SME)", "x1", ""),
        (287, "Cash Flow Forecast Tool", "x1", ""),
        (288, "Working Capital Calculator", "x1", ""),
        (289, "Inventory Turnover Calculator", "x1", ""),
        (290, "Dead Stock Cost Calculator", "x1", ""),
    ]
    story.append(make_tool_table(tools_m1, "M"))
    story.append(Spacer(1, 6))
    story.append(Paragraph("African-Specific Business Tools", styles['SubHeader']))
    tools_m2 = [
        (291, "Market Stall Profit Calculator", "x15", "[DDPE] Informal economy"),
        (292, "Mama Put/Buka Revenue Tracker", "x1", "Food vendor tool"),
        (293, "Sachet Economy Pricing Calculator", "x1", "[DDPE] Sachet economics"),
        (294, "Artisan Service Rate Calculator", "x15", "Plumber, electrician, tailor"),
        (295, "Mobile Shop (Table-Top) Profit Calc", "x1", ""),
        (296, "Thrift Shop/Okrika Business Calc", "x1", "Second-hand goods"),
        (297, "POS Agent Business Calculator", "x15", "[DDPE] Agent banking"),
        (298, "Betting Shop ROI Calculator", "x15", ""),
        (299, "Barbershop/Salon Profit Calculator", "x1", ""),
        (300, "Mini-Importation Profit Calculator", "x15", "[DDPE] China-to-Africa"),
        (301, "Event Planning Budget Calculator", "x1", ""),
        (302, "Catering/Owambe Cost Calculator", "x1", "NG/West Africa weddings"),
        (303, "Laundry Service Pricing Calculator", "x1", ""),
        (304, "Fuel Station Profit Calculator", "x15", ""),
        (305, "Pharmacy Business Calculator", "x15", ""),
        (306, "School Business (Proprietor) Calc", "x15", ""),
        (307, "Church/Mosque Offering Tracker", "x1", ""),
        (308, "Nollywood/Film Budget Tool", "x1", ""),
        (309, "Music Production Cost Calculator", "x1", ""),
        (310, "YouTube/Content Creator Revenue Est.", "x1", ""),
    ]
    story.append(make_tool_table(tools_m2, "M"))
    story.append(Spacer(1, 6))
    story.append(Paragraph("E-commerce & Digital Business", styles['SubHeader']))
    tools_m3 = [
        (311, "Marketplace Fee Comparator", "x15", "Jumia/Konga/Takealot"),
        (312, "Social Commerce Profit Calculator", "x1", "[DDPE] Instagram/WhatsApp"),
        (313, "Dropshipping Profit Calculator", "x1", ""),
        (314, "Print-on-Demand Pricing Calculator", "x1", ""),
        (315, "SaaS Metrics Dashboard Builder", "x1", ""),
        (316, "Digital Product Pricing Calculator", "x1", ""),
        (317, "Affiliate Marketing Revenue Calc", "x1", ""),
        (318, "Email Marketing ROI Calculator", "x1", ""),
        (319, "Social Media Ad Spend Calculator", "x1", ""),
        (320, "Google Ads Budget Calculator", "x1", ""),
    ]
    story.append(make_tool_table(tools_m3, "M"))
    story.append(PageBreak())

    # ── CATEGORY N: HEALTH ──
    story.append(Paragraph("CATEGORY N: HEALTH & WELLNESS", styles['CatHeader']))
    story.append(Paragraph("Currently 25 tools. Africa's health challenges are unique. Expand dramatically.", styles['SmallNote']))
    story.append(Paragraph("Disease-Specific (Africa's Burden)", styles['SubHeader']))
    tools_n1 = [
        (321, "HIV/AIDS Treatment Cost Calculator", "x15", "[DDPE]"),
        (322, "Tuberculosis Treatment Tracker", "x15", ""),
        (323, "Malaria Prevention Cost Calculator", "x54", ""),
        (324, "Cholera Risk Assessment Tool", "x15", ""),
        (325, "Ebola Preparedness Checklist", "x15", ""),
        (326, "Hepatitis B Screening Cost Est.", "x15", ""),
        (327, "Sickle Cell Carrier Risk Calculator", "x1", "Expand existing"),
        (328, "Genotype Compatibility Checker", "x1", "[DDPE] Pre-marriage check"),
        (329, "Blood Group Compatibility Checker", "x1", ""),
        (330, "Maternal Mortality Risk Assessment", "x15", "[DDPE]"),
    ]
    story.append(make_tool_table(tools_n1, "N"))
    story.append(Spacer(1, 6))
    story.append(Paragraph("Healthcare Costs", styles['SubHeader']))
    tools_n2 = [
        (331, "Hospital Bill Estimator", "x15", "[US] Healthcare Bluebook"),
        (332, "Medical Tourism Cost Comparator", "x1", "India vs SA vs Egypt"),
        (333, "Childbirth Cost Calculator", "x15", "[DDPE]"),
        (334, "C-Section vs Natural Birth Cost", "x15", ""),
        (335, "Dental Procedure Cost Estimator", "x15", ""),
        (336, "Eye Care Cost Calculator", "x15", ""),
        (337, "Mental Health Service Cost Finder", "x15", ""),
        (338, "Pharmacy Drug Price Comparator", "x15", "[DDPE] Drug price opacity"),
        (339, "Traditional vs Western Medicine Cost", "x1", "Culturally sensitive"),
        (340, "HMO Plan Comparator", "x15", ""),
    ]
    story.append(make_tool_table(tools_n2, "N"))
    story.append(Spacer(1, 6))
    story.append(Paragraph("Nutrition & Fitness", styles['SubHeader']))
    tools_n3 = [
        (341, "African Food Calorie Counter", "x1", "[DDPE] No existing database"),
        (342, "African Meal Plan Generator", "x1", "Jollof, ugali, injera etc."),
        (343, "Pregnancy Nutrition Calc (African Diet)", "x1", ""),
        (344, "Child Growth Chart (WHO + African)", "x1", ""),
        (345, "Breastfeeding Tracker", "x1", ""),
        (346, "Gym Membership Cost Comparator", "x15", ""),
        (347, "Home Workout Calorie Burner", "x1", ""),
    ]
    story.append(make_tool_table(tools_n3, "N"))
    story.append(PageBreak())

    # ── CATEGORY O: CLIMATE ──
    story.append(Paragraph("CATEGORY O: CLIMATE & ENVIRONMENT", styles['CatHeader']))
    story.append(Paragraph("Africa is most affected by climate change. Carbon markets are booming.", styles['SmallNote']))
    tools_o = [
        (348, "Carbon Credit Revenue Calculator", "x15", "[DDPE] Africa's carbon market"),
        (349, "Drought Risk Assessment Tool", "x54", ""),
        (350, "Flood Risk Assessment Tool", "x15", ""),
        (351, "Air Quality Index Tracker", "x15", ""),
        (352, "Deforestation Impact Calculator", "x15", ""),
        (353, "Water Scarcity Calculator", "x54", ""),
        (354, "Waste Management Cost Calculator", "x15", ""),
        (355, "Recycling Revenue Calculator", "x15", ""),
        (356, "E-Waste Collection Value Calculator", "x1", ""),
        (357, "Charcoal vs Clean Cooking Cost Comp.", "x15", "[DDPE] 900M use charcoal"),
        (358, "Rainfall Pattern Tracker", "x54", ""),
        (359, "Tree Planting ROI Calculator", "x1", ""),
        (360, "Sustainable Business Score Card", "x1", "ESG for African SMEs"),
    ]
    story.append(make_tool_table(tools_o, "O"))
    story.append(Spacer(1, 10))

    # ── CATEGORY P: DIASPORA ──
    story.append(Paragraph("CATEGORY P: DIASPORA TOOLS", styles['CatHeader']))
    story.append(Paragraph("170M+ African diaspora. They send money, invest, and plan to return.", styles['SmallNote']))
    tools_p = [
        (361, "Japa Budget Calculator (by dest.)", "x15", "Expand existing"),
        (362, "Visa Application Tracker", "x1", ""),
        (363, "Immigration Points Calc (CA/AU/UK)", "x1", ""),
        (364, "Diaspora Investment Comparator", "x54", "Where to invest back home"),
        (365, "Naira/Cedi/Rand Savings Goal Tracker", "x15", ""),
        (366, "Double Taxation Relief Calculator", "x15", ""),
        (367, "Cost of Living: Africa vs Abroad", "x15", ""),
        (368, "Return Migration Cost Calculator", "x15", ""),
        (369, "Diaspora Voting Eligibility Checker", "x54", ""),
        (370, "Intl Money Transfer Tracker", "x1", ""),
        (371, "Foreign Qualification Recognition", "x15", ""),
        (372, "Rent vs Own Abroad Calculator", "x1", ""),
        (373, "Cultural Adjustment Score", "x1", "Fun/engagement tool"),
        (374, "Diaspora Business Registration Guide", "x54", ""),
        (375, "IELTS/TOEFL Score Converter", "x1", ""),
        (376, "Embassy Wait Time Estimator", "x15", ""),
        (377, "Overseas Healthcare Cost Comparator", "x1", ""),
    ]
    story.append(make_tool_table(tools_p, "P"))
    story.append(PageBreak())

    # ── CATEGORY Q: DEVELOPER ──
    story.append(Paragraph("CATEGORY Q: DEVELOPER & TECH TOOLS", styles['CatHeader']))
    story.append(Paragraph("Africa's tech ecosystem is booming. Extend the existing 40 tools.", styles['SmallNote']))
    tools_q = [
        (378, "African API Directory & Status Checker", "x1", "Paystack, Flutterwave, Africa's Talking"),
        (379, "Payment Integration Code Generator", "x1", ""),
        (380, "USSD App Flow Builder", "x1", "[DDPE] USSD-first market"),
        (381, "M-Pesa Integration Guide Generator", "x1", ""),
        (382, "SMS API Cost Comparator", "x15", ""),
        (383, "African Domain Name Checker", "x54", ".ng, .ke, .za etc."),
        (384, "Hosting Cost Comparator (African CDN)", "x1", ""),
        (385, "SSL Certificate Comparator", "x1", ""),
        (386, "Website Speed Tester (African cities)", "x1", ""),
        (387, "PWA Manifest Generator", "x1", ""),
        (388, "Color Palette Generator (African)", "x1", ""),
        (389, "JWT Token Debugger", "x1", ""),
        (390, "OAuth Flow Visualizer", "x1", ""),
        (391, "GraphQL Query Builder", "x1", ""),
        (392, "Docker Compose Generator", "x1", ""),
        (393, ".env File Template Generator", "x1", ""),
        (394, "Git Commit Message Generator", "x1", ""),
        (395, "Linux Command Cheat Sheet", "x1", ""),
        (396, "Markdown Table Generator", "x1", ""),
        (397, "SVG Path Editor", "x1", ""),
        (398, "Tailwind CSS Class Finder", "x1", ""),
        (399, "Rate Limiter Calculator", "x1", ""),
        (400, "Database Schema Visualizer", "x1", ""),
    ]
    story.append(make_tool_table(tools_q, "Q"))
    story.append(PageBreak())

    # ── CATEGORY R: RELIGIOUS ──
    story.append(Paragraph("CATEGORY R: RELIGIOUS & CULTURAL", styles['CatHeader']))
    story.append(Paragraph("85%+ of Africans identify with a faith. Cultural tools = engagement magnets.", styles['SmallNote']))
    tools_r = [
        (401, "Islamic Zakat Calculator", "x54", "[DDPE] 300M+ Muslims"),
        (402, "Hajj/Umrah Budget Calculator", "x15", ""),
        (403, "Islamic Inheritance (Faraid) Calc", "x15", ""),
        (404, "Halal Business Compliance Checker", "x1", ""),
        (405, "Church Tithe Calculator", "x1", ""),
        (406, "Wedding Budget Calc (by tradition)", "x15", "Yoruba, Igbo, Zulu, Kikuyu"),
        (407, "Naming Ceremony Budget Calculator", "x15", ""),
        (408, "Funeral Cost Calc (by tradition)", "x15", ""),
        (409, "Dowry/Lobola Negotiation Guide", "x15", "Extend bride price calc"),
        (410, "Islamic Finance Profit Rate Calc", "x15", "Murabaha, Musharakah"),
        (411, "Islamic Calendar Converter", "x1", ""),
        (412, "Ramadan Timetable Generator", "x54", ""),
        (413, "Prayer Time Calculator", "x54", ""),
        (414, "African Proverb Generator", "x1", "Engagement tool"),
        (415, "Traditional Calendar Converter", "x1", "Ethiopian, Islamic, African"),
        (416, "Age Calculator (with African name day)", "x1", ""),
        (417, "Baby Name Generator (by tribe)", "x1", ""),
        (418, "Cultural Festival Calendar", "x54", ""),
        (419, "Traditional Attire Cost Calculator", "x15", "Kente, Ankara, Dashiki"),
        (420, "Aso-Ebi/Group Outfit Cost Calc", "x1", ""),
    ]
    story.append(make_tool_table(tools_r, "R"))
    story.append(Spacer(1, 10))

    # ── CATEGORY S: SPORTS ──
    story.append(Paragraph("CATEGORY S: SPORTS & ENTERTAINMENT", styles['CatHeader']))
    story.append(Paragraph("Engagement magnets. Drive traffic to monetizable tools.", styles['SmallNote']))
    tools_s = [
        (421, "Football Betting Odds Calculator", "x1", "[DDPE] Betting epidemic"),
        (422, "AFCON Tournament Predictor", "x1", ""),
        (423, "Fantasy Football Points Calculator", "x1", "EPL/African leagues"),
        (424, "Match Ticket Price Comparator", "x15", ""),
        (425, "Sports Betting Tax Calculator", "x54", "[DDPE] Tax on winnings"),
        (426, "Gym/Fitness Center ROI (Business)", "x1", ""),
        (427, "Event Ticket Revenue Calculator", "x1", ""),
        (428, "Music Streaming Royalty Calculator", "x1", ""),
        (429, "Nollywood Box Office Estimator", "x1", ""),
        (430, "DJ Booking Rate Calculator", "x1", ""),
        (431, "Photography/Videography Pricing", "x1", ""),
        (432, "Gaming PC Build Calc (Africa pricing)", "x1", ""),
        (433, "Concert/Festival Budget Planner", "x1", ""),
        (434, "Sports Scholarship Eligibility", "x1", "US/UK"),
        (435, "Athlete Career Earnings Calculator", "x1", ""),
    ]
    story.append(make_tool_table(tools_s, "S"))
    story.append(PageBreak())

    # ── CATEGORY T: PERSONAL FINANCE ──
    story.append(Paragraph("CATEGORY T: PERSONAL FINANCE DEEP-DIVE", styles['CatHeader']))
    story.append(Paragraph("Extend the strongest category with deeper, more specific tools.", styles['SmallNote']))
    story.append(Paragraph("Budgeting & Planning", styles['SubHeader']))
    tools_t1 = [
        (436, "50/30/20 Budget Calculator (localized)", "x1", ""),
        (437, "Zero-Based Budget Template", "x1", ""),
        (438, "Envelope Budgeting System", "x1", ""),
        (439, "Annual Financial Review Tool", "x1", ""),
        (440, "Wedding Budget Calc (African)", "x15", ""),
        (441, "Baby Cost Calculator (First Year)", "x15", ""),
        (442, "Back-to-School Budget Calculator", "x15", ""),
        (443, "Ramadan/Christmas Budget Planner", "x1", ""),
        (444, "Funeral Savings Goal Calculator", "x15", "[DDPE] Cultural obligation"),
        (445, "Multiple Income Stream Tracker", "x1", "[DDPE] Side hustles"),
    ]
    story.append(make_tool_table(tools_t1, "T"))
    story.append(Spacer(1, 6))
    story.append(Paragraph("Tax Extensions", styles['SubHeader']))
    tools_t2 = [
        (446, "Withholding Tax Calculator", "x54", ""),
        (447, "Turnover Tax Calculator", "x54", "Small business tax"),
        (448, "Presumptive Tax Calculator", "x54", "Informal sector"),
        (449, "Digital Services Tax Calculator", "x15", "[DDPE] New digital taxes"),
        (450, "Capital Allowances Calculator", "x54", ""),
        (451, "Tax Audit Risk Assessment", "x15", ""),
        (452, "Tax Amnesty Penalty Calculator", "x15", ""),
        (453, "Transfer Pricing Basic Checker", "x1", ""),
        (454, "Crypto Tax Calc (Africa-specific)", "x15", "Different rules per country"),
        (455, "Rental Income Tax Calculator", "x54", ""),
        (456, "Sports Betting Winnings Tax Calc", "x54", ""),
        (457, "Freelancer Tax Estimator", "x54", ""),
        (458, "Excise Duty Calculator", "x54", ""),
        (459, "Carbon Tax Calculator", "x15", "SA has one, others coming"),
        (460, "Tax Calendar/Deadline Tracker", "x54", ""),
    ]
    story.append(make_tool_table(tools_t2, "T"))
    story.append(PageBreak())

    # ── CATEGORY U: CONSTRUCTION ──
    story.append(Paragraph("CATEGORY U: CONSTRUCTION & ENGINEERING", styles['CatHeader']))
    story.append(Paragraph("Extend the existing 15 tools. Africa's construction boom is massive.", styles['SmallNote']))
    tools_u = [
        (461, "Bill of Quantities (BOQ) Generator", "x15", ""),
        (462, "Cement/Blocks Calculator", "x1", "Extend existing"),
        (463, "Roofing Material Calculator", "x1", ""),
        (464, "Paint Coverage Calculator", "x1", ""),
        (465, "Plumbing Material Calculator", "x1", ""),
        (466, "Electrical Load Calculator", "x1", ""),
        (467, "Steel Reinforcement Calculator", "x1", ""),
        (468, "Tiling Calculator", "x1", ""),
        (469, "Foundation Depth Calculator", "x1", ""),
        (470, "Septic Tank Size Calculator", "x1", "[DDPE] Off-grid sanitation"),
        (471, "Borehole/Well Cost Estimator", "x15", "[DDPE] Water access"),
        (472, "Fence Cost Calculator", "x1", ""),
        (473, "Swimming Pool Cost Estimator", "x1", ""),
        (474, "Renovation Budget Planner", "x15", ""),
        (475, "Architectural Drawing Fee Calc", "x15", ""),
        (476, "Site Clearing Cost Estimator", "x15", ""),
        (477, "Road Construction Cost Estimator", "x1", ""),
        (478, "Water Tank Size Calculator", "x1", ""),
        (479, "Scaffolding Calculator", "x1", ""),
        (480, "Window/Door Sizing Calculator", "x1", ""),
    ]
    story.append(make_tool_table(tools_u, "U"))
    story.append(Spacer(1, 10))

    # ── CATEGORY V: MINING ──
    story.append(Paragraph("CATEGORY V: MINING & EXTRACTIVES", styles['CatHeader']))
    story.append(Paragraph("Africa has 30% of world's mineral reserves. Untapped digital tooling.", styles['SmallNote']))
    tools_v = [
        (481, "Mining License Fee Calculator", "x15", ""),
        (482, "Mining Royalty Calculator", "x15", ""),
        (483, "Gold Price Tracker (African mines)", "x1", ""),
        (484, "Diamond Valuation Estimator", "x1", ""),
        (485, "Oil & Gas Revenue Calculator", "x15", "NG, AO, GH, EG"),
        (486, "Petroleum Product Pricing Breakdown", "x15", ""),
        (487, "Mining Environmental Impact Fee Calc", "x1", ""),
        (488, "Artisanal Mining Income Calculator", "x15", "[DDPE] Informal mining"),
        (489, "Mineral Export Duty Calculator", "x15", ""),
        (490, "Oil Well Production Estimator", "x1", ""),
    ]
    story.append(make_tool_table(tools_v, "V"))
    story.append(PageBreak())

    # ── CATEGORY W: MANUFACTURING ──
    story.append(Paragraph("CATEGORY W: MANUFACTURING & PRODUCTION", styles['CatHeader']))
    story.append(Paragraph("AfCFTA push to industrialize. Africa needs manufacturing tools.", styles['SmallNote']))
    tools_w = [
        (491, "Factory Setup Cost Estimator", "x15", ""),
        (492, "Production Cost Calculator", "x1", ""),
        (493, "OEE Calculator", "x1", "Overall Equipment Effectiveness"),
        (494, "Quality Control Sampling Calculator", "x1", ""),
        (495, "Packaging Cost Calculator", "x1", ""),
        (496, "Label/Branding Cost Calculator", "x1", ""),
        (497, "NAFDAC/KEBS Registration Cost Guide", "x15", "[DDPE] Regulatory compliance"),
        (498, "Standards Org Compliance Checklist", "x15", ""),
        (499, "Made-in-Africa Label Eligibility", "x1", "AfCFTA rules of origin"),
        (500, "Supply Chain Cost Optimizer", "x1", ""),
    ]
    story.append(make_tool_table(tools_w, "W"))
    story.append(Spacer(1, 10))

    # ── CATEGORY X: CREATIVE ──
    story.append(Paragraph("CATEGORY X: CREATIVE ECONOMY", styles['CatHeader']))
    story.append(Paragraph("Afrobeats, Nollywood, African fashion - fastest growing creative economy globally.", styles['SmallNote']))
    tools_x = [
        (501, "Music Royalty Splitter", "x1", ""),
        (502, "Album/EP Release Budget Calculator", "x1", ""),
        (503, "Fashion Brand Startup Cost Calc", "x15", ""),
        (504, "Fabric/Material Cost Calculator", "x1", ""),
        (505, "Tailoring Pricing Calculator", "x1", ""),
        (506, "Book Publishing Cost Calculator", "x1", ""),
        (507, "Self-Publishing Royalty Calculator", "x1", ""),
        (508, "Art Commission Price Calculator", "x1", ""),
        (509, "Photography Session Pricing Tool", "x1", ""),
        (510, "Film Budget Breakdown Tool", "x1", ""),
        (511, "Podcast Monetization Calculator", "x1", ""),
        (512, "Influencer Rate Card Generator", "x1", ""),
        (513, "Brand Collaboration ROI Calculator", "x1", ""),
        (514, "Social Media Content Calendar Gen", "x1", ""),
        (515, "YouTube Revenue Est. (African audience)", "x1", ""),
        (516, "TikTok/IG Engagement Rate Calc", "x1", ""),
        (517, "Graphic Design Pricing Calculator", "x1", ""),
        (518, "Wedding Photography Package Builder", "x1", ""),
        (519, "Event Decoration Cost Calculator", "x1", ""),
        (520, "Ankara/Kente Pattern Cost Calc", "x1", ""),
    ]
    story.append(make_tool_table(tools_x, "X"))
    story.append(PageBreak())

    # ── CATEGORY Y: SECURITY ──
    story.append(Paragraph("CATEGORY Y: SECURITY & SAFETY", styles['CatHeader']))
    story.append(Paragraph("Security spending is massive in Africa. Both physical and digital.", styles['SmallNote']))
    tools_y = [
        (521, "Home Security Cost Estimator", "x15", ""),
        (522, "CCTV System Cost Calculator", "x1", ""),
        (523, "Guard Service Cost Comparator", "x15", ""),
        (524, "Cybersecurity Assessment Tool", "x1", ""),
        (525, "Password Strength Checker", "x1", ""),
        (526, "Phishing Detection Quiz", "x1", "[DDPE] Growing cybercrime"),
        (527, "Data Breach Cost Estimator", "x1", ""),
        (528, "Business Continuity Plan Template", "x1", ""),
        (529, "Emergency Fund for Security Calc", "x1", ""),
        (530, "Vehicle Tracker ROI Calculator", "x1", ""),
        (531, "Fire Safety Compliance Checklist", "x15", ""),
        (532, "Insurance Fraud Red Flag Checker", "x1", ""),
    ]
    story.append(make_tool_table(tools_y, "Y"))
    story.append(Spacer(1, 10))

    # ── CATEGORY Z: MISCELLANEOUS ──
    story.append(Paragraph("CATEGORY Z: MISCELLANEOUS HIGH-VALUE TOOLS", styles['CatHeader']))
    story.append(Paragraph("Travel & Tourism", styles['SubHeader']))
    tools_z1 = [
        (533, "African Safari Cost Calculator", "x15", ""),
        (534, "Beach Holiday Budget (African coast)", "x1", ""),
        (535, "Travel Vaccination Cost & Schedule", "x54", ""),
        (536, "Airport Transfer Cost Comparator", "x15", ""),
        (537, "Hotel Star Rating Price Guide", "x15", ""),
        (538, "Airbnb vs Hotel Comparator (Africa)", "x15", ""),
        (539, "Festival/Event Travel Budget", "x1", ""),
        (540, "Travel Packing List Generator", "x1", ""),
    ]
    story.append(make_tool_table(tools_z1, "Z"))
    story.append(Spacer(1, 6))
    story.append(Paragraph("Personal Development", styles['SubHeader']))
    tools_z2 = [
        (541, "Salary Negotiation Calculator", "x15", ""),
        (542, "Career Switch Financial Impact Tool", "x1", ""),
        (543, "Side Hustle Profitability Ranker", "x15", "[DDPE]"),
        (544, "Freelance Invoice Generator", "x1", ""),
        (545, "Freelance Contract Generator", "x1", ""),
        (546, "Personal Brand Audit Tool", "x1", ""),
        (547, "LinkedIn Profile Optimizer", "x1", ""),
        (548, "Cover Letter Generator", "x1", ""),
        (549, "Interview Preparation Checklist", "x1", ""),
        (550, "Retirement Readiness Score", "x15", ""),
    ]
    story.append(make_tool_table(tools_z2, "Z"))
    story.append(PageBreak())
    story.append(Paragraph("Women & Gender-Specific", styles['SubHeader']))
    tools_z3 = [
        (551, "Period Tracker & Cycle Calculator", "x1", "[DDPE] Health access"),
        (552, "Pregnancy Cost Calculator", "x15", ""),
        (553, "Childcare Cost Comparator", "x15", ""),
        (554, "Women-Owned Business Grant Finder", "x15", ""),
        (555, "Maternity Wardrobe Budget Calc", "x1", ""),
        (556, "Menopause Health Cost Estimator", "x1", ""),
        (557, "Gender Pay Gap Calculator", "x15", ""),
        (558, "Women's Safety App Directory", "x15", ""),
    ]
    story.append(make_tool_table(tools_z3, "Z"))
    story.append(Spacer(1, 6))
    story.append(Paragraph("Youth-Specific", styles['SubHeader']))
    tools_z4 = [
        (559, "First Job Budget Planner", "x1", "[DDPE] Financial literacy"),
        (560, "Student Accommodation Cost Comp.", "x15", ""),
        (561, "Gap Year Budget Calculator", "x1", ""),
        (562, "Internship Stipend Tracker", "x1", ""),
        (563, "NYSC/National Service Budget Plan", "x15", ""),
        (564, "Youth Business Loan Eligibility", "x15", ""),
        (565, "University Application Fee Tracker", "x15", ""),
        (566, "Campus Business Profit Calculator", "x1", ""),
    ]
    story.append(make_tool_table(tools_z4, "Z"))
    story.append(PageBreak())

    # ══════════════════════════════════════════════════════
    # MEGA CATEGORY: x54 COUNTRY TEMPLATES
    # ══════════════════════════════════════════════════════
    story.append(Paragraph("MEGA CATEGORY: x54 COUNTRY TEMPLATES", styles['CatHeader']))
    story.append(Paragraph(
        "These are templates that generate 54 tools each - one per country. "
        "This is your scalability engine. Build 19 templates = 1,026 tools.",
        styles['SmallNote']
    ))
    story.append(Spacer(1, 8))

    story.append(Paragraph("Batch 1: Financial Infrastructure (Each x54)", styles['SubHeader']))
    batch1 = [
        [Paragraph("#", styles['TableHeader']), Paragraph("Tool Template", styles['TableHeader']),
         Paragraph("Tools Generated", styles['TableHeader']), Paragraph("Running Total", styles['TableHeader'])],
        [Paragraph("567-620", styles['TableCell']), Paragraph("Minimum Wage Calculator", styles['TableCellBold']),
         Paragraph("54", styles['TableCell']), Paragraph("54", styles['TableCell'])],
        [Paragraph("621-674", styles['TableCell']), Paragraph("Cost of Living Index", styles['TableCellBold']),
         Paragraph("54", styles['TableCell']), Paragraph("108", styles['TableCell'])],
        [Paragraph("675-728", styles['TableCell']), Paragraph("Mobile Money Fee Comparator", styles['TableCellBold']),
         Paragraph("54", styles['TableCell']), Paragraph("162", styles['TableCell'])],
        [Paragraph("729-782", styles['TableCell']), Paragraph("Electricity Tariff Calculator", styles['TableCellBold']),
         Paragraph("54", styles['TableCell']), Paragraph("216", styles['TableCell'])],
        [Paragraph("783-836", styles['TableCell']), Paragraph("Fuel Price Tracker", styles['TableCellBold']),
         Paragraph("54", styles['TableCell']), Paragraph("270", styles['TableCell'])],
        [Paragraph("837-890", styles['TableCell']), Paragraph("Business Registration Guide", styles['TableCellBold']),
         Paragraph("54", styles['TableCell']), Paragraph("324", styles['TableCell'])],
        [Paragraph("891-944", styles['TableCell']), Paragraph("Property Tax Calculator", styles['TableCellBold']),
         Paragraph("54", styles['TableCell']), Paragraph("378", styles['TableCell'])],
        [Paragraph("945-998", styles['TableCell']), Paragraph("Import Duty & Landed Cost Calculator", styles['TableCellBold']),
         Paragraph("54", styles['TableCell']), Paragraph("432", styles['TableCell'])],
        [Paragraph("999-1052", styles['TableCell']), Paragraph("Remittance Fee Comparator", styles['TableCellBold']),
         Paragraph("54", styles['TableCell']), Paragraph("486", styles['TableCell'])],
    ]
    story.append(make_simple_table(batch1, [0.15*W, 0.45*W, 0.18*W, 0.22*W], CATEGORY_COLORS["MEGA"]))
    story.append(Spacer(1, 10))

    story.append(Paragraph("Batch 2: Extended Templates (Each x54)", styles['SubHeader']))
    batch2 = [
        [Paragraph("Template", styles['TableHeader']), Paragraph("Description", styles['TableHeader']),
         Paragraph("Tools", styles['TableHeader'])],
        [Paragraph("Withholding Tax Calculator", styles['TableCellBold']), Paragraph("Country-specific WHT rates", styles['TableCell']), Paragraph("54", styles['TableCell'])],
        [Paragraph("Rental Income Tax Calculator", styles['TableCellBold']), Paragraph("Landlord tax per country", styles['TableCell']), Paragraph("54", styles['TableCell'])],
        [Paragraph("Public Holiday Calendar", styles['TableCellBold']), Paragraph("Dynamic, yearly updates", styles['TableCell']), Paragraph("54", styles['TableCell'])],
        [Paragraph("Visa Requirement Checker", styles['TableCellBold']), Paragraph("From this country to X", styles['TableCell']), Paragraph("54", styles['TableCell'])],
        [Paragraph("Passport Fee Calculator", styles['TableCellBold']), Paragraph("Application + renewal costs", styles['TableCell']), Paragraph("54", styles['TableCell'])],
        [Paragraph("National ID Guide", styles['TableCellBold']), Paragraph("Registration steps per country", styles['TableCell']), Paragraph("54", styles['TableCell'])],
        [Paragraph("Solar Panel ROI Calculator", styles['TableCellBold']), Paragraph("Sunshine hours + tariff data", styles['TableCell']), Paragraph("54", styles['TableCell'])],
        [Paragraph("Data Plan Comparator", styles['TableCellBold']), Paragraph("MTN/Airtel/Safaricom etc.", styles['TableCell']), Paragraph("54", styles['TableCell'])],
        [Paragraph("Social Security Calculator", styles['TableCellBold']), Paragraph("NSSF/SSNIT equivalents", styles['TableCell']), Paragraph("54", styles['TableCell'])],
        [Paragraph("Import Duty Calculator", styles['TableCellBold']), Paragraph("HS code-based per country", styles['TableCell']), Paragraph("54", styles['TableCell'])],
        [Paragraph("Crop Yield Estimator", styles['TableCellBold']), Paragraph("Climate + soil per region", styles['TableCell']), Paragraph("54", styles['TableCell'])],
        [Paragraph("Teacher Salary Lookup", styles['TableCellBold']), Paragraph("Government pay scales", styles['TableCell']), Paragraph("54", styles['TableCell'])],
        [Paragraph("Startup Registration Cost", styles['TableCellBold']), Paragraph("All fees + timeline", styles['TableCell']), Paragraph("54", styles['TableCell'])],
    ]
    story.append(make_simple_table(batch2, [0.35*W, 0.45*W, 0.20*W], CATEGORY_COLORS["MEGA"]))
    story.append(PageBreak())

    # ══════════════════════════════════════════════════════
    # STRATEGIC ADVISORY SECTION
    # ══════════════════════════════════════════════════════
    story.append(Paragraph("STRATEGIC ADVISORY", styles['CatHeader']))
    story.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY))
    story.append(Spacer(1, 10))

    story.append(Paragraph("Top 10 Highest-Impact Builds (Start Here)", styles['AdvisoryTitle']))
    top10 = [
        [Paragraph("#", styles['TableHeader']), Paragraph("Tool", styles['TableHeader']),
         Paragraph("Why", styles['TableHeader'])],
        [Paragraph("1", styles['TableCell']), Paragraph("Mobile Money Fee Calc x54", styles['TableCellBold']),
         Paragraph("Touches every African. M-Pesa/MoMo/OPay daily use. Massive SEO.", styles['TableCell'])],
        [Paragraph("2", styles['TableCell']), Paragraph("Import Duty Calculator x54", styles['TableCellBold']),
         Paragraph("Traders search daily. No good free tool exists.", styles['TableCell'])],
        [Paragraph("3", styles['TableCell']), Paragraph("Solar Panel ROI Calc x54", styles['TableCellBold']),
         Paragraph("Energy crisis = desperate demand. Affiliate with solar companies.", styles['TableCell'])],
        [Paragraph("4", styles['TableCell']), Paragraph("Electricity Tariff Calc x54", styles['TableCellBold']),
         Paragraph("Bill disputes universal. Utility companies will link to you.", styles['TableCell'])],
        [Paragraph("5", styles['TableCell']), Paragraph("Minimum Wage Checker x54", styles['TableCellBold']),
         Paragraph("HR depts + workers + journalists reference constantly.", styles['TableCell'])],
        [Paragraph("6", styles['TableCell']), Paragraph("Remittance Fee Comp. x54", styles['TableCellBold']),
         Paragraph("$100B+ market. Affiliate goldmine (Wise, Remitly, Sendwave).", styles['TableCell'])],
        [Paragraph("7", styles['TableCell']), Paragraph("Crop Yield Estimator x15", styles['TableCellBold']),
         Paragraph("60% of Africa farms. Zero digital tools for smallholders.", styles['TableCell'])],
        [Paragraph("8", styles['TableCell']), Paragraph("Zakat Calculator x54", styles['TableCellBold']),
         Paragraph("300M+ Muslims, seasonal Ramadan spike, yearly repeat traffic.", styles['TableCell'])],
        [Paragraph("9", styles['TableCell']), Paragraph("Business Reg. Guide x54", styles['TableCellBold']),
         Paragraph("Captures entrepreneurs at journey start -> funnel to all tools.", styles['TableCell'])],
        [Paragraph("10", styles['TableCell']), Paragraph("African Food Calorie Counter", styles['TableCellBold']),
         Paragraph("NOTHING like this exists. Viral potential. No MyFitnessPal for fufu.", styles['TableCell'])],
    ]
    story.append(make_simple_table(top10, [0.06*W, 0.34*W, 0.60*W], ACCENT))
    story.append(PageBreak())

    story.append(Paragraph("DDPE Pain Points Addressed", styles['AdvisoryTitle']))
    ddpe = [
        [Paragraph("Pain Point", styles['TableHeader']), Paragraph("Tools That Solve It", styles['TableHeader'])],
        [Paragraph("Digital exclusion", styles['TableCellBold']), Paragraph("USSD tools, offline-first calculators, low-data designs", styles['TableCell'])],
        [Paragraph("Data poverty", styles['TableCellBold']), Paragraph("Data plan comparators, internet speed tools", styles['TableCell'])],
        [Paragraph("Privacy gaps", styles['TableCellBold']), Paragraph("NDPA/POPIA compliance, privacy policy generators", styles['TableCell'])],
        [Paragraph("Economic informality", styles['TableCellBold']), Paragraph("Market stall calcs, artisan tools, informal sector tax guides", styles['TableCell'])],
        [Paragraph("Financial illiteracy", styles['TableCellBold']), Paragraph("Budgeting tools, investment explainers, debt calculators", styles['TableCell'])],
        [Paragraph("Regulatory opacity", styles['TableCellBold']), Paragraph("Business registration guides, tax calendars, license checkers", styles['TableCell'])],
        [Paragraph("Infrastructure deficit", styles['TableCellBold']), Paragraph("Solar calculators, water tools, generator cost comparators", styles['TableCell'])],
        [Paragraph("Healthcare access", styles['TableCellBold']), Paragraph("Drug price comparators, hospital cost estimators, disease tools", styles['TableCell'])],
        [Paragraph("Agricultural waste", styles['TableCellBold']), Paragraph("Post-harvest loss calculators, storage tools, commodity trackers", styles['TableCell'])],
        [Paragraph("Trade barriers", styles['TableCellBold']), Paragraph("AfCFTA tools, customs calculators, documentation generators", styles['TableCell'])],
    ]
    story.append(make_simple_table(ddpe, [0.28*W, 0.72*W], HexColor("#C62828")))
    story.append(Spacer(1, 12))

    story.append(Paragraph("Asian Market Inspiration", styles['AdvisoryTitle']))
    asia = [
        [Paragraph("Asian Model", styles['TableHeader']), Paragraph("AfroTools Equivalent", styles['TableHeader'])],
        [Paragraph("India Paytm (bill payments)", styles['TableCellBold']), Paragraph("Bill payment fee comparator per country", styles['TableCell'])],
        [Paragraph("India Kisan (farmer app)", styles['TableCellBold']), Paragraph("Crop + livestock calculators", styles['TableCell'])],
        [Paragraph("Indonesia Gojek (super-app)", styles['TableCellBold']), Paragraph("Multi-tool dashboard (your vault)", styles['TableCell'])],
        [Paragraph("China WeChat (QR payments)", styles['TableCellBold']), Paragraph("QR payment generator", styles['TableCell'])],
        [Paragraph("India PolicyBazaar (insurance)", styles['TableCellBold']), Paragraph("Insurance comparators x54", styles['TableCell'])],
        [Paragraph("India BankBazaar (products)", styles['TableCellBold']), Paragraph("Fixed deposit / loan comparators", styles['TableCell'])],
        [Paragraph("Singapore GrabPay (merchant)", styles['TableCellBold']), Paragraph("POS/merchant fee calculators", styles['TableCell'])],
        [Paragraph("Japan Kakaku (price comparison)", styles['TableCellBold']), Paragraph("Price comparators localized", styles['TableCell'])],
        [Paragraph("India Zerodha (investing)", styles['TableCellBold']), Paragraph("Stock market tools for JSE/NSE/GSE", styles['TableCell'])],
    ]
    story.append(make_simple_table(asia, [0.38*W, 0.62*W], HexColor("#E65100")))
    story.append(PageBreak())

    story.append(Paragraph("Revenue Model for New Tools", styles['AdvisoryTitle']))
    revenue = [
        [Paragraph("Tool Category", styles['TableHeader']), Paragraph("Best Revenue Model", styles['TableHeader'])],
        [Paragraph("Remittance/payment comparators", styles['TableCellBold']), Paragraph("Affiliate (highest RPV)", styles['TableCell'])],
        [Paragraph("Solar/energy tools", styles['TableCellBold']), Paragraph("Affiliate (SolarCity, M-Kopa)", styles['TableCell'])],
        [Paragraph("Insurance comparators", styles['TableCellBold']), Paragraph("Affiliate + Lead gen", styles['TableCell'])],
        [Paragraph("Business registration guides", styles['TableCellBold']), Paragraph("Premium templates", styles['TableCell'])],
        [Paragraph("Legal document generators", styles['TableCellBold']), Paragraph("Freemium (free preview, pay for download)", styles['TableCell'])],
        [Paragraph("Tax calculators x54", styles['TableCellBold']), Paragraph("Freemium + API", styles['TableCell'])],
        [Paragraph("Agriculture tools", styles['TableCellBold']), Paragraph("Ad-supported (low willingness to pay)", styles['TableCell'])],
        [Paragraph("Developer tools", styles['TableCellBold']), Paragraph("Free (traffic -> cross-sell)", styles['TableCell'])],
        [Paragraph("Cultural/religious tools", styles['TableCellBold']), Paragraph("Ad-supported (engagement)", styles['TableCell'])],
    ]
    story.append(make_simple_table(revenue, [0.38*W, 0.62*W], HexColor("#1565C0")))
    story.append(Spacer(1, 16))

    # ── FINAL COUNT ──
    story.append(Paragraph("Final Count Summary", styles['AdvisoryTitle']))
    final = [
        [Paragraph("Source", styles['TableHeader']), Paragraph("Tool Count", styles['TableHeader'])],
        [Paragraph("Templates listed (#1-566)", styles['TableCellBold']), Paragraph("~566 tool templates", styles['TableCell'])],
        [Paragraph("x54 country expansions (Batch 1: 9 templates)", styles['TableCellBold']), Paragraph("486 tools", styles['TableCell'])],
        [Paragraph("x54 country expansions (Batch 2: 13 templates)", styles['TableCellBold']), Paragraph("702 tools", styles['TableCell'])],
        [Paragraph("TOTAL ADDRESSABLE TOOLS", styles['TableCellBold']), Paragraph("1,750+", styles['TableCellBold'])],
        [Paragraph("REALISTIC FIRST 1,000 TARGET", styles['TableCellBold']), Paragraph("Pick 19 x54 templates = 1,026 tools", styles['TableCellBold'])],
    ]
    story.append(make_simple_table(final, [0.55*W, 0.45*W], DARK))
    story.append(Spacer(1, 20))

    story.append(HRFlowable(width="100%", thickness=2, color=PRIMARY))
    story.append(Spacer(1, 10))
    story.append(Paragraph(
        "The fastest path to 1,000 new tools: build 19 country-replicated templates. "
        "Each template is one codebase, deployed 54 times with country-specific data. "
        "That is your moat - no one else has the data for all 54 countries.",
        ParagraphStyle('FinalNote', parent=styles['Normal'], fontSize=11, leading=14, textColor=DARK,
                       fontName='Helvetica-Bold', alignment=TA_CENTER)
    ))
    story.append(Spacer(1, 20))
    story.append(Paragraph(
        f"AfroTools Roadmap | Generated {datetime.now().strftime('%B %d, %Y')} | Confidential",
        ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, textColor=HexColor("#999999"), alignment=TA_CENTER)
    ))

    # ── BUILD ──
    doc.build(story)
    print(f"PDF generated: {filename}")
    return filename


if __name__ == "__main__":
    build_pdf()
