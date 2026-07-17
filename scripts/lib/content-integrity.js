'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const EXCEPTIONS_PATH = path.join(ROOT, 'data/quality/content-integrity-exceptions.json');
const COVERAGE_PATH = path.join(ROOT, 'data/registry/locale-page-coverage.json');
const ROUTE_GRAPH_PATH = path.join(ROOT, 'data/registry/route-graph.json');
const CATALOG_DIR = path.join(ROOT, 'lang');

const SKIP_DIRS = new Set([
  '.agents', '.claude', '.git', '.jamb-tools', '.playwright', '.cache',
  'afrotools-deploy', 'artifacts', 'audit-results', 'dist', 'node_modules', 'output',
  'playwright-report', 'reports', 'test-results', 'tests'
]);

const LOCALIZED = new Set(['fr', 'sw', 'yo', 'ha']);
const USER_FACING_JSON_KEYS = /^(title|name|description|summary|excerpt|lead|copy|content|body|label|message|help|warning|disclaimer)$/i;
const INTERNAL_NOTE_RE = /\b(?:seo strategy|canonical(?:s)?\s+(?:and|&)\s+hreflang|hreflang implementation|route\s+fran[cç]aise\s+canonique|outil\s+source\s+conserv[eé]|version\s+source|dom localization|source engine|premium[- ]page(?: construction)?|generation process|translation procedure|internal translation|edit source data|generated page construction)\b/i;
const PLACEHOLDER_RE = /\b(?:TODO|FIXME|TBD|REPLACE[_ -]?ME|placeholder copy)\b/i;
const TEMPLATE_RE = /\{\{\s*[^{}]+\s*\}\}|\$\{\s*[^{}]+\s*\}|<%=?[\s\S]*?%>|\{%[\s\S]*?%\}/;
const RAW_CSS_RE = /(?:^|\s)(?:[.#][A-Za-z][\w-]*|[A-Za-z][\w-]*(?:\s+[.#]?[A-Za-z][\w-]*)+)\s*\{\s*(?:--[\w-]+|[A-Za-z-]+)\s*:[^{};]+;/m;
const RAW_JS_RE = /\b(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*=|\bdocument\.(?:querySelector|getElementById|createElement)\s*\(|\bfunction\s*[A-Za-z_$]*\s*\([^)]*\)\s*\{|=>\s*\{/;
const FRONT_MATTER_RE = /(?:^|\n)---\s*\n(?:title|description|layout|lang|locale|slug|date)\s*:/i;

const STOP_WORDS = {
  en: new Set('the and for with from this that these those your you are is was were will can should into about when where what how use using page tool result results before after not or if on in to of a an as by at it its we our they their has have be'.split(' ')),
  fr: new Set('le la les un une des du de et pour avec dans sur votre vos vous est sont ce cette ces avant après pas ou si en au aux par comme nous notre leur leurs outil page résultat résultats utiliser'.split(' ')),
  sw: new Set('na ya kwa katika ni cha vya wa hii hizi au kama kutoka kabla baada yako wewe kutumia ukurasa zana matokeo inaweza unaweza ambayo kuwa la za'.split(' ')),
  yo: new Set('ati ni fun pẹlu lati ti si tabi yii naa jẹ ko iwọ rẹ wa ninu lori ṣaaju lẹhin irinṣẹ oju esi abajade le lilo awọn kan'.split(' ')),
  ha: new Set('da na ne ce don ko wannan wadannan zuwa ana ake cikin wani wata kafin bayan naka kai amfani shafi kayan sakamako zai iya wanda ta'.split(' '))
};

function normalizeText(value) {
  return String(value == null ? '' : value)
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeHtml(value) {
  return String(value || '')
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–');
}

function stripTags(value) {
  return normalizeText(decodeHtml(String(value || '').replace(/<[^>]+>/g, ' ')));
}

function lineAt(source, index) {
  return source.slice(0, Math.max(0, index)).split(/\r?\n/).length;
}

function contentHash(value) {
  return crypto.createHash('sha256').update(normalizeText(value)).digest('hex').slice(0, 16);
}

function stableId(route) {
  return `content:${crypto.createHash('sha1').update(route).digest('hex').slice(0, 16)}`;
}

function parseAttributes(tag) {
  const attrs = {};
  for (const match of tag.matchAll(/([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    attrs[match[1].toLowerCase()] = match[2] === undefined ? match[3] : match[2];
  }
  return attrs;
}

function routeForFile(file) {
  let rel = String(file).replace(/\\/g, '/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return `/${rel.slice(0, -'index.html'.length)}`;
  if (rel.endsWith('.html')) return `/${rel.slice(0, -'.html'.length)}`;
  return null;
}

function readMeta(html, name) {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs = parseAttributes(match[0]);
    if ((attrs.name || '').toLowerCase() === name.toLowerCase()) return attrs.content || '';
  }
  return '';
}

function htmlLocale(html) {
  const match = html.match(/<html\b[^>]*>/i);
  const lang = match ? parseAttributes(match[0]).lang || '' : '';
  return lang.toLowerCase().split('-')[0];
}

function inferGeneratedOwner(html, file) {
  const explicit = readMeta(html, 'afrotools-source-owner');
  if (explicit) return explicit;
  const comment = html.match(/<!--\s*Generated by\s+([^.;]+(?:\.js)?)/i);
  if (comment) return normalizeText(comment[1]);
  if (/afrotools-fr-source-hash|name=["']afrotools-source-hash/i.test(html) && file.startsWith('fr/')) return 'scripts/build-french-product-surface.js';
  if (/afrotools-sw-source-hash/i.test(html)) return 'scripts/build-swahili-product-surface.js';
  if (/afrotools-ha-source-hash/i.test(html)) return 'scripts/build-hausa-product-surface.js';
  return null;
}

function isGeneratedHtml(html) {
  return /<!--\s*Generated by\s+/i.test(html) || /name=["']afrotools(?:-[a-z]{2})?-source-hash["']/i.test(html) || /name=["']afrotools-source-owner["']/i.test(html);
}

function makeFinding(input) {
  const content = normalizeText(input.content || input.message || '');
  return {
    ruleId: input.ruleId,
    severity: input.severity || 'blocker',
    file: String(input.file || '').replace(/\\/g, '/'),
    line: input.line || 1,
    route: input.route || null,
    locale: input.locale || null,
    state: input.state || null,
    block: input.block || null,
    content,
    contentHash: contentHash(content),
    editableSource: input.editableSource || input.file,
    contentId: input.contentId || null,
    message: input.message || content
  };
}

function maskMatch(value) {
  return String(value).replace(/[^\r\n]/g, ' ');
}

function removeNonVisible(html) {
  return String(html || '')
    .replace(/<head\b[\s\S]*?<\/head>/gi, maskMatch)
    .replace(/<script\b[\s\S]*?<\/script>/gi, maskMatch)
    .replace(/<style\b[\s\S]*?<\/style>/gi, maskMatch)
    .replace(/<template\b[\s\S]*?<\/template>/gi, maskMatch)
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, maskMatch)
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, maskMatch)
    .replace(/<nav\b[\s\S]*?<\/nav>/gi, maskMatch)
    .replace(/<footer\b[\s\S]*?<\/footer>/gi, maskMatch)
    .replace(/<!--[\s\S]*?-->/g, maskMatch);
}

function extractBlocks(html) {
  const visible = removeNonVisible(html);
  const blocks = [];
  const re = /<(h1|h2|h3|p|li|label|button|figcaption|blockquote|td|th)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
  let match;
  while ((match = re.exec(visible)) !== null) {
    const attrs = parseAttributes(`<${match[1]} ${match[2]}>`);
    if (/\bhidden\b/i.test(match[2]) || attrs['aria-hidden'] === 'true' || /\binert\b/i.test(match[2])) continue;
    if (/\b(?:source-list|references|citation|code-output)\b/i.test(attrs.class || '')) continue;
    const text = stripTags(match[3]);
    if (!text) continue;
    blocks.push({ tag: match[1].toLowerCase(), attrs, text, index: match.index, end: match.index + match[0].length });
  }
  return blocks;
}

function tokenize(text) {
  return (normalizeText(text).toLowerCase().match(/[\p{L}\p{M}']+/gu) || []).map((word) => word.replace(/^'+|'+$/g, '')).filter(Boolean);
}

function stopHits(tokens, locale) {
  const words = STOP_WORDS[locale] || new Set();
  return tokens.reduce((count, word) => count + (words.has(word) ? 1 : 0), 0);
}

function isCitationLike(block) {
  return block.tag === 'blockquote' || /\b(?:source|sources|reference|references|citation|official-name)\b/i.test(block.attrs.class || '') || /https?:\/\//i.test(block.text);
}

function languageContamination(block, locale, catalogValues) {
  if (!LOCALIZED.has(locale) || isCitationLike(block)) return null;
  const normalized = normalizeText(block.text).toLowerCase();
  if (catalogValues && catalogValues.has(normalized)) return null;
  const tokens = tokenize(block.text);
  if (tokens.length < 18) return null;
  const english = stopHits(tokens, 'en');
  const local = stopHits(tokens, locale);
  const englishRatio = english / tokens.length;
  if (english < 5 || englishRatio < 0.22 || local > 2 || english < local * 2) return null;
  return { tokens: tokens.length, english, local, englishRatio: Number(englishRatio.toFixed(3)) };
}

function labelForeignLanguageBlocks(html, locale, foreignLocale = 'en', catalogValues) {
  const edits = extractBlocks(html)
    .filter((block) => !(block.attrs.lang || '').toLowerCase().startsWith(`${foreignLocale}`))
    .filter((block) => foreignLocale === 'en' && languageContamination(block, locale, catalogValues))
    .sort((a, b) => b.index - a.index);
  let output = html;
  for (const block of edits) {
    const openEnd = output.indexOf('>', block.index);
    if (openEnd < 0) continue;
    output = `${output.slice(0, openEnd)} lang="${foreignLocale}" data-explicit-language-fallback="true"${output.slice(openEnd)}`;
  }
  return { html: output, count: edits.length };
}

function dedupeRepeatedParagraphs(html) {
  const groups = new Map();
  for (const block of extractBlocks(html).filter((entry) => entry.tag === 'p' && entry.text.length >= 100)) {
    const key = block.text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(block);
  }
  const ranges = [];
  for (const blocks of groups.values()) {
    for (const block of blocks.slice(1)) {
      const detailsOpen = html.lastIndexOf('<details', block.index);
      const detailsCloseBefore = html.lastIndexOf('</details>', block.index);
      const detailsCloseAfter = html.indexOf('</details>', block.end);
      if (detailsOpen > detailsCloseBefore && detailsCloseAfter >= block.end) ranges.push({ start: detailsOpen, end: detailsCloseAfter + '</details>'.length });
      else ranges.push({ start: block.index, end: block.end });
    }
  }
  const unique = [];
  for (const range of ranges.sort((a, b) => b.start - a.start || b.end - a.end)) {
    if (unique.some((kept) => range.start >= kept.start && range.end <= kept.end)) continue;
    unique.push(range);
  }
  let output = html;
  for (const range of unique) output = `${output.slice(0, range.start)}${output.slice(range.end)}`;
  return { html: output, count: unique.length };
}

function auditHtml(html, context = {}) {
  const file = String(context.file || 'fixture.html').replace(/\\/g, '/');
  const route = context.route || routeForFile(file);
  const locale = context.locale || htmlLocale(html);
  const state = context.state || null;
  const routeState = context.routeState || null;
  const generated = isGeneratedHtml(html);
  const editableSource = context.editableSource || inferGeneratedOwner(html, file) || file;
  const declaredContentId = readMeta(html, 'afrotools-content-id') || null;
  const findings = [];
  const add = (ruleId, input = {}) => findings.push(makeFinding({ ruleId, file, route, locale, state, editableSource, contentId: declaredContentId, ...input }));
  const blocks = extractBlocks(html);
  const explicitLanguageFallback = readMeta(html, 'afrotools-language-fallback').toLowerCase() === 'en'
    && /data-language-fallback-notice\b/i.test(html);
  blocks.forEach((block, index) => {
    const input = { line: lineAt(html, block.index), block: `${block.tag}[${index}]`, content: block.text };
    if (RAW_CSS_RE.test(block.text)) add('RAW_CSS_VISIBLE', { ...input, message: 'Raw CSS appears in visible page content.' });
    if (RAW_JS_RE.test(block.text)) add('RAW_JS_VISIBLE', { ...input, message: 'Raw JavaScript appears in visible page content.' });
    if (FRONT_MATTER_RE.test(block.text)) add('FRONT_MATTER_VISIBLE', { ...input, message: 'Front matter appears in visible page content.' });
    if (INTERNAL_NOTE_RE.test(block.text)) add('INTERNAL_IMPLEMENTATION_NOTE', { ...input, message: 'Internal implementation commentary appears in visible page content.' });
    if (PLACEHOLDER_RE.test(block.text)) add('PLACEHOLDER_COPY', { ...input, message: 'Placeholder or unfinished copy appears in visible page content.' });
    if (TEMPLATE_RE.test(block.text)) add('UNRESOLVED_TEMPLATE', { ...input, message: 'An unresolved template expression appears in visible page content.' });
  });

  const activeH1 = [];
  const visibleHtml = removeNonVisible(html);
  for (const match of visibleHtml.matchAll(/<h1\b([^>]*)>([\s\S]*?)<\/h1>/gi)) {
    const attrs = parseAttributes(`<h1 ${match[1]}>`);
    const inert = /\bhidden\b/i.test(match[1]) && /\binert\b/i.test(match[1]) && attrs['aria-hidden'] === 'true';
    if (!inert) activeH1.push({ text: stripTags(match[2]), index: match.index || 0 });
  }
  if (activeH1.length > 1) add('DUPLICATE_PRIMARY_HEADING', {
    line: lineAt(html, activeH1[1].index),
    content: activeH1.map((heading) => heading.text).join(' | '),
    message: `${activeH1.length} logical H1 headings are exposed; use one primary heading or make duplicates inert and aria-hidden.`
  });

  const head = (html.match(/<head\b[\s\S]*?<\/head>/i) || [''])[0];
  const canonicalCount = (head.match(/<link\b[^>]*\brel=["']canonical["'][^>]*>/gi) || []).length;
  const descriptionCount = (head.match(/<meta\b[^>]*\bname=["']description["'][^>]*>/gi) || []).length;
  if (canonicalCount > 1) add('DUPLICATE_METADATA', { content: `${canonicalCount} canonical links`, message: `${canonicalCount} canonical links are present.` });
  if (descriptionCount > 1) add('DUPLICATE_METADATA', { content: `${descriptionCount} meta descriptions`, message: `${descriptionCount} meta descriptions are present.` });

  const paragraphMap = new Map();
  blocks.filter((block) => block.tag === 'p' && block.text.length >= 100).forEach((block) => {
    const key = block.text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
    if (!paragraphMap.has(key)) paragraphMap.set(key, []);
    paragraphMap.get(key).push(block);
  });
  for (const repeated of paragraphMap.values()) {
    if (repeated.length < 2) continue;
    add('REPEATED_CONTENT_BLOCK', {
      line: lineAt(html, repeated[1].index), block: 'p', content: repeated[0].text,
      message: `The same paragraph appears ${repeated.length} times in the page content.`
    });
  }

  if (routeState !== 'redirect' && LOCALIZED.has(locale) && !['english-fallback', 'unavailable', 'deprecated'].includes(state)) {
    blocks.forEach((block, index) => {
      if (explicitLanguageFallback && (block.attrs.lang || '').toLowerCase().startsWith('en')) return;
      const evidence = languageContamination(block, locale, context.catalogValues);
      if (!evidence) return;
      add('LANGUAGE_BLOCK_CONTAMINATION', {
        line: lineAt(html, block.index), block: `${block.tag}[${index}]`, content: block.text,
        message: `Large English-language block on ${locale} page (${evidence.english}/${evidence.tokens} English stop words; ${evidence.local} local stop words).`
      });
    });
  }

  if (generated) {
    const sourceOwner = readMeta(html, 'afrotools-source-owner');
    if (!declaredContentId) add('GENERATED_CONTENT_ID_MISSING', { content: route, message: 'Generated page is missing a stable afrotools-content-id.' });
    else if (!/^[a-z0-9][a-z0-9:._/-]+$/.test(declaredContentId)) add('GENERATED_CONTENT_ID_INVALID', { content: declaredContentId, message: 'Generated content ID is not stable or machine-safe.' });
    if (!sourceOwner) add('GENERATED_SOURCE_OWNER_MISSING', { content: route, message: 'Generated page is missing afrotools-source-owner.' });
    else if (!fs.existsSync(path.join(ROOT, sourceOwner))) add('GENERATED_SOURCE_OWNER_MISSING', { content: sourceOwner, message: `Generated source owner does not exist: ${sourceOwner}.` });
    else if (/\.html$/i.test(sourceOwner)) add('GENERATED_SOURCE_IS_OUTPUT', { content: sourceOwner, message: 'Generated output cannot be its own editable source.' });
  }

  return findings;
}

function auditMarkdown(markdown, context = {}) {
  const file = context.file || 'fixture.md';
  const findings = [];
  const add = (ruleId, message, content) => findings.push(makeFinding({ ruleId, file, editableSource: file, message, content }));
  if (RAW_CSS_RE.test(markdown)) add('RAW_CSS_VISIBLE', 'Raw CSS appears in Markdown content.', markdown);
  if (RAW_JS_RE.test(markdown)) add('RAW_JS_VISIBLE', 'Raw JavaScript appears in Markdown content.', markdown);
  if (FRONT_MATTER_RE.test(markdown.replace(/^---[\s\S]*?---/, ''))) add('FRONT_MATTER_VISIBLE', 'A second or malformed front-matter block appears in Markdown content.', markdown);
  if (INTERNAL_NOTE_RE.test(markdown)) add('INTERNAL_IMPLEMENTATION_NOTE', 'Internal implementation commentary appears in Markdown content.', markdown);
  if (PLACEHOLDER_RE.test(markdown)) add('PLACEHOLDER_COPY', 'Placeholder or unfinished copy appears in Markdown content.', markdown);
  if (TEMPLATE_RE.test(markdown)) add('UNRESOLVED_TEMPLATE', 'An unresolved template expression appears in Markdown content.', markdown);
  return findings;
}

function auditJsonValue(value, context = {}, keyPath = []) {
  const findings = [];
  if (Array.isArray(value)) {
    value.forEach((entry, index) => findings.push(...auditJsonValue(entry, context, keyPath.concat(index))));
    return findings;
  }
  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, entry]) => findings.push(...auditJsonValue(entry, context, keyPath.concat(key))));
    return findings;
  }
  const key = String(keyPath[keyPath.length - 1] || '');
  if (typeof value !== 'string' || !USER_FACING_JSON_KEYS.test(key)) return findings;
  const file = context.file || 'fixture.json';
  const add = (ruleId, message) => findings.push(makeFinding({ ruleId, file, editableSource: file, block: keyPath.join('.'), content: value, message }));
  if (INTERNAL_NOTE_RE.test(value)) add('INTERNAL_IMPLEMENTATION_NOTE', `Internal implementation commentary appears in ${keyPath.join('.')}.`);
  if (PLACEHOLDER_RE.test(value)) add('PLACEHOLDER_COPY', `Placeholder copy appears in ${keyPath.join('.')}.`);
  if (TEMPLATE_RE.test(value)) add('UNRESOLVED_TEMPLATE', `Unresolved template expression appears in ${keyPath.join('.')}.`);
  if (RAW_CSS_RE.test(value)) add('RAW_CSS_VISIBLE', `Raw CSS appears in ${keyPath.join('.')}.`);
  if (RAW_JS_RE.test(value)) add('RAW_JS_VISIBLE', `Raw JavaScript appears in ${keyPath.join('.')}.`);
  return findings;
}

function walk(directory, predicate, output = []) {
  if (!fs.existsSync(directory)) return output;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.well-known') continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(absolute, predicate, output);
    } else if (predicate(absolute)) output.push(absolute);
  }
  return output;
}

function loadCoverage() {
  const map = new Map();
  if (fs.existsSync(ROUTE_GRAPH_PATH)) {
    const graph = JSON.parse(fs.readFileSync(ROUTE_GRAPH_PATH, 'utf8'));
    for (const row of graph.routes || []) if (row.route) map.set(row.route, {
      routeState: row.state || null,
      coverageState: row.localeCoverage && row.localeCoverage.state || null
    });
  } else if (fs.existsSync(COVERAGE_PATH)) {
    const coverage = JSON.parse(fs.readFileSync(COVERAGE_PATH, 'utf8'));
    for (const row of coverage.records || []) map.set(row.route, { routeState: 'page', coverageState: row.state });
  }
  return map;
}

function routeMetaFor(coverage, route, file) {
  if (!route) return {};
  const candidates = [route];
  if (route !== '/') {
    candidates.push(route.endsWith('/') ? route.slice(0, -1) : `${route}/`);
    if (String(file || '').endsWith('.html') && !String(file || '').endsWith('/index.html')) candidates.push(`${route}.html`);
  }
  for (const candidate of candidates) if (coverage.has(candidate)) return coverage.get(candidate);
  return {};
}

function flattenStrings(value, output = []) {
  if (typeof value === 'string') output.push(normalizeText(value).toLowerCase());
  else if (Array.isArray(value)) value.forEach((entry) => flattenStrings(entry, output));
  else if (value && typeof value === 'object') Object.values(value).forEach((entry) => flattenStrings(entry, output));
  return output;
}

function loadCatalogValues(locale) {
  const file = path.join(CATALOG_DIR, `${locale}.json`);
  if (!fs.existsSync(file)) return new Set();
  return new Set(flattenStrings(JSON.parse(fs.readFileSync(file, 'utf8'))));
}

function validateExceptions(registry) {
  const errors = [];
  if (!registry || registry.schemaVersion !== 1 || !Array.isArray(registry.exceptions)) return ['Exception registry must use schemaVersion 1 and an exceptions array.'];
  const ids = new Set();
  for (const row of registry.exceptions) {
    if (!row.id || ids.has(row.id)) errors.push(`Exception id is missing or duplicated: ${row.id || '(missing)'}`);
    ids.add(row.id);
    for (const key of ['ruleId', 'path', 'contentHash', 'reason', 'owner', 'reviewedAt', 'expiresAt']) if (!row[key]) errors.push(`${row.id || '(missing)'} missing ${key}`);
    if (row.expiresAt && new Date(`${row.expiresAt}T23:59:59Z`) < new Date()) errors.push(`${row.id} expired on ${row.expiresAt}`);
  }
  return errors;
}

function globMatches(pattern, file) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '::DOUBLE::').replace(/\*/g, '[^/]*').replace(/::DOUBLE::/g, '.*');
  return new RegExp(`^${escaped}$`).test(file);
}

function applyExceptions(findings, registry) {
  const reviewed = [];
  const active = [];
  for (const finding of findings) {
    const exception = (registry.exceptions || []).find((row) => row.ruleId === finding.ruleId && globMatches(row.path, finding.file) && row.contentHash === finding.contentHash);
    if (exception) reviewed.push({ ...finding, exceptionId: exception.id, exceptionReason: exception.reason });
    else active.push(finding);
  }
  return { active, reviewed };
}

function runRepositoryAudit(options = {}) {
  const coverage = loadCoverage();
  const catalogCache = new Map();
  const htmlFiles = walk(ROOT, (file) => file.endsWith('.html'));
  const findings = [];
  const contentIds = new Map();
  const generatedOwners = new Set();
  let generatedPages = 0;
  for (const absolute of htmlFiles) {
    const file = path.relative(ROOT, absolute).replace(/\\/g, '/');
    const html = fs.readFileSync(absolute, 'utf8');
    if (isGeneratedHtml(html)) {
      generatedPages += 1;
      const owner = inferGeneratedOwner(html, file);
      if (owner) generatedOwners.add(owner);
    }
    const route = routeForFile(file);
    const locale = htmlLocale(html);
    const routeMeta = routeMetaFor(coverage, route, file);
    if (!catalogCache.has(locale)) catalogCache.set(locale, loadCatalogValues(locale));
    const rows = auditHtml(html, { file, route, locale, state: routeMeta.coverageState || null, routeState: routeMeta.routeState || null, catalogValues: catalogCache.get(locale) });
    findings.push(...rows);
    const id = readMeta(html, 'afrotools-content-id');
    if (id) {
      if (contentIds.has(id)) findings.push(makeFinding({ ruleId: 'GENERATED_CONTENT_ID_DUPLICATE', file, route, locale, contentId: id, editableSource: inferGeneratedOwner(html, file) || file, content: id, message: `Content ID ${id} is also used by ${contentIds.get(id)}.` }));
      else contentIds.set(id, file);
    }
  }

  const jsonRoots = [path.join(ROOT, 'data/localization'), path.join(ROOT, 'data/registry')];
  for (const jsonRoot of jsonRoots) {
    for (const absolute of walk(jsonRoot, (file) => file.endsWith('.json'))) {
      const file = path.relative(ROOT, absolute).replace(/\\/g, '/');
      try { findings.push(...auditJsonValue(JSON.parse(fs.readFileSync(absolute, 'utf8')), { file })); }
      catch (error) { findings.push(makeFinding({ ruleId: 'SOURCE_JSON_INVALID', file, editableSource: file, content: error.message, message: `Invalid source JSON: ${error.message}` })); }
    }
  }

  const registry = options.exceptions || JSON.parse(fs.readFileSync(EXCEPTIONS_PATH, 'utf8'));
  const exceptionErrors = validateExceptions(registry);
  exceptionErrors.forEach((message) => findings.push(makeFinding({ ruleId: 'CONTENT_EXCEPTION_INVALID', file: path.relative(ROOT, EXCEPTIONS_PATH).replace(/\\/g, '/'), editableSource: path.relative(ROOT, EXCEPTIONS_PATH).replace(/\\/g, '/'), content: message, message })));
  const result = applyExceptions(findings, registry);
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    scanned: {
      html: htmlFiles.length,
      generatedPages,
      stableContentIds: contentIds.size,
      generatedSourceOwners: [...generatedOwners].sort(),
      sourceJsonRoots: jsonRoots.map((root) => path.relative(ROOT, root).replace(/\\/g, '/'))
    },
    summary: {
      blockers: result.active.filter((row) => row.severity === 'blocker').length,
      warnings: result.active.filter((row) => row.severity !== 'blocker').length,
      reviewedExceptions: result.reviewed.length,
      byRule: result.active.reduce((acc, row) => { acc[row.ruleId] = (acc[row.ruleId] || 0) + 1; return acc; }, {})
    },
    findings: result.active.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.ruleId.localeCompare(b.ruleId)),
    reviewedExceptions: result.reviewed
  };
}

function formatFinding(row) {
  return `[${row.ruleId}] ${row.file}:${row.line}${row.route ? ` route=${row.route}` : ''} owner=${row.editableSource} - ${row.message}`;
}

module.exports = {
  ROOT,
  auditHtml,
  auditMarkdown,
  auditJsonValue,
  runRepositoryAudit,
  validateExceptions,
  applyExceptions,
  formatFinding,
  stableId,
  routeForFile,
  contentHash,
  labelForeignLanguageBlocks,
  dedupeRepeatedParagraphs,
  loadCatalogValues
};
