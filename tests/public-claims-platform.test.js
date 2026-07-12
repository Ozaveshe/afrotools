const assert = require('assert');
const fs = require('fs');
const path = require('path');

const claimsApi = require('../scripts/lib/public-claims');
const freshnessApi = require('../netlify/functions/api-data-freshness')._test;

const ROOT = path.resolve(__dirname, '..');
const TODAY = '2026-07-11';
const PUBLIC_LOCALES = ['en', 'fr', 'sw', 'yo', 'ha'];

const claims = claimsApi.loadClaimsRegistry();
const flows = claimsApi.loadDataFlows();

const validation = claimsApi.validateRegistries({ claims, flows, today: TODAY, root: ROOT });
assert.strictEqual(validation.ok, true, validation.errors.map(claimsApi.formatIssue).join('\n'));
assert.ok(claims.schemaVersion);
assert.ok(flows.schemaVersion);
assert.ok(claims.claims.length >= 15, 'the canonical registry must cover every required sensitive claim family');

const requiredClaimFields = [
  'key', 'category', 'approvedMeaning', 'detectionPatterns', 'permittedWording',
  'prohibitedAbsoluteWording', 'evidenceSources', 'evidenceOwner', 'lastVerifiedAt',
  'reviewAfter', 'applicableSurfaces', 'exceptions', 'dataFlowRefs', 'translations'
];
for (const claim of claims.claims) {
  for (const field of requiredClaimFields) assert.ok(Object.prototype.hasOwnProperty.call(claim, field), `${claim.key} missing ${field}`);
  for (const locale of PUBLIC_LOCALES) {
    assert.ok(claim.translations[locale], `${claim.key} missing ${locale} translations`);
    assert.deepStrictEqual(Object.keys(claim.translations[locale]).sort(), Object.keys(claim.permittedWording).sort(), `${claim.key}/${locale} variants differ`);
  }
}

const requiredFlowClasses = [
  'calculator', 'ai', 'account-sync', 'payment', 'analytics', 'document-local',
  'document-network', 'vault', 'form-email', 'server-lookup'
];
for (const featureClass of requiredFlowClasses) {
  assert.ok(flows.flows.some((flow) => flow.featureClass === featureClass), `missing ${featureClass} data flow`);
}

const duplicateClaims = JSON.parse(JSON.stringify(claims));
duplicateClaims.claims.push(JSON.parse(JSON.stringify(duplicateClaims.claims[0])));
let result = claimsApi.validateRegistries({ claims: duplicateClaims, flows, today: TODAY, root: ROOT });
assert.strictEqual(result.ok, false);
assert.ok(result.errors.some((error) => error.code === 'CLAIM_KEY_DUPLICATE'));

const expiredClaims = JSON.parse(JSON.stringify(claims));
expiredClaims.claims[0].reviewAfter = '2026-07-10';
result = claimsApi.validateRegistries({ claims: expiredClaims, flows, today: TODAY, root: ROOT });
assert.strictEqual(result.ok, false);
assert.ok(result.errors.some((error) => error.code === 'CLAIM_REVIEW_EXPIRED'));

const missingTranslation = JSON.parse(JSON.stringify(claims));
delete missingTranslation.claims[0].translations.ha;
result = claimsApi.validateRegistries({ claims: missingTranslation, flows, today: TODAY, root: ROOT });
assert.strictEqual(result.ok, false);
assert.ok(result.errors.some((error) => error.code === 'CLAIM_TRANSLATION_MISSING'));

result = claimsApi.scanContent({
  claims,
  flows,
  today: TODAY,
  files: [{ path: 'pricing/fixture.html', content: '<p>All calculations run in your browser.</p>' }]
});
assert.strictEqual(result.ok, false);
assert.ok(result.errors.some((error) => error.code === 'CLAIM_PROHIBITED_WORDING'));

result = claimsApi.scanContent({
  claims,
  flows,
  today: TODAY,
  files: [{ path: 'pricing/fixture.html', content: '<p>Guaranteed instant bank sync across every device.</p>' }]
});
assert.strictEqual(result.ok, false);
assert.ok(result.errors.some((error) => ['CLAIM_PROHIBITED_WORDING', 'CLAIM_UNREGISTERED'].includes(error.code)));

result = claimsApi.scanContent({
  claims,
  flows,
  today: TODAY,
  files: [{ path: 'pricing/fixture.html', content: '<script src="https://www.googletagmanager.com/gtag/js?id=example"></script>' }]
});
assert.strictEqual(result.ok, false);
assert.ok(result.errors.some((error) => error.code === 'CLAIM_ANALYTICS_WITHOUT_CONSENT'));

const strengthenedLocale = JSON.parse(JSON.stringify(claims));
const privacyClaim = strengthenedLocale.claims.find((claim) => claim.category === 'privacy');
privacyClaim.translations.fr[Object.keys(privacyClaim.permittedWording)[0]] = 'Toujours anonyme et jamais transmis.';
result = claimsApi.validateRegistries({ claims: strengthenedLocale, flows, today: TODAY, root: ROOT });
assert.strictEqual(result.ok, false);
assert.ok(result.errors.some((error) => error.code === 'CLAIM_TRANSLATION_PROHIBITED'));

const selectorClaim = claims.claims.find((claim) => claim.key === 'free.public-core');
assert.ok(selectorClaim, 'free.public-core claim is required');
const projected = claimsApi.projectClaimSelectorsInHtml(
  '<p data-claim-key="free.public-core" data-claim-variant="summary">old copy</p>',
  { locale: 'fr', claims }
);
assert.ok(projected.changed);
assert.ok(projected.html.includes(selectorClaim.translations.fr.summary));
assert.ok(!projected.html.includes('old copy'));

assert.strictEqual(claimsApi.freshnessState({ requestState: 'failed', timestamp: new Date().toISOString(), source: 'Example', maxLiveMinutes: 60 }, new Date()).state, 'unavailable');
assert.strictEqual(claimsApi.freshnessState({ requestState: 'ok', timestamp: null, source: 'Example', maxLiveMinutes: 60 }, new Date()).state, 'unavailable');
assert.strictEqual(claimsApi.freshnessState({ requestState: 'ok', timestamp: new Date().toISOString(), source: '', maxLiveMinutes: 60 }, new Date()).state, 'unavailable');
assert.strictEqual(claimsApi.freshnessState({ requestState: 'static', timestamp: new Date().toISOString(), source: 'Static fixture', maxLiveMinutes: 60 }, new Date()).state, 'static');
assert.strictEqual(claimsApi.freshnessState({ requestState: 'ok', timestamp: '2026-07-11T00:00:00Z', source: 'Example', maxLiveMinutes: 60 }, new Date('2026-07-11T00:30:00Z')).state, 'live');
assert.notStrictEqual(claimsApi.freshnessState({ requestState: 'ok', timestamp: '2026-07-10T00:00:00Z', source: 'Example', maxLiveMinutes: 60 }, new Date('2026-07-11T00:30:00Z')).state, 'live');

const freshnessThresholds = { live: 60, ok: 120, stale: 240 };
const freshnessNow = new Date('2026-07-11T12:00:00Z').getTime();
assert.strictEqual(freshnessApi.claimSafeStatus(null, 'Example', 'live', freshnessThresholds, freshnessNow), 'offline');
assert.strictEqual(freshnessApi.claimSafeStatus('2026-07-11T11:30:00Z', '', 'live', freshnessThresholds, freshnessNow), 'offline');
assert.strictEqual(freshnessApi.claimSafeStatus('2026-07-11T11:30:00Z', 'Example', 'live', freshnessThresholds, freshnessNow), 'live');
assert.strictEqual(freshnessApi.claimSafeStatus('2026-07-11T11:30:00Z', 'Example', 'stale', freshnessThresholds, freshnessNow), 'stale');
assert.strictEqual(freshnessApi.claimSafeStatus('2026-07-11T00:00:00Z', 'Example', 'live', freshnessThresholds, freshnessNow), 'offline');

const repositoryResult = claimsApi.buildRepository({ root: ROOT, write: false, today: TODAY });
assert.strictEqual(repositoryResult.ok, true, repositoryResult.errors.map(claimsApi.formatIssue).join('\n'));
assert.ok(repositoryResult.scannedFiles > 9000);
assert.ok(repositoryResult.rawHits > 0);
assert.ok(repositoryResult.approvedHits > 0);
assert.ok(repositoryResult.report.summary);

const highRiskFiles = [
  'index.html', 'about/index.html', 'privacy/index.html', 'pricing/index.html',
  'dashboard/index.html', 'fr/index.html', 'sw/index.html', 'yo/index.html', 'ha/index.html'
];
const prohibitedHighRisk = [
  /all free tools remain free forever/i,
  /all calculations run in your browser/i,
  /medical reports are processed with end-to-end encryption and never stored/i,
  /unlimited cloud(?:-synced)? (?:calculation )?history/i,
  /tax law email alerts/i,
  /cancel anytime from your dashboard with one click/i,
  /live market snapshot/i,
  /powered by Claude/i,
  /upgrade to Pro[^<\n]*unlimited AI/i,
  /every tool is free/i,
  /no personal data is ever transmitted/i,
  /updated within days/i,
  /googletagmanager\.com\/gtag\/js/i
];
for (const relative of highRiskFiles) {
  const content = fs.readFileSync(path.join(ROOT, relative), 'utf8');
  for (const pattern of prohibitedHighRisk) assert.ok(!pattern.test(content), `${relative} contains prohibited claim ${pattern}`);
}

const dataFlowKeys = new Set(flows.flows.map((flow) => flow.key));
for (const claim of claims.claims) for (const ref of claim.dataFlowRefs) assert.ok(dataFlowKeys.has(ref), `${claim.key} references unknown flow ${ref}`);

claimsApi.buildRepository({ root: ROOT, write: false, today: TODAY });

console.log('Public claims and feature data-flow contract tests passed');
