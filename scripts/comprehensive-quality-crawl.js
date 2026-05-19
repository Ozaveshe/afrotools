#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'audit-results');
const EXCLUDED_DIRS = new Set([
  '.git',
  '.claude',
  '.codex',
  '.github',
  '.playwright',
  '.tmp-codex',
  '.tmp-validation',
  'node_modules',
  'dist',
  'reports',
  'test-results',
  'tests',
  'scripts',
]);

const INTERNAL_HTML = new Set([
  'afrotools-mission-control.html',
  'mc-7a2f9x.html',
]);

const REDIRECT_RULES = collectRedirectRules();

const PLACEHOLDER_PATTERNS = [
  /\blorem ipsum\b/i,
  /\bcoming soon\b/i,
  /\bplaceholder\b/i,
  /\btodo\b/i,
  /\bfixme\b/i,
];

const JARGON_PATTERNS = [
  /\bleverage\b/i,
  /\bseamless experience\b/i,
  /\bcutting-edge\b/i,
  /\brobust solution\b/i,
  /\bempower users\b/i,
  /\brevolutionize\b/i,
  /\bunlock your potential\b/i,
  /\bAI-powered ecosystem\b/i,
  /\bnext-generation platform\b/i,
  /\bcomprehensive suite\b/i,
  /\butilize\b/i,
  /\bfacilitate\b/i,
  /\bstreamline your workflow\b/i,
];

const MOJIBAKE_RE = /Ã.|Â.|â€™|â€œ|â€\u009d|â€”|â€“|â†’|ðŸ|áº|á»|Æ˜/;

main();

function main() {
  const sitemapUrls = collectSitemapUrls();
  const htmlFiles = collectHtmlFiles();
  const filePages = htmlFiles.map((file) => {
    const rel = toPosix(path.relative(ROOT, file));
    return {
      route: routeFromRel(rel),
      rel,
      abs: file,
      source: 'file',
    };
  });
  const pageByRoute = new Map();
  for (const page of filePages) pageByRoute.set(page.route, page);

  const sitemapPages = sitemapUrls.map((url) => {
    const route = routeFromUrl(url);
    const rel = relFromRoute(route);
    const abs = rel ? path.join(ROOT, rel) : null;
    return {
      route,
      url,
      rel,
      abs,
      source: 'sitemap',
    };
  });

  const allRoutes = new Map();
  for (const page of filePages) allRoutes.set(page.route, page);
  for (const page of sitemapPages) {
    const existing = allRoutes.get(page.route) || {};
    allRoutes.set(page.route, Object.assign({}, existing, page, {
      source: existing.source ? `${existing.source}+sitemap` : 'sitemap',
    }));
  }

  const pages = [...allRoutes.values()].sort((a, b) => a.route.localeCompare(b.route));
  const results = pages.map(auditPage);
  const summary = summarize(results, sitemapUrls, htmlFiles);

  fs.mkdirSync(OUT, { recursive: true });
  writeJson('page-crawl-report.json', {
    generatedAt: new Date().toISOString(),
    root: ROOT,
    summary,
    pages: results,
  });
  writeCsv('broken-links.csv', results, 'brokenLinks');
  writeCsv('metadata-issues.csv', results, 'metadataIssues');
  writeCsv('dark-mode-issues.csv', results, 'darkModeIssues');
  writeCsv('copy-quality-issues.csv', results, 'copyIssues');
  fs.writeFileSync(path.join(OUT, 'final-summary.md'), renderMarkdown(summary, results), 'utf8');

  console.log(`Comprehensive crawl complete: ${summary.routesDiscovered} routes, ${summary.pagesAudited} pages audited.`);
  console.log(`Broken pages: ${summary.brokenPages}; broken internal links: ${summary.brokenLinks}; metadata issues: ${summary.metadataIssues}; dark-mode risks: ${summary.darkModeIssues}; copy issues: ${summary.copyIssues}.`);
  console.log('Reports written under audit-results/.');
  if (summary.brokenPages || summary.brokenLinks) process.exitCode = 1;
}

function collectSitemapUrls() {
  const urls = new Set();
  const sitemapFiles = fs.readdirSync(ROOT)
    .filter((name) => /^sitemap.*\.xml$/i.test(name))
    .map((name) => path.join(ROOT, name));
  for (const file of sitemapFiles) {
    const xml = fs.readFileSync(file, 'utf8');
    for (const match of xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)) {
      const loc = decodeXml(match[1].trim());
      if (/^https?:\/\/(www\.)?afrotools\.com\//i.test(loc)) urls.add(loc);
    }
  }
  return [...urls]
    .filter((url) => !/\/sitemap[^/]*\.xml$/i.test(new URL(url).pathname))
    .filter((url) => !/\/reports\//i.test(new URL(url).pathname))
    .sort();
}

function collectHtmlFiles() {
  const files = [];
  walk(ROOT, (abs, rel) => {
    if (!/\.html$/i.test(rel)) return;
    if (INTERNAL_HTML.has(rel)) return;
    if (/\.body\.html$/i.test(rel)) return;
    files.push(abs);
  });
  return files.sort();
}

function walk(dir, onFile) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.well-known') continue;
    if (EXCLUDED_DIRS.has(entry.name)) continue;
    const abs = path.join(dir, entry.name);
    const rel = toPosix(path.relative(ROOT, abs));
    if (rel === 'admin' || rel.startsWith('admin/')) continue;
    if (rel === 'supabase' || rel.startsWith('supabase/')) continue;
    if (entry.isDirectory()) walk(abs, onFile);
    else if (entry.isFile()) onFile(abs, rel);
  }
}

function auditPage(page) {
  const result = {
    route: page.route,
    file: page.rel || '',
    source: page.source,
    status: 'ok',
    title: '',
    descriptionLength: 0,
    h1Count: 0,
    metadataIssues: [],
    accessibilityIssues: [],
    brokenLinks: [],
    brokenImages: [],
    darkModeIssues: [],
    copyIssues: [],
    mobileIssues: [],
    renderRisks: [],
  };

  if (!page.abs || !fs.existsSync(page.abs)) {
    result.status = 'missing_file';
    result.renderRisks.push(issue('missing_static_file', 'Sitemap route does not resolve to a source HTML file.'));
    return result;
  }

  const html = fs.readFileSync(page.abs, 'utf8');
  const isNoindex = /<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)
    || /<meta\b[^>]*content=["'][^"']*noindex[^"']*["'][^>]*name=["']robots["']/i.test(html);
  result.title = textFromMatch(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i));
  const desc = attrContent(html, 'description');
  result.descriptionLength = desc ? desc.length : 0;
  result.h1Count = (html.match(/<h1\b/gi) || []).length;

  auditMetadata(html, page, result, desc, isNoindex);
  auditAccessibility(html, page, result);
  auditLinks(html, page, result);
  auditImages(html, page, result);
  auditDarkMode(html, page, result);
  auditCopy(html, page, result);
  auditMobile(html, page, result);

  if (/Uncaught|ReferenceError|TypeError|undefined is not a function/i.test(html)) {
    result.renderRisks.push(issue('literal_runtime_error_text', 'Page includes literal JS error text.'));
  }

  return result;
}

function auditMetadata(html, page, result, desc, isNoindex) {
  if (!result.title) result.metadataIssues.push(issue('missing_title', 'Missing <title>.'));
  if (result.title && (result.title.length < 12 || result.title.length > 75)) {
    result.metadataIssues.push(issue('title_length', `Title length is ${result.title.length}.`));
  }
  if (!desc) result.metadataIssues.push(issue('missing_description', 'Missing meta description.'));
  if (desc && (desc.length < 50 || desc.length > 180)) {
    result.metadataIssues.push(issue('description_length', `Meta description length is ${desc.length}.`));
  }
  if (!/<link\b[^>]*rel=["']canonical["'][^>]*>/i.test(html)) {
    result.metadataIssues.push(issue('missing_canonical', 'Missing canonical link.'));
  }
  if (!isNoindex) {
    if (!/property=["']og:title["']/i.test(html)) result.metadataIssues.push(issue('missing_og_title', 'Missing og:title.'));
    if (!/property=["']og:description["']/i.test(html)) result.metadataIssues.push(issue('missing_og_description', 'Missing og:description.'));
    if (!/property=["']og:image["']/i.test(html)) result.metadataIssues.push(issue('missing_og_image', 'Missing og:image.'));
    if (!/name=["']twitter:card["']/i.test(html)) result.metadataIssues.push(issue('missing_twitter_card', 'Missing twitter:card.'));
  }
  if (result.h1Count === 0 && !isRedirectStub(html)) result.metadataIssues.push(issue('missing_h1', 'No H1 found.'));
  if (result.h1Count > 1) result.metadataIssues.push(issue('multiple_h1', `${result.h1Count} H1 tags found.`));
  for (const match of html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      JSON.parse(match[1]);
    } catch (error) {
      result.metadataIssues.push(issue('invalid_json_ld', error.message));
    }
  }
}

function auditAccessibility(html, page, result) {
  if (!/<html\b[^>]*\blang=["'][^"']+["']/i.test(html)) {
    result.accessibilityIssues.push(issue('missing_lang', 'Missing html lang attribute.'));
  }
  for (const button of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)) {
    const attrs = button[1] || '';
    const label = stripTags(button[2] || '').trim();
    if (!label && !/\baria-label=|\baria-labelledby=|\btitle=/i.test(attrs)) {
      result.accessibilityIssues.push(issue('button_name', 'Button has no accessible name.'));
    }
  }
  for (const input of html.matchAll(/<(input|select|textarea)\b([^>]*)>/gi)) {
    const attrs = input[2] || '';
    const id = attr(attrs, 'id');
    const type = (attr(attrs, 'type') || '').toLowerCase();
    if (['hidden', 'submit', 'button', 'reset', 'image'].includes(type)) continue;
    const hasLabel = id && new RegExp(`<label\\b[^>]*for=["']${escapeRegExp(id)}["']`, 'i').test(html);
    if (!hasLabel && !/\baria-label=|\baria-labelledby=/i.test(attrs)) {
      result.accessibilityIssues.push(issue('input_label', `${input[1]} is missing a visible or aria label.`));
    }
  }
  for (const iframe of html.matchAll(/<iframe\b([^>]*)>/gi)) {
    if (!/\btitle=["'][^"']+["']/i.test(iframe[1] || '')) {
      result.accessibilityIssues.push(issue('iframe_title', 'Iframe is missing a title.'));
    }
  }
}

function auditLinks(html, page, result) {
  const documentHtml = removeCodeBlocks(html);
  for (const match of documentHtml.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)) {
    const href = match[1].trim();
    if (!href || isExternalOrSpecial(href)) continue;
    if (href.startsWith('#')) continue;
    const resolved = resolveRouteFile(href, page.abs);
    if (!resolved) result.brokenLinks.push(issue('broken_internal_link', href));
  }
}

function auditImages(html, page, result) {
  const documentHtml = removeCodeBlocks(html);
  for (const match of documentHtml.matchAll(/<img\b([^>]*)>/gi)) {
    const attrs = match[1] || '';
    const src = attr(attrs, 'src');
    if (!/\balt=/i.test(attrs)) result.accessibilityIssues.push(issue('image_alt', src || 'Image missing alt attribute.'));
    if (!src || isExternalOrSpecial(src)) continue;
    const abs = resolveAssetFile(src, page.abs);
    if (!abs) result.brokenImages.push(issue('broken_image', src));
  }
}

function auditDarkMode(html, page, result) {
  const linkedCss = [...html.matchAll(/<link\b[^>]*href=["']([^"']+\.css(?:\?[^"']*)?)["'][^>]*>/gi)]
    .map((match) => resolveAssetFile(match[1], page.abs))
    .filter(Boolean);
  const cssText = linkedCss.map((file) => safeRead(file)).join('\n') + '\n' + [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join('\n');
  const hasSharedThemeLoader = /<afro-navbar\b/i.test(html)
    || /<script\b[^>]*src=["'][^"']*(navbar|dark-mode)(?:\.min)?\.js/i.test(html)
    || /data-theme|theme-dark|AfroTools\.darkMode/i.test(html);
  if (!hasSharedThemeLoader) {
    result.darkModeIssues.push(issue('no_dark_mode_loader_signal', 'No dark-mode loader or theme signal found in page source.'));
  }
  if (/@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)[\s\S]{0,800}body\s*{[\s\S]{0,180}background(?:-color)?\s*:\s*var\(--color-text\)/i.test(cssText)) {
    result.darkModeIssues.push(issue('dark_body_uses_text_token', 'Dark media query sets body background from --color-text.'));
  }
  const inlineLight = (html.match(/style=["'][^"']*(background(?:-color)?\s*:\s*(#fff|#ffffff|white|#f8fafc|#f9fafb))/gi) || []).length;
  if (inlineLight > 5) result.darkModeIssues.push(issue('many_inline_light_backgrounds', `${inlineLight} inline light backgrounds may need token coverage.`));
  const inlineDarkText = (html.match(/style=["'][^"']*color\s*:\s*(#000|#111827|#0f172a|black)/gi) || []).length;
  if (inlineDarkText > 5) result.darkModeIssues.push(issue('many_inline_dark_text_colors', `${inlineDarkText} inline dark text colors may clash in dark mode.`));
}

function auditCopy(html, page, result) {
  const visible = stripTags(html)
    .replace(/\s+/g, ' ')
    .trim();
  for (const pattern of PLACEHOLDER_PATTERNS) {
    const match = visible.match(pattern);
    if (match) result.copyIssues.push(issue('placeholder_copy', match[0]));
  }
  for (const pattern of JARGON_PATTERNS) {
    const match = visible.match(pattern);
    if (match) result.copyIssues.push(issue('jargon_copy', match[0]));
  }
  if (MOJIBAKE_RE.test(html)) {
    result.copyIssues.push(issue('mojibake_signal', 'Possible mojibake or broken entity text found.'));
  }
}

function auditMobile(html, page, result) {
  if (!/<meta\b[^>]*name=["']viewport["']/i.test(html)) result.mobileIssues.push(issue('missing_viewport', 'Missing viewport meta.'));
  const style = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join('\n');
  const hardWide = (style.match(/\b(width|min-width)\s*:\s*(?:[4-9]\d{2,}|1\d{3,})px/gi) || []).length;
  if (hardWide > 4) result.mobileIssues.push(issue('hard_wide_css', `${hardWide} hard wide width declarations in inline CSS.`));
  if (/width\s*:\s*100vw/i.test(style) && !/overflow-x\s*:\s*hidden/i.test(style)) {
    result.mobileIssues.push(issue('100vw_overflow_risk', 'Inline CSS uses 100vw without overflow guard.'));
  }
}

function summarize(results, sitemapUrls, htmlFiles) {
  const summary = {
    sitemapUrls: sitemapUrls.length,
    htmlFiles: htmlFiles.length,
    routesDiscovered: results.length,
    pagesAudited: results.filter((page) => page.status === 'ok').length,
    brokenPages: results.filter((page) => page.status !== 'ok').length,
    brokenLinks: sum(results, 'brokenLinks'),
    brokenImages: sum(results, 'brokenImages'),
    metadataIssues: sum(results, 'metadataIssues'),
    accessibilityIssues: sum(results, 'accessibilityIssues'),
    darkModeIssues: sum(results, 'darkModeIssues'),
    copyIssues: sum(results, 'copyIssues'),
    mobileIssues: sum(results, 'mobileIssues'),
    renderRisks: sum(results, 'renderRisks'),
  };
  summary.topIssueTypes = issueHistogram(results).slice(0, 30);
  return summary;
}

function issueHistogram(results) {
  const counts = new Map();
  for (const page of results) {
    for (const group of ['metadataIssues', 'accessibilityIssues', 'brokenLinks', 'brokenImages', 'darkModeIssues', 'copyIssues', 'mobileIssues', 'renderRisks']) {
      for (const item of page[group] || []) counts.set(item.id, (counts.get(item.id) || 0) + 1);
    }
  }
  return [...counts.entries()].map(([id, count]) => ({ id, count })).sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
}

function writeJson(name, data) {
  fs.writeFileSync(path.join(OUT, name), JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function writeCsv(name, results, key) {
  const rows = [['route', 'file', 'issue_id', 'detail']];
  for (const page of results) {
    for (const item of page[key] || []) rows.push([page.route, page.file, item.id, item.detail]);
  }
  fs.writeFileSync(path.join(OUT, name), rows.map((row) => row.map(csvCell).join(',')).join('\n') + '\n', 'utf8');
}

function renderMarkdown(summary, results) {
  const lines = [];
  lines.push('# AfroTools Comprehensive Audit Summary');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## Crawl Totals');
  lines.push('');
  lines.push(`- Sitemap URLs discovered: ${summary.sitemapUrls}`);
  lines.push(`- Source HTML files discovered: ${summary.htmlFiles}`);
  lines.push(`- Unique routes discovered: ${summary.routesDiscovered}`);
  lines.push(`- Pages audited: ${summary.pagesAudited}`);
  lines.push(`- Broken pages: ${summary.brokenPages}`);
  lines.push(`- Broken internal links: ${summary.brokenLinks}`);
  lines.push(`- Broken images: ${summary.brokenImages}`);
  lines.push(`- Metadata issues: ${summary.metadataIssues}`);
  lines.push(`- Accessibility issues: ${summary.accessibilityIssues}`);
  lines.push(`- Dark-mode risks: ${summary.darkModeIssues}`);
  lines.push(`- Copy-quality issues: ${summary.copyIssues}`);
  lines.push(`- Mobile issues: ${summary.mobileIssues}`);
  lines.push(`- Render risks: ${summary.renderRisks}`);
  lines.push('');
  lines.push('## Top Issue Types');
  lines.push('');
  lines.push('| Issue | Count |');
  lines.push('| --- | ---: |');
  for (const item of summary.topIssueTypes.slice(0, 20)) lines.push(`| ${item.id} | ${item.count} |`);
  lines.push('');
  lines.push('## Highest-Signal Pages');
  lines.push('');
  lines.push('| Route | Metadata | A11y | Dark | Copy | Mobile | Broken links |');
  lines.push('| --- | ---: | ---: | ---: | ---: | ---: | ---: |');
  const ranked = results
    .map((page) => ({
      page,
      score: page.metadataIssues.length + page.accessibilityIssues.length + page.darkModeIssues.length + page.copyIssues.length + page.mobileIssues.length + page.brokenLinks.length + page.brokenImages.length + page.renderRisks.length,
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.page.route.localeCompare(b.page.route))
    .slice(0, 30);
  for (const { page } of ranked) {
    lines.push(`| \`${page.route}\` | ${page.metadataIssues.length} | ${page.accessibilityIssues.length} | ${page.darkModeIssues.length} | ${page.copyIssues.length} | ${page.mobileIssues.length} | ${page.brokenLinks.length} |`);
  }
  lines.push('');
  lines.push('## Notes');
  lines.push('');
  lines.push('- This is a static source crawl. It complements `npm run check-links`, `npm run seo:report`, and browser smoke tests.');
  lines.push('- Dark-mode and mobile findings are risk signals from source, not computed-pixel failures.');
  lines.push('- Copy findings are intentionally conservative and should be fixed at shared source/templates first.');
  lines.push('');
  return lines.join('\n');
}

function sum(results, key) {
  return results.reduce((count, page) => count + ((page[key] || []).length), 0);
}

function issue(id, detail) {
  return { id, detail };
}

function routeFromUrl(url) {
  const parsed = new URL(url);
  return parsed.pathname || '/';
}

function routeFromRel(rel) {
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return `/${rel.slice(0, -10)}`;
  return `/${rel.replace(/\.html$/i, '')}`;
}

function relFromRoute(route) {
  const clean = decodeURIComponent(route.split('?')[0].replace(/^\/+/, ''));
  if (!clean) return 'index.html';
  const candidates = [
    path.join(clean, 'index.html'),
    `${clean}.html`,
    clean,
  ];
  for (const candidate of candidates) {
    const abs = path.join(ROOT, candidate);
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return toPosix(candidate);
  }
  return toPosix(candidates[0]);
}

function resolveRouteFile(href, pageAbs) {
  const clean = safeDecodeURIComponent(href.split('#')[0].split('?')[0].trim());
  if (!clean) return pageAbs;
  if (/^\/\//.test(clean) || /^https?:/i.test(clean)) return true;
  if (clean.startsWith('/api/')) return true;
  if (REDIRECT_RULES.some((rule) => redirectTargetExists(rule, clean))) return true;
  const base = clean.startsWith('/') ? ROOT : path.dirname(pageAbs);
  const target = (clean.startsWith('/') ? clean.replace(/^\/+/, '') : clean).replace(/\/+$/g, '');
  const candidates = [
    path.join(base, target),
    path.join(base, target, 'index.html'),
    path.join(base, `${target}.html`),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) || null;
}

function resolveAssetFile(src, pageAbs) {
  const clean = src.split('#')[0].split('?')[0].trim();
  if (!clean) return null;
  if (isExternalOrSpecial(clean)) return true;
  const abs = clean.startsWith('/')
    ? path.join(ROOT, clean.replace(/^\/+/, ''))
    : path.resolve(path.dirname(pageAbs), clean);
  if (!abs.startsWith(ROOT)) return null;
  return fs.existsSync(abs) && fs.statSync(abs).isFile() ? abs : null;
}

function isExternalOrSpecial(value) {
  return /^(https?:)?\/\//i.test(value)
    || /^(mailto|tel|sms|data|javascript):/i.test(value)
    || value.startsWith('#');
}

function attr(attrs, name) {
  const match = attrs.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i'));
  return match ? match[1] : '';
}

function attrContent(html, name) {
  const match = html.match(new RegExp(`<meta\\b[^>]*name=["']${escapeRegExp(name)}["'][^>]*content=["']([^"']*)["'][^>]*>`, 'i'))
    || html.match(new RegExp(`<meta\\b[^>]*content=["']([^"']*)["'][^>]*name=["']${escapeRegExp(name)}["'][^>]*>`, 'i'));
  return match ? decodeHtml(match[1].trim()) : '';
}

function textFromMatch(match) {
  return match ? decodeHtml(stripTags(match[1]).trim()) : '';
}

function stripTags(text) {
  return String(text || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
}

function isRedirectStub(html) {
  return /http-equiv=["']refresh["']/i.test(html) || /redirecting to/i.test(html) || /window\.location/i.test(html);
}

function safeRead(file) {
  try { return fs.readFileSync(file, 'utf8'); } catch (_) { return ''; }
}

function csvCell(value) {
  return `"${String(value || '').replace(/"/g, '""')}"`;
}

function decodeXml(value) {
  return value.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toPosix(filePath) {
  return filePath.replace(/\\/g, '/');
}

function removeCodeBlocks(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
}

function collectRedirectRules() {
  const rules = [];
  const redirectsPath = path.join(ROOT, '_redirects');
  if (fs.existsSync(redirectsPath)) {
    const lines = fs.readFileSync(redirectsPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [from, to, status] = trimmed.split(/\s+/);
      addRedirectRule(rules, from, to, status);
    }
  }

  const netlifyPath = path.join(ROOT, 'netlify.toml');
  if (fs.existsSync(netlifyPath)) {
    const lines = fs.readFileSync(netlifyPath, 'utf8').split(/\r?\n/);
    let current = null;
    const flush = () => {
      if (current) addRedirectRule(rules, current.from, current.to, current.status);
      current = null;
    };
    for (const raw of lines) {
      const line = raw.trim();
      if (line === '[[redirects]]') {
        flush();
        current = {};
        continue;
      }
      if (!current) continue;
      const fromMatch = line.match(/^from\s*=\s*"([^"]+)"/);
      if (fromMatch) current.from = fromMatch[1];
      const toMatch = line.match(/^to\s*=\s*"([^"]+)"/);
      if (toMatch) current.to = toMatch[1];
      const statusMatch = line.match(/^status\s*=\s*(\d+)/);
      if (statusMatch) current.status = statusMatch[1];
    }
    flush();
  }
  return rules;
}

function addRedirectRule(rules, from, to, status) {
  if (!from || !to || !from.startsWith('/')) return;
  const code = Number.parseInt(status, 10);
  if (code === 404 || code === 410) return;
  const compiled = compileRedirectPattern(from);
  rules.push({ from, to, status: code, re: compiled.re, names: compiled.names });
}

function compileRedirectPattern(pattern) {
  const normalized = normalizeRoute(pattern);
  const names = [];
  const body = normalized.split('/').map((segment) => {
    if (!segment) return '';
    if (segment === '*') {
      names.push('splat');
      return '(.*)';
    }
    if (/^:[A-Za-z][A-Za-z0-9_]*$/.test(segment)) {
      names.push(segment.slice(1));
      return '([^/]+)';
    }
    if (segment.includes('*')) {
      names.push('splat');
      return escapeRegExp(segment).replace(/\\\*/g, '(.*)');
    }
    return escapeRegExp(segment);
  }).join('/');
  return { re: new RegExp(`^${body}/?$`), names };
}

function redirectTargetExists(rule, href) {
  const route = normalizeRoute(href);
  const match = rule.re.exec(route);
  if (!match) return false;
  const target = substituteRedirectTarget(rule.to, rule.names, match);
  if (/^(https?:)?\/\//i.test(target)) return true;
  if (/^\/?\.netlify\/functions\//i.test(target)) return true;
  if (/^\/api\//i.test(target)) return true;
  const clean = safeDecodeURIComponent(target.split('#')[0].split('?')[0]).replace(/^\/+/, '');
  if (!clean) return fs.existsSync(path.join(ROOT, 'index.html'));
  const candidates = [
    path.join(ROOT, clean),
    path.join(ROOT, clean, 'index.html'),
    path.join(ROOT, `${clean}.html`),
  ];
  return candidates.some((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
}

function substituteRedirectTarget(target, names, match) {
  let out = target;
  names.forEach((name, index) => {
    const value = match[index + 1] || '';
    out = out.replace(new RegExp(`:${escapeRegExp(name)}\\b`, 'g'), value);
    if (name === 'splat') out = out.replace(/\*/g, value);
  });
  return out;
}

function normalizeRoute(value) {
  let route = safeDecodeURIComponent(String(value || '').split('?')[0].split('#')[0]);
  if (!route.startsWith('/')) route = `/${route}`;
  route = route.replace(/\/index\.html$/i, '/').replace(/\.html$/i, '');
  if (route.length > 1) route = route.replace(/\/+$/g, '');
  return route || '/';
}

function safeDecodeURIComponent(value) {
  try { return decodeURIComponent(value); } catch (_) { return value; }
}
