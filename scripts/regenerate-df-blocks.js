#!/usr/bin/env node
/**
 * regenerate-df-blocks.js — Replaces the generic, repeated "df-upgrade" /
 * "df-faq" copy (and its mismatched FAQPage JSON-LD) with tool- and
 * category-specific text.
 *
 * Why: 311 tool pages shipped an identical bolt-on block whose copy read
 * "planning summary ready with inputs, assumptions, caveats…", leaked internal
 * audit flags to users ("Quality checks addressed here: disclaimer, sources,
 * officialSource…"), and carried a boilerplate FAQPage schema that did NOT match
 * the 3 visible FAQs (a structured-data mismatch). This regenerates the copy from
 * each tool's real registry metadata (name, category, description, countries),
 * removes the jargon leak, and makes the FAQ schema mirror the visible FAQ.
 *
 * The interactive form wiring (data-df-form / data-df-result / data-df-base /
 * data-df-copy) is preserved so assets/js/pages/english-df-app-upgrades.js keeps
 * working; only human-readable copy + the FAQ schema change.
 *
 * Usage:
 *   node scripts/regenerate-df-blocks.js            (audit: counts + sample diff)
 *   node scripts/regenerate-df-blocks.js --fix      (apply)
 *   node scripts/regenerate-df-blocks.js --only crypto-profit   (single tool)
 */

const fs = require('fs');
const path = require('path');
const { writeFileSyncWithRetry, renameSyncWithRetry } = require('./lib/safe-write');

const ROOT = path.resolve(__dirname, '..');
const FIX = process.argv.includes('--fix');
const onlyIdx = process.argv.indexOf('--only');
const ONLY = onlyIdx > -1 ? process.argv[onlyIdx + 1] : null;

const dir = require(path.join(ROOT, 'data/tool-directory.json'));
const byId = new Map(dir.map((t) => [t.id, t]));

// ── Category phrasing ───────────────────────────────────────────────────────
// noun     = what the user enters (for "Enter <noun>")
// outcome  = what they get back
// verify   = what to confirm before acting
// advice   = trailing not-X-advice caveat (may be empty)
const MONEY = {
  noun: 'your amounts, rates and dates',
  outcome: 'a clear estimate with the assumptions shown',
  verify: 'current prices, fees and official rates for your country',
  advice: ' It is a planning estimate, not financial advice.',
};
const CAT = {
  financial: MONEY, fintech: MONEY, trade: MONEY, ecommerce: MONEY,
  'small-business': MONEY, 'personal-finance': MONEY, insurance: MONEY,
  'hr-payroll': { noun: 'pay, tenure and contract details', outcome: 'a worked estimate with the formula shown', verify: 'the current statutory rules and your contract terms', advice: ' It is a planning estimate, not legal or payroll advice.' },
  transport: { noun: 'your route, distance and costs', outcome: 'a cost or income estimate you can plan around', verify: 'current fuel prices, fares and local charges', advice: '' },
  sports: { noun: 'the figures or match details', outcome: 'a clear projection you can compare', verify: 'official data before relying on it — outcomes are never guaranteed', advice: '' },
  health: { noun: 'your measurements and details', outcome: 'personalised ranges and guidance', verify: 'a qualified health professional for anything important', advice: ' It is educational and not medical advice.' },
  government: { noun: 'your situation and documents', outcome: 'a checklist and estimate for the process', verify: 'the official government or agency source', advice: ' It is general information, not legal advice.' },
  diaspora: { noun: 'your profile and documents', outcome: 'a readiness checklist and estimate', verify: 'the official immigration or embassy source', advice: ' It is general information, not immigration advice.' },
  legal: { noun: 'your details', outcome: 'a draft or checklist you can adapt', verify: 'a qualified lawyer and the current local law', advice: ' It is general information, not legal advice.' },
  agriculture: { noun: 'your farm figures and local prices', outcome: 'a costed estimate for your plan', verify: 'current input prices and your local conditions', advice: '' },
  engineering: { noun: 'your measurements and quantities', outcome: 'a costed material and labour estimate', verify: 'current local material prices and site specifics', advice: '' },
  energy: { noun: 'your appliances, usage and tariff', outcome: 'a sizing and cost estimate', verify: 'your actual tariff and equipment specs', advice: '' },
  security: { noun: 'your site details and requirements', outcome: 'a costed plan for the setup', verify: 'current equipment prices and installer quotes', advice: '' },
  creative: { noun: 'your options', outcome: 'a ready-to-use result you can copy or download', verify: 'the output looks right for your use', advice: '' },
  'religious-cultural': { noun: 'your location and dates', outcome: 'a clear schedule and reference', verify: 'your local mosque, church or community timetable', advice: '' },
  african: { noun: 'your details', outcome: 'a clear, locally-relevant result', verify: 'a local source for anything important', advice: '' },
  language: { noun: 'your text or word', outcome: 'a clear result with local context', verify: 'a native speaker for important or public use', advice: '' },
  'travel-tourism': { noun: 'your route and dates', outcome: 'a planning estimate for the trip', verify: 'the airline or operator for live prices and rules', advice: '' },
  'data-productivity': { noun: 'your data', outcome: 'an organised, ready-to-use result', verify: 'the figures before you share them', advice: '' },
  'document-pdf': { noun: 'your file and options', outcome: 'the processed document, ready to download', verify: 'the output before sending it on', advice: '' },
};
const DEFAULT_CAT = { noun: 'your details', outcome: 'a clear result you can act on', verify: 'a reliable local source before acting', advice: '' };

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function shortName(name) { return String(name || '').split(/\s+[—–-]\s+/)[0].trim() || name; }
function regionPhrase(countries) {
  if (!Array.isArray(countries) || !countries.length) return 'African users';
  if (countries.some((c) => /all african/i.test(c))) return 'all 54 African countries';
  const uniq = countries.filter(Boolean);
  if (uniq.length <= 3) return uniq.join(', ');
  return `${uniq.slice(0, 3).join(', ')} and other African markets`;
}

function buildCopy(tool, key) {
  const c = CAT[tool.category_key] || DEFAULT_CAT;
  const name = shortName(tool.name);
  const full = tool.name;
  const region = regionPhrase(tool.countries);
  const heading = `${esc(name)}: quick guide`;
  const intro = `Not sure how to get the most from the ${esc(name)}? Enter ${esc(c.noun)} and it returns ${esc(c.outcome)} — built for ${esc(region)}.`;
  const bullets = [
    `<li><strong>What you get:</strong> ${esc(c.outcome)}, so you can move from a quick look to a real decision.</li>`,
    `<li><strong>How it works:</strong> the ${esc(name)} takes ${esc(c.noun)} and shows the working, not just a single number.</li>`,
    `<li><strong>What to check:</strong> confirm ${esc(c.verify)} before you rely on the result.${esc(c.advice)}</li>`,
  ].join('');
  const note = `<strong>Reviewed 2026.</strong> Results are a guide — always confirm ${esc(c.verify)} before acting.${esc(c.advice)}`;
  const base = `${esc(name)} — enter your details above to see your result.`;
  const faqs = [
    { q: `How do I use the ${name}?`, a: `Enter ${c.noun} in the fields above. The ${name} then gives you ${c.outcome} you can use straight away.` },
    { q: `How accurate is the ${name}?`, a: `It is as accurate as the values you enter and shows the assumptions behind the result. Always confirm ${c.verify} before you rely on it.${c.advice}` },
    { q: `Is the ${name} free, and does it cover my country?`, a: `Yes — it is completely free, works on any phone or computer with no signup, and is built for ${region}.` },
  ];
  return { name, full, heading, intro, bullets, note, base, faqs };
}

function regenerate(html, tool, key) {
  const cp = buildCopy(tool, key);
  let changed = 0;
  const before = html;

  // 1. Heading
  html = html.replace(/(<h2>)[^<]*decision workspace(<\/h2>)/i, `$1${cp.heading}$2`);
  // 2. Intro paragraph (first <p> after the kicker/heading)
  html = html.replace(/(<span class="df-upgrade__kicker">[^<]*<\/span>\s*<h2>[^<]*<\/h2>\s*)<p>[\s\S]*?<\/p>/i,
    `$1<p>${cp.intro}</p>`);
  // 3. Bullets (removes the internal "Quality checks addressed here" leak)
  html = html.replace(/<ul class="df-upgrade__bullets">[\s\S]*?<\/ul>/i,
    `<ul class="df-upgrade__bullets">${cp.bullets}</ul>`);
  // 4. Note
  html = html.replace(/<p class="df-upgrade__note">[\s\S]*?<\/p>/i,
    `<p class="df-upgrade__note">${cp.note}</p>`);
  // 5. df-result output: keep data-df-result key, refresh data-df-base + text
  html = html.replace(/(<output class="df-result" data-df-result="[^"]*") data-df-base="[^"]*"([^>]*>)[\s\S]*?(<\/output>)/i,
    `$1 data-df-base="${cp.base}"$2${cp.base}$3`);
  // 6. Visible FAQ grid
  const faqGrid = cp.faqs.map((f) =>
    `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('');
  html = html.replace(/<div class="df-faq__grid">[\s\S]*?<\/div>/i,
    `<div class="df-faq__grid">${faqGrid}</div>`);
  // 7. Generic FAQPage JSON-LD → mirror the visible FAQ.
  // Iterate scripts individually (never span multiple <script> blocks) and only
  // replace the FAQPage whose ANSWER text carries the generic df signature, so
  // legitimate hand-written FAQ schemas on other pages are left untouched.
  const faqSchema = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: cp.faqs.map((f) => ({
      '@type': 'Question', name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
  const SIG = /planning summary|educational planning workflow|official result|What should I verify before acting/i;
  const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  for (const sm of scripts) {
    let j;
    try { j = JSON.parse(sm[1].trim()); } catch (e) { continue; }
    if (j && j['@type'] === 'FAQPage' && SIG.test(JSON.stringify(j))) {
      html = html.replace(sm[0], `<script type="application/ld+json">\n${JSON.stringify(faqSchema)}\n</script>`);
      break;
    }
  }

  changed = html !== before ? 1 : 0;
  return { html, changed };
}

// ── Collect ─────────────────────────────────────────────────────────────────
function walk(d) {
  const out = [];
  if (!fs.existsSync(d)) return out;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = path.join(d, e.name);
    if (e.isDirectory()) { if (!['node_modules', '.git'].includes(e.name)) out.push(...walk(f)); }
    else if (e.name === 'index.html') out.push(f);
  }
  return out;
}
const files = [...walk(path.join(ROOT, 'tools')), ...walk(path.join(ROOT, 'crypto'))]
  .filter((f) => {
    const h = fs.readFileSync(f, 'utf-8');
    return h.includes('class="df-upgrade"') || h.includes('class="df-faq"');
  });

let applied = 0, skipped = 0, noMeta = 0, sampleShown = 0;
for (const file of files) {
  let html = fs.readFileSync(file, 'utf-8');
  const km = html.match(/data-df-upgrade="([^"]+)"/)
    || html.match(/aria-labelledby="([^"]+)-faq-title"/);
  if (!km) { skipped++; continue; }
  const key = km[1];
  if (ONLY && key !== ONLY) continue;
  const tool = byId.get(key);
  if (!tool) { noMeta++; continue; }

  const { html: out, changed } = regenerate(html, tool, key);
  if (!changed) { skipped++; continue; }

  if (!FIX && sampleShown < 2) {
    sampleShown++;
    const g = out.match(/<div class="df-faq__grid">[\s\S]*?<\/div>/);
    console.log(`\n── sample: ${path.relative(ROOT, file)} (${key} / ${tool.category_key}) ──`);
    console.log(g ? g[0].replace(/<\/details>/g, '</details>\n   ') : '(no faq)');
  }

  if (FIX) {
    const tmp = file + '.tmp-df';
    writeFileSyncWithRetry(tmp, out, 'utf-8');
    renameSyncWithRetry(tmp, file);
  }
  applied++;
}

console.log('\n🔧 df-block regeneration');
console.log('═'.repeat(56));
console.log(`Pages with df-upgrade: ${files.length}`);
console.log(`${FIX ? 'Regenerated' : 'Would regenerate'}: ${applied}`);
console.log(`Skipped (no change/no key): ${skipped}${noMeta ? ` | no metadata: ${noMeta}` : ''}`);
if (!FIX) console.log('\nRun with --fix to apply.');
console.log('');
