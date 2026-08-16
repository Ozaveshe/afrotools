'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const generator=require('../scripts/build-remittance-quote-parity.js');
const {normalizeReleaseOwnedHtml}=require('../scripts/lib/release-owned-html-normalizer');
const ROOT=path.resolve(__dirname,'..');
const app=generator.APPS.find((row)=>row.id==='remittance-v2');
const routePath=path.join(ROOT,'fr','tools','transfert-v2','index.html');
const html=fs.readFileSync(routePath,'utf8');

assert.strictEqual(normalizeReleaseOwnedHtml(html,{stripReleaseMetadata:true}),normalizeReleaseOwnedHtml(generator.frenchPage(app),{stripReleaseMetadata:true}),'French remittance-v2 alias output must be generator-current');
// Release builds may prepend owned attributes such as data-chat-bundle to <html>.
assert.match(html,/<html\b(?=[^>]*\blang="fr")[^>]*>/i);
assert.match(html,/data-remittance-parity data-locale="fr" data-tool="remittance-v2"/);
assert.match(html,/\/engines\/remittance-quote-comparator-engine\.js/);
assert.match(html,/\/assets\/js\/pages\/remittance-quote-parity\.js/);
assert.match(html,/\/assets\/js\/pages\/fr-remittance-v2-a11y\.js/);
assert.match(html,/name="robots" content="noindex, follow"/);
assert.match(html,/rel="canonical" href="https:\/\/afrotools\.com\/fr\/tools\/transfert-argent\/"/);
assert.match(html,/property="og:url" content="https:\/\/afrotools\.com\/fr\/tools\/transfert-argent\/"/);
assert.doesNotMatch(html,/rel="alternate"[^>]*hreflang=/);
assert.match(html,/assets\/img\/tools\/remittance-v2\.webp/);
assert.doesNotMatch(html,/Wise|Remitly|Western Union|PROVIDERS|marge FX|taux live/i);
assert.doesNotMatch(html,/localStorage|fetch\(|XMLHttpRequest|\.netlify\/functions/i);
console.log('fr-remittance-v2-parity: ok');
