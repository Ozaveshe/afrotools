const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function sitemapUrls(xml) {
  return new Set([...xml.matchAll(/<loc>(https:\/\/afrotools\.com[^<]+)<\/loc>/g)].map((match) => match[1]));
}

test('every public French widget parent is discoverable in the French sitemap', () => {
  const widgetRoot = path.join(ROOT, 'fr', 'widgets');
  const publicParents = fs.readdirSync(widgetRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'iframe')
    .map((entry) => path.join(widgetRoot, entry.name, 'index.html'))
    .filter((filePath) => fs.existsSync(filePath))
    .filter((filePath) => !/<meta\s+name=["']robots["'][^>]*noindex/i.test(fs.readFileSync(filePath, 'utf8')))
    .map((filePath) => `https://afrotools.com/fr/widgets/${path.basename(path.dirname(filePath))}/`);

  const urls = sitemapUrls(read('sitemap-fr.xml'));
  assert.ok(publicParents.length > 100, `expected the generated French widget catalog, found ${publicParents.length} public parents`);
  for (const url of publicParents) {
    assert.ok(urls.has(url), `${url} must be present in sitemap-fr.xml`);
  }
});

test('French iframe utilities remain outside every sitemap', () => {
  const sitemapIndex = read('sitemap-index.xml');
  const sitemapFiles = [...sitemapIndex.matchAll(/<loc>https:\/\/afrotools\.com\/([^<]+\.xml)<\/loc>/g)]
    .map((match) => match[1])
    .filter((relativePath) => fs.existsSync(path.join(ROOT, relativePath)));
  const allUrls = new Set(sitemapFiles.flatMap((relativePath) => [...sitemapUrls(read(relativePath))]));

  for (const url of allUrls) {
    assert.ok(!url.includes('/fr/widgets/iframe/'), `${url} is a technical iframe utility and must not be indexed`);
  }
});
