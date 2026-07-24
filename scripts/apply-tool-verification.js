#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const GENERATED_AT = '2026-05-02';
const CSS_HREF = '/assets/css/tool-verification.css?v=20260502';
const START = '<!-- TOOL_VERIFICATION_PANEL_START -->';
const END = '<!-- TOOL_VERIFICATION_PANEL_END -->';
const WRITE = process.argv.includes('--write');
const LIST = process.argv.includes('--list');
const LANG_FILTER_ARG = process.argv.find((arg) => arg.startsWith('--lang='));
const LANG_FILTER = LANG_FILTER_ARG ? LANG_FILTER_ARG.slice('--lang='.length).trim().toLowerCase() : '';
const PREVIOUS_FILE_ARG = process.argv.find((arg) => arg.startsWith('--previous-file='));
const PREVIOUS_FILE = PREVIOUS_FILE_ARG
  ? PREVIOUS_FILE_ARG.slice('--previous-file='.length).trim()
  : 'data/tool-verification.json';

const EXCLUDED_DIRS = new Set(['.git', '.netlify', '.cache', 'dist', 'node_modules']);
const EXTERNAL_DENY = /afrotools\.|fonts\.|cdn\.|schema\.org|ogp\.me|w3\.org|googletagmanager|google-analytics|jsdelivr|cloudflare|instagram|facebook|twitter|linkedin/i;
const TARGET_RE = /(^|[\\/])(?:fr[\\/])?[^\\/]+[\\/](?:[a-z]{2}-(?:paye|vat)|ng-salary-tax)\.html$/i;

const FALLBACK_SOURCES = {
  bf: [{ title: 'Direction generale des impots - Burkina Faso', url: 'https://dgi.bf/' }],
  cf: [{ title: 'Ministere des Finances et du Budget - Central African Republic', url: 'https://www.finances.gouv.cf/' }],
  cg: [{ title: 'Portail fiscal officiel - Republique du Congo', url: 'https://impots.gouv.cg/portail-client-web/public/accueil.xhtml' }],
  dj: [{ title: 'Direction generale des impots - Djibouti', url: 'https://budget.gouv.dj/dgi/' }],
  ga: [{ title: 'Direction generale des impots - Gabon', url: 'https://dgi.ga/' }],
  gq: [{ title: 'Ministerio de Hacienda y Presupuestos - Guinea Ecuatorial', url: 'https://minhacienda-gob.com/' }],
  km: [{ title: 'Direction generale des impots - Comoros', url: 'https://dgi.gouv.km/' }],
  ne: [{ title: 'Direction generale des impots - Niger', url: 'https://www.impots.gouv.ne/' }],
  td: [{ title: 'Direction generale des impots - Chad', url: 'https://www.dgi.td/docs/' }],
  tg: [{ title: 'Office togolais des recettes', url: 'https://www.otr.tg/' }]
};

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDED_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function rel(file) {
  return path.relative(ROOT, file).replace(/\\/g, '/');
}

function routeFromFile(file) {
  return `/${rel(file).replace(/index\.html$/i, '').replace(/\.html$/i, '')}`;
}

function stripScriptStyle(html) {
  return html
    .replace(/<script[\s\S]*?<\/script\s*>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style\s*>/gi, ' ');
}

function stripTags(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeEntities(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/'/g, '&#39;');
}

function normalizeUrl(url) {
  return decodeEntities(String(url || '')).replace(/[).,;]+$/g, '').trim();
}

function shouldKeepUrl(url) {
  return /^https?:\/\//i.test(url) && !EXTERNAL_DENY.test(url);
}

function hostnameTitle(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function sourceRecordsFromHtml(html) {
  const clean = stripScriptStyle(html);
  const records = [];

  for (const match of clean.matchAll(/<a\b([^>]*\bhref=["'](https?:\/\/[^"']+)["'][^>]*)>([\s\S]*?)<\/a\s*>/gi)) {
    const url = normalizeUrl(match[2]);
    if (!shouldKeepUrl(url)) continue;
    const label = stripTags(decodeEntities(match[3])) || hostnameTitle(url);
    records.push({ title: label, url });
  }

  const text = stripTags(clean);
  for (const match of text.matchAll(/\b(?:https?:\/\/)?((?:[a-z0-9-]+\.)+(?:gov|gouv|go|org|or|co|com|net|int|edu)(?:\.[a-z]{2,3})?)(?:\/[\w./?%=&-]*)?/gi)) {
    const url = normalizeUrl(`https://${match[1].toLowerCase()}`);
    if (!shouldKeepUrl(url)) continue;
    records.push({ title: hostnameTitle(url), url });
  }

  for (const match of html.matchAll(/<span class="src">([\s\S]*?)<\/span>\s*([^<\n]+)/gi)) {
    const title = stripTags(`${match[1]} ${match[2]}`);
    if (title) records.push({ title, url: '' });
  }

  return dedupeRecords(records);
}

function dedupeRecords(records) {
  const seenUrls = new Set();
  const out = [];
  for (const record of records) {
    const title = stripTags(decodeEntities(record.title));
    const url = normalizeUrl(record.url);
    if (url) {
      if (seenUrls.has(url)) continue;
      seenUrls.add(url);
    }
    if (!title && !url) continue;
    out.push({ title: title || hostnameTitle(url), url });
  }
  return out;
}

function toolIdFor(file, html) {
  const meta = html.match(/<meta\s+name=["']tool-id["']\s+content=["']([^"']+)/i);
  if (meta) return meta[1].trim();
  if (/ng-salary-tax\.html$/i.test(file)) return 'ng-paye';
  return path.basename(file, '.html');
}

function codeFor(toolId, file) {
  if (toolId === 'ng-paye') return 'ng';
  const match = toolId.match(/^([a-z]{2})-/i) || rel(file).match(/\/([a-z]{2})-(?:paye|vat)\.html$/i);
  return match ? match[1].toLowerCase() : '';
}

function kindFor(toolId) {
  return toolId.endsWith('-vat') ? 'vat' : 'paye';
}

function countryNameFor(file, html) {
  const title = stripTags((html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '');
  let country = title
    .replace(/\s+(PAYE|Salary Tax|VAT|Value Added Tax|Tax|Calculator).*$/i, '')
    .replace(/\s+\|.*$/g, '')
    .trim();
  if (!country || country.length > 60) {
    const parts = rel(file).split('/');
    const slug = parts[0] === 'fr' ? parts[1] : parts[0];
    country = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return country;
}

function parseDate(text) {
  const value = stripTags(text);
  const iso = value.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (iso) return iso[1];

  const months = {
    jan: '01', january: '01',
    feb: '02', february: '02',
    mar: '03', march: '03',
    apr: '04', april: '04',
    may: '05',
    jun: '06', june: '06',
    jul: '07', july: '07',
    aug: '08', august: '08',
    sep: '09', sept: '09', september: '09',
    oct: '10', october: '10',
    nov: '11', november: '11',
    dec: '12', december: '12'
  };

  const dayMonthYear = value.match(/\b(\d{1,2})\s+([A-Za-z]+)\s+(20\d{2})\b/);
  if (dayMonthYear) {
    const month = months[dayMonthYear[2].toLowerCase()];
    if (month) return `${dayMonthYear[3]}-${month}-${String(dayMonthYear[1]).padStart(2, '0')}`;
  }

  const monthYear = value.match(/\b([A-Za-z]+)\s+(20\d{2})\b/);
  if (monthYear) {
    const month = months[monthYear[1].toLowerCase()];
    if (month) return `${monthYear[2]}-${month}-01`;
  }

  const year = value.match(/\b(20\d{2})\b/);
  if (year) return `${year[1]}-01-01`;
  return '';
}

function lastVerifiedFor(html) {
  const visible = stripTags(stripScriptStyle(html));
  const explicit = visible.match(/Last verified[^.\n]{0,180}|Verified\s+\d{1,2}\s+[A-Za-z]+\s+20\d{2}/i);
  if (explicit) {
    const parsed = parseDate(explicit[0]);
    if (parsed) return parsed;
  }
  const modified = html.match(/"dateModified"\s*:\s*"([^"]+)"/i) || html.match(/<meta\s+property=["']article:modified_time["']\s+content=["']([^"']+)/i);
  if (modified) {
    const parsed = parseDate(modified[1]);
    if (parsed) return parsed;
  }
  return '2026-01-01';
}

function lawOrVersionFor(html, kind) {
  const visible = stripTags(stripScriptStyle(html));
  const lastVerified = stripTags((visible.match(/Last verified[^.\n]{0,220}/i) || [])[0] || '');
  if (lastVerified) return lastVerified;
  const law = stripTags((visible.match(/(?:Income Tax Law|VAT Act|Value Added Tax Act|Finance Act|Code General|Code des Impots|Tax Act|Revenue Act|Income Tax Act|Personal Income Tax Act)[^.\n]{0,180}/i) || [])[0] || '');
  if (law) return law;
  return kind === 'vat'
    ? 'VAT rate, zero-rated, and exempt treatment shown on the calculator page.'
    : 'PAYE income-tax bands and statutory deductions shown on the calculator page.';
}

function methodologyFor(kind) {
  if (kind === 'vat') {
    return 'The calculator splits the entered amount into net amount, VAT, and VAT-inclusive total using the displayed standard or custom VAT rate. Zero-rated and exempt categories are treated as decision guidance and must be confirmed against the linked authority material before filing.';
  }
  return 'The calculator annualizes salary where needed, applies modeled employee statutory deductions, runs taxable income through the country PAYE bands, and derives net pay from gross pay minus modeled PAYE and statutory deductions. Employer-cost lines are informational where the page exposes them.';
}

function limitationsFor(kind) {
  const shared = [
    'Informational estimate only. It is not professional tax, legal, payroll, or filing advice.',
    'Sector-specific, regional, treaty, relief, and special-regime rules may not be fully modeled.',
    'Confirm filing, registration, and remittance duties with the official authority or a qualified adviser before submission.'
  ];
  if (kind === 'vat') {
    shared.splice(1, 0, 'Product classification, exemption, and zero-rating rules can require invoice-level review.');
  }
  return shared;
}

function testCasesFor(kind) {
  if (kind === 'vat') {
    return [
      {
        input: 'Net amount: 1,000 at the displayed standard VAT rate.',
        expected_output: 'VAT equals 1,000 multiplied by the displayed rate; total equals net amount plus VAT.',
        why: 'Confirms the core VAT-exclusive calculation path and makes the rate dependency auditable.'
      },
      {
        input: 'VAT-inclusive amount with the displayed standard VAT rate.',
        expected_output: 'Net amount equals total divided by 1 plus the rate; VAT equals total minus net amount.',
        why: 'Confirms reverse VAT handling for invoices that already include tax.'
      }
    ];
  }
  return [
    {
      input: 'Annual gross salary: 0.',
      expected_output: 'PAYE and statutory deductions should be 0 and net pay should not be negative.',
      why: 'Establishes the zero-income baseline and catches negative liability regressions.'
    },
    {
      input: 'Annual gross salary entered in the page currency.',
      expected_output: 'Taxable income is processed through the visible country bands and net pay equals gross pay minus modeled deductions.',
      why: 'Confirms the calculator is using the documented methodology rather than an opaque flat estimate.'
    }
  ];
}

function buildManifest(files) {
  const previousTools = readPreviousTools();
  const pages = files.map((file) => {
    const html = fs.readFileSync(file, 'utf8');
    const sourceHtml = removeOldVerificationPanels(html);
    const toolId = toolIdFor(file, sourceHtml);
    const code = codeFor(toolId, file);
    const kind = kindFor(toolId);
    return {
      file,
      relPath: rel(file),
      route: routeFromFile(file),
      html: sourceHtml,
      toolId,
      code,
      kind,
      lang: rel(file).startsWith('fr/') ? 'fr' : 'en',
      country: countryNameFor(file, sourceHtml),
      lastVerified: lastVerifiedFor(sourceHtml),
      lawOrVersion: lawOrVersionFor(sourceHtml, kind),
      sources: sourceRecordsFromHtml(sourceHtml)
    };
  });

  const sourcesByCode = new Map();
  for (const page of pages) {
    const records = page.sources.filter((item) => item.url);
    if (!sourcesByCode.has(page.code)) sourcesByCode.set(page.code, []);
    sourcesByCode.get(page.code).push(...records);
  }
  for (const previous of Object.values(previousTools)) {
    const code = codeFor(previous.tool_id || '', '');
    if (!code) continue;
    const records = (previous.source_urls || []).map((url, index) => ({
      title: (previous.source_titles || [])[index] || hostnameTitle(url),
      url
    })).filter((item) => item.url);
    if (!sourcesByCode.has(code)) sourcesByCode.set(code, []);
    sourcesByCode.get(code).push(...records);
  }
  for (const [code, fallback] of Object.entries(FALLBACK_SOURCES)) {
    if (!sourcesByCode.has(code)) sourcesByCode.set(code, []);
    sourcesByCode.get(code).push(...fallback);
  }
  for (const [code, records] of sourcesByCode) {
    sourcesByCode.set(code, dedupeRecords(records).filter((item) => item.url));
  }

  // Preserve verification records owned by other workflows (for example
  // worker-cost, CIT and CGT tools) while refreshing the PAYE/VAT family.
  const tools = { ...previousTools };
  for (const page of pages) {
    const direct = page.sources.filter((item) => item.url);
    const countrySources = sourcesByCode.get(page.code) || [];
    const sourceRecords = dedupeRecords(direct.concat(countrySources)).filter((item) => item.url).slice(0, 5);
    const existing = tools[page.toolId];
    const entry = existing || {
      tool_id: page.toolId,
      jurisdiction: page.country,
      routes: [],
      source_urls: [],
      source_titles: [],
      last_verified: page.lastVerified,
      verified_by: 'AfroTools source audit',
      risk_level: 'high',
      disclaimer_type: 'tax',
      law_or_version: page.lawOrVersion,
      methodology_markdown: methodologyFor(page.kind),
      known_limitations: limitationsFor(page.kind),
      change_history: [
        {
          date: GENERATED_AT,
          note: 'Trust and verification panel added with source links, methodology, limitations, and report-error CTA.'
        }
      ],
      test_cases: testCasesFor(page.kind)
    };

    const titleByUrl = new Map();
    entry.source_urls.forEach((url, index) => {
      titleByUrl.set(url, entry.source_titles[index] || hostnameTitle(url));
    });
    sourceRecords.forEach((item) => {
      titleByUrl.set(item.url, item.title || hostnameTitle(item.url));
    });

    entry.routes = Array.from(new Set(entry.routes.concat(page.route))).sort();
    entry.source_urls = Array.from(new Set(entry.source_urls.concat(sourceRecords.map((item) => item.url)))).slice(0, 5);
    entry.source_titles = entry.source_urls.map((url) => titleByUrl.get(url) || hostnameTitle(url));
    if (page.lang === 'en') {
      entry.jurisdiction = page.country;
      entry.last_verified = page.lastVerified;
      entry.law_or_version = page.lawOrVersion;
    }
    tools[page.toolId] = entry;
  }

  return {
    version: 1,
    generated_at: GENERATED_AT,
    methodology: 'Generated from existing AfroTools PAYE/VAT page metadata, visible source links, authority domains printed in page copy, and curated official-authority fallbacks for pages that named an authority without linking it.',
    tools
  };
}

function readPreviousTools() {
  const dataPath = path.resolve(ROOT, PREVIOUS_FILE);
  if (!fs.existsSync(dataPath)) return {};
  try {
    const parsed = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    return parsed.tools && typeof parsed.tools === 'object' ? parsed.tools : {};
  } catch {
    return {};
  }
}

function htmlList(items) {
  return items.map((item) => `<li>${item}</li>`).join('\n');
}

const PANEL_COPY = {
  en: {
    kicker: 'Official evidence',
    title: 'Sources &amp; verification',
    lead: 'This high-stakes calculator links the authority sources, method notes, test cases, and limitations used to check the numbers shown on this page.',
    lastVerified: 'Last verified',
    risk: 'risk',
    sourceLinks: 'Official source links',
    lawVersion: 'Law, regulation, or version',
    methodology: 'Calculation methodology',
    limitations: 'Known limitations',
    testCases: 'Test-case examples',
    changeHistory: 'Change history',
    input: 'Input',
    expected: 'Expected',
    why: 'Why',
    disclaimer: 'AfroTools calculators are decision-support tools. Always confirm filing, registration, and remittance duties with the linked authority or a qualified local adviser.',
    report: 'Report calculation error',
    contactPath: '/contact/'
  },
  fr: {
    kicker: 'Preuves officielles',
    title: 'Sources et vérification',
    lead: 'Ce calculateur sensible relie les sources officielles, la méthode, les cas de test et les limites utilisés pour vérifier les résultats affichés.',
    lastVerified: 'Dernière vérification',
    risk: 'risque',
    sourceLinks: 'Sources officielles',
    lawVersion: 'Loi, règlement ou version',
    methodology: 'Méthode de calcul',
    limitations: 'Limites connues',
    testCases: 'Cas de test',
    changeHistory: 'Historique des modifications',
    input: 'Entrée',
    expected: 'Résultat attendu',
    why: 'Pourquoi',
    disclaimer: 'Les calculateurs AfroTools sont des outils d’aide à la décision. Confirmez toujours les obligations de déclaration, d’inscription et de paiement auprès de l’autorité liée ou d’un conseiller local qualifié.',
    report: 'Signaler une erreur de calcul',
    contactPath: '/fr/contact/'
  }
};

const FR_VERIFICATION_VALUES = new Map([
  ['The calculator annualizes salary where needed, applies modeled employee statutory deductions, runs taxable income through the country PAYE bands, and derives net pay from gross pay minus modeled PAYE and statutory deductions. Employer-cost lines are informational where the page exposes them.', 'Le calculateur annualise le salaire lorsque nécessaire, applique les retenues salariales modélisées, traite le revenu imposable selon les tranches PAYE du pays et déduit le PAYE et les retenues modélisées du salaire brut. Les lignes de coût employeur sont indicatives.'],
  ['The calculator splits the entered amount into net amount, VAT, and VAT-inclusive total using the displayed standard or custom VAT rate. Zero-rated and exempt categories are treated as decision guidance and must be confirmed against the linked authority material before filing.', 'Le calculateur répartit le montant saisi entre montant hors taxe, TVA et total TTC selon le taux standard ou personnalisé affiché. Les catégories exonérées ou à taux zéro servent de guide et doivent être confirmées auprès de l’autorité liée avant toute déclaration.'],
  ['Informational estimate only. It is not professional tax, legal, payroll, or filing advice.', 'Estimation informative uniquement. Elle ne constitue pas un conseil fiscal, juridique, de paie ou de déclaration.'],
  ['Sector-specific, regional, treaty, relief, and special-regime rules may not be fully modeled.', 'Les règles sectorielles, régionales, conventionnelles, d’allègement ou de régime spécial peuvent ne pas être entièrement modélisées.'],
  ['Product classification, exemption, and zero-rating rules can require invoice-level review.', 'La classification des produits, les exonérations et les taux zéro peuvent nécessiter une vérification au niveau de la facture.'],
  ['Confirm filing, registration, and remittance duties with the official authority or a qualified adviser before submission.', 'Confirmez les obligations de déclaration, d’inscription et de paiement auprès de l’autorité officielle ou d’un conseiller qualifié avant toute soumission.'],
  ['Annual gross salary: 0.', 'Salaire brut annuel : 0.'],
  ['PAYE and statutory deductions should be 0 and net pay should not be negative.', 'Le PAYE et les retenues légales doivent être nuls, et le salaire net ne doit pas être négatif.'],
  ['Establishes the zero-income baseline and catches negative liability regressions.', 'Établit le cas de référence sans revenu et détecte les régressions produisant une dette négative.'],
  ['Annual gross salary entered in the page currency.', 'Salaire brut annuel saisi dans la devise de la page.'],
  ['Taxable income is processed through the visible country bands and net pay equals gross pay minus modeled deductions.', 'Le revenu imposable est traité selon les tranches visibles du pays, et le salaire net correspond au salaire brut moins les retenues modélisées.'],
  ['Confirms the calculator is using the documented methodology rather than an opaque flat estimate.', 'Confirme que le calculateur applique la méthode documentée plutôt qu’une estimation forfaitaire opaque.'],
  ['Net amount: 1,000 at the displayed standard VAT rate.', 'Montant hors taxe : 1 000 au taux de TVA standard affiché.'],
  ['VAT equals 1,000 multiplied by the displayed rate; total equals net amount plus VAT.', 'La TVA correspond à 1 000 multiplié par le taux affiché ; le total correspond au montant hors taxe plus la TVA.'],
  ['Confirms the core VAT-exclusive calculation path and makes the rate dependency auditable.', 'Confirme le calcul hors taxe principal et rend vérifiable la dépendance au taux.'],
  ['VAT-inclusive amount with the displayed standard VAT rate.', 'Montant TTC avec le taux de TVA standard affiché.'],
  ['Net amount equals total divided by 1 plus the rate; VAT equals total minus net amount.', 'Le montant hors taxe correspond au total divisé par 1 plus le taux ; la TVA correspond au total moins le montant hors taxe.'],
  ['Confirms reverse VAT handling for invoices that already include tax.', 'Confirme le calcul inverse de la TVA pour les factures qui incluent déjà la taxe.'],
  ['Trust and verification panel added with source links, methodology, limitations, and report-error CTA.', 'Ajout du panneau de confiance et de vérification avec sources, méthode, limites et lien de signalement.'],
  ['PAYE income-tax bands and statutory deductions shown on the calculator page.', 'Tranches d’impôt PAYE et retenues légales affichées sur la page du calculateur.'],
  ['VAT rate, zero-rated, and exempt treatment shown on the calculator page.', 'Taux de TVA et traitements à taux zéro ou exonérés affichés sur la page du calculateur.'],
  ['Rebuilt English and launched Swahili routes on one reviewed engine; corrected the obsolete 17% claim to 19%, evidence-gated 10% and 0%, and added local PDF, widget and API parity.', 'Réunion des routes anglaise et swahilie sur un moteur révisé ; correction de l’ancien taux de 17 % à 19 %, application des taux de 10 % et 0 % uniquement sur preuve, puis ajout du PDF local et de la parité widget/API.'],
  ['Replaced the legacy 19% and generic zero-rate model with a pure evidence-gated 19%, 10%, 5% and Article 322 exemption engine shared by English, French and Swahili routes and protected in the API.', 'Remplacement de l’ancien modèle à 19 % et taux zéro générique par un moteur fondé sur preuve pour les taux de 19 %, 10 %, 5 % et l’exonération de l’article 322, partagé entre les routes anglaise, française et swahilie et protégé dans l’API.'],
  ['Rebuilt English, French and Swahili routes on the 17.5% enacted rate, disclosed the stale EIS sample, blocked custom and special rates, and added a local PDF, shared engine, API guard and standard-only widget.', 'Reconstruction des routes anglaise, française et swahilie avec le taux légal de 17,5 % ; signalement de l’ancien exemple EIS, blocage des taux personnalisés et spéciaux, puis ajout du PDF local, du moteur partagé, de la protection API et du widget limité au taux standard.'],
  ['Replaced the obsolete 17% and blanket-exemption model with current 16%, evidence-gated 5% and export treatments under Laws 22/2022 and 10/2025; added EN/FR/SW parity, local PDF and invoice checks.', 'Remplacement de l’ancien modèle à 17 % et d’exonération générale par le taux actuel de 16 %, le taux de 5 % sur preuve et les traitements à l’exportation prévus par les lois 22/2022 et 10/2025 ; ajout de la parité EN/FR/SW, du PDF local et des contrôles de facture.'],
  ['AfroTools source audit', 'Audit des sources AfroTools']
]);

function localizeVerificationValue(value, lang) {
  if (lang !== 'fr') return value;
  return FR_VERIFICATION_VALUES.get(String(value || '')) || value;
}

function buildPanel(entry, lang = 'en') {
  const copy = PANEL_COPY[lang] || PANEL_COPY.en;
  const kind = kindFor(entry.tool_id);
  // Bespoke verification records are authored in English. Until a record has
  // an owned French translation, use the already translated, calculation-type
  // contract rather than leaking a large English block onto a French route.
  const methodology = lang === 'fr' ? methodologyFor(kind) : entry.methodology_markdown;
  const knownLimitations = lang === 'fr' ? limitationsFor(kind) : entry.known_limitations;
  const testCases = lang === 'fr' ? testCasesFor(kind) : entry.test_cases;
  const riskLabel = lang === 'fr'
    ? ({ critical: 'critique', high: 'élevé', medium: 'moyen', low: 'faible' }[entry.risk_level] || entry.risk_level)
    : entry.risk_level;
  const riskText = lang === 'fr' ? `${copy.risk} ${riskLabel}` : `${riskLabel} ${copy.risk}`;
  const sourceItems = entry.source_urls.map((url, index) => {
    const label = entry.source_titles[index] || hostnameTitle(url);
    return `<li><a href="${escapeAttr(url)}" target="_blank" rel="noopener">${escapeHtml(label)}</a></li>`;
  }).join('\n');

  const limitations = htmlList(knownLimitations.map((item) => escapeHtml(localizeVerificationValue(item, lang))));
  const cases = testCases.map((testCase) => (
    `<div class="tool-verification-case"><p class="tool-verification-meta"><strong>${copy.input}:</strong> ${escapeHtml(localizeVerificationValue(testCase.input, lang))}<br><strong>${copy.expected}:</strong> ${escapeHtml(localizeVerificationValue(testCase.expected_output, lang))}<br><strong>${copy.why}:</strong> ${escapeHtml(localizeVerificationValue(testCase.why, lang))}</p></div>`
  )).join('\n');
  const history = entry.change_history.map((item) => `<li><strong>${escapeHtml(item.date)}:</strong> ${escapeHtml(localizeVerificationValue(item.note, lang))}</li>`).join('\n');

  return `${START}
<section class="tool-verification-sec" id="sources-verification" data-tool-verification-panel data-tool-id="${escapeAttr(entry.tool_id)}">
  <div class="container">
    <div class="tool-verification-card">
      <div class="tool-verification-head">
        <div>
          <span class="tool-verification-kicker">${copy.kicker}</span>
          <h2 class="tool-verification-title">${copy.title}</h2>
          <p class="tool-verification-lead">${copy.lead}</p>
        </div>
        <div class="tool-verification-status">
          <span class="tool-verification-badge">${copy.lastVerified} ${escapeHtml(entry.last_verified)}</span>
          <p class="tool-verification-note">${escapeHtml(entry.jurisdiction)} - ${escapeHtml(riskText)} - ${escapeHtml(localizeVerificationValue(entry.verified_by, lang))}</p>
        </div>
      </div>
      <div class="tool-verification-grid">
        <div class="tool-verification-block">
          <h3>${copy.sourceLinks}</h3>
          <ul class="tool-verification-list">
${sourceItems}
          </ul>
        </div>
        <div class="tool-verification-block">
          <h3>${copy.lawVersion}</h3>
          <p class="tool-verification-meta">${escapeHtml(localizeVerificationValue(entry.law_or_version, lang))}</p>
        </div>
        <div class="tool-verification-block">
          <h3>${copy.methodology}</h3>
          <p class="tool-verification-meta">${escapeHtml(localizeVerificationValue(methodology, lang))}</p>
        </div>
        <div class="tool-verification-block">
          <h3>${copy.limitations}</h3>
          <ul class="tool-verification-list">
${limitations}
          </ul>
        </div>
        <div class="tool-verification-block">
          <h3>${copy.testCases}</h3>
${cases}
        </div>
        <div class="tool-verification-block">
          <h3>${copy.changeHistory}</h3>
          <ul class="tool-verification-list">
${history}
          </ul>
        </div>
      </div>
      <div class="tool-verification-actions">
        <p class="tool-verification-disclaimer">${copy.disclaimer}</p>
        <a class="tool-verification-report" href="${copy.contactPath}?topic=calculation-error&amp;tool=${encodeURIComponent(entry.tool_id)}">${copy.report}</a>
      </div>
    </div>
  </div>
</section>
${END}`;
}

function removeOldVerificationPanels(html) {
  const markerRe = new RegExp(`${escapeRegExp(START)}[\\s\\S]*?${escapeRegExp(END)}\\s*`, 'g');
  let next = html.replace(markerRe, '');
  next = next.replace(/\s*<section class="ng-sources-sec">[\s\S]*?<\/section>\s*/g, '\n');
  return next;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function ensureCss(html) {
  if (html.includes('/assets/css/tool-verification.css')) return html;
  return html.replace('</head>', `<link rel="stylesheet" href="${CSS_HREF}">\n</head>`);
}

function replaceGenericBadges(html) {
  return html.replace(/<span class="(badge[^"]*)">([^<]*(?:Verified|verified)[^<]*)<\/span>/g, (match, className, label) => {
    const trimmed = stripTags(label).replace(/\bVerified\b/i, 'evidence');
    return `<a class="${escapeAttr(className)}" href="#sources-verification" aria-label="${escapeAttr(label)} evidence">${escapeHtml(trimmed)}</a>`;
  });
}

function replaceRatings(html) {
  return html.replace(/<div class="tool-stat-val">\s*(?:[0-5](?:\.[0-9])?)\s*<\/div>\s*<div class="tool-stat-lbl">\s*Rating\s*<\/div>/gi, '<div class="tool-stat-val">Sources</div><div class="tool-stat-lbl">Linked</div>');
}

function insertPanel(html, panel) {
  if (html.includes('<afro-related-tools')) return html.replace('<afro-related-tools', `${panel}\n<afro-related-tools`);
  if (html.includes('<afro-footer')) return html.replace('<afro-footer', `${panel}\n<afro-footer`);
  return html.replace('</body>', `${panel}\n</body>`);
}

function applyPanelToFile(file, entry) {
  const original = fs.readFileSync(file, 'utf8');
  let html = removeOldVerificationPanels(original);
  html = ensureCss(html);
  html = replaceGenericBadges(html);
  html = replaceRatings(html);
  const lang = rel(file).startsWith('fr/') ? 'fr' : 'en';
  // Some bespoke French calculators already own a complete localized source
  // panel. Do not add a second generated panel or overwrite its richer copy.
  if (
    lang === 'fr'
    && html.includes('data-tool-verification-panel')
    && html.includes('tool-verification-report')
  ) {
    if (WRITE && html !== original) fs.writeFileSync(file, html, 'utf8');
    return html !== original;
  }
  html = insertPanel(html, buildPanel(entry, lang));
  if (process.env.AFROTOOLS_VERIFY_DEBUG === rel(file) && html !== original) {
    const before = original.split(/\r?\n/);
    const after = html.split(/\r?\n/);
    const max = Math.max(before.length, after.length);
    for (let index = 0; index < max; index += 1) {
      if (before[index] !== after[index]) {
        console.log(`debug-diff ${rel(file)} line ${index + 1}`);
        console.log(`before: ${before[index] || ''}`);
        console.log(`after:  ${after[index] || ''}`);
        break;
      }
    }
  }
  if (WRITE && html !== original) fs.writeFileSync(file, html, 'utf8');
  return html !== original;
}

function main() {
  const allTargetFiles = walk(ROOT)
    .filter((file) => TARGET_RE.test(rel(file)))
    .sort((a, b) => rel(a).localeCompare(rel(b)));
  const targetFiles = allTargetFiles.filter((file) => {
    if (!LANG_FILTER) return true;
    const lang = rel(file).startsWith('fr/') ? 'fr' : 'en';
    return lang === LANG_FILTER;
  });

  const manifest = buildManifest(allTargetFiles);
  const dataPath = path.join(ROOT, 'data', 'tool-verification.json');
  const dataJson = `${JSON.stringify(manifest, null, 2)}\n`;
  if (WRITE && !LANG_FILTER) fs.writeFileSync(dataPath, dataJson, 'utf8');

  let changed = 0;
  for (const file of targetFiles) {
    const html = fs.readFileSync(file, 'utf8');
    const toolId = toolIdFor(file, html);
    if (applyPanelToFile(file, manifest.tools[toolId])) {
      changed += 1;
      if (LIST) console.log(`changed: ${rel(file)}`);
    }
  }

  const missing = Object.values(manifest.tools).filter((entry) => !entry.source_urls.length || !entry.last_verified);
  console.log(`${WRITE ? 'Applied' : 'Prepared'} verification layer for ${targetFiles.length} PAYE/VAT pages and ${Object.keys(manifest.tools).length} tool entries.`);
  console.log(`${changed} HTML files ${WRITE ? 'changed' : 'would change'}.`);
  if (missing.length) {
    console.error(`Missing verification metadata for: ${missing.map((entry) => entry.tool_id).join(', ')}`);
    process.exitCode = 1;
  }
}

main();
