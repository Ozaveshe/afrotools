// /assets/js/tool-registry.js
// ═══════════════════════════════════════════════════════════
// AFROTOOLS — Single source of truth for ALL 88 tools
// Add a tool here ONCE → it appears on every relevant page
// ═══════════════════════════════════════════════════════════

var AFRO_TOOLS = [

  // ═══════════════════════════════════════════════════════════
  //  LIVE
  // ═══════════════════════════════════════════════════════════
  {
    id: 'ng-paye', name: 'Nigeria PAYE Calculator', icon: '🇳🇬',
    desc: 'NTA 2026 vs PITA 2025 dual-regime. CRA/Rent Relief, pension, NHF. AI tax advisor + PDF download.',
    href: '/nigeria/ng-salary-tax', category: 'financial', tier: 'T1',
    status: 'live', phase: 'LIVE', countries: ['NG'],
    revenue: 'Premium PDF', estTraffic: 8000, estRevenue: 200, priority: 100,
  },
  {
    id: 'ke-paye', name: 'Kenya PAYE Calculator', icon: '🇰🇪',
    desc: 'KRA 5-band PAYE, NSSF Tier I/II, SHIF 2.75%, AHL 1.5%. Tax Laws Amendment Act 2024.',
    href: '/kenya/ke-paye', category: 'financial', tier: 'T1',
    status: 'live', phase: 'LIVE', countries: ['KE'],
    revenue: 'Premium PDF', estTraffic: 5000, estRevenue: 150, priority: 100,
  },
  {
    id: 'pdf-workspace', name: 'PDF Workspace', icon: '📄',
    desc: 'Split, merge, rearrange, rotate, compress, add page numbers. Files never leave your browser.',
    href: '/tools/pdf-workspace', category: 'document-pdf', tier: 'T3',
    status: 'live', phase: 'LIVE', countries: ['ALL'],
    revenue: 'Freemium', estTraffic: 25000, estRevenue: 300, priority: 95,
  },
  {
    id: 'japa-calculator', name: 'Japa Cost Calculator', icon: '✈️',
    desc: 'Total relocation cost from Africa. 12 origins, 7 destinations, 17 visa pathways.',
    href: '/tools/japa-calculator', category: 'african', tier: 'T1',
    status: 'new', phase: 'LIVE', countries: ['ALL'],
    revenue: 'Affiliate services', estTraffic: 10000, estRevenue: 500, priority: 91,
  },

  // ═══════════════════════════════════════════════════════════
  //  PHASE 1 — TRAFFIC (Mar–Apr 2026)
  //  PDF, Image, Dev, Education T3 + PAYE expansion
  // ═══════════════════════════════════════════════════════════

  // Week 1 — Document & PDF
  { id: 'pdf-merge-split', name: 'PDF Merge & Split', icon: '📑', desc: 'Combine multiple PDFs into one or split a PDF into separate pages. Drag-drop reorder.', href: '/tools/pdf-merge-split', category: 'document-pdf', tier: 'T3', status: 'queued', phase: 'Phase 1', countries: ['ALL'], revenue: 'Freemium', estTraffic: 25000, estRevenue: 300, priority: 95 },
  { id: 'pdf-compress', name: 'PDF Compressor', icon: '🗜️', desc: 'Reduce PDF file size with quality presets (screen/ebook/print). Client-side only.', href: '/tools/pdf-compress', category: 'document-pdf', tier: 'T3', status: 'queued', phase: 'Phase 1', countries: ['ALL'], revenue: 'Freemium', estTraffic: 20000, estRevenue: 250, priority: 94 },
  { id: 'pdf-image-convert', name: 'PDF to Image / Image to PDF', icon: '🖼️', desc: 'Convert PDF pages to images or combine images into a PDF. Batch support.', href: '/tools/pdf-image-convert', category: 'document-pdf', tier: 'T3', status: 'queued', phase: 'Phase 1', countries: ['ALL'], revenue: 'Freemium', estTraffic: 15000, estRevenue: 200, priority: 93 },
  { id: 'pdf-watermark', name: 'PDF Watermark Tool', icon: '💧', desc: 'Add text or image watermarks to PDFs. Custom opacity, position, and rotation.', href: '/tools/pdf-watermark', category: 'document-pdf', tier: 'T3', status: 'queued', phase: 'Phase 1', countries: ['ALL'], revenue: 'Freemium', estTraffic: 8000, estRevenue: 100, priority: 88 },
  { id: 'pdf-password', name: 'PDF Password Protect', icon: '🔒', desc: 'Encrypt or decrypt PDFs with password protection. No server upload.', href: '/tools/pdf-password', category: 'document-pdf', tier: 'T3', status: 'queued', phase: 'Phase 1', countries: ['ALL'], revenue: 'Freemium', estTraffic: 10000, estRevenue: 120, priority: 89 },
  { id: 'pdf-page-numbers', name: 'PDF Page Numbering', icon: '#️⃣', desc: 'Add page numbers to PDFs. Custom format, position, font, and starting number.', href: '/tools/pdf-page-numbers', category: 'document-pdf', tier: 'T3', status: 'queued', phase: 'Phase 1', countries: ['ALL'], revenue: 'Freemium', estTraffic: 6000, estRevenue: 80, priority: 82 },

  // Week 1 — Image & Design
  { id: 'image-compress', name: 'Image Compressor', icon: '📷', desc: 'Reduce image file size with quality slider. Critical for Africa bandwidth. Batch mode.', href: '/tools/image-compress', category: 'image-design', tier: 'T3', status: 'queued', phase: 'Phase 1', countries: ['ALL'], revenue: 'Freemium', estTraffic: 18000, estRevenue: 220, priority: 92 },
  { id: 'image-resize', name: 'Image Resizer & Converter', icon: '↔️', desc: 'Resize images, convert between WebP/PNG/JPG. Social media presets included.', href: '/tools/image-resize', category: 'image-design', tier: 'T3', status: 'queued', phase: 'Phase 1', countries: ['ALL'], revenue: 'Freemium', estTraffic: 15000, estRevenue: 180, priority: 91 },
  { id: 'qr-generator', name: 'QR Code Generator', icon: '📲', desc: 'Generate QR codes for M-Pesa links, WhatsApp, WiFi, URLs, and text. Download as PNG/SVG.', href: '/tools/qr-generator', category: 'image-design', tier: 'T3', status: 'queued', phase: 'Phase 1', countries: ['ALL'], revenue: 'Freemium', estTraffic: 12000, estRevenue: 150, priority: 90 },

  // Week 1 — Data & Productivity
  { id: 'unit-converter', name: 'Unit Converter (African)', icon: '📏', desc: 'Convert units including local African measurements: Nigerian plots, SA morgen, etc.', href: '/tools/unit-converter', category: 'data-productivity', tier: 'T3', status: 'queued', phase: 'Phase 1', countries: ['ALL'], revenue: 'Ad-supported', estTraffic: 10000, estRevenue: 120, priority: 87 },

  // Week 2 — Developer Tools
  { id: 'color-picker', name: 'Color Picker & Converter', icon: '🎨', desc: 'HEX/RGB/HSL conversion + WCAG contrast checker. Palette generator.', href: '/tools/color-picker', category: 'developer', tier: 'T3', status: 'queued', phase: 'Phase 1', countries: ['ALL'], revenue: 'Free', estTraffic: 8000, estRevenue: 80, priority: 80 },
  { id: 'data-converter', name: 'JSON/CSV/XML Converter', icon: '🔄', desc: 'Convert between JSON, CSV, XML, and YAML. Developer traffic magnet.', href: '/tools/data-converter', category: 'developer', tier: 'T3', status: 'queued', phase: 'Phase 1', countries: ['ALL'], revenue: 'Free + API', estTraffic: 7000, estRevenue: 70, priority: 78 },
  { id: 'hash-generator', name: 'Hash Generator', icon: '🔐', desc: 'Generate MD5, SHA-256, bcrypt hashes. Verify file integrity.', href: '/tools/hash-generator', category: 'developer', tier: 'T3', status: 'queued', phase: 'Phase 1', countries: ['ALL'], revenue: 'Free', estTraffic: 5000, estRevenue: 50, priority: 75 },
  { id: 'base64', name: 'Base64 Encoder/Decoder', icon: '📝', desc: 'Encode/decode text and files to/from Base64. File-to-base64 included.', href: '/tools/base64', category: 'developer', tier: 'T3', status: 'queued', phase: 'Phase 1', countries: ['ALL'], revenue: 'Free', estTraffic: 6000, estRevenue: 60, priority: 76 },
  { id: 'regex-tester', name: 'Regex Tester', icon: '🔍', desc: 'Test regular expressions with African data pattern presets (phone numbers, NIN, etc).', href: '/tools/regex-tester', category: 'developer', tier: 'T3', status: 'queued', phase: 'Phase 1', countries: ['ALL'], revenue: 'Free', estTraffic: 5000, estRevenue: 50, priority: 74 },
  { id: 'cron-builder', name: 'Cron Expression Builder', icon: '⏰', desc: 'Visual cron expression builder with human-readable output.', href: '/tools/cron-builder', category: 'developer', tier: 'T3', status: 'queued', phase: 'Phase 1', countries: ['ALL'], revenue: 'Free', estTraffic: 4000, estRevenue: 40, priority: 70 },
  { id: 'jwt-decoder', name: 'JWT Decoder', icon: '🪙', desc: 'Decode and validate JSON Web Tokens. Header, payload, signature breakdown.', href: '/tools/jwt-decoder', category: 'developer', tier: 'T3', status: 'queued', phase: 'Phase 1', countries: ['ALL'], revenue: 'Free', estTraffic: 4000, estRevenue: 40, priority: 70 },

  // Week 2 — Education
  { id: 'scientific-calc', name: 'Scientific Calculator', icon: '🧮', desc: 'Full scientific calculator with graphing. Works offline. African exam mode.', href: '/tools/scientific-calc', category: 'education', tier: 'T3', status: 'queued', phase: 'Phase 1', countries: ['ALL'], revenue: 'Free', estTraffic: 12000, estRevenue: 120, priority: 86 },
  { id: 'gpa-calculator', name: 'GPA/CGPA Calculator', icon: '🎓', desc: 'Calculate GPA on Nigeria 5.0 scale, Kenya/SA 4.0 scale, or custom. Semester + cumulative.', href: '/tools/gpa-calculator', category: 'education', tier: 'T3', status: 'queued', phase: 'Phase 1', countries: ['ALL'], revenue: 'Free', estTraffic: 10000, estRevenue: 100, priority: 85 },

  // Week 2 — Data & Productivity
  { id: 'pomodoro', name: 'Pomodoro Timer', icon: '🍅', desc: 'Focus timer with African language motivational quotes. Works offline.', href: '/tools/pomodoro', category: 'data-productivity', tier: 'T3', status: 'queued', phase: 'Phase 1', countries: ['ALL'], revenue: 'Free', estTraffic: 5000, estRevenue: 40, priority: 68 },

  // Week 2 — E-Commerce, Health
  { id: 'profit-margin', name: 'Profit Margin Calculator', icon: '💹', desc: 'Gross, operating, and net margin calculator. Multi-currency with import duty factoring.', href: '/tools/profit-margin', category: 'ecommerce', tier: 'T3', status: 'queued', phase: 'Phase 1', countries: ['ALL'], revenue: 'Free', estTraffic: 8000, estRevenue: 80, priority: 82 },
  { id: 'bmi-calculator', name: 'BMI & Health Calculator', icon: '⚕️', desc: 'BMI calculator calibrated for African body composition data.', href: '/tools/bmi-calculator', category: 'health', tier: 'T3', status: 'queued', phase: 'Phase 1', countries: ['ALL'], revenue: 'Ad-supported', estTraffic: 8000, estRevenue: 100, priority: 80 },
  { id: 'due-date', name: 'Pregnancy Due Date Calculator', icon: '👶', desc: 'Due date calculator with local antenatal visit schedule.', href: '/tools/due-date', category: 'health', tier: 'T3', status: 'queued', phase: 'Phase 1', countries: ['ALL'], revenue: 'Ad-supported', estTraffic: 6000, estRevenue: 80, priority: 78 },
  { id: 'fuel-cost', name: 'Fuel Cost Calculator', icon: '⛽', desc: 'Route fuel cost estimator with African city routes and live fuel prices.', href: '/tools/fuel-cost', category: 'health', tier: 'T3', status: 'queued', phase: 'Phase 1', countries: ['ALL'], revenue: 'Ad-supported', estTraffic: 7000, estRevenue: 90, priority: 79 },
  { id: 'generator-fuel', name: 'Generator Fuel Calculator', icon: '⚡', desc: 'Running cost per hour. Generator vs solar comparison over time.', href: '/tools/generator-fuel', category: 'african', tier: 'T3', status: 'queued', phase: 'Phase 1', countries: ['NG', 'GH', 'ZA', 'KE', 'TZ', 'UG'], revenue: 'Affiliate', estTraffic: 8000, estRevenue: 150, priority: 83 },

  // Week 3 — PAYE Expansion + Financial
  { id: 'gh-paye', name: 'Ghana PAYE + SSNIT', icon: '🇬🇭', desc: 'GRA 2026 bands, SSNIT Tier I/II/III, all personal reliefs. AI advisor + PDF.', href: '/ghana/gh-paye', category: 'financial', tier: 'T1', status: 'queued', phase: 'Phase 1', countries: ['GH'], revenue: 'Premium PDF', estTraffic: 6000, estRevenue: 180, priority: 92 },
  { id: 'za-paye', name: 'South Africa SARS Tax', icon: '🇿🇦', desc: '2025/26 SARS brackets, UIF, medical credits, age rebates. AI advisor + PDF.', href: '/south-africa/za-paye', category: 'financial', tier: 'T1', status: 'queued', phase: 'Phase 1', countries: ['ZA'], revenue: 'Premium PDF', estTraffic: 12000, estRevenue: 350, priority: 96 },
  { id: 'vat-calculator', name: 'VAT Calculator (Pan-African)', icon: '💱', desc: 'All 54 African countries. Standard, reduced, zero-rated, and reverse VAT.', href: '/tools/vat-calculator', category: 'financial', tier: 'T2', status: 'queued', phase: 'Phase 1', countries: ['ALL'], revenue: 'Freemium', estTraffic: 15000, estRevenue: 200, priority: 90 },
  { id: 'currency-converter', name: 'Currency Converter', icon: '💰', desc: '42 African currencies plus USDT. Real-time rates, historical charts, alerts.', href: '/tools/currency-converter', category: 'financial', tier: 'T2', status: 'queued', phase: 'Phase 1', countries: ['ALL'], revenue: 'Premium alerts', estTraffic: 20000, estRevenue: 300, priority: 93 },
  { id: 'passport-photo', name: 'Passport Photo Tool', icon: '📸', desc: 'Crop and resize photos to passport specs for all 54 African + international countries.', href: '/tools/passport-photo', category: 'image-design', tier: 'T2', status: 'queued', phase: 'Phase 1', countries: ['ALL'], revenue: 'Premium prints', estTraffic: 10000, estRevenue: 200, priority: 88 },

  // Week 4 — More PAYE + Image + Education
  { id: 'eg-paye', name: 'Egypt Income Tax', icon: '🇪🇬', desc: 'ETA progressive rates (0%–27.5%), E£20,000 exemption, social insurance. AI advisor + PDF.', href: '/egypt/eg-paye', category: 'financial', tier: 'T1', status: 'queued', phase: 'Phase 1', countries: ['EG'], revenue: 'Premium PDF', estTraffic: 8000, estRevenue: 250, priority: 91 },
  { id: 'tz-paye', name: 'Tanzania PAYE Calculator', icon: '🇹🇿', desc: 'TRA 6-band PAYE, NSSF 10%+10%, SDL 3.5%. AI advisor + PDF.', href: '/tanzania/tz-paye', category: 'financial', tier: 'T1', status: 'queued', phase: 'Phase 1', countries: ['TZ'], revenue: 'Premium PDF', estTraffic: 4000, estRevenue: 120, priority: 85 },
  { id: 'background-remover', name: 'Background Remover', icon: '✂️', desc: 'AI-powered background removal in-browser with TensorFlow.js. Batch support.', href: '/tools/background-remover', category: 'image-design', tier: 'T2', status: 'queued', phase: 'Phase 1', countries: ['ALL'], revenue: 'Premium batch', estTraffic: 15000, estRevenue: 300, priority: 91 },
  { id: 'waec-calculator', name: 'WAEC/NECO Grade Calculator', icon: '📋', desc: 'Convert WAEC/NECO grades to aggregate scores and JAMB admission requirements.', href: '/tools/waec-calculator', category: 'education', tier: 'T2', status: 'queued', phase: 'Phase 1', countries: ['NG', 'GH'], revenue: 'Ad-supported', estTraffic: 12000, estRevenue: 150, priority: 87 },

  // Week 5 — More PAYE + Utility
  { id: 'ug-paye', name: 'Uganda PAYE Calculator', icon: '🇺🇬', desc: 'URA progressive rates + NSSF contributions. AI advisor + PDF.', href: '/uganda/ug-paye', category: 'financial', tier: 'T1', status: 'queued', phase: 'Phase 1', countries: ['UG'], revenue: 'Premium PDF', estTraffic: 3000, estRevenue: 90, priority: 80 },
  { id: 'rw-paye', name: 'Rwanda PAYE Calculator', icon: '🇷🇼', desc: 'RRA progressive rates + RSSB contributions. AI advisor + PDF.', href: '/rwanda/rw-paye', category: 'financial', tier: 'T1', status: 'queued', phase: 'Phase 1', countries: ['RW'], revenue: 'Premium PDF', estTraffic: 2000, estRevenue: 60, priority: 75 },
  { id: 'electricity-estimator', name: 'Electricity Bill Estimator', icon: '💡', desc: 'Prepaid meter units calculator per country. Tariff bands and usage estimator.', href: '/tools/electricity-estimator', category: 'health', tier: 'T2', status: 'queued', phase: 'Phase 1', countries: ['ALL'], revenue: 'Freemium', estTraffic: 10000, estRevenue: 150, priority: 86 },
  { id: 'citation-generator', name: 'Citation Generator', icon: '📖', desc: 'APA/MLA/Harvard citation generator. African journal database included.', href: '/tools/citation-generator', category: 'education', tier: 'T3', status: 'queued', phase: 'Phase 1', countries: ['ALL'], revenue: 'Free', estTraffic: 8000, estRevenue: 80, priority: 80 },

  // Week 6 — More PAYE
  { id: 'et-paye', name: 'Ethiopia PAYE Calculator', icon: '🇪🇹', desc: 'MoR progressive rates + pension. AI advisor + PDF.', href: '/ethiopia/et-paye', category: 'financial', tier: 'T1', status: 'queued', phase: 'Phase 1', countries: ['ET'], revenue: 'Premium PDF', estTraffic: 5000, estRevenue: 150, priority: 84 },
  { id: 'sn-paye', name: 'Senegal PAYE Calculator', icon: '🇸🇳', desc: 'DGID + CSS + IPM. Francophone anchor. AI advisor + PDF.', href: '/senegal/sn-paye', category: 'financial', tier: 'T1', status: 'queued', phase: 'Phase 1', countries: ['SN'], revenue: 'Premium PDF', estTraffic: 2500, estRevenue: 75, priority: 72 },

  // ═══════════════════════════════════════════════════════════
  //  PHASE 2 — MONETIZE (May–Jun 2026)
  //  CV Builder, Invoices, Remittance, Payroll
  // ═══════════════════════════════════════════════════════════
  { id: 'cv-builder', name: 'CV / Resume Builder', icon: '📝', desc: 'Africa-ready templates. NYSC/NSS/KCSE aware. Premium templates $2-3 each.', href: '/tools/cv-builder', category: 'document-pdf', tier: 'T1', status: 'planned', phase: 'Phase 2', countries: ['ALL'], revenue: 'Premium templates', estTraffic: 20000, estRevenue: 800, priority: 97 },
  { id: 'invoice-generator', name: 'Invoice Generator', icon: '🧾', desc: 'VAT/WHT lines, multi-currency, mobile money refs, company logos.', href: '/tools/invoice-generator', category: 'document-pdf', tier: 'T1', status: 'planned', phase: 'Phase 2', countries: ['ALL'], revenue: 'Premium branding', estTraffic: 15000, estRevenue: 600, priority: 95 },
  { id: 'remittance-compare', name: 'Remittance Comparator', icon: '🌐', desc: 'Compare costs across 50+ corridors. Find the cheapest way to send money home.', href: '/tools/remittance-compare', category: 'african', tier: 'T1', status: 'planned', phase: 'Phase 2', countries: ['ALL'], revenue: 'Affiliate', estTraffic: 12000, estRevenue: 1500, priority: 98 },
  { id: 'import-duty', name: 'Import Duty Calculator', icon: '🚢', desc: 'HS codes per country. Customs duty and levy for cross-border traders.', href: '/tools/import-duty', category: 'financial', tier: 'T1', status: 'planned', phase: 'Phase 2', countries: ['ALL'], revenue: 'Premium bulk', estTraffic: 10000, estRevenue: 500, priority: 93 },
  { id: 'mortgage-calculator', name: 'Mortgage Calculator', icon: '🏠', desc: 'Country-specific interest rates, stamp duty, and affordability calculator.', href: '/tools/mortgage-calculator', category: 'financial', tier: 'T2', status: 'planned', phase: 'Phase 2', countries: ['ALL'], revenue: 'Affiliate banks', estTraffic: 8000, estRevenue: 400, priority: 88 },
  { id: 'loan-compare', name: 'Loan Comparison Tool', icon: '🏦', desc: 'Compare real APR including all fees across African banks and fintechs.', href: '/tools/loan-compare', category: 'financial', tier: 'T1', status: 'planned', phase: 'Phase 2', countries: ['ALL'], revenue: 'Affiliate', estTraffic: 8000, estRevenue: 600, priority: 90 },
  { id: 'receipt-generator', name: 'Receipt Generator', icon: '🧾', desc: 'Professional receipts with mobile money transaction references.', href: '/tools/receipt-generator', category: 'document-pdf', tier: 'T2', status: 'planned', phase: 'Phase 2', countries: ['ALL'], revenue: 'Premium branding', estTraffic: 8000, estRevenue: 250, priority: 85 },
  { id: 'certificate-generator', name: 'Certificate Generator', icon: '🏅', desc: 'Professional certificates with QR verification. Batch from CSV.', href: '/tools/certificate-generator', category: 'document-pdf', tier: 'T2', status: 'planned', phase: 'Phase 2', countries: ['ALL'], revenue: 'Enterprise batch', estTraffic: 5000, estRevenue: 300, priority: 82 },
  { id: 'retirement-calculator', name: 'Retirement Calculator', icon: '🧓', desc: 'Country-specific retirement planning. NSSF/PenCom/GEPF projections.', href: '/tools/retirement-calculator', category: 'financial', tier: 'T1', status: 'planned', phase: 'Phase 2', countries: ['ALL'], revenue: 'Affiliate pensions', estTraffic: 6000, estRevenue: 300, priority: 84 },
  { id: 'mobile-money-fees', name: 'Mobile Money Fee Checker', icon: '📱', desc: 'Compare M-Pesa, MTN MoMo, Airtel Money, OPay fees instantly.', href: '/tools/mobile-money-fees', category: 'african', tier: 'T2', status: 'planned', phase: 'Phase 2', countries: ['ALL'], revenue: 'Affiliate', estTraffic: 15000, estRevenue: 400, priority: 92 },
  { id: 'whatsapp-catalog', name: 'WhatsApp Catalog Generator', icon: '💬', desc: 'Create product catalogs for WhatsApp Business. Dominant e-commerce channel.', href: '/tools/whatsapp-catalog', category: 'ecommerce', tier: 'T2', status: 'planned', phase: 'Phase 2', countries: ['ALL'], revenue: 'Premium', estTraffic: 8000, estRevenue: 250, priority: 85 },
  { id: 'shipping-calculator', name: 'Shipping Cost Calculator', icon: '📦', desc: 'Compare DHL, FedEx, GIG, Aramex, The Courier Guy rates.', href: '/tools/shipping-calculator', category: 'ecommerce', tier: 'T2', status: 'planned', phase: 'Phase 2', countries: ['ALL'], revenue: 'Affiliate', estTraffic: 6000, estRevenue: 200, priority: 80 },
  { id: 'business-plan', name: 'Business Plan Generator', icon: '📊', desc: 'AfDB/DFI-aware business plans with local regulations built in.', href: '/tools/business-plan', category: 'data-productivity', tier: 'T1', status: 'planned', phase: 'Phase 2', countries: ['ALL'], revenue: 'Premium', estTraffic: 8000, estRevenue: 400, priority: 88 },
  { id: 'tax-calendar', name: 'Tax Compliance Calendar', icon: '📅', desc: 'All filing deadlines per country with premium SMS/email alerts.', href: '/tools/tax-calendar', category: 'legal', tier: 'T2', status: 'planned', phase: 'Phase 2', countries: ['ALL'], revenue: 'Premium alerts', estTraffic: 5000, estRevenue: 200, priority: 82 },
  { id: 'payroll', name: 'Payroll Processor (MVP)', icon: '💳', desc: 'Bulk PAYE calculation + payslip generation. SaaS $15/month.', href: '/tools/payroll', category: 'financial', tier: 'T1', status: 'planned', phase: 'Phase 2', countries: ['ALL'], revenue: 'SaaS $15/mo', estTraffic: 3000, estRevenue: 1000, priority: 94 },
  { id: 'savings-group', name: 'Ajo / Chama / Tontine Calculator', icon: '💸', desc: 'Rotating savings groups. Contributions, payouts, fair ordering.', href: '/tools/savings-group', category: 'african', tier: 'T2', status: 'planned', phase: 'Phase 2', countries: ['ALL'], revenue: 'Freemium', estTraffic: 6000, estRevenue: 150, priority: 80 },
  { id: 'business-registration', name: 'Business Registration Guide', icon: '🏛️', desc: 'Step-by-step business registration for all 54 African countries.', href: '/tools/business-registration', category: 'legal', tier: 'T2', status: 'planned', phase: 'Phase 2', countries: ['ALL'], revenue: 'Premium templates', estTraffic: 7000, estRevenue: 250, priority: 83 },
  { id: 'legal-templates', name: 'Legal Document Templates', icon: '⚖️', desc: 'NDA, contracts, agreements per legal system (common law, civil law, mixed).', href: '/tools/legal-templates', category: 'legal', tier: 'T1', status: 'planned', phase: 'Phase 2', countries: ['ALL'], revenue: 'Premium $5-10/doc', estTraffic: 5000, estRevenue: 500, priority: 89 },

  // ═══════════════════════════════════════════════════════════
  //  PHASE 3 — MOAT (Jul–Aug 2026)
  //  AfroTranslate, AfroEditor, Legal Templates
  // ═══════════════════════════════════════════════════════════
  { id: 'translate', name: 'AfroTranslate', icon: '🌍', desc: 'Translate between 10+ African languages: Yoruba, Igbo, Hausa, Swahili, Amharic, Zulu, Twi, Wolof.', href: '/tools/translate', category: 'language', tier: 'T1', status: 'planned', phase: 'Phase 3', countries: ['ALL'], revenue: 'API licensing', estTraffic: 30000, estRevenue: 2000, priority: 99 },
  { id: 'keyboard', name: 'Local Language Keyboard', icon: '⌨️', desc: "Type in Ge'ez, N'Ko, Tifinagh, Vai, Adlam scripts. In-browser.", href: '/tools/keyboard', category: 'language', tier: 'T2', status: 'planned', phase: 'Phase 3', countries: ['ALL'], revenue: 'Free + API', estTraffic: 8000, estRevenue: 100, priority: 75 },
  { id: 'name-meaning', name: 'Name Translator/Meaning', icon: '👤', desc: 'African name origins and meanings. 200+ ethnicities covered.', href: '/tools/name-meaning', category: 'language', tier: 'T2', status: 'planned', phase: 'Phase 3', countries: ['ALL'], revenue: 'Ad-supported', estTraffic: 12000, estRevenue: 200, priority: 84 },
  { id: 'proverbs', name: 'Proverb Library', icon: '📜', desc: 'Searchable African proverbs by country, language, and theme.', href: '/tools/proverbs', category: 'language', tier: 'T3', status: 'planned', phase: 'Phase 3', countries: ['ALL'], revenue: 'Ad-supported', estTraffic: 5000, estRevenue: 80, priority: 65 },
  { id: 'photo-editor', name: 'AfroEditor (Photo Editor)', icon: '🖌️', desc: 'Browser-based Photoshop. Canvas API + WebGL. Premium HD export.', href: '/tools/photo-editor', category: 'image-design', tier: 'T1', status: 'planned', phase: 'Phase 3', countries: ['ALL'], revenue: 'Premium HD export', estTraffic: 20000, estRevenue: 1000, priority: 96 },
  { id: 'logo-maker', name: 'Logo Maker', icon: '🎭', desc: 'Adinkra symbols, African motifs, SVG export. Premium source files.', href: '/tools/logo-maker', category: 'image-design', tier: 'T1', status: 'planned', phase: 'Phase 3', countries: ['ALL'], revenue: 'Premium source files', estTraffic: 10000, estRevenue: 500, priority: 88 },
  { id: 'social-templates', name: 'Social Media Templates', icon: '📱', desc: 'African holidays, events, business templates for Instagram/Twitter/LinkedIn.', href: '/tools/social-templates', category: 'image-design', tier: 'T2', status: 'planned', phase: 'Phase 3', countries: ['ALL'], revenue: 'Premium packs', estTraffic: 8000, estRevenue: 300, priority: 82 },
  { id: 'pdf-form-filler', name: 'PDF Form Filler', icon: '✏️', desc: 'Fill, sign, and annotate PDFs in-browser. Premium form templates.', href: '/tools/pdf-form-filler', category: 'document-pdf', tier: 'T1', status: 'planned', phase: 'Phase 3', countries: ['ALL'], revenue: 'Premium templates', estTraffic: 12000, estRevenue: 400, priority: 90 },
  { id: 'pdf-to-word', name: 'PDF to Word Converter', icon: '📄', desc: 'Convert PDF to editable Word document. Layout preservation via pdf.js.', href: '/tools/pdf-to-word', category: 'document-pdf', tier: 'T2', status: 'planned', phase: 'Phase 3', countries: ['ALL'], revenue: 'Premium batch', estTraffic: 15000, estRevenue: 350, priority: 89 },
  { id: 'plagiarism-checker', name: 'Plagiarism Checker', icon: '🔎', desc: 'Web source checking. University market. Premium deep scan.', href: '/tools/plagiarism-checker', category: 'education', tier: 'T1', status: 'planned', phase: 'Phase 3', countries: ['ALL'], revenue: 'Premium deep scan', estTraffic: 10000, estRevenue: 500, priority: 88 },
  { id: 'code-playground', name: 'Code Playground', icon: '💻', desc: 'Python/JS/HTML in-browser. No install needed. Premium AI tutor.', href: '/tools/code-playground', category: 'education', tier: 'T2', status: 'planned', phase: 'Phase 3', countries: ['ALL'], revenue: 'Premium AI tutor', estTraffic: 8000, estRevenue: 300, priority: 82 },
  { id: 'planting-calendar', name: 'Crop Planting Calendar', icon: '🌱', desc: '200+ crops, African climate zones. Premium agri-business reports.', href: '/tools/planting-calendar', category: 'health', tier: 'T2', status: 'planned', phase: 'Phase 3', countries: ['ALL'], revenue: 'Premium + agri', estTraffic: 6000, estRevenue: 200, priority: 78 },
  { id: 'solar-calculator', name: 'Solar Panel Calculator', icon: '☀️', desc: 'African irradiance data, battery sizing, ROI vs generator.', href: '/tools/solar-calculator', category: 'engineering', tier: 'T1', status: 'planned', phase: 'Phase 3', countries: ['ALL'], revenue: 'Affiliate', estTraffic: 8000, estRevenue: 600, priority: 87 },
  { id: 'market-prices', name: 'Market Price Tracker', icon: '📈', desc: 'Staple commodity prices across Africa. Premium API access.', href: '/tools/market-prices', category: 'health', tier: 'T1', status: 'planned', phase: 'Phase 3', countries: ['ALL'], revenue: 'Premium + API', estTraffic: 10000, estRevenue: 500, priority: 86 },

  // ═══════════════════════════════════════════════════════════
  //  PHASE 4 — PLATFORM (Sep–Oct 2026)
  //  CAD, Dev Tools, TTS, Spreadsheet Editor
  // ═══════════════════════════════════════════════════════════
  { id: 'cad-draw', name: 'AfroDraw (2D CAD)', icon: '📐', desc: 'DXF import/export with African building standards. Freemium + enterprise.', href: '/tools/cad-draw', category: 'engineering', tier: 'T1', status: 'planned', phase: 'Phase 4', countries: ['ALL'], revenue: 'Freemium + enterprise', estTraffic: 5000, estRevenue: 500, priority: 85 },
  { id: 'floor-plan', name: 'Floor Plan Designer', icon: '🏗️', desc: 'African housing standard templates. Premium 3D view.', href: '/tools/floor-plan', category: 'engineering', tier: 'T1', status: 'planned', phase: 'Phase 4', countries: ['ALL'], revenue: 'Premium 3D view', estTraffic: 6000, estRevenue: 400, priority: 83 },
  { id: 'structural-calc', name: 'Structural Calculator', icon: '🔩', desc: 'KEBS/SABS/SON building code calculations. Premium reports.', href: '/tools/structural-calc', category: 'engineering', tier: 'T2', status: 'planned', phase: 'Phase 4', countries: ['ALL'], revenue: 'Premium reports', estTraffic: 3000, estRevenue: 200, priority: 76 },
  { id: 'boq-generator', name: 'Bill of Quantities Generator', icon: '📋', desc: 'Local material prices per country. Enterprise API access.', href: '/tools/boq-generator', category: 'engineering', tier: 'T1', status: 'planned', phase: 'Phase 4', countries: ['ALL'], revenue: 'Enterprise API', estTraffic: 4000, estRevenue: 400, priority: 82 },
  { id: 'inventory', name: 'Inventory Tracker', icon: '📦', desc: 'Barcode scanning, low-stock alerts. Freemium.', href: '/tools/inventory', category: 'ecommerce', tier: 'T1', status: 'planned', phase: 'Phase 4', countries: ['ALL'], revenue: 'Freemium', estTraffic: 5000, estRevenue: 300, priority: 80 },
  { id: 'ussd-simulator', name: 'USSD Code Simulator', icon: '📞', desc: 'Visual USSD menu builder for African fintech developers.', href: '/tools/ussd-simulator', category: 'developer', tier: 'T1', status: 'planned', phase: 'Phase 4', countries: ['ALL'], revenue: 'Premium export', estTraffic: 4000, estRevenue: 300, priority: 78 },
  { id: 'api-tester', name: 'API Tester (Postman Lite)', icon: '🧪', desc: 'REST API testing in-browser. No install needed.', href: '/tools/api-tester', category: 'developer', tier: 'T2', status: 'planned', phase: 'Phase 4', countries: ['ALL'], revenue: 'Freemium', estTraffic: 5000, estRevenue: 200, priority: 77 },
  { id: 'sql-playground', name: 'SQL Playground', icon: '🗄️', desc: 'SQLite in-browser. Practice SQL without any installation.', href: '/tools/sql-playground', category: 'developer', tier: 'T2', status: 'planned', phase: 'Phase 4', countries: ['ALL'], revenue: 'Freemium', estTraffic: 4000, estRevenue: 150, priority: 74 },
  { id: 'text-to-speech', name: 'Text-to-Speech (African)', icon: '🗣️', desc: 'Swahili, Yoruba, Hausa, Amharic TTS. API licensing.', href: '/tools/text-to-speech', category: 'language', tier: 'T1', status: 'planned', phase: 'Phase 4', countries: ['ALL'], revenue: 'API licensing', estTraffic: 8000, estRevenue: 800, priority: 90 },
  { id: 'spreadsheet', name: 'Spreadsheet Viewer/Editor', icon: '📊', desc: 'In-browser .xlsx editor. No upload to server. Premium export.', href: '/tools/spreadsheet', category: 'data-productivity', tier: 'T1', status: 'planned', phase: 'Phase 4', countries: ['ALL'], revenue: 'Premium export', estTraffic: 10000, estRevenue: 400, priority: 85 },
  { id: 'data-viz', name: 'Data Visualizer', icon: '📉', desc: 'Paste data → instant charts. Africa map visualizations. Premium embed.', href: '/tools/data-viz', category: 'data-productivity', tier: 'T2', status: 'planned', phase: 'Phase 4', countries: ['ALL'], revenue: 'Premium embed', estTraffic: 6000, estRevenue: 250, priority: 80 },
  { id: 'data-compliance', name: 'GDPR/POPIA Compliance Checker', icon: '🛡️', desc: 'POPIA/NDPR/DPA compliance check per country. Premium audit report.', href: '/tools/data-compliance', category: 'legal', tier: 'T1', status: 'planned', phase: 'Phase 4', countries: ['ALL'], revenue: 'Premium audit', estTraffic: 4000, estRevenue: 400, priority: 82 },
  { id: 'remittance-v2', name: 'Remittance Comparator v2', icon: '🌐', desc: 'Expanded corridors, real-time rates, API access. Affiliate goldmine.', href: '/tools/remittance-v2', category: 'african', tier: 'T1', status: 'planned', phase: 'Phase 4', countries: ['ALL'], revenue: 'Affiliate', estTraffic: 15000, estRevenue: 2000, priority: 95 },
];


// ═══════════════════════════════════════════════════════════
// CATEGORY DEFINITIONS
// ═══════════════════════════════════════════════════════════
var AFRO_CATEGORIES = {
  'financial':        { name: 'Financial',              color: '#008751', bg: '#eaf5ef' },
  'document-pdf':     { name: 'Document & PDF',         color: '#3b82f6', bg: '#eff6ff' },
  'developer':        { name: 'Developer',              color: '#8b5cf6', bg: '#ede9fe' },
  'image-design':     { name: 'Image & Design',         color: '#ec4899', bg: '#fdf2f8' },
  'education':        { name: 'Education',              color: '#f59e0b', bg: '#fef3c7' },
  'health':           { name: 'Agriculture & Health',   color: '#0f766e', bg: '#ccfbf1' },
  'african':          { name: 'Uniquely African',       color: '#dc2626', bg: '#fef2f2' },
  'data-productivity':{ name: 'Data & Productivity',    color: '#6366f1', bg: '#eef2ff' },
  'language':         { name: 'Language & Translation',  color: '#a855f7', bg: '#faf5ff' },
  'engineering':      { name: 'Engineering & CAD',       color: '#78716c', bg: '#f5f5f4' },
  'ecommerce':        { name: 'E-Commerce',             color: '#ea580c', bg: '#fff7ed' },
  'legal':            { name: 'Legal & Government',      color: '#0369a1', bg: '#e0f2fe' },
};


// ═══════════════════════════════════════════════════════════
// RENDER FUNCTIONS — Call these from any page
// ═══════════════════════════════════════════════════════════

function getToolsFor(countryCode, filter) {
  return AFRO_TOOLS.filter(function(t) {
    var countryMatch = t.countries.indexOf('ALL') !== -1 || t.countries.indexOf(countryCode) !== -1;
    var statusMatch = !filter || t.status === filter;
    return countryMatch && statusMatch;
  });
}

function renderToolGrid(containerId, countryCode, opts) {
  opts = opts || {};
  var showComing = opts.showComing !== false;
  var maxLive = opts.maxLive || 50;
  var maxComing = opts.maxComing || 12;

  var container = document.getElementById(containerId);
  if (!container) return;

  var liveTools = getToolsFor(countryCode, 'live');
  var newTools = getToolsFor(countryCode, 'new');
  var queuedTools = getToolsFor(countryCode, 'queued');
  var comingTools = queuedTools.concat(getToolsFor(countryCode, 'planned'));

  var allLive = liveTools.concat(newTools).slice(0, maxLive);
  var html = '';

  if (allLive.length) {
    html += '<h2 style="font-size:20px;font-weight:800;color:#111;margin:0 0 16px;display:flex;align-items:center;gap:10px;font-family:\'DM Sans\',sans-serif"><span style="width:8px;height:8px;border-radius:50%;background:#008751;flex-shrink:0"></span> Available Now</h2>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;margin-bottom:32px">';
    allLive.forEach(function(t) {
      var cat = AFRO_CATEGORIES[t.category] || { color: '#888', bg: '#f0f0f0' };
      var badge = t.status === 'new'
        ? '<span style="position:absolute;top:14px;right:14px;padding:3px 10px;background:#fef3cd;border:1px solid #fde68a;border-radius:100px;font-size:10px;font-weight:700;color:#92400e;text-transform:uppercase">✨ New</span>'
        : '<span style="position:absolute;top:14px;right:14px;padding:3px 10px;background:#eaf5ef;border:1px solid rgba(0,135,81,.2);border-radius:100px;font-size:10px;font-weight:700;color:#008751;text-transform:uppercase;display:flex;align-items:center;gap:4px"><span style="width:6px;height:6px;background:#008751;border-radius:50%;animation:pulse 2s infinite"></span>Live</span>';
      html += '<a href="'+t.href+'" style="background:#fff;border:1.5px solid #e5e7eb;border-radius:14px;text-decoration:none;color:inherit;transition:.25s;display:block;position:relative;overflow:hidden;padding:24px 22px">'
        + badge
        + '<div style="width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:14px;background:'+cat.bg+'">'+t.icon+'</div>'
        + '<h3 style="font-size:16px;font-weight:700;margin-bottom:6px;color:#111;text-transform:none;letter-spacing:normal;font-family:\'DM Sans\',sans-serif">'+t.name+'</h3>'
        + '<p style="font-size:14px;color:#374151;line-height:1.6">'+t.desc+'</p>'
        + '</a>';
    });
    html += '</div>';
  }

  if (showComing && comingTools.length) {
    var shown = comingTools.slice(0, maxComing);
    html += '<h2 style="font-size:20px;font-weight:800;color:#111;margin:0 0 16px;display:flex;align-items:center;gap:10px;font-family:\'DM Sans\',sans-serif"><span style="width:8px;height:8px;border-radius:50%;background:#d1d5db;flex-shrink:0"></span> Coming Soon</h2>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px">';
    shown.forEach(function(t) {
      var cat = AFRO_CATEGORIES[t.category] || { color: '#888', bg: '#f0f0f0' };
      html += '<div style="background:#fff;border:1.5px solid #e5e7eb;border-radius:14px;position:relative;opacity:.6;overflow:hidden;padding:24px 22px">'
        + '<span style="position:absolute;top:14px;right:14px;padding:3px 10px;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:100px;font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase">Coming Soon</span>'
        + '<div style="width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:14px;background:'+cat.bg+'">'+t.icon+'</div>'
        + '<h3 style="font-size:16px;font-weight:700;margin-bottom:6px;color:#374151;text-transform:none;letter-spacing:normal;font-family:\'DM Sans\',sans-serif">'+t.name+'</h3>'
        + '<p style="font-size:14px;color:#6b7280;line-height:1.6">'+t.desc+'</p>'
        + '</div>';
    });
    html += '</div>';
  }

  container.innerHTML = html;
}

// Pulse animation
if (typeof document !== 'undefined' && !document.getElementById('afro-tool-styles')) {
  var style = document.createElement('style');
  style.id = 'afro-tool-styles';
  style.textContent = '@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}} [style*="border:1.5px solid #e5e7eb"]:hover{border-color:#008751!important;box-shadow:0 8px 24px rgba(0,0,0,.06);transform:translateY(-2px)}';
  document.head.appendChild(style);
}
