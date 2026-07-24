/**
 * Bulk update category pages with themed hero banners and descriptions
 * Run: node scripts/update-category-heroes.js
 */
const fs = require('fs');
const path = require('path');

const categories = [
  {
    file: 'salary-tax/index.html',
    gradient: 'linear-gradient(135deg,#0c1929 0%,#1a2744 40%,#1e3a5f 100%)',
    glow1: 'rgba(59,130,246,.12)', glow2: 'rgba(96,165,250,.08)',
    accent: '#60a5fa', accentLight: '#93c5fd',
    ctaBg: '#2563eb', ctaText: '#2563eb',
    quoteBorder: '#3b82f6',
    description: `<section style="background:#f8fafc;padding:48px 24px;border-top:1px solid #e2e8f0"><div style="max-width:900px;margin:0 auto">
<h2 style="font-size:1.4rem;font-weight:800;color:#111827;margin-bottom:16px">Accurate Salary & Tax Calculators for Every African Country</h2>
<p style="font-size:.93rem;color:#374151;line-height:1.85;margin-bottom:14px">Understanding your take-home pay shouldn't require a chartered accountant. AfroTools provides free, accurate PAYE (Pay As You Earn) calculators for all 54 African countries, built with real tax tables from each country's revenue authority. Whether you're a salaried employee in Lagos checking your FIRS deductions, a Nairobi professional verifying KRA calculations, or an HR manager in Johannesburg running SARS payroll compliance checks, our tools give you instant, reliable results.</p>
<p style="font-size:.93rem;color:#374151;line-height:1.85;margin-bottom:14px">We track every budget amendment and tax table change across the continent. When Kenya's Finance Act amends PAYE bands, when Nigeria's NTA introduces new reliefs, when Ghana's GRA updates its consolidated tax tables, our calculators are updated within days. This commitment to accuracy sets AfroTools apart from generic salary calculators that use outdated rates or approximate tax brackets.</p>
<p style="font-size:.93rem;color:#374151;line-height:1.85;margin-bottom:14px"><strong>Key features:</strong> Country-specific pension deductions (Nigeria NHF/NSITF, Kenya NSSF/SHIF, SA UIF/SDL), medical aid tax credits, housing allowances, bonus tax calculations, and multi-currency support. Every calculation shows a full breakdown so you understand exactly where your money goes.</p>
<p style="font-size:.93rem;color:#374151;line-height:1.85">All salary and tax tools are completely free, work on any device, and require no registration. Your data stays in your browser and is never sent to our servers.</p>
</div></section>`
  },
  {
    file: 'document-pdf/index.html',
    gradient: 'linear-gradient(135deg,#0f172a 0%,#1e293b 40%,#334155 100%)',
    glow1: 'rgba(100,116,139,.12)', glow2: 'rgba(148,163,184,.08)',
    accent: '#94a3b8', accentLight: '#cbd5e1',
    ctaBg: '#475569', ctaText: '#475569',
    quoteBorder: '#64748b',
    description: `<section style="background:#f8fafc;padding:48px 24px;border-top:1px solid #e2e8f0"><div style="max-width:900px;margin:0 auto">
<h2 style="font-size:1.4rem;font-weight:800;color:#111827;margin-bottom:16px">Professional Document & PDF Tools That Run in Your Browser</h2>
<p style="font-size:.93rem;color:#374151;line-height:1.85;margin-bottom:14px">Working with PDFs in Africa often means slow uploads to sketchy websites, expensive Adobe subscriptions, or desktop software that won't run on older machines. AfroTools' document suite changes that. Every tool runs entirely in your browser. Your files never leave your device. No upload limits, no watermarks, no subscriptions.</p>
<p style="font-size:.93rem;color:#374151;line-height:1.85;margin-bottom:14px">Our PDF Workspace handles the operations you need most: merge multiple PDFs into one document, split large files into sections, compress oversized files for email, convert pages to images, add watermarks for confidential documents, password-protect sensitive files, and add page numbers for professional formatting. The CV Builder creates professional resumes with African job market formatting standards, while the Invoice Generator produces VAT-compliant invoices for Nigerian, Kenyan, South African, and Ghanaian businesses.</p>
<p style="font-size:.93rem;color:#374151;line-height:1.85"><strong>Why browser-based matters:</strong> In many African cities, bandwidth is expensive and internet connections are unreliable. Our tools process files locally using WebAssembly, meaning you get desktop-grade performance without uploading a single byte. This also means your confidential contracts, financial statements, and personal documents stay completely private.</p>
</div></section>`
  },
  {
    file: 'image-design/index.html',
    gradient: 'linear-gradient(135deg,#1a0a2e 0%,#2d1b4e 40%,#1e3a5f 100%)',
    glow1: 'rgba(168,85,247,.12)', glow2: 'rgba(99,102,241,.08)',
    accent: '#a78bfa', accentLight: '#c4b5fd',
    ctaBg: '#7c3aed', ctaText: '#7c3aed',
    quoteBorder: '#8b5cf6',
    description: `<section style="background:#f8fafc;padding:48px 24px;border-top:1px solid #e2e8f0"><div style="max-width:900px;margin:0 auto">
<h2 style="font-size:1.4rem;font-weight:800;color:#111827;margin-bottom:16px">Image Tools Built for African Creatives and Professionals</h2>
<p style="font-size:.93rem;color:#374151;line-height:1.85;margin-bottom:14px">Whether you're a social media manager in Lagos, a photographer in Nairobi, or a student in Accra preparing documents, image tools are essential. AfroTools provides professional-grade image processing that runs entirely in your browser, no expensive software subscriptions, no slow cloud uploads eating your data bundle, no watermarks on your exports.</p>
<p style="font-size:.93rem;color:#374151;line-height:1.85;margin-bottom:14px">Our Image Compressor reduces file sizes by up to 90% without visible quality loss, perfect for sharing on WhatsApp or uploading to slow connections. The Passport Photo Maker knows the exact specifications for every African embassy and immigration office, from Nigeria Immigration Service to South Africa Home Affairs to Kenya e-Citizen portal. The Background Remover uses AI to cleanly extract subjects for product photos, profile pictures, and marketing materials.</p>
<p style="font-size:.93rem;color:#374151;line-height:1.85"><strong>Additional tools:</strong> QR code generator for businesses, social media card generator for content creators, meme generator with African templates, and a logo maker for startups. All tools process images locally on your device for maximum privacy and speed.</p>
</div></section>`
  },
  {
    file: 'developer-tools/index.html',
    gradient: 'linear-gradient(135deg,#0a1628 0%,#0f2233 40%,#164e63 100%)',
    glow1: 'rgba(6,182,212,.12)', glow2: 'rgba(34,211,238,.06)',
    accent: '#22d3ee', accentLight: '#67e8f9',
    ctaBg: '#0891b2', ctaText: '#0891b2',
    quoteBorder: '#06b6d4',
    description: `<section style="background:#f8fafc;padding:48px 24px;border-top:1px solid #e2e8f0"><div style="max-width:900px;margin:0 auto">
<h2 style="font-size:1.4rem;font-weight:800;color:#111827;margin-bottom:16px">Developer Utilities You'll Open Every Day</h2>
<p style="font-size:.93rem;color:#374151;line-height:1.85;margin-bottom:14px">Every developer has a handful of utilities they reach for constantly: formatting a JSON response, encoding a string to Base64, testing a regex pattern, decoding a JWT token, generating a hash. AfroTools bundles these essential tools into one fast, clean interface. No ads cluttering the screen, no cookie consent popups, no registration walls. Just the tool you need, instantly.</p>
<p style="font-size:.93rem;color:#374151;line-height:1.85;margin-bottom:14px">Our JSON Formatter handles large payloads with syntax highlighting and tree view. The Regex Tester shows matches in real-time with capture group highlighting. The JWT Decoder breaks down header, payload, and signature with expiry warnings. The Hash Generator supports MD5, SHA-1, SHA-256, and SHA-512. The Base64 tool handles both encoding and decoding with file support.</p>
<p style="font-size:.93rem;color:#374151;line-height:1.85"><strong>Built for African developers:</strong> These tools work offline once loaded, perfect for developers in areas with unstable internet. They're lightweight, fast on older hardware, and respect your data, nothing is ever sent to a server. Whether you're coding in a tech hub in Lagos, a co-working space in Kigali, or a university lab in Cape Town, these tools just work.</p>
</div></section>`
  },
  {
    file: 'education/index.html',
    gradient: 'linear-gradient(135deg,#1a1000 0%,#1e293b 40%,#1e3a5f 100%)',
    glow1: 'rgba(245,158,11,.1)', glow2: 'rgba(59,130,246,.08)',
    accent: '#f59e0b', accentLight: '#fbbf24',
    ctaBg: '#d97706', ctaText: '#d97706',
    quoteBorder: '#f59e0b',
    description: '' // Education already has an SEO section
  },
  {
    file: 'health/index.html',
    gradient: 'linear-gradient(135deg,#052e16 0%,#14532d 40%,#134e4a 100%)',
    glow1: 'rgba(16,185,129,.12)', glow2: 'rgba(20,184,166,.08)',
    accent: '#34d399', accentLight: '#6ee7b7',
    ctaBg: '#059669', ctaText: '#059669',
    quoteBorder: '#10b981',
    description: `<section style="background:#f0fdf4;padding:48px 24px;border-top:1px solid #d1fae5"><div style="max-width:900px;margin:0 auto">
<h2 style="font-size:1.4rem;font-weight:800;color:#111827;margin-bottom:16px">Health Tools Designed for African Realities</h2>
<p style="font-size:.93rem;color:#374151;line-height:1.85;margin-bottom:14px">Health information in Africa faces unique challenges. BMI calculators calibrated for Western populations may not account for body composition differences across African ethnicities. Calorie counters that don't include fufu, ugali, injera, or pap are useless for most Africans. Health insurance calculators that don't know NHIS, SHIF, or Discovery Health leave millions without accurate cost estimates.</p>
<p style="font-size:.93rem;color:#374151;line-height:1.85;margin-bottom:14px">AfroTools addresses these gaps. Our BMI Calculator includes WHO guidelines alongside research on African body composition. The calorie counter features a database of African foods with accurate nutritional data, from jollof rice to nyama choma to bunny chow. Health insurance tools support Nigeria's NHIS, Kenya's SHIF (formerly NHIF), and South Africa's medical aid schemes with accurate contribution and benefit calculations.</p>
<p style="font-size:.93rem;color:#374151;line-height:1.85"><strong>Coming soon:</strong> Malaria risk assessment by region, sickle cell trait compatibility checker, ovulation tracking, pregnancy due date calculator with African hospital cost estimates, and crop planting calendars by climate zone. All tools are informational and do not replace professional medical advice.</p>
</div></section>`
  },
  {
    file: 'engineering/index.html',
    gradient: 'linear-gradient(135deg,#1a1a2e 0%,#2d2d44 40%,#44403c 100%)',
    glow1: 'rgba(251,146,60,.1)', glow2: 'rgba(148,163,184,.08)',
    accent: '#fb923c', accentLight: '#fdba74',
    ctaBg: '#ea580c', ctaText: '#ea580c',
    quoteBorder: '#f97316',
    description: `<section style="background:#faf5f0;padding:48px 24px;border-top:1px solid #e7e0d8"><div style="max-width:900px;margin:0 auto">
<h2 style="font-size:1.4rem;font-weight:800;color:#111827;margin-bottom:16px">Engineering & Construction Tools for African Projects</h2>
<p style="font-size:.93rem;color:#374151;line-height:1.85;margin-bottom:14px">Africa is building. From Lagos high-rises to Nairobi apartment blocks to Johannesburg industrial parks, construction is booming across the continent. But most engineering software is expensive, designed for Western standards, and assumes materials and labour costs from Europe or North America. AfroTools builds engineering calculators calibrated for African construction realities.</p>
<p style="font-size:.93rem;color:#374151;line-height:1.85;margin-bottom:14px">Our AfroDraft 2D CAD tool provides a free browser-based drawing environment for floor plans, site layouts, and technical drawings. The BOQ Builder generates professional bills of quantities with categories for substructure, superstructure, roofing, finishes, M&E, and external works, all with multi-currency support for NGN, KES, ZAR, GHS, and more. Solar panel sizing tools calculate optimal configurations for African solar irradiance levels, critical for off-grid and backup power installations.</p>
<p style="font-size:.93rem;color:#374151;line-height:1.85"><strong>In the pipeline:</strong> Beam calculators for simply supported and cantilever beams, concrete mix design tools, paint calculators for room dimensions and coats, electrical load calculators, plumbing pipe sizers, and rebar calculators. All built with African building standards and local material specifications in mind.</p>
</div></section>`
  },
  {
    file: 'vat-business-tax/index.html',
    gradient: 'linear-gradient(135deg,#052e16 0%,#1a2e05 40%,#3f3f00 100%)',
    glow1: 'rgba(34,197,94,.1)', glow2: 'rgba(234,179,8,.08)',
    accent: '#facc15', accentLight: '#fde68a',
    ctaBg: '#ca8a04', ctaText: '#ca8a04',
    quoteBorder: '#eab308',
    description: `<section style="background:#fefce8;padding:48px 24px;border-top:1px solid #fef08a"><div style="max-width:900px;margin:0 auto">
<h2 style="font-size:1.4rem;font-weight:800;color:#111827;margin-bottom:16px">VAT & Business Tax Tools for African Entrepreneurs</h2>
<p style="font-size:.93rem;color:#374151;line-height:1.85;margin-bottom:14px">Running a business in Africa means navigating complex tax systems that vary dramatically from country to country. Nigeria charges 7.5% VAT, Kenya 16%, South Africa 15%, Ghana layers 15% VAT plus NHIL plus GETFund levies. Import duties, withholding taxes, and sector-specific exemptions add further complexity. AfroTools simplifies this with calculators built for every African tax jurisdiction.</p>
<p style="font-size:.93rem;color:#374151;line-height:1.85;margin-bottom:14px">Our VAT calculators handle both VAT-inclusive and VAT-exclusive calculations for every African country, with accurate rates and exemption categories. The Profit Margin Calculator helps businesses price products correctly after accounting for all costs. The Break-Even Analyser shows exactly how many units or how much revenue you need to cover fixed and variable costs. The Invoice Generator produces professional, tax-compliant invoices with correct VAT formatting.</p>
<p style="font-size:.93rem;color:#374151;line-height:1.85"><strong>For SMEs and entrepreneurs:</strong> These tools are designed for the small and medium businesses that drive African economies. Whether you're running a shop in Lekki, a tech startup in Westlands, or a farm in Limpopo, understanding your margins, break-even point, and tax obligations is essential for survival and growth.</p>
</div></section>`
  },
  {
    file: 'language/index.html',
    gradient: 'linear-gradient(135deg,#0f172a 0%,#134e4a 40%,#2e1065 100%)',
    glow1: 'rgba(20,184,166,.1)', glow2: 'rgba(139,92,246,.08)',
    accent: '#2dd4bf', accentLight: '#5eead4',
    ctaBg: '#7c3aed', ctaText: '#7c3aed',
    quoteBorder: '#14b8a6',
    description: `<section style="background:#f0fdfa;padding:48px 24px;border-top:1px solid #ccfbf1"><div style="max-width:900px;margin:0 auto">
<h2 style="font-size:1.4rem;font-weight:800;color:#111827;margin-bottom:16px">African Language Tools the World Forgot to Build</h2>
<p style="font-size:.93rem;color:#374151;line-height:1.85;margin-bottom:14px">Africa is home to over 2,000 languages, yet global technology companies support fewer than a dozen African languages in their products. Google Translate covers Swahili and a handful of others, but what about Yoruba with its critical tone marks? Igbo with its complex vowel system? Amharic written in the beautiful Ge'ez script? Zulu with its click consonants? AfroTools is building language tools that respect the richness and complexity of African languages.</p>
<p style="font-size:.93rem;color:#374151;line-height:1.85;margin-bottom:14px">Our phrasebook tools go beyond simple word lists. They include cultural context, regional variations, formal and informal registers, and audio pronunciation where possible. The Yoruba tools properly handle tone marks (acute, grave, mid) which completely change word meanings. The Swahili tools cover noun classes and verb conjugation patterns that are essential for proper communication.</p>
<p style="font-size:.93rem;color:#374151;line-height:1.85"><strong>Our mission:</strong> Every African language deserves quality digital tools. We're starting with the most widely spoken languages, Swahili, Yoruba, Hausa, Amharic, Zulu, and Igbo, and expanding from there. Text-to-speech, typing tools for special characters, and translation aids are all in development. If your language is missing, tell us and we'll prioritise it.</p>
</div></section>`
  },
  {
    file: 'data-productivity/index.html',
    gradient: 'linear-gradient(135deg,#0f172a 0%,#134e4a 40%,#1e293b 100%)',
    glow1: 'rgba(20,184,166,.1)', glow2: 'rgba(100,116,139,.08)',
    accent: '#2dd4bf', accentLight: '#5eead4',
    ctaBg: '#0d9488', ctaText: '#0d9488',
    quoteBorder: '#14b8a6',
    description: `<section style="background:#f0fdfa;padding:48px 24px;border-top:1px solid #ccfbf1"><div style="max-width:900px;margin:0 auto">
<h2 style="font-size:1.4rem;font-weight:800;color:#111827;margin-bottom:16px">Business & Productivity Tools for African Professionals</h2>
<p style="font-size:.93rem;color:#374151;line-height:1.85;margin-bottom:14px">Productivity tools shouldn't require expensive subscriptions or constant internet connectivity. AfroTools provides essential business and data tools that run in your browser, work offline once loaded, and respect your data privacy. From investment return calculators to data visualisation, from Pomodoro timers to spreadsheet viewers, these are the utilities African professionals reach for daily.</p>
<p style="font-size:.93rem;color:#374151;line-height:1.85;margin-bottom:14px">Our Investment Return Calculator projects user-entered return, contribution timing, compounding and inflation assumptions without inventing market rates or recommending a provider. The Break-Even Analyser helps entrepreneurs understand their cost structures. The Unit Converter handles not just standard metric/imperial conversions but also African-specific units like plots, hectares, and local measurement systems.</p>
<p style="font-size:.93rem;color:#374151;line-height:1.85"><strong>Built for African workflows:</strong> Whether you're a startup founder in Lagos tracking burn rate, a farmer in the Rift Valley calculating crop yields, or a consultant in Sandton preparing client reports, these tools are designed for speed and simplicity. No learning curve, no account required, just open and use.</p>
</div></section>`
  }
];

// Mortgage-property has a completely different structure, handle separately

categories.forEach(cat => {
  const filePath = path.join(__dirname, '..', cat.file);
  if (!fs.existsSync(filePath)) {
    console.log(`SKIP: ${cat.file} not found`);
    return;
  }

  let html = fs.readFileSync(filePath, 'utf8');

  // 1. Replace hero gradient
  html = html.replace(
    /\.hero\{background:linear-gradient\(135deg,[^}]+?padding:/,
    `.hero{background:${cat.gradient};padding:`
  );

  // 2. Replace h1 b accent color
  html = html.replace(
    /\.hero h1 b\{color:#[a-f0-9]+\}/,
    `.hero h1 b{color:${cat.accentLight}}`
  );

  // 3. Replace .hs-n accent color
  html = html.replace(
    /\.hs-n\{[^}]*color:#[a-f0-9]+/,
    (match) => match.replace(/color:#[a-f0-9]+/, `color:${cat.accent}`)
  );

  // 4. Replace quote border color
  html = html.replace(
    /\.quote\{[^}]*border-left:3px solid #[a-f0-9]+/,
    (match) => match.replace(/border-left:3px solid #[a-f0-9]+/, `border-left:3px solid ${cat.quoteBorder}`)
  );

  // 5. Replace hero::before glow colors
  html = html.replace(
    /\.hero::before\{[^}]*background:radial-gradient\(circle at 30% 50%,rgba\([^)]+\)[^,]*,transparent[^)]*\),radial-gradient\(circle at 70% 30%,rgba\([^)]+\)[^,]*,transparent[^)]*\)/,
    (match) => {
      return match
        .replace(/rgba\(99,102,241,[.\d]+\)/, cat.glow1)
        .replace(/rgba\(168,85,247,[.\d]+\)/, cat.glow2);
    }
  );

  // 6. Replace CTA background
  html = html.replace(
    /\.cta\{background:#[a-f0-9]+/,
    `.cta{background:${cat.ctaBg}`
  );
  html = html.replace(
    /\.cta a\{[^}]*color:#[a-f0-9]+/,
    (match) => match.replace(/color:#[a-f0-9]+/, `color:${cat.ctaText}`)
  );

  // 7. Replace hero-ey badge background tint to match accent
  html = html.replace(
    /\.hero-ey\{[^}]*background:rgba\(255,255,255,\.06\);border:1px solid rgba\(255,255,255,\.08\)/,
    `.hero-ey{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12)`
  );

  // 8. Add description section before footer (if description is provided and not already present)
  if (cat.description && !html.includes('font-size:1.4rem;font-weight:800')) {
    // Insert before <afro-footer>
    html = html.replace(
      '<afro-footer>',
      cat.description + '\n<afro-footer>'
    );
  }

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`DONE: ${cat.file}`);
});

// Handle mortgage-property separately (different structure)
const mortgagePath = path.join(__dirname, '..', 'mortgage-property/index.html');
if (fs.existsSync(mortgagePath)) {
  let html = fs.readFileSync(mortgagePath, 'utf8');

  // Update hero gradient to navy-gold theme
  html = html.replace(
    /\.cat-hero \{[^}]*background: linear-gradient\(135deg, var\(--color-text\) 0%, #1e293b 50%, #334155 100%\)/,
    `.cat-hero {
      background: linear-gradient(135deg, #0a1628 0%, #1a2744 40%, #2d1800 100%)`
  );

  // Update accent colors to gold
  html = html.replace(/color: #818cf8;/g, 'color: #f59e0b;');
  html = html.replace(/color: #c7d2fe;/g, 'color: #fbbf24;');
  html = html.replace(
    /\.hs-num \{ font-size: 1.9rem; font-weight: 800; color: #818cf8/,
    '.hs-num { font-size: 1.9rem; font-weight: 800; color: #f59e0b'
  );
  html = html.replace(
    /\.cat-hero h1 span \{ color: #c7d2fe; \}/,
    '.cat-hero h1 span { color: #fbbf24; }'
  );

  // Update glow to gold
  html = html.replace(
    /rgba\(99,102,241,.08\)/g,
    'rgba(245,158,11,.1)'
  );
  html = html.replace(
    /rgba\(168,85,247,.06\)/g,
    'rgba(234,179,8,.06)'
  );

  // Update quote border
  html = html.replace(
    'border-left:3px solid #818cf8',
    'border-left:3px solid #f59e0b'
  );

  // Update faq open border
  html = html.replace(
    '.faq-item[open] { border-color: #818cf8; }',
    '.faq-item[open] { border-color: #f59e0b; }'
  );

  // Update CTA button
  html = html.replace(
    /background: #818cf8;/,
    'background: #f59e0b;'
  );
  html = html.replace(
    /\.btn-g:hover \{ background: #6366f1; \}/,
    '.btn-g:hover { background: #d97706; }'
  );

  // Add description section before FAQ if not present
  if (!html.includes('African Mortgage')) {
    const descSection = `
<!-- DESCRIPTION -->
<section style="background:#fffbeb;padding:48px 24px;border-top:1px solid #fef3c7"><div style="max-width:900px;margin:0 auto">
<h2 style="font-size:1.4rem;font-weight:800;color:#111827;margin-bottom:16px">African Mortgage & Property Calculators You Can Trust</h2>
<p style="font-size:.93rem;color:#374151;line-height:1.85;margin-bottom:14px">Buying property in Africa is fundamentally different from buying in Europe or America. Mortgage rates in Nigeria can reach 18-22% from commercial banks (or 6% through NHF), Kenya's rates hover around 12-14%, and South Africa's prime rate fluctuates with the repo rate. Beyond the mortgage itself, stamp duty, transfer costs, legal fees, agent commissions, and survey fees can add 8-15% to the purchase price. Our calculators show you the true cost of buying, not just the monthly repayment.</p>
<p style="font-size:.93rem;color:#374151;line-height:1.85;margin-bottom:14px">AfroTools provides 10 dedicated property tools covering mortgage repayment calculations, affordability checks based on real African bank DSR rules, stamp duty for 8 countries, rental yield analysis, rent-vs-buy comparisons, property transfer cost breakdowns, renovation cost estimates, first-home buyer savings plans (including NHF Nigeria, FLISP South Africa, Kenya Social Housing), and property ROI analysis that compares real estate returns against local stock markets and fixed deposits.</p>
<p style="font-size:.93rem;color:#374151;line-height:1.85">Every tool uses country-specific rates, fees, and regulations. We don't use generic formulas with US assumptions. When South Africa's Transfer Duty thresholds change, when Nigeria's NHF contribution rules are updated, or when Kenya's stamp duty bands shift, our tools are updated to reflect the new reality.</p>
</div></section>
`;
    html = html.replace('<!-- ── FAQ ──', descSection + '<!-- ── FAQ ──');
  }

  fs.writeFileSync(mortgagePath, html, 'utf8');
  console.log('DONE: mortgage-property/index.html');
}

console.log('\nAll category heroes updated!');
