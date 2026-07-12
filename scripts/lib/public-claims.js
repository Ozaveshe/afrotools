const fs = require('fs');
const path = require('path');

const DEFAULT_ROOT = path.resolve(__dirname, '..', '..');
const CLAIMS_PATH = path.join('data', 'audits', 'public-claim-registry.json');
const FLOWS_PATH = path.join('data', 'audits', 'feature-data-flow-registry.json');
const REPORT_JSON_PATH = path.join('reports', 'public-claims.json');
const REPORT_MD_PATH = path.join('reports', 'public-claims.md');
const FLOWS_REPORT_JSON_PATH = path.join('reports', 'feature-data-flows.json');
const FLOWS_REPORT_MD_PATH = path.join('reports', 'feature-data-flows.md');
const SKIP_DIRECTORIES = new Set([
  '.git', '.claude', '.agents', '.codex', '.netlify', '.wrangler', 'node_modules',
  'dist', 'reports', 'audit-results', 'artifacts', 'test-results', 'coverage',
  '.playwright', '.cache'
]);
const PUBLIC_LOCALES = ['en', 'fr', 'sw', 'yo', 'ha'];
const REQUIRED_CLAIM_FIELDS = [
  'key', 'category', 'approvedMeaning', 'detectionPatterns', 'permittedWording',
  'prohibitedAbsoluteWording', 'evidenceSources', 'evidenceOwner', 'lastVerifiedAt',
  'reviewAfter', 'applicableSurfaces', 'exceptions', 'dataFlowRefs', 'translations'
];
const REQUIRED_FLOW_FIELDS = [
  'key', 'featureClass', 'dataEntered', 'browserProcessing', 'networkDestinations',
  'storageLocations', 'retention', 'accountAssociation', 'thirdPartyProcessors',
  'consentOrDisclosure', 'deletionBehavior', 'exportBehavior', 'evidenceSources',
  'pointOfUseSurfaces', 'claimRefs', 'exceptions'
];

function normalizePath(value) {
  return value.split(path.sep).join('/');
}

function readJson(root, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function loadClaimsRegistry(root = DEFAULT_ROOT) {
  return readJson(root, CLAIMS_PATH);
}

function loadDataFlows(root = DEFAULT_ROOT) {
  return readJson(root, FLOWS_PATH);
}

function issue(code, message, record = null, file = null, line = null) {
  return { code, message, record, file, line };
}

function formatIssue(item) {
  const location = item.file ? `${item.file}${item.line ? `:${item.line}` : ''}: ` : '';
  const record = item.record ? ` [${item.record}]` : '';
  return `${location}${item.code}${record} ${item.message}`;
}

function isDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function validatePattern(pattern, record, errors, code = 'CLAIM_PATTERN_INVALID') {
  try {
    return new RegExp(pattern, 'iu');
  } catch (error) {
    errors.push(issue(code, `Invalid regular expression ${JSON.stringify(pattern)}: ${error.message}`, record));
    return null;
  }
}

function validateEvidence(root, sources, record, errors) {
  for (const source of sources || []) {
    if (typeof source !== 'string' || !source.trim()) {
      errors.push(issue('EVIDENCE_SOURCE_INVALID', 'Evidence source must be a non-empty path or live-read identifier.', record));
      continue;
    }
    if (source.startsWith('live-read:')) continue;
    if (!fs.existsSync(path.join(root, source))) {
      errors.push(issue('EVIDENCE_SOURCE_MISSING', `Evidence source does not exist: ${source}`, record));
    }
  }
}

function validateRegistries({ claims, flows, today = new Date().toISOString().slice(0, 10), root = DEFAULT_ROOT }) {
  const errors = [];
  const warnings = [];
  if (!claims || !Array.isArray(claims.claims)) {
    return { ok: false, errors: [issue('CLAIMS_REGISTRY_INVALID', 'Registry must contain a claims array.')], warnings };
  }
  if (!flows || !Array.isArray(flows.flows)) {
    return { ok: false, errors: [issue('DATA_FLOW_REGISTRY_INVALID', 'Registry must contain a flows array.')], warnings };
  }

  const publicLocales = Array.isArray(claims.publicLocales) ? claims.publicLocales : PUBLIC_LOCALES;
  const claimKeys = new Set();
  const flowKeys = new Set();

  for (const pattern of claims.globalProhibitedPatterns || []) validatePattern(pattern, 'global', errors);

  for (const claim of claims.claims) {
    const key = claim && claim.key ? claim.key : '<unknown-claim>';
    for (const field of REQUIRED_CLAIM_FIELDS) {
      if (!Object.prototype.hasOwnProperty.call(claim || {}, field)) {
        errors.push(issue('CLAIM_FIELD_MISSING', `Missing required field ${field}.`, key));
      }
    }
    if (claimKeys.has(key)) errors.push(issue('CLAIM_KEY_DUPLICATE', 'Claim key must be unique.', key));
    claimKeys.add(key);
    if (!isDate(claim.lastVerifiedAt)) errors.push(issue('CLAIM_VERIFIED_DATE_INVALID', 'lastVerifiedAt must be YYYY-MM-DD.', key));
    if (!isDate(claim.reviewAfter)) errors.push(issue('CLAIM_REVIEW_DATE_INVALID', 'reviewAfter must be YYYY-MM-DD.', key));
    if (isDate(claim.reviewAfter) && claim.reviewAfter < today) {
      errors.push(issue('CLAIM_REVIEW_EXPIRED', `Review expired on ${claim.reviewAfter}; verify evidence before publishing.`, key));
    }
    for (const pattern of claim.detectionPatterns || []) validatePattern(pattern, key, errors);
    const prohibited = (claim.prohibitedAbsoluteWording || []).map((pattern) => validatePattern(pattern, key, errors)).filter(Boolean);
    const variants = Object.keys(claim.permittedWording || {}).sort();
    for (const locale of publicLocales) {
      const translations = claim.translations && claim.translations[locale];
      if (!translations) {
        errors.push(issue('CLAIM_TRANSLATION_MISSING', `Missing ${locale} translations.`, key));
        continue;
      }
      const localizedVariants = Object.keys(translations).sort();
      if (JSON.stringify(localizedVariants) !== JSON.stringify(variants)) {
        errors.push(issue('CLAIM_TRANSLATION_VARIANTS', `${locale} variants must match permitted wording variants.`, key));
      }
      for (const [variant, value] of Object.entries(translations)) {
        if (typeof value !== 'string' || !value.trim()) {
          errors.push(issue('CLAIM_TRANSLATION_EMPTY', `${locale}.${variant} must be non-empty.`, key));
          continue;
        }
        if (value !== value.normalize('NFC')) errors.push(issue('CLAIM_TRANSLATION_NOT_NFC', `${locale}.${variant} must be NFC normalized.`, key));
        const allProhibited = prohibited.concat((claims.globalProhibitedPatterns || []).map((pattern) => validatePattern(pattern, 'global', errors)).filter(Boolean));
        if (allProhibited.some((regex) => regex.test(value))) {
          errors.push(issue('CLAIM_TRANSLATION_PROHIBITED', `${locale}.${variant} uses prohibited absolute wording.`, key));
        }
      }
    }
    validateEvidence(root, claim.evidenceSources, key, errors);
  }

  for (const flow of flows.flows) {
    const key = flow && flow.key ? flow.key : '<unknown-flow>';
    for (const field of REQUIRED_FLOW_FIELDS) {
      if (!Object.prototype.hasOwnProperty.call(flow || {}, field)) {
        errors.push(issue('DATA_FLOW_FIELD_MISSING', `Missing required field ${field}.`, key));
      }
    }
    if (flowKeys.has(key)) errors.push(issue('DATA_FLOW_KEY_DUPLICATE', 'Data-flow key must be unique.', key));
    flowKeys.add(key);
    validateEvidence(root, flow.evidenceSources, key, errors);
  }

  for (const claim of claims.claims) {
    for (const ref of claim.dataFlowRefs || []) {
      if (!flowKeys.has(ref)) errors.push(issue('CLAIM_DATA_FLOW_UNKNOWN', `Unknown data-flow reference ${ref}.`, claim.key));
    }
  }
  for (const flow of flows.flows) {
    for (const ref of flow.claimRefs || []) {
      if (!claimKeys.has(ref)) errors.push(issue('DATA_FLOW_CLAIM_UNKNOWN', `Unknown claim reference ${ref}.`, flow.key));
    }
  }
  return { ok: errors.length === 0, errors, warnings };
}

function lineIndex(content) {
  const starts = [0];
  for (let index = 0; index < content.length; index += 1) {
    if (content.charCodeAt(index) === 10) starts.push(index + 1);
  }
  return starts;
}

function lineForOffset(starts, offset) {
  let low = 0;
  let high = starts.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (starts[middle] <= offset) low = middle + 1;
    else high = middle;
  }
  return low;
}

function compilePatterns(claims) {
  const prohibited = [];
  const detected = [];
  for (const pattern of claims.globalProhibitedPatterns || []) {
    const regex = new RegExp(pattern, 'giu');
    prohibited.push({ claim: 'global', pattern, regex });
  }
  for (const claim of claims.claims || []) {
    for (const pattern of claim.prohibitedAbsoluteWording || []) {
      prohibited.push({ claim: claim.key, pattern, regex: new RegExp(pattern, 'giu') });
    }
    for (const pattern of claim.detectionPatterns || []) {
      detected.push({ claim: claim.key, pattern, regex: new RegExp(pattern, 'giu') });
    }
  }
  return { prohibited, detected };
}

function scanContent({ claims, flows, today, files }) {
  const validation = validateRegistries({ claims, flows, today, root: DEFAULT_ROOT });
  const errors = [...validation.errors];
  const hits = [];
  let rawHits = 0;
  let approvedHits = 0;
  const patterns = compilePatterns(claims);
  for (const file of files) {
    const content = String(file.content || '');
    const starts = lineIndex(content);
    if (file.path.endsWith('.html')) {
      const directAnalytics = /https:\/\/www\.googletagmanager\.com\/gtag\/js/giu;
      let directMatch;
      while ((directMatch = directAnalytics.exec(content)) !== null) {
        errors.push(issue('CLAIM_ANALYTICS_WITHOUT_CONSENT', 'Direct analytics loader bypasses the consent-gated shared loader.', 'analytics.consent-metadata', file.path, lineForOffset(starts, directMatch.index)));
      }
    }
    for (const item of patterns.prohibited) {
      item.regex.lastIndex = 0;
      let match;
      while ((match = item.regex.exec(content)) !== null) {
        const before = content.slice(Math.max(0, match.index - 220), match.index);
        if (item.claim === 'authority.evidence-scope' && /\b(?:no|not|without|does not|is not)\b[^.!?]{0,200}$/iu.test(before)) {
          if (match[0].length === 0) item.regex.lastIndex += 1;
          continue;
        }
        rawHits += 1;
        errors.push(issue('CLAIM_PROHIBITED_WORDING', `Prohibited public wording ${JSON.stringify(match[0])}; use an approved claim variant.`, item.claim, file.path, lineForOffset(starts, match.index)));
        if (match[0].length === 0) item.regex.lastIndex += 1;
      }
    }
    for (const item of patterns.detected) {
      item.regex.lastIndex = 0;
      let match;
      while ((match = item.regex.exec(content)) !== null) {
        rawHits += 1;
        approvedHits += 1;
        if (hits.length < 500) hits.push({ claim: item.claim, file: file.path, line: lineForOffset(starts, match.index), text: match[0] });
        if (match[0].length === 0) item.regex.lastIndex += 1;
      }
    }
  }
  return { ok: errors.length === 0, errors, warnings: validation.warnings, rawHits, approvedHits, hits };
}

function escapeHtml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function projectClaimSelectorsInHtml(html, { locale = 'en', claims }) {
  const byKey = new Map((claims.claims || []).map((claim) => [claim.key, claim]));
  let changed = false;
  const output = String(html).replace(/(<([a-z][\w:-]*)\b[^>]*\bdata-claim-key=["']([^"']+)["'][^>]*\bdata-claim-variant=["']([^"']+)["'][^>]*>)([\s\S]*?)(<\/\2>)/giu,
    (whole, open, tag, key, variant, current, close) => {
      const claim = byKey.get(key);
      const localized = claim && claim.translations && (claim.translations[locale] || claim.translations.en);
      const value = localized && localized[variant];
      if (typeof value !== 'string') return whole;
      const replacement = escapeHtml(value);
      if (current === replacement) return whole;
      changed = true;
      return `${open}${replacement}${close}`;
    });
  return { html: output, changed };
}

function inferLocale(relativePath) {
  const prefix = normalizePath(relativePath).split('/')[0];
  return PUBLIC_LOCALES.includes(prefix) && prefix !== 'en' ? prefix : 'en';
}

function freshnessState(input, now = new Date()) {
  const timestamp = input && input.timestamp ? new Date(input.timestamp) : null;
  const ageMinutes = timestamp && !Number.isNaN(timestamp.getTime()) ? (now.getTime() - timestamp.getTime()) / 60000 : null;
  const base = { timestamp: input && input.timestamp || null, source: input && input.source || '', ageMinutes };
  if (!input || input.requestState === 'failed' || input.requestState === 'unavailable') return { ...base, state: 'unavailable' };
  if (input.requestState === 'static') return { ...base, state: 'static' };
  if (!timestamp || !input.source || input.requestState !== 'ok') return { ...base, state: 'unavailable' };
  if (ageMinutes < 0) return { ...base, state: 'unavailable' };
  if (ageMinutes <= Number(input.maxLiveMinutes || 0)) return { ...base, state: 'live' };
  if (ageMinutes <= Number(input.maxStaleMinutes || Math.max(Number(input.maxLiveMinutes || 0) * 24, 1440))) return { ...base, state: 'cached' };
  return { ...base, state: 'stale' };
}

function collectRepositoryFiles(root) {
  const files = [];
  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!SKIP_DIRECTORIES.has(entry.name)) walk(path.join(directory, entry.name));
        continue;
      }
      if (!entry.isFile()) continue;
      const absolute = path.join(directory, entry.name);
      const relative = normalizePath(path.relative(root, absolute));
      const extension = path.extname(entry.name).toLowerCase();
      const publicHtml = extension === '.html';
      const sharedScript = extension === '.js' && relative.startsWith('assets/js/') && !relative.endsWith('.min.js');
      if (publicHtml || sharedScript) files.push({ path: relative, absolute, content: fs.readFileSync(absolute, 'utf8') });
    }
  }
  walk(root);
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

function claimReport(claims, flows, scan, scannedFiles, today) {
  const categoryCounts = {};
  for (const claim of claims.claims) categoryCounts[claim.category] = (categoryCounts[claim.category] || 0) + 1;
  const approvedByClaim = {};
  for (const hit of scan.hits) approvedByClaim[hit.claim] = (approvedByClaim[hit.claim] || 0) + 1;
  return {
    schemaVersion: '1.0.0',
    generatedAt: today,
    summary: {
      claims: claims.claims.length,
      dataFlows: flows.flows.length,
      scannedFiles,
      rawHits: scan.rawHits,
      approvedHits: scan.approvedHits,
      errors: scan.errors.length,
      categories: categoryCounts
    },
    approvedHitsByClaim: approvedByClaim,
    examples: scan.hits
  };
}

function publicClaimsMarkdown(report, claims) {
  const lines = [
    '# Public claims report', '',
    `Generated: ${report.generatedAt}`, '',
    `- Canonical claims: ${report.summary.claims}`,
    `- Feature data flows: ${report.summary.dataFlows}`,
    `- Public HTML/shared script files scanned: ${report.summary.scannedFiles}`,
    `- Approved claim hits: ${report.summary.approvedHits}`,
    `- Validation errors: ${report.summary.errors}`, '',
    '| Claim key | Meaning | Owner | Last verified | Review after | Detected hits |',
    '| --- | --- | --- | --- | --- | ---: |'
  ];
  for (const claim of claims.claims) {
    lines.push(`| ${claim.key} | ${claim.approvedMeaning.replace(/\|/g, '\\|')} | ${claim.evidenceOwner} | ${claim.lastVerifiedAt} | ${claim.reviewAfter} | ${report.approvedHitsByClaim[claim.key] || 0} |`);
  }
  lines.push('');
  return lines.join('\n');
}

function dataFlowsMarkdown(flows) {
  const lines = ['# Public feature data-flow inventory', '', `Last verified: ${flows.lastVerifiedAt || 'not recorded'}`, ''];
  for (const flow of flows.flows) {
    lines.push(`## ${flow.key}`, '', `Feature class: ${flow.featureClass}`, '', `Browser processing: ${flow.browserProcessing}`, '', `Network destinations: ${flow.networkDestinations.length ? flow.networkDestinations.join('; ') : 'None for this flow.'}`, '', `Storage: ${flow.storageLocations.join('; ')}`, '', `Retention: ${flow.retention}`, '', `Account association: ${flow.accountAssociation}`, '', `Third-party processors: ${flow.thirdPartyProcessors.length ? flow.thirdPartyProcessors.join('; ') : 'None for this flow.'}`, '', `Consent/disclosure: ${flow.consentOrDisclosure}`, '', `Deletion: ${flow.deletionBehavior}`, '', `Export: ${flow.exportBehavior}`, '');
  }
  return lines.join('\n');
}

function writeText(root, relativePath, content) {
  const destination = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, content, 'utf8');
}

function buildRepository({ root = DEFAULT_ROOT, write = false, today = new Date().toISOString().slice(0, 10) } = {}) {
  const claims = loadClaimsRegistry(root);
  const flows = loadDataFlows(root);
  const validation = validateRegistries({ claims, flows, today, root });
  if (!validation.ok) return { ...validation, scannedFiles: 0, rawHits: 0, approvedHits: 0, report: { summary: {} }, changedFiles: [] };
  const files = collectRepositoryFiles(root);
  const changedFiles = [];
  const projectedFiles = files.map((file) => {
    if (!file.path.endsWith('.html')) return file;
    const projected = projectClaimSelectorsInHtml(file.content, { locale: inferLocale(file.path), claims });
    if (projected.changed) {
      changedFiles.push(file.path);
      if (write) fs.writeFileSync(file.absolute, projected.html, 'utf8');
      return { ...file, content: projected.html };
    }
    return file;
  });
  const scan = scanContent({ claims, flows, today, files: projectedFiles });
  const report = claimReport(claims, flows, scan, files.length, today);
  if (write) {
    writeText(root, REPORT_JSON_PATH, `${JSON.stringify(report, null, 2)}\n`);
    writeText(root, REPORT_MD_PATH, publicClaimsMarkdown(report, claims));
    writeText(root, FLOWS_REPORT_JSON_PATH, `${JSON.stringify(flows, null, 2)}\n`);
    writeText(root, FLOWS_REPORT_MD_PATH, dataFlowsMarkdown(flows));
  }
  return {
    ok: scan.ok,
    errors: scan.errors,
    warnings: scan.warnings,
    scannedFiles: files.length,
    rawHits: scan.rawHits,
    approvedHits: scan.approvedHits,
    changedFiles,
    report
  };
}

module.exports = {
  CLAIMS_PATH,
  FLOWS_PATH,
  buildRepository,
  collectRepositoryFiles,
  formatIssue,
  freshnessState,
  loadClaimsRegistry,
  loadDataFlows,
  projectClaimSelectorsInHtml,
  scanContent,
  validateRegistries
};
