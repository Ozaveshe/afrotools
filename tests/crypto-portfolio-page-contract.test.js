const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const en = fs.readFileSync(path.join(root, 'crypto/portfolio/index.html'), 'utf8');
const fr = fs.readFileSync(path.join(root, 'fr/crypto/portfolio/index.html'), 'utf8');
const page = fs.readFileSync(path.join(root, 'assets/js/pages/crypto-portfolio.js'), 'utf8');
const netlify = fs.readFileSync(path.join(root, 'netlify.toml'), 'utf8');
const redirects = fs.readFileSync(path.join(root, '_redirects'), 'utf8');

for (const [html, locale, canonical] of [
  [en, 'en', 'https://afrotools.com/crypto/portfolio/'],
  [fr, 'fr', 'https://afrotools.com/fr/crypto/portfolio/'],
]) {
  assert.match(html, new RegExp(`<html\\b[^>]*\\blang="${locale}"`));
  assert.match(html, new RegExp(`<link rel="canonical" href="${canonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
  assert.match(html, /data-crypto-portfolio/);
  assert.match(html, /crypto-portfolio-lots\.js/);
  assert.match(html, /crypto-portfolio\.js/);
  assert.match(html, /jspdf\.umd\.min\.js/);
  assert.match(html, /hreflang="en"/);
  assert.match(html, /hreflang="fr"/);
  assert.doesNotMatch(html, /<iframe|afro-auth|chart\.js|crypto-data\.js/i);
}
assert.doesNotMatch(fr, /traduction à venir|Contenu disponible en anglais/i);
assert.match(page, /\/api\/crypto\/prices\?currency=/);
assert.doesNotMatch(page, /api\/crypto-portfolio|api\/crypto-advisor|api\.coingecko|tether|AfroAuth|innerHTML/);
assert.match(netlify, /from = "\/api\/crypto\/prices"[\s\S]*?to = "\/\.netlify\/functions\/crypto-prices"/);
assert.match(redirects, /\/api\/crypto-portfolio\s+\/\.netlify\/functions\/crypto-portfolio\s+200/);
assert.match(redirects, /\/api\/crypto-advisor\s+\/\.netlify\/functions\/crypto-portfolio-advisor\s+200/);

console.log('crypto-portfolio-page-contract: ok');
