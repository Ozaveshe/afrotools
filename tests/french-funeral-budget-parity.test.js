'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { page, build } = require('../scripts/build-french-funeral-budget-parity.js');
const { normalizeReleaseOwnedHtml } = require('../scripts/lib/release-owned-html-normalizer');

const root = path.resolve(__dirname, '..');
const routeFile = path.join(root, 'fr', 'tools', 'cout-funerailles', 'index.html');
const html = fs.readFileSync(routeFile, 'utf8');

assert.equal(normalizeReleaseOwnedHtml(html, { stripReleaseMetadata: true }), normalizeReleaseOwnedHtml(page(), { stripReleaseMetadata: true }), 'French funeral route must be generated from its narrow source owner');
assert.deepEqual(build(), [], 'French funeral generator must be current');
const htmlTag = html.match(/<html\b[^>]*>/i)?.[0] || '';
assert.match(htmlTag, /\blang="fr"(?:\s|>)/i, 'French funeral route must declare lang="fr" regardless of release-owned HTML attributes');
assert.match(html, /data-funeral-budget-fr/);
assert.match(html, /assets\/js\/engines\/funeral-budget-engine\.js/);
assert.match(html, /assets\/js\/pages\/fr-funeral-budget-parity\.js/);
assert.match(html, /hreflang="en" href="https:\/\/afrotools\.com\/tools\/burial-cost\/"/);
assert.match(html, /hreflang="fr" href="https:\/\/afrotools\.com\/fr\/tools\/cout-funerailles\/"/);
assert.match(html, /hreflang="sw" href="https:\/\/afrotools\.com\/sw\/zana\/gharama-za-mazishi\/"/);
assert.match(html, /assets\/img\/tools\/burial-cost\.webp/g);
assert.match(html, /Télécharger JSON/);
assert.match(html, /Télécharger TXT/);
assert.match(html, /Rouvrir JSON/);
assert.doesNotMatch(html, /data-burial-item|country-and-ceremony-costs|localStorage|sessionStorage|fetch\s*\(/i);
assert.doesNotMatch(html, /<iframe/i);

const controller = fs.readFileSync(path.join(root, 'assets', 'js', 'pages', 'fr-funeral-budget-parity.js'), 'utf8');
assert.match(controller, /window\.FuneralBudgetEngine\.calculate\(currentInput\(\)\)/);
assert.doesNotMatch(controller, /fetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage/);

console.log('french-funeral-budget-parity: ok');
