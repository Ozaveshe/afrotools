#!/usr/bin/env node
/**
 * AfroTools competitive tool quality audit.
 *
 * Scores every live/new registry row against category-specific product
 * benchmarks, static page evidence, and optional Playwright browser smoke.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const http = require('http');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const REGISTRY_PATH = path.join(ROOT, 'assets/js/components/tool-registry.js');
const VERIFICATION_PATH = path.join(ROOT, 'data/tool-verification.json');
const REPORT_DIR = path.join(ROOT, 'reports');
const REPORT_JSON = path.join(REPORT_DIR, 'tool-quality-ranking.json');
const REPORT_MD = path.join(REPORT_DIR, 'tool-quality-ranking.md');
const REPORT_CSV = path.join(REPORT_DIR, 'tool-quality-ranking.csv');

const argv = process.argv.slice(2);
const RUN_BROWSER = argv.includes('--browser');
const LIMIT = numberArg('--limit', 0);
const BROWSER_LIMIT = numberArg('--browser-limit', 0);
const CONCURRENCY = numberArg('--concurrency', 6);
const BROWSER_TIMEOUT = numberArg('--timeout', 8000);
const PORT = numberArg('--port', 4173);
const GENERATED_AT = new Date().toISOString();
const GENERATED_DATE = GENERATED_AT.slice(0, 10);
const CURRENT_YEAR = new Date().getFullYear();

const CATEGORY_PROFILES = {
  'document-pdf': {
    label: 'PDF workflow utility',
    competitors: ['iLovePDF', 'Smallpdf', 'Adobe Acrobat online'],
    requiredFeatures: ['fileUpload', 'download', 'privacyLocal', 'resultOutput', 'primaryAction', 'schema'],
    strongSignals: ['batchWorkflow', 'workflowCopy', 'saveExport', 'appSurface', 'browserOk'],
    standard: 'A competitive PDF tool should accept files directly, process or explain the workflow clearly, expose an obvious download/export path, state privacy handling, and avoid console/runtime errors.'
  },
  'image-design': {
    label: 'Image and design utility',
    competitors: ['Canva', 'Adobe Express', 'TinyPNG', 'remove.bg'],
    requiredFeatures: ['fileUpload', 'download', 'primaryAction', 'resultOutput', 'privacyLocal'],
    strongSignals: ['canvasSurface', 'batchWorkflow', 'copyShare', 'saveExport', 'browserOk'],
    standard: 'A competitive image tool should support drag/drop or upload, clear edit controls, visible preview/output, fast export, and format or privacy expectations.'
  },
  financial: {
    label: 'Tax, salary, finance calculator',
    competitors: ['Taxngr', 'TaxCalc.ng', 'TaxTim', 'Calc.ke'],
    requiredFeatures: ['formControls', 'resultOutput', 'methodology', 'disclaimer', 'sources', 'currentYear'],
    strongSignals: ['officialSource', 'saveExport', 'businessCta', 'verificationPanel', 'browserOk'],
    standard: 'A competitive finance tool should show inputs, a worked result or breakdown, current assumptions, source links, limitations, and save/export or business continuation.'
  },
  ecommerce: {
    label: 'VAT, invoice, ecommerce calculator',
    competitors: ['Taxngr', 'TaxCalc.ng', 'Zoho Invoice', 'Wave'],
    requiredFeatures: ['formControls', 'resultOutput', 'methodology', 'disclaimer', 'sources'],
    strongSignals: ['officialSource', 'download', 'saveExport', 'businessCta', 'browserOk'],
    standard: 'A competitive business-tax or ecommerce tool should calculate visibly, explain assumptions, cite source material when rules are jurisdictional, and support invoice/export next steps.'
  },
  'hr-payroll': {
    label: 'Payroll and HR utility',
    competitors: ['Gusto', 'Deel', 'BambooHR calculators', 'TaxTim'],
    requiredFeatures: ['formControls', 'resultOutput', 'methodology', 'disclaimer', 'currentYear'],
    strongSignals: ['officialSource', 'saveExport', 'businessCta', 'workflowCopy', 'browserOk'],
    standard: 'A competitive payroll utility should handle local assumptions honestly, produce a reusable result, expose warnings, and connect to payroll workflows without claiming official filing.'
  },
  legal: {
    label: 'Legal and compliance workflow',
    competitors: ['LegalZoom', 'Rocket Lawyer', 'local regulator portals'],
    requiredFeatures: ['formControls', 'resultOutput', 'disclaimer', 'sources', 'methodology'],
    strongSignals: ['download', 'saveExport', 'officialSource', 'workflowCopy', 'browserOk'],
    standard: 'A competitive legal tool should generate or check a clear artifact, cite legal/regulatory source context where relevant, and avoid implying legal advice or certification.'
  },
  government: {
    label: 'Government and civic guide',
    competitors: ['official government portals', 'service directories'],
    requiredFeatures: ['sources', 'officialSource', 'currentYear', 'disclaimer', 'resultOutput'],
    strongSignals: ['workflowCopy', 'relatedLinks', 'browserOk', 'schema'],
    standard: 'A competitive civic tool should privilege official sources, dates, eligibility or checklist clarity, and route users to the real authority for final action.'
  },
  health: {
    label: 'Health and wellness estimator',
    competitors: ['WebMD calculators', 'NHS tools', 'Mayo Clinic references'],
    requiredFeatures: ['formControls', 'resultOutput', 'disclaimer', 'sources'],
    strongSignals: ['currentYear', 'methodology', 'privacyLocal', 'browserOk'],
    standard: 'A competitive health tool should be clearly non-diagnostic, source-backed, easy to complete, and careful with medical claims.'
  },
  developer: {
    label: 'Developer utility',
    competitors: ['JSONLint', 'Regex101', 'Code Beautify', 'MDN examples'],
    requiredFeatures: ['formControls', 'primaryAction', 'resultOutput', 'copyShare'],
    strongSignals: ['download', 'schema', 'keyboardFriendly', 'browserOk'],
    standard: 'A competitive developer tool should provide direct input, instant validation or transformation, copy/download, example-driven UX, and no runtime errors.'
  },
  language: {
    label: 'Language and translation utility',
    competitors: ['Google Translate', 'DeepL', 'local phrasebook sites'],
    requiredFeatures: ['formControls', 'resultOutput', 'primaryAction', 'disclaimer'],
    strongSignals: ['copyShare', 'sources', 'localContext', 'browserOk'],
    standard: 'A competitive language tool should make input/output obvious, support copying, set expectations about translation quality, and include local language context.'
  },
  education: {
    label: 'Education calculator or guide',
    competitors: ['school portals', 'grade calculators', 'scholarship directories'],
    requiredFeatures: ['formControls', 'resultOutput', 'methodology', 'disclaimer'],
    strongSignals: ['sources', 'saveExport', 'currentYear', 'browserOk'],
    standard: 'A competitive education tool should return a usable score, plan, or list, explain assumptions, and cite source or eligibility context when relevant.'
  },
  agriculture: {
    label: 'Agriculture and market-data tool',
    competitors: ['FAO data tools', 'commodity dashboards', 'local extension services'],
    requiredFeatures: ['formControls', 'resultOutput', 'sources', 'currentYear'],
    strongSignals: ['localContext', 'methodology', 'saveExport', 'browserOk'],
    standard: 'A competitive agriculture tool should make local inputs clear, show assumptions, cite data freshness or sources, and produce a practical farm or market decision output.'
  },
  trade: {
    label: 'Trade and logistics calculator',
    competitors: ['DHL calculators', 'Freightos', 'customs authority portals'],
    requiredFeatures: ['formControls', 'resultOutput', 'methodology', 'disclaimer', 'sources'],
    strongSignals: ['officialSource', 'saveExport', 'businessCta', 'browserOk'],
    standard: 'A competitive trade tool should model a shipment or compliance decision, expose assumptions, and point users to official or quote-confirmed final steps.'
  },
  transport: {
    label: 'Transport and mobility estimator',
    competitors: ['fare calculators', 'transport authority portals', 'Google Maps'],
    requiredFeatures: ['formControls', 'resultOutput', 'sources', 'disclaimer'],
    strongSignals: ['currentYear', 'localContext', 'browserOk'],
    standard: 'A competitive transport tool should provide local route/cost logic, source or date context, and clear uncertainty notes.'
  },
  energy: {
    label: 'Energy and utility estimator',
    competitors: ['utility tariff calculators', 'solar sizing tools'],
    requiredFeatures: ['formControls', 'resultOutput', 'methodology', 'sources'],
    strongSignals: ['currentYear', 'localContext', 'saveExport', 'browserOk'],
    standard: 'A competitive energy tool should model tariffs or sizing transparently, show assumptions, and keep local rates or source dates visible.'
  },
  insurance: {
    label: 'Insurance estimator',
    competitors: ['insurer quote tools', 'comparison marketplaces'],
    requiredFeatures: ['formControls', 'resultOutput', 'disclaimer', 'methodology'],
    strongSignals: ['sources', 'saveExport', 'businessCta', 'browserOk'],
    standard: 'A competitive insurance tool should be explicit that it is an estimate, show drivers, and guide users to quotes or documented next steps.'
  },
  'personal-finance': {
    label: 'Personal finance calculator',
    competitors: ['NerdWallet calculators', 'Bankrate', 'local bank calculators'],
    requiredFeatures: ['formControls', 'resultOutput', 'methodology', 'disclaimer'],
    strongSignals: ['saveExport', 'copyShare', 'localContext', 'browserOk'],
    standard: 'A competitive personal-finance tool should let users model scenarios, see formulas or assumptions, and save/share results.'
  },
  fintech: {
    label: 'Fintech and payments tool',
    competitors: ['Paystack', 'Flutterwave', 'bank calculators'],
    requiredFeatures: ['formControls', 'resultOutput', 'methodology', 'disclaimer'],
    strongSignals: ['sources', 'saveExport', 'businessCta', 'browserOk'],
    standard: 'A competitive fintech tool should expose fees, assumptions, currencies, and next-step integration or business paths.'
  },
  creative: {
    label: 'Creator workflow utility',
    competitors: ['Canva', 'Buffer', 'Later', 'Notion templates'],
    requiredFeatures: ['formControls', 'primaryAction', 'resultOutput', 'copyShare'],
    strongSignals: ['saveExport', 'workflowCopy', 'appSurface', 'browserOk'],
    standard: 'A competitive creator tool should produce a reusable asset, support copy/export, and fit a repeatable creator workflow.'
  },
  career: {
    label: 'Career tool',
    competitors: ['LinkedIn tools', 'Indeed calculators', 'Resume.io'],
    requiredFeatures: ['formControls', 'resultOutput', 'copyShare', 'disclaimer'],
    strongSignals: ['saveExport', 'download', 'workflowCopy', 'browserOk'],
    standard: 'A competitive career tool should generate or score a concrete artifact, support export, and avoid overclaiming hiring outcomes.'
  },
  default: {
    label: 'General online utility',
    competitors: ['Calculator.net', 'Omni Calculator', 'specialist SaaS utilities'],
    requiredFeatures: ['formControls', 'primaryAction', 'resultOutput', 'disclaimer'],
    strongSignals: ['sources', 'saveExport', 'localContext', 'browserOk'],
    standard: 'A competitive online utility should be direct, interactive, understandable, accessible, and honest about assumptions.'
  }
};

function numberArg(name, fallback) {
  const prefix = `${name}=`;
  const direct = argv.find((arg) => arg.startsWith(prefix));
  if (!direct) return fallback;
  const value = Number(direct.slice(prefix.length));
  return Number.isFinite(value) ? value : fallback;
}

function loadRegistry() {
  const code = fs.readFileSync(REGISTRY_PATH, 'utf8');
  function FakeEvent() {}
  const sandbox = {
    window: {},
    CustomEvent: FakeEvent,
    document: {
      readyState: 'complete',
      getElementById: () => null,
      createElement: () => ({ textContent: '', style: {}, appendChild() {} }),
      head: { appendChild() {} },
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {},
      querySelector: () => null,
    },
  };
  sandbox.window = sandbox;
  vm.runInNewContext(code, sandbox, { filename: REGISTRY_PATH });
  return {
    tools: sandbox.AFRO_TOOLS || [],
    categories: sandbox.AFRO_CATEGORIES || {},
    getTotalToolCount: sandbox.getTotalToolCount,
  };
}

function loadVerification() {
  if (!fs.existsSync(VERIFICATION_PATH)) return { tools: {} };
  return JSON.parse(fs.readFileSync(VERIFICATION_PATH, 'utf8'));
}

function normalizeRoute(route) {
  let clean = String(route || '/').split(/[?#]/)[0].trim() || '/';
  if (!clean.startsWith('/')) clean = `/${clean}`;
  clean = clean.replace(/\/index\.html$/i, '/').replace(/\.html$/i, '');
  return clean.length > 1 && clean.endsWith('/') ? clean : clean;
}

function candidateFiles(href) {
  let clean = String(href || '').split(/[?#]/)[0].trim();
  if (!clean.startsWith('/')) clean = `/${clean}`;
  const noSlash = clean.replace(/\/$/, '');
  const candidates = [];
  candidates.push(path.join(ROOT, clean, 'index.html'));
  candidates.push(path.join(ROOT, `${noSlash}.html`));
  if (/\.html$/i.test(clean)) candidates.push(path.join(ROOT, clean));
  return Array.from(new Set(candidates));
}

function resolvePage(tool) {
  const candidates = candidateFiles(tool.href);
  const filePath = candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
  const route = normalizeRoute(tool.href || `/tools/${tool.id}/`);
  return {
    exists: !!filePath,
    filePath: filePath || candidates[0],
    route,
    relative: filePath ? path.relative(ROOT, filePath).replace(/\\/g, '/') : '',
  };
}

function stripScriptStyle(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ');
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
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function escapeMd(value) {
  return String(value || '')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ')
    .trim();
}

function csvEscape(value) {
  const text = String(value == null ? '' : value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function firstMatch(html, regex) {
  const match = String(html || '').match(regex);
  return match ? decodeEntities(match[1] || match[0]) : '';
}

function matchCount(html, regex) {
  return (String(html || '').match(regex) || []).length;
}

function getExternalLinks(html) {
  const links = [];
  const clean = String(html || '');
  for (const match of clean.matchAll(/<a\b[^>]*\bhref=["'](https?:\/\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const url = decodeEntities(match[1]).trim();
    const label = stripTags(decodeEntities(match[2]));
    if (!/afrotools\.com|schema\.org|w3\.org|google|facebook|twitter|linkedin|instagram|youtube|fonts\./i.test(url)) {
      links.push({ url, label });
    }
  }
  return links;
}

function hasOfficialSource(links, text) {
  const sourceText = `${links.map((link) => `${link.url} ${link.label}`).join(' ')} ${text}`;
  return /\b(gov|gouv|go\.|revenue|tax authority|customs|central bank|sars|firs|nrs|kra|gra|ura|rra|tra|zra|zimra|mra|authority|ministry|official gazette|regulator|commission)\b/i.test(sourceText);
}

function parseJsonLd(html) {
  const blocks = [];
  for (const match of String(html || '').matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    const raw = match[1].trim();
    try {
      JSON.parse(raw);
      blocks.push({ valid: true });
    } catch (error) {
      blocks.push({ valid: false, error: error.message });
    }
  }
  return {
    count: blocks.length,
    invalid: blocks.filter((block) => !block.valid).length,
  };
}

function dateSignals(text, html) {
  const joined = `${text} ${html}`;
  const explicit = /\b(last verified|updated|dateModified|reviewed|effective|2026|2025\/26|2025-26|2025)\b/i.test(joined);
  const hasCurrentYear = new RegExp(`\\b${CURRENT_YEAR}\\b`).test(joined);
  const hasRecentYear = /\b2026\b|\b2025\b/.test(joined);
  return { explicit, hasCurrentYear, hasRecentYear };
}

function detectFeatures(tool, html, pageInfo, verificationManifest) {
  const text = stripTags(stripScriptStyle(html));
  const lowerText = text.toLowerCase();
  const title = stripTags(firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i));
  const metaDescription = firstMatch(html, /<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']*)/i)
    || firstMatch(html, /<meta\s+[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
  const canonical = firstMatch(html, /<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)/i);
  const jsonLd = parseJsonLd(html);
  const links = getExternalLinks(html);
  const imgs = String(html || '').match(/<img\b[^>]*>/gi) || [];
  const missingAlt = imgs.filter((img) => !/\balt=["'][^"']*["']/i.test(img)).length;
  const inputs = matchCount(html, /<(input|select|textarea)\b/gi);
  const buttons = matchCount(html, /<button\b|role=["']button["']|class=["'][^"']*\bbtn\b/gi);
  const labels = matchCount(html, /<label\b|aria-label=|aria-labelledby=/gi);
  const hasFileInput = /<input\b[^>]*type=["']file["']/i.test(html);
  const hasCanvas = /<canvas\b/i.test(html);
  const hasResult = /\b(result|output|preview|summary|breakdown|estimate|calculation|score|total|report|answer|download-ready)\b/i.test(text)
    || /\b(result|output|preview|summary|breakdown|estimate|score|total|report)\b/i.test(html);
  const hasPrimaryAction = buttons > 0 && /\b(calculate|generate|convert|compress|merge|split|upload|run|check|create|download|copy|compare|estimate|analy[sz]e|submit|start)\b/i.test(text);
  const hasDownload = /\bdownload\b|download=|\.pdf\b|\.csv\b|\.docx\b|export/i.test(html);
  const hasCopyShare = /\b(copy|share|clipboard|copyLink|shareBtn|navigator\.clipboard)\b/i.test(html);
  const hasSaveExport = /\b(save|export|email|pdf|csv|docx|workspace|history|localStorage|AfroHistory|SaveState)\b/i.test(html);
  const hasBusinessCta = /afro-business-cta|business-enquiry|custom-calculators|sponsored-tools|widgets\/|\/api\//i.test(html);
  const hasDisclaimer = /\b(disclaimer|estimate only|not legal advice|not tax advice|not medical advice|informational|verify with|confirm with|not official|does not replace)\b/i.test(text);
  const hasMethodology = /\b(methodology|how it works|calculation method|formula|assumptions|breakdown|we calculate|calculated by|rules applied)\b/i.test(text);
  const sourceWords = /\b(source|official|authority|gazette|verified|reference|last verified|data source|based on)\b/i.test(text);
  const officialSource = hasOfficialSource(links, text);
  const hasPrivacyLocal = /\b(browser|local|never leave|no upload|private|privacy|client-side|on your device|files never leave)\b/i.test(text);
  const hasBatchWorkflow = /\b(batch|bulk|multiple files|all 54|54 African|workflow|queue|multi-item|compare)\b/i.test(text);
  const hasWorkflowCopy = /\b(workflow|step-by-step|checklist|packet|workspace|handoff|plan|playbook|guide)\b/i.test(text);
  const localContext = /\b(Africa|African|Nigeria|Kenya|Ghana|South Africa|Naira|KSh|GHS|SARS|KRA|FIRS|NRS|GRA|AfCFTA|country|currency|local)\b/i.test(text)
    || (Array.isArray(tool.countries) && tool.countries.length > 0);
  const lang = firstMatch(html, /<html[^>]*\blang=["']([^"']+)/i);
  const verificationEntry = verificationManifest.tools && verificationManifest.tools[tool.id];
  const date = dateSignals(text, html);
  const forms = matchCount(html, /<form\b/gi);
  const h1Count = matchCount(html, /<h1[\s>]/gi);
  const internalToolLinks = matchCount(html, /href=["']\/(?:tools|[a-z-]+\/)[^"']*/gi);
  const hasRelatedLinks = /\b(related tools|next step|popular tools|you may also|more tools|recommended)\b/i.test(text) || internalToolLinks >= 5;
  const hasNavFooter = /<afro-navbar|<afro-footer|navbar|footer/i.test(html);
  const appHtmlPath = pageInfo.exists && path.join(path.dirname(pageInfo.filePath), 'app.html');
  const hasAppHtml = !!(appHtmlPath && fs.existsSync(appHtmlPath));
  const hasInlineOrAppScript = /<script\b/i.test(html) && /\b(addEventListener|querySelector|getElementById|function\s+\w+|const\s+\w+\s*=|let\s+\w+\s*=|new Blob|FileReader|pdf-lib|canvas)\b/i.test(html);
  const hasToolScript = /<script\b[^>]*src=["'][^"']*(?:app|tool|calculator|workspace|engine|sync|lib|pdf|image|invoice|validator)[^"']*\.js/i.test(html);
  const emptyButtons = matchCount(html, /<button\b[^>]*>\s*<\/button>/gi);
  const encodedReplacement = matchCount(html, /\uFFFD|�|Ã|â€™|â€œ|â€/g);

  return {
    title,
    metaDescription,
    canonical,
    jsonLd,
    textLength: text.length,
    visibleWords: text ? text.split(/\s+/).filter(Boolean).length : 0,
    h1Count,
    lang,
    inputs,
    buttons,
    labels,
    forms,
    imgCount: imgs.length,
    missingAlt,
    externalSourceLinks: links.length,
    officialSource,
    verificationEntry: !!verificationEntry,
    features: {
      pageExists: pageInfo.exists,
      title: title.length > 0,
      metaDescription: metaDescription.length >= 80 && metaDescription.length <= 180,
      canonical: canonical.length > 0,
      h1: h1Count === 1,
      jsonld: jsonLd.count > 0 && jsonLd.invalid === 0,
      schema: jsonLd.count > 0 && jsonLd.invalid === 0,
      lang: !!lang,
      navFooter: hasNavFooter,
      formControls: inputs > 0 || forms > 0 || hasFileInput,
      inputLabels: inputs === 0 || labels >= Math.min(inputs, 2),
      primaryAction: hasPrimaryAction,
      resultOutput: hasResult,
      fileUpload: hasFileInput,
      canvasSurface: hasCanvas,
      download: hasDownload,
      copyShare: hasCopyShare,
      saveExport: hasSaveExport,
      businessCta: hasBusinessCta,
      disclaimer: hasDisclaimer,
      methodology: hasMethodology,
      sources: links.length > 0 || sourceWords || !!verificationEntry,
      officialSource,
      currentYear: date.hasRecentYear || date.explicit,
      privacyLocal: hasPrivacyLocal,
      batchWorkflow: hasBatchWorkflow,
      workflowCopy: hasWorkflowCopy,
      localContext,
      verificationPanel: /data-tool-verification-panel|Sources\s*&(?:amp;)?\s*verification/i.test(html) || !!verificationEntry,
      relatedLinks: hasRelatedLinks,
      appSurface: hasAppHtml || hasToolScript || hasInlineOrAppScript,
      keyboardFriendly: labels > 0 || /aria-|tabindex|:focus/i.test(html),
    },
    qualityWarnings: {
      emptyButtons,
      encodedReplacement,
      jsonLdInvalid: jsonLd.invalid,
      missingAlt,
    },
  };
}

function profileFor(category) {
  return CATEGORY_PROFILES[category] || CATEGORY_PROFILES.default;
}

function add(score, points, condition, good, bad, evidence) {
  if (condition) {
    score.points += points;
    if (good) score.good.push(good);
  } else if (bad) {
    score.gaps.push(bad);
  }
}

function scoreTool(tool, pageInfo, features, browserResult) {
  const profile = profileFor(tool.category);
  const f = Object.assign({}, features.features);
  if (browserResult) {
    f.browserOk = !!browserResult.ok;
    f.noConsoleErrors = (browserResult.consoleErrors || 0) === 0 && (browserResult.pageErrors || 0) === 0;
    f.interactiveInBrowser = Number(browserResult.interactiveCount || 0) > 0;
  } else {
    f.browserOk = false;
    f.noConsoleErrors = false;
    f.interactiveInBrowser = false;
  }

  const dimensionScores = {};
  const score = { points: 0, good: [], gaps: [] };

  const route = { points: 0, good: [], gaps: [] };
  add(route, 5, pageInfo.exists, 'page exists', 'missing page');
  add(route, 2, tool.status === 'live' || tool.status === 'new', 'live/new status', 'not live/new');
  add(route, 2, f.title, 'has title', 'missing title');
  add(route, 2, !!features.metaDescription, 'has meta description', 'missing meta description');
  add(route, 2, f.canonical, 'has canonical', 'missing canonical');
  add(route, 1, features.jsonLd.invalid === 0, 'valid JSON-LD', 'invalid JSON-LD');
  add(route, 1, !/redirecting/i.test(features.title), '', 'looks like redirect shell');
  dimensionScores.route_health = route.points;
  score.points += route.points;
  score.good.push(...route.good);
  score.gaps.push(...route.gaps);

  const ux = { points: 0, good: [], gaps: [] };
  add(ux, 2, f.h1, 'single h1', 'missing or duplicate h1');
  add(ux, 4, f.formControls || f.fileUpload || f.primaryAction, 'interactive controls', 'thin or no visible controls');
  add(ux, 3, f.primaryAction, 'clear primary action', 'unclear primary action');
  add(ux, 3, f.resultOutput, 'visible output/result model', 'no obvious output/result model');
  add(ux, 2, f.inputLabels, 'input labels or aria labels', 'inputs need labels');
  add(ux, 2, f.fileUpload || f.formControls || f.canvasSurface, 'domain-appropriate input surface', 'weak input surface');
  add(ux, 2, f.navFooter, 'shared nav/footer shell', 'missing shared shell evidence');
  add(ux, 2, features.textLength >= 1000, 'substantial visible copy', 'thin visible copy');
  dimensionScores.standard_tool_ux = ux.points;
  score.points += ux.points;
  score.good.push(...ux.good);
  score.gaps.push(...ux.gaps);

  const functional = { points: 0, good: [], gaps: [] };
  add(functional, 4, f.appSurface, 'has app/script surface', 'no app/script evidence');
  add(functional, 4, f.formControls || f.fileUpload, 'input path exists', 'no input path');
  add(functional, 4, f.resultOutput || f.download || f.copyShare, 'completion path exists', 'no completion path');
  add(functional, 3, f.workflowCopy || f.batchWorkflow || f.methodology, 'workflow or methodology evidence', 'no workflow or methodology evidence');
  add(functional, 2, f.download || f.saveExport || f.copyShare, 'export/copy/save path', 'missing export/copy/save path');
  if (RUN_BROWSER) {
    add(functional, 2, f.browserOk, 'browser route loads', 'browser route failed');
    add(functional, 1, f.noConsoleErrors, 'no browser console/page errors', 'browser console/page errors');
  } else {
    functional.gaps.push('browser smoke not run');
  }
  dimensionScores.functional_confidence = functional.points;
  score.points += functional.points;
  score.good.push(...functional.good);
  score.gaps.push(...functional.gaps);

  const trust = { points: 0, good: [], gaps: [] };
  add(trust, 4, f.sources, 'source/reference evidence', 'missing source/reference evidence');
  add(trust, 4, f.officialSource || f.verificationPanel, 'official source or verification panel', 'missing official/verification evidence');
  add(trust, 4, f.currentYear, 'current or explicit date signal', 'stale or undated assumptions');
  add(trust, 3, f.methodology, 'methodology or breakdown', 'missing methodology/breakdown');
  add(trust, 3, f.disclaimer, 'disclaimer/limitations', 'missing disclaimer/limitations');
  add(trust, 2, f.verificationPanel, 'verification panel/manifest', 'no verification panel');
  dimensionScores.trust_accuracy = trust.points;
  score.points += trust.points;
  score.good.push(...trust.good);
  score.gaps.push(...trust.gaps);

  const seo = { points: 0, good: [], gaps: [] };
  add(seo, 2, f.lang, 'html lang present', 'missing html lang');
  add(seo, 2, features.title.length >= 20 && features.title.length <= 80, 'title length sane', 'weak title length');
  add(seo, 2, f.metaDescription, 'meta description length sane', 'weak meta description length');
  add(seo, 2, f.canonical, 'canonical present', 'canonical missing');
  add(seo, 1, f.h1, 'h1 present', 'h1 issue');
  add(seo, 2, features.missingAlt === 0, 'image alts clean', 'images missing alt');
  add(seo, 2, f.inputLabels, 'form labels clean enough', 'form labels weak');
  add(seo, 2, f.relatedLinks, 'internal related links', 'weak related/internal links');
  dimensionScores.seo_accessibility = seo.points;
  score.points += seo.points;
  score.good.push(...seo.good);
  score.gaps.push(...seo.gaps);

  const competitive = { points: 0, good: [], gaps: [] };
  const requiredMet = profile.requiredFeatures.filter((key) => f[key]);
  const strongMet = profile.strongSignals.filter((key) => f[key]);
  add(competitive, 3, requiredMet.length >= Math.ceil(profile.requiredFeatures.length * 0.7), 'meets most category-required features', 'lags category-required features');
  add(competitive, 2, f.localContext, 'Africa/local context', 'weak Africa/local context');
  add(competitive, 2, f.download || f.saveExport || f.copyShare, 'continuation action', 'no continuation action');
  add(competitive, 2, !isHighIntentMoney(tool) || f.businessCta, 'commercial CTA covered or not required', 'high-intent money tool lacks business CTA');
  add(competitive, 1, Number(tool.priority || 0) >= 60 || !!tool.revenue, 'commercial metadata present', 'weak commercial metadata');
  dimensionScores.commercial_competitive = competitive.points;
  score.points += competitive.points;
  score.good.push(...competitive.good);
  score.gaps.push(...competitive.gaps);

  const qualityDeductions = [];
  let deduction = 0;
  if (features.qualityWarnings.emptyButtons > 0) {
    deduction += 2;
    qualityDeductions.push(`empty buttons: ${features.qualityWarnings.emptyButtons}`);
  }
  if (features.qualityWarnings.encodedReplacement > 0) {
    deduction += 2;
    qualityDeductions.push(`encoding artifacts: ${features.qualityWarnings.encodedReplacement}`);
  }
  if (features.qualityWarnings.jsonLdInvalid > 0) {
    deduction += 3;
    qualityDeductions.push(`invalid JSON-LD: ${features.qualityWarnings.jsonLdInvalid}`);
  }
  if (browserResult && (browserResult.consoleErrors || browserResult.pageErrors)) {
    deduction += Math.min(6, (browserResult.consoleErrors || 0) + (browserResult.pageErrors || 0));
    qualityDeductions.push(`browser errors: ${(browserResult.consoleErrors || 0) + (browserResult.pageErrors || 0)}`);
  }

  const rawScore = Math.max(0, Math.min(100, score.points - deduction));
  const requiredMissing = profile.requiredFeatures.filter((key) => !f[key]);
  const strongMissing = profile.strongSignals.filter((key) => !f[key]);
  const rank = rankFor(rawScore);

  return {
    score: rawScore,
    rank,
    standard_status: statusFor(rawScore),
    dimension_scores: dimensionScores,
    quality_deductions: qualityDeductions,
    benchmark_profile: profile.label,
    competitor_set: profile.competitors,
    benchmark_standard: profile.standard,
    required_features_met: requiredMet,
    required_features_missing: requiredMissing,
    strong_features_met: strongMet,
    strong_features_missing: strongMissing,
    gaps: Array.from(new Set(score.gaps.concat(requiredMissing.map((key) => `missing benchmark feature: ${key}`)))).slice(0, 12),
    strengths: Array.from(new Set(score.good)).slice(0, 10),
    improvement_priority: priorityFor(tool, rawScore, browserResult),
  };
}

function isHighIntentMoney(tool) {
  const text = `${tool.id} ${tool.name} ${tool.category} ${tool.desc || ''}`.toLowerCase();
  return /(paye|salary|tax|vat|invoice|payroll|remittance|import|duty|employer|cost|loan|finance|payment|fee)/.test(text)
    || ['financial', 'ecommerce', 'fintech', 'hr-payroll', 'personal-finance'].includes(tool.category);
}

function rankFor(score) {
  if (score >= 85) return 'A';
  if (score >= 75) return 'B';
  if (score >= 65) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

function statusFor(score) {
  if (score >= 85) return 'competitor-grade';
  if (score >= 75) return 'standard-grade';
  if (score >= 65) return 'usable but upgrade-needed';
  if (score >= 50) return 'below industry standard';
  return 'repair-first';
}

function priorityFor(tool, score, browserResult) {
  const highPriority = Number(tool.priority || 0) >= 75 || Number(tool.estTraffic || 0) >= 5000 || Number(tool.estRevenue || 0) >= 100;
  if (browserResult && !browserResult.ok) return 'P0-browser-failure';
  if (score < 45) return highPriority ? 'P0-high-value-repair' : 'P1-repair';
  if (highPriority && score < 70) return 'P1-high-value-upgrade';
  if (score < 65) return 'P2-upgrade';
  return 'P3-monitor';
}

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function requestLocal(port, route) {
  return new Promise((resolve) => {
    const req = http.get({ host: '127.0.0.1', port, path: route, timeout: 1000 }, (res) => {
      res.resume();
      resolve(true);
    });
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.on('error', () => resolve(false));
  });
}

async function ensureServer(port) {
  if (await requestLocal(port, '/')) return { started: false, process: null };
  const child = spawn(process.execPath, [path.join(ROOT, 'tests/support/static-server.js')], {
    cwd: ROOT,
    env: Object.assign({}, process.env, { PORT: String(port) }),
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', (chunk) => process.stdout.write(String(chunk)));
  child.stderr.on('data', (chunk) => process.stderr.write(String(chunk)));
  for (let i = 0; i < 60; i += 1) {
    if (await requestLocal(port, '/')) return { started: true, process: child };
    if (child.exitCode != null) break;
    await wait(500);
  }
  throw new Error(`Could not start static server on port ${port}`);
}

async function runBrowserSmoke(routes) {
  const chromium = loadChromium();

  const server = await ensureServer(PORT);
  const baseUrl = `http://127.0.0.1:${PORT}`;
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 900 },
    serviceWorkers: 'block',
  });
  const results = {};
  const queue = routes.slice(0, BROWSER_LIMIT || routes.length);
  let cursor = 0;
  let done = 0;

  async function worker() {
    while (cursor < queue.length) {
      const route = queue[cursor++];
      const page = await context.newPage();
      const consoleErrors = [];
      const pageErrors = [];
      const failedResponses = [];
      const started = Date.now();
      let responseStatus = 0;
      let ok = false;
      let error = '';

      page.on('console', (message) => {
        const text = message.text();
        if (message.type() === 'error' && !/ERR_BLOCKED_BY_CLIENT|net::ERR_ABORTED|Inspector/i.test(text)) {
          consoleErrors.push(text.slice(0, 300));
        }
      });
      page.on('pageerror', (err) => pageErrors.push(String(err.message || err).slice(0, 300)));
      page.on('response', (response) => {
        const url = response.url();
        if (url.startsWith(baseUrl) && response.status() >= 400) {
          failedResponses.push(`${response.status()} ${url.replace(baseUrl, '')}`.slice(0, 220));
        }
      });
      await page.route('**/*', (routeControl) => {
        const requestUrl = routeControl.request().url();
        if (requestUrl.startsWith(baseUrl) || requestUrl.startsWith('data:') || requestUrl.startsWith('blob:')) {
          return routeControl.continue();
        }
        return routeControl.abort('blockedbyclient');
      });

      try {
        const response = await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded', timeout: BROWSER_TIMEOUT });
        responseStatus = response ? response.status() : 0;
        await page.waitForTimeout(100);
        ok = responseStatus > 0 && responseStatus < 400;
      } catch (err) {
        error = String(err.message || err).slice(0, 300);
      }

      let rendered = {};
      try {
        rendered = await page.evaluate(() => {
          function isVisible(element) {
            const style = window.getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return style && style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
          }
          const interactive = Array.from(document.querySelectorAll('button, input, select, textarea, a[href], [role="button"]')).filter(isVisible);
          const outputSelectors = '[id*="result" i], [class*="result" i], [id*="output" i], [class*="output" i], [id*="preview" i], [class*="preview" i], [aria-live]';
          const nav = performance.getEntriesByType('navigation')[0];
          return {
            title: document.title || '',
            h1Count: document.querySelectorAll('h1').length,
            bodyTextLength: (document.body && document.body.innerText || '').trim().length,
            interactiveCount: interactive.length,
            buttonCount: Array.from(document.querySelectorAll('button, [role="button"]')).filter(isVisible).length,
            inputCount: Array.from(document.querySelectorAll('input, select, textarea')).filter(isVisible).length,
            fileInputCount: document.querySelectorAll('input[type="file"]').length,
            outputMarkerCount: document.querySelectorAll(outputSelectors).length,
            loadEventMs: nav ? Math.round(nav.loadEventEnd || nav.domContentLoadedEventEnd || 0) : 0,
          };
        });
      } catch (err) {
        pageErrors.push(String(err.message || err).slice(0, 300));
      }
      await safeClosePage(page);

      done += 1;
      if (done % 25 === 0 || done === queue.length) {
        console.log(`Browser-smoked ${done}/${queue.length} routes`);
      }

      results[route] = {
        ok,
        status: responseStatus,
        duration_ms: Date.now() - started,
        error,
        consoleErrors: consoleErrors.length,
        pageErrors: pageErrors.length,
        sampleConsoleErrors: consoleErrors.slice(0, 3),
        samplePageErrors: pageErrors.slice(0, 3),
        failedResponses: failedResponses.slice(0, 5),
        failedResponseCount: failedResponses.length,
        title: rendered.title || '',
        h1Count: rendered.h1Count || 0,
        bodyTextLength: rendered.bodyTextLength || 0,
        interactiveCount: rendered.interactiveCount || 0,
        buttonCount: rendered.buttonCount || 0,
        inputCount: rendered.inputCount || 0,
        fileInputCount: rendered.fileInputCount || 0,
        outputMarkerCount: rendered.outputMarkerCount || 0,
        loadEventMs: rendered.loadEventMs || 0,
      };
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length || 1) }, () => worker()));
  await safeCloseContext(context);
  await safeCloseBrowser(browser);
  if (server.started && server.process) server.process.kill();
  return results;
}

async function safeClosePage(page) {
  try {
    await Promise.race([
      page.close({ runBeforeUnload: false }),
      wait(2000),
    ]);
  } catch (_) {}
}

async function safeCloseContext(context) {
  try {
    await Promise.race([
      context.close(),
      wait(3000),
    ]);
  } catch (_) {}
}

async function safeCloseBrowser(browser) {
  try {
    await Promise.race([
      browser.close(),
      wait(3000),
    ]);
  } catch (_) {}
}

function loadChromium() {
  const moduleDirs = []
    .concat(process.env.AFROTOOLS_NODE_MODULE_DIR || [])
    .concat(process.env.NODE_PATH ? process.env.NODE_PATH.split(path.delimiter) : [])
    .filter(Boolean);
  const attempts = [
    () => require('@playwright/test').chromium,
    () => require('playwright').chromium,
  ];
  for (const dir of moduleDirs) {
    attempts.push(() => require(path.join(dir, '@playwright/test')).chromium);
    attempts.push(() => require(path.join(dir, 'playwright')).chromium);
  }
  const errors = [];
  for (const attempt of attempts) {
    try {
      const chromium = attempt();
      if (chromium) return chromium;
    } catch (error) {
      errors.push(error.message);
    }
  }
  throw new Error(`Playwright is not available. Install npm dependencies or set AFROTOOLS_NODE_MODULE_DIR to a directory containing playwright. Last error: ${errors[errors.length - 1] || 'unknown'}`);
}

function summarize(records, registryStats, browserSummary) {
  const weighted = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  const rows = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  const byCategory = {};
  for (const record of records) {
    const weight = record.instance_count || 1;
    weighted[record.rank] += weight;
    rows[record.rank] += 1;
    const bucket = byCategory[record.category] || {
      category: record.category,
      label: record.category_label,
      rows: 0,
      instances: 0,
      totalScore: 0,
      lowRows: 0,
      p0: 0,
      browserFailures: 0,
    };
    bucket.rows += 1;
    bucket.instances += weight;
    bucket.totalScore += record.score;
    if (record.score < 65) bucket.lowRows += 1;
    if (String(record.improvement_priority).startsWith('P0')) bucket.p0 += 1;
    if (record.browser && record.browser.ok === false) bucket.browserFailures += 1;
    byCategory[record.category] = bucket;
  }
  const categories = Object.values(byCategory)
    .map((bucket) => Object.assign(bucket, { avgScore: Number((bucket.totalScore / bucket.rows).toFixed(1)) }))
    .sort((a, b) => a.avgScore - b.avgScore || b.lowRows - a.lowRows);
  return {
    generated_at: GENERATED_AT,
    browser_smoke: browserSummary,
    registry: registryStats,
    score_distribution_rows: rows,
    score_distribution_instances: weighted,
    categories,
    low_ranked_count: records.filter((record) => record.score < 65).length,
    repair_first_count: records.filter((record) => record.score < 50).length,
  };
}

function writeReports(records, summary) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_JSON, JSON.stringify({ summary, tools: records }, null, 2) + '\n', 'utf8');
  fs.writeFileSync(REPORT_CSV, buildCsv(records), 'utf8');
  fs.writeFileSync(REPORT_MD, buildMarkdown(records, summary), 'utf8');
}

function buildCsv(records) {
  const headers = [
    'rank_order', 'id', 'name', 'href', 'category', 'category_label', 'status', 'language',
    'score', 'rank', 'standard_status', 'improvement_priority', 'instance_count',
    'benchmark_profile', 'competitors', 'required_missing', 'strong_missing', 'top_gaps',
  ];
  const lines = [headers.join(',')];
  records.forEach((record, index) => {
    const row = [
      index + 1,
      record.id,
      record.name,
      record.href,
      record.category,
      record.category_label,
      record.status,
      record.language,
      record.score,
      record.rank,
      record.standard_status,
      record.improvement_priority,
      record.instance_count,
      record.benchmark_profile,
      record.competitor_set.join('; '),
      record.required_features_missing.join('; '),
      record.strong_features_missing.join('; '),
      record.gaps.slice(0, 5).join('; '),
    ];
    lines.push(row.map(csvEscape).join(','));
  });
  return `${lines.join('\n')}\n`;
}

function buildMarkdown(records, summary) {
  const lowest = records.slice(0, 100);
  const p0 = records.filter((record) => String(record.improvement_priority).startsWith('P0')).slice(0, 40);
  const highValue = records
    .filter((record) => record.improvement_priority === 'P1-high-value-upgrade')
    .slice(0, 40);
  const categoryRows = summary.categories.slice(0, 20).map((cat) => {
    return `| ${escapeMd(cat.label || cat.category)} | ${cat.rows} | ${cat.instances} | ${cat.avgScore} | ${cat.lowRows} | ${cat.p0} | ${cat.browserFailures} |`;
  }).join('\n');

  return `# AfroTools Tool Quality Ranking

Generated: ${GENERATED_AT}

## Scope

- Registry rows scored: ${summary.registry.scored_rows}
- Live/new expanded tool instances represented: ${summary.registry.live_instances}
- Unique live/new routes: ${summary.registry.unique_routes}
- Browser smoke: ${summary.browser_smoke.enabled ? `enabled, ${summary.browser_smoke.routes_tested} routes tested` : 'not run'}
- Reports: \`reports/tool-quality-ranking.json\`, \`reports/tool-quality-ranking.csv\`

## Score Meaning

- A, 85-100: competitor-grade
- B, 75-84: standard-grade
- C, 65-74: usable but upgrade-needed
- D, 50-64: below industry standard
- F, 0-49: repair-first

## Distribution

| Rank | Rows | Weighted instances |
| --- | ---: | ---: |
| A | ${summary.score_distribution_rows.A} | ${summary.score_distribution_instances.A} |
| B | ${summary.score_distribution_rows.B} | ${summary.score_distribution_instances.B} |
| C | ${summary.score_distribution_rows.C} | ${summary.score_distribution_instances.C} |
| D | ${summary.score_distribution_rows.D} | ${summary.score_distribution_instances.D} |
| F | ${summary.score_distribution_rows.F} | ${summary.score_distribution_instances.F} |

Low-ranked rows below C: ${summary.low_ranked_count}
Repair-first rows below D: ${summary.repair_first_count}

## Lowest Category Averages

| Category | Rows | Instances | Avg score | Low rows | P0 | Browser failures |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
${categoryRows}

## P0 Queue

${tableFor(p0)}

## High-Value P1 Queue

${tableFor(highValue)}

## Lowest 100 Individual Tools

${tableFor(lowest)}
`;
}

function tableFor(records) {
  if (!records.length) return 'No rows in this queue.\n';
  const lines = [
    '| Score | Rank | Priority | Tool | Category | Benchmark | Top gaps |',
    '| ---: | --- | --- | --- | --- | --- | --- |',
  ];
  for (const record of records) {
    lines.push(`| ${record.score} | ${record.rank} | ${escapeMd(record.improvement_priority)} | ${escapeMd(record.id)} | ${escapeMd(record.category_label || record.category)} | ${escapeMd(record.benchmark_profile)} | ${escapeMd(record.gaps.slice(0, 4).join('; '))} |`);
  }
  return lines.join('\n');
}

async function main() {
  const registry = loadRegistry();
  const verification = loadVerification();
  const liveTools = registry.tools
    .filter((tool) => tool.status === 'live' || tool.status === 'new')
    .slice(0, LIMIT || undefined);
  const pages = liveTools.map((tool) => ({ tool, pageInfo: resolvePage(tool) }));
  const uniqueRoutes = Array.from(new Set(pages.map((entry) => entry.pageInfo.route))).sort();
  const browserResults = RUN_BROWSER ? await runBrowserSmoke(uniqueRoutes) : {};

  const records = pages.map(({ tool, pageInfo }) => {
    const html = pageInfo.exists ? fs.readFileSync(pageInfo.filePath, 'utf8') : '';
    const detected = detectFeatures(tool, html, pageInfo, verification);
    const browser = browserResults[pageInfo.route] || null;
    const score = scoreTool(tool, pageInfo, detected, browser);
    return {
      id: tool.id,
      name: tool.name,
      href: tool.href,
      route: pageInfo.route,
      file: pageInfo.relative,
      status: tool.status,
      language: tool.lang || 'en',
      category: tool.category || 'uncategorized',
      category_label: (registry.categories[tool.category] && registry.categories[tool.category].name) || tool.category || 'Uncategorized',
      tier: tool.tier || '',
      priority: Number(tool.priority || 0),
      estTraffic: Number(tool.estTraffic || 0),
      estRevenue: Number(tool.estRevenue || 0),
      instance_count: Number(tool.toolCount || 1),
      score: score.score,
      rank: score.rank,
      standard_status: score.standard_status,
      improvement_priority: score.improvement_priority,
      benchmark_profile: score.benchmark_profile,
      benchmark_standard: score.benchmark_standard,
      competitor_set: score.competitor_set,
      dimension_scores: score.dimension_scores,
      required_features_met: score.required_features_met,
      required_features_missing: score.required_features_missing,
      strong_features_met: score.strong_features_met,
      strong_features_missing: score.strong_features_missing,
      gaps: score.gaps,
      strengths: score.strengths,
      quality_deductions: score.quality_deductions,
      browser,
      evidence: {
        title: detected.title,
        meta_description_length: detected.metaDescription.length,
        h1_count: detected.h1Count,
        visible_words: detected.visibleWords,
        inputs: detected.inputs,
        buttons: detected.buttons,
        forms: detected.forms,
        img_count: detected.imgCount,
        missing_alt: detected.missingAlt,
        external_source_links: detected.externalSourceLinks,
        official_source: detected.officialSource,
        verification_entry: detected.verificationEntry,
      },
    };
  }).sort((a, b) => a.score - b.score || b.priority - a.priority || a.id.localeCompare(b.id));

  const liveInstances = typeof registry.getTotalToolCount === 'function'
    ? registry.getTotalToolCount((tool) => tool.status === 'live' || tool.status === 'new')
    : liveTools.reduce((sum, tool) => sum + Number(tool.toolCount || 1), 0);
  const registryStats = {
    total_registry_rows: registry.tools.length,
    live_new_rows: registry.tools.filter((tool) => tool.status === 'live' || tool.status === 'new').length,
    scored_rows: records.length,
    live_instances: liveInstances,
    unique_routes: uniqueRoutes.length,
  };
  const browserSummary = {
    enabled: RUN_BROWSER,
    routes_tested: RUN_BROWSER ? Object.keys(browserResults).length : 0,
    failures: RUN_BROWSER ? Object.values(browserResults).filter((result) => !result.ok).length : 0,
    routes_with_console_or_page_errors: RUN_BROWSER ? Object.values(browserResults).filter((result) => (result.consoleErrors || 0) + (result.pageErrors || 0) > 0).length : 0,
    timeout_ms: RUN_BROWSER ? BROWSER_TIMEOUT : 0,
    concurrency: RUN_BROWSER ? CONCURRENCY : 0,
  };
  const summary = summarize(records, registryStats, browserSummary);
  writeReports(records, summary);

  console.log(`Scored ${records.length} live/new tool rows (${liveInstances} expanded instances).`);
  console.log(`A/B/C/D/F rows: ${summary.score_distribution_rows.A}/${summary.score_distribution_rows.B}/${summary.score_distribution_rows.C}/${summary.score_distribution_rows.D}/${summary.score_distribution_rows.F}`);
  if (RUN_BROWSER) {
    console.log(`Browser smoke tested ${browserSummary.routes_tested} unique routes; failures: ${browserSummary.failures}; routes with console/page errors: ${browserSummary.routes_with_console_or_page_errors}.`);
  }
  console.log(`Wrote ${path.relative(ROOT, REPORT_MD)}, ${path.relative(ROOT, REPORT_JSON)}, ${path.relative(ROOT, REPORT_CSV)}.`);
}

main().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exit(1);
});
