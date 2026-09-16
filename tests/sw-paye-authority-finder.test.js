'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { build, route } = require('../scripts/build-sw-paye-authority-finder');
const engine = require('../assets/js/engines/paye-authority-router-engine');
const data = require('../data/salary-tax/authority-router.json');
const html = build();
assert.equal(engine.resolve(data.authorities, {query:'MRA'}).status, 'ambiguous');
assert.equal(engine.resolve(data.authorities, {query:'LRA'}).status, 'ambiguous');
assert.equal(engine.resolve(data.authorities, {query:'MRA',countryCode:'MW'}).match.currency, 'MWK');
assert.equal(engine.resolve(data.authorities, {query:'MRA',countryCode:'UG'}).status, 'unsupported');
assert.match(html, /<html lang="sw">/);
assert.ok(html.includes(`rel="canonical" href="https://afrotools.com${route}"`));
assert.match(html, /hreflang="en"/);
assert.match(html, /hreflang="fr"/);
assert.match(html, /hreflang="sw"/);
assert.match(html, /role="status" aria-live="polite"/);
assert.ok(!html.includes('og-default.png'));
const code = fs.readFileSync(require.resolve('../assets/js/pages/paye-authority-finder.js'), 'utf8');
assert.ok(!code.includes("authority_acronym: id('authority-query').value"), 'Raw query must not enter analytics');
console.log('Swahili PAYE finder matching and source contract passed.');

// A fresh owner run must already carry provenance before route metadata moves
// canonical/alternate links to the end of the head. Otherwise the later
// provenance pass changes their order on the following full build.
const { stableId } = require('../scripts/lib/content-integrity');
const provenance = require('../scripts/apply-generated-content-provenance');
const { replaceHeadLinks } = require('../scripts/lib/route-contract');
const { normalizeReleaseOwnedHtml } = require('../scripts/lib/release-owned-html-normalizer');
const peers = {en:'/tools/paye-authority-finder/',fr:'/fr/tools/trouver-administration-paye/',sw:route,'x-default':'/tools/paye-authority-finder/'};
const contentId = stableId(route);
assert.equal(contentId, 'content:72451bbd4dd34d69');
assert.equal((html.match(/name="afrotools-content-id"/g)||[]).length,1);
assert.ok(html.includes(`content="${contentId}"`));
function release(source) {
 const routed = replaceHeadLinks(source, route, peers);
 return provenance.hasMeta(routed,'afrotools-content-id') ? routed : provenance.insertContentId(routed,contentId);
}
const first=release(build());
assert.equal(release(first),first,'repeat route/provenance pass must not move metadata');
assert.equal(release(build()),first,'a repeated owner build must reproduce the released head');
assert.equal(normalizeReleaseOwnedHtml(first),normalizeReleaseOwnedHtml(html));
assert.notEqual(normalizeReleaseOwnedHtml(html.replace(contentId,'content:wrong')),normalizeReleaseOwnedHtml(html),'owner comparison must protect content identity');
assert.notEqual(normalizeReleaseOwnedHtml(html.replace('id="authority-query"','id="broken-query"')),normalizeReleaseOwnedHtml(html),'owner comparison must protect form controls');
const current=fs.readFileSync(require('node:path').join(__dirname,'..',route,'index.html'),'utf8');
assert.equal(release(current),current,'committed built finder must already satisfy route/provenance order');
assert.equal(normalizeReleaseOwnedHtml(current),normalizeReleaseOwnedHtml(html),'release decorations must preserve all owner metadata and content');
