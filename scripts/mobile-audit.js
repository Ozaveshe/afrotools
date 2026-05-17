#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const REPORT_DIR = path.join(ROOT, 'reports');

const EXCLUDED_DIRS = new Set([
  'node_modules',
  '.git',
  '.claude',
  '.agents',
  '.github',
  '.playwright',
  'test-results',
  'tests',
  'scripts',
  'docs',
  'reports',
  'dist',
]);

const EXCLUDED_HTML_PATTERNS = [
  /(^|\/)\.[^/]+/i,
  /(^|\/)__[^/]+/i,
  /(^|\/)lang\/pages\/.+\/[a-z-]+\.body\.html$/i,
  /\.body\.html$/i,
];

const INTERNAL_PAGES = new Set([
  'admin/dashboard.html',
  'afrotools-mission-control.html',
  'mc-7a2f9x.html',
]);

const FOUNDATION_CSS_PATTERNS = [
  /assets\/css\/design-system(?:\.min)?\.css$/i,
  /assets\/css\/calculator(?:\.min)?\.css$/i,
  /assets\/css\/tool-layout(?:\.min)?\.css$/i,
  /assets\/css\/tokens(?:\.min)?\.css$/i,
  /assets\/css\/global(?:\.min)?\.css$/i,
];

const FOUNDATION_JS_PATTERNS = [
  /assets\/js\/components\/navbar(?:\.min)?\.js$/i,
];

const ISSUE_DEFS = {
  missing_viewport_meta: { label: 'Missing viewport meta', shortLabel: 'Viewport', baseScore: 38 },
  sub16_form_controls: { label: 'Form controls likely below 16px', shortLabel: 'Sub-16 controls', baseScore: 18 },
  tap_targets_below_44: { label: 'Tap targets likely below 44px', shortLabel: 'Tap targets', baseScore: 18 },
  late_multicolumn_collapse: { label: 'Multi-column layout stays multi-column too long', shortLabel: 'Late collapse', baseScore: 20 },
  fixed_sidebar_320plus: { label: 'Fixed-width sidebar around 320px+ compresses content', shortLabel: 'Fixed sidebar', baseScore: 22 },
  overlay_100vh_without_dvh: { label: 'Overlay or drawer uses 100vh without 100dvh/safe-area handling', shortLabel: '100vh overlay', baseScore: 22 },
  horizontal_overflow_risk: { label: 'Horizontal overflow risk from 100vw or hard widths', shortLabel: 'Overflow risk', baseScore: 18 },
  missing_shared_foundation_css: { label: 'Page is not using the shared CSS foundation', shortLabel: 'Missing CSS foundation', baseScore: 14 },
  missing_shared_navbar: { label: 'Full page is not using the shared navbar foundation', shortLabel: 'Missing navbar', baseScore: 14 },
  custom_mobile_nav_search: { label: 'Custom mobile nav/search pattern looks inconsistent', shortLabel: 'Custom nav/search', baseScore: 16 },
  fixed_header_without_scroll_padding: { label: 'Sticky/fixed header without scroll-padding compensation', shortLabel: 'Fixed header', baseScore: 16 },
};

const NATIVE_CONTROL_SELECTOR_RE = /(^|[\s>+~,(])(input|select|textarea|button|summary)\b|\[role=["']?button["']?\]/i;
const FORMULA_DISPLAY_SELECTOR_RE = /(\.|\#)formula(?:[-_]|$)/i;
const CONTROL_SELECTOR_RE = /(^|[\s>+~,(])(input|select|textarea|button|summary)\b|\[role=["']?button["']?\]|(\.|\#)(input|select|field|form|search|textarea|btn|button|tab|toggle|chip|pill|nav-item|nav-link|menu-toggle|topbar-search|fab|action)/i;
const INTERACTIVE_SELECTOR_RE = /(^|[\s>+~,(])(button|summary|a)\b|(\.|\#)(btn|button|tab|toggle|chip|pill|nav-item|nav-link|menu-toggle|fab|action|cta|search-result)/i;
const OVERLAY_SELECTOR_RE = /(\.|\#)?(modal|drawer|overlay|sheet|dialog|menu|search-panel|search-drawer|nav-drawer|popover)/i;
const HEADER_SELECTOR_RE = /(^|[\s>+~,(])(header|nav)\b|(\.|\#)(topbar|header|toolbar|sticky-header|site-header|hero-nav|nav-bar)/i;

const assetCache = new Map();
const cssAnalysisCache = new Map();

main();

function main() {
  const pages = collectHtmlPages();
  const pageResults = pages.map(analyzePage);
  const summary = buildSummary(pageResults);
  const clusters = buildClusters(pageResults);
  const sharedFixLevers = buildSharedFixLevers(clusters);
  const recommendedNextFixOrder = buildRecommendedOrder(clusters);

  const report = {
    generatedAt: new Date().toISOString(),
    root: ROOT,
    scope: {
      htmlPagesAudited: pageResults.length,
      excludedDirs: Array.from(EXCLUDED_DIRS),
      excludedHtmlPatterns: EXCLUDED_HTML_PATTERNS.map((pattern) => pattern.toString()),
    },
    issueDefinitions: ISSUE_DEFS,
    summary,
    topIssueClusters: clusters.slice(0, 20),
    worstPages: [...pageResults].sort(comparePagesByScore).slice(0, 30),
    sharedFixLevers,
    recommendedNextFixOrder,
    assumptions: buildAssumptions(),
    pages: pageResults,
    clusters,
  };

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(path.join(REPORT_DIR, 'mobile-audit.json'), JSON.stringify(report, null, 2) + '\n', 'utf8');
  fs.writeFileSync(path.join(REPORT_DIR, 'mobile-audit.md'), renderMarkdown(report), 'utf8');

  console.log(`Mobile audit complete for ${pageResults.length} HTML pages`);
  console.log(`  Issue-bearing pages: ${summary.pagesWithIssues}`);
  console.log(`  Top cluster: ${report.topIssueClusters[0] ? report.topIssueClusters[0].label : 'none'}`);
  console.log('  Output JSON: reports/mobile-audit.json');
  console.log('  Output Markdown: reports/mobile-audit.md');
}

function collectHtmlPages() {
  const pages = [];
  walk(ROOT, (absPath, relPath) => {
    if (!/\.html$/i.test(relPath)) return;
    if (shouldExcludeHtml(relPath)) return;
    const page = classifyPage(relPath);
    if (page.isInternal) return;
    pages.push(page);
  });
  return pages.sort((a, b) => a.relPath.localeCompare(b.relPath));
}

function walk(dir, onFile) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name !== '.well-known' && entry.name.startsWith('.')) continue;
    if (entry.name.startsWith('__')) continue;
    if (EXCLUDED_DIRS.has(entry.name)) continue;
    const absPath = path.join(dir, entry.name);
    const relPath = toPosix(path.relative(ROOT, absPath));
    if (entry.isDirectory()) {
      walk(absPath, onFile);
      continue;
    }
    if (!entry.isFile()) continue;
    onFile(absPath, relPath);
  }
}

function shouldExcludeHtml(relPath) {
  return EXCLUDED_HTML_PATTERNS.some((pattern) => pattern.test(relPath));
}

function classifyPage(relPath) {
  const parts = relPath.split('/');
  const fileName = parts[parts.length - 1];
  const isWidget = relPath.startsWith('widgets/iframe/');
  const isTool = relPath.startsWith('tools/');
  const isEmailTemplate = relPath.startsWith('supabase/email-templates/');
  const isInternal = INTERNAL_PAGES.has(relPath) || relPath.startsWith('admin/');
  const isOfflineFallback = /(^|\/)offline\.html$/i.test(relPath);
  const isAppLike = (isTool && parts.length > 2 && fileName !== 'index.html') || /(^|\/)app\.html$/i.test(relPath);
  const language = parts[0] === 'fr' ? 'fr' : parts[0] === 'sw' ? 'sw' : 'en';
  const route = toRoute(relPath);
  const family = getFamily(relPath, { isWidget, isAppLike });

  return {
    relPath,
    absPath: path.join(ROOT, relPath),
    route,
    fileName,
    language,
    isWidget,
    isInternal,
    isAppLike,
    isEmailTemplate,
    isOfflineFallback,
    family,
    familyLabel: humanizeFamily(family),
    expectsSharedNavbar: !isWidget && !isAppLike && !isEmailTemplate && !isOfflineFallback,
    expectsSharedFoundationCss: !isWidget && !isAppLike && !isEmailTemplate,
  };
}

function getFamily(relPath, context) {
  const parts = relPath.split('/');
  const fileName = parts[parts.length - 1];

  if (context.isWidget) {
    const widgetName = fileName.replace(/\.html$/i, '');
    const bits = widgetName.split('-');
    const prefix = bits[0] === 'data' && bits[1] ? `${bits[0]}-${bits[1]}` : bits[0];
    return `widgets/iframe/${prefix}-*`;
  }

  if (parts[0] === 'fr') {
    if (/\/[a-z]{2}-paye\.html$/i.test(relPath) || /calculateur-salaire-net\.html$/i.test(relPath)) return 'fr/country-paye';
    return `fr/${parts[1] || '(root)'}`;
  }

  if (parts[0] === 'sw') {
    if (/kikokotoo-kodi-mshahara\/index\.html$/i.test(relPath)) return 'sw/country-paye';
    return `sw/${parts[1] || '(root)'}`;
  }

  if (/\/[a-z]{2}-paye\.html$/i.test(relPath) || /ng-salary-tax\.html$/i.test(relPath)) return 'country-paye';

  if (relPath.startsWith('tools/')) {
    const toolSlug = parts[1];
    if (toolSlug && toolSlug.startsWith('creator-')) return 'tools/creator-*';
    return `tools/${toolSlug || '(unknown)'}`;
  }

  if (parts.length === 1) return '(root)';
  return parts[0];
}

function humanizeFamily(family) {
  return family
    .replace(/^\(root\)$/, 'Root pages')
    .replace(/^country-paye$/, 'Country PAYE pages')
    .replace(/^fr\/country-paye$/, 'French country PAYE pages')
    .replace(/^sw\/country-paye$/, 'Swahili country PAYE pages')
    .replace(/^tools\/creator-\*$/, 'Creator app shells')
    .replace(/^widgets\/iframe\//, 'Widget iframes: ')
    .replace(/\*$/, 'family')
    .replace(/\//g, ' / ')
    .replace(/-/g, ' ');
}

function toRoute(relPath) {
  const route = `/${toPosix(relPath)}`;
  if (route === '/index.html') return '/';
  if (route.endsWith('/index.html')) return route.slice(0, -10) || '/';
  return route;
}

function analyzePage(page) {
  const html = readText(page.absPath);
  const isRedirectStub = detectRedirectStub(html);
  const title = getTitle(html);
  const linkedAssets = extractLinkedAssets(html, page.absPath);
  const inlineStyleEntries = extractInlineStyles(html, page.relPath);
  const inlineScriptEntries = extractInlineScripts(html, page.relPath);

  const cssEntries = [
    ...linkedAssets.css.map(loadAsset),
    ...inlineStyleEntries.map((entry) => analyzeCssAsset(entry.path, entry.text)),
  ];
  const jsEntries = [
    ...linkedAssets.js.map(loadAsset),
    ...inlineScriptEntries.map((entry) => ({ path: entry.path, text: entry.text, sourcePath: entry.path })),
  ];

  const cssText = cssEntries.map((entry) => entry.text).join('\n');
  const jsText = jsEntries.map((entry) => entry.text).join('\n');
  const cssRules = cssEntries.flatMap((entry) => entry.rules || []);
  const relevantCssRules = cssRules.filter((rule) => ruleAppliesToPage(rule, html, page.language));
  const linkedCssPaths = cssEntries.map((entry) => entry.sourcePath);
  const linkedJsPaths = jsEntries.map((entry) => entry.sourcePath);

  const usesSharedFoundationCss = hasSharedFoundationCss(linkedCssPaths, cssText);
  const usesSharedNavbar = hasSharedNavbar(html, linkedJsPaths);
  const issues = [];

  addIssueIfNeeded(issues, detectMissingViewport(page, html));
  addIssueIfNeeded(issues, detectFoundationCssIssue(page, usesSharedFoundationCss, isRedirectStub));
  addIssueIfNeeded(issues, detectSharedNavbarIssue(page, usesSharedNavbar, isRedirectStub));
  addIssueIfNeeded(issues, detectSub16Controls(page, relevantCssRules, html));
  addIssueIfNeeded(issues, detectTapTargets(page, relevantCssRules, html));
  addIssueIfNeeded(issues, detectLateMulticolumn(page, relevantCssRules));
  addIssueIfNeeded(issues, detectFixedSidebar(page, relevantCssRules));
  addIssueIfNeeded(issues, detectOverlayVhIssue(page, relevantCssRules, cssText, jsText));
  addIssueIfNeeded(issues, detectOverflowRisks(page, relevantCssRules, html));
  addIssueIfNeeded(issues, detectCustomNavSearch(page, html, cssText, jsText, usesSharedNavbar));
  addIssueIfNeeded(issues, detectFixedHeaderWithoutCompensation(page, cssRules, cssText, usesSharedFoundationCss));

  return {
    route: page.route,
    relPath: page.relPath,
    title,
    family: page.family,
    familyLabel: page.familyLabel,
    language: page.language,
    score: issues.reduce((sum, issue) => sum + issue.score, 0),
    usesSharedFoundationCss,
    usesSharedNavbar,
    linkedAssets: {
      css: linkedCssPaths,
      js: linkedJsPaths,
    },
    issues,
    fixCandidates: [...new Set(issues.flatMap((issue) => issue.fixCandidates))],
  };
}

function readText(absPath) {
  return fs.readFileSync(absPath, 'utf8');
}

function getTitle(html) {
  const match = html.match(/<title>([\s\S]*?)<\/title>/i);
  return match ? decodeHtml(match[1].trim()) : '';
}

function detectRedirectStub(html) {
  return /<meta\b[^>]*http-equiv=["']refresh["']/i.test(html)
    || /window\.location(?:\.replace|\.href)\s*\(/i.test(html)
    || /window\.location\s*=\s*["']/i.test(html)
    || /redirecting to/i.test(html);
}

function extractLinkedAssets(html, pageAbsPath) {
  const css = [];
  const js = [];
  const seen = new Set();

  for (const match of html.matchAll(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/gi)) {
    const resolved = resolveLocalAsset(pageAbsPath, match[1]);
    if (!resolved || !/\.css$/i.test(resolved)) continue;
    if (seen.has(`css:${resolved}`)) continue;
    seen.add(`css:${resolved}`);
    css.push(resolved);
  }

  for (const match of html.matchAll(/<script\b[^>]*src=["']([^"']+)["'][^>]*>/gi)) {
    const resolved = resolveLocalAsset(pageAbsPath, match[1]);
    if (!resolved || !/\.js$/i.test(resolved)) continue;
    if (seen.has(`js:${resolved}`)) continue;
    seen.add(`js:${resolved}`);
    js.push(resolved);
  }

  return { css, js };
}

function extractInlineStyles(html, relPath) {
  const styles = [];
  let index = 0;
  for (const match of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
    index += 1;
    styles.push({ path: `${relPath}#inline-style-${index}`, text: match[1] });
  }
  return styles;
}

function extractInlineScripts(html, relPath) {
  const scripts = [];
  let index = 0;
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = match[1] || '';
    const typeMatch = attrs.match(/\btype=["']([^"']+)["']/i);
    const scriptType = typeMatch ? typeMatch[1].toLowerCase() : 'text/javascript';
    if (scriptType && !['text/javascript', 'application/javascript', 'module'].includes(scriptType)) continue;
    if (/\bsrc=/.test(attrs)) continue;
    index += 1;
    scripts.push({ path: `${relPath}#inline-script-${index}`, text: match[2] });
  }
  return scripts;
}

function resolveLocalAsset(pageAbsPath, rawUrl) {
  if (!rawUrl) return null;
  const clean = rawUrl.split('#')[0].split('?')[0].trim();
  if (!clean) return null;
  if (/^(https?:)?\/\//i.test(clean)) return null;
  if (/^(data|mailto|javascript):/i.test(clean)) return null;

  const absPath = clean.startsWith('/')
    ? path.join(ROOT, clean.replace(/^\/+/, ''))
    : path.resolve(path.dirname(pageAbsPath), clean);

  if (!absPath.startsWith(ROOT)) return null;
  if (!fs.existsSync(absPath) || !fs.statSync(absPath).isFile()) return null;
  return toPosix(path.relative(ROOT, absPath));
}

function loadAsset(relPath) {
  if (assetCache.has(relPath)) return assetCache.get(relPath);
  const absPath = path.join(ROOT, relPath);
  const text = readText(absPath);
  const entry = relPath.endsWith('.css')
    ? analyzeCssAsset(relPath, text)
    : { path: relPath, text, sourcePath: relPath };
  assetCache.set(relPath, entry);
  return entry;
}

function analyzeCssAsset(relPath, text) {
  if (cssAnalysisCache.has(relPath)) return cssAnalysisCache.get(relPath);
  const entry = { path: relPath, text, rules: parseCssRules(text, relPath), sourcePath: relPath };
  cssAnalysisCache.set(relPath, entry);
  return entry;
}

function parseCssRules(css, sourcePath) {
  const rules = [];
  const normalized = stripCssComments(css);
  parseCssBlock(normalized, [], sourcePath, rules);
  return rules;
}

function parseCssBlock(css, contexts, sourcePath, rules) {
  let index = 0;
  while (index < css.length) {
    const nextBrace = css.indexOf('{', index);
    if (nextBrace === -1) break;
    const selectorText = css.slice(index, nextBrace).trim();
    const endBrace = findMatchingBrace(css, nextBrace);
    if (endBrace === -1) break;
    const body = css.slice(nextBrace + 1, endBrace);

    if (selectorText.startsWith('@media')) {
      parseCssBlock(body, contexts.concat(selectorText), sourcePath, rules);
    } else if (selectorText.startsWith('@supports')) {
      parseCssBlock(body, contexts.concat(selectorText), sourcePath, rules);
    } else if (!selectorText.startsWith('@') && !/^(from|to|\d+%)/i.test(selectorText)) {
      rules.push({
        sourcePath,
        selectorsText: selectorText,
        selectorsLower: selectorText.toLowerCase(),
        declarations: parseDeclarations(body),
        rawBlock: body,
        rawBlockLower: body.toLowerCase(),
        media: parseMediaContext(contexts),
        tokens: extractSelectorTokens(selectorText),
      });
    }
    index = endBrace + 1;
  }
}

function stripCssComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function findMatchingBrace(text, openIndex) {
  let depth = 0;
  for (let index = openIndex; index < text.length; index += 1) {
    if (text[index] === '{') depth += 1;
    if (text[index] === '}') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function parseDeclarations(block) {
  const declarations = {};
  for (const part of block.split(';')) {
    const colonIndex = part.indexOf(':');
    if (colonIndex === -1) continue;
    const property = part.slice(0, colonIndex).trim().toLowerCase();
    const value = part.slice(colonIndex + 1).trim();
    if (!property || !value) continue;
    declarations[property] = value;
  }
  return declarations;
}

function parseMediaContext(contexts) {
  let minWidth = 0;
  let maxWidth = Number.POSITIVE_INFINITY;
  for (const context of contexts) {
    for (const match of context.matchAll(/\(\s*(min|max)-width\s*:\s*([0-9.]+)\s*(px|rem|em)\s*\)/gi)) {
      const valuePx = toPx(Number(match[2]), match[3]);
      if (match[1].toLowerCase() === 'min') minWidth = Math.max(minWidth, valuePx);
      if (match[1].toLowerCase() === 'max') maxWidth = Math.min(maxWidth, valuePx);
    }
  }
  return { minWidth, maxWidth };
}

function extractSelectorTokens(selectorText) {
  const tokens = new Set();
  for (const match of selectorText.matchAll(/\.([a-z0-9_-]+)/gi)) tokens.add(`.${match[1].toLowerCase()}`);
  for (const match of selectorText.matchAll(/#([a-z0-9_-]+)/gi)) tokens.add(`#${match[1].toLowerCase()}`);
  for (const nativeTag of ['input', 'select', 'textarea', 'button', 'summary', 'header', 'nav']) {
    if (new RegExp(`(^|[^a-z-])${nativeTag}([^a-z-]|$)`, 'i').test(selectorText)) tokens.add(nativeTag);
  }
  if (/\[role=['"]?button['"]?\]/i.test(selectorText)) tokens.add('role-button');
  return [...tokens];
}

function ruleAppliesToPage(rule, html, language) {
  const selector = rule.selectorsLower;
  if (/\[lang=['"]fr['"]\]/i.test(selector) && language !== 'fr') return false;
  if (/\[lang=['"]sw['"]\]/i.test(selector) && language !== 'sw') return false;
  if (/\[lang=['"]en['"]\]/i.test(selector) && language !== 'en') return false;
  if (!rule.tokens.length) return true;

  return rule.tokens.some((token) => pageHasToken(html, token));
}

function hasSharedFoundationCss(linkedCssPaths, cssText) {
  if (linkedCssPaths.some((assetPath) => FOUNDATION_CSS_PATTERNS.some((pattern) => pattern.test(assetPath)))) return true;
  return /--nav-height/i.test(cssText) && /-webkit-text-size-adjust\s*:\s*100%/i.test(cssText) && /(scroll-padding-top|safe-area-inset|100dvh)/i.test(cssText);
}

function hasSharedNavbar(html, linkedJsPaths) {
  if (/<afro-navbar\b/i.test(html)) return true;
  return linkedJsPaths.some((assetPath) => FOUNDATION_JS_PATTERNS.some((pattern) => pattern.test(assetPath)));
}

function detectMissingViewport(page, html) {
  if (/<meta\b[^>]*name=["']viewport["']/i.test(html)) return null;
  return makeIssue(page, 'missing_viewport_meta', {
    evidence: [{ source: page.relPath, detail: 'No viewport meta tag found in the document head.' }],
    fixCandidates: [page.relPath],
  });
}

function detectFoundationCssIssue(page, usesSharedFoundationCss, isRedirectStub) {
  if (!page.expectsSharedFoundationCss || usesSharedFoundationCss || isRedirectStub) return null;
  return makeIssue(page, 'missing_shared_foundation_css', {
    evidence: [{ source: page.relPath, detail: 'Page does not link the shared CSS foundation or an equivalent bundled foundation.' }],
    fixCandidates: ['assets/css/design-system.css adoption', page.family],
  });
}

function detectSharedNavbarIssue(page, usesSharedNavbar, isRedirectStub) {
  if (!page.expectsSharedNavbar || usesSharedNavbar || isRedirectStub) return null;
  return makeIssue(page, 'missing_shared_navbar', {
    evidence: [{ source: page.relPath, detail: 'Full page does not use <afro-navbar> or the shared navbar component script.' }],
    fixCandidates: ['assets/js/components/navbar.js adoption', page.family],
  });
}

function detectSub16Controls(page, rules, html) {
  const safeTokens = new Set();
  for (const rule of rules) {
    if (!isMobileRelevantRule(rule) || !isControlRule(rule, html)) continue;
    const fontSizePx = getFontSizePx(rule.declarations['font-size']);
    if (fontSizePx >= 16) rule.tokens.forEach((token) => safeTokens.add(token));
  }

  const findings = [];
  for (const rule of rules) {
    if (!isMobileRelevantRule(rule) || !isControlRule(rule, html)) continue;
    const fontSizePx = getFontSizePx(rule.declarations['font-size']);
    if (!fontSizePx || fontSizePx >= 16) continue;
    if (rule.tokens.some((token) => safeTokens.has(token))) continue;
    findings.push({ source: suggestSourcePath(rule.sourcePath), detail: `${trimSelector(rule.selectorsText)} sets control text to ${round(fontSizePx)}px.` });
  }

  if (!findings.length) return null;
  return makeIssue(page, 'sub16_form_controls', {
    evidence: findings.slice(0, 6),
    extraScore: Math.min(10, findings.length * 2),
    fixCandidates: collectFixCandidates(findings, ['shared mobile form sizing pattern']),
  });
}

function detectTapTargets(page, rules, html) {
  const safeTokens = new Set();
  for (const rule of rules) {
    if (!isMobileRelevantRule(rule) || !isInteractiveRule(rule, html)) continue;
    const estimatedSize = estimateTapTargetPx(rule.declarations);
    if (estimatedSize >= 44) rule.tokens.forEach((token) => safeTokens.add(token));
  }

  const findings = [];
  for (const rule of rules) {
    if (!isMobileRelevantRule(rule) || !isInteractiveRule(rule, html)) continue;
    const estimatedSize = estimateTapTargetPx(rule.declarations);
    if (!estimatedSize || estimatedSize >= 44) continue;
    if (rule.tokens.some((token) => safeTokens.has(token))) continue;
    findings.push({ source: suggestSourcePath(rule.sourcePath), detail: `${trimSelector(rule.selectorsText)} is likely about ${round(estimatedSize)}px tall.` });
  }

  if (!findings.length) return null;
  return makeIssue(page, 'tap_targets_below_44', {
    evidence: findings.slice(0, 6),
    extraScore: Math.min(10, findings.length * 2),
    fixCandidates: collectFixCandidates(findings, ['shared 44px tap target pattern']),
  });
}

function detectLateMulticolumn(page, rules) {
  const findings = [];
  for (const rule of rules) {
    if (!isMobileRelevantRule(rule)) continue;
    const descriptor = parseGridColumns(rule.declarations['grid-template-columns']);
    if (!descriptor || descriptor.columnCount < 2) continue;
    const collapseAt = findCollapseBreakpoint(rules, rule);
    const threshold = descriptor.hasFixedSidebar ? 900 : 768;
    if (collapseAt >= threshold) continue;
    findings.push({ source: suggestSourcePath(rule.sourcePath), detail: `${trimSelector(rule.selectorsText)} keeps ${descriptor.columnCount} columns until ${collapseAt ? `${collapseAt}px` : 'no collapse rule'}.` });
  }

  if (!findings.length) return null;
  return makeIssue(page, 'late_multicolumn_collapse', {
    evidence: findings.slice(0, 6),
    extraScore: Math.min(12, findings.length * 2),
    fixCandidates: collectFixCandidates(findings, ['shared early-collapse layout pattern']),
  });
}

function detectFixedSidebar(page, rules) {
  const findings = [];
  for (const rule of rules) {
    if (!isMobileRelevantRule(rule)) continue;
    const descriptor = parseGridColumns(rule.declarations['grid-template-columns']);
    if (!descriptor || !descriptor.hasFixedSidebar) continue;
    const collapseAt = findCollapseBreakpoint(rules, rule);
    if (isCountryVatPage(page) && /tool-main-inner/i.test(rule.selectorsLower) && collapseAt >= 900) continue;
    if (collapseAt >= 960) continue;
    findings.push({ source: suggestSourcePath(rule.sourcePath), detail: `${trimSelector(rule.selectorsText)} reserves a ${descriptor.sidebarWidth}px sidebar until ${collapseAt ? `${collapseAt}px` : 'no collapse rule'}.` });
  }

  if (!findings.length) return null;
  return makeIssue(page, 'fixed_sidebar_320plus', {
    evidence: findings.slice(0, 6),
    extraScore: Math.min(10, findings.length * 2),
    fixCandidates: collectFixCandidates(findings, ['shared sidebar collapse pattern']),
  });
}

function detectOverlayVhIssue(page, rules, cssText, jsText) {
  const safeOverlayTokens = new Set();
  for (const rule of rules) {
    if (!isMobileRelevantRule(rule)) continue;
    if (!isOverlayRule(rule)) continue;
    const combinedValues = [rule.declarations.height, rule.declarations['min-height'], rule.declarations['max-height']].filter(Boolean).join(' ');
    if (/100dvh/i.test(combinedValues) || /safe-area-inset/i.test(rule.rawBlockLower)) rule.tokens.forEach((token) => safeOverlayTokens.add(token));
  }

  const findings = [];
  for (const rule of rules) {
    if (!isMobileRelevantRule(rule)) continue;
    if (!isOverlayRule(rule)) continue;
    const combinedValues = [rule.declarations.height, rule.declarations['min-height'], rule.declarations['max-height']].filter(Boolean).join(' ');
    if (!/100vh/i.test(combinedValues)) continue;
    if (rule.tokens.some((token) => safeOverlayTokens.has(token))) continue;
    findings.push({ source: suggestSourcePath(rule.sourcePath), detail: `${trimSelector(rule.selectorsText)} uses 100vh without an obvious 100dvh or safe-area companion rule.` });
  }

  if (/100vh/i.test(jsText) && /(modal|drawer|overlay|menu|dialog|sheet)/i.test(jsText) && !/100dvh|safe-area-inset/i.test(`${cssText}\n${jsText}`)) {
    findings.push({ source: page.relPath, detail: 'Inline or linked JS references 100vh for overlay-like UI without a 100dvh/safe-area fallback.' });
  }

  if (!findings.length) return null;
  return makeIssue(page, 'overlay_100vh_without_dvh', {
    evidence: findings.slice(0, 6),
    extraScore: Math.min(10, findings.length * 2),
    fixCandidates: collectFixCandidates(findings, ['shared dvh/safe-area overlay pattern']),
  });
}

function detectOverflowRisks(page, rules, html) {
  const safeTokens = new Set();
  const overflowWrapperTokens = new Set();
  for (const rule of rules) {
    if (!isMobileRelevantRule(rule)) continue;
    const width = (rule.declarations.width || '').toLowerCase();
    const minWidth = (rule.declarations['min-width'] || '').toLowerCase();
    const overflowValues = `${rule.declarations.overflow || ''} ${rule.declarations['overflow-x'] || ''}`.toLowerCase();
    const fixedWidth = getFixedWidthPx(width);
    const fixedMinWidth = getFixedWidthPx(minWidth);
    if (/(auto|scroll)/.test(overflowValues)) rule.tokens.forEach((token) => overflowWrapperTokens.add(token));
    if (
      /100%|calc\(100%|min\(100%/i.test(width) ||
      hasMaxWidthGuard(rule.declarations) ||
      (minWidth && fixedMinWidth !== null && fixedMinWidth < 360) ||
      (width && fixedWidth !== null && fixedWidth < 480)
    ) {
      rule.tokens.forEach((token) => safeTokens.add(token));
    }
  }

  const findings = [];
  for (const rule of rules) {
    if (/::(before|after)/i.test(rule.selectorsText)) continue;
    if (rule.tokens.some((token) => safeTokens.has(token))) continue;
    if (hasOverflowWrapperProtection(rule, overflowWrapperTokens)) continue;
    const width = rule.declarations.width || '';
    const minWidth = rule.declarations['min-width'] || '';
    if (/100vw/i.test(width) || /100vw/i.test(minWidth)) {
      findings.push({ source: suggestSourcePath(rule.sourcePath), detail: `${trimSelector(rule.selectorsText)} uses 100vw, which often causes mobile overflow with padding or scrollbars.` });
      continue;
    }
    const fixedWidth = getFixedWidthPx(width) || 0;
    const fixedMinWidth = getFixedWidthPx(minWidth) || 0;
    if (fixedMinWidth >= 360) {
      findings.push({ source: suggestSourcePath(rule.sourcePath), detail: `${trimSelector(rule.selectorsText)} sets min-width to ${fixedMinWidth}px.` });
      continue;
    }
    if (fixedWidth >= 480 && !hasMaxWidthGuard(rule.declarations)) {
      findings.push({ source: suggestSourcePath(rule.sourcePath), detail: `${trimSelector(rule.selectorsText)} hard-codes ${fixedWidth}px without an obvious max-width guard.` });
    }
  }

  for (const match of html.matchAll(/style=["']([^"']+)["']/gi)) {
    const styleText = match[1];
    if (/100vw/i.test(styleText)) {
      findings.push({ source: page.relPath, detail: `Inline style contains 100vw: ${truncate(styleText.trim(), 90)}.` });
      continue;
    }
    const minWidthMatch = styleText.match(/(?:^|;)\s*min-width\s*:\s*([0-9.]+)\s*px/i);
    if (minWidthMatch && Number(minWidthMatch[1]) >= 360) {
      findings.push({ source: page.relPath, detail: `Inline style sets min-width to ${Number(minWidthMatch[1])}px.` });
      continue;
    }
    const widthMatch = styleText.match(/(?:^|;)\s*width\s*:\s*([0-9.]+)\s*px/i);
    if (widthMatch && Number(widthMatch[1]) >= 480) {
      findings.push({ source: page.relPath, detail: `Inline style sets width to ${Number(widthMatch[1])}px.` });
    }
  }

  if (!findings.length) return null;
  return makeIssue(page, 'horizontal_overflow_risk', {
    evidence: dedupeEvidence(findings).slice(0, 6),
    extraScore: Math.min(10, findings.length * 2),
    fixCandidates: collectFixCandidates(findings, ['shared overflow guard pattern']),
  });
}

function detectCustomNavSearch(page, html, cssText, jsText, usesSharedNavbar) {
  if (usesSharedNavbar) return null;
  if (hasCreatorShellMobileCoverage(page, cssText)) return null;
  const signalPatterns = page.isWidget ? [
    /\btopbar\b/gi,
    /\bbottom-nav\b/gi,
    /\bmobile-menu\b/gi,
    /\bmenu-toggle\b/gi,
    /\bdrawer\b/gi,
    /\bnav-item\b/gi,
    /\bnav-link\b/gi,
    /\bsearch-panel\b/gi,
    /\bsearch-bar\b/gi,
  ] : [
    /\btopbar\b/gi,
    /\bbottom-nav\b/gi,
    /\bmobile-menu\b/gi,
    /\bmenu-toggle\b/gi,
    /\bdrawer\b/gi,
    /\bnav-item\b/gi,
    /\bnav-link\b/gi,
    /\bsearch-input\b/gi,
    /\bsearch-panel\b/gi,
    /\bsearch-bar\b/gi,
    /\bfilter-bar\b/gi,
  ];
  const navSignals = collectSignalMatches(`${html}\n${cssText}\n${jsText}`, signalPatterns);
  if (navSignals.length < 2) return null;
  return makeIssue(page, 'custom_mobile_nav_search', {
    evidence: [{ source: page.relPath, detail: `Page uses custom mobile chrome tokens: ${navSignals.slice(0, 5).join(', ')}.` }],
    extraScore: page.isAppLike ? 4 : 8,
    fixCandidates: [page.family, page.isAppLike ? 'shared app shell mobile pattern' : 'assets/js/components/navbar.js adoption'],
  });
}

function detectFixedHeaderWithoutCompensation(page, rules, cssText, usesSharedFoundationCss) {
  if (usesSharedFoundationCss || /(scroll-padding-top|scroll-margin-top)/i.test(cssText)) return null;
  const findings = [];
  for (const rule of rules) {
    if (!HEADER_SELECTOR_RE.test(rule.selectorsLower)) continue;
    const position = (rule.declarations.position || '').toLowerCase();
    if (position !== 'fixed' && position !== 'sticky') continue;
    const top = rule.declarations.top || rule.declarations.inset || rule.declarations['inset-block-start'] || '';
    if (!top && !/top\s*:|inset\s*:/i.test(rule.rawBlock)) continue;
    findings.push({ source: suggestSourcePath(rule.sourcePath), detail: `${trimSelector(rule.selectorsText)} is ${position} without scroll-padding compensation on the page root.` });
  }

  if (!findings.length) return null;
  return makeIssue(page, 'fixed_header_without_scroll_padding', {
    evidence: findings.slice(0, 4),
    extraScore: Math.min(8, findings.length * 2),
    fixCandidates: collectFixCandidates(findings, ['shared scroll-padding compensation pattern']),
  });
}

function makeIssue(page, issueId, data) {
  const definition = ISSUE_DEFS[issueId];
  return {
    id: issueId,
    label: definition.label,
    shortLabel: definition.shortLabel,
    score: definition.baseScore + (data.extraScore || 0),
    family: page.family,
    clusterKey: `${page.family}::${issueId}`,
    evidence: data.evidence || [],
    fixCandidates: [...new Set((data.fixCandidates || []).filter(Boolean))],
  };
}

function addIssueIfNeeded(collection, issue) {
  if (issue) collection.push(issue);
}

function isMobileRelevantRule(rule) {
  return rule.media.minWidth < 640;
}

function isControlRule(rule, html) {
  if (FORMULA_DISPLAY_SELECTOR_RE.test(rule.selectorsLower) && !NATIVE_CONTROL_SELECTOR_RE.test(rule.selectorsLower)) return false;
  if (isStaticTableRule(rule)) return false;
  if (isLabelOnlyRule(rule)) return false;
  if (isStaticBadgeRule(rule, html)) return false;
  return CONTROL_SELECTOR_RE.test(rule.selectorsLower);
}

function isInteractiveRule(rule, html) {
  if (isStaticTableRule(rule)) return false;
  if (isStaticBadgeRule(rule, html)) return false;
  if (isDecorativeControlSubpartRule(rule)) return false;
  if (/(button|summary|role-button)/i.test(rule.tokens.join(' '))) return true;
  if (/\bcursor\s*:\s*pointer/i.test(rule.rawBlockLower) && INTERACTIVE_SELECTOR_RE.test(rule.selectorsLower)) return true;
  return INTERACTIVE_SELECTOR_RE.test(rule.selectorsLower);
}

function isDecorativeControlSubpartRule(rule) {
  const selector = rule.selectorsLower;
  return /(?:^|[.#\s>+~,(])(?:toggle-knob|toggle-track)(?:\b|::)/i.test(selector)
    || /\.toggle\b[^,{]*\.slider::(?:before|after)/i.test(selector);
}

function isLabelOnlyRule(rule) {
  if (NATIVE_CONTROL_SELECTOR_RE.test(rule.selectorsLower)) return false;
  return /(^|[\s>+~,(])label\b|[.#][a-z0-9_-]*(?:label|help|hint|note|description|caption)\b/i.test(rule.selectorsLower);
}

function isStaticTableRule(rule) {
  if (NATIVE_CONTROL_SELECTOR_RE.test(rule.selectorsLower)) return false;
  return /(^|[\s>+~,(])table\b|\.(?:table|[a-z0-9_-]+-table)\b/i.test(rule.selectorsLower);
}

function isStaticBadgeRule(rule, html) {
  if (NATIVE_CONTROL_SELECTOR_RE.test(rule.selectorsLower)) return false;
  const badgeTokens = rule.tokens.filter((token) => /^\.(?:chip|pill)$/i.test(token));
  if (!badgeTokens.length) return false;
  return !badgeTokens.some((token) => htmlHasInteractiveClassToken(html, token));
}

function htmlHasInteractiveClassToken(html, token) {
  if (!token || !token.startsWith('.')) return false;
  const className = token.slice(1).toLowerCase();
  for (const match of html.matchAll(/<([a-z0-9-]+)\b[^>]*>/gi)) {
    const tagName = match[1].toLowerCase();
    const tagText = match[0];
    const isInteractive = /^(a|button|summary|input|select|textarea)$/.test(tagName) || /\brole=["']button["']/i.test(tagText);
    if (isInteractive && tagHasClassToken(tagText, className)) return true;
  }
  return false;
}

function isOverlayRule(rule) {
  return OVERLAY_SELECTOR_RE.test(rule.selectorsLower);
}

function getFontSizePx(value) {
  if (!value) return null;
  if (/clamp\(/i.test(value)) {
    const matches = [...value.matchAll(/([0-9.]+)\s*(px|rem|em)/gi)];
    if (!matches.length) return null;
    return Math.min(...matches.map((match) => toPx(Number(match[1]), match[2])));
  }
  const match = value.match(/([0-9.]+)\s*(px|rem|em)/i);
  if (!match) return null;
  return toPx(Number(match[1]), match[2]);
}

function estimateTapTargetPx(declarations) {
  const minHeight = getFixedWidthPx(declarations['min-height']);
  const height = getFixedWidthPx(declarations.height);
  if (minHeight) return minHeight;
  if (height) return height;
  const paddingY = getPaddingVerticalPx(declarations);
  if (!paddingY) return null;
  const fontSize = getFontSizePx(declarations['font-size']) || 16;
  return paddingY * 2 + fontSize * getLineHeightMultiplier(declarations['line-height']);
}

function getPaddingVerticalPx(declarations) {
  if (declarations['padding-block']) return getFixedWidthPx(declarations['padding-block'].trim().split(/\s+/)[0]);
  if (declarations['padding-top']) return getFixedWidthPx(declarations['padding-top']);
  if (!declarations.padding) return null;
  const values = declarations.padding.trim().split(/\s+/).map((part) => getFixedWidthPx(part)).filter(Boolean);
  if (!values.length) return null;
  return values[0];
}

function getLineHeightMultiplier(value) {
  if (!value) return 1.2;
  if (/^[0-9.]+$/.test(value.trim())) return Number(value.trim());
  return 1.2;
}

function parseGridColumns(value) {
  if (!value) return null;
  const lower = value.toLowerCase();
  if (lower === 'none') return null;
  let columnCount = 0;
  const repeatMatch = lower.match(/repeat\(\s*(\d+)/);
  if (repeatMatch) {
    columnCount = Number(repeatMatch[1]);
  } else {
    columnCount = splitTopLevel(lower, ' ').filter(Boolean).length;
  }
  if (columnCount < 2) return null;
  const numericWidths = [...lower.matchAll(/([0-9.]+)\s*(px|rem|em)/gi)].map((match) => toPx(Number(match[1]), match[2]));
  const sidebarWidth = numericWidths.find((width) => width >= 320) || null;
  return { columnCount, hasFixedSidebar: !!sidebarWidth, sidebarWidth: sidebarWidth ? round(sidebarWidth) : null };
}

function splitTopLevel(text, delimiter) {
  const parts = [];
  let current = '';
  let depth = 0;
  for (const char of text) {
    if (char === '(') depth += 1;
    if (char === ')') depth = Math.max(0, depth - 1);
    if (depth === 0 && char === delimiter) {
      if (current.trim()) parts.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function findCollapseBreakpoint(rules, sourceRule) {
  const matchingRules = rules.filter((candidate) => {
    if (!candidate.tokens.length || !sourceRule.tokens.length) return candidate.selectorsLower === sourceRule.selectorsLower;
    return candidate.tokens.some((token) => sourceRule.tokens.includes(token));
  });

  let collapseAt = 0;
  for (const rule of matchingRules) {
    if (!Number.isFinite(rule.media.maxWidth)) continue;
    if (isSingleColumnRule(rule)) collapseAt = Math.max(collapseAt, rule.media.maxWidth);
  }
  return collapseAt;
}

function isSingleColumnRule(rule) {
  const columns = (rule.declarations['grid-template-columns'] || '').toLowerCase().replace(/\s*!important\b/g, '').trim();
  const flexDirection = (rule.declarations['flex-direction'] || '').toLowerCase().replace(/\s*!important\b/g, '').trim();
  const display = (rule.declarations.display || '').toLowerCase().replace(/\s*!important\b/g, '').trim();
  if (columns) return columns === '1fr' || /^repeat\(\s*1\b/i.test(columns) || /^minmax\(/i.test(columns);
  if (flexDirection === 'column') return true;
  if (display === 'block') return true;
  return false;
}

function getFixedWidthPx(value) {
  if (!value) return null;
  if (/auto|max-content|min-content|fit-content|100%/i.test(value)) return null;
  const match = value.match(/([0-9.]+)\s*(px|rem|em)/i);
  if (!match) return null;
  return toPx(Number(match[1]), match[2]);
}

function hasMaxWidthGuard(declarations) {
  return /100%|100vw|min\(100%|fit-content/i.test(declarations['max-width'] || '');
}

function hasOverflowWrapperProtection(rule, overflowWrapperTokens) {
  const tokens = rule.tokens.map(normalizeAuditToken).filter(Boolean);
  return tokens.some((token) => {
    if (!/(table|heatmap|canvas)/i.test(token)) return false;
    return [...overflowWrapperTokens].some((wrapperToken) => {
      const wrapper = normalizeAuditToken(wrapperToken);
      return wrapper && wrapper !== token && wrapper.includes(token);
    });
  });
}

function hasCreatorShellMobileCoverage(page, cssText) {
  if (page.family !== 'tools/creator-*') return false;
  const hasBottomNavTapTargets = /(bottom-nav[\s\S]{0,200}min-height\s*:\s*44px|min-height\s*:\s*44px[\s\S]{0,200}bottom-nav)/i.test(cssText);
  const hasMobileShellMarker = /(mobile-shell-overrides|mobile-widget-overrides)/i.test(cssText);
  const hasMobileControlSizing = /(search-input|history-search|filter-search|project-input|bottom-nav a|bottom-nav button)[\s\S]{0,200}font-size\s*:\s*16px|font-size\s*:\s*16px[\s\S]{0,200}(search-input|history-search|filter-search|project-input|bottom-nav a|bottom-nav button)/i.test(cssText);
  return hasBottomNavTapTargets && (hasMobileShellMarker || hasMobileControlSizing);
}

function isCountryVatPage(page) {
  return /(^|\/)(fr\/)?[^\/]+\/[a-z]{2}-vat(\.html|\/index\.html)$/i.test(page.relPath || '');
}

function normalizeAuditToken(token) {
  return String(token || '').replace(/^[.#]/, '').trim();
}

function toPx(value, unit) {
  return unit === 'px' ? value : value * 16;
}

function pageHasToken(html, token) {
  if (!token) return false;
  if (token.startsWith('.')) {
    return htmlHasClassToken(html, token.slice(1));
  }
  if (token.startsWith('#')) {
    const id = escapeRegExp(token.slice(1));
    return new RegExp(`id=["']${id}["']`, 'i').test(html);
  }
  if (token === 'role-button') {
    return /role=["']button["']/i.test(html);
  }
  return new RegExp(`<${token}\\b`, 'i').test(html);
}

function htmlHasClassToken(html, className) {
  const normalizedClassName = className.toLowerCase();
  for (const match of html.matchAll(/\bclass=["']([^"']*)["']/gi)) {
    if (match[1].toLowerCase().split(/\s+/).includes(normalizedClassName)) return true;
  }
  return false;
}

function tagHasClassToken(tagText, className) {
  const match = tagText.match(/\bclass=["']([^"']*)["']/i);
  return Boolean(match && match[1].toLowerCase().split(/\s+/).includes(className));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function collectSignalMatches(text, patterns) {
  const lower = text.toLowerCase();
  const hits = new Set();
  for (const pattern of patterns) {
    const matches = lower.match(pattern);
    if (!matches) continue;
    matches.slice(0, 5).forEach((match) => hits.add(match));
  }
  return [...hits];
}

function comparePagesByScore(a, b) {
  return b.score - a.score || a.relPath.localeCompare(b.relPath);
}

function buildSummary(pageResults) {
  const issueCounts = {};
  let pagesWithIssues = 0;
  let totalIssues = 0;

  for (const page of pageResults) {
    if (page.issues.length) pagesWithIssues += 1;
    totalIssues += page.issues.length;
    for (const issue of page.issues) issueCounts[issue.id] = (issueCounts[issue.id] || 0) + 1;
  }

  return {
    pagesAudited: pageResults.length,
    pagesWithIssues,
    pagesWithoutIssues: pageResults.length - pagesWithIssues,
    totalIssues,
    averageScore: round(pageResults.reduce((sum, page) => sum + page.score, 0) / Math.max(1, pageResults.length)),
    pagesUsingSharedFoundationCss: pageResults.filter((page) => page.usesSharedFoundationCss).length,
    pagesUsingSharedNavbar: pageResults.filter((page) => page.usesSharedNavbar).length,
    issueCounts,
  };
}

function buildClusters(pageResults) {
  const clusters = new Map();
  for (const page of pageResults) {
    for (const issue of page.issues) {
      if (!clusters.has(issue.clusterKey)) {
        clusters.set(issue.clusterKey, {
          clusterKey: issue.clusterKey,
          issueId: issue.id,
          label: `${page.familyLabel}: ${ISSUE_DEFS[issue.id].label}`,
          family: page.family,
          familyLabel: page.familyLabel,
          pages: new Set(),
          totalScore: 0,
          issueCount: 0,
          evidence: [],
          fixCandidates: new Map(),
        });
      }

      const cluster = clusters.get(issue.clusterKey);
      cluster.pages.add(page.relPath);
      cluster.totalScore += issue.score;
      cluster.issueCount += 1;
      cluster.evidence.push(...issue.evidence.map((item) => ({ route: page.route, relPath: page.relPath, source: item.source, detail: item.detail })));
      for (const candidate of issue.fixCandidates) cluster.fixCandidates.set(candidate, (cluster.fixCandidates.get(candidate) || 0) + 1);
    }
  }

  return [...clusters.values()]
    .map((cluster) => ({
      clusterKey: cluster.clusterKey,
      issueId: cluster.issueId,
      label: cluster.label,
      family: cluster.family,
      familyLabel: cluster.familyLabel,
      affectedPages: cluster.pages.size,
      totalScore: cluster.totalScore,
      issueCount: cluster.issueCount,
      samplePages: [...cluster.pages].sort().slice(0, 5),
      sampleEvidence: cluster.evidence.slice(0, 4),
      fixCandidates: [...cluster.fixCandidates.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 4).map(([candidate, count]) => ({ candidate, count })),
    }))
    .sort((a, b) => b.totalScore - a.totalScore || b.affectedPages - a.affectedPages || a.label.localeCompare(b.label));
}

function buildSharedFixLevers(clusters) {
  const leverMap = new Map();
  for (const cluster of clusters) {
    for (const fixCandidate of cluster.fixCandidates) {
      if (!leverMap.has(fixCandidate.candidate)) leverMap.set(fixCandidate.candidate, { key: fixCandidate.candidate, affectedPages: 0, totalScore: 0, clusters: [] });
      const lever = leverMap.get(fixCandidate.candidate);
      lever.affectedPages += cluster.affectedPages;
      lever.totalScore += cluster.totalScore;
      lever.clusters.push(cluster.label);
    }
  }
  return [...leverMap.values()].sort((a, b) => b.affectedPages - a.affectedPages || b.totalScore - a.totalScore || a.key.localeCompare(b.key)).slice(0, 20);
}

function buildRecommendedOrder(clusters) {
  return clusters.slice(0, 10).map((cluster, index) => ({
    rank: index + 1,
    label: cluster.label,
    whyFirst: summarizePriorityReason(cluster),
    topFixCandidates: cluster.fixCandidates.map((candidate) => candidate.candidate),
  }));
}

function summarizePriorityReason(cluster) {
  const leverage = `${cluster.affectedPages} pages / ${cluster.totalScore} score`;
  if (cluster.fixCandidates.length && cluster.fixCandidates[0].count >= Math.max(3, Math.ceil(cluster.affectedPages * 0.3))) {
    return `${leverage}; strong shared lever through ${cluster.fixCandidates[0].candidate}.`;
  }
  return `${leverage}; repeated family pattern worth fixing before one-off pages.`;
}

function buildAssumptions() {
  return [
    'This is a static source audit. It does not execute runtime JS, evaluate computed styles, or emulate touch interactions in a browser.',
    'Minified assets are read when pages depend on them, but fix recommendations prefer non-minified siblings or shared source patterns when they are obvious.',
    'Control size, tap target, and collapse timing are heuristic scores based on selectors and declarations, not pixel-perfect layout measurements.',
    'Shadow DOM internals from shared web components are inferred from component source usage, not from rendered DOM snapshots.',
    'Runtime-generated tables, charts, and map canvases may still overflow on mobile even when the static source looks safe.',
  ];
}

function renderMarkdown(report) {
  const lines = [];
  lines.push('# Mobile Audit');
  lines.push('');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push('');
  lines.push('## Scope');
  lines.push('');
  lines.push(`- HTML pages audited: ${report.summary.pagesAudited}`);
  lines.push(`- Pages with issues: ${report.summary.pagesWithIssues}`);
  lines.push(`- Pages without issues: ${report.summary.pagesWithoutIssues}`);
  lines.push(`- Pages using shared CSS foundation: ${report.summary.pagesUsingSharedFoundationCss}`);
  lines.push(`- Pages using shared navbar: ${report.summary.pagesUsingSharedNavbar}`);
  lines.push('');
  lines.push('## Top 20 Highest-Leverage Issue Clusters');
  lines.push('');
  lines.push('| # | Cluster | Pages | Score | Shared levers | Sample pages |');
  lines.push('| --- | --- | ---: | ---: | --- | --- |');
  report.topIssueClusters.forEach((cluster, index) => {
    const levers = cluster.fixCandidates.map((item) => item.candidate).join('<br>');
    const samples = cluster.samplePages.slice(0, 3).map((item) => '`' + item + '`').join('<br>');
    lines.push(`| ${index + 1} | ${escapePipes(cluster.label)} | ${cluster.affectedPages} | ${cluster.totalScore} | ${escapePipes(levers || '-')} | ${escapePipes(samples || '-')} |`);
  });
  lines.push('');
  lines.push('## Top 30 Worst Files/Templates');
  lines.push('');
  lines.push('| # | Route | Score | Family | Issues |');
  lines.push('| --- | --- | ---: | --- | --- |');
  report.worstPages.forEach((page, index) => {
    const issues = page.issues.map((issue) => issue.shortLabel).join(', ');
    lines.push(`| ${index + 1} | ${escapePipes('`' + page.route + '`')} | ${page.score} | ${escapePipes(page.familyLabel)} | ${escapePipes(issues)} |`);
  });
  lines.push('');
  lines.push('## Shared Files Or Patterns That Fix The Most Pages');
  lines.push('');
  lines.push('| Lever | Pages | Score |');
  lines.push('| --- | ---: | ---: |');
  report.sharedFixLevers.slice(0, 12).forEach((lever) => {
    lines.push(`| ${escapePipes(lever.key)} | ${lever.affectedPages} | ${lever.totalScore} |`);
  });
  lines.push('');
  lines.push('## Recommended Next-Fix Order');
  lines.push('');
  report.recommendedNextFixOrder.forEach((item) => {
    lines.push(`${item.rank}. ${item.label}`);
    lines.push(`   ${item.whyFirst}`);
    if (item.topFixCandidates.length) lines.push(`   Primary levers: ${item.topFixCandidates.join(', ')}`);
  });
  lines.push('');
  lines.push('## Assumptions And Blind Spots');
  lines.push('');
  report.assumptions.forEach((item) => lines.push(`- ${item}`));
  return `${lines.join('\n')}\n`;
}

function collectFixCandidates(findings, fallbacks) {
  const candidates = findings.map((finding) => finding.source).concat(fallbacks);
  return [...new Set(candidates.filter(Boolean))];
}

function suggestSourcePath(sourcePath) {
  if (!sourcePath) return null;
  if (/#inline-/.test(sourcePath)) return sourcePath.split('#')[0];
  if (/\.min\.(css|js)$/i.test(sourcePath)) {
    const expanded = sourcePath.replace(/\.min(?=\.(css|js)$)/i, '');
    if (fs.existsSync(path.join(ROOT, expanded))) return expanded;
  }
  return sourcePath;
}

function dedupeEvidence(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.source}::${item.detail}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function round(value) {
  return Math.round(value * 10) / 10;
}

function truncate(value, length) {
  return value.length <= length ? value : `${value.slice(0, length - 1)}…`;
}

function trimSelector(selectorText) {
  return truncate(selectorText.replace(/\s+/g, ' ').trim(), 90);
}

function escapePipes(value) {
  return String(value || '').replace(/\|/g, '\\|');
}

function toPosix(filePath) {
  return filePath.replace(/\\/g, '/');
}

function decodeHtml(value) {
  return value.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}
