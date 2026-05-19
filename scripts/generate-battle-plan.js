const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel,
  BorderStyle, WidthType, ShadingType, PageNumber, PageBreak, TabStopType, TabStopPosition
} = require('docx');

// ─── Design Tokens ───
const BLUE = '007AFF';
const DARK = '0A1628';
const GOLD = 'F5A623';
const GREEN = '16A34A';
const RED = 'DC2626';
const GRAY = '6B7280';
const LIGHT_BG = 'F0F6FF';
const WHITE = 'FFFFFF';
const BLACK = '111827';

const border = { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0 };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

// Table width for US Letter with 1" margins
const TABLE_W = 9360;

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    children: [new TextRun({ text, bold: true, size: 36, font: 'DM Sans', color: DARK })]
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
    children: [new TextRun({ text, bold: true, size: 28, font: 'DM Sans', color: BLUE })]
  });
}

function heading3(text) {
  return new Paragraph({
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, bold: true, size: 24, font: 'DM Sans', color: DARK })]
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.after || 120, before: opts.before || 0 },
    alignment: opts.align || AlignmentType.LEFT,
    children: [new TextRun({ text, size: 22, font: 'DM Sans', color: opts.color || '374151', bold: opts.bold || false, italics: opts.italic || false })]
  });
}

function richPara(runs, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.after || 120, before: opts.before || 0 },
    alignment: opts.align || AlignmentType.LEFT,
    children: runs.map(r => new TextRun({ size: 22, font: 'DM Sans', color: '374151', ...r }))
  });
}

function spacer(h = 200) {
  return new Paragraph({ spacing: { before: h, after: 0 }, children: [] });
}

function divider() {
  return new Paragraph({
    spacing: { before: 200, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BLUE, space: 8 } },
    children: []
  });
}

// Simple 2-col table
function twoColTable(headers, rows, colWidths) {
  const w1 = colWidths ? colWidths[0] : Math.floor(TABLE_W * 0.5);
  const w2 = colWidths ? colWidths[1] : TABLE_W - w1;
  const headerRow = new TableRow({
    children: headers.map((h, i) => new TableCell({
      borders,
      width: { size: i === 0 ? w1 : w2, type: WidthType.DXA },
      shading: { fill: DARK, type: ShadingType.CLEAR },
      margins: cellMargins,
      children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 20, font: 'DM Sans', color: WHITE })] })]
    }))
  });
  const dataRows = rows.map((row, ri) => new TableRow({
    children: row.map((cell, ci) => new TableCell({
      borders,
      width: { size: ci === 0 ? w1 : w2, type: WidthType.DXA },
      shading: { fill: ri % 2 === 0 ? WHITE : 'F9FAFB', type: ShadingType.CLEAR },
      margins: cellMargins,
      children: [new Paragraph({ children: [new TextRun({ text: cell, size: 20, font: 'DM Sans', color: '374151' })] })]
    }))
  }));
  return new Table({
    width: { size: TABLE_W, type: WidthType.DXA },
    columnWidths: [w1, w2],
    rows: [headerRow, ...dataRows]
  });
}

// 3-col table
function threeColTable(headers, rows, colWidths) {
  const w = colWidths || [3120, 3120, 3120];
  const headerRow = new TableRow({
    children: headers.map((h, i) => new TableCell({
      borders,
      width: { size: w[i], type: WidthType.DXA },
      shading: { fill: DARK, type: ShadingType.CLEAR },
      margins: cellMargins,
      children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 20, font: 'DM Sans', color: WHITE })] })]
    }))
  });
  const dataRows = rows.map((row, ri) => new TableRow({
    children: row.map((cell, ci) => new TableCell({
      borders,
      width: { size: w[ci], type: WidthType.DXA },
      shading: { fill: ri % 2 === 0 ? WHITE : 'F9FAFB', type: ShadingType.CLEAR },
      margins: cellMargins,
      children: [new Paragraph({ children: [new TextRun({ text: String(cell), size: 20, font: 'DM Sans', color: '374151' })] })]
    }))
  }));
  return new Table({
    width: { size: TABLE_W, type: WidthType.DXA },
    columnWidths: w,
    rows: [headerRow, ...dataRows]
  });
}

// 4-col table
function fourColTable(headers, rows, colWidths) {
  const w = colWidths || [2340, 2340, 2340, 2340];
  const headerRow = new TableRow({
    children: headers.map((h, i) => new TableCell({
      borders,
      width: { size: w[i], type: WidthType.DXA },
      shading: { fill: DARK, type: ShadingType.CLEAR },
      margins: cellMargins,
      children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 18, font: 'DM Sans', color: WHITE })] })]
    }))
  });
  const dataRows = rows.map((row, ri) => new TableRow({
    children: row.map((cell, ci) => new TableCell({
      borders,
      width: { size: w[ci], type: WidthType.DXA },
      shading: { fill: ri % 2 === 0 ? WHITE : 'F9FAFB', type: ShadingType.CLEAR },
      margins: cellMargins,
      children: [new Paragraph({ children: [new TextRun({ text: String(cell), size: 18, font: 'DM Sans', color: '374151' })] })]
    }))
  }));
  return new Table({
    width: { size: TABLE_W, type: WidthType.DXA },
    columnWidths: w,
    rows: [headerRow, ...dataRows]
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: 'bullets', level },
    spacing: { after: 60 },
    children: [new TextRun({ text, size: 22, font: 'DM Sans', color: '374151' })]
  });
}

function richBullet(runs) {
  return new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    spacing: { after: 60 },
    children: runs.map(r => new TextRun({ size: 22, font: 'DM Sans', color: '374151', ...r }))
  });
}

function calloutBox(title, text, fill = LIGHT_BG) {
  return new Table({
    width: { size: TABLE_W, type: WidthType.DXA },
    columnWidths: [TABLE_W],
    rows: [new TableRow({
      children: [new TableCell({
        borders: { top: { style: BorderStyle.SINGLE, size: 6, color: BLUE }, bottom: border, left: border, right: border },
        width: { size: TABLE_W, type: WidthType.DXA },
        shading: { fill, type: ShadingType.CLEAR },
        margins: { top: 120, bottom: 120, left: 200, right: 200 },
        children: [
          new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: title, bold: true, size: 22, font: 'DM Sans', color: DARK })] }),
          new Paragraph({ children: [new TextRun({ text, size: 20, font: 'DM Sans', color: '374151' })] })
        ]
      })]
    })]
  });
}

// ═══════════════════════════════════════════════════════
//  BUILD DOCUMENT
// ═══════════════════════════════════════════════════════

const doc = new Document({
  styles: {
    default: { document: { run: { font: 'DM Sans', size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 36, bold: true, font: 'DM Sans', color: DARK },
        paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 28, bold: true, font: 'DM Sans', color: BLUE },
        paragraph: { spacing: { before: 300, after: 150 }, outlineLevel: 1 } },
    ]
  },
  numbering: {
    config: [
      { reference: 'bullets', levels: [
        { level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        { level: 1, format: LevelFormat.BULLET, text: '\u25E6', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
      ]},
      { reference: 'numbers', levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
      ]},
    ]
  },
  sections: [

    // ═══════════════════════════════════════════════════════
    //  COVER PAGE
    // ═══════════════════════════════════════════════════════
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      children: [
        spacer(2000),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'AFROTOOLS', size: 72, bold: true, font: 'DM Sans', color: BLUE })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: '90-DAY BATTLE PLAN', size: 52, bold: true, font: 'DM Sans', color: DARK })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: BLUE, space: 12 } },
          spacing: { before: 200, after: 100 },
          children: [new TextRun({ text: 'From 403 Tools to 10,000 | 100 Pro Tools | 20K Social | 10K Backlinks', size: 24, font: 'DM Sans', color: GRAY })]
        }),
        spacer(400),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'March 20, 2026 \u2014 June 20, 2026', size: 24, font: 'DM Sans', color: GRAY })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100 },
          children: [new TextRun({ text: 'Confidential Strategy Document', size: 20, font: 'DM Sans', color: GRAY, italics: true })]
        }),
        spacer(2000),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400 },
          border: { top: { style: BorderStyle.SINGLE, size: 2, color: 'D1D5DB', space: 12 } },
          children: [new TextRun({ text: 'afrotools.com', size: 22, font: 'DM Sans', color: BLUE, bold: true })]
        }),
      ]
    },

    // ═══════════════════════════════════════════════════════
    //  TABLE OF CONTENTS
    // ═══════════════════════════════════════════════════════
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: 'AfroTools 90-Day Battle Plan', size: 18, font: 'DM Sans', color: GRAY, italics: true })]
          })]
        })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'Page ', size: 18, font: 'DM Sans', color: GRAY }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18, font: 'DM Sans', color: GRAY }),
              new TextRun({ text: ' | Confidential', size: 18, font: 'DM Sans', color: GRAY })
            ]
          })]
        })
      },
      children: [
        new Paragraph({
          spacing: { after: 400 },
          children: [new TextRun({ text: 'TABLE OF CONTENTS', size: 36, bold: true, font: 'DM Sans', color: DARK })]
        }),
        ...[
          ['1.', 'Executive Summary \u2014 Where We Are Today'],
          ['2.', 'Platform Audit \u2014 Complete Technical Inventory'],
          ['3.', 'The 10,000 Free Tools Strategy'],
          ['4.', 'The 100 Pro Tools Revenue Engine'],
          ['5.', 'Pro Gate Activation Plan \u2014 PDF Removal Schedule'],
          ['6.', 'Monetization Architecture \u2014 7 Revenue Streams'],
          ['7.', 'SEO & Backlink Strategy \u2014 Road to 10,000'],
          ['8.', 'Social Media Playbook \u2014 0 to 20,000 Followers'],
          ['9.', 'Language Opportunity \u2014 The Francophone & African Language Gap'],
          ['10.', 'B2B & API Commercialization'],
          ['11.', 'Email & Lead Capture System'],
          ['12.', 'Financial Projections \u2014 Month-by-Month'],
          ['13.', 'Week-by-Week Execution Calendar'],
          ['14.', 'Risk Register & Contingency Plans'],
          ['15.', 'Success Metrics & KPIs'],
        ].map(([num, title]) => new Paragraph({
          spacing: { after: 80 },
          tabStops: [{ type: TabStopType.LEFT, position: 600 }],
          children: [
            new TextRun({ text: num, bold: true, size: 22, font: 'DM Sans', color: BLUE }),
            new TextRun({ text: '\t' + title, size: 22, font: 'DM Sans', color: '374151' }),
          ]
        })),
      ]
    },

    // ═══════════════════════════════════════════════════════
    //  MAIN CONTENT
    // ═══════════════════════════════════════════════════════
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: 'AfroTools 90-Day Battle Plan', size: 18, font: 'DM Sans', color: GRAY, italics: true })]
          })]
        })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'Page ', size: 18, font: 'DM Sans', color: GRAY }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18, font: 'DM Sans', color: GRAY }),
              new TextRun({ text: ' | Confidential', size: 18, font: 'DM Sans', color: GRAY })
            ]
          })]
        })
      },
      children: [

        // ═══════════════════════════════════════
        //  1. EXECUTIVE SUMMARY
        // ═══════════════════════════════════════
        heading1('1. Executive Summary \u2014 Where We Are Today'),
        divider(),

        para('AfroTools launched 10 days ago. In those 10 days, we have built something most funded startups cannot ship in 12 months. This document is the plan to turn that foundation into a dominant platform serving 1.4 billion Africans.'),
        spacer(100),

        heading3('Current Platform Snapshot (Day 10)'),
        threeColTable(
          ['Metric', 'Current', 'Day 90 Target'],
          [
            ['Live Tools', '403', '10,000'],
            ['Pro-Only Tools', '4', '100'],
            ['Blog Posts', '126', '250+'],
            ['Countries Covered', '54', '54'],
            ['French Tools', '28', '100+'],
            ['Embeddable Widgets', '100+', '500+'],
            ['API Endpoints', '18', '25+'],
            ['Backlinks', '10', '5,000+'],
            ['Social Followers', '0', '20,000'],
            ['Monthly Visitors', 'TBD (new)', '50,000+'],
            ['Paying Subscribers', '0', '50\u2013200'],
            ['Monthly Revenue', '$0', '$500\u2013$2,000'],
            ['SEMrush Keywords Tracked', '300+', '1,000+'],
          ],
          [3500, 2930, 2930]
        ),
        spacer(200),

        calloutBox(
          'CORE THESIS',
          '10,000 free tools = 10,000 SEO pages = 10,000 doors into the platform. Each tool targets a specific Google search query. More tools = more organic traffic = more of everything. The free tools are the net. The Pro tools are the catch. Ads, affiliates, and API are the bonus.'
        ),
        spacer(200),

        heading3('What Is Already Built & Working'),
        bullet('403 live tools across 14 categories covering all 54 African nations'),
        bullet('54 PAYE calculators with real tax engines (PITA, NTA, progressive bands per country)'),
        bullet('126 SEO-optimized blog posts (2,000\u20132,700 words each, FAQ schema, internal tool links)'),
        bullet('Complete widget/embed system with 100+ embeddable widgets, IntersectionObserver lazy loading'),
        bullet('Pro gate infrastructure built (pro-gate.js, pro-only/free-only CSS classes, upsell components)'),
        bullet('Payment system: Paystack live (multi-currency: USD, NGN, KES, ZAR, GHS), Stripe fallback ready'),
        bullet('AI Advisor: Claude API integration with rate limiting (3/day free, unlimited Pro)'),
        bullet('18 API endpoints: tax, forex, fuel, rates, VAT, salary benchmarks, countries, crypto, alerts, favorites, history, scholarships'),
        bullet('API key management system with tiered rate limits (free/starter/pro/enterprise)'),
        bullet('User auth: Supabase Auth + Google OAuth + email/password + proxy for ISP-blocked regions'),
        bullet('Dashboard: profile, calculation history, favorites, saved tools'),
        bullet('PDF export web component with email gating and lead capture'),
        bullet('7 scheduled functions: forex (15min), fuel (6h), crypto (5min), rates (12h), scholarships (daily), digest (monthly)'),
        bullet('9 web components: navbar, footer, pdf-export, email-gate, share-button, related-tools, tool-registry, site-assistant'),
        bullet('French content: 14 countries with PAYE + TVA calculators, 8 French blog posts'),
        bullet('Admin dashboard with tool registry audit and phase tracking'),
        bullet('Complete SEO: sitemap.xml, robots.txt, canonical URLs, OG tags, Schema.org (Article + FAQ + Breadcrumb)'),
        bullet('GA4 analytics configured across all pages'),
        bullet('Netlify security headers: HSTS, CSP, X-Frame-Options, Permissions-Policy'),
        bullet('SEMrush tracking 300+ keywords'),
        bullet('Submitted to majority of free directories (backlinks in progress)'),

        spacer(200),
        heading3('What Is Built But Not Yet Activated'),
        bullet('Pro gate system: exists in code but only 4 tools are gated. Will expand to 100 exclusive Pro tools.'),
        bullet('PDF download on free tools: currently available on most tools. Will be systematically removed over 90 days.'),
        bullet('Stripe payment: server-side code complete, needs STRIPE_SECRET_KEY env var + registration'),
        bullet('Email notifications: Resend API integrated for monthly digest, needs subscription list to grow'),
        bullet('API gateway: now functional with real tax/forex engines (was beta stub, fixed today)'),

        new Paragraph({ children: [new PageBreak()] }),

        // ═══════════════════════════════════════
        //  2. PLATFORM AUDIT
        // ═══════════════════════════════════════
        heading1('2. Platform Audit \u2014 Complete Technical Inventory'),
        divider(),

        heading3('Tools by Category'),
        threeColTable(
          ['Category', 'Live Tools', 'Revenue Model'],
          [
            ['Salary & Tax (Financial)', '178', 'Freemium + API'],
            ['Document & PDF', '30', 'Premium PDF + Ads'],
            ['Developer Tools', '26', 'Freemium + API'],
            ['Uniquely African', '26', 'Affiliate + Ads'],
            ['Education (FREE FOREVER)', '24', 'Ads + Affiliate'],
            ['Image & Design', '19', 'Freemium + Ads'],
            ['Health & Agriculture (FREE FOREVER)', '19', 'Ads + Affiliate'],
            ['Mortgage & Property', '16', 'Lead Gen + Affiliate'],
            ['Engineering & CAD', '16', 'Premium + Ads'],
            ['Crypto & Web3', '15', 'Affiliate + Ads'],
            ['Business & ROI', '13', 'Freemium + Premium'],
            ['Language & Translation', '11', 'AI Premium + Ads'],
            ['VAT & Business Tax', '8', 'API + Freemium'],
            ['Agriculture', '2', 'Affiliate + Ads'],
            ['TOTAL', '403', 'Mixed'],
          ],
          [3500, 2430, 3430]
        ),
        spacer(200),

        heading3('Tool Tier Distribution'),
        twoColTable(
          ['Tier', 'Count'],
          [
            ['T1 (Premium/High Priority)', '122'],
            ['T2 (Standard)', '178'],
            ['T3 (Utility/Lower Priority)', '103'],
          ],
          [6000, 3360]
        ),
        spacer(200),

        heading3('Revenue Model Distribution'),
        twoColTable(
          ['Revenue Model', 'Tools'],
          [
            ['Freemium (free base + paid features)', '172'],
            ['Free (ad-supported)', '72'],
            ['Premium PDF (gate exports)', '70'],
            ['Affiliate services', '28'],
            ['Ad-supported only', '10'],
            ['Premium templates', '5'],
            ['Other (API, premium export, etc.)', '46'],
          ],
          [6000, 3360]
        ),
        spacer(200),

        heading3('Backend Infrastructure'),
        twoColTable(
          ['Component', 'Details'],
          [
            ['Netlify Functions', '97 total (API, scheduled, auth, business logic, tools, shared)'],
            ['Supabase Instances', '2 (Auth: zpclagtgczsygrgztlts, Data: jbmhfpkzbgyeodsqhprx)'],
            ['PAYE Engines', '54 countries with progressive/cumulative band calculations'],
            ['VAT Database', '54 countries with rates, exemptions, authorities'],
            ['Scheduled Jobs', '7 (forex 15min, fuel 6h, crypto 5min, rates 12h, scholarships daily)'],
            ['Data Store', 'Netlify Blobs + Supabase PostgreSQL + static JSON fallback'],
            ['API Key System', 'Netlify Blobs KV store, 4-tier rate limiting, usage tracking'],
            ['Test Suite', '7 test files (NG, KE, GH, ZA, EG, TZ PAYE engines)'],
            ['CSS Files', '26 files, 8,550 lines, design system with tokens'],
            ['Image Assets', '380 tool icons (SVG)'],
          ],
          [3500, 5860]
        ),

        new Paragraph({ children: [new PageBreak()] }),

        // ═══════════════════════════════════════
        //  3. THE 10,000 FREE TOOLS STRATEGY
        // ═══════════════════════════════════════
        heading1('3. The 10,000 Free Tools Strategy'),
        divider(),

        para('This is the single most important initiative. 10,000 tools = 10,000 indexed pages = 10,000 long-tail keyword targets. This is how we win organic traffic without spending a single dollar on ads.'),
        spacer(100),

        heading3('Build Rate Required'),
        threeColTable(
          ['Period', 'Tools to Build', 'Daily Rate'],
          [
            ['Month 1 (Day 1\u201330)', '403 \u2192 2,000 (+1,597)', '~53/day'],
            ['Month 2 (Day 31\u201360)', '2,000 \u2192 5,000 (+3,000)', '~100/day'],
            ['Month 3 (Day 61\u201390)', '5,000 \u2192 10,000 (+5,000)', '~167/day'],
          ],
          [3000, 3680, 2680]
        ),
        spacer(100),

        para('This is aggressive but achievable if tools are templatized. Many tool categories follow identical patterns (input form \u2192 calculation \u2192 result display \u2192 PDF export). Build one template, generate hundreds.'),
        spacer(100),

        heading3('Tool Expansion Categories (Where the 9,597 New Tools Come From)'),
        fourColTable(
          ['Category', 'Current', 'Target', 'Strategy'],
          [
            ['Country-specific calculators', '~200', '2,000+', 'Every calculator x 54 countries'],
            ['Currency converters', '~10', '500+', 'Every African currency pair'],
            ['Unit converters', '~10', '300+', 'Every unit type (length, weight, temp, etc.)'],
            ['Document generators', '~30', '500+', 'Invoice, receipt, contract, letter templates'],
            ['Image tools', '~19', '300+', 'Resize, convert, compress for every format'],
            ['Developer utilities', '~26', '400+', 'Encoders, decoders, validators, formatters'],
            ['Financial calculators', '~50', '1,000+', 'Loan, investment, savings, comparison tools'],
            ['Health calculators', '~19', '300+', 'BMI by country, drug dosage, diet planners'],
            ['Education tools', '~24', '400+', 'GPA per university system, exam prep'],
            ['Business tools', '~13', '500+', 'ROI, pricing, break-even, valuation'],
            ['Crypto tools', '~15', '200+', 'Converters, tax, DCA, staking per token'],
            ['Language tools', '~11', '200+', 'Translators, dictionaries per language pair'],
            ['Legal/compliance', '~10', '300+', 'Stamp duty, import duty per country'],
            ['Niche African', '~26', '500+', 'Market days, naming, cultural calculators'],
            ['Misc utilities', '~50', '2,000+', 'Date, time, text, number, random tools'],
          ],
          [2200, 1700, 1960, 3500]
        ),
        spacer(200),

        heading3('Templatization Strategy'),
        para('The key to hitting 10,000 is NOT building 10,000 unique tools. It is building 50\u2013100 tool TEMPLATES that can be instantiated across countries, currencies, units, and variations.'),
        spacer(50),
        bullet('Template 1: Country Calculator \u2014 One input form, swap tax rules per country. 54 countries x 5 tax types = 270 tools from one template.'),
        bullet('Template 2: Currency Converter \u2014 One conversion engine, every pair of 54 African currencies + USD/EUR/GBP = 500+ tools.'),
        bullet('Template 3: Unit Converter \u2014 Length, weight, volume, temperature, speed, area, digital. Each with 20+ unit pairs = 300+ tools.'),
        bullet('Template 4: Document Generator \u2014 Invoice, receipt, contract, letter. Each localized per country = 200+ tools.'),
        bullet('Template 5: Image Tool \u2014 Compress, resize, crop, convert. Each for PNG/JPG/WebP/SVG = 100+ tools.'),
        spacer(100),
        calloutBox(
          'QUALITY STANDARD',
          'Every tool, no matter how simple, must: (1) Have proper meta tags and OG data for SEO, (2) Include the AI Advisor panel, (3) Have the share button component, (4) Track usage in GA4, (5) Be mobile-responsive, (6) Load in under 2 seconds. Quality at scale, not quantity without quality.'
        ),

        new Paragraph({ children: [new PageBreak()] }),

        // ═══════════════════════════════════════
        //  4. THE 100 PRO TOOLS
        // ═══════════════════════════════════════
        heading1('4. The 100 Pro Tools Revenue Engine'),
        divider(),

        para('These are NOT gated versions of free tools. These are 100 EXCLUSIVE tools that only Pro subscribers can access. Each one is designed to replace a service that professionals currently pay $20\u2013200/month for.'),
        spacer(100),

        heading3('Why Exclusive Pro Tools > Gating Free Features'),
        bullet('No bait-and-switch: free tools stay free forever. Pro is additional value, not removed value.'),
        bullet('100 different fishing hooks: each Pro tool targets a different professional persona.'),
        bullet('Higher perceived value: exclusive tools justify $5/mo far better than "remove watermark."'),
        bullet('Stickier retention: users subscribe because they USE the tools daily, not because they are annoyed.'),
        spacer(100),

        heading3('Pro Tool Build Schedule'),
        threeColTable(
          ['Period', 'Pro Tools', 'Focus'],
          [
            ['Month 1 (Week 1\u20132)', '10', 'Highest ROI: Invoice, Receipt, Payroll, CV, Expense Tracker'],
            ['Month 1 (Week 3\u20134)', '10', 'Business: Quotation, Contract, Farm Profit, Construction Cost, Salary Report'],
            ['Month 2 (Week 5\u20138)', '40', 'Full business suite + career tools + niche African'],
            ['Month 3 (Week 9\u201312)', '40', 'Dev tools + specialized/niche + remaining from master list'],
          ],
          [3000, 2000, 4360]
        ),
        spacer(200),

        heading3('Pro Tools by Target Customer (Full List)'),
        spacer(50),
        richPara([{ text: 'SMALL BUSINESS OWNERS ', bold: true, color: BLUE }, { text: '(40 tools) \u2014 Largest market in Africa' }]),
        bullet('Invoice Generator \u2014 Branded invoices with logo, auto-numbering, payment tracking'),
        bullet('Receipt Generator \u2014 Professional receipts with QR codes'),
        bullet('Payroll Generator \u2014 Bulk PAYE + pension + NHIS per employee, export payslip PDFs'),
        bullet('Quotation Generator \u2014 Professional quotes with terms & conditions'),
        bullet('Contract Generator \u2014 Employment, freelance, NDA templates per country law'),
        bullet('Business Expense Tracker \u2014 Categorized spending with tax-deductible flags'),
        bullet('Cash Flow Forecaster \u2014 AI predicts next 6 months from your inputs'),
        bullet('Profit & Loss Statement Builder \u2014 Monthly P&L exportable to PDF'),
        bullet('Inventory Manager \u2014 Track stock, set reorder alerts'),
        bullet('Customer Database \u2014 Simple CRM with purchase history'),
        bullet('Bulk PAYE Calculator \u2014 Upload 500 employees CSV, get all taxes back'),
        bullet('Multi-Country Payroll \u2014 Employees in 5 countries, all taxes calculated'),
        bullet('Financial Ratio Dashboard \u2014 20+ ratios with industry benchmarks'),
        bullet('Tax Calendar \u2014 Country-specific filing deadlines with reminders'),
        bullet('Business Health Score \u2014 AI analyzes numbers, gives score + recommendations'),
        bullet('Import Duty Calculator Pro \u2014 Full HS code lookup per country'),
        bullet('Daily Sales Logger \u2014 POS-style daily tracking with summaries'),
        bullet('Petty Cash Manager, Commission Calculator, Markup Tool Pro, Working Capital Analyzer'),
        bullet('+ 20 more business tools (see master spreadsheet)'),
        spacer(100),

        richPara([{ text: 'PROFESSIONALS & CAREER PEOPLE ', bold: true, color: BLUE }, { text: '(25 tools)' }]),
        bullet('Salary Negotiation Report \u2014 AI generates negotiation script from market data'),
        bullet('Net Worth Tracker \u2014 Assets, liabilities, monthly tracking, growth charts'),
        bullet('Investment Portfolio Analyzer \u2014 Allocation, risk score, rebalancing suggestions'),
        bullet('Retirement Calculator Pro \u2014 Country-specific pension + private savings projection'),
        bullet('Tax Optimization Report \u2014 AI finds legal ways to reduce tax per country'),
        bullet('CV/Resume Builder \u2014 Templates optimized for African + international markets'),
        bullet('FIRE Calculator \u2014 Financial Independence with African cost-of-living data'),
        bullet('Freelance Rate Calculator \u2014 What to charge based on expenses + taxes'),
        bullet('Multiple Income Stream Dashboard \u2014 Track salary + freelance + investments + rental'),
        bullet('Wedding Budget Planner \u2014 Country-specific (Nigerian wedding \u2260 Kenyan wedding)'),
        bullet('Child Education Fund Planner \u2014 Birth to university, inflation-adjusted'),
        bullet('+ 14 more professional tools'),
        spacer(100),

        richPara([{ text: 'DEVELOPERS & TECH ', bold: true, color: BLUE }, { text: '(15 tools)' }]),
        bullet('API Load Tester, Database Schema Designer, Regex Builder Pro, JSON Mocker'),
        bullet('Cron Builder Pro, Color Palette Generator Pro, SEO Audit Tool'),
        bullet('Webhook Tester, JWT Decoder Pro, SSL Checker, DNS Lookup Pro'),
        bullet('Code Snippet Manager, Performance Budget Calculator, Responsive Screenshot Tool'),
        spacer(100),

        richPara([{ text: 'SPECIALIZED/NICHE ', bold: true, color: BLUE }, { text: '(20 tools)' }]),
        bullet('Poultry Farm Calculator, Fish Farm Calculator \u2014 Full cycle costing'),
        bullet('Restaurant Menu Pricer Pro \u2014 Food cost %, margin targets'),
        bullet('Construction Cost Estimator Pro \u2014 Bill of quantities with material prices'),
        bullet('NGO Grant Budget Builder \u2014 Donor-formatted budgets (UN, EU, USAID templates)'),
        bullet('Church/Mosque Finance Manager \u2014 Tithe/offering tracking'),
        bullet('Rental Property Manager \u2014 Multiple properties, tenant tracking'),
        bullet('Market Trader Daily Logger \u2014 Buy/sell tracking for market women/men'),
        bullet('Tontine/Njangi Manager \u2014 West/Central African savings group format'),
        bullet('+ 12 more specialized tools'),

        spacer(200),
        heading3('Pro Revenue Math'),
        threeColTable(
          ['Scenario', 'Subscribers', 'Monthly Revenue'],
          [
            ['Conservative (Month 3)', '100 Pro tools x 0.5 subs each = 50', '$250/mo'],
            ['Moderate (Month 6)', '100 Pro tools x 5 subs each = 500', '$2,500/mo'],
            ['Optimistic (Month 12)', '100 Pro tools x 20 subs each = 2,000', '$10,000/mo'],
            ['Scale (Month 18)', '100 Pro tools x 50 subs each = 5,000', '$25,000/mo'],
          ],
          [4000, 3360, 2000]
        ),

        new Paragraph({ children: [new PageBreak()] }),

        // ═══════════════════════════════════════
        //  5. PRO GATE ACTIVATION
        // ═══════════════════════════════════════
        heading1('5. Pro Gate Activation \u2014 PDF Removal Schedule'),
        divider(),

        para('Currently, most free tools have PDF download. This is a generous feature that reduces upgrade motivation. The plan is to slowly remove PDF from free tools over 90 days, replacing it with watermarked PDF (free) vs. clean PDF (Pro).'),
        spacer(100),

        heading3('Current Pro Gate State'),
        twoColTable(
          ['Component', 'Status'],
          [
            ['pro-gate.js', 'Built and deployed. isPro() checks Supabase subscriptions table.'],
            ['Pro-only CSS classes', 'Working. .pro-only and .free-only toggle visibility.'],
            ['PDF watermark gate', 'Built. gatePdfExport() returns true (clean) or false (watermarked).'],
            ['AI Advisor gate', 'Built. gateAiAdvisor() checks daily limit (3 free, unlimited Pro).'],
            ['History gate', 'Built. gateHistory() truncates to 5 for free users.'],
            ['Upsell components', 'Built. showProUpsell() inserts inline CTAs. injectUpsell() adds banner before footer.'],
            ['Paystack checkout', 'Working. Multi-currency (USD, NGN, KES, ZAR, GHS).'],
            ['Stripe checkout', 'Server-side ready. Falls back to Paystack when not configured.'],
            ['/pro/ page', 'Complete. FAQ, pricing cards, currency selector, checkout flow.'],
            ['/pro/success/ page', 'Complete. Clears pro cache, shows unlocked features.'],
            ['Subscriptions table', 'NEEDS VERIFICATION in Supabase. Required for Pro status checks.'],
          ],
          [3500, 5860]
        ),
        spacer(200),

        heading3('PDF Removal Schedule'),
        fourColTable(
          ['Week', 'Action', 'Tools Affected', 'User Impact'],
          [
            ['Week 1\u20132', 'Add watermark to all free PDF exports', 'All 403 tools', 'Low \u2014 PDF still works, just branded'],
            ['Week 3\u20134', 'Remove PDF from T3 (utility) tools', '103 tools', 'Low \u2014 these are simple tools'],
            ['Week 5\u20136', 'Remove PDF from T2 (standard) tools', '178 tools', 'Medium \u2014 show upsell CTA'],
            ['Week 7\u20138', 'Remove PDF from T1 (premium) tools', '122 tools', 'High \u2014 strong conversion driver'],
            ['Week 9\u201312', 'PDF only available on Pro', 'All tools', 'Pro becomes essential for pros'],
          ],
          [1800, 3200, 2200, 2160]
        ),
        spacer(200),

        heading3('Activation Checklist (Prerequisites)'),
        bullet('Verify subscriptions table exists in Supabase data instance with columns: user_id, status, expires_at, plan, provider, payment_reference'),
        bullet('Complete CAC registration \u2192 activate Paystack live keys'),
        bullet('Set PAYSTACK_SECRET_KEY in Netlify environment variables'),
        bullet('Test end-to-end: signup \u2192 Paystack checkout \u2192 webhook fires \u2192 user_profiles updated \u2192 isPro() returns true'),
        bullet('Optionally: register Stripe \u2192 set STRIPE_SECRET_KEY \u2192 international users can pay'),
        bullet('Add Pro badge to navbar for Pro users (already in supabase-auth.js line 388)'),

        new Paragraph({ children: [new PageBreak()] }),

        // ═══════════════════════════════════════
        //  6. MONETIZATION ARCHITECTURE
        // ═══════════════════════════════════════
        heading1('6. Monetization Architecture \u2014 7 Revenue Streams'),
        divider(),

        para('Never depend on one revenue stream. AfroTools will generate income from 7 distinct sources, each scaling independently.'),
        spacer(100),

        heading3('Revenue Stream 1: Pro Subscriptions'),
        twoColTable(
          ['Detail', 'Value'],
          [
            ['Monthly price', '$5/mo (NGN 4,000, KES 750, ZAR 89, GHS 50)'],
            ['Annual price', '$30/yr (50% discount)'],
            ['What Pro gets', '100 exclusive tools + clean PDF + unlimited AI + unlimited history + API access'],
            ['Target Month 3', '50\u2013200 subscribers = $250\u2013$1,000/mo'],
            ['Target Month 12', '2,000 subscribers = $10,000/mo'],
            ['Payment providers', 'Paystack (live) + Stripe (when registered)'],
          ],
          [3500, 5860]
        ),
        spacer(200),

        heading3('Revenue Stream 2: Display Ads (Google AdSense)'),
        para('Finance/business tools have the highest ad CPM rates because advertisers (banks, fintech, insurance) pay premium to reach people doing financial calculations.'),
        bullet('Action: Apply for Google AdSense THIS WEEK. Takes 24\u201348 hours to approve.'),
        bullet('Placement: One ad unit per tool page (below results, above footer).'),
        bullet('Expected CPM: $0.50\u2013$2 for African traffic, $2\u2013$8 for Western traffic.'),
        bullet('Revenue at 100K pageviews/mo: $100\u2013$400/mo'),
        bullet('Revenue at 1M pageviews/mo: $1,000\u2013$4,000/mo'),
        spacer(200),

        heading3('Revenue Stream 3: Affiliate Links'),
        para('Your tools put users at the EXACT moment they need a product. That moment is worth gold.'),
        threeColTable(
          ['Your Tool', 'Affiliate Link', 'Commission'],
          [
            ['Scholarship Matcher', 'IELTS prep courses (British Council, Magoosh)', '$5\u201320 per signup'],
            ['Salary Benchmarks', 'Job boards (Jobberman, LinkedIn Premium)', '$2\u201310 per signup'],
            ['Budget Planner', 'Savings apps (PiggyVest, Cowrywise)', '$1\u20135 per referral'],
            ['Mortgage Calculator', 'Bank pre-approval links', '$10\u201350 per lead'],
            ['Crypto tools', 'Exchanges (Luno, Binance, Quidax)', '$10\u201350 per signup'],
            ['Business Plan Generator', 'Legal registration services', '$5\u201320 per referral'],
            ['PAYE Calculator', 'Tax filing services', '$5\u201315 per signup'],
            ['CV Builder (Pro)', 'Job search platforms', '$2\u201310 per signup'],
          ],
          [3000, 3680, 2680]
        ),
        bullet('Target: $200\u2013$500/mo by Month 3, growing to $2,000+/mo by Month 12.'),
        spacer(200),

        heading3('Revenue Stream 4: API Access (B2B)'),
        para('Other companies pay to use your calculation engines in their own apps. You have already built the infrastructure.'),
        threeColTable(
          ['Tier', 'Rate Limit', 'Price'],
          [
            ['Free', '100 calls/day, 3,000/month', '$0'],
            ['Starter', '10,000 calls/day', '$29/mo'],
            ['Pro', '100,000 calls/day', '$99/mo'],
            ['Enterprise', 'Unlimited', 'Custom'],
          ],
          [3000, 3680, 2680]
        ),
        bullet('Target: 10\u201350 paying API customers by Month 12 = $290\u2013$4,950/mo'),
        spacer(200),

        heading3('Revenue Stream 5: Lead Generation'),
        bullet('Mortgage calculator user \u2192 "Get quotes from 3 banks" \u2192 sell lead to bank ($10\u201325/lead)'),
        bullet('Insurance calculator user \u2192 "Compare plans" \u2192 sell lead to insurer ($5\u201315/lead)'),
        bullet('Business plan user \u2192 "Need funding?" \u2192 sell lead to lender ($10\u201350/lead)'),
        bullet('Target: 50\u2013200 leads/mo by Month 6 = $500\u2013$2,000/mo'),
        spacer(200),

        heading3('Revenue Stream 6: Sponsored Tools'),
        bullet('"PAYE Calculator \u2014 powered by [Paystack]" or "Crypto Converter \u2014 brought to you by Luno"'),
        bullet('Price: $200\u2013$2,000/month per sponsored tool depending on traffic'),
        bullet('Requires 100K+ monthly visitors. Kicks in Month 6\u201312.'),
        spacer(200),

        heading3('Revenue Stream 7: Data & Insights (Long-term)'),
        bullet('Anonymized aggregate data on what Africans search, calculate, and care about financially.'),
        bullet('Valuable to: banks expanding in Africa, fintech companies, NGOs, investors, governments.'),
        bullet('Revenue potential: $2,000\u2013$10,000/mo once you have 500K+ monthly users.'),

        spacer(200),
        heading3('Combined Revenue Projection'),
        fourColTable(
          ['Revenue Stream', 'Month 3', 'Month 6', 'Month 12'],
          [
            ['Pro Subscriptions', '$250\u2013$1,000', '$2,500\u2013$5,000', '$10,000\u2013$25,000'],
            ['Display Ads', '$50\u2013$200', '$200\u2013$800', '$1,000\u2013$4,000'],
            ['Affiliate Links', '$200\u2013$500', '$500\u2013$1,500', '$2,000\u2013$5,000'],
            ['API Access', '$0', '$100\u2013$500', '$500\u2013$5,000'],
            ['Lead Generation', '$0', '$200\u2013$1,000', '$500\u2013$2,000'],
            ['Sponsored Tools', '$0', '$0\u2013$500', '$1,000\u2013$4,000'],
            ['Data & Insights', '$0', '$0', '$0\u2013$2,000'],
            ['TOTAL', '$500\u2013$1,700', '$3,500\u2013$9,300', '$15,000\u2013$47,000'],
          ],
          [2400, 2320, 2320, 2320]
        ),

        new Paragraph({ children: [new PageBreak()] }),

        // ═══════════════════════════════════════
        //  7. SEO & BACKLINKS
        // ═══════════════════════════════════════
        heading1('7. SEO & Backlink Strategy \u2014 Road to 10,000'),
        divider(),

        heading3('Current SEO Position'),
        twoColTable(
          ['Metric', 'Status'],
          [
            ['Backlinks', '10 (just submitted to directories)'],
            ['SEMrush keywords tracked', '300+'],
            ['Indexed pages (est.)', '~500 (tools + blog + countries)'],
            ['Target indexed pages by Day 90', '10,000+'],
            ['Schema markup', 'Article + FAQ + Breadcrumb on all blog posts'],
            ['Sitemap', 'Auto-generated, daily updates for homepage'],
            ['Technical SEO', 'Canonical URLs, meta descriptions, OG tags on all pages'],
          ],
          [4000, 5360]
        ),
        spacer(200),

        heading3('Backlink Acquisition Strategy'),
        spacer(50),
        richPara([{ text: 'SOURCE 1: Tool Directory Submissions ', bold: true, color: BLUE }, { text: '(Target: 200\u2013300 links)' }]),
        para('Already submitted to majority of free directories. These take 2\u20138 weeks to process.'),
        bullet('Product Hunt launch \u2014 plan for Week 4\u20135 when we hit 2,000+ tools'),
        bullet('AlternativeTo, BetaList, SaaSHub, Startup Stash, Launching Next'),
        bullet('African tech blogs: TechCabal, Techpoint Africa, Disrupt Africa, Ventures Africa'),
        bullet('Expected: 100\u2013300 links in Month 1\u20132'),
        spacer(100),

        richPara([{ text: 'SOURCE 2: Embeddable Widgets ', bold: true, color: BLUE }, { text: '(Target: 500\u20131,000 links)' }]),
        para('We already have 100+ embeddable widgets built. Every embed = a "Powered by AfroTools" backlink.'),
        bullet('Create /embed/ landing page showing all available widgets with embed codes'),
        bullet('Reach out to: HR blogs (PAYE widgets), finance blogs (budget widgets), crypto blogs (converter widgets)'),
        bullet('Each embed is a natural, high-quality backlink Google loves'),
        bullet('Expected: 200\u2013500 by Month 3, 1,000+ by Month 6'),
        spacer(100),

        richPara([{ text: 'SOURCE 3: "Best Tools" Roundup Articles ', bold: true, color: BLUE }, { text: '(Target: 500\u20132,000 links)' }]),
        para('With 10,000 tools, every "Best free calculator for X" article will find us.'),
        bullet('"Best free PAYE calculator Nigeria" \u2192 links to us'),
        bullet('"Top 10 African recipe websites" \u2192 links to AfroKitchen'),
        bullet('"Free invoice generators for small business" \u2192 links to our Pro tool'),
        bullet('Expected: 1\u20133 natural backlinks per tool over time = 10,000\u201330,000 eventually'),
        spacer(100),

        richPara([{ text: 'SOURCE 4: University & Resource Pages ', bold: true, color: BLUE }, { text: '(Target: 15\u201330 high-authority links)' }]),
        bullet('Email 10 universities per week: "We built a free scholarship matcher backed by verified official sources"'),
        bullet('Target .edu and .gov sites \u2014 one link from these = worth 100 Fiverr links'),
        bullet('Expected: 5\u201310 per month = 15\u201330 in 3 months'),
        spacer(100),

        richPara([{ text: 'SOURCE 5: Country Economic Data Pages ', bold: true, color: BLUE }, { text: '(Target: 2,700\u201310,800 links)' }]),
        para('Build 54 country data dashboards: average salary, tax rates, inflation, cost of living, minimum wage, currency performance. These become THE definitive reference pages for African economic data.'),
        bullet('Wikipedia editors, academic papers, news articles will cite these'),
        bullet('54 pages x 50\u2013200 citations each = 2,700\u201310,800 backlinks over 12 months'),
        spacer(100),

        richPara([{ text: 'SOURCE 6: Blog Content Citations ', bold: true, color: BLUE }, { text: '(Target: 50\u2013200 links)' }]),
        para('126 blog posts with African salary data, tax rates, crypto stats. When journalists write about African economics, they cite data sources.'),
        bullet('"According to AfroTools, the average salary in Nigeria is..." = backlink'),
        spacer(200),

        heading3('Realistic Backlink Timeline'),
        fourColTable(
          ['Source', 'Month 1', 'Month 3', 'Month 12'],
          [
            ['Directories', '100\u2013200', '200\u2013300', '300'],
            ['Embeds', '50\u2013100', '200\u2013500', '1,000+'],
            ['Roundup articles', '10\u201350', '200\u2013500', '2,000\u20135,000'],
            ['University/resource', '5\u201310', '15\u201330', '50\u2013100'],
            ['Data citations', '10\u201320', '50\u2013100', '500\u20131,000'],
            ['Country dashboards', '0', '100\u2013500', '2,700\u201310,000'],
            ['TOTAL', '175\u2013380', '765\u20131,930', '6,550\u201317,400'],
          ],
          [2400, 2320, 2320, 2320]
        ),
        spacer(100),
        calloutBox(
          'HONEST ASSESSMENT',
          '10,000 backlinks in 90 days is extremely ambitious. Realistic 90-day target: 1,000\u20132,000 backlinks. But with 10,000 indexed pages, the natural backlink velocity will accelerate dramatically in months 4\u201312. The compound effect is real.'
        ),

        new Paragraph({ children: [new PageBreak()] }),

        // ═══════════════════════════════════════
        //  8. SOCIAL MEDIA PLAYBOOK
        // ═══════════════════════════════════════
        heading1('8. Social Media Playbook \u2014 0 to 20,000 Followers'),
        divider(),

        para('The strategy: become Africa\u2019s financial facts account. Do NOT post "check out our tool." Post the OUTPUT of the tools as content. Surprising data = engagement = followers.'),
        spacer(100),

        heading3('Platform Targets'),
        fourColTable(
          ['Platform', 'Target Followers', 'Post Frequency', 'Content Type'],
          [
            ['Twitter/X', '8,000', '3\u20135x/day', 'Stats, threads, salary reveals, country comparisons'],
            ['LinkedIn', '5,000', '1\u20132x/day', 'Salary transparency, tax tips, entrepreneur stories'],
            ['TikTok/Reels', '5,000', '1x/day', 'Screen recordings of tools, surprising numbers'],
            ['Facebook', '2,000', '5x/day in groups', 'Answer questions with tool links in 50+ groups'],
          ],
          [2000, 2200, 2200, 2960]
        ),
        spacer(200),

        heading3('Content Templates That Go Viral in Africa'),
        spacer(50),
        richPara([{ text: 'THE REVEAL: ', bold: true, color: BLUE }, { text: '"If you earn N500,000/month in Lagos, here\u2019s what you ACTUALLY take home: Gross: N500,000 | PAYE: -N52,567 | Pension: -N40,000 | NHIS: -N25,000 | Net: N382,433. Most Nigerians don\u2019t know this. Save this. Calculate yours free \u2192 afrotools.com/ng-paye"' }]),
        spacer(50),
        richPara([{ text: 'THE VERSUS: ', bold: true, color: BLUE }, { text: '"Lagos vs Nairobi vs Cape Town. Which city actually pays software developers more? Let\u2019s settle this with data."' }]),
        spacer(50),
        richPara([{ text: 'THE JOLLOF BAIT: ', bold: true, color: BLUE }, { text: '"We calculated the exact cost of cooking jollof rice in every African country. Nigeria will be angry about #1."' }]),
        spacer(50),
        richPara([{ text: 'THE SCHOLARSHIP DROP: ', bold: true, color: BLUE }, { text: '"5 scholarships worth over $200,000 that close this month. Most Africans don\u2019t know these exist. Thread..."' }]),
        spacer(50),
        richPara([{ text: 'THE BUILD IN PUBLIC: ', bold: true, color: BLUE }, { text: '"Day 30 of building 10,000 free tools for Africa. Today we hit [MILESTONE]. Here\u2019s what nobody tells you about building for the African market..."' }]),
        spacer(200),

        heading3('30-Day Kickstart Plan'),
        fourColTable(
          ['Day', 'Action', 'Time', 'Expected Result'],
          [
            ['Day 1', 'Create accounts: @afrotools on Twitter, LinkedIn, TikTok, Instagram', '30 min', 'Accounts live'],
            ['Day 2', 'Write bio + pin: "10,000 free tools for 1.4 billion Africans"', '20 min', 'Profiles complete'],
            ['Day 3\u20134', 'Create 20 "salary reveal" posts from existing PAYE data', '2 hours', 'Content bank ready'],
            ['Day 5\u20136', 'Create 10 "country comparison" graphics in Canva', '2 hours', 'Visual content ready'],
            ['Day 7', 'Post launch thread on Twitter + LinkedIn', '1 hour', '200\u2013500 followers'],
            ['Day 8\u201314', 'Post 3x/day Twitter, 1x/day LinkedIn, 1x/day TikTok', '1 hr/day', '1,500\u20132,000 total'],
            ['Day 15\u201330', 'Continue posting + join 50 Facebook groups + engage', '1 hr/day', '3,000\u20134,000 total'],
          ],
          [1500, 3800, 1560, 2500]
        ),
        spacer(100),

        heading3('Growth Projection'),
        fourColTable(
          ['Week', 'Twitter', 'LinkedIn', 'TikTok + IG + FB'],
          [
            ['Week 1', '200', '100', '150'],
            ['Week 4', '1,500', '800', '1,000'],
            ['Week 8', '4,000', '2,500', '3,200'],
            ['Week 12', '8,000', '5,000', '7,000'],
            ['TOTAL Week 12', '', '', '20,000'],
          ],
          [2340, 2340, 2340, 2340]
        ),

        new Paragraph({ children: [new PageBreak()] }),

        // ═══════════════════════════════════════
        //  9. LANGUAGE OPPORTUNITY
        // ═══════════════════════════════════════
        heading1('9. Language Opportunity \u2014 The Francophone & African Language Gap'),
        divider(),

        calloutBox(
          'THE OPPORTUNITY NO ONE IS EXPLOITING',
          'There are 440 million French speakers in Africa. They search Google in French: "calculateur salaire net Senegal", "calculer impot Cameroun", "taux TVA Maroc." There are ZERO comprehensive French financial tool platforms for Africa. Zero. You can own this entire market.'
        ),
        spacer(200),

        heading3('Current French Content'),
        twoColTable(
          ['Asset', 'Count'],
          [
            ['French PAYE calculators', '14 countries (CI, SN, CM, RDC, MA, DZ, TN, ML, BF, NE, GN, CG, GA, TG)'],
            ['French TVA calculators', '14 countries'],
            ['French blog posts', '8 (salaire net Senegal, IRPP Cote d\'Ivoire, CNPS, TVA Maroc, etc.)'],
            ['French locale system', 'Custom i18n in assets/js/utils/french-locale.js'],
            ['French hub page', '/fr/index.html with calculator listings'],
            ['TOTAL French tools', '28'],
          ],
          [4000, 5360]
        ),
        spacer(200),

        heading3('The Francophone Market Gap Analysis'),
        spacer(50),
        richPara([{ text: 'POPULATION: ', bold: true, color: BLUE }, { text: 'Francophone Africa has 440+ million people across 26 countries. These are NOT small markets:' }]),
        bullet('DRC: 102 million (largest Francophone country in the world)'),
        bullet('Morocco: 37 million (strongest economy in North Africa)'),
        bullet('Cameroon: 28 million (bilingual, bridges both markets)'),
        bullet('Cote d\'Ivoire: 28 million (economic powerhouse of West Africa)'),
        bullet('Algeria: 45 million (largest African country by area)'),
        bullet('Senegal: 18 million (rising tech hub)'),
        bullet('Tunisia: 12 million (highest internet penetration in Africa)'),
        spacer(100),

        richPara([{ text: 'COMPETITION: ', bold: true, color: BLUE }, { text: 'Search these terms on Google right now:' }]),
        bullet('"calculateur salaire net Senegal" \u2014 almost NO good results. Government PDFs and generic European tools.'),
        bullet('"calculer impot revenu Cameroun" \u2014 blog posts with outdated tables. No interactive calculator.'),
        bullet('"taux TVA Maroc 2026" \u2014 static articles. No calculator that actually computes VAT.'),
        bullet('"calculateur CNPS Cote d\'Ivoire" \u2014 literally nothing useful.'),
        para('You already have 14 French calculators. You are ALREADY the best result for many of these queries. But 14 is nothing compared to what is possible.', { italic: true }),
        spacer(200),

        heading3('Language Expansion Plan'),
        spacer(50),
        richPara([{ text: 'PHASE 1: French Domination (Month 1\u20133)', bold: true, color: BLUE }]),
        bullet('Scale from 28 to 200+ French tools (every free tool template x 14 Francophone countries)'),
        bullet('Translate top 20 English blog posts into French (salary, tax, business registration guides)'),
        bullet('Add French to all shared tool templates (currency converters, unit converters, document generators)'),
        bullet('Create French /fr/ versions of: mortgage calculator, business plan generator, invoice generator'),
        bullet('SEO: target "calculateur [X] [country]" for every tool x every Francophone country'),
        spacer(100),

        richPara([{ text: 'PHASE 2: Portuguese & Arabic (Month 4\u20136)', bold: true, color: BLUE }]),
        para('After French, the next language gaps:'),
        bullet('Portuguese: Angola (36M), Mozambique (33M), Cape Verde, Guinea-Bissau, Sao Tome. Total: 70+ million. Search "calculadora salario Angola" \u2014 nothing exists.'),
        bullet('Arabic: Egypt (109M), Algeria (45M), Morocco (37M), Sudan (46M), Tunisia (12M), Libya (7M). Total: 256+ million. These countries have English tools but Arabic versions for non-English speakers are missing.'),
        bullet('Amharic: Ethiopia (126M) \u2014 you already have an Amharic translator tool. Expand to Amharic financial tools.'),
        spacer(100),

        richPara([{ text: 'PHASE 3: Major African Languages (Month 7\u201312)', bold: true, color: BLUE }]),
        para('This is the nuclear option that nobody else will do:'),
        bullet('Swahili: 200+ million speakers (Kenya, Tanzania, DRC, Uganda). "Kikokotoo cha kodi Kenya" = tax calculator Kenya in Swahili.'),
        bullet('Hausa: 80+ million speakers (Nigeria, Niger, Ghana, Cameroon). Northern Nigeria\'s largest language.'),
        bullet('Yoruba: 45+ million speakers (Nigeria, Benin, Togo). You already have a Yoruba translator tool.'),
        bullet('Igbo: 30+ million speakers (Nigeria). You already have an Igbo translator tool.'),
        bullet('Zulu: 27+ million speakers (South Africa, Lesotho, Eswatini).'),
        bullet('Pidgin English: 75+ million speakers (Nigeria, Cameroon, Ghana). "How I go calculate my tax?" \u2014 a Pidgin English UI would go VIRAL.'),
        spacer(100),

        calloutBox(
          'THE PIDGIN ENGLISH OPPORTUNITY',
          'A Pidgin English version of your top tools would be a marketing goldmine. Imagine: "Oya calculate your salary tax \u2014 free free!" shared on Nigerian Twitter. It would go viral instantly. The PR value alone (TechCabal, CNN Africa would cover it) could be worth 10,000 backlinks.'
        ),
        spacer(200),

        heading3('Language Revenue Impact'),
        threeColTable(
          ['Language', 'Total Speakers in Africa', 'Revenue Opportunity'],
          [
            ['French', '440 million', 'HIGH \u2014 zero competition for financial tools. Immediate SEO wins.'],
            ['Arabic', '256 million', 'HIGH \u2014 massive population, growing internet. RTL layout needed.'],
            ['Portuguese', '70 million', 'MEDIUM \u2014 small market but zero competition.'],
            ['Swahili', '200 million', 'MEDIUM \u2014 large reach but lower ad CPM.'],
            ['Hausa', '80 million', 'MEDIUM \u2014 Northern Nigeria underserved.'],
            ['Pidgin', '75 million', 'HIGH (VIRAL) \u2014 marketing value exceeds direct revenue.'],
            ['Yoruba/Igbo/Zulu', '100+ million combined', 'LONG-TERM \u2014 cultural positioning.'],
          ],
          [2500, 3430, 3430]
        ),

        new Paragraph({ children: [new PageBreak()] }),

        // ═══════════════════════════════════════
        //  10. B2B & API
        // ═══════════════════════════════════════
        heading1('10. B2B & API Commercialization'),
        divider(),

        para('Your API is now fully functional with real calculation engines. This is a B2B product waiting to be sold.'),
        spacer(100),

        heading3('Working API Endpoints'),
        threeColTable(
          ['Endpoint', 'Method', 'Description'],
          [
            ['/api/tax', 'GET/POST', 'PAYE calculation for 50+ countries with regime selection'],
            ['/api/vat', 'GET/POST', 'VAT calculation for 54 countries with exemptions'],
            ['/api/forex', 'GET', 'Live forex rates, cross-rates, 30-day history'],
            ['/api/fuel', 'GET', 'Fuel prices by country/station'],
            ['/api/rates', 'GET', 'Central bank interest rates'],
            ['/api/countries', 'GET', 'All 54 countries with currency, population, region'],
            ['/api/tax-rates', 'GET', 'Tax rate reference data (PAYE + VAT)'],
            ['/api/salary-benchmarks', 'GET', 'Salary data by country/role'],
            ['/api/crypto', 'GET', 'Crypto prices + P2P rates'],
            ['/api/scholarships', 'GET', 'Search verified scholarship opportunities'],
            ['/api/v1/* (gateway)', 'POST', 'Unified gateway: tax, forex, countries with API key auth'],
          ],
          [2500, 1860, 5000]
        ),
        spacer(200),

        heading3('Target B2B Customers'),
        bullet('Payroll companies: Need PAYE calculations for 54 African countries. They currently build these engines from scratch. You have them ready.'),
        bullet('Fintech apps: Need forex rates for African currencies. Your /api/forex updates every 15 minutes.'),
        bullet('HR platforms: Need salary benchmarks. Your /api/salary-benchmarks has country/role data.'),
        bullet('Accounting software: Need VAT rates and calculation. Your /api/vat covers 54 countries.'),
        bullet('Crypto exchanges: Need P2P rates for African markets. Your scheduled scraper runs every 5 minutes.'),
        bullet('Insurance companies: Need cost-of-living data for African cities.'),
        spacer(200),

        heading3('API Sales Strategy'),
        bullet('Month 1: API docs are live at /api/docs/. API key signup at /api/. Free tier attracts developers.'),
        bullet('Month 2\u20133: Reach out to 10 fintech companies in Nigeria/Kenya/SA. Offer free starter tier. Demonstrate value.'),
        bullet('Month 4\u20136: Convert free users to paid. Add premium endpoints (batch calculation, historical data, webhooks).'),
        bullet('Month 7\u201312: Enterprise deals. Custom rate limits. SLA guarantees. White-label option.'),

        new Paragraph({ children: [new PageBreak()] }),

        // ═══════════════════════════════════════
        //  11. EMAIL & LEAD CAPTURE
        // ═══════════════════════════════════════
        heading1('11. Email & Lead Capture System'),
        divider(),

        heading3('Current Lead Capture Infrastructure'),
        twoColTable(
          ['Component', 'Status'],
          [
            ['PDF email gate', 'Working. <email-gate-modal> captures email before PDF download.'],
            ['/api/capture-lead', 'Working. Stores email, tool slug, source in Supabase.'],
            ['Newsletter form (footer)', 'Working. Posts to Netlify Forms.'],
            ['Monthly digest', 'Working. Scheduled 1st of month. Resend API integration.'],
            ['Email unsubscribe', 'Working. One-click unsubscribe endpoint.'],
            ['API key signup', 'Working. Captures email + use case.'],
          ],
          [4000, 5360]
        ),
        spacer(200),

        heading3('Email Growth Strategy'),
        bullet('Month 1: Focus on PDF gate + newsletter footer. Target: 500\u20131,000 email addresses.'),
        bullet('Month 2: Add tool-specific lead magnets ("Get your full tax breakdown as PDF"). Target: 2,000\u20133,000 emails.'),
        bullet('Month 3: Launch weekly email digest (vs. monthly). Target: 5,000+ emails.'),
        bullet('Month 4\u20136: Drip sequences: new user \u2192 3 emails \u2192 Pro upsell. Target: 10,000+ emails.'),
        spacer(100),
        para('Every email address is a potential Pro subscriber. A 2% conversion rate on 10,000 emails = 200 Pro subscribers = $1,000/mo.'),

        new Paragraph({ children: [new PageBreak()] }),

        // ═══════════════════════════════════════
        //  12. FINANCIAL PROJECTIONS
        // ═══════════════════════════════════════
        heading1('12. Financial Projections \u2014 Month by Month'),
        divider(),

        heading3('Costs'),
        threeColTable(
          ['Item', 'Monthly Cost', 'Notes'],
          [
            ['Netlify Pro', '$19', 'Current or scaling to Pro for more build minutes'],
            ['Supabase (2 instances)', '$0\u2013$50', 'Free tier sufficient initially'],
            ['Claude API (AI Advisor)', '$10\u2013$50', 'Haiku model, rate-limited'],
            ['Domain (afrotools.com)', '$1', 'Amortized annually'],
            ['Google Workspace (email)', '$6', 'Professional email'],
            ['SEMrush', '$0\u2013$130', 'Depending on plan'],
            ['TOTAL', '$36\u2013$256', 'Extremely lean'],
          ],
          [3000, 2680, 3680]
        ),
        spacer(200),

        heading3('Revenue Projections'),
        fourColTable(
          ['Month', 'Visitors', 'Pro Subs', 'Total Revenue'],
          [
            ['Month 1', '5K\u201310K', '0\u201310', '$50\u2013$200 (ads + affiliates only)'],
            ['Month 2', '10K\u201325K', '10\u201350', '$200\u2013$600'],
            ['Month 3', '25K\u201350K', '50\u2013200', '$500\u2013$2,000'],
            ['Month 4', '50K\u2013100K', '200\u2013500', '$1,500\u2013$4,000'],
            ['Month 5', '75K\u2013150K', '300\u2013800', '$2,500\u2013$6,000'],
            ['Month 6', '100K\u2013200K', '500\u20131,500', '$3,500\u2013$9,300'],
            ['Month 9', '200K\u2013400K', '1,000\u20133,000', '$7,000\u2013$20,000'],
            ['Month 12', '400K\u20131M', '2,000\u20135,000', '$15,000\u2013$47,000'],
          ],
          [1800, 2520, 2520, 2520]
        ),
        spacer(100),
        calloutBox(
          'BREAK-EVEN POINT',
          'At $36\u2013$256/month in costs, break-even happens with just 8\u201352 Pro subscribers (at $5/mo). This is achievable in Month 1\u20132. Everything after that is profit. This is one of the leanest business models possible.'
        ),

        new Paragraph({ children: [new PageBreak()] }),

        // ═══════════════════════════════════════
        //  13. WEEK BY WEEK CALENDAR
        // ═══════════════════════════════════════
        heading1('13. Week-by-Week Execution Calendar'),
        divider(),

        heading3('MONTH 1: FOUNDATION (March 20 \u2013 April 20)'),
        spacer(50),
        richPara([{ text: 'WEEK 1 (Mar 20\u201327) \u2014 SETUP & LAUNCH', bold: true, color: BLUE }]),
        bullet('Apply for Google AdSense'),
        bullet('Create social media accounts (Twitter, LinkedIn, TikTok, Instagram)'),
        bullet('Post launch thread on Twitter/LinkedIn'),
        bullet('Complete CAC registration (in progress)'),
        bullet('Build first 350 new tools (focus on template-based generation)'),
        bullet('Add affiliate links to top 20 existing tools'),
        bullet('Write + schedule 20 social media posts'),
        spacer(50),

        richPara([{ text: 'WEEK 2 (Mar 28\u2013Apr 3) \u2014 CONTENT & TOOLS', bold: true, color: BLUE }]),
        bullet('Build 350 more tools (total: ~1,100)'),
        bullet('Build first 5 Pro tools: Invoice Generator, Receipt Generator, Payroll Generator, CV Builder, Expense Tracker'),
        bullet('Start daily social media posting (3x Twitter, 1x LinkedIn, 1x TikTok)'),
        bullet('Join 25 Facebook business groups'),
        bullet('Add watermark to all free PDF exports (Phase 1 of PDF removal)'),
        bullet('Write 5 new blog posts targeting high-volume keywords'),
        spacer(50),

        richPara([{ text: 'WEEK 3 (Apr 4\u201310) \u2014 PAYMENTS & PRO', bold: true, color: BLUE }]),
        bullet('Build 350 more tools (total: ~1,450)'),
        bullet('Build Pro tools 6\u201310: Quotation Generator, Contract Generator, Farm Profit Calculator, Construction Cost Estimator, Salary Negotiation Report'),
        bullet('Activate Paystack live keys (post-CAC)'),
        bullet('Test full payment flow end-to-end'),
        bullet('Verify Supabase subscriptions table'),
        bullet('Remove PDF from T3 (utility) tools'),
        bullet('Join remaining 25 Facebook groups'),
        spacer(50),

        richPara([{ text: 'WEEK 4 (Apr 11\u201320) \u2014 SCALE & LAUNCH', bold: true, color: BLUE }]),
        bullet('Build 550 more tools (total: ~2,000)'),
        bullet('Product Hunt launch (2,000+ tools milestone)'),
        bullet('Translate top 10 tools into French (scale from 28 to 50+ French tools)'),
        bullet('Create /embed/ showcase page for widget backlinks'),
        bullet('Start emailing universities about scholarship matcher'),
        bullet('Month 1 review: check GA4, social growth, AdSense approval, first revenue'),
        spacer(200),

        heading3('MONTH 2: ACCELERATE (April 20 \u2013 May 20)'),
        spacer(50),
        richPara([{ text: 'WEEK 5\u20136', bold: true, color: BLUE }]),
        bullet('Build 1,500 more tools (total: ~3,500)'),
        bullet('Build Pro tools 11\u201330 (full business suite)'),
        bullet('Remove PDF from T2 (standard) tools'),
        bullet('Launch email capture drip sequence'),
        bullet('Scale French content to 100+ tools'),
        bullet('Reach out to 10 fintech companies for API partnerships'),
        bullet('Social media: aim for 10,000 total followers'),
        spacer(50),

        richPara([{ text: 'WEEK 7\u20138', bold: true, color: BLUE }]),
        bullet('Build 1,500 more tools (total: ~5,000)'),
        bullet('Build Pro tools 31\u201350'),
        bullet('Remove PDF from T1 (premium) tools'),
        bullet('Build 54 country economic data dashboards (backlink magnets)'),
        bullet('First affiliate partnership deals (crypto exchange, job board)'),
        bullet('Launch weekly email digest'),
        spacer(200),

        heading3('MONTH 3: DOMINATE (May 20 \u2013 June 20)'),
        spacer(50),
        richPara([{ text: 'WEEK 9\u201310', bold: true, color: BLUE }]),
        bullet('Build 2,500 more tools (total: ~7,500)'),
        bullet('Build Pro tools 51\u201375'),
        bullet('PDF fully Pro-only'),
        bullet('Launch Pidgin English version of top 10 tools (viral marketing play)'),
        bullet('First sponsored tool deal negotiation'),
        bullet('Social media: aim for 15,000 total followers'),
        spacer(50),

        richPara([{ text: 'WEEK 11\u201312', bold: true, color: BLUE }]),
        bullet('Build 2,500 more tools (total: 10,000)'),
        bullet('Build Pro tools 76\u2013100'),
        bullet('All 100 Pro tools live'),
        bullet('Launch Portuguese tools (Angola, Mozambique)'),
        bullet('90-day review: full metrics audit'),
        bullet('Plan next 90 days based on data'),

        new Paragraph({ children: [new PageBreak()] }),

        // ═══════════════════════════════════════
        //  14. RISK REGISTER
        // ═══════════════════════════════════════
        heading1('14. Risk Register & Contingency Plans'),
        divider(),

        threeColTable(
          ['Risk', 'Impact', 'Mitigation'],
          [
            ['Can\'t hit 10K tool build rate', 'HIGH', 'Focus on template-based generation. Quality > quantity if needed. Even 5,000 tools is dominant.'],
            ['Low Pro conversion rate', 'MEDIUM', '100 exclusive Pro tools ensures enough hooks. If conversion < 1%, increase free-to-Pro friction (remove more features).'],
            ['Google penalizes thin content', 'HIGH', 'Every tool must have unique meta, real calculation logic, and useful output. No duplicate pages. Canonical URLs.'],
            ['Paystack/Stripe delays', 'MEDIUM', 'Focus on ads + affiliates first. Payment is not the only revenue stream.'],
            ['CAC registration delays', 'MEDIUM', 'Build everything else. Payment activation can happen at any point.'],
            ['Burnout from build pace', 'HIGH', 'Templatize aggressively. Automate tool generation where possible. Take rest days.'],
            ['Competition copies the model', 'LOW', 'First-mover advantage + 10K tools + 54 countries = impossible to replicate quickly. Speed is the moat.'],
            ['API abuse/scraping', 'LOW', 'Rate limiting already built. Add CAPTCHA if needed. Monitor with Netlify analytics.'],
          ],
          [2500, 1500, 5360]
        ),

        new Paragraph({ children: [new PageBreak()] }),

        // ═══════════════════════════════════════
        //  15. SUCCESS METRICS
        // ═══════════════════════════════════════
        heading1('15. Success Metrics & KPIs'),
        divider(),

        heading3('Weekly KPIs to Track'),
        twoColTable(
          ['KPI', 'Tracking Method'],
          [
            ['New tools built this week', 'Admin dashboard tool registry count'],
            ['Total indexed pages (Google)', 'Google Search Console'],
            ['Organic traffic (sessions)', 'GA4'],
            ['New email signups', 'Supabase email_leads table + Netlify Forms'],
            ['Social media followers (total)', 'Platform analytics'],
            ['New backlinks acquired', 'SEMrush backlink report'],
            ['Pro subscribers (new + total)', 'Supabase subscriptions table'],
            ['Revenue (all streams)', 'Paystack dashboard + AdSense + affiliate dashboards'],
            ['API key signups', 'Netlify Blobs apikeys store count'],
            ['PDF downloads', 'GA4 pdf_download event'],
          ],
          [4500, 4860]
        ),
        spacer(200),

        heading3('Monthly Milestones'),
        threeColTable(
          ['Milestone', 'Target Date', 'Success Criteria'],
          [
            ['2,000 tools live', 'April 20', 'Registered in tool registry, indexed by Google'],
            ['Pro payments activated', 'April 10', 'End-to-end checkout working'],
            ['100 Pro subscribers', 'May 20', 'Active subscriptions in Supabase'],
            ['10,000 tools live', 'June 20', 'All indexed, all mobile-responsive'],
            ['100 Pro tools live', 'June 20', 'Exclusive tools generating daily signups'],
            ['$1,000 MRR', 'June 20', 'Subscriptions + ads + affiliates combined'],
            ['10,000 email addresses', 'June 20', 'Captured via PDF gate + newsletter + API signups'],
            ['20,000 social followers', 'June 20', 'Combined across all platforms'],
            ['1,000+ backlinks', 'June 20', 'Tracked in SEMrush'],
            ['50,000+ monthly visitors', 'June 20', 'GA4 sessions'],
          ],
          [3000, 2180, 4180]
        ),

        spacer(400),
        divider(),
        spacer(200),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: 'WE MUST WIN.', size: 36, bold: true, font: 'DM Sans', color: BLUE })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: 'The gap isn\u2019t building \u2014 it\u2019s converting what we\u2019ve built into revenue.', size: 22, font: 'DM Sans', color: GRAY, italics: true })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'The foundation is laid. The architecture is solid. Now we scale.', size: 22, font: 'DM Sans', color: GRAY, italics: true })]
        }),
        spacer(200),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: '\u2014 End of Document \u2014', size: 20, font: 'DM Sans', color: 'D1D5DB' })]
        }),
      ]
    }
  ]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('C:\\Users\\Oza\\Documents\\afrotools\\AFROTOOLS-90-DAY-BATTLE-PLAN.docx', buffer);
  console.log('Document generated successfully!');
  console.log('File: AFROTOOLS-90-DAY-BATTLE-PLAN.docx');
  console.log('Size: ' + Math.round(buffer.length / 1024) + ' KB');
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
