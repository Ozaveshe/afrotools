const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const registryApi = require('../scripts/lib/canonical-registry');
const toolDirectory = require('../data/tool-directory.json');

function read(relative) {
  return fs.readFileSync(path.join(ROOT, relative), 'utf8');
}

function anchorCount(html) {
  return (html.match(/<a\b[^>]*\bhref=["'][^"']+["']/gi) || []).length;
}

const canonical = registryApi.buildCanonicalRegistry();
const validation = registryApi.validateCanonicalRegistry(canonical);
assert.strictEqual(validation.ok, true, validation.errors.map(registryApi.formatIssue).join('\n'));

const managed = [
  ['widgets/index.html', 8],
  ['widgets/demo/index.html', 12],
  ['categories/index.html', 32],
  ['developer-tools/index.html', 8],
  ['tools/index.html', 100],
  ['all-tools/index.html', 24],
  ['fr/widgets/index.html', 8],
  ['fr/widgets/demo/index.html', 6],
  ['fr/categories/index.html', 12],
  ['fr/developer-tools/index.html', 8],
  ['fr/all-tools/index.html', 24]
];

managed.forEach(([file, minimumLinks]) => {
  const html = read(file);
  assert.ok(html.includes('data-progressive-directory'), `${file} must opt into the progressive-directory contract`);
  assert.ok(html.includes('data-directory-status'), `${file} must include an accessible directory status region`);
  assert.ok(anchorCount(html) >= minimumLinks, `${file} needs at least ${minimumLinks} useful initial links`);
  assert.ok(!/>\s*--\s*</.test(html), `${file} must not ship unresolved -- placeholders`);
  assert.ok(/<link\b[^>]*rel=["']canonical["'][^>]*>/i.test(html), `${file} requires a canonical URL`);
});

[
  ['sw/zana-zote/index.html', 20],
  ['sw/zana-za-developer/index.html', 8],
  ['ha/kayan-aiki/index.html', 20],
  ['yo/awon-ise/index.html', 8]
].forEach(([file, minimumLinks]) => {
  const html = read(file);
  assert.ok(anchorCount(html) >= minimumLinks, `${file} must remain useful without JavaScript`);
  assert.ok(!/>\s*--\s*</.test(html), `${file} must not ship unresolved -- placeholders`);
});

const selectorExpectations = [
  ['widgets/index.html', 'widgets.published'],
  ['widgets/demo/index.html', 'widgets.published'],
  ['categories/index.html', 'categories.published'],
  ['developer-tools/index.html', 'tools.category.developer.published'],
  ['all-tools/index.html', 'tools.live_experiences'],
  ['fr/categories/index.html', 'tools.locale.fr.published'],
  ['fr/all-tools/index.html', 'tools.locale.fr.published']
];

selectorExpectations.forEach(([file, selectorId]) => {
  const selector = registryApi.getSelector(canonical, selectorId);
  assert.ok(selector, `missing canonical selector ${selectorId}`);
  const html = read(file);
  const escaped = selectorId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  assert.ok(new RegExp(`data-registry-count=["']${escaped}["'][^>]*>${selector.value}<`).test(html), `${file} must render canonical ${selectorId}=${selector.value}`);
});

const frenchDeveloperCount = canonical.tools.filter((tool) => tool.publicationStatus === 'published' && !tool.deprecated && tool.categoryId === 'developer' && tool.localeCoverage.includes('fr') && tool.route.startsWith('/fr/')).length;
const frenchDeveloperHtml = read('fr/developer-tools/index.html');
assert.ok(new RegExp(`data-directory-count="tools\\.locale\\.fr\\.category\\.developer\\.published"[^>]*>${frenchDeveloperCount}<`).test(frenchDeveloperHtml), `fr/developer-tools/index.html must render ${frenchDeveloperCount} published French developer records`);

const generator = require('../scripts/build-progressive-directories');
const check = generator.run({ write: false });
assert.deepStrictEqual(check.stale, [], `progressive directory output is stale:\n${check.stale.join('\n')}`);

const englishDirectoryRows = toolDirectory.filter((tool) => tool && tool.language === 'en' && String(tool.status).toLowerCase() === 'live');
const allToolsHtml = read('all-tools/index.html');
const staticDirectoryMatch = allToolsHtml.match(/<!-- PROGRESSIVE_DIRECTORY_FALLBACK_START -->([\s\S]*?)<!-- PROGRESSIVE_DIRECTORY_FALLBACK_END -->/);
assert.ok(staticDirectoryMatch, 'all-tools/index.html must contain the generated static directory block');
assert.strictEqual(anchorCount(staticDirectoryMatch[1]), englishDirectoryRows.length, 'all-tools/index.html must expose every live English directory row without JavaScript');
assert.strictEqual((staticDirectoryMatch[1].match(/data-static-tool-category=/g) || []).length, new Set(englishDirectoryRows.map((tool) => tool.category_key || 'other')).size, 'all-tools/index.html must group the complete directory by category');

englishDirectoryRows.forEach((tool) => {
  const relative = tool.url.endsWith('/')
    ? `${tool.url.replace(/^\//, '')}index.html`
    : `${tool.url.replace(/^\//, '')}.html`;
  const html = read(relative);
  const blocks = html.match(/data-related-tools-ssr/g) || [];
  const block = html.match(/<!-- RELATED_TOOLS_SSR_START -->([\s\S]*?)<!-- RELATED_TOOLS_SSR_END -->/);
  assert.strictEqual(blocks.length, 1, `${relative} must contain one static related-tools block`);
  assert.ok(block, `${relative} must contain the related-tools build markers`);
  const links = block[1].match(/data-related-tool(?:\s|>)/g) || [];
  assert.ok(links.length >= 4 && links.length <= 6, `${relative} must expose 4-6 related links without JavaScript`);
  assert.ok(!/related-tools-data(?:\.min)?\.js/i.test(html), `${relative} must not load the full related-tools dataset after SSR injection`);
});

console.log('Progressive directory static contract tests passed');
