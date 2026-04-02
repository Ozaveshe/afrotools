#!/usr/bin/env node
/**
 * AFROTOOLS — Generate Missing Registry Entries
 * ===================================================================
 * Scans /tools/ subdirectories for built tools (with index.html)
 * that are NOT in tool-registry.js, extracts metadata, and outputs
 * ready-to-paste registry entries.
 *
 * Usage:
 *   node scripts/generate-missing-entries.js
 *   node scripts/generate-missing-entries.js --json   (machine-readable)
 * ===================================================================
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const TOOLS_DIR = path.join(ROOT, 'tools');

// ── Load registry ──────────────────────────────────────────────
const registryPath = path.join(ROOT, 'assets', 'js', 'components', 'tool-registry.js');
const registryCode = fs.readFileSync(registryPath, 'utf8');

function FakeEvent() {}
const sandbox = {
  window: {},
  CustomEvent: FakeEvent,
  document: {
    readyState: 'complete',
    getElementById: () => null,
    createElement: () => ({ textContent: '' }),
    head: { appendChild: () => {} },
    addEventListener: () => {},
    dispatchEvent: () => {},
    querySelector: () => null,
  }
};
vm.runInNewContext(registryCode, sandbox);
const AFRO_TOOLS = sandbox.AFRO_TOOLS;

// ── Build set of registered tool directory slugs ───────────────
const registeredSlugs = new Set();
const registeredIds = new Set();
AFRO_TOOLS.forEach(t => {
  registeredIds.add(t.id);
  // Extract slug from href like /tools/minimum-wage/ → minimum-wage
  const m = t.href.match(/^\/tools\/([^/]+)/);
  if (m) registeredSlugs.add(m[1]);
});

// ── Category detection from breadcrumbs & ID patterns ──────────
const BREADCRUMB_MAP = {
  'salary & tax': 'financial',
  'salary, tax & crypto': 'financial',
  'financial': 'financial',
  'personal finance': 'financial',
  'hr & payroll': 'hr-payroll',
  'document & pdf': 'document-pdf',
  'image & design': 'image-design',
  'developer tools': 'developer',
  'education': 'education',
  'health & wellness': 'health',
  'health': 'health',
  'insurance': 'insurance',
  'fintech & banking': 'fintech',
  'fintech': 'fintech',
  'agriculture': 'agriculture',
  'vat & business tax': 'ecommerce',
  'legal & compliance': 'legal',
  'legal': 'legal',
  'business & roi': 'data-productivity',
  'language & translation': 'language',
  'uniquely african': 'african',
  'trade & import': 'trade',
  'telecom & mobile': 'telecom',
  'telecom': 'telecom',
  'energy & utilities': 'energy',
  'energy': 'energy',
  'engineering & construction': 'engineering',
  'engineering': 'engineering',
  'government & civic': 'government',
  'government': 'government',
  'small business & sme': 'small-business',
  'small business': 'small-business',
  'transport & logistics': 'transport',
  'transport': 'transport',
  'personal finance': 'personal-finance',
  'diaspora': 'diaspora',
  'diaspora tools': 'diaspora',
  'religious & cultural': 'religious-cultural',
  'climate & environment': 'climate',
  'climate': 'climate',
  'sports & entertainment': 'sports',
  'sports': 'sports',
  'mining & extractives': 'mining',
  'mining': 'mining',
  'creative economy': 'creative',
  'creative': 'creative',
  'creator suite': 'creative',
  'security & safety': 'security',
  'security': 'security',
  'travel & tourism': 'travel-tourism',
  'travel tools': 'travel-tourism',
  'travel': 'travel-tourism',
  'career & development': 'career',
  'career': 'career',
  'manufacturing': 'small-business',
};

const ID_PATTERN_MAP = [
  [/^creator-/, 'creative'],
  [/^afro/, 'african'],
  [/-invoice|-receipt/, 'document-pdf'],
  [/commit-|docker-|pwa-|sitemap-gen|api-dir/, 'developer'],
  [/cctv-|cyber|phishing|password|data-breach/, 'security'],
  [/halal|islamic|prayer|ramadan|tithe|zakat|faraid|naming-ceremony/, 'religious-cultural'],
  [/safari|beach-holiday|festival-travel|hotel|airbnb|visa-tracker|travel-pack|airport-transfer|immigration/, 'travel-tourism'],
  [/afcon|betting|fantasy|match-ticket|nollywood|sports-scholar/, 'sports'],
  [/carbon|deforest|ewaste|flood|rainfall|recycl|sustainab|tree-plant|waste-manage|water-scarc/, 'climate'],
  [/artisanal|diamond|gold-price|mining/, 'mining'],
  [/fleet|last-mile|parking|route-cost|toll|truck|vehicle-oper/, 'transport'],
  [/electricity|fuel-cost|solar-cost|power-consump|charcoal|coal-pric|petroleum/, 'energy'],
  [/crop-insurance|fire-insurance|marine-insurance|microinsur|professional-indem|claim-track|insurance-fraud/, 'insurance'],
  [/boarding-school|classroom|course-load|edu-sav|exam-time|ielts|interview-prep|plagiarism|tutoring/, 'education'],
  [/air-quality|cholera|ebola|eye-care|hep-b|hiv|mental-health|medical-tourism|overseas-health|pregnan|tb-track|travel-vaccin|vaccine/, 'health'],
  [/brand-collab|clothing-brand|event-dec|factory-setup|fashion-brand|freelanc|graphic-design|guard-service|influencer|merchant|packaging|pos-fee|pricing-calc|production-cost|tailor|wholesale|youtube-rev/, 'small-business'],
  [/affidavit|board-res|breach-notif|contract-gen|cookie-consent|cover-letter|dpa-|dpia|foreign-company|freelance-contract|ip-protect|legal-aid|partner.*agree|power-of-att|sharehold|statutory|trademark|winding/, 'legal'],
  [/50-30-20|ajo-track|bill-split|debt-snow|emergency-fund|envelope|net-worth|zero-based|thrift|side-hustle|money-market|loan-consol|credit-score|multi-income/, 'personal-finance'],
  [/budget$|budget-/, 'personal-finance'],
  [/career-|cert-roi|salary-neg/, 'career'],
  [/annual-return|business-lic|tin-guide|nafdac|work-permit|kenya-dpa/, 'government'],
  [/b2b-pay|invoice-factor|qr-pay|crypto.*tax|wht-calc/, 'fintech'],
  [/cross-border|customs|export-duty|made-in-africa|tariff|shipping-weight|supply-chain|trade-credit/, 'trade'],
  [/african-palette|album-budget|art-commis|film-budget|linkedin-opt|music-royalty|personal-brand|photography|podcast|social-media-cal/, 'creative'],
  [/asset-finance|bond-yield|dca-calc|dividend|fire-calc|retirement|stock-portfolio/, 'financial'],
  [/rent-own|property-vs|stamp-duty/, 'financial'],
  [/ankara|aso-ebi|wedding/, 'african'],
  [/boq-|paint-calc|roof-calc|concrete|rebar/, 'engineering'],
  [/arabic|amharic/, 'language'],
  [/african-domain|african-meal|african-name|african-proverb/, 'african'],
  [/diaspora|return-migra/, 'diaspora'],
];

function detectCategory(slug, html) {
  // Try breadcrumb JSON-LD first
  const ldMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  if (ldMatch) {
    for (const block of ldMatch) {
      try {
        const jsonStr = block.replace(/<\/?script[^>]*>/gi, '');
        const data = JSON.parse(jsonStr);
        if (data['@type'] === 'BreadcrumbList' && data.itemListElement) {
          const items = data.itemListElement;
          // Category is usually the 2nd item (after Home)
          if (items.length >= 3) {
            const catName = items[1].name || items[1].item?.name || '';
            const key = catName.toLowerCase().trim();
            if (BREADCRUMB_MAP[key]) return BREADCRUMB_MAP[key];
          }
        }
      } catch (e) { /* skip malformed JSON-LD */ }
    }
  }

  // Try ID pattern matching
  for (const [pattern, category] of ID_PATTERN_MAP) {
    if (pattern.test(slug)) return category;
  }

  return 'african'; // fallback
}

function extractMeta(htmlPath, slug) {
  const html = fs.readFileSync(htmlPath, 'utf8');

  // Extract title
  let name = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch) {
    name = titleMatch[1]
      .replace(/\s*[\|—–-]\s*AfroTools.*$/i, '')
      .replace(/\s*\|\s*Free.*$/i, '')
      .trim();
  }

  // Extract description
  let desc = name + ' for all 54 African countries.';
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  if (descMatch) {
    desc = descMatch[1].trim();
    // Truncate to ~160 chars for registry
    if (desc.length > 200) desc = desc.substring(0, 197) + '...';
  }

  // Extract icon from existing emoji in title or page
  let icon = '🔧';
  const iconMatch = html.match(/class="(?:tool-hero-icon|tc-icon|tool-icon)"[^>]*>([^<]{1,4})</);
  if (iconMatch && /[\u{1F000}-\u{1FFFF}]/u.test(iconMatch[1])) {
    icon = iconMatch[1].trim();
  } else {
    // Try og:title or h1 for emoji
    const emojiMatch = html.match(/([\u{1F300}-\u{1FFFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}])/u);
    if (emojiMatch) icon = emojiMatch[1];
  }

  const category = detectCategory(slug, html);

  return { name, desc, icon, category };
}

// ── Scan for missing tools ─────────────────────────────────────
const entries = fs.readdirSync(TOOLS_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name)
  .filter(slug => {
    if (registeredSlugs.has(slug)) return false;
    const indexPath = path.join(TOOLS_DIR, slug, 'index.html');
    return fs.existsSync(indexPath);
  })
  .map(slug => {
    const indexPath = path.join(TOOLS_DIR, slug, 'index.html');
    const meta = extractMeta(indexPath, slug);
    return {
      id: slug,
      name: meta.name,
      icon: meta.icon,
      desc: meta.desc,
      href: `/tools/${slug}/`,
      category: meta.category,
      tier: 'T3',
      status: 'live',
      phase: 'LIVE',
      countries: ['ALL'],
      revenue: 'Freemium',
      estTraffic: 1000,
      estRevenue: 15,
      priority: 50,
    };
  });

// ── Output ─────────────────────────────────────────────────────
const isJson = process.argv.includes('--json');

if (isJson) {
  console.log(JSON.stringify(entries, null, 2));
} else {
  console.log(`\n// ═══════════════════════════════════════════════════════════`);
  console.log(`//  AUTO-GENERATED — ${entries.length} missing tools found on disk`);
  console.log(`//  Generated: ${new Date().toISOString().split('T')[0]}`);
  console.log(`// ═══════════════════════════════════════════════════════════\n`);

  // Group by category
  const grouped = {};
  entries.forEach(e => {
    if (!grouped[e.category]) grouped[e.category] = [];
    grouped[e.category].push(e);
  });

  for (const [cat, tools] of Object.entries(grouped).sort()) {
    console.log(`  // ── ${cat} (${tools.length} tools) ──`);
    tools.sort((a, b) => a.id.localeCompare(b.id));
    for (const t of tools) {
      const desc = t.desc.replace(/'/g, "\\'");
      const name = t.name.replace(/'/g, "\\'");
      console.log(`  { id: '${t.id}', name: '${name}', icon: '${t.icon}', desc: '${desc}', href: '${t.href}', category: '${t.category}', tier: '${t.tier}', status: '${t.status}', phase: '${t.phase}', countries: ['ALL'], revenue: '${t.revenue}', estTraffic: ${t.estTraffic}, estRevenue: ${t.estRevenue}, priority: ${t.priority} },`);
    }
    console.log('');
  }

  console.log(`\n// Total: ${entries.length} missing tools`);

  // Also report empty scaffolds
  const empties = fs.readdirSync(TOOLS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .filter(slug => {
      const indexPath = path.join(TOOLS_DIR, slug, 'index.html');
      return !fs.existsSync(indexPath);
    });

  console.log(`\n// ═══════════════════════════════════════════════════════════`);
  console.log(`//  EMPTY SCAFFOLDS — ${empties.length} directories with no index.html`);
  console.log(`// ═══════════════════════════════════════════════════════════`);
  empties.sort().forEach(s => console.log(`//   tools/${s}/`));
}
